/**
 * Script para copiar avatares a la carpeta pública y asignarlos a los agentes en MongoDB.
 * 
 * Ejecutar con: node api/scripts/assign-avatars.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';
const SOURCE_AVATARS_DIR = path.resolve(__dirname, '../../Agentes/Miniaturas/AvataresAgentes');
const DEST_AVATARS_DIR = path.resolve(__dirname, '../../client/public/images');

const AgentSchema = new mongoose.Schema({
  id: String,
  name: String,
  avatar: mongoose.Schema.Types.Mixed
}, { strict: false, collection: 'agents' });

const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);

const AGENT_AVATARS_MAP = {
  'Abogado Laboral': 'abogado_laboral.png',
  'Médico Laboral': 'medico_laboral.png',
  'Consultor SG-SST': 'profesional_sst.png',
  'Fisioterapeuta Laboral': 'fisioterapeuta.png',
  'Psicólogo SST': 'psicologo_sst.png',
  'Terapeuta en Salud Mental': 'salud_mental.png',
  'Nutricionista Laboral': 'nutricionista.png',
  'Primer Respondiente': 'primeros_auxilios.png',
  'Coordinador de Emergencias': 'emergencias.png',
  'Especialista en Bioseguridad': 'riesgo_biologico.png',
  'Ingeniero Electricista SST': 'riesgo_electrico.png',
  'Ingeniero Químico SST': 'riesgo_quimico.png',
  'Coordinador de Seguridad Vial': 'riesgo_vial.png',
  'Coordinador de Tareas Críticas': 'tareas_alto_riesgo.png',
  'Ingeniero de Minas SST': 'tareas_alto_riesgo.png',
  'Auditor SG-SST': 'auditor_sg_sst.png',
  'Ingeniero Ambiental': 'reporte_actos.png',
  'Redactor Creativo': 'formacion.png',
  'Simulador de Accidentes SST': 'reporte_actos.png'
};

async function main() {
  console.log('🚀 Iniciando asignación de avatares...');

  // 1. Crear carpeta destino si no existe
  if (!fs.existsSync(DEST_AVATARS_DIR)) {
    fs.mkdirSync(DEST_AVATARS_DIR, { recursive: true });
    console.log('📂 Carpeta creada:', DEST_AVATARS_DIR);
  }

  // 2. Copiar archivos PNG
  console.log('\n--- 1. Copiando archivos de avatares ---');
  for (const [agentName, filename] of Object.entries(AGENT_AVATARS_MAP)) {
    const srcPath = path.join(SOURCE_AVATARS_DIR, filename);
    const destPath = path.join(DEST_AVATARS_DIR, filename);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  💾 Copiado: ${filename} -> client/public/images/`);
    } else {
      console.warn(`  ⚠️ Archivo origen no encontrado: ${filename}`);
    }
  }

  // 3. Actualizar la base de datos MongoDB
  console.log('\n--- 2. Actualizando base de datos MongoDB ---');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado a MongoDB:', MONGO_URI);

  for (const [agentName, filename] of Object.entries(AGENT_AVATARS_MAP)) {
    const dbAgent = await Agent.findOne({ name: agentName });
    if (dbAgent) {
      const avatarObj = {
        filepath: `/images/${filename}`,
        source: 'local'
      };

      await Agent.updateOne(
        { _id: dbAgent._id },
        { $set: { avatar: avatarObj } }
      );
      console.log(`  🖼️  Avatar asignado a "${agentName}": /images/${filename}`);
    } else {
      console.warn(`  ⚠️ Agente no encontrado en BD: "${agentName}"`);
    }
  }

  console.log('\n✅ Proceso de avatares completado con éxito.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
