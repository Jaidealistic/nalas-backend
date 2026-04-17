const db = require('../src/config/database');
const logger = require('../src/shared/utils/logger');

async function backfillStockHistory() {
  console.log('--- BACKFILLING STOCK HISTORY FOR SEEDED DATA ---');
  
  try {
    // 1. Get all current stock levels
    const stocks = await db.query('SELECT ingredient_id, available_quantity FROM current_stock');
    console.log(`Processing ${stocks.rows.length} ingredients...`);

    let count = 0;
    for (const record of stocks.rows) {
      // Check if a transaction already exists for this ingredient (to avoid duplicates)
      const existing = await db.query(
        'SELECT id FROM stock_transactions WHERE ingredient_id = $1 AND transaction_type = \'purchase\' LIMIT 1',
        [record.ingredient_id]
      );

      if (existing.rows.length === 0) {
        // Insert a 'purchase' transaction for the initial 100 units
        await db.query(`
          INSERT INTO stock_transactions (
            ingredient_id, 
            transaction_type, 
            quantity, 
            notes,
            created_at
          ) VALUES ($1, 'purchase', $2, 'Initial production seeding', CURRENT_TIMESTAMP)
        `, [record.ingredient_id, record.available_quantity]);
        count++;
      }
    }

    console.log(`✅ Success: Backfilled ${count} stock transaction records.`);
  } catch (error) {
    logger.error('Backfill failed:', error.message);
  } finally {
    process.exit(0);
  }
}

backfillStockHistory();
