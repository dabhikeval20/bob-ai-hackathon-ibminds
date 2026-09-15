import RiskBadge from './RiskBadge';

function EvidenceList({ facts = [], references = [] }) {
  if (!facts.length && !references.length) return <p className="text-sm text-slate-500">No evidence was returned.</p>;
  return <div className="space-y-2">{facts.map((fact, index) => <p className="evidence-line" key={`${fact}-${index}`}><span className="evidence-marker" />{fact}</p>)}{references.map((reference, index) => <p className="text-xs text-slate-500" key={`${reference.recordId}-${index}`}>{reference.source} / {reference.recordId}{reference.field ? ` / ${reference.field}` : ''}</p>)}</div>;
}

function StringList({ items = [], empty = 'None returned.' }) {
  return items.length ? <ul className="space-y-2">{items.map((item, index) => <li className="flex gap-2 text-sm leading-6 text-slate-300" key={`${item}-${index}`}><span className="text-cyan-300">•</span><span>{item}</span></li>)}</ul> : <p className="text-sm text-slate-500">{empty}</p>;
}

export default function AssistantResponse({ response }) {
  return <div className="assistant-response"><div className="assistant-answer"><p className="eyebrow text-cyan-300">Assistant response</p><p className="mt-2 text-base leading-7 text-white">{response.answer}</p>{response.riskLevel && <div className="mt-4"><RiskBadge level={response.riskLevel} /></div>}{response.dataUnavailable && <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-xs text-amber-200">Some requested information was unavailable in the current SupplyGuard records.</p>}</div><div className="assistant-response-grid"><section className="assistant-section"><h3>Evidence and facts</h3><EvidenceList facts={response.keyFacts} references={response.sourceReferences} /></section><section className="assistant-section"><h3>Affected shipments</h3><StringList items={response.affectedShipments} empty="No affected shipments returned." /></section><section className="assistant-section"><h3>Affected vehicles</h3><StringList items={response.affectedVehicles} empty="No affected vehicles returned." /></section><section className="assistant-section recommendation-panel"><h3>Recommendations</h3><StringList items={response.recommendations} empty="No recommendations returned." /></section><section className="assistant-section assistant-limitations"><h3>Limitations</h3><StringList items={response.limitations} empty="No additional limitations returned." /></section></div></div>;
}
