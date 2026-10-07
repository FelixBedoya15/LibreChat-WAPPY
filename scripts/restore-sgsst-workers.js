/**
 * Script de Restauración y Reconciliación Maestra de Trabajadores SG-SST
 * 
 * Recupera todos los trabajadores desde la colección `sgsstworkers` y documentos
 * históricos de `perfilsociodemograficodatas`, garantizando que sus cargos,
 * nombres, documentos y estados de salud queden restaurados en la base de datos activa.
 * 
 * Ejecutar con:
 *   node scripts/restore-sgsst-workers.js
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';

async function restoreSgsstWorkers() {
    console.log('====================================================');
    console.log('Iniciando Restauración Maestra de Trabajadores SG-SST');
    console.log('====================================================');

    const shouldCloseConnection = mongoose.connection.readyState === 0;

    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGO_URI);
            console.log('Conectado exitosamente a MongoDB.');
        }

        const db = mongoose.connection.db;

        // 1. Obtener todos los perfiles de cargo para resolver cargos por perfilId si falta
        const cargoDocs = await db.collection('perfilcargodatas').find({}).toArray();
        const cargosById = new Map();
        for (const cDoc of cargoDocs) {
            for (const p of (cDoc.perfilesList || [])) {
                if (p.id && p.nombreCargo) cargosById.set(String(p.id), p.nombreCargo);
                if (p._id && p.nombreCargo) cargosById.set(String(p._id), p.nombreCargo);
            }
        }
        console.log(`Cargos conocidos indexados: ${cargosById.size}`);

        // 2. Obtener todos los trabajadores individuales de sgsstworkers
        const allSgsstWorkers = await db.collection('sgsstworkers').find({}).toArray();
        console.log(`Trabajadores encontrados en sgsstworkers: ${allSgsstWorkers.length}`);

        // 3. Obtener todos los documentos de perfilsociodemograficodatas
        const socioDocs = await db.collection('perfilsociodemograficodatas').find({}).toArray();
        console.log(`Documentos encontrados en perfilsociodemograficodatas: ${socioDocs.length}`);

        // Agrupar trabajadores por userId
        const users = new Set([
            ...allSgsstWorkers.map(w => String(w.user)),
            ...socioDocs.map(d => String(d.user))
        ]);

        let totalRecuperados = 0;

        for (const userIdStr of users) {
            if (!userIdStr || userIdStr === 'undefined' || userIdStr === 'null') continue;
            let userObjId;
            try {
                userObjId = new mongoose.Types.ObjectId(userIdStr);
            } catch (_) {
                continue;
            }

            // Obtener todos los trabajadores individuales de este usuario
            const userSgsstWorkers = allSgsstWorkers.filter(w => String(w.user) === userIdStr);

            // Obtener todos los documentos socio de este usuario
            const userSocioDocs = socioDocs.filter(d => String(d.user) === userIdStr);

            // Mapa maestro consolidado por identificación o id
            const workerMap = new Map();

            // Primero, cargar los que ya estén en cualquier documento socio de este usuario
            for (const doc of userSocioDocs) {
                for (const w of (doc.trabajadores || [])) {
                    const key = String(w.identificacion || w.id || '').trim();
                    if (key) {
                        if (!workerMap.has(key)) {
                            workerMap.set(key, { ...w });
                        } else {
                            const cur = workerMap.get(key);
                            workerMap.set(key, {
                                ...w,
                                ...cur,
                                cargo: cur.cargo || w.cargo || '',
                                nombre: cur.nombre || w.nombre || '',
                            });
                        }
                    }
                }
            }

            // Segundo, incorporar/restaurar los de sgsstworkers
            for (const sw of userSgsstWorkers) {
                const key = String(sw.documento || sw._id || '').trim();
                const resolvedCargo = sw.cargo || (sw.perfilId ? cargosById.get(String(sw.perfilId)) : '') || '';

                if (!workerMap.has(key)) {
                    workerMap.set(key, {
                        id: sw._id ? sw._id.toString() : new mongoose.Types.ObjectId().toString(),
                        nombre: sw.nombre || 'Colaborador',
                        identificacion: String(sw.documento || '').trim(),
                        cargo: resolvedCargo,
                        genero: sw.genero || '',
                        fechaNacimiento: sw.fechaNacimiento ? new Date(sw.fechaNacimiento).toISOString().split('T')[0] : '',
                        enfermedades: sw.condicionesSalud || '',
                        observaciones: sw.observaciones || '',
                        estadoLaboral: 'Activo',
                        biocentricScore: 100,
                        biocentricAlerts: [],
                        biocentricIsLethal: false,
                        completedByAI: false,
                        consentimientoFirmaDigital: 'No',
                        firmaDigital: null
                    });
                } else {
                    const cur = workerMap.get(key);
                    if ((!cur.cargo || !cur.cargo.trim()) && resolvedCargo) {
                        cur.cargo = resolvedCargo;
                    }
                    if ((!cur.nombre || cur.nombre === 'Colaborador') && sw.nombre) {
                        cur.nombre = sw.nombre;
                    }
                    if (!cur.enfermedades && sw.condicionesSalud) {
                        cur.enfermedades = sw.condicionesSalud;
                    }
                    cur.estadoLaboral = cur.estadoLaboral || 'Activo';
                }
            }

            const consolidatedWorkers = Array.from(workerMap.values());
            console.log(`Usuario ${userIdStr}: Total trabajadores consolidados y restaurados: ${consolidatedWorkers.length}`);

            for (const w of consolidatedWorkers) {
                console.log(` -> [RESTAURADO] ${w.nombre} | CC: ${w.identificacion} | Cargo: "${w.cargo || 'Sin cargo'}"`);
            }

            // Actualizar o crear los documentos de perfilsociodemograficodatas para este usuario
            if (userSocioDocs.length > 0) {
                for (const doc of userSocioDocs) {
                    await db.collection('perfilsociodemograficodatas').updateOne(
                        { _id: doc._id },
                        { $set: { trabajadores: consolidatedWorkers, updatedAt: new Date() } }
                    );
                }
            } else if (consolidatedWorkers.length > 0) {
                // Crear documento si no existía ninguno
                await db.collection('perfilsociodemograficodatas').insertOne({
                    user: userObjId,
                    trabajadores: consolidatedWorkers,
                    actualizacionesPendientes: [],
                    actualizacionesPendientesSalud: [],
                    updatedAt: new Date()
                });
            }

            // Actualizar workerCount en la empresa
            await db.collection('companyinfos').updateMany(
                { user: userObjId },
                { $set: { workerCount: consolidatedWorkers.filter(w => (w.estadoLaboral || 'Activo') !== 'Retirado').length } }
            );

            totalRecuperados += consolidatedWorkers.length;
        }

        console.log('====================================================');
        console.log(`Restauración completada. Total colaboradores verificados: ${totalRecuperados}`);
        console.log('====================================================');

    } catch (err) {
        console.error('Error durante la restauración:', err);
    } finally {
        if (shouldCloseConnection) {
            await mongoose.disconnect();
            console.log('Desconectado de MongoDB.');
        }
    }
}

if (require.main === module) {
    restoreSgsstWorkers();
}

module.exports = { restoreSgsstWorkers };
