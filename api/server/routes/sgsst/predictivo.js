const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');

// ─── HELPER: Google Gemini SDK Wrapper with Fallbacks ────────────────────────
async function generateWithRetry(model, promptText, options = {}) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(model.apiKey);
    
    // Fallback order for models if the primary one fails
    const fallbackOrder = [
        'gemini-3-flash-preview',
        'gemini-3.1-flash-lite-preview',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-1.5-flash'
    ];
    
    const currentModelName = model.model || 'gemini-3.1-flash-lite-preview';
    let modelsToTry = [currentModelName];
    for (const m of fallbackOrder) {
        if (m !== currentModelName) modelsToTry.push(m);
    }
    
    let lastError;
    for (const modelName of modelsToTry) {
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
            const result = await genModel.generateContent(promptText);
            if (!result || !result.response) throw new Error('Respuesta de IA vacía');
            return result;
        } catch (err) {
            logger.warn(`[Predictivo] Falló modelo ${modelName}: ${err.message}`);
            lastError = err;
        }
    }
    
    throw lastError || new Error('Todos los modelos generativos fallaron');
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
                context += `- SALUD: ${psd.trabajadores.length} trabajadores evaluados. Hallazgos críticos detectados: ${findings.length}. Ejemplos: ${findings.slice(0, 15).map(t => `${t.cargo}: ${t.diagnosticoMedico}`).join('; ')}.\n`;
            } else {
                context += `- SALUD: No se registran datos sociodemográficos o de salud.\n`;
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
                    context += `- SINIESTRALIDAD (Año ${years[0]}): ${totalEvents} accidentes/incidentes reportados. Peligros asociados: ${[...new Set(commonHazards)].join(', ')}.\n`;
                }
            } else {
                context += `- SINIESTRALIDAD: Sin historial de accidentes en base de datos.\n`;
            }
        }

        // 3. Investigación ATEL (Causas Raíz)
        const InvestigacionAtelData = mongoose.models.InvestigacionAtelData;
        if (InvestigacionAtelData) {
            const iad = await InvestigacionAtelData.findOne({ user: userId }).lean();
            if (iad && iad.formData) {
                context += `- ÚLTIMA INVESTIGACIÓN: En el proceso de ${iad.formData.tareaAccidente}. Causa Básica: ${iad.formData.causasBasicas || 'N/A'}. Causa Inmediata: ${iad.formData.causasInmediatas || 'N/A'}.\n`;
            }
        }

        // 4. Actos y Condiciones Inseguras (Precursores)
        const ReporteActosData = mongoose.models.ReporteActosData;
        if (ReporteActosData) {
            const rad = await ReporteActosData.findOne({ user: userId }).lean();
            if (rad && rad.reportesList?.length) {
                const acts = rad.reportesList.filter(r => r.tipo === 'Acto Inseguro').length;
                const conds = rad.reportesList.filter(r => r.tipo === 'Condición Insegura').length;
                context += `- REPORTES DE CAMPO: ${rad.reportesList.length} registros (${acts} actos inseguros, ${conds} condiciones). Hallazgos recientes: ${rad.reportesList.slice(-10).map(r => r.hallazgo).join(' | ')}.\n`;
            } else {
                context += `- REPORTES DE CAMPO: Sin reportes de actos o condiciones inseguras recientes.\n`;
            }
        }

        // 5. Ergonomía (OWAS)
        const MetodoOwasData = mongoose.models.MetodoOwasData;
        if (MetodoOwasData) {
            const owasd = await MetodoOwasData.findOne({ user: userId }).lean();
            if (owasd && owasd.resultados?.length) {
                const critical = owasd.resultados.filter(r => r.categoriaRiesgo >= 3);
                context += `- ERGONOMÍA (Evaluaciones OWAS): ${owasd.resultados.length} posturas registradas. ${critical.length} requieren intervención inmediata. Áreas afectadas: ${[...new Set(critical.map(c => c.faseTarea))].join(', ')}.\n`;
            }
        }

        // 6. Actividades Críticas (ATS)
        const AnalisisTrabajoSeguroData = mongoose.models.AnalisisTrabajoSeguroData;
        if (AnalisisTrabajoSeguroData) {
            const atsd = await AnalisisTrabajoSeguroData.findOne({ user: userId }).lean();
            if (atsd && atsd.pasos) {
                context += `- TAREAS DE ALTO RIESGO (En ATS): Actividad evaluada: "${atsd.actividad}". Pasos con mayor peligro: ${atsd.pasos.slice(0, 5).map(p => p.descripcion).join(', ')}.\n`;
            }
        }

        // 7. Amenazas (Vulnerabilidad)
        const AnalisisVulnerabilidadData = mongoose.models.AnalisisVulnerabilidadData;
        if (AnalisisVulnerabilidadData) {
            const avd = await AnalisisVulnerabilidadData.findOne({ user: userId }).lean();
            if (avd && avd.formData?.amenazasList) {
                const critical = avd.formData.amenazasList.filter(a => a.nivelAmenaza === 'Inminente' || a.nivelAmenaza === 'Probable');
                if (critical.length > 0) {
                    context += `- AMENAZAS EXTERNAS CRÍTICAS: ${critical.map(a => a.amenaza).join(', ')}.\n`;
                }
            }
        }

        // 8. Matriz de Peligros (GTC45)
        const MatrizPeligrosData = mongoose.models.MatrizPeligrosData;
        if (MatrizPeligrosData) {
            const mpd = await MatrizPeligrosData.findOne({ user: userId }).lean();
            if (mpd && mpd.procesos?.length) {
                let highRiskCount = 0;
                mpd.procesos.forEach(p => {
                    (p.peligros || []).forEach(h => { if (h.nivelRiesgo >= 600) highRiskCount++; });
                });
                context += `- MATRIZ GTC 45: ${mpd.procesos.length} procesos evaluados. Peligros con Nivel de Riesgo I (No Aceptable): ${highRiskCount}.\n`;
            }
        }

    } catch (err) {
        logger.error('[Predictivo] Context aggregation failed:', err.message);
    }
    return context;
}

