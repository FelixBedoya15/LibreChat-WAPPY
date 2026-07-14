/**
 * Script para verificar los detalles de "Profesional SST" y "Coordinador de Capacitaciones" en MongoDB.
 * Ejecutar con: node api/scripts/verify-agent-sharing.js
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

const AgentSchema = new mongoose.Schema({
  id: String,
  name: String,
  projectIds: [String]
}, { strict: false, collection: 'agents' });

const ProjectSchema = new mongoose.Schema({
  name: String,
  agentIds: [String]
}, { strict: false, collection: 'projects' });

const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado a MongoDB:', MONGO_URI);

  const globalProject = await Project.findOne({ name: 'Global' }) || await Project.findOne({});
  const globalProjectId = globalProject ? globalProject._id.toString() : 'N/A';
  console.log(`Global Project: "${globalProject ? globalProject.name : 'N/A'}" (ID: ${globalProjectId})`);

  const targets = ['Profesional SST', 'Consultor SG-SST', 'Coordinador de Capacitaciones'];
  
  for (const name of targets) {
    const agent = await Agent.findOne({ name });
    if (agent) {
      const inProject = globalProject && globalProject.agentIds.includes(agent.id);
      console.log(`\n📌 Agente: "${agent.name}"`);
      console.log(`   - ID: ${agent.id}`);
      console.log(`   - projectIds in Agent:`, agent.projectIds);
      console.log(`   - Linked in Project agentIds:`, inProject ? '✅ SÍ' : '❌ NO');
    } else {
      console.log(`\n❌ Agente no encontrado en BD: "${name}"`);
    }
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
