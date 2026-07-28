import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AttritionPredictionCard } from "../components/employees/AttritionPredictionCard";
import { EmployeeCard } from "../components/employees/EmployeeCard";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { useAuth } from "../features/auth/AuthContext";
import { useToast } from "../features/toasts/ToastContext";
import { getEmployeePredictionHistory, predictEmployeeAttrition } from "../services/attritionPredictionApi";
import { ApiClientError } from "../services/apiClient";
import { getEmployee } from "../services/employeeApi";

export function EmployeeDetailsPage() {
  const { id } = useParams(); const navigate = useNavigate(); const { user } = useAuth(); const { showToast } = useToast(); const [employee, setEmployee] = useState(null); const [prediction, setPrediction] = useState(null); const [error, setError] = useState(""); const [predicting, setPredicting] = useState(false); const canPredict = ["manager", "hr", "admin"].includes(user.role);
  useEffect(() => { getEmployee(id).then((result) => setEmployee(result.employee)).catch((requestError) => setError(requestError instanceof ApiClientError ? requestError.message : "Unable to load this employee.")); getEmployeePredictionHistory(id).then((result) => setPrediction(result.predictions?.[0] ?? null)).catch(() => setPrediction(null)); }, [id]);
  async function runPrediction() { setPredicting(true); try { const result = await predictEmployeeAttrition(id); setPrediction(result.prediction); showToast("Attrition prediction generated."); } catch (requestError) { setError(requestError instanceof ApiClientError ? requestError.message : "Unable to generate attrition prediction."); } finally { setPredicting(false); } }
  return <div className="space-y-6"><div className="flex items-center justify-between gap-3"><Link to="/employees" className="text-sm font-semibold text-indigo-600">← Back to employees</Link>{employee && ["hr", "admin"].includes(user.role) && <button onClick={() => navigate(`/employees/${id}/edit`)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Edit profile</button>}</div>{error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800" role="alert">{error}</div> : employee ? <><div><p className="text-sm font-semibold text-indigo-600">EMPLOYEE PROFILE</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Professional profile</h1></div><EmployeeCard employee={employee} /><AttritionPredictionCard prediction={prediction} onPredict={runPrediction} isPredicting={predicting} canPredict={canPredict} /></> : <LoadingSkeleton rows={6} />}</div>;
}
