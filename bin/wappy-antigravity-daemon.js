#!/usr/bin/env node
/**
 * WAPPY <-> Google Antigravity Real-Time Push Bridge Daemon
 * =========================================================
 * Reemplaza el antiguo sistema de sondeo por Cron (cada 2 min) por una conexión
 * persistente reactiva Server-Sent Events (SSE) de 0 ms de latencia y 0 consumo
 * de tokens en reposo, idéntica a la arquitectura de Antigravity Mobile.
 *
 * Cuando Tenshi (por voz o chat desde celular o escritorio) delega una orden:
 * 1. WAPPY emite instantáneamente el evento `nueva_orden` por el stream SSE.
 * 2. Este daemon reclama atómicamente la orden (`/antigravity/ordenes/:id/claim`).
 * 3. Invoca el binario nativo `~/.gemini/antigravity/bin/agentapi` con prioridad
 *    MESSAGE_PRIORITY_HIGH (Reactive Wakeup), despertando a Antigravity al instante.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const { spawn, execFileSync } = require('child_process');

const HOME_DIR = os.homedir();
const AGY_DIR = path.join(HOME_DIR, '.gemini', 'antigravity');
const CONFIG_DIR = path.join(HOME_DIR, '.gemini', 'config');
const DAEMON_SCRIPT_DEST = path.join(AGY_DIR, 'wappy-push-daemon.js');
const PID_FILE = path.join(AGY_DIR, 'wappy-push-daemon.pid');
const LOG_FILE = path.join(AGY_DIR, 'wappy-push-daemon.log');
const DISPATCHED_FILE = path.join(AGY_DIR, 'wappy-dispatched-orders.json');
const ACTIVE_CONVO_FILE = path.join(AGY_DIR, 'wappy-active-conversation.txt');

function ensureDirs() {
  try {
    fs.mkdirSync(AGY_DIR, { recursive: true });
  } catch (_) {}
}

function log(msg) {
  const line = `[${new Date().toISOString()}] [WAPPY Push Bridge] ${msg}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (_) {}
  if (!process.argv.includes('--silent')) {
    process.stdout.write(line);
  }
}

/**
 * Extrae argumentos CLI (--key=..., --url=..., --conversation=...)
 */
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        const k = arg.slice(2, eqIdx).trim();
        const v = arg.slice(eqIdx + 1).trim();
        args[k] = v;
      } else {
        args[arg.slice(2).trim()] = true;
      }
    }
  }
  return args;
}

/**
 * Descubre automáticamente la URL de WAPPY y la API Key desde argumentos CLI,
 * variables de entorno o el archivo mcp_config.json de Antigravity.
 */
function resolveCredentials(cliArgs = {}) {
  let wappyUrl = cliArgs.url || process.env.WAPPY_URL || '';
  let apiKey = cliArgs.key || cliArgs.apiKey || process.env.WAPPY_API_KEY || '';

  const configPaths = [
    path.join(CONFIG_DIR, 'mcp_config.json'),
    path.join(AGY_DIR, 'mcp_config.json'),
  ];

  for (const cfgPath of configPaths) {
    if (wappyUrl && apiKey && apiKey !== 'PEGA_TU_CLAVE_AQUI') break;
    try {
      if (!fs.existsSync(cfgPath)) continue;
      const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      const servers = raw?.mcpServers || {};
      const entry = servers.wappy || servers['wappy-cloud'] || Object.values(servers).find((s) => {
        const u = s?.serverUrl || s?.url || s?.env?.WAPPY_URL || '';
        return u.includes('wappy') || u.includes('mcp-bridge');
      });

      if (entry) {
        const remoteUrl = entry.serverUrl || entry.url || '';
        if (remoteUrl) {
          try {
            const parsed = new URL(remoteUrl);
            if (!wappyUrl) {
              wappyUrl = `${parsed.protocol}//${parsed.host}`;
            }
            const keyParam = parsed.searchParams.get('apiKey');
            if (!apiKey && keyParam && keyParam !== 'PEGA_TU_CLAVE_AQUI') {
              apiKey = keyParam;
            }
          } catch (_) {}
        }
        if (entry.env) {
          if (!wappyUrl && entry.env.WAPPY_URL) wappyUrl = entry.env.WAPPY_URL;
          if (!apiKey && entry.env.WAPPY_API_KEY) apiKey = entry.env.WAPPY_API_KEY;
        }
      }
    } catch (_) {}
  }

  if (!wappyUrl) {
    wappyUrl = 'https://wappy.club';
  }
  wappyUrl = wappyUrl.replace(/\/$/, '').replace(/\/api\/mcp-bridge.*$/, '');

  return { wappyUrl, apiKey };
}

