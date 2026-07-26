const { canViewEmployee, getEmployeeById } = require("../services/employee.service");
const {
  createAttendance,
  getAttendanceById,
  listAttendance,
  updateAttendance,
} = require("../services/attendance.service");
const { ApiError } = require("../utils/apiError");

async function create(request, response, next) {
  try {
    const attendance = await createAttendance(request.body);
    response.status(201).json({ success: true, data: { attendance } });
  } catch (error) {
    next(error);
  }
}

async function getForEmployee(request, response, next) {
  try {
    const employee = await getEmployeeById(request.params.id);
    if (!(await canViewEmployee(employee, request.user))) {
      throw new ApiError(403, "You do not have permission to view this employee's attendance.");
    }

    const attendance = await listAttendance({ employee: request.params.id }, request.user);
    response.status(200).json({ success: true, data: { attendance } });
  } catch (error) {
    next(error);
  }
}

async function list(request, response, next) {
  try {
    const attendance = await listAttendance(request.query, request.user);
    response.status(200).json({ success: true, data: { attendance } });
  } catch (error) {
    next(error);
  }
}

async function update(request, response, next) {
  try {
    const attendance = await getAttendanceById(request.params.id);
    const updatedAttendance = await updateAttendance(attendance._id.toString(), request.body);
    response.status(200).json({ success: true, data: { attendance: updatedAttendance } });
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getForEmployee, list, update };
