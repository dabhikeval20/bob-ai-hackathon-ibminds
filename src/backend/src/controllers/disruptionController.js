const { listDisruptions } = require('../services/disruptionService');
const { parsePagination, sendList } = require('../utils/api');

async function listDisruptionsController(req, res) {
  const pagination = parsePagination(req.query);
  const result = await listDisruptions({ ...req.query, ...pagination });
  return sendList(res, result.data, result.pagination);
}

module.exports = { listDisruptionsController };
