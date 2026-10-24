const { getBalanceConfig } = require('@librechat/api');
const { FileSources } = require('librechat-data-provider');
const { getStrategyFunctions } = require('~/server/services/Files/strategies');
const { resizeAvatar } = require('~/server/services/Files/images/avatar');
const { updateUser, createUser, getUserById } = require('~/models');

/**
 * Updates the avatar URL and email of an existing user. If the user's avatar URL does not include the query parameter
 * '?manual=true', it updates the user's avatar with the provided URL. For local file storage, it directly updates
 * the avatar URL, while for other storage types, it processes the avatar URL using the specified file strategy.
 * Also updates the email if it has changed (e.g., when a Google Workspace email is updated).
 *
 * @param {IUser} oldUser - The existing user object that needs to be updated.
 * @param {string} avatarUrl - The new avatar URL to be set for the user.
 * @param {AppConfig} appConfig - The application configuration object.
 * @param {string} [email] - Optional. The new email address to update if it has changed.
 *
 * @returns {Promise<void>}
 *          The function updates the user's avatar and/or email and saves the user object. It does not return any value.
 *
 * @throws {Error} Throws an error if there's an issue saving the updated user object.
 */
const handleExistingUser = async (oldUser, avatarUrl, appConfig, email) => {
  const fileStrategy = appConfig?.fileStrategy ?? process.env.CDN_PROVIDER;
  const isLocal = fileStrategy === FileSources.local;
  const updates = {};

  let updatedAvatar = false;
  const hasManualFlag =
    typeof oldUser?.avatar === 'string' && oldUser.avatar.includes('?manual=true');

  if (isLocal && (!oldUser?.avatar || !hasManualFlag)) {
    updatedAvatar = avatarUrl;
  } else if (!isLocal && (!oldUser?.avatar || !hasManualFlag)) {
    const userId = oldUser._id;
    const resizedBuffer = await resizeAvatar({
      userId,
      input: avatarUrl,
    });
    const { processAvatar } = getStrategyFunctions(fileStrategy);
    updatedAvatar = await processAvatar({ buffer: resizedBuffer, userId, manual: 'false' });
  }

  if (updatedAvatar) {
    updates.avatar = updatedAvatar;
  }

  /** Update email if it has changed */
  if (email && email.trim() !== oldUser.email) {
    updates.email = email.trim();
  }

  if (Object.keys(updates).length > 0) {
    await updateUser(oldUser._id, updates);
  }
};

/**
 * Creates a new user with the provided user details. If the file strategy is not local, the avatar URL is
 * processed using the specified file strategy. The new user is saved to the database with the processed or
 * original avatar URL.
 *
 * @param {Object} params - The parameters object for user creation.
 * @param {string} params.email - The email of the new user.
 * @param {string} params.avatarUrl - The avatar URL of the new user.
 * @param {string} params.provider - The provider of the user's account.
 * @param {string} params.providerKey - The key to identify the provider in the user model.
 * @param {string} params.providerId - The provider-specific ID of the user.
 * @param {string} params.username - The username of the new user.
 * @param {string} params.name - The name of the new user.
 * @param {AppConfig} appConfig - The application configuration object.
 * @param {boolean} [params.emailVerified=false] - Optional. Indicates whether the user's email is verified. Defaults to false.
 *
 * @returns {Promise<User>}
 *          A promise that resolves to the newly created user object.
 *
 * @throws {Error} Throws an error if there's an issue creating or saving the new user object.
 */
const createSocialUser = async ({
  email,
  avatarUrl,
  provider,
  providerKey,
  providerId,
  username,
  name,
  appConfig,
  emailVerified,
}) => {
  const { ADMIN_EMAILS } = require('../server/middleware/roles/admin');
  const isAdmin = email && ADMIN_EMAILS.includes(email.toLowerCase());

  const PRO_TRIAL_MS = 7 * 24 * 60 * 60 * 1000;
  const trialExpiryDate = new Date(Date.now() + PRO_TRIAL_MS);

  const update = {
    email,
    avatar: avatarUrl,
    provider,
    [providerKey]: providerId,
    username,
    name,
    emailVerified,
    role: isAdmin ? 'ADMIN' : 'USER_PRO',
    accountStatus: 'active',
    inactiveAt: isAdmin ? null : trialExpiryDate,
  };

  const balanceConfig = getBalanceConfig(appConfig);
  const newUserId = await createUser(update, balanceConfig);

  if (!isAdmin) {
    try {
      const UserPlan = require('~/db/models/UserPlan');
      await UserPlan.findOneAndUpdate(
        { userId: newUserId },
        {
          plan: 'pro',
          planExpiresAt: trialExpiryDate,
          planInterval: 'trial_7d',
          cancelAtPeriodEnd: false,
        },
        { upsert: true, new: true }
      );
      const Notification = require('~/models/Notification');
      await Notification.create({
        user: newUserId,
        type: 'trial_welcome',
        title: '¡Bienvenido a WAPPY PRO! Tienes 7 días gratis',
        body: 'Tu membresía gratuita de 7 días está activa. Disfruta de acceso total a todos los especialistas de IA, agentes y herramientas SG-SST de WAPPY.',
      });
    } catch (planErr) {
      logger.error('[createSocialUser] Error creating UserPlan/Notification for trial:', planErr);
    }
  }
  const fileStrategy = appConfig?.fileStrategy ?? process.env.CDN_PROVIDER;
  const isLocal = fileStrategy === FileSources.local;

  if (!isLocal) {
    const resizedBuffer = await resizeAvatar({
      userId: newUserId,
      input: avatarUrl,
    });
    const { processAvatar } = getStrategyFunctions(fileStrategy);
    const avatar = await processAvatar({
      buffer: resizedBuffer,
      userId: newUserId,
      manual: 'false',
    });
    await updateUser(newUserId, { avatar });
  }

  return await getUserById(newUserId);
};

module.exports = {
  handleExistingUser,
  createSocialUser,
};
