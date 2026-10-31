#!/usr/bin/env node
/**
 * WAPPY IA — Monitor Automático y Auto-Reconectador de Conectores
 * (Google Antigravity + Google NotebookLM + Google Flow Studio)
 * =====================================================================
 * Programado para ejecutarse:
 * - Al encender el PC / iniciar sesión (RunAtLoad)
 * - Al despertar de reposo (Sleep/Wake Recovery)
 * - De Lunes a Sábado a las 07:00 AM, 02:00 PM (14:00) y 06:00 PM (18:00)
 *
 * Flujo de trabajo:
 * 1. Verifica conexión en vivo de Antigravity, NotebookLM y Google Flow.
 * 2. Si detecta cualquier fallo, ejecuta protocolo de auto-reconexión local.
 * 3. Si encontró errores en la revisión:
 *    - Si logró reconectar todo: envía correo a grupowappy@gmail.com notificando
 *      la falla detectada y confirmando la reconexión exitosa.
 *    - Si algún módulo NO pudo reconectar: envía correo de ALERTA a grupowappy@gmail.com
 *      solicitando reconexión manual con el diagnóstico exacto.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const zlib = require('zlib');
const { spawn, execFileSync } = require('child_process');

const HOME_DIR = os.homedir();
const AGY_DIR = path.join(HOME_DIR, '.gemini', 'antigravity');
const CONFIG_DIR = path.join(HOME_DIR, '.gemini', 'config');
const KEYS_FILE = path.join(AGY_DIR, 'wappy-keys.json');
const DAEMON_SCRIPT = path.join(AGY_DIR, 'wappy-push-daemon.js');
const LOG_FILE = path.join(AGY_DIR, 'wappy-healthcheck.log');
const STATE_FILE = path.join(AGY_DIR, 'wappy-healthcheck-state.json');
const BITACORA_JSON_FILE = path.join(AGY_DIR, 'wappy-healthcheck-bitacora.json');
const DESKTOP_DOCX_FILE = path.join(HOME_DIR, 'Desktop', 'Bitacora_Conectores_WAPPY_IA.docx');
const DESKTOP_WAPPY_FOLDER_DOCX = path.join(HOME_DIR, 'Desktop', 'Wappy IA', 'Bitacora_Conectores_WAPPY_IA.docx');
const LOCK_FILE = path.join(AGY_DIR, 'wappy-healthcheck.lock');
const ALERT_EMAIL = 'grupowappy@gmail.com';
const LOG_MAX_BYTES = 3 * 1024 * 1024;

function parseArgs() {
  const args = {};
  for (const raw of process.argv.slice(2)) {
    if (raw.startsWith('--')) {
      const eq = raw.indexOf('=');
      if (eq !== -1) {
        args[raw.slice(2, eq)] = raw.slice(eq + 1);
      } else {
        args[raw.slice(2)] = true;
      }
    }
  }
  return args;
}

function log(msg) {
  const line = `[${new Date().toISOString()}] [WAPPY HealthCheck] ${msg}\n`;
  try {
    fs.mkdirSync(AGY_DIR, { recursive: true });
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > LOG_MAX_BYTES) {
      try {
        fs.renameSync(LOG_FILE, `${LOG_FILE}.old`);
      } catch (_) {}
    }
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (_) {}
  process.stdout.write(line);
}

function resolveAllCredentials() {
  const candidates = [];
  const seen = new Set();
  const add = (url, key) => {
    const cleanKey = String(key || '').trim();
    if (!cleanKey || !cleanKey.startsWith('wpy_')) return;
    const cleanUrl = String(url || 'https://wappy.club').trim().replace(/\/$/, '').replace(/\/api\/mcp-bridge.*$/, '') || 'https://wappy.club';
    const k = `${cleanUrl}|${cleanKey}`;
    if (seen.has(k)) return;
    seen.add(k);
    candidates.push({ wappyUrl: cleanUrl, apiKey: cleanKey });
  };

  try {
    if (fs.existsSync(KEYS_FILE)) {
      const arr = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item && item.apiKey) add(item.wappyUrl, item.apiKey);
        }
      }
    }
  } catch (_) {}

  for (const cfgPath of [path.join(CONFIG_DIR, 'mcp_config.json'), path.join(AGY_DIR, 'mcp_config.json')]) {
    try {
      if (!fs.existsSync(cfgPath)) continue;
      const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      for (const s of Object.values(raw?.mcpServers || {})) {
        const u = s?.serverUrl || s?.url || '';
        if (u && u.includes('apiKey=')) {
          const parsed = new URL(u);
          add(`${parsed.protocol}//${parsed.host}`, parsed.searchParams.get('apiKey'));
        }
      }
    } catch (_) {}
  }

  return candidates;
}

function resolveCredentials() {
  const all = resolveAllCredentials();
  return all[0] || { wappyUrl: 'https://wappy.club', apiKey: '' };
}

function httpJson(urlStr, { method = 'GET', headers = {}, body = null, timeoutMs = 20000 } = {}) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const client = parsed.protocol === 'https:' ? https : http;
      const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
      const reqHeaders = {
        Accept: 'application/json',
        ...headers,
      };
      if (payload && !reqHeaders['Content-Type']) {
        reqHeaders['Content-Type'] = 'application/json; charset=utf-8';
      }
      if (payload) {
        reqHeaders['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = client.request(
        parsed,
        {
          method,
          headers: reqHeaders,
          timeout: timeoutMs,
        },
        (res) => {
          let raw = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () => {
            let data = null;
            try {
              data = JSON.parse(raw);
            } catch (_) {}
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              data,
              raw,
            });
          });
        }
      );
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, status: 0, data: null, error: 'Timeout de red' });
      });
      req.on('error', (err) => {
        resolve({ ok: false, status: 0, data: null, error: err.message });
      });
      if (payload) req.write(payload);
      req.end();
    } catch (err) {
      resolve({ ok: false, status: 0, data: null, error: err.message });
    }
  });
}

async function waitForInternetConnection(wappyUrl, maxWaitMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await httpJson(`${wappyUrl}/api/notebooklm/connect-script`, {
      method: 'GET',
      timeoutMs: 6000,
    });
    if (res.status === 200) return true;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

function isLocalLanguageServerRunning() {
  if (process.platform === 'darwin' || process.platform === 'linux') {
    try {
      const out = execFileSync('/bin/ps', ['-axww', '-o', 'command='], { encoding: 'utf8', timeout: 4000 });
      return out.split(/\r?\n/).some((l) => l.includes('language_server') && !l.includes('grep'));
    } catch (_) {
      return false;
    }
  }
  return true;
}

function isLocalPushWorkerRunning() {
  if (process.platform === 'darwin' || process.platform === 'linux') {
    try {
      const out = execFileSync('/bin/ps', ['-axww', '-o', 'command='], { encoding: 'utf8', timeout: 4000 });
      return out
        .split(/\r?\n/)
        .some((l) => (l.includes('wappy-push-daemon.js') || l.includes('wappy-tenshi-listener.js')) && l.includes('--worker'));
    } catch (_) {
      return false;
    }
  }
  return true;
}

/**
 * 1. PRUEBA Y RECONEXIÓN DE GOOGLE ANTIGRAVITY
 */
