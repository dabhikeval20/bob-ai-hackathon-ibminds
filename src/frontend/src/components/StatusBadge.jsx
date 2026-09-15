const styles = {
  critical: 'badge-rose',
  high: 'badge-amber',
  medium: 'badge-blue',
  low: 'badge-emerald',
  at_risk: 'badge-rose',
  delayed: 'badge-amber',
  active: 'badge-amber',
  available: 'badge-emerald',
  in_transit: 'badge-blue',
  delivered: 'badge-slate'
};

export default function StatusBadge({ value }) {
  const label = value?.replaceAll('_', ' ') || 'Unknown';
  return <span className={`status-badge ${styles[value] || 'badge-slate'}`}>{label}</span>;
}
