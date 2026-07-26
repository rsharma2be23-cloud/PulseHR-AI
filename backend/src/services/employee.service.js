const { ROLES } = require("../config/roles");
const { Department } = require("../models/department.model");
const { Employee } = require("../models/employee.model");
const { User } = require("../models/user.model");
const { ApiError } = require("../utils/apiError");

async function ensureUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "User reference does not exist.");
  }
}

async function ensureDepartment(departmentId) {
  const department = await Department.findById(departmentId);
  if (!department) {
    throw new ApiError(400, "Department reference does not exist.");
  }
}

async function ensureManager(managerId, employeeId) {
  if (!managerId) {
    return;
  }

  if (employeeId && managerId === employeeId) {
    throw new ApiError(400, "An employee cannot be their own manager.");
  }

  const manager = await Employee.findById(managerId);
  if (!manager) {
    throw new ApiError(400, "Manager reference does not exist.");
  }
}

async function createEmployee(data) {
  await ensureUser(data.user);
  await ensureDepartment(data.department);
  await ensureManager(data.manager);

  const existingProfile = await Employee.findOne({ user: data.user });
  if (existingProfile) {
    throw new ApiError(409, "This user already has an employee profile.");
  }

  return Employee.create(data);
}

async function getEmployeeById(employeeId) {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  return employee;
}

async function updateEmployee(employeeId, data) {
  const employee = await getEmployeeById(employeeId);

  if (data.department) {
    await ensureDepartment(data.department);
  }

  if (Object.prototype.hasOwnProperty.call(data, "manager")) {
    await ensureManager(data.manager, employeeId);
  }

  Object.assign(employee, data);
  await employee.save();
  return employee;
}

async function listEmployees(filters, requester) {
  const query = { ...filters };

  if (requester.role === ROLES.MANAGER) {
    const managerProfile = await Employee.findOne({ user: requester.sub });
    if (!managerProfile) {
      return [];
    }

    query.manager = managerProfile._id;
  }

  return Employee.find(query).sort({ createdAt: -1 });
}

async function canViewEmployee(employee, requester) {
  if ([ROLES.HR, ROLES.ADMIN].includes(requester.role)) {
    return true;
  }

  if (employee.user.toString() === requester.sub) {
    return true;
  }

  if (requester.role !== ROLES.MANAGER) {
    return false;
  }

  const managerProfile = await Employee.findOne({ user: requester.sub });
  return Boolean(managerProfile && employee.manager && employee.manager.toString() === managerProfile._id.toString());
}

module.exports = { canViewEmployee, createEmployee, getEmployeeById, listEmployees, updateEmployee };
