const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const CompanyInfo = require('../../../models/CompanyInfo');
const { requireJwtAuth } = require('../../../middleware/requireJwtAuth');
const { getLogStores } = require('../../../cache/getLogStores');
const { getUserKey, checkUserKey } = require('../../../services/UserService');
const { AuthKeys } = require('../../../models/AuthKeys');

const mapSizeToLabel = (size) => {
    switch (size) {
        case 'small': return 'Microempresa (≤10 trabajadores)';
        case 'medium': return 'Pequeña (11-50 trabajadores)';
        case 'large': return 'Mediana/Grande (>50 trabajadores)';
        default: return 'No especificado';
    }
};

const mapRiskToLabel = (risk) => {
    return risk ? `Riesgo ${risk}` : 'No especificado';
};

router.post('/generate', requireJwtAuth, async (req, res) => {
    const logger = getLogStores(req.app.locals.config.cache);

    try {
        const { activity, location, entityType, modelName } = req.body;

        if (!activity) {
            return res.status(400).json({ error: 'La actividad económica es obligatoria.' });
        }

        // 1. Get API Key
        let resolvedApiKey;
        try {
            const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
            try {
                const parsed = JSON.parse(storedKey);
                resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
            } catch (parseErr) {
                resolvedApiKey = storedKey;
            }
        } catch (err) {
            logger.debug('[SGSST Matriz] No user Google key found, trying env vars');
        }

        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }

        if (!resolvedApiKey) {
            return res.status(400).json({
                error: 'No se ha configurado la clave API de Google.',
            });
        }

        // 2. Get Company Info
        let companyInfoBlock = '';
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            if (ci && ci.companyName) {
                companyInfoBlock = `
**Datos de la Empresa:**
- Nombre: ${ci.companyName}
- NIT: ${ci.nit || 'N/A'}
- Ciudad: ${ci.city || 'N/A'}
- Tamaño: ${mapSizeToLabel(ci.companySize)}
- Riesgo Principal: ${mapRiskToLabel(ci.riskLevel)}
`;
            }
        } catch (error) {
            logger.error('[SGSST Matriz] Error fetching company info', error);
        }

        const genAI = new GoogleGenerativeAI(resolvedApiKey);

        // 3. Construct Prompt
        const promptText = `
Eres un abogado experto en Seguridad y Salud en el Trabajo (SG-SST) en Colombia.
Tu tarea es generar una **MATRIZ LEGAL** personalizada y actualizada al año ${new Date().getFullYear()}.

**Contexto de la Organización:**
- Actividad Económica Específica: ${activity}
- Ubicación: ${location || 'Nacional'}
- Tipo de Entidad: ${entityType === 'public' ? 'Pública' : entityType === 'mixed' ? 'Mixta' : 'Privada'}
${companyInfoBlock}

**Instrucciones:**
Genera una tabla HTML profesional y detallada con las normas legales vigentes aplicables a esta actividad específica.
NO inventes normas. Usa normas reales colombianas (Leyes, Decretos, Resoluciones).
Prioriza normas del sector STT y normas específicas de la actividad económica mencionada.

**Formato HTML del Entregable:**
Debes generar SOLO el código HTML de una tabla con los siguientes estilos inline obligatorios:
- <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px;">
- Encabezados (th): background-color: #004d99; color: white; padding: 10px; border: 1px solid #ddd;
- Celdas (td): padding: 8px; border: 1px solid #ddd; vertical-align: top;

Columnas de la tabla:
1. **Norma** (Tipo, Número y Año)
2. **Entidad Emisora**
3. **Título / Descripción**
4. **Artículos Aplicables**
5. **Requisito Específico** (¿Qué debe cumplir la empresa?)
6. **Evidencia de Cumplimiento** (¿Qué documento lo prueba?)

Incluye al menos 8-12 normas relevantes, iniciando por las generales (Ley 1562, Dec 1072, Res 0312) y bajando a las específicas de la actividad "${activity}".
`;

        // 4. Generate Content
        const selectedModel = modelName || 'gemini-3-flash-preview';
        const model = genAI.getGenerativeModel({ model: selectedModel });

        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.text();

        // 5. Clean Output
        let cleanedMatrix = text
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        res.json({ matrix: cleanedMatrix });

    } catch (error) {
        console.error('[SGSST Matriz] Generation error:', error);
        res.status(500).json({ error: `Error generando matriz: ${error.message}` });
    }
});

module.exports = router;
