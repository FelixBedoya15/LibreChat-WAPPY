const mongoose = require('mongoose');

const wompiTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: String, required: true },
    interval: { type: String, required: true },
    reference: { type: String, required: true, unique: true },
    amountInCents: { type: Number, required: true },
    status: { type: String, default: 'PENDING' },
    transactionId: { type: String }, // Provided by Wompi upon webhook/success
    paymentMethod: { type: String, enum: ['WOMPI', 'NEQUI_QR'], default: 'WOMPI' },
    receiptUrl: { type: String }, // URL array or string for manual payment receipts
    customTools: { type: [String], default: [] }, // Tools selected for custom plan
}, { timestamps: true });

const WompiTransaction = mongoose.models.WompiTransaction || mongoose.model('WompiTransaction', wompiTransactionSchema);
module.exports = WompiTransaction;
