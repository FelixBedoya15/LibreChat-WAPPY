const Plan = require('~/models/Plan');

// Default visibility config (all sections visible by default except we hide free/go/plus/enterprise/app/custom to show only Pro)
const DEFAULT_VISIBILITY = {
    showPlanFree: false,
    showPlanGo: false,
    showPlanPlus: false,
    showPlanPro: true,
    showSectionAppPlans: false,
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
                { planId: 'ipevar', name: 'IPEVAR', prices: { monthly: 0, quarterly: 0, semiannual: 0, annual: 250000, lifetime: 100000 } },
            ];
            await Plan.insertMany(defaultPlans);
            const newPlans = await Plan.find().lean();
            return res.status(200).json(newPlans);
        }

        const hasIpevar = plans.some(p => p.planId === 'ipevar');
        if (!hasIpevar) {
            await Plan.create({ planId: 'ipevar', name: 'IPEVAR', prices: { monthly: 0, quarterly: 0, semiannual: 0, annual: 250000, lifetime: 100000 } });
            const newPlans = await Plan.find().lean();
            return res.status(200).json(newPlans);
        }

        res.status(200).json(plans);
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
