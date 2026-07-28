import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { setApiErrorHandler } from "../../services/apiClient";

const ApiErrorContext = createContext(null);

export function ApiErrorProvider({ children }) {
  const [error, setError] = useState(null);
  const showError = useCallback((message) => setError(message), []);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    setApiErrorHandler(showError);
    return () => setApiErrorHandler(null);
  }, [showError]);

  return (
    <ApiErrorContext.Provider value={{ showError, clearError }}>
      {children}
      {error && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg items-start justify-between gap-4 rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-900 shadow-xl" role="alert">
          <span>{error}</span>
          <button className="font-semibold text-rose-700" onClick={clearError} aria-label="Dismiss error">Dismiss</button>
        </div>
      )}
    </ApiErrorContext.Provider>
  );
}

export function useApiError() {
  const context = useContext(ApiErrorContext);
  if (!context) throw new Error("useApiError must be used within ApiErrorProvider.");
  return context;
}
