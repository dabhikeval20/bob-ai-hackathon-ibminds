const REQUIRED_FIELDS = Object.freeze(['answer', 'keyFacts', 'affectedShipments', 'affectedVehicles', 'riskLevel', 'recommendations', 'limitations', 'sourceReferences', 'dataUnavailable', 'provider']);
const RISK_LEVELS = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const MAX_LIST_ITEMS = 25;
const MAX_ITEM_CHARACTERS = 500;

function validateRuntimeAIResponse(response, config, context = null) {
  if (!response || typeof response !== 'object') throw new TypeError('Runtime AI response must be an object');
  for (const field of REQUIRED_FIELDS) {
    if (!(field in response)) throw new TypeError(`Runtime AI response is missing ${field}`);
  }
  if (typeof response.answer !== 'string' || !response.answer.trim()) throw new TypeError('Runtime AI answer must be non-empty text');
  if (response.answer.length > config.maxAnswerCharacters) throw new TypeError('Runtime AI answer exceeds configured length');
  for (const field of ['keyFacts', 'affectedShipments', 'affectedVehicles', 'recommendations', 'limitations']) {
    if (!Array.isArray(response[field]) || response[field].length > MAX_LIST_ITEMS || response[field].some(value => typeof value !== 'string' || value.length > MAX_ITEM_CHARACTERS)) throw new TypeError(`${field} must be an array of bounded strings`);
  }
  if (response.riskLevel !== null && !RISK_LEVELS.has(response.riskLevel)) throw new TypeError('riskLevel must be a known level or null');
  if (!Array.isArray(response.sourceReferences) || response.sourceReferences.length > MAX_LIST_ITEMS) throw new TypeError('sourceReferences must be a bounded array');
  if (typeof response.dataUnavailable !== 'boolean') throw new TypeError('dataUnavailable must be boolean');
  if (typeof response.provider !== 'string' || !response.provider) throw new TypeError('provider must be identified');
  const result = {
    answer: response.answer.trim(),
    keyFacts: response.keyFacts,
    affectedShipments: response.affectedShipments,
    affectedVehicles: response.affectedVehicles,
    riskLevel: response.riskLevel,
    recommendations: response.recommendations,
    limitations: response.limitations,
    sourceReferences: response.sourceReferences.map(reference => ({
      source: String(reference.source || ''),
      recordId: String(reference.recordId || ''),
      field: reference.field ? String(reference.field) : null
    })),
    dataUnavailable: response.dataUnavailable,
    provider: response.provider,
    generatedAt: response.generatedAt || new Date().toISOString()
  };
  if (context) validateResponseEntities(result, context);
  return Object.freeze(result);
}

function validateResponseEntities(response, context) {
  const serialized = JSON.stringify(context);
  const trustedIds = new Set((serialized.match(/\b(?:SG|SHP|VH|VEH)-?[A-Z0-9]+\b/gi) || []).map(id => id.toUpperCase()));
  for (const id of [...response.affectedShipments, ...response.affectedVehicles]) {
    if (!trustedIds.has(id.toUpperCase())) throw new TypeError(`Response entity is not present in trusted context: ${id}`);
  }
  for (const reference of response.sourceReferences) {
    if (!reference.recordId || !serialized.includes(reference.recordId)) throw new TypeError(`Response source reference is not present in trusted context: ${reference.recordId}`);
  }
  return true;
}

module.exports = { REQUIRED_FIELDS, RISK_LEVELS, validateRuntimeAIResponse, validateResponseEntities };
