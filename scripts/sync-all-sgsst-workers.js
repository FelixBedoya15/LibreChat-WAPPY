/**
 * Script de sincronización espejo: PerfilSociodemograficoData -> SgsstWorker
 *
 * Garantiza que cada trabajador presente en el censo maestro de cada empresa
 * tenga su registro espejo en SgsstWorker con { user, companyId, documento }.
 * Esto alimenta correctamente el Carnet Digital, el Hub 360, COPASST, EPP, PESV y LMS.
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';

async function syncAllWorkers() {
  await mongoose.connect(MONGO_URI);
  console.log('[Sync Workers] Conectado a MongoDB.');

  const db = mongoose.connection.db;
  const perfilCol = db.collection('perfilsociodemograficodatas');
  const sgsstCol = db.collection('sgsstworkers');
  const companyCol = db.collection('companyinfos');

  const allPerfilDocs = await perfilCol.find({}).toArray();
  console.log(`[Sync Workers] Total documentos en perfilsociodemograficodatas: ${allPerfilDocs.length}`);

  let totalUpserted = 0;
  let totalProcessed = 0;

  for (const doc of allPerfilDocs) {
    if (!doc.user || !doc.companyId) continue;
    const userId = doc.user instanceof mongoose.Types.ObjectId ? doc.user : new mongoose.Types.ObjectId(doc.user);
    const companyId = doc.companyId instanceof mongoose.Types.ObjectId ? doc.companyId : new mongoose.Types.ObjectId(doc.companyId);
    const trabajadores = Array.isArray(doc.trabajadores) ? doc.trabajadores : [];

    const activeDocsInThisPerfil = new Set();

    for (const w of trabajadores) {
      const cleanDoc = String(w.identificacion || w.id || '').trim();
      if (!cleanDoc) continue;

      totalProcessed++;
      activeDocsInThisPerfil.add(cleanDoc);

      const isRetirado = String(w.estadoLaboral || w.estado || '').toLowerCase().trim() === 'retirado';

      const updateData = {
        $set: {
          user: userId,
          companyId: companyId,
          perfilId: String(w.id || cleanDoc).trim(),
          nombre: String(w.nombre || 'Colaborador').trim(),
          documento: cleanDoc,
          cargo: String(w.cargo || 'Personal Operativo').trim(),
          eps: String(w.eps || '').trim(),
          afp: String(w.afp || '').trim(),
          estadoPila: String(w.estadoPila || 'Pendiente de soporte PILA').trim(),
          estadoLaboral: isRetirado ? 'Retirado' : 'Activo',
          condicionesSalud: String(w.diagnosticoMedico || w.enfermedades || w.condicionesSalud || '').trim(),
          fitScore: (w.biocentricScore !== undefined && w.biocentricScore !== null) ? Number(w.biocentricScore) : 95,
          fitAlerts: Array.isArray(w.biocentricAlerts) ? w.biocentricAlerts : [],
          updatedAt: new Date(),
        },
        $setOnInsert: {
          percepcionRiesgoScore: 0,
          percepcionRiesgoHistorial: [],
          riesgosBioIndividual: [],
          createdAt: new Date(),
        }
      };

      await sgsstCol.updateOne(
        { user: userId, companyId: companyId, documento: cleanDoc },
        updateData,
        { upsert: true }
      );
      totalUpserted++;
    }

    // Actualizar workerCount en CompanyInfo
    const activeCount = trabajadores.filter(w => {
      const est = String(w.estadoLaboral || w.estado || '').toLowerCase().trim();
      return est !== 'retirado' && est !== 'inactivo';
    }).length;

    await companyCol.updateOne(
      { _id: companyId },
      { $set: { workerCount: activeCount, updatedAt: new Date() } }
    );
  }

  console.log(`[Sync Workers] Sincronización completada. Procesados: ${totalProcessed}, Upserts: ${totalUpserted}`);
  await mongoose.disconnect();
}

syncAllWorkers().catch(err => {
  console.error('[Sync Workers] Error fatal:', err);
  process.exit(1);
});
