/**
 * Script para inspeccionar todos los agentes actuales en MongoDB.
 * Ejecutar con: node api/scripts/inspect-db-agents.js
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

const AgentSchema = new mongoose.Schema({
  id: String,
  name: String,
  category: String
}, { strict: false, collection: 'agents' });

const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado a MongoDB:', MONGO_URI);

  const dbAgents = await Agent.find({});
  console.log(`\n📋 Total de agentes en la Base de Datos: ${dbAgents.length}`);
  
  dbAgents.forEach((a, idx) => {
    console.log(`[${idx + 1}] ID: ${a.id} | Name: "${a.name}" | Category: "${a.category}"`);
  });

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
