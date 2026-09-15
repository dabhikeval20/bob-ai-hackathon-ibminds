require('dotenv').config();
const { buildRuntimeAIConfig, assertRuntimeAIConfig } = require('../ai/providerConfig');

const env = {
  port: Number(process.env.PORT || 8000),
  host: process.env.HOST || '127.0.0.1',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/supplyguard',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  apiAccessKey: process.env.API_ACCESS_KEY || null,
  runtimeAI: assertRuntimeAIConfig(buildRuntimeAIConfig(process.env))
};

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}
if (env.apiAccessKey !== null && env.apiAccessKey.length < 16) {
  throw new Error('API_ACCESS_KEY must be at least 16 characters');
}

module.exports = env;
