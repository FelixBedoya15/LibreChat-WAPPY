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

        // Si no existen, inicializarlos con los valores oficiales
        if (!plans || plans.length === 0) {
            const defaultPlans = [
                {
                    planId: 'pro',
                    name: 'Pro',
                    prices: { monthly: 179000, quarterly: 518600, semiannual: 1005000, annual: 1790000 },
                    promotions: {
                        monthly: { active: false, text: '', discountPercentage: 0 },
                        quarterly: { active: true, text: 'Ahorra 10%', discountPercentage: 10 },
                        semiannual: { active: true, text: 'Ahorra 20%', discountPercentage: 20 },
                        annual: { active: true, text: 'Ahorra 30%', discountPercentage: 30 },
                    },
                },
                {
                    planId: 'ipevar',
                    name: 'Wappy Vital',
                    prices: { monthly: 119000, quarterly: 345000, semiannual: 669000, annual: 1190000, lifetime: 100000 },
                    promotions: {
                        monthly: { active: false, text: '', discountPercentage: 0 },
                        quarterly: { active: true, text: 'Ahorra 10%', discountPercentage: 10 },
                        semiannual: { active: true, text: 'Ahorra 20%', discountPercentage: 20 },
                        annual: { active: true, text: 'Ahorra 30%', discountPercentage: 30 },
                        lifetime: { active: false, text: '', discountPercentage: 0 },
                    },
                    stripePriceIds: { lifetime: 'vital_multi_interval_v2' },
                },
            ];
            await Plan.insertMany(defaultPlans);
            const newPlans = await Plan.find().lean();
            return res.status(200).json(newPlans);
        }

        // Verificar y actualizar Plan Pro si tiene valores desactualizados o incompletos
        const proDoc = plans.find((p) => p.planId === 'pro');
        if (proDoc) {
            const needsProUpdate =
                !proDoc.prices?.monthly ||
                proDoc.prices?.monthly === 66300 ||
                !proDoc.prices?.quarterly ||
                !proDoc.promotions?.quarterly?.active;

            if (needsProUpdate) {
                const updatedProPrices = {
                    monthly: proDoc.prices?.monthly && proDoc.prices?.monthly !== 66300 ? proDoc.prices.monthly : 179000,
                    quarterly: proDoc.prices?.quarterly && proDoc.prices?.quarterly !== 199000 ? proDoc.prices.quarterly : 518600,
                    semiannual: proDoc.prices?.semiannual && proDoc.prices?.semiannual !== 399000 ? proDoc.prices.semiannual : 1005000,
                    annual: proDoc.prices?.annual && proDoc.prices?.annual !== 796000 ? proDoc.prices.annual : 1790000,
                };
                const updatedProPromotions = {
                    monthly: proDoc.promotions?.monthly ?? { active: false, text: '', discountPercentage: 0 },
                    quarterly: proDoc.promotions?.quarterly ?? { active: true, text: 'Ahorra 10%', discountPercentage: 10 },
                    semiannual: proDoc.promotions?.semiannual ?? { active: true, text: 'Ahorra 20%', discountPercentage: 20 },
                    annual: proDoc.promotions?.annual ?? { active: true, text: 'Ahorra 30%', discountPercentage: 30 },
                };
                await Plan.updateOne(
                    { planId: 'pro' },
                    {
                        $set: {
                            prices: updatedProPrices,
                            promotions: updatedProPromotions,
                        },
                    }
                );
                proDoc.prices = updatedProPrices;
                proDoc.promotions = updatedProPromotions;
            }
        }

        // Verificar y actualizar Wappy Vital
        const ipevarDoc = plans.find((p) => p.planId === 'ipevar');
        if (!ipevarDoc) {
            await Plan.create({
                planId: 'ipevar',
                name: 'Wappy Vital',
                prices: { monthly: 119000, quarterly: 345000, semiannual: 669000, annual: 1190000, lifetime: 100000 },
                promotions: {
                    monthly: { active: false, text: '', discountPercentage: 0 },
                    quarterly: { active: true, text: 'Ahorra 10%', discountPercentage: 10 },
                    semiannual: { active: true, text: 'Ahorra 20%', discountPercentage: 20 },
                    annual: { active: true, text: 'Ahorra 30%', discountPercentage: 30 },
                    lifetime: { active: false, text: '', discountPercentage: 0 },
                },
                stripePriceIds: { lifetime: 'vital_multi_interval_v2' },
            });
            const newPlans = await Plan.find().lean();
            return res.status(200).json(newPlans);
        } else if (
            ipevarDoc.prices?.monthly === 35000 ||
            ipevarDoc.prices?.annual === 350000 ||
            !ipevarDoc.prices?.monthly ||
            ipevarDoc.stripePriceIds?.lifetime !== 'vital_multi_interval_v2'
        ) {
            const seededPrices = {
                monthly: ipevarDoc.prices?.monthly && ipevarDoc.prices?.monthly !== 35000 ? ipevarDoc.prices.monthly : 119000,
                quarterly: ipevarDoc.prices?.quarterly && ipevarDoc.prices?.quarterly !== 99000 ? ipevarDoc.prices.quarterly : 345000,
                semiannual: ipevarDoc.prices?.semiannual && ipevarDoc.prices?.semiannual !== 185000 ? ipevarDoc.prices.semiannual : 669000,
                annual: ipevarDoc.prices?.annual && ipevarDoc.prices?.annual !== 350000 ? ipevarDoc.prices.annual : 1190000,
                lifetime: ipevarDoc.prices?.lifetime || 100000,
            };
            const seededPromotions = {
                monthly: ipevarDoc.promotions?.monthly ?? { active: false, text: '', discountPercentage: 0 },
                quarterly: ipevarDoc.promotions?.quarterly ?? { active: true, text: 'Ahorra 10%', discountPercentage: 10 },
                semiannual: ipevarDoc.promotions?.semiannual ?? { active: true, text: 'Ahorra 20%', discountPercentage: 20 },
                annual: ipevarDoc.promotions?.annual ?? { active: true, text: 'Ahorra 30%', discountPercentage: 30 },
                lifetime: ipevarDoc.promotions?.lifetime ?? { active: false, text: '', discountPercentage: 0 },
            };
            await Plan.updateOne(
                { planId: 'ipevar' },
                {
                    $set: {
                        name: 'Wappy Vital',
                        prices: seededPrices,
                        promotions: seededPromotions,
                        'stripePriceIds.lifetime': 'vital_multi_interval_v2',
                    },
                }
            );
            ipevarDoc.name = 'Wappy Vital';
            ipevarDoc.prices = seededPrices;
            ipevarDoc.promotions = seededPromotions;
        }

        // Ensure all plans (especially ipevar and pro) have normalized interval structures for admin & /planes
        const normalizedPlans = plans.map((p) => {
            if (p.planId === 'ipevar') {
                return {
                    ...p,
                    name: 'Wappy Vital',
                    prices: {
                        monthly: p.prices?.monthly ?? 119000,
                        quarterly: p.prices?.quarterly ?? 345000,
                        semiannual: p.prices?.semiannual ?? 669000,
                        annual: p.prices?.annual ?? 1190000,
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
                        quarterly: p.promotions?.quarterly ?? { active: true, text: 'Ahorra 10%', discountPercentage: 10 },
                        semiannual: p.promotions?.semiannual ?? { active: true, text: 'Ahorra 20%', discountPercentage: 20 },
                        annual: p.promotions?.annual ?? { active: true, text: 'Ahorra 30%', discountPercentage: 30 },
                        lifetime: p.promotions?.lifetime ?? { active: false, text: '', discountPercentage: 0 },
                    },
                };
            }
            if (p.planId === 'pro') {
                return {
                    ...p,
                    prices: {
                        monthly: p.prices?.monthly ?? 179000,
                        quarterly: p.prices?.quarterly ?? 518600,
                        semiannual: p.prices?.semiannual ?? 1005000,
                        annual: p.prices?.annual ?? 1790000,
                    },
                    promotions: {
                        monthly: p.promotions?.monthly ?? { active: false, text: '', discountPercentage: 0 },
                        quarterly: p.promotions?.quarterly ?? { active: true, text: 'Ahorra 10%', discountPercentage: 10 },
                        semiannual: p.promotions?.semiannual ?? { active: true, text: 'Ahorra 20%', discountPercentage: 20 },
                        annual: p.promotions?.annual ?? { active: true, text: 'Ahorra 30%', discountPercentage: 30 },
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
