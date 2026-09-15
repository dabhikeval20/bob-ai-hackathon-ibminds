import StatusBadge from './StatusBadge';
import { EmptyState } from './DataStates';

export default function SensorReadingsTable({ readings }) {
  if (!readings.length) return <EmptyState label="No sensor logs are available for this shipment." />;
  return <div className="table-wrap"><table className="data-table"><caption className="sr-only">Shipment sensor readings</caption><thead><tr><th>Recorded</th><th>Temperature</th><th>Safe range</th><th>Excursion</th><th>Sensor</th></tr></thead><tbody>{readings.map((reading) => <tr key={reading.readingId}><td className="whitespace-nowrap text-xs text-slate-400">{new Date(reading.recordedAt).toLocaleString()}</td><td className={reading.isExcursion ? 'font-semibold text-rose-300' : 'text-slate-300'}>{reading.temperatureCelsius}°C</td><td className="text-xs text-slate-400">{reading.minimumAllowed}–{reading.maximumAllowed}°C</td><td><StatusBadge value={reading.isExcursion ? reading.excursionSeverity || 'high' : 'available'} /></td><td className="text-xs text-slate-500">{reading.sensorId}</td></tr>)}</tbody></table></div>;
}
