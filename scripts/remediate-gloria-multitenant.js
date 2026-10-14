/**
 * Script de remediación de datos para la cuenta de gloriaqq2905@gmail.com
 * Aísla y limpia los datos cruzados entre Conexión Total y Forja Corp.
 */
const mongoose = require('mongoose');

async function remediate() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
  console.log('[Remediación] Conectando a MongoDB en', mongoUri);
  await mongoose.connect(mongoUri);

  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const CompanyInfo = mongoose.models.CompanyInfo || mongoose.model('CompanyInfo', new mongoose.Schema({}, { strict: false }));
  const PESVSession = mongoose.models.PESVWorkspaceSession || mongoose.model('PESVWorkspaceSession', new mongoose.Schema({}, { strict: false }));
  const GTC45Session = mongoose.models.GTC45WorkspaceSession || mongoose.model('GTC45WorkspaceSession', new mongoose.Schema({}, { strict: false }));
  const KanbanTask = mongoose.models.KanbanTask || mongoose.model('KanbanTask', new mongoose.Schema({}, { strict: false }));
  const PerfilCargo = mongoose.models.PerfilCargoData || mongoose.model('PerfilCargoData', new mongoose.Schema({}, { strict: false }));
  const SgsstWorker = mongoose.models.SgsstWorker || mongoose.model('SgsstWorker', new mongoose.Schema({}, { strict: false }));
  const PerfilSocio = mongoose.models.PerfilSociodemograficoData || mongoose.model('PerfilSociodemograficoData', new mongoose.Schema({}, { strict: false }));

  const user = await User.findOne({ email: 'gloriaqq2905@gmail.com' });
  if (!user) {
    console.error('[Remediación] Usuario gloriaqq2905@gmail.com no encontrado.');
    process.exit(1);
  }

  const userId = user._id.toString();
  console.log(`[Remediación] Usuario: ${user.email} (ID: ${userId})`);

  const companies = await CompanyInfo.find({ user: userId }).lean();
  console.log(`[Remediación] Empresas encontradas (${companies.length}):`);
  companies.forEach(c => console.log(` - ID: ${c._id} | Nombre: ${c.companyName} | NIT: ${c.nit} | Activa: ${c.isActive}`));

  const conexionTotal = companies.find(c => (c.companyName || '').toUpperCase().includes('CONEXI') || (c.nit || '').includes('901372998'));
  const forjaCorp = companies.find(c => (c.companyName || '').toUpperCase().includes('FORJA') || (c.nit || '').includes('901646706'));

  if (!conexionTotal || !forjaCorp) {
    console.warn('[Remediación] No se identificaron ambas empresas automáticamente por nombre/NIT.');
  }

  const cConexionId = conexionTotal?._id ? conexionTotal._id.toString() : '6a5510b3055cb35473bd354a';
  const cForjaId = forjaCorp?._id ? forjaCorp._id.toString() : '6ac30f0eb6d19dfa3549983e';

  console.log(`[Remediación] Conexión Total ID: ${cConexionId}`);
  console.log(`[Remediación] Forja Corp ID: ${cForjaId}`);

  // 1. Reasignar sesiones PESV de Conexión Total que cayeron en Forja Corp
  const pesvSessions = await PESVWorkspaceSession.find({
    $or: [
      { companyId: cForjaId },
      { companyId: new mongoose.Types.ObjectId(cForjaId) }
    ]
  });

  console.log(`[Remediación] Sesiones PESV actualmente asignadas a Forja Corp: ${pesvSessions.length}`);
  for (const sess of pesvSessions) {
    const rows = sess.matrixRows || [];
    const isConexionData = rows.some(r => 
      (r.cargo || '').toLowerCase().includes('instalador') ||
      (r.cargo || '').toLowerCase().includes('motociclista') ||
      (r.proceso || '').toLowerCase().includes('terciaria') ||
      (r.peligro_descripcion || '').toLowerCase().includes('vial') ||
      (r.contexto || '').toLowerCase().includes('cetinet')
    );
    if (isConexionData || sess.conversationId?.includes('temp-pesv') || sess.conversationId === 'c69dc31b-2760-4c2c-a544-56e3b6aa8a4d') {
      console.log(` -> Reasignando sesión PESV "${sess.conversationId}" a Conexión Total...`);
      await PESVWorkspaceSession.updateOne(
        { _id: sess._id },
        { 
          $set: { 
            companyId: new mongoose.Types.ObjectId(cConexionId),
            conversationId: sess.conversationId.replace(cForjaId, cConexionId)
          } 
        }
      );
    }
  }

  // 2. Limpiar tareas Kanban de Forja Corp que provienen de los riesgos GTC-45 de Conexión Total
  const forjaTasks = await KanbanTask.find({
    $or: [
      { companyId: cForjaId },
      { companyId: new mongoose.Types.ObjectId(cForjaId) }
    ]
  });
  console.log(`[Remediación] Tareas Kanban actualmente en Forja Corp: ${forjaTasks.length}`);

  let deletedTasks = 0;
  for (const task of forjaTasks) {
    const isCetinetOrCross = 
      (task.title || '').toLowerCase().includes('instalador') ||
      (task.title || '').toLowerCase().includes('terciaria') ||
      (task.title || '').toLowerCase().includes('redes') ||
      (task.title || '').toLowerCase().includes('fibra') ||
      (task.description || '').toLowerCase().includes('cetinet') ||
      (task.description || '').toLowerCase().includes('conexión') ||
      (task.description || '').toLowerCase().includes('instalador');
    
    // Si la tarea fue auto-generada por IPEVAR de Conexión Total
    if (isCetinetOrCross || task.sourceModule === 'sgsst_ipevar_auto') {
      await KanbanTask.deleteOne({ _id: task._id });
      deletedTasks++;
    }
  }
  console.log(`[Remediación] Tareas espurias eliminadas de Forja Corp: ${deletedTasks}`);

  // 3. Limpiar cargos vacíos en Conexión Total
  const perfilesDoc = await PerfilCargo.findOne({
    $or: [
      { companyId: cConexionId },
      { companyId: new mongoose.Types.ObjectId(cConexionId) }
    ]
  });
  if (perfilesDoc && Array.isArray(perfilesDoc.perfilesList)) {
    const initialLen = perfilesDoc.perfilesList.length;
    perfilesDoc.perfilesList = perfilesDoc.perfilesList.filter(p => p && p.nombreCargo && p.nombreCargo.trim());
    if (perfilesDoc.perfilesList.length !== initialLen) {
      console.log(`[Remediación] Limpiados ${initialLen - perfilesDoc.perfilesList.length} cargos vacíos en Conexión Total.`);
      await PerfilCargo.updateOne({ _id: perfilesDoc._id }, { $set: { perfilesList: perfilesDoc.perfilesList } });
    }
  }

  // 4. Asegurar que los trabajadores de Conexión Total pertenezcan explícitamente a Conexión Total
  const workers = await SgsstWorker.find({ user: userId });
  console.log(`[Remediación] Trabajadores totales del usuario: ${workers.length}`);
  for (const w of workers) {
    if (!w.companyId) {
      console.log(` -> Asignando trabajador ${w.nombre} (${w.documento}) a Conexión Total...`);
      await SgsstWorker.updateOne({ _id: w._id }, { $set: { companyId: new mongoose.Types.ObjectId(cConexionId) } });
    }
  }

  console.log('[Remediación] Proceso completado exitosamente.');
  await mongoose.disconnect();
}

remediate().catch(err => {
  console.error('[Remediación] Error crítico:', err);
  process.exit(1);
});
