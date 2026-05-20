require('dotenv').config();
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/LibreChat';
process.env.MEILI_NO_SYNC = 'true';
const path = require('path');
const fs = require('fs');
const moduleAlias = require('module-alias');
moduleAlias.addAlias('~', path.resolve(__dirname, '../api'));
const { connectDb } = require('~/db');
const { Agent } = require('~/db/models');

// Map of all 25 agents (18 customizable + 7 protected)
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
  'psicologo_especialista_sst': 'Psicólog@ Especialista SST'
};

// 7 protected files that MUST NOT be touched
const PROTECTED_AGENTS = new Set([
  'abogado_rit',
  'asistente_ats',
  'asistente_de_aci',
  'asistente_inv_at',
  'asistente_inv_el',
  'asistente_metodo_rosa',
  'coordinador_ipevar'
]);

async function main() {
  try {
    console.log('Connecting to database...');
    await connectDb();
    console.log('Database connected successfully.');

    const agentsDir = path.resolve(__dirname, '../Agentes/Agentes Wappy');
    if (!fs.existsSync(agentsDir)) {
      throw new Error(`Directory not found: ${agentsDir}`);
    }

    let modifiedCount = 0;
    let untouchedCount = 0;

    for (const [basename, dbName] of Object.entries(AGENT_FILE_MAP)) {
      if (PROTECTED_AGENTS.has(basename)) {
        console.log(`[PROTECTED] Leaving agent completely untouched: ${basename}.md (${dbName})`);
        untouchedCount++;
        continue;
      }

      const filePath = path.join(agentsDir, `${basename}.md`);
      if (!fs.existsSync(filePath)) {
        console.warn(`[WARNING] Markdown file not found: ${filePath}`);
        continue;
      }

      const mdContent = fs.readFileSync(filePath, 'utf8');

      const targetHeader = '*** GESTIÓN DE ACTIVACIÓN MANUAL DE HERRAMIENTAS (CRÍTICO) ***';
      const nextHeader = '### ⚠️ INSTRUCCIÓN CRÍTICA DE VERIFICACIÓN ⚠️';

      const startIndex = mdContent.indexOf(targetHeader);
      if (startIndex === -1) {
        console.log(`[INFO] Agent ${basename}.md does not contain the manual tools section.`);
        continue;
      }

      const endIndex = mdContent.indexOf(nextHeader, startIndex);
      if (endIndex === -1) {
        console.warn(`[WARNING] Found manual tools header but not the next header in: ${basename}.md`);
        continue;
      }

      console.log(`[CLEANING] Cleaning manual tools section from ${basename}.md...`);
      const beforeSection = mdContent.substring(0, startIndex);
      const afterSection = mdContent.substring(endIndex);

      const cleanedContent = (beforeSection.trimEnd() + '\n\n' + afterSection.trimStart()).trim() + '\n';

      // 1. Write the clean markdown back locally
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      console.log(`[CLEANING] Successfully wrote cleaned local file: ${basename}.md`);

      // 2. Sychronize directly to the Agent collection in MongoDB
      const agentDoc = await Agent.findOne({ name: dbName });
      if (!agentDoc) {
        console.warn(`[WARNING] Agent not found in MongoDB for name: "${dbName}"`);
        continue;
      }

      await Agent.updateOne(
        { _id: agentDoc._id },
        { $set: { instructions: cleanedContent } }
      );
      console.log(`[SYNC] Sychronized "${dbName}" in MongoDB.`);
      modifiedCount++;
    }

    console.log('\n======================================');
    console.log(`Cleanup and Sychronization Summary:`);
    console.log(`- Successfully modified and synced: ${modifiedCount} agents.`);
    console.log(`- Protected agents left untouched: ${untouchedCount} agents.`);
    console.log('======================================');

    process.exit(0);
  } catch (error) {
    console.error('Critical error in cleanup and sync:', error);
    process.exit(1);
  }
}

main();
