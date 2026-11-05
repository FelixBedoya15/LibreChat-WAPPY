const mongoose = require('mongoose');
const CompanyInfo = require('~/models/CompanyInfo');
const {
  getUserPluginAuthValue,
  updateUserPluginAuth,
  deleteUserPluginAuth,
} = require('./PluginService');

const ONEDRIVE_AUTH_KEYS = [
  'ONEDRIVE_ACCESS_TOKEN',
  'ONEDRIVE_REFRESH_TOKEN',
  'ONEDRIVE_EXPIRY',
  'ONEDRIVE_EMAIL',
];

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
 * Obtiene un valor de autenticación de OneDrive de forma estrictamente aislada por empresa.
 */
const getScopedAuthValue = async (userId, companyId, baseKey, throwError = false) => {
  const { ownerUserId } = await resolveOwnerUserId(userId);
  const effectiveUserId = ownerUserId || userId;

  let targetCompanyId = companyId ? String(companyId) : null;
  if (!targetCompanyId) {
    const company = await getActiveCompany(effectiveUserId);
    targetCompanyId = company ? String(company._id) : null;
  }

  if (targetCompanyId) {
    const scopedKey = `${baseKey}_${targetCompanyId}`;
    const value = await getUserPluginAuthValue(effectiveUserId, scopedKey, false, 'one_drive');
    if (value !== null && value !== undefined) {
      return value;
    }
    if (throwError) {
      throw new Error('La empresa activa no tiene una cuenta de Microsoft OneDrive vinculada.');
    }
    return null;
  }

  return await getUserPluginAuthValue(effectiveUserId, baseKey, throwError, 'one_drive');
};

/**
 * Guarda o actualiza un valor de autenticación de OneDrive scoped por empresa.
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
    await updateUserPluginAuth(effectiveUserId, scopedKey, 'one_drive', value);
  } else {
    await updateUserPluginAuth(effectiveUserId, baseKey, 'one_drive', value);
  }
};

/**
 * Elimina las credenciales de OneDrive para una empresa específica.
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
    for (const key of ONEDRIVE_AUTH_KEYS) {
      await deleteUserPluginAuth(effectiveUserId, `${key}_${targetCompanyId}`, false, 'one_drive');
    }
  } else {
    for (const key of ONEDRIVE_AUTH_KEYS) {
      await deleteUserPluginAuth(effectiveUserId, key, false, 'one_drive');
    }
  }
};

/**
 * Obtiene el resumen de todas las empresas del usuario y el estado de conexión de OneDrive de cada una.
 */
const getCompanyOneDriveAuthSummary = async (userId) => {
  try {
    const { ownerUserId, assignedCompanyId } = await resolveOwnerUserId(userId);
    const effectiveUserId = ownerUserId || userId;

    const query = assignedCompanyId
      ? { user: effectiveUserId, _id: assignedCompanyId }
      : { user: effectiveUserId };

    const companies = await CompanyInfo.find(query).sort({ createdAt: 1 }).lean();
    const summary = [];

    for (const comp of companies) {
      const cid = String(comp._id);
      const oneDriveEmail = await getUserPluginAuthValue(effectiveUserId, `ONEDRIVE_EMAIL_${cid}`, false, 'one_drive');
      const refreshToken = oneDriveEmail
        ? await getUserPluginAuthValue(effectiveUserId, `ONEDRIVE_REFRESH_TOKEN_${cid}`, false, 'one_drive')
        : null;

      summary.push({
        _id: cid,
        companyName: comp.companyName || comp.nombreComercial || 'Empresa',
        nit: comp.nit || '',
        companyEmail: comp.email || '',
        isActive: Boolean(comp.isActive),
        oneDriveConnected: Boolean(refreshToken && oneDriveEmail),
        oneDriveEmail: (refreshToken && oneDriveEmail) ? oneDriveEmail : null,
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
  getCompanyOneDriveAuthSummary,
};
