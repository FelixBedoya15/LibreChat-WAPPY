const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');

// ─── HELPER: Google Gemini SDK Wrapper ─────────────────────────────────────
async function generateWithRetry(model, promptText, options = {}) {
    const genAI = new GoogleGenerativeAI(model.apiKey);
    const modelName = model.model || 'gemini-3.1-flash-lite-preview';
    
    try {
        const genModel = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
                ...options
            }
        });
        return await genModel.generateContent(promptText);
    } catch (err) {
        logger.error('[Predictivo] Gemini Generation Failed:', err.message);
        throw err;
    }
}

// ─── HELPER: Aggregate All SST Context ─────────────────────────────────────
async function getFullSSTContext(userId) {
    let context = '\n\n**ECOSISTEMA SST - DATOS PARA ANÁLISIS PREDICTIVO:**\n';
    try {
        // 1. Salud (Perfil Sociodemográfico)
        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        if (PerfilSociodemograficoData) {
            const psd = await PerfilSociodemograficoData.findOne({ user: userId }).lean();
            if (psd && psd.trabajadores?.length) {
                const findings = psd.trabajadores.filter(t => t.diagnosticoMedico && t.diagnosticoMedico !== 'Apto / Sin Hallazgos');
                context += `- SALUD: ${psd.trabajadores.length} trabajadores. Hallazgos críticos: ${findings.length}. Detalles: ${findings.slice(0, 10).map(t => `${t.cargo}: ${t.diagnosticoMedico}`).join('; ')}.\n`;
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
                    context += `- ATEL (Año Actual): ${totalEvents} accidentes/incidentes. Peligros recurrentes: ${[...new Set(commonHazards)].join(', ')}.\n`;
                }
            }
        }

        // 3. Investigación ATEL (Causas Raíz)
        const InvestigacionAtelData = mongoose.models.InvestigacionAtelData;
        if (InvestigacionAtelData) {
            const iad = await InvestigacionAtelData.findOne({ user: userId }).lean();
            if (iad && iad.formData) {
                context += `- ÚLTIMO ACCIDENTE INVESTIGADO: Tarea: ${iad.formData.tareaAccidente}. Hechos: ${iad.formData.descripcionHechos?.substring(0, 200)}. Causa Raíz: ${iad.formData.causasBasicas || 'Sin especificar'}.\n`;
            }
        }

        // 4. Actos y Condiciones Inseguras
        const ReporteActosData = mongoose.models.ReporteActosData;
        if (ReporteActosData) {
            const rad = await ReporteActosData.findOne({ user: userId }).lean();
            if (rad && rad.reportesList?.length) {
                const acts = rad.reportesList.filter(r => r.tipo === 'Acto Inseguro').length;
                const conds = rad.reportesList.filter(r => r.tipo === 'Condición Insegura').length;
                context += `- REPORTES DE CAMPO: ${rad.reportesList.length} reportes (${acts} actos, ${conds} condiciones). Hallazgos clave: ${rad.reportesList.slice(-5).map(r => r.hallazgo).join(' | ')}.\n`;
            }
        }

        // 5. Ergonomía (Método OWAS)
        const MetodoOwasData = mongoose.models.MetodoOwasData;
        if (MetodoOwasData) {
            const owasd = await MetodoOwasData.findOne({ user: userId }).lean();
            if (owasd && owasd.resultados?.length) {
                const critical = owasd.resultados.filter(r => r.categoriaRiesgo >= 3);
                context += `- ERGONOMÍA (OWAS): ${owasd.resultados.length} posturas analizadas. ${critical.length} requieren intervención inmediata. Áreas: ${[...new Set(critical.map(c => c.faseTarea))].join(', ')}.\n`;
            }
        }

        // 6. Tareas Críticas (ATS)
        const AnalisisTrabajoSeguroData = mongoose.models.AnalisisTrabajoSeguroData;
        if (AnalisisTrabajoSeguroData) {
            const atsd = await AnalisisTrabajoSeguroData.findOne({ user: userId }).lean();
            if (atsd && atsd.pasos) {
                context += `- TAREAS CRÍTICAS (ATS): Actividad "${atsd.actividad}". Pasos de riesgo detectados en ATS: ${atsd.pasos.slice(0, 5).map(p => p.descripcion).join(', ')}.\n`;
            }
        }

        // 7. Emergencias (Análisis Vulnerabilidad)
        const AnalisisVulnerabilidadData = mongoose.models.AnalisisVulnerabilidadData;
        if (AnalisisVulnerabilidadData) {
            const avd = await AnalisisVulnerabilidadData.findOne({ user: userId }).lean();
            if (avd && avd.formData?.amenazasList) {
                const critical = avd.formData.amenazasList.filter(a => a.nivelAmenaza === 'Inminente' || a.nivelAmenaza === 'Probable');
                context += `- AMENAZAS EXTERNAS/EMERGENCIAS: ${critical.map(a => a.amenaza).join(', ')}.\n`;
            }
        }

    } catch (err) {
        logger.error('[Predictivo] Context failed:', err.message);
    }
    return context;
}

