/**
 * Token Cleanup Script
 * Run this via Cron (e.g., daily at 3 AM) or manually to keep the DB clean.
 */
const purger = require('../src/shared/utils/tokenPurger');
const db = require('../src/config/database');

async function run() {
  try {
    await purger.purge();
  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    await db.pool.end();
  }
}

run();
