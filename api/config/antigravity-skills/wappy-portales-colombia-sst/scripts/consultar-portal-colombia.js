#!/usr/bin/env node
/**
 * WAPPY IA — CLI Determinista de Consulta en Portales Oficiales Colombianos (SST & PESV)
 * ======================================================================================
 * Cero dependencias externas npm (100% Node.js nativo). Compatible con macOS, Windows y Linux.
 * Carga ~/.gemini/antigravity/wappy-osint-portals.js (auto-descargándolo desde WAPPY si falta),
 * valida bytes mágicos (%PDF / \x89PNG), persiste certificados oficiales con hash SHA-256
 * y permite envío directo al chat activo de Tenshi (--enviar-tenshi).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const CLI_VERSION = '2.7.0';
const HOME_DIR = os.homedir();
const AGY_DIR = path.join(HOME_DIR, '.gemini', 'antigravity');
const CONFIG_DIR = path.join(HOME_DIR, '.gemini', 'config');
const ENV_FILE = path.join(AGY_DIR, 'wappy-env.json');
const KEYS_FILE = path.join(AGY_DIR, 'wappy-keys.json');
const OSINT_ENGINE_PATH = path.join(AGY_DIR, 'wappy-osint-portals.js');
const DAEMON_SCRIPT_PATH = path.join(AGY_DIR, 'wappy-push-daemon.js');

const VALID_DOC_TYPES = new Set(['CC', 'CE', 'PPT', 'TI', 'NIT', 'PEP', 'PA', 'RC']);
const PORTAL_ALIASES = {
  arl: 'arl',
  sura: 'arl',
  positiva: 'arl',
  bolivar: 'arl',
  alturas: 'alturas',
  confinados: 'alturas',
  mintrabajo: 'alturas',
  alto_riesgo: 'alturas',
  eps: 'eps',
  salud: 'eps',
  adres: 'eps',
  rethus: 'eps',
  salud_rethus: 'eps',
  pensiones: 'pensiones',
  afp: 'pensiones',
  porvenir: 'pensiones',
  colpensiones: 'pensiones',
  antecedentes: 'antecedentes',
  rama: 'antecedentes',
  ramajudicial: 'antecedentes',
  contraloria: 'antecedentes',
  simit: 'simit',
  pesv: 'simit',
  vial: 'simit',
  vial_pesv: 'simit',
  web: 'web',
  scrape: 'web',
  all: 'all',
  '360': 'all',
};

function parseCliArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (raw === '-h' || raw === '--help') {
      args.help = true;
    } else if (raw === '-v' || raw === '--version') {
      args.version = true;
    } else if (raw.startsWith('--')) {
      const eq = raw.indexOf('=');
      if (eq !== -1) {
        const k = raw.slice(2, eq).trim();
        const v = raw.slice(eq + 1).trim();
        args[k] = v;
      } else {
        const k = raw.slice(2).trim();
        const next = argv[i + 1];
        const booleanFlags = new Set([
          'json',
          'help',
          'version',
          'enviar-tenshi',
          'no-evidence',
          'refresh-engine',
          'force-evidence',
        ]);
        if (!booleanFlags.has(k) && next && !next.startsWith('-')) {
          args[k] = next.trim();
          i += 1;
        } else {
          args[k] = true;
        }
      }
    }
  }
  return args;
}

function printHelp() {
  const helpText = `
WAPPY IA · Consultor Determinista de Portales Oficiales Colombianos v${CLI_VERSION}
================================================================================

Uso:
  node consultar-portal-colombia.js --portal=<portal> --documento=<num> [opciones]

Portales soportados (--portal):
  arl            ARL SURA, ARL Positiva y ARL Seguros Bolívar (con --fecha-nacimiento)
  alturas        Ministerio del Trabajo — Curso de Alturas y Espacios Confinados
  eps            ADRES (BDUA Salud) y ReTHUS Talento Humano en Salud
  pensiones      Fondos de Pensiones AFP (Porvenir / Colpensiones / orientación AFP)
  antecedentes   Rama Judicial API v2 (:448) + Certificado Fiscal Contraloría General
  simit          SIMIT Federación Colombiana de Municipios (Comparendos / Paz y Salvo PESV)
  web            Extracción web institucional con captura de evidencia PDF/PNG (--url=...)
  all            Barrido integral 360° en todos los portales aplicables al trabajador

Opciones principales:
  --tipo=CC|CE|PPT|TI|NIT|PEP    Tipo de documento (por defecto: CC)
  --documento=<numero>           Número de documento o NIT (limpia puntos/guiones)
  --fecha-nacimiento=YYYY-MM-DD  Fecha de nacimiento (requerida por ARL Seguros Bolívar)
  --nombre="Nombres Apellidos"   Nombre completo (usado en Rama Judicial y validación)
  --placa=ABC123                 Placa vehicular para consulta PESV en SIMIT
  --arl=... / --eps=... / --afp= Entidad conocida opcional en ficha del trabajador
  --url=https://...              URL objetivo cuando --portal=web
  --out-dir=<ruta>               Carpeta destino de PDFs/PNGs (default: <TMP>/wappy-certificados)
  --enviar-tenshi                Envía automáticamente el PDF oficial al chat de Tenshi
  --orden-id=<id>                ID de orden delegada de WAPPY/Tenshi opcional
  --no-evidence                  Omite generación/conversión de evidencia gráfica adicional
  --refresh-engine               Fuerza re-descarga de wappy-osint-portals.js desde WAPPY
  --json                         Devuelve salida JSON pura en stdout
  --help                         Muestra esta ayuda

Códigos de salida:
  0 = Consulta ejecutada correctamente
  1 = Parámetros inválidos o faltantes
  2 = Error de motor o fallo de conexión no recuperable

Ejemplos:
  node consultar-portal-colombia.js --portal=arl --documento=1146635472 --json
  node consultar-portal-colombia.js --portal=arl --documento=1020304050 --fecha-nacimiento=1992-05-14 --enviar-tenshi
  node consultar-portal-colombia.js --portal=alturas --documento=1146635472 --out-dir=~/Downloads
  node consultar-portal-colombia.js --portal=all --documento=1146635472 --nombre="JUAN PEREZ" --json
`.trim();
  console.log(helpText);
}

function normalizeWappyUrl(rawUrl) {
  let clean = String(rawUrl || 'https://wappy.club').trim();
  clean = clean
    .replace(/https?:\/\/wappy-ia\.com/gi, 'https://wappy.club')
    .replace(/\/+$/, '')
    .replace(/\/api\/mcp-bridge.*$/i, '');
  return clean || 'https://wappy.club';
}

function resolveLocalWappyConfig(cliArgs = {}) {
  let wappyUrl = cliArgs.url && !cliArgs.portal ? cliArgs.url : process.env.WAPPY_URL || '';
  let apiKey = cliArgs.key || cliArgs.apiKey || process.env.WAPPY_API_KEY || '';

  try {
    if (fs.existsSync(ENV_FILE)) {
      const envJson = JSON.parse(fs.readFileSync(ENV_FILE, 'utf8')) || {};
      if (!wappyUrl && envJson.WAPPY_URL) wappyUrl = envJson.WAPPY_URL;
      if (!apiKey && envJson.WAPPY_API_KEY) apiKey = envJson.WAPPY_API_KEY;
    }
  } catch (_) {}

  for (const cfgPath of [
    path.join(CONFIG_DIR, 'mcp_config.json'),
    path.join(AGY_DIR, 'mcp_config.json'),
  ]) {
    if (wappyUrl && apiKey) break;
    try {
      if (!fs.existsSync(cfgPath)) continue;
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) || {};
      const wappySrv = parsed?.mcpServers?.wappy;
      const srvUrl = wappySrv?.serverUrl || wappySrv?.url || '';
      if (srvUrl) {
        const u = new URL(srvUrl);
        if (!wappyUrl) wappyUrl = `${u.protocol}//${u.host}`;
        if (!apiKey && u.searchParams.get('apiKey')) apiKey = u.searchParams.get('apiKey');
      }
    } catch (_) {}
  }

  if (!apiKey && fs.existsSync(KEYS_FILE)) {
    try {
      const list = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
      if (Array.isArray(list) && list[0]?.apiKey) {
        apiKey = list[0].apiKey;
        if (!wappyUrl && list[0].wappyUrl) wappyUrl = list[0].wappyUrl;
      }
    } catch (_) {}
  }

  return {
    wappyUrl: normalizeWappyUrl(wappyUrl || 'https://wappy.club'),
    apiKey: String(apiKey || '').trim(),
  };
}

function downloadText(urlStr, headers = {}, timeoutMs = 20000, redirectsLeft = 4) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(urlStr);
    } catch (err) {
      return reject(err);
    }
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(
      parsed,
      {
        headers: {
          'User-Agent': 'Wappy-Antigravity-Skills-CLI/2.7.0',
          Accept: '*/*',
          ...headers,
        },
        timeout: timeoutMs,
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirectsLeft > 0
        ) {
          res.resume();
          const nextUrl = new URL(res.headers.location, parsed).href;
          return resolve(downloadText(nextUrl, headers, timeoutMs, redirectsLeft - 1));
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} descargando ${urlStr}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      },
    );
    req.on('timeout', () => {
      req.destroy(new Error(`Timeout (${timeoutMs}ms) descargando ${urlStr}`));
    });
    req.on('error', reject);
  });
}

