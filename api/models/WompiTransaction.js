const mongoose = require('mongoose');

const wompiTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: String, required: true },
    interval: { type: String, required: true },
    reference: { type: String, required: true, unique: true },
    amountInCents: { type: Number, required: true },
    status: { type: String, default: 'PENDING' },
    transactionId: { type: String }, // Provided by Wompi upon webhook/success
}, { timestamps: true });

const WompiTransaction = mongoose.models.WompiTransaction || mongoose.model('WompiTransaction', wompiTransactionSchema);
module.exports = WompiTransaction;
