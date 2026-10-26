/**
 * columnMapperEngine.ts — Motor de Homologación y Mapeo Universal de Columnas Excel
 * WAPPY Somos SST Design System
 * 
 * Permite leer cualquier Excel empresarial, detectar cabeceras y hojas,
 * emparejar casillas mediante heurística inteligente / similitud de texto,
 * previsualizar en tiempo real y transformar miles de filas en código local (0 tokens, 100% certero).
 */

import * as XLSX from 'xlsx';
import { excelSerialToDate } from './excelWorkerMapper';

export interface TargetFieldDef {
  key: string;
  label: string;
  required?: boolean;
  description?: string;
  synonyms?: string[];
  type?: 'string' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  defaultValue?: any;
}

export interface SheetInfo {
  name: string;
  headers: string[];
  sampleRows: Record<string, any>[];
  allRows: Record<string, any>[];
  totalRows: number;
}

export interface MappingResult {
  mappedRows: any[];
  totalRows: number;
  validCount: number;
  skippedCount: number;
  warnings: string[];
}

/**
 * Normaliza una cadena para comparaciones insensibles a mayúsculas, tildes y caracteres especiales.
 */
export function normalizeColumnName(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

const STOP_WORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'en', 'y', 'o', 'a', 'para', 'por', 'un', 'una',
  'valor', 'nivel', 'tabla', 'columna', 'formato'
]);

/**
 * Calcula la similitud de Jaccard / Levenshtein aproximada entre dos cadenas limpias.
 */
