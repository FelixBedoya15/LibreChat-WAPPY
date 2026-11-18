'use strict';

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mammoth = require('mammoth');
const { logger } = require('@librechat/data-schemas');
const paths = require('~/config/paths');

/**
 * Classifies an uploaded Multer file or stored MongoFile by MIME type and extension.
 * @param {object} file
 */
function classifyFileAttachment(file = {}) {
  const mimeType = String(file.mimetype || file.type || '')
    .toLowerCase()
    .trim();
  const fileName = String(file.originalname || file.filename || file.filepath || '')
    .split('?')[0]
    .toLowerCase()
    .trim();
  const ext = path.extname(fileName).toLowerCase();

  const isSvg = mimeType === 'image/svg+xml' || ext === '.svg';
  const isImage =
    !isSvg &&
    (mimeType.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|bmp|tiff?|heic|heif|avif)$/i.test(ext));
  const isVideo =
    mimeType.startsWith('video/') ||
    /\.(mp4|webm|mov|avi|mkv|m4v|mpeg|mpg|3gp)$/i.test(ext);
  const isAudio =
    mimeType.startsWith('audio/') ||
    /\.(mp3|wav|ogg|m4a|aac|flac|opus|wma)$/i.test(ext);

  const isPdf = mimeType === 'application/pdf' || ext === '.pdf';

  const isExcel =
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.oasis.opendocument.spreadsheet' ||
    mimeType === 'text/csv' ||
    mimeType === 'application/csv' ||
    mimeType === 'text/tab-separated-values' ||
    /\.(xlsx|xls|xlsm|xlsb|ods|csv|tsv)$/i.test(ext);

  const isWord =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.ms-word' ||
    mimeType === 'application/rtf' ||
    mimeType === 'text/rtf' ||
    /\.(docx|doc|rtf)$/i.test(ext);

  const isPowerPoint =
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.ms-powerpoint' ||
    /\.(pptx|ppt)$/i.test(ext);

  const isPlainOrStructuredText =
    isSvg ||
    (!isExcel && !isWord && mimeType.startsWith('text/')) ||
    [
      'application/json',
      'application/ld+json',
      'application/xml',
      'text/xml',
      'application/javascript',
      'application/x-yaml',
      'text/yaml',
    ].includes(mimeType) ||
    /\.(txt|md|markdown|json|xml|html?|ya?ml|log|ini|conf|sql|js|ts|jsx|tsx|py|sh|css)$/i.test(
      ext,
    );

  const isOfficeOrText = isExcel || isWord || isPowerPoint || isPlainOrStructuredText;
  const isMultimediaOnly = isImage || isVideo || isAudio;

  return {
    mimeType,
    fileName,
    ext,
    isImage,
    isVideo,
    isAudio,
    isMultimediaOnly,
    isPdf,
    isExcel,
    isWord,
    isPowerPoint,
    isPlainOrStructuredText,
    isOfficeOrText,
  };
}

/**
 * Resolves the real local filesystem path of a Multer file or stored MongoFile
 * (handling LibreChat URL-style filepaths such as "/uploads/<userId>/<file_id>__name.xlsx"
 * and "/images/<userId>/...").
 *
 * @param {object} file
 * @param {object} [req]
 * @returns {string|null}
 */
