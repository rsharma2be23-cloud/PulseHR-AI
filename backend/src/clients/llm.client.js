const { ApiError } = require("../utils/apiError");

function llmConfiguration() {
  const provider = (process.env.LLM_PROVIDER || "groq").toLowerCase();
  if (!["groq", "openai-compatible"].includes(provider)) throw new ApiError(503, "Configured LLM provider is not supported.");
  const apiKey = process.env.LLM_API_KEY || (provider === "groq" ? process.env.GROQ_API_KEY : "");
  if (!apiKey) throw new ApiError(503, "HR Copilot LLM credentials are not configured.");
  return {
    apiKey,
    baseUrl: (process.env.LLM_BASE_URL || (provider === "groq" ? "https://api.groq.com/openai/v1" : "")).replace(/\/$/, ""),
    model: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 15000,
  };
}

async function createGroundedCompletion(messages) {
  const config = llmConfiguration();
  if (!config.baseUrl) throw new ApiError(503, "LLM_BASE_URL is not configured.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ model: config.model, messages, temperature: 0.1, max_tokens: Number(process.env.LLM_MAX_TOKENS) || 700 }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    const content = payload?.choices?.[0]?.message?.content;
    if (!response.ok || typeof content !== "string" || !content.trim()) throw new ApiError(502, "HR Copilot LLM could not produce a response.");
    return content.trim();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "AbortError") throw new ApiError(504, "HR Copilot LLM timed out.");
    throw new ApiError(503, "HR Copilot LLM is unavailable.");
  } finally { clearTimeout(timeout); }
}

module.exports = { createGroundedCompletion };
