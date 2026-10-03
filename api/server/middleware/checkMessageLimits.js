const { Message, Key } = require('~/db/models');
const { logger } = require('@librechat/data-schemas');

/**
 * Middleware to check daily message limit for free users (role: 'USER')
 * and enforce AI gating for sub-users (allowing them if they have AI permissions
 * or if they configured their own API keys).
 */
const checkMessageLimits = async (req, res, next) => {
  if (res.headersSent) {
    return next();
  }
  try {
    if (!req.user) {
      return next();
    }

    // Check Sub-User AI Gating
    if (req.user.isSubUser) {
      const perms = req.user.subUserPermissions || [];
      const hasAiPerm = perms.includes('chat:wappy_general') || 
                        perms.includes('chat:sst_specialist') || 
                        perms.includes('ai:live_analysis');

      // Check if sub-user has registered their own API key
      const hasOwnKey = await Key.exists({ userId: req.user.id });

      if (!hasAiPerm && !hasOwnKey) {
        const payload = {
          error: true,
          type: 'subuser_ai_restricted',
          message: 'Tu perfil de sub-usuario está configurado para carga de datos operativos en Somos SST y no tiene acceso a las IA de la empresa. Puedes configurar tus propias claves API en Configuración > Cuenta para utilizar la IA de forma autónoma con tus credenciales.'
        };
        return res.status(403).json({
          ...payload,
          text: JSON.stringify(payload)
        });
      }

      // If authorized by parent or using own API key, bypass Free user limits
      return next();
    }

    // Si el usuario pertenece a un plan retirado (USER, USER_GO, USER_PLUS), bloquear y redirigir
    if (['USER', 'USER_GO', 'USER_PLUS'].includes(req.user.role)) {
      const payload = {
        error: true,
        type: 'plan_required',
        message: 'Tu cuenta no tiene un plan activo. Para chatear con la IA y acceder a los agentes de WAPPY, por favor adquiere el plan Wappy Pro.',
        redirect: '/planes'
      };
      return res.status(403).json({
        ...payload,
        text: JSON.stringify(payload)
      });
    }

    next();
  } catch (error) {
    logger.error('Error en checkMessageLimits middleware:', error);
    if (res.headersSent) {
      return;
    }
    next(error);
  }
};

module.exports = checkMessageLimits;
