/**
 * GeminiPoolManager.js
 *
 * Despachador Inteligente de Tráfico y Balanceo de Carga para Google Gemini.
 * Gestiona pools dinámicos de claves API (1, 5, 10 o más proyectos de Google Cloud)
 * con rotación Round-Robin inter-turnos, Circuit Breaker (cooldowns de RPM/TPM)
 * y aislamiento de cuota diaria por modelo (RPD).
 */

'use strict';

const logger = require('~/config/winston');

class GeminiPoolManager {
  constructor() {
    /** @type {Map<string, number>} userId -> nextIndex */
    this.userRoundRobinIndex = new Map();

    /** @type {Map<string, number>} apiKey -> timestampExpiresAt */
    this.keyCooldowns = new Map();

    /** @type {Map<string, number>} `${apiKey}_${model}` -> timestampExpiresAt (midnight Pacific) */
    this.dailyExhausted = new Map();

    /** @type {Map<string, number>} apiKey -> timestampExpiresAt para claves con 400 temporal */
    this.invalidKeys = new Map();
  }

  /**
   * Calcula el timestamp en milisegundos correspondiente a la próxima medianoche
   * en hora del Pacífico (Google AI Studio reset time).
   * @returns {number}
   */
  getMidnightPacificTimestamp() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const dateObj = {};
    for (const p of parts) {
      dateObj[p.type] = p.value;
    }

    const pacificYear = parseInt(dateObj.year, 10);
    const pacificMonth = parseInt(dateObj.month, 10) - 1;
    const pacificDay = parseInt(dateObj.day, 10);

