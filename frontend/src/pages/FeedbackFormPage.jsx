import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FeedbackForm } from "../components/engagement/FeedbackForm";
import { useAuth } from "../features/auth/AuthContext";
import { useToast } from "../features/toasts/ToastContext";
import { ApiClientError } from "../services/apiClient";
import { submitFeedback } from "../services/feedbackApi";

export function FeedbackFormPage() {
  const navigate = useNavigate(); const { user } = useAuth(); const { showToast } = useToast(); const [error, setError] = useState(""); const [submitting, setSubmitting] = useState(false); const returnPath = user.role === "employee" ? "/dashboard" : "/feedback";
  async function save(payload, setFieldErrors) { setSubmitting(true); try { const result = await submitFeedback(payload); showToast("Feedback submitted successfully."); navigate(`/feedback/${result.feedback._id}`); } catch (requestError) { if (requestError.details?.length) { const mapped = {}; requestError.details.forEach((detail) => { mapped[detail.field || "form"] = detail.message; }); setFieldErrors(mapped); } else setError(requestError instanceof ApiClientError ? requestError.message : "Unable to submit feedback."); } finally { setSubmitting(false); } }
  return <div className="space-y-6"><Link to={returnPath} className="text-sm font-semibold text-indigo-600">← Cancel and go back</Link><div><p className="text-sm font-semibold text-indigo-600">EMPLOYEE VOICE</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Submit feedback</h1><p className="mt-2 text-sm text-slate-600">Your feedback is submitted for the authenticated employee profile.</p></div>{error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</div>}<FeedbackForm onSubmit={save} onCancel={() => navigate(returnPath)} isSubmitting={submitting} /></div>;
}
