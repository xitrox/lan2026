// Migration runner using Vercel Postgres SDK
const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔗 Connecting to Vercel Postgres...');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_notifications.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL statements (simple split by semicolon)
    const statements = migrationContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📄 Running ${statements.length} SQL statements...`);
    console.log('');

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      try {
        await sql.query(statement);
        successCount++;
        console.log(`✅ Statement ${successCount} executed`);
      } catch (error) {
        if (error.message.includes('already exists') ||
            error.message.includes('duplicate column')) {
          skipCount++;
          console.log(`⏭️  Statement ${successCount + skipCount} skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log(`   Executed: ${successCount} statements`);
    console.log(`   Skipped: ${skipCount} statements (already existed)`);
    console.log('');
    console.log('Changes applied:');
    console.log('  ✓ Added columns to users table: notify_chat, notify_games, notify_accommodations');
    console.log('  ✓ Created push_subscriptions table');
    console.log('  ✓ Created indexes for performance');

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

runMigration();
