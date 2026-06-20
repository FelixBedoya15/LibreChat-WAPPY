const { Client, LocalAuth } = require('whatsapp-web.js');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

class WhatsAppManager {
  constructor() {
    this.clients = new Map();
    this.qrCodes = new Map(); // userId => Base64 string
    this.statuses = new Map(); // userId => 'OFFLINE', 'STARTING', 'QR_READY', 'AUTHENTICATED'
    this.messageBuffer = new Map(); // userId => array of text parts
    this.bufferTimers = new Map(); // userId => NodeJS timeout
    this.processing = new Map(); // userId => boolean
    this.qrAttempts = new Map(); // userId => number of QR codes generated (to limit retries)
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
      // Buscar el Agente Recepcionista ("Profesional SST")
      const Agent = mongoose.models.Agent || mongoose.connection.collection('agents');
      const agent = await Agent.findOne({ name: /Profesional SST/i });
      if (!agent) {
        return "❌ No pude encontrar al 'Profesional SST' configurado en el sistema. Por favor, crea el agente Recepcionista con ese nombre exacto.";
      }

      // Payload idéntico al que envía LibreChat en el frontend
      const crypto = require('crypto');
      const hashObj = crypto.createHash('md5');
      hashObj.update(`whatsapp-${user._id}-${agent.id || agent._id}`);
      const hash = hashObj.digest('hex');
      // LibreChat requiere estricto formato UUID v4 para conversationId
      const convoId = `${hash.substring(0,8)}-${hash.substring(8,12)}-4${hash.substring(13,16)}-a${hash.substring(17,20)}-${hash.substring(20,32)}`;

      const payload = {
        conversationId: convoId,
        text,
        endpoint: 'agents',
        agent_id: agent.id || agent._id.toString(), // LibreChat expects the 'agent_...' format
      };

      console.log('[WhatsApp Manager] Payload enviado:', JSON.stringify(payload));

      // Usar http nativo de Node.js para garantizar streaming SSE sin buffering en localhost.
      // El fetch nativo de Node.js bufferiza el cuerpo internamente y no emite chunks en tiempo real.
      const http = require('http');
      const postData = JSON.stringify(payload);

      const responseText = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'localhost',
          port: 3080,
          path: '/api/agents/chat',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LibreChat-WAPPY-Bot/1.0',
            'Content-Length': Buffer.byteLength(postData),
          },
        };

        const req = http.request(options, (res) => {
          console.log('[WhatsApp Manager] HTTP Status:', res.statusCode, res.statusMessage);

          let accumulatedText = '';
          let finalText = '';

          res.setEncoding('utf8');

          res.on('data', (chunk) => {
            const lines = chunk.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              console.log('[WA SSE]', trimmed.substring(0, 250));
              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') continue;
                try {
                  const dataObj = JSON.parse(dataStr);

                  // Manejo de errores
                  if (dataObj.error === true && dataObj.text) {
                    finalText = dataObj.text;
                  } else if (dataObj.error && dataObj.message) {
                    finalText = `Error: ${dataObj.message}`;
                  } 
                  
                  // Formato de Eventos de Agentes (tipo OpenAI Assistants)
                  if (dataObj.event === 'on_message_delta' && dataObj.data?.delta?.content) {
                    for (const item of dataObj.data.delta.content) {
                      if (item.type === 'text' && item.text) {
                        accumulatedText += item.text;
                      }
                    }
                  } 
                  
                  // Formato Clásico LibreChat Final
                  if (dataObj.final === true) {
                    if (dataObj.text) {
                      finalText = dataObj.text;
                    } else if (dataObj.responseMessage?.text) {
                      finalText = dataObj.responseMessage.text;
                    }
                  }
                  
                  // Formato Clásico LibreChat (por si acaso para otros endpoints)
                  if (dataObj.text && !dataObj.final && !dataObj.event && !dataObj.conversationId) {
                     // Solo para endpoints clásicos (no agentes) para evitar duplicación
                     // accumulatedText += dataObj.text;
                  }
                } catch (e) {
                  // chunk intermedio no parseable — ignorar
                }
              }
            }
          });

          res.on('end', () => {
            console.log('[WA SSE] Stream terminado. final:', finalText.length, '| acumulado:', accumulatedText.length);
            resolve(finalText || accumulatedText || 'No pude generar una respuesta clara a partir de la API.');
          });

          res.on('error', (err) => {
            console.error('[WhatsApp Manager] Stream Error:', err);
            reject(err);
          });
        });

        req.on('error', (err) => {
          console.error('[WhatsApp Manager] Request Error:', err);
          reject(err);
        });

        req.write(postData);
        req.end();
      });

      return responseText;

    } catch (error) {
      console.error('[WhatsApp Manager] Error:', error);
      return 'Error de red intentando contactar a tu Asistente.';
    }
  }

  cleanSingletonLock(userId) {
    const sessionDir = path.join(this.sessionPath, `session-${userId}`);
    const pathsToClean = [
      path.join(sessionDir, 'SingletonLock'),
      path.join(sessionDir, 'Default', 'SingletonLock'),
      path.join(sessionDir, 'SingletonCookie'),
      path.join(sessionDir, 'Default', 'SingletonCookie'),
      path.join(sessionDir, 'SingletonSocket'),
      path.join(sessionDir, 'Default', 'SingletonSocket')
    ];

    for (const p of pathsToClean) {
      try {
        const stats = fs.lstatSync(p);
        if (stats) {
          fs.unlinkSync(p);
          console.log(`[WhatsApp Manager] Removed stale file/symlink: ${p}`);
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`[WhatsApp Manager] Error checking/removing lock file ${p}:`, err.message);
        }
      }
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

    // Clean stale lock files (SingletonLock symlinks)
    this.cleanSingletonLock(userId);

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

    // Alpine Linux instala el binario en estas rutas. 
    // Lo forzamos para evitar que intente usar el descargado nativamente.
    if (fs.existsSync('/usr/bin/chromium-browser')) {
      puppeteerOptions.executablePath = '/usr/bin/chromium-browser';
    } else if (fs.existsSync('/usr/bin/chromium')) {
      puppeteerOptions.executablePath = '/usr/bin/chromium';
    } else {
      console.warn('[WhatsApp Manager] ADVERTENCIA: No se encontró Chromium en las rutas de Alpine. Forzando a /usr/bin/chromium para depurar.');
      puppeteerOptions.executablePath = '/usr/bin/chromium'; // Fallback forzado
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
      const MAX_QR_ATTEMPTS = 5; // ~2.5 minutos antes de rendirse
      const attempts = (this.qrAttempts.get(userId) || 0) + 1;
      this.qrAttempts.set(userId, attempts);

      if (attempts > MAX_QR_ATTEMPTS) {
        console.warn(`[WhatsApp Manager] Usuario ${userId} superó ${MAX_QR_ATTEMPTS} intentos de QR sin escanear. Deteniendo cliente.`);
        this.statuses.set(userId, 'OFFLINE');
        this.qrCodes.delete(userId);
        client.destroy().catch(() => {});
        this.clients.delete(userId);
        this.qrAttempts.delete(userId);
        return;
      }

      console.log(`[WhatsApp Manager] QR Generado para el usuario: ${userId} (intento ${attempts}/${MAX_QR_ATTEMPTS})`);
      this.qrCodes.set(userId, qr);
      this.statuses.set(userId, 'QR_READY');
    });

    client.on('ready', () => {
      console.log(`[WhatsApp Manager] ✅ Cliente listo para usuario: ${userId}`);
      this.statuses.set(userId, 'READY');
    });

    client.on('authenticated', () => {
      console.log(`[WhatsApp Manager] Autenticado: ${userId}`);
      this.statuses.set(userId, 'AUTHENTICATED');
      this.qrAttempts.delete(userId); // Resetear contador al autenticarse exitosamente
    });

    client.on('auth_failure', (msg) => {
      console.error(`[WhatsApp Manager] Auth Failure para usuario ${userId}:`, msg);
      this.statuses.set(userId, 'OFFLINE');
      this.clients.delete(userId);
    });

    client.on('disconnected', (reason) => {
      console.log(`[WhatsApp Manager] Desconectado para usuario ${userId}:`, reason);
      this.statuses.set(userId, 'OFFLINE');
      this.clients.delete(userId);
    });

    // Usar message_create en lugar de message, ya que 'message' no dispara para msjs autoguiados.
    client.on('message_create', async (message) => {
      try {
        const myJID = client.info?.wid?._serialized;
        const msgBody = message.body?.trim();

        // Validación robusta para el modo OpenClaw (Message Yourself/Escríbete a ti mismo)
        // El mensaje debe ser enviado POR MI hacia MI MISMO
        const isSelfChat = message.fromMe && (
          message.to === message.from ||
          (myJID && (message.to === myJID || message.id?.remote === myJID))
        );

        if (!isSelfChat) {
          // Solo loguear si es un mensaje propio enviado a otro (útil para debug puntual)
          // Los mensajes de grupos y estados se ignoran silenciosamente
          return;
        }

        // Log de diagnóstico: solo para mensajes que sí procesaremos
        console.log(`[WhatsApp Manager] Auto-mensaje recibido:`, {
          fromMe: message.fromMe,
          from: message.from,
          to: message.to,
          remote: message.id?.remote,
          myJID: myJID,
          bodySnippet: msgBody ? msgBody.substring(0, 30) : ''
        });

        if (!msgBody) return;

        // Ignorar respuestas propias del bot para evitar loops infinitos
        if (msgBody.startsWith('🤖')) return;

        console.log(`[WhatsApp Manager] Comando interno recibido de sí mismo (${userId}): ${msgBody}`);

        // Buscar el usuario en la BD
        const User = mongoose.models.User || mongoose.connection.collection('users');
        const user = await User.findById(userId);
        if (!user) {
          console.error(`[WhatsApp Manager] Usuario ${userId} no encontrado en BD`);
          return;
        }

        const chat = await message.getChat();

        // Sistema de buffer de 7 segundos para acumular mensajes fragmentados
        if (this.bufferTimers.has(userId)) {
          clearTimeout(this.bufferTimers.get(userId));
        }
        const currentBuffer = this.messageBuffer.get(userId) || [];
        currentBuffer.push(msgBody);
        this.messageBuffer.set(userId, currentBuffer);

        const timer = setTimeout(async () => {
          const bufferedMessages = this.messageBuffer.get(userId) || [];
          this.messageBuffer.delete(userId);
          this.bufferTimers.delete(userId);
          const unifiedMessage = bufferedMessages.join('\n');
          await this.processUnifiedMessage(userId, user, chat, unifiedMessage);
        }, 7000);

        this.bufferTimers.set(userId, timer);

      } catch (err) {
        console.error(`[WhatsApp Manager] Error en handler de mensaje para ${userId}:`, err);
      }
    });


    client.initialize().catch((err) => {
      console.error(`[WhatsApp Manager] Fallo al iniciar puppeteer para usario ${userId}`, err);
      this.statuses.set(userId, 'OFFLINE');
      this.clients.delete(userId);
    });
  }

  stopClientForUser(userId) {
    const client = this.clients.get(userId);
    if (client) {
      client.destroy().catch(console.error);
      this.clients.delete(userId);
      this.statuses.set(userId, 'OFFLINE');
      this.qrCodes.delete(userId);
    }
  }

  async destroyClientForUser(userId) {
    const client = this.clients.get(userId);
    if (client) {
      try {
        await client.logout();
      } catch (err) {
        console.error(`[WhatsApp Manager] Error during client.logout() for ${userId}:`, err);
      }
      try {
        await client.destroy();
      } catch (err) {
        console.error(`[WhatsApp Manager] Error during client.destroy() for ${userId}:`, err);
      }
      this.clients.delete(userId);
      this.statuses.set(userId, 'OFFLINE');
      this.qrCodes.delete(userId);
    }

    // Also delete the session folder to fully reset the session
    const sessionDir = path.join(this.sessionPath, `session-${userId}`);
    try {
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log(`[WhatsApp Manager] Removed session directory for user: ${userId}`);
      }
    } catch (err) {
      console.error(`[WhatsApp Manager] Error removing session directory ${sessionDir}:`, err);
    }
  }

  getStatus(userId) {
    return {
      status: this.statuses.get(userId) || 'OFFLINE',
      qr: this.qrCodes.get(userId) || null
    };
  }

  async processUnifiedMessage(userId, user, chat, unifiedMessage) {
    if (this.processing.get(userId)) return; // Prevención extrema de concurrencia
    this.processing.set(userId, true);

    try {
      // Simulate typing indicator while LibreChat thinks
      await chat.sendStateTyping();

      // Pasar null como conversationId para que LibreChat lo trate como conversación nueva.
      // Esto es idéntico a lo que hace el chat web al abrir "+ Nuevo Chat".
      // El uuid real del servidor se creará automáticamente en la primera respuesta.
      const responseText = await this.getAgentResponse(user, unifiedMessage, null);
      
      // Firma del bot y envío
      const finalMessage = `🤖 ${responseText}`;
      await chat.sendMessage(finalMessage);
      
    } catch (err) {
      console.error(`[WhatsApp Manager] Error procesando mensaje unificado para ${userId}:`, err);
    } finally {
      this.processing.set(userId, false);
      chat.clearState();
    }
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
