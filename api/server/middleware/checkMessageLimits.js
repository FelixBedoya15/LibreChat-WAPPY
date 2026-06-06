const { Message } = require('~/db/models');
const { logger } = require('@librechat/data-schemas');

/**
 * Middleware to check daily message limit for free users (role: 'USER').
 * Limits to 10 messages/prompts per day (measured since midnight).
 */
const checkMessageLimits = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Only apply to the Gratis ('USER') plan
    if (req.user.role !== 'USER') {
      return next();
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Count user-created messages (prompts) today
    const count = await Message.countDocuments({
      user: req.user.id,
      isCreatedByUser: true,
      createdAt: { $gte: todayStart }
    });

    const limit = 10;

    if (count >= limit) {
      const payload = {
        error: true,
        type: 'daily_limit',
        message: `Has alcanzado tu límite de ${limit} mensajes diarios del plan Gratis. Para chatear ilimitadamente hoy, adquiere el plan Wappy Vital.`
      };
      return res.status(403).json({
        ...payload,
        text: JSON.stringify(payload)
      });
    }

    next();
  } catch (error) {
    logger.error('Error en checkMessageLimits middleware:', error);
    next(error);
  }
};

module.exports = checkMessageLimits;
