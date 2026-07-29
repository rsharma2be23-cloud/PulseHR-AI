const { createGroundedCompletion } = require("../clients/llm.client");
const { retrieveKnowledge } = require("./knowledge.service");

const NO_EVIDENCE_ANSWER = "I couldn't find an approved HR policy that answers this question in the current knowledge base. Please contact Human Resources for guidance.";
const GROUNDING_FAILURE_ANSWER = "I found potentially relevant policy material, but I couldn't produce an answer that could be verified against those sources. Please review the supporting excerpts or contact Human Resources for guidance.";
const MAX_HISTORY_MESSAGES = Number(process.env.COPILOT_HISTORY_LIMIT) || 8;
const RETRIEVAL_TOP_K = Number(process.env.COPILOT_RETRIEVAL_TOP_K) || 5;
const MIN_CONFIDENCE = Number(process.env.COPILOT_MIN_CONFIDENCE) || 0.35;

function assessConfidence(sources) {
  const score = sources.length ? Math.max(...sources.map((source) => source.score)) : 0;
  return { score: Number(score.toFixed(4)), level: score >= 0.75 ? "high" : score >= 0.55 ? "medium" : score > 0 ? "low" : "none", evidenceCount: sources.length, grounded: score >= MIN_CONFIDENCE };
}

function toSource(result, index) {
  return {
    id: index + 1,
    document: result.metadata.document,
    section: result.metadata.section,
    page: result.metadata.page ?? null,
    category: result.metadata.category,
    score: result.score,
    excerpt: result.text,
  };
}

function buildGroundedPrompt(question, sources) {
  const evidence = sources.map((source) => `[${source.id}] Document: ${source.document}\nSection: ${source.section}\nExcerpt: ${source.excerpt}`).join("\n\n");
  return `You are PulseHR Copilot. Answer HR policy questions using only the approved policy excerpts below. Do not use outside knowledge, infer missing rules, or fabricate policy details. If the excerpts do not directly support an answer, say: "I couldn't find an approved HR policy that answers this question in the current knowledge base." Cite every factual policy statement with its source number, such as [1]. Keep the response concise and professional.\n\nAPPROVED POLICY EXCERPTS:\n${evidence}\n\nQUESTION:\n${question}`;
}

async function answerCopilotQuestion({ question, history = [], category }) {
  const results = await retrieveKnowledge({ query: question, topK: RETRIEVAL_TOP_K, category, scoreThreshold: 0 });
  const sources = results.map(toSource);
  const confidence = assessConfidence(sources);
  if (!confidence.grounded) return { answer: NO_EVIDENCE_ANSWER, sources, confidence };

  const boundedHistory = history.slice(-MAX_HISTORY_MESSAGES).map((message) => ({ role: message.role, content: message.content }));
  const answer = await createGroundedCompletion([
    { role: "system", content: "You are a retrieval-grounded HR policy assistant. Follow the evidence-only instructions in the user message." },
    ...boundedHistory,
    { role: "user", content: buildGroundedPrompt(question, sources) },
  ]);
  const hasCitation = sources.some((source) => answer.includes(`[${source.id}]`));
  return { answer: hasCitation ? answer : GROUNDING_FAILURE_ANSWER, sources, confidence };
}

module.exports = { answerCopilotQuestion, assessConfidence, buildGroundedPrompt, NO_EVIDENCE_ANSWER, GROUNDING_FAILURE_ANSWER };
