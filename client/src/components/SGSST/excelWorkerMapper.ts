/**
 * excelWorkerMapper.ts — Normalizador inteligente de encuestas y registros de trabajadores
 * Mapea de forma resiliente cualquier Excel / Google Forms / Microsoft Forms / SGSST export.
 */

export interface RawRow {
  [key: string]: any;
}

const SPANISH_AND_SHORT_MONTHS: Record<string, number> = {
  enero: 1, ene: 1, jan: 1, january: 1,
  febrero: 2, feb: 2, february: 2,
  marzo: 3, mar: 3, march: 3,
  abril: 4, abr: 4, apr: 4, april: 4,
  mayo: 5, may: 5,
  junio: 6, jun: 6, june: 6,
  julio: 7, jul: 7, july: 7,
  agosto: 8, ago: 8, aug: 8, august: 8,
  septiembre: 9, setiembre: 9, sept: 9, sep: 9, set: 9, september: 9,
  octubre: 10, oct: 10, october: 10,
  noviembre: 11, nov: 11, november: 11,
  diciembre: 12, dic: 12, dec: 12, december: 12,
};

function isValidCalendarYmd(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth;
}

function formatValidatedYmd(year: number, month: number, day: number): string {
  if (!isValidCalendarYmd(year, month, day)) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function expandTwoDigitYear(yy: number): number {
  const currentYY = new Date().getFullYear() % 100;
  return yy > currentYY + 10 ? 1900 + yy : 2000 + yy;
}

/**
 * Convierte fechas numéricas seriales de Excel (ej: 32345), objetos Date, ISO o cadenas de texto
 * (YYYY-MM-DD, DD/MM/YYYY, DD.MM.YYYY, años de 2 dígitos y fechas en español) a YYYY-MM-DD.
 * Si el texto NO es una fecha válida (ej. "Bogotá", "Sí", "No aplica"), retorna '' para no romper <input type="date">.
 */
export function excelSerialToDate(val: any): string {
  if (val === undefined || val === null || val === '' || typeof val === 'boolean') return '';

  // 1. Instancia nativa Date (usar UTC para evitar desfase horario UTC-5)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return formatValidatedYmd(val.getUTCFullYear(), val.getUTCMonth() + 1, val.getUTCDate());
  }

  // 2. Número serial de Excel (o cadena estrictamente numérica) en UTC con Math.round
  if (typeof val === 'number' || (typeof val === 'string' && /^\d+(\.\d+)?$/.test(val.trim()))) {
    const num = typeof val === 'number' ? val : parseFloat(val.trim());
    if (!isNaN(num) && num > 1000 && num < 100000) {
      const utcMs = Math.round((num - 25569) * 86400 * 1000);
      const dateInfo = new Date(utcMs);
      return formatValidatedYmd(
        dateInfo.getUTCFullYear(),
        dateInfo.getUTCMonth() + 1,
        dateInfo.getUTCDate(),
      );
    }
    return '';
  }

  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';

  // 3. Formato YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD o ISO con T / hora ("1988-07-21T00:00:00.000Z")
  const ymdMatch = trimmed.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})(?:[T\s].*)?$/);
  if (ymdMatch) {
    return formatValidatedYmd(Number(ymdMatch[1]), Number(ymdMatch[2]), Number(ymdMatch[3]));
  }

  // 4. Formato DD/MM/YYYY, DD-MM-YYYY o DD.MM.YYYY (con soporte inteligente si viene MM/DD/YYYY con día > 12)
  const dmy4Match = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:[T\s].*)?$/);
  if (dmy4Match) {
    const p1 = Number(dmy4Match[1]);
    const p2 = Number(dmy4Match[2]);
    const year = Number(dmy4Match[3]);
    if (p2 > 12 && p1 >= 1 && p1 <= 12) {
      return formatValidatedYmd(year, p1, p2);
    }
    return formatValidatedYmd(year, p2, p1);
  }

  // 5. Formato con año de 2 dígitos: DD/MM/YY, DD-MM-YY, DD.MM.YY (ej. "21/07/88" -> "1988-07-21")
  const dmy2Match = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})$/);
  if (dmy2Match) {
    const p1 = Number(dmy2Match[1]);
    const p2 = Number(dmy2Match[2]);
    const year = expandTwoDigitYear(Number(dmy2Match[3]));
    if (p2 > 12 && p1 >= 1 && p1 <= 12) {
      return formatValidatedYmd(year, p1, p2);
    }
    return formatValidatedYmd(year, p2, p1);
  }

  // 6. Fechas textuales en español/inglés ("21 de julio de 1988", "21 jul 1988", "21-jul-88", "julio 21 de 1988")
  const normText = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '')
    .trim();

  const esDmyMatch = normText.match(
    /^(\d{1,2})(?:\s+de\s+|[\s\/\-]+)([a-z]+)(?:\s+del?\s+|[\s\/\-]+)(\d{2,4})$/,
  );
  if (esDmyMatch) {
    const day = Number(esDmyMatch[1]);
    const month = SPANISH_AND_SHORT_MONTHS[esDmyMatch[2]];
    const rawYear = Number(esDmyMatch[3]);
    const year = esDmyMatch[3].length === 2 ? expandTwoDigitYear(rawYear) : rawYear;
    if (month) {
      return formatValidatedYmd(year, month, day);
    }
  }

  const esMdyMatch = normText.match(
    /^([a-z]+)\s+(\d{1,2})(?:,?\s+del?\s+|,?\s+|[\-\/])(\d{2,4})$/,
  );
  if (esMdyMatch) {
    const month = SPANISH_AND_SHORT_MONTHS[esMdyMatch[1]];
    const day = Number(esMdyMatch[2]);
    const rawYear = Number(esMdyMatch[3]);
    const year = esMdyMatch[3].length === 2 ? expandTwoDigitYear(rawYear) : rawYear;
    if (month) {
      return formatValidatedYmd(year, month, day);
    }
  }

  return '';
}

