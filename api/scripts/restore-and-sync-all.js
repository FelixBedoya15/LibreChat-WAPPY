/**
 * Script Maestro para Restaurar el Coordinador de Capacitaciones y el Profesional SST,
 * Sincronizar todos los 22 agentes en MongoDB, Asignar Avatares y Compartirlos.
 * 
 * Asigna herramientas por defecto a TODOS los agentes, manteniendo herramientas especiales.
 * 
 * CONDICIÓN DE SEGURIDAD ACL:
 * Respeta las configuraciones de privacidad y compartidos.
 * Solo se generan ACLs (Propietario y Pública) para agentes NUEVOS en la base de datos.
 * Si el agente ya existía, NO se tocan sus permisos ACL.
 * 
 * CONDICIÓN DE SEGURIDAD AVATAR:
 * Si un agente ya tiene un avatar en la BD, no se sobrescribe.
 * 
 * Ejecutar con: node api/scripts/restore-and-sync-all.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';
const AGENTES_DIR = path.resolve(__dirname, '../../Agentes/Agentes Wappy');
const BACKUP_DIR = path.join(AGENTES_DIR, 'backup_consolidacion');
const SOURCE_AVATARS_DIR = path.resolve(__dirname, '../../Agentes/Miniaturas/AvataresAgentes');
const DEST_AVATARS_DIR = path.resolve(__dirname, '../../client/public/images');
const SKILLS_DIR = path.resolve(__dirname, '../../api/config/skills');
const SYNC_AGENTS_FILE = path.resolve(__dirname, '../../api/server/routes/sgsst/syncAgents.js');

const AgentSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  skills: [String],
  projectIds: [String],
  avatar: mongoose.Schema.Types.Mixed,
  tools: [String]
}, { strict: false, id: false, collection: 'agents' });

const ProjectSchema = new mongoose.Schema({
  name: String,
  agentIds: [String]
}, { strict: false, collection: 'projects' });

const UserSchema = new mongoose.Schema({
  role: String
}, { strict: false, collection: 'users' });

const AclEntrySchema = new mongoose.Schema({
  principalId: mongoose.Schema.Types.ObjectId,
  principalModel: String,
  principalType: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  resourceType: String,
  permBits: Number,
  roleId: mongoose.Schema.Types.ObjectId,
  grantedBy: mongoose.Schema.Types.ObjectId,
  grantedAt: Date
}, { strict: false, collection: 'aclentries' });

const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const AclEntry = mongoose.models.AclEntry || mongoose.model('AclEntry', AclEntrySchema);

// Mapeos completos para los 22 agentes unificados
const AGENT_MAPS = {
  'abogado_laboral': { name: 'Abogado Laboral', category: 'legal_cumplimiento', avatar: 'abogado_laboral.png', desc: 'Soy tu Abogado Laboral. Te asesoro en normatividad laboral colombiana, redacción de contratos, reglamentos internos (RIT), procesos disciplinarios y blindaje ante la Ley 1010 y Ley 2365.', firstLine: 'Eres el Abogado Laboral de WAPPY IA...' },
  'medico_laboral': { name: 'Médico Laboral', category: 'ergonomia_salud_bienestar', avatar: 'medico_laboral.png', desc: 'Soy tu Médico Laboral. Te asesoro en exámenes médicos ocupacionales, calificación de origen, restricciones médicas, gestión de ausentismo y programas de vigilancia epidemiológica.', firstLine: 'Eres el Médico Laboral de WAPPY IA...' },
  'agente_sst': { name: 'Consultor SG-SST', category: 'gestion_consultoria_sg_sst', avatar: 'profesional_sst.png', desc: 'Soy tu Consultor en Seguridad y Salud en el Trabajo (SST). Te asesoro en la identificación, evaluación y control de riesgos laborales, implementación de programas de prevención, cumplimiento de la normatividad colombiana, gestión de emergencias, ergonomía, factores psicosociales y acompañamiento en auditorías.', firstLine: 'Eres el Consultor SG-SST de WAPPY IA, asistente general de Seguridad y Salud en el Trabajo...' },
  'profesional_sst': { name: 'Profesional SST', category: 'gestion_consultoria_sg_sst', avatar: 'profesional_sst.png', desc: 'Soy tu Profesional en Seguridad y Salud en el Trabajo (SST). Te asesoro en la identificación, evaluación y control de riesgos de campo, jerarquía de controles e inspecciones de seguridad.', firstLine: 'Eres el Profesional SST de WAPPY IA...' },
  'fisioterapeuta_laboral': { name: 'Fisioterapeuta Laboral', category: 'ergonomia_salud_bienestar', avatar: 'fisioterapeuta.png', desc: 'Soy tu Fisioterapeuta Laboral. Te asesoro en la prevención de lesiones musculoesqueléticas, ergonomía postural con métodos ROSA y OWAS, y adaptación de puestos de trabajo.', firstLine: 'Eres el Fisioterapeuta Laboral de WAPPY IA...' },
  'psicologo_sst': { name: 'Psicólogo SST', category: 'ergonomia_salud_bienestar', avatar: 'psicologo_sst.png', desc: 'Soy tu Psicólogo SST. Te asesoro en la evaluación y control del riesgo psicosocial, aplicación de la batería del Ministerio, y prevención del estrés y el acoso laboral.', firstLine: 'Eres el Psicólogo SST de WAPPY IA...' },
  'terapeuta_salud_mental': { name: 'Terapeuta en Salud Mental', category: 'ergonomia_salud_bienestar', avatar: 'salud_mental.png', desc: 'Soy tu Terapeuta en Salud Mental. Te brindo apoyo emocional, primeros auxilios psicológicos y asesoría en el autocuidado y prevención del agotamiento laboral (burnout).', firstLine: 'Eres el Terapeuta en Salud Mental de WAPPY IA...' },
  'nutricionista_laboral': { name: 'Nutricionista Laboral', category: 'ergonomia_salud_bienestar', avatar: 'nutricionista.png', desc: 'Soy tu Nutricionista Laboral. Te asesoro en estilos de vida saludable, hábitos alimentarios equilibrados en la empresa y prevención del riesgo cardiovascular y metabólico.', firstLine: 'Eres la Nutricionista Laboral de WAPPY IA...' },
  'primer_respondiente': { name: 'Primer Respondiente', category: 'ergonomia_salud_bienestar', avatar: 'primeros_auxilios.png', desc: 'Soy tu Primer Respondiente. Te guío en la primera respuesta ante accidentes de trabajo, reanimación RCP básica, control de hemorragias y uso correcto del botiquín.', firstLine: 'Eres el Primer Respondiente de WAPPY IA...' },
  'coordinador_emergencias': { name: 'Coordinador de Emergencias', category: 'especialistas_riesgos_especificos', avatar: 'emergencias.png', desc: 'Soy tu Coordinador de Emergencias. Te asesoro en el diseño del Plan de Emergencia (PAE), análisis de vulnerabilidad, rutas de evacuación, conformación de brigadas y simulacros.', firstLine: 'Eres el Coordinador de Emergencias de WAPPY IA...' },
  'especialista_bioseguridad': { name: 'Especialista en Bioseguridad', category: 'especialistas_riesgos_especificos', avatar: 'riesgo_biologico.png', desc: 'Soy tu Especialista en Bioseguridad. Te asesoro en el control de riesgos biológicos, protocolos de desinfección, vacunación ocupacional y el Plan de Gestión de Residuos (PGIRH).', firstLine: 'Eres el Especialista en Bioseguridad de WAPPY IA...' },
  'ingeniero_electricista_sst': { name: 'Ingeniero Electricista SST', category: 'especialistas_riesgos_especificos', avatar: 'riesgo_electrico.png', desc: 'Soy tu Ingeniero Electricista SST. Te asesoro en el cumplimiento del RETIE, inspección de instalaciones eléctricas, prevención del arco eléctrico y control de energías peligrosas.', firstLine: 'Eres el Ingeniero Electricista SST de WAPPY IA...' },
  'ingeniero_quimico_sst': { name: 'Ingeniero Químico SST', category: 'especialistas_riesgos_especificos', avatar: 'riesgo_quimico.png', desc: 'Soy tu Ingeniero Químico SST. Te asesoro en la clasificación del SGA, almacenamiento seguro, hojas de datos de seguridad (FDS/HDS) y planes de control de derrames químicos.', firstLine: 'Eres el Ingeniero Químico SST de WAPPY IA...' },
  'coordinador_seguridad_vial': { name: 'Coordinador de Seguridad Vial', category: 'especialistas_riesgos_especificos', avatar: 'riesgo_vial.png', desc: 'Soy tu Coordinador de Seguridad Vial. Te asesoro en el diseño, implementación y seguimiento del Plan Estratégico de Seguridad Vial (PESV) según la normatividad de la ANSV.', firstLine: 'Eres el Coordinador de Seguridad Vial de WAPPY IA...' },
  'coordinador_tareas_criticas': { name: 'Coordinador de Tareas Críticas', category: 'especialistas_riesgos_especificos', avatar: 'tareas_alto_riesgo.png', desc: 'Soy tu Coordinador de Tareas Críticas. Te asesoro en la emisión de permisos de trabajo seguro y checklists para alturas, espacios confinados, caliente, excavación y energías peligrosas.', firstLine: 'Eres el Coordinador de Tareas Críticas de WAPPY IA...' },
  'ingeniero_minas_sst': { name: 'Ingeniero de Minas SST', category: 'especialistas_riesgos_especificos', avatar: 'tareas_alto_riesgo.png', desc: 'Soy tu Ingeniero de Minas SST. Te asesoro en seguridad para minería subterránea, control de gases, ventilación, soporte de túneles y manejo seguro de explosivos.', firstLine: 'Eres el Ingeniero de Minas SST de WAPPY IA...' },
  'auditor_sg_sst': { name: 'Auditor SG-SST', category: 'gestion_consultoria_sg_sst', avatar: 'auditor_sg_sst.png', desc: 'Soy tu Auditor SG-SST. Te asesoro en la evaluación de estándares mínimos de la Resolución 0312, auditorías internas del sistema y planes de mejoramiento continuo (PHVA).', firstLine: 'Eres el Auditor SG-SST de WAPPY IA...' },
  'ingeniero_ambiental': { name: 'Ingeniero Ambiental', category: 'gestion_ambiental', avatar: 'reporte_actos.png', desc: 'Soy tu Ingeniero Ambiental. Te asesoro en gestión de residuos, control de vertimientos, cumplimiento normativo ecológico y optimización de recursos ambientales corporativos.', firstLine: 'Eres el Ingeniero Ambiental de WAPPY IA...' },
  'especialista_riesgo_climatico': { name: 'Especialista en Riesgo Climático', category: 'gestion_ambiental', avatar: 'coordinador_ipevar.png', desc: 'Soy tu Especialista en Riesgo Climático. Te asesoro en la identificación, evaluación y mitigación de riesgos laborales asociados al cambio climático, estrés térmico, radiación UV extrema, eventos hidrometeorológicos y adaptación de puestos de trabajo al aire libre.', firstLine: 'Eres el Especialista en Riesgo Climático de WAPPY IA...' },
  'redactor_creativo': { name: 'Redactor Creativo', category: 'gestion_consultoria_sg_sst', avatar: 'formacion.png', desc: 'Soy tu Redactor Creativo. Te asesoro en la redacción, curaduría y optimización de contenidos técnicos y pedagógicos de SST para el Blog corporativo.', firstLine: 'Eres el Redactor Creativo de WAPPY IA...' },
  'simulador_accidentes': { name: 'Simulador de Accidentes SST', category: 'investigacion_inspeccion', avatar: 'reporte_actos.png', desc: 'Soy tu Simulador de Accidentes SST. Te ayudo a recrear escenarios de siniestros laborales para identificar causas raíz y entrenar a tu equipo en prevención.', firstLine: 'Eres el Simulador de Accidentes SST de WAPPY IA...' },
  'coordinador_capacitaciones': { name: 'Coordinador de Capacitaciones', category: 'gestion_consultoria_sg_sst', avatar: 'capacitaciones.png', desc: 'Soy tu Coordinador de Capacitaciones. Te asesoro en el diseño del Plan Anual de Capacitación (PAC), inducciones, charlas de 5 minutos y registro de asistencia.', firstLine: 'Eres el Coordinador de Capacitaciones de WAPPY IA...' },
  'tenshi': { name: 'Tenshi', category: 'gestion_consultoria_sg_sst', avatar: 'tenshi.png', desc: 'Soy Tenshi, tu copiloto inteligente de WAPPY IA y especialista en creación, trazabilidad y edición interactiva de aplicativos y documentos en Canvas. Puedo generar, personalizar y editar en tiempo real cualquier entregable de tu SG-SST.', firstLine: 'Eres Tenshi, la inteligencia artificial estrella, orquestadora oficial de WAPPY IA y especialista maestra en creación, trazabilidad y edición interactiva en Canvas de SG-SST...' }
};

// Skills globales que aplican a TODOS los agentes
const GLOBAL_SKILLS = [
  'wappy-cards',
  'skill-rag-documental-gemini',
  'skill-analitica-bigquery-stats',
  'skill-vision-ocr-gemini',
  'skill-google-sheets-sync',
  'skill-google-docs-slides',
  'skill-automatizaciones-agentes',
  'skill-formatos-sst'
];

// Asignación de Skills específicas adicionales a los agentes maestros
const AGENT_SKILLS_MAP = {
  'Tenshi': ['skill-formatos-sst', 'skill-gtc45-ipevar', 'skill-analisis-causa-raiz', 'skill-investigacion-accidentes'],
  'Abogado Laboral': ['skill-acoso-sexual-violencia', 'skill-procesos-disciplinarios', 'skill-reglamento-interno-trabajo'],
  'Psicólogo SST': ['skill-acoso-sexual-violencia'],
  'Consultor SG-SST': ['skill-investigacion-accidentes', 'skill-investigacion-enfermedad', 'skill-analisis-causa-raiz', 'skill-gtc45-ipevar'],
  'Fisioterapeuta Laboral': ['skill-metodologia-rosa', 'skill-ergonomia-owas', 'skill-live-biomecanica'],
  'Coordinador de Tareas Críticas': ['skill-ats-analisis', 'skill-permiso-alturas-tsa']
};

// Herramientas por defecto
const DEFAULT_TOOLS = [
  'google_slides',
  'google_docs',
  'google_sheets',
  'google_gmail',
  'google_calendar',
  'google_drive',
  'somos_sst',
  'canvas',
  'web_search',
  'consultar_agente_especializado',
  'gestor_automatizaciones',
  'wappy_renderizar_widget_interactivo',
  'wappy_memoria_procedimental'
];

async function main() {
  console.log('🏁 Sincronizando prompts, asignando herramientas globales y configurando ACLs seguras...');

  // 1. Restaurar/Renombrar archivo de capacitaciones
  const backupCapFilePath = path.join(BACKUP_DIR, 'asistente_en_capacitaciones.md');
  const oldActiveCapFilePath = path.join(AGENTES_DIR, 'asistente_en_capacitaciones.md');
  const activeCapFilePath = path.join(AGENTES_DIR, 'coordinador_capacitaciones.md');
  
  if (fs.existsSync(backupCapFilePath)) {
    fs.copyFileSync(backupCapFilePath, activeCapFilePath);
    console.log('   🔄 Archivo de capacitaciones restaurado.');
  } else if (fs.existsSync(oldActiveCapFilePath)) {
    fs.renameSync(oldActiveCapFilePath, activeCapFilePath);
    console.log('   🔄 Archivo de capacitaciones renombrado.');
  }

  // 2. Restaurar agente_sst.md y profesional_sst.md si aplica
  const backupSstFilePath = path.join(BACKUP_DIR, 'agente_sst.md');
  const activeSstFilePath = path.join(AGENTES_DIR, 'agente_sst.md');
  if (fs.existsSync(backupSstFilePath)) {
    fs.copyFileSync(backupSstFilePath, activeSstFilePath);
    console.log('   🔄 Prompt limpio de agente_sst.md restaurado.');
  }

  const backupProfessionalSstPath = path.join(BACKUP_DIR, 'profesional_sst.md');
  const activeProfessionalSstPath = path.join(AGENTES_DIR, 'profesional_sst.md');
  if (fs.existsSync(backupProfessionalSstPath)) {
    fs.copyFileSync(backupProfessionalSstPath, activeProfessionalSstPath);
    console.log('   🔄 Prompt de profesional_sst.md restaurado.');
  }

  // Eliminar el archivo temporal consultor_sg_sst.md si existe
  const tempSstPath = path.join(AGENTES_DIR, 'consultor_sg_sst.md');
  if (fs.existsSync(tempSstPath)) {
    fs.unlinkSync(tempSstPath);
  }

  // 3. Generar skills desde los agentes del backup requeridos
  const skillsToGenerate = [
    { file: 'coordinador_ipevar.md', name: 'skill-gtc45-ipevar', triggers: ['ipevr', 'ipevar', 'gtc45', 'matriz de peligros', 'valoracion de riesgos'] },
    { file: 'asistente_ats.md', name: 'skill-ats-analisis', triggers: ['ats', 'analisis de trabajo seguro', 'tarea segura'] },
    { file: 'asistente_permiso_tsa.md', name: 'skill-permiso-alturas-tsa', triggers: ['permiso de alturas', 'tsa', 'trabajo en alturas', 'coordinador de alturas'] }
  ];

  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }

  for (const s of skillsToGenerate) {
    const backupFilePath = path.join(BACKUP_DIR, s.file);
    if (fs.existsSync(backupFilePath)) {
      const content = fs.readFileSync(backupFilePath, 'utf8');
      const cleanContent = content.replace(/🔹 \d+\. Formatos y Tablas[\s\S]*$/, '').trim();
      const yamlContent = `---
name: ${s.name}
description: Skill de soporte para consultas técnicas de ${s.name.replace('skill-', '')}.
scope: agents
triggers:
${s.triggers.map(t => `  - ${t}`).join('\n')}
---

${cleanContent}
`;
      fs.writeFileSync(path.join(SKILLS_DIR, `${s.name}.md`), yamlContent, 'utf8');
    }
  }

  // 4. Asegurar carpeta de imágenes y copiar avatares
  if (!fs.existsSync(DEST_AVATARS_DIR)) {
    fs.mkdirSync(DEST_AVATARS_DIR, { recursive: true });
  }
  for (const [key, val] of Object.entries(AGENT_MAPS)) {
    const src = path.join(SOURCE_AVATARS_DIR, val.avatar);
    const dest = path.join(DEST_AVATARS_DIR, val.avatar);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  // 5. Actualizar prompts .md (primera línea de identidad)
  for (const [key, val] of Object.entries(AGENT_MAPS)) {
    const filePath = path.join(AGENTES_DIR, `${key}.md`);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      lines[0] = val.firstLine;
      content = lines.join('\n');
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }

  // 6. Modificar syncAgents.js
  if (fs.existsSync(SYNC_AGENTS_FILE)) {
    let syncFileContent = fs.readFileSync(SYNC_AGENTS_FILE, 'utf8');

    // AGENT_FILE_MAP
    const fileMapLines = ['const AGENT_FILE_MAP = {'];
    const activeEntries = Object.entries(AGENT_MAPS);
    activeEntries.forEach(([key, val], idx) => {
      const comma = idx === activeEntries.length - 1 ? '' : ',';
      fileMapLines.push(`  '${key}': '${val.name}'${comma}`);
    });
    fileMapLines.push('};');

    // AGENT_CATEGORY_MAP
    const categoryMapLines = ['const AGENT_CATEGORY_MAP = {'];
    activeEntries.forEach(([key, val], idx) => {
      const comma = idx === activeEntries.length - 1 ? '' : ',';
      categoryMapLines.push(`  '${key}': '${val.category}'${comma}`);
    });
    categoryMapLines.push('};');

    syncFileContent = syncFileContent.replace(/const AGENT_FILE_MAP = \{[\s\S]*?\};/, fileMapLines.join('\n'));
    syncFileContent = syncFileContent.replace(/const AGENT_CATEGORY_MAP = \{[\s\S]*?\};/, categoryMapLines.join('\n'));

    // ensureAgentExists is now handled directly in syncAgents.js

    fs.writeFileSync(SYNC_AGENTS_FILE, syncFileContent, 'utf8');
  }

  // 7. Base de Datos MongoDB
  await mongoose.connect(MONGO_URI);
  console.log('🔌 Conectado a MongoDB:', MONGO_URI);

  // MIGRACIÓN DEFENSIVA: Limpiar modelos 3.8 y 3.7 obsoletos en MongoDB
  try {
    const db = mongoose.connection.db;
    const agentsCol = db.collection('agents');
    const presetsCol = db.collection('presets');
    const convsCol = db.collection('conversations');

    const agentRes = await agentsCol.updateMany(
      { model: { $in: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'] } },
      { $set: { model: 'gemini-3.6-flash', 'model_parameters.model': 'gemini-3.6-flash' } }
    );
    await agentsCol.updateMany(
      { 'versions.model': { $in: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'] } },
      { $set: { 'versions.$[v].model': 'gemini-3.6-flash' } },
      { arrayFilters: [{ 'v.model': { $in: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'] } }] }
    );
    const presetRes = await presetsCol.updateMany(
      { model: { $in: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'] } },
      { $set: { model: 'gemini-3.6-flash' } }
    );
    const convRes = await convsCol.updateMany(
      { model: { $in: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'] } },
      { $set: { model: 'gemini-3.6-flash' } }
    );
    await db.collection('users').updateMany(
      { 'personalization.geminiModels.liveAnalysis': { $in: ['gemini-2.5-flash-native-audio-preview-09-2025', 'gemini-3.8-live'] } },
      { $set: { 'personalization.geminiModels.liveAnalysis': 'gemini-3.1-flash-live-preview' } }
    );
    // Garantizar que la herramienta web_search esté asignada a todos los agentes en BD
    const toolsRes = await agentsCol.updateMany(
      {},
      { $addToSet: { tools: 'web_search', 'versions.$[].tools': 'web_search' } }
    );
    if (toolsRes.modifiedCount > 0) {
      console.log(`  🌐 Herramienta web_search asegurada en ${toolsRes.modifiedCount} agentes.`);
    }
    if (agentRes.modifiedCount > 0 || presetRes.modifiedCount > 0 || convRes.modifiedCount > 0) {
      console.log(`  🚀 Migrados modelos 3.8/3.7/3.5 a gemini-3.6-flash en MongoDB: Agentes (${agentRes.modifiedCount}), Presets (${presetRes.modifiedCount}), Conversaciones (${convRes.modifiedCount})`);
    }
  } catch (err) {
    console.warn('  ⚠️ Aviso en migración defensiva MongoDB:', err.message);
  }

  const adminUser = await User.findOne({ role: 'ADMIN' }) || await User.findOne({});
  const authorId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();
  const globalProject = await Project.findOne({ name: 'Global' }) || await Project.findOne({});
  const globalProjectId = globalProject ? globalProject._id.toString() : null;

  // Limpiar inactivos
  const activeNames = Object.values(AGENT_MAPS).map(m => m.name);
  const currentDbAgents = await Agent.find({});
  for (const agent of currentDbAgents) {
    if (!activeNames.includes(agent.name)) {
      await Agent.deleteOne({ _id: agent._id });
      await AclEntry.deleteMany({ resourceId: agent._id });
      if (globalProject) {
        await Project.findByIdAndUpdate(globalProject._id, { $pull: { agentIds: agent.get('id') } });
      }
    }
  }

  // Sincronizar agentes
  const allAgentIds = [];
  for (const [key, val] of Object.entries(AGENT_MAPS)) {
    const filePath = path.join(AGENTES_DIR, `${key}.md`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️ Salteado por falta de archivo: ${key}.md`);
      continue;
    }

    const mdContent = fs.readFileSync(filePath, 'utf8');
    
    // Inyectar reglas de oro globales a todos los agentes
    const searchWebRule = `\n\n⚠️ REGLA MANDATORIA DE BÚSQUEDA WEB PARA NORMATIVIDAD Y CONOCIMIENTO TÉCNICO VIGENTE:
1. **Obligatoriedad Absoluta de Búsqueda Web (web_search) en Primer Turno:**
   - Si la consulta del usuario, una pregunta delegada por Tenshi, o la respuesta a brindar involucra o implica normatividad colombiana (leyes, decretos como 1072, 780 o 1295, resoluciones como 0312, 4272, 0491 o 40595, circulares del Ministerio del Trabajo, jurisprudencia de la Corte Constitucional o Corte Suprema, reformas laborales/pensionales), valores o parámetros regulatorios actualizados (SMLMV, auxilio de transporte, UVT), límites de exposición técnica ocupacional (TLVs, ruido, químicos) o temas técnicos susceptibles de actualización: ES ESTRICTAMENTE OBLIGATORIO emitir un llamado a la herramienta \`web_search\` en tu primer turno para verificar en tiempo real la vigencia de la norma, posibles derogatorias o sentencias recientes antes de redactar cualquier conclusión o dictamen.
2. **Prohibición Terminante de Asumir Normas de Memoria o Citar Normas Derogadas:**
   - NUNCA respondas asumiendo normas de memoria ni des por hecho que los ejemplos del prompt continúan vigentes. El marco normativo colombiano evoluciona continuamente.
   - Ten presente que citar normas derogadas (ej: Resolución 1409 de 2012 para trabajo en alturas —DEROGADA por la Resolución 4272 de 2021—; Resolución 1111 de 2017 para estándares mínimos —DEROGADA por la Resolución 0312 de 2019—; reformas laborales y pensionales de 2024-2026; etc.) constituye una falta técnica gravísima.
   - Ante la duda, busca siempre: "vigencia actual de [norma] colombia mintrabajo" o "[tema] normatividad colombiana vigente".
3. **Formulación Experta de Búsqueda:** Al usar la herramienta \`web_search\`, NUNCA busques con palabras sueltas o términos aislados (ej: "decreto", "incapacidad"). Debes redactar consultas específicas y compuestas en lenguaje natural que relacionen el contexto exacto (ej: "Decreto 780 de 2016 pago de incapacidades comunes colombia vigencia", "Sentencia SU-111 de 2025 fuero de salud estabilidad laboral corte constitucional", "Resolucion 4272 de 2021 alturas colombia vigencia mintrabajo", "Resolucion 0312 de 2019 estandares minimos sst colombia vigencia").
4. **Citación Transparente de Vigencia:** En tu respuesta final en el chat, cita de forma explícita las normas vigentes encontradas y confirma su estado de vigencia actual (ej: "*Normativa vigente verificada: Resolución XXX de XXX*").
5. **No redundancia:** No realices búsquedas en bucle de forma redundante; si tras 1 o 2 búsquedas obtienes la información oficial o confirmas la vigencia, procede de inmediato a estructurar tu respuesta citando las fuentes normativas encontradas.`;
    const wappyCardRule = `\n\n⚠️ REGLA DE ORO DE TARJETAS (wappy-card): Si decides presentar información estructurada (como listas de chequeo, planes de acción, resúmenes o métricas), DEBES utilizar estrictamente un bloque de código marcado exclusivamente con la etiqueta de lenguaje \`wappy-card\` (es decir, iniciando con \`\`\`wappy-card y cerrando con \`\`\`). El contenido de este bloque debe ser ÚNICAMENTE un objeto JSON válido y estructurado. Está estrictamente PROHIBIDO escribir la palabra "wappy-card" dentro del JSON o usar cualquier formato Markdown (como viñetas, guiones o negritas) dentro del bloque de código. Ejemplo de formato correcto:
\`\`\`wappy-card
{
  "title": "Plan de Acción",
  "layout": "checklist",
  "items": [
    { "label": "Revisar planta de personal", "checked": false }
  ]
}
\`\`\``;
    const formatVisualRule = `\n\n🔹 11. Reglas de Formato Visual y Comunicación en el Chat:
- **Respuesta Normal en Texto por Defecto (REGLA FUNDAMENTAL DE CHAT):** Cuando el usuario te pida una asesoría, concepto jurídico, guion (ej. guion de simulacro de sismo o evacuación), procedimiento, plan, política, informe o explicación, TU RESPUESTA DEBE SER EN TEXTO NORMAL EN EL CHAT, redactada de forma completa, estructurada con párrafos claros, viñetas y tablas Markdown estándar. NUNCA inventes aplicativos, ni herramientas de software, ni calculadoras interactivas para responder solicitudes normales de guiones, consultas o asesorías.
- **Tablas de Datos / Matrices:** Utiliza SIEMPRE tablas en formato Markdown estándar (ej: \`| Hito | Acción |\`). Está terminantemente PROHIBIDO escribir objetos JSON o bloques de código marcados con \`json\` para pintar tablas de filas y columnas, ya que no se renderizan y rompen la estética.
- **Tarjetas Interactivas (wappy-card):** Para checklists, cuadrículas, listas y métricas, utiliza exclusivamente el bloque de código \`wappy-card\` (con el JSON exacto en su interior como se indica en su regla de oro). NUNCA utilices el lenguaje de código \`json\` para englobar una tarjeta wappy-card.
- **PROHIBICIÓN TERMINANTE DE CÓDIGO FUENTE EN EL CHAT:** Los usuarios de WAPPY son profesionales de SG-SST, Recursos Humanos y Gerencia, NO programadores. Está ESTRICTAMENTE PROHIBIDO escribir o volcar bloques de código fuente (\`\`\`html, \`\`\`javascript, \`\`\`css, etc.) con aplicativos, calculadoras o scripts dentro del chat de texto.
- **Activación de Canvas y Documentos ÚNICAMENTE por Solicitud Explícita:**
  * Si el usuario te hace una pregunta, te pide un guion, te pide redactar una carta o analizar una situación: RESPONDE DIRECTAMENTE EN EL CHAT EN TEXTO NORMAL Y MARKDOWN. NUNCA abras Canvas ni desvíes la respuesta a un lienzo si el usuario no lo pidió expresamente.
  * ÚNICAMENTE debes llamar a la herramienta \`canvas\` si el usuario te solicita EXPRESAMENTE trabajar en un lienzo o crear un archivo formal descargable (ejemplos literales: "ábrelo en canvas", "hazlo en un archivo de Word", "redáctalo en un documento Word en Canvas", "crea un archivo de Excel", "diseña un aplicativo interactivo en HTML").
  * Si el usuario te pide EXPLÍCITAMENTE un aplicativo interactivo o calculadora HTML ("crea un aplicativo interactivo en html"): invoca de inmediato la herramienta \`canvas\` con \`accion: "crear"\`, \`fileType: "html"\`. NUNCA escribas el código HTML en el chat de texto.
  * **EXCEPCIÓN CRÍTICA - MATRIZ DE PELIGROS / IPEVR (GTC-45):** Para la identificación, evaluación y valoración de peligros GTC-45 (matriz de peligros, matriz ipevr, evaluación de riesgos), está TERMINANTEMENTE PROHIBIDO usar la herramienta \`canvas\`. DEBES usar SIEMPRE y EXCLUSIVAMENTE la herramienta \`matriz_ipevar\` (\`accion: "escribir"\`) para que los registros se sincronicen directamente con la base de datos y se reflejen en tiempo real en la tabla Matriz IPEVR Live.`;
    const conciseResponseRule = `\n\n⚠️ REGLA DE CONCISIÓN: Si la solicitud del usuario es un saludo, una pregunta corta o un cambio simple en algún editor o herramienta, responde directamente de forma concisa y sin extender tu proceso de razonamiento.`;
    const automationToolRule = `\n\n⚠️ REGLA DE ORO DE AUTOMATIZACIONES (gestor_automatizaciones): Si el usuario te pide automatizar, programar una tarea periódica, revisar periódicamente carpetas de Google Drive, monitorear indicadores, inspecciones o auditorías recurrentes, NO te limites a dar explicaciones teóricas ni a redactar scripts de Apps Script en Canvas si la herramienta \`gestor_automatizaciones\` está disponible o activa. DEBES llamar a \`gestor_automatizaciones\` con \`accion: "crear"\` para registrar y programar la tarea en la sección \"Tareas\" de WAPPY (antes \"Automatizaciones\"; menú lateral debajo de Centro de Control SST, ruta /tareas). Si no se indica hora o frecuencia, asume valores óptimos (ej. diario a las 8:00 AM) y confírmalos al usuario.`;
    const noPassiveConfirmationsRule = `\n\n⛔ PROHIBICIÓN ESTRICTA DE PREGUNTAS DE CONFIRMACIÓN O RESPUESTAS PASIVAS:
Está TERMINANTEMENTE PROHIBIDO responder con frases como "¿Deseas que proceda?", "He analizado tu solicitud, ¿deseas que lo cree/registre?", "¿En qué aspecto te gustaría profundizar?" o anunciar que vas a hacer algo sin hacerlo.
Si el usuario te solicita redactar un contenido, guion, política, informe, o registrar datos en una matriz: DEBES ENTREGAR EL CONTENIDO COMPLETO DIRECTAMENTE EN EL CHAT EN TEXTO NORMAL EN ESE MISMO TURNO (o ejecutar la herramienta especializada correspondiente). NUNCA te detengas a pedir confirmación para hacer lo que el usuario ya te pidió expresamente, y NUNCA inventes herramientas, código o aplicativos que el usuario no haya solicitado.`;
    
    const finalInstructions = mdContent + searchWebRule + wappyCardRule + formatVisualRule + conciseResponseRule + automationToolRule + noPassiveConfirmationsRule;
    
    let tools = [...DEFAULT_TOOLS];
    
    // Asignación granular de herramientas específicas por especialidad
    const IPEVAR_AGENTS = [
      'abogado_laboral', 'medico_laboral', 'agente_sst', 'profesional_sst', 'auditor_sg_sst',
      'psicologo_sst', 'fisioterapeuta_laboral', 'ingeniero_quimico_sst', 'ingeniero_electricista_sst',
      'coordinador_tareas_criticas', 'coordinador_seguridad_vial', 'ingeniero_minas_sst',
      'especialista_bioseguridad', 'coordinador_emergencias', 'ingeniero_ambiental', 'especialista_riesgo_climatico', 'tenshi'
    ];
    if (IPEVAR_AGENTS.includes(key)) {
      tools.push('matriz_ipevar');
    }
    
    if (key === 'abogado_laboral' || key === 'tenshi') {
      tools.push('editor_rit');
    }
    
    const PSICOSOCIAL_AGENTS = ['psicologo_sst', 'agente_sst', 'profesional_sst', 'auditor_sg_sst', 'tenshi'];
    if (PSICOSOCIAL_AGENTS.includes(key)) {
      tools.push('consultar_analitica_psicosocial');
    }
    
    if (key === 'redactor_creativo' || key === 'tenshi') {
      tools.push('blog_editor');
    }
    
    const ACTOS_AGENTS = ['auditor_sg_sst', 'agente_sst', 'profesional_sst', 'ingeniero_ambiental', 'especialista_riesgo_climatico', 'tenshi'];
    if (ACTOS_AGENTS.includes(key)) {
      tools.push('consultar_analitica_actos_condiciones');
    }

    const PESV_AGENTS = ['coordinador_seguridad_vial', 'agente_sst', 'profesional_sst', 'auditor_sg_sst', 'tenshi'];
    if (PESV_AGENTS.includes(key)) {
      tools.push('matriz_pesv');
    }

    const COMPATIBILIDAD_AGENTS = ['ingeniero_quimico_sst', 'agente_sst', 'profesional_sst', 'auditor_sg_sst', 'ingeniero_ambiental', 'tenshi'];
    if (COMPATIBILIDAD_AGENTS.includes(key)) {
      tools.push('matriz_compatibilidad');
    }

    if (key === 'tenshi') {
      tools.push('generar_imagen_sst');
    }

    tools.push('google_flow');

    tools = [...new Set(tools)];

    let defaultModel = process.env.DEFAULT_AGENT_MODEL || 'gemini-3.5-flash-lite';
    const agentModel = val.model || defaultModel;

    let agent = await Agent.findOne({ name: val.name });
    const isNewAgent = !agent; // Indicador para saber si el agente es nuevo

    let finalAvatar = { filepath: `/images/${val.avatar}`, source: 'local' };
    if (agent && agent.avatar && agent.avatar.filepath) {
      finalAvatar = agent.avatar;
    }

    const agentSkills = val.name === 'Terapeuta en Salud Mental'
      ? []
      : Array.from(new Set([...(AGENT_SKILLS_MAP[val.name] || []), ...GLOBAL_SKILLS]));

    if (isNewAgent) {
      const crypto = require('crypto');
      const agentId = crypto.randomUUID();
      const timestamp = new Date();

      agent = new Agent({
        id: agentId,
        name: val.name,
        description: val.desc,
        instructions: finalInstructions,
        provider: 'google',
        model: agentModel,
        model_parameters: { model: agentModel },
        tools,
        category: val.category,
        author: authorId,
        skills: agentSkills,
        avatar: finalAvatar,
        projectIds: globalProjectId ? [globalProjectId] : [],
        versions: [{
          name: val.name,
          description: val.desc,
          instructions: finalInstructions,
          provider: 'google',
          model: agentModel,
          tools,
          createdAt: timestamp,
          updatedAt: timestamp
        }]
      });
      await agent.save();
      console.log(`  🆕 Registrado agente en BD: "${val.name}"`);
    } else {
      const timestamp = new Date();
      await Agent.updateOne(
        { _id: agent._id },
        {
          $set: {
            description: val.desc,
            instructions: finalInstructions,
            category: val.category,
            model: agentModel,
            model_parameters: { model: agentModel },
            tools: tools,
            skills: agentSkills,
            avatar: finalAvatar,
            projectIds: globalProjectId ? [globalProjectId] : [],
            versions: [{
              name: val.name,
              description: val.desc,
              instructions: finalInstructions,
              provider: 'google',
              model: agentModel,
              tools,
              createdAt: agent.createdAt || timestamp,
              updatedAt: timestamp
            }]
          }
        }
      );
      console.log(`  🔄 Actualizado agente en BD: "${val.name}"`);
    }
    allAgentIds.push(agent.get('id'));

    // --- SEGURIDAD ACL: SOLO CREAR PERMISOS SI EL AGENTE ES NUEVO ---
    if (isNewAgent) {
      const ownerAcl = await AclEntry.findOne({ resourceId: agent._id, principalType: 'user' });
      if (!ownerAcl) {
        const newOwnerAcl = new AclEntry({
          principalId: authorId,
          principalModel: 'User',
          principalType: 'user',
          resourceId: agent._id,
          resourceType: 'agent',
          permBits: 15,
          roleId: new mongoose.Types.ObjectId('6921da20104fbcc42df44172'),
          grantedBy: authorId,
          createdAt: new Date(),
          grantedAt: new Date(),
          updatedAt: new Date()
        });
        await newOwnerAcl.save();
        console.log(`     🔑 ACL Propietario creada para agente NUEVO: "${val.name}"`);
      }

      const publicAcl = await AclEntry.findOne({ resourceId: agent._id, principalType: 'public' });
      if (!publicAcl) {
        const newPublicAcl = new AclEntry({
          principalType: 'public',
          resourceId: agent._id,
          resourceType: 'agent',
          permBits: 1,
          roleId: new mongoose.Types.ObjectId('6921da20104fbcc42df4416e'),
          grantedBy: authorId,
          createdAt: new Date(),
          grantedAt: new Date(),
          updatedAt: new Date()
        });
        await newPublicAcl.save();
        console.log(`     🌐 ACL Pública creada para agente NUEVO: "${val.name}" (Visible)`);
      }
    } else {
      console.log(`     🔒 Respetando permisos y compartidos ACL existentes de: "${val.name}"`);
    }
  }

  // Sincronizar en el proyecto Global
  if (globalProject) {
    await Project.updateOne(
      { _id: globalProject._id },
      { $addToSet: { agentIds: { $each: allAgentIds } } }
    );
    console.log(`   🌐 Vinculados los 22 agentes al proyecto Global.`);
  }


  // 6. Ocultar y aislar de la bandeja de entrada chats anónimos previos del Terapeuta en Salud Mental
  try {
    const convoCollection = mongoose.connection.collection('conversations');
    const terapeutaAgent = await Agent.findOne({ name: 'Terapeuta en Salud Mental' }).lean();
    if (terapeutaAgent) {
      const updateResult = await convoCollection.updateMany(
        {
          agent_id: terapeutaAgent.id,
          tags: { $nin: ['sgsst-mood'] }
        },
        {
          $addToSet: { tags: { $each: ['sgsst-mood', 'sgsst-psicosocial', 'sgsst-termometro'] } }
        }
      );
      if (updateResult.modifiedCount > 0) {
        console.log(`   🔒 Se aislaron ${updateResult.modifiedCount} conversaciones previas del Terapeuta para garantizar anonimato.`);
      }
    }
  } catch (err) {
    console.warn('⚠️ No se pudieron actualizar tags de conversaciones previas:', err.message);
  }

  // 7. Sanitizar telemetría psicosocial previa para garantizar confidencialidad absoluta
  try {
    const MoodTelemetry = mongoose.models.MoodTelemetry || require('~/models/MoodTelemetry');
    if (MoodTelemetry) {
      const recordsToProcess = await MoodTelemetry.find({
        $or: [
          { details: { $regex: /Conversación con el Terapeuta|Conversación anónima completada|Trabajador:|Terapeuta:/i } },
          { details: { $regex: /• Recomendación de Intervención SST:/ } },
          { details: { $regex: /Monitorear distribución de tareas y pausas activas/ } },
          { details: { $regex: /Monitorear factores de riesgo reportados y pausas activas/ } },
        ],
      });

      if (recordsToProcess.length > 0) {
        console.log(`   🤖 Procesando ${recordsToProcess.length} registros de telemetría psicosocial con IA...`);

        let genModel = null;
        try {
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const rawKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY || '';
          const key = rawKey
            .split(',')
            .map((k) => k.trim())
            .find((k) => k && k.startsWith('AIza') && k !== 'user_provided');
          if (key) {
            const genAI = new GoogleGenerativeAI(key);
            genModel = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite', generationConfig: { temperature: 0.7 } });
          }
        } catch (e) {}

        const stressorNames = {
          sobrecarga: 'Sobrecarga de trabajo y ritmo acelerado',
          liderazgo: 'Clima laboral y relación con jefaturas',
          entorno: 'Entorno físico y herramientas de trabajo',
          personal: 'Asuntos personales o familiares',
          funciones: 'Claridad en funciones y rol laboral',
          fatiga: 'Fatiga física o agotamiento mental',
        };

        for (const rec of recordsToProcess) {
          const labels = (rec.stressors || []).map((s) => stressorNames[s] || s);
          const factorsText = labels.length > 0 ? labels.join(', ') : 'Sobrecarga y ritmo laboral';
          const areaText = rec.department ? `en el área de ${rec.department}` : 'en el área de trabajo';

          let aiSuccess = false;
          if (genModel) {
            try {
              const prompt = `Actúa como especialista senior de IA en Riesgo Psicosocial y SG-SST (Seguridad y Salud en el Trabajo).
Genera un Caso de Seguimiento SG-SST (Confidencial) 100% DINÁMICO y PERSONALIZADO para un trabajador ${areaText} que reportó los siguientes factores de estrés: ${factorsText}.
Reglas:
1. No usar plantillas genéricas. Redacta 1 o 2 recomendaciones de intervención organizacionales muy concretas y variadas para la empresa y área.
2. Mantener confidencialidad total.
Formato (texto plano, 3 viñetas):
📋 Caso de Seguimiento SG-SST (Confidencial):
• Factores de Riesgo Laboral: [Resumen conciso de factores detectados]
• Recomendación de Intervención: [Recomendaciones preventivas concretas para la empresa o supervisores]
• Orientación Brindada: El colaborador completó una sesión privada de orientación emocional y autocuidado con el Terapeuta en Salud Mental.`;

              const res = await genModel.generateContent(prompt);
              const text = res?.response?.text ? res.response.text().trim() : '';
              if (text && text.includes('Caso de Seguimiento')) {
                rec.details = text.replace(/• Recomendación de Intervención SST:/g, '• Recomendación de Intervención:');
                await rec.save();
                aiSuccess = true;
              }
            } catch (err) {}
          }

          if (!aiSuccess) {
            const recs = [];
            if ((rec.stressors || []).includes('sobrecarga')) recs.push(`Efectuar un balanceo de cargas laborales y revisar la curva de entregables ${areaText}`);
            if ((rec.stressors || []).includes('liderazgo')) recs.push(`Facilitar dinámicas de retroalimentación constructiva y liderazgo participativo`);
            if ((rec.stressors || []).includes('entorno')) recs.push(`Auditar los puestos de trabajo ${areaText} para corregir factores ergonómicos o déficit de herramientas`);
            if ((rec.stressors || []).includes('personal')) recs.push(`Articular con bienestar opciones de flexibilidad horaria o apoyo psicosocial`);
            if ((rec.stressors || []).includes('funciones')) recs.push(`Revisar la matriz de roles y responsabilidades para evitar duplicidad de tareas`);
            if ((rec.stressors || []).includes('fatiga')) recs.push(`Establecer alertas de sobretiempo y jornadas de pausas psicofisiológicas dirigidas`);
            if (recs.length === 0) recs.push(`Monitorear periódicamente factores de riesgo psicosocial y verificar cumplimiento de pausas activas ${areaText}`);

            rec.details =
              `📋 Caso de Seguimiento SG-SST (Confidencial):\n` +
              `• Factores de Riesgo Laboral: ${factorsText}.\n` +
              `• Recomendación de Intervención: ${recs.slice(0, 2).join('. ') + '.'}\n` +
              `• Orientación Brindada: El colaborador completó una sesión privada de orientación emocional con el Terapeuta en Salud Mental.`;
            await rec.save();
          }
        }
        console.log(`   🔒 Se transformaron ${recordsToProcess.length} registros con recomendaciones de intervención dinámicas por IA.`);
      }
    }
  } catch (err) {
    console.warn('⚠️ No se pudo sanitizar telemetría previa:', err.message);
  }

  // 7. Sincronización de Planes WAPPY (Precios y Visibilidad)
  try {
    const Plan = mongoose.models.Plan || require(path.resolve(__dirname, '../models/Plan'));
    await Plan.updateOne(
      { planId: 'ipevar' },
      {
        $set: {
          name: 'Wappy Vital',
          prices: {
            monthly: 119000,
            quarterly: 345000,
            semiannual: 669000,
            annual: 1190000,
            lifetime: 100000,
          },
          promotions: {
            monthly: { active: false, text: '', discountPercentage: 0 },
            quarterly: { active: true, text: 'Ahorra 10%', discountPercentage: 10 },
            semiannual: { active: true, text: 'Ahorra 20%', discountPercentage: 20 },
            annual: { active: true, text: 'Ahorra 30%', discountPercentage: 30 },
            lifetime: { active: false, text: '', discountPercentage: 0 },
          },
          featuresText: [
            'Acceso a Huella Biocéntrica',
            'Matriz Bio-IPEVR (GTC 45) con IA',
            'Perfiles de Cargo y Trabajadores',
            'Evaluaciones Médicas Ocupacionales',
            'Generación de reportes PDF',
          ],
        },
      },
      { upsert: true }
    );

    await Plan.updateOne(
      { planId: 'pro' },
      {
        $set: {
          name: 'Pro',
          prices: {
            monthly: 179000,
            quarterly: 518600,
            semiannual: 1005000,
            annual: 1790000,
          },
          promotions: {
            monthly: { active: false, text: '', discountPercentage: 0 },
            quarterly: { active: true, text: 'Ahorra 10%', discountPercentage: 10 },
            semiannual: { active: true, text: 'Ahorra 20%', discountPercentage: 20 },
            annual: { active: true, text: 'Ahorra 30%', discountPercentage: 30 },
          },
        },
      },
      { upsert: true }
    );

    await Plan.updateOne(
      { planId: '__visibility__' },
      {
        $set: {
          'visibility.showPlanFree': false,
          'visibility.showPlanGo': false,
          'visibility.showPlanPlus': false,
          'visibility.showPlanPro': true,
          'visibility.showSectionAppPlans': true,
          'visibility.showSectionCustomPlan': false,
          'visibility.showSectionEnterprise': false,
        },
      },
      { upsert: true }
    );
    console.log('✅ Planes Wappy Pro y Wappy Vital sincronizados con precios oficiales y promociones en MongoDB.');
  } catch (err) {
    console.error('⚠️ Error sincronizando Planes WAPPY en MongoDB:', err.message);
  }

  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB.');

  // Ejecutar restauración de imágenes de cursos y blog
  try {
    const { execSync } = require('child_process');
    console.log('🔄 Ejecutando restauración de imágenes de LMS y Blog...');
    execSync(`node "${path.join(__dirname, 'restore-lms-images.js')}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error('⚠️ Error ejecutando la restauración de imágenes de LMS y Blog:', err.message);
  }

  // Ejecutar limpieza de memorias empresa_sgsst duplicadas
  try {
    const { execSync } = require('child_process');
    const localScript = path.resolve(__dirname, 'fix-duplicate-empresa-memories.js');
    const rootScript = path.resolve(__dirname, '../../scripts/fix-duplicate-empresa-memories.js');
    const cleanupScript = fs.existsSync(localScript) ? localScript : (fs.existsSync(rootScript) ? rootScript : null);
    if (cleanupScript) {
      console.log('🧹 Ejecutando limpieza de memorias empresa_sgsst duplicadas...');
      execSync(`node "${cleanupScript}"`, { stdio: 'inherit' });
    }
  } catch (err) {
    console.error('⚠️ Error ejecutando la limpieza de memorias duplicadas:', err.message);
  }

  // Ejecutar parche de optimización HuggingFace TEI Reranker y Búsqueda Limpia
  try {
    const { execSync } = require('child_process');
    const localPatch = path.resolve(__dirname, 'patch-reranker-tei.js');
    const rootPatch = path.resolve(__dirname, '../../scripts/patch-reranker-tei.js');
    const patchScript = fs.existsSync(localPatch) ? localPatch : (fs.existsSync(rootPatch) ? rootPatch : null);
    if (patchScript) {
      console.log('⚡ Aplicando optimización de Reranker HuggingFace TEI y Búsqueda Limpia...');
      execSync(`node "${patchScript}"`, { stdio: 'inherit' });
    }
  } catch (err) {
    console.error('⚠️ Error ejecutando el parche de Reranker TEI:', err.message);
  }

  // Ejecutar parche de Google Generative AI (Stream Parser & Unhandled Rejection Fix)
  try {
    const { execSync } = require('child_process');
    const localGooglePatch = path.resolve(__dirname, 'patch-google-genai.js');
    const rootGooglePatch = path.resolve(__dirname, '../../scripts/patch-google-genai.js');
    const googlePatchScript = fs.existsSync(localGooglePatch) ? localGooglePatch : (fs.existsSync(rootGooglePatch) ? rootGooglePatch : null);
    if (googlePatchScript) {
      console.log('⚡ Aplicando optimización y corrección de streaming para @google/generative-ai...');
      execSync(`node "${googlePatchScript}"`, { stdio: 'inherit' });
    }
  } catch (err) {
    console.error('⚠️ Error ejecutando el parche de @google/generative-ai:', err.message);
  }

  // ⛔ ELIMINADO (2026-10-08): restore-sgsst-workers.js mezclaba los trabajadores de TODAS las
  // empresas de un mismo usuario (agrupaba por `user` ignorando `companyId`) y sobrescribía cada
  // perfil sociodemográfico. NUNCA reintroducir una reconciliación de trabajadores que no filtre
  // estrictamente por { user, companyId }.

  // Sincronizar perfiles y sesiones de Google NotebookLM desde MongoDB a disco
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    const NotebookSessionSchema = new mongoose.Schema({
      user: mongoose.Schema.Types.ObjectId,
      email: String,
      cookies: [mongoose.Schema.Types.Mixed],
      cookieCount: Number,
    }, { strict: false, collection: 'notebooksessions' });
    const NotebookSessionModel = mongoose.models.NotebookSession || mongoose.model('NotebookSession', NotebookSessionSchema);

    const sessions = await NotebookSessionModel.find({}).lean();
    if (sessions && sessions.length > 0) {
      console.log(`📚 Sincronizando ${sessions.length} sesiones de NotebookLM a disco...`);
      const targetDirs = [
        path.resolve(__dirname, '../../config/notebooklm/profiles'),
        '/root/.notebooklm/profiles',
      ];

      for (const s of sessions) {
        if (!s.user || !s.cookies || s.cookies.length === 0) continue;
        const cleanId = String(s.user).replace(/[^a-zA-Z0-9_-]/g, '');
        const profileFolder = `user_${cleanId}`;

        const storageData = {
          cookies: s.cookies,
          origins: [],
          notebooklm: {
            version: 1,
            account: {
              authuser: 0,
              email: s.email || `${cleanId}@wappy.internal`,
            },
          },
        };

        for (const baseDir of targetDirs) {
          try {
            const userDir = path.join(baseDir, profileFolder);
            if (!fs.existsSync(userDir)) {
              fs.mkdirSync(userDir, { recursive: true });
            }
            const targetFile = path.join(userDir, 'storage_state.json');
            fs.writeFileSync(targetFile, JSON.stringify(storageData, null, 2), { mode: 0o600 });
            console.log(`   ✓ Perfil ${profileFolder} sincronizado en ${targetFile} (${s.cookies.length} cookies)`);
          } catch (writeErr) {
            // Ignorar si no existe la ruta de sistema
          }
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Error sincronizando perfiles de NotebookLM:', err.message);
  }

  // ── 7. Sincronizar Servicios Oficiales del Marketplace (Empresa, Automatizaciones, Subusuarios y Curso Adelanto) ──
  try {
    const MarketplaceCategory = require('../models/MarketplaceCategory');
    const MarketplaceProduct = require('../models/MarketplaceProduct');

    await MarketplaceCategory.findOneAndUpdate(
      { slug: 'complementos_wappy' },
      {
        $set: {
          name: 'Complementos WAPPY',
          slug: 'complementos_wappy',
          description: 'Empresas adicionales, automatizaciones 24/7 y cupos de subusuarios para tu cuenta',
          icon: 'Sparkles',
          order: 0,
          active: true
        }
      },
      { upsert: true, new: true }
    );

    const addonProducts = [
      {
        title: 'Adquirir Empresa Adicional (+2 GB Cloud)',
        slug: 'cupo-empresa-adicional-wappy',
        sku: 'WAPPY-ADDON-EMPRESA',
        shortDescription: 'Amplía tu capacidad multi-empresa en WAPPY (Somos SST o Huella Biocéntrica). Incluye +1 empresa gestionable y +2 GB de almacenamiento en la nube.',
        description: 'Agrega empresas adicionales a tu cuenta de WAPPY Pro o WAPPY Vital para gestionar múltiples clientes, razones sociales o sedes independientes con separación total de trabajadores, matrices, indicadores y documentos. Cada cupo de empresa adicional incluye +2 GB extra de almacenamiento seguro en la nube.',
        category: 'complementos_wappy',
        tags: ['Empresa Adicional', 'Multi-empresa', 'Almacenamiento Cloud', 'Complemento WAPPY'],
        serviceType: 'service_virtual',
        regularPrice: 33350,
        salePrice: 0,
        hasDiscount: false,
        hasVariants: true,
        variants: [
          {
            name: 'Periodicidad del Cupo',
            options: [
              { label: 'Mensual ($33.350 COP / empresa)', priceDelta: 0, isDefault: true },
              { label: 'Trimestral ($96.620 COP / empresa)', priceDelta: 63270, isDefault: false },
              { label: 'Semestral ($187.240 COP / empresa)', priceDelta: 153890, isDefault: false },
              { label: 'Anual ($350.000 COP / empresa)', priceDelta: 316650, isDefault: false }
            ]
          }
        ],
        estimatedDeliveryDays: 'Activación automática e inmediata al aprobarse el pago',
        deliverables: [
          'Habilitación inmediata de +1 cupo de empresa adicional en tu cuenta WAPPY',
          'Ampliación automática de +2 GB de almacenamiento en la nube por cada empresa adquirida',
          'Gestión independiente de trabajadores, matrices, documentos y reportes por NIT'
        ],
        requirements: [
          'Contar con una cuenta activa en WAPPY (Plan Wappy Pro o Wappy Vital)'
        ],
        faqs: [
          {
            question: '¿Cómo se activa el cupo en mi cuenta?',
            answer: 'Una vez aprobado el pago en Wompi (o validada la transferencia), el sistema incrementa automáticamente el límite de empresas y el almacenamiento (+2 GB) en tu cuenta.'
          },
          {
            question: '¿Puedo comprar varias empresas a la vez?',
            answer: 'Sí. Puedes ajustar la cantidad en el carrito de compras (1, 2, 5 o más empresas) y seleccionar la periodicidad que prefieras (Mensual, Trimestral, Semestral o Anual).'
          }
        ],
        featuredImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
        status: 'published',
        isFeatured: false,
        isTest: false,
        stockType: 'unlimited',
        availableSlots: 0,
        rating: 5.0,
        reviewsCount: 19,
        paymentRecipient: 'WAPPY'
      },
      {
        title: 'Adquirir Automatización 24/7 con Agentes IA',
        slug: 'cupo-automatizacion-ia-wappy',
        sku: 'WAPPY-ADDON-AUTOMATIZACION',
        shortDescription: 'Añade tareas programadas y agentes autónomos 24/7 adicionales en el Centro de Control para monitorear cronogramas, matrices, vencimientos y reportes.',
        description: 'Expande la capacidad de automatización autónoma de tu cuenta WAPPY. Cada cupo adicional te permite programar un nuevo flujo automático 24/7 con cualquiera de los 12 Agentes Especialistas SST (auditoría de vencimientos, seguimiento al Plan Anual de Trabajo, alertas de matriz legal, boletines preventivos y reportes ejecutivos en el Centro de Control).',
        category: 'complementos_wappy',
        tags: ['Automatizaciones', 'Agentes IA 24/7', 'Centro de Control', 'Complemento WAPPY'],
        serviceType: 'service_virtual',
        regularPrice: 25000,
        salePrice: 0,
        hasDiscount: false,
        hasVariants: true,
        variants: [
          {
            name: 'Periodicidad del Cupo',
            options: [
              { label: 'Mensual ($25.000 COP / automatización)', priceDelta: 0, isDefault: true },
              { label: 'Trimestral ($67.500 COP / automatización)', priceDelta: 42500, isDefault: false },
              { label: 'Semestral ($120.000 COP / automatización)', priceDelta: 95000, isDefault: false },
              { label: 'Anual ($210.000 COP / automatización)', priceDelta: 185000, isDefault: false }
            ]
          }
        ],
        estimatedDeliveryDays: 'Activación automática e inmediata al aprobarse el pago',
        deliverables: [
          'Habilitación inmediata de +1 cupo de Automatización 24/7 en el Centro de Control',
          'Ejecución programada (diaria, semanal o mensual) con cualquiera de los 12 especialistas IA',
          'Historial completo de ejecuciones y reportes automáticos en tu cuenta'
        ],
        requirements: [
          'Contar con una cuenta activa en WAPPY'
        ],
        faqs: [
          {
            question: '¿Para qué sirve un cupo de automatización adicional?',
            answer: 'Te permite tener múltiples agentes trabajando en segundo plano 24/7 para distintas empresas o procesos (por ejemplo, un agente vigilando el cronograma de capacitación y otro auditando vencimientos de equipos o exámenes médicos).'
          },
          {
            question: '¿Se activa automáticamente tras el pago?',
            answer: 'Sí, al aprobarse la transacción el cupo se suma de inmediato a tu límite de automatizaciones en el Centro de Control.'
          }
        ],
        featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
        status: 'published',
        isFeatured: false,
        isTest: false,
        stockType: 'unlimited',
        availableSlots: 0,
        rating: 5.0,
        reviewsCount: 15,
        paymentRecipient: 'WAPPY'
      },
      {
        title: 'Adquirir Subusuario Adicional (Colaborador / Asistente SST)',
        slug: 'cupo-subusuario-adicional-wappy',
        sku: 'WAPPY-ADDON-SUBUSUARIO',
        shortDescription: 'Delega la operación SST en tu equipo de trabajo, inspectores de campo o miembros del COPASST con cuentas de subusuario y permisos granulares por empresa.',
        description: 'Agrega cupos de subusuarios operativos a tu cuenta principal de WAPPY sin compartir tus credenciales de administrador. Ideal para auxiliares SST, inspectores de campo, coordinadores de sede o líderes del COPASST. Tú decides exactamente a qué empresa y a qué módulos tiene acceso cada subusuario.',
        category: 'complementos_wappy',
        tags: ['Subusuarios', 'Equipo SST', 'COPASST', 'Inspectores', 'Complemento WAPPY'],
        serviceType: 'service_virtual',
        regularPrice: 25000,
        salePrice: 0,
        hasDiscount: false,
        hasVariants: true,
        variants: [
          {
            name: 'Periodicidad del Cupo',
            options: [
              { label: 'Mensual ($25.000 COP / subusuario)', priceDelta: 0, isDefault: true },
              { label: 'Trimestral ($67.500 COP / subusuario)', priceDelta: 42500, isDefault: false },
              { label: 'Semestral ($120.000 COP / subusuario)', priceDelta: 95000, isDefault: false },
              { label: 'Anual ($210.000 COP / subusuario)', priceDelta: 185000, isDefault: false }
            ]
          }
        ],
        estimatedDeliveryDays: 'Activación automática e inmediata al aprobarse el pago',
        deliverables: [
          'Habilitación inmediata de +1 cupo de Subusuario operativo en tu cuenta',
          'Panel de control de permisos granulares por módulo y asignación por empresa',
          'Acceso independiente con correo y contraseña propios para tu colaborador'
        ],
        requirements: [
          'Contar con una cuenta titular activa en WAPPY'
        ],
        faqs: [
          {
            question: '¿Qué permisos puedo asignarle a un subusuario?',
            answer: 'Desde el gestor de subusuarios puedes elegir qué empresa gestionará y a qué aplicativos tendrá acceso (inspecciones, entrega de EPP, matriz de peligros, perfil sociodemográfico, capacitaciones, etc.).'
          },
          {
            question: '¿Cuándo queda disponible el cupo?',
            answer: 'Inmediatamente después de que el pago es aprobado por la pasarela Wompi o confirmado por administración.'
          }
        ],
        featuredImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
        status: 'published',
        isFeatured: false,
        isTest: false,
        stockType: 'unlimited',
        availableSlots: 0,
        rating: 5.0,
        reviewsCount: 14,
        paymentRecipient: 'WAPPY'
      }
    ];

    for (const addon of addonProducts) {
      await MarketplaceProduct.findOneAndUpdate(
        { slug: addon.slug },
        { $setOnInsert: addon },
        { upsert: true, new: true }
      );
    }

    // Limpiar el destacado automático de los productos de prueba y complementos para que solo queden destacados los que el Admin elija
    await MarketplaceProduct.updateMany(
      {
        slug: {
          $in: [
            'cupo-empresa-adicional-wappy',
            'cupo-automatizacion-ia-wappy',
            'cupo-subusuario-adicional-wappy',
            'bateria-riesgo-psicosocial-completa',
            'matriz-ipevar-gtc45-asistida',
            'diseno-implementacion-pesv',
            'paquete-examenes-medicos-ocupacionales-10',
            'estudio-puesto-trabajo-ergonomico',
            'auditoria-externa-estandares-minimos-0312',
            'investigacion-tecnica-accidente-trabajo-atel'
          ]
        }
      },
      { $set: { isFeatured: false } }
    );

    // Restaurar Curso Adelanto (Mauricio Posada) como publicado
    await MarketplaceProduct.updateOne(
      { slug: 'curso-adelanto' },
      { $set: { status: 'published', isTest: false } }
    );

    console.log('🛒 Servicios de Complementos WAPPY (Empresa, Automatizaciones, Subusuarios) y Curso de Mauricio sincronizados en Marketplace.');
  } catch (err) {
    console.error('⚠️ Error sincronizando Marketplace:', err.message);
  }

  // Sembrar 2 ejemplos de automatizaciones Drive -> Somos SST exclusivamente para cuentas ADMIN
  try {
    const Automation = require('../models/Automation');
    const AutomationLog = require('../models/AutomationLog');
    const CompanyInfo = require('../models/CompanyInfo');

    const adminUsers = await User.find({ role: 'ADMIN' }).lean();
    const medicoAgent = await Agent.findOne({ name: /Médico Laboral|Consultor SG-SST/i }).lean();
    const consultorAgent = await Agent.findOne({ name: /Consultor SG-SST/i }).lean();

    const agent1Id = medicoAgent?.id || 'agent_medico_laboral';
    const agent1Name = medicoAgent?.name || 'Médico Laboral';
    const agent2Id = consultorAgent?.id || 'agent_consultor_sg_sst';
    const agent2Name = consultorAgent?.name || 'Consultor SG-SST';

    const sample1RunAt = new Date(Date.now() - 2 * 3600 * 1000);
    const sample2RunAt = new Date(Date.now() - 14 * 3600 * 1000);
    const nextRunEvening = new Date(Date.now() + 16 * 3600 * 1000);
    const nextRunMorning = new Date(Date.now() + 8 * 3600 * 1000);

    const sample1Result = `### 📂 Sincronización Google Drive → Perfil Sociodemográfico y Exámenes Médicos (Somos SST)

**Carpeta vigilada en Google Drive:** \`SG-SST / Perfil Sociodemográfico y EMO\`
**Herramientas ejecutadas:** \`google_drive\` (\`list_files_and_folders\`, \`read_document_content\`) → \`somos_sst\` (\`alimentar_sociodemografico_masivo\`, \`actualizar_examen_medico\`)

| Archivo Detectado en Drive | Novedad Identificada | Aplicativo Alimentado en WAPPY | Estado de Sincronización |
| :--- | :--- | :--- | :---: |
| \`Actualizacion_Sociodemografica_Octubre.xlsx\` | 4 colaboradores actualizaron dirección, EPS, turno de trabajo y contacto de emergencia | **Hito 2: Perfil Sociodemográfico y Condiciones de Salud** | ✅ Sincronizado (4 perfiles actualizados) |
| \`Concepto_Aptitud_Carlos_Ramirez.pdf\` | Examen médico periódico con recomendación ergonómica postural | **Hito 2: Seguimiento de Exámenes Médicos Ocupacionales** | ✅ Registrado + Alerta en Centro de Control |

> **Dictamen del Agente:** Se compararon las marcas de tiempo y cédulas contra la base de datos de **Somos SST**. Los 4 expedientes modificados en el archivo de Drive y el concepto médico ocupacional ya quedaron asentados automáticamente en los aplicativos correspondientes sin duplicar registros.`;

    const sample2Result = `### 🚨 Vigilancia de Carpeta Drive → Aplicativos de Accidentes (ATEL), Inspecciones y Actos Inseguros

**Carpeta vigilada en Google Drive:** \`SG-SST / Reportes de Campo, Inspecciones y ATEL\`
**Herramientas ejecutadas:** \`google_drive\` (\`list_files_and_folders\`, \`read_document_content\`) → \`somos_sst\` (\`registrar_accidente_atel\`, \`editar_cualquier_aplicativo\`, \`crear_actividad_acpm\`)

* **1. Reporte de Accidente / Incidente detectado:** \`FURAT_Preliminar_Bodega_Norte.pdf\`
  * **Acción ejecutada en WAPPY:** Se extrajo la información del suceso (lesión leve en mano derecha por manipulación de estiba, 2 días de incapacidad) y se alimentó automáticamente el **Aplicativo de Investigación de Accidentes e Incidentes (ATEL — Hito 7)** mediante \`registrar_accidente_atel\`.
* **2. Reporte de Actos y Condiciones Inseguras:** \`Inspeccion_Locativa_y_Actos_Semana42.xlsx\`
  * **Acción ejecutada en WAPPY:** Se identificaron 2 condiciones locativas (cableado expuesto en pasillo 3 y extintor multipropósito despresurizado) y se inyectaron en el **Aplicativo de Reporte de Actos y Condiciones Inseguras (Hito 4)** y **Plan de Acción ACPM (Centro de Control)**.

\`\`\`wappy-card
{
  "title": "Automatización Drive → Aplicativos WAPPY Completada",
  "subtitle": "2 archivos nuevos procesados e inyectados en Somos SST",
  "items": [
    {
      "title": "Aplicativo ATEL (Hito 7)",
      "description": "1 nuevo caso de accidente de trabajo registrado desde FURAT_Preliminar_Bodega_Norte.pdf."
    },
    {
      "title": "Aplicativo Actos y Condiciones + ACPM (Hito 4)",
      "description": "2 hallazgos locativos cargados desde Inspeccion_Locativa_y_Actos_Semana42.xlsx con tarea correctiva asignada."
    }
  ]
}
\`\`\``;

    let seededCompanies = 0;
    for (const admin of adminUsers) {
      let company = await CompanyInfo.findOne({ user: admin._id, isActive: true }).lean();
      if (!company) {
        company = await CompanyInfo.findOne({ user: admin._id }).lean();
      }
      if (!company) continue;

      const companyId = company._id.toString();

      // Reemplazar los ejemplos anteriores [Ejemplo Admin] para que queden los nuevos orientados a Drive -> Somos SST
      const oldSamples = await Automation.find({
        companyId,
        name: /^\[Ejemplo Admin\]/i,
      }).select('_id').lean();
      if (oldSamples.length > 0) {
        const oldIds = oldSamples.map((s) => s._id);
        await AutomationLog.deleteMany({ automation: { $in: oldIds } });
        await Automation.deleteMany({ _id: { $in: oldIds } });
      }

      const adminEmail = admin.email ? [admin.email] : ['admin@wappy.club'];

      const auto1 = await Automation.create({
        user: admin._id,
        companyId,
        name: '[Ejemplo Admin] Vigilar Drive y Alimentar Perfil Sociodemográfico y Exámenes en Somos SST',
        agentId: agent1Id,
        agentName: agent1Name,
        prompt:
          'Conéctate a mi Google Drive usando la herramienta google_drive (list_files_and_folders y read_document_content) y revisa la carpeta o archivos recientes de "Perfil Sociodemográfico" y "Condiciones de Salud / Exámenes Médicos". Lee los documentos nuevos o actualizados (Excel, Google Sheets o PDF), identifica qué trabajadores tienen información nueva o modificada (datos sociodemográficos, condiciones de salud o conceptos de aptitud médica) y, con esa información extraída, ejecuta inmediatamente la herramienta somos_sst (acciones alimentar_sociodemografico_masivo, importar_sociodemografico_drive o actualizar_examen_medico) para actualizar directamente el aplicativo de Perfil Sociodemográfico y Condiciones de Salud en Somos SST. Al finalizar, entrégame un resumen detallado de los archivos leídos y los trabajadores actualizados.',
        scheduleType: 'daily',
        scheduleConfig: { hour: 18, minute: 0 },
        emails: adminEmail,
        status: 'active',
        lastRunAt: sample1RunAt,
        lastRunStatus: 'success',
        lastRunResult: sample1Result,
        nextRunAt: nextRunEvening,
      });

      const auto2 = await Automation.create({
        user: admin._id,
        companyId,
        name: '[Ejemplo Admin] Vigilar Drive y Registrar Accidentes ATEL, Inspecciones y Actos Inseguros',
        agentId: agent2Id,
        agentName: agent2Name,
        prompt:
          'Vigila en Google Drive (usando google_drive: list_files_and_folders y read_document_content) los archivos o carpetas donde se suban reportes de Accidentes/Incidentes de Trabajo (FURAT/ATEL), Inspecciones de Seguridad o Reportes de Actos y Condiciones Inseguras. Cuando detectes un archivo nuevo o actualizado: 1) Si contiene un accidente o incidente laboral nuevo, extrae todos los datos del evento (trabajador, fecha, gravedad, parte del cuerpo, días de incapacidad y descripción) y regístralo en el aplicativo de Accidentes ATEL de Somos SST usando somos_sst (acción registrar_accidente_atel). 2) Si contiene actos/condiciones inseguras o hallazgos de inspecciones, aliméntalos en el aplicativo correspondiente de Somos SST usando somos_sst (acción editar_cualquier_aplicativo con nombre_aplicativo="actos" o "auditoria" y crear_actividad_acpm en el Centro de Control). Genera un informe con cada registro inyectado en los aplicativos.',
        scheduleType: 'daily',
        scheduleConfig: { hour: 7, minute: 30 },
        emails: adminEmail,
        status: 'active',
        lastRunAt: sample2RunAt,
        lastRunStatus: 'success',
        lastRunResult: sample2Result,
        nextRunAt: nextRunMorning,
      });

      await AutomationLog.insertMany([
        {
          automation: auto1._id,
          user: admin._id,
          companyId,
          agentId: agent1Id,
          agentName: agent1Name,
          prompt: auto1.prompt,
          runAt: sample1RunAt,
          status: 'success',
          result: sample1Result,
        },
        {
          automation: auto2._id,
          user: admin._id,
          companyId,
          agentId: agent2Id,
          agentName: agent2Name,
          prompt: auto2.prompt,
          runAt: sample2RunAt,
          status: 'success',
          result: sample2Result,
        },
      ]);
      seededCompanies++;
    }
    console.log(`🤖 Automatizaciones Drive -> Somos SST para ADMIN sincronizadas (${seededCompanies} empresa(s)).`);
  } catch (err) {
    console.error('⚠️ Error sembrando automatizaciones de ejemplo para ADMIN:', err.message);
  }

  console.log('🎉 PROCESO COMPLETADO CON ÉXITO.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
