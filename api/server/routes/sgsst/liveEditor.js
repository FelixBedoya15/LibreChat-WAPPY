'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const LiveEditorSession = require('~/models/LiveEditorSession');
const CompanyInfo = require('~/models/CompanyInfo');
const { syncLiveEditorToCanvas } = require('./syncBridge');


async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

/**
 * GET /api/live-editor/history
 * Returns conversations tagged with the given tag(s) for agent tool history.
 * Does NOT filter by company — agent tools are chat-scoped, not company-scoped.
 * Query params:
 *   tags (string | string[]) — e.g. live-doc-{conversationId}, sgsst-live-editor
 */
router.get('/history', requireJwtAuth, async (req, res) => {
  try {
    const { Conversation } = require('~/db/models');
    if (!Conversation) {
      return res.status(500).json({ error: 'Conversation model not available' });
    }

    const rawTags = req.query.tags;
    const filterTags = rawTags
      ? (Array.isArray(rawTags) ? rawTags : [rawTags]).filter(Boolean)
      : [];

    if (filterTags.length === 0) {
      return res.status(400).json({ error: 'At least one tag is required' });
    }

    const conversations = await Conversation.find({
      user: req.user.id,
      tags: { $all: filterTags },
      $or: [{ isArchived: false }, { isArchived: { $exists: false } }],
      $and: [{ $or: [{ expiredAt: null }, { expiredAt: { $exists: false } }] }],
    })
      .select('conversationId title updatedAt tags')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    return res.json({ conversations: conversations || [], count: conversations?.length || 0 });
  } catch (error) {
    logger.error('[LiveEditor History] Error:', error);
    return res.status(500).json({ error: 'Error fetching agent tool history' });
  }
});


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

    // Sincronizar hacia el Canvas
    await syncLiveEditorToCanvas(conversationId, session.content, session.fileName, userId);

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

    // También eliminamos la sesión de Canvas de tipo 'text' si corresponde
    const CanvasSession = require('~/models/CanvasSession');
    await CanvasSession.findOneAndDelete({ conversationId, fileType: 'text' });

    res.json({ success: true });
  } catch (error) {
    logger.error('[LiveEditor DELETE] Error:', error);
    res.status(500).json({ error: 'Error al eliminar el documento' });
  }
});

module.exports = router;
