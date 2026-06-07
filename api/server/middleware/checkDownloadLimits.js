const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');

/**
 * Middleware to check and enforce download limits for:
 * - Gratis users (role: 'USER') -> 1 download/day
 * - Wappy Vital users (role: 'USER_IPEVAR', 'IPEVAR') -> 6 downloads/day
 * Increments counter on success.
 */
const checkDownloadLimits = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const isFree = req.user.role === 'USER';
    const isVital = req.user.role === 'USER_IPEVAR' || req.user.role === 'IPEVAR';

    if (!isFree && !isVital) {
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

    const limit = isFree ? 1 : 6;

    if (downloadsToday >= limit) {
      const payload = {
        error: true,
        type: 'download_limit_reached',
        message: isFree 
          ? `Has alcanzado el límite de ${limit} descarga diaria del plan Gratis. Para realizar descargas de tus Canvas y Matrices IPEVAR, adquiere el plan Wappy Vital.`
          : `Has alcanzado el límite de ${limit} descargas diarias del plan Wappy Vital. Para realizar descargas ilimitadas de tus Canvas y Matrices IPEVAR, adquiere el plan Wappy Pro.`
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
