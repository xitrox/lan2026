// Quick migration runner using Node.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Read connection string from environment
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: No POSTGRES_URL or DATABASE_URL found in environment');
    console.log('Run: vercel env pull .env.local');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');

  // Parse connection string to handle SSL properly
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('sslmode=require') ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_notifications.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running migration: add_notifications.sql');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Changes applied:');
    console.log('  - Added columns to users table: notify_chat, notify_games, notify_accommodations');
    console.log('  - Created push_subscriptions table');
    console.log('  - Created indexes for performance');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    if (error.message.includes('already exists')) {
      console.log('');
      console.log('ℹ️  It looks like the migration was already applied.');
      console.log('This is safe to ignore if you\'ve run this before.');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('');
    console.log('🔌 Disconnected from database');
  }
}

runMigration();
