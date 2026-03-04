const Plan = require('~/models/Plan');

const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find().lean();

        // Si no existen, podríamos inicializarlos
        if (!plans || plans.length === 0) {
            const defaultPlans = [
                { planId: 'go', name: 'Go', prices: { monthly: 29500, quarterly: 88500, semiannual: 177000, annual: 354000 } },
                { planId: 'plus', name: 'Plus', prices: { monthly: 34700, quarterly: 104100, semiannual: 208200, annual: 416400 } },
                { planId: 'pro', name: 'Pro', prices: { monthly: 39800, quarterly: 119400, semiannual: 238800, annual: 477600 } },
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
