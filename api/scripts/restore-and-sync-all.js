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
  'consultar_agente_especializado'
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
    const searchWebRule = `\n\n⚠️ REGLA DE ORO DE BÚSQUEDA WEB: Al usar la búsqueda en la web, NUNCA busques con términos individuales o palabras sueltas (ej: "decreto", "incapacidad"). Debes redactar consultas específicas y compuestas en lenguaje natural que relacionen el contexto exacto (ej: "Decreto 780 de 2016 pago de incapacidades comunes colombia" o "estabilidad laboral reforzada Sentencia SU-111 de 2025"). No realices búsquedas en bucle de forma redundante; si tras 2 intentos no encuentras el dato específico, continúa con tu conocimiento y base interna.`;
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
    const formatVisualRule = `\n\n🔹 11. Reglas de Formato Visual (Tablas, Tarjetas y Documentos):
- **Tablas de Datos / Matrices:** Utiliza SIEMPRE tablas en formato Markdown estándar (ej: \`| Hito | Acción |\`). Está terminantemente PROHIBIDO escribir objetos JSON o bloques de código marcados con \`json\` para pintar tablas de filas y columnas, ya que no se renderizan y rompen la estética.
- **Tarjetas Interactivas (wappy-card):** Para checklists, cuadrículas, listas y métricas, utiliza exclusivamente el bloque de código \`wappy-card\` (con el JSON exacto en su interior como se indica en su regla de oro). NUNCA utilices el lenguaje de código \`json\` para englobar una tarjeta wappy-card.
- **Documentos y Cartas Formales:** Cuando la respuesta requiera redactar actas, reglamentos, contratos, citaciones a descargos o cartas extensas, está terminantemente PROHIBIDO escribir el documento extenso directamente en el chat de texto. En su lugar, DEBES llamar de manera autónoma a la herramienta \`canvas\` para crear o actualizar el documento en el editor lateral derecho. En el chat del usuario, limítate a resumir brevemente la acción realizada y los puntos clave.`;
    const conciseResponseRule = `\n\n⚠️ REGLA DE CONCISIÓN: Si la solicitud del usuario es un saludo, una pregunta corta o un cambio simple en algún editor o herramienta, responde directamente de forma concisa y sin extender tu proceso de razonamiento.`;
    
    const finalInstructions = mdContent + searchWebRule + wappyCardRule + formatVisualRule + conciseResponseRule;
    
    let tools = [...DEFAULT_TOOLS];
    
    // Asignación granular de herramientas específicas por especialidad
    const IPEVAR_AGENTS = [
      'abogado_laboral', 'medico_laboral', 'agente_sst', 'profesional_sst', 'auditor_sg_sst',
      'psicologo_sst', 'fisioterapeuta_laboral', 'ingeniero_quimico_sst', 'ingeniero_electricista_sst',
      'coordinador_tareas_criticas', 'coordinador_seguridad_vial', 'ingeniero_minas_sst',
      'especialista_bioseguridad', 'coordinador_emergencias', 'ingeniero_ambiental', 'especialista_riesgo_climatico'
    ];
    if (IPEVAR_AGENTS.includes(key)) {
      tools.push('matriz_ipevar');
    }
    
    if (key === 'abogado_laboral') {
      tools.push('editor_rit');
    }
    
    const PSICOSOCIAL_AGENTS = ['psicologo_sst', 'agente_sst', 'profesional_sst', 'auditor_sg_sst'];
    if (PSICOSOCIAL_AGENTS.includes(key)) {
      tools.push('consultar_analitica_psicosocial');
    }
    
    if (key === 'redactor_creativo') {
      tools.push('blog_editor');
    }
    
    const ACTOS_AGENTS = ['auditor_sg_sst', 'agente_sst', 'profesional_sst', 'ingeniero_ambiental', 'especialista_riesgo_climatico'];
    if (ACTOS_AGENTS.includes(key)) {
      tools.push('consultar_analitica_actos_condiciones');
    }

    tools = [...new Set(tools)];

    const defaultModel = key === 'psicologo_sst' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';

    let agent = await Agent.findOne({ name: val.name });
    const isNewAgent = !agent; // Indicador para saber si el agente es nuevo

    let finalAvatar = { filepath: `/images/${val.avatar}`, source: 'local' };
    if (agent && agent.avatar && agent.avatar.filepath) {
      finalAvatar = agent.avatar;
    }

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
          instructions: finalInstructions,
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
            instructions: finalInstructions,
            category: val.category,
            model: defaultModel,
            tools: tools,
            skills: AGENT_SKILLS_MAP[val.name] || [],
            avatar: finalAvatar,
            projectIds: globalProjectId ? [globalProjectId] : [],
            versions: [{
              name: val.name,
              description: val.desc,
              instructions: finalInstructions,
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

  // Pull deactivated tools from all agents in the database
  try {
    const pullRes = await Agent.updateMany({}, {
      $pull: {
        tools: { $in: ['matriz_pesv', 'matriz_compatibilidad', 'editor_live'] }
      }
    });
    console.log(`   🗑️ Removidas herramientas desactivadas (matriz_pesv, matriz_compatibilidad, editor_live) de todos los agentes en la BD: ${pullRes.modifiedCount} modificados.`);
  } catch (err) {
    console.error('⚠️ Error eliminando herramientas desactivadas:', err);
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

  console.log('🎉 PROCESO COMPLETADO CON ÉXITO.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
