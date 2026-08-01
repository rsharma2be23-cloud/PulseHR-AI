const { ApiError } = require("../utils/apiError");

function serviceUrl() {
  const value = process.env.HR_KNOWLEDGE_URL;
  if (!value) {
    console.error("[HR Knowledge] HR_KNOWLEDGE_URL is not configured.");
    throw new ApiError(503, "HR knowledge service is not configured.");
  }
  return value.replace(/\/$/, "");
}

function validateResponse(payload) {
  const valid = payload && Array.isArray(payload.results) && payload.results.every((item) => item
    && typeof item.text === "string"
    && item.metadata && typeof item.metadata === "object"
    && typeof item.metadata.document === "string"
    && typeof item.metadata.section === "string"
    && typeof item.metadata.category === "string"
    && typeof item.score === "number");
  if (!valid) throw new ApiError(502, "HR knowledge service returned an invalid response.");
  return payload.results;
}

async function searchKnowledge(query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.HR_KNOWLEDGE_TIMEOUT_MS) || 8000);
  try {
    const response = await fetch(`${serviceUrl()}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(query),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status === 503 ? 503 : 502, "HR knowledge service could not process this search.");
    return validateResponse(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`[HR Knowledge] Retrieval failed: ${error.message}`);
      throw error;
    }
    if (error.name === "AbortError") {
      console.error("[HR Knowledge] Retrieval request timed out.");
      throw new ApiError(504, "HR knowledge service timed out.");
    }
    console.error(`[HR Knowledge] Retrieval request failed: ${error.message}`);
    throw new ApiError(503, "HR knowledge service is unavailable.");
  } finally { clearTimeout(timeout); }
}

module.exports = { searchKnowledge };
