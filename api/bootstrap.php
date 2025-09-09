<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

// Load environment variables
Dotenv\Dotenv::createImmutable(dirname(__DIR__))->safeLoad();

// Configure dedicated log file with rotation
$logDir = dirname(__DIR__) . '/logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/app.log';
if (file_exists($logFile) && filesize($logFile) > 5 * 1024 * 1024) {
    $rotated = $logDir . '/app-' . date('YmdHis') . '.log';
    rename($logFile, $rotated);
}
if (!file_exists($logFile)) {
    touch($logFile);
    chmod($logFile, 0640);
}
ini_set('log_errors', '1');
ini_set('error_log', $logFile);
