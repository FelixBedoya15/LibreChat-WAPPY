/**
 * Script: enable-memories-permissions.js
 * Habilita los permisos de Memorias (USE, READ, CREATE, UPDATE, OPT_OUT)
 * para todos los roles de usuario en MongoDB.
 *
 * Uso en VPS:
 *   docker exec -it LibreChat node scripts/enable-memories-permissions.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/LibreChat';

// Roles a los que se les activarán los permisos de Memorias
const ROLES_TO_UPDATE = [
  'USER',
  'USER_GO',
  'USER_PLUS',
  'USER_PRO',
  'USER_CUSTOM',
  'USER_IPEVAR',
  'ADMIN',
];

async function run() {
  console.log('[Memories] Conectando a MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('[Memories] Conexión exitosa.');

  const db = mongoose.connection.db;
  const rolesCollection = db.collection('roles');

  for (const roleName of ROLES_TO_UPDATE) {
    const result = await rolesCollection.updateOne(
      { name: roleName },
      {
        $set: {
          'permissions.MEMORIES.USE': true,
          'permissions.MEMORIES.READ': true,
          'permissions.MEMORIES.CREATE': true,
          'permissions.MEMORIES.UPDATE': true,
          'permissions.MEMORIES.OPT_OUT': true,
        },
      },
    );

    if (result.matchedCount === 0) {
      console.warn(`[Memories] Rol "${roleName}" no encontrado en DB. Creando...`);
      await rolesCollection.insertOne({
        name: roleName,
        permissions: {
          MEMORIES: {
            USE: true,
            READ: true,
            CREATE: true,
            UPDATE: true,
            OPT_OUT: true,
          },
        },
      });
      console.log(`[Memories] Rol "${roleName}" creado con permisos de Memorias.`);
    } else {
      console.log(
        `[Memories] Rol "${roleName}" actualizado. Modificados: ${result.modifiedCount}`,
      );
    }
  }

  console.log('\n[Memories] ✅ Todos los permisos de Memorias han sido activados.');
  console.log('[Memories] Reinicia el servidor para que los cambios tomen efecto en el caché.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Memories] ❌ Error:', err.message);
  process.exit(1);
});
