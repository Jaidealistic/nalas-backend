const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'magilam_foods',
  user: 'postgres',
  password: 'jaino1.*'
});

async function main() {
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema='public' ORDER BY table_name
  `);
  console.log('Tables:', tables.rows.map(x => x.table_name).join(', '));

  for (const {table_name} of tables.rows) {
    try {
      const count = await pool.query(`SELECT COUNT(*) FROM ${table_name}`);
      console.log(`  ${table_name}: ${count.rows[0].count} rows`);
    } catch(e) {
      console.log(`  ${table_name}: ERROR - ${e.message}`);
    }
  }
}

main().catch(console.error).finally(() => pool.end());
