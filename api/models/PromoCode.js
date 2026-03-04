const mongoose = require('mongoose');

const promoCodeSchema = mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    active: {
        type: Boolean,
        default: true
    },
    stripeCouponId: {
        type: String,
        required: false
    }
}, { timestamps: true });

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

module.exports = PromoCode;
