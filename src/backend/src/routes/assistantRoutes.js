const express = require('express');
const { askAssistantController } = require('../controllers/assistantController');

const router = express.Router();
router.post('/ask', askAssistantController);

module.exports = router;
