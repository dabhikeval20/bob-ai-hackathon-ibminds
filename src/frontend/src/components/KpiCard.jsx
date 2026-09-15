const tones = {
  cyan: 'kpi-cyan',
  amber: 'kpi-amber',
  rose: 'kpi-rose',
  emerald: 'kpi-emerald'
};

export default function KpiCard({ label, value, detail, tone = 'cyan' }) {
  return (
    <article className={`kpi-card ${tones[tone] || tones.cyan}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <span className="kpi-pulse" aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
