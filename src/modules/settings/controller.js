const settingsService = require('./service');

class SettingsController {
  async getSetting(req, res, next) {
    try {
      const result = await settingsService.getSetting(req.params.key);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getAllSettings(req, res, next) {
    try {
      const result = await settingsService.getAllSettings();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateSetting(req, res, next) {
    try {
      const result = await settingsService.updateSetting(req.params.key, req.body);
      res.json({
        success: true,
        message: 'Setting updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SettingsController();
