import { useCallback, useEffect, useState } from 'react';
import { fetchJson } from '../lib/api';
import SectionHeader from '../components/SectionHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/DataStates';
import FleetSummaryCards from '../components/FleetSummaryCards';
import FleetUtilizationChart from '../components/FleetUtilizationChart';
import VehicleTable from '../components/VehicleTable';

export default function FleetPage() {
  const [data, setData] = useState({ intelligence: null, vehicles: [], suggestions: null });
  const [state, setState] = useState({ loading: true, error: null });
  const load = useCallback(async (signal) => {
    setState({ loading: true, error: null });
    try {
      const [intelligence, vehicles, suggestions] = await Promise.all([
        fetchJson('/fleet/intelligence', signal),
        fetchJson('/fleet?limit=100&page=1', signal),
        fetchJson('/fleet/suggestions?shipmentId=SG-0001', signal)
      ]);
      setData({ intelligence, vehicles: vehicles || [], suggestions });
      setState({ loading: false, error: null });
    } catch (error) {
      if (error.name !== 'AbortError') setState({ loading: false, error: error.message });
    }
  }, []);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  if (state.loading) return <LoadingState label="Loading fleet intelligence" />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => load()} />;
  const { intelligence, vehicles, suggestions } = data;
  return <div className="space-y-8"><section className="hero-panel"><div><p className="eyebrow text-cyan-300">Fleet control room</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Capacity you can act on.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">See where capacity is available, where utilization is tight, and which vehicles are worth reviewing for an affected shipment.</p></div><div className="hero-signal" aria-hidden="true"><span>Live</span><strong>fleet picture</strong><i /></div></section><FleetSummaryCards stats={intelligence} /><section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]"><div className="panel"><SectionHeader eyebrow="Utilization" title="Fleet utilization chart" action={<span className="text-sm font-medium text-cyan-300">{intelligence.averageUtilization}% avg.</span>} /><FleetUtilizationChart vehicles={vehicles} /></div><div className="panel"><SectionHeader eyebrow="Vehicle register" title="All vehicles" action={<span className="section-count">{vehicles.length} tracked</span>} /><VehicleTable vehicles={vehicles} /></div></section><section className="grid gap-6 xl:grid-cols-3"><div className="panel"><SectionHeader eyebrow="Available capacity" title="Idle vehicles" /><div className="space-y-3">{intelligence.idle.length ? intelligence.idle.map((vehicle) => <article className="list-item" key={vehicle.vehicleId}><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-white">{vehicle.vehicleId}</p><p className="text-xs capitalize text-slate-500">{vehicle.vehicleType.replaceAll('_', ' ')} · {vehicle.region}</p></div><StatusBadge value="available" /></div><p className="mt-3 text-xs text-emerald-300">{vehicle.capacityKg - vehicle.currentLoadKg} kg available · {vehicle.utilizationPercent}% used</p></article>) : <EmptyState label="No idle vehicles detected." />}</div></div><div className="panel"><SectionHeader eyebrow="Capacity pressure" title="Overutilized vehicles" /> <div className="space-y-3">{intelligence.overutilized.length ? intelligence.overutilized.map((vehicle) => <article className="list-item" key={vehicle.vehicleId}><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-white">{vehicle.vehicleId}</p><p className="text-xs capitalize text-slate-500">{vehicle.vehicleType.replaceAll('_', ' ')} · {vehicle.region}</p></div><StatusBadge value="high" /></div><p className="mt-3 text-xs text-amber-300">{vehicle.utilizationPercent}% utilized · {vehicle.capacityKg - vehicle.currentLoadKg} kg remaining</p></article>) : <EmptyState label="No overutilized vehicles detected." />}</div></div><div className="panel"><SectionHeader eyebrow="Manual review" title="Suggested vehicle" /><p className="mb-4 text-xs leading-5 text-slate-400">For affected shipment SG-0001. Suggestions never assign a vehicle automatically.</p>{suggestions.suggestions.length ? <div className="space-y-3">{suggestions.suggestions.slice(0, 3).map((suggestion) => <article className="list-item" key={suggestion.vehicleId}><div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{suggestion.vehicleId}</p><span className="text-xs text-cyan-300">{suggestion.remainingCapacityKg} kg free</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{suggestion.reasons.slice(0, 2).join(' ')}</p></article>)}</div> : <EmptyState label="No suitable available vehicles found." />}</div></section></div>;
}
