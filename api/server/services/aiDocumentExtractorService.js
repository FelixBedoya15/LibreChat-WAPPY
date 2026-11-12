'use strict';

const bufferModule = require('buffer');
if (!bufferModule.SlowBuffer) {
  bufferModule.SlowBuffer = class SlowBuffer extends Buffer {};
  if (typeof global !== 'undefined' && !global.SlowBuffer) {
    global.SlowBuffer = bufferModule.SlowBuffer;
  }
}

const fs = require('fs');
const os = require('os');
const path = require('path');
const { google } = require('googleapis');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

function getGoogleAuthHelper() {
  try {
    return require('~/server/services/googleAuthHelper');
  } catch {
    try {
      const moduleAlias = require('module-alias');
      moduleAlias.addAlias('~', path.resolve(__dirname, '../..'));
    } catch {
      // ignore if module-alias not needed
    }
    return require('./googleAuthHelper');
  }
}

const ALLOWED_EXTRACTOR_AI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
];

const DEFAULT_AI_EXTRACTION_SCHEMA = [
  {
    name: 'Cédula',
    type: 'string',
    description: 'Número de cédula o documento de identidad',
  },
  {
    name: 'Diagnóstico',
    type: 'string',
    description: 'Diagnóstico médico, CIE-10 o concepto de aptitud',
  },
  {
    name: 'Fecha',
    type: 'date',
    description: 'Fecha del documento o examen (YYYY-MM-DD)',
  },
];

const RESERVED_META_COLUMNS_LOWER = new Set([
  'archivo origen',
  'metodo lectura',
  'método lectura',
  'modelo ia / ocr',
  'modelo ia',
]);

const MAX_GMAIL_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_LOCAL_OR_DRIVE_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

const SUPPORTED_LOCAL_EXTENSIONS = new Set([
  '.pdf',
  '.docx',
  '.doc',
  '.xlsx',
  '.xls',
  '.csv',
  '.txt',
  '.md',
  '.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
]);

function getGenerateWithKeyRotation() {
  try {
    const mod = require('~/server/routes/sgsst/sgsstGemini');
    return mod.generateWithKeyRotation;
  } catch {
    const mod = require('../routes/sgsst/sgsstGemini');
    return mod.generateWithKeyRotation;
  }
}

function normalizeSchemaFieldType(rawType) {
  const clean = String(rawType || 'string').trim().toLowerCase();
  if (['number', 'num', 'integer', 'float', 'numero', 'número'].includes(clean)) {
    return 'number';
  }
  if (['date', 'fecha', 'datetime'].includes(clean)) {
    return 'date';
  }
  if (['boolean', 'bool', 'si_no', 'yes_no'].includes(clean)) {
    return 'boolean';
  }
  return 'string';
}

/**
 * Normaliza el esquema de extracción IA a un arreglo limpio de `{ name, type, description }`.
 * Acepta arreglo o JSON string; hace fallback a `fallbackFields` (string[]) o `DEFAULT_AI_EXTRACTION_SCHEMA`.
 */
function normalizeAiExtractionSchema(rawSchema, fallbackFields) {
  let parsed = rawSchema;
  if (typeof rawSchema === 'string') {
    const trimmed = rawSchema.trim();
    if (trimmed) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = null;
      }
    } else {
      parsed = null;
    }
  }

  const normalized = [];
  const seenLower = new Set();

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (!item) continue;
      let name = '';
      let type = 'string';
      let description = '';

      if (typeof item === 'string') {
        name = item.trim();
      } else if (typeof item === 'object') {
        name = String(item.name ?? item.field ?? item.key ?? item.label ?? '').trim();
        type = normalizeSchemaFieldType(item.type);
        description = String(item.description ?? item.desc ?? '').trim();
      }

      if (!name) continue;
      const lower = name.toLowerCase();
      if (RESERVED_META_COLUMNS_LOWER.has(lower) || seenLower.has(lower)) continue;
      seenLower.add(lower);
      normalized.push({ name, type, description });
    }
  }

  if (normalized.length > 0) {
    return normalized;
  }

  let fallbackArr = [];
  if (Array.isArray(fallbackFields)) {
    fallbackArr = fallbackFields;
  } else if (typeof fallbackFields === 'string' && fallbackFields.trim()) {
    try {
      const maybeArr = JSON.parse(fallbackFields.trim());
      fallbackArr = Array.isArray(maybeArr)
        ? maybeArr
        : fallbackFields.split(',').map((s) => s.trim());
    } catch {
      fallbackArr = fallbackFields.split(',').map((s) => s.trim());
    }
  }

  for (const rawField of fallbackArr) {
    const name = String(rawField || '').trim();
    if (!name) continue;
    const lower = name.toLowerCase();
    if (RESERVED_META_COLUMNS_LOWER.has(lower) || seenLower.has(lower)) continue;
    seenLower.add(lower);
    normalized.push({ name, type: 'string', description: '' });
  }

  if (normalized.length > 0) {
    return normalized;
  }

  return DEFAULT_AI_EXTRACTION_SCHEMA.map((f) => ({ ...f }));
}

/**
 * Resuelve el modelo IA verificando estrictamente contra `ALLOWED_EXTRACTOR_AI_MODELS`.
 */
function resolveExtractorAiModel(rawModel) {
  const clean = String(rawModel || '').trim();
  if (ALLOWED_EXTRACTOR_AI_MODELS.includes(clean)) {
    return clean;
  }
  return 'gemini-3.6-flash';
}

function extractGoogleDriveId(input) {
  if (!input || typeof input !== 'string') return '';
  const cleaned = input.trim().replace(/^['"`]+|['"`]+$/g, '').trim();
  if (!cleaned) return '';
  if (cleaned.toLowerCase() === 'root') return 'root';

  const folderMatch = cleaned.match(/\/folders\/([a-zA-Z0-9_-]{10,})/i);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  const docMatch =
    cleaned.match(
      /\/(?:file|document|spreadsheets|presentation|forms)\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]{10,})/i,
    ) || cleaned.match(/\/d\/([a-zA-Z0-9_-]{15,})/i);
  if (docMatch && docMatch[1]) return docMatch[1];

  const queryIdMatch = cleaned.match(/[?&]id=([a-zA-Z0-9_-]{10,})/i);
  if (queryIdMatch && queryIdMatch[1]) return queryIdMatch[1];

  if (/^[a-zA-Z0-9_-]{20,}$/.test(cleaned)) {
    return cleaned;
  }
  return '';
}

function escapeDriveQueryLiteral(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
}

