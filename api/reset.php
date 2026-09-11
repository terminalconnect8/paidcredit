<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

resetState();

echo json_encode(['success' => true]);