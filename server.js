/**
 * ============================================================
 *  Telegram Form Submission Backend (Node.js + Express)
 * ============================================================
 */

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const submitRoute = require('./routes/submit');
const statusRoute = require('./routes/status');
const resetRoute  = require('./routes/reset');
const retryRoute  = require('./routes/retry');

const app  = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ---------- Routes ----------
app.use('/api/submit', submitRoute);
app.use('/api/status', statusRoute);
app.use('/api/reset',  resetRoute);
app.use('/api/retry',  retryRoute);

// ---------- Health check ----------
app.get('/health', (req, res) => res.json({ ok: true, time: Date.now() }));

// ---------- Start ----------
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});