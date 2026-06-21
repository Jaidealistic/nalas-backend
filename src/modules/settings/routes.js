const express = require('express');
const settingsController = require('./controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');

const router = express.Router();

// Get all settings (admin only)
router.get(
  '/',
  authenticate,
  requireRole('admin', 'super_admin'),
  settingsController.getAllSettings
);

// Get a specific setting by key (admin only)
router.get(
  '/:key',
  authenticate,
  requireRole('admin', 'super_admin'),
  settingsController.getSetting
);

// Update a specific setting (super_admin only)
router.put(
  '/:key',
  authenticate,
  requireRole('admin', 'super_admin'),
  settingsController.updateSetting
);

module.exports = router;