/**
 * Localiza el binario nativo `agentapi` de Google Antigravity
 */
function resolveAgentApiBinary() {
  const candidates = [
    path.join(AGY_DIR, 'bin', 'agentapi'),
    '/Applications/Antigravity.app/Contents/Resources/bin/language_server',
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        return c;
      }
    } catch (_) {}
  }
  return 'agentapi';
}

/**
 * Obtiene el ID de la conversación más reciente / activa en Antigravity
 */
function findTargetConversationId(preferredId) {
  // 1. Si se pasó una conversación explícita o guardada recientemente (< 6 horas) y existe su archivo
  const checkCandidate = (id) => {
    if (!id || typeof id !== 'string') return null;
    const clean = id.trim();
    if (!/^[0-9a-fA-F-]{36}$/.test(clean)) return null;
    const dbPath = path.join(AGY_DIR, 'conversations', `${clean}.db`);
    if (fs.existsSync(dbPath)) return clean;
    return null;
  };

  if (preferredId) {
    const valid = checkCandidate(preferredId);
    if (valid) return valid;
  }

  try {
    if (fs.existsSync(ACTIVE_CONVO_FILE)) {
      const stat = fs.statSync(ACTIVE_CONVO_FILE);
      if (Date.now() - stat.mtimeMs < 6 * 3600 * 1000) {
        const saved = fs.readFileSync(ACTIVE_CONVO_FILE, 'utf8').trim();
        const valid = checkCandidate(saved);
        if (valid) return valid;
      }
    }
  } catch (_) {}

  // 2. Buscar la conversación activa más reciente en ~/.gemini/antigravity/conversations/
  try {
    const convDir = path.join(AGY_DIR, 'conversations');
    if (fs.existsSync(convDir)) {
      const entries = fs.readdirSync(convDir);
      let newestId = null;
      let newestMtime = 0;

      for (const name of entries) {
        const match = name.match(/^([0-9a-fA-F-]{36})\.db(?:-wal)?$/);
        if (!match) continue;
        const fullPath = path.join(convDir, name);
        try {
          const st = fs.statSync(fullPath);
          if (st.mtimeMs > newestMtime) {
            newestMtime = st.mtimeMs;
            newestId = match[1];
          }
        } catch (_) {}
      }

      if (newestId) {
        return newestId;
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Control de deduplicación local para garantizar que una orden jamás se dispare dos veces
 */
function loadDispatchedIds() {
  try {
    if (fs.existsSync(DISPATCHED_FILE)) {
      const arr = JSON.parse(fs.readFileSync(DISPATCHED_FILE, 'utf8'));
      if (Array.isArray(arr)) return new Set(arr.slice(-200));
    }
  } catch (_) {}
  return new Set();
}

function markOrderDispatched(ordenId, set) {
  set.add(String(ordenId));
  try {
    const arr = Array.from(set).slice(-200);
    fs.writeFileSync(DISPATCHED_FILE, JSON.stringify(arr, null, 2), 'utf8');
  } catch (_) {}
}

/**
 * Realiza una petición HTTP/HTTPS JSON ligera sin dependencias externas
 */
function jsonRequest(fullUrl, method, apiKey, bodyObj = null) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(fullUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      const payload = bodyObj ? JSON.stringify(bodyObj) : null;

      const req = client.request(
        parsed,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            Authorization: `Bearer ${apiKey}`,
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          },
          timeout: 10000,
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => {
            raw += chunk.toString();
          });
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(raw) });
            } catch (_) {
              resolve({ status: res.statusCode, data: null });
            }
          });
        }
      );

      req.on('error', () => resolve({ status: 0, data: null }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0, data: null });
      });

      if (payload) req.write(payload);
      req.end();
    } catch (_) {
      resolve({ status: 0, data: null });
    }
  });
}

/**
 * Despierta a Google Antigravity inmediatamente vía `agentapi` (Reactive Wakeup)
 */
