const mongoose = require('mongoose');
const CompanyInfo = require('~/models/CompanyInfo');
const {
  getUserPluginAuthValue,
  updateUserPluginAuth,
  deleteUserPluginAuth,
} = require('./PluginService');

const GOOGLE_AUTH_KEYS = [
  'GOOGLE_DRIVE_ACCESS_TOKEN',
  'GOOGLE_DRIVE_REFRESH_TOKEN',
  'GOOGLE_DRIVE_EXPIRY',
  'GOOGLE_DRIVE_EMAIL',
];

/**
 * Resuelve el ID del usuario propietario de las empresas (soporta sub-usuarios).
 */
const resolveOwnerUserId = async (userId) => {
  if (!userId) return { ownerUserId: null, assignedCompanyId: null };
  try {
    const User = mongoose.models.User;
    if (User && mongoose.isValidObjectId(userId)) {
      const uDoc = await User.findById(userId).select('isSubUser parentUser assignedCompany').lean();
      if (uDoc?.isSubUser && uDoc?.parentUser) {
        return {
          ownerUserId: String(uDoc.parentUser),
          assignedCompanyId: uDoc.assignedCompany ? String(uDoc.assignedCompany) : null,
        };
      }
    }
  } catch (_) {
    // Ignore lookup errors
  }
  return { ownerUserId: String(userId), assignedCompanyId: null };
};

/**
 * Obtiene la empresa activa o principal de un usuario.
 */
const getActiveCompany = async (userId) => {
  try {
    const { ownerUserId, assignedCompanyId } = await resolveOwnerUserId(userId);
    if (!ownerUserId) return null;

    if (assignedCompanyId && mongoose.isValidObjectId(assignedCompanyId)) {
      const assigned = await CompanyInfo.findOne({ _id: assignedCompanyId, user: ownerUserId }).lean();
      if (assigned) return assigned;
    }

    const active = await CompanyInfo.findOne({ user: ownerUserId, isActive: true }).lean();
    if (active) return active;
    return await CompanyInfo.findOne({ user: ownerUserId }).sort({ createdAt: 1 }).lean();
  } catch (err) {
    return null;
  }
};

/**
 * Migra credenciales antiguas sin sufijo de empresa (GOOGLE_DRIVE_*) por única vez
 * a la primera empresa del usuario (solo si ninguna empresa tiene aún credenciales propias)
 * y elimina las claves globales para evitar que contaminen a otras empresas.
 */
const migrateLegacyUnscopedAuthIfNeeded = async (ownerUserId) => {
  if (!ownerUserId) return;
  try {
    const legacyRefresh = await getUserPluginAuthValue(ownerUserId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false, 'google_drive');
    const legacyAccess = await getUserPluginAuthValue(ownerUserId, 'GOOGLE_DRIVE_ACCESS_TOKEN', false, 'google_drive');
    const legacyEmail = await getUserPluginAuthValue(ownerUserId, 'GOOGLE_DRIVE_EMAIL', false, 'google_drive');
    const legacyExpiry = await getUserPluginAuthValue(ownerUserId, 'GOOGLE_DRIVE_EXPIRY', false, 'google_drive');

    if (!legacyRefresh && !legacyAccess && !legacyEmail) {
      return;
    }

    const companies = await CompanyInfo.find({ user: ownerUserId }).sort({ createdAt: 1 }).lean();
    if (companies.length > 0) {
      let anyCompanyHasScopedToken = false;
      for (const comp of companies) {
        const compRt = await getUserPluginAuthValue(
          ownerUserId,
          `GOOGLE_DRIVE_REFRESH_TOKEN_${comp._id}`,
          false,
          'google_drive',
        );
        if (compRt) {
          anyCompanyHasScopedToken = true;
          break;
        }
      }

      if (!anyCompanyHasScopedToken) {
        const firstCompId = String(companies[0]._id);
        if (legacyAccess) {
          await updateUserPluginAuth(ownerUserId, `GOOGLE_DRIVE_ACCESS_TOKEN_${firstCompId}`, 'google_drive', legacyAccess);
        }
        if (legacyRefresh) {
          await updateUserPluginAuth(ownerUserId, `GOOGLE_DRIVE_REFRESH_TOKEN_${firstCompId}`, 'google_drive', legacyRefresh);
        }
        if (legacyExpiry) {
          await updateUserPluginAuth(ownerUserId, `GOOGLE_DRIVE_EXPIRY_${firstCompId}`, 'google_drive', String(legacyExpiry));
        }
        if (legacyEmail) {
          await updateUserPluginAuth(ownerUserId, `GOOGLE_DRIVE_EMAIL_${firstCompId}`, 'google_drive', legacyEmail);
        }
      }

      for (const key of GOOGLE_AUTH_KEYS) {
        await deleteUserPluginAuth(ownerUserId, key, false, 'google_drive');
      }
    }
  } catch (_) {
    // Ignore legacy migration errors
  }
};

