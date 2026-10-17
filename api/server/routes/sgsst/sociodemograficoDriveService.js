'use strict';

const mongoose = require('mongoose');
const { google } = require('googleapis');
const xlsx = require('xlsx');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { logger } = require('~/config');
const GoogleDriveTool = require('~/app/clients/tools/structured/GoogleDrive');
const { generateWithKeyRotation } = require('./sgsstGemini');
const { cleanAndParseJson } = require('./fileExtractorHelper');
const perfilSocioRouter = require('./perfilSociodemografico');
const SgsstWorker = require('~/models/SgsstWorker');
const { CompanyInfo } = require('~/models/CompanyInfo');

/**
 * Normaliza texto eliminando tildes, signos extraños y pasando a minúsculas
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
 * Normaliza el género al enum de SgsstWorker y PerfilSociodemograficoData
 */
function normalizeGenero(val) {
  const s = normalizeText(val);
  if (!s) return 'No especificado';
  if (s === 'm' || s === 'h' || s.startsWith('masc') || s.startsWith('hombre') || s === 'varon') {
    return 'Masculino';
  }
  if (s === 'f' || s.startsWith('fem') || s.startsWith('mujer') || s === 'dama') {
    return 'Femenino';
  }
  if (s.includes('otro') || s.includes('no binario')) {
    return 'Otro';
  }
  return 'No especificado';
}

/**
 * Normaliza Sí / No para comités y hábitos
 */
function normalizeSiNo(val, defaultVal = 'No') {
  if (val === undefined || val === null || val === '') return defaultVal;
  const s = normalizeText(val);
  if (s === 'si' || s === 's' || s === 'yes' || s === 'true' || s === '1' || s === 'x' || s.startsWith('activo') || s.startsWith('aplica')) {
    return 'Sí';
  }
  if (s === 'no' || s === 'n' || s === 'false' || s === '0' || s.includes('ningun') || s === 'na' || s === 'n a') {
    return 'No';
  }
  return String(val).trim();
}

/**
 * Convierte fechas de Excel (serial numérico o string DD/MM/YYYY) a YYYY-MM-DD
 */
function normalizeDateStr(val) {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number' && val > 10000 && val < 80000) {
    // Fecha serial de Excel
    const utcDays = Math.floor(val - 25569);
    const dateInfo = new Date(utcDays * 86400 * 1000);
    if (!isNaN(dateInfo.getTime())) {
      return dateInfo.toISOString().split('T')[0];
    }
  }
  const s = String(val).trim();
  // Si viene DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return s;
}

/**
 * Calcula la edad a partir de fechaNacimiento si no viene explícita
 */
function computeAge(edadRaw, fechaNacimientoRaw) {
  if (edadRaw !== undefined && edadRaw !== null && String(edadRaw).trim() !== '') {
    const num = parseInt(String(edadRaw).replace(/[^\d]/g, ''), 10);
    if (!isNaN(num) && num >= 14 && num <= 100) return num;
  }
  const normDate = normalizeDateStr(fechaNacimientoRaw);
  if (normDate) {
    const d = new Date(normDate);
    if (!isNaN(d.getTime())) {
      const diff = Date.now() - d.getTime();
      const ageDate = new Date(diff);
      const calculated = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (calculated >= 14 && calculated <= 100) return calculated;
    }
  }
  return undefined;
}

/**
 * Calcula IMC a partir de peso (kg) y talla (m o cm)
 */
function computeImc(imcRaw, pesoRaw, tallaRaw) {
  const p = pesoRaw ? parseFloat(String(pesoRaw).replace(',', '.').replace(/[^\d.]/g, '')) : null;
  const t = tallaRaw ? parseFloat(String(tallaRaw).replace(',', '.').replace(/[^\d.]/g, '')) : null;
  if (p && t && p > 20 && t > 0) {
    const tMeters = t > 3 ? t / 100 : t;
    if (tMeters > 0.5 && tMeters < 2.5) {
      return (p / (tMeters * tMeters)).toFixed(1);
    }
  }
  return imcRaw ? String(imcRaw).trim() : '';
}

/**
 * Mapeador determinista de filas Excel/CSV por cabeceras comunes en Colombia
 */
