const AppError = require('../errors/AppError');

class RuntimeAIProvider {
  constructor(config) {
    this.config = config;
  }

  async answerLogisticsQuestion() {
    throw new AppError(501, 'Runtime AI provider is not configured', 'AI_PROVIDER_NOT_CONFIGURED');
  }

  async explainShipmentRisk() {
    throw new AppError(501, 'Runtime AI provider is not configured', 'AI_PROVIDER_NOT_CONFIGURED');
  }

  async summarizeRecommendation() {
    throw new AppError(501, 'Runtime AI provider is not configured', 'AI_PROVIDER_NOT_CONFIGURED');
  }
}

module.exports = RuntimeAIProvider;
