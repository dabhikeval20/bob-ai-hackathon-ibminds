export default function PlaceholderPage({ title }) {
  return (
    <section className="state-panel min-h-[50vh]">
      <div className="max-w-md">
        <p className="eyebrow text-cyan-300">Operations workspace</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-3 text-slate-400">This view is ready for its connected data source. No records are available in the current environment.</p>
      </div>
    </section>
  );
}
