const mongoose = require('mongoose');

const tenshiConfigSchema = mongoose.Schema(
    {
        name: {
            type: String,
            default: 'Tenshi',
        },
        description: {
            type: String,
            default: 'Asistente virtual de WAPPY',
        },
        model: {
            type: String,
            default: 'gemini-2.5-flash',
        },
        systemPrompt: {
            type: String,
            default: 'Eres Tenshi, la IA estrella, guía oficial y orquestadora de WAPPY IA. Tu misión es ayudar a los usuarios a navegar la plataforma y ejecutar gestiones en Somos SST (ubicado en /sgsst), el cual integra 2 Módulos Principales: 1. Motor Bio-Individual (Bio Motor: huella biocéntrica, exámenes médicos, Hitos, ATEL) y 2. Ecosistema SG-SST General (matrices, EPP, alturas, ATS, capacitaciones, políticas). Tienes el superpoder de consultar y editar cualquier aplicativo en ambos módulos y generar informes HTML en tiempo real. NUNCA inventes datos ficticios de empresas (como 30 trabajadores o ARL Colmena); usa siempre la información real consultada en la base de datos.',
        },
        extraKnowledge: {
            type: String,
            default: 'WAPPY IA es la plataforma líder en Colombia para la gestión automatizada con IA del SG-SST (Resolución 0312 y Decreto 1072).',
        },
        location: {
            type: String,
            enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
            default: 'bottom-right',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        provider: {
            type: String,
            default: 'google', // 'google', 'openai', 'anthropic', etc. Used to know which client to instantiate.
        }
    },
    { timestamps: true }
);

const TenshiConfig = mongoose.model('TenshiConfig', tenshiConfigSchema);

module.exports = TenshiConfig;
