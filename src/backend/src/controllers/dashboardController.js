const { getDashboardSummary } = require('../services/dashboardService');
const { sendData } = require('../utils/api');

async function getDashboardSummaryController(req, res) {
  return sendData(res, await getDashboardSummary());
}

module.exports = { getDashboardSummaryController };
