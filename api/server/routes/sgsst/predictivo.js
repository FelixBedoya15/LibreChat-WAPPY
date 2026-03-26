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

// ──// ─── HELPER: Aggregate All SST Context from DB  ──────────────────────────────
async function getFullSSTContext(userId) {
    let fullContext = '\n═══════════════════════════════════════\n   DATOS COMPLETOS DEL ECOSISTEMA SST\n═══════════════════════════════════════\n';
    try {
        // 1. Perfil Sociodemográfico
        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        if (PerfilSociodemograficoData) {
            const psd = await PerfilSociodemograficoData.findOne({ user: userId }).lean();
            if (psd?.trabajadores?.length) {
                fullContext += `\n[MÓDULO 1 - PERFIL SOCIODEMOGRÁFICO]\nTotal trabajadores: ${psd.trabajadores.length}\n`;
                psd.trabajadores.forEach(t => {
                    fullContext += `  • ${t.nombre || 'N/A'} | Cargo: ${t.cargo || 'N/A'} | Edad: ${t.edad || 'N/A'} | Examen: ${t.fechaExamenMedico || 'No'} | Diagnóstico: ${t.diagnosticoMedico || 'Apto'} | Rec: ${t.recomendacionesMedicas || 'Ninguna'}\n`;
                });
            } else fullContext += `\n[MÓDULO 1 - PERFIL SOCIODEMOGRÁFICO] Sin datos.\n`;
        }

        // 2. Estadísticas ATEL
        const ATELAnnualData = mongoose.models.ATELAnnualData;
        if (ATELAnnualData) {
            const ad = await ATELAnnualData.findOne({ user: userId }).lean();
            if (ad?.years) {
                const years = Object.keys(ad.years).sort().reverse();
                fullContext += `\n[MÓDULO 2 - ESTADÍSTICAS ATEL]\n`;
                years.slice(0, 2).forEach(yr => {
                    let totalEvents = 0, totalDays = 0; let eventList = [];
                    Object.entries(ad.years[yr] || {}).forEach(([mes, m]) => {
                        if (m?.events) {
                            totalEvents += m.events.length;
                            m.events.forEach(e => { totalDays += (e.diasIncapacidad || 0); eventList.push(`${mes}: ${e.peligro || 'N'} (${e.tipoEvento || 'N'})`); });
                        }
                    });
                    fullContext += `  Año ${yr}: ${totalEvents} eventos, ${totalDays} días incapacidad. Detalle: ${eventList.slice(0, 10).join(' | ') || 'Sin detalle'}.\n`;
                });
            } else fullContext += `\n[MÓDULO 2 - ESTADÍSTICAS ATEL] Sin historial.\n`;
        }

        // 3. Investigación ATEL
        const InvestigacionAtelData = mongoose.models.InvestigacionAtelData;
        if (InvestigacionAtelData) {
            const investigations = await InvestigacionAtelData.find({ user: userId }).lean();
            if (investigations?.length) {
                fullContext += `\n[MÓDULO 3 - INVESTIGACIONES ATEL] ${investigations.length} invest:\n`;
                investigations.slice(0, 5).forEach(inv => {
                    const f = inv.formData || {};
                    fullContext += `  • Tarea: "${f.tareaAccidente || 'N'}" | Cargo: ${f.cargoAccidentado || 'N'} | Causa: ${f.causasInmediatas || 'N'} | Lesión: ${f.naturalezaLesion || 'N'}.\n`;
                });
            } else fullContext += `\n[MÓDULO 3 - INVESTIGACIONES ATEL] Sin invest.\n`;
        }

        // 4. Actos y Condiciones
        const ReporteActosData = mongoose.models.ReporteActosData;
        if (ReporteActosData) {
            const rad = await ReporteActosData.findOne({ user: userId }).lean();
            if (rad?.reportesList?.length) {
                fullContext += `\n[MÓDULO 4 - ACTOS Y CONDICIONES INSEGURAS] ${rad.reportesList.length} reportes.\n`;
                rad.reportesList.slice(-15).forEach(r => {
                    fullContext += `  • ${r.tipo}: "${r.hallazgo || 'N'}" | Área: ${r.area || 'N'} | Resp: ${r.responsable || 'N'} | Est: ${r.estado || 'N'}\n`;
                });
            } else fullContext += `\n[MÓDULO 4 - ACTOS Y CONDICIONES INSEGURAS] Sin reportes.\n`;
        }

        // 5. Ergonomía OWAS
        const MetodoOwasData = mongoose.models.MetodoOwasData;
        if (MetodoOwasData) {
            const owas = await MetodoOwasData.findOne({ user: userId }).lean();
            if (owas?.resultados?.length) {
                fullContext += `\n[MÓDULO 5 - ERGONOMÍA OWAS]\n`;
                owas.resultados.forEach(r => {
                    fullContext += `  • Tarea: "${r.faseTarea || 'N'}" | Riesgo OWAS: ${r.categoriaRiesgo || 'N'} | Acción: ${r.accionRequerida || 'N'} | Cargo: ${owas.cargo || 'N'}\n`;
                });
            } else fullContext += `\n[MÓDULO 5 - ERGONOMÍA OWAS] Sin posturas.\n`;
        }

        // 6. ATS
        const AnalisisTrabajoSeguroData = mongoose.models.AnalisisTrabajoSeguroData;
        if (AnalisisTrabajoSeguroData) {
            const ats = await AnalisisTrabajoSeguroData.findOne({ user: userId }).lean();
            if (ats?.pasos) {
                fullContext += `\n[MÓDULO 6 - ATS] Actividad: "${ats.actividad || 'N'}"\n`;
                ats.pasos.slice(0, 8).forEach(p => {
                    fullContext += `  • Paso: "${p.descripcion || 'N'}" | Peligro: ${p.peligro || 'N'}\n`;
                });
            } else fullContext += `\n[MÓDULO 6 - ATS] Sin ATS.\n`;
        }

        // 7. Vulnerabilidad
        const AnalisisVulnerabilidadData = mongoose.models.AnalisisVulnerabilidadData;
        if (AnalisisVulnerabilidadData) {
            const avd = await AnalisisVulnerabilidadData.findOne({ user: userId }).lean();
            const amenazas = avd?.formData?.amenazasList || avd?.amenazasList || [];
            if (amenazas.length) {
                fullContext += `\n[MÓDULO 7 - VULNERABILIDAD]\n`;
                amenazas.forEach(a => {
                    fullContext += `  • Amenaza: "${a.amenaza || 'N'}" | Nivel: ${a.nivelAmenaza || 'N'}\n`;
                });
            } else fullContext += `\n[MÓDULO 7 - VULNERABILIDAD] Sin amenazas.\n`;
        }

        // 8. Matriz GTC 45
        const MatrizPeligrosData = mongoose.models.MatrizPeligrosData;
        if (MatrizPeligrosData) {
            const mpd = await MatrizPeligrosData.findOne({ user: userId }).lean();
            if (mpd?.procesos?.length) {
                fullContext += `\n[MÓDULO 8 - MATRIZ GTC 45]\n`;
                let tP = 0, rI = 0, rII = 0;
                mpd.procesos.forEach(p => {
                    (p.peligros || []).forEach(h => {
                        tP++;
                        const n = h.nivelRiesgo >= 600 ? 'I' : h.nivelRiesgo >= 150 ? 'II' : 'III';
                        if (n === 'I') rI++; else if (n === 'II') rII++;
                        fullContext += `  • Proc: ${p.proceso} | Peligro: "${h.descripcionPeligro || 'N'}" | NR=${h.nivelRiesgo || 0} (${n}) | Acept: ${h.aceptabilidad || '-'}\n`;
                    });
                });
                fullContext += `  RESUMEN: ${tP} peligros | Nivel I: ${rI} | Nivel II: ${rII}\n`;
            } else fullContext += `\n[MÓDULO 8 - MATRIZ GTC 45] Sin peligros.\n`;
        }

    } catch (err) {
        logger.error('[Predictivo] Context aggregation failed:', err.message);
    }
    return fullContext;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ENDPOINT: Get Forecast JSON (For Gauges and UI) ─────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/forecast', requireJwtAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        let totalWorkers = 0, sickWorkers = 0;
        let totalHazardsI_II = 0, totalHazards = 0;
        let totalOwasHigh = 0, totalOwas = 0;
        let totalActsConds = 0;
        let totalATEL = 0;
        let totalATS = 0;
        let totalVulnerabilidades = 0;
        let criticalAreasMap = {};
        
        try {
            const pData = mongoose.models.PerfilSociodemograficoData;
            if (pData) {
                const doc = await pData.findOne({ user: userId }).lean();
                if (doc?.trabajadores?.length) {
                    totalWorkers = doc.trabajadores.length;
                    doc.trabajadores.forEach(t => {
                        if (t.diagnosticoMedico && t.diagnosticoMedico !== 'Apto / Sin Hallazgos' && t.diagnosticoMedico !== 'Apto') {
                            sickWorkers++;
                            if (t.cargo) criticalAreasMap[t.cargo] = (criticalAreasMap[t.cargo] || 0) + 1;
                        }
                    });
                }
            }
            
            const mData = mongoose.models.MatrizPeligrosData;
            if (mData) {
                const doc = await mData.findOne({ user: userId }).lean();
                if (doc?.procesos?.length) {
                    doc.procesos.forEach(p => {
                        (p.peligros || []).forEach(h => {
                            totalHazards++;
                            if (h.nivelRiesgo >= 150) { 
                                totalHazardsI_II++;
                                if (p.proceso) criticalAreasMap[p.proceso] = (criticalAreasMap[p.proceso] || 0) + 2;
                            }
                        });
                    });
                }
            }
            
            const oData = mongoose.models.MetodoOwasData;
            if (oData) {
                const doc = await oData.findOne({ user: userId }).lean();
                if (doc?.resultados?.length) {
                    doc.resultados.forEach(r => {
                        totalOwas++;
                        if (r.categoriaRiesgo >= 3) totalOwasHigh++;
                    });
                }
            }
            
            const rData = mongoose.models.ReporteActosData;
            if (rData) {
                const doc = await rData.findOne({ user: userId }).lean();
                if (doc?.reportesList) {
                    totalActsConds = doc.reportesList.filter(r => r.estado !== 'Cerrado').length;
                }
            }

            const atelData = mongoose.models.InvestigacionAtelData;
            if (atelData) {
                const docs = await atelData.find({ user: userId }).lean();
                if (docs && docs.length > 0) {
                    totalATEL = docs.length;
                    docs.forEach(doc => {
                        const formData = doc.formData || {};
                        if (formData.cargoAccidentado) {
                            criticalAreasMap[formData.cargoAccidentado] = (criticalAreasMap[formData.cargoAccidentado] || 0) + 3; // Higheest weight!
                        }
                    });
                }
            }

            const atsData = mongoose.models.AnalisisTrabajoSeguroData;
            if (atsData) {
                const doc = await atsData.findOne({ user: userId }).lean();
                if (doc?.pasos?.length) {
                    totalATS = doc.pasos.length;
                }
            }

            const vulData = mongoose.models.AnalisisVulnerabilidadData;
            if (vulData) {
                const doc = await vulData.findOne({ user: userId }).lean();
                const amenazas = doc?.formData?.amenazasList || doc?.amenazasList || [];
                if (amenazas.length) {
                    totalVulnerabilidades = amenazas.length;
                }
            }

        } catch(e) { 
            logger.error('[Predictivo] DB Aggregation Error:', e.message); 
        }
        
        let healthRisk = totalWorkers > 0 ? Math.min(100, Math.round((sickWorkers / totalWorkers) * 100 * 2)) : 0;
        let healthEvidence = sickWorkers > 0 
            ? `Calculado sobre ${sickWorkers} casos médicos activos de un total de ${totalWorkers} trabajadores (Perfil Sociodemográfico).` 
            : `Sin hallazgos clínicos críticos en ${totalWorkers} trabajadores.`;

        let safetyRisk = totalHazards > 0 ? Math.min(100, Math.round((totalHazardsI_II / totalHazards) * 100 * 1.5)) : 0;
        if (totalActsConds > 0) safetyRisk = Math.min(100, safetyRisk + (totalActsConds * 5));
        if (totalATEL > 0) safetyRisk = Math.min(100, safetyRisk + (totalATEL * 15));
        
        let safetyEvidence = [];
        if (totalHazardsI_II > 0) safetyEvidence.push(`${totalHazardsI_II} peligros Nivel I/II (GTC 45)`);
        if (totalActsConds > 0) safetyEvidence.push(`${totalActsConds} actos inseguros abiertos`);
        if (totalATEL > 0) safetyEvidence.push(`${totalATEL} investigaciones ATEL recientes`);
        if (totalATS > 0) safetyEvidence.push(`${totalATS} pasos de alto riesgo en ATS`);
        if (totalVulnerabilidades > 0) safetyEvidence.push(`${totalVulnerabilidades} escenarios de vulnerabilidad activa`);

        let safetyEvidenceText = safetyEvidence.length > 0 
            ? `Cruce de datos: ${safetyEvidence.join(' / ')}.`
            : `Condiciones operativas estables en Matriz GTC 45 y Seguridad Industrial.`;

        let ergonomicRisk = totalOwas > 0 ? Math.min(100, Math.round((totalOwasHigh / totalOwas) * 100 * 1.5)) : 0;
        if (ergonomicRisk === 0 && sickWorkers > 0) ergonomicRisk = Math.floor(healthRisk / 2);
        
        let ergonomicEvidence = totalOwasHigh > 0
            ? `Identificadas ${totalOwasHigh} posturas de Riesgo Nivel 3 y 4 (Método OWAS).`
            : (totalOwas > 0 ? `Analizadas ${totalOwas} posturas operativas bajo control.` : `Nivel basal proyectado desde Perfil Sociodemográfico.`);

        let overallRisk = Math.round((healthRisk + safetyRisk + ergonomicRisk) / 3);
        if (overallRisk === 0 && (totalWorkers > 0 || totalHazards > 0 || totalVulnerabilidades > 0)) {
            overallRisk = 12; // Base sub-record risk
            safetyRisk = totalVulnerabilidades > 0 ? 25 : 15;
            healthRisk = 10;
        }

        let criticalArea = "SISTEMA GENERAL";
        let maxCount = 0;
        for (const [area, count] of Object.entries(criticalAreasMap)) {
            if (count > maxCount) { maxCount = count; criticalArea = area; }
        }

        let predictionSummary = "Evaluación determinística en tiempo real cruzando múltiples bases de datos institucionales. ";
        if (overallRisk < 20) predictionSummary += "Riesgo proyectado bajo. Monitoreo pasivo recomendado (posible subregistro en Actos/Condiciones). ";
        else if (overallRisk < 50) predictionSummary += `Volumen controlable de incidentes vaticinados. El principal vector de intervención estructural recae en la sección de: ${criticalArea}. `;
        else predictionSummary += `ALERTA DE CONTINGENCIA ORQUESTADA EN: ${criticalArea}. La correlación de investigaciones ATEL, hallazgos médicos y severos peligros GTC-45 sugieren inevitabilidad de siniestro a corto plazo. `;
        
        res.json({
            overallRisk,
            criticalArea,
            predictionSummary,
            indicators: { healthRisk, safetyRisk, ergonomicRisk },
            evidence: {
                healthEvidence,
                safetyEvidence: safetyEvidenceText,
                ergonomicEvidence
            },
            recommendedActions: [
                "Control y ejecución de intervenciones prioritarias detectadas en la Matriz GTC 45",
                "Seguimiento epidemiológico a la población con diagnósticos activos y reestructuración de perfiles",
                "Verificación y corrección de las posturas críticas categorizadas por OWAS en el marco de ingeniería del puesto",
                "Cierre inmediato de los actos, condiciones inseguras abiertas e investigaciones ATEL (Accidentes/Incidentes)"
            ]
        });
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

        // Use the newly shared deep context block
        const fullContext = await getFullSSTContext(userId);

        const promptText = `Eres un Experto Consultor Estratégico Senior en Seguridad y Salud en el Trabajo (SGSST) en Colombia. Dominas la GTC 45, el Decreto 1072 de 2015, la Resolución 0312 de 2019 y el análisis predictivo de riesgo laboral.

Has sido contratado para producir el INFORME TÉCNICO DE INTELIGENCIA PREDICTIVA SST más completo, denso y específico que esta empresa haya recibido jamás. Tienes acceso a los datos REALES de todos los módulos del sistema.

${fullContext}

═══════════════════════════════════════
      TU TAREA: INFORME EJECUTIVO
═══════════════════════════════════════

Produce un INFORME EXTENSO, ESPECÍFICO, DENSO Y TÉCNICO. NO uses frases genéricas. Cada afirmación debe basarse en los datos reales anteriores. Menciona nombres de cargos, diagnósticos específicos, hallazgos concretos.

**ESTRUCTURA EXACTA (7 secciones, cada una extensa y con datos reales):**

──── SECCIÓN 1: TABLERO DE INDICADORES PREDICTIVOS (Gráficos Textuales Obligatorios) ────
Genera una TABLA HTML visual (sin 'striped' class) que funcione como un Cuadro de Mando Integrado, que resuma estrictamente los hallazgos de todo el reporte.
Ejemplo de estructura (hazla más elegante con CSS inline, colores y padding, pero respetando las normas de no-oscuro):
| Indicador Predictivo | Nivel de Riesgo (%) | Justificación (Evidencia de BD) |
| --- | --- | --- |
| Riesgo de Siniestro (General) | [Valor Real] | [Conclusión / Área Crítica] |
| Salud Operacional | [Valor Real] | [Hallazgos Clínicos] |
| Seguridad Física | [Valor Real] | [Actos/Condiciones, ATEL, ATS] |
| Biomecánica (OWAS) | [Valor Real] | [Posturas Críticas] |

──── SECCIÓN 2: RESUMEN EJECUTIVO DE RIESGO PROYECTADO (30 días) ────
- Mínimo 4-5 párrafos. NO repitas los números crudos sin interpretar.
- Analiza la probabilidad real de accidente o enfermedad laboral en los próximos 30 días, basado en los datos de todos los módulos.
- Interpreta la siniestralidad (o su ausencia) como señal de posible subregistro o sesgo de supervivencia.
- Conecta los diagnósticos médicos reales del perfil sociodemográfico con los riesgos de la matriz GTC 45.
- Comenta el nivel de riesgo de la ARL vs. los riesgos reales encontrados.

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

═══════════════════════════════════════
      NORMAS DE FORMATO (CRÍTICO)
═══════════════════════════════════════
- **SOLO CÓDIGO HTML VÁLIDO.** Sin etiquetas <html>, <body> ni markdown. Sin \`\`\`html.
- **PROHIBIDO INCLUIR FIRMAS.** NO incluyas bajo ninguna circunstancia tablas de firmas, espacios para firmar, nombres de representantes o responsables SST al final del documento. El sistema WAPPY añadirá las firmas oficiales automáticamente. Si incluyes firmas, arruinarás el documento.
- **CSS INLINE OBLIGATORIO.** Usa exclusivamente atributos \`style\`. NO uses clases de Tailwind ni clases CSS.
- **PRECAUCIÓN MODO OSCURO:** Todo texto debe tener \`color\` explícito.
- **Contenedores:** \`width: 100%; box-sizing: border-box;\`.
- **Cada vez** que apliques \`background-color\` a un tr, td o div, DEBES también especificar \`color\` explícito (\`color: #000;\` si el fondo es claro).
- **TABLAS:** Nunca uses colores intercalados (striped). Tablas simples con \`border-collapse: separate\`. DEBEN ir OBLIGATORIAMENTE envueltas en un \`<div style="overflow-x: auto; width: 100%; padding-bottom: 15px;">\`.
- **Estilos Tablas:** \`<table style="width: 100%; table-layout: auto; word-wrap: break-word; border-collapse: separate; border-spacing: 0; border-radius: 12px; border: 1px solid #ddd;">\`. TH: \`background-color: #0f766e; color: white; padding: 12px;\`. TD: \`padding: 10px; border-bottom: 1px solid #e2e8f0;\`.
- **SECCIONES:** Usa cajas con \`border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 24px;\`.
- **Barras:** Un div externo \`background-color: #e2e8f0; border-radius: 8px; height: 28px;\` con un div interno \`background-color: #0f766e; color: white; border-radius: 8px; height: 100%; display: flex; align-items: center; padding-left: 10px; font-size: 13px; font-weight: bold;\` con \`width: XX%\`.
- NO incluyas título H1 (ya está en el encabezado del sistema).`;

        const personalization = req.user?.personalization?.geminiModels;
        const preferredModel = personalization?.sstManagement || 'gemini-3.1-flash-lite-preview';
        const finalModelName = modelName || preferredModel;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: finalModelName });

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

