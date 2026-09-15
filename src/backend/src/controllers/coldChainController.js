const { sendData, sendList } = require('../utils/api');
const { getColdChainSummary, listColdChainAlerts, getShipmentTemperatureDetails } = require('../services/coldChainService');
const { parsePagination } = require('../utils/api');

async function getColdChainSummaryController(req, res) {
  return sendData(res, await getColdChainSummary());
}

async function listColdChainAlertsController(req, res) {
  const pagination = parsePagination(req.query);
  const result = await listColdChainAlerts({ ...req.query, ...pagination });
  return sendList(res, result.data, result.pagination);
}

async function getShipmentTemperatureController(req, res) {
  return sendData(res, await getShipmentTemperatureDetails(req.params.shipmentId));
}

module.exports = { getColdChainSummaryController, listColdChainAlertsController, getShipmentTemperatureController };
