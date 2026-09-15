const mongoose = require('mongoose');
const env = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const {
  Shipment,
  Disruption,
  FleetVehicle,
  SensorLog,
  AIRecommendation
} = require('../models');

const SEED_DATE = new Date('2026-09-14T08:00:00.000Z');
const ONE_HOUR = 60 * 60 * 1000;

function deterministicObjectId(number) {
  return new mongoose.Types.ObjectId(String(number).padStart(24, '0'));
}

function atHours(hours) {
  return new Date(SEED_DATE.getTime() + hours * ONE_HOUR);
}

function location(region, city, latitude, longitude, updatedAt = SEED_DATE) {
  return { region, city, latitude, longitude, updatedAt };
}

function assertSeedSafety(uri, destructive) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Synthetic seeding is disabled when NODE_ENV=production');
  }

  if (!destructive) return;

  const isLocal = /mongodb(?:\+srv)?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\//i.test(uri);
  if (process.env.SEED_ALLOW_DESTRUCTIVE !== 'true' || !isLocal) {
    throw new Error('Destructive reset requires SEED_ALLOW_DESTRUCTIVE=true and a localhost MongoDB URI');
  }
}

function createVehicles() {
  const utilizationLevels = [12, 28, 34, 41, 49, 56, 63, 71, 78, 84, 89, 93, 96, 98, 100];
  const statuses = ['available', 'available', 'assigned', 'available', 'in_transit', 'assigned', 'available', 'maintenance', 'in_transit', 'assigned', 'available', 'assigned', 'available', 'in_transit', 'available'];
  const vehicles = [];

  for (let index = 1; index <= 15; index += 1) {
    const vehicleId = deterministicObjectId(4000 + index);
    const capacityKg = index % 3 === 0 ? 12000 : 10000;
    const utilizationPercent = utilizationLevels[index - 1];
    vehicles.push({
      _id: vehicleId,
      vehicleId: `VH-${String(index).padStart(4, '0')}`,
      vehicleType: index % 4 === 0 ? 'refrigerated_truck' : index % 3 === 0 ? 'truck' : 'van',
      status: statuses[index - 1],
      region: ['Midwest', 'Northeast', 'South', 'West'][index % 4],
      capacityKg,
      currentLoadKg: Math.round(capacityKg * utilizationPercent / 100),
      utilizationPercent,
      temperatureControlled: index % 4 === 0 || index === 1,
      currentLocation: location('Indiana', index % 2 === 0 ? 'Indianapolis' : 'Fort Wayne', 39.7684 + index / 100, -86.1581 - index / 100),
      assignedShipmentIds: [],
      maintenanceDueAt: index === 8 ? atHours(24) : null,
      maintenanceStatus: index === 8 ? 'due' : index === 14 ? 'overdue' : 'current',
      isSynthetic: true,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE
    });
  }

  return vehicles;
}

