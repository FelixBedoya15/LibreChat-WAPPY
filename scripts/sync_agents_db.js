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
  'redactor_blog': 'Estratega de Contenidos Corporativos'
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

    if (agent.instructions === mdContent) {
      console.log(`[NO_CHANGE] "${dbName}" - Instructions already matching.`);
      noChangeCount++;
      continue;
    }

    // Update agent instructions in database
    await Agent.findOneAndUpdate(
      { id: agent.id },
      { $set: { instructions: mdContent } }
    );
    console.log(`[SUCCESS] "${dbName}" - Instructions successfully synchronized.`);
    successCount++;
  }

  console.log(`\nSync summary:\n- Synchronized: ${successCount}\n- Unchanged: ${noChangeCount}\n- Not Found in DB: ${notFoundCount}`);
  process.exit(0);
}

sync().catch(err => {
  console.error('Critical sync failure:', err);
  process.exit(1);
});
