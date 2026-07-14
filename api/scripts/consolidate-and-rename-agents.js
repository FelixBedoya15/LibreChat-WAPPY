/**
 * Script de Migración y Consolidación de Agentes y Skills en WAPPY IA.
 * 
 * Qué hace:
 * 1. Crea la carpeta de backup en 'Agentes/Agentes Wappy/backup_consolidacion' y mueve los agentes que se convierten en skills.
 * 2. Renombra y actualiza el contenido de los prompts .md activos con los nuevos nombres de cargo/profesión.
 * 3. Crea automáticamente los archivos de skill .md en 'api/config/skills/' a partir de los prompts de los agentes retirados (con scope: agents).
 * 4. Modifica 'api/server/routes/sgsst/syncAgents.js' para actualizar el mapeo AGENT_FILE_MAP y AGENT_CATEGORY_MAP.
 * 5. Realiza la limpieza en la base de datos MongoDB:
 *    - Elimina los agentes que pasan a ser skills (y limpia sus ACLs y relaciones con proyectos).
 *    - Elimina duplicados en conflicto (como la mezcla de agente_sst y profesional_sst).
 *    - Renombra y actualiza los agentes activos en la base de datos para que coincidan con la nueva estandarización.
 * 
 * Ejecutar con: node api/scripts/consolidate-and-rename-agents.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';
const AGENTES_DIR = path.resolve(__dirname, '../../Agentes/Agentes Wappy');
const BACKUP_DIR = path.join(AGENTES_DIR, 'backup_consolidacion');
const SKILLS_DIR = path.resolve(__dirname, '../../api/config/skills');
const SYNC_AGENTS_FILE = path.resolve(__dirname, '../../api/server/routes/sgsst/syncAgents.js');

// 1. Mapeo de archivos y sus nuevos nombres de cargo
const ACTIVE_AGENTS = {
  'abogado_laboral': { file: 'abogado_laboral.md', newName: 'Abogado Laboral', category: 'legal_cumplimiento', firstLine: 'Eres el Abogado Laboral de WAPPY IA...' },
  'medico_laboral': { file: 'medico_laboral.md', newName: 'Médico Laboral', category: 'ergonomia_salud_bienestar', firstLine: 'Eres el Médico Laboral de WAPPY IA...' },
  'profesional_sst': { file: 'consultor_sg_sst.md', newName: 'Consultor SG-SST', category: 'gestion_consultoria_sg_sst', firstLine: 'Eres el Consultor SG-SST de WAPPY IA...' },
  'fisioterapeuta_laboral': { file: 'fisioterapeuta_laboral.md', newName: 'Fisioterapeuta Laboral', category: 'ergonomia_salud_bienestar', firstLine: 'Eres el Fisioterapeuta Laboral de WAPPY IA...' },
  'psicologo_especialista_sst': { file: 'psicologo_sst.md', newName: 'Psicólogo SST', category: 'ergonomia_salud_bienestar', firstLine: 'Eres el Psicólogo SST de WAPPY IA...' },
  'asistente_de_salud_mental': { file: 'terapeuta_salud_mental.md', newName: 'Terapeuta en Salud Mental', category: 'ergonomia_salud_bienestar', firstLine: 'Eres el Terapeuta en Salud Mental de WAPPY IA...' },
  'asistente_en_nutricion': { file: 'nutricionista_laboral.md', newName: 'Nutricionista Laboral', category: 'ergonomia_salud_bienestar', firstLine: 'Eres la Nutricionista Laboral de WAPPY IA...' },
  'asistente_en_primeros_auxilios': { file: 'primer_respondiente.md', newName: 'Primer Respondiente', category: 'ergonomia_salud_bienestar', firstLine: 'Eres el Primer Respondiente de WAPPY IA...' },
  'experto_en_emergencias': { file: 'coordinador_emergencias.md', newName: 'Coordinador de Emergencias', category: 'especialistas_riesgos_especificos', firstLine: 'Eres el Coordinador de Emergencias de WAPPY IA...' },
  'experto_en_riesgo_biologico': { file: 'especialista_bioseguridad.md', newName: 'Especialista en Bioseguridad', category: 'especialistas_riesgos_especificos', firstLine: 'Eres el Especialista en Bioseguridad de WAPPY IA...' },
  'experto_en_riesgo_electrico': { file: 'ingeniero_electricista_sst.md', newName: 'Ingeniero Electricista SST', category: 'especialistas_riesgos_especificos', firstLine: 'Eres el Ingeniero Electricista SST de WAPPY IA...' },
  'experto_en_riesgo_quimico': { file: 'ingeniero_quimico_sst.md', newName: 'Ingeniero Químico SST', category: 'especialistas_riesgos_especificos', firstLine: 'Eres el Ingeniero Químico SST de WAPPY IA...' },
  'experto_en_riesgo_vial': { file: 'coordinador_seguridad_vial.md', newName: 'Coordinador de Seguridad Vial', category: 'especialistas_riesgos_especificos', firstLine: 'Eres el Coordinador de Seguridad Vial de WAPPY IA...' },
  'experto_en_tareas_de_alto_riesgo': { file: 'coordinador_tareas_criticas.md', newName: 'Coordinador de Tareas Críticas', category: 'especialistas_riesgos_especificos', firstLine: 'Eres el Coordinador de Tareas Críticas de WAPPY IA...' },
  'experto_mineria_subterranea': { file: 'ingeniero_minas_sst.md', newName: 'Ingeniero de Minas SST', category: 'especialistas_riesgos_especificos', firstLine: 'Eres el Ingeniero de Minas SST de WAPPY IA...' },
  'auditor_sg_sst': { file: 'auditor_sg_sst.md', newName: 'Auditor SG-SST', category: 'gestion_consultoria_sg_sst', firstLine: 'Eres el Auditor SG-SST de WAPPY IA...' },
  'gestor_gestion_ambiental': { file: 'ingeniero_ambiental.md', newName: 'Ingeniero Ambiental', category: 'gestion_ambiental', firstLine: 'Eres el Ingeniero Ambiental de WAPPY IA...' },
  'redactor_blog': { file: 'redactor_creativo.md', newName: 'Redactor Creativo', category: 'gestion_consultoria_sg_sst', firstLine: 'Eres el Redactor Creativo de WAPPY IA...' },
  'simulador_accidentes': { file: 'simulador_accidentes.md', newName: 'Simulador de Accidentes SST', category: 'investigacion_inspeccion', firstLine: 'Eres el Simulador de Accidentes SST de WAPPY IA...' }
};

// 2. Agentes obsoletos que pasan a ser skills
const SKILL_AGENTS = {
  'abogado_acoso_sexual': { name: 'skill-acoso-sexual-violencia', triggers: ['acoso sexual', 'violencia de genero', 'ley 2365', 'comite de convivencia', 'acoso laboral'] },
  'abogado_procesos_disciplinarios': { name: 'skill-procesos-disciplinarios', triggers: ['proceso disciplinario', 'descargos', 'memorando', 'sancion', 'falta grave'] },
  'abogado_rit': { name: 'skill-reglamento-interno-trabajo', triggers: ['reglamento interno', 'rit', 'jornada 42 horas', 'reforma laboral'] },
  'asistente_metodo_rosa': { name: 'skill-metodologia-rosa', triggers: ['metodo rosa', 'ergonomia oficina', 'puesto de oficina', 'silla ergonomica'] },
  'analista_ipt_ergonomico': { name: 'skill-ergonomia-owas', triggers: ['owas', 'carga postural', 'lumbalgia', 'postura forzada'] },
  'agente_creador_formatos_sst': { name: 'skill-formatos-sst', triggers: ['crear formato', 'plantilla sst', 'formato de entrega', 'lista de chequeo'] },
  'asistente_inv_at': { name: 'skill-investigacion-accidentes', triggers: ['accidente de trabajo', 'furat', 'arbol de causas', 'investigar accidente'] },
  'asistente_inv_el': { name: 'skill-investigacion-enfermedad', triggers: ['enfermedad laboral', 'furel', 'origen laboral', 'calificacion de origen'] },
  'asistente_de_aci': { name: 'skill-analisis-causa-raiz', triggers: ['causa raiz', '5 porques', 'diagrama de pescado', 'ishikawa'] }
};

// Agentes a retirar sin convertirse en skills (obsoletos)
const RETIRED_AGENTS = ['asistente_ats', 'asistente_permiso_tsa', 'coordinador_ipevar', 'agente_sst'];

async function main() {
  console.log('🚀 Iniciando proceso de consolidación y renombrado de Agentes...');

  // Asegurar directorios
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('📂 Carpeta de backup creada:', BACKUP_DIR);
  }
  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }

  // A. MIGRAR PROMPTS DE AGENTES OBSOLETOS A SKILLS MARKDOWN
  console.log('\n--- A. Generando Skills desde Agentes Retirados ---');
  for (const [basename, metadata] of Object.entries(SKILL_AGENTS)) {
    const agentFilePath = path.join(AGENTES_DIR, `${basename}.md`);
    if (fs.existsSync(agentFilePath)) {
      const originalPrompt = fs.readFileSync(agentFilePath, 'utf8');
      
      // Limpiar un poco el prompt original (quitar reglas críticas o tablas de chat si aplica)
      let cleanedPrompt = originalPrompt.replace(/🔹 \d+\. Formatos y Tablas[\s\S]*$/, '').trim();

      const skillFilePath = path.join(SKILLS_DIR, `${metadata.name}.md`);
      const yamlFrontmatter = `---
name: ${metadata.name}
description: Skill extraída del agente ${basename} para soporte técnico.
scope: agents
triggers:
${metadata.triggers.map(t => `  - ${t}`).join('\n')}
---

${cleanedPrompt}
`;
      fs.writeFileSync(skillFilePath, yamlFrontmatter, 'utf8');
      console.log(`✅ Skill creada: ${metadata.name}.md`);

      // Mover el archivo original al backup
      const backupPath = path.join(BACKUP_DIR, `${basename}.md`);
      fs.renameSync(agentFilePath, backupPath);
      console.log(`📦 Archivo original movido a backup: ${basename}.md`);
    } else {
      console.log(`⚠️ Archivo no encontrado para skill: ${basename}.md`);
    }
  }

  // B. MOVER AGENTES TOTALMENTE RETIRADOS AL BACKUP
  console.log('\n--- B. Retirando Agentes Obsoletos ---');
  for (const basename of RETIRED_AGENTS) {
    const agentFilePath = path.join(AGENTES_DIR, `${basename}.md`);
    if (fs.existsSync(agentFilePath)) {
      const backupPath = path.join(BACKUP_DIR, `${basename}.md`);
      fs.renameSync(agentFilePath, backupPath);
      console.log(`📦 Agente obsoleto retirado: ${basename}.md`);
    }
  }

  // C. ACTUALIZAR Y RENOMBRAR LOS ARCHIVOS MD DE LOS AGENTES ACTIVOS
  console.log('\n--- C. Actualizando Nombres y Prompts de Agentes Activos ---');
  for (const [oldBasename, data] of Object.entries(ACTIVE_AGENTS)) {
    const oldFilePath = path.join(AGENTES_DIR, `${oldBasename}.md`);
    const newFilePath = path.join(AGENTES_DIR, data.file);
    let targetFilePath = oldFilePath;

    if (fs.existsSync(oldFilePath)) {
      // Renombrar archivo si es necesario
      if (oldFilePath !== newFilePath) {
        fs.renameSync(oldFilePath, newFilePath);
        console.log(`🔄 Archivo renombrado: ${oldBasename}.md -> ${data.file}`);
      }
      targetFilePath = newFilePath;
    }

    if (fs.existsSync(targetFilePath)) {
      let promptContent = fs.readFileSync(targetFilePath, 'utf8');
      
      // Reemplazar la primera línea de rol
      const lines = promptContent.split('\n');
      if (lines.length > 0) {
        lines[0] = data.firstLine;
      }
      promptContent = lines.join('\n');

      fs.writeFileSync(targetFilePath, promptContent, 'utf8');
      console.log(`✍️  Instrucciones actualizadas en: ${data.file}`);
    } else {
      console.warn(`⚠️ Archivo activo no encontrado: ${data.file}`);
    }
  }

  // D. MODIFICAR EL ARCHIVO syncAgents.js CON EL NUEVO MAPEO
  console.log('\n--- D. Modificando syncAgents.js ---');
  if (fs.existsSync(SYNC_AGENTS_FILE)) {
    let syncFileContent = fs.readFileSync(SYNC_AGENTS_FILE, 'utf8');

    // Generar el bloque AGENT_FILE_MAP de reemplazo
    const fileMapLines = ['const AGENT_FILE_MAP = {'];
    const activeEntries = Object.entries(ACTIVE_AGENTS);
    activeEntries.forEach(([oldBasename, data], idx) => {
      const key = data.file.replace('.md', '');
      const comma = idx === activeEntries.length - 1 ? '' : ',';
      fileMapLines.push(`  '${key}': '${data.newName}'${comma}`);
    });
    fileMapLines.push('};');
    const newFileMapStr = fileMapLines.join('\n');

    // Generar el bloque AGENT_CATEGORY_MAP de reemplazo
    const categoryMapLines = ['const AGENT_CATEGORY_MAP = {'];
    activeEntries.forEach(([oldBasename, data], idx) => {
      const key = data.file.replace('.md', '');
      const comma = idx === activeEntries.length - 1 ? '' : ',';
      categoryMapLines.push(`  '${key}': '${data.category}'${comma}`);
    });
    categoryMapLines.push('};');
    const newCategoryMapStr = categoryMapLines.join('\n');

    // Reemplazar en el archivo usando expresiones regulares
    syncFileContent = syncFileContent.replace(/const AGENT_FILE_MAP = \{[\s\S]*?\};/, newFileMapStr);
    syncFileContent = syncFileContent.replace(/const AGENT_CATEGORY_MAP = \{[\s\S]*?\};/, newCategoryMapStr);

    fs.writeFileSync(SYNC_AGENTS_FILE, syncFileContent, 'utf8');
    console.log('✅ syncAgents.js actualizado con éxito.');
  } else {
    console.error('❌ No se encontró syncAgents.js en la ruta esperada.');
  }

  // E. ACTUALIZACIONES EN LA BASE DE DATOS MONGODB
  console.log('\n--- E. Sincronizando Base de Datos MongoDB ---');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB:', MONGO_URI);

    const AgentModel = mongoose.models.Agent || mongoose.model('Agent', new mongoose.Schema({}, { strict: false }));
    const ProjectModel = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
    const AclModel = mongoose.models.AclEntry || mongoose.model('AclEntry', new mongoose.Schema({}, { strict: false }));

    // 1. Eliminar de la base de datos los agentes obsoletos (incluyendo los que pasaron a ser skills)
    const oldNamesToDelete = [
      'Consultor de Debido Proceso y Despidos',
      'Consultor de Protocolo de Acoso Sexual',
      'Consultor Jurídico RIT',
      'Analista Ergonómico ROSA',
      'Inspector de Puesto de Trabajo (IPT)',
      'Gestor de Formación Continua',
      'Analista Forense de Accidentalidad (AT)',
      'Analista Forense de Enfermedad Laboral (EL)',
      'Analista Predictivo ACI',
      'Gestor de Análisis de Trabajo Seguro (ATS)',
      'Gestor de Permisos de Trabajo (TSA)',
      'Especialista GTC-45 (Matriz IPEVAR)',
      'Consultor SG-SST' // eliminamos el anterior simple 'agente_sst' para que no choque
    ];

    console.log('🧹 Limpiando registros antiguos de la Base de Datos...');
    for (const name of oldNamesToDelete) {
      const dbAgent = await AgentModel.findOne({ name });
      if (dbAgent) {
        // Eliminar del Proyecto Global
        await ProjectModel.updateMany({}, { $pull: { agentIds: dbAgent.id } });
        // Eliminar ACLs
        if (AclModel) {
          await AclModel.deleteMany({ resourceId: dbAgent._id });
        }
        // Eliminar Agente
        await AgentModel.deleteOne({ _id: dbAgent._id });
        console.log(`  🗑️  Agente eliminado: "${name}"`);
      }
    }

    // 2. Renombrar y actualizar los nombres en la base de datos para los agentes activos
    // Para evitar choques temporales, hacemos un mapeo con los IDs correspondientes
    console.log('🔄 Actualizando nombres de agentes activos...');
    
    // Mapeo inverso de nombres antiguos a nombres nuevos
    const dbRenameMap = {
      'Consultor Jurídico Laboral': 'Abogado Laboral',
      'Consultor Médico Ocupacional': 'Médico Laboral',
      'Consultor Senior SG-SST': 'Consultor SG-SST', // El Senior toma el nombre principal
      'Especialista en Biomecánica Laboral': 'Fisioterapeuta Laboral',
      'Especialista en Riesgo Psicosocial': 'Psicólogo SST',
      'Consultor de Bienestar y Salud Mental': 'Terapeuta en Salud Mental',
      'Consultor Nutricional Corporativo': 'Nutricionista Laboral',
      'Gestor Clínico de Primeros Auxilios': 'Primer Respondiente',
      'Especialista en Prevención y Emergencias': 'Coordinador de Emergencias',
      'Especialista en Riesgo Biológico': 'Especialista en Bioseguridad',
      'Especialista en Riesgo Eléctrico': 'Ingeniero Electricista SST',
      'Especialista en Riesgo Químico': 'Ingeniero Químico SST',
      'Especialista en Riesgo Vial': 'Coordinador de Seguridad Vial',
      'Especialista en Tareas Críticas': 'Coordinador de Tareas Críticas',
      'Especialista en Minería Subterránea y Alto Riesgo': 'Ingeniero de Minas SST',
      'Consultor de Gestión Ambiental': 'Ingeniero Ambiental',
      'Estratega de Contenidos Corporativos': 'Redactor Creativo'
    };

    for (const [oldName, newName] of Object.entries(dbRenameMap)) {
      const updated = await AgentModel.findOneAndUpdate(
        { name: oldName },
        { 
          $set: { 
            name: newName,
            description: `Agente SST: ${newName}`
          } 
        },
        { new: true }
      );
      if (updated) {
        console.log(`  ✅ Agente renombrado: "${oldName}" -> "${newName}"`);
      }
    }

    await mongoose.disconnect();
    console.log('✅ Base de datos desconectada.');
  } catch (dbErr) {
    console.error('❌ Error de Base de Datos:', dbErr);
  }

  console.log('\n🌟 PROCESO FINALIZADO EXITOSAMENTE.');
  console.log('Por favor, reinicia el servidor y ejecuta la sincronización (/api/sgsst/sync-agents/sync) desde la UI para re-escribir los prompts.');
}

main().catch(err => {
  console.error('❌ Falla crítica en el script:', err);
  process.exit(1);
});
