/**
 * Script: fix-isofficial-flags.js
 * 
 * Limpia el flag isOfficial=true en sesiones de chat que NO son la sesión oficial maestra
 * (conversationId no empieza con 'official-').
 * 
 * Uso: docker exec -it LibreChat node scripts/fix-isofficial-flags.js
 */

'use strict';

require('module-alias/register');
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/LibreChat';

async function fixIsOfficialFlags() {
  console.log('Conectando a MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado.');

  const GTC45WorkspaceSession = require('../api/models/GTC45WorkspaceSession');

  // Buscar sesiones con isOfficial=true que NO sean la sesión oficial maestra
  const dirtySessions = await GTC45WorkspaceSession.find({
    isOfficial: true,
    conversationId: { $not: /^official-/ },
  }).lean();

  if (dirtySessions.length === 0) {
    console.log('✅ No hay sesiones de chat con isOfficial=true incorrecto. Todo limpio.');
  } else {
    console.log(`🔧 Encontradas ${dirtySessions.length} sesiones con isOfficial=true incorrecto:`);
    dirtySessions.forEach(s => console.log(`  - ${s.conversationId} | ${s.officialTitle || '(sin título)'}`));

    const result = await GTC45WorkspaceSession.updateMany(
      { isOfficial: true, conversationId: { $not: /^official-/ } },
      { $set: { isOfficial: false } }
    );
    console.log(`✅ Corregidas ${result.modifiedCount} sesiones. Ya solo aparecerá 1 ACTIVA en el selector.`);
  }

  await mongoose.disconnect();
  console.log('Listo.');
}

fixIsOfficialFlags().catch(err => { console.error('Error:', err); process.exit(1); });
