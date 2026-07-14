/**
 * Script para asignar las skills correspondientes a los agentes y compartirlos globalmente.
 * 
 * Asigna:
 * - Abogado Laboral: skill-acoso-sexual-violencia, skill-procesos-disciplinarios, skill-reglamento-interno-trabajo
 * - Psicólogo SST: skill-acoso-sexual-violencia
 * - Consultor SG-SST: skill-investigacion-accidentes, skill-investigacion-enfermedad, skill-analisis-causa-raiz, skill-formatos-sst
 * - Fisioterapeuta Laboral: skill-metodologia-rosa, skill-ergonomia-owas
 * 
 * Y asegura que todos los 19 agentes estén vinculados al proyecto Global en MongoDB.
 * 
 * Ejecutar con: node api/scripts/assign-skills-and-share.js
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

const AgentSchema = new mongoose.Schema({
  id: String,
  name: String,
  skills: [String],
  projectIds: [String]
}, { strict: false, collection: 'agents' });

const ProjectSchema = new mongoose.Schema({
  name: String,
  agentIds: [String]
}, { strict: false, collection: 'projects' });

const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

// Mapeo exacto de las skills asignadas a cada agente
const AGENT_SKILLS_MAP = {
  'Abogado Laboral': [
    'skill-acoso-sexual-violencia',
    'skill-procesos-disciplinarios',
    'skill-reglamento-interno-trabajo'
  ],
  'Psicólogo SST': [
    'skill-acoso-sexual-violencia'
  ],
  'Consultor SG-SST': [
    'skill-investigacion-accidentes',
    'skill-investigacion-enfermedad',
    'skill-analisis-causa-raiz',
    'skill-formatos-sst'
  ],
  'Fisioterapeuta Laboral': [
    'skill-metodologia-rosa',
    'skill-ergonomia-owas'
  ]
};

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado a MongoDB:', MONGO_URI);

  // 1. Buscar el proyecto Global
  const globalProject = await Project.findOne({ name: 'Global' }) || await Project.findOne({});
  if (!globalProject) {
    console.error('❌ No se encontró ningún proyecto Global en la base de datos.');
    process.exit(1);
  }
  const globalProjectId = globalProject._id.toString();
  console.log(`📌 Proyecto de destino: "${globalProject.name}" (ID: ${globalProjectId})`);

  // 2. Obtener todos los agentes
  const agents = await Agent.find({});
  console.log(`\n📋 Sincronizando ${agents.length} agentes...`);

  const allAgentIds = [];

  for (const agent of agents) {
    allAgentIds.push(agent.id);
    const updates = {};

    // Asignar las skills correspondientes
    if (AGENT_SKILLS_MAP[agent.name]) {
      updates.skills = AGENT_SKILLS_MAP[agent.name];
      console.log(`  ⚡ Asignando skills a "${agent.name}":`, updates.skills);
    }

    // Vincular al proyecto Global si no está vinculado
    if (!agent.projectIds || !agent.projectIds.includes(globalProjectId)) {
      updates.projectIds = [...(agent.projectIds || []), globalProjectId];
      console.log(`  🌐 Compartiendo globalmente a "${agent.name}"`);
    }

    if (Object.keys(updates).length > 0) {
      await Agent.updateOne({ _id: agent._id }, { $set: updates });
    }
  }

  // 3. Vincular los agentes al proyecto Global (en el documento del Proyecto)
  await Project.updateOne(
    { _id: globalProject._id },
    { $addToSet: { agentIds: { $each: allAgentIds } } }
  );

  console.log('\n✅ Asignación de skills y vinculación global completada con éxito.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
