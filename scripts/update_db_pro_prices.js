const mongoose = require('mongoose');
require('dotenv').config();
const Plan = require('../api/models/Plan');

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
  console.log(`Connecting to MongoDB at: ${mongoUri}...`);
  await mongoose.connect(mongoUri);

  const updatedPrices = {
    monthly: 93370,
    quarterly: 270540,
    semiannual: 524270,
    annual: 980000
  };

  console.log('Updating Pro plan prices in MongoDB to:', updatedPrices);

  const plan = await Plan.findOneAndUpdate(
    { planId: 'pro' },
    { $set: { prices: updatedPrices } },
    { new: true, upsert: true }
  );

  console.log('Successfully updated Pro plan document:', plan);
  process.exit(0);
}

run().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
