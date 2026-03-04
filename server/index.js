'use strict';

const express    = require('express');
const helmet     = require('helmet');
const corsMiddleware = require('./middleware/cors');

const app = express();

// ── Seguridad ────────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(corsMiddleware);

// ── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

// ── Rutas API ────────────────────────────────────────────────────────────────
app.use('/api/submit',            require('./routes/submit'));
app.use('/api/react',             require('./routes/react'));
app.use('/api/reactions',         require('./routes/reactions'));
app.use('/api/newsletter',        require('./routes/newsletter'));
app.use('/api/velvet',            require('./routes/velvet'));
app.use('/api/recaptcha-site-key',require('./routes/recaptcha-site-key'));
app.use('/api/post',              require('./routes/post'));
app.use('/api/fortune_cookie',    require('./routes/fortune_cookie'));

// ── 404 para rutas desconocidas ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada' });
});

// ── Arranque ──────────────────────────────────────────────────────────────────
const config = require('./config');
const port = config.port;

app.listen(port, () => {
  console.log(`Servidor API corriendo en http://localhost:${port}`);
});

module.exports = app;
