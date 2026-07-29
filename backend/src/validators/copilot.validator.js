const { z } = require("zod");

const copilotChatSchema = z.object({
  question: z.string().trim().min(2).max(1000),
  category: z.string().trim().min(1).max(100).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(4000),
  }).strict()).max(12).optional(),
}).strict();

module.exports = { copilotChatSchema };
