const express = require('express');
const { getDashboardSummaryController } = require('../controllers/dashboardController');

const router = express.Router();
router.get('/summary', getDashboardSummaryController);

module.exports = router;
