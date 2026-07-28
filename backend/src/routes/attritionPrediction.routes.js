const { Router } = require("express");
const { ROLES } = require("../config/roles");
const { latest } = require("../controllers/attritionPrediction.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/authorize.middleware");

const attritionPredictionRouter = Router();
attritionPredictionRouter.use(authenticate, authorize(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN));
attritionPredictionRouter.get("/", latest);

module.exports = { attritionPredictionRouter };

