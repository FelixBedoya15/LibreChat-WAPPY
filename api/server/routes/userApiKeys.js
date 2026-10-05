const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const UserApiKey = require('~/models/UserApiKey');
const { requireJwtAuth } = require('~/server/middleware');
const { logger } = require('~/config');

/**
 * GET /api/user-api-keys
 * Lists all active API keys for the current user.
 */
router.get('/', requireJwtAuth, async (req, res) => {
  try {
    const targetUserId = req.user.id;
    const keys = await UserApiKey.find({ user: targetUserId, isActive: true })
      .select('_id name keyPrefix scopes createdAt lastUsedAt isActive')
      .sort({ createdAt: -1 })
      .lean();

    const formattedKeys = keys.map((k) => ({
      id: k._id.toString(),
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      isActive: k.isActive,
    }));

    return res.json(formattedKeys);
  } catch (error) {
    logger.error('[UserApiKeys] Error fetching user API keys:', error);
    return res.status(500).json({ error: 'Error al consultar las claves API.' });
  }
});

/**
 * POST /api/user-api-keys
 * Generates a new cryptographically secure API key for Antigravity / MCP.
 */
router.post('/', requireJwtAuth, async (req, res) => {
  try {
    const targetUserId = req.user.id;
    const name = req.body?.name?.trim() || 'Antigravity MCP Key';

    // Generar clave segura única wpy_live_<48 caracteres hex>
    const randomHex = crypto.randomBytes(24).toString('hex');
    const rawApiKey = `wpy_live_${randomHex}`;
    const keyPrefix = `wpy_live_${randomHex.slice(0, 6)}...`;
    const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    const newKey = await UserApiKey.create({
      user: targetUserId,
      name,
      keyPrefix,
      keyHash,
      scopes: ['mcp:read', 'mcp:write', 'sgsst', 'profile'],
      isActive: true,
    });

    return res.status(201).json({
      apiKey: rawApiKey,
      key: {
        id: newKey._id.toString(),
        name: newKey.name,
        keyPrefix: newKey.keyPrefix,
        scopes: newKey.scopes,
        createdAt: newKey.createdAt,
      },
    });
  } catch (error) {
    logger.error('[UserApiKeys] Error creating API key:', error);
    return res.status(500).json({ error: 'Error al generar la clave API.' });
  }
});

/**
 * DELETE /api/user-api-keys/:id
 * Revokes an existing API key for the user.
 */
router.delete('/:id', requireJwtAuth, async (req, res) => {
  try {
    const targetUserId = req.user.id;
    const { id } = req.params;

    const key = await UserApiKey.findOne({ _id: id, user: targetUserId });
    if (!key) {
      return res.status(404).json({ error: 'Clave API no encontrada.' });
    }

    // Soft delete / deactivation
    key.isActive = false;
    await key.save();

    return res.status(200).json({ message: 'Clave API revocada exitosamente.' });
  } catch (error) {
    logger.error('[UserApiKeys] Error deleting API key:', error);
    return res.status(500).json({ error: 'Error al revocar la clave API.' });
  }
});

module.exports = router;