function createShipments(vehicles, disruptions) {
  const priorities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['planned', 'in_transit', 'delayed', 'at_risk', 'delivered'];
  const cargoTypes = ['general', 'electronics', 'food', 'industrial', 'pharmaceutical'];
  const shipments = [];

  for (let index = 1; index <= 20; index += 1) {
    const vehicle = vehicles[(index - 1) % vehicles.length];
    const isColdChain = index === 1 || index === 2 || index === 6 || index === 12;
    const delayMinutes = [0, 15, 45, 90, 180, 360][index % 6];
    const riskScore = index === 1 ? 92 : index === 2 ? 84 : index === 3 ? 72 : Math.min(100, 10 + delayMinutes / 8 + (index % 4) * 8);
    const riskLevel = riskScore >= 85 ? 'critical' : riskScore >= 65 ? 'high' : riskScore >= 35 ? 'medium' : 'low';
    const shipment = {
      _id: deterministicObjectId(1000 + index),
      shipmentId: `SG-${String(index).padStart(4, '0')}`,
      origin: ['Chicago Distribution Center', 'Dallas Fulfillment Hub', 'Seattle Port', 'Atlanta Warehouse'][index % 4],
      destination: ['New York Hospital', 'Boston Retail Hub', 'Denver Medical Center', 'Miami Distribution Center'][index % 4],
      cargoType: isColdChain ? 'pharmaceutical' : cargoTypes[index % cargoTypes.length],
      priority: index === 1 ? 'critical' : priorities[index % priorities.length],
      status: index === 1 || index === 2 ? 'at_risk' : index === 4 ? 'delayed' : index === 5 ? 'delivered' : statuses[index % statuses.length],
      expectedDelivery: atHours(24 + index * 2),
      actualDelivery: index === 5 ? atHours(-2) : null,
      currentLocation: location('Indiana', index % 2 === 0 ? 'Indianapolis' : 'Fort Wayne', 39.7 + index / 100, -86.1 - index / 100),
      delayMinutes,
      temperatureRequired: isColdChain,
      temperatureMin: isColdChain ? 2 : null,
      temperatureMax: isColdChain ? 8 : null,
      currentTemperature: isColdChain ? (index === 1 || index === 2 ? 11.5 : 5.2) : null,
      assignedVehicle: vehicle._id,
      riskScore: Math.round(riskScore),
      riskLevel,
      riskReasons: [],
      activeDisruptionIds: [],
      lastCheckpointAt: atHours(-index),
      isSynthetic: true,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE
    };
    shipments.push(shipment);
    vehicle.assignedShipmentIds.push(shipment._id);
  }

  const storm = disruptions[0];
  const port = disruptions[1];
  shipments[0].activeDisruptionIds = [storm._id];
  shipments[0].riskReasons = [
    { code: 'TEMPERATURE_EXCURSION', label: 'Temperature above safe range', severity: 'critical', contribution: 40, sourceType: 'sensorLog', sourceId: deterministicObjectId(3001) },
    { code: 'ACTIVE_DISRUPTION', label: 'Severe weather on route', severity: 'high', contribution: 25, sourceType: 'disruption', sourceId: storm._id },
    { code: 'DELIVERY_DELAY', label: 'Delivery delay requires review', severity: 'high', contribution: 27, sourceType: 'shipment', sourceId: shipments[0]._id }
  ];
  shipments[1].activeDisruptionIds = [storm._id, port._id];
  shipments[1].riskReasons = [
    { code: 'TEMPERATURE_EXCURSION', label: 'Temperature above safe range', severity: 'high', contribution: 35, sourceType: 'sensorLog', sourceId: deterministicObjectId(3002) },
    { code: 'DELIVERY_DELAY', label: 'Shipment is delayed', severity: 'high', contribution: 30, sourceType: 'shipment', sourceId: shipments[1]._id }
  ];
  shipments[2].activeDisruptionIds = [port._id];
  shipments[2].riskReasons = [{ code: 'ACTIVE_DISRUPTION', label: 'Port congestion affects route', severity: 'high', contribution: 30, sourceType: 'disruption', sourceId: port._id }];

  return shipments;
}

function createDisruptions() {
  const definitions = [
    ['weather', 'Severe Midwest storm', 'Storm activity may delay regional transport.', 'high', ['Indiana', 'Ohio'], 240],
    ['port_congestion', 'East Coast port congestion', 'Synthetic congestion is affecting inbound schedules.', 'high', ['New York', 'New Jersey'], 180],
    ['road_closure', 'I-70 maintenance closure', 'A planned closure is slowing westbound traffic.', 'medium', ['Indiana', 'Illinois'], 90],
    ['customs', 'Customs review backlog', 'Synthetic review backlog is affecting priority cargo.', 'medium', ['New York'], 120],
    ['warehouse', 'Cold storage capacity warning', 'A warehouse is nearing cold-storage capacity.', 'critical', ['Boston'], 60]
  ];

  return definitions.map((definition, index) => ({
    _id: deterministicObjectId(2000 + index + 1),
    disruptionId: `DIS-${String(index + 1).padStart(4, '0')}`,
    type: definition[0],
    title: definition[1],
    description: definition[2],
    severity: definition[3],
    status: index === 4 ? 'monitoring' : 'active',
    affectedRegions: definition[4],
    startsAt: atHours(-12 + index),
    endsAt: atHours(24 + index * 6),
    estimatedDelayMinutes: definition[5],
    affectedShipmentIds: [],
    source: 'synthetic',
    isSynthetic: true,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE
  }));
}

