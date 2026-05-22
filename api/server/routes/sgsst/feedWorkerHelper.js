const SgsstWorker = require('../../../models/SgsstWorker');
const CompanyInfo = require('../../../models/CompanyInfo');

async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

/**
 * Registra un evento en la hoja de vida ocupacional del trabajador y aplica la lógica
 * de Integralidad Avanzada (SST 360) para mantener la Huella Biocéntrica, Matriz 360,
 * Capacitaciones y Gamificación vivas e interconectadas.
 * 
 * @param {string} userId - ID del usuario.
 * @param {string} documento - Documento de identidad del trabajador.
 * @param {string} tipo_modulo - Módulo de origen ('atel', 'actos', 'participacion_ipevar', 'capacitacion', 'ats').
 * @param {string} descripcion - Descripción cualitativa del evento.
 * @param {number} puntos - Puntos de gamificación a sumar (o restar si es negativo).
 * @param {string} [referencia=null] - ID o enlace del registro origen.
 * @param {object} [metadata={}] - Datos enriquecidos para la sincronización avanzada.
 */
async function feedWorkerEvent(userId, documento, tipo_modulo, descripcion, puntos, referencia = null, metadata = {}) {
    try {
        if (!documento || !tipo_modulo) return;
        const companyId = await getActiveCompanyId(userId);
        const worker = await SgsstWorker.findOne({ user: userId, companyId, documento: String(documento).trim() });
        if (!worker) return;

        const pts = Number(puntos) || 0;
        let fitScoreAdjustment = 0;
        let newAlerts = [];
        let updatedRiesgos = [...(worker.riesgosBioIndividual || [])];
        let updatedCapacitaciones = [...(worker.capacitaciones || [])];

        // ─── 1. Procesamiento Ocupacional Enriquecido ─────────────────────────────
        
        if (tipo_modulo === 'atel') {
            const diasIncap = Number(metadata.diasIncapacidad) || 0;
            const diasCarg = Number(metadata.diasCargados) || 0;
            const parteCuerpo = metadata.parteCuerpo || '';
            const peligro = metadata.peligro || '';
            const consecuencia = metadata.consecuencia || '';

            // A. Recálculo dinámico de fitScore (Huella Biocéntrica)
            // Se descuenta por la severidad del accidente (días de incapacidad y factor base)
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
            if (consecuencia && consecuencia.toLowerCase().includes('lumbago') || consecuencia.toLowerCase().includes('columna')) {
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
                        // Elevar probabilidad y consecuencias al nivel máximo (Materializado)
                        risk.nivel_susceptibilidad = 5; // Crítico
                        risk.nivel_exposicion = 4;       // Continuo
                        risk.indice_bio_riesgo_bruto = 20; // 5 * 4
                        
                        const reduction = risk.factor_reduccion_percepcion || 0;
                        risk.indice_bio_riesgo_efectivo = 20 * (1 - reduction);
                        risk.clasificacion_bio = 'Crítico';
                        risk.intervencion_prioritaria = true;
                        risk.plan_accion_bio = `REVISIÓN URGENTE: Accidente materializado registrado el ${new Date().toLocaleDateString()}.`;
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
                // Conducta subestándar observada: Penalización de Percepción y aptitud
                fitScoreAdjustment = -3.0; // Descuento directo en bienestar

                if (esCritico && !worker.fitAlerts.includes('Acto_Inseguro_Critico')) {
                    newAlerts.push('Acto_Inseguro_Critico');
                }

                // Prescribir capacitación correctiva obligatoria
                const yaExiste = updatedCapacitaciones.some(c => c.nombre && c.nombre.includes('CAP-12'));
                if (!yaExiste) {
                    updatedCapacitaciones.push({
                        nombre: `[COMPORTAMIENTO REFUERZO] CAP-12 Reporte de Actos`,
                        fecha: new Date()
                    });
                }
            }
        }

        // ─── 2. Estructuración del Update en la Base de Datos ─────────────────────
        
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
        }

        // Integrar alertas médicas dinámicas
        if (newAlerts.length > 0) {
            update.$addToSet = { fitAlerts: { $each: newAlerts } };
        }

        // Aplicar ajuste al fitScore (garantizando rango 0 - 100)
        if (fitScoreAdjustment !== 0) {
            const currentScore = Number(worker.fitScore) || 100;
            const calculatedScore = Math.max(0, Math.min(100, currentScore + fitScoreAdjustment));
            update.$set.fitScore = calculatedScore;
        }

        // Persistir cambios en matrices complejas
        if (tipo_modulo === 'atel') {
            update.$set.riesgosBioIndividual = updatedRiesgos;
            update.$set.capacitaciones = updatedCapacitaciones;
        } else if (tipo_modulo === 'actos' && metadata.esObservado) {
            update.$set.capacitaciones = updatedCapacitaciones;
        }

        // Gamificación: Sumar/restar puntos de Percepción del Riesgo
        if (pts !== 0) {
            update.$inc = { percepcionRiesgoScore: pts };
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
