const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateShipmentRisk } = require('../src/services/riskEngine');

const NOW = new Date('2026-09-14T08:00:00.000Z');

function baseInput(overrides = {}) {
  return {
    delayMinutes: 0,
    priority: 'low',
    disruptionSeverity: null,
    temperatureExcursion: false,
    deliveryDeadline: '2026-09-20T08:00:00.000Z',
    cargoType: 'general',
    routeStatus: 'normal',
    vehicleStatus: 'available',
    now: NOW,
    ...overrides
  };
}

test('returns LOW for a shipment with no triggered rules', () => {
  const result = calculateShipmentRisk(baseInput());
  assert.equal(result.riskLevel, 'LOW');
  assert.equal(result.riskScore, 0);
  assert.deepEqual(result.riskReasons, []);
  assert.deepEqual(result.triggeredRules, []);
  assert.equal(result.recommendedAction, 'Continue routine monitoring.');
  assert.equal(result.calculatedAt, NOW.toISOString());
});

test('returns MEDIUM for cumulative delay and high priority rules', () => {
  const result = calculateShipmentRisk(baseInput({ delayMinutes: 45, priority: 'high' }));
  assert.equal(result.riskLevel, 'MEDIUM');
  assert.equal(result.riskScore, 20);
  assert.deepEqual(result.triggeredRules.map(rule => rule.code), ['DELAY_OVER_30_MINUTES', 'HIGH_PRIORITY_CARGO']);
  assert.equal(result.recommendedAction, 'Monitor the shipment and verify the next checkpoint.');
});

test('returns HIGH for disruption, delay, and approaching deadline rules', () => {
  const result = calculateShipmentRisk(baseInput({
    delayMinutes: 180,
    disruptionSeverity: 'high',
    deliveryDeadline: '2026-09-14T20:00:00.000Z',
    routeStatus: 'disrupted'
  }));
  assert.equal(result.riskLevel, 'HIGH');
  assert.equal(result.riskScore, 54);
  assert.equal(result.triggeredRules.length, 5);
  assert.equal(result.recommendedAction, 'Prioritize operational review and confirm a mitigation plan.');
});

test('returns CRITICAL and caps the transparent score at 100', () => {
  const result = calculateShipmentRisk(baseInput({
    delayMinutes: 360,
    priority: 'critical',
    disruptionSeverity: 'critical',
    temperatureExcursion: true,
    cargoType: 'pharmaceutical',
    deliveryDeadline: '2026-09-14T12:00:00.000Z',
    routeStatus: 'blocked',
    vehicleStatus: 'maintenance'
  }));
  assert.equal(result.riskLevel, 'CRITICAL');
  assert.equal(result.riskScore, 100);
  assert.equal(result.triggeredRules.length, 10);
  assert.match(result.recommendedAction, /Escalate immediately/);
  assert.ok(result.riskReasons.some(reason => reason.code === 'TEMPERATURE_EXCURSION'));
  assert.ok(result.riskReasons.some(reason => reason.code === 'VEHICLE_UNAVAILABLE'));
});

test('detects an excursion from temperature values', () => {
  const result = calculateShipmentRisk(baseInput({
    cargoType: 'food',
    temperatureExcursion: { currentTemperature: 10, minimumAllowed: 2, maximumAllowed: 8 }
  }));
  assert.equal(result.riskScore, 35);
  assert.equal(result.riskLevel, 'MEDIUM');
  assert.deepEqual(result.triggeredRules.map(rule => rule.code), ['TEMPERATURE_EXCURSION', 'COLD_CHAIN_EXCURSION']);
});

test('rejects unsupported values and invalid dates', () => {
  assert.throws(() => calculateShipmentRisk(baseInput({ priority: 'urgent' })), /Unsupported priority/);
  assert.throws(() => calculateShipmentRisk(baseInput({ deliveryDeadline: 'not-a-date' })), /deliveryDeadline must be a valid date/);
  assert.throws(() => calculateShipmentRisk(baseInput({ routeStatus: 'unknown' })), /Unsupported route status/);
});
