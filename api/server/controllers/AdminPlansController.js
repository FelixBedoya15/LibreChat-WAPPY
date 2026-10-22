const Plan = require('~/models/Plan');

// Default visibility config (all sections visible by default except we hide free/go/plus/enterprise/app/custom to show only Pro)
const DEFAULT_VISIBILITY = {
    showPlanFree: false,
    showPlanGo: false,
    showPlanPlus: false,
    showPlanPro: true,
    showSectionAppPlans: true,
    showSectionCustomPlan: false,
    showSectionEnterprise: false,
};

const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find().lean();

        // Si no existen, podríamos inicializarlos
        if (!plans || plans.length === 0) {
            const defaultPlans = [
                { planId: 'go', name: 'Go', prices: { monthly: 49200, quarterly: 147500, semiannual: 295000, annual: 590000 } },
                { planId: 'plus', name: 'Plus', prices: { monthly: 57800, quarterly: 173500, semiannual: 347000, annual: 694000 } },
                { planId: 'pro', name: 'Pro', prices: { monthly: 66300, quarterly: 199000, semiannual: 399000, annual: 796000 } },
                { planId: 'ipevar', name: 'Wappy Vital', prices: { monthly: 35000, quarterly: 99000, semiannual: 185000, annual: 350000, lifetime: 100000 } },
            ];
            await Plan.insertMany(defaultPlans);
            const newPlans = await Plan.find().lean();
            return res.status(200).json(newPlans);
        }

        const ipevarDoc = plans.find(p => p.planId === 'ipevar');
        if (!ipevarDoc) {
            await Plan.create({ planId: 'ipevar', name: 'Wappy Vital', prices: { monthly: 35000, quarterly: 99000, semiannual: 185000, annual: 350000, lifetime: 100000 }, stripePriceIds: { lifetime: 'vital_multi_interval_v1' } });
            const newPlans = await Plan.find().lean();
            return res.status(200).json(newPlans);
        } else if (
            !ipevarDoc.prices?.monthly &&
            !ipevarDoc.prices?.quarterly &&
            !ipevarDoc.prices?.semiannual &&
            ipevarDoc.stripePriceIds?.lifetime !== 'vital_multi_interval_v1'
        ) {
            const annualBase = ipevarDoc.prices?.annual || 350000;
            const seededPrices = {
                monthly: 35000,
                quarterly: 99000,
                semiannual: 185000,
                annual: annualBase,
                lifetime: ipevarDoc.prices?.lifetime || 100000,
            };
            await Plan.updateOne(
                { planId: 'ipevar' },
                {
                    $set: {
                        name: 'Wappy Vital',
                        prices: seededPrices,
                        'stripePriceIds.lifetime': 'vital_multi_interval_v1',
                    },
                }
            );
            ipevarDoc.name = 'Wappy Vital';
            ipevarDoc.prices = seededPrices;
        }

        // Ensure all plans (especially ipevar) have normalized interval structures for admin & /planes
        const normalizedPlans = plans.map((p) => {
            if (p.planId === 'ipevar') {
                return {
                    ...p,
                    prices: {
                        monthly: p.prices?.monthly ?? 0,
                        quarterly: p.prices?.quarterly ?? 0,
                        semiannual: p.prices?.semiannual ?? 0,
                        annual: p.prices?.annual ?? p.prices?.lifetime ?? 350000,
                        lifetime: p.prices?.lifetime ?? 100000,
                    },
                    stripePriceIds: {
                        monthly: p.stripePriceIds?.monthly ?? '',
                        quarterly: p.stripePriceIds?.quarterly ?? '',
                        semiannual: p.stripePriceIds?.semiannual ?? '',
                        annual: p.stripePriceIds?.annual ?? '',
                        lifetime: p.stripePriceIds?.lifetime ?? '',
                    },
                    promotions: {
                        monthly: p.promotions?.monthly ?? { active: false, text: '', discountPercentage: 0 },
                        quarterly: p.promotions?.quarterly ?? { active: false, text: '', discountPercentage: 0 },
                        semiannual: p.promotions?.semiannual ?? { active: false, text: '', discountPercentage: 0 },
                        annual: p.promotions?.annual ?? { active: false, text: '', discountPercentage: 0 },
                        lifetime: p.promotions?.lifetime ?? { active: false, text: '', discountPercentage: 0 },
                    },
                };
            }
            return p;
        });

        res.status(200).json(normalizedPlans);
    } catch (error) {
        console.error('Error in getPlans:', error);
        res.status(500).json({ message: 'Error fetching plans' });
    }
};

const updatePlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const updateData = req.body;

        const updatedPlan = await Plan.findOneAndUpdate(
            { planId },
            { $set: updateData },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedPlan);
    } catch (error) {
        console.error('Error in updatePlan:', error);
        res.status(500).json({ message: 'Error updating plan' });
    }
};

/**
 * GET /api/admin/plans/visibility
 * Returns the plan page visibility settings
 */
const getVisibilitySettings = async (req, res) => {
    try {
        const doc = await Plan.findOne({ planId: '__visibility__' }).lean();
        const settings = doc?.visibility || DEFAULT_VISIBILITY;
        res.status(200).json(settings);
    } catch (error) {
        console.error('Error in getVisibilitySettings:', error);
        res.status(500).json({ message: 'Error fetching visibility settings' });
    }
};

/**
 * PUT /api/admin/plans/visibility
 * Updates the plan page visibility settings
 */
const updateVisibilitySettings = async (req, res) => {
    try {
        const visibility = req.body;
        await Plan.findOneAndUpdate(
            { planId: '__visibility__' },
            { $set: { planId: '__visibility__', name: '__visibility__', visibility } },
            { upsert: true, new: true }
        );
        res.status(200).json({ success: true, visibility });
    } catch (error) {
        console.error('Error in updateVisibilitySettings:', error);
        res.status(500).json({ message: 'Error updating visibility settings' });
    }
};

module.exports = {
    getPlans,
    updatePlan,
    getVisibilitySettings,
    updateVisibilitySettings,
};
