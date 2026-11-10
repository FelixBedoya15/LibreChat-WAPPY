const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const zlib = require('zlib');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');
const { pathToFileURL } = require('url');

let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
} catch (_) {}

const execFileAsync = promisify(execFile);

let logger = console;
try {
  const cfg = require('~/config');
  if (cfg?.logger) logger = cfg.logger;
} catch (_) {}

const MINTRABAJO_BASE_URL = 'https://app2.mintrabajo.gov.co/CentrosEntrenamiento';
const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
};

const portalLiveScreenshotCache = new Map();
const portalLiveScreenshotInFlight = new Map();
const portalProbeCache = new Map();
const portalProbeInFlight = new Map();

const MAX_CONCURRENT_CHROME = 2;
let activeChromeSlots = 0;
const chromeWaitQueue = [];

function acquireChromeSlot() {
  if (activeChromeSlots < MAX_CONCURRENT_CHROME) {
    activeChromeSlots += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    chromeWaitQueue.push(resolve);
  });
}

function releaseChromeSlot() {
  const next = chromeWaitQueue.shift();
  if (next) {
    next();
  } else {
    activeChromeSlots = Math.max(0, activeChromeSlots - 1);
  }
}

async function runWithChromeSlot(fn) {
  await acquireChromeSlot();
  try {
    return await fn();
  } finally {
    releaseChromeSlot();
  }
}

function escapeHtmlText(val = '') {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeFileStem(raw = '', fallback = 'Constancia_Oficial') {
  const clean = String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.(pdf|png|jpe?g)$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 90);
  return clean || fallback;
}

function resolveChromeBinaryPath() {
  const envBin = process.env.CHROME_BIN || process.env.PUPPETEER_EXECUTABLE_PATH || '';
  if (envBin && fs.existsSync(envBin)) return envBin;

  const candidates = [];
  if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    );
  } else if (process.platform === 'win32') {
    const pf = process.env.ProgramFiles || 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const localApp = process.env.LOCALAPPDATA || '';
    candidates.push(
      path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    );
    if (localApp) {
      candidates.push(path.join(localApp, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    }
  } else {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
    );
  }

  for (const bin of candidates) {
    try {
      if (bin && fs.existsSync(bin)) return bin;
    } catch (_) {}
  }
  return null;
}

/**
 * Convierte un PDF en base64 a imagen PNG en base64 puro (sin prefijo data:).
 * - macOS: usa /usr/bin/sips (~80ms).
 * - Linux/Contenedor: usa pdftoppm si está disponible, o retorna null limpiamente.
 */
async function convertPdfBase64ToPngBase64(pdfBase64) {
  if (!pdfBase64 || typeof pdfBase64 !== 'string') return null;
  const cleanB64 = pdfBase64.replace(/^data:application\/pdf;base64,/i, '').trim();
  if (!cleanB64) return null;

  let pdfBuf;
  try {
    pdfBuf = Buffer.from(cleanB64, 'base64');
  } catch (_) {
    return null;
  }
  if (!pdfBuf || pdfBuf.length < 64 || !pdfBuf.subarray(0, 5).toString('ascii').startsWith('%PDF')) {
    return null;
  }

  const uid = `wappy_pdf2png_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const tmpDir = os.tmpdir();
  const pdfPath = path.join(tmpDir, `${uid}.pdf`);
  const pngPath = path.join(tmpDir, `${uid}.png`);
  const outPrefix = path.join(tmpDir, uid);

  try {
    await fs.promises.writeFile(pdfPath, pdfBuf);

    if (process.platform === 'darwin') {
      const sipsBin = fs.existsSync('/usr/bin/sips') ? '/usr/bin/sips' : 'sips';
      try {
        await execFileAsync(sipsBin, ['-s', 'format', 'png', pdfPath, '--out', pngPath], {
          timeout: 6000,
        });
      } catch (_) {
        const qlBin = fs.existsSync('/usr/bin/qlmanage') ? '/usr/bin/qlmanage' : 'qlmanage';
        await execFileAsync(qlBin, ['-t', '-s', '1200', '-o', tmpDir, pdfPath], {
          timeout: 6000,
        }).catch(() => {});
        const qlOut = `${pdfPath}.png`;
        if (fs.existsSync(qlOut) && !fs.existsSync(pngPath)) {
          await fs.promises.rename(qlOut, pngPath).catch(() => {});
        }
      }
      if (fs.existsSync(pngPath)) {
        const pngBuf = await fs.promises.readFile(pngPath);
        if (
          pngBuf.length > 500 &&
          pngBuf[0] === 0x89 &&
          pngBuf[1] === 0x50 &&
          pngBuf[2] === 0x4e &&
          pngBuf[3] === 0x47
        ) {
          return pngBuf.toString('base64');
        }
      }
      return null;
    }

    try {
      await execFileAsync('pdftoppm', ['-png', '-r', '150', '-singlefile', pdfPath, outPrefix], {
        timeout: 8000,
      });
      if (fs.existsSync(pngPath)) {
        const pngBuf = await fs.promises.readFile(pngPath);
        if (
          pngBuf.length > 500 &&
          pngBuf[0] === 0x89 &&
          pngBuf[1] === 0x50 &&
          pngBuf[2] === 0x4e &&
          pngBuf[3] === 0x47
        ) {
          return pngBuf.toString('base64');
        }
      }
    } catch (_) {
      return null;
    }
    return null;
  } catch (err) {
    logger.warn(`[OSINT PDF->PNG] Aviso convirtiendo PDF a PNG: ${err.message}`);
    return null;
  } finally {
    await fs.promises.unlink(pdfPath).catch(() => {});
    await fs.promises.unlink(pngPath).catch(() => {});
  }
}

/**
 * Captura evidencia oficial en PDF (%PDF) e imagen PNG (\x89PNG) a partir de una URL en vivo
 * o de una constancia HTML institucional usando Google Chrome Headless (o Puppeteer como respaldo).
 */
async function captureWebOrHtmlEvidence({
  url = '',
  htmlContent = '',
  filePrefix = 'Constancia_Oficial',
  timeoutMs = 12000,
} = {}) {
  const safePrefix = sanitizeFileStem(filePrefix, 'Constancia_Oficial');
  const hasHtml = Boolean(htmlContent && String(htmlContent).trim());
  const cleanUrl = String(url || '').trim();
  if (!hasHtml && !cleanUrl) {
    return { pdfBase64: null, pdfFileName: null, imageBase64: null, imageFileName: null };
  }

  return runWithChromeSlot(async () => {
    let tmpDir = '';
    let pdfBase64 = null;
    let imageBase64 = null;

    try {
      tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'wappy_evid_'));
      const profileDir = path.join(tmpDir, 'chrome_prof');
      const htmlPath = path.join(tmpDir, 'constancia.html');
      const pdfPath = path.join(tmpDir, 'out.pdf');
      const pngPath = path.join(tmpDir, 'out.png');

      let target = cleanUrl;
      if (hasHtml) {
        await fs.promises.writeFile(htmlPath, String(htmlContent), 'utf8');
        target = pathToFileURL(htmlPath).href;
      }

      const chromeBin = resolveChromeBinaryPath();
      if (chromeBin) {
        try {
          const chromeArgs = [
            '--headless=new',
            '--disable-gpu',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-sync',
            '--disable-translate',
            '--metrics-recording-only',
            '--safebrowsing-disable-auto-update',
            '--disable-component-update',
            '--disable-default-apps',
            '--ignore-certificate-errors',
            '--hide-scrollbars',
            '--window-size=1280,960',
            `--user-data-dir=${profileDir}`,
            '--no-first-run',
            '--no-default-browser-check',
            `--print-to-pdf=${pdfPath}`,
            '--no-pdf-header-footer',
          ];
          if (!hasHtml) {
            chromeArgs.push('--virtual-time-budget=3500');
          }
          chromeArgs.push(target);

          const hardLimitMs = Math.min(Number(timeoutMs) || 12000, hasHtml ? 8500 : 9000);
          await new Promise((resolve) => {
            let settled = false;
            const finish = () => {
              if (settled) return;
              settled = true;
              clearTimeout(killTimer);
              resolve();
            };
            let child;
            try {
              child = spawn(chromeBin, chromeArgs, {
                stdio: 'ignore',
                detached: process.platform !== 'win32',
                windowsHide: true,
              });
            } catch (_) {
              settled = true;
              resolve();
              return;
            }
            const killTimer = setTimeout(() => {
              try {
                if (child.pid && process.platform !== 'win32') {
                  process.kill(-child.pid, 'SIGKILL');
                }
              } catch (_) {}
              try {
                child.kill('SIGKILL');
              } catch (_) {}
              finish();
            }, hardLimitMs);
            child.on('exit', finish);
            child.on('close', finish);
            child.on('error', finish);
          });

          if (fs.existsSync(pdfPath)) {
            const pBuf = await fs.promises.readFile(pdfPath);
            if (pBuf.length > 200 && pBuf.subarray(0, 5).toString('ascii').startsWith('%PDF')) {
              pdfBase64 = pBuf.toString('base64');
              imageBase64 = await convertPdfBase64ToPngBase64(pdfBase64);
            }
          }
        } catch (chromeErr) {
          logger.warn(`[OSINT Chrome Evidence] Aviso capturando ${safePrefix}: ${chromeErr.message}`);
        }
      }

      // Respaldo con Puppeteer en contenedor Linux o entornos sin binario Chrome estándar
      if (!pdfBase64 && !imageBase64 && (process.platform !== 'darwin' || !chromeBin)) {
        let puppeteerMod = null;
        try {
          puppeteerMod = require('puppeteer');
        } catch (_) {
          try {
            puppeteerMod = require('puppeteer-core');
          } catch (__) {}
        }
        if (puppeteerMod && typeof puppeteerMod.launch === 'function') {
          let browser = null;
          try {
            const launchOpts = {
              headless: 'new',
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--ignore-certificate-errors',
              ],
            };
            if (chromeBin) launchOpts.executablePath = chromeBin;
            browser = await puppeteerMod.launch(launchOpts);
            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 960 });
            if (hasHtml) {
              await page.setContent(String(htmlContent), { waitUntil: 'load', timeout: timeoutMs });
            } else {
              await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
            }
            const iBuf = Buffer.from(await page.screenshot({ type: 'png' }));
            if (iBuf.length > 500) imageBase64 = iBuf.toString('base64');
            const pBuf = Buffer.from(await page.pdf({ format: 'A4', printBackground: true }));
            if (pBuf.length > 200 && pBuf.subarray(0, 5).toString('ascii').startsWith('%PDF')) {
              pdfBase64 = pBuf.toString('base64');
            }
          } catch (pupErr) {
            logger.warn(`[OSINT Puppeteer Evidence] Aviso capturando ${safePrefix}: ${pupErr.message}`);
          } finally {
            if (browser) await browser.close().catch(() => {});
          }
        }
      }

      if (pdfBase64 && !imageBase64) {
        imageBase64 = await convertPdfBase64ToPngBase64(pdfBase64);
      }
    } catch (err) {
      logger.warn(`[OSINT Capture Evidence] Error general en ${safePrefix}: ${err.message}`);
    } finally {
      if (tmpDir) {
        await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      }
    }

    return {
      pdfBase64: pdfBase64 || null,
      pdfFileName: pdfBase64 ? `${safePrefix}.pdf` : null,
      imageBase64: imageBase64 || null,
      imageFileName: imageBase64 ? `${safePrefix}.png` : null,
    };
  });
}

/**
 * Decodifica entidades HTML comunes y numéricas en textos extraídos de ASP.NET GridViews.
 */
function decodeHtmlEntities(str = '') {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrae el valor de un input oculto de ASP.NET WebForms (__VIEWSTATE, __VIEWSTATEGENERATOR, __EVENTVALIDATION).
 */
function extractHiddenInput(html = '', fieldName = '') {
  if (!html || !fieldName) return '';
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const byId = html.match(new RegExp(`id="${escaped}"[^>]*value="([^"]*)"`, 'i'));
  if (byId) return byId[1];
  const byName = html.match(new RegExp(`name="${escaped}"[^>]*value="([^"]*)"`, 'i'));
  if (byName) return byName[1];
  const valueFirst = html.match(new RegExp(`value="([^"]*)"[^>]*id="${escaped}"`, 'i'));
  return valueFirst ? valueFirst[1] : '';
}

/**
 * Combina cookies Set-Cookie de fetch en un encabezado Cookie unificado.
 */
function mergeCookies(res, existingCookieHeader = '') {
  const cookieMap = new Map();
  if (existingCookieHeader) {
    existingCookieHeader.split(';').forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const k = pair.slice(0, idx).trim();
        const v = pair.slice(idx + 1).trim();
        if (k) cookieMap.set(k, v);
      }
    });
  }

  let rawCookies = [];
  if (res?.headers) {
    if (typeof res.headers.getSetCookie === 'function') {
      rawCookies = res.headers.getSetCookie();
    } else {
      const sc = res.headers.get('set-cookie');
      if (sc) rawCookies = [sc];
    }
  }

  for (const raw of rawCookies) {
    if (!raw) continue;
    const firstPart = raw.split(';')[0];
    const idx = firstPart.indexOf('=');
    if (idx > 0) {
      const k = firstPart.slice(0, idx).trim();
      const v = firstPart.slice(idx + 1).trim();
      if (k) cookieMap.set(k, v);
    }
  }

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

/**
 * Convierte fecha DD/MM/YYYY a ISO YYYY-MM-DD y calcula meses transcurridos.
 */
function parseMinTrabajoDate(fechaStr = '') {
  const clean = String(fechaStr || '').trim();
  const parts = clean.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    if (y && m && d) {
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      if (!isNaN(dateObj.getTime())) {
        const iso = dateObj.toISOString().split('T')[0];
        const diffMs = Date.now() - dateObj.getTime();
        const meses = Math.max(0, Number((diffMs / (1000 * 60 * 60 * 24 * 30.4375)).toFixed(1)));
        return {
          fechaFinISO: iso,
          mesesTranscurridos: meses,
          vigente: meses <= 18, // Res. 4272 de 2021 Art. 30
        };
      }
    }
  }
  return {
    fechaFinISO: clean,
    mesesTranscurridos: 999,
    vigente: false,
  };
}

/**
 * Extrae el titular y la lista de certificados desde el HTML de consulta_lista.aspx.
 */
function parseMinTrabajoListaHtml(htmlLista = '', fallbackDoc = '') {
  const extractLabel = (idSuffix) => {
    const m = htmlLista.match(new RegExp(`${idSuffix}"[^>]*>([^<]*)<`, 'i'));
    return m ? decodeHtmlEntities(m[1]) : '';
  };

  const pNombre = extractLabel('primer_nombreLabel_0');
  const sNombre = extractLabel('segundo_normbreLabel_0') || extractLabel('segundo_nombreLabel_0');
  const pApellido = extractLabel('primer_apellidoLabel_0');
  const sApellido = extractLabel('segundo_apellidoLabel_0');

  const titular = [pNombre, sNombre, pApellido, sApellido].filter(Boolean).join(' ').trim() || null;

  const historialCompleto = [];
  const trBlocks = htmlLista.split(/<tr[^>]*>/i);

  for (const block of trBlocks) {
    const trContent = block.split(/<\/tr>/i)[0] || '';
    if (!trContent.includes('__doPostBack')) continue;

    const tdMatches = Array.from(trContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
    if (tdMatches.length < 8) continue;

    const pbMatch = tdMatches[7][1].match(/__doPostBack\((?:&#39;|'|&apos;|")([^'"&]+)(?:&#39;|'|&apos;|")/i);
    if (!pbMatch) continue;

    const cleanCell = (idx) => decodeHtmlEntities(tdMatches[idx][1].replace(/<[^>]+>/g, ''));
    const programa = cleanCell(0);
    const nivel = cleanCell(1);
    const documento = cleanCell(2) || fallbackDoc;
    const fechaInicio = cleanCell(3);
    const fechaFin = cleanCell(4);
    const organizacion = cleanCell(5);
    const sede = cleanCell(6);
    const eventTarget = String(pbMatch[1] || '').trim();

    const { fechaFinISO, mesesTranscurridos, vigente } = parseMinTrabajoDate(fechaFin);

    historialCompleto.push({
      programa,
      nivel,
      documento,
      fechaInicio,
      fechaFin,
      fechaFinISO,
      organizacion,
      sede,
      eventTarget,
      mesesTranscurridos,
      vigente,
    });
  }

  historialCompleto.sort((a, b) => String(b.fechaFinISO).localeCompare(String(a.fechaFinISO)));

  return { titular, historialCompleto };
}

const MAX_CONCURRENT_MINTRABAJO = 5;
let activeMinTrabajoSlots = 0;
const minTrabajoWaitQueue = [];

function acquireMinTrabajoSlot() {
  if (activeMinTrabajoSlots < MAX_CONCURRENT_MINTRABAJO) {
    activeMinTrabajoSlots += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    minTrabajoWaitQueue.push(resolve);
  });
}

function releaseMinTrabajoSlot() {
  const next = minTrabajoWaitQueue.shift();
  if (next) {
    next();
  } else {
    activeMinTrabajoSlots = Math.max(0, activeMinTrabajoSlots - 1);
  }
}

async function runWithMinTrabajoSlot(fn) {
  await acquireMinTrabajoSlot();
  try {
    return await fn();
  } finally {
    releaseMinTrabajoSlot();
  }
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ejecuta la sesión inicial GET -> POST consulta_ext.aspx -> GET consulta_lista.aspx en MinTrabajo.
 */
async function executeMinTrabajoSession({ tipoDoc = 'CC', cedula = '', isLocalDaemon = false } = {}) {
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();
  const cleanCedula = String(cedula || '').trim();
  const initialGetTimeoutMs = isLocalDaemon === true ? 15000 : 2500;
  const maxAttempts = isLocalDaemon === true ? 2 : 1;

  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 1. GET consulta_ext.aspx (15s en daemon local IP Colombia; 2.5s en VPS para detectar geo-bloqueo rápido)
      const getRes = await fetch(`${MINTRABAJO_BASE_URL}/consulta_ext.aspx`, {
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(initialGetTimeoutMs),
      });
      let cookieHeader = mergeCookies(getRes);
      const htmlExt = await getRes.text();

      const viewState = extractHiddenInput(htmlExt, '__VIEWSTATE');
      const viewStateGenerator = extractHiddenInput(htmlExt, '__VIEWSTATEGENERATOR');
      const eventValidation = extractHiddenInput(htmlExt, '__EVENTVALIDATION');

      // 2. POST consulta_ext.aspx (redirect: 'manual')
      const form = new URLSearchParams({
        __EVENTTARGET: '',
        __EVENTARGUMENT: '',
        __VIEWSTATE: viewState,
        __VIEWSTATEGENERATOR: viewStateGenerator,
        __EVENTVALIDATION: eventValidation,
        'ctl00$contenido$tipo_documentoTextBox': cleanTipoDoc,
        'ctl00$contenido$valor_consulta': cleanCedula,
        'ctl00$contenido$consultar': 'Consultar',
      });

      const postRes = await fetch(`${MINTRABAJO_BASE_URL}/consulta_ext.aspx`, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookieHeader,
          Referer: `${MINTRABAJO_BASE_URL}/consulta_ext.aspx`,
        },
        body: form.toString(),
        redirect: 'manual',
        signal: AbortSignal.timeout(15000),
      });
      cookieHeader = mergeCookies(postRes, cookieHeader);

      // 3. GET consulta_lista.aspx
      const listaRes = await fetch(`${MINTRABAJO_BASE_URL}/consulta_lista.aspx`, {
        headers: {
          ...DEFAULT_HEADERS,
          Cookie: cookieHeader,
          Referer: `${MINTRABAJO_BASE_URL}/consulta_ext.aspx`,
        },
        signal: AbortSignal.timeout(15000),
      });
      cookieHeader = mergeCookies(listaRes, cookieHeader);
      const htmlLista = await listaRes.text();

      return { cookieHeader, htmlLista, cleanTipoDoc, cleanCedula };
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await sleepMs(600);
      }
    }
  }
  throw lastErr;
}

