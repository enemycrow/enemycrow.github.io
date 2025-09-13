<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

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

// ====== LEER INPUT (JSON o form-data) ======
$ctype = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($ctype, 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
} else {
    $input = $_POST;
}

$nombre = trim((string)($input['nl-name'] ?? ''));
$email  = trim((string)($input['nl-email'] ?? ''));
$lauren = !empty($input['nl-lauren']) ? 1 : 0;
$elysia = !empty($input['nl-elysia']) ? 1 : 0;
$sahir  = !empty($input['nl-sahir']) ? 1 : 0;
$privacyAccepted = !empty($input['nl-privacy']) ? 1 : 0;
$token  = trim((string)($input['token'] ?? ''));

// ====== VERIFICAR reCAPTCHA ======
$secret = $config['recaptcha_secret'] ?? '';
try {
    $response = file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-type: application/x-www-form-urlencoded',
            'content' => http_build_query([
                'secret'   => $secret,
                'response' => $token,
            ]),
            'timeout' => 10,
        ],
    ]));

    $captcha = json_decode($response, true);
    if (empty($captcha['success']) || ($captcha['score'] ?? 0) < 0.5) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'reCAPTCHA inválido', 'code' => 'RECAPTCHA_INVALID']);
        exit;
    }
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Error al verificar reCAPTCHA', 'code' => 'RECAPTCHA_ERROR']);
    error_log('reCAPTCHA verification failed: ' . (string)$e);
    exit;
}

// ====== VALIDACIONES ======
$email = mb_strtolower($email);
if (mb_strlen($nombre) > 100 || mb_strlen($email) > 255) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Datos demasiado largos', 'code' => 'DATA_TOO_LONG']);
    exit;
}
if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Datos inválidos', 'code' => 'DATA_INVALID']);
    exit;
}
if (!$privacyAccepted) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Debes aceptar la política de privacidad', 'code' => 'PRIVACY_REQUIRED']);
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
        echo json_encode(['ok' => false, 'error' => 'Error al guardar en DB', 'code' => 'DB_NEWSLETTER']);
        error_log('DB error: ' . (string)$e . ' / ' . implode(' | ', $stmt->errorInfo()));
        exit;
    }
}

// ====== AVISO INTERNO (solo para ti) ======
if (!file_exists(__DIR__ . '/../vendor/autoload.php')) {
    error_log('PHPMailer autoload no encontrado; se omite el envío de correo.');
    // Aunque no se envíe el correo, la suscripción fue exitosa.
    echo json_encode(['ok' => true, 'notice_sent' => false]);
    exit;
}
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/email_template.php'; // Incluir la nueva plantilla

$noticeSent = false;
$mail = new PHPMailer(true);

try {
    $smtp = $config['smtp'];
    $mail->CharSet = 'UTF-8';
    $mail->isSMTP();
    $mail->Host       = (string)$smtp['host'];
    $mail->Port       = (int)$smtp['port'];
    $mail->SMTPAuth   = true;
    $mail->Username   = (string)$smtp['username'];
    $mail->Password   = (string)$smtp['password'];
    $mail->SMTPSecure = $smtp['encryption'] ?? PHPMailer::ENCRYPTION_STARTTLS;
    
    $mail->setFrom((string)$smtp['username'], 'Newsletter');
    $mail->addAddress((string)$smtp['username']);
    $mail->addReplyTo($email, $nombre);

    $mail->isHTML(true);
    $mail->Subject = '✨ Nuevo suscriptor: ' . $nombre;

    // Datos para la plantilla
    $emailData = [
        'Nombre' => $nombre,
        'Email' => $email,
        'Preferencia Lauren' => (bool)$lauren,
        'Preferencia Elysia' => (bool)$elysia,
        'Preferencia Sahir' => (bool)$sahir,
        'IP' => $ip,
        'User Agent' => $ua
    ];
    
    // TODO: Reemplazar con la URL de tu logo
    $logoUrl = ''; // Por ejemplo: 'https://plumafarollama.com/img/logo.png'

    $mail->Body = getEmailHtml('Nuevo Suscriptor a la Newsletter', $emailData, $logoUrl);
    
    // Cuerpo alternativo de texto plano
    $altBody = "Nuevo registro en la newsletter:\n";
    foreach($emailData as $key => $value) {
        $altBody .= "$key: " . (is_bool($value) ? ($value ? 'Sí' : 'No') : $value) . "\n";
    }
    $mail->AltBody = $altBody;

    $mail->send();
    $noticeSent = true;

} catch (PHPMailerException $e) {
    error_log('Aviso interno no enviado: ' . (string)$e . ' / ' . ($mail->ErrorInfo ?? ''));
}

// ====== RESPUESTA ======
echo json_encode(['ok' => true, 'notice_sent' => $noticeSent]);
