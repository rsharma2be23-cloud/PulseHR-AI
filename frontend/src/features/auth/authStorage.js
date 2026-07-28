const SESSION_KEY = "pulsehr.session";

export function loadSession() {
  try {
    const value = sessionStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch { return null; }
}

export function saveSession(session) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
export function clearSession() { sessionStorage.removeItem(SESSION_KEY); }
