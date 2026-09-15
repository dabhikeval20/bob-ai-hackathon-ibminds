const test = require('node:test');
const assert = require('node:assert/strict');
const { buildShipmentRiskAnalysis } = require('../src/services/riskAnalysisService');

const NOW = new Date('2026-09-14T08:00:00.000Z');
const shipment = {
  shipmentId: 'SG-TEST-01',
  priority: 'critical',
  status: 'at_risk',
  delayMinutes: 180,
  expectedDelivery: '2026-09-14T20:00:00.000Z',
  cargoType: 'pharmaceutical'
};

test('builds explainable risk output with affected shipment ID', () => {
  const result = buildShipmentRiskAnalysis(
    shipment,
    [{ status: 'active', severity: 'high' }],
    [{ isExcursion: true, currentTemperature: 11, minimumAllowed: 2, maximumAllowed: 8 }],
    { status: 'maintenance' },
    NOW
  );

  assert.equal(result.shipmentId, 'SG-TEST-01');
  assert.ok(['HIGH', 'CRITICAL'].includes(result.riskLevel));
  assert.ok(result.riskScore > 0);
  assert.deepEqual(result.affectedShipmentIds, ['SG-TEST-01']);
  assert.ok(result.riskReasons.some(reason => reason.code === 'TEMPERATURE_EXCURSION'));
  assert.ok(result.triggeredRules.some(rule => rule.code === 'VEHICLE_UNAVAILABLE'));
  assert.ok(result.recommendedAction.length > 0);
  assert.equal(result.calculatedAt, NOW.toISOString());
});

test('treats a missing assigned vehicle as unavailable', () => {
  const result = buildShipmentRiskAnalysis({ ...shipment, priority: 'low', delayMinutes: 0 }, [], [], null, NOW);
  assert.equal(result.context.vehicleStatus, 'unavailable');
  assert.ok(result.triggeredRules.some(rule => rule.code === 'VEHICLE_UNAVAILABLE'));
});

test('uses the highest active disruption severity', () => {
  const result = buildShipmentRiskAnalysis(
    { ...shipment, priority: 'low', delayMinutes: 0 },
    [{ status: 'active', severity: 'low' }, { status: 'active', severity: 'critical' }, { status: 'resolved', severity: 'critical' }],
    [],
    { status: 'available' },
    NOW
  );
  assert.equal(result.context.disruptionSeverity, 'critical');
  assert.ok(result.triggeredRules.some(rule => rule.code === 'CRITICAL_DISRUPTION'));
});
