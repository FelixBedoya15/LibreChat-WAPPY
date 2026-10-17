const mongoose = require('mongoose');
const SgsstWorker = require('../../../models/SgsstWorker');
const CompanyInfo = require('../../../models/CompanyInfo');

async function resolveEffectiveCompanyId(userId, explicitCompanyId = null) {
    if (explicitCompanyId) {
        return explicitCompanyId;
    }
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

/**
 * Recalcula los índices Bruto, Factor de Reducción, Efectivo y Clasificación
 * de cada fila de la Matriz Bio-IPEVR en función del puntaje actual de Percepción del Riesgo.
 */
function recalculateBioRisks(riesgos = [], percepcionPts = 0, fitScore = undefined) {
    if (!Array.isArray(riesgos) || riesgos.length === 0) return [];
    const safePts = Math.max(0, Number(percepcionPts) || 0);
    const factorReduccion = Number(Math.min(safePts / 500, 0.40).toFixed(3));

    return riesgos.map(rawRisk => {
        const risk = rawRisk && typeof rawRisk.toObject === 'function' ? rawRisk.toObject() : { ...rawRisk };
        const susceptibilidad = Math.max(1, Math.min(5, Number(risk.nivel_susceptibilidad) || 1));
        const exposicion = Math.max(1, Math.min(5, Number(risk.nivel_exposicion) || 1));
        const bruto = susceptibilidad * exposicion;
        const efectivo = Number((bruto * (1 - factorReduccion)).toFixed(1));

        let clasificacion = 'Bajo';
        if (efectivo >= 20) clasificacion = 'Crítico';
        else if (efectivo >= 12) clasificacion = 'Alto';
        else if (efectivo >= 6) clasificacion = 'Moderado';

        risk.nivel_susceptibilidad = susceptibilidad;
        risk.nivel_exposicion = exposicion;
        risk.percepcion_riesgo_pts = safePts;
        if (fitScore !== undefined && fitScore !== null) {
            risk.fit_score = Number(fitScore);
        }
        risk.indice_bio_riesgo_bruto = bruto;
        risk.factor_reduccion_percepcion = factorReduccion;
        risk.indice_bio_riesgo_efectivo = efectivo;
        risk.clasificacion_bio = clasificacion;
        risk.intervencion_prioritaria = clasificacion === 'Crítico' || clasificacion === 'Alto';
        return risk;
    });
}

/**
 * Conserva alertas operativas 360° (EPP, PESV, Químicos, ATEL, Actos) al sincronizar con Oráculo H1.
 */
function isOperationalAlert(alertStr) {
    const s = String(alertStr || '').trim();
    return (
        s.startsWith('[') ||
        s.startsWith('Restriccion_') ||
        s.includes('_Restriccion') ||
        s === 'Acto_Inseguro_Critico' ||
        s.includes('EPP Convencional Vencido') ||
        s.includes('Equipo de Alturas Vencido') ||
        s.includes('Vehículo No Conforme') ||
        s.includes('Inspección Preoperacional Rechazada') ||
        s.includes('Exposición a Químico')
    );
}

function mergeOperationalFitAlerts(socioAlerts = [], existingFitAlerts = []) {
    const base = Array.isArray(socioAlerts) ? socioAlerts : [];
    const operational = (Array.isArray(existingFitAlerts) ? existingFitAlerts : []).filter(isOperationalAlert);
    return Array.from(new Set([...base, ...operational]));
}

/**
 * Registra un evento en la hoja de vida ocupacional del trabajador y aplica la lógica
 * de Integralidad Avanzada (SST 360) para mantener la Huella Biocéntrica, Matriz 360,
 * Capacitaciones y Gamificación vivas e interconectadas.
 */
async function feedWorkerEvent(userId, documento, tipo_modulo, descripcion, puntos, referencia = null, metadata = {}) {
    try {
        if (!documento || !tipo_modulo) return;
        const cleanDoc = String(documento).trim();
        if (!cleanDoc) return;

        // Evitar que UUIDs o IDs de eventos erróneos se conviertan en trabajadores fantasma
        const looksLikeUuidOrObjectId =
            /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(cleanDoc) || /^[0-9a-f]{24}$/i.test(cleanDoc);

        const explicitCompanyId = metadata.companyId || (metadata.company && metadata.company._id) || null;
        const companyId = await resolveEffectiveCompanyId(userId, explicitCompanyId);

        // 1. Buscar trabajador en SgsstWorker (prioridad estricta a companyId para aislamiento multitenant)
        let worker = null;
        if (companyId) {
            worker = await SgsstWorker.findOne({ companyId, documento: cleanDoc });
        }
        if (!worker && userId && !companyId) {
            worker = await SgsstWorker.findOne({ user: userId, documento: cleanDoc });
        }

        // 2. Si no existe en SgsstWorker, buscar en PerfilSociodemograficoData para autocrearlo
        if (!worker) {
            let perfilWorker = null;
            try {
                const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
                if (PerfilSociodemograficoData) {
                    const perfilQuery = companyId
                        ? { companyId }
                        : { user: userId, $or: [{ companyId: null }, { companyId: { $exists: false } }] };
                    const perfilDoc = await PerfilSociodemograficoData.findOne(perfilQuery).lean();
                    if (perfilDoc && Array.isArray(perfilDoc.trabajadores)) {
                        perfilWorker = perfilDoc.trabajadores.find(
                            t => String(t.identificacion || t.cedula || t.documento || '').trim() === cleanDoc
                        );
                    }
                }
            } catch (errPerfil) {
                console.warn('[feedWorkerEvent] Error checking PerfilSociodemografico:', errPerfil.message);
            }

            if (!perfilWorker && looksLikeUuidOrObjectId) {
                console.warn(`[feedWorkerEvent] Ignorando documento inválido (UUID/ObjectId sin trabajador): ${cleanDoc}`);
                return;
            }

            // Autocreado resiliente para garantizar que los puntos de gamificación NUNCA se pierdan
            try {
                worker = await SgsstWorker.create({
                    user: userId,
                    companyId: companyId || undefined,
                    perfilId: cleanDoc,
                    nombre: perfilWorker?.nombre || metadata.nombre || 'Colaborador',
                    documento: cleanDoc,
                    cargo: perfilWorker?.cargo || metadata.cargo || 'Trabajador',
                    fitScore: Number(perfilWorker?.biocentricScore || 95),
                    fitScoreDynamicPenalty: 0,
                    fitAlerts: perfilWorker?.biocentricAlerts || [],
                    percepcionRiesgoScore: 0,
                    percepcionRiesgoHistorial: [],
                    riesgosBioIndividual: [],
                    capacitaciones: [],
                    atel: [],
                    actos_inseguros: [],
                    participaciones_ipevar: [],
                    ats: [],
                    termometro_animo: [],
                    comites: [],
                    votaciones: [],
                    solicitud_epp: [],
                    inspeccion_vehicular_pesv: [],
                    estudio_puesto: [],
                    actualizaciones_perfil: [],
                    brigada: []
                });
            } catch (errCreate) {
                console.warn('[feedWorkerEvent] Worker creation fallback, trying retrieval:', errCreate.message);
                if (companyId) {
                    worker = await SgsstWorker.findOne({ companyId, documento: cleanDoc });
                }
                if (!worker && userId && !companyId) {
                    worker = await SgsstWorker.findOne({ user: userId, documento: cleanDoc });
                }
            }
        }

        if (!worker) return;

        // Normalizar alias de módulos
        const normalizedModulo = tipo_modulo === 'perfil_socio' ? 'perfil' : tipo_modulo;

        // 3. Control de Idempotencia: si viene referencia y ya existe en el historial, evitar duplicar
        if (referencia) {
            const refStr = String(referencia).trim();
            const yaEnHistorial = (worker.percepcionRiesgoHistorial || []).some(
                h =>
                    String(h.referencia || '').trim() === refStr &&
                    (h.modulo === tipo_modulo || h.modulo === normalizedModulo)
            );
            const yaEnAtel =
                (tipo_modulo === 'atel' || tipo_modulo === 'atel_testimonio') &&
                (worker.atel || []).some(a => String(a.referenciaId || '').trim() === refStr);
            if (yaEnHistorial || yaEnAtel) {
                return worker; // Evento ya acreditado previamente
            }
        }

        const pts = Number(puntos) || 0;
        const currentScore = Math.max(0, Number(worker.percepcionRiesgoScore) || 0);
        const nuevoScore = Math.max(0, currentScore + pts);

        let fitScoreAdjustment = 0;
        let newAlerts = [];
        let updatedRiesgos = [...(worker.riesgosBioIndividual || [])];
        let updatedCapacitaciones = [...(worker.capacitaciones || [])];
        let riesgosModified = false;

        // ─── 4. Procesamiento Ocupacional Enriquecido ─────────────────────────────
        
        if (tipo_modulo === 'atel') {
            const diasIncap = Number(metadata.diasIncapacidad) || 0;
            const diasCarg = Number(metadata.diasCargados) || 0;
            const parteCuerpo = metadata.parteCuerpo || '';
            const peligro = metadata.peligro || '';
            const consecuencia = metadata.consecuencia || '';

            // A. Recálculo dinámico de fitScore (Huella Biocéntrica)
            const penalizacion = (diasIncap * 0.75) + (diasCarg * 0.15) + 5.0;
            fitScoreAdjustment = -penalizacion;

            // B. Auto-inyección de restricciones médicas en fitAlerts
            if (parteCuerpo) {
                const tagParte = parteCuerpo.trim().replace(/\s+/g, '_');
                const restriccionTag = `Restriccion_Biomecanica_${tagParte}`;
                if (!worker.fitAlerts.includes(restriccionTag)) {
                    newAlerts.push(restriccionTag);
                }
            }
            if (consecuencia && (consecuencia.toLowerCase().includes('lumbago') || consecuencia.toLowerCase().includes('columna'))) {
                if (!worker.fitAlerts.includes('Lumbago_Activo_Restriccion')) {
                    newAlerts.push('Lumbago_Activo_Restriccion');
                }
            }

            // C. Materialización de Peligro en Matriz Bio-IPEVAR 360 (Hito 2)
            if (peligro && updatedRiesgos.length > 0) {
                const cleanPeligro = peligro.toLowerCase().trim();
                updatedRiesgos = updatedRiesgos.map(rawRisk => {
                    const risk = rawRisk && typeof rawRisk.toObject === 'function' ? rawRisk.toObject() : { ...rawRisk };
                    const matchDimension = risk.dimension_bio && risk.dimension_bio.toLowerCase().includes(cleanPeligro);
                    const matchPeligro = risk.peligro_cargo && risk.peligro_cargo.toLowerCase().includes(cleanPeligro);
                    
                    if (matchDimension || matchPeligro) {
                        risk.nivel_susceptibilidad = 5; // Crítico
                        risk.nivel_exposicion = Math.max(4, Number(risk.nivel_exposicion) || 4); // Continuo
                        risk.plan_accion_bio = `REVISIÓN URGENTE: Accidente materializado registrado el ${new Date().toLocaleDateString('es-CO')}.`;
                        riesgosModified = true;
                    }
                    return risk;
                });
            }

            // D. Prescripción automática de Cursos de Reinducción de Emergencia (Hito 3)
            const temasUrgentes = ['CAP-02 Peligros GTC-45', 'CAP-12 Reporte de Actos Inseguros'];
            temasUrgentes.forEach(tema => {
                const yaExiste = updatedCapacitaciones.some(c => c.nombre && c.nombre.includes(tema));
                if (!yaExiste) {
                    updatedCapacitaciones.push({
                        nombre: `[URGENTE - POST-ATEL] ${tema}`,
                        fecha: new Date()
                    });
                }
            });

        } else if (tipo_modulo === 'actos') {
            const esObservado = metadata.esObservado || false;
            const esCritico = metadata.esCritico || false;

            if (esObservado) {
                fitScoreAdjustment = -3.0; // Descuento directo en bienestar
                if (esCritico && !worker.fitAlerts.includes('Acto_Inseguro_Critico')) {
                    newAlerts.push('Acto_Inseguro_Critico');
                }
                const yaExiste = updatedCapacitaciones.some(c => c.nombre && c.nombre.includes('CAP-12'));
                if (!yaExiste) {
                    updatedCapacitaciones.push({
                        nombre: `[COMPORTAMIENTO REFUERZO] CAP-12 Reporte de Actos`,
                        fecha: new Date()
                    });
                }
            }
        }

        // ─── 5. Estructuración del Update en la Base de Datos ─────────────────────
        
        const update = { $set: { updatedAt: Date.now() }, $push: {} };
        const now = new Date();

        // Insertar en el historial específico de cada módulo 360°
        if (tipo_modulo === 'atel') {
            update.$push.atel = {
                fecha: now,
                tipo: metadata.tipo || 'Accidente de Trabajo',
                descripcion,
                referenciaId: referencia
            };
        } else if (tipo_modulo === 'atel_testimonio') {
            update.$push.atel = {
                fecha: now,
                tipo: 'Testimonio ATEL',
                descripcion,
                referenciaId: referencia
            };
        } else if (tipo_modulo === 'actos') {
            update.$push.actos_inseguros = {
                fecha: now,
                tipo: metadata.esObservado ? 'Acto Inseguro' : 'Reporte Preventivo',
                descripcion
            };
        } else if (tipo_modulo === 'participacion_ipevar') {
            update.$push.participaciones_ipevar = { fecha: now, descripcion };
        } else if (tipo_modulo === 'capacitacion') {
            update.$push.capacitaciones = { nombre: descripcion, fecha: now };
        } else if (tipo_modulo === 'ats') {
            update.$push.ats = { fecha: now, descripcion };
        } else if (tipo_modulo === 'termometro_animo') {
            update.$push.termometro_animo = { fecha: now, descripcion, puntos: pts };
        } else if (tipo_modulo === 'comites') {
            update.$push.comites = { fecha: now, descripcion, puntos: pts, referencia };
        } else if (tipo_modulo === 'votaciones') {
            update.$push.votaciones = { fecha: now, descripcion, puntos: pts, referencia };
        } else if (tipo_modulo === 'solicitud_epp') {
            update.$push.solicitud_epp = { fecha: now, descripcion, puntos: pts, referencia };
        } else if (tipo_modulo === 'inspeccion_vehicular_pesv') {
            update.$push.inspeccion_vehicular_pesv = { fecha: now, descripcion, puntos: pts, referencia };
        } else if (tipo_modulo === 'estudio_puesto') {
            update.$push.estudio_puesto = { fecha: now, descripcion, puntos: pts, referencia };
        } else if (normalizedModulo === 'perfil') {
            update.$push.actualizaciones_perfil = { fecha: now, descripcion, puntos: pts, referencia };
        } else if (tipo_modulo === 'brigada') {
            update.$push.brigada = { fecha: now, descripcion, puntos: pts, referencia };
        }

        // Integrar alertas médicas dinámicas
        if (newAlerts.length > 0) {
            update.$addToSet = { fitAlerts: { $each: newAlerts } };
        }

        // Aplicar ajuste al fitScore (garantizando rango 0 - 100) y persistir penalización dinámica
        let effectiveFit = Number(worker.fitScore) || 95;
        if (fitScoreAdjustment !== 0) {
            const currentPenalty = Number(worker.fitScoreDynamicPenalty) || 0;
            const newPenalty = Math.max(0, Number((currentPenalty - fitScoreAdjustment).toFixed(2)));
            effectiveFit = Math.max(0, Math.min(100, Number((effectiveFit + fitScoreAdjustment).toFixed(1))));
            update.$set.fitScore = effectiveFit;
            update.$set.fitScoreDynamicPenalty = newPenalty;
        }

        // Recalcular automáticamente la Matriz Bio-IPEVR cuando cambian los puntos o se materializa un ATEL
        if (updatedRiesgos.length > 0 && (pts !== 0 || riesgosModified || tipo_modulo === 'atel')) {
            update.$set.riesgosBioIndividual = recalculateBioRisks(updatedRiesgos, nuevoScore, effectiveFit);
        }

        // Persistir capacitaciones prescritas automáticamente (si no se hizo $push directo a capacitaciones)
        if ((tipo_modulo === 'atel' || (tipo_modulo === 'actos' && metadata.esObservado)) && tipo_modulo !== 'capacitacion') {
            update.$set.capacitaciones = updatedCapacitaciones;
        }

        // Gamificación: Sumar/restar puntos garantizando piso mínimo >= 0
        if (pts !== 0) {
            update.$set.percepcionRiesgoScore = nuevoScore;
            update.$push.percepcionRiesgoHistorial = {
                fecha: now,
                accion: descripcion,
                puntos: pts,
                modulo: normalizedModulo,
                referencia,
            };
        }

        if (Object.keys(update.$push).length === 0) {
            delete update.$push;
        }

        await SgsstWorker.updateOne({ _id: worker._id }, update);
        return worker;
    } catch (e) {
        console.error('[SGSST Sync 360] Error in feedWorkerEvent:', e);
    }
}

feedWorkerEvent.recalculateBioRisks = recalculateBioRisks;
feedWorkerEvent.mergeOperationalFitAlerts = mergeOperationalFitAlerts;
feedWorkerEvent.isOperationalAlert = isOperationalAlert;

module.exports = feedWorkerEvent;
