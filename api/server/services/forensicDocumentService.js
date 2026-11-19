'use strict';

const crypto = require('crypto');
const zlib = require('zlib');
const mongoose = require('mongoose');

let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
} catch (_) {}

let logger = console;
try {
  const cfg = require('~/config');
  if (cfg?.logger) logger = cfg.logger;
} catch (_) {}

const RETHUS_PUBLIC_URL =
  'https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx';

const MINSALUD_REPS_SOCRATA_URL = 'https://www.datos.gov.co/resource/c36g-9fc2.json';

// Modelos vigentes permitidos en WAPPY (.env GOOGLE_MODELS / AGENTS.md §5)
const ALLOWED_FORENSIC_GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-4-hydrogen',
];

const DIAN_MOD11_PRIMES = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

const HIGH_RISK_EDIT_SOFTWARE_PATTERNS = [
  { label: 'Canva', re: /\bcanva\b/i },
  { label: 'iLovePDF', re: /\bilovepdf\b/i },
  { label: 'Sejda PDF', re: /\bsejda\b/i },
  { label: 'Smallpdf', re: /\bsmallpdf\b/i },
  { label: 'PDFescape', re: /\bpdfescape\b/i },
  { label: 'PDFgear', re: /\bpdfgear\b/i },
  { label: 'Soda PDF', re: /\bsoda\s*pdf\b/i },
  { label: 'Adobe Photoshop', re: /\bphotoshop\b/i },
  { label: 'Adobe Illustrator', re: /\billustrator\b/i },
  { label: 'CorelDRAW', re: /\bcorel\s*draw\b|\bcoreldraw\b/i },
  { label: 'GIMP', re: /\bgimp\b/i },
  { label: 'Paint / MSPaint', re: /\bmspaint\b|\bpaint\.net\b|\bmicrosoft\s+paint\b/i },
  { label: 'Foxit PhantomPDF / Editor', re: /\bfoxit\s*(?:phantompdf|pdf\s*editor)\b/i },
  { label: 'Nitro PDF', re: /\bnitro\s*(?:pro|pdf)\b/i },
  { label: 'WPS Office / PDF', re: /\bwps\s*(?:office|pdf|writer)?\b/i },
  { label: 'PicsArt', re: /\bpicsart\b/i },
  { label: 'Snapseed', re: /\bsnapseed\b/i },
  { label: 'Photopea', re: /\bphotopea\b/i },
  { label: 'InShot', re: /\binshot\b/i },
  { label: 'Master PDF Editor', re: /\bmaster\s*pdf\s*editor\b/i },
  { label: 'Wondershare PDFelement', re: /\bpdfelement\b|\bwondershare\b/i },
  { label: 'Figma', re: /\bfigma\b/i },
];

const MEDIUM_RISK_OFFICE_SOFTWARE_PATTERNS = [
  { label: 'LibreOffice', re: /\blibreoffice\b/i },
  { label: 'OpenOffice', re: /\bopenoffice\b/i },
  { label: 'Microsoft Word', re: /\bmicrosoft[®\s]*word\b|\bword\s+for\s+office\b/i },
  { label: 'Google Docs', re: /\bgoogle\s+docs\b/i },
  { label: 'Apple Pages', re: /\bapple\s+pages\b/i },
];

const CAPTURE_OR_MESSAGING_PATTERNS = [
  { label: 'WhatsApp (recompresión)', re: /\bwhatsapp\b/i },
  { label: 'Screenshot / Captura de pantalla', re: /\bscreenshot\b|\bscreencapture\b|\bsnipping\s*tool\b|\bcaptura\s+de\s+pantalla\b/i },
];

const SPANISH_MONTHS = {
  ene: 1, enero: 1,
  feb: 2, febrero: 2,
  mar: 3, marzo: 3,
  abr: 4, abril: 4,
  may: 5, mayo: 5,
  jun: 6, junio: 6,
  jul: 7, julio: 7,
  ago: 8, agosto: 8,
  sep: 9, sept: 9, septiembre: 9, setiembre: 9,
  oct: 10, octubre: 10,
  nov: 11, noviembre: 11,
  dic: 12, diciembre: 12,
};

function sanitizeForensicModelId(rawModelId = '') {
  const clean = String(rawModelId || '').replace(/^models\//i, '').trim();
  if (ALLOWED_FORENSIC_GEMINI_MODELS.includes(clean)) {
    return clean;
  }
  return 'gemini-3.5-flash-lite';
}

function normalizeMimeType(rawMime = '') {
  const clean = String(rawMime || '').split(';')[0].trim().toLowerCase();
  if (!clean) return '';
  if (clean === 'image/jpg' || clean === 'image/pjpeg') return 'image/jpeg';
  if (clean === 'application/x-pdf') return 'application/pdf';
  return clean;
}

function inferMimeFromExtension(fileName = '') {
  const extMatch = String(fileName || '').trim().toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  if (!extMatch) return '';
  const ext = extMatch[1];
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return '';
}

/**
 * Decodifica de forma segura el archivo adjunto desde attachedMedia (objeto o arreglo) o fileBuffer.
 */
function resolveBinaryInput(opts = {}) {
  const { attachedMedia, fileBuffer, fileName: optFileName, mimeType: optMimeType } = opts || {};

  let mediaCandidate = null;
  if (Array.isArray(attachedMedia)) {
    mediaCandidate =
      attachedMedia.find(
        (m) => m && typeof m === 'object' && (m.buffer || m.dataUrl || m.base64 || m.data),
      ) || attachedMedia[0] || null;
  } else if (attachedMedia && typeof attachedMedia === 'object') {
    if (Array.isArray(attachedMedia.files) && attachedMedia.files.length > 0) {
      mediaCandidate = attachedMedia.files[0];
    } else {
      mediaCandidate = attachedMedia;
    }
  }

  let resolvedName =
    String(
      optFileName ||
        mediaCandidate?.name ||
        mediaCandidate?.fileName ||
        mediaCandidate?.originalname ||
        '',
    ).trim() || 'incapacidad_adjunta';

  let declaredMime = normalizeMimeType(
    optMimeType || mediaCandidate?.mimeType || mediaCandidate?.mimetype || '',
  );

  let buf = null;

  if (Buffer.isBuffer(fileBuffer) && fileBuffer.length > 0) {
    buf = fileBuffer;
  } else if (fileBuffer instanceof Uint8Array && fileBuffer.byteLength > 0) {
    buf = Buffer.from(fileBuffer);
  } else if (
    fileBuffer &&
    typeof fileBuffer === 'object' &&
    fileBuffer.type === 'Buffer' &&
    Array.isArray(fileBuffer.data)
  ) {
    buf = Buffer.from(fileBuffer.data);
  } else if (Buffer.isBuffer(mediaCandidate?.buffer) && mediaCandidate.buffer.length > 0) {
    buf = mediaCandidate.buffer;
  } else if (typeof mediaCandidate?.dataUrl === 'string' && mediaCandidate.dataUrl.trim()) {
    const rawUrl = mediaCandidate.dataUrl.trim();
    const dataMatch = rawUrl.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,([\s\S]+)$/i);
    if (dataMatch) {
      if (!declaredMime && dataMatch[1]) {
        declaredMime = normalizeMimeType(dataMatch[1]);
      }
      const cleanB64 = dataMatch[2].replace(/\s+/g, '');
      buf = Buffer.from(cleanB64, 'base64');
    } else if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      buf = Buffer.from(rawUrl.replace(/^data:[^,]+,/, '').replace(/\s+/g, ''), 'base64');
    }
  } else if (typeof mediaCandidate?.base64 === 'string' && mediaCandidate.base64.trim()) {
    const rawB64 = mediaCandidate.base64.trim();
    const dm = rawB64.match(/^data:([^;,]+);base64,([\s\S]+)$/i);
    if (dm) {
      if (!declaredMime && dm[1]) declaredMime = normalizeMimeType(dm[1]);
      buf = Buffer.from(dm[2].replace(/\s+/g, ''), 'base64');
    } else {
      buf = Buffer.from(rawB64.replace(/\s+/g, ''), 'base64');
    }
  } else if (typeof attachedMedia === 'string' && attachedMedia.trim().length > 32) {
    const dm = attachedMedia.trim().match(/^data:([^;,]+);base64,([\s\S]+)$/i);
    if (dm) {
      if (!declaredMime && dm[1]) declaredMime = normalizeMimeType(dm[1]);
      buf = Buffer.from(dm[2].replace(/\s+/g, ''), 'base64');
    } else {
      buf = Buffer.from(attachedMedia.trim().replace(/\s+/g, ''), 'base64');
    }
  }

  if (!declaredMime) {
    declaredMime = inferMimeFromExtension(resolvedName);
  }

  // Guardia de memoria máxima (25 MB)
  if (buf && buf.length > 25 * 1024 * 1024) {
    throw new Error('El archivo adjunto excede el tamaño máximo permitido para auditoría forense (25 MB).');
  }

  return {
    buffer: buf && buf.length > 0 ? buf : null,
    fileName: resolvedName,
    declaredMime: declaredMime || null,
  };
}

/**
 * Detecta el formato binario real por Magic Bytes.
 */
function detectMagicBytes(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) {
    return { detectedMime: 'application/octet-stream', format: 'UNKNOWN', headerOffset: -1 };
  }

  // %PDF- (25 50 44 46 2D) — permitir hasta 16 bytes iniciales por si trae BOM
  const headWindow = buf.subarray(0, Math.min(20, buf.length)).toString('latin1');
  const pdfIdx = headWindow.indexOf('%PDF-');
  if (pdfIdx !== -1) {
    return {
      detectedMime: 'application/pdf',
      format: 'PDF',
      headerOffset: pdfIdx,
      pdfVersion: headWindow.slice(pdfIdx + 5, pdfIdx + 8).trim() || null,
    };
  }

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { detectedMime: 'image/jpeg', format: 'JPEG', headerOffset: 0 };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { detectedMime: 'image/png', format: 'PNG', headerOffset: 0 };
  }

  // WEBP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { detectedMime: 'image/webp', format: 'WEBP', headerOffset: 0 };
  }

  // GIF: GIF87a / GIF89a
  if (buf.length >= 6) {
    const gifSig = buf.subarray(0, 6).toString('ascii');
    if (gifSig === 'GIF87a' || gifSig === 'GIF89a') {
      return { detectedMime: 'image/gif', format: 'GIF', headerOffset: 0 };
    }
  }

  return { detectedMime: 'application/octet-stream', format: 'UNKNOWN', headerOffset: -1 };
}

function decodePdfInfoValue(rawVal = '') {
  const trimmed = String(rawVal || '').trim();
  if (!trimmed) return '';

  // Hex string <FEFF...> o <43616e7661>
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    const hex = trimmed.slice(1, -1).replace(/\s+/g, '');
    if (!hex || !/^[0-9a-fA-F]+$/.test(hex)) return '';
    const even = hex.length % 2 === 0 ? hex : `${hex}0`;
    const bytes = Buffer.from(even, 'hex');
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      let out = '';
      for (let i = 2; i + 1 < bytes.length; i += 2) {
        out += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
      }
      return out.replace(/\0/g, '').trim();
    }
    return bytes.toString('latin1').replace(/\0/g, '').trim();
  }

  // Literal string (...)
  let inner = trimmed;
  if (inner.startsWith('(') && inner.endsWith(')')) {
    inner = inner.slice(1, -1);
  }
  const bytes = [];
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch !== '\\') {
      bytes.push(inner.charCodeAt(i) & 0xff);
      continue;
    }
    i += 1;
    if (i >= inner.length) break;
    const esc = inner[i];
    if (esc === 'n') bytes.push(10);
    else if (esc === 'r') bytes.push(13);
    else if (esc === 't') bytes.push(9);
    else if (esc === 'b') bytes.push(8);
    else if (esc === 'f') bytes.push(12);
    else if (esc === '(' || esc === ')' || esc === '\\') bytes.push(esc.charCodeAt(0));
    else if (esc >= '0' && esc <= '7') {
      let oct = esc;
      if (inner[i + 1] >= '0' && inner[i + 1] <= '7') oct += inner[++i];
      if (inner[i + 1] >= '0' && inner[i + 1] <= '7') oct += inner[++i];
      bytes.push(parseInt(oct, 8) & 0xff);
    } else {
      bytes.push(esc.charCodeAt(0) & 0xff);
    }
  }
  const buf = Buffer.from(bytes);
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    let out = '';
    for (let i = 2; i + 1 < buf.length; i += 2) {
      out += String.fromCharCode((buf[i] << 8) | buf[i + 1]);
    }
    return out.replace(/\0/g, '').trim();
  }
  return buf.toString('utf8').includes('\uFFFD')
    ? buf.toString('latin1').replace(/\0/g, '').trim()
    : buf.toString('utf8').replace(/\0/g, '').trim();
}

