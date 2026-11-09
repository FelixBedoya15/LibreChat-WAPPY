'use strict';

const MONTH_NAME_MAP = {
  ene: 1,
  enero: 1,
  jan: 1,
  january: 1,
  feb: 2,
  febrero: 2,
  february: 2,
  mar: 3,
  marzo: 3,
  march: 3,
  abr: 4,
  abril: 4,
  apr: 4,
  april: 4,
  may: 5,
  mayo: 5,
  jun: 6,
  junio: 6,
  june: 6,
  jul: 7,
  julio: 7,
  july: 7,
  ago: 8,
  agosto: 8,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  set: 9,
  septiembre: 9,
  setiembre: 9,
  september: 9,
  oct: 10,
  octubre: 10,
  october: 10,
  nov: 11,
  noviembre: 11,
  november: 11,
  dic: 12,
  diciembre: 12,
  dec: 12,
  december: 12,
};

function stripAccentsLower(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeHeaderKey(str) {
  return stripAccentsLower(str)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function daysInMonth(year, month) {
  if (month < 1 || month > 12) return 0;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function buildValidYmd(year, month, day, minYear, maxYear) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return '';
  }
  if (y < minYear || y > maxYear) {
    return '';
  }
  const maxDay = daysInMonth(y, m);
  if (maxDay === 0 || d < 1 || d > maxDay) {
    return '';
  }
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Normaliza cualquier fecha ('YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY/MM/DD',
 * Date, número serial Excel o texto en español como "21 de julio de 1988") a 'YYYY-MM-DD'.
 * Devuelve '' si no es una fecha válida.
 */
function normalizeAnyDateYmd(val, options = {}) {
  const minYear = typeof options.minYear === 'number' ? options.minYear : 1900;
  const maxYear = typeof options.maxYear === 'number' ? options.maxYear : 2100;

  if (val === undefined || val === null || val === '' || typeof val === 'boolean') {
    return '';
  }

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return buildValidYmd(
      val.getUTCFullYear(),
      val.getUTCMonth() + 1,
      val.getUTCDate(),
      minYear,
      maxYear,
    );
  }

  const s = String(val).trim();
  if (!s) return '';

  const cleanedLower = stripAccentsLower(s);
  if (
    cleanedLower === 'no aplica' ||
    cleanedLower === 'n/a' ||
    cleanedLower === 'na' ||
    cleanedLower === 'ninguno' ||
    cleanedLower === 'ninguna' ||
    cleanedLower === '-' ||
    cleanedLower === '--' ||
    cleanedLower === 'sin fecha' ||
    cleanedLower === 'pendiente' ||
    cleanedLower === 'null' ||
    cleanedLower === 'undefined'
  ) {
    return '';
  }

  // 1. Número serial de Excel (ej. 29221, 32345, 45200)
  if (/^\d+(\.\d+)?$/.test(s)) {
    const num = Number(s);
    if (!isNaN(num) && num > 7000 && num < 80000) {
      const utcDays = Math.round(num - 25569);
      const dateInfo = new Date(utcDays * 86400 * 1000);
      if (!isNaN(dateInfo.getTime())) {
        return buildValidYmd(
          dateInfo.getUTCFullYear(),
          dateInfo.getUTCMonth() + 1,
          dateInfo.getUTCDate(),
          minYear,
          maxYear,
        );
      }
    }
    return '';
  }

  // 2. YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD (con o sin sufijo T00:00:00.000Z)
  const ymdMatch = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})(?:[T\s].*)?$/);
  if (ymdMatch) {
    return buildValidYmd(ymdMatch[1], ymdMatch[2], ymdMatch[3], minYear, maxYear);
  }

  // 3. DD/MM/YYYY / DD-MM-YYYY / DD.MM.YYYY (con soporte defensivo si viene MM/DD/YYYY con día > 12)
  const dmyMatch = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:[T\s].*)?$/);
  if (dmyMatch) {
    const p1 = Number(dmyMatch[1]);
    const p2 = Number(dmyMatch[2]);
    const yr = Number(dmyMatch[3]);
    if (p2 > 12 && p1 >= 1 && p1 <= 12) {
      return buildValidYmd(yr, p1, p2, minYear, maxYear);
    }
    return buildValidYmd(yr, p2, p1, minYear, maxYear);
  }

  // 4. Fechas textuales en español o inglés ("21 de julio de 1988", "21-jul-1988", "julio 21 de 1988")
  const cleanWords = cleanedLower
    .replace(/,/g, ' ')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const esDmy = cleanWords.match(
    /^(\d{1,2})(?:\s+de\s+|\s+|[\/\-])([a-z]{3,12})(?:\s+de(?:l)?\s+|\s+|[\/\-])(\d{4})(?:\s.*)?$/,
  );
  if (esDmy) {
    const day = Number(esDmy[1]);
    const month = MONTH_NAME_MAP[esDmy[2]];
    const yr = Number(esDmy[3]);
    if (month) {
      return buildValidYmd(yr, month, day, minYear, maxYear);
    }
  }

  const esMdy = cleanWords.match(
    /^([a-z]{3,12})\s+(\d{1,2})(?:\s+de(?:l)?\s+|\s+)(\d{4})(?:\s.*)?$/,
  );
  if (esMdy) {
    const month = MONTH_NAME_MAP[esMdy[1]];
    const day = Number(esMdy[2]);
    const yr = Number(esMdy[3]);
    if (month) {
      return buildValidYmd(yr, month, day, minYear, maxYear);
    }
  }

  return '';
}

/**
 * Normaliza específicamente Fecha de Nacimiento a 'YYYY-MM-DD' validando rango 1920..añoActual.
 * Devuelve '' si no es válida (evita contaminar con "Medellín", "No aplica", etc.).
 */
