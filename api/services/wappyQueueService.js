const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const ChatSSTMessage = require('../models/ChatSSTMessage');
const { getUserKey } = require('../server/services/UserService');

// Modelos exactos configurados en el sistema WAPPY (coincidentes con sgsstGemini.js)
const SYSTEM_GOOGLE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
];

class WappyQueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  async getAllRotatedApiKeys(userId) {
    const keysSet = new Set();

    const extractKeysFromStringOrObj = (stored) => {
      if (!stored) return;
      let rawStr = '';
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          rawStr = parsed.GOOGLE_API_KEY || parsed.GOOGLE_KEY || Object.values(parsed).join(',');
        }
      } catch {
        rawStr = stored;
      }

      if (typeof rawStr === 'string' && rawStr.length > 5 && rawStr !== 'user_provided') {
        rawStr.split(',').forEach((k) => {
          const trimmed = k.trim();
          if (trimmed && trimmed.length > 5 && trimmed !== 'user_provided') {
            keysSet.add(trimmed);
          }
        });
      }
    };

    // 1. Claves del usuario actual
    if (userId) {
      try {
        const stored = await getUserKey({ userId, name: 'google' });
        extractKeysFromStringOrObj(stored);
      } catch (err) {
        // Ignorar
      }
    }

    // 2. Claves del Administrador
    try {
      const User = mongoose.model('User');
      const adminUser = await User.findOne({ role: 'ADMIN' });
      if (adminUser) {
        const storedAdmin = await getUserKey({ userId: adminUser._id, name: 'google' });
        extractKeysFromStringOrObj(storedAdmin);
      }
    } catch (err) {
      // Ignorar
    }

    // 3. Claves en variables de entorno globales
    const envKeys = [
      process.env.GOOGLE_AI_API_KEY,
      process.env.GOOGLE_KEY,
      process.env.GEMINI_API_KEY,
      process.env.GOOGLE_API_KEY,
    ];

    envKeys.forEach((envK) => {
      if (envK && envK !== 'user_provided') {
        envK.split(',').forEach((k) => {
          const trimmed = k.trim();
          if (trimmed && trimmed.length > 5 && trimmed !== 'user_provided') {
            keysSet.add(trimmed);
          }
        });
      }
    });

    return Array.from(keysSet);
  }

  enqueue(userMessage) {
    this.queue.push(userMessage);
    const position = this.queue.length;

    if (this.io && position > 1) {
      this.io.emit('chat_sst_queue_update', {
        messageId: userMessage._id,
        position,
        totalInQueue: position,
      });
    }

    this.processQueue();
    return position;
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const currentMessage = this.queue[0];

    try {
      if (this.io) {
        this.io.emit('chat_sst_bot_status', {
          status: 'typing',
          replyingTo: currentMessage.senderName,
        });
      }

      const userId = currentMessage.user?._id || currentMessage.user;
      const apiKeys = await this.getAllRotatedApiKeys(userId);

      if (apiKeys.length === 0) {
        throw new Error('No se encontraron claves API de Google/Gemini configuradas en el sistema.');
      }

      const envModels = (process.env.GOOGLE_MODELS || '')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const modelFallbacks = envModels.length > 0 ? envModels : SYSTEM_GOOGLE_MODELS;

      const systemInstruction = `Eres @wappy, el agente de Inteligencia Artificial experto en Seguridad y Salud en el Trabajo (SST) para la plataforma WAPPY IA.
REGLAS DE FORMATO Y ESTILO:
1. Sé natural, directo y conversacional (estilo chat tipo WhatsApp).
2. ADAPTA LA LONGITUD DE TU RESPUESTA AL MENSAJE DEL USUARIO:
   - Si el usuario solo saluda (ej: "hola", "buenos días", "hola @wappy"), responde ÚNICAMENTE con un saludo breve y cordial preguntando en qué puedes ayudarle (ej: "¡Hola ${currentMessage.senderName}! ¿En qué te puedo colaborar hoy con tu Sistema de Gestión SST?").
   - NO generes discursos largos, presentaciones extensas, ni listas de viñetas cuando el usuario solo está saludando o haciendo una pregunta corta.
   - Si el usuario hace una pregunta técnica específica de SST (Decreto 1072, Res 0312, GTC 45, etc.), responde de forma clara, precisa y profesional.`;

      // Obtener el historial de los últimos 10 mensajes anteriores a este para dar contexto al bot
      const rawHistory = await ChatSSTMessage.find({
        _id: { $ne: currentMessage._id },
        createdAt: { $lt: currentMessage.createdAt || new Date() }
      })
      .sort({ createdAt: -1 })
      .limit(10);

      const history = rawHistory.reverse();

      let contextString = '';
      if (history.length > 0) {
        contextString = "HISTORIAL RECIENTE DEL CHAT (para contexto y coherencia):\n" + 
          history.map(h => `[${h.senderName} (${h.senderRole})]: ${h.content}`).join('\n') + 
          '\n\n';
      }

      const prompt = `${contextString}Último mensaje recibido de ${currentMessage.senderName} (el cual debes responder ahora):
"${currentMessage.content}"

Responde conversacionalmente de acuerdo a las reglas de estilo y el contexto del historial previo.`;


      let botResponseText = '';
      let lastError = null;
      let succeeded = false;

      for (let mi = 0; mi < modelFallbacks.length && !succeeded; mi++) {
        const currentModel = modelFallbacks[mi];
        for (let i = 0; i < apiKeys.length; i++) {
          const apiKey = apiKeys[i];
          try {
            console.log(`[Chat SST @wappy] Intentando Clave #${i + 1}/${apiKeys.length} con modelo oficial "${currentModel}"`);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
              model: currentModel,
              systemInstruction,
            });

            const result = await model.generateContent(prompt);
            botResponseText = result.response.text();
            lastError = null;
            succeeded = true;
            break;
          } catch (geminiError) {
            lastError = geminiError;
            const status = geminiError.status || geminiError.statusCode;
            const msg = geminiError.message || '';

            if (
              status === 400 ||
              status === 429 ||
              status === 403 ||
              msg.includes('API_KEY_INVALID') ||
              msg.includes('API key not valid') ||
              msg.includes('leaked') ||
              msg.includes('quota') ||
              msg.includes('Forbidden')
            ) {
              console.warn(`[Chat SST @wappy] Clave #${i + 1} rechazada (${status || 'invalid'}). Rotando a la siguiente clave...`);
              continue;
            }

            if (status === 503 || msg.includes('overloaded') || msg.includes('Service Unavailable')) {
              console.warn(`[Chat SST @wappy] Modelo "${currentModel}" no disponible (503). Cambiando a modelo fallback...`);
              break;
            }

            throw geminiError;
          }
        }
      }

      if (!succeeded && lastError) {
        throw new Error(`Todas las claves y modelos de Google AI fallaron. Último error: ${lastError.message}`);
      }

      const botMessage = await ChatSSTMessage.create({
        senderName: 'WAPPY SST',
        senderRole: 'bot',
        content: botResponseText,
        mentions: [`@${currentMessage.senderName}`],
        replyTo: currentMessage._id,
        status: 'completed',
      });

      if (this.io) {
        this.io.emit('chat_sst_message', botMessage);
        this.io.emit('chat_sst_bot_status', { status: 'idle' });
      }
    } catch (error) {
      console.error('Error procesando consulta @wappy en cola:', error);
      const errorMessage = await ChatSSTMessage.create({
        senderName: 'WAPPY SST',
        senderRole: 'bot',
        content: `Lo siento @${currentMessage.senderName}, ocurrió un inconveniente al procesar tu solicitud: ${error.message}. Por favor intenta de nuevo en unos momentos.`,
        replyTo: currentMessage._id,
        status: 'error',
      });
      if (this.io) {
        this.io.emit('chat_sst_message', errorMessage);
        this.io.emit('chat_sst_bot_status', { status: 'idle' });
      }
    } finally {
      this.queue.shift();
      this.isProcessing = false;

      if (this.io && this.queue.length > 0) {
        this.queue.forEach((msg, idx) => {
          this.io.emit('chat_sst_queue_update', {
            messageId: msg._id,
            position: idx + 1,
            totalInQueue: this.queue.length,
          });
        });
      }

      this.processQueue();
    }
  }

  getQueueLength() {
    return this.queue.length;
  }
}

const wappyQueueService = new WappyQueueService();
module.exports = wappyQueueService;
