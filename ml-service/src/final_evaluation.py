import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedKFold,
    cross_val_predict,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.config import (
    CATEGORICAL_FEATURES,
    FEATURE_COLUMNS,
    NUMERIC_FEATURES,
    RANDOM_STATE,
    TARGET_COLUMN,
    TEST_SIZE,
)


DATA_PATH = "data/WA_Fn-UseC_-HR-Employee-Attrition.csv"

# For an HR early-warning system we want to catch a meaningful
# proportion of employees who may leave.
MINIMUM_RECALL = 0.60


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
        raise ValueError(
            "Attrition contains values other than Yes/No."
        )

    return X, y.astype(int)


def create_pipeline():
    numeric_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median"),
            ),
            (
                "scaler",
                StandardScaler(),
            ),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="most_frequent"),
            ),
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
            (
                "numeric",
                numeric_pipeline,
                NUMERIC_FEATURES,
            ),
            (
                "categorical",
                categorical_pipeline,
                CATEGORICAL_FEATURES,
            ),
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


def tune_hyperparameters(X_train, y_train, cv):
    pipeline = create_pipeline()

    parameter_grid = {
        "classifier__C": [
            0.01,
            0.05,
            0.1,
            0.25,
            0.5,
            1.0,
            2.0,
            5.0,
        ],
        "classifier__solver": [
            "lbfgs",
            "liblinear",
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

    search.fit(
        X_train,
        y_train,
    )

    return search


def select_threshold(
    best_model,
    X_train,
    y_train,
    cv,
):
    # Out-of-fold probabilities:
    # each employee is predicted by a model that did not
    # train on that employee.
    probabilities = cross_val_predict(
        best_model,
        X_train,
        y_train,
        cv=cv,
        method="predict_proba",
        n_jobs=1,
    )[:, 1]

    thresholds = np.arange(
        0.20,
        0.81,
        0.01,
    )

    results = []

    for threshold in thresholds:
        predictions = (
            probabilities >= threshold
        ).astype(int)

        precision = precision_score(
            y_train,
            predictions,
            zero_division=0,
        )

        recall = recall_score(
            y_train,
            predictions,
            zero_division=0,
        )

        f1 = f1_score(
            y_train,
            predictions,
            zero_division=0,
        )

        results.append(
            {
                "threshold": threshold,
                "precision": precision,
                "recall": recall,
                "f1": f1,
            }
        )

    results_df = pd.DataFrame(results)

    # Business-aware threshold:
    # require at least 60% recall and then maximize precision.
    eligible = results_df[
        results_df["recall"] >= MINIMUM_RECALL
    ]

    if not eligible.empty:
        best_row = eligible.sort_values(
            by=["precision", "f1"],
            ascending=False,
        ).iloc[0]
    else:
        # Safety fallback if no threshold achieves target recall.
        best_row = results_df.loc[
            results_df["f1"].idxmax()
        ]

    return (
        float(best_row["threshold"]),
        best_row,
    )


def evaluate_test_set(
    model,
    X_test,
    y_test,
    threshold,
):
    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    predictions = (
        probabilities >= threshold
    ).astype(int)

    metrics = {
        "accuracy": accuracy_score(
            y_test,
            predictions,
        ),
        "precision": precision_score(
            y_test,
            predictions,
            zero_division=0,
        ),
        "recall": recall_score(
            y_test,
            predictions,
            zero_division=0,
        ),
        "f1": f1_score(
            y_test,
            predictions,
            zero_division=0,
        ),
        "roc_auc": roc_auc_score(
            y_test,
            probabilities,
        ),
        "pr_auc": average_precision_score(
            y_test,
            probabilities,
        ),
    }

    return (
        metrics,
        predictions,
    )


def main():
    X, y = load_data()

    # ------------------------------------------
    # STEP 1: Lock away final test data
    # ------------------------------------------

    (
        X_development,
        X_test,
        y_development,
        y_test,
    ) = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    print("\n========== DATA SPLIT ==========")

    print(f"Total employees: {len(X)}")
    print(
        f"Development employees: "
        f"{len(X_development)}"
    )
    print(
        f"Final test employees: "
        f"{len(X_test)}"
    )

    print(
        f"Development attrition rate: "
        f"{y_development.mean():.2%}"
    )

    print(
        f"Test attrition rate: "
        f"{y_test.mean():.2%}"
    )

    # ------------------------------------------
    # STEP 2: CV only on development data
    # ------------------------------------------

    cv = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=RANDOM_STATE,
    )

    print(
        "\nTuning hyperparameters using "
        "development data only..."
    )

    search = tune_hyperparameters(
        X_development,
        y_development,
        cv,
    )

    print(
        "\n========== HYPERPARAMETER SELECTION =========="
    )

    print(
        f"Best parameters: "
        f"{search.best_params_}"
    )

    print(
        f"Development CV ROC-AUC: "
        f"{search.best_score_:.4f}"
    )

    # ------------------------------------------
    # STEP 3: Threshold selection
    # ------------------------------------------

    print(
        "\nSelecting decision threshold using "
        "development data only..."
    )

    (
        threshold,
        threshold_metrics,
    ) = select_threshold(
        search.best_estimator_,
        X_development,
        y_development,
        cv,
    )

    print(
        "\n========== LOCKED CONFIGURATION =========="
    )

    print(
        f"C: "
        f"{search.best_params_['classifier__C']}"
    )

    print(
        f"Solver: "
        f"{search.best_params_['classifier__solver']}"
    )

    print(
        f"Decision threshold: "
        f"{threshold:.2f}"
    )

    print(
        f"Minimum target recall: "
        f"{MINIMUM_RECALL:.2f}"
    )

    print("\nDevelopment threshold metrics:")

    print(
        f"Precision: "
        f"{threshold_metrics['precision']:.4f}"
    )

    print(
        f"Recall: "
        f"{threshold_metrics['recall']:.4f}"
    )

    print(
        f"F1: "
        f"{threshold_metrics['f1']:.4f}"
    )

    # ------------------------------------------
    # STEP 4: Train locked model
    # ------------------------------------------

    final_model = search.best_estimator_

    # GridSearchCV already refitted the winning model on the
    # complete development dataset.

    # ------------------------------------------
    # STEP 5: Touch final test set ONCE
    # ------------------------------------------

    print(
        "\nEvaluating locked model on final test set..."
    )

    (
        metrics,
        predictions,
    ) = evaluate_test_set(
        final_model,
        X_test,
        y_test,
        threshold,
    )

    print(
        "\n========== FINAL HELD-OUT TEST RESULTS =========="
    )

    for name, value in metrics.items():
        print(
            f"{name}: "
            f"{value:.4f}"
        )

    print("\nConfusion Matrix:")

    print(
        confusion_matrix(
            y_test,
            predictions,
        )
    )

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            predictions,
            target_names=[
                "Stayed",
                "Attrition",
            ],
            zero_division=0,
        )
    )


if __name__ == "__main__":
    main()