async function resolveDriveTargetFolder(
  drive,
  { driveFolderId = '', driveFolderUrl = '', driveFolderName = '' } = {},
) {
  const cleanIdInput = String(driveFolderId || '').trim();
  const cleanUrlInput = String(driveFolderUrl || '').trim();
  const cleanNameInput = String(driveFolderName || '').trim();

  const exactId =
    extractGoogleDriveId(cleanIdInput) ||
    extractGoogleDriveId(cleanUrlInput) ||
    extractGoogleDriveId(cleanNameInput);

  if (exactId === 'root') {
    return {
      resolvedFolder: {
        id: 'root',
        name: 'Mi unidad (Raíz)',
        webViewLink: 'https://drive.google.com/drive/my-drive',
      },
      singleFile: null,
    };
  }

  if (exactId) {
    const metaRes = await drive.files
      .get({
        fileId: exactId,
        fields: 'id, name, mimeType, size, webViewLink, modifiedTime',
      })
      .catch(() => null);
    const meta = metaRes?.data;
    if (meta?.id) {
      if (meta.mimeType === 'application/vnd.google-apps.folder') {
        return {
          resolvedFolder: {
            id: String(meta.id),
            name: String(meta.name || exactId),
            webViewLink: String(
              meta.webViewLink || `https://drive.google.com/drive/folders/${meta.id}`,
            ),
          },
          singleFile: null,
        };
      }
      return {
        resolvedFolder: null,
        singleFile: meta,
      };
    }
    return {
      resolvedFolder: {
        id: exactId,
        name: cleanNameInput && !extractGoogleDriveId(cleanNameInput) ? cleanNameInput : exactId,
        webViewLink: `https://drive.google.com/drive/folders/${exactId}`,
      },
      singleFile: null,
    };
  }

  if (!cleanNameInput) {
    return { resolvedFolder: null, singleFile: null };
  }

  const findFolderByName = async (segmentName, parentId = null) => {
    const safeSeg = escapeDriveQueryLiteral(segmentName);
    const parentClause = parentId ? ` and '${escapeDriveQueryLiteral(parentId)}' in parents` : '';
    const exactRes = await drive.files
      .list({
        q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${safeSeg}'${parentClause}`,
        fields: 'files(id, name, webViewLink)',
        pageSize: 5,
      })
      .catch(() => null);
    const exactFiles = Array.isArray(exactRes?.data?.files) ? exactRes.data.files : [];
    if (exactFiles.length > 0) return exactFiles[0];

    const partialRes = await drive.files
      .list({
        q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false and name contains '${safeSeg}'${parentClause}`,
        fields: 'files(id, name, webViewLink)',
        pageSize: 5,
      })
      .catch(() => null);
    const partialFiles = Array.isArray(partialRes?.data?.files) ? partialRes.data.files : [];
    return (
      partialFiles.find((f) => String(f.name || '').toLowerCase() === segmentName.toLowerCase()) ||
      partialFiles[0] ||
      null
    );
  };

  if (cleanNameInput.includes('/') && !/^https?:\/\//i.test(cleanNameInput)) {
    const rawSegments = cleanNameInput
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);
    const segments = rawSegments.filter(
      (seg, idx) => !(idx === 0 && ['mi unidad', 'my drive', 'root'].includes(seg.toLowerCase())),
    );
    if (segments.length === 0) {
      return {
        resolvedFolder: {
          id: 'root',
          name: 'Mi unidad (Raíz)',
          webViewLink: 'https://drive.google.com/drive/my-drive',
        },
        singleFile: null,
      };
    }

    let currentFolder = null;
    for (let i = 0; i < segments.length; i++) {
      const nextFolder = await findFolderByName(segments[i], i === 0 ? null : currentFolder?.id);
      if (!nextFolder) {
        currentFolder = null;
        break;
      }
      currentFolder = nextFolder;
    }

    if (!currentFolder && segments.length > 0) {
      currentFolder = await findFolderByName(segments[segments.length - 1], null);
    }

    if (currentFolder?.id) {
      return {
        resolvedFolder: {
          id: String(currentFolder.id),
          name: String(currentFolder.name || cleanNameInput),
          webViewLink: String(
            currentFolder.webViewLink ||
              `https://drive.google.com/drive/folders/${currentFolder.id}`,
          ),
        },
        singleFile: null,
      };
    }
    return { resolvedFolder: null, singleFile: null };
  }

  const matchedFolder = await findFolderByName(cleanNameInput, null);
  if (matchedFolder?.id) {
    return {
      resolvedFolder: {
        id: String(matchedFolder.id),
        name: String(matchedFolder.name || cleanNameInput),
        webViewLink: String(
          matchedFolder.webViewLink || `https://drive.google.com/drive/folders/${matchedFolder.id}`,
        ),
      },
      singleFile: null,
    };
  }
  return { resolvedFolder: null, singleFile: null };
}

