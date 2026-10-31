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
const { spawn, execFileSync } = require('child_process');

const HOME_DIR = os.homedir();
const AGY_DIR = path.join(HOME_DIR, '.gemini', 'antigravity');
const CONFIG_DIR = path.join(HOME_DIR, '.gemini', 'config');
const KEYS_FILE = path.join(AGY_DIR, 'wappy-keys.json');
const DAEMON_SCRIPT = path.join(AGY_DIR, 'wappy-push-daemon.js');
const LOG_FILE = path.join(AGY_DIR, 'wappy-healthcheck.log');
const STATE_FILE = path.join(AGY_DIR, 'wappy-healthcheck-state.json');
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

function resolveCredentials() {
  const candidates = [];
  const add = (url, key) => {
    const cleanKey = String(key || '').trim();
    if (!cleanKey || !cleanKey.startsWith('wpy_')) return;
    const cleanUrl = String(url || 'https://wappy.club').trim().replace(/\/$/, '').replace(/\/api\/mcp-bridge.*$/, '') || 'https://wappy.club';
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

  return candidates[0] || { wappyUrl: 'https://wappy.club', apiKey: '' };
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
  const statusRes = await httpJson(`${wappyUrl}/api/studio/antigravity/status`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    timeoutMs: 12000,
  });

  const userId = statusRes.data?.userId || statusRes.data?.bridge?.userId || '';
  const serverConnected = Boolean(
    statusRes.ok &&
      (statusRes.data?.bridge?.connected ||
        statusRes.data?.bridge?.userDaemonConnected ||
        Number(statusRes.data?.bridge?.userListeners) > 0)
  );

  if (workerLocal && serverConnected && lsLocal) {
    return {
      ok: true,
      userId,
      detail: `Daemon Push SSE activo (${statusRes.data?.bridge?.userListeners || 1} listener en vivo) y motor Antigravity local operativo.`,
    };
  }

  const reasons = [];
  if (!workerLocal) reasons.push('proceso local wappy-push-daemon no estaba en ejecución');
  if (!serverConnected) reasons.push('servidor WAPPY no detectaba stream Push SSE conectado');
  if (!lsLocal) reasons.push('aplicación local Antigravity (language_server) estaba cerrada');

  return {
    ok: false,
    userId,
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
 * 2. PRUEBA DE GOOGLE NOTEBOOKLM
 */
async function checkNotebookLM(wappyUrl, apiKey) {
  // Intentar primero el endpoint directo de herramienta MCP (notebook_list) que valida en vivo contra Google NotebookLM
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
      detail: `Sesión privada de Google NotebookLM activa y verificada en vivo (${mcpRes.data.result.length} cuadernos detectados).`,
    };
  }

  // Intentar endpoint /api/notebooklm/test (si acepta API Key)
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
    detail: `Fallo en conexión con Google NotebookLM: ${errReason}`,
  };
}

/**
 * 3. PRUEBA DE GOOGLE FLOW STUDIO (VEO / IMAGEN)
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
  // 1. Intentar /api/googleflow/test en el servidor WAPPY
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

  // 2. Respaldo directo: obtener la sesión guardada en WAPPY y validar contra https://flow.google.com/
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
 * 5. ENVÍO DE CORREO A grupowappy@gmail.com CON EL RESULTADO / SOLICITUD
 */
