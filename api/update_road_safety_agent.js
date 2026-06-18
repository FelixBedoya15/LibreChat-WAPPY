const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
  // If running outside docker network, resolve mongodb hostname to 127.0.0.1
  const resolvedUri = uri.replace('mongodb://mongodb:', 'mongodb://127.0.0.1:');
  const client = new MongoClient(resolvedUri);
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('agents');

    // 1. Update tools array for 'Especialista en Riesgo Vial'
    const updateResult = await collection.updateOne(
      { name: 'Especialista en Riesgo Vial' },
      { $addToSet: { tools: { $each: ['matriz_pesv', 'canvas', 'context'] } } }
    );
    console.log(`Updated tools for Especialista en Riesgo Vial. Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);

    // 2. Read the latest markdown file content for instructions
    const filePath = path.resolve(__dirname, 'Agentes/Agentes Wappy/experto_en_riesgo_vial.md');
    if (fs.existsSync(filePath)) {
      const instructions = fs.readFileSync(filePath, 'utf8');
      const instructionsResult = await collection.updateOne(
        { name: 'Especialista en Riesgo Vial' },
        { $set: { instructions } }
      );
      console.log(`Updated instructions for Especialista en Riesgo Vial. Matched: ${instructionsResult.matchedCount}, Modified: ${instructionsResult.modifiedCount}`);
    } else {
      console.log(`Markdown file not found at: ${filePath}`);
    }

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
