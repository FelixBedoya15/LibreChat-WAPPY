const mongoose = require('mongoose');

const ComunidadConfigSchema = new mongoose.Schema({
    // Central config document for Comunidad Page global settings
    isGlobalSetting: {
        type: Boolean,
        default: true,
        unique: true
    },
    videoUrl: {
        type: String,
        default: 'https://www.w3schools.com/html/mov_bbb.mp4',
        trim: true
    },
    requiresPayment: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        default: 0
    },
    downloadableFiles: [
        {
            name: { type: String, required: true },
            url: { type: String, required: true },
            filename: { type: String }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.models.ComunidadConfig || mongoose.model('ComunidadConfig', ComunidadConfigSchema);
