const { ApiError } = require("../utils/apiError");
const { canViewEmployee, getEmployeeById } = require("../services/employee.service");
const { createAttritionPrediction, getPredictionHistory, listLatestPredictions } = require("../services/attritionPrediction.service");

async function predict(request, response, next) {
  try {
    const employee = await getEmployeeById(request.params.id);
    if (!(await canViewEmployee(employee, request.user))) throw new ApiError(403, "You do not have permission to predict attrition for this employee.");
    const prediction = await createAttritionPrediction(employee);
    response.status(201).json({ success: true, data: { prediction } });
  } catch (error) { next(error); }
}

async function history(request, response, next) {
  try {
    const employee = await getEmployeeById(request.params.id);
    if (!(await canViewEmployee(employee, request.user))) throw new ApiError(403, "You do not have permission to view this employee's prediction history.");
    const predictions = await getPredictionHistory(employee._id);
    response.status(200).json({ success: true, data: { predictions } });
  } catch (error) { next(error); }
}

async function latest(request, response, next) {
  try { const predictions = await listLatestPredictions(request.user); response.status(200).json({ success: true, data: { predictions } }); } catch (error) { next(error); }
}

module.exports = { predict, history, latest };

