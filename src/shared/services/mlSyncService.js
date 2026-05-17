/**
 * ML Sync Service
 *
 * Automatically syncs the live Supabase database (ingredients, menu items,
 * and recipe mappings) to the ML Engine's CSV files every night at 2:00 AM IST.
 *
 * This ensures that as the client fills in recipe quantities through the Admin
 * Dashboard during the day, the ML Engine picks up all changes by next morning
 * without any manual intervention.
 */

const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const db = require('../../database/connection');
const logger = require('../utils/logger');

// Path to the ML Engine's structured data directory
const ML_DATA_DIR = path.join(__dirname, '../../../../Nalas_ML_Team_Clone/data/structured');

async function runSync() {
  logger.info('[ML Sync] Starting scheduled sync from Supabase → ML CSVs...');

  try {
    // 1. Ingredients → ingredients_master.csv
    const ingRes = await db.query('SELECT * FROM ingredients ORDER BY name');
    let ingCsv = 'ingredient_id,ingredient_name,category,unit,price_per_unit,is_perishable,last_updated\n';
    ingRes.rows.forEach(row => {
      ingCsv += `${row.id},"${(row.name || '').replace(/"/g, '""')}","${row.category || 'Uncategorized'}",${row.unit},${row.current_price_per_unit},${row.is_perishable},${new Date(row.updated_at || Date.now()).toISOString().slice(0, 10)}\n`;
    });
    fs.writeFileSync(path.join(ML_DATA_DIR, 'ingredients_master.csv'), ingCsv);
    logger.info(`[ML Sync] ✅ Synced ${ingRes.rows.length} ingredients`);

    // 2. Menu Items → menu_items.csv
    const menuRes = await db.query('SELECT * FROM menu_items ORDER BY name');
    let menuCsv = 'item_id,item_name,category,base_unit,source\n';
    menuRes.rows.forEach(row => {
      menuCsv += `${row.id},"${(row.name || '').replace(/"/g, '""')}","${row.category_id || 'Uncategorized'}",1 portion,live_db\n`;
    });
    fs.writeFileSync(path.join(ML_DATA_DIR, 'menu_items.csv'), menuCsv);
    logger.info(`[ML Sync] ✅ Synced ${menuRes.rows.length} menu items`);

    // 3. Recipes → recipes.csv (only rows with qty > 0 are useful for ML)
    const rcpRes = await db.query('SELECT * FROM recipes');
    let rcpCsv = 'recipe_id,menu_item_id,ingredient_id,quantity_per_base_unit,wastage_factor\n';
    rcpRes.rows.forEach(row => {
      rcpCsv += `${row.id},${row.menu_item_id},${row.ingredient_id},${row.quantity_per_base_unit},${row.wastage_factor}\n`;
    });
    fs.writeFileSync(path.join(ML_DATA_DIR, 'recipes.csv'), rcpCsv);

    const mappedCount = rcpRes.rows.filter(r => parseFloat(r.quantity_per_base_unit) > 0).length;
    logger.info(`[ML Sync] ✅ Synced ${rcpRes.rows.length} recipe rows (${mappedCount} with quantities > 0)`);

    logger.info('[ML Sync] 🎉 Sync complete. ML CSVs are up to date.');
  } catch (err) {
    logger.error('[ML Sync] ❌ Sync failed:', err.message);
  }
}

function startMlSyncScheduler() {
  // Verify ML data directory exists
  if (!fs.existsSync(ML_DATA_DIR)) {
    logger.warn(`[ML Sync] ⚠️  ML data directory not found at: ${ML_DATA_DIR}. Cron job will not start.`);
    return;
  }

  // Schedule: every day at 2:00 AM IST (UTC+5:30 → 20:30 UTC previous day)
  // Cron: '30 20 * * *' = 20:30 UTC = 02:00 IST
  cron.schedule('30 20 * * *', async () => {
    logger.info('[ML Sync] ⏰ Nightly ML sync triggered (2:00 AM IST)');
    await runSync();
  }, {
    timezone: 'UTC'
  });

  logger.info('[ML Sync] 🕐 Nightly ML sync scheduler started. Will run daily at 2:00 AM IST.');

  // Also run once immediately at startup to ensure CSVs are fresh
  runSync();
}

module.exports = { startMlSyncScheduler, runSync };
