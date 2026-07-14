/**
 * Script para buscar nombres de agentes en todas las colecciones.
 * Ejecutar con: node api/scripts/inspect-all-collections.js
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado a MongoDB:', MONGO_URI);

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  console.log('\n--- Colecciones Disponibles ---');
  for (const coll of collections) {
    const count = await db.collection(coll.name).countDocuments();
    console.log(`- ${coll.name} (${count} documentos)`);
  }

  // Buscar el término "Protocolo de Acoso" en todas las colecciones
  console.log('\n--- Buscando "Protocolo de Acoso" en todas las colecciones ---');
  for (const coll of collections) {
    try {
      const results = await db.collection(coll.name).find({
        $or: [
          { name: /Protocolo/i },
          { name: /Acoso/i },
          { title: /Protocolo/i },
          { text: /Protocolo/i },
          { instructions: /Protocolo/i }
        ]
      }).toArray();

      if (results.length > 0) {
        console.log(`📍 Encontrado en la colección: "${coll.name}" (${results.length} coincidencias)`);
        results.forEach((r, idx) => {
          console.log(`   [${idx + 1}] ID: ${r._id || r.id} | Name/Title: "${r.name || r.title || 'N/A'}"`);
        });
      }
    } catch (e) {
      // ignore
    }
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
