const { Conversation } = require('~/db/models');
const { logger } = require('@librechat/data-schemas');

const checkConvoLimits = async (req, res, next) => {
    if (res.headersSent) {
        return next();
    }
    try {
        if (!req.user || !['USER', 'USER_GO', 'USER_PLUS', 'USER_IPEVAR'].includes(req.user.role)) {
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

        // Si el usuario pertenece a un plan retirado (USER, USER_GO, USER_PLUS), requerir plan activo
        if (['USER', 'USER_GO', 'USER_PLUS'].includes(req.user.role)) {
            const payload = {
                error: true,
                type: 'plan_required',
                message: 'Tu cuenta no tiene un plan activo. Para crear nuevas conversaciones y usar la IA, por favor adquiere el plan Wappy Pro.',
                redirect: '/planes'
            };
            return res.status(403).json({
                ...payload,
                text: JSON.stringify(payload)
            });
        }

        const count = await Conversation.countDocuments({ user: req.user.id });

        const limit = 20;
        const planName = 'Wappy Vital';

        if (count >= limit) {
            // Bloqueamos la creación si ya tiene el límite o más
            const payload = {
                error: true,
                type: 'convo_limit',
                message: `Has alcanzado el límite de ${limit} conversaciones abiertas del plan ${planName}. Para seguir chateando, elimina historiales antiguos o evoluciona a Wappy Pro.`
            };
            return res.status(403).json({
                ...payload,
                text: JSON.stringify(payload)
            });
        }

        next();
    } catch (error) {
        logger.error('Error en checkConvoLimits middleware:', error);
        if (res.headersSent) {
            return;
        }
        next(error);
    }
};

module.exports = checkConvoLimits;
