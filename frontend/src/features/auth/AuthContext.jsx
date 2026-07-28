import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, login as loginRequest } from "../../services/authApi";
import { setAccessToken, setUnauthorizedHandler } from "../../services/apiClient";
import { clearSession, loadSession, saveSession } from "./authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearSession();
    setAccessToken(null);
    setSession(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    const storedSession = loadSession();
    if (!storedSession?.token || !storedSession?.user) { setIsLoading(false); return undefined; }

    setAccessToken(storedSession.token);
    getCurrentUser()
      .then(({ user: tokenUser }) => {
        const refreshedSession = { token: storedSession.token, user: { ...storedSession.user, ...tokenUser } };
        saveSession(refreshedSession);
        setSession(refreshedSession);
      })
      .catch(logout)
      .finally(() => setIsLoading(false));

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(async (credentials) => {
    const result = await loginRequest(credentials);
    const nextSession = { token: result.token, user: result.user };
    saveSession(nextSession);
    setAccessToken(nextSession.token);
    setSession(nextSession);
    return result.user;
  }, []);

  const value = useMemo(() => ({ user: session?.user ?? null, isAuthenticated: Boolean(session), isLoading, login, logout }), [isLoading, login, logout, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
