import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    HistGradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_validate
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


def create_preprocessor():
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
                    sparse_output=False,
                ),
            ),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, NUMERIC_FEATURES),
            ("categorical", categorical_pipeline, CATEGORICAL_FEATURES),
        ]
    )


def create_models():
    return {
        "Logistic Regression": LogisticRegression(
            max_iter=2000,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),

        "Random Forest": RandomForestClassifier(
            n_estimators=500,
            max_depth=None,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=1,
        ),

        "HistGradientBoosting": HistGradientBoostingClassifier(
            learning_rate=0.05,
            max_iter=300,
            max_leaf_nodes=15,
            l2_regularization=1.0,
            random_state=RANDOM_STATE,
        ),
    }


def evaluate_models(X, y):
    cross_validation = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=RANDOM_STATE,
    )

    scoring = {
        "accuracy": "accuracy",
        "precision": "precision",
        "recall": "recall",
        "f1": "f1",
        "roc_auc": "roc_auc",
        "pr_auc": "average_precision",
    }

    results = []

    for name, classifier in create_models().items():
        print(f"\nEvaluating {name}...")

        pipeline = Pipeline(
            steps=[
                ("preprocessor", create_preprocessor()),
                ("classifier", classifier),
            ]
        )

        scores = cross_validate(
            pipeline,
            X,
            y,
            cv=cross_validation,
            scoring=scoring,
            n_jobs=1,
        )

        result = {
            "Model": name,
            "Accuracy": scores["test_accuracy"].mean(),
            "Precision": scores["test_precision"].mean(),
            "Recall": scores["test_recall"].mean(),
            "F1": scores["test_f1"].mean(),
            "ROC-AUC": scores["test_roc_auc"].mean(),
            "PR-AUC": scores["test_pr_auc"].mean(),
        }

        results.append(result)

    return pd.DataFrame(results)


def main():
    X, y = load_data()

    print(f"Employees: {len(X)}")
    print(f"Features: {len(FEATURE_COLUMNS)}")
    print(f"Attrition rate: {y.mean():.2%}")

    results = evaluate_models(X, y)

    results = results.sort_values(
        by=["ROC-AUC", "PR-AUC"],
        ascending=False,
    )

    print("\n========== MODEL COMPARISON ==========\n")

    print(
        results.to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}",
        )
    )

    print(
        "\nBest model by cross-validated ROC-AUC:",
        results.iloc[0]["Model"],
    )


if __name__ == "__main__":
    main()