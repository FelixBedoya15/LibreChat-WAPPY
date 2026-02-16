const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');

/**
 * POST /api/sgsst/estadisticas/generate
 * Calculates the 6 mandatory ATEL indicators (Res. 0312/2019 Art. 30)
 * and generates a professional HTML report via Gemini.
 */
router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const {
            periodo,
            numTrabajadores,
            numAT,
            diasIncapacidadAT,
            diasCargados,
            numATMortales,
            totalATAnual,
            casosNuevosEL,
            casosAntiguosEL,
            diasAusencia,
            diasProgramados,
            modelName,
            userName,
        } = req.body;

        if (!numTrabajadores || numTrabajadores <= 0) {
            return res.status(400).json({ error: 'El número de trabajadores es obligatorio y debe ser mayor a 0.' });
        }

        // ─── 1. Calculate Indicators ───────────────────────────────────
        const workers = Number(numTrabajadores);
        const at = Number(numAT) || 0;
        const diasIncap = Number(diasIncapacidadAT) || 0;
        const diasCarg = Number(diasCargados) || 0;
        const atMortales = Number(numATMortales) || 0;
        const totalAT = Number(totalATAnual) || 0;
        const nuevosEL = Number(casosNuevosEL) || 0;
        const antiguosEL = Number(casosAntiguosEL) || 0;
        const diasAus = Number(diasAusencia) || 0;
        const diasProg = Number(diasProgramados) || 1; // avoid division by zero

        const indicators = [
            {
                id: 'frecuencia',
                nombre: 'Frecuencia de Accidentalidad',
                definicion: 'Número de veces que ocurre un accidente de trabajo en el mes',
                formula: '(N° AT en el mes / N° trabajadores en el mes) × 100',
                valor: ((at / workers) * 100).toFixed(2),
                interpretacion: `Por cada 100 trabajadores que laboraron en el mes, se presentaron ${((at / workers) * 100).toFixed(2)} accidentes de trabajo`,
                periodicidad: 'Mensual',
                datos: { numerador: at, denominador: workers, constante: 100 },
            },
            {
                id: 'severidad',
                nombre: 'Severidad de Accidentalidad',
                definicion: 'Número de días perdidos por accidentes de trabajo en el mes',
                formula: '(N° días incapacidad por AT + días cargados en el mes / N° trabajadores en el mes) × 100',
                valor: (((diasIncap + diasCarg) / workers) * 100).toFixed(2),
                interpretacion: `Por cada 100 trabajadores que laboraron en el mes, se perdieron ${(((diasIncap + diasCarg) / workers) * 100).toFixed(2)} días por accidentes de trabajo`,
                periodicidad: 'Mensual',
                datos: { numerador: diasIncap + diasCarg, denominador: workers, constante: 100 },
            },
            {
                id: 'mortalidad',
                nombre: 'Proporción de Accidentes de Trabajo Mortales',
                definicion: 'Número de accidentes de trabajo mortales en el año',
                formula: '(N° AT mortales en el año / Total AT en el año) × 100',
                valor: totalAT > 0 ? ((atMortales / totalAT) * 100).toFixed(2) : '0.00',
                interpretacion: totalAT > 0
                    ? `En el año, el ${((atMortales / totalAT) * 100).toFixed(2)}% de accidentes de trabajo fueron mortales`
                    : 'No se presentaron accidentes de trabajo en el año',
                periodicidad: 'Anual',
                datos: { numerador: atMortales, denominador: totalAT, constante: 100 },
            },
            {
                id: 'prevalencia',
                nombre: 'Prevalencia de la Enfermedad Laboral',
                definicion: 'Número de casos de enfermedad laboral presentes en una población en un periodo de tiempo',
                formula: '(Casos nuevos y antiguos de EL en el periodo / Promedio trabajadores en el periodo) × 100.000',
                valor: (((nuevosEL + antiguosEL) / workers) * 100000).toFixed(2),
                interpretacion: `Por cada 100.000 trabajadores existen ${(((nuevosEL + antiguosEL) / workers) * 100000).toFixed(2)} casos de enfermedad laboral en el periodo`,
                periodicidad: 'Anual',
                datos: { numerador: nuevosEL + antiguosEL, denominador: workers, constante: 100000 },
            },
            {
                id: 'incidencia',
                nombre: 'Incidencia de la Enfermedad Laboral',
                definicion: 'Número de casos nuevos de enfermedad laboral determinada en una población en un periodo de tiempo',
                formula: '(Casos nuevos de EL en el periodo / Promedio trabajadores en el periodo) × 100.000',
                valor: ((nuevosEL / workers) * 100000).toFixed(2),
                interpretacion: `Por cada 100.000 trabajadores existen ${((nuevosEL / workers) * 100000).toFixed(2)} casos nuevos de enfermedad laboral en el periodo`,
                periodicidad: 'Anual',
                datos: { numerador: nuevosEL, denominador: workers, constante: 100000 },
            },
            {
                id: 'ausentismo',
                nombre: 'Ausentismo por Causa Médica',
                definicion: 'No asistencia al trabajo con incapacidad médica',
                formula: '(N° días de ausencia por incapacidad en el mes / N° días de trabajo programados en el mes) × 100',
                valor: ((diasAus / diasProg) * 100).toFixed(2),
                interpretacion: `En el mes se perdió ${((diasAus / diasProg) * 100).toFixed(2)}% de días programados de trabajo por incapacidad médica`,
                periodicidad: 'Mensual',
                datos: { numerador: diasAus, denominador: diasProg, constante: 100 },
            },
        ];

        // ─── 2. Get API Key ────────────────────────────────────────────
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
            logger.debug('[SGSST Estadísticas] No user Google key found, trying env vars');
        }

        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }

        if (!resolvedApiKey) {
            return res.status(400).json({ error: 'No se ha configurado la clave API de Google.' });
        }

        // ─── 3. Get Company Info ───────────────────────────────────────
        let companyInfoBlock = '';
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            if (ci && ci.companyName) {
                companyInfoBlock = `
**Datos de la Empresa:**
- Nombre: ${ci.companyName}
- NIT: ${ci.nit || 'N/A'}
- Ciudad: ${ci.city || 'N/A'}
- Sector: ${ci.sector || 'N/A'}
`;
            }
        } catch (error) {
            logger.error('[SGSST Estadísticas] Error fetching company info', error);
        }

        const currentDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
        const resolvedUserName = userName || req.user?.name || 'Consultor SST';

        // ─── 4. Build Prompt ───────────────────────────────────────────
        const indicatorsBlock = indicators.map(ind => {
            return `### ${ind.nombre}
- **Definición:** ${ind.definicion}
- **Fórmula:** ${ind.formula}
- **Cálculo:** (${ind.datos.numerador} / ${ind.datos.denominador}) × ${ind.datos.constante} = **${ind.valor}**
- **Interpretación:** ${ind.interpretacion}
- **Periodicidad Mínima:** ${ind.periodicidad}`;
        }).join('\n\n');

        const promptText = `Eres un experto consultor en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.

**Fecha de Emisión:** ${currentDate}
**Consultor:** ${resolvedUserName}
**Referencia Normativa:** Resolución 0312 de 2019, Artículo 30 — Indicadores Mínimos de SST
**Periodo Evaluado:** ${periodo || 'No especificado'}
${companyInfoBlock}

## DATOS CALCULADOS DE LOS INDICADORES

Los siguientes indicadores ya han sido calculados con los datos proporcionados por el usuario. **NO modifiques los valores numéricos.** Usa estos datos exactos para generar el informe.

${indicatorsBlock}

## INSTRUCCIONES — GENERACIÓN DE INFORME

Genera un INFORME PROFESIONAL MUY DETALLADO en formato HTML RICO Y ESTILIZADO con las siguientes secciones:

1. **ENCABEZADO Y CONTEXTO**:
   - Tabla elegante con información de la empresa, periodo evaluado, referencia normativa.

2. **RESUMEN EJECUTIVO**:
   - Párrafo extenso describiendo el panorama general de los indicadores ATEL del periodo.
   - Identificar los indicadores más críticos y los más favorables.

3. **TABLA DE INDICADORES MÍNIMOS DE SST (Res. 0312 Art. 30)**:
   - TABLA HTML profesional con las siguientes columnas:
     | Indicador | Definición | Fórmula | Resultado | Interpretación | Periodicidad | Semáforo |
   - **Usa EXACTAMENTE los valores calculados proporcionados arriba.**
   - **SEMÁFORO con colores:** Asigna un color de fondo a cada fila según el nivel de riesgo del resultado:
     * 🟢 Verde (#e0ffe0): resultado favorable (baja accidentalidad, baja severidad, bajo ausentismo)
     * 🟡 Amarillo (#fff8e0): resultado moderado, requiere atención
     * 🔴 Rojo (#ffe0e0): resultado alto/crítico, requiere acción inmediata
   - Usa tu criterio profesional para clasificar (ej: frecuencia >5% es rojo, >2% amarillo, <2% verde).

4. **GRÁFICOS VISUALES**:
   - Para CADA indicador, genera una BARRA DE PROGRESO visual usando HTML/CSS inline:
     * Contenedor gris claro (200px alto o más) con una barra interna de color (verde/amarillo/rojo).
     * El ancho de la barra debe ser proporcional al valor (con un máximo visual razonable).
     * Muestra el valor numérico dentro o al lado de la barra.
   - Organiza los 6 gráficos en un grid de 2 o 3 columnas.

5. **ANÁLISIS DETALLADO POR INDICADOR**:
   - Para CADA uno de los 6 indicadores, escribe un párrafo extenso que incluya:
     * Qué significa el resultado obtenido
     * Comparación con umbrales razonables del sector
     * Impacto en el SG-SST
     * Recomendaciones específicas de mejora
   - Usa <div> estilizados con borde lateral de color (verde/amarillo/rojo) para cada análisis.

6. **CONCLUSIONES GENERALES (EXTENSAS)**:
   - Mínimo 3 párrafos con el análisis global del estado ATEL de la empresa.
   - Fortalezas identificadas.
   - Áreas críticas que requieren intervención.
   - Impacto legal según Dec. 1072/2015 y Res. 0312/2019.
   - Recomendación de periodicidad de seguimiento.

7. **PLAN DE ACCIÓN RECOMENDADO**:
   - TABLA HTML con columnas: Indicador | Situación Actual | Meta Propuesta | Acción Recomendada | Responsable | Plazo
   - Una fila por cada indicador que requiera mejora.
   - **COLORES POR PRIORIDAD:** Alta (#ffe0e0), Media (#fff8e0), Baja (#e0ffe0).

**ESTILOS OBLIGATORIOS (CSS INLINE):**
- Títulos (h1, h2): Color azul oscuro (#004d99).
- Tablas: width="100%", border-collapse="collapse", th con background-color="#004d99" y color="white".
- Celdas (td): padding="10px", border-bottom="1px solid #ddd".
- Usar los colores de semáforo indicados arriba para las filas según el nivel de riesgo.

**FIRMA OBLIGATORIA:**
Al final del informe, firma estrictamente así (SIN IMÁGENES):
<div style="margin-top: 50px; text-align: center;">
    <hr style="width: 200px; margin: 0 auto 10px auto; border: none; border-top: 1px solid #333;" />
    <strong>${resolvedUserName}</strong><br>
    Consultor Experto en SG-SST (Dec. 1072/2015)<br>
    Licencia en Seguridad y Salud en el Trabajo Vigente
</div>
IMPORTANTE: NO incluyas ninguna etiqueta &lt;img&gt; ni placeholders de imagen para la firma. Solo texto.

Genera SOLO el contenido del cuerpo (HTML body tags).`;

        // ─── 5. Generate Report ────────────────────────────────────────
        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const selectedModel = modelName || 'gemini-3-flash-preview';

        const generationConfig = {
            maxOutputTokens: 65536,
            temperature: 0.7,
        };

        const generateWithTimeout = async (model, prompt, timeoutMs = 180000) => {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT: La generación del informe excedió el tiempo límite.')), timeoutMs)
            );
            const genPromise = (async () => {
                const genResult = await model.generateContent(prompt);
                const genResponse = await genResult.response;
                return genResponse.text();
            })();
            return Promise.race([genPromise, timeoutPromise]);
        };

        let text;
        try {
            console.log(`[SGSST Estadísticas] Generating with ${selectedModel}`);
            const modelPrimary = genAI.getGenerativeModel({ model: selectedModel, generationConfig });
            text = await generateWithTimeout(modelPrimary, promptText);
        } catch (primaryError) {
            console.warn(`[SGSST Estadísticas] Primary model failed, falling back. Error:`, primaryError.message);
            if (primaryError.message.includes('TIMEOUT')) {
                throw primaryError;
            }
            try {
                const modelFallback = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp', generationConfig });
                text = await generateWithTimeout(modelFallback, promptText);
            } catch (fallbackError) {
                console.error('[SGSST Estadísticas] All models failed.');
                throw fallbackError;
            }
        }

        // ─── 6. Clean Output ───────────────────────────────────────────
        let cleanedReport = text
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const bodyMatch = cleanedReport.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            cleanedReport = bodyMatch[1].trim();
        }
        cleanedReport = cleanedReport
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
            .replace(/<head>[\s\S]*?<\/head>/gi, '')
            .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .trim();

        res.json({
            report: cleanedReport,
            indicators,
        });

    } catch (error) {
        console.error('[SGSST Estadísticas] Generation error:', error);
        logger.error('[SGSST Estadísticas] Error:', error);
        res.status(500).json({ error: `Error generando informe de estadísticas: ${error.message}` });
    }
});

module.exports = router;
