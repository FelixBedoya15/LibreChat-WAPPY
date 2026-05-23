require('dotenv').config({ path: '../.env' });
const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('No MONGO_URI in .env');
    process.exit(1);
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const agents = await db.collection('agents').find({}).limit(5).toArray();
  console.log(JSON.stringify(agents, null, 2));
  
  // also check what model is currently mostly used
  const models = await db.collection('agents').distinct('model');
  console.log('Distinct models used:', models);
  
  await client.close();
}
run().catch(console.dir);
