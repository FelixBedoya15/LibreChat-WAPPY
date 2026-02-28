const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'api', '.env') });
const mongoose = require('mongoose');

async function check() {
    console.log("URI:", process.env.MONGO_URI ? "Found" : "Missing");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected");
    
    // We need to look up Felix's User ID. Let's find him first.
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ name: /Felix/i });
    if (!user) { console.log("User not found"); process.exit(0); }
    
    console.log("User found:", user._id);
    
    const MatrizPeligrosData = mongoose.model('MatrizPeligrosData', new mongoose.Schema({}, { strict: false }));
    const data = await MatrizPeligrosData.findOne({ user: user._id }).lean();
    
    console.log("Matriz data properties:", data ? Object.keys(data) : "null");
    console.log("Matriz data procesos length:", data && data.procesos ? data.procesos.length : "N/A");
    
    if (data && data.procesos) {
      console.log("First proceso:", JSON.stringify(data.procesos[0], null, 2));
    }
    
    process.exit(0);
}

check().catch(console.error);
