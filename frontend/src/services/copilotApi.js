import { apiRequest } from "./apiClient";

export function askCopilot(payload) {
  return apiRequest("/copilot/chat", { method: "POST", body: JSON.stringify(payload), suppressGlobalError: true });
}
