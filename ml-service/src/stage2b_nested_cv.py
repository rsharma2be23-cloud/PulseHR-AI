import os

os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import numpy as np
import pandas as pd

from sklearn.base import clone
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    f1_score,
    fbeta_score,
    matthews_corrcoef,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    GridSearchCV,
    RepeatedStratifiedKFold,
    StratifiedKFold,
    cross_val_predict,
)
from sklearn.pipeline import Pipeline

from src.preprocessing import build_preprocessing_pipeline


DATA_PATH = "data/WA_Fn-UseC_-HR-Employee-Attrition.csv"
OUTPUT_PATH = "outputs/stage2b_nested_results.csv"

OUTER_SPLITS = 5
OUTER_REPEATS = 5
INNER_SPLITS = 3

OUTER_RANDOM_STATE = 123
INNER_RANDOM_STATE = 42


def load_data():
    df = pd.read_csv(DATA_PATH)

    y = df["Attrition"].map({
        "No": 0,
        "Yes": 1,
    })

    X = df.drop(columns=["Attrition"])

    return X, y


def build_pipeline(engineered, c_value=1.0):
    preprocessor = build_preprocessing_pipeline(
        model_family="linear",
        include_engineered_features=engineered,
    )

    model = LogisticRegression(
        C=c_value,
        solver="lbfgs",
        max_iter=3000,
        class_weight="balanced",
        random_state=42,
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )


def select_threshold(y_true, probabilities):
    thresholds = np.arange(0.10, 0.901, 0.01)

    best_threshold = 0.50
    best_f2 = -1.0

    for threshold in thresholds:
        predictions = (
            probabilities >= threshold
        ).astype(int)

        score = fbeta_score(
            y_true,
            predictions,
            beta=2,
            zero_division=0,
        )

        if score > best_f2:
            best_f2 = score
            best_threshold = threshold

    return float(best_threshold), float(best_f2)


def calculate_metrics(
    y_true,
    probabilities,
    threshold,
):
    predictions = (
        probabilities >= threshold
    ).astype(int)

    return {
        "pr_auc": average_precision_score(
            y_true,
            probabilities,
        ),
        "roc_auc": roc_auc_score(
            y_true,
            probabilities,
        ),
        "precision": precision_score(
            y_true,
            predictions,
            zero_division=0,
        ),
        "recall": recall_score(
            y_true,
            predictions,
            zero_division=0,
        ),
        "f1": f1_score(
            y_true,
            predictions,
            zero_division=0,
        ),
        "f2": fbeta_score(
            y_true,
            predictions,
            beta=2,
            zero_division=0,
        ),
        "balanced_accuracy": balanced_accuracy_score(
            y_true,
            predictions,
        ),
        "mcc": matthews_corrcoef(
            y_true,
            predictions,
        ),
        "brier": brier_score_loss(
            y_true,
            probabilities,
        ),
    }


