const AppError = require('../errors/AppError');

const SUPPORTED_PROVIDERS = new Set(['disabled', 'external']);

function buildRuntimeAIConfig(environment = process.env) {
  const provider = (environment.RUNTIME_AI_PROVIDER || 'disabled').toLowerCase();
  if (!SUPPORTED_PROVIDERS.has(provider)) {
    throw new AppError(500, `Unsupported runtime AI provider: ${provider}`, 'AI_PROVIDER_INVALID');
  }

  return Object.freeze({
    provider,
    baseUrl: environment.RUNTIME_AI_BASE_URL || null,
    model: environment.RUNTIME_AI_MODEL || null,
    apiKey: environment.RUNTIME_AI_API_KEY || null,
    timeoutMs: Number(environment.RUNTIME_AI_TIMEOUT_MS || 5000),
    maxContextRecords: Number(environment.RUNTIME_AI_MAX_CONTEXT_RECORDS || 25),
    maxAnswerCharacters: Number(environment.RUNTIME_AI_MAX_ANSWER_CHARACTERS || 4000),
    enabled: provider !== 'disabled'
  });
}

function assertRuntimeAIConfig(config) {
  if (!Number.isInteger(config.timeoutMs) || config.timeoutMs < 250 || config.timeoutMs > 30000) {
    throw new AppError(500, 'RUNTIME_AI_TIMEOUT_MS must be between 250 and 30000', 'AI_CONFIG_INVALID');
  }
  if (!Number.isInteger(config.maxContextRecords) || config.maxContextRecords < 1 || config.maxContextRecords > 100) {
    throw new AppError(500, 'RUNTIME_AI_MAX_CONTEXT_RECORDS must be between 1 and 100', 'AI_CONFIG_INVALID');
  }
  if (!Number.isInteger(config.maxAnswerCharacters) || config.maxAnswerCharacters < 100 || config.maxAnswerCharacters > 10000) {
    throw new AppError(500, 'RUNTIME_AI_MAX_ANSWER_CHARACTERS must be between 100 and 10000', 'AI_CONFIG_INVALID');
  }
  if (config.enabled && (!config.baseUrl || !config.model || !config.apiKey)) {
    throw new AppError(500, 'Enabled runtime AI requires base URL, model, and API key', 'AI_CONFIG_INCOMPLETE');
  }
  return config;
}

module.exports = { SUPPORTED_PROVIDERS, buildRuntimeAIConfig, assertRuntimeAIConfig };