function createSensorLogs(shipments, vehicles) {
  const logs = [];
  const coldShipmentIndexes = [0, 1, 5, 11];

  coldShipmentIndexes.forEach((shipmentIndex, position) => {
    const shipment = shipments[shipmentIndex];
    const vehicle = vehicles[shipmentIndex % vehicles.length];
    const excursion = position < 2;
    logs.push({
      _id: deterministicObjectId(3001 + position),
      readingId: `TEMP-${String(position + 1).padStart(4, '0')}`,
      shipmentId: shipment._id,
      vehicleId: vehicle._id,
      recordedAt: atHours(-2 - position),
      temperatureCelsius: excursion ? 11.5 + position : 5.2,
      minimumAllowed: 2,
      maximumAllowed: 8,
      isExcursion: excursion,
      excursionSeverity: excursion ? (position === 0 ? 'critical' : 'high') : null,
      sensorId: `SENSOR-${String(position + 1).padStart(3, '0')}`,
      location: shipment.currentLocation,
      isSynthetic: true,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE
    });
  });

  [0, 1].forEach((shipmentIndex, position) => {
    const shipment = shipments[shipmentIndex];
    const vehicle = vehicles[shipmentIndex % vehicles.length];
    logs.push({
      _id: deterministicObjectId(3025 + position),
      readingId: `TEMP-${String(25 + position).padStart(4, '0')}`,
      shipmentId: shipment._id,
      vehicleId: vehicle._id,
      recordedAt: atHours(-1.5 - position),
      temperatureCelsius: 10.8 + position,
      minimumAllowed: 2,
      maximumAllowed: 8,
      isExcursion: true,
      excursionSeverity: position === 0 ? 'critical' : 'high',
      sensorId: `SENSOR-${String(position + 1).padStart(3, '0')}`,
      location: shipment.currentLocation,
      isSynthetic: true,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE
    });
  });

  for (let index = 5; index <= 24; index += 1) {
    const shipment = shipments[index % shipments.length];
    const vehicle = vehicles[index % vehicles.length];
    logs.push({
      _id: deterministicObjectId(3000 + index),
      readingId: `TEMP-${String(index).padStart(4, '0')}`,
      shipmentId: shipment._id,
      vehicleId: vehicle._id,
      recordedAt: atHours(-index),
      temperatureCelsius: 18 + (index % 5),
      minimumAllowed: 0,
      maximumAllowed: 30,
      isExcursion: false,
      excursionSeverity: null,
      sensorId: `SENSOR-${String((index % 8) + 1).padStart(3, '0')}`,
      location: shipment.currentLocation,
      isSynthetic: true,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE
    });
  }

  return logs;
}

function createRecommendations(shipments, vehicles) {
  return [
    ['REC-0001', shipments[0]._id, vehicles[0]._id, 'escalate', 'critical', 'Escalate cold-chain shipment', 'Review the shipment because temperature exceeded the permitted range during an active disruption.', ['TEMPERATURE_EXCURSION', 'ACTIVE_DISRUPTION'], [deterministicObjectId(3001), deterministicObjectId(2001)], 0.98],
    ['REC-0002', shipments[1]._id, vehicles[1]._id, 'check_capacity', 'high', 'Check alternate capacity', 'Review nearby refrigerated capacity because the shipment is delayed and at risk.', ['DELIVERY_DELAY', 'FLEET_CAPACITY'], [shipments[1]._id, vehicles[1]._id], 0.91],
    ['REC-0003', shipments[2]._id, vehicles[2]._id, 'verify_route', 'high', 'Verify alternate route', 'Port congestion may extend the expected delivery window.', ['ACTIVE_DISRUPTION'], [deterministicObjectId(2002)], 0.89],
    ['REC-0004', shipments[7]._id, vehicles[7]._id, 'monitor', 'medium', 'Continue monitoring', 'The shipment has moderate risk but no critical exception.', ['MODERATE_RISK'], [shipments[7]._id], 0.84],
    ['REC-0005', shipments[11]._id, vehicles[11]._id, 'review', 'medium', 'Review cold-chain status', 'Confirm that the cold-chain shipment remains within its permitted range.', ['COLD_CHAIN'], [shipments[11]._id], 0.88]
  ].map(([recommendationId, shipmentId, vehicleId, type, priority, title, message, reasonCodes, supportingRecordIds, confidence], index) => ({
    _id: deterministicObjectId(5000 + index + 1),
    recommendationId,
    shipmentId,
    vehicleId,
    type,
    priority,
    title,
    message,
    reasonCodes,
    supportingRecordIds,
    source: 'deterministic',
    confidence,
    status: 'open',
    generatedAt: SEED_DATE,
    expiresAt: atHours(48),
    isSynthetic: true,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE
  }));
}

async function replaceDocuments(model, documents, destructive) {
  for (const document of documents) await model.validate(document);

  if (destructive) {
    await model.deleteMany({ _id: { $in: documents.map(document => document._id) } });
  }

  await model.bulkWrite(documents.map(document => ({
    replaceOne: { filter: { _id: document._id }, replacement: document, upsert: true }
  })), { ordered: true });
}

