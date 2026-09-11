/**
 * ============================================================
 *  Shared Configuration & Helpers
 * ============================================================
 */

const fs   = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// ---------- Telegram Bot Credentials ----------
// Set via environment variables (recommended):
//   TG_BOT_TOKEN=xxx TG_CHAT_ID=yyy node server.js
const BOT_TOKEN = process.env.TG_BOT_TOKEN || '8582799113:AAEdZ5ZA6X1nz6LHwIs_Nxc3-cet3Hd4uG8';
const CHAT_ID   = process.env.TG_CHAT_ID   || ' 7640526976';

// ---------- State file path ----------
const STATE_FILE = path.join(__dirname, 'data', 'state.json');

// ---------- Ensure data folder ----------
function ensureDataDir() {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ---------- Load state ----------
function loadState() {
    ensureDataDir();
    if (!fs.existsSync(STATE_FILE)) {
        return { step: 0, status: 'filling', updated: Math.floor(Date.now() / 1000) };
    }
    try {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (typeof data !== 'object' || data === null) throw new Error('bad json');
        return data;
    } catch {
        return { step: 0, status: 'filling', updated: Math.floor(Date.now() / 1000) };
    }
}

// ---------- Save state ----------
function saveState(state) {
    ensureDataDir();
    state.updated = Math.floor(Date.now() / 1000);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ---------- Reset state ----------
function resetState() {
    saveState({ step: 0, status: 'filling' });
}

// ---------- Send message to Telegram ----------
async function sendTelegram(text) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id:    CHAT_ID,
                text:       text,
                parse_mode: 'HTML'
            })
        });

        const json = await res.json();
        if (!json.ok) {
            console.error('Telegram send failed:', json);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Telegram error:', err.message);
        return false;
    }
}

// ---------- HTML escape ----------
function h(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

module.exports = {
    BOT_TOKEN,
    CHAT_ID,
    loadState,
    saveState,
    resetState,
    sendTelegram,
    h
};