/**
 * Descarga el binario PDF de una fila específica de consulta_lista.aspx (con 1 reintento rápido).
 */
async function postDownloadPdfFromLista({ cookieHeader, htmlLista, eventTarget }) {
  const formPayload = {
    __EVENTTARGET: eventTarget,
    __EVENTARGUMENT: '',
    __VIEWSTATE: extractHiddenInput(htmlLista, '__VIEWSTATE'),
    __VIEWSTATEGENERATOR: extractHiddenInput(htmlLista, '__VIEWSTATEGENERATOR'),
  };
  const eventValidation = extractHiddenInput(htmlLista, '__EVENTVALIDATION');
  if (eventValidation) {
    formPayload.__EVENTVALIDATION = eventValidation;
  }

  const pdfFormBody = new URLSearchParams(formPayload).toString();

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const pdfRes = await fetch(`${MINTRABAJO_BASE_URL}/consulta_lista.aspx`, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookieHeader,
          Referer: `${MINTRABAJO_BASE_URL}/consulta_lista.aspx`,
        },
        body: pdfFormBody,
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      });

      const arrayBuffer = await pdfRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const headerStr = buffer.subarray(0, 5).toString('ascii');
      if (headerStr.startsWith('%PDF')) {
        return buffer.toString('base64');
      }
    } catch (err) {
      if (attempt >= 2) throw err;
    }
    if (attempt < 2) {
      await sleepMs(500);
    }
  }
  return null;
}

function enrichMinTrabajoResult(baseObj = {}, viaDaemon = false) {
  const hist = Array.isArray(baseObj.historialCompleto) ? baseObj.historialCompleto : [];
  const cursos = Array.isArray(baseObj.cursos) && baseObj.cursos.length > 0
    ? baseObj.cursos
    : hist.map((c) => ({
        programa: c.programa,
        nivel: c.nivel,
        entrenador: c.organizacion,
        sede: c.sede,
        fechaInicio: c.fechaInicio,
        fechaTerminacion: c.fechaFin || c.fechaFinISO,
        fechaFinISO: c.fechaFinISO,
        nroCertificado: c.documento,
        vigente: c.vigente,
        mesesTranscurridos: c.mesesTranscurridos,
      }));
  const latest = cursos[0] || null;
  const diasDesdeUltimoCurso = latest?.mesesTranscurridos != null
    ? Math.round(Number(latest.mesesTranscurridos) * 30.4375)
    : null;
  const isVig = Boolean(baseObj.activoEnAlturas || baseObj.activoEnConfinados || latest?.vigente);
  const status = baseObj.status || (cursos.length > 0 ? (isVig ? 'ok' : 'warning') : 'ok');
  const fuente =
    baseObj.fuente ||
    (viaDaemon || baseObj.viaAntigravityDaemon
      ? `Google Antigravity (${baseObj.resolvedEnv === 'cloud' ? 'Cloud 24/7' : 'Local IP Colombia'} · MinTrabajo)`
      : 'MinTrabajo Oficial');
  const resumen =
    baseObj.resumen ||
    (cursos.length > 0
      ? `Titular: ${baseObj.titular || 'Registrado'} · ${cursos.length} curso(s) en MinTrabajo (${latest.programa || latest.nivel} — ${latest.fechaTerminacion || ''}, Centro: ${latest.entrenador || 'Autorizado'})`
      : `Sin certificados de Trabajo en Alturas ni Espacios Confinados registrados en MinTrabajo para ${baseObj.tipoDoc || 'CC'} ${baseObj.documento || ''}.`);

  return {
    ...baseObj,
    pdfBase64: baseObj.pdfBase64 || null,
    pdfFileName: baseObj.pdfFileName || null,
    imageBase64: baseObj.imageBase64 || null,
    imageFileName: baseObj.imageFileName || null,
    viaAntigravityDaemon: Boolean(viaDaemon || baseObj.viaAntigravityDaemon),
    fuente,
    status,
    resumen,
    cursos,
    diasDesdeUltimoCurso,
  };
}

/**
 * Consulta Certificados de Trabajo en Alturas y Espacios Confinados en MinTrabajo
 * y descarga opcionalmente el PDF e imagen PNG de la constancia más reciente en base64.
 */
async function consultarAlturasMinTrabajo({
  tipoDoc = 'CC',
  cedula,
  includePdf = true,
  userId = '',
  antigravityMode = 'auto',
  preferAntigravityDaemon = true,
} = {}) {
  const cleanCedula = String(cedula || '').trim();
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();

  if (!cleanCedula) {
    return enrichMinTrabajoResult({
      encontrado: false,
      activoEnAlturas: false,
      activoEnConfinados: false,
      documento: '',
      tipoDoc: cleanTipoDoc,
      titular: null,
      ultimoCertificadoAlturas: null,
      ultimoCertificadoConfinados: null,
      pdfBase64: null,
      pdfFileName: null,
      imageBase64: null,
      imageFileName: null,
      historialCompleto: [],
      viaAntigravityDaemon: false,
    });
  }

  // 1. Priorizar el Túnel Reactivo de Google Antigravity (wappy-push-daemon en IP Colombia) cuando está conectado
  if (preferAntigravityDaemon && typeof global.dispatchOsintViaAntigravityDaemon === 'function') {
    try {
      const relayedFirst = await global.dispatchOsintViaAntigravityDaemon({
        userId: String(userId || ''),
        action: 'query',
        tipoDoc: cleanTipoDoc,
        cedula: cleanCedula,
        includePdf,
        antigravityMode,
        timeoutMs: includePdf ? 35000 : 18000,
      });
      if (relayedFirst && typeof relayedFirst === 'object') {
        if (relayedFirst.status === 'offline_local' || relayedFirst.status === 'offline_cloud') {
          return {
            encontrado: false,
            activoEnAlturas: false,
            activoEnConfinados: false,
            documento: cleanCedula,
            tipoDoc: cleanTipoDoc,
            titular: null,
            ultimoCertificadoAlturas: null,
            ultimoCertificadoConfinados: null,
            pdfBase64: null,
            pdfFileName: null,
            imageBase64: null,
            imageFileName: null,
            historialCompleto: [],
            cursos: [],
            viaAntigravityDaemon: false,
            status: relayedFirst.status,
            fuente: `Google Antigravity (${antigravityMode.toUpperCase()} — Desconectado)`,
            resumen: relayedFirst.error,
            error: relayedFirst.error,
            antigravityModeUsed: relayedFirst.antigravityModeUsed || antigravityMode,
          };
        }
        if (relayedFirst.pdfBase64 && !relayedFirst.imageBase64) {
          const convertedImg = await convertPdfBase64ToPngBase64(relayedFirst.pdfBase64);
          if (convertedImg) {
            relayedFirst.imageBase64 = convertedImg;
            relayedFirst.imageFileName = String(
              relayedFirst.pdfFileName || `Constancia_Alturas_${cleanCedula}_oficial.pdf`,
            ).replace(/\.pdf$/i, '.png');
          }
        }
        return enrichMinTrabajoResult(relayedFirst, true);
      }
    } catch (relayFirstErr) {
      logger.warn(
        `[OSINT MinTrabajo] Aviso en intento prioritario por daemon Antigravity para ${cleanCedula}: ${relayFirstErr.message}`,
      );
    }
  }

  try {
    const isLocalExecution = !preferAntigravityDaemon;
    const sessionAndPdf = await runWithMinTrabajoSlot(async () => {
      const { cookieHeader, htmlLista } = await executeMinTrabajoSession({
        tipoDoc: cleanTipoDoc,
        cedula: cleanCedula,
        isLocalDaemon: isLocalExecution,
      });

      if (
        !htmlLista ||
        htmlLista.includes('No se encontraron resultados para la consulta realizada')
      ) {
        return { empty: true };
      }

      const { titular, historialCompleto } = parseMinTrabajoListaHtml(htmlLista, cleanCedula);
      if (historialCompleto.length === 0 && !titular) {
        return { empty: true };
      }

      const ultimoCertificadoAlturas =
        historialCompleto.find((c) => c.programa.toUpperCase().includes('ALTURAS')) || null;
      const ultimoCertificadoConfinados =
        historialCompleto.find((c) => c.programa.toUpperCase().includes('CONFINADOS')) || null;
      const certParaPdf =
        ultimoCertificadoAlturas || ultimoCertificadoConfinados || historialCompleto[0] || null;

      let downloadedPdfBase64 = null;
      let baseStem = null;
      if (includePdf && historialCompleto.length > 0 && certParaPdf?.eventTarget) {
        try {
          downloadedPdfBase64 = await postDownloadPdfFromLista({
            cookieHeader,
            htmlLista,
            eventTarget: certParaPdf.eventTarget,
          });
          if (downloadedPdfBase64) {
            const progUpper = String(certParaPdf.programa || '').toUpperCase();
            const tipoTag = progUpper.includes('CONFINADOS')
              ? 'Confinados'
              : progUpper.includes('ALTURAS')
                ? 'Alturas'
                : 'MinTrabajo';
            baseStem = `Constancia_${tipoTag}_${cleanCedula}_${certParaPdf.fechaFinISO || 'oficial'}`;
          }
        } catch (pdfErr) {
          logger.warn(
            `[OSINT MinTrabajo] No se pudo descargar el PDF automático para ${cleanCedula}: ${pdfErr.message}`,
          );
        }
      }

      return {
        empty: false,
        titular,
        historialCompleto,
        ultimoCertificadoAlturas,
        ultimoCertificadoConfinados,
        downloadedPdfBase64,
        baseStem,
      };
    });

    if (sessionAndPdf.empty) {
      return enrichMinTrabajoResult({
        encontrado: false,
        activoEnAlturas: false,
        activoEnConfinados: false,
        documento: cleanCedula,
        tipoDoc: cleanTipoDoc,
        titular: null,
        ultimoCertificadoAlturas: null,
        ultimoCertificadoConfinados: null,
        pdfBase64: null,
        pdfFileName: null,
        imageBase64: null,
        imageFileName: null,
        historialCompleto: [],
      });
    }

    const {
      titular,
      historialCompleto,
      ultimoCertificadoAlturas,
      ultimoCertificadoConfinados,
      downloadedPdfBase64,
      baseStem,
    } = sessionAndPdf;

    let pdfBase64 = downloadedPdfBase64 || null;
    let pdfFileName = pdfBase64 && baseStem ? `${baseStem}.pdf` : null;
    let imageBase64 = null;
    let imageFileName = null;

    if (pdfBase64 && baseStem) {
      imageBase64 = await convertPdfBase64ToPngBase64(pdfBase64);
      if (imageBase64) {
        imageFileName = `${baseStem}.png`;
      }
    }

    return enrichMinTrabajoResult({
      encontrado: true,
      activoEnAlturas: Boolean(ultimoCertificadoAlturas?.vigente),
      activoEnConfinados: Boolean(ultimoCertificadoConfinados?.vigente),
      documento: cleanCedula,
      tipoDoc: cleanTipoDoc,
      titular,
      ultimoCertificadoAlturas,
      ultimoCertificadoConfinados,
      pdfBase64,
      pdfFileName,
      imageBase64,
      imageFileName,
      historialCompleto,
    });
  } catch (error) {
    if (typeof global.dispatchOsintViaAntigravityDaemon === 'function') {
      try {
        logger.info(`[OSINT MinTrabajo] Reenviando consulta de cédula ${cleanCedula} por túnel IP Colombia (wappy-push-daemon)...`);
        const relayed = await global.dispatchOsintViaAntigravityDaemon({
          userId: String(userId || ''),
          action: 'query',
          tipoDoc: cleanTipoDoc,
          cedula: cleanCedula,
          includePdf,
          antigravityMode,
          timeoutMs: includePdf ? 35000 : 18000,
        });
        if (relayed && typeof relayed === 'object') {
          if (relayed.pdfBase64 && !relayed.imageBase64) {
            const convertedImg = await convertPdfBase64ToPngBase64(relayed.pdfBase64);
            if (convertedImg) {
              relayed.imageBase64 = convertedImg;
              relayed.imageFileName = String(
                relayed.pdfFileName || `Constancia_Alturas_${cleanCedula}_oficial.pdf`,
              ).replace(/\.pdf$/i, '.png');
            }
          }
          return enrichMinTrabajoResult(relayed, true);
        }
      } catch (relayErr) {
        logger.warn(`[OSINT MinTrabajo] Falló relay por daemon para ${cleanCedula}: ${relayErr.message}`);
      }
    }
    logger.warn(`[OSINT MinTrabajo] Error consultando cédula ${cleanCedula}: ${error.message}`);
    return enrichMinTrabajoResult({
      encontrado: false,
      activoEnAlturas: false,
      activoEnConfinados: false,
      documento: cleanCedula,
      tipoDoc: cleanTipoDoc,
      titular: null,
      ultimoCertificadoAlturas: null,
      ultimoCertificadoConfinados: null,
      pdfBase64: null,
      pdfFileName: null,
      imageBase64: null,
      imageFileName: null,
      historialCompleto: [],
      status: 'blocked',
      error: error.message,
    });
  }
}

/**
 * Descarga bajo demanda el PDF e imagen PNG de cualquier constancia de MinTrabajo (por eventTarget o la más reciente disponible).
 */
