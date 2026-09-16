<?php
http_response_code(410);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'message' => 'PHP API disabled.']);
exit;

$state = loadState();

if (($state['status'] ?? '') === 'declined') {
    $state['status'] = 'filling';
    saveState($state);
}

jsonOut(['success' => true, 'step' => (int)($state['step'] ?? 0)]);
