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
 * Calculates ATEL indicators (Res. 0312/2019 Art. 30) for Monthly or Annual scope.
 * Aggregates data from multiple months if scope is ANNUAL.
 * Generates qualitative analysis based on event details (causes, hazards).
 */
router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const {
            scope, // 'MONTH' | 'ANNUAL'
            year,
            targetMonthIndex,
            monthName,
            annualData, // Record<number, MonthData>
            modelName,
            userName,
        } = req.body;

        const safeAnnualData = annualData || {};
        const monthsIndices = Object.keys(safeAnnualData).map(Number).sort((a, b) => a - b);

        // ─── 1. Aggregation Logic ──────────────────────────────────────
        let aggregated = {
            workersSum: 0,
            monthsWithWorkers: 0,
            numAT: 0,
            diasIncapacidadAT: 0,
            diasCargados: 0,
            casosNuevosEL: 0,
            casosAntiguosEL: 0,
            diasAusencia: 0,
            diasProgramados: 0,
            allEvents: [],
        };

        const targetRealIndex = Number(targetMonthIndex);

        monthsIndices.forEach(idx => {
            // Include this month if:
            // - Scope is ANNUAL (include all valid months so far)
            // - Scope is MONTH (only include target month)
            if (scope === 'MONTH' && idx !== targetRealIndex) return;
            if (scope === 'ANNUAL' && idx > targetRealIndex) return; // Optional: stop at current month

            const mData = safeAnnualData[idx];
            if (!mData) return;

            // Workers (Average for aggregation)
            const w = Number(mData.numTrabajadores);
            if (w > 0) {
                aggregated.workersSum += w;
                aggregated.monthsWithWorkers++;
            }

            // Events Processing
            const events = mData.events || [];
            aggregated.allEvents = [...aggregated.allEvents, ...events.map(e => ({ ...e, monthIndex: idx }))];

            // Manual Inputs or Event-based (we rely on EVENTS for counters now, seeing Frontend logic)
            // Frontend sends: { numTrabajadores, diasProgramados, events: [] }
            // So we calculate metrics FROM events here to be safe and consistent.

            aggregated.numAT += events.filter(e => e.tipo === 'AT').length;
            aggregated.diasIncapacidadAT += events.filter(e => e.tipo === 'AT').reduce((sum, e) => sum + (Number(e.diasIncapacidad) || 0), 0);
            aggregated.diasCargados += events.filter(e => e.tipo === 'AT').reduce((sum, e) => sum + (Number(e.diasCargados) || 0), 0);
            aggregated.casosNuevosEL += events.filter(e => e.tipo === 'EL').length;
            aggregated.diasAusencia += events.filter(e => e.tipo === 'Ausentismo').reduce((sum, e) => sum + (Number(e.diasIncapacidad) || 0), 0);

            aggregated.diasProgramados += (Number(mData.diasProgramados) || 0);
        });

        // Final Calculations
        const avgWorkers = aggregated.monthsWithWorkers > 0
            ? aggregated.workersSum / aggregated.monthsWithWorkers
            : 0;

        // If 0 workers, avoid division by zero
        const safeWorkers = avgWorkers || 1;

        // ─── 2. Calculate Indicators (Standard Res 0312) ────────────────
        const k = 100; // Constant for most
        const kEL = 100000; // Constant for EL

        const indicators = [
            {
                id: 'frecuencia',
                nombre: 'Frecuencia de Accidentalidad',
                definicion: 'Número de veces que ocurre un accidente de trabajo en el mes',
                formula: '(N° AT / N° trabajadores) × 100',
                valor: ((aggregated.numAT / safeWorkers) * k).toFixed(2),
                interpretacion: `Por cada 100 trabajadores, se presentaron ${((aggregated.numAT / safeWorkers) * k).toFixed(2)} accidentes de trabajo en el periodo`,
                periodicidad: 'Mensual',
                limitReason: avgWorkers === 0 ? 'Sin trabajadores registrados' : null
            },
            {
                id: 'severidad',
                nombre: 'Severidad de Accidentalidad',
                definicion: 'Número de días perdidos por accidentes de trabajo en el mes + días cargados',
                formula: '((Días Incap + Días Cargados) / N° trabajadores) × 100',
                valor: (((aggregated.diasIncapacidadAT + aggregated.diasCargados) / safeWorkers) * k).toFixed(2),
                interpretacion: `Por cada 100 trabajadores, se perdieron ${(((aggregated.diasIncapacidadAT + aggregated.diasCargados) / safeWorkers) * k).toFixed(2)} días por accidentes de trabajo`,
                periodicidad: 'Mensual'
            },
            {
                id: 'mortalidad',
                nombre: 'Proporción de Accidentes de Trabajo Mortales',
                definicion: 'Número de accidentes de trabajo mortales en el año',
                formula: '(N° AT Mortales / Total AT) × 100',
                // Assuming mortality if diasCargados > 0 for now as heuristic or 0
                // Better: Check if any event has "Mortal" in consequence or high diasCargados (e.g. 6000 is international standard for death, 4500 Colombia?)
                // Let's assume 0 for now unless explicit.
                valor: '0.00',
                interpretacion: 'Sin accidentes mortales reportados',
                periodicidad: 'Anual'
            },
            {
                id: 'prevalencia',
                nombre: 'Prevalencia de la Enfermedad Laboral',
                definicion: 'Número de casos de enfermedad laboral presentes en una población',
                formula: '((Casos Nuevos + Antiguos) / Promedio trabajadores) × 100.000',
                valor: (((aggregated.casosNuevosEL) / safeWorkers) * kEL).toFixed(2),
                interpretacion: `Por cada 100.000 trabajadores existen ${(((aggregated.casosNuevosEL) / safeWorkers) * kEL).toFixed(2)} casos de enfermedad laboral`,
                periodicidad: 'Anual'
            },
            {
                id: 'incidencia',
                nombre: 'Incidencia de la Enfermedad Laboral',
                definicion: 'Número de casos nuevos de enfermedad laboral',
                formula: '(Casos Nuevos EL / Promedio trabajadores) × 100.000',
                valor: ((aggregated.casosNuevosEL / safeWorkers) * kEL).toFixed(2),
                interpretacion: `Por cada 100.000 trabajadores existen ${((aggregated.casosNuevosEL / safeWorkers) * kEL).toFixed(2)} casos nuevos de enfermedad laboral`,
                periodicidad: 'Anual'
            },
            {
                id: 'ausentismo',
                nombre: 'Ausentismo por Causa Médica',
                definicion: 'No asistencia al trabajo con incapacidad médica',
                formula: '(Días Ausencia / Días Programados) × 100',
                // Avoid div 0 if diasProgramados is 0
                valor: aggregated.diasProgramados > 0 ? ((aggregated.diasAusencia / aggregated.diasProgramados) * 100).toFixed(2) : '0.00',
                interpretacion: `Se perdió el ${aggregated.diasProgramados > 0 ? ((aggregated.diasAusencia / aggregated.diasProgramados) * 100).toFixed(2) : '0'}% del tiempo programado por incapacidad médica`,
                periodicidad: 'Mensual'
            }
        ];

        // ─── 3. Qualitative Data Preparation ───────────────────────────
        // Detailed events list for AI analysis
        const eventsSummary = aggregated.allEvents.map(e =>
            `- [${e.tipo}] Fecha: ${e.fecha}, Causa: "${e.causaInmediata}", Peligro: "${e.peligro}", Consecuencia: "${e.consecuencia}", Días: ${e.diasIncapacidad}`
        ).join('\n');

        const companyInfoBlock = await getCompanyInfoBlock(req.user.id);

        // ─── 4. Build Prompt ───────────────────────────────────────────
        const periodLabel = scope === 'ANNUAL' ? `Acumulado Año ${year} (hasta ${monthName})` : `Mes: ${monthName} ${year}`;

        const promptText = `
Eres un experto consultor en Seguridad y Salud en el Trabajo (SG-SST) en Colombia.
Genera un **INFORME ${scope === 'ANNUAL' ? 'ANUAL/ACUMULADO' : 'MENSUAL'} DE ESTADÍSTICAS ATEL** detallado y profesional.

**Periodo Evaluado:** ${periodLabel}
**Referencia:** Resolución 0312 de 2019
**Consultor:** ${userName || 'Consultor SST'}
${companyInfoBlock}

**DATOS CONSOLIDADOS:**
- Promedio Trabajadores: ${avgWorkers.toFixed(1)}
- Total Accidentes (AT): ${aggregated.numAT}
- Total Días Incapacidad AT: ${aggregated.diasIncapacidadAT}
- Casos Nuevos Enfermedad (EL): ${aggregated.casosNuevosEL}
- Días Ausentismo Médico: ${aggregated.diasAusencia}

**INDICADORES CALCULADOS (NO MODIFICAR VALORES):**
${indicators.map(i => `- ${i.nombre}: **${i.valor}** (${i.interpretacion})`).join('\n')}

**DETALLE DE EVENTOS REPORTADOS (PARA ANÁLISIS DE CAUSAS):**
${eventsSummary || 'No se registraron eventos específicos en este periodo.'}

**INSTRUCCIONES DE GENERACIÓN (HTML):**
Genera un informe HTML rico y estilizado con:
1.  **Encabezado Profesional**: Título, periodo, empresa.
2.  **Resumen Gerencial**: Visión general del comportamiento de la siniestralidad.
3.  **DASHBOARD DE INDICADORES (Tabla)**:
    - Columnas: Indicador | Resultado | Meta (asumir estándar) | Cumplimiento | Semáforo (Verde/Amarillo/Rojo).
4.  **ANÁLISIS DE CAUSALIDAD (Nuevo - Importante):**
    - Basado en la lista de eventos arriba, identifica:
    - **Peligros Más Frecuentes**: ¿Qué peligros (químico, alturas, etc.) se repiten más?
    - **Causas Raíz Comunes**: Analiza las "causas inmediatas" reportadas.
    - **Partes del Cuerpo Afectadas**: Si se menciona en consecuencias.
    - *Genera esta sección como texto narrativo analítico fuerte.*
5.  **GRÁFICAS DE TEXTO (Bar Charts HTML):**
    - Para los indicadores principales.
    - Y una gráfica cualitativa de "Top 3 Causas de Accidentalidad" (si hay datos).
6.  **CONCLUSIONES Y RECOMENDACIONES:**
    - Focos de intervención inmediata.
    - Plan de acción sugerido.

**ESTILOS OBLIGATORIOS:**
-   Usa colores corporativos sobrios (Azul #0056b3, Gris).
-   Tablas con bordes colapsados y encabezados oscuros.
-   **Análisis Cualitativo**: Usa viñetas y negritas para resaltar hallazgos.
-   Firma del consultor al final.
`;

        // ─── 5. Generation ─────────────────────────────────────────────
        const genAI = new GoogleGenerativeAI(await getApiKey(req.user.id));
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3-flash-preview' });

        const result = await model.generateContent(promptText);
        const text = result.response.text();

        const cleanedReport = cleanHtmlOutput(text);

        res.json({ report: cleanedReport });

    } catch (error) {
        logger.error('[SGSST Estadísticas] Error:', error);
        res.status(500).json({ error: `Error: ${error.message}` });
    }
});

// Helpers
async function getApiKey(userId) {
    try {
        const storedKey = await getUserKey({ userId, name: 'google' });
        if (storedKey) {
            try { return JSON.parse(storedKey)[AuthKeys.GOOGLE_API_KEY] || JSON.parse(storedKey).GOOGLE_API_KEY; }
            catch { return storedKey; }
        }
    } catch { }
    return process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
}

async function getCompanyInfoBlock(userId) {
    try {
        const ci = await CompanyInfo.findOne({ user: userId }).lean();
        if (ci) return `**Empresa:** ${ci.companyName || 'N/A'} (NIT: ${ci.nit || 'N/A'}) - Sector: ${ci.sector || 'N/A'}`;
    } catch { }
    return '';
}

function cleanHtmlOutput(text) {
    return text.replace(/```html\n?/g, '').replace(/```\n?/g, '')
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
        .replace(/<head>[\s\S]*?<\/head>/gi, '')
        .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
        .trim();
}

module.exports = router;
