import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedKFold,
    cross_val_predict,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.config import (
    CATEGORICAL_FEATURES,
    FEATURE_COLUMNS,
    NUMERIC_FEATURES,
    RANDOM_STATE,
    TARGET_COLUMN,
)


DATA_PATH = "data/WA_Fn-UseC_-HR-Employee-Attrition.csv"


def load_data():
    df = pd.read_csv(DATA_PATH)

    X = df[FEATURE_COLUMNS].copy()

    y = (
        df[TARGET_COLUMN]
        .astype(str)
        .str.strip()
        .str.lower()
        .map({"yes": 1, "no": 0})
    )

    if y.isna().any():
        raise ValueError("Invalid values found in Attrition column.")

    return X, y.astype(int)


def create_pipeline():
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                    drop="first",
                ),
            ),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, NUMERIC_FEATURES),
            ("categorical", categorical_pipeline, CATEGORICAL_FEATURES),
        ]
    )

    classifier = LogisticRegression(
        max_iter=3000,
        class_weight="balanced",
        random_state=RANDOM_STATE,
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )


def tune_hyperparameters(X, y, cv):
    pipeline = create_pipeline()

    parameter_grid = {
        "classifier__C": [
            0.001,
            0.01,
            0.05,
            0.1,
            0.25,
            0.5,
            1.0,
            2.0,
            5.0,
            10.0,
        ],
        "classifier__solver": [
            "liblinear",
            "lbfgs",
        ],
    }

    search = GridSearchCV(
        estimator=pipeline,
        param_grid=parameter_grid,
        scoring="roc_auc",
        cv=cv,
        n_jobs=1,
        refit=True,
    )

    search.fit(X, y)

    return search


def evaluate_thresholds(model, X, y, cv):
    probabilities = cross_val_predict(
        model,
        X,
        y,
        cv=cv,
        method="predict_proba",
        n_jobs=1,
    )[:, 1]

    thresholds = np.arange(0.20, 0.81, 0.02)

    results = []

    for threshold in thresholds:
        predictions = (probabilities >= threshold).astype(int)

        precision = precision_score(
            y,
            predictions,
            zero_division=0,
        )

        recall = recall_score(
            y,
            predictions,
            zero_division=0,
        )

        f1 = f1_score(
            y,
            predictions,
            zero_division=0,
        )

        results.append(
            {
                "Threshold": threshold,
                "Precision": precision,
                "Recall": recall,
                "F1": f1,
            }
        )

    results_df = pd.DataFrame(results)

    best_f1_row = results_df.loc[
        results_df["F1"].idxmax()
    ]

    roc_auc = roc_auc_score(y, probabilities)

    pr_auc = average_precision_score(
        y,
        probabilities,
    )

    return results_df, best_f1_row, roc_auc, pr_auc


def main():
    X, y = load_data()

    print(f"Employees: {len(X)}")
    print(f"Features: {len(FEATURE_COLUMNS)}")
    print(f"Attrition rate: {y.mean():.2%}")

    cv = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=RANDOM_STATE,
    )

    print("\nTuning Logistic Regression...")

    search = tune_hyperparameters(
        X,
        y,
        cv,
    )

    print("\n========== HYPERPARAMETER RESULTS ==========")

    print(f"\nBest parameters: {search.best_params_}")
    print(
        f"Best cross-validated ROC-AUC: "
        f"{search.best_score_:.4f}"
    )

    print("\nEvaluating probability thresholds...")

    (
        threshold_results,
        best_threshold,
        roc_auc,
        pr_auc,
    ) = evaluate_thresholds(
        search.best_estimator_,
        X,
        y,
        cv,
    )

    print("\n========== THRESHOLD COMPARISON ==========\n")

    print(
        threshold_results.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}",
        )
    )

    print("\n========== BEST THRESHOLD ==========")

    print(
        f"Threshold: {best_threshold['Threshold']:.2f}"
    )
    print(
        f"Precision: {best_threshold['Precision']:.4f}"
    )
    print(
        f"Recall: {best_threshold['Recall']:.4f}"
    )
    print(
        f"F1: {best_threshold['F1']:.4f}"
    )

    print("\n========== PROBABILITY METRICS ==========")

    print(f"ROC-AUC: {roc_auc:.4f}")
    print(f"PR-AUC: {pr_auc:.4f}")


if __name__ == "__main__":
    main()