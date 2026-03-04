const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    planId: {
        type: String,
        required: true,
        unique: true, // e.g., 'go', 'plus', 'pro'
    },
    name: {
        type: String,
        required: true,
    },
    prices: {
        monthly: { type: Number, default: 0 },
        quarterly: { type: Number, default: 0 },
        semiannual: { type: Number, default: 0 },
        annual: { type: Number, default: 0 },
    },
    stripePriceIds: {
        monthly: { type: String, default: '' },
        quarterly: { type: String, default: '' },
        semiannual: { type: String, default: '' },
        annual: { type: String, default: '' },
    },
    promotions: {
        monthly: { active: { type: Boolean, default: false }, text: { type: String, default: '' }, discountPercentage: { type: Number, default: 0 } },
        quarterly: { active: { type: Boolean, default: false }, text: { type: String, default: '' }, discountPercentage: { type: Number, default: 0 } },
        semiannual: { active: { type: Boolean, default: false }, text: { type: String, default: '' }, discountPercentage: { type: Number, default: 0 } },
        annual: { active: { type: Boolean, default: false }, text: { type: String, default: '' }, discountPercentage: { type: Number, default: 0 } },
    },
    featuresText: {
        type: [String],
        default: [],
    },
}, { timestamps: true });

const Plan = mongoose.models.Plan || mongoose.model('Plan', planSchema);
module.exports = Plan;
