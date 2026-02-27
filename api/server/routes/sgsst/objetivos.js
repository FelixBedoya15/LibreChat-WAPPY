const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildCompanyContextString } = require('./reportHeader');

/**
 * POST /api/sgsst/objetivos/generate
 * Generates SGSST Objectives using AI, pulling data from Matriz and ATEL if available.
 */
router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const {
            policySummary, // User provided or empty
            diagnosticSummary, // User provided or empty
            additionalNorms,
            modelName,
        } = req.body;

        // 1. Retrieve the user's Google API key
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
            logger.debug('[SGSST Objetivos] No user Google key found, trying env vars:', err.message);
        }

        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }

        if (resolvedApiKey && typeof resolvedApiKey === 'string') {
            resolvedApiKey = resolvedApiKey.split(',')[0].trim();
        }

        if (!resolvedApiKey) {
            return res.status(400).json({
                error: 'No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del chat.',
            });
        }

        // 2. Load company info
        let companyInfoBlock = '';
        let loadedCompanyInfo = null;
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            loadedCompanyInfo = ci;
            if (ci && ci.companyName) {
                companyInfoBlock = buildCompanyContextString(ci);
            }
        } catch (ciErr) {
            logger.warn('[SGSST Objetivos] Error loading company info:', ciErr.message);
        }

        // 3. Fetch Matriz de Peligros Fallback
        let matrixContext = 'No hay datos de matriz de peligros registrados.';
        try {
            const MatrizPeligrosData = mongoose.models.MatrizPeligrosData || mongoose.model('MatrizPeligrosData', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, procesos: Array }, { strict: false }));
            const matrizData = await MatrizPeligrosData.findOne({ user: req.user.id }).lean();

            if (matrizData && matrizData.procesos && matrizData.procesos.length > 0) {
                const fallbackHazards = [];
                matrizData.procesos.forEach(p => {
                    if (p.peligros && p.peligros.length > 0) {
                        p.peligros.forEach(h => {
                            if (h.nivelRiesgo && (h.nivelRiesgo === 'I' || h.nivelRiesgo === 'II' || h.nivelRiesgo === 'III' || h.nivelRiesgo === 'IV')) {
                                fallbackHazards.push(`- Proceso: ${p.proceso}: ${h.descripcionPeligro || h.clasificacion} (Niv. Riesgo: ${h.nivelRiesgo})`);
                            }
                        });
                    }
                });
                if (fallbackHazards.length > 0) {
                    matrixContext = `Peligros Prioritarios (Matriz GTC 45):\n${fallbackHazards.slice(0, 15).join('\n')}`;
                }
            }
        } catch (err) {
            logger.warn('[SGSST Objetivos] Error fetching Matriz data:', err.message);
        }

        // 4. Fetch ATEL Statistics Fallback
        let atelContext = 'No hay datos de accidentabilidad (ATEL) registrados para el año en curso.';
        try {
            const currentYear = new Date().getFullYear();
            const ATELAnnualData = mongoose.models.ATELAnnualData || mongoose.model('ATELAnnualData', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, year: Number, months: Map }, { strict: false }));
            const atelData = await ATELAnnualData.findOne({ user: req.user.id, year: currentYear }).lean();

            if (atelData && atelData.months) {
                let totalAT = 0;
                let totalEL = 0;
                let ausentismoDias = 0;
                Object.values(atelData.months).forEach(m => {
                    if (m.events) {
                        totalAT += m.events.filter(e => e.tipo === 'AT').length;
                        totalEL += m.events.filter(e => e.tipo === 'EL').length;
                        ausentismoDias += m.events.filter(e => e.tipo === 'Ausentismo').reduce((sum, e) => sum + (Number(e.diasIncapacidad) || 0), 0);
                    }
                });
                if (totalAT > 0 || totalEL > 0 || ausentismoDias > 0) {
                    atelContext = `Estadísticas ATEL registradas en el año ${currentYear}:\n- Accidentes de Trabajo (AT): ${totalAT}\n- Enfermedades Laborales (EL): ${totalEL}\n- Días de Ausentismo: ${ausentismoDias}`;
                }
            }
        } catch (err) {
            logger.warn('[SGSST Objetivos] Error fetching ATEL data:', err.message);
        }

        // 5. Initialize Gemini
        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3-flash-preview' });

        const currentDate = new Date().toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric',
        });

        const headerHTML = buildStandardHeader({
            title: 'OBJETIVOS DEL SISTEMA DE GESTIÓN (SG-SST)',
            companyInfo: loadedCompanyInfo,
            date: currentDate,
            norm: 'Decreto 1072 de 2015 / Resolución 0312 de 2019',
            responsibleName: req.user?.name,
        });

        const promptText = `Eres un experto consultor en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.

**Fecha de Emisión:** ${currentDate}

## CONTEXTO DE LA EMPRESA
${companyInfoBlock}

## FUENTES DE INFORMACIÓN INTEGRADAS
**1. Matriz de Peligros GTC 45 (Riesgos Prioritarios Identificados):**
${matrixContext}

**2. Estadísticas ATEL (Accidentalidad y Ausentismo Reciente):**
${atelContext}

**3. Directrices de la Política SST (Si el usuario las propuso):**
${policySummary || 'El usuario no proporcionó fragmentos de la política. Infiere la alineación estándar con el Decreto 1072.'}

**4. Resultados del Diagnóstico Inicial (Si el usuario los propuso):**
${diagnosticSummary || 'El usuario no proporcionó el diagnóstico. Concéntrate en la mejora continua por defecto.'}

**Marco Normativo Adicional:**
${additionalNorms || 'Decreto 1072 de 2015, Resolución 0312 de 2019'}

## INSTRUCCIONES DE GENERACIÓN

Genera el documento formal de OBJETIVOS DEL SISTEMA DE GESTIÓN (SG-SST) en formato HTML.

1. **ENCABEZADO**: DEBES usar EXACTAMENTE el siguiente código HTML para el encabezado (INCLÚYELO TAL CUAL al inicio del informe):
${headerHTML}

2. **INTRODUCCIÓN**: Breve declaración indicando que los objetivos están alineados con la Política de SST, la matriz de peligros, y las estadísticas de accidentalidad.

3. **OBJETIVOS GENERALES Y ESPECÍFICOS (Requisitos del Decreto 1072)**:
   Los objetivos deben ser medibles, claros, tener metas, ser alcanzables, y estar directamente relacionados con el control de los peligros prioritarios (Matriz de Peligros) y la reducción de accidentalidad (Estadísticas ATEL) mostrados arriba. 
   - Objetivo General.
   - Objetivos Específicos (Mínimo 4 o 5) que abarquen:
     - Identificar los peligros, evaluar y valorar los riesgos y establecer los respectivos controles.
     - Proteger la seguridad y salud de todos los trabajadores mediante la mejora continua del SG-SST.
     - Cumplir la normatividad nacional vigente aplicable.
     - Reducir incidentes/accidentes basándose en el reporte ATEL actual.

4. **METAS E INDICADORES (TABLA INTERACTIVA)**:
   Genera una tabla HTML atractiva y limpia que asocie cada Objetivo Específico con su respectiva Meta (ej. 100%, >80%, <5%) y su Indicador de medición.

5. **COMUNICACIÓN Y REVISIÓN**:
   Un párrafo indicando la obligación de comunicar los objetivos a todos los trabajadores y revisarlos mínimo una vez al año, tal como exige la norma.

6. **FIRMA**:
   Espacio para firma del Representante Legal.

IMPORTANTE: Genera SOLO fragmentos HTML del cuerpo (body). NO incluyas <!DOCTYPE>, <html>, <head>, <body>, <style>, ni etiquetas de documento completo.
Usa etiquetas HTML semánticas (<h1>, <h2>, <p>, <table>, etc).
Para estilos, usa atributos style inline. PRECAUCIÓN MODO OSCURO: Cuando uses \`background-color\`, OBLIGATORIAMENTE declara \`color: #000;\` (fondo claro) o \`color: #fff;\` (fondo oscuro). NO uses clases de Tailwind.
El diseño debe ser elegante con acentos en azul oscuro (#004d99). Tablas deben tener \`width="100%"\`, \`overflow: hidden\`, y colores de cabecera sólidos.
Las tablas DEBEN estar envueltas dentro de un \`<div style="overflow-x: auto; width: 100%; margin-bottom: 20px;">\` y la etiqueta de la tabla debe tener \`min-width: 650px;\` para que desplace lateralmente en celulares.`;

        // 6. Generate the content
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const objectivesHtml = response.text();

        // 7. Clean up
        let cleanedHtml = objectivesHtml
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const bodyMatch = cleanedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) cleanedHtml = bodyMatch[1].trim();

        cleanedHtml = cleanedHtml
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
            .replace(/<head>[\s\S]*?<\/head>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .trim();

        res.json({ objectives: cleanedHtml });

    } catch (error) {
        logger.error('[SGSST Objetivos] Generation error:', error);
        res.status(500).json({ error: 'Error al generar los Objetivos SST' });
    }
});

module.exports = router;
