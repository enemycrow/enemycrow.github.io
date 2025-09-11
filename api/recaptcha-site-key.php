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
        break;
    }
}

$siteKey = '';
if (is_array($config)) {
    $siteKey = $config['recaptcha_site_key'] ?? '';
}

if ($siteKey === '') {
    http_response_code(500);
    echo json_encode(['error' => 'Could not load reCAPTCHA site key']);
    return;
}

echo json_encode(['siteKey' => $siteKey]);
