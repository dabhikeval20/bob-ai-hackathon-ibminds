import BrandMark from './BrandMark';

export default function Topbar({ onMenuClick }) {
  return (
    <header className="topbar">
      <div className="flex items-center gap-3 lg:hidden">
        <button className="icon-button" aria-label="Open navigation" onClick={onMenuClick}>☰</button>
        <BrandMark />
      </div>
      <div className="hidden lg:block">
        <p className="eyebrow">Control room / Today</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">Supply chain overview</h1>
      </div>
      <div className="flex items-center gap-3">
        <label className="topbar-search hidden md:flex" aria-label="Search workspace"><span aria-hidden="true">⌕</span><input placeholder="Search shipments, vehicles..." /></label>
        <button className="topbar-action" aria-label="View notifications">♢<span className="notification-dot" /></button>
        <span className="hidden rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-200 sm:inline-flex">Live network</span>
        <div className="avatar" aria-label="Operations manager profile">OM</div>
      </div>
    </header>
  );
}
