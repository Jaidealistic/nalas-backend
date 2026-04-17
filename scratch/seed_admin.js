// scratch/seed_admin.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'magilam_foods',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function run() {
  const client = await pool.connect();
  try {
    const email = 'admin@nalas.com';
    const phone = '0000000000';
    const password = 'NalasAdmin123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Checking for existing admin: ${email}...`);
    const checkRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (checkRes.rows.length > 0) {
      console.log('Admin already exists. Updating password...');
      await client.query('UPDATE users SET password_hash = $1, role = $2 WHERE email = $3', [hashedPassword, 'super_admin', email]);
    } else {
      console.log('Creating new Super Admin...');
      await client.query(`
        INSERT INTO users (email, phone, password_hash, role)
        VALUES ($1, $2, $3, $4)
      `, [email, phone, hashedPassword, 'super_admin']);
    }

    console.log('\n--- SUCCESS ---');
    console.log(`Admin Email: ${email}`);
    console.log(`Admin Password: ${password}`);
    console.log('Please change this password after your first login!');
    
  } catch (e) {
    console.error('FAILED to seed admin:', e);
  } finally {
    client.release();
    pool.end();
  }
}

run();
