const { Router } = require("express");
const { ROLES } = require("../config/roles");
const { create, getById, list, update } = require("../controllers/employee.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/authorize.middleware");
const { validate, validateParams, validateQuery } = require("../middleware/validate.middleware");
const { idParamsSchema } = require("../validators/common.validator");
const {
  createEmployeeSchema,
  employeeListQuerySchema,
  updateEmployeeSchema,
} = require("../validators/employee.validator");

const employeeRouter = Router();

employeeRouter.use(authenticate);
employeeRouter.get("/", authorize(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN), validateQuery(employeeListQuerySchema), list);
employeeRouter.post("/", authorize(ROLES.HR, ROLES.ADMIN), validate(createEmployeeSchema), create);
employeeRouter.get("/:id", validateParams(idParamsSchema), getById);
employeeRouter.patch("/:id", authorize(ROLES.HR, ROLES.ADMIN), validateParams(idParamsSchema), validate(updateEmployeeSchema), update);

module.exports = { employeeRouter };
