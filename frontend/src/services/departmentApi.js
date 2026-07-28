import { apiRequest } from "./apiClient";

export function listDepartments() { return apiRequest("/departments", { suppressGlobalError: true }); }
export function getDepartment(id) { return apiRequest(`/departments/${id}`); }
export function createDepartment(department) { return apiRequest("/departments", { method: "POST", body: JSON.stringify(department), suppressGlobalError: true }); }
export function updateDepartment(id, department) { return apiRequest(`/departments/${id}`, { method: "PATCH", body: JSON.stringify(department), suppressGlobalError: true }); }
