import { apiRequest } from "./apiClient";

export function predictEmployeeAttrition(employeeId) { return apiRequest(`/employees/${employeeId}/predict-attrition`, { method: "POST", suppressGlobalError: true }); }
export function getEmployeePredictionHistory(employeeId) { return apiRequest(`/employees/${employeeId}/predictions`, { suppressGlobalError: true }); }
export function listLatestAttritionPredictions() { return apiRequest("/attrition-predictions", { suppressGlobalError: true }); }

