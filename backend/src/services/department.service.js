const { Department } = require("../models/department.model");
const { Employee } = require("../models/employee.model");
const { ApiError } = require("../utils/apiError");

async function ensureManager(managerId) {
  if (!managerId) {
    return;
  }

  const manager = await Employee.findById(managerId);
  if (!manager) {
    throw new ApiError(400, "Manager reference does not exist.");
  }
}

async function createDepartment(data) {
  await ensureManager(data.manager);
  return Department.create(data);
}

async function getDepartmentById(departmentId) {
  const department = await Department.findById(departmentId);
  if (!department) {
    throw new ApiError(404, "Department not found.");
  }

  return department;
}

async function updateDepartment(departmentId, data) {
  const department = await getDepartmentById(departmentId);

  if (Object.prototype.hasOwnProperty.call(data, "manager")) {
    await ensureManager(data.manager);
  }

  Object.assign(department, data);
  await department.save();
  return department;
}

async function listDepartments() {
  return Department.find().sort({ name: 1 });
}

module.exports = { createDepartment, getDepartmentById, listDepartments, updateDepartment };
