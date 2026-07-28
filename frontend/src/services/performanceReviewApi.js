import { apiRequest } from "./apiClient";

export function listPerformanceReviews(filters = {}) { const params = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => value && params.set(key, value)); return apiRequest(`/performance-reviews${params.toString() ? `?${params}` : ""}`, { suppressGlobalError: true }); }
export function getPerformanceReview(id) { return apiRequest(`/performance-reviews/${id}`, { suppressGlobalError: true }); }
export function getEmployeeReviews(employeeId) { return apiRequest(`/performance-reviews/employee/${employeeId}`, { suppressGlobalError: true }); }
export function createPerformanceReview(review) { return apiRequest("/performance-reviews", { method: "POST", body: JSON.stringify(review), suppressGlobalError: true }); }
export function updatePerformanceReview(id, review) { return apiRequest(`/performance-reviews/${id}`, { method: "PATCH", body: JSON.stringify(review), suppressGlobalError: true }); }

