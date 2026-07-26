const { canViewEmployee, getEmployeeById } = require("../services/employee.service");
const {
  createPerformanceReview,
  getReviewById,
  listReviews,
  updatePerformanceReview,
} = require("../services/performanceReview.service");
const { ApiError } = require("../utils/apiError");

async function create(request, response, next) {
  try {
    const review = await createPerformanceReview(request.body, request.user);
    response.status(201).json({ success: true, data: { review } });
  } catch (error) {
    next(error);
  }
}

async function getById(request, response, next) {
  try {
    const review = await getReviewById(request.params.id);
    const employee = await getEmployeeById(review.employee.toString());
    if (!(await canViewEmployee(employee, request.user))) {
      throw new ApiError(403, "You do not have permission to view this performance review.");
    }

    response.status(200).json({ success: true, data: { review } });
  } catch (error) {
    next(error);
  }
}

async function getForEmployee(request, response, next) {
  try {
    const employee = await getEmployeeById(request.params.id);
    if (!(await canViewEmployee(employee, request.user))) {
      throw new ApiError(403, "You do not have permission to view this employee's performance reviews.");
    }

    const reviews = await listReviews({ employee: request.params.id }, request.user);
    response.status(200).json({ success: true, data: { reviews } });
  } catch (error) {
    next(error);
  }
}

async function list(request, response, next) {
  try {
    const reviews = await listReviews(request.query, request.user);
    response.status(200).json({ success: true, data: { reviews } });
  } catch (error) {
    next(error);
  }
}

async function update(request, response, next) {
  try {
    const review = await updatePerformanceReview(request.params.id, request.body, request.user);
    response.status(200).json({ success: true, data: { review } });
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getById, getForEmployee, list, update };
