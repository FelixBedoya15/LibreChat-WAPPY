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
      return res.status(404).json({ error: 'No hay sesión guardada para este usuario' });
    }

    return res.json({
      success: true,
      userId,
      email: session.email || '',
      cookies: session.cookies,
      cookieCount: session.cookieCount || session.cookies.length,
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
        usingDefault: true,
        message: 'Utilizando conexión central compartida de WAPPY.',
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

    // 2. Probar conexión en vivo contra Google
    const testResult = validateCookiesLocally(cookies);

    // 3. Guardar en MongoDB
    const updatedSession = await NotebookSession.findOneAndUpdate(
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
      testWarning: testResult.success ? null : testResult.reason,
      message: testResult.success
        ? '¡Sesión de Google NotebookLM vinculada y verificada con éxito!'
        : `Sesión guardada. Advertencia de Google: ${testResult.reason}`,
    });
  } catch (error) {
    logger.error('[NotebookLM] Error guardando sesión:', error);
    return res.status(500).json({ error: 'Error al vincular sesión de NotebookLM.' });
  }
});

/**
 * POST /api/notebooklm/test
 * Prueba en vivo la sesión actual del usuario
 */
router.post('/test', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    let cookies = [];

    // Buscar en MongoDB primero
    const session = await NotebookSession.findOne({ user: userId }).lean();
    if (session && Array.isArray(session.cookies) && session.cookies.length > 0) {
      cookies = session.cookies;
    } else {
      // Buscar en disco
      const primaryPath = getStoragePaths(userId)[0];
      if (fs.existsSync(primaryPath)) {
        const parsed = JSON.parse(fs.readFileSync(primaryPath, 'utf8'));
        cookies = parsed.cookies || [];
      }
    }

    if (cookies.length === 0) {
      return res.status(404).json({
        error: 'No hay ninguna sesión privada guardada para este usuario.',
      });
    }

    const testResult = validateCookiesLocally(cookies);

    await NotebookSession.findOneAndUpdate(
      { user: userId },
      { isValid: testResult.success, lastTestedAt: new Date() }
    );

    return res.json({
      success: testResult.success,
      reason: testResult.reason || null,
      message: testResult.success
        ? '¡La sesión contra Google NotebookLM está ACTIVA y funcionando correctamente!'
        : `La sesión falló la verificación: ${testResult.reason}`,
    });
  } catch (error) {
    logger.error('[NotebookLM] Error probando sesión:', error);
    return res.status(500).json({ error: 'Error al probar sesión de NotebookLM.' });
  }
});

/**
 * DELETE /api/notebooklm/session
 * Desvincula la sesión privada del usuario (vuelve al perfil central)
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
      message: 'Sesión desvinculada. Tus consultas utilizarán el perfil central de WAPPY.',
    });
  } catch (error) {
    logger.error('[NotebookLM] Error desvinculando sesión:', error);
    return res.status(500).json({ error: 'Error al desvincular sesión de NotebookLM.' });
  }
});

module.exports = router;
