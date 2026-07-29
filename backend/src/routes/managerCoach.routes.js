const { Router } = require("express");
const { ROLES } = require("../config/roles");
const { generate } = require("../controllers/managerCoach.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/authorize.middleware");
const { validateParams } = require("../middleware/validate.middleware");
const { managerCoachParamsSchema } = require("../validators/managerCoach.validator");

const managerCoachRouter = Router();
managerCoachRouter.use(authenticate, authorize(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN));
managerCoachRouter.post("/:employeeId", validateParams(managerCoachParamsSchema), generate);

module.exports = { managerCoachRouter };
