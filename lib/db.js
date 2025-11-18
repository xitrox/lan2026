// Database utility functions
const { Pool } = require('pg');

// Use POSTGRES_URL (Supavisor pooling) for high concurrency
// Supports 20+ simultaneous connections without hitting limits
let connectionString;
let connectionType;

if (process.env.POSTGRES_URL) {
  connectionString = process.env.POSTGRES_URL;
  connectionType = 'POSTGRES_URL (Supavisor pooled, optimized for concurrency)';
} else if (process.env.POSTGRES_PRISMA_URL) {
  connectionString = process.env.POSTGRES_PRISMA_URL;
  connectionType = 'POSTGRES_PRISMA_URL (Transaction mode)';
} else if (process.env.POSTGRES_URL_NON_POOLING) {
  connectionString = process.env.POSTGRES_URL_NON_POOLING;
  connectionType = 'POSTGRES_URL_NON_POOLING (Session mode)';
} else {
  throw new Error('No database connection string found');
}

console.log(`[DB] Using connection: ${connectionType}`);

// Remove sslmode parameter as we set SSL manually
connectionString = connectionString?.replace('?sslmode=require', '').replace('&sslmode=require', '');

// Parse connection string to log (without password)
try {
  const url = new URL(connectionString);
  console.log(`[DB] Connecting to: ${url.hostname}:${url.port}${url.pathname}`);
} catch (e) {
  console.log('[DB] Could not parse connection string');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  // Optimized for serverless with high concurrency
  max: 20, // Allow up to 20 connections per function instance
  min: 0, // Don't maintain idle connections
  idleTimeoutMillis: 3000, // Release connections very quickly (3s)
  connectionTimeoutMillis: 15000, // 15s connection timeout
  // Supavisor handles connection pooling, so no keepalive needed
  allowExitOnIdle: true // Allow process to exit when idle
});

// Detailed pool event logging
pool.on('error', (err, client) => {
  console.error('[DB Pool Error]', err.message);
  console.error('[DB Pool Error] Full error:', JSON.stringify(err, null, 2));
});

pool.on('connect', (client) => {
  console.log('[DB] Client connected to pool');
});

pool.on('acquire', (client) => {
  console.log('[DB] Client acquired from pool');
});

pool.on('remove', (client) => {
  console.log('[DB] Client removed from pool');
});

/**
 * Get database connection
 * Uses pg library with POSTGRES_URL_NON_POOLING (same as local setup)
 */
function getDB() {
  return pool;
}

// Create sql template function for compatibility with @vercel/postgres syntax
const sql = async (strings, ...values) => {
  // Build parameterized query
  let query = '';
  let paramIndex = 1;
  const params = [];

  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    if (i < values.length) {
      query += `$${paramIndex++}`;
      params.push(values[i]);
    }
  }

  return pool.query(query, params);
};

// Add query method for non-template queries
sql.query = (text, params) => pool.query(text, params);

/**
 * Helper to execute a query and return results
 */
async function query(queryString, params = []) {
  try {
    const result = await sql.query(queryString, params);
    return { success: true, rows: result.rows, rowCount: result.rowCount };
  } catch (error) {
    console.error('Database query error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper to execute a single row query
 */
async function queryOne(queryString, params = []) {
  const result = await query(queryString, params);
  if (!result.success) {
    return result;
  }
  return { success: true, row: result.rows[0] || null };
}

module.exports = {
  getDB,
  query,
  queryOne,
  sql
};
