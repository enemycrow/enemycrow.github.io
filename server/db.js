'use strict';

const mysql = require('mysql2/promise');
const config = require('./config');

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:              config.db.host,
      database:          config.db.name,
      user:              config.db.user,
      password:          config.db.password,
      charset:           config.db.charset,
      waitForConnections: true,
      connectionLimit:   10,
      queueLimit:        0,
      timezone:          'Z',
    });
  }
  return pool;
}

module.exports = { getPool };
