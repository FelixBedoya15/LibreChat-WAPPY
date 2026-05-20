const cookies = require('cookie');
const passport = require('passport');
const { isEnabled } = require('@librechat/api');
const checkAccountStatus = require('./checkAccountStatus');

/**
 * Custom Middleware to optionally check JWT authentication.
 * If a valid JWT is present, it populates req.user. If not, it allows the request to proceed.
 */
const checkJwtAuth = (req, res, next) => {
  const cookieHeader = req.headers.cookie;
  const tokenProvider = cookieHeader ? cookies.parse(cookieHeader).token_provider : null;

  // Select authentication strategy
  const strategy = (tokenProvider === 'openid' && isEnabled(process.env.OPENID_REUSE_TOKENS)) ? 'openidJwt' : 'jwt';

  passport.authenticate(strategy, { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (user) {
      req.user = user;
      return checkAccountStatus(req, res, next);
    }
    next();
  })(req, res, next);
};

module.exports = checkJwtAuth;
