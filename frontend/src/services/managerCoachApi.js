import { apiRequest } from "./apiClient";

export function generateManagerCoaching(employeeId) {
  return apiRequest(`/manager-coach/${employeeId}`, { method: "POST", suppressGlobalError: true });
}
