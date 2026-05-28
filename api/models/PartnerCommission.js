const mongoose = require('mongoose');

const partnerCommissionSchema = new mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
    referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: { type: String, required: true }, // Wompi transactionId or Stripe charge ID
    amount: { type: Number, required: true }, // Gross transaction amount in cents or COP
    commissionRate: { type: Number, required: true }, // e.g. 0.20
    commissionAmount: { type: Number, required: true }, // Calculated net payout amount
    status: { type: String, enum: ['pending', 'approved', 'paid', 'cancelled'], default: 'pending', index: true },
    payoutDate: { type: Date, default: null }
}, { timestamps: true });

const PartnerCommission = mongoose.models.PartnerCommission || mongoose.model('PartnerCommission', partnerCommissionSchema);
module.exports = PartnerCommission;
