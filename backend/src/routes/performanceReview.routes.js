const { Router } = require("express");
const { ROLES } = require("../config/roles");
const { create, getById, getForEmployee, list, update } = require("../controllers/performanceReview.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/authorize.middleware");
const { validate, validateParams, validateQuery } = require("../middleware/validate.middleware");
const { idParamsSchema } = require("../validators/common.validator");
const { createPerformanceReviewSchema, updatePerformanceReviewSchema, reviewListQuerySchema } = require("../validators/performanceReview.validator");

const performanceReviewRouter = Router();

performanceReviewRouter.use(authenticate);
performanceReviewRouter.get("/", authorize(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN), validateQuery(reviewListQuerySchema), list);
performanceReviewRouter.post("/", authorize(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN), validate(createPerformanceReviewSchema), create);
performanceReviewRouter.get("/employee/:id", validateParams(idParamsSchema), getForEmployee);
performanceReviewRouter.get("/:id", validateParams(idParamsSchema), getById);
performanceReviewRouter.patch("/:id", authorize(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN), validateParams(idParamsSchema), validate(updatePerformanceReviewSchema), update);

module.exports = { performanceReviewRouter };
