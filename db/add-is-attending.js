#!/usr/bin/env node
/**
 * Add is_attending column to users table
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function addIsAttending() {
  const connectionString = (process.env.POSTGRES_URL_NON_POOLING ||
                            process.env.POSTGRES_PRISMA_URL ||
                            process.env.POSTGRES_URL)
                           ?.replace('?sslmode=require', '')
                           ?.replace('&sslmode=require', '');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1
  });

  try {
    console.log('🔄 Adding is_attending column...');

    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='users' AND column_name='is_attending'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('ℹ️  Column is_attending already exists, skipping...');
      await pool.end();
      return;
    }

    // Add the column
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN is_attending BOOLEAN DEFAULT FALSE
    `);

    console.log('✅ Successfully added is_attending column to users table');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addIsAttending();
