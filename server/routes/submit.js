'use strict';

const express          = require('express');
const { getPool }      = require('../db');
const recaptcha        = require('../middleware/recaptcha');
const { contactLimiter } = require('../middleware/rateLimiter');
const { sendNotification } = require('../utils/email');

const router = express.Router();

router.post('/', contactLimiter, recaptcha, async (req, res) => {
  const body = req.body;

  // ── Sanitizar ────────────────────────────────────────────────────────────
  const nombre    = String(body.name    ?? '').trim();
  const email     = String(body.email   ?? '').trim();
  const asunto    = String(body.subject ?? 'Nuevo mensaje').trim();
  const mensaje   = String(body.message ?? '').trim();
  const voice     = String(body.voice   ?? '').trim();
  const newsletter = body.newsletter ? 1 : 0;

  // ── Validar longitud ──────────────────────────────────────────────────────
  if (
    nombre.length  > 100  ||
    asunto.length  > 100  ||
    email.length   > 255  ||
    mensaje.length > 2000 ||
    voice.length   > 255
  ) {
    return res.status(422).json({ ok: false, error: 'Datos demasiado largos', code: 'DATA_TOO_LONG' });
  }

  // ── Validar campos requeridos ─────────────────────────────────────────────
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!nombre || !emailRe.test(email) || !mensaje) {
    return res.status(422).json({ ok: false, error: 'Datos inválidos', code: 'DATA_INVALID' });
  }

  const ip = req.ip;
  const ua = req.headers['user-agent'] ?? null;

  // ── Guardar en DB ─────────────────────────────────────────────────────────
  try {
    const pool = getPool();
    await pool.execute(
      'INSERT INTO contactos (nombre, email, asunto, mensaje, voice, wants_newsletter, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, email, asunto, mensaje, voice || null, newsletter, ip, ua],
    );
  } catch (err) {
    console.error('DB error (submit):', err.message);
    return res.status(500).json({ ok: false, error: 'Error al guardar en DB', code: 'DB_SUBMIT' });
  }

  // ── Enviar correo de notificación ─────────────────────────────────────────
  try {
    await sendNotification({
      subject:  `📬 Nuevo mensaje de ${nombre}`,
      title:    'Nuevo Mensaje del Formulario',
      data: {
        'Nombre':                        nombre,
        'Email':                         email,
        'Asunto':                        asunto,
        'Voz de Preferencia':            voice,
        'Mensaje':                       mensaje,
        'Suscribirse al Newsletter':     newsletter ? 'Sí' : 'No',
      },
      replyTo:   email,
      replyName: nombre,
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Email error (submit):', err.message);
    return res.status(500).json({ ok: false, error: 'No se pudo enviar el correo', code: 'EMAIL_SEND' });
  }
});

module.exports = router;
