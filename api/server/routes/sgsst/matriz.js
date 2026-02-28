const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildCompanyContextString } = require('./reportHeader');

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

        if (resolvedApiKey && typeof resolvedApiKey === 'string') {
            resolvedApiKey = resolvedApiKey.split(',')[0].trim();
        }

        if (!resolvedApiKey) {
            return res.status(400).json({
                error: 'No se ha configurado la clave API de Google.',
            });
        }

        // 2. Get Company Info
        let companyInfoBlock = '';
        let loadedCompanyInfo = null;
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            loadedCompanyInfo = ci;
            if (ci && ci.companyName) {
                companyInfoBlock = buildCompanyContextString(ci);
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

**Instrucciones ESTRICTAS:**
1. DEBES generar una tabla exhaustiva que contenga **CADA UNO de los criterios de la Resolución 0312 de 2019** (todos los estándares mínimos según aplique al tamaño de la empresa, pero lístalos todos) y **CADA UNO de los artículos del Decreto 1072 de 2015, Libro 2, Parte 2, Título 4, Capítulo 6** (SG-SST).
2. NO incluyas solo 8 o 12 normas aleatorias. El objetivo es crear la plantilla de auditoría legal COMPLETA basada en estas dos normas por el momento.
3. Al inicio del documento, justo después del encabezado y antes de la tabla, debes presentar un **Indicador General de Cumplimiento de la Matriz**. Usa un recuadro HTML destacado indicando "Cumplimiento Legal Inicial: 0% (Pendiente de Evaluación por la Empresa)".

**Formato HTML del Entregable:**
Primero, incluye EXACTAMENTE el siguiente encabezado HTML al inicio del informe:
${buildStandardHeader({
            title: 'MATRIZ DE REQUISITOS LEGALES SST (0312 & 1072)',
            companyInfo: loadedCompanyInfo,
            date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
            norm: 'Decreto 1072 de 2015 / Res. 0312 de 2019',
        })}

Después del encabezado y del Indicador de Cumplimiento, genera la tabla con los siguientes estilos inline obligatorios (PRECAUCIÓN MODO OSCURO):
- NO uses filas intercaladas claras/oscuras (striped) sin forzar el color de texto.
- <table style="width: 100%; table-layout: fixed; word-wrap: break-word; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; font-family: sans-serif; font-size: 14px;">
- Encabezados (th): background-color: #004d99; color: white; padding: 10px; border: 1px solid #ddd;
- Celdas (td): padding: 8px; border: 1px solid #ddd; vertical-align: top; (SIN background-color para heredar el modo oscuro del sistema).

Columnas OBLIGATORIAS de la tabla (en este orden exacto):
1. **Norma** (Ej: Res 0312 o Dec 1072)
2. **Artículo / Criterio** (Numeral exacto)
3. **Requisito Específico** (Descripción legal)
4. **Evidencia de Cumplimiento** (Qué documento lo prueba)
5. **Cumple (X)** (Dejar la celda en blanco para que el usuario la llene)
6. **No Cumple (X)** (Dejar la celda en blanco)
7. **Seguimiento / Observaciones** (Espacio para planes de acción planificados)

Es de vital importancia que la lista sea LARGA y EXHAUSTIVA. Extiéndete todo lo que el token limit permita listando los criterios. No resumas.
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