async function loadOsintEngine({ wappyUrl, apiKey, forceRefresh = false, logErr }) {
  fs.mkdirSync(AGY_DIR, { recursive: true });

  const devRepoCandidates = [
    path.resolve(__dirname, '../../../../server/services/osintWorkerService.js'),
    path.resolve(__dirname, '../../../../../api/server/services/osintWorkerService.js'),
  ];

  if (!forceRefresh && fs.existsSync(OSINT_ENGINE_PATH)) {
    try {
      const mod = require(OSINT_ENGINE_PATH);
      if (mod && typeof mod.consultarArlRealPorCedula === 'function') {
        return { mod, enginePath: OSINT_ENGINE_PATH, source: 'local_cache' };
      }
    } catch (_) {}
  }

  if (!forceRefresh) {
    for (const devCand of devRepoCandidates) {
      try {
        if (fs.existsSync(devCand)) {
          fs.copyFileSync(devCand, OSINT_ENGINE_PATH);
          const mod = require(OSINT_ENGINE_PATH);
          if (mod && typeof mod.consultarArlRealPorCedula === 'function') {
            return { mod, enginePath: OSINT_ENGINE_PATH, source: 'workspace_sync' };
          }
        }
      } catch (_) {}
    }
  }

  const downloadUrl = `${wappyUrl}/api/mcp-bridge/antigravity/osint-portals.js`;
  logErr(`⬇️ Descargando motor oficial de portales colombianos desde ${downloadUrl} ...`);
  const headers = {};
  if (apiKey) {
    headers['x-api-key'] = apiKey;
    headers.Authorization = `Bearer ${apiKey}`;
  }
  const code = await downloadText(downloadUrl, headers, 25000);
  if (!code || !code.includes('consultarArlRealPorCedula')) {
    throw new Error('El archivo descargado desde osint-portals.js no contiene un motor válido.');
  }

  const tmpFile = `${OSINT_ENGINE_PATH}.tmp.${process.pid}`;
  fs.writeFileSync(tmpFile, code, { encoding: 'utf8', mode: 0o644 });
  const check = spawnSync(process.execPath, ['--check', tmpFile], {
    stdio: 'ignore',
    windowsHide: true,
  });
  if (check.status !== 0) {
    try {
      fs.unlinkSync(tmpFile);
    } catch (_) {}
    throw new Error('Fallo de validación sintáctica (node --check) en wappy-osint-portals.js.');
  }
  fs.renameSync(tmpFile, OSINT_ENGINE_PATH);
  delete require.cache[require.resolve(OSINT_ENGINE_PATH)];
  const mod = require(OSINT_ENGINE_PATH);
  return { mod, enginePath: OSINT_ENGINE_PATH, source: 'downloaded_remote' };
}

