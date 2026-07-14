/**
 * Script para asignar skills, descripciones profesionales y compartir globalmente a los agentes en MongoDB.
 * 
 * Ejecutar con: node api/scripts/assign-skills-and-share.js
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

const AgentSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
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

// Descripciones unificadas y ligadas a cada especialidad
const AGENT_DESCRIPTIONS = {
  'Abogado Laboral': 'Soy tu Abogado Laboral. Te asesoro en normatividad laboral colombiana, redacción de contratos, reglamentos internos (RIT), procesos disciplinarios y blindaje ante la Ley 1010 y Ley 2365.',
  'Médico Laboral': 'Soy tu Médico Laboral. Te asesoro en exámenes médicos ocupacionales, calificación de origen, restricciones médicas, gestión de ausentismo y programas de vigilancia epidemiológica.',
  'Consultor SG-SST': 'Soy tu Consultor en Seguridad y Salud en el Trabajo (SST). Te asesoro en la identificación, evaluación y control de riesgos laborales, implementación de programas de prevención, cumplimiento de la normatividad colombiana, gestión de emergencias, ergonomía, factores psicosociales y acompañamiento en auditorías.',
  'Fisioterapeuta Laboral': 'Soy tu Fisioterapeuta Laboral. Te asesoro en la prevención de lesiones musculoesqueléticas, ergonomía postural con métodos ROSA y OWAS, y adaptación de puestos de trabajo.',
  'Psicólogo SST': 'Soy tu Psicólogo SST. Te asesoro en la evaluación y control del riesgo psicosocial, aplicación de la batería del Ministerio, y prevención del estrés y el acoso laboral.',
  'Terapeuta en Salud Mental': 'Soy tu Terapeuta en Salud Mental. Te brindo apoyo emocional, primeros auxilios psicológicos y asesoría en el autocuidado y prevención del agotamiento laboral (burnout).',
  'Nutricionista Laboral': 'Soy tu Nutricionista Laboral. Te asesoro en estilos de vida saludable, hábitos alimentarios equilibrados en la empresa y prevención del riesgo cardiovascular y metabólico.',
  'Primer Respondiente': 'Soy tu Primer Respondiente. Te guío en la primera respuesta ante accidentes de trabajo, reanimación RCP básica, control de hemorragias y uso correcto del botiquín.',
  'Coordinador de Emergencias': 'Soy tu Coordinador de Emergencias. Te asesoro en el diseño del Plan de Emergencia (PAE), análisis de vulnerabilidad, rutas de evacuación, conformación de brigadas y simulacros.',
  'Especialista en Bioseguridad': 'Soy tu Especialista en Bioseguridad. Te asesoro en el control de riesgos biológicos, protocolos de desinfección, vacunación ocupacional y el Plan de Gestión de Residuos (PGIRH).',
  'Ingeniero Electricista SST': 'Soy tu Ingeniero Electricista SST. Te asesoro en el cumplimiento del RETIE, inspección de instalaciones eléctricas, prevención del arco eléctrico y control de energías peligrosas.',
  'Ingeniero Químico SST': 'Soy tu Ingeniero Químico SST. Te asesoro en la clasificación del SGA, almacenamiento seguro, hojas de datos de seguridad (FDS/HDS) y planes de control de derrames químicos.',
  'Coordinador de Seguridad Vial': 'Soy tu Coordinador de Seguridad Vial. Te asesoro en el diseño, implementación y seguimiento del Plan Estratégico de Seguridad Vial (PESV) según la normatividad de la ANSV.',
  'Coordinador de Tareas Críticas': 'Soy tu Coordinador de Tareas Críticas. Te asesoro en la emisión de permisos de trabajo seguro y checklists para alturas, espacios confinados, caliente, excavación y energías peligrosas.',
  'Ingeniero de Minas SST': 'Soy tu Ingeniero de Minas SST. Te asesoro en seguridad para minería subterránea, control de gases, ventilación, soporte de túneles y manejo seguro de explosivos.',
  'Auditor SG-SST': 'Soy tu Auditor SG-SST. Te asesoro en la evaluación de estándares mínimos de la Resolución 0312, auditorías internas del sistema y planes de mejoramiento continuo (PHVA).',
  'Ingeniero Ambiental': 'Soy tu Ingeniero Ambiental. Te asesoro en gestión de residuos, control de vertimientos, cumplimiento normativo ecológico y optimización de recursos ambientales corporativos.',
  'Redactor Creativo': 'Soy tu Redactor Creativo. Te asesoro en la redacción, curaduría y optimización de contenidos técnicos y pedagógicos de SST para el Blog corporativo.',
  'Simulador de Accidentes SST': 'Soy tu Simulador de Accidentes SST. Te ayudo a recrear escenarios de siniestros laborales para identificar causas raíz y entrenar a tu equipo en prevención.'
};

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado a MongoDB:', MONGO_URI);

  // 1. Buscar el proyecto Global
  const globalProject = await Project.findOne({ name: 'Global' }) || await Project.findOne({});
  if (!globalProject) {
    console.error('❌ No se encontró ningún proyecto Global.');
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

    // Asignar las descripciones profesionales correspondientes
    if (AGENT_DESCRIPTIONS[agent.name]) {
      updates.description = AGENT_DESCRIPTIONS[agent.name];
      console.log(`  📝 Actualizando descripción de "${agent.name}"`);
    }

    // Asignar las skills correspondientes
    if (AGENT_SKILLS_MAP[agent.name]) {
      updates.skills = AGENT_SKILLS_MAP[agent.name];
      console.log(`  ⚡ Asignando skills a "${agent.name}":`, updates.skills);
    } else {
      updates.skills = []; // resetear si no tiene skills asignadas
    }

    // Vincular al proyecto Global
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

  console.log('\n✅ Asignación de descripciones, skills y vinculación global completada.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
