const mongoose = require('mongoose');
require('dotenv').config();

// Definir esquemas mínimos locales para evitar conflictos con dependencias externas
const UserPlanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    plan: { type: String },
    planExpiresAt: { type: Date }
}, { collection: 'userplans' });

const UserPlan = mongoose.models.UserPlan || mongoose.model('UserPlan', UserPlanSchema);

const UserSchema = new mongoose.Schema({
    name: { type: String },
    username: { type: String },
    email: { type: String }
}, { collection: 'users' });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
  try {
    let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
    
    // Si estamos ejecutando el script localmente fuera del contenedor de Docker,
    // reemplazamos el host "mongodb" por "127.0.0.1"
    if (mongoUri.includes('mongodb://mongodb:')) {
      mongoUri = mongoUri.replace('mongodb://mongodb:', 'mongodb://127.0.0.1:');
    }

    console.log(`Intentando conectar a base de datos: ${mongoUri}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Conectado a la base de datos.');

    const now = new Date();

    // Buscar planes de pago activos que tengan fecha de vencimiento
    const activePlans = await UserPlan.find({
      plan: { $nin: ['free', 'admin'] },
      planExpiresAt: { $ne: null }
    }).sort({ planExpiresAt: 1 }).lean();

    if (activePlans.length === 0) {
      console.log('\nNo se encontraron usuarios con planes de pago activos y fecha de vencimiento.');
      process.exit(0);
    }
    
    console.log('\n========================================= REPORTE DE VENCIMIENTOS DE PLANES =========================================');
    console.log(`${'Nombre / Usuario'.padEnd(25)} | ${'Correo Electrónico'.padEnd(30)} | ${'Plan'.padEnd(10)} | ${'Vence El'.padEnd(12)} | ${'Estado / Días Restantes'}`);
    console.log('=====================================================================================================================');

    for (const userPlan of activePlans) {
      const user = await User.findById(userPlan.userId).select('name email username').lean();
      const expiry = new Date(userPlan.planExpiresAt);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const name = user ? (user.name || user.username || 'N/A') : 'Usuario Eliminado';
      const email = user ? (user.email || 'N/A') : 'N/A';
      const plan = userPlan.plan;
      const expiryStr = expiry.toISOString().split('T')[0];

      let statusLabel = '';
      if (diffDays < 0) {
        statusLabel = `🔴 Vencido hace ${Math.abs(diffDays)} días`;
      } else if (diffDays === 0) {
        statusLabel = '🟡 Vence hoy';
      } else if (diffDays <= 5) {
        statusLabel = `🟡 Quedan ${diffDays} días (Crítico)`;
      } else {
        statusLabel = `🟢 Quedan ${diffDays} días`;
      }

      console.log(`${name.substring(0, 25).padEnd(25)} | ${email.substring(0, 30).padEnd(30)} | ${plan.padEnd(10)} | ${expiryStr.padEnd(12)} | ${statusLabel}`);
    }
    console.log('=====================================================================================================================\n');

  } catch (error) {
    console.error('Error al realizar la consulta:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
