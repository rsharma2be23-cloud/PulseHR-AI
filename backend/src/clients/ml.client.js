const { ApiError } = require("../utils/apiError");

function serviceUrl() {
  const value = process.env.ML_SERVICE_URL;
  if (!value) throw new ApiError(503, "Attrition prediction service is not configured.");
  return value.replace(/\/$/, "");
}

function validatePrediction(payload) {
  const valid = payload && typeof payload.attritionProbability === "number"
    && ["low", "medium", "high"].includes(payload.riskLevel)
    && ["attrition", "stay"].includes(payload.prediction)
    && typeof payload.decisionThreshold === "number"
    && typeof payload.modelVersion === "string";
  const explanations = Array.isArray(payload.explanations) ? payload.explanations : [];
  const validExplanations = explanations.every((item) => item && typeof item.feature === "string"
    && typeof item.contribution === "number" && ["increase risk", "decrease risk"].includes(item.direction)
    && typeof item.importance === "number");
  if (!valid || !validExplanations) throw new ApiError(502, "Attrition prediction service returned an invalid response.");
  return payload;
}

async function predictAttrition(features) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.ML_SERVICE_TIMEOUT_MS) || 8000);
  try {
    const response = await fetch(`${serviceUrl()}/predict`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(features), signal: controller.signal });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = payload?.detail;
      throw new ApiError(response.status === 503 ? 503 : 502, typeof detail === "string" ? `Attrition prediction failed: ${detail}` : "Attrition prediction service could not process this request.");
    }
    return validatePrediction(payload);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "AbortError") throw new ApiError(504, "Attrition prediction service timed out.");
    throw new ApiError(503, "Attrition prediction service is unavailable.");
  } finally { clearTimeout(timeout); }
}

module.exports = { predictAttrition };
