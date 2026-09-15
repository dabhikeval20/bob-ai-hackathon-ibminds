const express = require('express');
const { listFleetController } = require('../controllers/fleetController');
const { getFleetIntelligenceController, getFleetVehicleController, getVehicleSuggestionsController } = require('../controllers/fleetIntelligenceController');

const router = express.Router();
router.get('/intelligence', getFleetIntelligenceController);
router.get('/suggestions', getVehicleSuggestionsController);
router.get('/:vehicleId', getFleetVehicleController);
router.get('/', listFleetController);

module.exports = router;
