#!/usr/bin/env node
/**
 * Check current event data in database
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkEvent() {
  const connectionString = (process.env.POSTGRES_URL_NON_POOLING ||
                            process.env.POSTGRES_PRISMA_URL ||
                            process.env.POSTGRES_URL)
                           ?.replace('?sslmode=require', '')
                           ?.replace('&sslmode=require', '');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query('SELECT * FROM event_data');

    if (result.rows.length === 0) {
      console.log('❌ No event data found in database');
    } else {
      console.log('✅ Event data:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkEvent();