// ─── ENDPOINT: Get Forecast JSON (For Gauges and UI) ────────────────────────
router.get('/forecast', requireJwtAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const apiKey = await getUserKey(userId, 'google');
        if (!apiKey) return res.status(400).json({ error: 'Falta configuración de API Key de Google' });

        const context = await getFullSSTContext(userId);
        const prompt = `
Actúa como un Auditor de Riesgos Predictivo experto en SST. Analiza los siguientes datos cruzados de la empresa y genera un pronóstico matemático y narrativo breve.
DATOS: ${context}

Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "overallRisk": (Número de 0 a 100 indicando probabilidad de accidente en los próximos 30 días),
  "criticalArea": "Nombre del área o cargo más vulnerable",
  "predictionSummary": "Deducción breve de 2 líneas sobre qué pasará si no se interviene",
  "indicators": {
    "healthRisk": (Número 0-100),
    "safetyRisk": (Número 0-100),
    "ergonomicRisk": (Número 0-100)
  },
  "recommendedActions": ["Acción 1", "Acción 2", "Acción 3"]
}
`;

        const result = await generateWithRetry({ apiKey, model: 'gemini-3.1-flash-lite-preview' }, prompt, { responseMimeType: 'application/json' });
        const forecast = JSON.parse(result.response.text());
        res.json(forecast);
    } catch (err) {
        logger.error('[Predictivo] Error fetching forecast:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── ENDPOINT: Generate Predictive Report (For LiveEditor) ─────────────────
router.post('/generate-report', requireJwtAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { modelName } = req.body;
        const apiKey = await getUserKey(userId, 'google');
        if (!apiKey) return res.status(400).json({ error: 'Configuración de IA incompleta' });

        const context = await getFullSSTContext(userId);
        
        const prompt = `
Genera un INFORME TÉCNICO DE PRONÓSTICO Y PREDICCIÓN DE RIESGOS SST.
Utiliza un tono profesional, preventivo y basado en datos.
DATOS DE ENTRADA: ${context}

REQUISITOS DEL INFORME (En formato HTML):
1. Título impactante: "Pronóstico de Seguridad y Salud Laboral - [Mes Actual]"
2. Resumen Ejecutivo de Siniestralidad Proyectada.
3. Tabla de "Probabilidad de Accidentes por Factor de Riesgo".
4. Análisis de Correlación: Cruza hallazgos médicos con actos inseguros y resultados OWAS.
5. Plan Prescriptivo de Acción: Pasos inmediatos para mitigar la predicción.
6. Conclusión basada en el cumplimiento legal (Decreto 1072 y Res. 0312).

NO incluyas etiquetas <body> o <head>. Genera solo el contenido interno en un contenedor <div> con clases de estilo inline si es necesario.
`;

        const result = await generateWithRetry({ apiKey, model: modelName || 'gemini-3.1-flash-lite-preview' }, prompt);
        let aiHtml = result.response.text().trim();
        aiHtml = aiHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

        res.json({ report: aiHtml });
    } catch (err) {
        logger.error('[Predictivo] Report generation error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
