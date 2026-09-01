/**
 * fileExtractorHelper.js — Extracción unificada y robusta de texto en archivos para SGSST
 * Soporta PDF, Word (.docx, .doc), Excel (.xlsx, .xls, .csv, .ods), y texto plano / JSON.
 */

'use strict';

const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const XLSX = require('xlsx');
let logger = console;
try {
  logger = require('~/config').logger || console;
} catch (e) {
  try {
    logger = require('../../../config').logger || console;
  } catch (e2) {
    logger = console;
  }
}

/**
 * Helper robusto para parsear PDFs soportando pdf-parse v2 y v1
 */
async function parsePdfBuffer(buffer) {
  const pdfLib = require('pdf-parse');

  // Caso 1: pdf-parse v2 (Class PDFParse)
  const PDFParseClass = pdfLib.PDFParse || (pdfLib.default && pdfLib.default.PDFParse);
  if (typeof PDFParseClass === 'function') {
    const parser = new PDFParseClass({ data: buffer });
    try {
      const data = await parser.getText();
      return (data && data.text) ? data.text.trim() : '';
    } finally {
      if (typeof parser.destroy === 'function') {
        try {
          await parser.destroy();
        } catch (e) {
          // ignore
        }
      }
    }
  }

  // Caso 2: pdf-parse v1 (Función directa)
  if (typeof pdfLib === 'function') {
    const data = await pdfLib(buffer);
    return (data && data.text) ? data.text.trim() : '';
  }

  // Caso 3: Export default como función
  if (pdfLib.default && typeof pdfLib.default === 'function') {
    const data = await pdfLib.default(buffer);
    return (data && data.text) ? data.text.trim() : '';
  }

  // Caso 4: Constructor directo
  try {
    const parser = new pdfLib({ data: buffer });
    if (typeof parser.getText === 'function') {
      const data = await parser.getText();
      if (typeof parser.destroy === 'function') await parser.destroy();
      return (data && data.text) ? data.text.trim() : '';
    }
  } catch (e) {
    // ignore
  }

  throw new Error('Estructura del módulo pdf-parse no compatible.');
}

/**
 * Extrae texto legible a partir de un buffer y metadatos de archivo
 * @param {Object} params
 * @param {Buffer} params.buffer - Buffer binario del archivo
 * @param {string} [params.fileName] - Nombre del archivo con extensión
 * @param {string} [params.mimeType] - MIME type reportado
 * @returns {Promise<string>} Texto extraído
 */
async function extractTextFromFile({ buffer, fileName = '', mimeType = '' }) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Buffer de archivo inválido.');
  }

  const name = (fileName || '').toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  // 1. Detectar si es PDF (%PDF-)
  const isPdf = mime.includes('pdf') || name.endsWith('.pdf') || (buffer.length >= 4 && buffer.slice(0, 4).toString() === '%PDF');
  if (isPdf) {
    try {
      const text = await parsePdfBuffer(buffer);
      if (text && text.trim()) {
        return text.trim();
      }
    } catch (err) {
      logger.warn(`[fileExtractorHelper] Error parseando PDF ${fileName}: ${err.message}`);
    }
  }

  // 2. Detectar si es Word (.docx / .doc)
  const isDocx = name.endsWith('.docx') || 
                mime.includes('wordprocessingml') || 
                mime.includes('officedocument.word') ||
                (buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4B && name.endsWith('.docx'));

  const isDoc = name.endsWith('.doc') || mime.includes('msword');

  if (isDocx || isDoc) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result && result.value && result.value.trim()) {
        return result.value.trim();
      }
    } catch (err) {
      logger.warn(`[fileExtractorHelper] Error parseando Word ${fileName} con mammoth: ${err.message}`);
    }
  }

  // 3. Detectar si es Excel / Hoja de Cálculo (.xlsx, .xls, .csv, .ods)
  const isExcel = name.endsWith('.xlsx') || 
                  name.endsWith('.xls') || 
                  name.endsWith('.csv') || 
                  name.endsWith('.tsv') || 
                  name.endsWith('.ods') || 
                  mime.includes('spreadsheet') || 
                  mime.includes('excel') || 
                  mime.includes('csv');

  if (isExcel) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let extractedSheets = '';
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        if (csv && csv.trim()) {
          extractedSheets += `--- Hoja: ${sheetName} ---\n${csv.trim()}\n\n`;
        }
      });
      if (extractedSheets.trim()) {
        return extractedSheets.trim();
      }
    } catch (err) {
      logger.warn(`[fileExtractorHelper] Error parseando Excel ${fileName}: ${err.message}`);
    }
  }

  // 4. Fallback: Intentar como texto UTF-8 plano si no contiene caracteres nulos excesivos
  try {
    const rawText = buffer.toString('utf8');
    // Si contiene más de 5% de bytes nulos o no imprimibles, es binario corrupto
    const nullCount = (rawText.match(/\0/g) || []).length;
    if (nullCount < 5 && rawText.trim().length > 0) {
      return rawText.trim();
    }
  } catch (err) {
    logger.warn(`[fileExtractorHelper] Error leyendo buffer como texto plano: ${err.message}`);
  }

  // Si falló todo pero era docx, intentar extraer texto HTML con mammoth
  if (isDocx) {
    try {
      const htmlResult = await mammoth.convertToHtml({ buffer });
      if (htmlResult && htmlResult.value && htmlResult.value.trim()) {
        return htmlResult.value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    } catch (e) {
      // ignore
    }
  }

  throw new Error(`No se pudo extraer texto legible del archivo ${fileName || 'adjunto'}. Asegúrate de que no esté protegido o dañado.`);
}

/**
 * Limpia y parsea de forma segura respuestas JSON devueltas por modelos de IA
 * @param {string} rawString
 * @returns {any}
 */
function cleanAndParseJson(rawString) {
  if (!rawString || typeof rawString !== 'string') {
    throw new Error('Respuesta de IA vacía o inválida.');
  }

  let clean = rawString.trim();

  // Quitar bloques de código markdown: ```json ... ``` o ``` ... ```
  clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Si aún tiene ``` dentro por alguna razón
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    // Intentar buscar el primer '[' o '{' y el último ']' o '}'
    const firstBracket = clean.indexOf('[');
    const firstBrace = clean.indexOf('{');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      startIdx = firstBracket;
      endIdx = clean.lastIndexOf(']');
    } else if (firstBrace !== -1) {
      startIdx = firstBrace;
      endIdx = clean.lastIndexOf('}');
    }

    if (startIdx !== -1 && endIdx > startIdx) {
      const sub = clean.substring(startIdx, endIdx + 1);
      return JSON.parse(sub);
    }

    throw new Error(`Error parseando JSON de IA: ${err.message}. Texto recibido: ${clean.substring(0, 200)}...`);
  }
}

module.exports = {
  extractTextFromFile,
  cleanAndParseJson,
};
