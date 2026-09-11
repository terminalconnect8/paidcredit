<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

$state = loadState();

// Only clear "declined" — keep current step so frontend knows which form to show
if (($state['status'] ?? '') === 'declined') {
    $state['status'] = 'filling';
    saveState($state);
}

echo json_encode(['success' => true, 'step' => (int)($state['step'] ?? 0)]);