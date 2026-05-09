const mongoose = require('mongoose');

/**
 * UserPlan — stores Stripe subscription data alongside the LibreChat user.
 * We keep this separate from the @librechat/data-schemas User model
 * so we don't need to patch that package.
 */
const UserPlanSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        plan: {
            type: String,
            enum: ['free', 'go', 'plus', 'pro', 'admin', 'custom'],
            default: 'free',
        },
        stripeCustomerId: { type: String, default: null },
        stripeSubscriptionId: { type: String, default: null },
        stripePriceId: { type: String, default: null },
        planExpiresAt: { type: Date, default: null },
        cancelAtPeriodEnd: { type: Boolean, default: false },
        // Custom plan fields
        customTools: {
            type: [String], // e.g. ['blog', 'somos_sst', 'editor_archivos', 'analisis_vivo']
            default: [],
        },
        customInterval: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'semiannual', 'annual', null],
            default: null,
        },
    },
    { timestamps: true },
);

const UserPlan = mongoose.model('UserPlan', UserPlanSchema);

module.exports = UserPlan;
