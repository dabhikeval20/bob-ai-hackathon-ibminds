const test = require('node:test');
const assert = require('node:assert/strict');
const { askAssistant } = require('../src/services/assistantService');
const { buildRuntimeAIConfig, assertRuntimeAIConfig } = require('../src/ai/providerConfig');

const enabledConfig = assertRuntimeAIConfig(buildRuntimeAIConfig({ RUNTIME_AI_PROVIDER: 'external', RUNTIME_AI_BASE_URL: 'https://provider.test', RUNTIME_AI_MODEL: 'test-model', RUNTIME_AI_API_KEY: 'secret', RUNTIME_AI_TIMEOUT_MS: '250' }));

function response(overrides = {}) {
  return {
    answer: 'SHP001 needs immediate attention because its deterministic risk score is 72.',
    keyFacts: ['SHP001 has a deterministic risk score of 72.'],
    affectedShipments: ['SHP001'],
    affectedVehicles: [],
    riskLevel: 'HIGH',
    recommendations: ['Review the shipment manually.'],
    limitations: [],
    sourceReferences: [{ source: 'deterministic_risk_engine', recordId: 'SHP001', field: 'riskScore' }],
    dataUnavailable: false,
    provider: 'test-provider',
    ...overrides
  };
}

function retrieval() {
  return Promise.resolve({
    shipments: [{ shipmentId: 'SHP001', riskLevel: 'HIGH', riskScore: 72 }],
    risk: { shipmentId: 'SHP001', riskLevel: 'HIGH', riskScore: 72, triggeredRules: [] },
    disruptions: [],
    fleet: [],
    sensors: []
  });
}

test('returns structured response for a valid question with a provider', async () => {
  const result = await askAssistant('Which shipments need immediate attention?', { config: enabledConfig, retrieveTrustedData: retrieval, provider: { answerLogisticsQuestion: async () => response() } });
  assert.equal(result.riskLevel, 'HIGH');
  assert.deepEqual(result.affectedShipments, ['SHP001']);
});

test('rejects an empty question before data retrieval', async () => {
  await assert.rejects(askAssistant('   ', { config: enabledConfig }), error => error.code === 'INVALID_QUESTION' && error.statusCode === 400);
});

test('returns a provider-grounded unavailable response when data is missing', async () => {
  const result = await askAssistant('Which vehicles are idle?', { config: enabledConfig, retrieveTrustedData: async () => ({ shipment: null, risk: null, disruptions: [], fleet: [], sensors: [] }), provider: { answerLogisticsQuestion: async () => response({ answer: 'Data unavailable in the current SupplyGuard records.', keyFacts: [], affectedShipments: [], affectedVehicles: [], riskLevel: null, recommendations: [], limitations: ['No fleet records were available.'], sourceReferences: [], dataUnavailable: true }) } });
  assert.equal(result.dataUnavailable, true);
  assert.match(result.limitations[0], /fleet/);
});

test('maps provider failures to a safe structured API error', async () => {
  await assert.rejects(askAssistant('Which shipments are delayed?', { config: enabledConfig, retrieveTrustedData: retrieval, provider: { answerLogisticsQuestion: async () => { throw new Error('provider offline'); } } }), error => error.code === 'AI_PROVIDER_UNAVAILABLE' && error.statusCode === 502);
});

test('maps provider timeout to AI_PROVIDER_TIMEOUT', async () => {
  await assert.rejects(askAssistant('Which shipments are delayed?', { config: enabledConfig, retrieveTrustedData: retrieval, provider: { answerLogisticsQuestion: async () => new Promise(() => {}) } }), error => error.code === 'AI_PROVIDER_TIMEOUT' && error.statusCode === 504);
});

test('rejects invalid AI response shape', async () => {
  await assert.rejects(askAssistant('Why is SHP001 high risk?', { config: enabledConfig, retrieveTrustedData: retrieval, provider: { answerLogisticsQuestion: async () => ({ answer: 'unsupported', keyFacts: [] }) } }), error => error.code === 'AI_RESPONSE_INVALID' && error.statusCode === 502);
});

test('rejects unsupported claims in provider response', async () => {
  await assert.rejects(askAssistant('Why is SHP001 high risk?', { config: enabledConfig, retrieveTrustedData: retrieval, provider: { answerLogisticsQuestion: async () => response({ affectedShipments: ['NOT-IN-CONTEXT'] }) } }), error => error.code === 'AI_RESPONSE_INVALID' && error.statusCode === 502);
});

test('returns a deterministic fallback without a provider', async () => {
  const disabled = assertRuntimeAIConfig(buildRuntimeAIConfig({ RUNTIME_AI_PROVIDER: 'disabled' }));
  const result = await askAssistant('Which shipments need immediate attention?', { config: disabled, retrieveTrustedData: retrieval });
  assert.equal(result.provider, 'deterministic-fallback');
  assert.deepEqual(result.affectedShipments, ['SHP001']);
  assert.match(result.limitations[0], /deterministic fallback/);
});
