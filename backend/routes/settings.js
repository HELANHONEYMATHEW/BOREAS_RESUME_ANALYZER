const express = require('express');
const SystemSetting = require('../models/SystemSetting');
const auth = require('../middleware/auth');
const router = express.Router();

// Get maintenance status (public)
router.get('/maintenance', async (req, res) => {
  try {
    let setting = await SystemSetting.findOne();
    if (!setting) {
      setting = await SystemSetting.create({ maintenanceMode: false });
    }
    res.json({ maintenanceMode: setting.maintenanceMode });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Update maintenance status (admin only)
router.put('/maintenance', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const { maintenanceMode } = req.body;
    if (typeof maintenanceMode !== 'boolean') {
      return res.status(400).json({ msg: 'maintenanceMode must be boolean' });
    }
    let setting = await SystemSetting.findOne();
    if (!setting) {
      setting = await SystemSetting.create({ maintenanceMode });
    } else {
      setting.maintenanceMode = maintenanceMode;
      await setting.save();
    }
    res.json({ maintenanceMode: setting.maintenanceMode });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;