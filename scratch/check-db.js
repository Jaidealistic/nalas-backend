const { pool } = require('../src/config/database');

async function checkData() {
  try {
    const ingredients = await pool.query('SELECT count(*) FROM ingredients');
    const menuItems = await pool.query('SELECT count(*) FROM menu_items');
    const users = await pool.query('SELECT email, role FROM users');
    
    console.log('Ingredients count:', ingredients.rows[0].count);
    console.log('Menu Items count:', menuItems.rows[0].count);
    console.log('Users:', users.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

checkData();
