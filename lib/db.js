// Database utility functions
const { Pool } = require('pg');

// Prioritize pooled connection to avoid "max clients" errors
// POSTGRES_URL uses Supavisor pooling (better for serverless)
// POSTGRES_URL_NON_POOLING has very limited connections in Session mode
let connectionString = process.env.POSTGRES_URL ||
                        process.env.POSTGRES_PRISMA_URL ||
                        process.env.POSTGRES_URL_NON_POOLING;

// Remove sslmode parameter as we set SSL manually
connectionString = connectionString?.replace('?sslmode=require', '').replace('&sslmode=require', '');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  // Optimized for serverless + Supabase pooling
  max: 2, // Keep pool very small for serverless
  min: 0, // Don't maintain minimum connections
  idleTimeoutMillis: 10000, // Close idle connections quickly (10s)
  connectionTimeoutMillis: 30000, // Increase timeout to 30s for slow connections
  // Add keepalive to prevent connection drops
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Allow time for queries to complete
  statement_timeout: 60000, // 60s query timeout
  query_timeout: 60000
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
  // Don't exit process, just log
});

// Handle connection errors
pool.on('connect', () => {
  console.log('Database pool connected');
});

pool.on('acquire', () => {
  console.log('Client acquired from pool');
});

pool.on('remove', () => {
  console.log('Client removed from pool');
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
