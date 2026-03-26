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

  const envModelsStr = process.env.GOOGLE_MODELS || 'gemini-1.5-pro,gemini-1.5-flash';
  const fallbackModels = envModelsStr.split(',').map(m => m.trim()).filter(m => m && m !== modelName);
  let modelsToTry = [modelName, ...fallbackModels];

  let currentKeyIdx = 0;
  let currentModelIdx = 0;
  let lastError;

  while (currentModelIdx < modelsToTry.length) {
    const currentModel = modelsToTry[currentModelIdx];
    
    while (currentKeyIdx < apiKeys.length) {
      const apiKey = apiKeys[currentKeyIdx];
      try {
        if (currentKeyIdx > 0 || currentModelIdx > 0) {
          logger.warn(`[SGSST Gemini] Recuperando... probando Modelo=${currentModel}, Clave=#${currentKeyIdx + 1}`);
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const rotationModel = genAI.getGenerativeModel({ model: currentModel, generationConfig: genConfig });
        
        const result = await rotationModel.generateContent(promptText);
        return result; // success
      } catch (err) {
        lastError = err;
        const msg = (err.message || '').toLowerCase();
        
        const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('rate limit') || msg.includes('too many requests');
        const is503 = msg.includes('503') || msg.includes('service unavailable') || msg.includes('overloaded');
        
        if (isRateLimit) {
           logger.warn(`[SGSST Gemini] Clave #${currentKeyIdx + 1} agotada (429). Rotando API Key...`);
           currentKeyIdx++;
           continue; // Loop inner while
        }
        
        if (is503) {
           logger.warn(`[SGSST Gemini] Modelo ${currentModel} sobrecargado (503). Cambiando a modelo de respaldo...`);
           currentModelIdx++;
           break; // Breaks inner while, repeats outer while with next model (same key)
        }
        
        // Any other error (400, 404, etc) should crash immediately to expose real issues
        logger.error(`[SGSST Gemini] Error irrevocable con ${currentModel}: ${err.message}`);
        throw err;
      }
    }
    
    // If we exhausted all API keys (currentKeyIdx reached the end)
    if (currentKeyIdx >= apiKeys.length) {
      logger.error(`[SGSST Gemini] Todas las claves de API configuradas (${apiKeys.length}) se quedaron sin cuota.`);
      throw lastError; 
    }
  }

  throw lastError; // E.g., if all models returned 503
}

module.exports = { getAllApiKeys, generateWithKeyRotation };
