<?php
/**
 * /api/reset.php
 */
require_once __DIR__ . '/config.php';

resetState();
jsonOut(['success' => true]);
