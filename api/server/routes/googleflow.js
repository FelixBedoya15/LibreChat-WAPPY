const express = require('express');
const router = express.Router();
const GoogleFlowSession = require('~/models/GoogleFlowSession');
const { requireJwtAuth } = require('~/server/middleware');
const { logger } = require('~/config');

/**
 * Normaliza una cookie al formato estándar
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

  if (Array.isArray(input)) {
    return input.map(normalizeCookie).filter(Boolean);
  }

  if (typeof input === 'object' && Array.isArray(input.cookies)) {
    return input.cookies.map(normalizeCookie).filter(Boolean);
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseIncomingCookies(parsed);
      } catch (e) {
        logger.warn('[GoogleFlow] Error parseando JSON de cookies:', e.message);
      }
    }

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
 * Valida localmente la integridad de las cookies de Google
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
      reason: 'Falta __Secure-1PSID o __Secure-1PSIDTS — asegúrate de tener Google Flow / Labs abierto.',
    };
  }

  const sid = cookieMap.get('SID') || '';
  if (sid.length < 10) {
    return { success: false, reason: 'Cookie SID parece estar vacía o incompleta.' };
  }

  return { success: true };
}

/**
 * GET /api/googleflow/status
 * Retorna el estado de la conexión privada del usuario a Google Flow
 */
router.get('/status', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await GoogleFlowSession.findOne({ user: userId }).lean();

    if (!session) {
      return res.json({
        connected: false,
        message: 'Sin vincular. Conecta tu cuenta privada de Google Flow / Labs.',
      });
    }

    const email = session.email || req.user.email || 'Cuenta vinculada';
    const cookieCount = session.cookieCount || (session.cookies ? session.cookies.length : 0);
    const hasApiKey = Boolean(session.apiKey && session.apiKey.length > 5);
    const isValid = session.isValid ?? true;
    const lastTestedAt = session.lastTestedAt || session.updatedAt || null;

    return res.json({
      connected: true,
      email,
      cookieCount,
      hasApiKey,
      isValid,
      lastTestedAt,
      source: session.source || 'cli',
    });
  } catch (error) {
    logger.error('[GoogleFlow] Error consultando estado:', error);
    return res.status(500).json({ error: 'Error al consultar estado de Google Flow.' });
  }
});

/**
 * POST /api/googleflow/session
 * Guarda o actualiza las cookies o la API Key de Google Flow
 */
router.post('/session', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const rawInput = req.body?.cookies || req.body?.raw || req.body?.jsonString;
    const apiKey = (req.body?.apiKey || '').trim();
    const source = req.body?.source || (apiKey ? 'api_key' : 'manual');
    const clientEmail = req.body?.email || '';

    let cookies = [];
    if (rawInput) {
      cookies = parseIncomingCookies(rawInput);
    }

    if (cookies.length === 0 && !apiKey) {
      return res.status(400).json({
        error: 'Debes proporcionar las cookies de sesión de Google o una API Key de Google AI Studio.',
      });
    }

    let testResult = { success: true };
    if (cookies.length > 0) {
      testResult = validateCookiesLocally(cookies);
      if (!testResult.success && !apiKey) {
        return res.status(400).json({ error: testResult.reason });
      }
    }

    const effectiveEmail = clientEmail || userEmail || `${userId}@wappy.internal`;

    const updateData = {
      email: effectiveEmail,
      isValid: testResult.success,
      lastTestedAt: new Date(),
      source,
    };

    if (cookies.length > 0) {
      updateData.cookies = cookies;
      updateData.cookieCount = cookies.length;
    }

    if (apiKey) {
      updateData.apiKey = apiKey;
    }

    await GoogleFlowSession.findOneAndUpdate(
      { user: userId },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    logger.info(`[GoogleFlow] Sesión guardada para usuario ${userId} (Email: ${effectiveEmail})`);

    return res.json({
      success: true,
      message: '¡Sesión privada de Google Flow vinculada con éxito!',
      isValid: testResult.success,
      cookieCount: updateData.cookieCount || 0,
      hasApiKey: Boolean(updateData.apiKey),
    });
  } catch (error) {
    logger.error('[GoogleFlow] Error guardando sesión:', error);
    return res.status(500).json({ error: 'Error interno al guardar la sesión de Google Flow.' });
  }
});

/**
 * POST /api/googleflow/test
 * Prueba en vivo la validez de la sesión o la API Key
 */
