import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { ApiClientError } from "../services/apiClient";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(""); setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate(location.state?.from?.pathname ?? "/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.message : "Unable to sign in. Please try again.");
    } finally { setIsSubmitting(false); }
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-indigo-500 font-bold">P</div><span className="text-lg font-semibold">PulseHR</span></div>
        <div className="max-w-lg"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-300">Workforce intelligence</p><h1 className="mt-5 text-5xl font-bold tracking-tight">A clearer view of your people operations.</h1><p className="mt-6 text-lg leading-8 text-slate-300">Secure, role-aware access to workforce records and the insights that support better conversations.</p></div>
        <p className="text-sm text-slate-500">PulseHR AI · Authorized access only</p>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="lg:hidden"><p className="text-sm font-semibold text-indigo-600">PulseHR</p></div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Welcome back</h2><p className="mt-2 text-sm leading-6 text-slate-600">Sign in with your authorized PulseHR account.</p>
          {error && <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</div>}
          <label className="mt-7 block text-sm font-semibold text-slate-700">Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500" /></label>
          <label className="mt-5 block text-sm font-semibold text-slate-700">Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500" /></label>
          <button disabled={isSubmitting} className="mt-7 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Signing in…" : "Sign in"}</button>
        </form>
      </section>
    </main>
  );
}
