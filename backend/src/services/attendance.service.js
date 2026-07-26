const { ROLES } = require("../config/roles");
const { Attendance } = require("../models/attendance.model");
const { Employee } = require("../models/employee.model");
const { ApiError } = require("../utils/apiError");

async function getEmployee(employeeId) {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new ApiError(400, "Employee reference does not exist.");
  }

  return employee;
}

async function createAttendance(data) {
  await getEmployee(data.employee);
  return Attendance.create(data);
}

async function getAttendanceById(attendanceId) {
  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) {
    throw new ApiError(404, "Attendance record not found.");
  }

  return attendance;
}

async function getManagedEmployeeIds(requester) {
  const manager = await Employee.findOne({ user: requester.sub });
  if (!manager) {
    return [];
  }

  const directReports = await Employee.find({ manager: manager._id });
  return [manager._id, ...directReports.map((employee) => employee._id)];
}

async function listAttendance(filters, requester) {
  const query = {};

  if (filters.employee) {
    query.employee = filters.employee;
  }

  if (filters.from || filters.to) {
    query.period = {};
    if (filters.from) query.period.$gte = filters.from;
    if (filters.to) query.period.$lte = filters.to;
  }

  if (requester.role === ROLES.MANAGER) {
    const allowedEmployeeIds = await getManagedEmployeeIds(requester);
    if (query.employee) {
      const allowed = allowedEmployeeIds.some((id) => id.toString() === query.employee);
      query.employee = allowed ? query.employee : { $in: [] };
    } else {
      query.employee = { $in: allowedEmployeeIds };
    }
  }

  return Attendance.find(query).sort({ period: -1 });
}

async function updateAttendance(attendanceId, data) {
  const attendance = await getAttendanceById(attendanceId);
  Object.assign(attendance, data);

  if (attendance.presentDays + attendance.absentDays > attendance.workingDays) {
    throw new ApiError(400, "Present and absent days cannot exceed working days.");
  }

  await attendance.save();
  return attendance;
}

module.exports = { createAttendance, getAttendanceById, listAttendance, updateAttendance };