function parsePdfDateToTimestamp(rawDate = '') {
  const s = String(rawDate || '').trim();
  if (!s) return null;

  // Formato PDF: D:YYYYMMDDHHmmSSOHH'mm'
  const pdfM = s.match(
    /^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:([Z+-])(\d{2})'?(\d{2})?'?)?/i,
  );
  if (pdfM) {
    const year = Number(pdfM[1]);
    const month = Number(pdfM[2] || '01') - 1;
    const day = Number(pdfM[3] || '01');
    const hour = Number(pdfM[4] || '00');
    const min = Number(pdfM[5] || '00');
    const sec = Number(pdfM[6] || '00');
    let utcMs = Date.UTC(year, month, day, hour, min, sec);
    const tzSign = pdfM[7];
    if (tzSign === '+' || tzSign === '-') {
      const tzH = Number(pdfM[8] || '0');
      const tzM = Number(pdfM[9] || '0');
      const offsetMs = (tzH * 60 + tzM) * 60 * 1000;
      utcMs += tzSign === '+' ? -offsetMs : offsetMs;
    }
    return Number.isNaN(utcMs) ? null : utcMs;
  }

  const isoParsed = Date.parse(s);
  return Number.isNaN(isoParsed) ? null : isoParsed;
}

function scanSoftwareSignatures(textCorpus = '') {
  const highRiskHits = [];
  const mediumRiskHits = [];
  const captureHits = [];

  if (!textCorpus) {
    return { highRiskHits, mediumRiskHits, captureHits };
  }

  for (const item of HIGH_RISK_EDIT_SOFTWARE_PATTERNS) {
    if (item.re.test(textCorpus) && !highRiskHits.includes(item.label)) {
      highRiskHits.push(item.label);
    }
  }
  for (const item of MEDIUM_RISK_OFFICE_SOFTWARE_PATTERNS) {
    if (item.re.test(textCorpus) && !mediumRiskHits.includes(item.label)) {
      mediumRiskHits.push(item.label);
    }
  }
  for (const item of CAPTURE_OR_MESSAGING_PATTERNS) {
    if (item.re.test(textCorpus) && !captureHits.includes(item.label)) {
      captureHits.push(item.label);
    }
  }

  return { highRiskHits, mediumRiskHits, captureHits };
}

/**
 * Capa 1A — Forense Binaria Determinista sobre PDF (100% Node.js nativo).
 */
