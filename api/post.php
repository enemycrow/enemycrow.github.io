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

$postsPath = dirname(__DIR__) . '/posts.json';
$json = @file_get_contents($postsPath);
if ($json === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'posts.json inválido']);
    exit;
}

$data = json_decode($json, true);
if (!is_array($data)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'posts.json inválido']);
    exit;
}

foreach ($data as $post) {
    if (!is_array($post)) {
        continue;
    }

    $postId = isset($post['id']) ? (string) $post['id'] : '';
    $postSlug = isset($post['slug']) ? (string) $post['slug'] : '';

    if ($postId !== $idParam) {
        continue;
    }

    if ($slugParam !== '' && $postSlug !== $slugParam) {
        continue;
    }

    echo json_encode(['ok' => true, 'post' => $post]);
    return;
}

http_response_code(404);
echo json_encode(['ok' => false, 'error' => 'Post no encontrado']);