async function dispatchOrderToAntigravity(orden, wappyUrl, apiKey, preferredConvoId, dispatchedSet) {
  const ordenId = String(orden?.id || orden?.ordenId || '').trim();
  if (!ordenId) return;

  if (dispatchedSet.has(ordenId)) {
    return;
  }

  // Reclamo atómico en el servidor para evitar ejecución duplicada si hay múltiples listeners
  const claimUrl = `${wappyUrl}/api/mcp-bridge/antigravity/ordenes/${encodeURIComponent(ordenId)}/claim`;
  const claimRes = await jsonRequest(claimUrl, 'POST', apiKey, { source: 'push_daemon' });
  if (claimRes.status === 200 && claimRes.data && claimRes.data.claimed === false) {
    markOrderDispatched(ordenId, dispatchedSet);
    log(`Orden ${ordenId} ya fue reclamada previamente (${claimRes.data.reason || 'skip'}).`);
    return;
  }

  markOrderDispatched(ordenId, dispatchedSet);

  const titulo = orden.titulo || orden.title || 'Orden Delegada por Tenshi';
  const instruccion = orden.instruccion || orden.descripcion || orden.description || '';
  const empresa = orden.empresa || 'Empresa Activa en WAPPY';
  const formato = orden.formatoEntregable || orden.formato || 'html';
  const recurso = orden.recursoObjetivo || 'Datos Empresariales WAPPY MCP';
  const archivos = Array.isArray(orden.archivos) && orden.archivos.length > 0
    ? `\nArchivos Adjuntos:\n${orden.archivos.map((f) => `- ${f}`).join('\n')}`
    : '';

  const prompt = [
    `⚡ [ORDEN EN TIEMPO REAL DE TENSHI — PUENTE REACTIVO PUSH WAPPY]`,
    `ID de Orden: ${ordenId}`,
    `Empresa: ${empresa}`,
    `Título: ${titulo}`,
    `Formato Entregable Solicitado: ${formato}`,
    `Recurso Objetivo: ${recurso}`,
    `Instrucción Detallada:`,
    instruccion,
    archivos,
    ``,
    `INSTRUCCIÓN DE EJECUCIÓN AUTÓNOMA INMEDIATA (SIN PREGUNTAR AL USUARIO):`,
    `1. Utiliza de inmediato tus herramientas MCP de 'wappy' (ej. wappy_resumen_general_360, matrices GTC-45/PESV, trabajadores, etc.) para obtener los datos reales de la empresa.`,
    `2. Elabora el entregable completo, riguroso y extenso en el formato solicitado (${formato}). Si es HTML o dashboard, genera un documento HTML5 completo (<!DOCTYPE html>) con diseño moderno Tailwind CSS, KPIs y gráficas interactivas.`,
    `3. Al finalizar, invoca OBLIGATORIAMENTE 'wappy_completar_orden_delegada_tenshi' enviando:`,
    `   - ordenId: "${ordenId}"`,
    `   - formato: "${formato}"`,
    `   - resultado: Resumen ejecutivo técnico de lo realizado`,
    `   - contenido: El código HTML5 completo o documento extenso desarrollado (mínimo 300 caracteres)`,
    `   para que se abra automáticamente en vivo en el Canvas de Tenshi.`,
  ]
    .filter(Boolean)
    .join('\n');

  const bin = resolveAgentApiBinary();
  const isLanguageServer = bin.endsWith('language_server');
  const baseArgs = isLanguageServer ? ['agentapi'] : [];
  const targetConvoId = findTargetConversationId(preferredConvoId);

  log(`Despachando orden "${titulo}" (ID: ${ordenId}) hacia Antigravity (Conversación destino: ${targetConvoId || 'NUEVA'})...`);

  let dispatchedOk = false;
  if (targetConvoId) {
    try {
      const sendArgs = [
        ...baseArgs,
        'send-message',
        `--title=⚡ Orden Tenshi: ${titulo.slice(0, 60)}`,
        targetConvoId,
        prompt,
      ];
      execFileSync(bin, sendArgs, { timeout: 15000, stdio: 'pipe' });
      dispatchedOk = true;
      log(`✅ Orden ${ordenId} inyectada instantáneamente en conversación ${targetConvoId} vía agentapi send-message.`);
    } catch (err) {
      log(`Aviso: send-message a ${targetConvoId} falló (${err.message}). Creando nueva conversación...`);
    }
  }

  if (!dispatchedOk) {
    try {
      const newArgs = [
        ...baseArgs,
        'new-conversation',
        `--title=⚡ Tenshi: ${titulo.slice(0, 60)}`,
        prompt,
      ];
      execFileSync(bin, newArgs, { timeout: 15000, stdio: 'pipe' });
      log(`✅ Orden ${ordenId} iniciada en nueva conversación autónoma vía agentapi new-conversation.`);
    } catch (err) {
      log(`❌ Error invocando agentapi para orden ${ordenId}: ${err.message}`);
    }
  }
}

