const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatSSTMessage = require('../models/ChatSSTMessage');

class WappyQueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  enqueue(userMessage) {
    this.queue.push(userMessage);
    const position = this.queue.length;

    // Notificar posición en cola al cliente si hay socket
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

      // Obtener API Key de Gemini
      const apiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('No se encontró clave API de Gemini configurada.');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: `Eres @wappy, el agente de Inteligencia Artificial experto en Seguridad y Salud en el Trabajo (SST), normatividad laboral colombiana e internacional (Decreto 1072 de 2015, Resolución 0312 de 2019, Guía GTC 45, etc.). Responde de forma clara, profesional, precisa y estructurada a las consultas de los usuarios. Sé cordial y enfócate siempre en la prevención de riesgos y el cumplimiento normativo.`,
      });

      const prompt = `Un usuario llamado ${currentMessage.senderName} te ha hecho la siguiente consulta en el Chat SST:\n\n"${currentMessage.content}"\n\nPor favor bríndale una respuesta experta, clara y práctica.`;

      const result = await model.generateContent(prompt);
      const botResponseText = result.response.text();

      // Guardar mensaje del bot en la base de datos
      const botMessage = await ChatSSTMessage.create({
        senderName: 'WAPPY SST',
        senderRole: 'bot',
        content: botResponseText,
        mentions: [`@${currentMessage.senderName}`],
        replyTo: currentMessage._id,
        status: 'completed',
      });

      // Emitir mensaje en tiempo real a la sala
      if (this.io) {
        this.io.emit('chat_sst_message', botMessage);
        this.io.emit('chat_sst_bot_status', { status: 'idle' });
      }
    } catch (error) {
      console.error('Error procesando consulta @wappy en cola:', error);
      const errorMessage = await ChatSSTMessage.create({
        senderName: 'WAPPY SST',
        senderRole: 'bot',
        content: `Lo siento @${currentMessage.senderName}, ocurrió un inconveniente al procesar tu solicitud. Por favor intenta de nuevo en unos momentos.`,
        replyTo: currentMessage._id,
        status: 'error',
      });
      if (this.io) {
        this.io.emit('chat_sst_message', errorMessage);
        this.io.emit('chat_sst_bot_status', { status: 'idle' });
      }
    } finally {
      this.queue.shift(); // Remover el procesado
      this.isProcessing = false;

      // Actualizar posiciones en cola para los restantes
      if (this.io && this.queue.length > 0) {
        this.queue.forEach((msg, idx) => {
          this.io.emit('chat_sst_queue_update', {
            messageId: msg._id,
            position: idx + 1,
            totalInQueue: this.queue.length,
          });
        });
      }

      // Continuar con la siguiente petición en la cola
      this.processQueue();
    }
  }

  getQueueLength() {
    return this.queue.length;
  }
}

const wappyQueueService = new WappyQueueService();
module.exports = wappyQueueService;
