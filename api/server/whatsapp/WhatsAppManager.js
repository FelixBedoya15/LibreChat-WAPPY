const { Client, LocalAuth } = require('whatsapp-web.js');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class WhatsAppManager {
  constructor() {
    this.clients = new Map();
    this.qrCodes = new Map(); // userId => Base64 string
    this.statuses = new Map(); // userId => 'OFFLINE', 'STARTING', 'QR_READY', 'AUTHENTICATED'
    this.ensureSessionDir();
  }

  ensureSessionDir() {
    const sessionPath = path.join(__dirname, '..', '..', '..', '.wappy_whatsapp_sessions');
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }
    this.sessionPath = sessionPath;
  }

  async getAgentResponse(user, text, conversationId) {
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: '10m',
    });

    try {
      // Find the specific Agent ("Médico Laboral")
      const Agent = mongoose.models.Agent || mongoose.connection.collection('agents');
      const agent = await Agent.findOne({ name: /Médico Laboral/i });
      if (!agent) {
        return "❌ No pude encontrar al 'Médico Laboral' configurado en el sistema.";
      }

      const payload = {
        convoId: conversationId || 'new',
        text,
        endpointOption: {
          endpoint: 'agents',
          agent_id: agent._id ? agent._id.toString() : agent.id,
        },
        ephemeralAgent: {
          tools: ['somos_sst'],
        }
      };

      const response = await fetch('http://localhost:3080/api/agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('[WhatsApp Manager] HTTP Error:', response.status);
        return "Error interno intentando comunicar con LibreChat.";
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let finalResponseText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (let line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;
            try {
              const dataObj = JSON.parse(dataStr);
              if (dataObj.final && dataObj.responseMessage?.text) {
                 finalResponseText = dataObj.responseMessage.text;
              } else if (!finalResponseText && dataObj.text) {
                 finalResponseText = dataObj.text;
              }
            } catch (e) {
              // ignore middle parsing errors
            }
          }
        }
      }

      return finalResponseText || "No pude generar una respuesta clara.";
    } catch (error) {
      console.error('[WhatsApp Manager] Fetch Error:', error);
      return "Error de red intentando contactar a tu Asistente.";
    }
  }

  async startClientForUser(userId) {
    if (this.clients.has(userId)) {
      const currentStatus = this.statuses.get(userId);
      if (currentStatus !== 'OFFLINE') return; // already starting or running
    }

    console.log(`[WhatsApp Manager] Booting client for user: ${userId}`);
    this.statuses.set(userId, 'STARTING');
    this.qrCodes.delete(userId);

    const puppeteerOptions = {
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    };

    // Si existe el binario de Chromium de Alpine/Linux (ej: en el contenedor Docker) lo forzamos.
    // Esto evita el clásico error ENOENT de Puppeteer en Alpine Linux.
    if (fs.existsSync('/usr/bin/chromium-browser')) {
      puppeteerOptions.executablePath = '/usr/bin/chromium-browser';
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: userId,
        dataPath: this.sessionPath
      }),
      puppeteer: puppeteerOptions
    });

    this.clients.set(userId, client);

    client.on('qr', (qr) => {
      // whatsapp-web.js generates QR string, wait for library to convert it visually?
      // No, we use a basic base64 conversion trick or pass raw string if we use react-qrcode
      // Actually `qr` is a raw string, we will return this raw string and let Frontend 'qrcode.react' handle it.
      console.log(`[WhatsApp Manager] QR Generado para el usuario: ${userId}`);
      this.qrCodes.set(userId, qr);
      this.statuses.set(userId, 'QR_READY');
    });

    client.on('ready', () => {
      console.log(`[WhatsApp Manager] ✅ Cliente listo para usuario: ${userId}`);
      this.statuses.set(userId, 'AUTHENTICATED');
      this.qrCodes.delete(userId);
    });

    client.on('authenticated', () => {
      console.log(`[WhatsApp Manager] Autenticado: ${userId}`);
      this.statuses.set(userId, 'AUTHENTICATED');
      this.qrCodes.delete(userId);
    });

    client.on('auth_failure', () => {
      console.error(`[WhatsApp Manager] Error de autenticación: ${userId}`);
      this.statuses.set(userId, 'OFFLINE');
      this.qrCodes.delete(userId);
      this.destroyClientForUser(userId);
    });

    client.on('disconnected', (reason) => {
      console.log(`[WhatsApp Manager] Cliente desconectado (${userId}): ${reason}`);
      this.statuses.set(userId, 'OFFLINE');
      this.qrCodes.delete(userId);
      this.destroyClientForUser(userId);
    });

    // OPENCLAW "MESSAGE YOURSELF" LOGIC
    // Using `message_create` allows intercepting messages sent *by* the user (fromMe)
    client.on('message_create', async (msg) => {
      // Si el mensaje es enviado por MI a MI mismo (Message Yourself)
      if (msg.fromMe && msg.to === msg.from) {
        
        // Evitar procesar mensajes que acabamos de enviar nosotros (el Agent)
        const isBotResponse = msg.body.includes('⚕️') || msg.body.includes('Trabajadores') || msg.body.includes('**');
        // Hacemos una verificación rústica por ahora. Ideal: la IA puede firmar los mensajes.
        // What OpenClaw does is prepend an emoji or signature, e.g. "🤖"
        if (msg.body.startsWith('🤖')) return;
        
        console.log(`[WhatsApp Manager] Comando interno recibido de sí mismo (${userId}): ${msg.body}`);
        
        // Find user model
        const User = mongoose.models.User || mongoose.connection.collection('users');
        const user = await User.findOne({ _id: new mongoose.Types.ObjectId(userId) }) || await User.findOne({ _id: userId });
        
        if (!user) return;

        // Simulate typing indicator
        const chat = await msg.getChat();
        chat.sendStateTyping();

        // Conversation ID binding for memory
        const hash = crypto.createHash('sha256');
        hash.update(`whatsapp-self-${userId}`);
        const conversationId = hash.digest('hex').substring(0, 24);

        const responseText = await this.getAgentResponse(user, msg.body, conversationId);
        
        // Firma del bot para no auto-leerse
        const finalMessage = `🤖 ${responseText}`;
        await chat.sendMessage(finalMessage);
      }
    });

    try {
      await client.initialize();
    } catch (e) {
      console.error(`[WhatsApp Manager] Fallo al iniciar puppeteer para usario ${userId}`, e);
      this.statuses.set(userId, 'OFFLINE');
      this.clients.delete(userId);
    }
  }

  async destroyClientForUser(userId) {
    if (this.clients.has(userId)) {
      const client = this.clients.get(userId);
      console.log(`[WhatsApp Manager] Destruyendo sesión de WhatsApp para: ${userId}`);
      try {
        await client.logout();
      } catch (e) {
        // usually failing if already offline
        try { await client.destroy(); } catch (err) {}
      }
      this.clients.delete(userId);
      this.statuses.set(userId, 'OFFLINE');
      this.qrCodes.delete(userId);
    }
  }

  getStatus(userId) {
    return {
      status: this.statuses.get(userId) || 'OFFLINE',
      qr: this.qrCodes.get(userId) || null
    };
  }

  async bootSavedSessions() {
    console.log('[WhatsApp Manager] Buscando sesiones guardadas...');
    if (!fs.existsSync(this.sessionPath)) return;
    
    const folders = fs.readdirSync(this.sessionPath);
    for (const folder of folders) {
      if (folder.startsWith('session-')) {
        const userId = folder.replace('session-', '');
        this.startClientForUser(userId);
      }
    }
  }
}

const manager = new WhatsAppManager();
module.exports = manager;
