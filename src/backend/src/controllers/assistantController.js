const { askAssistant } = require('../services/assistantService');
const { sendData } = require('../utils/api');

async function askAssistantController(req, res) {
  return sendData(res, await askAssistant(req.body?.question));
}

module.exports = { askAssistantController };