function mapSpreadsheetRowsDeterministically(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const mappedWorkers = [];

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const entries = Object.entries(row);
    if (entries.length === 0) continue;

    const getByKeywords = (keywords, excludeKeywords = []) => {
      for (const [k, v] of entries) {
        if (v === undefined || v === null || String(v).trim() === '') continue;
        const nk = normalizeText(k);
        if (excludeKeywords.some((ex) => nk.includes(ex))) continue;
        if (keywords.some((kw) => nk === kw || nk.includes(kw))) {
          return String(v).trim();
        }
      }
      return '';
    };

    const nombre = getByKeywords(
      ['nombre completo', 'nombres y apellidos', 'trabajador', 'colaborador', 'empleado', 'nombre', 'apellidos y nombres'],
      ['empresa', 'emergencia', 'contacto', 'cargo', 'eps', 'afp', 'arl']
    );
    const apellidos = getByKeywords(['apellidos', 'apellido'], ['nombres', 'nombre completo']);
    const fullNombre = nombre && apellidos && !normalizeText(nombre).includes(normalizeText(apellidos))
      ? `${nombre} ${apellidos}`.trim()
      : nombre;

    const identificacion = getByKeywords(
      ['cedula', 'identificacion', 'documento', 'cc', 'nro documento', 'numero de documento', 'num doc', 'nit'],
      ['tipo', 'expedicion', 'fecha']
    ).replace(/[^\dA-Za-z-]/g, '');

    if (!fullNombre && !identificacion) continue;
    // Ignorar filas que son encabezados repetidos o totales
    if (normalizeText(fullNombre) === 'nombre' || normalizeText(fullNombre).startsWith('total')) continue;

    const worker = {
      nombre: fullNombre || 'Colaborador',
      identificacion: identificacion || '',
      edad: getByKeywords(['edad', 'anos cumplidos']),
      fechaNacimiento: normalizeDateStr(getByKeywords(['fecha de nacimiento', 'fecha nacimiento', 'nacimiento', 'fec nac'])),
      lugarNacimiento: getByKeywords(['lugar de nacimiento', 'lugar nacimiento', 'ciudad nacimiento']),
      genero: getByKeywords(['genero', 'sexo']),
      estadoCivil: getByKeywords(['estado civil']),
      nivelEscolaridad: getByKeywords(['escolaridad', 'nivel educativo', 'estudios', 'formacion', 'nivel de escolaridad']),
      direccion: getByKeywords(['direccion', 'residencia', 'domicilio'], ['correo', 'email']),
      barrio: getByKeywords(['barrio', 'vereda', 'sector']),
      municipioDomicilio: getByKeywords(['municipio', 'ciudad residencia', 'ciudad domicilio', 'ciudad']),
      telefono: getByKeywords(['telefono', 'celular', 'movil', 'tel'], ['emergencia', 'contacto']),
      correoElectronico: getByKeywords(['correo', 'email', 'e-mail', 'mail']),
      emergenciaContacto: getByKeywords(['contacto de emergencia', 'emergencia', 'acudiente', 'familiar en caso']),
      cargo: getByKeywords(['cargo', 'puesto', 'ocupacion', 'rol', 'oficio'], ['personas a cargo', 'personas cargo']),
      areaTrabajo: getByKeywords(['area', 'departamento', 'proceso', 'dependencia', 'seccion']),
      sede: getByKeywords(['sede', 'centro de trabajo', 'sucursal', 'planta']),
      tipoContrato: getByKeywords(['tipo de contrato', 'tipo contrato', 'contrato', 'vinculacion']),
      salario: getByKeywords(['salario', 'sueldo', 'ingreso', 'remuneracion', 'devengado']),
      jornadaLaboral: getByKeywords(['jornada', 'turno', 'horario']),
      eps: getByKeywords(['eps', 'entidad promotora', 'salud eps']),
      afp: getByKeywords(['afp', 'fondo de pension', 'pension', 'pensiones']),
      arl: getByKeywords(['arl', 'riesgos laborales', 'aseguradora']),
      personasCargo: getByKeywords(['personas a cargo', 'personas cargo', 'dependientes', 'hijos', 'num hijos']),
      estrato: getByKeywords(['estrato', 'nivel socioeconomico']),
      vivienda: getByKeywords(['tipo de vivienda', 'vivienda', 'tenencia vivienda']),
      tipoSangre: getByKeywords(['tipo de sangre', 'grupo sanguineo', 'sangre', 'rh']),
      rh: getByKeywords(['rh', 'factor rh', 'grupo sanguineo']),
      fechaExamenMedico: normalizeDateStr(getByKeywords(['fecha examen', 'examen medico', 'ultimo emo', 'fecha emo', 'evaluacion medica'])),
      diagnosticoMedico: getByKeywords(['diagnostico', 'concepto medico', 'aptitud medica', 'concepto emo', 'hallazgos medicos', 'condicion de salud']),
      recomendacionesMedicas: getByKeywords(['recomendaciones medicas', 'recomendaciones', 'observaciones medicas', 'plan medico', 'conducta']),
      fechaSeguimiento: normalizeDateStr(getByKeywords(['fecha seguimiento', 'proximo control', 'seguimiento medico'])),
      enfermedades: getByKeywords(['enfermedades', 'patologias', 'antecedentes medicos', 'condiciones de salud', 'morbilidad', 'sintomas']),
      medicamentos: getByKeywords(['medicamentos', 'tratamiento farmacologico', 'toma medicamentos', 'farmacos']),
      limitacionesBiomecanicas: getByKeywords(['limitaciones', 'restricciones', 'osteomuscular', 'biomecanica', 'restriccion laboral']),
      alergiasQuimicas: getByKeywords(['alergias', 'alergia', 'sensibilidad quimica']),
      riesgoCardiovascular: getByKeywords(['riesgo cardiovascular', 'cardiovascular', 'rcv']),
      peso: getByKeywords(['peso', 'peso kg']),
      talla: getByKeywords(['talla', 'estatura', 'altura cm', 'altura m']),
      imc: getByKeywords(['imc', 'indice de masa']),
      presionArterial: getByKeywords(['presion arterial', 'tension arterial', 'pa', 'ta']),
      frecuenciaCardiaca: getByKeywords(['frecuencia cardiaca', 'pulso', 'fc']),
      fuma: getByKeywords(['fuma', 'tabaquismo', 'cigarrillo', 'fumador']),
      alcohol: getByKeywords(['alcohol', 'bebidas alcoholicas', 'licor', 'consumo alcohol']),
      deporte: getByKeywords(['deporte', 'actividad fisica', 'ejercicio']),
      alimentacion: getByKeywords(['alimentacion', 'dieta', 'nutricion']),
      terapiaPsicologica: getByKeywords(['terapia psicologica', 'psicologia', 'salud mental']),
      esCopasst: getByKeywords(['copasst', 'vigia sst']),
      esComiteConvivencia: getByKeywords(['comite de convivencia', 'convivencia laboral', 'ccl']),
      esBrigadista: getByKeywords(['brigadista', 'brigada', 'emergencias']),
      esComiteSeguridadVial: getByKeywords(['seguridad vial', 'pesv', 'comite vial']),
      curso50h: getByKeywords(['curso 50', '50 horas']),
      curso20h: getByKeywords(['curso 20', '20 horas']),
      fechaCursoAlturasAutorizado: normalizeDateStr(getByKeywords(['curso alturas', 'alturas autorizado', 'trabajo en alturas'])),
      licenciaConduccion: getByKeywords(['licencia de conduccion', 'licencia conduccion', 'categoria licencia']),
    };

    mappedWorkers.push(worker);
  }

  return mappedWorkers;
}