async function getGoogleOAuthContext(userId, companyId) {
  if (!userId) return null;
  try {
    const {
      getActiveCompany,
      getScopedAuthValue,
      updateScopedAuthValue,
    } = getGoogleAuthHelper();
    let targetCompanyId = companyId && String(companyId) !== 'DEFAULT' ? String(companyId) : null;
    if (!targetCompanyId) {
      const activeComp = await getActiveCompany(userId).catch(() => null);
      targetCompanyId = activeComp?._id ? String(activeComp._id) : null;
    }

    const [email, refreshToken, accessToken, expiryStr] = await Promise.all([
      getScopedAuthValue(userId, targetCompanyId, 'GOOGLE_DRIVE_EMAIL', false).catch(() => null),
      getScopedAuthValue(userId, targetCompanyId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false).catch(
        () => null,
      ),
      getScopedAuthValue(userId, targetCompanyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', false).catch(
        () => null,
      ),
      getScopedAuthValue(userId, targetCompanyId, 'GOOGLE_DRIVE_EXPIRY', false).catch(() => null),
    ]);

    if (!accessToken && !refreshToken) {
      return null;
    }

    const serverDomain = (process.env.DOMAIN_SERVER || 'https://wappy.club')
      .replace(/https?:\/\/wappy-ia\.com/g, 'https://wappy.club')
      .replace(/\/+$/, '');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${serverDomain}/api/google-drive/callback`,
    );

    const expiry = expiryStr ? Number(expiryStr) : null;
    oauth2Client.setCredentials({
      access_token: accessToken || undefined,
      refresh_token: refreshToken || undefined,
      expiry_date: expiry || undefined,
    });

    const isExpired = expiry ? expiry - Date.now() < 60000 : !accessToken;
    if (isExpired && refreshToken) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        if (credentials.access_token) {
          await updateScopedAuthValue(
            userId,
            targetCompanyId,
            'GOOGLE_DRIVE_ACCESS_TOKEN',
            credentials.access_token,
          ).catch(() => {});
        }
        if (credentials.expiry_date) {
          await updateScopedAuthValue(
            userId,
            targetCompanyId,
            'GOOGLE_DRIVE_EXPIRY',
            String(credentials.expiry_date),
          ).catch(() => {});
        }
      } catch {
        if (!accessToken) return null;
      }
    }

    return {
      oauth2Client,
      email: email || '',
      companyId: targetCompanyId,
    };
  } catch {
    return null;
  }
}

function inferMimeTypeFromExtension(fileName = '', fallbackMime = '') {
  const cleanMime = String(fallbackMime || '').trim().toLowerCase();
  if (cleanMime && cleanMime !== 'application/octet-stream') {
    return cleanMime;
  }
  const ext = path.extname(String(fileName || '')).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (ext === '.doc') return 'application/msword';
  if (ext === '.xlsx') {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  if (ext === '.xls') return 'application/vnd.ms-excel';
  if (ext === '.csv') return 'text/csv';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.json') return 'application/json';
  if (ext === '.txt' || ext === '.md') return 'text/plain';
  return cleanMime || 'application/octet-stream';
}

async function extractTextFromPdfBuffer(buffer) {
  let text = '';
  try {
    const PDFParseClass = pdf.PDFParse || (pdf.default && pdf.default.PDFParse);
    if (typeof PDFParseClass === 'function') {
      const parser = new PDFParseClass({ data: buffer });
      try {
        const data = await parser.getText();
        text = data && data.text ? data.text.trim() : '';
      } finally {
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
      }
    } else if (typeof pdf === 'function') {
      const pdfData = await pdf(buffer);
      text = pdfData && pdfData.text ? pdfData.text.trim() : '';
    } else if (pdf.default && typeof pdf.default === 'function') {
      const pdfData = await pdf.default(buffer);
      text = pdfData && pdfData.text ? pdfData.text.trim() : '';
    }
  } catch {
    text = '';
  }
  return (text || '').replace(/\n+/g, '\n').trim();
}

/**
 * Convierte un Buffer descargado (PDF, Word, Excel, Imagen, CSV/Texto) en un descriptor de documento
 * listo para extracción IA en 1 sola llamada (texto plano o `inlineData` Visión OCR).
 */
async function parseBufferToDocumentPayload({
  buffer,
  fileName,
  mimeType,
  id,
  sourceType,
  webViewLink = '',
  prefixContextText = '',
}) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  const safeName = String(fileName || 'Documento').trim() || 'Documento';
  const ext = path.extname(safeName).toLowerCase();
  const resolvedMime = inferMimeTypeFromExtension(safeName, mimeType);
  const contextHeader = prefixContextText ? `${prefixContextText.trim()}\n\n` : '';

  // 1. PDF: intentar pdf-parse primero; si < 45 chars (escaneado / FURAT / EMO firmado), adjuntar inlineData para Visión OCR directa
  if (resolvedMime === 'application/pdf' || ext === '.pdf') {
    const parsedPdfText = await extractTextFromPdfBuffer(buffer);
    if (parsedPdfText.length >= 45) {
      return {
        id: String(id || safeName),
        name: safeName,
        mimeType: 'application/pdf',
        sourceType,
        webViewLink,
        textContent: `${contextHeader}${parsedPdfText}`,
        inlineData: null,
        usedVisionOcr: false,
      };
    }
    return {
      id: String(id || safeName),
      name: safeName,
      mimeType: 'application/pdf',
      sourceType,
      webViewLink,
      textContent: contextHeader || '',
      inlineData: {
        mimeType: 'application/pdf',
        data: buffer.toString('base64'),
      },
      usedVisionOcr: true,
    };
  }

  // 2. Imágenes (.png, .jpg, .jpeg, .webp) -> Visión OCR directa
  if (
    resolvedMime.startsWith('image/') ||
    ['.png', '.jpg', '.jpeg', '.webp'].includes(ext)
  ) {
    const imgMime = resolvedMime.startsWith('image/')
      ? resolvedMime
      : inferMimeTypeFromExtension(safeName, 'image/jpeg');
    return {
      id: String(id || safeName),
      name: safeName,
      mimeType: imgMime,
      sourceType,
      webViewLink,
      textContent: contextHeader || '',
      inlineData: {
        mimeType: imgMime,
        data: buffer.toString('base64'),
      },
      usedVisionOcr: true,
    };
  }

  // 3. Word (.docx / .doc)
  if (
    resolvedMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    resolvedMime === 'application/msword' ||
    ext === '.docx' ||
    ext === '.doc'
  ) {
    try {
      const wordRes = await mammoth.extractRawText({ buffer });
      const rawText = String(wordRes?.value || '').trim();
      if (!rawText && !contextHeader) return null;
      return {
        id: String(id || safeName),
        name: safeName,
        mimeType: resolvedMime,
        sourceType,
        webViewLink,
        textContent: `${contextHeader}${rawText}`,
        inlineData: null,
        usedVisionOcr: false,
      };
    } catch {
      return null;
    }
  }

  // 4. Excel (.xlsx / .xls)
  if (
    resolvedMime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    resolvedMime === 'application/vnd.ms-excel' ||
    ext === '.xlsx' ||
    ext === '.xls'
  ) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const csvParts = [];
      for (const sheetName of workbook.SheetNames || []) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv && csv.trim()) {
          csvParts.push(`--- Hoja: ${sheetName} ---\n${csv.trim()}`);
        }
      }
      const joinedCsv = csvParts.join('\n\n').trim();
      if (!joinedCsv && !contextHeader) return null;
      return {
        id: String(id || safeName),
        name: safeName,
        mimeType: resolvedMime,
        sourceType,
        webViewLink,
        textContent: `${contextHeader}${joinedCsv}`,
        inlineData: null,
        usedVisionOcr: false,
      };
    } catch {
      return null;
    }
  }

  // 5. Texto plano / CSV / Markdown / JSON
  if (
    resolvedMime.startsWith('text/') ||
    resolvedMime === 'application/json' ||
    ['.csv', '.txt', '.md', '.json'].includes(ext)
  ) {
    const utf8Text = buffer.toString('utf8').trim();
    if (!utf8Text && !contextHeader) return null;
    return {
      id: String(id || safeName),
      name: safeName,
      mimeType: resolvedMime,
      sourceType,
      webViewLink,
      textContent: `${contextHeader}${utf8Text}`,
      inlineData: null,
      usedVisionOcr: false,
    };
  }

  return null;
}

function buildDriveFileTypeClause(fileTypeFilter = '') {
  const ft = String(fileTypeFilter || '').trim().toLowerCase();
  if (!ft || ft === 'all') return '';
  if (ft.includes('pdf')) return ` and mimeType = 'application/pdf'`;
  if (ft.includes('excel') || ft.includes('xlsx') || ft.includes('sheet') || ft.includes('spreadsheet')) {
    return ` and (mimeType contains 'spreadsheet' or mimeType contains 'excel' or mimeType = 'text/csv')`;
  }
  if (ft.includes('word') || ft.includes('docx') || ft.includes('doc')) {
    return ` and (mimeType contains 'document' or mimeType contains 'word')`;
  }
  if (ft.includes('image') || ft.includes('img') || ft.includes('foto')) {
    return ` and mimeType contains 'image/'`;
  }
  return '';
}

function matchesLocalFileType(extLower, fileTypeFilter = '') {
  const ft = String(fileTypeFilter || '').trim().toLowerCase();
  if (!SUPPORTED_LOCAL_EXTENSIONS.has(extLower)) return false;
  if (!ft || ft === 'all') return true;
  if (ft === 'pdf') return extLower === '.pdf';
  if (['excel', 'xlsx', 'spreadsheet', 'csv'].includes(ft)) {
    return ['.xlsx', '.xls', '.csv'].includes(extLower);
  }
  if (['word', 'docx', 'document'].includes(ft)) {
    return ['.docx', '.doc'].includes(extLower);
  }
  if (['image', 'images'].includes(ft)) {
    return ['.png', '.jpg', '.jpeg', '.webp'].includes(extLower);
  }
  const normalizedExt = ft.startsWith('.') ? ft : `.${ft}`;
  return extLower === normalizedExt;
}

function buildGmailSearchQuery(gmailCfg = {}) {
  const parts = [];
  const subj = String(gmailCfg?.emailSubjectFilter || '').trim();
  const sender = String(gmailCfg?.emailSenderFilter || '').trim();
  const onlyAtt =
    gmailCfg?.onlyWithAttachments === true || gmailCfg?.onlyWithAttachments === 'true';
  const timeWin = String(gmailCfg?.timeWindow || '').trim().toLowerCase();

  if (subj) {
    parts.push(`subject:("${subj.replace(/"/g, '')}")`);
  }
  if (sender) {
    parts.push(`from:(${sender.replace(/"/g, '')})`);
  }
  if (onlyAtt) {
    parts.push('has:attachment');
  }
  if (timeWin) {
    if (timeWin === '24h' || timeWin === '1d') parts.push('newer_than:1d');
    else if (timeWin === '7d') parts.push('newer_than:7d');
    else if (timeWin === '30d') parts.push('newer_than:30d');
    else if (/^newer_than:\d+[dhm]$/i.test(timeWin)) parts.push(timeWin);
  } else if (parts.length === 0) {
    parts.push('newer_than:7d');
  }

  return parts.join(' ');
}

