import { NavLink } from 'react-router-dom';
import BrandMark from './BrandMark';

const navigation = [
  { label: 'Overview', path: '/', icon: '⌂' },
  { label: 'Shipments', path: '/shipments', icon: '▤' },
  { label: 'Disruptions', path: '/disruptions', icon: '!' },
  { label: 'Fleet utilization', path: '/fleet', icon: '▰' },
  { label: 'Cold-chain alerts', path: '/cold-chain', icon: '◇' },
  { label: 'Ask assistant', path: '/assistant', icon: '✦' }
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <button className={`sidebar-backdrop ${open ? 'is-visible' : ''}`} aria-label="Close navigation" onClick={onClose} />
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-brand flex items-center justify-between px-6 py-6">
          <BrandMark />
          <button className="icon-button lg:hidden" aria-label="Close navigation" onClick={onClose}>×</button>
        </div>
        <div className="px-4 pb-5">
          <p className="eyebrow px-3 pb-3">Workspace</p>
          <nav className="space-y-1" aria-label="Primary navigation">
            {navigation.map((item) => (
              <NavLink
                className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
                end={item.path === '/'}
                key={item.path}
                onClick={onClose}
                to={item.path}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto px-6 pb-6">
          <div className="workspace-card rounded-xl border border-slate-700/80 bg-slate-900/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Operations workspace</p>
            <p className="mt-2 text-sm leading-5 text-slate-300">Live network telemetry and shipment intelligence.</p>
            <span className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-300"><span className="status-dot" /> All systems operational</span>
          </div>
        </div>
      </aside>
    </>
  );
}
