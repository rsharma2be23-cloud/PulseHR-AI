const { canViewEmployee, getEmployeeById } = require("../services/employee.service");
const { getFeedbackById, listFeedback, submitFeedback } = require("../services/feedback.service");
const { ApiError } = require("../utils/apiError");

async function submit(request, response, next) {
  try {
    const feedback = await submitFeedback(request.body, request.user);
    response.status(201).json({ success: true, data: { feedback } });
  } catch (error) {
    next(error);
  }
}

async function getById(request, response, next) {
  try {
    const feedback = await getFeedbackById(request.params.id);
    const employee = await getEmployeeById(feedback.employee.toString());
    if (!(await canViewEmployee(employee, request.user))) {
      throw new ApiError(403, "You do not have permission to view this feedback.");
    }

    response.status(200).json({ success: true, data: { feedback } });
  } catch (error) {
    next(error);
  }
}

async function getForEmployee(request, response, next) {
  try {
    const employee = await getEmployeeById(request.params.id);
    if (!(await canViewEmployee(employee, request.user))) {
      throw new ApiError(403, "You do not have permission to view this employee's feedback.");
    }

    const feedback = await listFeedback({ employee: request.params.id }, request.user);
    response.status(200).json({ success: true, data: { feedback } });
  } catch (error) {
    next(error);
  }
}

async function list(request, response, next) {
  try {
    const feedback = await listFeedback(request.query, request.user);
    response.status(200).json({ success: true, data: { feedback } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getById, getForEmployee, list, submit };
