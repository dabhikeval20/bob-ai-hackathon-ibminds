function pointsFor(readings, chartMin, chartMax) {
  if (readings.length < 2) return '';
  const range = chartMax - chartMin || 1;
  return readings.map((reading, index) => `${(index / (readings.length - 1)) * 100},${92 - ((reading.temperatureCelsius - chartMin) / range) * 72}`).join(' ');
}

export default function TemperatureTrendChart({ readings = [], minimum, maximum }) {
  const ordered = [...readings].reverse();
  if (!ordered.length) return <div className="state-panel">No sensor readings are available for this shipment.</div>;
  const values = ordered.map(reading => reading.temperatureCelsius);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const chartMin = Math.min(min, minimum ?? min);
  const chartMax = Math.max(max, maximum ?? max);
  const chartRange = chartMax - chartMin || 1;
  const safeTop = 92 - (((maximum ?? chartMax) - chartMin) / chartRange) * 72;
  const safeBottom = 92 - (((minimum ?? chartMin) - chartMin) / chartRange) * 72;
  return <div className="space-y-3" aria-label="Temperature trend chart"><div className="temperature-chart"><div className="temperature-safe-band" style={{ top: `${safeTop}%`, height: `${safeBottom - safeTop}%` }} /><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Recorded temperature trend"><polyline points={pointsFor(ordered, chartMin, chartMax)} fill="none" vectorEffect="non-scaling-stroke" stroke="#67e8f9" strokeWidth="2.5" /></svg><div className="temperature-chart-labels"><span>{max}°C peak</span><span>Safe {minimum}–{maximum}°C</span><span>{min}°C low</span></div></div><div className="flex justify-between text-[11px] text-slate-500"><span>{new Date(ordered[0].recordedAt).toLocaleString()}</span><span>{new Date(ordered[ordered.length - 1].recordedAt).toLocaleString()}</span></div></div>;
}
