/**
 * Script para inspeccionar el avatar de "Consultor SG-SST" en la BD.
 * Ejecutar con: node api/scripts/inspect-consultor-avatar.js
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

const AgentSchema = new mongoose.Schema({
  id: String,
  name: String,
  avatar: mongoose.Schema.Types.Mixed
}, { strict: false, collection: 'agents' });

const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado a MongoDB:', MONGO_URI);

  const agent = await Agent.findOne({ name: 'Consultor SG-SST' });
  if (agent) {
    console.log(`📌 Agente: "${agent.name}"`);
    console.log('Avatar field:', JSON.stringify(agent.avatar, null, 2));
  } else {
    console.log('❌ No se encontró el agente "Consultor SG-SST".');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