function normalizeBirthDateYmd(val) {
  const currentYear = new Date().getFullYear();
  return normalizeAnyDateYmd(val, { minYear: 1920, maxYear: currentYear });
}

/**
 * Convierte cualquier valor de fecha a Date en mediodía UTC (`YYYY-MM-DDT12:00:00.000Z`)
 * para que en ninguna zona horaria (ej. America/Bogota UTC-5 o UTC) retroceda un día.
 */
function toUtcNoonDateOrNull(val, isBirthDate = false) {
  const ymd = isBirthDate ? normalizeBirthDateYmd(val) : normalizeAnyDateYmd(val);
  if (!ymd) return null;
  const d = new Date(`${ymd}T12:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calcula la edad exacta en años cumplidos desde 'YYYY-MM-DD' (o cualquier formato convertible).
 * Si fechaNacimiento no es válida, usa fallbackEdad si es numérica razonable.
 */
function calculateAgeFromBirthDate(birthDateVal, fallbackEdad = undefined) {
  const ymd = normalizeBirthDateYmd(birthDateVal);
  if (ymd) {
    const [y, m, d] = ymd.split('-').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    if (y >= 1920 && y <= currentYear) {
      let age = currentYear - y;
      if (currentMonth < m || (currentMonth === m && currentDay < d)) {
        age -= 1;
      }
      if (age >= 0 && age <= 120) {
        return age;
      }
    }
  }

  if (fallbackEdad !== undefined && fallbackEdad !== null && String(fallbackEdad).trim() !== '') {
    const num = parseInt(String(fallbackEdad).replace(/[^\d]/g, ''), 10);
    if (!isNaN(num) && num >= 14 && num <= 110) {
      return num;
    }
  }

  return undefined;
}

/**
 * Extrae `fechaNacimiento` de una fila cruda de Excel/CSV excluyendo estrictamente columnas
 * de lugar/ciudad/municipio/departamento/país/expedición.
 */
function extractBirthDateFromRawRow(row) {
  if (!row || typeof row !== 'object') return '';
  const excludeTokens = ['lugar', 'ciudad', 'municipio', 'departamento', 'pais', 'expedicion'];
  const priorityKeywords = [
    'fecha de nacimiento',
    'fecha nacimiento',
    'f de nacimiento',
    'f nacimiento',
    'fec nacimiento',
    'fec nac',
    'fechanacimiento',
    'birthdate',
    'date of birth',
    'nacimiento',
  ];

  const entries = Object.entries(row);
  for (const kw of priorityKeywords) {
    for (const [k, v] of entries) {
      if (v === undefined || v === null || String(v).trim() === '') continue;
      const nk = normalizeHeaderKey(k);
      if (!nk) continue;
      if (excludeTokens.some((ex) => nk.includes(ex))) continue;
      if (nk === kw || nk.includes(kw)) {
        const parsed = normalizeBirthDateYmd(v);
        if (parsed) return parsed;
      }
    }
  }
  return '';
}

/**
 * Extrae `lugarNacimiento` de una fila cruda de Excel/CSV sin confundirlo con la fecha.
 */
function extractBirthPlaceFromRawRow(row) {
  if (!row || typeof row !== 'object') return '';
  const placeKeywords = [
    'lugar de nacimiento',
    'lugar nacimiento',
    'ciudad de nacimiento',
    'ciudad nacimiento',
    'municipio de nacimiento',
    'municipio nacimiento',
  ];
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined || v === null || String(v).trim() === '') continue;
    const nk = normalizeHeaderKey(k);
    if (placeKeywords.some((kw) => nk.includes(kw))) {
      return String(v).trim();
    }
  }
  return '';
}

/**
 * Detecta automáticamente la fila real de encabezados en las primeras 20 filas de una hoja Excel/CSV
 * (útil cuando el archivo tiene membrete corporativo SG-SST en las filas superiores) y retorna las filas JSON.
 */
function extractSpreadsheetRowsSmart(sheet, XLSX) {
  if (!sheet || !XLSX) return [];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!Array.isArray(matrix) || matrix.length === 0) return [];

  const headerTokens = [
    'nombre',
    'nombres',
    'trabajador',
    'colaborador',
    'empleado',
    'cedula',
    'identificacion',
    'documento',
    'cargo',
    'puesto',
    'nacimiento',
    'edad',
    'genero',
    'sexo',
    'eps',
    'arl',
    'afp',
    'salario',
    'telefono',
    'celular',
    'correo',
  ];

  let bestRowIdx = 0;
  let bestScore = 0;
  const maxScan = Math.min(20, matrix.length);

  for (let r = 0; r < maxScan; r++) {
    const rowArr = matrix[r];
    if (!Array.isArray(rowArr)) continue;
    let score = 0;
    for (const cell of rowArr) {
      if (cell === undefined || cell === null) continue;
      const cellStr = normalizeHeaderKey(cell);
      if (!cellStr || cellStr.length > 65) continue;
      if (
        headerTokens.some(
          (tok) =>
            cellStr === tok ||
            cellStr.startsWith(`${tok} `) ||
            cellStr.endsWith(` ${tok}`) ||
            cellStr.includes(` ${tok} `),
        )
      ) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestRowIdx = r;
    }
  }

  const effectiveHeaderRow = bestScore >= 2 ? bestRowIdx : 0;
  return XLSX.utils.sheet_to_json(sheet, { defval: '', range: effectiveHeaderRow });
}

module.exports = {
  normalizeAnyDateYmd,
  normalizeBirthDateYmd,
  toUtcNoonDateOrNull,
  calculateAgeFromBirthDate,
  extractBirthDateFromRawRow,
  extractBirthPlaceFromRawRow,
  extractSpreadsheetRowsSmart,
};
