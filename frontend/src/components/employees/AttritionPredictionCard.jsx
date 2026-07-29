import { formatDate } from "../../features/engagement/engagementUtils";

const tone = { low: "border-emerald-200 bg-emerald-50 text-emerald-800", medium: "border-amber-200 bg-amber-50 text-amber-800", high: "border-rose-200 bg-rose-50 text-rose-800" };

export function AttritionPredictionCard({ prediction, onPredict, isPredicting, canPredict }) {
  const explanations = prediction?.explanations ?? prediction?.topContributingFeatures ?? [];
  const maxImportance = Math.max(...explanations.map((item) => item.importance ?? Math.abs(item.contribution ?? 0)), 1);
  const riskFactors = explanations.filter((item) => item.direction === "increase risk");
  const protectiveFactors = explanations.filter((item) => item.direction === "decrease risk");

  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attrition intelligence</p><h2 className="mt-2 text-xl font-bold">Latest prediction</h2></div>{canPredict && <button disabled={isPredicting} onClick={onPredict} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{isPredicting ? "Running prediction…" : prediction ? "Refresh prediction" : "Predict attrition"}</button>}</div>
    {prediction ? <>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Probability" value={`${(prediction.probability * 100).toFixed(1)}%`} /><Metric label="Risk level" value={<span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone[prediction.riskLevel] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>{prediction.riskLevel}</span>} /><Metric label="Prediction" value={prediction.prediction === "attrition" ? "Attrition risk" : "Likely to stay"} /><Metric label="Model version" value={prediction.modelVersion} /><Metric label="Predicted" value={formatDate(prediction.predictedAt)} /></div>
      {explanations.length ? <div className="mt-8 grid gap-6 lg:grid-cols-2"><FactorGroup title="Top risk factors" subtitle="Signals increasing predicted attrition risk" factors={riskFactors} maxImportance={maxImportance} positive /><FactorGroup title="Top protective factors" subtitle="Signals reducing predicted attrition risk" factors={protectiveFactors} maxImportance={maxImportance} /></div> : <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Explanations are not available for this historical prediction.</p>}
    </> : <p className="mt-5 text-sm leading-6 text-slate-600">No attrition prediction has been recorded for this employee yet.</p>}
  </section>;
}

function FactorGroup({ title, subtitle, factors, maxImportance, positive }) { return <div><div className="mb-3"><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div>{factors.length ? <div className="space-y-3">{factors.map((item) => <div key={`${item.rank}-${item.feature}`} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-slate-800">{item.rank}. {item.feature}</span><span className={`font-semibold ${positive ? "text-rose-600" : "text-emerald-600"}`}>{item.contribution > 0 ? "+" : ""}{Number(item.contribution).toFixed(3)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${positive ? "bg-rose-400" : "bg-emerald-400"}`} style={{ width: `${Math.max(6, ((item.importance ?? Math.abs(item.contribution)) / maxImportance) * 100)}%` }} /></div><p className="mt-1 text-right text-[11px] uppercase tracking-wide text-slate-400">{item.direction}</p></div>)}</div> : <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">None in the top ranked factors.</p>}</div>; }
function Metric({ label, value }) { return <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><div className="mt-2 text-sm font-semibold text-slate-900">{value}</div></div>; }