router.post('/test', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await GoogleFlowSession.findOne({ user: userId });

    if (!session || ((!session.cookies || session.cookies.length === 0) && !session.apiKey)) {
      return res.status(404).json({
        success: false,
        reason: 'No tienes una sesión de Google Flow ni API Key configurada.',
      });
    }

    let isValid = true;
    let message = '✓ ¡Conexión con Google Flow verificada con éxito!';

    if (session.cookies && session.cookies.length > 0) {
      const cookieCheck = validateCookiesLocally(session.cookies);
      if (!cookieCheck.success && !session.apiKey) {
        isValid = false;
        message = cookieCheck.reason;
      }
    }

    session.isValid = isValid;
    session.lastTestedAt = new Date();
    await session.save();

    return res.json({
      success: isValid,
      message,
      lastTestedAt: session.lastTestedAt,
    });
  } catch (error) {
    logger.error('[GoogleFlow] Error probando sesión:', error);
    return res.status(500).json({ error: 'Error al probar sesión de Google Flow.' });
  }
});

/**
 * DELETE /api/googleflow/session
 * Desvincula la sesión de Google Flow del usuario
 */
router.delete('/session', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    await GoogleFlowSession.deleteOne({ user: userId });

    return res.json({
      success: true,
      message: 'Sesión privada de Google Flow desvinculada correctamente.',
    });
  } catch (error) {
    logger.error('[GoogleFlow] Error desvinculando sesión:', error);
    return res.status(500).json({ error: 'Error al desvincular sesión de Google Flow.' });
  }
});

/**
 * GET /api/googleflow/connect-script
 * Script autoejecutable de 1 comando para vincular la cuenta privada de Google Flow
 * de forma idéntica al conector de NotebookLM.
 */
router.get('/connect-script', (req, res) => {
  const token = String(req.query.token || '').trim();
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'app.wappy.club';
  const serverOrigin = `${proto}://${host}`;

  const script = `#!/usr/bin/env node
/**
 * WAPPY IA — Conector Privado 1-Clic para Google Flow / Creative Studio (Veo & Imagen)
 * Abre una ventana segura de Google Flow en tu computador, detecta tu sesión privada
 * y la vincula automáticamente con tu cuenta de WAPPY.
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
  const res = await fetch(\`\${SERVER_ORIGIN}/api/googleflow/session\`, {
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
  console.log('\\n🎨 WAPPY IA — Vinculación Privada de Google Flow / Studio (Veo & Imagen)');
  console.log('----------------------------------------------------------------------');

  const browserBin = findBrowserExecutable();
  if (!browserBin) {
    console.error('❌ No se encontró Google Chrome, Brave o Edge instalado en este equipo.');
    process.exit(1);
  }

  const profileDir = path.join(os.homedir(), '.wappy-googleflow-auth');
  const debugPort = 9230;

  console.log('🌐 Abriendo ventana segura de Google Labs / Flow en tu computador...');
  console.log('👉 Si aún no has iniciado sesión en esa ventana, inicia sesión con tu cuenta de Google.');
  console.log('⏳ Esperando a que cargue la plataforma creativa de Google...\\n');

  const child = spawn(
    browserBin,
    [
      \`--remote-debugging-port=\${debugPort}\`,
      \`--user-data-dir=\${profileDir}\`,
      '--no-first-run',
      '--no-default-browser-check',
      '--new-window',
      'https://labs.google/fx',
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
      const flowPage = pages.find(
        (p) =>
          p.webSocketDebuggerUrl &&
          p.url &&
          (p.url.includes('labs.google') || p.url.includes('flow.google') || p.url.includes('google.com')) &&
          !p.url.includes('accounts.google.com') &&
          !p.url.includes('/signin')
      );
      if (!flowPage) continue;

      await new Promise((r) => setTimeout(r, 2000));
      const cdpRes = await cdpSend(flowPage.webSocketDebuggerUrl, 'Network.getAllCookies');
      const allCookies = cdpRes?.result?.cookies || [];
      const googleCookies = allCookies.filter((c) => c.domain && c.domain.includes('google.com'));
      const names = new Set(googleCookies.map((c) => c.name));

      if (names.has('SID') && (names.has('__Secure-1PSID') || names.has('__Secure-1PSIDTS'))) {
        console.log('✨ Sesión de Google detectada. Verificando y vinculando con Google Flow en WAPPY...');
        const result = await uploadCookies(googleCookies);
        if (result.ok) {
          console.log('✅ ' + (result.data.message || '¡Tu cuenta privada de Google Flow quedó vinculada con éxito!'));
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

module.exports = router;
