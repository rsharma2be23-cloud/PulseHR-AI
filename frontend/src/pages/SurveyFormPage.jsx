import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SurveyForm } from "../components/engagement/SurveyForm";
import { useAuth } from "../features/auth/AuthContext";
import { useToast } from "../features/toasts/ToastContext";
import { ApiClientError } from "../services/apiClient";
import { submitSurvey } from "../services/surveyApi";

export function SurveyFormPage() {
  const navigate = useNavigate(); const { user } = useAuth(); const { showToast } = useToast(); const [error, setError] = useState(""); const [submitting, setSubmitting] = useState(false); const returnPath = user.role === "employee" ? "/dashboard" : "/surveys";
  async function save(payload, setFieldErrors) { setSubmitting(true); try { const result = await submitSurvey(payload); showToast("Survey submitted successfully."); navigate(`/surveys/${result.survey._id}`); } catch (requestError) { if (requestError.details?.length) { const mapped = {}; requestError.details.forEach((detail) => { mapped[detail.field || "form"] = detail.message; }); setFieldErrors(mapped); } else setError(requestError instanceof ApiClientError ? requestError.message : "Unable to submit survey."); } finally { setSubmitting(false); } }
  return <div className="space-y-6"><Link to={returnPath} className="text-sm font-semibold text-indigo-600">← Cancel and go back</Link><div><p className="text-sm font-semibold text-indigo-600">EMPLOYEE VOICE</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Submit survey</h1><p className="mt-2 text-sm text-slate-600">Your response is recorded for the authenticated employee profile.</p></div>{error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</div>}<SurveyForm onSubmit={save} onCancel={() => navigate(returnPath)} isSubmitting={submitting} /></div>;
}
