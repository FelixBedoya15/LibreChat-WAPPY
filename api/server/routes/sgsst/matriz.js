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
        const { activity, location, entityType, modelName, statuses = [], seguimientos = {}, compliancePercentage = 0 } = req.body;

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

        // Translate the statuses array back into full items
        const processedItems = statuses.map(s => {
            return {
                ...s,
                statusLabel: s.status === 'cumple' ? 'CUMPLE' : s.status === 'no_cumple' ? 'NO CUMPLE' : s.status === 'no_aplica' ? 'NO APLICA' : 'PENDIENTE',
                observacion: seguimientos[s.itemId] || ''
            };
        });

        const itemsLogText = processedItems.map(item =>
            `- Norma: ${item.norma} | Artículo: ${item.articulo}
  Req: ${item.descripcion}
  Evidencia: ${item.evidencia}
  ESTADO MARCADO: ${item.statusLabel}
  OBSERVACIÓN: ${item.observacion}`
        ).join('\n\n');

        // 3. Construct Prompt
        const promptText = `
Eres un abogado experto en Seguridad y Salud en el Trabajo (SG-SST) en Colombia.
Tu tarea es generar el informe final de la **MATRIZ LEGAL** de la empresa, estructurado en base a la evaluación cualitativa que acaba de realizar el usuario.

**Contexto de la Organización:**
- Actividad Económica Específica: ${activity}
- Ubicación: ${location || 'Nacional'}
- Tipo de Entidad: ${entityType === 'public' ? 'Pública' : entityType === 'mixed' ? 'Mixta' : 'Privada'}
${companyInfoBlock}

A continuación, te presento el resultado EXACTO de la evaluación de la matriz legal ítem por ítem:

${itemsLogText}

**Instrucciones ESTRICTAS:**
1. DEBES generar una tabla exhaustiva que contenga TODOS y CADA UNO de los ítems evaluados en el texto anterior, manteniendo al pie de la letra la calificación (CUMPLE, NO CUMPLE, NO APLICA) y las observaciones exactas aportadas por el usuario.
2. No inventes criterios adicionales. Tu trabajo principal es ponerle formato hiper profesional, redactar un resumen ejecutivo inicial basado en los fallos y aciertos, y estructurar la tabla final obligatoria.
3. Al inicio del documento, justo después del encabezado y antes de la tabla, debes presentar un **Indicador General de Cumplimiento de la Matriz**. Usa un recuadro HTML destacado indicando "Cumplimiento Legal: ${compliancePercentage || 0}%". 
   - Acompaña este indicador de un párrafo redactado por ti (resumen ejecutivo legal) que le informe a la gerencia sobre los hallazgos críticos de la matriz según lo listado arriba.

**Formato HTML del Entregable:**
Primero, incluye EXACTAMENTE el siguiente encabezado HTML al inicio del informe:
${buildStandardHeader({
            title: 'MATRIZ DE REQUISITOS LEGALES SG-SST Evaluada',
            companyInfo: loadedCompanyInfo,
            date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
            norm: 'Decreto 1072 de 2015 / Res. 0312 de 2019',
        })}

Después del encabezado, el resumen ejecutivo y el Indicador de Cumplimiento (${compliancePercentage || 0}%), genera la tabla legal estricta con los siguientes estilos inline obligatorios (PRECAUCIÓN MODO OSCURO):
- NO uses filas intercaladas claras/oscuras (striped) sin forzar el color de texto.
- <table style="width: 100%; table-layout: fixed; word-wrap: break-word; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; font-family: sans-serif; font-size: 14px;">
- Encabezados (th): background-color: #004d99; color: white; padding: 10px; border: 1px solid #ddd;
- Celdas (td): padding: 8px; border: 1px solid #ddd; vertical-align: top; (SIN background-color para heredar el modo oscuro del sistema).

Columnas OBLIGATORIAS de la tabla (en este orden exacto):
1. **Norma** (Ej: Res 0312 o Dec 1072)
2. **Artículo / Criterio** (Numeral exacto)
3. **Requisito Específico** (Descripción legal)
4. **Evidencia de Cumplimiento** (Qué documento lo prueba)
5. **Estado** (CUMPLE / NO CUMPLE / NO APLICA en negrita y color verde/rojo/gris)
6. **Seguimiento / Observaciones** (El texto exacto de la observación del usuario, más tus sugerencias legales de cierre si es NO CUMPLE)

¡El documento debe renderizarse como HTML válido completo listo para enmarcar!
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
