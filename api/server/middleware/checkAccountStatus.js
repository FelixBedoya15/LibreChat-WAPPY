const { logger } = require('@librechat/data-schemas');
const { downgradeUserIfExpired } = require('../services/planExpirationJob');

/**
 * Middleware to check if the user account has expired.
 * If the current date is past the inactiveAt date:
 * - Non-admin/non-free users are automatically downgraded to Free (USER) / Wappy Vital (USER_IPEVAR)
 * - Their account is kept active so they can continue using the free platform without interruption.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkAccountStatus = async (req, res, next) => {
    try {
        const freeRoles = ['USER', 'ADMIN', 'USER_IPEVAR', 'IPEVAR'];
        if (req.user && !freeRoles.includes(req.user.role) && req.user.inactiveAt) {
            const now = new Date();
            const inactiveAt = new Date(req.user.inactiveAt);

            if (now >= inactiveAt) {
                logger.info(`[checkAccountStatus] Auto-downgrading expired user ${req.user.id} (expired on ${inactiveAt.toISOString()}) to free tier.`);
                const resDowngrade = await downgradeUserIfExpired(req.user.id || req.user._id);
                if (resDowngrade.downgraded) {
                    req.user.role = resDowngrade.role;
                    req.user.inactiveAt = null;
                }
            }
        }

        // Check activeAt (future activation)
        if (req.user && req.user.activeAt) {
            const now = new Date();
            const activeAt = new Date(req.user.activeAt);

            if (now < activeAt) {
                logger.info(`Access denied for user ${req.user.id}: Account not active until ${activeAt.toISOString()}`);
                return res.status(403).json({ message: 'Account is not yet active.' });
            }
        }

        next();
    } catch (err) {
        logger.error('[checkAccountStatus] Error verifying account status:', err);
        next();
    }
};

module.exports = checkAccountStatus;

