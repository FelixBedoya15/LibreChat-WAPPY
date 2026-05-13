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
      const html = result.value; 
      return res.json({ fileName: file.originalname, html, type: 'docx' });
    }
    
    // PDF Handling via pdf-parse v2
    if (originalName.endsWith('.pdf')) {
      const parser = new PDFParse({ data: file.buffer });
      try {
        const data = await parser.getText();
        
        return res.json({ 
          fileName: file.originalname, 
          text: data.text, 
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

module.exports = router;
