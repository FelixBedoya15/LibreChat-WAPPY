require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('./models/Plan');

async function getPlans() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const plans = await Plan.find().lean();
        console.log("DB PLANS:", JSON.stringify(plans, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
getPlans();
