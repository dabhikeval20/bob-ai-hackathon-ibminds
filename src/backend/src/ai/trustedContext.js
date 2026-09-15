const ALLOWED_CONTEXT_SOURCES = Object.freeze(['mongodb', 'deterministic_risk_engine', 'disruption_service', 'fleet_service', 'sensor_service']);

function createTrustedContext({ question, shipment, shipments = [], risk, disruptions = [], fleet = [], sensors = [], metadata = {} }) {
  return Object.freeze({
    question: String(question || '').trim(),
    sources: Object.freeze({
      mongodb: Object.freeze({ shipment: shipment || null, shipments: Object.freeze(shipments) }),
      deterministic_risk_engine: risk || null,
      disruption_service: Object.freeze(disruptions),
      fleet_service: Object.freeze(fleet),
      sensor_service: Object.freeze(sensors)
    }),
    metadata: Object.freeze({
      generatedAt: new Date().toISOString(),
      ...metadata
    })
  });
}

function validateTrustedContext(context, maxRecords = 25) {
  if (!context || typeof context.question !== 'string' || !context.question) throw new TypeError('Trusted context requires a question');
  const sources = context.sources || {};
  for (const source of ALLOWED_CONTEXT_SOURCES) {
    if (!(source in sources)) throw new TypeError(`Trusted context is missing source: ${source}`);
  }
  const recordCount = Object.values(sources).reduce((count, value) => count + (Array.isArray(value) ? value.length : value ? 1 : 0), 0);
  if (recordCount > maxRecords) throw new RangeError(`Trusted context exceeds ${maxRecords} records`);
  return true;
}

module.exports = { ALLOWED_CONTEXT_SOURCES, createTrustedContext, validateTrustedContext };
