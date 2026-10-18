'use strict';

const mongoose = require('mongoose');
const { google } = require('googleapis');
const xlsx = require('xlsx');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { logger } = require('~/config');
const GoogleDriveTool = require('~/app/clients/tools/structured/GoogleDrive');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS } = require('./sgsstGemini');
const { cleanAndParseJson } = require('./fileExtractorHelper');

const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
const PESVWorkspaceSession = require('~/models/PESVWorkspaceSession');
const ChemicalCompatibilitySession = require('~/models/ChemicalCompatibilitySession');
const SgsstChemicalData = require('~/models/SgsstChemicalData');
const DiagnosticoData = require('~/models/DiagnosticoData');
const CompanyInfo = require('~/models/CompanyInfo');

// Modelos defensivos por si no están precargados en mongoose
const AnalisisVulnerabilidadData =
  mongoose.models.AnalisisVulnerabilidadData ||
  mongoose.model(
    'AnalisisVulnerabilidadData',
    new mongoose.Schema(
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
        formData: { type: Object, default: {} },
        evaluadoresList: { type: Array, default: [] },
        images: { type: Object, default: {} },
        video: { type: String, default: null },
        updatedAt: { type: Date, default: Date.now },
      },
      { timestamps: true }
    )
  );

const MatrizPeligrosData =
  mongoose.models.MatrizPeligrosData ||
  mongoose.model(
    'MatrizPeligrosData',
    new mongoose.Schema(
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
        procesos: { type: Array, default: [] },
        version: { type: Number, default: 1 },
      },
      { timestamps: true }
    )
  );

/**
 * Normaliza texto eliminando acentos, tildes y caracteres especiales
 */
