const { Router } = require("express");
const { ROLES } = require("../config/roles");
const { create, getById, list, update } = require("../controllers/department.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/authorize.middleware");
const { validate, validateParams } = require("../middleware/validate.middleware");
const { idParamsSchema } = require("../validators/common.validator");
const { createDepartmentSchema, updateDepartmentSchema } = require("../validators/department.validator");

const departmentRouter = Router();

departmentRouter.use(authenticate, authorize(ROLES.HR, ROLES.ADMIN));
departmentRouter.get("/", list);
departmentRouter.post("/", validate(createDepartmentSchema), create);
departmentRouter.get("/:id", validateParams(idParamsSchema), getById);
departmentRouter.patch("/:id", validateParams(idParamsSchema), validate(updateDepartmentSchema), update);

module.exports = { departmentRouter };