function normalizeBirthDate(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    const dt = new Date(`${y}-${m}-${d}T12:00:00Z`);
    if (Number.isNaN(dt.getTime())) return null;
    return `${y}-${m}-${d}`;
  }
  const dmy = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const dt = new Date(`${y}-${m}-${d}T12:00:00Z`);
    if (Number.isNaN(dt.getTime())) return null;
    return `${y}-${m}-${d}`;
  }
  return null;
}

function expandUserPath(rawPath) {
  const s = String(rawPath || '').trim();
  if (!s) return path.join(os.tmpdir(), 'wappy-certificados');
  if (s === '~') return HOME_DIR;
  if (s.startsWith('~/') || s.startsWith('~\\')) return path.join(HOME_DIR, s.slice(2));
  return path.resolve(s);
}

function sanitizeFileName(rawName, fallback) {
  const base = path.basename(String(rawName || fallback || 'Certificado_Oficial.pdf'));
  const cleaned = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || fallback;
}

function isPdfBufferValid(buf) {
  return (
    Buffer.isBuffer(buf) &&
    buf.length > 64 &&
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46
  );
}

function isPngBufferValid(buf) {
  return (
    Buffer.isBuffer(buf) &&
    buf.length > 64 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  );
}

function persistPortalEvidence(portalKey, resObj, outDir, cleanDoc) {
  const saved = {
    pdfPath: null,
    pdfSizeBytes: 0,
    pdfSha256: null,
    pdfMagicValid: false,
    pngPath: null,
    pngSizeBytes: 0,
    pngSha256: null,
    pngMagicValid: false,
  };
  if (!resObj || typeof resObj !== 'object') return saved;

  fs.mkdirSync(outDir, { recursive: true });
  const dateTag = new Date().toISOString().slice(0, 10);

  if (resObj.pdfBase64 && typeof resObj.pdfBase64 === 'string') {
    const rawB64 = resObj.pdfBase64.replace(/^data:application\/pdf;base64,/i, '').trim();
    if (rawB64) {
      const pdfBuf = Buffer.from(rawB64, 'base64');
      if (isPdfBufferValid(pdfBuf)) {
        const fileName = sanitizeFileName(
          resObj.pdfFileName,
          `Certificado_${portalKey.toUpperCase()}_${cleanDoc || 'Colombia'}_${dateTag}.pdf`,
        );
        const finalName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
        const fullPdfPath = path.join(outDir, finalName);
        fs.writeFileSync(fullPdfPath, pdfBuf);
        saved.pdfPath = fullPdfPath;
        saved.pdfSizeBytes = pdfBuf.length;
        saved.pdfSha256 = crypto.createHash('sha256').update(pdfBuf).digest('hex');
        saved.pdfMagicValid = true;
      }
    }
  }

  const rawImgB64 = resObj.imageBase64 || resObj.screenshotBase64;
  if (rawImgB64 && typeof rawImgB64 === 'string') {
    const cleanImgB64 = rawImgB64.replace(/^data:image\/[a-z0-9+.-]+;base64,/i, '').trim();
    if (cleanImgB64) {
      const pngBuf = Buffer.from(cleanImgB64, 'base64');
      if (isPngBufferValid(pngBuf)) {
        const fileName = sanitizeFileName(
          resObj.imageFileName,
          `Evidencia_${portalKey.toUpperCase()}_${cleanDoc || 'Colombia'}_${dateTag}.png`,
        );
        const finalName = fileName.toLowerCase().endsWith('.png') ? fileName : `${fileName}.png`;
        const fullPngPath = path.join(outDir, finalName);
        fs.writeFileSync(fullPngPath, pngBuf);
        saved.pngPath = fullPngPath;
        saved.pngSizeBytes = pngBuf.length;
        saved.pngSha256 = crypto.createHash('sha256').update(pngBuf).digest('hex');
        saved.pngMagicValid = true;
      }
    }
  }

  return saved;
}

