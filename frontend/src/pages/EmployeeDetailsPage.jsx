import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmployeeCard } from "../components/employees/EmployeeCard";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { getEmployee } from "../services/employeeApi";
import { ApiClientError } from "../services/apiClient";
import { useToast } from "../features/toasts/ToastContext";

export function EmployeeDetailsPage() { const { id } = useParams(); const navigate = useNavigate(); const { showToast } = useToast(); const [employee, setEmployee] = useState(null); const [error, setError] = useState(""); useEffect(() => { getEmployee(id).then((result) => setEmployee(result.employee)).catch((requestError) => setError(requestError instanceof ApiClientError ? requestError.message : "Unable to load this employee.")); }, [id]); return <div className="space-y-6"><div className="flex items-center justify-between gap-3"><Link to="/employees" className="text-sm font-semibold text-indigo-600">← Back to employees</Link>{employee && <button onClick={() => navigate(`/employees/${id}/edit`)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Edit profile</button>}</div>{error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800" role="alert">{error}</div> : employee ? <><div><p className="text-sm font-semibold text-indigo-600">EMPLOYEE PROFILE</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Professional profile</h1></div><EmployeeCard employee={employee} /></> : <LoadingSkeleton rows={6} />}</div>; }

