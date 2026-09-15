const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateFleetStats, getFleetClassification, selectSuitableVehicles } = require('../src/services/fleetIntelligenceService');

function vehicle(overrides = {}) {
  return {
    vehicleId: 'VH-TEST',
    status: 'available',
    region: 'Indiana',
    capacityKg: 10000,
    currentLoadKg: 2000,
    utilizationPercent: 20,
    temperatureControlled: false,
    currentLocation: { region: 'Indiana', city: 'Indianapolis' },
    ...overrides
  };
}

test('calculates fleet metrics from real vehicle values', () => {
  const stats = calculateFleetStats([
    vehicle({ vehicleId: 'VH-1', status: 'available', utilizationPercent: 10 }),
    vehicle({ vehicleId: 'VH-2', status: 'assigned', utilizationPercent: 60 }),
    vehicle({ vehicleId: 'VH-3', status: 'in_transit', utilizationPercent: 90 }),
    vehicle({ vehicleId: 'VH-4', status: 'maintenance', utilizationPercent: 80 })
  ]);
  assert.deepEqual(stats, { totalVehicles: 4, availableVehicles: 1, assignedVehicles: 2, idleVehicles: 1, unavailableVehicles: 1, overutilizedVehicles: 1, averageUtilization: 60 });
});

test('handles empty fleets without producing NaN', () => {
  assert.deepEqual(calculateFleetStats([]), { totalVehicles: 0, availableVehicles: 0, assignedVehicles: 0, idleVehicles: 0, unavailableVehicles: 0, overutilizedVehicles: 0, averageUtilization: 0 });
});

test('uses explicit boundaries for idle and overutilized classifications', () => {
  assert.equal(getFleetClassification(vehicle({ utilizationPercent: 24.99 })), 'idle');
  assert.equal(getFleetClassification(vehicle({ utilizationPercent: 25 })), 'available');
  assert.equal(getFleetClassification(vehicle({ utilizationPercent: 89.99 })), 'available');
  assert.equal(getFleetClassification(vehicle({ utilizationPercent: 90 })), 'overutilized');
  assert.equal(getFleetClassification(vehicle({ status: 'offline', utilizationPercent: 5 })), 'unavailable');
});

test('suggests available temperature-compatible vehicles without assigning them', () => {
  const shipment = { temperatureRequired: true, currentLocation: { region: 'Indiana' } };
  const suggestions = selectSuitableVehicles([
    vehicle({ vehicleId: 'VH-COLD', temperatureControlled: true, region: 'Indiana', currentLoadKg: 1000 }),
    vehicle({ vehicleId: 'VH-WARM', temperatureControlled: false, region: 'Indiana' }),
    vehicle({ vehicleId: 'VH-FULL', temperatureControlled: true, region: 'Indiana', currentLoadKg: 10000 })
  ], shipment);
  assert.deepEqual(suggestions.map(item => item.vehicle.vehicleId), ['VH-COLD']);
  assert.equal(suggestions[0].regionMatch, true);
  assert.ok(suggestions[0].reasons.some(reason => reason.includes('temperature-controlled')));
  assert.equal(Object.prototype.hasOwnProperty.call(suggestions[0].vehicle, 'assignedShipmentIds'), false);
});
