// Database utility functions

// Fix for corrupted POSTGRES_URL from Vercel integration
// Use POSTGRES_PRISMA_URL which is complete and working
if (process.env.POSTGRES_PRISMA_URL && !process.env.POSTGRES_URL_OVERRIDE) {
  process.env.POSTGRES_URL = process.env.POSTGRES_PRISMA_URL;
}

const { sql } = require('@vercel/postgres');

/**
 * Get database connection
 * Uses Vercel Postgres environment variables automatically
 * Falls back to POSTGRES_PRISMA_URL if POSTGRES_URL is corrupted
 */
function getDB() {
  return sql;
}

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
