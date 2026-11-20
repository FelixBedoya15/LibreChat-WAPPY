const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const router = express.Router();
const NotebookSession = require('~/models/NotebookSession');
const CompanyInfo = require('~/models/CompanyInfo');
const { requireApiKeyOrJwt: requireJwtAuth } = require('~/server/middleware/requireApiKeyAuth');
const { logger } = require('~/config');
const paths = require('~/config/paths');

/**
 * Resuelve el _id de la empresa solicitada (si pertenece al usuario) o de la empresa activa
 */
async function resolveActiveCompanyId(userId, explicitCompanyId = null) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return null;
  }
  if (explicitCompanyId && mongoose.Types.ObjectId.isValid(String(explicitCompanyId))) {
    const requested = await CompanyInfo.findOne({ user: userId, _id: explicitCompanyId })
      .select('_id')
      .lean()
      .catch(() => null);
    if (requested?._id) {
      return requested._id;
    }
  }
  const active = await CompanyInfo.findOne({ user: userId, isActive: true })
    .select('_id')
    .lean()
    .catch(() => null);
  return active?._id || null;
}

/**
 * Busca la sesión EXACTA para (userId, companyId) sin fallback entre empresas ni hacia companyId: null.
 */
async function findExactSessionForCompany(Model, userId, companyId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return null;
  }
  if (companyId) {
    return Model.findOne({ user: userId, companyId })
      .sort({ isValid: -1, updatedAt: -1 })
      .lean()
      .catch(() => null);
  }
  return Model.findOne({
    user: userId,
    $or: [{ companyId: null }, { companyId: { $exists: false } }],
  })
    .sort({ isValid: -1, updatedAt: -1 })
    .lean()
    .catch(() => null);
}

/**
 * Busca la sesión para la empresa activa con fallback seguro ordenado por validez y recencia.
 * Jamás permite que una sesión expirada de companyId: null sobrescriba o contamine a activeCompId ni viceversa.
 */
async function findSessionForCompany(Model, userId, companyId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return null;
  }
  if (companyId) {
    const doc = await Model.findOne({ user: userId, companyId })
      .sort({ isValid: -1, updatedAt: -1 })
      .lean()
      .catch(() => null);
    if (doc) return doc;
  }
  const legacyDoc = await Model.findOne({
    user: userId,
    $or: [{ companyId: null }, { companyId: { $exists: false } }],
  })
    .sort({ isValid: -1, updatedAt: -1 })
    .lean()
    .catch(() => null);
  if (legacyDoc && legacyDoc.isValid !== false && Array.isArray(legacyDoc.cookies) && legacyDoc.cookies.length > 0) {
    return legacyDoc;
  }
  // Si se consultó por una empresa específica y no tiene sesión propia, jamás devolver un doc legacy muerto/expirado
  if (companyId) {
    return null;
  }
  // Si no había companyId y el documento legacy (companyId: null) está muerto/ausente,
  // buscar la sesión válida más reciente del usuario antes de devolver un documento muerto del pasado.
  const newestValid = await Model.findOne({
    user: userId,
    isValid: { $ne: false },
    'cookies.0': { $exists: true },
  })
    .sort({ updatedAt: -1 })
    .lean()
    .catch(() => null);
  if (newestValid) return newestValid;
  return legacyDoc;
}

/**
 * Extrae metadatos de frescura (SID, expires máximo de SID/PSID y PSIDTS, flag DBSC) de un conjunto de cookies.
 */
function getCookieAuthFreshness(cookies = []) {
  const list = Array.isArray(cookies) ? cookies : [];
  let sid = '';
  let sidExpires = 0;
  let psidts = '';
  let psidtsExpires = 0;
  let hasDbsc = false;

  for (const c of list) {
    if (!c || typeof c !== 'object') continue;
    const name = String(c.name || '').trim();
    const val = String(c.value || '').trim();
    if (!name || !val) continue;
    const exp = Number(c.expires ?? c.expirationDate ?? 0);
    const validExp = Number.isFinite(exp) && exp > 0 ? exp : 0;

    if (/PSIDRTS/i.test(name)) {
      hasDbsc = true;
    }
    if (name === 'SID' || name === '__Secure-1PSID' || name === '__Secure-3PSID') {
      if (name === 'SID' || !sid) {
        sid = val;
      }
      if (validExp > sidExpires) {
        sidExpires = validExp;
      }
    }
    if (name === '__Secure-1PSIDTS' || name === '__Secure-3PSIDTS') {
      if (name === '__Secure-1PSIDTS' || !psidts) {
        psidts = val;
      }
      if (validExp > psidtsExpires) {
        psidtsExpires = validExp;
      }
    }
  }

  return {
    sid,
    sidExpires,
    psidts,
    psidtsExpires,
    maxAuthExpires: Math.max(sidExpires, psidtsExpires),
    hasDbsc,
    count: list.length,
  };
}

/**
 * Guarda Anti-Regresión: determina si un conjunto entrante de cookies es más antiguo o inferior (DBSC downgrade)
 * que las cookies ya guardadas. Retorna { stale: boolean, reason?: string, ... }.
 */
function isIncomingCookieSetStale(incomingCookies = [], existingCookies = [], existingIsValid = true) {
  if (!Array.isArray(existingCookies) || existingCookies.length === 0) {
    return { stale: false };
  }
  if (!Array.isArray(incomingCookies) || incomingCookies.length === 0) {
    return { stale: true, reason: 'empty_incoming_cookies' };
  }

  const inc = getCookieAuthFreshness(incomingCookies);
  const ex = getCookieAuthFreshness(existingCookies);

  // 1. Nunca sobrescribir una sesión limpia (sin DBSC) con cookies DBSC más antiguas o sin expires
  if (!ex.hasDbsc && inc.hasDbsc && (inc.sidExpires <= ex.sidExpires || inc.sidExpires === 0)) {
    return {
      stale: true,
      reason: 'dbsc_downgrade_rejected',
      incomingSidExp: inc.sidExpires,
      existingSidExp: ex.sidExpires,
    };
  }

  // 2. Si ambos tienen SID expires, rechazar si el entrante es estrictamente más antiguo (>60s margen)
  if (ex.sidExpires > 0 && inc.sidExpires > 0 && inc.sidExpires < ex.sidExpires - 60) {
    return {
      stale: true,
      reason: 'older_sid_expires',
      incomingSidExp: inc.sidExpires,
      existingSidExp: ex.sidExpires,
    };
  }

  // 3. Si la sesión existente está válida con SID expires real, rechazar un SID distinto que no trae expires
  if (existingIsValid && ex.sid && inc.sid && ex.sid !== inc.sid && ex.sidExpires > 0 && inc.sidExpires === 0) {
    return {
      stale: true,
      reason: 'missing_sid_expires_over_valid_session',
      incomingSidExp: 0,
      existingSidExp: ex.sidExpires,
    };
  }

  // 4. Si es el mismo SID pero el __Secure-1PSIDTS entrante tiene expires más viejo que el guardado
  if (
    ex.sid &&
    inc.sid &&
    ex.sid === inc.sid &&
    ex.psidtsExpires > 0 &&
    inc.psidtsExpires > 0 &&
    inc.psidtsExpires < ex.psidtsExpires - 60
  ) {
    return {
      stale: true,
      reason: 'older_psidts_expires',
      incomingPsidtsExp: inc.psidtsExpires,
      existingPsidtsExp: ex.psidtsExpires,
    };
  }

  return { stale: false };
}

/**
 * Resuelve la sesión válida más reciente de Google NotebookLM para inyectar en headers (x-notebooklm-auth)
 * o entregar a notebooklm-mcp.
 * - Siempre prioriza la empresa activa (`CompanyInfo.isActive === true`).
 * - Ordena por `{ isValid: -1, updatedAt: -1 }`.
 * - NUNCA devuelve cookies de una sesión marcada `isValid === false` para evitar envenenamiento.
 */
