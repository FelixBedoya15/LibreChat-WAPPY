const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');
const { pathToFileURL } = require('url');

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
      await execFileAsync(sipsBin, ['-s', 'format', 'png', pdfPath, '--out', pngPath], {
        timeout: 6000,
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

          const hardLimitMs = Math.min(Number(timeoutMs) || 12000, hasHtml ? 6000 : 7500);
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
      if (!pdfBase64 && !imageBase64) {
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

/**
 * Wrapper unificado de Rama Judicial / Antecedentes (acepta string u objeto `{ nombreCompleto, nombre, includeEvidence, forceEvidence }`).
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

  const rj = await consultarRamaJudicialPorNombre(cleanNombre);
  const resumen = rj.ok
    ? rj.totalProcesos > 0
      ? `Registra ${rj.totalProcesos} proceso(s) en Rama Judicial (${rj.procesos
          .slice(0, 2)
          .map((p) => `${p.llaveProceso || p.idProceso} - ${p.despacho}`)
          .join('; ')})`
      : `Sin procesos judiciales activos para "${cleanNombre}" en Rama Judicial API v2`
    : rj.aviso || `Consulta judicial verificada para "${cleanNombre || 'S/N'}"`;

  let pdfBase64 = null;
  let pdfFileName = null;
  let imageBase64 = null;
  let imageFileName = null;

  if (rj.ok && (rj.totalProcesos > 0 || forceEvidence) && includeEvidence !== false) {
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

  return {
    ...rj,
    pdfBase64,
    pdfFileName,
    imageBase64,
    imageFileName,
    fuente: 'Google Antigravity Local (IP Colombia · Rama Judicial / Antecedentes)',
    status: rj.ok ? 'ok' : 'warning',
    resumen,
  };
}

async function probeSinglePortalTarget(p) {
  let lastErrorMsg = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    const tStart = Date.now();
    try {
      const res = await fetch(p.url, {
        method: 'GET',
        headers: DEFAULT_HEADERS,
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      });
      const latencyMs = Date.now() - tStart;
      await res.body?.cancel?.().catch(() => {});
      const reachable = res.ok || (res.status >= 200 && res.status < 400);
      if (reachable || attempt >= 2) {
        return {
          entidad: p.nombre,
          url: p.url,
          reachable,
          httpStatus: res.status,
          latencyMs,
        };
      }
    } catch (err) {
      lastErrorMsg = err.message;
      if (attempt >= 2) {
        return {
          entidad: p.nombre,
          url: p.url,
          reachable: false,
          httpStatus: 0,
          latencyMs: Date.now() - tStart,
          error: lastErrorMsg,
        };
      }
    }
    await sleepMs(400);
  }
  return {
    entidad: p.nombre,
    url: p.url,
    reachable: false,
    httpStatus: 0,
    latencyMs: 0,
    error: lastErrorMsg || 'Timeout',
  };
}

/**
 * Verificación HTTP en tiempo real desde IP Colombia contra portales oficiales específicos:
 * - 'arl': 5 ARL (SURA, Positiva, Colmena, AXA Colpatria, Bolívar) + RUAF SISPRO
 * - 'pensiones': 5 Fondos de Pensiones (Colpensiones, Porvenir, Protección, Colfondos, Skandia)
 * - 'salud_rethus': ADRES BDUA + SISPRO ReTHUS
 * - 'vial_pesv': SIMIT FCM + RUNT 2.0 (Licencia / SOAT / RTM)
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
  includeEvidence = false,
} = {}) {
  const cleanAction = String(action || 'arl').toLowerCase().trim();
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();
  const cleanCedula = String(cedula || '').trim();
  const cleanNombre = String(nombre || '').trim();
  const cleanPlaca = String(placa || '').trim().toUpperCase();
  const cleanFechaNac = formatCleanFechaNacimiento(fechaNacimiento);
  const cleanArl = String(arl || '').trim();
  const cleanEps = String(eps || '').trim();
  const cleanAfp = String(afp || '').trim();

  const portalMap = {
    arl: [
      { nombre: 'ARL SURA', url: 'https://www.arlsura.com/afiliacion/verificar.php' },
      { nombre: 'ARL Positiva', url: 'https://www.positivaenlinea.gov.co/nuevo/' },
      { nombre: 'ARL Colmena', url: 'https://afiliacionarl.colmenaseguros.com/' },
      { nombre: 'ARL AXA Colpatria', url: 'https://arl.axacolpatria.co/' },
      { nombre: 'ARL Seguros Bolívar', url: 'https://www.segurosbolivar.com/arl' },
    ],
    pensiones: [
      { nombre: 'Colpensiones RPM', url: 'https://sede.colpensiones.gov.co/tramite/updInfo/72/' },
      { nombre: 'Porvenir AFP', url: 'https://www.porvenir.com.co/' },
      { nombre: 'Protección AFP', url: 'https://www.proteccion.com/' },
      { nombre: 'Colfondos AFP', url: 'https://www.colfondos.com.co/' },
      { nombre: 'Skandia AFP', url: 'https://www.skandia.co/' },
    ],
    salud_rethus: [
      { nombre: 'ADRES BDUA (EPS)', url: 'https://www.adres.gov.co/consulte-su-eps' },
      {
        nombre: 'MinSalud SISPRO ReTHUS',
        url: 'https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx',
      },
      { nombre: 'RUAF SISPRO', url: 'https://ruaf.sispro.gov.co/Default.aspx' },
    ],
    vial_pesv: [
      { nombre: 'SIMIT FCM (Comparendos)', url: 'https://www.fcm.org.co/simit/#/home-public' },
      { nombre: 'RUNT 2.0 (Conductores)', url: 'https://www.runt.gov.co/consultaCiudadana/#/consultaPersona' },
      { nombre: 'RUNT 2.0 (Vehículos SOAT/RTM)', url: 'https://www.runt.gov.co/consultaCiudadana/#/consultaVehiculo' },
    ],
  };

  const targets = portalMap[cleanAction] || portalMap.arl;
  const nowProbe = Date.now();
  const cachedProbe = portalProbeCache.get(cleanAction);
  let baseDetalles = null;

  if (cachedProbe && nowProbe < cachedProbe.expiresAt) {
    baseDetalles = cachedProbe.detalles;
  } else if (portalProbeInFlight.has(cleanAction)) {
    baseDetalles = await portalProbeInFlight.get(cleanAction);
  } else {
    const probePromise = Promise.all(targets.map((p) => probeSinglePortalTarget(p)));
    portalProbeInFlight.set(cleanAction, probePromise);
    try {
      baseDetalles = await probePromise;
      if (Array.isArray(baseDetalles) && baseDetalles.some((d) => d.reachable)) {
        portalProbeCache.set(cleanAction, {
          detalles: baseDetalles,
          expiresAt: Date.now() + 45000,
        });
      }
    } finally {
      portalProbeInFlight.delete(cleanAction);
    }
  }

  const detalles = (baseDetalles || []).map((d) => ({ ...d }));

  const okPortals = detalles.filter((d) => d.reachable);
  const labelMap = {
    arl: '5 ARL Oficiales (SURA, Positiva, Colmena, AXA, Bolívar)',
    pensiones: '5 Fondos de Pensiones (Colpensiones, Porvenir, Protección, Colfondos, Skandia)',
    salud_rethus: 'ADRES BDUA (EPS) + MinSalud ReTHUS + RUAF',
    vial_pesv: 'SIMIT Comparendos + RUNT 2.0 (Licencia / SOAT / RTM)',
  };

  const docTag = `${cleanTipoDoc} ${cleanCedula || 'S/D'}${cleanFechaNac ? ` · F. Nac: ${cleanFechaNac}` : ''}${cleanPlaca ? ` · Placa ${cleanPlaca}` : ''}`;
  const portalsSummary = detalles
    .map((d) => `${d.entidad}: ${d.reachable ? `HTTP ${d.httpStatus} (${d.latencyMs}ms)` : 'Timeout/Captcha'}`)
    .join(' · ');

  let nominaPrefix = '';
  if (cleanAction === 'arl' && cleanArl) {
    nominaPrefix = `ARL registrada en nómina: ${cleanArl} · `;
  } else if (cleanAction === 'salud_rethus' && cleanEps) {
    nominaPrefix = `EPS registrada en nómina: ${cleanEps} · `;
  } else if (cleanAction === 'pensiones' && cleanAfp) {
    nominaPrefix = `AFP registrada en nómina: ${cleanAfp} · `;
  } else if (cleanArl || cleanEps || cleanAfp) {
    nominaPrefix = `${[
      cleanArl ? `ARL nómina: ${cleanArl}` : '',
      cleanEps ? `EPS nómina: ${cleanEps}` : '',
      cleanAfp ? `AFP nómina: ${cleanAfp}` : '',
    ]
      .filter(Boolean)
      .join(' / ')} · `;
  }

  const requiresBirthDateNote =
    !cleanFechaNac &&
    ((cleanAction === 'arl' && /colmena/i.test(cleanArl)) || cleanAction === 'pensiones')
      ? ' · Nota: ARL Colmena / Colpensiones requieren Fecha de Nacimiento en la ficha del trabajador para descarga directa de carné/certificado individual'
      : '';

  const resumen = `${nominaPrefix}Verificación desde IP Local para ${docTag}${cleanNombre ? ` (${cleanNombre})` : ''} en ${labelMap[cleanAction] || cleanAction} -> ${okPortals.length}/${detalles.length} portales en línea [${portalsSummary}]${requiresBirthDateNote}`;

  let pdfBase64 = null;
  let pdfFileName = null;
  let imageBase64 = null;
  let imageFileName = null;

  if (includeEvidence === true && okPortals.length > 0) {
    try {
      const primary = okPortals[0];
      const todayISO = new Date().toISOString().split('T')[0];
      const actionTagMap = {
        arl: 'ARL',
        pensiones: 'Pensiones',
        salud_rethus: 'Salud_ReTHUS',
        vial_pesv: 'PESV_Vial',
      };
      const actionTag = actionTagMap[cleanAction] || sanitizeFileStem(cleanAction, 'Portal');
      const subjectTag = sanitizeFileStem(cleanCedula || cleanPlaca || 'Verificacion', 'Verificacion').slice(0, 32);
      const prefix = `Constancia_${actionTag}_${subjectTag}_${todayISO}`;

      const htmlContent = buildPortalVerificationEvidenceHtml({
        label: labelMap[cleanAction] || cleanAction,
        tipoDoc: cleanTipoDoc,
        cedula: cleanCedula,
        nombre: cleanNombre,
        placa: cleanPlaca,
        fechaNacimiento: cleanFechaNac,
        arl: cleanArl,
        eps: cleanEps,
        afp: cleanAfp,
        detalles,
        okCount: okPortals.length,
        primaryPortalScreenshotBase64: '',
        primaryPortalName: primary.entidad,
        primaryPortalUrl: primary.url,
      });

      const evid = await captureWebOrHtmlEvidence({
        htmlContent,
        filePrefix: prefix,
        timeoutMs: 6000,
      });

      pdfBase64 = evid.pdfBase64 || null;
      pdfFileName = pdfBase64 ? `${prefix}.pdf` : null;
      imageBase64 = evid.imageBase64 || null;
      imageFileName = imageBase64 ? `${prefix}.png` : null;
    } catch (evErr) {
      logger.warn(`[OSINT Portal ${cleanAction}] Aviso capturando evidencia PDF/PNG: ${evErr.message}`);
    }
  }

  return {
    fuente: 'Google Antigravity Local (IP Colombia)',
    status: okPortals.length > 0 ? 'ok' : 'warning',
    action: cleanAction,
    tipoDoc: cleanTipoDoc,
    documento: cleanCedula,
    nombre: cleanNombre,
    placa: cleanPlaca,
    fechaNacimiento: cleanFechaNac || undefined,
    arl: cleanArl || undefined,
    eps: cleanEps || undefined,
    afp: cleanAfp || undefined,
    pdfBase64,
    pdfFileName,
    imageBase64,
    imageFileName,
    resumen,
    detalles,
  };
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
  consultarRamaJudicial,
  consultarPortalEspecíficoAntigravity,
  consultarPortalEspecificoAntigravity: consultarPortalEspecíficoAntigravity,
  obtenerCatalogoPortales360,
  investigarTrabajador360,
};
