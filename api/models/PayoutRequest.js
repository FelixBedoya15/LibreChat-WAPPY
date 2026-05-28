const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
    amount: { type: Number, required: true }, // Requested withdrawal amount in cents or COP
    status: { type: String, enum: ['pending', 'approved', 'paid', 'rejected'], default: 'pending', index: true },
    paymentDetails: { type: String, required: true }, // Bank transfer details captured at request time
    notes: { type: String, default: '' },
    commissionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PartnerCommission' }] // List of commissions consolidated in this payout
}, { timestamps: true });

const PayoutRequest = mongoose.models.PayoutRequest || mongoose.model('PayoutRequest', payoutRequestSchema);
module.exports = PayoutRequest;
