'use strict';

const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const { Agent } = require('~/db/models');
const { logger } = require('~/config');

/**
 * GET /api/sgsst/sync-agents/export-agents
 * 
 * Secure endpoint to export all active agents from the MongoDB collection.
 * Restrained to ADMIN roles. Returns a clean, indented JSON file as an attachment download.
 */
router.get('/export-agents', requireJwtAuth, async (req, res) => {
  try {
    // Access validation: Only ADMIN users are authorized
    if (req.user?.role !== 'ADMIN') {
      logger.warn(`[ExportAgents] Unauthorized export attempt by user: ${req.user?.id} with role: ${req.user?.role}`);
      return res.status(403).json({ error: 'Solo los administradores están autorizados para exportar agentes.' });
    }

    logger.info(`[ExportAgents] Starting database export of all agents requested by ADMIN: ${req.user?.id}`);
    const agents = await Agent.find({}).lean();

    // Configure client browser attachment headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=wappy_agents_backup.json');

    return res.send(JSON.stringify(agents, null, 2));
  } catch (err) {
    logger.error('[ExportAgents] Critical export failure:', err);
    return res.status(500).json({ error: 'Falla interna al exportar agentes: ' + err.message });
  }
});

module.exports = router;
