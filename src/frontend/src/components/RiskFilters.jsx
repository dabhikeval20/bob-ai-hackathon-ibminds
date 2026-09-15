export default function RiskFilters({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Risk shipment filters">
      <label className="filter-control"><span className="sr-only">Risk level</span><select value={filters.riskLevel} onChange={(event) => onChange({ ...filters, riskLevel: event.target.value })}><option value="">All risk levels</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></label>
      <label className="filter-control"><span className="sr-only">Shipment priority</span><select value={filters.priority} onChange={(event) => onChange({ ...filters, priority: event.target.value })}><option value="">All priorities</option><option value="critical">Critical priority</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select></label>
    </div>
  );
}
