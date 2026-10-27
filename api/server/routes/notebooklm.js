const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const NotebookSession = require('~/models/NotebookSession');
const { requireJwtAuth } = require('~/server/middleware');
const { logger } = require('~/config');

// Directorio base de perfiles de NotebookLM
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const LOCAL_PROFILES_DIR = path.join(REPO_ROOT, 'config', 'notebooklm', 'profiles');
const SYSTEM_PROFILES_DIR = process.env.NOTEBOOKLM_HOME
  ? path.join(process.env.NOTEBOOKLM_HOME, 'profiles')
  : '/root/.notebooklm/profiles';

/**
 * GET /api/notebooklm/internal/session/:userId
 * Endpoint interno para que el contenedor notebooklm-mcp pueda obtener la sesión
 * del usuario directamente desde MongoDB sin depender de montajes de disco.
 */
router.get('/internal/session/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || userId.startsWith('{{')) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    const session = await NotebookSession.findOne({ user: userId }).lean();
    if (!session || !session.cookies || session.cookies.length === 0) {
      return res.status(404).json({
        error: 'El usuario no tiene una sesión privada de Google NotebookLM vinculada.',
      });
    }

    return res.json({
      success: true,
      userId,
      email: session.email || '',
      cookies: session.cookies,
      cookieCount: session.cookieCount || session.cookies.length,
      updatedAt: session.updatedAt ? new Date(session.updatedAt).toISOString() : null,
    });
  } catch (err) {
    logger.error('[NotebookLM Internal] Error fetching session:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Obtiene el nombre seguro del perfil según el ID del usuario
 */
function getSafeProfileName(userId) {
  if (!userId) return 'default';
  const cleanId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '');
  return `user_${cleanId}`;
}

/**
 * Obtiene la ruta al archivo storage_state.json para el usuario
 */
function getStoragePaths(userId) {
  const safeProfile = getSafeProfileName(userId);
  const paths = [path.join(LOCAL_PROFILES_DIR, safeProfile, 'storage_state.json')];

  if (fs.existsSync(SYSTEM_PROFILES_DIR)) {
    paths.push(path.join(SYSTEM_PROFILES_DIR, safeProfile, 'storage_state.json'));
  }

  return paths;
}

/**
 * Normaliza una cookie al formato estándar requerido por notebooklm-py
 */
function normalizeCookie(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim();
  const value = String(raw.value || '').trim();
  if (!name || !value) return null;

  let sameSite = String(raw.sameSite || 'Lax');
  const lower = sameSite.toLowerCase();
  if (lower === 'no_restriction' || lower === 'unspecified') {
    sameSite = 'Lax';
  } else if (lower === 'none') {
    sameSite = 'None';
  } else if (lower === 'strict') {
    sameSite = 'Strict';
  } else {
    sameSite = 'Lax';
  }

  return {
    name,
    value,
    domain: String(raw.domain || '.google.com'),
    path: String(raw.path || '/'),
    secure: Boolean(raw.secure ?? true),
    httpOnly: Boolean(raw.httpOnly ?? true),
    sameSite,
  };
}

/**
 * Convierte diferentes formatos de entrada (JSON, lista, header string) en lista de cookies
 */
function parseIncomingCookies(input) {
  if (!input) return [];

  // Si ya es un array
  if (Array.isArray(input)) {
    return input.map(normalizeCookie).filter(Boolean);
  }

  // Si es un objeto contenedor { cookies: [...] }
  if (typeof input === 'object' && Array.isArray(input.cookies)) {
    return input.cookies.map(normalizeCookie).filter(Boolean);
  }

  // Si es string
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseIncomingCookies(parsed);
      } catch (e) {
        logger.warn('[NotebookLM] Error al parsear JSON de cookies:', e.message);
      }
    }

    // Formato de encabezado HTTP "name=val; name2=val2"
    const cookies = [];
    const pairs = trimmed.split(';');
    for (const pair of pairs) {
      if (pair.includes('=')) {
        const [name, ...rest] = pair.split('=');
        const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
        const cleanName = name.trim();
        if (cleanName && val) {
          cookies.push(
            normalizeCookie({
              name: cleanName,
              value: val,
              domain: '.google.com',
              path: '/',
              secure: true,
              httpOnly: true,
              sameSite: 'Lax',
            })
          );
        }
      }
    }
    return cookies.filter(Boolean);
  }

  return [];
}

