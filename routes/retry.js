/**
 * GET /api/retry
 * Clears 'declined' status, keeps current step so the user can retry.
 */
const express = require('express');
const router  = express.Router();
const { loadState, saveState } = require('../config');

router.all('/', (req, res) => {
    const state = loadState();

    if (state.status === 'declined') {
        state.status = 'filling';
        saveState(state);
    }

    res.json({ success: true, step: Number(state.step) || 0 });
});

module.exports = router;