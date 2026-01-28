const { logger } = require('@librechat/data-schemas');

/**
 * Middleware to check if the user account is inactive based on the inactiveAt date.
 * If the current date is past the inactiveAt date, the request is denied.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkAccountStatus = (req, res, next) => {
    if (req.user && req.user.inactiveAt) {
        const now = new Date();
        const inactiveAt = new Date(req.user.inactiveAt);

        if (now >= inactiveAt) {
            logger.info(`Access denied for user ${req.user.id}: Account inactive since ${inactiveAt.toISOString()}`);
            return res.status(403).json({ message: 'Account is inactive.' });
        }
    }
    next();
};

module.exports = checkAccountStatus;
