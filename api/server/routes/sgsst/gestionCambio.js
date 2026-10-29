const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const SgsstGestionCambioData = require('~/models/SgsstGestionCambioData');
const SgsstComprasData = require('~/models/SgsstComprasData');
const OportunidadesData = require('~/models/OportunidadesData');
const ContextoData = require('~/models/ContextoData');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
const { SgsstCopasstActa } = require('~/models/SgsstCopasst');
const DiagnosticoData = require('~/models/DiagnosticoData');
const AuditoriaData = require('~/models/AuditoriaData');
const KanbanTask = require('~/models/KanbanTask');
const { saveConvo } = require('~/models/Conversation');
const { saveMessage } = require('~/models/Message');
const { updateTagsForConversation } = require('~/models/ConversationTag');
const { generateWithKeyRotation } = require('./sgsstGemini');
const { gatherCompanyFullContext, resolveUserAndCompany } = require('./contexto');
const {
  buildStandardHeader,
  buildCompanyContextString,
  buildSignatureSection,
} = require('./reportHeader');

const router = express.Router();

function round2(val) {
  const num = Number(val || 0);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(2));
}

function parseGeminiJson(rawText) {
  let cleaned = String(rawText || '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    (firstBracket === -1 || firstBrace < firstBracket)
  ) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }
  return JSON.parse(cleaned);
}

/**
 * Cruza las colecciones reales del SG-SST para construir métricas y detectar cambios internos/externos
 */
async function gatherGestionCambioEcosystemData(userId, companyId, company) {
  const filter = { user: userId, ...(companyId ? { companyId } : {}) };

  try {
    require('./matriz');
    require('./perfilesCargo');
    require('./estudioPuestoTrabajo');
    require('./metodoOwas');
    require('./programaCapacitaciones');
    require('./altaDireccion');
    require('./matrizPeligros');
  } catch (_) {}

  const MatrizLegalData = mongoose.models.MatrizLegalData;
  const PerfilCargoData = mongoose.models.PerfilCargoData;
  const EstudioPuestoTrabajo = mongoose.models.EstudioPuestoTrabajo;
  const MetodoOwasData = mongoose.models.MetodoOwasData;
  const ProgramaCapacitacionesData = mongoose.models.ProgramaCapacitacionesData;
  const AltaDireccionData = mongoose.models.AltaDireccionData;
  const MatrizPeligrosData = mongoose.models.MatrizPeligrosData;

  const [
    comprasDoc,
    matrizLegalDoc,
    perfilesDoc,
    eptDocs,
    owasDoc,
    oportDoc,
    ctxDoc,
    gtc45Session,
    matrizPelDoc,
    copasstActas,
    capDoc,
    diagDoc,
    auditDoc,
    altaDirDoc,
    kanbanTasks,
  ] = await Promise.all([
    SgsstComprasData.findOne(filter).lean().catch(() => null),
    MatrizLegalData ? MatrizLegalData.findOne(filter).lean().catch(() => null) : null,
    PerfilCargoData ? PerfilCargoData.findOne(filter).lean().catch(() => null) : null,
    EstudioPuestoTrabajo ? EstudioPuestoTrabajo.find(filter).lean().catch(() => []) : [],
    MetodoOwasData ? MetodoOwasData.findOne(filter).lean().catch(() => null) : null,
    OportunidadesData.findOne(filter).lean().catch(() => null),
    ContextoData.findOne(filter).lean().catch(() => null),
    GTC45WorkspaceSession.findOne(filter)
      .sort({ isOfficial: -1, updatedAt: -1 })
      .lean()
      .catch(() => null),
    MatrizPeligrosData ? MatrizPeligrosData.findOne(filter).lean().catch(() => null) : null,
    SgsstCopasstActa ? SgsstCopasstActa.find(filter).lean().catch(() => []) : [],
    ProgramaCapacitacionesData
      ? ProgramaCapacitacionesData.findOne(filter).lean().catch(() => null)
      : null,
    DiagnosticoData.findOne(filter).lean().catch(() => null),
    AuditoriaData.findOne(filter).lean().catch(() => null),
    AltaDireccionData ? AltaDireccionData.findOne(filter).lean().catch(() => null) : null,
    KanbanTask.find({
      user: userId,
      ...(companyId ? { companyId: String(companyId) } : {}),
    })
      .lean()
      .catch(() => []),
  ]);

  const comprasList = Array.isArray(comprasDoc?.compras) ? comprasDoc.compras : [];
  const comprasMaquinariaQuimicos = comprasList.filter((c) =>
    /maquinaria|qu[ií]mic|altura|automotor|mobiliario/i.test(c.categoria || '')
  );

  const legalStatuses = Array.isArray(matrizLegalDoc?.statuses) ? matrizLegalDoc.statuses : [];
  const legalPending = legalStatuses.filter(
    (s) => s.status === 'no_cumple' || s.status === 'parcial' || s.status === 'pendiente'
  );

  const perfilesList = Array.isArray(perfilesDoc?.perfiles)
    ? perfilesDoc.perfiles
    : Array.isArray(perfilesDoc?.perfilesList)
      ? perfilesDoc.perfilesList
      : [];
  const owasEvaluaciones = Array.isArray(owasDoc?.evaluaciones) ? owasDoc.evaluaciones : [];
  const owasCriticos = owasEvaluaciones.filter((e) => Number(e.categoriaAccion || 1) >= 3);

  const oportunidadesList = Array.isArray(oportDoc?.oportunidades) ? oportDoc.oportunidades : [];
  const dofaList = Array.isArray(ctxDoc?.dofaList) ? ctxDoc.dofaList : [];

  const gtcRows = Array.isArray(gtc45Session?.matrixRows)
    ? gtc45Session.matrixRows
    : Array.isArray(gtc45Session?.rows)
      ? gtc45Session.rows
      : [];
  let gtcPeligrosTotal = gtcRows.length;
  let gtcCriticosCount = gtcRows.filter((r) =>
    /\b(I|II)\b|no aceptable|cr[ií]tico|alto/i.test(
      `${r.interpretacion_nr || r.nivel_riesgo || ''} ${r.aceptabilidad || ''}`
    )
  ).length;

  if (gtcPeligrosTotal === 0 && matrizPelDoc && Array.isArray(matrizPelDoc.procesos)) {
    matrizPelDoc.procesos.forEach((p) => {
      (p.peligros || []).forEach((pel) => {
        gtcPeligrosTotal++;
        if (
          /\b(I|II)\b|no aceptable|cr[ií]tico|alto/i.test(
            `${pel.interpretacionNR || ''} ${pel.aceptabilidad || ''}`
          )
        ) {
          gtcCriticosCount++;
        }
      });
    });
  }

  const copasstMeetingsCount = Array.isArray(copasstActas) ? copasstActas.length : 0;

  const sesionesCap = Array.isArray(capDoc?.sesiones) ? capDoc.sesiones : [];
  const capCompletadas = sesionesCap.filter(
    (s) => String(s.estado || '').toLowerCase() === 'completada'
  ).length;
  const capacitacionesCompliancePct =
    sesionesCap.length > 0 ? round2((capCompletadas / sesionesCap.length) * 100) : 100;

  const diagnosticoScore = round2(diagDoc?.score || 0);
  const est2111Item = Array.isArray(diagDoc?.statusData)
    ? diagDoc.statusData.find(
        (s) =>
          String(s.code || s.itemId || '').includes('2.11.1') ||
          String(s.itemId || '') === '2_11_1'
      )
    : null;
  const estandar2111Status = est2111Item?.status || 'cumple';

  const auditoriaScore = round2(
    auditDoc?.compliancePercentage || auditDoc?.weightedPercentage || auditDoc?.score || 0
  );
  const aud2111Item = Array.isArray(auditDoc?.statusData)
    ? auditDoc.statusData.find(
        (s) =>
          String(s.itemId || s.code || '').includes('2_11_1') ||
          String(s.code || '').includes('2.11.1')
      )
    : null;
  const aud2111Status = aud2111Item?.status || 'conforme';

  const altaDirItems = Array.isArray(altaDirDoc?.statusData) ? altaDirDoc.statusData : [];
  const altaDireccionCumple = altaDirItems.filter((i) => i.status === 'cumple').length;
  const altaDireccionPendientes = altaDirItems.filter(
    (i) => i.status === 'no_cumple' || i.status === 'pendiente'
  ).length;

  const acpmMocTasks = (kanbanTasks || []).filter((t) =>
    /cambio|moc-|2\.11\.1|8\.1\.3|2\.2\.4\.6\.26/i.test(
      `${t.sourceModule || ''} ${t.title || ''} ${t.referenceId || ''}`
    )
  );
  const acpmPendingCount = acpmMocTasks.filter((t) => t.status !== 'done').length;

  return {
    comprasList,
    comprasMaquinariaQuimicos,
    legalStatuses,
    legalPending,
    perfilesList,
    eptDocs: eptDocs || [],
    owasEvaluaciones,
    owasCriticos,
    oportunidadesList,
    dofaList,
    gtcPeligrosTotal,
    gtcCriticosCount,
    copasstMeetingsCount,
    capacitacionesCount: sesionesCap.length,
    capacitacionesCompliancePct,
    diagnosticoScore,
    estandar2111Status,
    estandar2111Cumple: estandar2111Status === 'cumple',
    auditoriaScore,
    aud2111Status,
    altaDireccionCumple,
    altaDireccionPendientes,
    acpmMocCount: acpmMocTasks.length,
    acpmPendingCount,
    company,
  };
}

