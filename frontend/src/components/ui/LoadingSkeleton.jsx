export function LoadingSkeleton({ rows = 5 }) { return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{Array.from({ length: rows }, (_, index) => <div key={index} className="mb-4 h-5 animate-pulse rounded bg-slate-100 last:mb-0" />)}</div>; }

