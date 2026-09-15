import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../lib/api';
import SectionHeader from '../components/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/DataStates';
import TemperatureAlertCards from '../components/TemperatureAlertCards';
import SensorLogTable from '../components/SensorLogTable';
import StatusBadge from '../components/StatusBadge';

export default function ColdChainPage() {
  const [data, setData] = useState({ summary: null, alerts: [] });
  const [state, setState] = useState({ loading: true, error: null });
  const load = useCallback(async (signal) => {
    setState({ loading: true, error: null });
    try {
      const [summary, alerts] = await Promise.all([fetchJson('/cold-chain/summary', signal), fetchJson('/cold-chain/alerts?limit=100&page=1', signal)]);
      setData({ summary, alerts: alerts || [] });
      setState({ loading: false, error: null });
    } catch (error) { if (error.name !== 'AbortError') setState({ loading: false, error: error.message }); }
  }, []);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  if (state.loading) return <LoadingState label="Loading cold-chain monitoring" />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => load()} />;
  const { summary, alerts } = data;
  return <div className="space-y-8"><section className="hero-panel"><div><p className="eyebrow text-cyan-300">Cold-chain control room</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Keep every temperature-sensitive shipment in range.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Review recorded sensor readings, understand excursion duration, and open a shipment-level temperature timeline.</p></div><div className="hero-signal" aria-hidden="true"><span>Live</span><strong>sensor picture</strong><i /></div></section><TemperatureAlertCards summary={summary} /><section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]"><div className="panel"><SectionHeader eyebrow="Exception queue" title="Temperature alerts" action={<span className="section-count">{alerts.length} affected</span>} /><SensorLogTable alerts={alerts} /></div><div className="panel"><SectionHeader eyebrow="Severity" title="Alert breakdown" />{Object.entries(summary.severityCounts).map(([severity, count]) => <div className="mb-4 last:mb-0" key={severity}><div className="mb-1 flex items-center justify-between"><StatusBadge value={severity} /><span className="text-sm font-medium text-slate-300">{count}</span></div><div className="risk-bar"><div className={`risk-bar-value risk-${severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : severity === 'medium' ? 'medium' : 'low'}`} style={{ width: summary.temperatureAlerts ? `${(count / summary.temperatureAlerts) * 100}%` : '0%' }} /></div></div>)}{!summary.temperatureAlerts && <EmptyState label="No alert severities to summarize." />}</div></section><section className="panel"><SectionHeader eyebrow="Affected shipments" title="Shipment temperature monitoring" />{summary.affectedShipmentIds.length ? <div className="flex flex-wrap gap-2">{summary.affectedShipmentIds.map((shipmentId) => <Link className="rounded-lg border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-300/20" to={`/cold-chain/shipments/${shipmentId}`} key={shipmentId}>{shipmentId}</Link>)}</div> : <EmptyState label="No shipments are currently affected by temperature excursions." />}</section></div>;
}
