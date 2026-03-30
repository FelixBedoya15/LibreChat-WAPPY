'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
// GET matrix for a conversation
router.get('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const session = await GTC45WorkspaceSession.findOne({
      conversationId: req.params.conversationId,
      user: req.user.id,
    });
    
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
    
    let session = await GTC45WorkspaceSession.findOne({
      conversationId,
      user: req.user.id,
    });
    
    if (!session) {
      session = new GTC45WorkspaceSession({
        user: req.user.id,
        conversationId,
        matrixRows: matrixRows || [],
      });
    } else {
      session.matrixRows = matrixRows || [];
    }
    
    await session.save();
    res.json({ success: true, matrixRows: session.matrixRows });
  } catch (error) {
    logger.error('[GTC45Workspace] Error updating matrix:', error);
    res.status(500).json({ error: 'Failed to update matrix' });
  }
});

module.exports = router;
