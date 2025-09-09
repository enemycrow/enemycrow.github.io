<?php
declare(strict_types=1);

// Helper para leer variables de entorno y lanzar error si faltan
function env(string $key, $default = null, bool $required = false) {
    $value = getenv($key);
    if (($value === false || $value === '') && $required) {
        throw new RuntimeException("Falta la variable de entorno requerida: {$key}");
    }
    return ($value === false || $value === '') ? $default : $value;
}

return [
    'db' => [
        'host' => env('DB_HOST', 'localhost', true),
        'name' => env('DB_NAME', '', true),
        'user' => env('DB_USER', '', true),
        'pass' => env('DB_PASS', '', true),
    ],
    'smtp' => [
        'host'       => env('SMTP_HOST', 'smtppro.zoho.com', true),
        'port'       => (int) env('SMTP_PORT', '587'),
        'username'   => env('SMTP_USER', '', true),
        'password'   => env('SMTP_PASS', '', true),
        'encryption' => env('SMTP_ENCRYPT', 'tls'),
    ],
    'recaptcha_secret' => env('RECAPTCHA_SECRET', '', true),
];