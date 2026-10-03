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

  const normKey = normalizeColumnName(targetKey);
  const normLabel = normalizeColumnName(targetLabel);

  // Coincidencia exacta con la clave o etiqueta
  if (normCandidate === normKey || normCandidate === normLabel) {
    return 1.0;
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

/**
 * Determina si una fila de una matriz Excel tiene características de fila de encabezados
 */
function isLikelyHeaderRow(row: any[]): boolean {
  if (!row || !Array.isArray(row)) return false;
  const textCells = row.filter(c => typeof c === 'string' && c.trim().length > 0);
  if (textCells.length < 2) return false;

  // Si la primera celda es un número secuencial (ej. 1, 2, 3), es una fila de datos
  if (typeof row[0] === 'number' || (/^\d+$/.test(String(row[0] || '').trim()))) {
    return false;
  }

  // Si contiene párrafos largos (> 70 caracteres), es contenido de datos, no un encabezado
  const hasLongNarrative = textCells.some(c => String(c).length > 70);
  if (hasLongNarrative) return false;

  return true;
}

/**
 * Extrae de forma inteligente los encabezados (incluso de 2 niveles/categorías) y las filas de datos.
 */
export function extractSheetHeadersAndRows(matrix: any[][]): { headers: string[]; allRows: Record<string, any>[] } {
  if (!matrix || matrix.length === 0) return { headers: [], allRows: [] };

  // 1. Determinar la columna máxima que realmente contiene datos o encabezado en la hoja
  let maxCol = -1;
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r] || [];
    for (let c = row.length - 1; c > maxCol; c--) {
      if (row[c] !== null && row[c] !== undefined && String(row[c]).trim() !== '') {
        maxCol = c;
        break;
      }
    }
  }

  if (maxCol === -1) return { headers: [], allRows: [] };

  // 2. Buscar fila candidata a encabezado en las primeras 10 filas
  let headerRowIdx = -1;
  for (let r = 0; r < Math.min(matrix.length, 10); r++) {
    if (isLikelyHeaderRow(matrix[r])) {
      headerRowIdx = r;
      break;
    }
  }

  // Respaldo: primera fila con al menos una celda de texto
  if (headerRowIdx === -1) {
    for (let r = 0; r < Math.min(matrix.length, 10); r++) {
      if ((matrix[r] || []).some((c: any) => c !== null && c !== undefined && String(c).trim() !== '')) {
        headerRowIdx = r;
        break;
      }
    }
  }

  if (headerRowIdx === -1) return { headers: [], allRows: [] };

  // Verificar si la fila siguiente también es un sub-encabezado (encabezado multinivel de matrices GTC-45)
  let isMultiHeader = false;
  if (headerRowIdx + 1 < matrix.length && isLikelyHeaderRow(matrix[headerRowIdx + 1])) {
    isMultiHeader = true;
  }

  let finalHeaders: string[] = [];
  let dataStartIdx = headerRowIdx + 1;

  if (isMultiHeader) {
    dataStartIdx = headerRowIdx + 2;
    const r1 = matrix[headerRowIdx] || [];
    const r2 = matrix[headerRowIdx + 1] || [];
    const colLimit = Math.min(maxCol + 1, Math.max(r1.length, r2.length));

    let currentParent = '';
    for (let c = 0; c < colLimit; c++) {
      const top = String(r1[c] || '').trim();
      const sub = String(r2[c] || '').trim();

      if (top) currentParent = top;

      let colName = '';
      if (top && sub && top.toLowerCase() !== sub.toLowerCase()) {
        colName = `${top} - ${sub}`;
      } else if (sub) {
        colName = currentParent && !sub.toLowerCase().includes(currentParent.toLowerCase()) 
          ? `${currentParent} - ${sub}` 
          : sub;
      } else if (top) {
        colName = top;
      }
      finalHeaders.push(colName);
    }
  } else {
    const r1 = matrix[headerRowIdx] || [];
    const colLimit = Math.min(maxCol + 1, r1.length);
    for (let c = 0; c < colLimit; c++) {
      finalHeaders.push(String(r1[c] || '').trim());
    }
    dataStartIdx = headerRowIdx + 1;
  }

  // Encontrar el último índice de columna con encabezado o contenido real (evitar columnas fantasma al final)
  let lastUsefulColIdx = -1;
  for (let c = finalHeaders.length - 1; c >= 0; c--) {
    if (finalHeaders[c] && finalHeaders[c].trim().length > 0) {
      lastUsefulColIdx = c;
      break;
    }
    // Verificar si alguna fila de datos tiene valor en esta columna
    for (let r = dataStartIdx; r < matrix.length; r++) {
      const val = matrix[r]?.[c];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        lastUsefulColIdx = c;
        break;
      }
    }
    if (lastUsefulColIdx !== -1) break;
  }

  if (lastUsefulColIdx >= 0 && lastUsefulColIdx < finalHeaders.length - 1) {
    finalHeaders = finalHeaders.slice(0, lastUsefulColIdx + 1);
  }

  // Deduplicar encabezados y reemplazar vacíos intermedios con Columna_X
  const seen = new Map<string, number>();
  const cleanedHeaders = finalHeaders.map((h, i) => {
    let clean = (h || `Columna_${i + 1}`).trim().replace(/\s+/g, ' ');
    const lower = clean.toLowerCase();
    if (seen.has(lower)) {
      const count = seen.get(lower)! + 1;
      seen.set(lower, count);
      clean = `${clean} (${count})`;
    } else {
      seen.set(lower, 1);
    }
    return clean;
  });

  // Extraer todas las filas de datos reales
  const allRows: Record<string, any>[] = [];
  for (let r = dataStartIdx; r < matrix.length; r++) {
    const rowArr = matrix[r] || [];
    const hasData = rowArr.some((c: any) => c !== null && c !== undefined && String(c).trim() !== '');
    if (!hasData) continue;
    const obj: Record<string, any> = {};
    cleanedHeaders.forEach((h, idx) => {
      obj[h] = rowArr[idx] !== undefined && rowArr[idx] !== null ? rowArr[idx] : '';
    });
    allRows.push(obj);
  }

  return { headers: cleanedHeaders, allRows };
}

