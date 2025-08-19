<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

// ====== LOG DE ERRORES (DIAGNÓSTICO TEMPORAL) ======
error_reporting(E_ALL);
ini_set('display_errors', '0');                      // no mostrar en pantalla
ini_set('log_errors', '1');
@ini_set('error_log', __DIR__ . '/../php_error.log'); // escribe en public_html/php_error.log

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

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

// ====== CARGAR CONFIG FUERA DE public_html ======
$cfgCandidates = [
    dirname(__DIR__, 2) . '/config.php', // /home/usuario/config.php (recomendado)
    dirname(__DIR__) . '/config.php',    // si public_html está 1 nivel abajo
    __DIR__ . '/config.php',             // fallback (no recomendado)
];

$config = null;
$cfgPathUsed = null;

foreach ($cfgCandidates as $cfgPath) {
    if (is_file($cfgPath)) {
        $cfgPathUsed = $cfgPath;
        try {
            $config = require $cfgPath;
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'ok' => false,
                'error' => 'Error en config.php: ' . $e->getMessage(),
                'path' => $cfgPathUsed
            ]);
            exit;
        }
        break;
    }
}

if (!$config) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Config no encontrada',
        'buscado_en' => $cfgCandidates
    ]);
    exit;
}

// ====== LEER INPUT (JSON o form-data) ======
$nombre = '';
$email  = '';
$lauren = 0;
$elysia = 0;
$sahir  = 0;

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
    // Duplicado (email UNIQUE) => consideramos idempotente y seguimos ok
    if ($e->getCode() !== '23000') {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Error al guardar en DB']);
        exit;
    }
}

// ====== CARGAR PHPMailer (autodetección de ruta) ======
$phCandidates = [
    __DIR__ . '/../vendor/PHPmailer/PHPmailer/src', // composer-like (manual)
    __DIR__ . '/../vendor/PHPMailer/src',           // zip manual (PHPMailer/src)
];
$phSrc = null;
foreach ($phCandidates as $p) {
    if (is_file($p . '/PHPMailer.php') && is_file($p . '/SMTP.php') && is_file($p . '/Exception.php')) {
        $phSrc = $p;
        break;
    }
}
if (!$phSrc) {
    // No frenamos el flujo si no está PHPMailer; ya se guardó en DB.
    echo json_encode(['ok' => true, 'warn' => 'PHPMailer no encontrado (no se enviaron correos)']);
    exit;
}
require_once $phSrc . '/PHPMailer.php';
require_once $phSrc . '/SMTP.php';
require_once $phSrc . '/Exception.php';

// ====== EMAILS ======
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

    // ---- Aviso para ti
    $mail->setFrom((string)$smtp['username'], 'Newsletter');
    $mail->addAddress((string)$smtp['username']);
    $mail->addReplyTo($email, $nombre);

    $mail->Subject = 'Nuevo suscriptor: ' . $nombre;
    $mail->isHTML(false);
    $mail->Body = "Se ha registrado $nombre ($email) con preferencias:\n" .
                  "Lauren: $lauren\nElysia: $elysia\nSahir: $sahir\n" .
                  "IP: " . ($ip ?? '-') . "\nUA: " . ($ua ?? '-') . "\n";

    $mail->send();
} catch (PHPMailerException $e) {
    // No cortamos el flujo si falla el aviso interno
}

// ---- Bienvenida al suscriptor
try {
    $mail->clearAllRecipients();
    $mail->clearReplyTos();

    $siteName = 'La Pluma, El Faro y La Llama';
    $unsubscribeUrl = 'https://plumafarollama.com/unsubscribe?email=' . urlencode($email); // opcional

    $mail->setFrom((string)$smtp['username'], $siteName);
    $mail->addAddress($email, $nombre);
    $mail->addReplyTo((string)$smtp['username'], 'Equipo');

    $mail->Subject = '¡Bienvenido(a) a la newsletter!';
    $mail->isHTML(true);
    $mail->Body = '
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.5;">
            <h2>¡Hola, ' . htmlspecialchars($nombre, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '!</h2>
            <p>Gracias por suscribirte a <strong>' . htmlspecialchars($siteName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</strong>. Pronto recibirás noticias, relatos y artículos seleccionados.</p>
            <ul>
                <li><strong>Lauren</strong>: ' . ($lauren ? 'sí' : 'no') . '</li>
                <li><strong>Elysia</strong>: ' . ($elysia ? 'sí' : 'no') . '</li>
                <li><strong>Sahir</strong>: ' . ($sahir ? 'sí' : 'no') . '</li>
            </ul>
            <p>Si este mensaje no era para ti, o prefieres dejar de recibir correos,
            puedes <a href="' . htmlspecialchars($unsubscribeUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '">darte de baja aquí</a>.</p>
            <p>Con cariño,<br>El equipo de ' . htmlspecialchars($siteName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>
        </div>
    ';
    $mail->AltBody =
        "Hola, {$nombre}!\n\n" .
        "Gracias por suscribirte a {$siteName}. Pronto recibirás noticias.\n\n" .
        "Preferencias:\n" .
        " - Lauren: " . ($lauren ? 'sí' : 'no') . "\n" .
        " - Elysia: " . ($elysia ? 'sí' : 'no') . "\n" .
        " - Sahir: " . ($sahir ? 'sí' : 'no') . "\n\n" .
        "Darse de baja: {$unsubscribeUrl}\n";

    // Cabeceras recomendadas
    $mail->addCustomHeader('List-Unsubscribe', "<{$unsubscribeUrl}>");
    $mail->addCustomHeader('X-Entity-Ref-ID', bin2hex(random_bytes(8)));

    $mail->send();
} catch (PHPMailerException $e) {
    // No interrumpimos el flujo si falla la bienvenida
}

// ====== OK FINAL ======
echo json_encode(['ok' => true]);