/**
 * Construye candidatos reales de Gestión del Cambio (MOC) desde el ecosistema Somos SST
 */
function buildMocCandidatesFromEcosystem(eco, company) {
  const today = new Date().toISOString().split('T')[0];
  const respDefault = company?.responsibleSST || 'Responsable SG-SST';
  const candidates = [];

  // 1. Desde Compras y Adquisiciones SST (Maquinaria, Sustancias Químicas SGA, Alturas)
  for (const compra of (eco.comprasMaquinariaQuimicos || []).slice(0, 2)) {
    const isQuimico = /qu[ií]mic|sga/i.test(compra.categoria || '');
    const isMaquinaria = /maquinaria|herramienta/i.test(compra.categoria || '');
    candidates.push({
      titulo: `Incorporación operativa de: ${compra.productoServicio}`,
      tipoCambio: isQuimico
        ? 'Sustancia Química / Insumo'
        : isMaquinaria
          ? 'Maquinaria / Equipo'
          : 'Procedimiento / Método',
      origen: 'Interno',
      temporalidad: 'Permanente',
      fuenteEcosistema: 'Compras y Adquisiciones SST',
      descripcion: `Puesta en servicio de ${compra.productoServicio} (${compra.cantidadUnidad || 'Lote'}) suministrado por ${compra.proveedorSugerido || 'Proveedor Autorizado'} bajo norma ${compra.normaTecnica || 'NTC/ANSI'}.`,
      peligrosNuevos: isQuimico
        ? 'Exposición por inhalación o contacto dérmico a vapores/líquidos químicos e incompatibilidad en almacenamiento.'
        : 'Riesgo mecánico por partes en movimiento, proyección de partículas, ruido ocupacional y contacto eléctrico.',
      nivelRiesgoCambio: isQuimico || isMaquinaria ? 'Alto' : 'Medio',
      controlesRequeridos: `${compra.especificacionesSST || 'Verificación preoperacional y certificación técnica.'} Actualizar Matriz IPEVR (GTC 45), socializar FDS/manual operativo y capacitar a los trabajadores antes del arranque.`,
      modulosImpactados: isQuimico
        ? ['Matriz IPEVR (GTC 45)', 'Inventario Químico SGA', 'Programa de Capacitaciones', 'Matriz de EPP']
        : ['Matriz IPEVR (GTC 45)', 'Programa de Capacitaciones', 'Análisis de Trabajo Seguro (ATS)', 'Matriz de EPP'],
      requiereCapacitacion: true,
      socializadoCopasst: true,
      responsable: compra.responsableEvaluacion || respDefault,
      fechaPropuesta: compra.fechaEvaluacion || today,
      estado:
        compra.dictamenSST === 'Aprobado para Compra' ? 'Aprobado con Controles' : 'En Evaluación',
    });
  }

  // 2. Desde Estudio de Puesto de Trabajo / Ergonomía OWAS
  if ((eco.eptDocs?.length || 0) > 0 || (eco.owasCriticos?.length || 0) > 0) {
    const ept = eco.eptDocs?.[0];
    candidates.push({
      titulo: ept?.cargo
        ? `Rediseño ergonómico y adaptación biomecánica del puesto: ${ept.cargo}`
        : 'Rediseño ergonómico de estaciones de trabajo y ayudas mecánicas (OWAS / EPT)',
      tipoCambio: 'Locativo / Infraestructura',
      origen: 'Interno',
      temporalidad: 'Permanente',
      fuenteEcosistema: 'Estudio de Puesto / Ergonomía',
      descripcion:
        'Adecuación de alturas de planos de trabajo, dotación de mobiliario regulable NTC 5655 y estandarización de higiene postural según hallazgos biomecánicos.',
      peligrosNuevos:
        'Posturas transitorias de adaptación durante el ajuste de estaciones e interferencia locativa menor durante la instalación.',
      nivelRiesgoCambio: 'Medio',
      controlesRequeridos:
        'Verificación antropométrica individual (Índice FIT), capacitación en higiene postural y seguimiento en el SVE Osteomuscular.',
      modulosImpactados: [
        'Matriz IPEVR (GTC 45)',
        'Perfiles de Cargo',
        'Programa de Capacitaciones',
        'COPASST',
      ],
      requiereCapacitacion: true,
      socializadoCopasst: true,
      responsable: respDefault,
      fechaPropuesta: today,
      estado: 'Aprobado con Controles',
    });
  }

  // 3. Desde Matriz Legal SG-SST (Cambios Externos / Normativos)
  if ((eco.legalStatuses?.length || 0) > 0) {
    candidates.push({
      titulo:
        'Actualización reglamentaria por nuevas disposiciones legales en SST (Res. 3461/2025 · Ley 2365/2024 · Pesv/Alturas)',
      tipoCambio: 'Legislación / Normativo',
      origen: 'Externo / Legal',
      temporalidad: 'Permanente',
      fuenteEcosistema: 'Matriz Legal SG-SST',
      descripcion:
        'Alineación de reglamentos internos, protocolos de convivencia laboral, seguridad vial y estándares operativos frente a cambios en la legislación nacional vigente.',
      peligrosNuevos:
        'Riesgo jurídico-sancionatorio y brechas de cumplimiento en estándares mínimos si no se actualizan los procedimientos y competencias.',
      nivelRiesgoCambio: 'Alto',
      controlesRequeridos:
        'Actualización de Matriz Legal, reforma de protocolos internos, socialización con el COPASST/COCOLA y reinducción a todos los niveles.',
      modulosImpactados: [
        'Matriz Legal SG-SST',
        'Programa de Capacitaciones',
        'COPASST',
        'Perfiles de Cargo',
      ],
      requiereCapacitacion: true,
      socializadoCopasst: true,
      responsable: respDefault,
      fechaPropuesta: today,
      estado: 'Implementado',
    });
  }

  // 4. Desde Oportunidades SST / Contexto DOFA (ISO 45001 Cl. 6.1)
  if ((eco.oportunidadesList?.length || 0) > 0) {
    const op = eco.oportunidadesList[0];
    candidates.push({
      titulo: `Implementación de mejora estratégica: ${op.titulo}`,
      tipoCambio: 'Tecnología / Digitalización',
      origen: 'Interno',
      temporalidad: 'Permanente',
      fuenteEcosistema: 'Riesgos y Oportunidades ISO 45001',
      descripcion:
        op.beneficioEsperado ||
        'Modernización de controles operacionales y digitalización de registros preventivos del SG-SST.',
      peligrosNuevos:
        'Curva de aprendizaje del personal operativo y coexistencia temporal entre formatos físicos y digitales.',
      nivelRiesgoCambio: 'Bajo',
      controlesRequeridos:
        'Entrenamiento práctico a líderes de proceso y trabajadores, acompañamiento en terreno y validación en Auditoría Interna.',
      modulosImpactados: ['Programa de Capacitaciones', 'Matriz IPEVR (GTC 45)', 'COPASST'],
      requiereCapacitacion: true,
      socializadoCopasst: true,
      responsable: op.responsable || respDefault,
      fechaPropuesta: today,
      estado: 'Aprobado con Controles',
    });
  }

  // 5. Asegurar registros base realistas
  const fallbackDefaults = [
    {
      titulo: 'Reconfiguración de layout operativo y demarcación de pasillos peatonales/vehiculares',
      tipoCambio: 'Locativo / Infraestructura',
      origen: 'Interno',
      temporalidad: 'Permanente',
      fuenteEcosistema: 'Solicitud Operativa',
      descripcion:
        'Redistribución de zonas de almacenamiento y tránsito interno para segregar flujo peatonal de equipos de movilización de cargas.',
      peligrosNuevos:
        'Peligro locativo y mecánico durante las obras de adecuación, ruido puntual y modificación de rutas de evacuación.',
      nivelRiesgoCambio: 'Alto',
      controlesRequeridos:
        'Aislamiento y señalización de obra, actualización de planos de evacuación en el Plan de Emergencias (PPRE), ATS y socialización previa.',
      modulosImpactados: [
        'Matriz IPEVR (GTC 45)',
        'Plan de Emergencias (PPRE)',
        'Programa de Capacitaciones',
        'COPASST',
      ],
      requiereCapacitacion: true,
      socializadoCopasst: true,
      responsable: respDefault,
      fechaPropuesta: today,
      estado: 'Aprobado con Controles',
    },
    {
      titulo: 'Sustitución de insumos químicos convencionales por desengrasantes biodegradables SGA',
      tipoCambio: 'Sustancia Química / Insumo',
      origen: 'Interno',
      temporalidad: 'Permanente',
      fuenteEcosistema: 'Inventario Químico SGA',
      descripcion:
        'Reemplazo de solventes inflamables/irritantes por productos acuosos biodegradables con menor toxicidad ocupacional.',
      peligrosNuevos:
        'Reacción por mezcla accidental con remanentes del producto anterior y necesidad de disposición RESPEL de envases antiguos.',
      nivelRiesgoCambio: 'Medio',
      controlesRequeridos:
        'Revisión de FDS de 16 secciones (Dec. 1496/2018), actualización de Matriz de Compatibilidad Química SGA y reentrenamiento en manejo.',
      modulosImpactados: [
        'Matriz IPEVR (GTC 45)',
        'Inventario Químico SGA',
        'Matriz de EPP',
        'Programa de Capacitaciones',
      ],
      requiereCapacitacion: true,
      socializadoCopasst: true,
      responsable: respDefault,
      fechaPropuesta: today,
      estado: 'En Evaluación',
    },
    {
      titulo: 'Actualización de estructura organizacional, nuevos cargos operativos y reasignación de funciones SST',
      tipoCambio: 'Personal / Organizacional',
      origen: 'Interno',
      temporalidad: 'Permanente',
      fuenteEcosistema: 'Revisión por la Alta Dirección',
      descripcion:
        'Incorporación de nuevos roles operativos y actualización de responsabilidades en el SG-SST para cubrir expansión de operaciones.',
      peligrosNuevos:
        'Carga mental por adaptación al rol y desconocimiento inicial de procedimientos de tareas críticas si se omite la inducción específica.',
      nivelRiesgoCambio: 'Medio',
      controlesRequeridos:
        'Actualización de Perfiles de Cargo, examen médico preocupacional (Compatibilidad FIT), Inducción SG-SST y entrega de dotación EPP.',
      modulosImpactados: [
        'Perfiles de Cargo',
        'Programa de Capacitaciones',
        'Matriz de EPP',
        'Matriz IPEVR (GTC 45)',
      ],
      requiereCapacitacion: true,
      socializadoCopasst: true,
      responsable: respDefault,
      fechaPropuesta: today,
      estado: 'Implementado',
    },
  ];

  for (const fb of fallbackDefaults) {
    if (candidates.length >= 5) break;
    if (
      !candidates.some(
        (c) => c.titulo.toLowerCase().slice(0, 18) === fb.titulo.toLowerCase().slice(0, 18)
      )
    ) {
      candidates.push(fb);
    }
  }

  return candidates.map((item, idx) => ({
    ...item,
    id: item.id || `moc_seed_${Date.now()}_${idx}`,
    codigo: item.codigo || `MOC-2026-${String(idx + 1).padStart(3, '0')}`,
    modulosImpactados: Array.isArray(item.modulosImpactados)
      ? item.modulosImpactados
      : ['Matriz IPEVR (GTC 45)', 'Programa de Capacitaciones'],
    sentToKanban: Boolean(item.sentToKanban),
  }));
}

