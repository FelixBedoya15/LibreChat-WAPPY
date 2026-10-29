const crypto = require('crypto');
const mongoose = require('mongoose');
const UserApiKey = require('~/models/UserApiKey');
const requireJwtAuth = require('./requireJwtAuth');
const { logger } = require('~/config');

/**
 * Validates a raw API key string (e.g. wpy_live_abc123... or wpy_guest_abc123...)
 * Returns { user, apiKey } or null if invalid.
 */
async function authenticateApiKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') {
    return null;
  }
  const cleanKey = rawKey.trim();

  // Support deterministic guest keys (wpy_guest_<hex>) for Wappy Studio visitors without account
  if (cleanKey.startsWith('wpy_guest_') && cleanKey.length >= 20 && /^wpy_guest_[a-zA-Z0-9_-]{10,}$/.test(cleanKey)) {
    const guestIdHex = crypto.createHash('md5').update(cleanKey).digest('hex').slice(0, 24);
    const guestObjId = new mongoose.Types.ObjectId(guestIdHex);
    return {
      user: {
        _id: guestObjId,
        id: guestIdHex,
        isGuest: true,
        role: 'USER',
        name: 'Visitante Wappy Studio',
        email: `guest-${guestIdHex.slice(0, 8)}@wappy.club`,
      },
      apiKey: {
        _id: guestObjId,
        user: guestObjId,
        name: 'Guest Antigravity Key',
        keyPrefix: `${cleanKey.slice(0, 16)}...`,
        rawKey: cleanKey,
        isGuest: true,
        isActive: true,
      },
    };
  }

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
    (authHeader?.toLowerCase().startsWith('bearer wpy_')
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
 * Hybrid middleware: accepts either an API Key (wpy_live_... or wpy_guest_...) or standard JWT session.
 */
const requireApiKeyOrJwt = async (req, res, next) => {
  // Support for internal server services (like Tenshi Voice Session)
  if (req.headers['x-internal-user-id']) {
    const internalSecret = req.headers['x-internal-secret'];
    const expectedSecret = process.env.JWT_SECRET || 'wappy-internal-secret';
    if (internalSecret && internalSecret === expectedSecret) {
      const User = mongoose.models.User || mongoose.model('User');
      const user = await User.findById(req.headers['x-internal-user-id']).lean();
      if (user) {
        user.id = user._id.toString();
        req.user = user;
        return next();
      }
    }
  }

  const authHeader = req.headers.authorization;
  const rawApiKey =
    req.headers['x-api-key'] ||
    (typeof req.query?.apiKey === 'string' && req.query.apiKey.trim().startsWith('wpy_') ? req.query.apiKey.trim() : null) ||
    (authHeader?.toLowerCase().startsWith('bearer wpy_')
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

  // Allow JWT via query param ?token=... for EventSource / SSE streams
  if (!req.headers.authorization && typeof req.query?.token === 'string' && req.query.token.trim()) {
    req.headers.authorization = `Bearer ${req.query.token.trim()}`;
  }

  // Fallback to standard JWT authentication
  return requireJwtAuth(req, res, next);
};

module.exports = {
  authenticateApiKey,
  requireApiKeyAuth,
  requireApiKeyOrJwt,
};
