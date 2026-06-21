const AppError = require('../../shared/errors/AppError');
const settingsRepository = require('./repository');

// Keys that are allowed to be read/written via the API
const ALLOWED_KEYS = ['quotation_config', 'business_info', 'smtp_config'];

// Schemas for each key — what fields are valid (others are stripped)
const KEY_SCHEMAS = {
  quotation_config: [
    'labour_cost_per_guest',
    'lpg_cost_per_guest',
    'transport_flat',
    'leaf_cost_per_guest',
    'disposables_cost_per_guest',
    'overhead_percentage',
    'profit_percentage',
    'gst_percentage'
  ],
  business_info: [
    'business_name',
    'gstin',
    'upi_id',
    'upi_payee_name',
    'address',
    'phone',
    'email'
  ],
  smtp_config: ['host', 'port', 'user', 'pass', 'from_name']
};

class SettingsService {
  async getSetting(key) {
    if (!ALLOWED_KEYS.includes(key)) {
      throw AppError.notFound('Setting');
    }
    const row = await settingsRepository.getSetting(key);
    if (!row) throw AppError.notFound('Setting');
    return { key: row.key, value: row.value, updated_at: row.updated_at };
  }

  async getAllSettings() {
    const rows = await settingsRepository.getAllSettings();
    // Only return allowed keys, hide smtp_config.pass for security
    return rows
      .filter(r => ALLOWED_KEYS.includes(r.key))
      .map(r => {
        const value = { ...r.value };
        if (r.key === 'smtp_config') delete value.pass;
        return { key: r.key, value, updated_at: r.updated_at };
      });
  }

  async updateSetting(key, updates) {
    if (!ALLOWED_KEYS.includes(key)) {
      throw AppError.notFound('Setting');
    }

    // Merge with existing value so partial updates work
    const existing = await settingsRepository.getSetting(key);
    const currentValue = existing ? existing.value : {};
    const merged = { ...currentValue, ...updates };

    // Strip unknown fields
    const allowed = KEY_SCHEMAS[key] || [];
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(([k]) => allowed.includes(k))
    );

    const row = await settingsRepository.upsertSetting(key, cleaned);
    return { key: row.key, value: row.value, updated_at: row.updated_at };
  }
}

module.exports = new SettingsService();
