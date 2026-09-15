import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchJson } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import SectionHeader from '../components/SectionHeader';
import { ErrorState, LoadingState } from '../components/DataStates';

export default function FleetVehicleDetailPage() {
  const { vehicleId } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });
  const load = useCallback(async (signal) => {
    setState({ loading: true, error: null });
    try { setVehicle(await fetchJson(`/fleet/${vehicleId}`, signal)); setState({ loading: false, error: null }); } catch (error) { if (error.name !== 'AbortError') setState({ loading: false, error: error.message }); }
  }, [vehicleId]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  if (state.loading) return <LoadingState label="Loading vehicle details" />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => load()} />;
  return <div className="space-y-6"><Link className="inline-flex text-sm font-medium text-cyan-300 hover:text-cyan-200" to="/fleet">← Back to fleet</Link><section className="detail-hero"><div><p className="eyebrow text-cyan-300">Vehicle details</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{vehicle.vehicleId}</h2><p className="mt-2 capitalize text-sm text-slate-400">{vehicle.vehicleType.replaceAll('_', ' ')} · {vehicle.region}</p></div><div className="text-left sm:text-right"><StatusBadge value={vehicle.status} /><p className="mt-2 text-4xl font-semibold text-white">{vehicle.utilizationPercent}<span className="text-lg text-slate-500">% used</span></p></div></section><div className="grid gap-6 md:grid-cols-2"><section className="panel"><SectionHeader eyebrow="Capacity" title="Load picture" /><div className="utilization-track"><div className={`utilization-value ${vehicle.utilizationPercent >= 90 ? 'is-high' : ''}`} style={{ width: `${vehicle.utilizationPercent}%` }} /></div><div className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><p className="text-xs text-slate-500">Current load</p><p className="mt-1 text-white">{vehicle.currentLoadKg.toLocaleString()} kg</p></div><div><p className="text-xs text-slate-500">Total capacity</p><p className="mt-1 text-white">{vehicle.capacityKg.toLocaleString()} kg</p></div><div><p className="text-xs text-slate-500">Remaining</p><p className="mt-1 text-emerald-300">{(vehicle.capacityKg - vehicle.currentLoadKg).toLocaleString()} kg</p></div><div><p className="text-xs text-slate-500">Classification</p><p className="mt-1 capitalize text-white">{vehicle.classification}</p></div></div></section><section className="panel"><SectionHeader eyebrow="Operational state" title="Assignment and maintenance" /><dl className="space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Temperature controlled</dt><dd className="text-white">{vehicle.temperatureControlled ? 'Yes' : 'No'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Maintenance</dt><dd className="capitalize text-white">{vehicle.maintenanceStatus}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Assigned shipments</dt><dd className="text-white">{vehicle.assignedShipmentIds.length}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Location</dt><dd className="text-right text-white">{vehicle.currentLocation.city}, {vehicle.currentLocation.region}</dd></div></dl></section></div></div>;
}
