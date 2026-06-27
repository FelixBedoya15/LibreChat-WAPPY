const CompanyInfo = require('~/models/CompanyInfo');
const {
  getUserPluginAuthValue,
  updateUserPluginAuth,
  deleteUserPluginAuth,
} = require('./PluginService');

/**
 * Obtiene la empresa activa o principal de un usuario.
 */
const getActiveCompany = async (userId) => {
  try {
    const active = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
    if (active) return active;
    return await CompanyInfo.findOne({ user: userId }).lean();
  } catch (err) {
    return null;
  }
};

/**
 * Obtiene un valor de autenticación de Google de forma scoped por empresa, con fallback a la clave global.
 */
const getScopedAuthValue = async (userId, companyId, baseKey, throwError = false) => {
  let targetCompanyId = companyId;
  if (!targetCompanyId) {
    const company = await getActiveCompany(userId);
    targetCompanyId = company ? String(company._id) : null;
  }

  if (targetCompanyId) {
    const scopedKey = `${baseKey}_${targetCompanyId}`;
    const value = await getUserPluginAuthValue(userId, scopedKey, false, 'google_drive');
    if (value !== null && value !== undefined) {
      return value;
    }
  }

  return await getUserPluginAuthValue(userId, baseKey, throwError, 'google_drive');
};

/**
 * Guarda o actualiza un valor de autenticación de Google scoped por empresa.
 */
const updateScopedAuthValue = async (userId, companyId, baseKey, value) => {
  let targetCompanyId = companyId;
  if (!targetCompanyId) {
    const company = await getActiveCompany(userId);
    targetCompanyId = company ? String(company._id) : null;
  }

  if (targetCompanyId) {
    const scopedKey = `${baseKey}_${targetCompanyId}`;
    await updateUserPluginAuth(userId, scopedKey, 'google_drive', value);
  }
  // También actualizamos la clave base para mantener compatibilidad predeterminada
  await updateUserPluginAuth(userId, baseKey, 'google_drive', value);
};

/**
 * Elimina las credenciales de Google Workspace para una empresa específica o de forma global si no hay empresa activa.
 */
const deleteScopedAuthValue = async (userId, companyId) => {
  let targetCompanyId = companyId;
  if (!targetCompanyId) {
    const company = await getActiveCompany(userId);
    targetCompanyId = company ? String(company._id) : null;
  }

  const keys = ['GOOGLE_DRIVE_ACCESS_TOKEN', 'GOOGLE_DRIVE_REFRESH_TOKEN', 'GOOGLE_DRIVE_EXPIRY', 'GOOGLE_DRIVE_EMAIL'];

  if (targetCompanyId) {
    for (const key of keys) {
      await deleteUserPluginAuth(userId, `${key}_${targetCompanyId}`, false, 'google_drive');
    }
  }
  for (const key of keys) {
    await deleteUserPluginAuth(userId, key, false, 'google_drive');
  }
};

module.exports = {
  getActiveCompany,
  getScopedAuthValue,
  updateScopedAuthValue,
  deleteScopedAuthValue,
};
