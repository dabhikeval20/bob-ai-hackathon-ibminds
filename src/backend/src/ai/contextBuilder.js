const { createTrustedContext, validateTrustedContext } = require('./trustedContext');

const INTENTS = Object.freeze({
  IMMEDIATE_ATTENTION: 'immediate_attention',
  RISK_EXPLANATION: 'risk_explanation',
  DELAYED_SHIPMENTS: 'delayed_shipments',
  IDLE_VEHICLES: 'idle_vehicles',
  VEHICLE_SUGGESTIONS: 'vehicle_suggestions',
  COLD_CHAIN_ALERTS: 'cold_chain_alerts',
  DISRUPTIONS: 'disruptions',
  FIRST_ACTION: 'first_action'
});

const INTENT_BY_KEYWORD = Object.freeze([
  [INTENTS.IMMEDIATE_ATTENTION, ['immediate attention', 'need attention', 'urgent']],
  [INTENTS.RISK_EXPLANATION, ['why is', 'why is shipment', 'high risk', 'risky']],
  [INTENTS.DELAYED_SHIPMENTS, ['delayed shipments', 'which shipments are delayed', 'delays']],
  [INTENTS.IDLE_VEHICLES, ['idle vehicles', 'which vehicles are idle', 'underutilized']],
  [INTENTS.VEHICLE_SUGGESTIONS, ['which vehicles can help', 'suitable vehicles', 'vehicle can help', 'available vehicles']],
  [INTENTS.COLD_CHAIN_ALERTS, ['temperature alerts', 'cold-chain', 'cold chain', 'temperature excursion']],
  [INTENTS.DISRUPTIONS, ['disruptions', 'what disruptions', 'affected shipments']],
  [INTENTS.FIRST_ACTION, ['what should', 'do first', 'first action', 'logistics manager']]
]);

function detectIntent(question) {
  const normalized = String(question || '').toLowerCase();
  return INTENT_BY_KEYWORD.find(([, keywords]) => keywords.some(keyword => normalized.includes(keyword)))?.[0] || null;
}

function pick(value, fields) {
  if (!value || typeof value !== 'object') return null;
  return fields.reduce((result, field) => {
    if (value[field] !== undefined) result[field] = value[field];
    return result;
  }, {});
}

function normalizeShipment(shipment) {
  return pick(shipment, ['shipmentId', 'origin', 'destination', 'cargoType', 'priority', 'status', 'expectedDelivery', 'delayMinutes', 'temperatureRequired', 'currentTemperature', 'riskLevel', 'riskScore']);
}

function normalizeRisk(risk) {
  return risk ? pick(risk, ['shipmentId', 'riskLevel', 'riskScore', 'riskReasons', 'triggeredRules', 'recommendedAction', 'affectedShipmentIds', 'calculatedAt']) : null;
}

function normalizeDisruption(disruption) {
  return pick(disruption, ['disruptionId', 'type', 'title', 'severity', 'status', 'affectedRegions', 'affectedShipmentIds', 'estimatedDelayMinutes', 'startsAt', 'endsAt']);
}

function normalizeVehicle(vehicle) {
  return pick(vehicle, ['vehicleId', 'vehicleType', 'status', 'region', 'capacityKg', 'currentLoadKg', 'utilizationPercent', 'temperatureControlled', 'maintenanceStatus']);
}

function normalizeSensor(sensor) {
  return pick(sensor, ['readingId', 'shipmentId', 'sensorId', 'recordedAt', 'temperatureCelsius', 'minimumAllowed', 'maximumAllowed', 'isExcursion', 'excursionSeverity']);
}

function buildAIContext({ question, intent, shipment = null, shipments = [], risk = null, disruptions = [], fleet = [], sensors = [], metadata = {} }, maxContextRecords = 25) {
  const resolvedIntent = intent || detectIntent(question);
  if (!resolvedIntent || !Object.values(INTENTS).includes(resolvedIntent)) throw new TypeError('Unsupported logistics question intent');
  const context = createTrustedContext({
    question,
    shipment: normalizeShipment(shipment),
    shipments: shipments.map(normalizeShipment),
    risk: normalizeRisk(risk),
    disruptions: disruptions.map(normalizeDisruption),
    fleet: fleet.map(normalizeVehicle),
    sensors: sensors.map(normalizeSensor),
    metadata: { intent: resolvedIntent, ...metadata }
  });
  validateTrustedContext(context, maxContextRecords);
  return context;
}

module.exports = { INTENTS, detectIntent, buildAIContext, normalizeShipment, normalizeRisk, normalizeDisruption, normalizeVehicle, normalizeSensor };
