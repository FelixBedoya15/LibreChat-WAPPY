const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });

async function run() {
  const uri = process.env.MONGO_URI.replace('mongodb:27017', '127.0.0.1:27017');
  await mongoose.connect(uri);
  const messages = await mongoose.connection.collection('messages').find({}, { sort: { createdAt: -1 }, limit: 20 }).toArray();
  messages.forEach(m => {
     console.log(`[${m.role}] sender: ${m.sender} | toolCalls: ${m.tool_calls ? m.tool_calls.length : 0} | text: ${m.text ? m.text.substring(0, 100).replace(/\n/g, ' ') : 'null'}`);
  });
  await mongoose.disconnect();
}
run().catch(console.error);
