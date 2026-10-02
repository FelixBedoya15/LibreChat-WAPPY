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

  // Coincidencia exacta con algún sinónimo
  for (const syn of synonyms) {
    const normSyn = normalizeColumnName(syn);
    if (normCandidate === normSyn) {
      return 0.98;
    }
  }

  // Contención exacta
  if (normCandidate.includes(normKey) && normKey.length >= 3) {
    return 0.90;
  }
  if (normCandidate.includes(normLabel) && normLabel.length >= 4) {
    return 0.92;
  }

  for (const syn of synonyms) {
    const normSyn = normalizeColumnName(syn);
    if (normSyn.length >= 3) {
      if (normCandidate.includes(normSyn) || normSyn.includes(normCandidate)) {
        return 0.88;
      }
    }
  }

  // Coincidencia por palabras compartidas
  const candWords = candidate.toLowerCase().split(/[\s_\-\/\.]+/).filter(w => w.length > 2);
  const labelWords = targetLabel.toLowerCase().split(/[\s_\-\/\.]+/).filter(w => w.length > 2);
  
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
 * Lee un archivo Excel (File o ArrayBuffer) y extrae todas sus hojas con cabeceras y muestras.
 */
export function parseWorkbookSheets(data: ArrayBuffer): { workbook: XLSX.WorkBook; sheets: SheetInfo[] } {
  const workbook = XLSX.read(data, { type: 'array', cellDates: false });
  const sheets: SheetInfo[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Obtenemos los datos con encabezados como arreglo crudo
    const rawData = XLSX.utils.sheet_to_json<any>(sheet, { defval: '', blankrows: false });
    if (!rawData || rawData.length === 0) continue;

    // Detectar fila de cabeceras
    const firstRow = rawData[0];
    const headers = Object.keys(firstRow).filter(h => h && !h.startsWith('__EMPTY'));

    // Si no hay headers válidos, tratamos de leer como matriz
    if (headers.length === 0) {
      const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
      if (matrix && matrix.length > 0) {
        // Encontrar la primera fila con al menos 2 celdas de texto
        let bestHeaderRowIdx = 0;
        let maxTextCells = 0;
        for (let i = 0; i < Math.min(matrix.length, 5); i++) {
          const row = matrix[i] || [];
          const textCount = row.filter((c: any) => typeof c === 'string' && c.trim().length > 0).length;
          if (textCount > maxTextCells) {
            maxTextCells = textCount;
            bestHeaderRowIdx = i;
          }
        }
        const detectedHeaders = (matrix[bestHeaderRowIdx] || []).map((h: any, idx: number) => String(h || `Columna_${idx + 1}`).trim());
        const rowData = matrix.slice(bestHeaderRowIdx + 1).map((rowArr: any[]) => {
          const obj: Record<string, any> = {};
          detectedHeaders.forEach((dh: string, idx: number) => {
            obj[dh] = rowArr[idx] !== undefined ? rowArr[idx] : '';
          });
          return obj;
        });

        sheets.push({
          name: sheetName,
          headers: detectedHeaders.filter(Boolean),
          sampleRows: rowData.slice(0, 4),
          totalRows: rowData.length,
        });
        continue;
      }
    }

    sheets.push({
      name: sheetName,
      headers,
      sampleRows: rawData.slice(0, 4),
      totalRows: rawData.length,
    });
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
 */
export function transformRowsWithMapping(
  sheet: XLSX.WorkSheet,
  targetFields: TargetFieldDef[],
  mapping: Record<string, string>,
  emptyTemplate: Record<string, any> = {}
): MappingResult {
  const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '', blankrows: false });
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

