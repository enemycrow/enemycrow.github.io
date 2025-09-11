<?php
declare(strict_types=1);

require dirname(__DIR__) . '/bootstrap.php';
require __DIR__ . '/http.php';
http(['GET']);

$slug = trim((string)($_GET['slug'] ?? ''));
if ($slug === '') { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'slug requerido']); exit; }

// Cargar config (fuera de public_html si existe)
$cfgCandidates = [
    dirname(__DIR__, 2) . '/config.php',
    dirname(__DIR__) . '/config.php',
    __DIR__ . '/config.php',
];
$config = null;
foreach ($cfgCandidates as $p) { if (is_file($p)) { $config = require $p; break; } }
if (!$config) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'config no encontrada']); exit; }

try {
    $pdo = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['name']};charset=utf8mb4",
        $config['db']['user'],
        $config['db']['pass'],
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
