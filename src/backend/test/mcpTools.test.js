const test = require('node:test');
const assert = require('node:assert/strict');
const { TOOL_DEFINITIONS, executeTool } = require('../src/ai/mcpTools');

const dependencies = {
  listShipments: async input => ({ data: [{ shipmentId: 'SG-0001' }], pagination: { page: input.page, limit: input.limit, total: 1, totalPages: 1 } }),
  listRiskShipments: async () => ({ data: [{ shipmentId: 'SG-0001', riskLevel: 'CRITICAL' }, { shipmentId: 'SG-0002', riskLevel: 'LOW' }], pagination: {} }),
  getRiskShipment: async shipmentId => ({ shipmentId, riskLevel: 'HIGH', riskScore: 72, affectedShipmentIds: [shipmentId] }),
  listDisruptions: async input => ({ data: [{ disruptionId: 'DIS-0001', status: input.status }], pagination: {} }),
  listFleetVehicles: async input => ({ data: [{ vehicleId: 'VH-0001', status: input.status }], pagination: {} }),
  listColdChainAlerts: async () => ({ data: [{ shipmentId: 'SG-0001', alertSeverity: 'critical' }], pagination: {} }),
  getFleetIntelligence: async () => ({ totalVehicles: 15, availableVehicles: 7, averageUtilization: 66.13 })
};

test('publishes clear read-only tool definitions', () => {
  assert.equal(TOOL_DEFINITIONS.length, 8);
  assert.ok(TOOL_DEFINITIONS.every(tool => tool.name && tool.description && tool.input));
});

test('executes each tool through bounded service dependencies', async () => {
  const calls = [
    ['get_shipments', {}],
    ['get_high_risk_shipments', { limit: 1 }],
    ['get_shipment_details', { shipmentId: 'SG-0001' }],
    ['get_active_disruptions', {}],
    ['get_available_vehicles', { region: 'Indiana' }],
    ['get_temperature_alerts', { severity: 'critical' }],
    ['get_fleet_summary', {}],
    ['calculate_shipment_risk', { shipmentId: 'SG-0001' }]
  ];
  for (const [name, input] of calls) {
    const result = await executeTool(name, input, dependencies);
    assert.equal(result.tool, name);
    assert.equal(result.readOnly, true);
    assert.ok(result.data);
  }
});

test('rejects unknown tools and unrestricted input keys', async () => {
  await assert.rejects(executeTool('query_database', {}, dependencies), error => error.code === 'MCP_TOOL_NOT_FOUND');
  await assert.rejects(executeTool('get_shipments', { collection: 'shipments' }, dependencies), error => error.code === 'MCP_INVALID_INPUT');
  await assert.rejects(executeTool('get_fleet_summary', { collection: 'fleetVehicles' }, dependencies), error => error.code === 'MCP_INVALID_INPUT');
});

test('validates identifiers and pagination', async () => {
  await assert.rejects(executeTool('get_shipment_details', { shipmentId: 'not-valid' }, dependencies), error => error.code === 'MCP_INVALID_INPUT');
  await assert.rejects(executeTool('get_shipments', { limit: 101 }, dependencies), error => error.code === 'MCP_INVALID_INPUT');
  await assert.rejects(executeTool('get_shipments', [], dependencies), error => error.code === 'MCP_INVALID_INPUT');
});

test('returns structured errors from service failures without credentials', async () => {
  await assert.rejects(executeTool('get_fleet_summary', {}, { ...dependencies, getFleetIntelligence: async () => { const error = new Error('database unavailable'); error.code = 'DB_UNAVAILABLE'; throw error; } }), error => error.code === 'DB_UNAVAILABLE');
});
