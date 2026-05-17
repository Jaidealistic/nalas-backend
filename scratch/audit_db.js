require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const ingCount = await pool.query("SELECT COUNT(*) FROM ingredients");
    const menuCount = await pool.query("SELECT COUNT(*) FROM menu_items");
    const recipeCount = await pool.query("SELECT COUNT(*) FROM recipes");

    console.log("📦 Ingredients in DB:", ingCount.rows[0].count);
    console.log("🍽️  Menu Items in DB:", menuCount.rows[0].count);
    console.log("📋 Recipe Mappings in DB:", recipeCount.rows[0].count);

    console.log("\n--- All Menu Items ---");
    const menuItems = await pool.query("SELECT id, name FROM menu_items ORDER BY name");
    menuItems.rows.forEach(r => console.log(`  ${r.name} (${r.id})`));

    console.log("\n--- All Recipe Mappings (with names) ---");
    const recipes = await pool.query(`
      SELECT m.name as menu_item, i.name as ingredient, r.quantity_per_base_unit
      FROM recipes r
      JOIN menu_items m ON r.menu_item_id = m.id
      JOIN ingredients i ON r.ingredient_id = i.id
      ORDER BY m.name
    `);
    if (recipes.rows.length === 0) {
      console.log("  ⚠️  No recipe mappings found!");
    } else {
      console.table(recipes.rows);
    }
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
check();
