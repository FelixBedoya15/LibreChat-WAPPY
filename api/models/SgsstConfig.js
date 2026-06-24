const mongoose = require('mongoose');

const SgsstConfigSchema = new mongoose.Schema({
    // Only one central config document for SGSST global settings
    isGlobalSetting: {
        type: Boolean,
        default: true,
        unique: true
    },
    disabledApps: {
        type: [String],
        default: [],
    },
    lastNotificationRun: {
        type: Date,
        default: null
    },
});

module.exports = mongoose.models.SgsstConfig || mongoose.model('SgsstConfig', SgsstConfigSchema);
