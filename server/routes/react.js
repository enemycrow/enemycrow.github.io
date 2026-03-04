'use strict';

const express     = require('express');
const crypto      = require('crypto');
const { getPool } = require('../db');
const { genericLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const ALLOWED_REACTIONS = ['toco', 'sumergirme', 'personajes', 'mundo', 'lugares'];

router.post('/', genericLimiter, async (req, res) => {
  const body = req.body;

  const slug     = String(body.slug     ?? '').trim();
  const reaction = String(body.reaction ?? '').trim();
  const action   = String(body.action   ?? 'add');

  if (!slug || !ALLOWED_REACTIONS.includes(reaction) || !['add', 'remove'].includes(action)) {
    return res.status(422).json({ ok: false, error: 'Parámetros inválidos' });
  }

  // IP → hash SHA-256 (privacidad)
  const xff    = req.headers['x-forwarded-for'];
  const rawIp  = xff ? xff.split(',')[0].trim() : (req.ip ?? '0.0.0.0');
  const ipHash = crypto.createHash('sha256').update(rawIp).digest('hex');

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Asegura fila de totales
    await conn.execute('INSERT IGNORE INTO reactions_totals (slug) VALUES (?)', [slug]);

    if (action === 'add') {
      const [insResult] = await conn.execute(
        'INSERT IGNORE INTO reactions_votes (slug, ip_hash, reaction) VALUES (?, ?, ?)',
        [slug, ipHash, reaction],
      );
      if (insResult.affectedRows > 0) {
        // La columna viene de una lista cerrada — no hay riesgo de SQL injection
        await conn.execute(
          `UPDATE reactions_totals SET \`${reaction}\` = \`${reaction}\` + 1 WHERE slug = ?`,
          [slug],
        );
      }
    } else {
      const [delResult] = await conn.execute(
        'DELETE FROM reactions_votes WHERE slug = ? AND ip_hash = ? AND reaction = ?',
        [slug, ipHash, reaction],
      );
      if (delResult.affectedRows > 0) {
        await conn.execute(
          `UPDATE reactions_totals SET \`${reaction}\` = GREATEST(0, \`${reaction}\` - 1) WHERE slug = ?`,
          [slug],
        );
      }
    }

    const [rows] = await conn.execute(
      'SELECT toco, sumergirme, personajes, mundo, lugares FROM reactions_totals WHERE slug = ?',
      [slug],
    );

    await conn.commit();
    return res.json({ ok: true, slug, totals: rows[0] ?? null });
  } catch (err) {
    await conn.rollback();
    console.error('DB error (react):', err.message);
    return res.status(500).json({ ok: false, error: 'DB' });
  } finally {
    conn.release();
  }
});

module.exports = router;