function buildGestionCambioMetrics(mocList = [], eco = {}) {
  const totalMoc = mocList.length;
  const implementadosCount = mocList.filter((m) => m.estado === 'Implementado').length;
  const aprobadosCount = mocList.filter((m) => m.estado === 'Aprobado con Controles').length;
  const enEvaluacionCount = mocList.filter((m) => m.estado === 'En Evaluación').length;
  const borradorCount = mocList.filter((m) => m.estado === 'Borrador').length;

  const criticosAltosCount = mocList.filter(
    (m) => m.nivelRiesgoCambio === 'Crítico' || m.nivelRiesgoCambio === 'Alto'
  ).length;
  const internosCount = mocList.filter((m) => m.origen === 'Interno').length;
  const externosCount = totalMoc - internosCount;

  const socializadosCopasstCount = mocList.filter((m) => m.socializadoCopasst).length;
  const copasstSocializadoPct =
    totalMoc > 0 ? round2((socializadosCopasstCount / totalMoc) * 100) : 100;

  const conCapacitacionCount = mocList.filter((m) => m.requiereCapacitacion).length;
  const gestionadosPct =
    totalMoc > 0 ? round2(((implementadosCount + aprobadosCount) / totalMoc) * 100) : 100;

  return {
    totalMoc,
    implementadosCount,
    aprobadosCount,
    enEvaluacionCount,
    borradorCount,
    criticosAltosCount,
    internosCount,
    externosCount,
    socializadosCopasstCount,
    copasstSocializadoPct,
    conCapacitacionCount,
    gestionadosPct,
    comprasRegistradasCount: eco.comprasList?.length || 0,
    comprasMaquinariaQuimicosCount: eco.comprasMaquinariaQuimicos?.length || 0,
    matrizLegalTotal: eco.legalStatuses?.length || 0,
    matrizLegalPendientes: eco.legalPending?.length || 0,
    cargosCount: eco.perfilesList?.length || 0,
    estudiosPuestoCount: eco.eptDocs?.length || 0,
    owasCount: eco.owasEvaluaciones?.length || 0,
    owasCriticosCount: eco.owasCriticos?.length || 0,
    oportunidadesCount: eco.oportunidadesList?.length || 0,
    dofaCount: eco.dofaList?.length || 0,
    gtc45PeligrosCount: eco.gtcPeligrosTotal || 0,
    gtc45CriticosCount: eco.gtcCriticosCount || 0,
    copasstActasCount: eco.copasstMeetingsCount || 0,
    capacitacionesCount: eco.capacitacionesCount || 0,
    capacitacionesCompliancePct: round2(eco.capacitacionesCompliancePct ?? 100),
    diagnosticoScore: round2(eco.diagnosticoScore || 0),
    estandar2111Status: eco.estandar2111Status || 'cumple',
    estandar2111Cumple: Boolean(eco.estandar2111Cumple ?? true),
    auditoriaScore: round2(eco.auditoriaScore || 0),
    aud2111Status: eco.aud2111Status || 'conforme',
    altaDireccionCumple: eco.altaDireccionCumple || 0,
    altaDireccionPendientes: eco.altaDireccionPendientes || 0,
    acpmMocCount: eco.acpmMocCount || 0,
    acpmPendingCount: eco.acpmPendingCount || 0,
  };
}

