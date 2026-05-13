const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

// Supabase SSL req
if (!process.env.DATABASE_URL && process.env.DB_HOST !== 'localhost') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

const ML_DATA_DIR = path.join(__dirname, '../../Nalas_ML_Team_Clone/data/structured');

async function syncToCSV() {
  console.log('--- SYNCING POSTGRES LIVE DB TO ML SERVICE CSVs ---');

  try {
    // 1. Ingredients -> ingredients_master.csv
    console.log('Fetching Ingredients...');
    const ingRes = await pool.query('SELECT * FROM ingredients');
    let ingCsv = 'ingredient_id,ingredient_name,category,unit,price_per_unit,is_perishable,last_updated\n';
    ingRes.rows.forEach(row => {
      ingCsv += `${row.id},"${row.name.replace(/"/g, '""')}","${row.category || 'Uncategorized'}",${row.unit},${row.current_price_per_unit},${row.is_perishable},${new Date(row.updated_at).toISOString().slice(0,10)}\n`;
    });
    fs.writeFileSync(path.join(ML_DATA_DIR, 'ingredients_master.csv'), ingCsv);

    // 2. Menu Items -> menu_items.csv
    console.log('Fetching Menu Items...');
    const menuRes = await pool.query('SELECT * FROM menu_items');
    let menuCsv = 'item_id,item_name,category,base_unit,source\n';
    menuRes.rows.forEach(row => {
      menuCsv += `${row.id},"${row.name.replace(/"/g, '""')}","${row.category_id || 'Uncategorized'}",1 portion,live_db\n`;
    });
    fs.writeFileSync(path.join(ML_DATA_DIR, 'menu_items.csv'), menuCsv);

    // 3. Recipes -> recipes.csv
    console.log('Fetching Recipes...');
    const rcpRes = await pool.query('SELECT * FROM recipes');
    let rcpCsv = 'recipe_id,menu_item_id,ingredient_id,quantity_per_base_unit,wastage_factor\n';
    rcpRes.rows.forEach(row => {
      rcpCsv += `${row.id},${row.menu_item_id},${row.ingredient_id},${row.quantity_per_base_unit},${row.wastage_factor}\n`;
    });
    fs.writeFileSync(path.join(ML_DATA_DIR, 'recipes.csv'), rcpCsv);

    console.log('✅ Sync Complete! The ML CSVs have been updated.');
  } catch (err) {
    console.error('Error syncing:', err);
  } finally {
    pool.end();
  }
}

syncToCSV();
