const AppError = require('../errors/AppError');
const RuntimeAIProvider = require('../ai/runtimeAIProvider');
const { buildAIContext, detectIntent, INTENTS } = require('../ai/contextBuilder');
const { buildPrompt } = require('../ai/promptTemplates');
const { validateRuntimeAIResponse } = require('../ai/responseContract');
const { assertRuntimeAIConfig } = require('../ai/providerConfig');
const { listRiskShipments, getRiskShipment, getRiskSummary } = require('./riskAnalysisService');
const { listShipments } = require('./shipmentService');
const { listDisruptions } = require('./disruptionService');
const { getFleetIntelligence, getVehicleSuggestions } = require('./fleetIntelligenceService');
const { getColdChainSummary, listColdChainAlerts } = require('./coldChainService');

function extractShipmentId(question) {
  return question.match(/\b(?:SG|SHP)-?\d+\b/i)?.[0]?.toUpperCase().replace(/^SHP/, 'SG-') || null;
}

function validateQuestion(question) {
  if (typeof question !== 'string' || !question.trim()) throw new AppError(400, 'question must be a non-empty string', 'INVALID_QUESTION');
  if (question.trim().length > 1000) throw new AppError(400, 'question must be 1000 characters or fewer', 'INVALID_QUESTION');
  const intent = detectIntent(question);
  if (!intent) throw new AppError(400, 'Question is outside the supported logistics topics', 'UNSUPPORTED_QUESTION');
  return { question: question.trim(), intent };
}

async function retrieveTrustedData(question, intent) {
  const empty = { shipment: null, risk: null, disruptions: [], fleet: [], sensors: [] };
  const shipmentId = extractShipmentId(question);
  if (intent === INTENTS.RISK_EXPLANATION && shipmentId) {
    const result = await getRiskShipment(shipmentId);
    return { shipment: result.shipment, risk: result, disruptions: [], fleet: [], sensors: [] };
  }
  if (intent === INTENTS.IMMEDIATE_ATTENTION || intent === INTENTS.FIRST_ACTION) {
    const result = await listRiskShipments({ page: 1, limit: 25 });
    return { ...empty, risk: await getRiskSummary(), shipments: result.data };
  }
  if (intent === INTENTS.DELAYED_SHIPMENTS) {
    const result = await listShipments({ page: 1, limit: 25, skip: 0, status: 'delayed' });
    return { ...empty, shipments: result.data };
  }
  if (intent === INTENTS.IDLE_VEHICLES) {
    const result = await getFleetIntelligence();
    return { ...empty, fleet: result.idle };
  }
  if (intent === INTENTS.VEHICLE_SUGGESTIONS) {
    return shipmentId ? { ...empty, fleet: (await getVehicleSuggestions(shipmentId)).suggestions, shipment: { shipmentId } } : empty;
  }
  if (intent === INTENTS.COLD_CHAIN_ALERTS) {
    const result = await listColdChainAlerts({ page: 1, limit: 25 });
    return { ...empty, sensors: result.data, summary: await getColdChainSummary() };
  }
  if (intent === INTENTS.DISRUPTIONS) {
    const result = await listDisruptions({ page: 1, limit: 25, skip: 0, status: 'active' });
    return { ...empty, disruptions: result.data };
  }
  return empty;
}

function flattenTrustedData(data) {
  return {
    shipment: data.shipment || data.shipments?.[0] || null,
    shipments: data.shipments || [],
    risk: data.risk || null,
    disruptions: data.disruptions || [],
    fleet: data.fleet || [],
    sensors: data.sensors || [],
    metadata: { recordCount: (data.shipments?.length || 0) + (data.disruptions?.length || 0) + (data.fleet?.length || 0) + (data.sensors?.length || 0) }
  };
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new AppError(504, 'Runtime AI provider timed out', 'AI_PROVIDER_TIMEOUT')), timeoutMs))
  ]);
}