// ─── ENDPOINT: Get Forecast JSON (For Gauges and UI) ────────────────────────
router.get('/forecast', requireJwtAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const apiKey = await getUserKey(userId, 'google');
        if (!apiKey) return res.status(400).json({ error: 'Falta configurar API Key de Google' });

        const context = await getFullSSTContext(userId);
        
        // Use standard JSON mode if supported, or prompt Engineering
        const prompt = `
Actúa como un Auditor de Riesgos Predictivo Senior con IA. Analiza integralmente los datos cruzados de salud, siniestralidad, ergonomía y reportes de campo de la empresa.
DATOS: ${context}

Genera un pronóstico matemático específico para los próximos 30 días.
Responde estrictamente en formato JSON con esta estructura (SIN texto adicional antes o después):
{
  "overallRisk": 0-100, 
  "criticalArea": "Nombre de cargo o proceso",
  "predictionSummary": "Resumen técnico de 2 frases",
  "indicators": {
    "healthRisk": 0-100,
    "safetyRisk": 0-100,
    "ergonomicRisk": 0-100
  },
  "recommendedActions": ["Acción 1", "Acción 2", "Acción 3"]
}
`;

        const result = await generateWithRetry({ apiKey }, prompt, { responseMimeType: 'application/json' });
        let text = result.response.text().trim();
        // Clean markdown if AI included it
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const forecast = JSON.parse(text);
        res.json(forecast);
    } catch (err) {
        logger.error('[Predictivo] Forecast error:', err.message);
        res.status(500).json({ error: 'No se pudo generar el pronóstico. Verifique su API Key.' });
    }
});

// ─── ENDPOINT: Generate Predictive Report (For LiveEditor) ─────────────────
router.post('/generate-report', requireJwtAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { modelName } = req.body;
        const apiKey = await getUserKey(userId, 'google');
        if (!apiKey) return res.status(400).json({ error: 'Falta API Key de Google' });

        const context = await getFullSSTContext(userId);
        
        const prompt = `
Diseña un INFORME EJECUTIVO DE PREDICCIÓN Y PRONÓSTICO DE RIESGOS SST.
BASES DE DATOS INTEGRADAS: ${context}

EL INFORME DEBE TENER (En HTML profesional con CSS inline):
1. Título: "INFORME TÉCNICO DE INTELIGENCIA PREDICTIVA SST"
2. Resumen Ejecutivo: Probabilidad estadística de accidentes.
3. Cruce de Datos Críticos: Por qué los hallazgos médicos se relacionan con los accidentes pasados.
4. Mapa de Riesgo Proyectado por Cargo.
5. Recomendaciones de Intervención Prioritaria.
6. Glosario Técnico Breve de Predicciones.

Estilo: Fondo blanco, texto azul oscuro (#0f172a), tablas elegantes con bordes redondeados.
NO incluyas <html> ni markdown. Solo el contenido del informe.
`;

        const result = await generateWithRetry({ apiKey, model: modelName }, prompt);
        let aiHtml = result.response.text().trim();
        aiHtml = aiHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

        res.json({ report: aiHtml });
    } catch (err) {
        logger.error('[Predictivo] Report error:', err.message);
        res.status(500).json({ error: 'Error al generar el informe con IA.' });
    }
});

module.exports = router;