async function inspectPdfBinaryForensics(pdfBuf) {
  const rawLatin1 = pdfBuf.toString('latin1');
  const inflatedMetadataChunks = [];

  // Inflar streams pequeños de objetos/metadatos (/ObjStm o XMP comprimido) para no perder /Info comprimido
  let idx = 0;
  let inspectedStreams = 0;
  while ((idx = pdfBuf.indexOf('stream', idx)) !== -1 && inspectedStreams < 60) {
    if (idx >= 3 && pdfBuf.subarray(idx - 3, idx).toString('ascii') === 'end') {
      idx += 6;
      continue;
    }
    const nextB = pdfBuf[idx + 6];
    if (nextB !== 10 && nextB !== 13 && nextB !== 32) {
      idx += 6;
      continue;
    }
    const dictWin = pdfBuf.subarray(Math.max(0, idx - 260), idx).toString('latin1');
    const end = pdfBuf.indexOf('endstream', idx + 6);
    if (end <= idx + 6) {
      idx += 6;
      continue;
    }
    if (!/\/Subtype\s*\/Image|\/DCTDecode|\/JPXDecode|\/FontFile\d*\b/i.test(dictWin)) {
      let start = idx + 6;
      while (start < end && pdfBuf[start] === 32) start += 1;
      if (pdfBuf[start] === 13 && pdfBuf[start + 1] === 10) start += 2;
      else if (pdfBuf[start] === 10 || pdfBuf[start] === 13) start += 1;
      let sub = pdfBuf.subarray(start, end);
      while (sub.length > 0 && (sub[sub.length - 1] === 10 || sub[sub.length - 1] === 13)) {
        sub = sub.subarray(0, sub.length - 1);
      }
      if (sub.length > 0 && sub.length <= 512 * 1024) {
        inspectedStreams += 1;
        try {
          const inf = zlib.inflateSync(sub).toString('latin1');
          if (/\/(?:Creator|Producer|CreationDate|ModDate)|xmp:|pdf:Producer/i.test(inf)) {
            inflatedMetadataChunks.push(inf);
          }
        } catch (_) {
          try {
            const infRaw = zlib.inflateRawSync(sub).toString('latin1');
            if (/\/(?:Creator|Producer|CreationDate|ModDate)|xmp:|pdf:Producer/i.test(infRaw)) {
              inflatedMetadataChunks.push(infRaw);
            }
          } catch (__) {}
        }
      }
    }
    idx = end + 9;
  }

  const combinedMetaSource = [rawLatin1, ...inflatedMetadataChunks].join('\n');

  const extractInfoKey = (keyName) => {
    const re = new RegExp(`/${keyName}\\s*(\\((?:[^()\\\\]|\\\\.)*\\)|<[0-9a-fA-F\\s]+>)`, 'i');
    const m = combinedMetaSource.match(re);
    return m && m[1] ? decodePdfInfoValue(m[1]) : null;
  };

  const infoDict = {
    Creator: extractInfoKey('Creator'),
    Producer: extractInfoKey('Producer'),
    Author: extractInfoKey('Author'),
    Title: extractInfoKey('Title'),
    CreationDate: extractInfoKey('CreationDate'),
    ModDate: extractInfoKey('ModDate'),
  };

  const extractXmpTag = (tagPattern) => {
    const re = new RegExp(`<${tagPattern}[^>]*>([\\s\\S]*?)<\\/${tagPattern}>`, 'i');
    const m = combinedMetaSource.match(re);
    if (m && m[1]) {
      return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || null;
    }
    const attrRe = new RegExp(`${tagPattern}\\s*=\\s*["']([^"']+)["']`, 'i');
    const am = combinedMetaSource.match(attrRe);
    return am && am[1] ? am[1].trim() : null;
  };

  const xmp = {
    CreatorTool: extractXmpTag('xmp:CreatorTool'),
    Producer: extractXmpTag('pdf:Producer'),
    CreateDate: extractXmpTag('xmp:CreateDate'),
    ModifyDate: extractXmpTag('xmp:ModifyDate'),
    HistorySoftwareAgents: Array.from(
      combinedMetaSource.matchAll(/stEvt:softwareAgent(?:=["']([^"']+)["']|>([^<]+)<)/gi),
    )
      .map((m) => (m[1] || m[2] || '').trim())
      .filter(Boolean),
  };

  const eofMatches = rawLatin1.match(/%%EOF/g);
  const eofCount = eofMatches ? eofMatches.length : 0;
  const xrefCount = (rawLatin1.match(/\bxref\b/g) || []).length;
  const prevXrefCount = (rawLatin1.match(/\/Prev\s+\d+/g) || []).length;
  const isLinearized = /\/Linearized\b/.test(rawLatin1.slice(0, 2048));
  const hasEditableAnnotations = /\/Subtype\s*\/(?:FreeText|Redact|Stamp)\b/i.test(combinedMetaSource);
  const hasAcroForm = /\/AcroForm\b/.test(combinedMetaSource);

  const createTs = parsePdfDateToTimestamp(infoDict.CreationDate || xmp.CreateDate || '');
  const modTs = parsePdfDateToTimestamp(infoDict.ModDate || xmp.ModifyDate || '');
  const modDiffSeconds =
    createTs !== null && modTs !== null ? Math.round((modTs - createTs) / 1000) : null;

  const softwareCorpus = [
    infoDict.Creator,
    infoDict.Producer,
    infoDict.Author,
    infoDict.Title,
    xmp.CreatorTool,
    xmp.Producer,
    ...(xmp.HistorySoftwareAgents || []),
  ]
    .filter(Boolean)
    .join(' | ');

  const { highRiskHits, mediumRiskHits, captureHits } = scanSoftwareSignatures(softwareCorpus);

  const binaryFlags = [];
  let binaryRiskPoints = 0;

  if (highRiskHits.length > 0) {
    binaryRiskPoints += 45;
    binaryFlags.push({
      code: 'PDF_SUSPICIOUS_EDITOR',
      severity: 'critical',
      detail: `Metadatos internos del PDF revelan software de edición/diseño ajeno a sistemas clínicos HIS/EPS: ${highRiskHits.join(', ')}.`,
    });
  } else if (mediumRiskHits.length > 0) {
    binaryRiskPoints += 20;
    binaryFlags.push({
      code: 'PDF_MANUAL_OFFICE_TOOL',
      severity: 'warning',
      detail: `El PDF fue generado o re-exportado desde un procesador ofimático manual (${mediumRiskHits.join(', ')}), inusual en plataformas transaccionales de EPS.`,
    });
  }

  if (eofCount > 2 || (eofCount === 2 && !isLinearized && prevXrefCount >= 1)) {
    binaryRiskPoints += 25;
    binaryFlags.push({
      code: 'PDF_INCREMENTAL_UPDATES',
      severity: 'warning',
      detail: `Se detectaron ${eofCount} marcadores %%EOF (${xrefCount} tabla(s) xref, ${prevXrefCount} puntero(s) /Prev), señal técnica de guardado o modificación incremental posterior a la emisión original.`,
    });
  }

  if (modDiffSeconds !== null && Math.abs(modDiffSeconds) > 120) {
    const mins = Math.round(Math.abs(modDiffSeconds) / 60);
    binaryRiskPoints += 15;
    binaryFlags.push({
      code: 'PDF_MODDATE_DIFF',
      severity: 'warning',
      detail: `La fecha interna de modificación (ModDate: ${infoDict.ModDate || xmp.ModifyDate}) difiere de la fecha de creación (CreationDate: ${infoDict.CreationDate || xmp.CreateDate}) por ~${mins} minuto(s).`,
    });
  }

  if (hasEditableAnnotations) {
    binaryRiskPoints += 20;
    binaryFlags.push({
      code: 'PDF_OVERLAY_ANNOTATIONS',
      severity: 'warning',
      detail: 'El PDF contiene capas de anotación superpuestas (/FreeText, /Stamp o /Redact) susceptibles de ocultar texto original.',
    });
  }

  // Extraer texto nativo del PDF (pdf-parse + osintWorkerService.extractPdfTextPureNode)
  let nativeText = '';
  if (typeof pdfParse === 'function') {
    let timer = null;
    try {
      const parsePromise = Promise.resolve(pdfParse(pdfBuf, { max: 5 })).catch(() => null);
      const timeoutPromise = new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), 3500);
        if (typeof timer.unref === 'function') timer.unref();
      });
      const parsed = await Promise.race([parsePromise, timeoutPromise]);
      if (parsed?.text && parsed.text.trim()) {
        nativeText = parsed.text.trim();
      }
    } catch (_) {
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  if (!nativeText) {
    try {
      const { extractPdfTextPureNode } = require('./osintWorkerService');
      if (typeof extractPdfTextPureNode === 'function') {
        nativeText = extractPdfTextPureNode(pdfBuf) || '';
      }
    } catch (_) {}
  }

  return {
    format: 'PDF',
    infoDict,
    xmp,
    eofCount,
    xrefCount,
    prevXrefCount,
    isLinearized,
    hasEditableAnnotations,
    hasAcroForm,
    modDiffSeconds,
    highRiskSoftware: highRiskHits,
    mediumRiskSoftware: mediumRiskHits,
    captureSoftware: captureHits,
    nativeText,
    binaryFlags,
    binaryRiskPoints,
    metadataSummary: [
      infoDict.Creator ? `Creator: ${infoDict.Creator}` : null,
      infoDict.Producer ? `Producer: ${infoDict.Producer}` : null,
      xmp.CreatorTool ? `XMP CreatorTool: ${xmp.CreatorTool}` : null,
      infoDict.CreationDate ? `CreationDate: ${infoDict.CreationDate}` : null,
      infoDict.ModDate ? `ModDate: ${infoDict.ModDate}` : null,
      `%%EOF: ${eofCount}`,
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

function parseExifTiffSegment(exifBuf) {
  const out = {};
  if (!Buffer.isBuffer(exifBuf) || exifBuf.length < 14) return out;
  const endian = exifBuf.subarray(0, 2).toString('ascii');
  if (endian !== 'II' && endian !== 'MM') return out;
  const le = endian === 'II';
  const readU16 = (off) => (le ? exifBuf.readUInt16LE(off) : exifBuf.readUInt16BE(off));
  const readU32 = (off) => (le ? exifBuf.readUInt32LE(off) : exifBuf.readUInt32BE(off));

  if (readU16(2) !== 42) return out;
  const ifdOffset = readU32(4);
  if (ifdOffset + 2 > exifBuf.length) return out;

  const numEntries = readU16(ifdOffset);
  const tagNames = {
    0x010e: 'ImageDescription',
    0x010f: 'Make',
    0x0110: 'Model',
    0x0131: 'Software',
    0x0132: 'DateTime',
    0x013b: 'Artist',
  };

  for (let i = 0; i < Math.min(numEntries, 64); i++) {
    const entryOff = ifdOffset + 2 + i * 12;
    if (entryOff + 12 > exifBuf.length) break;
    const tag = readU16(entryOff);
    const type = readU16(entryOff + 2);
    const count = readU32(entryOff + 4);
    if (tagNames[tag] && type === 2 && count > 0 && count < 512) {
      const valOff = count <= 4 ? entryOff + 8 : readU32(entryOff + 8);
      if (valOff + count <= exifBuf.length) {
        const str = exifBuf
          .subarray(valOff, valOff + count)
          .toString('utf8')
          .replace(/\0/g, '')
          .trim();
        if (str) out[tagNames[tag]] = str;
      }
    }
  }
  return out;
}

/**
 * Capa 1B — Forense Binaria Determinista sobre Imágenes (JPEG / PNG / WEBP).
 */
function inspectImageBinaryForensics(imgBuf, format = 'JPEG') {
  let width = 0;
  let height = 0;
  const exif = {};
  const textChunks = [];
  let xmpRaw = '';

  if (format === 'JPEG') {
    let pos = 2;
    while (pos + 4 <= imgBuf.length) {
      if (imgBuf[pos] !== 0xff) {
        pos += 1;
        continue;
      }
      let marker = imgBuf[pos + 1];
      while (marker === 0xff && pos + 2 < imgBuf.length) {
        pos += 1;
        marker = imgBuf[pos + 1];
      }
      if (marker === 0xd9 || marker === 0xda) break; // EOI / SOS
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        pos += 2;
        continue;
      }
      if (pos + 4 > imgBuf.length) break;
      const segLen = imgBuf.readUInt16BE(pos + 2);
      if (segLen < 2 || pos + 2 + segLen > imgBuf.length) break;
      const segData = imgBuf.subarray(pos + 4, pos + 2 + segLen);

      // SOF0 / SOF1 / SOF2 (dimensiones reales)
      if ((marker === 0xc0 || marker === 0xc1 || marker === 0xc2) && segData.length >= 5) {
        height = segData.readUInt16BE(1);
        width = segData.readUInt16BE(3);
      } else if (marker === 0xe1) {
        // APP1: EXIF o XMP
        if (segData.length >= 6 && segData.subarray(0, 6).toString('ascii') === 'Exif\0\0') {
          Object.assign(exif, parseExifTiffSegment(segData.subarray(6)));
        } else if (segData.toString('latin1', 0, Math.min(40, segData.length)).includes('http://ns.adobe.com/xap')) {
          xmpRaw += segData.toString('utf8');
        } else {
          textChunks.push(segData.toString('latin1'));
        }
      } else if (marker === 0xfe) {
        // COM comment
        textChunks.push(segData.toString('utf8').replace(/\0/g, '').trim());
      }

      pos += 2 + segLen;
    }

    // Escanear primeros 16KB por cadenas ASCII de editores embebidos (ej. Photoshop IRB APP13)
    textChunks.push(imgBuf.subarray(0, Math.min(16384, imgBuf.length)).toString('latin1'));
  } else if (format === 'PNG') {
    if (imgBuf.length >= 24 && imgBuf.subarray(12, 16).toString('ascii') === 'IHDR') {
      width = imgBuf.readUInt32BE(16);
      height = imgBuf.readUInt32BE(20);
    }
    let pos = 8;
    while (pos + 12 <= imgBuf.length) {
      const chunkLen = imgBuf.readUInt32BE(pos);
      const chunkType = imgBuf.subarray(pos + 4, pos + 8).toString('ascii');
      if (pos + 12 + chunkLen > imgBuf.length) break;
      const chunkData = imgBuf.subarray(pos + 8, pos + 8 + chunkLen);

      if (chunkType === 'tEXt' || chunkType === 'iTXt') {
        const txt = chunkData.toString('utf8').replace(/\0+/g, ': ').trim();
        if (txt) textChunks.push(txt);
      } else if (chunkType === 'zTXt') {
        const nulIdx = chunkData.indexOf(0);
        if (nulIdx > 0 && nulIdx + 2 < chunkData.length) {
          const key = chunkData.subarray(0, nulIdx).toString('latin1');
          try {
            const val = zlib.inflateSync(chunkData.subarray(nulIdx + 2)).toString('utf8');
            textChunks.push(`${key}: ${val}`);
          } catch (_) {}
        }
      } else if (chunkType === 'tIME' && chunkData.length >= 7) {
        const y = chunkData.readUInt16BE(0);
        const mo = String(chunkData[2]).padStart(2, '0');
        const d = String(chunkData[3]).padStart(2, '0');
        const h = String(chunkData[4]).padStart(2, '0');
        const mi = String(chunkData[5]).padStart(2, '0');
        const s = String(chunkData[6]).padStart(2, '0');
        exif.ModifyTime = `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
      } else if (chunkType === 'eXIf') {
        Object.assign(exif, parseExifTiffSegment(chunkData));
      } else if (chunkType === 'IEND') {
        break;
      }
      pos += 12 + chunkLen;
    }
  } else if (format === 'WEBP') {
    let pos = 12;
    while (pos + 8 <= imgBuf.length) {
      const fourCC = imgBuf.subarray(pos, pos + 4).toString('ascii');
      const chunkSize = imgBuf.readUInt32LE(pos + 4);
      if (pos + 8 + chunkSize > imgBuf.length) break;
      const chunkData = imgBuf.subarray(pos + 8, pos + 8 + chunkSize);

      if (fourCC === 'VP8X' && chunkData.length >= 10) {
        width = 1 + chunkData.readUIntLE(4, 3);
        height = 1 + chunkData.readUIntLE(7, 3);
      } else if (fourCC === 'VP8 ' && chunkData.length >= 10) {
        width = chunkData.readUInt16LE(6) & 0x3fff;
        height = chunkData.readUInt16LE(8) & 0x3fff;
      } else if (fourCC === 'VP8L' && chunkData.length >= 5) {
        const b1 = chunkData[1];
        const b2 = chunkData[2];
        const b3 = chunkData[3];
        const b4 = chunkData[4];
        width = 1 + (((b2 & 0x3f) << 8) | b1);
        height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
      } else if (fourCC === 'EXIF') {
        const sub =
          chunkData.length >= 6 && chunkData.subarray(0, 6).toString('ascii') === 'Exif\0\0'
            ? chunkData.subarray(6)
            : chunkData;
        Object.assign(exif, parseExifTiffSegment(sub));
      } else if (fourCC === 'XMP ') {
        xmpRaw += chunkData.toString('utf8');
      }

      pos += 8 + chunkSize + (chunkSize % 2);
    }
  }

  const softwareCorpus = [
    ...Object.values(exif),
    xmpRaw,
    ...textChunks.map((c) => c.slice(0, 4000)),
  ]
    .filter(Boolean)
    .join(' | ');

  const { highRiskHits, mediumRiskHits, captureHits } = scanSoftwareSignatures(softwareCorpus);
  const binaryFlags = [];
  let binaryRiskPoints = 0;

  if (highRiskHits.length > 0) {
    binaryRiskPoints += 45;
    binaryFlags.push({
      code: 'IMG_SUSPICIOUS_EDITOR',
      severity: 'critical',
      detail: `Cabeceras binarias de la imagen contienen rastro de software de edición gráfica: ${highRiskHits.join(', ')}.`,
    });
  } else if (mediumRiskHits.length > 0) {
    binaryRiskPoints += 20;
    binaryFlags.push({
      code: 'IMG_OFFICE_EXPORT',
      severity: 'warning',
      detail: `La imagen registra exportación desde herramienta ofimática (${mediumRiskHits.join(', ')}).`,
    });
  }

  if (captureHits.length > 0) {
    binaryRiskPoints += 10;
    binaryFlags.push({
      code: 'IMG_RECOMPRESSED_OR_SCREENSHOT',
      severity: 'info',
      detail: `Imagen proveniente de captura o mensajería (${captureHits.join(', ')}); verifique el PDF electrónico original de la EPS.`,
    });
  }

  if (width > 0 && height > 0 && (Math.max(width, height) < 750 || width * height < 350000)) {
    binaryRiskPoints += 12;
    binaryFlags.push({
      code: 'IMG_LOW_RESOLUTION',
      severity: 'warning',
      detail: `Resolución baja (${width}x${height} px), frecuente en recortes o re-escalados que degradan sellos y bordes tipográficos.`,
    });
  }

  return {
    format,
    dimensions: width > 0 && height > 0 ? { width, height } : null,
    exif,
    highRiskSoftware: highRiskHits,
    mediumRiskSoftware: mediumRiskHits,
    captureSoftware: captureHits,
    nativeText: '',
    binaryFlags,
    binaryRiskPoints,
    metadataSummary: [
      width > 0 && height > 0 ? `Resolución: ${width}x${height}px` : null,
      exif.Software ? `Software: ${exif.Software}` : null,
      exif.Make || exif.Model ? `Dispositivo: ${[exif.Make, exif.Model].filter(Boolean).join(' ')}` : null,
      exif.DateTime || exif.ModifyTime ? `Fecha EXIF/PNG: ${exif.DateTime || exif.ModifyTime}` : null,
    ]
      .filter(Boolean)
      .join(' · ') || `Imagen ${format} sin metadatos EXIF explícitos`,
  };
}

/**
 * Normaliza fechas variadas (ISO, DD/MM/YYYY, DD-MM-YYYY, español) a { iso: 'YYYY-MM-DD', utcNoonMs }.
 */
function parseFlexibleDate(raw = '') {
  const s = String(raw || '').trim();
  if (!s) return null;

  // YYYY-MM-DD o YYYY/MM/DD
  const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[T\s].*)?$/);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]);
    const d = Number(ymd[3]);
    if (y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const utcNoonMs = Date.UTC(y, m - 1, d, 12, 0, 0);
      return {
        iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        utcNoonMs,
      };
    }
  }

  // DD/MM/YYYY o DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[T\s].*)?$/);
  if (dmy) {
    const d = Number(dmy[1]);
    const m = Number(dmy[2]);
    const y = Number(dmy[3]);
    if (y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const utcNoonMs = Date.UTC(y, m - 1, d, 12, 0, 0);
      return {
        iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        utcNoonMs,
      };
    }
  }

  // Español: "10 de noviembre de 2026" o "10-NOV-2026"
  const norm = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const esp = norm.match(/(\d{1,2})[\s/-]*(?:de\s+)?([a-z]{3,10})[\s/-]*(?:de\s+|del\s+)?(\d{4})/);
  if (esp) {
    const d = Number(esp[1]);
    const m = SPANISH_MONTHS[esp[2]];
    const y = Number(esp[3]);
    if (m && y >= 1990 && y <= 2100 && d >= 1 && d <= 31) {
      const utcNoonMs = Date.UTC(y, m - 1, d, 12, 0, 0);
      return {
        iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        utcNoonMs,
      };
    }
  }

  return null;
}

/**
 * Convierte expresión en letras en español (ej. "TRES", "QUINCE", "VEINTIUNO", "TREINTA Y CINCO") a entero.
 */
function parseSpanishDaysWords(rawWords = '') {
  if (rawWords === null || rawWords === undefined) return null;
  const norm = String(rawWords)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\b(?:dias?|de|incapacidad|calendario|habiles|total|en|letras)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!norm) return null;

  const exactMap = {
    cero: 0,
    un: 1,
    uno: 1,
    una: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
    once: 11,
    doce: 12,
    trece: 13,
    catorce: 14,
    quince: 15,
    dieciseis: 16,
    diecisiete: 17,
    dieciocho: 18,
    diecinueve: 19,
    veinte: 20,
    veintiun: 21,
    veintiuno: 21,
    veintiuna: 21,
    veintidos: 22,
    veintitres: 23,
    veinticuatro: 24,
    veinticinco: 25,
    veintiseis: 26,
    veintisiete: 27,
    veintiocho: 28,
    veintinueve: 29,
    treinta: 30,
    cuarenta: 40,
    cincuenta: 50,
    sesenta: 60,
    setenta: 70,
    ochenta: 80,
    noventa: 90,
    cien: 100,
    ciento: 100,
    doscientos: 200,
    trescientos: 300,
    cuatrocientos: 400,
    quinientos: 500,
  };

  if (Object.prototype.hasOwnProperty.call(exactMap, norm)) {
    return exactMap[norm];
  }

  const tokens = norm.split(' ').filter((t) => t && t !== 'y');
  let total = 0;
  let matchedAny = false;
  for (const tk of tokens) {
    if (Object.prototype.hasOwnProperty.call(exactMap, tk)) {
      total += exactMap[tk];
      matchedAny = true;
    }
  }
  return matchedAny ? total : null;
}

/**
 * Calcula y verifica el Dígito de Verificación DIAN (Módulo 11 oficial de Colombia).
 */
function verifyColombianNitCheckDigit(nitRaw = '') {
  const clean = String(nitRaw || '')
    .replace(/^(?:nit|n\.i\.t\.?)[\s:.-]*/i, '')
    .trim();
  if (!clean) {
    return { present: false, hasCheckDigit: false, valid: null, nitBase: null, printedDv: null, expectedDv: null };
  }

  // Soportar formatos como 800.088.702-2 o 900156264 - 2
  const hyphenMatch = clean.match(/^([\d.\s]{5,20})\s*[-–]\s*(\d)$/);
  if (!hyphenMatch) {
    const digitsOnly = clean.replace(/\D/g, '');
    return {
      present: Boolean(digitsOnly),
      hasCheckDigit: false,
      valid: null,
      nitBase: digitsOnly || null,
      printedDv: null,
      expectedDv: null,
      detail: digitsOnly
        ? `NIT ${digitsOnly} impreso sin dígito de verificación separado por guion.`
        : 'Sin NIT legible.',
    };
  }

  const nitBase = hyphenMatch[1].replace(/\D/g, '');
  const printedDv = Number(hyphenMatch[2]);

  if (nitBase.length < 5 || nitBase.length > DIAN_MOD11_PRIMES.length) {
    return {
      present: true,
      hasCheckDigit: true,
      valid: false,
      nitBase,
      printedDv,
      expectedDv: null,
      detail: `Longitud de NIT fuera de rango DIAN (${nitBase.length} dígitos).`,
    };
  }

  let sum = 0;
  for (let i = 0; i < nitBase.length; i++) {
    const digit = Number(nitBase[nitBase.length - 1 - i]);
    sum += digit * DIAN_MOD11_PRIMES[i];
  }
  const rem = sum % 11;
  const expectedDv = rem > 1 ? 11 - rem : rem;
  const valid = printedDv === expectedDv;

  return {
    present: true,
    hasCheckDigit: true,
    valid,
    nitBase,
    printedDv,
    expectedDv,
    detail: valid
      ? `NIT ${nitBase}-${printedDv} válido según Módulo 11 DIAN.`
      : `NIT inválido según Módulo 11 DIAN: para ${nitBase} el dígito verificador real es ${expectedDv}, pero figura impreso ${printedDv}.`,
  };
}

/**
 * Extracción determinista de respaldo sobre texto nativo PDF cuando no hay llamada multimodal disponible
 * o para complementar campos exactos.
 */
function extractFieldsFromTextDeterministic(rawText = '') {
  const text = String(rawText || '');
  if (!text.trim()) return {};

  const pick = (re, group = 1) => {
    const m = text.match(re);
    return m && m[group] ? String(m[group]).trim() : null;
  };

  const nitEmisor = pick(/\bNIT\s*[:.#-]?\s*(\d[\d.]{5,14}\s*-\s*\d|\d[\d.]{6,14})/i);
  const codigoReps = pick(/(?:c[oó]digo\s+(?:de\s+)?habilitaci[oó]n|c[oó]digo\s+reps|habilitaci[oó]n\s+prestador)\s*[:.#-]?\s*(\d{8,14})/i);
  const cieMatch = text.match(/\b([A-TV-Z]\d{2}(?:\.\d{1,2}|[0-9X])?)\b(?:\s*[-–:]\s*([^\r\n]{4,90}))?/);
  const fechaInicio = pick(/fecha\s+(?:de\s+)?inicio(?:\s+de\s+incapacidad)?\s*[:.-]?\s*([0-9]{4}[/-][0-9]{1,2}[/-][0-9]{1,2}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})/i);
  const fechaFin = pick(/fecha\s+(?:de\s+)?(?:fin|finalizaci[oó]n|terminaci[oó]n|vencimiento)\s*[:.-]?\s*([0-9]{4}[/-][0-9]{1,2}[/-][0-9]{1,2}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})/i);
  const fechaExpedicion = pick(/fecha\s+(?:de\s+)?(?:expedici[oó]n|emisi[oó]n|atenci[oó]n)\s*[:.-]?\s*([0-9]{4}[/-][0-9]{1,2}[/-][0-9]{1,2}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})/i);

  let diasNumero = null;
  const diasNumStr = pick(/(?:d[ií]as\s+(?:de\s+)?(?:incapacidad|otorgados)|total\s+d[ií]as|n[uú]mero\s+de\s+d[ií]as)\s*[:.-]?\s*(\d{1,3})\b/i);
  if (diasNumStr !== null) diasNumero = Number(diasNumStr);

  let diasLetras = pick(/(?:d[ií]as\s+en\s+letras|en\s+letras)\s*[:.-]?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{2,40}?)(?=\r|\n|\s{2,}|$|[,.;])/i);
  if (!diasLetras && diasNumStr !== null) {
    const inlineWords = text.match(new RegExp(`\\b${diasNumStr}\\s*\\(([A-ZÁÉÍÓÚÑa-záéíóúñ\\s]{2,35})\\)`, 'i'));
    if (inlineWords && inlineWords[1]) diasLetras = inlineWords[1].trim();
  }

  const pacienteNombre = pick(/(?:nombre\s+(?:del\s+)?(?:paciente|afiliado|cotizante|usuario)|paciente|afiliado)\s*[:.-]\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s.'-]{5,85}?)(?=\r|\n|\s+(?:tipo|documento|identificaci[oó]n|cc\b|edad\b)|$)/i);
  const pacienteTipoDoc = pick(/(?:paciente|afiliado)[\s\S]{0,120}?\b(CC|CE|TI|PA|PPT|PEP|RC)\b/i) || 'CC';
  const pacienteDocumento = pick(
    /(?:(?:n[uú]mero\s+de\s+)?(?:documento|identificaci[oó]n|c[eé]dula)(?:\s+del\s+(?:paciente|afiliado|cotizante|trabajador|usuario))?|\b(?:CC|C\.C\.|CE|TI|PPT|PEP)\s*(?:No\.?|N[°º])?)\s*[:.#-]?\s*(\d{5,15})\b/i,
  );

  const medicoNombre = pick(/(?:m[eé]dico(?:\s+tratante)?|profesional(?:\s+tratante|\s+de\s+la\s+salud)?|atendido\s+por|expedido\s+por)\s*[:.-]\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s.'-]{5,85}?)(?=\r|\n|\s+(?:registro|rm\b|t\.?p\.?|especialidad|cc\b|c\.c\.|documento)|$)/i);
  const registroMedico = pick(/(?:registro\s+m[eé]dico|r\.?\s*m\.?|tarjeta\s+profesional)\s*(?:No\.?|N[°º])?\s*[:.-]?\s*([A-Za-z0-9-]{3,25})/i);
  const medicoDocumento =
    pick(/(?:(?:documento|identificaci[oó]n|c[eé]dula|c\.?c\.?)\s+(?:del\s+)?(?:m[eé]dico|profesional))\s*[:.#-]?\s*([\d.]{5,16})/i) ||
    pick(/(?:m[eé]dico(?:\s+tratante)?|profesional(?:\s+tratante|\s+de\s+la\s+salud)?|atendido\s+por)[^\r\n]{3,90}?\b(?:CC|C\.C\.|CE)\s*(?:No\.?|N[°º])?\s*[:.#-]?\s*([\d.]{6,15})/i);
  const cleanMedicoDocumento = medicoDocumento ? medicoDocumento.replace(/\D/g, '') : null;
  const medicoEspecialidad = pick(/(?:especialidad)\s*[:.-]\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{4,60}?)(?=\r|\n|$)/i);

  const entidadEmisora = pick(/\b((?:EPS|IPS|CLINICA|CLÍNICA|HOSPITAL|NUEVA\s+EPS|SANITAS|SALUD\s+TOTAL|COMPENSAR|FAMISANAR|COOSALUD|MUTUAL\s+SER|SURA|SURAMERICANA)[A-ZÁÉÍÓÚÑa-záéíóúñ0-9\s.&-]{0,65}?)(?=\r|\n|\s+NIT\b|$)/i);
  const origenRaw = pick(/\borigen(?:\s+de\s+la\s+incapacidad)?\s*[:.-]?\s*(com[uú]n|enfermedad\s+general|laboral|accidente\s+de\s+trabajo|enfermedad\s+laboral)/i);
  const origen = origenRaw
    ? /laboral|trabajo/i.test(origenRaw)
      ? 'laboral'
      : 'comun'
    : null;
  const prorroga = pick(/\bpr[oó]rroga\s*[:.-]?\s*(s[ií]|no)\b/i);
  const modalidadPrestacion = pick(/\bmodalidad(?:\s+de\s+la\s+prestaci[oó]n)?\s*[:.-]?\s*(intramural|extramural|telemedicina|ambulatoria|urgencias|hospitalaria)/i);

  return {
    entidadEmisora,
    nitEmisor,
    codigoReps,
    pacienteNombre,
    pacienteTipoDoc,
    pacienteDocumento,
    cie10Codigo: cieMatch ? cieMatch[1] : null,
    cie10Descripcion: cieMatch && cieMatch[2] ? cieMatch[2].trim() : null,
    origen,
    prorroga,
    fechaExpedicion,
    fechaInicio,
    fechaFin,
    diasNumero,
    diasLetras,
    modalidadPrestacion,
    medicoNombre,
    medicoTipoDoc: cleanMedicoDocumento ? 'CC' : null,
    medicoDocumento: cleanMedicoDocumento || registroMedico || null,
    registroMedico,
    medicoEspecialidad,
  };
}

function safeParseJsonBlock(rawStr = '') {
  if (!rawStr) return null;
  if (typeof rawStr === 'object') return rawStr;
  const clean = String(rawStr)
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(clean);
  } catch (_) {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(clean.slice(firstBrace, lastBrace + 1));
      } catch (__) {}
    }
  }
  return null;
}

/**
 * Capa 2 — Inspección Visual Multimodal con Gemini + Extracción Decreto 1427 de 2022.
 */
async function runGeminiMultimodalForensics({
  buf,
  detectedMime,
  nativeText = '',
  userInstruction = '',
  userId = '',
  modelId = 'gemini-3.5-flash-lite',
}) {
  const deterministicFields = extractFieldsFromTextDeterministic(nativeText);
  const supportedInlineMime = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(
    detectedMime,
  )
    ? detectedMime
    : null;

  if (!supportedInlineMime) {
    return {
      aiStatus: 'unsupported_mime_fallback',
      visualAnomalies: [],
      extractedFields: deterministicFields,
      clinicalPlausibility: {
        coherent: true,
        severity: 'ok',
        observations: 'Formato binario no compatible con visión directa; se aplicó análisis determinista.',
      },
    };
  }

  let generateWithKeyRotation = null;
  try {
    ({ generateWithKeyRotation } = require('../routes/sgsst/sgsstGemini'));
  } catch (_) {}

  if (typeof generateWithKeyRotation !== 'function') {
    return {
      aiStatus: 'service_unavailable_fallback',
      visualAnomalies: [],
      extractedFields: deterministicFields,
      clinicalPlausibility: {
        coherent: true,
        severity: 'ok',
        observations: 'Servicio multimodal no disponible en entorno local; se ejecutó extracción determinista.',
      },
    };
  }

  const preferredModel = sanitizeForensicModelId(modelId);
  const prompt = `Actúa como Auditor Médico-Forense experto en Seguridad y Salud en el Trabajo (SG-SST Colombia) y en el Decreto 1427 de 2022 (Art. 2.2.3.3.1 — requisitos mínimos del certificado de incapacidad).

Analiza visual y estructuralmente el documento adjunto${userInstruction ? ` (Contexto del usuario: "${userInstruction.slice(0, 300)}")` : ''} y responde EXCLUSIVAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "isDisabilityCertificate": true,
  "visualAnomalies": [
    {
      "severity": "critical" | "warning",
      "category": "tipografia" | "alineacion" | "parche_digital" | "sello_firma" | "formato_institucional",
      "description": "Descripción precisa del hallazgo visual (ej. fuente tipográfica distinta en número de días o fechas, recuadro blanco superpuesto, desalineación de renglón, bordes pixelados en firma/sello, tachón digital)"
    }
  ],
  "extractedFields": {
    "entidadEmisora": "Nombre de la EPS o IPS emisora o null",
    "nitEmisor": "NIT tal como aparece impreso incluyendo guion y dígito de verificación si existe (ej. 800088702-2) o null",
    "codigoReps": "Código de habilitación REPS del prestador si aparece o null",
    "pacienteNombre": "Nombre completo del trabajador/afiliado o null",
    "pacienteTipoDoc": "CC | CE | TI | PA | PPT | PEP o null",
    "pacienteDocumento": "Solo dígitos/caracteres del documento del paciente o null",
    "cie10Codigo": "Código CIE-10 impreso (ej. M545, J00, S835) o null",
    "cie10Descripcion": "Descripción diagnóstica si aparece o null",
    "origen": "comun" | "laboral" | null,
    "prorroga": "Si" | "No" | null,
    "fechaExpedicion": "YYYY-MM-DD (convierte a ISO si es legible) o null",
    "fechaInicio": "YYYY-MM-DD (convierte a ISO si es legible) o null",
    "fechaFin": "YYYY-MM-DD (convierte a ISO si es legible) o null",
    "diasNumero": número entero de días impreso en cifras o null,
    "diasLetras": "Texto literal exacto impreso para los días en letras (ej. TRES, CINCO) o null",
    "modalidadPrestacion": "intramural | extramural | telemedicina | urgencias | ambulatoria o null",
    "medicoNombre": "Nombre completo del médico u odontólogo tratante o null",
    "medicoTipoDoc": "CC | CE o null",
    "medicoDocumento": "Número de cédula/documento del médico si aparece o null",
    "registroMedico": "Registro médico / Tarjeta profesional impresa o null",
    "medicoEspecialidad": "Especialidad del profesional tratante o null"
  },
  "clinicalPlausibility": {
    "coherent": true | false,
    "severity": "ok" | "warning" | "critical",
    "expectedDaysRange": "Rango habitual orientativo de días para el CIE-10",
    "observations": "Evaluación técnica concisa de coherencia entre diagnóstico CIE-10, días otorgados y formato institucional EPS/IPS."
  }
}

Reglas estrictas:
- NO inventes ningún campo que no esté visible en el documento; usa null si no aparece.
- Sé riguroso pero objetivo en "visualAnomalies": reporta únicamente anomalías gráficas reales observables en el documento (si el documento luce limpio y homogéneo, devuelve "visualAnomalies": []).`;

  try {
    const parts = [
      {
        inlineData: {
          mimeType: supportedInlineMime,
          data: buf.toString('base64'),
        },
      },
      { text: prompt },
    ];

    const res = await generateWithKeyRotation(
      {
        model: preferredModel,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      },
      userId || '',
      parts,
      {
        timeoutMs: 30000,
        responseMimeType: 'application/json',
      },
    );

    const rawOutText = typeof res?.response?.text === 'function' ? res.response.text() : '';
    const parsed = safeParseJsonBlock(rawOutText);
    if (!parsed || typeof parsed !== 'object') {
      return {
        aiStatus: 'invalid_json_fallback',
        visualAnomalies: [],
        extractedFields: deterministicFields,
        clinicalPlausibility: {
          coherent: true,
          severity: 'ok',
          observations: 'Respuesta multimodal no estructurada; se aplicó extracción determinista.',
        },
      };
    }

    const aiFields = parsed.extractedFields && typeof parsed.extractedFields === 'object'
      ? parsed.extractedFields
      : {};

    // Combinar campos multimodales con respaldo determinista si algún campo quedó vacío
    const mergedFields = { ...deterministicFields };
    for (const [k, v] of Object.entries(aiFields)) {
      if (v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== 'null') {
        mergedFields[k] = v;
      }
    }
    if (mergedFields.diasNumero !== null && mergedFields.diasNumero !== undefined) {
      const n = Number(mergedFields.diasNumero);
      mergedFields.diasNumero = Number.isFinite(n) ? n : null;
    }

    return {
      aiStatus: 'multimodal_ok',
      modelUsed: preferredModel,
      isDisabilityCertificate: parsed.isDisabilityCertificate !== false,
      visualAnomalies: Array.isArray(parsed.visualAnomalies) ? parsed.visualAnomalies : [],
      extractedFields: mergedFields,
      clinicalPlausibility:
        parsed.clinicalPlausibility && typeof parsed.clinicalPlausibility === 'object'
          ? parsed.clinicalPlausibility
          : { coherent: true, severity: 'ok', observations: 'Sin observaciones clínicas adicionales.' },
    };
  } catch (err) {
    logger.warn(`[ForensicDocumentService] Respaldo determinista activado (${err.message})`);
    return {
      aiStatus: 'fallback_deterministic',
      aiWarning: err.message,
      visualAnomalies: [],
      extractedFields: deterministicFields,
      clinicalPlausibility: {
        coherent: true,
        severity: 'ok',
        observations: 'Evaluación ejecutada mediante motor forense binario y matemático determinista.',
      },
    };
  }
}

function normalizeEpsRoot(rawEps = '') {
  const s = String(rawEps || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(?:eps|e\.p\.s\.?|s\.?a\.?s?\.?|entidad\s+promotora\s+de\s+salud|regimen|contributivo|subsidiado)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';
  if (s.includes('sura')) return 'sura';
  if (s.includes('sanitas')) return 'sanitas';
  if (s.includes('nueva')) return 'nueva eps';
  if (s.includes('salud total') || s.includes('saludtotal')) return 'salud total';
  if (s.includes('compensar')) return 'compensar';
  if (s.includes('famisanar')) return 'famisanar';
  if (s.includes('coosalud')) return 'coosalud';
  if (s.includes('mutual ser') || s.includes('mutualser')) return 'mutual ser';
  if (s.includes('aliansalud')) return 'aliansalud';
  if (s.includes('capital salud')) return 'capital salud';
  if (s.includes('saviasalud') || s.includes('savia salud')) return 'savia salud';
  if (s.includes('asmet')) return 'asmet salud';
  if (s.includes('sos') || s.includes('servicio occidental')) return 'sos';
  return s;
}

/**
 * Cruce aislado por empresa activa (companyId) en SgsstWorker / PerfilSociodemograficoData.
 */
async function crossCheckCompanyWorker({ companyId = '', pacienteDocumento = '', entidadEmisora = '' }) {
  const cleanCompId = String(companyId || '').trim();
  const cleanDoc = String(pacienteDocumento || '').replace(/[^\dA-Za-z]/g, '').trim();

  if (
    !cleanCompId ||
    !mongoose.Types.ObjectId.isValid(cleanCompId) ||
    !cleanDoc ||
    mongoose.connection?.readyState !== 1
  ) {
    return {
      checked: false,
      foundInCompany: null,
      detail: !cleanDoc
        ? 'No se extrajo número de documento del paciente para cruzar contra la nómina.'
        : 'Sin conexión activa de base de datos o companyId para cruce sociodemográfico.',
    };
  }

  try {
    const compObjId = new mongoose.Types.ObjectId(cleanCompId);
    const companyFilter = { $in: [cleanCompId, compObjId] };

    const SgsstWorker = mongoose.models.SgsstWorker || require('../../models/SgsstWorker');
    const workerDoc = await SgsstWorker.findOne({
      companyId: companyFilter,
      $or: [
        { documento: cleanDoc },
        { documentNumber: cleanDoc },
        { cedula: cleanDoc },
      ],
    }).lean();

    let socioWorker = null;
    if (!workerDoc || !workerDoc.eps) {
      const PerfilSocio =
        mongoose.models.PerfilSociodemograficoData ||
        require('../../models/PerfilSociodemograficoData');
      const socioDoc = await PerfilSocio.findOne({ companyId: companyFilter })
        .select('trabajadores')
        .lean()
        .catch(() => null);
      if (socioDoc && Array.isArray(socioDoc.trabajadores)) {
        socioWorker =
          socioDoc.trabajadores.find((w) => {
            const wDoc = String(w?.documento || w?.cedula || w?.identificacion || '')
              .replace(/[^\dA-Za-z]/g, '')
              .trim();
            return wDoc === cleanDoc;
          }) || null;
      }
    }

    const matched = workerDoc || socioWorker;
    if (!matched) {
      return {
        checked: true,
        foundInCompany: false,
        companyId: cleanCompId,
        documentoConsultado: cleanDoc,
        epsMatch: null,
        detail: `El documento ${cleanDoc} NO figura registrado en el censo SG-SST (Hito 2) de la empresa activa.`,
      };
    }

    const registeredEps = String(workerDoc?.eps || socioWorker?.eps || '').trim();
    const estadoLaboral = String(workerDoc?.estadoLaboral || socioWorker?.estadoLaboral || 'Activo').trim();
    const workerName = String(workerDoc?.nombre || socioWorker?.nombre || '').trim();
    const workerCargo = String(workerDoc?.cargo || socioWorker?.cargo || '').trim();

    let epsMatch = null;
    let isIpsNotEps = false;
    if (registeredEps && entidadEmisora) {
      const certRoot = normalizeEpsRoot(entidadEmisora);
      const regRoot = normalizeEpsRoot(registeredEps);
      const looksLikeIps =
        /\b(?:ips|clinica|cl[ií]nica|hospital|centro\s+m[eé]dico|fundaci[oó]n|ese\b)\b/i.test(
          entidadEmisora,
        ) && !/\beps\b/i.test(entidadEmisora);
      if (looksLikeIps && certRoot !== regRoot) {
        isIpsNotEps = true;
        epsMatch = null;
      } else if (certRoot && regRoot) {
        epsMatch = certRoot === regRoot || certRoot.includes(regRoot) || regRoot.includes(certRoot);
      }
    }

    return {
      checked: true,
      foundInCompany: true,
      companyId: cleanCompId,
      workerName,
      documento: cleanDoc,
      cargo: workerCargo,
      estadoLaboral,
      registeredEps: registeredEps || null,
      certificateEntity: entidadEmisora || null,
      epsMatch,
      isIpsRequiresTranscriptionCheck: isIpsNotEps,
      detail:
        estadoLaboral === 'Retirado'
          ? `⚠️ El colaborador ${workerName} (${cleanDoc}) figura con estado RETIRADO en la empresa activa.`
          : epsMatch === false
            ? `⚠️ Discrepancia de EPS: en Hito 2 el trabajador tiene registrada "${registeredEps}", pero la incapacidad proviene de "${entidadEmisora}".`
            : isIpsNotEps
              ? `Colaborador activo (${workerName} · EPS Hito 2: ${registeredEps}). El soporte fue emitido por IPS/Clínica ("${entidadEmisora}"); verificar transcripción ante la EPS si aplica.`
              : `✅ Colaborador activo verificado en la empresa (${workerName}${registeredEps ? ` · EPS: ${registeredEps}` : ''}).`,
    };
  } catch (err) {
    logger.warn(`[ForensicDocumentService] Aviso cruzando trabajador en SgsstWorker: ${err.message}`);
    return {
      checked: false,
      foundInCompany: null,
      detail: `No fue posible completar el cruce interno en nómina: ${err.message}`,
    };
  }
}

const DOCTOR_NAME_STOPWORDS = new Set([
  'DR', 'DRA', 'DOCTOR', 'DOCTORA', 'MEDICO', 'MEDICA', 'MD', 'ESP', 'ESPECIALISTA',
  'ODONTOLOGO', 'ODONTOLOGA', 'PROFESIONAL', 'TRATANTE', 'DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y',
]);

function extractCleanDoctorCedula(extractedFields = {}) {
  const patientDigits = String(extractedFields?.pacienteDocumento || '').replace(/\D/g, '');
  const candidates = [extractedFields?.medicoDocumento, extractedFields?.registroMedico];
  for (const raw of candidates) {
    if (!raw) continue;
    const str = String(raw)
      .replace(/^(?:cc|c\.c\.|ce|ti|no\.?|n[°º]|rm|r\.m\.|tp|t\.p\.)[\s:.-]*/i, '')
      .trim();
    if (/[a-zA-Z]{2,}/.test(str)) continue;
    const digits = str.replace(/\D/g, '');
    if (/^\d{6,12}$/.test(digits) && (!patientDigits || digits !== patientDigits)) {
      return digits;
    }
  }
  return null;
}

function extractCleanIpsNitBase(extractedFields = {}, nitCheck = null) {
  if (nitCheck?.nitBase && /^\d{6,12}$/.test(String(nitCheck.nitBase))) {
    return String(nitCheck.nitBase);
  }
  const rawNit = String(extractedFields?.nitEmisor || '')
    .replace(/^(?:nit|n\.i\.t\.?)[\s:.-]*/i, '')
    .trim();
  if (!rawNit) return null;
  const basePart = rawNit.split(/[-–]/)[0] || '';
  const digits = basePart.replace(/\D/g, '');
  return /^\d{6,12}$/.test(digits) ? digits : null;
}

function normalizePersonNameTokens(rawName = '') {
  return String(rawName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-ZÑ\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !DOCTOR_NAME_STOPWORDS.has(t));
}

function compareDoctorCivilIdentityTokens(printedName = '', officialHolderName = '') {
  const titularClean = String(officialHolderName || '').replace(/\s+/g, ' ').trim();
  const medicoClean = String(printedName || '').replace(/\s+/g, ' ').trim();
  const titularTokens = normalizePersonNameTokens(titularClean);
  const printedTokens = normalizePersonNameTokens(medicoClean);

  if (titularTokens.length === 0) {
    return {
      evaluated: false,
      identidadMedicoConfirmada: null,
      matchRatio: null,
      matchedTokens: [],
    };
  }
  if (printedTokens.length === 0) {
    return {
      evaluated: false,
      identidadMedicoConfirmada: null,
      matchRatio: null,
      matchedTokens: [],
    };
  }

  const matchedTokens = printedTokens.filter((pt) =>
    titularTokens.some(
      (tt) =>
        tt === pt ||
        (pt.length >= 4 && tt.startsWith(pt)) ||
        (tt.length >= 4 && pt.startsWith(tt)),
    ),
  );
  const matchRatio = Number((matchedTokens.length / printedTokens.length).toFixed(2));
  const confirmed = matchRatio >= 0.5;

  return {
    evaluated: true,
    identidadMedicoConfirmada: confirmed,
    matchRatio,
    matchedTokens,
    printedTokens,
    titularTokens,
  };
}

async function queryMinSaludRepsSocrata(
  numeroIdentificacion = '',
  { timeoutMs = 5500, fetchImpl = global.fetch } = {},
) {
  const cleanId = String(numeroIdentificacion || '').replace(/\D/g, '').trim();
  if (!/^\d{6,12}$/.test(cleanId) || typeof fetchImpl !== 'function') {
    return { ok: false, checked: false, identificacion: cleanId || null, sedes: [] };
  }

  let timer = null;
  try {
    const url = `${MINSALUD_REPS_SOCRATA_URL}?numeroidentificacion=${encodeURIComponent(cleanId)}&$limit=5`;
    const fetchPromise = fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'WappySGSST-ForensicVerifier/1.0',
      },
      signal: AbortSignal.timeout(timeoutMs),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });

    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout REPS Socrata (${timeoutMs}ms)`)), timeoutMs);
      if (typeof timer.unref === 'function') timer.unref();
    });

    const rows = await Promise.race([fetchPromise, timeoutPromise]);
    if (!Array.isArray(rows)) {
      return { ok: false, checked: false, identificacion: cleanId, sedes: [] };
    }

    const sedes = rows.map((row) => ({
      nombreprestador: row?.nombreprestador || row?.nombresede || null,
      nombresede: row?.nombresede || null,
      codigohabilitacionsede: row?.codigohabilitacionsede || row?.codigoprestador || null,
      codigoprestador: row?.codigoprestador || null,
      claseprestador: row?.claseprestador || null,
      municipiosededesc: row?.municipiosededesc || row?.municipioprestadordesc || null,
      departamentodededesc: row?.departamentodededesc || row?.departamentoprestadordesc || null,
      tipoid: row?.tipoid || null,
      numeroidentificacion: row?.numeroidentificacion || cleanId,
      fechaCorteReps: row?.fecha_corte_reps || null,
    }));

    return {
      ok: true,
      checked: true,
      identificacion: cleanId,
      habilitadoEnReps: sedes.length > 0,
      sedes,
    };
  } catch (err) {
    logger.warn(`[ForensicDocumentService] Aviso consultando REPS MinSalud Socrata (${cleanId}): ${err.message}`);
    return {
      ok: false,
      checked: false,
      identificacion: cleanId,
      habilitadoEnReps: null,
      sedes: [],
      error: err.message,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function resolveContraloriaLookupFunction(overrideFn = null) {
  if (typeof overrideFn === 'function') return overrideFn;
  try {
    const mod = require('~/server/services/osintWorkerService');
    if (typeof mod?.consultarContraloriaFiscalPorCedula === 'function') {
      return mod.consultarContraloriaFiscalPorCedula;
    }
  } catch (_) {}
  try {
    const localMod = require('./osintWorkerService');
    if (typeof localMod?.consultarContraloriaFiscalPorCedula === 'function') {
      return localMod.consultarContraloriaFiscalPorCedula;
    }
  } catch (_) {}
  return null;
}

/**
 * Capa 4 — Verificación Institucional Automática SIN CAPTCHA:
 *   a) API Abierta Socrata de MinSalud REPS (https://www.datos.gov.co/resource/c36g-9fc2.json, timeout 5500ms)
 *      para NIT de IPS/Clínica y Cédula del médico (Profesional Independiente).
 *   b) Identidad Civil Oficial del Médico en Contraloría General (consultarContraloriaFiscalPorCedula, timeout 9000ms)
 *      comparando tokens normalizados de `titular` vs `medicoNombre`.
 */
async function verifyOfficialRegistriesWithoutCaptcha({
  extractedFields = {},
  nitCheck = null,
  repsFetchOverride = null,
  contraloriaLookupOverride = null,
} = {}) {
  const ipsNit = extractCleanIpsNitBase(extractedFields, nitCheck);
  const medicoCedula = extractCleanDoctorCedula(extractedFields);
  const medicoNombre = String(extractedFields?.medicoNombre || '').trim() || null;
  const medicoTipoDoc = String(extractedFields?.medicoTipoDoc || 'CC').trim().toUpperCase() || 'CC';
  const fetchImpl = typeof repsFetchOverride === 'function' ? repsFetchOverride : global.fetch;
  const contraloriaFn = resolveContraloriaLookupFunction(contraloriaLookupOverride);

  const runContraloriaSafe = async () => {
    if (!medicoCedula || typeof contraloriaFn !== 'function') {
      return { ok: false, checked: false, titular: null };
    }
    let timer = null;
    try {
      const lookupPromise = Promise.resolve(
        contraloriaFn({
          tipoDoc: medicoTipoDoc,
          cedula: medicoCedula,
          includeEvidence: false,
          includePdf: false,
        }),
      );
      const timeoutPromise = new Promise((resolve) => {
        timer = setTimeout(
          () => resolve({ ok: false, checked: false, titular: null, error: 'Timeout Contraloría (9000ms)' }),
          9000,
        );
        if (typeof timer.unref === 'function') timer.unref();
      });
      return await Promise.race([lookupPromise, timeoutPromise]);
    } catch (err) {
      return { ok: false, checked: false, titular: null, error: err.message };
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const [repsIpsRes, repsMedicoRes, contraloriaRaw] = await Promise.all([
    ipsNit ? queryMinSaludRepsSocrata(ipsNit, { timeoutMs: 5500, fetchImpl }) : Promise.resolve(null),
    medicoCedula && medicoCedula !== ipsNit
      ? queryMinSaludRepsSocrata(medicoCedula, { timeoutMs: 5500, fetchImpl })
      : Promise.resolve(null),
    runContraloriaSafe(),
  ]);

  let registryRiskPoints = 0;
  const registryFlags = [];
  const summaryLines = [];

  // Evaluación REPS IPS
  let ipsHabilitadaEnReps = null;
  let ipsRepsDetail = 'No se extrajo NIT numérico de IPS/prestador para consultar REPS MinSalud.';
  if (ipsNit && repsIpsRes) {
    if (repsIpsRes.ok && repsIpsRes.sedes.length > 0) {
      ipsHabilitadaEnReps = true;
      const top = repsIpsRes.sedes[0];
      const ubicacion = [top.municipiosededesc, top.departamentodededesc].filter(Boolean).join(', ');
      ipsRepsDetail =
        `✅ HABILITADA EN REPS MINSALUD: "${top.nombreprestador || 'Prestador habilitado'}" ` +
        `(NIT base: ${ipsNit} · Cód. Habilitación Sede: ${top.codigohabilitacionsede || 'N/A'} · ` +
        `Clase: ${top.claseprestador || 'IPS'}${ubicacion ? ` · Ubicación: ${ubicacion}` : ''})`;
      summaryLines.push(ipsRepsDetail);
    } else if (repsIpsRes.ok && repsIpsRes.sedes.length === 0) {
      ipsHabilitadaEnReps = false;
      const entidadStr = String(extractedFields?.entidadEmisora || '');
      const isAdministrativeEps = /\beps\b/i.test(entidadStr) && !/\b(?:ips|cl[ií]nica|hospital|consultorio)\b/i.test(entidadStr);
      if (isAdministrativeEps) {
        ipsRepsDetail =
          `ℹ️ El NIT base ${ipsNit} ("${entidadStr}") no figura como sede IPS en REPS MinSalud (las EPS aseguradoras registran NIT administrativo EAPB distinto al de la IPS prestadora).`;
      } else {
        ipsRepsDetail =
          `⚠️ Alerta REPS MinSalud: el NIT impreso (${ipsNit}${entidadStr ? ` · "${entidadStr}"` : ''}) NO figura inscrito como Prestador de Servicios de Salud habilitado en la API oficial REPS de MinSalud.`;
        registryRiskPoints += 18;
        registryFlags.push({
          severity: 'MEDIUM',
          code: 'IPS_NIT_NOT_IN_REPS',
          detail: ipsRepsDetail,
        });
      }
      summaryLines.push(ipsRepsDetail);
    } else {
      ipsRepsDetail = `ℹ️ Consulta REPS MinSalud temporalmente no disponible para NIT ${ipsNit}.`;
      summaryLines.push(ipsRepsDetail);
    }
  }

  // Evaluación REPS Médico Independiente
  let medicoHabilitadoIndependienteReps = null;
  let medicoRepsDetail = null;
  if (medicoCedula && repsMedicoRes?.ok) {
    if (repsMedicoRes.sedes.length > 0) {
      medicoHabilitadoIndependienteReps = true;
      const mTop = repsMedicoRes.sedes[0];
      const mUbic = [mTop.municipiosededesc, mTop.departamentodededesc].filter(Boolean).join(', ');
      medicoRepsDetail =
        `✅ Profesional también inscrito en REPS MinSalud como "${mTop.claseprestador || 'Profesional Independiente'}": ` +
        `${mTop.nombreprestador} (Cód. Habilitación: ${mTop.codigohabilitacionsede || 'N/A'}${mUbic ? ` · ${mUbic}` : ''}).`;
      summaryLines.push(medicoRepsDetail);
    } else {
      medicoHabilitadoIndependienteReps = false;
      medicoRepsDetail =
        `ℹ️ La C.C. ${medicoCedula} no registra consultorio propio como Profesional Independiente en REPS (habitual cuando el médico atiende adscrito a una IPS/Clínica).`;
    }
  }

  // Evaluación Identidad Civil en Contraloría General
  let identidadMedicoConfirmada = null;
  let contraloriaTitular = contraloriaRaw?.titular ? String(contraloriaRaw.titular).trim() : null;
  let doctorIdentityDetail = medicoCedula
    ? `ℹ️ No fue posible contrastar titularidad nominal en Contraloría para la C.C. ${medicoCedula} en este intento.`
    : 'No se extrajo número de cédula del médico tratante (6-12 dígitos) en el certificado.';
  let identityComparison = null;

  if (medicoCedula && contraloriaTitular) {
    identityComparison = compareDoctorCivilIdentityTokens(medicoNombre || '', contraloriaTitular);
    if (identityComparison.evaluated) {
      if (identityComparison.identidadMedicoConfirmada) {
        identidadMedicoConfirmada = true;
        doctorIdentityDetail = `✅ Identidad civil confirmada: la C.C. ${medicoCedula} corresponde legalmente a ${contraloriaTitular}`;
        summaryLines.push(doctorIdentityDetail);
      } else {
        identidadMedicoConfirmada = false;
        doctorIdentityDetail = `🚨 Discrepancia de identidad médica: la C.C. ${medicoCedula} pertenece legalmente a ${contraloriaTitular}, NO a ${medicoNombre}`;
        registryRiskPoints += 45;
        registryFlags.push({
          severity: 'HIGH',
          code: 'DOCTOR_CIVIL_IDENTITY_MISMATCH',
          detail: doctorIdentityDetail,
        });
        summaryLines.push(doctorIdentityDetail);
      }
    } else {
      doctorIdentityDetail = `ℹ️ Titular legal identificado en Contraloría para C.C. ${medicoCedula}: ${contraloriaTitular} (el soporte no traía nombre legible del médico para comparar tokens).`;
      summaryLines.push(doctorIdentityDetail);
    }
  }

  return {
    checked: Boolean(ipsNit || medicoCedula),
    zeroCaptchaUsed: true,
    ipsNit,
    medicoCedula,
    medicoNombreImpreso: medicoNombre,
    repsIps: {
      checked: Boolean(repsIpsRes?.ok),
      ipsNit,
      habilitadaEnReps: ipsHabilitadaEnReps,
      sedes: repsIpsRes?.sedes || [],
      detail: ipsRepsDetail,
      sourceUrl: MINSALUD_REPS_SOCRATA_URL,
    },
    repsMedicoIndependiente: {
      checked: Boolean(repsMedicoRes?.ok),
      medicoCedula,
      habilitadoIndependiente: medicoHabilitadoIndependienteReps,
      sedes: repsMedicoRes?.sedes || [],
      detail: medicoRepsDetail,
      sourceUrl: MINSALUD_REPS_SOCRATA_URL,
    },
    contraloriaDoctorIdentity: {
      checked: Boolean(contraloriaRaw?.ok || contraloriaTitular),
      medicoCedula,
      titularRegistradoEstado: contraloriaTitular,
      identidadMedicoConfirmada,
      matchRatio: identityComparison?.matchRatio ?? null,
      sinResponsabilidadFiscal: contraloriaRaw?.sinResponsabilidadFiscal ?? null,
      reportadoFiscal: contraloriaRaw?.reportadoFiscal ?? null,
      detail: doctorIdentityDetail,
    },
    identidadMedicoConfirmada,
    registryRiskPoints,
    registryFlags,
    summaryLines,
  };
}

/**
 * Motor Principal: Auditoría Forense Multicapa de Certificados de Incapacidad Médica (PDF / Imágenes).
 */
async function analyzeDisabilityCertificateForensics(opts = {}) {
  const {
    userInstruction = '',
    companyId = '',
    userId = '',
    modelId = 'gemini-3.5-flash-lite',
    repsFetchOverride = null,
    contraloriaLookupOverride = null,
  } = opts || {};

  const { buffer, fileName, declaredMime } = resolveBinaryInput(opts);

  if (!buffer || buffer.length === 0) {
    const emptyRethus = {
      medicoNombre: null,
      medicoTipoDoc: null,
      medicoDocumento: null,
      registroMedico: null,
      medicoEspecialidad: null,
      url: RETHUS_PUBLIC_URL,
      requiresHumanCaptcha: true,
      captchaType: 'imgCaptcha',
      note: 'Cuando se adjunta un certificado, WAPPY verifica automáticamente sin CAPTCHA la habilitación REPS de la IPS (API Socrata MinSalud) y la identidad civil del médico (Contraloría General); la consulta puntual del título académico en SISPRO ReTHUS exige validación humana del CAPTCHA visual (imgCaptcha).',
    };
    return {
      ok: false,
      hasDocument: false,
      riskScore: 0,
      riskLevel: 'BAJO',
      verdictLabel: '⚠️ SIN ARCHIVO ADJUNTO PARA AUDITAR',
      fileMeta: null,
      extractedFields: {},
      arithmeticCheck: null,
      nitCheck: null,
      workerMatch: null,
      officialRegistryVerification: null,
      rethusVerification: emptyRethus,
      redFlags: [
        'No se recibió imagen (JPG/PNG/WEBP) ni archivo PDF adjunto del certificado de incapacidad médica.',
      ],
      markdownReport:
        '### ⚠️ Auditoría Forense de Incapacidad Médica\nNo se detectó ningún archivo PDF o imagen adjunta en la solicitud. Por favor adjunta el certificado de incapacidad médica en formato PDF, JPG, PNG o WEBP para ejecutar la verificación forense de 4 capas.',
    };
  }

  // 1. Huella criptográfica SHA-256 + Magic Bytes reales
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const sizeBytes = buffer.length;
  const magic = detectMagicBytes(buffer);
  const detectedMime = magic.detectedMime;

  const redFlags = [];
  let totalRiskPoints = 0;

  const normalizedDeclared = normalizeMimeType(declaredMime || '');
  const mimeMismatch = Boolean(
    normalizedDeclared &&
      normalizedDeclared !== 'application/octet-stream' &&
      detectedMime !== 'application/octet-stream' &&
      normalizedDeclared !== detectedMime,
  );
  if (mimeMismatch) {
    totalRiskPoints += 35;
    redFlags.push(
      `Discrepancia binaria MIME vs. Magic Bytes: el archivo declara ser "${normalizedDeclared}" pero su estructura binaria real corresponde a "${detectedMime}" (${magic.format}).`,
    );
  }

  // 2. Capa 1 — Forense Binaria Determinista
  let binaryReport;
  if (detectedMime === 'application/pdf') {
    binaryReport = await inspectPdfBinaryForensics(buffer);
  } else if (['image/jpeg', 'image/png', 'image/webp'].includes(detectedMime)) {
    binaryReport = inspectImageBinaryForensics(buffer, magic.format);
  } else {
    binaryReport = {
      format: magic.format,
      nativeText: '',
      binaryFlags: [
        {
          code: 'UNSUPPORTED_BINARY_SIGNATURE',
          severity: 'warning',
          detail: `Firma binaria no estándar para soporte médico (${detectedMime}).`,
        },
      ],
      binaryRiskPoints: 20,
      metadataSummary: `Formato detectado: ${magic.format} (${sizeBytes} bytes)`,
    };
  }

  totalRiskPoints += Number(binaryReport.binaryRiskPoints || 0);
  for (const bf of binaryReport.binaryFlags || []) {
    if (bf.severity === 'critical' || bf.severity === 'warning') {
      redFlags.push(bf.detail);
    }
  }

  // 3. Capa 2 — Inspección Visual Multimodal con Gemini + Decreto 1427 de 2022
  const aiForensics = await runGeminiMultimodalForensics({
    buf: buffer,
    detectedMime,
    nativeText: binaryReport.nativeText || '',
    userInstruction,
    userId,
    modelId,
  });

  const extractedFields = {
    entidadEmisora: aiForensics.extractedFields?.entidadEmisora || null,
    nitEmisor: aiForensics.extractedFields?.nitEmisor || null,
    codigoReps: aiForensics.extractedFields?.codigoReps || null,
    pacienteNombre: aiForensics.extractedFields?.pacienteNombre || null,
    pacienteTipoDoc: aiForensics.extractedFields?.pacienteTipoDoc || null,
    pacienteDocumento: aiForensics.extractedFields?.pacienteDocumento || null,
    cie10Codigo: aiForensics.extractedFields?.cie10Codigo || null,
    cie10Descripcion: aiForensics.extractedFields?.cie10Descripcion || null,
    origen: aiForensics.extractedFields?.origen || null,
    prorroga: aiForensics.extractedFields?.prorroga ?? null,
    fechaExpedicion: aiForensics.extractedFields?.fechaExpedicion || null,
    fechaInicio: aiForensics.extractedFields?.fechaInicio || null,
    fechaFin: aiForensics.extractedFields?.fechaFin || null,
    diasNumero:
      aiForensics.extractedFields?.diasNumero !== undefined &&
      aiForensics.extractedFields?.diasNumero !== null
        ? Number(aiForensics.extractedFields.diasNumero)
        : null,
    diasLetras: aiForensics.extractedFields?.diasLetras || null,
    modalidadPrestacion: aiForensics.extractedFields?.modalidadPrestacion || null,
    medicoNombre: aiForensics.extractedFields?.medicoNombre || null,
    medicoTipoDoc: aiForensics.extractedFields?.medicoTipoDoc || null,
    medicoDocumento: aiForensics.extractedFields?.medicoDocumento || null,
    registroMedico: aiForensics.extractedFields?.registroMedico || null,
    medicoEspecialidad: aiForensics.extractedFields?.medicoEspecialidad || null,
  };

  let visualRiskPoints = 0;
  for (const anom of aiForensics.visualAnomalies || []) {
    const desc =
      typeof anom === 'string'
        ? anom
        : String(anom?.description || anom?.detalle || '').trim();
    if (!desc) continue;
    const isCrit = typeof anom === 'object' && String(anom.severity).toLowerCase() === 'critical';
    visualRiskPoints += isCrit ? 22 : 12;
    redFlags.push(`Anomalía visual detectada: ${desc}`);
  }
  totalRiskPoints += Math.min(50, visualRiskPoints);

  if (aiForensics.clinicalPlausibility?.coherent === false) {
    const sev = String(aiForensics.clinicalPlausibility.severity || 'warning').toLowerCase();
    totalRiskPoints += sev === 'critical' ? 25 : 12;
    redFlags.push(
      `Inconsistencia clínico-normativa CIE-10 vs. días otorgados: ${aiForensics.clinicalPlausibility.observations || 'Duración atípica para el diagnóstico reportado.'}`,
    );
  }

  // Verificación de campos mínimos obligatorios del Art. 2.2.3.3.1 Decreto 1427 de 2022
  const missingDecree1427 = [];
  if (!extractedFields.entidadEmisora) missingDecree1427.push('Entidad emisora (EPS/IPS)');
  if (!extractedFields.pacienteDocumento) missingDecree1427.push('Documento del afiliado');
  if (!extractedFields.cie10Codigo) missingDecree1427.push('Código diagnóstico CIE-10');
  if (!extractedFields.fechaInicio || !extractedFields.fechaFin) {
    missingDecree1427.push('Fecha de inicio y/o fin');
  }
  if (extractedFields.diasNumero === null) missingDecree1427.push('Días de incapacidad');
  if (!extractedFields.medicoNombre && !extractedFields.registroMedico && !extractedFields.medicoDocumento) {
    missingDecree1427.push('Identificación / Registro Médico del profesional tratante');
  }

  const hasExtractedAnyField = Object.values(extractedFields).some((v) => v !== null && v !== '');
  if (hasExtractedAnyField && missingDecree1427.length >= 3) {
    totalRiskPoints += 18;
    redFlags.push(
      `Incumplimiento formal Art. 2.2.3.3.1 Decreto 1427 de 2022 — faltan requisitos mínimos: ${missingDecree1427.join(', ')}.`,
    );
  }

  // 4. Capa 3 — Validaciones Matemáticas, DIAN Módulo 11, Número vs Letras y Cruce SG-SST
  const parsedStart = parseFlexibleDate(extractedFields.fechaInicio);
  const parsedEnd = parseFlexibleDate(extractedFields.fechaFin);
  const parsedExp = parseFlexibleDate(extractedFields.fechaExpedicion);

  let expectedInclusiveDays = null;
  let dateDaysConsistent = null;
  if (parsedStart && parsedEnd) {
    expectedInclusiveDays = Math.round((parsedEnd.utcNoonMs - parsedStart.utcNoonMs) / 86400000) + 1;
    if (expectedInclusiveDays <= 0) {
      dateDaysConsistent = false;
      totalRiskPoints += 45;
      redFlags.push(
        `Fechas invertidas: la fecha fin (${parsedEnd.iso}) es anterior a la fecha de inicio (${parsedStart.iso}).`,
      );
    } else if (extractedFields.diasNumero !== null && Number.isFinite(extractedFields.diasNumero)) {
      dateDaysConsistent = expectedInclusiveDays === Number(extractedFields.diasNumero);
      if (!dateDaysConsistent) {
        totalRiskPoints += 45;
        redFlags.push(
          `Inconsistencia aritmética crítica de fechas: del ${parsedStart.iso} al ${parsedEnd.iso} (inclusivo) hay exactamente ${expectedInclusiveDays} día(s), pero el certificado consigna ${extractedFields.diasNumero} día(s).`,
        );
      }
    }
  }

  let retroactivityWarning = null;
  if (parsedExp && parsedStart) {
    const diffRetroDays = Math.round((parsedExp.utcNoonMs - parsedStart.utcNoonMs) / 86400000);
    const isUrgOrHosp = /urgencia|hospital|internaci/i.test(
      String(extractedFields.modalidadPrestacion || ''),
    );
    if (diffRetroDays > 3 && !isUrgOrHosp) {
      retroactivityWarning = `Fecha de expedición (${parsedExp.iso}) posterior en ${diffRetroDays} días al inicio (${parsedStart.iso}); revisar prohibición de retroactividad ambulatoria (Art. 2.2.3.3.2 Decreto 1427 de 2022).`;
      totalRiskPoints += 12;
      redFlags.push(retroactivityWarning);
    }
  }

  const parsedWordsDays = parseSpanishDaysWords(extractedFields.diasLetras);
  let wordsMatchNumbers = null;
  if (
    parsedWordsDays !== null &&
    extractedFields.diasNumero !== null &&
    Number.isFinite(extractedFields.diasNumero)
  ) {
    wordsMatchNumbers = parsedWordsDays === Number(extractedFields.diasNumero);
    if (!wordsMatchNumbers) {
      totalRiskPoints += 45;
      redFlags.push(
        `Adulteración número vs. letras: en cifras figura "${extractedFields.diasNumero}" día(s), pero en letras dice "${extractedFields.diasLetras}" (${parsedWordsDays}).`,
      );
    }
  }

  const arithmeticCheck = {
    fechaInicioIso: parsedStart?.iso || extractedFields.fechaInicio || null,
    fechaFinIso: parsedEnd?.iso || extractedFields.fechaFin || null,
    fechaExpedicionIso: parsedExp?.iso || extractedFields.fechaExpedicion || null,
    diasDeclaradosNumero: extractedFields.diasNumero,
    diasDeclaradosLetras: extractedFields.diasLetras,
    diasCalculadosInclusivos: expectedInclusiveDays,
    diasEnLetrasInterpretados: parsedWordsDays,
    fechasCuadranConDias: dateDaysConsistent,
    numeroCuadraConLetras: wordsMatchNumbers,
    retroactivityWarning,
  };

  const nitCheck = verifyColombianNitCheckDigit(extractedFields.nitEmisor);
  if (nitCheck.hasCheckDigit && nitCheck.valid === false) {
    totalRiskPoints += 30;
    redFlags.push(nitCheck.detail);
  }

  const [workerMatch, officialRegistryVerification] = await Promise.all([
    crossCheckCompanyWorker({
      companyId,
      pacienteDocumento: extractedFields.pacienteDocumento,
      entidadEmisora: extractedFields.entidadEmisora,
    }),
    verifyOfficialRegistriesWithoutCaptcha({
      extractedFields,
      nitCheck,
      repsFetchOverride,
      contraloriaLookupOverride,
    }),
  ]);

  if (officialRegistryVerification?.medicoCedula) {
    extractedFields.medicoCedula = officialRegistryVerification.medicoCedula;
  }
  if (officialRegistryVerification?.ipsNit) {
    extractedFields.ipsNit = officialRegistryVerification.ipsNit;
  }

  if (workerMatch.checked) {
    if (workerMatch.foundInCompany === false) {
      totalRiskPoints += 12;
      redFlags.push(workerMatch.detail);
    } else if (workerMatch.estadoLaboral === 'Retirado') {
      totalRiskPoints += 20;
      redFlags.push(workerMatch.detail);
    } else if (workerMatch.epsMatch === false) {
      totalRiskPoints += 18;
      redFlags.push(workerMatch.detail);
    }
  }

  if (officialRegistryVerification) {
    totalRiskPoints += Number(officialRegistryVerification.registryRiskPoints || 0);
    for (const rf of officialRegistryVerification.registryFlags || []) {
      if (rf?.detail) {
        redFlags.push(rf.detail);
      }
    }
  }

  const rethusVerification = {
    medicoNombre: extractedFields.medicoNombre || null,
    medicoTipoDoc: extractedFields.medicoTipoDoc || 'CC',
    medicoDocumento:
      officialRegistryVerification?.medicoCedula || extractedFields.medicoDocumento || null,
    medicoCedula: officialRegistryVerification?.medicoCedula || null,
    titularCivilVerificado:
      officialRegistryVerification?.contraloriaDoctorIdentity?.titularRegistradoEstado || null,
    identidadMedicoConfirmada: officialRegistryVerification?.identidadMedicoConfirmada ?? null,
    ipsHabilitadaEnReps: officialRegistryVerification?.repsIps?.habilitadaEnReps ?? null,
    registroMedico: extractedFields.registroMedico || null,
    medicoEspecialidad: extractedFields.medicoEspecialidad || null,
    url: RETHUS_PUBLIC_URL,
    requiresHumanCaptcha: true,
    captchaType: 'imgCaptcha',
    statusLabel:
      '✅ Identidad civil y REPS verificados automáticamente · 🔒 Título académico puntual en SISPRO ReTHUS exige CAPTCHA visual humano (imgCaptcha)',
    note:
      'La identidad civil real del profesional firmante (Contraloría General de la República) y la habilitación oficial REPS de la IPS/Prestador (API Abierta Socrata MinSalud) ya fueron verificadas automáticamente en APIs abiertas del Estado sin CAPTCHA. Únicamente la consulta específica del título académico e inscripción en SISPRO ReTHUS (' +
      RETHUS_PUBLIC_URL +
      ') exige validación humana directa del CAPTCHA visual (imgCaptcha).',
  };

  const riskScore = Math.min(100, Math.max(0, Math.round(totalRiskPoints)));
  let riskLevel = 'BAJO';
  let verdictLabel = '✅ ÍNTEGRO Y CONSISTENTE';
  if (riskScore >= 55) {
    riskLevel = 'ALTO';
    verdictLabel = '🚨 ALTA SOSPECHA DE ALTERACIÓN / INCONSISTENCIA';
  } else if (riskScore >= 25) {
    riskLevel = 'MEDIO';
    verdictLabel = '⚠️ OBSERVACIONES DE REVISIÓN';
  }

  const fileMeta = {
    fileName,
    detectedMime,
    declaredMime: normalizedDeclared || null,
    mimeMismatch,
    sizeBytes,
    sha256,
    metadataSummary: binaryReport.metadataSummary || '',
    binaryFlags: binaryReport.binaryFlags || [],
    pdfInfo: binaryReport.infoDict || undefined,
    pdfXmp: binaryReport.xmp || undefined,
    eofCount: binaryReport.eofCount,
    dimensions: binaryReport.dimensions || undefined,
    exif: binaryReport.exif || undefined,
  };

  const fmtVal = (v) => (v === null || v === undefined || v === '' ? 'No registra' : String(v));
  const dateStatusStr =
    arithmeticCheck.fechasCuadranConDias === true
      ? `✅ Exacto (${arithmeticCheck.diasCalculadosInclusivos} día(s) inclusivos)`
      : arithmeticCheck.fechasCuadranConDias === false
        ? `🚨 NO CUADRA (Calculados: ${arithmeticCheck.diasCalculadosInclusivos} vs. Impresos: ${fmtVal(arithmeticCheck.diasDeclaradosNumero)})`
        : 'ℹ️ Sin fechas completas para cálculo';
  const wordsStatusStr =
    arithmeticCheck.numeroCuadraConLetras === true
      ? `✅ Coincide (${arithmeticCheck.diasDeclaradosNumero} = "${arithmeticCheck.diasDeclaradosLetras}")`
      : arithmeticCheck.numeroCuadraConLetras === false
        ? `🚨 DISCREPANCIA (${arithmeticCheck.diasDeclaradosNumero} vs. "${arithmeticCheck.diasDeclaradosLetras}")`
        : 'ℹ️ Sin días en letras para contrastar';
  const nitStatusStr =
    nitCheck.valid === true
      ? `✅ ${nitCheck.detail}`
      : nitCheck.valid === false
        ? `🚨 ${nitCheck.detail}`
        : nitCheck.detail || 'No registra dígito verificador con guion';

  const redFlagsMd =
    redFlags.length > 0
      ? redFlags.map((rf, i) => `${i + 1}. ${String(rf).startsWith('🚨') || String(rf).startsWith('⚠️') ? rf : `🚨 ${rf}`}`).join('\n')
      : '- ✅ No se detectaron banderas rojas binarias, gráficas, aritméticas ni institucionales en el soporte analizado.';

  const markdownReport = [
    `### 🔬 Dictamen Técnico de Auditoría Forense — Incapacidad Médica (4 Capas)`,
    `- **Veredicto Forense:** **${verdictLabel}**`,
    `- **Puntaje de Riesgo de Alteración:** **${riskScore}/100** (Nivel **${riskLevel}**)`,
    `- **Archivo Analizado:** \`${fileName}\` · MIME real: \`${detectedMime}\`${normalizedDeclared ? ` (declarado: \`${normalizedDeclared}\`)` : ''} · Tamaño: \`${sizeBytes} bytes\``,
    `- **Huella Criptográfica SHA-256:** \`${sha256}\``,
    `- **Metadatos Binarios (Capa 1):** ${fileMeta.metadataSummary || 'Sin metadatos adicionales'}`,
    '',
    `#### 📋 Datos Extraídos (Art. 2.2.3.3.1 Decreto 1427 de 2022)`,
    `| Campo Normativo | Valor Extraído |`,
    `| :--- | :--- |`,
    `| **Entidad Emisora (EPS / IPS)** | ${fmtVal(extractedFields.entidadEmisora)} |`,
    `| **NIT Emisor / Código REPS** | NIT: ${fmtVal(extractedFields.nitEmisor)} · REPS: ${fmtVal(extractedFields.codigoReps)} |`,
    `| **Paciente / Trabajador** | ${fmtVal(extractedFields.pacienteNombre)} (${fmtVal(extractedFields.pacienteTipoDoc)} ${fmtVal(extractedFields.pacienteDocumento)}) |`,
    `| **Diagnóstico CIE-10 y Origen** | ${fmtVal(extractedFields.cie10Codigo)}${extractedFields.cie10Descripcion ? ` — ${extractedFields.cie10Descripcion}` : ''} · Origen: ${fmtVal(extractedFields.origen)} · Prórroga: ${fmtVal(extractedFields.prorroga)} |`,
    `| **Vigencia Incapacidad** | Expedición: ${fmtVal(arithmeticCheck.fechaExpedicionIso)} · Inicio: ${fmtVal(arithmeticCheck.fechaInicioIso)} · Fin: ${fmtVal(arithmeticCheck.fechaFinIso)} |`,
    `| **Días Otorgados (Cifras / Letras)** | ${fmtVal(extractedFields.diasNumero)} (${fmtVal(extractedFields.diasLetras)}) · Modalidad: ${fmtVal(extractedFields.modalidadPrestacion)} |`,
    `| **Profesional Tratante** | ${fmtVal(extractedFields.medicoNombre)} · Doc: ${fmtVal(officialRegistryVerification?.medicoCedula || extractedFields.medicoDocumento)} · RM: ${fmtVal(extractedFields.registroMedico)} · Esp: ${fmtVal(extractedFields.medicoEspecialidad)} |`,
    '',
    `#### 🧮 Validaciones Matemáticas, DIAN y Cruce SG-SST (Capa 3)`,
    `- **Aritmética Inclusiva de Fechas:** ${dateStatusStr}`,
    `- **Concordancia Cifras vs. Letras:** ${wordsStatusStr}`,
    `- **Validación DIAN Módulo 11 (NIT):** ${nitStatusStr}`,
    `- **Plausibilidad Clínica (Capa 2):** ${aiForensics.clinicalPlausibility?.observations || 'Sin observaciones'}`,
    `- **Cruce Censo Empresa Activa (Hito 2):** ${workerMatch.detail}`,
    '',
    `#### 🏛️ Verificación Institucional Automática sin CAPTCHA (Capa 4 — REPS MinSalud + Identidad Civil)`,
    `- **Habilitación IPS / Prestador en REPS MinSalud (API Socrata):** ${officialRegistryVerification?.repsIps?.detail || 'No evaluado'}`,
    ...(officialRegistryVerification?.repsMedicoIndependiente?.detail
      ? [`- **Consulta Profesional Independiente en REPS MinSalud:** ${officialRegistryVerification.repsMedicoIndependiente.detail}`]
      : []),
    `- **Cruce Oficial de Identidad Civil del Médico (Contraloría General):** ${officialRegistryVerification?.contraloriaDoctorIdentity?.detail || 'No evaluado'}`,
    '',
    `#### 🚩 Hallazgos y Banderas Rojas (${redFlags.length})`,
    redFlagsMd,
    '',
    `#### 🩺 Consulta Puntual del Título Académico en SISPRO ReTHUS`,
    `- **Profesional auditado:** ${fmtVal(rethusVerification.medicoNombre)} · Cédula: ${fmtVal(rethusVerification.medicoDocumento)} · Titular civil Estado: ${fmtVal(rethusVerification.titularCivilVerificado)} · Registro Médico: ${fmtVal(rethusVerification.registroMedico)}`,
    `- **Portal Público Oficial MinSalud ReTHUS:** ${RETHUS_PUBLIC_URL}`,
    `- **Precisión Técnica de Seguridad:** ${rethusVerification.note}`,
  ].join('\n');

  return {
    ok: true,
    hasDocument: true,
    riskScore,
    riskLevel,
    verdictLabel,
    fileMeta,
    extractedFields,
    medicoCedula: officialRegistryVerification?.medicoCedula || null,
    ipsNit: officialRegistryVerification?.ipsNit || null,
    visualAnomalies: aiForensics.visualAnomalies || [],
    clinicalPlausibility: aiForensics.clinicalPlausibility || null,
    missingDecree1427,
    arithmeticCheck,
    nitCheck,
    workerMatch,
    officialRegistryVerification,
    rethusVerification,
    redFlags,
    markdownReport,
  };
}

module.exports = {
  analyzeDisabilityCertificateForensics,
  verifyOfficialRegistriesWithoutCaptcha,
  compareDoctorCivilIdentityTokens,
  queryMinSaludRepsSocrata,
  verifyColombianNitCheckDigit,
  parseSpanishDaysWords,
  parseFlexibleDate,
  detectMagicBytes,
  inspectPdfBinaryForensics,
  inspectImageBinaryForensics,
  RETHUS_PUBLIC_URL,
  MINSALUD_REPS_SOCRATA_URL,
};
