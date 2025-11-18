#!/usr/bin/env node
/**
 * Add event_date_end column to event_data table
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function addEndDate() {
  // Use pooled connection for migration to avoid max clients error
  const connectionString = (process.env.POSTGRES_URL ||
                            process.env.POSTGRES_PRISMA_URL ||
                            process.env.POSTGRES_URL_NON_POOLING)
                           ?.replace('?sslmode=require', '')
                           ?.replace('&sslmode=require', '');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Adding event_date_end column...');

    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='event_data' AND column_name='event_date_end'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('ℹ️  Column event_date_end already exists, skipping...');
      await pool.end();
      return;
    }

    // Add the column
    await pool.query(`
      ALTER TABLE event_data
      ADD COLUMN event_date_end TIMESTAMP
    `);

    console.log('✅ Successfully added event_date_end column to event_data table');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addEndDate();
