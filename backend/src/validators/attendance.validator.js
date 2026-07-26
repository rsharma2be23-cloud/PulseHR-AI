const { z } = require("zod");
const { objectIdSchema } = require("./common.validator");

const attendanceFields = {
  employee: objectIdSchema,
  period: z.coerce.date(),
  workingDays: z.coerce.number().int().min(0),
  presentDays: z.coerce.number().int().min(0),
  absentDays: z.coerce.number().int().min(0),
  overtimeHours: z.coerce.number().min(0).default(0),
};

const createAttendanceSchema = z
  .object(attendanceFields)
  .refine((data) => data.presentDays + data.absentDays <= data.workingDays, "Present and absent days cannot exceed working days.");

const { employee, ...attendanceUpdateFields } = attendanceFields;
const updateAttendanceSchema = z
  .object(attendanceUpdateFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.");

const attendanceListQuerySchema = z.object({
  employee: objectIdSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

module.exports = { createAttendanceSchema, updateAttendanceSchema, attendanceListQuerySchema };
