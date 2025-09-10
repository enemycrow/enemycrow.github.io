<?php
declare(strict_types=1);

/**
 * Configure JSON response headers and CORS.
 *
 * @param array $methods Allowed HTTP methods (e.g. ['POST']).
 */
function http(array $methods): void {
    header('Content-Type: application/json; charset=UTF-8');

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = ['https://plumafarollama.com', 'https://www.plumafarollama.com'];
    if (in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Vary: Origin');
    }

    $allowMethods = array_unique(array_merge($methods, ['OPTIONS']));
    header('Access-Control-Allow-Methods: ' . implode(', ', $allowMethods));

    $reqHeaders = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']
        ?? 'Content-Type, X-Requested-With, Authorization';
    header('Vary: Access-Control-Request-Headers', false);
    header("Access-Control-Allow-Headers: $reqHeaders");
    header('Access-Control-Max-Age: 86400');

    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    if (!in_array($method, $methods, true)) {
        http_response_code(405);
        echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
        exit;
    }
}
