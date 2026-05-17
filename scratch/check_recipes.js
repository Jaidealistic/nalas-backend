require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query("SELECT * FROM recipes WHERE menu_item_id = '262293d8-2858-4943-8932-5395ec96982f'");
    console.log("Found recipes:", res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
