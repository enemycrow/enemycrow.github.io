<?php
declare(strict_types=1);

require __DIR__ . '/http.php';
http(['GET']);

$idParam = trim((string)($_GET['id'] ?? ''));
if ($idParam === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'id requerido']);
    exit;
}

$slugParam = trim((string)($_GET['slug'] ?? ''));

$cookiesPath = dirname(__DIR__) . '/fortune_cookies.json';
$json = @file_get_contents($cookiesPath);
if ($json === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'fortune_cookies.json inválido']);
    exit;
}

$data = json_decode($json, true);
if (!is_array($data)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'fortune_cookies.json inválido']);
    exit;
}

foreach ($data as $cookie) {
    if (!is_array($cookie)) {
        continue;
    }

    $cookieId = isset($cookie['id']) ? (string) $cookie['id'] : '';
    $cookieSlug = isset($cookie['slug']) ? (string) $cookie['slug'] : '';

    if ($cookieId !== $idParam) {
        continue;
    }

    if ($slugParam !== '' && $cookieSlug !== $slugParam) {
        continue;
    }

    echo json_encode(['ok' => true, 'fortune_cookie' => $cookie]);
    return;
}

http_response_code(404);
echo json_encode(['ok' => false, 'error' => 'Fortune cookie no encontrado']);
