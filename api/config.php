<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

// Apuntar a la raíz del dominio (fuera de public_html) donde está el .env
$dotenvPath = dirname(__DIR__, 2);
Dotenv\Dotenv::createImmutable($dotenvPath)->safeLoad();

if (!function_exists('env')) {
    function env(string $key, $default = null, bool $required = false) {
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
            return $_ENV[$key];
        }
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
            return $_SERVER[$key];
        }
        $value = getenv($key);
        if ($value !== false && $value !== '') {
            return $value;
        }
        if ($required) {
            throw new RuntimeException("Falta la variable de entorno requerida: {$key}");
        }
        return $default;
    }
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
    'recaptcha_site_key' => env('RECAPTCHA_SITE_KEY', '', true),
    'recaptcha_secret'   => env('RECAPTCHA_SECRET', '', true),
];
