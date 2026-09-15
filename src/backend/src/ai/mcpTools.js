const AppError = require('../errors/AppError');
const { listShipments, getShipmentById } = require('../services/shipmentService');
const { listDisruptions } = require('../services/disruptionService');
const { listFleetVehicles } = require('../services/fleetService');
const { getRiskShipment, listRiskShipments } = require('../services/riskAnalysisService');
const { getFleetIntelligence, getVehicleSuggestions } = require('../services/fleetIntelligenceService');
const { listColdChainAlerts } = require('../services/coldChainService');

const TOOL_DEFINITIONS = Object.freeze([
  { name: 'get_shipments', description: 'Read a bounded, filtered list of synthetic shipments.', input: 'Optional page, limit, status, priority, riskLevel, and region.' },
  { name: 'get_high_risk_shipments', description: 'Read shipments currently assessed as HIGH or CRITICAL by the deterministic risk engine.', input: 'Optional page and limit.' },
  { name: 'get_shipment_details', description: 'Read one shipment and its deterministic risk assessment with evidence.', input: 'Required shipmentId such as SG-0001.' },
  { name: 'get_active_disruptions', description: 'Read active supply-chain disruptions and affected shipment IDs.', input: 'Optional page, limit, severity, and region.' },
  { name: 'get_available_vehicles', description: 'Read vehicles currently marked available for manual review.', input: 'Optional page, limit, and region.' },
  { name: 'get_temperature_alerts', description: 'Read recorded cold-chain temperature excursions and affected shipment IDs.', input: 'Optional page, limit, and severity.' },
  { name: 'get_fleet_summary', description: 'Read computed fleet totals, utilization, idle, overutilized, and unavailable vehicles.', input: 'No input.' },
  { name: 'calculate_shipment_risk', description: 'Read the current deterministic risk calculation for one shipment.', input: 'Required shipmentId such as SG-0001.' }
]);

const TOOL_NAMES = new Set(TOOL_DEFINITIONS.map(tool => tool.name));
const ALLOWED_LIST_KEYS = new Set(['page', 'limit', 'status', 'priority', 'riskLevel', 'region', 'severity']);
const ENUMS = {
  status: new Set(['planned', 'in_transit', 'delayed', 'delivered', 'at_risk', 'cancelled', 'active', 'monitoring', 'resolved', 'available', 'assigned', 'maintenance', 'offline']),
  priority: new Set(['low', 'medium', 'high', 'critical']),
  riskLevel: new Set(['low', 'medium', 'high', 'critical']),
  severity: new Set(['low', 'medium', 'high', 'critical'])
};

function assertObject(input) {
  if (input === undefined) return {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AppError(400, 'Tool input must be a JSON object', 'MCP_INVALID_INPUT');
  return input;
}

function assertAllowedKeys(input, allowedKeys = ALLOWED_LIST_KEYS) {
  const unknown = Object.keys(input).filter(key => !allowedKeys.has(key));
  if (unknown.length) throw new AppError(400, `Unsupported tool input: ${unknown[0]}`, 'MCP_INVALID_INPUT');
}

function parsePage(value, fallback, maximum) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) throw new AppError(400, 'Pagination value is out of range', 'MCP_INVALID_INPUT');
  return parsed;
}

function boundedListInput(input, extraKeys = []) {
  const allowed = new Set([...ALLOWED_LIST_KEYS, ...extraKeys]);
  assertAllowedKeys(input, allowed);
  for (const [field, values] of Object.entries(ENUMS)) {
    if (input[field] !== undefined && (typeof input[field] !== 'string' || !values.has(input[field].toLowerCase()))) throw new AppError(400, `Unsupported ${field}: ${input[field]}`, 'MCP_INVALID_INPUT');
  }
  if (input.region !== undefined && (typeof input.region !== 'string' || input.region.trim().length === 0 || input.region.length > 120)) throw new AppError(400, 'region must be a non-empty string of 120 characters or fewer', 'MCP_INVALID_INPUT');
  return { ...input, page: parsePage(input.page, 1, 10000), limit: parsePage(input.limit, 20, 100) };
}

function assertShipmentId(input) {
  assertAllowedKeys(input, new Set(['shipmentId']));
  if (typeof input.shipmentId !== 'string' || !/^SG-[0-9]+$/i.test(input.shipmentId)) throw new AppError(400, 'shipmentId must match SG-####', 'MCP_INVALID_INPUT');
  return input.shipmentId.toUpperCase();
}

function createDefaultDependencies() {
  return { listShipments, getShipmentById, listDisruptions, listFleetVehicles, getRiskShipment, listRiskShipments, getFleetIntelligence, getVehicleSuggestions, listColdChainAlerts };
}

async function executeTool(name, rawInput = {}, dependencies = createDefaultDependencies()) {
  if (!TOOL_NAMES.has(name)) throw new AppError(404, `Unknown MCP tool: ${name}`, 'MCP_TOOL_NOT_FOUND');
  const input = assertObject(rawInput);
  let data;
  switch (name) {
    case 'get_shipments': data = await dependencies.listShipments(boundedListInput(input)); break;
    case 'get_high_risk_shipments': {
      assertAllowedKeys(input, new Set(['page', 'limit']));
      const result = await dependencies.listRiskShipments({ page: 1, limit: 100 });
      const rows = result.data.filter(row => ['HIGH', 'CRITICAL'].includes(row.riskLevel));
      const page = parsePage(input.page, 1, 10000);
      const limit = parsePage(input.limit, 20, 100);
      data = { data: rows.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) } };
      break;
    }
    case 'get_shipment_details': data = await dependencies.getRiskShipment(assertShipmentId(input)); break;
    case 'get_active_disruptions': data = await dependencies.listDisruptions({ ...boundedListInput(input), status: 'active' }); break;
    case 'get_available_vehicles': data = await dependencies.listFleetVehicles({ ...boundedListInput(input), status: 'available' }); break;
    case 'get_temperature_alerts': data = await dependencies.listColdChainAlerts(boundedListInput(input)); break;
    case 'get_fleet_summary': assertAllowedKeys(input, new Set()); data = await dependencies.getFleetIntelligence(); break;
    case 'calculate_shipment_risk': data = await dependencies.getRiskShipment(assertShipmentId(input)); break;
    default: throw new AppError(404, `Unknown MCP tool: ${name}`, 'MCP_TOOL_NOT_FOUND');
  }
  return { tool: name, readOnly: true, data };
}

module.exports = { TOOL_DEFINITIONS, executeTool, assertObject, assertAllowedKeys, boundedListInput, assertShipmentId };
