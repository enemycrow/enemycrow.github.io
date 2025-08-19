<?php
declare(strict_types=1);

// Función auxiliar para leer variables de entorno con valor por defecto
function env(string $key, $default = null) {
    $v = getenv($key);
    return ($v === false || $v === '') ? $default : $v;
}

return [
    'db' => [
        'host' => env('DB_HOST', 'localhost'),
        'name' => env('DB_NAME', ''),
        'user' => env('DB_USER', ''),
        'pass' => env('DB_PASS', '')
    ],
    'smtp' => [
        'host'       => env('SMTP_HOST', 'smtppro.zoho.com'),
        'port'       => (int) env('SMTP_PORT', '587'),
        'username'   => env('SMTP_USER', ''),
        'password'   => env('SMTP_PASS', ''),
        'encryption' => env('SMTP_ENCRYPT', 'tls')
    ]
];