/**
 * Valida localmente que las cookies críticas estén presentes y no vacías.
 * Google NotebookLM siempre redirige la primera solicitud HTTP sin importar
 * si las cookies son válidas (requiere manejo completo de redirects y JS).
 * La validación real la hace notebooklm-py con Playwright al usarlas.
 */
function validateCookiesLocally(cookies) {
  if (!cookies || cookies.length === 0) {
    return { success: false, reason: 'Lista de cookies vacía.' };
  }

  const cookieMap = new Map(cookies.map((c) => [c.name, c.value]));
  const hasPsid = cookieMap.has('__Secure-1PSID');
  const hasPsidTs = cookieMap.has('__Secure-1PSIDTS');
  const hasSid = cookieMap.has('SID');

  if (!hasSid) {
    return { success: false, reason: 'Falta la cookie SID — inicia sesión en Google primero.' };
  }

  if (!hasPsid && !hasPsidTs) {
    return {
      success: false,
      reason: 'Falta __Secure-1PSID o __Secure-1PSIDTS — asegúrate de tener NotebookLM abierto en Chrome.',
    };
  }

  // Verificar que los valores críticos no estén vacíos
  const sid = cookieMap.get('SID') || '';
  if (sid.length < 10) {
    return { success: false, reason: 'Cookie SID parece estar vacía o demasiado corta.' };
  }

  return { success: true };
}

/**
 * GET /api/notebooklm/status
 * Retorna el estado de la conexión privada del usuario a NotebookLM
 */
router.get('/status', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await NotebookSession.findOne({ user: userId }).lean();
    const primaryStoragePath = getStoragePaths(userId)[0];

    const fileExists = fs.existsSync(primaryStoragePath);
    let diskCookieCount = 0;
    let diskEmail = '';

    if (fileExists) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(primaryStoragePath, 'utf8'));
        diskCookieCount = Array.isArray(fileContent.cookies) ? fileContent.cookies.length : 0;
        diskEmail = fileContent.notebooklm?.account?.email || '';
      } catch (err) {
        logger.warn('[NotebookLM] Error leyendo archivo de sesión en disco:', err.message);
      }
    }

    if (!session && !fileExists) {
      return res.json({
        connected: false,
        usingDefault: false,
        message: 'Sin vincular. Conecta tu cuenta privada de Google NotebookLM.',
      });
    }

    const email = session?.email || diskEmail || req.user.email || 'Cuenta conectada';
    const cookieCount = session?.cookieCount || diskCookieCount;
    const isValid = session?.isValid ?? true;
    const lastTestedAt = session?.lastTestedAt || session?.updatedAt || null;

    return res.json({
      connected: true,
      usingDefault: false,
      email,
      cookieCount,
      isValid,
      lastTestedAt,
      profileName: getSafeProfileName(userId),
    });
  } catch (error) {
    logger.error('[NotebookLM] Error consultando estado:', error);
    return res.status(500).json({ error: 'Error al consultar estado de NotebookLM.' });
  }
});

/**
 * POST /api/notebooklm/session
 * Guarda o actualiza las cookies de NotebookLM del usuario
 */
