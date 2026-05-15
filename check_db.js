const mongoose = require('mongoose');
require('dotenv').config();
const GTC45Matrix = require('./api/models/GTC45WorkspaceSession');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat');
  // Find the latest session
  const session = await GTC45Matrix.findOne().sort({ updatedAt: -1 });
  if (session) {
    console.log("Conversation ID:", session.conversationId);
    console.log("Total Risks:", session.matrixRows ? session.matrixRows.length : 0);
  } else {
    console.log("No session found");
  }
  process.exit(0);
}
run();