def evaluate_candidate(
    candidate_name,
    engineered,
    X,
    y,
    outer_cv,
):
    rows = []

    for fold_number, (train_idx, test_idx) in enumerate(
        outer_cv.split(X, y),
        start=1,
    ):
        X_train = X.iloc[train_idx]
        X_test = X.iloc[test_idx]

        y_train = y.iloc[train_idx]
        y_test = y.iloc[test_idx]

        inner_cv = StratifiedKFold(
            n_splits=INNER_SPLITS,
            shuffle=True,
            random_state=INNER_RANDOM_STATE + fold_number,
        )

        pipeline = build_pipeline(
            engineered=engineered
        )

        parameter_grid = {
            "model__C": [
                0.01,
                0.03,
                0.05,
                0.1,
                0.25,
                0.5,
                1.0,
                2.0,
                5.0,
            ]
        }

        search = GridSearchCV(
            estimator=pipeline,
            param_grid=parameter_grid,
            scoring="average_precision",
            cv=inner_cv,
            n_jobs=1,
            refit=True,
            error_score="raise",
        )

        search.fit(
            X_train,
            y_train,
        )

        best_pipeline = search.best_estimator_

        threshold_pipeline = clone(
            best_pipeline
        )

        oof_probabilities = cross_val_predict(
            threshold_pipeline,
            X_train,
            y_train,
            cv=inner_cv,
            method="predict_proba",
            n_jobs=1,
        )[:, 1]

        threshold, training_f2 = select_threshold(
            y_train.to_numpy(),
            oof_probabilities,
        )

        test_probabilities = (
            best_pipeline
            .predict_proba(X_test)[:, 1]
        )

        metrics = calculate_metrics(
            y_test.to_numpy(),
            test_probabilities,
            threshold,
        )

        row = {
            "candidate": candidate_name,
            "fold": fold_number,
            "engineered": engineered,
            "best_C": search.best_params_[
                "model__C"
            ],
            "threshold": threshold,
            "inner_threshold_f2": training_f2,
            **metrics,
        }

        rows.append(row)

        print(
            f"{candidate_name} | "
            f"Fold {fold_number:02d}/"
            f"{OUTER_SPLITS * OUTER_REPEATS} | "
            f"C={row['best_C']} | "
            f"T={threshold:.2f} | "
            f"PR-AUC={metrics['pr_auc']:.4f} | "
            f"Recall={metrics['recall']:.4f} | "
            f"Precision={metrics['precision']:.4f} | "
            f"F2={metrics['f2']:.4f}"
        )

    return pd.DataFrame(rows)


def print_summary(results):
    metrics = [
        "pr_auc",
        "roc_auc",
        "precision",
        "recall",
        "f1",
        "f2",
        "balanced_accuracy",
        "mcc",
        "brier",
        "threshold",
    ]

    summary = (
        results
        .groupby("candidate")[metrics]
        .agg(["mean", "std"])
    )

    pd.set_option(
        "display.width",
        220,
    )

    pd.set_option(
        "display.max_columns",
        None,
    )

    print(
        "\n"
        "========== FINAL NESTED CV SUMMARY =========="
    )

    print(
        summary.to_string(
            float_format=lambda value: f"{value:.4f}"
        )
    )

    print(
        "\n========== PR-AUC RANKING =========="
    )

    ranking = (
        results
        .groupby("candidate")
        .agg(
            pr_auc_mean=("pr_auc", "mean"),
            pr_auc_std=("pr_auc", "std"),
            roc_auc_mean=("roc_auc", "mean"),
            recall_mean=("recall", "mean"),
            precision_mean=("precision", "mean"),
            f2_mean=("f2", "mean"),
            brier_mean=("brier", "mean"),
            threshold_mean=("threshold", "mean"),
            threshold_std=("threshold", "std"),
        )
        .sort_values(
            "pr_auc_mean",
            ascending=False,
        )
    )

    print(
        ranking.to_string(
            float_format=lambda value: f"{value:.4f}"
        )
    )


def main():
    print(
        "========== STAGE 2B: NESTED CV =========="
    )

    X, y = load_data()

    print(f"Employees: {len(X)}")
    print(f"Features: {X.shape[1]}")
    print(f"Attrition cases: {int(y.sum())}")
    print(f"Attrition rate: {y.mean():.2%}")

    outer_cv = RepeatedStratifiedKFold(
        n_splits=OUTER_SPLITS,
        n_repeats=OUTER_REPEATS,
        random_state=OUTER_RANDOM_STATE,
    )

    raw_results = evaluate_candidate(
        candidate_name="LogisticRegression__raw",
        engineered=False,
        X=X,
        y=y,
        outer_cv=outer_cv,
    )

    engineered_results = evaluate_candidate(
        candidate_name="LogisticRegression__engineered",
        engineered=True,
        X=X,
        y=y,
        outer_cv=outer_cv,
    )

    results = pd.concat(
        [
            raw_results,
            engineered_results,
        ],
        ignore_index=True,
    )

    os.makedirs(
        os.path.dirname(OUTPUT_PATH),
        exist_ok=True,
    )

    results.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    print_summary(results)

    print(
        f"\nPer-fold results saved to: "
        f"{OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()