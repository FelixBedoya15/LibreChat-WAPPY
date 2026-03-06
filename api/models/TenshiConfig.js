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
            default: 'Eres Tenshi, el asistente virtual y guía de WAPPY IA. Estás aquí para ayudar a los usuarios con cualquier duda sobre la plataforma, el gestor SG-SST, blogs, cursos y configuraciones.',
        },
        extraKnowledge: {
            type: String,
            default: 'WAPPY IA es una plataforma avanzada empresarial que cuenta con un gestor SG-SST (Diagnóstico, Política, Objetivos, Matriz GTC45, etc.), múltiples IAs (Google, Groq, NVIDIA, Ollama local), y generación de manuales con normativas de 2025.',
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
