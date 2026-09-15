const mongoose = require('mongoose');
const { Shipment, Disruption, FleetVehicle, SensorLog } = require('../models');
const AppError = require('../errors/AppError');
const { calculateShipmentRisk } = require('./riskEngine');
const { buildPagination } = require('../utils/api');

const PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);
const STATUSES = new Set(['planned', 'in_transit', 'delayed', 'delivered', 'at_risk', 'cancelled']);
const RISK_LEVELS = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const DISRUPTION_RANK = { low: 1, medium: 2, high: 3, critical: 4 };

function normalize(value) {
  return typeof value === 'string' ? value.toLowerCase() : value;
}

function parseBoolean(value, fieldName) {
  if (value === undefined) return undefined;
  if (value !== 'true' && value !== 'false') throw new AppError(400, `${fieldName} must be true or false`, 'INVALID_QUERY');
  return value === 'true';
}

function validateEnum(value, values, fieldName) {
  if (value === undefined) return undefined;
  const normalized = normalize(value);
  if (!values.has(normalized)) throw new AppError(400, `Unsupported ${fieldName}: ${value}`, 'INVALID_QUERY');
  return normalized;
}

function getHighestSeverity(disruptions) {
  return disruptions.reduce((highest, disruption) => {
    if (!highest || DISRUPTION_RANK[disruption.severity] > DISRUPTION_RANK[highest.severity]) return disruption;
    return highest;
  }, null);
}

function buildShipmentRiskAnalysis(shipment, disruptions = [], sensorLogs = [], vehicle = null, now = new Date()) {
  const activeDisruptions = disruptions.filter(disruption => disruption.status === 'active');
  const highestDisruption = getHighestSeverity(activeDisruptions);
  const temperatureExcursion = sensorLogs.find(sensor => sensor.isExcursion) || false;
  const routeStatus = highestDisruption ? 'disrupted' : shipment.status === 'delayed' || shipment.delayMinutes > 0 ? 'delayed' : 'normal';
  const vehicleStatus = vehicle?.status || 'unavailable';
  const risk = calculateShipmentRisk({
    delayMinutes: shipment.delayMinutes,
    priority: shipment.priority,
    disruptionSeverity: highestDisruption?.severity,
    temperatureExcursion,
    deliveryDeadline: shipment.expectedDelivery,
    cargoType: shipment.cargoType,
    routeStatus,
    vehicleStatus,
    now
  });

  return {
    shipmentId: shipment.shipmentId,
    riskLevel: risk.riskLevel,
    riskScore: risk.riskScore,
    riskReasons: risk.riskReasons,
    triggeredRules: risk.triggeredRules,
    recommendedAction: risk.recommendedAction,
    calculatedAt: risk.calculatedAt,
    affectedShipmentIds: [shipment.shipmentId],
    context: {
      priority: shipment.priority,
      status: shipment.status,
      delayMinutes: shipment.delayMinutes,
      disruptionSeverity: highestDisruption?.severity || null,
      temperatureExcursion: Boolean(temperatureExcursion),
      routeStatus,
      vehicleStatus
    }
  };
}

async function loadAnalysisRows(filter = {}) {
  const shipments = await Shipment.find(filter).sort({ expectedDelivery: 1, shipmentId: 1 }).lean();
  if (!shipments.length) return [];

  const shipmentIds = shipments.map(shipment => shipment._id);
  const disruptionIds = shipments.flatMap(shipment => shipment.activeDisruptionIds || []);
  const vehicleIds = shipments.map(shipment => shipment.assignedVehicle).filter(Boolean);
  const [disruptions, sensorLogs, vehicles] = await Promise.all([
    Disruption.find({ _id: { $in: disruptionIds } }).lean(),
    SensorLog.find({ shipmentId: { $in: shipmentIds } }).sort({ recordedAt: -1 }).lean(),
    FleetVehicle.find({ _id: { $in: vehicleIds } }).lean()
  ]);
  const disruptionsById = new Map(disruptions.map(disruption => [String(disruption._id), disruption]));
  const sensorsByShipment = new Map();
  sensorLogs.forEach(sensor => {
    const key = String(sensor.shipmentId);
    sensorsByShipment.set(key, [...(sensorsByShipment.get(key) || []), sensor]);
  });
  const vehiclesById = new Map(vehicles.map(vehicle => [String(vehicle._id), vehicle]));

  return shipments.map(shipment => {
    const shipmentDisruptions = (shipment.activeDisruptionIds || []).map(id => disruptionsById.get(String(id))).filter(Boolean);
    const analysis = buildShipmentRiskAnalysis(
      shipment,
      shipmentDisruptions,
      sensorsByShipment.get(String(shipment._id)) || [],
      shipment.assignedVehicle ? vehiclesById.get(String(shipment.assignedVehicle)) : null
    );
    return { shipment, analysis };
  });
}