async function checkAntigravity(wappyUrl, apiKey) {
  const workerLocal = isLocalPushWorkerRunning();
  const lsLocal = isLocalLanguageServerRunning();
  const allCreds = resolveAllCredentials();
  const credsToCheck = allCreds.length > 0 ? allCreds : [{ wappyUrl, apiKey }];

  let primaryUserId = '';
  let connectedCount = 0;
  const disconnectedKeys = [];

  for (const c of credsToCheck) {
    const statusRes = await httpJson(`${c.wappyUrl}/api/studio/antigravity/status`, {
      method: 'GET',
      headers: {
        'x-api-key': c.apiKey,
        Authorization: `Bearer ${c.apiKey}`,
      },
      timeoutMs: 12000,
    });
    const uid = statusRes.data?.userId || statusRes.data?.bridge?.userId || '';
    if (!primaryUserId && uid) primaryUserId = uid;
    const isConn = Boolean(
      statusRes.ok &&
        (statusRes.data?.bridge?.connected ||
          statusRes.data?.bridge?.userDaemonConnected ||
          Number(statusRes.data?.bridge?.userListeners) > 0)
    );
    if (isConn) {
      connectedCount += 1;
    } else {
      disconnectedKeys.push(`${c.apiKey.slice(0, 14)}...`);
    }
  }

  const serverConnected = connectedCount === credsToCheck.length && credsToCheck.length > 0;

  if (workerLocal && serverConnected && lsLocal) {
    return {
      ok: true,
      userId: primaryUserId,
      detail: `Daemon Push SSE activo (${connectedCount}/${credsToCheck.length} cuentas conectadas en vivo) y motor Antigravity local operativo.`,
    };
  }

  const reasons = [];
  if (!workerLocal) reasons.push('proceso local wappy-push-daemon no estaba en ejecución');
  if (!serverConnected) reasons.push(`servidor WAPPY detectó cuenta(s) sin túnel SSE (${disconnectedKeys.join(', ')})`);
  if (!lsLocal) reasons.push('aplicación local Antigravity (language_server) estaba cerrada');

  return {
    ok: false,
    userId: primaryUserId,
    detail: `Fallo detectado en Antigravity: ${reasons.join(', ')}.`,
    workerLocal,
    serverConnected,
    lsLocal,
  };
}

async function reconnectAntigravity(wappyUrl, apiKey) {
  log('🔄 Ejecutando auto-reconexión de Google Antigravity...');
  try {
    if (!isLocalLanguageServerRunning() && process.platform === 'darwin' && fs.existsSync('/Applications/Antigravity.app')) {
      log('🚀 Abriendo Antigravity.app en segundo plano para iniciar language_server...');
      try {
        execFileSync('/usr/bin/open', ['-gj', '-a', '/Applications/Antigravity.app'], { timeout: 6000 });
      } catch (_) {}
    }

    if (fs.existsSync(DAEMON_SCRIPT)) {
      const child = spawn(process.execPath, [DAEMON_SCRIPT, '--install', `--key=${apiKey}`, `--url=${wappyUrl}`], {
        stdio: 'ignore',
        detached: true,
        windowsHide: true,
      });
      child.unref();
    }

    // Esperar hasta 25 segundos (consultando cada 2.5s) para dar tiempo a que Antigravity.app y el daemon Push SSE levanten en frío
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      const check = await checkAntigravity(wappyUrl, apiKey);
      if (check.ok) {
        return check;
      }
    }
  } catch (err) {
    log(`⚠️ Error durante intento de reconexión Antigravity: ${err.message}`);
  }
  return checkAntigravity(wappyUrl, apiKey);
}

/**
 * 2. PRUEBA DE CONECTIVIDAD DE GOOGLE NOTEBOOKLM
 */
async function checkNotebookLM(wappyUrl, apiKey) {
  const mcpRes = await httpJson(`${wappyUrl}/api/mcp-bridge/notebooklm/tool`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    body: { tool: 'notebook_list', arguments: {} },
    timeoutMs: 25000,
  });

  if (mcpRes.ok && mcpRes.data && !mcpRes.data.error && Array.isArray(mcpRes.data.result)) {
    return {
      ok: true,
      notebooks: mcpRes.data.result,
      detail: `Sesión privada de Google NotebookLM activa (${mcpRes.data.result.length} cuadernos detectados).`,
    };
  }

  const testRes = await httpJson(`${wappyUrl}/api/notebooklm/test`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    timeoutMs: 25000,
  });

  if (testRes.ok && testRes.data?.success) {
    return {
      ok: true,
      notebooks: [],
      detail: testRes.data.message || 'Sesión privada de Google NotebookLM activa.',
    };
  }

  const errReason =
    mcpRes.data?.error ||
    testRes.data?.reason ||
    testRes.data?.error ||
    mcpRes.error ||
    `HTTP ${mcpRes.status || testRes.status}`;

  return {
    ok: false,
    notebooks: [],
    detail: `Fallo en conexión con Google NotebookLM: ${errReason}`,
  };
}

/**
 * 3. PRUEBA DE CONECTIVIDAD DE GOOGLE FLOW STUDIO (VEO / IMAGEN)
 */
function buildFlowCookieHeader(cookies) {
  if (!Array.isArray(cookies) || cookies.length === 0) return '';
  const filtered = cookies.filter((c) => {
    const dom = String(c.domain || '.google.com').toLowerCase();
    return (
      dom === '.google.com' ||
      dom === 'google.com' ||
      dom === 'flow.google.com' ||
      dom === '.flow.google.com' ||
      dom === 'accounts.google.com' ||
      dom === '.accounts.google.com'
    );
  });
  const source = filtered.length > 0 ? filtered : cookies;
  const dedup = new Map();
  for (const c of source) {
    if (c && c.name && c.value && !String(c.domain || '').toLowerCase().includes('flow.google.com')) {
      dedup.set(c.name, c.value);
    }
  }
  for (const c of source) {
    if (c && c.name && c.value && String(c.domain || '').toLowerCase().includes('flow.google.com')) {
      dedup.set(c.name, c.value);
    }
  }
  return Array.from(dedup.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function checkGoogleFlow(wappyUrl, apiKey, userId) {
  const testRes = await httpJson(`${wappyUrl}/api/googleflow/test`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    timeoutMs: 22000,
  });

  if (testRes.ok && testRes.data?.success) {
    return {
      ok: true,
      detail: testRes.data.message || 'Sesión privada de Google Flow Studio verificada en vivo.',
    };
  }

  if (userId) {
    const sessRes = await httpJson(`${wappyUrl}/api/notebooklm/internal/session/${encodeURIComponent(userId)}`, {
      method: 'GET',
      timeoutMs: 12000,
    });
    const cookies = sessRes.data?.cookies || [];
    if (Array.isArray(cookies) && cookies.length > 0) {
      const cookieHeader = buildFlowCookieHeader(cookies);
      const flowPage = await httpJson('https://flow.google.com/', {
        method: 'GET',
        headers: {
          Cookie: cookieHeader,
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeoutMs: 14000,
      });
      const html = String(flowPage.raw || '');
      const atMatch = html.match(/"SNlM0e":"([^"]+)"/);
      const emailMatch = html.match(/"oPEP7c":"([^"]+@[^"]+)"/);
      if (atMatch && atMatch[1]) {
        return {
          ok: true,
          detail: `Sesión de Google Flow Studio activa en flow.google.com (${emailMatch ? emailMatch[1] : sessRes.data?.email || 'cuenta autenticada'}).`,
        };
      }
    }
  }

  const errReason =
    testRes.data?.reason ||
    testRes.data?.error ||
    (testRes.status === 401 ? 'Sesión de Google Flow expirada o pendiente de sincronización' : `HTTP ${testRes.status}`);

  return {
    ok: false,
    detail: `Fallo en conexión con Google Flow Studio: ${errReason}`,
  };
}

/**
 * 3.B PRUEBAS FUNCIONALES E2E REALES (PREGUNTA A ANTIGRAVITY + PREGUNTA EN CUADERNO NOTEBOOKLM + GENERAR IMAGEN EN FLOW)
 */
async function runFunctionalAntigravityQuestion(wappyUrl, apiKey) {
  const t0 = Date.now();
  const question = '¿Qué es el SG-SST según el Decreto 1072 de 2015 en Colombia?';
  log(`🧪 [Prueba Funcional 1/3] Enviando pregunta real a Google Antigravity ("${question}")...`);

  const delRes = await httpJson(`${wappyUrl}/api/mcp-bridge/antigravity/delegar`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, Authorization: `Bearer ${apiKey}` },
    body: {
      titulo: '[HEALTHCHECK-E2E] Pregunta Funcional a Google Antigravity',
      instruccion: question,
      tipo_entregable: 'respuesta',
      sourceModule: 'healthcheck_e2e',
    },
    timeoutMs: 15000,
  });

  const ordenId = delRes.data?.ordenId;
  if (!delRes.ok || !ordenId) {
    return {
      ok: false,
      question,
      answer: '',
      latencyMs: Date.now() - t0,
      detail: `No se pudo delegar pregunta a Antigravity (${delRes.data?.error || `HTTP ${delRes.status}`}).`,
    };
  }

  // Esperar hasta 18 segundos a que el daemon local en el Mac reclame por Push SSE y responda la orden
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const ordRes = await httpJson(
      `${wappyUrl}/api/mcp-bridge/antigravity/ordenes?id=${encodeURIComponent(ordenId)}`,
      {
        method: 'GET',
        headers: { 'x-api-key': apiKey, Authorization: `Bearer ${apiKey}` },
        timeoutMs: 8000,
      }
    );
    const ord = Array.isArray(ordRes.data?.ordenes) ? ordRes.data.ordenes[0] : null;
    if (ord && ord.estado === 'done') {
      const answer = String(ord.entregable?.resumen || ord.entregable?.contenido || '').trim();
      const latencyMs = Date.now() - t0;
      log(`✅ [Prueba Funcional 1/3] Antigravity respondió en ${(latencyMs / 1000).toFixed(1)}s: "${answer.slice(0, 110)}..."`);
      return {
        ok: true,
        question,
        answer,
        latencyMs,
        detail: `Pregunta respondida en ${(latencyMs / 1000).toFixed(1)}s: "${answer.slice(0, 140)}"`,
      };
    }
  }

  return {
    ok: false,
    question,
    answer: '',
    latencyMs: Date.now() - t0,
    detail: `Tiempo agotado esperando respuesta E2E del daemon local de Antigravity (orden ${ordenId}).`,
  };
}

