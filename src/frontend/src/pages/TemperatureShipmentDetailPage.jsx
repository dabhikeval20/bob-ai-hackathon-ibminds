import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchJson } from '../lib/api';
import SectionHeader from '../components/SectionHeader';
import StatusBadge from '../components/StatusBadge';
import TemperatureTrendChart from '../components/TemperatureTrendChart';
import SensorReadingsTable from '../components/SensorReadingsTable';
import { ErrorState, EmptyState, LoadingState } from '../components/DataStates';

export default function TemperatureShipmentDetailPage() {
  const { shipmentId } = useParams();
  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });
  const load = useCallback(async (signal) => {
    setState({ loading: true, error: null });
    try { setData(await fetchJson(`/cold-chain/shipments/${shipmentId}`, signal)); setState({ loading: false, error: null }); } catch (error) { if (error.name !== 'AbortError') setState({ loading: false, error: error.message }); }
  }, [shipmentId]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  if (state.loading) return <LoadingState label="Loading shipment temperature details" />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => load()} />;
  return <div className="space-y-6"><Link className="inline-flex text-sm font-medium text-cyan-300 hover:text-cyan-200" to="/cold-chain">← Back to cold-chain</Link><section className="detail-hero"><div><p className="eyebrow text-cyan-300">Shipment temperature details</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{data.shipmentId}</h2><p className="mt-2 text-sm text-slate-400">{data.cargoType} · {data.temperatureRequired ? 'Temperature controlled' : 'No temperature requirement'}</p></div><div className="text-left sm:text-right">{data.hasExcursion ? <StatusBadge value={data.alertSeverity || 'high'} /> : <StatusBadge value="available" />}<p className="mt-2 text-4xl font-semibold text-white">{data.latestTemperature === null ? '—' : `${data.latestTemperature}°C`}</p><p className="text-xs text-slate-500">latest recorded temperature</p></div></section><section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]"><div className="panel"><SectionHeader eyebrow="Recorded trend" title="Temperature readings" />{data.readings.length ? <TemperatureTrendChart readings={data.readings} minimum={data.safeTemperatureRange?.minimum} maximum={data.safeTemperatureRange?.maximum} /> : <EmptyState label="No sensor readings are available for this shipment." />}</div><div className="panel"><SectionHeader eyebrow="Alert assessment" title={data.hasExcursion ? 'Excursion detected' : 'Within safe range'} />{data.hasExcursion ? <><p className="text-lg font-medium leading-7 text-white">{data.explanation}</p><dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Alert severity</dt><dd><StatusBadge value={data.alertSeverity} /></dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Excursion duration</dt><dd className="text-white">{data.excursionDurationMinutes} minutes</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Safe range</dt><dd className="text-white">{data.safeTemperatureRange?.minimum}–{data.safeTemperatureRange?.maximum}°C</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Sensor readings</dt><dd className="text-white">{data.sensorCount}</dd></div></dl></> : <><p className="text-lg font-medium leading-7 text-emerald-200">{data.explanation}</p><p className="mt-5 text-sm text-slate-400">Safe range: {data.safeTemperatureRange ? `${data.safeTemperatureRange.minimum}–${data.safeTemperatureRange.maximum}°C` : 'Unavailable'}.</p></>}</div></section><section className="panel"><SectionHeader eyebrow="Raw telemetry" title="Sensor log" action={<span className="section-count">{data.readings.length} readings</span>} /><SensorReadingsTable readings={data.readings} /></section></div>;
}
