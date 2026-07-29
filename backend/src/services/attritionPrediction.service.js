const { ROLES } = require("../config/roles");
const { AttritionPrediction } = require("../models/attritionPrediction.model");
const { Employee } = require("../models/employee.model");
const { ApiError } = require("../utils/apiError");
const { predictAttrition } = require("../clients/ml.client");
const { buildAttritionFeatures } = require("./attritionFeature.service");

async function createAttritionPrediction(employee) {
  const { features, defaults } = await buildAttritionFeatures(employee);
  const response = await predictAttrition(features);
  return AttritionPrediction.create({ employee: employee._id, probability: response.attritionProbability, riskLevel: response.riskLevel, prediction: response.prediction, threshold: response.decisionThreshold, modelVersion: response.modelVersion, mappingDefaults: defaults, explanations: response.explanations, shapValues: response.shapValues });
}

async function getPredictionHistory(employeeId) { return AttritionPrediction.find({ employee: employeeId }).sort({ predictedAt: -1 }); }

async function authorizedEmployeeIds(requester) {
  if ([ROLES.HR, ROLES.ADMIN].includes(requester.role)) return null;
  const manager = await Employee.findOne({ user: requester.sub });
  if (!manager) return [];
  const directReports = await Employee.find({ manager: manager._id }).select("_id");
  return [manager._id, ...directReports.map((employee) => employee._id)];
}

async function listLatestPredictions(requester) {
  const employeeIds = await authorizedEmployeeIds(requester);
  const query = employeeIds === null ? {} : { employee: { $in: employeeIds } };
  const records = await AttritionPrediction.find(query).sort({ predictedAt: -1 }).populate("employee", "employeeCode designation");
  const seen = new Set();
  return records.filter((record) => { const key = record.employee?._id?.toString() ?? record.employee.toString(); if (seen.has(key)) return false; seen.add(key); return true; });
}

module.exports = { createAttritionPrediction, getPredictionHistory, listLatestPredictions };
