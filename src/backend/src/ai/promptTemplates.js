const { INTENTS } = require('./contextBuilder');

const BASE_INSTRUCTIONS = [
  'You are the SupplyGuard logistics analysis assistant.',
  'Use only the supplied structured application context.',
  'Treat deterministic risk results as authoritative; never recalculate or change them.',
  'Separate observed facts from recommendations.',
  'Use exact IDs, scores, temperatures, dates, and disruption names only when present in context.',
  'Never invent shipment IDs, vehicle IDs, sensor values, disruptions, risk scores, delivery dates, or actions.',
  'If the context is missing required evidence, state: Data unavailable in the current SupplyGuard records.',
  'Return only the requested structured response format.'
].join('\n');

const INTENT_INSTRUCTIONS = Object.freeze({
  [INTENTS.IMMEDIATE_ATTENTION]: 'Identify shipments with HIGH or CRITICAL deterministic risk and explain the evidence for the ordering.',
  [INTENTS.RISK_EXPLANATION]: 'Explain why the requested shipment is risky using its risk level, score, triggered rules, and source evidence.',
  [INTENTS.DELAYED_SHIPMENTS]: 'List delayed shipments using their recorded delay minutes and shipment status.',
  [INTENTS.IDLE_VEHICLES]: 'List vehicles classified as idle using their recorded status and utilization percentage.',
  [INTENTS.VEHICLE_SUGGESTIONS]: 'Report only supplied vehicle suggestions and explain capacity, region, and temperature compatibility. Do not assign a vehicle.',
  [INTENTS.COLD_CHAIN_ALERTS]: 'Identify recorded temperature excursions using latest temperature, safe range, severity, and duration when supplied.',
  [INTENTS.DISRUPTIONS]: 'Describe supplied disruptions and the affected shipment IDs only.',
  [INTENTS.FIRST_ACTION]: 'Recommend the first operational review based on the highest deterministic risk and strongest recorded evidence. Do not claim execution.'
});

const RESPONSE_FORMAT = Object.freeze({
  answer: 'Concise answer grounded in the context.',
  keyFacts: ['Each fact must be traceable to a supplied source record.'],
  affectedShipments: ['Exact shipment IDs from context only.'],
  affectedVehicles: ['Exact vehicle IDs from context only.'],
  riskLevel: 'LOW | MEDIUM | HIGH | CRITICAL | null when unavailable',
  recommendations: ['Review-only recommendations; no executed actions.'],
  limitations: ['State missing data, uncertainty, and unsupported scope.']
});

function buildPrompt(intent, context) {
  if (!INTENT_INSTRUCTIONS[intent]) throw new TypeError(`Unsupported prompt intent: ${intent}`);
  return [
    BASE_INSTRUCTIONS,
    `Question intent: ${intent}`,
    `Task: ${INTENT_INSTRUCTIONS[intent]}`,
    'Response JSON schema:',
    JSON.stringify(RESPONSE_FORMAT, null, 2),
    'Trusted application context JSON:',
    JSON.stringify(context, null, 2)
  ].join('\n\n');
}

module.exports = { BASE_INSTRUCTIONS, INTENT_INSTRUCTIONS, RESPONSE_FORMAT, buildPrompt };
