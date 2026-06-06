const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');

/**
 * Middleware to check and enforce download limits for free users (role: 'USER').
 * Limits to 1 download per day. Increments counter on success.
 */
const checkDownloadLimits = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Only apply to the Gratis ('USER') plan
    if (req.user.role !== 'USER') {
      return next();
    }

    const User = mongoose.model('User');
    const user = await User.findById(req.user.id);

    if (!user) {
      return next();
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let downloadsToday = user.downloadsToday || 0;
    const lastDownloadDate = user.lastDownloadDate ? new Date(user.lastDownloadDate) : null;

    // Reset counter if the last download was on a different day
    if (!lastDownloadDate || lastDownloadDate < todayStart) {
      downloadsToday = 0;
    }

    const limit = 1;

    if (downloadsToday >= limit) {
      const payload = {
        error: true,
        type: 'download_limit_reached',
        message: `Has alcanzado el límite de ${limit} descarga diaria del plan Gratis. Para realizar descargas ilimitadas de tus Canvas y Matrices IPEVAR, adquiere el plan Wappy Vital.`
      };
      return res.status(403).json({
        ...payload,
        text: JSON.stringify(payload)
      });
    }

    // Increment download counter and save
    user.downloadsToday = downloadsToday + 1;
    user.lastDownloadDate = new Date();
    await user.save();

    next();
  } catch (error) {
    logger.error('Error en checkDownloadLimits middleware:', error);
    next(error);
  }
};

module.exports = checkDownloadLimits;
