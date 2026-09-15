const styles = {
  LOW: 'badge-emerald',
  MEDIUM: 'badge-blue',
  HIGH: 'badge-amber',
  CRITICAL: 'badge-rose'
};

export default function RiskBadge({ level }) {
  return <span className={`status-badge risk-badge ${styles[level] || 'badge-slate'}`}>{level || 'Unknown'}</span>;
}