/**
 * Obtiene un valor de autenticación de Google estrictamente aislado por empresa.
 * NUNCA reutiliza ni hereda credenciales de otras empresas del mismo usuario.
 */
const getScopedAuthValue = async (userId, companyId, baseKey, throwError = false) => {
  const { ownerUserId } = await resolveOwnerUserId(userId);
  const effectiveUserId = ownerUserId || userId;

  await migrateLegacyUnscopedAuthIfNeeded(effectiveUserId);

  let targetCompanyId = companyId ? String(companyId) : null;
  if (!targetCompanyId) {
    const company = await getActiveCompany(effectiveUserId);
    targetCompanyId = company ? String(company._id) : null;
  }

  if (targetCompanyId) {
    // Autolimpieza defensiva: si existen tokens en esta empresa sin GOOGLE_DRIVE_EMAIL_<companyId>,
    // provienen de un refresco cruzado antiguo y deben purgarse para mantener aislamiento total.
    if (baseKey !== 'GOOGLE_DRIVE_EMAIL') {
      const scopedEmail = await getUserPluginAuthValue(
        effectiveUserId,
        `GOOGLE_DRIVE_EMAIL_${targetCompanyId}`,
        false,
        'google_drive',
      );
      if (!scopedEmail) {
        const leakedRt = await getUserPluginAuthValue(
          effectiveUserId,
          `GOOGLE_DRIVE_REFRESH_TOKEN_${targetCompanyId}`,
          false,
          'google_drive',
        );
        const leakedAt = await getUserPluginAuthValue(
          effectiveUserId,
          `GOOGLE_DRIVE_ACCESS_TOKEN_${targetCompanyId}`,
          false,
          'google_drive',
        );
        if (leakedRt || leakedAt) {
          for (const k of GOOGLE_AUTH_KEYS) {
            await deleteUserPluginAuth(effectiveUserId, `${k}_${targetCompanyId}`, false, 'google_drive');
          }
        }
        if (throwError) {
          throw new Error('La empresa activa no tiene una cuenta de Google Workspace vinculada.');
        }
        return null;
      }
    }

    const scopedKey = `${baseKey}_${targetCompanyId}`;
    const value = await getUserPluginAuthValue(effectiveUserId, scopedKey, false, 'google_drive');
    if (value !== null && value !== undefined) {
      return value;
    }
    if (throwError) {
      throw new Error('La empresa activa no tiene una cuenta de Google Workspace vinculada.');
    }
    return null;
  }

  return await getUserPluginAuthValue(effectiveUserId, baseKey, throwError, 'google_drive');
};

/**
 * Guarda o actualiza un valor de autenticación de Google scoped por empresa.
 */
const updateScopedAuthValue = async (userId, companyId, baseKey, value) => {
  const { ownerUserId } = await resolveOwnerUserId(userId);
  const effectiveUserId = ownerUserId || userId;

  let targetCompanyId = companyId ? String(companyId) : null;
  if (!targetCompanyId) {
    const company = await getActiveCompany(effectiveUserId);
    targetCompanyId = company ? String(company._id) : null;
  }

  if (targetCompanyId) {
    const scopedKey = `${baseKey}_${targetCompanyId}`;
    await updateUserPluginAuth(effectiveUserId, scopedKey, 'google_drive', value);
  } else {
    await updateUserPluginAuth(effectiveUserId, baseKey, 'google_drive', value);
  }
};

