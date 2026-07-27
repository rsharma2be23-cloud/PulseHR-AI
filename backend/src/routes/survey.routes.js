const { Router } = require("express");
const { ROLES } = require("../config/roles");
const { getById, getForEmployee, list, submit } = require("../controllers/survey.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/authorize.middleware");
const { validate, validateParams, validateQuery } = require("../middleware/validate.middleware");
const { idParamsSchema } = require("../validators/common.validator");
const { submitSurveySchema, surveyListQuerySchema } = require("../validators/survey.validator");

const surveyRouter = Router();

surveyRouter.use(authenticate);
surveyRouter.post("/", validate(submitSurveySchema), submit);
surveyRouter.get("/", authorize(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN), validateQuery(surveyListQuerySchema), list);
surveyRouter.get("/employee/:id", validateParams(idParamsSchema), getForEmployee);
surveyRouter.get("/:id", validateParams(idParamsSchema), getById);

module.exports = { surveyRouter };
