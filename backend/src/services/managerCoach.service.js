const { ApiError } = require("../utils/apiError");
const { createGroundedCompletion } = require("../clients/llm.client");
const { retrieveKnowledge } = require("./knowledge.service");
const { collectManagerCoachEvidence } = require("./managerCoachEvidence.service");

const REPORT_FIELDS = ["employeeSummary", "riskAssessment", "topAttritionDrivers", "performanceObservations", "attendanceObservations", "feedbackTrends", "surveyTrends", "relevantHrPolicies", "immediateRecommendations", "mediumTermRecommendations", "suggestedManagerConversation", "confidenceStatement"];
const POLICY_TOP_K = Number(process.env.MANAGER_COACH_POLICY_TOP_K) || 4;
const POLICY_MIN_SCORE = Number(process.env.MANAGER_COACH_POLICY_MIN_SCORE) || 0.35;

function policySources(results) {
  return results.filter((item) => item.score >= POLICY_MIN_SCORE).map((item, index) => ({ id: `P${index + 1}`, document: item.metadata.document, section: item.metadata.section, page: item.metadata.page ?? null, category: item.metadata.category, score: item.score, excerpt: item.text }));
}

function buildPolicyQuery(evidence) {
  const drivers = evidence.attrition?.shapFactors?.map((item) => item.feature).join(" ") || "";
  return `manager coaching attendance performance feedback survey attrition retention employee support ${drivers}`;
}

function buildPrompt(evidence, policies) {
  const policyEvidence = policies.map((item) => ({ id: item.id, document: item.document, section: item.section, excerpt: item.excerpt })).map(JSON.stringify).join("\n");
  return `You are PulseHR Manager Coaching Agent. Create a concise, evidence-backed coaching report using ONLY the supplied employee evidence and policy excerpts. The LLM has no database access. Never invent missing facts, policies, trends, diagnoses, or recommendations. If evidence is unavailable, name it as unavailable and do not infer a replacement. Recommendations must be supported by employee evidence or policy excerpts. Refer to policies as [P1], [P2], etc. Return valid JSON only, with exactly these keys: ${REPORT_FIELDS.join(", ")}. Use strings for employeeSummary, riskAssessment, and confidenceStatement; use arrays of concise strings for every other key.\n\nEMPLOYEE EVIDENCE:\n${JSON.stringify(evidence)}\n\nPOLICY EXCERPTS:\n${policyEvidence || "No sufficiently relevant approved HR policy excerpts were retrieved."}`;
}

function parseReport(content) {
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let value;
  try { value = JSON.parse(normalized); } catch { throw new ApiError(502, "Manager Coaching Agent returned an invalid structured report."); }
  if (!value || typeof value !== "object" || REPORT_FIELDS.some((field) => !(field in value))) throw new ApiError(502, "Manager Coaching Agent returned an incomplete structured report.");
  const report = {};
  for (const field of REPORT_FIELDS) {
    if (["employeeSummary", "riskAssessment", "confidenceStatement"].includes(field)) {
      if (typeof value[field] !== "string") throw new ApiError(502, "Manager Coaching Agent returned an invalid structured report.");
      report[field] = value[field].trim();
    } else {
      if (!Array.isArray(value[field]) || !value[field].every((item) => typeof item === "string")) throw new ApiError(502, "Manager Coaching Agent returned an invalid structured report.");
      report[field] = value[field].map((item) => item.trim()).filter(Boolean).slice(0, 8);
    }
  }
  return report;
}

function confidence(evidence, policies) {
  const available = [evidence.attendance, evidence.performance, evidence.surveys, evidence.feedback, evidence.attrition].filter(Boolean).length;
  const score = Number(((available / 5) * 0.8 + (policies.length ? 0.2 : 0)).toFixed(2));
  return { score, level: score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low", availableEvidenceAreas: available, missingInformation: evidence.missingInformation };
}

async function generateManagerCoachingReport(employee) {
  const evidence = await collectManagerCoachEvidence(employee);
  const retrievedPolicies = await retrieveKnowledge({ query: buildPolicyQuery(evidence), topK: POLICY_TOP_K, scoreThreshold: 0 });
  const policies = policySources(retrievedPolicies);
  const report = parseReport(await createGroundedCompletion([
    { role: "system", content: "You produce structured, evidence-only manager coaching reports. Obey the supplied evidence and return JSON only." },
    { role: "user", content: buildPrompt(evidence, policies) },
  ]));
  return { report, evidence, policySources: policies, confidence: confidence(evidence, policies), generatedAt: new Date().toISOString() };
}

module.exports = { generateManagerCoachingReport, buildPrompt, parseReport, confidence };
