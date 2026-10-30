const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const NotebookSession = require('~/models/NotebookSession');
const { requireJwtAuth } = require('~/server/middleware');
const { logger } = require('~/config');
const paths = require('~/config/paths');

// Directorio base de perfiles de NotebookLM
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const LOCAL_PROFILES_DIR = path.join(REPO_ROOT, 'config', 'notebooklm', 'profiles');
const SYSTEM_PROFILES_DIR = process.env.NOTEBOOKLM_HOME
  ? path.join(process.env.NOTEBOOKLM_HOME, 'profiles')
  : '/root/.notebooklm/profiles';

const OUTPUT_MEDIA_DIR =
  paths.imageOutput || path.resolve(__dirname, '../../../client/public/images');
const MEDIA_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

/**
 * Limpia automáticamente de /images/ los recursos descargados de Google Flow (flow_*)
 * y Google NotebookLM (nlm_*) que tengan más de 30 días de antigüedad.
 */
async function cleanupExpiredFlowAndNotebookMedia() {
  try {
    if (!fs.existsSync(OUTPUT_MEDIA_DIR)) return;
    const files = await fs.promises.readdir(OUTPUT_MEDIA_DIR);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      if (!file.startsWith('flow_') && !file.startsWith('nlm_')) continue;
      const fullPath = path.join(OUTPUT_MEDIA_DIR, file);
      try {
        const stat = await fs.promises.stat(fullPath);
        if (stat.isFile() && now - stat.mtimeMs > MEDIA_RETENTION_MS) {
          await fs.promises.unlink(fullPath);
          deletedCount++;
        }
      } catch (_) {}
    }

    if (deletedCount > 0) {
      logger.info(
        `[MediaCleanup] Se eliminaron ${deletedCount} archivos de Flow/NotebookLM con más de 30 días de antigüedad.`
      );
    }
  } catch (err) {
    logger.warn('[MediaCleanup] Error ejecutando limpieza de 30 días:', err.message);
  }
}

// Ejecutar limpieza al iniciar y cada 12 horas
setTimeout(() => {
  cleanupExpiredFlowAndNotebookMedia();
}, 15000);
setInterval(() => {
  cleanupExpiredFlowAndNotebookMedia();
}, 12 * 60 * 60 * 1000);

/**
 * Resuelve la extensión y prefijo para guardar un artefacto de NotebookLM en /images/
 */
