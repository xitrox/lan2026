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
  // Limit pool size for serverless environment
  // Vercel Functions are stateless, so keep pool small
  max: 3, // Maximum 3 connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000 // Timeout after 10s if can't connect
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
