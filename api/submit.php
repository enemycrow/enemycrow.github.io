<?php
header('Content-Type: application/json');

// Allow requests from production domain
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === 'https://plumafarollama.com' || $origin === 'https://www.plumafarollama.com') {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if ($origin === 'https://plumafarollama.com' || $origin === 'https://www.plumafarollama.com') {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Methods: POST');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

// Sanitize incoming data
$nombre  = trim($_POST['name'] ?? '');
$email   = trim($_POST['email'] ?? '');
$asunto  = trim($_POST['subject'] ?? 'Nuevo mensaje');
$mensaje = trim($_POST['message'] ?? '');
$voice   = trim($_POST['voice'] ?? '');
$wants   = !empty($_POST['wantsNewsletter']) ? 1 : 0;

// Basic validation
if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $mensaje === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Datos inválidos']);
    exit;
}

// Load configuration
$configPath = __DIR__ . '/config.php';
try {
    if (!file_exists($configPath)) {
        throw new Exception('Config file not found');
    }
    $config = require $configPath;
} catch (Throwable $e) {
    error_log('Config load failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error del servidor']);
    exit;
}

// Store in database
try {
    $db = $config['db'];
    $pdo = new PDO(
        "mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4",
        $db['user'],
        $db['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare('INSERT INTO contactos (nombre, email, asunto, mensaje, voice, wants_newsletter, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $nombre,
        $email,
        $asunto,
        $mensaje,
        $voice ?: null,
        $wants,
        $_SERVER['REMOTE_ADDR'] ?? null,
        $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error al guardar en DB']);
    exit;
}

// Send email via PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require __DIR__ . '/../vendor/PHPmailer/src/PHPMailer.php';
require __DIR__ . '/../vendor/PHPmailer/src/SMTP.php';
require __DIR__ . '/../vendor/PHPmailer/src/Exception.php';

$mail = new PHPMailer(true);

try {
    $smtp = $config['smtp'];
    $mail->isSMTP();
    $mail->Host       = $smtp['host'];
    $mail->Port       = $smtp['port'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtp['username'];
    $mail->Password   = $smtp['password'];
    $mail->SMTPSecure = $smtp['encryption'];

    $mail->setFrom($smtp['username'], 'Formulario Web');
    $mail->addAddress($smtp['username']);
    $mail->addReplyTo($email, $nombre);

    $mail->isHTML(true);
    $mail->Subject = '📬 Nuevo mensaje de ' . $nombre;
    $mail->Body    = "<h2>Nuevo mensaje recibido</h2>" .
        "<p><b>Nombre:</b> " . htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8') . "</p>" .
        "<p><b>Email:</b> " . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . "</p>" .
        "<p><b>Asunto:</b> " . htmlspecialchars($asunto, ENT_QUOTES, 'UTF-8') . "</p>" .
        "<p><b>Mensaje:</b><br>" . nl2br(htmlspecialchars($mensaje)) . "</p>" .
        "<p><b>Voice:</b> " . htmlspecialchars($voice, ENT_QUOTES, 'UTF-8') . "</p>" .
        "<p><b>Newsletter:</b> " . ($wants ? 'Sí' : 'No') . "</p>";
    $mail->AltBody = "$nombre <$email>\nAsunto: $asunto\nMensaje:\n$mensaje";

    $mail->send();
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'No se pudo enviar el correo']);
}
