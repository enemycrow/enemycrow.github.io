'use strict';

const nodemailer = require('nodemailer');
const config     = require('../config');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   config.smtp.host,
      port:   config.smtp.port,
      secure: config.smtp.secure, // true para 465, false para STARTTLS (587)
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
}

/**
 * Genera el HTML del correo de notificación interna.
 * Replica la plantilla de email_template.php.
 *
 * @param {string} title  - Título del correo
 * @param {Object} data   - Pares clave/valor para mostrar en la tabla
 * @param {string} logoUrl - URL opcional del logo
 */
function buildEmailHtml(title, data, logoUrl = '') {
  const logoHtml = logoUrl
    ? `<img src="${escHtml(logoUrl)}" alt="Logo" style="max-width:150px;margin-bottom:20px;">`
    : '';

  const rows = Object.entries(data).map(([key, value]) => {
    const displayValue = typeof value === 'boolean'
      ? (value ? 'Sí' : 'No')
      : escHtml(String(value ?? ''));
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;background-color:#f9f9f9;">
        <strong>${escHtml(key)}:</strong>
      </td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">${displayValue}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escHtml(title)}</title>
</head>
<body style="font-family:Arial,sans-serif;margin:0;padding:20px;background-color:#f4f4f4;color:#333;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0"
    style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1);">
    <thead>
      <tr>
        <td style="padding:20px;text-align:center;background-color:#4a0e6c;color:#ffffff;">
          ${logoHtml}
          <h1 style="margin:0;font-size:24px;">${escHtml(title)}</h1>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:20px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            ${rows}
          </table>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td style="padding:20px;text-align:center;font-size:12px;color:#888;background-color:#f4f4f4;">
          <p style="margin:0;">Correo generado automáticamente desde tu sitio web.</p>
        </td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}

/**
 * Construye el cuerpo de texto plano del correo.
 */
function buildEmailText(data) {
  return Object.entries(data)
    .map(([k, v]) => `${k}: ${typeof v === 'boolean' ? (v ? 'Sí' : 'No') : v}`)
    .join('\n');
}

/**
 * Envía un correo de notificación interna al administrador.
 *
 * @param {string} subject   - Asunto del mensaje
 * @param {string} title     - Título visual en el HTML
 * @param {Object} data      - Datos a mostrar en tabla
 * @param {string} replyTo   - Email de respuesta
 * @param {string} replyName - Nombre de respuesta
 */
async function sendNotification({ subject, title, data, replyTo, replyName }) {
  const from = config.smtp.user;
  const html = buildEmailHtml(title, data);
  const text = buildEmailText(data);

  await getTransporter().sendMail({
    from:     `"Formulario Web" <${from}>`,
    to:       from,
    replyTo:  replyTo ? `"${replyName}" <${replyTo}>` : undefined,
    subject,
    html,
    text,
  });
}

/** Escapa caracteres HTML para prevenir XSS en plantillas de correo. */
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { sendNotification };