/**
 * Calcula la edad exacta en años cumplidos a partir de una fecha de nacimiento (YYYY-MM-DD u otro formato soportado),
 * parseando [y, m, d] directamente sin usar new Date('YYYY-MM-DD') para evitar desfases de zona horaria (UTC-5).
 */
export function computeAgeFromBirthDate(fechaStr?: string | null): string {
  if (!fechaStr) return '';
  const raw = String(fechaStr).trim();
  if (!raw) return '';
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : excelSerialToDate(raw);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return '';

  const [y, m, d] = normalized.split('-').map(Number);
  const now = new Date();
  const currentYear = now.getFullYear();
  if (!y || !m || !d || y < 1920 || y > currentYear) return '';

  const currM = now.getMonth() + 1;
  const currD = now.getDate();
  if (y === currentYear && (m > currM || (m === currM && d > currD))) {
    return '';
  }

  let age = currentYear - y;
  if (currM < m || (currM === m && currD < d)) {
    age--;
  }
  return age >= 0 && age <= 120 ? String(age) : '';
}

/**
 * Convierte un texto a Formato Tipo Oración / Título (Title Case):
 * "CARLOS DANIEL MONTILLA" -> "Carlos Daniel Montilla"
 * "jorge enrique pineda celis" -> "Jorge Enrique Pineda Celis"
 * Preserva acrónimos clave como SST, ARL, EPS, AFP, IPS, COPASST, PESV, etc.
 */
export function toTitleCase(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return text;

  const acronyms = new Set([
    'SST', 'SG-SST', 'SGSST', 'ARL', 'EPS', 'AFP', 'IPS', 'CC', 'TI', 'CE', 'NIT',
    'COPASST', 'PESV', 'GTC45', 'GTC', 'EPP', 'ATEL', 'SOAT', 'PILA', 'RIT', 'RHS',
    'IA', 'API', 'PDF', 'RH', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-',
    'SURA', 'AXA', 'SISO', 'HSE', 'COVI', 'QR'
  ]);

  const minorWords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'o', 'u', 'en', 'a', 'con', 'por', 'para', 'al']);

  return trimmed
    .split(/\s+/)
    .map((word, index) => {
      const upper = word.toUpperCase();
      if (acronyms.has(upper)) {
        return upper;
      }
      if (word.includes('/')) {
        return word.split('/').map((part, pIdx) => {
          const pUpper = part.toUpperCase();
          if (acronyms.has(pUpper)) return pUpper;
          const pLower = part.toLowerCase();
          if (pIdx > 0 && (minorWords.has(pLower) || pLower === 'a' || pLower === 'o')) return pLower;
          return pLower.charAt(0).toUpperCase() + pLower.slice(1);
        }).join('/');
      }
      if (word.includes('-')) {
        return word.split('-').map(part => {
          const pUpper = part.toUpperCase();
          if (acronyms.has(pUpper)) return pUpper;
          const pLower = part.toLowerCase();
          return pLower.charAt(0).toUpperCase() + pLower.slice(1);
        }).join('-');
      }
      const lower = word.toLowerCase();
      if (index > 0 && minorWords.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Normaliza nombres en formato "Apellido(s), Nombre(s)" a "Nombre(s) Apellido(s)" y aplica formato Tipo Oración
 */
export function formatWorkerName(rawName: string): string {
  if (!rawName) return '';
  let trimmed = rawName.trim().replace(/\s+/g, ' ');
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      trimmed = `${parts[1]} ${parts[0]}`;
    }
  }
  return toTitleCase(trimmed);
}

/**
 * Normaliza la estatura en metros (ej: '1,63' -> '1.63', '163' -> '1.63')
 */
export function formatHeightMeters(rawVal: string): string {
  if (!rawVal) return '';
  let clean = rawVal.trim().replace(',', '.');
  const num = parseFloat(clean);
  if (isNaN(num) || num <= 0) return rawVal.trim();
  if (num > 50 && num < 250) {
    // Está en centímetros (ej: 163 -> 1.63)
    return (num / 100).toFixed(2);
  }
  if (num > 0.5 && num < 2.5) {
    return num.toFixed(2);
  }
  return clean;
}

/**
 * Busca el valor de una fila según lista de patrones priorizados en los nombres de columna
 */
export function findRowValue(row: RawRow, patterns: string[], excludePatterns: string[] = []): string {
  const keys = Object.keys(row);

  for (const pattern of patterns) {
    const cleanPattern = pattern
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    for (const key of keys) {
      const cleanKey = key
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

      // Chequeo de exclusión
      const isExcluded = excludePatterns.some(ex => {
        const cleanEx = ex
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '');
        return cleanKey.includes(cleanEx);
      });

      if (isExcluded) continue;

      if (cleanKey.includes(cleanPattern)) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return String(val).trim();
        }
      }
    }
  }

  return '';
}

