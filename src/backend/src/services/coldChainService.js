const { Shipment, SensorLog } = require('../models');
const AppError = require('../errors/AppError');
const { buildPagination } = require('../utils/api');

const SEVERITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 };

function calculateExcursionDurationMinutes(logs) {
  const excursions = logs.filter(log => log.isExcursion).sort((left, right) => new Date(left.recordedAt) - new Date(right.recordedAt));
  if (excursions.length < 2) return 0;
  return Number(((new Date(excursions[excursions.length - 1].recordedAt) - new Date(excursions[0].recordedAt)) / 60000).toFixed(2));
}

function getHighestSeverity(logs) {
  return logs.filter(log => log.isExcursion).reduce((highest, log) => {
    if (!highest || SEVERITY_RANK[log.excursionSeverity] > SEVERITY_RANK[highest]) return log.excursionSeverity;
    return highest;
  }, null);
}

function buildShipmentTemperatureSummary(shipment, logs) {
  const orderedLogs = [...logs].sort((left, right) => new Date(right.recordedAt) - new Date(left.recordedAt));
  const latest = orderedLogs[0] || null;
  const excursionLogs = orderedLogs.filter(log => log.isExcursion);
  return {
    shipmentId: shipment.shipmentId,
    cargoType: shipment.cargoType,
    temperatureRequired: shipment.temperatureRequired,
    hasSensorData: Boolean(latest),
    hasExcursion: excursionLogs.length > 0,
    latestTemperature: latest?.temperatureCelsius ?? null,
    latestRecordedAt: latest?.recordedAt ?? null,
    safeTemperatureRange: latest ? { minimum: latest.minimumAllowed, maximum: latest.maximumAllowed } : shipment.temperatureRequired ? { minimum: shipment.temperatureMin, maximum: shipment.temperatureMax } : null,
    alertSeverity: getHighestSeverity(logs),
    excursionDurationMinutes: calculateExcursionDurationMinutes(logs),
    sensorCount: logs.length,
    sensorId: latest?.sensorId || null,
    location: latest?.location || null,
    explanation: !latest ? 'No sensor readings are available for this shipment.' : excursionLogs.length ? `Temperature was outside the safe range for ${calculateExcursionDurationMinutes(logs)} minutes based on recorded excursion readings.` : 'Latest recorded temperature is within the configured safe range.'
  };
}

async function loadShipmentGroups() {
  const shipments = await Shipment.find({ temperatureRequired: true }).sort({ shipmentId: 1 }).lean();
  if (!shipments.length) return [];
  const logs = await SensorLog.find({ shipmentId: { $in: shipments.map(shipment => shipment._id) } }).populate('shipmentId', 'shipmentId').sort({ recordedAt: -1 }).lean();
  const logsByShipment = new Map();
  logs.forEach(log => {
    const key = String(log.shipmentId?._id || log.shipmentId);
    logsByShipment.set(key, [...(logsByShipment.get(key) || []), log]);
  });
  return shipments.map(shipment => ({ shipment, logs: logsByShipment.get(String(shipment._id)) || [] }));
}

async function getColdChainSummary() {
  const groups = await loadShipmentGroups();
  const summaries = groups.map(group => buildShipmentTemperatureSummary(group.shipment, group.logs));
  const alerts = summaries.filter(summary => summary.hasExcursion);
  const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
  alerts.forEach(alert => { if (alert.alertSeverity) severityCounts[alert.alertSeverity] += 1; });
  return {
    temperatureControlledShipments: summaries.length,
    shipmentsWithSensorData: summaries.filter(summary => summary.hasSensorData).length,
    temperatureAlerts: alerts.length,
    affectedShipmentIds: alerts.map(alert => alert.shipmentId),
    totalExcursionDurationMinutes: Number(alerts.reduce((total, alert) => total + alert.excursionDurationMinutes, 0).toFixed(2)),
    severityCounts,
    latestRecordedAt: summaries.filter(summary => summary.latestRecordedAt).sort((left, right) => new Date(right.latestRecordedAt) - new Date(left.latestRecordedAt))[0]?.latestRecordedAt || null
  };
}

async function listColdChainAlerts(query) {
  const groups = await loadShipmentGroups();
  let summaries = groups.map(group => buildShipmentTemperatureSummary(group.shipment, group.logs)).filter(summary => summary.hasExcursion);
  if (query.severity) {
    const severity = query.severity.toLowerCase();
    if (!SEVERITY_RANK[severity]) throw new AppError(400, `Unsupported severity: ${query.severity}`, 'INVALID_QUERY');
    summaries = summaries.filter(summary => summary.alertSeverity === severity);
  }
  const start = (query.page - 1) * query.limit;
  return { data: summaries.slice(start, start + query.limit), pagination: buildPagination(query.page, query.limit, summaries.length) };
}

async function getShipmentTemperatureDetails(shipmentId) {
  if (!/^SG-[0-9]+$/i.test(shipmentId)) throw new AppError(400, 'shipmentId must match SG-####', 'INVALID_SHIPMENT_ID');
  const shipment = await Shipment.findOne({ shipmentId: shipmentId.toUpperCase() }).lean();
  if (!shipment) throw new AppError(404, 'Shipment not found', 'SHIPMENT_NOT_FOUND');
  const logs = await SensorLog.find({ shipmentId: shipment._id }).sort({ recordedAt: -1 }).lean();
  const summary = buildShipmentTemperatureSummary(shipment, logs);
  return { ...summary, readings: logs };
}

module.exports = { calculateExcursionDurationMinutes, getHighestSeverity, buildShipmentTemperatureSummary, getColdChainSummary, listColdChainAlerts, getShipmentTemperatureDetails };
