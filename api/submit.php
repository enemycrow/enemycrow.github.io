<?php
require __DIR__ . '/bootstrap.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Permissions-Policy: interest-cohort=()');
header('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
header('Vary: Origin');

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
    header('Vary: Origin');
    http_response_code(204);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

// Connect to database and apply rate limiting
try {
    $pdo = new PDO(
        "mysql:host=" . ($_ENV['DB_HOST'] ?? 'localhost') . ";dbname=" . ($_ENV['DB_NAME'] ?? '') . ";charset=utf8mb4",
        $_ENV['DB_USER'] ?? '',
        $_ENV['DB_PASS'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error del servidor']);
    error_log('DB connection failed: ' . $e->getMessage());
    exit;
}

$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$limit = 5;
$windowMinutes = 10;

try {
    $now = new DateTimeImmutable();
    $stmt = $pdo->prepare('SELECT last_request, attempts FROM rate_limits WHERE ip = ?');
    $stmt->execute([$ip]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($record) {
        $lastRequest = new DateTimeImmutable($record['last_request']);
        if ($now->getTimestamp() - $lastRequest->getTimestamp() > $windowMinutes * 60) {
            $stmt = $pdo->prepare('UPDATE rate_limits SET last_request = ?, attempts = 1 WHERE ip = ?');
            $stmt->execute([$now->format('Y-m-d H:i:s'), $ip]);
        } else {
            if ($record['attempts'] >= $limit) {
                http_response_code(429);
                echo json_encode(['ok' => false, 'error' => 'Demasiadas solicitudes']);
                exit;
            }
            $stmt = $pdo->prepare('UPDATE rate_limits SET last_request = ?, attempts = attempts + 1 WHERE ip = ?');
            $stmt->execute([$now->format('Y-m-d H:i:s'), $ip]);
        }
    } else {
        $stmt = $pdo->prepare('INSERT INTO rate_limits (ip, last_request, attempts) VALUES (?, ?, 1)');
        $stmt->execute([$ip, $now->format('Y-m-d H:i:s')]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error del servidor']);
    error_log('Rate limit failed: ' . $e->getMessage());
    exit;
}

// Verify reCAPTCHA token
$token = trim($_POST['token'] ?? '');
$secret = $_ENV['RECAPTCHA_SECRET'] ?? '';

try {
    $response = file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-type: application/x-www-form-urlencoded',
            'content' => http_build_query([
                'secret' => $secret,
                'response' => $token,
            ]),
            'timeout' => 10,
        ]
    ]));

    $captcha = json_decode($response, true);
    if (empty($captcha['success']) || ($captcha['score'] ?? 0) < 0.5) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'reCAPTCHA inválido']);
        exit;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error al verificar reCAPTCHA']);
    error_log('reCAPTCHA verification failed: ' . $e->getMessage());
    exit;
}

// Sanitize incoming data
$nombre  = trim($_POST['name'] ?? '');
$email   = trim($_POST['email'] ?? '');
$asunto  = trim($_POST['subject'] ?? 'Nuevo mensaje');
$mensaje = trim($_POST['message'] ?? '');
$voice   = trim($_POST['voice'] ?? '');
$wants   = !empty($_POST['wantsNewsletter']) ? 1 : 0;

// Length validation
if (
    mb_strlen($nombre) > 100 ||
    mb_strlen($asunto) > 100 ||
    mb_strlen($email) > 255 ||
    mb_strlen($mensaje) > 2000 ||
    mb_strlen($voice) > 255
) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Datos demasiado largos']);
    exit;
}

// Basic validation
if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $mensaje === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Datos inválidos']);
    exit;
}

// Store in database
try {
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
    error_log($e->getMessage());
    exit;
}

// Send email via PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = $_ENV['SMTP_HOST'] ?? 'smtppro.zoho.com';
    $mail->Port       = (int)($_ENV['SMTP_PORT'] ?? 587);
    $mail->SMTPAuth   = true;
    $mail->Username   = $_ENV['SMTP_USER'] ?? '';
    $mail->Password   = $_ENV['SMTP_PASS'] ?? '';
    $mail->SMTPSecure = $_ENV['SMTP_ENCRYPT'] ?? 'tls';

    $mail->setFrom($_ENV['SMTP_USER'] ?? '', 'Formulario Web');
    $mail->addAddress($_ENV['SMTP_USER'] ?? '');
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
    error_log($e->getMessage());
}
