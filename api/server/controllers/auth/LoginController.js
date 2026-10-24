const { logger } = require('@librechat/data-schemas');
const { generate2FATempToken } = require('~/server/services/twoFactorService');
const { setAuthTokens } = require('~/server/services/AuthService');
const { updateUser } = require('~/models');

const loginController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Auto-approve and activate sub-users if active
    if (req.user.isSubUser && req.user.subUserStatus === 'active') {
      req.user.accountStatus = 'active';
      req.user.isApproved = true;
      try {
        await updateUser(req.user._id, { accountStatus: 'active', isApproved: true });
      } catch (e) {
        logger.error('[loginController] Error updating subuser accountStatus:', e);
      }
    }

    // Auto-approve and activate any pending accounts so users can enter immediately
    if (req.user.accountStatus === 'pending' || (req.user.accountStatus === undefined && req.user.isApproved === false)) {
      req.user.accountStatus = 'active';
      req.user.isApproved = true;
      try {
        await updateUser(req.user._id, { accountStatus: 'active', isApproved: true });
      } catch (e) {
        logger.error('[loginController] Error updating accountStatus to active:', e);
      }
    }

    // Auto-grant 7-day PRO trial to existing users without an active plan so they can enter immediately
    if (!req.user.isSubUser && req.user.role === 'USER' && !req.user.inactiveAt) {
      try {
        const UserPlan = require('~/db/models/UserPlan');
        const userPlan = await UserPlan.findOne({ userId: req.user._id });
        if (!userPlan || userPlan.plan === 'free') {
          const PRO_TRIAL_MS = 7 * 24 * 60 * 60 * 1000;
          const expiryDate = new Date(Date.now() + PRO_TRIAL_MS);
          await UserPlan.findOneAndUpdate(
            { userId: req.user._id },
            {
              plan: 'pro',
              planExpiresAt: expiryDate,
              planInterval: 'trial_7d',
              cancelAtPeriodEnd: false
            },
            { upsert: true, new: true }
          );
          await updateUser(req.user._id, {
            role: 'USER_PRO',
            accountStatus: 'active',
            inactiveAt: expiryDate
          });
          req.user.role = 'USER_PRO';
          req.user.inactiveAt = expiryDate;
          req.user.accountStatus = 'active';
          logger.info(`[loginController] Auto-granted 7-day PRO trial to existing user ${req.user.email}`);
        }
      } catch (planCheckErr) {
        logger.error('[loginController] Error auto-granting trial to user:', planCheckErr);
      }
    }

    if (req.user.twoFactorEnabled) {
      const tempToken = generate2FATempToken(req.user._id);
      return res.status(200).json({ twoFAPending: true, tempToken });
    }

    const { ADMIN_EMAILS } = require('../../middleware/roles/admin');
    const { password: _p, totpSecret: _t, __v, ...user } = req.user;
    user.id = user._id.toString();
    if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      user.role = 'ADMIN';
    }

    const token = await setAuthTokens(req.user._id, res);

    return res.status(200).send({ token, user });

  } catch (err) {
    logger.error('[loginController]', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  loginController,
};
