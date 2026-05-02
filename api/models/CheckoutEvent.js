const mongoose = require('mongoose');

const CheckoutEventSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, index: true },
        event: {
            type: String,
            required: true,
            enum: ['page_view', 'plan_selected', 'payment_started', 'payment_approved', 'payment_failed', 'payment_cancelled'],
            index: true,
        },
        planId: { type: String, default: null },
        interval: { type: String, default: null },
        amountInCents: { type: Number, default: 0 },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        email: { type: String, default: null },
        ip: { type: String, default: null },
        userAgent: { type: String, default: null },
    },
    { timestamps: true }
);

// TTL: keep raw events for 1 year
CheckoutEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('CheckoutEvent', CheckoutEventSchema);
