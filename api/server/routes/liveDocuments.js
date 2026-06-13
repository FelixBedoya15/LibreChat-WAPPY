const express = require('express');
const router = express.Router();
const multer = require('multer');
const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');
const { requireJwtAuth } = require('../middleware');
const LiveDocument = require('../../models/LiveDocument');
const { logger } = require('@librechat/data-schemas');

// Validación de Tamaño (Máximo 15MB para prevenir DDoS y problemas de Memoria)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB Limit
});

router.use(requireJwtAuth);

// Middleware para restringir endpoints a planes PRO o ADMIN
const requireProAuth = (req, res, next) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'USER_PRO') {
    return res.status(403).json({ error: 'Esta funcionalidad es exclusiva para cuentas Premium.' });
  }
  next();
};

// GET: Obtener historial de documentos del usuario
router.get('/', async (req, res) => {
  try {
    const docs = await LiveDocument.find({ user: req.user.id })
      .select('-content') // No traer el contenido completo en la vista de lista
      .sort({ updatedAt: -1 });
    res.json(docs);
  } catch (error) {
    logger.error('Error fetching live documents:', error);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

// GET: Obtener un documento específico
router.get('/:id', async (req, res) => {
  try {
    const doc = await LiveDocument.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
    res.json(doc);
  } catch (error) {
    logger.error('Error fetching document:', error);
    res.status(500).json({ error: 'Error al obtener documento' });
  }
});

// POST: Crear un nuevo documento guardado
router.post('/', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'USER_PRO') {
      const count = await LiveDocument.countDocuments({ user: req.user.id });
      if (count >= 1) {
        return res.status(403).json({ error: 'Has alcanzado el límite gratuito de documentos.' });
      }
    }
    const { title, content, originalFileName, originalFileType } = req.body;
    const newDoc = new LiveDocument({
      title: title || 'Documento sin título',
      content,
      originalFileName,
      originalFileType,
      user: req.user.id
    });
    const savedDoc = await newDoc.save();
    res.status(201).json(savedDoc);
  } catch (error) {
    logger.error('Error saving live document:', error);
    res.status(500).json({ error: 'Error al guardar el documento' });
  }
});

// PUT: Actualizar un documento (Permitido para el primer documento gratuito)
router.put('/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const doc = await LiveDocument.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { title, content, updatedAt: Date.now() } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
    res.json(doc);
  } catch (error) {
    logger.error('Error updating document:', error);
    res.status(500).json({ error: 'Error al actualizar documento' });
  }
});

// DELETE: Eliminar un documento
router.delete('/:id', async (req, res) => {
  try {
    const doc = await LiveDocument.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
    res.json({ message: 'Documento eliminado correctamente' });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});

// POST: Endpoint para extraer texto/html de un archivo subido
router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'USER_PRO') {
      const count = await LiveDocument.countDocuments({ user: req.user.id });
      if (count >= 1) {
        return res.status(403).json({ error: 'Has alcanzado el límite gratuito de importación.' });
      }
    }

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No se ha subido ningún archivo o excede el límite (15MB).' });
    if (!file.originalname) return res.status(400).json({ error: 'Archivo inválido.' });

    const originalName = file.originalname.toLowerCase();
    
    // DOCX Handling via Mammoth
    if (originalName.endsWith('.docx')) {
      const options = {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Heading 5'] => h5:fresh",
          "p[style-name='Heading 6'] => h6:fresh",
          "p[style-name='Title'] => h1.title:fresh",
          "p[style-name='Subtitle'] => h2.subtitle:fresh"
        ]
      };
      const result = await mammoth.convertToHtml({ buffer: file.buffer }, options);
      let html = result.value; 
      html = cleanDocxHtml(html);
      return res.json({ fileName: file.originalname, html, type: 'docx' });
    }
    
    // PDF Handling via pdf-parse v2
    if (originalName.endsWith('.pdf')) {
      const parser = new PDFParse({ data: file.buffer });
      try {
        const data = await parser.getText();
        let text = data.text;
        text = cleanPdfText(text);
        
        return res.json({ 
          fileName: file.originalname, 
          text: text, 
          type: 'pdf', 
          needsAiFormatting: true 
        });
      } finally {
        await parser.destroy();
      }
    }

    return res.status(400).json({ error: 'Formato de archivo no soportado. Debe ser .docx o .pdf' });
  } catch (error) {
    logger.error('Error extracting file content:', error);
    res.status(500).json({ error: 'Error al extraer el contenido del archivo' });
  }
});