async function runFunctionalNotebookLMQuestion(wappyUrl, apiKey, existingNotebooks = []) {
  const t0 = Date.now();
  let notebooks = Array.isArray(existingNotebooks) ? existingNotebooks : [];
  if (notebooks.length === 0) {
    const listRes = await httpJson(`${wappyUrl}/api/mcp-bridge/notebooklm/tool`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, Authorization: `Bearer ${apiKey}` },
      body: { tool: 'notebook_list', arguments: {} },
      timeoutMs: 25000,
    });
    if (Array.isArray(listRes.data?.result)) {
      notebooks = listRes.data.result;
    }
  }

  if (notebooks.length === 0) {
    return {
      ok: false,
      notebookTitle: 'Ninguno',
      question: '',
      answer: '',
      latencyMs: Date.now() - t0,
      detail: 'No se encontraron cuadernos disponibles en Google NotebookLM para realizar la consulta.',
    };
  }

  const targetNb =
    notebooks.find((n) => (n.sources_count || n.source_count || 0) > 0 && n.title && !n.title.includes('Untitled')) ||
    notebooks[0];
  const nbTitle = targetNb.title || targetNb.id;
  const question = 'Resume en una frase corta cuál es el tema principal de este cuaderno.';
  log(`🧪 [Prueba Funcional 2/3] Consultando cuaderno "${nbTitle}" en Google NotebookLM...`);

  const askRes = await httpJson(`${wappyUrl}/api/mcp-bridge/notebooklm/tool`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, Authorization: `Bearer ${apiKey}` },
    body: {
      tool: 'chat_ask',
      arguments: {
        notebook_id: targetNb.id,
        notebook: nbTitle,
        query: question,
      },
    },
    timeoutMs: 40000,
  });

  const rawAnswer = String(
    askRes.data?.result?.answer ||
      askRes.data?.answer ||
      (typeof askRes.data?.result === 'string' ? askRes.data.result : '')
  )
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const latencyMs = Date.now() - t0;
  if (askRes.ok && rawAnswer.length > 5 && !askRes.data?.error) {
    log(`✅ [Prueba Funcional 2/3] Cuaderno "${nbTitle}" respondió en ${(latencyMs / 1000).toFixed(1)}s: "${rawAnswer.slice(0, 110)}..."`);
    return {
      ok: true,
      notebookTitle: nbTitle,
      notebooksCount: notebooks.length,
      question,
      answer: rawAnswer,
      latencyMs,
      detail: `Cuaderno "${nbTitle}" (${notebooks.length} cuadernos) respondió en ${(latencyMs / 1000).toFixed(1)}s: "${rawAnswer.slice(0, 150)}..."`,
    };
  }

  return {
    ok: false,
    notebookTitle: nbTitle,
    notebooksCount: notebooks.length,
    question,
    answer: '',
    latencyMs,
    detail: `Fallo al preguntar al cuaderno "${nbTitle}": ${askRes.data?.error || askRes.error || `HTTP ${askRes.status}`}`,
  };
}

async function runFunctionalFlowImageGeneration(wappyUrl, apiKey) {
  const t0 = Date.now();
  const prompt =
    'Ingeniero de seguridad y salud en el trabajo con casco blanco e insignias SST supervisando planta moderna iluminada, fotografia 4k';
  log(`🧪 [Prueba Funcional 3/3] Generando imagen real de prueba en Google Flow Studio...`);

  const genRes = await httpJson(`${wappyUrl}/api/googleflow/generate`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, Authorization: `Bearer ${apiKey}` },
    body: {
      type: 'image',
      prompt,
      aspectRatio: '16:9',
      style: 'fotorrealista',
      skipAntigravity: true,
    },
    timeoutMs: 45000,
  });

  const latencyMs = Date.now() - t0;
  const relUrl = genRes.data?.publicUrl || '';
  if (genRes.ok && genRes.data?.success && relUrl) {
    const fullImageUrl = relUrl.startsWith('http') ? relUrl : `${wappyUrl}${relUrl}`;
    const modelName = genRes.data?.model || 'Google Flow Studio (Imagen 3)';
    log(`✅ [Prueba Funcional 3/3] Imagen generada en ${(latencyMs / 1000).toFixed(1)}s: ${fullImageUrl}`);
    return {
      ok: true,
      prompt,
      imageUrl: fullImageUrl,
      model: modelName,
      latencyMs,
      detail: `Imagen generada en ${(latencyMs / 1000).toFixed(1)}s (${modelName}): ${fullImageUrl}`,
    };
  }

  return {
    ok: false,
    prompt,
    imageUrl: '',
    model: '',
    latencyMs,
    detail: `Fallo generando imagen en Google Flow: ${genRes.data?.error || genRes.error || `HTTP ${genRes.status}`}`,
  };
}

/**
 * 4. AUTO-RECONEXIÓN DE SESIONES GOOGLE (NOTEBOOKLM & FLOW) DESDE PERFIL CHROME LOCAL
 */
function findBrowserExecutable() {
  const home = os.homedir();
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    path.join(home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  for (const bin of candidates) {
    if (fs.existsSync(bin)) return bin;
  }
  return null;
}

function getFreePort() {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', () => resolve(9330 + Math.floor(Math.random() * 400)));
  });
}

