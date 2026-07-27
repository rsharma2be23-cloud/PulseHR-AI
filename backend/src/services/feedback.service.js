const { ROLES } = require("../config/roles");
const { Employee } = require("../models/employee.model");
const { Feedback } = require("../models/feedback.model");
const { ApiError } = require("../utils/apiError");

async function getRequesterEmployee(requester) {
  const employee = await Employee.findOne({ user: requester.sub });
  if (!employee) {
    throw new ApiError(400, "An employee profile is required to submit feedback.");
  }

  return employee;
}

async function getFeedbackById(feedbackId) {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw new ApiError(404, "Feedback not found.");
  }

  return feedback;
}

async function getManagedEmployeeIds(requester) {
  const manager = await Employee.findOne({ user: requester.sub });
  if (!manager) {
    return [];
  }

  const directReports = await Employee.find({ manager: manager._id });
  return [manager._id, ...directReports.map((employee) => employee._id)];
}

async function submitFeedback(data, requester) {
  const employee = await getRequesterEmployee(requester);
  return Feedback.create({ employee: employee._id, text: data.text });
}

async function listFeedback(filters, requester) {
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

  return Feedback.find(query).sort({ submittedAt: -1 });
}

module.exports = { getFeedbackById, listFeedback, submitFeedback };
