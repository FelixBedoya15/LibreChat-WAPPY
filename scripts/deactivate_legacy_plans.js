/**
 * deactivate_legacy_plans.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Migración y depuración de planes:
 * 1. Los planes Gratis ('USER'/'free'), Go ('USER_GO'/'go') y Plus ('USER_PLUS'/'plus')
 *    se retiran de la plataforma. Todas las cuentas en estos planes quedan INACTIVAS
 *    (accountStatus: 'inactive') para que al iniciar sesión sean redirigidas a /planes.
 * 2. Las cuentas que tenían Plan IPEVAR ('USER_IPEVAR' / 'ipevar') se confirman en el
 *    Plan Vital permanente (accountStatus: 'active', inactiveAt: null, planExpiresAt: null).
 * 3. Las cuentas Pro ('USER_PRO') se validan: activas si están vigentes, o inactivas si expiraron.
 * 4. Administradores y sub-usuarios activos se preservan intactos.
 *
 * Uso en VPS / Local:
 *   node scripts/deactivate_legacy_plans.js
 * En Docker:
 *   docker exec -it LibreChat node scripts/deactivate_legacy_plans.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';

async function runMigration() {
  try {
    console.log(`[Migración Planes] Conectando a MongoDB: ${MONGO_URI.replace(/\/\/.*@/, '//***@')}...`);
    await mongoose.connect(MONGO_URI);
    console.log('[Migración Planes] Conectado exitosamente.');

    let User;
    try {
      const { userSchema } = require('@librechat/data-schemas');
      User = mongoose.models.User || mongoose.model('User', userSchema);
    } catch (e) {
      User = mongoose.model('User');
    }

    let UserPlan;
    try {
      UserPlan = require('../api/db/models/UserPlan');
    } catch (e) {
      UserPlan = mongoose.models.UserPlan || mongoose.model('UserPlan');
    }

    const now = new Date();
    const users = await User.find({}).lean();
    console.log(`[Migración Planes] Total de usuarios en el sistema: ${users.length}`);

    let vitalCount = 0;
    let proActiveCount = 0;
    let proExpiredCount = 0;
    let legacyDeactivatedCount = 0;
    let ignoredAdminsSubUsers = 0;

    for (const user of users) {
      const userId = user._id;

      // 1. Conservar Administradores y Sub-usuarios
      if (user.role === 'ADMIN' || user.isSubUser) {
        ignoredAdminsSubUsers++;
        continue;
      }

      // 2. Verificar Plan Vital (IPEVAR)
      const userPlan = await UserPlan.findOne({ userId }).lean();
      const isVital =
        user.role === 'USER_IPEVAR' ||
        user.role === 'IPEVAR' ||
        userPlan?.plan === 'ipevar' ||
        userPlan?.planInterval === 'lifetime';

      if (isVital) {
        await User.updateOne(
          { _id: userId },
          {
            $set: {
              role: 'USER_IPEVAR',
              accountStatus: 'active',
              inactiveAt: null,
            },
          }
        );
        await UserPlan.updateOne(
          { userId },
          {
            $set: {
              plan: 'ipevar',
              planInterval: 'lifetime',
              planExpiresAt: null,
              cancelAtPeriodEnd: false,
            },
          },
          { upsert: true }
        );
        vitalCount++;
        continue;
      }

      // 3. Verificar Plan Pro
      const isPro = user.role === 'USER_PRO' || user.role === 'PRO' || userPlan?.plan === 'pro';
      if (isPro) {
        const isExpired = user.inactiveAt && new Date(user.inactiveAt) <= now;
        if (isExpired) {
          // Expirado: pasa a inactivo
          await User.updateOne(
            { _id: userId },
            {
              $set: {
                role: 'USER',
                accountStatus: 'inactive',
              },
            }
          );
          await UserPlan.updateOne(
            { userId },
            {
              $set: {
                plan: 'free',
                planInterval: null,
              },
            }
          );
          proExpiredCount++;
        } else {
          // Activo y vigente
          await User.updateOne(
            { _id: userId },
            {
              $set: {
                role: 'USER_PRO',
                accountStatus: 'active',
              },
            }
          );
          proActiveCount++;
        }
        continue;
      }

      // 4. Planes retirados: Gratis ('USER'), Go ('USER_GO'), Plus ('USER_PLUS') u otros
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            role: 'USER',
            accountStatus: 'inactive',
          },
        }
      );
      if (userPlan) {
        await UserPlan.updateOne(
          { userId },
          {
            $set: {
              plan: 'free',
              planInterval: null,
            },
          }
        );
      }
      legacyDeactivatedCount++;
    }

    console.log('\n================ RESUMEN DE MIGRACIÓN ================');
    console.log(`Plan Vital (IPEVAR de por vida) activos:     ${vitalCount}`);
    console.log(`Plan Pro vigentes activos:                  ${proActiveCount}`);
    console.log(`Plan Pro expirados (pasados a inactivos):   ${proExpiredCount}`);
    console.log(`Planes retirados desactivados (Gratis/Go/Plus): ${legacyDeactivatedCount}`);
    console.log(`Admins y Subusuarios intactos:              ${ignoredAdminsSubUsers}`);
    console.log('======================================================\n');

  } catch (error) {
    console.error('[Migración Planes] Error durante la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[Migración Planes] Conexión cerrada.');
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
