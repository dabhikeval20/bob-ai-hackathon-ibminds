const express = require('express');
const { listSensorController } = require('../controllers/sensorController');

const router = express.Router();
router.get('/', listSensorController);

module.exports = router;
