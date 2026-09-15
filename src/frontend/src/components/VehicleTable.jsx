import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { EmptyState } from './DataStates';

export default function VehicleTable({ vehicles }) {
  if (!vehicles.length) return <EmptyState label="No vehicles match this fleet view." />;
  return <div className="table-wrap"><table className="data-table"><caption className="sr-only">Fleet vehicles</caption><thead><tr><th>Vehicle</th><th>Status</th><th>Utilization</th><th>Capacity</th><th>Region</th><th>Maintenance</th></tr></thead><tbody>{vehicles.map((vehicle) => <tr key={vehicle.vehicleId}><td><Link className="font-semibold text-cyan-200 hover:text-cyan-100" to={`/fleet/vehicles/${vehicle.vehicleId}`}>{vehicle.vehicleId}</Link><span className="block text-xs capitalize text-slate-500">{vehicle.vehicleType.replaceAll('_', ' ')}</span></td><td><StatusBadge value={vehicle.status} /></td><td><span className={vehicle.utilizationPercent >= 90 ? 'font-semibold text-amber-300' : 'text-slate-300'}>{vehicle.utilizationPercent}%</span><div className="mt-2 utilization-track"><div className={`utilization-value ${vehicle.utilizationPercent >= 90 ? 'is-high' : ''}`} style={{ width: `${vehicle.utilizationPercent}%` }} /></div></td><td className="whitespace-nowrap text-xs text-slate-400">{vehicle.currentLoadKg.toLocaleString()} / {vehicle.capacityKg.toLocaleString()} kg</td><td className="text-sm text-slate-300">{vehicle.region}</td><td className="text-xs capitalize text-slate-400">{vehicle.maintenanceStatus}</td></tr>)}</tbody></table></div>;
}
