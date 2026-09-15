const { listSensorLogs } = require('../services/sensorService');
const { parsePagination, sendList } = require('../utils/api');

async function listSensorController(req, res) {
  const pagination = parsePagination(req.query);
  const result = await listSensorLogs({ ...req.query, ...pagination });
  return sendList(res, result.data, result.pagination);
}

module.exports = { listSensorController };
