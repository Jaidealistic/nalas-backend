require('dotenv').config();
const { Pool } = require('pg');

// Uses the DATABASE_URL from your .env file
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkChickenBiryani() {
  try {
    console.log('🔍 Checking Live Supabase Database for Chicken Biryani...');
    
    // 1. Find Chicken Biryani ID
    const menuRes = await pool.query("SELECT id, name FROM menu_items WHERE name ILIKE '%Biryani%'");
    if (menuRes.rows.length === 0) {
      console.log('❌ Chicken Biryani not found in the database.');
      return;
    }
    
    const biryaniId = menuRes.rows[0].id;
    console.log(`✅ Found "${menuRes.rows[0].name}" with ID: ${biryaniId}`);
    
    // 2. Fetch the recipe mappings with their actual ingredient names
    const recipeQuery = `
      SELECT r.quantity_per_base_unit, i.name as ingredient_name
      FROM recipes r
      JOIN ingredients i ON r.ingredient_id = i.id
      WHERE r.menu_item_id = $1
    `;
    
    const recipeRes = await pool.query(recipeQuery, [biryaniId]);
    
    if (recipeRes.rows.length === 0) {
      console.log('⚠️ No ingredients mapped to Chicken Biryani yet!');
    } else {
      console.log('✅ Successfully found mapped ingredients:');
      console.table(recipeRes.rows);
    }
    
  } catch (e) {
    console.error('Error connecting to DB:', e.message);
  } finally {
    pool.end();
  }
}

checkChickenBiryani();
