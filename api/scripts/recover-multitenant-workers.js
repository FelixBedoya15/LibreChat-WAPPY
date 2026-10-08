/**
 * RECUPERACIÓN MULTIEMPRESA DE TRABAJADORES (Perfil Sociodemográfico / Condiciones de Salud)
 *
 * Contexto: el script eliminado `restore-sgsst-workers.js` (commit dba50e3a62, 2026-10-07 17:40)
 * agrupó trabajadores por usuario ignorando companyId y escribió la lista combinada en TODOS los
 * documentos `perfilsociodemograficodatas` del usuario. Además, GET /data mezclaba los otros
 * documentos del usuario.
 *
 * Fuente de verdad para reconstruir: colección `sgsstworkers` (cada trabajador con user + companyId),
 * que NO fue modificada en membresía por el bug (los upserts quedaron en false).
 *
 * Reglas por cada documento con companyId C del usuario U:
 *   1. Trabajador con cédula/id registrado en sgsstworkers {U, C}           → SE CONSERVA.
 *   2. Trabajador registrado en sgsstworkers de OTRA empresa de U (no en C) → SE RETIRA de C.
 *   3. Huérfano (no está en sgsstworkers de ninguna empresa de U):
 *      a. Si solo aparece en UN documento del usuario (agregado después del daño) → se conserva ahí.
 *      b. Si aparece en varios → se asigna a la empresa del vecino más cercano en el orden de la
 *         lista combinada (el script concatenaba documento por documento).
 *   4. Documentos legados creados por el script (sin companyId, sin createdAt/__v) → se eliminan.
 *   5. workerCount de cada empresa se recalcula.
 *
 * Uso (dentro del contenedor LibreChat):
 *   node api/scripts/recover-multitenant-workers.js            # SIMULACIÓN (no escribe nada)
 *   node api/scripts/recover-multitenant-workers.js --apply    # aplica (con respaldo previo)
 *   node api/scripts/recover-multitenant-workers.js --user <userId> [--apply]
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
const APPLY = process.argv.includes('--apply');
const USER_IDX = process.argv.indexOf('--user');
const ONLY_USER = USER_IDX > -1 ? process.argv[USER_IDX + 1] : null;
const BACKUP_COLLECTION = 'recovery_backup_perfilsocio_20261008';

const keyOf = (w) => String(w?.identificacion || w?.id || '').trim();
const isActive = (w) => {
  const est = String(w?.estadoLaboral || w?.estado || '').toLowerCase().trim();
  return est !== 'retirado' && est !== 'inactivo';
};

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  console.log(`\n=== RECUPERACIÓN MULTIEMPRESA — modo ${APPLY ? 'APLICAR' : 'SIMULACIÓN'} ===\n`);

  const userFilter = ONLY_USER ? { user: new mongoose.Types.ObjectId(ONLY_USER) } : {};
  const socioDocs = await db.collection('perfilsociodemograficodatas').find(userFilter).toArray();
  const sgsstWorkers = await db
    .collection('sgsstworkers')
    .find(userFilter, { projection: { user: 1, companyId: 1, documento: 1, cargo: 1 } })
    .toArray();

  // Membership: user -> companyId -> { docs:Set, ids:Set, cargoByDoc:Map }
  const membership = new Map();
  for (const sw of sgsstWorkers) {
    if (!sw.user || !sw.companyId) continue;
    const u = String(sw.user);
    const c = String(sw.companyId);
    if (!membership.has(u)) membership.set(u, new Map());
    const byCo = membership.get(u);
    if (!byCo.has(c)) byCo.set(c, { docs: new Set(), ids: new Set(), cargoByDoc: new Map() });
    const m = byCo.get(c);
    const d = String(sw.documento || '').trim();
    if (d) {
      m.docs.add(d);
      if (sw.cargo) m.cargoByDoc.set(d, sw.cargo);
    }
    m.ids.add(String(sw._id));
  }

  // ── Asignaciones manuales basadas en evidencia (cargos de Perfiles de Cargo + orden de concatenación
  //    + referencias en otras colecciones) para usuarios con sgsstworkers incompleto ──
  const OVERRIDES = {
    '69bc806befe0904050aeea41': {
      // DANIEL OCTAVIO JARAMILLO JARAMILLO (primer segmento de la lista combinada)
      '69be0b9e69a57d6575ea8f15': ['1037323005'],
      // COOPERATIVA INTEGRAL DE JARDIN LTDA. (bloque importado en mayúsculas + Operador de estación de servicio)
      '6a70bee5414a24585bedc816': ['70811420', '71724986', '1037322431', '1041229443', '1000400740',
        '1037636158', '1037324928', '1001396104', '1037326832', '1037322719'],
    },
  };
  for (const [u, byCompany] of Object.entries(OVERRIDES)) {
    if (ONLY_USER && ONLY_USER !== u) continue;
    if (!membership.has(u)) membership.set(u, new Map());
    const byCo = membership.get(u);
    for (const [c, cedulas] of Object.entries(byCompany)) {
      if (!byCo.has(c)) byCo.set(c, { docs: new Set(), ids: new Set(), cargoByDoc: new Map() });
      cedulas.forEach((d) => byCo.get(c).docs.add(d));
    }
  }

  const docsByUser = new Map();
  for (const d of socioDocs) {
    const u = String(d.user);
    if (!docsByUser.has(u)) docsByUser.set(u, []);
    docsByUser.get(u).push(d);
  }

  const stats = {
    usuarios: 0, docsRevisados: 0, docsCorregidos: 0, retirados: 0, conservados: 0,
    huerfanosUnicos: 0, huerfanosVecino: 0, huerfanosSinAsignar: 0, legadosEliminados: 0,
  };
  const updates = []; // { _id, companyId, before, after }
  const deletions = [];

  for (const [u, docs] of docsByUser) {
    stats.usuarios++;
    const byCo = membership.get(u) || new Map();

    const findCompaniesOf = (w) => {
      const k = keyOf(w);
      const wid = String(w?.id || '');
      const res = [];
      for (const [c, m] of byCo) if ((k && m.docs.has(k)) || (wid && m.ids.has(wid))) res.push(c);
      return res;
    };

    // Count in how many docs of this user each worker key appears
    const appearances = new Map();
    for (const d of docs) {
      const seen = new Set();
      for (const w of d.trabajadores || []) {
        const k = keyOf(w);
        if (k && !seen.has(k)) { seen.add(k); appearances.set(k, (appearances.get(k) || 0) + 1); }
      }
    }

    for (const d of docs) {
      stats.docsRevisados++;
      const list = Array.isArray(d.trabajadores) ? d.trabajadores : [];

      // Legacy docs created by the faulty script
      if (!d.companyId) {
        const createdByScript = !d.createdAt && d.__v === undefined;
        if (createdByScript && byCo.size > 0) {
          deletions.push(d);
          stats.legadosEliminados++;
          console.log(`[ELIMINAR LEGADO] user=${u} doc=${d._id} (${list.length} trabajadores combinados)`);
        }
        continue;
      }

      const C = String(d.companyId);
      if (!byCo.has(C) && byCo.size === 0) continue; // no evidence at all for this user → skip

      const owners = list.map(findCompaniesOf);
      const kept = [];
      let removed = 0;

      list.forEach((w, i) => {
        const k = keyOf(w);
        const own = owners[i];
        if (own.includes(C)) {
          // Duplicate cédula across companies → restore the cargo of THIS company
          const m = byCo.get(C);
          const cargoC = m?.cargoByDoc.get(k);
          kept.push(own.length > 1 && cargoC ? { ...w, cargo: cargoC } : w);
          return;
        }
        if (own.length > 0) { removed++; return; } // belongs to another company

        // Orphan
        if ((appearances.get(k) || 0) <= 1 || docs.filter((x) => x.companyId).length <= 1) {
          kept.push(w); stats.huerfanosUnicos++; return;
        }
        // Nearest neighbour heuristic (prefer preceding, then following)
        let assigned = null;
        for (let j = i - 1; j >= 0 && !assigned; j--) if (owners[j].length === 1) assigned = owners[j][0];
        for (let j = i + 1; j < list.length && !assigned; j++) if (owners[j].length === 1) assigned = owners[j][0];
        if (assigned === C) { kept.push(w); stats.huerfanosVecino++; }
        else if (!assigned) { kept.push(w); stats.huerfanosSinAsignar++; }
        else removed++;
      });

      stats.retirados += removed;
      stats.conservados += kept.length;
      const changed = removed > 0 || kept.some((w) => !list.includes(w));
      if (changed) {
        stats.docsCorregidos++;
        updates.push({ _id: d._id, companyId: d.companyId, before: list.length, after: kept, original: d });
        console.log(`[CORREGIR] user=${u} empresa=${C} : ${list.length} → ${kept.length} (retirados ${removed})`);
      }
    }
  }

  console.log('\n=== RESUMEN ===');
  console.table(stats);

  if (!APPLY) {
    console.log('\nSIMULACIÓN: no se escribió nada. Ejecute con --apply para aplicar.\n');
    await mongoose.disconnect();
    return;
  }

  // ── Backup of every document that will be touched ──
  const backup = db.collection(BACKUP_COLLECTION);
  const toBackup = [...updates.map((x) => x.original), ...deletions];
  if (toBackup.length) {
    await backup.insertMany(
      toBackup.map((doc) => ({ originalId: doc._id, backedUpAt: new Date(), doc })),
      { ordered: false },
    );
    console.log(`Respaldo guardado en colección ${BACKUP_COLLECTION}: ${toBackup.length} documentos`);
  }

  for (const upd of updates) {
    await db.collection('perfilsociodemograficodatas').updateOne(
      { _id: upd._id },
      { $set: { trabajadores: upd.after, updatedAt: new Date() } },
    );
    await db.collection('companyinfos').updateOne(
      { _id: upd.companyId },
      { $set: { workerCount: upd.after.filter(isActive).length } },
    );
  }
  for (const del of deletions) {
    await db.collection('perfilsociodemograficodatas').deleteOne({ _id: del._id });
  }

  // Recalcular workerCount de todas las empresas con documento propio
  const allCoDocs = await db
    .collection('perfilsociodemograficodatas')
    .find({ ...userFilter, companyId: { $ne: null } }, { projection: { companyId: 1, trabajadores: 1 } })
    .toArray();
  for (const d of allCoDocs) {
    await db.collection('companyinfos').updateOne(
      { _id: d.companyId },
      { $set: { workerCount: (d.trabajadores || []).filter(isActive).length } },
    );
  }

  console.log(`\nAPLICADO: ${updates.length} documentos corregidos, ${deletions.length} legados eliminados.\n`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('ERROR en recuperación:', err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
