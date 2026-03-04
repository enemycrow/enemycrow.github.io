'use strict';

const express          = require('express');
const { getPool }      = require('../db');
const recaptcha        = require('../middleware/recaptcha');
const { genericLimiter } = require('../middleware/rateLimiter');
const { sendNotification } = require('../utils/email');

const router = express.Router();

// ── POST /api/newsletter — formulario completo (con reCAPTCHA) ────────────────
router.post('/', genericLimiter, recaptcha, async (req, res) => {
  const body = req.body;

  const nombre  = String(body['nl-name']    ?? '').trim();
  const email   = String(body['nl-email']   ?? '').trim().toLowerCase();
  const lauren  = body['nl-lauren']  ? 1 : 0;
  const elysia  = body['nl-elysia']  ? 1 : 0;
  const sahir   = body['nl-sahir']   ? 1 : 0;
  const privacy = !!(body['nl-privacy']);

  if (nombre.length > 100 || email.length > 255) {
    return res.status(422).json({ ok: false, error: 'Datos demasiado largos', code: 'DATA_TOO_LONG' });
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!nombre || !emailRe.test(email)) {
    return res.status(422).json({ ok: false, error: 'Datos inválidos', code: 'DATA_INVALID' });
  }

  if (!privacy) {
    return res.status(422).json({ ok: false, error: 'Debes aceptar la política de privacidad', code: 'PRIVACY_REQUIRED' });
  }

  const ip = req.ip;
  const ua = req.headers['user-agent'] ?? null;

  try {
    const pool = getPool();
    await pool.execute(
      'INSERT INTO newsletter_subscribers (nombre, email, lauren, elysia, sahir, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, email, lauren, elysia, sahir, ip, ua],
    );
  } catch (err) {
    // Duplicado (email UNIQUE) → idempotente
    if (err.code !== 'ER_DUP_ENTRY') {
      console.error('DB error (newsletter):', err.message);
      return res.status(500).json({ ok: false, error: 'Error al guardar en DB', code: 'DB_NEWSLETTER' });
    }
  }

  let noticeSent = false;
  try {
    await sendNotification({
      subject:  `✨ Nuevo suscriptor: ${nombre}`,
      title:    'Nuevo Suscriptor a la Newsletter',
      data: {
        'Nombre':              nombre,
        'Email':               email,
        'Preferencia Lauren':  Boolean(lauren),
        'Preferencia Elysia':  Boolean(elysia),
        'Preferencia Sahir':   Boolean(sahir),
        'IP':                  ip,
        'User Agent':          ua,
      },
      replyTo:   email,
      replyName: nombre,
    });
    noticeSent = true;
  } catch (err) {
    console.error('Email error (newsletter):', err.message);
  }

  return res.json({ ok: true, notice_sent: noticeSent });
});

// ── POST /api/newsletter/subscribe — suscripción rápida del footer ────────────
// Solo recibe email, aplica rate limiting pero no reCAPTCHA (honeypot protege).
router.post('/subscribe', genericLimiter, async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email) || email.length > 255) {
    return res.status(422).json({ ok: false, error: 'Email inválido', code: 'DATA_INVALID' });
  }

  const ip = req.ip;
  const ua = req.headers['user-agent'] ?? null;

  try {
    const pool = getPool();
    // lauren/elysia/sahir = 0 para suscripción general desde el footer
    await pool.execute(
      'INSERT INTO newsletter_subscribers (nombre, email, lauren, elysia, sahir, ip, user_agent) VALUES (?, ?, 0, 0, 0, ?, ?)',
      [email.split('@')[0], email, ip, ua],
    );
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') {
      console.error('DB error (newsletter/subscribe):', err.message);
      return res.status(500).json({ ok: false, error: 'Error al guardar en DB', code: 'DB_NEWSLETTER' });
    }
    // Duplicado → silencioso (idempotente)
  }

  return res.json({ ok: true });
});

module.exports = router;
