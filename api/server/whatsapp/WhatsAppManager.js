const { Client, LocalAuth } = require('whatsapp-web.js');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

class WhatsAppManager {
  constructor() {
    this.clients = new Map();
    this.qrCodes = new Map(); // userId => Base64 string
    this.statuses = new Map(); // userId => 'OFFLINE', 'STARTING', 'QR_READY', 'AUTHENTICATED', 'READY'
    this.messageBuffer = new Map(); // userId => array of text parts
    this.bufferTimers = new Map(); // userId => NodeJS timeout
    this.processing = new Map(); // userId => boolean
    this.qrAttempts = new Map(); // userId => number of QR codes generated
    this.inactivityTimers = new Map(); // userId => NodeJS timeout (auto-hibernation)
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
      const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3080;

      const responseText = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'localhost',
          port: port,
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

  resetInactivityTimer(userId) {
    this.clearInactivityTimer(userId);
    // 40 minutos por defecto para liberar memoria de Chromium si nadie habla
    const timeoutMs = parseInt(process.env.WA_IDLE_TIMEOUT_MS || '2400000', 10);
    const timer = setTimeout(async () => {
      console.log(`[WhatsApp Manager] Hibernando sesión inactiva de usuario ${userId} (${timeoutMs / 60000} minutos sin uso). Memoria RAM liberada.`);
      await this.cleanupClient(userId, 'Hibernación por inactividad');
    }, timeoutMs);
    this.inactivityTimers.set(userId, timer);
  }

  clearInactivityTimer(userId) {
    if (this.inactivityTimers.has(userId)) {
      clearTimeout(this.inactivityTimers.get(userId));
      this.inactivityTimers.delete(userId);
    }
  }

  async cleanupClient(userId, reason = 'Limpieza normal') {
    console.log(`[WhatsApp Manager] Cerrando cliente para usuario ${userId}. Razón: ${reason}`);
    this.clearInactivityTimer(userId);
    if (this.bufferTimers.has(userId)) {
      clearTimeout(this.bufferTimers.get(userId));
      this.bufferTimers.delete(userId);
    }
    this.messageBuffer.delete(userId);
    this.processing.delete(userId);
    this.qrCodes.delete(userId);
    this.qrAttempts.delete(userId);

    const client = this.clients.get(userId);
    this.clients.delete(userId);
    this.statuses.set(userId, 'OFFLINE');

    if (client) {
      try {
        const browserProcess = client.pupBrowser?.process?.();
        const pid = browserProcess?.pid;

        // Intentar cierre normal con límite de 3 segundos
        await Promise.race([
          client.destroy().catch(() => {}),
          new Promise((r) => setTimeout(r, 3000)),
        ]);

        // Asegurar que el PID de Chromium no quede como proceso zombi en el VPS
        if (pid) {
          try {
            process.kill(pid, 'SIGKILL');
            console.log(`[WhatsApp Manager] Proceso Chromium PID ${pid} terminado de raíz para usuario ${userId}`);
          } catch (e) {
            // Ya finalizó correctamente
          }
        }
      } catch (err) {
        console.error(`[WhatsApp Manager] Error cerrando Chromium para usuario ${userId}:`, err.message);
      }
    }

    this.cleanSingletonLock(userId);
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
      if (currentStatus !== 'OFFLINE') return { success: true, status: currentStatus };
    }

    const MAX_ACTIVE_CLIENTS = parseInt(process.env.WA_MAX_CONCURRENT_SESSIONS || '25', 10);
    if (this.clients.size >= MAX_ACTIVE_CLIENTS) {
      console.warn(`[WhatsApp Manager] Límite de conexiones activas (${MAX_ACTIVE_CLIENTS}) alcanzado. Rechazando conexión para ${userId}.`);
      return {
        success: false,
        error: 'LIMIT_REACHED',
        message: `El servidor ha alcanzado el límite de ${MAX_ACTIVE_CLIENTS} sesiones activas simultáneas para proteger los recursos. Por favor intenta en unos minutos.`,
      };
    }

    console.log(`[WhatsApp Manager] Booting client for user: ${userId} (Activos: ${this.clients.size + 1}/${MAX_ACTIVE_CLIENTS})`);
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
        '--disable-gpu',
        '--disable-extensions',
        '--mute-audio',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--disk-cache-size=52428800', // 50MB disk cache
        '--media-cache-size=52428800',
        '--js-flags=--max-old-space-size=256', // 256MB V8 heap limit: soporte fluido para fotos/PDFs/audios sin fugas
      ]
    };

    // Rutas Alpine Linux
    if (fs.existsSync('/usr/bin/chromium-browser')) {
      puppeteerOptions.executablePath = '/usr/bin/chromium-browser';
    } else if (fs.existsSync('/usr/bin/chromium')) {
      puppeteerOptions.executablePath = '/usr/bin/chromium';
    } else {
      puppeteerOptions.executablePath = '/usr/bin/chromium';
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: userId,
        dataPath: this.sessionPath
      }),
      puppeteer: puppeteerOptions,
      qrMaxRetries: 5,
    });

    this.clients.set(userId, client);

    client.on('qr', (qr) => {
      const MAX_QR_ATTEMPTS = 5; // ~2.5 minutos antes de rendirse
      const attempts = (this.qrAttempts.get(userId) || 0) + 1;
      this.qrAttempts.set(userId, attempts);

      if (attempts > MAX_QR_ATTEMPTS) {
        console.warn(`[WhatsApp Manager] Usuario ${userId} superó ${MAX_QR_ATTEMPTS} intentos de QR sin escanear. Deteniendo cliente.`);
        this.cleanupClient(userId, 'Máximo de intentos QR superado');
        return;
      }

      console.log(`[WhatsApp Manager] QR Generado para el usuario: ${userId} (intento ${attempts}/${MAX_QR_ATTEMPTS})`);
      this.qrCodes.set(userId, qr);
      this.statuses.set(userId, 'QR_READY');
    });

    client.on('ready', () => {
      console.log(`[WhatsApp Manager] ✅ Cliente listo para usuario: ${userId}`);
      this.statuses.set(userId, 'READY');
      this.resetInactivityTimer(userId);
    });

    client.on('authenticated', () => {
      console.log(`[WhatsApp Manager] Autenticado: ${userId}`);
      this.statuses.set(userId, 'AUTHENTICATED');
      this.qrAttempts.delete(userId);
      this.resetInactivityTimer(userId);
    });

    client.on('auth_failure', async (msg) => {
      console.error(`[WhatsApp Manager] Auth Failure para usuario ${userId}:`, msg);
      await this.cleanupClient(userId, `Fallo de autenticación: ${msg}`);
    });

    client.on('disconnected', async (reason) => {
      console.log(`[WhatsApp Manager] Desconectado para usuario ${userId}:`, reason);
      await this.cleanupClient(userId, `Desconexión: ${reason}`);
    });

    // Usar message_create para capturar mensajes propios en modo OpenClaw
    client.on('message_create', async (message) => {
      try {
        const myJID = client.info?.wid?._serialized;
        let msgBody = message.body?.trim() || '';

        // Validación para el modo OpenClaw (Message Yourself/Escríbete a ti mismo)
        const isSelfChat = message.fromMe && (
          message.to === message.from ||
          (myJID && (message.to === myJID || message.id?.remote === myJID))
        );

        if (!isSelfChat) {
          return;
        }

        // Renovar temporizador de inactividad con cada mensaje recibido
        this.resetInactivityTimer(userId);

        // Soporte de archivos multimedia (Imágenes, Audios, PDFs, Excel, Videos)
        let mediaNotice = '';
        if (message.hasMedia) {
          try {
            const downloadedMedia = await message.downloadMedia();
            if (downloadedMedia) {
              const mime = downloadedMedia.mimetype || 'desconocido';
              const filename = downloadedMedia.filename || 'archivo_adjunto';
              console.log(`[WhatsApp Manager] Archivo multimedia recibido (${mime}, ${filename}) de usuario: ${userId}`);
              
              if (mime.startsWith('image/')) {
                mediaNotice = `[Imagen adjunta: ${filename}]`;
              } else if (mime.startsWith('audio/') || mime.includes('ogg')) {
                mediaNotice = `[Nota de voz / Audio adjunto: ${filename}]`;
              } else if (mime.includes('pdf')) {
                mediaNotice = `[Documento PDF adjunto: ${filename}]`;
              } else if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) {
                mediaNotice = `[Planilla Excel / Matriz adjunta: ${filename}]`;
              } else {
                mediaNotice = `[Archivo adjunto (${mime}): ${filename}]`;
              }
            }
          } catch (mErr) {
            console.error('[WhatsApp Manager] Error descargando multimedia de WhatsApp:', mErr.message);
          }
        }

        const effectiveText = [mediaNotice, msgBody].filter(Boolean).join('\n').trim();

        if (!effectiveText) return;

        // Ignorar respuestas propias del bot para evitar loops infinitos
        if (effectiveText.startsWith('🤖')) return;

        console.log(`[WhatsApp Manager] Auto-mensaje de ${userId}: ${effectiveText.substring(0, 80)}`);

        // Buscar el usuario en la BD
        const User = mongoose.models.User || mongoose.connection.collection('users');
        const user = await User.findById(userId);
        if (!user) {
          console.error(`[WhatsApp Manager] Usuario ${userId} no encontrado en BD`);
          return;
        }

        const chat = await message.getChat();

        // Sistema de buffer de 6 segundos para acumular mensajes fragmentados
        if (this.bufferTimers.has(userId)) {
          clearTimeout(this.bufferTimers.get(userId));
        }
        const currentBuffer = this.messageBuffer.get(userId) || [];
        currentBuffer.push(effectiveText);
        this.messageBuffer.set(userId, currentBuffer);

        const timer = setTimeout(async () => {
          const bufferedMessages = this.messageBuffer.get(userId) || [];
          this.messageBuffer.delete(userId);
          this.bufferTimers.delete(userId);
          const unifiedMessage = bufferedMessages.join('\n');
          await this.processUnifiedMessage(userId, user, chat, unifiedMessage);
        }, 6000);

        this.bufferTimers.set(userId, timer);

      } catch (err) {
        console.error(`[WhatsApp Manager] Error en handler de mensaje para ${userId}:`, err);
      }
    });

    client.initialize().catch(async (err) => {
      console.error(`[WhatsApp Manager] Fallo al iniciar puppeteer para usuario ${userId}:`, err.message);
      await this.cleanupClient(userId, 'Fallo de inicialización de Puppeteer');
    });

    return { success: true, status: 'STARTING' };
  }

  async stopClientForUser(userId) {
    await this.cleanupClient(userId, 'Detenido por usuario');
  }

  async destroyClientForUser(userId) {
    const client = this.clients.get(userId);
    if (client) {
      try {
        await client.logout();
      } catch (err) {
        console.error(`[WhatsApp Manager] Error en client.logout() para ${userId}:`, err.message);
      }
    }
    await this.cleanupClient(userId, 'Cierre de sesión definitivo');

    // Eliminar carpeta de sesión en disco
    const sessionDir = path.join(this.sessionPath, `session-${userId}`);
    try {
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log(`[WhatsApp Manager] Directorio de sesión eliminado para usuario: ${userId}`);
      }
    } catch (err) {
      console.error(`[WhatsApp Manager] Error eliminando directorio de sesión ${sessionDir}:`, err.message);
    }
  }

  getStatus(userId) {
    return {
      status: this.statuses.get(userId) || 'OFFLINE',
      qr: this.qrCodes.get(userId) || null
    };
  }

  async processUnifiedMessage(userId, user, chat, unifiedMessage) {
    if (this.processing.get(userId)) return;
    this.processing.set(userId, true);

    try {
      await chat.sendStateTyping();
      const responseText = await this.getAgentResponse(user, unifiedMessage, null);
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
    
    const MAX_ACTIVE_CLIENTS = parseInt(process.env.WA_MAX_CONCURRENT_SESSIONS || '25', 10);
    const folders = fs.readdirSync(this.sessionPath);
    let count = 0;
    for (const folder of folders) {
      if (folder.startsWith('session-')) {
        if (count >= MAX_ACTIVE_CLIENTS) {
          console.log(`[WhatsApp Manager] Límite de arranque de sesiones alcanzado (${MAX_ACTIVE_CLIENTS}). Las restantes se activarán bajo demanda.`);
          break;
        }
        const userId = folder.replace('session-', '');
        await this.startClientForUser(userId);
        count++;
      }
    }
  }
}

const manager = new WhatsAppManager();
module.exports = manager;