function buildDeterministicResponse(intent, context) {
  const shipmentRecords = context.sources.mongodb.shipments || [];
  const focusedShipments = intent === INTENTS.IMMEDIATE_ATTENTION || intent === INTENTS.FIRST_ACTION
    ? shipmentRecords.filter(record => ['HIGH', 'CRITICAL', 'high', 'critical'].includes(record.riskLevel))
    : shipmentRecords;
  const shipment = context.sources.mongodb.shipment;
  const risk = context.sources.deterministic_risk_engine;
  const disruptions = context.sources.disruption_service || [];
  const fleet = context.sources.fleet_service || [];
  const sensors = context.sources.sensor_service || [];
  const affectedShipments = focusedShipments.map(record => record.shipmentId).filter(Boolean);
  const affectedVehicles = fleet.map(record => record.vehicleId).filter(Boolean);
  const sourceReferences = [];
  const keyFacts = [];

  if (shipment?.shipmentId) sourceReferences.push({ source: 'mongodb', recordId: shipment.shipmentId, field: 'shipmentId' });
  if (risk?.shipmentId) {
    sourceReferences.push({ source: 'deterministic_risk_engine', recordId: risk.shipmentId, field: 'riskScore' });
    if (risk.riskLevel && risk.riskScore !== undefined) keyFacts.push(`${risk.shipmentId} has deterministic ${risk.riskLevel} risk at ${risk.riskScore}/100.`);
    for (const reason of risk.riskReasons || risk.triggeredRules || []) {
      if (reason.reason || reason.message) keyFacts.push(reason.reason || reason.message);
    }
  }
  for (const record of focusedShipments.slice(0, 5)) {
    if (record.shipmentId) sourceReferences.push({ source: 'mongodb', recordId: record.shipmentId, field: 'status' });
    if (record.status || record.riskLevel) keyFacts.push(`${record.shipmentId} is ${record.status || 'recorded'}${record.riskLevel ? ` with ${record.riskLevel} risk` : ''}.`);
  }
  for (const record of fleet.slice(0, 5)) {
    if (record.vehicleId) sourceReferences.push({ source: 'fleet_service', recordId: record.vehicleId, field: 'status' });
  }
  for (const record of disruptions.slice(0, 5)) {
    if (record.disruptionId) sourceReferences.push({ source: 'disruption_service', recordId: record.disruptionId, field: 'severity' });
  }
  for (const record of sensors.slice(0, 5)) {
    if (record.shipmentId) sourceReferences.push({ source: 'sensor_service', recordId: record.shipmentId, field: 'temperatureCelsius' });
  }

  let answer = 'Data unavailable in the current SupplyGuard records.';
  let recommendations = [];
  if (risk?.shipmentId) {
    answer = `${risk.shipmentId} requires review based on the deterministic risk assessment.`;
    recommendations = risk.recommendedAction ? [risk.recommendedAction] : ['Review the shipment and supporting operational evidence.'];
  } else if (focusedShipments.length) {
    answer = `${focusedShipments.length} shipment(s) require attention based on the current deterministic risk records.`;
    recommendations = ['Review the listed records and confirm the next operational checkpoint.'];
  } else if (disruptions.length) {
    answer = `${disruptions.length} active disruption record(s) were returned from the current SupplyGuard data.`;
    recommendations = ['Review affected shipments and confirm a mitigation plan.'];
  } else if (fleet.length) {
    answer = `${fleet.length} fleet record(s) were returned from the current SupplyGuard data.`;
    recommendations = ['Review vehicle availability before making an operational decision.'];
  } else if (sensors.length) {
    answer = `${sensors.length} temperature alert record(s) were returned from the current SupplyGuard data.`;
    recommendations = ['Review the temperature readings and protect the affected cargo.'];
  }

  return {
    answer,
    keyFacts: keyFacts.slice(0, 25),
    affectedShipments,
    affectedVehicles,
    riskLevel: risk?.riskLevel || null,
    recommendations,
    limitations: ['This is a deterministic fallback response because no runtime AI provider is configured.', 'Recommendations are for manual review only; no action was executed.'],
    sourceReferences: sourceReferences.slice(0, 25),
    dataUnavailable: !focusedShipments.length && !shipment && !risk && !disruptions.length && !fleet.length && !sensors.length,
    provider: 'deterministic-fallback'
  };
}

async function askAssistant(question, dependencies = {}) {
  const validated = validateQuestion(question);
  const config = assertRuntimeAIConfig(dependencies.config || require('../config/env').runtimeAI);
  const data = await (dependencies.retrieveTrustedData || retrieveTrustedData)(validated.question, validated.intent);
  const context = buildAIContext({ question: validated.question, intent: validated.intent, ...flattenTrustedData(data) }, config.maxContextRecords);
  if (!config.enabled) return validateRuntimeAIResponse(buildDeterministicResponse(validated.intent, context), config, context);
  const prompt = buildPrompt(validated.intent, context);
  const provider = dependencies.provider || new RuntimeAIProvider(config);
  let rawResponse;
  try {
    rawResponse = await withTimeout(provider.answerLogisticsQuestion({ question: validated.question, intent: validated.intent, context, prompt }), config.timeoutMs);
  } catch (error) {
    if (error.code === 'AI_PROVIDER_TIMEOUT') throw error;
    if (error.code === 'AI_PROVIDER_NOT_CONFIGURED') throw error;
    throw new AppError(502, 'Runtime AI provider failed', 'AI_PROVIDER_UNAVAILABLE');
  }
  try {
    return validateRuntimeAIResponse(rawResponse, config, context);
  } catch (error) {
    throw new AppError(502, `Runtime AI response was invalid: ${error.message}`, 'AI_RESPONSE_INVALID');
  }
}

module.exports = { askAssistant, validateQuestion, retrieveTrustedData, extractShipmentId, flattenTrustedData, withTimeout, buildDeterministicResponse };