function normalizeText(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pasa texto a Sentence Case
 */
function toSentenceCase(str) {
  if (!str) return '';
  const trimmed = String(str).trim();
  if (trimmed.length === 0) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Normaliza Sí / No
 */
function normalizeSiNo(val, defaultVal = 'No') {
  if (val === undefined || val === null || val === '') return defaultVal;
  const s = normalizeText(val);
  if (s === 'si' || s === 's' || s === 'yes' || s === 'true' || s === '1' || s === 'x' || s.startsWith('aplica')) {
    return 'Sí';
  }
  if (s === 'no' || s === 'n' || s === 'false' || s === '0' || s.includes('ningun') || s === 'na') {
    return 'No';
  }
  return String(val).trim();
}

/**
 * Normaliza fechas
 */
function normalizeDateStr(val) {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number' && val > 10000 && val < 80000) {
    const utcDays = Math.floor(val - 25569);
    const dateInfo = new Date(utcDays * 86400 * 1000);
    if (!isNaN(dateInfo.getTime())) {
      return dateInfo.toISOString().split('T')[0];
    }
  }
  const s = String(val).trim();
  const dmyMatch = s.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (dmyMatch) {
    let [, d, m, y] = dmyMatch;
    if (y.length === 2) y = '20' + y;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return s;
}

/**
 * Calcula fórmulas oficiales GTC-45 (NP, Interpretación NP, NR, Interpretación NR, Aceptabilidad)
 */
function computeGtc45Valuation(ndRaw, neRaw, ncRaw) {
  const ndNum = parseInt(String(ndRaw).replace(/[^\d]/g, ''), 10);
  const neNum = parseInt(String(neRaw).replace(/[^\d]/g, ''), 10);
  const ncNum = parseInt(String(ncRaw).replace(/[^\d]/g, ''), 10);

  const nd = !isNaN(ndNum) && [0, 2, 6, 10].includes(ndNum) ? ndNum : (!isNaN(ndNum) ? ndNum : 2);
  const ne = !isNaN(neNum) && [1, 2, 3, 4].includes(neNum) ? neNum : (!isNaN(neNum) ? neNum : 2);
  const nc = !isNaN(ncNum) && [10, 25, 60, 100].includes(ncNum) ? ncNum : (!isNaN(ncNum) ? ncNum : 25);

  const np = nd * ne;
  let interpretacion_np = 'Bajo (B)';
  if (np >= 24) interpretacion_np = 'Muy Alto (MA)';
  else if (np >= 10) interpretacion_np = 'Alto (A)';
  else if (np >= 6) interpretacion_np = 'Medio (M)';

  const nr = np * nc;
  let interpretacion_nr = 'IV';
  let aceptabilidad = 'Aceptable';

  if (nr >= 600) {
    interpretacion_nr = 'I';
    aceptabilidad = 'No Aceptable';
  } else if (nr >= 150) {
    interpretacion_nr = 'II';
    aceptabilidad = 'No Aceptable o Aceptable con Control Específico';
  } else if (nr >= 40) {
    interpretacion_nr = 'III';
    aceptabilidad = 'Mejorable';
  } else {
    interpretacion_nr = 'IV';
    aceptabilidad = 'Aceptable';
  }

  return { nd, ne, np, interpretacion_np, nc, nr, interpretacion_nr, aceptabilidad };
}

/**
 * Extrae texto y hojas tabulares de un archivo en Google Drive
 */
async function extractDriveFileData(drive, fileMeta) {
  const { id: fileId, name, mimeType } = fileMeta;
  let buffer;

  if (mimeType === 'application/vnd.google-apps.document') {
    const res = await drive.files.export({ fileId, mimeType: 'text/plain' });
    return { fileName: name, mimeType, text: String(res.data || '').trim(), rowsBySheet: [] };
  }

  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    const res = await drive.files.export(
      { fileId, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { responseType: 'arraybuffer' }
    );
    buffer = Buffer.from(res.data);
  } else {
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
    buffer = Buffer.from(res.data);
  }

  const lowerName = (name || '').toLowerCase();
  const isSpreadsheet =
    mimeType === 'application/vnd.google-apps.spreadsheet' ||
    mimeType?.includes('spreadsheet') ||
    mimeType?.includes('excel') ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.csv');

  if (isSpreadsheet) {
    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: false });
    let allText = '';
    const rowsBySheet = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawMatrix = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      let headerRowIndex = 0;
      let bestScore = 0;

      for (let r = 0; r < Math.min(rawMatrix.length, 25); r++) {
        const rowCells = Array.isArray(rawMatrix[r]) ? rawMatrix[r] : [];
        const joinedRow = normalizeText(rowCells.join(' '));
        let score = 0;
        if (joinedRow.includes('peligro') || joinedRow.includes('riesgo')) score += 3;
        if (joinedRow.includes('proceso') || joinedRow.includes('actividad') || joinedRow.includes('zona')) score += 2;
        if (joinedRow.includes('control') || joinedRow.includes('deficiencia') || joinedRow.includes('consecuencia')) score += 2;
        if (joinedRow.includes('quimic') || joinedRow.includes('vehicul') || joinedRow.includes('amenaza') || joinedRow.includes('estandar')) score += 2;
        if (score > bestScore) {
          bestScore = score;
          headerRowIndex = r;
        }
      }

      const jsonRows = xlsx.utils.sheet_to_json(sheet, { range: headerRowIndex, defval: '' });
      const csvText = xlsx.utils.sheet_to_csv(sheet, { blankrows: false });

      if (csvText && csvText.trim()) {
        allText += `\n--- HOJA: ${sheetName} (Archivo: ${name}) ---\n${csvText}\n`;
      }
      if (jsonRows.length > 0) {
        rowsBySheet.push({ sheetName, fileName: name, rows: jsonRows });
      }
    }

    return { fileName: name, mimeType, text: allText.trim(), rowsBySheet };
  }

  if (mimeType?.includes('wordprocessingml') || lowerName.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return { fileName: name, mimeType, text: (result.value || '').trim(), rowsBySheet: [] };
  }

  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const pdfData = await pdfParse(buffer);
    return { fileName: name, mimeType, text: (pdfData.text || '').trim(), rowsBySheet: [] };
  }

  return { fileName: name, mimeType, text: buffer.toString('utf-8').trim(), rowsBySheet: [] };
}

/**
 * Busca archivos relevantes del Hito 1 en Google Drive
 */
