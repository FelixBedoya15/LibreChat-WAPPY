const { MongoClient } = require('mongodb');

async function run() {
  const uri = 'mongodb://127.0.0.1:27017/LibreChat';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    
    const result = await db.collection('agents').updateMany(
      { model: { $in: ['gemini-2.5-flash', 'gemini-3.5-flash'] } },
      { $set: { model: 'gemini-3.5-flash-lite' } }
    );
    console.log(`Updated ${result.modifiedCount} agents to 3.5-flash-lite.`);
    
    // Check if there are other models being used by Google provider that we should also update
    const result2 = await db.collection('agents').updateMany(
      { provider: 'google', model: { $ne: 'gemini-3.5-flash-lite' } },
      { $set: { model: 'gemini-3.5-flash-lite' } }
    );
    console.log(`Updated ${result2.modifiedCount} other google agents to 3.5-flash-lite.`);
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
