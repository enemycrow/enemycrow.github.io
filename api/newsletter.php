<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

header('Content-Type: application/json');

// ====== CORS ======
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
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

// ====== CARGAR CONFIG (fuera de public_html si es posible) ======
$cfgCandidates = [
    dirname(__DIR__, 2) . '/config.php', // /home/usuario/config.php (recomendado)
    dirname(__DIR__) . '/config.php',    // si public_html está 1 nivel abajo
    __DIR__ . '/config.php',             // fallback (no recomendado)
];
$config = null; $cfgPathUsed = null;
foreach ($cfgCandidates as $cfgPath) {
    if (is_file($cfgPath)) {
        $cfgPathUsed = $cfgPath;
        try {
            $config = require $cfgPath;
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['ok'=>false,'error'=>'Error en config.php','path'=>$cfgPathUsed]);
            error_log($e->getMessage());
            exit;
        }
        break;
    }
}
if (!$config) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'Config no encontrada','buscado_en'=>$cfgCandidates]);
    exit;
}

// ====== LEER INPUT (JSON o form-data) ======
$nombre = '';
$email  = '';
$lauren = 0;
$elysia = 0;
$sahir  = 0;
$privacyAccepted = 0;

$ctype = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($ctype, 'application/json') !== false) {
    $input  = json_decode(file_get_contents('php://input'), true) ?: [];
    $nombre = trim((string)($input['nl-name']  ?? ''));
    $email  = trim((string)($input['nl-email'] ?? ''));
    $lauren = !empty($input['nl-lauren']) ? 1 : 0;
    $elysia = !empty($input['nl-elysia']) ? 1 : 0;
    $sahir  = !empty($input['nl-sahir'])  ? 1 : 0;
    $privacyAccepted = !empty($input['nl-privacy']) ? 1 : 0;
} else {
    $nombre = trim((string)($_POST['nl-name']  ?? ''));
    $email  = trim((string)($_POST['nl-email'] ?? ''));
    $lauren = !empty($_POST['nl-lauren']) ? 1 : 0;
    $elysia = !empty($_POST['nl-elysia']) ? 1 : 0;
    $sahir  = !empty($_POST['nl-sahir'])  ? 1 : 0;
    $privacyAccepted = isset($_POST['nl-privacy']) ? 1 : 0; // checkbox "on"
}

// ====== VALIDACIONES ======
$email = mb_strtolower($email);
if (mb_strlen($nombre) > 100 || mb_strlen($email) > 255) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Datos demasiado largos']);
    exit;
}
if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Datos inválidos']);
    exit;
}
if (!$privacyAccepted) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Debes aceptar la política de privacidad']);
    exit;
}

// ====== IP Y USER AGENT ======
$xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
$ip = $xff ? trim(explode(',', $xff)[0]) : ($_SERVER['REMOTE_ADDR'] ?? null);
$ua = $_SERVER['HTTP_USER_AGENT'] ?? null;

// ====== DB: INSERTAR ======
try {
    $db  = $config['db'];
    $pdo = new PDO(
        "mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4",
        (string)$db['user'],
        (string)$db['pass'],
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    $stmt = $pdo->prepare(
        'INSERT INTO newsletter_subscribers (nombre, email, lauren, elysia, sahir, ip, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$nombre, $email, $lauren, $elysia, $sahir, $ip, $ua]);

} catch (PDOException $e) {
    // Duplicado (email UNIQUE) => idempotente
    if ($e->getCode() !== '23000') {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Error al guardar en DB']);
        error_log('DB error: ' . $e->getMessage());
        exit;
    }
}

// ====== AVISO INTERNO (solo para ti) ======
// Cargamos PHPMailer si existe en alguna de estas rutas:
$phCandidates = [
    __DIR__ . '/../vendor/PHPMailer/src',           // tu caso actual (carpeta con mayúsculas)
    __DIR__ . '/../vendor/phpmailer/phpmailer/src', // convención composer
    __DIR__ . '/../vendor/PHPmailer/src',           // por si quedó con m minúscula
    __DIR__ . '/../PHPMailer/src',                  // por si lo subiste en la raíz pública
];

$phSrc = null;
foreach ($phCandidates as $p) {
    if (is_file($p . '/PHPMailer.php') && is_file($p . '/SMTP.php') && is_file($p . '/Exception.php')) {
        $phSrc = $p;
        break;
    }
}

$noticeSent = false;
if ($phSrc) {
    require_once $phSrc . '/PHPMailer.php';
    require_once $phSrc . '/SMTP.php';
    require_once $phSrc . '/Exception.php';

    $smtp = $config['smtp'];

    try {
        $mail = new PHPMailer(true);
        $mail->CharSet    = 'UTF-8';
        $mail->isSMTP();
        $mail->Host       = (string)$smtp['host'];
        $mail->Port       = (int)$smtp['port'];
        $mail->SMTPAuth   = true;
        $mail->Username   = (string)$smtp['username'];
        $mail->Password   = (string)$smtp['password'];
        $mail->SMTPSecure = $smtp['encryption'] ?? PHPMailer::ENCRYPTION_STARTTLS;
        $mail->SMTPAutoTLS = true;

        // El remitente DEBE ser tu propio buzón o alias verificado
        $mail->setFrom((string)$smtp['username'], 'Newsletter');
        $mail->addAddress((string)$smtp['username']); // te lo envía a ti
        $mail->addReplyTo($email, $nombre);           // si respondes, va al suscriptor

        $mail->Subject = 'Nuevo suscriptor: ' . $nombre;
        $mail->isHTML(false);
        $mail->Body =
            "Nuevo registro en la newsletter:\n\n" .
            "Nombre: $nombre\n" .
            "Email: $email\n" .
            "Preferencias: Lauren=$lauren, Elysia=$elysia, Sahir=$sahir\n" .
            "IP: " . ($ip ?? '-') . "\n" .
            "UA: " . ($ua ?? '-') . "\n";

        $mail->send();
        $noticeSent = true;
    } catch (PHPMailerException $e) {
        // No rompemos el flujo si no se puede enviar (por políticas SMTP, etc.)
        error_log('Aviso interno no enviado: ' . $e->getMessage() . ' / ' . ($mail->ErrorInfo ?? ''));
    }
} else {
    error_log('PHPMailer no encontrado: no se envió aviso interno.');
}

// ====== RESPUESTA ======
echo json_encode(['ok' => true, 'notice_sent' => $noticeSent]);