/**
 * GET /api/sgsst/gestion-cambio/data
 * Carga las solicitudes de Gestión del Cambio (MOC) y métricas 360° del ecosistema.
 */
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, eco] = await Promise.all([
      SgsstGestionCambioData.findOne(filter).lean(),
      gatherGestionCambioEcosystemData(userId, companyId, company),
    ]);

    let mocList = Array.isArray(existingDoc?.mocList) ? existingDoc.mocList : [];

    if (mocList.length === 0) {
      mocList = buildMocCandidatesFromEcosystem(eco, company);
      if (userId && mongoose.isValidObjectId(userId)) {
        await SgsstGestionCambioData.findOneAndUpdate(
          filter,
          {
            $set: {
              mocList,
              companyId,
              updatedAt: new Date(),
            },
          },
          { upsert: true, new: true }
        ).catch((e) => logger.warn('[SGSST GestionCambio] Auto-seed save warning:', e.message));
      }
    }

    const ecosystemMetrics = buildGestionCambioMetrics(mocList, eco);

    return res.json({
      mocList,
      lastGeneratedReport: existingDoc?.lastGeneratedReport || '',
      conversationId: existingDoc?.conversationId || null,
      messageId: existingDoc?.messageId || null,
      company,
      ecosystemMetrics,
    });
  } catch (error) {
    logger.error('[SGSST GestionCambio] GET /data error:', error);
    return res.status(500).json({
      error: 'Error al cargar los datos de Gestión del Cambio en SST (MOC).',
    });
  }
});

/**
 * POST /api/sgsst/gestion-cambio/data
 * Guarda la lista de solicitudes de cambio (MOC) en MongoDB.
 */
router.post('/data', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const { mocList, lastGeneratedReport, conversationId, messageId } = req.body;

    const normalizedMocList = Array.isArray(mocList)
      ? mocList.map((m, idx) => ({
          id: m.id || `moc_${Date.now()}_${idx}`,
          codigo: m.codigo || `MOC-2026-${String(idx + 1).padStart(3, '0')}`,
          titulo: String(m.titulo || 'Solicitud de Cambio SST').trim(),
          tipoCambio: m.tipoCambio || 'Maquinaria / Equipo',
          origen: m.origen || 'Interno',
          temporalidad: m.temporalidad || 'Permanente',
          fuenteEcosistema: m.fuenteEcosistema || 'Solicitud Operativa',
          descripcion: m.descripcion || '',
          peligrosNuevos: m.peligrosNuevos || '',
          nivelRiesgoCambio: m.nivelRiesgoCambio || 'Medio',
          controlesRequeridos: m.controlesRequeridos || '',
          modulosImpactados: Array.isArray(m.modulosImpactados)
            ? m.modulosImpactados
            : ['Matriz IPEVR (GTC 45)', 'Programa de Capacitaciones'],
          requiereCapacitacion:
            m.requiereCapacitacion !== undefined ? Boolean(m.requiereCapacitacion) : true,
          socializadoCopasst:
            m.socializadoCopasst !== undefined ? Boolean(m.socializadoCopasst) : true,
          responsable: m.responsable || company?.responsibleSST || 'Responsable SG-SST',
          fechaPropuesta: m.fechaPropuesta || new Date().toISOString().split('T')[0],
          estado: m.estado || 'En Evaluación',
          sentToKanban: Boolean(m.sentToKanban),
        }))
      : undefined;

    const updateFields = {
      companyId,
      updatedAt: new Date(),
    };
    if (normalizedMocList !== undefined) updateFields.mocList = normalizedMocList;
    if (lastGeneratedReport !== undefined) updateFields.lastGeneratedReport = lastGeneratedReport;
    if (conversationId !== undefined) updateFields.conversationId = conversationId;
    if (messageId !== undefined) updateFields.messageId = messageId;

    const updated = await SgsstGestionCambioData.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { upsert: true, new: true }
    ).lean();

    const eco = await gatherGestionCambioEcosystemData(userId, companyId, company);
    const ecosystemMetrics = buildGestionCambioMetrics(updated?.mocList || [], eco);

    return res.json({
      success: true,
      data: updated,
      mocList: updated?.mocList || [],
      ecosystemMetrics,
    });
  } catch (error) {
    logger.error('[SGSST GestionCambio] POST /data error:', error);
    return res.status(500).json({
      error: 'Error al guardar el Padrón de Gestión del Cambio (MOC).',
    });
  }
});

/**
 * POST /api/sgsst/gestion-cambio/sync-ecosystem
 * Sincroniza cambios detectados desde Compras SST, Matriz Legal, Ergonomía EPT/OWAS, Oportunidades ISO 45001 y Alta Dirección sin duplicar.
 */
router.post('/sync-ecosystem', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, eco] = await Promise.all([
      SgsstGestionCambioData.findOne(filter).lean(),
      gatherGestionCambioEcosystemData(userId, companyId, company),
    ]);

    const currentMocList = Array.isArray(existingDoc?.mocList) ? [...existingDoc.mocList] : [];
    const norm = (s) => String(s || '').trim().toLowerCase();
    const existingKeys = new Set(currentMocList.map((m) => norm(m.titulo)));

    const candidates = buildMocCandidatesFromEcosystem(eco, company);
    const today = new Date().toISOString().split('T')[0];
    const respDefault = company?.responsibleSST || 'Responsable SG-SST';

    // Agregar adquisiciones adicionales de Compras SST que impliquen cambio tecnológico/químico/equipos
    for (const compra of (eco.comprasList || []).slice(0, 4)) {
      candidates.push({
        titulo: `Gestión del Cambio por adquisición: ${compra.productoServicio}`,
        tipoCambio: /qu[ií]mic/i.test(compra.categoria || '')
          ? 'Sustancia Química / Insumo'
          : /maquinaria/i.test(compra.categoria || '')
            ? 'Maquinaria / Equipo'
            : 'Procedimiento / Método',
        origen: 'Interno',
        temporalidad: 'Permanente',
        fuenteEcosistema: 'Compras y Adquisiciones SST',
        descripcion: `Ingreso de ${compra.productoServicio} (${compra.categoria}) con norma ${compra.normaTecnica || 'NTC/ANSI'}.`,
        peligrosNuevos:
          'Introducción de nuevos factores de riesgo operacionales si no se verifica capacitación e inspección preoperacional.',
        nivelRiesgoCambio: 'Medio',
        controlesRequeridos: `${compra.especificacionesSST || 'Validación de ficha técnica y entrega controlada.'}`,
        modulosImpactados: ['Matriz IPEVR (GTC 45)', 'Programa de Capacitaciones', 'Matriz de EPP'],
        requiereCapacitacion: true,
        socializadoCopasst: true,
        responsable: compra.responsableEvaluacion || respDefault,
        fechaPropuesta: compra.fechaEvaluacion || today,
        estado:
          compra.dictamenSST === 'Aprobado para Compra'
            ? 'Aprobado con Controles'
            : 'En Evaluación',
      });
    }

    let addedCount = 0;
    for (const cand of candidates) {
      const key = norm(cand.titulo);
      if (!key || existingKeys.has(key)) continue;
      const nextNum = currentMocList.length + 1;
      currentMocList.push({
        ...cand,
        id: `moc_sync_${Date.now()}_${nextNum}`,
        codigo: `MOC-2026-${String(nextNum).padStart(3, '0')}`,
        sentToKanban: false,
      });
      existingKeys.add(key);
      addedCount++;
    }

    await SgsstGestionCambioData.findOneAndUpdate(
      filter,
      {
        $set: {
          mocList: currentMocList,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const ecosystemMetrics = buildGestionCambioMetrics(currentMocList, eco);

    return res.json({
      success: true,
      addedCount,
      mocList: currentMocList,
      ecosystemMetrics,
      message:
        addedCount > 0
          ? `Sincronización 360° completada: se importaron +${addedCount} solicitudes de Gestión del Cambio (MOC) desde Compras SST, Matriz Legal, Ergonomía y Oportunidades.`
          : 'El Registro de Gestión del Cambio (MOC) ya se encuentra 100% sincronizado con el ecosistema Somos SST.',
    });
  } catch (error) {
    logger.error('[SGSST GestionCambio] POST /sync-ecosystem error:', error);
    return res.status(500).json({
      error: 'Error al sincronizar Gestión del Cambio con el ecosistema Somos SST.',
    });
  }
});

