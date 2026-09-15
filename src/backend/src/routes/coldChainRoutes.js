const express = require('express');
const { getColdChainSummaryController, listColdChainAlertsController, getShipmentTemperatureController } = require('../controllers/coldChainController');

const router = express.Router();
router.get('/summary', getColdChainSummaryController);
router.get('/alerts', listColdChainAlertsController);
router.get('/shipments/:shipmentId', getShipmentTemperatureController);

module.exports = router;
