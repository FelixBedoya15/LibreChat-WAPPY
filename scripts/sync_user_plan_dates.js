/**
 * sync_user_plan_dates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Script para reconciliar y sincronizar las fechas de vencimiento entre la
 * colección User (campo inactiveAt) y UserPlan (campo planExpiresAt).
 *
 * Corrige discrepancias donde el admin asignó una fecha en User pero UserPlan
 * conservaba una fecha anterior desactualizada.
 *
 * Uso local o en VPS:
 *   node scripts/sync_user_plan_dates.js
 * o dentro del contenedor Docker:
 *   docker exec -it LibreChat node scripts/sync_user_plan_dates.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';

const roleToPlan = {
  USER_PRO: 'pro',
  PRO: 'pro',
  USER_PLUS: 'plus',
  USER_GO: 'go',
  USER_IPEVAR: 'ipevar',
  IPEVAR: 'ipevar',
  USER: 'free',
  ADMIN: 'admin',
  USER_CUSTOM: 'custom',
};

async function syncUserPlanDates() {
  try {
    console.log(`[Sync] Conectando a MongoDB en: ${MONGO_URI.replace(/\/\/.*@/, '//***@')}...`);
    await mongoose.connect(MONGO_URI);
    console.log('[Sync] Conexión establecida exitosamente.');

    // User model
    let User;
    try {
      const { userSchema } = require('@librechat/data-schemas');
      User = mongoose.models.User || mongoose.model('User', userSchema);
    } catch (e) {
      User = mongoose.model('User');
    }

    // UserPlan model
    let UserPlan;
    try {
      UserPlan = require('../api/db/models/UserPlan');
    } catch (e) {
      UserPlan = mongoose.models.UserPlan || mongoose.model('UserPlan');
    }

    const users = await User.find({}).lean();
    console.log(`[Sync] Se encontraron ${users.length} usuarios en el sistema.`);

    let syncedCount = 0;
    let createdPlanCount = 0;

    for (const u of users) {
      const userId = u._id;
      const userInactiveAt = u.inactiveAt ? new Date(u.inactiveAt) : null;
      const userRole = (u.role || '').toUpperCase();
      const expectedPlan = roleToPlan[userRole] || 'free';

      let planDoc = await UserPlan.findOne({ userId });

      if (!planDoc) {
        if (userInactiveAt || expectedPlan !== 'free') {
          await UserPlan.create({
            userId,
            plan: expectedPlan,
            planExpiresAt: userInactiveAt,
            planInterval: expectedPlan === 'pro' ? 'monthly' : null,
          });
          console.log(`[Sync] ✅ Creado UserPlan para: ${u.email || u.username || userId} | Plan: ${expectedPlan} | Expiración: ${userInactiveAt ? userInactiveAt.toISOString() : 'Sin expiración'}`);
          createdPlanCount++;
        }
        continue;
      }

      const planExpiresAt = planDoc.planExpiresAt ? new Date(planDoc.planExpiresAt) : null;

      const needsDateSync =
        userInactiveAt && (!planExpiresAt || userInactiveAt.getTime() !== planExpiresAt.getTime());

      const needsPlanSync =
        expectedPlan !== 'free' && (!planDoc.plan || planDoc.plan === 'free');

      if (needsDateSync || needsPlanSync) {
        const updateFields = {};
        if (needsDateSync) {
          updateFields.planExpiresAt = userInactiveAt;
        }
        if (needsPlanSync) {
          updateFields.plan = expectedPlan;
        }

        await UserPlan.updateOne({ userId }, { $set: updateFields });
        console.log(
          `[Sync] 🔄 Sincronizado ${u.email || u.username || userId}: ` +
          `User.inactiveAt=${userInactiveAt ? userInactiveAt.toLocaleDateString('es-CO') : 'null'} | ` +
          `UserPlan anterior=${planExpiresAt ? planExpiresAt.toLocaleDateString('es-CO') : 'null'} → ` +
          `Nuevo=${userInactiveAt ? userInactiveAt.toLocaleDateString('es-CO') : 'null'}`
        );
        syncedCount++;
      }
    }

    console.log(`\n========================================================`);
    console.log(`[Sync] Resumen de Sincronización Finalizado:`);
    console.log(`   - Usuarios actualizados/sincronizados: ${syncedCount}`);
    console.log(`   - Planes inicializados/creados:        ${createdPlanCount}`);
    console.log(`========================================================\n`);

    process.exit(0);
  } catch (err) {
    console.error('[Sync] Error ejecutando sincronización:', err);
    process.exit(1);
  }
}

syncUserPlanDates();
