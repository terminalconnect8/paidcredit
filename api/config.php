<?php
http_response_code(410);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'message' => 'PHP API disabled.']);
exit;

define('BOT_TOKEN', getenv('TG_BOT_TOKEN') ?: '8913140230:AAE7nN53HZWSQIJst6W_e1C1DurCt97JaMk');
define('CHAT_ID',   getenv('TG_CHAT_ID')   ?: '8858000746');
define('STATE_FILE', __DIR__ . '/../data/state.json');

function ensureDataDir() {
    $dir = dirname(STATE_FILE);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

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

function saveState(array $state) {
    ensureDataDir();
    $state['updated'] = time();
    @file_put_contents(STATE_FILE, json_encode($state, JSON_PRETTY_PRINT), LOCK_EX);
}

function resetState() {
    saveState(['step' => 0, 'status' => 'filling', 'updated' => time()]);
}

function sendTelegram($text, $replyMarkup = null) {
    $url = "https://api.telegram.org/bot" . BOT_TOKEN . "/sendMessage";

    $postData = [
        'chat_id'    => CHAT_ID,
        'text'       => $text,
        'parse_mode' => 'HTML',
    ];
    if ($replyMarkup) {
        $postData['reply_markup'] = json_encode($replyMarkup);
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postData,
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
        return ['ok' => false, 'error' => $response ?: $curlErr];
    }

    $result = json_decode($response, true);
    return ['ok' => !empty($result['ok']), 'result' => $result];
}

function h($v) {
    return htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8');
}

function jsonOut($arr, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($arr);
    exit;
}
