import KpiCard from './KpiCard';

export default function RiskSummaryCards({ summary }) {
  const levels = summary?.riskLevels || {};
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><KpiCard label="Low risk" value={levels.LOW || 0} detail="Routine monitoring" tone="emerald" /><KpiCard label="Medium risk" value={levels.MEDIUM || 0} detail="Watch next checkpoint" tone="cyan" /><KpiCard label="High risk" value={levels.HIGH || 0} detail="Operational review" tone="amber" /><KpiCard label="Critical risk" value={levels.CRITICAL || 0} detail="Immediate escalation" tone="rose" /></div>;
}
