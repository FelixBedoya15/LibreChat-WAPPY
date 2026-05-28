const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // e.g., 'maria-marketing'
    type: { type: String, enum: ['partner', 'embajador'], default: 'partner' }, // Wappy Partner (20%) vs. Wappy Embajador (30%)
    commissionRate: { type: Number, default: 0.20 }, // 0.20 for partner, 0.30 for embajador
    active: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }, // approved by default for backward compatibility
    paymentDetails: { type: String, default: '' }, // Bank account info or transfer method
    supportContact: { type: String, default: '' } // Customer support channel (WhatsApp, email, telegram, etc.)
}, { timestamps: true });

const Partner = mongoose.models.Partner || mongoose.model('Partner', partnerSchema);
module.exports = Partner;

