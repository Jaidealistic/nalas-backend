require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query("SELECT * FROM menu_items WHERE name ILIKE '%Biry%'");
    console.log("Menu items found:", res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
