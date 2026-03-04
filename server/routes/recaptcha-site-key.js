'use strict';

const express = require('express');
const config  = require('../config');

const router = express.Router();

router.get('/', (_req, res) => {
  const siteKey = config.recaptcha.siteKey;

  if (!siteKey) {
    return res.status(500).json({ error: 'No se pudo cargar reCAPTCHA site key' });
  }

  return res.json({ siteKey });
});

module.exports = router;
