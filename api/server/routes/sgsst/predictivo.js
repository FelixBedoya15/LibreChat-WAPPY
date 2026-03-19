const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildCompanyContextString, buildSignatureSection } = require('./reportHeader');

// ─── HELPER: Get API Key (Same pattern as estadisticas.js & matrizPeligros.js) ──
async function getApiKey(userId) {
    let key;
    try {
        const storedKey = await getUserKey({ userId, name: 'google' });
        if (storedKey) {
            try { key = JSON.parse(storedKey)[AuthKeys.GOOGLE_API_KEY] || JSON.parse(storedKey).GOOGLE_API_KEY; }
            catch { key = storedKey; }
        }
    } catch { }

    if (!key) {
        key = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
    }

    if (key && typeof key === 'string') {
        key = key.split(',')[0].trim();
    }

    return key;
}

// ─── HELPER: Google Gemini with Fallback (Same pattern as estadisticas.js) ───
async function generateWithRetry(model, promptText) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(model.apiKey);
    const currentModelName = (model.model || 'gemini-3.1-flash-lite-preview').replace('models/', '');

    const fallbackOrder = [
        'gemini-3.1-flash-lite-preview',
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite'
    ];

    let modelsToTry = [currentModelName];
    for (const m of fallbackOrder) {
        if (m !== currentModelName) modelsToTry.push(m);
    }

    let lastError;
    for (const modelName of modelsToTry) {
        if (!modelName) continue;
        try {
            if (modelName !== currentModelName) {
                console.warn(`[Predictivo] Cambiando a modelo de respaldo: ${modelName}...`);
            }
            const fallbackModel = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: model.generationConfig || {}
            });
            return await fallbackModel.generateContent(promptText);
        } catch (err) {
            console.warn(`[Predictivo] Falló ${modelName}: ${err.message}`);
            lastError = err;
        }
    }

    throw new Error(`Todos los modelos generativos fallaron. Último error: ${lastError?.message || 'Desconocido'}`);
}

// ─── HELPER: Clean HTML Output (Same as estadisticas.js) ────────────────────
function cleanHtmlOutput(text) {
    return text.replace(/```html\n?/g, '').replace(/```\n?/g, '')
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
        .replace(/<head>[\s\S]*?<\/head>/gi, '')
        .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
        .trim();
}

