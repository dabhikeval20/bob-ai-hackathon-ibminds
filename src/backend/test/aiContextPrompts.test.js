const test = require('node:test');
const assert = require('node:assert/strict');
const { INTENTS, detectIntent, buildAIContext } = require('../src/ai/contextBuilder');
const { buildPrompt } = require('../src/ai/promptTemplates');
const { buildRuntimeAIConfig, assertRuntimeAIConfig } = require('../src/ai/providerConfig');
const { validateRuntimeAIResponse } = require('../src/ai/responseContract');

const config = assertRuntimeAIConfig(buildRuntimeAIConfig({ RUNTIME_AI_PROVIDER: 'disabled' }));
const syntheticContext = buildAIContext({
  question: 'Why is shipment SHP001 high risk?',
  intent: INTENTS.RISK_EXPLANATION,
  shipment: { shipmentId: 'SHP001', deliveryDate: '2026-09-16T12:00:00Z', secret: 'remove-me' },
  risk: { shipmentId: 'SHP001', riskLevel: 'HIGH', riskScore: 72, triggeredRules: [{ code: 'DELIVERY_DELAY' }] },
  disruptions: [{ disruptionId: 'DIS001', title: 'Storm', affectedShipmentIds: ['SHP001'] }],
  fleet: [{ vehicleId: 'VH001', utilizationPercent: 12 }],
  sensors: [{ readingId: 'TEMP001', temperatureCelsius: 11, isExcursion: true }]
}, 25);

test('detects supported logistics intents', () => {
  assert.equal(detectIntent('Which shipments need immediate attention?'), INTENTS.IMMEDIATE_ATTENTION);
  assert.equal(detectIntent('Which vehicles are idle?'), INTENTS.IDLE_VEHICLES);
  assert.equal(detectIntent('Are there any cold-chain temperature alerts?'), INTENTS.COLD_CHAIN_ALERTS);
  assert.equal(detectIntent('What should the logistics manager do first?'), INTENTS.FIRST_ACTION);
  assert.equal(detectIntent('Tell me a joke'), null);
});

test('builds sanitized trusted context with application evidence', () => {
  assert.equal(syntheticContext.metadata.intent, INTENTS.RISK_EXPLANATION);
  assert.equal(syntheticContext.sources.mongodb.shipment.secret, undefined);
  assert.equal(syntheticContext.sources.deterministic_risk_engine.riskScore, 72);
  assert.equal(syntheticContext.sources.disruption_service[0].disruptionId, 'DIS001');
});

test('renders a structured risk prompt with grounding instructions', () => {
  const prompt = buildPrompt(INTENTS.RISK_EXPLANATION, syntheticContext);
  assert.match(prompt, /never invent/i);
  assert.match(prompt, /separate observed facts from recommendations/i);
  assert.match(prompt, /SHP001/);
  assert.match(prompt, /riskScore/);
  assert.match(prompt, /affectedShipments/);
});

test('accepts only response entities present in context', () => {
  const valid = validateRuntimeAIResponse({
    answer: 'SHP001 is high risk because its deterministic score is 72.',
    keyFacts: ['SHP001 has a deterministic risk score of 72.'],
    affectedShipments: ['SHP001'],
    affectedVehicles: ['VH001'],
    riskLevel: 'HIGH',
    recommendations: ['Review the delayed shipment.'],
    limitations: [],
    sourceReferences: [{ source: 'deterministic_risk_engine', recordId: 'SHP001', field: 'riskScore' }],
    dataUnavailable: false,
    provider: 'disabled'
  }, config, syntheticContext);
  assert.equal(valid.riskLevel, 'HIGH');
  assert.throws(() => validateRuntimeAIResponse({ ...valid, affectedShipments: ['UNSUPPORTED'] }, config, syntheticContext), /not present in trusted context/);
});