/**
 * Instala el servicio persistente en segundo plano (Daemon + LaunchAgent en macOS)
 */
function installAndStartDaemon(cliArgs) {
  ensureDirs();

  if (cliArgs.conversation && /^[0-9a-fA-F-]{36}$/.test(String(cliArgs.conversation).trim())) {
    try {
      fs.writeFileSync(ACTIVE_CONVO_FILE, String(cliArgs.conversation).trim(), 'utf8');
    } catch (_) {}
  }

  // 1. Copiar este script a ~/.gemini/antigravity/wappy-push-daemon.js para que sea independiente del workspace
  try {
    const currentFile = path.resolve(__filename);
    if (currentFile !== path.resolve(DAEMON_SCRIPT_DEST)) {
      fs.copyFileSync(currentFile, DAEMON_SCRIPT_DEST);
      fs.chmodSync(DAEMON_SCRIPT_DEST, 0o755);
    }
  } catch (err) {
    log(`Aviso copiando script a ${DAEMON_SCRIPT_DEST}: ${err.message}`);
  }

  // 2. Terminar cualquier proceso anterior registrado en PID_FILE
  try {
    if (fs.existsSync(PID_FILE)) {
      const oldPid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
      if (oldPid && oldPid !== process.pid) {
        try {
          process.kill(oldPid, 'SIGTERM');
          log(`Proceso daemon anterior (PID ${oldPid}) detenido para actualización limpia.`);
        } catch (_) {}
      }
    }
  } catch (_) {}

  const { wappyUrl, apiKey } = resolveCredentials(cliArgs);
  const scriptToRun = fs.existsSync(DAEMON_SCRIPT_DEST) ? DAEMON_SCRIPT_DEST : __filename;

  // 3. En macOS, registrar LaunchAgent opcional para arranque automático al encender el Mac
  if (process.platform === 'darwin') {
    try {
      const launchAgentsDir = path.join(HOME_DIR, 'Library', 'LaunchAgents');
      fs.mkdirSync(launchAgentsDir, { recursive: true });
      const plistPath = path.join(launchAgentsDir, 'club.wappy.antigravity.bridge.plist');
      const nodeBin = process.execPath;
      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>club.wappy.antigravity.bridge</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodeBin}</string>
    <string>${scriptToRun}</string>
    <string>--worker</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_FILE}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_FILE}</string>
