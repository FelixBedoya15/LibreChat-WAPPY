const mongoose = require('mongoose');

const marketplaceCouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true, min: 0 }, // e.g. 15 for 15% or 50000 for $50.000 COP
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number },
  expiresAt: { type: Date },
  maxUses: { type: Number, default: 0 }, // 0 = unlimited
  usedCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const MarketplaceCoupon = mongoose.models.MarketplaceCoupon || mongoose.model('MarketplaceCoupon', marketplaceCouponSchema);
module.exports = MarketplaceCoupon;
