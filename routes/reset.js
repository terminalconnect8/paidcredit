/**
 * GET /api/reset
 * Resets state to { step: 0, status: 'filling' }
 */
const express = require('express');
const router  = express.Router();
const { resetState } = require('../config');

router.all('/', (req, res) => {
    resetState();
    res.json({ success: true });
});

module.exports = router;