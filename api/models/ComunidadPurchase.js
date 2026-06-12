const mongoose = require('mongoose');

const ComunidadPurchaseSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        trim: true
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    videoWatched: {
        type: Boolean,
        default: false
    },
    wompiReference: {
        type: String,
        unique: true,
        sparse: true
    },
    amountInCents: {
        type: Number
    },
    status: {
        type: String,
        default: 'PENDING',
        enum: ['PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR']
    },
    purchaseTracked: {
        type: Boolean,
        default: false
    },
    funnelKey: {
        type: String,
        default: 'comunidad',
        trim: true
    }
}, { timestamps: true });

ComunidadPurchaseSchema.index({ email: 1, funnelKey: 1, isPaid: 1 });

module.exports = mongoose.models.ComunidadPurchase || mongoose.model('ComunidadPurchase', ComunidadPurchaseSchema);