function resolveNotebookArtifactFileMeta(artifactId, type = '', format = '', contentType = '') {
  const safeId = String(artifactId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const lowerType = String(type || '').toLowerCase();
  const lowerFmt = String(format || '').toLowerCase();
  const lowerCt = String(contentType || '').toLowerCase();

  let prefix = 'nlm_media';
  let ext = 'bin';

  if (lowerType.includes('infographic') || lowerType.includes('infografia') || lowerCt.includes('image/')) {
    prefix = 'nlm_infographic';
    ext = lowerCt.includes('jpeg') || lowerCt.includes('jpg') ? 'jpg' : 'png';
  } else if (lowerType.includes('video') || lowerCt.includes('video/')) {
    prefix = 'nlm_video';
    ext = 'mp4';
  } else if (lowerType.includes('audio') || lowerType.includes('podcast') || lowerCt.includes('audio/')) {
    prefix = 'nlm_audio';
    ext = lowerCt.includes('wav') ? 'wav' : lowerCt.includes('mpeg') || lowerCt.includes('mp3') ? 'mp3' : 'mp4';
  } else if (lowerType.includes('slide') || lowerFmt === 'pptx' || lowerCt.includes('presentation')) {
    prefix = 'nlm_slides';
    ext = lowerFmt === 'pdf' || lowerCt.includes('pdf') ? 'pdf' : 'pptx';
  } else if (lowerFmt === 'pdf' || lowerCt.includes('pdf')) {
    prefix = 'nlm_doc';
    ext = 'pdf';
  } else if (lowerFmt) {
    ext = lowerFmt.replace(/[^a-z0-9]/g, '') || 'dat';
  }

  const filename = `${prefix}_${safeId}.${ext}`;
  const fullPath = path.join(OUTPUT_MEDIA_DIR, filename);
  const publicUrl = `/images/${filename}`;
  return { filename, fullPath, publicUrl, ext };
}

/**
 * Busca si el artefacto de NotebookLM ya fue descargado y guardado en /images/
 */
function findCachedNotebookArtifact(artifactId, type = '', format = '') {
  try {
    if (!fs.existsSync(OUTPUT_MEDIA_DIR)) return null;
    const safeId = String(artifactId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeId) return null;
    const files = fs.readdirSync(OUTPUT_MEDIA_DIR);
    const match = files.find((f) => f.startsWith('nlm_') && f.includes(`_${safeId}.`));
    if (match) {
      const fullPath = path.join(OUTPUT_MEDIA_DIR, match);
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && stat.size > 512) {
        return {
          filename: match,
          fullPath,
          publicUrl: `/images/${match}`,
          size: stat.size,
        };
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Fusiona dos listas de cookies de Google de la misma cuenta (mismo SID),
 * preservando cookies rotadas (__Secure-1PSIDTS, SIDCC) y cookies OSID específicas por dominio
 * (notebooklm.google.com, notebook.google.com, flow.google.com, myaccount.google.com).
 */
function mergeGoogleCookiesByDomain(incoming = [], existing = []) {
  if (!Array.isArray(existing) || existing.length === 0) return incoming;
  if (!Array.isArray(incoming) || incoming.length === 0) return existing;

  const getSid = (list) =>
    list.find((c) => c && c.name === 'SID' && c.value)?.value ||
    list.find((c) => c && c.name === '__Secure-1PSID' && c.value)?.value ||
    '';

  const incSid = getSid(incoming);
  const exSid = getSid(existing);
  if (incSid && exSid && incSid !== exSid) {
    return incoming;
  }

  const byKey = new Map();
  for (const c of existing) {
    if (!c || !c.name || !c.value) continue;
    const key = `${c.name}@@${String(c.domain || '.google.com').toLowerCase()}`;
    byKey.set(key, c);
  }
  for (const c of incoming) {
    if (!c || !c.name || !c.value) continue;
    const key = `${c.name}@@${String(c.domain || '.google.com').toLowerCase()}`;
    const prev = byKey.get(key);
    if (prev) {
      if (
        ['HSID', 'SSID', 'SID', '__Secure-1PSID', '__Secure-3PSID', 'APISID', 'SAPISID', 'LSID', '__Host-1PLSID', '__Host-3PLSID', 'OSID', '__Secure-OSID'].includes(c.name) &&
        typeof c.expires !== 'number' &&
        typeof prev.expires === 'number'
      ) {
        continue;
      }
      // Evitar regresión de contador en cookies rotativas (SIDCC / __Secure-1PSIDTS): conservar siempre la de mayor expires
      if (
        ['__Secure-1PSIDTS', '__Secure-3PSIDTS', 'SIDCC', '__Secure-1PSIDCC', '__Secure-3PSIDCC'].includes(c.name) &&
        typeof prev.expires === 'number' &&
        (typeof c.expires !== 'number' || prev.expires > c.expires)
      ) {
        continue;
      }
      const mergedCookie = { ...prev, ...c };
      if (typeof c.expires !== 'number' && typeof prev.expires === 'number') {
        mergedCookie.expires = prev.expires;
      }
      byKey.set(key, mergedCookie);
    } else {
      byKey.set(key, c);
    }
  }
  return Array.from(byKey.values());
}

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
 * POST /api/notebooklm/internal/session/:userId
 * Endpoint interno para que notebooklm-mcp persista de vuelta en MongoDB
 * las cookies rotadas (__Secure-1PSIDTS, SIDCC, OSID) tras ejecutar RotateCookies.
 */
router.post('/internal/session/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || userId.startsWith('{{')) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    const incomingCookies = parseIncomingCookies(req.body?.cookies || []);
    if (incomingCookies.length === 0) {
      return res.status(400).json({ error: 'Sin cookies para actualizar' });
    }

    const existingNb = await NotebookSession.findOne({ user: userId }).lean().catch(() => null);
    const mergedNb = mergeGoogleCookiesByDomain(incomingCookies, existingNb?.cookies || []);
    const effectiveEmail = req.body?.email || existingNb?.email || `${userId}@wappy.internal`;

    await NotebookSession.findOneAndUpdate(
      { user: userId },
      {
        email: effectiveEmail,
        cookies: mergedNb,
        cookieCount: mergedNb.length,
        isValid: true,
        lastTestedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    try {
      const GoogleFlowSession = require('~/models/GoogleFlowSession');
      const existingFlow = await GoogleFlowSession.findOne({ user: userId }).lean().catch(() => null);
      const mergedFlow = mergeGoogleCookiesByDomain(mergedNb, existingFlow?.cookies || []);
      await GoogleFlowSession.findOneAndUpdate(
        { user: userId },
        {
          email: existingFlow?.email || effectiveEmail,
          cookies: mergedFlow,
          cookieCount: mergedFlow.length,
          isValid: true,
          lastTestedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (_) {}

    return res.json({ success: true, cookieCount: mergedNb.length });
  } catch (err) {
    logger.error('[NotebookLM Internal] Error updating rotated session:', err);
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
 * Normaliza una cookie al formato estándar requerido por notebooklm-py (preservando expires)
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

  const normalized = {
    name,
    value,
    domain: String(raw.domain || '.google.com'),
    path: String(raw.path || '/'),
    secure: Boolean(raw.secure ?? true),
    httpOnly: Boolean(raw.httpOnly ?? true),
    sameSite,
  };
  const exp = raw.expires ?? raw.expirationDate;
  if (typeof exp === 'number' && Number.isFinite(exp) && exp > 0) {
    normalized.expires = exp;
  }
  return normalized;
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

    // Fusionar con cookies existentes de la misma cuenta (para no perder OSID de flow.google.com ni __Secure-1PSIDTS rotados)
    const existingNb = await NotebookSession.findOne({ user: userId }).lean().catch(() => null);
    let mergedCookies = mergeGoogleCookiesByDomain(cookies, existingNb?.cookies || []);

    // 1. Guardar inicialmente en MongoDB antes de llamar a notebooklm-mcp (así si notebooklm-mcp rota y hace POST /internal/session/:userId, no lo pisamos)
    await NotebookSession.findOneAndUpdate(
      { user: userId },
      {
        email: effectiveEmail,
        cookies: mergedCookies,
        cookieCount: mergedCookies.length,
        isValid: true,
        lastTestedAt: new Date(),
        source,
      },
      { upsert: true, new: true }
    );

    try {
      const GoogleFlowSession = require('~/models/GoogleFlowSession');
      const existingFlow = await GoogleFlowSession.findOne({ user: userId }).lean().catch(() => null);
      const mergedFlow = mergeGoogleCookiesByDomain(mergedCookies, existingFlow?.cookies || []);
      await GoogleFlowSession.findOneAndUpdate(
        { user: userId },
        {
          email: effectiveEmail,
          cookies: mergedFlow,
          cookieCount: mergedFlow.length,
          isValid: true,
          lastTestedAt: new Date(),
          source: source || 'extension',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (_) {}

    // 2. Guardar en disco
    const storageData = {
      cookies: mergedCookies,
      origins: [],
      notebooklm: {
        version: 1,
        account: {
          authuser: 0,
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

    // 3. Probar conexión en vivo contra Google y rotar/sincronizar en caliente con notebooklm-mcp
    let testResult = validateCookiesLocally(mergedCookies);
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
            'x-notebooklm-auth': JSON.stringify(mergedCookies),
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

    await NotebookSession.findOneAndUpdate(
      { user: userId },
      {
        isValid: testResult.success,
        lastTestedAt: new Date(),
      }
    );

    const latestNb = await NotebookSession.findOne({ user: userId }).lean().catch(() => null);
    const finalCount = latestNb?.cookieCount || mergedCookies.length;

    return res.json({
      success: true,
      email: effectiveEmail,
      cookieCount: finalCount,
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
          },
          body: JSON.stringify({
            name: 'notebook_list',
            arguments: {},
            user_id: String(userId),
            user_email: String(effectiveEmail),
          }),
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

  if (token === 'wappy_daemon_autoupdate') {
    const updateScript = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const daemonUrl = ${JSON.stringify(serverOrigin)} + '/api/mcp-bridge/antigravity/daemon.js';
fetch(daemonUrl)
  .then((r) => r.text())
  .then((code) => {
    if (!code || !code.includes('startSseWorker')) process.exit(0);
    const agyDir = path.join(os.homedir(), '.gemini', 'antigravity');
    fs.mkdirSync(agyDir, { recursive: true });
    const dest = path.join(agyDir, 'wappy-push-daemon.js');
    fs.writeFileSync(dest, code, { encoding: 'utf8', mode: 0o755 });
    const listenerDest = path.join(agyDir, 'wappy-tenshi-listener.js');
    fs.writeFileSync(listenerDest, code, { encoding: 'utf8', mode: 0o755 });
    spawnSync(process.execPath, [dest, '--install'], { stdio: 'ignore' });
    process.exit(0);
  })
  .catch(() => process.exit(0));
`;
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    return res.status(200).send(updateScript);
  }

  const script = `#!/usr/bin/env node
/**
 * WAPPY IA — Conector Local Multiplataforma (Windows / Mac / Linux)
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const http = require('http');
const crypto = require('crypto');
const { spawn, execSync } = require('child_process');

const SERVER_ORIGIN = ${JSON.stringify(serverOrigin)};
const USER_TOKEN = ${JSON.stringify(token)};

if (!USER_TOKEN) {
  console.error('❌ Error: Falta el token de usuario en el comando.');
  process.exit(1);
}

function findBrowserExecutable() {
  const platform = os.platform();
  const home = os.homedir();
  const candidates = [];
  if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      path.join(home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      path.join(home, 'Applications/Brave Browser.app/Contents/MacOS/Brave Browser'),
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      path.join(home, 'Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'),
      '/Applications/Arc.app/Contents/MacOS/Arc',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    );
  } else if (platform === 'win32') {
    const pf = process.env['PROGRAMFILES'] || 'C:\\\\Program Files';
    const pf86 = process.env['PROGRAMFILES(X86)'] || 'C:\\\\Program Files (x86)';
    const local = process.env['LOCALAPPDATA'] || path.join(home, 'AppData\\\\Local');
    candidates.push(
      path.join(pf, 'Google\\\\Chrome\\\\Application\\\\chrome.exe'),
      path.join(pf86, 'Google\\\\Chrome\\\\Application\\\\chrome.exe'),
      path.join(local, 'Google\\\\Chrome\\\\Application\\\\chrome.exe'),
      path.join(pf, 'BraveSoftware\\\\Brave-Browser\\\\Application\\\\brave.exe'),
      path.join(pf86, 'BraveSoftware\\\\Brave-Browser\\\\Application\\\\brave.exe'),
      path.join(local, 'BraveSoftware\\\\Brave-Browser\\\\Application\\\\brave.exe'),
      path.join(pf86, 'Microsoft\\\\Edge\\\\Application\\\\msedge.exe'),
      path.join(pf, 'Microsoft\\\\Edge\\\\Application\\\\msedge.exe'),
      path.join(local, 'Microsoft\\\\Edge\\\\Application\\\\msedge.exe')
    );
    for (const exe of ['chrome.exe', 'msedge.exe', 'brave.exe']) {
      for (const hive of ['HKLM', 'HKCU']) {
        try {
          const out = execSync(\`reg query "\${hive}\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\App Paths\\\\\${exe}" /ve\`, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' });
          const m = out.match(/REG_SZ\\s+(.+\\.exe)/i);
          if (m && m[1]) candidates.push(m[1].trim().replace(/^"|"$/g, ''));
        } catch (_) {}
      }
    }
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
    if (bin && fs.existsSync(bin)) return bin;
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
    srv.on('error', () => resolve(9229 + Math.floor(Math.random() * 500)));
  });
}

function cleanupStaleProfile(profileDir) {
  try {
    fs.mkdirSync(profileDir, { recursive: true });
    const lp = path.join(profileDir, 'SingletonLock');
    try { fs.rmSync(lp, { force: true }); } catch (_) {}
  } catch (_) {}
}

function launchBrowserVisible(browserBin, profileDir, debugPort, targetUrl) {
  const args = [
    \`--remote-debugging-port=\${debugPort}\`,
    '--remote-allow-origins=*',
    \`--user-data-dir=\${profileDir}\`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1080,780',
    \`--app=\${targetUrl}\`,
  ];
  if (os.platform() === 'win32') {
    try {
      const cmdLine = \`start "" "\${browserBin}" --remote-debugging-port=\${debugPort} --remote-allow-origins=* --user-data-dir="\${profileDir}" --no-first-run --no-default-browser-check --window-size=1080,780 --app=\${targetUrl}\`;
      const c = spawn('cmd.exe', ['/d', '/s', '/c', \`"\${cmdLine}"\`], {
        windowsVerbatimArguments: true,
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      });
      c.unref();
      return c;
    } catch (_) {}
  }
  return spawn(browserBin, args, { stdio: 'ignore' });
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
  console.log('\\n🔒 WAPPY IA — Conector de Módulo Documental');
  console.log('--------------------------------------------------------');

  const browserBin = findBrowserExecutable();
  if (!browserBin) {
    console.error('❌ No se encontró Google Chrome, Brave o Edge instalado en este equipo.');
    process.exit(1);
  }

  let profileDir = path.join(os.homedir(), '.wappy-notebooklm-auth');
  cleanupStaleProfile(profileDir);
  let debugPort = await getFreePort();

  console.log('🌐 Abriendo ventana en primer plano en tu computador (' + path.basename(browserBin) + ')...');
  console.log('⏳ Detectando tu sesión (si ya iniciaste sesión antes, se cerrará sola en 3 segundos)...\\n');

  const targetUrl = 'https://notebook.google.com/';
  const child = launchBrowserVisible(browserBin, profileDir, debugPort, targetUrl);

  const maxWaitMs = 180000;
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const listRes = await fetch(\`http://127.0.0.1:\${debugPort}/json/list\`);
      const pages = await listRes.json();
      if (!Array.isArray(pages)) continue;
      const nbPage = pages.find(
        (p) =>
          p.webSocketDebuggerUrl &&
          p.url &&
          (p.url.includes('notebook.google.com') || p.url.includes('notebooklm.google.com')) &&
          !p.url.includes('accounts.google.com') &&
          !p.url.includes('/trynow')
      );
      if (!nbPage) continue;

      let allCookies = [];
      try {
        const stRes = await cdpSend(nbPage.webSocketDebuggerUrl, 'Storage.getCookies');
        allCookies = stRes?.result?.cookies || [];
      } catch (_) {}
      if (!allCookies.length) {
        const cdpRes = await cdpSend(nbPage.webSocketDebuggerUrl, 'Network.getAllCookies');
        allCookies = cdpRes?.result?.cookies || [];
      }

      const googleCookies = allCookies.filter((c) => c.domain && c.domain.includes('google.com'));
      const names = new Set(googleCookies.map((c) => c.name));

      if (names.has('SID') && (names.has('__Secure-1PSID') || names.has('__Secure-1PSIDTS'))) {
        try {
          await cdpSend(nbPage.webSocketDebuggerUrl, 'Target.createTarget', {
            url: 'https://flow.google.com/',
            background: true,
          });
          await new Promise((r) => setTimeout(r, 2500));
          const stRes2 = await cdpSend(nbPage.webSocketDebuggerUrl, 'Storage.getCookies').catch(() => null);
          const refreshed = stRes2?.result?.cookies || [];
          if (refreshed.length > allCookies.length) {
            allCookies = refreshed;
          }
        } catch (_) {}

        const finalGoogleCookies = allCookies.filter((c) => c.domain && c.domain.includes('google.com'));
        const osidCookie = finalGoogleCookies.find((c) => c.name === 'OSID');
        if (osidCookie) {
          const hasNotebookDomain = finalGoogleCookies.some(
            (c) => c.name === 'OSID' && c.domain && c.domain.includes('notebook.google.com')
          );
          if (!hasNotebookDomain) {
            finalGoogleCookies.push({ ...osidCookie, domain: '.notebook.google.com' });
          }
        }
        console.log('✨ Sesión detectada. Verificando y guardando en tu perfil de WAPPY...');
        const result = await uploadCookies(finalGoogleCookies);
        if (result.ok) {
          console.log('✅ ' + (result.data.message || '¡Módulo conectado con éxito!'));
          try { if (child) child.kill(); } catch (_) {}
          process.exit(0);
        }
      }
    } catch (_) {
      // Sigue esperando mientras el usuario inicia sesión
    }
  }

  console.error('⏰ Tiempo de espera agotado. Vuelve a ejecutar el comando cuando estés listo.');
  try { if (child) child.kill(); } catch (_) {}
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
    const cachedFile = findCachedNotebookArtifact(artifactId, type, format);

    if (statusOnly === '1' && cachedFile) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).json({
        ready: true,
        status: 'completed',
        publicUrl: cachedFile.publicUrl,
        filename: cachedFile.filename,
        cached: true,
      });
    }

    if (cachedFile && statusOnly !== '1') {
      if (forceDownload === '1') {
        res.setHeader('Content-Disposition', `attachment; filename="${cachedFile.filename}"`);
      }
      return res.sendFile(cachedFile.fullPath);
    }

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
      try {
        const parsedStatus = JSON.parse(bodyText);
        if (parsedStatus?.ready === true || parsedStatus?.status === 'completed') {
          // Descargar y persistir en segundo plano en /images/ (retención de 30 días) igual que Flow
          const dlQs = new URLSearchParams({
            notebook_id: notebookId,
            artifact_id: artifactId,
          });
          if (type) dlQs.set('type', type);
          if (format) dlQs.set('format', format);
          if (userId) dlQs.set('user_id', userId);

          try {
            const bgRes = await fetch(`${notebooklmUrl}/api/download-artifact?${dlQs.toString()}`, {
              headers: userId ? { 'x-user-id': userId } : {},
            });
            if (bgRes.ok && bgRes.status === 200) {
              const ct = bgRes.headers.get('content-type') || '';
              const meta = resolveNotebookArtifactFileMeta(artifactId, type, format, ct);
              await fs.promises.mkdir(OUTPUT_MEDIA_DIR, { recursive: true });
              const ab = await bgRes.arrayBuffer();
              if (ab.byteLength > 512) {
                await fs.promises.writeFile(meta.fullPath, Buffer.from(ab));
                parsedStatus.publicUrl = meta.publicUrl;
                parsedStatus.filename = meta.filename;
                logger.info(
                  `[NotebookLM] Recurso guardado en servidor (30 días): ${meta.publicUrl} (${ab.byteLength} bytes)`
                );
              }
            }
          } catch (bgErr) {
            logger.debug('[NotebookLM] Aviso guardando copia local en status_only:', bgErr.message);
          }
          return res.status(upstream.status).json(parsedStatus);
        }
      } catch (_) {}
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

    // Si es descarga completa (HTTP 200 sin Range parcial), guardar en /images/ (retención 30 días) y servir desde disco
    if (upstream.status === 200 && !req.headers.range) {
      const ct = upstream.headers.get('content-type') || '';
      const meta = resolveNotebookArtifactFileMeta(artifactId, type, format, ct);
      const arrayBuffer = await upstream.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.byteLength > 512) {
        try {
          await fs.promises.mkdir(OUTPUT_MEDIA_DIR, { recursive: true });
          await fs.promises.writeFile(meta.fullPath, buffer);
          logger.info(
            `[NotebookLM] Recurso guardado en servidor (30 días): ${meta.publicUrl} (${buffer.byteLength} bytes)`
          );
          if (forceDownload === '1') {
            res.setHeader('Content-Disposition', `attachment; filename="${meta.filename}"`);
          }
          return res.sendFile(meta.fullPath);
        } catch (writeErr) {
          logger.warn('[NotebookLM] No se pudo guardar en /images/:', writeErr.message);
        }
      }
      res.status(200);
      return res.send(buffer);
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