/**
 * Limpia y normaliza un valor de fecha desde Excel (serial numérico, DD/MM/YYYY, YYYY-MM-DD, "No aplica" o "Vigente").
 */
export function cleanDateField(rawVal: any): string {
  if (rawVal === undefined || rawVal === null || rawVal === '') return '';
  const str = String(rawVal).trim();
  if (!str || /^(no\s*aplica|n\/?a|ningun[oa]?|no|sin\s*fecha|-+)$/i.test(str)) {
    return '';
  }
  if (/^(vigente|s[ií]|aplica|certificado)$/i.test(str)) {
    return '2026-01-15';
  }
  return excelSerialToDate(rawVal);
}

/**
 * Normaliza un registro de trabajador (de cualquier fuente: Homologador, Importación Directa o API)
 * para garantizar coincidencia 100% con todas las casillas del formulario de Perfil Sociodemográfico y Condiciones de Salud.
 */
export function normalizeWorkerRecord(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const w: any = { ...raw };

  if (w.nombre) w.nombre = formatWorkerName(String(w.nombre));
  if (w.identificacion !== undefined && w.identificacion !== null) {
    w.identificacion = String(w.identificacion).replace(/\./g, '').trim();
  }
  if (w.cargo) w.cargo = toTitleCase(String(w.cargo));
  if (w.area) w.area = toTitleCase(String(w.area));
  if (w.municipioDomicilio) w.municipioDomicilio = toTitleCase(String(w.municipioDomicilio));
  if (w.barrio) w.barrio = toTitleCase(String(w.barrio));
  if (w.lugarNacimiento) w.lugarNacimiento = toTitleCase(String(w.lugarNacimiento));
  if (w.lugarResidencia) w.lugarResidencia = toTitleCase(String(w.lugarResidencia));

  // Género
  if (w.genero) {
    const g = String(w.genero).trim();
    if (/^f/i.test(g)) w.genero = 'Femenino';
    else if (/^m/i.test(g)) w.genero = 'Masculino';
    else w.genero = toTitleCase(g);
  }

  // Estado Civil
  if (w.estadoCivil) {
    const ec = String(w.estadoCivil).trim().toLowerCase();
    if (ec.startsWith('solter')) w.estadoCivil = 'Soltero/a';
    else if (ec.startsWith('casad')) w.estadoCivil = 'Casado/a';
    else if (ec.includes('union') || ec.includes('unión')) w.estadoCivil = 'Unión Libre';
    else if (ec.startsWith('separad') || ec.startsWith('divorciad')) w.estadoCivil = 'Separado/a';
    else if (ec.startsWith('viud')) w.estadoCivil = 'Viudo/a';
    else w.estadoCivil = toTitleCase(String(w.estadoCivil));
  }

  // Nivel de Escolaridad
  if (w.nivelEscolaridad) {
    const esc = String(w.nivelEscolaridad).trim().toLowerCase();
    if (esc === 'posgrado' || esc === 'postgrado' || esc === 'especializacion' || esc === 'especialización') {
      w.nivelEscolaridad = 'Especialización / Postgrado';
    } else {
      w.nivelEscolaridad = toTitleCase(String(w.nivelEscolaridad));
    }
  }

  // Estrato ("Estrato 2" -> "2")
  if (w.estrato !== undefined && w.estrato !== null && String(w.estrato).trim() !== '') {
    const estClean = String(w.estrato).replace(/estrato\s*/i, '').trim();
    w.estrato = estClean || String(w.estrato).trim();
  }

  // Tipo de Vivienda
  if (w.vivienda) {
    w.vivienda = toTitleCase(String(w.vivienda));
  }

  // Hábitos
  if (w.fuma) {
    const f = String(w.fuma).trim().toLowerCase();
    if (f === 'no') w.fuma = 'No';
    else if (f.includes('ocasional')) w.fuma = 'Sí, ocasional';
    else if (f.includes('diario') || f === 'sí' || f === 'si') w.fuma = 'Sí, diario';
  }
  if (w.alcohol) {
    const a = String(w.alcohol).trim().toLowerCase();
    if (a === 'no') w.alcohol = 'No';
    else if (a.includes('social')) w.alcohol = 'Sí (Social)';
    else if (a.includes('frecuente')) w.alcohol = 'Sí (Frecuente)';
    else if (a.includes('mensual')) w.alcohol = 'Mensual';
    else if (a.includes('semanal')) w.alcohol = 'Semanal';
  }
  if (w.terapiaPsicologica) {
    const tp = String(w.terapiaPsicologica).trim().toLowerCase();
    if (tp === 'si' || tp === 'sí') w.terapiaPsicologica = 'Sí';
    else if (tp === 'no') w.terapiaPsicologica = 'No';
    else if (tp.includes('anterior')) w.terapiaPsicologica = 'Anteriormente';
  }

  // EPS / AFP / PILA
  if (w.eps) {
    const epsStr = String(w.eps).trim();
    if (/eps\s*simulada/i.test(epsStr)) {
      w.eps = 'Sura';
    } else if (/nueva\s*eps/i.test(epsStr)) {
      w.eps = 'Nueva EPS';
    } else if (/sos|servicio\s*occidental/i.test(epsStr)) {
      w.eps = 'Servicio Occidental de Salud (SOS)';
    } else if (/fosyga|adres/i.test(epsStr)) {
      w.eps = 'FOSYGA / ADRES';
    } else {
      w.eps = toTitleCase(epsStr);
    }
  }
  if (w.afp) {
    const afpStr = String(w.afp).trim();
    if (/afp\s*simulada/i.test(afpStr)) {
      w.afp = 'Protección';
    } else {
      w.afp = toTitleCase(afpStr);
    }
  }
  if (w.estadoPila) {
    const pilaStr = String(w.estadoPila).trim();
    if (/simulado|pendiente/i.test(pilaStr)) {
      w.estadoPila = 'Pendiente de soporte PILA';
    } else if (/verificad|al\s*d[ií]a|pagad/i.test(pilaStr)) {
      w.estadoPila = 'Planilla Verificada / Al día';
    } else if (/mora|sin\s*cobertura/i.test(pilaStr)) {
      w.estadoPila = 'En mora / Sin cobertura';
    }
  }

  // Fechas normalizadas (excepto fechaNacimiento que tiene validación estricta de natalicio)
  const dateKeys = [
    'fechaExamenMedico',
    'fechaSeguimiento',
    'soatVencimiento',
    'tecnicomecanicaVencimiento',
    'licenciaConduccionVencimiento',
    'licenciaVencimiento',
    'fechaCursoAlturasAutorizado',
    'fechaCursoAlturasCoordinador',
    'curso50h',
    'curso20h',
    'fechaRetiro',
  ];
  for (const dk of dateKeys) {
    if (w[dk] !== undefined && w[dk] !== null) {
      w[dk] = cleanDateField(w[dk]);
    }
  }

  // Fecha de Nacimiento estricta + Edad autocalculada
  if (w.fechaNacimiento !== undefined && w.fechaNacimiento !== null) {
    const normBirth = excelSerialToDate(w.fechaNacimiento);
    if (normBirth && /^\d{4}-\d{2}-\d{2}$/.test(normBirth)) {
      const calcAge = computeAgeFromBirthDate(normBirth);
      if (calcAge !== '') {
        w.fechaNacimiento = normBirth;
        w.edad = Number(calcAge);
      } else {
        w.fechaNacimiento = '';
      }
    } else {
      w.fechaNacimiento = '';
    }
  }

  // Peso, Talla e IMC
  if (w.peso !== undefined && w.peso !== null) {
    w.peso = String(w.peso).replace(/kg/i, '').trim();
  }
  if (w.talla !== undefined && w.talla !== null) {
    const tStr = String(w.talla).trim();
    if (/^(no\s*aplica|n\/?a|vigente|s[ií]|no|-+)$/i.test(tStr)) {
      w.talla = '';
    } else {
      w.talla = formatHeightMeters(tStr);
    }
  }
  if (w.peso && w.talla) {
    const pNum = parseFloat(String(w.peso).replace(',', '.'));
    const tNum = parseFloat(String(w.talla).replace(',', '.'));
    if (!isNaN(pNum) && !isNaN(tNum) && pNum > 0 && tNum > 0) {
      const tMeters = tNum > 3 ? tNum / 100 : tNum;
      w.imc = (pNum / (tMeters * tMeters)).toFixed(1);
    }
  }

  // Licencia SST
  if (w.licenciaSST !== undefined && w.licenciaSST !== null) {
    const lsst = String(w.licenciaSST).trim();
    if (/^(no\s*aplica|n\/?a|ningun[oa]?|no|-+)$/i.test(lsst)) {
      w.licenciaSST = '';
    } else {
      w.licenciaSST = lsst;
    }
  }

  // Licencias de Conducción
  if (w.licenciaConduccion !== undefined && w.licenciaConduccion !== null) {
    const lcond = String(w.licenciaConduccion).trim();
    if (/^(no\s*aplica|n\/?a|ningun[oa]?|no|-+)$/i.test(lcond)) {
      w.licenciaConduccion = '';
    } else {
      w.licenciaConduccion = lcond;
    }
  }

  // Limpiar y construir arreglo licenciasConduccion
  if (Array.isArray(w.licenciasConduccion) && w.licenciasConduccion.length > 0) {
    w.licenciasConduccion = w.licenciasConduccion
      .filter((lic: any) => {
        const cat = String(lic?.categoria || '').trim();
        const num = String(lic?.numero || '').trim();
        if (/^(no\s*aplica|n\/?a|no|-+)$/i.test(cat) && /^(no\s*aplica|n\/?a|no|-+)$/i.test(num)) {
          return false;
        }
        if (cat === 'NO' && /^(no\s*aplica|n\/?a)$/i.test(num)) {
          return false;
        }
        return !!(cat || num || lic?.fechaVencimiento);
      })
      .map((lic: any) => ({
        ...lic,
        id: lic.id || crypto.randomUUID(),
        fechaVencimiento: cleanDateField(lic.fechaVencimiento),
      }));
  } else {
    w.licenciasConduccion = [];
  }

  if (w.licenciasConduccion.length === 0 && (w.licenciaConduccion || w.licenciaConduccionVencimiento)) {
    const rawLic = String(w.licenciaConduccion || '').trim();
    const rawVenc = String(w.licenciaConduccionVencimiento || '').trim();
    if (rawLic) {
      const cats = rawLic.split(',').map((s: string) => s.trim()).filter(Boolean);
      cats.forEach((c: string) => {
        const catMatch = c.match(/\b(A1|A2|B1|B2|B3|C1|C2|C3)\b/i);
        const numMatch = c.match(/N°\s*([0-9A-Za-z\-]+)/i);
        w.licenciasConduccion.push({
          id: crypto.randomUUID(),
          categoria: catMatch ? catMatch[1].toUpperCase() : (c.replace(/\(.*\)/, '').trim() || 'C1'),
          numero: numMatch ? numMatch[1] : (w.identificacion || ''),
          fechaVencimiento: rawVenc,
        });
      });
    } else if (rawVenc) {
      w.licenciasConduccion.push({
        id: crypto.randomUUID(),
        categoria: 'C1',
        numero: w.identificacion || '',
        fechaVencimiento: rawVenc,
      });
    }
  }

  // Comités y Consentimiento Firma
  const siNoKeys = ['esCopasst', 'esComiteConvivencia', 'esBrigadista', 'esComiteSeguridadVial', 'consentimientoFirmaDigital'];
  for (const snk of siNoKeys) {
    if (w[snk] !== undefined && w[snk] !== null && String(w[snk]).trim() !== '') {
      const val = String(w[snk]).trim().toLowerCase();
      w[snk] = (val === 'si' || val === 'sí' || val === 'true' || val === '1' || val === 'activo') ? 'Sí' : 'No';
    }
  }

  // Estado Laboral
  if (w.estadoLaboral) {
    const el = String(w.estadoLaboral).trim().toLowerCase();
    w.estadoLaboral = el.includes('retirad') || el.includes('inactiv') ? 'Retirado' : 'Activo';
  } else {
    w.estadoLaboral = 'Activo';
  }

  return w;
}