async function descargarPdfConstanciaMinTrabajo({ tipoDoc = 'CC', cedula, eventTarget } = {}) {
  const cleanCedula = String(cedula || '').trim();
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();

  if (!cleanCedula) {
    return {
      ok: false,
      pdfBase64: null,
      pdfFileName: null,
      imageBase64: null,
      imageFileName: null,
      error: 'El número de documento (cédula) es obligatorio.',
    };
  }

  try {
    const slotResult = await runWithMinTrabajoSlot(async () => {
      const { cookieHeader, htmlLista } = await executeMinTrabajoSession({
        tipoDoc: cleanTipoDoc,
        cedula: cleanCedula,
        isLocalDaemon: true,
      });

      if (
        !htmlLista ||
        htmlLista.includes('No se encontraron resultados para la consulta realizada')
      ) {
        return {
          ok: false,
          error: 'No se encontraron certificados registrados en MinTrabajo para este documento.',
        };
      }

      const { historialCompleto } = parseMinTrabajoListaHtml(htmlLista, cleanCedula);
      if (historialCompleto.length === 0) {
        return {
          ok: false,
          error: 'No se encontraron filas de certificados disponibles para descargar.',
        };
      }

      const targetCert = eventTarget
        ? historialCompleto.find((c) => c.eventTarget === eventTarget) || {
            eventTarget,
            fechaFinISO: new Date().toISOString().split('T')[0],
            programa: 'ALTURAS',
          }
        : historialCompleto[0];

      const pdfBase64 = await postDownloadPdfFromLista({
        cookieHeader,
        htmlLista,
        eventTarget: targetCert.eventTarget,
      });

      return { ok: Boolean(pdfBase64), pdfBase64, targetCert };
    });

    if (!slotResult.ok || !slotResult.pdfBase64) {
      return {
        ok: false,
        pdfBase64: null,
        pdfFileName: null,
        imageBase64: null,
        imageFileName: null,
        error:
          slotResult.error || 'El portal de MinTrabajo no devolvió un archivo PDF válido.',
      };
    }

    const { pdfBase64, targetCert } = slotResult;
    const progUpper = String(targetCert.programa || '').toUpperCase();
    const tipoTag = progUpper.includes('CONFINADOS')
      ? 'Confinados'
      : progUpper.includes('ALTURAS')
        ? 'Alturas'
        : 'MinTrabajo';
    const baseStem = `Constancia_${tipoTag}_${cleanCedula}_${targetCert.fechaFinISO || 'oficial'}`;
    const fileName = `${baseStem}.pdf`;
    const imageBase64 = await convertPdfBase64ToPngBase64(pdfBase64);
    const imageFileName = imageBase64 ? `${baseStem}.png` : null;

    return {
      ok: true,
      pdfBase64,
      fileName,
      pdfFileName: fileName,
      imageBase64,
      imageFileName,
      contentType: 'application/pdf',
    };
  } catch (error) {
    if (typeof global.dispatchOsintViaAntigravityDaemon === 'function') {
      try {
        logger.info(`[OSINT MinTrabajo PDF] Reenviando descarga de constancia ${cleanCedula} por túnel IP Colombia (wappy-push-daemon)...`);
        const relayed = await global.dispatchOsintViaAntigravityDaemon({
          action: 'pdf',
          tipoDoc: cleanTipoDoc,
          cedula: cleanCedula,
          eventTarget,
          timeoutMs: 35000,
        });
        if (relayed && typeof relayed === 'object' && relayed.ok) {
          if (relayed.pdfBase64 && !relayed.imageBase64) {
            const convertedImg = await convertPdfBase64ToPngBase64(relayed.pdfBase64);
            if (convertedImg) {
              relayed.imageBase64 = convertedImg;
              relayed.imageFileName = String(
                relayed.pdfFileName || relayed.fileName || `Constancia_Alturas_${cleanCedula}_oficial.pdf`,
              ).replace(/\.pdf$/i, '.png');
            }
          }
          if (!relayed.pdfFileName && relayed.fileName) {
            relayed.pdfFileName = relayed.fileName;
          }
          return relayed;
        }
      } catch (relayErr) {
        logger.warn(`[OSINT MinTrabajo PDF] Falló relay por daemon para ${cleanCedula}: ${relayErr.message}`);
      }
    }
    logger.error(`[OSINT MinTrabajo PDF] Error descargando constancia ${cleanCedula}:`, error);
    return {
      ok: false,
      pdfBase64: null,
      pdfFileName: null,
      imageBase64: null,
      imageFileName: null,
      error: `Error al descargar constancia desde MinTrabajo: ${error.message}`,
    };
  }
}

/**
 * Consulta procesos judiciales en la API REST v2 oficial de la Rama Judicial por Nombre Completo.
 */
async function consultarRamaJudicialPorNombre(nombreCompleto = '') {
  const cleanNombre = String(nombreCompleto || '').trim();
  if (!cleanNombre || cleanNombre.length < 4) {
    return {
      ok: false,
      consultado: false,
      nombreConsultado: cleanNombre,
      totalProcesos: 0,
      procesos: [],
    };
  }

  const url = `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NombreRazonSocial?nombre=${encodeURIComponent(cleanNombre)}&tipoPersona=nat&SoloActivos=false&codificacionDespacho=&pagina=1`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': DEFAULT_HEADERS['User-Agent'],
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return {
        ok: false,
        consultado: true,
        status: res.status,
        nombreConsultado: cleanNombre,
        totalProcesos: 0,
        procesos: [],
        aviso: `El servidor de la Rama Judicial respondió con estado HTTP ${res.status}.`,
      };
    }

    const data = await res.json();
    const rawProcesos = Array.isArray(data?.procesos) ? data.procesos : [];

    return {
      ok: true,
      consultado: true,
      nombreConsultado: cleanNombre,
      totalProcesos: data?.paginacion?.cantidadRegistros ?? rawProcesos.length,
      procesos: rawProcesos.slice(0, 25).map((p) => ({
        idProceso: p.idProceso,
        llaveProceso: p.llaveProceso || '',
        fechaProceso: p.fechaProceso || '',
        fechaUltimaActuacion: p.fechaUltimaActuacion || '',
        despacho: p.despacho || '',
        departamento: p.departamento || '',
        sujetosProcesales: p.sujetosProcesales || '',
        esPrivado: Boolean(p.esPrivado),
      })),
    };
  } catch (error) {
    logger.warn(`[OSINT Rama Judicial] Aviso consultando "${cleanNombre}": ${error.message}`);
    return {
      ok: false,
      consultado: false,
      nombreConsultado: cleanNombre,
      totalProcesos: 0,
      procesos: [],
      aviso: `Consulta directa no disponible temporalmente (${error.message}). Puede verificar manualmente en el portal oficial.`,
    };
  }
}

/**
 * Retorna el catálogo estructurado de las 26 fuentes oficiales de verificación 360° en Colombia.
 */
function obtenerCatalogoPortales360({ tipoDoc = 'CC', cedula = '', placa = '', nombre = '' } = {}) {
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();
  const cleanCedula = String(cedula || '').trim();
  const cleanPlaca = String(placa || '').trim().toUpperCase();
  const cleanNombre = String(nombre || '').trim();

  const altoRiesgo = [
    {
      id: 'mintrabajo_alturas_confinados',
      categoria: 'altoRiesgo',
      entidad: 'Ministerio del Trabajo',
      titulo: 'Centros de Entrenamiento — Alturas y Espacios Confinados',
      descripcion:
        'Consulta nacional de certificados de Trabajo en Alturas (Res. 4272/2021) y Espacios Confinados (Res. 0491/2020) con descarga de PDF oficial.',
      url: 'https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'A',
    },
    {
      id: 'sena_sofia_plus',
      categoria: 'altoRiesgo',
      entidad: 'SENA — Sofia Plus',
      titulo: 'Certificados Digitales SENA (50h SG-SST y Competencias)',
      descripcion:
        'Descarga de certificados de cursos complementarios (50h/20h SG-SST, alturas, manipulación de alimentos) y títulos tecnológicos.',
      url: 'https://certificados.sena.edu.co/CertificadoDigital/com.sena.consultacer',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'B',
    },
  ];

  const seguridadSocialArl = [
    {
      id: 'ruaf_sispro',
      categoria: 'seguridadSocialArl',
      entidad: 'Ministerio de Salud — SISPRO',
      titulo: 'RUAF — Afiliaciones a EPS, ARL, AFP y Caja de Compensación',
      descripcion:
        'Reporte maestro 360° de Seguridad Social que revela en cuál EPS, ARL, Fondo de Pensión y Caja está activo el trabajador.',
      url: 'https://ruaf.sispro.gov.co/Default.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'} + Fecha de Expedición`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'adres_bdua',
      categoria: 'seguridadSocialArl',
      entidad: 'ADRES — BDUA',
      titulo: 'Consulta de Afiliación a EPS (Base de Datos Única de Afiliados)',
      descripcion:
        'Verifica estado activo/suspendido en salud (EPS), régimen contributivo o subsidiado y tipo de cotizante.',
      url: 'https://www.adres.gov.co/consulte-su-eps',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'arl_sura',
      categoria: 'seguridadSocialArl',
      entidad: 'ARL SURA',
      titulo: 'Verificación de Afiliación y Certificado ARL SURA',
      descripcion:
        'Consulta en línea de cobertura activa en ARL SURA y generación de certificado / carné de afiliación en PDF.',
      url: 'https://www.arlsura.com/afiliacion/verificar.php',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'arl_positiva',
      categoria: 'seguridadSocialArl',
      entidad: 'ARL Positiva',
      titulo: 'Certificado de Afiliación Individual ARL Positiva',
      descripcion:
        'Descarga de certificado de afiliación individual y carné de riesgos laborales en Positiva Compañía de Seguros.',
      url: 'https://www.positivaenlinea.gov.co/nuevo/',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'arl_colmena',
      categoria: 'seguridadSocialArl',
      entidad: 'ARL Colmena Seguros',
      titulo: 'Consulta de Afiliación y Escarapela ARL Colmena',
      descripcion:
        'Impresión de certificado individual de cobertura en riesgos laborales y carné ARL Colmena.',
      url: 'https://afiliacionarl.colmenaseguros.com/',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'} + Fecha de Nacimiento`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'arl_axa_colpatria',
      categoria: 'seguridadSocialArl',
      entidad: 'ARL AXA Colpatria',
      titulo: 'Certificados de Afiliación ARL AXA Colpatria',
      descripcion:
        'Generación en línea de certificado individual de afiliación a riesgos laborales en AXA Colpatria.',
      url: 'https://arl.axacolpatria.co/',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'arl_bolivar',
      categoria: 'seguridadSocialArl',
      entidad: 'ARL Seguros Bolívar',
      titulo: 'Certificado de Cobertura ARL Seguros Bolívar',
      descripcion:
        'Consulta y descarga de constancia de afiliación activa en ARL Seguros Bolívar.',
      url: 'https://www.segurosbolivar.com/arl',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'colpensiones_rpm',
      categoria: 'seguridadSocialArl',
      entidad: 'Colpensiones',
      titulo: 'Certificado de Afiliación / No Pensión en Colpensiones',
      descripcion:
        'Verifica afiliación o estado pensional en el Régimen de Prima Media con Prestación Definida.',
      url: 'https://sede.colpensiones.gov.co/tramite/updInfo/72/',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
  ];

  const seguridadVialPesv = [
    {
      id: 'simit_fcm',
      categoria: 'seguridadVialPesv',
      entidad: 'Federación Colombiana de Municipios — SIMIT',
      titulo: 'SIMIT — Comparendos, Fotomultas y Acuerdos de Pago',
      descripcion:
        'Auditoría nacional de infracciones de tránsito por Cédula del conductor o Placa del vehículo (Paso 10 PESV Res. 20223040040595).',
      url: 'https://www.fcm.org.co/simit/#/home-public',
      requiere: cleanPlaca
        ? `Cédula ${cleanCedula || '[Cédula]'} o Placa ${cleanPlaca}`
        : `Cédula ${cleanCedula || '[Cédula]'} o Placa`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'runt_persona',
      categoria: 'seguridadVialPesv',
      entidad: 'RUNT — Concesión RUNT 2.0',
      titulo: 'RUNT por Documento — Vigencia y Categoría de Licencia de Conducción',
      descripcion:
        'Verifica estado activo de licencia de conducción, categorías autorizadas (A2, B1, C1, C2, C3), vencimientos y restricciones.',
      url: 'https://www.runt.gov.co/consultaCiudadana/#/consultaPersona',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'runt_vehiculo',
      categoria: 'seguridadVialPesv',
      entidad: 'RUNT — Concesión RUNT 2.0',
      titulo: 'RUNT por Placa — Vigencia de SOAT y Revisión Técnico-Mecánica',
      descripcion:
        'Audita póliza SOAT vigente, certificado de Revisión Técnico-Mecánica (RTM) y características técnicas del vehículo.',
      url: 'https://www.runt.gov.co/consultaCiudadana/#/consultaVehiculo',
      requiere: `Placa ${cleanPlaca || '[Placa]'} + ${cleanTipoDoc} ${cleanCedula || '[Cédula Propietario]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
  ];

  const matriculasProfesionales = [
    {
      id: 'conte_electricistas',
      categoria: 'matriculasProfesionales',
      entidad: 'CONTE',
      titulo: 'Matrícula Profesional de Técnicos Electricistas (RETIE)',
      descripcion:
        'Verifica vigencia de matrícula profesional CONTE (clases TE-1 a TE-6) para trabajos con riesgo eléctrico.',
      url: 'https://www.conte.org.co/',
      requiere: `Cédula ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'conaltel_tecnologos',
      categoria: 'matriculasProfesionales',
      entidad: 'CONALTEL',
      titulo: 'Matrícula Profesional de Tecnólogos en Electricidad y Afines',
      descripcion:
        'Certificado de vigencia y antecedentes disciplinarios para tecnólogos electricistas y electromecánicos.',
      url: 'https://conaltel.org/',
      requiere: `Cédula ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'copnia_ingenieria',
      categoria: 'matriculasProfesionales',
      entidad: 'COPNIA',
      titulo: 'Certificado de Vigencia de Matrícula de Ingeniería y Afines',
      descripcion:
        'Valida tarjeta profesional y certificado de vigencia sin sanciones para ingenieros, tecnólogos y profesionales afines.',
      url: 'https://tramites.copnia.gov.co/Copnia_Microsite/certificadosVigencia.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'rethus_salud_sst',
      categoria: 'matriculasProfesionales',
      entidad: 'Ministerio de Salud — ReTHUS',
      titulo: 'Registro Único Nacional del Talento Humano en Salud',
      descripcion:
        'Verifica inscripción legal de médicos laborales, enfermeros, psicólogos especialistas en SST y profesionales de la salud.',
      url: 'https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'colpsic_psicologos',
      categoria: 'matriculasProfesionales',
      entidad: 'COLPSIC',
      titulo: 'Colegio Colombiano de Psicólogos — Tarjeta Profesional',
      descripcion:
        'Verifica idoneidad legal de psicólogos (requisito obligatorio para aplicación de Batería de Riesgo Psicosocial Res. 2764/2022).',
      url: 'https://www.colpsic.org.co/',
      requiere: `Cédula ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
  ];

  const antecedentesDisciplinarios = [
    {
      id: 'policia_antecedentes_judiciales',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Policía Nacional de Colombia',
      titulo: 'Consulta de Antecedentes Judiciales',
      descripcion:
        'Certifica si el ciudadano registra o no asuntos pendientes con las autoridades judiciales penales.',
      url: 'https://antecedentes.policia.gov.co:7005/WebJudicial/',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'policia_rnmc_convivencia',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Policía Nacional — RNMC',
      titulo: 'Registro Nacional de Medidas Correctivas (Ley 1801 de 2016)',
      descripcion:
        'Verifica comparendos del Código de Seguridad y Convivencia Ciudadana (mora > 6 meses genera inhabilidad de contratación).',
      url: 'https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'A',
    },
    {
      id: 'policia_inhabilidades_delitos_sexuales',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Policía Nacional — Ley 1918 de 2018',
      titulo: 'Consulta de Inhabilidades por Delitos Sexuales contra Menores',
      descripcion:
        'Requisito obligatorio para cargos con trato directo con menores de edad (transporte escolar, educación, salud, recreación).',
      url: 'https://inhabilidades.policia.gov.co:8080/',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'} + NIT Empresa`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'procuraduria_siri',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Procuraduría General de la Nación',
      titulo: 'Certificado de Antecedentes Disciplinarios (SIRI)',
      descripcion:
        'Consulta y descarga en PDF del certificado ordinario o especial de antecedentes disciplinarios e inhabilidades.',
      url: 'https://apps.procuraduria.gov.co/webcert/Certificado.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'A',
    },
    {
      id: 'contraloria_sibor',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Contraloría General de la República',
      titulo: 'Certificado de Antecedentes Fiscales (SIBOR)',
      descripcion:
        'Descarga del boletín de responsables fiscales en PDF para personas naturales o jurídicas.',
      url: 'https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaNatural.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'rama_judicial_procesos',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Rama Judicial — Consejo Superior de la Judicatura',
      titulo: 'Consulta Nacional Unificada de Procesos Judiciales',
      descripcion:
        'Historial de demandas laborales, civiles, penales o ejecutivas donde el trabajador figure como sujeto procesal.',
      url: 'https://consultaprocesos.ramajudicial.gov.co/Procesos/Index',
      requiere: cleanNombre ? `Nombre: ${cleanNombre}` : 'Nombre completo o Razón Social',
      tieneCaptcha: false,
      tipoMotor: 'A',
    },
    {
      id: 'personeria_bogota',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Personería de Bogotá D.C.',
      titulo: 'Certificado de Antecedentes Disciplinarios Distritales',
      descripcion:
        'Expedición inmediata en PDF de antecedentes disciplinarios distritales para contratistas y trabajadores.',
      url: 'https://www.personeriabogota.gov.co/al-servicio-de-la-ciudad/expedicion-de-antecedentes',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'ofac_sarlaft_sagrilaft',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'U.S. Treasury — OFAC Sanctions List',
      titulo: 'Listas Restrictivas LAFT / SARLAFT / SAGRILAFT (OFAC)',
      descripcion:
        'Debida diligencia de contrapartes (trabajadores, proveedores y contratistas) frente a listas internacionales vinculantes.',
      url: 'https://sanctionssearch.ofac.treas.gov/',
      requiere: `${cleanCedula || '[Cédula]'} / ${cleanNombre || '[Nombre Completo]'}`,
      tieneCaptcha: false,
      tipoMotor: 'A',
    },
  ];

  return {
    altoRiesgo,
    seguridadSocialArl,
    seguridadVialPesv,
    matriculasProfesionales,
    antecedentesDisciplinarios,
  };
}

function buildRamaJudicialEvidenceHtml(rj = {}, { tipoDoc = '', cedula = '' } = {}) {
  const isoNow = new Date().toISOString();
  const hasProcs = Number(rj.totalProcesos || 0) > 0;
  const badgeBg = hasProcs ? '#FEF3C7' : '#DCFCE7';
  const badgeColor = hasProcs ? '#92400E' : '#166534';
  const badgeText = hasProcs
    ? `REGISTRA ${rj.totalProcesos} PROCESO(S) JUDICIAL(ES)`
    : 'SIN PROCESOS JUDICIALES ACTIVOS';
  const docStr = cedula ? `${tipoDoc || 'CC'} ${cedula}` : 'Consulta por Nombre / Razón Social';
  const rowsHtml =
    Array.isArray(rj.procesos) && rj.procesos.length > 0
      ? rj.procesos
          .slice(0, 25)
          .map(
            (p, idx) => `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td style="font-family:monospace;font-weight:700;">${escapeHtmlText(p.llaveProceso || p.idProceso || 'S/N')}</td>
            <td><strong>${escapeHtmlText(p.despacho || 'Despacho no especificado')}</strong><br/><span style="color:#64748b;font-size:11px;">${escapeHtmlText(p.departamento || '')}</span></td>
            <td style="font-size:11px;">Rad: ${escapeHtmlText(String(p.fechaProceso || '').slice(0, 10) || 'N/D')}<br/>Últ: ${escapeHtmlText(String(p.fechaUltimaActuacion || '').slice(0, 10) || 'N/D')}</td>
            <td style="font-size:11px;">${escapeHtmlText(String(p.sujetosProcesales || 'Reservado / Sin detalle').slice(0, 220))}</td>
            <td style="text-align:center;">${p.esPrivado ? 'Privado' : 'Público'}</td>
          </tr>`,
          )
          .join('')
      : `<tr><td colspan="6" style="text-align:center;padding:24px;color:#0f766e;font-weight:600;">No se registran procesos judiciales activos para "${escapeHtmlText(rj.nombreConsultado || '')}" en la Consulta Nacional Unificada (API v2 Oficial).</td></tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Constancia Rama Judicial — ${escapeHtmlText(rj.nombreConsultado || '')}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #f8fafc; color: #0f172a; }
  .card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(15,23,42,0.06); }
  .header { background: linear-gradient(135deg, #0c192e 0%, #132c4e 100%); color: #ffffff; padding: 22px 28px; border-bottom: 4px solid #0d9488; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { margin: 0; font-size: 17px; letter-spacing: 0.4px; }
  .header p { margin: 5px 0 0; font-size: 12px; color: #cbd5e1; }
  .badge { padding: 7px 14px; border-radius: 999px; font-size: 11px; font-weight: 800; background: ${badgeBg}; color: ${badgeColor}; letter-spacing: 0.3px; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 18px 28px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
  .meta-box { background: #ffffff; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .meta-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.4px; }
  .meta-val { margin-top: 4px; font-size: 13px; font-weight: 700; color: #0f172a; word-break: break-word; }
  .content { padding: 20px 28px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #0f172a; color: #ffffff; text-align: left; padding: 9px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
  td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .footer { padding: 12px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #64748b; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1>RAMA JUDICIAL DE COLOMBIA — CONSEJO SUPERIOR DE LA JUDICATURA</h1>
        <p>Constancia Técnica de Consulta Nacional Unificada de Procesos Judiciales (API Oficial v2)</p>
      </div>
      <div class="badge">${escapeHtmlText(badgeText)}</div>
    </div>
    <div class="meta">
      <div class="meta-box">
        <div class="meta-label">Ciudadano / Sujeto Consultado</div>
        <div class="meta-val">${escapeHtmlText(rj.nombreConsultado || 'No especificado')}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Identificación Asociada</div>
        <div class="meta-val">${escapeHtmlText(docStr)}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Total Procesos Registrados</div>
        <div class="meta-val">${Number(rj.totalProcesos || 0)}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Fecha y Hora Verificación (ISO)</div>
        <div class="meta-val">${escapeHtmlText(isoNow)}</div>
      </div>
    </div>
    <div class="content">
      <table>
        <thead>
          <tr>
            <th style="width:36px;text-align:center;">#</th>
            <th style="width:185px;">Radicado / Llave</th>
            <th style="width:230px;">Despacho / Ubicación</th>
            <th style="width:125px;">Fechas</th>
            <th>Sujetos Procesales</th>
            <th style="width:76px;text-align:center;">Reserva</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    <div class="footer">
      <span>Fuente oficial: consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NombreRazonSocial</span>
      <span>Evidencia generada por WAPPY SG-SST · IP Local Colombia</span>
    </div>
  </div>
</body>
</html>`;
}

function formatCleanFechaNacimiento(raw = '') {
  if (!raw) return '';
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  const str = String(raw).trim();
  if (!str) return '';
  const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})(?:T.*)?$/);
  if (isoMatch) return isoMatch[1];
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[1].padStart(2, '0')}/${dmyMatch[2].padStart(2, '0')}/${dmyMatch[3]}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && /\d{4}/.test(str)) {
    return parsed.toISOString().slice(0, 10);
  }
  return str.slice(0, 20);
}

