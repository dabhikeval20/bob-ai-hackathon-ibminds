const test = require('node:test');
const assert = require('node:assert/strict');
const RuntimeAIProvider = require('../src/ai/runtimeAIProvider');
const { buildRuntimeAIConfig, assertRuntimeAIConfig } = require('../src/ai/providerConfig');
const { createTrustedContext, validateTrustedContext } = require('../src/ai/trustedContext');
const { validateRuntimeAIResponse } = require('../src/ai/responseContract');

test('defaults runtime AI to disabled without credentials', () => {
  const config = assertRuntimeAIConfig(buildRuntimeAIConfig({ RUNTIME_AI_PROVIDER: 'disabled' }));
  assert.equal(config.enabled, false);
  assert.equal(config.provider, 'disabled');
});

test('rejects incomplete enabled provider configuration', () => {
  assert.throws(() => assertRuntimeAIConfig(buildRuntimeAIConfig({ RUNTIME_AI_PROVIDER: 'external' })), /requires base URL/);
});

test('limits trusted context to approved sources and record count', () => {
  const context = createTrustedContext({ question: 'Why is SG-0001 risky?', shipment: { shipmentId: 'SG-0001' }, risk: { riskScore: 78 }, disruptions: [], fleet: [], sensors: [] });
  assert.equal(validateTrustedContext(context, 5), true);
  assert.throws(() => validateTrustedContext(createTrustedContext({ question: 'x', shipment: {}, risk: {}, disruptions: [{ id: 1 }, { id: 2 }], fleet: [], sensors: [] }), 2), /exceeds/);
});

test('validates grounded response shape', () => {
  const config = assertRuntimeAIConfig(buildRuntimeAIConfig({ RUNTIME_AI_PROVIDER: 'disabled' }));
  const response = validateRuntimeAIResponse({ answer: 'Data unavailable in the current SupplyGuard records.', keyFacts: [], affectedShipments: [], affectedVehicles: [], riskLevel: null, recommendations: [], limitations: ['No trusted records were supplied.'], sourceReferences: [], dataUnavailable: true, provider: 'disabled' }, config);
  assert.equal(response.dataUnavailable, true);
  assert.equal(response.sourceReferences.length, 0);
  assert.throws(() => validateRuntimeAIResponse({ answer: 'Unsupported answer', sourceReferences: [] }, config), /missing keyFacts/);
});

test('base provider fails explicitly instead of pretending to answer', async () => {
  const provider = new RuntimeAIProvider({ provider: 'disabled' });
  await assert.rejects(provider.answerLogisticsQuestion(), error => error.code === 'AI_PROVIDER_NOT_CONFIGURED' && error.statusCode === 501);
});
