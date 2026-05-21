require('dotenv').config();
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/LibreChat';
process.env.MEILI_NO_SYNC = 'true';
const path = require('path');
const fs = require('fs');
const moduleAlias = require('module-alias');
moduleAlias.addAlias('~', path.resolve(__dirname, '../api'));
const { connectDb } = require('~/db');
const { Agent } = require('~/db/models');

const AGENT_FILE_MAP = {
  'abogado_laboral': 'Abogad@ Laboral',
  'agente_sst': 'Agente SST',
  'asistente_de_salud_mental': 'Asistente de Salud Mental',
  'asistente_en_capacitaciones': 'Asistente en Capacitaciones ',
  'asistente_en_nutricion': 'Asistente en Nutrición',
  'asistente_en_primeros_auxilios': 'Asistente en Primeros Auxilios',
  'asistente_permiso_tsa': 'Asistente Permiso TSA',
  'auditor_sg_sst': 'Auditor SG-SST',
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

async function main() {
  try {
    console.log('Iniciando conexion a MongoDB...');
    await connectDb();
    console.log('Conectado a MongoDB con exito.');

    const agentsDir = path.resolve(__dirname, '../Agentes/Agentes Wappy');
    if (!fs.existsSync(agentsDir)) {
      throw new Error(`Directorio de agentes no encontrado: ${agentsDir}`);
    }

    let successCount = 0;
    let warningCount = 0;

    for (const [basename, dbName] of Object.entries(AGENT_FILE_MAP)) {
      const filePath = path.join(agentsDir, `${basename}.md`);
      if (!fs.existsSync(filePath)) {
        console.warn(`[WARNING] Archivo Markdown no encontrado: ${filePath}`);
        warningCount++;
        continue;
      }

      const mdContent = fs.readFileSync(filePath, 'utf8');

      // Buscar si el agente existe en la base de datos
      const agentDoc = await Agent.findOne({ name: dbName });
      if (!agentDoc) {
        console.warn(`[WARNING] El agente "${dbName}" no fue encontrado en MongoDB.`);
        warningCount++;
        continue;
      }

      // Comparar el contenido antes de actualizar
      if (agentDoc.instructions === mdContent) {
        console.log(`[NO_CHANGE] El agente "${dbName}" ya posee las instrucciones actualizadas en MongoDB.`);
        successCount++;
        continue;
      }

      // Actualizar instrucciones en MongoDB
      await Agent.updateOne(
        { _id: agentDoc._id },
        { $set: { instructions: mdContent } }
      );
      console.log(`[SYNC SUCCESS] Sincronizado correctamente "${dbName}" en MongoDB.`);
      successCount++;
    }

    console.log('\n======================================');
    console.log(`Resumen de la Sincronizacion de Prompts Wappy:`);
    console.log(`- Agentes sincronizados/verificados con exito: ${successCount}`);
    console.log(`- Warnings o fallos de busqueda: ${warningCount}`);
    console.log('======================================');

    process.exit(0);
  } catch (error) {
    console.error('Error critico en la sincronizacion de base de datos:', error);
    process.exit(1);
  }
}

main();
