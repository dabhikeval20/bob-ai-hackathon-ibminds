const { listRiskShipments, getRiskShipment, getRiskSummary, listRiskRecommendations } = require('../services/riskAnalysisService');
const { parsePagination, sendData, sendList } = require('../utils/api');

async function listRiskShipmentsController(req, res) {
  const pagination = parsePagination(req.query);
  const result = await listRiskShipments({ ...req.query, ...pagination });
  return sendList(res, result.data, result.pagination);
}

async function getRiskShipmentController(req, res) {
  return sendData(res, await getRiskShipment(req.params.shipmentId));
}

async function getRiskSummaryController(req, res) {
  return sendData(res, await getRiskSummary());
}

async function listRiskRecommendationsController(req, res) {
  const pagination = parsePagination(req.query);
  const result = await listRiskRecommendations({ ...req.query, ...pagination });
  return sendList(res, result.data, result.pagination);
}

module.exports = { listRiskShipmentsController, getRiskShipmentController, getRiskSummaryController, listRiskRecommendationsController };