function cdpSendRaw(wsUrl, method, params = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(wsUrl);
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Version': '13',
      },
    });
    const timer = setTimeout(() => {
      req.destroy();
      reject(new Error('Timeout CDP'));
    }, 8000);

    req.on('upgrade', (res, socket) => {
      const payload = Buffer.from(JSON.stringify({ id: 1, method, params }), 'utf8');
      const mask = crypto.randomBytes(4);
      let header;
      if (payload.length < 126) {
        header = Buffer.from([0x81, 0x80 | payload.length]);
      } else if (payload.length < 65536) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 0x80 | 126;
        header.writeUInt16BE(payload.length, 2);
      } else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 0x80 | 127;
        header.writeBigUInt64BE(BigInt(payload.length), 2);
      }
      const masked = Buffer.alloc(payload.length);
      for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4];
      socket.write(Buffer.concat([header, mask, masked]));

      const chunks = [];
      socket.on('data', (chunk) => {
        chunks.push(chunk);
        const str = Buffer.concat(chunks).toString('utf8');
        const first = str.indexOf('{');
        const last = str.lastIndexOf('}');
        if (first !== -1 && last > first) {
          try {
            const parsedJson = JSON.parse(str.slice(first, last + 1));
            clearTimeout(timer);
            socket.end();
            return resolve(parsedJson);
          } catch (_) {}
        }
      });
    });
    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    req.end();
  });
}

async function refreshGoogleSessionFromLocalChrome(wappyUrl, apiKey, userId) {
  log('🔄 Intentando auto-reconectar sesión de Google (NotebookLM + Flow) desde el perfil local de Chrome...');

  // Paso 1: Intentar primero sincronización cruzada en servidor (/api/googleflow/sync-from-notebooklm)
  await httpJson(`${wappyUrl}/api/googleflow/sync-from-notebooklm`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, Authorization: `Bearer ${apiKey}` },
    timeoutMs: 12000,
  }).catch(() => {});

  const browserBin = findBrowserExecutable();
  const profileDir = path.join(HOME_DIR, '.wappy-notebooklm-auth');
  if (!browserBin || !fs.existsSync(profileDir)) {
    log('⚠️ No se encontró perfil local .wappy-notebooklm-auth o navegador Chrome para refrescar cookies.');
    return false;
  }

  try {
    fs.rmSync(path.join(profileDir, 'SingletonLock'), { force: true });
  } catch (_) {}

  const debugPort = await getFreePort();
  const child = spawn(
    browserBin,
    [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      '--remote-allow-origins=*',
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      'https://notebooklm.google.com/',
    ],
    { stdio: 'ignore', detached: true }
  );

  let uploaded = false;
  try {
    const start = Date.now();
    while (Date.now() - start < 25000) {
      await new Promise((r) => setTimeout(r, 2000));
      const listRes = await httpJson(`http://127.0.0.1:${debugPort}/json/list`, { timeoutMs: 3000 });
      const pages = Array.isArray(listRes.data) ? listRes.data : [];
      const page = pages.find((p) => p.type === 'page' && p.webSocketDebuggerUrl);
      if (!page) continue;

      await cdpSendRaw(page.webSocketDebuggerUrl, 'Target.createTarget', {
        url: 'https://flow.google.com/',
        background: true,
      }).catch(() => {});
      await new Promise((r) => setTimeout(r, 2500));

      const cdpRes = await cdpSendRaw(page.webSocketDebuggerUrl, 'Network.getAllCookies').catch(() => null);
      const allCookies = cdpRes?.result?.cookies || [];
      const googleCookies = allCookies.filter((c) => c.domain && c.domain.includes('google.com'));
      const names = new Set(googleCookies.map((c) => c.name));

      if (names.has('SID') && (names.has('__Secure-1PSID') || names.has('__Secure-1PSIDTS'))) {
        // Subir a /api/notebooklm/session, /api/googleflow/session y /api/notebooklm/internal/session/:userId
        const s1 = await httpJson(`${wappyUrl}/api/notebooklm/session`, {
          method: 'POST',
          headers: { 'x-api-key': apiKey, Authorization: `Bearer ${apiKey}` },
          body: { cookies: googleCookies, source: 'healthcheck-auto' },
          timeoutMs: 15000,
        });
        const s2 = await httpJson(`${wappyUrl}/api/googleflow/session`, {
          method: 'POST',
          headers: { 'x-api-key': apiKey, Authorization: `Bearer ${apiKey}` },
          body: { cookies: googleCookies, source: 'healthcheck-auto' },
          timeoutMs: 15000,
        });
        let s3 = { ok: false };
        if (userId) {
          s3 = await httpJson(`${wappyUrl}/api/notebooklm/internal/session/${encodeURIComponent(userId)}`, {
            method: 'POST',
            body: { cookies: googleCookies },
            timeoutMs: 15000,
          });
        }
        uploaded = Boolean(s1.ok || s2.ok || s3.ok);
        log(`✅ Cookies de Google extraídas (${googleCookies.length}) y sincronizadas con WAPPY (status: ${uploaded}).`);
        break;
      }
    }
  } catch (err) {
    log(`⚠️ Error extrayendo cookies vía CDP headless: ${err.message}`);
  } finally {
    try {
      child.kill('SIGKILL');
    } catch (_) {}
  }

  return uploaded;
}

/**
 * 5. ENVÍO DE CORREO UNIFICADO A grupowappy@gmail.com AL FINALIZAR TODA LA PRUEBA
 */
