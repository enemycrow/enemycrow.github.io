<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\Exception as MailException;
use PHPMailer\PHPMailer\PHPMailer;

$config = require __DIR__ . '/../api/config.php';

if (!is_array($config) || empty($config['db']) || empty($config['smtp'])) {
    fwrite(STDERR, "Configuración inválida o incompleta.\n");
    exit(1);
}

$db = $config['db'];

try {
    $pdo = new PDO(
        "mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4",
        (string) $db['user'],
        (string) $db['pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    // Asegura que las comparaciones de fechas usen GMT-3
    $pdo->exec("SET time_zone = '-03:00'");
} catch (Throwable $e) {
    fwrite(STDERR, 'Error al conectar a la base de datos: ' . $e->getMessage() . "\n");
    exit(1);
}

$tz = new DateTimeZone('America/Argentina/Buenos_Aires');
$now = new DateTimeImmutable('now', $tz);
$end = $now->modify('friday this week')->setTime(20, 0);
if ($now < $end) {
    $end = $end->modify('-1 week');
}
$start = $end->modify('-1 week');

$startStr = $start->format('Y-m-d H:i:s');
$endStr = $end->format('Y-m-d H:i:s');
$rangeLabel = sprintf('%s → %s (GMT-3)', $start->format('Y-m-d H:i'), $end->format('Y-m-d H:i'));

$reactions = ['toco', 'sumergirme', 'personajes', 'mundo', 'lugares'];
$weeklyTotals = [];
$weeklyTotalCount = 0;

try {
    $weeklyStmt = $pdo->prepare(
        'SELECT slug, reaction, COUNT(*) AS total
         FROM reactions_votes
         WHERE created_at >= :start AND created_at < :end
         GROUP BY slug, reaction
         ORDER BY slug, reaction'
    );
    $weeklyStmt->execute([':start' => $startStr, ':end' => $endStr]);
    foreach ($weeklyStmt as $row) {
        $slug = (string) $row['slug'];
        $reaction = (string) $row['reaction'];
        $count = (int) $row['total'];
        $weeklyTotals[$slug][$reaction] = $count;
        $weeklyTotalCount += $count;
    }

    $totalsStmt = $pdo->query(
        'SELECT slug, toco, sumergirme, personajes, mundo, lugares
         FROM reactions_totals
         ORDER BY slug'
    );
    $allTimeTotals = $totalsStmt->fetchAll();
} catch (Throwable $e) {
    fwrite(STDERR, 'Error al consultar las reacciones: ' . $e->getMessage() . "\n");
    exit(1);
}

$weeklyLines = [];
foreach ($weeklyTotals as $slug => $counts) {
    $parts = [];
    foreach ($reactions as $reaction) {
        $parts[] = sprintf('%s: %d', $reaction, $counts[$reaction] ?? 0);
    }
    $weeklyLines[] = sprintf('%s → %s', $slug, implode(', ', $parts));
}
$weeklySummary = $weeklyLines ? implode(' • ', $weeklyLines) : 'Sin registros en el período.';

$allTimeLines = [];
$allTimeTotalCount = 0;
foreach ($allTimeTotals as $row) {
    $parts = [];
    foreach ($reactions as $reaction) {
        $value = (int) ($row[$reaction] ?? 0);
        $parts[] = sprintf('%s: %d', $reaction, $value);
        $allTimeTotalCount += $value;
    }
    $allTimeLines[] = sprintf('%s → %s', $row['slug'], implode(', ', $parts));
}
$allTimeSummary = $allTimeLines ? implode(' • ', $allTimeLines) : 'Sin datos acumulados.';

require __DIR__ . '/../api/email_template.php';

$mail = new PHPMailer(true);

try {
    $smtp = $config['smtp'];
    $recipient = $config['admin_email'] ?? $smtp['username'];

    $mail->CharSet = 'UTF-8';
    $mail->isSMTP();
    $mail->Host       = (string) $smtp['host'];
    $mail->Port       = (int) $smtp['port'];
    $mail->SMTPAuth   = true;
    $mail->Username   = (string) $smtp['username'];
    $mail->Password   = (string) $smtp['password'];
    $mail->SMTPSecure = $smtp['encryption'] ?? PHPMailer::ENCRYPTION_STARTTLS;

    $mail->setFrom((string) $smtp['username'], 'Reportes del sitio');
    $mail->addAddress((string) $recipient);

    $subject = sprintf('Reporte semanal de reacciones (%s → %s)', $start->format('Y-m-d'), $end->format('Y-m-d'));
    $mail->Subject = $subject;
    $mail->isHTML(true);

    $emailData = [
        'Intervalo semanal' => $rangeLabel,
        'Total de reacciones en la semana' => $weeklyTotalCount,
        'Detalle semanal' => $weeklySummary,
        'Total acumulado (histórico)' => $allTimeTotalCount,
        'Detalle acumulado' => $allTimeSummary,
        'Generado el' => $now->format('Y-m-d H:i T'),
    ];

    $mail->Body = getEmailHtml('Reporte semanal de reacciones', $emailData);

    $altLines = [
        'Reporte semanal de reacciones',
        'Intervalo: ' . $rangeLabel,
        'Total semanal: ' . $weeklyTotalCount,
        'Detalle semanal:',
    ];

    if ($weeklyLines) {
        foreach ($weeklyLines as $line) {
            $altLines[] = '  - ' . $line;
        }
    } else {
        $altLines[] = '  - Sin registros en el período.';
    }

    $altLines[] = 'Total acumulado: ' . $allTimeTotalCount;
    $altLines[] = 'Detalle acumulado:';

    if ($allTimeLines) {
        foreach ($allTimeLines as $line) {
            $altLines[] = '  - ' . $line;
        }
    } else {
        $altLines[] = '  - Sin datos acumulados.';
    }

    $altLines[] = 'Generado el: ' . $now->format('Y-m-d H:i T');

    $mail->AltBody = implode("\n", $altLines);

    $mail->send();
    echo "Reporte enviado para el intervalo {$rangeLabel}.\n";
} catch (MailException $e) {
    fwrite(STDERR, 'Error al enviar el correo: ' . $e->getMessage() . "\n");
    exit(1);
} catch (Throwable $e) {
    fwrite(STDERR, 'Error inesperado al preparar el correo: ' . $e->getMessage() . "\n");
    exit(1);
}
