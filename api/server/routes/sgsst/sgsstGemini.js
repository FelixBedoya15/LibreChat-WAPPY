/**
 * sgsstGemini.js — Shared Gemini AI helpers for all SGSST routes
 *
 * API Key resolution mirrors EXACTLY how GoogleClient.js (the chat) does it:
 *   1. If GOOGLE_KEY === 'user_provided', load the user's stored key from DB.
 *      The stored value is a JSON string like: {"GOOGLE_API_KEY":"AIza...","GOOGLE_API_KEY_2":"AIza..."}
 *      We extract the value of AuthKeys.GOOGLE_API_KEY from that object.
 *   2. Otherwise use GOOGLE_KEY from .env (comma-separated list supported).
 *   3. The resulting comma-separated string is split exactly as GoogleClient does:
 *      apiKey.split(',').map(k => k.trim()).filter(k => k.length > 0)
 *
 * Rotation rules:
 *   - 429 / quota / rate-limit → rotate to next API key (same model).
 *   - 503 / service unavailable / overloaded → rotate to next MODEL from
 *     SGSST_FALLBACK_MODELS (only non-live Gemini models), keeping same key index.
 *   - Any other error (400, 404…) → surface immediately, no retry.
 *
 * Live sessions rotate ONLY between live-capable models (gemini-2.5-flash-lite-preview-*).
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys, EModelEndpoint } = require('librechat-data-provider');
const { getUserKey } = require('~/server/services/UserService');
const { logger } = require('~/config');

// ──────────────────────────────────────────────
// Models available for 503 fallback rotation
// (excludes live-only preview models)
// ──────────────────────────────────────────────
const SGSST_FALLBACK_MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

// Live-only models for VoiceSession / LiveAnalysis rotation
const LIVE_FALLBACK_MODELS = [
  'gemini-2.5-flash-lite-preview-12-2025',
  'gemini-2.5-flash-lite-preview-09-2025',
];

/**
 * Resolves the API key(s) for the given user — IDENTICAL logic to GoogleClient + initialize.js
 *
 * @param {string} userId  MongoDB ObjectId of the authenticated user
 * @returns {Promise<string[]>}  Ordered list of API keys to try (at least one)
 */
async function resolveApiKeys(userId) {
  const { GOOGLE_KEY, GEMINI_API_KEY } = process.env;
  const isUserProvided = GOOGLE_KEY === 'user_provided';

  let rawApiKey = '';

  if (isUserProvided) {
    // Mirror of initialize.js: load user's stored key from DB
    try {
      const storedRaw = await getUserKey({ userId, name: EModelEndpoint.google });
      // storedRaw is a decrypted JSON string like:
      //   '{"GOOGLE_API_KEY":"AIzaSy...","GOOGLE_API_KEY_2":"AIzaSy..."}'
      // OR a plain key string for legacy saves.
      let parsed = null;
      try { parsed = JSON.parse(storedRaw); } catch { /* not JSON */ }

      if (parsed && typeof parsed === 'object') {
        // Extract the value under AuthKeys.GOOGLE_API_KEY — same as GoogleClient constructor
        rawApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || '';
      } else if (typeof storedRaw === 'string' && storedRaw.length > 5) {
        rawApiKey = storedRaw.trim();
      }
    } catch (err) {
      // NO_USER_KEY → fall through to env key so we always have something
      logger.debug(`[SGSST Gemini] No user key found for ${userId}: ${err.message}`);
    }
  }

  // If user key not found / not user_provided, fall back to env key
  if (!rawApiKey) {
    rawApiKey = GOOGLE_KEY || GEMINI_API_KEY || '';
    // 'user_provided' is not a real key
    if (rawApiKey === 'user_provided') rawApiKey = '';
  }

  // Split exactly as GoogleClient does
  const keys = rawApiKey
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  if (keys.length === 0) {
    throw new Error(
      'No hay claves API de Google configuradas. ' +
      'Configura tu clave en "Establecer clave API para Google" en el panel del chat o en el archivo .env.'
    );
  }

  logger.debug(`[SGSST Gemini] Resolved ${keys.length} API key(s) for user ${userId}.`);
  return keys;
}

