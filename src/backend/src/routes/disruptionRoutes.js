const express = require('express');
const { listDisruptionsController } = require('../controllers/disruptionController');

const router = express.Router();
router.get('/', listDisruptionsController);

module.exports = router;