async function validateSeedData(data) {
  const counts = {};
  for (const [name, model, documents] of data) {
    counts[name] = await model.countDocuments({ _id: { $in: documents.map(document => document._id) } });
    if (counts[name] !== documents.length) throw new Error(`${name} count mismatch: expected ${documents.length}, got ${counts[name]}`);
  }

  const shipmentIds = new Set(data[0][2].map(document => String(document._id)));
  const vehicleIds = new Set(data[2][2].map(document => String(document._id)));
  const disruptionIds = new Set(data[1][2].map(document => String(document._id)));
  const sensorIds = new Set(data[3][2].map(document => String(document._id)));

  for (const shipment of data[0][2]) {
    if (!vehicleIds.has(String(shipment.assignedVehicle))) throw new Error(`Shipment ${shipment.shipmentId} references a missing vehicle`);
    if (shipment.activeDisruptionIds.some(id => !disruptionIds.has(String(id)))) throw new Error(`Shipment ${shipment.shipmentId} references a missing disruption`);
  }
  for (const disruption of data[1][2]) {
    if (disruption.affectedShipmentIds.some(id => !shipmentIds.has(String(id)))) throw new Error(`Disruption ${disruption.disruptionId} references a missing shipment`);
  }
  for (const vehicle of data[2][2]) {
    if (vehicle.assignedShipmentIds.some(id => !shipmentIds.has(String(id)))) throw new Error(`Vehicle ${vehicle.vehicleId} references a missing shipment`);
  }
  for (const sensor of data[3][2]) {
    if (!shipmentIds.has(String(sensor.shipmentId)) || !vehicleIds.has(String(sensor.vehicleId))) throw new Error(`Sensor ${sensor.readingId} has an invalid relationship`);
  }
  for (const recommendation of data[4][2]) {
    if (!shipmentIds.has(String(recommendation.shipmentId)) || !vehicleIds.has(String(recommendation.vehicleId))) throw new Error(`Recommendation ${recommendation.recommendationId} has an invalid relationship`);
    if (recommendation.supportingRecordIds.some(id => !sensorIds.has(String(id)) && !disruptionIds.has(String(id)) && !shipmentIds.has(String(id)) && !vehicleIds.has(String(id)))) throw new Error(`Recommendation ${recommendation.recommendationId} has an invalid supporting record`);
  }

  const examples = {
    highRiskShipment: data[0][2].find(shipment => shipment.riskLevel === 'critical'),
    delayedShipment: data[0][2].find(shipment => shipment.delayMinutes >= 180),
    temperatureExcursionShipment: data[0][2].find(shipment => shipment.shipmentId === 'SG-0001'),
    availableVehicle: data[2][2].find(vehicle => vehicle.status === 'available'),
    overutilizedVehicle: data[2][2].find(vehicle => vehicle.utilizationPercent >= 98),
    multiShipmentDisruption: data[1][2].find(disruption => disruption.affectedShipmentIds.length >= 2)
  };
  if (Object.values(examples).some(example => !example)) throw new Error('Required dashboard examples are missing');
  return { counts, examples };
}

async function run() {
  const destructive = process.argv.includes('--reset');
  assertSeedSafety(env.mongodbUri, destructive);

  const vehicles = createVehicles();
  const disruptions = createDisruptions();
  const shipments = createShipments(vehicles, disruptions);
  disruptions[0].affectedShipmentIds = [shipments[0]._id, shipments[1]._id, shipments[2]._id, shipments[3]._id];
  disruptions[1].affectedShipmentIds = [shipments[1]._id, shipments[2]._id, shipments[4]._id];
  disruptions[2].affectedShipmentIds = [shipments[5]._id, shipments[6]._id];
  disruptions[3].affectedShipmentIds = [shipments[2]._id, shipments[8]._id];
  disruptions[4].affectedShipmentIds = [shipments[0]._id, shipments[11]._id];
  const sensorLogs = createSensorLogs(shipments, vehicles);
  const recommendations = createRecommendations(shipments, vehicles);

  await connectDatabase(env.mongodbUri);
  try {
    const datasets = [
      ['Shipment', Shipment, shipments],
      ['Disruption', Disruption, disruptions],
      ['FleetVehicle', FleetVehicle, vehicles],
      ['SensorLog', SensorLog, sensorLogs],
      ['AIRecommendation', AIRecommendation, recommendations]
    ];
    for (const [, model, documents] of datasets) await replaceDocuments(model, documents, destructive);
    const result = await validateSeedData(datasets);
    console.log(JSON.stringify({ mode: destructive ? 'reset-and-upsert' : 'upsert-only', ...result }, null, 2));
  } finally {
    await disconnectDatabase();
  }
}

run().catch(error => {
  console.error(`Synthetic seed failed: ${error.message}`);
  process.exitCode = 1;
});
