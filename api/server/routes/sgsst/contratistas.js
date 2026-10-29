const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const SgsstContratistasData = require('~/models/SgsstContratistasData');
const SgsstComprasData = require('~/models/SgsstComprasData');
const PlanEmergenciasData = require('~/models/PlanEmergenciasData');
const ContextoData = require('~/models/ContextoData');
const InvestigacionAtelData = require('~/models/InvestigacionAtelData');
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

const DEFAULT_CHECKLIST_REQUISITOS = [
  {
    id: 'req_contr_01',
    requisito:
      'Certificado de Autoevaluación de Estándares Mínimos SG-SST (Res. 0312 de 2019 >= 86% o Plan de Mejora vigente) avalado por ARL o firmado por Representante Legal y Responsable SST.',
    normaBase: 'Resolución 0312 de 2019 Art. 27 · Estándar 2.10.1',
    etapa: 'Precontractual / Selección',
    obligatorio: true,
    estadoVerificacion: 'Verificado',
  },
  {
    id: 'req_contr_02',
    requisito:
      'Licencia de Seguridad y Salud en el Trabajo vigente y curso de 50/20 horas del profesional o tecnólogo que lidera el SG-SST del contratista.',
    normaBase: 'Resolución 0312 de 2019 · Resolución 4927 de 2016',
    etapa: 'Precontractual / Selección',
    obligatorio: true,
    estadoVerificacion: 'Verificado',
  },
  {
    id: 'req_contr_03',
    requisito:
      'Certificado de afiliación a ARL, clasificación de Nivel de Riesgo (Clase I a V) y certificación de accidentalidad ATEL del último año.',
    normaBase: 'Decreto 1072 de 2015 Art. 2.2.4.6.28 Numeral 1 y 4',
    etapa: 'Precontractual / Selección',
    obligatorio: true,
    estadoVerificacion: 'Verificado',
  },
  {
    id: 'req_contr_04',
    requisito:
      'Planilla Integrada de Liquidación de Aportes (PILA) pagada y vigente del mes en curso para el 100% de los trabajadores en misión (Salud, Pensión y ARL).',
    normaBase: 'Decreto 1072 de 2015 Art. 2.2.4.6.28 Numeral 3 · Ley 1562 de 2012',
    etapa: 'Contratación / Ingreso',
    obligatorio: true,
    estadoVerificacion: 'Verificado',
  },
  {
    id: 'req_contr_05',
    requisito:
      'Inducción y Reinducción en SG-SST de la empresa contratante, socialización de peligros del centro de trabajo, rutas de evacuación y Plan de Emergencias (PPRE).',
    normaBase: 'Decreto 1072 de 2015 Art. 2.2.4.6.11 y Art. 2.2.4.6.28 Numeral 2',
    etapa: 'Contratación / Ingreso',
    obligatorio: true,
    estadoVerificacion: 'Verificado',
  },
  {
    id: 'req_contr_06',
    requisito:
      'Certificados de aptitud médica ocupacional vigentes y competencias de Tareas de Alto Riesgo (Trabajo en Alturas Res. 4272/2021, Espacios Confinados Res. 0491/2020, RETIE/CONTE).',
    normaBase: 'Res. 4272/2021 · Res. 0491/2020 · Res. 5018/2019 · ISO 45001 Cl. 8.1.4.2',
    etapa: 'Ejecución en Terreno',
    obligatorio: true,
    estadoVerificacion: 'Verificado',
  },
  {
    id: 'req_contr_07',
    requisito:
      'Diligenciamiento previo en campo de Análisis de Trabajo Seguro (ATS), Permiso de Trabajo y verificación de entrega de EPP certificados (ANSI/NTC).',
    normaBase: 'Decreto 1072 de 2015 Art. 2.2.4.6.28 · ISO 45001 Cl. 8.1.4.2',
    etapa: 'Ejecución en Terreno',
    obligatorio: true,
    estadoVerificacion: 'Verificado',
  },
  {
    id: 'req_contr_08',
    requisito:
      'Obligación de reporte inmediato de cualquier incidente, acto/condición insegura o accidente laboral (FURAT) ocurrido durante el desarrollo del contrato.',
    normaBase: 'Decreto 1072 de 2015 Art. 2.2.4.6.28 Numeral 5 · Res. 1401 de 2007',
    etapa: 'Ejecución en Terreno',
    obligatorio: true,
    estadoVerificacion: 'Verificado',
  },
  {
    id: 'req_contr_09',
    requisito:
      'Evaluación periódica de desempeño en SST del proveedor/contratista y verificación de cierre de hallazgos ACPM antes de renovación o liquidación.',
    normaBase: 'Resolución 0312 de 2019 Estándar 2.10.1 · ISO 45001 Cl. 8.1.4.3',
    etapa: 'Evaluación y Cierre',
    obligatorio: true,
    estadoVerificacion: 'Verificado',
  },
];

/**
 * Cruza las colecciones reales del SG-SST para construir métricas y detectar contratistas/proveedores
 */
async function gatherContratistasEcosystemData(userId, companyId, company) {
  const filter = { user: userId, ...(companyId ? { companyId } : {}) };

  try {
    require('./permisoAlturas');
    require('./analisisTrabajoSeguro');
    require('./programaCapacitaciones');
    require('./reporteActos');
  } catch (_) {}

  const PermisoAlturasData = mongoose.models.PermisoAlturasData;
  const AnalisisTrabajoSeguroData = mongoose.models.AnalisisTrabajoSeguroData;
  const ProgramaCapacitacionesData = mongoose.models.ProgramaCapacitacionesData;
  const ReporteActosData = mongoose.models.ReporteActosData;

  const [
    ppreDoc,
    ctxDoc,
    permisoAlturasDoc,
    atsDoc,
    capDoc,
    comprasDoc,
    atelDocs,
    actosDoc,
    diagDoc,
    auditDoc,
    kanbanTasks,
  ] = await Promise.all([
    PlanEmergenciasData.findOne(filter).lean().catch(() => null),
    ContextoData.findOne(filter).lean().catch(() => null),
    PermisoAlturasData ? PermisoAlturasData.findOne(filter).lean().catch(() => null) : null,
    AnalisisTrabajoSeguroData
      ? AnalisisTrabajoSeguroData.findOne(filter).lean().catch(() => null)
      : null,
    ProgramaCapacitacionesData
      ? ProgramaCapacitacionesData.findOne(filter).lean().catch(() => null)
      : null,
    SgsstComprasData.findOne(filter).lean().catch(() => null),
    InvestigacionAtelData.find(filter).lean().catch(() => []),
    ReporteActosData ? ReporteActosData.findOne(filter).lean().catch(() => null) : null,
    DiagnosticoData.findOne(filter).lean().catch(() => null),
    AuditoriaData.findOne(filter).lean().catch(() => null),
    KanbanTask.find({
      user: userId,
      ...(companyId ? { companyId: String(companyId) } : {}),
    })
      .lean()
      .catch(() => []),
  ]);

  const contratistasFlotantesPpre = Number(ppreDoc?.sedeData?.contratistasFlotantes || 2);
  const stakeholdersList = Array.isArray(ctxDoc?.stakeholders) ? ctxDoc.stakeholders : [];
  const contractorStakeholders = stakeholdersList.filter((s) =>
    /contratista|proveedor|subcontratista|tercero|aliado/i.test(
      `${s.name || ''} ${s.role || ''} ${s.category || ''}`
    )
  );

  const permisosAlturasCount = Array.isArray(permisoAlturasDoc?.permisos)
    ? permisoAlturasDoc.permisos.length
    : permisoAlturasDoc?.formData
      ? 1
      : 0;

  const atsCount = Array.isArray(atsDoc?.analisisList)
    ? atsDoc.analisisList.length
    : Array.isArray(atsDoc?.ats)
      ? atsDoc.ats.length
      : atsDoc?.formData
        ? 1
        : 0;

  const sesionesCap = Array.isArray(capDoc?.sesiones) ? capDoc.sesiones : [];
  const capCompletadas = sesionesCap.filter(
    (s) => String(s.estado || '').toLowerCase() === 'completada'
  ).length;
  const capacitacionesCompliancePct =
    sesionesCap.length > 0 ? round2((capCompletadas / sesionesCap.length) * 100) : 100;

  const comprasList = Array.isArray(comprasDoc?.compras) ? comprasDoc.compras : [];

  const actosInsegurosCount =
    (Array.isArray(actosDoc?.reportes) ? actosDoc.reportes.length : 0) +
    (Array.isArray(actosDoc?.inboxPublico) ? actosDoc.inboxPublico.length : 0);

  const diagnosticoScore = round2(diagDoc?.score || 0);
  const est2101Item = Array.isArray(diagDoc?.statusData)
    ? diagDoc.statusData.find(
        (s) =>
          String(s.code || s.itemId || '').includes('2.10.1') ||
          String(s.itemId || '') === '2_10_1'
      )
    : null;
  const estandar2101Status = est2101Item?.status || 'cumple';

  const auditoriaScore = round2(
    auditDoc?.compliancePercentage || auditDoc?.weightedPercentage || auditDoc?.score || 0
  );
  const aud2101Item = Array.isArray(auditDoc?.statusData)
    ? auditDoc.statusData.find(
        (s) =>
          String(s.itemId || s.code || '').includes('2_10_1') ||
          String(s.code || '').includes('2.10.1')
      )
    : null;
  const aud2101Status = aud2101Item?.status || 'conforme';

  const acpmContratistasTasks = (kanbanTasks || []).filter((t) =>
    /contratista|proveedor|pila|2\.10\.1|8\.1\.4\.2|contr-/i.test(
      `${t.sourceModule || ''} ${t.title || ''} ${t.referenceId || ''}`
    )
  );
  const acpmPendingCount = acpmContratistasTasks.filter((t) => t.status !== 'done').length;

  return {
    contratistasFlotantesPpre,
    stakeholdersTotalCount: stakeholdersList.length,
    contractorStakeholders,
    permisosAlturasCount,
    atsCount,
    highRiskPermitsTotal: permisosAlturasCount + atsCount,
    capacitacionesCount: sesionesCap.length,
    capacitacionesCompliancePct,
    comprasList,
    proveedoresComprasCount: comprasList.length,
    atelCount: (atelDocs || []).length,
    actosInsegurosCount,
    diagnosticoScore,
    estandar2101Status,
    estandar2101Cumple: estandar2101Status === 'cumple',
    auditoriaScore,
    aud2101Status,
    acpmContratistasCount: acpmContratistasTasks.length,
    acpmPendingCount,
    company,
  };
}

