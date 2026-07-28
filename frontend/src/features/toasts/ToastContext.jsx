import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500);
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return <ToastContext.Provider value={value}>{children}<div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md flex-col gap-2" aria-live="polite">{toasts.map((toast) => <div key={toast.id} className={`rounded-xl border bg-white px-4 py-3 text-sm font-medium shadow-xl ${toast.type === "error" ? "border-rose-200 text-rose-800" : "border-emerald-200 text-emerald-800"}`}>{toast.message}</div>)}</div></ToastContext.Provider>;
}

export function useToast() { return useContext(ToastContext); }