async function sendHealthEmail(
  wappyUrl,
  apiKey,
  { trigger, initialResults, finalResults, functionalResults = {}, hadInitialErrors, allHealthyNow }
) {
  const nowStr = new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const failedNames = Object.entries(finalResults)
    .filter(([, v]) => !v.ok)
    .map(([k]) => k.toUpperCase());

  const subject = !allHealthyNow
    ? `🚨 [WAPPY IA] Solicitud de Reconexión Manual — Fallo en ${failedNames.join(', ')}`
    : hadInitialErrors
    ? `✅ [WAPPY IA] Conectores Reconectados y Pruebas E2E OK (${trigger})`
    : `🟢 [WAPPY IA] Reporte Unificado E2E OK (Antigravity + NotebookLM + Flow)`;

  const renderRow = (label, initRes, finRes, funcRes) => {
    const wasOk = initRes?.ok;
    const isOk = finRes?.ok;
    const badge = isOk
      ? wasOk
        ? '<span style="background:#dcfce7;color:#166534;padding:4px 10px;border-radius:999px;font-weight:700;font-size:12px;">🟢 CONECTADO Y PROBADO</span>'
        : '<span style="background:#fef9c3;color:#854d0e;padding:4px 10px;border-radius:999px;font-weight:700;font-size:12px;">🔄 RECONECTADO Y PROBADO</span>'
      : '<span style="background:#fee2e2;color:#991b1b;padding:4px 10px;border-radius:999px;font-weight:700;font-size:12px;">🔴 ERROR — REQUIERE RECONEXIÓN</span>';

    const funcHtml = funcRes
      ? `<div style="margin-top:6px;padding:8px 10px;background:#ffffff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;color:#0f172a;">
           <b>🧪 Prueba Funcional Real:</b> ${funcRes.detail || ''}
           ${funcRes.imageUrl ? `<br/><a href="${funcRes.imageUrl}" target="_blank" style="color:#0d9488;font-weight:700;">🔗 Ver imagen generada en Google Flow</a>` : ''}
         </div>`
      : '';

    return `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;vertical-align:top;">${label}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;vertical-align:top;">${badge}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;vertical-align:top;">
          <div><b>Conectividad:</b> ${finRes?.detail || ''}</div>
          ${!wasOk && isOk ? `<div style="color:#64748b;font-size:12px;">Falla inicial corregida: ${initRes?.detail || ''}</div>` : ''}
          ${funcHtml}
        </td>
      </tr>
    `;
  };

  const manualActionBlock = !allHealthyNow
    ? `
      <div style="margin-top:20px;padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#7f1d1d;">
        <h3 style="margin:0 0 8px 0;font-size:15px;">⚠️ Solicitud de Reconexión Manual</h3>
        <p style="margin:0 0 10px 0;font-size:13px;line-height:1.5;">
          El sistema intentó reconectar automáticamente los servicios con falla, pero se requiere iniciar sesión nuevamente o autorizar la ventana en tu Mac:
        </p>
        <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;">
          ${!finalResults.antigravity?.ok ? '<li><b>Google Antigravity:</b> Abre Antigravity en tu Mac o ejecuta <code>node ~/.gemini/antigravity/wappy-push-daemon.js --install</code></li>' : ''}
          ${!finalResults.notebooklm?.ok ? '<li><b>Google NotebookLM:</b> Ejecuta en terminal <code>node ~/.gemini/antigravity/wappy-push-daemon.js --notebooklm</code> o entra a WAPPY y pulsa Reconectar NotebookLM.</li>' : ''}
          ${!finalResults.googleflow?.ok ? '<li><b>Google Flow Studio:</b> Ejecuta en terminal <code>node ~/.gemini/antigravity/wappy-push-daemon.js --googleflow</code> o entra a WAPPY Studio y pulsa Reconectar Flow.</li>' : ''}
        </ul>
      </div>
    `
    : '';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;">
      <p style="margin:0 0 14px 0;font-size:14px;">
        Reporte unificado de conectividad y pruebas funcionales E2E en tu iMac (<b>Disparador:</b> <code>${trigger}</code> &bull; <b>Fecha:</b> ${nowStr}):
      </p>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
        <thead>
          <tr style="background:#0f172a;color:#ffffff;text-align:left;font-size:12px;text-transform:uppercase;">
            <th style="padding:10px 12px;">Módulo / Conector</th>
            <th style="padding:10px 12px;">Estado Final</th>
            <th style="padding:10px 12px;">Conectividad + Prueba Funcional E2E</th>
          </tr>
        </thead>
        <tbody>
          ${renderRow('⚡ Google Antigravity', initialResults.antigravity, finalResults.antigravity, functionalResults.antigravity)}
          ${renderRow('📓 Google NotebookLM', initialResults.notebooklm, finalResults.notebooklm, functionalResults.notebooklm)}
          ${renderRow('🎬 Google Flow Studio', initialResults.googleflow, finalResults.googleflow, functionalResults.googleflow)}
        </tbody>
      </table>
      ${manualActionBlock}
    </div>
  `;

  const emailRes = await httpJson(`${wappyUrl}/api/mcp-bridge/email/send`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    body: {
      to: ALERT_EMAIL,
      subject,
      html,
      skipAutoReport: true,
      adjuntar_informe: false,
    },
    timeoutMs: 25000,
  });

  if (emailRes.ok && emailRes.data?.exito) {
    log(`📧 Correo unificado enviado exitosamente a ${ALERT_EMAIL} (${subject}).`);
    return true;
  } else {
    log(`❌ Error enviando correo a ${ALERT_EMAIL}: ${emailRes.data?.error || emailRes.error || `HTTP ${emailRes.status}`}`);
    return false;
  }
}

/**
 * 5. GENERADOR DE BITÁCORA EN WORD (.DOCX NATIVO OPENXML) EN EL ESCRITORIO
 */
function xmlEscape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createZipBuffer(files) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const rawData = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8');
    const compressed = zlib.deflateRawSync(rawData);
    const crc = crc32(rawData);

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(rawData.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(rawData.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);

    localHeaders.push(local, compressed);
    centralHeaders.push(central);
    offset += local.length + compressed.length;
  }

  const centralBuf = Buffer.concat(centralHeaders);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, centralBuf, eocd]);
}

function formatColombianDate(isoOrDate) {
  try {
    return new Date(isoOrDate).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch (_) {
    return String(isoOrDate);
  }
}

function triggerLabel(trigger) {
  const map = {
    boot: 'Encendido de PC (Boot)',
    wake: 'Despertar de Reposo (Wake)',
    schedule: 'Corte Programado (7am/2pm/6pm)',
    cron: 'Corte Programado (Cron)',
    manual: 'Ejecución Manual',
    'imac-live-test': 'Prueba Inicial iMac',
  };
  return map[trigger] || `Revisión (${trigger})`;
}

function seedBitacoraFromExistingLog() {
  if (!fs.existsSync(LOG_FILE)) return [];
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = raw.split(/\r?\n/);
    const entries = [];
    let current = null;

    for (const line of lines) {
      const mStart = line.match(/^\[([^\]]+)\]\s+\[WAPPY HealthCheck\]\s+🔍 Iniciando pruebas de conexión \(trigger=([^)]+)\)/);
      if (mStart) {
        if (current && current.hasStatus) entries.push(current);
        current = {
          isoDate: mStart[1],
          fechaColombia: formatColombianDate(mStart[1]),
          trigger: mStart[2],
          hostname: os.hostname(),
          antigravity: { initialOk: true, finalOk: true, detail: 'Operativo' },
          notebooklm: { initialOk: true, finalOk: true, detail: 'Operativo' },
          googleflow: { initialOk: true, finalOk: true, detail: 'Operativo' },
          hadInitialErrors: false,
          allHealthyNow: true,
          notes: 'Verificación completada exitosamente.',
          hasStatus: false,
        };
        continue;
      }
      if (!current) continue;
      const mStat = line.match(/📊 Estado inicial -> Antigravity: (OK|FALLO) \| NotebookLM: (OK|FALLO) \| Google Flow: (OK|FALLO)/);
      if (mStat) {
        current.hasStatus = true;
        current.antigravity.initialOk = mStat[1] === 'OK';
        current.antigravity.finalOk = mStat[1] === 'OK';
        current.notebooklm.initialOk = mStat[2] === 'OK';
        current.notebooklm.finalOk = mStat[2] === 'OK';
        current.googleflow.initialOk = mStat[3] === 'OK';
        current.googleflow.finalOk = mStat[3] === 'OK';
        current.hadInitialErrors = !(current.antigravity.initialOk && current.notebooklm.initialOk && current.googleflow.initialOk);
        current.allHealthyNow = !current.hadInitialErrors;
      }
      const mRecAg = line.match(/🔄 Resultado reconexión Antigravity: (RECONECTADO|SIGUE CON FALLO)/);
      if (mRecAg) {
        current.antigravity.finalOk = mRecAg[1] === 'RECONECTADO';
        current.allHealthyNow = current.antigravity.finalOk && current.notebooklm.finalOk && current.googleflow.finalOk;
        current.notes = current.antigravity.finalOk
          ? 'Antigravity fue auto-reconectado exitosamente.'
          : 'Arranque en frío: Antigravity aún estaba iniciando al momento del chequeo boot.';
      }
    }
    if (current && current.hasStatus) entries.push(current);
    return entries;
  } catch (_) {
    return [];
  }
}

function buildCellXml(text, opts = {}) {
  const {
    bold = false,
    color = '1E293B',
    fill = 'FFFFFF',
    width = 1800,
    align = 'left',
    fontSize = 18,
  } = opts;
  return `
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${width}" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>
        <w:tcMar>
          <w:top w:w="100" w:type="dxa"/>
          <w:bottom w:w="100" w:type="dxa"/>
          <w:left w:w="120" w:type="dxa"/>
          <w:right w:w="120" w:type="dxa"/>
        </w:tcMar>
        <w:vAlign w:val="center"/>
      </w:tcPr>
      <w:p>
        <w:pPr>
          <w:jc w:val="${align}"/>
          <w:spacing w:before="20" w:after="20"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            ${bold ? '<w:b/>' : ''}
            <w:color w:val="${color}"/>
            <w:sz w:val="${fontSize}"/>
            <w:szCs w:val="${fontSize}"/>
          </w:rPr>
          <w:t xml:space="preserve">${xmlEscape(text)}</w:t>
        </w:r>
      </w:p>
    </w:tc>`;
}

function buildConnectorBadge(mod) {
  if (mod.initialOk && mod.finalOk) {
    return { text: 'OK (Operativo)', fill: 'DCFCE7', color: '166534' };
  }
  if (!mod.initialOk && mod.finalOk) {
    return { text: 'RECONECTADO', fill: 'FEF3C7', color: '92400E' };
  }
  return { text: 'FALLO', fill: 'FEE2E2', color: '991B1B' };
}

function generateBitacoraDocxBuffer(entries) {
  const total = entries.length;
  const okCount = entries.filter((e) => !e.hadInitialErrors && e.allHealthyNow).length;
  const reconnectedCount = entries.filter((e) => e.hadInitialErrors && e.allHealthyNow).length;
  const failCount = entries.filter((e) => !e.allHealthyNow).length;
  const lastUpdate = total > 0 ? entries[entries.length - 1].fechaColombia : formatColombianDate(new Date());

  const headerRowXml = `
    <w:tr>
      <w:trPr><w:tblHeader/></w:trPr>
      ${buildCellXml('#', { bold: true, color: 'FFFFFF', fill: '0C192E', width: 650, align: 'center', fontSize: 18 })}
      ${buildCellXml('Fecha y Hora (Colombia)', { bold: true, color: 'FFFFFF', fill: '0C192E', width: 2250, align: 'left', fontSize: 18 })}
      ${buildCellXml('Disparador / Corte', { bold: true, color: 'FFFFFF', fill: '0C192E', width: 2150, align: 'left', fontSize: 18 })}
      ${buildCellXml('Google Antigravity', { bold: true, color: 'FFFFFF', fill: '0C192E', width: 1650, align: 'center', fontSize: 18 })}
      ${buildCellXml('Google NotebookLM', { bold: true, color: 'FFFFFF', fill: '0C192E', width: 1650, align: 'center', fontSize: 18 })}
      ${buildCellXml('Google Flow Studio', { bold: true, color: 'FFFFFF', fill: '0C192E', width: 1650, align: 'center', fontSize: 18 })}
      ${buildCellXml('Estado Global', { bold: true, color: 'FFFFFF', fill: '0C192E', width: 1650, align: 'center', fontSize: 18 })}
      ${buildCellXml('Diagnóstico y Observaciones', { bold: true, color: 'FFFFFF', fill: '0C192E', width: 3550, align: 'left', fontSize: 18 })}
    </w:tr>`;

  // Mostrar del más reciente al más antiguo manteniendo su número consecutivo histórico
  const rowsXml = entries
    .map((item, idx) => ({ item, num: idx + 1 }))
    .reverse()
    .map(({ item, num }, revIdx) => {
      const zebraFill = revIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
      const ag = buildConnectorBadge(item.antigravity || { initialOk: true, finalOk: true });
      const nb = buildConnectorBadge(item.notebooklm || { initialOk: true, finalOk: true });
      const fl = buildConnectorBadge(item.googleflow || { initialOk: true, finalOk: true });

      let globalBadge = { text: '100% OPERATIVO', fill: 'DCFCE7', color: '166534' };
      if (item.hadInitialErrors && item.allHealthyNow) {
        globalBadge = { text: 'AUTO-RECUPERADO', fill: 'FEF3C7', color: '92400E' };
      } else if (!item.allHealthyNow) {
        globalBadge = { text: 'REQUIERE ATENCIÓN', fill: 'FEE2E2', color: '991B1B' };
      }

      return `
        <w:tr>
          ${buildCellXml(`#${num}`, { bold: true, color: '334155', fill: zebraFill, width: 650, align: 'center', fontSize: 17 })}
          ${buildCellXml(item.fechaColombia, { bold: false, color: '0F172A', fill: zebraFill, width: 2250, align: 'left', fontSize: 17 })}
          ${buildCellXml(triggerLabel(item.trigger), { bold: false, color: '334155', fill: zebraFill, width: 2150, align: 'left', fontSize: 17 })}
          ${buildCellXml(ag.text, { bold: true, color: ag.color, fill: ag.fill, width: 1650, align: 'center', fontSize: 17 })}
          ${buildCellXml(nb.text, { bold: true, color: nb.color, fill: nb.fill, width: 1650, align: 'center', fontSize: 17 })}
          ${buildCellXml(fl.text, { bold: true, color: fl.color, fill: fl.fill, width: 1650, align: 'center', fontSize: 17 })}
          ${buildCellXml(globalBadge.text, { bold: true, color: globalBadge.color, fill: globalBadge.fill, width: 1650, align: 'center', fontSize: 17 })}
          ${buildCellXml(item.notes || 'Conectores verificados en vivo sin novedades.', { bold: false, color: '334155', fill: zebraFill, width: 3550, align: 'left', fontSize: 16 })}
        </w:tr>`;
    })
    .join('\n');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:spacing w:before="0" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:b/>
          <w:color w:val="0C192E"/>
          <w:sz w:val="34"/>
          <w:szCs w:val="34"/>
        </w:rPr>
        <w:t>BITÁCORA AUTOMÁTICA DE CONECTORES — WAPPY IA</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="0" w:after="180"/></w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:color w:val="0D9488"/>
          <w:sz w:val="21"/>
          <w:szCs w:val="21"/>
        </w:rPr>
        <w:t xml:space="preserve">Monitoreo Continuo Lunes a Sábado (07:00 AM · 02:00 PM · 06:00 PM · Encendido · Reposo) | Estación: ${xmlEscape(os.hostname())} | Última actualización: ${xmlEscape(lastUpdate)}</w:t>
      </w:r>
    </w:p>

    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="15200" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        ${buildCellXml(`Total Revisiones: ${total}`, { bold: true, color: '0C192E', fill: 'F1F5F9', width: 3800, align: 'center', fontSize: 20 })}
        ${buildCellXml(`100% Operativas (OK): ${okCount}`, { bold: true, color: '166534', fill: 'DCFCE7', width: 3800, align: 'center', fontSize: 20 })}
        ${buildCellXml(`Auto-Reconexiones: ${reconnectedCount}`, { bold: true, color: '92400E', fill: 'FEF3C7', width: 3800, align: 'center', fontSize: 20 })}
        ${buildCellXml(`Alertas / Fallos: ${failCount}`, { bold: true, color: '991B1B', fill: 'FEE2E2', width: 3800, align: 'center', fontSize: 20 })}
      </w:tr>
    </w:tbl>

    <w:p>
      <w:pPr><w:spacing w:before="140" w:after="100"/></w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:b/>
          <w:color w:val="0C192E"/>
          <w:sz w:val="22"/>
          <w:szCs w:val="22"/>
        </w:rPr>
        <w:t>Historial Cronológico de Revisiones y Reconexiones (Más reciente primero)</w:t>
      </w:r>
    </w:p>

    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="15200" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
      </w:tblPr>
      ${headerRowXml}
      ${rowsXml}
    </w:tbl>

    <w:sectPr>
      <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="450" w:footer="450" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  return createZipBuffer([
    { name: '[Content_Types].xml', data: contentTypesXml },
    { name: '_rels/.rels', data: relsXml },
    { name: 'word/_rels/document.xml.rels', data: docRelsXml },
    { name: 'word/document.xml', data: documentXml },
  ]);
}

function updateWordBitacora({
  trigger,
  initialResults,
  finalResults,
  functionalResults = {},
  hadInitialErrors,
  allHealthyNow,
}) {
  try {
    let entries = [];
    if (fs.existsSync(BITACORA_JSON_FILE)) {
      try {
        entries = JSON.parse(fs.readFileSync(BITACORA_JSON_FILE, 'utf8'));
      } catch (_) {
        entries = [];
      }
    }
    if (!Array.isArray(entries) || entries.length === 0) {
      entries = seedBitacoraFromExistingLog();
    }

    const notesList = [];
    if (!hadInitialErrors && allHealthyNow) {
      notesList.push('Conectividad 3/3 OK.');
    } else {
      if (!initialResults.antigravity.ok) {
        notesList.push(
          finalResults.antigravity.ok
            ? 'Antigravity reconectado automáticamente.'
            : `Fallo Antigravity: ${finalResults.antigravity.detail}`
        );
      }
      if (!initialResults.notebooklm.ok) {
        notesList.push(
          finalResults.notebooklm.ok
            ? 'NotebookLM reconectado automáticamente.'
            : `Fallo NotebookLM: ${finalResults.notebooklm.detail}`
        );
      }
      if (!initialResults.googleflow.ok) {
        notesList.push(
          finalResults.googleflow.ok
            ? 'Google Flow reconectado automáticamente.'
            : `Fallo Google Flow: ${finalResults.googleflow.detail}`
        );
      }
    }

    if (functionalResults.antigravity) {
      notesList.push(
        `[Antigravity E2E: ${functionalResults.antigravity.ok ? 'OK' : 'FALLO'} - ${String(functionalResults.antigravity.answer || functionalResults.antigravity.detail || '').slice(0, 90)}]`
      );
    }
    if (functionalResults.notebooklm) {
      notesList.push(
        `[NotebookLM E2E (${functionalResults.notebooklm.notebookTitle || 'Cuaderno'}): ${functionalResults.notebooklm.ok ? 'OK' : 'FALLO'} - ${String(functionalResults.notebooklm.answer || functionalResults.notebooklm.detail || '').slice(0, 90)}]`
      );
    }
    if (functionalResults.googleflow) {
      notesList.push(
        `[Flow Imagen E2E: ${functionalResults.googleflow.ok ? `OK (${functionalResults.googleflow.imageUrl})` : `FALLO (${functionalResults.googleflow.detail})`}]`
      );
    }

    const nowIso = new Date().toISOString();
    const newEntry = {
      isoDate: nowIso,
      fechaColombia: formatColombianDate(nowIso),
      trigger,
      hostname: os.hostname(),
      antigravity: {
        initialOk: Boolean(initialResults.antigravity.ok),
        finalOk: Boolean(finalResults.antigravity.ok),
        detail: finalResults.antigravity.detail || '',
        functional: functionalResults.antigravity || null,
      },
      notebooklm: {
        initialOk: Boolean(initialResults.notebooklm.ok),
        finalOk: Boolean(finalResults.notebooklm.ok),
        detail: finalResults.notebooklm.detail || '',
        functional: functionalResults.notebooklm || null,
      },
      googleflow: {
        initialOk: Boolean(initialResults.googleflow.ok),
        finalOk: Boolean(finalResults.googleflow.ok),
        detail: finalResults.googleflow.detail || '',
        functional: functionalResults.googleflow || null,
      },
      hadInitialErrors: Boolean(hadInitialErrors),
      allHealthyNow: Boolean(allHealthyNow),
      notes: notesList.join(' '),
    };

    // Evitar duplicar si el seed ya leyó exactamente el mismo segundo
    const lastEntry = entries[entries.length - 1];
    if (
      lastEntry &&
      lastEntry.trigger === newEntry.trigger &&
      Math.abs(new Date(lastEntry.isoDate).getTime() - new Date(newEntry.isoDate).getTime()) < 5000
    ) {
      entries[entries.length - 1] = newEntry;
    } else {
      entries.push(newEntry);
    }

    // Conservar hasta los últimos 500 registros en la bitácora
    if (entries.length > 500) {
      entries = entries.slice(entries.length - 500);
    }

    fs.mkdirSync(AGY_DIR, { recursive: true });
    fs.writeFileSync(BITACORA_JSON_FILE, JSON.stringify(entries, null, 2), 'utf8');

    const docxBuf = generateBitacoraDocxBuffer(entries);
    fs.mkdirSync(path.dirname(DESKTOP_DOCX_FILE), { recursive: true });
    fs.writeFileSync(DESKTOP_DOCX_FILE, docxBuf);

    if (fs.existsSync(path.dirname(DESKTOP_WAPPY_FOLDER_DOCX))) {
      fs.writeFileSync(DESKTOP_WAPPY_FOLDER_DOCX, docxBuf);
    }

    log(`📄 Bitácora Word actualizada en el Escritorio: ${DESKTOP_DOCX_FILE} (${entries.length} registros).`);
  } catch (err) {
    log(`⚠️ Error actualizando bitácora Word en el Escritorio: ${err.message}`);
  }
}

async function main() {
  const args = parseArgs();
  const trigger = String(args.trigger || 'manual');
  const forceEmail = Boolean(args['force-email'] || args['test-email'] || args.force);
  const simulateError = Boolean(args['simulate-error']);
  const isManualRun = trigger === 'manual' || trigger === 'cron-test' || forceEmail;

  // Evitar ejecuciones simultáneas (lock de 4 minutos)
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockAge = Date.now() - fs.statSync(LOCK_FILE).mtimeMs;
      if (lockAge < 4 * 60 * 1000 && !isManualRun) {
        log(`⏳ Otra revisión está en curso (hace ${Math.round(lockAge / 1000)}s). Omitiendo duplicado (${trigger}).`);
        return;
      }
    }
    fs.mkdirSync(AGY_DIR, { recursive: true });
    fs.writeFileSync(LOCK_FILE, String(process.pid), 'utf8');
  } catch (_) {}

  try {
    // Unificación de ejecuciones automáticas (boot, wake, schedule, cron):
    // Evitar enviar múltiples correos en la mañana cuando coinciden el encendido del Mac (boot),
    // LaunchAgent (schedule) y crontab (cron). Si ya se completó una prueba exitosa con correo en los últimos 90 minutos, omitir.
    if (!isManualRun && fs.existsSync(STATE_FILE)) {
      try {
        const lastState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        const elapsedMs = Date.now() - (lastState.timestamp || 0);
        if (lastState.allHealthyNow && lastState.emailSent && elapsedMs < 90 * 60 * 1000) {
          log(
            `ℹ️ Reporte unificado ya fue ejecutado y enviado hace ${Math.round(elapsedMs / 60000)} min (trigger previo: ${lastState.trigger}). Omitiendo duplicado (${trigger}) para no enviar correos repetidos.`
          );
          return;
        }
      } catch (_) {}
    }

    const { wappyUrl, apiKey } = resolveCredentials();
    if (!apiKey) {
      log('❌ No se encontró API Key de WAPPY en ~/.gemini/antigravity/wappy-keys.json.');
      return;
    }

    log(`🔍 Iniciando pruebas de conexión y funcionales E2E (trigger=${trigger}) hacia ${wappyUrl}...`);
    const online = await waitForInternetConnection(wappyUrl, 45000);
    if (!online) {
      log('⚠️ Sin conexión a internet tras esperar 45s (el equipo puede estar sin red Wi-Fi).');
      return;
    }

    // Si acaba de encender el equipo (boot), dar 15s de cortesía para que Antigravity.app y el daemon Push SSE terminen de iniciar
    if (trigger === 'boot') {
      await new Promise((r) => setTimeout(r, 15000));
    }

    // ── FASE 1: REVISIÓN DE CONECTIVIDAD Y AUTO-RECONEXIÓN ───────────────────
    const initAg = await checkAntigravity(wappyUrl, apiKey);
    const userId = initAg.userId || '';
    const initNb = await checkNotebookLM(wappyUrl, apiKey);
    const initFlow = await checkGoogleFlow(wappyUrl, apiKey, userId);

    if (simulateError) {
      initAg.ok = false;
      initAg.detail = 'Simulación de desconexión para prueba de reconexión y alerta por correo.';
    }

    const initialResults = {
      antigravity: initAg,
      notebooklm: initNb,
      googleflow: initFlow,
    };

    log(
      `📊 Estado inicial conectividad -> Antigravity: ${initAg.ok ? 'OK' : 'FALLO'} | NotebookLM: ${initNb.ok ? 'OK' : 'FALLO'} | Google Flow: ${initFlow.ok ? 'OK' : 'FALLO'}`
    );

    const hadInitialErrors = !initAg.ok || !initNb.ok || !initFlow.ok;
    const finalResults = {
      antigravity: { ...initAg },
      notebooklm: { ...initNb },
      googleflow: { ...initFlow },
    };

    // Si hay fallas de conectividad, ejecutar protocolo de auto-reconexión antes de las pruebas funcionales
    if (!initAg.ok) {
      finalResults.antigravity = await reconnectAntigravity(wappyUrl, apiKey);
      log(`🔄 Resultado reconexión Antigravity: ${finalResults.antigravity.ok ? 'RECONECTADO' : 'SIGUE CON FALLO'}`);
    }

    if (!initNb.ok || !initFlow.ok) {
      await refreshGoogleSessionFromLocalChrome(wappyUrl, apiKey, userId);
      if (!initNb.ok) {
        finalResults.notebooklm = await checkNotebookLM(wappyUrl, apiKey);
        log(`🔄 Resultado reconexión NotebookLM: ${finalResults.notebooklm.ok ? 'RECONECTADO' : 'SIGUE CON FALLO'}`);
      }
      if (!initFlow.ok) {
        finalResults.googleflow = await checkGoogleFlow(wappyUrl, apiKey, userId);
        log(`🔄 Resultado reconexión Google Flow: ${finalResults.googleflow.ok ? 'RECONECTADO' : 'SIGUE CON FALLO'}`);
      }
    }

    if (!finalResults.notebooklm.ok && fs.existsSync(DAEMON_SCRIPT)) {
      log('🚀 Lanzando conector local de NotebookLM para recuperar sesión...');
      try {
        spawn(process.execPath, [DAEMON_SCRIPT, '--notebooklm', `--token=${apiKey}`, `--url=${wappyUrl}`], {
          detached: true,
          stdio: 'ignore',
        }).unref();
        await new Promise((r) => setTimeout(r, 12000));
        finalResults.notebooklm = await checkNotebookLM(wappyUrl, apiKey);
      } catch (_) {}
    }

    if (!finalResults.googleflow.ok && fs.existsSync(DAEMON_SCRIPT)) {
      log('🚀 Lanzando conector local de Google Flow para recuperar sesión...');
      try {
        spawn(process.execPath, [DAEMON_SCRIPT, '--googleflow', `--token=${apiKey}`, `--url=${wappyUrl}`], {
          detached: true,
          stdio: 'ignore',
        }).unref();
        await new Promise((r) => setTimeout(r, 12000));
        finalResults.googleflow = await checkGoogleFlow(wappyUrl, apiKey, userId);
      } catch (_) {}
    }

    // ── FASE 2: PRUEBAS FUNCIONALES E2E REALES (PREGUNTA ANTIGRAVITY + CUADERNO NOTEBOOKLM + IMAGEN FLOW) ──
    const functionalResults = {
      antigravity: null,
      notebooklm: null,
      googleflow: null,
    };

    if (finalResults.antigravity.ok) {
      functionalResults.antigravity = await runFunctionalAntigravityQuestion(wappyUrl, apiKey);
      if (!functionalResults.antigravity.ok) {
        finalResults.antigravity.ok = false;
        finalResults.antigravity.detail += ` | Fallo prueba funcional: ${functionalResults.antigravity.detail}`;
      }
    }

    if (finalResults.notebooklm.ok) {
      functionalResults.notebooklm = await runFunctionalNotebookLMQuestion(
        wappyUrl,
        apiKey,
        finalResults.notebooklm.notebooks || []
      );
      if (!functionalResults.notebooklm.ok) {
        finalResults.notebooklm.ok = false;
        finalResults.notebooklm.detail += ` | Fallo prueba funcional: ${functionalResults.notebooklm.detail}`;
      }
    }

    if (finalResults.googleflow.ok) {
      functionalResults.googleflow = await runFunctionalFlowImageGeneration(wappyUrl, apiKey);
      if (!functionalResults.googleflow.ok) {
        finalResults.googleflow.ok = false;
        finalResults.googleflow.detail += ` | Fallo prueba funcional: ${functionalResults.googleflow.detail}`;
      }
    }

    const allHealthyNow =
      Boolean(finalResults.antigravity.ok) &&
      Boolean(finalResults.notebooklm.ok) &&
      Boolean(finalResults.googleflow.ok);

    // ── FASE 3: ACTUALIZAR BITÁCORA WORD EN EL ESCRITORIO Y ENVIAR 1 ÚNICO CORREO UNIFICADO AL FINAL ──
    updateWordBitacora({
      trigger,
      initialResults,
      finalResults,
      functionalResults,
      hadInitialErrors,
      allHealthyNow,
    });

    if (process.platform === 'darwin') {
      try {
        const notifTitle = allHealthyNow
          ? '🟢 WAPPY IA — Prueba E2E 3/3 OK'
          : '🚨 WAPPY IA — Alerta en Prueba E2E';
        const notifMsg = `Antigravity: ${finalResults.antigravity.ok ? 'OK' : 'FALLO'} | NotebookLM: ${finalResults.notebooklm.ok ? 'OK' : 'FALLO'} | Flow Imagen: ${finalResults.googleflow.ok ? 'OK' : 'FALLO'}`;
        execFileSync(
          '/usr/bin/osascript',
          ['-e', `display notification "${notifMsg}" with title "${notifTitle}" sound name "Glass"`],
          { timeout: 4000 }
        );
      } catch (_) {}
    }

    const isScheduledCut = ['schedule', 'cron', 'boot', 'manual', 'cron-test'].includes(trigger);
    let emailSent = false;
    if (hadInitialErrors || !allHealthyNow || forceEmail || isScheduledCut) {
      emailSent = await sendHealthEmail(wappyUrl, apiKey, {
        trigger,
        initialResults,
        finalResults,
        functionalResults,
        hadInitialErrors,
        allHealthyNow,
      });
    }

    // Guardar estado final (con emailSent=true para evitar correos repetidos en la misma ventana de 90 min)
    try {
      fs.writeFileSync(
        STATE_FILE,
        JSON.stringify(
          {
            timestamp: Date.now(),
            isoDate: new Date().toISOString(),
            trigger,
            hadInitialErrors,
            allHealthyNow,
            emailSent,
            initialResults,
            finalResults,
            functionalResults,
          },
          null,
          2
        ),
        'utf8'
      );
    } catch (_) {}
  } finally {
    try {
      if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
    } catch (_) {}
  }
}

main().catch((err) => {
  log(`❌ Error fatal en HealthCheck: ${err.message}`);
  try {
    if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
  } catch (_) {}
  process.exit(1);
});
