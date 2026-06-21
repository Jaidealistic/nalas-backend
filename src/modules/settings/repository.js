const db = require('../../config/database');

class SettingsRepository {
  async getSetting(key) {
    const result = await db.query(
      'SELECT key, value, updated_at FROM app_settings WHERE key = $1',
      [key]
    );
    return result.rows[0] || null;
  }

  async getAllSettings() {
    const result = await db.query(
      'SELECT key, value, updated_at FROM app_settings ORDER BY key'
    );
    return result.rows;
  }

  async upsertSetting(key, value) {
    const result = await db.query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE
         SET value = $2, updated_at = NOW()
       RETURNING key, value, updated_at`,
      [key, JSON.stringify(value)]
    );
    return result.rows[0];
  }
}

module.exports = new SettingsRepository();
