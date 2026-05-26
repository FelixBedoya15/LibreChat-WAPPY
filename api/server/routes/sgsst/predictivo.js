const express = require('express');
const { generateWithKeyRotation, resolveApiKeys } = require('./sgsstGemini');
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

// ─── HELPER: Clean HTML Output (Same as estadisticas.js) ────────────────────
function cleanHtmlOutput(text) {
    return text.replace(/```html\n?/g, '').replace(/```\n?/g, '')
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
        .replace(/<head>[\s\S]*?<\/head>/gi, '')
        .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
        .trim();
}

// ── Helper: Obtener Empresa Activa
async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

// ─── HELPER: Aggregate All SST Context from DB (Hito 1 to 4) ──────────────────
async function getFullSSTContext(userId, companyId) {
    let fullContext = '\n═══════════════════════════════════════\n   DATOS COMPLETOS DEL ECOSISTEMA SST (HITOS 1 - 4)\n═══════════════════════════════════════\n';
    try {
        // ─── HITO 1: HUELLA BIOCÉNTRICA ───
        // 1. Perfil Sociodemográfico & Oráculo H1
        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        if (PerfilSociodemograficoData) {
            const psd = await PerfilSociodemograficoData.findOne({ user: userId, companyId }).lean();
            if (psd?.trabajadores?.length) {
                fullContext += `\n[HITO 1 - PERFIL SOCIODEMOGRÁFICO Y ORÁCULO H1]\n`;
                fullContext += `Total trabajadores registrados: ${psd.trabajadores.length}\n`;
                psd.trabajadores.forEach(t => {
                    fullContext += `  • Trabajador: ${t.nombre || 'N/A'} | Cargo: ${t.cargo || 'N/A'} | Edad: ${t.edad || 'N/A'} | Diagnóstico: ${t.diagnosticoMedico || 'Apto'} | Rec: ${t.recomendacionesMedicas || 'Ninguna'} | Score H1 Fit: ${t.biocentricScore !== undefined ? t.biocentricScore + '%' : 'N/A'} | IA Tags H1: ${(t.bioTagsIA || []).join(', ') || 'Sin Hallazgos'} | Dictamen H1: ${t.dictamenPredictivoH1 ? 'Generado y guardado permanentemente ✅' : 'Pendiente'}\n`;
                });
            } else fullContext += `\n[HITO 1 - PERFIL SOCIODEMOGRÁFICO Y ORÁCULO H1] Sin datos de trabajadores registrados.\n`;
        }

        // ─── HITO 2: NÚCLEO BIO-EVALUATIVO ───
        // 2. Matriz Bio-IPEVAR / GTC-45
        const MatrizPeligrosData = mongoose.models.MatrizPeligrosData;
        if (MatrizPeligrosData) {
            const mpd = await MatrizPeligrosData.findOne({ user: userId, companyId }).lean();
            if (mpd?.procesos?.length) {
                fullContext += `\n[HITO 2 - MATRIZ DE RIESGOS BIO-IPEVAR (GTC 45)]\n`;
                let totalPeligros = 0, nivelI = 0, nivelII = 0;
                mpd.procesos.forEach(p => {
                    (p.peligros || []).forEach(h => {
                        totalPeligros++;
                        const nr = h.nivelRiesgo || 0;
                        const cat = nr >= 600 ? 'I (Inaceptable)' : nr >= 150 ? 'II (Crítico)' : 'III/IV (Controlado)';
                        if (nr >= 600) nivelI++;
                        else if (nr >= 150) nivelII++;
                        fullContext += `  • Proceso: ${p.proceso} | Peligro: "${h.descripcionPeligro || 'N'}" | Tipo: ${h.tipoPeligro || 'N'} | NR: ${nr} [Cat ${cat}] | Controles: ${h.controlesExistentes || 'Ninguno'}\n`;
                    });
                });
                fullContext += `  RESUMEN MATRIZ: ${totalPeligros} peligros evaluados | Nivel I (Inaceptable): ${nivelI} | Nivel II (Crítico): ${nivelII}\n`;
            } else fullContext += `\n[HITO 2 - MATRIZ DE RIESGOS BIO-IPEVAR] Sin peligros registrados en la matriz.\n`;
        }

        // ─── HITO 3: DINÁMICA DE EXPOSICIÓN (APLICATIVOS IMPORTANTES DE LA OPERACIÓN) ───
        // 3. Participación IPEVAR Bio-Individual
        const ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData;
        if (ParticipacionIpevarData) {
            const pip = await ParticipacionIpevarData.find({ user: userId, companyId }).lean();
            if (pip?.length) {
                fullContext += `\n[HITO 3 - PARTICIPACIÓN IPEVAR BIO-INDIVIDUAL]\n`;
                pip.slice(0, 10).forEach(p => {
                    fullContext += `  • Trabajador: "${p.workerName || 'N/A'}" | Peligro Percibido: "${p.peligro || 'N/A'}" | Nivel de Miedo: ${p.miedoScore ?? 'N/A'}/10 | Propuesta de Control: "${p.propuestaMejora || 'N/A'}"\n`;
                });
            } else fullContext += `\n[HITO 3 - PARTICIPACIÓN IPEVAR BIO-INDIVIDUAL] Sin registros de participación de trabajadores.\n`;
        }

        // 4. Reporte de Actos y Condiciones Inseguras
        const ReporteActosData = mongoose.models.ReporteActosData;
        if (ReporteActosData) {
            const rad = await ReporteActosData.findOne({ user: userId, companyId }).lean();
            if (rad?.reportesList?.length) {
                fullContext += `\n[HITO 3 - REPORTES DE ACTOS Y CONDICIONES INSEGURAS]\n`;
                const abiertos = rad.reportesList.filter(r => r.estado !== 'Cerrado');
                fullContext += `Total reportes registrados: ${rad.reportesList.length} | Abiertos (Pendientes): ${abiertos.length}\n`;
                rad.reportesList.slice(-10).forEach(r => {
                    fullContext += `  • Tipo: ${r.tipo} | Hallazgo: "${r.hallazgo || 'N'}" | Área: ${r.area || 'N'} | Responsable: ${r.responsable || 'N'} | Estado: ${r.estado || 'Abierto'}\n`;
                });
            } else fullContext += `\n[HITO 3 - REPORTES DE ACTOS Y CONDICIONES INSEGURAS] Sin reportes activos.\n`;
        }

        // 5. Programa de Capacitación SG-SST
        const ProgramaCapacitacionesData = mongoose.models.ProgramaCapacitacionesData;
        if (ProgramaCapacitacionesData) {
            const pcd = await ProgramaCapacitacionesData.findOne({ user: userId, companyId }).lean();
            if (pcd?.temas?.length) {
                fullContext += `\n[HITO 3 - PROGRAMA DE CAPACITACIONES SG-SST]\n`;
                let totalHoras = 0, totalAsistentes = 0;
                pcd.temas.forEach(t => {
                    totalHoras += (t.duracionHoras || 0);
                    totalAsistentes += (t.asistentesReal || 0);
                    fullContext += `  • Tema formativo: "${t.nombre || 'N'}" | Prog: ${t.fechaProgramada || 'N'} | Ejec: ${t.fechaEjecutada || 'No'} | Estado: ${t.estado || 'Planificado'} | Cobertura: ${t.asistentesReal || 0}/${t.asistentesEsperados || 0} asistentes.\n`;
                });
                fullContext += `  RESUMEN FORMATIVO: ${pcd.temas.length} capacitaciones | Total Horas: ${totalHoras}h | Total Asistentes: ${totalAsistentes}\n`;
            } else fullContext += `\n[HITO 3 - PROGRAMA DE CAPACITACIONES] Sin capacitaciones registradas.\n`;
        }

        // 6. Análisis de Trabajo Seguro (ATS)
        const AnalisisTrabajoSeguroData = mongoose.models.AnalisisTrabajoSeguroData;
        if (AnalisisTrabajoSeguroData) {
            const ats = await AnalisisTrabajoSeguroData.findOne({ user: userId, companyId }).lean();
            if (ats?.pasos) {
                fullContext += `\n[HITO 3 - ANÁLISIS DE TRABAJO SEGURO (ATS)]\n`;
                fullContext += `  Actividad Crítica: "${ats.actividad || 'N/A'}" | Equipos Requeridos: "${ats.equiposRequeridos || 'N/A'}"\n`;
                ats.pasos.slice(0, 8).forEach(p => {
                    fullContext += `  • Paso de Tarea: "${p.descripcion || 'N'}" | Peligro de Exposición: "${p.peligro || 'N'}" | Medida de Mitigación: "${p.control || 'Ninguno'}"\n`;
                });
            } else fullContext += `\n[HITO 3 - ANÁLISIS DE TRABAJO SEGURO (ATS)] Sin datos activos registrados.\n`;
        }

        // 7. Permiso de Trabajo en Alturas (Alto Riesgo)
        const PermisoAlturasData = mongoose.models.PermisoAlturasData;
        if (PermisoAlturasData) {
            const pad = await PermisoAlturasData.find({ user: userId, companyId }).lean();
            if (pad?.length) {
                fullContext += `\n[HITO 3 - PERMISOS DE TRABAJO EN ALTURAS]\n`;
                pad.slice(0, 5).forEach(p => {
                    fullContext += `  • Ejecutor/Solicitante: "${p.solicitante || 'N'}" | Altura: ${p.alturaMetros || '?'}m | Vigencia: ${p.vigenciaHoras || '?'}h | EPP: ${(p.eppSeleccionados || []).join(', ') || 'Ninguno'}\n`;
                });
            } else fullContext += `\n[HITO 3 - PERMISOS DE TRABAJO EN ALTURAS] Sin permisos recientes registrados.\n`;
        }

        // 8. Método OWAS (Evaluación Postural Biomecánica)
        const MetodoOwasData = mongoose.models.MetodoOwasData;
        if (MetodoOwasData) {
            const owas = await MetodoOwasData.findOne({ user: userId, companyId }).lean();
            if (owas?.resultados?.length) {
                fullContext += `\n[HITO 3 - EVALUACIÓN POSTURAL OWAS]\n`;
                fullContext += `  Cargo Evaluado: "${owas.cargo || 'N/A'}"\n`;
                owas.resultados.forEach(r => {
                    fullContext += `  • Fase Tarea: "${r.faseTarea || 'N'}" | Categoría OWAS: ${r.categoriaRiesgo || 'N'} (Rango 1-4) | Acción: "${r.accionRequerida || 'N'}"\n`;
                });
            } else fullContext += `\n[HITO 3 - EVALUACIÓN POSTURAL OWAS] Sin mediciones posturales activas.\n`;
        }

        // ─── HITO 4: TRAUMATISMO Y CURACIÓN (SINIESTRALIDAD HISTÓRICA E INVESTIGACIONES) ───
        // 9. Estadísticas ATEL (Siniestralidad e Incapacidades)
        const ATELAnnualData = mongoose.models.ATELAnnualData;
        if (ATELAnnualData) {
            const ad = await ATELAnnualData.findOne({ user: userId, companyId }).lean();
            if (ad?.years) {
                const years = Object.keys(ad.years).sort().reverse();
                fullContext += `\n[HITO 4 - ESTADÍSTICAS ATEL (SINIESTRALIDAD HISTÓRICA)]\n`;
                years.slice(0, 2).forEach(yr => {
                    let totalEvents = 0, totalDays = 0; let eventList = [];
                    Object.entries(ad.years[yr] || {}).forEach(([mes, m]) => {
                        if (m?.events) {
                            totalEvents += m.events.length;
                            m.events.forEach(e => {
                                totalDays += (e.diasIncapacidad || 0);
                                eventList.push(`${mes}: ${e.peligro || 'N/A'} (${e.tipoEvento || 'N/A'}) - ${e.diasIncapacidad || 0} días`);
                            });
                        }
                    });
                    fullContext += `  Año ${yr}: Total ${totalEvents} siniestros, acumulando ${totalDays} días de incapacidad médica laboral.\n  Detalle de eventos: ${eventList.slice(0, 10).join(' | ') || 'Sin registros médicos de incapacidad'}.\n`;
                });
            } else fullContext += `\n[HITO 4 - ESTADÍSTICAS ATEL] Sin historial de incapacidades médicas por ATEL.\n`;
        }

        // 10. Investigaciones ATEL (Análisis de Causa Raíz Forense)
        const InvestigacionAtelData = mongoose.models.InvestigacionAtelData;
        if (InvestigacionAtelData) {
            const investigations = await InvestigacionAtelData.find({ user: userId, companyId }).lean();
            if (investigations?.length) {
                fullContext += `\n[HITO 4 - INVESTIGACIONES DE ACCIDENTES Y ENFERMEDADES (ATEL)]\n`;
                fullContext += `Total eventos investigados forensicamente: ${investigations.length}\n`;
                investigations.slice(0, 5).forEach(inv => {
                    const f = inv.formData || {};
                    fullContext += `  • Trabajador: "${f.nombreAccidentado || 'N/A'}" | Cargo: "${f.cargoAccidentado || 'N/A'}" | Tarea: "${f.tareaAccidente || 'N'}" | Causa Inmediata: "${f.causasInmediatas || 'N'}" | Causa Básica: "${f.causasBasicas || 'N'}" | Naturaleza Lesión: "${f.naturalezaLesion || 'N'}" | Mecanismo: "${f.mecanismoAccidente || 'N'}"\n`;
                });
            } else fullContext += `\n[HITO 4 - INVESTIGACIONES DE ACCIDENTES Y ENFERMEDADES] Sin registros de investigación forense.\n`;
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
        const companyId = await getActiveCompanyId(userId);
        
        let totalWorkers = 0, sickWorkers = 0;
        let totalHazardsI_II = 0, totalHazards = 0;
        let totalOwasHigh = 0, totalOwas = 0;
        let totalActsConds = 0;
        let totalATEL = 0;
        let totalATS = 0;
        let totalVulnerabilidades = 0;
        let totalIpevarHighMiedo = 0;
        let totalAlturasActive = 0;
        let totalCapPendientes = 0;
        let criticalAreasMap = {};
        
        try {
            // Hito 1: Perfil Sociodemográfico & Oráculo H1
            const pData = mongoose.models.PerfilSociodemograficoData;
            if (pData) {
                const doc = await pData.findOne({ user: userId, companyId }).lean();
                if (doc?.trabajadores?.length) {
                    totalWorkers = doc.trabajadores.length;
                    doc.trabajadores.forEach(t => {
                        // Check if low fit in Oráculo Predictivo H1
                        if (t.biocentricScore !== undefined && t.biocentricScore < 60) {
                            sickWorkers++;
                            if (t.cargo) criticalAreasMap[t.cargo] = (criticalAreasMap[t.cargo] || 0) + 1.5;
                        } else if (t.diagnosticoMedico && t.diagnosticoMedico !== 'Apto / Sin Hallazgos' && t.diagnosticoMedico !== 'Apto') {
                            sickWorkers++;
                            if (t.cargo) criticalAreasMap[t.cargo] = (criticalAreasMap[t.cargo] || 0) + 1;
                        }
                    });
                }
            }
            
            // Hito 2: Matriz Bio-IPEVAR / GTC-45
            const mData = mongoose.models.MatrizPeligrosData;
            if (mData) {
                const doc = await mData.findOne({ user: userId, companyId }).lean();
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
            
            // Hito 3: posturas OWAS
            const oData = mongoose.models.MetodoOwasData;
            if (oData) {
                const doc = await oData.findOne({ user: userId, companyId }).lean();
                if (doc?.resultados?.length) {
                    doc.resultados.forEach(r => {
                        totalOwas++;
                        if (r.categoriaRiesgo >= 3) totalOwasHigh++;
                    });
                }
            }
            
            // Hito 3: Reporte Actos
            const rData = mongoose.models.ReporteActosData;
            if (rData) {
                const doc = await rData.findOne({ user: userId, companyId }).lean();
                if (doc?.reportesList) {
                    totalActsConds = doc.reportesList.filter(r => r.estado !== 'Cerrado').length;
                }
            }

            // Hito 3: Participación IPEVAR
            const ipevarData = mongoose.models.ParticipacionIpevarData;
            if (ipevarData) {
                const docs = await ipevarData.find({ user: userId, companyId }).lean();
                if (docs?.length) {
                    docs.forEach(p => {
                        if (p.miedoScore >= 7) {
                            totalIpevarHighMiedo++;
                            if (p.workerName) criticalAreasMap[p.workerName] = (criticalAreasMap[p.workerName] || 0) + 1;
                        }
                    });
                }
            }

            // Hito 3: Permisos Alturas
            const alturasData = mongoose.models.PermisoAlturasData;
            if (alturasData) {
                const docs = await alturasData.find({ user: userId, companyId }).lean();
                if (docs?.length) {
                    totalAlturasActive = docs.length;
                }
            }

            // Hito 3: Programa Capacitaciones
            const capData = mongoose.models.ProgramaCapacitacionesData;
            if (capData) {
                const doc = await capData.findOne({ user: userId, companyId }).lean();
                if (doc?.temas?.length) {
                    totalCapPendientes = doc.temas.filter(t => t.estado !== 'Ejecutada').length;
                }
            }

            // Hito 3: ATS
            const atsData = mongoose.models.AnalisisTrabajoSeguroData;
            if (atsData) {
                const doc = await atsData.findOne({ user: userId, companyId }).lean();
                if (doc?.pasos?.length) {
                    totalATS = doc.pasos.length;
                }
            }

            // Hito 4: Investigaciones ATEL (Accidentes/Siniestralidad)
            const atelData = mongoose.models.InvestigacionAtelData;
            if (atelData) {
                const docs = await atelData.find({ user: userId, companyId }).lean();
                if (docs && docs.length > 0) {
                    totalATEL = docs.length;
                    docs.forEach(doc => {
                        const formData = doc.formData || {};
                        if (formData.cargoAccidentado) {
                            criticalAreasMap[formData.cargoAccidentado] = (criticalAreasMap[formData.cargoAccidentado] || 0) + 3.5;
                        }
                    });
                }
            }

            // Hito 3: Escenarios Vulnerabilidad
            const vulData = mongoose.models.AnalisisVulnerabilidadData;
            if (vulData) {
                const doc = await vulData.findOne({ user: userId, companyId }).lean();
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
            ? `Calculado sobre ${sickWorkers} casos clínicos o de bajo fit H1 activos de un total de ${totalWorkers} trabajadores.` 
            : `Sin hallazgos clínicos críticos en ${totalWorkers} trabajadores (Oráculo H1).`;

        let safetyRisk = totalHazards > 0 ? Math.min(100, Math.round((totalHazardsI_II / totalHazards) * 100 * 1.5)) : 0;
        if (totalActsConds > 0) safetyRisk = Math.min(100, safetyRisk + (totalActsConds * 5));
        if (totalATEL > 0) safetyRisk = Math.min(100, safetyRisk + (totalATEL * 12));
        if (totalAlturasActive > 0) safetyRisk = Math.min(100, safetyRisk + (totalAlturasActive * 8));
        if (totalIpevarHighMiedo > 0) safetyRisk = Math.min(100, safetyRisk + (totalIpevarHighMiedo * 6));
        if (totalCapPendientes > 0) safetyRisk = Math.min(100, safetyRisk + (totalCapPendientes * 3));
        
        let safetyEvidence = [];
        if (totalHazardsI_II > 0) safetyEvidence.push(`${totalHazardsI_II} peligros inaceptables/críticos Bio-IPEVAR (H2)`);
        if (totalActsConds > 0) safetyEvidence.push(`${totalActsConds} actos/condiciones inseguras abiertos (H3)`);
        if (totalATEL > 0) safetyEvidence.push(`${totalATEL} accidentes ATEL investigados forensicamente (H4)`);
        if (totalAlturasActive > 0) safetyEvidence.push(`${totalAlturasActive} permisos de alturas activos (H3)`);
        if (totalIpevarHighMiedo > 0) safetyEvidence.push(`${totalIpevarHighMiedo} miedos severos en participación (H3)`);

        let safetyEvidenceText = safetyEvidence.length > 0 
            ? `Cruce de datos: ${safetyEvidence.join(' / ')}.`
            : `Condiciones operativas y de seguridad física estables en hitos 2, 3 y 4.`;

        let ergonomicRisk = totalOwas > 0 ? Math.min(100, Math.round((totalOwasHigh / totalOwas) * 100 * 1.5)) : 0;
        if (ergonomicRisk === 0 && sickWorkers > 0) ergonomicRisk = Math.floor(healthRisk / 2);
        
        let ergonomicEvidence = totalOwasHigh > 0
            ? `Identificadas ${totalOwasHigh} posturas de Riesgo Nivel 3 y 4 en Método OWAS (H3).`
            : (totalOwas > 0 ? `Analizadas ${totalOwas} posturas operativas bajo control.` : `Nivel postural basal calculado desde Oráculo H1.`);

        let overallRisk = Math.round((healthRisk + safetyRisk + ergonomicRisk) / 3);
        if (overallRisk === 0 && (totalWorkers > 0 || totalHazards > 0 || totalVulnerabilidades > 0)) {
            overallRisk = 12;
            safetyRisk = totalVulnerabilidades > 0 ? 25 : 15;
            healthRisk = 10;
        }

        let criticalArea = "SISTEMA GENERAL";
        let maxCount = 0;
        for (const [area, count] of Object.entries(criticalAreasMap)) {
            if (count > maxCount) { maxCount = count; criticalArea = area; }
        }

        let predictionSummary = "Evaluación predictiva cruzando bases de datos de perfiles clínicos (H1), peligros (H2), operaciones de campo (H3) e incapacidades (H4). ";
        if (overallRisk < 20) predictionSummary += "Riesgo proyectado bajo. Monitoreo pasivo y preventivo recomendado sobre incidentes menores.";
        else if (overallRisk < 50) predictionSummary += `Probabilidad de incidente o accidente moderado. Se sugiere control en área/cargo: ${criticalArea}.`;
        else predictionSummary += `🛑 ALERTA MÁXIMA EN: ${criticalArea}. Convergencia crítica de susceptibilidad de salud H1, peligros inaceptables Bio-IPEVAR, y causas raíces en investigaciones ATEL anteriores. Muy alta probabilidad de accidente o brote de enfermedad laboral a corto plazo.`;
        
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
                "Control y mitigación prioritarios de peligros inaceptables de categoría I/II identificados en Bio-IPEVAR (Hito 2)",
                "Intervención de ingeniería y ergonomía postural sobre tareas con riesgo OWAS nivel 3 o 4 (Hito 3)",
                "Seguimiento clínico cerrado a trabajadores con bajo score biocéntrico (<60%) en el Oráculo H1 (Hito 1)",
                "Cierre inmediato de actos/condiciones inseguras abiertos y aplicación de lecciones aprendidas de investigaciones ATEL (Hito 4)"
            ]
        });
    } catch (err) {
        logger.error('[Predictivo] Forecast error:', err.message);
        res.status(500).json({ error: 'Error interno en pronóstico: ' + err.message });
    }
});


