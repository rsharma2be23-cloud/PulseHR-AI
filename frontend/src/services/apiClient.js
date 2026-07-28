import { API_BASE_URL } from "../config/env";

export class ApiClientError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

let accessToken = null;
let onUnauthorized = null;
let onApiError = null;

export function setAccessToken(token) { accessToken = token; }
export function setUnauthorizedHandler(handler) { onUnauthorized = handler; }
export function setApiErrorHandler(handler) { onApiError = handler; }

function reportError(error, options) {
  if (!options.suppressGlobalError) onApiError?.(error.message);
  return error;
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw reportError(new ApiClientError("Unable to reach the PulseHR API. Check that the backend is running."), options);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok || payload?.success === false) {
    const error = new ApiClientError(payload?.message ?? "The request could not be completed.", {
      status: response.status,
      details: payload?.details,
    });
    if (response.status === 401) onUnauthorized?.();
    throw reportError(error, options);
  }

  return payload?.data;
}
