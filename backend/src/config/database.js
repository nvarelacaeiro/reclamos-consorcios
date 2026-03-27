const mysql = require('mysql2/promise');
require('dotenv').config();

// Railway expone MYSQLHOST, MYSQLUSER, etc.
// Localmente usamos DB_HOST, DB_USER, etc. definidos en .env
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || process.env.MYSQLHOST     || 'localhost',
  port:     Number(process.env.DB_PORT || process.env.MYSQLPORT  || 3306),
  user:     process.env.DB_USER     || process.env.MYSQLUSER     || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME     || process.env.MYSQLDATABASE || 'reclamos_consorcios',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '-03:00',
  // SSL requerido en Railway y otros hosts cloud (activar con DB_SSL=1)
  ssl: process.env.DB_SSL === '1' ? { rejectUnauthorized: false } : undefined,
});

module.exports = pool;
