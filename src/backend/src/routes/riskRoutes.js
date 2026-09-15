const express = require('express');
const {
  listRiskShipmentsController,
  getRiskShipmentController,
  getRiskSummaryController,
  listRiskRecommendationsController
} = require('../controllers/riskController');

const router = express.Router();
router.get('/summary', getRiskSummaryController);
router.get('/recommendations', listRiskRecommendationsController);
router.get('/shipments', listRiskShipmentsController);
router.get('/shipments/:shipmentId', getRiskShipmentController);

module.exports = router;
