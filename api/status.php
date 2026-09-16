<?php
http_response_code(410);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'message' => 'PHP API disabled.']);
exit;

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$state = loadState();

if (
    ($state['status'] ?? '') === 'pending' &&
    !empty($state['updated']) &&
    (time() - (int)$state['updated']) > 300
) {
    $state['status'] = 'declined';
    saveState($state);
}

jsonOut([
    'status' => $state['status'] ?? 'filling',
    'step'   => (int)($state['step'] ?? 0)
]);
