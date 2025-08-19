<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

// Cargar config
$config = require dirname(__DIR__, 2) . '/config.php';

// Leer datos: JSON o x-www-form-urlencoded
$nombre = '';
$email  = '';
$lauren = 0;
$elysia = 0;
$sahir  = 0;


$ctype = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($ctype, 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $nombre = trim($input['nl-name'] ?? '');
    $email  = trim($input['nl-email'] ?? '');
    $lauren = !empty($input['nl-lauren']) ? 1 : 0;
    $elysia = !empty($input['nl-elysia']) ? 1 : 0;
    $sahir  = !empty($input['nl-sahir']) ? 1 : 0;
} else {
    $nombre = trim($_POST['nl-name'] ?? '');
    $email  = trim($_POST['nl-email'] ?? '');
    $lauren = !empty($_POST['nl-lauren']) ? 1 : 0;
    $elysia = !empty($_POST['nl-elysia']) ? 1 : 0;
    $sahir  = !empty($_POST['nl-sahir']) ? 1 : 0;
}

// Detectar si viene marcado el checkbox de privacidad
$privacyAccepted = 0;

if (stripos($ctype, 'application/json') !== false) {
    // En JSON puede venir true, "on", 1, etc.
    $privacyAccepted = !empty($input['nl-privacy']) ? 1 : 0;
} else {
    // En form-data los checkboxes marcados suelen venir como "on"
    $privacyAccepted = isset($_POST['nl-privacy']) ? 1 : 0;
}

// Validación
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

// IP (considerando proxy)
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null;
$ua = $_SERVER['HTTP_USER_AGENT'] ?? null;

// DB
try {
    $db = $config['db'];
    $pdo = new PDO(
        "mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4",
        $db['user'],
        $db['pass'],
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    // Recomendado: email UNIQUE en la tabla
    $stmt = $pdo->prepare(
        'INSERT INTO newsletter_subscribers (nombre, email, lauren, elysia, sahir, ip, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$nombre, $email, $lauren, $elysia, $sahir, $ip, $ua]);

} catch (PDOException $e) {
    // Duplicado (SQLSTATE 23000) => idempotente
    if ($e->getCode() === '23000') {
        // Ya estaba suscrito: seguimos como ok
    } else {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Error al guardar en DB']);
        exit;
    }
}

// ---- EMAIL ----
// Si usas Composer, mejor autoload:
// require __DIR__ . '/../vendor/autoload.php';

// Si NO usas Composer, descomenta estas 3 líneas (y verifica el path):
require __DIR__ . '/../vendor/phpmailer/phpmailer/src/PHPMailer.php';
require __DIR__ . '/../vendor/phpmailer/phpmailer/src/SMTP.php';
require __DIR__ . '/../vendor/phpmailer/phpmailer/src/Exception.php';

    $smtp = $config['smtp'];
    
try {
    $mail = new PHPMailer(true);
    $mail->CharSet    = 'UTF-8';
    $mail->isSMTP();
    $mail->Host       = $smtp['host'];
    $mail->Port       = (int)$smtp['port'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtp['username'];
    $mail->Password   = $smtp['password'];
    $mail->SMTPSecure = $smtp['encryption'] ?? PHPMailer::ENCRYPTION_STARTTLS;

    // from debe ser un remitente permitido por tu dominio (alineado SPF/DKIM)
    $mail->setFrom($smtp['username'], 'Newsletter');
    $mail->addAddress($smtp['username']);           // te llega a ti
    $mail->addReplyTo($email, $nombre);             // responder al suscriptor

    $mail->Subject = 'Nuevo suscriptor: ' . $nombre;
    $mail->isHTML(false);
    $mail->Body    = "Se ha registrado $nombre ($email) con preferencias:\n" .
                     "Lauren: $lauren\nElysia: $elysia\nSahir: $sahir\n";

    $mail->send();
} catch (Exception $e) {
    // No interrumpas el flujo si falla el aviso interno
}

// --- Correo de bienvenida al suscriptor ---
try {
    // Reutilizamos el mismo PHPMailer
    $mail->clearAllRecipients();
    $mail->clearReplyTos();

    $mail->setFrom($smtp['username'], 'La Pluma, El Faro y La Llama');
    $mail->addAddress($email, $nombre);

    // Opcional: si quieres que respondan a tu correo
    $mail->addReplyTo($smtp['username'], 'Equipo');

    $mail->Subject = '¡Bienvenido(a) a la newsletter!';
    // Puedes enviar HTML si quieres
    $mail->isHTML(true);

    $siteName = 'La Pluma, El Faro y La Llama';
    $unsubscribeUrl = 'https://plumafarollama.com/unsubscribe?email=' . urlencode($email); // opcional si aún no tienes endpoint

    $mail->Body = "
        <div style=\"font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.5;\">
            <h2>¡Hola, {$nombre}!</h2>
            <p>Gracias por suscribirte a <strong>{$siteName}</strong>. Pronto recibirás noticias, relatos y artículos seleccionados.</p>
            <ul>
                <li><strong>Lauren</strong>: " . ($lauren ? 'sí' : 'no') . "</li>
                <li><strong>Elysia</strong>: " . ($elysia ? 'sí' : 'no') . "</li>
                <li><strong>Sahir</strong>: " . ($sahir ? 'sí' : 'no') . "</li>
            </ul>
            <p>Si este mensaje no era para ti, o prefieres dejar de recibir correos, 
            puedes <a href=\"{$unsubscribeUrl}\">darte de baja aquí</a>.</p>
            <p>Con cariño,<br>El equipo de {$siteName}</p>
        </div>
    ";

    $mail->AltBody =
        "Hola, {$nombre}!\n\n" .
        "Gracias por suscribirte a {$siteName}. Pronto recibirás noticias.\n\n" .
        "Preferencias:\n" .
        " - Lauren: " . ($lauren ? 'sí' : 'no') . "\n" .
        " - Elysia: " . ($elysia ? 'sí' : 'no') . "\n" .
        " - Sahir: " . ($sahir ? 'sí' : 'no') . "\n\n" .
        "Darse de baja: {$unsubscribeUrl}\n";

    // Cabeceras de buenas prácticas (opcional)
    $mail->addCustomHeader('List-Unsubscribe', "<{$unsubscribeUrl}>");
    $mail->addCustomHeader('X-Entity-Ref-ID', bin2hex(random_bytes(8)));

    $mail->send();
} catch (\PHPMailer\PHPMailer\Exception $e) {
    // No interrumpimos el flujo si falla el correo al suscriptor
}

echo json_encode(['ok' => true]);