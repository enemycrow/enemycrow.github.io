<?php
header('Content-Type: application/json');

// ⚠️ Cambia este dominio por el tuyo real
header('Access-Control-Allow-Origin: https://tusitio.com');
header('Access-Control-Allow-Methods: POST');

// Validación del método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
  exit;
}

// Tomar y limpiar datos
$nombre  = trim($_POST['name'] ?? '');
$email   = trim($_POST['email'] ?? '');
$asunto  = trim($_POST['subject'] ?? 'Nuevo mensaje');
$mensaje = trim($_POST['message'] ?? '');
$voice   = trim($_POST['voice'] ?? null);
$wants   = !empty($_POST['wantsNewsletter']) ? 1 : 0;

// Validación básica
if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $mensaje === '') {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'Datos inválidos']);
  exit;
}

// Conexión a MySQL (cambia por tus datos)
try {
  $pdo = new PDO(
    'mysql:host=localhost;dbname=TU_DB;charset=utf8mb4',
    'TU_USUARIO',
    'TU_PASSWORD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );

  $stmt = $pdo->prepare('
    INSERT INTO contactos 
    (nombre, email, asunto, mensaje, voice, wants_newsletter, ip, user_agent) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ');

  $stmt->execute([
    $nombre, $email, $asunto, $mensaje, $voice, $wants,
    $_SERVER['REMOTE_ADDR'] ?? null,
    $_SERVER['HTTP_USER_AGENT'] ?? null
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Error al guardar en DB']);
  exit;
}

// Enviar correo con PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require __DIR__ . '/../vendor/phpmailer/src/PHPMailer.php';
require __DIR__ . '/../vendor/phpmailer/src/SMTP.php';
require __DIR__ . '/../vendor/phpmailer/src/Exception.php';

$mail = new PHPMailer(true);
try {
  $mail->isSMTP();
  $mail->Host       = 'smtppro.zoho.com'; // si es dominio propio
  $mail->SMTPAuth   = true;
  $mail->Username   = 'TU_CORREO@plumafarollama.com';
  $mail->Password   = 'TU_APP_PASSWORD';
  $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
  $mail->Port       = 465;

  $mail->setFrom('TU_CORREO@plumafarollama.com', 'Formulario Web');
  $mail->addAddress('TU_CORREO@plumafarollama.com');
  $mail->addReplyTo($email, $nombre);

  $mail->isHTML(true);
  $mail->Subject = '📬 Nuevo mensaje de ' . $nombre;
  $mail->Body    = "
    <h2>Nuevo mensaje recibido</h2>
    <p><b>Nombre:</b> $nombre</p>
    <p><b>Email:</b> $email</p>
    <p><b>Asunto:</b> $asunto</p>
    <p><b>Mensaje:</b><br>" . nl2br(htmlspecialchars($mensaje)) . "</p>
    <p><b>Voice:</b> $voice</p>
    <p><b>Newsletter:</b> " . ($wants ? 'Sí' : 'No') . "</p>
  ";

  $mail->AltBody = "$nombre <$email>\nAsunto: $asunto\nMensaje:\n$mensaje";

  $mail->send();
  echo json_encode(['ok' => true]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'No se pudo enviar el correo']);
}