/**
 * Descarga y extrae tanto texto como filas tabulares de un archivo de Google Drive
 */
async function extractDriveFileData(drive, fileMeta) {
  const { id: fileId, name, mimeType } = fileMeta;
  let buffer = null;

  if (mimeType === 'application/vnd.google-apps.document') {
    const res = await drive.files.export({ fileId, mimeType: 'text/plain' }, { responseType: 'text' });
    return { fileName: name, mimeType, text: String(res.data || ''), rowsBySheet: [] };
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
      // Detectar si el encabezado real no está en la fila 1 (muy común en formatos SG-SST de Colombia con membrete arriba)
      const rawMatrix = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      let headerRowIndex = 0;
      let bestScore = 0;

      for (let r = 0; r < Math.min(rawMatrix.length, 20); r++) {
        const rowCells = Array.isArray(rawMatrix[r]) ? rawMatrix[r] : [];
        const joinedRow = normalizeText(rowCells.join(' '));
        let score = 0;
        if (joinedRow.includes('nombre')) score += 3;
        if (joinedRow.includes('cedula') || joinedRow.includes('identificacion') || joinedRow.includes('documento')) score += 3;
        if (joinedRow.includes('cargo')) score += 2;
        if (joinedRow.includes('edad') || joinedRow.includes('genero') || joinedRow.includes('sexo') || joinedRow.includes('eps')) score += 2;
        if (joinedRow.includes('salud') || joinedRow.includes('examen') || joinedRow.includes('diagnostico') || joinedRow.includes('enfermedad')) score += 2;
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
 * Busca en Google Drive la carpeta X y el/los archivos del Perfil Sociodemográfico y Condiciones de Salud
 */
async function findSociodemograficoFilesInDrive({ userId, carpeta, archivo, fileId }) {
  const driveTool = new GoogleDriveTool({ userId });
  const auth = await driveTool.getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  // 1. Si se proporcionó un fileId específico
  if (fileId && String(fileId).trim().length > 5) {
    const meta = await drive.files.get({
      fileId: String(fileId).trim(),
      fields: 'id, name, mimeType, modifiedTime',
    });
    return {
      drive,
      folderInfo: null,
      files: [meta.data],
    };
  }

  let matchedFolder = null;
  const cleanFolderQuery = normalizeText(carpeta)
    .replace(/^(la\s+)?carpeta\s+/i, '')
    .replace(/^(en\s+)?mi\s+drive\s*/i, '')
    .trim();

  // 2. Si el usuario especificó carpeta X, buscarla de forma tolerante a tildes/mayúsculas
  if (cleanFolderQuery) {
    const foldersRes = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      pageSize: 200,
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc',
    });
    const allFolders = foldersRes.data.files || [];

    // Prioridad 1: coincidencia exacta normalizada
    matchedFolder = allFolders.find((f) => normalizeText(f.name) === cleanFolderQuery);
    // Prioridad 2: incluye el nombre buscado o viceversa
    if (!matchedFolder) {
      matchedFolder = allFolders.find(
        (f) =>
          normalizeText(f.name).includes(cleanFolderQuery) ||
          cleanFolderQuery.includes(normalizeText(f.name))
      );
    }
    // Prioridad 3: coincidencia por tokens significativos
    if (!matchedFolder) {
      const tokens = cleanFolderQuery.split(' ').filter((t) => t.length >= 2);
      if (tokens.length > 0) {
        matchedFolder = allFolders.find((f) => {
          const nf = normalizeText(f.name);
          return tokens.every((t) => nf.includes(t));
        });
      }
    }
  }

  let candidateFiles = [];

  // 3. Si encontramos la carpeta X, listar todos sus archivos (y 1 nivel de subcarpetas por si está adentro)
  if (matchedFolder) {
    const inFolderRes = await drive.files.list({
      q: `'${matchedFolder.id}' in parents and trashed = false`,
      pageSize: 100,
      fields: 'files(id, name, mimeType, modifiedTime)',
      orderBy: 'modifiedTime desc',
    });
    const directItems = inFolderRes.data.files || [];
    const subFolders = directItems.filter((f) => f.mimeType === 'application/vnd.google-apps.folder');
    candidateFiles = directItems.filter((f) => f.mimeType !== 'application/vnd.google-apps.folder');

    // Revisar 1 nivel de subcarpetas dentro de la carpeta X
    for (const sub of subFolders.slice(0, 5)) {
      const subRes = await drive.files.list({
        q: `'${sub.id}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
        pageSize: 50,
        fields: 'files(id, name, mimeType, modifiedTime)',
      });
      if (subRes.data.files?.length) {
        candidateFiles.push(...subRes.data.files);
      }
    }
  }

  // 4. Si no había carpeta o la carpeta estaba vacía, buscar archivos en todo el Drive
  if (candidateFiles.length === 0) {
    const allFilesRes = await drive.files.list({
      q: "mimeType != 'application/vnd.google-apps.folder' and trashed = false",
      pageSize: 150,
      fields: 'files(id, name, mimeType, modifiedTime)',
      orderBy: 'modifiedTime desc',
    });
    candidateFiles = allFilesRes.data.files || [];
  }

  // Filtrar solo archivos legibles de documentos/hojas de cálculo
  candidateFiles = candidateFiles.filter((f) => {
    const m = (f.mimeType || '').toLowerCase();
    const n = (f.name || '').toLowerCase();
    return (
      m.includes('spreadsheet') ||
      m.includes('excel') ||
      m.includes('word') ||
      m.includes('document') ||
      m.includes('pdf') ||
      m.includes('csv') ||
      m.includes('text') ||
      n.endsWith('.xlsx') ||
      n.endsWith('.xls') ||
      n.endsWith('.csv') ||
      n.endsWith('.docx') ||
      n.endsWith('.pdf')
    );
  });

  // Puntaje de relevancia para Perfil Sociodemográfico y Condiciones de Salud
  const cleanFileQuery = normalizeText(archivo || '');
  const RELEVANT_KEYWORDS = [
    'sociodemograf',
    'socio demograf',
    'condiciones de salud',
    'condicion de salud',
    'perfil',
    'trabajador',
    'colaborador',
    'nomina',
    'censo',
    'personal',
    'profesiogram',
    'examen',
    'salud',
    'emo',
    'empleados',
  ];

  const scoredFiles = candidateFiles.map((f) => {
    const nf = normalizeText(f.name);
    let score = 0;
    if (cleanFileQuery && nf === cleanFileQuery) score += 50;
    if (cleanFileQuery && nf.includes(cleanFileQuery)) score += 30;
    if (cleanFolderQuery && !matchedFolder && nf.includes(cleanFolderQuery)) score += 20;
    for (const kw of RELEVANT_KEYWORDS) {
      if (nf.includes(kw)) score += 10;
    }
    if (
      (f.mimeType || '').includes('spreadsheet') ||
      (f.mimeType || '').includes('excel') ||
      f.name.toLowerCase().endsWith('.xlsx') ||
      f.name.toLowerCase().endsWith('.xls')
    ) {
      score += 5;
    }
    return { file: f, score };
  });

  scoredFiles.sort((a, b) => b.score - a.score);

  let selectedFiles = [];
  if (matchedFolder) {
    // Si estamos dentro de la carpeta indicada por el usuario:
    // tomar los que tengan score > 5, o si solo hay pocos archivos en esa carpeta (<= 3), leerlos todos
    const highScored = scoredFiles.filter((s) => s.score >= 10).map((s) => s.file);
    if (highScored.length > 0) {
      selectedFiles = highScored.slice(0, 4);
    } else {
      selectedFiles = scoredFiles.slice(0, 3).map((s) => s.file);
    }
  } else {
    selectedFiles = scoredFiles.filter((s) => s.score >= 10).slice(0, 3).map((s) => s.file);
  }

  return {
    drive,
    folderInfo: matchedFolder,
    files: selectedFiles,
  };
}

/**
 * Esquema JSON para extracción con gemini-3.5-flash-lite / gemini-3.6-flash
 */
const WORKER_EXTRACTION_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      nombre: { type: 'string' },
      identificacion: { type: 'string' },
      edad: { type: 'string' },
      fechaNacimiento: { type: 'string' },
      lugarNacimiento: { type: 'string' },
      genero: { type: 'string' },
      estadoCivil: { type: 'string' },
      nivelEscolaridad: { type: 'string' },
      direccion: { type: 'string' },
      barrio: { type: 'string' },
      municipioDomicilio: { type: 'string' },
      telefono: { type: 'string' },
      correoElectronico: { type: 'string' },
      emergenciaContacto: { type: 'string' },
      cargo: { type: 'string' },
      areaTrabajo: { type: 'string' },
      sede: { type: 'string' },
      tipoContrato: { type: 'string' },
      salario: { type: 'string' },
      jornadaLaboral: { type: 'string' },
      eps: { type: 'string' },
      afp: { type: 'string' },
      arl: { type: 'string' },
      personasCargo: { type: 'string' },
      estrato: { type: 'string' },
      vivienda: { type: 'string' },
      tipoSangre: { type: 'string' },
      rh: { type: 'string' },
      fechaExamenMedico: { type: 'string' },
      diagnosticoMedico: { type: 'string' },
      recomendacionesMedicas: { type: 'string' },
      fechaSeguimiento: { type: 'string' },
      enfermedades: { type: 'string' },
      medicamentos: { type: 'string' },
      limitacionesBiomecanicas: { type: 'string' },
      alergiasQuimicas: { type: 'string' },
      riesgoCardiovascular: { type: 'string' },
      peso: { type: 'string' },
      talla: { type: 'string' },
      imc: { type: 'string' },
      presionArterial: { type: 'string' },
      frecuenciaCardiaca: { type: 'string' },
      fuma: { type: 'string' },
      alcohol: { type: 'string' },
      deporte: { type: 'string' },
      alimentacion: { type: 'string' },
      terapiaPsicologica: { type: 'string' },
      esCopasst: { type: 'string' },
      esComiteConvivencia: { type: 'string' },
      esBrigadista: { type: 'string' },
      esComiteSeguridadVial: { type: 'string' },
      curso50h: { type: 'string' },
      curso20h: { type: 'string' },
      fechaCursoAlturasAutorizado: { type: 'string' },
      licenciaConduccion: { type: 'string' },
    },
    required: ['nombre'],
  },
};

/**
 * Invoca a gemini-3.5-flash-lite (con respaldo automático a gemini-3.6-flash) para extraer y normalizar trabajadores
 */
async function extractWorkersWithGeminiTextModel(userId, textChunk, sourceLabel = 'Documento Drive') {
  const modelInstance = {
    model: 'gemini-3.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: WORKER_EXTRACTION_SCHEMA,
      temperature: 0.1,
    },
  };

  const promptText = `Eres el motor clínico y sociodemográfico de Tenshi en Somos SST (Colombia).
Analiza el siguiente contenido extraído de "${sourceLabel}" y extrae TODOS los trabajadores con TODA su información disponible tanto de:
1. PERFIL SOCIODEMOGRÁFICO: nombre completo, identificación/cédula, edad, fechaNacimiento (YYYY-MM-DD), lugarNacimiento, genero (Masculino/Femenino/Otro), estadoCivil, nivelEscolaridad, direccion, barrio, municipioDomicilio, telefono, correoElectronico, emergenciaContacto, cargo, areaTrabajo, sede, tipoContrato, salario, jornadaLaboral, eps, afp, arl, personasCargo, estrato, vivienda, tipoSangre, rh, participación en comités (esCopasst, esComiteConvivencia, esBrigadista, esComiteSeguridadVial) y cursos/licencias.
2. CONDICIONES DE SALUD: fechaExamenMedico (YYYY-MM-DD), diagnosticoMedico (concepto médico de aptitud o diagnósticos CIE-10), recomendacionesMedicas, fechaSeguimiento, enfermedades (patologías o síntomas reportados), medicamentos, limitacionesBiomecanicas (restricciones osteomusculares o de carga), alergiasQuimicas, riesgoCardiovascular (Bajo/Medio/Alto), peso (kg), talla (m o cm), imc, presionArterial, frecuenciaCardiaca, hábitos (fuma, alcohol, deporte, alimentacion, terapiaPsicologica).

REGLAS ESTRICTAS:
- Devuelve un array JSON con TODOS los trabajadores presentes en el bloque. No omitas ninguno.
- Si encuentras peso y talla pero no IMC, calcula el IMC.
- Si un campo no aparece para un trabajador, déjalo como cadena vacía "".

CONTENIDO A PROCESAR:
${textChunk}`;

  const result = await generateWithKeyRotation(modelInstance, userId, [{ text: promptText }]);
  const response = await result.response;
  const responseText = response.text();
  const parsed = cleanAndParseJson(responseText);
  return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
}

/**
 * Fusiona (merge) múltiples registros parciales del mismo trabajador (por cédula o por nombre normalizado)
 */
function mergeWorkerRecords(rawWorkersList) {
  const mergedMap = new Map();

  for (const w of rawWorkersList) {
    if (!w || typeof w !== 'object') continue;
    const rawName = String(w.nombre_completo || w.nombre || '').trim();
    const rawDoc = String(w.identificacion || w.cedula || w.documento || '')
      .trim()
      .replace(/\.|\s/g, '');

    if (!rawName && !rawDoc) continue;

    // Buscar llave existente por documento o por nombre normalizado
    let matchKey = null;
    if (rawDoc) {
      for (const [k, existing] of mergedMap.entries()) {
        if (existing.identificacion === rawDoc) {
          matchKey = k;
          break;
        }
      }
    }
    if (!matchKey && rawName) {
      const normName = normalizeText(rawName);
      for (const [k, existing] of mergedMap.entries()) {
        if (normalizeText(existing.nombre) === normName) {
          matchKey = k;
          break;
        }
      }
    }

    if (!matchKey) {
      matchKey = rawDoc || `name_${normalizeText(rawName)}_${mergedMap.size}`;
      mergedMap.set(matchKey, {
        ...w,
        nombre: rawName || 'Colaborador',
        identificacion: rawDoc,
      });
    } else {
      const existing = mergedMap.get(matchKey);
      const combined = { ...existing };
      for (const [field, val] of Object.entries(w)) {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          // Si existing no tenía valor, o el nuevo valor es más informativo, lo tomamos
          if (!combined[field] || String(combined[field]).trim() === '' || combined[field] === 'No especificado') {
            combined[field] = val;
          }
        }
      }
      if (rawDoc && !combined.identificacion) combined.identificacion = rawDoc;
      if (rawName && (!combined.nombre || combined.nombre === 'Colaborador')) combined.nombre = rawName;
      mergedMap.set(matchKey, combined);
    }
  }

  return Array.from(mergedMap.values());
}

/**
 * Función principal híbrida:
 * 1. Obtiene los trabajadores ya sea de Google Drive (carpeta X / archivo) o de texto/JSON enviado.
 * 2. Procesa con gemini-3.5-flash-lite (respaldo gemini-3.6-flash) + mapeador determinista.
 * 3. Alimenta PerfilSociodemograficoData + Condiciones de Salud + SgsstWorker + PerfilCargoData + CompanyInfo.workerCount.
 */
async function importAndSyncSociodemografico({
  userId,
  carpeta,
  archivo,
  fileId,
  texto_extraido,
  datos_json,
  trabajadores,
}) {
  // 1. Obtener empresa activa del usuario
  let company = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
  if (!company) {
    company = await CompanyInfo.findOne({ user: userId }).sort({ createdAt: 1 }).lean();
  }
  const companyId = company?._id;

  let extractedWorkers = [];
  let processedFilesNames = [];
  let matchedFolderName = null;
  let usedTextModel = 'gemini-3.5-flash-lite';

  // Caso A: Ya vienen objetos de trabajadores en `trabajadores` o `datos_json`
  if (Array.isArray(trabajadores) && trabajadores.length > 0) {
    extractedWorkers = trabajadores;
    processedFilesNames.push('Datos directos en lote');
  } else if (datos_json) {
    try {
      const parsed = typeof datos_json === 'string' ? cleanAndParseJson(datos_json) : datos_json;
      const arr = Array.isArray(parsed) ? parsed : parsed?.trabajadores || [parsed];
      if (arr.length > 0) {
        extractedWorkers = arr;
        processedFilesNames.push('JSON estructurado');
      }
    } catch (e) {
      logger.warn('[SociodemoDriveService] datos_json no era JSON directo, pasando a extracción IA:', e.message);
      texto_extraido = String(datos_json);
    }
  }

  // Caso B: Viene `texto_extraido`
  if (extractedWorkers.length === 0 && texto_extraido && String(texto_extraido).trim().length > 10) {
    processedFilesNames.push(archivo || 'Texto extraído');
    const aiWorkers = await extractWorkersWithGeminiTextModel(
      userId,
      String(texto_extraido).slice(0, 60000),
      archivo || 'Texto de entrada'
    );
    extractedWorkers.push(...aiWorkers);
  }

  // Caso C: Buscar carpeta y archivo(s) directamente en Google Drive del usuario
  if (extractedWorkers.length === 0) {
    const driveSearch = await findSociodemograficoFilesInDrive({
      userId,
      carpeta,
      archivo,
      fileId,
    });

    matchedFolderName = driveSearch.folderInfo?.name || null;

    if (!driveSearch.files || driveSearch.files.length === 0) {
      const folderMsg = carpeta
        ? matchedFolderName
          ? `Se encontró la carpeta "${matchedFolderName}" en tu Google Drive, pero no contiene archivos legibles de Perfil Sociodemográfico o Condiciones de Salud.`
          : `No se encontró ninguna carpeta llamada "${carpeta}" ni archivos de Perfil Sociodemográfico en tu Google Drive.`
        : 'No se encontraron archivos de Perfil Sociodemográfico o Condiciones de Salud en tu Google Drive.';
      return {
        exito: false,
        error: folderMsg,
        carpetaEncontrada: matchedFolderName,
        archivosProcesados: [],
      };
    }

    for (const fileMeta of driveSearch.files) {
      try {
        const fileData = await extractDriveFileData(driveSearch.drive, fileMeta);
        processedFilesNames.push(fileMeta.name);

        // 1) Mapeo determinista inmediato si es hoja de cálculo (garantiza 100% de filas sin truncamiento)
        let deterministicWorkers = [];
        for (const sheetObj of fileData.rowsBySheet || []) {
          const mapped = mapSpreadsheetRowsDeterministically(sheetObj.rows);
          if (mapped.length > 0) {
            deterministicWorkers.push(...mapped);
          }
        }

        // 2) Extracción y enriquecimiento con el modelo de texto gemini-3.5-flash-lite (y respaldo gemini-3.6-flash)
        let aiWorkers = [];
        if (fileData.rowsBySheet && fileData.rowsBySheet.length > 0) {
          // Procesar por lotes de hasta 25 filas por hoja para nunca desbordar la salida JSON
          for (const sheetObj of fileData.rowsBySheet) {
            const rows = sheetObj.rows || [];
            const BATCH_SIZE = 25;
            for (let i = 0; i < rows.length; i += BATCH_SIZE) {
              const batchRows = rows.slice(i, i + BATCH_SIZE);
              const batchText = JSON.stringify(batchRows, null, 2);
              if (batchText.length < 15) continue;
              try {
                const batchExtracted = await extractWorkersWithGeminiTextModel(
                  userId,
                  batchText,
                  `${fileMeta.name} - Hoja ${sheetObj.sheetName} (Filas ${i + 1} a ${i + batchRows.length})`
                );
                if (Array.isArray(batchExtracted)) {
                  aiWorkers.push(...batchExtracted);
                }
              } catch (aiBatchErr) {
                logger.warn(
                  `[SociodemoDriveService] Fallback determinista activado para lote en ${fileMeta.name}: ${aiBatchErr.message}`
                );
              }
            }
          }
        } else if (fileData.text && fileData.text.trim().length > 10) {
          try {
            const textExtracted = await extractWorkersWithGeminiTextModel(
              userId,
              fileData.text.slice(0, 60000),
              fileMeta.name
            );
            if (Array.isArray(textExtracted)) {
              aiWorkers.push(...textExtracted);
            }
          } catch (aiTextErr) {
            logger.warn(`[SociodemoDriveService] Error IA en texto ${fileMeta.name}: ${aiTextErr.message}`);
          }
        }

        // Combinar los trabajadores extraídos por IA con los del mapeador determinista
        extractedWorkers.push(...deterministicWorkers, ...aiWorkers);
      } catch (fileErr) {
        logger.error(`[SociodemoDriveService] Error leyendo archivo Drive ${fileMeta.name}:`, fileErr);
      }
    }
  }

  // Fusionar registros duplicados o complementarios (ej. Hoja 1 Sociodemográfico + Hoja 2 Condiciones de Salud)
  const mergedWorkers = mergeWorkerRecords(extractedWorkers);

  if (mergedWorkers.length === 0) {
    return {
      exito: false,
      error: 'No se pudieron identificar registros de trabajadores (nombres o cédulas) en los archivos analizados.',
      carpetaEncontrada: matchedFolderName,
      archivosProcesados: processedFilesNames,
    };
  }

  // 2. Cargar PerfilSociodemograficoData actual de la empresa
  const PerfilSociodemograficoData =
    mongoose.models.PerfilSociodemograficoData ||
    require('~/models/PerfilSociodemograficoData');

  const queryFilter = companyId ? { user: userId, companyId } : { user: userId };
  let socioDoc = await PerfilSociodemograficoData.findOne(queryFilter).lean();
  let trabajadoresList = socioDoc && Array.isArray(socioDoc.trabajadores) ? [...socioDoc.trabajadores] : [];

  let creados = 0;
  let actualizados = 0;
  let conCondicionesSalud = 0;
  const nombresProcesados = [];
  const cargosDetectados = new Set();

  for (const rawW of mergedWorkers) {
    const nombre = String(rawW.nombre_completo || rawW.nombre || '').trim();
    let documento = String(rawW.identificacion || rawW.cedula || rawW.documento || '')
      .trim()
      .replace(/\.|\s/g, '');

    if (!nombre && !documento) continue;

    // Buscar si ya existe en trabajadoresList por identificación o por nombre exacto normalizado
    let workerIndex = -1;
    if (documento) {
      workerIndex = trabajadoresList.findIndex(
        (w) => String(w.identificacion || w.documento || '').trim().replace(/\.|\s/g, '') === documento
      );
    }
    if (workerIndex === -1 && nombre) {
      const normNombre = normalizeText(nombre);
      workerIndex = trabajadoresList.findIndex((w) => normalizeText(w.nombre) === normNombre);
    }

    const existingW = workerIndex >= 0 ? trabajadoresList[workerIndex] : {};
    if (!documento && existingW.identificacion) {
      documento = String(existingW.identificacion).trim();
    }
    if (!documento) {
      // Generar identificador provisional si en el Excel no venía cédula para no perder el trabajador
      documento = `SD-${Date.now().toString().slice(-5)}-${creados + 1}`;
    }

    const workerId =
      existingW.id || `worker_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const pick = (newVal, oldVal, fallback = '') => {
      if (newVal !== undefined && newVal !== null && String(newVal).trim() !== '') {
        return String(newVal).trim();
      }
      if (oldVal !== undefined && oldVal !== null && String(oldVal).trim() !== '') {
        return String(oldVal).trim();
      }
      return fallback;
    };

    const fechaNacimiento = normalizeDateStr(pick(rawW.fechaNacimiento || rawW.fecha_nacimiento, existingW.fechaNacimiento));
    const edad = computeAge(rawW.edad ?? existingW.edad, fechaNacimiento);
    const peso = pick(rawW.peso, existingW.peso);
    const talla = pick(rawW.talla, existingW.talla);
    const imc = computeImc(pick(rawW.imc, existingW.imc), peso, talla);
    const cargo = pick(rawW.cargo, existingW.cargo, 'Operativo');
    if (cargo) cargosDetectados.add(cargo);

    const rhVal = pick(rawW.rh || rawW.tipoSangre, existingW.rh || existingW.tipoSangre);

    const workerItem = {
      ...existingW,
      id: workerId,
      nombre: nombre || existingW.nombre || 'Colaborador',
      identificacion: documento,
      edad,
      fechaNacimiento,
      lugarNacimiento: pick(rawW.lugarNacimiento, existingW.lugarNacimiento),
      genero: normalizeGenero(pick(rawW.genero, existingW.genero, 'No especificado')),
      estadoCivil: pick(rawW.estadoCivil || rawW.estado_civil, existingW.estadoCivil),
      nivelEscolaridad: pick(
        rawW.nivelEscolaridad || rawW.escolaridad || rawW.nivel_escolaridad,
        existingW.nivelEscolaridad
      ),
      direccion: pick(rawW.direccion, existingW.direccion),
      barrio: pick(rawW.barrio, existingW.barrio),
      municipioDomicilio: pick(rawW.municipioDomicilio || rawW.municipio, existingW.municipioDomicilio),
      telefono: pick(rawW.telefono, existingW.telefono),
      correoElectronico: pick(rawW.correoElectronico || rawW.correo, existingW.correoElectronico),
      emergenciaContacto: pick(rawW.emergenciaContacto || rawW.emergencia_contacto, existingW.emergenciaContacto),
      cargo,
      areaTrabajo: pick(rawW.areaTrabajo || rawW.area, existingW.areaTrabajo, 'Operaciones'),
      sede: pick(rawW.sede, existingW.sede, 'Principal'),
      tipoContrato: pick(rawW.tipoContrato || rawW.tipo_contrato, existingW.tipoContrato, 'Indefinido'),
      salario: pick(rawW.salario, existingW.salario),
      jornadaLaboral: pick(rawW.jornadaLaboral, existingW.jornadaLaboral, 'Diurna'),
      eps: pick(rawW.eps, existingW.eps),
      afp: pick(rawW.afp, existingW.afp),
      arl: pick(rawW.arl, existingW.arl),
      estadoPila: pick(rawW.estadoPila, existingW.estadoPila, 'Pendiente de soporte PILA'),
      estadoLaboral: pick(rawW.estadoLaboral || rawW.estado_laboral, existingW.estadoLaboral, 'Activo'),
      personasCargo: pick(rawW.personasCargo, existingW.personasCargo),
      estrato: pick(rawW.estrato, existingW.estrato),
      vivienda: pick(rawW.vivienda, existingW.vivienda),
      tipoSangre: rhVal,
      rh: rhVal,
      // Condiciones de salud y perfil clínico
      fechaExamenMedico: normalizeDateStr(
        pick(rawW.fechaExamenMedico || rawW.fecha_examen_medico, existingW.fechaExamenMedico)
      ),
      diagnosticoMedico: pick(
        rawW.diagnosticoMedico || rawW.diagnostico_medico,
        existingW.diagnosticoMedico
      ),
      recomendacionesMedicas: pick(
        rawW.recomendacionesMedicas || rawW.recomendaciones_medicas,
        existingW.recomendacionesMedicas
      ),
      fechaSeguimiento: normalizeDateStr(pick(rawW.fechaSeguimiento, existingW.fechaSeguimiento)),
      enfermedades: pick(rawW.enfermedades, existingW.enfermedades),
      medicamentos: pick(rawW.medicamentos, existingW.medicamentos),
      limitacionesBiomecanicas: pick(rawW.limitacionesBiomecanicas, existingW.limitacionesBiomecanicas),
      alergiasQuimicas: pick(rawW.alergiasQuimicas, existingW.alergiasQuimicas),
      riesgoCardiovascular: pick(rawW.riesgoCardiovascular, existingW.riesgoCardiovascular),
      peso,
      talla,
      imc,
      presionArterial: pick(rawW.presionArterial, existingW.presionArterial),
      frecuenciaCardiaca: pick(rawW.frecuenciaCardiaca, existingW.frecuenciaCardiaca),
      fuma: pick(rawW.fuma, existingW.fuma),
      alcohol: pick(rawW.alcohol, existingW.alcohol),
      deporte: pick(rawW.deporte, existingW.deporte),
      alimentacion: pick(rawW.alimentacion, existingW.alimentacion),
      terapiaPsicologica: pick(rawW.terapiaPsicologica, existingW.terapiaPsicologica),
      esCopasst: normalizeSiNo(rawW.esCopasst ?? existingW.esCopasst, 'No'),
      esComiteConvivencia: normalizeSiNo(rawW.esComiteConvivencia ?? existingW.esComiteConvivencia, 'No'),
      esBrigadista: normalizeSiNo(rawW.esBrigadista ?? existingW.esBrigadista, 'No'),
      esComiteSeguridadVial: normalizeSiNo(rawW.esComiteSeguridadVial ?? existingW.esComiteSeguridadVial, 'No'),
      curso50h: pick(rawW.curso50h, existingW.curso50h),
      curso20h: pick(rawW.curso20h, existingW.curso20h),
      fechaCursoAlturasAutorizado: normalizeDateStr(
        pick(rawW.fechaCursoAlturasAutorizado, existingW.fechaCursoAlturasAutorizado)
      ),
      licenciaConduccion: pick(rawW.licenciaConduccion, existingW.licenciaConduccion),
      completedByAI: true,
      consentimientoFirmaDigital: pick(rawW.consentimientoFirmaDigital, existingW.consentimientoFirmaDigital, 'No'),
    };

    // Etiquetado clínico determinista inmediato (Condiciones de Salud -> bioTagsIA / aptitud)
    if (typeof perfilSocioRouter.runDeterministicSemanticTagging === 'function') {
      const semantic = perfilSocioRouter.runDeterministicSemanticTagging(workerItem);
      workerItem.bioTagsIA = semantic.tags || [];
      workerItem.bioScoreIAReason = semantic.razon || '';
      workerItem.bioScoreIAAptitud = semantic.aptitud || 'Apto';
      workerItem.bioScoreIADate = new Date();
    }

    if (
      workerItem.diagnosticoMedico ||
      workerItem.enfermedades ||
      workerItem.recomendacionesMedicas ||
      workerItem.limitacionesBiomecanicas ||
      workerItem.peso ||
      workerItem.presionArterial
    ) {
      conCondicionesSalud++;
    }

    if (workerIndex >= 0) {
      trabajadoresList[workerIndex] = workerItem;
      actualizados++;
    } else {
      trabajadoresList.push(workerItem);
      creados++;
    }

    nombresProcesados.push(`${workerItem.nombre} (${workerItem.identificacion} - ${workerItem.cargo})`);
  }

  // 3. Recalcular Score Biocéntrico y sincronizar con SgsstWorker
  if (typeof perfilSocioRouter.recalculateAndSyncAllWorkers === 'function') {
    trabajadoresList = await perfilSocioRouter.recalculateAndSyncAllWorkers(
      userId,
      companyId,
      trabajadoresList
    );
  }

  // Asegurar que EPS, AFP y estadoLaboral también queden sincronizados en SgsstWorker
  const extraBulkOps = [];
  for (const w of trabajadoresList) {
    const cleanDoc = String(w.identificacion || '').trim();
    if (!cleanDoc) continue;
    extraBulkOps.push({
      updateOne: {
        filter: { user: userId, ...(companyId ? { companyId } : {}), documento: cleanDoc },
        update: {
          $set: {
            eps: w.eps || '',
            afp: w.afp || '',
            estadoLaboral: w.estadoLaboral || 'Activo',
            estado: (w.estadoLaboral || 'Activo') === 'Retirado' ? 'Inactivo' : 'Activo',
          },
        },
      },
    });
  }
  if (extraBulkOps.length > 0) {
    await SgsstWorker.bulkWrite(extraBulkOps, { ordered: false }).catch((e) =>
      logger.debug('[SociodemoDriveService] bulkWrite extra fields warning:', e.message)
    );
  }

  // 4. Guardar PerfilSociodemograficoData
  await PerfilSociodemograficoData.findOneAndUpdate(
    queryFilter,
    {
      $set: {
        user: userId,
        ...(companyId ? { companyId } : {}),
        trabajadores: trabajadoresList,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  // 5. Sincronizar cargos nuevos en PerfilCargoData y conteo de trabajadores activos en CompanyInfo
  try {
    const PerfilCargoData = mongoose.models.PerfilCargoData;
    if (PerfilCargoData && cargosDetectados.size > 0) {
      const cargoFilter = companyId ? { user: userId, companyId } : { user: userId };
      let cargoDoc = await PerfilCargoData.findOne(cargoFilter);
      const existingCargos = cargoDoc?.perfilesList || [];
      const existingNames = new Set(existingCargos.map((p) => normalizeText(p.nombreCargo)));
      let cargosAdded = false;

      for (const cargoName of cargosDetectados) {
        if (!existingNames.has(normalizeText(cargoName))) {
          existingCargos.push({
            id: `cargo_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            nombreCargo: cargoName,
            nivelCargo: 'Operativo',
            exigenciaFisica: 'Media',
            exigenciaMental: 'Media',
            operaMaquinaria: 'No',
          });
          existingNames.add(normalizeText(cargoName));
          cargosAdded = true;
        }
      }

      if (cargosAdded) {
        await PerfilCargoData.findOneAndUpdate(
          cargoFilter,
          {
            $set: {
              user: userId,
              ...(companyId ? { companyId } : {}),
              perfilesList: existingCargos,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
    }

    const totalActivos = trabajadoresList.filter(
      (t) => (t.estadoLaboral || 'Activo') !== 'Retirado'
    ).length;
    if (companyId) {
      await CompanyInfo.updateOne({ _id: companyId }, { $set: { workerCount: totalActivos } });
    }
  } catch (syncMetaErr) {
    logger.warn('[SociodemoDriveService] Error sincronizando cargos/workerCount:', syncMetaErr.message);
  }

  return {
    exito: true,
    mensaje: `Se alimentó exitosamente el Perfil Sociodemográfico y Condiciones de Salud en Somos SST con ${creados + actualizados} trabajadores (${creados} nuevos, ${actualizados} actualizados).`,
    modeloTextoUtilizado: `${usedTextModel} (respaldo gemini-3.6-flash)`,
    carpetaEncontrada: matchedFolderName || carpeta || 'Raíz / Búsqueda General en Drive',
    archivosProcesados: processedFilesNames,
    trabajadoresCreados: creados,
    trabajadoresActualizados: actualizados,
    trabajadoresConCondicionesSalud: conCondicionesSalud,
    totalCensoEmpresa: trabajadoresList.length,
    cargosSincronizados: Array.from(cargosDetectados),
    muestraTrabajadores: nombresProcesados.slice(0, 30),
  };
}

module.exports = {
  importAndSyncSociodemografico,
  findSociodemograficoFilesInDrive,
  extractDriveFileData,
};