async function findHito1FilesInDrive({ userId, modulo = 'auto', carpeta, archivo, fileId }) {
  const driveTool = new GoogleDriveTool({ userId, req: { user: { id: userId } } });
  const auth = await driveTool.getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  if (fileId && String(fileId).trim().length > 5) {
    const meta = await drive.files.get({
      fileId: String(fileId).trim(),
      fields: 'id, name, mimeType, modifiedTime',
    });
    return { drive, files: [meta.data], matchedFolder: null };
  }

  let folderId = null;
  let matchedFolder = null;

  if (carpeta && String(carpeta).trim().length > 1) {
    const normCarpeta = normalizeText(carpeta);
    const folderRes = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id, name)',
      pageSize: 50,
    });
    const candidateFolders = folderRes.data.files || [];
    const match = candidateFolders.find((f) => normalizeText(f.name).includes(normCarpeta));
    if (match) {
      folderId = match.id;
      matchedFolder = match.name;
    }
  }

  const queryParts = ['trashed = false'];
  if (folderId) {
    queryParts.push(`'${folderId}' in parents`);
  }

  const res = await drive.files.list({
    q: queryParts.join(' and '),
    pageSize: 100,
    fields: 'files(id, name, mimeType, modifiedTime, parents)',
  });

  const allFiles = res.data.files || [];
  const normArchivo = archivo ? normalizeText(archivo) : '';

  // Diccionario de palabras clave por aplicativo de Hito 1
  const moduleKeywords = {
    gtc45: ['gtc45', 'gtc 45', 'ipevr', 'ipevar', 'matriz peligros', 'matriz de peligros', 'matriz riesgos', 'identificacion peligros', 'peligros'],
    pesv: ['pesv', 'riesgos viales', 'seguridad vial', 'matriz vial', 'riesgo vial', 'vial'],
    compatibilidad: ['compatibilidad', 'quimic', 'sustancias quimicas', 'sga', 'inventario quimico', 'fds'],
    vulnerabilidad: ['vulnerabilidad', 'diamante', 'amenazas', 'analisis de vulnerabilidad', 'emergencias', 'ppre'],
    diagnostico: ['diagnostico', '0312', 'estandares minimos', 'autoevaluacion', 'evaluacion inicial'],
    responsable: ['responsable sst', 'asignacion responsable', 'licencia sst', 'lider sst', 'encargado sst'],
  };

  const targetKeywords = moduleKeywords[modulo] || Object.values(moduleKeywords).flat();

  let matchingFiles = allFiles.filter((f) => {
    const nf = normalizeText(f.name);
    if (normArchivo) return nf.includes(normArchivo);
    return targetKeywords.some((kw) => nf.includes(kw));
  });

  if (matchingFiles.length === 0 && normArchivo) {
    matchingFiles = allFiles.filter((f) => {
      const nf = normalizeText(f.name);
      const words = normArchivo.split(/\s+/).filter((w) => w.length > 2);
      return words.some((w) => nf.includes(w));
    });
  }

  return { drive, files: matchingFiles, matchedFolder };
}

/**
 * ─── SUB-PROCESADOR 1: MATRIZ IPEVR (GTC-45) ──────────────────────────────────
 */
