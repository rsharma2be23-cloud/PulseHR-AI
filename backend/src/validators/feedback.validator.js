const { z } = require("zod");
const { objectIdSchema } = require("./common.validator");

const submitFeedbackSchema = z.object({
  text: z.string().trim().min(1).max(5000),
});

const feedbackListQuerySchema = z.object({
  employee: objectIdSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

module.exports = { submitFeedbackSchema, feedbackListQuerySchema };
