import os

os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import warnings

import numpy as np
import pandas as pd

from sklearn.ensemble import (
    HistGradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import fbeta_score, make_scorer
from sklearn.model_selection import (
    RepeatedStratifiedKFold,
    cross_validate,
)
from sklearn.pipeline import Pipeline

from src.preprocessing import build_preprocessing_pipeline


warnings.filterwarnings("ignore", category=UserWarning)

DATA_PATH = "data/WA_Fn-UseC_-HR-Employee-Attrition.csv"

RANDOM_STATE = 42
N_SPLITS = 5
N_REPEATS = 3

OUTPUT_PATH = "outputs/stage2a_screening_results.csv"


def build_scoring():
    return {
        "pr_auc": "average_precision",
        "roc_auc": "roc_auc",
        "balanced_accuracy": "balanced_accuracy",
        "precision": "precision",
        "recall": "recall",
        "f1": "f1",
        "f2": make_scorer(
            fbeta_score,
            beta=2,
            zero_division=0,
        ),
        "mcc": "matthews_corrcoef",
        "brier": "neg_brier_score",
    }


def evaluate_candidate(
    name,
    model,
    mode,
    engineered,
    X,
    y,
    cv,
    scoring,
):
    preprocessor = build_preprocessing_pipeline(
        model_family=mode,
        include_engineered_features=engineered,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )

    print(f"\nRunning {name} ...")

    results = cross_validate(
        pipeline,
        X,
        y,
        cv=cv,
        scoring=scoring,
        n_jobs=1,
        error_score="raise",
    )

    row = {
        "candidate": name,
        "engineered": engineered,
    }

    for metric in scoring:
        scores = results[f"test_{metric}"]

        if metric == "brier":
            scores = -scores

        row[f"{metric}_mean"] = float(
            np.mean(scores)
        )

        row[f"{metric}_std"] = float(
            np.std(scores)
        )

    print(
        f"PR-AUC={row['pr_auc_mean']:.4f} | "
        f"ROC-AUC={row['roc_auc_mean']:.4f} | "
        f"Recall={row['recall_mean']:.4f} | "
        f"Precision={row['precision_mean']:.4f} | "
        f"F2={row['f2_mean']:.4f}"
    )

    return row


def main():
    print("========== STAGE 2A: MODEL SCREENING ==========")

    df = pd.read_csv(DATA_PATH)

    y = df["Attrition"].map({
        "No": 0,
        "Yes": 1,
    })

    X = df.drop(columns=["Attrition"])

    print(f"Employees: {len(X)}")
    print(f"Raw features: {X.shape[1]}")
    print(f"Attrition cases: {int(y.sum())}")
    print(f"Attrition rate: {y.mean():.2%}")

    cv = RepeatedStratifiedKFold(
        n_splits=N_SPLITS,
        n_repeats=N_REPEATS,
        random_state=RANDOM_STATE,
    )

    scoring = build_scoring()

    results = []

    for engineered in (False, True):

        tag = "engineered" if engineered else "raw"

        logistic = LogisticRegression(
            C=1.0,
            solver="lbfgs",
            max_iter=3000,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        )

        results.append(
            evaluate_candidate(
                name=f"LogisticRegression__{tag}",
                model=logistic,
                mode="linear",
                engineered=engineered,
                X=X,
                y=y,
                cv=cv,
                scoring=scoring,
            )
        )

        random_forest_ordinal = RandomForestClassifier(
            n_estimators=300,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=1,
        )

        results.append(
            evaluate_candidate(
                name=f"RandomForestOrdinal__{tag}",
                model=random_forest_ordinal,
                mode="tree_ordinal",
                engineered=engineered,
                X=X,
                y=y,
                cv=cv,
                scoring=scoring,
            )
        )

        random_forest_onehot = RandomForestClassifier(
            n_estimators=300,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=1,
        )

        results.append(
            evaluate_candidate(
                name=f"RandomForestOneHot__{tag}",
                model=random_forest_onehot,
                mode="linear",
                engineered=engineered,
                X=X,
                y=y,
                cv=cv,
                scoring=scoring,
            )
        )

        hist_gradient_boosting = HistGradientBoostingClassifier(
            learning_rate=0.1,
            max_iter=150,
            max_depth=None,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        )

        results.append(
            evaluate_candidate(
                name=f"HistGradientBoosting__{tag}",
                model=hist_gradient_boosting,
                mode="tree_ordinal",
                engineered=engineered,
                X=X,
                y=y,
                cv=cv,
                scoring=scoring,
            )
        )



    results_df = pd.DataFrame(results)

    results_df = results_df.sort_values(
        by=[
            "pr_auc_mean",
            "f2_mean",
            "roc_auc_mean",
        ],
        ascending=False,
    )

    os.makedirs(
        os.path.dirname(OUTPUT_PATH),
        exist_ok=True,
    )

    results_df.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    print(
        "\n\n========== STAGE 2A RESULTS ==========\n"
    )

    display_columns = [
        "candidate",
        "pr_auc_mean",
        "pr_auc_std",
        "roc_auc_mean",
        "precision_mean",
        "recall_mean",
        "f1_mean",
        "f2_mean",
        "balanced_accuracy_mean",
        "mcc_mean",
        "brier_mean",
    ]

    print(
        results_df[
            display_columns
        ].to_string(
            index=False,
            float_format=lambda value: f"{value:.4f}",
        )
    )

    print(
        "\n========== TOP 3 BY PR-AUC ==========\n"
    )

    top_three = results_df.head(3)

    for rank, (_, row) in enumerate(
        top_three.iterrows(),
        start=1,
    ):
        print(
            f"{rank}. {row['candidate']}\n"
            f"   PR-AUC:    {row['pr_auc_mean']:.4f}\n"
            f"   ROC-AUC:   {row['roc_auc_mean']:.4f}\n"
            f"   Recall:    {row['recall_mean']:.4f}\n"
            f"   Precision: {row['precision_mean']:.4f}\n"
            f"   F2:        {row['f2_mean']:.4f}\n"
        )

    print(
        f"Full results saved to: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()