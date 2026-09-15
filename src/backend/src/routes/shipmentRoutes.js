const express = require('express');
const { listShipmentsController, getShipmentController } = require('../controllers/shipmentController');

const router = express.Router();
router.get('/', listShipmentsController);
router.get('/:shipmentId', getShipmentController);

module.exports = router;