function stripLargeBase64FromResult(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj };
  delete clone.pdfBase64;
  delete clone.imageBase64;
  delete clone.screenshotBase64;
  if (Array.isArray(clone.evidences)) {
    clone.evidences = clone.evidences.map((ev) => {
      const c = { ...ev };
      delete c.pdfBase64;
      delete c.imageBase64;
      delete c.screenshotBase64;
      return c;
    });
  }
  return clone;
}

function sendCertificateToTenshi({ filePath, ordenId, summaryText }) {
  const daemonCandidates = [
    DAEMON_SCRIPT_PATH,
    path.resolve(__dirname, '../../../../../bin/wappy-antigravity-daemon.js'),
  ];
  const daemonBin = daemonCandidates.find((p) => fs.existsSync(p));
  if (!daemonBin) {
    return {
      attempted: true,
      ok: false,
      error: 'No se encontró ~/.gemini/antigravity/wappy-push-daemon.js en este equipo.',
    };
  }
  const args = [daemonBin, `--send-file=${filePath}`, `--resumen=${summaryText}`];
  if (ordenId) {
    args.push(`--orden-id=${ordenId}`);
  }
  const proc = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    timeout: 25000,
    windowsHide: true,
  });
  return {
    attempted: true,
    ok: proc.status === 0,
    exitCode: proc.status,
    fileSent: filePath,
    ordenId: ordenId || 'auto',
    stdout: String(proc.stdout || '').trim(),
    stderr: String(proc.stderr || '').trim() || undefined,
  };
}

