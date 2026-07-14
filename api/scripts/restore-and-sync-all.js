/**
 * Script Maestro para Restaurar el Coordinador de Capacitaciones y el Profesional SST,
 * Sincronizar todos los 21 agentes en MongoDB, Asignar Avatares y Compartirlos.
 * 
 * CONDICIÓN DE SEGURIDAD:
 * Respeta los avatares personalizados por el usuario. Si un agente ya tiene un avatar
 * asignado en la base de datos, NO se sobrescribe.
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
  avatar: mongoose.Schema.Types.Mixed
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

// Mapeos completos para los 21 agentes unificados
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
  'redactor_creativo': { name: 'Redactor Creativo', category: 'gestion_consultoria_sg_sst', avatar: 'formacion.png', desc: 'Soy tu Redactor Creativo. Te asesoro en la redacción, curaduría y optimización de contenidos técnicos y pedagógicos de SST para el Blog corporativo.', firstLine: 'Eres el Redactor Creativo de WAPPY IA...' },
  'simulador_accidentes': { name: 'Simulador de Accidentes SST', category: 'investigacion_inspeccion', avatar: 'reporte_actos.png', desc: 'Soy tu Simulador de Accidentes SST. Te ayudo a recrear escenarios de siniestros laborales para identificar causas raíz y entrenar a tu equipo en prevención.', firstLine: 'Eres el Simulador de Accidentes SST de WAPPY IA...' },
  'coordinador_capacitaciones': { name: 'Coordinador de Capacitaciones', category: 'gestion_consultoria_sg_sst', avatar: 'capacitaciones.png', desc: 'Soy tu Coordinador de Capacitaciones. Te asesoro en el diseño del Plan Anual de Capacitación (PAC), inducciones, charlas de 5 minutos y registro de asistencia.', firstLine: 'Eres el Coordinador de Capacitaciones de WAPPY IA...' }
};

// Asignación de Skills a los agentes maestros
const AGENT_SKILLS_MAP = {
  'Abogado Laboral': ['skill-acoso-sexual-violencia', 'skill-procesos-disciplinarios', 'skill-reglamento-interno-trabajo'],
  'Psicólogo SST': ['skill-acoso-sexual-violencia'],
  'Consultor SG-SST': ['skill-investigacion-accidentes', 'skill-investigacion-enfermedad', 'skill-analisis-causa-raiz', 'skill-formatos-sst', 'skill-gtc45-ipevar'],
  'Fisioterapeuta Laboral': ['skill-metodologia-rosa', 'skill-ergonomia-owas'],
  'Coordinador de Tareas Críticas': ['skill-ats-analisis', 'skill-permiso-alturas-tsa']
};

async function main() {
  console.log('🏁 Restaurando prompts limpios de Consultor SG-SST y Profesional SST...');

  // 1. Restaurar archivo de capacitaciones
  const backupCapFilePath = path.join(BACKUP_DIR, 'asistente_en_capacitaciones.md');
  const activeCapFilePath = path.join(AGENTES_DIR, 'coordinador_capacitaciones.md');
  if (fs.existsSync(backupCapFilePath)) {
    fs.copyFileSync(backupCapFilePath, activeCapFilePath);
    console.log('   🔄 Archivo de capacitaciones restaurado.');
  }

  // 2. Restaurar agente_sst.md como consultor_sg_sst.md y profesional_sst.md
  const backupSstFilePath = path.join(BACKUP_DIR, 'agente_sst.md');
  const activeSstFilePath = path.join(AGENTES_DIR, 'agente_sst.md');
  if (fs.existsSync(backupSstFilePath)) {
    fs.copyFileSync(backupSstFilePath, activeSstFilePath);
    console.log('   🔄 Prompt limpio de agente_sst.md restaurado en su ruta activa.');
  }

  const backupProfessionalSstPath = path.join(BACKUP_DIR, 'profesional_sst.md');
  const activeProfessionalSstPath = path.join(AGENTES_DIR, 'profesional_sst.md');
  if (fs.existsSync(backupProfessionalSstPath)) {
    fs.copyFileSync(backupProfessionalSstPath, activeProfessionalSstPath);
    console.log('   🔄 Prompt de profesional_sst.md restaurado en su ruta activa.');
  }

  // Eliminar el archivo temporal consultor_sg_sst.md si existe localmente
  const tempSstPath = path.join(AGENTES_DIR, 'consultor_sg_sst.md');
  if (fs.existsSync(tempSstPath)) {
    fs.unlinkSync(tempSstPath);
    console.log('   🗑️ Archivo temporal consultor_sg_sst.md eliminado.');
  }

  // 3. Generar skills desde los agentes del backup requeridos
  const skillsToGenerate = [
    { file: 'coordinador_ipevar.md', name: 'skill-gtc45-ipevar', triggers: ['ipevar', 'gtc45', 'matriz de peligros', 'valoracion de riesgos'] },
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
      console.log(`   ⚡ Skill generada: ${s.name}.md`);
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
  console.log('   💾 Copiados todos los avatares.');

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
  console.log('   ✍  Prompts locales actualizados.');

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

    // Herramientas en ensureAgentExists
    syncFileContent = syncFileContent.replace(
      /\} else if \(fileBasename === 'psicologo_sst'\) \{[\s\S]*?}/,
      `} else if (fileBasename === 'psicologo_sst') {
    tools.push('consultar_analitica_psicosocial', 'canvas');
  } else if (fileBasename === 'coordinador_seguridad_vial') {
    tools.push('matriz_pesv', 'canvas', 'context');
  } else if (fileBasename === 'ingeniero_quimico_sst') {
    tools.push('canvas');
  }`
    );

    fs.writeFileSync(SYNC_AGENTS_FILE, syncFileContent, 'utf8');
    console.log('   ✅ syncAgents.js actualizado.');
  }

  // 7. Base de Datos MongoDB
  await mongoose.connect(MONGO_URI);
  console.log('🔌 Conectado a MongoDB:', MONGO_URI);

  const adminUser = await User.findOne({ role: 'ADMIN' }) || await User.findOne({});
  const authorId = adminUser._id;
  const globalProject = await Project.findOne({ name: 'Global' }) || await Project.findOne({});
  const globalProjectId = globalProject ? globalProject._id.toString() : null;

  // Limpiar inactivos
  const activeNames = Object.values(AGENT_MAPS).map(m => m.name);
  const currentDbAgents = await Agent.find({});
  for (const agent of currentDbAgents) {
    if (!activeNames.includes(agent.name)) {
      await Agent.deleteOne({ _id: agent._id });
      if (globalProject) {
        await Project.findByIdAndUpdate(globalProject._id, { $pull: { agentIds: agent.id } });
      }
    }
  }

  // Sincronizar
  const allAgentIds = [];
  for (const [key, val] of Object.entries(AGENT_MAPS)) {
    const filePath = path.join(AGENTES_DIR, `${key}.md`);
    if (!fs.existsSync(filePath)) continue;

    const mdContent = fs.readFileSync(filePath, 'utf8');
    const tools = [];
    if (key === 'simulador_accidentes') tools.push('canvas');
    else if (key === 'psicologo_sst') tools.push('consultar_analitica_psicosocial', 'canvas');
    else if (key === 'coordinador_seguridad_vial') tools.push('matriz_pesv', 'canvas', 'context');
    else if (key === 'ingeniero_quimico_sst') tools.push('canvas');

    const defaultModel = key === 'psicologo_sst' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';

    let agent = await Agent.findOne({ name: val.name });
    
    // Decidir si asignamos avatar nuevo o respetamos el existente
    let finalAvatar = { filepath: `/images/${val.avatar}`, source: 'local' };
    if (agent && agent.avatar && agent.avatar.filepath) {
      console.log(`  🔒 Respetando avatar existente de "${val.name}":`, agent.avatar.filepath);
      finalAvatar = agent.avatar;
    }

    if (!agent) {
      const crypto = require('crypto');
      const agentId = crypto.randomUUID();
      const timestamp = new Date();

      agent = new Agent({
        id: agentId,
        name: val.name,
        description: val.desc,
        instructions: mdContent,
        provider: 'google',
        model: defaultModel,
        tools,
        category: val.category,
        author: authorId,
        skills: AGENT_SKILLS_MAP[val.name] || [],
        avatar: finalAvatar,
        projectIds: globalProjectId ? [globalProjectId] : [],
        versions: [{
          name: val.name,
          description: val.desc,
          instructions: mdContent,
          provider: 'google',
          model: defaultModel,
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
            instructions: mdContent,
            category: val.category,
            model: defaultModel,
            tools: tools,
            skills: AGENT_SKILLS_MAP[val.name] || [],
            avatar: finalAvatar,
            projectIds: globalProjectId ? [globalProjectId] : [],
            versions: [{
              name: val.name,
              description: val.desc,
              instructions: mdContent,
              provider: 'google',
              model: defaultModel,
              tools,
              createdAt: agent.createdAt || timestamp,
              updatedAt: timestamp
            }]
          }
        }
      );
      console.log(`  🔄 Actualizado agente en BD: "${val.name}"`);
    }
    allAgentIds.push(agent.id);
  }

  // Sincronizar en el proyecto Global
  if (globalProject) {
    await Project.updateOne(
      { _id: globalProject._id },
      { $addToSet: { agentIds: { $each: allAgentIds } } }
    );
  }

  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB.');
  console.log('🎉 PROCESO COMPLETADO CON ÉXITO.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