function buildPortalVerificationEvidenceHtml({
  label = '',
  tipoDoc = 'CC',
  cedula = '',
  nombre = '',
  placa = '',
  fechaNacimiento = '',
  arl = '',
  eps = '',
  afp = '',
  detalles = [],
  okCount = 0,
  primaryPortalScreenshotBase64 = '',
  primaryPortalName = '',
  primaryPortalUrl = '',
} = {}) {
  const isoNow = new Date().toISOString();
  const nominaItems = [
    fechaNacimiento ? `F. Nac: ${fechaNacimiento}` : '',
    arl ? `ARL Registrada en Nómina: ${arl}` : '',
    eps ? `EPS Registrada en Nómina: ${eps}` : '',
    afp ? `AFP Registrada en Nómina: ${afp}` : '',
  ].filter(Boolean);
  const nominaBannerHtml =
    nominaItems.length > 0
      ? `<div style="margin-bottom:12px;padding:9px 13px;border-radius:8px;background:#f0fdfa;border:1px solid #99f6e4;color:#0f766e;font-size:12px;font-weight:700;">
           Registro Sociodemográfico / Nómina (Somos SST): ${escapeHtmlText(nominaItems.join(' · '))}
         </div>`
      : '';
  const rowsHtml = detalles
    .map(
      (d) => `
      <tr>
        <td style="font-weight:700;">${escapeHtmlText(d.entidad)}</td>
        <td style="font-family:monospace;font-size:11px;color:#334155;">${escapeHtmlText(d.url)}</td>
        <td style="text-align:center;font-weight:700;">${d.httpStatus ? `HTTP ${d.httpStatus}` : '—'}</td>
        <td style="text-align:right;">${Number(d.latencyMs || 0)} ms</td>
        <td style="text-align:center;">
          <span style="padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:700;background:${d.reachable ? '#DCFCE7' : '#FEF3C7'};color:${d.reachable ? '#166534' : '#92400E'};">
            ${d.reachable ? 'EN LÍNEA' : 'CAPTCHA / TIMEOUT'}
          </span>
        </td>
      </tr>`,
    )
    .join('');

  const previewHtml = primaryPortalScreenshotBase64
    ? `<div style="margin-top:16px;border:1px solid #cbd5e1;border-radius:10px;overflow:hidden;background:#f8fafc;">
         <div style="padding:8px 12px;background:#e2e8f0;font-size:11px;font-weight:700;color:#1e293b;">
           Captura en vivo del portal principal verificado: ${escapeHtmlText(primaryPortalName)} (${escapeHtmlText(primaryPortalUrl)})
         </div>
         <img src="data:image/png;base64,${primaryPortalScreenshotBase64}" style="display:block;width:100%;max-height:360px;object-fit:cover;object-position:top;" />
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Constancia Verificación Portales — ${escapeHtmlText(cedula || placa || label)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #f8fafc; color: #0f172a; }
  .card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #0c192e 0%, #132c4e 100%); color: #ffffff; padding: 20px 26px; border-bottom: 4px solid #0d9488; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { margin: 0; font-size: 16px; }
  .header p { margin: 4px 0 0; font-size: 12px; color: #cbd5e1; }
  .badge { padding: 6px 13px; border-radius: 999px; font-size: 11px; font-weight: 800; background: #DCFCE7; color: #166534; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 14px 26px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
  .meta-box { background: #ffffff; padding: 9px 11px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .meta-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
  .meta-val { margin-top: 3px; font-size: 12.5px; font-weight: 700; color: #0f172a; }
  .content { padding: 16px 26px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #0f172a; color: #ffffff; text-align: left; padding: 8px 10px; font-size: 10.5px; text-transform: uppercase; }
  td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  .footer { padding: 10px 26px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #64748b; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1>CONSTANCIA DE VERIFICACIÓN EN PORTALES OFICIALES — SG-SST COLOMBIA</h1>
        <p>${escapeHtmlText(label)}</p>
      </div>
      <div class="badge">${okCount}/${detalles.length} PORTALES ACTIVOS</div>
    </div>
    <div class="meta">
      <div class="meta-box">
        <div class="meta-label">Documento / Placa</div>
        <div class="meta-val">${escapeHtmlText(`${tipoDoc} ${cedula || 'S/D'}${placa ? ` · Placa ${placa}` : ''}`)}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Trabajador / Titular</div>
        <div class="meta-val">${escapeHtmlText(nombre || 'Verificación por Documento')}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Nodo de Red</div>
        <div class="meta-val">IP Local Colombia</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Fecha y Hora (ISO)</div>
        <div class="meta-val">${escapeHtmlText(isoNow)}</div>
      </div>
    </div>
    <div class="content">
      ${nominaBannerHtml}
      <table>
        <thead>
          <tr>
            <th>Entidad Oficial</th>
            <th>URL Verificada</th>
            <th style="text-align:center;">Estado HTTP</th>
            <th style="text-align:right;">Latencia</th>
            <th style="text-align:center;">Disponibilidad</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      ${previewHtml}
    </div>
    <div class="footer">
      <span>Auditoría automatizada de Seguridad Social, ReTHUS y Seguridad Vial (Decreto 1072 / Res. 0312)</span>
      <span>Generado por WAPPY IA · Google Antigravity Bridge</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Ejecuta la Investigación 360° de un Trabajador o Conductor en Colombia:
 * 1) MinTrabajo (Alturas y Confinados + PDF e Imagen PNG en Base64)
 * 2) Rama Judicial API v2 (por nombre suministrado o descubierto en MinTrabajo)
 * 3) Catálogo completo de las 26 fuentes oficiales parametrizado con los datos del trabajador.
 */
async function investigarTrabajador360({
  tipoDoc = 'CC',
  cedula = '',
  placa = '',
  nombre = '',
  includePdf = true,
  userId = '',
} = {}) {
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();
  const cleanCedula = String(cedula || '').trim();
  const cleanPlaca = String(placa || '').trim().toUpperCase();
  const cleanNombre = String(nombre || '').trim();

  let minTrabajo = {
    encontrado: false,
    activoEnAlturas: false,
    activoEnConfinados: false,
    documento: cleanCedula,
    tipoDoc: cleanTipoDoc,
    titular: null,
    ultimoCertificadoAlturas: null,
    ultimoCertificadoConfinados: null,
    pdfBase64: null,
    pdfFileName: null,
    imageBase64: null,
    imageFileName: null,
    historialCompleto: [],
    viaAntigravityDaemon: false,
  };

  if (cleanCedula) {
    minTrabajo = await consultarAlturasMinTrabajo({
      tipoDoc: cleanTipoDoc,
      cedula: cleanCedula,
      includePdf: Boolean(includePdf),
      userId: String(userId || ''),
    });
  }

  const nombreEfectivo = cleanNombre || minTrabajo?.titular || '';

  let ramaJudicial = {
    ok: false,
    consultado: false,
    nombreConsultado: nombreEfectivo,
    totalProcesos: 0,
    procesos: [],
    pdfBase64: null,
    pdfFileName: null,
    imageBase64: null,
    imageFileName: null,
  };

  if (nombreEfectivo) {
    ramaJudicial = await consultarRamaJudicial({
      nombreCompleto: nombreEfectivo,
      tipoDoc: cleanTipoDoc,
      cedula: cleanCedula,
      includeEvidence: Boolean(includePdf),
    });
  }

  const portalesOficiales = obtenerCatalogoPortales360({
    tipoDoc: cleanTipoDoc,
    cedula: cleanCedula,
    placa: cleanPlaca,
    nombre: nombreEfectivo,
  });

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    input: {
      tipoDoc: cleanTipoDoc,
      cedula: cleanCedula,
      placa: cleanPlaca,
      nombre: nombreEfectivo,
    },
    pdfBase64: minTrabajo?.pdfBase64 || ramaJudicial?.pdfBase64 || null,
    pdfFileName: minTrabajo?.pdfFileName || ramaJudicial?.pdfFileName || null,
    imageBase64: minTrabajo?.imageBase64 || ramaJudicial?.imageBase64 || null,
    imageFileName: minTrabajo?.imageFileName || ramaJudicial?.imageFileName || null,
    minTrabajo,
    ramaJudicial,
    portalesOficiales,
  };
}

function createAsyncSemaphore(maxConcurrent = 4) {
  let active = 0;
  const waitQueue = [];
  return async function runWithSlot(fn) {
    if (active < maxConcurrent) {
      active += 1;
    } else {
      await new Promise((resolve) => waitQueue.push(resolve));
    }
    try {
      return await fn();
    } finally {
      const next = waitQueue.shift();
      if (next) {
        next();
      } else {
        active = Math.max(0, active - 1);
      }
    }
  };
}

const runWithArlHttpSlot = createAsyncSemaphore(6);
const runWithContraloriaSlot = createAsyncSemaphore(4);
const runWithPuppeteerSlot = createAsyncSemaphore(2);
const runWithSimitMutex = createAsyncSemaphore(1);

let sharedPuppeteerBrowser = null;
let sharedPuppeteerLaunchPromise = null;
let sharedPuppeteerActiveCount = 0;
let sharedPuppeteerIdleTimer = null;
let sharedSimitPage = null;
let sharedSimitResponseSink = null;

function scheduleSharedBrowserIdleClose() {
  if (sharedPuppeteerIdleTimer) {
    clearTimeout(sharedPuppeteerIdleTimer);
    sharedPuppeteerIdleTimer = null;
  }
  if (sharedPuppeteerActiveCount === 0 && sharedPuppeteerBrowser) {
    sharedPuppeteerIdleTimer = setTimeout(() => {
      if (sharedPuppeteerActiveCount === 0 && sharedPuppeteerBrowser) {
        const sp = sharedSimitPage;
        sharedSimitPage = null;
        sharedSimitResponseSink = null;
        if (sp) {
          sp.close().catch(() => {});
        }
        const b = sharedPuppeteerBrowser;
        sharedPuppeteerBrowser = null;
        b.close().catch(() => {});
      }
    }, 45000);
    if (typeof sharedPuppeteerIdleTimer.unref === 'function') {
      sharedPuppeteerIdleTimer.unref();
    }
  }
}

async function getSharedBrowser() {
  if (sharedPuppeteerIdleTimer) {
    clearTimeout(sharedPuppeteerIdleTimer);
    sharedPuppeteerIdleTimer = null;
  }
  if (sharedPuppeteerBrowser && sharedPuppeteerBrowser.isConnected()) {
    return sharedPuppeteerBrowser;
  }
  if (sharedPuppeteerLaunchPromise) {
    return sharedPuppeteerLaunchPromise;
  }

  sharedPuppeteerLaunchPromise = (async () => {
    let puppeteerMod = null;
    try {
      puppeteerMod = require('puppeteer');
    } catch (_) {
      try {
        puppeteerMod = require('puppeteer-core');
      } catch (__) {}
    }
    if (!puppeteerMod || typeof puppeteerMod.launch !== 'function') {
      throw new Error('Puppeteer no está disponible en este entorno.');
    }
    const chromeBin = resolveChromeBinaryPath();
    const launchOpts = {
      headless: 'new',
      protocolTimeout: 20000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--ignore-certificate-errors',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,900',
      ],
    };
    if (chromeBin) {
      launchOpts.executablePath = chromeBin;
    }
    const browser = await puppeteerMod.launch(launchOpts);
    browser.on('disconnected', () => {
      if (sharedPuppeteerBrowser === browser) {
        sharedPuppeteerBrowser = null;
      }
    });
    sharedPuppeteerBrowser = browser;
    return browser;
  })();

  try {
    return await sharedPuppeteerLaunchPromise;
  } finally {
    sharedPuppeteerLaunchPromise = null;
  }
}

async function runWithPuppeteerPage(fn, timeoutMs = 18000) {
  return runWithPuppeteerSlot(async () => {
    sharedPuppeteerActiveCount += 1;
    let page = null;
    let hardTimer = null;
    try {
      const browser = await getSharedBrowser();
      page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.setUserAgent(DEFAULT_HEADERS['User-Agent']);

      const timeoutPromise = new Promise((_, reject) => {
        hardTimer = setTimeout(() => {
          reject(new Error(`Timeout de navegador (${timeoutMs}ms)`));
        }, timeoutMs);
      });

      return await Promise.race([fn(page), timeoutPromise]);
    } finally {
      if (hardTimer) clearTimeout(hardTimer);
      if (page) {
        await page.close().catch(() => {});
      }
      sharedPuppeteerActiveCount = Math.max(0, sharedPuppeteerActiveCount - 1);
      scheduleSharedBrowserIdleClose();
    }
  });
}

function mergeRawCookieHeader(setCookieHeader, existingCookie = '') {
  const map = new Map();
  if (existingCookie) {
    existingCookie.split(';').forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const k = pair.slice(0, idx).trim();
        const v = pair.slice(idx + 1).trim();
        if (k) map.set(k, v);
      }
    });
  }
  const rawArr = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  for (const raw of rawArr) {
    const first = String(raw || '').split(';')[0];
    const idx = first.indexOf('=');
    if (idx > 0) {
      const k = first.slice(0, idx).trim();
      const v = first.slice(idx + 1).trim();
      if (k) map.set(k, v);
    }
  }
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function insecureHttpsRequest(
  urlStr,
  {
    method = 'GET',
    headers = {},
    body = null,
    cookieHeader = '',
    timeoutMs = 12000,
    followRedirects = true,
    maxRedirects = 3,
  } = {},
) {
  return new Promise((resolve, reject) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(urlStr);
    } catch (err) {
      return reject(err);
    }

    const bodyBuf =
      body == null ? null : Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
    const reqHeaders = {
      'User-Agent': DEFAULT_HEADERS['User-Agent'],
      Accept: '*/*',
      'Accept-Language': DEFAULT_HEADERS['Accept-Language'],
      ...headers,
    };
    if (cookieHeader && !reqHeaders.Cookie && !reqHeaders.cookie) {
      reqHeaders.Cookie = cookieHeader;
    }
    if (bodyBuf && reqHeaders['Content-Length'] === undefined) {
      reqHeaders['Content-Length'] = bodyBuf.length;
    }

    let finished = false;
    const req = https.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method,
        headers: reqHeaders,
        rejectUnauthorized: false,
      },
      (res) => {
        const nextCookie = mergeRawCookieHeader(res.headers['set-cookie'], cookieHeader);
        const status = res.statusCode || 0;
        const loc = res.headers.location;
        if (
          followRedirects &&
          maxRedirects > 0 &&
          loc &&
          [301, 302, 303, 307, 308].includes(status)
        ) {
          res.resume();
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          const nextUrl = new URL(loc, parsedUrl.href).href;
          const nextMethod = status === 303 ? 'GET' : method;
          const nextBody = status === 303 ? null : bodyBuf;
          const redirectHeaders = { ...headers };
          if (status === 303) {
            delete redirectHeaders['Content-Type'];
            delete redirectHeaders['Content-Length'];
          }
          insecureHttpsRequest(nextUrl, {
            method: nextMethod,
            headers: redirectHeaders,
            body: nextBody,
            cookieHeader: nextCookie,
            timeoutMs,
            followRedirects: true,
            maxRedirects: maxRedirects - 1,
          }).then(resolve, reject);
          return;
        }

        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          resolve({
            status,
            headers: res.headers,
            buf: Buffer.concat(chunks),
            cookieHeader: nextCookie,
          });
        });
        res.on('error', (err) => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          reject(err);
        });
      },
    );

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      req.destroy(new Error(`Timeout HTTPS (${timeoutMs}ms) en ${parsedUrl.hostname}`));
      reject(new Error(`Timeout HTTPS (${timeoutMs}ms) en ${parsedUrl.hostname}`));
    }, timeoutMs);

    req.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(err);
    });

    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

function toBirthDateDmySlash(cleanFechaNac = '') {
  if (!cleanFechaNac) return '';
  const isoM = String(cleanFechaNac).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoM) return `${isoM[3]}/${isoM[2]}/${isoM[1]}`;
  const dmyM = String(cleanFechaNac).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmyM) return cleanFechaNac;
  return '';
}

async function extractTextFromPdfBuffer(pdfBuf) {
  if (!pdfBuf || pdfBuf.length < 64) return '';
  if (typeof pdfParse === 'function') {
    try {
      const parsed = await pdfParse(pdfBuf);
      if (parsed?.text && parsed.text.trim()) {
        return parsed.text.replace(/\s+/g, ' ').trim();
      }
    } catch (_) {}
  }
  const tjLiterals = [];
  const inflatedChunks = [];
  let idx = 0;
  while ((idx = pdfBuf.indexOf('stream', idx)) !== -1) {
    // Evitar coincidencia dentro de "endstream"
    if (idx >= 3 && pdfBuf.subarray(idx - 3, idx).toString('ascii') === 'end') {
      idx += 6;
      continue;
    }
    let start = idx + 6;
    if (pdfBuf[start] === 13 && pdfBuf[start + 1] === 10) start += 2;
    else if (pdfBuf[start] === 10) start += 1;
    const end = pdfBuf.indexOf('endstream', start);
    if (end > start) {
      let sub = pdfBuf.subarray(start, end);
      while (sub.length > 0 && (sub[sub.length - 1] === 10 || sub[sub.length - 1] === 13)) {
        sub = sub.subarray(0, sub.length - 1);
      }
      try {
        const inf = zlib.inflateSync(sub).toString('latin1');
        inflatedChunks.push(inf);
        for (const m of inf.matchAll(/\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g)) {
          if (m[1]) tjLiterals.push(m[1]);
        }
        for (const m of inf.matchAll(/\[([\s\S]*?)\]\s*TJ/g)) {
          const inner = m[1] || '';
          const parts = Array.from(inner.matchAll(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g)).map(
            (x) => x[1],
          );
          if (parts.length) tjLiterals.push(parts.join(''));
        }
      } catch (_) {}
    }
    idx = end > start ? end + 9 : idx + 6;
  }
  return `${tjLiterals.join(' ')} ${inflatedChunks.join(' ')}`.replace(/\s+/g, ' ').trim();
}

/**
 * Consulta real de Certificado Oficial de Antecedentes Fiscales en la Contraloría General de la República (PDF real).
 */
async function consultarContraloriaFiscalPorCedula({
  tipoDoc = 'CC',
  cedula = '',
  includePdf = true,
} = {}) {
  const cleanCedula = String(cedula || '').replace(/[^\d]/g, '').trim();
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();
  if (!cleanCedula || cleanCedula.length < 5) {
    return {
      ok: false,
      consultado: false,
      sinResponsabilidadFiscal: false,
      reportadoFiscal: false,
      pdfBase64: null,
      pdfFileName: null,
      imageBase64: null,
      imageFileName: null,
    };
  }

  const contraloriaUrl =
    'https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaNatural.aspx';
  const tipoMap = { CC: 'CC', CE: 'CE', TI: 'TI', PA: 'PA', PEP: 'PEP', PPT: 'PPT', NIT: 'NI' };
  const ddlTipo = tipoMap[cleanTipoDoc] || 'CC';

  return runWithContraloriaSlot(async () => {
    try {
      const getRes = await insecureHttpsRequest(contraloriaUrl, {
        method: 'GET',
        timeoutMs: 12000,
      });
      const htmlForm = getRes.buf.toString('utf8');
      const viewState = extractHiddenInput(htmlForm, '__VIEWSTATE');
      const viewStateGen = extractHiddenInput(htmlForm, '__VIEWSTATEGENERATOR');
      const eventValidation = extractHiddenInput(htmlForm, '__EVENTVALIDATION');
      if (!viewState) {
        return {
          ok: false,
          consultado: false,
          error: 'No se obtuvo __VIEWSTATE en Contraloría.',
          pdfBase64: null,
          pdfFileName: null,
          imageBase64: null,
          imageFileName: null,
        };
      }

      const postBody = new URLSearchParams({
        __VIEWSTATE: viewState,
        __VIEWSTATEGENERATOR: viewStateGen,
        __EVENTVALIDATION: eventValidation,
        'ctl00$MainContent$ddlTipoDocumento': ddlTipo,
        'ctl00$MainContent$txtNumeroDocumento': cleanCedula,
        'ctl00$MainContent$btnBuscar': 'Buscar',
      }).toString();

      const postRes = await insecureHttpsRequest(contraloriaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: contraloriaUrl,
        },
        cookieHeader: getRes.cookieHeader,
        body: postBody,
        timeoutMs: 14000,
      });

      const isPdf =
        postRes.buf.length > 500 && postRes.buf.subarray(0, 5).toString('ascii').startsWith('%PDF');
      if (!isPdf) {
        return {
          ok: false,
          consultado: true,
          error: 'Contraloría no retornó PDF directo (posible validación adicional).',
          pdfBase64: null,
          pdfFileName: null,
          imageBase64: null,
          imageFileName: null,
        };
      }

      const pdfText = await extractTextFromPdfBuffer(postRes.buf);
      const normPdfText = pdfText
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
      const sinResponsabilidadFiscal =
        normPdfText.includes('NO SE ENCUENTRA REPORTADO COMO RESPONSABLE FISCAL') ||
        normPdfText.includes('NO SE ENCUENTRA REPORTADA COMO RESPONSABLE FISCAL') ||
        !normPdfText.includes('REPORTADO COMO RESPONSABLE FISCAL');
      const reportadoFiscal =
        !sinResponsabilidadFiscal && normPdfText.includes('REPORTADO COMO RESPONSABLE FISCAL');

      let pdfBase64 = null;
      let pdfFileName = null;
      let imageBase64 = null;
      let imageFileName = null;

      if (includePdf !== false) {
        pdfBase64 = postRes.buf.toString('base64');
        pdfFileName = `Certificado_Contraloria_${cleanCedula}.pdf`;
        imageBase64 = await convertPdfBase64ToPngBase64(pdfBase64);
        imageFileName = imageBase64 ? `Certificado_Contraloria_${cleanCedula}.png` : null;
      }

      return {
        ok: true,
        consultado: true,
        sinResponsabilidadFiscal,
        reportadoFiscal,
        pdfBase64,
        pdfFileName,
        imageBase64,
        imageFileName,
      };
    } catch (err) {
      logger.warn(`[OSINT Contraloría] Aviso consultando ${cleanCedula}: ${err.message}`);
      return {
        ok: false,
        consultado: false,
        error: err.message,
        pdfBase64: null,
        pdfFileName: null,
        imageBase64: null,
        imageFileName: null,
      };
    }
  });
}

/**
 * Wrapper unificado de Rama Judicial + Contraloría General (Antecedentes Judiciales y Fiscales Reales).
 */
async function consultarRamaJudicial(params = '') {
  const isObj = params && typeof params === 'object';
  const cleanNombre =
    typeof params === 'string'
      ? params.trim()
      : String(params?.nombreCompleto || params?.nombre || '').trim();
  const includeEvidence = isObj && params.includeEvidence !== undefined ? params.includeEvidence : true;
  const forceEvidence = Boolean(isObj && params.forceEvidence === true);
  const cleanTipoDoc = isObj ? String(params.tipoDoc || 'CC').trim().toUpperCase() : 'CC';
  const cleanCedula = isObj ? String(params.cedula || '').trim() : '';

  const [rj, contraloria] = await Promise.all([
    cleanNombre && cleanNombre.length >= 4
      ? consultarRamaJudicialPorNombre(cleanNombre)
      : Promise.resolve({
          ok: false,
          consultado: false,
          nombreConsultado: cleanNombre,
          totalProcesos: 0,
          procesos: [],
        }),
    /^\d{5,15}$/.test(cleanCedula.replace(/[^\d]/g, ''))
      ? consultarContraloriaFiscalPorCedula({
          tipoDoc: cleanTipoDoc,
          cedula: cleanCedula,
          includePdf: includeEvidence !== false,
        })
      : Promise.resolve(null),
  ]);

  let pdfBase64 = contraloria?.pdfBase64 || null;
  let pdfFileName = contraloria?.pdfFileName || null;
  let imageBase64 = contraloria?.imageBase64 || null;
  let imageFileName = contraloria?.imageFileName || null;

  if (!pdfBase64 && rj.ok && (rj.totalProcesos > 0 || forceEvidence) && includeEvidence !== false) {
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const subjectTag = sanitizeFileStem(cleanCedula || cleanNombre || 'Ciudadano', 'Ciudadano').slice(0, 40);
      const htmlContent = buildRamaJudicialEvidenceHtml(rj, {
        tipoDoc: cleanTipoDoc,
        cedula: cleanCedula,
      });
      const evid = await captureWebOrHtmlEvidence({
        htmlContent,
        filePrefix: `Constancia_RamaJudicial_${subjectTag}_${todayISO}`,
      });
      pdfBase64 = evid.pdfBase64;
      pdfFileName = evid.pdfFileName;
      imageBase64 = evid.imageBase64;
      imageFileName = evid.imageFileName;
    } catch (evErr) {
      logger.warn(`[OSINT Rama Judicial] Aviso generando evidencia PDF/PNG: ${evErr.message}`);
    }
  }

  const totalProcesos = Number(rj.totalProcesos || 0);
  const reportadoFiscal = Boolean(contraloria?.reportadoFiscal);
  let estadoReal = '⚠️ CONSULTA PARCIAL DE ANTECEDENTES';
  if (reportadoFiscal) {
    estadoReal = '⚠️ REPORTADO EN CONTRALORÍA FISCAL';
  } else if (totalProcesos > 0) {
    estadoReal = `⚠️ ${totalProcesos} PROCESO(S) EN RAMA JUDICIAL`;
  } else if (rj.ok && contraloria?.ok) {
    estadoReal = '✅ SIN ANTECEDENTES JUDICIALES NI FISCALES';
  } else if (contraloria?.ok) {
    estadoReal = '✅ SIN ANTECEDENTES FISCALES (CONTRALORÍA)';
  } else if (rj.ok) {
    estadoReal = '✅ SIN PROCESOS JUDICIALES ACTIVOS';
  }

  const partesResumen = [];
  if (rj.ok) {
    partesResumen.push(
      totalProcesos > 0
        ? `Rama Judicial: ${totalProcesos} proceso(s) (${rj.procesos
            .slice(0, 2)
            .map((p) => `${p.llaveProceso || p.idProceso} - ${p.despacho}`)
            .join('; ')})`
        : `Rama Judicial: 0 procesos activos para "${cleanNombre}"`,
    );
  } else if (rj.aviso) {
    partesResumen.push(rj.aviso);
  }
  if (contraloria?.ok) {
    partesResumen.push(
      reportadoFiscal
        ? `Contraloría General (${cleanTipoDoc} ${cleanCedula}): REPORTADO como responsable fiscal`
        : `Contraloría General (${cleanTipoDoc} ${cleanCedula}): NO reportado como responsable fiscal (certificado PDF oficial descargado)`,
    );
  }

  const resumen =
    partesResumen.join(' · ') ||
    `Consulta de antecedentes ejecutada para ${cleanNombre || `${cleanTipoDoc} ${cleanCedula}`}`;

  return {
    ...rj,
    ok: Boolean(rj.ok || contraloria?.ok),
    documento: cleanCedula || undefined,
    tipoDoc: cleanTipoDoc,
    contraloria: contraloria
      ? {
          ok: contraloria.ok,
          sinResponsabilidadFiscal: contraloria.sinResponsabilidadFiscal,
          reportadoFiscal: contraloria.reportadoFiscal,
        }
      : null,
    afiliadoActivo: totalProcesos === 0 && !reportadoFiscal && Boolean(rj.ok || contraloria?.ok),
    tieneHallazgo: totalProcesos > 0 || reportadoFiscal,
    tieneCertificado: Boolean(pdfBase64),
    estadoReal,
    pdfBase64,
    pdfFileName,
    imageBase64,
    imageFileName,
    fuente:
      'Google Antigravity Local (IP Colombia · Rama Judicial API v2 + Contraloría General)',
    status: rj.ok || contraloria?.ok ? 'ok' : 'warning',
    resumen,
  };
}

/**
 * 1. Consulta REAL por cédula en ARL SURA (HTTP directo + PDF real), ARL Positiva (API directa)
 *    y ARL Seguros Bolívar (Puppeteer con interceptación Lambda cuando hay fechaNacimiento o ARL Bolívar).
 */
async function consultarArlRealPorCedula({
  tipoDoc = 'CC',
  cedula = '',
  nombre = '',
  fechaNacimiento = '',
  arl = '',
  includeEvidence = true,
} = {}) {
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();
  const cleanCedula = String(cedula || '').replace(/[^\dA-Za-z]/g, '').trim();
  const cleanNombre = String(nombre || '').trim();
  const cleanFechaNac = formatCleanFechaNacimiento(fechaNacimiento);
  const cleanArl = String(arl || '').trim();

  if (!cleanCedula) {
    return {
      fuente: 'Google Antigravity Local (IP Colombia · ARL Real)',
      status: 'warning',
      action: 'arl',
      tipoDoc: cleanTipoDoc,
      documento: '',
      nombre: cleanNombre,
      afiliadoActivo: false,
      tieneCertificado: false,
      estadoReal: '⚠️ DOCUMENTO VACÍO',
      pdfBase64: null,
      pdfFileName: null,
      imageBase64: null,
      imageFileName: null,
      resumen: 'No se suministró número de documento para consultar afiliación ARL.',
      detalles: [],
    };
  }

  const detalles = [];
  const consultasTexto = [];
  let afiliadoActivo = false;
  let entidadDetectada = '';
  let empleadorDetalle = '';
  let historialRetirado = false;
  let bolivarRetiroEmpresa = '';
  let bolivarRetiroFechaFin = '';
  let pdfBase64 = null;
  let pdfFileName = null;
  let imageBase64 = null;
  let imageFileName = null;

  // 1) ARL SURA + ARL Positiva bajo semáforo HTTP ligero (~200-350ms, CERO navegador)
  await runWithArlHttpSlot(async () => {
    const suraTipoMap = { CC: 'C', CE: 'E', TI: 'T', PA: 'P', PPT: 'X', NIT: 'N', PE: 'P' };
    const suraTipo = suraTipoMap[cleanTipoDoc] || 'C';
    const suraUrl = 'https://www.arlsura.com/index.php/com-es-afiliado?tmpl=component';

    // 1.A — ARL SURA
    try {
      const t0 = Date.now();
      const suraFormBody = new URLSearchParams({
        tipo_consulta: 'persona',
        tipo_doc: suraTipo,
        numero_doc: cleanCedula,
        tipo: '2',
      }).toString();

      const r1 = await insecureHttpsRequest(suraUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: suraUrl,
        },
        body: suraFormBody,
        timeoutMs: 12000,
      });
      const html1 = r1.buf.toString('utf8');
      const latencyMs = Date.now() - t0;
      const isNoAfiliadoSura = /no\s+se\s+encuentra\s+afiliad/i.test(html1);
      const isAfiliadoSura = !isNoAfiliadoSura && /se\s+encuentra\s+afiliad/i.test(html1);

      if (isAfiliadoSura) {
        afiliadoActivo = true;
        entidadDetectada = 'ARL SURA';
        consultasTexto.push('ARL SURA: Afiliado activo');
        detalles.push({
          entidad: 'ARL SURA',
          url: suraUrl,
          consultadoPorCedula: true,
          afiliadoActivo: true,
          estado: 'AFILIADO ACTIVO',
          latencyMs,
        });

        if (includeEvidence !== false) {
          const formBlockMatch = html1.match(/<form[^>]*id=["']frm_cert["'][^>]*>([\s\S]*?)<\/form>/i);
          if (formBlockMatch) {
            const certParams = new URLSearchParams();
            for (const inpMatch of formBlockMatch[1].matchAll(/<input\b([^>]*)>/gi)) {
              const attrs = inpMatch[1] || '';
              const nameM = attrs.match(/\bname=["']([^"']+)["']/i);
              const valM = attrs.match(/\bvalue=["']([^"']*)["']/i);
              if (nameM && nameM[1]) {
                certParams.set(nameM[1], decodeHtmlEntities(valM ? valM[1] : ''));
              }
            }
            if (!certParams.has('certificado')) {
              certParams.set('certificado', 'Descargar Certificado');
            }
            const rCert = await insecureHttpsRequest(suraUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Referer: suraUrl,
              },
              cookieHeader: r1.cookieHeader,
              body: certParams.toString(),
              timeoutMs: 15000,
            });
            if (rCert.buf.length > 500 && rCert.buf.subarray(0, 5).toString('ascii').startsWith('%PDF')) {
              pdfBase64 = rCert.buf.toString('base64');
              pdfFileName = `Certificado_ARL_SURA_${cleanCedula}.pdf`;
            }
          }
        }
      } else {
        consultasTexto.push('ARL SURA: No afiliado');
        detalles.push({
          entidad: 'ARL SURA',
          url: suraUrl,
          consultadoPorCedula: true,
          afiliadoActivo: false,
          estado: 'No afiliado',
          latencyMs,
        });
      }
    } catch (suraErr) {
      consultasTexto.push(`ARL SURA: Error (${suraErr.message})`);
      detalles.push({
        entidad: 'ARL SURA',
        url: suraUrl,
        consultadoPorCedula: false,
        afiliadoActivo: false,
        error: suraErr.message,
      });
    }

    // 1.B — ARL Positiva (solo si no salió activo en SURA)
    if (!afiliadoActivo) {
      const posUrl = `https://gal-back.linktic.com/afiliaciones/certificates/certificateWorkerByEmployer?tipoDoc=${encodeURIComponent(cleanTipoDoc)}&idAfiliado=${encodeURIComponent(cleanCedula)}`;
      try {
        const t0 = Date.now();
        const rPos = await insecureHttpsRequest(posUrl, {
          method: 'GET',
          headers: { Accept: 'application/json, application/pdf, */*' },
          timeoutMs: 12000,
        });
        const latencyMs = Date.now() - t0;
        const isPosPdf =
          rPos.buf.length > 500 && rPos.buf.subarray(0, 5).toString('ascii').startsWith('%PDF');
        const posText = isPosPdf ? '' : rPos.buf.toString('utf8');

        if (rPos.status === 200 && isPosPdf) {
          afiliadoActivo = true;
          entidadDetectada = 'ARL Positiva';
          consultasTexto.push('ARL Positiva: Afiliado activo');
          detalles.push({
            entidad: 'ARL Positiva',
            url: posUrl,
            consultadoPorCedula: true,
            afiliadoActivo: true,
            estado: 'AFILIADO ACTIVO',
            latencyMs,
          });
          if (includeEvidence !== false) {
            pdfBase64 = rPos.buf.toString('base64');
            pdfFileName = `Certificado_ARL_Positiva_${cleanCedula}.pdf`;
          }
        } else if (
          rPos.status === 200 &&
          !/AFFILIATION_NOT_FOUND|no\s+se\s+encuentra/i.test(posText)
        ) {
          let posJson = null;
          try {
            posJson = JSON.parse(posText);
          } catch (_) {}
          if (posJson && !posJson.error) {
            afiliadoActivo = true;
            entidadDetectada = 'ARL Positiva';
            empleadorDetalle = String(
              posJson.razonSocial || posJson.empleador || posJson.empresa || '',
            ).trim();
            consultasTexto.push(
              `ARL Positiva: Afiliado activo${empleadorDetalle ? ` (${empleadorDetalle})` : ''}`,
            );
            detalles.push({
              entidad: 'ARL Positiva',
              url: posUrl,
              consultadoPorCedula: true,
              afiliadoActivo: true,
              estado: 'AFILIADO ACTIVO',
              empleador: empleadorDetalle || undefined,
              latencyMs,
            });
          } else {
            consultasTexto.push('ARL Positiva: No afiliado');
            detalles.push({
              entidad: 'ARL Positiva',
              url: posUrl,
              consultadoPorCedula: true,
              afiliadoActivo: false,
              estado: 'No afiliado',
              latencyMs,
            });
          }
        } else {
          consultasTexto.push('ARL Positiva: No afiliado');
          detalles.push({
            entidad: 'ARL Positiva',
            url: posUrl,
            consultadoPorCedula: true,
            afiliadoActivo: false,
            estado: 'No afiliado',
            latencyMs,
          });
        }
      } catch (posErr) {
        consultasTexto.push(`ARL Positiva: Error (${posErr.message})`);
        detalles.push({
          entidad: 'ARL Positiva',
          url: posUrl,
          consultadoPorCedula: false,
          afiliadoActivo: false,
          error: posErr.message,
        });
      }
    }
  });

  // Convertir PDF oficial de SURA o Positiva a PNG fuera del slot HTTP
  if (pdfBase64 && !imageBase64) {
    imageBase64 = await convertPdfBase64ToPngBase64(pdfBase64);
    if (imageBase64 && pdfFileName) {
      imageFileName = pdfFileName.replace(/\.pdf$/i, '.png');
    }
  }

  // 2) ARL Seguros Bolívar (solo si no salió activo en SURA ni Positiva, y su ARL dice Bolívar o no tiene otra ARL explícita en nómina con fechaNacimiento disponible)
  const mentionsBolivar = /bol[ií]var/i.test(cleanArl);
  const hasNoKnownOtherArl =
    !cleanArl || /^(por\s*registrar|sin\s*registrar|ninguna|n\/?a|-)$/i.test(cleanArl);
  const fechaNacDmy = toBirthDateDmySlash(cleanFechaNac);
  if (!afiliadoActivo && (mentionsBolivar || (hasNoKnownOtherArl && fechaNacDmy))) {
    if (!fechaNacDmy) {
      consultasTexto.push('ARL Bolívar: Requiere Fecha de Nacimiento para consultar');
      detalles.push({
        entidad: 'ARL Seguros Bolívar',
        url: 'https://www.segurosbolivar.com/arl',
        consultadoPorCedula: false,
        afiliadoActivo: false,
        estado: 'Falta Fecha de Nacimiento',
      });
    } else {
      try {
        const t0 = Date.now();
        const bolResult = await runWithPuppeteerPage(async (page) => {
          let interceptedJson = null;
          page.on('response', async (res) => {
            const u = res.url();
            if (
              (u.includes('arl/lambda') || u.includes('operaciones')) &&
              res.request().method() !== 'OPTIONS'
            ) {
              try {
                interceptedJson = await res.json();
              } catch (_) {}
            }
          });

          await page.goto('https://www.segurosbolivar.com/arl', {
            waitUntil: 'domcontentloaded',
            timeout: 14000,
          });
          await page.waitForSelector('#arl-numero-documento', { timeout: 8000 });
          await page
            .waitForSelector('mat-checkbox.mat-checkbox-checked', { timeout: 6000 })
            .catch(() => {});
          await sleepMs(600);

          if (cleanTipoDoc !== 'CC') {
            const optRegexMap = {
              CE: 'extranjer',
              PA: 'pasaporte',
              PPT: 'protecci',
              TI: 'identidad',
            };
            const targetOptPattern = optRegexMap[cleanTipoDoc];
            if (targetOptPattern) {
              await page.evaluate(() => {
                document.querySelector('mat-select')?.click();
              });
              await sleepMs(350);
              await page.evaluate((pat) => {
                const re = new RegExp(pat, 'i');
                const opt = Array.from(document.querySelectorAll('mat-option')).find((o) =>
                  re.test(o.innerText || ''),
                );
                if (opt) opt.click();
              }, targetOptPattern);
              await sleepMs(250);
            }
          }

          await page.focus('#arl-numero-documento');
          await page.keyboard.type(cleanCedula, { delay: 16 });
          await page.focus('#calendarId');
          await page.keyboard.type(fechaNacDmy, { delay: 16 });
          await page.keyboard.press('Tab');
          await sleepMs(300);

          // Verificar que hidratación SSR no haya limpiado los campos antes de enviar
          const docFilled = await page.evaluate(
            () => (document.querySelector('#arl-numero-documento')?.value || '').trim().length > 0,
          );
          if (!docFilled) {
            await page.focus('#arl-numero-documento');
            await page.keyboard.type(cleanCedula, { delay: 16 });
            await page.focus('#calendarId');
            await page.keyboard.type(fechaNacDmy, { delay: 16 });
            await page.keyboard.press('Tab');
            await sleepMs(250);
          }

          await page.evaluate(() => {
            const mc = document.querySelector('mat-checkbox');
            if (mc && !mc.classList.contains('mat-checkbox-checked')) {
              document.querySelector('#mat-checkbox-1-input')?.click();
            }
            const cBtn = Array.from(document.querySelectorAll('button')).find(
              (b) => (b.innerText || '').trim() === 'Consultar',
            );
            if (cBtn) cBtn.click();
          });

          for (let i = 0; i < 24 && !interceptedJson; i++) {
            await sleepMs(350);
          }

          let bolPdfBuf = null;
          const empresas = Array.isArray(interceptedJson?.result?.data?.empresas)
            ? interceptedJson.result.data.empresas
            : [];
          const hasActiveInBolivar = empresas.some(
            (emp) =>
              Array.isArray(emp.afiliaciones) &&
              emp.afiliaciones.some((af) =>
                ['ACT', 'VIG', 'ACTIVO', 'VIGENTE'].includes(
                  String(af?.estado || '').toUpperCase().trim(),
                ),
              ),
          );
          if (hasActiveInBolivar && includeEvidence !== false) {
            await sleepMs(800);
            try {
              bolPdfBuf = Buffer.from(await page.pdf({ format: 'A4', printBackground: true }));
            } catch (_) {}
          }
          return { interceptedJson, bolPdfBuf };
        }, 22000);

        const latencyMs = Date.now() - t0;
        const empresas = Array.isArray(bolResult?.interceptedJson?.result?.data?.empresas)
          ? bolResult.interceptedJson.result.data.empresas
          : [];

        let activeEmp = null;
        let retiredEmp = null;
        let retiredAf = null;

        for (const emp of empresas) {
          const afs = Array.isArray(emp?.afiliaciones) ? emp.afiliaciones : [];
          for (const af of afs) {
            const est = String(af?.estado || '').toUpperCase().trim();
            if (['ACT', 'VIG', 'ACTIVO', 'VIGENTE'].includes(est)) {
              activeEmp = emp;
              break;
            }
            if (!retiredEmp && (est === 'RET' || est.startsWith('RET'))) {
              retiredEmp = emp;
              retiredAf = af;
            }
          }
          if (activeEmp) break;
        }

        if (activeEmp) {
          afiliadoActivo = true;
          entidadDetectada = 'ARL Seguros Bolívar';
          empleadorDetalle = String(activeEmp.nombreEmpresa || '').trim();
          consultasTexto.push(
            `ARL Bolívar: Afiliado activo${empleadorDetalle ? ` (${empleadorDetalle})` : ''}`,
          );
          detalles.push({
            entidad: 'ARL Seguros Bolívar',
            url: 'https://www.segurosbolivar.com/arl',
            consultadoPorCedula: true,
            afiliadoActivo: true,
            estado: 'AFILIADO ACTIVO',
            empleador: empleadorDetalle || undefined,
            latencyMs,
          });
          if (
            includeEvidence !== false &&
            bolResult.bolPdfBuf &&
            bolResult.bolPdfBuf.subarray(0, 5).toString('ascii').startsWith('%PDF')
          ) {
            pdfBase64 = bolResult.bolPdfBuf.toString('base64');
            pdfFileName = `Certificado_ARL_Bolivar_${cleanCedula}.pdf`;
            imageBase64 = await convertPdfBase64ToPngBase64(pdfBase64);
            imageFileName = imageBase64 ? `Certificado_ARL_Bolivar_${cleanCedula}.png` : null;
          }
        } else if (retiredEmp) {
          historialRetirado = true;
          bolivarRetiroEmpresa = String(retiredEmp.nombreEmpresa || 'Empresa anterior').trim();
          bolivarRetiroFechaFin = String(retiredAf?.fechaFinCobertura || '').slice(0, 10);
          consultasTexto.push(
            `ARL Bolívar: Retirado (${bolivarRetiroEmpresa}${bolivarRetiroFechaFin ? `, fin: ${bolivarRetiroFechaFin}` : ''})`,
          );
          detalles.push({
            entidad: 'ARL Seguros Bolívar',
            url: 'https://www.segurosbolivar.com/arl',
            consultadoPorCedula: true,
            afiliadoActivo: false,
            estado: 'RET',
            empleador: bolivarRetiroEmpresa,
            fechaFinCobertura: bolivarRetiroFechaFin || undefined,
            latencyMs,
          });
        } else {
          consultasTexto.push('ARL Bolívar: No afiliado');
          detalles.push({
            entidad: 'ARL Seguros Bolívar',
            url: 'https://www.segurosbolivar.com/arl',
            consultadoPorCedula: true,
            afiliadoActivo: false,
            estado: 'No afiliado',
            latencyMs,
          });
        }
      } catch (bolErr) {
        logger.warn(`[OSINT ARL Bolívar] Aviso consultando ${cleanCedula}: ${bolErr.message}`);
        consultasTexto.push(`ARL Bolívar: Aviso (${bolErr.message})`);
        detalles.push({
          entidad: 'ARL Seguros Bolívar',
          url: 'https://www.segurosbolivar.com/arl',
          consultadoPorCedula: false,
          afiliadoActivo: false,
          error: bolErr.message,
        });
      }
    }
  }

  let estadoReal = '';
  let resumen = '';

  if (afiliadoActivo) {
    const labelEntidad =
      entidadDetectada === 'ARL Seguros Bolívar' ? 'ARL BOLÍVAR' : entidadDetectada.toUpperCase();
    estadoReal = `✅ AFILIADO ACTIVO EN ${labelEntidad}`;
    const normDet = entidadDetectada.toLowerCase();
    const normNomina = cleanArl.toLowerCase().replace(/^arl\s+/i, '').trim();
    const mismatchNote =
      normNomina && !normDet.includes(normNomina.slice(0, 5))
        ? ` · Nota: en ficha figura "${cleanArl}"`
        : '';
    resumen = `Confirmado afiliado activo en ${entidadDetectada}${empleadorDetalle ? ` (${empleadorDetalle})` : ''}${pdfBase64 ? ' · Certificado oficial descargado' : ''}${mismatchNote}`;
  } else {
    // PROHIBIDO devolver PDF/PNG falso cuando no hay afiliación activa
    pdfBase64 = null;
    pdfFileName = null;
    imageBase64 = null;
    imageFileName = null;

    if (historialRetirado) {
      estadoReal = '⚪ RETIRADO EN ARL BOLÍVAR (SIN ARL ACTIVA)';
      resumen = `Sin afiliación activa en ARL SURA, Positiva ni Bolívar · Historial retirado en ARL Bolívar: ${bolivarRetiroEmpresa}${bolivarRetiroFechaFin ? ` (fin: ${bolivarRetiroFechaFin})` : ''}`;
    } else if (/colmena|axa|colpatria|equidad|aurora/i.test(cleanArl)) {
      estadoReal = `⚪ NO EN SURA/POSITIVA (Nómina: ${cleanArl})`;
      resumen = `${consultasTexto.join(' · ')} · En Somos SST figura "${cleanArl}" (portal empresarial requiere clave/validación privada)`;
    } else {
      estadoReal = '❌ SIN AFILIACIÓN EN SURA / POSITIVA';
      resumen = `${consultasTexto.join(' · ')}${cleanArl ? ` · En ficha figura "${cleanArl}"` : ''}`;
    }
  }

  return {
    fuente: 'Google Antigravity Local (IP Colombia · Consulta Real ARL por Cédula)',
    status: 'ok',
    action: 'arl',
    tipoDoc: cleanTipoDoc,
    documento: cleanCedula,
    nombre: cleanNombre,
    fechaNacimiento: cleanFechaNac || undefined,
    arl: cleanArl || undefined,
    afiliadoActivo,
    entidadDetectada: entidadDetectada || null,
    empleador: empleadorDetalle || null,
    historialRetirado,
    tieneCertificado: Boolean(pdfBase64),
    estadoReal,
    pdfBase64,
    pdfFileName,
    imageBase64,
    imageFileName,
    resumen,
    detalles,
  };
}