function mergeSourceConfigs({ extractorCfg = {}, driveCfg = null, gmailCfg = null, pcCfg = null }) {
  const mergedDriveCfg = {
    ...(driveCfg && typeof driveCfg === 'object' ? driveCfg : {}),
    ...(extractorCfg.driveFolderId ? { driveFolderId: extractorCfg.driveFolderId } : {}),
    ...(extractorCfg.driveFolderUrl ? { driveFolderUrl: extractorCfg.driveFolderUrl } : {}),
    ...(extractorCfg.driveFolderName ? { driveFolderName: extractorCfg.driveFolderName } : {}),
    ...(extractorCfg.fileNameFilter ? { fileNameFilter: extractorCfg.fileNameFilter } : {}),
    ...(extractorCfg.fileTypeFilter ? { fileTypeFilter: extractorCfg.fileTypeFilter } : {}),
  };

  const mergedGmailCfg = {
    ...(gmailCfg && typeof gmailCfg === 'object' ? gmailCfg : {}),
    ...(extractorCfg.emailSubjectFilter
      ? { emailSubjectFilter: extractorCfg.emailSubjectFilter }
      : {}),
    ...(extractorCfg.emailSenderFilter
      ? { emailSenderFilter: extractorCfg.emailSenderFilter }
      : {}),
    ...(extractorCfg.onlyWithAttachments !== undefined
      ? { onlyWithAttachments: extractorCfg.onlyWithAttachments }
      : {}),
    ...(extractorCfg.timeWindow ? { timeWindow: extractorCfg.timeWindow } : {}),
  };

  const mergedPcCfg = {
    ...(pcCfg && typeof pcCfg === 'object' ? pcCfg : {}),
    ...(extractorCfg.watchFolderPath ? { watchFolderPath: extractorCfg.watchFolderPath } : {}),
    ...(extractorCfg.includeSubfolders !== undefined
      ? { includeSubfolders: extractorCfg.includeSubfolders }
      : {}),
    ...(extractorCfg.fileNameFilter ? { fileNameFilter: extractorCfg.fileNameFilter } : {}),
    ...(extractorCfg.fileTypeFilter ? { fileTypeFilter: extractorCfg.fileTypeFilter } : {}),
  };

  return { mergedDriveCfg, mergedGmailCfg, mergedPcCfg };
}

/**
 * Inspección pasiva ligera (0 tokens de IA y 0 descarga de binarios pesados) para mostrar
 * en tiempo real los archivos candidatos aguas arriba en el panel derecho del inspector.
 */
async function listPassiveCandidateMetadata({
  userId,
  companyId,
  extractorCfg = {},
  driveCfg = null,
  gmailCfg = null,
  pcCfg = null,
  maxItems = 8,
} = {}) {
  const safeMax = Math.min(15, Math.max(1, Number(maxItems) || 8));
  const upstreamType = String(extractorCfg.upstreamSourceType || '').trim().toLowerCase();
  const { mergedDriveCfg, mergedGmailCfg, mergedPcCfg } = mergeSourceConfigs({
    extractorCfg,
    driveCfg,
    gmailCfg,
    pcCfg,
  });

  const candidateFiles = [];
  let connected = false;
  let connectedEmail = '';
  let resolvedFolder = null;
  let availableFolders = [];
  let sourceLabel = 'Fuente Documental Aguas Arriba';

  // 1. Carpeta Local PC si está explícitamente configurada
  const rawWatchPath = String(mergedPcCfg.watchFolderPath || '').trim();
  const cleanWatchPath = rawWatchPath.replace(/^['"`]+|['"`]+$/g, '').trim();
  if (upstreamType === 'pc' || (cleanWatchPath && upstreamType !== 'drive' && upstreamType !== 'gmail')) {
    sourceLabel = cleanWatchPath
      ? `Carpeta Local (${cleanWatchPath})`
      : 'Carpeta Local (vía Antigravity)';
    if (cleanWatchPath) {
      const fsTargetPath = cleanWatchPath.startsWith('~/')
        ? path.join(os.homedir(), cleanWatchPath.slice(2))
        : cleanWatchPath;
      const includeSubfolders =
        mergedPcCfg.includeSubfolders === true || mergedPcCfg.includeSubfolders === 'true';
      const nameFilterLower = String(mergedPcCfg.fileNameFilter || '').trim().toLowerCase();
      try {
        if (fs.existsSync(fsTargetPath) && fs.statSync(fsTargetPath).isDirectory()) {
          connected = true;
          const walk = (dir, depth = 0) => {
            if (candidateFiles.length >= safeMax || depth > 1) return;
            let entries = [];
            try {
              entries = fs.readdirSync(dir, { withFileTypes: true });
            } catch {
              return;
            }
            for (const entry of entries) {
              if (candidateFiles.length >= safeMax) break;
              if (!entry?.name || entry.name.startsWith('.')) continue;
              const full = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                if (includeSubfolders && depth === 0) walk(full, depth + 1);
                continue;
              }
              if (!entry.isFile()) continue;
              const extLower = path.extname(entry.name).toLowerCase();
              if (!matchesLocalFileType(extLower, mergedPcCfg.fileTypeFilter)) continue;
              if (nameFilterLower && !entry.name.toLowerCase().includes(nameFilterLower)) continue;
              candidateFiles.push({
                id: `pc_${candidateFiles.length + 1}_${entry.name}`,
                name: entry.name,
                sourceType: 'pc',
              });
            }
          };
          walk(fsTargetPath, 0);
        }
      } catch {
        // Ignore FS errors in passive listing
      }
    }
    return {
      connected,
      connectedEmail,
      resolvedFolder,
      availableFolders,
      sourceLabel,
      candidateFiles,
    };
  }

  // 2. Gmail si está explícitamente configurado
  const hasGmailHints = Boolean(
    upstreamType === 'gmail' ||
      mergedGmailCfg.emailSubjectFilter ||
      mergedGmailCfg.emailSenderFilter ||
      mergedGmailCfg.onlyWithAttachments,
  );
  const oauthCtx = await getGoogleOAuthContext(userId, companyId);
  if (oauthCtx) {
    connected = true;
    connectedEmail = oauthCtx.email || '';
  }

  if (hasGmailHints && upstreamType !== 'drive') {
    sourceLabel = 'Bandeja Gmail OAuth';
    if (oauthCtx) {
      try {
        const gmail = google.gmail({ version: 'v1', auth: oauthCtx.oauth2Client });
        const q = buildGmailSearchQuery(mergedGmailCfg);
        const listRes = await gmail.users.messages.list({
          userId: 'me',
          q: q || undefined,
          maxResults: safeMax,
        });
        const refs = Array.isArray(listRes?.data?.messages) ? listRes.data.messages : [];
        const details = await Promise.all(
          refs.slice(0, safeMax).map((m) =>
            gmail.users.messages
              .get({
                userId: 'me',
                id: m.id,
                format: 'metadata',
                metadataHeaders: ['Subject', 'From'],
              })
              .then((r) => r?.data)
              .catch(() => null),
          ),
        );
        for (const msg of details.filter(Boolean)) {
          const hdrs = Array.isArray(msg?.payload?.headers) ? msg.payload.headers : [];
          const subj =
            hdrs.find((h) => String(h.name || '').toLowerCase() === 'subject')?.value ||
            '(Correo sin asunto)';
          candidateFiles.push({
            id: String(msg.id),
            name: `✉️ ${subj}`,
            sourceType: 'gmail',
          });
        }
      } catch {
        // Ignore passive Gmail list errors
      }
    }
    return {
      connected,
      connectedEmail,
      resolvedFolder,
      availableFolders,
      sourceLabel,
      candidateFiles,
    };
  }

  // 3. Google Drive (por defecto o cuando hay selector de carpeta Drive)
  sourceLabel = mergedDriveCfg.driveFolderName
    ? `Google Drive (${mergedDriveCfg.driveFolderName})`
    : 'Google Drive OAuth';
  if (oauthCtx) {
    try {
      const drive = google.drive({ version: 'v3', auth: oauthCtx.oauth2Client });
      const [foldersCatalog, targetInfo] = await Promise.all([
        drive.files
          .list({
            q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name, parents, webViewLink)',
            orderBy: 'name',
            pageSize: 40,
          })
          .then((res) =>
            (Array.isArray(res?.data?.files) ? res.data.files : []).map((f) => ({
              id: String(f.id || ''),
              name: String(f.name || 'Carpeta'),
              parentId: Array.isArray(f.parents) && f.parents[0] ? String(f.parents[0]) : null,
              webViewLink: String(f.webViewLink || `https://drive.google.com/drive/folders/${f.id}`),
            })),
          )
          .catch(() => []),
        resolveDriveTargetFolder(drive, {
          driveFolderId: mergedDriveCfg.driveFolderId,
          driveFolderUrl: mergedDriveCfg.driveFolderUrl,
          driveFolderName: mergedDriveCfg.driveFolderName,
        }),
      ]);

      availableFolders = foldersCatalog;
      resolvedFolder = targetInfo?.resolvedFolder || null;
      if (resolvedFolder?.name) {
        sourceLabel = `Google Drive (${resolvedFolder.name})`;
      }

      if (targetInfo?.singleFile) {
        candidateFiles.push({
          id: String(targetInfo.singleFile.id),
          name: String(targetInfo.singleFile.name || 'Documento Drive'),
          sourceType: 'drive',
        });
      } else {
        const qParts = [
          'trashed = false',
          "mimeType != 'application/vnd.google-apps.folder'",
        ];
        if (resolvedFolder?.id) {
          qParts.push(`'${escapeDriveQueryLiteral(resolvedFolder.id)}' in parents`);
        } else if (
          mergedDriveCfg.driveFolderName &&
          !extractGoogleDriveId(mergedDriveCfg.driveFolderName)
        ) {
          qParts.push(`name contains '${escapeDriveQueryLiteral(mergedDriveCfg.driveFolderName)}'`);
        }
        if (mergedDriveCfg.fileNameFilter) {
          qParts.push(`name contains '${escapeDriveQueryLiteral(mergedDriveCfg.fileNameFilter)}'`);
        }
        const typeClause = buildDriveFileTypeClause(mergedDriveCfg.fileTypeFilter);
        const listRes = await drive.files.list({
          q: `${qParts.join(' and ')}${typeClause}`,
          fields: 'files(id, name, mimeType, webViewLink, modifiedTime)',
          pageSize: safeMax,
          orderBy: 'modifiedTime desc',
        });
        const files = Array.isArray(listRes?.data?.files) ? listRes.data.files : [];
        for (const f of files) {
          candidateFiles.push({
            id: String(f.id),
            name: String(f.name || 'Documento Drive'),
            sourceType: 'drive',
          });
        }
      }
    } catch {
      // Ignore passive Drive list errors
    }
  }

  return {
    connected,
    connectedEmail,
    resolvedFolder,
    availableFolders,
    sourceLabel,
    candidateFiles,
  };
}

