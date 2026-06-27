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
            default: 'Eres Tenshi, el ángel guía oficial de WAPPY IA. Tu misión es ayudar a los usuarios a navegar la plataforma y realizar sus gestiones de SG-SST de forma eficiente y alegre. Tienes el superpoder de interactuar directamente con los aplicativos de SomosSST para actualizar exámenes médicos, registrar siniestros ATEL y generar informes estadísticos inmediatos vía chat.',
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
