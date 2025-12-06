const express = require('express');
const router = express.Router();
const syncController = require('./sync.controller');

// Public endpoints for RPD pull
router.get('/:name', syncController.getCatalogByVersion);

module.exports = router;

