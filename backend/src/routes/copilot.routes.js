const { Router } = require("express");
const { ROLES } = require("../config/roles");
const { chat } = require("../controllers/copilot.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/authorize.middleware");
const { validate } = require("../middleware/validate.middleware");
const { copilotChatSchema } = require("../validators/copilot.validator");

const copilotRouter = Router();

copilotRouter.use(authenticate, authorize(ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR, ROLES.ADMIN));
copilotRouter.post("/chat", validate(copilotChatSchema), chat);

module.exports = { copilotRouter };
