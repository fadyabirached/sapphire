const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Without this handler, an error on an idle client (e.g. dropped connection)
// is an unhandled 'error' event on the Pool's EventEmitter, which crashes the process.
pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client:', err);
});

module.exports = pool;
