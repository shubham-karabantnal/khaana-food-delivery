// db/index.js — PostgreSQL connection pool
// Uses the 'pg' library for raw SQL access (required for DBMS project)

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 20,             // max number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

// Helper: execute a raw SQL query
const query = (text, params) => pool.query(text, params);

// Helper: get a client from the pool (for transactions)
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
