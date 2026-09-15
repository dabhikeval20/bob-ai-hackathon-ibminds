const mongoose = require('mongoose');

function getHealth() {
  return {
    status: 'ok',
    service: 'supplyguard-backend',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'not_connected',
    timestamp: new Date().toISOString()
  };
}

module.exports = { getHealth };
