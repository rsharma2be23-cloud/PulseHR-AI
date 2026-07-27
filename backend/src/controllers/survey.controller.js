const { canViewEmployee, getEmployeeById } = require("../services/employee.service");
const { getSurveyById, listSurveys, submitSurvey } = require("../services/survey.service");
const { ApiError } = require("../utils/apiError");

async function submit(request, response, next) {
  try {
    const survey = await submitSurvey(request.body, request.user);
    response.status(201).json({ success: true, data: { survey } });
  } catch (error) {
    next(error);
  }
}

async function getById(request, response, next) {
  try {
    const survey = await getSurveyById(request.params.id);
    const employee = await getEmployeeById(survey.employee.toString());
    if (!(await canViewEmployee(employee, request.user))) {
      throw new ApiError(403, "You do not have permission to view this survey.");
    }

    response.status(200).json({ success: true, data: { survey } });
  } catch (error) {
    next(error);
  }
}

async function getForEmployee(request, response, next) {
  try {
    const employee = await getEmployeeById(request.params.id);
    if (!(await canViewEmployee(employee, request.user))) {
      throw new ApiError(403, "You do not have permission to view this employee's surveys.");
    }

    const surveys = await listSurveys({ employee: request.params.id }, request.user);
    response.status(200).json({ success: true, data: { surveys } });
  } catch (error) {
    next(error);
  }
}

async function list(request, response, next) {
  try {
    const surveys = await listSurveys(request.query, request.user);
    response.status(200).json({ success: true, data: { surveys } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getById, getForEmployee, list, submit };
