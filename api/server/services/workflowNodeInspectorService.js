const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const CompanyInfo = require('~/models/CompanyInfo');

/**
 * Extrae el ID limpio de una carpeta o archivo de Google Drive a partir de:
 * - URL de carpeta: `https://drive.google.com/drive/folders/<ID>...`
 * - URL de archivo/doc: `https://drive.google.com/file/d/<ID>...` o `https://docs.google.com/.../d/<ID>...` o `?id=<ID>`
 * - Palabra clave `'root'`
 * - ID puro de Google Drive (`^[a-zA-Z0-9_-]{20,}$` sin espacios ni `/`)
 */
function extractGoogleDriveId(input) {
  if (!input || typeof input !== 'string') return '';
  const cleaned = input.trim().replace(/^['"`]+|['"`]+$/g, '').trim();
  if (!cleaned) return '';
  if (cleaned.toLowerCase() === 'root') return 'root';

  const folderMatch = cleaned.match(/\/folders\/([a-zA-Z0-9_-]{10,})/i);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  const docMatch =
    cleaned.match(/\/(?:file|document|spreadsheets|presentation|forms)\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]{10,})/i) ||
    cleaned.match(/\/d\/([a-zA-Z0-9_-]{15,})/i);
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

function formatDriveMimeTypeLabel(mimeType = '') {
  const mime = String(mimeType || '').toLowerCase();
  if (mime === 'application/vnd.google-apps.folder') return 'Carpeta';
  if (mime === 'application/pdf') return 'PDF';
  if (mime === 'text/csv') return 'CSV';
  if (
    mime === 'application/vnd.google-apps.spreadsheet' ||
    mime.includes('spreadsheet') ||
    mime.includes('excel')
  ) {
    return 'Hoja de Cálculo';
  }
  if (
    mime === 'application/vnd.google-apps.document' ||
    mime.includes('document') ||
    mime.includes('msword') ||
    mime.includes('wordprocessingml')
  ) {
    return 'Documento';
  }
  if (mime === 'application/vnd.google-apps.presentation' || mime.includes('presentation') || mime.includes('powerpoint')) {
    return 'Presentación';
  }
  if (mime.startsWith('image/')) return 'Imagen';
  if (mime.startsWith('video/')) return 'Video';
  if (mime.startsWith('audio/')) return 'Audio';
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('compressed')) return 'Comprimido';
  if (mime.startsWith('text/')) return 'Texto';
  return 'Archivo';
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
        fields: 'id, name, mimeType, webViewLink, modifiedTime',
      })
      .catch(() => null);
    const meta = metaRes?.data;
    if (meta?.id) {
      if (meta.mimeType === 'application/vnd.google-apps.folder') {
        return {
          resolvedFolder: {
            id: String(meta.id),
            name: String(meta.name || exactId),
            webViewLink: String(meta.webViewLink || `https://drive.google.com/drive/folders/${meta.id}`),
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
      (seg, idx) =>
        !(idx === 0 && ['mi unidad', 'my drive', 'root'].includes(seg.toLowerCase())),
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
            currentFolder.webViewLink || `https://drive.google.com/drive/folders/${currentFolder.id}`,
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

/**
 * Catálogo explícito de nodos bloqueados / En Construcción que NO deben ejecutar llamadas externas
 * y deben devolver aviso claro de `🚧 Nodo en Construcción`.
 */
const BLOCKED_CONSTRUCTION_NODE_SPECS = {
  trigger_whatsapp: {
    title: 'Disparador WhatsApp Business Cloud API',
    team: 'Equipo 1 · Disparadores',
    reason:
      '🚧 Nodo en Construcción: La integración directa con Meta WhatsApp Business Cloud API se encuentra en fase de homologación de plantillas HSM y webhooks verificados.',
  },
  extract_onedrive: {
    title: 'Extractor Microsoft OneDrive / SharePoint',
    team: 'Equipo 2 · Extractores',
    reason:
      '🚧 Nodo en Construcción: El extractor corporativo Microsoft Graph (OneDrive / SharePoint) se encuentra en fase de habilitación de permisos Azure AD.',
  },
  one_drive: {
    title: 'Conector Microsoft OneDrive / SharePoint',
    team: 'Equipo 5 · Conectores Externos',
    reason:
      '🚧 Nodo en Construcción: El conector Microsoft OneDrive / SharePoint se encuentra temporalmente en construcción. Utiliza Google Drive o Carpeta Local Antigravity.',
  },
  scraper_agy_pensiones_directo: {
    title: 'Scraper Fondo de Pensiones y RUAF Directo',
    team: 'Equipo 2/8 · Web Scraping Oficial',
    reason:
      '🚧 Nodo en Construcción: El conector directo de certificados AFP / RUAF SISPRO se encuentra en ajuste por actualización de tokens CAPTCHA gubernamentales.',
  },
  scraper_agy_salud_rethus: {
    title: 'Scraper ADRES BDUA Salud & ReTHUS MinSalud',
    team: 'Equipo 2/8 · Web Scraping Oficial',
    reason:
      '🚧 Nodo en Construcción: El conector directo ADRES BDUA / ReTHUS se encuentra en mantenimiento preventivo de sesión.',
  },
};

/**
 * Aplicativos de Hitos marcados con `defaultConstruction: true` en el catálogo.
 */
const DEFAULT_CONSTRUCTION_HITO_APPS = new Set([
  'hito1_matriz_legal',
  'hito3_comite_pesv',
  'hito3_brigada_emergencias',
  'hito5_equipos_emergencia',
  'hito6_comunicaciones_sst',
  'hito6_simulacros_emergencia',
  'hito6_app_builder',
  'hito7_investigacion_profunda',
]);

/**
 * Limpia cualquier valor escalar u objeto para garantizar cero `undefined`, cero `[object Object]`
 * y cero cadenas base64 gigantescas dentro de las celdas de inspección.
 */
function formatCleanScalar(val, fallback = 'N/A') {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'boolean') return val ? 'Sí' : 'No';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : fallback;
  if (val instanceof Date) return Number.isNaN(val.getTime()) ? fallback : val.toISOString();
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    if (/^data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,/i.test(trimmed)) {
      return '[Archivo Binario Adjunto]';
    }
    const cleaned = trimmed
      .replace(/\bundefined\b/g, '')
      .replace(/\[object Object\]/g, '')
      .replace(/\(\s*CC\s*\)/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return cleaned || fallback;
  }
  if (Array.isArray(val)) {
    const parts = val
      .map((item) => formatCleanScalar(item, ''))
      .filter((s) => s && s !== 'N/A');
    return parts.length > 0 ? parts.join(', ') : fallback;
  }
  if (typeof val === 'object') {
    if (val._bsontype === 'ObjectId' || typeof val.toHexString === 'function') {
      return String(val);
    }
    const entries = Object.entries(val)
      .filter(([k, v]) => !k.startsWith('_') && v !== undefined && v !== null && v !== '')
      .map(([k, v]) => {
        const formatted = formatCleanScalar(v, '');
        return formatted ? `${k}: ${formatted}` : '';
      })
      .filter(Boolean);
    return entries.length > 0 ? entries.join(' | ').slice(0, 600) : fallback;
  }
  return String(val);
}

/**
 * Sanitiza recursivamente un registro de salida del inspector para garantizar 0 `undefined` y 0 `[object Object]`.
 */
function sanitizeInspectorRecord(rec, idx = 0) {
  if (!rec || typeof rec !== 'object') {
    return {
      id: `rec_${idx}`,
      label: `Registro #${idx + 1}`,
      sublabel: 'Sin detalle adicional',
      badge: 'ACTIVO',
      badgeTone: 'teal',
      isCritical: false,
      fields: {},
    };
  }
  const cleanFields = {};
  const rawFields = rec.fields && typeof rec.fields === 'object' ? rec.fields : {};
  for (const [k, v] of Object.entries(rawFields)) {
    const cleanKey = formatCleanScalar(k, '').trim();
    if (!cleanKey) continue;
    cleanFields[cleanKey] = formatCleanScalar(v, 'No registra');
  }
  return {
    ...rec,
    id: formatCleanScalar(rec.id || rec._id, `rec_${idx}`),
    label: formatCleanScalar(rec.label, `Registro #${idx + 1}`),
    sublabel: formatCleanScalar(rec.sublabel, 'Registro verificado en Somos SST'),
    badge: formatCleanScalar(rec.badge, 'ACTIVO'),
    badgeTone: formatCleanScalar(rec.badgeTone, 'teal'),
    isCritical: Boolean(rec.isCritical),
    fields: cleanFields,
  };
}

/**
 * Construye y normaliza la lista limpia de archivos de evidencia (PDF / PNG / JPG)
 * evitando URLs rotas, campos `undefined` o cadenas base64 crudas.
 */
function normalizeCleanEvidenceFile(rawEv = {}, idx = 0) {
  if (!rawEv || typeof rawEv !== 'object') return null;
  const baseDomain = String(process.env.DOMAIN_CLIENT || 'https://wappy.club').replace(/\/+$/, '');
  const results = [];

  const pushSingle = ({ fileName, url, downloadUrl, absoluteUrl, localPath, fileType, mimeType, kindLabel }) => {
    const safeFile = path.basename(String(fileName || url || '').split('?')[0].trim());
    if (!safeFile || !/\.(pdf|png|jpe?g)$/i.test(safeFile)) return;
    const ext = path.extname(safeFile).toLowerCase().replace('.', '');
    const normalizedType = ext === 'pdf' ? 'pdf' : ext === 'png' ? 'png' : 'jpg';
    const normalizedMime =
      normalizedType === 'pdf'
        ? 'application/pdf'
        : normalizedType === 'png'
          ? 'image/png'
          : 'image/jpeg';
    const cleanRelUrl =
      url && String(url).startsWith('/')
        ? String(url)
        : `/api/sgsst/automatizaciones/evidencias/${safeFile}`;
    const cleanDownloadUrl =
      downloadUrl && String(downloadUrl).startsWith('/')
        ? String(downloadUrl)
        : `${cleanRelUrl}${cleanRelUrl.includes('?') ? '&' : '?'}download=1`;
    const cleanAbsUrl =
      absoluteUrl && /^https?:\/\//i.test(String(absoluteUrl))
        ? String(absoluteUrl)
        : `${baseDomain}${cleanRelUrl}`;

    results.push({
      id: formatCleanScalar(rawEv.id, `ev_${idx}_${normalizedType}_${safeFile.slice(0, 24)}`),
      fileName: safeFile,
      fileType: fileType || normalizedType,
      mimeType: mimeType || normalizedMime,
      url: cleanRelUrl,
      downloadUrl: cleanDownloadUrl,
      absoluteUrl: cleanAbsUrl,
      localPath: localPath ? String(localPath) : '',
      cedula: formatCleanScalar(rawEv.cedula || rawEv.documento, 'N/A'),
      workerName: formatCleanScalar(rawEv.workerName || rawEv.nombre, 'Colaborador'),
      cargo: formatCleanScalar(rawEv.cargo, 'General'),
      portal: formatCleanScalar(rawEv.portal || rawEv.fuente, 'Portal Oficial'),
      title: formatCleanScalar(rawEv.title || kindLabel, 'Certificado / Soporte Oficial'),
    });
  };

  if (rawEv.pdfFileName || (rawEv.url && /\.pdf(\?|$)/i.test(String(rawEv.url))) || rawEv.pdfUrl) {
    pushSingle({
      fileName: rawEv.pdfFileName || rawEv.fileName || rawEv.pdfUrl || rawEv.url,
      url: rawEv.pdfUrl || rawEv.url,
      downloadUrl: rawEv.pdfDownloadUrl || rawEv.downloadUrl,
      absoluteUrl: rawEv.pdfAbsoluteUrl || rawEv.absoluteUrl,
      localPath: rawEv.pdfLocalPath || rawEv.localPath,
      fileType: 'pdf',
      mimeType: 'application/pdf',
      kindLabel: 'Certificado Oficial PDF',
    });
  }

  if (
    rawEv.imageFileName ||
    rawEv.imageUrl ||
    (rawEv.url && /\.(png|jpe?g)(\?|$)/i.test(String(rawEv.url)))
  ) {
    pushSingle({
      fileName: rawEv.imageFileName || rawEv.fileName || rawEv.imageUrl || rawEv.url,
      url: rawEv.imageUrl || rawEv.url,
      downloadUrl: rawEv.imageDownloadUrl || rawEv.downloadUrl,
      absoluteUrl: rawEv.imageAbsoluteUrl || rawEv.absoluteUrl,
      localPath: rawEv.imageLocalPath || rawEv.localPath,
      kindLabel: 'Captura Oficial de Verificación',
    });
  }

  return results;
}

/**
 * Escanea `/uploads/scraper_evidences` buscando certificados PDF/PNG reales descargados
 * previamente para las cédulas de los trabajadores de la empresa activa.
 */
function scanCompanyScraperEvidenceFiles({ workerRecords = [], portalHint = '' } = {}) {
  const candidateDirs = [
    path.resolve(process.cwd(), 'uploads', 'scraper_evidences'),
    '/app/api/uploads/scraper_evidences',
    '/app/uploads/scraper_evidences',
    path.resolve(__dirname, '../../../uploads/scraper_evidences'),
  ];

  const cedulaToWorker = new Map();
  for (const w of workerRecords) {
    const wf = w?.fields || {};
    const rawCed = String(
      wf['Cédula / Documento'] ||
        wf['Número de Documento / Cédula'] ||
        wf['Cédula / Documento de Identidad'] ||
        w?.id ||
        '',
    ).replace(/\D/g, '');
    if (rawCed.length >= 5) {
      cedulaToWorker.set(rawCed, {
        cedula: rawCed,
        workerName: formatCleanScalar(wf['Nombre Completo'] || w?.label, 'Colaborador'),
        cargo: formatCleanScalar(wf['Cargo'] || 'Colaborador', 'Colaborador'),
      });
    }
  }

  const found = [];
  const seenFiles = new Set();

  for (const dir of candidateDirs) {
    if (!fs.existsSync(dir)) continue;
    let entries = [];
    try {
      entries = fs.readdirSync(dir);
    } catch (_) {
      continue;
    }
    for (const fname of entries) {
      if (seenFiles.has(fname)) continue;
      if (!/^[a-zA-Z0-9._-]+\.(pdf|png|jpe?g)$/i.test(fname)) continue;

      let matchedWorker = null;
      for (const [ced, wInfo] of cedulaToWorker.entries()) {
        if (fname.includes(ced)) {
          matchedWorker = wInfo;
          break;
        }
      }
      if (!matchedWorker) continue;

      if (portalHint) {
        const lowName = fname.toLowerCase();
        if (portalHint === 'arl' && !/(arl|sura|positiva|colmena|bolivar)/i.test(lowName)) continue;
        if (portalHint === 'vial_pesv' && !/(simit|runt|vial|pesv)/i.test(lowName)) continue;
        if (portalHint === 'antecedentes' && !/(rama|judicial|contraloria|antecedentes|policia)/i.test(lowName)) continue;
        if (portalHint === 'alto_riesgo' && !/(mintrabajo|sena|alturas|constancia)/i.test(lowName)) continue;
      }

      seenFiles.add(fname);
      const isPdf = /\.pdf$/i.test(fname);
      const normalized = normalizeCleanEvidenceFile(
        {
          fileName: fname,
          pdfFileName: isPdf ? fname : null,
          imageFileName: !isPdf ? fname : null,
          localPath: path.resolve(dir, fname),
          cedula: matchedWorker.cedula,
          workerName: matchedWorker.workerName,
          cargo: matchedWorker.cargo,
          portal: portalHint || 'Portal Oficial Verificado',
          title: isPdf ? `Certificado Oficial PDF (CC ${matchedWorker.cedula})` : `Soporte Oficial PNG (CC ${matchedWorker.cedula})`,
        },
        found.length,
      );
      if (Array.isArray(normalized)) {
        found.push(...normalized);
      }
    }
  }
  return found;
}

/**
 * Guarda en disco (`uploads/scraper_evidences`) un certificado PDF o captura PNG en vivo
 * y devuelve entradas limpias listas para `evidenceFiles`.
 */
function persistInspectorEvidenceToDisk({
  pdfBase64,
  pdfFileName,
  imageBase64,
  imageFileName,
  cedula,
  workerName,
  cargo,
  portalLabel,
  title,
} = {}) {
  if (!pdfBase64 && !imageBase64) return [];
  try {
    const evidencesDir = path.resolve(process.cwd(), 'uploads', 'scraper_evidences');
    fs.mkdirSync(evidencesDir, { recursive: true });

    const stripDataUri = (raw) => {
      if (!raw || typeof raw !== 'string') return '';
      const trimmed = raw.trim();
      const idx = trimmed.indexOf(',');
      return trimmed.startsWith('data:') && idx > -1 ? trimmed.slice(idx + 1).trim() : trimmed;
    };

    const slugify = (val, maxLen = 40) =>
      String(val || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\.(pdf|png|jpe?g)$/i, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, maxLen);

    const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const prefix = [slugify(portalLabel, 20), slugify(cedula || workerName, 20)].filter(Boolean).join('_') || 'certificado';

    let savedPdfName = null;
    let pdfLocalPath = null;
    if (pdfBase64 && typeof pdfBase64 === 'string') {
      const cleanB64 = stripDataUri(pdfBase64);
      if (cleanB64.length > 100) {
        const buf = Buffer.from(cleanB64, 'base64');
        const head = buf.subarray(0, 16).toString('ascii');
        if (buf.length > 200 && head.includes('%PDF')) {
          savedPdfName = `${slugify(pdfFileName, 44) || `certificado_${prefix}`}_${suffix}.pdf`;
          pdfLocalPath = path.resolve(evidencesDir, savedPdfName);
          fs.writeFileSync(pdfLocalPath, buf);
        }
      }
    }

    let savedImgName = null;
    let imageLocalPath = null;
    if (imageBase64 && typeof imageBase64 === 'string') {
      const cleanB64 = stripDataUri(imageBase64);
      if (cleanB64.length > 100) {
        const buf = Buffer.from(cleanB64, 'base64');
        if (buf.length > 200) {
          const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
          const ext = isJpg ? 'jpg' : 'png';
          savedImgName = `${slugify(imageFileName, 44) || `soporte_${prefix}`}_${suffix}.${ext}`;
          imageLocalPath = path.resolve(evidencesDir, savedImgName);
          fs.writeFileSync(imageLocalPath, buf);
        }
      }
    }

    return (
      normalizeCleanEvidenceFile(
        {
          pdfFileName: savedPdfName,
          pdfLocalPath,
          imageFileName: savedImgName,
          imageLocalPath,
          cedula,
          workerName,
          cargo,
          portal: portalLabel,
          title: title || 'Certificado Oficial Verificado en Vivo',
        },
        0,
      ) || []
    );
  } catch (_) {
    return [];
  }
}

/**
 * Carga o recupera de forma segura un modelo Mongoose, incluyendo aquellos
 * que se registran dinámicamente dentro de los archivos de ruta de Somos SST.
 */
function getSafeModel(modelName, routeRequirePath = null, modelRequirePath = null) {
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }
  if (modelRequirePath) {
    try {
      const m = require(modelRequirePath);
      if (mongoose.models[modelName]) return mongoose.models[modelName];
      if (m && m.modelName === modelName) return m;
      if (m && m[modelName]) return m[modelName];
    } catch (_) {}
  }
  if (routeRequirePath) {
    try {
      require(routeRequirePath);
      if (mongoose.models[modelName]) return mongoose.models[modelName];
    } catch (_) {}
  }
  return mongoose.models[modelName] || null;
}

/**
 * Resuelve la empresa activa del usuario (o una empresa explícita por ID).
 */
async function resolveTargetCompany(userId, explicitCompanyId = null) {
  try {
    if (explicitCompanyId && explicitCompanyId !== 'default' && explicitCompanyId !== 'SYSTEM_PRESET') {
      if (mongoose.Types.ObjectId.isValid(String(explicitCompanyId))) {
        const byId = await CompanyInfo.findById(explicitCompanyId).lean();
        if (byId) return byId;
      }
    }
    if (userId) {
      const active = await CompanyInfo.findOne({ user: String(userId), isActive: true }).lean();
      if (active) return active;
      const first = await CompanyInfo.findOne({ user: String(userId) }).sort({ updatedAt: -1 }).lean();
      if (first) return first;
    }
  } catch (_) {}
  return null;
}

/**
 * Construye un filtro MongoDB compatible tanto con esquemas que guardan companyId como ObjectId
 * como aquellos que lo guardan como String, con fallback seguro por usuario.
 */
function buildCompanyScopeFilter(userId, company) {
  const companyIdStr = company?._id ? String(company._id) : null;
  const companyVariants = [];
  if (companyIdStr) {
    companyVariants.push(companyIdStr);
    if (mongoose.Types.ObjectId.isValid(companyIdStr)) {
      companyVariants.push(new mongoose.Types.ObjectId(companyIdStr));
    }
  }
  if (companyVariants.length > 0) {
    return { companyId: { $in: companyVariants } };
  }
  if (userId) {
    const userVariants = [String(userId)];
    if (mongoose.Types.ObjectId.isValid(String(userId))) {
      userVariants.push(new mongoose.Types.ObjectId(String(userId)));
    }
    return { user: { $in: userVariants } };
  }
  return {};
}

/**
 * Busca el documento único de un aplicativo para la empresa activa (con aislamiento estricto multi-empresa).
 * Cuando `company._id` existe, exige filtro exacto por `companyId` SIN caer jamás en documentos sin `companyId`.
 */
async function findSingleCompanyDoc(Model, userId, company) {
  if (!Model) return null;
  try {
    const companyFilter = buildCompanyScopeFilter(userId, company);
    if (!companyFilter || Object.keys(companyFilter).length === 0) return null;
    const doc = await Model.findOne(companyFilter).sort({ updatedAt: -1 }).lean();
    return doc || null;
  } catch (_) {
    return null;
  }
}

/**
 * Busca múltiples documentos de un aplicativo para la empresa activa (con aislamiento estricto multi-empresa).
 * Cuando `company._id` existe, exige filtro exacto por `companyId` SIN caer jamás en documentos sin `companyId`.
 */
async function findManyCompanyDocs(Model, userId, company, sortObj = { updatedAt: -1 }, limit = 300) {
  if (!Model) return [];
  try {
    const companyFilter = buildCompanyScopeFilter(userId, company);
    if (!companyFilter || Object.keys(companyFilter).length === 0) return [];
    const docs = await Model.find(companyFilter).sort(sortObj).limit(limit).lean();
    return Array.isArray(docs) ? docs : [];
  } catch (_) {
    return [];
  }
}

/**
 * Normaliza cualquier identificador de nodo del lienzo hacia su ID canónico de aplicativo o equipo.
 */
function normalizeInspectorNodeId(rawId) {
  let clean = String(rawId || '').trim();
  if (/^trigger_trigger_/.test(clean)) {
    clean = clean.replace(/^trigger_/, '');
  } else if (
    !/^trigger_(tenshi|antigravity|antigravity_local|antigravity_cloud|email|agent|qr_worker|qr_report|webhook|whatsapp)$/.test(
      clean,
    )
  ) {
    clean = clean.replace(
      /^(trigger_|extractor_|ext_|hito_|out_|output_|action_|tool_inputs_|tool_hitos_|sub_memory_|sub_tool_|sub_skill_|sub_rule_|logic_node_)/,
      '',
    );
  }

  if (/^(extra_agent_\d+|agent_extra_\d+)$/.test(clean)) {
    return 'agent_root';
  }

  const aliasMap = {
    // Disparadores (Equipo 1)
    trigger_root: 'schedule_cron',
    root: 'schedule_cron',
    drive_folder_watch: 'schedule_cron',
    drive_watch: 'schedule_cron',
    sgsst_db_audit: 'schedule_cron',
    sst_deadline_watch: 'schedule_cron',
    gmail_inbox_watch: 'trigger_email',
    gmail_watch: 'trigger_email',
    webhook_event: 'trigger_webhook',
    tenshi: 'trigger_tenshi',
    antigravity: 'trigger_antigravity',
    antigravity_local: 'trigger_antigravity',
    trigger_antigravity_local: 'trigger_antigravity',
    antigravity_cloud: 'trigger_antigravity_cloud',
    email: 'trigger_email',
    email_inbound: 'trigger_email',
    trigger_email_inbound: 'trigger_email',
    agent: 'trigger_agent',
    ai_agent: 'trigger_agent',
    trigger_ai_agent: 'trigger_agent',
    qr_worker: 'trigger_qr_worker',
    qr_report: 'trigger_qr_worker',
    trigger_qr_report: 'trigger_qr_worker',
    webhook: 'trigger_webhook',
    whatsapp: 'trigger_whatsapp',

    // Nodo Agente Principal y Nodos Lógicos (Equipo 3)
    ai_agent_root: 'agent_root',
    agent_primary: 'agent_root',
    main_agent: 'agent_root',
    if_condition: 'if_router',
    if_node_router: 'if_router',
    logic_if: 'if_router',
    logic_switch: 'if_router',
    switch_router: 'if_router',
    logic_loop: 'loop',
    batch_loop: 'loop',
    split_in_batches: 'loop',
    logic_merge: 'merge',
    join_branches: 'merge',
    logic_human_approval: 'human_approval',
    hitl_approval: 'human_approval',
    aprobacion_humana: 'human_approval',
    logic_filter: 'filter',

    // Los 8 Hitos — 50 Apps SST (Equipo 6 + Aliases Canónicos)
    contexto_organizacion: 'hito1_dofa',
    diagnostico: 'hito1_diagnostico_0312',
    extract_0312_gaps: 'hito1_diagnostico_0312',
    '0312_gaps': 'hito1_diagnostico_0312',
    responsable: 'hito1_responsable',
    politica: 'hito1_politica_objetivos',
    hito1_politica: 'hito1_politica_objetivos',
    objetivos: 'hito1_objetivos',
    legal: 'hito1_matriz_legal',
    matriz_legal: 'hito1_matriz_legal',
    wappy_memory_legal: 'hito1_matriz_legal',
    memory_legal: 'hito1_matriz_legal',
    rhs: 'hito1_rhs',
    hito1_reglamento_higiene: 'hito1_rhs',
    rit: 'hito1_rit',
    participacion_ipevar: 'hito1_participacion_ipevar',
    hito4_participacion_ipevar: 'hito1_participacion_ipevar',
    matriz_ipevar_oficial: 'hito2_matriz_ipevar',
    matriz_ipevar: 'hito2_matriz_ipevar',
    hito3_gtc45_ipvr: 'hito2_matriz_ipevar',
    gtc45_ipvr: 'hito2_matriz_ipevar',
    extract_gtc45_risks: 'hito2_matriz_ipevar',
    gtc45_risks: 'hito2_matriz_ipevar',
    matriz_pesv_oficial: 'hito3_matriz_pesv',
    matriz_pesv: 'hito3_matriz_pesv',
    matriz_compatibilidad_oficial: 'hito3_quimicos_sga',
    matriz_compatibilidad: 'hito3_quimicos_sga',
    oportunidades_sst: 'hito1_oportunidades_sst',
    hito1_oportunidades: 'hito1_oportunidades_sst',
    vulnerabilidad: 'hito6_vulnerabilidad',
    hito4_vulnerabilidad_amenazas: 'hito6_vulnerabilidad',
    plan_emergencias: 'hito1_plan_emergencias',
    hito4_plan_emergencias: 'hito1_plan_emergencias',
    hito6_emergencias: 'hito1_plan_emergencias',
    perfil_cargo: 'hito2_perfiles_cargo',
    somos_sst_perfiles_cargo: 'hito2_perfiles_cargo',
    perfil_socio: 'hito2_perfil_socio',
    perfil_sociodemografico: 'hito2_perfil_socio',
    hito2_sociodemografico: 'hito2_perfil_socio',
    sociodemografico: 'hito2_perfil_socio',
    extract_sst_workers: 'hito2_perfil_socio',
    somos_sst_trabajadores: 'hito2_perfil_socio',
    condiciones_salud: 'hito2_condiciones_salud',
    somos_sst_examenes: 'hito2_condiciones_salud',
    oraculo_predictivo: 'hito2_oraculo_predictivo',
    hito2_compatibilidad_cargo: 'hito2_oraculo_predictivo',
    copasst: 'hito4_comites',
    comites: 'hito4_comites',
    cocolab: 'hito3_cocolab',
    convivencia: 'hito3_cocolab',
    comite_pesv: 'hito3_comite_pesv',
    brigada_emergencias: 'hito3_brigada_emergencias',
    hito4_brigada_emergencias: 'hito3_brigada_emergencias',
    peligros: 'hito4_bio_ipevar',
    metodo_owas: 'hito3_owas',
    hito4_ergonomia_owas: 'hito3_owas',
    estudio_puesto: 'hito3_estudio_puesto',
    hito4_estudio_puesto: 'hito3_estudio_puesto',
    animo: 'hito4_psicosocial',
    consultar_analitica_psicosocial: 'hito4_psicosocial',
    compras_sst: 'hito5_compras_sst',
    contratistas_proveedores: 'hito5_contratistas',
    gestion_cambio: 'hito5_gestion_cambio',
    analisis_trabajo_seguro: 'hito3_ats',
    hito5_ats_permisos: 'hito3_ats',
    permiso_alturas: 'hito3_alturas',
    heights_lifecycle: 'hito5_equipos_alturas',
    epp_delivery: 'hito3_epp',
    somos_sst_epp: 'hito3_epp',
    hito6_inspecciones_epp: 'hito3_epp',
    inspecciones_epp: 'hito3_epp',
    chemical_registry: 'hito5_registro_quimico',
    hito3_quimicos: 'hito5_registro_quimico',
    extract_chemical_inventory: 'hito5_registro_quimico',
    chemical_inventory: 'hito5_registro_quimico',
    vehicles_pesv: 'hito3_vehiculos',
    extract_pesv_vehicles: 'hito3_vehiculos',
    pesv_vehicles: 'hito3_vehiculos',
    custom_scraper_agy_alto_riesgo: 'scraper_agy_alto_riesgo',
    custom_scraper_agy_antecedentes: 'scraper_agy_antecedentes',
    custom_scraper_agy_arl: 'scraper_agy_arl_directo',
    custom_scraper_agy_pensiones: 'scraper_agy_pensiones_directo',
    custom_scraper_agy_salud_rethus: 'scraper_agy_salud_rethus',
    custom_scraper_agy_vial_pesv: 'scraper_agy_vial_pesv',
    search_node_realtime: 'extract_web_search',
    search_node_live_web: 'extract_web_search',
    equipos_emergencia: 'hito5_equipos_emergencia',
    hito5_inspecciones: 'hito5_equipos_emergencia',
    comunicaciones_sst: 'hito6_comunicaciones_sst',
    capacitaciones: 'hito5_capacitaciones',
    hito6_capacitaciones: 'hito5_capacitaciones',
    hito5_capacitacion_lms: 'hito5_capacitaciones',
    capacitacion_lms: 'hito5_capacitaciones',
    ruta_aprendizaje: 'hito6_ruta_aprendizaje',
    cursos_lms: 'hito6_ruta_aprendizaje',
    reporte_actos: 'hito4_actos_condiciones',
    extract_inspections_findings: 'hito4_actos_condiciones',
    inspections_findings: 'hito4_actos_condiciones',
    consultar_analitica_actos_condiciones: 'hito4_actos_condiciones',
    simulacros_emergencia: 'hito6_simulacros_emergencia',
    app_builder: 'hito6_app_builder',
    hito6_cultura_preventiva: 'hito6_app_builder',
    estadisticas: 'hito7_estadisticas_atel',
    hito6_indicadores_atel: 'hito7_estadisticas_atel',
    investigacion_atel: 'hito7_investigacion_atel',
    hito5_investigacion_atel: 'hito7_investigacion_atel',
    extract_atel_cases: 'hito7_investigacion_atel',
    atel_cases: 'hito7_investigacion_atel',
    control_acpm: 'hito7_acpm',
    acpm: 'hito7_acpm',
    acpm_task: 'hito7_acpm',
    tarea_kanban: 'hito7_acpm',
    hito2_cronograma: 'hito7_acpm',
    hito4_plan_anual: 'hito7_acpm',
    plan_anual: 'hito7_acpm',
    extract_annual_tasks: 'hito7_acpm',
    annual_tasks: 'hito7_acpm',
    auditoria: 'hito7_auditoria',
    hito6_auditoria_anual: 'hito7_auditoria',
    hito7_atel_auditoria: 'hito7_auditoria',
    atel_auditoria: 'hito7_auditoria',
    alta_direccion: 'hito7_alta_direccion',
    hito6_revision_direccion: 'hito7_alta_direccion',
    investigacion_profunda: 'hito7_investigacion_profunda',
    predictivo: 'hito8_predictivo',
    somos_sst_empresa: 'tool_sst_company',
    memory_company_profile: 'tool_sst_company',
    wappy_memory_company: 'tool_sst_company',
    sub_memory: 'tool_sst_company',
    wappy_memory_history: 'wappy_memory_antiduplicate',
    memory_history: 'wappy_memory_antiduplicate',
    wappy_memory_rag: 'wappy_rag_documental',
    memory_rag: 'wappy_rag_documental',
    briefing_voz_tenshi: 'tenshi_voice_briefing',
    voice_briefing: 'tenshi_voice_briefing',
    documento_vivo: 'canvas_doc',
    respaldo_drive: 'drive_backup',
  };

  return aliasMap[clean] || clean;
}

/**
 * Limpia etiquetas HTML dejando texto plano legible (solo para resúmenes `preview`, sin mutar el HTML original).
 */
function stripHtmlToText(rawHtml = '') {
  return String(rawHtml || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrae el contenido crudo íntegro (HTML o Markdown) de un documento `Message` de LibreChat sin truncar.
 */
function extractRawMessageContent(msg) {
  if (!msg || typeof msg !== 'object') return '';
  if (typeof msg.text === 'string' && msg.text.trim().length > 0) {
    return msg.text;
  }
  if (Array.isArray(msg.content)) {
    const joined = msg.content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        return '';
      })
      .filter(Boolean)
      .join('\n');
    if (joined.trim().length > 0) return joined;
  }
  return '';
}

/**
 * Extrae las secciones reales (`<h1>`/`<h2>`/`<h3>`) y filas de tablas (`<tr>`) del HTML completo
 * de un informe oficial SIN truncar a 600 caracteres.
 */
function extractHtmlSectionsFromReport(rawHtml = '') {
  const src = String(rawHtml || '');
  if (!src.trim()) return { headings: [], tableRows: [], structuredText: '' };

  const cleanBlock = (s) => stripHtmlToText(s);
  const headings = [];
  const headingRegex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi;
  let hm;
  while ((hm = headingRegex.exec(src)) !== null && headings.length < 60) {
    const t = cleanBlock(hm[1]);
    if (t) headings.push(t);
  }

  // Extraer bloques por capítulos h2/h3 con su texto asociado
  const chapterParts = [];
  const sectionSplitRegex = /(<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>)/gi;
  const tokens = src.split(sectionSplitRegex);
  for (let i = 1; i < tokens.length; i += 2) {
    const hTitle = cleanBlock(tokens[i]);
    const bodyTxt = cleanBlock(tokens[i + 1] || '');
    if (hTitle) {
      chapterParts.push(bodyTxt ? `[${hTitle}]: ${bodyTxt}` : `[${hTitle}]`);
    }
  }

  const tableRows = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trm;
  while ((trm = trRegex.exec(src)) !== null && tableRows.length < 80) {
    const cells = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cm;
    while ((cm = cellRegex.exec(trm[1])) !== null) {
      const ct = cleanBlock(cm[1]);
      if (ct) cells.push(ct);
    }
    if (cells.length > 0) {
      tableRows.push(cells.join(' | '));
    }
  }

  const structuredText =
    chapterParts.length > 0
      ? chapterParts.join(' || ')
      : tableRows.length > 0
        ? tableRows.join(' || ')
        : cleanBlock(src);

  return {
    headings,
    tableRows,
    structuredText,
  };
}

/**
 * Empaqueta un reporte HTML embebido en un modelo Mongoose con la misma firma íntegra de `latestReports`.
 */
function buildEmbeddedReportEntry({ conversationId, title, html, tags = [], createdAt = null }) {
  const rawHtml = typeof html === 'string' ? html.trim() : '';
  if (!rawHtml || rawHtml.length < 15) return null;
  const cleanPreview = stripHtmlToText(rawHtml).slice(0, 600);
  const ts = createdAt || null;
  return {
    conversationId: String(conversationId || `embedded_${Date.now()}`),
    title: String(title || 'Informe Oficial SG-SST'),
    tags: Array.isArray(tags) ? tags : [],
    html: rawHtml,
    charCount: rawHtml.length,
    preview: cleanPreview,
    createdAt: ts,
    updatedAt: ts,
  };
}

/**
 * Fusiona reportes del historial de conversaciones con reportes embebidos en documentos Mongoose sin perder HTML ni duplicar.
 */
function mergeLatestReports(tagReports = [], embeddedCandidates = []) {
  const merged = [];
  const seenIds = new Set();
  const seenSignatures = new Set();

  for (const r of [...(Array.isArray(tagReports) ? tagReports : []), ...(Array.isArray(embeddedCandidates) ? embeddedCandidates : [])]) {
    if (!r || typeof r !== 'object') continue;
    const htmlStr = typeof r.html === 'string' ? r.html : '';
    const cid = String(r.conversationId || '').trim();
    if (cid && seenIds.has(cid)) continue;
    const sig = htmlStr ? `${htmlStr.length}::${stripHtmlToText(htmlStr).slice(0, 180)}` : '';
    if (sig && seenSignatures.has(sig)) continue;
    if (cid) seenIds.add(cid);
    if (sig) seenSignatures.add(sig);
    merged.push({
      conversationId: cid || `rep_${merged.length + 1}`,
      title: r.title || 'Informe Oficial SG-SST',
      tags: Array.isArray(r.tags) ? r.tags : [],
      html: htmlStr,
      charCount: typeof r.charCount === 'number' ? r.charCount : htmlStr.length,
      preview: typeof r.preview === 'string' ? r.preview : stripHtmlToText(htmlStr).slice(0, 600),
      createdAt: r.createdAt || r.updatedAt || null,
      updatedAt: r.updatedAt || r.createdAt || null,
    });
  }
  return merged;
}

/**
 * Consulta los últimos informes guardados en Conversation / Message para unas etiquetas dadas,
 * con aislamiento estricto por `companyId` y preservando el HTML íntegro completo (`html`, `charCount`).
 */
async function fetchLatestReportsForTags(userId, company, tags = [], limit = 5) {
  if (!Array.isArray(tags) || tags.length === 0 || !userId) return [];
  try {
    const Conversation = getSafeModel('Conversation', null, '~/models/Conversation');
    const Message = getSafeModel('Message', null, '~/models/Message');
    if (!Conversation) return [];

    const companyIdStr = company?._id ? String(company._id) : null;
    let convos = [];

    if (companyIdStr) {
      const strictQuery = {
        user: String(userId),
        $and: [
          { tags: { $in: tags } },
          { $or: [{ tags: `company-${companyIdStr}` }, { tags: `company_${companyIdStr}` }] },
        ],
      };
      convos = await Conversation.find(strictQuery).sort({ updatedAt: -1 }).limit(limit).lean();

      // Único fallback legado seguro: conversaciones SIN ningún tag `company-*` de otra empresa
      // Y cuyo título o HTML mencione de forma exacta el NIT o la razón social de la empresa activa.
      if (!convos || convos.length === 0) {
        const cleanNit = String(company?.nit || '').trim();
        const cleanNitDigits = cleanNit.replace(/[^0-9]/g, '');
        const cleanCompanyName = String(company?.companyName || '').trim().toLowerCase();
        const hasVerifiableIdentity = cleanNitDigits.length >= 5 || cleanCompanyName.length >= 4;

        if (hasVerifiableIdentity) {
          const untaggedConvos = await Conversation.find({
            user: String(userId),
            $and: [
              { tags: { $in: tags } },
              { tags: { $not: /^company[-_]/i } },
            ],
          })
            .sort({ updatedAt: -1 })
            .limit(Math.max(limit * 3, 10))
            .lean();

          const verifiedConvos = [];
          for (const cand of untaggedConvos || []) {
            let rawMsgHtml = '';
            if (Message && cand.conversationId) {
              const candMsgs = await Message.find({ conversationId: cand.conversationId })
                .sort({ createdAt: -1 })
                .limit(4)
                .lean();
              const assistantMsg =
                (candMsgs || []).find((m) => !m.isCreatedByUser && extractRawMessageContent(m)) ||
                candMsgs?.[0];
              rawMsgHtml = extractRawMessageContent(assistantMsg);
            }
            const haystack = `${cand.title || ''}\n${rawMsgHtml}`;
            const haystackLow = haystack.toLowerCase();
            const matchesNit =
              (cleanNit.length >= 5 && haystack.includes(cleanNit)) ||
              (cleanNitDigits.length >= 6 && haystack.replace(/[^0-9]/g, '').includes(cleanNitDigits));
            const matchesName =
              cleanCompanyName.length >= 4 && haystackLow.includes(cleanCompanyName);

            if (matchesNit || matchesName) {
              verifiedConvos.push({ ...cand, _prefetchedHtml: rawMsgHtml });
              if (verifiedConvos.length >= limit) break;
            }
          }
          convos = verifiedConvos;
        } else {
          convos = [];
        }
      }
    } else {
      convos = await Conversation.find({
        user: String(userId),
        tags: { $in: tags },
      })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();
    }

    const results = [];
    for (const c of convos || []) {
      let rawContent = typeof c._prefetchedHtml === 'string' ? c._prefetchedHtml : '';
      if (!rawContent && Message && c.conversationId) {
        const msgs = await Message.find({ conversationId: c.conversationId })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();
        const assistantMsg =
          (msgs || []).find((m) => !m.isCreatedByUser && extractRawMessageContent(m)) ||
          msgs?.[0];
        rawContent = extractRawMessageContent(assistantMsg);
      }
      const html = String(rawContent || '');
      const textPreview = stripHtmlToText(html).slice(0, 600);

      results.push({
        conversationId: c.conversationId,
        title: c.title || 'Informe Oficial SG-SST',
        tags: Array.isArray(c.tags) ? c.tags : [],
        html,
        charCount: html.length,
        preview: textPreview,
        createdAt: c.createdAt || c.updatedAt || null,
        updatedAt: c.updatedAt || c.createdAt || null,
      });
    }
    return results;
  } catch (_) {
    return [];
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INSPECTORES EN VIVO DE HITOS 1 Y 2 (19 APLICATIVOS + EMPRESA ACTIVA)
 * ═══════════════════════════════════════════════════════════════════════════
 */
async function inspectHito1And2(canonicalId, userId, company, nodeConfig = {}) {
  const companyName = company?.companyName || 'Empresa Activa';

  // 0. Contexto de Empresa Activa (tool_sst_company)
  if (canonicalId === 'tool_sst_company') {
    if (!company) {
      return {
        moduleTitle: 'Ficha Técnica de la Empresa Activa (Somos SST)',
        sourceCollection: 'CompanyInfo',
        kpis: [{ label: 'Empresa Activa', value: 'Sin seleccionar', tone: 'amber' }],
        latestReports: [],
        records: [],
      };
    }
    const sedesCount = Array.isArray(company?.sedes) ? company.sedes.length : 0;
    const dept = company?.departamento || company?.department || '';
    const fields = {
      companyName: company?.companyName || '',
      nit: company?.nit || '',
      ciiu: company?.ciiu || company?.ciiuCode || '',
      economicActivity: company?.economicActivity || '',
      riskLevel: company?.riskLevel || '',
      arl: company?.arl || '',
      workerCount: company?.workerCount ?? 0,
      address: company?.address || '',
      city: company?.city || '',
      department: dept,
      legalRepresentative: company?.legalRepresentative || '',
      legalRepresentativeId: company?.legalRepresentativeId || '',
      responsibleSST: company?.responsibleSST || '',
      licenseNumber: company?.licenseNumber || '',
      formationLevel: company?.formationLevel || '',
      licenseExpiry: company?.licenseExpiry || '',
      courseStatus: company?.courseStatus || '',
      'Razón Social': company?.companyName || 'Sin definir',
      'NIT': company?.nit || 'Sin definir',
      'Actividad Económica y CIIU': `${company?.economicActivity || ''} (CIIU ${company?.ciiu || 'N/A'})`,
      'Clase de Riesgo ARL': `Riesgo ${company?.riskLevel || 'N/A'}`,
      'ARL Afiliada': company?.arl || 'Sin definir',
      'N° de Trabajadores': String(company?.workerCount || 0),
      'Representante Legal': `${company?.legalRepresentative || ''} (CC ${company?.legalRepresentativeId || ''})`,
      'Responsable SG-SST': `${company?.responsibleSST || ''} (Lic. ${company?.licenseNumber || 'N/A'})`,
      'Ciudad, Departamento y Dirección': `${company?.city || ''}${dept ? ` (${dept})` : ''} - ${company?.address || ''}`,
      'Sedes y Centros de Trabajo': sedesCount > 0 ? company.sedes.map((s) => s.nombre || s.city).join(', ') : 'Sede Principal',
    };
    return {
      moduleTitle: 'Ficha Técnica de la Empresa Activa (Somos SST)',
      sourceCollection: 'CompanyInfo',
      latestReports: [],
      kpis: [
        { label: 'Empresa Activa', value: companyName, tone: 'teal' },
        { label: 'NIT', value: company?.nit || 'Pendiente', tone: 'indigo' },
        { label: 'ARL / Riesgo', value: `${company?.arl || 'ARL'} · Riesgo ${company?.riskLevel || 'I'}`, tone: 'amber' },
        { label: 'Trabajadores / Sedes', value: `${company?.workerCount || 0} trab. · ${Math.max(1, sedesCount)} sede(s)`, tone: 'emerald' },
      ],
      records: [
        {
          id: String(company?._id || 'company_active'),
          label: `${companyName} (NIT: ${company?.nit || 'N/A'})`,
          sublabel: `Rep. Legal: ${company?.legalRepresentative || 'N/A'} • Resp. SST: ${company?.responsibleSST || 'N/A'}`,
          badge: `Riesgo ${company?.riskLevel || 'I'} • ${company?.arl || 'ARL'}`,
          badgeTone: 'emerald',
          isCritical: false,
          fields,
        },
      ],
    };
  }

  // 1. Hito 1 · Contexto y Partes Interesadas (DOFA / Stakeholders)
  if (canonicalId === 'hito1_dofa') {
    const ContextoData = getSafeModel('ContextoData', '~/server/routes/sgsst/contexto', '~/models/ContextoData');
    const doc = await findSingleCompanyDoc(ContextoData, userId, company);
    const rawDofaList = Array.isArray(doc?.dofaList) ? doc.dofaList : [];
    const internalFactors = Array.isArray(doc?.internalFactors) ? doc.internalFactors : [];
    const externalFactors = Array.isArray(doc?.externalFactors) ? doc.externalFactors : [];
    const dofaList =
      rawDofaList.length > 0
        ? rawDofaList
        : [
            ...internalFactors.map((f) => ({ ...f, source: f.source || 'interno' })),
            ...externalFactors.map((f) => ({ ...f, source: f.source || 'externo' })),
          ];
    const stakeholders = Array.isArray(doc?.stakeholders) ? doc.stakeholders : [];
    const cross = doc?.crossStrategies || {};
    const foArr = Array.isArray(cross.fo) ? cross.fo : cross.fo ? [cross.fo] : [];
    const doArr = Array.isArray(cross.do) ? cross.do : cross.do ? [cross.do] : [];
    const faArr = Array.isArray(cross.fa) ? cross.fa : cross.fa ? [cross.fa] : [];
    const daArr = Array.isArray(cross.da) ? cross.da : cross.da ? [cross.da] : [];
    const totalStrategies = foArr.length + doArr.length + faArr.length + daArr.length;

    const tagReports = await fetchLatestReportsForTags(userId, company, ['sgsst-contexto-dofa', 'sgsst-contexto'], 5);
    const latestReports = mergeLatestReports(tagReports, [
      buildEmbeddedReportEntry({
        conversationId: doc?.conversationId || `embedded_contexto_${company?._id || 'active'}`,
        title: 'Informe Oficial Contexto Organizacional y Matriz DOFA SST',
        html: doc?.lastGeneratedReport,
        tags: ['sgsst-contexto-dofa'],
        createdAt: doc?.updatedAt,
      }),
    ]);

    const crossSummaryFields = {
      'crossStrategies.fo': foArr.join(' | '),
      'crossStrategies.do': doArr.join(' | '),
      'crossStrategies.fa': faArr.join(' | '),
      'crossStrategies.da': daArr.join(' | '),
      'Estrategias CAME FO (Ofensivas)': foArr.join(' | '),
      'Estrategias CAME DO (Reorientación)': doArr.join(' | '),
      'Estrategias CAME FA (Defensivas)': faArr.join(' | '),
      'Estrategias CAME DA (Supervivencia)': daArr.join(' | '),
    };

    const crossRecords = [];
    for (const [quadKey, quadLabel, arr] of [
      ['fo', 'FO (Fortalezas + Oportunidades)', foArr],
      ['do', 'DO (Debilidades + Oportunidades)', doArr],
      ['fa', 'FA (Fortalezas + Amenazas)', faArr],
      ['da', 'DA (Debilidades + Amenazas)', daArr],
    ]) {
      arr.forEach((strat, idx) => {
        const stratText = typeof strat === 'string' ? strat : strat?.strategy || strat?.description || strat?.accion || JSON.stringify(strat);
        const isDaOrDo = quadKey === 'da' || quadKey === 'do';
        crossRecords.push({
          id: `came_${quadKey}_${idx}`,
          label: `[Estrategia Cruzada CAME ${quadKey.toUpperCase()}] ${stratText}`,
          sublabel: `Cuadrante: ${quadLabel}`,
          badge: `CAME ${quadKey.toUpperCase()}`,
          badgeTone: isDaOrDo ? 'amber' : 'purple',
          isCritical: quadKey === 'da',
          fields: {
            quadrant: quadKey.toUpperCase(),
            strategy: stratText,
            ...crossSummaryFields,
          },
        });
      });
    }

    const records = [
      ...dofaList.map((d, i) => {
        const isCrit = d.type === 'debilidad' || d.type === 'amenaza';
        return {
          id: d.id || `dofa_${i}`,
          label: `[DOFA: ${String(d.type || '').toUpperCase()}] ${d.description || ''}`,
          sublabel: `Categoría: ${d.category || 'SST'} • Origen: ${d.originModule || d.source || 'Interno'} • Resp: ${d.responsible || 'SG-SST'}`,
          badge: `Impacto ${String(d.impact || 'alto').toUpperCase()}`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            type: d.type || '',
            source: d.source || (d.type === 'fortaleza' || d.type === 'debilidad' ? 'interno' : 'externo'),
            category: d.category || '',
            originModule: d.originModule || '',
            description: d.description || '',
            impact: d.impact || '',
            strategicAction: d.strategicAction || '',
            responsible: d.responsible || '',
            status: d.status || '',
            sentToKanban: Boolean(d.sentToKanban),
            ...crossSummaryFields,
            'Factor DOFA (Fortaleza / Debilidad / Oportunidad / Amenaza)': String(d.type || '').toUpperCase(),
            'Descripción del Factor DOFA': d.description || '',
            'Origen (Interno / Externo)': d.source || '',
            'Categoría PESTEL': d.category || '',
            'Módulo de Origen': d.originModule || '',
            'Nivel de Impacto': d.impact || '',
            'Acción Estratégica CAME': d.strategicAction || '',
            'Responsable': d.responsible || '',
            'Estado': d.status || '',
            'Enviado a Kanban ACPM': d.sentToKanban ? 'Sí' : 'No',
            'Fortalezas Internas SST (F)': d.type === 'fortaleza' ? d.description : '',
            'Debilidades Internas SST (D)': d.type === 'debilidad' ? d.description : '',
            'Oportunidades Externas SST (O)': d.type === 'oportunidad' ? d.description : '',
            'Amenazas Externas SST (A)': d.type === 'amenaza' ? d.description : '',
          },
        };
      }),
      ...stakeholders.map((s, i) => ({
        id: s.id || `stk_${i}`,
        label: `[Parte Interesada: ${s.parte || 'Stakeholder'}] (${s.type || 'Interno'})`,
        sublabel: `Necesidades: ${s.necesidades || ''} • Canal: ${s.communicationChannel || ''} (${s.frequency || 'Mensual'})`,
        badge: `Impacto ${String(s.impactLevel || 'alto').toUpperCase()}`,
        badgeTone: 'indigo',
        isCritical: s.impactLevel === 'alto',
        fields: {
          parte: s.parte || '',
          type: s.type || 'Interno',
          necesidades: s.necesidades || '',
          expectativas: s.expectativas || '',
          requisito: s.requisito || '',
          control: s.control || '',
          communicationChannel: s.communicationChannel || '',
          frequency: s.frequency || '',
          impactLevel: s.impactLevel || 'alto',
          sentToKanban: Boolean(s.sentToKanban),
          ...crossSummaryFields,
          'Partes Interesadas Internas y Externas (Stakeholders)': `${s.parte || ''} (${s.type || 'Interno'})`,
          'Necesidades y Expectativas en SST por Parte Interesada': `Necesidades: ${s.necesidades || ''} | Expectativas: ${s.expectativas || ''}`,
          'Requisitos Legales y Contractuales Asociados': s.requisito || '',
          'Mecanismo de Control': s.control || '',
          'Mecanismos de Comunicación y Seguimiento': `${s.communicationChannel || ''} (${s.frequency || ''})`,
          'Nivel de Impacto': s.impactLevel || 'alto',
        },
      })),
      ...crossRecords,
    ];

    return {
      moduleTitle: 'Hito 1 · Contexto y Partes Interesadas (DOFA / Stakeholders)',
      sourceCollection: 'ContextoData',
      latestReports,
      kpis: [
        { label: 'Factores DOFA', value: dofaList.length, tone: 'teal' },
        { label: 'Debilidades / Amenazas', value: dofaList.filter((d) => d.type === 'debilidad' || d.type === 'amenaza').length, tone: 'rose' },
        { label: 'Partes Interesadas', value: stakeholders.length, tone: 'indigo' },
        { label: 'Cruces CAME (FO/DO/FA/DA)', value: totalStrategies, tone: 'purple' },
      ],
      records,
    };
  }

  // 2. Hito 1 · Diagnóstico Inicial Estándares Mínimos Res. 0312
  if (canonicalId === 'hito1_diagnostico_0312') {
    const DiagnosticoData = getSafeModel('DiagnosticoData', '~/server/routes/sgsst/diagnostico', '~/models/DiagnosticoData');
    const doc = await findSingleCompanyDoc(DiagnosticoData, userId, company);
    const items = Array.isArray(doc?.statusData) ? doc.statusData : [];
    const cumpleCount = items.filter((i) => i.status === 'cumple').length;
    const noCumpleCount = items.filter((i) => i.status === 'no_cumple' || i.status === 'parcial').length;
    const noAplicaCount = items.filter((i) => i.status === 'no_aplica').length;
    const score =
      typeof doc?.compliancePercentage === 'number'
        ? Math.round(doc.compliancePercentage * 100) / 100
        : typeof doc?.score === 'number'
          ? Math.round(doc.score * 100) / 100
          : 0;
    const totalPoints =
      typeof doc?.totalPoints === 'number'
        ? doc.totalPoints
        : items.reduce((acc, it) => acc + (it.status === 'cumple' || it.status === 'no_aplica' ? Number(it.weight ?? it.points ?? 0) : 0), 0);
    const level = doc?.complianceLevel || (score >= 86 ? 'Aceptable' : score >= 61 ? 'Moderado' : 'Crítico');
    const wCount = Number(company?.workerCount || 0);
    const resolvedCompanySize =
      doc?.companySize ||
      (wCount <= 10 ? '10 o menos trabajadores (7 o 21 estándares)' : wCount <= 50 ? '11 a 50 trabajadores (21 o 60 estándares)' : 'Más de 50 trabajadores (60 estándares)');
    const resolvedRiskLevel = doc?.riskLevel || company?.riskLevel || '';

    const tagReports = await fetchLatestReportsForTags(userId, company, ['sgsst-diagnostico'], 5);
    const latestReports = mergeLatestReports(tagReports, [
      buildEmbeddedReportEntry({
        conversationId: doc?.conversationId || `embedded_diag_${company?._id || 'active'}`,
        title: 'Informe Oficial Autoevaluación Estándares Mínimos Res. 0312',
        html: doc?.lastGeneratedReport || doc?.reportHtml,
        tags: ['sgsst-diagnostico'],
        createdAt: doc?.updatedAt,
      }),
    ]);

    const records = items.map((it, idx) => {
      const st = String(it.status || 'pendiente');
      const isCrit = st === 'no_cumple' || st === 'parcial' || st === 'pendiente';
      const stLabel =
        st === 'cumple'
          ? 'CUMPLE'
          : st === 'no_cumple'
            ? 'NO CUMPLE (BRECHA)'
            : st === 'parcial'
              ? 'CUMPLE PARCIAL'
              : st === 'no_aplica'
                ? 'NO APLICA'
                : 'PENDIENTE';
      const stdCode = it.standardCode || it.code || it.itemId || '';
      const stdDesc = it.description || it.name || '';
      const stdWeight = it.weight ?? it.points ?? '';
      const stdCycle = String(it.cycle || it.category || '').toUpperCase();
      const stdObs = it.observation || it.evaluation || '';
      const stdEvs = Array.isArray(it.evidenceFiles) ? it.evidenceFiles : Array.isArray(it.evidences) ? it.evidences : [];

      return {
        id: String(stdCode || `std_${idx}`),
        label: `Estándar ${stdCode || idx + 1} · ${stdDesc || 'Estándar Res. 0312'}`,
        sublabel: `Ciclo: ${stdCycle || 'PHVA'} • Peso: ${stdWeight} pts${stdObs ? ` • Obs: ${stdObs}` : ''}`,
        badge: stLabel,
        badgeTone: st === 'cumple' ? 'emerald' : st === 'no_aplica' ? 'slate' : 'rose',
        isCritical: isCrit,
        fields: {
          companySize: resolvedCompanySize,
          riskLevel: resolvedRiskLevel,
          totalPoints: Number(totalPoints.toFixed ? totalPoints.toFixed(2) : totalPoints),
          compliancePercentage: score,
          cycle: stdCycle,
          standardCode: stdCode,
          description: stdDesc,
          weight: stdWeight,
          status: st,
          evaluation: it.evaluation || stLabel,
          observation: stdObs,
          evidenceFiles: stdEvs.map((ev) => (typeof ev === 'string' ? ev : ev?.fileName || ev?.name || ev?.url || '')).filter(Boolean),
          'Código Estándar': stdCode,
          'Nombre del Estándar': stdDesc,
          'Estado (Cumple / No Cumple / Parcial / No Aplica)': stLabel,
          'Puntaje del Ítem': String(stdWeight),
          'Ciclo PHVA': stdCycle,
          'Observación / Hallazgo': stdObs,
          'Tamaño de Empresa': resolvedCompanySize,
          'Nivel de Riesgo ARL': String(resolvedRiskLevel),
          'Puntaje Total Obtenido (pts)': String(totalPoints),
          'Puntaje Total Res. 0312 (%)': `${score}%`,
          'Puntaje Total 0312 (%)': `${score}%`,
          'Valoración Global (Crítico <60% / Moderado 60-85% / Aceptable >85%)': String(level).toUpperCase(),
          'Valoración Global (Crítico / Moderado / Aceptable)': String(level).toUpperCase(),
          'Estándares que NO CUMPLEN (Brechas Críticas y Numeral)': isCrit ? `${stdCode}: ${stdDesc} (${stdObs || 'Sin evidencia'})` : '',
          'Estándares que CUMPLEN Totalmente (Ítem y Peso)': st === 'cumple' ? `${stdCode}: ${stdDesc} (${stdWeight || 0} pts)` : '',
          'Estándares que NO APLICAN (Justificación Normativa)': st === 'no_aplica' ? `${stdCode}: ${stdDesc}` : '',
          'Avance por Ciclo PHVA (Planear, Hacer, Verificar, Actuar)': stdCycle,
          'Observaciones Técnicas del Evaluador SST': stdObs,
        },
      };
    });

    return {
      moduleTitle: 'Hito 1 · Diagnóstico Inicial Estándares Mínimos (Res. 0312)',
      sourceCollection: 'DiagnosticoData',
      latestReports,
      kpis: [
        { label: 'Puntaje Res. 0312', value: `${score}%`, tone: score >= 86 ? 'emerald' : score >= 61 ? 'amber' : 'rose' },
        { label: 'Valoración Global', value: String(level).toUpperCase(), tone: score >= 86 ? 'emerald' : score >= 61 ? 'amber' : 'rose' },
        { label: 'Cumplen / No Aplican', value: `${cumpleCount} / ${noAplicaCount}`, tone: 'emerald' },
        { label: 'En Brecha (No Cumple)', value: noCumpleCount, tone: noCumpleCount > 0 ? 'rose' : 'emerald' },
      ],
      records,
    };
  }

  // 3, 4, 5, 7, 8. Documentos de Gobernanza Hito 1 (Responsable, Política, Objetivos, RHS, RIT)
  if (['hito1_responsable', 'hito1_politica_objetivos', 'hito1_objetivos', 'hito1_rhs', 'hito1_rit'].includes(canonicalId)) {
    const tagMap = {
      hito1_responsable: ['sgsst-responsable'],
      hito1_politica_objetivos: ['sgsst-politica'],
      hito1_objetivos: ['sgsst-objetivos'],
      hito1_rhs: ['sgsst-rhs', 'sgsst-reglamento-higiene'],
      hito1_rit: ['sgsst-rit', 'sgsst-reglamento-interno'],
    };
    const titleMap = {
      hito1_responsable: 'Hito 1 · Asignación del Responsable SG-SST (Est. 1.1.1)',
      hito1_politica_objetivos: 'Hito 1 · Política de Seguridad y Salud en el Trabajo (Est. 2.1.1)',
      hito1_objetivos: 'Hito 1 · Objetivos y Metas del SG-SST (Est. 2.2.1)',
      hito1_rhs: 'Hito 1 · Reglamento de Higiene y Seguridad Industrial (RHS)',
      hito1_rit: 'Hito 1 · Reglamento Interno de Trabajo (RIT)',
    };
    const reports = await fetchLatestReportsForTags(userId, company, tagMap[canonicalId], 5);
    const hasResp = Boolean(company?.responsibleSST);
    const dept = company?.departamento || company?.department || '';

    const fullCompanyFields = {
      companyName: company?.companyName || '',
      nit: company?.nit || '',
      ciiu: company?.ciiu || company?.ciiuCode || '',
      economicActivity: company?.economicActivity || '',
      riskLevel: company?.riskLevel || '',
      arl: company?.arl || '',
      workerCount: company?.workerCount ?? 0,
      address: company?.address || '',
      city: company?.city || '',
      department: dept,
      legalRepresentative: company?.legalRepresentative || '',
      legalRepresentativeId: company?.legalRepresentativeId || '',
      responsibleSST: company?.responsibleSST || '',
      licenseNumber: company?.licenseNumber || '',
      formationLevel: company?.formationLevel || '',
      licenseExpiry: company?.licenseExpiry || '',
      courseStatus: company?.courseStatus || '',
      'Razón Social': company?.companyName || '',
      'NIT': company?.nit || '',
      'Código CIIU': company?.ciiu || company?.ciiuCode || '',
      'Actividad Económica': company?.economicActivity || '',
      'Nivel de Riesgo ARL': String(company?.riskLevel || ''),
      'ARL Afiliada': company?.arl || '',
      'Número de Trabajadores': String(company?.workerCount ?? 0),
      'Dirección': company?.address || '',
      'Ciudad / Municipio': company?.city || '',
      'Departamento': dept,
      'Representante Legal': company?.legalRepresentative || '',
      'Nombre Completo y Cédula del Responsable SG-SST': company?.responsibleSST || 'Sin asignar',
      'Nombre del Responsable SG-SST': company?.responsibleSST || 'Sin asignar',
      'Perfil Académico (Profesional / Especialista / Tecnólogo en SST)': company?.formationLevel || '',
      'Nivel de Formación Académica': company?.formationLevel || '',
      'Número y Fecha de Vigencia de Licencia SST': `${company?.licenseNumber || ''} (Vence: ${company?.licenseExpiry || 'N/A'})`,
      'Número de Licencia SST': company?.licenseNumber || '',
      'Fecha de Vigencia de Licencia': company?.licenseExpiry || '',
      'Certificado Curso Virtual 50 Horas / Actualización 20 Horas': company?.courseStatus || '',
      'Actividad Económica y Clase de Riesgo': `${company?.economicActivity || ''} (CIIU ${company?.ciiu || ''} - Riesgo ${company?.riskLevel || ''})`,
    };

    const primaryExtracted = reports[0]?.html
      ? extractHtmlSectionsFromReport(reports[0].html)
      : { headings: [], tableRows: [], structuredText: '' };

    const records = [];
    if (company) {
      records.push({
        id: `gov_${canonicalId}_company`,
        label:
          canonicalId === 'hito1_responsable'
            ? `Responsable SG-SST: ${company?.responsibleSST || 'Sin asignar'} (Licencia: ${company?.licenseNumber || 'Pendiente'})`
            : `${titleMap[canonicalId]} — ${companyName}`,
        sublabel: `NIT: ${company?.nit || 'N/A'} • Formación: ${company?.formationLevel || 'N/A'} • Licencia: ${company?.licenseNumber || 'N/A'} (Vence: ${company?.licenseExpiry || 'N/A'})`,
        badge: reports.length > 0 ? `${reports.length} Informe(s) Oficial(es)` : hasResp ? 'Datos Registrados' : 'Pendiente Generar',
        badgeTone: reports.length > 0 || hasResp ? 'emerald' : 'amber',
        isCritical: canonicalId === 'hito1_responsable' ? !hasResp : false,
        fields: {
          ...fullCompanyFields,
          'Capítulos / Secciones del Último Informe Oficial': primaryExtracted.headings.join(' | ') || 'Sin capítulos generados aún',
          'Tablas Extraídas del Informe Oficial': primaryExtracted.tableRows.join(' || ') || '',
          'Último Documento Oficial Generado (Contenido Completo por Secciones)':
            primaryExtracted.structuredText || reports[0]?.preview || 'Sin documento generado aún',
        },
      });
    }

    for (const r of reports) {
      const parsed = extractHtmlSectionsFromReport(r.html);
      records.push({
        id: r.conversationId,
        label: `📄 ${r.title}`,
        sublabel: parsed.headings.length > 0 ? `Capítulos: ${parsed.headings.slice(0, 6).join(' • ')}` : r.preview || 'Documento oficial guardado en historial',
        badge: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('es-CO') : 'Guardado',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          ...fullCompanyFields,
          conversationId: r.conversationId,
          title: r.title,
          charCount: r.charCount,
          'Título del Informe': r.title,
          'Fecha de Generación': r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('es-CO') : '',
          'Capítulos / Encabezados (H2/H3)': parsed.headings.join(' | '),
          'Filas de Tablas Oficiales (TR)': parsed.tableRows.join(' || '),
          'Contenido Estructurado Completo del Documento Oficial': parsed.structuredText,
        },
      });
    }

    return {
      moduleTitle: titleMap[canonicalId],
      sourceCollection: 'CompanyInfo + ConversationHistory',
      latestReports: reports,
      kpis: [
        { label: 'Responsable SST', value: company?.responsibleSST || 'Pendiente', tone: hasResp ? 'emerald' : 'rose' },
        { label: 'Licencia SST', value: company?.licenseNumber || 'Pendiente', tone: company?.licenseNumber ? 'teal' : 'amber' },
        { label: 'Curso 50h / 20h', value: company?.courseStatus || 'Pendiente', tone: 'indigo' },
        { label: 'Informes en Historial', value: reports.length, tone: 'purple' },
      ],
      records,
    };
  }

  // 6. Hito 1 · Matriz Legal SST
  if (canonicalId === 'hito1_matriz_legal') {
    const MatrizLegalData = getSafeModel('MatrizLegalData', '~/server/routes/sgsst/matriz');
    const doc = await findSingleCompanyDoc(MatrizLegalData, userId, company);
    const statuses = doc?.statuses && typeof doc.statuses === 'object' ? doc.statuses : {};
    const seguimientos = doc?.seguimientos && typeof doc.seguimientos === 'object' ? doc.seguimientos : {};
    const entries = Object.entries(statuses);
    const cumple = entries.filter(([, v]) => v === 'cumple').length;
    const brecha = entries.filter(([, v]) => v === 'no_cumple' || v === 'pendiente').length;
    const pct = entries.length > 0 ? Math.round((cumple / entries.length) * 100) : 0;
    const latestReports = await fetchLatestReportsForTags(userId, company, ['sgsst-matriz-legal', 'sgsst-matriz'], 5);

    const records = entries.map(([normKey, st]) => {
      const isCrit = st === 'no_cumple' || st === 'pendiente';
      return {
        id: normKey,
        label: `Norma / Requisito Legal: ${normKey}`,
        sublabel: `Seguimiento / Evidencia: ${seguimientos[normKey] || 'Sin observación registrada'}`,
        badge: String(st || 'pendiente').toUpperCase(),
        badgeTone: st === 'cumple' ? 'emerald' : isCrit ? 'rose' : 'slate',
        isCritical: isCrit,
        fields: {
          'Norma / Ley / Decreto / Resolución y Año': normKey,
          'Evaluación de Cumplimiento (Cumple / En Proceso / No Cumple)': String(st || '').toUpperCase(),
          'Plan de Acción y Responsable de Cumplimiento Legal': seguimientos[normKey] || '',
          'Evidencia de Cumplimiento': seguimientos[normKey] || '',
          'Actividad Económica': doc?.activity || company?.economicActivity || '',
          'Ubicación / Jurisdicción': doc?.location || company?.city || '',
        },
      };
    });

    return {
      moduleTitle: 'Hito 1 · Matriz de Requisitos Legales SG-SST',
      sourceCollection: 'MatrizLegalData',
      latestReports,
      kpis: [
        { label: 'Normas Evaluadas', value: entries.length, tone: 'teal' },
        { label: 'Cumplimiento Legal', value: `${pct}%`, tone: pct >= 85 ? 'emerald' : 'amber' },
        { label: 'Cumplen', value: cumple, tone: 'emerald' },
        { label: 'En Brecha / No Cumple', value: brecha, tone: brecha > 0 ? 'rose' : 'emerald' },
      ],
      records,
    };
  }

  // 9. Hito 1 · Participación y Consulta de Peligros IPEVAR
  if (canonicalId === 'hito1_participacion_ipevar') {
    const ParticipacionIpevarData = getSafeModel('ParticipacionIpevarData', '~/server/routes/sgsst/participacionIpevar');
    const doc = await findSingleCompanyDoc(ParticipacionIpevarData, userId, company);
    const list = Array.isArray(doc?.participacionesList) ? doc.participacionesList : [];
    const inbox = Array.isArray(doc?.inboxPublico) ? doc.inboxPublico : [];
    const tagReports = await fetchLatestReportsForTags(userId, company, ['sgsst-participacion-ipevar'], 5);
    const latestReports = mergeLatestReports(tagReports, [
      buildEmbeddedReportEntry({
        conversationId: doc?.conversationId || `embedded_part_ipevar_${company?._id || 'active'}`,
        title: 'Informe Oficial Participación y Consulta IPEVAR',
        html: doc?.lastGeneratedReport || doc?.reportHtml,
        tags: ['sgsst-participacion-ipevar'],
        createdAt: doc?.updatedAt,
      }),
    ]);

    const combined = [
      ...list.map((p, idx) => {
        const fd = p.formData || p;
        const trab = p.trabajadoresList?.[0] || {};
        return {
          id: p.id || `part_${idx}`,
          trabajadorNombre: p.trabajadorNombre || trab.nombre || fd.nombre || p.title || 'Colaborador',
          trabajadorCedula: p.trabajadorCedula || trab.cedula || trab.documento || fd.cedula || '',
          cargo: p.cargo || trab.cargo || fd.cargo || '',
          area: p.area || fd.proceso || fd.area || '',
          zona: p.zona || fd.zona || '',
          actividad: p.actividad || fd.actividad || fd.actividadGlobal || '',
          tarea: p.tarea || fd.tarea || fd.tareas || '',
          rutinaria: p.rutinaria ?? fd.rutinaria ?? 'Sí',
          peligro: p.peligro || fd.peligros || fd.peligro || '',
          clasificacion: p.clasificacion || fd.peligroClasificacion || fd.clasificacion || '',
          efectosPosibles: p.efectosPosibles || fd.efectosPosibles || '',
          peorConsecuencia: p.peorConsecuencia || fd.peorConsecuencia || '',
          severidad: p.severidad || fd.severidadPercibida || fd.severidad || 'Media',
          controlesExistentes: p.controlesExistentes || fd.controlesExistentes || '',
          sugeridoEliminacion: p.sugeridoEliminacion || fd.sugeridoEliminacion || '',
          sugeridoIngenieria: p.sugeridoIngenieria || fd.sugeridoIngenieria || '',
          sugeridoAdministrativo: p.sugeridoAdministrativo || fd.sugeridoAdministrativo || fd.propuestaMejora || '',
          sugeridoEPP: p.sugeridoEPP || fd.sugeridoEPP || '',
          matrixAction: p.matrixAction || fd.matrixAction || (p.status === 'applied_to_matrix' ? 'integrado' : ''),
          estado: p.estado || p.status || 'processed',
          fecha: p.fecha || fd.fecha || p.createdAt || '',
          modalidad: 'Asistida SST',
        };
      }),
      ...inbox.map((inb, idx) => {
        const d = inb.data || inb;
        const trab = inb.trabajador || {};
        return {
          id: inb.id || `inb_part_${idx}`,
          trabajadorNombre: inb.trabajadorNombre || trab.nombre || d.trabajadorNombre || d.nombre || 'Reporte QR',
          trabajadorCedula: inb.trabajadorCedula || trab.cedula || d.trabajadorCedula || d.cedula || '',
          cargo: inb.cargo || trab.cargo || d.cargo || '',
          area: inb.area || d.proceso || d.area || '',
          zona: inb.zona || d.zona || d.ubicacion || '',
          actividad: inb.actividad || d.actividad || '',
          tarea: inb.tarea || d.tarea || d.tareas || '',
          rutinaria: inb.rutinaria ?? d.rutinaria ?? 'Sí',
          peligro: inb.peligro || d.peligro || d.peligros || d.descripcion || '',
          clasificacion: inb.clasificacion || d.clasificacion || d.peligroClasificacion || '',
          efectosPosibles: inb.efectosPosibles || d.efectosPosibles || '',
          peorConsecuencia: inb.peorConsecuencia || d.peorConsecuencia || '',
          severidad: inb.severidad || d.severidadPercibida || d.severidad || 'Alta',
          controlesExistentes: inb.controlesExistentes || d.controlesExistentes || '',
          sugeridoEliminacion: inb.sugeridoEliminacion || d.sugeridoEliminacion || '',
          sugeridoIngenieria: inb.sugeridoIngenieria || d.sugeridoIngenieria || '',
          sugeridoAdministrativo: inb.sugeridoAdministrativo || d.sugeridoAdministrativo || d.propuestaMejora || '',
          sugeridoEPP: inb.sugeridoEPP || d.sugeridoEPP || '',
          matrixAction: inb.matrixAction || d.matrixAction || 'pendiente_revision_qr',
          estado: inb.estado || inb.status || 'pending',
          fecha: inb.fecha || d.fecha || inb.createdAt || '',
          modalidad: 'Buzón QR Colaborador',
        };
      }),
    ];

    const critCount = combined.filter((c) => /alta|cr[ií]tica/i.test(String(c.severidad)) || c.estado === 'pending' || c.estado === 'pendiente').length;

    return {
      moduleTitle: 'Hito 1 · Participación y Consulta de Peligros (IPEVAR)',
      sourceCollection: 'ParticipacionIpevarData',
      latestReports,
      kpis: [
        { label: 'Total Participaciones', value: combined.length, tone: 'teal' },
        { label: 'Buzón QR Público', value: inbox.length, tone: 'indigo' },
        { label: 'Severidad Alta / Pendientes', value: critCount, tone: critCount > 0 ? 'rose' : 'emerald' },
        { label: 'Integradas a GTC-45', value: combined.filter((x) => x.estado === 'applied_to_matrix' || x.estado === 'aprobado').length, tone: 'emerald' },
      ],
      records: combined.map((c) => {
        const isCrit = /alta|cr[ií]tica/i.test(String(c.severidad)) || c.estado === 'pending' || c.estado === 'pendiente';
        const propuestasJoin = [
          c.sugeridoEliminacion ? `Eliminación: ${c.sugeridoEliminacion}` : '',
          c.sugeridoIngenieria ? `Ingeniería: ${c.sugeridoIngenieria}` : '',
          c.sugeridoAdministrativo ? `Administrativo: ${c.sugeridoAdministrativo}` : '',
          c.sugeridoEPP ? `EPP: ${c.sugeridoEPP}` : '',
        ]
          .filter(Boolean)
          .join(' | ');
        return {
          id: c.id,
          label: `${c.trabajadorNombre} ${c.trabajadorCedula ? `(CC ${c.trabajadorCedula})` : ''} · ${c.clasificacion || 'Peligro Reportado'}`,
          sublabel: `Cargo: ${c.cargo || 'N/A'} • Zona: ${c.area || ''} ${c.zona || ''} • Peligro: ${c.peligro || ''}`,
          badge: `${c.severidad} • ${c.modalidad} (${c.estado})`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            trabajadorNombre: c.trabajadorNombre,
            trabajadorCedula: c.trabajadorCedula,
            cargo: c.cargo,
            area: c.area,
            zona: c.zona,
            actividad: c.actividad,
            tarea: c.tarea,
            rutinaria: c.rutinaria,
            peligro: c.peligro,
            clasificacion: c.clasificacion,
            efectosPosibles: c.efectosPosibles,
            peorConsecuencia: c.peorConsecuencia,
            severidad: c.severidad,
            controlesExistentes: c.controlesExistentes,
            sugeridoEliminacion: c.sugeridoEliminacion,
            sugeridoIngenieria: c.sugeridoIngenieria,
            sugeridoAdministrativo: c.sugeridoAdministrativo,
            sugeridoEPP: c.sugeridoEPP,
            matrixAction: c.matrixAction,
            estado: c.estado,
            fecha: c.fecha,
            modalidad: c.modalidad,
            'Trabajador Reportante (Cédula, Nombre y Cargo)': `${c.trabajadorNombre} (CC ${c.trabajadorCedula}) - ${c.cargo}`,
            'Cédula / Documento': c.trabajadorCedula,
            'Nombre Completo': c.trabajadorNombre,
            'Cargo': c.cargo,
            'Área / Proceso / Zona': `${c.area} - ${c.zona}`,
            'Actividad / Tarea': `${c.actividad} ${c.tarea ? `- ${c.tarea}` : ''}`.trim(),
            'Clasificación del Peligro (GTC-45)': c.clasificacion,
            'Peligro Percibido o Condición Reportada': c.peligro,
            'Efectos Posibles y Peor Consecuencia': `${c.efectosPosibles} | Peor consecuencia: ${c.peorConsecuencia}`,
            'Severidad Percibida': c.severidad,
            'Controles Existentes': c.controlesExistentes,
            'Propuesta de Control Sugerida por el Trabajador': propuestasJoin,
            'Estado de Incorporación en la Matriz Oficial IPEVR': `${c.estado}${c.matrixAction ? ` (${c.matrixAction})` : ''}`,
          },
        };
      }),
    };
  }

  // 10. Hito 1 · Matriz Oficial de Peligros IPEVR (GTC-45 — 25+ Columnas Completas)
  if (canonicalId === 'hito2_matriz_ipevar') {
    const GTC45WorkspaceSession = getSafeModel('GTC45WorkspaceSession', '~/server/routes/sgsst/gtc45Workspace', '~/models/GTC45WorkspaceSession');
    const MatrizPeligrosData = getSafeModel('MatrizPeligrosData', '~/server/routes/sgsst/matrizPeligros');
    const docs = await findManyCompanyDocs(GTC45WorkspaceSession, userId, company, { isOfficial: -1, updatedAt: -1 }, 10);
    const officialDoc =
      docs.find((d) => d.isOfficial && Array.isArray(d.matrixRows) && d.matrixRows.length > 0) ||
      docs.find((d) => Array.isArray(d.matrixRows) && d.matrixRows.length > 0) ||
      docs[0] ||
      null;
    let rows = Array.isArray(officialDoc?.matrixRows) ? officialDoc.matrixRows : [];
    let sourceCollectionLabel = 'GTC45WorkspaceSession';

    if (rows.length === 0 && MatrizPeligrosData) {
      const mpDoc = await findSingleCompanyDoc(MatrizPeligrosData, userId, company);
      const mpEntries = Array.isArray(mpDoc?.entries) ? mpDoc.entries : [];
      if (mpEntries.length > 0) {
        sourceCollectionLabel = 'MatrizPeligrosData';
        rows = mpEntries.map((e, idx) => ({
          id: e.id || `mp_${idx}`,
          proceso: e.proceso || 'Operativo',
          zona_lugar: e.zona_lugar || e.zona || 'Principal',
          cargos: e.cargos || e.cargo || e.proceso || 'Operativo',
          actividades: e.actividades || e.actividad || '',
          tareas: e.tareas || e.tarea || '',
          rutinaria: e.rutinario === false ? 'No' : 'Sí',
          peligro_clasificacion: e.clasificacion || 'Peligro Operativo',
          peligro_descripcion: e.descripcionPeligro || '',
          efectos_posibles: e.efectosPosibles || '',
          controles_fuente: e.controlFuente || 'Ninguno',
          controles_medio: e.controlMedio || 'Ninguno',
          controles_individuo: e.controlIndividuo || 'Ninguno',
          nd: e.nivelDeficiencia ?? '',
          ne: e.nivelExposicion ?? '',
          np: e.nivelProbabilidad ?? '',
          interpretacion_np: e.interpretacionNP || '',
          nc: e.nivelConsecuencia ?? '',
          nr: e.nivelRiesgo ?? '',
          interpretacion_nr: e.interpretacionNR || '',
          aceptabilidad: e.aceptabilidad || '',
          nro_expuestos: e.numExpuestos ?? '',
          peor_consecuencia: e.peorConsecuencia || '',
          requisito_legal: e.requisitoLegal ? 'Sí' : 'No',
          medida_eliminacion: e.eliminacion || 'N/A',
          medida_sustitucion: e.sustitucion || 'N/A',
          medida_ingenieria: e.controlesIngenieria || 'N/A',
          medida_administrativa: e.controlesAdmin || 'N/A',
          medida_eppu: e.epp || 'N/A',
        }));
      }
    }

    const tagReports = await fetchLatestReportsForTags(userId, company, ['sgsst-matriz-ipevar', 'sgsst-matriz-peligros'], 5);
    const latestReports = mergeLatestReports(tagReports, [
      buildEmbeddedReportEntry({
        conversationId: officialDoc?.conversationId || `embedded_gtc45_${company?._id || 'active'}`,
        title: officialDoc?.officialTitle || 'Informe Oficial Matriz de Peligros GTC-45',
        html: officialDoc?.reportHtml || officialDoc?.lastGeneratedReport,
        tags: ['sgsst-matriz-ipevar'],
        createdAt: officialDoc?.updatedAt,
      }),
    ]);

    const chartConclusionsText = officialDoc?.chartConclusions ? formatCleanScalar(officialDoc.chartConclusions, '') : '';
    const criticos = rows.filter((r) => r.interpretacion_nr === 'I' || r.interpretacion_nr === 'II' || /no aceptable/i.test(r.aceptabilidad || '')).length;

    return {
      moduleTitle: 'Hito 1 · Matriz Oficial de Identificación de Peligros y Valoración de Riesgos (GTC-45)',
      sourceCollection: sourceCollectionLabel,
      latestReports,
      kpis: [
        { label: 'Total Peligros GTC-45', value: rows.length, tone: 'teal' },
        { label: 'Críticos / Altos (Nivel I y II)', value: criticos, tone: criticos > 0 ? 'rose' : 'emerald' },
        { label: 'Aceptables (III y IV)', value: Math.max(0, rows.length - criticos), tone: 'emerald' },
        { label: 'Cargos Evaluados', value: new Set(rows.map((r) => r.cargos || r.cargo).filter(Boolean)).size, tone: 'indigo' },
      ],
      records: rows.map((r, i) => {
        const isCrit = r.interpretacion_nr === 'I' || r.interpretacion_nr === 'II' || /no aceptable/i.test(r.aceptabilidad || '');
        const zonaLugar = r.zona_lugar || r.zona || '';
        const cargosVal = r.cargos || r.cargo || '';
        const actividadesVal = r.actividades || r.actividad || '';
        const tareasVal = r.tareas || r.tarea || '';
        return {
          id: r.id || `gtc45_${i}`,
          label: `[${r.peligro_clasificacion || 'Peligro'}] ${r.peligro_descripcion || 'Sin descripción'} — Cargo: ${cargosVal || r.proceso || 'General'}`,
          sublabel: `Proceso: ${r.proceso || ''} • Actividad: ${actividadesVal} • Efectos: ${r.efectos_posibles || ''}`,
          badge: `NR: ${r.nr ?? 'N/A'} (Nivel ${r.interpretacion_nr || 'N/A'} · ${r.aceptabilidad || 'Evaluado'})`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            proceso: r.proceso || '',
            zona_lugar: zonaLugar,
            cargos: cargosVal,
            actividades: actividadesVal,
            tareas: tareasVal,
            rutinaria: r.rutinaria ?? 'Sí',
            peligro_descripcion: r.peligro_descripcion || '',
            peligro_clasificacion: r.peligro_clasificacion || '',
            efectos_posibles: r.efectos_posibles || '',
            controles_fuente: r.controles_fuente || '',
            controles_medio: r.controles_medio || '',
            controles_individuo: r.controles_individuo || '',
            nd: r.nd ?? '',
            ne: r.ne ?? '',
            np: r.np ?? '',
            interpretacion_np: r.interpretacion_np || '',
            nc: r.nc ?? '',
            nr: r.nr ?? '',
            interpretacion_nr: r.interpretacion_nr || '',
            aceptabilidad: r.aceptabilidad || '',
            nro_expuestos: r.nro_expuestos ?? '',
            peor_consecuencia: r.peor_consecuencia || '',
            requisito_legal: r.requisito_legal ?? '',
            medida_eliminacion: r.medida_eliminacion || '',
            medida_sustitucion: r.medida_sustitucion || '',
            medida_ingenieria: r.medida_ingenieria || '',
            medida_administrativa: r.medida_administrativa || '',
            medida_eppu: r.medida_eppu || '',
            chartConclusions: chartConclusionsText,
            'Proceso, Zona / Lugar y Cargo Expuesto': `${r.proceso || ''} | ${zonaLugar} | ${cargosVal}`,
            'Proceso': r.proceso || '',
            'Cargo': cargosVal,
            'Zona / Lugar': zonaLugar,
            'Actividad y Tarea (Rutinaria / No Rutinaria)': `${actividadesVal} - ${tareasVal} (Rutinaria: ${r.rutinaria || 'Sí'})`,
            'Peligro (Descripción y Clasificación: Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de Seguridad, Fenómenos Naturales)': `${r.peligro_clasificacion || ''}: ${r.peligro_descripcion || ''}`,
            'Clasificación del Peligro': r.peligro_clasificacion || '',
            'Descripción del Peligro': r.peligro_descripcion || '',
            'Efectos Posibles en la Salud': r.efectos_posibles || '',
            'Controles Existentes (Fuente, Medio e Individuo)': `Fuente: ${r.controles_fuente || 'Ninguno'} | Medio: ${r.controles_medio || 'Ninguno'} | Individuo: ${r.controles_individuo || 'Ninguno'}`,
            'Evaluación del Riesgo (ND, NE, NP = ND×NE, Interpretación NP, NC)': `ND=${r.nd ?? ''} | NE=${r.ne ?? ''} | NP=${r.np ?? ''} (${r.interpretacion_np || ''}) | NC=${r.nc ?? ''}`,
            'Valoración del Riesgo (NR = NP×NC, Nivel de Riesgo I/II/III/IV y Aceptabilidad)': `NR=${r.nr ?? ''} | Nivel ${r.interpretacion_nr || ''} | ${r.aceptabilidad || ''}`,
            'Criterios para Controles (N° Expuestos, Peor Consecuencia y Requisito Legal Asociado)': `Expuestos: ${r.nro_expuestos ?? ''} | Peor Consecuencia: ${r.peor_consecuencia || ''} | Req. Legal: ${r.requisito_legal || 'Sí'}`,
            'Medidas de Intervención (Eliminación, Sustitución, Controles de Ingeniería, Controles Administrativos / Señalización y EPP)': `Eliminación: ${r.medida_eliminacion || 'N/A'} | Sustitución: ${r.medida_sustitucion || 'N/A'} | Ingeniería: ${r.medida_ingenieria || 'N/A'} | Admin: ${r.medida_administrativa || 'N/A'} | EPP: ${r.medida_eppu || 'N/A'}`,
            'Conclusiones Estadísticas de la Matriz': chartConclusionsText,
          },
        };
      }),
    };
  }

  // 11. Hito 1 · Matriz Oficial de Riesgos Viales PESV (25+ Columnas Completas)
  if (canonicalId === 'hito3_matriz_pesv') {
    const PESVWorkspaceSession = getSafeModel('PESVWorkspaceSession', '~/server/routes/sgsst/pesvWorkspace', '~/models/PESVWorkspaceSession');
    const docs = await findManyCompanyDocs(PESVWorkspaceSession, userId, company, { isOfficial: -1, updatedAt: -1 }, 10);
    const officialDoc =
      docs.find((d) => d.isOfficial && Array.isArray(d.matrixRows) && d.matrixRows.length > 0) ||
      docs.find((d) => Array.isArray(d.matrixRows) && d.matrixRows.length > 0) ||
      docs[0] ||
      null;
    const rows = Array.isArray(officialDoc?.matrixRows) ? officialDoc.matrixRows : [];
    const criticos = rows.filter((r) => /alto|cr[ií]tico/i.test(r.nivel_riesgo || '') || Number(r.calificacion) >= 12).length;

    const tagReports = await fetchLatestReportsForTags(userId, company, ['sgsst-matriz-pesv'], 5);
    const latestReports = mergeLatestReports(tagReports, [
      buildEmbeddedReportEntry({
        conversationId: officialDoc?.conversationId || `embedded_pesv_${company?._id || 'active'}`,
        title: officialDoc?.officialTitle || 'Informe Oficial Matriz de Riesgos Viales PESV',
        html: officialDoc?.reportHtml || officialDoc?.lastGeneratedReport,
        tags: ['sgsst-matriz-pesv'],
        createdAt: officialDoc?.updatedAt,
      }),
    ]);

    const chartConclusionsText = officialDoc?.chartConclusions ? formatCleanScalar(officialDoc.chartConclusions, '') : '';

    return {
      moduleTitle: 'Hito 1 · Matriz de Riesgos Viales PESV (Res. 20223040040595)',
      sourceCollection: 'PESVWorkspaceSession',
      latestReports,
      kpis: [
        { label: 'Peligros Viales PESV', value: rows.length, tone: 'teal' },
        { label: 'Riesgo Vial Crítico / Alto', value: criticos, tone: criticos > 0 ? 'rose' : 'emerald' },
        { label: 'Riesgo Medio / Bajo', value: Math.max(0, rows.length - criticos), tone: 'emerald' },
        { label: 'Actores Viales', value: new Set(rows.map((r) => r.actor_vial || r.rol_via || r.cargo).filter(Boolean)).size, tone: 'indigo' },
      ],
      records: rows.map((r, i) => {
        const isCrit = /alto|cr[ií]tico/i.test(r.nivel_riesgo || '') || Number(r.calificacion) >= 12;
        const actorVial = r.actor_vial || r.rol_via || '';
        const peligroVial = r.peligro_vial || r.peligro_descripcion || '';
        return {
          id: r.id || `pesv_${i}`,
          label: `[${r.factor_riesgo || 'Factor Vial'}] ${peligroVial || 'Peligro Vial'} — ${r.cargo || actorVial || 'Conductor'}`,
          sublabel: `Desplazamiento: ${r.tipo_desplazamiento || 'Misional'} • Programa Paso 8: ${r.programa_paso8 || 'N/A'}`,
          badge: `${r.nivel_riesgo || 'Riesgo Vial'} (Calif: ${r.calificacion ?? ''})`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            grupo_trabajo: r.grupo_trabajo || '',
            cargo: r.cargo || '',
            actor_vial: actorVial,
            tipo_desplazamiento: r.tipo_desplazamiento || '',
            factor_riesgo: r.factor_riesgo || '',
            peligro_vial: peligroVial,
            np_cualitativo: r.np_cualitativo || '',
            np_cuantitativo: r.np_cuantitativo ?? '',
            ne_cualitativo: r.ne_cualitativo || '',
            ne_cuantitativo: r.ne_cuantitativo ?? '',
            nc_cualitativo: r.nc_cualitativo || '',
            nc_cuantitativo: r.nc_cuantitativo ?? '',
            nivel_riesgo: r.nivel_riesgo || '',
            calificacion: r.calificacion ?? '',
            aceptabilidad: r.aceptabilidad || '',
            controles_existentes_descripcion: r.controles_existentes_descripcion || '',
            controles_existentes_tipo: r.controles_existentes_tipo || '',
            tratamiento_accion: r.tratamiento_accion || '',
            programa_paso8: r.programa_paso8 || '',
            plan_accion_medio: r.plan_accion_medio || '',
            plan_accion_vehiculo: r.plan_accion_vehiculo || '',
            plan_accion_individuo: r.plan_accion_individuo || '',
            plan_accion_infraestructura: r.plan_accion_infraestructura || '',
            responsable: r.responsable || '',
            fecha_programacion: r.fecha_programacion || '',
            estado: r.estado || '',
            observaciones: r.observaciones || '',
            chartConclusions: chartConclusionsText,
            'Actor Vial (Conductor, Peatón, Pasajero, Ciclista, Motociclista)': `${actorVial} (${r.cargo || ''})`,
            'Tipo de Desplazamiento (Misional / In Itinere)': r.tipo_desplazamiento || '',
            'Factor de Riesgo Vial (Humano, Vehículo, Infraestructura, Entorno)': r.factor_riesgo || '',
            'Peligro Vial Identificado (Velocidad, Fatiga, Distracción, Alcohol, Fallas Mecánicas)': peligroVial,
            'Programa Crítico Paso 8': r.programa_paso8 || '',
            'Valoración del Riesgo Vial (Probabilidad, Exposición, Severidad y Nivel de Riesgo)': `NP=${r.np_cuantitativo ?? ''} (${r.np_cualitativo || ''}) | NE=${r.ne_cuantitativo ?? ''} (${r.ne_cualitativo || ''}) | NC=${r.nc_cuantitativo ?? ''} (${r.nc_cualitativo || ''}) | Total=${r.calificacion ?? ''} | ${r.nivel_riesgo || ''} (${r.aceptabilidad || ''})`,
            'Controles Preventivos y Correctivos PESV': `Existentes (${r.controles_existentes_tipo || ''}): ${r.controles_existentes_descripcion || ''} | Medio: ${r.plan_accion_medio || ''} | Vehículo: ${r.plan_accion_vehiculo || ''} | Individuo: ${r.plan_accion_individuo || ''} | Infraestructura: ${r.plan_accion_infraestructura || ''}`,
            'Indicadores y Metas de Siniestralidad Vial': `Responsable: ${r.responsable || ''} | Fecha: ${r.fecha_programacion || ''} | Estado: ${r.estado || ''} | Obs: ${r.observaciones || ''}`,
          },
        };
      }),
    };
  }

  // 12. Hito 1 · Matriz de Compatibilidad Química SGA (18+ Columnas Completas)
  if (canonicalId === 'hito3_quimicos_sga') {
    const ChemicalCompatibilitySession = getSafeModel('ChemicalCompatibilitySession', '~/server/routes/sgsst/matrizCompatibilidad', '~/models/ChemicalCompatibilitySession');
    const docs = await findManyCompanyDocs(ChemicalCompatibilitySession, userId, company, { isOfficial: -1, updatedAt: -1 }, 10);
    const officialDoc =
      docs.find((d) => d.isOfficial && Array.isArray(d.matrixRows) && d.matrixRows.length > 0) ||
      docs.find((d) => Array.isArray(d.matrixRows) && d.matrixRows.length > 0) ||
      docs[0] ||
      null;
    const rows = Array.isArray(officialDoc?.matrixRows) ? officialDoc.matrixRows : [];
    const sinFds = rows.filter((r) => /^no$/i.test(String(r.fds_disponible ?? r.tiene_fds ?? '').trim()) || r.fds_disponible === false).length;

    const tagReports = await fetchLatestReportsForTags(userId, company, ['sgsst-matriz-compatibilidad'], 5);
    const latestReports = mergeLatestReports(tagReports, [
      buildEmbeddedReportEntry({
        conversationId: officialDoc?.conversationId || `embedded_compat_sga_${company?._id || 'active'}`,
        title: officialDoc?.officialTitle || 'Informe Oficial Matriz de Compatibilidad Química SGA',
        html: officialDoc?.reportHtml || officialDoc?.lastGeneratedReport,
        tags: ['sgsst-matriz-compatibilidad'],
        createdAt: officialDoc?.updatedAt,
      }),
    ]);

    const chartConclusionsText = officialDoc?.chartConclusions ? formatCleanScalar(officialDoc.chartConclusions, '') : '';

    return {
      moduleTitle: 'Hito 1 · Matriz de Compatibilidad Química SGA (Dec. 1496 / ONU)',
      sourceCollection: 'ChemicalCompatibilitySession',
      latestReports,
      kpis: [
        { label: 'Sustancias Químicas SGA', value: rows.length, tone: 'teal' },
        { label: 'Con FDS Vigente', value: Math.max(0, rows.length - sinFds), tone: 'emerald' },
        { label: 'Alerta Sin FDS', value: sinFds, tone: sinFds > 0 ? 'rose' : 'emerald' },
        { label: 'Clases ONU Mapeadas', value: new Set(rows.map((r) => r.clase_onu || r.clasificacion_onu).filter(Boolean)).size, tone: 'indigo' },
      ],
      records: rows.map((r, i) => {
        const nombreSust = r.nombre_sustancia || r.nombre || '';
        const claseOnu = r.clase_onu || r.clasificacion_onu || '';
        const fdsDisp = r.fds_disponible ?? r.tiene_fds ?? '';
        const rotuladoSga = r.rotulado_sga ?? r.tiene_rotulo ?? '';
        const isCrit =
          /^no$/i.test(String(fdsDisp).trim()) ||
          fdsDisp === false ||
          /peligro/i.test(String(r.palabra_advertencia || ''));
        return {
          id: r.id || `sga_${i}`,
          label: `${nombreSust || 'Sustancia Química'} (${claseOnu || 'Clase ONU'})`,
          sublabel: `CAS: ${r.cas || 'N/A'} • UN: ${r.numero_onu || 'N/A'} • Bodega: ${r.ubicacion || 'General'} • FDS: ${fdsDisp || 'Sí'}`,
          badge: `${r.palabra_advertencia || 'SGA'} • ${(Array.isArray(r.pictogramas_sga) ? r.pictogramas_sga.join(', ') : r.pictogramas_sga) || ''}`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            nombre_sustancia: nombreSust,
            fabricante: r.fabricante || '',
            cas: r.cas || '',
            numero_onu: r.numero_onu || '',
            clase_onu: claseOnu,
            estado_fisico: r.estado_fisico || '',
            palabra_advertencia: r.palabra_advertencia || '',
            pictogramas_sga: Array.isArray(r.pictogramas_sga) ? r.pictogramas_sga.join(', ') : r.pictogramas_sga || '',
            frases_h: Array.isArray(r.frases_h) ? r.frases_h.join(', ') : r.frases_h || '',
            consejos_p: Array.isArray(r.consejos_p) ? r.consejos_p.join(', ') : r.consejos_p || '',
            ubicacion: r.ubicacion || '',
            cantidad_almacenada: r.cantidad_almacenada || '',
            fds_disponible: fdsDisp,
            rotulado_sga: rotuladoSga,
            incompatibilidades: Array.isArray(r.incompatibilidades) ? r.incompatibilidades.join(', ') : r.incompatibilidades || '',
            requisitos_almacenamiento: r.requisitos_almacenamiento || '',
            pubchem_cid: r.pubchem_cid || r.cid || '',
            chartConclusions: chartConclusionsText,
            'Nombre de la Sustancia Química y Número CAS / UN': `${nombreSust} (CAS: ${r.cas || 'N/A'} / UN: ${r.numero_onu || 'N/A'} / PubChem CID: ${r.pubchem_cid || 'N/A'})`,
            'Fabricante y Estado Físico': `${r.fabricante || ''} (${r.estado_fisico || ''})`,
            'Clasificación SGA y Pictogramas de Peligro (GHS01 a GHS09)': `${claseOnu} | Pictogramas: ${Array.isArray(r.pictogramas_sga) ? r.pictogramas_sga.join(', ') : r.pictogramas_sga || ''}`,
            'Frases H (Indicaciones de Peligro) y Frases P (Consejos de Prudencia)': `Frases H: ${r.frases_h || ''} | Consejos P: ${r.consejos_p || ''}`,
            'Matriz de Compatibilidad e Incompatibilidades de Almacenamiento': `Incompatibilidades: ${r.incompatibilidades || ''} | Almacenamiento: ${r.requisitos_almacenamiento || ''}`,
            'Ficha de Datos de Seguridad (FDS - 16 Secciones Vigente)': `FDS: ${fdsDisp || 'Sí'} | Rótulo SGA: ${rotuladoSga || 'Sí'}`,
            'EPP Específico y Kit Antiderrames Requerido': `EPP: ${r.epp_recomendado || ''} | Derrames: ${r.control_derrames || ''} | Primeros Auxilios: ${r.primeros_auxilios || ''}`,
          },
        };
      }),
    };
  }

  // 13. Hito 1 · Matriz de Oportunidades SST y Riesgos del Sistema (ISO 45001 Cl. 6.1)
  if (canonicalId === 'hito1_oportunidades_sst') {
    const OportunidadesData = getSafeModel('OportunidadesData', '~/server/routes/sgsst/oportunidades', '~/models/OportunidadesData');
    const doc = await findSingleCompanyDoc(OportunidadesData, userId, company);
    const oportunidades = Array.isArray(doc?.oportunidades) ? doc.oportunidades : [];
    const riesgos = Array.isArray(doc?.riesgosSistema) ? doc.riesgosSistema : [];

    const tagReports = await fetchLatestReportsForTags(userId, company, ['sgsst-oportunidades', 'sgsst-oportunidades-sst'], 5);
    const latestReports = mergeLatestReports(tagReports, [
      buildEmbeddedReportEntry({
        conversationId: doc?.conversationId || `embedded_oportunidades_${company?._id || 'active'}`,
        title: 'Informe Oficial Matriz de Oportunidades SST y Riesgos ISO 45001',
        html: doc?.lastGeneratedReport,
        tags: ['sgsst-oportunidades-sst'],
        createdAt: doc?.updatedAt,
      }),
    ]);

    const records = [
      ...oportunidades.map((o, i) => ({
        id: o.id || `op_${i}`,
        label: `[Oportunidad 6.1.2.3] ${o.titulo || ''}`,
        sublabel: `Categoría: ${o.categoria || ''} • Beneficio: ${o.beneficioEsperado || ''} • Resp: ${o.responsable || ''}`,
        badge: `Prioridad ${o.prioridad || o.impactoPrioridad || 'Alta'} • ${o.estado || 'En Plan'}`,
        badgeTone: 'emerald',
        isCritical: (o.prioridad || o.impactoPrioridad) === 'Alta',
        fields: {
          titulo: o.titulo || '',
          categoria: o.categoria || '',
          origenSST: o.origenSST || o.origenSst || '',
          beneficioEsperado: o.beneficioEsperado || '',
          prioridad: o.prioridad || o.impactoPrioridad || 'Alta',
          viabilidad: o.viabilidad || '',
          recursosRequeridos: o.recursosRequeridos || '',
          indicadorExito: o.indicadorExito || '',
          responsable: o.responsable || '',
          plazo: o.plazo || '',
          estado: o.estado || '',
          sentToKanban: Boolean(o.sentToKanban),
          'Oportunidad de Mejora SST Identificada': o.titulo || '',
          'Proceso / Peligro o Fuente Asociada': `${o.categoria || ''} (${o.origenSST || o.origenSst || ''})`,
          'Beneficio Esperado en Salud y Seguridad': o.beneficioEsperado || '',
          'Indicador de Éxito': o.indicadorExito || '',
          'Recursos Requeridos': o.recursosRequeridos || '',
          'Viabilidad, Costo e Impacto': `Prioridad: ${o.prioridad || 'Alta'} | Viabilidad: ${o.viabilidad || 'Alta'} | Recursos: ${o.recursosRequeridos || ''}`,
          'Plan de Implementación, Responsable y Fecha': `Resp: ${o.responsable || ''} | Plazo: ${o.plazo || ''} | Estado: ${o.estado || ''} | Kanban: ${o.sentToKanban ? 'Sí' : 'No'}`,
        },
      })),
      ...riesgos.map((rk, i) => ({
        id: rk.id || `rks_${i}`,
        label: `[Riesgo del Sistema 6.1.1] ${rk.amenaza || ''}`,
        sublabel: `Fuente: ${rk.fuenteContexto || ''} • Mitigación: ${rk.medidaMitigacion || ''}`,
        badge: `Riesgo ${rk.nivelRiesgo || 'Alto'} • ${rk.estado || 'Abierto'}`,
        badgeTone: /cr[ií]tico|alto/i.test(rk.nivelRiesgo || '') ? 'rose' : 'amber',
        isCritical: /cr[ií]tico|alto/i.test(rk.nivelRiesgo || ''),
        fields: {
          amenaza: rk.amenaza || '',
          fuenteContexto: rk.fuenteContexto || '',
          impactoSistema: rk.impactoSistema || '',
          probabilidad: rk.probabilidad || '',
          nivelRiesgo: rk.nivelRiesgo || '',
          controlExistente: rk.controlExistente || '',
          medidaMitigacion: rk.medidaMitigacion || '',
          responsableMonitoreo: rk.responsableMonitoreo || '',
          plazo: rk.plazo || '',
          estado: rk.estado || '',
          sentToKanban: Boolean(rk.sentToKanban),
          'Oportunidad de Mejora SST Identificada': `[Riesgo Sistema 6.1.1] ${rk.amenaza || ''}`,
          'Proceso / Peligro o Fuente Asociada': rk.fuenteContexto || '',
          'Control Existente': rk.controlExistente || '',
          'Beneficio Esperado en Salud y Seguridad': rk.medidaMitigacion || '',
          'Viabilidad, Costo e Impacto': `Impacto: ${rk.impactoSistema || ''} | Probabilidad: ${rk.probabilidad || ''} | Nivel: ${rk.nivelRiesgo || ''}`,
          'Plan de Implementación, Responsable y Fecha': `Resp: ${rk.responsableMonitoreo || ''} | Plazo: ${rk.plazo || ''} | Estado: ${rk.estado || ''} | Kanban: ${rk.sentToKanban ? 'Sí' : 'No'}`,
        },
      })),
    ];

    return {
      moduleTitle: 'Hito 1 · Matriz de Oportunidades SST y Riesgos del Sistema (ISO 45001 Cl. 6.1)',
      sourceCollection: 'OportunidadesData',
      latestReports,
      kpis: [
        { label: 'Oportunidades SST', value: oportunidades.length, tone: 'emerald' },
        { label: 'Riesgos del Sistema', value: riesgos.length, tone: 'rose' },
        { label: 'Prioridad Alta / Críticos', value: records.filter((r) => r.isCritical).length, tone: 'amber' },
      ],
      records,
    };
  }

  // 14. Hito 1 · Análisis de Amenazas y Vulnerabilidad (Diamante de Riesgo IDIGER)
  if (canonicalId === 'hito6_vulnerabilidad') {
    const AnalisisVulnerabilidadData = getSafeModel('AnalisisVulnerabilidadData', '~/server/routes/sgsst/analisisVulnerabilidad');
    const doc = await findSingleCompanyDoc(AnalisisVulnerabilidadData, userId, company);
    const amenazas = Array.isArray(doc?.formData?.amenazasList)
      ? doc.formData.amenazasList
      : Array.isArray(doc?.amenazasList)
        ? doc.amenazasList
        : [];
    const evaluadoresList = Array.isArray(doc?.evaluadoresList) ? doc.evaluadoresList : [];
    const evaluadoresStr = evaluadoresList
      .map((ev) => `${ev.nombre || ''} (${ev.rol || 'Evaluador'} - CC ${ev.cedula || 'N/A'})`)
      .join(' | ');

    const tagReports = await fetchLatestReportsForTags(userId, company, ['sgsst-vulnerabilidad'], 5);
    const latestReports = mergeLatestReports(tagReports, [
      buildEmbeddedReportEntry({
        conversationId: doc?.conversationId || `embedded_vuln_${company?._id || 'active'}`,
        title: 'Informe Oficial Análisis de Amenazas y Vulnerabilidad IDIGER',
        html: doc?.lastGeneratedReport || doc?.reportHtml,
        tags: ['sgsst-vulnerabilidad'],
        createdAt: doc?.updatedAt,
      }),
    ]);

    const getIdigerColorFromPoints = (pts) => {
      const n = Number(pts);
      if (!Number.isFinite(n)) return 'AMARILLO';
      if (n <= 1.0) return 'VERDE';
      if (n <= 2.0) return 'AMARILLO';
      return 'ROJO';
    };
    const getIdigerVulnLabel = (color) => {
      const up = String(color || '').toUpperCase();
      if (up.includes('ROJO') || up.includes('ALTA')) return 'Alta (Rojo)';
      if (up.includes('AMARILLO') || up.includes('MEDIA')) return 'Media (Amarillo)';
      return 'Baja (Verde)';
    };
    const getThreatColor = (nivel) => {
      const low = String(nivel || '').toLowerCase();
      if (low.includes('inminente')) return 'ROJO';
      if (low.includes('probable')) return 'AMARILLO';
      return 'VERDE';
    };
    const computeDiamondRisk = (amCol, pCol, rCol, sCol) => {
      let rojos = 0;
      let amarillos = 0;
      for (const c of [amCol, pCol, rCol, sCol]) {
        const up = String(c || '').toUpperCase();
        if (up.includes('ROJO')) rojos++;
        else if (up.includes('AMARILLO')) amarillos++;
      }
      if (rojos >= 3 || (rojos >= 2 && amarillos >= 2) || (rojos >= 1 && amarillos === 3)) return 'ALTO';
      if ((rojos >= 1 && amarillos >= 1) || amarillos >= 3) return 'MEDIO';
      return 'BAJO';
    };

    const computedRecords = amenazas.map((a, i) => {
      const ptsPers = a.puntajePersonas ?? a.ptsPers ?? 0;
      const ptsRec = a.puntajeRecursos ?? a.ptsRec ?? 0;
      const ptsSist = a.puntajeSistemas ?? a.ptsSist ?? 0;
      const colorPers = a.colorPers || a.vulnerabilidadPersonas || getIdigerColorFromPoints(ptsPers);
      const colorRec = a.colorRec || a.vulnerabilidadRecursos || getIdigerColorFromPoints(ptsRec);
      const colorSist = a.colorSist || a.vulnerabilidadSistemas || getIdigerColorFromPoints(ptsSist);
      const colorAmenaza = a.colorAmenaza || getThreatColor(a.nivelAmenaza);
      const computedRisk = a.nivelRiesgo || a.riskLevel || computeDiamondRisk(colorAmenaza, colorPers, colorRec, colorSist);
      const isCrit = /alto/i.test(computedRisk) || /inminente/i.test(a.nivelAmenaza || '');

      return {
        id: a.id || `vuln_${i}`,
        label: `${a.amenaza || 'Amenaza'} (${a.origenAmenaza || 'Natural/Tecnológica'})`,
        sublabel: `Calificación: ${a.nivelAmenaza || 'Probable'} • Personas: ${ptsPers} (${getIdigerVulnLabel(colorPers)}) | Recursos: ${ptsRec} (${getIdigerVulnLabel(colorRec)}) | Sistemas: ${ptsSist} (${getIdigerVulnLabel(colorSist)})`,
        badge: `Riesgo ${String(computedRisk).toUpperCase()}`,
        badgeTone: isCrit ? 'rose' : /medio/i.test(computedRisk) ? 'amber' : 'emerald',
        isCritical: isCrit,
        fields: {
          amenaza: a.amenaza || '',
          origenAmenaza: a.origenAmenaza || '',
          nivelAmenaza: a.nivelAmenaza || '',
          colorAmenaza,
          descripcionGlobal: a.descripcionGlobal || '',
          puntajePersonas: ptsPers,
          puntajeRecursos: ptsRec,
          puntajeSistemas: ptsSist,
          vulnerabilidadPersonas: getIdigerVulnLabel(colorPers),
          vulnerabilidadRecursos: getIdigerVulnLabel(colorRec),
          vulnerabilidadSistemas: getIdigerVulnLabel(colorSist),
          nivelRiesgo: String(computedRisk).toUpperCase(),
          evaluadoresList: evaluadoresStr,
          'Amenazas Identificadas (Naturales, Tecnológicas y Sociales)': `${a.amenaza || ''} (${a.origenAmenaza || ''})`,
          'Calificación de la Amenaza (Posible / Probable / Inminente)': `${a.nivelAmenaza || ''} (${colorAmenaza})`,
          'Vulnerabilidad en las Personas (Gestión, Capacitación y Características)': `${ptsPers} — ${getIdigerVulnLabel(colorPers)}`,
          'Vulnerabilidad en los Recursos (Suministros, Edificación y Equipos)': `${ptsRec} — ${getIdigerVulnLabel(colorRec)}`,
          'Vulnerabilidad en los Sistemas y Procesos (Servicios, Sistemas Alternos y Recuperación)': `${ptsSist} — ${getIdigerVulnLabel(colorSist)}`,
          'Diamante de Riesgo y Nivel de Vulnerabilidad (Bajo / Medio / Alto)': `Riesgo ${String(computedRisk).toUpperCase()} | Escenario: ${a.descripcionGlobal || ''} | Evaluadores: ${evaluadoresStr}`,
        },
      };
    });

    const altos = computedRecords.filter((r) => r.isCritical).length;

    return {
      moduleTitle: 'Hito 1 · Análisis de Amenazas y Vulnerabilidad (Diamante IDIGER)',
      sourceCollection: 'AnalisisVulnerabilidadData',
      latestReports,
      kpis: [
        { label: 'Amenazas Evaluadas', value: computedRecords.length, tone: 'teal' },
        { label: 'Nivel de Riesgo ALTO', value: altos, tone: altos > 0 ? 'rose' : 'emerald' },
        { label: 'Comité Evaluador', value: evaluadoresList.length, tone: 'indigo' },
      ],
      records: computedRecords,
    };
  }

  // 15. Hito 1 · Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE — 7 Secciones Completas)
  if (canonicalId === 'hito1_plan_emergencias') {
    const PlanEmergenciasData = getSafeModel('PlanEmergenciasData', '~/server/routes/sgsst/planEmergencias', '~/models/PlanEmergenciasData');
    const doc = await findSingleCompanyDoc(PlanEmergenciasData, userId, company);
    const sd = doc?.sedeData || null;
    const escenarios = Array.isArray(doc?.escenariosAmenaza) ? doc.escenariosAmenaza : [];
    const sci = Array.isArray(doc?.estructuraSci) ? doc.estructuraSci : [];
    const pons = Array.isArray(doc?.procedimientosPon) ? doc.procedimientosPon : [];
    const equipos = Array.isArray(doc?.recursosEquipos) ? doc.recursosEquipos : [];
    const directorios = Array.isArray(doc?.directoriosExternos) ? doc.directoriosExternos : [];
    const simulacros = Array.isArray(doc?.simulacrosPlan) ? doc.simulacrosPlan : [];

    const tagReports = await fetchLatestReportsForTags(userId, company, ['sgsst-plan-emergencias'], 5);
    const latestReports = mergeLatestReports(tagReports, [
      buildEmbeddedReportEntry({
        conversationId: doc?.conversationId || `embedded_ppre_${company?._id || 'active'}`,
        title: 'Informe Oficial Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE)',
        html: doc?.lastGeneratedReport,
        tags: ['sgsst-plan-emergencias'],
        createdAt: doc?.updatedAt,
      }),
    ]);

    const records = [
      ...(doc && sd
        ? [
            {
              id: `ppre_sede_${company?._id || 'main'}`,
              label: `[Ficha Sede & MEDEVAC] ${sd.nombreSede || 'Sede Principal'} (${sd.ciudad || company?.city || ''})`,
              sublabel: `Dirección: ${sd.direccion || company?.address || ''} • Punto Encuentro: ${sd.puntoEncuentroPrincipal || ''} • MEDEVAC: ${sd.clinicaMedevac || ''}`,
              badge: 'SECCIÓN 1 · SEDE & MEDEVAC',
              badgeTone: 'teal',
              isCritical: false,
              fields: {
                section: 'sedeData',
                nombreSede: sd.nombreSede || '',
                ciudad: sd.ciudad || '',
                direccion: sd.direccion || '',
                telefonoEmergencia: sd.telefonoEmergencia || '',
                horarioOperacion: sd.horarioOperacion || '',
                trabajadoresFijos: sd.trabajadoresFijos ?? 0,
                contratistasFlotantes: sd.contratistasFlotantes ?? 0,
                visitantesPromedio: sd.visitantesPromedio ?? 0,
                construccionTipo: sd.construccionTipo || '',
                puntoEncuentroPrincipal: sd.puntoEncuentroPrincipal || '',
                puntoEncuentroAlterno: sd.puntoEncuentroAlterno || '',
                rutasEvacuacionDesc: sd.rutasEvacuacionDesc || '',
                sistemaAlarma: sd.sistemaAlarma || '',
                clinicaMedevac: sd.clinicaMedevac || '',
                direccionClinica: sd.direccionClinica || '',
                tiempoTrasladoMedevac: sd.tiempoTrasladoMedevac || '',
                ambulanciaContacto: sd.ambulanciaContacto || '',
                arlNombre: sd.arlNombre || company?.arl || '',
                arlLineaEmergencia: sd.arlLineaEmergencia || '',
                'Rutas de Evacuación, Puntos de Encuentro y Sistema de Alarma': `Principal: ${sd.puntoEncuentroPrincipal || ''} | Alterno: ${sd.puntoEncuentroAlterno || ''} | Rutas: ${sd.rutasEvacuacionDesc || ''} | Alarma: ${sd.sistemaAlarma || ''}`,
                'Plan de Evacuación Médica (MEDEVAC) y Centros Asistenciales Cercanos': `Clínica: ${sd.clinicaMedevac || ''} (${sd.direccionClinica || ''}) | Traslado: ${sd.tiempoTrasladoMedevac || ''} | Ambulancia: ${sd.ambulanciaContacto || ''} | ARL: ${sd.arlNombre || ''} (${sd.arlLineaEmergencia || ''})`,
              },
            },
          ]
        : []),
      ...escenarios.map((e, i) => ({
        id: e.id || `esc_${i}`,
        label: `[Escenario: ${e.amenaza || 'Amenaza'}] (${e.tipo || 'Natural'})`,
        sublabel: `Área: ${e.areaAfectada || 'Toda la sede'} • Prevención: ${e.medidasPrevencion || ''}`,
        badge: `Riesgo ${e.riesgoGlobal || 'Alto'}`,
        badgeTone: /alto/i.test(e.riesgoGlobal || '') ? 'rose' : 'amber',
        isCritical: /alto/i.test(e.riesgoGlobal || ''),
        fields: {
          section: 'escenariosAmenaza',
          amenaza: e.amenaza || '',
          tipo: e.tipo || '',
          origenSst: e.origenSst || '',
          calificacionDiamante: e.calificacionDiamante || '',
          nivelVulnerabilidad: e.nivelVulnerabilidad || '',
          riesgoGlobal: e.riesgoGlobal || '',
          areaAfectada: e.areaAfectada || '',
          medidasPrevencion: e.medidasPrevencion || '',
          medidasMitigacion: e.medidasMitigacion || '',
          responsable: e.responsable || '',
          sentToKanban: Boolean(e.sentToKanban),
          'Escenario de Amenaza': `${e.amenaza || ''} (${e.tipo || ''})`,
          'Riesgo Global': e.riesgoGlobal || '',
          'Medidas de Prevención y Mitigación': `${e.medidasPrevencion || ''} | ${e.medidasMitigacion || ''}`,
          'Responsable': e.responsable || '',
        },
      })),
      ...sci.map((s, i) => ({
        id: s.id || `sci_${i}`,
        label: `[SCI · ${s.rolSci || 'Rol SCI'}] ${s.nombreAsignado || 'Por asignar'} (${s.cargoEmpresa || ''})`,
        sublabel: `Especialidad: ${s.especialidadBrigada || ''} • Tel: ${s.telefonoContacto || ''}`,
        badge: 'SECCIÓN 3 · COMANDO SCI',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          section: 'estructuraSci',
          rolSci: s.rolSci || '',
          nombreAsignado: s.nombreAsignado || '',
          cargoEmpresa: s.cargoEmpresa || '',
          telefonoContacto: s.telefonoContacto || '',
          especialidadBrigada: s.especialidadBrigada || '',
          funcionesAntes: s.funcionesAntes || '',
          funcionesDurante: s.funcionesDurante || '',
          funcionesDespues: s.funcionesDespues || '',
          origenSst: s.origenSst || '',
          'Estructura del Comité de Emergencias y Cadena de Mando (SCI)': `${s.rolSci || ''}: ${s.nombreAsignado || ''} (${s.cargoEmpresa || ''}) - Antes: ${s.funcionesAntes || ''} | Durante: ${s.funcionesDurante || ''} | Después: ${s.funcionesDespues || ''}`,
        },
      })),
      ...pons.map((p, i) => ({
        id: p.id || `pon_${i}`,
        label: `[PON ${p.codigo || i + 1}] ${p.tituloEscenario || p.amenazaAsociada || 'Procedimiento Operativo Normalizado'}`,
        sublabel: `Amenaza: ${p.amenazaAsociada || ''} • Resp: ${p.responsableOperativo || 'Comandante SCI'}`,
        badge: p.estado || 'Vigente',
        badgeTone: 'teal',
        isCritical: false,
        fields: {
          section: 'procedimientosPon',
          codigo: p.codigo || '',
          tituloEscenario: p.tituloEscenario || '',
          amenazaAsociada: p.amenazaAsociada || '',
          faseAntes: p.faseAntes || '',
          faseDurante: p.faseDurante || '',
          faseDespues: p.faseDespues || '',
          recursosNecesarios: p.recursosNecesarios || '',
          responsableOperativo: p.responsableOperativo || '',
          estado: p.estado || 'Vigente',
          sentToKanban: Boolean(p.sentToKanban),
          'Procedimientos Operativos Normalizados (PON por Amenaza)': `${p.codigo || ''} - ${p.tituloEscenario || ''}: Antes: ${p.faseAntes || ''} | Durante: ${p.faseDurante || ''} | Después: ${p.faseDespues || ''} | Recursos: ${p.recursosNecesarios || ''}`,
        },
      })),
      ...equipos.map((eq, i) => {
        const eqCrit = eq.estado && !/operativo/i.test(eq.estado);
        return {
          id: eq.id || `rec_eq_${i}`,
          label: `[Recurso Emergencia · ${eq.tipoRecurso || 'Equipo'}] ${eq.descripcion || ''}`,
          sublabel: `Ubicación: ${eq.ubicacion || ''} • Cant: ${eq.cantidad ?? 1} • Inspección: ${eq.fechaInspeccion || 'N/A'}`,
          badge: eq.estado || 'Operativo',
          badgeTone: eqCrit ? 'rose' : 'emerald',
          isCritical: Boolean(eqCrit),
          fields: {
            section: 'recursosEquipos',
            tipoRecurso: eq.tipoRecurso || '',
            descripcion: eq.descripcion || '',
            ubicacion: eq.ubicacion || '',
            cantidad: eq.cantidad ?? 1,
            estado: eq.estado || 'Operativo',
            fechaInspeccion: eq.fechaInspeccion || '',
            responsable: eq.responsable || '',
            'Inventario de Recursos para Atención de Emergencias': `${eq.tipoRecurso || ''}: ${eq.descripcion || ''} (${eq.ubicacion || ''}, Cant: ${eq.cantidad ?? 1}, Estado: ${eq.estado || 'Operativo'})`,
          },
        };
      }),
      ...directorios.map((dir, i) => ({
        id: dir.id || `dir_ext_${i}`,
        label: `[Apoyo Externo] ${dir.entidad || 'Entidad de Socorro'} — Tel: ${dir.lineaTelefonica || ''}`,
        sublabel: `Apoyo: ${dir.tipoApoyo || ''} • Distancia/Dir: ${dir.direccionDistancia || ''} • Respuesta: ${dir.tiempoRespuestaEstimado || ''}`,
        badge: 'DIRECTORIO EXTERNO',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          section: 'directoriosExternos',
          entidad: dir.entidad || '',
          lineaTelefonica: dir.lineaTelefonica || '',
          direccionDistancia: dir.direccionDistancia || '',
          tipoApoyo: dir.tipoApoyo || '',
          tiempoRespuestaEstimado: dir.tiempoRespuestaEstimado || '',
        },
      })),
      ...simulacros.map((sim, i) => ({
        id: sim.id || `ppre_sim_${i}`,
        label: `[Simulacro PPRE] ${sim.tituloSimulacro || sim.escenario || 'Simulacro'}`,
        sublabel: `Fecha: ${sim.fechaProgramada || ''} • Meta: ${sim.tiempoRespuestaMeta || ''} • Participantes: ${sim.participantesEsperados ?? ''}`,
        badge: sim.estado || 'Programado',
        badgeTone: sim.estado === 'Ejecutado' || sim.estado === 'Evaluado' ? 'emerald' : 'amber',
        isCritical: Boolean(sim.hallazgosMejora),
        fields: {
          section: 'simulacrosPlan',
          tituloSimulacro: sim.tituloSimulacro || '',
          escenario: sim.escenario || '',
          fechaProgramada: sim.fechaProgramada || '',
          participantesEsperados: sim.participantesEsperados ?? 0,
          tiempoRespuestaMeta: sim.tiempoRespuestaMeta || '',
          estado: sim.estado || 'Programado',
          hallazgosMejora: sim.hallazgosMejora || '',
          responsable: sim.responsable || '',
          sentToKanban: Boolean(sim.sentToKanban),
        },
      })),
    ];

    return {
      moduleTitle: 'Hito 1 · Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE)',
      sourceCollection: 'PlanEmergenciasData',
      latestReports,
      kpis: [
        { label: 'Escenarios / PONs', value: `${escenarios.length} / ${pons.length}`, tone: 'teal' },
        { label: 'Comando SCI / Equipos', value: `${sci.length} / ${equipos.length}`, tone: 'indigo' },
        { label: 'Directorio / Simulacros', value: `${directorios.length} / ${simulacros.length}`, tone: 'emerald' },
        { label: 'Alertas Críticas PPRE', value: records.filter((r) => r.isCritical).length, tone: 'rose' },
      ],
      records,
    };
  }

  // 16. Hito 2 · Perfiles de Cargo Biocéntricos y Profesiograma
  if (canonicalId === 'hito2_perfiles_cargo') {
    const PerfilCargoData = getSafeModel('PerfilCargoData', '~/server/routes/sgsst/perfilesCargo');
    const doc = await findSingleCompanyDoc(PerfilCargoData, userId, company);
    const perfiles = Array.isArray(doc?.perfilesList) ? doc.perfilesList : [];

    const tagReports = await fetchLatestReportsForTags(userId, company, ['sgsst-perfil-cargo'], 5);
    const embeddedCargoReports = perfiles
      .filter((p) => p?.report && String(p.report).trim().length > 20)
      .map((p, idx) =>
        buildEmbeddedReportEntry({
          conversationId: `embedded_perfil_cargo_${p.id || idx}`,
          title: `Perfil de Cargo y Profesiograma — ${p.nombreCargo || `Cargo #${idx + 1}`}`,
          html: p.report,
          tags: ['sgsst-perfil-cargo'],
          createdAt: doc?.updatedAt,
        }),
      );
    const latestReports = mergeLatestReports(tagReports, embeddedCargoReports);

    return {
      moduleTitle: 'Hito 2 · Perfiles de Cargo Biocéntricos & Profesiograma',
      sourceCollection: 'PerfilCargoData',
      latestReports,
      kpis: [
        { label: 'Perfiles de Cargo', value: perfiles.length, tone: 'teal' },
        { label: 'Con Informe Profesiograma', value: perfiles.filter((p) => p.report).length, tone: 'emerald' },
        { label: 'Operan Maquinaria', value: perfiles.filter((p) => p.operaMaquinaria === 'Sí' || p.operaMaquinaria === true).length, tone: 'amber' },
        { label: 'Exigencia Física Alta', value: perfiles.filter((p) => p.exigenciaFisica === 'Alta').length, tone: 'rose' },
      ],
      records: perfiles.map((p, i) => {
        const operaMaq = p.operaMaquinaria === true ? 'Sí' : p.operaMaquinaria === false ? 'No' : p.operaMaquinaria || 'No';
        return {
          id: p.id || p.nombreCargo || `cargo_${i}`,
          label: `${p.nombreCargo || 'Cargo'} (${p.area || 'Área General'})`,
          sublabel: `Nivel: ${p.nivelCargo || 'Operativo'} • Vacantes: ${p.numVacantes ?? 1} • Exigencia Física: ${p.exigenciaFisica || 'Media'} / Mental: ${p.exigenciaMental || 'Media'}`,
          badge: operaMaq === 'Sí' ? 'Opera Maquinaria' : `${(p.eppSeleccionados || []).length} EPP Asignados`,
          badgeTone: p.exigenciaFisica === 'Alta' ? 'rose' : 'indigo',
          isCritical: p.exigenciaFisica === 'Alta' || operaMaq === 'Sí',
          fields: {
            nombreCargo: p.nombreCargo || '',
            area: p.area || '',
            nivelCargo: p.nivelCargo || '',
            sectorOrganizacion: p.sectorOrganizacion || '',
            tipoContrato: p.tipoContrato || '',
            jornada: p.jornada || '',
            jefeInmediato: p.jefeInmediato || '',
            escalasSalarial: p.escalasSalarial || p.escalaSalarial || '',
            numVacantes: p.numVacantes ?? 1,
            contextoAdicional: p.contextoAdicional || '',
            eppSeleccionados: Array.isArray(p.eppSeleccionados) ? p.eppSeleccionados.join(', ') : p.eppSeleccionados || '',
            entrenamientosSeleccionados: Array.isArray(p.entrenamientosSeleccionados)
              ? p.entrenamientosSeleccionados.join(', ')
              : p.entrenamientosSeleccionados || '',
            controlesFuenteSeleccionados: Array.isArray(p.controlesFuenteSeleccionados)
              ? p.controlesFuenteSeleccionados.join(', ')
              : p.controlesFuenteSeleccionados || '',
            controlesMedioSeleccionados: Array.isArray(p.controlesMedioSeleccionados)
              ? p.controlesMedioSeleccionados.join(', ')
              : p.controlesMedioSeleccionados || '',
            exigenciaFisica: p.exigenciaFisica || 'Media',
            exigenciaMental: p.exigenciaMental || 'Media',
            operaMaquinaria: operaMaq,
            'Nombre del Cargo y Área / Proceso': `${p.nombreCargo || ''} (${p.area || ''})`,
            'Nombre del Cargo': p.nombreCargo || '',
            'Área / Departamento': p.area || '',
            'Jefe Inmediato y Sector': `Jefe: ${p.jefeInmediato || 'N/A'} | Sector: ${p.sectorOrganizacion || 'N/A'}`,
            'Escala Salarial y Vacantes': `Escala: ${p.escalasSalarial || p.escalaSalarial || 'N/A'} | Vacantes: ${p.numVacantes ?? 1}`,
            'Objetivo y Funciones Principales del Cargo': p.contextoAdicional || '',
            'Competencias Requeridas (Educación, Formación, Experiencia)': `Nivel: ${p.nivelCargo || ''} | Jornada: ${p.jornada || ''} | Contrato: ${p.tipoContrato || ''}`,
            'Exigencias Biomecánicas, Mentales y Físicas del Puesto': `Física: ${p.exigenciaFisica || 'Media'} | Mental: ${p.exigenciaMental || 'Media'} | Opera Maquinaria: ${operaMaq}`,
            'Controles en Fuente y Medio del Cargo': `Fuente: ${(p.controlesFuenteSeleccionados || []).join(', ')} | Medio: ${(p.controlesMedioSeleccionados || []).join(', ')}`,
            'Peligros y Riesgos Asociados al Cargo': (p.controlesFuenteSeleccionados || []).concat(p.controlesMedioSeleccionados || []).join(', '),
            'Profesiograma (Exámenes Médicos de Ingreso, Periódicos, Retiro y Post-Incapacidad)':
              p.report ? stripHtmlToText(p.report).slice(0, 500) : 'Según matriz clínica del cargo Res. 1843 de 2025',
            'EPP Requeridos por el Cargo': Array.isArray(p.eppSeleccionados) ? p.eppSeleccionados.join(', ') : '',
            'Capacitaciones y Certificaciones Obligatorias (Ej. Alturas, Espacios Confinados, Vial)': Array.isArray(p.entrenamientosSeleccionados)
              ? p.entrenamientosSeleccionados.join(', ')
              : '',
          },
        };
      }),
    };
  }

  // 17, 18, 19. Hito 2 · Perfil Sociodemográfico, Condiciones de Salud y Compatibilidad Trabajador-Cargo
  if (['hito2_perfil_socio', 'hito2_condiciones_salud', 'hito2_oraculo_predictivo'].includes(canonicalId)) {
    const PerfilSociodemograficoData = getSafeModel('PerfilSociodemograficoData', '~/server/routes/sgsst/perfilSociodemografico', '~/models/PerfilSociodemograficoData');
    const SgsstWorker = getSafeModel('SgsstWorker', '~/server/routes/sgsst/workers', '~/models/SgsstWorker');

    const socioDoc = await findSingleCompanyDoc(PerfilSociodemograficoData, userId, company);
    const socioList = Array.isArray(socioDoc?.trabajadores) ? socioDoc.trabajadores : [];
    const pendingSocio = Array.isArray(socioDoc?.actualizacionesPendientes) ? socioDoc.actualizacionesPendientes : [];
    const pendingSalud = Array.isArray(socioDoc?.actualizacionesPendientesSalud) ? socioDoc.actualizacionesPendientesSalud : [];
    const workerDocs = await findManyCompanyDocs(SgsstWorker, userId, company, { updatedAt: -1 }, 300);

    const reportTagsMap = {
      hito2_perfil_socio: ['sgsst-perfil-sociodemografico'],
      hito2_condiciones_salud: ['sgsst-condiciones-salud'],
      hito2_oraculo_predictivo: ['sgsst-oraculo-h1', 'sgsst-predictivo-ia'],
    };
    const tagReports = await fetchLatestReportsForTags(userId, company, reportTagsMap[canonicalId], 5);
    const embeddedOracleReports = [];
    if (canonicalId === 'hito2_oraculo_predictivo') {
      for (let i = 0; i < socioList.length; i++) {
        const sw = socioList[i];
        if (sw?.dictamenPredictivoH1 && String(sw.dictamenPredictivoH1).trim().length > 20) {
          embeddedOracleReports.push(
            buildEmbeddedReportEntry({
              conversationId: `embedded_dictamen_h1_${sw.identificacion || sw.documento || i}`,
              title: `Dictamen Predictivo H1 — ${sw.nombre || 'Colaborador'} (CC ${sw.identificacion || sw.documento || ''})`,
              html: sw.dictamenPredictivoH1,
              tags: ['sgsst-oraculo-h1'],
              createdAt: sw.bioScoreIADate || socioDoc?.updatedAt,
            }),
          );
        }
      }
      for (let i = 0; i < workerDocs.length; i++) {
        const wd = workerDocs[i];
        if (wd?.bioReportContent && String(wd.bioReportContent).trim().length > 20) {
          embeddedOracleReports.push(
            buildEmbeddedReportEntry({
              conversationId: `embedded_bioreport_${wd.documento || i}`,
              title: `Informe Bio-Individual — ${wd.nombre || 'Colaborador'} (CC ${wd.documento || ''})`,
              html: wd.bioReportContent,
              tags: ['sgsst-predictivo-ia'],
              createdAt: wd.updatedAt,
            }),
          );
        }
      }
    }
    const latestReports = mergeLatestReports(tagReports, embeddedOracleReports.slice(0, 10));

    // Indexar SgsstWorker por documento/cédula y por nombre normalizado
    const workerByCedula = new Map();
    const workerByName = new Map();
    for (const w of workerDocs) {
      const ced = String(w.documento || '').trim();
      if (ced) workerByCedula.set(ced, w);
      const nm = String(w.nombre || '').trim().toLowerCase();
      if (nm && !workerByName.has(nm)) workerByName.set(nm, w);
    }

    const unifiedWorkers = [];
    const seenCedulas = new Set();
    const matchedWorkerIds = new Set();

    const isExpiryOnlyFilter =
      nodeConfig?.recordFilterMode === 'expiry_only' || Array.isArray(nodeConfig?.expiryAuditScope);

    for (const sw of socioList) {
      const ced = String(sw.identificacion || sw.documento || sw.cedula || '').trim();
      const nm = String(sw.nombre || '').trim().toLowerCase();
      if (ced) seenCedulas.add(ced);
      const wDoc = (ced ? workerByCedula.get(ced) : null) || (nm ? workerByName.get(nm) : null) || null;
      if (wDoc?._id) matchedWorkerIds.add(String(wDoc._id));
      unifiedWorkers.push(buildUnifiedWorkerRecord(sw, wDoc, canonicalId, nodeConfig));
    }

    for (const wDoc of workerDocs) {
      const ced = String(wDoc.documento || '').trim();
      if ((ced && seenCedulas.has(ced)) || (wDoc?._id && matchedWorkerIds.has(String(wDoc._id)))) continue;
      if (ced) seenCedulas.add(ced);
      unifiedWorkers.push(buildUnifiedWorkerRecord({}, wDoc, canonicalId, nodeConfig));
    }

    const pendingRecords = [];
    if (canonicalId === 'hito2_perfil_socio') {
      pendingSocio.forEach((p, idx) => {
        const pd = p.data || p;
        const ced = pd.identificacion || pd.documento || pd.cedula || p.cedula || '';
        const nom = pd.nombre || p.nombre || 'Colaborador';
        const st = p.status || p.estado || 'pending';
        if (st === 'approved' || st === 'rejected' || st === 'dismissed') return;
        pendingRecords.push({
          id: p.id || `pend_socio_${idx}`,
          label: `[Actualización QR Pendiente] ${nom} (CC ${ced})`,
          sublabel: `Cargo: ${pd.cargo || ''} • EPS: ${pd.eps || ''} • Tel: ${pd.telefono || ''}`,
          badge: 'PENDIENTE APROBAR QR',
          badgeTone: 'amber',
          isCritical: !isExpiryOnlyFilter,
          fields: {
            nombre: nom,
            documento: ced,
            cargo: pd.cargo || '',
            area: pd.areaTrabajo || pd.area || '',
            telefono: pd.telefono || '',
            correoElectronico: pd.correoElectronico || '',
            direccion: pd.direccion || '',
            eps: pd.eps || '',
            arl: pd.arl || '',
            afp: pd.afp || '',
            estado: st,
            modalidad: 'Actualización QR Sociodemográfica Pendiente',
          },
        });
      });
    } else if (canonicalId === 'hito2_condiciones_salud') {
      pendingSalud.forEach((p, idx) => {
        const pd = p.data || p;
        const ced = pd.identificacion || pd.documento || pd.cedula || p.cedula || '';
        const nom = pd.nombre || p.nombre || 'Colaborador';
        const st = p.status || p.estado || 'pending';
        if (st === 'approved' || st === 'rejected' || st === 'dismissed') return;
        pendingRecords.push({
          id: p.id || `pend_salud_${idx}`,
          label: `[Autorreporte Salud QR Pendiente] ${nom} (CC ${ced})`,
          sublabel: `Enfermedades: ${pd.enfermedades || 'N/A'} • Limitaciones: ${pd.limitacionesBiomecanicas || 'N/A'}`,
          badge: 'AUTORREPORTE SALUD PENDIENTE',
          badgeTone: 'rose',
          isCritical: !isExpiryOnlyFilter,
          fields: {
            nombre: nom,
            documento: ced,
            cargo: pd.cargo || '',
            enfermedades: pd.enfermedades || '',
            diagnosticoMedico: pd.diagnosticoMedico || '',
            medicamentos: pd.medicamentos || '',
            presionArterial: pd.presionArterial || '',
            frecuenciaCardiaca: pd.frecuenciaCardiaca || '',
            limitacionesBiomecanicas: pd.limitacionesBiomecanicas || '',
            alergiasQuimicas: pd.alergiasQuimicas || '',
            alimentacion: pd.alimentacion || '',
            riesgoCardiovascular: pd.riesgoCardiovascular || '',
            terapiaPsicologica: pd.terapiaPsicologica || '',
            estado: st,
            modalidad: 'Autorreporte QR de Condiciones de Salud Pendiente',
          },
        });
      });
    }

    const allRecords = [...unifiedWorkers, ...pendingRecords];
    const total = unifiedWorkers.length;
    const critCount = allRecords.filter((r) => r.isCritical).length;
    const avgFit =
      total > 0
        ? Math.round(unifiedWorkers.reduce((acc, r) => acc + (Number(r._fitScore) || 85), 0) / total)
        : 0;

    const titles = {
      hito2_perfil_socio: 'Hito 2 · Perfil Sociodemográfico y Base de Trabajadores',
      hito2_condiciones_salud: 'Hito 2 · Diagnóstico de Condiciones de Salud y EMOs',
      hito2_oraculo_predictivo: 'Hito 2 · Compatibilidad Trabajador-Cargo & Tarjetas Preventivas (Bio-Individuo)',
    };

    return {
      moduleTitle: titles[canonicalId],
      sourceCollection: 'PerfilSociodemograficoData + SgsstWorker',
      latestReports,
      kpis: [
        { label: 'Trabajadores Registrados', value: total, tone: 'teal' },
        { label: 'FIT Score Promedio', value: `${avgFit}%`, tone: avgFit >= 80 ? 'emerald' : avgFit >= 60 ? 'amber' : 'rose' },
        { label: 'Con Alertas / Pendientes', value: critCount, tone: critCount > 0 ? 'rose' : 'emerald' },
        { label: 'Activos en Nómina', value: unifiedWorkers.filter((w) => w._activo).length, tone: 'indigo' },
      ],
      records: allRecords,
    };
  }

  return null;
}

function recursosSummary(equipos) {
  if (!Array.isArray(equipos) || equipos.length === 0) return 'Sin equipos registrados';
  return equipos.map((e) => `${e.tipoRecurso || e.categoria || 'Equipo'}: ${e.descripcion || ''} (${e.ubicacion || ''})`).join(' ; ');
}

function parseFlexibleDateMs(rawVal) {
  if (!rawVal) return null;
  if (rawVal instanceof Date) {
    const ms = rawVal.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  const s = String(rawVal).trim();
  if (!s || /^(n\/a|na|no registra|sin registro|no aplica|vigente|pendiente|s\/d|-)$/i.test(s)) {
    return null;
  }
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const ms = Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return Number.isFinite(ms) ? ms : null;
  }
  const ymd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const ms = Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    return Number.isFinite(ms) ? ms : null;
  }
  const dt = new Date(s);
  const ms = dt.getTime();
  return Number.isFinite(ms) ? ms : null;
}

function formatMsToIsoDate(ms) {
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toISOString().slice(0, 10);
}

function isDateExpiredOrWithinDays(rawVal, daysThreshold = 30) {
  const targetMs = parseFlexibleDateMs(rawVal);
  if (targetMs === null) return false;
  const now = new Date();
  const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const horizonMs = todayUtcMs + Number(daysThreshold) * 86400000;
  return targetMs <= horizonMs;
}

function isAnnualDateExpiredOrWithinDays(rawStartDateVal, daysThreshold = 30) {
  const startMs = parseFlexibleDateMs(rawStartDateVal);
  if (startMs === null) return false;
  const now = new Date();
  const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const annualExpiryMs = startMs + 365 * 86400000;
  const horizonMs = todayUtcMs + Number(daysThreshold) * 86400000;
  return annualExpiryMs <= horizonMs;
}

function buildUnifiedWorkerRecord(sw, wDoc, canonicalId, nodeConfig = {}) {
  const cedula = String(sw.identificacion || sw.documento || sw.cedula || wDoc?.documento || '').trim() || 'S/D';
  const nombre = String(sw.nombre || wDoc?.nombre || 'Colaborador').trim();
  const cargo = String(sw.cargo || wDoc?.cargo || 'Sin cargo asignado').trim();
  const area = String(sw.areaTrabajo || sw.area || wDoc?.area || sw.sede || wDoc?.sede || 'General').trim();
  const sede = String(sw.sede || wDoc?.sede || 'Sede Principal').trim();
  const edad = String(sw.edad ?? wDoc?.edad ?? '').trim();
  const genero = String(sw.genero || wDoc?.genero || '').trim();
  const tipoSangre = String(sw.tipoSangre || '').trim();
  const rhVal = String(sw.rh || wDoc?.rh || '').trim();
  const rhFull = `${tipoSangre}${rhVal && !tipoSangre.includes(rhVal) ? rhVal : ''}`.trim() || rhVal || tipoSangre;
  const eps = String(sw.eps || wDoc?.eps || '').trim();
  const arl = String(sw.arl || wDoc?.arl || '').trim();
  const afp = String(sw.afp || sw.fondoPensiones || wDoc?.afp || '').trim();
  const estadoPila = String(sw.estadoPila || wDoc?.estadoPila || 'Activo').trim();
  const estadoLaboral = String(sw.estadoLaboral || sw.estado || wDoc?.estadoLaboral || 'Activo').trim();
  const isActivo = !/^retirad/i.test(estadoLaboral);
  const fechaRetiro = sw.fechaRetiro || (wDoc?.fechaRetiro ? new Date(wDoc.fechaRetiro).toISOString().slice(0, 10) : '') || '';
  const motivoRetiro = String(sw.motivoRetiro || wDoc?.motivoRetiro || '').trim();
  const aptitud = String(sw.bioScoreIAAptitud || sw.aptitudMedica || sw.conceptoAptitud || wDoc?.aptitud || 'Apto sin restricciones').trim();
  const fechaEmo = String(
    sw.fechaExamenMedico ||
      sw.fechaUltimoExamen ||
      (wDoc?.fechaUltimoExamen instanceof Date
        ? wDoc.fechaUltimoExamen.toISOString().slice(0, 10)
        : wDoc?.fechaUltimoExamen || '') ||
      (wDoc?.fechaExamenMedico instanceof Date
        ? wDoc.fechaExamenMedico.toISOString().slice(0, 10)
        : wDoc?.fechaExamenMedico || ''),
  ).trim();
  const fechaProxEmo = String(
    sw.fechaProximoExamen ||
      (wDoc?.fechaProximoExamen instanceof Date
        ? wDoc.fechaProximoExamen.toISOString().slice(0, 10)
        : wDoc?.fechaProximoExamen || ''),
  ).trim();
  const fechaVencAlturas = String(
    sw.fechaVencimientoAlturas ||
      sw.vencimientoCursoAlturas ||
      (wDoc?.fechaVencimientoAlturas instanceof Date
        ? wDoc.fechaVencimientoAlturas.toISOString().slice(0, 10)
        : wDoc?.fechaVencimientoAlturas || ''),
  ).trim();
  const fechaCursoAlturas = String(sw.fechaCursoAlturasAutorizado || wDoc?.fechaCursoAlturasAutorizado || '').trim();
  const fechaCursoAlturasCoord = String(sw.fechaCursoAlturasCoordinador || wDoc?.fechaCursoAlturasCoordinador || '').trim();
  const fechaVencLicencia = String(sw.licenciaConduccionVencimiento || wDoc?.licenciaConduccionVencimiento || '').trim();
  const fechaSeguimiento = String(sw.fechaSeguimiento || '').trim();
  const diagnosticos = String(sw.diagnosticoMedico || sw.condicionesSalud || wDoc?.condicionesSalud || wDoc?.diagnosticoMedico || '').trim();
  const enfermedades = String(sw.enfermedades || wDoc?.enfermedades || '').trim();
  const recomendaciones = String(sw.recomendacionesMedicas || wDoc?.recomendacionesMedicas || '').trim();
  const restricciones = String(sw.limitacionesBiomecanicas || sw.restriccionesMedicas || wDoc?.limitacionesBiomecanicas || '').trim();
  const medicamentos = String(sw.medicamentos || wDoc?.medicamentos || '').trim();
  const alergias = String(sw.alergiasQuimicas || sw.alergias || wDoc?.alergiasQuimicas || '').trim();
  const presionArterial = String(sw.presionArterial || sw.tensionArterial || '').trim();
  const frecuenciaCardiaca = String(sw.frecuenciaCardiaca || '').trim();
  const alimentacion = String(sw.alimentacion || '').trim();
  const riesgoCardiovascular = String(sw.riesgoCardiovascular || '').trim();
  const terapiaPsicologica = String(sw.terapiaPsicologica || '').trim();
  const imc = String(sw.imc || '').trim();
  const biocentricIsLethal = Boolean(sw.biocentricIsLethal || wDoc?.biocentricIsLethal);
  const bioScoreIAAptitud = String(sw.bioScoreIAAptitud || '').trim();
  const bioScoreIAReason = String(sw.bioScoreIAReason || '').trim();
  const bioTagsIA = Array.isArray(sw.bioTagsIA) ? sw.bioTagsIA : [];
  const dictamenPredictivoH1 = sw.dictamenPredictivoH1 ? stripHtmlToText(sw.dictamenPredictivoH1) : '';
  const fitScore = Number(
    (typeof wDoc?.fitScore === 'number' && wDoc.fitScore > 0 ? wDoc.fitScore : null) ??
      sw.biocentricScore ??
      88,
  );
  const fitScoreDynamicPenalty = Number(wDoc?.fitScoreDynamicPenalty ?? 0);
  const percepcionPts = Number(wDoc?.percepcionRiesgoScore ?? 0);
  const fitAlertsArr = [
    ...(Array.isArray(wDoc?.fitAlerts) ? wDoc.fitAlerts : []),
    ...(Array.isArray(sw.biocentricAlerts) ? sw.biocentricAlerts : []),
  ];
  const bioRisksArr = Array.isArray(wDoc?.riesgosBioIndividual) ? wDoc.riesgosBioIndividual : [];
  const bioRisksDetail = bioRisksArr
    .map(
      (br) =>
        `[${br.dominio_bio || 'Bio'}/${br.clasificacion_bio || 'Moderado'}] ${br.peligro_cargo || ''} (Índice: ${br.indice_bio_riesgo_efectivo ?? br.indice_bio_riesgo_bruto ?? ''}, Factor: ${br.factor_individual || 'N/A'}, Plan: ${br.plan_accion_bio || br.controles_individuo || 'N/A'})`,
    )
    .join(' || ');

  const tarjetasPreventivas =
    fitAlertsArr.length > 0
      ? fitAlertsArr.map((a) => (typeof a === 'string' ? a : a.title || a.message || JSON.stringify(a))).join(' | ')
      : restricciones || recomendaciones || enfermedades || 'Sin alertas clínico-operativas activas';

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁLCULO DETERMINISTA DE VENCIMIENTOS POR DOMINIO (EMO / ALTURAS / LICENCIA VIAL)
  // ═══════════════════════════════════════════════════════════════════════════
  const nowUtcRef = new Date();
  const todayUtcMs = Date.UTC(
    nowUtcRef.getUTCFullYear(),
    nowUtcRef.getUTCMonth(),
    nowUtcRef.getUTCDate(),
  );
  const horizon30UtcMs = todayUtcMs + 30 * 86400000;

  // 1. EMO (Examen Médico Ocupacional Periódico / Ingreso)
  const emoStartMs = parseFlexibleDateMs(fechaEmo);
  const emoProxMs = parseFlexibleDateMs(fechaProxEmo);
  const emoExpiryMs =
    emoProxMs !== null ? emoProxMs : emoStartMs !== null ? emoStartMs + 365 * 86400000 : null;
  const vencimientoExamenMedico = emoExpiryMs !== null ? formatMsToIsoDate(emoExpiryMs) : 'Pendiente';

  let estadoExamenMedicoEMO = 'NO APLICA (Retirado)';
  let emoAlert = false;
  if (isActivo) {
    if (emoExpiryMs === null) {
      estadoExamenMedicoEMO = 'SIN SOPORTE EMO';
      emoAlert = true;
    } else if (emoExpiryMs < todayUtcMs) {
      estadoExamenMedicoEMO = `VENCIDO (venció ${vencimientoExamenMedico})`;
      emoAlert = true;
    } else if (emoExpiryMs <= horizon30UtcMs) {
      estadoExamenMedicoEMO = `PRÓXIMO A VENCER (vence ${vencimientoExamenMedico})`;
      emoAlert = true;
    } else {
      estadoExamenMedicoEMO = `VIGENTE (vence ${vencimientoExamenMedico})`;
      emoAlert = false;
    }
  } else if (emoExpiryMs !== null) {
    estadoExamenMedicoEMO = `RETIRADO (último venc. ${vencimientoExamenMedico})`;
  }

  // 2. Certificado / Reentrenamiento Anual de Alturas (Res. 4272/2021 en PerfilSociodemograficoData)
  // REGLA INQUEBRANTABLE DEL DOMINIO: casilla vacía ("") o "No aplica" / "N/A" -> 'NO APLICA' (false)
  const alturasAutStartMs = parseFlexibleDateMs(fechaCursoAlturas);
  const alturasCoordStartMs = parseFlexibleDateMs(fechaCursoAlturasCoord);
  const explicitAlturasVencMs = parseFlexibleDateMs(fechaVencAlturas);
  const hasAlturasAutDate = alturasAutStartMs !== null;
  const hasAlturasCoordDate = alturasCoordStartMs !== null;
  const aplicaCursoAlturas = hasAlturasAutDate || hasAlturasCoordDate ? 'Sí aplica' : 'No aplica';

  let estadoCursoAlturasAutorizado = 'NO APLICA';
  let alturasAutAlert = false;
  if (hasAlturasAutDate) {
    const autExpMs =
      explicitAlturasVencMs !== null ? explicitAlturasVencMs : alturasAutStartMs + 365 * 86400000;
    const autExpStr = formatMsToIsoDate(autExpMs);
    if (autExpMs < todayUtcMs) {
      estadoCursoAlturasAutorizado = `VENCIDO (venció ${autExpStr})`;
      alturasAutAlert = Boolean(isActivo);
    } else if (autExpMs <= horizon30UtcMs) {
      estadoCursoAlturasAutorizado = `PRÓXIMO A VENCER (vence ${autExpStr})`;
      alturasAutAlert = Boolean(isActivo);
    } else {
      estadoCursoAlturasAutorizado = `VIGENTE (vence ${autExpStr})`;
      alturasAutAlert = false;
    }
  }

  let estadoCursoAlturasCoordinador = 'NO APLICA';
  let alturasCoordAlert = false;
  if (hasAlturasCoordDate) {
    const coordExpMs =
      explicitAlturasVencMs !== null && !hasAlturasAutDate
        ? explicitAlturasVencMs
        : alturasCoordStartMs + 365 * 86400000;
    const coordExpStr = formatMsToIsoDate(coordExpMs);
    if (coordExpMs < todayUtcMs) {
      estadoCursoAlturasCoordinador = `VENCIDO (venció ${coordExpStr})`;
      alturasCoordAlert = Boolean(isActivo);
    } else if (coordExpMs <= horizon30UtcMs) {
      estadoCursoAlturasCoordinador = `PRÓXIMO A VENCER (vence ${coordExpStr})`;
      alturasCoordAlert = Boolean(isActivo);
    } else {
      estadoCursoAlturasCoordinador = `VIGENTE (vence ${coordExpStr})`;
      alturasCoordAlert = false;
    }
  }
  const alturasAlert = alturasAutAlert || alturasCoordAlert;

  // 3. Licencia de Conducción (Seguridad Vial PESV)
  const licenciaVencMs = parseFlexibleDateMs(fechaVencLicencia);
  let estadoLicenciaConduccion = 'NO APLICA';
  let licenciaVialAlert = false;
  if (licenciaVencMs !== null) {
    const licExpStr = formatMsToIsoDate(licenciaVencMs);
    if (licenciaVencMs < todayUtcMs) {
      estadoLicenciaConduccion = `VENCIDO (venció ${licExpStr})`;
      licenciaVialAlert = Boolean(isActivo);
    } else if (licenciaVencMs <= horizon30UtcMs) {
      estadoLicenciaConduccion = `PRÓXIMO A VENCER (vence ${licExpStr})`;
      licenciaVialAlert = Boolean(isActivo);
    } else {
      estadoLicenciaConduccion = `VIGENTE (vence ${licExpStr})`;
      licenciaVialAlert = false;
    }
  }

  const isExpiryFilterMode =
    nodeConfig?.recordFilterMode === 'expiry_only' || Array.isArray(nodeConfig?.expiryAuditScope);
  const normalizedScope =
    Array.isArray(nodeConfig?.expiryAuditScope) && nodeConfig.expiryAuditScope.length > 0
      ? nodeConfig.expiryAuditScope.map((s) => String(s).toLowerCase().trim())
      : ['emo', 'alturas', 'licencia_vial'];

  const allExpiryReasons = [];
  const scopedExpiryReasons = [];
  if (emoAlert) {
    const r = `EMO: ${estadoExamenMedicoEMO}`;
    allExpiryReasons.push(r);
    if (normalizedScope.includes('emo')) scopedExpiryReasons.push(r);
  }
  if (alturasAutAlert) {
    const r = `Curso Alturas Autorizado: ${estadoCursoAlturasAutorizado}`;
    allExpiryReasons.push(r);
    if (normalizedScope.includes('alturas')) scopedExpiryReasons.push(r);
  }
  if (alturasCoordAlert) {
    const r = `Curso Alturas Coordinador: ${estadoCursoAlturasCoordinador}`;
    allExpiryReasons.push(r);
    if (normalizedScope.includes('alturas')) scopedExpiryReasons.push(r);
  }
  if (licenciaVialAlert) {
    const r = `Licencia de Conducción: ${estadoLicenciaConduccion}`;
    allExpiryReasons.push(r);
    if (
      normalizedScope.includes('licencia_vial') ||
      normalizedScope.includes('licencia') ||
      normalizedScope.includes('vial')
    ) {
      scopedExpiryReasons.push(r);
    }
  }

  const activeReasonsList = isExpiryFilterMode ? scopedExpiryReasons : allExpiryReasons;
  const motivosVencimientoDetectados =
    activeReasonsList.length > 0 ? activeReasonsList.join(' ; ') : 'Sin vencimientos pendientes';
  const hasScopedExpiryAlert = scopedExpiryReasons.length > 0;

  const aptitudOrPilaAlert =
    Boolean(aptitud && /no\s*apto|aplazad|con\s*restricci/i.test(aptitud) && !/sin\s*restricci/i.test(aptitud)) ||
    Boolean(estadoPila && /mora|inactiv|suspendid/i.test(estadoPila));

  const hasGeneralAlert =
    isActivo &&
    (biocentricIsLethal ||
      fitScore < 75 ||
      fitAlertsArr.length > 0 ||
      emoAlert ||
      alturasAlert ||
      licenciaVialAlert ||
      aptitudOrPilaAlert ||
      Boolean(restricciones && !/ningun|apto sin|no aplica/i.test(restricciones)) ||
      Boolean(enfermedades && !/ningun|sano|no aplica/i.test(enfermedades)));

  const effectiveIsCritical = isExpiryFilterMode
    ? Boolean(isActivo && hasScopedExpiryAlert)
    : hasGeneralAlert;

  const badgeByMode = isExpiryFilterMode
    ? effectiveIsCritical
      ? `BRECHA: ${motivosVencimientoDetectados}`
      : `VIGENTE • EMO: ${estadoExamenMedicoEMO}`
    : canonicalId === 'hito2_oraculo_predictivo'
      ? `FIT ${fitScore}% • ${fitAlertsArr.length || (hasGeneralAlert ? 1 : 0)} Tarjeta(s) Preventiva(s)`
      : canonicalId === 'hito2_condiciones_salud'
        ? `${aptitud} • FIT ${fitScore}%`
        : `${estadoLaboral} • EPS: ${eps || 'N/A'} • ARL: ${arl || 'N/A'}`;

  const effectiveBadgeTone = isExpiryFilterMode
    ? effectiveIsCritical
      ? 'rose'
      : 'emerald'
    : hasGeneralAlert
      ? 'rose'
      : fitScore < 85
        ? 'amber'
        : 'emerald';

  const fechaNacStr =
    sw.fechaNacimiento ||
    (wDoc?.fechaNacimiento instanceof Date
      ? wDoc.fechaNacimiento.toISOString().slice(0, 10)
      : wDoc?.fechaNacimiento || '');
  const fechaIngStr =
    sw.fechaIngreso ||
    (wDoc?.fechaIngreso instanceof Date
      ? wDoc.fechaIngreso.toISOString().slice(0, 10)
      : wDoc?.fechaIngreso || '');

  return {
    id: cedula !== 'S/D' ? cedula : String(wDoc?._id || sw.id || nombre),
    label: `${nombre} (CC ${cedula})`,
    sublabel: `Cargo: ${cargo} • Área: ${area}${edad ? ` • ${edad} años` : ''}${rhFull ? ` • RH ${rhFull}` : ''}`,
    badge: badgeByMode,
    badgeTone: effectiveBadgeTone,
    isCritical: effectiveIsCritical,
    _fitScore: fitScore,
    _activo: estadoLaboral !== 'Retirado',
    fields: {
      // >35 Casillas Reales Sociodemográficas Exactas
      nombre,
      documento: cedula,
      cargo,
      area,
      sede,
      edad,
      genero,
      estadoCivil: sw.estadoCivil || '',
      escolaridad: sw.nivelEscolaridad || sw.escolaridad || '',
      fechaNacimiento: fechaNacStr,
      lugarNacimiento: sw.lugarNacimiento || '',
      direccion: sw.direccion || '',
      barrio: sw.barrio || '',
      municipioDomicilio: sw.municipioDomicilio || '',
      telefono: sw.telefono || '',
      correoElectronico: sw.correoElectronico || '',
      emergenciaContacto: sw.emergenciaContacto || '',
      tipoSangre,
      rh: rhFull,
      estrato: String(sw.estrato ?? ''),
      tipoVivienda: sw.tipoVivienda || sw.vivienda || '',
      personasACargo: String(sw.personasACargo ?? sw.personasCargo ?? 0),
      hijos: String(sw.hijos ?? 0),
      cabezaFamilia: sw.cabezaFamilia || 'No',
      eps,
      arl,
      afp,
      tipoContrato: sw.tipoContrato || '',
      fechaIngreso: fechaIngStr,
      antiguedadAnos: String(sw.antiguedadAnos ?? sw.antiguedad ?? ''),
      jornadaLaboral: sw.jornadaLaboral || sw.turnoTrabajo || 'Diurna',
      salario: sw.salario || sw.ingresos || '',
      estadoPila,
      fechaExamenMedico: fechaEmo || 'Sin registro',
      vencimientoExamenMedico,
      estadoExamenMedicoEMO,
      aplicaCursoAlturas,
      fechaCursoAlturasAutorizado: fechaCursoAlturas || '',
      estadoCursoAlturasAutorizado,
      fechaCursoAlturasCoordinador: fechaCursoAlturasCoord || '',
      estadoCursoAlturasCoordinador,
      licenciaConduccion: sw.licenciaConduccion || '',
      licenciaCategoria: sw.licenciaCategoria || '',
      licenciaConduccionVencimiento: fechaVencLicencia || '',
      estadoLicenciaConduccion,
      motivosVencimientoDetectados,
      curso50h: sw.curso50h || '',
      curso20h: sw.curso20h || '',
      esCopasst: sw.esCopasst || 'No',
      esComiteConvivencia: sw.esComiteConvivencia || 'No',
      esBrigadista: sw.esBrigadista || 'No',
      esComiteSeguridadVial: sw.esComiteSeguridadVial || 'No',
      estado: estadoLaboral,
      fechaRetiro,
      motivoRetiro,
      // Casillas Reales Clínicas & Condiciones de Salud
      enfermedades,
      diagnosticoMedico: diagnosticos,
      medicamentos,
      presionArterial,
      frecuenciaCardiaca,
      limitacionesBiomecanicas: restricciones,
      alergiasQuimicas: alergias,
      alimentacion,
      riesgoCardiovascular,
      terapiaPsicologica,
      fechaSeguimiento,
      biocentricIsLethal,
      bioScoreIAAptitud,
      bioScoreIAReason,
      // Casillas Reales Oráculo Predictivo H1 & Bio-Individuo
      dictamenPredictivoH1,
      bioTagsIA: bioTagsIA.join(', '),
      fitScore,
      fitScoreDynamicPenalty,
      fitAlerts: tarjetasPreventivas,
      percepcionRiesgoScore: percepcionPts,
      riesgosBioIndividual: bioRisksDetail,
      // Etiquetas Descriptivas Compatibles con MODULE_METADATA_MAP
      'Cédula / Documento': cedula,
      'Nombre Completo': nombre,
      'Cargo': cargo,
      'Área / Proceso y Sede': `${area} (${sede})`,
      'Área / Proceso': area,
      'Sede / Centro de Trabajo': sede,
      'Edad y Fecha de Nacimiento': `${edad ? `${edad} años` : ''} ${fechaNacStr ? `(${fechaNacStr} · ${sw.lugarNacimiento || ''})` : ''}`.trim(),
      'Edad': edad,
      'Fecha de Nacimiento': fechaNacStr,
      'Lugar de Nacimiento': sw.lugarNacimiento || '',
      'Género': genero,
      'Grupo Sanguíneo y RH': rhFull,
      'Estado Civil y Personas a Cargo': `${sw.estadoCivil || ''} (Personas a cargo: ${sw.personasACargo ?? sw.personasCargo ?? 0}, Hijos: ${sw.hijos ?? 0}, Cabeza Familia: ${sw.cabezaFamilia || 'No'})`,
      'Estado Civil': sw.estadoCivil || '',
      'Personas a Cargo': String(sw.personasACargo ?? sw.personasCargo ?? 0),
      'Nivel de Escolaridad': sw.nivelEscolaridad || '',
      'Estrato Socioeconómico y Tipo de Vivienda': `Estrato ${sw.estrato || 'N/A'} - Vivienda ${sw.tipoVivienda || sw.vivienda || 'N/A'}`,
      'Tipo de Vivienda': sw.tipoVivienda || sw.vivienda || '',
      'Estrato Socioeconómico': String(sw.estrato || ''),
      'Tipo de Contrato y Turno de Trabajo': `${sw.tipoContrato || 'Término Indefinido'} (${sw.jornadaLaboral || sw.turnoTrabajo || 'Diurna'})`,
      'Tipo de Contrato': sw.tipoContrato || '',
      'Fecha de Ingreso y Antigüedad': `${fechaIngStr} (${sw.antiguedadAnos ?? sw.antiguedad ?? ''} años)`.trim(),
      'Fecha de Ingreso': fechaIngStr,
      'Antigüedad': String(sw.antiguedadAnos ?? sw.antiguedad ?? ''),
      'Rango Salarial / IBC': sw.salario || sw.ingresos || '',
      'EPS (Entidad Promotora de Salud)': eps,
      'EPS': eps,
      'ARL (Administradora de Riesgos Laborales)': arl,
      'ARL': arl,
      'AFP (Fondo de Pensiones) y Caja de Compensación': `AFP: ${afp || 'N/A'} | Caja: ${sw.cajaCompensacion || 'N/A'}`,
      'AFP (Fondo de Pensiones)': afp,
      'Estado de Planilla PILA / Certificados de Afiliación': estadoPila,
      'Estado Laboral (Activo / Retirado)': `${estadoLaboral}${fechaRetiro ? ` (Retiro: ${fechaRetiro} - ${motivoRetiro})` : ''}`,
      'Teléfono, Correo y Contacto de Emergencia': `Tel: ${sw.telefono || ''} | Email: ${sw.correoElectronico || ''} | Emergencia: ${sw.emergenciaContacto || ''}`,
      'Correo Electrónico': sw.correoElectronico || '',
      'Teléfono / Celular': sw.telefono || '',
      'Dirección, Barrio y Municipio': `${sw.direccion || ''}${sw.barrio ? `, Barrio ${sw.barrio}` : ''} (${sw.municipioDomicilio || ''})`,
      'Contacto de Emergencia': sw.emergenciaContacto || '',
      'Certificaciones Operativas (Alturas, Licencia Vial, Curso 50h, Comités)': `Alturas: ${sw.fechaCursoAlturasAutorizado || 'N/A'} | Lic. Vial: ${sw.licenciaConduccion || 'N/A'} (${sw.licenciaCategoria || ''} vence ${sw.licenciaConduccionVencimiento || 'N/A'}) | 50h: ${sw.curso50h || 'N/A'} | COPASST: ${sw.esCopasst || 'No'} | CCL: ${sw.esComiteConvivencia || 'No'} | Brigada: ${sw.esBrigadista || 'No'} | CSV: ${sw.esComiteSeguridadVial || 'No'}`,
      'Hábitos de Vida (Actividad Física, Tabaco, Alcohol, Alimentación)': `Deporte: ${sw.deporte || 'N/A'} | Tabaco: ${sw.fuma || 'No'} | Alcohol: ${sw.alcohol || 'No'} | Alimentación: ${alimentacion || 'N/A'}`,
      'Concepto de Aptitud Médica (Apto / Apto con Restricción / Aplazado)': aptitud,
      'Concepto de Aptitud Médica': aptitud,
      'Fecha de Último Examen Médico Ocupacional (EMO) y Próximo Vencimiento': `Último: ${fechaEmo || 'N/A'} | Próximo: ${fechaProxEmo || 'N/A'} | Seguimiento: ${fechaSeguimiento || 'N/A'}`,
      'Fecha Último Examen Médico (EMO)': fechaEmo,
      'Fecha Próximo Examen Médico': fechaProxEmo,
      'Restricciones Médicas Laborales Activas y Vigencia': restricciones,
      'Limitaciones Biomecánicas': restricciones,
      'Recomendaciones Médicas Ocupacionales': recomendaciones,
      'Diagnósticos Clínicos / CIE-10 y Sistemas Comprometidos': diagnosticos,
      'Enfermedades Preexistentes': enfermedades,
      'Medicamentos de Consumo Actual': medicamentos,
      'Alergias Químicas / Medicamentosas': alergias,
      'Tensión Arterial (PA)': presionArterial,
      'Frecuencia Cardíaca (FC)': frecuenciaCardiaca,
      'Riesgo Cardiovascular y Terapia Psicológica': `Cardiovascular: ${riesgoCardiovascular || 'N/A'} | Terapia Psicológica: ${terapiaPsicologica || 'N/A'}`,
      'Peso (kg)': String(sw.peso || ''),
      'Talla (cm)': String(sw.talla || ''),
      'Índice de Masa Corporal (IMC) y Riesgo Metabólico': `${imc} (${sw.clasificacionImc || ''})`,
      'Puntaje de Compatibilidad Cargo-Persona (FIT Score %)': `${fitScore}% (Penalización dinámica: ${fitScoreDynamicPenalty}%)`,
      'Puntaje FIT Biocéntrico (%)': `${fitScore}%`,
      'Dictamen Predictivo IA H1': dictamenPredictivoH1 || bioScoreIAReason,
      'Tarjetas Preventivas Activas por Trabajador': tarjetasPreventivas,
      'Tarjetas Preventivas / Alertas FIT': tarjetasPreventivas,
      'Puntaje Percepción del Riesgo (pts)': `${percepcionPts} pts`,
      'Detalle de Riesgos Bio-Individuales': bioRisksDetail,
      'Recomendaciones de Reubicación, Readaptación o Ajuste Razonable': bioScoreIAReason || recomendaciones || restricciones || 'Mantener controles preventivos del cargo',
    },
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INSPECTORES EN VIVO DE HITOS 3, 4 Y 5 (18 APLICATIVOS)
 * ═══════════════════════════════════════════════════════════════════════════
 */
async function inspectHito3To5(canonicalId, userId, company) {
  // 20. Hito 3 · COPASST / Vigía SST
  if (canonicalId === 'hito4_comites') {
    const SgsstCopasstComite = getSafeModel('SgsstCopasstComite', '~/server/routes/sgsst/copasst', '~/models/SgsstCopasst');
    const SgsstCopasstActa = getSafeModel('SgsstCopasstActa', '~/server/routes/sgsst/copasst', '~/models/SgsstCopasst');
    const SgsstCopasstInspeccion = getSafeModel('SgsstCopasstInspeccion', '~/server/routes/sgsst/copasst', '~/models/SgsstCopasst');
    const SgsstEleccion = getSafeModel('SgsstEleccion', '~/server/routes/sgsst/copasst', '~/models/SgsstCopasst');

    const [comite, actas, inspecciones, elecciones, tagReports] = await Promise.all([
      findSingleCompanyDoc(SgsstCopasstComite, userId, company),
      findManyCompanyDocs(SgsstCopasstActa, userId, company, { fechaReunion: -1 }, 30),
      findManyCompanyDocs(SgsstCopasstInspeccion, userId, company, { fecha: -1 }, 30),
      findManyCompanyDocs(SgsstEleccion, userId, company, { createdAt: -1 }, 10),
      fetchLatestReportsForTags(userId, company, ['sgsst-copasst', 'sgsst-comites'], 5),
    ]);
    const copasstElecciones = elecciones.filter((e) => !e.tipoComite || /copasst/i.test(e.tipoComite));

    const repEmpleador = Array.isArray(comite?.representantesEmpleador) ? comite.representantesEmpleador : [];
    const repTrabajadores = Array.isArray(comite?.representantesTrabajadores) ? comite.representantesTrabajadores : [];
    const vigiaObj = comite?.vigia && (comite.vigia.nombre || comite.vigia.cedula)
      ? [{ ...comite.vigia, parte: 'Vigía SST', rol: comite.vigia.rol || 'Vigía Principal' }]
      : [];
    const allMembers = [
      ...vigiaObj,
      ...repEmpleador.map((m) => ({ ...m, parte: 'Empleador' })),
      ...repTrabajadores.map((m) => ({ ...m, parte: 'Trabajadores' })),
    ];
    const periodoStr =
      comite?.periodoInicio || comite?.periodoFin
        ? `${comite?.periodoInicio || 'N/A'} a ${comite?.periodoFin || 'N/A'}`
        : 'Periodo Vigente (2 años)';

    const embeddedActaReports = actas
      .filter((a) => typeof a.reporteOficialHtml === 'string' && a.reporteOficialHtml.trim().length > 80)
      .slice(0, 5)
      .map((a, idx) => ({
        conversationId: String(a._id || `copasst_acta_html_${idx}`),
        title: `Acta Oficial COPASST #${a.numeroActa || idx + 1}`,
        html: a.reporteOficialHtml,
        charCount: a.reporteOficialHtml.length,
        preview: stripHtmlToText(a.reporteOficialHtml).slice(0, 280),
        updatedAt: a.updatedAt || a.fechaReunion || null,
      }));
    const latestReports = [...tagReports, ...embeddedActaReports];

    const records = [
      ...allMembers.map((m, i) => ({
        id: m.cedula || `copasst_mem_${i}`,
        label: `[Integrante COPASST] ${m.nombre || 'Miembro'} (CC ${m.cedula || 'S/D'})`,
        sublabel: `Representante: ${m.parte} • Rol: ${m.rol || 'Principal'} • Cargo: ${m.cargo || ''} • Periodo: ${periodoStr}`,
        badge: `${m.parte} · ${m.rol || 'Principal'}`,
        badgeTone: 'teal',
        isCritical: false,
        fields: {
          'Cédula / Documento del Integrante': m.cedula || '',
          'Nombre Completo y Cargo del Integrante': `${m.nombre || ''} (${m.cargo || ''})`,
          'Representación (Empleador / Trabajadores)': m.parte,
          'Calidad del Miembro (Principal / Suplente)': m.calidad || m.rol || 'Principal',
          'Rol en el Comité (Presidente / Secretario / Integrante)': m.rolComite || m.rol || 'Integrante',
          'Modalidad y Periodo de Vigencia (2 años)': `${String(comite?.modalidad || 'COPASST').toUpperCase()} (${periodoStr})`,
          'Integrantes del COPASST / Vigía (Representantes del Empleador y de los Trabajadores — Principales y Suplentes)': `${m.nombre || ''} (CC ${m.cedula || ''}) - ${m.parte} - ${m.rol || ''}`,
        },
      })),
      ...copasstElecciones.map((el, i) => ({
        id: String(el._id || `copasst_elec_${i}`),
        label: `[Convocatoria / Votación COPASST] ${el.titulo || el.periodo || `Elección #${i + 1}`}`,
        sublabel: `Estado: ${el.estado || 'Cerrada'} • Votos registrados: ${(el.votos || []).length} • Candidatos: ${(el.candidatos || []).length}`,
        badge: `Elección ${String(el.estado || 'Registrada').toUpperCase()}`,
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          'Convocatoria, Inscripción de Candidatos y Escrutinio de Votación': `${el.titulo || 'Elección Paritaria COPASST'} — Candidatos: ${(el.candidatos || []).length}, Votos: ${(el.votos || []).length} (${el.estado || 'Cerrada'})`,
          'Modalidad y Periodo de Vigencia (2 años)': el.periodo || periodoStr,
        },
      })),
      ...actas.map((a, i) => {
        const comps = Array.isArray(a.compromisos) ? a.compromisos : [];
        const pend = comps.filter((c) => c.estado !== 'Cumplido' && c.estado !== 'cumplido').length;
        const actaNum = a.numeroActa || a.consecutivo || i + 1;
        const rawDate = a.fechaReunion || a.fecha || a.createdAt;
        const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('es-CO') : 'Reciente';
        const lugarStr = a.lugarModalidad || a.lugar || 'Sede Principal';
        const temasStr = formatCleanScalar(a.desarrollo || a.temasTratados || a.ordenDelDia, 'Seguimiento mensual SG-SST, inspecciones e indicadores ATEL');
        return {
          id: String(a._id || actaNum || `acta_${i}`),
          label: `[Acta COPASST ${actaNum}] ${dateStr}`,
          sublabel: `Compromisos: ${comps.length} (${pend} pendientes) • Lugar: ${lugarStr}`,
          badge: pend > 0 ? `${pend} Compromiso(s) Pendiente(s)` : 'Cumplida',
          badgeTone: pend > 0 ? 'amber' : 'emerald',
          isCritical: pend > 0,
          fields: {
            'Actas de Reunión Mensual Ordinaria / Extraordinaria': `Acta ${actaNum} (${dateStr})`,
            'Número y Fecha de Acta de Reunión Mensual Ordinaria / Extraordinaria': `Acta ${actaNum} - ${dateStr}`,
            'Lugar / Modalidad de Reunión': lugarStr,
            'Verificación de Quórum y Asistencia de Miembros': `${(a.asistentes || []).length} asistentes registrados`,
            'Temas Tratados (Inspecciones, Investigación ATEL, Seguimiento Plan Anual)': temasStr,
            'Compromisos del Acta, Responsables y Fechas de Cumplimiento': comps.map((c) => `${c.actividad || ''} (Resp: ${c.responsable || ''} - Fecha: ${c.fechaLimite || c.fecha || 'N/A'} - Estado: ${c.estado || 'Pendiente'})`).join(' | ') || 'Sin compromisos pendientes',
            'Seguimiento al Estado de Compromisos de Actas Anteriores': `${pend} pendientes de ${comps.length}`,
            'Estado de Compromisos de Actas Anteriores (Abierto / En Gestión / Cerrado)': `${pend} abiertos`,
          },
        };
      }),
      ...inspecciones.map((ins, i) => {
        const hallazgosArr = Array.isArray(ins.hallazgos) ? ins.hallazgos : [];
        return {
          id: String(ins._id || ins.consecutivo || `insp_${i}`),
          label: `[Inspección COPASST ${ins.consecutivo || i + 1}] ${ins.tipoLabel || 'General'} — ${ins.sede || ''}/${ins.area || ''}`,
          sublabel: `Hallazgos: ${hallazgosArr.length} • Inspector: ${ins.inspectorNombre || ''}`,
          badge: `Semáforo: ${String(ins.semaforoGeneral || 'atencion').toUpperCase()}`,
          badgeTone: ins.semaforoGeneral === 'critico' ? 'rose' : ins.semaforoGeneral === 'seguro' ? 'emerald' : 'amber',
          isCritical: ins.semaforoGeneral === 'critico' || hallazgosArr.length > 0,
          fields: {
            'Revisión de Inspecciones Planeadas de Seguridad': `${ins.consecutivo || ''}: ${ins.tipoLabel || ''} en ${ins.sede || ''}/${ins.area || ''} (${hallazgosArr.length} hallazgos)`,
            'Inspector COPASST Responsable': `${ins.inspectorNombre || ''} (CC ${ins.inspectorCedula || 'N/A'})`,
            'Detalle de Hallazgos de Inspección y Controles': hallazgosArr
              .map((h) => `${h.descripcion || h.item || 'Hallazgo'} [Nivel: ${h.nivelRiesgo || h.prioridad || 'Medio'} - Acción: ${h.accionCorrectiva || h.recomendacion || 'Intervenir'}]`)
              .join(' | ') || 'Sin hallazgos abiertos',
          },
        };
      }),
    ];

    return {
      moduleTitle: 'Hito 3 · COPASST / Vigía de Seguridad y Salud en el Trabajo',
      sourceCollection: 'SgsstCopasstComite + SgsstCopasstActa + SgsstCopasstInspeccion + SgsstEleccion',
      latestReports,
      kpis: [
        { label: 'Modalidad', value: String(comite?.modalidad || 'COPASST').toUpperCase(), tone: 'teal' },
        { label: 'Miembros Activos', value: allMembers.length, tone: 'indigo' },
        { label: 'Actas Mensuales', value: actas.length, tone: 'emerald' },
        { label: 'Inspecciones Planeadas', value: inspecciones.length, tone: 'amber' },
      ],
      records,
    };
  }

  // 21. Hito 3 · Comité de Convivencia Laboral (CCL)
  if (canonicalId === 'hito3_cocolab') {
    const SgsstConvivenciaComite = getSafeModel('SgsstConvivenciaComite', '~/server/routes/sgsst/convivencia', '~/models/SgsstConvivencia');
    const SgsstConvivenciaActa = getSafeModel('SgsstConvivenciaActa', '~/server/routes/sgsst/convivencia', '~/models/SgsstConvivencia');
    const SgsstConvivenciaCaso = getSafeModel('SgsstConvivenciaCaso', '~/server/routes/sgsst/convivencia', '~/models/SgsstConvivencia');
    const SgsstEleccion = getSafeModel('SgsstEleccion', '~/server/routes/sgsst/copasst', '~/models/SgsstCopasst');

    const [comite, actas, casos, elecciones, tagReports] = await Promise.all([
      findSingleCompanyDoc(SgsstConvivenciaComite, userId, company),
      findManyCompanyDocs(SgsstConvivenciaActa, userId, company, { fechaReunion: -1 }, 20),
      findManyCompanyDocs(SgsstConvivenciaCaso, userId, company, { createdAt: -1 }, 30),
      findManyCompanyDocs(SgsstEleccion, userId, company, { createdAt: -1 }, 10),
      fetchLatestReportsForTags(userId, company, ['sgsst-cocolab', 'sgsst-convivencia'], 5),
    ]);
    const cclElecciones = elecciones.filter((e) => /convivencia|ccl|cocolab/i.test(e.tipoComite || ''));
    const periodoStr =
      comite?.periodoInicio || comite?.periodoFin
        ? `${comite?.periodoInicio || 'N/A'} a ${comite?.periodoFin || 'N/A'}`
        : 'Periodo Vigente (2 años)';

    const embeddedActaReports = actas
      .filter((a) => typeof a.reporteOficialHtml === 'string' && a.reporteOficialHtml.trim().length > 80)
      .slice(0, 5)
      .map((a, idx) => ({
        conversationId: String(a._id || `ccl_acta_html_${idx}`),
        title: `Acta Oficial CCL #${a.numeroActa || idx + 1}`,
        html: a.reporteOficialHtml,
        charCount: a.reporteOficialHtml.length,
        preview: stripHtmlToText(a.reporteOficialHtml).slice(0, 280),
        updatedAt: a.updatedAt || a.fechaReunion || null,
      }));
    const latestReports = [...tagReports, ...embeddedActaReports];

    const members = [
      ...(comite?.representantesEmpleador || []).map((m) => ({ ...m, parte: 'Empleador' })),
      ...(comite?.representantesTrabajadores || []).map((m) => ({ ...m, parte: 'Trabajadores' })),
    ];

    const records = [
      ...members.map((m, i) => ({
        id: m.cedula || `ccl_mem_${i}`,
        label: `[Integrante CCL] ${m.nombre || ''} (CC ${m.cedula || ''})`,
        sublabel: `Parte: ${m.parte} • Rol: ${m.rol || 'Principal'} • Cargo: ${m.cargo || ''} • Periodo: ${periodoStr}`,
        badge: `${m.parte} · ${m.rol || 'Principal'}`,
        badgeTone: 'teal',
        isCritical: false,
        fields: {
          'Integrantes del Comité de Convivencia Laboral (Principales y Suplentes)': `${m.nombre || ''} (CC ${m.cedula || ''}) - ${m.parte} (${m.rol || ''})`,
          'Cédula / Documento del Integrante': m.cedula || '',
          'Nombre Completo y Cargo del Integrante': `${m.nombre || ''} (${m.cargo || ''})`,
          'Periodo de Vigencia del Comité (2 años)': periodoStr,
        },
      })),
      ...cclElecciones.map((el, i) => ({
        id: String(el._id || `ccl_elec_${i}`),
        label: `[Elección CCL] ${el.titulo || el.periodo || `Votación #${i + 1}`}`,
        sublabel: `Estado: ${el.estado || 'Cerrada'} • Votos: ${(el.votos || []).length}`,
        badge: 'ELECCIÓN CCL',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          'Acta de Conformación y Votación Secreta CCL': `${el.titulo || 'Elección CCL'} — Candidatos: ${(el.candidatos || []).length}, Votos: ${(el.votos || []).length}`,
        },
      })),
      ...actas.map((a, i) => ({
        id: String(a._id || `ccl_acta_${i}`),
        label: `[Acta Trimestral CCL ${a.numeroActa || i + 1}] Trimestre ${a.trimestre || ''}/${a.anio || ''}`,
        sublabel: `Compromisos: ${(a.compromisos || []).length} • Fecha: ${a.fechaReunion ? new Date(a.fechaReunion).toLocaleDateString('es-CO') : ''}`,
        badge: a.estadoActa || 'Firmada',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          'Actas de Reunión Trimestral Ordinaria / Extraordinaria': `Acta ${a.numeroActa || ''} (Trimestre ${a.trimestre || ''}/${a.anio || ''})`,
          'Temas Tratados y Desarrollo de Sesión CCL': a.desarrollo || a.temasTratados || '',
          'Compromisos, Campañas de Prevención y Capacitaciones': (a.compromisos || []).map((c) => `${c.actividad || ''} (${c.responsable || ''} - ${c.estado || 'Pendiente'})`).join(' | '),
        },
      })),
      ...casos.map((c, i) => {
        const fechaRad = c.fechaRadicacion || c.createdAt;
        const elapsedDays = fechaRad ? Math.floor((Date.now() - new Date(fechaRad).getTime()) / 86400000) : 0;
        const diasRestantes = c.diasRestantes ?? Math.max(0, 65 - elapsedDays);
        const vencido65 = Boolean(c.vencido65Dias || (c.estado !== 'cerrado' && elapsedDays > 65));
        return {
          id: String(c._id || c.radicado || `ccl_caso_${i}`),
          label: `[Caso Confidencial ${c.radicado || i + 1}] Modalidad: ${c.modalidadAcoso || 'Convivencia'}`,
          sublabel: `Estado: ${c.estado || 'En trámite'} • Nivel: ${c.nivelRiesgo || 'Moderado'} • Plazo Res. 3461 (65 días): ${diasRestantes} días restantes`,
          badge: vencido65 ? 'PLAZO 65D VENCIDO' : String(c.estado || 'Abierto').toUpperCase(),
          badgeTone: c.estado === 'cerrado' ? 'emerald' : 'rose',
          isCritical: c.estado !== 'cerrado',
          fields: {
            'Seguimiento Estadístico de Quejas de Presunto Acoso Laboral (Reserva Ley 1010)': `Radicado ${c.radicado || ''}: ${c.modalidadAcoso || ''} - Estado: ${c.estado || ''} - Nivel: ${c.nivelRiesgo || ''}`,
            'Control de Término Legal Res. 3461 de 2025 (Máx. 65 días calendario)': vencido65 ? `Vencido (${elapsedDays} días transcurridos)` : `${diasRestantes} días restantes (${elapsedDays} transcurridos)`,
            'Planes de Mejora de Clima y Convivencia Laboral': c.acuerdosLogrados || c.planSeguimiento || '',
          },
        };
      }),
    ];

    return {
      moduleTitle: 'Hito 3 · Comité de Convivencia Laboral (CCL — Ley 1010 / Res. 3461)',
      sourceCollection: 'SgsstConvivenciaComite + SgsstConvivenciaActa + SgsstConvivenciaCaso',
      latestReports,
      kpis: [
        { label: 'Miembros CCL', value: members.length, tone: 'teal' },
        { label: 'Actas Trimestrales', value: actas.length, tone: 'indigo' },
        { label: 'Casos Registrados', value: casos.length, tone: casos.length > 0 ? 'amber' : 'emerald' },
        { label: 'Casos Abiertos', value: casos.filter((c) => c.estado !== 'cerrado').length, tone: 'rose' },
      ],
      records,
    };
  }

  // 22. Hito 3 · Comité de Seguridad Vial (CSV - PESV)
  if (canonicalId === 'hito3_comite_pesv') {
    const SgsstPesvComite = getSafeModel('SgsstPesvComite', '~/server/routes/sgsst/copasst', '~/models/SgsstCopasst');
    const SgsstPesvActa = getSafeModel('SgsstPesvActa', '~/server/routes/sgsst/copasst', '~/models/SgsstCopasst');
    const [comite, actas, latestReports] = await Promise.all([
      findSingleCompanyDoc(SgsstPesvComite, userId, company),
      findManyCompanyDocs(SgsstPesvActa, userId, company, { fechaReunion: -1 }, 20),
      fetchLatestReportsForTags(userId, company, ['sgsst-comite-pesv'], 5),
    ]);
    const miembros = Array.isArray(comite?.integrantes) ? comite.integrantes : [];

    const records = [
      ...miembros.map((m, i) => ({
        id: m.cedula || `csv_mem_${i}`,
        label: `[Integrante CSV] ${m.nombre || ''} (CC ${m.cedula || ''})`,
        sublabel: `Rol Vial: ${m.rolComite || m.rol || 'Miembro CSV'} • Cargo: ${m.cargo || ''}`,
        badge: m.rolComite || 'Comité Vial',
        badgeTone: 'teal',
        isCritical: false,
        fields: {
          'Integrantes del Comité de Seguridad Vial y Líder del PESV': `${m.nombre || ''} (CC ${m.cedula || ''}) - ${m.rolComite || m.cargo || ''}`,
          'Cédula / Documento': m.cedula || '',
          'Nombre Completo': m.nombre || '',
          'Cargo': m.cargo || '',
        },
      })),
      ...actas.map((a, i) => ({
        id: String(a._id || `csv_acta_${i}`),
        label: `[Acta CSV ${a.numeroActa || i + 1}] Trimestre ${a.trimestre || ''} (${a.fechaReunion ? new Date(a.fechaReunion).toLocaleDateString('es-CO') : ''})`,
        sublabel: `Compromisos Viales: ${(a.compromisos || []).length}`,
        badge: a.estadoActa || 'Firmada',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          'Actas Trimestrales de Seguimiento al PESV': `Acta ${a.numeroActa || ''} (${a.fechaReunion ? new Date(a.fechaReunion).toLocaleDateString('es-CO') : ''})`,
          'Compromisos Viales, Responsables y Fechas Límite': (a.compromisos || []).map((c) => `${c.actividad || ''} (${c.responsable || ''})`).join(' | '),
        },
      })),
    ];

    return {
      moduleTitle: 'Hito 3 · Comité de Seguridad Vial (CSV - PESV)',
      sourceCollection: 'SgsstPesvComite + SgsstPesvActa',
      latestReports,
      kpis: [
        { label: 'Miembros CSV', value: miembros.length, tone: 'teal' },
        { label: 'Actas CSV', value: actas.length, tone: 'indigo' },
        { label: 'Líder PESV', value: comite?.liderPesv?.nombre || 'Sin asignar', tone: 'emerald' },
      ],
      records,
    };
  }

  // 23. Hito 3 · Brigada de Emergencias & Comité de Crisis (SCI)
  if (canonicalId === 'hito3_brigada_emergencias') {
    const SgsstBrigadista = getSafeModel('SgsstBrigadista', '~/server/routes/sgsst/brigada', '~/models/SgsstBrigadista');
    const [brigadistas, latestReports] = await Promise.all([
      findManyCompanyDocs(SgsstBrigadista, userId, company, { updatedAt: -1 }, 150),
      fetchLatestReportsForTags(userId, company, ['sgsst-brigada-emergencias'], 5),
    ]);

    return {
      moduleTitle: 'Hito 3 · Brigada de Emergencias & Sistema Comando de Incidentes (SCI)',
      sourceCollection: 'SgsstBrigadista',
      latestReports,
      kpis: [
        { label: 'Brigadistas Activos', value: brigadistas.filter((b) => b.estadoMembresia === 'Activo').length, tone: 'teal' },
        { label: 'Primeros Auxilios', value: brigadistas.filter((b) => /auxilios/i.test(b.grupoEspecialidad || '')).length, tone: 'emerald' },
        { label: 'Control Incendios', value: brigadistas.filter((b) => /incendio/i.test(b.grupoEspecialidad || '')).length, tone: 'rose' },
        { label: 'Evacuación / SCI', value: brigadistas.filter((b) => /evacuaci|comando|integral/i.test(b.grupoEspecialidad || '')).length, tone: 'indigo' },
      ],
      records: brigadistas.map((b, i) => ({
        id: b.cedula || String(b._id || `brig_${i}`),
        label: `${b.nombre || 'Brigadista'} (CC ${b.cedula || ''})`,
        sublabel: `Unidad: ${b.grupoEspecialidad || 'Primeros Auxilios'} • Rol SCI: ${b.rolSCI || 'Operativo'} • Sede: ${b.sede || 'Principal'}`,
        badge: `${b.estadoMembresia || 'Activo'} • RH ${b.rh || 'O+'}`,
        badgeTone: b.estadoMembresia === 'Activo' ? 'emerald' : 'amber',
        isCritical: b.estadoMembresia !== 'Activo',
        fields: {
          'Listado de Brigadistas Activos (Cédula, Nombre, Cargo, Sede y Teléfono)': `${b.nombre || ''} (CC ${b.cedula || ''}) - ${b.cargo || ''} - Sede: ${b.sede || ''} - Tel: ${b.telefono || ''}`,
          'Cédula / Documento': b.cedula || '',
          'Nombre Completo': b.nombre || '',
          'Cargo': b.cargo || '',
          'Sede / Área': `${b.sede || ''} - ${b.area || ''}`,
          'Unidad Asignada (Primeros Auxilios, Prevención y Control de Incendios, Evacuación y Rescate)': b.grupoEspecialidad || '',
          'Organigrama del Sistema Comando de Incidentes (Comandante, Oficial de Seguridad, Enlace, Operaciones)': b.rolSCI || '',
          'Grupo Sanguíneo y RH': b.rh || '',
          'Certificaciones y Entrenamientos de Brigadistas': (b.capacitaciones || []).map((c) => `${c.tema} (${c.horas}h)`).join(', '),
          'Dotación e Inventario Asignado a la Brigada': (b.dotacion || []).map((d) => `${d.item} (${d.entregado ? 'Entregado' : 'Pendiente'})`).join(', '),
        },
      })),
    };
  }

  // 24. Hito 4 · Matriz Bio-IPEVR (Evaluación Individual por Trabajador)
  if (canonicalId === 'hito4_bio_ipevar') {
    const SgsstWorker = getSafeModel('SgsstWorker', '~/server/routes/sgsst/workers', '~/models/SgsstWorker');
    const [workers, tagReports] = await Promise.all([
      findManyCompanyDocs(SgsstWorker, userId, company, { updatedAt: -1 }, 200),
      fetchLatestReportsForTags(userId, company, ['sgsst-bio-ipevar', 'sgsst-matriz-bio-ipevar'], 5),
    ]);
    const rows = [];
    const embeddedBioReports = [];
    for (const w of workers) {
      if (typeof w.bioReportContent === 'string' && w.bioReportContent.trim().length > 80 && embeddedBioReports.length < 5) {
        embeddedBioReports.push({
          conversationId: `bio_rep_${w.documento || w._id}`,
          title: `Dictamen Bio-IPEVR Individual — ${w.nombre || 'Trabajador'} (CC ${w.documento || ''})`,
          html: w.bioReportContent,
          charCount: w.bioReportContent.length,
          preview: stripHtmlToText(w.bioReportContent).slice(0, 280),
          updatedAt: w.bioReportGeneratedAt || w.updatedAt || null,
        });
      }
      const bioRows = Array.isArray(w.riesgosBioIndividual) ? w.riesgosBioIndividual : [];
      for (const br of bioRows) {
        const isCrit = /cr[ií]tico|alto/i.test(br.clasificacion_bio || '') || Boolean(br.intervencion_prioritaria);
        rows.push({
          id: br.id || `${w.documento}_${br.dominio_bio || rows.length}`,
          label: `${w.nombre || 'Trabajador'} (CC ${w.documento || 'S/D'}) · [${br.dominio_bio || 'Bio-Riesgo'}] ${br.peligro_cargo || ''}`,
          sublabel: `Cargo: ${w.cargo || ''} • Efectos: ${br.efectos_posibles || ''} • Factor Individual: ${br.factor_individual || ''}`,
          badge: `${br.clasificacion_bio || 'Moderado'} (Índice: ${br.indice_bio_riesgo_efectivo ?? br.indice_bio_riesgo_bruto ?? ''})`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Cédula y Nombre Completo del Trabajador': `${w.nombre || ''} (CC ${w.documento || ''})`,
            'Cédula / Documento': w.documento || '',
            'Nombre Completo': w.nombre || '',
            'Cargo, Proceso y Sede': `${w.cargo || ''} (${w.area || ''} - ${w.sede || 'Principal'})`,
            'Dominio Bio-Individual': br.dominio_bio || '',
            'Actividad Expuesta y Rutinariedad': `${br.actividad_expuesta || ''} (Rutinaria: ${br.rutinaria ?? 'Sí'})`,
            'Peligros Expuestos en el Puesto Individual': `${br.peligro_cargo || ''} (${br.actividad_expuesta || ''})`,
            'Cruces con Condiciones de Salud y Sintomatología Corporal': `${br.factor_individual || ''} -> ${br.efectos_posibles || ''}`,
            'Nivel de Susceptibilidad (NS) y Nivel de Exposición (NE)': `NS=${br.nivel_susceptibilidad ?? ''} | NE=${br.nivel_exposicion ?? ''}`,
            'Índice Bio-Riesgo Bruto, Factor de Control e Índice Efectivo': `Bruto=${br.indice_bio_riesgo_bruto ?? ''} | Factor Control=${br.factor_control_existente ?? ''} | Efectivo=${br.indice_bio_riesgo_efectivo ?? ''}`,
            'Valoración de Riesgo Bio-Individual (NR y Aceptabilidad)': `NS=${br.nivel_susceptibilidad ?? ''} | NE=${br.nivel_exposicion ?? ''} | Índice Efectivo=${br.indice_bio_riesgo_efectivo ?? ''} (${br.clasificacion_bio || ''})`,
            'Intervención Prioritaria y Frecuencia de Seguimiento': `Prioritaria: ${br.intervencion_prioritaria ? 'Sí' : 'No'} | Frecuencia: ${br.frecuencia_seguimiento || 'Semestral'}`,
            'Medidas en Fuente/Medio y Administrativas/SVE': `Fuente/Medio: ${br.medida_fuente_medio || ''} | Admin/SVE: ${br.medida_administrativa_sve || ''}`,
            'Controles Personalizados (Fuente, Medio e Individuo)': `Fuente/Medio: ${br.medida_fuente_medio || ''} | Admin/SVE: ${br.medida_administrativa_sve || ''} | Plan: ${br.plan_accion_bio || ''} | Restricciones: ${br.restricciones_laborales || ''} | EPP: ${br.medida_eppu || ''}`,
          },
        });
      }
    }

    return {
      moduleTitle: 'Hito 4 · Matriz Bio-IPEVR (Evaluación Individual por Trabajador)',
      sourceCollection: 'SgsstWorker.riesgosBioIndividual',
      latestReports: [...tagReports, ...embeddedBioReports],
      kpis: [
        { label: 'Trabajadores Evaluados', value: rows.length > 0 ? new Set(rows.map((r) => r.fields?.['Cédula / Documento'])).size : 0, tone: 'teal' },
        { label: 'Total Filas Bio-IPEVR', value: rows.length, tone: 'indigo' },
        { label: 'Bio-Riesgos Críticos / Altos', value: rows.filter((r) => r.isCritical).length, tone: 'rose' },
      ],
      records: rows,
    };
  }

  // 25. Hito 4 · Método OWAS (Evaluación Ergonómica Postural)
  if (canonicalId === 'hito3_owas') {
    const MetodoOwasData = getSafeModel('MetodoOwasData', '~/server/routes/sgsst/metodoOwas');
    const [doc, latestReports] = await Promise.all([
      findSingleCompanyDoc(MetodoOwasData, userId, company),
      fetchLatestReportsForTags(userId, company, ['sgsst-metodo-owas', 'sgsst-owas'], 5),
    ]);
    const obs = Array.isArray(doc?.observaciones) ? doc.observaciones : [];
    const trabNames = (doc?.trabajadoresList || []).map((t) => `${t.nombre} (CC ${t.cedula})`).join(', ');
    const evalNames = (doc?.evaluadoresList || []).map((e) => `${e.nombre || ''} (${e.licencia || e.rol || 'Ergónomo'})`).join(', ');
    const crit = obs.filter((o) => Number(o.categoria) >= 3).length;

    return {
      moduleTitle: 'Hito 4 · Método OWAS (Evaluación Ergonómica Postural)',
      sourceCollection: 'MetodoOwasData',
      latestReports,
      kpis: [
        { label: 'Posturas Evaluadas', value: obs.length, tone: 'teal' },
        { label: 'Nivel 3 y 4 (Acción Urgente)', value: crit, tone: crit > 0 ? 'rose' : 'emerald' },
        { label: 'Cargo Evaluado', value: doc?.formData?.cargo || 'Sin registrar', tone: 'indigo' },
      ],
      records: obs.map((o, i) => {
        const cat = Number(o.categoria) || 1;
        const code4 = `${o.espalda || 1}${o.brazos || 1}${o.piernas || 1}${o.carga || 1}`;
        return {
          id: String(o.id || `owas_${i}`),
          label: `Fase / Postura: ${o.descripcion || `Observación #${i + 1}`} — Código OWAS ${code4}`,
          sublabel: `Espalda: ${o.espaldaLabel || o.espalda} • Brazos: ${o.brazosLabel || o.brazos} • Piernas: ${o.piernasLabel || o.piernas} • Carga: ${o.cargaLabel || o.carga}`,
          badge: `Categoría ${cat}`,
          badgeTone: cat >= 3 ? 'rose' : cat === 2 ? 'amber' : 'emerald',
          isCritical: cat >= 3,
          fields: {
            'Trabajador Evaluado (Cédula, Nombre y Cargo)': `${trabNames || 'Personal Evaluado'} - Cargo: ${doc?.formData?.cargo || ''}`,
            'Evaluador / Profesional Ergónomo': evalNames || doc?.formData?.evaluador || 'Responsable SG-SST',
            'Tarea / Actividad y Fase de Trabajo Analizada': `${doc?.formData?.actividadGlobal || ''} - Fase: ${o.descripcion || ''} (Frecuencia: ${o.frecuencia || '100%'})`,
            'Frecuencia Relativa de la Postura (%)': String(o.frecuencia || ''),
            'Posición de Espalda (1 a 4), Brazos (1 a 3), Piernas (1 a 7) y Carga/Fuerza (1 a 3)': `Espalda=${o.espalda} (${o.espaldaLabel || ''}), Brazos=${o.brazos} (${o.brazosLabel || ''}), Piernas=${o.piernas} (${o.piernasLabel || ''}), Carga=${o.carga} (${o.cargaLabel || ''})`,
            'Código Postural OWAS de 4 Dígitos': code4,
            'Categoría de Riesgo OWAS (Nivel 1 Normal / Nivel 2 Leve / Nivel 3 Dañino / Nivel 4 Urgente)': `Nivel ${cat}`,
            'Acción Correctiva y Rediseño Ergonómico Recomendado': o.accionCorrectiva || (cat >= 3 ? 'Rediseño ergonómico prioritario' : 'Seguimiento postural preventivo'),
          },
        };
      }),
    };
  }

  // 26. Hito 4 · Estudio de Puesto de Trabajo (EPT)
  if (canonicalId === 'hito3_estudio_puesto') {
    const EstudioPuestoTrabajo = getSafeModel('EstudioPuestoTrabajo', '~/server/routes/sgsst/estudioPuestoTrabajo', '~/models/EstudioPuestoTrabajo');
    const [studies, latestReports] = await Promise.all([
      findManyCompanyDocs(EstudioPuestoTrabajo, userId, company, { createdAt: -1 }, 100),
      fetchLatestReportsForTags(userId, company, ['sgsst-estudio-puesto', 'sgsst-ept'], 5),
    ]);
    const crit = studies.filter((s) => /cr[ií]tico|alto/i.test(s.riskLevel || '') || Number(s.rulaScore) >= 5).length;
    const eptEvidences = [];
    for (const s of studies) {
      for (const ev of s.evidences || []) {
        if (ev?.url && /\.(pdf|png|jpe?g)(\?|$)/i.test(String(ev.url))) {
          const norm = normalizeCleanEvidenceFile(
            {
              url: ev.url,
              fileName: ev.name || path.basename(String(ev.url).split('?')[0]),
              cedula: s.workerId || '',
              workerName: s.workerName || 'Trabajador',
              cargo: s.cargo || '',
              portal: 'Estudio de Puesto de Trabajo (EPT)',
              title: ev.name || 'Evidencia Fotográfica / PDF EPT',
            },
            eptEvidences.length,
          );
          if (Array.isArray(norm)) eptEvidences.push(...norm);
        }
      }
    }

    return {
      moduleTitle: 'Hito 4 · Estudio de Puesto de Trabajo (EPT — RULA / REBA / MediaPipe)',
      sourceCollection: 'EstudioPuestoTrabajo',
      latestReports,
      evidenceFiles: eptEvidences,
      kpis: [
        { label: 'Estudios EPT Realizados', value: studies.length, tone: 'teal' },
        { label: 'Riesgo Crítico / Alto', value: crit, tone: crit > 0 ? 'rose' : 'emerald' },
        { label: 'Riesgo Medio / Bajo', value: Math.max(0, studies.length - crit), tone: 'emerald' },
      ],
      records: studies.map((s, i) => {
        const isCrit = /cr[ií]tico|alto/i.test(s.riskLevel || '') || Number(s.rulaScore) >= 5;
        const alertsStr = Array.isArray(s.telemetry?.postureAlerts) ? s.telemetry.postureAlerts.join(', ') : '';
        return {
          id: String(s._id || `ept_${i}`),
          label: `${s.workerName || 'Trabajador'} (CC ${s.workerId || 'S/D'}) — Cargo: ${s.cargo || 'General'}`,
          sublabel: `Actividad: ${s.actividad || ''} • RULA: ${s.rulaScore ?? 'N/A'} | REBA: ${s.rebaScore ?? 'N/A'} • Evaluador: ${s.evaluatorName || 'SG-SST'}`,
          badge: `${s.riskLevel || 'Evaluado'} (${s.actionLevel || 'Estándar'})`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Trabajador, Cédula, Cargo y Área Evaluada': `${s.workerName || ''} (CC ${s.workerId || 'S/D'}) - Cargo: ${s.cargo || ''}`,
            'Cédula / Documento': s.workerId || 'S/D',
            'Nombre Completo': s.workerName || '',
            'Cargo': s.cargo || '',
            'Evaluador del Estudio EPT': s.evaluatorName || '',
            'Descripción de la Tarea, Jornada y Ciclo de Trabajo': s.actividad || '',
            'Condiciones Ambientales (Iluminación, Ruido, Temperatura, Vibración)': s.notes || '',
            'Diseño del Puesto, Mobiliario y Herramientas': `Ángulos MediaPipe: Cuello ${s.telemetry?.neckAngle ?? 0}°, Tronco ${s.telemetry?.trunkAngle ?? 0}°, Brazo ${s.telemetry?.armAngle ?? 0}°, Codo ${s.telemetry?.elbowAngle ?? 0}°, Muñeca ${s.telemetry?.wristAngle ?? 0}°, Rodilla ${s.telemetry?.kneeAngle ?? 0}°`,
            'Alertas Posturales Detectadas (MediaPipe)': alertsStr || 'Sin alertas agudas',
            'Factores de Riesgo Biomecánico y Psicosocial Identificados': `RULA: ${s.rulaScore ?? 0} | REBA: ${s.rebaScore ?? 0} | Nivel: ${s.actionLevel || ''} (${s.riskLevel || ''})`,
            'Plan de Intervención, Ajustes Razonables y Seguimiento': s.summaryRecommendation || s.notes || 'Seguimiento ergonómico preventivo',
          },
        };
      }),
    };
  }

  // 27. Hito 4 · Termómetro Psicosocial y Clima Emocional
  if (canonicalId === 'hito4_psicosocial') {
    const MoodTelemetry = getSafeModel('MoodTelemetry', '~/server/routes/sgsst/animo', '~/models/MoodTelemetry');
    const [items, latestReports] = await Promise.all([
      findManyCompanyDocs(MoodTelemetry, userId, company, { createdAt: -1 }, 150),
      fetchLatestReportsForTags(userId, company, ['sgsst-psicosocial', 'sgsst-animo'], 5),
    ]);
    const sad = items.filter((m) => m.mood === 'sad').length;
    const happy = items.filter((m) => m.mood === 'happy').length;
    const neutral = items.filter((m) => m.mood === 'neutral').length;

    return {
      moduleTitle: 'Hito 4 · Termómetro Psicosocial & Estado de Ánimo (Res. 2764)',
      sourceCollection: 'MoodTelemetry',
      latestReports,
      kpis: [
        { label: 'Total Reportes Ánimo', value: items.length, tone: 'teal' },
        { label: 'Motivado / Positivo', value: happy, tone: 'emerald' },
        { label: 'Tranquilo / Normal', value: neutral, tone: 'indigo' },
        { label: 'Estresado / Alerta', value: sad, tone: sad > 0 ? 'rose' : 'emerald' },
      ],
      records: items.map((m, i) => ({
        id: String(m._id || `mood_${i}`),
        label: `[${m.mood === 'sad' ? 'ALERTA ESTRÉS / AGOTAMIENTO' : m.mood === 'happy' ? 'POSITIVO / MOTIVADO' : 'NORMAL / TRANQUILO'}] Área: ${m.department || 'General'}`,
        sublabel: `Estresores: ${(m.stressors || []).join(', ') || 'Ninguno'} • Canal: ${m.channel || 'web'} • Detalle: ${m.details || 'Sin comentario'}`,
        badge: m.createdAt ? new Date(m.createdAt).toLocaleDateString('es-CO') : m.mood,
        badgeTone: m.mood === 'sad' ? 'rose' : m.mood === 'happy' ? 'emerald' : 'slate',
        isCritical: m.mood === 'sad',
        fields: {
          'Estado de Ánimo Reportado (Motivado / Tranquilo / Estresado)': m.mood === 'sad' ? 'Estresado / Alerta (sad)' : m.mood === 'happy' ? 'Motivado / Positivo (happy)' : 'Tranquilo / Normal (neutral)',
          'Distribución de Estado de Ánimo (Positivo, Neutral, Estresado / Fatigado)': m.mood || '',
          'Factores Estresores Reportados (Carga Mental, Jornada, Liderazgo, Clima, Entorno)': (m.stressors || []).join(', '),
          'Área / Departamento': m.department || 'General',
          'Tendencias por Área / Proceso / Sede': m.department || 'General',
          'Canal de Captura (QR / Kiosco / Web)': m.channel || 'web',
          'Alertas Tempranas de Fatiga o Riesgo Psicosocial': m.details || '',
          'Fecha de Registro': m.createdAt ? new Date(m.createdAt).toLocaleString('es-CO') : '',
        },
      })),
    };
  }

  // 28. Hito 5 · Compras y Adquisiciones con Criterios SST
  if (canonicalId === 'hito5_compras_sst') {
    const SgsstComprasData = getSafeModel('SgsstComprasData', '~/server/routes/sgsst/compras', '~/models/SgsstComprasData');
    const [doc, tagReports] = await Promise.all([
      findSingleCompanyDoc(SgsstComprasData, userId, company),
      fetchLatestReportsForTags(userId, company, ['sgsst-compras', 'sgsst-compras-adquisiciones'], 5),
    ]);
    const compras = Array.isArray(doc?.compras) ? doc.compras : [];
    const aprobadas = compras.filter((c) => /aprobado/i.test(c.dictamenSST || '')).length;
    const condRech = compras.length - aprobadas;
    const embeddedRep =
      typeof doc?.lastGeneratedReport === 'string' && doc.lastGeneratedReport.trim().length > 80
        ? [
            {
              conversationId: `compras_embedded_${doc._id || '1'}`,
              title: 'Procedimiento e Informe Oficial de Compras SST',
              html: doc.lastGeneratedReport,
              charCount: doc.lastGeneratedReport.length,
              preview: stripHtmlToText(doc.lastGeneratedReport).slice(0, 280),
              updatedAt: doc.updatedAt || null,
            },
          ]
        : [];
    const latestReports = [...tagReports, ...embeddedRep];

    return {
      moduleTitle: 'Hito 5 · Compras y Adquisiciones con Criterios SST (Est. 2.9.1)',
      sourceCollection: 'SgsstComprasData',
      latestReports,
      kpis: [
        { label: 'Compras Evaluadas', value: compras.length, tone: 'teal' },
        { label: 'Aprobadas SST', value: aprobadas, tone: 'emerald' },
        { label: 'Condicionadas / Rechazadas', value: condRech, tone: condRech > 0 ? 'rose' : 'emerald' },
      ],
      records: compras.map((c, i) => {
        const isCrit = !/aprobado/i.test(c.dictamenSST || '');
        return {
          id: c.id || c.codigo || `cmp_${i}`,
          label: `[${c.codigo || `CMP-${i + 1}`}] ${c.productoServicio || 'Adquisición'} (${c.categoria || 'SST'})`,
          sublabel: `Proveedor: ${c.proveedorSugerido || 'N/A'} (NIT ${c.nitProveedor || 'N/A'}) • Área: ${c.areaSolicitante || 'General'} • Norma: ${c.normaTecnica || 'ANSI/NTC'}`,
          badge: c.dictamenSST || 'Evaluado',
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Producto, Equipo, Sustancia o Servicio a Adquirir': `${c.codigo || ''}: ${c.productoServicio || ''} (${c.categoria || ''})`,
            'Área Solicitante, Fecha de Solicitud y Nivel de Riesgo Asociado': `Área: ${c.areaSolicitante || ''} | Fecha: ${c.fechaSolicitud || ''} | Riesgo: ${c.nivelRiesgoAsociado || ''}`,
            'Proveedor Sugerido y NIT': `${c.proveedorSugerido || ''} (NIT ${c.nitProveedor || ''})`,
            'Especificaciones y Requisitos Técnicos de SST Exigidos': `${c.normaTecnica || ''} - ${c.especificacionesSST || ''} ${doc?.criteriosGenerales ? `| Criterio Base: ${String(doc.criteriosGenerales).slice(0, 200)}` : ''}`.trim(),
            'Certificaciones de Calidad / Normas Técnicas (ANSI, NTC, NIOSH, RETIE, SGA)': `Certificado Calidad: ${c.tieneCertificadoCalidad ? 'Sí' : 'No'} | FDS SGA: ${c.tieneFdsSga ? 'Sí' : 'No'}`,
            'Evaluación y Verificación de Recepción SST': `${c.dictamenSST || ''} (Resp: ${c.responsableEvaluacion || ''}) — Obs: ${c.observaciones || 'Ninguna'}`,
          },
        };
      }),
    };
  }

  // 29. Hito 5 · Gestión de Contratistas y Proveedores
  if (canonicalId === 'hito5_contratistas') {
    const SgsstContratistasData = getSafeModel('SgsstContratistasData', '~/server/routes/sgsst/contratistas', '~/models/SgsstContratistasData');
    const [doc, tagReports] = await Promise.all([
      findSingleCompanyDoc(SgsstContratistasData, userId, company),
      fetchLatestReportsForTags(userId, company, ['sgsst-contratistas', 'sgsst-proveedores'], 5),
    ]);
    const contratistas = Array.isArray(doc?.contratistas) ? doc.contratistas : [];
    const enBrecha = contratistas.filter((c) => c.estadoPila !== 'Vigente' || c.calificacionSST !== 'Aprobado').length;
    const embeddedRep =
      typeof doc?.lastGeneratedReport === 'string' && doc.lastGeneratedReport.trim().length > 80
        ? [
            {
              conversationId: `contratistas_embedded_${doc._id || '1'}`,
              title: 'Manual e Informe Oficial de Contratistas SST',
              html: doc.lastGeneratedReport,
              charCount: doc.lastGeneratedReport.length,
              preview: stripHtmlToText(doc.lastGeneratedReport).slice(0, 280),
              updatedAt: doc.updatedAt || null,
            },
          ]
        : [];
    const latestReports = [...tagReports, ...embeddedRep];

    return {
      moduleTitle: 'Hito 5 · Gestión de Contratistas, Proveedores y Terceros (Est. 2.10.1)',
      sourceCollection: 'SgsstContratistasData',
      latestReports,
      kpis: [
        { label: 'Contratistas en Padrón', value: contratistas.length, tone: 'teal' },
        { label: 'Aprobados / PILA Vigente', value: contratistas.length - enBrecha, tone: 'emerald' },
        { label: 'Condicionados / PILA Vencida', value: enBrecha, tone: enBrecha > 0 ? 'rose' : 'emerald' },
      ],
      records: contratistas.map((c, i) => {
        const isCrit = c.estadoPila !== 'Vigente' || c.calificacionSST !== 'Aprobado';
        const indVal = c.induccionCompletada ?? c.induccionSST ?? '';
        const indLabel = typeof indVal === 'boolean' ? (indVal ? 'Sí (100%)' : 'No') : String(indVal || 'Pendiente');
        return {
          id: c.id || c.nit || `ctr_${i}`,
          label: `${c.razonSocial || 'Contratista'} (NIT: ${c.nit || 'S/D'})`,
          sublabel: `Servicio: ${c.servicio || ''} • ARL: ${c.arl || ''} (${c.nivelRiesgo || ''}) • Trabajadores en misión: ${c.trabajadoresEnMision || 0}`,
          badge: `${c.calificacionSST || 'Evaluado'} • PILA: ${c.estadoPila || 'Vigente'} • 0312: ${c.puntaje0312 ?? c.cumplimiento0312Pct ?? ''}%`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Razón Social, NIT y Representante del Contratista / Proveedor': `${c.razonSocial || ''} (NIT ${c.nit || ''}) - Contacto: ${c.contactoResponsable || ''} (${c.emailContacto || ''} / ${c.telefono || ''})`,
            'Vigencia del Contrato (Fecha Inicio y Fecha Fin)': `${c.fechaInicio || 'N/A'} a ${c.fechaFin || 'N/A'}`,
            'Objeto del Contrato, Nivel de Riesgo ARL y Trabajadores Asignados': `${c.servicio || ''} | ${c.nivelRiesgo || ''} (${c.arl || ''}) | ${c.trabajadoresEnMision || 0} trabajadores`,
            'Certificado de Evaluación de Estándares Mínimos Res. 0312 del Contratista': `${c.puntaje0312 ?? c.cumplimiento0312Pct ?? 0}%`,
            'Verificación Mensual de Planilla PILA (EPS, ARL, AFP vigentes)': `${c.estadoPila || ''} (Ref: ${c.planillaPilaRef || 'N/A'})`,
            'Inducción SST, Certificados de Tareas de Alto Riesgo y Entrega de EPP': `Inducción: ${indLabel} | Alto Riesgo: ${c.tareaAltoRiesgo || ''} | Certificados: ${c.certificadosExigidos || ''}`,
            'Accidentes Reportados y Observaciones de Auditoría': `AT Reportados: ${c.accidentesReportados ?? 0} | Obs: ${c.observaciones || 'Ninguna'}`,
            'Evaluación de Desempeño SST del Contratista': c.calificacionSST || '',
          },
        };
      }),
    };
  }

  // 30. Hito 5 · Gestión del Cambio (MOC)
  if (canonicalId === 'hito5_gestion_cambio') {
    const SgsstGestionCambioData = getSafeModel('SgsstGestionCambioData', '~/server/routes/sgsst/gestionCambio', '~/models/SgsstGestionCambioData');
    const [doc, tagReports] = await Promise.all([
      findSingleCompanyDoc(SgsstGestionCambioData, userId, company),
      fetchLatestReportsForTags(userId, company, ['sgsst-gestion-cambio', 'sgsst-moc'], 5),
    ]);
    const mocList = Array.isArray(doc?.mocList) ? doc.mocList : [];
    const altoRiesgo = mocList.filter((m) => m.nivelRiesgoCambio === 'Alto' || m.estado !== 'Implementado').length;
    const embeddedRep =
      typeof doc?.lastGeneratedReport === 'string' && doc.lastGeneratedReport.trim().length > 80
        ? [
            {
              conversationId: `moc_embedded_${doc._id || '1'}`,
              title: 'Procedimiento e Informe Oficial de Gestión del Cambio (MOC)',
              html: doc.lastGeneratedReport,
              charCount: doc.lastGeneratedReport.length,
              preview: stripHtmlToText(doc.lastGeneratedReport).slice(0, 280),
              updatedAt: doc.updatedAt || null,
            },
          ]
        : [];
    const latestReports = [...tagReports, ...embeddedRep];

    return {
      moduleTitle: 'Hito 5 · Gestión del Cambio MOC (Est. 2.11.1 / Dec. 1072 Art. 2.2.4.6.26)',
      sourceCollection: 'SgsstGestionCambioData',
      latestReports,
      kpis: [
        { label: 'Cambios MOC Registrados', value: mocList.length, tone: 'teal' },
        { label: 'Implementados', value: mocList.filter((m) => m.estado === 'Implementado').length, tone: 'emerald' },
        { label: 'En Evaluación / Riesgo Alto', value: altoRiesgo, tone: altoRiesgo > 0 ? 'amber' : 'emerald' },
      ],
      records: mocList.map((m, i) => ({
        id: m.id || m.codigo || `moc_${i}`,
        label: `[${m.codigo || `MOC-${i + 1}`}] ${m.titulo || 'Gestión del Cambio'}`,
        sublabel: `Área: ${m.areaProceso || 'General'} • Tipo: ${m.tipoCambio || ''} • Peligros Nuevos: ${m.peligrosNuevos || ''} • Resp: ${m.responsable || ''}`,
        badge: `Riesgo ${m.nivelRiesgoCambio || 'Medio'} • ${m.estado || 'En Evaluación'}`,
        badgeTone: m.nivelRiesgoCambio === 'Alto' ? 'rose' : 'indigo',
        isCritical: m.nivelRiesgoCambio === 'Alto' || m.estado !== 'Implementado',
        fields: {
          'Descripción del Cambio (Interno: Procesos, Equipos, Personal, Infraestructura / Externo: Normativo, Tecnológico)': `${m.codigo || ''}: ${m.titulo || ''} (${m.tipoCambio || ''} - ${m.origen || ''} - Área: ${m.areaProceso || ''}): ${m.descripcion || ''}`,
          'Identificación de Nuevos Peligros y Evaluación de Riesgos del Cambio': `${m.peligrosNuevos || ''} (Riesgo: ${m.nivelRiesgoCambio || ''} | Impacto SST: ${m.impactoSaludSeguridad || ''} | Impacto Legal: ${m.impactoLegal || ''})`,
          'Medidas de Control, Capacitación y Comunicación Antes de Implementar': `${m.controlesRequeridos || ''} | Requiere Capacitación: ${m.requiereCapacitacion ? 'Sí' : 'No'} | Módulos impactados: ${(m.modulosImpactados || []).join(', ')}`,
          'Responsable, Fecha de Implementación y Verificación de Eficacia': `Resp: ${m.responsable || ''} | Fecha: ${m.fechaPropuesta || ''} | Estado: ${m.estado || ''} | Obs: ${m.observaciones || ''}`,
        },
      })),
    };
  }

  // 31 & 32. Hito 5 · Análisis de Trabajo Seguro (ATS) y Permiso de Trabajo en Alturas
  if (canonicalId === 'hito3_ats' || canonicalId === 'hito3_alturas') {
    const isAlturas = canonicalId === 'hito3_alturas';
    const Model = getSafeModel(
      isAlturas ? 'PermisoAlturasData' : 'AnalisisTrabajoSeguroData',
      isAlturas ? '~/server/routes/sgsst/permisoAlturas' : '~/server/routes/sgsst/analisisTrabajoSeguro'
    );
    const [doc, latestReports] = await Promise.all([
      findSingleCompanyDoc(Model, userId, company),
      fetchLatestReportsForTags(
        userId,
        company,
        isAlturas ? ['sgsst-permiso-alturas', 'sgsst-alturas'] : ['sgsst-ats', 'sgsst-analisis-trabajo-seguro'],
        5,
      ),
    ]);
    const trabs = Array.isArray(doc?.trabajadoresList) ? doc.trabajadoresList : [];
    const resps = Array.isArray(doc?.responsablesList) ? doc.responsablesList : [];
    const inboxQr = Array.isArray(doc?.inboxPublico) ? doc.inboxPublico : [];
    const fd = doc?.formData || {};
    const hasFormPayload = Boolean(
      fd.actividadGlobal || fd.ubicacion || fd.pasosTarea || fd.herramientasEquipos || fd.epccEpp,
    );

    const effectiveTrabs =
      trabs.length > 0
        ? trabs
        : hasFormPayload
          ? [{ cedula: fd.cedulaEjecutante || 'Tarea-Registrada', nombre: fd.ejecutanteNombre || 'Cuadrilla Autorizada' }]
          : [];

    const records = [
      ...effectiveTrabs.map((t, i) => {
        const trabAlturasExp =
          t.certificacionAlturas === 'No' ||
          isDateExpiredOrWithinDays(
            t.fechaVencimientoAlturas || t.vencimientoCursoAlturas || fd.fechaVencimientoAlturas,
            30,
          ) ||
          isAnnualDateExpiredOrWithinDays(t.fechaCursoAlturas, 30);
        const isTrabCrit =
          fd.seguridadSocial === 'No' ||
          fd.aptitudMedica === 'No' ||
          fd.certificacionAlturas === 'No' ||
          trabAlturasExp;
        return {
          id: t.cedula || `tar_trab_${i}`,
          label: `[Ejecutante Autorizado] ${t.nombre || 'Trabajador'} (CC ${t.cedula || ''})`,
          sublabel: `Tarea: ${fd.actividadGlobal || 'Tarea Crítica'} • Ubicación: ${fd.ubicacion || fd.area || 'Planta'} • Fecha: ${fd.fecha || ''} (${fd.horaInicio || ''} - ${fd.horaFin || ''})`,
          badge: `Seg. Social: ${fd.seguridadSocial || 'Sí'} • Aptitud: ${fd.aptitudMedica || 'Sí'}`,
          badgeTone: isTrabCrit ? 'rose' : 'emerald',
          isCritical: isTrabCrit,
        fields: isAlturas
          ? {
              'Trabajador Autorizado (Cédula, Nombre, Cargo, ARL, EPS y Curso Alturas Vigente)': `${t.nombre || ''} (CC ${t.cedula || ''}) - Cargo: ${t.cargo || ''} - Cert. Alturas: ${fd.certificacionAlturas || 'Sí'}`,
              'Cédula / Documento': t.cedula || '',
              'Nombre Completo': t.nombre || '',
              'Descripción, Ubicación, Altura Aproximada (m) y Fecha/Hora del Trabajo': `${fd.actividadGlobal || ''} en ${fd.ubicacion || fd.area || ''} (Altura: ${fd.alturaAproximada || fd.altura || 'N/A'} m | ${fd.fecha || ''} ${fd.horaInicio || ''}-${fd.horaFin || ''})`,
              'Sistemas de Acceso, Prevención y Protección Contra Caídas (EPCC / EPP / Herramientas)': `Herramientas: ${fd.herramientasEquipos || ''} | EPCC/EPP: ${fd.epccEpp || ''}`,
              'Verificación de Condiciones de Salud y Aptitud Médica Pre-Tarea': `Seguridad Social: ${fd.seguridadSocial || 'Sí'} | Aptitud Médica: ${fd.aptitudMedica || 'Sí'}`,
              'Firmas del Ejecutante, Coordinador de Trabajo en Alturas y Emisor': resps.map((r) => `${r.rol || 'Coordinador'}: ${r.nombre} (CC ${r.cedula})`).join(' | '),
            }
          : {
              'Descripción de la Tarea Crítica, Área y Fecha de Ejecución': `${fd.actividadGlobal || ''} en ${fd.ubicacion || fd.area || ''} (${fd.fecha || ''} ${fd.horaInicio || ''}-${fd.horaFin || ''})`,
              'Trabajadores Ejecutantes y Supervisor / Emisor (Cédula, Nombre y Firma)': `Ejecutante: ${t.nombre || ''} (CC ${t.cedula || ''}) | Supervisores: ${resps.map((r) => `${r.nombre} (${r.rol || ''})`).join(', ')}`,
              'Cédula / Documento': t.cedula || '',
              'Nombre Completo': t.nombre || '',
              'Herramientas, Equipos y EPP Requeridos': `Herramientas/Equipos: ${fd.herramientasEquipos || ''} | EPP: ${fd.epccEpp || ''}`,
              'Pasos Secuenciales de la Tarea': formatCleanScalar(fd.pasosTarea || fd.actividadGlobal, ''),
              'Controles Requeridos antes y durante la Tarea (Bloqueo/Etiquetado, Medición Atmósfera, EPP)': `Charla Preop: ${fd.seguridadSocial || 'Sí'} | Equipos Inspeccionados: ${fd.aptitudMedica || 'Sí'} | Área Verificada: ${fd.certificacionAlturas || 'Sí'}`,
            },
        };
      }),
      ...(isAlturas
        ? inboxQr.map((inb, idx) => ({
            id: inb.id || `alt_qr_${idx}`,
            label: `[Solicitud QR Permiso Alturas] ${inb.trabajador?.nombre || inb.nombre || 'Ejecutante'} (CC ${inb.trabajador?.cedula || inb.cedula || ''})`,
            sublabel: `Ubicación: ${inb.data?.ubicacion || ''} • Altura: ${inb.data?.altura || ''}m • Estado: ${inb.status || 'pending'}`,
            badge: inb.status === 'approved' || inb.status === 'processed' ? 'APROBADO' : 'PENDIENTE FIRMA',
            badgeTone: inb.status === 'approved' || inb.status === 'processed' ? 'emerald' : 'amber',
            isCritical: inb.status !== 'approved' && inb.status !== 'processed',
            fields: {
              'Trabajador Autorizado (Cédula, Nombre, Cargo, ARL, EPS y Curso Alturas Vigente)': `${inb.trabajador?.nombre || inb.nombre || ''} (CC ${inb.trabajador?.cedula || inb.cedula || ''})`,
              'Descripción, Ubicación, Altura Aproximada (m) y Fecha/Hora del Trabajo': `${inb.data?.descripcion || inb.data?.actividad || ''} en ${inb.data?.ubicacion || ''}`,
              'Estado de Autorización QR en Campo': inb.status || 'pending',
            },
          }))
        : []),
    ];

    return {
      moduleTitle: isAlturas
        ? 'Hito 5 · Permiso de Trabajo en Alturas (Res. 4272 de 2021)'
        : 'Hito 5 · Análisis de Trabajo Seguro (ATS Paso a Paso)',
      sourceCollection: isAlturas ? 'PermisoAlturasData' : 'AnalisisTrabajoSeguroData',
      latestReports,
      kpis: [
        { label: 'Trabajadores en Tarea', value: trabs.length, tone: 'teal' },
        { label: 'Responsables / Coordinadores', value: resps.length, tone: 'indigo' },
        { label: 'Aptitud / Verificación', value: fd.aptitudMedica || 'Sí', tone: fd.aptitudMedica === 'No' ? 'rose' : 'emerald' },
      ],
      records,
    };
  }

  // 33. Hito 5 · Hoja de Vida e Inspección de Equipos de Alturas
  if (canonicalId === 'hito5_equipos_alturas') {
    const SgsstHeightsData = getSafeModel('SgsstHeightsData', '~/server/routes/sgsst/heights', '~/models/SgsstHeightsData');
    const [docs, latestReports] = await Promise.all([
      findManyCompanyDocs(SgsstHeightsData, userId, company, { updatedAt: -1 }, 100),
      fetchLatestReportsForTags(userId, company, ['sgsst-equipos-alturas', 'sgsst-heights'], 5),
    ]);
    const records = [];
    for (const d of docs) {
      const workerCedula = d.documento || d.cedula || d.workerId || '';
      for (const eq of d.equipos || []) {
        const inspExp = isDateExpiredOrWithinDays(eq.fechaProximaInspeccion, 30);
        const isCrit =
          eq.estado === 'Vencido' ||
          eq.estado === 'Requiere Inspección' ||
          eq.resultadoInspeccion === 'Rechazado' ||
          inspExp;
        records.push({
          id: eq.id || eq.serial || `${d._id}_${records.length}`,
          label: `${eq.nombre || eq.tipo || 'Equipo Alturas'} (${eq.marca || ''} ${eq.referencia || ''}) — Serial: ${eq.serial || 'S/N'}`,
          sublabel: `Asignado a: ${d.nombreTrabajador || 'Bodega'} (CC ${workerCedula || 'N/A'} · ${d.cargo || ''} · ${d.area || ''}) • Próx. Inspección: ${eq.fechaProximaInspeccion || 'N/A'}`,
          badge: `${eq.estado || 'Vigente'} • ${eq.resultadoInspeccion || 'Aprobado'}`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Trabajador Custodio / Bodega Asignada': `${d.nombreTrabajador || 'Bodega'} (CC ${workerCedula || 'N/A'} - Cargo: ${d.cargo || ''} - Área: ${d.area || ''})`,
            'Cédula / Documento': String(workerCedula || ''),
            'Tipo de Equipo (Arnés, Eslinga con Absorbedor, Línea de Vida, Mosquetón, Freno, Casco Barbuquejo)': `${eq.tipo || ''} ${eq.nombre || ''}`.trim(),
            'Marca, Modelo, Número de Serie / Lote y Norma de Certificación (ANSI Z359 / EN)': `${eq.marca || ''} ${eq.referencia || ''} (Serial: ${eq.serial || ''} | Lote: ${eq.lote || 'N/A'} | Norma: ${eq.normaCertificacion || 'ANSI Z359'})`,
            'Fecha de Fabricación, Fecha de Puesta en Servicio y Vida Útil': `Fab: ${eq.fechaFabricacion || ''} | Compra/Servicio: ${eq.fechaCompra || ''}`,
            'Historial de Inspecciones Preoperacionales y Anuales por Persona Competente / Avalada': `Última: ${eq.fechaUltimaInspeccion || ''} | Próxima: ${eq.fechaProximaInspeccion || ''} | Inspector: ${eq.inspeccionadoPor || ''}`,
            'Estado del Equipo (Apto / En Cuarentena / Dado de Baja por Impacto o Deterioro)': `${eq.estado || ''} (${eq.resultadoInspeccion || ''}) - Obs: ${eq.observaciones || ''}`,
          },
        });
      }
    }

    return {
      moduleTitle: 'Hito 5 · Hoja de Vida e Inspección de Equipos Contra Caídas (Res. 4272)',
      sourceCollection: 'SgsstHeightsData',
      latestReports,
      kpis: [
        { label: 'Total Equipos Alturas', value: records.length, tone: 'teal' },
        { label: 'Vigentes / Aprobados', value: records.filter((r) => !r.isCritical).length, tone: 'emerald' },
        { label: 'Vencidos o Rechazados', value: records.filter((r) => r.isCritical).length, tone: 'rose' },
      ],
      records,
    };
  }

  // 34. Hito 5 · Gestión, Inventario y Entrega de EPP
  if (canonicalId === 'hito3_epp') {
    const SgsstEppData = getSafeModel('SgsstEppData', '~/server/routes/sgsst/epp', '~/models/SgsstEppData');
    const SgsstEppInventory = getSafeModel('SgsstEppInventory', '~/server/routes/sgsst/epp', '~/models/SgsstEppInventory');
    const SgsstEppSolicitud = getSafeModel('SgsstEppSolicitud', '~/server/routes/sgsst/epp', '~/models/SgsstEppSolicitud');

    const [entregasDocs, invDocs, solDocs, latestReports] = await Promise.all([
      findManyCompanyDocs(SgsstEppData, userId, company, { updatedAt: -1 }, 100),
      findManyCompanyDocs(SgsstEppInventory, userId, company, { updatedAt: -1 }, 100),
      findManyCompanyDocs(SgsstEppSolicitud, userId, company, { createdAt: -1 }, 50),
      fetchLatestReportsForTags(userId, company, ['sgsst-epp', 'sgsst-entrega-epp'], 5),
    ]);

    const records = [];
    let totalEntregasCount = 0;
    for (const d of entregasDocs) {
      const workerCedula = String(d.documento || d.cedula || d.identificacion || d.workerId || 'S/D').trim();
      const workerName = d.nombreTrabajador || d.nombre || 'Trabajador';
      const itemsList = Array.isArray(d.entregas) && d.entregas.length > 0 ? d.entregas : Array.isArray(d.epps) ? d.epps : [];
      totalEntregasCount += itemsList.length;

      for (const epp of itemsList) {
        const eppName = epp.elemento || epp.nombre || epp.epp || 'EPP';
        const eppExp =
          isDateExpiredOrWithinDays(epp.fechaVencimiento || epp.proximaReposicion, 30) ||
          isDateExpiredOrWithinDays(epp.fechaProximaInspeccion, 30);
        const isCrit =
          epp.estado === 'Vencido' ||
          epp.estado === 'Requiere Reposición' ||
          epp.estado === 'Inspección Requerida' ||
          epp.estado === 'Fuera de Servicio' ||
          epp.resultadoInspeccion === 'Rechazado' ||
          eppExp;
        const hasFirma = Boolean(epp.firmaTrabajador || epp.firmado || d.firmaTrabajador);
        records.push({
          id: epp.id || `${workerCedula}_${eppName}_${records.length}`,
          label: `[Entrega EPP] ${workerName} (CC ${workerCedula}) — ${eppName}`,
          sublabel: `Cargo: ${d.cargo || 'Operativo'} • Entrega: ${epp.fechaEntrega || 'Registrada'} • Vence: ${epp.fechaVencimiento || epp.proximaReposicion || 'N/A'} • Cant: ${epp.cantidad || 1}`,
          badge: epp.estado || 'Vigente',
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Trabajador Receptor (Cédula, Nombre y Cargo)': `${workerName} (CC ${workerCedula}) - ${d.cargo || 'Operativo'}`,
            'Cédula / Documento': workerCedula,
            'Nombre Completo': workerName,
            'Cargo': d.cargo || 'Operativo',
            'Elemento de Protección Personal Entregado y Norma Técnica': `${eppName} (${epp.normaTecnica || epp.marca || ''} ${epp.referencia || ''})`.trim(),
            'Talla, Cantidad, Fecha de Entrega y Fecha de Próxima Reposición': `Talla: ${epp.talla || 'Única'} | Cant: ${epp.cantidad || 1} | Entrega: ${epp.fechaEntrega || 'Registrada'} | Vencimiento: ${epp.fechaVencimiento || epp.proximaReposicion || 'Vigente'}`,
            'Motivo de Entrega y Observaciones': `${epp.motivoEntrega || 'Dotación / Reposición'} — ${epp.observaciones || 'Sin observaciones'}`,
            'Estado de Stock e Inventario Mínimo por Referencia': epp.estado || 'Vigente',
            'Firma de Recibido e Inducción de Uso y Mantenimiento': hasFirma ? 'Firmado digitalmente' : 'Pendiente firma',
          },
        });
      }
    }

    for (const inv of invDocs) {
      const low = Number(inv.stockActual) <= Number(inv.stockMinimo);
      records.push({
        id: inv.id || inv.codigo || String(inv._id),
        label: `[Bodega EPP] ${inv.nombre || ''} (${inv.categoria || ''}) — Talla ${inv.talla || 'Única'}`,
        sublabel: `Stock Actual: ${inv.stockActual ?? 0} / Mínimo: ${inv.stockMinimo ?? 0} • Bodega: ${inv.ubicacionBodega || 'Principal'}`,
        badge: low ? `STOCK BAJO (${inv.stockActual})` : `Stock OK (${inv.stockActual})`,
        badgeTone: low ? 'rose' : 'indigo',
        isCritical: low,
        fields: {
          'Elemento de Protección Personal Entregado y Norma Técnica': `${inv.nombre || ''} (${inv.categoria || ''} - Norma: ${inv.normaTecnica || 'ANSI/NTC'})`,
          'Estado de Stock e Inventario Mínimo por Referencia': `Stock Actual: ${inv.stockActual ?? 0} | Mínimo: ${inv.stockMinimo ?? 0} (${inv.ubicacionBodega || ''})`,
        },
      });
    }

    for (let sIdx = 0; sIdx < solDocs.length; sIdx++) {
      const sol = solDocs[sIdx];
      const isPend = sol.estado !== 'entregado' && sol.estado !== 'aprobado' && sol.estado !== 'cerrado';
      const solElemSummary =
        sol.elementoSolicitado ||
        sol.epp ||
        (Array.isArray(sol.items) && sol.items.length > 0
          ? sol.items.map((it) => `${it.nombre || it.elemento || 'EPP'} x${it.cantidad || 1}`).join(', ')
          : 'EPP');
      records.push({
        id: String(sol._id || `epp_sol_${sIdx}`),
        label: `[Solicitud QR EPP] ${sol.nombreTrabajador || sol.nombre || 'Colaborador'} (CC ${sol.documento || sol.cedula || 'S/D'}) — ${solElemSummary}`,
        sublabel: `Motivo: ${sol.motivo || 'Reposición'} • Talla: ${sol.talla || 'Única'} • Estado: ${sol.estado || 'pendiente'}`,
        badge: isPend ? 'SOLICITUD QR PENDIENTE' : String(sol.estado || 'Atendida').toUpperCase(),
        badgeTone: isPend ? 'amber' : 'emerald',
        isCritical: isPend,
        fields: {
          'Trabajador Receptor (Cédula, Nombre y Cargo)': `${sol.nombreTrabajador || sol.nombre || ''} (CC ${sol.documento || sol.cedula || ''}) - ${sol.cargo || ''}`,
          'Cédula / Documento': String(sol.documento || sol.cedula || ''),
          'Nombre Completo': String(sol.nombreTrabajador || sol.nombre || 'Colaborador'),
          'Cargo': String(sol.cargo || 'Operativo'),
          'Elemento de Protección Personal Entregado y Norma Técnica': solElemSummary,
          'Motivo de Entrega y Observaciones': `Solicitud QR (${sol.motivo || 'Reposición'}): ${sol.observaciones || ''}`,
        },
      });
    }

    return {
      moduleTitle: 'Hito 5 · Gestión, Inventario y Entrega de EPP',
      sourceCollection: 'SgsstEppData + SgsstEppInventory + SgsstEppSolicitud',
      latestReports,
      kpis: [
        { label: 'Entregas a Trabajadores', value: totalEntregasCount, tone: 'teal' },
        { label: 'Referencias en Bodega', value: invDocs.length, tone: 'indigo' },
        { label: 'Alertas Stock / Vencidos', value: records.filter((r) => r.isCritical).length, tone: 'rose' },
        { label: 'Solicitudes QR', value: solDocs.length, tone: 'amber' },
      ],
      records,
    };
  }

  // 35. Hito 5 · Inventario de Productos Químicos y FDS en Terreno
  if (canonicalId === 'hito5_registro_quimico') {
    const SgsstChemicalData = getSafeModel('SgsstChemicalData', '~/server/routes/sgsst/chemicals', '~/models/SgsstChemicalData');
    const [doc, latestReports] = await Promise.all([
      findSingleCompanyDoc(SgsstChemicalData, userId, company),
      fetchLatestReportsForTags(userId, company, ['sgsst-registro-quimico', 'sgsst-quimicos'], 5),
    ]);
    const productos = Array.isArray(doc?.productos) ? doc.productos : [];
    const hasYes = (v) => v === true || /^s[ií]$/i.test(String(v || '').trim());
    const alertas = productos.filter((p) => !hasYes(p.tieneFds) || !hasYes(p.tieneRotuloSga)).length;

    return {
      moduleTitle: 'Hito 5 · Inventario de Productos Químicos y FDS en Terreno (Dec. 1496)',
      sourceCollection: 'SgsstChemicalData',
      latestReports,
      kpis: [
        { label: 'Sustancias en Terreno', value: productos.length, tone: 'teal' },
        { label: 'Con FDS y Rótulo SGA', value: productos.length - alertas, tone: 'emerald' },
        { label: 'Sin FDS o Sin Rótulo', value: alertas, tone: alertas > 0 ? 'rose' : 'emerald' },
      ],
      records: productos.map((p, i) => {
        const okFds = hasYes(p.tieneFds);
        const okSga = hasYes(p.tieneRotuloSga);
        const isCrit = !okFds || !okSga;
        return {
          id: p.id || `chem_${i}`,
          label: `${p.nombre || 'Producto Químico'} (CAS: ${p.numeroCas || 'N/A'} · ${p.claseOnu || 'SGA'})`,
          sublabel: `Fabricante: ${p.fabricante || ''} • Ubicación: ${p.ubicacion || ''} • Cantidad: ${p.cantidadAlmacenada || ''} • Palabra: ${p.palabraAdvertencia || 'Atención'}`,
          badge: `FDS: ${okFds ? 'Sí' : 'NO'} • Rótulo SGA: ${okSga ? 'Sí' : 'NO'}`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Nombre Comercial, Sustancia Activa, Fabricante y Área de Uso': `${p.nombre || ''} (CAS: ${p.numeroCas || 'N/A'} - Fab: ${p.fabricante || ''}) - Área: ${p.ubicacion || ''}`,
            'Número CAS y Clase ONU': `CAS: ${p.numeroCas || 'N/A'} | ONU: ${p.claseOnu || 'N/A'}`,
            'Estado Físico, Cantidad Almacenada y Tipo de Envase': `${p.estadoFisico || ''} - Cantidad: ${p.cantidadAlmacenada || ''}`,
            'Etiquetado SGA en Envase Original y Trasvases': `Rótulo SGA: ${okSga ? 'Sí' : 'No'} | Palabra Advertencia: ${p.palabraAdvertencia || ''} | Pictogramas: ${(p.pictogramasSga || []).join(', ')}`,
            'Indicaciones de Peligro (Frases H) y Consejos de Prudencia (Frases P)': `H: ${formatCleanScalar(p.indicacionesPeligroH, 'N/A')} | P: ${formatCleanScalar(p.consejosPrudenciaP, 'N/A')}`,
            'Disponibilidad de FDS en el Punto de Trabajo': `${okFds ? 'Sí tiene FDS' : 'Falta FDS'} (Vigencia FDS: ${p.fechaVigenciaFds || 'N/A'}${p.fichaUrl ? ` | URL: ${p.fichaUrl}` : ''})`,
            'Controles de Ventilación, Duchas Lavaojos y EPP Químico': `EPP: ${formatCleanScalar(p.eppRequerido, '')} | Almacenamiento: ${p.requisitosAlmacenamiento || ''} | Incompatibilidades: ${(p.incompatibilidades || []).join(', ')} | Expuestos: ${(p.trabajadoresExpuestos || []).join(', ')}`,
          },
        };
      }),
    };
  }

  // 36. Hito 5 · Parque Automotor e Inspección Preoperacional PESV
  if (canonicalId === 'hito3_vehiculos') {
    const SgsstVehicleData = getSafeModel('SgsstVehicleData', '~/server/routes/sgsst/vehicles', '~/models/SgsstVehicleData');
    const [vehicles, latestReports] = await Promise.all([
      findManyCompanyDocs(SgsstVehicleData, userId, company, { updatedAt: -1 }, 100),
      fetchLatestReportsForTags(userId, company, ['sgsst-vehiculos', 'sgsst-parque-automotor'], 5),
    ]);
    const now = Date.now();

    return {
      moduleTitle: 'Hito 5 · Parque Automotor e Inspección Preoperacional PESV',
      sourceCollection: 'SgsstVehicleData',
      latestReports,
      kpis: [
        { label: 'Vehículos en Flota', value: vehicles.length, tone: 'teal' },
        { label: 'Inspecciones Realizadas', value: vehicles.reduce((a, v) => a + (v.inspecciones?.length || 0), 0), tone: 'indigo' },
      ],
      records: vehicles.map((v, i) => {
        const inspArr = Array.isArray(v.inspecciones) ? v.inspecciones : [];
        const mantArr = Array.isArray(v.mantenimientos) ? v.mantenimientos : [];
        const lastInsp = inspArr.length > 0 ? inspArr[inspArr.length - 1] : null;
        const soatExp = isDateExpiredOrWithinDays(v.soatVencimiento, 30);
        const rtmExp = isDateExpiredOrWithinDays(v.tecnomecanicaVencimiento, 30);
        const licExp = isDateExpiredOrWithinDays(v.vencimientoLicenciaConductor, 30);
        const noApto = lastInsp && /no apto|restricci/i.test(lastInsp.resultado || '');
        const isCrit = soatExp || rtmExp || licExp || Boolean(noApto);

        return {
          id: v.placa || String(v._id || `veh_${i}`),
          label: `[Placa ${v.placa || 'S/P'}] ${v.marca || ''} ${v.referencia || ''} (${v.tipo || 'Vehículo'})`,
          sublabel: `Conductor: ${v.conductorNombre || 'Sin asignar'} (CC ${v.conductorId || ''}) • SOAT: ${v.soatVencimiento || 'N/A'} • RTM: ${v.tecnomecanicaVencimiento || 'N/A'}`,
          badge: lastInsp ? `${lastInsp.resultado} (${v.kilometrajeActual || 0} km)` : `${v.kilometrajeActual || 0} km`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Placa, Tipo de Vehículo, Marca, Modelo y Kilometraje': `Placa: ${v.placa || ''} | ${v.tipo || ''} ${v.marca || ''} ${v.referencia || ''} (${v.modelo || v.anio || ''}) | Propiedad: ${v.propiedad || 'Empresa'} | Lic. Tránsito: ${v.licenciaTransito || 'N/A'} | ${v.kilometrajeActual || 0} km`,
            'Conductor Asignado (Cédula, Nombre, Categoría y Vigencia de Licencia y SIMIT)': `${v.conductorNombre || ''} (CC ${v.conductorId || ''}) | Cat. Licencia: ${v.categoriaLicenciaConductor || 'N/A'} | Vence Lic.: ${v.vencimientoLicenciaConductor || 'N/A'}`,
            'Cédula / Documento': String(v.conductorId || ''),
            'Vigencia de SOAT, Revisión Técnico-Mecánica y Póliza': `SOAT: ${v.soatVencimiento || ''} | Tecnomecánica: ${v.tecnomecanicaVencimiento || ''} | Póliza Todo Riesgo: ${v.polizaTodoRiesgoVencimiento || 'N/A'}`,
            'Resultado de Inspección Preoperacional Diaria (Frenos, Llantas, Luces, Dirección, Kit de Carretera)': lastInsp ? `Última (${lastInsp.fecha || ''}): ${lastInsp.resultado || ''} (Frenos: ${lastInsp.frenos || 'OK'}, Llantas: ${lastInsp.llantas || 'OK'}, Luces: ${lastInsp.luces || 'OK'}) | Total inspecciones: ${inspArr.length}` : 'Sin inspección reciente',
            'Historial de Mantenimiento Preventivo y Correctivo': `Último: ${v.ultimoMantenimiento || ''} | Próximo: ${v.proximoMantenimiento || ''} | Registros taller: ${mantArr.length}`,
            'Estado Operativo (Apto para Operar / Con Restricción / Inmovilizado)': lastInsp?.resultado || (isCrit ? 'Alerta Documental / Operativa' : 'Apto para Operar'),
          },
        };
      }),
    };
  }

  // 37. Hito 5 · Inspección de Equipos de Emergencia (Extintores, Botiquines, Camillas)
  if (canonicalId === 'hito5_equipos_emergencia') {
    const PlanEmergenciasData = getSafeModel('PlanEmergenciasData', '~/server/routes/sgsst/planEmergencias', '~/models/PlanEmergenciasData');
    const doc = await findSingleCompanyDoc(PlanEmergenciasData, userId, company);
    const equipos = Array.isArray(doc?.recursosEquipos) ? doc.recursosEquipos : [];
    const reports = await fetchLatestReportsForTags(userId, company, ['sgsst-equipos-emergencia'], 5);

    const records = [
      ...equipos.map((eq, i) => {
        const isCrit = eq.estado && !/operativo/i.test(eq.estado);
        return {
          id: eq.id || `eq_em_${i}`,
          label: `[${eq.tipoRecurso || 'Equipo Emergencia'}] ${eq.descripcion || ''} — Ubicación: ${eq.ubicacion || ''}`,
          sublabel: `Cantidad: ${eq.cantidad || 1} • Inspección/Recarga: ${eq.fechaInspeccion || 'N/A'} • Resp: ${eq.responsable || 'Brigada'}`,
          badge: eq.estado || 'Operativo',
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: Boolean(isCrit),
          fields: {
            'Extintores (Tipo ABC/CO2/Solkaflam, Capacidad, Ubicación, Presión, Sello y Fecha de Próxima Recarga)': `${eq.tipoRecurso || ''}: ${eq.descripcion || ''} (${eq.ubicacion || ''}) - Fecha: ${eq.fechaInspeccion || ''}`,
            'Botiquines de Primeros Auxilios (Inventario de Insumos y Fechas de Vencimiento)': eq.descripcion || '',
            'Camillas Rígidas, Inmovilizadores, Alarmas, Gabinetes e Iluminación de Emergencia': `${eq.tipoRecurso || ''} (${eq.estado || ''})`,
            'Hallazgos de Inspección y Reposición de Elementos': eq.estado || 'Operativo',
          },
        };
      }),
      ...reports.map((r) => ({
        id: r.conversationId,
        label: `📄 ${r.title}`,
        sublabel: r.preview,
        badge: 'Informe Guardado',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          'Hallazgos de Inspección y Reposición de Elementos': r.preview,
        },
      })),
    ];

    return {
      moduleTitle: 'Hito 5 · Inspección de Equipos de Emergencia (Extintores, Botiquines y Camillas)',
      sourceCollection: 'PlanEmergenciasData.recursosEquipos + ConversationHistory',
      latestReports: reports,
      kpis: [
        { label: 'Equipos Registrados', value: equipos.length, tone: 'teal' },
        { label: 'Operativos', value: equipos.filter((e) => /operativo/i.test(e.estado || 'Operativo')).length, tone: 'emerald' },
        { label: 'Por Recargar / Mant.', value: equipos.filter((e) => !/operativo/i.test(e.estado || 'Operativo')).length, tone: 'rose' },
      ],
      records,
    };
  }

  return null;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INSPECTORES EN VIVO DE HITOS 6, 7 Y 8 (13 APLICATIVOS)
 * ═══════════════════════════════════════════════════════════════════════════
 */
async function inspectHito6To8(canonicalId, userId, company) {
  // 38. Hito 6 · Matriz de Comunicaciones Internas y Externas SST
  if (canonicalId === 'hito6_comunicaciones_sst') {
    const ContextoData = getSafeModel('ContextoData', '~/server/routes/sgsst/contexto', '~/models/ContextoData');
    const doc = await findSingleCompanyDoc(ContextoData, userId, company);
    const stakeholders = Array.isArray(doc?.stakeholders) ? doc.stakeholders : [];
    const reports = await fetchLatestReportsForTags(userId, company, ['sgsst-comunicaciones'], 5);

    const records = [
      ...stakeholders.map((s, i) => ({
        id: s.id || `com_stk_${i}`,
        label: `[Protocolo ${s.type || 'Interno'}] Audiencia: ${s.parte || 'Colaboradores'}`,
        sublabel: `Qué comunicar: ${s.necesidades || ''} • Canal: ${s.communicationChannel || ''} • Frecuencia: ${s.frequency || 'Mensual'}`,
        badge: `${s.type || 'Interno'} · ${s.frequency || 'Mensual'}`,
        badgeTone: 'teal',
        isCritical: false,
        fields: {
          'Tema / Mensaje SST a Comunicar (Qué comunicar)': `${s.necesidades || ''} | ${s.expectativas || ''}`,
          'Público Objetivo Interno / Externo (A quién comunicar)': `${s.parte || ''} (${s.type || 'Interno'})`,
          'Canal Oficial, Frecuencia y Responsable de la Comunicación': `${s.communicationChannel || ''} (${s.frequency || ''})`,
          'Mecanismo de Recepción de Inquietudes, Aportes y Autorreportes': s.control || '',
        },
      })),
      ...reports.map((r) => ({
        id: r.conversationId,
        label: `📄 ${r.title}`,
        sublabel: r.preview,
        badge: 'Matriz Oficial',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          'Tema / Mensaje SST a Comunicar (Qué comunicar)': r.preview,
        },
      })),
    ];

    return {
      moduleTitle: 'Hito 6 · Matriz de Comunicaciones Internas y Externas SST (Est. 2.8.1)',
      sourceCollection: 'ContextoData.stakeholders + ConversationHistory',
      latestReports: reports,
      kpis: [
        { label: 'Canales / Audiencias', value: stakeholders.length, tone: 'teal' },
        { label: 'Informes en Historial', value: reports.length, tone: 'indigo' },
      ],
      records,
    };
  }

  // 39. Hito 6 · Programa Anual de Capacitaciones SST
  if (canonicalId === 'hito5_capacitaciones') {
    const ProgramaCapacitacionesData = getSafeModel('ProgramaCapacitacionesData', '~/server/routes/sgsst/programaCapacitaciones');
    const [doc, tagReports] = await Promise.all([
      findSingleCompanyDoc(ProgramaCapacitacionesData, userId, company),
      fetchLatestReportsForTags(userId, company, ['sgsst-capacitaciones', 'sgsst-programa-capacitaciones'], 5),
    ]);
    const sesiones = Array.isArray(doc?.sesiones) ? doc.sesiones : [];
    const completadas = sesiones.filter((s) => s.estado === 'Completada').length;
    const pendientes = sesiones.filter((s) => s.estado !== 'Completada').length;
    const embeddedActas = sesiones
      .filter((s) => typeof s.actaHtml === 'string' && s.actaHtml.trim().length > 80)
      .slice(0, 5)
      .map((s, idx) => ({
        conversationId: `cap_acta_${s.id || idx}`,
        title: `Acta de Capacitación — ${s.tema || `Sesión #${idx + 1}`}`,
        html: s.actaHtml,
        charCount: s.actaHtml.length,
        preview: stripHtmlToText(s.actaHtml).slice(0, 280),
        updatedAt: s.fecha || doc?.updatedAt || null,
      }));
    const latestReports = [...tagReports, ...embeddedActas];

    return {
      moduleTitle: 'Hito 6 · Programa Anual de Capacitaciones, Inducción y Reinducción SST (Est. 1.2.1)',
      sourceCollection: 'ProgramaCapacitacionesData',
      latestReports,
      kpis: [
        { label: 'Sesiones Programadas', value: sesiones.length, tone: 'teal' },
        { label: 'Completadas', value: completadas, tone: 'emerald' },
        { label: 'Pendientes / En Curso', value: pendientes, tone: pendientes > 0 ? 'amber' : 'emerald' },
      ],
      records: sesiones.map((s, i) => {
        const asist = Array.isArray(s.trabajadoresRegistrados) ? s.trabajadoresRegistrados : [];
        const isCrit = s.estado !== 'Completada';
        return {
          id: s.id || `cap_${i}`,
          label: `${s.tema || 'Capacitación SST'} (${s.fecha || 'Por programar'} ${s.hora || ''})`,
          sublabel: `Tipo: ${s.tipo || 'Capacitación'} • Modalidad: ${s.modalidad || 'Presencial'} • Lugar: ${s.lugar || 'Sede'} • Asistentes: ${asist.length}`,
          badge: s.estado || 'Programada',
          badgeTone: s.estado === 'Completada' ? 'emerald' : 'amber',
          isCritical: isCrit,
          fields: {
            'Tema de Capacitación, Inducción o Entrenamiento': `${s.tema || ''} (${s.tipo || 'Capacitación'}) — Objetivo: ${s.objetivo || s.descripcion || ''}`,
            'Cargos y Trabajadores Objetivo (Convocados vs Asistentes)': asist.map((a) => `${a.nombre} (CC ${a.cedula || ''})`).join(', ') || 'Toda la nómina',
            'Fecha Programada, Intensidad Horaria, Modalidad y Capacitador': `Fecha: ${s.fecha || ''} ${s.hora || ''} | Duración: ${s.duracion || ''}h | Modalidad: ${s.modalidad || 'Presencial'} | Lugar: ${s.lugar || ''} | Resp: ${s.responsable || ''}`,
            'Indicadores de Cobertura, Cumplimiento y Eficacia': `Estado: ${s.estado || ''} | Asistentes: ${asist.length} | Evaluación Aplicada: ${s.evaluacionAplicada ? 'Sí' : 'Por aplicar'}`,
            'Registro de Asistencia, Evaluación y Certificados': `${s.descripcion || ''}${s.actaHtml ? ' | Acta Oficial Firmada Disponible' : ''}`.trim(),
          },
        };
      }),
    };
  }

  // 40. Hito 6 · Rutas de Aprendizaje y Escuela Virtual LMS
  if (canonicalId === 'hito6_ruta_aprendizaje') {
    const Course = getSafeModel('Course', null, '~/models/Course');
    const UserProgress = getSafeModel('UserProgress', null, '~/models/UserProgress');
    const companyScope = buildCompanyScopeFilter(userId, company);
    const globalAuthorFilter = userId ? { isPublished: true, author: String(userId) } : null;

    const [companyCourses, authorCourses, progresses, latestReports] = await Promise.all([
      findManyCompanyDocs(Course, userId, company, { updatedAt: -1 }, 50),
      Course && globalAuthorFilter
        ? Course.find(globalAuthorFilter).sort({ updatedAt: -1 }).limit(30).lean().catch(() => [])
        : [],
      findManyCompanyDocs(UserProgress, userId, company, { updatedAt: -1 }, 100),
      fetchLatestReportsForTags(userId, company, ['sgsst-ruta-aprendizaje', 'sgsst-lms'], 5),
    ]);

    const courseMap = new Map();
    const companyIdStr = company?._id ? String(company._id) : null;
    for (const c of [...companyCourses, ...authorCourses]) {
      if (!c?._id) continue;
      if (companyIdStr && c.companyId && String(c.companyId) !== companyIdStr) continue;
      courseMap.set(String(c._id), c);
    }
    const courses = Array.from(courseMap.values());

    const records = [
      ...courses.map((c, i) => ({
        id: String(c._id || `crs_${i}`),
        label: `[Curso LMS] ${c.title || 'Curso SST'}`,
        sublabel: `Lecciones: ${(c.lessons || []).length} • Asignación: ${c.assignmentType || 'all'} • Examen: ${c.exam?.passingScore || 80}%`,
        badge: c.isPublished ? 'Publicado' : 'Borrador',
        badgeTone: c.isPublished ? 'emerald' : 'amber',
        isCritical: !c.isPublished,
        fields: {
          'Curso / Módulo Formativo y Competencia Asociada': `${c.title || ''}: ${c.description || 'Formación virtual SST'}`,
          'Trabajador Inscrito (Cédula, Nombre y Cargo)': (c.assignedCargos || []).join(', ') || 'Todos los cargos',
          'Porcentaje de Avance de Lecciones (%)': `${(c.lessons || []).length} lecciones`,
          'Calificación de Examen / Quiz y Estado de Certificación': `Mínimo aprobación: ${c.exam?.passingScore || 80}%`,
        },
      })),
      ...progresses.map((p, i) => {
        const courseObj = p.course ? courseMap.get(String(p.course)) : null;
        const pName = p.workerName || p.nombre || 'Colaborador Inscrito';
        const pCedula = p.workerCedula || p.cedula || 'N/A';
        const totalLessons = Math.max(1, (courseObj?.lessons || []).length);
        const doneLessons = (p.completedLessons || []).length;
        const pct = courseObj ? `${Math.min(100, Math.round((doneLessons / totalLessons) * 100))}% (${doneLessons}/${totalLessons})` : `${doneLessons} lecciones completadas`;
        return {
          id: String(p._id || `prog_${i}`),
          label: `[Progreso LMS] ${pName} (CC ${pCedula})${courseObj?.title ? ` — ${courseObj.title}` : ''}`,
          sublabel: `Avance: ${pct} • Nota Examen: ${p.examScore ?? 'N/A'}`,
          badge: p.isCourseCompleted ? 'CERTIFICADO' : 'En Progreso',
          badgeTone: p.isCourseCompleted ? 'emerald' : 'amber',
          isCritical: !p.isCourseCompleted,
          fields: {
            'Curso / Módulo Formativo y Competencia Asociada': courseObj?.title || 'Ruta Formativa LMS',
            'Trabajador Inscrito (Cédula, Nombre y Cargo)': `${pName} (CC ${pCedula})`,
            'Cédula / Documento': String(pCedula),
            'Nombre Completo': pName,
            'Porcentaje de Avance de Lecciones (%)': pct,
            'Calificación de Examen / Quiz y Estado de Certificación': `${p.isCourseCompleted ? 'Aprobado y Certificado' : 'En curso'}${p.examScore !== undefined ? ` (Nota: ${p.examScore}%)` : ''}${p.certificateCode ? ` | Código Cert.: ${p.certificateCode}` : ''}`,
          },
        };
      }),
    ];

    return {
      moduleTitle: 'Hito 6 · Rutas de Aprendizaje y Escuela Virtual LMS',
      sourceCollection: 'Course + UserProgress',
      latestReports,
      kpis: [
        { label: 'Cursos LMS', value: courses.length, tone: 'teal' },
        { label: 'Trabajadores Inscritos', value: progresses.length, tone: 'indigo' },
        { label: 'Certificados Emitidos', value: progresses.filter((p) => p.isCourseCompleted).length, tone: 'emerald' },
      ],
      records,
    };
  }

  // 41. Hito 6 · Reporte de Actos y Condiciones Inseguras (Buzón QR)
  if (canonicalId === 'hito4_actos_condiciones') {
    const ReporteActosData = getSafeModel('ReporteActosData', '~/server/routes/sgsst/reporteActos');
    const [doc, latestReports] = await Promise.all([
      findSingleCompanyDoc(ReporteActosData, userId, company),
      fetchLatestReportsForTags(userId, company, ['sgsst-actos-condiciones', 'sgsst-reporte-actos'], 5),
    ]);
    const inbox = Array.isArray(doc?.inboxPublico) ? doc.inboxPublico : [];
    const resps = Array.isArray(doc?.responsablesList) ? doc.responsablesList : [];
    const fd = doc?.formData || {};

    const records = [
      ...(fd.actividadGlobal
        ? [
            {
              id: 'rep_acto_main',
              label: `[${fd.tipoHallazgo || fd.tipoReporte || 'Hallazgo Principal'}] ${fd.actividadGlobal.slice(0, 90)}`,
              sublabel: `Ubicación: ${fd.ubicacion || 'Planta'} • Fecha: ${fd.fecha || ''} • Intervención Urgente: ${fd.certificacionAlturas || 'Sí'}`,
              badge: fd.aptitudMedica === 'Sí' ? 'Actividad Suspendida' : 'Registrado',
              badgeTone: 'rose',
              isCritical: true,
              fields: {
                'Tipo de Hallazgo (Acto Inseguro / Condición Subestándar)': fd.tipoHallazgo || fd.tipoReporte || 'Condición / Acto Inseguro',
                'Descripción Detallada, Área / Sede, Fecha y Evidencia Fotográfica': `${fd.actividadGlobal || ''} (Área: ${fd.ubicacion || 'Planta'} - Fecha: ${fd.fecha || ''})`,
                'Trabajador Reportante (Cédula, Nombre y Cargo)': (doc?.trabajadoresList || []).map((t) => `${t.nombre} (CC ${t.cedula})`).join(', '),
                'Nivel de Criticidad y Peligro Asociado': fd.certificacionAlturas === 'Sí' ? 'Intervención Urgente' : 'Moderado',
                'Acción Correctiva Inmediata, Responsable y Estado de Cierre': `Suspendida preventivamente: ${fd.aptitudMedica || 'No'} | Responsables: ${resps.map((r) => r.nombre).join(', ') || 'SG-SST'}`,
              },
            },
          ]
        : []),
      ...inbox.map((inb, i) => {
        const fotosCount = Array.isArray(inb.data?.fotos) ? inb.data.fotos.length : Array.isArray(inb.evidencias) ? inb.evidencias.length : 0;
        return {
          id: inb.id || `inb_acto_${i}`,
          label: `[Buzón QR · ${inb.data?.tipoReporte || inb.data?.tipoHallazgo || 'Acto/Condición'}] ${inb.trabajador?.nombre || 'Colaborador'} (CC ${inb.trabajador?.cedula || ''}) — ${inb.data?.ubicacion || 'Planta'}`,
          sublabel: `${inb.data?.descripcion || ''}${fotosCount > 0 ? ` • 📷 ${fotosCount} foto(s)` : ''}`,
          badge: inb.status === 'processed' ? 'Procesado' : 'PENDIENTE GESTIÓN',
          badgeTone: inb.status === 'processed' ? 'emerald' : 'rose',
          isCritical: inb.status !== 'processed',
          fields: {
            'Tipo de Hallazgo (Acto Inseguro / Condición Subestándar)': inb.data?.tipoReporte || inb.data?.tipoHallazgo || 'Reporte QR Acto/Condición',
            'Descripción Detallada, Área / Sede, Fecha y Evidencia Fotográfica': `${inb.data?.descripcion || ''} (Área: ${inb.data?.ubicacion || ''} - Fecha: ${inb.data?.fecha || ''}${fotosCount > 0 ? ` - Evidencias: ${fotosCount}` : ''})`,
            'Trabajador Reportante (Cédula, Nombre y Cargo)': `${inb.trabajador?.nombre || ''} (CC ${inb.trabajador?.cedula || ''}) - ${inb.trabajador?.cargo || ''}`,
            'Cédula / Documento': inb.trabajador?.cedula || '',
            'Nombre Completo': inb.trabajador?.nombre || '',
            'Cargo': inb.trabajador?.cargo || '',
            'Nivel de Criticidad y Peligro Asociado': inb.data?.criticidad || inb.data?.nivelRiesgo || 'Por clasificar',
            'Acción Correctiva Inmediata, Responsable y Estado de Cierre': `${inb.data?.accionSugerida || ''} (Estado: ${inb.status || 'pending'})`.trim(),
          },
        };
      }),
    ];

    return {
      moduleTitle: 'Hito 6 · Reporte de Actos y Condiciones Inseguras (Buzón QR)',
      sourceCollection: 'ReporteActosData',
      latestReports,
      kpis: [
        { label: 'Total Reportes', value: records.length, tone: 'teal' },
        { label: 'Pendientes en Buzón', value: inbox.filter((x) => x.status !== 'processed').length, tone: 'rose' },
        { label: 'Procesados', value: inbox.filter((x) => x.status === 'processed').length, tone: 'emerald' },
      ],
      records,
    };
  }

  // 42. Hito 6 · Programación y Evaluación de Simulacros de Emergencia
  if (canonicalId === 'hito6_simulacros_emergencia') {
    const PlanEmergenciasData = getSafeModel('PlanEmergenciasData', '~/server/routes/sgsst/planEmergencias', '~/models/PlanEmergenciasData');
    const doc = await findSingleCompanyDoc(PlanEmergenciasData, userId, company);
    const simulacros = Array.isArray(doc?.simulacrosPlan) ? doc.simulacrosPlan : [];
    const reports = await fetchLatestReportsForTags(userId, company, ['sgsst-simulacros-emergencia'], 5);

    const records = [
      ...simulacros.map((s, i) => ({
        id: s.id || `sim_${i}`,
        label: `[Simulacro] ${s.tituloSimulacro || s.escenario || 'Simulacro de Evacuación'}`,
        sublabel: `Fecha: ${s.fechaProgramada || ''} • Tiempo Meta: ${s.tiempoRespuestaMeta || ''} • Participantes: ${s.participantesEsperados || ''}`,
        badge: s.estado || 'Programado',
        badgeTone: s.estado === 'Ejecutado' || s.estado === 'Evaluado' ? 'emerald' : 'amber',
        isCritical: Boolean(s.hallazgosMejora),
        fields: {
          'Fecha, Sede, Guion y Amenaza Simulada (Sismo, Incendio, Fuga, Evacuación)': `${s.tituloSimulacro || ''} - Escenario: ${s.escenario || ''} (${s.fechaProgramada || ''})`,
          'Tiempo Total de Alerta, Alistamiento y Evacuación al Punto de Encuentro': `Meta: ${s.tiempoRespuestaMeta || ''} | Participantes: ${s.participantesEsperados || ''}`,
          'Evaluación del Desempeño de la Brigada y Cadena de Mando': `Responsable: ${s.responsable || ''} | Estado: ${s.estado || ''}`,
          'Oportunidades de Mejora y Plan de Acción Post-Simulacro': s.hallazgosMejora || '',
        },
      })),
      ...reports.map((r) => ({
        id: r.conversationId,
        label: `📄 ${r.title}`,
        sublabel: r.preview,
        badge: 'Informe Simulacro',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          'Oportunidades de Mejora y Plan de Acción Post-Simulacro': r.preview,
        },
      })),
    ];

    return {
      moduleTitle: 'Hito 6 · Programación y Evaluación de Simulacros de Emergencia',
      sourceCollection: 'PlanEmergenciasData.simulacrosPlan + ConversationHistory',
      latestReports: reports,
      kpis: [
        { label: 'Simulacros en Plan', value: simulacros.length, tone: 'teal' },
        { label: 'Ejecutados / Evaluados', value: simulacros.filter((s) => s.estado !== 'Programado').length, tone: 'emerald' },
        { label: 'Informes Guardados', value: reports.length, tone: 'indigo' },
      ],
      records,
    };
  }

  // 43. Hito 6 · Creador de Aplicativos Personalizados
  if (canonicalId === 'hito6_app_builder') {
    const CanvasSession = getSafeModel('CanvasSession', '~/server/routes/sgsst/canvas', '~/models/CanvasSession');
    const sessions = await findManyCompanyDocs(CanvasSession, userId, company, { updatedAt: -1 }, 30);

    return {
      moduleTitle: 'Hito 6 · Creador de Aplicativos y Herramientas Interactivas SST',
      sourceCollection: 'CanvasSession',
      latestReports: [],
      kpis: [{ label: 'Sesiones / Apps Creadas', value: sessions.length, tone: 'teal' }],
      records: sessions.map((s, i) => ({
        id: s.conversationId || String(s._id || `app_${i}`),
        label: `${s.title || 'Aplicativo SST'} (${s.fileType || 'html'})`,
        sublabel: `Versión: ${s.version || 1} • Actualizado: ${s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('es-CO') : ''}`,
        badge: String(s.fileType || 'app').toUpperCase(),
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          'Nombre, Propósito y Estructura del Aplicativo SST': `${s.title || ''} (${s.fileType || ''})`,
          'Datos Capturados y Resultados Generados': stripHtmlToText(s.content || '').slice(0, 1200),
        },
      })),
    };
  }

  // 44. Hito 7 · Estadísticas de Accidentalidad, Enfermedad Laboral y Ausentismo (ATEL)
  if (canonicalId === 'hito7_estadisticas_atel') {
    const ATELAnnualData = getSafeModel('ATELAnnualData', '~/server/routes/sgsst/atel-data');
    const [docs, latestReports] = await Promise.all([
      findManyCompanyDocs(ATELAnnualData, userId, company, { year: -1 }, 5),
      fetchLatestReportsForTags(userId, company, ['sgsst-estadisticas-atel', 'sgsst-atel-estadisticas'], 5),
    ]);
    const events = [];
    let totalWorkedHours = 0;
    let workerMonthsSum = 0;
    let activeMonthsCount = 0;
    for (const d of docs) {
      const monthsObj = d.months instanceof Map ? Object.fromEntries(d.months) : d.months || {};
      for (const [mKey, mData] of Object.entries(monthsObj)) {
        const wh = Number(mData?.workedHours) || 0;
        const wc = Number(mData?.workersCount) || 0;
        if (wh > 0 || wc > 0 || (mData?.events || []).length > 0) {
          totalWorkedHours += wh;
          workerMonthsSum += wc;
          activeMonthsCount += 1;
        }
        for (const ev of mData?.events || []) {
          events.push({ ...ev, _year: d.year, _month: mKey, _workedHours: wh, _workersCount: wc });
        }
      }
    }
    const avgWorkers = activeMonthsCount > 0 ? Math.max(1, Math.round(workerMonthsSum / activeMonthsCount)) : Math.max(1, Number(company?.workerCount) || 1);
    const kConstant = 240000;
    const atEvents = events.filter((e) => e.tipo === 'AT');
    const atMortalCount = atEvents.filter((e) => Boolean(e.mortal || /mortal/i.test(e.gravedad || ''))).length;
    const elEvents = events.filter((e) => e.tipo === 'EL');
    const egEvents = events.filter((e) => e.tipo === 'EG' || e.tipo === 'Ausentismo');
    const atDays = atEvents.reduce((a, e) => a + (Number(e.diasIncapacidad) || 0) + (Number(e.diasCargados) || 0), 0);
    const egDays = egEvents.reduce((a, e) => a + (Number(e.diasIncapacidad) || 0), 0);
    const totalDays = events.reduce((a, e) => a + (Number(e.diasIncapacidad) || 0), 0);

    const freqAT = avgWorkers > 0 ? ((atEvents.length / avgWorkers) * 100).toFixed(2) : '0.00';
    const sevAT = avgWorkers > 0 ? ((atDays / avgWorkers) * 100).toFixed(2) : '0.00';
    const propMortal = atEvents.length > 0 ? ((atMortalCount / atEvents.length) * 100).toFixed(2) : '0.00';
    const prevEL = avgWorkers > 0 ? ((elEvents.length / avgWorkers) * 100000).toFixed(1) : '0.0';
    const incEL = prevEL;
    const progWorkDays = Math.max(1, avgWorkers * Math.max(1, activeMonthsCount) * 25);
    const ausentismoMed = ((egDays / progWorkDays) * 100).toFixed(2);
    const indicadoresSummaryStr = `Frecuencia AT: ${freqAT}% | Severidad AT: ${sevAT} días/100 trab. | Mortalidad AT: ${propMortal}% | Prevalencia/Incidencia EL: ${prevEL}×100k | Ausentismo Causa Médica: ${ausentismoMed}% (HHT=${totalWorkedHours || kConstant}, Prom. Trab.=${avgWorkers})`;

    const records = [
      ...(docs.length > 0
        ? [
            {
              id: `atel_ind_0312_${docs[0].year || new Date().getFullYear()}`,
              label: `📊 [6 Indicadores Mínimos Res. 0312 Art. 30 — Vigencia ${docs[0].year || new Date().getFullYear()}]`,
              sublabel: indicadoresSummaryStr,
              badge: `${atEvents.length} AT · ${elEvents.length} EL`,
              badgeTone: atEvents.length > 0 || elEvents.length > 0 ? 'amber' : 'emerald',
              isCritical: atMortalCount > 0,
              fields: {
                '6 Indicadores Mínimos Obligatorios Res. 0312 Art. 30': indicadoresSummaryStr,
                'Frecuencia de Accidentalidad (AT / Trabajadores × 100)': `${freqAT}%`,
                'Severidad de Accidentalidad (Días AT / Trabajadores × 100)': `${sevAT}`,
                'Proporción de Accidentes de Trabajo Mortales (%)': `${propMortal}%`,
                'Prevalencia e Incidencia de Enfermedad Laboral (por 100.000 trab.)': `Prevalencia: ${prevEL} | Incidencia: ${incEL}`,
                'Ausentismo por Causa Médica (%)': `${ausentismoMed}%`,
                'Horas Hombre Trabajadas (HHT) y Promedio de Trabajadores': `HHT: ${totalWorkedHours} | Promedio Trabajadores: ${avgWorkers}`,
              },
            },
          ]
        : []),
      ...events.map((ev, i) => {
        const isCrit = ev.tipo === 'AT' || ev.tipo === 'EL' || Number(ev.diasIncapacidad) >= 5;
        return {
          id: ev.id || `atel_ev_${i}`,
          label: `[${ev.tipo || 'Evento'}] ${ev.colaborador?.nombre || 'Colaborador'} (CC ${ev.colaborador?.cedula || ''}) — ${ev.fecha || ''}`,
          sublabel: `Cargo: ${ev.colaborador?.cargo || ''} • CIE-10: ${ev.diagnosticoCIE10 || 'N/A'} • Días Incap: ${ev.diasIncapacidad || 0} • Parte: ${ev.parteCuerpo || 'N/A'}`,
          badge: `${ev.tipo || 'Ausentismo'} · ${ev.diasIncapacidad || 0} día(s)`,
          badgeTone: isCrit ? 'rose' : 'amber',
          isCritical: isCrit,
          fields: {
            'Registro Individual de Eventos (Trabajador, Cédula, Fecha, Tipo AT/EL/EG, Días de Incapacidad, CIE-10, Parte del Cuerpo, Agente y Mecanismo)': `${ev.colaborador?.nombre || ''} (CC ${ev.colaborador?.cedula || ''}) | Fecha: ${ev.fecha || ''} | Tipo: ${ev.tipo || ''} | Días: ${ev.diasIncapacidad || 0} | CIE-10: ${ev.diagnosticoCIE10 || ''} | Parte: ${ev.parteCuerpo || ''} | Agente: ${ev.agente || ev.peligro || ''} | Mecanismo: ${ev.mecanismo || ''} | Sitio: ${ev.sitio || ''}`,
            'Cédula / Documento': ev.colaborador?.cedula || '',
            'Nombre Completo': ev.colaborador?.nombre || '',
            'Cargo': ev.colaborador?.cargo || '',
            'Diagnóstico CIE-10': ev.diagnosticoCIE10 || '',
            'Días de Incapacidad': String(ev.diasIncapacidad || 0),
            'Agente, Mecanismo, Sitio y Entidad Pagadora (EPS/ARL)': `Agente: ${ev.agente || ev.peligro || 'N/A'} | Mecanismo: ${ev.mecanismo || 'N/A'} | Sitio: ${ev.sitio || 'N/A'} | Pagadora: ${ev.entidadPagadora || 'EPS/ARL'}`,
            'Costos Directos e Indirectos del Ausentismo y Siniestralidad': `Pérdida Neta: $${ev.financiero?.perdidaNetaEmpresa || 0} | Recobro: ${ev.estadoRecobro || 'N/A'}`,
          },
        };
      }),
    ];

    return {
      moduleTitle: 'Hito 7 · Estadísticas ATEL, Ausentismo y 6 Indicadores Mínimos Res. 0312',
      sourceCollection: 'ATELAnnualData',
      latestReports,
      kpis: [
        { label: 'Total Eventos ATEL/Ausentismo', value: events.length, tone: 'teal' },
        { label: 'Accidentes de Trabajo (AT)', value: atEvents.length, tone: atEvents.length > 0 ? 'rose' : 'emerald' },
        { label: 'Enfermedad Laboral (EL)', value: elEvents.length, tone: elEvents.length > 0 ? 'rose' : 'emerald' },
        { label: 'Días de Incapacidad', value: totalDays, tone: 'amber' },
      ],
      records,
    };
  }

  // 45. Hito 7 · Investigación de Incidentes, Accidentes de Trabajo y Enfermedades Laborales (Res. 1401)
  if (canonicalId === 'hito7_investigacion_atel') {
    const InvestigacionAtelData = getSafeModel('InvestigacionAtelData', '~/server/routes/sgsst/investigacionAtel', '~/models/InvestigacionAtelData');
    const [list, latestReports] = await Promise.all([
      findManyCompanyDocs(InvestigacionAtelData, userId, company, { updatedAt: -1 }, 50),
      fetchLatestReportsForTags(userId, company, ['sgsst-investigacion-atel'], 10),
    ]);
    const graves = list.filter((x) => /grave|mortal/i.test(x.formData?.tipoEvento || '')).length;

    return {
      moduleTitle: 'Hito 7 · Investigación de Incidentes y Accidentes ATEL (Res. 1401 de 2007)',
      sourceCollection: 'InvestigacionAtelData',
      latestReports,
      kpis: [
        { label: 'Investigaciones ATEL', value: list.length, tone: 'teal' },
        { label: 'Graves / Mortales', value: graves, tone: graves > 0 ? 'rose' : 'emerald' },
        { label: 'Leves / Incidentes', value: Math.max(0, list.length - graves), tone: 'amber' },
        { label: 'Informes Oficiales Emitidos', value: latestReports.length, tone: 'indigo' },
      ],
      records: list.map((inv, i) => {
        const fd = inv.formData || {};
        const isCrit = /grave|mortal/i.test(fd.tipoEvento || '');
        const planAccionArr = Array.isArray(inv.planAccion) ? inv.planAccion : Array.isArray(fd.planAccion) ? fd.planAccion : [];
        const testimoniosArr = Array.isArray(inv.testimoniosInbox) ? inv.testimoniosInbox : [];
        const evidenciasArr = Array.isArray(inv.evidencias) ? inv.evidencias : [];
        return {
          id: inv.id || String(inv._id || `inv_${i}`),
          label: `[${fd.tipoEvento || 'Accidente'}] ${fd.afectadoNombre || 'Trabajador'} (CC ${fd.afectadoCedula || ''}) — ${fd.fechaEvento || ''}`,
          sublabel: `Cargo: ${fd.afectadoCargo || ''} • Lesión: ${fd.naturalezaLesion || ''} (${fd.parteCuerpo || ''}) • Agente: ${fd.agenteCausal || ''}`,
          badge: `${fd.tipoEvento || 'ATEL'} • ${fd.diasIncapacidad || 0} días incap.`,
          badgeTone: isCrit ? 'rose' : 'amber',
          isCritical: true,
          fields: {
            'Datos del Trabajador Afectado (Cédula, Nombre, Cargo, Antigüedad, EPS, ARL)': `${fd.afectadoNombre || ''} (CC ${fd.afectadoCedula || ''}) - Cargo: ${fd.afectadoCargo || ''} - EPS: ${fd.afectadoEps || ''} - ARL: ${fd.afectadoArl || ''}`,
            'Cédula / Documento': fd.afectadoCedula || '',
            'Nombre Completo': fd.afectadoNombre || '',
            'Cargo': fd.afectadoCargo || '',
            'Radicado FURAT / FUREL': fd.furatRadicado || inv.furatRadicado || 'En radicación',
            'Descripción Detallada del Evento (Fecha, Hora, Lugar, Tarea Realizada, Testigos)': `Fecha: ${fd.fechaEvento || ''} ${fd.horaEvento || ''} en ${fd.lugarEvento || ''} | Actividad: ${fd.actividadMomento || ''} | Hechos: ${fd.descripcionHechos || ''}`,
            'Naturaleza de la Lesión, Parte del Cuerpo Afectada, Agente y Mecanismo del Accidente': `Lesión: ${fd.naturalezaLesion || ''} | Parte: ${fd.parteCuerpo || ''} | Agente: ${fd.agenteCausal || ''} | Mecanismo: ${fd.mecanismoAccidente || ''} | Días: ${fd.diasIncapacidad || 0}`,
            'Análisis Causal (Causas Inmediatas, Causas Básicas, 5 Porqués y Árbol de Causas NTC 3701)': `Causas Inmediatas: ${formatCleanScalar(fd.causasInmediatas || inv.causasInmediatas, 'Por determinar')} | Causas Básicas: ${formatCleanScalar(fd.causasBasicas || inv.causasBasicas, 'Por determinar')} | 5 Porqués / Árbol: ${formatCleanScalar(fd.cincoPorques || fd.arbolCausas || inv.cincoPorques, 'En análisis')}`,
            'Plan de Acción Correctivo y Preventivo (Fuente, Medio e Individuo)': planAccionArr
              .map((pa) => `[${pa.control || pa.tipo || 'Control'}] ${pa.medida || pa.actividad || ''} (Resp: ${pa.responsable || ''} - Fecha: ${pa.fecha || ''})`)
              .join(' | ') || formatCleanScalar(fd.medidasIntervencion, 'Pendiente plan de acción'),
            'Versiones Libres de Testigos y Soportes Adjuntos': `Testimonios QR: ${testimoniosArr.length} | Evidencias adjuntas: ${evidenciasArr.length}`,
            'Equipo Investigador (Jefe Inmediato, Representante COPASST, Responsable SG-SST y Licencia SST en Graves/Mortales)': (inv.equipoList || []).map((e) => `${e.rol || ''}: ${e.nombre || ''} (CC ${e.cedula || ''}${e.licencia ? ` - Lic. ${e.licencia}` : ''})`).join(' | '),
          },
        };
      }),
    };
  }

  // 46. Hito 7 · Centro de Control y Tablero Kanban ACPM
  if (canonicalId === 'hito7_acpm') {
    const KanbanTask = getSafeModel('KanbanTask', '~/server/routes/sgsst/kanban', '~/models/KanbanTask');
    const [tasks, latestReports] = await Promise.all([
      findManyCompanyDocs(KanbanTask, userId, company, { dueDate: 1, updatedAt: -1 }, 150),
      fetchLatestReportsForTags(userId, company, ['sgsst-acpm', 'sgsst-kanban', 'sgsst-plan-anual'], 5),
    ]);
    const overdue = tasks.filter((t) => t.status === 'overdue').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const pending = tasks.filter((t) => t.status !== 'done' && t.status !== 'dismissed').length;

    return {
      moduleTitle: 'Hito 7 · Centro de Control y Tablero Kanban ACPM (Acciones Correctivas, Preventivas y de Mejora)',
      sourceCollection: 'KanbanTask',
      latestReports,
      kpis: [
        { label: 'Total Acciones ACPM', value: tasks.length, tone: 'teal' },
        { label: 'Vencidas (Overdue)', value: overdue, tone: overdue > 0 ? 'rose' : 'emerald' },
        { label: 'Abiertas / En Gestión', value: pending, tone: 'amber' },
        { label: 'Cerradas (Done)', value: done, tone: 'emerald' },
      ],
      records: tasks.map((t, i) => {
        const isCrit = t.status === 'overdue' || t.priority === 'alta' || t.priority === 'high';
        const commentsArr = Array.isArray(t.comments) ? t.comments : [];
        return {
          id: String(t._id || `acpm_${i}`),
          label: `[${String(t.actionType || 'correctiva').toUpperCase()}] ${t.title || 'Acción ACPM'}`,
          sublabel: `Origen: ${t.sourceModule || t.type || 'SG-SST'} • Resp: ${t.assignedTo || 'Responsable SST'} (${t.assignedEmail || 'N/A'}) • Vence: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-CO') : 'Por definir'}`,
          badge: `${String(t.status || 'todo').toUpperCase()} • Prioridad ${t.priority || 'media'}`,
          badgeTone: t.status === 'done' ? 'emerald' : isCrit ? 'rose' : 'amber',
          isCritical: t.status !== 'done' && isCrit,
          fields: {
            'Tipo de Acción (Correctiva / Preventiva / De Mejora)': t.actionType || 'correctiva',
            'Fuente del Hallazgo (Auditoría, Inspección, ATEL, COPASST, Revisión Dirección, Diagnóstico 0312)': t.sourceModule || t.type || '',
            'Descripción de la No Conformidad o Hallazgo y Análisis de Causa Raíz': `${t.title || ''}: ${t.description || ''}`,
            'Plan de Acción, Responsable, Recursos y Fecha Límite de Cumplimiento': `Resp: ${t.assignedTo || ''} (${t.assignedEmail || ''}) | Vence: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-CO') : ''} | Cerrada: ${t.completedAt ? new Date(t.completedAt).toLocaleDateString('es-CO') : 'Pendiente'}`,
            'Estado en el Tablero Kanban (Pendiente, En Ejecución, En Verificación, Cerrada, Vencida)': t.status || 'todo',
            'Evidencia de Cierre y Verificación de Eficacia': `${t.deliverable?.notes || ''} ${t.deliverable?.fileName ? `(${t.deliverable.fileName} - ${t.deliverable.fileUrl || ''})` : ''} ${commentsArr.length > 0 ? `| Comentarios: ${commentsArr.length}` : ''}`.trim(),
          },
        };
      }),
    };
  }

  // 47. Hito 7 · Auditoría Anual de Cumplimiento SG-SST (Dec. 1072)
  if (canonicalId === 'hito7_auditoria') {
    const AuditoriaData = getSafeModel('AuditoriaData', '~/server/routes/sgsst/auditoria', '~/models/AuditoriaData');
    const [doc, latestReports] = await Promise.all([
      findSingleCompanyDoc(AuditoriaData, userId, company),
      fetchLatestReportsForTags(userId, company, ['sgsst-auditoria', 'sgsst-auditoria-anual'], 5),
    ]);
    const items = Array.isArray(doc?.statusData) ? doc.statusData : [];
    const conformes = items.filter((i) => i.status === 'cumple').length;
    const noConformes = items.filter((i) => i.status === 'no_cumple' || i.status === 'parcial').length;
    const pct = doc?.weightedPercentage ?? doc?.compliancePercentage ?? 0;

    return {
      moduleTitle: 'Hito 7 · Auditoría Anual de Cumplimiento SG-SST (Dec. 1072 Art. 2.2.4.6.29)',
      sourceCollection: 'AuditoriaData',
      latestReports,
      kpis: [
        { label: 'Puntaje Auditoría', value: `${Math.round(pct)}%`, tone: pct >= 85 ? 'emerald' : pct >= 60 ? 'amber' : 'rose' },
        { label: 'Ítems Conformes', value: conformes, tone: 'emerald' },
        { label: 'No Conformidades / Obs.', value: noConformes, tone: noConformes > 0 ? 'rose' : 'emerald' },
      ],
      records: items.map((it, i) => {
        const isCrit = it.status === 'no_cumple' || it.status === 'parcial';
        const evFiles = Array.isArray(it.evidenceFiles) ? it.evidenceFiles : [];
        return {
          id: String(it.id || it.itemId || it.code || `aud_${i}`),
          label: `Cláusula ${it.code || i + 1} · ${it.name || it.description || 'Criterio Auditado'}`,
          sublabel: `Ciclo: ${String(it.category || '').toUpperCase()} • Peso: ${it.weight ?? 'N/A'} • Evidencia/Hallazgo: ${it.observation || 'Sin hallazgos'}`,
          badge: it.status === 'cumple' ? 'CONFORME' : it.status === 'no_cumple' ? 'NO CONFORME' : String(it.status || 'pendiente').toUpperCase(),
          badgeTone: it.status === 'cumple' ? 'emerald' : isCrit ? 'rose' : 'slate',
          isCritical: isCrit,
          fields: {
            'Programa y Plan de Auditoría Interna (Alcance, Criterios y Equipo Auditor)': `Auditor: ${doc?.reviewerInfo?.nombre || 'Auditor SG-SST'} (CC ${doc?.reviewerInfo?.cedula || 'N/A'} · Lic: ${doc?.reviewerInfo?.licencia || 'N/A'}) | Puntaje Global: ${Math.round(pct)}% (${doc?.complianceLevel || 'Evaluado'})`,
            'Lista de Chequeo por numeral del Decreto 1072 de 2015 y Resolución 0312': `${it.code || ''}: ${it.name || ''} (Peso: ${it.weight ?? 'N/A'} | Ciclo: ${it.category || ''})`,
            'Hallazgos de Auditoría (Conformidades, No Conformidades Mayores/Menores y Observaciones)': `${it.status || ''}: ${it.observation || ''}`,
            'Evidencias Objetivas Verificadas': `${it.observation || ''}${evFiles.length > 0 ? ` | Soportes adjuntos: ${evFiles.map((ef) => ef.fileName || ef.name || 'Soporte').join(', ')}` : ''}`,
            'Conclusiones de Auditoría y Solicitudes de Acción Correctiva (ACPM)': isCrit ? `${it.code || ''} - ${it.name || ''}: ${it.observation || 'Subsanar no conformidad'}` : '',
          },
        };
      }),
    };
  }

  // 48. Hito 7 · Revisión por la Alta Dirección (Dec. 1072 Art. 2.2.4.6.31)
  if (canonicalId === 'hito7_alta_direccion') {
    const AltaDireccionData = getSafeModel('AltaDireccionData', '~/server/routes/sgsst/altaDireccion');
    const [doc, latestReports] = await Promise.all([
      findSingleCompanyDoc(AltaDireccionData, userId, company),
      fetchLatestReportsForTags(userId, company, ['sgsst-alta-direccion', 'sgsst-revision-direccion'], 5),
    ]);
    const items = Array.isArray(doc?.statusData) ? doc.statusData : [];
    const inboxQr = Array.isArray(doc?.inboxPublico) ? doc.inboxPublico : [];
    const cumple = items.filter((i) => i.status === 'cumple').length;
    const pend = items.filter((i) => i.status === 'no_cumple' || i.status === 'parcial' || i.status === 'pendiente').length;
    const pct = doc?.compliancePercentage ?? (items.length > 0 ? Math.round((cumple / items.length) * 100) : 0);

    return {
      moduleTitle: 'Hito 7 · Revisión Anual por la Alta Dirección (24 Aspectos Art. 2.2.4.6.31)',
      sourceCollection: 'AltaDireccionData',
      latestReports,
      kpis: [
        { label: 'Aspectos Evaluados', value: `${items.length} / 24 (${pct}%)`, tone: 'teal' },
        { label: 'Cumplen', value: cumple, tone: 'emerald' },
        { label: 'Con Compromiso Gerencial', value: pend, tone: pend > 0 ? 'rose' : 'emerald' },
      ],
      records: [
        ...items.map((it, i) => {
          const isCrit = it.status === 'no_cumple' || it.status === 'parcial';
          const evFiles = Array.isArray(it.evidenceFiles) ? it.evidenceFiles : [];
          return {
            id: String(it.id || it.itemId || it.code || `ad_${i}`),
            label: `Aspecto ${it.code || i + 1} · ${it.name || it.title || 'Revisión Gerencial'}`,
            sublabel: `Decisión / Observación: ${it.observation || 'Sin observación'}${evFiles.length > 0 ? ` • ${evFiles.length} soporte(s)` : ''}`,
            badge: String(it.status || 'pendiente').toUpperCase(),
            badgeTone: it.status === 'cumple' ? 'emerald' : isCrit ? 'rose' : 'slate',
            isCritical: isCrit,
            fields: {
              'Evaluación de los 24 Aspectos Obligatorios del Art. 2.2.4.6.31 Dec. 1072': `${it.code || ''}: ${it.name || ''} (${it.status || ''})`,
              'Decisiones Gerenciales, Asignación de Presupuesto y Nuevos Recursos': it.observation || '',
              'Evidencias e Informes Presentados a Gerencia': evFiles.map((ef) => ef.fileName || ef.name || 'Soporte').join(', ') || 'Sin adjuntos',
              'Compromisos de la Alta Dirección y Acta Firmada por Representante Legal': `Directivo: ${doc?.reviewerInfo?.nombre || company?.legalRepresentative || ''} - Cumplimiento Global: ${pct}% - ${it.observation || ''}`,
            },
          };
        }),
        ...inboxQr.map((inb, idx) => ({
          id: inb.id || `ad_inb_${idx}`,
          label: `[Aporte Directivo QR] ${inb.trabajador?.nombre || inb.nombre || 'Directivo / Líder'}`,
          sublabel: inb.data?.observacion || inb.data?.compromiso || 'Aporte para Revisión por la Alta Dirección',
          badge: 'APORTE QR',
          badgeTone: 'indigo',
          isCritical: false,
          fields: {
            'Decisiones Gerenciales, Asignación de Presupuesto y Nuevos Recursos': inb.data?.observacion || inb.data?.compromiso || '',
            'Compromisos de la Alta Dirección y Acta Firmada por Representante Legal': `${inb.trabajador?.nombre || inb.nombre || ''} (${inb.trabajador?.cargo || 'Directivo'})`,
          },
        })),
      ],
    };
  }

  // 49. Hito 7 · Investigación Profunda Científica y Normativa SST
  if (canonicalId === 'hito7_investigacion_profunda') {
    const reports = await fetchLatestReportsForTags(userId, company, ['sgsst-investigacion-profunda'], 10);
    const legalRes = await inspectHito1And2('hito1_matriz_legal', userId, company);
    const legalRecords = Array.isArray(legalRes?.records) ? legalRes.records : [];
    const combinedRecords = [
      ...reports.map((r) => ({
        id: r.conversationId,
        label: `🔬 ${r.title}`,
        sublabel: r.preview,
        badge: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('es-CO') : 'Emitido',
        badgeTone: 'purple',
        isCritical: false,
        fields: {
          'Pregunta / Hipótesis Técnica o Jurídica Investigada': r.title,
          'Conclusiones Periciales y Recomendaciones Aplicadas a la Empresa': r.structuredText || r.preview,
        },
      })),
      ...legalRecords,
    ];
    return {
      moduleTitle: 'Hito 7 · Investigación Profunda Científica y Normativa SST',
      sourceCollection: 'ConversationHistory + MatrizLegalData',
      latestReports: reports,
      kpis: [
        { label: 'Investigaciones Emitidas', value: reports.length, tone: 'purple' },
        ...(legalRes?.kpis?.slice(0, 3) || []),
      ],
      records: combinedRecords,
    };
  }

  // 50. Hito 8 · Oráculo Predictivo de Siniestralidad y Riesgo IA (Radar Predictivo en Vivo)
  if (canonicalId === 'hito8_predictivo') {
    const [
      hito2Result,
      gtc45Result,
      moodResult,
      diagResult,
      atelStatsResult,
      vehResult,
      chemResult,
      eppResult,
      latestReports,
    ] = await Promise.all([
      inspectHito1And2('hito2_oraculo_predictivo', userId, company),
      inspectHito1And2('hito2_matriz_ipevar', userId, company),
      inspectHito3To5('hito4_psicosocial', userId, company),
      inspectHito1And2('hito1_diagnostico_0312', userId, company),
      inspectHito6To8('hito7_estadisticas_atel', userId, company),
      inspectHito3To5('hito3_vehiculos', userId, company),
      inspectHito3To5('hito5_registro_quimico', userId, company),
      inspectHito3To5('hito3_epp', userId, company),
      fetchLatestReportsForTags(userId, company, ['sgsst-predictivo-ia', 'sgsst-oraculo-predictivo'], 5),
    ]);
    const KanbanTask = getSafeModel('KanbanTask', '~/server/routes/sgsst/kanban', '~/models/KanbanTask');
    const overdueCount = KanbanTask
      ? await KanbanTask.countDocuments({ ...buildCompanyScopeFilter(userId, company), status: 'overdue' }).catch(() => 0)
      : 0;

    const workerRecords = Array.isArray(hito2Result?.records) ? hito2Result.records : [];
    const gtcRecords = Array.isArray(gtc45Result?.records) ? gtc45Result.records : [];
    const critGtc = gtcRecords.filter((r) => r.isCritical);
    const moodRecords = Array.isArray(moodResult?.records) ? moodResult.records : [];
    const sadMoods = moodRecords.filter((r) => r.isCritical);
    const atelRecords = (atelStatsResult?.records || []).filter((r) => r.isCritical);
    const critVehicles = (vehResult?.records || []).filter((r) => r.isCritical);
    const critChemicals = (chemResult?.records || []).filter((r) => r.isCritical);
    const critEpp = (eppResult?.records || []).filter((r) => r.isCritical);
    const medAlerts = workerRecords.filter((r) => r.isCritical).length;
    const score0312 = diagResult?.kpis?.[0]?.value || '0%';

    const radarRecords = [
      ...workerRecords.map((r) => {
        const cargoStr = String(r.fields?.['Cargo'] || '').toLowerCase();
        const matchingHazards = critGtc
          .filter((g) => cargoStr && String(g.fields?.['Cargo'] || g.label || '').toLowerCase().includes(cargoStr))
          .slice(0, 3)
          .map((g) => g.label)
          .join(' ; ');
        const corrText = [
          `Alertas Clínicas/FIT: ${r.fields?.['Tarjetas Preventivas / Alertas FIT'] || 'Ninguna'}`,
          matchingHazards ? `Peligros Críticos GTC-45 del Cargo: ${matchingHazards}` : `Total Peligros Críticos Empresa: ${critGtc.length}`,
          `Eventos ATEL Críticos: ${atelRecords.length} | Alertas Flota PESV: ${critVehicles.length} | Químicos sin FDS/SGA: ${critChemicals.length} | Alertas EPP: ${critEpp.length}`,
          `Alertas Clima Psicosocial: ${sadMoods.length} reporte(s) de estrés`,
        ].join(' | ');
        return {
          ...r,
          fields: {
            ...r.fields,
            'Índice Global de Riesgo Predictivo de la Empresa (%)': r.fields?.['Puntaje FIT Biocéntrico (%)'] || '85%',
            'Trabajadores y Cargos con Mayor Propensión o Vulnerabilidad Preventiva': `${r.label} — ${r.badge}`,
            'Correlación entre Condiciones de Salud, Ausentismo, Peligros Críticos y Clima Psicosocial': corrText,
            'Recomendaciones Prescriptivas Priorizadas por Impacto':
              r.fields?.['Recomendaciones de Reubicación, Readaptación o Ajuste Razonable'] ||
              'Intervenir controles en la fuente/medio y seguimiento médico ocupacional',
          },
        };
      }),
      ...critGtc.slice(0, 15).map((g) => ({
        ...g,
        id: `pred_gtc_${g.id}`,
        label: `⚠️ [Radar GTC-45 Crítico] ${g.label}`,
        fields: {
          ...g.fields,
          'Índice Global de Riesgo Predictivo de la Empresa (%)': `Cumplimiento 0312: ${score0312}`,
          'Correlación entre Condiciones de Salud, Ausentismo, Peligros Críticos y Clima Psicosocial': `${g.label} (${g.badge})`,
          'Recomendaciones Prescriptivas Priorizadas por Impacto':
            g.fields?.['Medidas de Intervención (Eliminación, Sustitución, Controles de Ingeniería, Controles Administrativos / Señalización y EPP)'] || '',
        },
      })),
      ...atelRecords.slice(0, 8).map((a) => ({
        ...a,
        id: `pred_atel_${a.id}`,
        label: `🚑 [Radar Siniestralidad ATEL] ${a.label}`,
      })),
      ...critVehicles.slice(0, 6).map((v) => ({
        ...v,
        id: `pred_veh_${v.id}`,
        label: `🚗 [Radar Flota PESV] ${v.label}`,
      })),
      ...critChemicals.slice(0, 6).map((c) => ({
        ...c,
        id: `pred_chem_${c.id}`,
        label: `🧪 [Radar Químico SGA] ${c.label}`,
      })),
      ...sadMoods.slice(0, 8).map((m) => ({
        ...m,
        id: `pred_mood_${m.id}`,
        label: `🧠 [Radar Psicosocial] ${m.label}`,
      })),
    ];

    return {
      moduleTitle: 'Hito 8 · Radar Predictivo de Siniestralidad y Riesgo IA (360° Trabajadores + GTC-45 + ATEL + PESV + Químicos + Ánimo)',
      sourceCollection: 'Radar Predictivo 360° (SgsstWorker + GTC45 + ATELAnnualData + SgsstVehicleData + SgsstChemicalData + MoodTelemetry + KanbanTask)',
      latestReports,
      kpis: [
        { label: 'Trabajadores / Alertas Médicas', value: `${workerRecords.length} (${medAlerts} alerta)`, tone: medAlerts > 0 ? 'rose' : 'teal' },
        { label: 'Peligros Críticos GTC-45', value: `${critGtc.length} / ${gtcRecords.length}`, tone: critGtc.length > 0 ? 'rose' : 'emerald' },
        { label: 'ATEL / Flota / Químicos Alerta', value: `${atelRecords.length} ATEL · ${critVehicles.length} Veh · ${critChemicals.length} Quím`, tone: atelRecords.length + critVehicles.length + critChemicals.length > 0 ? 'amber' : 'emerald' },
        { label: 'Estándares 0312 / ACPM Venc.', value: `${score0312} · ${overdueCount} venc.`, tone: overdueCount > 0 ? 'rose' : 'indigo' },
      ],
      records: radarRecords,
    };
  }

  return null;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INSPECTORES EN VIVO DE EQUIPOS 1 Y 4 (DISPARADORES & MEMORIAS DEL AGENTE)
 * ═══════════════════════════════════════════════════════════════════════════
 */
async function inspectTriggersAndMemoryTeams({ canonicalId, userId, company }) {
  const companyIdStr = company?._id ? String(company._id) : null;
  const Automation = getSafeModel('Automation', null, '~/models/Automation');
  const AutomationLog = getSafeModel('AutomationLog', null, '~/models/AutomationLog');

  // EQUIPO 1: DISPARADORES (⚡ 1. Disparador)
  const triggerTitles = {
    schedule_cron: 'Equipo 1 · Disparador Cron Programado (Por Horario)',
    trigger_tenshi: 'Equipo 1 · Disparador Tenshi IA (Orden por Voz o Chat)',
    trigger_antigravity: 'Equipo 1 · Disparador Google Antigravity Local (Mac/PC + MCP)',
    trigger_antigravity_cloud: 'Equipo 1 · Disparador Google Antigravity Cloud 24/7',
    trigger_email: 'Equipo 1 · Disparador Correo Electrónico Entrante (Gmail)',
    trigger_agent: 'Equipo 1 · Disparador por Delegación de Agente Especialista IA',
    trigger_qr_worker: 'Equipo 1 · Disparador Reporte QR de Trabajador en Campo',
    trigger_webhook: 'Equipo 1 · Disparador Webhook / API Externa (Buk RRHH / ERP)',
    trigger_whatsapp: 'Equipo 1 · Disparador WhatsApp Business Cloud API (En Construcción)',
  };

  if (triggerTitles[canonicalId]) {
    const autoFilter = companyIdStr
      ? { companyId: companyIdStr, isSystemPreset: { $ne: true } }
      : userId
        ? { user: userId, isSystemPreset: { $ne: true } }
        : { isSystemPreset: { $ne: true } };
    const logFilter = companyIdStr ? { companyId: companyIdStr } : userId ? { user: userId } : {};

    const [automations, logs] = await Promise.all([
      Automation ? Automation.find(autoFilter).sort({ updatedAt: -1 }).limit(40).lean().catch(() => []) : [],
      AutomationLog ? AutomationLog.find(logFilter).sort({ runAt: -1 }).limit(30).lean().catch(() => []) : [],
    ]);

    const activeCount = automations.filter((a) => a.status === 'active').length;
    const withThisTrigger = automations.filter(
      (a) => a.workflowNodes?.trigger === canonicalId || (a.workflowNodes?.triggers || []).includes(canonicalId)
    );
    const lastLog = logs[0] || null;

    const records = [
      ...automations.map((a, i) => {
        const usesTrigger =
          a.workflowNodes?.trigger === canonicalId || (a.workflowNodes?.triggers || []).includes(canonicalId);
        return {
          id: String(a._id || `auto_${i}`),
          label: `[Tarea ${a.status === 'active' ? 'ACTIVA' : 'INACTIVA'}] ${a.name || 'Automatización'}`,
          sublabel: `Agente: ${a.agentName || 'Consultor SG-SST'} • Frecuencia: ${a.scheduleType || 'daily'} (${String(a.scheduleConfig?.hour ?? 8).padStart(2, '0')}:${String(a.scheduleConfig?.minute ?? 0).padStart(2, '0')})`,
          badge: `${usesTrigger ? 'Usa este Disparador · ' : ''}${a.lastRunStatus ? `Última: ${a.lastRunStatus.toUpperCase()}` : a.status.toUpperCase()}`,
          badgeTone: a.lastRunStatus === 'failed' ? 'rose' : a.status === 'active' ? 'emerald' : 'slate',
          isCritical: a.lastRunStatus === 'failed',
          fields: {
            'Nombre de la Automatización': a.name || '',
            'Estado del Disparador': a.status || 'inactive',
            'Frecuencia y Horario Programado': `${a.scheduleType || 'daily'} ${String(a.scheduleConfig?.hour ?? 8).padStart(2, '0')}:${String(a.scheduleConfig?.minute ?? 0).padStart(2, '0')}`,
            'Agente Asignado': a.agentName || '',
            'Última Corrida y Estado': a.lastRunAt ? `${new Date(a.lastRunAt).toLocaleString('es-CO')} (${a.lastRunStatus || 'N/A'})` : 'Sin ejecutar aún',
            'Próxima Ejecución Programada': a.nextRunAt ? new Date(a.nextRunAt).toLocaleString('es-CO') : 'No programada',
          },
        };
      }),
      ...logs.slice(0, 15).map((l, i) => ({
        id: String(l._id || `log_${i}`),
        label: `[Corrida ${String(l.status || 'success').toUpperCase()}] ${l.agentName || 'Agente IA'} — ${l.runAt ? new Date(l.runAt).toLocaleString('es-CO') : ''}`,
        sublabel: String(l.result || l.error || l.prompt || '').replace(/\s+/g, ' ').slice(0, 180),
        badge: String(l.status || 'success').toUpperCase(),
        badgeTone: l.status === 'failed' ? 'rose' : l.status === 'running' ? 'amber' : 'indigo',
        isCritical: l.status === 'failed',
        fields: {
          'Fecha y Hora de Ejecución': l.runAt ? new Date(l.runAt).toLocaleString('es-CO') : '',
          'Estado de la Corrida': l.status || '',
          'Agente Ejecutor': l.agentName || '',
          'Resultado / Bitácora': String(l.result || l.error || '').slice(0, 500),
        },
      })),
    ];

    return {
      moduleTitle: triggerTitles[canonicalId],
      sourceCollection: 'Automation + AutomationLog',
      kpis: [
        { label: 'Tareas Activas / Total', value: `${activeCount} / ${automations.length}`, tone: activeCount > 0 ? 'emerald' : 'amber' },
        { label: 'Con este Disparador', value: withThisTrigger.length, tone: 'teal' },
        { label: 'Corridas en Bitácora', value: logs.length, tone: 'indigo' },
        {
          label: 'Última Corrida',
          value: lastLog?.runAt ? `${new Date(lastLog.runAt).toLocaleDateString('es-CO')} (${lastLog.status})` : 'Sin corridas',
          tone: lastLog?.status === 'failed' ? 'rose' : 'emerald',
        },
      ],
      records,
    };
  }

  // EQUIPO 4: MEMORIAS DEL AGENTE (💾 4. Memorias)
  if (canonicalId === 'wappy_memory_antiduplicate') {
    const logFilter = companyIdStr ? { companyId: companyIdStr } : userId ? { user: userId } : {};
    const logs = AutomationLog ? await AutomationLog.find(logFilter).sort({ runAt: -1 }).limit(40).lean().catch(() => []) : [];
    const successLogs = logs.filter((l) => l.status === 'success');
    const failedLogs = logs.filter((l) => l.status === 'failed');

    return {
      moduleTitle: 'Equipo 4 · Memoria de Bitácora Previa (Control Anti-Duplicados)',
      sourceCollection: 'AutomationLog',
      kpis: [
        { label: 'Ejecuciones Exitosas', value: successLogs.length, tone: 'emerald' },
        { label: 'Ejecuciones con Error', value: failedLogs.length, tone: failedLogs.length > 0 ? 'rose' : 'teal' },
        { label: 'Total en Memoria', value: logs.length, tone: 'indigo' },
        { label: 'Filtro Anti-Duplicados', value: 'ACTIVO', tone: 'emerald' },
      ],
      records: logs.map((l, i) => {
        const preview = String(l.result || l.error || '').replace(/\s+/g, ' ').trim().slice(0, 350);
        return {
          id: String(l._id || `mem_log_${i}`),
          label: `[Corrida ${l.status === 'success' ? 'Procesada' : l.status}] ${l.agentName || 'Agente'} — ${l.runAt ? new Date(l.runAt).toLocaleString('es-CO') : ''}`,
          sublabel: preview || 'Ejecución registrada en bitácora anti-duplicados',
          badge: l.status === 'success' ? 'No Duplicar' : String(l.status || '').toUpperCase(),
          badgeTone: l.status === 'failed' ? 'rose' : 'emerald',
          isCritical: l.status === 'failed',
          fields: {
            'Fecha y Hora de Última Ejecución Exitosa': l.runAt ? new Date(l.runAt).toLocaleString('es-CO') : '',
            'IDs / Hashes de Archivos de Drive ya Procesados': preview.slice(0, 250),
            'Cédulas / Registros de Trabajadores ya Sincronizados': preview.slice(0, 250),
            'Resumen de Novedades Detectadas en la Última Corrida': preview,
          },
        };
      }),
    };
  }

  if (canonicalId === 'wappy_rag_documental' || canonicalId === 'notebooklm') {
    const LiveDocument = getSafeModel('LiveDocument', null, '~/models/LiveDocument');
    const LiveEditorSession = getSafeModel('LiveEditorSession', null, '~/models/LiveEditorSession');
    const NotebookSession = getSafeModel('NotebookSession', null, '~/models/NotebookSession');
    const [liveDocs, editorSessions, notebooks] = await Promise.all([
      findManyCompanyDocs(LiveDocument, userId, company, { updatedAt: -1 }, 40),
      findManyCompanyDocs(LiveEditorSession, userId, company, { updatedAt: -1 }, 40),
      findManyCompanyDocs(NotebookSession, userId, company, { updatedAt: -1 }, 20),
    ]);

    const notebookItems = [];
    for (const nb of notebooks) {
      const cached = Array.isArray(nb.cachedNotebooks) ? nb.cachedNotebooks : [];
      if (cached.length > 0) {
        for (const cn of cached) {
          notebookItems.push({
            id: String(cn.id || `nb_cached_${notebookItems.length}`),
            label: `📓 [Cuaderno NotebookLM] ${cn.emoji ? `${cn.emoji} ` : ''}${cn.title || 'Cuaderno RAG SST'}`,
            sublabel: `Cuenta: ${nb.email || 'Google NotebookLM'} • Fuentes indexadas: ${cn.sources_count ?? 0} • Estado: ${nb.isValid !== false ? 'Activo' : 'Por renovar'}`,
            badge: `NOTEBOOKLM (${cn.sources_count ?? 0} fuentes)`,
            badgeTone: 'purple',
            isCritical: false,
            fields: {
              'Título del Documento Vivo / Protocolo Interno': cn.title || 'Cuaderno NotebookLM',
              'Cuenta Google NotebookLM': nb.email || 'Conectada',
              'Fuentes Indexadas': String(cn.sources_count ?? 0),
              'Extracto / Contenido RAG': `Cuaderno RAG "${cn.title || 'SG-SST'}" con ${cn.sources_count ?? 0} fuente(s) normativas y técnicas vinculadas.`,
              'Fecha de Última Actualización': cn.updated_at || (nb.updatedAt ? new Date(nb.updatedAt).toLocaleDateString('es-CO') : 'Reciente'),
            },
          });
        }
      } else {
        notebookItems.push({
          id: String(nb._id || `nb_${notebookItems.length}`),
          label: `📓 [Sesión NotebookLM] ${nb.title || nb.notebookTitle || nb.email || 'Google NotebookLM'}`,
          sublabel: `Cuenta: ${nb.email || 'Vinculada'} • Estado: ${nb.isValid !== false ? 'Activa' : 'Expirada'}`,
          badge: 'NOTEBOOKLM RAG',
          badgeTone: 'purple',
          isCritical: false,
          fields: {
            'Título del Documento Vivo / Protocolo Interno': nb.title || nb.notebookTitle || `NotebookLM (${nb.email || 'Activo'})`,
            'Extracto / Contenido RAG': nb.summary || nb.lastResponse || `Sesión Google NotebookLM activa (${nb.cookieCount || 0} cookies verificadas)`,
          },
        });
      }
    }

    const totalLiveDocsCount = liveDocs.length + editorSessions.length;
    const records = [
      ...(canonicalId === 'notebooklm' ? notebookItems : []),
      ...liveDocs.map((d, i) => ({
        id: String(d._id || `livedoc_${i}`),
        label: `📄 [Documento Vivo] ${d.title || 'Documento SG-SST'}`,
        sublabel: `Archivo: ${d.originalFileName || 'Editor WAPPY'} (${d.originalFileType || 'HTML/MD'}) • Actualizado: ${d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('es-CO') : ''}`,
        badge: d.originalFileType ? String(d.originalFileType).toUpperCase() : 'DOC VIVO',
        badgeTone: 'teal',
        isCritical: false,
        fields: {
          'Título del Documento Vivo / Protocolo Interno': d.title || 'Documento SG-SST',
          'Archivo Original y Formato': `${d.originalFileName || 'Editor WAPPY'} (${d.originalFileType || 'HTML'})`,
          'Extracto / Contenido RAG': String(d.content || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500) || 'Documento oficial estructurado',
          'Fecha de Última Actualización': d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('es-CO') : 'Reciente',
        },
      })),
      ...editorSessions.map((s, i) => ({
        id: String(s._id || s.conversationId || `liveed_${i}`),
        label: `📝 [Documento LiveEditor] ${s.fileName || 'Informe Oficial SG-SST'}`,
        sublabel: `Formato: ${s.fileType || 'HTML/DOCX'} • Actualizado: ${s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('es-CO') : 'Reciente'}`,
        badge: s.fileType ? String(s.fileType).toUpperCase() : 'LIVE EDITOR',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          'Título del Documento Vivo / Protocolo Interno': s.fileName || 'Informe Oficial SG-SST',
          'Archivo Original y Formato': `${s.fileName || 'LiveEditor'} (${s.fileType || 'html'})`,
          'Extracto / Contenido RAG': String(s.content || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500) || 'Informe editable en Somos SST',
          'Fecha de Última Actualización': s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('es-CO') : 'Reciente',
        },
      })),
      ...(canonicalId !== 'notebooklm' ? notebookItems : []),
    ];

    return {
      moduleTitle:
        canonicalId === 'notebooklm'
          ? 'Equipo 5 · Conector Google NotebookLM & Documentos Vivos RAG'
          : 'Equipo 4 · Memoria Documental RAG (Documentos Vivos + NotebookLM)',
      sourceCollection: 'LiveDocument + LiveEditorSession + NotebookSession',
      kpis: [
        { label: 'Documentos Vivos RAG', value: totalLiveDocsCount, tone: 'teal' },
        { label: 'Cuadernos NotebookLM', value: notebookItems.length, tone: 'purple' },
        { label: 'Total Fuentes RAG', value: records.length, tone: 'emerald' },
      ],
      records,
    };
  }

  if (canonicalId === 'wappy_memory_procedural') {
    const fs = require('fs');
    const path = require('path');
    const TenshiProceduralMemory = getSafeModel('TenshiProceduralMemory', null, '~/models/TenshiProceduralMemory');
    const procDocs = await findManyCompanyDocs(TenshiProceduralMemory, userId, company, { updatedAt: -1 }, 30);
    const riskLvl = String(company?.riskLevel || 'I').toUpperCase();
    const workersN = Number(company?.workerCount || 0);
    const estandaresChapter =
      workersN <= 10 && ['I', 'II', 'III'].includes(riskLvl)
        ? 'Capítulo I (7 Estándares Mínimos — ≤10 trabajadores Riesgo I-III)'
        : workersN <= 50 && ['I', 'II', 'III'].includes(riskLvl)
          ? 'Capítulo II (21 Estándares Mínimos — 11 a 50 trabajadores Riesgo I-III)'
          : 'Capítulo III (60 Estándares Mínimos — >50 trabajadores o Riesgo IV-V)';

    // Cargar todas las normas en Markdown (.md) de la Base de Datos Normativa de Tenshi
    const candidateRoots = [
      '/app/uploads',
      path.resolve(__dirname, '../../../uploads'),
      path.resolve(process.cwd(), 'uploads'),
    ];
    const mdNormRecords = [];
    const seenMdNames = new Set();

    for (const rootDir of candidateRoots) {
      if (!fs.existsSync(rootDir)) continue;
      let subdirs = [];
      try {
        subdirs = fs.readdirSync(rootDir, { withFileTypes: true });
      } catch (_) {
        continue;
      }
      for (const entry of subdirs) {
        if (!entry.isDirectory()) continue;
        const fullSubPath = path.join(rootDir, entry.name);
        let files = [];
        try {
          files = fs.readdirSync(fullSubPath);
        } catch (_) {
          continue;
        }
        for (const f of files.sort()) {
          if (!f.toLowerCase().endsWith('.md')) continue;
          const cleanId = f.replace(/^[0-9a-f-]{36}__/i, '').replace(/\.md$/i, '');
          if (seenMdNames.has(cleanId)) continue;
          seenMdNames.add(cleanId);

          let rawExcerpt = '';
          let sizeKb = 1;
          try {
            const fullFile = path.join(fullSubPath, f);
            const st = fs.statSync(fullFile);
            sizeKb = Math.max(1, Math.round(st.size / 1024));
            const raw = fs.readFileSync(fullFile, 'utf8').slice(0, 1200);
            rawExcerpt = raw
              .split(/\r?\n/)
              .map((l) => l.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim())
              .filter((l) => l.length > 18)
              .slice(0, 2)
              .join(' — ')
              .slice(0, 240);
          } catch (_) {}

          const prettyTitle = cleanId.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
          const low = cleanId.toLowerCase();
          let badge = 'NORMA .MD';
          let badgeTone = 'teal';
          if (low.includes('vademecum') || low.includes('2025') || low.includes('2026')) {
            badge = 'VIGENTE 2025-2026';
            badgeTone = 'emerald';
          } else if (low.includes('bateria') || low.includes('protocolo') || low.includes('psicosocial')) {
            badge = 'PSICOSOCIAL .MD';
            badgeTone = 'purple';
          } else if (low.includes('sentencia') || low.includes('circular')) {
            badge = 'JURISPRUDENCIA .MD';
            badgeTone = 'amber';
          } else if (low.includes('sustantivo') || low.includes('sustentivo')) {
            badge = 'CST .MD';
            badgeTone = 'indigo';
          }

          mdNormRecords.push({
            id: cleanId,
            label: `📘 ${prettyTitle}`,
            sublabel: `${cleanId}.md (${sizeKb} KB) • ${rawExcerpt || 'Base de Datos Normativa Markdown de Tenshi'}`,
            badge,
            badgeTone,
            isCritical: false,
            fields: {
              'Documento Normativo Markdown (.md)': prettyTitle,
              'Archivo Fuente Tenshi RAG': `${cleanId}.md (${sizeKb} KB)`,
              'Extracto / Alcance Legal': rawExcerpt || 'Norma oficial en Markdown indexada en Tenshi RAG',
            },
          });
        }
      }
    }

    const baseNorms = [
      ...mdNormRecords,
      ...procDocs.map((pm, idx) => ({
        id: String(pm._id || `pm_${idx}`),
        label: `[Regla Aprendida] ${pm.title || pm.category || `Regla #${idx + 1}`}`,
        sublabel: String(pm.rule || pm.content || '').slice(0, 180),
        badge: 'MEMORIA IA',
        badgeTone: 'purple',
        isCritical: false,
        fields: {
          'Documento Normativo Markdown (.md)': pm.title || pm.trigger || `Regla #${idx + 1}`,
          'Archivo Fuente Tenshi RAG': 'TenshiProceduralMemory (MongoDB)',
          'Extracto / Alcance Legal': pm.rule || pm.content || '',
        },
      })),
    ];

    return {
      moduleTitle: `Equipo 4 · Base de Datos Normativa Markdown de Tenshi (${mdNormRecords.length} Normas .md)`,
      sourceCollection: 'Tenshi Normative Markdown DB (/uploads/*.md) + TenshiProceduralMemory',
      kpis: [
        { label: 'Normas Markdown (.md)', value: `${mdNormRecords.length} archivos .md`, tone: 'emerald' },
        { label: 'Riesgo ARL / Nómina', value: `Riesgo ${riskLvl} · ${workersN} trab.`, tone: 'teal' },
        { label: 'Estándares Res. 0312', value: estandaresChapter.split(' (')[0], tone: 'indigo' },
        { label: 'Reglas Aprendidas', value: procDocs.length, tone: 'purple' },
      ],
      records: baseNorms,
    };
  }

  return null;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INSPECTOR INTEGRAL DE LOS EQUIPOS 1, 2, 4, 5 Y 7 (NODOS DEL FLUJO)
 * ═══════════════════════════════════════════════════════════════════════════
 */
async function inspectOtherNodeTeams(ctx) {
  const { canonicalId, userId, company } = ctx;
  const companyIdStr = company?._id ? String(company._id) : null;

  // 1. Verificar primero Equipo 1 (Disparadores) y Equipo 4 (Memorias)
  const trigOrMem = await inspectTriggersAndMemoryTeams(ctx);
  if (trigOrMem) return trigOrMem;

  // 2. Equipo 2 y 5: Google Workspace (Drive, Sheets, Calendar, Gmail)
  if (
    ['extract_drive', 'google_drive', 'google_sheets', 'google_calendar', 'extract_gmail', 'google_gmail'].includes(
      canonicalId
    )
  ) {
    let scopedEmail = company?.googleDrive?.email || '';
    let hasToken = Boolean(company?.googleDrive?.isConnected);
    let resolvedAccessToken = null;
    let resolvedRefreshToken = null;
    let resolvedExpiry = null;

    const requestedFolderId = String(
      ctx?.nodeConfig?.driveFolderId || ctx?.options?.driveFolderId || ''
    ).trim();
    const requestedFolderUrl = String(
      ctx?.nodeConfig?.driveFolderUrl || ctx?.options?.driveFolderUrl || ''
    ).trim();
    const requestedFolderName = String(
      ctx?.nodeConfig?.driveFolderName || ctx?.options?.driveFolderName || ''
    ).trim();
    const fileNameFilter = String(
      ctx?.nodeConfig?.fileNameFilter || ctx?.options?.fileNameFilter || ''
    ).trim();
    const fileTypeFilter = String(
      ctx?.nodeConfig?.fileTypeFilter || ctx?.options?.fileTypeFilter || 'all'
    ).trim().toLowerCase();
    const maxItemsLimit = Math.min(
      50,
      Math.max(1, Number(ctx?.nodeConfig?.maxItems || ctx?.options?.maxItems) || 15)
    );
    const emailSubjectFilter = String(
      ctx?.nodeConfig?.emailSubjectFilter || ctx?.options?.emailSubjectFilter || ''
    ).trim();
    const folderName =
      requestedFolderName ||
      company?.googleDrive?.folderName ||
      'Mi unidad';

    try {
      const { getScopedAuthValue } = require('~/server/services/googleAuthHelper');
      const [em, rt, at, exp] = await Promise.all([
        getScopedAuthValue(userId, companyIdStr, 'GOOGLE_DRIVE_EMAIL', false).catch(() => null),
        getScopedAuthValue(userId, companyIdStr, 'GOOGLE_DRIVE_REFRESH_TOKEN', false).catch(() => null),
        getScopedAuthValue(userId, companyIdStr, 'GOOGLE_DRIVE_ACCESS_TOKEN', false).catch(() => null),
        getScopedAuthValue(userId, companyIdStr, 'GOOGLE_DRIVE_EXPIRY', false).catch(() => null),
      ]);
      if (em) scopedEmail = em;
      resolvedRefreshToken = rt || null;
      resolvedAccessToken = at || null;
      resolvedExpiry = exp ? Number(exp) : null;
      if (rt || at || em) hasToken = true;
    } catch (_) {}

    let liveDriveRecords = [];
    let liveGmailRecords = [];
    let availableFolders = [];
    let resolvedFolder = null;

    if (
      (canonicalId === 'extract_drive' || canonicalId === 'google_drive' || canonicalId === 'extract_gmail' || canonicalId === 'google_gmail') &&
      hasToken &&
      (resolvedAccessToken || resolvedRefreshToken)
    ) {
      try {
        const { google } = require('googleapis');
        const { updateScopedAuthValue } = require('~/server/services/googleAuthHelper');
        const serverDomain = (process.env.DOMAIN_SERVER || 'https://wappy.club')
          .replace(/https?:\/\/wappy-ia\.com/g, 'https://wappy.club')
          .replace(/\/+$/, '');
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          `${serverDomain}/api/google-drive/callback`,
        );
        oauth2Client.setCredentials({
          access_token: resolvedAccessToken || undefined,
          refresh_token: resolvedRefreshToken || undefined,
          expiry_date: resolvedExpiry || undefined,
        });

        const ensureFreshGoogleCredentials = async () => {
          const isExpired = resolvedExpiry ? resolvedExpiry - Date.now() < 60000 : !resolvedAccessToken;
          if (isExpired && resolvedRefreshToken) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);
            if (credentials.access_token) {
              await updateScopedAuthValue(
                userId,
                companyIdStr,
                'GOOGLE_DRIVE_ACCESS_TOKEN',
                credentials.access_token,
              ).catch(() => {});
            }
            if (credentials.expiry_date) {
              await updateScopedAuthValue(
                userId,
                companyIdStr,
                'GOOGLE_DRIVE_EXPIRY',
                String(credentials.expiry_date),
              ).catch(() => {});
            }
          }
        };

        if (canonicalId === 'extract_drive' || canonicalId === 'google_drive') {
          const fetchLiveDriveInspection = async () => {
            await ensureFreshGoogleCredentials();
            const drive = google.drive({ version: 'v3', auth: oauth2Client });

            const foldersListPromise = drive.files
              .list({
                q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
                fields: 'files(id, name, parents, webViewLink)',
                orderBy: 'name',
                pageSize: 50,
              })
              .then((res) =>
                (Array.isArray(res?.data?.files) ? res.data.files : []).map((f) => ({
                  id: String(f.id || ''),
                  name: String(f.name || 'Carpeta sin nombre'),
                  parentId: Array.isArray(f.parents) && f.parents[0] ? String(f.parents[0]) : null,
                  webViewLink: String(f.webViewLink || `https://drive.google.com/drive/folders/${f.id}`),
                })),
              )
              .catch(() => []);

            const targetLookupPromise = resolveDriveTargetFolder(drive, {
              driveFolderId: requestedFolderId,
              driveFolderUrl: requestedFolderUrl,
              driveFolderName: requestedFolderName,
            });

            const [foldersCatalog, targetInfo] = await Promise.all([
              foldersListPromise,
              targetLookupPromise,
            ]);

            if (targetInfo?.singleFile) {
              return {
                availableFolders: foldersCatalog,
                resolvedFolder: null,
                files: [targetInfo.singleFile],
              };
            }

            const targetFolder = targetInfo?.resolvedFolder || null;
            const qParts = ['trashed = false'];
            if (targetFolder?.id) {
              qParts.push(`'${escapeDriveQueryLiteral(targetFolder.id)}' in parents`);
            } else if (requestedFolderName && !extractGoogleDriveId(requestedFolderName)) {
              qParts.push(`name contains '${escapeDriveQueryLiteral(requestedFolderName)}'`);
            }

            if (fileNameFilter) {
              qParts.push(`name contains '${escapeDriveQueryLiteral(fileNameFilter)}'`);
            }

            if (fileTypeFilter === 'pdf') {
              qParts.push(`mimeType = 'application/pdf'`);
            } else if (fileTypeFilter === 'excel' || fileTypeFilter === 'xlsx' || fileTypeFilter === 'spreadsheet') {
              qParts.push(`(mimeType contains 'spreadsheet' or mimeType contains 'excel' or mimeType = 'text/csv')`);
            } else if (fileTypeFilter === 'word' || fileTypeFilter === 'docx' || fileTypeFilter === 'document') {
              qParts.push(`(mimeType contains 'document' or mimeType contains 'word')`);
            } else if (fileTypeFilter === 'image' || fileTypeFilter === 'images') {
              qParts.push(`mimeType contains 'image/'`);
            }

            const driveRes = await drive.files.list({
              q: qParts.join(' and '),
              fields: 'files(id, name, mimeType, webViewLink, modifiedTime)',
              pageSize: maxItemsLimit,
              orderBy: 'folder,modifiedTime desc',
            });
            return {
              availableFolders: foldersCatalog,
              resolvedFolder: targetFolder,
              files: Array.isArray(driveRes?.data?.files) ? driveRes.data.files : [],
            };
          };

          let driveTimer = null;
          const driveOutcome = await Promise.race([
            fetchLiveDriveInspection(),
            new Promise((resolve) => {
              driveTimer = setTimeout(
                () => resolve({ availableFolders: [], resolvedFolder: null, files: [] }),
                5500,
              );
            }),
          ]);
          if (driveTimer) clearTimeout(driveTimer);

          availableFolders = Array.isArray(driveOutcome?.availableFolders)
            ? driveOutcome.availableFolders
            : [];
          resolvedFolder = driveOutcome?.resolvedFolder || null;
          const driveFiles = Array.isArray(driveOutcome?.files) ? driveOutcome.files : [];
          const folderDisplay =
            resolvedFolder?.name ||
            (requestedFolderName && !extractGoogleDriveId(requestedFolderName)
              ? requestedFolderName
              : 'Mi unidad');

          liveDriveRecords = driveFiles.map((file) => {
            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
            const formatLabel = formatDriveMimeTypeLabel(file.mimeType);
            const modFormatted = file.modifiedTime
              ? new Date(file.modifiedTime).toLocaleString('es-CO')
              : 'Sin fecha';
            return {
              id: String(file.id),
              label: `${isFolder ? '📁' : '📄'} ${file.name || 'Sin nombre'}`,
              sublabel: `${formatLabel} • Carpeta: ${folderDisplay} • Modificado: ${modFormatted}`,
              badge: formatLabel.toUpperCase(),
              badgeTone: isFolder ? 'amber' : 'teal',
              isCritical: false,
              fields: {
                'Nombre del Archivo': file.name || 'Sin nombre',
                'Formato': formatLabel,
                'Carpeta': folderDisplay,
                'Modificado': modFormatted,
                'ID Drive': String(file.id || ''),
                'Enlace': file.webViewLink || '',
              },
            };
          });
        } else if (canonicalId === 'extract_gmail' || canonicalId === 'google_gmail') {
          const fetchLiveGmailMessages = async () => {
            await ensureFreshGoogleCredentials();
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            const listRes = await gmail.users.messages.list({
              userId: 'me',
              maxResults: Math.min(15, maxItemsLimit),
              q: emailSubjectFilter ? `subject:(${emailSubjectFilter})` : undefined,
            });
            const msgRefs = Array.isArray(listRes?.data?.messages) ? listRes.data.messages : [];
            const details = await Promise.all(
              msgRefs.slice(0, 10).map((m) =>
                gmail.users.messages
                  .get({
                    userId: 'me',
                    id: m.id,
                    format: 'metadata',
                    metadataHeaders: ['Subject', 'From', 'Date'],
                  })
                  .then((r) => r?.data)
                  .catch(() => null),
              ),
            );
            return details.filter(Boolean);
          };

          let gmailTimer = null;
          const gmailMsgs = await Promise.race([
            fetchLiveGmailMessages(),
            new Promise((resolve) => {
              gmailTimer = setTimeout(() => resolve([]), 4500);
            }),
          ]);
          if (gmailTimer) clearTimeout(gmailTimer);

          liveGmailRecords = gmailMsgs.map((msg) => {
            const hdrs = Array.isArray(msg?.payload?.headers) ? msg.payload.headers : [];
            const getHdr = (name) => hdrs.find((h) => String(h.name || '').toLowerCase() === name.toLowerCase())?.value || '';
            const subj = getHdr('Subject') || '(Sin asunto)';
            const from = getHdr('From') || 'Remitente';
            const dt = getHdr('Date') || 'Reciente';
            return {
              id: String(msg.id),
              label: `✉️ ${subj}`,
              sublabel: `De: ${from} • Fecha: ${dt}`,
              badge: 'CORREO GMAIL',
              badgeTone: 'teal',
              isCritical: false,
              fields: {
                'Asunto': subj,
                'Remitente': from,
                'Fecha': dt,
                'Extracto': msg.snippet || 'Sin vista previa',
                'ID Mensaje': String(msg.id || ''),
              },
            };
          });
        }
      } catch (_) {
        liveDriveRecords = [];
        liveGmailRecords = [];
      }
    }

    if (canonicalId === 'extract_drive' || canonicalId === 'google_drive') {
      return {
        connected: hasToken,
        connectedEmail: scopedEmail || '',
        resolvedFolder: resolvedFolder || null,
        availableFolders,
        moduleTitle: `Equipo 2/5 · Conector Google Drive (${resolvedFolder?.name || requestedFolderName || 'Mi unidad'})`,
        sourceCollection: 'Google Drive API v3 (En Vivo)',
        kpis: [
          { label: 'Estado Google Drive', value: hasToken ? 'CONECTADO' : 'NO CONECTADO', tone: hasToken ? 'emerald' : 'rose' },
          { label: 'Cuenta Vinculada', value: scopedEmail || 'Sin vincular', tone: hasToken ? 'teal' : 'amber' },
          { label: 'Carpeta Activa', value: resolvedFolder?.name || requestedFolderName || 'Mi unidad', tone: 'indigo' },
          { label: 'Archivos Listados', value: liveDriveRecords.length, tone: 'emerald' },
        ],
        records: liveDriveRecords,
      };
    }

    if (canonicalId === 'extract_gmail' || canonicalId === 'google_gmail') {
      return {
        connected: hasToken,
        connectedEmail: scopedEmail || '',
        moduleTitle: 'Equipo 2/5 · Conector Gmail (Bandeja en Vivo)',
        sourceCollection: 'Gmail API v1 (En Vivo)',
        kpis: [
          { label: 'Estado Gmail OAuth', value: hasToken ? 'CONECTADO' : 'NO CONECTADO', tone: hasToken ? 'emerald' : 'rose' },
          { label: 'Cuenta Vinculada', value: scopedEmail || 'Sin vincular', tone: hasToken ? 'teal' : 'amber' },
          { label: 'Correos Listados', value: liveGmailRecords.length, tone: 'indigo' },
        ],
        records: liveGmailRecords,
      };
    }

    const AutomationLog = getSafeModel('AutomationLog', null, '~/models/AutomationLog');
    const logFilter = companyIdStr ? { companyId: companyIdStr } : userId ? { user: userId } : {};
    const logs = AutomationLog
      ? await AutomationLog.find(logFilter).sort({ runAt: -1 }).limit(15).lean().catch(() => [])
      : [];

    const serviceLogsRecords = logs.map((l, idx) => {
      const summary = String(l.result || l.error || 'Sincronización registrada')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 320);
      const runDateStr = l.runAt ? new Date(l.runAt).toLocaleString('es-CO') : 'Reciente';
      return {
        id: String(l._id || `gws_log_${idx}`),
        label: `[${canonicalId.replace(/^google_/, '').toUpperCase()}] ${l.agentName || 'Agente SG-SST'} — ${runDateStr}`,
        sublabel: summary.slice(0, 180),
        badge: String(l.status || 'success').toUpperCase(),
        badgeTone: l.status === 'failed' ? 'rose' : 'teal',
        isCritical: l.status === 'failed',
        fields: {
          'Flujo / Agente': l.agentName || 'Agente SG-SST',
          'Servicio Google': canonicalId.replace(/^google_/, 'Google ').toUpperCase(),
          'Fecha de Sincronización': runDateStr,
          'Estado': String(l.status || 'success').toUpperCase(),
          'Resumen': summary,
        },
      };
    });

    return {
      connected: hasToken,
      connectedEmail: scopedEmail || '',
      moduleTitle: `Equipo 2/5 · Conector Google Workspace (${canonicalId.replace(/^(extract_|google_)/, '').toUpperCase()})`,
      sourceCollection: 'Google Workspace OAuth + AutomationLog',
      kpis: [
        { label: 'Estado Google OAuth', value: hasToken ? 'CONECTADO' : 'NO CONECTADO', tone: hasToken ? 'emerald' : 'rose' },
        { label: 'Cuenta Vinculada', value: scopedEmail || 'Sin vincular', tone: hasToken ? 'teal' : 'amber' },
        { label: 'Carpeta / Scope', value: folderName, tone: 'indigo' },
        { label: 'Sincronizaciones', value: serviceLogsRecords.length, tone: 'purple' },
      ],
      records: serviceLogsRecords,
    };
  }

  // 3. Equipo 2 y 5: Microsoft OneDrive / SharePoint
  if (['extract_onedrive', 'one_drive'].includes(canonicalId)) {
    let scopedEmail = company?.oneDrive?.email || '';
    let hasToken = Boolean(company?.oneDrive?.isConnected);
    const folderName = company?.oneDrive?.folderName || `OneDrive SG-SST ${company?.companyName || ''}`.trim();
    try {
      const { getScopedAuthValue } = require('~/server/services/oneDriveAuthHelper');
      const [em, rt, at] = await Promise.all([
        getScopedAuthValue(userId, companyIdStr, 'ONEDRIVE_EMAIL', false).catch(() => null),
        getScopedAuthValue(userId, companyIdStr, 'ONEDRIVE_REFRESH_TOKEN', false).catch(() => null),
        getScopedAuthValue(userId, companyIdStr, 'ONEDRIVE_ACCESS_TOKEN', false).catch(() => null),
      ]);
      if (em) scopedEmail = em;
      if (rt || at || em) hasToken = true;
    } catch (_) {}

    return {
      connected: hasToken,
      moduleTitle: 'Equipo 2/5 · Conector Microsoft OneDrive / SharePoint Corporativo',
      sourceCollection: 'CompanyInfo + OneDriveOAuth',
      kpis: [
        { label: 'Estado OneDrive', value: hasToken ? 'CONECTADO' : 'NO CONECTADO', tone: hasToken ? 'emerald' : 'rose' },
        { label: 'Cuenta Microsoft', value: scopedEmail || 'Pendiente', tone: hasToken ? 'teal' : 'amber' },
        { label: 'Carpeta Corporativa', value: folderName, tone: 'indigo' },
      ],
      records: [
        {
          id: `onedrive_conn_${companyIdStr || 'active'}`,
          label: hasToken
            ? `✅ Microsoft OneDrive Conectado (${scopedEmail || 'Cuenta Corporativa'})`
            : `⚠️ Microsoft OneDrive No Vinculado en ${company?.companyName || 'esta empresa'}`,
          sublabel: `Carpeta: ${folderName} • Empresa: ${company?.companyName || ''}`,
          badge: hasToken ? 'CONECTADO' : 'SIN VINCULAR',
          badgeTone: hasToken ? 'emerald' : 'rose',
          isCritical: !hasToken,
          fields: {
            'Estado de Conexión Microsoft OneDrive': hasToken ? 'Conectado' : 'Desconectado',
            'Cuenta Microsoft 365': scopedEmail || 'Sin vincular',
            'Carpeta OneDrive': folderName,
          },
        },
      ],
    };
  }

  // 4. Equipo 2: Resumen 360° o Aplicativo Específico de Somos SST (extract_sst_app)
  if (canonicalId === 'extract_sst_app') {
    const rawTargetApp = String(
      ctx?.nodeConfig?.sstAppSourceId || ctx?.options?.sstAppSourceId || ''
    ).trim();
    const sstAppAliasMap = {
      gtc45: 'hito2_matriz_ipevar',
      pesv: 'hito3_matriz_pesv',
      acpm: 'hito7_acpm',
      quimicos: 'hito5_registro_quimico',
      alturas: 'hito3_alturas',
      epp: 'hito3_epp',
      inspecciones: 'hito4_actos_condiciones',
      auditorias: 'hito7_auditoria',
    };
    const resolvedTargetApp = sstAppAliasMap[rawTargetApp] || rawTargetApp;
    if (resolvedTargetApp && resolvedTargetApp !== 'all' && resolvedTargetApp !== 'extract_sst_app') {
      const targetCanonical = normalizeInspectorNodeId(resolvedTargetApp);
      if (targetCanonical && targetCanonical !== 'extract_sst_app') {
        const delegated =
          (await inspectHito1And2(targetCanonical, userId, company)) ||
          (await inspectHito3To5(targetCanonical, userId, company)) ||
          (await inspectHito6To8(targetCanonical, userId, company));
        if (delegated) {
          return {
            ...delegated,
            moduleTitle: `Equipo 2 · Extractor Aplicativo Somos SST → ${delegated.moduleTitle}`,
          };
        }
      }
    }

    const [dRes, wRes, gtcRes, acpmRes] = await Promise.all([
      inspectHito1And2('hito1_diagnostico_0312', userId, company),
      inspectHito1And2('hito2_perfil_socio', userId, company),
      inspectHito1And2('hito2_matriz_ipevar', userId, company),
      inspectHito6To8('hito7_acpm', userId, company),
    ]);
    return {
      moduleTitle: 'Equipo 2 · Resumen 360° de Aplicativos (0312 + Trabajadores + GTC-45 + ACPM)',
      sourceCollection: 'DiagnosticoData + SgsstWorker + GTC45WorkspaceSession + KanbanTask',
      latestReports: [
        ...(dRes?.latestReports || []),
        ...(gtcRes?.latestReports || []),
        ...(acpmRes?.latestReports || []),
      ].slice(0, 8),
      kpis: [
        dRes?.kpis?.[0] || { label: 'Puntaje 0312', value: '0%', tone: 'teal' },
        wRes?.kpis?.[0] || { label: 'Trabajadores', value: 0, tone: 'indigo' },
        gtcRes?.kpis?.[1] || { label: 'Peligros Críticos GTC-45', value: 0, tone: 'rose' },
        acpmRes?.kpis?.[0] || { label: 'Tareas ACPM', value: 0, tone: 'amber' },
      ],
      records: [
        ...(dRes?.records?.filter((r) => r.isCritical).slice(0, 15) || []),
        ...(gtcRes?.records?.filter((r) => r.isCritical).slice(0, 15) || []),
        ...(acpmRes?.records?.slice(0, 15) || []),
        ...(wRes?.records?.slice(0, 20) || []),
      ],
    };
  }

  // 5. Equipo 5: APIs Científicas y Geoespaciales (OpenWeather, OpenStreetMap, PubChem, MedlinePlus)
  if (canonicalId === 'pronostico_clima_sst' || canonicalId === 'buscar_centros_emergencia') {
    const sedes = Array.isArray(company?.sedes) && company.sedes.length > 0
      ? company.sedes
      : [{ nombre: 'Sede Principal', city: company?.city || 'Bogotá', departamento: company?.departamento || '', address: company?.address || '' }];
    const isClima = canonicalId === 'pronostico_clima_sst';
    return {
      moduleTitle: isClima
        ? 'Equipo 5 · OpenWeather API (Clima, Lluvia, Viento, UV y Estrés Térmico por Sede)'
        : 'Equipo 5 · OpenStreetMap (Clínicas MEDEVAC, Hospitales y Bomberos por Sede)',
      sourceCollection: 'CompanyInfo.sedes + PlanEmergenciasData',
      kpis: [
        { label: 'Ciudad Principal', value: company?.city || 'Bogotá', tone: 'teal' },
        { label: 'Sedes Registradas', value: sedes.length, tone: 'indigo' },
        { label: 'Dirección', value: company?.address || 'Registrada', tone: 'emerald' },
      ],
      records: sedes.map((s, i) => ({
        id: `sede_${i}`,
        label: `[${s.nombre || `Sede #${i + 1}`}] ${s.city || company?.city || 'Ciudad'} (${s.departamento || company?.departamento || 'Colombia'})`,
        sublabel: `Dirección: ${s.address || company?.address || 'S/D'} • Actividades: ${s.generalActivities || company?.economicActivity || 'Operación General'}`,
        badge: isClima ? 'Monitoreo Clima SST' : 'Georreferencia MEDEVAC',
        badgeTone: 'teal',
        isCritical: false,
        fields: {
          'Ciudad / Municipio y Departamento de la Sede': `${s.city || company?.city || ''} (${s.departamento || company?.departamento || ''})`,
          'Dirección Exacta para Georreferenciación': s.address || company?.address || '',
          'Sede / Centro de Trabajo': s.nombre || 'Sede Principal',
        },
      })),
    };
  }

  if (canonicalId === 'consultar_pubchem_quimico') {
    const [chemTerreno, chemSga] = await Promise.all([
      inspectHito3To5('hito5_registro_quimico', userId, company),
      inspectHito1And2('hito3_quimicos_sga', userId, company),
    ]);
    const records = [...(chemTerreno?.records || []), ...(chemSga?.records || [])];
    return {
      moduleTitle: 'Equipo 5 · PubChem NIH (Sustancias Químicas de la Empresa para Consulta Toxicológica)',
      sourceCollection: 'SgsstChemicalData + ChemicalCompatibilitySession',
      kpis: [
        { label: 'Químicos en Terreno', value: chemTerreno?.records?.length || 0, tone: 'teal' },
        { label: 'Sustancias Matriz SGA', value: chemSga?.records?.length || 0, tone: 'indigo' },
        { label: 'Sin FDS / Alerta', value: records.filter((r) => r.isCritical).length, tone: 'rose' },
      ],
      records,
    };
  }

  if (canonicalId === 'consultar_medlineplus_rehabilitacion') {
    const saludRes = await inspectHito1And2('hito2_condiciones_salud', userId, company);
    const critWorkers = (saludRes?.records || []).filter((r) => r.isCritical);
    return {
      moduleTitle: 'Equipo 5 · MedlinePlus NIH (Casos Médicos, CIE-10 y Restricciones para Guías de Rehabilitación)',
      sourceCollection: 'PerfilSociodemograficoData + SgsstWorker',
      kpis: [
        { label: 'Casos con Restricción/Alerta', value: critWorkers.length, tone: critWorkers.length > 0 ? 'rose' : 'emerald' },
        { label: 'Total Evaluados EMO', value: saludRes?.records?.length || 0, tone: 'teal' },
      ],
      records: critWorkers.length > 0 ? critWorkers : saludRes?.records || [],
    };
  }

  // 6. Equipo 7: Bitácora & Salida (email_report, wappy_notification, canvas_doc, google_docs, somos_sst_update, antigravity_local_report, antigravity_cloud_report, google_slides, tenshi_voice_briefing, tenshi_alert, drive_backup)
  if (
    [
      'email_report',
      'wappy_notification',
      'tenshi_alert',
      'canvas_doc',
      'google_docs',
      'somos_sst_update',
      'antigravity_local_report',
      'antigravity_cloud_report',
      'google_slides',
      'tenshi_voice_briefing',
      'drive_backup',
    ].includes(canonicalId)
  ) {
    const outputTitleMap = {
      email_report: 'Equipo 7 · Despacho de Informe Ejecutivo por Correo Electrónico (Gmail / SMTP)',
      wappy_notification: 'Equipo 7 · Alerta Push & Notificación In-App WAPPY',
      tenshi_alert: 'Equipo 7 · Alerta Push & Notificación In-App WAPPY',
      canvas_doc: 'Equipo 7 · Generador de Documento Vivo Editable (LiveEditor HTML / Word / PDF)',
      google_docs: 'Equipo 7 · Generador de Documento Oficial en Google Docs',
      somos_sst_update: 'Equipo 7 · Escritura y Sincronización Automática en Aplicativos Somos SST',
      antigravity_local_report: 'Equipo 7 · Envío de Reporte Estructurado a Google Antigravity Local (Mac/PC)',
      antigravity_cloud_report: 'Equipo 7 · Envío de Reporte 24/7 a Google Antigravity Cloud',
      google_slides: 'Equipo 7 · Generador de Presentación Ejecutiva Google Slides',
      tenshi_voice_briefing: 'Equipo 7 · Briefing Ejecutivo de Voz Tenshi (Gemini TTS)',
      drive_backup: 'Equipo 7 · Respaldo Documental Automático en Google Drive',
    };

    const logFilter = companyIdStr ? { companyId: companyIdStr } : userId ? { user: userId } : {};

    if (canonicalId === 'email_report') {
      const AutomationLog = getSafeModel('AutomationLog', null, '~/models/AutomationLog');
      const logs = AutomationLog
        ? await AutomationLog.find(logFilter)
            .populate('automation', 'name emails emailRecipients')
            .sort({ runAt: -1 })
            .limit(20)
            .lean()
            .catch(() => [])
        : [];
      const configuredRecipients = String(
        ctx?.nodeConfig?.emailRecipientsOverride || ctx?.options?.emailRecipientsOverride || '',
      ).trim();

      const emailRecords = logs.map((l, i) => {
        const autoDoc = l.automation && typeof l.automation === 'object' ? l.automation : null;
        const autoEmails = [
          ...(Array.isArray(autoDoc?.emails) ? autoDoc.emails : []),
          ...(Array.isArray(autoDoc?.emailRecipients) ? autoDoc.emailRecipients : []),
        ].filter(Boolean);
        const recipientsDisplay =
          configuredRecipients ||
          (autoEmails.length > 0 ? Array.from(new Set(autoEmails)).join(', ') : '') ||
          company?.email ||
          'Correo corporativo configurado';
        const flowOrSubject =
          autoDoc?.name || l.agentName || 'Informe Ejecutivo SG-SST';
        const sentDateStr = l.runAt ? new Date(l.runAt).toLocaleString('es-CO') : 'Reciente';
        const statusLabel =
          l.status === 'failed'
            ? 'FALLIDO'
            : l.status === 'running'
              ? 'EN PROCESO'
              : 'ENVIADO';
        const summaryText =
          String(l.result || l.error || 'Ejecución registrada')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 320) || 'Ejecución completada';

        return {
          id: String(l._id || `out_email_${i}`),
          label: `📧 ${flowOrSubject} → ${recipientsDisplay}`,
          sublabel: `${sentDateStr} • ${summaryText.slice(0, 160)}`,
          badge: statusLabel,
          badgeTone: l.status === 'failed' ? 'rose' : 'emerald',
          isCritical: l.status === 'failed',
          fields: {
            'Destinatarios': recipientsDisplay,
            'Flujo / Asunto': flowOrSubject,
            'Fecha de Envío': sentDateStr,
            'Estado': statusLabel,
            'Resumen': summaryText,
          },
        };
      });

      return {
        moduleTitle: outputTitleMap.email_report,
        sourceCollection: 'AutomationLog (Bitácora de Envíos)',
        kpis: [
          { label: 'Despachos Registrados', value: emailRecords.length, tone: 'emerald' },
          {
            label: 'Destinatario Activo',
            value: configuredRecipients || company?.email || 'Configurado en flujo',
            tone: 'teal',
          },
          {
            label: 'Fallos de Envío',
            value: emailRecords.filter((r) => r.isCritical).length,
            tone: emailRecords.some((r) => r.isCritical) ? 'rose' : 'emerald',
          },
        ],
        records: emailRecords,
      };
    }

    if (
      canonicalId === 'wappy_notification' ||
      canonicalId === 'tenshi_alert' ||
      canonicalId === 'tenshi_voice_briefing'
    ) {
      const Notification = getSafeModel('Notification', null, '~/models/Notification');
      const notifs = await findManyCompanyDocs(Notification, userId, company, { createdAt: -1 }, 20);
      const notifRecords = notifs.map((n, i) => {
        const titleStr = n.title || 'Notificación SG-SST';
        const msgStr =
          String(n.body || n.message || 'Notificación operativa')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 320) || 'Notificación registrada';
        const dateStr = n.createdAt ? new Date(n.createdAt).toLocaleString('es-CO') : 'Reciente';
        const stateStr = n.read ? 'Leída' : 'No leída';

        return {
          id: String(n._id || `out_notif_${i}`),
          label: `🔔 ${titleStr}`,
          sublabel: `${dateStr} • ${msgStr.slice(0, 160)}`,
          badge: stateStr.toUpperCase(),
          badgeTone: n.read ? 'slate' : 'teal',
          isCritical: false,
          fields: {
            'Título': titleStr,
            'Mensaje': msgStr,
            'Fecha': dateStr,
            'Estado': stateStr,
          },
        };
      });

      return {
        moduleTitle: outputTitleMap[canonicalId] || outputTitleMap.wappy_notification,
        sourceCollection: 'Notification (Bandeja In-App WAPPY)',
        kpis: [
          { label: 'Notificaciones Emitidas', value: notifRecords.length, tone: 'teal' },
          {
            label: 'Sin Leer',
            value: notifs.filter((n) => !n.read).length,
            tone: 'indigo',
          },
        ],
        records: notifRecords,
      };
    }

    if (canonicalId === 'canvas_doc' || canonicalId === 'google_docs') {
      const LiveDocument = getSafeModel('LiveDocument', null, '~/models/LiveDocument');
      const LiveEditorSession = getSafeModel('LiveEditorSession', null, '~/models/LiveEditorSession');
      const [docs, editorDocs] = await Promise.all([
        findManyCompanyDocs(LiveDocument, userId, company, { updatedAt: -1 }, 15),
        findManyCompanyDocs(LiveEditorSession, userId, company, { updatedAt: -1 }, 15),
      ]);

      let docsConnected = true;
      let docsConnectedEmail = '';
      if (canonicalId === 'google_docs') {
        docsConnected = Boolean(company?.googleDrive?.isConnected);
        docsConnectedEmail = company?.googleDrive?.email || '';
        try {
          const { getScopedAuthValue } = require('~/server/services/googleAuthHelper');
          const [em, rt, at] = await Promise.all([
            getScopedAuthValue(userId, companyIdStr, 'GOOGLE_DRIVE_EMAIL', false).catch(() => null),
            getScopedAuthValue(userId, companyIdStr, 'GOOGLE_DRIVE_REFRESH_TOKEN', false).catch(() => null),
            getScopedAuthValue(userId, companyIdStr, 'GOOGLE_DRIVE_ACCESS_TOKEN', false).catch(() => null),
          ]);
          if (em) docsConnectedEmail = em;
          if (rt || at || em) docsConnected = true;
        } catch (_) {}
      }

      const cleanDocSnippet = (htmlOrText, fallback) =>
        String(htmlOrText || '')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 320) || fallback;

      const docRecords = [
        ...docs.map((d, i) => {
          const title = d.title || 'Informe Oficial SG-SST';
          const updated = d.updatedAt ? new Date(d.updatedAt).toLocaleString('es-CO') : 'Reciente';
          const summary = cleanDocSnippet(d.content, 'Documento vivo estructurado');
          return {
            id: String(d._id || `out_doc_${i}`),
            label: `📄 ${title}`,
            sublabel: `Actualizado: ${updated} • ${summary.slice(0, 140)}`,
            badge: 'DOCUMENTO VIVO',
            badgeTone: 'indigo',
            isCritical: false,
            fields: {
              'Título del Documento': title,
              'Actualizado': updated,
              'Resumen': summary,
            },
          };
        }),
        ...editorDocs.map((ed, i) => {
          const title = ed.fileName || 'Informe Oficial LiveEditor';
          const updated = ed.updatedAt ? new Date(ed.updatedAt).toLocaleString('es-CO') : 'Reciente';
          const summary = cleanDocSnippet(ed.content, 'Informe exportable HTML / Word / PDF');
          return {
            id: String(ed._id || ed.conversationId || `out_ed_${i}`),
            label: `📝 ${title}`,
            sublabel: `Actualizado: ${updated} • ${summary.slice(0, 140)}`,
            badge: 'LIVE EDITOR',
            badgeTone: 'indigo',
            isCritical: false,
            fields: {
              'Título del Documento': title,
              'Actualizado': updated,
              'Resumen': summary,
            },
          };
        }),
      ];

      return {
        connected: docsConnected,
        connectedEmail: docsConnectedEmail,
        moduleTitle: outputTitleMap[canonicalId] || outputTitleMap.canvas_doc,
        sourceCollection: 'LiveDocument + LiveEditorSession',
        kpis: [
          { label: 'Documentos Generados', value: docRecords.length, tone: 'indigo' },
          { label: 'Documentos Vivos', value: docs.length, tone: 'teal' },
          { label: 'Sesiones LiveEditor', value: editorDocs.length, tone: 'emerald' },
        ],
        records: docRecords,
      };
    }

    const AutomationLog = getSafeModel('AutomationLog', null, '~/models/AutomationLog');
    const logs = AutomationLog
      ? await AutomationLog.find(logFilter)
          .populate('automation', 'name')
          .sort({ runAt: -1 })
          .limit(20)
          .lean()
          .catch(() => [])
      : [];

    const genericOutputRecords = logs.map((l, i) => {
      const autoDoc = l.automation && typeof l.automation === 'object' ? l.automation : null;
      const flowTitle = autoDoc?.name || l.agentName || 'Automatización SG-SST';
      const runDateStr = l.runAt ? new Date(l.runAt).toLocaleString('es-CO') : 'Reciente';
      const statusLabel = String(l.status || 'success').toUpperCase();
      const summaryText =
        String(l.result || l.error || 'Ejecución registrada')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 320) || 'Completado';

      return {
        id: String(l._id || `out_log_${i}`),
        label: `📤 ${flowTitle} — ${runDateStr}`,
        sublabel: summaryText.slice(0, 180),
        badge: statusLabel,
        badgeTone: l.status === 'failed' ? 'rose' : 'emerald',
        isCritical: l.status === 'failed',
        fields: {
          'Flujo / Agente': flowTitle,
          'Canal de Salida': outputTitleMap[canonicalId] || canonicalId,
          'Fecha de Ejecución': runDateStr,
          'Estado': statusLabel,
          'Resumen': summaryText,
        },
      };
    });

    return {
      moduleTitle: outputTitleMap[canonicalId] || `Equipo 7 · Bitácora y Canal de Salida (${canonicalId.toUpperCase()})`,
      sourceCollection: 'AutomationLog',
      kpis: [
        { label: 'Bitácoras Emitidas', value: genericOutputRecords.length, tone: 'emerald' },
        {
          label: 'Fallos Registrados',
          value: genericOutputRecords.filter((r) => r.isCritical).length,
          tone: genericOutputRecords.some((r) => r.isCritical) ? 'rose' : 'teal',
        },
      ],
      records: genericOutputRecords,
    };
  }

  // 7. Equipo 2, 5 y 8: Web Scraping con Google Antigravity y Portales Oficiales (ARL, RUNT/SIMIT, Alto Riesgo, Antecedentes)
  if (
    [
      'extract_web_scraping_agy',
      'tool_web_scraping_agy',
      'scraper_node_antigravity',
      'scraper_agy_alto_riesgo',
      'scraper_agy_arl_directo',
      'scraper_agy_vial_pesv',
      'scraper_agy_antecedentes',
    ].includes(canonicalId)
  ) {
    const socioRes = await inspectHito1And2('hito2_perfil_socio', userId, company);
    const workerRecords = Array.isArray(socioRes?.records) ? socioRes.records : [];
    const portalMeta = {
      scraper_agy_arl_directo: {
        title: 'Equipo 2/8 · Scraper Antigravity: Certificados de Afiliación ARL (Sura / Positiva / Colmena / Bolívar)',
        portal: 'Portal Oficial ARL (Certificado de Afiliación y Clase de Riesgo por Cédula)',
        url: 'https://www.arlsura.com / https://www.positiva.gov.co / https://www.colmenaseguros.com',
        portalHint: 'arl',
      },
      scraper_agy_alto_riesgo: {
        title: 'Equipo 2/8 · Scraper Antigravity: Certificados de Trabajo en Alturas MinTrabajo & SENA',
        portal: 'Registro Oficial Centros de Entrenamiento MinTrabajo (Res. 4272) & SENA',
        url: 'https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx',
        portalHint: 'alto_riesgo',
      },
      scraper_agy_vial_pesv: {
        title: 'Equipo 2/8 · Scraper Antigravity: Consulta RUNT y Comparendos SIMIT (Conductores PESV)',
        portal: 'Portal RUNT 2.0 & SIMIT Federación Colombiana de Municipios',
        url: 'https://www.fcm.org.co/simit',
        portalHint: 'vial_pesv',
      },
      scraper_agy_antecedentes: {
        title: 'Equipo 2/8 · Scraper Antigravity: Validación Judicial, Contraloría y Antecedentes Contratistas',
        portal: 'Rama Judicial / Contraloría General / Policía Nacional',
        url: 'https://consultaprocesos.ramajudicial.gov.co',
        portalHint: 'antecedentes',
      },
    }[canonicalId] || {
      title: 'Equipo 2/8 · Extractor Web Scraping con Google Antigravity (Playwright / Cheerio / Chrome MCP)',
      portal: 'Portales Oficiales de Seguridad Social y Consultas Públicas por Cédula',
      url: 'https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx',
      portalHint: '',
    };

    // Escanear certificados PDF/PNG descargados previamente en `/uploads/scraper_evidences`
    let evidenceFiles = scanCompanyScraperEvidenceFiles({
      workerRecords,
      portalHint: portalMeta.portalHint,
    });

    // Si se solicita ejecución en vivo (`ctx.executeLive === true`), verificar 1 cédula numérica real con certificado
    if (ctx?.executeLive === true && workerRecords.length > 0) {
      try {
        const osint = require('~/server/services/osintWorkerService');
        const numericTarget = workerRecords.find((w) => {
          const ced = String(w?.fields?.['Cédula / Documento'] || w?.id || '').replace(/\D/g, '');
          return /^\d{6,12}$/.test(ced);
        });
        if (numericTarget) {
          const wf = numericTarget.fields || {};
          const cleanCed = String(wf['Cédula / Documento'] || numericTarget.id || '').replace(/\D/g, '');
          const wName = formatCleanScalar(wf['Nombre Completo'] || numericTarget.label, 'Colaborador');
          const wCargo = formatCleanScalar(wf['Cargo'] || 'Operativo', 'Operativo');
          let liveRes = null;

          if (portalMeta.portalHint === 'alto_riesgo' || !portalMeta.portalHint) {
            liveRes = await osint.consultarAlturasMinTrabajo(cleanCed, { includeEvidence: true }).catch(() => null);
          } else if (portalMeta.portalHint === 'arl') {
            liveRes = await osint
              .consultarArlRealPorCedula({
                cedula: cleanCed,
                nombre: wName,
                arl: wf['ARL'] || company?.arl || '',
                includeEvidence: true,
              })
              .catch(() => null);
          } else if (portalMeta.portalHint === 'vial_pesv') {
            liveRes = await osint
              .consultarSimitPesvRealPorCedula({
                cedula: cleanCed,
                nombre: wName,
                includeEvidence: true,
              })
              .catch(() => null);
          } else if (portalMeta.portalHint === 'antecedentes') {
            liveRes = await osint
              .consultarRamaJudicial({
                nombreCompleto: wName,
                cedula: cleanCed,
                tipoDoc: 'CC',
                includeEvidence: true,
                forceEvidence: true,
              })
              .catch(() => null);
          }

          if (liveRes && (liveRes.pdfBase64 || liveRes.imageBase64 || liveRes.screenshotBase64)) {
            const savedLive = persistInspectorEvidenceToDisk({
              pdfBase64: liveRes.pdfBase64 || liveRes.ultimoCertificadoAlturas?.pdfBase64 || null,
              pdfFileName: liveRes.pdfFileName || null,
              imageBase64: liveRes.imageBase64 || liveRes.screenshotBase64 || null,
              imageFileName: liveRes.imageFileName || null,
              cedula: cleanCed,
              workerName: wName,
              cargo: wCargo,
              portalLabel: liveRes.fuente || portalMeta.portalHint || 'Portal Oficial',
              title: `Certificado Oficial ${portalMeta.portal.split(' (')[0]}`,
            });
            if (savedLive.length > 0) {
              const existingNames = new Set(evidenceFiles.map((e) => e.fileName));
              for (const s of savedLive) {
                if (!existingNames.has(s.fileName)) evidenceFiles.unshift(s);
              }
            }
          }
        }
      } catch (_) {}
    }

    const evByCedula = new Map();
    for (const ev of evidenceFiles) {
      if (ev.cedula && ev.cedula !== 'N/A' && !evByCedula.has(ev.cedula)) {
        evByCedula.set(ev.cedula, ev);
      }
    }

    const records = workerRecords.map((w, idx) => {
      const wf = w.fields || {};
      const cedula = String(wf['Cédula / Documento'] || wf['Número de Documento / Cédula'] || w.id || '').trim();
      const cleanCed = cedula.replace(/\D/g, '');
      const nombre = formatCleanScalar(wf['Nombre Completo'] || w.label, 'Colaborador');
      const cargo = formatCleanScalar(wf['Cargo'] || wf['Cargo y Área / Proceso'], 'Colaborador');
      const arl = formatCleanScalar(wf['ARL'] || company?.arl, 'ARL Registrada');
      const eps = formatCleanScalar(wf['EPS'], 'EPS Activa');
      const afp = formatCleanScalar(wf['Fondo de Pensión (AFP)'], 'AFP Activa');
      const matchedEv = cleanCed ? evByCedula.get(cleanCed) : null;

      return {
        id: `scrape_${canonicalId}_${cedula || idx}`,
        label: `🔍 [Cédula: ${cedula}] ${nombre} — ${cargo}`,
        sublabel: `Portal: ${portalMeta.portal} • ARL: ${arl} • EPS: ${eps} • AFP: ${afp}`,
        badge: matchedEv ? `📎 CERTIFICADO DESCARGADO` : `LISTO PARA SCRAPING (${arl})`,
        badgeTone: matchedEv ? 'emerald' : w.isCritical ? 'amber' : 'teal',
        isCritical: Boolean(w.isCritical),
        fields: {
          ...wf,
          'Cédula / Documento de Identidad': String(cedula),
          'Cédula / Documento': String(cedula),
          'Nombre Completo del Trabajador': String(nombre),
          'Nombre Completo': String(nombre),
          'Cargo': String(cargo),
          'Entidad Administradora de Riesgos Laborales (ARL)': String(arl),
          'Estado de Afiliación ARL (Activa / Inactiva / Pendiente)': `Afiliación Activa en ${arl} (Riesgo ${company?.riskLevel || 'I'}) — Verificable por CC ${cedula}`,
          'Entidad Promotora de Salud (EPS - ADRES)': String(eps),
          'Fondo de Pensiones (AFP - RUAF)': String(afp),
          'Portal Oficial de Consulta': portalMeta.portal,
          'URL Objetivo del Scraper': portalMeta.url,
          'Certificado / Soporte Descargado': matchedEv ? `📎 ${matchedEv.fileName} (${matchedEv.url})` : 'Se descarga al ejecutar consulta oficial',
        },
      };
    });

    return {
      moduleTitle: portalMeta.title,
      sourceCollection: 'SgsstWorker + AntigravityScraperEngine',
      evidenceFiles,
      kpis: [
        { label: 'Cédulas en Cola de Consulta', value: records.length, tone: 'teal' },
        { label: 'Certificados en Evidencia', value: evidenceFiles.length, tone: evidenceFiles.length > 0 ? 'emerald' : 'indigo' },
        { label: 'ARL Empresa', value: company?.arl || 'Registrada', tone: 'emerald' },
        { label: 'Portal Objetivo', value: portalMeta.portal.split(' (')[0], tone: 'indigo' },
      ],
      records,
    };
  }

  // 8. Equipo 2: Carpeta en tu Computador vía Antigravity (extract_pc_folder)
  if (canonicalId === 'extract_pc_folder') {
    const rawWatchPath = String(
      ctx?.nodeConfig?.watchFolderPath || ctx?.options?.watchFolderPath || '',
    ).trim();
    const cleanWatchPath = rawWatchPath.replace(/^['"`]+|['"`]+$/g, '').trim();
    const includeSubfolders =
      ctx?.nodeConfig?.includeSubfolders === true ||
      ctx?.nodeConfig?.includeSubfolders === 'true' ||
      ctx?.options?.includeSubfolders === true ||
      ctx?.options?.includeSubfolders === 'true';
    const fileTypeFilter = String(
      ctx?.nodeConfig?.fileTypeFilter || ctx?.options?.fileTypeFilter || 'all',
    )
      .trim()
      .toLowerCase();
    const fileNameFilter = String(
      ctx?.nodeConfig?.fileNameFilter || ctx?.options?.fileNameFilter || '',
    )
      .trim()
      .toLowerCase();
    const maxLocalFiles = Math.min(
      25,
      Math.max(1, Number(ctx?.nodeConfig?.maxItems || ctx?.options?.maxItems) || 25),
    );

    const matchesFileType = (extLower) => {
      if (!fileTypeFilter || fileTypeFilter === 'all') return true;
      if (fileTypeFilter === 'pdf') return extLower === '.pdf';
      if (['excel', 'xlsx', 'spreadsheet', 'csv'].includes(fileTypeFilter)) {
        return ['.xlsx', '.xls', '.csv'].includes(extLower);
      }
      if (['word', 'docx', 'document'].includes(fileTypeFilter)) {
        return ['.docx', '.doc'].includes(extLower);
      }
      if (['image', 'images'].includes(fileTypeFilter)) {
        return ['.png', '.jpg', '.jpeg', '.webp'].includes(extLower);
      }
      const normalizedCustomExt = fileTypeFilter.startsWith('.')
        ? fileTypeFilter
        : `.${fileTypeFilter}`;
      return extLower === normalizedCustomExt;
    };

    const formatFileSize = (bytes) => {
      const n = Number(bytes) || 0;
      if (n < 1024) return `${n} B`;
      if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
      return `${(n / (1024 * 1024)).toFixed(2)} MB`;
    };

    if (!cleanWatchPath) {
      return {
        moduleTitle: 'Equipo 2 · Extractor de Carpeta Local en tu Computador (vía Google Antigravity)',
        sourceCollection: 'AntigravityLocalFS',
        kpis: [
          { label: 'Ruta Configurada', value: 'Pendiente', tone: 'amber' },
          { label: 'Archivos Listados', value: 0, tone: 'slate' },
          { label: 'Filtro Formato', value: fileTypeFilter.toUpperCase(), tone: 'teal' },
        ],
        records: [],
      };
    }

    const fsTargetPath = cleanWatchPath.startsWith('~/')
      ? path.join(os.homedir(), cleanWatchPath.slice(2))
      : cleanWatchPath;

    let accessibleLocalDir = false;
    const localFileRecords = [];

    try {
      if (fs.existsSync(fsTargetPath) && fs.statSync(fsTargetPath).isDirectory()) {
        accessibleLocalDir = true;
        const collectFromDir = (dirPath, depth = 0) => {
          if (localFileRecords.length >= maxLocalFiles || depth > 1) return;
          let dirEntries = [];
          try {
            dirEntries = fs.readdirSync(dirPath, { withFileTypes: true });
          } catch (_) {
            return;
          }
          for (const entry of dirEntries) {
            if (localFileRecords.length >= maxLocalFiles) break;
            if (!entry || !entry.name || entry.name.startsWith('.')) continue;
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              if (includeSubfolders && depth === 0) {
                collectFromDir(fullPath, depth + 1);
              }
              continue;
            }
            if (!entry.isFile()) continue;
            const ext = path.extname(entry.name);
            const extLower = ext.toLowerCase();
            if (!matchesFileType(extLower)) continue;
            if (fileNameFilter && !entry.name.toLowerCase().includes(fileNameFilter)) continue;

            let stat = null;
            try {
              stat = fs.statSync(fullPath);
            } catch (_) {
              continue;
            }
            const sizeStr = formatFileSize(stat?.size || 0);
            const modStr = stat?.mtime ? new Date(stat.mtime).toLocaleString('es-CO') : 'Reciente';
            const extLabel = ext ? ext.replace(/^\./, '').toUpperCase() : 'ARCHIVO';

            localFileRecords.push({
              id: `pc_file_${localFileRecords.length + 1}_${entry.name}`,
              label: `📄 ${entry.name}`,
              sublabel: `${extLabel} • ${sizeStr} • Modificado: ${modStr}`,
              badge: extLabel,
              badgeTone: 'teal',
              isCritical: false,
              fields: {
                'Nombre del Archivo': entry.name,
                'Extensión': extLabel,
                'Tamaño': sizeStr,
                'Modificado': modStr,
                'Ruta Completa': fullPath,
              },
            });
          }
        };
        collectFromDir(fsTargetPath, 0);
      }
    } catch (_) {
      accessibleLocalDir = false;
    }

    const records = accessibleLocalDir
      ? localFileRecords
      : [
          {
            id: `pc_folder_cfg_${companyIdStr || 'active'}`,
            label: `💻 Ruta Local Configurada: ${cleanWatchPath}`,
            sublabel: `Lectura delegada al daemon local de Google Antigravity en tu Mac/PC${includeSubfolders ? ' (incluye subcarpetas)' : ''}`,
            badge: 'PUENTE LOCAL AGY',
            badgeTone: 'teal',
            isCritical: false,
            fields: {
              'Nombre del Archivo': '(Carpeta local monitoreada vía Google Antigravity)',
              'Extensión': fileTypeFilter === 'all' ? 'TODOS' : fileTypeFilter.toUpperCase(),
              'Tamaño': includeSubfolders ? 'Incluye subcarpetas' : 'Nivel raíz',
              'Modificado': 'Lectura en tiempo de ejecución local',
              'Ruta Completa': cleanWatchPath,
            },
          },
        ];

    return {
      moduleTitle: `Equipo 2 · Carpeta Local (${cleanWatchPath})`,
      sourceCollection: accessibleLocalDir ? 'Sistema de Archivos Local (En Vivo)' : 'AntigravityLocalFS (Puente Remoto)',
      kpis: [
        { label: 'Ruta Monitoreada', value: path.basename(cleanWatchPath) || cleanWatchPath, tone: 'teal' },
        {
          label: accessibleLocalDir ? 'Archivos Encontrados' : 'Modo de Lectura',
          value: accessibleLocalDir ? localFileRecords.length : 'Puente Local AGY',
          tone: 'emerald',
        },
        { label: 'Filtro Formato', value: fileTypeFilter.toUpperCase(), tone: 'indigo' },
      ],
      records,
    };
  }

  // 9. Equipo 2, 5 y 8: Búsqueda Web en Vivo (extract_web_search, web_search, search_node_realtime, search_node_live_web)
  if (['extract_web_search', 'web_search', 'search_node_realtime', 'search_node_live_web'].includes(canonicalId)) {
    const act = company?.economicActivity || 'Actividades Empresariales';
    const ciiu = company?.ciiu || company?.ciiuCode || 'N/A';
    const rsk = company?.riskLevel || 'I';
    return {
      moduleTitle: 'Equipo 2/5/8 · Búsqueda Web Legal, Normativa y Técnica en Vivo',
      sourceCollection: 'GoogleSearchGrounding + CompanyInfo',
      kpis: [
        { label: 'Actividad / CIIU', value: `CIIU ${ciiu}`, tone: 'teal' },
        { label: 'Clase de Riesgo', value: `Riesgo ${rsk}`, tone: 'amber' },
        { label: 'Fuentes Oficiales', value: 'Mintrabajo · MinSalud · INS · ARL', tone: 'emerald' },
      ],
      records: [
        {
          id: `web_search_norm_${companyIdStr || '1'}`,
          label: `🌐 Consulta Normativa Vigente para ${company?.companyName || 'Empresa'} (CIIU ${ciiu} · Riesgo ${rsk})`,
          sublabel: `Actividad: ${act} • Dec. 1072 de 2015, Res. 0312 de 2019, Res. 1843 de 2025, Circulares Mintrabajo`,
          badge: 'GROUNDING WEB ACTIVO',
          badgeTone: 'emerald',
          isCritical: false,
          fields: {
            'Consulta Normativa y Jurisprudencial': `Normativa SG-SST vigente Colombia para ${act} (CIIU ${ciiu}, Riesgo ${rsk})`,
            'Fuentes Oficiales Prioritarias': 'Ministerio del Trabajo, Ministerio de Salud, Instituto Nacional de Salud (INS), Corte Constitucional, ARL',
            'Empresa Activa': `${company?.companyName || 'Empresa Activa'} (NIT ${company?.nit || 'N/A'})`,
          },
        },
      ],
    };
  }

  // 9.5. Equipo 5: Conector Google Flow (Veo & Imagen 4 — Campañas Visuales SST)
  if (canonicalId === 'google_flow') {
    const GoogleFlowSession = getSafeModel('GoogleFlowSession', null, '~/models/GoogleFlowSession');
    const flowSessions = await findManyCompanyDocs(GoogleFlowSession, userId, company, { updatedAt: -1 }, 10);
    const activeSession = flowSessions.find((s) => s.isValid !== false) || flowSessions[0] || null;
    const isConnected = Boolean(activeSession && activeSession.isValid !== false);

    return {
      moduleTitle: 'Equipo 5 · Conector Google Flow (Veo & Imagen — Campañas Audiovisuales SG-SST)',
      sourceCollection: 'GoogleFlowSession + CompanyInfo',
      kpis: [
        { label: 'Sesión Google Flow', value: isConnected ? 'CONECTADA' : 'DISPONIBLE', tone: isConnected ? 'emerald' : 'amber' },
        { label: 'Cuenta Vinculada', value: activeSession?.email || company?.email || 'Por vincular', tone: 'teal' },
        { label: 'Cookies Verificadas', value: activeSession?.cookieCount ?? 0, tone: 'indigo' },
      ],
      records: [
        {
          id: `gflow_${activeSession?._id || companyIdStr || '1'}`,
          label: isConnected
            ? `🎬 Google Flow Conectado (${activeSession.email || 'Cuenta Activa'}) — Listo para Veo / Imagen`
            : `🎬 Conector Google Flow Disponible para ${company?.companyName || 'Empresa Activa'}`,
          sublabel: `Generación de piezas preventivas SST, videos de inducción y afiches de seguridad • Cookies: ${activeSession?.cookieCount ?? 0}`,
          badge: isConnected ? 'FLOW ACTIVO' : 'POR VINCULAR',
          badgeTone: isConnected ? 'emerald' : 'amber',
          isCritical: !isConnected,
          fields: {
            'Estado de Sesión Google Flow': isConnected ? 'Conectada y Válida' : 'Pendiente de vinculación',
            'Cuenta Google Flow': activeSession?.email || 'No vinculada',
            'Cookies Activas': String(activeSession?.cookieCount ?? 0),
            'Empresa Activa': `${company?.companyName || 'Empresa Activa'} (NIT ${company?.nit || 'N/A'})`,
          },
        },
      ],
    };
  }

  // 10. Equipo 3 y 5: Agente Principal (`agent_root`), Motores IA (`sub_model`, Gemini 3.5/3.6/3.8, Antigravity) y Conectores MCP / Webhook
  if (
    [
      'agent_root',
      'sub_model',
      'wappy_gemini_3_6_flash',
      'wappy_gemini_3_5_flash_lite',
      'wappy_gemini_3_8_flash',
      'antigravity_mcp_engine',
      'antigravity_cloud_mcp_engine',
      'google_antigravity',
      'google_antigravity_cloud',
      'webhook_api',
    ].includes(canonicalId)
  ) {
    const modelNameMap = {
      wappy_gemini_3_6_flash: 'gemini-3.6-flash (Motor Rápido & Preciso WAPPY)',
      wappy_gemini_3_5_flash_lite: 'gemini-3.5-flash-lite (Motor Ultra-Veloz Alto Volumen)',
      wappy_gemini_3_8_flash: 'gemini-3.8-flash (Motor Razonamiento Profundo SST)',
      antigravity_mcp_engine: 'Google Antigravity Local (Mac/PC + MCP Push SSE)',
      antigravity_cloud_mcp_engine: 'Google Antigravity Cloud 24/7 (Servidor MCP)',
      sub_model: ctx?.nodeConfig?.modelId || 'gemini-3.6-flash',
    };

    let agentsList = [];
    if (canonicalId === 'agent_root') {
      try {
        const { Agent } = require('~/db/models');
        if (Agent) {
          agentsList = await Agent.find(userId ? { author: userId } : {})
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean()
            .catch(() => []);
        }
      } catch (_) {}
    }

    const engineLabel =
      canonicalId === 'agent_root'
        ? `Cerebro Orquestador SG-SST (${ctx?.nodeConfig?.model || 'gemini-3.6-flash'})`
        : modelNameMap[canonicalId] || canonicalId;

    return {
      moduleTitle:
        canonicalId === 'agent_root'
          ? `Equipo 3 · Agente Orquestador Principal del Flujo (${company?.companyName || 'Somos SST'})`
          : `Equipo 3/5 · Motor & Conector Inteligente (${canonicalId.toUpperCase()})`,
      sourceCollection: canonicalId === 'agent_root' ? 'Agent + CompanyInfo + WappyAIEngine' : 'WappyAIEngine + MCPBridge',
      kpis: [
        { label: 'Motor / Conector', value: canonicalId === 'agent_root' ? 'gemini-3.6-flash' : canonicalId, tone: 'indigo' },
        { label: 'Herramientas MCP', value: '140+ Tools SST', tone: 'emerald' },
        { label: 'Empresa Activa', value: company?.companyName || 'Activa', tone: 'teal' },
        ...(canonicalId === 'agent_root' ? [{ label: 'Agentes Disponibles', value: Math.max(1, agentsList.length), tone: 'purple' }] : []),
      ],
      records: [
        {
          id: `engine_${canonicalId}`,
          label: `⚡ ${canonicalId === 'agent_root' ? 'Agente Orquestador Principal Activo' : `Conector / Motor Activo: ${engineLabel}`} — ${company?.companyName || 'Empresa Activa'}`,
          sublabel: `Modelos activos (.env): gemini-3.6-flash · gemini-3.5-flash-lite · gemini-3.8-flash • Puente Push SSE Antigravity + 140+ tools MCP`,
          badge: 'OPERATIVO',
          badgeTone: 'emerald',
          isCritical: false,
          fields: {
            'Identificador del Nodo / Motor': canonicalId,
            'Modelo IA / Canal Configurado': engineLabel,
            'Empresa Vinculada': `${company?.companyName || 'Empresa Activa'} (NIT ${company?.nit || 'N/A'})`,
            'ARL y Clase de Riesgo': `${company?.arl || 'Registrada'} · Riesgo ${company?.riskLevel || 'I'}`,
            'Estado Operativo': 'Activo y listo para procesar pasos del flujo sin alucinación',
          },
        },
        ...agentsList.slice(0, 6).map((ag, idx) => ({
          id: String(ag.id || ag._id || `ag_${idx}`),
          label: `🤖 [Agente IA] ${ag.name || 'Especialista SG-SST'}`,
          sublabel: `Modelo: ${ag.model || 'gemini-3.6-flash'} • Herramientas: ${(ag.tools || []).length}`,
          badge: 'AGENTE IA',
          badgeTone: 'purple',
          isCritical: false,
          fields: {
            'Nombre del Agente': ag.name || 'Especialista SG-SST',
            'Modelo Asignado': ag.model || 'gemini-3.6-flash',
            'Herramientas Activas': String((ag.tools || []).length),
            'Descripción / Rol': String(ag.description || ag.instructions || 'Consultor SG-SST').slice(0, 260),
          },
        })),
      ],
    };
  }

  // 10.5. Equipo 3/8: Nodos Lógicos de Control de Flujo (`if_router`, `loop`, `merge`, `human_approval`, `filter`)
  if (['if_router', 'loop', 'merge', 'human_approval', 'filter'].includes(canonicalId)) {
    if (canonicalId === 'if_router') {
      const placementRaw = String(ctx?.nodeConfig?.ifPlacement || 'pre_agent').trim();
      const placementLabel =
        placementRaw === 'post_agent'
          ? 'Post-Agente IA ([VEREDICTO_IF: SI | NO])'
          : 'Pre-Agente IA (0 tokens LLM cuando no hay brechas nuevas)';
      const conditionStr =
        ctx?.nodeConfig?.ifCondition ||
        ctx?.nodeConfig?.condition ||
        'Evaluación automática de brechas nuevas sobre los registros conectados aguas arriba';

      return {
        moduleTitle: 'Equipo 3 · Enrutador Condicional IF / Switch',
        sourceCollection: 'LogicRouterEngine (Evaluación sobre Nodo Conectado Aguas Arriba)',
        kpis: [
          {
            label: 'Posición en Grafo',
            value: placementRaw === 'post_agent' ? 'POST-AGENTE' : 'PRE-AGENTE',
            tone: 'indigo',
          },
          { label: 'Rama Verdadera', value: 'RAMA SÍ', tone: 'teal' },
          { label: 'Rama Falsa', value: 'RAMA NO', tone: 'emerald' },
        ],
        records: [
          {
            id: `if_cfg_${companyIdStr || '1'}`,
            label: `🔀 Condición Configurada: ${conditionStr}`,
            sublabel: `Modo: ${placementLabel} • Evalúa dinámicamente los ítems recibidos en el panel INPUT`,
            badge: 'ENRUTADOR IF',
            badgeTone: 'indigo',
            isCritical: false,
            fields: {
              'Modo de Evaluación': placementLabel,
              'Regla / Condición': conditionStr,
              'Rama SÍ (Verdadero)': 'Ejecuta acciones correctivas / salidas de alerta',
              'Rama NO (Falso)': 'Cierre preventivo silencioso sin falsas alarmas',
            },
          },
        ],
      };
    }

    if (canonicalId === 'loop') {
      const batchSize = Math.max(1, Number(ctx?.nodeConfig?.batchSize) || 10);
      return {
        moduleTitle: 'Equipo 3 · Iterador por Lotes (Loop / SplitInBatches)',
        sourceCollection: 'LogicLoopEngine (Registros Conectados Aguas Arriba)',
        kpis: [
          { label: 'Tamaño de Lote (Batch)', value: batchSize, tone: 'indigo' },
          { label: 'Modo de Ejecución', value: 'Secuencial', tone: 'teal' },
        ],
        records: [
          {
            id: `loop_cfg_${companyIdStr || '1'}`,
            label: `🔁 Iteración por lotes de hasta ${batchSize} registro(s) por ciclo`,
            sublabel: 'Divide automáticamente los registros provenientes del nodo anterior en bloques controlados',
            badge: `BATCH ${batchSize}`,
            badgeTone: 'indigo',
            isCritical: false,
            fields: {
              'Estrategia de Iteración': 'SplitInBatches secuencial sin pérdida de ítems',
              'Tamaño de Lote Configurado': String(batchSize),
              'Origen de Datos': 'Registros recibidos del nodo conectado aguas arriba (INPUT)',
            },
          },
        ],
      };
    }

    if (canonicalId === 'merge') {
      const mergeMode = String(ctx?.nodeConfig?.mergeMode || 'append_and_enrich').trim();
      return {
        moduleTitle: 'Equipo 3 · Nodo Merge (Unificación Multi-Rama)',
        sourceCollection: 'LogicMergeEngine (Ramas Conectadas Aguas Arriba)',
        kpis: [
          { label: 'Estrategia Merge', value: mergeMode.toUpperCase(), tone: 'teal' },
          { label: 'Estado', value: 'LISTO', tone: 'emerald' },
        ],
        records: [
          {
            id: `merge_cfg_${companyIdStr || '1'}`,
            label: `🔗 Estrategia de Unificación: ${mergeMode}`,
            sublabel: 'Consolida los registros de todas las ramas conectadas aguas arriba en una sola salida estructurada',
            badge: 'MERGE CONFIGURADO',
            badgeTone: 'teal',
            isCritical: false,
            fields: {
              'Modo de Fusión': mergeMode,
              'Comportamiento': 'Consolidación estructurada de las entradas conectadas al nodo',
              'Origen de Datos': 'Ramas conectadas aguas arriba en el lienzo',
            },
          },
        ],
      };
    }

    if (canonicalId === 'human_approval') {
      const TenshiPendingAction = getSafeModel('TenshiPendingAction', null, '~/models/TenshiPendingAction');
      const pendingDocs = await findManyCompanyDocs(TenshiPendingAction, userId, company, { createdAt: -1 }, 15);
      const approver = ctx?.nodeConfig?.approverEmail || company?.email || 'Responsable SG-SST';
      const records =
        pendingDocs.length > 0
          ? pendingDocs.map((p, idx) => {
              const titleStr = p.title || p.actionType || 'Solicitud de aprobación operativa';
              const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleString('es-CO') : 'Reciente';
              const statusStr = String(p.status || 'pending').toUpperCase();
              return {
                id: String(p._id || `hitl_p_${idx}`),
                label: `🛡️ ${titleStr}`,
                sublabel: `Aprobador: ${approver} • Estado: ${statusStr}`,
                badge: statusStr,
                badgeTone: p.status === 'pending' ? 'amber' : 'emerald',
                isCritical: false,
                fields: {
                  'Acción Solicitada': titleStr,
                  'Aprobador Designado': approver,
                  'Fecha': dateStr,
                  'Estado': statusStr,
                },
              };
            })
          : [
              {
                id: `hitl_cfg_${companyIdStr || '1'}`,
                label: `🛡️ Compuerta de Visto Bueno Humano — Aprobador: ${approver}`,
                sublabel: `Responsable SG-SST: ${company?.responsibleSST || 'Designado'} • Sin aprobaciones pendientes en cola`,
                badge: 'HITL ACTIVO',
                badgeTone: 'teal',
                isCritical: false,
                fields: {
                  'Acción Solicitada': 'Pausa preventiva para revisión y firma del responsable',
                  'Aprobador Designado': approver,
                  'Fecha': 'Configuración activa',
                  'Estado': 'SIN PENDIENTES',
                },
              },
            ];

      return {
        moduleTitle: 'Equipo 3 · Compuerta de Aprobación Humana (Human-in-the-Loop SST)',
        sourceCollection: 'TenshiPendingAction',
        kpis: [
          { label: 'Aprobador Designado', value: approver, tone: 'teal' },
          { label: 'Solicitudes en Cola', value: pendingDocs.length, tone: pendingDocs.length > 0 ? 'amber' : 'emerald' },
        ],
        records,
      };
    }

    // `filter`
    const filterRule =
      ctx?.nodeConfig?.filterCondition ||
      ctx?.nodeConfig?.condition ||
      ctx?.nodeConfig?.recordFilterMode ||
      'Filtrado dinámico sobre los registros conectados aguas arriba';
    return {
      moduleTitle: 'Equipo 3 · Filtro Quirúrgico de Registros (Filter Node)',
      sourceCollection: 'LogicFilterEngine (Registros Conectados Aguas Arriba)',
      kpis: [
        { label: 'Regla Activa', value: String(filterRule).slice(0, 28), tone: 'indigo' },
        { label: 'Estado', value: 'CONFIGURADO', tone: 'emerald' },
      ],
      records: [
        {
          id: `filter_cfg_${companyIdStr || '1'}`,
          label: `🔍 Criterio de Filtrado: ${filterRule}`,
          sublabel: 'Filtra únicamente los ítems recibidos del nodo conectado aguas arriba sin mezclar otras colecciones',
          badge: 'FILTRO ACTIVO',
          badgeTone: 'indigo',
          isCritical: false,
          fields: {
            'Criterio de Filtrado': String(filterRule),
            'Comportamiento': 'Descarta registros que no cumplan la condición sobre la entrada conectada',
            'Origen de Datos': 'Registros recibidos en el panel INPUT del nodo',
          },
        },
      ],
    };
  }

  // 11. Equipo 8: Catálogo Completo de las 43 Skills Procedurales, Reglas Inquebrantables y Sub-Agentes Especialistas
  if (
    canonicalId.startsWith('skill_') ||
    canonicalId.startsWith('subagent_') ||
    canonicalId.startsWith('rule_')
  ) {
    const catalogSpecMap = {
      // Skills Oficiales del Catálogo (4 + aliases previos)
      skill_gtc45: {
        title: 'Equipo 8 · Skill Procedural: Metodología Oficial GTC-45 (Matriz IPEVR)',
        badge: 'SKILL.MD ACTIVA',
        directive:
          'Calcula y valida estrictamente ND, NE, NP = ND × NE, NC, NR = NP × NC, Nivel de Riesgo (I a IV), aceptabilidad y jerarquía de controles (Eliminación, Sustitución, Ingeniería, Administrativos y EPP).',
      },
      skill_0312: {
        title: 'Equipo 8 · Skill Procedural: Auditoría Resolución 0312 de 2019 (Estándares Mínimos)',
        badge: 'SKILL.MD ACTIVA',
        directive:
          'Evalúa el cumplimiento exacto por tamaño de empresa y clase de riesgo ARL (7, 21 o 60 estándares), ponderación PHVA y planes de mejoramiento obligatorio.',
      },
      skill_pesv: {
        title: 'Equipo 8 · Skill Procedural: Plan Estratégico de Seguridad Vial PESV (Res. 20223040040595)',
        badge: 'SKILL.MD ACTIVA',
        directive:
          'Audita las 24 fases del PESV, actores viales, desplazamientos misionales/in itinere, calificación NP+NE+NC (3 a 15) y los 5 programas críticos del Paso 8.',
      },
      skill_atel_furat: {
        title: 'Equipo 8 · Skill Procedural: Investigación Técnica ATEL & FURAT (Res. 1401 de 2007)',
        badge: 'SKILL.MD ACTIVA',
        directive:
          'Estructura investigaciones de accidentes graves/mortales e incidentes aplicando Árbol de Causas, 5 Porqués, Espina de Pescado, causas inmediatas/básicas y plazos legales de 15 días.',
      },
      skill_sgsst_tools: {
        title: 'Equipo 8 · Skill Procedural: Herramientas Operativas SG-SST (GTC-45, PESV y Químicos SGA)',
        badge: 'SKILL.MD ACTIVA',
        directive:
          'Aplica la metodología oficial de la GTC-45, las 24 fases del PESV y el Sistema Globalmente Armonizado SGA (Decreto 1496 de 2018).',
      },
      skill_google_connectors: {
        title: 'Equipo 8 · Skill Procedural: Conectores Google Workspace & Puente Reactivo Antigravity',
        badge: 'SKILL.MD ACTIVA',
        directive:
          'Sincroniza y estructura hallazgos documentales desde Google Drive, Gmail, Sheets, Docs, NotebookLM y Google Antigravity manteniendo trazabilidad por empresa y trabajador.',
      },
      skill_web_scraper_script: {
        title: 'Equipo 8 · Skill Procedural: Extracción Quirúrgica y Verificación por Cédula (Web Scraping)',
        badge: 'SKILL.MD ACTIVA',
        directive:
          'Cruza únicamente los campos solicitados contra los certificados y portales oficiales, generando tabla de estado por trabajador.',
      },
      skill_auditoria_normativa: {
        title: 'Equipo 8 · Skill Procedural: Auditoría de Cumplimiento Legal (Dec. 1072 y Res. 0312)',
        badge: 'SKILL.MD ACTIVA',
        directive:
          'Audita cada hallazgo citando el artículo exacto del Decreto 1072 de 2015 y el estándar de la Resolución 0312 de 2019.',
      },

      // Reglas Inquebrantables del Catálogo (3 + aliases previos)
      rule_strict_company: {
        title: 'Equipo 8 · Regla Inquebrantable: Aislamiento Estricto Multi-Empresa',
        badge: 'REGLA OBLIGATORIA',
        directive:
          'Garantiza que el flujo opere exclusivamente con el NIT, ARL, nómina y documentos de la empresa activa sin mezclar registros de otras razones sociales.',
      },
      rule_zero_hallucination: {
        title: 'Equipo 8 · Regla Inquebrantable: Cero Alucinación (Veracidad Documental y Normativa)',
        badge: 'REGLA OBLIGATORIA',
        directive:
          'PROHIBIDO inventar nombres de trabajadores, números de cédula, artículos legales o certificados inexistentes; todo dato debe provenir de las colecciones reales conectadas.',
      },
      rule_critical_priority: {
        title: 'Equipo 8 · Regla Inquebrantable: Priorización de Brechas Críticas y Riesgos No Aceptables',
        badge: 'REGLA OBLIGATORIA',
        directive:
          'Ordena los resultados destacando primero riesgos Nivel I/II, exámenes vencidos, certificados faltantes y tareas ACPM vencidas con responsable y fecha límite.',
      },
      rule_veracidad_estricta: {
        title: 'Equipo 8 · Regla Inquebrantable: Veracidad Estricta (Cero Invención de Datos)',
        badge: 'REGLA OBLIGATORIA',
        directive:
          'PROHIBIDO inventar nombres, cédulas, puntajes o estándares que no estén presentes en los datos reales extraídos de los nodos conectados del flujo.',
      },
      rule_solo_criticos: {
        title: 'Equipo 8 · Regla Inquebrantable: Enfoque Ejecutivo en Brechas y Hallazgos Críticos',
        badge: 'REGLA OBLIGATORIA',
        directive:
          'Prioriza y destaca en primer lugar los registros en brecha crítica, vencidos o con incumplimiento normativo.',
      },
      rule_reserva_legal: {
        title: 'Equipo 8 · Regla Inquebrantable: Reserva Legal de Historia Clínica (Res. 2346 / Res. 1843 de 2025)',
        badge: 'REGLA OBLIGATORIA',
        directive:
          'Protege la confidencialidad diagnóstica: reporta únicamente conceptos de aptitud, restricciones laborales y recomendaciones ocupacionales.',
      },

      // Los 28 Sub-Agentes Especialistas del Catálogo Oficial
      subagent_legal_auditor: {
        title: 'Equipo 8 · Sub-Agente: Auditor Jurídico SG-SST (Dec. 1072, Res. 0312 y Jurisprudencia)',
        badge: 'SUB-AGENTE IA',
        directive: 'Verifica cumplimiento normativo artículo por artículo, tipifica riesgos legales y redacta dictámenes de auditoría.',
      },
      subagent_redactor_actas: {
        title: 'Equipo 8 · Sub-Agente: Secretario Técnico Redactor de Actas e Informes Ejecutivos',
        badge: 'SUB-AGENTE IA',
        directive: 'Redacta actas formales de COPASST, CCL, CSV, Revisión por la Alta Dirección e informes exportables a Word/PDF.',
      },
      subagent_ergonomo_medico: {
        title: 'Equipo 8 · Sub-Agente: Médico Ocupacional & Ergónomo Especialista (EMO, SVE, RULA/OWAS)',
        badge: 'SUB-AGENTE IA',
        directive: 'Analiza condiciones de salud, restricciones laborales, vigilancia epidemiológica y estudios biomecánicos respetando reserva clínica.',
      },
      subagent_chat_gtc45: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Especialista Matriz de Peligros GTC-45',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito2_matriz_ipevar',
        directive: 'Consulta, audita y actualiza peligros, controles y valoraciones NR en la Matriz Oficial GTC-45.',
      },
      subagent_chat_pesv: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Especialista Matriz de Riesgos Viales PESV',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito3_matriz_pesv',
        directive: 'Consulta y gestiona actores viales, riesgos y controles del Plan Estratégico de Seguridad Vial.',
      },
      subagent_chat_quimicos: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Especialista Sustancias Químicas SGA & Compatibilidad',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito5_registro_quimico',
        directive: 'Audita inventario químico, FDS de 16 secciones, etiquetado SGA Dec. 1496 e incompatibilidades ONU.',
      },
      subagent_chat_matriz_legal: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Especialista Matriz de Requisitos Legales SST',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito1_matriz_legal',
        directive: 'Audita y actualiza las normas vigentes aplicables a la actividad económica y CIIU de la empresa.',
      },
      subagent_chat_0312: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Evaluador Autoevaluación Resolución 0312',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito1_diagnostico_0312',
        directive: 'Consulta y califica los estándares mínimos Res. 0312 detectando brechas en ciclo PHVA.',
      },
      subagent_chat_dofa: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Analista Contexto Organizacional DOFA & Partes Interesadas',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito1_dofa',
        directive: 'Gestiona matriz DOFA SST y expectativas de partes interesadas internas y externas.',
      },
      subagent_chat_trabajadores: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Gestor de Nómina y Perfil Sociodemográfico 360°',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito2_perfil_socio',
        directive: 'Consulta trabajadores activos, cédulas, cargos, ARL/EPS/AFP y vigencia de exámenes médicos.',
      },
      subagent_chat_perfiles_cargo: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Especialista Profesiogramas y Perfiles de Cargo SST',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito2_perfiles_cargo',
        directive: 'Administra responsabilidades SST, competencias, profesiogramas y EPP requeridos por cargo.',
      },
      subagent_chat_epp: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Gestor de Entregas, Bodega y Reposición de EPP',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito3_epp',
        directive: 'Verifica entregas firmadas de EPP por trabajador, tallas, normas ANSI/NTC y alertas de stock mínimo.',
      },
      subagent_chat_alturas: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Coordinador Trabajo en Alturas & Equipos Res. 4272',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito3_alturas',
        directive: 'Audita permisos de trabajo en alturas, hojas de vida de arneses/eslingas y certificados vigentes.',
      },
      subagent_chat_ats: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Especialista Análisis de Trabajo Seguro (ATS)',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito3_ats',
        directive: 'Verifica pasos secuenciales de tareas críticas, peligros por etapa y controles preoperacionales.',
      },
      subagent_chat_estudios_puesto: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Analista Estudios de Puesto de Trabajo (EPT RULA/REBA)',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito3_estudio_puesto',
        directive: 'Consulta evaluaciones ergonómicas EPT, ángulos posturales y planes de ajuste razonable.',
      },
      subagent_chat_owas: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Evaluador Biomecánico Método OWAS',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito3_owas',
        directive: 'Analiza códigos posturales OWAS de 4 dígitos y prioriza correcciones de Categoría 3 y 4.',
      },
      subagent_chat_psicosocial: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Analista Clima Emocional & Riesgo Psicosocial (Res. 2764)',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito4_psicosocial',
        directive: 'Monitorea telemetría de estado de ánimo, estresores por área y alertas tempranas de agotamiento.',
      },
      subagent_chat_actos_condiciones: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Gestor de Reportes QR de Actos y Condiciones Inseguras',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito4_actos_condiciones',
        directive: 'Clasifica reportes de campo del buzón QR y coordina cierres correctivos inmediatos.',
      },
      subagent_chat_atel: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Investigador de Casos ATEL (Res. 1401)',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito7_investigacion_atel',
        directive: 'Gestiona expedientes de accidentes e incidentes laborales, causas raíz y lecciones aprendidas.',
      },
      subagent_chat_estadisticas_atel: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Analista de Siniestralidad y 6 Indicadores ATEL Res. 0312',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito7_estadisticas_atel',
        directive: 'Calcula frecuencia, severidad, proporción mortal, prevalencia, incidencia y ausentismo.',
      },
      subagent_chat_vulnerabilidad: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Especialista Amenazas, Vulnerabilidad y Plan de Emergencias',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito6_vulnerabilidad',
        directive: 'Evalúa diamantes de riesgo (naturales, tecnológicos, sociales), PONs y recursos de emergencia.',
      },
      subagent_chat_vehiculos: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Gestor de Flota e Inspección Preoperacional PESV',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito3_vehiculos',
        directive: 'Verifica vigencia de SOAT, revisión técnico-mecánica, mantenimiento e inspecciones diarias.',
      },
      subagent_chat_comites: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Gestor de Comités COPASST y Convivencia Laboral',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito4_comites',
        directive: 'Controla conformación paritaria, quórum, actas mensuales/trimestrales y compromisos abiertos.',
      },
      subagent_chat_capacitaciones: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Coordinador Programa Anual de Capacitación SST',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito5_capacitaciones',
        directive: 'Supervisa sesiones programadas, cobertura de inducción/reinducción y eficacia formativa.',
      },
      subagent_chat_cursos_lms: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Tutor de Escuela Virtual y Progreso LMS',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito6_ruta_aprendizaje',
        directive: 'Monitorea cursos publicados, avance de lecciones por colaborador y certificados emitidos.',
      },
      subagent_chat_auditorias: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Auditor Interno Anual SG-SST (Dec. 1072)',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito7_auditoria',
        directive: 'Registra y da seguimiento a no conformidades mayores, menores y observaciones de auditoría.',
      },
      subagent_chat_cronograma: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Gestor de Plan de Trabajo Anual y Tablero ACPM',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito7_acpm',
        directive: 'Crea, actualiza y audita tareas preventivas/correctivas Kanban y vencimientos del cronograma.',
      },
      subagent_chat_alta_direccion: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Asesor de Revisión Anual por la Alta Dirección',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'hito7_alta_direccion',
        directive: 'Consolida las 24 entradas gerenciales exigidas por el Art. 2.2.4.6.31 del Decreto 1072.',
      },
      subagent_chat_documentos_vivo: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Editor de Documentos Vivos SG-SST (LiveEditor)',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'wappy_rag_documental',
        directive: 'Consulta, redacta y actualiza documentos controlados y matrices exportables de la empresa.',
      },
      subagent_chat_agenda: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Coordinador de Agenda Operativa y Google Calendar SST',
        badge: 'SUB-AGENTE MCP',
        directive: 'Programa inspecciones, reuniones de comités, exámenes periódicos y recordatorios SST.',
      },
      subagent_chat_automatizaciones: {
        title: 'Equipo 8 · Sub-Agente Operativo MCP: Orquestador de Tareas Programadas y Flujos Autónomos',
        badge: 'SUB-AGENTE MCP',
        targetInspectId: 'schedule_cron',
        directive: 'Consulta el estado de las automatizaciones activas, horarios Cron y bitácoras de ejecución.',
      },
      subagent_researcher: {
        title: 'Equipo 8 · Sub-Agente Especialista: Investigador Normativo y Clínico SST',
        badge: 'SUB-AGENTE IA',
        directive: 'Profundiza en requisitos legales, guías técnicas MinTrabajo, GATISO y normativa vigente.',
      },
      subagent_scraper_agy: {
        title: 'Equipo 8 · Sub-Agente Especialista: Operador de Verificación de Afiliaciones y Cédulas (AGY)',
        badge: 'SUB-AGENTE IA',
        directive: 'Valida la nómina de trabajadores por cédula, estado ARL/EPS/AFP y certificados oficiales.',
      },
      subagent_auditor_calidad: {
        title: 'Equipo 8 · Sub-Agente Especialista: Auditor de Calidad y Cierre de Brechas ACPM',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito7_acpm',
        directive: 'Verifica que cada brecha detectada tenga causa raíz y plan de acción en Fuente, Medio e Individuo.',
      },
      subagent_editable_custom: {
        title: 'Equipo 8 · Sub-Agente IA Personalizable (Prompt e Instrucciones a Medida)',
        badge: 'SUB-AGENTE EDITABLE',
        targetInspectId: 'hito1_diagnostico_0312',
        directive: 'Ejecuta el rol pericial y las instrucciones especializadas definidas por el usuario sobre los datos reales de la empresa.',
      },
      subagent_chat_consultor_sgsst: {
        title: 'Equipo 8 · Sub-Agente Especialista: Consultor Líder SG-SST (Decreto 1072 & Res. 0312)',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito1_diagnostico_0312',
        directive: 'Dirige la evaluación integral del Sistema de Gestión SST, ciclo PHVA, cumplimiento de estándares mínimos y planes anuales.',
      },
      subagent_chat_tenshi: {
        title: 'Equipo 8 · Sub-Agente Especialista: Tenshi IA Copiloto Ejecutivo Multimodal SST',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'tool_sst_company',
        directive: 'Coordina briefings ejecutivos, alertas preventivas y síntesis transversal de los 8 Hitos de Somos SST.',
      },
      subagent_chat_abogado_laboral: {
        title: 'Equipo 8 · Sub-Agente Especialista: Abogado Laboralista & Defensa Jurídica SST',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito1_matriz_legal',
        directive: 'Analiza responsabilidad civil/laboral (Art. 216 CST), jurisprudencia Corte Suprema, descargos, RIT/RHS y cumplimiento legal.',
      },
      subagent_medico_laboral: {
        title: 'Equipo 8 · Sub-Agente Especialista: Médico Especialista en Medicina del Trabajo y Laboral',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito2_condiciones_salud',
        directive: 'Evalúa profesiogramas, conceptos de aptitud EMO (Res. 1843 de 2025), restricciones médico-laborales y SVE bajo estricta reserva clínica.',
      },
      subagent_chat_fisioterapeuta: {
        title: 'Equipo 8 · Sub-Agente Especialista: Fisioterapeuta Ergónomo SST (DME, RULA/REBA/OWAS)',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito3_estudio_puesto',
        directive: 'Audita riesgo biomecánico, posturas forzadas, manipulación de cargas, pausas activas y estudios de puesto de trabajo (EPT).',
      },
      subagent_chat_psicologo_sst: {
        title: 'Equipo 8 · Sub-Agente Especialista: Psicólogo Especialista en Riesgo Psicosocial (Res. 2764)',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito4_psicosocial',
        directive: 'Analiza batería psicosocial, clima emocional, carga mental, prevención de burnout y protocolos de intervención Res. 2764 de 2022.',
      },
      subagent_chat_terapeuta_mental: {
        title: 'Equipo 8 · Sub-Agente Especialista: Terapeuta de Bienestar Emocional y Primeros Auxilios Psicológicos',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito3_cocolab',
        directive: 'Orienta contención emocional, convivencia laboral (Ley 1010 / Res. 3461) y rutas de apoyo psicosocial confidencial.',
      },
      subagent_chat_nutricionista: {
        title: 'Equipo 8 · Sub-Agente Especialista: Nutricionista Ocupacional y Estilos de Vida Saludable',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito2_condiciones_salud',
        directive: 'Diseña programas de riesgo cardiovascular, metabólico, hidratación en estrés térmico y hábitos saludables para la nómina.',
      },
      subagent_chat_primer_respondiente: {
        title: 'Equipo 8 · Sub-Agente Especialista: Instructor Primer Respondiente, APH y MEDEVAC',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito3_brigada_emergencias',
        directive: 'Estructura protocolos PAS, atención prehospitalaria, activación MEDEVAC, botiquines y respuesta inicial ante urgencias.',
      },
      subagent_chat_emergencias: {
        title: 'Equipo 8 · Sub-Agente Especialista: Comandante de Emergencias, Vulnerabilidad y SCI',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito6_vulnerabilidad',
        directive: 'Evalúa amenazas, diamantes de vulnerabilidad, Procedimientos Operativos Normalizados (PON) y simulacros de evacuación.',
      },
      subagent_chat_bioseguridad: {
        title: 'Equipo 8 · Sub-Agente Especialista: Epidemiólogo & Experto en Riesgo Biológico y Bioseguridad',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito2_matriz_ipevar',
        directive: 'Controla exposición a agentes biológicos, esquemas de vacunación ocupacional, manejo de residuos biosanitarios y EPP biológico.',
      },
      subagent_chat_electricista: {
        title: 'Equipo 8 · Sub-Agente Especialista: Ingeniero de Seguridad Eléctrica RETIE & LOTO',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito3_ats',
        directive: 'Verifica las 5 Reglas de Oro en riesgo eléctrico, bloqueo y etiquetado (LOTO), distancias de seguridad RETIE y EPP dieléctrico.',
      },
      subagent_chat_quimico: {
        title: 'Equipo 8 · Sub-Agente Especialista: Higienista Químico & Experto SGA (Decreto 1496)',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito5_registro_quimico',
        directive: 'Audita Fichas de Datos de Seguridad (16 secciones), etiquetado SGA, valores límite TLV-TWA y matrices de compatibilidad química.',
      },
      subagent_chat_seguridad_vial: {
        title: 'Equipo 8 · Sub-Agente Especialista: Auditor Líder PESV & Seguridad Vial (Res. 20223040040595)',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito3_vehiculos',
        directive: 'Audita las 24 fases del PESV, inspecciones preoperacionales diarias, control de SOAT/RTM/SIMIT y gestión de velocidad/fatiga.',
      },
      subagent_chat_tareas_criticas: {
        title: 'Equipo 8 · Sub-Agente Especialista: Coordinador de Tareas de Alto Riesgo (Alturas Res. 4272, Confinados Res. 0491)',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito3_alturas',
        directive: 'Valida permisos de trabajo en alturas, espacios confinados, trabajo en caliente, izaje de cargas e inspección de equipos EPCC.',
      },
      subagent_chat_minas: {
        title: 'Equipo 8 · Sub-Agente Especialista: Ingeniero de Seguridad Minera y Excavaciones (Dec. 1886 / Dec. 539)',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito3_ats',
        directive: 'Audita ventilación subterránea, monitoreo atmosférico multigas, sostenimiento, taludes y seguridad en labores mineras/civiles.',
      },
      subagent_chat_ambiental: {
        title: 'Equipo 8 · Sub-Agente Especialista: Ingeniero HSEQ & Gestión Ambiental ISO 14001',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito5_registro_quimico',
        directive: 'Integra controles ambientales, contención de derrames, gestión RESPEL y matrices de aspectos e impactos ambientales con SST.',
      },
      subagent_chat_redactor: {
        title: 'Equipo 8 · Sub-Agente Especialista: Redactor Documental ISO 45001 & Control de Documentos SST',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'wappy_rag_documental',
        directive: 'Estructura procedimientos, instructivos, programas, políticas y actas con codificación documental lista para LiveEditor/Word/PDF.',
      },
      subagent_chat_profesional_sst: {
        title: 'Equipo 8 · Sub-Agente Especialista: Profesional Operativo SST de Campo e Inspecciones',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito4_actos_condiciones',
        directive: 'Ejecuta seguimiento diario de hallazgos locativos, actos/condiciones subestándar, entregas de EPP y charlas de 5 minutos.',
      },
      subagent_chat_climatico: {
        title: 'Equipo 8 · Sub-Agente Especialista: Analista de Riesgo Climático, Rayos y Estrés Térmico WBGT',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'pronostico_clima_sst',
        directive: 'Cruza condiciones meteorológicas por sede con trabajo a la intemperie, alturas, tormentas eléctricas y pausas de hidratación.',
      },
      subagent_chat_simulador_atel: {
        title: 'Equipo 8 · Sub-Agente Especialista: Investigador Forense ATEL & Reconstrucción Causal (Res. 1401)',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito7_investigacion_atel',
        directive: 'Aplica metodología NTC 3701, 5 Porqués y Árbol de Causas para investigar incidentes y accidentes laborales sin sesgos.',
      },
      subagent_analista_ausentismo: {
        title: 'Equipo 8 · Sub-Agente Especialista: Analista Estadístico de Ausentismo y Siniestralidad (Res. 0312 Art. 30)',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito7_estadisticas_atel',
        directive: 'Calcula los 6 indicadores mínimos obligatorios, tendencias por CIE-10/área y costos ocultos de incapacidad laboral.',
      },
      subagent_validador_seguridad_social: {
        title: 'Equipo 8 · Sub-Agente Especialista: Auditor de Afiliaciones PILA, ARL, EPS, AFP y Contratistas',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito5_contratistas',
        directive: 'Cruza nómina activa y contratistas contra soportes de seguridad social vigente, clase de riesgo ARL y certificaciones.',
      },
      subagent_sintetizador_gerencia: {
        title: 'Equipo 8 · Sub-Agente Especialista: Relator Ejecutivo para Gerencia y Alta Dirección (Art. 2.2.4.6.31)',
        badge: 'SUB-AGENTE IA',
        targetInspectId: 'hito7_alta_direccion',
        directive: 'Sintetiza indicadores técnicos en tableros ejecutivos gerenciales con ROI preventivo, riesgos críticos y decisiones presupuestales.',
      },
    };

    const spec = catalogSpecMap[canonicalId] || {
      title: `Equipo 8 · Nodo Especializado (${canonicalId})`,
      badge: 'ACTIVO',
      directive: `Directriz procedural activa para ${canonicalId} en el flujo de ${company?.companyName || 'la empresa'}.`,
    };

    let linkedRecords = [];
    if (spec.targetInspectId) {
      try {
        let subRes = await inspectHito1And2(spec.targetInspectId, userId, company);
        if (!subRes) subRes = await inspectHito3To5(spec.targetInspectId, userId, company);
        if (!subRes) subRes = await inspectHito6To8(spec.targetInspectId, userId, company);
        if (!subRes) subRes = await inspectTriggersAndMemoryTeams({ canonicalId: spec.targetInspectId, userId, company });
        if (Array.isArray(subRes?.records)) {
          linkedRecords = subRes.records.slice(0, 8);
        }
      } catch (_) {}
    }

    return {
      moduleTitle: spec.title,
      sourceCollection: spec.targetInspectId ? `WappySkillsAndRulesCatalog + ${spec.targetInspectId}` : 'WappySkillsAndRulesCatalog',
      kpis: [
        { label: 'Tipo de Nodo', value: spec.badge, tone: 'purple' },
        { label: 'Aplicación en Flujo', value: 'OBLIGATORIA', tone: 'emerald' },
        { label: 'Empresa Objetivo', value: company?.companyName || 'Activa', tone: 'teal' },
        ...(linkedRecords.length > 0 ? [{ label: 'Registros Vinculados', value: linkedRecords.length, tone: 'indigo' }] : []),
      ],
      records: [
        {
          id: `spec_${canonicalId}`,
          label: `🧩 ${spec.title}`,
          sublabel: spec.directive,
          badge: spec.badge,
          badgeTone: 'purple',
          isCritical: false,
          fields: {
            'Nombre del Nodo / Regla / Skill': spec.title,
            'Directriz Procedural Obligatoria': spec.directive,
            'Empresa Objetivo': `${company?.companyName || 'Empresa Activa'} (NIT ${company?.nit || 'N/A'})`,
          },
        },
        ...linkedRecords,
      ],
    };
  }

  return null;
}

/**
 * Construye la respuesta oficial bloqueada para nodos en estado `🚧 Nodo en Construcción`,
 * impidiendo cualquier llamada externa o scraping y entregando mensaje claro en los 3 paneles.
 */
function buildBlockedConstructionResponse({ rawNodeId, canonicalId, company, specOverride = null }) {
  const spec = specOverride || BLOCKED_CONSTRUCTION_NODE_SPECS[canonicalId] || {
    title: canonicalId,
    team: 'Catálogo de Flujos WAPPY',
    reason: `🚧 Nodo en Construcción: El conector «${canonicalId}» se encuentra temporalmente en construcción y no ejecuta consultas externas.`,
  };
  const cName = company?.companyName || 'Empresa Activa';
  const warningMsg = spec.reason.includes('🚧 Nodo en Construcción')
    ? spec.reason
    : `🚧 Nodo en Construcción: ${spec.reason}`;

  const blockedRecord = sanitizeInspectorRecord(
    {
      id: `construction_${canonicalId}`,
      label: `🚧 Nodo en Construcción — ${spec.title}`,
      sublabel: warningMsg,
      badge: '🚧 Nodo en Construcción',
      badgeTone: 'amber',
      isCritical: false,
      fields: {
        'Estado Operativo del Nodo': '🚧 Nodo en Construcción (Ejecución Externa Bloqueada)',
        'Nombre del Nodo': spec.title,
        'Equipo / Categoría': spec.team,
        'Detalle Técnico': warningMsg,
        'Empresa Seleccionada': cName,
      },
    },
    0,
  );

  return {
    success: true,
    status: 'under_construction',
    underConstruction: true,
    blocked: true,
    connected: false,
    warning: warningMsg,
    nodeId: String(rawNodeId || canonicalId || ''),
    canonicalNodeId: canonicalId,
    companyId: company?._id ? String(company._id) : null,
    companyName: cName,
    moduleTitle: `🚧 Nodo en Construcción — ${spec.title}`,
    sourceCollection: 'WappyCatalogConstructionGuard',
    totalRecords: 1,
    criticalCount: 0,
    kpis: [
      { label: 'Estado del Nodo', value: '🚧 Nodo en Construcción', tone: 'amber' },
      { label: 'Ejecución Externa', value: 'BLOQUEADA', tone: 'rose' },
      { label: 'Empresa Activa', value: cName, tone: 'teal' },
    ],
    latestReports: [],
    evidenceFiles: [],
    evidences: [],
    records: [blockedRecord],
  };
}

/**
 * Función principal para el endpoint GET /api/sgsst/automatizaciones/node-live-inspector
 */
async function inspectNodeLiveData(params = {}) {
  const {
    userId,
    companyId,
    nodeId,
    nodeConfig = {},
    options = {},
    disabledApps = [],
    executeLive = false,
    driveFolderId,
    driveFolderUrl,
    driveFolderName,
    fileNameFilter,
    fileTypeFilter,
    maxItems,
    watchFolderPath,
    includeSubfolders,
    recordFilterMode,
    expiryAuditScope,
    dedupWindow,
    sstAppSourceId,
    emailSubjectFilter,
    endpointUrl,
  } = params || {};

  const topLevelQueryOverrides = {};
  if (driveFolderId !== undefined) topLevelQueryOverrides.driveFolderId = driveFolderId;
  if (driveFolderUrl !== undefined) topLevelQueryOverrides.driveFolderUrl = driveFolderUrl;
  if (driveFolderName !== undefined) topLevelQueryOverrides.driveFolderName = driveFolderName;
  if (fileNameFilter !== undefined) topLevelQueryOverrides.fileNameFilter = fileNameFilter;
  if (fileTypeFilter !== undefined) topLevelQueryOverrides.fileTypeFilter = fileTypeFilter;
  if (maxItems !== undefined) topLevelQueryOverrides.maxItems = maxItems;
  if (watchFolderPath !== undefined) topLevelQueryOverrides.watchFolderPath = watchFolderPath;
  if (includeSubfolders !== undefined) topLevelQueryOverrides.includeSubfolders = includeSubfolders;
  if (recordFilterMode !== undefined) topLevelQueryOverrides.recordFilterMode = recordFilterMode;
  if (expiryAuditScope !== undefined) topLevelQueryOverrides.expiryAuditScope = expiryAuditScope;
  if (dedupWindow !== undefined) topLevelQueryOverrides.dedupWindow = dedupWindow;
  if (sstAppSourceId !== undefined) topLevelQueryOverrides.sstAppSourceId = sstAppSourceId;
  if (emailSubjectFilter !== undefined) topLevelQueryOverrides.emailSubjectFilter = emailSubjectFilter;
  if (endpointUrl !== undefined) topLevelQueryOverrides.endpointUrl = endpointUrl;

  const effectiveNodeConfig = {
    ...(options && typeof options === 'object' ? options : {}),
    ...(nodeConfig && typeof nodeConfig === 'object' ? nodeConfig : {}),
    ...topLevelQueryOverrides,
  };

  const company = await resolveTargetCompany(userId, companyId);
  const canonicalId = normalizeInspectorNodeId(nodeId);

  // 0. Guardia Estricta de Nodos Bloqueados / En Construcción (`🚧 Nodo en Construcción`)
  const isExplicitlyBlocked = Boolean(BLOCKED_CONSTRUCTION_NODE_SPECS[canonicalId]);
  const isDefaultConstructionApp =
    DEFAULT_CONSTRUCTION_HITO_APPS.has(canonicalId) &&
    effectiveNodeConfig?.unlockedConstruction !== true;
  const isDisabledApp =
    effectiveNodeConfig?.underConstruction === true ||
    isDefaultConstructionApp ||
    (Array.isArray(disabledApps) && (disabledApps.includes(canonicalId) || disabledApps.includes(String(nodeId || ''))));

  if (isExplicitlyBlocked || isDisabledApp) {
    const defaultHitoSpec = isDefaultConstructionApp
      ? {
          title: canonicalId,
          team: 'Equipo 6 · Aplicativos Hitos SG-SST (En Construcción)',
          reason: `🚧 Nodo en Construcción: El aplicativo «${canonicalId}» está marcado como módulo controlado en construcción en el catálogo actual.`,
        }
      : null;
    return buildBlockedConstructionResponse({
      rawNodeId: nodeId,
      canonicalId,
      company,
      specOverride: defaultHitoSpec,
    });
  }

  let result = await inspectHito1And2(canonicalId, userId, company, effectiveNodeConfig);
  if (!result) {
    result = await inspectHito3To5(canonicalId, userId, company);
  }
  if (!result) {
    result = await inspectHito6To8(canonicalId, userId, company);
  }
  if (!result) {
    result = await inspectOtherNodeTeams({
      canonicalId,
      rawNodeId: nodeId,
      userId,
      company,
      nodeConfig: effectiveNodeConfig,
      options: effectiveNodeConfig,
      executeLive,
    });
  }

  // Fallback honesto para cualquier nodo dinámico nuevo personalizado (sin inyectar filas sintéticas falsas)
  if (!result) {
    result = {
      moduleTitle: `Inspector Operativo SG-SST (${canonicalId || 'General'})`,
      sourceCollection: 'Somos SST (Sin colección específica)',
      isGenericFallback: true,
      kpis: [{ label: 'Registros Cargados', value: 0, tone: 'slate' }],
      latestReports: [],
      records: [],
    };
  }

  const records = Array.isArray(result.records) ? result.records : [];
  const sanitizedRecords = records.slice(0, 300).map((r, i) => sanitizeInspectorRecord(r, i));
  const sanitizedKpis = (Array.isArray(result.kpis) ? result.kpis : []).map((k) => ({
    label: formatCleanScalar(k?.label, 'Indicador'),
    value: typeof k?.value === 'number' && Number.isFinite(k.value) ? k.value : formatCleanScalar(k?.value, '0'),
    tone: formatCleanScalar(k?.tone, 'teal'),
  }));

  const rawEvidences = Array.isArray(result.evidenceFiles)
    ? result.evidenceFiles
    : Array.isArray(result.evidences)
      ? result.evidences
      : [];
  const cleanEvidenceFiles = [];
  const seenEvKeys = new Set();
  for (let i = 0; i < rawEvidences.length; i++) {
    const evItem = rawEvidences[i];
    if (evItem && evItem.fileName && evItem.url && evItem.mimeType) {
      const key = `${evItem.fileName}::${evItem.url}`;
      if (!seenEvKeys.has(key)) {
        seenEvKeys.add(key);
        cleanEvidenceFiles.push({
          id: formatCleanScalar(evItem.id, `ev_${i}`),
          fileName: formatCleanScalar(evItem.fileName, `certificado_${i + 1}.pdf`),
          fileType: formatCleanScalar(evItem.fileType, 'pdf'),
          mimeType: formatCleanScalar(evItem.mimeType, 'application/pdf'),
          url: formatCleanScalar(evItem.url, ''),
          downloadUrl: formatCleanScalar(evItem.downloadUrl, ''),
          absoluteUrl: formatCleanScalar(evItem.absoluteUrl, ''),
          localPath: evItem.localPath ? String(evItem.localPath) : '',
          cedula: formatCleanScalar(evItem.cedula, 'N/A'),
          workerName: formatCleanScalar(evItem.workerName, 'Colaborador'),
          cargo: formatCleanScalar(evItem.cargo, 'General'),
          portal: formatCleanScalar(evItem.portal, 'Portal Oficial'),
          title: formatCleanScalar(evItem.title, 'Certificado Oficial'),
        });
      }
    } else {
      const normalizedArr = normalizeCleanEvidenceFile(evItem, i) || [];
      for (const n of normalizedArr) {
        const key = `${n.fileName}::${n.url}`;
        if (!seenEvKeys.has(key)) {
          seenEvKeys.add(key);
          cleanEvidenceFiles.push(n);
        }
      }
    }
  }

  const criticalCount = sanitizedRecords.filter((r) => r.isCritical).length;
  const latestReports = Array.isArray(result.latestReports) ? result.latestReports : [];

  return {
    success: true,
    status: 'ok',
    underConstruction: false,
    blocked: false,
    connected: result.connected !== undefined ? Boolean(result.connected) : true,
    connectedEmail: result.connectedEmail ? String(result.connectedEmail) : '',
    resolvedFolder: result.resolvedFolder || null,
    ...(Array.isArray(result.availableFolders)
      ? { availableFolders: result.availableFolders }
      : {}),
    defaultConstruction: DEFAULT_CONSTRUCTION_HITO_APPS.has(canonicalId),
    isGenericFallback: Boolean(result.isGenericFallback),
    warning: null,
    nodeId: String(nodeId || ''),
    canonicalNodeId: canonicalId,
    companyId: company?._id ? String(company._id) : null,
    companyName: formatCleanScalar(company?.companyName, 'Empresa Activa'),
    moduleTitle: formatCleanScalar(result.moduleTitle, 'Aplicativo SG-SST'),
    sourceCollection: formatCleanScalar(result.sourceCollection, 'Somos SST'),
    totalRecords: sanitizedRecords.length,
    criticalCount,
    kpis: sanitizedKpis,
    latestReports,
    evidenceFiles: cleanEvidenceFiles,
    evidences: cleanEvidenceFiles,
    records: sanitizedRecords,
  };
}

/**
 * Inspector en Vivo de Nodos Estilo n8n de 3 Paneles (1. Entrada / 2. Config / 3. Salida Real).
 * Soporta tanto `inspectWorkflowNodeLive({ userId, companyId, nodeId, ... })` como `inspectWorkflowNodeLive(nodeId, opts)`.
 */
async function inspectWorkflowNodeLive(arg1 = {}, arg2 = {}) {
  const opts =
    typeof arg1 === 'string'
      ? { ...(arg2 || {}), nodeId: arg1 }
      : { ...(arg1 || {}) };

  const targetNodeId = opts.nodeId || opts.nodeKey || opts.id || 'schedule_cron';
  const nodeConfig = opts.nodeConfig && typeof opts.nodeConfig === 'object' ? opts.nodeConfig : {};
  const t0 = Date.now();

  const baseData = await inspectNodeLiveData({
    userId: opts.userId,
    companyId: opts.companyId,
    nodeId: targetNodeId,
    nodeConfig,
    options: opts.options,
    disabledApps: opts.disabledApps,
    executeLive: Boolean(opts.executeLive),
  });

  // Panel 1: ENTRADA (Upstream Items o Contexto de Empresa Activa)
  const rawUpstream = Array.isArray(opts.upstreamItems) ? opts.upstreamItems : [];
  let inputItems = [];
  if (rawUpstream.length > 0) {
    inputItems = rawUpstream.slice(0, 100).map((it, idx) => {
      if (!it || typeof it !== 'object') {
        return { index: idx + 1, valor: formatCleanScalar(it, 'N/A') };
      }
      const src = it.fields && typeof it.fields === 'object' ? it.fields : it;
      const cleanObj = {};
      for (const [k, v] of Object.entries(src)) {
        const ck = formatCleanScalar(k, '');
        if (ck) cleanObj[ck] = formatCleanScalar(v, 'No registra');
      }
      return cleanObj;
    });
  } else {
    inputItems = [
      {
        'Empresa Activa': baseData.companyName,
        'ID Empresa': baseData.companyId || 'Activa',
        'Nodo Evaluado': baseData.moduleTitle,
        'Colección Origen': baseData.sourceCollection,
      },
    ];
  }
  const inputSchemaFields = Array.from(
    new Set(inputItems.slice(0, 10).flatMap((obj) => Object.keys(obj || {}))),
  );

  // Panel 2: CONFIGURACIÓN QUIRÚRGICA DEL NODO
  const availableFields = Array.from(
    new Set(
      (baseData.records || [])
        .slice(0, 25)
        .flatMap((r) => Object.keys(r?.fields || {})),
    ),
  );
  const rawSelectedFields = Array.isArray(nodeConfig.selectedFields)
    ? nodeConfig.selectedFields
    : Array.isArray(nodeConfig.fields)
      ? nodeConfig.fields
      : [];
  const selectedFields = rawSelectedFields
    .map((f) => formatCleanScalar(f, ''))
    .filter((f) => f && f !== 'N/A');
  const strictFieldFilter = nodeConfig.strictFieldFilter !== false && selectedFields.length > 0;
  const filterMode = nodeConfig.recordFilterMode || 'all';
  const selectedRecordIds = Array.isArray(nodeConfig.selectedRecordIds)
    ? nodeConfig.selectedRecordIds.map(String)
    : [];

  // Panel 3: SALIDA REAL PROYECTADA (Items JSON limpios + Archivos de Evidencia + Informes HTML)
  let filteredRecords = baseData.records || [];
  if (!baseData.underConstruction) {
    if (filterMode === 'critical_only' || filterMode === 'expiry_only') {
      filteredRecords = filteredRecords.filter((r) => r.isCritical);
    } else if (filterMode === 'selected' && selectedRecordIds.length > 0) {
      const idSet = new Set(selectedRecordIds);
      filteredRecords = filteredRecords.filter((r) => idSet.has(String(r.id)));
    }
  }

  const outputItems = filteredRecords.map((rec) => {
    const recFields = rec.fields || {};
    if (strictFieldFilter) {
      const projected = { _recordId: rec.id, _estado: rec.badge };
      const entries = Object.entries(recFields);
      for (const sf of selectedFields) {
        const sfLow = sf.toLowerCase().trim();
        const match =
          entries.find(([fk]) => fk.toLowerCase().trim() === sfLow) ||
          entries.find(
            ([fk]) =>
              fk.toLowerCase().includes(sfLow) ||
              sfLow.includes(fk.toLowerCase().trim()),
          );
        projected[sf] = match ? formatCleanScalar(match[1], 'No registra') : 'No registra';
      }
      return projected;
    }
    return {
      _recordId: rec.id,
      _resumen: rec.label,
      _estado: rec.badge,
      _critico: rec.isCritical ? 'Sí' : 'No',
      ...recFields,
    };
  });

  const durationMs = Math.max(1, Date.now() - t0);
  const logs = baseData.underConstruction
    ? [
        {
          level: 'warn',
          message: baseData.warning || '🚧 Nodo en Construcción',
          durationMs,
        },
      ]
    : [
        {
          level: 'success',
          message: `Inspección en vivo completada sobre «${baseData.moduleTitle}» (${outputItems.length} registro(s), ${(baseData.latestReports || []).length} informe(s) oficial(es), ${baseData.evidenceFiles.length} evidencia(s)) en ${durationMs} ms.`,
          durationMs,
        },
      ];

  return {
    ...baseData,
    durationMs,
    filteredRecordsCount: filteredRecords.length,
    outputItems,
    logs,
    inputPanel: {
      sourceTitle: formatCleanScalar(
        opts.upstreamNodeTitle,
        rawUpstream.length > 0 ? 'Nodo Anterior Conectado' : 'Contexto Directo de Empresa Activa',
      ),
      itemCount: inputItems.length,
      schemaFields: inputSchemaFields,
      items: inputItems,
    },
    configPanel: {
      nodeId: baseData.nodeId,
      canonicalNodeId: baseData.canonicalNodeId,
      moduleTitle: baseData.moduleTitle,
      underConstruction: baseData.underConstruction,
      filterMode,
      strictFieldFilter,
      selectedFields,
      availableFields,
      parameters: {
        prompt: formatCleanScalar(nodeConfig.prompt || nodeConfig.customInstruction, 'Extracción estructurada automática'),
        targetUrl: formatCleanScalar(nodeConfig.targetUrl, 'Automático según conector'),
      },
    },
    outputPanel: {
      status: baseData.status,
      underConstruction: baseData.underConstruction,
      warning: baseData.warning,
      sourceCollection: baseData.sourceCollection,
      totalRecords: baseData.totalRecords,
      filteredCount: filteredRecords.length,
      criticalCount: baseData.criticalCount,
      kpis: baseData.kpis,
      latestReports: baseData.latestReports || [],
      items: outputItems,
      records: filteredRecords,
      evidenceFiles: baseData.evidenceFiles,
    },
  };
}

/**
 * Resuelve determinísticamente el rol causal de un aplicativo Hito dentro del DAG:
 * - `'source_read'`: Fuente de lectura en Etapa 2 (a la izquierda de IF y del Agente IA).
 * - `'target_write_report'`: Destino de escritura / generación de Informe Oficial HTML (a la derecha del Agente IA / Rama SÍ).
 */
function resolveWorkflowHitoRole(nodeConfigs = {}, hitoId = '') {
  const safeConfigs = nodeConfigs && typeof nodeConfigs === 'object' ? nodeConfigs : {};
  const rawId = String(hitoId || '').trim();
  const canonical = rawId ? normalizeInspectorNodeId(rawId) : '';
  const cfg =
    safeConfigs[`tool_hitos_${rawId}`] ||
    safeConfigs[`hito_${rawId}`] ||
    safeConfigs[rawId] ||
    (canonical && canonical !== rawId
      ? safeConfigs[`tool_hitos_${canonical}`] ||
        safeConfigs[`hito_${canonical}`] ||
        safeConfigs[canonical]
      : null) ||
    {};

  if (cfg.hitoRole === 'source_read' || cfg.hitoRole === 'target_write_report') {
    return cfg.hitoRole;
  }
  if (
    ['write_and_report', 'write_and_update', 'generate_report'].includes(cfg.appActionMode) ||
    cfg.generateAppReport === true ||
    ['write_register', 'audit_and_update'].includes(cfg.hitoOperationMode)
  ) {
    return 'target_write_report';
  }
  return 'source_read';
}

/**
 * Genera una llave determinista y estable de negocio para deduplicación entre corridas (`Remove Duplicates`):
 * busca cédula/documento, placa vehicular, número CAS o código estándar en `rec.fields` o `rec.id`
 * y retorna `${canonicalNodeId}:${cleanId}` (ej. `hito2_perfil_socio:10203040`, `hito3_epp:10203040`, `hito3_matriz_pesv:abc123`).
 */
function extractWorkflowEntityDedupKey(canonicalNodeId = '', rec = {}) {
  const rawPrefix = String(canonicalNodeId || '').trim();
  const cleanNode =
    rawPrefix === 'drive' || rawPrefix === 'gmail'
      ? rawPrefix
      : rawPrefix
        ? normalizeInspectorNodeId(rawPrefix)
        : 'source';
  const safeRec = rec && typeof rec === 'object' ? rec : {};
  const fields = safeRec.fields && typeof safeRec.fields === 'object' ? safeRec.fields : {};

  const isPlaceholder = (val) => {
    if (val === undefined || val === null) return true;
    const s = String(val).trim().toLowerCase();
    return (
      !s ||
      s === 'n/a' ||
      s === 'na' ||
      s === 'no registra' ||
      s === 'sin registro' ||
      s === 'no aplica' ||
      s === 'undefined' ||
      s === 'null' ||
      s === 's/n' ||
      s === '-'
    );
  };

  if (cleanNode === 'drive' || cleanNode === 'gmail') {
    const extId = String(
      fields.fileId || fields.messageId || safeRec.fileId || safeRec.messageId || safeRec.id || '',
    ).trim();
    return `${cleanNode}:${extId || 'unknown'}`;
  }

  const orderedEntries = [...Object.entries(fields), ...Object.entries(safeRec)].filter(
    ([k, v]) =>
      k !== 'fields' &&
      k !== 'index' &&
      k !== 'isCritical' &&
      k !== 'badgeTone' &&
      typeof v !== 'object' &&
      !isPlaceholder(v),
  );

  const getFieldByPatterns = (patterns) => {
    for (const [k, v] of orderedEntries) {
      const kNorm = String(k)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
      if (patterns.some((rx) => rx.test(kNorm))) {
        return String(v).trim();
      }
    }
    return '';
  };

  // 0. Para vehículos PESV y hojas de vida de equipos contra caídas, priorizar Placa o Serial antes que la Cédula del conductor/custodio
  if (cleanNode === 'hito3_vehiculos') {
    const vehId = String(safeRec.id || getFieldByPatterns([/^placa\b/, /\bplaca\b/]) || '')
      .replace(/^placa\s*[:\s]*/i, '')
      .split('|')[0]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    if (vehId.length >= 4 && vehId.length <= 16) {
      return `${cleanNode}:${vehId}`;
    }
  }
  if (cleanNode === 'hito5_equipos_alturas' && !isPlaceholder(safeRec.id)) {
    const eqId = String(safeRec.id).trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '');
    if (eqId.length >= 3) {
      return `${cleanNode}:${eqId}`;
    }
  }

  // Helper de sub-clave para EPP (mismo trabajador puede tener varios EPP distintos)
  const buildEppSuffix = () => {
    if (cleanNode !== 'hito3_epp') return '';
    const rawEpp = getFieldByPatterns([/elemento de proteccion personal/]);
    if (!rawEpp) return '';
    const eppBase = rawEpp
      .split('(')[0]
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 28);
    return eppBase ? `:${eppBase}` : '';
  };

  // 1. Cédula / Documento de Identidad
  const rawDoc = getFieldByPatterns([
    /\bcedula\b/,
    /\bdocumento\b/,
    /\bidentificacion\b/,
    /^cc$/,
    /trabajadorcedula/,
    /numerodocumento/,
  ]);
  if (rawDoc) {
    const eppSuffix = buildEppSuffix();
    const ccMatchInCombined = rawDoc.match(/\b(?:cc|doc|id)[:\s]*(\d{5,15})\b/i);
    if (ccMatchInCombined && ccMatchInCombined[1]) {
      return `${cleanNode}:${ccMatchInCombined[1]}${eppSuffix}`;
    }
    const strippedPrefix = rawDoc.replace(/^(?:cc|ce|ti|nit|pep|ppt)[\s:.-]*/i, '').trim();
    const digitsOnly = strippedPrefix.replace(/\D/g, '');
    if (digitsOnly.length >= 5 && /^[\d.\s-]+$/.test(strippedPrefix)) {
      return `${cleanNode}:${digitsOnly}${eppSuffix}`;
    }
    const cleanAlpha = strippedPrefix.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanAlpha.length >= 3 && cleanAlpha.length <= 32) {
      return `${cleanNode}:${cleanAlpha}${eppSuffix}`;
    }
  }

  // 2. Placa vehicular
  const rawPlaca = getFieldByPatterns([/\bplaca\b/, /vehiculo.*placa/]);
  if (rawPlaca) {
    const cleanPlaca = rawPlaca.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanPlaca.length >= 4 && cleanPlaca.length <= 16) {
      return `${cleanNode}:${cleanPlaca}`;
    }
  }

  // 3. Número CAS / Código de Sustancia Química
  const rawCas = getFieldByPatterns([/\bcas\b/, /numerocas/, /codigoproducto/]);
  if (rawCas) {
    const cleanCas = rawCas.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
    if (cleanCas.length >= 2 && cleanCas.length <= 32) {
      return `${cleanNode}:${cleanCas}`;
    }
  }

  // 4. Código de Estándar 0312 / Numeral / Serial / Radicado / CaseId
  const rawCode = getFieldByPatterns([
    /codigo\s*estandar/,
    /^estandar$/,
    /^numeral$/,
    /\bserial\b/,
    /\bserie\b/,
    /\bcaseid\b/,
    /\bradicado\b/,
    /^codigo$/,
  ]);
  if (rawCode) {
    const cleanCode = rawCode.toLowerCase().replace(/[^a-z0-9._-]+/g, '').trim();
    if (cleanCode.length >= 2 && cleanCode.length <= 48) {
      return `${cleanNode}:${cleanCode}`;
    }
  }

  // 5. Buscar "(CC 10203040)" dentro de label si existe
  const labelStr = String(safeRec.label || safeRec.nombre || '');
  const ccInLabel = labelStr.match(/\b(?:cc|doc|id)[:\s]*(\d{5,15})\b/i);
  if (ccInLabel && ccInLabel[1]) {
    return `${cleanNode}:${ccInLabel[1]}`;
  }

  // 6. Fallback determinista a rec.id o slug estable de rec.label
  const rawId = !isPlaceholder(safeRec.id)
    ? String(safeRec.id)
    : !isPlaceholder(safeRec._id)
      ? String(safeRec._id)
      : labelStr;
  const cleanId =
    String(rawId || 'item')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9._-]+/g, '')
      .slice(0, 80) || 'item';

  return `${cleanNode}:${cleanId}`;
}

/**
 * Mapa de familia canónica para deduplicar fuentes solapadas en flujos antiguos o híbridos:
 * garantiza que jamás se consulte ni inyecte dos veces la misma colección MongoDB.
 */
function resolveCanonicalSourceFamily(rawNodeId = '', canonicalNodeId = '') {
  const raw = String(rawNodeId || '').trim().toLowerCase();
  const canon = String(canonicalNodeId || '').trim().toLowerCase();

  if (
    raw === 'extract_sst_workers' ||
    raw === 'somos_sst_trabajadores' ||
    raw === 'somos_sst_examenes' ||
    raw === 'hito2_perfil_socio' ||
    raw === 'hito2_sociodemografico' ||
    canon === 'hito2_perfil_socio'
  ) {
    return 'family:workers_emo_nomina';
  }
  if (
    raw === 'somos_sst_epp' ||
    raw === 'hito3_epp' ||
    raw === 'hito6_inspecciones_epp' ||
    canon === 'hito3_epp'
  ) {
    return 'family:epp_dotacion';
  }
  if (
    raw === 'somos_sst_perfiles_cargo' ||
    raw === 'hito1_perfiles_cargo' ||
    raw === 'hito2_perfiles_cargo' ||
    canon === 'hito2_perfiles_cargo' ||
    canon === 'hito1_perfiles_cargo'
  ) {
    return 'family:perfiles_cargo';
  }
  if (raw === 'matriz_ipevar' || raw === 'extract_gtc45_risks' || canon === 'hito2_matriz_ipevar') {
    return 'family:matriz_ipevar';
  }
  if (raw === 'matriz_pesv' || canon === 'hito3_matriz_pesv') {
    return 'family:matriz_pesv';
  }
  if (raw === 'matriz_compatibilidad' || canon === 'hito3_quimicos_sga') {
    return 'family:compatibilidad_quimica';
  }
  if (raw === 'extract_chemical_inventory' || canon === 'hito5_registro_quimico') {
    return 'family:inventario_quimico';
  }
  if (raw === 'extract_pesv_vehicles' || canon === 'hito3_vehiculos') {
    return 'family:vehiculos_pesv';
  }
  if (
    raw === 'wappy_memory_company' ||
    raw === 'somos_sst_empresa' ||
    canon === 'tool_sst_company'
  ) {
    return 'family:company_profile';
  }
  return `family:${canon || raw}`;
}

/**
 * Recolecta estructuradamente ÚNICAMENTE las fuentes de lectura (`source_read`) de un flujo,
 * deduplicando fuentes canónicas solapadas y clasificando registros críticos frente al ledger
 * anti-duplicados (`alreadyProcessedKeysSet`).
 */
async function collectStructuredWorkflowSourceData(
  task,
  companyOverride = null,
  options = {},
) {
  const { alreadyProcessedKeysSet = new Set(), includeTargetWriteHitos = false } = options || {};
  const safeProcessedSet =
    alreadyProcessedKeysSet instanceof Set
      ? alreadyProcessedKeysSet
      : Array.isArray(alreadyProcessedKeysSet)
        ? new Set(alreadyProcessedKeysSet.filter(Boolean).map(String))
        : new Set();

  const emptyResult = {
    contextBlock: '',
    allRecords: [],
    criticalRecords: [],
    freshCriticalRecords: [],
    deduplicatedSkippedRecords: [],
    candidateProcessedKeys: [],
    sourceSummaries: [],
  };

  try {
    const userId = task?.user;
    const company = companyOverride || (await resolveTargetCompany(userId, task?.companyId));
    const wf = task?.workflowNodes || {};
    const nodeConfigs = wf?.canvasLayout?.nodeConfigs || wf?.nodeConfigs || {};
    const wfExtractors = Array.isArray(wf.extractors) ? wf.extractors : [];
    const wfHitos = Array.isArray(wf.hitos) ? wf.hitos : [];
    const wfInputs = Array.isArray(wf.inputs) ? wf.inputs : [];
    const wfMemories = Array.isArray(wf.memories) ? wf.memories : [];

    const sstAppAlias = {
      gtc45: 'hito2_matriz_ipevar',
      pesv: 'hito3_matriz_pesv',
      '0312': 'hito1_diagnostico_0312',
      diagnostico_0312: 'hito1_diagnostico_0312',
      atel: 'hito7_investigacion_atel',
      acpm: 'hito7_acpm',
      quimicos: 'hito5_registro_quimico',
      alturas: 'hito3_alturas',
      epp: 'hito3_epp',
      inspecciones: 'hito4_actos_condiciones',
      capacitaciones: 'hito5_capacitaciones',
      auditorias: 'hito7_auditoria',
      trabajadores: 'hito2_perfil_socio',
      cronograma: 'hito7_acpm',
      legal: 'hito1_matriz_legal',
    };

    const candidateNodes = [];
    const seenFamilies = new Set();

    // Si wappy_memory_company ya está activa en Memorias, el perfil de empresa ya está cubierto
    if (wfMemories.includes('wappy_memory_company')) {
      seenFamilies.add('family:company_profile');
    }

    const pushCandidate = (rawKey, rawNodeId, originType) => {
      if (!rawNodeId) return;
      const cfg =
        nodeConfigs[rawKey] ||
        nodeConfigs[rawNodeId] ||
        nodeConfigs[`tool_hitos_${rawNodeId}`] ||
        nodeConfigs[`hito_${rawNodeId}`] ||
        nodeConfigs[`extractor_${rawNodeId}`] ||
        nodeConfigs[`ext_${rawNodeId}`] ||
        nodeConfigs[`tool_inputs_${rawNodeId}`] ||
        nodeConfigs[`sub_memory_${rawNodeId}`] ||
        {};

      let effectiveRawId = rawNodeId;
      if (rawNodeId === 'extract_sst_app' && cfg.sstAppSourceId) {
        const cleanTarget = String(cfg.sstAppSourceId).toLowerCase().trim();
        effectiveRawId = sstAppAlias[cleanTarget] || String(cfg.sstAppSourceId).trim();
      }

      const canonical = normalizeInspectorNodeId(effectiveRawId);

      // Ignorar extractores externos (Drive, Gmail, Web Search, Webhook) que se manejan en pre-extracción dedicada
      const isSupportedLocalSource =
        canonical.startsWith('hito') ||
        canonical === 'tool_sst_company' ||
        canonical === 'wappy_memory_procedural' ||
        rawNodeId === 'extract_sst_workers' ||
        rawNodeId === 'extract_sst_app' ||
        rawNodeId === 'somos_sst_trabajadores' ||
        rawNodeId === 'somos_sst_examenes' ||
        rawNodeId === 'somos_sst_epp' ||
        rawNodeId === 'somos_sst_perfiles_cargo' ||
        rawNodeId === 'somos_sst_empresa' ||
        rawNodeId === 'wappy_memory_procedural';

      if (!isSupportedLocalSource) return;

      // Filtrar Hitos de destino (target_write_report) salvo que se pida explícitamente
      if (originType === 'hito' && !includeTargetWriteHitos) {
        const hitoRole = resolveWorkflowHitoRole(nodeConfigs, rawNodeId);
        if (hitoRole !== 'source_read') {
          return;
        }
      }

      // Deduplicación estricta por familia canónica (nómina/EMO, EPP, perfiles, matrices, etc.)
      const familyKey = resolveCanonicalSourceFamily(effectiveRawId, canonical);
      if (seenFamilies.has(familyKey)) {
        return;
      }
      seenFamilies.add(familyKey);

      candidateNodes.push({
        rawKey,
        rawNodeId: effectiveRawId,
        originalNodeId: rawNodeId,
        canonical,
        familyKey,
        originType,
        cfg,
      });
    };

    // Prioridad 1: Aplicativos Hito explícitos en modo `source_read` (fuentes canónicas más ricas)
    for (const hitoId of wfHitos) {
      pushCandidate(`tool_hitos_${hitoId}`, hitoId, 'hito');
    }
    // Prioridad 2: Extractores de Etapa 2 (`wf.extractors`)
    for (const extId of wfExtractors) {
      pushCandidate(`ext_${extId}`, extId, 'extractor');
    }
    // Prioridad 3: Inputs de lectura SOLO si su familia canónica no fue cubierta ya por Hito o Extractor
    for (const inId of wfInputs) {
      pushCandidate(`tool_inputs_${inId}`, inId, 'input');
    }
    // Prioridad 4: Memoria procedural con documentos .md quirúrgicos si aplica
    for (const memId of wfMemories) {
      if (memId === 'wappy_memory_procedural') {
        pushCandidate(`sub_memory_${memId}`, memId, 'memory');
      }
    }

    if (candidateNodes.length === 0) {
      return emptyResult;
    }

    const allRecords = [];
    const criticalRecords = [];
    const freshCriticalRecords = [];
    const deduplicatedSkippedRecords = [];
    const candidateProcessedKeysSet = new Set();
    const sourceSummaries = [];
    const sections = [];

    const formatRecordLine = (rec, idx, strictFilter, selectedFields) => {
      const fieldEntries = Object.entries(rec.fields || {}).filter(
        ([, fv]) => fv !== undefined && fv !== null && fv !== '' && fv !== 'No registra',
      );
      if (strictFilter) {
        const projected = [];
        for (const sf of selectedFields) {
          const sfNorm = sf.toLowerCase().trim();
          const match =
            fieldEntries.find(([fk]) => fk.toLowerCase().trim() === sfNorm) ||
            fieldEntries.find(
              ([fk]) =>
                fk.toLowerCase().includes(sfNorm) ||
                sfNorm.includes(fk.toLowerCase().trim()),
            );
          if (match && match[1] !== undefined && match[1] !== '') {
            projected.push(`${sf}: ${match[1]}`);
          }
        }
        if (projected.length > 0) {
          return `   ${idx + 1}. [${rec.id}] ${projected.join(' | ')}`;
        }
      }
      const allFieldsStr = fieldEntries.map(([fk, fv]) => `${fk}: ${fv}`).join(' | ');
      return allFieldsStr
        ? `   ${idx + 1}. [${rec.id}] ${rec.label} [${rec.badge || ''}] -> ${allFieldsStr}`
        : `   ${idx + 1}. ${rec.label} — ${rec.sublabel} [${rec.badge || ''}]`;
    };

    for (const item of candidateNodes) {
      const cfg = item.cfg || {};
      const liveData = await inspectNodeLiveData({
        userId,
        companyId: company?._id,
        nodeId: item.rawNodeId,
        sstAppSourceId: cfg.sstAppSourceId,
        nodeConfig: cfg,
      });

      if (liveData?.underConstruction) {
        continue;
      }

      const rawSelectedFields = Array.isArray(cfg.selectedFields)
        ? cfg.selectedFields
        : Array.isArray(cfg.fields)
          ? cfg.fields
          : [];
      const selectedFields = rawSelectedFields.filter(Boolean);
      const strictFilter = cfg.strictFieldFilter !== false && selectedFields.length > 0;
      const filterMode = cfg.recordFilterMode || 'all';
      const selectedRecordIds = Array.isArray(cfg.selectedRecordIds) ? cfg.selectedRecordIds : [];

      const rawRecords = Array.isArray(liveData.records) ? liveData.records : [];
      const isProceduralMemory = item.canonical === 'wappy_memory_procedural';

      // Población auditada en base de datos
      let auditedRecords = rawRecords;
      if (filterMode === 'selected' && selectedRecordIds.length > 0) {
        const idSet = new Set(selectedRecordIds.map(String));
        auditedRecords = rawRecords.filter((r) => idSet.has(String(r.id)));
      }

      const nodeFreshCritical = [];
      const nodeDedupSkipped = [];
      const nodeNonCritical = [];

      for (const rec of auditedRecords) {
        const entityKey = extractWorkflowEntityDedupKey(item.canonical, rec);
        const enrichedRec = {
          ...rec,
          _sourceNodeId: item.originalNodeId,
          _canonicalNodeId: item.canonical,
          _moduleTitle: liveData.moduleTitle || item.rawNodeId,
          _entityKey: entityKey,
        };
        if (!isProceduralMemory) {
          allRecords.push(enrichedRec);
        }

        if (!isProceduralMemory && rec.isCritical === true) {
          criticalRecords.push(enrichedRec);
          if (safeProcessedSet.has(entityKey)) {
            deduplicatedSkippedRecords.push(enrichedRec);
            nodeDedupSkipped.push(enrichedRec);
          } else {
            freshCriticalRecords.push(enrichedRec);
            candidateProcessedKeysSet.add(entityKey);
            nodeFreshCritical.push(enrichedRec);
          }
        } else {
          nodeNonCritical.push(enrichedRec);
        }
      }

      if (!isProceduralMemory) {
        sourceSummaries.push({
          nodeId: item.originalNodeId,
          canonicalNodeId: item.canonical,
          moduleTitle: liveData.moduleTitle || item.rawNodeId,
          totalRecords: auditedRecords.length,
          criticalCount: nodeFreshCritical.length + nodeDedupSkipped.length,
          freshCriticalCount: nodeFreshCritical.length,
          deduplicatedSkippedCount: nodeDedupSkipped.length,
          kpis: liveData.kpis || [],
        });
      }

      // Determinar registros a presentar en el bloque de contexto del Agente IA:
      // Si existen registros deduplicados por ventana anti-duplicados, se priorizan los freshCriticalRecords
      // y se omiten los críticos ya gestionados para no repetir alertas.
      let recordsForPrompt = [];
      if (filterMode === 'critical_only' || filterMode === 'expiry_only') {
        recordsForPrompt = nodeFreshCritical;
      } else if (safeProcessedSet.size > 0 && nodeDedupSkipped.length > 0) {
        recordsForPrompt = [...nodeFreshCritical, ...nodeNonCritical];
      } else {
        recordsForPrompt = [...nodeFreshCritical, ...nodeDedupSkipped, ...nodeNonCritical];
      }

      const kpiText = (liveData.kpis || []).map((k) => `${k.label}: ${k.value}`).join(' | ');
      const recordLines = recordsForPrompt
        .slice(0, 300)
        .map((rec, idx) => formatRecordLine(rec, idx, strictFilter, selectedFields));

      const dedupNoticeLine =
        safeProcessedSet.size > 0 && nodeDedupSkipped.length > 0
          ? `\n   • 🛡️ Filtro Anti-Duplicados Activo: ${nodeDedupSkipped.length} hallazgo(s) crítico(s) ya gestionado(s) en corridas recientes fue(ron) omitido(s) automáticamente (${nodeFreshCritical.length} brecha(s) nueva(s) pendiente(s) de gestión). NO repitas alertas sobre los registros ya gestionados.`
          : '';

      const shouldIncludeLatestReport =
        filterMode === 'critical_only' || filterMode === 'expiry_only'
          ? cfg.includeLatestReport === true
          : cfg.includeLatestReport !== false;

      let latestReportBlock = '';
      if (
        shouldIncludeLatestReport &&
        Array.isArray(liveData.latestReports) &&
        liveData.latestReports.length > 0
      ) {
        const topRep = liveData.latestReports[0];
        const repBody =
          topRep.structuredText || stripHtmlToText(topRep.html || '') || topRep.preview || '';
        if (repBody) {
          latestReportBlock =
            `\n   • Último Informe Oficial Emitido en Aplicativo («${topRep.title || 'Informe Oficial'}» — ${topRep.charCount || repBody.length} caracteres):\n` +
            `     ${repBody.slice(0, 6000)}`;
        }
      }

      sections.push(
        `📦 NODO FUENTE EN VIVO «${liveData.moduleTitle}» (${liveData.companyName}):\n` +
          `   • Indicadores Actuales: ${kpiText || 'N/A'}\n` +
          `   • Filtro de Registros: ${
            filterMode === 'expiry_only'
              ? `Solo Vencimientos Próximos o Vencidos <= 30 días (${recordsForPrompt.length} nuevos de ${auditedRecords.length} verificados)`
              : filterMode === 'critical_only'
                ? `Solo Críticos / Nuevas Brechas (${recordsForPrompt.length} nuevos de ${auditedRecords.length} verificados)`
                : filterMode === 'selected'
                  ? `Seleccionados Específicos (${recordsForPrompt.length})`
                  : `Auditados (${auditedRecords.length} total | ${nodeFreshCritical.length} brechas nuevas)`
          }${strictFilter ? ` | Campos Quirúrgicos Extraídos: [${selectedFields.join(', ')}]` : ''}` +
          dedupNoticeLine +
          `\n` +
          (recordLines.length > 0
            ? `   • Datos Extraídos de Base de Datos (Priorizando Brechas Nuevas No Duplicadas):\n${recordLines.join('\n')}`
            : nodeDedupSkipped.length > 0
              ? `   • Datos Extraídos de Base de Datos: (0 brechas nuevas pendientes; los ${nodeDedupSkipped.length} casos críticos existentes ya fueron alertados dentro de la ventana anti-duplicados)`
              : '   • Datos Extraídos de Base de Datos: (0 registros en brecha o 0 registros cargados actualmente en esta colección)') +
          latestReportBlock,
      );
    }

    const globalDedupHeader =
      safeProcessedSet.size > 0 && deduplicatedSkippedRecords.length > 0
        ? `🛡️ [MEMORIA ANTI-DUPLICADOS ESTRUCTURADA ACTIVA]: Se omitieron automáticamente ${deduplicatedSkippedRecords.length} registro(s) crítico(s) que ya fueron alertados/gestionados dentro de la ventana anti-duplicados vigente. Enfócate EXCLUSIVAMENTE en las ${freshCriticalRecords.length} brecha(s) nueva(s) listadas a continuación.\n\n`
        : '';

    const contextBlock =
      sections.length > 0
        ? `\n\n═══ DATOS QUIRÚRGICOS REALES EXTRAÍDOS DE LOS NODOS DE SOMOS SST (${company?.companyName || 'Empresa Activa'}) ═══\n` +
          globalDedupHeader +
          `Usa prioritariamente esta información real y filtrada quirúrgicamente por cada nodo fuente configurado:\n\n` +
          sections.join('\n\n')
        : '';

    return {
      contextBlock,
      allRecords,
      criticalRecords,
      freshCriticalRecords,
      deduplicatedSkippedRecords,
      candidateProcessedKeys: Array.from(candidateProcessedKeysSet),
      sourceSummaries,
    };
  } catch (err) {
    console.warn('[WorkflowNodeInspector] Error collecting structured source data:', err.message);
    return emptyResult;
  }
}

/**
 * Construye el bloque de datos quirúrgicos reales en vivo desde MongoDB
 * para todos los nodos fuente configurados en una automatización durante su ejecución.
 * Delega internamente en `collectStructuredWorkflowSourceData` por retrocompatibilidad total.
 */
async function buildSurgicalLiveContextForWorkflow(task, companyOverride = null, options = {}) {
  const res = await collectStructuredWorkflowSourceData(task, companyOverride, options);
  return res?.contextBlock || '';
}

module.exports = {
  extractGoogleDriveId,
  inspectWorkflowNodeLive,
  inspectNodeLiveData,
  inspectOtherNodeTeams,
  buildSurgicalLiveContextForWorkflow,
  collectStructuredWorkflowSourceData,
  resolveWorkflowHitoRole,
  extractWorkflowEntityDedupKey,
  normalizeInspectorNodeId,
  BLOCKED_CONSTRUCTION_NODE_SPECS,
};
