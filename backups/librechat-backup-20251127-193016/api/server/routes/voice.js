const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const logger = require('~/config/winston');
const { createSession, stopSession } = require('./voice/voiceSession');

const router = express.Router();

/**
 * Initialize voice session
 * Creates a new WebSocket session for voice conversation
 */
router.post('/init', requireJwtAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { voice, language } = req.body;

        logger.info(`[VoiceRoute] Initializing session for user: ${userId}`);

        res.json({
            success: true,
            message: 'Voice session ready. Connect via WebSocket.',
            wsEndpoint: '/ws/voice',
            config: {
                voice: voice || 'Sol',
                language: language || 'es-ES',
            },
        });
    } catch (error) {
        logger.error('[VoiceRoute] Error initializing session:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Stop voice session
 */
router.post('/stop', requireJwtAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = stopSession(userId);

        res.json({
            success: result,
            message: result ? 'Session stopped' : 'No active session',
        });
    } catch (error) {
        logger.error('[VoiceRoute] Error stopping session:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Get available voices
 */
router.get('/voices', requireJwtAuth, async (req, res) => {
    try {
        // List of available Gemini voices
        const voices = [
            {
                id: 'sol',
                name: 'Sol',
                description: 'Ingeniosa y relajada',
                language: 'es-ES',
                gender: 'female',
            },
            {
                id: 'spruce',
                name: 'Spruce',
                description: 'Calma y afirmativa',
                language: 'es-ES',
                gender: 'male',
            },
            {
                id: 'ember',
                name: 'Ember',
                description: 'Segura y optimista',
                language: 'es-ES',
                gender: 'female',
            },
            {
                id: 'kore',
                name: 'Kore',
                description: 'Enérgica y amigable',
                language: 'es-ES',
                gender: 'female',
            },
            {
                id: 'orbit',
                name: 'Orbit',
                description: 'Profesional y clara',
                language: 'es-ES',
                gender: 'male',
            },
        ];

        res.json({
            success: true,
            voices,
        });
    } catch (error) {
        logger.error('[VoiceRoute] Error getting voices:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

module.exports = router;
