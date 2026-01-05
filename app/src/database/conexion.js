const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
  max: parseInt(process.env.PGPOOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.PGPOOL_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.PGPOOL_CONN_TIMEOUT || '5000', 10),
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
});

pool.connect()
  .then(() => console.log('Pool PG inicializado'))
  .catch((err) => console.error('Error en conexión de BD:', err.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};