function formatMarkdownReport(payload) {
  const lines = [];
  lines.push(`## 🇨🇴 Resultado de Consulta Oficial en Portales de Colombia`);
  lines.push(`- **Portal Consultado:** \`${payload.portal}\``);
  if (payload.documento) {
    lines.push(`- **Documento:** ${payload.tipo} ${payload.documento}`);
  }
  if (payload.nombre) {
    lines.push(`- **Nombre / Titular:** ${payload.nombre}`);
  }
  lines.push(`- **Duración Total:** ${(payload.durationMs / 1000).toFixed(2)} s`);
  lines.push(`- **Motor Local:** \`${payload.engineSource}\``);
  lines.push('');

  const items = payload.portal === 'all' ? Object.entries(payload.portals || {}) : [[payload.portal, payload]];
  for (const [pKey, item] of items) {
    const data = item.result || {};
    const saved = item.savedFiles || {};
    const statusLine =
      data.estadoReal ||
      (data.activoEnAlturas
        ? '✅ CURSO DE ALTURAS VIGENTE'
        : data.encontrado === true
          ? 'ℹ️ REGISTRO ENCONTRADO EN MINTRABAJO'
          : data.afiliadoActivo
            ? '✅ AFILIADO ACTIVO'
            : data.status === 'ok'
              ? '✅ CONSULTA COMPLETADA'
              : '⚠️ REVISAR DETALLE');
    lines.push(`### 🔹 Portal: \`${pKey.toUpperCase()}\``);
    lines.push(`- **Estado Oficial:** ${statusLine}`);
    if (data.titular) lines.push(`- **Titular Certificado:** ${data.titular}`);
    if (data.empleador) lines.push(`- **Empleador / Empresa:** ${data.empleador}`);
    if (data.entidad) lines.push(`- **Entidad:** ${data.entidad}`);
    if (data.resumen) lines.push(`- **Resumen:** ${data.resumen}`);
    if (data.ultimoCertificadoAlturas) {
      const c = data.ultimoCertificadoAlturas;
      lines.push(
        `- **Último Curso Alturas:** ${c.programa} (${c.nivel}) · Fin: ${c.fechaFin} · Centro: ${c.organizacion} · Vigente: ${c.vigente ? 'SÍ' : 'NO'}`,
      );
    }
    if (saved.pdfPath) {
      lines.push(
        `- **Certificado PDF (%PDF verificado):** \`${saved.pdfPath}\` (${(saved.pdfSizeBytes / 1024).toFixed(1)} KB · SHA-256: \`${saved.pdfSha256.slice(0, 16)}...\`)`,
      );
    }
    if (saved.pngPath) {
      lines.push(
        `- **Evidencia Visual PNG:** \`${saved.pngPath}\` (${(saved.pngSizeBytes / 1024).toFixed(1)} KB)`,
      );
    }
    if (Array.isArray(data.detalles)) {
      const bolHint = data.detalles.find((d) => d && d.requiereFechaNacimiento);
      if (bolHint) {
        lines.push(
          `- **💡 Nota ARL Seguros Bolívar:** Para verificar afiliación en ARL Seguros Bolívar vuelve a ejecutar con \`--fecha-nacimiento=YYYY-MM-DD\`. (ARL Colmena y AXA Colpatria requieren clave privada del empleador).`,
        );
      }
    }
    lines.push('');
  }

  if (payload.tenshiDelivery?.attempted) {
    lines.push(
      payload.tenshiDelivery.ok
        ? `✅ **Enviado automáticamente al chat de Tenshi:** \`${payload.tenshiDelivery.fileSent}\``
        : `⚠️ **Aviso enviando a Tenshi:** ${payload.tenshiDelivery.stderr || payload.tenshiDelivery.error || 'No confirmado'}`,
    );
  }
  return lines.join('\n');
}

