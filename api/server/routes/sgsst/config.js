const express = require('express');
const router = express.Router();
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const SgsstConfig = require('~/models/SgsstConfig');

/**
 * GET /api/sgsst/config
 * Devuelve la configuración global de SGSST (ej. aplicaciones apagadas)
 */
router.get('/', requireJwtAuth, async (req, res) => {
    try {
        let config = await SgsstConfig.findOne({});
        if (!config) {
            config = await SgsstConfig.create({ disabledApps: [] });
        }
        res.json(config);
    } catch (error) {
        logger.error('[SGSST Config] GET error:', error);
        res.status(500).json({ error: 'Error loading SGSST config' });
    }
});

/**
 * PUT /api/sgsst/config/toggle
 * Enciende o apaga una app. Solo permitido para el ADMIN.
 */
router.put('/toggle', requireJwtAuth, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Prohibido: Solo el administrador puede apagar aplicativos.' });
        }

        const { appId, disabled } = req.body;
        if (!appId) {
            return res.status(400).json({ error: 'ID del aplicativo es requerido.' });
        }

        let config = await SgsstConfig.findOne({});
        if (!config) {
            config = await SgsstConfig.create({ disabledApps: [] });
        }

        let currentlyDisabled = [...config.disabledApps];

        if (disabled) {
            // Añadir a desactivados si no existe
            if (!currentlyDisabled.includes(appId)) {
                currentlyDisabled.push(appId);
            }
        } else {
            // Remover de desactivados
            currentlyDisabled = currentlyDisabled.filter(id => id !== appId);
        }

        config.disabledApps = currentlyDisabled;
        await config.save();

        res.json(config);
    } catch (error) {
        logger.error('[SGSST Config] PUT toggle error:', error);
        res.status(500).json({ error: 'Error toggling app status' });
    }
});

module.exports = router;
