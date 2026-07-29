from pathlib import Path
from functools import lru_cache

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
import shap

from src.schemas import EmployeeFeatures


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "attrition_pipeline.joblib"

app = FastAPI(
    title="PulseHR Attrition ML Service",
    version="2.0.0",
)


@lru_cache(maxsize=1)
def load_model_artifact() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "Model artifact not found. Train the model first."
        )

    return joblib.load(MODEL_PATH)


@lru_cache(maxsize=1)
def get_shap_explainer():
    """Build one linear SHAP explainer for the deployed pipeline.

    The pipeline's numeric values are standardized and its categorical values
    are one-hot encoded, so a zero transformed row is a stable, model-native
    baseline (mean numeric values and the dropped categorical reference level).
    """
    artifact = load_model_artifact()
    pipeline = artifact["pipeline"]
    preprocessor = pipeline.named_steps["preprocessor"]
    classifier = pipeline.named_steps.get("model", pipeline.named_steps.get("classifier"))
    transformed_feature_count = len(preprocessor.get_feature_names_out())
    masker = np.zeros((1, transformed_feature_count), dtype=float)
    return shap.LinearExplainer(classifier, masker)


def _human_label(transformed_name: str, raw_features: list[str]) -> str:
    short_name = transformed_name.split("__")[-1]
    for raw_feature in sorted(raw_features, key=len, reverse=True):
        if short_name == raw_feature:
            return raw_feature
        if short_name.startswith(f"{raw_feature}_"):
            category = short_name[len(raw_feature) + 1:].replace("_", " ")
            return f"{raw_feature} = {category}"
    return short_name.replace("_", " ")


def build_explanations(employee_df, artifact: dict) -> list[dict]:
    pipeline = artifact["pipeline"]
    preprocessor = pipeline.named_steps["preprocessor"]
    transformed = preprocessor.transform(employee_df)
    values = get_shap_explainer().shap_values(transformed)
    if isinstance(values, list):
        values = values[-1]
    values = np.asarray(values)[0]
    raw_features = list(employee_df.columns)
    explanations = []
    for name, contribution in zip(preprocessor.get_feature_names_out(), values):
        contribution = float(contribution)
        if abs(contribution) < 1e-10:
            continue
        explanations.append({
            "feature": _human_label(name, raw_features),
            "contribution": round(contribution, 6),
            "direction": "increase risk" if contribution > 0 else "decrease risk",
            "importance": round(abs(contribution), 6),
        })
    explanations.sort(key=lambda item: item["importance"], reverse=True)
    return [dict(item, rank=index + 1) for index, item in enumerate(explanations[:10])]


@app.get("/health")
def health() -> dict:
    return {
        "success": True,
        "modelAvailable": MODEL_PATH.exists(),
    }


@app.post("/predict")
def predict(features: EmployeeFeatures) -> dict:
    try:
        artifact = load_model_artifact()

        employee_df = features.to_frame()

        probability = float(
            artifact["pipeline"]
            .predict_proba(employee_df)[0][1]
        )

        decision_threshold = artifact.get(
            "decision_threshold",
            0.45,
        )

        risk_thresholds = artifact.get(
            "risk_thresholds",
            {
                "medium": 0.30,
                "high": 0.60,
            },
        )

        if probability < risk_thresholds["medium"]:
            risk_level = "low"
        elif probability < risk_thresholds["high"]:
            risk_level = "medium"
        else:
            risk_level = "high"

        prediction = (
            "attrition"
            if probability >= decision_threshold
            else "stay"
        )

        explanations = build_explanations(employee_df, artifact)
        return {
            "attritionProbability": round(
                probability,
                4,
            ),
            "riskLevel": risk_level,
            "prediction": prediction,
            "decisionThreshold": decision_threshold,
            "modelVersion": artifact["model_version"],
            "explanations": explanations,
            "topContributingFeatures": explanations,
            "shapValues": [
                {"feature": item["feature"], "value": item["contribution"]}
                for item in explanations
            ],
        }

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}",
        ) from error
