import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { EmptyState } from './DataStates';

export default function SensorLogTable({ alerts }) {
  if (!alerts.length) return <EmptyState label="No temperature excursions detected." />;
  return <div className="table-wrap"><table className="data-table"><caption className="sr-only">Cold-chain sensor alerts</caption><thead><tr><th>Shipment</th><th>Latest reading</th><th>Safe range</th><th>Alert</th><th>Duration</th></tr></thead><tbody>{alerts.map((alert) => <tr key={alert.shipmentId}><td><Link className="font-semibold text-cyan-200 hover:text-cyan-100" to={`/cold-chain/shipments/${alert.shipmentId}`}>{alert.shipmentId}</Link><span className="block text-xs text-slate-500">{alert.sensorId || 'Sensor unavailable'}</span></td><td><span className="font-semibold text-rose-300">{alert.latestTemperature === null ? 'No reading' : `${alert.latestTemperature}°C`}</span><span className="block text-xs text-slate-500">{alert.latestRecordedAt ? new Date(alert.latestRecordedAt).toLocaleString() : 'No timestamp'}</span></td><td className="text-sm text-slate-300">{alert.safeTemperatureRange ? `${alert.safeTemperatureRange.minimum}–${alert.safeTemperatureRange.maximum}°C` : 'Unavailable'}</td><td><StatusBadge value={alert.alertSeverity || 'medium'} /></td><td className="text-sm text-slate-300">{alert.excursionDurationMinutes} min</td></tr>)}</tbody></table></div>;
}
