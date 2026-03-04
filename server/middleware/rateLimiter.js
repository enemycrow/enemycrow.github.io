'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter para el formulario de contacto:
 * máximo 5 solicitudes por IP cada 10 minutos.
 * (replica la lógica de rate_limits en submit.php)
 */
const contactLimiter = rateLimit({
  windowMs:         10 * 60 * 1000, // 10 minutos
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  keyGenerator:     (req) => req.ip,
  handler: (_req, res) => {
    res.status(429).json({ ok: false, error: 'Demasiadas solicitudes', code: 'RATE_LIMIT' });
  },
});

/**
 * Rate limiter genérico para las demás rutas públicas:
 * 30 solicitudes por IP cada 5 minutos.
 */
const genericLimiter = rateLimit({
  windowMs:        5 * 60 * 1000,
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    (req) => req.ip,
  handler: (_req, res) => {
    res.status(429).json({ ok: false, error: 'Demasiadas solicitudes', code: 'RATE_LIMIT' });
  },
});

module.exports = { contactLimiter, genericLimiter };
