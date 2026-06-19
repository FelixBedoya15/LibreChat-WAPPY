const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function run() {
  const uri = 'mongodb://127.0.0.1:27017/LibreChat';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('agents');

    console.log('Reading experto_en_riesgo_quimico.md...');
    const absoluteMdPath = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/Agentes/Agentes Wappy/experto_en_riesgo_quimico.md';
    const instructions = fs.readFileSync(absoluteMdPath, 'utf8');

    console.log('Updating Especialista en Riesgo Químico in database...');
    const result = await collection.updateOne(
      { name: 'Especialista en Riesgo Químico' },
      {
        $set: {
          instructions: instructions
        },
        $addToSet: {
          tools: { $each: ['matriz_compatibilidad', 'canvas'] }
        }
      }
    );

    console.log(`Update result: ${JSON.stringify(result)}`);
  } catch (e) {
    console.error('Error during sync:', e);
  } finally {
    await client.close();
  }
}

run();
