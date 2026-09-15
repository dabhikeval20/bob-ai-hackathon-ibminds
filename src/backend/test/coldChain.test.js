const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateExcursionDurationMinutes, getHighestSeverity, buildShipmentTemperatureSummary } = require('../src/services/coldChainService');

const shipment = { shipmentId: 'SG-TEST-01', cargoType: 'pharmaceutical', temperatureRequired: true, temperatureMin: 2, temperatureMax: 8 };
const log = (overrides = {}) => ({ recordedAt: '2026-09-14T08:00:00.000Z', temperatureCelsius: 5, minimumAllowed: 2, maximumAllowed: 8, isExcursion: false, excursionSeverity: null, sensorId: 'SENSOR-1', location: null, ...overrides });

test('calculates duration between first and last excursion readings', () => {
  assert.equal(calculateExcursionDurationMinutes([
    log({ recordedAt: '2026-09-14T08:00:00.000Z', isExcursion: true, excursionSeverity: 'high' }),
    log({ recordedAt: '2026-09-14T08:20:00.000Z', isExcursion: true, excursionSeverity: 'critical' }),
    log({ recordedAt: '2026-09-14T08:30:00.000Z' })
  ]), 20);
});

test('returns zero duration when only one excursion reading exists', () => {
  assert.equal(calculateExcursionDurationMinutes([log({ isExcursion: true, excursionSeverity: 'high' })]), 0);
});

test('selects the highest alert severity', () => {
  assert.equal(getHighestSeverity([log({ isExcursion: true, excursionSeverity: 'low' }), log({ isExcursion: true, excursionSeverity: 'critical' })]), 'critical');
});

test('builds a no-sensor-data summary without invented values', () => {
  const result = buildShipmentTemperatureSummary(shipment, []);
  assert.equal(result.hasSensorData, false);
  assert.equal(result.latestTemperature, null);
  assert.equal(result.alertSeverity, null);
  assert.equal(result.explanation, 'No sensor readings are available for this shipment.');
  assert.deepEqual(result.safeTemperatureRange, { minimum: 2, maximum: 8 });
});

test('builds an excursion summary from stored readings', () => {
  const result = buildShipmentTemperatureSummary(shipment, [
    log({ recordedAt: '2026-09-14T08:00:00.000Z', temperatureCelsius: 10, isExcursion: true, excursionSeverity: 'high' }),
    log({ recordedAt: '2026-09-14T08:30:00.000Z', temperatureCelsius: 11, isExcursion: true, excursionSeverity: 'critical' })
  ]);
  assert.equal(result.hasSensorData, true);
  assert.equal(result.latestTemperature, 11);
  assert.equal(result.alertSeverity, 'critical');
  assert.equal(result.excursionDurationMinutes, 30);
  assert.match(result.explanation, /30 minutes/);
});
