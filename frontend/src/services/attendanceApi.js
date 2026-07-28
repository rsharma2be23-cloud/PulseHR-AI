import { apiRequest } from "./apiClient";

export function listAttendance(filters = {}) { const params = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => value && params.set(key, value)); return apiRequest(`/attendance${params.toString() ? `?${params}` : ""}`, { suppressGlobalError: true }); }
export function getEmployeeAttendance(employeeId) { return apiRequest(`/attendance/employee/${employeeId}`, { suppressGlobalError: true }); }
export function createAttendance(attendance) { return apiRequest("/attendance", { method: "POST", body: JSON.stringify(attendance), suppressGlobalError: true }); }
export function updateAttendance(id, attendance) { return apiRequest(`/attendance/${id}`, { method: "PATCH", body: JSON.stringify(attendance), suppressGlobalError: true }); }

