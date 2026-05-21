'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CanvasSession = require('~/models/CanvasSession');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { syncCanvasToLiveEditor } = require('./syncBridge');

async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

/**
 * Helper to automatically prepend standard company header and append signature section to text (Word) Canvas documents.
 * Safe against consecutive duplicates by inspecting content substrings.
 */
async function processTextDocument(content, fileType, title, userId) {
  if (fileType !== 'text') {
    return content;
  }

  let stringContent = content || '';

  const hasHeader = stringContent.includes('INFORMACIÓN RESUMIDA DE LA ENTIDAD');
  const hasSignature = stringContent.includes('signature-placeholder') || stringContent.includes('RESPONSABLE SG-SST') || stringContent.includes('Responsable SG-SST');

  if (hasHeader && hasSignature) {
    return stringContent;
  }

  let companyInfo = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!companyInfo) {
    companyInfo = await CompanyInfo.findOne({ user: userId });
  }

  if (!hasHeader) {
    const headerHtml = buildStandardHeader({
      title: title || 'DOCUMENTO DE TRABAJO',
      companyInfo
    });
    stringContent = headerHtml + '\n\n' + stringContent;
  }

  if (!hasSignature && companyInfo) {
    const signatureHtml = buildSignatureSection(companyInfo);
    stringContent = stringContent + '\n\n' + signatureHtml;
  }

  return stringContent;
}

/**
 * GET /api/sgsst/canvas/history
 * Obtiene el historial de todos los documentos canvas de la empresa.
 */
router.get('/history', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    const sessions = await CanvasSession.find({ companyId })
      .sort({ updatedAt: -1 })
      .limit(50);

    const conversations = sessions.map((session) => ({
      conversationId: session.conversationId,
      title: session.title || 'Archivo sin título',
      updatedAt: session.updatedAt,
      fileType: session.fileType
    }));

    res.json({ conversations });
  } catch (error) {
    logger.error('[Canvas History GET] Error:', error);
    res.status(500).json({ error: 'Error al obtener el historial de Canvas' });
  }
});

/**
 * GET /api/sgsst/canvas/:conversationId
 * Obtiene la sesión de canvas activa de una conversación.
 */
router.get('/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    let session = await CanvasSession.findOne({ conversationId });

    if (!session) {
      return res.json({
        content: '',
        title: 'Archivo sin título',
        fileType: 'text',
        version: 1,
        history: [],
      });
    }

    res.json({
      content: session.content,
      title: session.title,
      fileType: session.fileType,
      version: session.version,
      history: session.history || [],
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    logger.error('[Canvas GET] Error:', error);
    res.status(500).json({ error: 'Error al obtener la sesión de Canvas' });
  }
});

/**
 * POST /api/sgsst/canvas/:conversationId
 * Crea o actualiza la sesión de canvas de una conversación.
 * Registra un historial de versiones si el contenido cambia sustancialmente.
 */
router.post('/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, title, fileType } = req.body;
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    if (!fileType) {
      return res.status(400).json({ error: 'El campo "fileType" es requerido.' });
    }

    const processedContent = await processTextDocument(content, fileType, title, userId);

    let session = await CanvasSession.findOne({ conversationId });

    if (!session) {
      // Crear nueva sesión
      session = new CanvasSession({
        user: userId,
        companyId,
        conversationId,
        title: title || 'Archivo sin título',
        fileType,
        content: processedContent ?? '',
        version: 1,
        history: [{
          version: 1,
          content: processedContent ?? '',
          title: title || 'Archivo sin título',
          updatedAt: new Date()
        }]
      });
      await session.save();
    } else {
      // Comprobar si el contenido realmente cambió
      const contentChanged = JSON.stringify(session.content) !== JSON.stringify(processedContent);
      const titleChanged = session.title !== title && title !== undefined;

      if (contentChanged || titleChanged) {
        const nextVersion = session.version + 1;
        
        // Agregar al historial limitando a los últimos 20 cambios
        const newHistoryItem = {
          version: nextVersion,
          content: processedContent ?? session.content,
          title: title || session.title,
          updatedAt: new Date()
        };

        const updatedHistory = [...(session.history || []), newHistoryItem].slice(-20);

        session.content = processedContent ?? session.content;
        session.title = title || session.title;
        if (fileType) session.fileType = fileType;
        session.version = nextVersion;
        session.history = updatedHistory;
        
        await session.save();
      }
    }

    // Sincronizar de vuelta a LiveEditor si es un documento de texto
    if (session.fileType === 'text') {
      await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
    }

    res.json({
      success: true,
      version: session.version,
      title: session.title,
      fileType: session.fileType,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    logger.error('[Canvas POST] Error:', error);
    res.status(500).json({ error: 'Error al guardar la sesión de Canvas' });
  }
});

/**
 * DELETE /api/sgsst/canvas/:conversationId
 * Borra el documento canvas de la conversación.
 */
router.delete('/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    await CanvasSession.findOneAndDelete({ conversationId });

    // También eliminamos la sesión de LiveEditor relacionada
    const LiveEditorSession = require('~/models/LiveEditorSession');
    await LiveEditorSession.findOneAndDelete({ conversationId });

    res.json({ success: true });
  } catch (error) {
    logger.error('[Canvas DELETE] Error:', error);
    res.status(500).json({ error: 'Error al vaciar Canvas' });
  }
});

module.exports = router;
