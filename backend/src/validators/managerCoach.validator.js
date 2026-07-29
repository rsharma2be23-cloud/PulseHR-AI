const { z } = require("zod");
const { objectIdSchema } = require("./common.validator");

const managerCoachParamsSchema = z.object({ employeeId: objectIdSchema });

module.exports = { managerCoachParamsSchema };
