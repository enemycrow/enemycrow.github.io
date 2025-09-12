<?php
declare(strict_types=1);

require __DIR__ . '/http.php';
http(['GET']);

$configPaths = [
    dirname(__DIR__, 2) . '/config.php',
    dirname(__DIR__) . '/config.php',
    __DIR__ . '/config.php',
];

$config = null;
foreach ($configPaths as $path) {
    if (is_readable($path)) {
        $config = require $path;
        var_dump($path, $config);
        exit;
        break;
    }
}

// Extraer solo la clave que necesitas
$siteKey = '';
if (is_array($config)) {
    $siteKey = $config['recaptcha_site_key'] ?? '';
}

header('Content-Type: application/json; charset=utf-8');

if ($siteKey === '') {
    http_response_code(500);
    echo json_encode(['error' => 'Could not load reCAPTCHA site key']);
    exit;
}

// Ahora solo devuelve la clave, no el array completo
echo json_encode(['siteKey' => $siteKey]);
