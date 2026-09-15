function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const safeMessages = new Set(['AI_PROVIDER_NOT_CONFIGURED', 'AI_PROVIDER_TIMEOUT', 'AI_PROVIDER_UNAVAILABLE', 'AI_RESPONSE_INVALID', 'AI_CONFIG_INVALID', 'AI_CONFIG_INCOMPLETE', 'API_AUTH_NOT_CONFIGURED']);
  if (statusCode >= 500) console.error({ code, statusCode, message: error.message });
  res.status(statusCode).json({ error: { code, message: statusCode >= 500 && !safeMessages.has(code) ? 'Internal server error' : error.message } });
}

module.exports = { notFound, errorHandler };
