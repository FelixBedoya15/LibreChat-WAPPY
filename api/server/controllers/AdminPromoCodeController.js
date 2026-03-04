const PromoCode = require('../../models/PromoCode');
let stripe;

const initStripe = () => {
    if (!stripe && process.env.STRIPE_SECRET_KEY) {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    }
    return stripe;
};

const getPromoCodes = async (req, res) => {
    try {
        const codes = await PromoCode.find().sort({ createdAt: -1 });
        res.json(codes);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching promo codes' });
    }
};

const createPromoCode = async (req, res) => {
    try {
        const { code, discountPercentage } = req.body;
        const s = initStripe();

        if (!s) {
            return res.status(500).json({ error: 'Stripe no está configurado (STRIPE_SECRET_KEY)' });
        }

        // Check if exists locally first
        const existing = await PromoCode.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({ error: 'El código promocional ya existe en la base de datos' });
        }

        // Create coupon in Stripe
        let stripeCoupon;
        try {
            stripeCoupon = await s.coupons.create({
                percent_off: discountPercentage,
                duration: 'forever',
                name: code.toUpperCase()
            });
        } catch (stripeErr) {
            console.error('Stripe Coupon Creation Error:', stripeErr);
            return res.status(400).json({ error: 'Error registrando cupón en Stripe: ' + stripeErr.message });
        }

        const newPromoCode = new PromoCode({
            code: code.toUpperCase(),
            discountPercentage,
            stripeCouponId: stripeCoupon.id,
            active: true
        });

        await newPromoCode.save();
        res.json(newPromoCode);
    } catch (error) {
        console.error('Create PromoCode Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deletePromoCode = async (req, res) => {
    try {
        const promo = await PromoCode.findById(req.params.id);
        if (!promo) return res.status(404).json({ error: 'Not found' });

        const s = initStripe();
        if (s && promo.stripeCouponId) {
            try {
                // Delete from stripe
                await s.coupons.del(promo.stripeCouponId);
            } catch (stripeErr) {
                console.warn('Could not delete from Stripe (might be deleted already)', stripeErr.message);
            }
        }

        await PromoCode.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting promo code' });
    }
};

const togglePromoCode = async (req, res) => {
    try {
        const promo = await PromoCode.findById(req.params.id);
        if (!promo) return res.status(404).json({ error: 'Not found' });

        promo.active = !promo.active;
        await promo.save();

        res.json(promo);
    } catch (error) {
        res.status(500).json({ error: 'Error toggling promo code' });
    }
};

module.exports = {
    getPromoCodes,
    createPromoCode,
    deletePromoCode,
    togglePromoCode
};