// ─── HELPER: Aggregate All SST Context from DB ─────────────────────────────
async function getFullSSTContext(userId) {
    let context = '\n**ECOSISTEMA SST - DATOS CONSOLIDADOS PARA ANÁLISIS PREDICTIVO:**\n';
    try {
        // 1. Salud (Perfil Sociodemográfico)
        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        if (PerfilSociodemograficoData) {
            const psd = await PerfilSociodemograficoData.findOne({ user: userId }).lean();
            if (psd && psd.trabajadores?.length) {
                const findings = psd.trabajadores.filter(t => t.diagnosticoMedico && t.diagnosticoMedico !== 'Apto / Sin Hallazgos');
                context += `- SALUD OCUPACIONAL: ${psd.trabajadores.length} trabajadores evaluados. Hallazgos clínicos relevantes: ${findings.length}. Detalle: ${findings.slice(0, 15).map(t => `${t.cargo}: ${t.diagnosticoMedico}`).join('; ')}.\n`;
            } else {
                context += `- SALUD OCUPACIONAL: Sin datos registrados en perfil sociodemográfico.\n`;
            }
        }

        // 2. Siniestralidad (Estadísticas ATEL)
        const ATELAnnualData = mongoose.models.ATELAnnualData;
        if (ATELAnnualData) {
            const ad = await ATELAnnualData.findOne({ user: userId }).lean();
            if (ad && ad.years) {
                const years = Object.keys(ad.years).sort().reverse();
                if (years.length > 0) {
                    let totalEvents = 0;
                    let commonHazards = [];
                    Object.values(ad.years[years[0]]).forEach(m => {
                        if (m?.events) {
                            totalEvents += m.events.length;
                            m.events.forEach(e => { if (e.peligro) commonHazards.push(e.peligro); });
                        }
                    });
                    context += `- SINIESTRALIDAD ATEL (Año ${years[0]}): ${totalEvents} eventos registrados. Peligros frecuentes: ${[...new Set(commonHazards)].join(', ') || 'No categorizados'}.\n`;
                }
            } else {
                context += `- SINIESTRALIDAD ATEL: Sin historial de eventos en base de datos.\n`;
            }
        }

        // 3. Investigación ATEL (Causas Raíz)
        const InvestigacionAtelData = mongoose.models.InvestigacionAtelData;
        if (InvestigacionAtelData) {
            const investigations = await InvestigacionAtelData.find({ user: userId }).lean();
            if (investigations?.length) {
                const latest = investigations[investigations.length - 1];
                context += `- INVESTIGACIONES ATEL: ${investigations.length} investigaciones realizadas. Última investigación: "${latest.formData?.tareaAccidente || 'N/A'}". Causa Básica: ${latest.formData?.causasBasicas || 'N/A'}. Causa Inmediata: ${latest.formData?.causasInmediatas || 'N/A'}.\n`;
            }
        }

        // 4. Actos y Condiciones Inseguras
        const ReporteActosData = mongoose.models.ReporteActosData;
        if (ReporteActosData) {
            const rad = await ReporteActosData.findOne({ user: userId }).lean();
            if (rad && rad.reportesList?.length) {
                const acts = rad.reportesList.filter(r => r.tipo === 'Acto Inseguro').length;
                const conds = rad.reportesList.filter(r => r.tipo === 'Condición Insegura').length;
                context += `- REPORTES DE CAMPO: ${rad.reportesList.length} registros (${acts} actos inseguros, ${conds} condiciones inseguras). Hallazgos recientes: ${rad.reportesList.slice(-10).map(r => r.hallazgo).join(' | ')}.\n`;
            } else {
                context += `- REPORTES DE CAMPO: Sin reportes de actos o condiciones inseguras.\n`;
            }
        }

        // 5. Ergonomía (OWAS)
        const MetodoOwasData = mongoose.models.MetodoOwasData;
        if (MetodoOwasData) {
            const owasd = await MetodoOwasData.findOne({ user: userId }).lean();
            if (owasd && owasd.resultados?.length) {
                const critical = owasd.resultados.filter(r => r.categoriaRiesgo >= 3);
                context += `- ERGONOMÍA (OWAS): ${owasd.resultados.length} posturas evaluadas. ${critical.length} requieren intervención inmediata. Áreas: ${[...new Set(critical.map(c => c.faseTarea))].join(', ') || 'N/A'}.\n`;
            }
        }

        // 6. ATS (Tareas Críticas)
        const AnalisisTrabajoSeguroData = mongoose.models.AnalisisTrabajoSeguroData;
        if (AnalisisTrabajoSeguroData) {
            const atsd = await AnalisisTrabajoSeguroData.findOne({ user: userId }).lean();
            if (atsd && atsd.pasos) {
                context += `- TAREAS ALTO RIESGO (ATS): Actividad: "${atsd.actividad}". Pasos peligrosos: ${atsd.pasos.slice(0, 5).map(p => p.descripcion).join(', ')}.\n`;
            }
        }

        // 7. Vulnerabilidad
        const AnalisisVulnerabilidadData = mongoose.models.AnalisisVulnerabilidadData;
        if (AnalisisVulnerabilidadData) {
            const avd = await AnalisisVulnerabilidadData.findOne({ user: userId }).lean();
            if (avd && avd.formData?.amenazasList) {
                const critical = avd.formData.amenazasList.filter(a => a.nivelAmenaza === 'Inminente' || a.nivelAmenaza === 'Probable');
                if (critical.length > 0) {
                    context += `- AMENAZAS (Vulnerabilidad): ${critical.map(a => a.amenaza).join(', ')}.\n`;
                }
            }
        }

        // 8. Matriz de Peligros (GTC45)
        const MatrizPeligrosData = mongoose.models.MatrizPeligrosData;
        if (MatrizPeligrosData) {
            const mpd = await MatrizPeligrosData.findOne({ user: userId }).lean();
            if (mpd && mpd.procesos?.length) {
                let totalPeligros = 0;
                let riskI = 0;
                let riskII = 0;
                mpd.procesos.forEach(p => {
                    (p.peligros || []).forEach(h => {
                        totalPeligros++;
                        if (h.nivelRiesgo >= 600) riskI++;
                        else if (h.nivelRiesgo >= 150) riskII++;
                    });
                });
                context += `- MATRIZ GTC 45: ${mpd.procesos.length} procesos, ${totalPeligros} peligros identificados. Nivel I (No Aceptable): ${riskI}. Nivel II (Alto): ${riskII}.\n`;
            }
        }

    } catch (err) {
        logger.error('[Predictivo] Context aggregation failed:', err.message);
    }
    return context;
}


