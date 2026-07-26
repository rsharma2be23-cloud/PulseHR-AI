const { z } = require("zod");
const { objectIdSchema } = require("./common.validator");

const reviewFields = {
  employee: objectIdSchema,
  reviewer: objectIdSchema,
  reviewPeriod: z.string().trim().min(1).max(50),
  rating: z.coerce.number().min(1).max(5),
  comments: z.string().trim().max(5000).optional(),
};

const createPerformanceReviewSchema = z.object(reviewFields);
const updatePerformanceReviewSchema = z
  .object(reviewFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.");

const reviewListQuerySchema = z.object({
  employee: objectIdSchema.optional(),
  reviewer: objectIdSchema.optional(),
  reviewPeriod: z.string().trim().min(1).max(50).optional(),
});

module.exports = { createPerformanceReviewSchema, updatePerformanceReviewSchema, reviewListQuerySchema };
