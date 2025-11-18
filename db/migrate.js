#!/usr/bin/env node
/**
 * Database Migration Script
 * Applies the schema.sql to the database
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function migrate() {
  // Use the non-pooling URL for migrations
  const connectionString = process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    log('❌ POSTGRES_URL_NON_POOLING not found in environment variables', 'red');
    log('Please make sure .env.local is configured correctly', 'yellow');
    process.exit(1);
  }

  // Remove sslmode parameter and set it manually
  const cleanConnectionString = connectionString.replace('?sslmode=require', '');

  const pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    log('\n🚀 Starting database migration...', 'cyan');
    log(`📍 Database: ${cleanConnectionString.split('@')[1]?.split('?')[0] || 'unknown'}`, 'blue');

    // Test connection
    await pool.query('SELECT NOW()');
    log('✅ Database connection successful', 'green');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    log(`\n📖 Reading schema from: ${schemaPath}`, 'blue');

    if (!fs.existsSync(schemaPath)) {
      throw new Error('schema.sql file not found');
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    log('⚙️  Executing schema...', 'yellow');
    await pool.query(schema);

    log('\n✅ Migration completed successfully!', 'green');

    // Show table summary
    log('\n📊 Database tables:', 'cyan');
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    tables.rows.forEach(row => {
      log(`  ✓ ${row.table_name}`, 'green');
    });

    // Show row counts
    log('\n📈 Row counts:', 'cyan');
    const tableCounts = [
      'users',
      'event_data',
      'cabins',
      'cabin_votes',
      'games',
      'game_votes',
      'messages'
    ];

    for (const table of tableCounts) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result.rows[0].count;
        log(`  ${table}: ${count} rows`, count > 0 ? 'green' : 'yellow');
      } catch (err) {
        // Table might not exist yet
      }
    }

    log('\n🎉 All done!', 'green');

  } catch (error) {
    log('\n❌ Migration failed:', 'red');
    log(error.message, 'red');
    if (error.stack) {
      log('\nStack trace:', 'yellow');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
migrate();