// ═══════════════════════════════════════════════════════════════════════════════
// ─── ENDPOINT: Get Forecast JSON (For Gauges and UI) ─────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/forecast', requireJwtAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const apiKey = await getApiKey(userId);
        if (!apiKey) return res.status(400).json({ error: 'Falta configurar la API Key de Google en su perfil.' });

        const context = await getFullSSTContext(userId);

        const prompt = `
Actúa como un Auditor de Riesgos Predictivo Senior. Analiza integralmente los datos cruzados de todos los módulos SST de la empresa.
${context}

Genera un pronóstico de riesgo para los próximos 30 días.
Responde ÚNICAMENTE con un objeto JSON (SIN texto adicional, SIN markdown):
{
  "overallRisk": (número 0-100, probabilidad general de accidente),
  "criticalArea": "nombre del cargo o proceso más vulnerable",
  "predictionSummary": "análisis breve de 2-3 frases sobre el panorama de riesgo",
  "indicators": {
    "healthRisk": (número 0-100),
    "safetyRisk": (número 0-100),
    "ergonomicRisk": (número 0-100)
  },
  "recommendedActions": ["acción 1", "acción 2", "acción 3"]
}
`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

        let result;
        try {
            result = await generateWithRetry({ apiKey, model: 'gemini-3.1-flash-lite-preview' }, prompt);
        } catch (err) {
            logger.error('[Predictivo] Gemini forecast failed:', err.message);
            return res.status(500).json({ error: 'Error al conectar con IA. Verifique su API Key.' });
        }

        let text = result.response.text().trim();
        // Clean markdown wrapping if Gemini outputs ```json
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let forecast;
        try {
            forecast = JSON.parse(text);
        } catch (parseErr) {
            logger.error('[Predictivo] JSON parse failed. Raw response:', text.substring(0, 300));
            return res.status(500).json({ error: 'La IA devolvió una respuesta no válida. Intente de nuevo.' });
        }

        res.json(forecast);
    } catch (err) {
        logger.error('[Predictivo] Forecast error:', err.message);
        res.status(500).json({ error: 'Error interno en pronóstico: ' + err.message });
    }
});


