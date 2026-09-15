import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchJson } from '../lib/api';
import RiskBadge from '../components/RiskBadge';
import SectionHeader from '../components/SectionHeader';
import { ErrorState, LoadingState } from '../components/DataStates';

export default function RiskDetailPage() {
  const { shipmentId } = useParams();
  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });
  const load = useCallback(async (signal) => {
    setState({ loading: true, error: null });
    try { setData(await fetchJson(`/risk/shipments/${shipmentId}`, signal)); setState({ loading: false, error: null }); }
    catch (error) { if (error.name !== 'AbortError') setState({ loading: false, error: error.message }); }
  }, [shipmentId]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  if (state.loading) return <LoadingState label="Loading shipment risk analysis" />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => load()} />;

  const shipment = data.shipment;
  return <div className="space-y-6"><Link className="inline-flex text-sm font-medium text-cyan-300 hover:text-cyan-200" to="/">← Back to overview</Link><section className="detail-hero"><div><p className="eyebrow text-cyan-300">Shipment risk analysis</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{data.shipmentId}</h2><p className="mt-2 text-sm text-slate-400">{shipment.origin} to {shipment.destination}</p></div><div className="text-left sm:text-right"><RiskBadge level={data.riskLevel} /><p className="mt-2 text-4xl font-semibold text-white">{data.riskScore}<span className="text-lg text-slate-500">/100</span></p></div></section><div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]"><section className="panel"><SectionHeader eyebrow="Why this is risky" title="Explainable risk reasons" action={<span className="section-count">{data.riskReasons.length} reasons</span>} />{data.riskReasons.length ? <div className="space-y-3">{data.riskReasons.map((reason) => <article className="reason-item" key={reason.code}><div className="flex items-start justify-between gap-4"><div><p className="font-medium text-white">{reason.message}</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{reason.code.replaceAll('_', ' ')}</p></div><span className="text-sm font-semibold text-amber-300">+{reason.points}</span></div></article>)}</div> : <p className="text-sm text-slate-400">No rules were triggered for this shipment.</p>}</section><section className="panel recommendation-panel"><SectionHeader eyebrow="Next best action" title="Recommended action" /><p className="text-lg font-medium leading-7 text-white">{data.recommendedAction}</p><div className="mt-6 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-500">Priority</p><p className="mt-1 capitalize text-slate-200">{shipment.priority}</p></div><div><p className="text-xs text-slate-500">Status</p><p className="mt-1 capitalize text-slate-200">{shipment.status.replaceAll('_', ' ')}</p></div><div><p className="text-xs text-slate-500">Delay</p><p className="mt-1 text-slate-200">{shipment.delayMinutes} minutes</p></div><div><p className="text-xs text-slate-500">Vehicle state</p><p className="mt-1 capitalize text-slate-200">{data.context.vehicleStatus.replaceAll('_', ' ')}</p></div></div></section></div><section className="panel"><SectionHeader eyebrow="Rule trace" title="Triggered rules" />{data.triggeredRules.map((rule) => <div className="flex flex-col gap-1 border-b border-slate-800 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between" key={rule.code}><span className="text-sm text-slate-300">{rule.code.replaceAll('_', ' ')}</span><span className="text-xs text-slate-500">{rule.points} points · {rule.reason}</span></div>)}</section></div>;
}