/**
 * 2. Consulta REAL de SIMIT (Comparendos, Multas y Acuerdos de Pago) por Cédula o Placa.
 */
async function consultarSimitPesvRealPorCedula({
  tipoDoc = 'CC',
  cedula = '',
  nombre = '',
  placa = '',
  includeEvidence = true,
  forceEvidence = false,
} = {}) {
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();
  const cleanCedula = String(cedula || '').replace(/[^\dA-Za-z]/g, '').trim();
  const cleanPlaca = String(placa || '').replace(/[^A-Za-z0-9]/g, '').trim().toUpperCase();
  const cleanNombre = String(nombre || '').trim();
  const queryKey = cleanPlaca || cleanCedula;

  if (!queryKey) {
    return {
      fuente: 'Google Antigravity Local (IP Colombia · SIMIT FCM)',
      status: 'warning',
      action: 'vial_pesv',
      tipoDoc: cleanTipoDoc,
      documento: cleanCedula,
      placa: cleanPlaca,
      nombre: cleanNombre,
      afiliadoActivo: false,
      tieneHallazgo: false,
      tieneCertificado: false,
      estadoReal: '⚠️ SIN CÉDULA NI PLACA PARA SIMIT',
      pdfBase64: null,
      pdfFileName: null,
      imageBase64: null,
      imageFileName: null,
      resumen: 'Se requiere número de documento o placa para consultar estado de cuenta en SIMIT.',
      detalles: [],
    };
  }

  try {
    const executeSingleSimitQuery = async (forceFreshPage = false) => {
      if (forceFreshPage && sharedSimitPage) {
        const stale = sharedSimitPage;
        sharedSimitPage = null;
        sharedSimitResponseSink = null;
        await stale.close().catch(() => {});
      }

      if (!sharedSimitPage || sharedSimitPage.isClosed()) {
        const browser = await getSharedBrowser();
        const freshPage = await browser.newPage();
        await freshPage.setViewport({ width: 1280, height: 900 });
        await freshPage.setUserAgent(DEFAULT_HEADERS['User-Agent']);
        freshPage.on('close', () => {
          if (sharedSimitPage === freshPage) {
            sharedSimitPage = null;
            sharedSimitResponseSink = null;
          }
        });
        freshPage.on('response', async (res) => {
          if (
            res.url().includes('/estadocuenta/consulta') &&
            res.request().method() === 'POST'
          ) {
            try {
              const parsed = await res.json();
              if (parsed && parsed.codigo !== 6 && typeof sharedSimitResponseSink === 'function') {
                sharedSimitResponseSink(parsed);
              }
            } catch (_) {}
          }
        });

        await freshPage.goto('https://www.fcm.org.co/simit/#/home-public', {
          waitUntil: 'domcontentloaded',
          timeout: 14000,
        });
        await freshPage.waitForSelector('#txtBusqueda', { timeout: 10000 });

        // Esperar ~1.6s por si #whcModal abre al cargar; si abre, esperar su cierre natural (sin desperdiciar 16s si no abrió)
        let sawWhcOpen = false;
        for (let w = 0; w < 30; w++) {
          const st = await freshPage.evaluate(() => {
            let hasWhc = false;
            try {
              hasWhc = Boolean(
                window.sessionStorage && window.sessionStorage.getItem('whcQuestions'),
              );
            } catch (_) {}
            const whcOpen = Boolean(document.querySelector('#whcModal.show'));
            return { hasWhc, whcOpen };
          });
          if (st.whcOpen) sawWhcOpen = true;
          if (!st.whcOpen && (st.hasWhc || sawWhcOpen || w >= 4)) break;
          await sleepMs(400);
        }

        await freshPage.evaluate(() => {
          document
            .querySelectorAll('#modalInformation .close, .modal.show button.close')
            .forEach((btn) => {
              const modal = btn.closest('.modal');
              if (!modal || modal.id !== 'whcModal') {
                btn.click();
              }
            });
        });
        await sleepMs(600);
        sharedSimitPage = freshPage;
      }

      const page = sharedSimitPage;
      let simitJson = null;
      sharedSimitResponseSink = (payload) => {
        simitJson = payload;
      };

      // Cerrar cualquier modal informativo residual y limpiar #txtBusqueda antes de escribir
      await page.evaluate(() => {
        document
          .querySelectorAll('#modalInformation .close, .modal.show button.close')
          .forEach((btn) => {
            const modal = btn.closest('.modal');
            if (!modal || modal.id !== 'whcModal') {
              btn.click();
            }
          });
        const inp = document.querySelector('#txtBusqueda');
        if (inp) {
          inp.value = '';
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await sleepMs(150);

      await page.click('#txtBusqueda');
      await page.type('#txtBusqueda', queryKey, { delay: 25 });

      const hasHomeConsultar = await page.$('#consultar');
      if (hasHomeConsultar) {
        await page.click('#consultar');
      } else {
        const hasSearchIconBtn = await page.$('#btnNumDocPlaca');
        if (hasSearchIconBtn) {
          await page.click('#btnNumDocPlaca');
        } else {
          await page.keyboard.press('Enter');
        }
      }

      for (let i = 0; i < 30 && !simitJson; i++) {
        await sleepMs(350);
      }
      sharedSimitResponseSink = null;

      if (!simitJson) {
        return { simitJson: null, pdfBuf: null };
      }

      const multas = Array.isArray(simitJson.multas) ? simitJson.multas : [];
      const comparendos = Array.isArray(simitJson.comparendos) ? simitJson.comparendos : [];
      const hasFines = multas.length + comparendos.length > 0;

      let pdfBuf = null;
      if ((hasFines && includeEvidence !== false) || forceEvidence === true) {
        await sleepMs(900);
        try {
          pdfBuf = Buffer.from(await page.pdf({ format: 'A4', printBackground: true }));
        } catch (_) {}
      }

      return { simitJson, pdfBuf };
    };

    const simitOut = await runWithSimitMutex(async () => {
      sharedPuppeteerActiveCount += 1;
      let hardTimer = null;
      try {
        const runAttempt = async () => {
          const hadWarmPage = Boolean(sharedSimitPage && !sharedSimitPage.isClosed());
          let out = await executeSingleSimitQuery(false);
          if (!out?.simitJson && hadWarmPage) {
            out = await executeSingleSimitQuery(true);
          }
          return out;
        };
        const timeoutPromise = new Promise((_, reject) => {
          hardTimer = setTimeout(() => {
            reject(new Error('Timeout de navegador SIMIT (32000ms)'));
          }, 32000);
        });
        return await Promise.race([runAttempt(), timeoutPromise]);
      } finally {
        if (hardTimer) clearTimeout(hardTimer);
        sharedSimitResponseSink = null;
        sharedPuppeteerActiveCount = Math.max(0, sharedPuppeteerActiveCount - 1);
        scheduleSharedBrowserIdleClose();
      }
    });

    if (!simitOut?.simitJson) {
      return {
        fuente: 'Google Antigravity Local (IP Colombia · SIMIT FCM)',
        status: 'warning',
        action: 'vial_pesv',
        tipoDoc: cleanTipoDoc,
        documento: cleanCedula,
        placa: cleanPlaca,
        nombre: cleanNombre,
        afiliadoActivo: false,
        tieneHallazgo: false,
        tieneCertificado: false,
        estadoReal: '⚠️ SIMIT EN VALIDACIÓN DE SEGURIDAD (REINTENTAR)',
        pdfBase64: null,
        pdfFileName: null,
        imageBase64: null,
        imageFileName: null,
        resumen: `El microservicio de estado de cuenta SIMIT tardó en responder la validación de seguridad para ${cleanPlaca ? `Placa ${cleanPlaca}` : `${cleanTipoDoc} ${cleanCedula}`}.`,
        detalles: [],
      };
    }

    const { simitJson, pdfBuf } = simitOut;
    const multas = Array.isArray(simitJson.multas) ? simitJson.multas : [];
    const comparendos = Array.isArray(simitJson.comparendos) ? simitJson.comparendos : [];
    const acuerdosPago = Array.isArray(simitJson.acuerdosPago) ? simitJson.acuerdosPago : [];
    const todosItems = [...multas, ...comparendos];
    const totalComparendosMultas = todosItems.length;
    const sumaValorPagar =
      simitJson.totalGeneral != null
        ? Number(simitJson.totalGeneral)
        : todosItems.reduce((acc, item) => acc + Number(item?.valorPagar || item?.valor || 0), 0);
    const valorFormateado = new Intl.NumberFormat('es-CO').format(Math.round(sumaValorPagar));

    let pdfBase64 = null;
    let pdfFileName = null;
    let imageBase64 = null;
    let imageFileName = null;

    if (
      pdfBuf &&
      pdfBuf.length > 500 &&
      pdfBuf.subarray(0, 5).toString('ascii').startsWith('%PDF')
    ) {
      pdfBase64 = pdfBuf.toString('base64');
      const safeTag = sanitizeFileStem(queryKey, 'SIMIT');
      pdfFileName = `EstadoCuenta_SIMIT_${safeTag}.pdf`;
      imageBase64 = await convertPdfBase64ToPngBase64(pdfBase64);
      imageFileName = imageBase64 ? `EstadoCuenta_SIMIT_${safeTag}.png` : null;
    }

    if (totalComparendosMultas > 0) {
      const detalleInfracciones = todosItems
        .slice(0, 4)
        .map((it) => {
          const cod = it?.infracciones?.[0]?.codigoInfraccion || 'Infracción';
          const pl = it?.placa ? `Placa ${it.placa}` : '';
          const org = it?.organismoTransito || it?.departamento || '';
          const valItem = new Intl.NumberFormat('es-CO').format(
            Math.round(Number(it?.valorPagar || it?.valor || 0)),
          );
          const est = it?.estadoCartera || it?.estadoComparendo || '';
          return [cod, pl, org, `$${valItem}`, est].filter(Boolean).join(' · ');
        })
        .join(' | ');

      return {
        fuente: 'Google Antigravity Local (IP Colombia · SIMIT Federación Colombiana de Municipios)',
        status: 'ok',
        action: 'vial_pesv',
        tipoDoc: cleanTipoDoc,
        documento: cleanCedula,
        placa: cleanPlaca,
        nombre: cleanNombre,
        afiliadoActivo: false,
        tieneHallazgo: true,
        tieneCertificado: Boolean(pdfBase64),
        totalMultas: multas.length,
        totalComparendos: comparendos.length,
        totalAcuerdosPago: acuerdosPago.length,
        totalPagar: sumaValorPagar,
        estadoReal: `⚠️ ${totalComparendosMultas} MULTA(S)/COMPARENDO(S) SIMIT ($${valorFormateado})`,
        pdfBase64,
        pdfFileName,
        imageBase64,
        imageFileName,
        resumen: `Registra ${multas.length} multa(s) y ${comparendos.length} comparendo(s) en SIMIT por total $${valorFormateado} COP [${detalleInfracciones}]`,
        detalles: todosItems.slice(0, 10).map((it) => ({
          entidad: 'SIMIT FCM',
          numero: it?.numeroComparendo || it?.numeroResolucion || '',
          placa: it?.placa || '',
          infraccion: it?.infracciones?.[0]?.codigoInfraccion || '',
          descripcion: it?.infracciones?.[0]?.descripcionInfraccion || '',
          organismoTransito: it?.organismoTransito || '',
          estadoCartera: it?.estadoCartera || it?.estadoComparendo || '',
          valorPagar: Number(it?.valorPagar || it?.valor || 0),
        })),
      };
    }

    return {
      fuente: 'Google Antigravity Local (IP Colombia · SIMIT Federación Colombiana de Municipios)',
      status: 'ok',
      action: 'vial_pesv',
      tipoDoc: cleanTipoDoc,
      documento: cleanCedula,
      placa: cleanPlaca,
      nombre: cleanNombre,
      afiliadoActivo: true,
      tieneHallazgo: false,
      tieneCertificado: Boolean(pdfBase64),
      totalMultas: 0,
      totalComparendos: 0,
      totalAcuerdosPago: acuerdosPago.length,
      totalPagar: 0,
      estadoReal: '✅ PAZ Y SALVO EN SIMIT ($0)',
      pdfBase64,
      pdfFileName,
      imageBase64,
      imageFileName,
      resumen: `0 comparendos, 0 multas y ${acuerdosPago.length} acuerdo(s) pendientes en SIMIT Federación Colombiana de Municipios para ${cleanPlaca ? `Placa ${cleanPlaca}` : `${cleanTipoDoc} ${cleanCedula}`}`,
      detalles: [],
    };
  } catch (err) {
    logger.warn(`[OSINT SIMIT] Aviso consultando ${queryKey}: ${err.message}`);
    return {
      fuente: 'Google Antigravity Local (IP Colombia · SIMIT FCM)',
      status: 'warning',
      action: 'vial_pesv',
      tipoDoc: cleanTipoDoc,
      documento: cleanCedula,
      placa: cleanPlaca,
      nombre: cleanNombre,
      afiliadoActivo: false,
      tieneHallazgo: false,
      tieneCertificado: false,
      estadoReal: '⚠️ ERROR CONSULTANDO SIMIT',
      pdfBase64: null,
      pdfFileName: null,
      imageBase64: null,
      imageFileName: null,
      resumen: `Aviso al consultar SIMIT para ${queryKey}: ${err.message}`,
      detalles: [],
    };
  }
}

/**
 * 3. Consulta REAL de Afiliación Pensional en Porvenir AFP por Cédula (descarga PDF oficial si está afiliado).
 */
async function consultarPensionesRealPorCedula({
  tipoDoc = 'CC',
  cedula = '',
  nombre = '',
  afp = '',
  fechaNacimiento = '',
  includeEvidence = true,
} = {}) {
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();
  const cleanCedula = String(cedula || '').replace(/[^\dA-Za-z]/g, '').trim();
  const cleanNombre = String(nombre || '').trim();
  const cleanAfp = String(afp || '').trim();
  const cleanFechaNac = formatCleanFechaNacimiento(fechaNacimiento);

  if (!cleanCedula) {
    return {
      fuente: 'Google Antigravity Local (IP Colombia · Porvenir AFP)',
      status: 'warning',
      action: 'pensiones',
      tipoDoc: cleanTipoDoc,
      documento: '',
      nombre: cleanNombre,
      afiliadoActivo: false,
      tieneCertificado: false,
      estadoReal: '⚠️ DOCUMENTO VACÍO',
      pdfBase64: null,
      pdfFileName: null,
      imageBase64: null,
      imageFileName: null,
      resumen: 'No se suministró número de documento para consultar fondo de pensiones.',
      detalles: [],
    };
  }

  const porvUrl =
    'https://www.porvenir.com.co/web/certificados-y-extractos/certificado-de-afiliacion';
  const porvTipo = ['CC', 'CE', 'TI'].includes(cleanTipoDoc) ? cleanTipoDoc : 'CC';

  try {
    const porvOut = await runWithPuppeteerPage(async (page) => {
      let certResp = null;
      page.on('response', async (res) => {
        if (res.url().includes('descargaCerAfi')) {
          try {
            const buf = await res.buffer();
            certResp = {
              status: res.status(),
              ct: String(res.headers()['content-type'] || '').toLowerCase(),
              buf,
            };
          } catch (_) {}
        }
      });

      await page.goto(porvUrl, { waitUntil: 'domcontentloaded', timeout: 14000 });
      await page.waitForSelector('select[id$="_documento"]', { timeout: 9000 });
      await sleepMs(600);
      await page.select('select[id$="_documento"]', porvTipo);
      await page.focus('input[id$="_numeroIdentificacion"]');
      await page.keyboard.type(cleanCedula, { delay: 18 });
      await page.evaluate(() => {
        document.querySelector('#submitDescargarCertificado')?.click();
      });

      for (let i = 0; i < 25 && !certResp; i++) {
        await sleepMs(400);
      }
      return certResp;
    }, 18000);

    const isPdf =
      porvOut?.buf &&
      porvOut.buf.length > 500 &&
      (porvOut.ct.includes('pdf') || porvOut.buf.subarray(0, 5).toString('ascii').startsWith('%PDF'));

    if (isPdf) {
      let pdfBase64 = null;
      let pdfFileName = null;
      let imageBase64 = null;
      let imageFileName = null;
      if (includeEvidence !== false) {
        pdfBase64 = porvOut.buf.toString('base64');
        pdfFileName = `Certificado_Porvenir_${cleanCedula}.pdf`;
        imageBase64 = await convertPdfBase64ToPngBase64(pdfBase64);
        imageFileName = imageBase64 ? `Certificado_Porvenir_${cleanCedula}.png` : null;
      }
      const mismatchNote =
        cleanAfp && !/porvenir/i.test(cleanAfp) ? ` · Nota: en ficha figura "${cleanAfp}"` : '';
      return {
        fuente: 'Google Antigravity Local (IP Colombia · Porvenir AFP Real)',
        status: 'ok',
        action: 'pensiones',
        tipoDoc: cleanTipoDoc,
        documento: cleanCedula,
        nombre: cleanNombre,
        fechaNacimiento: cleanFechaNac || undefined,
        afp: cleanAfp || undefined,
        afiliadoActivo: true,
        entidadDetectada: 'Porvenir AFP',
        tieneCertificado: Boolean(pdfBase64),
        estadoReal: '✅ AFILIADO ACTIVO EN PORVENIR AFP',
        pdfBase64,
        pdfFileName,
        imageBase64,
        imageFileName,
        resumen: `Confirmado afiliado activo en Porvenir AFP para ${cleanTipoDoc} ${cleanCedula}${pdfBase64 ? ' · Certificado oficial descargado' : ''}${mismatchNote}`,
        detalles: [
          {
            entidad: 'Porvenir AFP',
            url: porvUrl,
            consultadoPorCedula: true,
            afiliadoActivo: true,
            estado: 'AFILIADO ACTIVO',
          },
        ],
      };
    }

    const estadoReal =
      cleanAfp && !/porvenir/i.test(cleanAfp)
        ? `⚪ NO EN PORVENIR (Nómina: ${cleanAfp})`
        : '❌ NO AFILIADO EN PORVENIR AFP';
    const resumen =
      `Consultado en Porvenir AFP: No registra afiliación para ${cleanTipoDoc} ${cleanCedula}` +
      (cleanAfp
        ? ` · En Somos SST figura "${cleanAfp}" (Colpensiones/Protección/Colfondos exigen fecha de expedición o clave personal)`
        : '');

    return {
      fuente: 'Google Antigravity Local (IP Colombia · Porvenir AFP Real)',
      status: 'ok',
      action: 'pensiones',
      tipoDoc: cleanTipoDoc,
      documento: cleanCedula,
      nombre: cleanNombre,
      fechaNacimiento: cleanFechaNac || undefined,
      afp: cleanAfp || undefined,
      afiliadoActivo: false,
      entidadDetectada: null,
      tieneCertificado: false,
      estadoReal,
      pdfBase64: null,
      pdfFileName: null,
      imageBase64: null,
      imageFileName: null,
      resumen,
      detalles: [
        {
          entidad: 'Porvenir AFP',
          url: porvUrl,
          consultadoPorCedula: true,
          afiliadoActivo: false,
          estado: 'No afiliado (código 201)',
        },
      ],
    };
  } catch (err) {
    logger.warn(`[OSINT Porvenir] Aviso consultando ${cleanCedula}: ${err.message}`);
    return {
      fuente: 'Google Antigravity Local (IP Colombia · Porvenir AFP)',
      status: 'warning',
      action: 'pensiones',
      tipoDoc: cleanTipoDoc,
      documento: cleanCedula,
      nombre: cleanNombre,
      afp: cleanAfp || undefined,
      afiliadoActivo: false,
      tieneCertificado: false,
      estadoReal: '⚠️ AVISO CONSULTANDO PORVENIR AFP',
      pdfBase64: null,
      pdfFileName: null,
      imageBase64: null,
      imageFileName: null,
      resumen: `Aviso al consultar Porvenir AFP para ${cleanTipoDoc} ${cleanCedula}: ${err.message}`,
      detalles: [],
    };
  }
}

/**
 * 4. Salud / EPS y ReTHUS: Transparencia estricta (ADRES BDUA y SISPRO ReTHUS exigen CAPTCHA visual por cédula).
 */
async function consultarSaludRethusRealPorCedula({
  tipoDoc = 'CC',
  cedula = '',
  nombre = '',
  eps = '',
} = {}) {
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();
  const cleanCedula = String(cedula || '').trim();
  const cleanNombre = String(nombre || '').trim();
  const cleanEps = String(eps || '').trim();

  return {
    fuente: 'Google Antigravity Local (IP Colombia · ADRES / ReTHUS)',
    status: 'ok',
    action: 'salud_rethus',
    tipoDoc: cleanTipoDoc,
    documento: cleanCedula,
    nombre: cleanNombre,
    eps: cleanEps || undefined,
    afiliadoActivo: false,
    tieneCertificado: false,
    requiereCaptchaManual: true,
    estadoReal: cleanEps
      ? `ℹ️ EPS NÓMINA: ${cleanEps.toUpperCase()} (ADRES CON CAPTCHA)`
      : '⚠️ PORTAL ADRES/RETHUS EXIGE CAPTCHA MANUAL',
    pdfBase64: null,
    pdfFileName: null,
    imageBase64: null,
    imageFileName: null,
    resumen:
      (cleanEps ? `EPS registrada en Somos SST: ${cleanEps} · ` : '') +
      'ADRES BDUA y MinSalud ReTHUS bloquean consulta masiva sin interacción humana (CAPTCHA visual por cédula).',
    detalles: [
      {
        entidad: 'ADRES BDUA (EPS)',
        url: 'https://www.adres.gov.co/consulte-su-eps',
        requiereCaptchaManual: true,
        estado: 'Requiere CAPTCHA visual manual (RadCaptcha)',
      },
      {
        entidad: 'MinSalud SISPRO ReTHUS',
        url: 'https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx',
        requiereCaptchaManual: true,
        estado: 'Requiere CAPTCHA visual manual (imgCaptcha)',
      },
    ],
  };
}

/**
 * Despachador unificado de consultas REALES por cédula / placa desde IP Colombia (CERO simulaciones ni pings genéricos):
 * - 'arl': ARL SURA (certificado PDF real) + ARL Positiva + ARL Seguros Bolívar (Lambda real)
 * - 'pensiones': Porvenir AFP (certificado PDF real / validación código 201)
 * - 'vial_pesv': SIMIT Federación Colombiana de Municipios (multas, comparendos y estado de cuenta real)
 * - 'salud_rethus': Reporte honesto de EPS en nómina + restricción CAPTCHA visual de ADRES/ReTHUS
 */
async function consultarPortalEspecíficoAntigravity({
  action = 'arl',
  tipoDoc = 'CC',
  cedula = '',
  nombre = '',
  placa = '',
  fechaNacimiento = '',
  arl = '',
  eps = '',
  afp = '',
  includeEvidence = true,
  forceEvidence = false,
} = {}) {
  const cleanAction = String(action || 'arl').toLowerCase().trim();

  if (cleanAction === 'vial_pesv') {
    return consultarSimitPesvRealPorCedula({
      tipoDoc,
      cedula,
      nombre,
      placa,
      includeEvidence,
      forceEvidence,
    });
  }

  if (cleanAction === 'pensiones') {
    return consultarPensionesRealPorCedula({
      tipoDoc,
      cedula,
      nombre,
      afp,
      fechaNacimiento,
      includeEvidence,
    });
  }

  if (cleanAction === 'salud_rethus') {
    return consultarSaludRethusRealPorCedula({
      tipoDoc,
      cedula,
      nombre,
      eps,
    });
  }

  return consultarArlRealPorCedula({
    tipoDoc,
    cedula,
    nombre,
    fechaNacimiento,
    arl,
    includeEvidence,
  });
}

function isSameOrSubdomain(hostA = '', hostB = '') {
  const a = String(hostA || '').toLowerCase().replace(/^www\./, '');
  const b = String(hostB || '').toLowerCase().replace(/^www\./, '');
  if (!a || !b) return false;
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

/**
 * Ejecuta Web Scraping genérico sobre una URL retornando texto estructurado + evidencia PDF e Imagen PNG.
 */
async function ejecutarWebScrapeConEvidencia({ targetUrl = '', includeEvidence = true } = {}) {
  const rawUrls = String(targetUrl || 'https://www.mintrabajo.gov.co')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
  const firstUrl = rawUrls[0] || 'https://www.mintrabajo.gov.co';
  const normalizedUrl = /^https?:\/\//i.test(firstUrl) ? firstUrl : `https://${firstUrl}`;
  const todayISO = new Date().toISOString().split('T')[0];

  let parsedTarget;
  try {
    parsedTarget = new URL(normalizedUrl);
  } catch (_) {
    parsedTarget = new URL('https://www.mintrabajo.gov.co');
  }
  const hostSlug = sanitizeFileStem(parsedTarget.hostname.replace(/^www\./i, ''), 'Web').slice(0, 36);
  const defaultPrefix = `Captura_WebScraper_${hostSlug}_${todayISO}`;

  try {
    const scrapeRes = await fetch(normalizedUrl, {
      headers: DEFAULT_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });

    const contentType = String(scrapeRes.headers.get('content-type') || '').toLowerCase();
    const rawBuf = Buffer.from(await scrapeRes.arrayBuffer());
    const isDirectPdf =
      contentType.includes('application/pdf') ||
      (rawBuf.length > 64 && rawBuf.subarray(0, 5).toString('ascii').startsWith('%PDF'));

    if (isDirectPdf) {
      const rawBase = path.basename(parsedTarget.pathname || '', '.pdf');
      const pdfStem = sanitizeFileStem(rawBase, `Certificado_WebScraper_${hostSlug}_${todayISO}`);
      const pdfBase64 = rawBuf.toString('base64');
      const pdfFileName = `${pdfStem}.pdf`;
      const imageBase64 = await convertPdfBase64ToPngBase64(pdfBase64);
      const imageFileName = imageBase64 ? `${pdfStem}.png` : null;

      return {
        fuente: 'Web Scraper Google Antigravity (IP Local)',
        status: 'ok',
        url: normalizedUrl,
        httpStatus: scrapeRes.status,
        contentType: contentType || 'application/pdf',
        title: pdfFileName,
        headings: [],
        pdfLinks: [normalizedUrl],
        textExcerpt: `Documento PDF oficial descargado directamente desde ${normalizedUrl} (${(rawBuf.length / 1024).toFixed(1)} KB).`,
        pdfBase64,
        pdfFileName,
        imageBase64,
        imageFileName,
      };
    }

    const html = rawBuf.toString('utf8');
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch
      ? decodeHtmlEntities(titleMatch[1].replace(/\s+/g, ' ').trim())
      : normalizedUrl;
    const headings = Array.from(html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi))
      .slice(0, 10)
      .map((m) => decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()))
      .filter(Boolean);
    const cleanBody = decodeHtmlEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    ).slice(0, 3500);

    // Extraer enlaces .pdf directos (embedded o hipervínculos)
    const pdfCandidates = [];
    const seenPdfUrls = new Set();
    const pushPdfCandidate = (rawHref, labelText = '', isEmbedded = false) => {
      if (!rawHref) return;
      try {
        const resolved = new URL(decodeHtmlEntities(rawHref).trim(), normalizedUrl);
        if (!/^https?:$/i.test(resolved.protocol)) return;
        const hrefLower = `${resolved.pathname}${resolved.search}`.toLowerCase();
        if (!hrefLower.includes('.pdf')) return;
        if (seenPdfUrls.has(resolved.href)) return;
        seenPdfUrls.add(resolved.href);
        pdfCandidates.push({
          url: resolved.href,
          hostname: resolved.hostname,
          pathname: resolved.pathname,
          text: decodeHtmlEntities(String(labelText || '').replace(/<[^>]+>/g, ' ')),
          isEmbedded,
        });
      } catch (_) {}
    };

    for (const m of html.matchAll(/<(?:iframe|embed|object)[^>]+(?:src|data)=["']([^"']+)["'][^>]*>/gi)) {
      pushPdfCandidate(m[1], 'embedded_pdf', true);
    }
    for (const m of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      pushPdfCandidate(m[1], m[2], false);
      if (pdfCandidates.length >= 15) break;
    }

    let pdfBase64 = null;
    let pdfFileName = null;
    let imageBase64 = null;
    let imageFileName = null;

    if (includeEvidence !== false && pdfCandidates.length > 0) {
      const firstCand = pdfCandidates[0];
      const sameDomain = isSameOrSubdomain(firstCand.hostname, parsedTarget.hostname);
      const candSignal = `${firstCand.url} ${firstCand.text}`;
      const looksLikeCert =
        firstCand.isEmbedded ||
        (/certificad|constancia|diploma|carnet|afiliaci|vigencia|antecedente|boletin|soporte|descarga|imprimir/i.test(
          candSignal,
        ) &&
          !/politica|privacidad|terminos|tratamiento[-_]?datos|manual[-_]?usuario/i.test(
            firstCand.url,
          ));

      if (sameDomain && looksLikeCert) {
        try {
          const pdfLinkRes = await fetch(firstCand.url, {
            headers: { ...DEFAULT_HEADERS, Referer: normalizedUrl },
            redirect: 'follow',
            signal: AbortSignal.timeout(10000),
          });
          const declaredLen = Number(pdfLinkRes.headers.get('content-length') || 0);
          if (pdfLinkRes.ok && (!declaredLen || declaredLen <= 8 * 1024 * 1024)) {
            const linkedBuf = Buffer.from(await pdfLinkRes.arrayBuffer());
            if (
              linkedBuf.length > 64 &&
              linkedBuf.length <= 8 * 1024 * 1024 &&
              linkedBuf.subarray(0, 5).toString('ascii').startsWith('%PDF')
            ) {
              const linkedStem = sanitizeFileStem(
                path.basename(firstCand.pathname || '', '.pdf'),
                `Certificado_${hostSlug}_${todayISO}`,
              );
              pdfBase64 = linkedBuf.toString('base64');
              pdfFileName = `${linkedStem}.pdf`;
              imageBase64 = await convertPdfBase64ToPngBase64(pdfBase64);
              imageFileName = imageBase64 ? `${linkedStem}.png` : null;
            }
          }
        } catch (_) {}
      }
    }

    if (includeEvidence !== false && !pdfBase64) {
      const evid = await captureWebOrHtmlEvidence({
        url: normalizedUrl,
        filePrefix: defaultPrefix,
        timeoutMs: 12000,
      });
      pdfBase64 = evid.pdfBase64;
      pdfFileName = evid.pdfFileName;
      imageBase64 = evid.imageBase64;
      imageFileName = evid.imageFileName;
    }

    return {
      fuente: 'Web Scraper Google Antigravity (IP Local)',
      status: 'ok',
      url: normalizedUrl,
      httpStatus: scrapeRes.status,
      title,
      headings,
      pdfLinks: pdfCandidates.map((c) => c.url),
      textExcerpt: cleanBody,
      pdfBase64,
      pdfFileName,
      imageBase64,
      imageFileName,
    };
  } catch (fetchErr) {
    if (includeEvidence !== false) {
      const evid = await captureWebOrHtmlEvidence({
        url: normalizedUrl,
        filePrefix: defaultPrefix,
        timeoutMs: 12000,
      });
      if (evid.pdfBase64 || evid.imageBase64) {
        return {
          fuente: 'Web Scraper Google Antigravity (IP Local · Chrome Headless)',
          status: 'ok',
          url: normalizedUrl,
          httpStatus: 200,
          title: normalizedUrl,
          headings: [],
          pdfLinks: [],
          textExcerpt: `Página capturada visualmente mediante Google Chrome Headless para ${normalizedUrl}.`,
          pdfBase64: evid.pdfBase64,
          pdfFileName: evid.pdfFileName,
          imageBase64: evid.imageBase64,
          imageFileName: evid.imageFileName,
        };
      }
    }
    throw fetchErr;
  }
}

module.exports = {
  convertPdfBase64ToPngBase64,
  captureWebOrHtmlEvidence,
  ejecutarWebScrapeConEvidencia,
  consultarAlturasMinTrabajo,
  descargarPdfConstanciaMinTrabajo,
  consultarRamaJudicialPorNombre,
  consultarContraloriaFiscalPorCedula,
  consultarRamaJudicial,
  consultarArlRealPorCedula,
  consultarSimitPesvRealPorCedula,
  consultarPensionesRealPorCedula,
  consultarSaludRethusRealPorCedula,
  consultarPortalEspecíficoAntigravity,
  consultarPortalEspecificoAntigravity: consultarPortalEspecíficoAntigravity,
  obtenerCatalogoPortales360,
  investigarTrabajador360,
};