// ═══════════════════════════════════════════════════════════════════════════════
// ─── ENDPOINT: Generate Predictive Report (Same pattern as estadisticas.js) ──
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/generate-report', requireJwtAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { modelName } = req.body;

        const apiKey = await getApiKey(userId);
        if (!apiKey) return res.status(400).json({ error: 'Falta configurar la API Key de Google en su perfil.' });

        // Get company info (same as other apps)
        const ci = await CompanyInfo.findOne({ user: userId }).lean();
        const companyContext = buildCompanyContextString(ci);
        const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

        // Build header HTML (same as estadisticas, diagnostico, etc.)
        const headerHTML = buildStandardHeader({
            title: 'INFORME TÉCNICO DE INTELIGENCIA PREDICTIVA SST',
            companyInfo: ci,
            date: fecha,
            norm: 'Decreto 1072 de 2015 / Resolución 0312 de 2019',
        });

        // Get all ecosystem data
        const context = await getFullSSTContext(userId);

        const promptText = `
Eres un Consultor Estratégico Senior en Seguridad y Salud en el Trabajo (SGSST) en Colombia, con conocimientos avanzados en análisis predictivo de riesgos laborales.

${companyContext}

${context}

**Tu tarea:**
Genera un INFORME EJECUTIVO TÉCNICO DE INTELIGENCIA PREDICTIVA SST extremadamente detallado y profesional.

**ESTRUCTURA OBLIGATORIA REQUERIDA:**

1.  **ENCABEZADO OFICIAL:**
    - DEBES usar EXACTAMENTE el siguiente código HTML (INCLÚYELO TAL CUAL al inicio):
    ${headerHTML}

2.  **RESUMEN EJECUTIVO DE RIESGO PROYECTADO (Múltiples párrafos):**
    - Análisis cuantitativo y cualitativo del panorama de riesgo.
    - Explica la probabilidad de accidentes en los próximos 30 días.
    - Relaciona datos de siniestralidad pasada con condiciones actuales.
    
3.  **TABLERO DE INDICADORES PREDICTIVOS:**
    - Tarjetas visuales (cards) con CSS inline para: Riesgo General, Riesgo Salud, Riesgo Seguridad, Riesgo Ergonómico.
    - Cada tarjeta debe mostrar un porcentaje estimado y su interpretación.

4.  **ANÁLISIS DE CORRELACIÓN (CRUCE DE DATOS):**
    - Cruza hallazgos médicos (sociodemográfico) con actos inseguros y resultados OWAS.
    - Detecta patrones ocultos entre los módulos.
    - Explica POR QUÉ ciertos cargos o procesos tienen mayor probabilidad de accidente.

5.  **GRÁFICA DE BARRAS HTML (Factores de Riesgo):**
    - Simula una gráfica de barras horizontal con \`<div>\` y porcentajes de ancho (width: X%).
    - Muestra los 5 factores de riesgo más relevantes con sus porcentajes.

6.  **PLAN PRESCRIPTIVO DE ACCIÓN INMEDIATA:**
    - Tabla profesional con columnas: Factor de Riesgo, Cargo/Proceso Afectado, Acción Recomendada, Prioridad (Alta/Media/Baja), Responsable Sugerido.

7.  **CONCLUSIÓN Y CUMPLIMIENTO LEGAL:**
    - Referencia al Decreto 1072 de 2015 y Resolución 0312 de 2019.
    - Consecuencias legales de no intervenir.

8.  **FIRMA:**
    - El sistema añadirá la sección de firmas automáticamente. NO la generes tú.

**ESTILOS CSS - PRECAUCIÓN MODO OSCURO (OBLIGATORIO):**
- **Regla Crítica:** NO uses tablas "striped" (filas con colores alternos) porque rompen la lectura en modo oscuro.
- CADA VEZ que uses \`background-color\`, DEBES especificar \`color: #000;\` (si es fondo claro) o \`color: #fff;\` (si es fondo oscuro).
- **Encabezados:** Color #0f766e con \`color: #0f766e;\`.
- **Tablas:** width="100%", border-collapse="separate", border-spacing="0", border-radius="12px", overflow="hidden", border="1px solid #ddd".
- **Th:** background-color="#0f766e", color="white", padding="12px", text-transform="uppercase".
- **Td:** padding="10px", border-bottom="1px solid #e0e0e0" (SIN background-color para modo oscuro).
- **Cards:** background-color="#f8f9fa", color="#000", border-left="5px solid #0f766e", padding="15px", margin="10px", border-radius="4px".
- **Barras:** background-color="#0f766e", color="white", border-radius="6px", padding="8px", margin="4px 0".

**IMPORTANTE:** Retorna SOLAMENTE HTML limpio. SIN markdown ni \`\`\`html.
`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3.1-flash-lite-preview' });

        const result = await generateWithRetry(model, promptText);
        const text = result.response.text();

        let cleanedReport = cleanHtmlOutput(text);

        // Add signature section (same as all other apps)
        if (ci) {
            cleanedReport += buildSignatureSection(ci);
        }

        res.json({ report: cleanedReport });

    } catch (error) {
        logger.error('[Predictivo] Report error:', error);
        res.status(500).json({ error: `Error: ${error.message}` });
    }
});

module.exports = router;
