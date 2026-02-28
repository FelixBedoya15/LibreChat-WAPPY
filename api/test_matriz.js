require('dotenv').config({ path: './api/.env' });
const mongoose = require('mongoose');

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ name: /Felix/i });
    if (!user) { console.log("User not found"); process.exit(0); }
    const MatrizPeligrosData = mongoose.model('MatrizPeligrosData', new mongoose.Schema({}, { strict: false }));
    const data = await MatrizPeligrosData.findOne({ user: user._id }).lean();
    console.log("Matriz data:", JSON.stringify(data, null, 2));
    process.exit(0);
}
check().catch(console.error);
