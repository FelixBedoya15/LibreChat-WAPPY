'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const LiveEditorSession = require('~/models/LiveEditorSession');
const CompanyInfo = require('~/models/CompanyInfo');

async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

/**
 * GET /api/live-editor/:conversationId
 * Obtiene el documento activo de una conversación.
 */
router.get('/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    let session = await LiveEditorSession.findOne({ conversationId, user: userId, companyId: companyId });

    // Fallback: buscar sin userId (sesiones heredadas)
    if (!session) {
      session = await LiveEditorSession.findOne({ conversationId });
      if (session && !session.user) {
        session.user = userId;
        await session.save();
      }
    }

    if (!session) {
      return res.json({ content: '', fileName: 'Documento sin título', contentUpdatedAt: null });
    }

    res.json({
      content: session.content,
      fileName: session.fileName,
      contentUpdatedAt: session.contentUpdatedAt,
    });
  } catch (error) {
    logger.error('[LiveEditor GET] Error:', error);
    res.status(500).json({ error: 'Error al obtener el documento' });
  }
});

/**
 * PUT /api/live-editor/:conversationId
 * Actualiza el contenido del documento.
 * Llamado tanto por el panel React (edición manual) como por la tool EditorLive (agente).
 */
router.put('/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, fileName } = req.body;
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    const update = {
      $set: {
        content: content ?? '',
        contentUpdatedAt: new Date(),
        companyId,
        ...(fileName ? { fileName } : {}),
      },
      $setOnInsert: { user: userId },
    };

    const session = await LiveEditorSession.findOneAndUpdate(
      { conversationId, companyId: companyId },
      update,
      { upsert: true, new: true },
    );

    res.json({ success: true, contentUpdatedAt: session.contentUpdatedAt, fileName: session.fileName });
  } catch (error) {
    logger.error('[LiveEditor PUT] Error:', error);
    res.status(500).json({ error: 'Error al actualizar el documento' });
  }
});

/**
 * DELETE /api/live-editor/:conversationId
 * Borra el documento de la conversación (reinicio del editor).
 */
router.delete('/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const companyId = await getActiveCompanyId(req.user.id);
    await LiveEditorSession.findOneAndDelete({ conversationId, user: req.user.id, companyId: companyId });
    res.json({ success: true });
  } catch (error) {
    logger.error('[LiveEditor DELETE] Error:', error);
    res.status(500).json({ error: 'Error al eliminar el documento' });
  }
});

module.exports = router;