function resolveDiskPathForAttachment(file = {}, req = null) {
  if (!file || typeof file !== 'object') {
    return null;
  }

  if (file.path && typeof file.path === 'string' && fs.existsSync(file.path)) {
    return file.path;
  }

  const rawFp = String(file.filepath || '').split('?')[0].trim();
  if (!rawFp) {
    return null;
  }

  if (fs.existsSync(rawFp)) {
    return rawFp;
  }

  const appPaths = req?.config?.paths || paths || {};
  const uploadsRoot = appPaths.uploads || paths?.uploads;
  const imageOutputRoot = appPaths.imageOutput || paths?.imageOutput;
  const publicRoot = appPaths.publicPath || paths?.publicPath;

  if (rawFp.includes('/uploads/') && uploadsRoot) {
    const sub = rawFp.split('/uploads/')[1];
    if (sub) {
      const candidate = path.join(uploadsRoot, sub);
      const rel = path.relative(uploadsRoot, candidate);
      if (!rel.startsWith('..') && !path.isAbsolute(rel) && fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  if (rawFp.includes('/images/')) {
    const sub = rawFp.split('/images/')[1];
    if (sub) {
      for (const baseDir of [
        imageOutputRoot,
        publicRoot ? path.join(publicRoot, 'images') : null,
      ].filter(Boolean)) {
        const candidate = path.join(baseDir, sub);
        const rel = path.relative(baseDir, candidate);
        if (!rel.startsWith('..') && !path.isAbsolute(rel) && fs.existsSync(candidate)) {
          return candidate;
        }
      }
    }
  }

  if (publicRoot && rawFp.startsWith('/')) {
    const candidate = path.join(publicRoot, rawFp.slice(1));
    const rel = path.relative(publicRoot, candidate);
    if (!rel.startsWith('..') && !path.isAbsolute(rel) && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Compacts raw CSV lines from an Excel sheet, removing trailing commas and empty lines.
 * @param {string} csv
 * @returns {string}
 */
function compactSheetCsv(csv) {
  if (!csv || !csv.trim()) {
    return '';
  }
  const cleaned = [];
  for (const line of csv.split(/\r?\n/)) {
    const trimmed = line.replace(/,+$/, '').trim();
    if (trimmed && !/^,+$/.test(trimmed)) {
      cleaned.push(trimmed);
    }
  }
  return cleaned.join('\n').trim();
}

/**
 * Converts simple HTML output from Mammoth (paragraphs, headings, lists, and tables)
 * into clean structured Markdown so Word tables retain row/column alignment.
 * @param {string} html
 * @returns {string}
 */
function convertMammothHtmlToStructuredText(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const decodeEntities = (str) =>
    String(str || '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");

  let out = html.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    const rows = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(tableHtml)) !== null) {
      const cells = [];
      const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let tdMatch;
      while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
        const cellText = decodeEntities(
          tdMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        ).replace(/\|/g, '\\|');
        cells.push(cellText);
      }
      if (cells.some(Boolean)) {
        rows.push(cells);
      }
    }
    if (rows.length === 0) {
      return '';
    }
    const colCount = rows.reduce((m, r) => Math.max(m, r.length), 1);
    const padRow = (r) =>
      Array.from({ length: colCount }, (_, idx) => r[idx] ?? '').join(' | ');
    const mdLines = [`| ${padRow(rows[0])} |`, `| ${Array(colCount).fill('---').join(' | ')} |`];
    for (let i = 1; i < rows.length; i++) {
      mdLines.push(`| ${padRow(rows[i])} |`);
    }
    return `\n\n${mdLines.join('\n')}\n\n`;
  });

  out = out
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lvl, inner) => {
      const hashes = '#'.repeat(Number(lvl) || 2);
      return `\n${hashes} ${inner.replace(/<[^>]+>/g, '').trim()}\n`;
    })
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => `- ${inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n`)
    .replace(/<\/(?:p|div|ul|ol|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return decodeEntities(out)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts readable text runs from legacy binary .doc / .ppt files when OOXML parsers fail.
 * @param {Buffer} buf
 * @returns {string}
 */
function extractPrintableLegacyStrings(buf) {
  if (!Buffer.isBuffer(buf) || buf.length === 0) {
    return '';
  }
  const utf8Matches = buf.toString('latin1').match(/[\x20-\x7E\xC0-\xFF]{5,}/g) || [];
  const utf16Clean = buf.toString('utf16le').match(/[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ,.;:()\-_/%$#"\n]{6,}/g) || [];
  const combined = [...utf16Clean, ...utf8Matches]
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length >= 6 &&
        !/^(Microsoft|Word\.Document|Normal\.dotm|Times New Roman|Calibri|Cambria|\[Content_Types\]|_rels\/|word\/)/i.test(
          s,
        ),
    );
  return [...new Set(combined)].join('\n').slice(0, 100000).trim();
}

/**
 * Extracts text from a PDF buffer supporting both pdf-parse v2 (`new PDFParse({ data })`) and v1 (`pdf(buf)`).
 * @param {Buffer} dataBuffer
 * @returns {Promise<string>}
 */
async function extractPdfTextFromBuffer(dataBuffer) {
  if (!Buffer.isBuffer(dataBuffer) || dataBuffer.length < 8) {
    return '';
  }
  const pdfLib = require('pdf-parse');
  const PDFParseClass = pdfLib?.PDFParse || (pdfLib?.default && pdfLib.default.PDFParse);
  let rawText = '';

  if (typeof PDFParseClass === 'function') {
    const parser = new PDFParseClass({ data: dataBuffer });
    try {
      const pdfData = await parser.getText();
      rawText = pdfData?.text || '';
    } finally {
      if (typeof parser.destroy === 'function') {
        try {
          await parser.destroy();
        } catch (_) {}
      }
    }
  } else if (typeof pdfLib === 'function') {
    const pdfData = await pdfLib(dataBuffer);
    rawText = pdfData?.text || '';
  } else if (pdfLib?.default && typeof pdfLib.default === 'function') {
    const pdfData = await pdfLib.default(dataBuffer);
    rawText = pdfData?.text || '';
  }

  return String(rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts full structured text from Excel, Word, PowerPoint, PDF, or plain/structured text files.
 *
 * @param {object} params
 * @param {object} params.file - Multer file or MongoFile
 * @param {object} [params.req] - Express request
 * @param {Buffer} [params.buffer] - Optional preloaded buffer
 * @returns {Promise<{ text: string, kind: ReturnType<typeof classifyFileAttachment>, diskPath: string|null }>}
 */
async function extractDocumentTextFromFile({ file, req = null, buffer = null }) {
  const kind = classifyFileAttachment(file);
  const diskPath = resolveDiskPathForAttachment(file, req);

  if (!buffer && !diskPath) {
    return { text: '', kind, diskPath: null };
  }

  const getBuffer = async () => {
    if (Buffer.isBuffer(buffer)) {
      return buffer;
    }
    return await fs.promises.readFile(diskPath);
  };

  try {
    if (kind.isExcel) {
      const dataBuf = await getBuffer();
      if (kind.ext === '.csv' || kind.ext === '.tsv' || kind.mimeType.includes('csv') || kind.mimeType.includes('tab-separated')) {
        const rawCsv = dataBuf.toString('utf8');
        const compacted = compactSheetCsv(rawCsv);
        return {
          text: compacted || rawCsv.trim(),
          kind,
          diskPath,
        };
      }
      const workbook = XLSX.read(dataBuf, { type: 'buffer', cellDates: true });
      const sheetBlocks = [];
      for (const sheetName of workbook.SheetNames || []) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;
        const rawCsv = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
        const compacted = compactSheetCsv(rawCsv);
        if (compacted) {
          sheetBlocks.push(`### Hoja: ${sheetName}\n${compacted}`);
        }
      }
      return {
        text: sheetBlocks.join('\n\n').trim(),
        kind,
        diskPath,
      };
    }

    if (kind.isWord) {
      const dataBuf = await getBuffer();
      if (kind.ext === '.rtf' || kind.mimeType.includes('rtf')) {
        const rtfClean = dataBuf
          .toString('latin1')
          .replace(/\\par[d]?/g, '\n')
          .replace(/\{\*?\\[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        return { text: rtfClean, kind, diskPath };
      }

      try {
        const [htmlRes, rawRes] = await Promise.all([
          mammoth.convertToHtml({ buffer: dataBuf }).catch(() => ({ value: '' })),
          mammoth.extractRawText({ buffer: dataBuf }).catch(() => ({ value: '' })),
        ]);
        let structured = '';
        if (htmlRes?.value && /<table[\s>]/i.test(htmlRes.value)) {
          structured = convertMammothHtmlToStructuredText(htmlRes.value);
        }
        const finalDocText = (structured || rawRes?.value || '').trim();
        if (finalDocText) {
          return { text: finalDocText, kind, diskPath };
        }
      } catch (mammothErr) {
        logger.debug(`[documentTextExtractor] Mammoth fallback for "${file.filename || file.originalname}": ${mammothErr.message}`);
      }

      return {
        text: extractPrintableLegacyStrings(dataBuf),
        kind,
        diskPath,
      };
    }

    if (kind.isPowerPoint) {
      const dataBuf = await getBuffer();
      try {
        const JSZip = require('jszip');
        const zip = await JSZip.loadAsync(dataBuf);
        const slideFiles = Object.keys(zip.files)
          .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
          .sort((a, b) => {
            const na = parseInt((a.match(/slide(\d+)\.xml/i) || [])[1] || '0', 10);
            const nb = parseInt((b.match(/slide(\d+)\.xml/i) || [])[1] || '0', 10);
            return na - nb;
          });
        const slideTexts = [];
        for (let idx = 0; idx < slideFiles.length; idx++) {
          const xml = await zip.files[slideFiles[idx]].async('string');
          const runs = [];
          const tRegex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/gi;
          let m;
          while ((m = tRegex.exec(xml)) !== null) {
            const clean = m[1]
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .trim();
            if (clean) runs.push(clean);
          }
          if (runs.length > 0) {
            slideTexts.push(`### Diapositiva ${idx + 1}\n${runs.join(' ')}`);
          }
        }
        if (slideTexts.length > 0) {
          return { text: slideTexts.join('\n\n').trim(), kind, diskPath };
        }
      } catch (pptxErr) {
        logger.debug(`[documentTextExtractor] PPTX zip parse fallback: ${pptxErr.message}`);
      }
      return { text: extractPrintableLegacyStrings(dataBuf), kind, diskPath };
    }

    if (kind.isPdf) {
      const dataBuf = await getBuffer();
      const pdfText = await extractPdfTextFromBuffer(dataBuf);
      return { text: pdfText, kind, diskPath };
    }

    if (kind.isPlainOrStructuredText) {
      const dataBuf = await getBuffer();
      return { text: dataBuf.toString('utf8').trim(), kind, diskPath };
    }
  } catch (err) {
    logger.warn(
      `[documentTextExtractor] Error extracting text from "${file?.filename || file?.originalname || 'file'}": ${err.message}`,
    );
  }

  return { text: '', kind, diskPath };
}

module.exports = {
  classifyFileAttachment,
  resolveDiskPathForAttachment,
  compactSheetCsv,
  convertMammothHtmlToStructuredText,
  extractPdfTextFromBuffer,
  extractDocumentTextFromFile,
};