/**
 * Recolecta hasta `maxDocs` documentos candidatos reales de las fuentes conectadas aguas arriba:
 * 1) Google Drive (`freshDriveFiles` o `driveCfg`),
 * 2) Gmail (`freshGmailMessages` o `gmailCfg`, incluyendo adjuntos <= 8 MB),
 * 3) Carpeta Local PC (`pcCfg.watchFolderPath`),
 * 4) `eventPayload` (correo/webhook/QR en tiempo real).
 */
async function collectCandidateDocuments({
  userId,
  companyId,
  driveCfg = null,
  gmailCfg = null,
  pcCfg = null,
  freshDriveFiles = null,
  freshGmailMessages = null,
  eventPayload = null,
  upstreamSourceType = '',
  maxDocs = 5,
} = {}) {
  const safeMaxDocs = Math.min(15, Math.max(1, Number(maxDocs) || 5));
  const docs = [];
  const upstreamSource = String(upstreamSourceType || '').trim().toLowerCase();

  const hasExplicitDriveCfg = Boolean(
    driveCfg &&
      (driveCfg.driveFolderId ||
        driveCfg.driveFolderUrl ||
        driveCfg.driveFolderName ||
        driveCfg.fileNameFilter),
  );
  const hasExplicitGmailCfg = Boolean(
    gmailCfg &&
      (gmailCfg.emailSubjectFilter ||
        gmailCfg.emailSenderFilter ||
        gmailCfg.onlyWithAttachments ||
        gmailCfg.timeWindow),
  );
  const hasExplicitPcCfg = Boolean(pcCfg && String(pcCfg.watchFolderPath || '').trim());
  const hasEventPayload = Boolean(
    eventPayload &&
      ((typeof eventPayload === 'string' && eventPayload.trim().length > 0) ||
        (typeof eventPayload === 'object' && Object.keys(eventPayload).length > 0)),
  );

  let oauthCtx = null;
  const ensureOAuth = async () => {
    if (oauthCtx !== null) return oauthCtx;
    oauthCtx = await getGoogleOAuthContext(userId, companyId);
    return oauthCtx;
  };

  // 1. Google Drive
  const shouldUseDrive =
    Array.isArray(freshDriveFiles) ||
    upstreamSource === 'drive' ||
    hasExplicitDriveCfg ||
    (!upstreamSource && !hasExplicitGmailCfg && !hasExplicitPcCfg && !hasEventPayload);

  if (shouldUseDrive && docs.length < safeMaxDocs) {
    const auth = await ensureOAuth();
    if (auth?.oauth2Client) {
      try {
        const drive = google.drive({ version: 'v3', auth: auth.oauth2Client });
        let driveFilesList = [];

        if (Array.isArray(freshDriveFiles)) {
          driveFilesList = freshDriveFiles.filter(
            (f) => f && f.id && f.mimeType !== 'application/vnd.google-apps.folder',
          );
        } else {
          const targetInfo = await resolveDriveTargetFolder(drive, {
            driveFolderId: driveCfg?.driveFolderId,
            driveFolderUrl: driveCfg?.driveFolderUrl,
            driveFolderName: driveCfg?.driveFolderName,
          });

          if (targetInfo?.singleFile) {
            driveFilesList = [targetInfo.singleFile];
          } else {
            const qParts = [
              'trashed = false',
              "mimeType != 'application/vnd.google-apps.folder'",
            ];
            if (targetInfo?.resolvedFolder?.id) {
              qParts.push(`'${escapeDriveQueryLiteral(targetInfo.resolvedFolder.id)}' in parents`);
            } else if (
              driveCfg?.driveFolderName &&
              !extractGoogleDriveId(driveCfg.driveFolderName)
            ) {
              qParts.push(`name contains '${escapeDriveQueryLiteral(driveCfg.driveFolderName)}'`);
            }
            if (driveCfg?.fileNameFilter) {
              qParts.push(`name contains '${escapeDriveQueryLiteral(driveCfg.fileNameFilter)}'`);
            }
            const typeClause = buildDriveFileTypeClause(driveCfg?.fileTypeFilter);
            const listRes = await drive.files.list({
              q: `${qParts.join(' and ')}${typeClause}`,
              fields: 'files(id, name, mimeType, size, webViewLink, modifiedTime)',
              pageSize: safeMaxDocs,
              orderBy: 'modifiedTime desc',
            });
            driveFilesList = Array.isArray(listRes?.data?.files) ? listRes.data.files : [];
          }
        }

        for (const f of driveFilesList.slice(0, safeMaxDocs - docs.length)) {
          if (docs.length >= safeMaxDocs) break;
          const fileId = String(f.id || '').trim();
          if (!fileId) continue;
          const fileName = String(f.name || fileId).trim();
          const mimeType = String(f.mimeType || '').trim();
          const fileSize = Number(f.size || 0);
          if (fileSize > MAX_LOCAL_OR_DRIVE_FILE_BYTES) continue;

          try {
            if (mimeType === 'application/vnd.google-apps.document') {
              const exp = await drive.files.export({ fileId, mimeType: 'text/plain' });
              const txt = String(exp?.data || '').trim();
              if (txt) {
                docs.push({
                  id: fileId,
                  name: fileName,
                  mimeType,
                  sourceType: 'drive',
                  webViewLink: f.webViewLink || '',
                  textContent: txt,
                  inlineData: null,
                  usedVisionOcr: false,
                });
              }
              continue;
            }

            if (mimeType === 'application/vnd.google-apps.spreadsheet') {
              const exp = await drive.files.export({ fileId, mimeType: 'text/csv' });
              const csvTxt = String(exp?.data || '').trim();
              if (csvTxt) {
                docs.push({
                  id: fileId,
                  name: fileName,
                  mimeType,
                  sourceType: 'drive',
                  webViewLink: f.webViewLink || '',
                  textContent: csvTxt,
                  inlineData: null,
                  usedVisionOcr: false,
                });
              }
              continue;
            }

            const mediaRes = await drive.files.get(
              { fileId, alt: 'media' },
              { responseType: 'arraybuffer' },
            );
            const buffer = Buffer.from(mediaRes.data);
            const parsedDoc = await parseBufferToDocumentPayload({
              buffer,
              fileName,
              mimeType,
              id: fileId,
              sourceType: 'drive',
              webViewLink: f.webViewLink || '',
            });
            if (parsedDoc) {
              docs.push(parsedDoc);
            }
          } catch {
            // Skip unreadable individual Drive file and continue
          }
        }
      } catch {
        // Non-fatal Drive collection error
      }
    }
  }

  // 2. Gmail (mensajes y adjuntos PDF/imagen/Word/Excel <= 8 MB)
  const shouldUseGmail =
    Array.isArray(freshGmailMessages) || upstreamSource === 'gmail' || hasExplicitGmailCfg;

  if (shouldUseGmail && docs.length < safeMaxDocs) {
    const auth = await ensureOAuth();
    if (auth?.oauth2Client) {
      try {
        const gmail = google.gmail({ version: 'v1', auth: auth.oauth2Client });
        let msgRefs = [];

        if (Array.isArray(freshGmailMessages)) {
          msgRefs = freshGmailMessages.filter((m) => m && m.id);
        } else {
          const q = buildGmailSearchQuery(gmailCfg || {});
          const listRes = await gmail.users.messages.list({
            userId: 'me',
            q: q || undefined,
            maxResults: safeMaxDocs - docs.length,
          });
          msgRefs = Array.isArray(listRes?.data?.messages) ? listRes.data.messages : [];
        }

        const onlyWithAtt =
          gmailCfg?.onlyWithAttachments === true || gmailCfg?.onlyWithAttachments === 'true';

        for (const ref of msgRefs) {
          if (docs.length >= safeMaxDocs) break;
          const msgId = String(ref.id || '').trim();
          if (!msgId) continue;

          try {
            const fullRes = await gmail.users.messages.get({
              userId: 'me',
              id: msgId,
              format: 'full',
            });
            const payload = fullRes?.data?.payload || {};
            const headers = Array.isArray(payload.headers) ? payload.headers : [];
            const getHdr = (name) =>
              headers.find((h) => String(h.name || '').toLowerCase() === name.toLowerCase())
                ?.value || '';
            const subject = getHdr('Subject') || '(Sin asunto)';
            const from = getHdr('From') || 'Remitente desconocido';
            const dateStr = getHdr('Date') || '';

            let bodyText = '';
            const attachmentParts = [];

            const walkParts = (part) => {
              if (!part || typeof part !== 'object') return;
              const partFilename = String(part.filename || '').trim();
              const attId = part.body?.attachmentId;
              const partSize = Number(part.body?.size || 0);

              if (partFilename && attId) {
                if (partSize <= MAX_GMAIL_ATTACHMENT_BYTES) {
                  attachmentParts.push({
                    filename: partFilename,
                    mimeType: part.mimeType || '',
                    attachmentId: attId,
                    size: partSize,
                  });
                }
              } else if (part.body?.data) {
                const decoded = Buffer.from(
                  String(part.body.data).replace(/-/g, '+').replace(/_/g, '/'),
                  'base64',
                ).toString('utf8');
                if (part.mimeType === 'text/plain' && decoded.trim()) {
                  bodyText = decoded.trim();
                } else if (part.mimeType === 'text/html' && !bodyText && decoded.trim()) {
                  bodyText = decoded
                    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                }
              }

              if (Array.isArray(part.parts)) {
                part.parts.forEach(walkParts);
              }
            };
            walkParts(payload);

            if (!bodyText && fullRes?.data?.snippet) {
              bodyText = String(fullRes.data.snippet).trim();
            }

            const emailHeaderContext =
              `[Contexto del Correo Gmail]\n` +
              `- Asunto: ${subject}\n` +
              `- Remitente: ${from}\n` +
              `- Fecha: ${dateStr}\n` +
              (bodyText ? `- Cuerpo del mensaje:\n${bodyText.slice(0, 6000)}` : '');

            let addedAttachmentForMsg = false;
            for (const att of attachmentParts) {
              if (docs.length >= safeMaxDocs) break;
              try {
                const attRes = await gmail.users.messages.attachments.get({
                  userId: 'me',
                  messageId: msgId,
                  id: att.attachmentId,
                });
                const rawB64 = String(attRes?.data?.data || '');
                if (!rawB64) continue;
                const attBuffer = Buffer.from(
                  rawB64.replace(/-/g, '+').replace(/_/g, '/'),
                  'base64',
                );
                if (attBuffer.length > MAX_GMAIL_ATTACHMENT_BYTES) continue;

                const parsedAtt = await parseBufferToDocumentPayload({
                  buffer: attBuffer,
                  fileName: att.filename,
                  mimeType: att.mimeType,
                  id: `gmail_${msgId}_${att.filename}`,
                  sourceType: 'gmail_attachment',
                  prefixContextText: emailHeaderContext,
                });
                if (parsedAtt) {
                  docs.push(parsedAtt);
                  addedAttachmentForMsg = true;
                }
              } catch {
                // Continue if single attachment fails
              }
            }

            if (!addedAttachmentForMsg && !onlyWithAtt && docs.length < safeMaxDocs) {
              docs.push({
                id: `gmail_${msgId}`,
                name: `✉️ ${subject}`,
                mimeType: 'message/rfc822',
                sourceType: 'gmail',
                webViewLink: '',
                textContent: emailHeaderContext,
                inlineData: null,
                usedVisionOcr: false,
              });
            }
          } catch {
            // Continue on individual Gmail message error
          }
        }
      } catch {
        // Non-fatal Gmail error
      }
    }
  }

  // 3. Carpeta Local PC / Mac (`pcCfg.watchFolderPath`)
  if (hasExplicitPcCfg && docs.length < safeMaxDocs) {
    const cleanWatch = String(pcCfg.watchFolderPath || '')
      .trim()
      .replace(/^['"`]+|['"`]+$/g, '')
      .trim();
    if (cleanWatch) {
      const fsTargetPath = cleanWatch.startsWith('~/')
        ? path.join(os.homedir(), cleanWatch.slice(2))
        : cleanWatch;
      const includeSubfolders =
        pcCfg.includeSubfolders === true || pcCfg.includeSubfolders === 'true';
      const nameFilterLower = String(pcCfg.fileNameFilter || '').trim().toLowerCase();

      try {
        if (fs.existsSync(fsTargetPath) && fs.statSync(fsTargetPath).isDirectory()) {
          const localCandidates = [];
          const walkLocal = (dirPath, depth = 0) => {
            if (localCandidates.length >= safeMaxDocs - docs.length || depth > 1) return;
            let entries = [];
            try {
              entries = fs.readdirSync(dirPath, { withFileTypes: true });
            } catch {
              return;
            }
            for (const entry of entries) {
              if (localCandidates.length >= safeMaxDocs - docs.length) break;
              if (!entry?.name || entry.name.startsWith('.')) continue;
              const fullPath = path.join(dirPath, entry.name);
              if (entry.isDirectory()) {
                if (includeSubfolders && depth === 0) {
                  walkLocal(fullPath, depth + 1);
                }
                continue;
              }
              if (!entry.isFile()) continue;
              const extLower = path.extname(entry.name).toLowerCase();
              if (!matchesLocalFileType(extLower, pcCfg.fileTypeFilter)) continue;
              if (nameFilterLower && !entry.name.toLowerCase().includes(nameFilterLower)) continue;
              try {
                const st = fs.statSync(fullPath);
                if (st.size > 0 && st.size <= MAX_LOCAL_OR_DRIVE_FILE_BYTES) {
                  localCandidates.push({ name: entry.name, fullPath });
                }
              } catch {
                // Skip unreadable stat
              }
            }
          };
          walkLocal(fsTargetPath, 0);

          for (const lf of localCandidates) {
            if (docs.length >= safeMaxDocs) break;
            try {
              const buffer = fs.readFileSync(lf.fullPath);
              const parsedLocal = await parseBufferToDocumentPayload({
                buffer,
                fileName: lf.name,
                mimeType: '',
                id: `pc_${lf.name}`,
                sourceType: 'pc',
              });
              if (parsedLocal) {
                docs.push(parsedLocal);
              }
            } catch {
              // Skip unreadable file
            }
          }
        }
      } catch {
        // Ignore non-fatal local dir errors
      }
    }
  }

  // 4. `eventPayload` (ej. `trigger_email`, `trigger_webhook`, `trigger_qr_worker`, o `mockTriggerInput`)
  if (hasEventPayload && docs.length < safeMaxDocs) {
    const textBody =
      typeof eventPayload === 'string'
        ? eventPayload.trim()
        : JSON.stringify(eventPayload, null, 2).trim();
    if (textBody) {
      const eventName =
        (typeof eventPayload === 'object' &&
          eventPayload &&
          (eventPayload.fileName || eventPayload.subject || eventPayload.title)) ||
        'Evento Entrante en Tiempo Real';
      docs.push({
        id: 'event_payload_1',
        name: String(eventName).slice(0, 120),
        mimeType: 'text/plain',
        sourceType: 'event',
        webViewLink: '',
        textContent: textBody,
        inlineData: null,
        usedVisionOcr: false,
      });
    }
  }

  return docs.slice(0, safeMaxDocs);
}

function extractTextFromGeminiResult(geminiResult) {
  if (!geminiResult) return '';
  if (typeof geminiResult?.response?.text === 'function') {
    return String(geminiResult.response.text() || '').trim();
  }
  if (geminiResult?.text) {
    return String(
      typeof geminiResult.text === 'function' ? geminiResult.text() : geminiResult.text,
    ).trim();
  }
  if (typeof geminiResult === 'string') {
    return geminiResult.trim();
  }
  return '';
}

function parseGeminiStructuredJson(rawText, rowMode = 'single_row') {
  if (!rawText || typeof rawText !== 'string') {
    return [{}];
  }
  let cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const firstObj = cleaned.indexOf('{');
    const lastObj = cleaned.lastIndexOf('}');
    const firstArr = cleaned.indexOf('[');
    const lastArr = cleaned.lastIndexOf(']');
    if (firstObj !== -1 && lastObj > firstObj) {
      try {
        parsed = JSON.parse(cleaned.slice(firstObj, lastObj + 1));
      } catch {
        parsed = null;
      }
    }
    if (!parsed && firstArr !== -1 && lastArr > firstArr) {
      try {
        parsed = JSON.parse(cleaned.slice(firstArr, lastArr + 1));
      } catch {
        parsed = null;
      }
    }
  }

  let rowsList = [];
  if (Array.isArray(parsed)) {
    rowsList = parsed.filter((r) => r && typeof r === 'object');
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.rows)) {
      rowsList = parsed.rows.filter((r) => r && typeof r === 'object');
    } else if (Array.isArray(parsed.items)) {
      rowsList = parsed.items.filter((r) => r && typeof r === 'object');
    } else if (Array.isArray(parsed.data)) {
      rowsList = parsed.data.filter((r) => r && typeof r === 'object');
    } else {
      rowsList = [parsed];
    }
  }

  if (rowsList.length === 0) {
    return [{}];
  }
  return rowMode === 'multiple_rows' ? rowsList : [rowsList[0]];
}

