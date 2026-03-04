'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const router = express.Router();

let cookiesCache     = null;
let cookiesCacheTime = 0;
const CACHE_TTL_MS   = 60_000;

function getCookies() {
  const now = Date.now();
  if (cookiesCache && now - cookiesCacheTime < CACHE_TTL_MS) return cookiesCache;

  const filePath = path.resolve(__dirname, '../../fortune_cookies.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  cookiesCache     = JSON.parse(raw);
  cookiesCacheTime = now;
  return cookiesCache;
}

router.get('/', (req, res) => {
  const id   = req.query.id   != null ? String(req.query.id).trim()   : null;
  const slug = req.query.slug != null ? String(req.query.slug).trim() : null;

  if (!id && !slug) {
    return res.status(400).json({ ok: false, error: 'Se requiere id o slug' });
  }

  try {
    const cookies = getCookies();
    const cookie  = cookies.find((c) => {
      if (id   && String(c.id)   === id)   return true;
      if (slug && String(c.slug) === slug) return true;
      return false;
    });

    if (!cookie) {
      return res.status(404).json({ ok: false, error: 'Fortune cookie no encontrado' });
    }

    return res.json({ ok: true, fortune_cookie: cookie });
  } catch (err) {
    console.error('Error leyendo fortune_cookies.json:', err.message);
    return res.status(500).json({ ok: false, error: 'Error del servidor' });
  }
});

module.exports = router;
