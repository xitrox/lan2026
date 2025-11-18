#!/usr/bin/env node
/**
 * Make a user admin
 * Usage: node make-admin.js <username>
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const username = process.argv[2];

if (!username) {
  console.log('Usage: node make-admin.js <username>');
  console.log('Example: node make-admin.js john');
  process.exit(1);
}

async function makeAdmin() {
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
    // Check if user exists
    const checkResult = await pool.query(
      'SELECT id, username, email, is_admin FROM users WHERE username = $1',
      [username]
    );

    if (checkResult.rows.length === 0) {
      console.log(`❌ User "${username}" not found`);
      console.log('\nAvailable users:');
      const allUsers = await pool.query('SELECT username, is_admin FROM users ORDER BY created_at');
      allUsers.rows.forEach(u => {
        console.log(`  - ${u.username} ${u.is_admin ? '(already admin)' : ''}`);
      });
      await pool.end();
      process.exit(1);
    }

    const user = checkResult.rows[0];

    if (user.is_admin) {
      console.log(`ℹ️  User "${username}" is already an admin!`);
      await pool.end();
      return;
    }

    // Make admin
    await pool.query(
      'UPDATE users SET is_admin = true WHERE id = $1',
      [user.id]
    );

    console.log(`✅ User "${username}" is now an admin!`);
    console.log(`   Email: ${user.email}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

makeAdmin();