/**
 * Mapea filas importadas desde un archivo Excel a la lista de trabajadores completa (60 casillas)
 */
export function smartMapExcelToWorkers(importedRows: RawRow[], emptyWorkerTemplate: any = {}): any[] {
  if (!Array.isArray(importedRows) || importedRows.length === 0) {
    return [];
  }

  return importedRows.map((row, idx) => {
    // 1. Nombre
    const rawNombre = findRowValue(row, [
      'nombresyapellidos',
      'apellidosynombres',
      'nombrecompleto',
      'nombresyapellido',
      'apellidosynombre',
      'nombretrabajador',
      'colaborador',
      'empleado',
      'nombre',
    ]);
    const nombre = formatWorkerName(rawNombre);

    // 2. Identificación / Cédula
    const rawDoc = findRowValue(row, [
      'nodeidentificacion',
      'nodedocumento',
      'numerodedocumento',
      'numerodecedula',
      'nodecedula',
      'cedula',
      'identificacion',
      'documento',
      'cc',
    ]);
    const identificacion = rawDoc.replace(/\./g, '').trim() || (rawNombre ? `TEMP-${idx + 1}` : '');

    // 3. Cargo / Ocupación
    let cargo = findRowValue(
      row,
      [
        'cargodesempenado',
        'cargodesempena',
        'cargoposicion',
        'cargolaboral',
        'cargoactual',
        'cargos',
        'puestodetrabajo',
        'puesto',
        'ocupacion',
        'cargo',
      ],
      ['antiguedad', 'personasacargo', 'a cargo']
    );

    if (
      !cargo ||
      cargo.toLowerCase().includes('inferior') ||
      cargo.toLowerCase().includes('año') ||
      cargo.toLowerCase().includes('mes')
    ) {
      const fallbackCargo = findRowValue(
        row,
        ['tituloobtenido', 'profesion', 'titulouniversitario', 'areaproceso', 'area', 'proceso'],
        ['antiguedad']
      );
      if (fallbackCargo) cargo = fallbackCargo;
    }

    // 4. Género / Sexo
    const genero = findRowValue(row, ['genero', 'sexo']);

    // 5. Fecha de Nacimiento, Lugar de Nacimiento & Edad
    const fechaNacimiento = excelSerialToDate(
      findRowValue(
        row,
        [
          'fechadenacimiento',
          'fechanacimiento',
          'fnacimiento',
          'fechanac',
          'fecdenacimiento',
          'fecnacimiento',
          'fecnac',
          'fdenacimiento',
          'fnac',
          'birthdate',
          'cumpleanos',
          'natalicio',
          'nacimiento',
        ],
        [
          'lugar',
          'ciudad',
          'municipio',
          'departamento',
          'pais',
          'expedicion',
          'ingreso',
          'retiro',
          'examen',
          'emo',
          'venc',
        ],
      ),
    );
    const lugarNacimiento = findRowValue(
      row,
      ['lugardenacimiento', 'lugarnacimiento', 'ciudadnacimiento', 'municipionacimiento', 'dondenacio', 'ciudadorigen'],
      ['fecha', 'cumple', 'natalicio', 'birth'],
    );
    const edad = findRowValue(row, ['edadencumplidos', 'edadenanios', 'anioscumplidos', 'edad']);

    // 6. Contacto & Domicilio
    const direccion = findRowValue(row, ['direcciondelacasa', 'direcciondondevive', 'direccionresidencia', 'direccion']);
    const municipioDomicilio = findRowValue(row, ['enqueciudadvive', 'ciudaddondevive', 'municipiodomicilio', 'municipio', 'ciudad']);
    const barrio = findRowValue(row, ['barriodondevive', 'barrioresidencia', 'barrio']);
    const telefono = findRowValue(row, ['numerotelefonico', 'telefonofamiliar', 'telefonocelular', 'telefono', 'celular', 'movil']);
    const correoElectronico = findRowValue(row, ['correocorporativo', 'correoinstitucional', 'correoelectronico', 'correo', 'email']);

    // 7. Datos Sociodemográficos
    const estadoCivil = findRowValue(row, ['estadocivil'], ['laboral']);
    const personasCargo = findRowValue(row, ['personasacargo', 'personascargo', 'numerohijos']);
    const estrato = findRowValue(row, ['estrato']);
    const vivienda = findRowValue(row, ['tenenciadevivienda', 'tipodevivienda', 'tipovivienda', 'vivienda']);
    const nivelEscolaridad = findRowValue(row, ['formacionacademica', 'nivelescolaridad', 'escolaridad', 'estudios']);
    const salario = findRowValue(row, ['salariobaseibc', 'salariobase', 'salariomensual', 'salario', 'sueldo', 'remuneracion', 'ibc']);

    // 8. Datos Médicos, Fisiológicos y Hábitos
    const rawPeso = findRowValue(row, ['cualessupeso', 'pesokg', 'peso']);
    const rawTalla = findRowValue(
      row,
      ['tallam', 'tallacm', 'talla', 'estatura', 'cualessualtura', 'alturamts'],
      ['curso', 'alturas', 'autorizado', 'coordinador']
    );
    const imc = findRowValue(row, ['imc', 'indicemasacorporal']);
    const presionArterial = findRowValue(row, ['presionarterial', 'tensionarterial', 'tension']);
    const frecuenciaCardiaca = findRowValue(row, ['frecuenciacardiaca', 'pulsaciones', 'pulso']);
    const alergiasQuimicas = findRowValue(row, ['alergiassensibilidadquimica', 'alergiasquimicas', 'alergias']);
    const enfermedades = findRowValue(
      row,
      ['enfermedadesactuales', 'enfermedadesdiagnosticadas', 'enfermedadescomunes', 'enfermedades'],
      ['diagnosticomedico', 'examen']
    );
    const medicamentos = findRowValue(row, ['medicamentosqueconsume', 'medicamentoshabituales', 'medicamentos']);
    const fuma = findRowValue(row, ['fuma', 'tabaquismo', 'fumador']);
    const alcohol = findRowValue(row, ['ingierebebidasalcoholicas', 'bebidasalcoholicas', 'consumoalcohol', 'alcohol']);
    const deporte = findRowValue(row, ['deporteactividadfisica', 'praticaalgundeporte', 'practicaalgundeporte', 'actividadfisica', 'deporte']);
    const alimentacion = findRowValue(row, ['calidaddealimentacion', 'habitodealimentacion', 'alimentacion', 'dieta']);
    const riesgoCardiovascular = findRowValue(row, ['riesgocardiovascular', 'framingham', 'cardiovascular']);
    const terapiaPsicologica = findRowValue(row, ['terapiapsicologica', 'apoyopsicosocial', 'psicologia']);

    // 9. Contacto de Emergencia
    const emergenciaContacto = findRowValue(row, [
      'contactodeemergencia',
      'contactoemergencia',
      'emergenciacontacto',
      'nombrecompletoyfamiliar',
      'parentescodeunfamiliar',
      'familiar',
    ]);

    // 10. Salud Ocupacional & Exámenes
    const fechaExamenMedico = cleanDateField(findRowValue(row, ['fechaexamenmedico', 'examenmedico', 'fechaexamen']));
    const fechaSeguimiento = cleanDateField(findRowValue(row, ['fechaseguimiento', 'proximocontrol', 'seguimiento']));
    const diagnosticoMedico = findRowValue(row, ['diagnosticomedico', 'conceptomedico', 'aptitudmedica']);
    const recomendacionesMedicas = findRowValue(row, ['recomendacionesmedicas', 'restriccionesmedicas', 'recomendaciones']);
    const limitacionesBiomecanicas = findRowValue(row, ['limitacionesbiomecanicas', 'limitacionfisica']);
    const tipoSangre = findRowValue(row, ['tipodesangre', 'tiposangre', 'gruposanguineo', 'rh']);

    // 10b. Seguridad Social (EPS, AFP y Estado PILA)
    const eps = findRowValue(row, ['entidadpromotoradesalud', 'entidadeps', 'eps', 'saludeps']);
    const afp = findRowValue(row, ['fondodepensiones', 'fondopensionesafp', 'fondopension', 'afp', 'pensiones']);
    const estadoPila = findRowValue(row, ['estadosoportepila', 'estadopila', 'soporterpila', 'pila', 'planillapila']) || 'Pendiente de soporte PILA';

    // 11. Conducción y Licencias
    const rawLicencia = row['Licencia(s) Conducción'] || row['Licencia Conducción'] || row['Licencia de Conducción'] || row.licenciaConduccion || findRowValue(row, ['licenciasconduccion', 'licenciaconduccion'], ['venc', 'sst', 'sgsst']) || '';
    const rawVencLicencia = row['Vencimiento(s) Licencia'] || row['Vencimiento Licencia Cond'] || row['Vencimiento Licencia'] || row.licenciaConduccionVencimiento || findRowValue(row, ['vencimientoslicencia', 'vencimientolicenciacond', 'vencimientolicencia'], ['soat', 'tecnico', 'sst', 'sgsst']) || '';
    const soatVencimiento = cleanDateField(row['Vencimiento SOAT'] || row.soatVencimiento || findRowValue(row, ['vencimientosoat', 'soat']));
    const tecnicomecanicaVencimiento = cleanDateField(row['Vencimiento Tecnicomecánica'] || row.tecnicomecanicaVencimiento || findRowValue(row, ['vencimientotecnicomecanica', 'vencimientotecnomecanica', 'tecnomecanica', 'rtm']));

    // 12. SST, Alturas y Comités
    const licenciaSST = row['N° Licencia SGSST'] || row.licenciaSST || findRowValue(row, ['nlicenciasgsst', 'licenciasgsst', 'licenciasst'], ['venc']) || '';
    const licenciaVencimiento = cleanDateField(row['Venc. Licencia SGSST'] || row.licenciaVencimiento || findRowValue(row, ['venclicenciasgsst', 'venclicenciasst', 'vencimientolicenciasst']));
    const curso50h = cleanDateField(row['Curso 50h'] || row.curso50h || findRowValue(row, ['curso50h', 'curso50horas']));
    const curso20h = cleanDateField(row['Curso 20h'] || row.curso20h || findRowValue(row, ['curso20h', 'curso20horas']));
    const fechaCursoAlturasAutorizado = cleanDateField(row['Curso Alturas Autorizado'] || row.fechaCursoAlturasAutorizado || findRowValue(row, ['cursoalturasautorizado', 'alturasautorizado']));
    const fechaCursoAlturasCoordinador = cleanDateField(row['Curso Alturas Coordinador'] || row.fechaCursoAlturasCoordinador || findRowValue(row, ['cursoalturascoordinador', 'alturascoordinador']));
    const esCopasst = row['COPASST'] || row.esCopasst || findRowValue(row, ['copasst']) || 'No';
    const esComiteConvivencia = row['Comité Convivencia'] || row.esComiteConvivencia || findRowValue(row, ['comiteconvivencia', 'convivencia']) || 'No';
    const esBrigadista = row['Brigadista'] || row.esBrigadista || findRowValue(row, ['brigadista', 'brigada']) || 'No';
    const esComiteSeguridadVial = row['Comité Seg. Vial'] || row.esComiteSeguridadVial || findRowValue(row, ['comiteseguridadvial', 'comitesegvial', 'pesv']) || 'No';
    const consentimientoFirmaDigital = row['Consentimiento Firma'] || row.consentimientoFirmaDigital || findRowValue(row, ['consentimientofirma', 'firmadigital']) || 'No';

    // 13. Estado Laboral y Retiro
    const estadoLaboral = row['Estado Laboral (Activo / Retirado)'] || row['Estado Laboral'] || row.estadoLaboral || findRowValue(row, ['estadolaboral', 'condicionlaboral', 'situacionlaboral'], ['civil', 'pila']) || 'Activo';
    const fechaRetiro = cleanDateField(row['Fecha de Retiro / Desvinculación'] || row['Fecha de Retiro'] || row.fechaRetiro || findRowValue(row, ['fechaderetiro', 'fecharetiro', 'fechadesvinculacion']));
    const motivoRetiro = row['Motivo de Retiro'] || row.motivoRetiro || findRowValue(row, ['motivoderetiro', 'motivoretiro', 'causaretiro']) || '';

    return normalizeWorkerRecord({
      ...emptyWorkerTemplate,
      id: row.id || crypto.randomUUID(),
      nombre: nombre || row['Nombre'] || row.nombre || '',
      identificacion: identificacion || row['Identificación'] || row.identificacion || '',
      cargo: cargo || row['Cargo'] || row.cargo || '',
      salario: salario || row['Salario'] || row['Salario Base / IBC ($)'] || row.salario || '',
      genero: genero || row['Género'] || row.genero || '',
      edad: edad || row['Edad'] || row.edad || '',
      fechaNacimiento: fechaNacimiento || row['Fecha de Nacimiento'] || row.fechaNacimiento || '',
      lugarNacimiento: lugarNacimiento || row['Lugar de Nacimiento'] || row.lugarNacimiento || '',
      direccion: direccion || row['Dirección'] || row.direccion || '',
      municipioDomicilio: municipioDomicilio || row['Municipio'] || row.municipioDomicilio || '',
      barrio: barrio || row['Barrio'] || row.barrio || '',
      telefono: telefono || row['Teléfono'] || row.telefono || '',
      correoElectronico: correoElectronico || row['Correo Electrónico'] || row.correoElectronico || '',
      estadoCivil: estadoCivil || row['Estado Civil'] || row.estadoCivil || '',
      personasCargo: personasCargo || row['Personas a Cargo'] || row.personasCargo || '',
      estrato: estrato || row['Estrato'] || row.estrato || '',
      vivienda: vivienda || row['Tipo de Vivienda'] || row.vivienda || '',
      nivelEscolaridad: nivelEscolaridad || row['Nivel Escolaridad'] || row.nivelEscolaridad || '',
      peso: rawPeso || row['Peso (kg)'] || row.peso || '',
      talla: rawTalla || row['Talla (m)'] || row.talla || '',
      imc: imc || row['IMC'] || row.imc || '',
      presionArterial: presionArterial || row['Presión Arterial'] || row.presionArterial || '',
      frecuenciaCardiaca: frecuenciaCardiaca || row['Frecuencia Cardíaca'] || row.frecuenciaCardiaca || '',
      alergiasQuimicas: alergiasQuimicas || row['Alergias / Sensibilidad Química'] || row.alergiasQuimicas || '',
      enfermedades: enfermedades || row['Enfermedades Actuales'] || row.enfermedades || '',
      medicamentos: medicamentos || row['Medicamentos'] || row.medicamentos || '',
      fuma: fuma || row['Fuma'] || row.fuma || '',
      alcohol: alcohol || row['Alcohol'] || row.alcohol || '',
      deporte: deporte || row['Deporte / Actividad Física'] || row.deporte || '',
      alimentacion: alimentacion || row['Calidad de Alimentación'] || row.alimentacion || '',
      riesgoCardiovascular: riesgoCardiovascular || row['Riesgo Cardiovascular'] || row.riesgoCardiovascular || '',
      terapiaPsicologica: terapiaPsicologica || row['Terapia Psicológica'] || row.terapiaPsicologica || '',
      emergenciaContacto: emergenciaContacto || row['Contacto de Emergencia'] || row.emergenciaContacto || '',
      fechaExamenMedico: fechaExamenMedico || row['Fecha Examen Médico'] || row.fechaExamenMedico || '',
      fechaSeguimiento: fechaSeguimiento || row['Fecha Seguimiento'] || row.fechaSeguimiento || '',
      diagnosticoMedico: diagnosticoMedico || row['Diagnóstico Médico'] || row.diagnosticoMedico || '',
      recomendacionesMedicas: recomendacionesMedicas || row['Recomendaciones Medicas'] || row.recomendacionesMedicas || '',
      limitacionesBiomecanicas: limitacionesBiomecanicas || row['Limitaciones Biomecánicas'] || row.limitacionesBiomecanicas || '',
      tipoSangre: tipoSangre || row['Tipo de Sangre'] || row.tipoSangre || '',
      eps: eps || row['EPS'] || row['Entidad EPS'] || row.eps || '',
      afp: afp || row['AFP'] || row['Fondo Pensiones (AFP)'] || row.afp || '',
      estadoPila: estadoPila || row['Estado Soporte PILA'] || row.estadoPila || 'Pendiente de soporte PILA',
      soatVencimiento: soatVencimiento || '',
      tecnicomecanicaVencimiento: tecnicomecanicaVencimiento || '',
      licenciaConduccion: rawLicencia || '',
      licenciaConduccionVencimiento: cleanDateField(rawVencLicencia),
      licenciasConduccion: Array.isArray(row.licenciasConduccion) ? row.licenciasConduccion : [],
      licenciaSST: licenciaSST || '',
      licenciaVencimiento: licenciaVencimiento || '',
      curso50h: curso50h || '',
      curso20h: curso20h || '',
      fechaCursoAlturasAutorizado: fechaCursoAlturasAutorizado || '',
      fechaCursoAlturasCoordinador: fechaCursoAlturasCoordinador || '',
      esCopasst: esCopasst || 'No',
      esComiteConvivencia: esComiteConvivencia || 'No',
      esBrigadista: esBrigadista || 'No',
      esComiteSeguridadVial: esComiteSeguridadVial || 'No',
      consentimientoFirmaDigital: consentimientoFirmaDigital || 'No',
      estadoLaboral: estadoLaboral || 'Activo',
      fechaRetiro: fechaRetiro || '',
      motivoRetiro: motivoRetiro || '',
      completedByAI: false,
    });
  });
}
