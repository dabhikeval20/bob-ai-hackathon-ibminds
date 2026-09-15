const mongoose = require('mongoose');
const { SensorLog } = require('../models');
const AppError = require('../errors/AppError');
const { buildPagination, parseDate } = require('../utils/api');

function parseObjectId(value, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(value)) throw new AppError(400, `${fieldName} must be a valid identifier`, 'INVALID_QUERY');
  return new mongoose.Types.ObjectId(value);
}

async function listSensorLogs(query) {
  const { page, limit, skip, shipmentId, vehicleId, isExcursion, from, to } = query;
  const filter = {};
  if (shipmentId) filter.shipmentId = parseObjectId(shipmentId, 'shipmentId');
  if (vehicleId) filter.vehicleId = parseObjectId(vehicleId, 'vehicleId');
  if (isExcursion !== undefined) {
    if (!['true', 'false'].includes(isExcursion)) throw new AppError(400, 'isExcursion must be true or false', 'INVALID_QUERY');
    filter.isExcursion = isExcursion === 'true';
  }
  const fromDate = parseDate(from, 'from');
  const toDate = parseDate(to, 'to');
  if (fromDate || toDate) {
    filter.recordedAt = {};
    if (fromDate) filter.recordedAt.$gte = fromDate;
    if (toDate) filter.recordedAt.$lte = toDate;
  }
  const [data, total] = await Promise.all([
    SensorLog.find(filter).populate('shipmentId', 'shipmentId').populate('vehicleId', 'vehicleId').sort({ recordedAt: -1 }).skip(skip).limit(limit).lean(),
    SensorLog.countDocuments(filter)
  ]);
  return { data, pagination: buildPagination(page, limit, total) };
}

module.exports = { listSensorLogs };
