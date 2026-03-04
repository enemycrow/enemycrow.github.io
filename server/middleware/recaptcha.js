'use strict';

const https   = require('https');
const qs      = require('querystring');
const config  = require('../config');

/**
 * Verifica un token reCAPTCHA v3.
 * Rechaza si score < 0.5 o si Google reporta fallo.
 */
async function verifyRecaptcha(token) {
  return new Promise((resolve, reject) => {
    const payload = qs.stringify({
      secret:   config.recaptcha.secret,
      response: token,
    });

    const options = {
      hostname: 'www.google.com',
      path:     '/recaptcha/api/siteverify',
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Respuesta inválida de reCAPTCHA'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10_000, () => {
      req.destroy(new Error('Timeout verificando reCAPTCHA'));
    });
    req.write(payload);
    req.end();
  });
}

/**
 * Middleware Express que lee `token` del body y lo valida.
 * En caso de fallo responde 400 y detiene la cadena.
 */
module.exports = async function recaptchaMiddleware(req, res, next) {
  const token = String(req.body?.token ?? '').trim();

  if (!token) {
    return res.status(400).json({ ok: false, error: 'Token reCAPTCHA requerido', code: 'RECAPTCHA_MISSING' });
  }

  try {
    const result = await verifyRecaptcha(token);
    if (!result.success || (result.score ?? 0) < 0.5) {
      return res.status(400).json({ ok: false, error: 'reCAPTCHA inválido', code: 'RECAPTCHA_INVALID' });
    }
    next();
  } catch (err) {
    console.error('reCAPTCHA error:', err.message);
    return res.status(500).json({ ok: false, error: 'Error al verificar reCAPTCHA', code: 'RECAPTCHA_ERROR' });
  }
};
