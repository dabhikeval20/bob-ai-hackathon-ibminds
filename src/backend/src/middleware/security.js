const crypto = require('crypto');
const { rateLimit } = require('express-rate-limit');
const AppError = require('../errors/AppError');
const env = require('../config/env');

function getPresentedKey(req) {
  const bearer = req.get('authorization');
  if (bearer && /^Bearer\s+\S+$/i.test(bearer)) return bearer.replace(/^Bearer\s+/i, '');
  return req.get('x-api-key');
}

function keysMatch(presentedKey, configuredKey) {
  if (!presentedKey || !configuredKey) return false;
  const presented = Buffer.from(presentedKey);
  const configured = Buffer.from(configuredKey);
  return presented.length === configured.length && crypto.timingSafeEqual(presented, configured);
}

function requireApiKey(req, res, next) {
  if (!env.apiAccessKey) {
    return next(new AppError(503, 'API access is not configured', 'API_AUTH_NOT_CONFIGURED'));
  }
  if (!keysMatch(getPresentedKey(req), env.apiAccessKey)) {
    return next(new AppError(401, 'Authentication required', 'AUTHENTICATION_REQUIRED'));
  }
  return next();
}

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } }
});

const assistantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many assistant requests' } }
});

module.exports = { requireApiKey, apiRateLimit, assistantRateLimit };
