<?php
require_once __DIR__ . '/config.php';

// No caching
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Content-Type: application/json');

$state = loadState();

// Safety: auto-expire pending states after 5 minutes → treat as declined
if (
    isset($state['status'], $state['updated']) &&
    $state['status'] === 'pending' &&
    (time() - (int)$state['updated']) > 300
) {
    $state['status'] = 'declined';
    saveState($state);
}

echo json_encode([
    'status' => $state['status'] ?? 'filling',
    'step'   => isset($state['step']) ? (int)$state['step'] : 0,
]);