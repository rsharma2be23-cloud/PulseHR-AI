from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException

from src.schemas import EmployeeFeatures


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "attrition_pipeline.joblib"

app = FastAPI(
    title="PulseHR Attrition ML Service",
    version="2.0.0",
)


def load_model_artifact() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "Model artifact not found. Train the model first."
        )

    return joblib.load(MODEL_PATH)


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

        return {
            "attritionProbability": round(
                probability,
                4,
            ),
            "riskLevel": risk_level,
            "prediction": prediction,
            "decisionThreshold": decision_threshold,
            "modelVersion": artifact["model_version"],
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