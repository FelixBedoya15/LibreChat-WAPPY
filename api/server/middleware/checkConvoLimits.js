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
            return res.status(403).json({
                error: true,
                message: 'Límite alcanzado: Tu plan Gratis solo te permite almacenar hasta 10 conversaciones en el historial. Por favor actualiza a un Plan Superior en la sección Planes o elimina chats antiguos para poder chatear.'
            });
        }

        next();
    } catch (error) {
        logger.error('Error en checkConvoLimits middleware:', error);
        next(error);
    }
};

module.exports = checkConvoLimits;