    // Medianoche siguiente en hora del Pacífico (~00:00:05 para margen de seguridad)
    const nextMidnightPacific = new Date(Date.UTC(pacificYear, pacificMonth, pacificDay + 1, 7, 0, 5));
    return nextMidnightPacific.getTime();
  }

  /**
   * Extrae la clave limpia en caso de venir embebida en JSON o con comillas
   * @param {string} rawKey
   * @returns {string}
   */
  extractCleanApiKey(rawKey) {
    if (!rawKey || typeof rawKey !== 'string') return '';
    let str = rawKey.trim();
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
      str = str.slice(1, -1).trim();
    }
    if (str.startsWith('{') || str.startsWith('[')) {
      try {
        const obj = JSON.parse(str);
        if (typeof obj === 'object' && obj !== null) {
          str = (
            obj.apiKey ||
            obj.GOOGLE_API_KEY ||
            obj.GOOGLE_KEY ||
            obj.GEMINI_API_KEY ||
            obj.googleKey ||
            obj.key ||
            Object.values(obj).find((v) => typeof v === 'string' && (v.startsWith('AIza') || v.length > 20)) ||
            Object.values(obj)[0] ||
            ''
          );
        }
      } catch (_) {}
    }
    return typeof str === 'string' ? str.trim() : '';
  }

  /**
   * Enmascara una clave API para logs seguros (ej. "AIza...4b1f")
   * @param {string} key
   * @returns {string}
   */
  maskKey(key) {
    if (!key || typeof key !== 'string') return 'null';
    const clean = this.extractCleanApiKey(key);
    if (clean.length <= 8) return '****';
    return `${clean.slice(0, 4)}...${clean.slice(-4)}`;
  }

  /**
   * Retorna una lista priorizada y balanceada de claves API para el modelo y usuario actual.
   *
   * 1. Elimina llaves cuyos cooldowns ya hayan expirado.
   * 2. Clasifica las llaves en:
   *    - READY: listas, sin cooldown y sin agotamiento diario para este modelo.
   *    - COOLING: en pausa temporal de tokens/minuto (RPM/TPM).
   *    - EXHAUSTED: con cuota diaria agotada para este modelo.
   * 3. Aplica Round-Robin cíclico a las llaves READY para no saturar nunca la Llave 0.
   * 4. Retorna `[...readyRotadas, ...cooling, ...exhausted]`.
   *
   * @param {Array<string>} keys - Lista cruda de API Keys del usuario/entorno
   * @param {string} model - Nombre del modelo a consultar (ej. "gemini-3.6-flash")
   * @param {string} [userId='global'] - Identificador del usuario para Round-Robin por sesión
   * @returns {Array<string>} Lista reordenada de claves API
   */
  getPrioritizedKeys(keys, model = '', userId = 'global') {
    if (!Array.isArray(keys) || keys.length === 0) {
      return [];
    }

    const now = Date.now();

    // 1. Limpieza de expirados
    for (const [key, expiresAt] of this.invalidKeys.entries()) {
      if (expiresAt <= now) {
        this.invalidKeys.delete(key);
      }
    }
    for (const [key, expiresAt] of this.keyCooldowns.entries()) {
      if (expiresAt <= now) {
        this.keyCooldowns.delete(key);
      }
    }
    for (const [keyModel, expiresAt] of this.dailyExhausted.entries()) {
      if (expiresAt <= now) {
        this.dailyExhausted.delete(keyModel);
      }
    }

    const cleanKeys = keys
      .map((k) => this.extractCleanApiKey(k))
      .filter((k) => typeof k === 'string' && k.length > 0 && k !== 'user_provided');

    // Filtrar llaves que hayan arrojado 400 Bad Request recientemente, salvo que todas lo sean
    const validKeys = cleanKeys.filter((k) => !this.invalidKeys.has(k) || this.invalidKeys.get(k) <= now);
    const candidateKeys = validKeys.length > 0 ? validKeys : cleanKeys;

    if (candidateKeys.length <= 1) {
      return candidateKeys;
    }

    const cleanUserId = (typeof userId === 'object' && userId !== null)
      ? (userId.id || userId._id || userId.userId || 'global')
      : (typeof userId === 'string' ? userId : 'global');

    const cleanModel = (model || '').toLowerCase().trim();

    // 2. Clasificación de llaves
    const readyKeys = [];
    const coolingKeys = [];
    const exhaustedKeys = [];

    for (const key of candidateKeys) {
      const isCooling = this.keyCooldowns.has(key);
      const isDailyExhausted = cleanModel ? this.dailyExhausted.has(`${key}_${cleanModel}`) : false;

      if (isDailyExhausted) {
        exhaustedKeys.push(key);
      } else if (isCooling) {
        coolingKeys.push(key);
      } else {
        readyKeys.push(key);
      }
    }

    // 3. Round-Robin sobre las llaves READY
    let rotatedReadyKeys = readyKeys;
    if (readyKeys.length > 1) {
      const currentIndex = this.userRoundRobinIndex.get(cleanUserId) || 0;
      const safeIndex = currentIndex % readyKeys.length;

      // Desplazar el inicio al safeIndex
      rotatedReadyKeys = [
        ...readyKeys.slice(safeIndex),
        ...readyKeys.slice(0, safeIndex),
      ];

      // Avanzar el puntero para la próxima petición del usuario
      this.userRoundRobinIndex.set(cleanUserId, (safeIndex + 1) % readyKeys.length);
    } else if (readyKeys.length === 0 && coolingKeys.length === 0 && exhaustedKeys.length > 0) {
      // Rescate cíclico: Si todas las llaves estaban aisladas, permitir rotación de rescate
      const currentIndex = this.userRoundRobinIndex.get(cleanUserId) || 0;
      const safeIndex = currentIndex % exhaustedKeys.length;
      rotatedReadyKeys = [
        ...exhaustedKeys.slice(safeIndex),
        ...exhaustedKeys.slice(0, safeIndex),
      ];
      this.userRoundRobinIndex.set(cleanUserId, (safeIndex + 1) % exhaustedKeys.length);
    }

    const prioritized = readyKeys.length > 0
      ? [...rotatedReadyKeys, ...coolingKeys, ...exhaustedKeys]
      : rotatedReadyKeys;

    // Log informativo si hubo saltos de llaves
    if (coolingKeys.length > 0 || exhaustedKeys.length > 0) {
      logger.info(
        `[GeminiPoolManager] Pool para modelo "${cleanModel || 'general'}": ` +
        `${readyKeys.length} listas, ${coolingKeys.length} en enfriamiento, ${exhaustedKeys.length} agotadas hoy. ` +
        `Llave inicial: ${this.maskKey(prioritized[0])}`
      );
    }

    return prioritized;
  }

  /**
   * Notifica un fallo o límite encontrado en una clave API específica.
   *
   * @param {string} key - Clave API afectada
   * @param {string} model - Modelo que falló
   * @param {object} info - Metadatos del error
   * @param {number} [info.status] - Código HTTP (429, 503, 403, etc.)
   * @param {string} [info.message] - Mensaje de error
   * @param {number} [info.retryDelayMs] - Tiempo sugerido por Google en ms
   * @param {boolean} [info.isDailyLimit] - Si agotó la cuota diaria (RPD)
   */
  reportKeyStatus(key, model = '', info = {}) {
    if (!key || typeof key !== 'string') return;

    const { status, message = '', retryDelayMs, isDailyLimit } = info;
    const cleanKey = this.extractCleanApiKey(key);
    const cleanModel = (model || '').toLowerCase().trim();
    const masked = this.maskKey(cleanKey || key);
    const msg = message.toLowerCase();

    // 0. Detección de Clave Inválida o Revocada (SOLO si Google especifica error de clave API)
    const isInvalidKey =
      msg.includes('api_key_invalid') ||
      msg.includes('api key not valid') ||
      msg.includes('invalid api key') ||
      msg.includes('api_key_expired');

    if (isInvalidKey) {
      // Cooldown de 5 minutos en lugar de baneo permanente
      this.invalidKeys.set(cleanKey, Date.now() + 5 * 60 * 1000);
      logger.error(
        `[GeminiPoolManager] [CircuitBreaker] Llave ${masked} en pausa temporal de 5m por error de clave (400).`
      );
      return;
    }

    // 1. Detección de Cuota Diaria Agotada (RPD - 20/20)
    const isDaily = isDailyLimit ||
      msg.includes('generaterequestsperday') ||
      msg.includes('daily request') ||
      (/\b(?:requests?\s+per\s+day|per\s+day\b|daily\s+quota|daily\s+limit)/i.test(msg)) ||
      (/\blimit:\s*20\b/i.test(msg) && (msg.includes('day') || !msg.includes('minute')));

    if (isDaily && cleanModel) {
      const resetTime = this.getMidnightPacificTimestamp();
      this.dailyExhausted.set(`${key}_${cleanModel}`, resetTime);
      const hoursUntilReset = Math.round((resetTime - Date.now()) / (1000 * 60 * 60));
      logger.warn(
        `[GeminiPoolManager] [CircuitBreaker] Llave ${masked} AGOTADA HOY para "${cleanModel}". ` +
        `Aislada para este modelo hasta medianoche PT (~${hoursUntilReset}h). Disponible para otros modelos.`
      );
      return;
    }

    // 2. Detección de Límite Temporal de Frecuencia (429 RPM / TPM)
    const isRateLimit = status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('too many requests');
    if (isRateLimit) {
      // Usar retryDelay de Google si viene en el error, o 25 segundos por defecto
      let delay = 25000;
      if (typeof retryDelayMs === 'number' && retryDelayMs > 0) {
        delay = Math.min(Math.max(retryDelayMs, 3000), 60000); // Entre 3s y 60s
      } else {
        const retryMatch = msg.match(/retry in ([0-9\.]+)s/);
        if (retryMatch && retryMatch[1]) {
          delay = Math.round(parseFloat(retryMatch[1]) * 1000) + 500;
        }
      }

      this.keyCooldowns.set(key, Date.now() + delay);
      logger.warn(
        `[GeminiPoolManager] [CircuitBreaker] Llave ${masked} en pausa temporal por ${Math.round(delay / 1000)}s ` +
        `debido a límite de tokens/minuto (429). El carrusel rotará a las demás llaves.`
      );
      return;
    }

    // 3. Sobrecarga de Servidor (503 Service Unavailable / High Demand)
    const is503 = status === 503 || msg.includes('503') || msg.includes('high demand') || msg.includes('overloaded');
    if (is503) {
      // 503 es una saturación del MODELO en Google, NO de la clave API.
      // Las claves API se mantienen activas para no retrasar la rotación al siguiente modelo de respaldo.
      logger.info(
        `[GeminiPoolManager] Sobrecarga temporal (503) en modelo "${cleanModel}". Las claves API se conservan listas para modelos de respaldo.`
      );
    }
  }

  /**
   * Notifica que una clave API ejecutó una llamada exitosa.
   * Limpia cualquier cooldown temporal previo.
   *
   * @param {string} key
   * @param {string} model
   */
  reportKeySuccess(key, model = '') {
    if (!key || typeof key !== 'string') return;
    if (this.keyCooldowns.has(key)) {
      this.keyCooldowns.delete(key);
    }
  }
}

// Instancia única (Singleton) en memoria
const geminiPoolManager = new GeminiPoolManager();

module.exports = geminiPoolManager;
