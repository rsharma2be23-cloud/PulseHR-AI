const { ROLES } = require("../config/roles");
const { Employee } = require("../models/employee.model");
const { Survey } = require("../models/survey.model");
const { ApiError } = require("../utils/apiError");

async function getRequesterEmployee(requester) {
  const employee = await Employee.findOne({ user: requester.sub });
  if (!employee) {
    throw new ApiError(400, "An employee profile is required to submit a survey.");
  }

  return employee;
}

async function getSurveyById(surveyId) {
  const survey = await Survey.findById(surveyId);
  if (!survey) {
    throw new ApiError(404, "Survey not found.");
  }

  return survey;
}

async function getManagedEmployeeIds(requester) {
  const manager = await Employee.findOne({ user: requester.sub });
  if (!manager) {
    return [];
  }

  const directReports = await Employee.find({ manager: manager._id });
  return [manager._id, ...directReports.map((employee) => employee._id)];
}

async function submitSurvey(data, requester) {
  const employee = await getRequesterEmployee(requester);
  return Survey.create({ ...data, employee: employee._id });
}

async function listSurveys(filters, requester) {
  const query = {};

  if (filters.employee) query.employee = filters.employee;
  if (filters.from || filters.to) {
    query.submittedAt = {};
    if (filters.from) query.submittedAt.$gte = filters.from;
    if (filters.to) query.submittedAt.$lte = filters.to;
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

  return Survey.find(query).sort({ submittedAt: -1 });
}

module.exports = { getSurveyById, listSurveys, submitSurvey };
