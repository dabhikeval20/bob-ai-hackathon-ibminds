const { Shipment } = require('../models');
const AppError = require('../errors/AppError');
const { buildPagination } = require('../utils/api');

async function listShipments(query) {
  const { page, limit, skip, status, riskLevel, priority, region } = query;
  const filter = {};
  if (status) filter.status = status;
  if (riskLevel) filter.riskLevel = riskLevel;
  if (priority) filter.priority = priority;
  if (region) filter['currentLocation.region'] = region;
  const [data, total] = await Promise.all([
    Shipment.find(filter).sort({ riskScore: -1, expectedDelivery: 1 }).skip(skip).limit(limit).lean(),
    Shipment.countDocuments(filter)
  ]);
  return { data, pagination: buildPagination(page, limit, total) };
}

async function getShipmentById(shipmentId) {
  if (!/^SG-[0-9]+$/i.test(shipmentId)) throw new AppError(400, 'shipmentId must match SG-####', 'INVALID_SHIPMENT_ID');
  const shipment = await Shipment.findOne({ shipmentId: shipmentId.toUpperCase() }).lean();
  if (!shipment) throw new AppError(404, 'Shipment not found', 'SHIPMENT_NOT_FOUND');
  return shipment;
}

module.exports = { listShipments, getShipmentById };
