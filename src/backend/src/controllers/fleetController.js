const { listFleetVehicles } = require('../services/fleetService');
const { parsePagination, sendList } = require('../utils/api');
const AppError = require('../errors/AppError');

function parseUtilization(value, fieldName) {
  if (value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100) throw new AppError(400, `${fieldName} must be between 0 and 100`, 'INVALID_QUERY');
  return number;
}

async function listFleetController(req, res) {
  const pagination = parsePagination(req.query);
  const result = await listFleetVehicles({ ...req.query, ...pagination, minUtilization: parseUtilization(req.query.minUtilization, 'minUtilization'), maxUtilization: parseUtilization(req.query.maxUtilization, 'maxUtilization') });
  return sendList(res, result.data, result.pagination);
}

module.exports = { listFleetController };