async function processGtc45File({ fileData, userId, companyId, existingRows = [] }) {
  const { fileName, text, rowsBySheet } = fileData;
  let rows = [];

  // Mapeo determinista si hay filas estructuradas
  for (const sheet of rowsBySheet) {
    for (const r of sheet.rows) {
      if (!r || typeof r !== 'object') continue;
      const entries = Object.entries(r);
      const getVal = (keywords, exclude = []) => {
        for (const [k, v] of entries) {
          if (v === undefined || v === null || String(v).trim() === '') continue;
          const nk = normalizeText(k);
          if (exclude.some((ex) => nk.includes(ex))) continue;
          if (
            keywords.some((kw) => {
              if (nk === kw) return true;
              if (kw.length <= 2) return nk.split(/\s+/).includes(kw);
              return nk.includes(kw);
            })
          ) {
            return String(v).trim();
          }
        }
        return '';
      };

      const peligro_descripcion = getVal(['peligro descripcion', 'descripcion peligro', 'peligro', 'factor riesgo', 'descripcion del peligro']);
      const actividad = getVal(['actividad', 'labor', 'actividad evaluada']);
      if (!peligro_descripcion && !actividad) continue;

      const nd = getVal(['nd', 'nivel deficiencia', 'nivel de deficiencia']);
      const ne = getVal(['ne', 'nivel exposicion', 'nivel de exposicion']);
      const nc = getVal(['nc', 'nivel consecuencia', 'nivel de consecuencia']);
      const valuation = computeGtc45Valuation(nd, ne, nc);

      rows.push({
        id: `gtc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        proceso: toSentenceCase(getVal(['proceso', 'macroproceso', 'area']) || 'Operaciones'),
        zona: toSentenceCase(getVal(['zona', 'lugar', 'area', 'sede', 'sitio']) || 'Instalaciones'),
        actividad: toSentenceCase(actividad || 'Actividad Operativa'),
        tareas: toSentenceCase(getVal(['tareas', 'tarea', 'operaciones']) || actividad),
        rutinaria: normalizeSiNo(getVal(['rutinaria', 'es rutinaria', 'rutina']), 'Sí'),
        peligro_clasificacion: toSentenceCase(getVal(['clasificacion peligro', 'clasificacion', 'tipo peligro', 'clasificacion del peligro']) || 'Condiciones de seguridad'),
        peligro_descripcion: toSentenceCase(peligro_descripcion || 'Riesgo evaluado'),
        efectos_posibles: toSentenceCase(getVal(['efectos posibles', 'efectos', 'consecuencias', 'danos salud']) || 'Lesiones osteomusculares o accidentes'),
        cargo: toSentenceCase(getVal(['cargo', 'puesto', 'rol expuesto', 'ocupacion']) || 'Operativo General'),
        controles_fuente: getVal(['controles fuente', 'fuente', 'controles en la fuente']) || 'Ninguno reportado',
        controles_medio: getVal(['controles medio', 'medio', 'controles en el medio']) || 'Ninguno reportado',
        controles_individuo: getVal(['controles individuo', 'individuo', 'epp', 'controles en el individuo']) || 'Uso de EPP básico',
        ...valuation,
        nro_expuestos: parseInt(getVal(['numero expuestos', 'expuestos', 'nro expuestos']), 10) || 1,
        peor_consecuencia: toSentenceCase(getVal(['peor consecuencia', 'consecuencia mayor']) || 'Incapacidad permanente o muerte'),
        requisito_legal: normalizeSiNo(getVal(['requisito legal', 'legal', 'cumple norma']), 'Sí'),
        medida_eliminacion: getVal(['eliminacion', 'medida eliminacion']) || 'No aplica',
        medida_sustitucion: getVal(['sustitucion', 'medida sustitucion']) || 'No aplica',
        medida_ingenieria: getVal(['ingenieria', 'controles ingenieria', 'medidas ingenieria']) || 'Inspección periódica y mantenimiento',
        medida_administrativa: getVal(['administrativo', 'controles administrativos', 'senalizacion', 'capacitacion']) || 'Procedimiento seguro y socialización',
        medida_eppu: getVal(['epp', 'equipos de proteccion', 'elementos proteccion']) || 'Dotación de EPP certificado',
      });
    }
  }

  // Si no se extrajeron filas estructuradas y hay texto plano/PDF, usar Gemini 3.5 Flash-Lite
  if (rows.length === 0 && text && text.length > 50) {
    const prompt = `Analiza el siguiente texto de SG-SST (Colombia) correspondiente a identificación de peligros y evaluación de riesgos bajo GTC-45:2012.
Extrae TODOS los peligros evaluados en formato JSON estructurado.

TEXTO:
"""
${text.slice(0, 15000)}
"""

Devuelve un JSON estrictamente válido:
{
  "filas": [
    {
      "proceso": "string",
      "zona": "string",
      "actividad": "string",
      "tareas": "string",
      "rutinaria": "Sí" o "No",
      "peligro_clasificacion": "Biológico|Físico|Químico|Biomecánico|Psicosocial|Condiciones de seguridad|Fenómenos naturales",
      "peligro_descripcion": "string",
      "efectos_posibles": "string",
      "cargo": "string",
      "controles_fuente": "string",
      "controles_medio": "string",
      "controles_individuo": "string",
      "nd": 0 | 2 | 6 | 10,
      "ne": 1 | 2 | 3 | 4,
      "nc": 10 | 25 | 60 | 100,
      "nro_expuestos": number,
      "peor_consecuencia": "string",
      "requisito_legal": "Sí" o "No",
      "medida_eliminacion": "string",
      "medida_sustitucion": "string",
      "medida_ingenieria": "string",
      "medida_administrativa": "string",
      "medida_eppu": "string"
    }
  ]
}`;

    try {
      const response = await generateWithKeyRotation({
        prompt,
        models: ['gemini-3.5-flash-lite', 'gemini-3.6-flash'],
        temperature: 0.1,
      });
      const parsed = cleanAndParseJson(response.text);
      if (parsed && Array.isArray(parsed.filas)) {
        for (const item of parsed.filas) {
          const val = computeGtc45Valuation(item.nd, item.ne, item.nc);
          rows.push({
            id: `gtc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            ...item,
            ...val,
          });
        }
      }
    } catch (aiErr) {
      logger.warn('[Hito1Drive] AI Fallback error in GTC45:', aiErr.message);
    }
  }

  // Guardar en GTC45WorkspaceSession como oficial
  const officialConvoId = `official-${companyId || userId}`;
  let finalRows = [...existingRows];
  let creados = 0;
  let actualizados = 0;

  for (const r of rows) {
    const normDesc = normalizeText(r.peligro_descripcion);
    const normAct = normalizeText(r.actividad);
    const idx = finalRows.findIndex(
      (ex) => normalizeText(ex.peligro_descripcion) === normDesc && normalizeText(ex.actividad) === normAct
    );
    if (idx >= 0) {
      finalRows[idx] = { ...finalRows[idx], ...r };
      actualizados++;
    } else {
      finalRows.push(r);
      creados++;
    }
  }

  await GTC45WorkspaceSession.findOneAndUpdate(
    { conversationId: officialConvoId },
    {
      $set: {
        user: userId,
        companyId,
        matrixRows: finalRows,
        isOfficial: true,
        officialTitle: 'Matriz IPEVR SG-SST (GTC-45)',
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  // Sincronizar en MatrizPeligrosData para compatibilidad legacy
  await MatrizPeligrosData.findOneAndUpdate(
    { user: userId, ...(companyId ? { companyId } : {}) },
    {
      $set: {
        user: userId,
        companyId,
        procesos: [
          {
            proceso: 'Operaciones Consolidadas',
            zona: 'Instalaciones Generales',
            actividad: 'Actividades de Obra y Misión',
            peligros: finalRows.map((fr) => ({
              descripcionPeligro: fr.peligro_descripcion,
              clasificacion: fr.peligro_clasificacion,
              efectosPosibles: fr.efectos_posibles,
              nivelRiesgo: fr.nr,
              interpretacionNR: fr.interpretacion_nr,
            })),
          },
        ],
      },
    },
    { upsert: true }
  ).catch((e) => logger.debug('[Hito1Drive] Legacy MatrizPeligros sync warning:', e.message));

  return {
    modulo: 'gtc45',
    nombreModulo: 'Matriz IPEVR (GTC-45)',
    creados,
    actualizados,
    total: finalRows.length,
    fileName,
  };
}

/**
 * ─── SUB-PROCESADOR 2: MATRIZ DE RIESGOS VIALES (PESV) ────────────────────────
 */
async function processPesvFile({ fileData, userId, companyId }) {
  const { fileName, rowsBySheet, text } = fileData;
  const rows = [];

  for (const sheet of rowsBySheet) {
    for (const r of sheet.rows) {
      if (!r || typeof r !== 'object') continue;
      const entries = Object.entries(r);
      const getVal = (keywords) => {
        for (const [k, v] of entries) {
          if (!v) continue;
          const nk = normalizeText(k);
          if (keywords.some((kw) => nk === kw || nk.includes(kw))) return String(v).trim();
        }
        return '';
      };

      const factor = getVal(['factor riesgo', 'factor', 'pilar pesv', 'actor']);
      const peligro = getVal(['peligro vial', 'peligro', 'riesgo vial', 'riesgo', 'descripcion']);
      if (!factor && !peligro) continue;

      rows.push({
        id: `pesv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        actor_vial: toSentenceCase(getVal(['actor vial', 'actor', 'rol vial']) || 'Conductor'),
        factor_riesgo: toSentenceCase(factor || 'Factor Humano'),
        tipo_vehiculo: toSentenceCase(getVal(['tipo vehiculo', 'vehiculo', 'clase vehiculo']) || 'Camión / Doble Troque'),
        peligro_vial: toSentenceCase(peligro || 'Exceso de velocidad o fatiga'),
        controles_existentes: getVal(['controles', 'control existente', 'medidas']) || 'Telemetría GPS y capacitaciones PESV',
        nivel_riesgo: getVal(['nivel riesgo', 'riesgo', 'evaluacion']) || 'Medio',
        medidas_intervencion: getVal(['medidas intervencion', 'plan accion', 'intervencion']) || 'Pausas activas de conducción y mantenimiento preventivo',
      });
    }
  }

  const officialConvoId = `official-pesv-${companyId || userId}`;
  await PESVWorkspaceSession.findOneAndUpdate(
    { conversationId: officialConvoId },
    {
      $set: {
        user: userId,
        companyId,
        matrixRows: rows,
        isOfficial: true,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return {
    modulo: 'pesv',
    nombreModulo: 'Matriz de Riesgos Viales (PESV)',
    creados: rows.length,
    actualizados: 0,
    total: rows.length,
    fileName,
  };
}

/**
 * ─── SUB-PROCESADOR 3: MATRIZ DE COMPATIBILIDAD QUÍMICA (SGA) ─────────────────
 */
async function processCompatibilidadFile({ fileData, userId, companyId }) {
  const { fileName, rowsBySheet, text } = fileData;
  const rows = [];

  for (const sheet of rowsBySheet) {
    for (const r of sheet.rows) {
      if (!r || typeof r !== 'object') continue;
      const entries = Object.entries(r);
      const getVal = (keywords) => {
        for (const [k, v] of entries) {
          if (!v) continue;
          const nk = normalizeText(k);
          if (keywords.some((kw) => nk === kw || nk.includes(kw))) return String(v).trim();
        }
        return '';
      };

      const nombre = getVal(['producto', 'quimico', 'nombre comercial', 'sustancia']);
      if (!nombre) continue;

      rows.push({
        id: `chem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        nombre: toSentenceCase(nombre),
        fabricante: getVal(['fabricante', 'proveedor', 'marca']) || 'Desconocido',
        estado_fisico: getVal(['estado fisico', 'estado', 'forma']) || 'Líquido',
        clasificacion_onu: getVal(['clase onu', 'onu', 'clasificacion']) || 'Clase 3 - Líquidos Inflamables',
        pictogramas_sga: [getVal(['pictograma', 'sga']) || 'GHS02 - Inflamable'],
        cantidad_almacenada: getVal(['cantidad', 'volumen', 'stock']) || '5 Galones',
        ubicacion: toSentenceCase(getVal(['ubicacion', 'almacen', 'bodega']) || 'Almacén de Sustancias Peligrosas'),
        tiene_fds: normalizeSiNo(getVal(['fds', 'msds', 'hoja seguridad']), 'Sí'),
        tiene_rotulo: normalizeSiNo(getVal(['rotulo', 'etiqueta', 'rotulado']), 'Sí'),
        incompatibilidades: getVal(['incompatibilidad', 'incompatible']) || 'Sustancias comburentes y fuentes de calor',
        requisitos_almacenamiento: getVal(['almacenamiento', 'requisitos']) || 'Área ventilada con dique de contención',
      });
    }
  }

  const officialConvId = `official-chem-${companyId || userId}`;
  await ChemicalCompatibilitySession.findOneAndUpdate(
    { conversationId: officialConvId },
    {
      $set: {
        user: userId,
        companyId,
        matrixRows: rows,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return {
    modulo: 'compatibilidad',
    nombreModulo: 'Matriz de Compatibilidad Química (SGA)',
    creados: rows.length,
    actualizados: 0,
    total: rows.length,
    fileName,
  };
}

/**
 * ─── SUB-PROCESADOR 4: ANÁLISIS DE VULNERABILIDAD (DIAMANTE DE COLORES) ────────
 */
async function processVulnerabilidadFile({ fileData, userId, companyId }) {
  const { fileName, rowsBySheet, text } = fileData;
  const amenazasList = [];

  for (const sheet of rowsBySheet) {
    for (const r of sheet.rows) {
      if (!r || typeof r !== 'object') continue;
      const entries = Object.entries(r);
      const getVal = (keywords) => {
        for (const [k, v] of entries) {
          if (!v) continue;
          const nk = normalizeText(k);
          if (keywords.some((kw) => nk === kw || nk.includes(kw))) return String(v).trim();
        }
        return '';
      };

      const amenaza = getVal(['amenaza', 'evento', 'fenomeno', 'peligro']);
      if (!amenaza) continue;

      amenazasList.push({
        id: `amenaza_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        amenaza: toSentenceCase(amenaza),
        tipo: toSentenceCase(getVal(['tipo amenaza', 'origen', 'clasificacion']) || 'Tecnológica'),
        calificacion: toSentenceCase(getVal(['calificacion', 'probabilidad', 'frecuencia']) || 'Probable'),
        colorAmenaza: getVal(['color', 'diamante']) || 'Amarillo',
        personas: { calificacion: 'Regular', color: 'Amarillo' },
        recursos: { calificacion: 'Bueno', color: 'Verde' },
        sistemas: { calificacion: 'Regular', color: 'Amarillo' },
        nivelRiesgo: getVal(['nivel riesgo', 'riesgo final']) || 'Medio',
      });
    }
  }

  await AnalisisVulnerabilidadData.findOneAndUpdate(
    { user: userId, ...(companyId ? { companyId } : {}) },
    {
      $set: {
        user: userId,
        companyId,
        'formData.amenazasList': amenazasList,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return {
    modulo: 'vulnerabilidad',
    nombreModulo: 'Análisis de Vulnerabilidad (Diamante de Emergencias)',
    creados: amenazasList.length,
    actualizados: 0,
    total: amenazasList.length,
    fileName,
  };
}

/**
 * ─── SUB-PROCESADOR 5: DIAGNÓSTICO ESTÁNDARES MÍNIMOS (RES. 0312) ─────────────
 */
async function processDiagnosticoFile({ fileData, userId, companyId }) {
  const { fileName, rowsBySheet, text } = fileData;
  const statusData = [];

  for (const sheet of rowsBySheet) {
    for (const r of sheet.rows) {
      if (!r || typeof r !== 'object') continue;
      const entries = Object.entries(r);
      const getVal = (keywords) => {
        for (const [k, v] of entries) {
          if (!v) continue;
          const nk = normalizeText(k);
          if (keywords.some((kw) => nk === kw || nk.includes(kw))) return String(v).trim();
        }
        return '';
      };

      const codigo = getVal(['codigo', 'estandar', 'item', 'numeral']);
      const descripcion = getVal(['criterio', 'descripcion', 'requisito', 'estandar minimo']);
      if (!codigo && !descripcion) continue;

      const valoracion = normalizeText(getVal(['calificacion', 'evaluacion', 'cumple', 'estado']));
      let status = 'cumple';
      if (valoracion.includes('no cumple')) status = 'no_cumple';
      else if (valoracion.includes('no aplica')) status = 'no_aplica';
      else if (valoracion.includes('parcial')) status = 'parcial';

      statusData.push({
        itemId: codigo || `item_${statusData.length + 1}`,
        code: codigo || `1.${statusData.length + 1}`,
        description: descripcion || 'Estándar mínimo evaluado',
        status,
        observation: getVal(['observacion', 'evidencia', 'hallazgo']) || 'Verificado con soporte documental',
      });
    }
  }

  const cumpleCount = statusData.filter((s) => s.status === 'cumple').length;
  const score = statusData.length > 0 ? Math.round((cumpleCount / statusData.length) * 100) : 85;
  const complianceLevel = score >= 85 ? 'Aceptable' : score >= 60 ? 'Moderadamente Aceptable' : 'Crítico';

  await DiagnosticoData.findOneAndUpdate(
    { user: userId, ...(companyId ? { companyId } : {}) },
    {
      $set: {
        user: userId,
        companyId,
        statusData,
        score,
        totalPoints: 100,
        complianceLevel,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return {
    modulo: 'diagnostico',
    nombreModulo: 'Diagnóstico Inicial Res. 0312',
    creados: statusData.length,
    actualizados: 0,
    score,
    complianceLevel,
    fileName,
  };
}

/**
 * ─── SUB-PROCESADOR 6: GOBERNANZA (RESPONSABLE SST, POLÍTICA Y OBJETIVOS) ──────
 */
async function processResponsableFile({ fileData, userId, companyId }) {
  const { fileName, text } = fileData;
  if (!text || text.length < 20) return null;

  const prompt = `Analiza el siguiente texto de SG-SST (Colombia) y extrae los datos institucionales de gobernanza (Responsable del SG-SST, licencia, fechas, etc.).

TEXTO:
"""
${text.slice(0, 10000)}
"""

Devuelve un JSON estrictamente válido:
{
  "responsibleSST": "string con nombre completo del responsable de SST",
  "responsibleSSTPhone": "string con celular/telefono",
  "formationLevel": "Técnico|Tecnólogo|Profesional|Especialista",
  "licenseNumber": "string con número de licencia SST",
  "licenseExpiry": "YYYY-MM-DD",
  "courseStatus": "50 Horas Vigente|20 Horas Actualizado|Pendiente"
}`;

  try {
    const response = await generateWithKeyRotation({
      prompt,
      models: ['gemini-3.5-flash-lite', 'gemini-3.6-flash'],
      temperature: 0.1,
    });
    const parsed = cleanAndParseJson(response.text);
    if (parsed && (parsed.responsibleSST || parsed.licenseNumber)) {
      await CompanyInfo.findOneAndUpdate(
        { user: userId, ...(companyId ? { _id: companyId } : { isActive: true }) },
        {
          $set: {
            responsibleSST: parsed.responsibleSST || '',
            responsibleSSTPhone: parsed.responsibleSSTPhone || '',
            formationLevel: parsed.formationLevel || 'Profesional',
            licenseNumber: parsed.licenseNumber || '',
            licenseExpiry: normalizeDateStr(parsed.licenseExpiry),
            courseStatus: parsed.courseStatus || '50 Horas Vigente',
          },
        }
      );

      return {
        modulo: 'responsable',
        nombreModulo: 'Asignación del Responsable SG-SST',
        datos: parsed,
        fileName,
      };
    }
  } catch (err) {
    logger.warn('[Hito1Drive] Error parsing responsable doc:', err.message);
  }
  return null;
}

/**
 * ─── FUNCIÓN MAESTRA: IMPORTAR Y SINCRONIZAR HITO 1 DESDE GOOGLE DRIVE ────────
 */
async function importAndSyncHito1({ userId, modulo = 'auto', carpeta, archivo, fileId }) {
  let company = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
  if (!company) {
    company = await CompanyInfo.findOne({ user: userId }).sort({ createdAt: 1 }).lean();
  }
  const companyId = company?._id;

  // 1. Localizar archivos en Google Drive
  const { drive, files, matchedFolder } = await findHito1FilesInDrive({
    userId,
    modulo,
    carpeta,
    archivo,
    fileId,
  });

  if (!files || files.length === 0) {
    return {
      exito: false,
      mensaje: `No se encontraron archivos en Google Drive para el Hito 1 (Módulo: ${modulo}) con los criterios de búsqueda proporcionados.`,
      archivosProcesados: [],
    };
  }

  const resultadosModulos = [];
  const archivosProcesados = [];

  // Obtener estado actual de GTC-45 para upsert inteligente
  const officialConvoId = `official-${companyId || userId}`;
  const gtcSession = await GTC45WorkspaceSession.findOne({ conversationId: officialConvoId }).lean();
  let currentGtcRows = gtcSession?.matrixRows || [];

  for (const f of files) {
    const fileData = await extractDriveFileData(drive, f);
    archivosProcesados.push(f.name);
    const lowerName = normalizeText(f.name);

    // Detección automática del aplicativo destino según el nombre del archivo si modulo es 'auto'
    let targetMod = modulo;
    if (targetMod === 'auto') {
      if (lowerName.includes('gtc') || lowerName.includes('ipevr') || lowerName.includes('ipevar') || lowerName.includes('peligro') || lowerName.includes('riesgo')) {
        targetMod = 'gtc45';
      } else if (lowerName.includes('pesv') || lowerName.includes('vial')) {
        targetMod = 'pesv';
      } else if (lowerName.includes('quimic') || lowerName.includes('compatibil') || lowerName.includes('sga')) {
        targetMod = 'compatibilidad';
      } else if (lowerName.includes('vulnerabil') || lowerName.includes('diamante') || lowerName.includes('amenaza')) {
        targetMod = 'vulnerabilidad';
      } else if (lowerName.includes('0312') || lowerName.includes('diagnostico') || lowerName.includes('estandar')) {
        targetMod = 'diagnostico';
      } else if (lowerName.includes('responsable') || lowerName.includes('licencia') || lowerName.includes('asignacion')) {
        targetMod = 'responsable';
      }
    }

    if (targetMod === 'gtc45') {
      const res = await processGtc45File({ fileData, userId, companyId, existingRows: currentGtcRows });
      resultadosModulos.push(res);
      currentGtcRows = (await GTC45WorkspaceSession.findOne({ conversationId: officialConvoId }).lean())?.matrixRows || [];
    } else if (targetMod === 'pesv') {
      const res = await processPesvFile({ fileData, userId, companyId });
      resultadosModulos.push(res);
    } else if (targetMod === 'compatibilidad') {
      const res = await processCompatibilidadFile({ fileData, userId, companyId });
      resultadosModulos.push(res);
    } else if (targetMod === 'vulnerabilidad') {
      const res = await processVulnerabilidadFile({ fileData, userId, companyId });
      resultadosModulos.push(res);
    } else if (targetMod === 'diagnostico') {
      const res = await processDiagnosticoFile({ fileData, userId, companyId });
      resultadosModulos.push(res);
    } else if (targetMod === 'responsable') {
      const res = await processResponsableFile({ fileData, userId, companyId });
      if (res) resultadosModulos.push(res);
    }
  }

  return {
    exito: true,
    mensaje: `Se procesaron exitosamente ${archivosProcesados.length} archivo(s) del Hito 1 desde Google Drive.`,
    modeloTextoUtilizado: 'gemini-3.5-flash-lite (respaldo gemini-3.6-flash)',
    carpetaEncontrada: matchedFolder || 'Raíz / Búsqueda General en Drive',
    archivosProcesados,
    resultadosModulos,
  };
}

module.exports = {
  importAndSyncHito1,
  findHito1FilesInDrive,
  extractDriveFileData,
  computeGtc45Valuation,
};
