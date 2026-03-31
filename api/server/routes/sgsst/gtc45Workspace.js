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

    // Primary: find doc linked to this user + conversationId
    let session = await GTC45WorkspaceSession.findOne({ conversationId, user: userId });

    // Fallback: doc may have been created before userId was properly set (legacy sessions)
    // In that case we find by conversationId alone and adopt it.
    if (!session) {
      session = await GTC45WorkspaceSession.findOne({ conversationId });
      if (session && !session.user) {
        // Claim ownership for future requests
        session.user = userId;
        await session.save();
        logger.info(`[GTC45Workspace] Adopted legacy session ${conversationId} for user ${userId}`);
      }
    }

    if (!session) {
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
