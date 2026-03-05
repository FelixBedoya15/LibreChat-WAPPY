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
            enum: ['free', 'go', 'plus', 'pro', 'admin'],
            default: 'free',
        },
        stripeCustomerId: { type: String, default: null },
        stripeSubscriptionId: { type: String, default: null },
        stripePriceId: { type: String, default: null },
        nequiPhoneNumber: { type: String, default: null },
        nequiToken: { type: String, default: null },
        planExpiresAt: { type: Date, default: null },
        cancelAtPeriodEnd: { type: Boolean, default: false },
    },
    { timestamps: true },
);

const UserPlan = mongoose.model('UserPlan', UserPlanSchema);

module.exports = UserPlan;
