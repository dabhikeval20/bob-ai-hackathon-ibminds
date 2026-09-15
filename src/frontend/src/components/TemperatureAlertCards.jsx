import KpiCard from './KpiCard';

export default function TemperatureAlertCards({ summary }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Cold-chain shipments" value={summary.temperatureControlledShipments} detail="Temperature-sensitive cargo" tone="cyan" /><KpiCard label="Sensor-connected" value={summary.shipmentsWithSensorData} detail="With recorded readings" tone="emerald" /><KpiCard label="Temperature alerts" value={summary.temperatureAlerts} detail="Affected shipments" tone="rose" /><KpiCard label="Excursion duration" value={`${summary.totalExcursionDurationMinutes} min`} detail="Across recorded excursions" tone="amber" /></div>;
}
