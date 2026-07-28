import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center"><div><p className="text-sm font-semibold text-indigo-600">404</p><h1 className="mt-3 text-3xl font-bold">This page does not exist.</h1><p className="mt-3 text-slate-600">The address may be incorrect or the page may have moved.</p><Link to="/dashboard" className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Go to dashboard</Link></div></main>;
}
