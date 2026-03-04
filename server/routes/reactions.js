'use strict';

const express     = require('express');
const { getPool } = require('../db');
const { genericLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/', genericLimiter, async (req, res) => {
  const slug = String(req.query.slug ?? '').trim();

  if (!slug) {
    return res.status(400).json({ ok: false, error: 'slug requerido' });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT toco, sumergirme, personajes, mundo, lugares FROM reactions_totals WHERE slug = ?',
      [slug],
    );

    const totals = rows[0] ?? { toco: 0, sumergirme: 0, personajes: 0, mundo: 0, lugares: 0 };
    return res.json({ ok: true, slug, totals });
  } catch (err) {
    console.error('DB error (reactions):', err.message);
    return res.status(500).json({ ok: false, error: 'DB' });
  }
});

module.exports = router;
