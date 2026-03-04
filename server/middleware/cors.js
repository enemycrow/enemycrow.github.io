'use strict';

const config = require('../config');

/**
 * Middleware CORS — replica exacta del comportamiento de http.php.
 * Solo permite los orígenes de producción y devuelve 204 en OPTIONS.
 */
module.exports = function cors(req, res, next) {
  const origin = req.headers['origin'] ?? '';

  if (config.cors.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const requestedHeaders = req.headers['access-control-request-headers']
    ?? 'Content-Type, X-Requested-With, Authorization';

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', requestedHeaders);
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
};
