const { z } = require("zod");
const { objectIdSchema } = require("./common.validator");

const satisfactionScore = z.coerce.number().int().min(1).max(5);

const submitSurveySchema = z.object({
  jobSatisfaction: satisfactionScore,
  workLifeBalance: satisfactionScore,
  careerGrowth: satisfactionScore,
  managerSupport: satisfactionScore,
  compensationSatisfaction: satisfactionScore,
});

const surveyListQuerySchema = z.object({
  employee: objectIdSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

module.exports = { submitSurveySchema, surveyListQuerySchema };