async function runSinglePortal(osintSvc, portal, params) {
  const {
    tipo,
    documento,
    fechaNacimiento,
    nombre,
    placa,
    arl,
    eps,
    afp,
    targetUrl,
    includeEvidence,
    forceEvidence,
  } = params;

  switch (portal) {
    case 'arl':
      return osintSvc.consultarArlRealPorCedula({
        tipoDoc: tipo,
        cedula: documento,
        nombre,
        fechaNacimiento,
        arl,
        includeEvidence,
        vpsSafeDirectFallback: false,
      });
    case 'alturas':
      return osintSvc.consultarAlturasMinTrabajo({
        tipoDoc: tipo,
        cedula: documento,
        includePdf: includeEvidence,
        preferAntigravityDaemon: false,
      });
    case 'eps':
      return osintSvc.consultarSaludRethusRealPorCedula({
        tipoDoc: tipo,
        cedula: documento,
        nombre,
        eps,
      });
    case 'pensiones':
      return osintSvc.consultarPensionesRealPorCedula({
        tipoDoc: tipo,
        cedula: documento,
        nombre,
        afp,
        fechaNacimiento,
        includeEvidence,
      });
    case 'antecedentes':
      return osintSvc.consultarRamaJudicial({
        nombreCompleto: nombre,
        tipoDoc: tipo,
        cedula: documento,
        includeEvidence,
        forceEvidence,
        vpsSafeDirectFallback: false,
      });
    case 'simit':
      return osintSvc.consultarSimitPesvRealPorCedula({
        tipoDoc: tipo,
        cedula: documento,
        nombre,
        placa,
        includeEvidence,
        forceEvidence,
      });
    case 'web':
      return osintSvc.ejecutarWebScrapeConEvidencia({
        targetUrl,
        includeEvidence,
      });
    default:
      throw new Error(`Portal no reconocido: ${portal}`);
  }
}

