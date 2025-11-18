#!/usr/bin/env node
/**
 * Database Seed Script
 * Adds sample data for development/testing
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { hashPassword } = require('../lib/auth');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function seed() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    log('❌ POSTGRES_URL_NON_POOLING not found', 'red');
    process.exit(1);
  }

  const cleanConnectionString = connectionString.replace('?sslmode=require', '');

  const pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    log('\n🌱 Starting database seeding...', 'cyan');

    // Create admin user
    log('\n👤 Creating admin user...', 'yellow');
    const adminPassword = await hashPassword('admin123');

    const adminResult = await pool.query(`
      INSERT INTO users (username, email, password_hash, is_admin)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username
    `, ['admin', 'admin@lanparty.test', adminPassword, true]);

    if (adminResult.rows.length > 0) {
      log(`✅ Admin user created: ${adminResult.rows[0].username}`, 'green');
      log('   Username: admin', 'cyan');
      log('   Password: admin123', 'cyan');
    } else {
      log('ℹ️  Admin user already exists', 'yellow');
    }

    // Create test user
    log('\n👤 Creating test user...', 'yellow');
    const testPassword = await hashPassword('test123');

    const testResult = await pool.query(`
      INSERT INTO users (username, email, password_hash, is_admin)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username
    `, ['testuser', 'test@lanparty.test', testPassword, false]);

    if (testResult.rows.length > 0) {
      log(`✅ Test user created: ${testResult.rows[0].username}`, 'green');
      log('   Username: testuser', 'cyan');
      log('   Password: test123', 'cyan');
    } else {
      log('ℹ️  Test user already exists', 'yellow');
    }

    // Get user IDs for foreign keys
    const users = await pool.query('SELECT id, username FROM users ORDER BY id');
    const adminId = users.rows.find(u => u.username === 'admin')?.id;
    const testId = users.rows.find(u => u.username === 'testuser')?.id;

    if (!adminId || !testId) {
      log('⚠️  Could not find user IDs, skipping related data', 'yellow');
      return;
    }

    // Add sample cabins
    log('\n🏠 Adding sample cabins...', 'yellow');
    const cabins = [
      {
        name: 'Berghütte Alpenpanorama',
        url: 'https://example.com/cabin1',
        image_url: 'https://placehold.co/600x400/orange/white?text=Cabin+1',
        description: 'Gemütliche Hütte mit 30 Betten in den Alpen'
      },
      {
        name: 'Waldhaus Schwarzwald',
        url: 'https://example.com/cabin2',
        image_url: 'https://placehold.co/600x400/green/white?text=Cabin+2',
        description: 'Idyllisch gelegenes Waldhaus mit großem Gemeinschaftsraum'
      },
      {
        name: 'Seeblick Resort',
        url: 'https://example.com/cabin3',
        image_url: 'https://placehold.co/600x400/blue/white?text=Cabin+3',
        description: 'Moderne Unterkunft direkt am See'
      }
    ];

    for (const cabin of cabins) {
      // Check if cabin exists
      const exists = await pool.query('SELECT id FROM cabins WHERE name = $1', [cabin.name]);

      if (exists.rows.length === 0) {
        const result = await pool.query(`
          INSERT INTO cabins (name, url, image_url, description, created_by)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, name
        `, [cabin.name, cabin.url, cabin.image_url, cabin.description, adminId]);

        log(`  ✓ ${result.rows[0].name}`, 'green');
      }
    }

    // Add votes for cabins
    log('\n👍 Adding cabin votes...', 'yellow');
    const cabinIds = await pool.query('SELECT id FROM cabins ORDER BY id');
    for (const cabin of cabinIds.rows) {
      await pool.query(`
        INSERT INTO cabin_votes (user_id, cabin_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, cabin_id) DO NOTHING
      `, [adminId, cabin.id]);
    }
    log('  ✓ Votes added', 'green');

    // Add sample games
    log('\n🎮 Adding sample games...', 'yellow');
    const games = [
      'Wolfenstein: Enemy Territory',
      'Counter-Strike 1.6',
      'StarCraft II',
      'Age of Empires II',
      'Warcraft III'
    ];

    for (const game of games) {
      // Check if game exists
      const exists = await pool.query('SELECT id FROM games WHERE LOWER(name) = LOWER($1)', [game]);

      if (exists.rows.length === 0) {
        const result = await pool.query(`
          INSERT INTO games (name, created_by)
          VALUES ($1, $2)
          RETURNING id, name
        `, [game, testId]);

        log(`  ✓ ${result.rows[0].name}`, 'green');

        // Add vote from creator
        await pool.query(`
          INSERT INTO game_votes (user_id, game_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, game_id) DO NOTHING
        `, [testId, result.rows[0].id]);
      }
    }

    // Add sample messages
    log('\n💬 Adding sample messages...', 'yellow');
    const messages = [
      { user: adminId, content: 'Willkommen zur LAN Party 2026! Freue mich auf euch alle!' },
      { user: testId, content: 'Hey Leute! Wer bringt alles seinen eigenen PC mit?' },
      { user: adminId, content: 'Vergesst nicht für die Hütten abzustimmen!' }
    ];

    for (const msg of messages) {
      await pool.query(`
        INSERT INTO messages (user_id, content)
        VALUES ($1, $2)
      `, [msg.user, msg.content]);
    }
    log('  ✓ Messages added', 'green');

    // Show summary
    log('\n📊 Database summary:', 'cyan');
    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM cabins) as cabins,
        (SELECT COUNT(*) FROM cabin_votes) as cabin_votes,
        (SELECT COUNT(*) FROM games) as games,
        (SELECT COUNT(*) FROM game_votes) as game_votes,
        (SELECT COUNT(*) FROM messages) as messages
    `);

    const summary = counts.rows[0];
    log(`  Users: ${summary.users}`, 'green');
    log(`  Cabins: ${summary.cabins}`, 'green');
    log(`  Cabin votes: ${summary.cabin_votes}`, 'green');
    log(`  Games: ${summary.games}`, 'green');
    log(`  Game votes: ${summary.game_votes}`, 'green');
    log(`  Messages: ${summary.messages}`, 'green');

    log('\n🎉 Seeding completed!', 'green');

  } catch (error) {
    log('\n❌ Seeding failed:', 'red');
    log(error.message, 'red');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
