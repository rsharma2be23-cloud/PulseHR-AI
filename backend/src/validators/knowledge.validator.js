const { z } = require("zod");

const knowledgeSearchSchema = z.object({
  query: z.string().trim().min(2).max(1000),
  topK: z.coerce.number().int().min(1).max(20).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  metadata: z.object({
    document: z.string().trim().min(1).max(300).optional(),
    section: z.string().trim().min(1).max(300).optional(),
    page: z.coerce.number().int().min(1).optional(),
  }).strict().optional(),
  scoreThreshold: z.coerce.number().min(0).max(1).optional(),
}).strict();

module.exports = { knowledgeSearchSchema };
