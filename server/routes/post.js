'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const router = express.Router();

let postsCache     = null;
let postsCacheTime = 0;
const CACHE_TTL_MS = 60_000; // 1 minuto

function getPosts() {
  const now = Date.now();
  if (postsCache && now - postsCacheTime < CACHE_TTL_MS) return postsCache;

  const filePath = path.resolve(__dirname, '../../posts.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  postsCache     = JSON.parse(raw);
  postsCacheTime = now;
  return postsCache;
}

router.get('/', (req, res) => {
  const id   = req.query.id   != null ? String(req.query.id).trim()   : null;
  const slug = req.query.slug != null ? String(req.query.slug).trim() : null;

  if (!id && !slug) {
    return res.status(400).json({ ok: false, error: 'Se requiere id o slug' });
  }

  try {
    const posts = getPosts();
    const post  = posts.find((p) => {
      if (id   && String(p.id)   === id)   return true;
      if (slug && String(p.slug) === slug) return true;
      return false;
    });

    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post no encontrado' });
    }

    return res.json({ ok: true, post });
  } catch (err) {
    console.error('Error leyendo posts.json:', err.message);
    return res.status(500).json({ ok: false, error: 'Error del servidor' });
  }
});

module.exports = router;
