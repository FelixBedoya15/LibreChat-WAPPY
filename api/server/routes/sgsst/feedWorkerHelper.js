const SgsstWorker = require('../../../models/SgsstWorker');
async function feedWorkerEvent(userId, documento, tipo_modulo, descripcion, puntos, referencia = null) {
    try {
        if (!documento || !tipo_modulo) return;
        const worker = await SgsstWorker.findOne({ user: userId, documento: String(documento).trim() });
        if (!worker) return;

        const pts = Number(puntos) || 0;
        const update = { $set: { updatedAt: Date.now() } };

        if (tipo_modulo === 'atel') {
            update.$push = { atel: { fecha: new Date(), tipo: descripcion, descripcion, referenciaId: referencia } };
        } else if (tipo_modulo === 'actos') {
            update.$push = { actos_inseguros: { fecha: new Date(), tipo: descripcion, descripcion } };
        } else if (tipo_modulo === 'participacion_ipevar') {
            update.$push = { participaciones_ipevar: { fecha: new Date(), descripcion } };
        } else if (tipo_modulo === 'capacitacion') {
            update.$push = { capacitaciones: { nombre: descripcion, fecha: new Date() } };
        } else if (tipo_modulo === 'ats') {
            update.$push = { ats: { fecha: new Date(), descripcion } };
        }

        if (pts !== 0) {
            update.$inc = { percepcionRiesgoScore: pts };
            if (!update.$push) update.$push = {};
            update.$push.percepcionRiesgoHistorial = {
                fecha: new Date(), accion: descripcion, puntos: pts, modulo: tipo_modulo, referencia,
            };
        }

        await SgsstWorker.updateOne({ _id: worker._id }, update);
    } catch (e) {
        console.error('[Feed Worker Event Error]', e);
    }
}
module.exports = feedWorkerEvent;