export function calculateMatchScore(candidate: string, targetKey: string, targetLabel: string, synonyms: string[] = []): number {
  const normCandidate = normalizeColumnName(candidate);
  if (!normCandidate) return 0;

  // Evitar que campos numéricos de evaluación (nd, ne, np, nc, nr) se asocien por error a columnas cualitativas de "Interpretación"
  if (['nd', 'ne', 'np', 'nc', 'nr'].includes(targetKey) && (normCandidate.includes('interpretacion') || normCandidate.includes('significado'))) {
    return 0;
  }
  if (['interpretacion_np', 'interpretacion_nr'].includes(targetKey) && !normCandidate.includes('interpretacion') && !normCandidate.includes('significado')) {
    return 0;
  }

  const normKey = normalizeColumnName(targetKey);
  const normLabel = normalizeColumnName(targetLabel);

  // Coincidencia exacta con la clave o etiqueta
  if (normCandidate === normKey || normCandidate === normLabel) {
    return 1.0;
  }

  // Reglas de alta precisión para encabezados extensos de matrices GTC-45 / SG-SST
  if (targetKey === 'peligro_clasificacion' && normCandidate.includes('clasificacion') && normCandidate.includes('peligro')) {
    return 0.96;
  }
  if (targetKey === 'peligro_descripcion' && normCandidate.includes('descripcion') && normCandidate.includes('peligro')) {
    return 0.96;
  }
  if (targetKey === 'cargo' && normCandidate.startsWith('cargo')) {
    return 0.95;
  }
  if (targetKey === 'proceso' && normCandidate.startsWith('proceso')) {
    return 0.95;
  }
  if (targetKey === 'zona' && (normCandidate.startsWith('areasitio') || normCandidate.startsWith('zonalugar') || normCandidate.startsWith('area'))) {
    return 0.95;
  }

  for (const syn of synonyms) {
    const normSyn = normalizeColumnName(syn);
    if (!normSyn) continue;

    // Coincidencia exacta con el sinónimo
    if (normCandidate === normSyn) {
      return 0.98;
    }

    // Prefijo o sufijo exacto
    if (normCandidate.startsWith(normSyn) || normCandidate.endsWith(normSyn)) {
      if (normSyn.length >= 4) return 0.92;
    }

    // Contención de sinónimo en candidato o viceversa
    if (normCandidate.includes(normSyn)) {
      if (normSyn.length >= 6 || normCandidate.length <= normSyn.length + 5) {
        return 0.88;
      }
      if (normSyn.length >= 4) {
        return 0.75;
      }
    } else if (normSyn.includes(normCandidate) && normCandidate.length >= 4) {
      return 0.85;
    }
  }

  // Coincidencia por palabras compartidas (filtrando stop words como "de", "del", "nivel", etc.)
  const candWords = candidate.toLowerCase().split(/[\s_\-\/\.]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const labelWords = targetLabel.toLowerCase().split(/[\s_\-\/\.]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
  if (candWords.length > 0 && labelWords.length > 0) {
    let matches = 0;
    for (const cw of candWords) {
      const ncw = normalizeColumnName(cw);
      if (labelWords.some(lw => normalizeColumnName(lw) === ncw)) {
        matches++;
      }
    }
    if (matches > 0) {
      return 0.70 + (matches / Math.max(candWords.length, labelWords.length)) * 0.15;
    }
  }

  return 0;
}

const HEADER_KEYWORDS_REGEX = /\b(nd|ne|np|nc|nr|epp|nit)\b|proceso|zona|lugar|[aá]rea|sitio|cargo|actividad|tarea|rutinari|peligro|riesgo|clasificaci|descripci|efecto|consecuencia|control|fuente|medio|individuo|trabajador|deficiencia|exposici|probabilidad|aceptabilidad|eliminaci|sustituci|ingenier[ií]a|administrativ|protecci[oó]n|expuesto|requisito|legal|sede|nombre|c[eé]dula|identificaci[oó]n|documento|fecha|estado|responsable|da[ñn]o/i;

const METADATA_BANNER_REGEX = /^(versi[oó]n|p[aá]gina|\d+\s*de\s*\d+|fecha\s*de\s*vigencia|fecha\s*de\s*elaboraci[oó]n|c[oó]digo|nit|instrucciones\s*para\s*diligenciar|tabla\s*\d+|aceptabilidad\s*del\s*riesgo\s*:?)$/i;

const SUPER_CATEGORY_BANNER_REGEX = /^(evaluaci[oó]n\s+del\s+riesgo|gesti[oó]n\s+del\s+riesgo|identificaci[oó]n\s+del\s+peligro|valoraci[oó]n\s+del\s+riesgo|medidas\s+de\s+intervenci[oó]n|riesgo\s+y\s+consecuencia|peligros?\s+y\s+riesgos?|peligro\s*\/\s*riesgo)/i;

const SELF_DESCRIPTIVE_SUBHEADER_REGEX = /^(nivel\s+de|interpretaci[oó]n|aceptabilidad|existencia\s+de|elementos\s+de|controles\s+en|controles\s+de|controles\s+sobre|proceso|actividad|tarea|[aá]rea|zona|cargo|clasificaci[oó]n|descripci[oó]n|efectos|peor\s+consecuencia|requisito|eliminaci[oó]n|sustituci[oó]n|horas\s+de|rutinari|\b(nd|ne|np|nc|nr)\b)/i;

const CONTEXT_CARRY_COL_REGEX = /^(n[º°o]|item|proceso|[aá]rea|sitio|zona|lugar|ubicaci[oó]n|cargo|actividad|tarea|rutinari|sede|personas\s+expuestas|horas\s+de\s+exposici[oó]n|clasificaci[oó]n\s+de\s+peligro|clasificaci[oó]n\s+del\s+peligro)/i;

const HAZARD_SPECIFIC_COL_REGEX = /(descripci[oó]n\s+del\s+peligro|peligro|efectos\s+posibles|categor[ií]a\s+del\s+da[ñn]o|nivel\s+de\s+da[ñn]o|nivel\s+de\s+deficiencia|nivel\s+de\s+exposici[oó]n|nivel\s+de\s+consecuencia|peor\s+consecuencia|controles\s+administrativo|requisitos\s+legales|existencia\s+de\s+requisito|\b(nd|ne|nc)\b)/i;

function cleanCellText(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Propaga los valores de celdas combinadas (!merges) vertical y horizontalmente en la matriz 2D.
 */
export function expandSheetMerges(matrix: any[][], merges?: XLSX.Range[]): void {
  if (!matrix || !Array.isArray(merges) || merges.length === 0) return;
  for (const m of merges) {
    if (!m || !m.s || !m.e) continue;
    const { r: sr, c: sc } = m.s;
    const { r: er, c: ec } = m.e;
    if (sr >= matrix.length) continue;
    const topVal = matrix[sr]?.[sc];
    if (topVal === undefined || topVal === null || cleanCellText(topVal) === '') continue;

    if (sc === ec && er > sr && (er - sr) <= 80) {
      for (let r = sr + 1; r <= Math.min(er, matrix.length - 1); r++) {
        if (!matrix[r]) matrix[r] = [];
        if (cleanCellText(matrix[r][sc]) === '') {
          matrix[r][sc] = topVal;
        }
      }
    } else if (sr === er && ec > sc && (ec - sc) <= 14) {
      for (let c = sc + 1; c <= ec; c++) {
        if (cleanCellText(matrix[sr][c]) === '') {
          matrix[sr][c] = topVal;
        }
      }
    } else if (er > sr && ec > sc && (er - sr) <= 4 && (ec - sc) <= 14) {
      for (let r = sr; r <= Math.min(er, matrix.length - 1); r++) {
        if (!matrix[r]) matrix[r] = [];
        for (let c = sc; c <= ec; c++) {
          if (cleanCellText(matrix[r][c]) === '') {
            matrix[r][c] = topVal;
          }
        }
      }
    }
  }
}

/**
 * Calcula un puntaje heurístico para identificar filas reales de encabezados de tabla
 * e ignorar banners de control documental ("PROCESO | VERSIÓN | PÁGINA") o filas de datos.
 */
function scoreHeaderCandidateRow(row: any[]): number {
  if (!row || !Array.isArray(row)) return 0;
  const nonEmpty: { col: number; txt: string }[] = [];
  for (let c = 0; c < row.length; c++) {
    const txt = cleanCellText(row[c]);
    if (txt) nonEmpty.push({ col: c, txt });
  }
  if (nonEmpty.length < 2) return 0;

  const pureNumericCount = nonEmpty.filter(x => /^\d+([.,]\d+)?$/.test(x.txt)).length;
  const standaloneSiNoCount = nonEmpty.filter(x => /^(si|sí|no|n\.a\.?)$/i.test(x.txt)).length;
  if (pureNumericCount >= 2 || (pureNumericCount >= 1 && standaloneSiNoCount >= 1) || standaloneSiNoCount >= 2) {
    return 0;
  }

  const firstColTxt = cleanCellText(row[0]);
  if (/^\d+$/.test(firstColTxt)) {
    return 0;
  }

  if (nonEmpty.some(x => x.txt.length > 260 || /^[A-ZÁÉÍÓÚÑ\s\/]{3,35}:\s+.{45,}/.test(x.txt))) {
    return 0;
  }

  if (nonEmpty.length <= 6 && nonEmpty.some(x => METADATA_BANNER_REGEX.test(x.txt))) {
    return 0;
  }

  const textCells = nonEmpty.filter(x => !/^(x|\d+([.,]\d+)?|si|sí|no|n\.a\.?)$/i.test(x.txt));
  if (textCells.length < 2) return 0;

  let keywordHits = 0;
  for (const item of textCells) {
    if (HEADER_KEYWORDS_REGEX.test(item.txt)) {
      keywordHits++;
    }
  }

  if (keywordHits < 2) return 0;

  return textCells.length * 3 + keywordHits * 8;
}

/**
 * Extrae de forma inteligente los encabezados (soportando 1, 2, 3 o 4 niveles) y las filas de datos,
 * sin contaminar con "Columna_1", "Columna_2", etc. y arrastrando celdas de actividad combinadas verticalmente.
 */
export function extractSheetHeadersAndRows(matrix: any[][]): { headers: string[]; allRows: Record<string, any>[] } {
  if (!matrix || matrix.length === 0) return { headers: [], allRows: [] };

  // 1. Determinar la columna máxima que realmente contiene datos o encabezado en la hoja
  let maxCol = -1;
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r] || [];
    for (let c = row.length - 1; c > maxCol; c--) {
      if (cleanCellText(row[c]) !== '') {
        maxCol = c;
        break;
      }
    }
  }

  if (maxCol === -1) return { headers: [], allRows: [] };

  // 2. Buscar la mejor fila de encabezado evaluando las primeras 200 filas
  const searchLimit = Math.min(matrix.length, 200);
  const scores: number[] = new Array(searchLimit).fill(0);
  for (let r = 0; r < searchLimit; r++) {
    scores[r] = scoreHeaderCandidateRow(matrix[r]);
  }

  let headerRowIdx = -1;
  let bestCombinedScore = 0;
  for (let r = 0; r < searchLimit; r++) {
    if (scores[r] <= 0) continue;
    const nextScore = (r + 1 < searchLimit && scores[r + 1] >= 12) ? scores[r + 1] * 0.9 : 0;
    const thirdScore = (r + 2 < searchLimit && scores[r + 2] >= 12) ? scores[r + 2] * 0.8 : 0;
    const combined = scores[r] + nextScore + thirdScore;
    if (combined > bestCombinedScore) {
      bestCombinedScore = combined;
      headerRowIdx = r;
    }
  }

  // Respaldo: primera fila con al menos 2 celdas de texto
  if (headerRowIdx === -1) {
    for (let r = 0; r < Math.min(matrix.length, 20); r++) {
      if ((matrix[r] || []).filter((c: any) => cleanCellText(c) !== '').length >= 2) {
        headerRowIdx = r;
        break;
      }
    }
  }

  if (headerRowIdx === -1) return { headers: [], allRows: [] };

  // 3. Expandir el bloque de encabezados [hStart .. hEnd] (1 a 4 niveles)
  let hStart = headerRowIdx;
  let hEnd = headerRowIdx;

  for (let r = headerRowIdx + 1; r <= Math.min(matrix.length - 1, headerRowIdx + 3); r++) {
    if (scores[r] >= 12) {
      hEnd = r;
    }
  }
  for (let r = headerRowIdx - 1; r >= Math.max(0, headerRowIdx - 2); r--) {
    const row = matrix[r] || [];
    const hasMetadataBanner = row.some((c: any) => METADATA_BANNER_REGEX.test(cleanCellText(c)));
    const pureNum = row.filter((c: any) => /^\d+$/.test(cleanCellText(c))).length;
    const nonEmptyCount = row.filter((c: any) => cleanCellText(c) !== '').length;
    if (!hasMetadataBanner && pureNum === 0 && (scores[r] >= 12 || (nonEmptyCount >= 1 && nonEmptyCount <= 10))) {
      hStart = r;
    } else {
      break;
    }
  }

  const dataStartIdx = hEnd + 1;
  const colLimit = maxCol + 1;
  const rawHeaders: string[] = [];

  let currentGroupParent = '';
  for (let c = 0; c < colLimit; c++) {
    const colCells: string[] = [];
    for (let r = hStart; r <= hEnd; r++) {
      const txt = cleanCellText(matrix[r]?.[c]);
      if (txt && (colCells.length === 0 || colCells[colCells.length - 1].toLowerCase() !== txt.toLowerCase())) {
        colCells.push(txt);
      }
    }

    const specificCells = colCells.filter(t => !SUPER_CATEGORY_BANNER_REGEX.test(t));
    const effectiveCells = specificCells.length > 0 ? specificCells : [];

    let colName = '';
    if (effectiveCells.length >= 2) {
      const parent = effectiveCells[effectiveCells.length - 2];
      const leaf = effectiveCells[effectiveCells.length - 1];
      currentGroupParent = parent;

      if (parent.toLowerCase() === leaf.toLowerCase() || parent.toLowerCase().startsWith(leaf.toLowerCase())) {
        colName = parent;
      } else if (SELF_DESCRIPTIVE_SUBHEADER_REGEX.test(leaf) || leaf.length >= 24) {
        colName = leaf;
      } else {
        colName = `${parent} - ${leaf}`;
      }
    } else if (effectiveCells.length === 1) {
      const single = effectiveCells[0];
      const bottomVal = cleanCellText(matrix[hEnd]?.[c]);
      const isFromBottomRow = (hEnd > hStart && bottomVal && bottomVal.toLowerCase() === single.toLowerCase());

      if (isFromBottomRow && currentGroupParent && !SELF_DESCRIPTIVE_SUBHEADER_REGEX.test(single) && single.length < 24) {
        colName = `${currentGroupParent} - ${single}`;
      } else {
        if (!isFromBottomRow) currentGroupParent = '';
        colName = single;
      }
    } else {
      colName = '';
    }

    rawHeaders.push(colName);
  }

  // 4. Omitir columnas vacías sin encabezado para evitar generar "Columna_1", "Columna_2", etc.
  const namedCount = rawHeaders.filter(Boolean).length;
  const validCols: { colIdx: number; header: string }[] = [];
  const seen = new Map<string, number>();

  for (let c = 0; c < rawHeaders.length; c++) {
    let h = rawHeaders[c];
    if (!h) {
      if (namedCount >= 2) continue;
      h = `Columna_${c + 1}`;
    }
    let clean = h.trim().replace(/\s+/g, ' ');
    const lower = clean.toLowerCase();
    if (seen.has(lower)) {
      const count = seen.get(lower)! + 1;
      seen.set(lower, count);
      clean = `${clean} (${count})`;
    } else {
      seen.set(lower, 1);
    }
    validCols.push({ colIdx: c, header: clean });
  }

  const cleanedHeaders = validCols.map(vc => vc.header);
  const contextHeaders = cleanedHeaders.filter(h => CONTEXT_CARRY_COL_REGEX.test(h));
  const hazardHeaders = cleanedHeaders.filter(h => HAZARD_SPECIFIC_COL_REGEX.test(h));

  // 5. Extraer filas de datos reales (deteniéndose ante tablas secundarias de listas y arrastrando contexto de actividad)
  const allRows: Record<string, any>[] = [];
  const lastContextValues: Record<string, any> = {};

  for (let r = dataStartIdx; r < matrix.length; r++) {
    const rowArr = matrix[r] || [];
    const hasData = validCols.some(vc => cleanCellText(rowArr[vc.colIdx]) !== '');
    if (!hasData) continue;

    let repeatedHeaderMatches = 0;
    for (const vc of validCols) {
      const cellTxt = cleanCellText(rowArr[vc.colIdx]);
      if (cellTxt && cellTxt.length >= 5 && vc.header.toLowerCase().includes(cellTxt.toLowerCase())) {
        repeatedHeaderMatches++;
      }
    }
    const firstNonEmpty = cleanCellText(rowArr.find((c: any) => cleanCellText(c) !== ''));
    if (repeatedHeaderMatches >= 2 || /^(tabla\s+\d+|rutinaria\s+o\s+no\s+rutinaria|instrucciones)/i.test(firstNonEmpty)) {
      break;
    }

    const obj: Record<string, any> = {};
    for (const vc of validCols) {
      const rawVal = rowArr[vc.colIdx];
      obj[vc.header] = rawVal !== undefined && rawVal !== null ? rawVal : '';
    }

    const filledHazardCols = hazardHeaders.filter(hh => cleanCellText(obj[hh]) !== '').length;
    if (filledHazardCols >= 2 && contextHeaders.length > 0) {
      for (const ch of contextHeaders) {
        if (cleanCellText(obj[ch]) !== '') {
          lastContextValues[ch] = obj[ch];
        } else if (lastContextValues[ch] !== undefined && lastContextValues[ch] !== '') {
          obj[ch] = lastContextValues[ch];
        }
      }
    }

    allRows.push(obj);
  }

  return { headers: cleanedHeaders, allRows };
}

const AUXILIARY_SHEET_NAME_REGEX = /^(instrucci|instructivo|lista|variable|parametro|par[aá]metro|tabla|gu[ií]a|portada|control\s*de\s*cambio)/i;

/**
 * Lee un archivo Excel (File o ArrayBuffer) y extrae todas sus hojas con cabeceras y muestras.
 */
export function parseWorkbookSheets(data: ArrayBuffer): { workbook: XLSX.WorkBook; sheets: SheetInfo[] } {
  const workbook = XLSX.read(data, { type: 'array', cellDates: false });
  const sheets: SheetInfo[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Leemos la hoja como matriz 2D y expandimos celdas combinadas (!merges)
    const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
    if (!matrix || matrix.length === 0) continue;

    expandSheetMerges(matrix, sheet['!merges']);

    const { headers, allRows } = extractSheetHeadersAndRows(matrix);
    if (headers.length === 0) continue;

    const trimmedSheetName = sheetName.trim();
    for (const row of allRows) {
      if (!row['PROCESO'] && !row['proceso'] && !row['Proceso']) {
        row['_sheetSource'] = trimmedSheetName;
      }
    }

    sheets.push({
      name: trimmedSheetName,
      headers,
      sampleRows: allRows.slice(0, 10),
      allRows,
      totalRows: allRows.length,
    });
  }

  // Detección de Hojas de Procesos / Matrices Múltiples para Consolidación Automática:
  // Ignorar hojas auxiliares (INSTRUCCIONES, LISTAS, VARIABLES, TABLAS)
  const processSheets = sheets.filter(s =>
    s.headers.length >= 10 &&
    s.totalRows > 0 &&
    !AUXILIARY_SHEET_NAME_REGEX.test(s.name) &&
    s.headers.filter(h => !/^columna_\d+/i.test(h)).length >= 8
  );

  if (processSheets.length >= 2) {
    // 1. Construir unión ordenada de encabezados (excluyendo cualquier Columna_X residual)
    const unionHeaders: string[] = [];
    const headerSet = new Set<string>();

    for (const ps of processSheets) {
      for (const h of ps.headers) {
        if (/^columna_\d+/i.test(h)) continue;
        if (!headerSet.has(h)) {
          headerSet.add(h);
          unionHeaders.push(h);
        }
      }
    }

    // 2. Unificar todas las filas de los procesos
    const consolidatedRows: Record<string, any>[] = [];
    for (const ps of processSheets) {
      for (const row of ps.allRows) {
        const unifiedRow: Record<string, any> = { ...row };
        for (const h of unionHeaders) {
          if (unifiedRow[h] === undefined) {
            unifiedRow[h] = '';
          }
        }
        const procKey = unionHeaders.find(h => /^proceso/i.test(h));
        if (procKey && (!unifiedRow[procKey] || String(unifiedRow[procKey]).trim() === '')) {
          unifiedRow[procKey] = ps.name;
        }
        consolidatedRows.push(unifiedRow);
      }
    }

    // 3. Crear hoja consolidada maestra y colocarla en el primer lugar
    const consolidatedSheet: SheetInfo = {
      name: `★ Consolidado - Todas las Hojas (${consolidatedRows.length} registros)`,
      headers: unionHeaders,
      sampleRows: consolidatedRows.slice(0, 10),
      allRows: consolidatedRows,
      totalRows: consolidatedRows.length,
    };

    sheets.unshift(consolidatedSheet);
  } else if (sheets.length > 1) {
    // Priorizar hojas de matriz reales por encima de hojas de INSTRUCCIONES o LISTAS
    const bestSheetIdx = sheets.reduce((bestIdx, curr, idx, arr) => {
      const currIsAux = AUXILIARY_SHEET_NAME_REGEX.test(curr.name) ? 0.1 : 1;
      const bestIsAux = AUXILIARY_SHEET_NAME_REGEX.test(arr[bestIdx].name) ? 0.1 : 1;
      const currScore = curr.headers.length * (curr.totalRows > 0 ? 1 : 0.1) * currIsAux;
      const bestScore = arr[bestIdx].headers.length * (arr[bestIdx].totalRows > 0 ? 1 : 0.1) * bestIsAux;
      return currScore > bestScore ? idx : bestIdx;
    }, 0);

    if (bestSheetIdx > 0) {
      const [richSheet] = sheets.splice(bestSheetIdx, 1);
      sheets.unshift(richSheet);
    }
  }

  return { workbook, sheets };
}

/**
 * Realiza el emparejamiento automático de casillas entre los campos de WAPPY y las cabeceras de Excel.
 */
export function autoMatchColumns(
  targetFields: TargetFieldDef[],
  excelHeaders: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedHeaders = new Set<string>();

  // 1. Prioridad: Campos obligatorios primero
  const sortedFields = [...targetFields].sort((a, b) => (b.required ? 1 : 0) - (a.required ? 1 : 0));

  for (const field of sortedFields) {
    let bestHeader = '';
    let highestScore = 0;

    for (const header of excelHeaders) {
      if (usedHeaders.has(header)) continue;

      const score = calculateMatchScore(header, field.key, field.label, field.synonyms);
      if (score > highestScore && score >= 0.70) {
        highestScore = score;
        bestHeader = header;
      }
    }

    if (bestHeader) {
      mapping[field.key] = bestHeader;
      usedHeaders.add(bestHeader);
    } else {
      mapping[field.key] = '';
    }
  }

  return mapping;
}

/**
 * Normaliza y formatea el valor de una celda según su tipo destino.
 */
export function formatCellValue(rawValue: any, type?: 'string' | 'number' | 'date' | 'boolean' | 'select'): any {
  if (rawValue === undefined || rawValue === null) return '';

  if (type === 'date') {
    return excelSerialToDate(rawValue);
  }

  if (type === 'number') {
    if (typeof rawValue === 'number') return rawValue;
    const cleanNum = String(rawValue)
      .replace(/[\$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const parsed = parseFloat(cleanNum);
    return isNaN(parsed) ? '' : parsed;
  }

  if (type === 'boolean') {
    const s = String(rawValue).toLowerCase().trim();
    return s === 'si' || s === 'sí' || s === 'true' || s === '1' || s === 'x' || s === 'aplica';
  }

  // String / Select por defecto
  return String(rawValue).trim();
}

/**
 * Transforma todas las filas del archivo Excel utilizando el mapeo establecido.
 * Admite tanto un WorkSheet crudo como un arreglo de filas pre-parseadas (allRows).
 */
export function transformRowsWithMapping(
  source: XLSX.WorkSheet | Record<string, any>[],
  targetFields: TargetFieldDef[],
  mapping: Record<string, string>,
  emptyTemplate: Record<string, any> = {}
): MappingResult {
  let rawRows: Record<string, any>[] = [];

  if (Array.isArray(source)) {
    rawRows = source;
  } else if (source) {
    const matrix = XLSX.utils.sheet_to_json<any[]>(source, { header: 1, defval: '' });
    expandSheetMerges(matrix, source['!merges']);
    const extracted = extractSheetHeadersAndRows(matrix);
    rawRows = extracted.allRows.length > 0
      ? extracted.allRows
      : XLSX.utils.sheet_to_json<any>(source, { defval: '', blankrows: false });
  }

  const mappedRows: any[] = [];
  const warnings: string[] = [];
  let skipped = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const newRecord: Record<string, any> = { ...emptyTemplate };
    let hasAnyData = false;

    for (const field of targetFields) {
      const mappedHeader = mapping[field.key];
      if (mappedHeader && raw[mappedHeader] !== undefined && raw[mappedHeader] !== null) {
        const rawVal = raw[mappedHeader];
        const formatted = formatCellValue(rawVal, field.type);
        if (formatted !== '' && formatted !== undefined) {
          hasAnyData = true;
        }
        newRecord[field.key] = formatted;
      } else if (field.defaultValue !== undefined) {
        newRecord[field.key] = field.defaultValue;
      }
    }

    // Verificar si la fila tiene datos mínimos requeridos
    const requiredFields = targetFields.filter(f => f.required);
    let isRowValid = true;

    if (requiredFields.length > 0) {
      const hasAtLeastOneRequired = requiredFields.some(rf => {
        const val = newRecord[rf.key];
        return val !== undefined && val !== null && String(val).trim() !== '';
      });
      if (!hasAtLeastOneRequired) {
        isRowValid = false;
      }
    } else if (!hasAnyData) {
      isRowValid = false;
    }

    if (isRowValid) {
      mappedRows.push(newRecord);
    } else {
      skipped++;
    }
  }

  return {
    mappedRows,
    totalRows: rawRows.length,
    validCount: mappedRows.length,
    skippedCount: skipped,
    warnings,
  };
}

// ─── Gestión de Plantillas de Mapeo en LocalStorage ──────────────────────────

const STORAGE_PREFIX = 'wappy_column_mapping_template_';

export interface SavedTemplate {
  name: string;
  moduleKey: string;
  savedAt: string;
  mapping: Record<string, string>;
}

export function saveTemplate(moduleKey: string, templateName: string, mapping: Record<string, string>): void {
  try {
    const key = `${STORAGE_PREFIX}${moduleKey}`;
    const existingStr = localStorage.getItem(key);
    const list: SavedTemplate[] = existingStr ? JSON.parse(existingStr) : [];
    
    const index = list.findIndex(t => t.name.toLowerCase() === templateName.toLowerCase());
    const newEntry: SavedTemplate = {
      name: templateName.trim(),
      moduleKey,
      savedAt: new Date().toISOString(),
      mapping,
    };

    if (index >= 0) {
      list[index] = newEntry;
    } else {
      list.push(newEntry);
    }

    localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.error('Error guardando plantilla de mapeo:', err);
  }
}

export function getSavedTemplates(moduleKey: string): SavedTemplate[] {
  try {
    const key = `${STORAGE_PREFIX}${moduleKey}`;
    const str = localStorage.getItem(key);
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
}

export function deleteSavedTemplate(moduleKey: string, templateName: string): void {
  try {
    const key = `${STORAGE_PREFIX}${moduleKey}`;
    const str = localStorage.getItem(key);
    if (!str) return;
    const list: SavedTemplate[] = JSON.parse(str);
    const filtered = list.filter(t => t.name.toLowerCase() !== templateName.toLowerCase());
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error eliminando plantilla de mapeo:', err);
  }
}

/**
 * Genera y descarga un archivo Excel (.xlsx) para cualquier módulo SGSST,
 * ya sea con las columnas formateadas vacías (Plantilla/Formato) o con los datos reales existentes.
 */
export function exportModuleDataToExcel({
  targetFields,
  data = [],
  fileName,
  sheetName = 'Datos',
  isTemplate = false,
}: {
  targetFields: TargetFieldDef[];
  data?: any[];
  fileName: string;
  sheetName?: string;
  isTemplate?: boolean;
}): void {
  let rowsToExport: Record<string, any>[] = [];

  if (isTemplate || !data || data.length === 0) {
    const exampleRow: Record<string, any> = {};
    targetFields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        exampleRow[field.label] = field.defaultValue;
      } else if (field.type === 'number') {
        exampleRow[field.label] = 1;
      } else if (field.type === 'date') {
        exampleRow[field.label] = new Date().toISOString().split('T')[0];
      } else if (field.type === 'select' && field.options?.length) {
        exampleRow[field.label] = field.options[0];
      } else {
        const descSample = field.description ? field.description.split('.')[0].trim() : 'Dato de ejemplo';
        exampleRow[field.label] = descSample;
      }
    });
    rowsToExport = [exampleRow];
  } else {
    rowsToExport = data.map((item) => {
      const row: Record<string, any> = {};
      targetFields.forEach((field) => {
        let val = item[field.key];
        if (val === undefined || val === null) {
          val = item[field.label] ?? '';
        }
        if (typeof val === 'object' && val !== null) {
          if (Array.isArray(val)) {
            val = val.join(', ');
          } else {
            val = JSON.stringify(val);
          }
        }
        row[field.label] = val;
      });
      return row;
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rowsToExport);

  // Auto-ajustar ancho de columnas
  const colWidths = targetFields.map((f) => ({
    wch: Math.max(f.label.length, 20),
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  const cleanSheetName = (sheetName || 'Datos').replace(/[\\/?*:[\]]/g, '').substring(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, cleanSheetName);

  const finalName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}

