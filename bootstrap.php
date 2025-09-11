<?php
$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    die('Error: no se encontró el autoloader. Ejecuta "composer install".');
}
require $autoloadPath;

use Dotenv\Dotenv;
use Monolog\Logger;
use Monolog\Handler\RotatingFileHandler;
use Monolog\ErrorHandler;

Dotenv::createImmutable(__DIR__)->safeLoad();

$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}

$logger = new Logger('app');
$handler = new RotatingFileHandler($logDir . '/app.log', 7, Logger::DEBUG);
$logger->pushHandler($handler);

// Registra Monolog como manejador de errores de PHP
ErrorHandler::register($logger);

// Usa el archivo manejado por Monolog para error_log
ini_set('error_log', $logDir . '/app.log');

return $logger;