/**
 * POST /api/sgsst/gestion-cambio/ai-suggest
 * Usa generateWithKeyRotation para sugerir y añadir 3 a 4 evaluaciones de Gestión del Cambio (MOC) con análisis de impacto.
 */
async function handleAiSuggestGestionCambio(req, res) {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const { modelName, customPrompt } = req.body || {};
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, eco, fullContext] = await Promise.all([
      SgsstGestionCambioData.findOne(filter).lean(),
      gatherGestionCambioEcosystemData(userId, companyId, company),
      gatherCompanyFullContext(userId, companyId),
    ]);

    const currentMocList = Array.isArray(existingDoc?.mocList) ? [...existingDoc.mocList] : [];
    const companyContextStr = buildCompanyContextString(company || {});
    const existingListStr = currentMocList
      .slice(0, 10)
      .map((m) => `- ${m.codigo}: ${m.titulo} (${m.tipoCambio})`)
      .join('\n');

    const promptText = `Eres un Especialista Sénior en Gestión del Cambio en SST (MOC - Management of Change) bajo Decreto 1072 de 2015 Art. 2.2.4.6.26, Resolución 0312 de 2019 Estándar 2.11.1 e ISO 45001:2018 Cláusula 8.1.3.

=== CONTEXTO REAL DE LA EMPRESA ===
${companyContextStr}
- Peligros GTC-45: ${eco.gtcPeligrosTotal} (${eco.gtcCriticosCount} críticos).
- Adquisiciones en Compras SST: ${eco.comprasList.length}.
- Cargos registrados: ${eco.perfilesList.length} · Estudios Ergonómicos EPT/OWAS: ${eco.eptDocs.length + eco.owasEvaluaciones.length}.
- Normas en Matriz Legal: ${eco.legalStatuses.length}.
${customPrompt ? `\nCambio específico planteado por el usuario: "${customPrompt}"` : ''}

=== CAMBIOS MOC YA REGISTRADOS (NO DUPLICAR) ===
${existingListStr || 'Ninguno aún.'}

Genera entre 3 y 4 NUEVAS solicitudes de Gestión del Cambio (MOC) internas o externas/legales relevantes para esta empresa, identificando peligros nuevos derivados del cambio, controles previos y módulos del SG-SST que deben actualizarse.
RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO:
{
  "nuevosCambios": [
    {
      "titulo": "Título claro y técnico del cambio planificado...",
      "tipoCambio": "Locativo / Infraestructura | Maquinaria / Equipo | Procedimiento / Método | Sustancia Química / Insumo | Personal / Organizacional | Legislación / Normativo | Tecnología / Digitalización",
      "origen": "Interno | Externo / Legal",
      "temporalidad": "Permanente | Temporal | Prueba Piloto",
      "fuenteEcosistema": "Compras y Adquisiciones SST | Matriz Legal SG-SST | Estudio de Puesto / Ergonomía | Auditoría Interna 1072 | Revisión por la Alta Dirección | Inventario Químico SGA | Riesgos y Oportunidades ISO 45001 | Solicitud Operativa",
      "descripcion": "Descripción técnica detallada del cambio...",
      "peligrosNuevos": "Peligros y riesgos nuevos o modificados que introduce el cambio en SST...",
      "nivelRiesgoCambio": "Crítico | Alto | Medio | Bajo",
      "controlesRequeridos": "Medidas de prevención y control obligatorias antes de poner en marcha el cambio...",
      "modulosImpactados": ["Matriz IPEVR (GTC 45)", "Programa de Capacitaciones", "COPASST", "Perfiles de Cargo", "Plan de Emergencias (PPRE)", "Matriz de EPP"],
      "requiereCapacitacion": true,
      "socializadoCopasst": true,
      "responsable": "${company?.responsibleSST || 'Responsable SG-SST'}",
      "estado": "En Evaluación | Aprobado con Controles"
    }
  ]
}`;

    const modelToUse = modelName || 'gemini-2.5-flash';
    const today = new Date().toISOString().split('T')[0];
    let aiItems = [];

    try {
      const result = await generateWithKeyRotation(modelToUse, userId, promptText);
      const rawText = (await result.response).text();
      const parsed = parseGeminiJson(rawText);
      aiItems = Array.isArray(parsed?.nuevosCambios)
        ? parsed.nuevosCambios
        : Array.isArray(parsed)
          ? parsed
          : [];
    } catch (aiErr) {
      logger.warn('[SGSST GestionCambio] AI fallback deterministic items:', aiErr.message);
      aiItems = [
        {
          titulo:
            'Automatización de control preoperacional y permisos de trabajo críticos mediante código QR en terreno',
          tipoCambio: 'Tecnología / Digitalización',
          origen: 'Interno',
          temporalidad: 'Permanente',
          fuenteEcosistema: 'Riesgos y Oportunidades ISO 45001',
          descripcion:
            'Transición de listas de chequeo en papel hacia validación digital en tiempo real con bloqueo preventivo por aptitud médica FIT.',
          peligrosNuevos:
            'Omisión de registro por fallas de conectividad o falta de destreza digital en personal de campo durante la transición.',
          nivelRiesgoCambio: 'Bajo',
          controlesRequeridos:
            'Capacitación práctica a trabajadores y contratistas, disponibilidad de plan contingente y auditoría semanal de registros.',
          modulosImpactados: [
            'Programa de Capacitaciones',
            'Análisis de Trabajo Seguro (ATS)',
            'COPASST',
          ],
          requiereCapacitacion: true,
          socializadoCopasst: true,
          responsable: company?.responsibleSST || 'Responsable SG-SST',
          estado: 'Aprobado con Controles',
        },
        {
          titulo:
            'Adecuación de sistema de ventilación localizada y extracción de material particulado/vapores en área operativa',
          tipoCambio: 'Locativo / Infraestructura',
          origen: 'Interno',
          temporalidad: 'Permanente',
          fuenteEcosistema: 'Auditoría Interna 1072',
          descripcion:
            'Instalación de campanas de extracción e inyección de aire fresco para control en el medio de agentes químicos y físicos.',
          peligrosNuevos:
            'Trabajo en alturas durante montaje de ductos, riesgo eléctrico en conexión de motores e incremento puntual de ruido.',
          nivelRiesgoCambio: 'Alto',
          controlesRequeridos:
            'Permiso de Trabajo en Alturas (Res. 4272/2021), aplicación de LOTO eléctrico, medición higiénica post-instalación y actualización GTC 45.',
          modulosImpactados: [
            'Matriz IPEVR (GTC 45)',
            'Plan de Emergencias (PPRE)',
            'COPASST',
            'Matriz de EPP',
          ],
          requiereCapacitacion: true,
          socializadoCopasst: true,
          responsable: company?.responsibleSST || 'Responsable SG-SST',
          estado: 'En Evaluación',
        },
        {
          titulo:
            'Implementación de esquema flexible de turnos operativos y protocolo de prevención de fatiga laboral',
          tipoCambio: 'Personal / Organizacional',
          origen: 'Interno',
          temporalidad: 'Prueba Piloto',
          fuenteEcosistema: 'Estudio de Puesto / Ergonomía',
          descripcion:
            'Ajuste de horarios de rotación de turnos y pausas de recuperación psicofisiológica conforme a reducción de jornada legal (Ley 2101).',
          peligrosNuevos:
            'Riesgo psicosocial por alteración del ciclo circadiano o fatiga aguda en tareas críticas y conducción (PESV).',
          nivelRiesgoCambio: 'Medio',
          controlesRequeridos:
            'Monitoreo con Termómetro Psicosocial, pausas activas dirigidas, socialización con Comité de Convivencia y COPASST.',
          modulosImpactados: [
            'Perfiles de Cargo',
            'Matriz IPEVR (GTC 45)',
            'Programa de Capacitaciones',
            'COPASST',
          ],
          requiereCapacitacion: true,
          socializadoCopasst: true,
          responsable: company?.responsibleSST || 'Responsable SG-SST',
          estado: 'Aprobado con Controles',
        },
      ];
    }

    const norm = (s) => String(s || '').trim().toLowerCase();
    const existingKeys = new Set(currentMocList.map((m) => norm(m.titulo)));
    let addedCount = 0;

    for (const item of aiItems) {
      const title = String(item.titulo || '').trim();
      if (!title || existingKeys.has(norm(title))) continue;
      const nextNum = currentMocList.length + 1;
      currentMocList.push({
        id: `moc_ai_${Date.now()}_${nextNum}`,
        codigo: `MOC-2026-${String(nextNum).padStart(3, '0')}`,
        titulo: title,
        tipoCambio: item.tipoCambio || 'Procedimiento / Método',
        origen: item.origen || 'Interno',
        temporalidad: item.temporalidad || 'Permanente',
        fuenteEcosistema: item.fuenteEcosistema || 'Solicitud Operativa',
        descripcion: item.descripcion || '',
        peligrosNuevos: item.peligrosNuevos || '',
        nivelRiesgoCambio: item.nivelRiesgoCambio || 'Medio',
        controlesRequeridos: item.controlesRequeridos || '',
        modulosImpactados: Array.isArray(item.modulosImpactados)
          ? item.modulosImpactados
          : ['Matriz IPEVR (GTC 45)', 'Programa de Capacitaciones'],
        requiereCapacitacion:
          item.requiereCapacitacion !== undefined ? Boolean(item.requiereCapacitacion) : true,
        socializadoCopasst:
          item.socializadoCopasst !== undefined ? Boolean(item.socializadoCopasst) : true,
        responsable: item.responsable || company?.responsibleSST || 'Responsable SG-SST',
        fechaPropuesta: today,
        estado: item.estado || 'En Evaluación',
        sentToKanban: false,
      });
      existingKeys.add(norm(title));
      addedCount++;
    }

    await SgsstGestionCambioData.findOneAndUpdate(
      filter,
      {
        $set: {
          mocList: currentMocList,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const ecosystemMetrics = buildGestionCambioMetrics(currentMocList, eco);

    return res.json({
      success: true,
      addedCount,
      mocList: currentMocList,
      ecosystemMetrics,
      message: `Se generaron y agregaron +${addedCount} evaluaciones de Gestión del Cambio (MOC) con IA.`,
    });
  } catch (error) {
    logger.error('[SGSST GestionCambio] POST /ai-suggest error:', error);
    return res.status(500).json({
      error: 'Error al generar sugerencias de Gestión del Cambio con IA.',
    });
  }
}

router.post('/ai-suggest', requireJwtAuth, handleAiSuggestGestionCambio);
router.post('/generate-ai', requireJwtAuth, handleAiSuggestGestionCambio);

/**
 * POST /api/sgsst/gestion-cambio/generate
 * Genera el Procedimiento y Matriz Oficial de Gestión del Cambio en SST (MOC)
 * (Dec. 1072 Art. 2.2.4.6.26 · Res. 0312 Est. 2.11.1 · ISO 45001 Cl. 8.1.3)
 */
async function handleGenerateGestionCambioReport(req, res) {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, eco] = await Promise.all([
      SgsstGestionCambioData.findOne(filter).lean(),
      gatherGestionCambioEcosystemData(userId, companyId, company),
    ]);

    const mocList =
      Array.isArray(req.body?.mocList) && req.body.mocList.length > 0
        ? req.body.mocList
        : Array.isArray(existingDoc?.mocList) && existingDoc.mocList.length > 0
          ? existingDoc.mocList
          : buildMocCandidatesFromEcosystem(eco, company);

    const modelName = req.body?.modelName || 'gemini-2.5-flash';
    const metrics = buildGestionCambioMetrics(mocList, eco);

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const headerHtml = buildStandardHeader({
      title: 'PROCEDIMIENTO Y MATRIZ DE GESTIÓN DEL CAMBIO EN SST (MANAGEMENT OF CHANGE - MOC)',
      companyInfo: company,
      date: currentDate,
      norm: 'Decreto 1072 de 2015 Art. 2.2.4.6.26 · Resolución 0312 de 2019 Estándar 2.11.1 · ISO 45001:2018 Cláusula 8.1.3',
      code: 'SST-PR-MOC-001',
      version: '02',
      responsibleName: company?.responsibleSST || req.user?.name,
    });

    let aiAnalysisHtml = '';
    try {
      const aiPrompt = `Eres un Auditor Líder en Gestión del Cambio SG-SST (Dec. 1072/2015 Art. 2.2.4.6.26, Res. 0312/2019 Est. 2.11.1 e ISO 45001:2018 Cl. 8.1.3).
Redacta un Dictamen Técnico de Evaluación de Impacto de Cambios Internos y Externos (2 párrafos ejecutivos y 3 viñetas puntuales en HTML usando únicamente <p>, <strong> y <ul><li> con estilos inline sobrios color #1e293b) para "${company?.companyName || 'la Organización'}".
Datos reales: ${metrics.totalMoc} solicitudes MOC (${metrics.internosCount} internas y ${metrics.externosCount} externas/legales; ${metrics.implementadosCount} implementadas, ${metrics.aprobadosCount} aprobadas con controles, ${metrics.enEvaluacionCount} en evaluación; ${metrics.criticosAltosCount} de riesgo Crítico/Alto). Socialización con COPASST: ${metrics.copasstSocializadoPct}%. Peligros GTC-45: ${metrics.gtc45PeligrosCount}. Adquisiciones vinculadas: ${metrics.comprasRegistradasCount}.
No incluyas bloques markdown \`\`\`html ni encabezados <h1>.`;
      const aiRes = await generateWithKeyRotation(modelName, userId, aiPrompt);
      const rawHtml = String((await aiRes.response).text() || '')
        .replace(/```html\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();
      if (rawHtml.length > 60) {
        aiAnalysisHtml = rawHtml;
      }
    } catch (aiErr) {
      logger.warn('[SGSST GestionCambio] Using deterministic HTML analysis fallback:', aiErr.message);
    }

    if (!aiAnalysisHtml) {
      aiAnalysisHtml = `
        <p style="margin: 0 0 8px 0; font-size: 11.5px; color: #1e293b;">
          En cumplimiento estricto del <strong>Artículo 2.2.4.6.26 del Decreto 1072 de 2015</strong>, el <strong>Estándar 2.11.1 de la Resolución 0312 de 2019</strong> y la <strong>Cláusula 8.1.3 de ISO 45001:2018</strong>, <strong>${company?.companyName || 'la Organización'}</strong> dispone de un procedimiento sistemático para evaluar el impacto sobre la Seguridad y Salud en el Trabajo que puedan generar los cambios internos (introducción de nuevos procesos, cambio en métodos de trabajo, instalaciones, maquinaria o estructura organizacional) y los cambios externos (evolución de la legislación o conocimientos en SST). Actualmente se gestionan <strong>${metrics.totalMoc} solicitudes MOC</strong> con un <strong>${metrics.gestionadosPct}%</strong> de cambios aprobados con controles o implementados y un <strong>${metrics.copasstSocializadoPct}%</strong> de socialización ante el COPASST/Vigía SST.
        </p>
        <ul style="margin: 4px 0 0 0; padding-left: 18px; font-size: 11px; color: #334155;">
          <li><strong>Actualización Obligatoria de la Matriz IPEVR (GTC 45) y Plan de Trabajo Anual:</strong> Todo cambio calificado en nivel Crítico o Alto (${metrics.criticosAltosCount} registros) exige la valoración previa de peligros emergentes en la Matriz GTC-45 (${metrics.gtc45PeligrosCount} peligros activos) antes de autorizar su puesta en marcha.</li>
          <li><strong>Trazabilidad con Compras SST y Matriz Legal:</strong> Las adquisiciones de maquinaria o productos químicos SGA (${metrics.comprasRegistradasCount} compras evaluadas) y las nuevas normas identificadas en la Matriz Legal (${metrics.matrizLegalTotal} normas) disparan automáticamente análisis de impacto MOC.</li>
          <li><strong>Información, Consulta y Capacitación Previa:</strong> Conforme al Parágrafo del Art. 2.2.4.6.26 del Decreto 1072 de 2015, antes de introducir cualquier cambio interno se informa y capacita a los trabajadores y al COPASST (${metrics.conCapacitacionCount} cambios con plan formativo vinculado).</li>
        </ul>`;
    }

    const mocRowsHtml = mocList
      .map((m, idx) => {
        const riskColor =
          m.nivelRiesgoCambio === 'Crítico'
            ? '#b91c1c'
            : m.nivelRiesgoCambio === 'Alto'
              ? '#c2410c'
              : m.nivelRiesgoCambio === 'Medio'
                ? '#b45309'
                : '#047857';
        const estColor =
          m.estado === 'Implementado'
            ? '#0284c7'
            : m.estado === 'Aprobado con Controles'
              ? '#047857'
              : '#b45309';
        const modulosStr = Array.isArray(m.modulosImpactados)
          ? m.modulosImpactados.join(', ')
          : 'Matriz IPEVR (GTC 45)';
        return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10px; color: #1e293b;">
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e; vertical-align: top;">
            ${m.codigo}
            <div style="font-size: 9px; color: #64748b; font-weight: normal; margin-top: 2px;">${m.fechaPropuesta || ''}</div>
            <div style="font-size: 9px; color: #475569; margin-top: 2px;">${m.temporalidad || 'Permanente'}</div>
          </td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; vertical-align: top;">
            <strong>${m.titulo}</strong>
            <div style="font-size: 9px; color: #0f766e; font-weight: 700; margin-top: 2px;">${m.tipoCambio} (${m.origen})</div>
            <div style="font-size: 9px; color: #64748b;">Fuente: ${m.fuenteEcosistema || 'SG-SST'}</div>
          </td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; vertical-align: top;">
            ${m.descripcion}
          </td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; vertical-align: top;">
            <span style="display: inline-block; padding: 1px 6px; background-color: #fef2f2; color: ${riskColor}; border: 1px solid ${riskColor}; font-weight: 700; font-size: 9px; margin-bottom: 3px;">
              Riesgo ${m.nivelRiesgoCambio || 'Medio'}
            </span><br/>
            ${m.peligrosNuevos}
          </td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; vertical-align: top;">
            ${m.controlesRequeridos}
            <div style="font-size: 9px; color: #0f766e; margin-top: 3px;">
              <strong>Módulos a actualizar:</strong> ${modulosStr}
            </div>
          </td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; vertical-align: top; text-align: center;">
            <strong style="color: ${estColor};">${m.estado}</strong>
            <div style="font-size: 9px; color: #475569; margin-top: 2px;">${m.responsable || 'Responsable SG-SST'}</div>
            <div style="font-size: 8.5px; color: #047857; margin-top: 2px;">
              ${m.socializadoCopasst ? '✔ COPASST ' : ''}${m.requiereCapacitacion ? '· ✔ Capacitación' : ''}
            </div>
          </td>
        </tr>`;
      })
      .join('');

    const reportBody = `
<div style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; line-height: 1.55; max-width: 100%;">

  <!-- 1. OBJETO Y ALCANCE -->
  <div style="margin-bottom: 20px; padding: 14px 18px; background-color: #f0fdfa; border-left: 4px solid #0f766e;">
    <h3 style="margin: 0 0 6px 0; color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase;">
      1. Objeto, Alcance y Mandato Legal (Dec. 1072 Art. 2.2.4.6.26 · Res. 0312 Est. 2.11.1 · ISO 45001 Cl. 8.1.3)
    </h3>
    <p style="margin: 0; font-size: 11px; color: #334155;">
      Establecer la metodología preventiva de <strong>Gestión del Cambio (MOC - Management of Change)</strong> en <strong>${company?.companyName || 'la Organización'}</strong> para identificar, evaluar y controlar los riesgos de Seguridad y Salud en el Trabajo derivados de cambios internos (instalaciones, maquinaria, procesos, insumos químicos o personal) y cambios externos (legislación o evolución técnica), actualizando la Matriz IPEVR (GTC 45) y el Plan de Trabajo Anual antes de su implementación.
    </p>
  </div>

  <!-- 2. INDICADORES CONSOLIDADOS MOC -->
  <div style="margin-bottom: 22px;">
    <h3 style="color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      2. Tablero de Control de Gestión del Cambio Operacional y Normativo
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1;">
      <tr style="background-color: #f8fafc;">
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 17px; font-weight: 800; color: #0f766e;">${metrics.totalMoc} (${metrics.internosCount} Int. / ${metrics.externosCount} Ext.)</div>
          <div style="font-size: 9.5px; color: #475569; text-transform: uppercase;">Solicitudes MOC Evaluadas</div>
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 17px; font-weight: 800; color: #047857;">${metrics.gestionadosPct}%</div>
          <div style="font-size: 9.5px; color: #475569; text-transform: uppercase;">Aprobados / Implementados</div>
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 17px; font-weight: 800; color: #0284c7;">${metrics.copasstSocializadoPct}%</div>
          <div style="font-size: 9.5px; color: #475569; text-transform: uppercase;">Socializados con COPASST / Vigía</div>
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 17px; font-weight: 800; color: #b45309;">${metrics.criticosAltosCount} Críticos/Altos</div>
          <div style="font-size: 9.5px; color: #475569; text-transform: uppercase;">Impacto en Matriz GTC-45 (${metrics.gtc45PeligrosCount} Peligros)</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- 3. ETAPAS DEL FLUJO SISTEMÁTICO DE GESTIÓN DEL CAMBIO -->
  <div style="margin-bottom: 22px;">
    <h3 style="color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      3. Flujo Metodológico de 5 Etapas para la Autorización de Cambios en SST
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <tr style="background-color: #0f766e; color: #ffffff;">
        <th style="padding: 7px 9px; border: 1px solid #0f766e; width: 20%; text-align: left;">Etapa MOC</th>
        <th style="padding: 7px 9px; border: 1px solid #0f766e; width: 55%; text-align: left;">Actividad Técnica Obligatoria</th>
        <th style="padding: 7px 9px; border: 1px solid #0f766e; width: 25%; text-align: left;">Registro / Evidencia</th>
      </tr>
      <tr style="background-color: #ffffff;">
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e;">Fase 1. Identificación</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">Radicación previa de la solicitud de cambio (infraestructura, equipos, químicos, procesos, personal o norma legal).</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">Ficha de Solicitud MOC</td>
      </tr>
      <tr style="background-color: #f8fafc;">
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e;">Fase 2. Evaluación IPEVR</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">Identificación de peligros nuevos o conexos y valoración del nivel de riesgo del cambio con apoyo del COPASST.</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">Matriz GTC 45 / Análisis de Impacto</td>
      </tr>
      <tr style="background-color: #ffffff;">
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e;">Fase 3. Plan de Control</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">Definición de controles de ingeniería, administrativos, actualización de PONs, Perfiles de Cargo y Matriz de EPP.</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">Plan de Acción ACPM / PTA</td>
      </tr>
      <tr style="background-color: #f8fafc;">
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e;">Fase 4. Comunicación</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">Informar y capacitar a los trabajadores, contratistas y miembros del COPASST antes de poner en marcha el cambio (Parágrafo Art. 2.2.4.6.26).</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">Acta de Capacitación y Socialización</td>
      </tr>
      <tr style="background-color: #ffffff;">
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e;">Fase 5. Verificación</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">Inspección de puesta en marcha (PSSR) y seguimiento a la eficacia de los controles implementados.</td>
        <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">Cierre de Eficacia MOC</td>
      </tr>
    </table>
  </div>

  <!-- 4. MATRIZ MAESTRA DE SOLICITUDES DE CAMBIO (MOC) -->
  <div style="margin-bottom: 24px;">
    <h3 style="color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      4. Matriz de Evaluación de Impacto y Control de Cambios en el SG-SST (Estándar 2.11.1)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px; border: 1px solid #0f766e; width: 10%; text-align: left;">Código</th>
          <th style="padding: 8px; border: 1px solid #0f766e; width: 19%; text-align: left;">Denominación y Origen</th>
          <th style="padding: 8px; border: 1px solid #0f766e; width: 19%; text-align: left;">Descripción del Cambio</th>
          <th style="padding: 8px; border: 1px solid #0f766e; width: 19%; text-align: left;">Peligros Nuevos y Riesgo</th>
          <th style="padding: 8px; border: 1px solid #0f766e; width: 20%; text-align: left;">Controles y Módulos Impactados</th>
          <th style="padding: 8px; border: 1px solid #0f766e; width: 13%; text-align: center;">Estado y Aval</th>
        </tr>
      </thead>
      <tbody>
        ${mocRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- 5. DICTAMEN TÉCNICO -->
  <div style="margin-bottom: 24px; padding: 14px 18px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0f766e;">
    <h3 style="margin: 0 0 8px 0; color: #0f766e; font-size: 12px; font-weight: 800; text-transform: uppercase;">
      5. Dictamen Técnico de Articulación 360° y Prevención de Riesgos Emergentes
    </h3>
    ${aiAnalysisHtml}
  </div>

</div>`;

    const signaturesHtml = company ? buildSignatureSection(company) : '';
    const fullReportHtml = `${headerHtml}\n${reportBody}\n${signaturesHtml}`;

    let conversationId = existingDoc?.conversationId || null;
    let messageId = existingDoc?.messageId || null;
    try {
      conversationId = crypto.randomUUID();
      messageId = crypto.randomUUID();
      await saveConvo(
        { userId: req.user.id, isTemporary: false },
        {
          conversationId,
          title: `Procedimiento y Matriz de Gestión del Cambio MOC - ${company?.companyName || 'SG-SST'}`,
          endpoint: 'google',
          model: modelName,
        }
      );
      await saveMessage(
        { userId: req.user.id, isTemporary: false },
        {
          messageId,
          conversationId,
          sender: 'Wappy SST',
          text: fullReportHtml,
          isCreatedByUser: false,
          endpoint: 'google',
          model: modelName,
        }
      );
      await updateTagsForConversation(req.user.id, conversationId, ['sgsst-gestion-cambio']);
    } catch (convoErr) {
      logger.debug('[SGSST GestionCambio] Optional conversation save skipped:', convoErr.message);
    }

    await SgsstGestionCambioData.findOneAndUpdate(
      filter,
      {
        $set: {
          mocList,
          lastGeneratedReport: fullReportHtml,
          ...(conversationId ? { conversationId } : {}),
          ...(messageId ? { messageId } : {}),
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      html: fullReportHtml,
      report: fullReportHtml,
      conversationId,
      messageId,
    });
  } catch (error) {
    logger.error('[SGSST GestionCambio] POST /generate error:', error);
    return res.status(500).json({
      error: 'Error al generar el Procedimiento e Informe Oficial de Gestión del Cambio (MOC).',
    });
  }
}

