<?php
require __DIR__ . '/http.php';
http(['POST']);

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
            echo json_encode([
                'ok'    => false,
                'error' => 'Error en config.php',
                'path'  => $cfgPathUsed,
                'code'  => 'CONFIG_ERROR'
            ]);
            error_log((string)$e);
            exit;
        }
        break;
    }
}
if (!$config) {
    http_response_code(500);
    echo json_encode([
        'ok'         => false,
        'error'      => 'Config no encontrada',
        'buscado_en' => $cfgCandidates,
        'code'       => 'CONFIG_NOT_FOUND'
    ]);
    exit;
}

// Connect to database and apply rate limiting
try {
    $db = $config['db'];
    $pdo = new PDO(
        "mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4",
        $db['user'],
        $db['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error del servidor', 'code' => 'DB_CONNECT']);
    error_log('DB connection failed: ' . (string)$e);
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
                echo json_encode(['ok' => false, 'error' => 'Demasiadas solicitudes', 'code' => 'RATE_LIMIT']);
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
    echo json_encode(['ok' => false, 'error' => 'Error del servidor', 'code' => 'DB_RATE_LIMIT']);
    error_log('DB error: ' . (string)$e . ' / ' . implode(' | ', $stmt->errorInfo()));
    exit;
}

// Verify reCAPTCHA token
$token = trim($_POST['token'] ?? '');
$secret = $config['recaptcha_secret'] ?? '';

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
        echo json_encode(['ok' => false, 'error' => 'reCAPTCHA inválido', 'code' => 'RECAPTCHA_INVALID']);
        exit;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error al verificar reCAPTCHA', 'code' => 'RECAPTCHA_ERROR']);
    error_log('reCAPTCHA verification failed: ' . (string)$e);
    exit;
}

// Sanitize incoming data
$nombre  = trim($_POST['name'] ?? '');
$email   = trim($_POST['email'] ?? '');
$asunto  = trim($_POST['subject'] ?? 'Nuevo mensaje');
$mensaje = trim($_POST['message'] ?? '');
$voice   = trim($_POST['voice'] ?? '');
$newsletter = !empty($_POST['newsletter']) ? 1 : 0;

// Length validation
if (
    mb_strlen($nombre) > 100 ||
    mb_strlen($asunto) > 100 ||
    mb_strlen($email) > 255 ||
    mb_strlen($mensaje) > 2000 ||
    mb_strlen($voice) > 255
) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Datos demasiado largos', 'code' => 'DATA_TOO_LONG']);
    exit;
}

// Basic validation
if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $mensaje === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Datos inválidos', 'code' => 'DATA_INVALID']);
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
        $newsletter,
        $_SERVER['REMOTE_ADDR'] ?? null,
        $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error al guardar en DB', 'code' => 'DB_SUBMIT']);
    error_log('DB error: ' . (string)$e . ' / ' . implode(' | ', $stmt->errorInfo()));
    exit;
}

// Send email via PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
// Si no está instalado Composer/vendor, no fallar el flujo del usuario
if (!file_exists(__DIR__ . '/../vendor/autoload.php')) {
    error_log('PHPMailer autoload no encontrado; se omite el envío de correo.');
    echo json_encode(['ok' => true, 'mail' => false]);
    exit;
}
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/email_template.php'; // Incluir la nueva plantilla

$mail = new PHPMailer(true);

try {
    $smtp = $config['smtp'];
    $mail->CharSet = 'UTF-8';
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

    // Datos para la plantilla
    $emailData = [
        'Nombre' => $nombre,
        'Email' => $email,
        'Asunto' => $asunto,
        'Voz de Preferencia' => $voice,
        'Mensaje' => nl2br(htmlspecialchars($mensaje)),
        'Suscribirse al Newsletter' => $newsletter ? 'Sí' : 'No'
    ];
    
    // TODO: Reemplazar con la URL de tu logo
    $logoUrl = ''; // Por ejemplo: 'https://plumafarollama.com/img/logo.png'

    $mail->Body = getEmailHtml('Nuevo Mensaje del Formulario', $emailData, $logoUrl);
    
    // Cuerpo alternativo de texto plano
    $altBody = "Nuevo mensaje de $nombre <$email>\n";
    foreach($emailData as $key => $value) {
        $altBody .= "$key: " . (is_bool($value) ? ($value ? 'Sí' : 'No') : $value) . "\n";
    }
    $mail->AltBody = $altBody;

    $mail->send();
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'No se pudo enviar el correo', 'code' => 'EMAIL_SEND']);
    error_log((string)$e);
}
