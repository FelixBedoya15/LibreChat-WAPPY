const cookies = require('cookie');
const passport = require('passport');
const { isEnabled } = require('@librechat/api');
const checkAccountStatus = require('./checkAccountStatus');

/**
 * Custom Middleware to handle JWT authentication, with support for OpenID token reuse
 * Switches between JWT and OpenID authentication based on cookies and environment settings
 */
const requireJwtAuth = (req, res, next) => {
  // Check if token provider is specified in cookies
  const cookieHeader = req.headers.cookie;
  const tokenProvider = cookieHeader ? cookies.parse(cookieHeader).token_provider : null;

  // Use OpenID authentication if token provider is OpenID and OPENID_REUSE_TOKENS is enabled
  if (tokenProvider === 'openid' && isEnabled(process.env.OPENID_REUSE_TOKENS)) {
    return passport.authenticate('openidJwt', { session: false })(req, res, next);
  }

  // Default to standard JWT authentication
  return (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      req.user = user;

      // Check account status
      return checkAccountStatus(req, res, next);
    })(req, res, next);
  };
};

module.exports = requireJwtAuth;
