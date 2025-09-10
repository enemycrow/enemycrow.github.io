<?php
declare(strict_types=1);

require __DIR__ . '/http.php';
http(['GET']);

try {
    $config = require __DIR__ . '/config.php';
    $siteKey = $config['recaptcha_site_key'] ?? '';
    if ($siteKey === '') {
        throw new RuntimeException('Missing reCAPTCHA site key');
    }

    echo json_encode(['siteKey' => $siteKey]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not load reCAPTCHA site key']);
}
