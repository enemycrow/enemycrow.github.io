<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
header('Content-Type: application/json; charset=UTF-8');

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = ['https://plumafarollama.com', 'https://www.plumafarollama.com'];
if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Max-Age: 86400');

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method !== 'GET') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Método no permitido']); exit; }

$slug = trim((string)($_GET['slug'] ?? ''));
if ($slug === '') { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'slug requerido']); exit; }

try {
    $pdo = new PDO(
        'mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . ';dbname=' . ($_ENV['DB_NAME'] ?? '') . ';charset=utf8mb4',
        $_ENV['DB_USER'] ?? '',
        $_ENV['DB_PASS'] ?? '',
        [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]
    );

    $stmt = $pdo->prepare("SELECT toco,sumergirme,personajes,mundo,lugares FROM reactions_totals WHERE slug=?");
    $stmt->execute([$slug]);
    $data = $stmt->fetch() ?: ['toco'=>0,'sumergirme'=>0,'personajes'=>0,'mundo'=>0,'lugares'=>0];

    echo json_encode(['ok'=>true,'slug'=>$slug,'totals'=>$data]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'DB']);
    error_log($e->getMessage());
}