/**
 * Runs a Gemini generateContent request with:
 *   - API-key rotation on 429/quota errors  (same as AgentClient / GoogleClient)
 *   - Model rotation on 503/overloaded errors using SGSST_FALLBACK_MODELS
 *
 * @param {object|string} modelInstance  Either { model, generationConfig } or a plain model name string
 * @param {string}        userId         Authenticated user's MongoDB ObjectId
 * @param {*}             promptText     Prompt string or parts array
 * @returns {Promise<*>}                 The Gemini GenerateContentResult
 */
async function generateWithKeyRotation(modelInstance, userId, promptText) {
  // Accept both object { model, generationConfig } and plain string
  const preferredModel = (
    typeof modelInstance === 'string'
      ? modelInstance
      : (modelInstance.model || '')
  ).replace('models/', '').trim() || 'gemini-2.5-flash';

  const genConfig = (typeof modelInstance === 'object' && modelInstance.generationConfig)
    ? modelInstance.generationConfig
    : {};

  // Build ordered model list: preferred first, then fallbacks (excluding preferred to avoid dup)
  const fallbacks = SGSST_FALLBACK_MODELS.filter(m => m !== preferredModel);
  const modelsToTry = [preferredModel, ...fallbacks];

  const apiKeys = await resolveApiKeys(userId);

  let currentModelIdx = 0;
  let currentKeyIdx = 0;
  let lastError;

  while (currentModelIdx < modelsToTry.length) {
    const currentModel = modelsToTry[currentModelIdx];
    // Reset key index when we switch models
    currentKeyIdx = 0;

    while (currentKeyIdx < apiKeys.length) {
      const apiKey = apiKeys[currentKeyIdx];
      try {
        if (currentKeyIdx > 0 || currentModelIdx > 0) {
          logger.warn(
            `[SGSST Gemini] Reintentando... Modelo=${currentModel}, ` +
            `Clave=#${currentKeyIdx + 1}/${apiKeys.length}`
          );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: currentModel, generationConfig: genConfig });
        const result = await model.generateContent(promptText);
        return result; // ✅ success

      } catch (err) {
        lastError = err;
        const msg = (err.message || '').toLowerCase();
        const status = err.status || (err.response && err.response.status) || 0;

        const isRateLimit =
          status === 429 ||
          msg.includes('429') ||
          msg.includes('quota') ||
          msg.includes('rate limit') ||
          msg.includes('too many requests');

        const is503 =
          status === 503 ||
          msg.includes('503') ||
          msg.includes('service unavailable') ||
          msg.includes('overloaded');

        if (isRateLimit) {
          logger.warn(
            `[SGSST Gemini] Clave #${currentKeyIdx + 1} agotada (429/quota). ` +
            `Rotando a siguiente clave API...`
          );
          currentKeyIdx++;
          continue; // try next key, same model
        }

        if (is503) {
          logger.warn(
            `[SGSST Gemini] Modelo "${currentModel}" sobrecargado (503). ` +
            `Rotando a modelo de respaldo...`
          );
          currentModelIdx++;
          break; // break inner → outer while uses next model (key resets to 0)
        }

        // Any other error (400 bad key, 404 model not found, etc.) → fail fast
        logger.error(`[SGSST Gemini] Error irrevocable con "${currentModel}": ${err.message}`);
        throw err;
      }
    }

    // If we exhausted all keys for this model without a 503
    if (currentKeyIdx >= apiKeys.length) {
      logger.error(
        `[SGSST Gemini] Todas las claves API (${apiKeys.length}) se agotaron ` +
        `para el modelo "${modelsToTry[currentModelIdx - 1] || modelsToTry[0]}".`
      );
      throw lastError;
    }
  }

  // All models returned 503
  logger.error('[SGSST Gemini] Todos los modelos de respaldo están sobrecargados (503).');
  throw lastError;
}

module.exports = { resolveApiKeys, generateWithKeyRotation, SGSST_FALLBACK_MODELS, LIVE_FALLBACK_MODELS };