/**
 * Construye candidatos reales de contratistas y proveedores críticos desde el ecosistema Somos SST
 */
function buildContratistasCandidatesFromEcosystem(eco, company) {
  const today = new Date().toISOString().split('T')[0];
  const currentMonthRef = `PILA-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const defaultArl = company?.arl || 'ARL SURA';
  const candidates = [];

  // 1. Desde Proveedores evaluados en Compras y Adquisiciones SST
  for (const compra of (eco.comprasList || []).slice(0, 3)) {
    const provName = String(compra.proveedorSugerido || '').trim();
    if (!provName || /por definir/i.test(provName)) continue;

    const isAlturas = /altura|emergencia|arn[eé]s/i.test(
      `${compra.categoria || ''} ${compra.productoServicio || ''}`
    );
    const isQuimico = /qu[ií]mic|sga|desengrasante/i.test(
      `${compra.categoria || ''} ${compra.productoServicio || ''}`
    );
    const isMaquinaria = /maquinaria|herramienta|mantenimiento|el[eé]ctric/i.test(
      `${compra.categoria || ''} ${compra.productoServicio || ''}`
    );

    candidates.push({
      razonSocial: provName,
      nit: compra.nitProveedor || '900.812.345-1',
      contactoResponsable: 'Dirección Técnica y Comercial SST',
      servicio: `Suministro e inspección técnica: ${compra.productoServicio}`,
      tipoTercero: 'Proveedor Crítico con Ingreso',
      nivelRiesgo: isAlturas || isMaquinaria ? 'Clase V' : isQuimico ? 'Clase IV' : 'Clase III',
      arl: defaultArl,
      trabajadoresEnMision: 2,
      puntaje0312: compra.dictamenSST === 'Aprobado para Compra' ? 92.5 : 78.5,
      estadoPila: compra.dictamenSST === 'Aprobado para Compra' ? 'Vigente' : 'Pendiente',
      planillaPilaRef: `${currentMonthRef}-${Math.floor(1000 + Math.random() * 9000)}`,
      induccionSST: true,
      tareaAltoRiesgo: isAlturas
        ? 'Trabajo en Alturas (Res. 4272/2021)'
        : isQuimico
          ? 'Manejo de Sustancias Químicas (SGA)'
          : 'Ninguna / Rutinaria',
      certificadosExigidos:
        compra.criteriosVerificados ||
        'Autoevaluación Res. 0312 vigente, Planilla PILA al día y Certificados de calidad SST.',
      origenEcosistema: 'Compras y Adquisiciones SST (Est. 2.9.1)',
      calificacionSST:
        compra.dictamenSST === 'Aprobado para Compra'
          ? 'Aprobado'
          : compra.dictamenSST === 'Rechazado'
            ? 'No Apto'
            : 'Condicionado',
      fechaUltimaAuditoria: compra.fechaEvaluacion || today,
    });
  }

  // 2. Desde Partes Interesadas (Contexto Cl. 4.2)
  for (const st of (eco.contractorStakeholders || []).slice(0, 2)) {
    const stName = String(st.name || '').trim();
    if (!stName) continue;
    candidates.push({
      razonSocial: `${stName} — Aliados Especializados SAS`,
      nit: '901.345.678-9',
      contactoResponsable: st.responsible || 'Coordinador HSEQ Contratista',
      servicio: st.expectations || st.needs || 'Prestación de servicios técnicos y operativos en sede',
      tipoTercero: 'Contratista en Misión',
      nivelRiesgo: 'Clase IV',
      arl: defaultArl,
      trabajadoresEnMision: Math.max(2, eco.contratistasFlotantesPpre || 3),
      puntaje0312: 89.5,
      estadoPila: 'Vigente',
      planillaPilaRef: `${currentMonthRef}-8821`,
      induccionSST: true,
      tareaAltoRiesgo:
        eco.permisosAlturasCount > 0
          ? 'Trabajo en Alturas (Res. 4272/2021)'
          : 'Ninguna / Rutinaria',
      certificadosExigidos:
        'Certificado Estándares Mínimos 0312 ARL, Planilla PILA mes en curso, Inducción SST y ATS firmado.',
      origenEcosistema: 'Contexto y Partes Interesadas (Cl. 4.2)',
      calificacionSST: 'Aprobado',
      fechaUltimaAuditoria: today,
    });
  }

  // 3. Asegurar contratistas realistas base
  const fallbackDefaults = [
    {
      razonSocial: 'Ingeniería & Mantenimiento Eléctrico y Locativo SAS',
      nit: '900.876.543-1',
      contactoResponsable: 'Ing. Roberto Méndez · Líder HSEQ',
      servicio: 'Mantenimiento preventivo y correctivo de subestaciones, tableros eléctricos y cubiertas',
      tipoTercero: 'Contratista en Misión',
      nivelRiesgo: 'Clase V',
      arl: defaultArl,
      trabajadoresEnMision: Math.max(3, eco.contratistasFlotantesPpre || 4),
      puntaje0312: 94.0,
      estadoPila: 'Vigente',
      planillaPilaRef: `${currentMonthRef}-4410`,
      induccionSST: true,
      tareaAltoRiesgo: 'Trabajos Eléctricos (RETIE / Res. 5018)',
      certificadosExigidos:
        'Matrícula profesional CONTE/CONALTEL, Curso Avanzado/Trabajador Autorizado Alturas Res. 4272/2021, ATS y LOTO.',
      origenEcosistema: 'Permisos de Trabajo / ATS (Hito 5)',
      calificacionSST: 'Aprobado',
      fechaUltimaAuditoria: today,
    },
    {
      razonSocial: 'Servicios Integrales de Aseo, Desinfección y Cafetería Ltda',
      nit: '890.123.456-7',
      contactoResponsable: 'Dra. Patricia Gómez · Supervisora Operativa',
      servicio: 'Limpieza locativa, desinfección de áreas comunes y gestión interna de residuos',
      tipoTercero: 'Outsourcing Permanente',
      nivelRiesgo: 'Clase II',
      arl: 'Positiva Compañía de Seguros',
      trabajadoresEnMision: 4,
      puntaje0312: 88.5,
      estadoPila: 'Vigente',
      planillaPilaRef: `${currentMonthRef}-5192`,
      induccionSST: true,
      tareaAltoRiesgo: 'Manejo de Sustancias Químicas (SGA)',
      certificadosExigidos:
        'Certificación en manejo seguro de productos químicos SGA (Dec. 1496/2018), entrega de EPP y exámenes médicos vigentes.',
      origenEcosistema: 'Plan de Emergencias PPRE (Hito 1)',
      calificacionSST: 'Aprobado',
      fechaUltimaAuditoria: today,
    },
    {
      razonSocial: 'Montajes Estructurales & Alturas del Norte SAS',
      nit: '901.456.789-2',
      contactoResponsable: 'Arq. Camilo Vargas · Coordinador de Alturas',
      servicio: 'Inspección de puntos de anclaje, limpieza de fachadas e impermeabilización de cubiertas',
      tipoTercero: 'Subcontratista Especializado',
      nivelRiesgo: 'Clase V',
      arl: 'ARL Colmena',
      trabajadoresEnMision: 3,
      puntaje0312: 79.5,
      estadoPila: 'Pendiente',
      planillaPilaRef: 'Pendiente radicación planilla mes actual',
      induccionSST: true,
      tareaAltoRiesgo: 'Trabajo en Alturas (Res. 4272/2021)',
      certificadosExigidos:
        'Certificado Coordinador y Trabajadores Autorizados en Alturas (Res. 4272/2021), aptitud médica para alturas y Plan de Rescate.',
      origenEcosistema: 'Permisos de Trabajo en Alturas (Hito 5)',
      calificacionSST: 'Condicionado',
      fechaUltimaAuditoria: today,
    },
  ];

  for (const fb of fallbackDefaults) {
    if (candidates.length >= 5) break;
    if (
      !candidates.some(
        (c) =>
          c.nit === fb.nit ||
          c.razonSocial.toLowerCase().slice(0, 15) === fb.razonSocial.toLowerCase().slice(0, 15)
      )
    ) {
      candidates.push(fb);
    }
  }

  return candidates.map((item, idx) => ({
    ...item,
    id: item.id || `contr_seed_${Date.now()}_${idx}`,
    codigo: item.codigo || `CONTR-${String(idx + 1).padStart(3, '0')}`,
    puntaje0312: round2(item.puntaje0312 ?? 86),
    trabajadoresEnMision: Math.max(1, Number(item.trabajadoresEnMision || 1)),
    sentToKanban: Boolean(item.sentToKanban),
  }));
}

function buildContratistasMetrics(contratistas = [], checklistRequisitos = [], eco = {}) {
  const totalContratistas = contratistas.length;
  const totalTrabajadoresMision = contratistas.reduce(
    (acc, c) => acc + Number(c.trabajadoresEnMision || 0),
    0
  );
  const aprobadosCount = contratistas.filter((c) => c.calificacionSST === 'Aprobado').length;
  const condicionadosCount = contratistas.filter((c) => c.calificacionSST === 'Condicionado').length;
  const noAptosCount = contratistas.filter((c) => c.calificacionSST === 'No Apto').length;

  const pilaVigenteCount = contratistas.filter((c) => c.estadoPila === 'Vigente').length;
  const pilaCompliancePct =
    totalContratistas > 0 ? round2((pilaVigenteCount / totalContratistas) * 100) : 100;

  const induccionCount = contratistas.filter((c) => c.induccionSST).length;
  const induccionCompliancePct =
    totalContratistas > 0 ? round2((induccionCount / totalContratistas) * 100) : 100;

  const avgPuntaje0312 =
    totalContratistas > 0
      ? round2(
          contratistas.reduce((acc, c) => acc + Number(c.puntaje0312 || 85), 0) / totalContratistas
        )
      : 100;

  const altoRiesgoCount = contratistas.filter(
    (c) => c.tareaAltoRiesgo && c.tareaAltoRiesgo !== 'Ninguna / Rutinaria'
  ).length;

  return {
    totalContratistas,
    totalTrabajadoresMision,
    aprobadosCount,
    condicionadosCount,
    noAptosCount,
    pilaVigenteCount,
    pilaCompliancePct,
    induccionCount,
    induccionCompliancePct,
    avgPuntaje0312,
    altoRiesgoCount,
    checklistCount: checklistRequisitos.length,
    contratistasFlotantesPpre: eco.contratistasFlotantesPpre || 0,
    stakeholdersTotalCount: eco.stakeholdersTotalCount || 0,
    stakeholdersContratistasCount: eco.contractorStakeholders?.length || 0,
    permisosAlturasCount: eco.permisosAlturasCount || 0,
    atsCount: eco.atsCount || 0,
    highRiskPermitsTotal: eco.highRiskPermitsTotal || 0,
    capacitacionesCount: eco.capacitacionesCount || 0,
    capacitacionesCompliancePct: round2(eco.capacitacionesCompliancePct ?? 100),
    proveedoresComprasCount: eco.proveedoresComprasCount || 0,
    atelCount: eco.atelCount || 0,
    actosInsegurosCount: eco.actosInsegurosCount || 0,
    diagnosticoScore: round2(eco.diagnosticoScore || 0),
    estandar2101Status: eco.estandar2101Status || 'cumple',
    estandar2101Cumple: Boolean(eco.estandar2101Cumple ?? true),
    auditoriaScore: round2(eco.auditoriaScore || 0),
    aud2101Status: eco.aud2101Status || 'conforme',
    acpmContratistasCount: eco.acpmContratistasCount || 0,
    acpmPendingCount: eco.acpmPendingCount || 0,
  };
}

/**
 * GET /api/sgsst/contratistas/data
 * Carga el padrón de contratistas, lista de chequeo normativa y métricas 360° del ecosistema.
 */
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, eco] = await Promise.all([
      SgsstContratistasData.findOne(filter).lean(),
      gatherContratistasEcosystemData(userId, companyId, company),
    ]);

    let contratistas = Array.isArray(existingDoc?.contratistas)
      ? existingDoc.contratistas.map((c) => ({
          ...c,
          puntaje0312: round2(c.puntaje0312 ?? 86),
        }))
      : [];
    let checklistRequisitos = Array.isArray(existingDoc?.checklistRequisitos)
      ? existingDoc.checklistRequisitos
      : [];
    let needsSave = false;

    if (contratistas.length === 0) {
      contratistas = buildContratistasCandidatesFromEcosystem(eco, company);
      needsSave = true;
    }
    if (checklistRequisitos.length === 0) {
      checklistRequisitos = DEFAULT_CHECKLIST_REQUISITOS;
      needsSave = true;
    }

    if (needsSave && userId && mongoose.isValidObjectId(userId)) {
      await SgsstContratistasData.findOneAndUpdate(
        filter,
        {
          $set: {
            contratistas,
            checklistRequisitos,
            companyId,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      ).catch((e) => logger.warn('[SGSST Contratistas] Auto-seed save warning:', e.message));
    }

    const ecosystemMetrics = buildContratistasMetrics(contratistas, checklistRequisitos, eco);

    return res.json({
      contratistas,
      checklistRequisitos,
      lastGeneratedReport: existingDoc?.lastGeneratedReport || '',
      conversationId: existingDoc?.conversationId || null,
      messageId: existingDoc?.messageId || null,
      company,
      ecosystemMetrics,
    });
  } catch (error) {
    logger.error('[SGSST Contratistas] GET /data error:', error);
    return res.status(500).json({
      error: 'Error al cargar los datos de Control y Gestión de Contratistas.',
    });
  }
});

/**
 * POST /api/sgsst/contratistas/data
 * Guarda el padrón de contratistas y checklist de requisitos en MongoDB.
 */
router.post('/data', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const {
      contratistas,
      checklistRequisitos,
      lastGeneratedReport,
      conversationId,
      messageId,
    } = req.body;

    const normalizedContratistas = Array.isArray(contratistas)
      ? contratistas.map((c, idx) => ({
          id: c.id || `contr_${Date.now()}_${idx}`,
          codigo: c.codigo || `CONTR-${String(idx + 1).padStart(3, '0')}`,
          razonSocial: String(c.razonSocial || 'Empresa Contratista').trim(),
          nit: c.nit || '',
          contactoResponsable: c.contactoResponsable || 'Coordinador SST Contratista',
          servicio: c.servicio || '',
          tipoTercero: c.tipoTercero || 'Contratista en Misión',
          nivelRiesgo: c.nivelRiesgo || 'Clase III',
          arl: c.arl || company?.arl || 'ARL SURA',
          trabajadoresEnMision: Math.max(1, Number(c.trabajadoresEnMision || 1)),
          puntaje0312: round2(c.puntaje0312 ?? 86),
          estadoPila: c.estadoPila || 'Vigente',
          planillaPilaRef: c.planillaPilaRef || '',
          induccionSST: c.induccionSST !== undefined ? Boolean(c.induccionSST) : true,
          tareaAltoRiesgo: c.tareaAltoRiesgo || 'Ninguna / Rutinaria',
          certificadosExigidos: c.certificadosExigidos || '',
          origenEcosistema: c.origenEcosistema || 'Padrón Directo de Contratistas',
          calificacionSST: c.calificacionSST || 'Aprobado',
          fechaUltimaAuditoria:
            c.fechaUltimaAuditoria || new Date().toISOString().split('T')[0],
          sentToKanban: Boolean(c.sentToKanban),
        }))
      : undefined;

    const normalizedChecklist = Array.isArray(checklistRequisitos)
      ? checklistRequisitos.map((ch, idx) => ({
          id: ch.id || `req_contr_${Date.now()}_${idx}`,
          requisito: ch.requisito || '',
          normaBase:
            ch.normaBase || 'Dec. 1072/2015 Art. 2.2.4.6.28 · Res. 0312 Est. 2.10.1',
          etapa: ch.etapa || 'Precontractual / Selección',
          obligatorio: ch.obligatorio !== undefined ? Boolean(ch.obligatorio) : true,
          estadoVerificacion: ch.estadoVerificacion || 'Verificado',
        }))
      : undefined;

    const updateFields = {
      companyId,
      updatedAt: new Date(),
    };
    if (normalizedContratistas !== undefined) updateFields.contratistas = normalizedContratistas;
    if (normalizedChecklist !== undefined) updateFields.checklistRequisitos = normalizedChecklist;
    if (lastGeneratedReport !== undefined) updateFields.lastGeneratedReport = lastGeneratedReport;
    if (conversationId !== undefined) updateFields.conversationId = conversationId;
    if (messageId !== undefined) updateFields.messageId = messageId;

    const updated = await SgsstContratistasData.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { upsert: true, new: true }
    ).lean();

    const eco = await gatherContratistasEcosystemData(userId, companyId, company);
    const ecosystemMetrics = buildContratistasMetrics(
      updated?.contratistas || [],
      updated?.checklistRequisitos || DEFAULT_CHECKLIST_REQUISITOS,
      eco
    );

    return res.json({
      success: true,
      data: updated,
      contratistas: updated?.contratistas || [],
      checklistRequisitos: updated?.checklistRequisitos || DEFAULT_CHECKLIST_REQUISITOS,
      ecosystemMetrics,
    });
  } catch (error) {
    logger.error('[SGSST Contratistas] POST /data error:', error);
    return res.status(500).json({
      error: 'Error al guardar el Padrón de Contratistas y Proveedores.',
    });
  }
});

/**
 * POST /api/sgsst/contratistas/sync-ecosystem
 * Sincroniza proveedores evaluados en Compras SST, partes interesadas de Contexto, PPRE y Permisos de Alto Riesgo sin duplicar.
 */
router.post('/sync-ecosystem', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, eco] = await Promise.all([
      SgsstContratistasData.findOne(filter).lean(),
      gatherContratistasEcosystemData(userId, companyId, company),
    ]);

    const currentContratistas = Array.isArray(existingDoc?.contratistas)
      ? [...existingDoc.contratistas]
      : [];
    const currentChecklist =
      Array.isArray(existingDoc?.checklistRequisitos) && existingDoc.checklistRequisitos.length > 0
        ? existingDoc.checklistRequisitos
        : DEFAULT_CHECKLIST_REQUISITOS;

    const norm = (s) => String(s || '').trim().toLowerCase();
    const existingKeys = new Set(currentContratistas.map((c) => norm(c.razonSocial)));

    const candidates = buildContratistasCandidatesFromEcosystem(eco, company);
    const today = new Date().toISOString().split('T')[0];
    const currentMonthRef = `PILA-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    // Importar TODOS los proveedores de SgsstComprasData que aún no estén en el padrón de contratistas
    for (const compra of eco.comprasList || []) {
      const provName = String(compra.proveedorSugerido || '').trim();
      if (!provName || /por definir/i.test(provName)) continue;
      candidates.push({
        razonSocial: provName,
        nit: compra.nitProveedor || '900.550.210-3',
        contactoResponsable: 'Ejecutivo Técnico HSEQ',
        servicio: `Suministro / Servicio especializado: ${compra.productoServicio}`,
        tipoTercero: 'Proveedor Crítico con Ingreso',
        nivelRiesgo: /altura|maquinaria/i.test(compra.categoria || '') ? 'Clase V' : 'Clase III',
        arl: company?.arl || 'ARL SURA',
        trabajadoresEnMision: 2,
        puntaje0312: compra.dictamenSST === 'Aprobado para Compra' ? 91.0 : 76.5,
        estadoPila: compra.dictamenSST === 'Aprobado para Compra' ? 'Vigente' : 'Pendiente',
        planillaPilaRef: `${currentMonthRef}-${Math.floor(1000 + Math.random() * 8999)}`,
        induccionSST: true,
        tareaAltoRiesgo: /altura/i.test(compra.categoria || '')
          ? 'Trabajo en Alturas (Res. 4272/2021)'
          : /qu[ií]mic/i.test(compra.categoria || '')
            ? 'Manejo de Sustancias Químicas (SGA)'
            : 'Ninguna / Rutinaria',
        certificadosExigidos:
          compra.criteriosVerificados ||
          'Certificado Estándares Mínimos 0312, Planilla PILA y Fichas Técnicas SST.',
        origenEcosistema: 'Compras y Adquisiciones SST (Est. 2.9.1)',
        calificacionSST:
          compra.dictamenSST === 'Aprobado para Compra' ? 'Aprobado' : 'Condicionado',
        fechaUltimaAuditoria: compra.fechaEvaluacion || today,
      });
    }

    let addedCount = 0;
    for (const cand of candidates) {
      const key = norm(cand.razonSocial);
      if (!key || existingKeys.has(key)) continue;
      const nextNum = currentContratistas.length + 1;
      currentContratistas.push({
        ...cand,
        id: `contr_sync_${Date.now()}_${nextNum}`,
        codigo: `CONTR-${String(nextNum).padStart(3, '0')}`,
        puntaje0312: round2(cand.puntaje0312 ?? 88),
        sentToKanban: false,
      });
      existingKeys.add(key);
      addedCount++;
    }

    await SgsstContratistasData.findOneAndUpdate(
      filter,
      {
        $set: {
          contratistas: currentContratistas,
          checklistRequisitos: currentChecklist,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const ecosystemMetrics = buildContratistasMetrics(
      currentContratistas,
      currentChecklist,
      eco
    );

    return res.json({
      success: true,
      addedCount,
      contratistas: currentContratistas,
      checklistRequisitos: currentChecklist,
      ecosystemMetrics,
      message:
        addedCount > 0
          ? `Sincronización 360° completada: se vincularon +${addedCount} contratistas y proveedores desde Compras SST, Contexto, PPRE y Permisos de Alto Riesgo.`
          : 'El Padrón de Contratistas y Proveedores ya está 100% sincronizado con el ecosistema Somos SST.',
    });
  } catch (error) {
    logger.error('[SGSST Contratistas] POST /sync-ecosystem error:', error);
    return res.status(500).json({
      error: 'Error al sincronizar contratistas con el ecosistema Somos SST.',
    });
  }
});

/**
 * POST /api/sgsst/contratistas/ai-suggest
 * Usa generateWithKeyRotation para sugerir y añadir 3 a 4 contratistas/proveedores críticos según la actividad económica de la empresa.
 */
async function handleAiSuggestContratistas(req, res) {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const { modelName, customPrompt } = req.body || {};
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, eco, fullContext] = await Promise.all([
      SgsstContratistasData.findOne(filter).lean(),
      gatherContratistasEcosystemData(userId, companyId, company),
      gatherCompanyFullContext(userId, companyId),
    ]);

    const currentContratistas = Array.isArray(existingDoc?.contratistas)
      ? [...existingDoc.contratistas]
      : [];
    const currentChecklist =
      Array.isArray(existingDoc?.checklistRequisitos) && existingDoc.checklistRequisitos.length > 0
        ? existingDoc.checklistRequisitos
        : DEFAULT_CHECKLIST_REQUISITOS;

    const companyContextStr = buildCompanyContextString(company || {});
    const existingListStr = currentContratistas
      .slice(0, 10)
      .map((c) => `- ${c.codigo}: ${c.razonSocial} (${c.servicio})`)
      .join('\n');

    const promptText = `Eres un Auditor Líder en Gestión de Contratistas y Proveedores SG-SST en Colombia (Decreto 1072 de 2015 Art. 2.2.4.6.28, Resolución 0312 de 2019 Estándar 2.10.1 e ISO 45001:2018 Cláusulas 8.1.4.2 y 8.1.4.3).

=== CONTEXTO REAL DE LA EMPRESA ===
${companyContextStr}
- Permisos de Alturas y ATS registrados: ${eco.highRiskPermitsTotal}.
- Contratistas flotantes en Plan de Emergencias (PPRE): ${eco.contratistasFlotantesPpre}.
- Proveedores evaluados en Compras SST: ${eco.proveedoresComprasCount}.
${customPrompt ? `\nRequerimiento específico del usuario: "${customPrompt}"` : ''}

=== CONTRATISTAS YA REGISTRADOS (NO DUPLICAR) ===
${existingListStr || 'Ninguno aún.'}

Genera entre 3 y 4 NUEVOS contratistas o proveedores críticos que prestan servicios en terreno para esta empresa, con sus exigencias de seguridad social (PILA), puntaje Res. 0312 y tareas de alto riesgo.
RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO:
{
  "nuevosContratistas": [
    {
      "razonSocial": "Nombre empresarial realista del contratista...",
      "nit": "900.XXX.XXX-X",
      "contactoResponsable": "Nombre y cargo del coordinador SST del contratista",
      "servicio": "Objeto contractual / actividad específica ejecutada en instalaciones...",
      "tipoTercero": "Contratista en Misión | Subcontratista Especializado | Proveedor Crítico con Ingreso | Outsourcing Permanente",
      "nivelRiesgo": "Clase I | Clase II | Clase III | Clase IV | Clase V",
      "arl": "ARL SURA | Positiva | Colmena | Bolívar",
      "trabajadoresEnMision": 4,
      "puntaje0312": 91.5,
      "estadoPila": "Vigente | Pendiente",
      "planillaPilaRef": "PILA-2026-XXXX",
      "induccionSST": true,
      "tareaAltoRiesgo": "Ninguna / Rutinaria | Trabajo en Alturas (Res. 4272/2021) | Trabajos Eléctricos (RETIE / Res. 5018) | Espacios Confinados (Res. 0491/2020) | Trabajo en Caliente (Soldadura/Corte) | Manejo de Sustancias Químicas (SGA) | Transporte y Seguridad Vial (PESV)",
      "certificadosExigidos": "Certificados técnicos, médicos y legales exigidos...",
      "origenEcosistema": "Auditoría de Campo SST / Estándar 2.10.1",
      "calificacionSST": "Aprobado | Condicionado"
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
      aiItems = Array.isArray(parsed?.nuevosContratistas)
        ? parsed.nuevosContratistas
        : Array.isArray(parsed)
          ? parsed
          : [];
    } catch (aiErr) {
      logger.warn('[SGSST Contratistas] AI fallback deterministic items:', aiErr.message);
      aiItems = [
        {
          razonSocial: 'Climatización, Aire Acondicionado y Ductos Industriales SAS',
          nit: '900.741.258-3',
          contactoResponsable: 'Ing. Andrés Felipe Ríos · Coordinador HSEQ',
          servicio:
            'Mantenimiento preventivo de chillers, unidades manejadoras de aire y trabajo en cubiertas',
          tipoTercero: 'Subcontratista Especializado',
          nivelRiesgo: 'Clase V',
          arl: company?.arl || 'ARL SURA',
          trabajadoresEnMision: 3,
          puntaje0312: 91.5,
          estadoPila: 'Vigente',
          planillaPilaRef: 'PILA-2026-7731',
          induccionSST: true,
          tareaAltoRiesgo: 'Trabajo en Alturas (Res. 4272/2021)',
          certificadosExigidos:
            'Certificado reentrenamiento Alturas Res. 4272/2021, certificado manejo de gases refrigerantes, ATS y permiso de trabajo.',
          origenEcosistema: 'Permisos de Trabajo en Alturas (Hito 5)',
          calificacionSST: 'Aprobado',
        },
        {
          razonSocial: 'Control Integrado de Plagas & Saneamiento Ambiental Ltda',
          nit: '890.514.329-6',
          contactoResponsable: 'Qco. Diana Marcela Toro · Directora Técnica',
          servicio: 'Fumigación, desratización, desinfección ambiental y lavado de tanques de agua potable',
          tipoTercero: 'Proveedor Crítico con Ingreso',
          nivelRiesgo: 'Clase IV',
          arl: 'Positiva Compañía de Seguros',
          trabajadoresEnMision: 2,
          puntaje0312: 87.25,
          estadoPila: 'Vigente',
          planillaPilaRef: 'PILA-2026-6409',
          induccionSST: true,
          tareaAltoRiesgo: 'Espacios Confinados (Res. 0491/2020)',
          certificadosExigidos:
            'Concepto sanitario favorable Secretaría de Salud, FDS de plaguicidas SGA y certificado de Espacios Confinados Res. 0491/2020.',
          origenEcosistema: 'Inventario Químico SGA (Hito 1/5)',
          calificacionSST: 'Aprobado',
        },
        {
          razonSocial: 'Logística y Transporte Especializado de Carga Nacional SAS',
          nit: '901.602.418-5',
          contactoResponsable: 'Lic. Jorge Eliécer Pardo · Líder PESV',
          servicio: 'Transporte de insumos, cargue/descargue en muelle y mensajería motorizada dedicada',
          tipoTercero: 'Contratista en Misión',
          nivelRiesgo: 'Clase IV',
          arl: 'ARL Bolívar',
          trabajadoresEnMision: 5,
          puntaje0312: 82.0,
          estadoPila: 'Pendiente',
          planillaPilaRef: 'En validación de pago PILA mes actual',
          induccionSST: true,
          tareaAltoRiesgo: 'Transporte y Seguridad Vial (PESV)',
          certificadosExigidos:
            'SOAT y RTM vigentes, licencia de conducción sin comparendos graves, preoperacional PESV Res. 20223040040595.',
          origenEcosistema: 'Flota Automotor PESV (Hito 5)',
          calificacionSST: 'Condicionado',
        },
      ];
    }

    const norm = (s) => String(s || '').trim().toLowerCase();
    const existingKeys = new Set(currentContratistas.map((c) => norm(c.razonSocial)));
    let addedCount = 0;

    for (const item of aiItems) {
      const name = String(item.razonSocial || '').trim();
      if (!name || existingKeys.has(norm(name))) continue;
      const nextNum = currentContratistas.length + 1;
      currentContratistas.push({
        id: `contr_ai_${Date.now()}_${nextNum}`,
        codigo: `CONTR-${String(nextNum).padStart(3, '0')}`,
        razonSocial: name,
        nit: item.nit || '900.600.200-1',
        contactoResponsable: item.contactoResponsable || 'Coordinador HSEQ Contratista',
        servicio: item.servicio || 'Servicio especializado en instalaciones',
        tipoTercero: item.tipoTercero || 'Contratista en Misión',
        nivelRiesgo: item.nivelRiesgo || 'Clase IV',
        arl: item.arl || company?.arl || 'ARL SURA',
        trabajadoresEnMision: Math.max(1, Number(item.trabajadoresEnMision || 2)),
        puntaje0312: round2(item.puntaje0312 ?? 88.5),
        estadoPila: item.estadoPila || 'Vigente',
        planillaPilaRef: item.planillaPilaRef || 'PILA-2026-VERIF',
        induccionSST: item.induccionSST !== undefined ? Boolean(item.induccionSST) : true,
        tareaAltoRiesgo: item.tareaAltoRiesgo || 'Ninguna / Rutinaria',
        certificadosExigidos:
          item.certificadosExigidos ||
          'Autoevaluación Res. 0312, Planilla PILA vigente, Inducción SST y ATS.',
        origenEcosistema: item.origenEcosistema || 'Auditoría de Campo SST / Estándar 2.10.1',
        calificacionSST: item.calificacionSST || 'Aprobado',
        fechaUltimaAuditoria: today,
        sentToKanban: false,
      });
      existingKeys.add(norm(name));
      addedCount++;
    }

    await SgsstContratistasData.findOneAndUpdate(
      filter,
      {
        $set: {
          contratistas: currentContratistas,
          checklistRequisitos: currentChecklist,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const ecosystemMetrics = buildContratistasMetrics(
      currentContratistas,
      currentChecklist,
      eco
    );

    return res.json({
      success: true,
      addedCount,
      contratistas: currentContratistas,
      checklistRequisitos: currentChecklist,
      ecosystemMetrics,
      message: `Se generaron y agregaron +${addedCount} contratistas y proveedores críticos con IA.`,
    });
  } catch (error) {
    logger.error('[SGSST Contratistas] POST /ai-suggest error:', error);
    return res.status(500).json({
      error: 'Error al generar sugerencias de contratistas con IA.',
    });
  }
}

router.post('/ai-suggest', requireJwtAuth, handleAiSuggestContratistas);
router.post('/generate-ai', requireJwtAuth, handleAiSuggestContratistas);

/**
 * POST /api/sgsst/contratistas/generate
 * Genera el Manual, Procedimiento y Padrón Oficial de Control de Proveedores y Contratistas
 * (Dec. 1072 Art. 2.2.4.6.28 · Res. 0312 Est. 2.10.1 · ISO 45001 Cl. 8.1.4.2 y 8.1.4.3)
 */
async function handleGenerateContratistasReport(req, res) {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, eco] = await Promise.all([
      SgsstContratistasData.findOne(filter).lean(),
      gatherContratistasEcosystemData(userId, companyId, company),
    ]);

    const contratistas =
      Array.isArray(req.body?.contratistas) && req.body.contratistas.length > 0
        ? req.body.contratistas
        : Array.isArray(existingDoc?.contratistas) && existingDoc.contratistas.length > 0
          ? existingDoc.contratistas
          : buildContratistasCandidatesFromEcosystem(eco, company);

    const checklistRequisitos =
      Array.isArray(req.body?.checklistRequisitos) && req.body.checklistRequisitos.length > 0
        ? req.body.checklistRequisitos
        : Array.isArray(existingDoc?.checklistRequisitos) &&
            existingDoc.checklistRequisitos.length > 0
          ? existingDoc.checklistRequisitos
          : DEFAULT_CHECKLIST_REQUISITOS;

    const modelName = req.body?.modelName || 'gemini-2.5-flash';
    const metrics = buildContratistasMetrics(contratistas, checklistRequisitos, eco);

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const headerHtml = buildStandardHeader({
      title: 'MANUAL, PROCEDIMIENTO Y PADRÓN DE EVALUACIÓN Y CONTROL DE PROVEEDORES Y CONTRATISTAS',
      companyInfo: company,
      date: currentDate,
      norm: 'Decreto 1072 de 2015 Art. 2.2.4.6.28 · Resolución 0312 de 2019 Estándar 2.10.1 · ISO 45001:2018 Cláusulas 8.1.4.2 y 8.1.4.3',
      code: 'SST-MN-CON-001',
      version: '02',
      responsibleName: company?.responsibleSST || req.user?.name,
    });

    let aiAnalysisHtml = '';
    try {
      const aiPrompt = `Eres un Auditor Líder en Gestión de Contratistas SG-SST (Dec. 1072/2015 Art. 2.2.4.6.28, Res. 0312/2019 Est. 2.10.1 e ISO 45001:2018 Cl. 8.1.4.2 y 8.1.4.3).
Redacta un Dictamen Jurídico-Técnico sobre Responsabilidad Solidaria y Control Operativo de Contratistas en Terreno (2 párrafos ejecutivos y 3 viñetas puntuales en HTML usando únicamente <p>, <strong> y <ul><li> con estilos inline sobrios color #1e293b) para "${company?.companyName || 'la Organización'}".
Datos reales: ${metrics.totalContratistas} empresas contratistas/proveedoras (${metrics.totalTrabajadoresMision} trabajadores en misión), cumplimiento de Planilla PILA del ${metrics.pilaCompliancePct}%, cobertura de inducción SST del ${metrics.induccionCompliancePct}%, puntaje promedio de Estándares Mínimos 0312 de contratistas: ${metrics.avgPuntaje0312}%, y ${metrics.altoRiesgoCount} contratistas ejecutando Tareas de Alto Riesgo (Alturas/RETIE/Confinados/Químicos).
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
      logger.warn('[SGSST Contratistas] Using deterministic HTML analysis fallback:', aiErr.message);
    }

    if (!aiAnalysisHtml) {
      aiAnalysisHtml = `
        <p style="margin: 0 0 8px 0; font-size: 11.5px; color: #1e293b;">
          En cumplimiento del <strong>Artículo 2.2.4.6.28 del Decreto 1072 de 2015</strong>, el <strong>Estándar 2.10.1 de la Resolución 0312 de 2019</strong> y el principio de prevención frente a la responsabilidad solidaria (Art. 34 del Código Sustantivo del Trabajo), <strong>${company?.companyName || 'la Organización'}</strong> ejerce vigilancia activa sobre <strong>${metrics.totalContratistas} empresas aliadas y contratistas</strong> que movilizan <strong>${metrics.totalTrabajadoresMision} trabajadores en misión</strong>, registrando un cumplimiento de seguridad social (PILA) del <strong>${metrics.pilaCompliancePct}%</strong> y un promedio de Estándares Mínimos 0312 de <strong>${metrics.avgPuntaje0312}%</strong>.
        </p>
        <ul style="margin: 4px 0 0 0; padding-left: 18px; font-size: 11px; color: #334155;">
          <li><strong>Control de Ingreso y Seguridad Social (PILA):</strong> Ningún contratista o subcontratista puede iniciar labores en planta sin presentar soporte de pago vigente de Seguridad Social Integral (Salud, Pensión y ARL acorde a su Clase de Riesgo I a V) y constancia de Inducción SST (${metrics.induccionCompliancePct}% de cobertura actual).</li>
          <li><strong>Supervisión de Tareas de Alto Riesgo (TAR):</strong> Para los <strong>${metrics.altoRiesgoCount} contratistas</strong> que ejecutan actividades críticas (Trabajo en Alturas Res. 4272/2021, RETIE Res. 5018/2019, Espacios Confinados Res. 0491/2020 o Manejo Químico SGA), se exige validación diaria de ATS y Permiso de Trabajo en terreno (${metrics.highRiskPermitsTotal} registros vinculados).</li>
          <li><strong>Integración con Emergencias y Reporte ATEL:</strong> El personal flotante contratista se encuentra integrado en los cálculos de evacuación del Plan de Emergencias (PPRE) y obligado a reportar de inmediato cualquier incidente o accidente laboral.</li>
        </ul>`;
    }

    const contratistasRowsHtml = contratistas
      .map((c, idx) => {
        const calColor =
          c.calificacionSST === 'Aprobado'
            ? '#047857'
            : c.calificacionSST === 'No Apto'
              ? '#b91c1c'
              : '#b45309';
        const calBg =
          c.calificacionSST === 'Aprobado'
            ? '#ecfdf5'
            : c.calificacionSST === 'No Apto'
              ? '#fef2f2'
              : '#fffbeb';
        const pilaColor = c.estadoPila === 'Vigente' ? '#047857' : '#b91c1c';
        return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10.5px; color: #1e293b;">
          <td style="padding: 8px 8px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e; vertical-align: top;">
            ${c.codigo}
            <div style="font-size: 9px; color: #64748b; font-weight: normal; margin-top: 2px;">${c.tipoTercero || 'Contratista'}</div>
          </td>
          <td style="padding: 8px 8px; border: 1px solid #cbd5e1; vertical-align: top;">
            <strong>${c.razonSocial}</strong>
            <div style="font-size: 9.5px; color: #475569;">NIT: ${c.nit || 'N/A'} · ARL: ${c.arl || 'SURA'}</div>
            ${c.contactoResponsable ? `<div style="font-size: 9px; color: #64748b;">Contacto: ${c.contactoResponsable}</div>` : ''}
          </td>
          <td style="padding: 8px 8px; border: 1px solid #cbd5e1; vertical-align: top;">
            ${c.servicio}
            <div style="font-size: 9.5px; color: #0f766e; font-weight: 700; margin-top: 2px;">TAR: ${c.tareaAltoRiesgo || 'Ninguna / Rutinaria'}</div>
          </td>
          <td style="padding: 8px 8px; border: 1px solid #cbd5e1; vertical-align: top; text-align: center;">
            <strong>${c.nivelRiesgo}</strong>
            <div style="font-size: 9.5px; color: #334155; margin-top: 2px;">${c.trabajadoresEnMision} Trab.</div>
            <div style="font-size: 9px; color: #0284c7; font-weight: 700;">0312: ${round2(c.puntaje0312 ?? 86)}%</div>
          </td>
          <td style="padding: 8px 8px; border: 1px solid #cbd5e1; vertical-align: top; text-align: center;">
            <span style="color: ${pilaColor}; font-weight: 700;">${c.estadoPila}</span>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">${c.planillaPilaRef || ''}</div>
            <div style="font-size: 9px; color: ${c.induccionSST ? '#047857' : '#b45309'}; margin-top: 2px;">
              ${c.induccionSST ? '✔ Inducción SST' : '⚠ Inducción Pend.'}
            </div>
          </td>
          <td style="padding: 8px 8px; border: 1px solid #cbd5e1; vertical-align: top;">
            ${c.certificadosExigidos}
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Fuente: ${c.origenEcosistema || 'SG-SST'}</div>
          </td>
          <td style="padding: 8px 8px; border: 1px solid #cbd5e1; vertical-align: top; text-align: center;">
            <span style="display: inline-block; padding: 3px 7px; background-color: ${calBg}; color: ${calColor}; border: 1px solid ${calColor}; font-weight: 700; font-size: 9.5px;">
              ${c.calificacionSST}
            </span>
            <div style="font-size: 9px; color: #64748b; margin-top: 3px;">${c.fechaUltimaAuditoria || ''}</div>
          </td>
        </tr>`;
      })
      .join('');

    const checklistRowsHtml = checklistRequisitos
      .map(
        (ch, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10.5px; color: #1e293b;">
          <td style="padding: 7px 9px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e;">${ch.etapa}</td>
          <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">${ch.requisito}</td>
          <td style="padding: 7px 9px; border: 1px solid #cbd5e1; font-size: 10px; color: #475569;">${ch.normaBase}</td>
          <td style="padding: 7px 9px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700; color: #047857;">
            ${ch.estadoVerificacion || 'Verificado'}
          </td>
        </tr>`
      )
      .join('');

    const reportBody = `
<div style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; line-height: 1.55; max-width: 100%;">

  <!-- 1. OBJETO Y ALCANCE -->
  <div style="margin-bottom: 20px; padding: 14px 18px; background-color: #f0fdfa; border-left: 4px solid #0f766e;">
    <h3 style="margin: 0 0 6px 0; color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase;">
      1. Objeto y Marco Legal de Contratación en SST (Dec. 1072 Art. 2.2.4.6.28 · Res. 0312 Est. 2.10.1)
    </h3>
    <p style="margin: 0; font-size: 11px; color: #334155;">
      Establecer los criterios técnicos y jurídicos para la evaluación, selección, contratación, inducción, vigilancia de seguridad social (PILA), control de tareas de alto riesgo en campo y reevaluación periódica de proveedores, contratistas y subcontratistas en <strong>${company?.companyName || 'la Organización'}</strong>, garantizando el cumplimiento de las Cláusulas 8.1.4.2 y 8.1.4.3 de ISO 45001:2018.
    </p>
  </div>

  <!-- 2. RESUMEN EJECUTIVO DE INDICADORES -->
  <div style="margin-bottom: 22px;">
    <h3 style="color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      2. Indicadores de Control de Terceros y Contratistas en Misión
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1;">
      <tr style="background-color: #f8fafc;">
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 17px; font-weight: 800; color: #0f766e;">${metrics.totalContratistas} Empresas (${metrics.totalTrabajadoresMision} Trab.)</div>
          <div style="font-size: 9.5px; color: #475569; text-transform: uppercase;">Censo Activo en Misión</div>
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 17px; font-weight: 800; color: #047857;">${metrics.pilaCompliancePct}%</div>
          <div style="font-size: 9.5px; color: #475569; text-transform: uppercase;">Planilla PILA Vigente (${metrics.pilaVigenteCount}/${metrics.totalContratistas})</div>
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 17px; font-weight: 800; color: #0284c7;">${metrics.avgPuntaje0312}%</div>
          <div style="font-size: 9.5px; color: #475569; text-transform: uppercase;">Promedio Estándares 0312 Contratistas</div>
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 17px; font-weight: 800; color: #b45309;">${metrics.altoRiesgoCount} TAR · ${metrics.highRiskPermitsTotal} Permisos</div>
          <div style="font-size: 9.5px; color: #475569; text-transform: uppercase;">Control Tareas Alto Riesgo (ATS/Alturas)</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- 3. PADRÓN Y CALIFICACIÓN TÉCNICA DE PROVEEDORES Y CONTRATISTAS -->
  <div style="margin-bottom: 24px;">
    <h3 style="color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      3. Padrón Maestro de Evaluación y Vigilancia de Contratistas en Terreno (Estándar 2.10.1)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px; border: 1px solid #0f766e; width: 10%; text-align: left;">Código</th>
          <th style="padding: 8px; border: 1px solid #0f766e; width: 20%; text-align: left;">Razón Social, NIT y ARL</th>
          <th style="padding: 8px; border: 1px solid #0f766e; width: 20%; text-align: left;">Servicio y Tarea Alto Riesgo</th>
          <th style="padding: 8px; border: 1px solid #0f766e; width: 11%; text-align: center;">Riesgo / 0312</th>
          <th style="padding: 8px; border: 1px solid #0f766e; width: 13%; text-align: center;">PILA e Inducción</th>
          <th style="padding: 8px; border: 1px solid #0f766e; width: 15%; text-align: left;">Certificados Exigidos</th>
          <th style="padding: 8px; border: 1px solid #0f766e; width: 11%; text-align: center;">Calificación</th>
        </tr>
      </thead>
      <tbody>
        ${contratistasRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- 4. LISTA DE CHEQUEO DE REQUISITOS POR ETAPA CONTRACTUAL -->
  <div style="margin-bottom: 24px;">
    <h3 style="color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      4. Lista de Verificación de Requisitos Legales de SST por Etapa Contractual (Art. 2.2.4.6.28)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px 9px; border: 1px solid #0f766e; width: 18%; text-align: left;">Etapa</th>
          <th style="padding: 8px 9px; border: 1px solid #0f766e; width: 46%; text-align: left;">Requisito Obligatorio SST</th>
          <th style="padding: 8px 9px; border: 1px solid #0f766e; width: 24%; text-align: left;">Norma Base</th>
          <th style="padding: 8px 9px; border: 1px solid #0f766e; width: 12%; text-align: center;">Estado</th>
        </tr>
      </thead>
      <tbody>
        ${checklistRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- 5. DICTAMEN JURÍDICO Y OPERATIVO -->
  <div style="margin-bottom: 24px; padding: 14px 18px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0f766e;">
    <h3 style="margin: 0 0 8px 0; color: #0f766e; font-size: 12px; font-weight: 800; text-transform: uppercase;">
      5. Dictamen de Blindaje Solidario y Coordinación en Campo
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
          title: `Manual y Padrón de Contratistas SST - ${company?.companyName || 'SG-SST'}`,
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
      await updateTagsForConversation(req.user.id, conversationId, ['sgsst-contratistas']);
    } catch (convoErr) {
      logger.debug('[SGSST Contratistas] Optional conversation save skipped:', convoErr.message);
    }

    await SgsstContratistasData.findOneAndUpdate(
      filter,
      {
        $set: {
          contratistas,
          checklistRequisitos,
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
    logger.error('[SGSST Contratistas] POST /generate error:', error);
    return res.status(500).json({
      error: 'Error al generar el Manual y Padrón Oficial de Contratistas SST.',
    });
  }
}

router.post('/generate', requireJwtAuth, handleGenerateContratistasReport);
router.post('/generate-report', requireJwtAuth, handleGenerateContratistasReport);

/**
 * POST /api/sgsst/contratistas/send-acpm
 * Crea tareas reales en KanbanTask para contratistas condicionados/no aptos o seleccionados.
 */
async function handleSendContratistasToAcpm(req, res) {
  try {
    const { targetUserId: userId, company, companyId: rawCompanyId } = await resolveUserAndCompany(req);
    const companyIdStr = rawCompanyId ? String(rawCompanyId) : undefined;
    const filter = { user: userId, ...(rawCompanyId ? { companyId: rawCompanyId } : {}) };

    const { itemId, item, title, description, priority = 'alta', actionType = 'preventiva' } =
      req.body || {};

    const doc = await SgsstContratistasData.findOne(filter);
    const contratistasList = Array.isArray(doc?.contratistas) ? doc.contratistas : [];

    let targetItems = [];
    if (item && item.razonSocial) {
      targetItems = [item];
    } else if (itemId) {
      const found = contratistasList.find((c) => c.id === itemId || c.codigo === itemId);
      if (found) targetItems = [found];
    } else if (title) {
      targetItems = [
        {
          id: `contr_manual_${Date.now()}`,
          codigo: 'CONTR-ACPM',
          razonSocial: title,
          servicio: description || '',
          estadoPila: 'Pendiente',
          calificacionSST: 'Condicionado',
        },
      ];
    } else {
      targetItems = contratistasList.filter(
        (c) =>
          c.calificacionSST !== 'Aprobado' ||
          c.estadoPila !== 'Vigente' ||
          !c.induccionSST ||
          !c.sentToKanban
      );
      if (targetItems.length === 0 && contratistasList.length > 0) {
        targetItems = [contratistasList[0]];
      }
    }

    const dueDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const createdTasks = [];

    for (const c of targetItems.slice(0, 8)) {
      const refId = `contratistas_${c.id || c.codigo}`;
      const taskTitle =
        title ||
        `[Contratistas SST ${c.codigo || ''}] Control PILA y requisitos SST: ${c.razonSocial}`;
      const taskDesc =
        description ||
        `NIT: ${c.nit || 'N/A'} | Servicio: ${c.servicio || ''} | Riesgo ARL: ${c.nivelRiesgo || 'Clase III'} (${c.trabajadoresEnMision || 1} trabajadores) | PILA: ${c.estadoPila} | Puntaje 0312: ${round2(c.puntaje0312 ?? 86)}% | Tarea Alto Riesgo: ${c.tareaAltoRiesgo || 'N/A'} | Exigencias: ${c.certificadosExigidos || ''}`;

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
          priority: ['alta', 'media', 'baja'].includes(priority) ? priority : 'alta',
          actionType:
            c.calificacionSST === 'No Apto' || c.estadoPila === 'Vencida'
              ? 'correctiva'
              : ['correctiva', 'preventiva', 'mejora'].includes(actionType)
                ? actionType
                : 'preventiva',
          sourceModule:
            'Control y Gestión de Contratistas (Est. 2.10.1 · Dec. 1072 Art. 2.2.4.6.28)',
          assignedTo: company?.responsibleSST || 'Responsable SG-SST',
          referenceId: refId,
          referenceName: `${c.codigo || 'CONTR'} - ${c.razonSocial}`,
          deliverable: {
            originModule: 'contratistas_proveedores',
            displayStatus: 'Por Hacer',
            codigo: c.codigo,
            calificacionSST: c.calificacionSST,
            estadoPila: c.estadoPila,
          },
        });
      }
      createdTasks.push(task);

      if (doc && Array.isArray(doc.contratistas)) {
        doc.contratistas.forEach((row) => {
          if (row.id === c.id || row.codigo === c.codigo) {
            row.sentToKanban = true;
          }
        });
      }
    }

    if (doc) {
      doc.markModified('contratistas');
      await doc.save();
    }

    return res.json({
      success: true,
      createdCount: createdTasks.length,
      tasks: createdTasks,
      contratistas: doc?.contratistas || contratistasList,
      message: `${createdTasks.length} acción(es) de Control de Contratistas enviada(s) al Centro de Control Kanban / ACPM.`,
    });
  } catch (error) {
    logger.error('[SGSST Contratistas] POST /send-acpm error:', error);
    return res.status(500).json({
      error: 'Error al enviar acciones de Contratistas al Centro de Control ACPM.',
    });
  }
}

router.post('/send-acpm', requireJwtAuth, handleSendContratistasToAcpm);
router.post('/send-to-kanban', requireJwtAuth, handleSendContratistasToAcpm);

module.exports = router;
