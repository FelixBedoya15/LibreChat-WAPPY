const { Conversation } = require('~/db/models');
const { logger } = require('@librechat/data-schemas');

const checkConvoLimits = async (req, res, next) => {
    try {
        if (!req.user || !['USER', 'USER_GO', 'USER_IPEVAR'].includes(req.user.role)) {
            return next();
        }

        if (req.method !== 'POST') {
            return next();
        }

        const { conversationId } = req.body;
        const isNew = !conversationId || conversationId === 'new';

        // Solo bloqueamos si el usuario intenta crear una nueva conversación
        if (!isNew) {
            return next();
        }

        const count = await Conversation.countDocuments({ user: req.user.id });

        let limit = 10;
        let planName = 'Gratis';

        if (req.user.role === 'USER') {
            limit = 4;
            planName = 'Gratis';
        } else if (req.user.role === 'USER_IPEVAR') {
            limit = 20;
            planName = 'Wappy Vital';
        } else {
            limit = 30;
            planName = 'Go';
        }

        if (count >= limit) {
            // Bloqueamos la creación si ya tiene el límite o más
            const payload = {
                error: true,
                type: 'convo_limit',
                message: `Has alcanzado el límite de ${limit} conversaciones abiertas del plan ${planName}. Para seguir chateando, elimina historiales antiguos o evoluciona a un plan superior.`
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
