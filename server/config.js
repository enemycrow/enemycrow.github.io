'use strict';

const path = require('path');

// Busca el .env en el directorio raíz del proyecto o en el padre (fuera de public_html)
const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
];

for (const envPath of envCandidates) {
  try {
    require('dotenv').config({ path: envPath });
    break;
  } catch {
    // continuar
  }
}

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Variable de entorno requerida no encontrada: ${name}`);
  return val;
}

function optional(name, defaultValue = '') {
  return process.env[name] ?? defaultValue;
}

module.exports = {
  port: parseInt(optional('PORT', '3000'), 10),

  db: {
    host:     required('DB_HOST'),
    name:     required('DB_NAME'),
    user:     required('DB_USER'),
    password: required('DB_PASS'),
    charset:  'utf8mb4',
  },

  smtp: {
    host:       required('SMTP_HOST'),
    port:       parseInt(optional('SMTP_PORT', '587'), 10),
    secure:     optional('SMTP_ENCRYPT', 'tls') === 'ssl',
    user:       required('SMTP_USER'),
    pass:       required('SMTP_PASS'),
  },

  recaptcha: {
    siteKey: required('RECAPTCHA_SITE_KEY'),
    secret:  required('RECAPTCHA_SECRET'),
  },

  cors: {
    allowedOrigins: [
      'https://plumafarollama.com',
      'https://www.plumafarollama.com',
      'https://enemycrow.github.io',
    ],
  },
};