</dict>
</plist>`;
      fs.writeFileSync(plistPath, plistContent, 'utf8');
    } catch (_) {}
  }

  // 4. Lanzar worker desacoplado inmediatamente
  const workerArgs = [scriptToRun, '--worker', '--silent'];
  if (wappyUrl) workerArgs.push(`--url=${wappyUrl}`);
  if (apiKey) workerArgs.push(`--key=${apiKey}`);
  if (cliArgs.conversation) workerArgs.push(`--conversation=${cliArgs.conversation}`);

  const child = spawn(process.execPath, workerArgs, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  fs.writeFileSync(PID_FILE, String(child.pid), 'utf8');
  console.log(`✅ Puente Reactivo Push WAPPY <-> Antigravity activo en segundo plano (PID: ${child.pid}).`);
  console.log(`📡 Escuchando eventos en tiempo real desde: ${wappyUrl}/api/mcp-bridge/antigravity/stream`);
  console.log(`⚡ Latencia de despacho: 0 ms (vía agentapi Reactive Wakeup — Sin Cron).`);
  process.exit(0);
}

/**
 * Bucle principal de conexión SSE persistente (0% CPU y 0 tokens en reposo)
 */
function startSseWorker(cliArgs) {
  ensureDirs();
  fs.writeFileSync(PID_FILE, String(process.pid), 'utf8');

  if (cliArgs.conversation && /^[0-9a-fA-F-]{36}$/.test(String(cliArgs.conversation).trim())) {
    try {
      fs.writeFileSync(ACTIVE_CONVO_FILE, String(cliArgs.conversation).trim(), 'utf8');
    } catch (_) {}
  }

  const dispatchedSet = loadDispatchedIds();
  let reconnectDelay = 3000;
  let activeReq = null;

  const connect = () => {
    const { wappyUrl, apiKey } = resolveCredentials(cliArgs);
    if (!apiKey || apiKey === 'PEGA_TU_CLAVE_AQUI') {
      log('Esperando configuración de API Key válida en ~/.gemini/config/mcp_config.json...');
      setTimeout(connect, 10000);
      return;
    }

    const streamUrl = `${wappyUrl}/api/mcp-bridge/antigravity/stream?apiKey=${encodeURIComponent(apiKey)}`;
    log(`Conectando al stream Push SSE: ${wappyUrl}/api/mcp-bridge/antigravity/stream ...`);

    try {
      const parsed = new URL(streamUrl);
      const client = parsed.protocol === 'https:' ? https : http;

      activeReq = client.request(
        parsed,
        {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'x-api-key': apiKey,
            Authorization: `Bearer ${apiKey}`,
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            log(`Respuesta inesperada del stream SSE (HTTP ${res.statusCode}). Reintentando en ${reconnectDelay / 1000}s...`);
            res.resume();
            setTimeout(connect, reconnectDelay);
            reconnectDelay = Math.min(reconnectDelay * 1.5, 30000);
            return;
          }

          reconnectDelay = 3000;
          log('🟢 Conexión Push SSE establecida con éxito. Escuchando órdenes de Tenshi en tiempo real (0 ms)...');

          let buffer = '';
          let currentEvent = 'message';
          let currentDataLines = [];

          res.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
            let lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith(':')) {
                // Heartbeat comment
                continue;
              }
              if (line === '') {
                // Fin de bloque de evento SSE
                if (currentDataLines.length > 0) {
                  const rawData = currentDataLines.join('\n');
                  const evtName = currentEvent;
                  currentEvent = 'message';
                  currentDataLines = [];

                  try {
                    const parsedData = JSON.parse(rawData);
                    if (evtName === 'nueva_orden' && parsedData) {
                      dispatchOrderToAntigravity(
                        parsedData,
                        wappyUrl,
                        apiKey,
                        cliArgs.conversation,
                        dispatchedSet
                      ).catch((err) => log(`Error en dispatchOrder: ${err.message}`));
                    }
                  } catch (_) {}
                }
                continue;
              }
              if (line.startsWith('event:')) {
                currentEvent = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                currentDataLines.push(line.slice(5).trim());
              }
            }
          });

          res.on('end', () => {
            log('Stream SSE cerrado por el servidor. Reconectando en 3s...');
            setTimeout(connect, 3000);
          });

          res.on('error', (err) => {
            log(`Error en lectura de stream SSE (${err.message}). Reconectando...`);
            setTimeout(connect, reconnectDelay);
          });
        }
      );

      activeReq.on('error', (err) => {
        log(`Error de red conectando a SSE (${err.message}). Reintentando en ${reconnectDelay / 1000}s...`);
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 1.5, 30000);
      });

      activeReq.end();
    } catch (err) {
      log(`Excepción iniciando cliente SSE: ${err.message}`);
      setTimeout(connect, reconnectDelay);
    }
  };

  connect();
}

if (require.main === module) {
  const cliArgs = parseArgs();
  if (cliArgs.stop) {
    try {
      if (fs.existsSync(PID_FILE)) {
        const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
        if (pid) process.kill(pid, 'SIGTERM');
        fs.unlinkSync(PID_FILE);
      }
      console.log('🛑 Puente Reactivo Push WAPPY detenido.');
    } catch (_) {}
    process.exit(0);
  } else if (cliArgs.daemon || (!cliArgs.worker && !cliArgs.foreground)) {
    installAndStartDaemon(cliArgs);
  } else {
    startSseWorker(cliArgs);
  }
}

module.exports = {
  startSseWorker,
  installAndStartDaemon,
  resolveCredentials,
};