function applyAnalysisFilters(rows, query) {
  const riskLevel = query.riskLevel ? String(query.riskLevel).toUpperCase() : undefined;
  if (riskLevel && !RISK_LEVELS.has(riskLevel)) throw new AppError(400, `Unsupported riskLevel: ${query.riskLevel}`, 'INVALID_QUERY');
  const priority = validateEnum(query.priority, PRIORITIES, 'priority');
  const status = validateEnum(query.status, STATUSES, 'status');
  const temperatureExcursion = parseBoolean(query.temperatureExcursion, 'temperatureExcursion');
  const delayStatus = query.delayStatus ? normalize(query.delayStatus) : undefined;
  if (delayStatus && !['delayed', 'on_time'].includes(delayStatus)) throw new AppError(400, 'delayStatus must be delayed or on_time', 'INVALID_QUERY');

  return rows.filter(({ shipment, analysis }) => {
    if (riskLevel && analysis.riskLevel !== riskLevel.toUpperCase()) return false;
    if (priority && shipment.priority !== priority) return false;
    if (status && shipment.status !== status) return false;
    if (temperatureExcursion !== undefined && analysis.context.temperatureExcursion !== temperatureExcursion) return false;
    if (delayStatus === 'delayed' && shipment.delayMinutes <= 0) return false;
    if (delayStatus === 'on_time' && shipment.delayMinutes > 0) return false;
    return true;
  });
}

function formatRow(row) {
  return {
    shipmentId: row.shipment.shipmentId,
    shipment: row.shipment,
    ...row.analysis
  };
}

async function listRiskShipments(query) {
  const baseFilter = {};
  if (query.priority) baseFilter.priority = validateEnum(query.priority, PRIORITIES, 'priority');
  if (query.status) baseFilter.status = validateEnum(query.status, STATUSES, 'status');
  const rows = applyAnalysisFilters(await loadAnalysisRows(baseFilter), query);
  rows.sort((left, right) => right.analysis.riskScore - left.analysis.riskScore || left.shipment.shipmentId.localeCompare(right.shipment.shipmentId));
  const page = query.page;
  const limit = query.limit;
  const start = (page - 1) * limit;
  return { data: rows.slice(start, start + limit).map(formatRow), pagination: buildPagination(page, limit, rows.length) };
}

async function getRiskShipment(shipmentId) {
  if (!/^SG-[0-9]+$/i.test(shipmentId)) throw new AppError(400, 'shipmentId must match SG-####', 'INVALID_SHIPMENT_ID');
  const rows = await loadAnalysisRows({ shipmentId: shipmentId.toUpperCase() });
  if (!rows.length) throw new AppError(404, 'Shipment not found', 'SHIPMENT_NOT_FOUND');
  return formatRow(rows[0]);
}

async function getRiskSummary() {
  const rows = await loadAnalysisRows();
  const byLevel = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  rows.forEach(row => { byLevel[row.analysis.riskLevel] += 1; });
  const affectedShipmentIds = rows.filter(row => ['HIGH', 'CRITICAL'].includes(row.analysis.riskLevel)).map(row => row.shipment.shipmentId);
  return {
    totalShipments: rows.length,
    riskLevels: byLevel,
    averageRiskScore: rows.length ? Number((rows.reduce((sum, row) => sum + row.analysis.riskScore, 0) / rows.length).toFixed(2)) : 0,
    affectedShipmentIds,
    highRiskShipmentIds: rows.filter(row => row.analysis.riskLevel === 'HIGH').map(row => row.shipment.shipmentId),
    criticalShipmentIds: rows.filter(row => row.analysis.riskLevel === 'CRITICAL').map(row => row.shipment.shipmentId),
    calculatedAt: new Date().toISOString()
  };
}

async function listRiskRecommendations(query) {
  const result = await listRiskShipments({ ...query, page: 1, limit: 100 });
  const allRecommendations = result.data.filter(row => row.riskLevel !== 'LOW').map(row => ({
    shipmentId: row.shipmentId,
    riskLevel: row.riskLevel,
    riskScore: row.riskScore,
    riskReasons: row.riskReasons,
    triggeredRules: row.triggeredRules,
    recommendedAction: row.recommendedAction,
    affectedShipmentIds: row.affectedShipmentIds,
    calculatedAt: row.calculatedAt
  }));
  const start = (query.page - 1) * query.limit;
  return {
    data: allRecommendations.slice(start, start + query.limit),
    pagination: buildPagination(query.page, query.limit, allRecommendations.length)
  };
}

module.exports = { buildShipmentRiskAnalysis, listRiskShipments, getRiskShipment, getRiskSummary, listRiskRecommendations };
