const { z } = require("zod");
const { objectIdSchema } = require("./common.validator");

const employmentStatuses = ["active", "notice_period", "exited"];

const employeeFields = {
  user: objectIdSchema,
  employeeCode: z.string().trim().min(3).max(30),
  department: objectIdSchema,
  manager: objectIdSchema.nullable().optional(),
  designation: z.string().trim().min(1).max(100),
  dateOfJoining: z.coerce.date(),
  age: z.coerce.number().int().min(16).max(100),
  salary: z.coerce.number().min(0),
  employmentStatus: z.enum(employmentStatuses),
  lastPromotionDate: z.coerce.date().nullable().optional(),
};

const createEmployeeSchema = z.object(employeeFields);
const { user, ...employeeUpdateFields } = employeeFields;
const updateEmployeeSchema = z
  .object(employeeUpdateFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.");

const employeeListQuerySchema = z.object({
  department: objectIdSchema.optional(),
  manager: objectIdSchema.optional(),
  employmentStatus: z.enum(employmentStatuses).optional(),
});

module.exports = { createEmployeeSchema, updateEmployeeSchema, employeeListQuerySchema };
