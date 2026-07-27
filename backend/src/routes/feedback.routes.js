const { Router } = require("express");
const { ROLES } = require("../config/roles");
const { getById, getForEmployee, list, submit } = require("../controllers/feedback.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/authorize.middleware");
const { validate, validateParams, validateQuery } = require("../middleware/validate.middleware");
const { idParamsSchema } = require("../validators/common.validator");
const { feedbackListQuerySchema, submitFeedbackSchema } = require("../validators/feedback.validator");

const feedbackRouter = Router();

feedbackRouter.use(authenticate);
feedbackRouter.post("/", validate(submitFeedbackSchema), submit);
feedbackRouter.get("/", authorize(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN), validateQuery(feedbackListQuerySchema), list);
feedbackRouter.get("/employee/:id", validateParams(idParamsSchema), getForEmployee);
feedbackRouter.get("/:id", validateParams(idParamsSchema), getById);

module.exports = { feedbackRouter };
