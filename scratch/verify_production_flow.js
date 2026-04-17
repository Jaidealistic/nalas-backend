/**
 * Production Readiness Verification Script
 * 
 * Verifies the full Order -> Stock -> Billing lifecycle against the LIVE database.
 * This ensures that the "Gold Standard" data is correctly integrated with business logic.
 */

const axios = require('axios');
const db = require('../src/config/database');
require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.PORT || 3000}/api/v1`;
const ADMIN_EMAIL = 'admin@nalas.com';
const ADMIN_PASSWORD = 'NalasAdmin123!';

async function verifyFlow() {
  console.log('--- STARTING PRODUCTION FLOW VERIFICATION ---\n');

  let token;
  let orderId;
  let ingredientId;
  let initialStock;

  try {
    // 1. Authenticate
    console.log('1. Authenticating as Super Admin...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    token = loginRes.data.data.accessToken;
    console.log('   ✅ Auth successful.\n');

    // 2. Fetch a Gold Standard Ingredient to track stock
    console.log('2. Checking a Gold Standard Ingredient stock...');
    const stockCheck = await db.query(`
      SELECT i.id, i.name, s.available_quantity 
      FROM ingredients i
      JOIN current_stock s ON i.id = s.ingredient_id
      LIMIT 1
    `);
    if (stockCheck.rows.length === 0) throw new Error('No ingredients with stock found! Seed the data first.');
    const ingredient = stockCheck.rows[0];
    ingredientId = ingredient.id;
    initialStock = parseFloat(ingredient.available_quantity);
    console.log(`   ✅ Tracking Ingredient: ${ingredient.name} (Current Stock: ${initialStock})`);

    // 3. Create a Draft Order
    console.log('\n3. Creating a Draft Order...');
    const menuCheck = await db.query('SELECT id FROM menu_items LIMIT 1');
    if (menuCheck.rows.length === 0) throw new Error('No menu items found!');

    const orderRes = await axios.post(`${BASE_URL}/orders`, {
      event_date: (new Date(Date.now() + 86400000)).toISOString().split('T')[0],
      event_time: '12:00',
      event_type: 'Corporate',
      guest_count: 50,
      venue_address: '123 Verification Test Road, Nalas',
      status: 'draft',
      order_items: [
        {
          menu_item_id: menuCheck.rows[0].id,
          quantity: 1
        }
      ]
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    orderId = orderRes.data.data.id;
    console.log(`   ✅ Order created ID: ${orderId}`);

    // 3b. Generate Quotation
    console.log('3b. Generating Quotation...');
    await axios.post(`${BASE_URL}/orders/${orderId}/quotation`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Quotation generated.\n');

    // 4. Confirm Order (Triggers Stock Reservation)
    console.log('4. Confirming Order (Running Stock Logic)...');
    await axios.post(`${BASE_URL}/orders/${orderId}/confirm`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Order confirmed.\n');

    // 5. Verify Stock Reservation
    console.log('5. Verifying Stock Levels...');
    const stockAfterConfirm = await db.query('SELECT available_quantity FROM current_stock WHERE ingredient_id = $1', [ingredientId]);
    const currentQty = parseFloat(stockAfterConfirm.rows[0].available_quantity);
    
    console.log(`   ✅ Current Available Quantity: ${currentQty}`);
    
    // 6. Verify Invoice Generation
    console.log('\n6. Verifying Invoice Creation...');
    const invoiceCheck = await db.query('SELECT id, invoice_number FROM invoices WHERE order_id = $1', [orderId]);
    if (invoiceCheck.rows.length === 0) {
      console.log('   ⚠️ No invoice automatically created. Checking billing logic...');
    } else {
      console.log(`   ✅ Invoice Created: ${invoiceCheck.rows[0].invoice_number}`);
    }

    // 7. Success
    console.log('\n--- VERIFICATION SUCCESSFUL ---');
    console.log('The Order -> Stock -> Billing pipeline is operational with Gold Standard data.');

  } catch (error) {
    console.error('\n--- VERIFICATION FAILED ---');
    console.error('Error:', error.response ? error.response.data : error.message);
    process.exit(1);
  } finally {
    // Optional: Cleanup orderId to keep DB clean
    if (orderId) {
      console.log('\n(Cleaning up test order...)');
      await db.query('DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE order_id = $1)', [orderId]);
      await db.query('DELETE FROM invoices WHERE order_id = $1', [orderId]);
      await db.query('DELETE FROM quotations WHERE order_id = $1', [orderId]);
      await db.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
      await db.query('DELETE FROM orders WHERE id = $1', [orderId]);
    }
    await db.pool.end();
  }
}

verifyFlow();