/**
 * Elimina las credenciales de Google Workspace para una empresa específica o de forma global si no hay empresa activa.
 */
const deleteScopedAuthValue = async (userId, companyId) => {
  const { ownerUserId } = await resolveOwnerUserId(userId);
  const effectiveUserId = ownerUserId || userId;

  let targetCompanyId = companyId ? String(companyId) : null;
  if (!targetCompanyId) {
    const company = await getActiveCompany(effectiveUserId);
    targetCompanyId = company ? String(company._id) : null;
  }

  if (targetCompanyId) {
    for (const key of GOOGLE_AUTH_KEYS) {
      await deleteUserPluginAuth(effectiveUserId, `${key}_${targetCompanyId}`, false, 'google_drive');
    }
  } else {
    for (const key of GOOGLE_AUTH_KEYS) {
      await deleteUserPluginAuth(effectiveUserId, key, false, 'google_drive');
    }
  }
};

/**
 * Verifica si otra empresa del mismo usuario utiliza la misma cuenta/token de Google,
 * para evitar que revocar el token en una empresa desconecte a otra empresa que comparta el correo.
 */
const isGoogleTokenSharedWithOtherCompany = async (userId, currentCompanyId, refreshToken, email) => {
  try {
    const { ownerUserId } = await resolveOwnerUserId(userId);
    const effectiveUserId = ownerUserId || userId;
    if (!currentCompanyId) return false;

    const companies = await CompanyInfo.find({ user: effectiveUserId }).select('_id').lean();
    for (const comp of companies) {
      const cid = String(comp._id);
      if (cid === String(currentCompanyId)) continue;
      const otherRt = await getUserPluginAuthValue(effectiveUserId, `GOOGLE_DRIVE_REFRESH_TOKEN_${cid}`, false, 'google_drive');
      const otherEmail = await getUserPluginAuthValue(effectiveUserId, `GOOGLE_DRIVE_EMAIL_${cid}`, false, 'google_drive');
      if ((refreshToken && otherRt && otherRt === refreshToken) || (email && otherEmail && otherEmail.toLowerCase() === email.toLowerCase())) {
        return true;
      }
    }
  } catch (_) {
    // Ignore errors
  }
  return false;
};

/**
 * Obtiene el resumen de todas las empresas del usuario y el estado de conexión de Google Workspace de cada una.
 */
const getCompanyGoogleAuthSummary = async (userId) => {
  try {
    const { ownerUserId, assignedCompanyId } = await resolveOwnerUserId(userId);
    const effectiveUserId = ownerUserId || userId;
    await migrateLegacyUnscopedAuthIfNeeded(effectiveUserId);

    const query = assignedCompanyId
      ? { user: effectiveUserId, _id: assignedCompanyId }
      : { user: effectiveUserId };

    const companies = await CompanyInfo.find(query).sort({ createdAt: 1 }).lean();
    const summary = [];

    for (const comp of companies) {
      const cid = String(comp._id);
      const googleEmail = await getUserPluginAuthValue(effectiveUserId, `GOOGLE_DRIVE_EMAIL_${cid}`, false, 'google_drive');
      const refreshToken = googleEmail
        ? await getUserPluginAuthValue(effectiveUserId, `GOOGLE_DRIVE_REFRESH_TOKEN_${cid}`, false, 'google_drive')
        : null;

      summary.push({
        _id: cid,
        companyName: comp.companyName || comp.nombreComercial || 'Empresa',
        nit: comp.nit || '',
        companyEmail: comp.email || '',
        isActive: Boolean(comp.isActive),
        googleConnected: Boolean(refreshToken && googleEmail),
        googleEmail: (refreshToken && googleEmail) ? googleEmail : null,
      });
    }

    return summary;
  } catch (_) {
    return [];
  }
};

module.exports = {
  getActiveCompany,
  getScopedAuthValue,
  updateScopedAuthValue,
  deleteScopedAuthValue,
  isGoogleTokenSharedWithOtherCompany,
  getCompanyGoogleAuthSummary,
};
