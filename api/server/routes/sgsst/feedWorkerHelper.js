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
 * Registra un evento en la hoja de vida ocupacional del trabajador y aplica la lógica
 * de Integralidad Avanzada (SST 360) para mantener la Huella Biocéntrica, Matriz 360,
 * Capacitaciones y Gamificación vivas e interconectadas.
 * 
 * @param {string} userId - ID del usuario administrador o empresa.
 * @param {string} documento - Documento de identidad del trabajador.
 * @param {string} tipo_modulo - Módulo de origen ('atel', 'actos', 'participacion_ipevar', 'capacitacion', 'ats', 'comites', 'votaciones', 'solicitud_epp', 'inspeccion_vehicular_pesv', 'estudio_puesto', 'termometro_animo').
 * @param {string} descripcion - Descripción cualitativa del evento.
 * @param {number} puntos - Puntos de gamificación a sumar (o restar si es negativo).
 * @param {string} [referencia=null] - ID o enlace del registro origen (para idempotencia).
 * @param {object} [metadata={}] - Datos enriquecidos para la sincronización avanzada (puede incluir companyId, nombre, cargo).
 */
async function feedWorkerEvent(userId, documento, tipo_modulo, descripcion, puntos, referencia = null, metadata = {}) {
    try {
        if (!documento || !tipo_modulo) return;
        const cleanDoc = String(documento).trim();
        if (!cleanDoc) return;

        const explicitCompanyId = metadata.companyId || (metadata.company && metadata.company._id) || null;
        const companyId = await resolveEffectiveCompanyId(userId, explicitCompanyId);

        // 1. Buscar trabajador en SgsstWorker (prioridad estricta a companyId para aislamiento multitenant)
        let worker = null;
        if (companyId) {
            worker = await SgsstWorker.findOne({ companyId, documento: cleanDoc });
        }
        if (!worker && userId) {
            worker = await SgsstWorker.findOne({ user: userId, documento: cleanDoc });
        }

        // 2. Si no existe en SgsstWorker, buscar en PerfilSociodemograficoData para autocrearlo
        if (!worker) {
            let perfilWorker = null;
            try {
                const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
                if (PerfilSociodemograficoData) {
                    const perfilDoc = await PerfilSociodemograficoData.findOne({
                        $or: [
                            ...(companyId ? [{ companyId }] : []),
                            { user: userId }
                        ]
                    }).lean();
                    if (perfilDoc && Array.isArray(perfilDoc.trabajadores)) {
                        perfilWorker = perfilDoc.trabajadores.find(t => String(t.identificacion || t.cedula || '').trim() === cleanDoc);
                    }
                }
            } catch (errPerfil) {
                console.warn('[feedWorkerEvent] Error checking PerfilSociodemografico:', errPerfil.message);
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
                    fitAlerts: perfilWorker?.biocentricAlerts || [],
                    percepcionRiesgoScore: 0,
                    percepcionRiesgoHistorial: [],
                    riesgosBioIndividual: [],
                    capacitaciones: [],
                    atel: [],
                    actos_inseguros: [],
                    participaciones_ipevar: [],
                    ats: [],
                    termometro_animo: []
                });
            } catch (errCreate) {
                console.warn('[feedWorkerEvent] Worker creation fallback, trying retrieval:', errCreate.message);
                if (companyId) {
                    worker = await SgsstWorker.findOne({ companyId, documento: cleanDoc });
                }
                if (!worker && userId) {
                    worker = await SgsstWorker.findOne({ user: userId, documento: cleanDoc });
                }
            }
        }

        if (!worker) return;

        // 3. Control de Idempotencia: si viene referencia y ya existe en el historial de ese módulo, evitar duplicar
        if (referencia) {
            const yaEnHistorial = (worker.percepcionRiesgoHistorial || []).some(
                h => String(h.referencia || '') === String(referencia) && h.modulo === tipo_modulo
            );
            const yaEnAtel = tipo_modulo === 'atel' && (worker.atel || []).some(
                a => String(a.referenciaId || '') === String(referencia)
            );
            if (yaEnHistorial || yaEnAtel) {
                return; // Evento ya acreditado previamente
            }
        }

        const pts = Number(puntos) || 0;
        let fitScoreAdjustment = 0;
        let newAlerts = [];
        let updatedRiesgos = [...(worker.riesgosBioIndividual || [])];
        let updatedCapacitaciones = [...(worker.capacitaciones || [])];

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
                updatedRiesgos = updatedRiesgos.map(risk => {
                    const matchDimension = risk.dimension_bio && risk.dimension_bio.toLowerCase().includes(cleanPeligro);
                    const matchPeligro = risk.peligro_cargo && risk.peligro_cargo.toLowerCase().includes(cleanPeligro);
                    
                    if (matchDimension || matchPeligro) {
                        risk.nivel_susceptibilidad = 5; // Crítico
                        risk.nivel_exposicion = 4;       // Continuo
                        risk.indice_bio_riesgo_bruto = 20; // 5 * 4
                        
                        const reduction = risk.factor_reduccion_percepcion || 0;
                        risk.indice_bio_riesgo_efectivo = 20 * (1 - reduction);
                        risk.clasificacion_bio = 'Crítico';
                        risk.intervencion_prioritaria = true;
                        risk.plan_accion_bio = `REVISIÓN URGENTE: Accidente materializado registrado el ${new Date().toLocaleDateString('es-CO')}.`;
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
        
        const update = { $set: { updatedAt: Date.now() } };

        // Insertar en el historial de hoja de vida ocupacional
        if (tipo_modulo === 'atel') {
            update.$push = { 
                atel: { 
                    fecha: new Date(), 
                    tipo: metadata.tipo || 'Accidente de Trabajo', 
                    descripcion, 
                    referenciaId: referencia 
                } 
            };
        } else if (tipo_modulo === 'actos') {
            update.$push = { 
                actos_inseguros: { 
                    fecha: new Date(), 
                    tipo: metadata.esObservado ? 'Acto Inseguro' : 'Condición Insegura', 
                    descripcion 
                } 
            };
        } else if (tipo_modulo === 'participacion_ipevar') {
            update.$push = { participaciones_ipevar: { fecha: new Date(), descripcion } };
        } else if (tipo_modulo === 'capacitacion') {
            update.$push = { capacitaciones: { nombre: descripcion, fecha: new Date() } };
        } else if (tipo_modulo === 'ats') {
            update.$push = { ats: { fecha: new Date(), descripcion } };
        } else if (tipo_modulo === 'termometro_animo') {
            update.$push = { termometro_animo: { fecha: new Date(), descripcion, puntos: pts } };
        }

        // Integrar alertas médicas dinámicas
        if (newAlerts.length > 0) {
            update.$addToSet = { fitAlerts: { $each: newAlerts } };
        }

        // Aplicar ajuste al fitScore (garantizando rango 0 - 100)
        if (fitScoreAdjustment !== 0) {
            const currentFit = Number(worker.fitScore) || 100;
            const calculatedFit = Math.max(0, Math.min(100, currentFit + fitScoreAdjustment));
            update.$set.fitScore = calculatedFit;
        }

        // Persistir cambios en matrices complejas
        if (tipo_modulo === 'atel') {
            update.$set.riesgosBioIndividual = updatedRiesgos;
            update.$set.capacitaciones = updatedCapacitaciones;
        } else if (tipo_modulo === 'actos' && metadata.esObservado) {
            update.$set.capacitaciones = updatedCapacitaciones;
        }

        // Gamificación: Sumar/restar puntos garantizando piso mínimo >= 0
        if (pts !== 0) {
            const currentScore = Math.max(0, Number(worker.percepcionRiesgoScore) || 0);
            const nuevoScore = Math.max(0, currentScore + pts);
            update.$set.percepcionRiesgoScore = nuevoScore;

            if (!update.$push) update.$push = {};
            update.$push.percepcionRiesgoHistorial = {
                fecha: new Date(),
                accion: descripcion,
                puntos: pts,
                modulo: tipo_modulo,
                referencia,
            };
        }

        await SgsstWorker.updateOne({ _id: worker._id }, update);
    } catch (e) {
        console.error('[SGSST Sync 360] Error in feedWorkerEvent:', e);
    }
}

module.exports = feedWorkerEvent;
