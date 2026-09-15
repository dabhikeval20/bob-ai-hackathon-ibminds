const { getHealth } = require('../services/healthService');

function healthController(req, res) {
  res.status(200).json(getHealth());
}

module.exports = { healthController };
