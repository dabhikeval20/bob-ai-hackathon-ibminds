const { FleetVehicle, Shipment } = require('../models');
const AppError = require('../errors/AppError');

const OVERUTILIZED_THRESHOLD = 90;
const IDLE_UTILIZATION_THRESHOLD = 25;
const UNAVAILABLE_STATUSES = new Set(['maintenance', 'offline']);
const ASSIGNED_STATUSES = new Set(['assigned', 'in_transit']);

function round(value) {
  return Number(value.toFixed(2));
}

function getFleetClassification(vehicle) {
  if (UNAVAILABLE_STATUSES.has(vehicle.status)) return 'unavailable';
  if (vehicle.status === 'available' && vehicle.utilizationPercent < IDLE_UTILIZATION_THRESHOLD) return 'idle';
  if (vehicle.utilizationPercent >= OVERUTILIZED_THRESHOLD) return 'overutilized';
  if (ASSIGNED_STATUSES.has(vehicle.status)) return 'assigned';
  return vehicle.status;
}

function calculateFleetStats(vehicles) {
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(vehicle => vehicle.status === 'available').length;
  const assignedVehicles = vehicles.filter(vehicle => ASSIGNED_STATUSES.has(vehicle.status)).length;
  const idleVehicles = vehicles.filter(vehicle => getFleetClassification(vehicle) === 'idle').length;
  const unavailableVehicles = vehicles.filter(vehicle => UNAVAILABLE_STATUSES.has(vehicle.status)).length;
  const overutilizedVehicles = vehicles.filter(vehicle => vehicle.utilizationPercent >= OVERUTILIZED_THRESHOLD).length;
  const averageUtilization = totalVehicles ? round(vehicles.reduce((total, vehicle) => total + vehicle.utilizationPercent, 0) / totalVehicles) : 0;
  return { totalVehicles, availableVehicles, assignedVehicles, idleVehicles, unavailableVehicles, overutilizedVehicles, averageUtilization };
}

function explainSuggestion(vehicle, shipment) {
  const reasons = [
    'Vehicle is available for manual review.',
    `Vehicle has ${vehicle.capacityKg - vehicle.currentLoadKg} kg of remaining capacity.`,
    `Vehicle is located in ${vehicle.currentLocation.region}.`
  ];
  if (shipment.temperatureRequired) reasons.push('Vehicle is temperature-controlled for this cold-chain shipment.');
  if (vehicle.region === shipment.currentLocation.region) reasons.push('Vehicle region matches the shipment current region.');
  return reasons;
}

function selectSuitableVehicles(vehicles, shipment) {
  return vehicles
    .filter(vehicle => vehicle.status === 'available')
    .filter(vehicle => vehicle.currentLoadKg < vehicle.capacityKg)
    .filter(vehicle => !shipment.temperatureRequired || vehicle.temperatureControlled)
    .map(vehicle => ({
      vehicle,
      reasons: explainSuggestion(vehicle, shipment),
      remainingCapacityKg: vehicle.capacityKg - vehicle.currentLoadKg,
      regionMatch: vehicle.region === shipment.currentLocation.region,
      temperatureCompatible: !shipment.temperatureRequired || vehicle.temperatureControlled
    }))
    .sort((left, right) => Number(right.regionMatch) - Number(left.regionMatch) || Number(right.temperatureCompatible) - Number(left.temperatureCompatible) || right.remainingCapacityKg - left.remainingCapacityKg);
}

async function getFleetIntelligence() {
  const vehicles = await FleetVehicle.find({}).sort({ utilizationPercent: -1, vehicleId: 1 }).lean();
  return { ...calculateFleetStats(vehicles), overutilized: vehicles.filter(vehicle => vehicle.utilizationPercent >= OVERUTILIZED_THRESHOLD), unavailable: vehicles.filter(vehicle => UNAVAILABLE_STATUSES.has(vehicle.status)), idle: vehicles.filter(vehicle => getFleetClassification(vehicle) === 'idle') };
}

async function getFleetVehicle(vehicleId) {
  if (!/^VH-[0-9]+$/i.test(vehicleId)) throw new AppError(400, 'vehicleId must match VH-####', 'INVALID_VEHICLE_ID');
  const vehicle = await FleetVehicle.findOne({ vehicleId: vehicleId.toUpperCase() }).lean();
  if (!vehicle) throw new AppError(404, 'Vehicle not found', 'VEHICLE_NOT_FOUND');
  return { ...vehicle, classification: getFleetClassification(vehicle) };
}

async function getVehicleSuggestions(shipmentId) {
  if (!/^SG-[0-9]+$/i.test(shipmentId)) throw new AppError(400, 'shipmentId must match SG-####', 'INVALID_SHIPMENT_ID');
  const shipment = await Shipment.findOne({ shipmentId: shipmentId.toUpperCase() }).lean();
  if (!shipment) throw new AppError(404, 'Shipment not found', 'SHIPMENT_NOT_FOUND');
  const vehicles = await FleetVehicle.find({ status: 'available' }).sort({ utilizationPercent: 1, vehicleId: 1 }).lean();
  return {
    shipmentId: shipment.shipmentId,
    assignmentPerformed: false,
    criteria: {
      requiresTemperatureControl: shipment.temperatureRequired,
      currentRegion: shipment.currentLocation.region,
      minimumStatus: 'available'
    },
    suggestions: selectSuitableVehicles(vehicles, shipment).map(({ vehicle, reasons, remainingCapacityKg, regionMatch, temperatureCompatible }) => ({
      vehicleId: vehicle.vehicleId,
      vehicle,
      remainingCapacityKg,
      regionMatch,
      temperatureCompatible,
      reasons,
      recommendedAction: 'Review this vehicle manually; no assignment was performed.'
    }))
  };
}

module.exports = { OVERUTILIZED_THRESHOLD, IDLE_UTILIZATION_THRESHOLD, calculateFleetStats, getFleetClassification, selectSuitableVehicles, getFleetIntelligence, getFleetVehicle, getVehicleSuggestions };
