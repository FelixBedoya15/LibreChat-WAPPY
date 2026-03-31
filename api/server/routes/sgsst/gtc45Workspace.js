'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');

// GET matrix for a conversation
router.get('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // === DIAGNOSTIC LOGGING ===
    logger.info(`[GTC45Workspace GET] conversationId=${conversationId} | userId=${userId}`);

    // Primary: find doc linked to this user + conversationId
    let session = await GTC45WorkspaceSession.findOne({ conversationId, user: userId });
    logger.info(`[GTC45Workspace GET] primary lookup result: ${session ? `found (rows=${session.matrixRows?.length})` : 'NOT FOUND'}`);

    // Fallback: doc may have been created without userId set
    if (!session) {
      session = await GTC45WorkspaceSession.findOne({ conversationId });
      logger.info(`[GTC45Workspace GET] fallback lookup result: ${session ? `found (user=${session.user}, rows=${session.matrixRows?.length})` : 'NOT FOUND'}`);
      if (session && !session.user) {
        session.user = userId;
        await session.save();
        logger.info(`[GTC45Workspace GET] Adopted legacy session ${conversationId} for user ${userId}`);
      }
    }

    if (!session) {
      // Log ALL sessions in DB to help diagnose mismatch
      const allSessions = await GTC45WorkspaceSession.find({}, { conversationId: 1, user: 1, _id: 0 }).limit(20);
      logger.info(`[GTC45Workspace GET] No session found. All sessions in DB: ${JSON.stringify(allSessions)}`);
      return res.json({ matrixRows: [] });
    }

    res.json({ matrixRows: session.matrixRows });
  } catch (error) {
    logger.error('[GTC45Workspace] Error fetching matrix:', error);
    res.status(500).json({ error: 'Failed to fetch matrix' });
  }
});


// UPDATE matrix for a conversation
router.put('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { matrixRows } = req.body;
    const userId = req.user.id;

    let session = await GTC45WorkspaceSession.findOneAndUpdate(
      { conversationId },
      {
        $set: { matrixRows: matrixRows || [] },
        $setOnInsert: { user: userId },
      },
      { upsert: true, new: true },
    );

    res.json({ success: true, matrixRows: session.matrixRows });
  } catch (error) {
    logger.error('[GTC45Workspace] Error updating matrix:', error);
    res.status(500).json({ error: 'Failed to update matrix' });
  }
});

module.exports = router;
