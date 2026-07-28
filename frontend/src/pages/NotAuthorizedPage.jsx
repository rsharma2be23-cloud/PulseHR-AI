import { Link } from "react-router-dom";

export function NotAuthorizedPage() {
  return <section className="grid min-h-[60vh] place-items-center text-center"><div><p className="text-sm font-semibold text-indigo-600">ACCESS RESTRICTED</p><h1 className="mt-3 text-3xl font-bold">You do not have access to this area.</h1><p className="mt-3 text-slate-600">Your account role does not permit this action. Contact an administrator if you believe this is incorrect.</p><Link to="/dashboard" className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Return to dashboard</Link></div></section>;
}
