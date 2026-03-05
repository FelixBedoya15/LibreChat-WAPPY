const { Conversation } = require('~/db/models');
const { logger } = require('@librechat/data-schemas');

const checkConvoLimits = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'USER') {
            return next();
        }

        if (req.method !== 'POST') {
            return next();
        }

        const count = await Conversation.countDocuments({ user: req.user.id });
        if (count >= 10) {
            // Si conversationId == 'new', se está creando. En LibreChat a veces es 'new'
            const { conversationId } = req.body;
            const isNew = !conversationId || conversationId === 'new';

            // Bloqueamos cualquier interacción si tiene 10 o más (crear o continuar)
            const payload = {
                error: true,
                type: 'convo_limit',
                message: 'Has alcanzado el límite de 10 conversaciones simultáneas del plan Gratis. Para seguir chateando, elimina historiales antiguos o evoluciona a un plan Premium.'
            };
            return res.status(403).json({
                ...payload,
                text: JSON.stringify(payload)
            });
        }

        next();
    } catch (error) {
        logger.error('Error en checkConvoLimits middleware:', error);
        next(error);
    }
};

module.exports = checkConvoLimits;
