const mongoose = require('mongoose');
require('dotenv').config();
const ComunidadConfig = require('./models/ComunidadConfig');
const Plan = require('./models/Plan');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat');
    console.log("Connected to MongoDB successfully.");

    const config = await ComunidadConfig.findOne({ funnelKey: 'wappyvital' });
    console.log("ComunidadConfig for wappyvital:", JSON.stringify(config, null, 2));

    const plan = await Plan.findOne({ planId: 'ipevar' });
    console.log("Plan for ipevar:", JSON.stringify(plan, null, 2));

    const allPlans = await Plan.find({}, 'planId name prices');
    console.log("All plans:", JSON.stringify(allPlans, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();
