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
   * Enmascara una clave API para logs seguros (ej. "AIza...4b1f")
   * @param {string} key
   * @returns {string}
   */
  maskKey(key) {
    if (!key || typeof key !== 'string') return 'null';
    if (key.length <= 8) return '****';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
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
   * @param {string} model - Nombre del modelo a consultar (ej. "gemini-3.8-flash")
   * @param {string} [userId='global'] - Identificador del usuario para Round-Robin por sesión
   * @returns {Array<string>} Lista reordenada de claves API
   */
  getPrioritizedKeys(keys, model = '', userId = 'global') {
    if (!Array.isArray(keys) || keys.length === 0) {
      return [];
    }

    const cleanKeys = keys.filter((k) => typeof k === 'string' && k.trim().length > 0);
    if (cleanKeys.length <= 1) {
      return cleanKeys;
    }

    const now = Date.now();
    const cleanUserId = (typeof userId === 'object' && userId !== null)
      ? (userId.id || userId._id || userId.userId || 'global')
      : (typeof userId === 'string' ? userId : 'global');

    const cleanModel = (model || '').toLowerCase().trim();

    // 1. Limpieza de expirados
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

    // 2. Clasificación de llaves
    const readyKeys = [];
    const coolingKeys = [];
    const exhaustedKeys = [];

    for (const key of cleanKeys) {
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
    }

    const prioritized = [...rotatedReadyKeys, ...coolingKeys, ...exhaustedKeys];

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
    const cleanModel = (model || '').toLowerCase().trim();
    const masked = this.maskKey(key);
    const msg = message.toLowerCase();

    // 1. Detección de Cuota Diaria Agotada (RPD - 20/20)
    const isDaily = isDailyLimit ||
      msg.includes('generaterequestsperday') ||
      msg.includes('daily request') ||
      msg.includes('limit: 20');

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
      // Usar retryDelay de Google si viene en el error, o 45 segundos por defecto
      let delay = 45000;
      if (typeof retryDelayMs === 'number' && retryDelayMs > 0) {
        delay = Math.min(Math.max(retryDelayMs, 5000), 120000); // Entre 5s y 120s
      } else {
        const retryMatch = msg.match(/retry in ([0-9\.]+)s/);
        if (retryMatch && retryMatch[1]) {
          delay = Math.round(parseFloat(retryMatch[1]) * 1000) + 1000;
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
