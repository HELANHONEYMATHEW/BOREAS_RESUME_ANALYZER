const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false }
});

module.exports = mongoose.model('SystemSetting', systemSettingSchema);