/**
 * Limpia imágenes y párrafos repetitivos (encabezados/pies) en el HTML extraído de DOCX.
 */
function cleanDocxHtml(html) {
  if (!html) return html;
  
  // 1. Eliminar etiquetas <img> completas (incluyendo base64)
  let cleaned = html.replace(/<img\b[^>]*>/gi, '');

  // Expresión regular para números de página comunes
  const pageNumRegex = /^\s*(p[áa]g\w*\.?\s*\d+(\s*(de|\/)\s*\d+)?|\d+\s*(de|\/)\s*\d+|\bpage\s*\d+(\s*of\s*\d+)?|\b-\s*\d+\s*-|\d+)\s*$/i;

  // 2. Detectar y eliminar tablas vacías o repetitivas (encabezados/pies de página)
  const tableRegex = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  const tableFreq = {};
  let tMatch;
  while ((tMatch = tableRegex.exec(cleaned)) !== null) {
    const txt = tMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, '').trim();
    tableFreq[txt] = (tableFreq[txt] || 0) + 1;
  }
  
  cleaned = cleaned.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (tableMatch, tableContent) => {
    const txt = tableContent.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, '').trim();
    const isPageNum = pageNumRegex.test(txt);
    const isEmpty = txt.length === 0;
    const isRepeated = tableFreq[txt] > 1;
    
    if (isEmpty || isPageNum || (isRepeated && txt.length < 150)) {
      return '';
    }
    return tableMatch;
  });

  // 3. Extraer frecuencias de párrafos para limpiar duplicados del título principal
  const pRegex = /<p\b[^>]*>(.*?)<\/p>/gi;
  const freq = {};
  let pMatch;
  while ((pMatch = pRegex.exec(cleaned)) !== null) {
    const txt = pMatch[1].replace(/<[^>]+>/g, '').trim();
    freq[txt] = (freq[txt] || 0) + 1;
  }

  // Limpiar numeración de páginas o títulos principales duplicados
  cleaned = cleaned.replace(/<p\b[^>]*>(.*?)<\/p>/gi, (pMatch, pContent) => {
    const txt = pContent.replace(/<[^>]+>/g, '').trim();
    if (pageNumRegex.test(txt)) {
      return ''; // Strip page numbers
    }
    if (txt.toLowerCase() === 'reglamento interno de trabajo' && freq[txt] > 1) {
      freq[txt]--;
      return ''; // Strip duplicate titles
    }
    return pMatch;
  });

  // 4. Unir párrafos divididos por saltos de página/tablas
  // Unión de <li> contiguos
  cleaned = cleaned.replace(/<\/li>\s*<li>/gi, (match, offset, string) => {
    const beforeStr = string.slice(Math.max(0, offset - 100), offset);
    const beforeText = beforeStr.replace(/<[^>]+>/g, '').trim();
    const afterStr = string.slice(offset + match.length, offset + match.length + 100);
    const afterText = afterStr.replace(/<[^>]+>/g, '').trim();
    
    if (!beforeText || !afterText) return match;
    const lastChar = beforeText.slice(-1);
    const endsWithLetterOrComma = /[a-záéíóúñüA-Z0-9,\(\)]/.test(lastChar) && !/[.!?:]/.test(lastChar);
    const words = beforeText.split(/\s+/);
    const lastWord = words[words.length - 1].toLowerCase();
    const isIncompleteWord = /^(y|o|de|del|con|que|para|en|por|un|una|el|la|los|las|al|este|esta|se|sus|diecisiete)$/.test(lastWord);
    const firstChar = afterText.charAt(0);
    const startsWithLowercaseOrCont = /[a-záéíóúñü\(\d]/.test(firstChar);
    
    if ((endsWithLetterOrComma && startsWithLowercaseOrCont) || isIncompleteWord) {
      return ' ';
    }
    return match;
  });

  // Unión de <p> contiguos
  cleaned = cleaned.replace(/<\/p>\s*<p\b[^>]*>/gi, (match, offset, string) => {
    const beforeStr = string.slice(Math.max(0, offset - 100), offset);
    const beforeText = beforeStr.replace(/<[^>]+>/g, '').trim();
    const afterStr = string.slice(offset + match.length, offset + match.length + 100);
    const afterText = afterStr.replace(/<[^>]+>/g, '').trim();
    
    if (!beforeText || !afterText) return match;
    const lastChar = beforeText.slice(-1);
    const endsWithLetterOrComma = /[a-záéíóúñüA-Z0-9,\(\)]/.test(lastChar) && !/[.!?:]/.test(lastChar);
    const words = beforeText.split(/\s+/);
    const lastWord = words[words.length - 1].toLowerCase();
    const isIncompleteWord = /^(y|o|de|del|con|que|para|en|por|un|una|el|la|los|las|al|este|esta|se|sus|diecisiete)$/.test(lastWord);
    const firstChar = afterText.charAt(0);
    const startsWithLowercaseOrCont = /[a-záéíóúñü\(\d]/.test(firstChar);
    
    if ((endsWithLetterOrComma && startsWithLowercaseOrCont) || isIncompleteWord) {
      return ' ';
    }
    return match;
  });

  // Unión de </li> contiguo a <p>
  cleaned = cleaned.replace(/<\/li>\s*<p\b[^>]*>(.*?)<\/p>/gi, (match, innerContent, offset, string) => {
    const beforeStr = string.slice(Math.max(0, offset - 100), offset);
    const beforeText = beforeStr.replace(/<[^>]+>/g, '').trim();
    const afterText = innerContent.replace(/<[^>]+>/g, '').trim();
    
    if (!beforeText || !afterText) return match;
    const lastChar = beforeText.slice(-1);
    const endsWithLetterOrComma = /[a-záéíóúñüA-Z0-9,\(\)]/.test(lastChar) && !/[.!?:]/.test(lastChar);
    const words = beforeText.split(/\s+/);
    const lastWord = words[words.length - 1].toLowerCase();
    const isIncompleteWord = /^(y|o|de|del|con|que|para|en|por|un|una|el|la|los|las|al|este|esta|se|sus|diecisiete)$/.test(lastWord);
    const firstChar = afterText.charAt(0);
    const startsWithLowercaseOrCont = /[a-záéíóúñü\(\d]/.test(firstChar);
    
    if ((endsWithLetterOrComma && startsWithLowercaseOrCont) || isIncompleteWord) {
      return ' ' + innerContent + '</li>';
    }
    return match;
  });

  // 5. Promover Títulos, Capítulos y Artículos a encabezados y separar el cuerpo del artículo
  cleaned = cleaned.replace(/<(p|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi, (match, tagName, innerContent) => {
    const plainText = innerContent.replace(/<[^>]+>/g, '').trim();
    
    // Título Principal
    if (/^reglamento\s+interno\s+de\s+trabajo$/i.test(plainText)) {
      return `<h1>${plainText}</h1>`;
    }
    
    // Capítulo (ej. CAPÍTULO I, CAPÍTULO IV)
    const chapterMatch = plainText.match(/^(cap[íi]tulo\s+[ivxldcm]+[:.]?)\s*(.*)$/i);
    if (chapterMatch) {
      const header = chapterMatch[1];
      const rest = chapterMatch[2].trim();
      return rest ? `<h2>${header}</h2><p>${rest}</p>` : `<h2>${header}</h2>`;
    }
    
    // Artículo (ej. ARTÍCULO 1:, ARTÍCULO 10: El trabajo...)
    const articleMatch = plainText.match(/^(art[íi]culo\s+\d+[:.]?)\s*(.*)$/i);
    if (articleMatch) {
      const header = articleMatch[1];
      const rest = articleMatch[2].trim();
      return rest ? `<h3>${header}</h3><p>${rest}</p>` : `<h3>${header}</h3>`;
    }

    // Parágrafo (ej. PARÁGRAFO 1:, PARÁGRAFO 2)
    const paragrafoMatch = plainText.match(/^(par[áa]grafo\s+\d+[:.]?)\s*(.*)$/i);
    if (paragrafoMatch) {
      const header = paragrafoMatch[1];
      const rest = paragrafoMatch[2].trim();
      return rest ? `<h4>${header}</h4><p>${rest}</p>` : `<h4>${header}</h4>`;
    }
    
    return match;
  });

  // 6. Eliminar párrafos vacíos resultantes o restos de formato
  cleaned = cleaned.replace(/<p\b[^>]*>\s*(?:&nbsp;|<br\s*\/?>)*\s*<\/p>/gi, '');

  return cleaned;
}

/**
 * Limpia encabezados, pies de página y numeración de página en el texto extraído de PDF.
 */
function cleanPdfText(text) {
  if (!text) return text;

  // Split por carácter de salto de página form feed (\f)
  const pages = text.split(/\f/);

  if (pages.length <= 1) {
    // Si es solo una página, eliminamos números de página pero no analizamos repetitividad
    const lines = text.split('\n');
    const pageNumRegex = /^\s*(p[áa]g\w*\.?\s*\d+(\s*(de|\/)\s*\d+)?|\d+\s*(de|\/)\s*\d+|\bpage\s*\d+(\s*of\s*\d+)?|\b-\s*\d+\s*-|\d+)\s*$/i;
    const cleanLines = lines.filter(line => !pageNumRegex.test(line));
    return cleanLines.join('\n');
  }

  const pageLines = pages.map(page => page.split('\n').map(line => line.trim()));
  const topFreq = {};
  const bottomFreq = {};

  pageLines.forEach(lines => {
    // Tomar las primeras 3 líneas no vacías y con longitud > 2
    const topLines = lines.slice(0, 3).filter(l => l.length > 2);
    // Tomar las últimas 3 líneas no vacías y con longitud > 2
    const bottomLines = lines.slice(-3).filter(l => l.length > 2);

    const uniqueTop = [...new Set(topLines)];
    const uniqueBottom = [...new Set(bottomLines)];

    uniqueTop.forEach(line => {
      topFreq[line] = (topFreq[line] || 0) + 1;
    });

    uniqueBottom.forEach(line => {
      bottomFreq[line] = (bottomFreq[line] || 0) + 1;
    });
  });

  // Umbral: si aparece en el tope/pie de al menos 2 páginas
  const threshold = Math.max(2, Math.ceil(pages.length * 0.1));

  const headersToRemove = new Set();
  const footersToRemove = new Set();

  Object.keys(topFreq).forEach(line => {
    if (topFreq[line] >= threshold) {
      headersToRemove.add(line);
    }
  });

  Object.keys(bottomFreq).forEach(line => {
    if (bottomFreq[line] >= threshold) {
      footersToRemove.add(line);
    }
  });

  const pageNumRegex = /^\s*(p[áa]g\w*\.?\s*\d+(\s*(de|\/)\s*\d+)?|\d+\s*(de|\/)\s*\d+|\bpage\s*\d+(\s*of\s*\d+)?|\b-\s*\d+\s*-|\d+)\s*$/i;

  const cleanedPages = pageLines.map((lines) => {
    const totalLines = lines.length;
    return lines.filter((line, lineIndex) => {
      const trimmed = line.trim();
      if (!trimmed) return true;

      // Descartar si coincide con patrón de número de página
      if (pageNumRegex.test(trimmed)) {
        return false;
      }

      // Descartar si es un encabezado recurrente en las primeras 3 líneas
      if (lineIndex < 3 && headersToRemove.has(trimmed)) {
        return false;
      }

      // Descartar si es un pie de página recurrente en las últimas 3 líneas
      if (lineIndex >= totalLines - 3 && footersToRemove.has(trimmed)) {
        return false;
      }

      return true;
    });
  });

  return cleanedPages.map(page => page.join('\n')).join('\f');
}

module.exports = router;

