const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const { agentSchema } = require('@librechat/data-schemas');
const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);

const AGENT_FILE_MAP = {
  'abogado_laboral': 'Consultor Jurídico Laboral',
  'abogado_rit': 'Consultor Jurídico RIT',
  'abogado_procesos_disciplinarios': 'Consultor de Debido Proceso y Despidos',
  'abogado_acoso_sexual': 'Consultor de Protocolo de Acoso Sexual',
  'agente_sst': 'Consultor SG-SST',
  'asistente_ats': 'Gestor de Análisis de Trabajo Seguro (ATS)',
  'asistente_de_aci': 'Analista Predictivo ACI',
  'asistente_de_salud_mental': 'Consultor de Bienestar y Salud Mental',
  'asistente_en_capacitaciones': 'Gestor de Formación Continua',
  'asistente_en_nutricion': 'Consultor Nutricional Corporativo',
  'asistente_en_primeros_auxilios': 'Gestor Clínico de Primeros Auxilios',
  'asistente_inv_at': 'Analista Forense de Accidentalidad (AT)',
  'asistente_inv_el': 'Analista Forense de Enfermedad Laboral (EL)',
  'asistente_metodo_rosa': 'Analista Ergonómico ROSA',
  'analista_ipt_ergonomico': 'Inspector de Puesto de Trabajo (IPT)',
  'asistente_permiso_tsa': 'Gestor de Permisos de Trabajo (TSA)',
  'auditor_sg_sst': 'Auditor Integral SG-SST',
  'coordinador_ipevar': 'Especialista GTC-45 (Matriz IPEVAR)',
  'experto_en_emergencias': 'Especialista en Prevención y Emergencias',
  'experto_en_riesgo_biologico': 'Especialista en Riesgo Biológico',
  'experto_en_riesgo_electrico': 'Especialista en Riesgo Eléctrico',
  'experto_en_riesgo_quimico': 'Especialista en Riesgo Químico',
  'experto_en_riesgo_vial': 'Especialista en Riesgo Vial',
  'experto_en_tareas_de_alto_riesgo': 'Especialista en Tareas Críticas',
  'fisioterapeuta_laboral': 'Especialista en Biomecánica Laboral',
  'medico_laboral': 'Consultor Médico Ocupacional',
  'profesional_sst': 'Consultor Senior SG-SST',
  'psicologo_especialista_sst': 'Especialista en Riesgo Psicosocial',
  'redactor_blog': 'Estratega de Contenidos Corporativos',
  'gestor_gestion_ambiental': 'Consultor de Gestión Ambiental',
  'experto_mineria_subterranea': 'Especialista en Minería Subterránea y Alto Riesgo'
};

const AGENT_CATEGORY_MAP = {
  'profesional_sst': 'gestion_consultoria_sg_sst',
  'agente_sst': 'gestion_consultoria_sg_sst',
  'auditor_sg_sst': 'gestion_consultoria_sg_sst',
  'redactor_blog': 'gestion_consultoria_sg_sst',
  'abogado_laboral': 'legal_cumplimiento',
  'abogado_rit': 'legal_cumplimiento',
  'abogado_procesos_disciplinarios': 'legal_cumplimiento',
  'abogado_acoso_sexual': 'legal_cumplimiento',
  'coordinador_ipevar': 'especialistas_riesgos_especificos',
  'experto_en_riesgo_quimico': 'especialistas_riesgos_especificos',
  'experto_en_riesgo_electrico': 'especialistas_riesgos_especificos',
  'experto_en_riesgo_biologico': 'especialistas_riesgos_especificos',
  'experto_en_riesgo_vial': 'especialistas_riesgos_especificos',
  'experto_en_tareas_de_alto_riesgo': 'especialistas_riesgos_especificos',
  'experto_en_emergencias': 'especialistas_riesgos_especificos',
  'experto_mineria_subterranea': 'especialistas_riesgos_especificos',
  'asistente_inv_at': 'investigacion_inspeccion',
  'asistente_inv_el': 'investigacion_inspeccion',
  'asistente_de_aci': 'investigacion_inspeccion',
  'analista_ipt_ergonomico': 'investigacion_inspeccion',
  'simulador_accidentes': 'investigacion_inspeccion',
  'asistente_metodo_rosa': 'ergonomia_salud_bienestar',
  'fisioterapeuta_laboral': 'ergonomia_salud_bienestar',
  'medico_laboral': 'ergonomia_salud_bienestar',
  'psicologo_especialista_sst': 'ergonomia_salud_bienestar',
  'asistente_de_salud_mental': 'ergonomia_salud_bienestar',
  'asistente_en_nutricion': 'ergonomia_salud_bienestar',
  'asistente_en_primeros_auxilios': 'ergonomia_salud_bienestar',
  'asistente_ats': 'operaciones_campo_capacitacion',
  'asistente_permiso_tsa': 'operaciones_campo_capacitacion',
  'asistente_en_capacitaciones': 'operaciones_campo_capacitacion',
  'gestor_gestion_ambiental': 'gestion_ambiental'
};

async function sync() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
  console.log(`Connecting to MongoDB at: ${mongoUri}...`);
  await mongoose.connect(mongoUri);
  console.log('Connected successfully!');

  const agentsDir = path.resolve(__dirname, '../Agentes/Agentes Wappy');
  if (!fs.existsSync(agentsDir)) {
    console.error(`Directory not found: ${agentsDir}`);
    process.exit(1);
  }

  let successCount = 0;
  let noChangeCount = 0;
  let notFoundCount = 0;

  for (const [fileBasename, dbName] of Object.entries(AGENT_FILE_MAP)) {
    const filePath = path.join(agentsDir, `${fileBasename}.md`);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    const mdContent = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    const agent = await Agent.findOne({ name: dbName });

    if (!agent) {
      console.warn(`Agent not found in database: "${dbName}"`);
      notFoundCount++;
      continue;
    }

    const targetCategory = AGENT_CATEGORY_MAP[fileBasename] || 'general';

    if (agent.instructions === mdContent && agent.category === targetCategory) {
      console.log(`[NO_CHANGE] "${dbName}" - Instructions and category already matching.`);
      noChangeCount++;
      continue;
    }

    // Update agent instructions and category in database
    await Agent.findOneAndUpdate(
      { id: agent.id },
      { $set: { instructions: mdContent, category: targetCategory } }
    );
    console.log(`[SUCCESS] "${dbName}" - Instructions and category successfully synchronized.`);
    successCount++;
  }

  console.log(`\nSync summary:\n- Synchronized: ${successCount}\n- Unchanged: ${noChangeCount}\n- Not Found in DB: ${notFoundCount}`);
  process.exit(0);
}

sync().catch(err => {
  console.error('Critical sync failure:', err);
  process.exit(1);
});
