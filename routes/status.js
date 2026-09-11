/**
 * GET /api/status
 * Returns: { status: 'filling'|'pending'|'declined'|'done', step: number }
 */
const express = require('express');
const router  = express.Router();
const { loadState, saveState } = require('../config');

router.get('/', (req, res) => {
    // No cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

    const state = loadState();

    // Auto-expire pending after 5 minutes → treat as declined
    if (
        state.status === 'pending' &&
        state.updated &&
        (Math.floor(Date.now() / 1000) - state.updated) > 300
    ) {
        state.status = 'declined';
        saveState(state);
    }

    res.json({
        status: state.status || 'filling',
        step:   Number(state.step) || 0
    });
});

module.exports = router;