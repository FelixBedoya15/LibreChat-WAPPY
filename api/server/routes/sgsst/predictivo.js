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
        const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

        // Build header HTML (same as estadisticas, diagnostico, etc.)
        const headerHTML = buildStandardHeader({
            title: 'INFORME TÉCNICO DE INTELIGENCIA PREDICTIVA SST',
            companyInfo: ci,
            date: fecha,
            norm: 'Decreto 1072 de 2015 / Resolución 0312 de 2019',
        });

        // ─── Build FULL rich context with all detail ───────────────────────
        let fullContext = '\n═══════════════════════════════════════\n   DATOS COMPLETOS DEL ECOSISTEMA SST\n═══════════════════════════════════════\n';

        try {
            // 1. Perfil Sociodemográfico (full detail per worker)
            const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
            if (PerfilSociodemograficoData) {
                const psd = await PerfilSociodemograficoData.findOne({ user: userId }).lean();
                if (psd?.trabajadores?.length) {
                    fullContext += `\n[MÓDULO 1 - PERFIL SOCIODEMOGRÁFICO]\n`;
                    fullContext += `Total trabajadores: ${psd.trabajadores.length}\n`;
                    psd.trabajadores.forEach(t => {
                        fullContext += `  • ${t.nombre || 'N/A'} | Cargo: ${t.cargo || 'N/A'} | Edad: ${t.edad || 'N/A'} | Género: ${t.genero || 'N/A'} | Escolaridad: ${t.nivelEscolaridad || 'N/A'} | Examen Médico: ${t.fechaExamenMedico || 'No registrado'} | Diagnóstico: ${t.diagnosticoMedico || 'Apto / Sin Hallazgos'} | Recomendaciones: ${t.recomendacionesMedicas || 'Ninguna'}\n`;
                    });
                } else {
                    fullContext += `\n[MÓDULO 1 - PERFIL SOCIODEMOGRÁFICO] Sin datos registrados.\n`;
                }
            }

            // 2. Estadísticas ATEL
            const ATELAnnualData = mongoose.models.ATELAnnualData;
            if (ATELAnnualData) {
                const ad = await ATELAnnualData.findOne({ user: userId }).lean();
                if (ad?.years) {
                    const years = Object.keys(ad.years).sort().reverse();
                    fullContext += `\n[MÓDULO 2 - ESTADÍSTICAS ATEL]\n`;
                    years.slice(0, 2).forEach(yr => {
                        let totalEvents = 0, totalDays = 0;
                        let eventList = [];
                        Object.entries(ad.years[yr] || {}).forEach(([mes, m]) => {
                            if (m?.events) {
                                totalEvents += m.events.length;
                                m.events.forEach(e => { totalDays += (e.diasIncapacidad || 0); eventList.push(`${mes}: ${e.peligro || 'N/A'} (${e.tipoEvento || 'N/A'})`); });
                            }
                        });
                        fullContext += `  Año ${yr}: ${totalEvents} eventos, ${totalDays} días incapacidad. Detalle: ${eventList.slice(0, 10).join(' | ') || 'Sin detalle'}.\n`;
                    });
                } else {
                    fullContext += `\n[MÓDULO 2 - ESTADÍSTICAS ATEL] Sin historial de eventos registrado. Siniestralidad cero o sin datos.\n`;
                }
            }

            // 3. Investigación ATEL
            const InvestigacionAtelData = mongoose.models.InvestigacionAtelData;
            if (InvestigacionAtelData) {
                const investigations = await InvestigacionAtelData.find({ user: userId }).lean();
                if (investigations?.length) {
                    fullContext += `\n[MÓDULO 3 - INVESTIGACIONES ATEL] ${investigations.length} investigaciones:\n`;
                    investigations.slice(0, 5).forEach(inv => {
                        const f = inv.formData || {};
                        fullContext += `  • Evento: "${f.tareaAccidente || 'N/A'}" | Cargo: ${f.cargoAccidentado || 'N/A'} | Causa Inmediata: ${f.causasInmediatas || 'N/A'} | Causa Básica: ${f.causasBasicas || 'N/A'} | Lesión: ${f.naturalezaLesion || 'N/A'}.\n`;
                    });
                } else {
                    fullContext += `\n[MÓDULO 3 - INVESTIGACIONES ATEL] Sin investigaciones registradas.\n`;
                }
            }

            // 4. Actos y Condiciones Inseguras
            const ReporteActosData = mongoose.models.ReporteActosData;
            if (ReporteActosData) {
                const rad = await ReporteActosData.findOne({ user: userId }).lean();
                if (rad?.reportesList?.length) {
                    const acts = rad.reportesList.filter(r => r.tipo === 'Acto Inseguro');
                    const conds = rad.reportesList.filter(r => r.tipo === 'Condición Insegura');
                    fullContext += `\n[MÓDULO 4 - ACTOS Y CONDICIONES INSEGURAS]\n`;
                    fullContext += `  Total: ${rad.reportesList.length} reportes (${acts.length} actos inseguros, ${conds.length} condiciones inseguras).\n`;
                    rad.reportesList.slice(-15).forEach(r => {
                        fullContext += `  • ${r.tipo}: "${r.hallazgo || 'N/A'}" | Área: ${r.area || 'N/A'} | Responsable: ${r.responsable || 'N/A'} | Estado: ${r.estado || 'N/A'}\n`;
                    });
                } else {
                    fullContext += `\n[MÓDULO 4 - ACTOS Y CONDICIONES INSEGURAS] Sin reportes de campo. Posible subregistro.\n`;
                }
            }

            // 5. Ergonomía OWAS
            const MetodoOwasData = mongoose.models.MetodoOwasData;
            if (MetodoOwasData) {
                const owas = await MetodoOwasData.findOne({ user: userId }).lean();
                if (owas?.resultados?.length) {
                    fullContext += `\n[MÓDULO 5 - ERGONOMÍA - MÉTODO OWAS]\n`;
                    owas.resultados.forEach(r => {
                        fullContext += `  • Tarea: "${r.faseTarea || 'N/A'}" | Cat. Riesgo OWAS: ${r.categoriaRiesgo || 'N/A'} | Acción Requerida: ${r.accionRequerida || 'N/A'} | Trabajadores: ${owas.numTrabajadores || 'N/A'} | Cargo: ${owas.cargo || 'N/A'}\n`;
                    });
                } else {
                    fullContext += `\n[MÓDULO 5 - ERGONOMÍA OWAS] Sin evaluaciones posturales registradas.\n`;
                }
            }

            // 6. ATS
            const AnalisisTrabajoSeguroData = mongoose.models.AnalisisTrabajoSeguroData;
            if (AnalisisTrabajoSeguroData) {
                const ats = await AnalisisTrabajoSeguroData.findOne({ user: userId }).lean();
                if (ats?.pasos) {
                    fullContext += `\n[MÓDULO 6 - ANÁLISIS DE TRABAJO SEGURO (ATS)]\n`;
                    fullContext += `  Actividad: "${ats.actividad || 'N/A'}" | Responsable: ${ats.responsable || 'N/A'}\n`;
                    (ats.pasos || []).slice(0, 8).forEach(p => {
                        fullContext += `  • Paso: "${p.descripcion || 'N/A'}" | Peligro: ${p.peligro || 'N/A'} | Control: ${p.control || 'N/A'}\n`;
                    });
                } else {
                    fullContext += `\n[MÓDULO 6 - ATS] Sin datos de análisis de trabajo seguro.\n`;
                }
            }

            // 7. Vulnerabilidad
            const AnalisisVulnerabilidadData = mongoose.models.AnalisisVulnerabilidadData;
            if (AnalisisVulnerabilidadData) {
                const avd = await AnalisisVulnerabilidadData.findOne({ user: userId }).lean();
                const amenazas = avd?.formData?.amenazasList || avd?.amenazasList || [];
                if (amenazas.length) {
                    fullContext += `\n[MÓDULO 7 - ANÁLISIS DE VULNERABILIDAD]\n`;
                    amenazas.forEach(a => {
                        fullContext += `  • Amenaza: "${a.amenaza || 'N/A'}" | Origen: ${a.origenAmenaza || 'N/A'} | Nivel: ${a.nivelAmenaza || 'N/A'} | Riesgo Global: ${a.riskLevel || 'N/A'}\n`;
                    });
                } else {
                    fullContext += `\n[MÓDULO 7 - VULNERABILIDAD] Sin amenazas registradas.\n`;
                }
            }

            // 8. Matriz de Peligros GTC45 (full hazard list)
            const MatrizPeligrosData = mongoose.models.MatrizPeligrosData;
            if (MatrizPeligrosData) {
                const mpd = await MatrizPeligrosData.findOne({ user: userId }).lean();
                if (mpd?.procesos?.length) {
                    fullContext += `\n[MÓDULO 8 - MATRIZ DE PELIGROS GTC 45]\n`;
                    let totalP = 0, rI = 0, rII = 0, rIII = 0;
                    mpd.procesos.forEach(p => {
                        (p.peligros || []).forEach(h => {
                            totalP++;
                            const nivel = h.nivelRiesgo >= 600 ? 'I' : h.nivelRiesgo >= 150 ? 'II' : h.nivelRiesgo >= 40 ? 'III' : 'IV';
                            if (nivel === 'I') rI++; else if (nivel === 'II') rII++; else if (nivel === 'III') rIII++;
                            fullContext += `  • Proceso: ${p.proceso} | Peligro: "${h.descripcionPeligro || 'N/A'}" | Clasificación: ${h.clasificacion || '-'} | NR=${h.nivelRiesgo || 0} (Nivel ${nivel}) | Aceptabilidad: ${h.aceptabilidad || '-'} | Efectos: ${h.efectosPosibles || '-'}\n`;
                        });
                    });
                    fullContext += `  RESUMEN: ${totalP} peligros | Nivel I: ${rI} | Nivel II: ${rII} | Nivel III: ${rIII}\n`;
                } else {
                    fullContext += `\n[MÓDULO 8 - MATRIZ GTC 45] Sin datos de peligros registrados.\n`;
                }
            }
        } catch (ctxErr) {
            logger.error('[Predictivo] Full context build error:', ctxErr.message);
        }

        const promptText = `Eres un Experto Consultor Estratégico Senior en Seguridad y Salud en el Trabajo (SGSST) en Colombia. Dominas la GTC 45, el Decreto 1072 de 2015, la Resolución 0312 de 2019 y el análisis predictivo de riesgo laboral.

Has sido contratado para producir el INFORME TÉCNICO DE INTELIGENCIA PREDICTIVA SST más completo, denso y específico que esta empresa haya recibido jamás. Tienes acceso a los datos REALES de todos los módulos del sistema.

${fullContext}

═══════════════════════════════════════
      TU TAREA: INFORME EJECUTIVO
═══════════════════════════════════════

Produce un INFORME EXTENSO, ESPECÍFICO, DENSO Y TÉCNICO. NO uses frases genéricas. Cada afirmación debe basarse en los datos reales anteriores. Menciona nombres de cargos, diagnósticos específicos, hallazgos concretos.

**ESTRUCTURA EXACTA (7 secciones, cada una extensa y con datos reales):**

──── SECCIÓN 1: RESUMEN EJECUTIVO DE RIESGO PROYECTADO (30 días) ────
- Mínimo 4-5 párrafos. NO repitas los números crudos sin interpretar.
- Analiza la probabilidad real de accidente o enfermedad laboral en los próximos 30 días, basado en los datos de todos los módulos.
- Interpreta la siniestralidad (o su ausencia) como señal de posible subregistro o sesgo de supervivencia.
- Conecta los diagnósticos médicos reales del perfil sociodemográfico con los riesgos de la matriz GTC 45.
- Comenta el nivel de riesgo de la ARL vs. los riesgos reales encontrados.

──── SECCIÓN 2: TABLERO DE INDICADORES PREDICTIVOS ────
Genera tarjetas visuales HTML (una por indicador) mostrando:
• Riesgo General de Accidente / Siniestro (%)
• Riesgo de Enfermedad Laboral / Vigilancia Salud (%)
• Riesgo de Seguridad Física (%)
• Riesgo Ergonómico / Biomecánico (%)
• Riesgo Psicosocial (%)
Los porcentajes deben derivarse lógicamente de los datos reales (diagnósticos, peligros GTC 45, OWAS, subregistro). Explica brevemente bajo cada tarjeta por qué ese %.

──── SECCIÓN 3: ANÁLISIS DE CORRELACIÓN PROFUNDA (CRUCE DE MÓDULOS) ────
- Múltiples párrafos, uno por cada correlación encontrada.
- Cruza: diagnósticos clínicos (perfil sociodemográfico) ↔ peligros GTC 45 del mismo tipo de riesgo.
- Cruza: ausencia de reportes de actos/condiciones (módulo 4) ↔ cantidad de peligros identificados en GTC 45 → posible cultura de subregistro.
- Cruza: resultados OWAS ↔ diagnósticos ergonómicos del perfil.
- Cruza: investigaciones ATEL (causas raíz) ↔ controles existentes en ATS y GTC 45.
- Identifica PATRONES OCULTOS: qué cargos o áreas concentran múltiples señales de riesgo convergentes.
- Menciona explícitamente los nombres de cargos y los diagnósticos/peligros específicos.

──── SECCIÓN 4: FACTORES DE RIESGO - PROYECCIÓN (Gráfica de Barras HTML) ────
Genera una gráfica de barras horizontales usando DIVs con CSS inline. Mínimo 6 factores de riesgo.
Cada barra: [Nombre del Factor] con su porcentaje y una barra visual coloreada.
Los porcentajes deben derivarse de los datos reales.

──── SECCIÓN 5: ANÁLISIS POR CARGO/PROCESO (Radar de Vulnerabilidad) ────
Para cada cargo/proceso identificado en los datos (especialmente los que aparecen en múltiples módulos), genera una mini-tarjeta con:
• Nombre del Cargo/Proceso
• Señales de riesgo convergentes: diagnóstico médico + peligros GTC 45 + hallazgos OWAS/ATS
• Nivel de vulnerabilidad estimado: CRÍTICO / ALTO / MEDIO / BAJO
• Razón técnica de la clasificación

──── SECCIÓN 6: PLAN PRESCRIPTIVO DE ACCIÓN INMEDIATA ────
Tabla completa y detallada con columnas:
| # | Factor de Riesgo | Cargo/Proceso Afectado | Evidencia (Módulo Origen) | Acción Recomendada | Prioridad | Plazo Sugerido |
- Mínimo 8-10 filas, específicas y basadas en datos reales.
- Las acciones deben ser concretas: "Evaluación ergonómica del puesto del Operario", "Implementar Programa de Vigilancia Epidemiológica en DME", etc.
- Prioridad: Inmediata (< 15 días) / Corto Plazo (15-30 días) / Medio Plazo (1-3 meses).

──── SECCIÓN 7: CONCLUSIÓN Y CUMPLIMIENTO LEGAL ────
- Explica las consecuencias legales concretas (sanciones del Ministerio del Trabajo, Res. 0312 Art. 25, responsabilidad patronal).
- Menciona qué módulos presentan mayor riesgo de incumplimiento normativo.
- Concluye con una recomendación estratégica de inversión en SST vs. costo de sanciones.

══════════════════════════════════════
      NORMAS DE FORMATO (CRÍTICO)
══════════════════════════════════════
- **SOLO CÓDIGO HTML VÁLIDO.** Sin etiquetas <html>, <body> ni markdown. Sin \`\`\`html.
- **CSS INLINE OBLIGATORIO.** Sin clases Tailwind ni CSS externo.
- **MODO OSCURO:** Todo texto necesita color explícito: texto \`color: #1e293b;\`, títulos H2/H3 \`color: #0f766e;\`.
- **Tarjetas (cards):** \`width: 100%; box-sizing: border-box; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);\`.
- **Tablas:** \`width: 100%; min-width: 700px; border-collapse: separate; border-spacing: 0; border-radius: 12px; border: 1px solid #ddd;\`. TH: \`background-color: #0f766e; color: white; padding: 12px;\`. TD: \`padding: 10px; border-bottom: 1px solid #e2e8f0;\`.
- **Barras:** Un div externo \`background-color: #e2e8f0; border-radius: 8px; height: 28px;\` con un div interno \`background-color: #0f766e; color: white; border-radius: 8px; height: 100%; display: flex; align-items: center; padding-left: 10px; font-size: 13px; font-weight: bold;\` con \`width: XX%\`.
- NO incluyas título H1 (ya está en el encabezado del sistema).`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3.1-flash-lite-preview' });

        const result = await generateWithRetry(model, promptText);
        const text = result.response.text();

        let cleanedReport = cleanHtmlOutput(text);

        // Prepend header + wrap in container
        let fullReport = `${headerHTML}\n<div style="margin-top: 32px; font-family: sans-serif;">\n${cleanedReport}\n</div>`;

        // Add signature section (same as all other apps)
        if (ci) {
            fullReport += buildSignatureSection(ci);
        }

        res.json({ report: fullReport });

    } catch (error) {
        logger.error('[Predictivo] Report error:', error);
        res.status(500).json({ error: `Error: ${error.message}` });
    }
});

module.exports = router;

