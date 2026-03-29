const Plan = require('~/models/Plan');

const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find().lean();

        // Si no existen, podríamos inicializarlos
        if (!plans || plans.length === 0) {
            const defaultPlans = [
                { planId: 'go', name: 'Go', prices: { monthly: 49200, quarterly: 147500, semiannual: 295000, annual: 590000 } },
                { planId: 'plus', name: 'Plus', prices: { monthly: 57800, quarterly: 173500, semiannual: 347000, annual: 694000 } },
                { planId: 'pro', name: 'Pro', prices: { monthly: 66300, quarterly: 199000, semiannual: 399000, annual: 796000 } },
            ];
            await Plan.insertMany(defaultPlans);
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

module.exports = {
    getPlans,
    updatePlan,
};