(async () => {
  const startedAt = Date.now();
  const cliArgs = parseCliArgs(process.argv.slice(2));

  if (cliArgs.help) {
    printHelp();
    process.exit(0);
  }
  if (cliArgs.version) {
    console.log(CLI_VERSION);
    process.exit(0);
  }

  const jsonMode = Boolean(cliArgs.json);
  const logErr = (msg) => process.stderr.write(`${msg}\n`);

  const emitErrorAndExit = (code, message, extra = {}) => {
    if (jsonMode) {
      process.stdout.write(
        `${JSON.stringify({ ok: false, exitCode: code, error: message, ...extra }, null, 2)}\n`,
      );
    } else {
      logErr(`❌ Error: ${message}`);
    }
    process.exit(code);
  };

  const rawPortal = String(cliArgs.portal || 'arl').toLowerCase().trim();
  const portal = PORTAL_ALIASES[rawPortal];
  if (!portal) {
    emitErrorAndExit(
      1,
      `Portal inválido "${rawPortal}". Usa: arl | alturas | eps | pensiones | antecedentes | simit | web | all`,
    );
  }

  const tipo = String(cliArgs.tipo || cliArgs['tipo-doc'] || cliArgs.tipoDoc || 'CC')
    .toUpperCase()
    .trim();
  if (!VALID_DOC_TYPES.has(tipo)) {
    emitErrorAndExit(1, `Tipo de documento inválido "${tipo}". Usa: CC, CE, PPT, TI, NIT, PEP, PA.`);
  }

  const rawDoc = String(
    cliArgs.documento || cliArgs.cedula || cliArgs.doc || cliArgs.id || '',
  ).trim();
  const cleanDoc = rawDoc.replace(/[.\s-]+/g, '').trim();
  const nombre = String(cliArgs.nombre || '').trim();
  const placa = String(cliArgs.placa || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
  const targetUrl = String(cliArgs.url || cliArgs['target-url'] || '').trim();

  let fechaNacimiento = '';
  const rawBirth = cliArgs['fecha-nacimiento'] || cliArgs.fechaNacimiento || '';
  if (rawBirth) {
    const normalizedBirth = normalizeBirthDate(rawBirth);
    if (normalizedBirth === null) {
      emitErrorAndExit(
        1,
        `Formato inválido en --fecha-nacimiento="${rawBirth}". Usa YYYY-MM-DD (ej. 1990-08-25) o DD/MM/YYYY.`,
      );
    }
    fechaNacimiento = normalizedBirth;
  }

  if (portal === 'web') {
    if (!targetUrl) {
      emitErrorAndExit(1, 'El modo --portal=web exige indicar --url=https://...');
    }
  } else if (portal === 'antecedentes') {
    if (!cleanDoc && !nombre) {
      emitErrorAndExit(
        1,
        'El modo --portal=antecedentes exige --documento=<cedula> y/o --nombre="NOMBRES APELLIDOS".',
      );
    }
  } else if (portal === 'simit') {
    if (!cleanDoc && !placa) {
      emitErrorAndExit(1, 'El modo --portal=simit exige --documento=<cedula> y/o --placa=ABC123.');
    }
  } else if (!cleanDoc || cleanDoc.length < 5 || cleanDoc.length > 16) {
    emitErrorAndExit(
      1,
      `Debes suministrar un número de documento válido de 5 a 16 caracteres en --documento=<num> (recibido: "${rawDoc}").`,
    );
  }

  const outDir = expandUserPath(cliArgs['out-dir'] || cliArgs.outDir || '');
  const includeEvidence = !cliArgs['no-evidence'];
  const forceEvidence = Boolean(cliArgs['force-evidence']);
  const enviarTenshi = Boolean(cliArgs['enviar-tenshi'] || cliArgs.enviarTenshi);
  const ordenId = String(cliArgs['orden-id'] || cliArgs.ordenId || '').trim();

  const { wappyUrl, apiKey } = resolveLocalWappyConfig(cliArgs);

  let engineInfo;
  try {
    engineInfo = await loadOsintEngine({
      wappyUrl,
      apiKey,
      forceRefresh: Boolean(cliArgs['refresh-engine']),
      logErr,
    });
  } catch (engErr) {
    emitErrorAndExit(2, `No fue posible cargar ni descargar wappy-osint-portals.js: ${engErr.message}`);
  }

  // En modo --json redirigimos cualquier console.log interno del motor hacia stderr para mantener stdout 100% JSON puro
  const origConsoleLog = console.log;
  const origConsoleInfo = console.info;
  const origConsoleWarn = console.warn;
  if (jsonMode) {
    console.log = (...a) => logErr(a.join(' '));
    console.info = (...a) => logErr(a.join(' '));
    console.warn = (...a) => logErr(a.join(' '));
  }

  try {
    const queryParams = {
      tipo,
      documento: cleanDoc,
      fechaNacimiento,
      nombre,
      placa,
      arl: String(cliArgs.arl || '').trim(),
      eps: String(cliArgs.eps || '').trim(),
      afp: String(cliArgs.afp || '').trim(),
      targetUrl,
      includeEvidence,
      forceEvidence,
    };

    let finalPayload;
    let bestFileToSend = null;
    let bestSummaryForTenshi = '';

    if (portal === 'all') {
      const targetPortals = ['arl', 'alturas', 'eps', 'pensiones', 'antecedentes', 'simit'];
      const portalsOut = {};
      let recoveredName = nombre;

      // Ejecutar ARL y Alturas primero para recuperar el nombre oficial del titular si no se pasó --nombre
      for (const firstKey of ['arl', 'alturas']) {
        const resObj = await runSinglePortal(engineInfo.mod, firstKey, {
          ...queryParams,
          nombre: recoveredName,
        });
        if (!recoveredName && resObj?.titular) {
          recoveredName = resObj.titular;
        }
        const savedFiles = persistPortalEvidence(firstKey, resObj, outDir, cleanDoc);
        if (!bestFileToSend && (savedFiles.pdfPath || savedFiles.pngPath)) {
          bestFileToSend = savedFiles.pdfPath || savedFiles.pngPath;
          bestSummaryForTenshi = `Certificado oficial (${firstKey.toUpperCase()}) de ${recoveredName || cleanDoc}: ${resObj?.estadoReal || resObj?.resumen || 'Verificado'}`;
        }
        portalsOut[firstKey] = {
          savedFiles,
          result: stripLargeBase64FromResult(resObj),
        };
      }

      const restKeys = targetPortals.filter((k) => k !== 'arl' && k !== 'alturas');
      const restResults = await Promise.all(
        restKeys.map(async (k) => {
          const resObj = await runSinglePortal(engineInfo.mod, k, {
            ...queryParams,
            nombre: recoveredName,
          });
          const savedFiles = persistPortalEvidence(k, resObj, outDir, cleanDoc);
          return [k, resObj, savedFiles];
        }),
      );

      for (const [k, resObj, savedFiles] of restResults) {
        if (!bestFileToSend && (savedFiles.pdfPath || savedFiles.pngPath)) {
          bestFileToSend = savedFiles.pdfPath || savedFiles.pngPath;
          bestSummaryForTenshi = `Certificado oficial (${k.toUpperCase()}) de ${recoveredName || cleanDoc}`;
        }
        portalsOut[k] = {
          savedFiles,
          result: stripLargeBase64FromResult(resObj),
        };
      }

      finalPayload = {
        ok: true,
        cliVersion: CLI_VERSION,
        portal: 'all',
        tipo,
        documento: cleanDoc,
        nombre: recoveredName || null,
        fechaNacimiento: fechaNacimiento || null,
        placa: placa || null,
        outDir,
        engineSource: engineInfo.source,
        durationMs: Date.now() - startedAt,
        portals: portalsOut,
      };
    } else {
      const resObj = await runSinglePortal(engineInfo.mod, portal, queryParams);
      const savedFiles = persistPortalEvidence(portal, resObj, outDir, cleanDoc || 'Web');
      const cleanRes = stripLargeBase64FromResult(resObj);
      const holder = cleanRes?.titular || cleanRes?.nombre || cleanRes?.nombreConsultado || nombre || null;

      if (savedFiles.pdfPath || savedFiles.pngPath) {
        bestFileToSend = savedFiles.pdfPath || savedFiles.pngPath;
        bestSummaryForTenshi = `Certificado oficial (${portal.toUpperCase()}) — ${holder ? `${holder} (${tipo} ${cleanDoc})` : `${tipo} ${cleanDoc}`}: ${cleanRes?.estadoReal || cleanRes?.resumen || 'Consulta oficial verificada'}.`;
      }

      finalPayload = {
        ok: true,
        cliVersion: CLI_VERSION,
        portal,
        tipo,
        documento: cleanDoc || null,
        nombre: holder,
        fechaNacimiento: fechaNacimiento || null,
        placa: placa || null,
        outDir,
        engineSource: engineInfo.source,
        durationMs: Date.now() - startedAt,
        afiliadoActivo: Boolean(cleanRes?.afiliadoActivo || cleanRes?.activoEnAlturas),
        tieneCertificado: Boolean(savedFiles.pdfPath || savedFiles.pngPath),
        estadoReal:
          cleanRes?.estadoReal ||
          (cleanRes?.activoEnAlturas
            ? '✅ CURSO DE ALTURAS VIGENTE'
            : cleanRes?.encontrado === false && portal === 'alturas'
              ? '⚪ SIN CURSO REGISTRADO EN MINTRABAJO'
              : cleanRes?.status === 'ok'
                ? '✅ CONSULTA OFICIAL COMPLETADA'
                : '⚠️ REVISAR DETALLE'),
        savedFiles,
        result: cleanRes,
      };
    }

    if (enviarTenshi) {
      if (bestFileToSend) {
        finalPayload.tenshiDelivery = sendCertificateToTenshi({
          filePath: bestFileToSend,
          ordenId,
          summaryText: bestSummaryForTenshi,
        });
      } else {
        finalPayload.tenshiDelivery = {
          attempted: false,
          ok: false,
          reason:
            'La consulta no generó certificado PDF/PNG (por ejemplo, ciudadano sin afiliación activa en el portal consultado).',
        };
      }
    }

    // Restaurar stdout antes de imprimir el resultado final
    console.log = origConsoleLog;
    console.info = origConsoleInfo;
    console.warn = origConsoleWarn;

    if (jsonMode) {
      process.stdout.write(`${JSON.stringify(finalPayload, null, 2)}\n`);
    } else {
      console.log(formatMarkdownReport(finalPayload));
    }
    process.exit(0);
  } catch (runErr) {
    console.log = origConsoleLog;
    console.info = origConsoleInfo;
    console.warn = origConsoleWarn;
    emitErrorAndExit(2, `Fallo ejecutando consulta en portal "${portal}": ${runErr.message}`);
  }
})();
