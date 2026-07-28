import { apiRequest } from "./apiClient";

export function listEmployees(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
  return apiRequest(`/employees${params.toString() ? `?${params}` : ""}`);
}

export function getEmployee(id) { return apiRequest(`/employees/${id}`); }
export function createEmployee(employee) { return apiRequest("/employees", { method: "POST", body: JSON.stringify(employee), suppressGlobalError: true }); }
export function updateEmployee(id, employee) { return apiRequest(`/employees/${id}`, { method: "PATCH", body: JSON.stringify(employee), suppressGlobalError: true }); }

