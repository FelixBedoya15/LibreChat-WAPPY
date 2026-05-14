const mongoose = require('mongoose');
const { getWelcomePromo } = require('./api/server/controllers/WompiController');
const PromoCode = require('./api/models/PromoCode');
const User = require('./api/models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat');
  
  const codeDoc = await PromoCode.findOne({ isWelcomeCode: true, active: true }).lean();
  console.log("Welcome Code in DB:", codeDoc);
  
  const user = await User.findOne().sort({createdAt: -1}).lean();
  console.log("Latest user:", user.email, user.createdAt);

  // simulate request
  const req = { user: { _id: user._id } };
  const res = {
    json: (data) => console.log("Response:", data)
  };

  await getWelcomePromo(req, res);
  process.exit(0);
}
run();