router.post('/session', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const rawInput = req.body?.cookies || req.body?.raw || req.body?.jsonString || req.body;
    const source = req.body?.source || 'extension';
    const clientEmail = req.body?.email || '';

    const cookies = parseIncomingCookies(rawInput);

    if (cookies.length === 0) {
      return res.status(400).json({
        error: 'No se detectaron cookies válidas en el formato proporcionado.',
      });
    }

    // Verificar cookies indispensables
    const cookieNames = new Set(cookies.map((c) => c.name));
    const hasPsid = cookieNames.has('__Secure-1PSID');
    const hasSid = cookieNames.has('SID');
    const hasPsidts = cookieNames.has('__Secure-1PSIDTS');

    if (!hasPsid && !hasSid && !hasPsidts) {
      return res.status(400).json({
        error:
          'Faltan las cookies críticas de Google (__Secure-1PSID, SID o __Secure-1PSIDTS). Asegúrate de tener la sesión iniciada en Google.',
      });
    }

    const effectiveEmail = clientEmail || userEmail || `${userId}@wappy.internal`;

    // 1. Guardar en disco
    const storageData = {
      cookies,
      origins: [],
      notebooklm: {
        version: 1,
        account: {
          authuser: 0,
          email: effectiveEmail,
        },
      },
    };

    const targetPaths = getStoragePaths(userId);
    for (const targetPath of targetPaths) {
      try {
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(targetPath, JSON.stringify(storageData, null, 2), { mode: 0o600 });
        logger.info(`[NotebookLM] Sesión guardada en disco: ${targetPath}`);
      } catch (err) {
        logger.warn(`[NotebookLM] No se pudo escribir en ${targetPath}: ${err.message}`);
      }
    }

    // 2. Probar conexión en vivo contra Google y sincronizar en caliente con notebooklm-mcp
    let testResult = validateCookiesLocally(cookies);
    let notebooksCount = null;
    if (testResult.success) {
      try {
        const notebooklmUrl = process.env.NOTEBOOKLM_URL || 'http://notebooklm-mcp:9420';
        const mcpRes = await fetch(`${notebooklmUrl}/api/direct-tool`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(userId),
            'x-user-email': String(effectiveEmail),
            'x-notebooklm-auth': JSON.stringify(cookies),
          },
          body: JSON.stringify({ name: 'notebook_list', arguments: {} }),
        });
        const mcpData = await mcpRes.json().catch(() => ({}));
        if (!mcpRes.ok || mcpData?.error) {
          testResult = {
            success: false,
            reason: mcpData?.error || `Error de sesión en Google NotebookLM (HTTP ${mcpRes.status})`,
          };
        } else if (Array.isArray(mcpData?.result)) {
          notebooksCount = mcpData.result.length;
        }
      } catch (liveErr) {
        logger.warn(`[NotebookLM] Advertencia sincronizando con notebooklm-mcp: ${liveErr.message}`);
      }
    }

    // 3. Guardar en MongoDB
    await NotebookSession.findOneAndUpdate(
      { user: userId },
      {
        email: effectiveEmail,
        cookies,
        cookieCount: cookies.length,
        isValid: testResult.success,
        lastTestedAt: new Date(),
        source,
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      email: effectiveEmail,
      cookieCount: cookies.length,
      isValid: testResult.success,
      notebooksCount,
      testWarning: testResult.success ? null : testResult.reason,
      message: testResult.success
        ? `¡Sesión privada de Google NotebookLM vinculada y verificada con éxito!${notebooksCount !== null ? ` (${notebooksCount} cuadernos detectados)` : ''}`
        : `Sesión guardada, pero Google rechazó las cookies: ${testResult.reason}`,
    });
  } catch (error) {
    logger.error('[NotebookLM] Error guardando sesión:', error);
    return res.status(500).json({ error: 'Error al vincular sesión de NotebookLM.' });
  }
});

/**
 * POST /api/notebooklm/test
 * Prueba en vivo la sesión actual del usuario contra el contenedor notebooklm-mcp
 */
router.post('/test', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    let cookies = [];
    let effectiveEmail = req.user.email || '';

    // Buscar en MongoDB primero
    const session = await NotebookSession.findOne({ user: userId }).lean();
    if (session && Array.isArray(session.cookies) && session.cookies.length > 0) {
      cookies = session.cookies;
      effectiveEmail = session.email || effectiveEmail;
    } else {
      // Buscar en disco
      const primaryPath = getStoragePaths(userId)[0];
      if (fs.existsSync(primaryPath)) {
        const parsed = JSON.parse(fs.readFileSync(primaryPath, 'utf8'));
        cookies = parsed.cookies || [];
        effectiveEmail = parsed.notebooklm?.account?.email || effectiveEmail;
      }
    }

    if (cookies.length === 0) {
      return res.status(404).json({
        error: 'No hay ninguna sesión privada guardada para este usuario.',
      });
    }

    let testResult = validateCookiesLocally(cookies);
    let notebooksCount = null;

    if (testResult.success) {
      try {
        const notebooklmUrl = process.env.NOTEBOOKLM_URL || 'http://notebooklm-mcp:9420';
        const mcpRes = await fetch(`${notebooklmUrl}/api/direct-tool`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(userId),
            'x-user-email': String(effectiveEmail),
            'x-notebooklm-auth': JSON.stringify(cookies),
          },
          body: JSON.stringify({ name: 'notebook_list', arguments: {} }),
        });
        const mcpData = await mcpRes.json().catch(() => ({}));
        if (!mcpRes.ok || mcpData?.error) {
          testResult = {
            success: false,
            reason: mcpData?.error || `La sesión de Google NotebookLM ha expirado (HTTP ${mcpRes.status}).`,
          };
        } else if (Array.isArray(mcpData?.result)) {
          notebooksCount = mcpData.result.length;
        }
      } catch (liveErr) {
        testResult = {
          success: false,
          reason: `No se pudo contactar al motor NotebookLM MCP: ${liveErr.message}`,
        };
      }
    }

    await NotebookSession.findOneAndUpdate(
      { user: userId },
      { isValid: testResult.success, lastTestedAt: new Date() }
    );

    return res.json({
      success: testResult.success,
      notebooksCount,
      reason: testResult.reason || null,
      message: testResult.success
        ? `¡Tu sesión privada contra Google NotebookLM está ACTIVA y funcionando!${notebooksCount !== null ? ` Se detectaron ${notebooksCount} cuadernos disponibles.` : ''}`
        : `La sesión falló la verificación en vivo: ${testResult.reason}`,
    });
  } catch (error) {
    logger.error('[NotebookLM] Error probando sesión:', error);
    return res.status(500).json({ error: 'Error al probar sesión de NotebookLM.' });
  }
});

