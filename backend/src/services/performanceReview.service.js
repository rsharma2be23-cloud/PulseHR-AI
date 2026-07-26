const { ROLES } = require("../config/roles");
const { Employee } = require("../models/employee.model");
const { PerformanceReview } = require("../models/performanceReview.model");
const { User } = require("../models/user.model");
const { ApiError } = require("../utils/apiError");

async function getEmployee(employeeId) {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new ApiError(400, "Employee reference does not exist.");
  }

  return employee;
}

async function ensureReviewer(reviewerId) {
  const reviewer = await User.findById(reviewerId);
  if (!reviewer) {
    throw new ApiError(400, "Reviewer reference does not exist.");
  }
}

async function getManagerProfile(requester) {
  return Employee.findOne({ user: requester.sub });
}

async function canManageReview(employee, reviewerId, requester) {
  if (employee.user.toString() === requester.sub) {
    return false;
  }

  if ([ROLES.HR, ROLES.ADMIN].includes(requester.role)) {
    return true;
  }

  if (requester.role !== ROLES.MANAGER || reviewerId !== requester.sub) {
    return false;
  }

  const manager = await getManagerProfile(requester);
  return Boolean(manager && employee.manager && employee.manager.toString() === manager._id.toString());
}

async function createPerformanceReview(data, requester) {
  const employee = await getEmployee(data.employee);
  await ensureReviewer(data.reviewer);

  if (!(await canManageReview(employee, data.reviewer, requester))) {
    throw new ApiError(403, "You do not have permission to create this performance review.");
  }

  return PerformanceReview.create(data);
}

async function getReviewById(reviewId) {
  const review = await PerformanceReview.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Performance review not found.");
  }

  return review;
}

async function listReviews(filters, requester) {
  const query = { ...filters };

  if (requester.role === ROLES.MANAGER) {
    const manager = await getManagerProfile(requester);
    if (!manager) {
      return [];
    }

    const directReports = await Employee.find({ manager: manager._id });
    const employeeIds = [manager._id, ...directReports.map((employee) => employee._id)];
    query.employee = filters.employee && employeeIds.some((id) => id.toString() === filters.employee)
      ? filters.employee
      : { $in: employeeIds };
  }

  return PerformanceReview.find(query).sort({ createdAt: -1 });
}

async function updatePerformanceReview(reviewId, data, requester) {
  const review = await getReviewById(reviewId);
  const employee = await getEmployee(data.employee || review.employee.toString());
  const reviewerId = data.reviewer || review.reviewer.toString();

  if (data.reviewer) {
    await ensureReviewer(data.reviewer);
  }

  if (!(await canManageReview(employee, reviewerId, requester))) {
    throw new ApiError(403, "You do not have permission to update this performance review.");
  }

  Object.assign(review, data);
  await review.save();
  return review;
}

module.exports = { createPerformanceReview, getReviewById, listReviews, updatePerformanceReview };
