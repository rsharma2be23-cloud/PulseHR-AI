import { apiRequest } from "./apiClient";

export function login(credentials) {
  return apiRequest("/auth/login", { method: "POST", body: JSON.stringify(credentials), suppressGlobalError: true });
}

export function getCurrentUser() {
  return apiRequest("/auth/me");
}