async function resolveValidNotebookSessionForHeader(
  userId,
  explicitCompanyId = null,
  options = {}
) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return { session: null, cookies: [], email: '', companyId: null, isValid: false };
  }

  const strictCompany = Boolean(options?.strictCompany);
  const activeCompId = await resolveActiveCompanyId(userId, explicitCompanyId);
  let session = null;

  if (activeCompId) {
    session = await NotebookSession.findOne({ user: userId, companyId: activeCompId })
      .sort({ isValid: -1, updatedAt: -1 })
      .lean()
      .catch(() => null);
  }

  // Si la empresa activa no tiene documento propio:
  // - En modo estricto (explicitCompanyId), solo aceptar un doc legacy VÁLIDO (companyId: null), jamás cookies de otra empresa.
  // - En modo abierto (sin explicitCompanyId), buscar la sesión VÁLIDA más reciente del usuario y devolver su companyId real.
  if (!session) {
    if (strictCompany && activeCompId) {
      session = await NotebookSession.findOne({
        user: userId,
        $or: [{ companyId: null }, { companyId: { $exists: false } }],
        isValid: { $ne: false },
        'cookies.0': { $exists: true },
      })
        .sort({ updatedAt: -1 })
        .lean()
        .catch(() => null);
    } else {
      session = await NotebookSession.findOne({
        user: userId,
        isValid: { $ne: false },
        'cookies.0': { $exists: true },
      })
        .sort({ isValid: -1, updatedAt: -1 })
        .lean()
        .catch(() => null);
    }
  }

  if (!session || session.isValid === false || !Array.isArray(session.cookies) || session.cookies.length === 0) {
    return {
      session: session || null,
      cookies: [],
      email: session?.email || '',
      companyId: session ? session.companyId ?? null : activeCompId || null,
      isValid: false,
    };
  }

  return {
    session,
    cookies: session.cookies,
    email: session.email || '',
    companyId: session.companyId ?? null,
    isValid: true,
  };
}

// Directorio base de perfiles de NotebookLM
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const LOCAL_PROFILES_DIR = path.join(REPO_ROOT, 'config', 'notebooklm', 'profiles');
const SYSTEM_PROFILES_DIR = process.env.NOTEBOOKLM_HOME
  ? path.join(process.env.NOTEBOOKLM_HOME, 'profiles')
  : '/root/.notebooklm/profiles';

const OUTPUT_MEDIA_DIR =
  paths.imageOutput || path.resolve(__dirname, '../../../client/public/images');
const MEDIA_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

const CHROME_ANTI_DBSC_FLAG =
  '--disable-features=BoundSessionCredentials,EnableBoundSessionCredentials,DeviceBoundSessions,DeviceBoundSessionsFederatedRegistration,UseUnexportableKeyServiceInBrowserProcess';

const DBSC_WARNING_MESSAGE =
  'Tu sesión actual fue exportada con bloqueo de hardware DBSC de Chrome (__Secure-1PSIDRTS), por lo que Google la caduca cada ~30–60 minutos. Reconecta una sola vez usando el Conector Automático 1-Clic actualizado para obtener una sesión permanente sin desconexiones.';

function hasDbscBoundCookies(cookies = []) {
  if (!Array.isArray(cookies) || cookies.length === 0) return false;
  return cookies.some((c) => c && /PSIDRTS/i.test(String(c.name || '')));
}

