const path = require('path');
const { EModelEndpoint, AuthKeys } = require('librechat-data-provider');
const { getGoogleConfig, isEnabled, loadServiceKey } = require('@librechat/api');
const { getUserKey, checkUserKeyExpiry } = require('~/server/services/UserService');
const { GoogleClient } = require('~/app');

const initializeClient = async ({ req, res, endpointOption, overrideModel, optionsOnly }) => {
  const { GOOGLE_KEY, GOOGLE_REVERSE_PROXY, GOOGLE_AUTH_HEADER, PROXY } = process.env;
  const isUserProvided = GOOGLE_KEY === 'user_provided';
  const { key: expiresAt } = req.body;

  let userKey = null;
  if (isUserProvided) {
    try {
      userKey = await getUserKey({ userId: req.user.id, name: EModelEndpoint.google });
      if (expiresAt) {
        checkUserKeyExpiry(expiresAt, EModelEndpoint.google);
      }
    } catch (_err) {
      // User does not have a personal key saved
      userKey = null;
    }
  }

  let serviceKey = {};

  // Check fallbacks for Google key:
  // 1. Agent or endpointOption apiKey
  const agentApiKey = endpointOption?.model_parameters?.apiKey || req.body?.agent?.model_parameters?.apiKey;

  // 2. Environment keys (GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_KEY if not 'user_provided')
  const envKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || (GOOGLE_KEY !== 'user_provided' ? GOOGLE_KEY : null) || '')
    .split(',')[0]
    ?.trim();

  let resolvedApiKey = agentApiKey || (envKey && envKey !== 'user_provided' ? envKey : null);

  // 3. Fallback: Search Key collection in database for admin/platform keys (tenshi_google, google)
  if (!userKey && !resolvedApiKey) {
    try {
      const { Key } = require('~/db/models');
      if (Key) {
        const adminKeyDoc = await Key.findOne({ name: { $in: ['tenshi_google', 'google'] } }).lean();
        if (adminKeyDoc) {
          const stored = await getUserKey({ userId: String(adminKeyDoc.userId), name: adminKeyDoc.name });
          if (stored) {
            resolvedApiKey = stored.includes(',') ? stored.split(',')[0].trim() : stored.trim();
          }
        }
      }
    } catch (_e) {
      // ignore
    }
  }

  // 4. If optionsOnly is true and still no key, use a safe placeholder so getGoogleConfig can parse options without throwing
  if (!userKey && !resolvedApiKey && optionsOnly) {
    resolvedApiKey = 'AIzaSy-placeholder-for-options-only';
  }

  if (isUserProvided && !userKey && !resolvedApiKey && !optionsOnly) {
    throw new Error(
      JSON.stringify({
        type: 'no_user_key',
      }),
    );
  }

  /** Check if GOOGLE_KEY is provided at all (including 'user_provided' with resolved key) */
  const isGoogleKeyProvided = Boolean(
    userKey || resolvedApiKey || (GOOGLE_KEY && GOOGLE_KEY.trim() !== '' && GOOGLE_KEY !== 'user_provided'),
  );

  if (!isGoogleKeyProvided) {
    /** Only attempt to load service key if GOOGLE_KEY is not provided */
    try {
      const serviceKeyPath =
        process.env.GOOGLE_SERVICE_KEY_FILE ||
        path.join(__dirname, '../../../..', 'data', 'auth.json');
      serviceKey = await loadServiceKey(serviceKeyPath);
      if (!serviceKey) {
        serviceKey = {};
      }
    } catch (_e) {
      // Service key loading failed, but that's okay if not required
      serviceKey = {};
    }
  }

  let credentials;
  if (userKey && typeof userKey === 'object') {
    credentials = userKey;
  } else if (userKey && typeof userKey === 'string') {
    try {
      credentials = JSON.parse(userKey);
    } catch {
      credentials = { [AuthKeys.GOOGLE_API_KEY]: userKey };
    }
  } else if (resolvedApiKey) {
    credentials = {
      [AuthKeys.GOOGLE_SERVICE_KEY]: serviceKey,
      [AuthKeys.GOOGLE_API_KEY]: resolvedApiKey,
    };
  } else {
    credentials = {
      [AuthKeys.GOOGLE_SERVICE_KEY]: serviceKey,
      [AuthKeys.GOOGLE_API_KEY]: GOOGLE_KEY,
    };
  }

  let clientOptions = {};

  const appConfig = req.config;
  /** @type {undefined | TBaseEndpoint} */
  const allConfig = appConfig.endpoints?.all;
  /** @type {undefined | TBaseEndpoint} */
  const googleConfig = appConfig.endpoints?.[EModelEndpoint.google];

  if (googleConfig) {
    clientOptions.streamRate = googleConfig.streamRate;
    clientOptions.titleModel = googleConfig.titleModel;
  }

  if (allConfig) {
    clientOptions.streamRate = allConfig.streamRate;
  }

  clientOptions = {
    req,
    res,
    reverseProxyUrl: GOOGLE_REVERSE_PROXY ?? null,
    authHeader: isEnabled(GOOGLE_AUTH_HEADER) ?? null,
    proxy: PROXY ?? null,
    ...clientOptions,
    ...endpointOption,
  };

  if (optionsOnly) {
    clientOptions = Object.assign(
      {
        modelOptions: endpointOption?.model_parameters ?? {},
      },
      clientOptions,
    );
    if (overrideModel) {
      clientOptions.modelOptions.model = overrideModel;
    }
    return getGoogleConfig(credentials, clientOptions);
  }

  const client = new GoogleClient(credentials, clientOptions);

  return {
    client,
    credentials,
  };
};

module.exports = initializeClient;
