import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const roleLabels = { employee: "Employee", manager: "Manager", hr: "HR", admin: "Administrator" };

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const initial = user.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {isSidebarOpen && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" aria-label="Close navigation" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-slate-950 px-4 py-5 text-slate-100 transition-transform lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-3">
          <div className="grid size-10 place-items-center rounded-xl bg-indigo-500 font-bold shadow-lg shadow-indigo-500/25">P</div>
          <div><p className="font-semibold tracking-tight">PulseHR</p><p className="text-xs text-slate-400">Workforce intelligence</p></div>
        </div>
        <nav className="mt-10 space-y-1" aria-label="Primary navigation">
          <NavItem to="/dashboard" label="Dashboard" onClick={() => setIsSidebarOpen(false)} />
          {['manager', 'hr', 'admin'].includes(user.role) && <NavItem to="/employees" label="Employees" onClick={() => setIsSidebarOpen(false)} />}
          {['hr', 'admin'].includes(user.role) && <NavItem to="/departments" label="Departments" onClick={() => setIsSidebarOpen(false)} />}
          {['manager', 'hr', 'admin'].includes(user.role) && <NavItem to="/attendance" label="Attendance" onClick={() => setIsSidebarOpen(false)} />}
          {['manager', 'hr', 'admin'].includes(user.role) && <NavItem to="/performance-reviews" label="Performance reviews" onClick={() => setIsSidebarOpen(false)} />}
          {['manager', 'hr', 'admin'].includes(user.role) && <NavItem to="/surveys" label="Surveys" onClick={() => setIsSidebarOpen(false)} />}
          {['manager', 'hr', 'admin'].includes(user.role) && <NavItem to="/feedback" label="Feedback" onClick={() => setIsSidebarOpen(false)} />}
        </nav>
        <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs leading-5 text-slate-400">
          <span className="font-semibold text-slate-200">Advisory platform</span><br />
          Workforce records and insights are governed by your assigned access.
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setIsSidebarOpen(true)} aria-label="Open navigation">☰</button>
          <div className="hidden lg:block"><p className="text-sm font-medium text-slate-700">PulseHR workspace</p></div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-slate-500">{roleLabels[user.role] ?? user.role}</p></div>
            <div className="grid size-9 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{initial}</div>
            <button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Log out</button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

function NavItem({ to, label, onClick }) {
  return <NavLink to={to} onClick={onClick} className={({ isActive }) => `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-indigo-500 text-white shadow" : "text-slate-300 hover:bg-slate-900 hover:text-white"}`}>{label}</NavLink>;
}