router.post('/generate', requireJwtAuth, handleGenerateGestionCambioReport);
router.post('/generate-report', requireJwtAuth, handleGenerateGestionCambioReport);

/**
 * POST /api/sgsst/gestion-cambio/send-acpm
 * Crea tareas reales en KanbanTask para implementar los controles previos de los cambios MOC.
 */
async function handleSendGestionCambioToAcpm(req, res) {
  try {
    const { targetUserId: userId, company, companyId: rawCompanyId } = await resolveUserAndCompany(req);
    const companyIdStr = rawCompanyId ? String(rawCompanyId) : undefined;
    const filter = { user: userId, ...(rawCompanyId ? { companyId: rawCompanyId } : {}) };

    const { itemId, item, title, description, priority = 'alta', actionType = 'preventiva' } =
      req.body || {};

    const doc = await SgsstGestionCambioData.findOne(filter);
    const mocList = Array.isArray(doc?.mocList) ? doc.mocList : [];

    let targetItems = [];
    if (item && item.titulo) {
      targetItems = [item];
    } else if (itemId) {
      const found = mocList.find((m) => m.id === itemId || m.codigo === itemId);
      if (found) targetItems = [found];
    } else if (title) {
      targetItems = [
        {
          id: `moc_manual_${Date.now()}`,
          codigo: 'MOC-ACPM',
          titulo: title,
          descripcion: description || '',
          controlesRequeridos: description || '',
          nivelRiesgoCambio: 'Alto',
          estado: 'En Evaluación',
        },
      ];
    } else {
      targetItems = mocList.filter(
        (m) => m.estado !== 'Implementado' || !m.sentToKanban
      );
      if (targetItems.length === 0 && mocList.length > 0) {
        targetItems = [mocList[0]];
      }
    }

    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const createdTasks = [];

    for (const m of targetItems.slice(0, 8)) {
      const refId = `moc_${m.id || m.codigo}`;
      const taskTitle =
        title ||
        `[Gestión del Cambio ${m.codigo || ''}] Implementar controles previos SST: ${m.titulo}`;
      const taskDesc =
        description ||
        `Tipo: ${m.tipoCambio || 'Operativo'} (${m.origen || 'Interno'}) | Nivel de Riesgo: ${m.nivelRiesgoCambio || 'Medio'} | Peligros nuevos: ${m.peligrosNuevos || ''} | Controles obligatorios: ${m.controlesRequeridos || ''} | Módulos a actualizar: ${Array.isArray(m.modulosImpactados) ? m.modulosImpactados.join(', ') : 'GTC 45'}`;

      let task = await KanbanTask.findOne({
        user: userId,
        ...(companyIdStr ? { companyId: companyIdStr } : {}),
        referenceId: refId,
      });

      if (task) {
        task.title = taskTitle;
        task.description = taskDesc;
        task.status = 'todo';
        await task.save();
      } else {
        task = await KanbanTask.create({
          user: userId,
          companyId: companyIdStr,
          title: taskTitle,
          description: taskDesc,
          status: 'todo',
          dueDate,
          type: 'other',
          priority:
            m.nivelRiesgoCambio === 'Crítico' || m.nivelRiesgoCambio === 'Alto'
              ? 'alta'
              : ['alta', 'media', 'baja'].includes(priority)
                ? priority
                : 'media',
          actionType: ['correctiva', 'preventiva', 'mejora'].includes(actionType)
            ? actionType
            : 'preventiva',
          sourceModule:
            'Gestión del Cambio en SST - MOC (Est. 2.11.1 · Dec. 1072 Art. 2.2.4.6.26)',
          assignedTo: m.responsable || company?.responsibleSST || 'Responsable SG-SST',
          referenceId: refId,
          referenceName: `${m.codigo || 'MOC'} - ${m.titulo}`,
          deliverable: {
            originModule: 'gestion_cambio',
            displayStatus: 'Por Hacer',
            codigo: m.codigo,
            estado: m.estado,
            nivelRiesgoCambio: m.nivelRiesgoCambio,
          },
        });
      }
      createdTasks.push(task);

      if (doc && Array.isArray(doc.mocList)) {
        doc.mocList.forEach((row) => {
          if (row.id === m.id || row.codigo === m.codigo) {
            row.sentToKanban = true;
          }
        });
      }
    }

    if (doc) {
      doc.markModified('mocList');
      await doc.save();
    }

    return res.json({
      success: true,
      createdCount: createdTasks.length,
      tasks: createdTasks,
      mocList: doc?.mocList || mocList,
      message: `${createdTasks.length} acción(es) de Gestión del Cambio (MOC) enviada(s) al Centro de Control Kanban / ACPM.`,
    });
  } catch (error) {
    logger.error('[SGSST GestionCambio] POST /send-acpm error:', error);
    return res.status(500).json({
      error: 'Error al enviar acciones de Gestión del Cambio al Centro de Control ACPM.',
    });
  }
}

router.post('/send-acpm', requireJwtAuth, handleSendGestionCambioToAcpm);
router.post('/send-to-kanban', requireJwtAuth, handleSendGestionCambioToAcpm);

module.exports = router;