/**
 * DELETE /api/notebooklm/session
 * Desvincula la sesión privada del usuario
 */
router.delete('/session', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Eliminar de disco
    const targetPaths = getStoragePaths(userId);
    for (const targetPath of targetPaths) {
      try {
        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
          logger.info(`[NotebookLM] Archivo de sesión eliminado: ${targetPath}`);
        }
      } catch (err) {
        logger.warn(`[NotebookLM] Error eliminando ${targetPath}: ${err.message}`);
      }
    }

    // Eliminar de MongoDB
    await NotebookSession.deleteOne({ user: userId });

    return res.json({
      success: true,
      message: 'Sesión privada de Google NotebookLM desvinculada correctamente.',
    });
  } catch (error) {
    logger.error('[NotebookLM] Error desvinculando sesión:', error);
    return res.status(500).json({ error: 'Error al desvincular sesión de NotebookLM.' });
  }
});

/**
 * GET /api/notebooklm/connect-script
 * Script autoejecutable de 1 comando (PC / Mac / Antigravity) para vincular la cuenta
 * privada de Google NotebookLM del usuario sin instalar extensiones manualmente.
 */
router.get('/connect-script', (req, res) => {
  const token = String(req.query.token || '').trim();
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'app.wappy.club';
  const serverOrigin = `${proto}://${host}`;

  const script = `#!/usr/bin/env node
/**
 * WAPPY IA — Conector Privado 1-Clic para Google NotebookLM (Por Usuario)
 * Abre una ventana segura de Google en tu computador, detecta tu sesión privada
 * de NotebookLM y la vincula automáticamente con tu cuenta de WAPPY.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');

const SERVER_ORIGIN = ${JSON.stringify(serverOrigin)};
const USER_TOKEN = ${JSON.stringify(token)};

if (!USER_TOKEN) {
  console.error('❌ Error: Falta el token de usuario en el comando.');
  process.exit(1);
}

function findBrowserExecutable() {
  const platform = os.platform();
  const candidates = [];
  if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    );
  } else if (platform === 'win32') {
    const pf = process.env['PROGRAMFILES'] || 'C:\\\\Program Files';
    const pf86 = process.env['PROGRAMFILES(X86)'] || 'C:\\\\Program Files (x86)';
    const local = process.env['LOCALAPPDATA'] || '';
    candidates.push(
      path.join(pf, 'Google\\\\Chrome\\\\Application\\\\chrome.exe'),
      path.join(pf86, 'Google\\\\Chrome\\\\Application\\\\chrome.exe'),
      path.join(local, 'Google\\\\Chrome\\\\Application\\\\chrome.exe'),
      path.join(pf, 'BraveSoftware\\\\Brave-Browser\\\\Application\\\\brave.exe'),
      path.join(pf86, 'Microsoft\\\\Edge\\\\Application\\\\msedge.exe'),
      path.join(pf, 'Microsoft\\\\Edge\\\\Application\\\\msedge.exe')
    );
  } else {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/brave-browser',
      '/usr/bin/microsoft-edge'
    );
  }
  for (const bin of candidates) {
    if (fs.existsSync(bin)) return bin;
  }
  return null;
}

function cdpSend(wsUrl, method, params = {}) {
  if (typeof WebSocket !== 'undefined') {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const timer = setTimeout(() => {
        try { ws.close(); } catch (_) {}
        reject(new Error('Timeout CDP'));
      }, 8000);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method, params }));
      };
      ws.onmessage = (event) => {
        clearTimeout(timer);
        try { ws.close(); } catch (_) {}
        try {
          resolve(JSON.parse(event.data));
        } catch (e) {
          reject(e);
        }
      };
      ws.onerror = (err) => {
        clearTimeout(timer);
        try { ws.close(); } catch (_) {}
        reject(err);
      };
    });
  }

  let WSClient;
  try { WSClient = require('ws'); } catch (_) {}
  if (WSClient) {
    return new Promise((resolve, reject) => {
      const ws = new WSClient(wsUrl);
      const timer = setTimeout(() => {
        try { ws.terminate(); } catch (_) {}
        reject(new Error('Timeout CDP'));
      }, 8000);
      ws.on('open', () => {
        ws.send(JSON.stringify({ id: 1, method, params }));
      });
      ws.on('message', (data) => {
        clearTimeout(timer);
        try { ws.close(); } catch (_) {}
        try {
          resolve(JSON.parse(data.toString('utf8')));
        } catch (e) {
          reject(e);
        }
      });
      ws.on('error', (err) => {
        clearTimeout(timer);
        try { ws.terminate(); } catch (_) {}
        reject(err);
      });
    });
  }

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

      let bodyChunks = [];
      socket.on('data', (chunk) => {
        bodyChunks.push(chunk);
        const combined = Buffer.concat(bodyChunks);
        // Find JSON end
        const str = combined.toString('utf8');
        const firstBrace = str.indexOf('{');
        const lastBrace = str.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            const parsedJson = JSON.parse(str.slice(firstBrace, lastBrace + 1));
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

async function uploadCookies(cookies, email = '') {
  const res = await fetch(\`\${SERVER_ORIGIN}/api/notebooklm/session\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: \`Bearer \${USER_TOKEN}\`,
    },
    body: JSON.stringify({ cookies, email, source: 'cli-auto' }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.success && data.isValid !== false, data };
}

(async () => {
  console.log('\\n🔒 WAPPY IA — Vinculación Privada de Google NotebookLM');
  console.log('--------------------------------------------------------');

  const browserBin = findBrowserExecutable();
  if (!browserBin) {
    console.error('❌ No se encontró Google Chrome, Brave o Edge instalado en este equipo.');
    process.exit(1);
  }

  const profileDir = path.join(os.homedir(), '.wappy-notebooklm-auth');
  const debugPort = 9229;

  console.log('🌐 Abriendo ventana segura de Google NotebookLM en tu computador...');
  console.log('👉 Si aún no has iniciado sesión en esa ventana, inicia sesión con tu cuenta de Google.');
  console.log('⏳ Esperando a que cargue tu panel de NotebookLM (se vinculará automáticamente)...\\n');

  const child = spawn(
    browserBin,
    [
      \`--remote-debugging-port=\${debugPort}\`,
      \`--user-data-dir=\${profileDir}\`,
      '--no-first-run',
      '--no-default-browser-check',
      '--new-window',
      'https://notebooklm.google.com',
    ],
    { detached: false, stdio: 'ignore' }
  );

  const maxWaitMs = 180000;
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2500));
    try {
      const listRes = await fetch(\`http://127.0.0.1:\${debugPort}/json/list\`);
      const pages = await listRes.json();
      const nbPage = pages.find(
        (p) =>
          p.webSocketDebuggerUrl &&
          p.url &&
          (p.url.includes('notebook.google.com') || p.url.includes('notebooklm.google.com')) &&
          !p.url.includes('accounts.google.com') &&
          !p.url.includes('/trynow')
      );
      if (!nbPage) continue;

      await new Promise((r) => setTimeout(r, 2000));
      const cdpRes = await cdpSend(nbPage.webSocketDebuggerUrl, 'Network.getAllCookies');
      const allCookies = cdpRes?.result?.cookies || [];
      const googleCookies = allCookies.filter((c) => c.domain && c.domain.includes('google.com'));
      const names = new Set(googleCookies.map((c) => c.name));

      if (names.has('SID') && names.has('OSID') && (names.has('__Secure-1PSID') || names.has('__Secure-1PSIDTS'))) {
        console.log('✨ Sesión de Google NotebookLM detectada. Verificando y guardando en tu perfil privado...');
        const result = await uploadCookies(googleCookies);
        if (result.ok) {
          console.log('✅ ' + (result.data.message || '¡Tu cuenta privada de Google NotebookLM quedó vinculada con éxito!'));
          try { child.kill(); } catch (_) {}
          process.exit(0);
        }
      }
    } catch (_) {
      // Sigue esperando mientras el usuario inicia sesión
    }
  }

  console.error('⏰ Tiempo de espera agotado. Vuelve a ejecutar el comando cuando estés listo.');
  try { child.kill(); } catch (_) {}
  process.exit(1);
})();
`;

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  return res.status(200).send(script);
});

