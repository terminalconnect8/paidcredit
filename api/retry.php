<?php
/**
 * /api/retry.php
 */
require_once __DIR__ . '/config.php';

$state = loadState();

if (($state['status'] ?? '') === 'declined') {
    $state['status'] = 'filling';
    saveState($state);
}

jsonOut(['success' => true, 'step' => (int)($state['step'] ?? 0)]);
