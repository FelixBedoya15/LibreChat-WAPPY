/**
 * Script para activar todas las skills de Tenshi en MongoDB.
 * Ejecutar con: node api/scripts/seed-tenshi-skills.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';
const SKILLS_DIR = path.join(__dirname, '../config/skills');

// Inline TenshiConfig schema (sin importar el módulo completo)
const tenshiConfigSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Tenshi' },
    description: { type: String, default: 'Asistente virtual de WAPPY' },
    model: { type: String, default: 'gemini-3.1-flash-lite' },
    systemPrompt: { type: String, default: '' },
    extraKnowledge: { type: String, default: '' },
    location: { type: String, default: 'bottom-right' },
    isActive: { type: Boolean, default: true },
    provider: { type: String, default: 'google' },
    skills: { type: [String], default: [] },
  },
  { timestamps: true },
);

const TenshiConfig =
  mongoose.models.TenshiConfig || mongoose.model('TenshiConfig', tenshiConfigSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado a MongoDB:', MONGO_URI);

  // Leer todas las skills disponibles en el directorio
  const files = fs.readdirSync(SKILLS_DIR).filter((f) => f.endsWith('.md'));
  const skillNames = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(SKILLS_DIR, file), 'utf8');
    const match = content.match(/^---(\s*[\s\S]*?)---(\s*[\s\S]*)$/);
    if (match) {
      try {
        const frontmatter = yaml.load(match[1]);
        const name = frontmatter.name || file.replace('.md', '');
        skillNames.push(name);
        console.log(`  📦 Skill encontrada: ${name}`);
      } catch (e) {
        console.warn(`  ⚠️ Error parseando ${file}:`, e.message);
      }
    }
  }

  console.log(`\n🎯 Total de skills a activar: ${skillNames.length}`);
  console.log(skillNames);

  // Buscar o crear el config de Tenshi
  let config = await TenshiConfig.findOne();
  if (!config) {
    config = new TenshiConfig();
    console.log('\n🆕 Creando nuevo TenshiConfig...');
  } else {
    console.log('\n♻️  Actualizando TenshiConfig existente...');
  }

  config.skills = skillNames;
  await config.save();

  console.log('\n✅ Skills registradas exitosamente en TenshiConfig.');
  console.log('Skills activas:', config.skills);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
