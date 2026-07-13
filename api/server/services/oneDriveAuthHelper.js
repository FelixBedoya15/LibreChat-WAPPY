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
 * Obtiene un valor de autenticación de OneDrive de forma scoped por empresa.
 */
const getScopedAuthValue = async (userId, companyId, baseKey, throwError = false) => {
  let targetCompanyId = companyId;
  if (!targetCompanyId) {
    const company = await getActiveCompany(userId);
    targetCompanyId = company ? String(company._id) : null;
  }

  if (targetCompanyId) {
    const scopedKey = `${baseKey}_${targetCompanyId}`;
    const value = await getUserPluginAuthValue(userId, scopedKey, false, 'one_drive');
    if (value !== null && value !== undefined) {
      return value;
    }
    return null;
  }

  return await getUserPluginAuthValue(userId, baseKey, throwError, 'one_drive');
};

/**
 * Guarda o actualiza un valor de autenticación de OneDrive scoped por empresa.
 */
const updateScopedAuthValue = async (userId, companyId, baseKey, value) => {
  let targetCompanyId = companyId;
  if (!targetCompanyId) {
    const company = await getActiveCompany(userId);
    targetCompanyId = company ? String(company._id) : null;
  }

  if (targetCompanyId) {
    const scopedKey = `${baseKey}_${targetCompanyId}`;
    await updateUserPluginAuth(userId, scopedKey, 'one_drive', value);
  } else {
    await updateUserPluginAuth(userId, baseKey, 'one_drive', value);
  }
};

/**
 * Elimina las credenciales de OneDrive para una empresa específica.
 */
const deleteScopedAuthValue = async (userId, companyId) => {
  let targetCompanyId = companyId;
  if (!targetCompanyId) {
    const company = await getActiveCompany(userId);
    targetCompanyId = company ? String(company._id) : null;
  }

  const keys = ['ONEDRIVE_ACCESS_TOKEN', 'ONEDRIVE_REFRESH_TOKEN', 'ONEDRIVE_EXPIRY', 'ONEDRIVE_EMAIL'];

  if (targetCompanyId) {
    for (const key of keys) {
      await deleteUserPluginAuth(userId, `${key}_${targetCompanyId}`, false, 'one_drive');
    }
  } else {
    for (const key of keys) {
      await deleteUserPluginAuth(userId, key, false, 'one_drive');
    }
  }
};

module.exports = {
  getActiveCompany,
  getScopedAuthValue,
  updateScopedAuthValue,
  deleteScopedAuthValue,
};
