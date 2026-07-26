const { Router } = require("express");
const { ROLES } = require("../config/roles");
const { create, getForEmployee, list, update } = require("../controllers/attendance.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/authorize.middleware");
const { validate, validateParams, validateQuery } = require("../middleware/validate.middleware");
const { createAttendanceSchema, updateAttendanceSchema, attendanceListQuerySchema } = require("../validators/attendance.validator");
const { idParamsSchema } = require("../validators/common.validator");

const attendanceRouter = Router();

attendanceRouter.use(authenticate);
attendanceRouter.get("/", authorize(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN), validateQuery(attendanceListQuerySchema), list);
attendanceRouter.post("/", authorize(ROLES.HR, ROLES.ADMIN), validate(createAttendanceSchema), create);
attendanceRouter.get("/employee/:id", validateParams(idParamsSchema), getForEmployee);
attendanceRouter.patch("/:id", authorize(ROLES.HR, ROLES.ADMIN), validateParams(idParamsSchema), validate(updateAttendanceSchema), update);

module.exports = { attendanceRouter };
