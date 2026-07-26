const {
  createDepartment,
  getDepartmentById,
  listDepartments,
  updateDepartment,
} = require("../services/department.service");

async function create(request, response, next) {
  try {
    const department = await createDepartment(request.body);
    response.status(201).json({ success: true, data: { department } });
  } catch (error) {
    next(error);
  }
}

async function getById(request, response, next) {
  try {
    const department = await getDepartmentById(request.params.id);
    response.status(200).json({ success: true, data: { department } });
  } catch (error) {
    next(error);
  }
}

async function list(_request, response, next) {
  try {
    const departments = await listDepartments();
    response.status(200).json({ success: true, data: { departments } });
  } catch (error) {
    next(error);
  }
}

async function update(request, response, next) {
  try {
    const department = await updateDepartment(request.params.id, request.body);
    response.status(200).json({ success: true, data: { department } });
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getById, list, update };
