export function LoadingState({ label = 'Loading operational data' }) {
  return <div className="state-panel" role="status"><span className="loading-spinner" /> <span>{label}...</span></div>;
}

export function EmptyState({ label = 'No records match this view.' }) {
  return <div className="state-panel text-slate-400">{label}</div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-panel border-rose-400/20 bg-rose-400/5 text-rose-200" role="alert">
      <span>{message || 'Operational data could not be loaded.'}</span>
      {onRetry && <button className="button-secondary ml-2" onClick={onRetry}>Retry</button>}
    </div>
  );
}
