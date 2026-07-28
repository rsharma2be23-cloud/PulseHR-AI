import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./features/auth/AuthContext";
import { ApiErrorProvider } from "./features/api-errors/ApiErrorContext";
import { ToastProvider } from "./features/toasts/ToastContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ApiErrorProvider><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></ApiErrorProvider>
    </BrowserRouter>
  </StrictMode>,
);
