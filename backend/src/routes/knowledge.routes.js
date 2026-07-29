const { Router } = require("express");
const { ROLES } = require("../config/roles");
const { search } = require("../controllers/knowledge.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/authorize.middleware");
const { validate } = require("../middleware/validate.middleware");
const { knowledgeSearchSchema } = require("../validators/knowledge.validator");

const knowledgeRouter = Router();

knowledgeRouter.use(authenticate, authorize(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN));
knowledgeRouter.post("/search", validate(knowledgeSearchSchema), search);

module.exports = { knowledgeRouter };