async function sendHealthEmail(wappyUrl, apiKey, { trigger, initialResults, finalResults, hadInitialErrors, allHealthyNow }) {
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
    ? `✅ [WAPPY IA] Conectores Reconectados Automáticamente tras Falla (${trigger})`
    : `🟢 [WAPPY IA] Verificación de Conectores OK (Antigravity, NotebookLM y Flow)`;

  const renderRow = (label, initRes, finRes) => {
    const wasOk = initRes?.ok;
    const isOk = finRes?.ok;
    const badge = isOk
      ? wasOk
        ? '<span style="background:#dcfce7;color:#166534;padding:4px 10px;border-radius:999px;font-weight:700;font-size:12px;">🟢 CONECTADO</span>'
        : '<span style="background:#fef9c3;color:#854d0e;padding:4px 10px;border-radius:999px;font-weight:700;font-size:12px;">🔄 RECONECTADO AUTOMÁTICAMENTE</span>'
      : '<span style="background:#fee2e2;color:#991b1b;padding:4px 10px;border-radius:999px;font-weight:700;font-size:12px;">🔴 ERROR — REQUIERE RECONEXIÓN</span>';

    return `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${label}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;">${badge}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">
          ${finRes?.detail || ''}${!wasOk && isOk ? `<br/><small style="color:#64748b;">Falla inicial corregida: ${initRes?.detail || ''}</small>` : ''}
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
        Resultado de la auditoría automática de conectores en tu Mac (<b>Disparador:</b> <code>${trigger}</code> &bull; <b>Fecha:</b> ${nowStr}):
      </p>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
        <thead>
          <tr style="background:#0f172a;color:#ffffff;text-align:left;font-size:12px;text-transform:uppercase;">
            <th style="padding:10px 12px;">Módulo / Conector</th>
            <th style="padding:10px 12px;">Estado Final</th>
            <th style="padding:10px 12px;">Diagnóstico Técnico</th>
          </tr>
        </thead>
        <tbody>
          ${renderRow('⚡ Google Antigravity', initialResults.antigravity, finalResults.antigravity)}
          ${renderRow('📓 Google NotebookLM', initialResults.notebooklm, finalResults.notebooklm)}
          ${renderRow('🎬 Google Flow Studio', initialResults.googleflow, finalResults.googleflow)}
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
    log(`📧 Correo enviado exitosamente a ${ALERT_EMAIL} (${subject}).`);
    return true;
  } else {
    log(`❌ Error enviando correo a ${ALERT_EMAIL}: ${emailRes.data?.error || emailRes.error || `HTTP ${emailRes.status}`}`);
    return false;
  }
}

async function main() {
  const args = parseArgs();
  const trigger = String(args.trigger || 'manual');
  const forceEmail = Boolean(args['force-email'] || args['test-email']);
  const simulateError = Boolean(args['simulate-error']);

  // Evitar ejecuciones simultáneas (lock de 4 minutos)
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockAge = Date.now() - fs.statSync(LOCK_FILE).mtimeMs;
      if (lockAge < 4 * 60 * 1000 && !forceEmail) {
        log(`⏳ Otra revisión está en curso (hace ${Math.round(lockAge / 1000)}s). Omitiendo duplicado (${trigger}).`);
        return;
      }
    }
    fs.mkdirSync(AGY_DIR, { recursive: true });
    fs.writeFileSync(LOCK_FILE, String(process.pid), 'utf8');
  } catch (_) {}

  try {
    // Si el disparador es 'wake' (despertar de reposo), verificar si ya se ejecutó hace menos de 15 minutos sin errores
    if (trigger === 'wake' && !forceEmail && fs.existsSync(STATE_FILE)) {
      try {
        const lastState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        if (lastState.allHealthyNow && Date.now() - (lastState.timestamp || 0) < 15 * 60 * 1000) {
          log('ℹ️ Revisión reciente (<15 min) ya estaba 100% saludable tras despertar. Omitiendo.');
          return;
        }
      } catch (_) {}
    }

    const { wappyUrl, apiKey } = resolveCredentials();
    if (!apiKey) {
      log('❌ No se encontró API Key de WAPPY en ~/.gemini/antigravity/wappy-keys.json.');
      return;
    }

    log(`🔍 Iniciando pruebas de conexión (trigger=${trigger}) hacia ${wappyUrl}...`);
    const online = await waitForInternetConnection(wappyUrl, 45000);
    if (!online) {
      log('⚠️ Sin conexión a internet tras esperar 45s (el equipo puede estar sin red Wi-Fi).');
      return;
    }

    // Si acaba de encender el equipo (boot), dar 15s de cortesía para que Antigravity.app y el daemon Push SSE terminen de iniciar
    if (trigger === 'boot') {
      await new Promise((r) => setTimeout(r, 15000));
    }

    // 1. Revisión inicial de los 3 conectores
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
      `📊 Estado inicial -> Antigravity: ${initAg.ok ? 'OK' : 'FALLO'} | NotebookLM: ${initNb.ok ? 'OK' : 'FALLO'} | Google Flow: ${initFlow.ok ? 'OK' : 'FALLO'}`
    );

    const hadInitialErrors = !initAg.ok || !initNb.ok || !initFlow.ok;
    const finalResults = {
      antigravity: initAg,
      notebooklm: initNb,
      googleflow: initFlow,
    };

    // 2. Si hay fallas, ejecutar protocolo de auto-reconexión
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

    // Si después de intentar en modo headless sigue fallando NotebookLM o Flow, lanzar conector visible para que tome la sesión activa de Chrome
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

    const allHealthyNow =
      Boolean(finalResults.antigravity.ok) &&
      Boolean(finalResults.notebooklm.ok) &&
      Boolean(finalResults.googleflow.ok);

    // Guardar estado de la última revisión
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
            initialResults,
            finalResults,
          },
          null,
          2
        ),
        'utf8'
      );
    } catch (_) {}

    // Mostrar notificación nativa en macOS para visibilidad inmediata en pantalla
    if (process.platform === 'darwin') {
      try {
        const notifTitle = allHealthyNow ? '🟢 WAPPY IA — Conectores OK' : '🚨 WAPPY IA — Alerta Conectores';
        const notifMsg = `Antigravity: ${finalResults.antigravity.ok ? 'OK' : 'FALLO'} | NotebookLM: ${finalResults.notebooklm.ok ? 'OK' : 'FALLO'} | Flow: ${finalResults.googleflow.ok ? 'OK' : 'FALLO'}`;
        execFileSync('/usr/bin/osascript', [
          '-e',
          `display notification "${notifMsg}" with title "${notifTitle}" sound name "Glass"`,
        ], { timeout: 4000 });
      } catch (_) {}
    }

    // 3. Enviar correo a grupowappy@gmail.com siempre en cortes programados (7am, 2pm, 6pm, arranque) o si hubo errores
    const isScheduledCut = ['schedule', 'cron', 'boot', 'manual'].includes(trigger);
    if (hadInitialErrors || !allHealthyNow || forceEmail || isScheduledCut) {
      await sendHealthEmail(wappyUrl, apiKey, {
        trigger,
        initialResults,
        finalResults,
        hadInitialErrors,
        allHealthyNow,
      });
    } else {
      log('✅ Los 3 conectores (Antigravity, NotebookLM y Google Flow) están 100% operativos. Sin errores que reportar.');
    }
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
