import RiskBadge from './RiskBadge';

const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const colors = { LOW: '#6ee7b7', MEDIUM: '#67e8f9', HIGH: '#fbbf24', CRITICAL: '#fb7185' };

export default function RiskDistributionChart({ distribution = {} }) {
  const total = levels.reduce((sum, level) => sum + (distribution[level] || 0), 0);
  let cursor = 0;
  const stops = levels.map((level) => {
    const start = cursor;
    cursor += total ? ((distribution[level] || 0) / total) * 100 : 0;
    return `${colors[level]} ${start}% ${cursor}%`;
  }).join(', ');
  return (
    <div className="space-y-4" aria-label="Shipment risk distribution">
      <div className="risk-donut" style={{ background: `conic-gradient(${stops || '#334155 0 100%'})` }}>
        <div><strong>{total}</strong><span>shipments</span></div>
      </div>
      <div className="space-y-3">
        {levels.map((level) => {
          const count = distribution[level] || 0;
          const width = total ? `${Math.max((count / total) * 100, count ? 4 : 0)}%` : '0%';
          return <div key={level}><div className="mb-1 flex items-center justify-between text-xs"><RiskBadge level={level} /><span className="font-medium text-slate-300">{count}</span></div><div className="risk-bar"><div className={`risk-bar-value risk-${level.toLowerCase()}`} style={{ width }} /></div></div>;
        })}
      </div>
    </div>
  );
}