function isNotebookAuthFailureError(errMsg = '') {
  const lower = String(errMsg || '').toLowerCase();
  if (!lower) return false;
  return /(rpcerror\s*[:#(-]?\s*16|rpc\s*error\s*16|error\s*code\s*[:=]?\s*16|unauthenticated|token\s+csrf|csrf|hassnlm0e|snlm0e|wzsz1e|cookiemismatch|cookie[\s_-]*mismatch|sesi[oó]n\s+(?:de\s+google\s+)?(?:notebooklm\s+)?(?:expirad|caducad|inv[aá]lid)|caducad|expired|autenticaci[oó]n|401|403|signin|servicelogin|login\s*required|redirect.*accounts\.google)/i.test(
    lower
  );
}

function getPsidtsMeta(cookies = []) {
  if (!Array.isArray(cookies)) return { value: '', expires: 0 };
  const c =
    cookies.find((x) => x && x.name === '__Secure-1PSIDTS' && x.value) ||
    cookies.find((x) => x && x.name === '__Secure-3PSIDTS' && x.value);
  return {
    value: c ? String(c.value) : '',
    expires: c && typeof c.expires === 'number' && Number.isFinite(c.expires) ? c.expires : 0,
  };
}

function cleanGoogleEmailCandidate(val = '') {
  const s = String(val || '').trim();
  if (!s) return '';
  const decoded = s.replace(/\\u0040/gi, '@').replace(/\\x40/gi, '@');
  if (!/^[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]{2,}$/.test(decoded)) return '';
  if (/@wappy\.internal$/i.test(decoded) || /@example\.com$/i.test(decoded)) return '';
  return decoded;
}

function buildGoogleCookieHeaderForEmailDetection(cookies = []) {
  if (!Array.isArray(cookies) || cookies.length === 0) return '';
  const allowedDomains = new Set([
    '.google.com',
    'google.com',
    'accounts.google.com',
    '.accounts.google.com',
    'flow.google.com',
    '.flow.google.com',
  ]);
  const dedup = new Map();
  for (const c of cookies) {
    if (!c || !c.name || !c.value) continue;
    const dom = String(c.domain || '.google.com').toLowerCase();
    if (!allowedDomains.has(dom)) continue;
    if (!dom.includes('flow.google.com')) {
      dedup.set(c.name, c.value);
    }
  }
  for (const c of cookies) {
    if (!c || !c.name || !c.value) continue;
    const dom = String(c.domain || '.google.com').toLowerCase();
    if (dom === 'flow.google.com' || dom === '.flow.google.com') {
      dedup.set(c.name, c.value);
    }
  }
  if (dedup.size === 0) {
    for (const c of cookies) {
      if (c && c.name && c.value) {
        dedup.set(c.name, c.value);
      }
    }
  }
  return Array.from(dedup.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function extractGoogleEmailFromListAccountsBody(rawText = '') {
  const text = String(rawText || '').trim();
  if (!text) return '';
  const cleaned = text.replace(/^\)\]\}'\s*/, '');
  try {
    const parsed = JSON.parse(cleaned);
    const accounts = Array.isArray(parsed?.[1]) ? parsed[1] : Array.isArray(parsed) ? parsed : [];
    let firstValid = '';
    for (const entry of accounts) {
      if (!Array.isArray(entry)) continue;
      // Formato estándar gaia.l.a: ["gaia.l.a", 1, "Display Name", "email@gmail.com", avatarUrl, isDefault, isSignedIn, ...]
      const emailCand = cleanGoogleEmailCandidate(entry[3]);
      if (!emailCand) continue;
      if (!firstValid) firstValid = emailCand;
      const isSignedIn = entry[5] === 1 || entry[6] === 1 || entry[9] === 1;
      if (isSignedIn) {
        return emailCand;
      }
    }
    if (firstValid) return firstValid;
  } catch (_) {
    // Fallback regex abajo si el payload tiene prefijo o formato no estándar
  }
  const normalized = cleaned.replace(/\\u0040/gi, '@').replace(/\\"/g, '"');
  const match = normalized.match(/["']([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/);
  return match ? cleanGoogleEmailCandidate(match[1]) : '';
}

function extractGoogleEmailFromFlowHtml(html = '') {
  const text = String(html || '');
  if (!text) return '';
  const match = text.match(/"oPEP7c"\s*:\s*"([^"\\]+(?:\\u0040|@)[^"\\]+)"/i);
  return match ? cleanGoogleEmailCandidate(match[1]) : '';
}

async function detectGoogleEmailFromCookies(cookies = []) {
  const cookieHeader = buildGoogleCookieHeaderForEmailDetection(cookies);
  if (!cookieHeader) return '';
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

  try {
    let res = await fetch('https://accounts.google.com/ListAccounts?gpsia=1&source=ogb', {
      method: 'POST',
      headers: {
        Cookie: cookieHeader,
        'User-Agent': ua,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Origin: 'https://accounts.google.com',
        Referer: 'https://accounts.google.com/',
      },
      body: ' ',
      signal: AbortSignal.timeout(6000),
    });
    if (res.status === 405) {
      res = await fetch('https://accounts.google.com/ListAccounts?gpsia=1&source=ogb', {
        method: 'GET',
        headers: {
          Cookie: cookieHeader,
          'User-Agent': ua,
        },
        signal: AbortSignal.timeout(6000),
      });
    }
    if (res.ok) {
      const rawBody = await res.text();
      const detected = extractGoogleEmailFromListAccountsBody(rawBody);
      if (detected) return detected;
    }
  } catch (err) {
    logger.debug(`[NotebookLM] ListAccounts email detection no bloqueante: ${err.message}`);
  }

  try {
    const flowRes = await fetch('https://flow.google.com/', {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'User-Agent': ua,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
    });
    if (flowRes.ok) {
      const html = await flowRes.text();
      const detected = extractGoogleEmailFromFlowHtml(html);
      if (detected) return detected;
    }
  } catch (err) {
    logger.debug(`[NotebookLM] flow.google.com oPEP7c email detection no bloqueante: ${err.message}`);
  }

  return '';
}

function computeInternalSessionNextValidity(existingDoc, verified) {
  if (verified === true) {
    return true;
  }
  // Si verified !== true, JAMÁS cambiar isValid de false a true ni inicializar en true sin verificación RPC real
  if (!existingDoc) {
    return false;
  }
  return existingDoc.isValid !== false;
}

async function markNotebookAndLinkedFlowInvalid(
  userId,
  activeCompId = null,
  reasonOrEmail = '',
  options = {}
) {
  if (!userId) return { invalidatedNotebook: false, invalidatedFlow: false };
  const now = new Date();
  const thirdStr = String(reasonOrEmail || '').trim();
  const thirdLooksLikeEmail = Boolean(cleanGoogleEmailCandidate(thirdStr));
  let targetEmail = cleanGoogleEmailCandidate(options?.email || (thirdLooksLikeEmail ? thirdStr : ''));
  const reason = String(options?.reason || (thirdLooksLikeEmail ? '' : thirdStr)).trim();
  const explicitDocId = options?.sessionDocId || null;

  let resolvedCompId = activeCompId;
  if (resolvedCompId === undefined) {
    resolvedCompId = await resolveActiveCompanyId(userId, null).catch(() => null);
  }

  let invalidatedNotebook = false;
  let invalidatedFlow = false;

  try {
    let existingNb = null;
    if (explicitDocId && mongoose.Types.ObjectId.isValid(String(explicitDocId))) {
      existingNb = await NotebookSession.findOne({ _id: explicitDocId }).lean().catch(() => null);
    }
    if (!existingNb) {
      existingNb = await findSessionForCompany(NotebookSession, userId, resolvedCompId);
    }
    if (!targetEmail && existingNb?.email) {
      targetEmail = cleanGoogleEmailCandidate(existingNb.email);
    }
    if (existingNb?._id) {
      await NotebookSession.findOneAndUpdate(
        { _id: existingNb._id },
        { $set: { isValid: false, lastTestedAt: now } }
      );
      invalidatedNotebook = true;
    } else {
      const scopedFilter = resolvedCompId
        ? { user: userId, companyId: resolvedCompId }
        : { user: userId, $or: [{ companyId: null }, { companyId: { $exists: false } }] };
      const resUp = await NotebookSession.updateOne(scopedFilter, {
        $set: { isValid: false, lastTestedAt: now },
      });
      invalidatedNotebook = Boolean(resUp?.matchedCount || resUp?.modifiedCount);
    }
    logger.warn(
      `[NotebookLM] Sesión invalidada (isValid=false) para user=${userId} company=${resolvedCompId || 'null'}${reason ? ` | motivo: ${reason.slice(0, 180)}` : ''}`
    );
  } catch (nbErr) {
    logger.warn(
      `[NotebookLM] Error invalidando NotebookSession para user=${userId}: ${nbErr.message}`
    );
  }

  try {
    const GoogleFlowSession = require('~/models/GoogleFlowSession');
    const existingFlow = await findSessionForCompany(GoogleFlowSession, userId, resolvedCompId);
    if (existingFlow && !existingFlow.apiKey) {
      const nbEmailNorm = String(targetEmail || '').trim().toLowerCase();
      const flowEmailNorm = String(existingFlow.email || '').trim().toLowerCase();
      const sameEmailOrCompany =
        !nbEmailNorm ||
        !flowEmailNorm ||
        nbEmailNorm === flowEmailNorm ||
        String(existingFlow.companyId || '') === String(resolvedCompId || '');
      if (sameEmailOrCompany) {
        await GoogleFlowSession.findOneAndUpdate(
          { _id: existingFlow._id },
          { $set: { isValid: false, lastTestedAt: now } }
        );
        invalidatedFlow = true;
        logger.warn(
          `[NotebookLM] GoogleFlowSession vinculado invalidado (isValid=false) para user=${userId} company=${resolvedCompId || 'null'}.`
        );
      }
    }
  } catch (flowErr) {
    logger.warn(
      `[NotebookLM] Error invalidando GoogleFlowSession vinculado para user=${userId}: ${flowErr.message}`
    );
  }

  return { invalidatedNotebook, invalidatedFlow };
}

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
  } else if (lowerType.includes('audio') || lowerType.includes('podcast') || lowerCt.includes('audio/')) {
    prefix = 'nlm_audio';
    ext = lowerCt.includes('wav') ? 'wav' : lowerCt.includes('mpeg') || lowerCt.includes('mp3') ? 'mp3' : 'mp4';
  } else if (lowerType.includes('video') || lowerCt.includes('video/')) {
    prefix = 'nlm_video';
    ext = 'mp4';
  } else if (lowerType.includes('quiz') || lowerType.includes('cuestionario') || lowerType.includes('examen') || lowerType.includes('evaluacion')) {
    prefix = 'nlm_quiz';
    ext = lowerFmt === 'json' || lowerCt.includes('json') ? 'json' : 'md';
  } else if (lowerType.includes('flashcard') || lowerType.includes('fichas')) {
    prefix = 'nlm_flashcards';
    ext = lowerFmt === 'json' || lowerCt.includes('json') ? 'json' : 'md';
  } else if (lowerType.includes('mind_map') || lowerType.includes('mindmap') || lowerType.includes('mapa')) {
    prefix = 'nlm_mindmap';
    ext = 'json';
  } else if (lowerType.includes('data_table') || lowerType.includes('tabla') || lowerType.includes('table') || lowerFmt === 'csv' || lowerCt.includes('csv')) {
    prefix = 'nlm_table';
    ext = 'csv';
  } else if (lowerType.includes('slide') || lowerFmt === 'pptx' || lowerCt.includes('presentation')) {
    prefix = 'nlm_slides';
    ext = lowerFmt === 'pdf' || lowerCt.includes('pdf') ? 'pdf' : 'pptx';
  } else if (lowerFmt === 'pdf' || lowerCt.includes('pdf')) {
    prefix = 'nlm_doc';
    ext = 'pdf';
  } else if (lowerType.includes('report') || lowerType.includes('study_guide') || lowerType.includes('informe') || lowerType.includes('guia') || lowerFmt === 'md' || lowerFmt === 'markdown' || lowerCt.includes('markdown')) {
    prefix = 'nlm_report';
    ext = 'md';
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
      if (stat.isFile() && stat.size > 32) {
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

    const explicitCompanyId = req.query?.companyId || req.headers['x-company-id'] || null;
    const resolved = await resolveValidNotebookSessionForHeader(userId, explicitCompanyId, {
      strictCompany: Boolean(explicitCompanyId),
    });
    if (!resolved.isValid || !resolved.session || resolved.cookies.length === 0) {
      return res.status(404).json({
        error: 'El usuario no tiene una sesión privada válida de Google NotebookLM vinculada.',
        sessionExpired: Boolean(resolved.session && resolved.session.isValid === false),
      });
    }

    const { session, cookies, companyId } = resolved;
    const freshness = getCookieAuthFreshness(cookies);

    return res.json({
      success: true,
      userId,
      companyId: companyId ? String(companyId) : null,
      profileName: getSafeProfileName(userId, companyId),
      email: session.email || '',
      isValid: true,
      cookies,
      cookieCount: cookies.length,
      sidExpires: freshness.sidExpires,
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
 * las cookies rotadas (__Secure-1PSIDTS, SIDCC, OSID) tras ejecutar RotateCookies o tras verificar RPC real.
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

    const hasExplicitBodyCompany = Boolean(
      req.body && Object.prototype.hasOwnProperty.call(req.body, 'companyId')
    );
    const rawExplicitCompany = hasExplicitBodyCompany
      ? req.body.companyId
      : req.query?.companyId ?? req.headers['x-company-id'];

    let activeCompId = null;
    if (hasExplicitBodyCompany || rawExplicitCompany !== undefined) {
      const normalizedCompStr =
        rawExplicitCompany === null || rawExplicitCompany === undefined
          ? ''
          : String(rawExplicitCompany).trim();
      if (!normalizedCompStr || ['null', 'none', 'undefined'].includes(normalizedCompStr.toLowerCase())) {
        // Perfil explícitamente sin empresa (user_<uid>): actualizar únicamente { user, companyId: null } y JAMÁS pisar empresas activas
        activeCompId = null;
      } else if (mongoose.Types.ObjectId.isValid(normalizedCompStr)) {
        const ownedComp = await CompanyInfo.findOne({ user: userId, _id: normalizedCompStr })
          .select('_id')
          .lean()
          .catch(() => null);
        if (!ownedComp?._id) {
          logger.warn(
            `[NotebookLM Internal] Omitiendo escritura: companyId=${normalizedCompStr} no pertenece a user=${userId}.`
          );
          return res.status(200).json({
            ok: true,
            success: true,
            skipped: 'company_not_found',
          });
        }
        activeCompId = ownedComp._id;
      } else {
        return res.status(400).json({ error: 'companyId inválido' });
      }
    } else {
      activeCompId = await resolveActiveCompanyId(userId, null);
    }

    // Buscar ÚNICAMENTE el documento exacto { user, companyId } (sin fallback cruzado)
    const existingNb = await findExactSessionForCompany(NotebookSession, userId, activeCompId);

    const verified = req.body?.verified === true;
    const psidtsRotated = req.body?.psidtsRotated === true;

    // CAPA 3A — Bloqueo estricto: si NO hubo verificación RPC real ni rotación real de PSIDTS, NO sobrescribir cookies en MongoDB
    if (!verified && !psidtsRotated) {
      logger.debug(
        `[NotebookLM Internal] Omitiendo escritura en MongoDB para user=${userId} companyId=${activeCompId || 'null'}: verified=false y psidtsRotated=false.`
      );
      return res.status(200).json({
        ok: true,
        success: true,
        skipped: 'unverified_no_rotation',
        companyId: activeCompId ? String(activeCompId) : null,
        profileName: getSafeProfileName(userId, activeCompId),
        cookieCount: existingNb?.cookies?.length || 0,
        isValid: existingNb ? Boolean(existingNb.isValid !== false) : false,
        sessionExpired: existingNb ? existingNb.isValid === false : true,
      });
    }

    // CAPA 3B — Guarda Anti-Regresión: rechazar cookies entrantes con SID más antiguo (o downgrade DBSC) que el existente en MongoDB
    const nbStaleCheck = isIncomingCookieSetStale(
      incomingCookies,
      existingNb?.cookies || [],
      existingNb?.isValid !== false
    );
    if (nbStaleCheck.stale) {
      logger.warn(
        `[NotebookLM Internal][Anti-Poison] Rechazando cookies antiguas para user=${userId} companyId=${activeCompId || 'null'} (${nbStaleCheck.reason}, incSidExp=${nbStaleCheck.incomingSidExp ?? 'n/a'}, exSidExp=${nbStaleCheck.existingSidExp ?? 'n/a'}).`
      );
      return res.status(200).json({
        ok: true,
        success: true,
        skipped: 'stale_cookies_rejected',
        reason: nbStaleCheck.reason,
        companyId: activeCompId ? String(activeCompId) : null,
        profileName: getSafeProfileName(userId, activeCompId),
        cookieCount: existingNb?.cookies?.length || 0,
        isValid: existingNb ? Boolean(existingNb.isValid !== false) : false,
        sessionExpired: existingNb ? existingNb.isValid === false : true,
      });
    }

    const mergedNb = mergeGoogleCookiesByDomain(incomingCookies, existingNb?.cookies || []);
    const effectiveEmail =
      cleanGoogleEmailCandidate(existingNb?.email) ||
      cleanGoogleEmailCandidate(req.body?.email) ||
      `${userId}@wappy.internal`;

    const nextNbIsValid = computeInternalSessionNextValidity(existingNb, verified);

    const nbUpdateDoc = {
      companyId: activeCompId || null,
      email: effectiveEmail,
      cookies: mergedNb,
      cookieCount: mergedNb.length,
      isValid: nextNbIsValid,
    };
    if (verified) {
      nbUpdateDoc.lastTestedAt = new Date();
    }

    await NotebookSession.findOneAndUpdate(
      { user: userId, companyId: activeCompId || null },
      nbUpdateDoc,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      const GoogleFlowSession = require('~/models/GoogleFlowSession');
      const existingFlow = await findExactSessionForCompany(GoogleFlowSession, userId, activeCompId);
      const flowStaleCheck = isIncomingCookieSetStale(
        mergedNb,
        existingFlow?.cookies || [],
        existingFlow?.isValid !== false
      );
      if (flowStaleCheck.stale) {
        logger.warn(
          `[NotebookLM Internal][Anti-Poison] Omitiendo sobrescritura en GoogleFlowSession para user=${userId} companyId=${activeCompId || 'null'} (${flowStaleCheck.reason}).`
        );
      } else {
        const mergedFlow = mergeGoogleCookiesByDomain(mergedNb, existingFlow?.cookies || []);
        const nextFlowIsValid = computeInternalSessionNextValidity(existingFlow, verified);

        const flowUpdateDoc = {
          companyId: activeCompId || null,
          email: cleanGoogleEmailCandidate(existingFlow?.email) || effectiveEmail,
          cookies: mergedFlow,
          cookieCount: mergedFlow.length,
          isValid: nextFlowIsValid,
        };
        if (verified) {
          flowUpdateDoc.lastTestedAt = new Date();
        }

        await GoogleFlowSession.findOneAndUpdate(
          { user: userId, companyId: activeCompId || null },
          flowUpdateDoc,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    } catch (flowSyncErr) {
      logger.warn(
        `[NotebookLM Internal] No se pudo sincronizar GoogleFlowSession para user=${userId} companyId=${activeCompId || 'null'}: ${flowSyncErr.message}`
      );
    }

    return res.json({
      ok: true,
      success: true,
      companyId: activeCompId ? String(activeCompId) : null,
      profileName: getSafeProfileName(userId, activeCompId),
      cookieCount: mergedNb.length,
      isValid: Boolean(nextNbIsValid),
      sessionExpired: !Boolean(nextNbIsValid),
      dbscBound: hasDbscBoundCookies(mergedNb),
    });
  } catch (err) {
    logger.error('[NotebookLM Internal] Error updating rotated session:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Obtiene el nombre seguro del perfil aislado por (userId, companyId):
 * 'user_<uid>__<cid>' cuando hay companyId, o 'user_<uid>' cuando no hay empresa.
 */
function getSafeProfileName(userId, companyId = null) {
  if (!userId) return 'default';
  const cleanId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanId) return 'default';
  const rawCid = companyId ? String(companyId).trim() : '';
  const cleanCid =
    rawCid &&
    !rawCid.startsWith('{{') &&
    !['null', 'undefined', 'none'].includes(rawCid.toLowerCase())
      ? rawCid.replace(/[^a-zA-Z0-9_-]/g, '')
      : '';
  return cleanCid ? `user_${cleanId}__${cleanCid}` : `user_${cleanId}`;
}

/**
 * Obtiene las rutas al archivo storage_state.json aislado por (userId, companyId)
 */
function getStoragePaths(userId, companyId = null) {
  const safeProfile = getSafeProfileName(userId, companyId);
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
    const activeCompId = await resolveActiveCompanyId(userId, req.query?.companyId);
    const session = await findSessionForCompany(NotebookSession, userId, activeCompId);
    const profileCompId = session ? session.companyId ?? null : activeCompId || null;
    const primaryStoragePath = getStoragePaths(userId, profileCompId)[0];

    const fileExists = fs.existsSync(primaryStoragePath);
    let diskCookieCount = 0;
    let diskCookies = [];
    let diskEmail = '';

    if (fileExists) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(primaryStoragePath, 'utf8'));
        diskCookies = Array.isArray(fileContent.cookies) ? fileContent.cookies : [];
        diskCookieCount = diskCookies.length;
        diskEmail = fileContent.notebooklm?.account?.email || '';
      } catch (err) {
        logger.warn('[NotebookLM] Error leyendo archivo de sesión en disco:', err.message);
      }
    }

    if (!session && !fileExists) {
      return res.json({
        connected: false,
        hasSession: false,
        isValid: false,
        sessionExpired: false,
        usingDefault: false,
        dbscBound: false,
        companyId: activeCompId ? String(activeCompId) : null,
        profileName: getSafeProfileName(userId, activeCompId),
        message: 'Sin vincular. Conecta tu cuenta privada de Google NotebookLM.',
      });
    }

    const email = session?.email || diskEmail || req.user.email || 'Cuenta conectada';
    const cookieCount = session?.cookieCount || diskCookieCount;
    const hasSession = Boolean(session || fileExists);
    const isValid = Boolean(session ? session.isValid !== false : diskCookieCount > 0);
    const sessionExpired = !isValid;
    const lastTestedAt = session?.lastTestedAt || session?.updatedAt || null;
    const activeCookies =
      Array.isArray(session?.cookies) && session.cookies.length > 0 ? session.cookies : diskCookies;
    const dbscBound = Boolean(hasDbscBoundCookies(activeCookies));

    return res.json({
      connected: Boolean(hasSession),
      hasSession: Boolean(hasSession),
      usingDefault: false,
      email,
      cookieCount,
      isValid,
      sessionExpired,
      dbscBound,
      ...(dbscBound ? { dbscWarning: DBSC_WARNING_MESSAGE } : {}),
      lastTestedAt,
      companyId: profileCompId ? String(profileCompId) : null,
      profileName: getSafeProfileName(userId, profileCompId),
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

    const activeCompId = await resolveActiveCompanyId(
      userId,
      req.body?.companyId || req.query?.companyId
    );

    // Fusionar únicamente con cookies existentes de la MISMA empresa (nunca arrastrar cookies expiradas de otra empresa o companyId: null)
    const existingNb = await findExactSessionForCompany(NotebookSession, userId, activeCompId);
    let mergedCookies = mergeGoogleCookiesByDomain(cookies, existingNb?.cookies || []);

    // Detectar el correo real de Google desde las cookies entrantes (non-blocking, timeout 6s)
    const detectedGoogleEmail = await detectGoogleEmailFromCookies(mergedCookies);
    const effectiveEmail =
      cleanGoogleEmailCandidate(detectedGoogleEmail) ||
      cleanGoogleEmailCandidate(clientEmail) ||
      cleanGoogleEmailCandidate(existingNb?.email) ||
      cleanGoogleEmailCandidate(userEmail) ||
      `${userId}@wappy.internal`;

    // 1. Guardar inicialmente en MongoDB antes de llamar a notebooklm-mcp (así si notebooklm-mcp rota y hace POST /internal/session/:userId, no lo pisamos)
    await NotebookSession.findOneAndUpdate(
      { user: userId, companyId: activeCompId || null },
      {
        companyId: activeCompId || null,
        email: effectiveEmail,
        cookies: mergedCookies,
        cookieCount: mergedCookies.length,
        isValid: true,
        lastTestedAt: new Date(),
        source,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      const GoogleFlowSession = require('~/models/GoogleFlowSession');
      const existingFlow = await findExactSessionForCompany(GoogleFlowSession, userId, activeCompId);
      const mergedFlow = mergeGoogleCookiesByDomain(mergedCookies, existingFlow?.cookies || []);
      await GoogleFlowSession.findOneAndUpdate(
        { user: userId, companyId: activeCompId || null },
        {
          companyId: activeCompId || null,
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

    // 2. Guardar en disco en el perfil aislado por (userId, companyId)
    const storageData = {
      cookies: mergedCookies,
      origins: [],
      notebooklm: {
        version: 1,
        companyId: activeCompId ? String(activeCompId) : null,
        account: {
          authuser: 0,
        },
      },
    };

    const targetPaths = getStoragePaths(userId, activeCompId);
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
    let detectedNotebooks = null;
    if (testResult.success) {
      try {
        const mcpData = await callNotebookLmDirectTool({
          userId,
          companyId: activeCompId,
          email: effectiveEmail,
          cookies: mergedCookies,
          toolName: 'notebook_list',
          toolArgs: {},
        });
        if (mcpData?.error) {
          testResult = {
            success: false,
            reason: mcpData.error,
          };
        } else if (Array.isArray(mcpData?.result)) {
          detectedNotebooks = normalizeNotebookList(mcpData.result);
          notebooksCount = detectedNotebooks.length;
        }
      } catch (liveErr) {
        logger.warn(`[NotebookLM] Advertencia sincronizando con notebooklm-mcp: ${liveErr.message}`);
      }
    }

    const sessionUpdate = {
      companyId: activeCompId || null,
      isValid: testResult.success,
      lastTestedAt: new Date(),
    };
    if (Array.isArray(detectedNotebooks)) {
      sessionUpdate.cachedNotebooks = detectedNotebooks;
      sessionUpdate.notebooksUpdatedAt = new Date();
    }

    await NotebookSession.findOneAndUpdate(
      { user: userId, companyId: activeCompId || null },
      sessionUpdate
    );

    if (!testResult.success) {
      await markNotebookAndLinkedFlowInvalid(userId, activeCompId, effectiveEmail);
    }

    const latestNb = await findExactSessionForCompany(NotebookSession, userId, activeCompId);
    const finalCookies =
      Array.isArray(latestNb?.cookies) && latestNb.cookies.length > 0 ? latestNb.cookies : mergedCookies;
    const finalCount = latestNb?.cookieCount || finalCookies.length;
    const dbscBound = hasDbscBoundCookies(finalCookies);

    return res.json({
      success: true,
      companyId: activeCompId ? String(activeCompId) : null,
      profileName: getSafeProfileName(userId, activeCompId),
      email: effectiveEmail,
      cookieCount: finalCount,
      isValid: testResult.success,
      dbscBound,
      ...(dbscBound ? { dbscWarning: DBSC_WARNING_MESSAGE } : {}),
      notebooksCount,
      notebooks: detectedNotebooks || latestNb?.cachedNotebooks || [],
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
 * Normaliza la lista de cuadernos devuelta por notebooklm-mcp
 */
function normalizeNotebookList(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .filter((nb) => nb && (nb.id || nb.notebook_id))
    .map((nb) => ({
      id: String(nb.id || nb.notebook_id).trim(),
      title: String(nb.title || nb.name || 'Cuaderno sin título').trim(),
      emoji: String(nb.emoji || '📓').trim() || '📓',
      sources_count: Number(nb.sources_count ?? nb.source_count ?? 0) || 0,
      updated_at: String(nb.updated_at || nb.modified_at || ''),
    }));
}

/**
 * Invoca una herramienta en notebooklm-mcp (/api/direct-tool) con fallback automático a localhost:9420 en desarrollo local
 */
async function callNotebookLmDirectTool({
  userId,
  companyId = null,
  email,
  cookies = [],
  toolName,
  toolArgs = {},
}) {
  const primaryUrl = process.env.NOTEBOOKLM_URL || 'http://notebooklm-mcp:9420';
  const candidateUrls = [primaryUrl];
  if (primaryUrl.includes('notebooklm-mcp')) {
    candidateUrls.push('http://127.0.0.1:9420');
  }

  const companyIdStr = companyId ? String(companyId).trim() : '';
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': String(userId || ''),
    'x-user-email': String(email || ''),
  };
  if (companyIdStr) {
    headers['X-Company-Id'] = companyIdStr;
  }
  if (Array.isArray(cookies) && cookies.length > 0) {
    headers['x-notebooklm-auth'] = JSON.stringify(cookies);
  }

  let lastErr = null;
  for (const baseUrl of candidateUrls) {
    try {
      const mcpRes = await fetch(`${baseUrl}/api/direct-tool`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: toolName,
          arguments: toolArgs,
          user_id: String(userId || ''),
          user_email: String(email || ''),
          ...(companyIdStr ? { company_id: companyIdStr } : {}),
        }),
      });
      const mcpData = await mcpRes.json().catch(() => ({}));
      if (!mcpRes.ok || mcpData?.error) {
        return {
          ok: false,
          status: mcpRes.status,
          error: mcpData?.error || `Error en Google NotebookLM (HTTP ${mcpRes.status}).`,
        };
      }
      return {
        ok: true,
        status: mcpRes.status,
        result: mcpData?.result !== undefined ? mcpData.result : mcpData,
      };
    } catch (err) {
      lastErr = err;
    }
  }

  return {
    ok: false,
    status: 503,
    error: `No se pudo contactar al motor NotebookLM MCP: ${lastErr ? lastErr.message : 'Servicio no disponible'}`,
  };
}

/**
 * Resuelve las cookies y email activos de NotebookLM para un usuario y empresa (MongoDB -> Disco -> GoogleFlowSession).
 * Jamás sobrescribe una sesión válida de activeCompId con una sesión expirada de companyId: null ni viceversa.
 */
async function resolveUserNotebookCredentials(userId, fallbackEmail = '', explicitCompanyId = null) {
  let cookies = [];
  let effectiveEmail = fallbackEmail || '';
  const activeCompId = await resolveActiveCompanyId(userId, explicitCompanyId);
  let session = await findSessionForCompany(NotebookSession, userId, activeCompId);
  const profileCompId = session ? session.companyId ?? null : activeCompId || null;

  if (session && Array.isArray(session.cookies) && session.cookies.length > 0) {
    cookies = session.cookies;
    effectiveEmail = session.email || effectiveEmail;
  } else {
    const primaryPath = getStoragePaths(userId, profileCompId)[0];
    if (fs.existsSync(primaryPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(primaryPath, 'utf8'));
        cookies = parsed.cookies || [];
        effectiveEmail = parsed.notebooklm?.account?.email || effectiveEmail;
      } catch (_) {}
    }
  }

  if (cookies.length === 0) {
    try {
      const GoogleFlowSession = require('~/models/GoogleFlowSession');
      const flowSess = await findSessionForCompany(GoogleFlowSession, userId, activeCompId);
      if (
        flowSess &&
        flowSess.isValid !== false &&
        Array.isArray(flowSess.cookies) &&
        flowSess.cookies.length > 0
      ) {
        const existingExactNb = await findExactSessionForCompany(
          NotebookSession,
          userId,
          activeCompId
        );
        const hasValidExactNb = Boolean(
          existingExactNb &&
            existingExactNb.isValid !== false &&
            Array.isArray(existingExactNb.cookies) &&
            existingExactNb.cookies.length > 0
        );
        if (!hasValidExactNb) {
          cookies = flowSess.cookies;
          effectiveEmail = flowSess.email || effectiveEmail;
          session = await NotebookSession.findOneAndUpdate(
            { user: userId, companyId: activeCompId || null },
            {
              $set: {
                user: userId,
                companyId: activeCompId || null,
                email: effectiveEmail,
                cookies,
                cookieCount: cookies.length,
                isValid: true,
                lastTestedAt: new Date(),
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).lean();
        }
      }
    } catch (_) {}
  }

  return { session, cookies, effectiveEmail, activeCompId, profileCompanyId: profileCompId };
}

/**
 * POST /api/notebooklm/test
 * Prueba en vivo la sesión actual del usuario contra el contenedor notebooklm-mcp.
 * Si la sesión local de NotebookLM está vacía o expiró pero Google Flow tiene sesión activa,
 * sincroniza automáticamente las cookies de Google para reconectar sin pedir login de nuevo.
 */
router.post('/test', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    let { cookies, effectiveEmail, activeCompId } = await resolveUserNotebookCredentials(
      userId,
      req.user.email || '',
      req.body?.companyId || req.query?.companyId
    );

    if (cookies.length === 0) {
      return res.status(200).json({
        success: false,
        isValid: false,
        sessionExpired: true,
        dbscBound: false,
        reason: 'No hay ninguna sesión privada guardada para este usuario. Usa "Conectar en 1 Clic" o el botón Reconectar.',
        error: 'No hay ninguna sesión privada guardada para este usuario.',
      });
    }

    const runLiveMcpCheck = async (cookiesToSend, emailToUse) => {
      const localCheck = validateCookiesLocally(cookiesToSend);
      if (!localCheck.success) {
        return { success: false, notebooksCount: null, notebooks: null, reason: localCheck.reason };
      }
      const mcpRes = await callNotebookLmDirectTool({
        userId,
        companyId: activeCompId,
        email: emailToUse,
        cookies: cookiesToSend,
        toolName: 'notebook_list',
        toolArgs: {},
      });
      if (!mcpRes.ok || mcpRes.error) {
        return {
          success: false,
          notebooksCount: null,
          notebooks: null,
          reason: mcpRes.error || 'La sesión de Google NotebookLM ha expirado.',
        };
      }
      const normalized = Array.isArray(mcpRes.result) ? normalizeNotebookList(mcpRes.result) : [];
      return {
        success: true,
        notebooksCount: normalized.length,
        notebooks: normalized,
        reason: null,
      };
    };

    let liveRes = await runLiveMcpCheck(cookies, effectiveEmail);

    // 3. Si falló la verificación en vivo pero existe una sesión más reciente en GoogleFlowSession, sincronizar y reintentar
    if (!liveRes.success) {
      try {
        const GoogleFlowSession = require('~/models/GoogleFlowSession');
        const flowSess = await findSessionForCompany(GoogleFlowSession, userId, activeCompId);
        if (flowSess && Array.isArray(flowSess.cookies) && flowSess.cookies.length > 0) {
          const retryRes = await runLiveMcpCheck(flowSess.cookies, flowSess.email || effectiveEmail);
          if (retryRes.success) {
            cookies = flowSess.cookies;
            effectiveEmail = flowSess.email || effectiveEmail;
            liveRes = retryRes;
            await NotebookSession.findOneAndUpdate(
              { user: userId, companyId: activeCompId || null },
              {
                $set: {
                  companyId: activeCompId || null,
                  cookies,
                  email: effectiveEmail,
                  isValid: true,
                  lastTestedAt: new Date(),
                },
              },
              { upsert: true, setDefaultsOnInsert: true }
            );
          }
        }
      } catch (_) {}
    }

    const updateFields = {
      companyId: activeCompId || null,
      isValid: liveRes.success,
      lastTestedAt: new Date(),
    };
    if (Array.isArray(liveRes.notebooks)) {
      updateFields.cachedNotebooks = liveRes.notebooks;
      updateFields.notebooksUpdatedAt = new Date();
    }

    await NotebookSession.findOneAndUpdate(
      { user: userId, companyId: activeCompId || null },
      updateFields,
      { upsert: true, setDefaultsOnInsert: true }
    );

    const sessionExpired = !liveRes.success && isNotebookAuthFailureError(liveRes.reason || '');
    if (!liveRes.success && sessionExpired) {
      await markNotebookAndLinkedFlowInvalid(userId, activeCompId, effectiveEmail);
    }

    const dbscBound = hasDbscBoundCookies(cookies);

    return res.json({
      success: liveRes.success,
      isValid: liveRes.success,
      sessionExpired,
      dbscBound,
      ...(dbscBound ? { dbscWarning: DBSC_WARNING_MESSAGE } : {}),
      notebooksCount: liveRes.notebooksCount,
      notebooks: liveRes.notebooks || [],
      reason: liveRes.reason || null,
      message: liveRes.success
        ? `¡Tu sesión privada contra Google NotebookLM está ACTIVA y funcionando!${liveRes.notebooksCount !== null ? ` Se detectaron ${liveRes.notebooksCount} cuadernos disponibles.` : ''}`
        : `La sesión falló la verificación en vivo: ${liveRes.reason}`,
    });
  } catch (error) {
    logger.error('[NotebookLM] Error probando sesión:', error);
    return res.status(500).json({ error: 'Error al probar sesión de NotebookLM.' });
  }
});

/**
 * GET /api/notebooklm/notebooks
 * Lista los cuadernos disponibles en la cuenta de Google NotebookLM del usuario
 * y el mapa de cuadernos asignados por agente ("Segundo Cerebro / Fuente de Información").
 */
router.get('/notebooks', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const agentId = String(req.query.agentId || '').trim();

    const { session, cookies, effectiveEmail, activeCompId } = await resolveUserNotebookCredentials(
      userId,
      req.user.email || '',
      req.query.companyId
    );

    if (!cookies || cookies.length === 0) {
      return res.json({
        connected: false,
        email: '',
        isValid: false,
        sessionExpired: false,
        dbscBound: false,
        notebooks: [],
        agentNotebooks: {},
        assignedNotebooks: [],
        message: 'Sin vincular. Conecta tu cuenta privada de Google NotebookLM.',
      });
    }

    let notebooks = Array.isArray(session?.cachedNotebooks)
      ? normalizeNotebookList(session.cachedNotebooks)
      : [];
    let notebooksUpdatedAt = session?.notebooksUpdatedAt || null;
    let isValid = session?.isValid ?? true;
    let sessionExpired = session?.isValid === false;
    let syncWarning = null;
    const dbscBound = hasDbscBoundCookies(cookies);

    const cacheAgeMs = notebooksUpdatedAt
      ? Date.now() - new Date(notebooksUpdatedAt).getTime()
      : Infinity;
    const shouldFetchLive = forceRefresh || notebooks.length === 0 || cacheAgeMs > 5 * 60 * 1000;

    if (shouldFetchLive) {
      const mcpRes = await callNotebookLmDirectTool({
        userId,
        companyId: activeCompId,
        email: effectiveEmail,
        cookies,
        toolName: 'notebook_list',
        toolArgs: {},
      });

      if (mcpRes.ok && Array.isArray(mcpRes.result)) {
        notebooks = normalizeNotebookList(mcpRes.result);
        notebooksUpdatedAt = new Date();
        isValid = true;
        sessionExpired = false;
        await NotebookSession.findOneAndUpdate(
          { user: userId, companyId: activeCompId || null },
          {
            $set: {
              companyId: activeCompId || null,
              cachedNotebooks: notebooks,
              notebooksUpdatedAt,
              isValid: true,
              lastTestedAt: new Date(),
            },
          },
          { upsert: true, setDefaultsOnInsert: true }
        );
      } else if (mcpRes.error) {
        syncWarning = mcpRes.error;
        if (isNotebookAuthFailureError(mcpRes.error)) {
          isValid = false;
          sessionExpired = true;
          await markNotebookAndLinkedFlowInvalid(userId, activeCompId, effectiveEmail);
        }
      }
    }

    const rawAgentMap =
      session?.agentNotebooks && typeof session.agentNotebooks === 'object'
        ? session.agentNotebooks
        : {};

    // Sincronizar metadatos frescos (título, emoji, sources_count) de los cuadernos asignados
    const notebookById = new Map(notebooks.map((n) => [n.id, n]));
    const agentNotebooks = {};
    for (const [agId, list] of Object.entries(rawAgentMap)) {
      if (!Array.isArray(list)) continue;
      agentNotebooks[agId] = list
        .map((item) => {
          const id = typeof item === 'string' ? item : item?.id;
          if (!id) return null;
          const fresh = notebookById.get(String(id));
          if (fresh) return fresh;
          return typeof item === 'object'
            ? {
                id: String(item.id),
                title: String(item.title || 'Cuaderno asignado'),
                emoji: String(item.emoji || '📓'),
                sources_count: Number(item.sources_count || 0),
              }
            : null;
        })
        .filter(Boolean);
    }

    const assignedNotebooks = agentId ? agentNotebooks[agentId] || [] : [];

    return res.json({
      connected: true,
      email: effectiveEmail,
      isValid,
      sessionExpired,
      dbscBound,
      ...(dbscBound ? { dbscWarning: DBSC_WARNING_MESSAGE } : {}),
      notebooks,
      notebooksCount: notebooks.length,
      notebooksUpdatedAt,
      agentNotebooks,
      assignedNotebooks,
      syncWarning,
    });
  } catch (error) {
    logger.error('[NotebookLM] Error listando cuadernos:', error);
    return res.status(500).json({ error: 'Error al consultar cuadernos de NotebookLM.' });
  }
});

/**
 * PUT /api/notebooklm/agent-notebooks/:agentId
 * Asigna o actualiza los cuadernos de NotebookLM que actúan como "Segundo Cerebro / Fuente de Información"
 * para un agente específico (mientras Tenshi conserva acceso total a todos los cuadernos).
 */
async function handleSaveAgentNotebooks(req, res) {
  try {
    const userId = req.user.id;
    const agentId = String(req.params.agentId || req.body?.agentId || '').trim();
    if (!agentId) {
      return res.status(400).json({ error: 'El identificador del agente (agentId) es obligatorio.' });
    }

    const rawNotebooks = Array.isArray(req.body?.notebooks) ? req.body.notebooks : [];
    const activeCompId = await resolveActiveCompanyId(
      userId,
      req.body?.companyId || req.query?.companyId
    );
    const session = await findSessionForCompany(NotebookSession, userId, activeCompId);
    const cachedList = Array.isArray(session?.cachedNotebooks)
      ? normalizeNotebookList(session.cachedNotebooks)
      : [];
    const cachedById = new Map(cachedList.map((n) => [n.id, n]));

    const seenIds = new Set();
    const normalizedAssigned = [];
    for (const item of rawNotebooks) {
      const id = String(typeof item === 'string' ? item : item?.id || '').trim();
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      const cached = cachedById.get(id);
      normalizedAssigned.push({
        id,
        title: String((typeof item === 'object' && item?.title) || cached?.title || 'Cuaderno NotebookLM').trim(),
        emoji: String((typeof item === 'object' && item?.emoji) || cached?.emoji || '📓').trim() || '📓',
        sources_count: Number(
          (typeof item === 'object' && item?.sources_count !== undefined
            ? item.sources_count
            : cached?.sources_count) || 0
        ),
      });
    }

    const currentMap =
      session?.agentNotebooks && typeof session.agentNotebooks === 'object'
        ? { ...session.agentNotebooks }
        : {};
    currentMap[agentId] = normalizedAssigned;

    await NotebookSession.findOneAndUpdate(
      { user: userId, companyId: activeCompId || null },
      { $set: { companyId: activeCompId || null, agentNotebooks: currentMap } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      agentId,
      assignedNotebooks: normalizedAssigned,
      agentNotebooks: currentMap,
      message:
        normalizedAssigned.length > 0
          ? `Segundo Cerebro actualizado: ${normalizedAssigned.length} cuaderno(s) asignado(s) al agente.`
          : 'Se desvincularon los cuadernos específicos de este agente.',
    });
  } catch (error) {
    logger.error('[NotebookLM] Error guardando cuadernos del agente:', error);
    return res.status(500).json({ error: 'Error al asignar cuadernos al agente.' });
  }
}

router.put('/agent-notebooks/:agentId', requireJwtAuth, handleSaveAgentNotebooks);
router.post('/agent-notebooks', requireJwtAuth, handleSaveAgentNotebooks);

/**
 * GET /api/notebooklm/notebooks/:notebookId/sources
 * Lista las fuentes documentales dentro de un cuaderno específico de NotebookLM.
 */
router.get('/notebooks/:notebookId/sources', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notebookId = String(req.params.notebookId || '').trim();
    if (!notebookId) {
      return res.status(400).json({ error: 'ID de cuaderno inválido.' });
    }

    const { cookies, effectiveEmail, activeCompId } = await resolveUserNotebookCredentials(
      userId,
      req.user.email || '',
      req.query.companyId
    );
    if (!cookies || cookies.length === 0) {
      return res.status(400).json({ error: 'Cuenta de Google NotebookLM no vinculada.' });
    }

    const mcpRes = await callNotebookLmDirectTool({
      userId,
      companyId: activeCompId,
      email: effectiveEmail,
      cookies,
      toolName: 'source_list',
      toolArgs: { notebook: notebookId },
    });

    if (!mcpRes.ok || mcpRes.error) {
      return res.status(mcpRes.status || 500).json({
        error: mcpRes.error || 'No se pudieron consultar las fuentes del cuaderno.',
      });
    }

    return res.json({
      success: true,
      notebookId,
      sources: Array.isArray(mcpRes.result) ? mcpRes.result : [],
    });
  } catch (error) {
    logger.error('[NotebookLM] Error listando fuentes del cuaderno:', error);
    return res.status(500).json({ error: 'Error al listar fuentes del cuaderno.' });
  }
});

/**
 * DELETE /api/notebooklm/session
 * Desvincula la sesión privada del usuario
 */
router.delete('/session', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const activeCompId = await resolveActiveCompanyId(
      userId,
      req.query?.companyId || req.body?.companyId
    );

    // Eliminar de disco únicamente el perfil aislado de esta empresa (o user_<uid> si no hay empresa)
    const targetPaths = getStoragePaths(userId, activeCompId);
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

    // Eliminar de MongoDB únicamente para la empresa activa (y solo si no existía doc de empresa, limpiar fallback legacy)
    if (activeCompId) {
      const delRes = await NotebookSession.deleteMany({ user: userId, companyId: activeCompId });
      if (!delRes?.deletedCount) {
        await NotebookSession.deleteMany({
          user: userId,
          $or: [{ companyId: null }, { companyId: { $exists: false } }],
        });
      }
    } else {
      await NotebookSession.deleteMany({
        user: userId,
        $or: [{ companyId: null }, { companyId: { $exists: false } }],
      });
    }

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
    logger.info(`[NotebookLM] 🔄 Sirviendo script de auto-actualización wappy_daemon_autoupdate (${serverOrigin})`);
    const effectiveOrigin = /^https?:\/\/(127\.0\.0\.1|localhost)/i.test(serverOrigin)
      ? 'https://wappy.club'
      : serverOrigin;
    const updateScript = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const { spawn, spawnSync } = require('child_process');

const daemonUrl = ${JSON.stringify(effectiveOrigin)} + '/api/mcp-bridge/antigravity/daemon.js';
const parsed = new URL(daemonUrl);
const client = parsed.protocol === 'https:' ? https : http;

client.get(parsed, (res) => {
  if (res.statusCode !== 200) process.exit(0);
  let code = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => (code += chunk));
  res.on('end', () => {
    try {
      if (!code || !code.includes('startSseWorker')) process.exit(0);
      const homeDir = os.homedir();
      const agyDir = path.join(homeDir, '.gemini', 'antigravity');
      fs.mkdirSync(agyDir, { recursive: true });
      const dest = path.join(agyDir, 'wappy-push-daemon.js');
      const listenerDest = path.join(agyDir, 'wappy-tenshi-listener.js');
      const tmpDest = path.join(agyDir, 'wappy-push-daemon.update.js');
      fs.writeFileSync(tmpDest, code, { encoding: 'utf8', mode: 0o755 });

      // Validar que el archivo descargado sea JavaScript sintácticamente correcto antes de reemplazar nada
      const check = spawnSync(process.execPath, ['--check', tmpDest], { stdio: 'ignore', windowsHide: true });
      if (check.status !== 0) {
        try { fs.unlinkSync(tmpDest); } catch (_) {}
        process.exit(0);
      }
      fs.copyFileSync(tmpDest, dest);
      fs.copyFileSync(tmpDest, listenerDest);
      try { fs.unlinkSync(tmpDest); } catch (_) {}
      try { fs.chmodSync(dest, 0o755); fs.chmodSync(listenerDest, 0o755); } catch (_) {}

      // Reinstalar con la lógica oficial del propio daemon (LaunchAgent / Startup / Programador de tareas)
      const child = spawn(process.execPath, [dest, '--install', '--from-update'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        cwd: homeDir,
      });
      child.unref();
    } catch (_) {}
    process.exit(0);
  });
}).on('error', () => process.exit(0));
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

const ANTI_DBSC_FLAG = '${CHROME_ANTI_DBSC_FLAG}';

function launchBrowserVisible(browserBin, profileDir, debugPort, targetUrl) {
  const args = [
    \`--remote-debugging-port=\${debugPort}\`,
    '--remote-allow-origins=*',
    \`--user-data-dir=\${profileDir}\`,
    '--no-first-run',
    '--no-default-browser-check',
    ANTI_DBSC_FLAG,
    '--window-size=1080,780',
    \`--app=\${targetUrl}\`,
  ];
  if (os.platform() === 'win32') {
    try {
      const cmdLine = \`start "" "\${browserBin}" --remote-debugging-port=\${debugPort} --remote-allow-origins=* --user-data-dir="\${profileDir}" --no-first-run --no-default-browser-check "\${ANTI_DBSC_FLAG}" --window-size=1080,780 --app=\${targetUrl}\`;
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

  const targetUrl = 'https://notebooklm.google.com/';
  const child = launchBrowserVisible(browserBin, profileDir, debugPort, targetUrl);

  const maxWaitMs = 180000;
  const start = Date.now();
  let clearedDeadCookiesOnce = false;
  let checkedInitialDbsc = false;
  let clearedDbscOnce = false;

  const hasDbscCookiesInList = (list) =>
    Array.isArray(list) &&
    list.some((c) => c && (c.name === '__Secure-1PSIDRTS' || c.name === '__Secure-3PSIDRTS' || /PSIDRTS/i.test(c.name || '')));

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const listRes = await fetch(\`http://127.0.0.1:\${debugPort}/json/list\`);
      const pages = await listRes.json();
      if (!Array.isArray(pages)) continue;

      // Auto-limpieza temprana de sesiones viejas con bloqueo DBSC (__Secure-1PSIDRTS / __Secure-3PSIDRTS)
      if (!checkedInitialDbsc && !clearedDbscOnce) {
        const anyPage = pages.find((p) => p.type === 'page' && p.webSocketDebuggerUrl);
        if (anyPage) {
          checkedInitialDbsc = true;
          let initCookies = [];
          try {
            const stInit = await cdpSend(anyPage.webSocketDebuggerUrl, 'Storage.getCookies');
            initCookies = stInit?.result?.cookies || [];
          } catch (_) {}
          if (!initCookies.length) {
            try {
              const netInit = await cdpSend(anyPage.webSocketDebuggerUrl, 'Network.getAllCookies');
              initCookies = netInit?.result?.cookies || [];
            } catch (_) {}
          }
          if (hasDbscCookiesInList(initCookies)) {
            clearedDbscOnce = true;
            console.log('🧹 Detectada sesión temporal con bloqueo DBSC de Chrome; reiniciando ventana en modo permanente sin DBSC...');
            try {
              await cdpSend(anyPage.webSocketDebuggerUrl, 'Network.clearBrowserCookies');
              await cdpSend(anyPage.webSocketDebuggerUrl, 'Page.navigate', {
                url: 'https://accounts.google.com/ServiceLogin?continue=https://notebooklm.google.com/',
              });
            } catch (_) {}
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
        }
      }

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

      const googleCookies = allCookies.filter((c) => c.domain && (c.domain.includes('google.com') || c.domain.includes('labs.google')));
      if (hasDbscCookiesInList(googleCookies) && !clearedDbscOnce) {
        clearedDbscOnce = true;
        console.log('🧹 Detectada sesión temporal con bloqueo DBSC de Chrome; reiniciando ventana en modo permanente sin DBSC...');
        try {
          await cdpSend(nbPage.webSocketDebuggerUrl, 'Network.clearBrowserCookies');
          await cdpSend(nbPage.webSocketDebuggerUrl, 'Page.navigate', {
            url: 'https://accounts.google.com/ServiceLogin?continue=https://notebooklm.google.com/',
          });
        } catch (_) {}
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      const names = new Set(googleCookies.map((c) => c.name));

      if (names.has('SID') && (names.has('__Secure-1PSID') || names.has('__Secure-1PSIDTS'))) {
        try {
          await cdpSend(nbPage.webSocketDebuggerUrl, 'Target.createTarget', {
            url: 'https://flow.google.com/',
            background: true,
          });
          await cdpSend(nbPage.webSocketDebuggerUrl, 'Target.createTarget', {
            url: 'https://labs.google/fx/tools/flow',
            background: true,
          });
          await new Promise((r) => setTimeout(r, 2500));
          const stRes2 = await cdpSend(nbPage.webSocketDebuggerUrl, 'Storage.getCookies').catch(() => null);
          const refreshed = stRes2?.result?.cookies || [];
          if (refreshed.length > allCookies.length) {
            allCookies = refreshed;
          }
        } catch (_) {}

        const finalGoogleCookies = allCookies.filter((c) => c.domain && (c.domain.includes('google.com') || c.domain.includes('labs.google')));
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
        } else if (!clearedDeadCookiesOnce) {
          clearedDeadCookiesOnce = true;
          console.log('🔄 La sesión guardada en el navegador había expirado. Abriendo pantalla de inicio de sesión de Google...');
          try {
            await cdpSend(nbPage.webSocketDebuggerUrl, 'Network.clearBrowserCookies');
            await cdpSend(nbPage.webSocketDebuggerUrl, 'Page.navigate', {
              url: 'https://accounts.google.com/ServiceLogin?continue=https://notebooklm.google.com/',
            });
          } catch (_) {}
          await new Promise((r) => setTimeout(r, 3000));
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
    const rawCompanyId = String(
      req.query.companyId || req.query.company_id || req.headers['x-company-id'] || ''
    ).trim();
    const activeCompId = userId
      ? await resolveActiveCompanyId(userId, rawCompanyId || null).catch(() => rawCompanyId || null)
      : rawCompanyId || null;
    const companyIdStr = activeCompId ? String(activeCompId).trim() : '';

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
    if (companyIdStr) qs.set('company_id', companyIdStr);

    const reqHeaders = {};
    if (userId) reqHeaders['x-user-id'] = userId;
    if (companyIdStr) reqHeaders['X-Company-Id'] = companyIdStr;
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
          if (companyIdStr) dlQs.set('company_id', companyIdStr);

          const bgHeaders = {};
          if (userId) bgHeaders['x-user-id'] = userId;
          if (companyIdStr) bgHeaders['X-Company-Id'] = companyIdStr;

          try {
            const bgRes = await fetch(`${notebooklmUrl}/api/download-artifact?${dlQs.toString()}`, {
              headers: bgHeaders,
            });
            if (bgRes.ok && bgRes.status === 200) {
              const ct = bgRes.headers.get('content-type') || '';
              const meta = resolveNotebookArtifactFileMeta(artifactId, type, format, ct);
              await fs.promises.mkdir(OUTPUT_MEDIA_DIR, { recursive: true });
              const ab = await bgRes.arrayBuffer();
              if (ab.byteLength > 32) {
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
      if (buffer.byteLength > 32) {
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

router.OUTPUT_MEDIA_DIR = OUTPUT_MEDIA_DIR;
router.resolveActiveCompanyId = resolveActiveCompanyId;
router.findExactSessionForCompany = findExactSessionForCompany;
router.findSessionForCompany = findSessionForCompany;
router.getSafeProfileName = getSafeProfileName;
router.resolveNotebookArtifactFileMeta = resolveNotebookArtifactFileMeta;
router.findCachedNotebookArtifact = findCachedNotebookArtifact;
router.normalizeNotebookList = normalizeNotebookList;
router.callNotebookLmDirectTool = callNotebookLmDirectTool;
router.resolveUserNotebookCredentials = resolveUserNotebookCredentials;
router.markNotebookAndLinkedFlowInvalid = markNotebookAndLinkedFlowInvalid;
router.isNotebookAuthFailureError = isNotebookAuthFailureError;
router.detectGoogleEmailFromCookies = detectGoogleEmailFromCookies;
router.extractGoogleEmailFromListAccountsBody = extractGoogleEmailFromListAccountsBody;
router.extractGoogleEmailFromFlowHtml = extractGoogleEmailFromFlowHtml;
router.computeInternalSessionNextValidity = computeInternalSessionNextValidity;
router.getCookieAuthFreshness = getCookieAuthFreshness;
router.isIncomingCookieSetStale = isIncomingCookieSetStale;
router.resolveValidNotebookSessionForHeader = resolveValidNotebookSessionForHeader;

module.exports = router;
