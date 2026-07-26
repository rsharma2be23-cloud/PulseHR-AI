const { z } = require("zod");
const { objectIdSchema } = require("./common.validator");

const departmentFields = {
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  manager: objectIdSchema.nullable().optional(),
};

const createDepartmentSchema = z.object(departmentFields);
const updateDepartmentSchema = z
  .object(departmentFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.");

module.exports = { createDepartmentSchema, updateDepartmentSchema };