/**
 * Lee un archivo Excel (File o ArrayBuffer) y extrae todas sus hojas con cabeceras y muestras.
 */
export function parseWorkbookSheets(data: ArrayBuffer): { workbook: XLSX.WorkBook; sheets: SheetInfo[] } {
  const workbook = XLSX.read(data, { type: 'array', cellDates: false });
  const sheets: SheetInfo[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Leemos la hoja como matriz 2D para inspección inteligente de encabezados y títulos
    const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
    if (!matrix || matrix.length === 0) continue;

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
  // Si hay 2 o más hojas con estructura de matriz amplia (>= 12 columnas y > 0 filas)
  const processSheets = sheets.filter(s => s.headers.length >= 12 && s.totalRows > 0);
  if (processSheets.length >= 2) {
    // 1. Construir unión ordenada de encabezados
    const unionHeaders: string[] = [];
    const headerSet = new Set<string>();

    for (const ps of processSheets) {
      for (const h of ps.headers) {
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
    // Si no hubo consolidación pero hay varias hojas, asegurar que la hoja
    // con mayor cantidad de columnas/datos no quede relegada por una hoja resumen vacía
    const maxColSheetIdx = sheets.reduce((bestIdx, curr, idx, arr) => 
      (curr.headers.length * (curr.totalRows > 0 ? 1 : 0.1) > arr[bestIdx].headers.length * (arr[bestIdx].totalRows > 0 ? 1 : 0.1)) ? idx : bestIdx, 0
    );
    if (maxColSheetIdx > 0 && sheets[0].headers.length < 10 && sheets[maxColSheetIdx].headers.length >= 15) {
      const [richSheet] = sheets.splice(maxColSheetIdx, 1);
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

