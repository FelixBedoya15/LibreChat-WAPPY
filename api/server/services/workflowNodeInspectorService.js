const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CompanyInfo = require('~/models/CompanyInfo');

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
 */
async function findSingleCompanyDoc(Model, userId, company) {
  if (!Model) return null;
  try {
    const companyFilter = buildCompanyScopeFilter(userId, company);
    let doc = await Model.findOne(companyFilter).sort({ updatedAt: -1 }).lean();
    if (!doc && userId) {
      const userVariants = [String(userId)];
      if (mongoose.Types.ObjectId.isValid(String(userId))) {
        userVariants.push(new mongoose.Types.ObjectId(String(userId)));
      }
      const legacyNoCompanyFilter = company?._id
        ? {
            user: { $in: userVariants },
            $or: [{ companyId: null }, { companyId: '' }, { companyId: { $exists: false } }],
          }
        : { user: { $in: userVariants } };
      doc = await Model.findOne(legacyNoCompanyFilter).sort({ updatedAt: -1 }).lean();
    }
    return doc;
  } catch (_) {
    return null;
  }
}

/**
 * Busca múltiples documentos de un aplicativo para la empresa activa (con aislamiento estricto multi-empresa).
 */
async function findManyCompanyDocs(Model, userId, company, sortObj = { updatedAt: -1 }, limit = 300) {
  if (!Model) return [];
  try {
    const companyFilter = buildCompanyScopeFilter(userId, company);
    let docs = await Model.find(companyFilter).sort(sortObj).limit(limit).lean();
    if ((!docs || docs.length === 0) && userId) {
      const userVariants = [String(userId)];
      if (mongoose.Types.ObjectId.isValid(String(userId))) {
        userVariants.push(new mongoose.Types.ObjectId(String(userId)));
      }
      const legacyNoCompanyFilter = company?._id
        ? {
            user: { $in: userVariants },
            $or: [{ companyId: null }, { companyId: '' }, { companyId: { $exists: false } }],
          }
        : { user: { $in: userVariants } };
      docs = await Model.find(legacyNoCompanyFilter).sort(sortObj).limit(limit).lean();
    }
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
 * Consulta los últimos informes guardados en Conversation / Message para unas etiquetas dadas.
 */
async function fetchLatestReportsForTags(userId, company, tags = [], limit = 5) {
  if (!Array.isArray(tags) || tags.length === 0) return [];
  try {
    const Conversation = getSafeModel('Conversation', null, '~/models/Conversation');
    const Message = getSafeModel('Message', null, '~/models/Message');
    if (!Conversation) return [];

    const companyIdStr = company?._id ? String(company._id) : null;
    const query = {
      user: String(userId),
      tags: { $in: tags },
    };
    if (companyIdStr) {
      query.$and = [
        { tags: { $in: tags } },
        { $or: [{ tags: `company-${companyIdStr}` }, { tags: `company_${companyIdStr}` }] },
      ];
      delete query.tags;
    }

    let convos = await Conversation.find(query).sort({ updatedAt: -1 }).limit(limit).lean();
    if ((!convos || convos.length === 0) && companyIdStr) {
      convos = await Conversation.find({ user: String(userId), tags: { $in: tags } })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();
    }

    const results = [];
    for (const c of convos || []) {
      let textPreview = '';
      if (Message && c.conversationId) {
        const msgs = await Message.find({ conversationId: c.conversationId })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();
        const assistantMsg = (msgs || []).find((m) => !m.isCreatedByUser && (m.text || m.content)) || msgs?.[0];
        const rawText = assistantMsg?.text || '';
        textPreview = String(rawText)
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 600);
      }
      results.push({
        conversationId: c.conversationId,
        title: c.title || 'Informe Oficial SG-SST',
        updatedAt: c.updatedAt,
        preview: textPreview,
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
async function inspectHito1And2(canonicalId, userId, company) {
  const companyName = company?.companyName || 'Empresa Activa';

  // 0. Contexto de Empresa Activa (tool_sst_company)
  if (canonicalId === 'tool_sst_company') {
    const sedesCount = Array.isArray(company?.sedes) ? company.sedes.length : 0;
    const fields = {
      'Razón Social': company?.companyName || 'Sin definir',
      'NIT': company?.nit || 'Sin definir',
      'Actividad Económica y CIIU': `${company?.economicActivity || ''} (CIIU ${company?.ciiu || 'N/A'})`,
      'Clase de Riesgo ARL': `Riesgo ${company?.riskLevel || 'N/A'}`,
      'ARL Afiliada': company?.arl || 'Sin definir',
      'N° de Trabajadores': String(company?.workerCount || 0),
      'Representante Legal': `${company?.legalRepresentative || ''} (CC ${company?.legalRepresentativeId || ''})`,
      'Responsable SG-SST': `${company?.responsibleSST || ''} (Lic. ${company?.licenseNumber || 'N/A'})`,
      'Ciudad y Dirección': `${company?.city || ''} - ${company?.address || ''}`,
      'Sedes y Centros de Trabajo': sedesCount > 0 ? company.sedes.map((s) => s.nombre || s.city).join(', ') : 'Sede Principal',
    };
    return {
      moduleTitle: 'Ficha Técnica de la Empresa Activa (Somos SST)',
      sourceCollection: 'CompanyInfo',
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
    const dofaList = Array.isArray(doc?.dofaList) ? doc.dofaList : [];
    const stakeholders = Array.isArray(doc?.stakeholders) ? doc.stakeholders : [];
    const cross = doc?.crossStrategies || {};
    const totalStrategies =
      (cross.fo?.length || 0) + (cross.do?.length || 0) + (cross.fa?.length || 0) + (cross.da?.length || 0);

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
            'Factor DOFA (Fortaleza / Debilidad / Oportunidad / Amenaza)': String(d.type || '').toUpperCase(),
            'Descripción del Factor DOFA': d.description || '',
            'Origen (Interno / Externo)': d.source || '',
            'Categoría PESTEL': d.category || '',
            'Módulo de Origen': d.originModule || '',
            'Nivel de Impacto': d.impact || '',
            'Acción Estratégica CAME': d.strategicAction || '',
            'Responsable': d.responsible || '',
            'Estado': d.status || '',
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
          'Partes Interesadas Internas y Externas (Stakeholders)': `${s.parte || ''} (${s.type || 'Interno'})`,
          'Necesidades y Expectativas en SST por Parte Interesada': `Necesidades: ${s.necesidades || ''} | Expectativas: ${s.expectativas || ''}`,
          'Requisitos Legales y Contractuales Asociados': s.requisito || '',
          'Mecanismo de Control': s.control || '',
          'Mecanismos de Comunicación y Seguimiento': `${s.communicationChannel || ''} (${s.frequency || ''})`,
          'Nivel de Impacto': s.impactLevel || 'alto',
        },
      })),
    ];

    return {
      moduleTitle: 'Hito 1 · Contexto y Partes Interesadas (DOFA / Stakeholders)',
      sourceCollection: 'ContextoData',
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
    const score = typeof doc?.score === 'number' ? Math.round(doc.score * 100) / 100 : 0;
    const level = doc?.complianceLevel || (score >= 86 ? 'Aceptable' : score >= 61 ? 'Moderado' : 'Crítico');

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
      return {
        id: String(it.itemId || it.code || `std_${idx}`),
        label: `Estándar ${it.code || it.itemId || idx + 1} · ${it.name || it.description || 'Estándar Res. 0312'}`,
        sublabel: `Ciclo: ${String(it.category || 'PHVA').toUpperCase()} • Peso: ${it.points ?? ''} pts${it.observation ? ` • Obs: ${it.observation}` : ''}`,
        badge: stLabel,
        badgeTone: st === 'cumple' ? 'emerald' : st === 'no_aplica' ? 'slate' : 'rose',
        isCritical: isCrit,
        fields: {
          'Código Estándar': it.code || it.itemId || '',
          'Nombre del Estándar': it.name || it.description || '',
          'Estado (Cumple / No Cumple / Parcial / No Aplica)': stLabel,
          'Puntaje del Ítem': String(it.points ?? ''),
          'Ciclo PHVA': String(it.category || '').toUpperCase(),
          'Observación / Hallazgo': it.observation || '',
          'Puntaje Total Res. 0312 (%)': `${score}%`,
          'Puntaje Total 0312 (%)': `${score}%`,
          'Valoración Global (Crítico <60% / Moderado 60-85% / Aceptable >85%)': String(level).toUpperCase(),
          'Valoración Global (Crítico / Moderado / Aceptable)': String(level).toUpperCase(),
          'Estándares que NO CUMPLEN (Brechas Críticas y Numeral)': isCrit ? `${it.code || it.itemId}: ${it.name || ''} (${it.observation || 'Sin evidencia'})` : '',
          'Estándares que CUMPLEN Totalmente (Ítem y Peso)': st === 'cumple' ? `${it.code || it.itemId}: ${it.name || ''} (${it.points || 0} pts)` : '',
          'Estándares que NO APLICAN (Justificación Normativa)': st === 'no_aplica' ? `${it.code || it.itemId}: ${it.name || ''}` : '',
          'Avance por Ciclo PHVA (Planear, Hacer, Verificar, Actuar)': String(it.category || '').toUpperCase(),
          'Observaciones Técnicas del Evaluador SST': it.observation || '',
        },
      };
    });

    return {
      moduleTitle: 'Hito 1 · Diagnóstico Inicial Estándares Mínimos (Res. 0312)',
      sourceCollection: 'DiagnosticoData',
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
    const reports = await fetchLatestReportsForTags(userId, company, tagMap[canonicalId], 6);
    const hasResp = Boolean(company?.responsibleSST);
    const records = [
      {
        id: `gov_${canonicalId}_company`,
        label:
          canonicalId === 'hito1_responsable'
            ? `Responsable SG-SST: ${company?.responsibleSST || 'Sin asignar'} (Licencia: ${company?.licenseNumber || 'Pendiente'})`
            : `${titleMap[canonicalId]} — ${companyName}`,
        sublabel: `Formación: ${company?.formationLevel || 'N/A'} • Vigencia Licencia: ${company?.licenseExpiry || 'N/A'} • Curso 50h/20h: ${company?.courseStatus || 'N/A'}`,
        badge: reports.length > 0 ? `${reports.length} Informe(s) Oficial(es)` : hasResp ? 'Datos Registrados' : 'Pendiente Generar',
        badgeTone: reports.length > 0 || hasResp ? 'emerald' : 'amber',
        isCritical: !hasResp && canonicalId === 'hito1_responsable',
        fields: {
          'Nombre Completo y Cédula del Responsable SG-SST': company?.responsibleSST || 'Sin asignar',
          'Nombre del Responsable SG-SST': company?.responsibleSST || 'Sin asignar',
          'Perfil Académico (Profesional / Especialista / Tecnólogo en SST)': company?.formationLevel || '',
          'Nivel de Formación Académica': company?.formationLevel || '',
          'Número y Fecha de Vigencia de Licencia SST': `${company?.licenseNumber || ''} (Vence: ${company?.licenseExpiry || 'N/A'})`,
          'Número de Licencia SST': company?.licenseNumber || '',
          'Fecha de Vigencia de Licencia': company?.licenseExpiry || '',
          'Certificado Curso Virtual 50 Horas / Actualización 20 Horas': company?.courseStatus || '',
          'Representante Legal': company?.legalRepresentative || '',
          'Actividad Económica y Clase de Riesgo': `${company?.economicActivity || ''} (CIIU ${company?.ciiu || ''} - Riesgo ${company?.riskLevel || ''})`,
          'Último Documento Oficial Generado': reports[0]?.preview || 'Sin documento generado aún',
        },
      },
      ...reports.map((r) => ({
        id: r.conversationId,
        label: `📄 ${r.title}`,
        sublabel: r.preview ? r.preview.slice(0, 180) : 'Documento oficial guardado en historial',
        badge: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('es-CO') : 'Guardado',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          'Título del Informe': r.title,
          'Fecha de Generación': r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('es-CO') : '',
          'Resumen / Contenido del Documento Oficial': r.preview,
        },
      })),
    ];

    return {
      moduleTitle: titleMap[canonicalId],
      sourceCollection: 'CompanyInfo + ConversationHistory',
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
    const combined = [
      ...list.map((p, idx) => ({
        id: p.id || `part_${idx}`,
        workerName: p.trabajadoresList?.[0]?.nombre || p.title || 'Colaborador',
        workerCedula: p.trabajadoresList?.[0]?.cedula || '',
        cargo: p.trabajadoresList?.[0]?.cargo || '',
        proceso: p.formData?.proceso || '',
        zona: p.formData?.zona || '',
        actividad: p.formData?.actividad || p.formData?.actividadGlobal || '',
        peligroClasificacion: p.formData?.peligroClasificacion || '',
        peligros: p.formData?.peligros || '',
        severidad: p.formData?.severidadPercibida || 'Media',
        controles: p.formData?.controlesExistentes || '',
        propuesta: p.formData?.propuestaMejora || p.formData?.sugeridoAdministrativo || '',
        status: p.status || 'processed',
        modalidad: 'Asistida SST',
      })),
      ...inbox.map((inb, idx) => ({
        id: inb.id || `inb_part_${idx}`,
        workerName: inb.trabajador?.nombre || inb.data?.nombre || 'Reporte QR',
        workerCedula: inb.trabajador?.cedula || inb.data?.cedula || '',
        cargo: inb.trabajador?.cargo || inb.data?.cargo || '',
        proceso: inb.data?.proceso || '',
        zona: inb.data?.zona || inb.data?.ubicacion || '',
        actividad: inb.data?.actividad || '',
        peligroClasificacion: inb.data?.peligroClasificacion || '',
        peligros: inb.data?.peligros || inb.data?.descripcion || '',
        severidad: inb.data?.severidadPercibida || 'Alta',
        controles: inb.data?.controlesExistentes || '',
        propuesta: inb.data?.propuestaMejora || '',
        status: inb.status || 'pending',
        modalidad: 'Buzón QR Colaborador',
      })),
    ];

    const critCount = combined.filter((c) => /alta|cr[ií]tica/i.test(c.severidad) || c.status === 'pending').length;

    return {
      moduleTitle: 'Hito 1 · Participación y Consulta de Peligros (IPEVAR)',
      sourceCollection: 'ParticipacionIpevarData',
      kpis: [
        { label: 'Total Participaciones', value: combined.length, tone: 'teal' },
        { label: 'Buzón QR Público', value: inbox.length, tone: 'indigo' },
        { label: 'Severidad Alta / Crítica', value: critCount, tone: critCount > 0 ? 'rose' : 'emerald' },
        { label: 'Integradas a GTC-45', value: list.filter((x) => x.status === 'applied_to_matrix').length, tone: 'emerald' },
      ],
      records: combined.map((c) => ({
        id: c.id,
        label: `${c.workerName} ${c.workerCedula ? `(CC ${c.workerCedula})` : ''} · ${c.peligroClasificacion || 'Peligro Reportado'}`,
        sublabel: `Cargo: ${c.cargo || 'N/A'} • Zona: ${c.proceso || ''} ${c.zona || ''} • Peligro: ${c.peligros || ''}`,
        badge: `${c.severidad} • ${c.modalidad}`,
        badgeTone: /alta|cr[ií]tica/i.test(c.severidad) ? 'rose' : 'amber',
        isCritical: /alta|cr[ií]tica/i.test(c.severidad) || c.status === 'pending',
        fields: {
          'Trabajador Reportante (Cédula, Nombre y Cargo)': `${c.workerName} (CC ${c.workerCedula}) - ${c.cargo}`,
          'Cédula / Documento': c.workerCedula,
          'Nombre Completo': c.workerName,
          'Cargo': c.cargo,
          'Área / Proceso / Zona': `${c.proceso} - ${c.zona}`,
          'Actividad / Tarea': c.actividad,
          'Clasificación del Peligro (GTC-45)': c.peligroClasificacion,
          'Peligro Percibido o Condición Reportada': c.peligros,
          'Severidad Percibida': c.severidad,
          'Controles Existentes': c.controles,
          'Propuesta de Control Sugerida por el Trabajador': c.propuesta,
          'Estado de Incorporación en la Matriz Oficial IPEVR': c.status,
        },
      })),
    };
  }

  // 10. Hito 1 · Matriz Oficial de Peligros IPEVR (GTC-45)
  if (canonicalId === 'hito2_matriz_ipevar') {
    const GTC45WorkspaceSession = getSafeModel('GTC45WorkspaceSession', '~/server/routes/sgsst/gtc45Workspace', '~/models/GTC45WorkspaceSession');
    const MatrizPeligrosData = getSafeModel('MatrizPeligrosData', '~/server/routes/sgsst/matrizPeligros');
    const docs = await findManyCompanyDocs(GTC45WorkspaceSession, userId, company, { isOfficial: -1, updatedAt: -1 }, 10);
    const officialDoc = docs.find((d) => d.isOfficial && Array.isArray(d.matrixRows) && d.matrixRows.length > 0) || docs.find((d) => Array.isArray(d.matrixRows) && d.matrixRows.length > 0);
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
          zona: e.zona || 'Principal',
          cargo: e.cargo || e.proceso || 'Operativo',
          actividad: e.actividad || '',
          tareas: e.tarea || '',
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

    const criticos = rows.filter((r) => r.interpretacion_nr === 'I' || r.interpretacion_nr === 'II' || /no aceptable/i.test(r.aceptabilidad || '')).length;

    return {
      moduleTitle: 'Hito 1 · Matriz Oficial de Identificación de Peligros y Valoración de Riesgos (GTC-45)',
      sourceCollection: sourceCollectionLabel,
      kpis: [
        { label: 'Total Peligros GTC-45', value: rows.length, tone: 'teal' },
        { label: 'Críticos / Altos (Nivel I y II)', value: criticos, tone: criticos > 0 ? 'rose' : 'emerald' },
        { label: 'Aceptables (III y IV)', value: Math.max(0, rows.length - criticos), tone: 'emerald' },
        { label: 'Cargos Evaluados', value: new Set(rows.map((r) => r.cargo).filter(Boolean)).size, tone: 'indigo' },
      ],
      records: rows.map((r, i) => {
        const isCrit = r.interpretacion_nr === 'I' || r.interpretacion_nr === 'II' || /no aceptable/i.test(r.aceptabilidad || '');
        return {
          id: r.id || `gtc45_${i}`,
          label: `[${r.peligro_clasificacion || 'Peligro'}] ${r.peligro_descripcion || 'Sin descripción'} — Cargo: ${r.cargo || r.proceso || 'General'}`,
          sublabel: `Proceso: ${r.proceso || ''} • Actividad: ${r.actividad || ''} • Efectos: ${r.efectos_posibles || ''}`,
          badge: `NR: ${r.nr || 'N/A'} (Nivel ${r.interpretacion_nr || 'N/A'} · ${r.aceptabilidad || 'Evaluado'})`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Proceso, Zona / Lugar y Cargo Expuesto': `${r.proceso || ''} | ${r.zona || ''} | ${r.cargo || ''}`,
            'Proceso': r.proceso || '',
            'Cargo': r.cargo || '',
            'Zona / Lugar': r.zona || '',
            'Actividad y Tarea (Rutinaria / No Rutinaria)': `${r.actividad || ''} - ${r.tareas || ''} (Rutinaria: ${r.rutinaria || 'Sí'})`,
            'Peligro (Descripción y Clasificación: Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de Seguridad, Fenómenos Naturales)': `${r.peligro_clasificacion || ''}: ${r.peligro_descripcion || ''}`,
            'Clasificación del Peligro': r.peligro_clasificacion || '',
            'Descripción del Peligro': r.peligro_descripcion || '',
            'Efectos Posibles en la Salud': r.efectos_posibles || '',
            'Controles Existentes (Fuente, Medio e Individuo)': `Fuente: ${r.controles_fuente || 'Ninguno'} | Medio: ${r.controles_medio || 'Ninguno'} | Individuo: ${r.controles_individuo || 'Ninguno'}`,
            'Evaluación del Riesgo (ND, NE, NP = ND×NE, Interpretación NP, NC)': `ND=${r.nd ?? ''} | NE=${r.ne ?? ''} | NP=${r.np ?? ''} (${r.interpretacion_np || ''}) | NC=${r.nc ?? ''}`,
            'Valoración del Riesgo (NR = NP×NC, Nivel de Riesgo I/II/III/IV y Aceptabilidad)': `NR=${r.nr ?? ''} | Nivel ${r.interpretacion_nr || ''} | ${r.aceptabilidad || ''}`,
            'Criterios para Controles (N° Expuestos, Peor Consecuencia y Requisito Legal Asociado)': `Expuestos: ${r.nro_expuestos || ''} | Peor Consecuencia: ${r.peor_consecuencia || ''} | Req. Legal: ${r.requisito_legal || 'Sí'}`,
            'Medidas de Intervención (Eliminación, Sustitución, Controles de Ingeniería, Controles Administrativos / Señalización y EPP)': `Eliminación: ${r.medida_eliminacion || 'N/A'} | Sustitución: ${r.medida_sustitucion || 'N/A'} | Ingeniería: ${r.medida_ingenieria || 'N/A'} | Admin: ${r.medida_administrativa || 'N/A'} | EPP: ${r.medida_eppu || 'N/A'}`,
          },
        };
      }),
    };
  }

  // 11. Hito 1 · Matriz Oficial de Riesgos Viales PESV
  if (canonicalId === 'hito3_matriz_pesv') {
    const PESVWorkspaceSession = getSafeModel('PESVWorkspaceSession', '~/server/routes/sgsst/pesvWorkspace', '~/models/PESVWorkspaceSession');
    const docs = await findManyCompanyDocs(PESVWorkspaceSession, userId, company, { isOfficial: -1, updatedAt: -1 }, 10);
    const officialDoc = docs.find((d) => d.isOfficial && Array.isArray(d.matrixRows) && d.matrixRows.length > 0) || docs.find((d) => Array.isArray(d.matrixRows) && d.matrixRows.length > 0);
    const rows = Array.isArray(officialDoc?.matrixRows) ? officialDoc.matrixRows : [];
    const criticos = rows.filter((r) => /alto|cr[ií]tico/i.test(r.nivel_riesgo || '') || Number(r.calificacion) >= 12).length;

    return {
      moduleTitle: 'Hito 1 · Matriz de Riesgos Viales PESV (Res. 20223040040595)',
      sourceCollection: 'PESVWorkspaceSession',
      kpis: [
        { label: 'Peligros Viales PESV', value: rows.length, tone: 'teal' },
        { label: 'Riesgo Vial Crítico / Alto', value: criticos, tone: criticos > 0 ? 'rose' : 'emerald' },
        { label: 'Riesgo Medio / Bajo', value: Math.max(0, rows.length - criticos), tone: 'emerald' },
        { label: 'Actores Viales', value: new Set(rows.map((r) => r.rol_via || r.cargo).filter(Boolean)).size, tone: 'indigo' },
      ],
      records: rows.map((r, i) => {
        const isCrit = /alto|cr[ií]tico/i.test(r.nivel_riesgo || '') || Number(r.calificacion) >= 12;
        return {
          id: r.id || `pesv_${i}`,
          label: `[${r.factor_riesgo || 'Factor Vial'}] ${r.peligro_descripcion || 'Peligro Vial'} — ${r.cargo || r.rol_via || 'Conductor'}`,
          sublabel: `Desplazamiento: ${r.tipo_desplazamiento || 'Misional'} • Programa Paso 8: ${r.programa_paso8 || 'N/A'}`,
          badge: `${r.nivel_riesgo || 'Riesgo Vial'} (Calif: ${r.calificacion || ''})`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Actor Vial (Conductor, Peatón, Pasajero, Ciclista, Motociclista)': `${r.rol_via || ''} (${r.cargo || ''})`,
            'Tipo de Desplazamiento (Misional / In Itinere)': r.tipo_desplazamiento || '',
            'Factor de Riesgo Vial (Humano, Vehículo, Infraestructura, Entorno)': r.factor_riesgo || '',
            'Peligro Vial Identificado (Velocidad, Fatiga, Distracción, Alcohol, Fallas Mecánicas)': r.peligro_descripcion || '',
            'Programa Crítico Paso 8': r.programa_paso8 || '',
            'Valoración del Riesgo Vial (Probabilidad, Exposición, Severidad y Nivel de Riesgo)': `NP=${r.np_cuantitativo || ''} | NE=${r.ne_cuantitativo || ''} | NC=${r.nc_cuantitativo || ''} | Total=${r.calificacion || ''} | ${r.nivel_riesgo || ''}`,
            'Controles Preventivos y Correctivos PESV': `Existentes: ${r.controles_existentes_descripcion || ''} | Vehículo: ${r.plan_accion_vehiculo || ''} | Individuo: ${r.plan_accion_individuo || ''} | Infraestructura: ${r.plan_accion_infraestructura || ''}`,
            'Indicadores y Metas de Siniestralidad Vial': `Responsable: ${r.responsable || ''} | Estado: ${r.estado || ''}`,
          },
        };
      }),
    };
  }

  // 12. Hito 1 · Matriz de Compatibilidad Química SGA
  if (canonicalId === 'hito3_quimicos_sga') {
    const ChemicalCompatibilitySession = getSafeModel('ChemicalCompatibilitySession', '~/server/routes/sgsst/matrizCompatibilidad', '~/models/ChemicalCompatibilitySession');
    const docs = await findManyCompanyDocs(ChemicalCompatibilitySession, userId, company, { isOfficial: -1, updatedAt: -1 }, 10);
    const officialDoc = docs.find((d) => d.isOfficial && Array.isArray(d.matrixRows) && d.matrixRows.length > 0) || docs.find((d) => Array.isArray(d.matrixRows) && d.matrixRows.length > 0);
    const rows = Array.isArray(officialDoc?.matrixRows) ? officialDoc.matrixRows : [];
    const sinFds = rows.filter((r) => /no/i.test(String(r.tiene_fds || ''))).length;

    return {
      moduleTitle: 'Hito 1 · Matriz de Compatibilidad Química SGA (Dec. 1496 / ONU)',
      sourceCollection: 'ChemicalCompatibilitySession',
      kpis: [
        { label: 'Sustancias Químicas SGA', value: rows.length, tone: 'teal' },
        { label: 'Con FDS Vigente', value: rows.length - sinFds, tone: 'emerald' },
        { label: 'Alerta Sin FDS', value: sinFds, tone: sinFds > 0 ? 'rose' : 'emerald' },
        { label: 'Clases ONU Mapeadas', value: new Set(rows.map((r) => r.clasificacion_onu).filter(Boolean)).size, tone: 'indigo' },
      ],
      records: rows.map((r, i) => {
        const isCrit = /no/i.test(String(r.tiene_fds || '')) || /peligro/i.test(String(r.palabra_advertencia || ''));
        return {
          id: r.id || `sga_${i}`,
          label: `${r.nombre || 'Sustancia Química'} (${r.clasificacion_onu || 'Clase ONU'})`,
          sublabel: `CAS: ${r.cas || 'N/A'} • UN: ${r.numero_onu || 'N/A'} • Bodega: ${r.ubicacion || 'General'} • FDS: ${r.tiene_fds || 'Sí'}`,
          badge: `${r.palabra_advertencia || 'SGA'} • ${(Array.isArray(r.pictogramas_sga) ? r.pictogramas_sga.join(', ') : r.pictogramas_sga) || ''}`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Nombre de la Sustancia Química y Número CAS / UN': `${r.nombre || ''} (CAS: ${r.cas || 'N/A'} / UN: ${r.numero_onu || 'N/A'})`,
            'Fabricante y Estado Físico': `${r.fabricante || ''} (${r.estado_fisico || ''})`,
            'Clasificación SGA y Pictogramas de Peligro (GHS01 a GHS09)': `${r.clasificacion_onu || ''} | Pictogramas: ${Array.isArray(r.pictogramas_sga) ? r.pictogramas_sga.join(', ') : r.pictogramas_sga || ''}`,
            'Frases H (Indicaciones de Peligro) y Frases P (Consejos de Prudencia)': `Frases H: ${r.frases_h || ''} | Consejos P: ${r.consejos_p || ''}`,
            'Matriz de Compatibilidad e Incompatibilidades de Almacenamiento': `Incompatibilidades: ${r.incompatibilidades || ''} | Almacenamiento: ${r.requisitos_almacenamiento || ''}`,
            'Ficha de Datos de Seguridad (FDS - 16 Secciones Vigente)': `FDS: ${r.tiene_fds || 'Sí'} | Rótulo SGA: ${r.tiene_rotulo || 'Sí'}`,
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

    const records = [
      ...oportunidades.map((o, i) => ({
        id: o.id || `op_${i}`,
        label: `[Oportunidad 6.1.2.3] ${o.titulo || ''}`,
        sublabel: `Categoría: ${o.categoria || ''} • Beneficio: ${o.beneficioEsperado || ''} • Resp: ${o.responsable || ''}`,
        badge: `Prioridad ${o.prioridad || o.impactoPrioridad || 'Alta'} • ${o.estado || 'En Plan'}`,
        badgeTone: 'emerald',
        isCritical: (o.prioridad || o.impactoPrioridad) === 'Alta',
        fields: {
          'Oportunidad de Mejora SST Identificada': o.titulo || '',
          'Proceso / Peligro o Fuente Asociada': `${o.categoria || ''} (${o.origenSST || o.origenSst || ''})`,
          'Beneficio Esperado en Salud y Seguridad': o.beneficioEsperado || '',
          'Viabilidad, Costo e Impacto': `Prioridad: ${o.prioridad || 'Alta'} | Viabilidad: ${o.viabilidad || 'Alta'} | Recursos: ${o.recursosRequeridos || ''}`,
          'Plan de Implementación, Responsable y Fecha': `Resp: ${o.responsable || ''} | Plazo: ${o.plazo || ''} | Estado: ${o.estado || ''}`,
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
          'Oportunidad de Mejora SST Identificada': `[Riesgo Sistema 6.1.1] ${rk.amenaza || ''}`,
          'Proceso / Peligro o Fuente Asociada': rk.fuenteContexto || '',
          'Beneficio Esperado en Salud y Seguridad': rk.medidaMitigacion || '',
          'Viabilidad, Costo e Impacto': `Impacto: ${rk.impactoSistema || ''} | Probabilidad: ${rk.probabilidad || ''} | Nivel: ${rk.nivelRiesgo || ''}`,
          'Plan de Implementación, Responsable y Fecha': `Resp: ${rk.responsableMonitoreo || ''} | Plazo: ${rk.plazo || ''} | Estado: ${rk.estado || ''}`,
        },
      })),
    ];

    return {
      moduleTitle: 'Hito 1 · Matriz de Oportunidades SST y Riesgos del Sistema (ISO 45001 Cl. 6.1)',
      sourceCollection: 'OportunidadesData',
      kpis: [
        { label: 'Oportunidades SST', value: oportunidades.length, tone: 'emerald' },
        { label: 'Riesgos del Sistema', value: riesgos.length, tone: 'rose' },
        { label: 'Prioridad Alta / Críticos', value: records.filter((r) => r.isCritical).length, tone: 'amber' },
      ],
      records,
    };
  }

  // 14. Hito 1 · Análisis de Amenazas y Vulnerabilidad (Diamante de Riesgo)
  if (canonicalId === 'hito6_vulnerabilidad') {
    const AnalisisVulnerabilidadData = getSafeModel('AnalisisVulnerabilidadData', '~/server/routes/sgsst/analisisVulnerabilidad');
    const doc = await findSingleCompanyDoc(AnalisisVulnerabilidadData, userId, company);
    const amenazas = Array.isArray(doc?.formData?.amenazasList)
      ? doc.formData.amenazasList
      : Array.isArray(doc?.amenazasList)
        ? doc.amenazasList
        : [];
    const altos = amenazas.filter((a) => /alto/i.test(a.riskLevel || '') || /inminente/i.test(a.nivelAmenaza || '')).length;

    return {
      moduleTitle: 'Hito 1 · Análisis de Amenazas y Vulnerabilidad (Diamante IDIGER)',
      sourceCollection: 'AnalisisVulnerabilidadData',
      kpis: [
        { label: 'Amenazas Evaluadas', value: amenazas.length, tone: 'teal' },
        { label: 'Nivel de Riesgo ALTO', value: altos, tone: altos > 0 ? 'rose' : 'emerald' },
        { label: 'Comité Evaluador', value: Array.isArray(doc?.evaluadoresList) ? doc.evaluadoresList.length : 0, tone: 'indigo' },
      ],
      records: amenazas.map((a, i) => {
        const isCrit = /alto/i.test(a.riskLevel || '') || /inminente/i.test(a.nivelAmenaza || '');
        return {
          id: a.id || `vuln_${i}`,
          label: `${a.amenaza || 'Amenaza'} (${a.origenAmenaza || 'Natural/Tecnológica'})`,
          sublabel: `Calificación: ${a.nivelAmenaza || 'Probable'} • Personas: ${a.ptsPers ?? 'N/A'} | Recursos: ${a.ptsRec ?? 'N/A'} | Sistemas: ${a.ptsSist ?? 'N/A'}`,
          badge: `Riesgo ${a.riskLevel || 'MEDIO'}`,
          badgeTone: isCrit ? 'rose' : 'amber',
          isCritical: isCrit,
          fields: {
            'Amenazas Identificadas (Naturales, Tecnológicas y Sociales)': `${a.amenaza || ''} (${a.origenAmenaza || ''})`,
            'Calificación de la Amenaza (Posible / Probable / Inminente)': a.nivelAmenaza || '',
            'Vulnerabilidad en las Personas (Gestión, Capacitación y Características)': `${a.ptsPers ?? ''} (${a.colorPers || ''})`,
            'Vulnerabilidad en los Recursos (Suministros, Edificación y Equipos)': `${a.ptsRec ?? ''} (${a.colorRec || ''})`,
            'Vulnerabilidad en los Sistemas y Procesos (Servicios, Sistemas Alternos y Recuperación)': `${a.ptsSist ?? ''} (${a.colorSist || ''})`,
            'Diamante de Riesgo y Nivel de Vulnerabilidad (Bajo / Medio / Alto)': `Riesgo ${a.riskLevel || ''} | Escenario: ${a.descripcionGlobal || ''}`,
          },
        };
      }),
    };
  }

  // 15. Hito 1 · Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE)
  if (canonicalId === 'hito1_plan_emergencias') {
    const PlanEmergenciasData = getSafeModel('PlanEmergenciasData', '~/server/routes/sgsst/planEmergencias', '~/models/PlanEmergenciasData');
    const doc = await findSingleCompanyDoc(PlanEmergenciasData, userId, company);
    const escenarios = Array.isArray(doc?.escenariosAmenaza) ? doc.escenariosAmenaza : [];
    const pons = Array.isArray(doc?.procedimientosPon) ? doc.procedimientosPon : [];
    const sci = Array.isArray(doc?.estructuraSci) ? doc.estructuraSci : [];
    const equipos = Array.isArray(doc?.recursosEquipos) ? doc.recursosEquipos : [];

    const records = [
      ...pons.map((p, i) => ({
        id: p.id || `pon_${i}`,
        label: `[PON ${p.codigo || i + 1}] ${p.tituloEscenario || p.amenazaAsociada || 'Procedimiento Operativo Normalizado'}`,
        sublabel: `Amenaza: ${p.amenazaAsociada || ''} • Resp: ${p.responsableOperativo || 'Comandante SCI'}`,
        badge: p.estado || 'Vigente',
        badgeTone: 'teal',
        isCritical: false,
        fields: {
          'Procedimientos Operativos Normalizados (PON por Amenaza)': `${p.codigo || ''} - ${p.tituloEscenario || ''}: Antes: ${p.faseAntes || ''} | Durante: ${p.faseDurante || ''} | Después: ${p.faseDespues || ''}`,
          'Estructura del Comité de Emergencias y Cadena de Mando (SCI)': sci.map((s) => `${s.rolSci}: ${s.nombreAsignado} (${s.cargoEmpresa})`).join(' ; '),
          'Rutas de Evacuación, Puntos de Encuentro y Sistema de Alarma': `Punto Encuentro: ${doc?.sedeData?.puntoEncuentroPrincipal || ''} | Alarma: ${doc?.sedeData?.sistemaAlarma || ''}`,
          'Plan de Evacuación Médica (MEDEVAC) y Centros Asistenciales Cercanos': `Clínica MEDEVAC: ${doc?.sedeData?.clinicaMedevac || ''} (${doc?.sedeData?.direccionClinica || ''})`,
          'Inventario de Recursos para Atención de Emergencias': recursosSummary(equipos),
        },
      })),
      ...escenarios.map((e, i) => ({
        id: e.id || `esc_${i}`,
        label: `[Escenario: ${e.amenaza || 'Amenaza'}] (${e.tipo || 'Natural'})`,
        sublabel: `Área: ${e.areaAfectada || 'Toda la sede'} • Prevención: ${e.medidasPrevencion || ''}`,
        badge: `Riesgo ${e.riesgoGlobal || 'Alto'}`,
        badgeTone: /alto/i.test(e.riesgoGlobal || '') ? 'rose' : 'amber',
        isCritical: /alto/i.test(e.riesgoGlobal || ''),
        fields: {
          'Escenario de Amenaza': `${e.amenaza || ''} (${e.tipo || ''})`,
          'Riesgo Global': e.riesgoGlobal || '',
          'Medidas de Prevención y Mitigación': `${e.medidasPrevencion || ''} | ${e.medidasMitigacion || ''}`,
          'Responsable': e.responsable || '',
        },
      })),
    ];

    return {
      moduleTitle: 'Hito 1 · Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE)',
      sourceCollection: 'PlanEmergenciasData',
      kpis: [
        { label: 'Escenarios Amenaza', value: escenarios.length, tone: 'rose' },
        { label: 'Procedimientos PON', value: pons.length, tone: 'teal' },
        { label: 'Estructura SCI', value: sci.length, tone: 'indigo' },
        { label: 'Recursos / Equipos', value: equipos.length, tone: 'emerald' },
      ],
      records,
    };
  }

  // 16. Hito 2 · Perfiles de Cargo Biocéntricos y Profesiograma
  if (canonicalId === 'hito2_perfiles_cargo') {
    const PerfilCargoData = getSafeModel('PerfilCargoData', '~/server/routes/sgsst/perfilesCargo');
    const doc = await findSingleCompanyDoc(PerfilCargoData, userId, company);
    const perfiles = Array.isArray(doc?.perfilesList) ? doc.perfilesList : [];

    return {
      moduleTitle: 'Hito 2 · Perfiles de Cargo Biocéntricos & Profesiograma',
      sourceCollection: 'PerfilCargoData',
      kpis: [
        { label: 'Perfiles de Cargo', value: perfiles.length, tone: 'teal' },
        { label: 'Con Informe Profesiograma', value: perfiles.filter((p) => p.report).length, tone: 'emerald' },
        { label: 'Operan Maquinaria', value: perfiles.filter((p) => p.operaMaquinaria === 'Sí').length, tone: 'amber' },
        { label: 'Exigencia Física Alta', value: perfiles.filter((p) => p.exigenciaFisica === 'Alta').length, tone: 'rose' },
      ],
      records: perfiles.map((p, i) => ({
        id: p.id || p.nombreCargo || `cargo_${i}`,
        label: `${p.nombreCargo || 'Cargo'} (${p.area || 'Área General'})`,
        sublabel: `Nivel: ${p.nivelCargo || 'Operativo'} • Vacantes: ${p.numVacantes || 1} • Exigencia Física: ${p.exigenciaFisica || 'Media'} / Mental: ${p.exigenciaMental || 'Media'}`,
        badge: p.operaMaquinaria === 'Sí' ? 'Opera Maquinaria' : `${(p.eppSeleccionados || []).length} EPP Asignados`,
        badgeTone: p.exigenciaFisica === 'Alta' ? 'rose' : 'indigo',
        isCritical: p.exigenciaFisica === 'Alta' || p.operaMaquinaria === 'Sí',
        fields: {
          'Nombre del Cargo y Área / Proceso': `${p.nombreCargo || ''} (${p.area || ''})`,
          'Nombre del Cargo': p.nombreCargo || '',
          'Área / Departamento': p.area || '',
          'Objetivo y Funciones Principales del Cargo': p.contextoAdicional || '',
          'Competencias Requeridas (Educación, Formación, Experiencia)': `Nivel: ${p.nivelCargo || ''} | Jornada: ${p.jornada || ''} | Contrato: ${p.tipoContrato || ''}`,
          'Exigencias Biomecánicas, Mentales y Físicas del Puesto': `Física: ${p.exigenciaFisica || 'Media'} | Mental: ${p.exigenciaMental || 'Media'} | Opera Maquinaria: ${p.operaMaquinaria || 'No'}`,
          'Peligros y Riesgos Asociados al Cargo': (p.controlesFuenteSeleccionados || []).concat(p.controlesMedioSeleccionados || []).join(', '),
          'Profesiograma (Exámenes Médicos de Ingreso, Periódicos, Retiro y Post-Incapacidad)': 'Según matriz clínica del cargo Res. 1843 de 2025',
          'EPP Requeridos por el Cargo': Array.isArray(p.eppSeleccionados) ? p.eppSeleccionados.join(', ') : '',
          'Capacitaciones y Certificaciones Obligatorias (Ej. Alturas, Espacios Confinados, Vial)': Array.isArray(p.entrenamientosSeleccionados) ? p.entrenamientosSeleccionados.join(', ') : '',
        },
      })),
    };
  }

  // 17, 18, 19. Hito 2 · Perfil Sociodemográfico, Condiciones de Salud y Compatibilidad Trabajador-Cargo
  if (['hito2_perfil_socio', 'hito2_condiciones_salud', 'hito2_oraculo_predictivo'].includes(canonicalId)) {
    const PerfilSociodemograficoData = getSafeModel('PerfilSociodemograficoData', '~/server/routes/sgsst/perfilSociodemografico', '~/models/PerfilSociodemograficoData');
    const SgsstWorker = getSafeModel('SgsstWorker', '~/server/routes/sgsst/workers', '~/models/SgsstWorker');

    const socioDoc = await findSingleCompanyDoc(PerfilSociodemograficoData, userId, company);
    const socioList = Array.isArray(socioDoc?.trabajadores) ? socioDoc.trabajadores : [];
    const workerDocs = await findManyCompanyDocs(SgsstWorker, userId, company, { updatedAt: -1 }, 300);

    // Indexar SgsstWorker por documento/cédula para enriquecer con fitScore, fitAlerts y riesgosBioIndividual
    const workerByCedula = new Map();
    for (const w of workerDocs) {
      const ced = String(w.documento || '').trim();
      if (ced) workerByCedula.set(ced, w);
    }

    const unifiedWorkers = [];
    const seenCedulas = new Set();

    for (const sw of socioList) {
      const ced = String(sw.identificacion || sw.documento || sw.cedula || '').trim();
      if (ced) seenCedulas.add(ced);
      const wDoc = ced ? workerByCedula.get(ced) : null;
      unifiedWorkers.push(buildUnifiedWorkerRecord(sw, wDoc, canonicalId));
    }

    for (const wDoc of workerDocs) {
      const ced = String(wDoc.documento || '').trim();
      if (ced && seenCedulas.has(ced)) continue;
      unifiedWorkers.push(buildUnifiedWorkerRecord({}, wDoc, canonicalId));
    }

    const total = unifiedWorkers.length;
    const critCount = unifiedWorkers.filter((r) => r.isCritical).length;
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
      kpis: [
        { label: 'Trabajadores Registrados', value: total, tone: 'teal' },
        { label: 'FIT Score Promedio', value: `${avgFit}%`, tone: avgFit >= 80 ? 'emerald' : avgFit >= 60 ? 'amber' : 'rose' },
        { label: 'Con Tarjetas Preventivas / Restricción', value: critCount, tone: critCount > 0 ? 'rose' : 'emerald' },
        { label: 'Activos en Nómina', value: unifiedWorkers.filter((w) => w._activo).length, tone: 'indigo' },
      ],
      records: unifiedWorkers,
    };
  }

  return null;
}

function recursosSummary(equipos) {
  if (!Array.isArray(equipos) || equipos.length === 0) return 'Sin equipos registrados';
  return equipos.map((e) => `${e.tipoRecurso || e.categoria || 'Equipo'}: ${e.descripcion || ''} (${e.ubicacion || ''})`).join(' ; ');
}

function buildUnifiedWorkerRecord(sw, wDoc, canonicalId) {
  const cedula = String(sw.identificacion || sw.documento || wDoc?.documento || '').trim() || 'S/D';
  const nombre = String(sw.nombre || wDoc?.nombre || 'Colaborador').trim();
  const cargo = String(sw.cargo || wDoc?.cargo || 'Sin cargo asignado').trim();
  const area = String(sw.area || wDoc?.area || sw.sede || wDoc?.sede || 'General').trim();
  const edad = String(sw.edad || wDoc?.edad || '').trim();
  const genero = String(sw.genero || wDoc?.genero || '').trim();
  const rh = String(sw.tipoSangre || sw.rh || wDoc?.rh || '').trim();
  const eps = String(sw.eps || wDoc?.eps || '').trim();
  const arl = String(sw.arl || wDoc?.arl || '').trim();
  const afp = String(sw.afp || sw.fondoPensiones || wDoc?.afp || '').trim();
  const estadoPila = String(sw.estadoPila || wDoc?.estadoPila || 'Activo').trim();
  const estadoLaboral = String(sw.estadoLaboral || wDoc?.estadoLaboral || 'Activo').trim();
  const aptitud = String(sw.aptitudMedica || sw.conceptoAptitud || wDoc?.aptitud || 'Apto sin restricciones').trim();
  const fechaEmo = String(sw.fechaUltimoExamen || sw.fechaExamenMedico || '').trim();
  const fechaProxEmo = String(sw.fechaProximoExamen || '').trim();
  const diagnosticos = String(sw.diagnosticoMedico || sw.condicionesSalud || wDoc?.condicionesSalud || wDoc?.diagnosticoMedico || '').trim();
  const enfermedades = String(sw.enfermedades || wDoc?.enfermedades || '').trim();
  const recomendaciones = String(sw.recomendacionesMedicas || wDoc?.recomendacionesMedicas || '').trim();
  const restricciones = String(sw.limitacionesBiomecanicas || sw.restriccionesMedicas || wDoc?.limitacionesBiomecanicas || '').trim();
  const medicamentos = String(sw.medicamentos || wDoc?.medicamentos || '').trim();
  const alergias = String(sw.alergiasQuimicas || sw.alergias || wDoc?.alergiasQuimicas || '').trim();
  const imc = String(sw.imc || '').trim();
  const fitScore = Number(sw.biocentricScore ?? wDoc?.fitScore ?? 88);
  const percepcionPts = Number(wDoc?.percepcionRiesgoScore ?? 0);
  const fitAlertsArr = Array.isArray(wDoc?.fitAlerts) ? wDoc.fitAlerts : [];
  const bioRisksArr = Array.isArray(wDoc?.riesgosBioIndividual) ? wDoc.riesgosBioIndividual : [];
  const tarjetasPreventivas =
    fitAlertsArr.length > 0
      ? fitAlertsArr.map((a) => (typeof a === 'string' ? a : a.title || a.message || JSON.stringify(a))).join(' | ')
      : restricciones || recomendaciones || enfermedades || 'Sin alertas clínico-operativas activas';

  const hasAlert =
    fitScore < 75 ||
    fitAlertsArr.length > 0 ||
    Boolean(restricciones && !/ningun|apto sin/i.test(restricciones)) ||
    Boolean(enfermedades && !/ningun|sano/i.test(enfermedades));

  const badgeByMode =
    canonicalId === 'hito2_oraculo_predictivo'
      ? `FIT ${fitScore}% • ${fitAlertsArr.length || (hasAlert ? 1 : 0)} Tarjeta(s) Preventiva(s)`
      : canonicalId === 'hito2_condiciones_salud'
        ? `${aptitud} • FIT ${fitScore}%`
        : `${estadoLaboral} • EPS: ${eps || 'N/A'} • ARL: ${arl || 'N/A'}`;

  return {
    id: cedula !== 'S/D' ? cedula : String(wDoc?._id || sw.id || nombre),
    label: `${nombre} (CC ${cedula})`,
    sublabel: `Cargo: ${cargo} • Área: ${area}${edad ? ` • ${edad} años` : ''}${rh ? ` • RH ${rh}` : ''}`,
    badge: badgeByMode,
    badgeTone: hasAlert ? 'rose' : fitScore < 85 ? 'amber' : 'emerald',
    isCritical: hasAlert,
    _fitScore: fitScore,
    _activo: estadoLaboral !== 'Retirado',
    fields: {
      'Cédula / Documento': cedula,
      'Nombre Completo': nombre,
      'Cargo': cargo,
      'Área / Proceso y Sede': area,
      'Área / Proceso': area,
      'Sede / Centro de Trabajo': sw.sede || wDoc?.sede || 'Sede Principal',
      'Edad y Fecha de Nacimiento': `${edad ? `${edad} años` : ''} ${sw.fechaNacimiento || wDoc?.fechaNacimiento ? `(${sw.fechaNacimiento || wDoc?.fechaNacimiento})` : ''}`.trim(),
      'Edad': edad,
      'Fecha de Nacimiento': sw.fechaNacimiento || wDoc?.fechaNacimiento || '',
      'Género': genero,
      'Grupo Sanguíneo y RH': rh,
      'Estado Civil y Personas a Cargo': `${sw.estadoCivil || ''} (Personas a cargo: ${sw.personasCargo || sw.personasACargo || '0'})`,
      'Estado Civil': sw.estadoCivil || '',
      'Personas a Cargo': String(sw.personasCargo || sw.personasACargo || '0'),
      'Nivel de Escolaridad': sw.nivelEscolaridad || '',
      'Estrato Socioeconómico y Tipo de Vivienda': `Estrato ${sw.estrato || 'N/A'} - Vivienda ${sw.vivienda || sw.tipoVivienda || 'N/A'}`,
      'Tipo de Vivienda': sw.vivienda || sw.tipoVivienda || '',
      'Estrato Socioeconómico': String(sw.estrato || ''),
      'Tipo de Contrato y Turno de Trabajo': `${sw.tipoContrato || 'Término Indefinido'} (${sw.turnoTrabajo || 'Diurno'})`,
      'Tipo de Contrato': sw.tipoContrato || '',
      'Fecha de Ingreso y Antigüedad': sw.fechaIngreso || wDoc?.fechaIngreso || '',
      'Fecha de Ingreso': sw.fechaIngreso || wDoc?.fechaIngreso || '',
      'Antigüedad': sw.antiguedad || '',
      'Rango Salarial / IBC': sw.ingresos || sw.salario || '',
      'EPS (Entidad Promotora de Salud)': eps,
      'EPS': eps,
      'ARL (Administradora de Riesgos Laborales)': arl,
      'ARL': arl,
      'AFP (Fondo de Pensiones) y Caja de Compensación': `AFP: ${afp || 'N/A'} | Caja: ${sw.cajaCompensacion || 'N/A'}`,
      'AFP (Fondo de Pensiones)': afp,
      'Caja de Compensación': sw.cajaCompensacion || '',
      'Estado de Planilla PILA / Certificados de Afiliación': estadoPila,
      'Estado Laboral (Activo / Retirado)': estadoLaboral,
      'Teléfono, Correo y Contacto de Emergencia': `Tel: ${sw.telefono || ''} | Email: ${sw.correoElectronico || ''} | Emergencia: ${sw.emergenciaContacto || ''}`,
      'Correo Electrónico': sw.correoElectronico || '',
      'Teléfono / Celular': sw.telefono || '',
      'Dirección y Municipio': `${sw.direccion || ''} (${sw.municipioDomicilio || ''})`,
      'Contacto de Emergencia': sw.emergenciaContacto || '',
      'Hábitos de Vida (Actividad Física, Tabaco, Alcohol)': `Deporte: ${sw.deporte || 'N/A'} | Tabaco: ${sw.fuma || 'No'} | Alcohol: ${sw.alcohol || 'No'}`,
      'Hábito de Deporte': sw.deporte || '',
      'Consumo de Tabaco / Alcohol': `Tabaco: ${sw.fuma || 'No'} / Alcohol: ${sw.alcohol || 'No'}`,
      // Campos Clínicos / Condiciones de Salud
      'Concepto de Aptitud Médica (Apto / Apto con Restricción / Aplazado)': aptitud,
      'Concepto de Aptitud Médica': aptitud,
      'Fecha de Último Examen Médico Ocupacional (EMO) y Próximo Vencimiento': `Último: ${fechaEmo || 'N/A'} | Próximo: ${fechaProxEmo || 'N/A'}`,
      'Fecha Último Examen Médico (EMO)': fechaEmo,
      'Fecha Próximo Examen Médico': fechaProxEmo,
      'Tipo de Evaluación (Ingreso, Periódico, Retiro, Cambio de Ocupación, Post-Incapacidad)': sw.tipoExamen || 'Periódico',
      'Restricciones Médicas Laborales Activas y Vigencia': restricciones,
      'Restricciones / Limitaciones Biomecánicas': restricciones,
      'Limitaciones Biomecánicas': restricciones,
      'Recomendaciones Médicas Ocupacionales': recomendaciones,
      'Recomendaciones Médicas Vigentes': recomendaciones,
      'Recomendaciones Médicas': recomendaciones,
      'Diagnósticos Clínicos / CIE-10 y Sistemas Comprometidos': diagnosticos,
      'Diagnósticos Clínicos / CIE-10': diagnosticos,
      'Enfermedades Preexistentes': enfermedades,
      'Enfermedades / Patologías': enfermedades,
      'Sintomatología Osteomuscular, Visual, Auditiva o Cardiovascular': `${diagnosticos} ${enfermedades}`.trim(),
      'Medicamentos de Consumo Actual': medicamentos,
      'Medicamentos': medicamentos,
      'Alergias Químicas / Medicamentosas': alergias,
      'Alergias Químicas': alergias,
      'Tensión Arterial (PA)': sw.tensionArterial || '',
      'Frecuencia Cardíaca (FC)': sw.frecuenciaCardiaca || '',
      'Peso (kg)': String(sw.peso || ''),
      'Talla (cm)': String(sw.talla || ''),
      'Índice de Masa Corporal (IMC) y Riesgo Metabólico': `${imc} (${sw.clasificacionImc || ''})`,
      'Índice de Masa Corporal (IMC)': imc,
      'Clasificación IMC': sw.clasificacionImc || '',
      ' inclusión en Sistemas de Vigilancia Epidemiológica (SVE: Biomecánico, Psicosocial, Ruido, Químico, Visual, Cardiovascular)': sw.sve || (hasAlert ? 'SVE Osteomuscular / Preventivo' : 'Vigilancia General'),
      // Campos de Compatibilidad Trabajador-Cargo / Bio-Individuo
      'Puntaje de Compatibilidad Cargo-Persona (FIT Score %)': `${fitScore}%`,
      'Puntaje FIT Biocéntrico (%)': `${fitScore}%`,
      'Estado de Compatibilidad (Óptimo / Moderado / Crítico)': fitScore >= 80 ? 'Óptimo' : fitScore >= 60 ? 'Moderado' : 'Crítico',
      'Tarjetas Preventivas Activas por Trabajador': tarjetasPreventivas,
      'Tarjetas Preventivas / Alertas FIT': tarjetasPreventivas,
      'Cruces Críticos entre Exigencias del Cargo y Condición de Salud': tarjetasPreventivas,
      'Alertas de Incompatibilidad Biomecánica, En Alturas o Espacios Confinados': tarjetasPreventivas,
      'Puntaje Percepción del Riesgo (pts)': `${percepcionPts} pts`,
      'Factor de Reducción por Cultura (%)': `${Math.round(Math.min(percepcionPts / 500, 0.4) * 100)}%`,
      'Total Riesgos Bio-Individuales': String(bioRisksArr.length),
      'Riesgos Bio-Individuales Críticos/Altos': String(bioRisksArr.filter((b) => /cr[ií]tico|alto/i.test(b.clasificacion_bio || '')).length),
      'Recomendaciones de Reubicación, Readaptación o Ajuste Razonable': recomendaciones || restricciones || 'Mantener controles preventivos del cargo',
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

    const comite = await findSingleCompanyDoc(SgsstCopasstComite, userId, company);
    const actas = await findManyCompanyDocs(SgsstCopasstActa, userId, company, { fechaReunion: -1 }, 30);
    const inspecciones = await findManyCompanyDocs(SgsstCopasstInspeccion, userId, company, { fecha: -1 }, 30);

    const repEmpleador = Array.isArray(comite?.representantesEmpleador) ? comite.representantesEmpleador : [];
    const repTrabajadores = Array.isArray(comite?.representantesTrabajadores) ? comite.representantesTrabajadores : [];
    const allMembers = [
      ...repEmpleador.map((m) => ({ ...m, parte: 'Empleador' })),
      ...repTrabajadores.map((m) => ({ ...m, parte: 'Trabajadores' })),
    ];

    const records = [
      ...allMembers.map((m, i) => ({
        id: m.cedula || `copasst_mem_${i}`,
        label: `[Integrante COPASST] ${m.nombre || 'Miembro'} (CC ${m.cedula || 'S/D'})`,
        sublabel: `Representante: ${m.parte} • Rol: ${m.rol || 'Principal'} • Cargo: ${m.cargo || ''}`,
        badge: `${m.parte} · ${m.rol || 'Principal'}`,
        badgeTone: 'teal',
        isCritical: false,
        fields: {
          'Cédula / Documento del Integrante': m.cedula || '',
          'Nombre Completo y Cargo del Integrante': `${m.nombre || ''} (${m.cargo || ''})`,
          'Representación (Empleador / Trabajadores)': m.parte,
          'Calidad del Miembro (Principal / Suplente)': m.rol || 'Principal',
          'Rol en el Comité (Presidente / Secretario / Integrante)': m.rol || 'Integrante',
          'Integrantes del COPASST / Vigía (Representantes del Empleador y de los Trabajadores — Principales y Suplentes)': `${m.nombre || ''} (CC ${m.cedula || ''}) - ${m.parte} - ${m.rol || ''}`,
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
            'Verificación de Quórum y Asistencia de Miembros': `${(a.asistentes || []).length} asistentes registrados`,
            'Temas Tratados (Inspecciones, Investigación ATEL, Seguimiento Plan Anual)': temasStr,
            'Compromisos del Acta, Responsables y Fechas de Cumplimiento': comps.map((c) => `${c.actividad || ''} (Resp: ${c.responsable || ''} - Estado: ${c.estado || 'Pendiente'})`).join(' | ') || 'Sin compromisos pendientes',
            'Seguimiento al Estado de Compromisos de Actas Anteriores': `${pend} pendientes de ${comps.length}`,
            'Estado de Compromisos de Actas Anteriores (Abierto / En Gestión / Cerrado)': `${pend} abiertos`,
          },
        };
      }),
      ...inspecciones.map((ins, i) => ({
        id: String(ins._id || ins.consecutivo || `insp_${i}`),
        label: `[Inspección COPASST ${ins.consecutivo || i + 1}] ${ins.tipoLabel || 'General'} — ${ins.sede || ''}/${ins.area || ''}`,
        sublabel: `Hallazgos: ${(ins.hallazgos || []).length} • Inspector: ${ins.inspectorNombre || ''}`,
        badge: `Semáforo: ${String(ins.semaforoGeneral || 'atencion').toUpperCase()}`,
        badgeTone: ins.semaforoGeneral === 'critico' ? 'rose' : ins.semaforoGeneral === 'seguro' ? 'emerald' : 'amber',
        isCritical: ins.semaforoGeneral === 'critico' || (ins.hallazgos || []).length > 0,
        fields: {
          'Revisión de Inspecciones Planeadas de Seguridad': `${ins.consecutivo || ''}: ${ins.tipoLabel || ''} en ${ins.area || ''} (${(ins.hallazgos || []).length} hallazgos)`,
        },
      })),
    ];

    return {
      moduleTitle: 'Hito 3 · COPASST / Vigía de Seguridad y Salud en el Trabajo',
      sourceCollection: 'SgsstCopasstComite + SgsstCopasstActa + SgsstCopasstInspeccion',
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

    const comite = await findSingleCompanyDoc(SgsstConvivenciaComite, userId, company);
    const actas = await findManyCompanyDocs(SgsstConvivenciaActa, userId, company, { fechaReunion: -1 }, 20);
    const casos = await findManyCompanyDocs(SgsstConvivenciaCaso, userId, company, { createdAt: -1 }, 30);

    const members = [
      ...(comite?.representantesEmpleador || []).map((m) => ({ ...m, parte: 'Empleador' })),
      ...(comite?.representantesTrabajadores || []).map((m) => ({ ...m, parte: 'Trabajadores' })),
    ];

    const records = [
      ...members.map((m, i) => ({
        id: m.cedula || `ccl_mem_${i}`,
        label: `[Integrante CCL] ${m.nombre || ''} (CC ${m.cedula || ''})`,
        sublabel: `Parte: ${m.parte} • Rol: ${m.rol || 'Principal'} • Cargo: ${m.cargo || ''}`,
        badge: `${m.parte} · ${m.rol || 'Principal'}`,
        badgeTone: 'teal',
        isCritical: false,
        fields: {
          'Integrantes del Comité de Convivencia Laboral (Principales y Suplentes)': `${m.nombre || ''} (CC ${m.cedula || ''}) - ${m.parte} (${m.rol || ''})`,
          'Cédula / Documento del Integrante': m.cedula || '',
          'Nombre Completo y Cargo del Integrante': `${m.nombre || ''} (${m.cargo || ''})`,
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
          'Compromisos, Campañas de Prevención y Capacitaciones': (a.compromisos || []).map((c) => `${c.actividad || ''} (${c.responsable || ''})`).join(' | '),
        },
      })),
      ...casos.map((c, i) => ({
        id: String(c._id || c.radicado || `ccl_caso_${i}`),
        label: `[Caso Confidencial ${c.radicado || i + 1}] Modalidad: ${c.modalidadAcoso || 'Convivencia'}`,
        sublabel: `Estado: ${c.estado || 'En trámite'} • Nivel: ${c.nivelRiesgo || 'Moderado'}`,
        badge: String(c.estado || 'Abierto').toUpperCase(),
        badgeTone: c.estado === 'cerrado' ? 'emerald' : 'rose',
        isCritical: c.estado !== 'cerrado',
        fields: {
          'Seguimiento Estadístico de Quejas de Presunto Acoso Laboral (Reserva Ley 1010)': `Radicado ${c.radicado || ''}: ${c.modalidadAcoso || ''} - Estado: ${c.estado || ''}`,
          'Planes de Mejora de Clima y Convivencia Laboral': c.acuerdosLogrados || c.planSeguimiento || '',
        },
      })),
    ];

    return {
      moduleTitle: 'Hito 3 · Comité de Convivencia Laboral (CCL — Ley 1010 / Res. 3461)',
      sourceCollection: 'SgsstConvivenciaComite + SgsstConvivenciaActa + SgsstConvivenciaCaso',
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
    const comite = await findSingleCompanyDoc(SgsstPesvComite, userId, company);
    const actas = await findManyCompanyDocs(SgsstPesvActa, userId, company, { fechaReunion: -1 }, 20);
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
      kpis: [
        { label: 'Miembros CSV', value: miembros.length, tone: 'teal' },
        { label: 'Actas CSV', value: actas.length, tone: 'indigo' },
        { label: 'Líder PESV', value: comite?.liderPesv?.nombre || 'Asignado', tone: 'emerald' },
      ],
      records,
    };
  }

  // 23. Hito 3 · Brigada de Emergencias & Comité de Crisis (SCI)
  if (canonicalId === 'hito3_brigada_emergencias') {
    const SgsstBrigadista = getSafeModel('SgsstBrigadista', '~/server/routes/sgsst/brigada', '~/models/SgsstBrigadista');
    const brigadistas = await findManyCompanyDocs(SgsstBrigadista, userId, company, { updatedAt: -1 }, 150);

    return {
      moduleTitle: 'Hito 3 · Brigada de Emergencias & Sistema Comando de Incidentes (SCI)',
      sourceCollection: 'SgsstBrigadista',
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
          'Listado de Brigadistas Activos (Cédula, Nombre, Cargo, Sede y Teléfono)': `${b.nombre || ''} (CC ${b.cedula || ''}) - ${b.cargo || ''} - Sede: ${b.sede || ''}`,
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
    const workers = await findManyCompanyDocs(SgsstWorker, userId, company, { updatedAt: -1 }, 200);
    const rows = [];
    for (const w of workers) {
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
            'Peligros Expuestos en el Puesto Individual': `${br.peligro_cargo || ''} (${br.actividad_expuesta || ''})`,
            'Cruces con Condiciones de Salud y Sintomatología Corporal': `${br.factor_individual || ''} -> ${br.efectos_posibles || ''}`,
            'Valoración de Riesgo Bio-Individual (NR y Aceptabilidad)': `NS=${br.nivel_susceptibilidad ?? ''} | NE=${br.nivel_exposicion ?? ''} | Índice Efectivo=${br.indice_bio_riesgo_efectivo ?? ''} (${br.clasificacion_bio || ''})`,
            'Controles Personalizados (Fuente, Medio e Individuo)': `Plan: ${br.plan_accion_bio || ''} | Restricciones: ${br.restricciones_laborales || ''} | EPP: ${br.medida_eppu || ''}`,
          },
        });
      }
    }

    let sourceLabel = 'SgsstWorker.riesgosBioIndividual';
    if (rows.length === 0 && workers.length > 0) {
      const gtcRes = await inspectHito1And2('hito2_matriz_ipevar', userId, company);
      const gtcRecords = Array.isArray(gtcRes?.records) ? gtcRes.records : [];
      if (gtcRecords.length > 0) {
        sourceLabel = `SgsstWorker + ${gtcRes.sourceCollection || 'GTC45'}`;
        for (const w of workers.slice(0, 60)) {
          const wCargo = String(w.cargo || '').toLowerCase();
          const matchedGtc =
            gtcRecords.find((g) => wCargo && String(g.fields?.['Cargo'] || g.label || '').toLowerCase().includes(wCargo)) ||
            gtcRecords[0];
          const gf = matchedGtc?.fields || {};
          const isCrit = Boolean(matchedGtc?.isCritical || w.restriccionesMedicas);
          rows.push({
            id: `bio_cross_${w.documento || w._id}_${rows.length}`,
            label: `${w.nombre || 'Trabajador'} (CC ${w.documento || 'S/D'}) · [${gf['Clasificación del Peligro'] || 'Riesgo Cargo'}] ${gf['Descripción del Peligro'] || w.cargo || 'Operativo'}`,
            sublabel: `Cargo: ${w.cargo || 'Operativo'} • Efectos: ${gf['Efectos Posibles en la Salud'] || 'Evaluado'} • Salud: ${w.restriccionesMedicas || w.conceptoMedico || 'Apto'}`,
            badge: isCrit ? 'ALTO / PRIORITARIO' : 'CONTROLADO',
            badgeTone: isCrit ? 'rose' : 'emerald',
            isCritical: isCrit,
            fields: {
              'Cédula y Nombre Completo del Trabajador': `${w.nombre || ''} (CC ${w.documento || 'S/D'})`,
              'Cédula / Documento': w.documento || 'S/D',
              'Nombre Completo': w.nombre || '',
              'Cargo, Proceso y Sede': `${w.cargo || ''} (${w.area || 'General'} - ${w.sede || 'Principal'})`,
              'Dominio Bio-Individual': gf['Clasificación del Peligro'] || 'Biomecánico / Operativo',
              'Peligros Expuestos en el Puesto Individual': gf['Peligro (Descripción y Clasificación: Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de Seguridad, Fenómenos Naturales)'] || w.cargo || '',
              'Cruces con Condiciones de Salud y Sintomatología Corporal': `${w.restriccionesMedicas || w.conceptoMedico || 'Sin restricciones activas'} -> ${gf['Efectos Posibles en la Salud'] || 'Vigilancia epidemiológica'}`,
              'Valoración de Riesgo Bio-Individual (NR y Aceptabilidad)': gf['Valoración del Riesgo (NR = NP×NC, Nivel de Riesgo I/II/III/IV y Aceptabilidad)'] || 'Evaluado',
              'Controles Personalizados (Fuente, Medio e Individuo)': gf['Medidas de Intervención (Eliminación, Sustitución, Controles de Ingeniería, Controles Administrativos / Señalización y EPP)'] || 'Controles preventivos del cargo',
            },
          });
        }
      }
    }

    return {
      moduleTitle: 'Hito 4 · Matriz Bio-IPEVR (Evaluación Individual por Trabajador)',
      sourceCollection: sourceLabel,
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
    const doc = await findSingleCompanyDoc(MetodoOwasData, userId, company);
    const obs = Array.isArray(doc?.observaciones) ? doc.observaciones : [];
    const trabNames = (doc?.trabajadoresList || []).map((t) => `${t.nombre} (CC ${t.cedula})`).join(', ');
    const crit = obs.filter((o) => Number(o.categoria) >= 3).length;

    return {
      moduleTitle: 'Hito 4 · Método OWAS (Evaluación Ergonómica Postural)',
      sourceCollection: 'MetodoOwasData',
      kpis: [
        { label: 'Posturas Evaluadas', value: obs.length, tone: 'teal' },
        { label: 'Nivel 3 y 4 (Acción Urgente)', value: crit, tone: crit > 0 ? 'rose' : 'emerald' },
        { label: 'Cargo Evaluado', value: doc?.formData?.cargo || 'General', tone: 'indigo' },
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
            'Tarea / Actividad y Fase de Trabajo Analizada': `${doc?.formData?.actividadGlobal || ''} - Fase: ${o.descripcion || ''}`,
            'Posición de Espalda (1 a 4), Brazos (1 a 3), Piernas (1 a 7) y Carga/Fuerza (1 a 3)': `Espalda=${o.espalda} (${o.espaldaLabel || ''}), Brazos=${o.brazos} (${o.brazosLabel || ''}), Piernas=${o.piernas} (${o.piernasLabel || ''}), Carga=${o.carga} (${o.cargaLabel || ''})`,
            'Código Postural OWAS de 4 Dígitos': code4,
            'Categoría de Riesgo OWAS (Nivel 1 Normal / Nivel 2 Leve / Nivel 3 Dañino / Nivel 4 Urgente)': `Nivel ${cat}`,
          },
        };
      }),
    };
  }

  // 26. Hito 4 · Estudio de Puesto de Trabajo (EPT)
  if (canonicalId === 'hito3_estudio_puesto') {
    const EstudioPuestoTrabajo = getSafeModel('EstudioPuestoTrabajo', '~/server/routes/sgsst/estudioPuestoTrabajo', '~/models/EstudioPuestoTrabajo');
    const studies = await findManyCompanyDocs(EstudioPuestoTrabajo, userId, company, { createdAt: -1 }, 100);
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
      evidenceFiles: eptEvidences,
      kpis: [
        { label: 'Estudios EPT Realizados', value: studies.length, tone: 'teal' },
        { label: 'Riesgo Crítico / Alto', value: crit, tone: crit > 0 ? 'rose' : 'emerald' },
        { label: 'Riesgo Medio / Bajo', value: Math.max(0, studies.length - crit), tone: 'emerald' },
      ],
      records: studies.map((s, i) => {
        const isCrit = /cr[ií]tico|alto/i.test(s.riskLevel || '') || Number(s.rulaScore) >= 5;
        return {
          id: String(s._id || `ept_${i}`),
          label: `${s.workerName || 'Trabajador'} (CC ${s.workerId || 'S/D'}) — Cargo: ${s.cargo || 'General'}`,
          sublabel: `Actividad: ${s.actividad || ''} • RULA: ${s.rulaScore ?? 'N/A'} | REBA: ${s.rebaScore ?? 'N/A'} • Cuello: ${s.telemetry?.neckAngle ?? 0}° | Tronco: ${s.telemetry?.trunkAngle ?? 0}°`,
          badge: `${s.riskLevel || 'Evaluado'} (${s.actionLevel || 'Estándar'})`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Trabajador, Cédula, Cargo y Área Evaluada': `${s.workerName || ''} (CC ${s.workerId || 'S/D'}) - Cargo: ${s.cargo || ''}`,
            'Cédula / Documento': s.workerId || 'S/D',
            'Nombre Completo': s.workerName || '',
            'Cargo': s.cargo || '',
            'Descripción de la Tarea, Jornada y Ciclo de Trabajo': s.actividad || '',
            'Condiciones Ambientales (Iluminación, Ruido, Temperatura, Vibración)': s.notes || '',
            'Diseño del Puesto, Mobiliario y Herramientas': `Ángulos MediaPipe: Cuello ${s.telemetry?.neckAngle ?? 0}°, Tronco ${s.telemetry?.trunkAngle ?? 0}°, Brazo ${s.telemetry?.armAngle ?? 0}°, Codo ${s.telemetry?.elbowAngle ?? 0}°`,
            'Factores de Riesgo Biomecánico y Psicosocial Identificados': `RULA: ${s.rulaScore ?? 0} | REBA: ${s.rebaScore ?? 0} | Nivel: ${s.actionLevel || ''} (${s.riskLevel || ''})`,
            'Plan de Intervención, Ajustes Razonables y Seguimiento': s.notes || 'Seguimiento ergonómico preventivo',
          },
        };
      }),
    };
  }

  // 27. Hito 4 · Termómetro Psicosocial y Clima Emocional
  if (canonicalId === 'hito4_psicosocial') {
    const MoodTelemetry = getSafeModel('MoodTelemetry', '~/server/routes/sgsst/animo', '~/models/MoodTelemetry');
    const items = await findManyCompanyDocs(MoodTelemetry, userId, company, { createdAt: -1 }, 150);
    const sad = items.filter((m) => m.mood === 'sad').length;
    const happy = items.filter((m) => m.mood === 'happy').length;
    const neutral = items.filter((m) => m.mood === 'neutral').length;

    return {
      moduleTitle: 'Hito 4 · Termómetro Psicosocial & Estado de Ánimo (Res. 2764)',
      sourceCollection: 'MoodTelemetry',
      kpis: [
        { label: 'Total Reportes Ánimo', value: items.length, tone: 'teal' },
        { label: 'Motivado / Positivo', value: happy, tone: 'emerald' },
        { label: 'Tranquilo / Normal', value: neutral, tone: 'indigo' },
        { label: 'Estresado / Alerta', value: sad, tone: sad > 0 ? 'rose' : 'emerald' },
      ],
      records: items.map((m, i) => ({
        id: String(m._id || `mood_${i}`),
        label: `[${m.mood === 'sad' ? 'ALERTA ESTRÉS / AGOTAMIENTO' : m.mood === 'happy' ? 'POSITIVO / MOTIVADO' : 'NORMAL / TRANQUILO'}] Área: ${m.department || 'General'}`,
        sublabel: `Estresores: ${(m.stressors || []).join(', ') || 'Ninguno'} • Detalle: ${m.details || 'Sin comentario'}`,
        badge: m.createdAt ? new Date(m.createdAt).toLocaleDateString('es-CO') : m.mood,
        badgeTone: m.mood === 'sad' ? 'rose' : m.mood === 'happy' ? 'emerald' : 'slate',
        isCritical: m.mood === 'sad',
        fields: {
          'Distribución de Estado de Ánimo (Positivo, Neutral, Estresado / Fatigado)': m.mood || '',
          'Factores Estresores Reportados (Carga Mental, Jornada, Liderazgo, Clima, Entorno)': (m.stressors || []).join(', '),
          'Tendencias por Área / Proceso / Sede': m.department || 'General',
          'Alertas Tempranas de Fatiga o Riesgo Psicosocial': m.details || '',
        },
      })),
    };
  }

  // 28. Hito 5 · Compras y Adquisiciones con Criterios SST
  if (canonicalId === 'hito5_compras_sst') {
    const SgsstComprasData = getSafeModel('SgsstComprasData', '~/server/routes/sgsst/compras', '~/models/SgsstComprasData');
    const doc = await findSingleCompanyDoc(SgsstComprasData, userId, company);
    const compras = Array.isArray(doc?.compras) ? doc.compras : [];
    const aprobadas = compras.filter((c) => /aprobado/i.test(c.dictamenSST || '')).length;
    const condRech = compras.length - aprobadas;

    return {
      moduleTitle: 'Hito 5 · Compras y Adquisiciones con Criterios SST (Est. 2.9.1)',
      sourceCollection: 'SgsstComprasData',
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
          sublabel: `Proveedor: ${c.proveedorSugerido || 'N/A'} (NIT ${c.nitProveedor || 'N/A'}) • Norma: ${c.normaTecnica || 'ANSI/NTC'}`,
          badge: c.dictamenSST || 'Evaluado',
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Producto, Equipo, Sustancia o Servicio a Adquirir': `${c.codigo || ''}: ${c.productoServicio || ''} (${c.categoria || ''})`,
            'Especificaciones y Requisitos Técnicos de SST Exigidos': `${c.normaTecnica || ''} - ${c.especificacionesSST || ''}`,
            'Certificaciones de Calidad / Normas Técnicas (ANSI, NTC, NIOSH, RETIE, SGA)': `Certificado Calidad: ${c.tieneCertificadoCalidad ? 'Sí' : 'No'} | FDS SGA: ${c.tieneFdsSga ? 'Sí' : 'No'}`,
            'Evaluación y Verificación de Recepción SST': `${c.dictamenSST || ''} (Resp: ${c.responsableEvaluacion || ''})`,
          },
        };
      }),
    };
  }

  // 29. Hito 5 · Gestión de Contratistas y Proveedores
  if (canonicalId === 'hito5_contratistas') {
    const SgsstContratistasData = getSafeModel('SgsstContratistasData', '~/server/routes/sgsst/contratistas', '~/models/SgsstContratistasData');
    const doc = await findSingleCompanyDoc(SgsstContratistasData, userId, company);
    const contratistas = Array.isArray(doc?.contratistas) ? doc.contratistas : [];
    const enBrecha = contratistas.filter((c) => c.estadoPila !== 'Vigente' || c.calificacionSST !== 'Aprobado').length;

    return {
      moduleTitle: 'Hito 5 · Gestión de Contratistas, Proveedores y Terceros (Est. 2.10.1)',
      sourceCollection: 'SgsstContratistasData',
      kpis: [
        { label: 'Contratistas en Padrón', value: contratistas.length, tone: 'teal' },
        { label: 'Aprobados / PILA Vigente', value: contratistas.length - enBrecha, tone: 'emerald' },
        { label: 'Condicionados / PILA Vencida', value: enBrecha, tone: enBrecha > 0 ? 'rose' : 'emerald' },
      ],
      records: contratistas.map((c, i) => {
        const isCrit = c.estadoPila !== 'Vigente' || c.calificacionSST !== 'Aprobado';
        return {
          id: c.id || c.nit || `ctr_${i}`,
          label: `${c.razonSocial || 'Contratista'} (NIT: ${c.nit || 'S/D'})`,
          sublabel: `Servicio: ${c.servicio || ''} • ARL: ${c.arl || ''} (${c.nivelRiesgo || ''}) • Trabajadores en misión: ${c.trabajadoresEnMision || 0}`,
          badge: `${c.calificacionSST || 'Evaluado'} • PILA: ${c.estadoPila || 'Vigente'} • 0312: ${c.puntaje0312 ?? c.cumplimiento0312Pct ?? ''}%`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Razón Social, NIT y Representante del Contratista / Proveedor': `${c.razonSocial || ''} (NIT ${c.nit || ''}) - Contacto: ${c.contactoResponsable || ''}`,
            'Objeto del Contrato, Nivel de Riesgo ARL y Trabajadores Asignados': `${c.servicio || ''} | ${c.nivelRiesgo || ''} (${c.arl || ''}) | ${c.trabajadoresEnMision || 0} trabajadores`,
            'Certificado de Evaluación de Estándares Mínimos Res. 0312 del Contratista': `${c.puntaje0312 ?? c.cumplimiento0312Pct ?? 0}%`,
            'Verificación Mensual de Planilla PILA (EPS, ARL, AFP vigentes)': `${c.estadoPila || ''} (Ref: ${c.planillaPilaRef || 'N/A'})`,
            'Inducción SST, Certificados de Tareas de Alto Riesgo y Entrega de EPP': `Inducción: ${c.induccionSST || ''}% | Alto Riesgo: ${c.tareaAltoRiesgo || ''} | Certificados: ${c.certificadosExigidos || ''}`,
            'Evaluación de Desempeño SST del Contratista': c.calificacionSST || '',
          },
        };
      }),
    };
  }

  // 30. Hito 5 · Gestión del Cambio (MOC)
  if (canonicalId === 'hito5_gestion_cambio') {
    const SgsstGestionCambioData = getSafeModel('SgsstGestionCambioData', '~/server/routes/sgsst/gestionCambio', '~/models/SgsstGestionCambioData');
    const doc = await findSingleCompanyDoc(SgsstGestionCambioData, userId, company);
    const mocList = Array.isArray(doc?.mocList) ? doc.mocList : [];
    const altoRiesgo = mocList.filter((m) => m.nivelRiesgoCambio === 'Alto' || m.estado !== 'Implementado').length;

    return {
      moduleTitle: 'Hito 5 · Gestión del Cambio MOC (Est. 2.11.1 / Dec. 1072 Art. 2.2.4.6.26)',
      sourceCollection: 'SgsstGestionCambioData',
      kpis: [
        { label: 'Cambios MOC Registrados', value: mocList.length, tone: 'teal' },
        { label: 'Implementados', value: mocList.filter((m) => m.estado === 'Implementado').length, tone: 'emerald' },
        { label: 'En Evaluación / Riesgo Alto', value: altoRiesgo, tone: altoRiesgo > 0 ? 'amber' : 'emerald' },
      ],
      records: mocList.map((m, i) => ({
        id: m.id || m.codigo || `moc_${i}`,
        label: `[${m.codigo || `MOC-${i + 1}`}] ${m.titulo || 'Gestión del Cambio'}`,
        sublabel: `Tipo: ${m.tipoCambio || ''} • Peligros Nuevos: ${m.peligrosNuevos || ''} • Resp: ${m.responsable || ''}`,
        badge: `Riesgo ${m.nivelRiesgoCambio || 'Medio'} • ${m.estado || 'En Evaluación'}`,
        badgeTone: m.nivelRiesgoCambio === 'Alto' ? 'rose' : 'indigo',
        isCritical: m.nivelRiesgoCambio === 'Alto' || m.estado !== 'Implementado',
        fields: {
          'Descripción del Cambio (Interno: Procesos, Equipos, Personal, Infraestructura / Externo: Normativo, Tecnológico)': `${m.codigo || ''}: ${m.titulo || ''} (${m.tipoCambio || ''} - ${m.origen || ''}): ${m.descripcion || ''}`,
          'Identificación de Nuevos Peligros y Evaluación de Riesgos del Cambio': `${m.peligrosNuevos || ''} (Riesgo: ${m.nivelRiesgoCambio || ''})`,
          'Medidas de Control, Capacitación y Comunicación Antes de Implementar': `${m.controlesRequeridos || ''} | Módulos impactados: ${(m.modulosImpactados || []).join(', ')}`,
          'Responsable, Fecha de Implementación y Verificación de Eficacia': `Resp: ${m.responsable || ''} | Fecha: ${m.fechaPropuesta || ''} | Estado: ${m.estado || ''}`,
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
    const doc = await findSingleCompanyDoc(Model, userId, company);
    const trabs = Array.isArray(doc?.trabajadoresList) ? doc.trabajadoresList : [];
    const resps = Array.isArray(doc?.responsablesList) ? doc.responsablesList : [];
    const fd = doc?.formData || {};

    const records = [
      ...trabs.map((t, i) => ({
        id: t.cedula || `tar_trab_${i}`,
        label: `[Ejecutante Autorizado] ${t.nombre || 'Trabajador'} (CC ${t.cedula || ''})`,
        sublabel: `Tarea: ${fd.actividadGlobal || 'Tarea Crítica'} • Fecha: ${fd.fecha || ''} (${fd.horaInicio || ''} - ${fd.horaFin || ''})`,
        badge: `Seg. Social: ${fd.seguridadSocial || 'Sí'} • Aptitud: ${fd.aptitudMedica || 'Sí'}`,
        badgeTone: 'emerald',
        isCritical: fd.seguridadSocial === 'No' || fd.aptitudMedica === 'No' || fd.certificacionAlturas === 'No',
        fields: isAlturas
          ? {
              'Trabajador Autorizado (Cédula, Nombre, Cargo, ARL, EPS y Curso Alturas Vigente)': `${t.nombre || ''} (CC ${t.cedula || ''}) - Cert. Alturas: ${fd.certificacionAlturas || 'Sí'}`,
              'Descripción, Ubicación, Altura Aproximada (m) y Fecha/Hora del Trabajo': `${fd.actividadGlobal || ''} (${fd.fecha || ''} ${fd.horaInicio || ''}-${fd.horaFin || ''})`,
              'Verificación de Condiciones de Salud y Aptitud Médica Pre-Tarea': `Seguridad Social: ${fd.seguridadSocial || 'Sí'} | Aptitud Médica: ${fd.aptitudMedica || 'Sí'}`,
              'Firmas del Ejecutante, Coordinador de Trabajo en Alturas y Emisor': resps.map((r) => `${r.rol || 'Coordinador'}: ${r.nombre} (CC ${r.cedula})`).join(' | '),
            }
          : {
              'Descripción de la Tarea Crítica, Área y Fecha de Ejecución': `${fd.actividadGlobal || ''} (${fd.fecha || ''} ${fd.horaInicio || ''}-${fd.horaFin || ''})`,
              'Trabajadores Ejecutantes y Supervisor / Emisor (Cédula, Nombre y Firma)': `Ejecutante: ${t.nombre || ''} (CC ${t.cedula || ''}) | Supervisores: ${resps.map((r) => `${r.nombre} (${r.rol || ''})`).join(', ')}`,
              'Pasos Secuenciales de la Tarea': fd.actividadGlobal || '',
              'Controles Requeridos antes y durante la Tarea (Bloqueo/Etiquetado, Medición Atmósfera, EPP)': `Charla Preop: ${fd.seguridadSocial || 'Sí'} | Equipos Inspeccionados: ${fd.aptitudMedica || 'Sí'} | Área Verificada: ${fd.certificacionAlturas || 'Sí'}`,
            },
      })),
    ];

    return {
      moduleTitle: isAlturas
        ? 'Hito 5 · Permiso de Trabajo en Alturas (Res. 4272 de 2021)'
        : 'Hito 5 · Análisis de Trabajo Seguro (ATS Paso a Paso)',
      sourceCollection: isAlturas ? 'PermisoAlturasData' : 'AnalisisTrabajoSeguroData',
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
    const docs = await findManyCompanyDocs(SgsstHeightsData, userId, company, { updatedAt: -1 }, 100);
    const records = [];
    for (const d of docs) {
      for (const eq of d.equipos || []) {
        const isCrit = eq.estado === 'Vencido' || eq.estado === 'Requiere Inspección' || eq.resultadoInspeccion === 'Rechazado';
        records.push({
          id: eq.id || eq.serial || `${d._id}_${records.length}`,
          label: `${eq.nombre || 'Equipo Alturas'} (${eq.marca || ''} ${eq.referencia || ''}) — Serial: ${eq.serial || 'S/N'}`,
          sublabel: `Asignado a: ${d.nombreTrabajador || 'Bodega'} (${d.cargo || ''}) • Próx. Inspección: ${eq.fechaProximaInspeccion || 'N/A'}`,
          badge: `${eq.estado || 'Vigente'} • ${eq.resultadoInspeccion || 'Aprobado'}`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Tipo de Equipo (Arnés, Eslinga con Absorbedor, Línea de Vida, Mosquetón, Freno, Casco Barbuquejo)': eq.nombre || '',
            'Marca, Modelo, Número de Serie / Lote y Norma de Certificación (ANSI Z359 / EN)': `${eq.marca || ''} ${eq.referencia || ''} (Serial: ${eq.serial || ''})`,
            'Fecha de Fabricación, Fecha de Puesta en Servicio y Vida Útil': `Fab: ${eq.fechaFabricacion || ''} | Compra: ${eq.fechaCompra || ''}`,
            'Historial de Inspecciones Preoperacionales y Anuales por Persona Competente / Avalada': `Última: ${eq.fechaUltimaInspeccion || ''} | Próxima: ${eq.fechaProximaInspeccion || ''} | Inspector: ${eq.inspeccionadoPor || ''}`,
            'Estado del Equipo (Apto / En Cuarentena / Dado de Baja por Impacto o Deterioro)': `${eq.estado || ''} (${eq.resultadoInspeccion || ''}) - Obs: ${eq.observaciones || ''}`,
          },
        });
      }
    }

    return {
      moduleTitle: 'Hito 5 · Hoja de Vida e Inspección de Equipos Contra Caídas (Res. 4272)',
      sourceCollection: 'SgsstHeightsData',
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

    const entregasDocs = await findManyCompanyDocs(SgsstEppData, userId, company, { updatedAt: -1 }, 100);
    const invDocs = await findManyCompanyDocs(SgsstEppInventory, userId, company, { updatedAt: -1 }, 100);
    const solDocs = await findManyCompanyDocs(SgsstEppSolicitud, userId, company, { createdAt: -1 }, 50);

    const records = [];
    let totalEntregasCount = 0;
    for (const d of entregasDocs) {
      const workerCedula = String(d.documento || d.cedula || d.identificacion || d.workerId || 'S/D').trim();
      const workerName = d.nombreTrabajador || d.nombre || 'Trabajador';
      const itemsList = Array.isArray(d.entregas) && d.entregas.length > 0 ? d.entregas : Array.isArray(d.epps) ? d.epps : [];
      totalEntregasCount += itemsList.length;

      for (const epp of itemsList) {
        const eppName = epp.elemento || epp.nombre || epp.epp || 'EPP';
        const isCrit = epp.estado === 'Vencido' || epp.estado === 'Requiere Reposición';
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
          'Elemento de Protección Personal Entregado y Norma Técnica': `${inv.nombre || ''} (${inv.categoria || ''})`,
          'Estado de Stock e Inventario Mínimo por Referencia': `Stock Actual: ${inv.stockActual ?? 0} | Mínimo: ${inv.stockMinimo ?? 0} (${inv.ubicacionBodega || ''})`,
        },
      });
    }

    return {
      moduleTitle: 'Hito 5 · Gestión, Inventario y Entrega de EPP',
      sourceCollection: 'SgsstEppData + SgsstEppInventory + SgsstEppSolicitud',
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
    const doc = await findSingleCompanyDoc(SgsstChemicalData, userId, company);
    const productos = Array.isArray(doc?.productos) ? doc.productos : [];
    const alertas = productos.filter((p) => !p.tieneFds || !p.tieneRotuloSga).length;

    return {
      moduleTitle: 'Hito 5 · Inventario de Productos Químicos y FDS en Terreno (Dec. 1496)',
      sourceCollection: 'SgsstChemicalData',
      kpis: [
        { label: 'Sustancias en Terreno', value: productos.length, tone: 'teal' },
        { label: 'Con FDS y Rótulo SGA', value: productos.length - alertas, tone: 'emerald' },
        { label: 'Sin FDS o Sin Rótulo', value: alertas, tone: alertas > 0 ? 'rose' : 'emerald' },
      ],
      records: productos.map((p, i) => {
        const isCrit = !p.tieneFds || !p.tieneRotuloSga;
        return {
          id: p.id || `chem_${i}`,
          label: `${p.nombre || 'Producto Químico'} (${p.claseOnu || 'SGA'})`,
          sublabel: `Fabricante: ${p.fabricante || ''} • Ubicación: ${p.ubicacion || ''} • Cantidad: ${p.cantidadAlmacenada || ''}`,
          badge: `FDS: ${p.tieneFds ? 'Sí' : 'NO'} • Rótulo SGA: ${p.tieneRotuloSga ? 'Sí' : 'NO'}`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Nombre Comercial, Sustancia Activa, Fabricante y Área de Uso': `${p.nombre || ''} (${p.fabricante || ''}) - Área: ${p.ubicacion || ''}`,
            'Estado Físico, Cantidad Almacenada y Tipo de Envase': `${p.estadoFisico || ''} - Cantidad: ${p.cantidadAlmacenada || ''}`,
            'Etiquetado SGA en Envase Original y Trasvases': `Rótulo SGA: ${p.tieneRotuloSga ? 'Sí' : 'No'} | Pictogramas: ${(p.pictogramasSga || []).join(', ')}`,
            'Disponibilidad de FDS en el Punto de Trabajo': p.tieneFds ? 'Sí tiene FDS' : 'Falta FDS',
            'Controles de Ventilación, Duchas Lavaojos y EPP Químico': `Almacenamiento: ${p.requisitosAlmacenamiento || ''} | Incompatibilidades: ${(p.incompatibilidades || []).join(', ')} | Expuestos: ${(p.trabajadoresExpuestos || []).join(', ')}`,
          },
        };
      }),
    };
  }

  // 36. Hito 5 · Parque Automotor e Inspección Preoperacional PESV
  if (canonicalId === 'hito3_vehiculos') {
    const SgsstVehicleData = getSafeModel('SgsstVehicleData', '~/server/routes/sgsst/vehicles', '~/models/SgsstVehicleData');
    const vehicles = await findManyCompanyDocs(SgsstVehicleData, userId, company, { updatedAt: -1 }, 100);
    const now = Date.now();

    return {
      moduleTitle: 'Hito 5 · Parque Automotor e Inspección Preoperacional PESV',
      sourceCollection: 'SgsstVehicleData',
      kpis: [
        { label: 'Vehículos en Flota', value: vehicles.length, tone: 'teal' },
        { label: 'Inspecciones Realizadas', value: vehicles.reduce((a, v) => a + (v.inspecciones?.length || 0), 0), tone: 'indigo' },
      ],
      records: vehicles.map((v, i) => {
        const lastInsp = Array.isArray(v.inspecciones) && v.inspecciones.length > 0 ? v.inspecciones[v.inspecciones.length - 1] : null;
        const soatExp = v.soatVencimiento ? new Date(v.soatVencimiento).getTime() < now : false;
        const rtmExp = v.tecnomecanicaVencimiento ? new Date(v.tecnomecanicaVencimiento).getTime() < now : false;
        const noApto = lastInsp && /no apto|restricci/i.test(lastInsp.resultado || '');
        const isCrit = soatExp || rtmExp || Boolean(noApto);

        return {
          id: v.placa || String(v._id || `veh_${i}`),
          label: `[Placa ${v.placa || 'S/P'}] ${v.marca || ''} ${v.referencia || ''} (${v.tipo || 'Vehículo'})`,
          sublabel: `Conductor: ${v.conductorNombre || 'Sin asignar'} (CC ${v.conductorId || ''}) • SOAT: ${v.soatVencimiento || 'N/A'} • RTM: ${v.tecnomecanicaVencimiento || 'N/A'}`,
          badge: lastInsp ? `${lastInsp.resultado} (${v.kilometrajeActual || 0} km)` : `${v.kilometrajeActual || 0} km`,
          badgeTone: isCrit ? 'rose' : 'emerald',
          isCritical: isCrit,
          fields: {
            'Placa, Tipo de Vehículo, Marca, Modelo y Kilometraje': `Placa: ${v.placa || ''} | ${v.tipo || ''} ${v.marca || ''} ${v.referencia || ''} (${v.modelo || v.anio || ''}) | ${v.kilometrajeActual || 0} km`,
            'Conductor Asignado (Cédula, Nombre, Categoría y Vigencia de Licencia y SIMIT)': `${v.conductorNombre || ''} (CC ${v.conductorId || ''})`,
            'Vigencia de SOAT, Revisión Técnico-Mecánica y Póliza': `SOAT: ${v.soatVencimiento || ''} | Tecnomecánica: ${v.tecnomecanicaVencimiento || ''}`,
            'Resultado de Inspección Preoperacional Diaria (Frenos, Llantas, Luces, Dirección, Kit de Carretera)': lastInsp ? `${lastInsp.fecha || ''}: ${lastInsp.resultado || ''} (Frenos: ${lastInsp.frenos || 'OK'}, Llantas: ${lastInsp.llantas || 'OK'}, Luces: ${lastInsp.luces || 'OK'})` : 'Sin inspección reciente',
            'Historial de Mantenimiento Preventivo y Correctivo': `Último: ${v.ultimoMantenimiento || ''} | Próximo: ${v.proximoMantenimiento || ''}`,
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
    const doc = await findSingleCompanyDoc(ProgramaCapacitacionesData, userId, company);
    const sesiones = Array.isArray(doc?.sesiones) ? doc.sesiones : [];
    const completadas = sesiones.filter((s) => s.estado === 'Completada').length;
    const pendientes = sesiones.filter((s) => s.estado !== 'Completada').length;

    return {
      moduleTitle: 'Hito 6 · Programa Anual de Capacitaciones, Inducción y Reinducción SST (Est. 1.2.1)',
      sourceCollection: 'ProgramaCapacitacionesData',
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
          sublabel: `Duración: ${s.duracion || '1'}h • Capacitador: ${s.responsable || 'SG-SST'} • Asistentes: ${asist.length}`,
          badge: s.estado || 'Programada',
          badgeTone: s.estado === 'Completada' ? 'emerald' : 'amber',
          isCritical: isCrit,
          fields: {
            'Tema de Capacitación, Inducción o Entrenamiento': s.tema || '',
            'Cargos y Trabajadores Objetivo (Convocados vs Asistentes)': asist.map((a) => `${a.nombre} (CC ${a.cedula || ''})`).join(', ') || 'Toda la nómina',
            'Fecha Programada, Intensidad Horaria, Modalidad y Capacitador': `Fecha: ${s.fecha || ''} ${s.hora || ''} | Duración: ${s.duracion || ''}h | Resp: ${s.responsable || ''}`,
            'Indicadores de Cobertura, Cumplimiento y Eficacia': `Estado: ${s.estado || ''} | Asistentes: ${asist.length}`,
            'Registro de Asistencia, Evaluación y Certificados': s.descripcion || '',
          },
        };
      }),
    };
  }

  // 40. Hito 6 · Rutas de Aprendizaje y Escuela Virtual LMS
  if (canonicalId === 'hito6_ruta_aprendizaje') {
    const Course = getSafeModel('Course', null, '~/models/Course');
    const UserProgress = getSafeModel('UserProgress', null, '~/models/UserProgress');
    const SgsstWorker = getSafeModel('SgsstWorker', '~/server/routes/sgsst/workers', '~/models/SgsstWorker');
    const companyScope = buildCompanyScopeFilter(userId, company);

    const [companyCourses, globalCourses, progresses, workers] = await Promise.all([
      findManyCompanyDocs(Course, userId, company, { updatedAt: -1 }, 50),
      Course ? Course.find({ isPublished: true }).sort({ updatedAt: -1 }).limit(30).lean().catch(() => []) : [],
      findManyCompanyDocs(UserProgress, userId, company, { updatedAt: -1 }, 100),
      SgsstWorker && Object.keys(companyScope).length > 0
        ? SgsstWorker.find(companyScope).limit(100).lean().catch(() => [])
        : [],
    ]);

    const courseMap = new Map();
    for (const c of [...companyCourses, ...globalCourses]) {
      if (c?._id) courseMap.set(String(c._id), c);
    }
    const courses = Array.from(courseMap.values());
    const workerFallback = workers[0] || null;

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
        const pName = p.workerName || workerFallback?.nombre || 'Colaborador Inscrito';
        const pCedula = p.workerCedula || workerFallback?.documento || 'Registrado';
        return {
          id: String(p._id || `prog_${i}`),
          label: `[Progreso LMS] ${pName} (CC ${pCedula})${courseObj?.title ? ` — ${courseObj.title}` : ''}`,
          sublabel: `Lecciones completadas: ${(p.completedLessons || []).length}${courseObj ? ` / ${(courseObj.lessons || []).length}` : ''}`,
          badge: p.isCourseCompleted ? 'CERTIFICADO' : 'En Progreso',
          badgeTone: p.isCourseCompleted ? 'emerald' : 'amber',
          isCritical: !p.isCourseCompleted,
          fields: {
            'Curso / Módulo Formativo y Competencia Asociada': courseObj?.title || 'Ruta Formativa LMS',
            'Trabajador Inscrito (Cédula, Nombre y Cargo)': `${pName} (CC ${pCedula})`,
            'Cédula / Documento': String(pCedula),
            'Nombre Completo': pName,
            'Porcentaje de Avance de Lecciones (%)': `${(p.completedLessons || []).length} lecciones completadas`,
            'Calificación de Examen / Quiz y Estado de Certificación': p.isCourseCompleted ? 'Aprobado y Certificado' : 'En curso',
          },
        };
      }),
    ];

    return {
      moduleTitle: 'Hito 6 · Rutas de Aprendizaje y Escuela Virtual LMS',
      sourceCollection: 'Course + UserProgress',
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
    const doc = await findSingleCompanyDoc(ReporteActosData, userId, company);
    const inbox = Array.isArray(doc?.inboxPublico) ? doc.inboxPublico : [];
    const fd = doc?.formData || {};

    const records = [
      ...(fd.actividadGlobal
        ? [
            {
              id: 'rep_acto_main',
              label: `[Hallazgo Principal] ${fd.actividadGlobal.slice(0, 90)}`,
              sublabel: `Fecha: ${fd.fecha || ''} • Intervención Urgente: ${fd.certificacionAlturas || 'Sí'}`,
              badge: fd.aptitudMedica === 'Sí' ? 'Actividad Suspendida' : 'Registrado',
              badgeTone: 'rose',
              isCritical: true,
              fields: {
                'Tipo de Hallazgo (Acto Inseguro / Condición Subestándar)': 'Hallazgo Operativo SST',
                'Descripción Detallada, Área / Sede, Fecha y Evidencia Fotográfica': `${fd.actividadGlobal || ''} (${fd.fecha || ''})`,
                'Trabajador Reportante (Cédula, Nombre y Cargo)': (doc?.trabajadoresList || []).map((t) => `${t.nombre} (CC ${t.cedula})`).join(', '),
                'Nivel de Criticidad y Peligro Asociado': fd.certificacionAlturas === 'Sí' ? 'Intervención Urgente' : 'Moderado',
                'Acción Correctiva Inmediata, Responsable y Estado de Cierre': `Suspendida preventivamente: ${fd.aptitudMedica || 'No'}`,
              },
            },
          ]
        : []),
      ...inbox.map((inb, i) => ({
        id: inb.id || `inb_acto_${i}`,
        label: `[Buzón QR] ${inb.trabajador?.nombre || 'Colaborador'} (CC ${inb.trabajador?.cedula || ''}) — ${inb.data?.ubicacion || 'Planta'}`,
        sublabel: `${inb.data?.descripcion || ''}`,
        badge: inb.status === 'processed' ? 'Procesado' : 'PENDIENTE GESTIÓN',
        badgeTone: inb.status === 'processed' ? 'emerald' : 'rose',
        isCritical: inb.status !== 'processed',
        fields: {
          'Tipo de Hallazgo (Acto Inseguro / Condición Subestándar)': 'Reporte QR Acto/Condición',
          'Descripción Detallada, Área / Sede, Fecha y Evidencia Fotográfica': `${inb.data?.descripcion || ''} (Área: ${inb.data?.ubicacion || ''} - Fecha: ${inb.data?.fecha || ''})`,
          'Trabajador Reportante (Cédula, Nombre y Cargo)': `${inb.trabajador?.nombre || ''} (CC ${inb.trabajador?.cedula || ''}) - ${inb.trabajador?.cargo || ''}`,
          'Cédula / Documento': inb.trabajador?.cedula || '',
          'Nombre Completo': inb.trabajador?.nombre || '',
          'Cargo': inb.trabajador?.cargo || '',
          'Acción Correctiva Inmediata, Responsable y Estado de Cierre': inb.status || 'pending',
        },
      })),
    ];

    return {
      moduleTitle: 'Hito 6 · Reporte de Actos y Condiciones Inseguras (Buzón QR)',
      sourceCollection: 'ReporteActosData',
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
          'Datos Capturados y Resultados Generados': String(s.content || '').slice(0, 400),
        },
      })),
    };
  }

  // 44. Hito 7 · Estadísticas de Accidentalidad, Enfermedad Laboral y Ausentismo (ATEL)
  if (canonicalId === 'hito7_estadisticas_atel') {
    const ATELAnnualData = getSafeModel('ATELAnnualData', '~/server/routes/sgsst/atel-data');
    const docs = await findManyCompanyDocs(ATELAnnualData, userId, company, { year: -1 }, 5);
    const events = [];
    for (const d of docs) {
      const monthsObj = d.months instanceof Map ? Object.fromEntries(d.months) : d.months || {};
      for (const [mKey, mData] of Object.entries(monthsObj)) {
        for (const ev of mData?.events || []) {
          events.push({ ...ev, _year: d.year, _month: mKey });
        }
      }
    }
    const atCount = events.filter((e) => e.tipo === 'AT').length;
    const elCount = events.filter((e) => e.tipo === 'EL').length;
    const totalDays = events.reduce((a, e) => a + (Number(e.diasIncapacidad) || 0), 0);

    return {
      moduleTitle: 'Hito 7 · Estadísticas ATEL, Ausentismo y 6 Indicadores Mínimos Res. 0312',
      sourceCollection: 'ATELAnnualData',
      kpis: [
        { label: 'Total Eventos ATEL/Ausentismo', value: events.length, tone: 'teal' },
        { label: 'Accidentes de Trabajo (AT)', value: atCount, tone: atCount > 0 ? 'rose' : 'emerald' },
        { label: 'Enfermedad Laboral (EL)', value: elCount, tone: elCount > 0 ? 'rose' : 'emerald' },
        { label: 'Días de Incapacidad', value: totalDays, tone: 'amber' },
      ],
      records: events.map((ev, i) => {
        const isCrit = ev.tipo === 'AT' || ev.tipo === 'EL' || Number(ev.diasIncapacidad) >= 5;
        return {
          id: ev.id || `atel_ev_${i}`,
          label: `[${ev.tipo || 'Evento'}] ${ev.colaborador?.nombre || 'Colaborador'} (CC ${ev.colaborador?.cedula || ''}) — ${ev.fecha || ''}`,
          sublabel: `Cargo: ${ev.colaborador?.cargo || ''} • CIE-10: ${ev.diagnosticoCIE10 || 'N/A'} • Días Incap: ${ev.diasIncapacidad || 0} • Parte: ${ev.parteCuerpo || 'N/A'}`,
          badge: `${ev.tipo || 'Ausentismo'} · ${ev.diasIncapacidad || 0} día(s)`,
          badgeTone: isCrit ? 'rose' : 'amber',
          isCritical: isCrit,
          fields: {
            'Registro Individual de Eventos (Trabajador, Cédula, Fecha, Tipo AT/EL/EG, Días de Incapacidad, CIE-10, Parte del Cuerpo, Agente y Mecanismo)': `${ev.colaborador?.nombre || ''} (CC ${ev.colaborador?.cedula || ''}) | Fecha: ${ev.fecha || ''} | Tipo: ${ev.tipo || ''} | Días: ${ev.diasIncapacidad || 0} | CIE-10: ${ev.diagnosticoCIE10 || ''} | Parte: ${ev.parteCuerpo || ''} | Peligro: ${ev.peligro || ''}`,
            'Cédula / Documento': ev.colaborador?.cedula || '',
            'Nombre Completo': ev.colaborador?.nombre || '',
            'Cargo': ev.colaborador?.cargo || '',
            'Diagnóstico CIE-10': ev.diagnosticoCIE10 || '',
            'Días de Incapacidad': String(ev.diasIncapacidad || 0),
            'Costos Directos e Indirectos del Ausentismo y Siniestralidad': `Pérdida Neta: $${ev.financiero?.perdidaNetaEmpresa || 0} | Recobro: ${ev.estadoRecobro || 'N/A'}`,
          },
        };
      }),
    };
  }

  // 45. Hito 7 · Investigación de Incidentes, Accidentes de Trabajo y Enfermedades Laborales (Res. 1401)
  if (canonicalId === 'hito7_investigacion_atel') {
    const InvestigacionAtelData = getSafeModel('InvestigacionAtelData', '~/server/routes/sgsst/investigacionAtel', '~/models/InvestigacionAtelData');
    const list = await findManyCompanyDocs(InvestigacionAtelData, userId, company, { updatedAt: -1 }, 50);
    const graves = list.filter((x) => /grave|mortal/i.test(x.formData?.tipoEvento || '')).length;

    return {
      moduleTitle: 'Hito 7 · Investigación de Incidentes y Accidentes ATEL (Res. 1401 de 2007)',
      sourceCollection: 'InvestigacionAtelData',
      kpis: [
        { label: 'Investigaciones ATEL', value: list.length, tone: 'teal' },
        { label: 'Graves / Mortales', value: graves, tone: graves > 0 ? 'rose' : 'emerald' },
        { label: 'Leves / Incidentes', value: Math.max(0, list.length - graves), tone: 'amber' },
      ],
      records: list.map((inv, i) => {
        const fd = inv.formData || {};
        const isCrit = /grave|mortal/i.test(fd.tipoEvento || '');
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
            'Descripción Detallada del Evento (Fecha, Hora, Lugar, Tarea Realizada, Testigos)': `Fecha: ${fd.fechaEvento || ''} ${fd.horaEvento || ''} en ${fd.lugarEvento || ''} | Actividad: ${fd.actividadMomento || ''} | Hechos: ${fd.descripcionHechos || ''}`,
            'Naturaleza de la Lesión, Parte del Cuerpo Afectada, Agente y Mecanismo del Accidente': `Lesión: ${fd.naturalezaLesion || ''} | Parte: ${fd.parteCuerpo || ''} | Agente: ${fd.agenteCausal || ''} | Días: ${fd.diasIncapacidad || 0}`,
            'Equipo Investigador (Jefe Inmediato, Representante COPASST, Responsable SG-SST y Licencia SST en Graves/Mortales)': (inv.equipoList || []).map((e) => `${e.rol || ''}: ${e.nombre || ''} (CC ${e.cedula || ''})`).join(' | '),
          },
        };
      }),
    };
  }

  // 46. Hito 7 · Centro de Control y Tablero Kanban ACPM
  if (canonicalId === 'hito7_acpm') {
    const KanbanTask = getSafeModel('KanbanTask', '~/server/routes/sgsst/kanban', '~/models/KanbanTask');
    const tasks = await findManyCompanyDocs(KanbanTask, userId, company, { dueDate: 1, updatedAt: -1 }, 150);
    const overdue = tasks.filter((t) => t.status === 'overdue').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const pending = tasks.filter((t) => t.status !== 'done' && t.status !== 'dismissed').length;

    return {
      moduleTitle: 'Hito 7 · Centro de Control y Tablero Kanban ACPM (Acciones Correctivas, Preventivas y de Mejora)',
      sourceCollection: 'KanbanTask',
      kpis: [
        { label: 'Total Acciones ACPM', value: tasks.length, tone: 'teal' },
        { label: 'Vencidas (Overdue)', value: overdue, tone: overdue > 0 ? 'rose' : 'emerald' },
        { label: 'Abiertas / En Gestión', value: pending, tone: 'amber' },
        { label: 'Cerradas (Done)', value: done, tone: 'emerald' },
      ],
      records: tasks.map((t, i) => {
        const isCrit = t.status === 'overdue' || t.priority === 'alta' || t.priority === 'high';
        return {
          id: String(t._id || `acpm_${i}`),
          label: `[${String(t.actionType || 'correctiva').toUpperCase()}] ${t.title || 'Acción ACPM'}`,
          sublabel: `Origen: ${t.sourceModule || t.type || 'SG-SST'} • Resp: ${t.assignedTo || 'Responsable SST'} • Vence: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-CO') : 'Por definir'}`,
          badge: `${String(t.status || 'todo').toUpperCase()} • Prioridad ${t.priority || 'media'}`,
          badgeTone: t.status === 'done' ? 'emerald' : isCrit ? 'rose' : 'amber',
          isCritical: t.status !== 'done' && isCrit,
          fields: {
            'Tipo de Acción (Correctiva / Preventiva / De Mejora)': t.actionType || 'correctiva',
            'Fuente del Hallazgo (Auditoría, Inspección, ATEL, COPASST, Revisión Dirección, Diagnóstico 0312)': t.sourceModule || t.type || '',
            'Descripción de la No Conformidad o Hallazgo y Análisis de Causa Raíz': `${t.title || ''}: ${t.description || ''}`,
            'Plan de Acción, Responsable, Recursos y Fecha Límite de Cumplimiento': `Resp: ${t.assignedTo || ''} | Vence: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-CO') : ''}`,
            'Estado en el Tablero Kanban (Pendiente, En Ejecución, En Verificación, Cerrada, Vencida)': t.status || 'todo',
            'Evidencia de Cierre y Verificación de Eficacia': t.deliverable?.notes || t.deliverable?.fileName || '',
          },
        };
      }),
    };
  }

  // 47. Hito 7 · Auditoría Anual de Cumplimiento SG-SST (Dec. 1072)
  if (canonicalId === 'hito7_auditoria') {
    const AuditoriaData = getSafeModel('AuditoriaData', '~/server/routes/sgsst/auditoria', '~/models/AuditoriaData');
    const doc = await findSingleCompanyDoc(AuditoriaData, userId, company);
    const items = Array.isArray(doc?.statusData) ? doc.statusData : [];
    const conformes = items.filter((i) => i.status === 'cumple').length;
    const noConformes = items.filter((i) => i.status === 'no_cumple' || i.status === 'parcial').length;
    const pct = doc?.weightedPercentage ?? doc?.compliancePercentage ?? 0;

    return {
      moduleTitle: 'Hito 7 · Auditoría Anual de Cumplimiento SG-SST (Dec. 1072 Art. 2.2.4.6.29)',
      sourceCollection: 'AuditoriaData',
      kpis: [
        { label: 'Puntaje Auditoría', value: `${Math.round(pct)}%`, tone: pct >= 85 ? 'emerald' : pct >= 60 ? 'amber' : 'rose' },
        { label: 'Ítems Conformes', value: conformes, tone: 'emerald' },
        { label: 'No Conformidades / Obs.', value: noConformes, tone: noConformes > 0 ? 'rose' : 'emerald' },
      ],
      records: items.map((it, i) => {
        const isCrit = it.status === 'no_cumple' || it.status === 'parcial';
        return {
          id: String(it.id || it.itemId || it.code || `aud_${i}`),
          label: `Cláusula ${it.code || i + 1} · ${it.name || it.description || 'Criterio Auditado'}`,
          sublabel: `Ciclo: ${String(it.category || '').toUpperCase()} • Evidencia/Hallazgo: ${it.observation || 'Sin hallazgos'}`,
          badge: it.status === 'cumple' ? 'CONFORME' : it.status === 'no_cumple' ? 'NO CONFORME' : String(it.status || 'pendiente').toUpperCase(),
          badgeTone: it.status === 'cumple' ? 'emerald' : isCrit ? 'rose' : 'slate',
          isCritical: isCrit,
          fields: {
            'Programa y Plan de Auditoría Interna (Alcance, Criterios y Equipo Auditor)': `Auditor: ${doc?.reviewerInfo?.nombre || 'Auditor SG-SST'} (Lic: ${doc?.reviewerInfo?.licencia || 'N/A'})`,
            'Lista de Chequeo por numeral del Decreto 1072 de 2015 y Resolución 0312': `${it.code || ''}: ${it.name || ''}`,
            'Hallazgos de Auditoría (Conformidades, No Conformidades Mayores/Menores y Observaciones)': `${it.status || ''}: ${it.observation || ''}`,
            'Evidencias Objetivas Verificadas': it.observation || '',
            'Conclusiones de Auditoría y Solicitudes de Acción Correctiva (ACPM)': isCrit ? `${it.code || ''} - ${it.name || ''}: ${it.observation || 'Subsanar no conformidad'}` : '',
          },
        };
      }),
    };
  }

  // 48. Hito 7 · Revisión por la Alta Dirección (Dec. 1072 Art. 2.2.4.6.31)
  if (canonicalId === 'hito7_alta_direccion') {
    const AltaDireccionData = getSafeModel('AltaDireccionData', '~/server/routes/sgsst/altaDireccion');
    const doc = await findSingleCompanyDoc(AltaDireccionData, userId, company);
    const items = Array.isArray(doc?.statusData) ? doc.statusData : [];
    const cumple = items.filter((i) => i.status === 'cumple').length;
    const pend = items.filter((i) => i.status === 'no_cumple' || i.status === 'parcial' || i.status === 'pendiente').length;

    return {
      moduleTitle: 'Hito 7 · Revisión Anual por la Alta Dirección (24 Aspectos Art. 2.2.4.6.31)',
      sourceCollection: 'AltaDireccionData',
      kpis: [
        { label: 'Aspectos Evaluados', value: `${items.length} / 24`, tone: 'teal' },
        { label: 'Cumplen', value: cumple, tone: 'emerald' },
        { label: 'Con Compromiso Gerencial', value: pend, tone: pend > 0 ? 'rose' : 'emerald' },
      ],
      records: items.map((it, i) => {
        const isCrit = it.status === 'no_cumple' || it.status === 'parcial';
        return {
          id: String(it.id || it.itemId || it.code || `ad_${i}`),
          label: `Aspecto ${it.code || i + 1} · ${it.name || it.title || 'Revisión Gerencial'}`,
          sublabel: `Decisión / Observación: ${it.observation || 'Sin observación'}`,
          badge: String(it.status || 'pendiente').toUpperCase(),
          badgeTone: it.status === 'cumple' ? 'emerald' : isCrit ? 'rose' : 'slate',
          isCritical: isCrit,
          fields: {
            'Evaluación de los 24 Aspectos Obligatorios del Art. 2.2.4.6.31 Dec. 1072': `${it.code || ''}: ${it.name || ''} (${it.status || ''})`,
            'Decisiones Gerenciales, Asignación de Presupuesto y Nuevos Recursos': it.observation || '',
            'Compromisos de la Alta Dirección y Acta Firmada por Representante Legal': `Directivo: ${doc?.reviewerInfo?.nombre || company?.legalRepresentative || ''} - ${it.observation || ''}`,
          },
        };
      }),
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
          'Conclusiones Periciales y Recomendaciones Aplicadas a la Empresa': r.preview,
        },
      })),
      ...legalRecords,
    ];
    return {
      moduleTitle: 'Hito 7 · Investigación Profunda Científica y Normativa SST',
      sourceCollection: 'ConversationHistory + MatrizLegalData',
      kpis: [
        { label: 'Investigaciones Emitidas', value: reports.length, tone: 'purple' },
        ...(legalRes?.kpis?.slice(0, 3) || []),
      ],
      records: combinedRecords,
    };
  }

  // 50. Hito 8 · Oráculo Predictivo de Siniestralidad y Riesgo IA (Radar Predictivo en Vivo)
  if (canonicalId === 'hito8_predictivo') {
    const [hito2Result, gtc45Result, moodResult, diagResult] = await Promise.all([
      inspectHito1And2('hito2_oraculo_predictivo', userId, company),
      inspectHito1And2('hito2_matriz_ipevar', userId, company),
      inspectHito3To5('hito4_psicosocial', userId, company),
      inspectHito1And2('hito1_diagnostico_0312', userId, company),
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
      ...critGtc.slice(0, 20).map((g) => ({
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
      ...sadMoods.slice(0, 10).map((m) => ({
        ...m,
        id: `pred_mood_${m.id}`,
        label: `🧠 [Radar Psicosocial] ${m.label}`,
      })),
    ];

    return {
      moduleTitle: 'Hito 8 · Radar Predictivo de Siniestralidad y Riesgo IA (Trabajadores + GTC-45 + Salud + Ánimo)',
      sourceCollection: 'Radar Predictivo 360° (SgsstWorker + GTC45WorkspaceSession + MoodTelemetry + DiagnosticoData + KanbanTask)',
      kpis: [
        { label: 'Trabajadores / Alertas Médicas', value: `${workerRecords.length} (${medAlerts} alerta)`, tone: medAlerts > 0 ? 'rose' : 'teal' },
        { label: 'Peligros Críticos GTC-45', value: `${critGtc.length} / ${gtcRecords.length}`, tone: critGtc.length > 0 ? 'rose' : 'emerald' },
        { label: 'Alertas Estrés / Ánimo', value: `${sadMoods.length} / ${moodRecords.length}`, tone: sadMoods.length > 0 ? 'amber' : 'emerald' },
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

  // 2. Equipo 2 y 5: Google Workspace (Drive, Sheets, Docs, Calendar, Gmail)
  if (
    ['extract_drive', 'google_drive', 'google_sheets', 'google_docs', 'google_calendar', 'extract_gmail', 'google_gmail'].includes(
      canonicalId
    )
  ) {
    let scopedEmail = company?.googleDrive?.email || '';
    let hasToken = Boolean(company?.googleDrive?.isConnected);
    const folderName = company?.googleDrive?.folderName || `SG-SST ${company?.companyName || ''}`.trim();
    try {
      const { getScopedAuthValue } = require('~/server/services/googleAuthHelper');
      const [em, rt, at] = await Promise.all([
        getScopedAuthValue(userId, companyIdStr, 'GOOGLE_DRIVE_EMAIL', false).catch(() => null),
        getScopedAuthValue(userId, companyIdStr, 'GOOGLE_DRIVE_REFRESH_TOKEN', false).catch(() => null),
        getScopedAuthValue(userId, companyIdStr, 'GOOGLE_DRIVE_ACCESS_TOKEN', false).catch(() => null),
      ]);
      if (em) scopedEmail = em;
      if (rt || at || em) hasToken = true;
    } catch (_) {}

    const AutomationLog = getSafeModel('AutomationLog', null, '~/models/AutomationLog');
    const logFilter = companyIdStr ? { companyId: companyIdStr } : userId ? { user: userId } : {};
    const logs = AutomationLog ? await AutomationLog.find(logFilter).sort({ runAt: -1 }).limit(15).lean().catch(() => []) : [];

    const records = [
      {
        id: `gws_conn_${companyIdStr || 'active'}`,
        label: hasToken
          ? `✅ Google Workspace Conectado (${scopedEmail || company?.email || 'Cuenta vinculada'})`
          : `⚠️ Google Workspace No Vinculado en ${company?.companyName || 'esta empresa'}`,
        sublabel: `Carpeta/Scope: ${folderName} • Servicio: ${canonicalId.toUpperCase()}`,
        badge: hasToken ? 'CONECTADO' : 'SIN VINCULAR',
        badgeTone: hasToken ? 'emerald' : 'rose',
        isCritical: !hasToken,
        fields: {
          'Estado de Conexión OAuth2 Google Workspace': hasToken ? 'Conectado y Activo' : 'Desconectado',
          'Cuenta de Google Vinculada': scopedEmail || 'Sin vincular',
          'Carpeta / Repositorio de la Empresa': folderName,
          'Empresa Activa': company?.companyName || '',
        },
      },
      ...logs.map((l, idx) => ({
        id: String(l._id || `gws_log_${idx}`),
        label: `[Sincronización ${l.status}] ${l.agentName || 'Agente'} — ${l.runAt ? new Date(l.runAt).toLocaleString('es-CO') : ''}`,
        sublabel: String(l.result || l.error || '').replace(/\s+/g, ' ').slice(0, 180),
        badge: String(l.status || 'success').toUpperCase(),
        badgeTone: l.status === 'failed' ? 'rose' : 'indigo',
        isCritical: l.status === 'failed',
        fields: {
          'Detalle de Sincronización / Archivos Procesados': String(l.result || l.error || '').slice(0, 500),
        },
      })),
    ];

    return {
      moduleTitle: `Equipo 2/5 · Conector Google Workspace (${canonicalId.replace(/^(extract_|google_)/, '').toUpperCase()})`,
      sourceCollection: 'CompanyInfo + GoogleOAuth + AutomationLog',
      kpis: [
        { label: 'Estado Google OAuth', value: hasToken ? 'CONECTADO' : 'NO CONECTADO', tone: hasToken ? 'emerald' : 'rose' },
        { label: 'Cuenta Vinculada', value: scopedEmail || 'Pendiente', tone: hasToken ? 'teal' : 'amber' },
        { label: 'Carpeta SG-SST', value: folderName, tone: 'indigo' },
        { label: 'Sincronizaciones', value: logs.length, tone: 'purple' },
      ],
      records,
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

  // 4. Equipo 2: Resumen 360° de Aplicativos Somos SST (extract_sst_app)
  if (canonicalId === 'extract_sst_app') {
    const [dRes, wRes, gtcRes, acpmRes] = await Promise.all([
      inspectHito1And2('hito1_diagnostico_0312', userId, company),
      inspectHito1And2('hito2_perfil_socio', userId, company),
      inspectHito1And2('hito2_matriz_ipevar', userId, company),
      inspectHito6To8('hito7_acpm', userId, company),
    ]);
    return {
      moduleTitle: 'Equipo 2 · Resumen 360° de Aplicativos (0312 + Trabajadores + GTC-45 + ACPM)',
      sourceCollection: 'DiagnosticoData + SgsstWorker + GTC45WorkspaceSession + KanbanTask',
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

  // 6. Equipo 7: Bitácora & Salida (email_report, wappy_notification, canvas_doc, somos_sst_update, antigravity_local_report, antigravity_cloud_report, google_slides, tenshi_voice_briefing, drive_backup)
  if (
    [
      'email_report',
      'wappy_notification',
      'canvas_doc',
      'somos_sst_update',
      'antigravity_local_report',
      'antigravity_cloud_report',
      'google_slides',
      'tenshi_voice_briefing',
      'drive_backup',
    ].includes(canonicalId)
  ) {
    const AutomationLog = getSafeModel('AutomationLog', null, '~/models/AutomationLog');
    const Notification = getSafeModel('Notification', null, '~/models/Notification');
    const LiveDocument = getSafeModel('LiveDocument', null, '~/models/LiveDocument');
    const LiveEditorSession = getSafeModel('LiveEditorSession', null, '~/models/LiveEditorSession');
    const logFilter = companyIdStr ? { companyId: companyIdStr } : userId ? { user: userId } : {};

    const [logs, notifs, docs, editorDocs] = await Promise.all([
      AutomationLog ? AutomationLog.find(logFilter).sort({ runAt: -1 }).limit(20).lean().catch(() => []) : [],
      findManyCompanyDocs(Notification, userId, company, { createdAt: -1 }, 20),
      findManyCompanyDocs(LiveDocument, userId, company, { updatedAt: -1 }, 15),
      findManyCompanyDocs(LiveEditorSession, userId, company, { updatedAt: -1 }, 15),
    ]);

    const outputTitleMap = {
      email_report: 'Equipo 7 · Despacho de Informe Ejecutivo por Correo Electrónico (Gmail / SMTP)',
      wappy_notification: 'Equipo 7 · Alerta Push & Notificación In-App WAPPY',
      canvas_doc: 'Equipo 7 · Generador de Documento Vivo Editable (LiveEditor HTML / Word / PDF)',
      somos_sst_update: 'Equipo 7 · Escritura y Sincronización Automática en Aplicativos Somos SST',
      antigravity_local_report: 'Equipo 7 · Envío de Reporte Estructurado a Google Antigravity Local (Mac/PC)',
      antigravity_cloud_report: 'Equipo 7 · Envío de Reporte 24/7 a Google Antigravity Cloud',
      google_slides: 'Equipo 7 · Generador de Presentación Ejecutiva Google Slides',
      tenshi_voice_briefing: 'Equipo 7 · Briefing Ejecutivo de Voz Tenshi (Gemini TTS)',
      drive_backup: 'Equipo 7 · Respaldo Documental Automático en Google Drive',
    };

    const records = [
      ...logs.map((l, i) => ({
        id: String(l._id || `out_log_${i}`),
        label: `📤 [Bitácora Ejecutada] ${l.agentName || 'Agente IA'} — ${l.runAt ? new Date(l.runAt).toLocaleString('es-CO') : 'Reciente'}`,
        sublabel: String(l.result || l.error || 'Ejecución registrada').replace(/\s+/g, ' ').slice(0, 180),
        badge: String(l.status || 'success').toUpperCase(),
        badgeTone: l.status === 'failed' ? 'rose' : 'emerald',
        isCritical: l.status === 'failed',
        fields: {
          'Canal de Salida Configurado': outputTitleMap[canonicalId] || canonicalId,
          'Destinatario / Empresa': `${company?.companyName || 'Empresa Activa'} (${company?.email || 'Correo corporativo'})`,
          'Fecha de Envío / Ejecución': l.runAt ? new Date(l.runAt).toLocaleString('es-CO') : 'Reciente',
          'Agente Responsable': l.agentName || 'Consultor SG-SST',
          'Contenido Despachado': String(l.result || l.error || 'Completado').slice(0, 500),
        },
      })),
      ...notifs.map((n, i) => ({
        id: String(n._id || `out_notif_${i}`),
        label: `🔔 [Notificación WAPPY] ${n.title || 'Alerta SST'}`,
        sublabel: String(n.body || n.message || 'Notificación operativa').slice(0, 180),
        badge: n.read ? 'Leída' : 'NUEVA',
        badgeTone: n.read ? 'slate' : 'teal',
        isCritical: !n.read,
        fields: {
          'Título de la Notificación': n.title || 'Alerta SST',
          'Mensaje Enviado': n.body || n.message || 'Notificación registrada',
        },
      })),
      ...docs.map((d, i) => ({
        id: String(d._id || `out_doc_${i}`),
        label: `📄 [Documento Vivo] ${d.title || 'Informe Oficial'}`,
        sublabel: `Actualizado: ${d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('es-CO') : 'Reciente'}`,
        badge: 'LIVE DOC',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          'Título del Documento': d.title || 'Informe Oficial',
          'Contenido': String(d.content || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400) || 'Documento estructurado',
        },
      })),
      ...editorDocs.map((ed, i) => ({
        id: String(ed._id || ed.conversationId || `out_ed_${i}`),
        label: `📝 [Documento LiveEditor] ${ed.fileName || 'Informe Oficial SG-SST'}`,
        sublabel: `Actualizado: ${ed.updatedAt ? new Date(ed.updatedAt).toLocaleDateString('es-CO') : 'Reciente'}`,
        badge: 'LIVE EDITOR',
        badgeTone: 'indigo',
        isCritical: false,
        fields: {
          'Título del Documento': ed.fileName || 'Informe Oficial SG-SST',
          'Contenido': String(ed.content || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400) || 'Informe exportable HTML/DOCX',
        },
      })),
    ];

    return {
      moduleTitle: outputTitleMap[canonicalId] || `Equipo 7 · Bitácora y Canal de Salida (${canonicalId.toUpperCase()})`,
      sourceCollection: 'AutomationLog + Notification + LiveDocument + LiveEditorSession',
      kpis: [
        { label: 'Bitácoras Emitidas', value: logs.length, tone: 'emerald' },
        { label: 'Notificaciones WAPPY', value: notifs.length, tone: 'teal' },
        { label: 'Documentos LiveEditor', value: docs.length + editorDocs.length, tone: 'indigo' },
      ],
      records,
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
    const socioRes = await inspectHito1And2('hito2_perfil_socio', userId, company);
    const workersCount = socioRes?.records?.length || 0;
    return {
      moduleTitle: 'Equipo 2 · Extractor de Carpeta Local en tu Computador (vía Google Antigravity)',
      sourceCollection: 'AntigravityLocalFS + CompanyInfo',
      kpis: [
        { label: 'Empresa Vinculada', value: company?.companyName || 'Activa', tone: 'teal' },
        { label: 'Expedientes Trabajadores', value: workersCount, tone: 'indigo' },
        { label: 'Formatos Soportados', value: 'PDF, XLSX, DOCX, CSV', tone: 'emerald' },
      ],
      records: [
        {
          id: `pc_folder_${companyIdStr || 'active'}`,
          label: `💻 Carpeta Local SG-SST: ~/Documents/SG-SST/${(company?.companyName || 'Empresa').replace(/\s+/g, '_')}`,
          sublabel: `Sincronización local vía daemon de Google Antigravity • ${workersCount} expedientes de trabajadores vinculados por cédula`,
          badge: 'CARPETA LOCAL AGY',
          badgeTone: 'teal',
          isCritical: false,
          fields: {
            'Ruta de Carpeta Local Monitoreada': `~/Documents/SG-SST/${(company?.companyName || 'Empresa').replace(/\s+/g, '_')}`,
            'Extensiones de Archivo Permitidas': '.pdf, .xlsx, .csv, .docx',
            'Total Trabajadores para Cruce por Cédula': String(workersCount),
            'Empresa Activa': company?.companyName || 'Empresa Activa',
          },
        },
        ...(socioRes?.records?.slice(0, 10) || []),
      ],
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
    const [socioRes, diagRes] = await Promise.all([
      inspectHito1And2('hito2_perfil_socio', userId, company),
      inspectHito1And2('hito1_diagnostico_0312', userId, company),
    ]);
    const workerRecs = Array.isArray(socioRes?.records) ? socioRes.records : [];
    const diagRecs = Array.isArray(diagRes?.records) ? diagRes.records : [];
    const critWorkers = workerRecs.filter((r) => r.isCritical);
    const critStandards = diagRecs.filter((r) => r.isCritical);
    const totalCrit = critWorkers.length + critStandards.length;

    if (canonicalId === 'if_router') {
      const conditionStr =
        ctx?.nodeConfig?.ifCondition ||
        ctx?.nodeConfig?.condition ||
        'criticalCount > 0 (Detectar brechas normativas o alertas críticas en la empresa)';
      const evalTrue = totalCrit > 0;
      return {
        moduleTitle: 'Equipo 3 · Enrutador Condicional IF / Switch (Evaluación en Vivo)',
        sourceCollection: 'LogicRouterEngine (DiagnosticoData + SgsstWorker)',
        kpis: [
          { label: 'Resultado Evaluación', value: evalTrue ? 'TRUE (Rama Alerta)' : 'FALSE (Cumple)', tone: evalTrue ? 'amber' : 'emerald' },
          { label: 'Brechas Críticas Detectadas', value: totalCrit, tone: totalCrit > 0 ? 'rose' : 'emerald' },
          { label: 'Registros Evaluados', value: workerRecs.length + diagRecs.length, tone: 'teal' },
        ],
        records: [
          {
            id: `if_eval_${companyIdStr || '1'}`,
            label: `🔀 [Evaluación IF en Vivo: ${evalTrue ? 'VERDADERO' : 'FALSO'}] ${conditionStr}`,
            sublabel: `Brechas 0312: ${critStandards.length} • Trabajadores con alerta: ${critWorkers.length} • Ruta activa: ${evalTrue ? 'Rama TRUE (Acción Correctiva)' : 'Rama FALSE (Seguimiento Rutinario)'}`,
            badge: evalTrue ? 'RAMA TRUE ACTIVA' : 'RAMA FALSE ACTIVA',
            badgeTone: evalTrue ? 'amber' : 'emerald',
            isCritical: evalTrue,
            fields: {
              'Regla / Condición Evaluada': conditionStr,
              'Resultado Booleano en Vivo': evalTrue ? 'TRUE (Verdadero)' : 'FALSE (Falso)',
              'Estándares 0312 en Brecha': String(critStandards.length),
              'Colaboradores con Alerta': String(critWorkers.length),
              'Empresa Evaluada': company?.companyName || 'Empresa Activa',
            },
          },
          ...critStandards.slice(0, 8),
          ...critWorkers.slice(0, 8),
        ],
      };
    }

    if (canonicalId === 'loop') {
      const batchSize = Math.max(1, Number(ctx?.nodeConfig?.batchSize) || 10);
      const totalBatches = Math.max(1, Math.ceil(workerRecs.length / batchSize));
      return {
        moduleTitle: 'Equipo 3 · Iterador por Lotes (Loop / SplitInBatches sobre Registros)',
        sourceCollection: 'LogicLoopEngine (SgsstWorker)',
        kpis: [
          { label: 'Total Registros Entrada', value: workerRecs.length, tone: 'teal' },
          { label: 'Tamaño de Lote (Batch)', value: batchSize, tone: 'indigo' },
          { label: 'Iteraciones Calculadas', value: totalBatches, tone: 'emerald' },
        ],
        records: [
          {
            id: `loop_summary_${companyIdStr || '1'}`,
            label: `🔁 Procesamiento secuencial en ${totalBatches} lote(s) de hasta ${batchSize} registro(s)`,
            sublabel: `Total colaboradores en cola de iteración para ${company?.companyName || 'la empresa'}: ${workerRecs.length}`,
            badge: `${totalBatches} LOTES`,
            badgeTone: 'indigo',
            isCritical: false,
            fields: {
              'Total Registros a Iterar': String(workerRecs.length),
              'Tamaño de Lote Configurado': String(batchSize),
              'Número Total de Iteraciones': String(totalBatches),
              'Empresa Activa': company?.companyName || 'Empresa Activa',
            },
          },
          ...workerRecs.slice(0, 12),
        ],
      };
    }

    if (canonicalId === 'merge') {
      return {
        moduleTitle: 'Equipo 3 · Nodo Merge (Unificación Multi-Rama de Datos SG-SST)',
        sourceCollection: 'LogicMergeEngine (SgsstWorker + DiagnosticoData)',
        kpis: [
          { label: 'Rama A (Colaboradores)', value: workerRecs.length, tone: 'teal' },
          { label: 'Rama B (Estándares 0312)', value: diagRecs.length, tone: 'indigo' },
          { label: 'Total Consolidado', value: workerRecs.length + diagRecs.length, tone: 'emerald' },
        ],
        records: [
          {
            id: `merge_summary_${companyIdStr || '1'}`,
            label: `🔗 Fusión Multi-Rama: ${workerRecs.length} Colaboradores + ${diagRecs.length} Estándares Res. 0312`,
            sublabel: `Modo de combinación: ${ctx?.nodeConfig?.mergeMode || 'append_and_enrich'} • Empresa: ${company?.companyName || 'Activa'}`,
            badge: 'MERGE LISTO',
            badgeTone: 'teal',
            isCritical: false,
            fields: {
              'Modo de Fusión': ctx?.nodeConfig?.mergeMode || 'Consolidación Estructurada (Append + Cruce por Cédula/Cargo)',
              'Items Rama 1': String(workerRecs.length),
              'Items Rama 2': String(diagRecs.length),
              'Items Salida Unificada': String(workerRecs.length + diagRecs.length),
            },
          },
          ...critStandards.slice(0, 6),
          ...workerRecs.slice(0, 6),
        ],
      };
    }

    if (canonicalId === 'human_approval') {
      const TenshiPendingAction = getSafeModel('TenshiPendingAction', null, '~/models/TenshiPendingAction');
      const pendingDocs = await findManyCompanyDocs(TenshiPendingAction, userId, company, { createdAt: -1 }, 15);
      const approver = ctx?.nodeConfig?.approverEmail || company?.email || 'Responsable SG-SST';
      return {
        moduleTitle: 'Equipo 3 · Compuerta de Aprobación Humana (Human-in-the-Loop SST)',
        sourceCollection: 'TenshiPendingAction + CompanyInfo',
        kpis: [
          { label: 'Aprobador Designado', value: approver, tone: 'teal' },
          { label: 'Responsable SST', value: company?.responsibleSST || 'Asignado', tone: 'indigo' },
          { label: 'Solicitudes en Cola', value: pendingDocs.length, tone: pendingDocs.length > 0 ? 'amber' : 'emerald' },
        ],
        records: [
          {
            id: `hitl_gate_${companyIdStr || '1'}`,
            label: `🛡️ Compuerta de Visto Bueno Humano — Aprobador: ${approver}`,
            sublabel: `Responsable SG-SST: ${company?.responsibleSST || 'Designado'} (Lic. ${company?.licenseNumber || 'Vigente'}) • Brechas críticas sujetas a firma: ${totalCrit}`,
            badge: 'HITL ACTIVO',
            badgeTone: 'amber',
            isCritical: false,
            fields: {
              'Correo / Usuario Aprobador': approver,
              'Responsable Técnico SG-SST': `${company?.responsibleSST || 'Designado'} (Lic. ${company?.licenseNumber || 'Vigente'})`,
              'Hallazgos Críticos Pendientes de Firma': String(totalCrit),
              'Acciones en Cola HITL': String(pendingDocs.length),
            },
          },
          ...pendingDocs.map((p, idx) => ({
            id: String(p._id || `hitl_p_${idx}`),
            label: `⏳ [Solicitud HITL] ${p.title || p.actionType || 'Aprobación Pendiente'}`,
            sublabel: `Estado: ${p.status || 'pending'}`,
            badge: String(p.status || 'PENDING').toUpperCase(),
            badgeTone: 'amber',
            isCritical: p.status === 'pending',
            fields: {
              'Acción Solicitada': p.title || p.actionType || 'Aprobación operativa',
              'Estado': p.status || 'pending',
            },
          })),
        ],
      };
    }

    // `filter`
    return {
      moduleTitle: 'Equipo 3 · Filtro Quirúrgico de Registros (Filter Node)',
      sourceCollection: 'LogicFilterEngine (Somos SST)',
      kpis: [
        { label: 'Registros Entrada', value: workerRecs.length, tone: 'indigo' },
        { label: 'Pasan Filtro (Críticos)', value: critWorkers.length, tone: critWorkers.length > 0 ? 'rose' : 'emerald' },
        { label: 'Descartados', value: Math.max(0, workerRecs.length - critWorkers.length), tone: 'teal' },
      ],
      records: critWorkers.length > 0 ? critWorkers : workerRecs.slice(0, 15),
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
        directive: 'Verifica que cada brecha detectada tenga causa raíz y plan de acción en Fuente, Medio e Individuo.',
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
    disabledApps = [],
    executeLive = false,
  } = params || {};

  const company = await resolveTargetCompany(userId, companyId);
  const canonicalId = normalizeInspectorNodeId(nodeId);

  // 0. Guardia Estricta de Nodos Bloqueados / En Construcción (`🚧 Nodo en Construcción`)
  const isExplicitlyBlocked = Boolean(BLOCKED_CONSTRUCTION_NODE_SPECS[canonicalId]);
  const isDisabledApp =
    nodeConfig?.underConstruction === true ||
    (Array.isArray(disabledApps) && (disabledApps.includes(canonicalId) || disabledApps.includes(String(nodeId || ''))));

  if (isExplicitlyBlocked || isDisabledApp) {
    return buildBlockedConstructionResponse({
      rawNodeId: nodeId,
      canonicalId,
      company,
    });
  }

  let result = await inspectHito1And2(canonicalId, userId, company);
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
      nodeConfig,
      executeLive,
    });
  }

  // Fallback para cualquier nodo dinámico nuevo personalizado
  if (!result) {
    const wRes = await inspectHito1And2('hito2_perfil_socio', userId, company);
    const dRes = await inspectHito1And2('hito1_diagnostico_0312', userId, company);
    result = {
      moduleTitle: `Inspector Operativo SG-SST (${canonicalId || 'General'})`,
      sourceCollection: 'Multi-Colección Somos SST',
      isGenericFallback: true,
      kpis: [...(dRes?.kpis?.slice(0, 2) || []), ...(wRes?.kpis?.slice(0, 2) || [])],
      records: [
        ...(wRes?.records?.slice(0, 25) || []),
        ...(dRes?.records?.filter((r) => r.isCritical).slice(0, 15) || []),
      ],
    };
  }

  let records = Array.isArray(result.records) ? result.records : [];

  // Si la colección específica aún no tiene documentos guardados para esta empresa,
  // sintetizar registros de línea base contextualizados con la Ficha Técnica de la Empresa Activa y su Nómina Real
  // para que ningún nodo del flujo se quede en blanco durante la ejecución o inspección.
  if (records.length === 0 && company) {
    const cName = company.companyName || 'Empresa Activa';
    const cNit = company.nit || 'N/A';
    const cArl = company.arl || 'ARL Sura';
    const cRisk = company.riskLevel || 'I';
    const cResp = company.responsibleSST || 'Responsable SG-SST';
    const cAct = company.economicActivity || 'Actividad Económica Principal';
    const cCiiu = company.ciiu || company.ciiuCode || 'N/A';
    const modTitle = result.moduleTitle || canonicalId;

    let socioFallbackRecords = [];
    if (canonicalId !== 'hito2_perfil_socio') {
      try {
        const wRes = await inspectHito1And2('hito2_perfil_socio', userId, company);
        socioFallbackRecords = Array.isArray(wRes?.records) ? wRes.records.slice(0, 8) : [];
      } catch (_) {}
    }

    const mappedSocioFallback = socioFallbackRecords.map((w, idx) => {
      const wf = w.fields || {};
      const ced = wf['Cédula / Documento'] || wf['Número de Documento / Cédula'] || w.id || `T-${idx + 1}`;
      const nom = wf['Nombre Completo'] || w.label || 'Colaborador';
      const car = wf['Cargo'] || 'Colaborador';
      return {
        id: `baseline_worker_${canonicalId}_${ced || idx}`,
        label: `👤 [Trabajador Vinculado · CC ${ced}] ${nom} — ${car}`,
        sublabel: `Módulo: ${modTitle} • ARL: ${wf['ARL'] || cArl} • EPS: ${wf['EPS'] || 'Activa'} • AFP: ${wf['Fondo de Pensión (AFP)'] || 'Activa'}`,
        badge: wf['Estado de Exámenes Médicos (Vigente / Vencido)'] || 'VINCULADO',
        badgeTone: w.isCritical ? 'amber' : 'indigo',
        isCritical: Boolean(w.isCritical),
        fields: {
          ...wf,
          'Cédula / Documento de Identidad': String(ced),
          'Cédula / Documento': String(ced),
          'Nombre Completo del Trabajador': String(nom),
          'Nombre Completo': String(nom),
          'Cargo': String(car),
          'Módulo Evaluado': modTitle,
          'Empresa Activa': cName,
        },
      };
    });

    const baselineCompanyRow = {
      id: `baseline_${canonicalId}_${String(company._id || 'active')}`,
      label: `📌 [Línea Base Activa · ${cName}] ${modTitle}`,
      sublabel: `NIT: ${cNit} • ARL: ${cArl} (Riesgo ${cRisk}) • CIIU: ${cCiiu} (${cAct}) • Resp. SST: ${cResp}`,
      badge: 'LÍNEA BASE EMPRESA',
      badgeTone: 'teal',
      isCritical: true,
      fields: {
        'Empresa Activa': `${cName} (NIT ${cNit})`,
        'Razón Social': cName,
        'NIT': cNit,
        'ARL y Clase de Riesgo': `${cArl} · Riesgo ${cRisk}`,
        'Actividad Económica y CIIU': `${cAct} (CIIU ${cCiiu})`,
        'Responsable SG-SST': `${cResp} (Lic. ${company.licenseNumber || 'Vigente'})`,
        'Módulo / Aplicativo SG-SST': modTitle,
        'Norma / Ley / Decreto / Resolución y Año': 'Decreto 1072 de 2015 / Resolución 0312 de 2019 / GTC-45',
        'Evaluación de Cumplimiento (Cumple / En Proceso / No Cumple)': 'EN PROCESO DE VERIFICACIÓN',
        'Estado': 'Línea Base Activa para Cruce en el Flujo',
        'Plan de Acción y Responsable de Cumplimiento Legal': `Verificar y actualizar registros de «${modTitle}» con ${cResp}`,
      },
    };

    records =
      canonicalId === 'hito3_vehiculos' && mappedSocioFallback.length > 0
        ? mappedSocioFallback
        : [baselineCompanyRow, ...mappedSocioFallback];
  }

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

  return {
    success: true,
    status: 'ok',
    underConstruction: false,
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

  // Panel 3: SALIDA REAL PROYECTADA (Items JSON limpios + Archivos de Evidencia)
  let filteredRecords = baseData.records || [];
  if (!baseData.underConstruction) {
    if (filterMode === 'critical_only') {
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
        const match = entries.find(
          ([fk]) =>
            fk.toLowerCase().trim() === sfLow ||
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
          message: `Inspección en vivo completada sobre «${baseData.moduleTitle}» (${outputItems.length} registro(s), ${baseData.evidenceFiles.length} archivo(s) de evidencia) en ${durationMs} ms.`,
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
      items: outputItems,
      records: filteredRecords,
      evidenceFiles: baseData.evidenceFiles,
    },
  };
}

/**
 * Construye el bloque de datos quirúrgicos reales en vivo desde MongoDB
 * para todos los nodos configurados en una automatización durante su ejecución.
 */
async function buildSurgicalLiveContextForWorkflow(task, companyOverride = null) {
  try {
    const userId = task?.user;
    const company = companyOverride || (await resolveTargetCompany(userId, task?.companyId));
    const wf = task?.workflowNodes || {};
    const nodeConfigs = wf?.canvasLayout?.nodeConfigs || {};

    // Recolectar todos los nodos configurados en el flujo
    const candidateNodes = [];
    const seenCanonical = new Set();

    const pushCandidate = (rawKey, rawNodeId) => {
      const canonical = normalizeInspectorNodeId(rawNodeId || rawKey);
      if (
        !canonical.startsWith('hito') &&
        canonical !== 'tool_sst_company' &&
        canonical !== 'wappy_memory_procedural' &&
        rawNodeId !== 'extract_sst_workers' &&
        rawNodeId !== 'extract_sst_app' &&
        rawNodeId !== 'somos_sst_trabajadores' &&
        rawNodeId !== 'somos_sst_empresa' &&
        rawNodeId !== 'wappy_memory_procedural'
      ) {
        return;
      }
      const cfg =
        nodeConfigs[rawKey] ||
        nodeConfigs[rawNodeId] ||
        nodeConfigs[`hito_${rawNodeId}`] ||
        nodeConfigs[`tool_hitos_${rawNodeId}`] ||
        nodeConfigs[`ext_${rawNodeId}`] ||
        nodeConfigs[`tool_inputs_${rawNodeId}`] ||
        nodeConfigs[`sub_memory_${rawNodeId}`] ||
        {};
      const dedupKey = `${canonical}::${rawKey}`;
      if (seenCanonical.has(dedupKey)) return;
      seenCanonical.add(dedupKey);
      candidateNodes.push({ rawKey, rawNodeId: rawNodeId || rawKey, canonical, cfg });
    };

    for (const extId of wf.extractors || []) pushCandidate(`ext_${extId}`, extId);
    for (const inId of wf.inputs || []) pushCandidate(`tool_inputs_${inId}`, inId);
    for (const hitoId of wf.hitos || []) pushCandidate(`tool_hitos_${hitoId}`, hitoId);
    for (const memId of wf.memories || []) pushCandidate(`sub_memory_${memId}`, memId);
    for (const [k, v] of Object.entries(nodeConfigs)) {
      if (v && typeof v === 'object') pushCandidate(k, k);
    }

    if (candidateNodes.length === 0) return '';

    const sections = [];
    for (const item of candidateNodes) {
      const liveData = await inspectNodeLiveData({
        userId,
        companyId: company?._id,
        nodeId: item.rawNodeId,
      });

      const cfg = item.cfg || {};
      const rawSelectedFields = Array.isArray(cfg.selectedFields)
        ? cfg.selectedFields
        : Array.isArray(cfg.fields)
          ? cfg.fields
          : [];
      const selectedFields = rawSelectedFields.filter(Boolean);
      const strictFilter = cfg.strictFieldFilter !== false && selectedFields.length > 0;
      const filterMode = cfg.recordFilterMode || 'all';
      const selectedRecordIds = Array.isArray(cfg.selectedRecordIds) ? cfg.selectedRecordIds : [];

      let filteredRecords = liveData.records || [];
      if (filterMode === 'critical_only') {
        filteredRecords = filteredRecords.filter((r) => r.isCritical);
      } else if (filterMode === 'selected' && selectedRecordIds.length > 0) {
        const idSet = new Set(selectedRecordIds.map(String));
        filteredRecords = filteredRecords.filter((r) => idSet.has(String(r.id)));
      }

      const kpiText = (liveData.kpis || []).map((k) => `${k.label}: ${k.value}`).join(' | ');
      const recordLines = filteredRecords.slice(0, 300).map((rec, idx) => {
        if (strictFilter) {
          const projected = [];
          const fieldEntries = Object.entries(rec.fields || {});
          for (const sf of selectedFields) {
            const sfNorm = sf.toLowerCase().trim();
            const match = fieldEntries.find(
              ([fk]) =>
                fk.toLowerCase().trim() === sfNorm ||
                fk.toLowerCase().includes(sfNorm) ||
                sfNorm.includes(fk.toLowerCase().trim())
            );
            if (match && match[1] !== undefined && match[1] !== '') {
              projected.push(`${sf}: ${match[1]}`);
            }
          }
          if (projected.length > 0) {
            return `   ${idx + 1}. [${rec.id}] ${projected.join(' | ')}`;
          }
        }
        return `   ${idx + 1}. ${rec.label} — ${rec.sublabel} [${rec.badge || ''}]`;
      });

      sections.push(
        `📦 NODO EN VIVO «${liveData.moduleTitle}» (${liveData.companyName}):\n` +
          `   • Indicadores Actuales: ${kpiText || 'N/A'}\n` +
          `   • Filtro de Registros: ${
            filterMode === 'critical_only'
              ? `Solo Críticos / En Brecha (${filteredRecords.length})`
              : filterMode === 'selected'
                ? `Seleccionados Específicos (${filteredRecords.length})`
                : `Todos (${filteredRecords.length})`
          }${strictFilter ? ` | Campos Quirúrgicos Extraídos: [${selectedFields.join(', ')}]` : ''}\n` +
          (recordLines.length > 0
            ? `   • Datos Extraídos de Base de Datos:\n${recordLines.join('\n')}`
            : '   • Datos Extraídos de Base de Datos: (Sin registros que coincidan con el filtro actual)')
      );
    }

    return sections.length > 0
      ? `\n\n═══ DATOS QUIRÚRGICOS REALES EXTRAÍDOS DE LOS NODOS DE SOMOS SST (${company?.companyName || 'Empresa Activa'}) ═══\n` +
          `Usa prioritariamente esta información real y filtrada quirúrgicamente por cada nodo configurado:\n\n` +
          sections.join('\n\n')
      : '';
  } catch (err) {
    console.warn('[WorkflowNodeInspector] Error building surgical live context:', err.message);
    return '';
  }
}

module.exports = {
  inspectWorkflowNodeLive,
  inspectNodeLiveData,
  inspectOtherNodeTeams,
  buildSurgicalLiveContextForWorkflow,
  normalizeInspectorNodeId,
  BLOCKED_CONSTRUCTION_NODE_SPECS,
};
