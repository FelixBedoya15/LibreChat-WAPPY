require('dotenv').config({ path: '/Users/venta/Documents/GitHub/LibreChat-WAPPY/.env' });
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected DB");
  
  // Need to get the user's key. We know LibreChat uses a specific schema or we can just query the collection.
  const auth = await mongoose.connection.collection('users').findOne({ email: 'felix@wappy-ia.com' }); 
  // Wait, keys are often stored in a separate collection like 'keys', 'plugins', 'userkeys', 'credentials'
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name).filter(n => n.toLowerCase().includes('key') || n.toLowerCase().includes('cred')));

  const keysCollection = mongoose.connection.collection('keys'); // LibreChat uses 'keys'
  const keys = await keysCollection.find({}).toArray();
  console.log("Found keys:", keys.map(k => k.name));
  
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
