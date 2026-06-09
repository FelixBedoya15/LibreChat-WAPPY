const mongoose = require('mongoose');

const ComunidadSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    durationSeconds: {
        type: Number,
        default: 0
    },
    clicks: {
        playVideo: { type: Number, default: 0 },
        quickAccess: { type: Number, default: 0 },
        checkoutSubmit: { type: Number, default: 0 },
        downloadFile: { type: Number, default: 0 },
        recoverAccess: { type: Number, default: 0 },
        whatsapp: { type: Number, default: 0 }
    },
    funnelKey: {
        type: String,
        default: 'comunidad',
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.models.ComunidadSession || mongoose.model('ComunidadSession', ComunidadSessionSchema);
