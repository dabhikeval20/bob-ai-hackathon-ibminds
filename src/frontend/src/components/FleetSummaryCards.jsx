import KpiCard from './KpiCard';

export default function FleetSummaryCards({ stats }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Total vehicles" value={stats.totalVehicles} detail="Tracked in fleet" tone="cyan" /><KpiCard label="Available vehicles" value={stats.availableVehicles} detail="Ready for review" tone="emerald" /><KpiCard label="Assigned vehicles" value={stats.assignedVehicles} detail="Assigned or in transit" tone="cyan" /><KpiCard label="Idle vehicles" value={stats.idleVehicles} detail="Below 25% utilization" tone="amber" /><KpiCard label="Average utilization" value={`${stats.averageUtilization}%`} detail="Across total fleet" tone="cyan" /><KpiCard label="Unavailable vehicles" value={stats.unavailableVehicles} detail="Maintenance or offline" tone="rose" /><KpiCard label="Overutilized vehicles" value={stats.overutilizedVehicles} detail="At least 90% utilized" tone="amber" /></div>;
}
