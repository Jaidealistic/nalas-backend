const db = require('../config/database');
const logger = require('./logger');

class TokenPurger {
  /**
   * Remove expired refresh tokens and old blacklisted tokens.
   * This prevents the database from bloating over time.
   */
  async purge() {
    console.log('--- STARTING TOKEN PURGE ---');
    
    try {
      // 1. Delete Refresh Tokens that have already expired
      const res1 = await db.query(
        'DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP'
      );
      if (res1.rowCount > 0) {
        logger.info(`Purged ${res1.rowCount} expired refresh tokens.`);
      }

      // 2. Delete Blacklisted Tokens that have expired
      // (Once they are expired, the middleware won't care about them anyway)
      const res2 = await db.query(
        'DELETE FROM blacklisted_tokens WHERE expires_at < CURRENT_TIMESTAMP'
      );
      if (res2.rowCount > 0) {
        logger.info(`Purged ${res2.rowCount} expired blacklisted tokens.`);
      }

      console.log('✅ Token purge completed successfully.');
    } catch (error) {
      logger.error('Failed to purge tokens:', error.message);
      throw error;
    }
  }
}

module.exports = new TokenPurger();
