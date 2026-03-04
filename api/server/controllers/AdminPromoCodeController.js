const PromoCode = require('../../models/PromoCode');
// Wompi does not require coupon pre-creation in their database,
// we just validate it against our own MongoDB record.

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
        if (!code || !discountPercentage) {
            return res.status(400).json({ error: 'Faltan parámetros' });
        }

        // Check if exists locally first
        const existing = await PromoCode.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({ error: 'El código promocional ya existe en la base de datos' });
        }

        const newPromoCode = new PromoCode({
            code: code.toUpperCase(),
            discountPercentage,
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
