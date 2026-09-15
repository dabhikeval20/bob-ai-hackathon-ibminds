const { listShipments, getShipmentById } = require('../services/shipmentService');
const { parsePagination, sendData, sendList } = require('../utils/api');

async function listShipmentsController(req, res) {
  const pagination = parsePagination(req.query);
  const result = await listShipments({ ...req.query, ...pagination });
  return sendList(res, result.data, result.pagination);
}

async function getShipmentController(req, res) {
  return sendData(res, await getShipmentById(req.params.shipmentId));
}

module.exports = { listShipmentsController, getShipmentController };
