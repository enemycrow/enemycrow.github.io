<?php
header('Content-Type: application/json');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === 'https://plumafarollama.com' || $origin === 'https://www.plumafarollama.com') {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

$nombre = trim($_POST['nl-name'] ?? '');
$email  = trim($_POST['nl-email'] ?? '');
$lauren = !empty($_POST['nl-lauren']) ? 1 : 0;
$elysia = !empty($_POST['nl-elysia']) ? 1 : 0;
$sahir  = !empty($_POST['nl-sahir']) ? 1 : 0;

if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Datos inválidos']);
    exit;
}

$config = require __DIR__ . '/config.php';

try {
    $db = $config['db'];
    $pdo = new PDO(
        "mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4",
        $db['user'],
        $db['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare('INSERT INTO newsletter_subscribers (nombre, email, lauren, elysia, sahir, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $nombre,
        $email,
        $lauren,
        $elysia,
        $sahir,
        $_SERVER['REMOTE_ADDR'] ?? null,
        $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);

    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error al guardar en DB']);
}
?>
