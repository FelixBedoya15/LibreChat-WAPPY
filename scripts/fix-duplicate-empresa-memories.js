/**
 * scripts/fix-duplicate-empresa-memories.js
 * 
 * AUDITORÍA FORENSE — Fix #3 y #4
 * Limpia memorias empresa_sgsst duplicadas en MongoDB.
 * 
 * Causa raíz: syncCompanyMemory() no pasaba agentId explícito,
 * mientras que el Memory Agent post-chat usaba el agentId real del agente.
 * Resultado: múltiples entradas {key: 'empresa_sgsst', agentId: X} por usuario.
 * 
 * Este script:
 *  1. Encuentra todos los usuarios afectados
 *  2. Por cada usuario, consolida todas las empresa_sgsst al agentId='global'
 *     usando el contenido MÁS RECIENTE
 *  3. Elimina todas las entradas duplicadas (agentId != 'global')
 *  4. Intenta crear un índice único {userId, agentId, key} para prevenir recurrencia
 * 
 * Uso en producción:
 *   docker exec -it LibreChat node scripts/fix-duplicate-empresa-memories.js
 */

'use strict';

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
const MEMORY_KEY = 'empresa_sgsst';
const GLOBAL_AGENT_ID = 'global';

async function run() {
  console.log(`\n🔌 Conectando a MongoDB: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado.\n');

  const db = mongoose.connection.db;
  const collection = db.collection('memoryentries');

  // ── PASO 1: Encontrar usuarios con duplicados ─────────────────────────────
  console.log(`🔍 Buscando entradas duplicadas con key="${MEMORY_KEY}"...`);
  
  const allEntries = await collection
    .find({ key: MEMORY_KEY })
    .sort({ updated_at: -1 }) // más reciente primero
    .toArray();

  console.log(`   → Total entradas "${MEMORY_KEY}" en DB: ${allEntries.length}`);

  // Agrupar por userId
  const byUser = {};
  for (const entry of allEntries) {
    const uid = String(entry.userId);
    if (!byUser[uid]) byUser[uid] = [];
    byUser[uid].push(entry);
  }

  const usersWithDuplicates = Object.entries(byUser).filter(([, entries]) => entries.length > 1);
  console.log(`   → Usuarios con duplicados: ${usersWithDuplicates.length}`);

  if (usersWithDuplicates.length === 0) {
    console.log('\n🎉 No hay duplicados. La base de datos está limpia.\n');
  } else {
    let fixed = 0;
    let deleted = 0;

    for (const [userId, entries] of usersWithDuplicates) {
      console.log(`\n👤 Usuario: ${userId} (${entries.length} entradas)`);

      // La más reciente (ya ordenada por updated_at desc) es la canónica
      const canonical = entries[0];
      const duplicates = entries.slice(1);

      console.log(`   ✅ Entrada canónica: agentId="${canonical.agentId}", updated="${canonical.updated_at}"`);

      // Asegurar que la canónica tiene agentId='global'
      if (canonical.agentId !== GLOBAL_AGENT_ID) {
        await collection.updateOne(
          { _id: canonical._id },
          { $set: { agentId: GLOBAL_AGENT_ID } }
        );
        console.log(`   🔄 Normalizada la entrada canónica → agentId='global'`);
        fixed++;
      }

      // Eliminar todos los duplicados
      const dupIds = duplicates.map((e) => e._id);
      await collection.deleteMany({ _id: { $in: dupIds } });
      console.log(`   🗑️  Eliminadas ${dupIds.length} entradas duplicadas`);
      deleted += dupIds.length;
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   → Entradas normalizadas a agentId='global': ${fixed}`);
    console.log(`   → Entradas duplicadas eliminadas: ${deleted}`);
  }

  // ── PASO 2: Verificar que cualquier empresa_sgsst restante con agentId ≠ global sea corregida ──
  console.log('\n🔧 Normalizando cualquier empresa_sgsst con agentId ≠ "global"...');
  const orphaned = await collection.find({
    key: MEMORY_KEY,
    agentId: { $ne: GLOBAL_AGENT_ID },
  }).toArray();

  if (orphaned.length > 0) {
    for (const entry of orphaned) {
      // Verificar si ya existe una entrada global para este usuario
      const globalExists = await collection.findOne({
        userId: entry.userId,
        key: MEMORY_KEY,
        agentId: GLOBAL_AGENT_ID,
      });

      if (!globalExists) {
        // Promover esta entrada a global
        await collection.updateOne({ _id: entry._id }, { $set: { agentId: GLOBAL_AGENT_ID } });
        console.log(`   🔄 Promovido a global: userId=${entry.userId}, agentId era="${entry.agentId}"`);
      } else {
        // Ya existe una entrada global — eliminar el huérfano
        await collection.deleteOne({ _id: entry._id });
        console.log(`   🗑️  Eliminado huérfano: userId=${entry.userId}, agentId="${entry.agentId}"`);
      }
    }
  } else {
    console.log('   → No hay entradas huérfanas.');
  }

  // ── PASO 3: Crear índice único para prevenir futuros duplicados ───────────
  console.log('\n📐 Verificando índice único {userId, agentId, key}...');
  try {
    const indexes = await collection.indexes();
    const alreadyExists = indexes.some(
      (idx) =>
        idx.unique === true &&
        idx.key &&
        idx.key.userId !== undefined &&
        idx.key.agentId !== undefined &&
        idx.key.key !== undefined
    );

    if (alreadyExists) {
      console.log('   → Índice único ya existe. ✅');
    } else {
      await collection.createIndex(
        { userId: 1, agentId: 1, key: 1 },
        { unique: true, name: 'user_agent_key_unique' }
      );
      console.log('   → Índice único creado: {userId, agentId, key} ✅');
    }
  } catch (indexErr) {
    console.warn(`   ⚠️  No se pudo crear el índice único: ${indexErr.message}`);
  }

  // ── PASO 4: Reporte final ─────────────────────────────────────────────────
  const finalCount = await collection.countDocuments({ key: MEMORY_KEY });
  const finalByAgent = await collection.aggregate([
    { $match: { key: MEMORY_KEY } },
    { $group: { _id: '$agentId', count: { $sum: 1 } } }
  ]).toArray();

  console.log(`\n✅ Estado final de la colección para key="${MEMORY_KEY}":`);
  console.log(`   → Total entradas: ${finalCount}`);
  finalByAgent.forEach(({ _id, count }) => {
    console.log(`   → agentId="${_id}": ${count} entradas`);
  });

  console.log('\n🎉 Limpieza completada con éxito.\n');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('\n💥 Error crítico:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
