const { ApiError } = require("../utils/apiError");
const {
  canViewEmployee,
  createEmployee,
  getEmployeeById,
  listEmployees,
  updateEmployee,
} = require("../services/employee.service");
const { predict, history } = require("./attritionPrediction.controller");

async function create(request, response, next) {
  try {
    const employee = await createEmployee(request.body);
    response.status(201).json({ success: true, data: { employee } });
  } catch (error) {
    next(error);
  }
}

async function getById(request, response, next) {
  try {
    const employee = await getEmployeeById(request.params.id);
    if (!(await canViewEmployee(employee, request.user))) {
      throw new ApiError(403, "You do not have permission to view this employee profile.");
    }

    response.status(200).json({ success: true, data: { employee } });
  } catch (error) {
    next(error);
  }
}

async function list(request, response, next) {
  try {
    const employees = await listEmployees(request.query, request.user);
    response.status(200).json({ success: true, data: { employees } });
  } catch (error) {
    next(error);
  }
}

async function update(request, response, next) {
  try {
    const employee = await updateEmployee(request.params.id, request.body);
    response.status(200).json({ success: true, data: { employee } });
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getById, list, update, predict, history };
