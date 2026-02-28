const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');
const { Conversation, Message } = require('~/db/models');
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
                                fallbackHazards.push(`- Proceso ${p.proceso}: ${h.descripcionPeligro || h.clasificacion}. Efectos posibles: ${h.efectosPosibles || 'N/A'}`);
                            }
                        });
                    }
                });
                if (fallbackHazards.length > 0) {
                    matrixContext = `Peligros Prioritarios y Efectos (Matriz GTC 45):\n${fallbackHazards.slice(0, 20).join('\n')}`;
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
                let eventDetails = [];
                Object.values(atelData.months).forEach(m => {
                    if (m.events) {
                        totalAT += m.events.filter(e => e.tipo === 'AT').length;
                        totalEL += m.events.filter(e => e.tipo === 'EL').length;
                        ausentismoDias += m.events.filter(e => e.tipo === 'Ausentismo').reduce((sum, e) => sum + (Number(e.diasIncapacidad) || 0), 0);
                        m.events.forEach(e => {
                            if (e.tipo === 'AT' || e.tipo === 'EL') {
                                eventDetails.push(`- Tipo: ${e.tipo}. Peligro: ${e.peligro || 'N/A'}. Causa Inst: ${e.causaInmediata || 'N/A'}. Consecuencia: ${e.consecuencia || 'N/A'}`);
                            }
                        });
                    }
                });
                if (totalAT > 0 || totalEL > 0 || ausentismoDias > 0) {
                    atelContext = `Estadísticas ATEL registradas en el año ${currentYear}:
- Accidentes de Trabajo (AT): ${totalAT}
- Enfermedades Laborales (EL): ${totalEL}
- Días de Ausentismo: ${ausentismoDias}
Detalle exacto de incidentes ocurridos:
${eventDetails.length > 0 ? eventDetails.join('\n') : 'No hay detalle disponible.'}`;
                }
            }
        } catch (err) {
            logger.warn('[SGSST Objetivos] Error fetching ATEL data:', err.message);
        }

        // 4.5 Fetch Auditoria Fallback
        let auditoriaContext = 'No hay datos de auditoría recientes registrados.';
        try {
            const auditConvo = await Conversation.findOne({ user: req.user.id, tags: 'sgsst-auditoria' }).sort({ createdAt: -1 }).lean();
            if (auditConvo) {
                const auditMessage = await Message.findOne({ conversationId: auditConvo.conversationId, isCreatedByUser: false }).sort({ createdAt: -1 }).lean();
                if (auditMessage && auditMessage.text) {
                    // Try to extract the JSON state if it exists
                    const stateMatch = auditMessage.text.match(/<!-- SGSST_AUDIT_DATA_V1:(.*?) -->/);
                    if (stateMatch && stateMatch[1]) {
                        try {
                            const stateData = JSON.parse(stateMatch[1]);
                            const failedItems = stateData.statuses?.filter(s => s.status === 'no_cumple' || s.status === 'no_aplica') || [];
                            if (failedItems.length > 0) {
                                auditoriaContext = `La última auditoría encontró hallazgos Críticos/No Conformidades en los ítems con IDs: ${failedItems.map(f => f.itemId).join(', ')}. Formula objetivos para subsanarlos.`;
                            } else {
                                auditoriaContext = 'La última auditoría tuvo 100% de cumplimiento. Formula objetivos de mantenimiento y mejora continua de los estándares evaluados.';
                            }
                        } catch (e) {
                            // Fallback to plain text slicing
                            let plainText = auditMessage.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                            auditoriaContext = `Resultados de la última Auditoría Interna:\n${plainText.substring(0, 2000)}...`;
                        }
                    } else {
                        // Fallback to plain text
                        let plainText = auditMessage.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                        auditoriaContext = `Resultados de la última Auditoría Interna:\n${plainText.substring(0, 2000)}...`;
                    }
                }
            }
        } catch (err) {
            logger.warn('[SGSST Objetivos] Error fetching Auditoria data:', err.message);
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

## FUENTES DE INFORMACIÓN INTEGRADAS (BASE ESTRICTA PARA LOS OBJETIVOS)
**1. Matriz de Peligros GTC 45 (Riesgos Prioritarios Identificados):**
${matrixContext}

**2. Estadísticas ATEL (Accidentalidad y Ausentismo Reciente):**
${atelContext}

**3. Informe de la Última Auditoría:**
${auditoriaContext}

**4. Directrices de la Política SST (Si el usuario las propuso):**
${policySummary || 'El usuario no proporcionó fragmentos de la política. Infiere la alineación estándar con el Decreto 1072.'}

**5. Resultados del Diagnóstico Inicial (Si el usuario los propuso):**
${diagnosticSummary || 'El usuario no proporcionó el diagnóstico. Concéntrate en la mejora continua por defecto.'}

**Marco Normativo Adicional:**
${additionalNorms || 'Decreto 1072 de 2015, Resolución 0312 de 2019'}

## INSTRUCCIONES ESTRICTAS Y OBLIGATORIAS DE GENERACIÓN

Genera el documento formal de OBJETIVOS DEL SISTEMA DE GESTIÓN (SG-SST) en formato HTML.
**REGLA DE ORO:** TIENES ESTRICTAMENTE PROHIBIDO INVENTAR TEXTO GENÉRICO, PORCENTAJES ALEATORIOS (ej. "reducir 50%") O FRASES DE CAJÓN (ej. "intervenir las causas raíz"). Eres un transcriptor analítico: DEBES tomar los textos LITERALES de las fuentes de información y convertirlos en objetivos.

1. **ENCABEZADO**: DEBES usar EXACTAMENTE el siguiente código HTML para el encabezado (INCLÚYELO TAL CUAL al inicio del informe):
${headerHTML}

2. **INTRODUCCIÓN**: Breve declaración indicando que los objetivos están alineados con la Política de SST, la matriz de peligros, las auditorías previas y las estadísticas (mencionando explícitamente las consecuencias y peligros extraídos de los accidentes reportados).

3. **OBJETIVOS GENERALES Y ESPECÍFICOS (Mínimo 5)**:
   - **Objetivo General**: Específico al giro exacto de la empresa, nombrando su misión principal.
   - **Objetivos de Peligros (Extraídos de la Matriz)**: Crea un objetivo POR CADA peligro prioritario listado arriba. MENCIONA EXACTAMENTE el nombre del Peligro y su Efecto Posible textual. 
     * *Ejemplo Obligatorio:* "Implementar controles de ingeniería para el riesgo [NOMBRE DEL RIESGO EXACTO] con el fin de prevenir [EFECTO POSIBLE EXACTO] en el proceso [NOMBRE DEL PROCESO]."
   - **Objetivos de Accidentalidad (Extraídos de ATEL)**: Crea un objetivo POR CADA accidente/enfermedad listado arriba, mencionando el peligro, causa y consecuencia específica.
     * *Ejemplo Obligatorio:* "Implementar un plan de corrección de actos inseguros enfocado en el peligro de [PELIGRO DEL EVENTO ATEL] para erradicar las consecuencias de [CONSECUENCIA DEL EVENTO ATEL] (ej. lesiones, lumbalgia, fractura) presentadas tras los eventos con causas de [CAUSA INMEDIATA]."
   - **Objetivos de Auditoría (Extraídos de la Auditoría)**: Si te pasé IDs de ítems fallidos en la auditoría (o texto de hallazgos), redacta un objetivo enfocado TEXTUALMENTE en solucionar esas inconformidades o mantener el 100%.
   - **CERO GENERALIDADES**: No escribas metas como "Reducir los 2 accidentes de trabajo". Debes decir QUÉ tipo exacto de accidente vas a evitar (basado en la consecuencia reportada).

4. **METAS E INDICADORES (TABLA INTERACTIVA)**:
   Genera una tabla HTML atractiva. Asocia cada Objetivo Específico con su respectiva Meta (ej. 100%, >80%, cero accidentes por [CAUSA ESPECÍFICA]) y su Indicador de medición.

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
