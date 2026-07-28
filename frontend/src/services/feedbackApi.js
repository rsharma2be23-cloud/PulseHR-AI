import { apiRequest } from "./apiClient";

export function listFeedback(filters = {}) { const params = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => value && params.set(key, value)); return apiRequest(`/feedback${params.toString() ? `?${params}` : ""}`, { suppressGlobalError: true }); }
export function getFeedback(id) { return apiRequest(`/feedback/${id}`, { suppressGlobalError: true }); }
export function getEmployeeFeedback(employeeId) { return apiRequest(`/feedback/employee/${employeeId}`, { suppressGlobalError: true }); }
export function submitFeedback(feedback) { return apiRequest("/feedback", { method: "POST", body: JSON.stringify(feedback), suppressGlobalError: true }); }

