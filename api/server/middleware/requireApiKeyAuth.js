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

  // Update lastUsedAt and backfill rawKey if missing asynchronously without blocking
  UserApiKey.updateOne(
    { _id: apiKeyDoc._id },
    { $set: { lastUsedAt: new Date(), ...(apiKeyDoc.rawKey ? {} : { rawKey: cleanKey }) } },
  ).catch((err) => {
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

  // 1. Registered user API key (wpy_live_...) always authenticates directly
  if (rawApiKey && rawApiKey.startsWith('wpy_live_')) {
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

  // 2. Allow JWT via query param ?token=... for EventSource / SSE streams
  if (
    (!req.headers.authorization || req.headers.authorization.toLowerCase().startsWith('bearer wpy_guest_')) &&
    typeof req.query?.token === 'string' &&
    req.query.token.trim() &&
    !req.query.token.trim().startsWith('wpy_')
  ) {
    req.headers.authorization = `Bearer ${req.query.token.trim()}`;
  }

  // 3. Try active WAPPY user session via refreshToken cookie before falling back to guest key
  if (!req.user) {
    try {
      const cookieHeader = String(req.headers?.cookie || '');
      let refreshToken = req.cookies?.refreshToken || '';
      if (!refreshToken && cookieHeader) {
        const match = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]+)/);
        if (match && match[1]) refreshToken = decodeURIComponent(match[1]);
      }
      if (refreshToken && process.env.JWT_REFRESH_SECRET) {
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        if (payload && payload.id && mongoose.Types.ObjectId.isValid(String(payload.id))) {
          const User = mongoose.models.User || mongoose.model('User');
          const dbUser = await User.findById(payload.id).lean();
          if (dbUser) {
            dbUser.id = String(dbUser._id);
            req.user = dbUser;
            return next();
          }
        }
      }
    } catch (_) {}
  }

  // 4. If guest key (wpy_guest_...) was provided and there is no Bearer JWT header, authenticate as guest
  const hasJwtBearer =
    typeof req.headers.authorization === 'string' &&
    req.headers.authorization.toLowerCase().startsWith('bearer ') &&
    !req.headers.authorization.toLowerCase().startsWith('bearer wpy_');

  if (rawApiKey && rawApiKey.startsWith('wpy_guest_') && !hasJwtBearer) {
    try {
      const guestResult = await authenticateApiKey(rawApiKey);
      if (guestResult) {
        req.user = guestResult.user;
        req.apiKey = guestResult.apiKey;
        return next();
      }
    } catch (_) {}
  }

  // 5. Fallback to standard JWT authentication
  return requireJwtAuth(req, res, next);
};

module.exports = {
  authenticateApiKey,
  requireApiKeyAuth,
  requireApiKeyOrJwt,
};
