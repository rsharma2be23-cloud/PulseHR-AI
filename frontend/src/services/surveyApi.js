import { apiRequest } from "./apiClient";

export function listSurveys(filters = {}) { const params = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => value && params.set(key, value)); return apiRequest(`/surveys${params.toString() ? `?${params}` : ""}`, { suppressGlobalError: true }); }
export function getSurvey(id) { return apiRequest(`/surveys/${id}`, { suppressGlobalError: true }); }
export function getEmployeeSurveys(employeeId) { return apiRequest(`/surveys/employee/${employeeId}`, { suppressGlobalError: true }); }
export function submitSurvey(survey) { return apiRequest("/surveys", { method: "POST", body: JSON.stringify(survey), suppressGlobalError: true }); }

