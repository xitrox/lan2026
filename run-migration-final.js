// Migration runner - executes each statement separately
const { createClient } = require('@vercel/postgres');

async function runMigration() {
  console.log('🔗 Starting database migration...');
  console.log('');

  const client = createClient();
  await client.connect();

  const sql = client.sql;

  try {
    // Step 1: Add columns to users table
    console.log('Step 1: Adding notification preference columns to users table...');

    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_chat BOOLEAN DEFAULT true`;
    console.log('  ✅ notify_chat column added');

    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_games BOOLEAN DEFAULT true`;
    console.log('  ✅ notify_games column added');

    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_accommodations BOOLEAN DEFAULT true`;
    console.log('  ✅ notify_accommodations column added');

    // Step 2: Create push_subscriptions table
    console.log('');
    console.log('Step 2: Creating push_subscriptions table...');

    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, endpoint)
      )
    `;
    console.log('  ✅ push_subscriptions table created');

    // Step 3: Create indexes
    console.log('');
    console.log('Step 3: Creating indexes...');

    await sql`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id)`;
    console.log('  ✅ idx_push_subscriptions_user_id index created');

    await sql`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint)`;
    console.log('  ✅ idx_push_subscriptions_endpoint index created');

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('✅ Migration completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('Database is ready for PWA notifications! 🎉');
    console.log('');

  } catch (error) {
    await client.end();
    console.error('');
    console.error('═══════════════════════════════════════');
    console.error('❌ Migration failed!');
    console.error('═══════════════════════════════════════');
    console.error('');
    console.error('Error:', error.message);
    console.error('');

    if (error.message.includes('already exists')) {
      console.log('ℹ️  Note: This might be because the migration was already run.');
      console.log('   This is safe to ignore if the database is already migrated.');
      console.log('');
      process.exit(0);
    }

    process.exit(1);
  }
}

runMigration();
