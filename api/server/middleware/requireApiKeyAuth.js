const crypto = require('crypto');
const mongoose = require('mongoose');
const UserApiKey = require('~/models/UserApiKey');
const requireJwtAuth = require('./requireJwtAuth');
const { logger } = require('~/config');

/**
 * Validates a raw API key string (e.g. wpy_live_abc123...)
 * Returns { user, apiKey } or null if invalid.
 */
async function authenticateApiKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') {
    return null;
  }
  const cleanKey = rawKey.trim();
  if (!cleanKey.startsWith('wpy_live_')) {
    return null;
  }

  const hash = crypto.createHash('sha256').update(cleanKey).digest('hex');
  const apiKeyDoc = await UserApiKey.findOne({ keyHash: hash, isActive: true });
  if (!apiKeyDoc) {
    return null;
  }

  // Update lastUsedAt asynchronously without blocking
  UserApiKey.updateOne({ _id: apiKeyDoc._id }, { $set: { lastUsedAt: new Date() } }).catch((err) => {
    logger.error('[requireApiKeyAuth] Error updating lastUsedAt:', err);
  });

  const User = mongoose.models.User || mongoose.model('User');
  const user = await User.findById(apiKeyDoc.user).lean();
  if (!user) {
    return null;
  }

  user.id = user._id.toString();
  return { user, apiKey: apiKeyDoc };
}

/**
 * Middleware strictly requiring a valid WAPPY user API key.
 */
const requireApiKeyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const rawApiKey =
    req.headers['x-api-key'] ||
    (authHeader?.toLowerCase().startsWith('bearer wpy_live_')
      ? authHeader.slice(7).trim()
      : null);

  if (!rawApiKey) {
    return res.status(401).json({
      error: 'Se requiere una clave API de WAPPY válida (Authorization: Bearer wpy_live_... o x-api-key).',
    });
  }

  try {
    const authResult = await authenticateApiKey(rawApiKey);
    if (!authResult) {
      return res.status(401).json({
        error: 'Clave API de WAPPY inválida o revocada.',
      });
    }

    req.user = authResult.user;
    req.apiKey = authResult.apiKey;
    return next();
  } catch (error) {
    logger.error('[requireApiKeyAuth] Authentication error:', error);
    return res.status(500).json({ error: 'Error durante la autenticación de la clave API.' });
  }
};

/**
 * Hybrid middleware: accepts either an API Key (wpy_live_...) or standard JWT session.
 */
const requireApiKeyOrJwt = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const rawApiKey =
    req.headers['x-api-key'] ||
    (authHeader?.toLowerCase().startsWith('bearer wpy_live_')
      ? authHeader.slice(7).trim()
      : null);

  if (rawApiKey) {
    try {
      const authResult = await authenticateApiKey(rawApiKey);
      if (!authResult) {
        return res.status(401).json({
          error: 'Clave API de WAPPY inválida o revocada.',
        });
      }

      req.user = authResult.user;
      req.apiKey = authResult.apiKey;
      return next();
    } catch (error) {
      logger.error('[requireApiKeyOrJwt] Authentication error:', error);
      return res.status(500).json({ error: 'Error durante la autenticación de la clave API.' });
    }
  }

  // Fallback to standard JWT authentication
  return requireJwtAuth(req, res, next);
};

module.exports = {
  authenticateApiKey,
  requireApiKeyAuth,
  requireApiKeyOrJwt,
};
