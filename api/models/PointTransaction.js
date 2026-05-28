const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    points: { type: Number, required: true }, // Positive for earning, negative for redemption
    type: { type: String, enum: ['referral_signup', 'referral_purchase', 'redemption', 'admin_adjustment'], required: true },
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const PointTransaction = mongoose.models.PointTransaction || mongoose.model('PointTransaction', pointTransactionSchema);
module.exports = PointTransaction;
