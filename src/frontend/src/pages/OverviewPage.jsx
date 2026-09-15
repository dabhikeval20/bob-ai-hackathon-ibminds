import { useCallback, useEffect, useState } from 'react';
import { fetchJson } from '../lib/api';
import KpiCard from '../components/KpiCard';
import SectionHeader from '../components/SectionHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/DataStates';
import RiskDistributionChart from '../components/RiskDistributionChart';
import RiskFilters from '../components/RiskFilters';
import RiskShipmentTable from '../components/RiskShipmentTable';
import RiskSummaryCards from '../components/RiskSummaryCards';

const initialData = { summary: null, shipments: [], disruptions: [], fleet: [], sensors: [] };

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatReference(value) {
  return value?.shipmentId || `...${String(value).slice(-4)}`;
}

export default function OverviewPage() {
  const [data, setData] = useState(initialData);
  const [state, setState] = useState({ loading: true, error: null });
  const [riskData, setRiskData] = useState({ summary: null, shipments: [] });
  const [riskState, setRiskState] = useState({ loading: true, error: null });
  const [riskFilters, setRiskFilters] = useState({ riskLevel: '', priority: '' });

  const loadData = useCallback(async (signal) => {
    setState({ loading: true, error: null });
    try {
      const [summary, shipments, disruptions, fleet, sensors] = await Promise.all([
        fetchJson('/dashboard/summary', signal),
        fetchJson('/shipments?limit=6&page=1', signal),
        fetchJson('/disruptions?status=active&limit=5&page=1', signal),
        fetchJson('/fleet?limit=5&page=1', signal),
        fetchJson('/sensors?isExcursion=true&limit=5&page=1', signal)
      ]);
      setData({ summary, shipments: shipments || [], disruptions: disruptions || [], fleet: fleet || [], sensors: sensors || [] });
      setState({ loading: false, error: null });
    } catch (error) {
      if (error.name !== 'AbortError') setState({ loading: false, error: error.message });
    }
  }, []);

  const loadRiskData = useCallback(async (signal, filters = riskFilters) => {
    setRiskState({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ limit: '8', page: '1' });
      if (filters.riskLevel) params.set('riskLevel', filters.riskLevel);
      if (filters.priority) params.set('priority', filters.priority);
      const [summary, shipments] = await Promise.all([
        fetchJson('/risk/summary', signal),
        fetchJson(`/risk/shipments?${params.toString()}`, signal)
      ]);
      setRiskData({ summary, shipments: shipments || [] });
      setRiskState({ loading: false, error: null });
    } catch (error) {
      if (error.name !== 'AbortError') setRiskState({ loading: false, error: error.message });
    }
  }, [riskFilters]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    const controller = new AbortController();
    loadRiskData(controller.signal);
    return () => controller.abort();
  }, [loadRiskData]);

  if (state.loading) return <LoadingState label="Loading SupplyGuard overview" />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => loadData()} />;

  const { summary } = data;
  const kpis = [
    { label: 'Total shipments', value: formatNumber(summary.totalShipments), detail: 'Across active lanes', tone: 'cyan' },
    { label: 'High-risk shipments', value: formatNumber(summary.highRiskShipments), detail: 'Requires review', tone: 'rose' },
    { label: 'Delayed shipments', value: formatNumber(summary.delayedShipments), detail: 'Delivery window impact', tone: 'amber' },
    { label: 'Active disruptions', value: formatNumber(summary.activeDisruptions), detail: 'Currently affecting lanes', tone: 'amber' },
    { label: 'Available vehicles', value: formatNumber(summary.availableVehicles), detail: 'Ready for assignment', tone: 'emerald' },
    { label: 'Temperature alerts', value: formatNumber(summary.temperatureAlerts), detail: 'Cold-chain excursions', tone: 'rose' }
  ];

  return (
    <div className="space-y-8">
      <section className="hero-panel">
        <div>
          <p className="eyebrow text-cyan-300">Tuesday, September 14, 2026</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Know what needs attention before it becomes an exception.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">A single operating view across shipment health, network disruption, fleet capacity, and cold-chain conditions.</p>
        </div>
        <div className="hero-signal" aria-hidden="true"><span>Live</span><strong>control room</strong><i /></div>
      </section>

      <section aria-label="Supply chain key performance indicators" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Risk intelligence</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Shipment risk at a glance</h2></div><RiskFilters filters={riskFilters} onChange={setRiskFilters} /></div>
        {riskState.loading ? <LoadingState label="Loading risk analysis" /> : riskState.error ? <ErrorState message={riskState.error} onRetry={() => loadRiskData()} /> : <><RiskSummaryCards summary={riskData.summary} /><div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]"><div className="panel"><SectionHeader eyebrow="Distribution" title="Risk levels" /><RiskDistributionChart distribution={riskData.summary?.riskLevels} /></div><div className="panel"><SectionHeader eyebrow="Prioritized review" title="High-risk shipment table" action={<span className="section-count">{riskData.shipments.length} shown</span>} /><RiskShipmentTable rows={riskData.shipments} /></div></div></>}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="panel">
          <SectionHeader eyebrow="Priority queue" title="Shipments needing attention" action={<span className="section-count">{data.shipments.length} shown</span>} />
          {data.shipments.length === 0 ? <EmptyState label="No shipments need attention right now." /> : <div className="table-wrap"><table className="data-table"><caption className="sr-only">Priority shipment queue</caption><thead><tr><th>Shipment</th><th>Route</th><th>Status</th><th>Risk</th><th>ETA</th></tr></thead><tbody>{data.shipments.map((shipment) => <tr key={shipment.shipmentId}><td><strong className="text-white">{shipment.shipmentId}</strong><span className="block text-xs text-slate-500">{shipment.cargoType}</span></td><td><span className="block max-w-[180px] truncate text-slate-300">{shipment.origin}</span><span className="block max-w-[180px] truncate text-xs text-slate-500">to {shipment.destination}</span></td><td><StatusBadge value={shipment.status} /></td><td><StatusBadge value={shipment.riskLevel} /><span className="ml-2 text-xs text-slate-500">{shipment.riskScore}/100</span></td><td className="whitespace-nowrap text-xs text-slate-400">{formatDate(shipment.expectedDelivery)}</td></tr>)}</tbody></table></div>}
        </div>
        <div className="panel">
          <SectionHeader eyebrow="Network watch" title="Active disruptions" action={<span className="section-count">{data.disruptions.length} shown</span>} />
          {data.disruptions.length === 0 ? <EmptyState label="No active disruptions are affecting the network." /> : <div className="space-y-3">{data.disruptions.map((disruption) => <article className="list-item" key={disruption.disruptionId}><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-white">{disruption.title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{disruption.description}</p></div><StatusBadge value={disruption.severity} /></div><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500"><span>{disruption.affectedShipmentIds.length} shipments</span><span>•</span><span>{disruption.estimatedDelayMinutes} min estimated delay</span></div></article>)}</div>}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="panel">
          <SectionHeader eyebrow="Capacity picture" title="Fleet utilization" action={<span className="text-sm font-medium text-cyan-300">{summary.averageFleetUtilization}% avg.</span>} />
          {data.fleet.length === 0 ? <EmptyState label="No fleet vehicles are available." /> : <div className="space-y-4">{data.fleet.map((vehicle) => <div key={vehicle.vehicleId}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-white">{vehicle.vehicleId} <span className="ml-1 text-xs font-normal text-slate-500">{vehicle.vehicleType.replaceAll('_', ' ')}</span></span><span className="text-slate-300">{vehicle.utilizationPercent}%</span></div><div className="utilization-track"><div className={`utilization-value ${vehicle.utilizationPercent >= 90 ? 'is-high' : ''}`} style={{ width: `${vehicle.utilizationPercent}%` }} /></div><div className="mt-1 flex justify-between text-[11px] text-slate-500"><span>{vehicle.region}</span><span>{vehicle.capacityKg - vehicle.currentLoadKg} kg available</span></div></div>)}</div>}
        </div>
        <div className="panel">
          <SectionHeader eyebrow="Cold-chain watch" title="Temperature excursions" action={<span className="section-count">{data.sensors.length} alerts</span>} />
          {data.sensors.length === 0 ? <EmptyState label="No cold-chain temperature excursions detected." /> : <div className="space-y-3">{data.sensors.map((sensor) => <article className="list-item" key={sensor.readingId}><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-white">{sensor.readingId} <span className="ml-1 text-xs font-normal text-slate-500">/ {sensor.sensorId}</span></p><p className="mt-1 text-xs text-slate-400">Shipment {formatReference(sensor.shipmentId)}</p></div><StatusBadge value={sensor.excursionSeverity || 'high'} /></div><div className="mt-3 flex items-center justify-between text-xs"><span className="text-rose-300">{sensor.temperatureCelsius}°C recorded</span><span className="text-slate-500">Safe range {sensor.minimumAllowed}–{sensor.maximumAllowed}°C</span></div><p className="mt-2 text-[11px] text-slate-500">{formatDate(sensor.recordedAt)}</p></article>)}</div>}
        </div>
      </section>
    </div>
  );
}
