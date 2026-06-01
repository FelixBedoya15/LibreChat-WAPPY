const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const { agentSchema } = require('@librechat/data-schemas');
const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);

const AGENT_FILE_MAP = {
  'abogado_laboral': 'Abogad@ Laboral',
  'abogado_rit': 'Abogad@ RIT',
  'agente_sst': 'Agente SST',
  'asistente_ats': 'Asistente ATS',
  'asistente_de_aci': 'Asistente de ACI',
  'asistente_de_salud_mental': 'Asistente de Salud Mental',
  'asistente_en_capacitaciones': 'Asistente en Capacitaciones ',
  'asistente_en_nutricion': 'Asistente en Nutrición',
  'asistente_en_primeros_auxilios': 'Asistente en Primeros Auxilios',
  'asistente_inv_at': 'Asistente Inv AT',
  'asistente_inv_el': 'Asistente Inv EL',
  'asistente_metodo_rosa': 'Asistente Metodo ROSA',
  'analista_ipt_ergonomico': 'Inspector de Puesto de Trabajo (IPT)',
  'asistente_permiso_tsa': 'Asistente Permiso TSA',
  'auditor_sg_sst': 'Auditor SG-SST',
  'coordinador_ipevar': 'Expert@ IPEVAR GTC-45',
  'experto_en_emergencias': 'Expert@ en Emergencias ',
  'experto_en_riesgo_biologico': 'Expert@ en Riesgo Biologico',
  'experto_en_riesgo_electrico': 'Expert@ en Riesgo Electrico',
  'experto_en_riesgo_quimico': 'Expert@ en Riesgo Quimico',
  'experto_en_riesgo_vial': 'Expert@ en Riesgo Vial ',
  'experto_en_tareas_de_alto_riesgo': 'Expert@ en Tareas de Alto Riesgo',
  'fisioterapeuta_laboral': 'Fisioterapeuta Laboral',
  'medico_laboral': 'Medic@ Laboral',
  'profesional_sst': 'Profesional SST',
  'psicologo_especialista_sst': 'Psicólog@ Especialista SST',
  'redactor_blog': 'Redactor de Blog'
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
