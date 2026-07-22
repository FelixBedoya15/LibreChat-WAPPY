/**
 * Script para forzar la sincronización local de los agentes en MongoDB.
 * 
 * Lee el archivo syncAgents.js, extrae los mapeos de AGENT_FILE_MAP y AGENT_CATEGORY_MAP,
 * y actualiza/crea los agentes en la base de datos local usando la misma lógica del servidor.
 * 
 * Ejecutar con: node api/scripts/force-sync-agents.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';
const AGENTES_DIR = path.resolve(__dirname, '../../Agentes/Agentes Wappy');

// Importar modelos locales de LibreChat
const AgentSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  description: String,
  instructions: String,
  provider: String,
  model: String,
  tools: [String],
  category: String,
  author: mongoose.Schema.Types.ObjectId,
  projectIds: [String],
  versions: Array
}, { strict: false, collection: 'agents' });

const ProjectSchema = new mongoose.Schema({
  name: String,
  agentIds: [String]
}, { strict: false, collection: 'projects' });

const UserSchema = new mongoose.Schema({
  role: String
}, { strict: false, collection: 'users' });

const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Nuevos mapeos unificados (los mismos de syncAgents.js)
const AGENT_FILE_MAP = {
  'abogado_laboral': 'Abogado Laboral',
  'medico_laboral': 'Médico Laboral',
  'consultor_sg_sst': 'Consultor SG-SST',
  'fisioterapeuta_laboral': 'Fisioterapeuta Laboral',
  'psicologo_sst': 'Psicólogo SST',
  'terapeuta_salud_mental': 'Terapeuta en Salud Mental',
  'nutricionista_laboral': 'Nutricionista Laboral',
  'primer_respondiente': 'Primer Respondiente',
  'coordinador_emergencias': 'Coordinador de Emergencias',
  'especialista_bioseguridad': 'Especialista en Bioseguridad',
  'ingeniero_electricista_sst': 'Ingeniero Electricista SST',
  'ingeniero_quimico_sst': 'Ingeniero Químico SST',
  'coordinador_seguridad_vial': 'Coordinador de Seguridad Vial',
  'coordinador_tareas_criticas': 'Coordinador de Tareas Críticas',
  'ingeniero_minas_sst': 'Ingeniero de Minas SST',
  'auditor_sg_sst': 'Auditor SG-SST',
  'ingeniero_ambiental': 'Ingeniero Ambiental',
  'redactor_creativo': 'Redactor Creativo',
  'simulador_accidentes': 'Simulador de Accidentes SST'
};

const AGENT_CATEGORY_MAP = {
  'abogado_laboral': 'legal_cumplimiento',
  'medico_laboral': 'ergonomia_salud_bienestar',
  'consultor_sg_sst': 'gestion_consultoria_sg_sst',
  'fisioterapeuta_laboral': 'ergonomia_salud_bienestar',
  'psicologo_sst': 'ergonomia_salud_bienestar',
  'terapeuta_salud_mental': 'ergonomia_salud_bienestar',
  'nutricionista_laboral': 'ergonomia_salud_bienestar',
  'primer_respondiente': 'ergonomia_salud_bienestar',
  'coordinador_emergencias': 'especialistas_riesgos_especificos',
  'especialista_bioseguridad': 'especialistas_riesgos_especificos',
  'ingeniero_electricista_sst': 'especialistas_riesgos_especificos',
  'ingeniero_quimico_sst': 'especialistas_riesgos_especificos',
  'coordinador_seguridad_vial': 'especialistas_riesgos_especificos',
  'coordinador_tareas_criticas': 'especialistas_riesgos_especificos',
  'ingeniero_minas_sst': 'especialistas_riesgos_especificos',
  'auditor_sg_sst': 'gestion_consultoria_sg_sst',
  'ingeniero_ambiental': 'gestion_ambiental',
  'redactor_creativo': 'gestion_consultoria_sg_sst',
  'simulador_accidentes': 'investigacion_inspeccion'
};

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado a MongoDB:', MONGO_URI);

  // Obtener un ID de autor administrador para los nuevos agentes
  const adminUser = await User.findOne({ role: 'ADMIN' }) || await User.findOne({});
  if (!adminUser) {
    console.error('❌ No se encontró ningún usuario en la base de datos para asignar como autor.');
    process.exit(1);
  }
  const authorId = adminUser._id;
  console.log(`👤 Usando autor de agentes: ${adminUser.email || 'Admin'} (ID: ${authorId})`);

  const globalProject = await Project.findOne({ name: 'Global' }) || await Project.findOne({});
  const globalProjectId = globalProject ? globalProject._id.toString() : null;

  // Limpiar todos los agentes antiguos de la base de datos que ya no están en AGENT_FILE_MAP
  const currentDbAgents = await Agent.find({});
  const activeAgentNames = Object.values(AGENT_FILE_MAP);
  
  console.log('\n--- 1. Eliminando agentes inactivos del catálogo ---');
  for (const agent of currentDbAgents) {
    if (!activeAgentNames.includes(agent.name)) {
      console.log(`  🗑️ Eliminando de BD: "${agent.name}"`);
      await Agent.deleteOne({ _id: agent._id });
      if (globalProject) {
        await Project.findByIdAndUpdate(globalProject._id, { $pull: { agentIds: agent.id } });
      }
    }
  }

  console.log('\n--- 2. Sincronizando e inyectando archivos Markdown a la BD ---');
  for (const [fileBasename, dbName] of Object.entries(AGENT_FILE_MAP)) {
    const filePath = path.join(AGENTES_DIR, `${fileBasename}.md`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️ Archivo no encontrado: ${fileBasename}.md`);
      continue;
    }

    const mdContent = fs.readFileSync(filePath, 'utf8');
    const targetCategory = AGENT_CATEGORY_MAP[fileBasename] || 'general';

    // Determinar herramientas del agente
    const tools = [];
    if (fileBasename === 'simulador_accidentes') {
      tools.push('canvas');
    } else if (fileBasename === 'psicologo_sst') {
      tools.push('consultar_analitica_psicosocial', 'canvas');
    } else if (fileBasename === 'coordinador_seguridad_vial') {
      tools.push('canvas', 'context');
    } else if (fileBasename === 'ingeniero_quimico_sst') {
      tools.push('canvas');
    }

    const defaultModel = 'gemini-3.5-flash-lite';

    // Buscar si ya existe
    let agent = await Agent.findOne({ name: dbName });
    if (!agent) {
      // Crear nuevo agente
      const crypto = require('crypto');
      const agentId = crypto.randomUUID();
      const timestamp = new Date();

      agent = new Agent({
        id: agentId,
        name: dbName,
        description: `Agente SST: ${dbName}`,
        instructions: mdContent,
        provider: 'google',
        model: defaultModel,
        tools,
        category: targetCategory,
        author: authorId,
        projectIds: globalProjectId ? [globalProjectId] : [],
        versions: [{
          name: dbName,
          description: `Agente SST: ${dbName}`,
          instructions: mdContent,
          provider: 'google',
          model: defaultModel,
          tools,
          createdAt: timestamp,
          updatedAt: timestamp
        }]
      });

      await agent.save();
      if (globalProject) {
        await Project.findByIdAndUpdate(globalProject._id, { $addToSet: { agentIds: agentId } });
      }
      console.log(`  🆕 Creado agente: "${dbName}"`);
    } else {
      // Actualizar agente existente
      const timestamp = new Date();
      await Agent.updateOne(
        { _id: agent._id },
        {
          $set: {
            instructions: mdContent,
            category: targetCategory,
            model: defaultModel,
            tools: tools,
            versions: [{
              name: dbName,
              description: `Agente SST: ${dbName}`,
              instructions: mdContent,
              provider: 'google',
              model: defaultModel,
              tools: tools,
              createdAt: agent.createdAt || timestamp,
              updatedAt: timestamp
            }]
          }
        }
      );
      console.log(`  🔄 Actualizado agente: "${dbName}"`);
    }
  }

  // Asegurar herramientas específicas de post-sincronización
  await Agent.updateOne({ name: 'Psicólogo SST' }, { $addToSet: { tools: { $each: ['consultar_analitica_psicosocial', 'canvas'] } } });
  await Agent.updateOne({ name: 'Coordinador de Seguridad Vial' }, { $addToSet: { tools: { $each: ['canvas', 'context'] } } });
  await Agent.updateOne({ name: 'Ingeniero Químico SST' }, { $addToSet: { tools: 'canvas' } });

  // Pull deactivated tools from all agents in the database
  try {
    const pullRes = await Agent.updateMany({}, {
      $pull: {
        tools: { $in: ['matriz_pesv', 'matriz_compatibilidad', 'editor_live'] }
      }
    });
    console.log(`🧹 Removidas herramientas desactivadas (matriz_pesv, matriz_compatibilidad, editor_live) de todos los agentes en la BD: ${pullRes.modifiedCount} modificados.`);
  } catch (err) {
    console.error('⚠️ Error eliminando herramientas desactivadas:', err);
  }

  console.log('\n✅ Sincronización de agentes forzada correctamente.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
