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
    gatingSeconds: {
        type: Number,
        default: 120
    },
    gatingEnabled: {
        type: Boolean,
        default: true
    },
    downloadableFiles: [
        {
            name: { type: String, required: true },
            url: { type: String, required: true },
            filename: { type: String }
        }
    ],
    whatsappUrl: {
        type: String,
        default: 'https://chat.whatsapp.com/GDoaMdEN5m5GhogIL7TGhy?s=cl&p=i&ilr=4',
        trim: true
    },
    extraVideoUrl1: {
        type: String,
        default: '',
        trim: true
    },
    extraVideoTitle1: {
        type: String,
        default: 'Clase Extra 1',
        trim: true
    },
    extraVideoUrl2: {
        type: String,
        default: '',
        trim: true
    },
    extraVideoTitle2: {
        type: String,
        default: 'Clase Extra 2',
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.models.ComunidadConfig || mongoose.model('ComunidadConfig', ComunidadConfigSchema);
