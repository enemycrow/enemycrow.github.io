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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Max-Age: 86400');

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Método no permitido']); exit; }

$allowed = ['toco','sumergirme','personajes','mundo','lugares'];

// Admite x-www-form-urlencoded/form-data o JSON
$ctype = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($ctype, 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $slug = trim((string)($input['slug'] ?? ''));
    $reaction = trim((string)($input['reaction'] ?? ''));
    $action = (string)($input['action'] ?? 'add');
} else {
    $slug = trim((string)($_POST['slug'] ?? ''));
    $reaction = trim((string)($_POST['reaction'] ?? ''));
    $action = (string)($_POST['action'] ?? 'add');
}

if ($slug==='' || !in_array($reaction, $allowed, true) || !in_array($action, ['add','remove'], true)) {
    http_response_code(422);
    echo json_encode(['ok'=>false,'error'=>'parámetros inválidos']);
    exit;
}

// IP -> hash (privacidad)
$xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
$ip  = $xff ? trim(explode(',', $xff)[0]) : ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
$ip_hash = hash('sha256', $ip);

try {
    $pdo = new PDO(
        'mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . ';dbname=' . ($_ENV['DB_NAME'] ?? '') . ';charset=utf8mb4',
        $_ENV['DB_USER'] ?? '',
        $_ENV['DB_PASS'] ?? '',
        [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]
    );

    $pdo->beginTransaction();

    // Asegura fila de totales
    $pdo->prepare("INSERT IGNORE INTO reactions_totals (slug) VALUES (?)")->execute([$slug]);

    if ($action === 'add') {
        // inserta voto si no existía
        $ins = $pdo->prepare("INSERT IGNORE INTO reactions_votes (slug,ip_hash,reaction) VALUES (?,?,?)");
        $ins->execute([$slug,$ip_hash,$reaction]);
        if ($pdo->lastInsertId()) {
            $upd = $pdo->prepare("UPDATE reactions_totals SET `$reaction` = `$reaction` + 1 WHERE slug=?");
            $upd->execute([$slug]);
        }
    } else { // remove
        $del = $pdo->prepare("DELETE FROM reactions_votes WHERE slug=? AND ip_hash=? AND reaction=?");
        $del->execute([$slug,$ip_hash,$reaction]);
        if ($del->rowCount() > 0) {
            $upd = $pdo->prepare("UPDATE reactions_totals SET `$reaction` = GREATEST(0, `$reaction` - 1) WHERE slug=?");
            $upd->execute([$slug]);
        }
    }

    // Totales actualizados
    $stmt = $pdo->prepare("SELECT toco,sumergirme,personajes,mundo,lugares FROM reactions_totals WHERE slug=?");
    $stmt->execute([$slug]);
    $totals = $stmt->fetch(PDO::FETCH_ASSOC);

    $pdo->commit();
    echo json_encode(['ok'=>true,'slug'=>$slug,'totals'=>$totals]);
} catch (Throwable $e) {
    if ($pdo?->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'DB']);
    error_log($e->getMessage());
}
