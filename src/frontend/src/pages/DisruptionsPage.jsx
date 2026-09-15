import { useCallback, useEffect, useState } from 'react';
import { fetchJson } from '../lib/api';
import SectionHeader from '../components/SectionHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/DataStates';

export default function DisruptionsPage() {
  const [data, setData] = useState({ disruptions: [] });
  const [state, setState] = useState({ loading: true, error: null });

  const load = useCallback(async (signal) => {
    setState({ loading: true, error: null });
    try {
      const payload = await fetchJson('/disruptions?limit=100&page=1', signal);
      setData({ disruptions: payload.data || payload || [] });
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

  if (state.loading) return <LoadingState label="Loading active disruptions..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={() => load()} />;

  const { disruptions } = data;
  const items = Array.isArray(disruptions) ? disruptions : disruptions.items || [];

  return (
    <div className="space-y-8">
      <section className="hero-panel">
        <div>
          <p className="eyebrow text-cyan-300">Disruption Monitor</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Network Interferences.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Track weather, infrastructure, and regional incidents impacting your logistics operations.
          </p>
        </div>
        <div className="hero-signal" aria-hidden="true">
          <span>Live</span>
          <strong>Threat alerts</strong>
          <i />
        </div>
      </section>

      <section className="grid gap-6">
        <div className="panel">
          <SectionHeader 
            eyebrow="Active Disruptions" 
            title="All Incidents" 
            action={<span className="section-count">{items.length} ongoing</span>} 
          />
          
          {items.length === 0 ? (
            <EmptyState label="No active disruptions reported." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <caption className="sr-only">Live Disruption Data</caption>
                <thead>
                  <tr>
                    <th>Disruption ID & Type</th>
                    <th>Details</th>
                    <th>Affected Regions</th>
                    <th>Severity</th>
                    <th>Affected Shipments</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((disruption) => (
                    <tr key={disruption.disruptionId || disruption._id}>
                      <td>
                        <span className="block font-semibold text-white">{disruption.disruptionId}</span>
                        <span className="block text-xs capitalize text-slate-500">
                          {disruption.type?.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="block text-sm text-slate-200">{disruption.title}</span>
                        <span className="block max-w-[250px] truncate text-xs text-slate-500">
                          {disruption.description}
                        </span>
                      </td>
                      <td className="text-sm text-slate-300">
                        {disruption.affectedRegions?.join(', ') || 'N/A'}
                      </td>
                      <td>
                        <StatusBadge value={disruption.severity} />
                      </td>
                      <td>
                        <span className="text-slate-300 font-medium">
                          {disruption.affectedShipmentIds?.length || 0}
                        </span>
                        <span className="block text-xs text-slate-500">shipments</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
