import { useCallback, useEffect, useState } from 'react';
import { fetchJson } from '../lib/api';
import SectionHeader from '../components/SectionHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/DataStates';
import { Link } from 'react-router-dom';

export default function ShipmentsPage() {
  const [data, setData] = useState({ shipments: [] });
  const [state, setState] = useState({ loading: true, error: null });

  const load = useCallback(async (signal) => {
    setState({ loading: true, error: null });
    try {
      // Fetching top 100 shipments for the demo
      const payload = await fetchJson('/shipments?limit=100&page=1', signal);
      // The API returns the collection in a data array according to typical patterns
      setData({ shipments: payload.data || payload || [] });
      setState({ loading: false, error: null });
    } catch (error) {
      if (error.name !== 'AbortError') setState({ loading: false, error: error.message });
    }
  }, []);

  useEffect(() => { 
    const controller = new AbortController(); 
    load(controller.signal); 
    return () => controller.abort(); 
  }, [load]);

  if (state.loading) return <LoadingState label="Loading shipments data..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => load()} />;

  const { shipments } = data;
  const items = Array.isArray(shipments) ? shipments : shipments.items || [];

  return (
    <div className="space-y-8">
      <section className="hero-panel">
        <div>
          <p className="eyebrow text-cyan-300">Shipments Dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Active Network Deliveries.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Monitor real-time shipment status, routing details, and tracking updates.
          </p>
        </div>
        <div className="hero-signal" aria-hidden="true">
          <span>Live</span>
          <strong>Shipment telemetry</strong>
          <i />
        </div>
      </section>

      <section className="panel">
        <SectionHeader 
          eyebrow="Network Register" 
          title="All Shipments" 
          action={<span className="section-count">{items.length} active</span>} 
        />
        
        {items.length === 0 ? (
          <EmptyState label="No shipments are currently available." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Live Shipment Data</caption>
              <thead>
                <tr>
                  <th>Shipment ID</th>
                  <th>Origin & Destination</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Cargo Type</th>
                </tr>
              </thead>
              <tbody>
                {items.map((shipment) => (
                  <tr key={shipment.shipmentId || shipment._id}>
                    <td>
                      <Link className="font-semibold text-cyan-200 hover:text-cyan-100" to={`/risk/shipments/${shipment.shipmentId}`}>
                        {shipment.shipmentId}
                      </Link>
                      <span className="block text-xs text-slate-500">{shipment.assignedVehicle || 'Unassigned'}</span>
                    </td>
                    <td>
                      <span className="block text-sm text-slate-200">{shipment.origin}</span>
                      <span className="block text-xs text-slate-500">to {shipment.destination}</span>
                    </td>
                    <td>
                      <StatusBadge value={shipment.status?.toLowerCase() || 'pending'} />
                    </td>
                    <td>
                      <span className="capitalize text-slate-300">{shipment.priority}</span>
                    </td>
                    <td className="capitalize text-slate-400">
                      {shipment.cargoType || 'Standard'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
