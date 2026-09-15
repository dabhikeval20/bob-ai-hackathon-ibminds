import { Link } from 'react-router-dom';
import RiskBadge from './RiskBadge';
import { EmptyState } from './DataStates';

export default function RiskShipmentTable({ rows }) {
  if (!rows.length) return <EmptyState label="No shipments match the selected risk filters." />;
  return <div className="table-wrap"><table className="data-table"><caption className="sr-only">Explainable shipment risk analysis</caption><thead><tr><th>Shipment</th><th>Risk</th><th>Priority</th><th>Reasons</th><th>Recommended action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.shipmentId}><td><Link className="font-semibold text-cyan-200 hover:text-cyan-100" to={`/risk/shipments/${row.shipmentId}`}>{row.shipmentId}</Link><span className="block max-w-[180px] truncate text-xs text-slate-500">{row.shipment?.origin} to {row.shipment?.destination}</span></td><td><RiskBadge level={row.riskLevel} /><span className="mt-1 block text-xs font-medium text-slate-400">{row.riskScore}/100</span></td><td><span className="capitalize text-slate-300">{row.shipment?.priority}</span><span className="block text-xs text-slate-500">{row.shipment?.status?.replaceAll('_', ' ')}</span></td><td><span className="text-slate-300">{row.riskReasons?.length || 0} triggered</span><span className="block max-w-[210px] truncate text-xs text-slate-500">{row.riskReasons?.[0]?.message || 'No active reasons'}</span></td><td className="max-w-[250px] text-xs leading-5 text-slate-400">{row.recommendedAction}</td></tr>)}</tbody></table></div>;
}