// ═══════════════════════════════════════════════════════════════════════════════
// ─── ENDPOINT: Generate Predictive Report (Dense prediction, hitos 1-4) ──────
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/generate-report', requireJwtAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { modelName } = req.body;

        const apiKey = await getApiKey(userId);
        if (!apiKey) return res.status(400).json({ error: 'Falta configurar la API Key de Google en su perfil.' });

        const companyId = await getActiveCompanyId(userId);

        // Get company info (same as other apps)
        const ci = await CompanyInfo.findOne({ user: userId, _id: companyId }).lean();
        const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

        // Build header HTML (same as estadisticas, diagnostico, etc.)
        const headerHTML = buildStandardHeader({
            title: 'INFORME MAESTRO DE PRONÓSTICO E INTELIGENCIA PREDICTIVA SST',
            companyInfo: ci,
            date: fecha,
            norm: 'Decreto 1072 de 2015 / Resolución 0312 de 2019',
        });

        // Use the newly shared deep context block (Hit 1 to 4)
        const fullContext = await getFullSSTContext(userId, companyId);

        const promptText = `Eres un Experto Consultor Estratégico Senior en Seguridad y Salud en el Trabajo (SGSST) en Colombia. Dominas la GTC 45, el Decreto 1072 de 2015, la Resolución 0312 de 2019 y el análisis predictivo de riesgo laboral en base a múltiples hitos interconectados.

Has sido contratado para producir el INFORME MAESTRO DE INTELIGENCIA Y PRONÓSTICO PREDICTIVO SST más completo, denso y específico que esta empresa haya recibido jamás. Tienes acceso a los datos REALES de todos los hitos y módulos del sistema.

${fullContext}

═══════════════════════════════════════
      TU TAREA: INFORME Y PRONÓSTICO DE SINIESTRALIDAD
═══════════════════════════════════════

Produce un INFORME EXTENSO, ESPECÍFICO, DENSO Y TÉCNICO. Debes cruzar la información de manera matemática e IA:
- **HITO 1 (Oráculo H1):** Cruza el biocentricScore de los trabajadores y sus etiquetas médicas de susceptibilidad.
- **HITO 2 (Matriz Bio-IPEVAR):** Analiza los peligros inaceptables (Nivel I) o críticos (Nivel II) y si coinciden con los operarios con baja aptitud en H1.
- **HITO 3 (Aplicativos importantes):** Analiza los pasos críticos de ATS, los permisos de alturas activos, las posturas de riesgo 3/4 evaluadas por OWAS, los reportes de actos inseguros abiertos, el nivel de miedo de la Participación IPEVAR y la cobertura del Programa de Capacitaciones.
- **HITO 4 (Estadísticas e Investigaciones ATEL):** Analiza los antecedentes de incapacidad por accidentes y las causas raíces forenses encontradas.

**TU OBJETIVO PRINCIPAL ES PREDECIR CON MÁXIMA PRECISIÓN:**
1. **INCIDENTES:** Casi-accidentes, desviaciones operativas o fallas de control que ocurrirán (ej. resbalones en áreas específicas, descuidos formativos).
2. **ACCIDENTES DE TRABAJO (AT):** Proyección cuantitativa de accidentes físicos severos en los próximos 30, 90 y 180 días (ej. caídas de altura si hay permisos y no capacitaciones, atrapamientos si hay peligros inaceptables de maquinaria, etc.).
3. **ENFERMEDADES LABORALES (EL):** Proyección de patologías osteomusculares crónicas (DME, túnel carpiano, hernia discal) y agravamiento de condiciones clínicas (HTA, taquicardia, diabetes, etc.) por posturas OWAS críticas y perfiles de cargo de alta exigencia física/mental.

**ESTRUCTURA EXACTA (7 secciones, cada una extensa y con datos reales):**

──── SECCIÓN 1: TABLERO DE INDICADORES PREDICTIVOS (Cuadro de Mando Integrado) ────
Genera una TABLA HTML visual (sin 'striped' class) que funcione como un Cuadro de Mando Integrado, que resuma estrictamente los hallazgos de todo el reporte.
Ejemplo de estructura (hazla más elegante con CSS inline, colores y padding, pero respetando las normas de no-oscuro):
| Indicador Predictivo | Nivel de Riesgo (%) | Justificación (Evidencia de BD) |
| --- | --- | --- |
| Riesgo de Siniestro (General) | [Valor Real] | [Conclusión / Área Crítica] |
| Salud Operacional | [Valor Real] | [Hallazgos Clínicos / H1] |
| Seguridad Física | [Valor Real] | [Actos/Condiciones, ATEL, ATS, Alturas] |
| Biomecánica (OWAS) | [Valor Real] | [Posturas Críticas] |

──── SECCIÓN 2: PRONÓSTICO DE ACCIDENTABILIDAD (30, 90 Y 180 DÍAS) ────
- Párrafos densos y extensos.
- Predice los tipos específicos de ACCIDENTES e INCIDENTES de trabajo que ocurrirán con mayor probabilidad en los procesos operativos de la empresa.
- Asocia estas predicciones directamente a los peligros inaceptables de la Matriz Bio-IPEVAR (Hito 2), a los reportes de actos inseguros abiertos, a los pasos críticos de ATS o los trabajos en alturas (Hito 3) y al historial forense de investigaciones ATEL (Hito 4).

──── SECCIÓN 3: PRONÓSTICO DE ENFERMEDADES LABORALES Y APTITUD BIOCÉNTRICA ────
- Múltiples párrafos estructurados por especialidad (Osteomuscular, Cardiovascular, Psicosocial, etc.).
- Predice la aparición de ENFERMEDADES LABORALES crónicas (ej. trastornos músculo-esqueléticos por posturas críticas OWAS categoría 3 o 4) o la pérdida de aptitud biocéntrica de los trabajadores.
- Cruza de forma explícita las susceptibilidades del Oráculo H1 (ej. trabajadores con lumbalgia, hernia discal, HTA, asma, etc.) con las exigencias del Perfil de Cargo y las condiciones de exposición real para proyectar ausentismo o crisis de salud ocupacional.

──── SECCIÓN 4: FACTORES DE RIESGO - PROYECCIÓN (Gráfica de Barras HTML) ────
Genera una gráfica de barras horizontales usando DIVs con CSS inline. Mínimo 6 factores de riesgo de siniestralidad (ej. biomecánico postural, psicosocial, mecánico/maquinaria, trabajo en alturas, clínico cardiovascular, químico/exposiciones).
Cada barra: [Nombre del Factor] con su porcentaje y una barra visual coloreada.

──── SECCIÓN 5: MAPA DE CARGOS Y PROCESOS DE ALTA VULNERABILIDAD ────
Para cada cargo/proceso de la empresa (ej. Operario de Producción, Auxiliar de Bodega, etc. identificados en los datos), genera una tarjeta HTML elegante con:
• Nombre del Cargo/Proceso
• Señales de riesgo convergentes (Hito 1 + Hito 2 + Hito 3 + Hito 4)
• Pronóstico Predictivo del Cargo: INCIDENTES / ACCIDENTES / ENFERMEDADES
• Razón técnica de la clasificación de vulnerabilidad (CRÍTICA / ALTA / MEDIA / BAJA)

──── SECCIÓN 6: PLAN DE ACCIÓN Y MITIGACIÓN PRESCRIPTIVA ────
Tabla completa y detallada con columnas:
| # | Factor de Riesgo | Cargo/Proceso Afectado | Evidencia (Módulos Origen Hito 1-4) | Acción Prescriptiva (Control Recomendado) | Prioridad | Plazo Sugerido |
- Mínimo 8-10 filas, específicas y basadas en datos reales.
- Las acciones deben ser concretas: "Evaluación ergonómica del puesto del Operario", "Implementar Programa de Vigilancia Epidemiológica en DME", etc.
- Prioridad: Inmediata (< 15 días) / Corto Plazo (15-30 días) / Medio Plazo (1-3 meses).

──── SECCIÓN 7: CONCLUSIÓN E IMPACTO LEGAL/FINANCIERO ────
- Explica las consecuencias legales concretas (sanciones del Ministerio del Trabajo, Res. 0312 Art. 25, responsabilidad patronal).
- Proyecta los costos económicos por días de incapacidad (derivado de las Estadísticas ATEL), indemnizaciones y pérdidas de productividad si no se interviene a tiempo.
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
        const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();
        const finalModelName = modelName || preferredModel;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: finalModelName });

        const result = await generateWithKeyRotation(model, req.user?.id || req.user, promptText);
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
