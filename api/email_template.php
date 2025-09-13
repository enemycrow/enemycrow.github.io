<?php
function getEmailHtml(string $title, array $data, string $logoUrl = ''): string
{
    // Prepara las filas de datos, escapando el HTML para seguridad
    $rows = '';
    foreach ($data as $key => $value) {
        $displayValue = is_bool($value) ? ($value ? 'Sí' : 'No') : htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
        $rows .= "<tr><td style=\"padding: 8px; border-bottom: 1px solid #ddd; background-color: #f9f9f9;\"><strong>" . htmlspecialchars($key, ENT_QUOTES, 'UTF-8') . ":</strong></td><td style=\"padding: 8px; border-bottom: 1px solid #ddd;\">" . $displayValue . "</td></tr>";
    }

    // Opcionalmente, inserta el logo si se proporciona una URL
    $logoHtml = '';
    if ($logoUrl) {
        $logoHtml = '<img src="' . htmlspecialchars($logoUrl, ENT_QUOTES, 'UTF-8') . '" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">';
    }

    // Plantilla de correo electrónico en HTML
    return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$title</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; color: #333;">

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <thead>
            <tr>
                <td style="padding: 20px; text-align: center; background-color: #4a0e6c; color: #ffffff;">
                    $logoHtml
                    <h1 style="margin: 0; font-size: 24px;">$title</h1>
                </td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="padding: 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        $rows
                    </table>
                </td>
            </tr>
        </tbody>
        <tfoot>
            <tr>
                <td style="padding: 20px; text-align: center; font-size: 12px; color: #888; background-color: #f4f4f4;">
                    <p style="margin: 0;">Correo generado automáticamente desde tu sitio web.</p>
                </td>
            </tr>
        </tfoot>
    </table>

</body>
</html>
HTML;
}
