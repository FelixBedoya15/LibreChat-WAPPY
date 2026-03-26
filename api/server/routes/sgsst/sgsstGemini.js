/**
 * sgsstGemini.js — Shared Gemini AI helpers for all SGSST routes
 *
 * Rules:
 *  1. The model name ALWAYS comes from the user's personalization settings.
 *  2. On quota error (429), we rotate to the next available API key.
 *  3. On any other error, we surface the real error immediately.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { getUserKey } = require('~/server/services/UserService');
const { logger } = require('~/config');

async function getAllApiKeys(userId) {
  const keys = [];
  try {
    const storedKey = await getUserKey({ userId, name: 'google' });
    if (storedKey) {
      let parsed;
      try { parsed = JSON.parse(storedKey); } catch { parsed = null; }
      if (parsed && typeof parsed === 'object') {
         for (const [k, v] of Object.entries(parsed)) {
           if (typeof v === 'string' && v.trim().length > 10 && !keys.includes(v.trim())) {
             keys.push(v.trim());
           }
         }
      } else if (typeof storedKey === 'string' && storedKey.trim().length > 10) {
         keys.push(storedKey.trim());
      }
    }
  } catch (err) {
    logger.debug('[SGSST Gemini] Error reading personal keys:', err.message);
  }

  const envKeys = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY || '';
  for (const k of envKeys.split(',')) {
    const trimmed = k.trim();
    if (trimmed && !keys.includes(trimmed)) {
      keys.push(trimmed);
    }
  }
  return keys;
}

/**
 * Runs a Gemini generation request with API-key rotation on 429 quota errors.
 * Backward compatible drop-in replacement for generateWithRetry.
 *
 * @param {object}  modelInstance The original GoogleGenerativeAI model instance created by the route
 * @param {string}  userId        The user's MongoDB ObjectId to fetch keys correctly
 * @param {*}       promptText    Prompt content (string or parts array)
 * @returns {Promise<*>}          The Gemini GenerateContentResult
 */
async function generateWithKeyRotation(modelInstance, userId, promptText) {
  const modelName = (modelInstance.model || 'gemini-1.5-flash').replace('models/', '');
  let genConfig = {};
  if (modelInstance.generationConfig) { 
    genConfig = modelInstance.generationConfig; 
  }

  const apiKeys = await getAllApiKeys(userId);
  if (!apiKeys || apiKeys.length === 0) {
    throw new Error('No hay claves API de Google configuradas. Configura tu clave en la opción de Google del chat o en el archivo .env.');
  }

  let lastError;

  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    try {
      if (i > 0) {
        logger.warn(`[SGSST Gemini] Rotando a clave alternativa #${i + 1} (modelo: ${modelName})...`);
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const rotationModel = genAI.getGenerativeModel({ model: modelName, generationConfig: genConfig });
      
      const result = await rotationModel.generateContent(promptText);
      
      if (i > 0) {
        logger.info(`[SGSST Gemini] Éxito con clave alternativa #${i + 1}`);
      }
      return result;
    } catch (err) {
      const isRateLimit = err.message && (
        err.message.includes('429') ||
        err.message.toLowerCase().includes('quota') ||
        err.message.toLowerCase().includes('rate limit') ||
        err.message.toLowerCase().includes('too many requests')
      );

      lastError = err;

      if (isRateLimit && i < apiKeys.length - 1) {
        logger.warn(`[SGSST Gemini] Clave #${i + 1} agotó su cuota (429).`);
        continue;
      }

      logger.error(`[SGSST Gemini] Error con modelo "${modelName}", clave #${i + 1}: ${err.message}`);
      break;
    }
  }

  throw lastError;
}

module.exports = { getAllApiKeys, generateWithKeyRotation };