function normalizeFieldKeyLookup(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeExtractedCellValue(val) {
  if (val === null || val === undefined) return 'No registra';
  if (typeof val === 'boolean') return val ? 'Sí' : 'No';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'No registra';
  if (Array.isArray(val)) {
    const cleanItems = val
      .map((v) => normalizeExtractedCellValue(v))
      .filter((v) => v && v !== 'No registra');
    return cleanItems.length > 0 ? cleanItems.join(', ') : 'No registra';
  }
  if (typeof val === 'object') {
    const parts = Object.entries(val)
      .map(([k, v]) => {
        const cv = normalizeExtractedCellValue(v);
        return cv && cv !== 'No registra' ? `${k}: ${cv}` : '';
      })
      .filter(Boolean);
    return parts.length > 0 ? parts.join(' | ') : 'No registra';
  }
  const trimmed = String(val).trim();
  if (
    !trimmed ||
    /^(null|undefined|nan|n\/a|none)$/i.test(trimmed)
  ) {
    return 'No registra';
  }
  return trimmed;
}

function findExtractedFieldValue(rawRowObj, fieldName) {
  if (!rawRowObj || typeof rawRowObj !== 'object') return 'No registra';
  if (Object.prototype.hasOwnProperty.call(rawRowObj, fieldName)) {
    return normalizeExtractedCellValue(rawRowObj[fieldName]);
  }
  const targetNorm = normalizeFieldKeyLookup(fieldName);
  for (const [k, v] of Object.entries(rawRowObj)) {
    if (normalizeFieldKeyLookup(k) === targetNorm) {
      return normalizeExtractedCellValue(v);
    }
  }
  return 'No registra';
}

function buildHomogeneousMarkdownTable(columns, rows) {
  if (!Array.isArray(rows) || rows.length === 0 || !Array.isArray(columns) || columns.length === 0) {
    return '';
  }
  const escapeMdCell = (val) =>
    String(val ?? 'No registra')
      .replace(/\|/g, '\\|')
      .replace(/\r?\n+/g, ' ')
      .trim() || 'No registra';

  const headerLine = `| ${columns.map(escapeMdCell).join(' | ')} |`;
  const sepLine = `| ${columns.map(() => '---').join(' | ')} |`;
  const bodyLines = rows.map(
    (row) => `| ${columns.map((col) => escapeMdCell(row[col])).join(' | ')} |`,
  );
  return [headerLine, sepLine, ...bodyLines].join('\n');
}

/**
 * Ejecuta la extracción estructurada con IA + Visión OCR sobre hasta `maxDocs` documentos candidatos.
 * Si hay 0 documentos candidatos, retorna de inmediato con 0 tokens de IA consumidos.
 */
async function extractStructuredFieldsFromDocuments({
  userId,
  companyId,
  companyName = 'Empresa Activa',
  extractorCfg = {},
  driveCfg = null,
  gmailCfg = null,
  pcCfg = null,
  freshDriveFiles = null,
  freshGmailMessages = null,
  eventPayload = null,
  maxDocs = 5,
} = {}) {
  const schema = normalizeAiExtractionSchema(
    extractorCfg?.aiExtractionSchema,
    extractorCfg?.fields || extractorCfg?.selectedFields,
  );
  const rowMode =
    extractorCfg?.aiExtractionRowMode === 'multiple_rows' ? 'multiple_rows' : 'single_row';
  const model = resolveExtractorAiModel(extractorCfg?.aiModel);
  const customInstruction = String(extractorCfg?.customInstruction || '').trim();
  const safeMaxDocs = Math.min(15, Math.max(1, Number(maxDocs) || 5));

  const { mergedDriveCfg, mergedGmailCfg, mergedPcCfg } = mergeSourceConfigs({
    extractorCfg: extractorCfg || {},
    driveCfg,
    gmailCfg,
    pcCfg,
  });

  const docs = await collectCandidateDocuments({
    userId,
    companyId,
    driveCfg: mergedDriveCfg,
    gmailCfg: mergedGmailCfg,
    pcCfg: mergedPcCfg,
    freshDriveFiles,
    freshGmailMessages,
    eventPayload,
    upstreamSourceType: extractorCfg?.upstreamSourceType,
    maxDocs: safeMaxDocs,
  });

  if (docs.length === 0) {
    return {
      modelUsed: model,
      schema,
      documentsCount: 0,
      rows: [],
      markdownTable: '',
      candidateFiles: [],
      warnings: [],
    };
  }

  const generateWithKeyRotation = getGenerateWithKeyRotation();
  const schemaLines = schema
    .map(
      (f, idx) =>
        `${idx + 1}. "${f.name}" (tipo: ${f.type})${f.description ? ` — Descripción: ${f.description}` : ''}`,
    )
    .join('\n');
  const jsonExampleObj = {};
  for (const f of schema) {
    jsonExampleObj[f.name] = 'valor exacto o "No registra"';
  }

  const rows = [];
  const warnings = [];

  for (const doc of docs) {
    const modeDirective =
      rowMode === 'multiple_rows'
        ? 'MODO MÚLTIPLES FILAS (`multiple_rows`): Si el documento contiene varias personas, trabajadores, hallazgos o filas de una tabla, devuelve UN objeto dentro de `"rows"` por cada fila/persona real encontrada.'
        : 'MODO REGISTRO ÚNICO (`single_row`): Devuelve exactamente UN (1) objeto consolidado dentro de `"rows"` para este documento.';

    const promptText =
      `Actúas como el motor oficial "Extractor IA de Documentos (PDF / OCR -> Datos Exactos)" de WAPPY IA para la empresa "${companyName}".\n` +
      `Analiza con precisión quirúrgica el documento adjunto "${doc.name}" y extrae EXCLUSIVAMENTE los siguientes campos estructurados:\n\n` +
      `${schemaLines}\n\n` +
      (customInstruction ? `INSTRUCCIÓN ADICIONAL DEL USUARIO:\n${customInstruction}\n\n` : '') +
      `${modeDirective}\n\n` +
      `REGLAS CRÍTICAS E INQUEBRANTABLES (CERO INVENCIÓN):\n` +
      `1. PROHIBIDO inventar, suponer, deducir o autocompletar datos que NO estén escritos explícitamente en el documento.\n` +
      `2. Si un campo solicitado NO aparece explícitamente en el documento o es ilegible, debes colocar exactamente la cadena "No registra" (NUNCA devuelvas null, undefined, "" ni datos ficticios).\n` +
      `3. Si un campo es de tipo "date" y la fecha aparece explícitamente, normalízala al formato YYYY-MM-DD (si no aparece, usa "No registra").\n` +
      `4. Responde ÚNICAMENTE con un objeto JSON válido con la propiedad "rows", respetando exactamente los nombres de llave solicitados:\n` +
      `${JSON.stringify({ rows: [jsonExampleObj] }, null, 2)}`;

    const contentParts = [{ text: promptText }];
    if (doc.textContent && doc.textContent.trim()) {
      contentParts.push({
        text: `\n--- TEXTO EXTRAÍDO DEL DOCUMENTO "${doc.name}" ---\n${doc.textContent.slice(0, 65000)}`,
      });
    }
    if (doc.inlineData && doc.inlineData.data) {
      contentParts.push({
        inlineData: {
          mimeType: doc.inlineData.mimeType || 'application/pdf',
          data: doc.inlineData.data,
        },
      });
    }

    try {
      const geminiRes = await generateWithKeyRotation(
        {
          model,
          generationConfig: {
            temperature: 0.05,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        },
        userId,
        contentParts,
      );

      const rawJsonText = extractTextFromGeminiResult(geminiRes);
      const parsedObjects = parseGeminiStructuredJson(rawJsonText, rowMode);

      for (const rawRow of parsedObjects) {
        const homogeneousRow = {
          'Archivo Origen': String(doc.name || 'Documento'),
          'Método Lectura': doc.usedVisionOcr ? '✨ Visión OCR + IA' : '📄 Texto + IA',
        };
        for (const fieldDef of schema) {
          homogeneousRow[fieldDef.name] = findExtractedFieldValue(rawRow, fieldDef.name);
        }
        rows.push(homogeneousRow);
      }
    } catch (err) {
      warnings.push(`No se pudo extraer "${doc.name}": ${err?.message || 'Error en modelo IA'}`);
    }
  }

  const allColumns = ['Archivo Origen', 'Método Lectura', ...schema.map((s) => s.name)];
  const markdownTable = buildHomogeneousMarkdownTable(allColumns, rows);

  return {
    modelUsed: model,
    schema,
    documentsCount: docs.length,
    rows,
    markdownTable,
    candidateFiles: docs.map((d) => ({
      id: d.id,
      name: d.name,
      sourceType: d.sourceType,
      usedVisionOcr: Boolean(d.usedVisionOcr),
      webViewLink: d.webViewLink || '',
    })),
    warnings,
  };
}

module.exports = {
  ALLOWED_EXTRACTOR_AI_MODELS,
  DEFAULT_AI_EXTRACTION_SCHEMA,
  normalizeAiExtractionSchema,
  resolveExtractorAiModel,
  collectCandidateDocuments,
  listPassiveCandidateMetadata,
  extractStructuredFieldsFromDocuments,
};
