const { z } = require("zod");

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid MongoDB ObjectId.");
const idParamsSchema = z.object({ id: objectIdSchema });

module.exports = { objectIdSchema, idParamsSchema };
