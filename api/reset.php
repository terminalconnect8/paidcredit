<?php
http_response_code(410);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'message' => 'PHP API disabled.']);
exit;

resetState();
jsonOut(['success' => true]);
