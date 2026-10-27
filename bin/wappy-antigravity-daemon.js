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
 * Obtiene el ID de conversación destino ÚNICAMENTE si fue forzado explícitamente (--conversation=<uuid>).
 * Por defecto devuelve `null` para que cada consulta de Tenshi abra SIEMPRE un chat nuevo (`new-conversation`).
 */
function findTargetConversationId(preferredId) {
  if (!preferredId || typeof preferredId !== 'string') {
    return null;
  }
  const clean = preferredId.trim();
  if (!/^[0-9a-fA-F-]{36}$/.test(clean)) {
    return null;
  }
  const dbPath = path.join(AGY_DIR, 'conversations', `${clean}.db`);
  if (fs.existsSync(dbPath)) {
    return clean;
  }
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
          timeout: 45000,
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
 * Resuelve el directorio de trabajo (workspace) para `agentapi new-conversation`:
 * 1. Primero consulta la conversación más reciente en `~/.gemini/antigravity/conversations/` vía
 *    `agentapi get-conversation-metadata` para detectar el proyecto exacto que el usuario tiene abierto actualmente en pantalla.
 * 2. Si no hay conversación activa con workspace, busca en `~/.gemini/config/projects/*.json`.
 * 3. Si el usuario NO tiene proyectos configurados en Antigravity, usa `os.homedir()` (~), lo que asigna automáticamente
 *    la conversación al contenedor global nativo "Outside of Project" (`outside-of-project.json`) con acceso total al MCP global de WAPPY.
 */
function resolveWorkspaceDirectory() {
  if (process.env.WAPPY_PROJECT_DIR && fs.existsSync(process.env.WAPPY_PROJECT_DIR)) {
    return process.env.WAPPY_PROJECT_DIR;
  }

  // 1. Detectar el proyecto actualmente abierto en Antigravity a partir de la conversación activa más reciente
  try {
    const convDir = path.join(AGY_DIR, 'conversations');
    if (fs.existsSync(convDir)) {
      const entries = fs.readdirSync(convDir);
      const candidates = [];
      const seenIds = new Set();

      for (const name of entries) {
        const match = name.match(/^([0-9a-fA-F-]{36})\.db(?:-wal)?$/);
        if (!match) continue;
        const id = match[1];
        const fullPath = path.join(convDir, name);
        try {
          const st = fs.statSync(fullPath);
          candidates.push({ id, mtimeMs: st.mtimeMs });
        } catch (_) {}
      }

      candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
      const bin = resolveAgentApiBinary();
      const isLanguageServer = bin.endsWith('language_server');
      const baseArgs = isLanguageServer ? ['agentapi'] : [];

      for (const item of candidates) {
        if (seenIds.has(item.id)) continue;
        seenIds.add(item.id);
        if (seenIds.size > 5) break;
        try {
          const out = execFileSync(bin, [...baseArgs, 'get-conversation-metadata', item.id], {
            timeout: 3000,
            stdio: 'pipe',
            encoding: 'utf8',
          });
          const parsed = JSON.parse(out);
          const uris = parsed?.response?.conversationMetadata?.metadata?.workspaceUris || [];
          for (const uri of uris) {
            if (typeof uri === 'string' && uri.startsWith('file://')) {
              const folderPath = decodeURIComponent(uri.replace(/^file:\/\//, ''));
              if (fs.existsSync(folderPath)) {
                return folderPath;
              }
            }
          }
        } catch (_) {}
      }
    }
  } catch (_) {}

  // 2. Respaldo: proyecto más reciente en ~/.gemini/config/projects/*.json
  try {
    const projectsDir = path.join(os.homedir(), '.gemini', 'config', 'projects');
    if (fs.existsSync(projectsDir)) {
      const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith('.json') && f !== 'outside-of-project.json');
      let bestFolder = null;
      let bestMtime = 0;

      for (const file of files) {
        const fullPath = path.join(projectsDir, file);
        try {
          const st = fs.statSync(fullPath);
          const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          const resources = raw?.projectResources?.resources || [];
          for (const r of resources) {
            const uri = r?.gitFolder?.folderUri || r?.folder?.folderUri || r?.folderUri || '';
            if (uri.startsWith('file://')) {
              const folderPath = decodeURIComponent(uri.replace(/^file:\/\//, ''));
              if (fs.existsSync(folderPath) && st.mtimeMs >= bestMtime) {
                bestMtime = st.mtimeMs;
                bestFolder = folderPath;
              }
            }
          }
        } catch (_) {}
      }

      if (bestFolder) {
        return bestFolder;
      }
    }
  } catch (_) {}

  return os.homedir();
}

/**
 * Despierta a Google Antigravity inmediatamente vía `agentapi` (Reactive Wakeup)
 * Abriendo siempre una NUEVA conversación limpia para cada consulta de Tenshi (salvo que se fuerce --conversation explícito).
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

  const titulo = orden.titulo || orden.title || 'Consulta Delegada por Tenshi';
  const instruccion = orden.instruccion || orden.descripcion || orden.description || '';
  const empresa = orden.empresa || 'Empresa Activa en WAPPY';
  const rawFormato = String(orden.formatoEntregable || orden.formato || 'respuesta').toLowerCase().trim();
  const recurso = orden.recursoObjetivo || 'Datos Empresariales WAPPY MCP';
  const archivos = Array.isArray(orden.archivos) && orden.archivos.length > 0
    ? `\nArchivos Adjuntos:\n${orden.archivos.map((f) => `- ${f}`).join('\n')}`
    : '';

  const isOriginalFileCopy =
    rawFormato === 'copia_archivo' ||
    rawFormato === 'archivo_original' ||
    rawFormato === 'copia';

  const isQuestionOnly =
    !isOriginalFileCopy &&
    (rawFormato === 'respuesta' ||
      rawFormato === 'consulta' ||
      rawFormato === 'texto' ||
      rawFormato === 'chat');

  const isHtmlApp =
    !isOriginalFileCopy &&
    (rawFormato === 'html' ||
      rawFormato === 'dashboard' ||
      rawFormato === 'aplicativo');

  let executionInstructions = [];
  if (isOriginalFileCopy) {
    executionInstructions = [
      `INSTRUCCIÓN DE ENVÍO DE COPIA BINARIA EXACTA DE ARCHIVO ORIGINAL DEL PC (PROHIBIDO CREAR O INVENTAR UN ARCHIVO NUEVO):`,
      `1. El usuario solicitó recibir una COPIA ORIGINAL INTACTA de un archivo existente en su PC/computador (ej. en ~/Downloads, ~/Documents, ~/Desktop o en su proyecto).`,
      `2. Localiza la ruta absoluta exacta del archivo solicitado en el disco del usuario. NO crees ni redactes un archivo nuevo; debes enviar la copia binaria del archivo original.`,
      `3. Una vez localizado el archivo original en el PC, ejecuta inmediatamente en terminal (run_command):`,
      `   node "${DAEMON_SCRIPT_DEST}" --send-file="<RUTA_ABSOLUTA_DEL_ARCHIVO>" --orden-id="${ordenId}" --resumen="Aquí tienes la copia original del archivo solicitado desde tu PC."`,
      `   (Esto enviará los bytes exactos del archivo original al chat de Tenshi para descarga directa sin modificarlo).`,
    ];
  } else if (isQuestionOnly) {
    executionInstructions = [
      `INSTRUCCIÓN DE RESPUESTA DIRECTA (MODO CONSULTA / PREGUNTA — PROHIBIDO GENERAR DOCUMENTO O ARCHIVO):`,
      `1. El usuario únicamente realizó una PREGUNTA o CONSULTA sencilla desde Tenshi (NO solicitó crear ningún documento, informe ni archivo en Canvas).`,
      `2. Si la pregunta requiere datos de la empresa "${empresa}", consúltalos con tus herramientas MCP de 'wappy'. Si es una pregunta conceptual o normativa de SG-SST, respóndela de inmediato con precisión técnica.`,
      `3. Invoca OBLIGATORIAMENTE 'wappy_completar_orden_delegada_tenshi' enviando:`,
      `   - ordenId: "${ordenId}"`,
      `   - formato: "respuesta"`,
      `   - resultado: Tu respuesta en texto plano, clara, directa y bien explicada para el usuario (sin crear archivos ni documentos de ningún tipo).`,
    ];
  } else if (isHtmlApp) {
    executionInstructions = [
      `INSTRUCCIÓN DE EJECUCIÓN AUTÓNOMA (MODO APLICATIVO / DASHBOARD HTML EN CANVAS):`,
      `1. Utiliza tus herramientas MCP de 'wappy' (ej. wappy_resumen_general_360, matrices GTC-45/PESV, trabajadores, etc.) para obtener los datos reales de "${empresa}".`,
      `2. Desarrolla un aplicativo interactivo HTML5 completo (<!DOCTYPE html>) con diseño moderno Tailwind CSS, KPIs y gráficas interactivas.`,
      `3. Al finalizar, invoca OBLIGATORIAMENTE 'wappy_completar_orden_delegada_tenshi' enviando:`,
      `   - ordenId: "${ordenId}"`,
      `   - formato: "html"`,
      `   - resultado: Resumen ejecutivo breve de lo desarrollado`,
      `   - contenido: El código HTML5 completo (<!DOCTYPE html>...)`,
    ];
  } else {
    executionInstructions = [
      `INSTRUCCIÓN DE EJECUCIÓN AUTÓNOMA (MODO EDITOR DE DOCUMENTOS OFICIAL DE WAPPY — LIVEEDITOR / CANVAS):`,
      `1. Utiliza tus herramientas MCP de 'wappy' (ej. wappy_resumen_general_360, matrices GTC-45/PESV, trabajadores, diagnóstico 0312, etc.) para obtener los datos reales de "${empresa}".`,
      `2. Redacta el cuerpo del documento técnico en formato Markdown estructurado (con encabezados ## y ###, negritas, listas y tablas técnicas Markdown | Columna | Columna |) fundamentado en la normatividad colombiana vigente (Decreto 1072 de 2015, Resolución 0312 de 2019).`,
      `3. IMPORTANTE PARA EL EDITOR DE DOCUMENTOS DE WAPPY: NO envuelvas el documento en <!DOCTYPE html> ni <html> (el servidor de WAPPY inyecta automáticamente el cabezote corporativo oficial "INFORMACIÓN RESUMIDA DE LA ENTIDAD" con los datos de la empresa y el bloque interactivo de firmas digitales para el Editor de Documentos LiveEditor de WAPPY).`,
      `4. Al finalizar, invoca OBLIGATORIAMENTE 'wappy_completar_orden_delegada_tenshi' enviando:`,
      `   - ordenId: "${ordenId}"`,
      `   - formato: "documento"`,
      `   - resultado: Resumen ejecutivo técnico breve de lo redactado`,
      `   - contenido: El cuerpo completo del documento en Markdown estructurado con sus tablas técnicas (mínimo 300 caracteres)`,
    ];
  }

  const prompt = [
    `⚡ [ORDEN EN TIEMPO REAL DE TENSHI — PUENTE REACTIVO PUSH WAPPY]`,
    `ID de Orden: ${ordenId}`,
    `Empresa: ${empresa}`,
    `Título: ${titulo}`,
    `Tipo de Solicitud: ${
      isOriginalFileCopy
        ? 'copia_archivo (Enviar Copia Exacta de Archivo Original del PC)'
        : isQuestionOnly
        ? 'respuesta (Pregunta / Consulta Directa en Texto Plano — Cero Archivos)'
        : isHtmlApp
        ? 'html (Aplicativo Interactivo)'
        : 'documento (Editor de Documentos Oficial de WAPPY)'
    }`,
    `Recurso Objetivo: ${recurso}`,
    `Instrucción del Usuario:`,
    instruccion,
    archivos,
    ``,
    ...executionInstructions,
  ]
    .filter(Boolean)
    .join('\n');

  const bin = resolveAgentApiBinary();
  const isLanguageServer = bin.endsWith('language_server');
  const baseArgs = isLanguageServer ? ['agentapi'] : [];
  const workspaceCwd = resolveWorkspaceDirectory();

  // Inyectar la consulta en el chat activo abierto en Antigravity (para que el usuario la vea inmediatamente en su ventana)
  // y si no hay ningún chat activo abierto, crear automáticamente una nueva conversación en el workspace resuelto.
  const targetConvoId = findTargetConversationId(preferredConvoId);

  log(
    `Despachando orden "${titulo}" (ID: ${ordenId}, Tipo: ${rawFormato}) hacia Antigravity (Destino: ${
      targetConvoId ? `Chat activo ${targetConvoId}` : `NUEVO CHAT en workspace ${workspaceCwd}`
    })...`
  );

  let dispatchedOk = false;
  if (targetConvoId) {
    try {
      const sendArgs = [
        ...baseArgs,
        'send-message',
        `--title=⚡ Tenshi: ${titulo.slice(0, 60)}`,
        targetConvoId,
        prompt,
      ];
      execFileSync(bin, sendArgs, { timeout: 15000, stdio: 'pipe', cwd: workspaceCwd });
      dispatchedOk = true;
      log(`✅ Orden ${ordenId} inyectada en tiempo real en el chat activo ${targetConvoId}.`);
    } catch (err) {
      log(`Aviso: send-message a ${targetConvoId} falló (${err.message}). Abriendo nueva conversación...`);
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
      execFileSync(bin, newArgs, { timeout: 15000, stdio: 'pipe', cwd: workspaceCwd });
      log(`✅ Orden ${ordenId} iniciada en NUEVA conversación autónoma de Antigravity (workspace: ${workspaceCwd}).`);
    } catch (err) {
      log(`❌ Error invocando agentapi new-conversation para orden ${ordenId}: ${err.message}`);
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
  } else {
    try {
      if (fs.existsSync(ACTIVE_CONVO_FILE)) fs.unlinkSync(ACTIVE_CONVO_FILE);
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

  // 2. Terminar cualquier proceso anterior (tanto en PID_FILE como LaunchAgent o workers huérfanos)
  try {
    if (process.platform === 'darwin') {
      const plistPath = path.join(HOME_DIR, 'Library', 'LaunchAgents', 'club.wappy.antigravity.bridge.plist');
      if (fs.existsSync(plistPath)) {
        try {
          execFileSync('launchctl', ['unload', plistPath], { stdio: 'ignore' });
        } catch (_) {}
      }
    }
    if (fs.existsSync(PID_FILE)) {
      const oldPid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
      if (oldPid && oldPid !== process.pid) {
        try {
          process.kill(oldPid, 'SIGTERM');
          log(`Proceso daemon anterior (PID ${oldPid}) detenido para actualización limpia.`);
        } catch (_) {}
      }
      try {
        fs.unlinkSync(PID_FILE);
      } catch (_) {}
    }
    if (process.platform === 'darwin' || process.platform === 'linux') {
      try {
        const pgrepOut = execFileSync('pgrep', ['-f', 'wappy-push-daemon\\.js.*--worker'], { encoding: 'utf8' });
        for (const line of pgrepOut.split(/\r?\n/)) {
          const p = parseInt(line.trim(), 10);
          if (p && p !== process.pid) {
            try {
              process.kill(p, 'SIGTERM');
            } catch (_) {}
          }
        }
      } catch (_) {}
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
    <string>--silent</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/dev/null</string>
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
  // Singleton guard: evitar workers duplicados
  try {
    if (fs.existsSync(PID_FILE)) {
      const existingPid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
      if (existingPid && existingPid !== process.pid) {
        try {
          process.kill(existingPid, 0);
          // Otro worker ya está vivo; salir silenciosamente
          process.exit(0);
        } catch (_) {}
      }
    }
  } catch (_) {}
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

/**
 * Envía una copia binaria exacta de un archivo original local del PC del usuario al chat de Tenshi
 * Uso: node ~/.gemini/antigravity/wappy-push-daemon.js --send-file="/ruta/archivo.pdf" --orden-id="<id>" [--resumen="..."]
 */
async function sendLocalFileCopyToWappy(cliArgs) {
  const rawFilePath = cliArgs['send-file'] || cliArgs.sendFile || '';
  const ordenId = cliArgs['orden-id'] || cliArgs.ordenId || '';
  const resumen =
    cliArgs.resumen ||
    cliArgs.resultado ||
    'Aquí tienes la copia original intacta del archivo solicitado desde tu computador.';

  if (!rawFilePath || !ordenId) {
    console.error('Uso: --send-file="<ruta_absoluta>" --orden-id="<ordenId>" [--resumen="..."]');
    process.exit(1);
  }

  const resolvedPath = rawFilePath.startsWith('~/')
    ? path.join(os.homedir(), rawFilePath.slice(2))
    : path.resolve(rawFilePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ El archivo original no existe en la ruta: ${resolvedPath}`);
    process.exit(1);
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) {
    console.error(`❌ La ruta indicada no es un archivo: ${resolvedPath}`);
    process.exit(1);
  }

  const buf = fs.readFileSync(resolvedPath);
  const fileName = path.basename(resolvedPath);
  const ext = path.extname(fileName).toLowerCase();
  const mimeMap = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.zip': 'application/zip',
  };
  const mimeType = mimeMap[ext] || 'application/octet-stream';
  const dataUrl = `data:${mimeType};base64,${buf.toString('base64')}`;

  const { wappyUrl, apiKey } = resolveCredentials(cliArgs);
  if (!apiKey) {
    console.error('❌ No se encontró API Key de WAPPY en ~/.gemini/config/mcp_config.json');
    process.exit(1);
  }

  const completeUrl = `${wappyUrl}/api/mcp-bridge/antigravity/completar`;
  const resp = await jsonRequest(completeUrl, 'POST', apiKey, {
    ordenId,
    formato: 'copia_archivo',
    resultado: resumen,
    resumen,
    archivoOriginal: {
      name: fileName,
      mimeType,
      size: buf.length,
      dataUrl,
    },
  });

  if (resp.status === 200 && resp.data?.exito) {
    console.log(`✅ Copia original del archivo "${fileName}" (${buf.length} bytes) enviada exitosamente al chat de Tenshi.`);
    process.exit(0);
  } else {
    console.error(`❌ Error enviando copia del archivo a WAPPY (HTTP ${resp.status}):`, resp.data || '');
    process.exit(1);
  }
}

if (require.main === module) {
  const cliArgs = parseArgs();
  if (cliArgs['send-file'] || cliArgs.sendFile) {
    sendLocalFileCopyToWappy(cliArgs);
  } else if (cliArgs.stop) {
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
  sendLocalFileCopyToWappy,
};
