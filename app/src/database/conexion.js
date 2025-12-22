const { Pool } = require("pg")
// Coloca aquí tus credenciales


const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,

});
conectado=pool.connect();
console.log(`Base de datos conectada ${conectado} `);

module.exports = {
  query: (text, params) => pool.query(text, params),
};