/**
 * GET /api/notebooklm/download/:notebookId/:artifactId
 * Proxy de reproducción inline (con soporte HTTP Range 206 para Safari/iOS) y descarga en 1 clic
 * para artefactos de NotebookLM Studio (videos MP4, podcasts MP4, infografías PNG, presentaciones PDF/PPTX, etc.).
 */
router.get('/download/:notebookId/:artifactId', async (req, res) => {
  try {
    const { Readable } = require('stream');
    const { notebookId, artifactId } = req.params;
    const type = String(req.query.type || '').trim();
    const format = String(req.query.format || '').trim();
    const statusOnly = String(req.query.status_only || '').trim();
    const forceDownload = String(req.query.download || '').trim();
    const userId = String(req.query.userId || req.user?.id || '').trim();

    const notebooklmUrl = process.env.NOTEBOOKLM_URL || 'http://notebooklm-mcp:9420';
    const qs = new URLSearchParams({
      notebook_id: notebookId,
      artifact_id: artifactId,
    });
    if (type) qs.set('type', type);
    if (format) qs.set('format', format);
    if (statusOnly === '1') qs.set('status_only', '1');
    if (forceDownload === '1') qs.set('download', '1');
    if (userId) qs.set('user_id', userId);

    const reqHeaders = {};
    if (userId) reqHeaders['x-user-id'] = userId;
    if (req.headers.range && statusOnly !== '1') {
      reqHeaders['Range'] = req.headers.range;
    }

    const upstream = await fetch(`${notebooklmUrl}/api/download-artifact?${qs.toString()}`, {
      headers: reqHeaders,
    });

    if (statusOnly === '1') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const bodyText = await upstream.text().catch(() => '{"ready":false,"status":"in_progress"}');
      return res.status(upstream.status).send(bodyText);
    }

    if (upstream.status === 202) {
      const acceptHeader = String(req.headers.accept || '');
      if (acceptHeader.includes('text/html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="refresh" content="8" />
  <title>Renderizando en Google NotebookLM Studio | WAPPY IA</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#090d16; color:#f8fafc; font-family:system-ui,-apple-system,sans-serif; padding:24px; }
    .card { max-width:480px; width:100%; background:#111827; border:1px solid rgba(20,184,166,0.35); border-radius:20px; padding:32px; text-align:center; box-shadow:0 20px 50px rgba(0,0,0,0.5); }
    .spinner { width:48px; height:48px; border:4px solid rgba(20,184,166,0.2); border-top-color:#14b8a6; border-radius:50%; margin:0 auto 20px; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    h1 { font-size:18px; margin:0 0 10px; color:#5eead4; }
    p { font-size:14px; line-height:1.5; color:#94a3b8; margin:0 0 16px; }
    .badge { display:inline-block; padding:6px 12px; border-radius:999px; background:rgba(20,184,166,0.12); color:#2dd4bf; font-size:12px; font-weight:700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h1>🎬 Google NotebookLM Studio está renderizando tu recurso</h1>
    <p>Los videos y podcasts narrados por IA toman entre 3 y 7 minutos en generarse. Esta ventana se actualizará automáticamente cada 8 segundos y reproducirá el archivo apenas esté listo.</p>
    <span class="badge">Actualizando automáticamente...</span>
  </div>
</body>
</html>`);
      }
      const waitBody = await upstream.text().catch(() => '{"ready":false,"status":"in_progress"}');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(202).send(waitBody);
    }

    if (!upstream.ok) {
      const errBody = await upstream.text().catch(() => '');
      return res.status(upstream.status).send(errBody || 'No se pudo descargar el artefacto de NotebookLM.');
    }

    const forwardHeaders = [
      'content-type',
      'content-disposition',
      'accept-ranges',
      'content-range',
      'content-length',
      'etag',
      'last-modified',
    ];
    for (const h of forwardHeaders) {
      const val = upstream.headers.get(h);
      if (val) {
        res.setHeader(h, val);
      }
    }
    if (!res.getHeader('accept-ranges')) {
      res.setHeader('Accept-Ranges', 'bytes');
    }

    res.status(upstream.status);
    if (upstream.body) {
      return Readable.fromWeb(upstream.body).pipe(res);
    }
    const arrayBuffer = await upstream.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    logger.error('[NotebookLM Download] Error descargando artefacto:', error);
    return res.status(500).json({ error: 'Error al descargar el artefacto de NotebookLM.' });
  }
});

module.exports = router;
