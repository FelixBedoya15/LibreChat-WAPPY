'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CanvasSession = require('~/models/CanvasSession');
const CompanyInfo = require('~/models/CompanyInfo');

async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

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

    let session = await CanvasSession.findOne({ conversationId });

    if (!session) {
      // Crear nueva sesión
      session = new CanvasSession({
        user: userId,
        companyId,
        conversationId,
        title: title || 'Archivo sin título',
        fileType,
        content: content ?? '',
        version: 1,
        history: [{
          version: 1,
          content: content ?? '',
          title: title || 'Archivo sin título',
          updatedAt: new Date()
        }]
      });
      await session.save();
    } else {
      // Comprobar si el contenido realmente cambió
      const contentChanged = JSON.stringify(session.content) !== JSON.stringify(content);
      const titleChanged = session.title !== title && title !== undefined;

      if (contentChanged || titleChanged) {
        const nextVersion = session.version + 1;
        
        // Agregar al historial limitando a los últimos 20 cambios
        const newHistoryItem = {
          version: nextVersion,
          content: content ?? session.content,
          title: title || session.title,
          updatedAt: new Date()
        };

        const updatedHistory = [...(session.history || []), newHistoryItem].slice(-20);

        session.content = content ?? session.content;
        session.title = title || session.title;
        if (fileType) session.fileType = fileType;
        session.version = nextVersion;
        session.history = updatedHistory;
        
        await session.save();
      }
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
    res.json({ success: true });
  } catch (error) {
    logger.error('[Canvas DELETE] Error:', error);
    res.status(500).json({ error: 'Error al vaciar Canvas' });
  }
});

module.exports = router;
