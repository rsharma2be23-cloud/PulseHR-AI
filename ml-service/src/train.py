import os
from pathlib import Path

os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import joblib
import pandas as pd

from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline

from src.preprocessing import build_preprocessing_pipeline


BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = BASE_DIR / "data" / "WA_Fn-UseC_-HR-Employee-Attrition.csv"
MODEL_PATH = BASE_DIR / "models" / "attrition_pipeline.joblib"

MODEL_VERSION = "logistic-regression-engineered-v2"


def load_data():
    df = pd.read_csv(DATA_PATH)

    y = df["Attrition"].map({
        "No": 0,
        "Yes": 1,
    })

    if y.isna().any():
        raise ValueError(
            "Attrition must contain only 'Yes' and 'No'."
        )

    X = df.drop(columns=["Attrition"])

    return X, y


def build_pipeline():
    preprocessor = build_preprocessing_pipeline(
        model_family="linear",
        include_engineered_features=True,
    )

    classifier = LogisticRegression(
        solver="lbfgs",
        max_iter=3000,
        class_weight="balanced",
        random_state=42,
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", classifier),
        ]
    )


def train():
    print("========== FINAL MODEL TRAINING ==========")

    X, y = load_data()

    print(f"Employees: {len(X)}")
    print(f"Raw features: {X.shape[1]}")
    print(f"Attrition cases: {int(y.sum())}")
    print(f"Attrition rate: {y.mean():.2%}")

    pipeline = build_pipeline()

    cv = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42,
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

    print("\nSelecting final C using 5-fold CV...")

    search = GridSearchCV(
        estimator=pipeline,
        param_grid=parameter_grid,
        scoring="average_precision",
        cv=cv,
        n_jobs=1,
        refit=True,
        error_score="raise",
    )

    search.fit(X, y)

    final_model = search.best_estimator_
    best_c = search.best_params_["model__C"]

    print(f"Best C: {best_c}")
    print(
        f"Best CV PR-AUC: "
        f"{search.best_score_:.4f}"
    )

    MODEL_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    artifact = {
        "pipeline": final_model,
        "model_version": MODEL_VERSION,
        "model_type": "LogisticRegression",
        "engineered_features": True,
        "best_C": best_c,

        # Temporary operating threshold.
        # We'll revisit calibration/threshold selection
        # after the full application works.
        "decision_threshold": 0.45,

        "risk_thresholds": {
            "medium": 0.30,
            "high": 0.60,
        },

        "training_metadata": {
            "rows": len(X),
            "positive_cases": int(y.sum()),
            "positive_rate": float(y.mean()),
            "selection_metric": "average_precision",
            "cv_folds": 5,
            "cv_pr_auc": float(search.best_score_),
        },
    }

    joblib.dump(
        artifact,
        MODEL_PATH,
    )

    print("\n========== MODEL SAVED ==========")
    print(f"Path: {MODEL_PATH}")
    print(f"Version: {MODEL_VERSION}")
    print(f"C: {best_c}")
    print("Engineered features: True")
    print("Decision threshold: 0.45")

    return artifact


if __name__ == "__main__":
    train()