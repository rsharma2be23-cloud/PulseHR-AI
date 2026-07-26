const { Router } = require("express");
const { ROLES } = require("../config/roles");
const { accessGranted } = require("../controllers/rbac.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/authorize.middleware");

const rbacRouter = Router();

rbacRouter.use(authenticate);

rbacRouter.get("/employee", authorize(ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR, ROLES.ADMIN), accessGranted);
rbacRouter.get("/manager", authorize(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN), accessGranted);
rbacRouter.get("/hr", authorize(ROLES.HR, ROLES.ADMIN), accessGranted);
rbacRouter.get("/admin", authorize(ROLES.ADMIN), accessGranted);

module.exports = { rbacRouter };
