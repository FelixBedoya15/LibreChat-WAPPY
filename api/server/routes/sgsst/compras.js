const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const SgsstComprasData = require('~/models/SgsstComprasData');
const SgsstEppData = require('~/models/SgsstEppData');
const SgsstEppInventory = require('~/models/SgsstEppInventory');
const SgsstEppSolicitud = require('~/models/SgsstEppSolicitud');
const SgsstChemicalData = require('~/models/SgsstChemicalData');
const ChemicalCompatibilitySession = require('~/models/ChemicalCompatibilitySession');
const SgsstHeightsData = require('~/models/SgsstHeightsData');
const SgsstVehicleData = require('~/models/SgsstVehicleData');
const PlanEmergenciasData = require('~/models/PlanEmergenciasData');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
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

const DEFAULT_CRITERIOS_MATRIZ = [
  {
    id: 'crit_epp',
    familia: 'Elementos de Protección Personal (EPP)',
    normaExigida: 'Res. 2400 de 1979 · ANSI Z87.1 / Z89.1 / Z359.11 · NTC 2257 / NTC 1741',
    requisitosObligatorios:
      'Sello de certificación de tercera parte (ANSI/NIOSH/CE/ONAC), ficha técnica en idioma español, tallaje ergonómico y compatibilidad con otros EPP.',
    documentosRecepcion:
      'Ficha técnica del fabricante, Certificado de conformidad del lote y Acta de inspección técnica de ingreso a almacén.',
    responsableVerificacion: 'Responsable SG-SST / Almacén',
  },
  {
    id: 'crit_quimicos',
    familia: 'Sustancias Químicas SGA',
    normaExigida: 'Decreto 1496 de 2018 · Resolución 773 de 2021 (SGA ONU) · NTC 4435 / NTC 4532',
    requisitosObligatorios:
      'Ficha de Datos de Seguridad (FDS) vigente de 16 secciones en español (< 5 años), envase íntegro con etiquetado SGA (pictogramas, palabra de advertencia, frases H y P).',
    documentosRecepcion:
      'FDS de 16 secciones actualizada, Tarjeta de Emergencia para transporte y validación contra Matriz de Compatibilidad Química.',
    responsableVerificacion: 'Responsable SG-SST / Almacenista Químico',
  },
  {
    id: 'crit_maquinaria',
    familia: 'Maquinaria y Herramientas',
    normaExigida: 'Res. 2400 de 1979 · ISO 12100 · RETIE (Res. 90708)',
    requisitosObligatorios:
      'Guardas de protección fija o interbloqueada en partes móviles, botón de parada de emergencia (hombre muerto), aislamiento eléctrico certificado y emisión sonora < 85 dB(A).',
    documentosRecepcion:
      'Manual de operación y mantenimiento en español, Certificado de conformidad eléctrica/mecánica y Lista preoperacional inicial.',
    responsableVerificacion: 'Jefe de Mantenimiento / Responsable SG-SST',
  },
  {
    id: 'crit_alturas_emerg',
    familia: 'Equipos de Alturas y Emergencias',
    normaExigida: 'Resolución 4272 de 2021 · ANSI/ASSP Z359 · NTC 2885 / NFPA 10',
    requisitosObligatorios:
      'Resistencia certificada 5.000 lb (22.2 kN) para detención de caídas, etiqueta indeleble con número de serie y año de fabricación; extintores y botiquines bajo norma técnica.',
    documentosRecepcion:
      'Certificado de calidad ANSI/EN, apertura de Hoja de Vida del equipo y aval firmado por Coordinador de Trabajo en Alturas o Jefe de Brigada.',
    responsableVerificacion: 'Coordinador de Alturas / Líder de Brigada',
  },
  {
    id: 'crit_pesv',
    familia: 'Parque Automotor / PESV',
    normaExigida: 'Resolución 20223040040595 de 2022 (PESV) · ISO 39001 · Ley 769 CNT',
    requisitosObligatorios:
      'Repuestos certificados OEM para sistemas de seguridad activa y pasiva (frenos, llantas con labrado legal, luces, dirección, cinturones) y kit de carretera reglamentario.',
    documentosRecepcion:
      'Factura con trazabilidad de lote, Certificado de garantía del proveedor/taller e Inspección preoperacional vehicular PESV.',
    responsableVerificacion: 'Líder PESV / Mantenimiento Flota',
  },
  {
    id: 'crit_ergonomia',
    familia: 'Mobiliario y Ergonomía',
    normaExigida: 'NTC 5655 · ISO 9241 · ISO 11226 · Guía Técnica DME MinTrabajo',
    requisitosObligatorios:
      'Mobiliario con regulación neumática de altura, soporte dorso-lumbar adaptable, bordes redondeados, base estable de 5 apoyos y ayudas mecánicas para cargas.',
    documentosRecepcion:
      'Ficha técnica ergonómica, Garantía estructural y Concepto favorable desde Estudio de Puesto de Trabajo (EPT).',
    responsableVerificacion: 'Responsable SG-SST / Talento Humano',
  },
  {
    id: 'crit_servicios',
    familia: 'Servicios e Instalaciones',
    normaExigida: 'Decreto 1072 de 2015 Art. 2.2.4.6.27 y 2.2.4.6.28 · Res. 0312 Est. 2.9.1',
    requisitosObligatorios:
      'Cumplimiento de especificaciones técnicas de seguridad locativa, eléctrica o ambiental; contratista habilitado con seguridad social (PILA) al día.',
    documentosRecepcion:
      'Planilla PILA vigente, Certificados de competencia (Alturas/RETIE), ATS firmado y Acta de recibo técnico SST.',
    responsableVerificacion: 'Compras / Responsable SG-SST',
  },
];

/**
 * Cruza las colecciones reales del SG-SST para construir métricas y detectar adquisiciones del ecosistema
 */
async function gatherComprasEcosystemData(userId, companyId, company) {
  const filter = { user: userId, ...(companyId ? { companyId } : {}) };
  const companyFilter = companyId ? { companyId } : { user: userId };

  try {
    require('./matrizPeligros');
    require('./estudioPuestoTrabajo');
    require('./metodoOwas');
  } catch (_) {}

  const MatrizPeligrosData = mongoose.models.MatrizPeligrosData;
  const EstudioPuestoTrabajo = mongoose.models.EstudioPuestoTrabajo;
  const MetodoOwasData = mongoose.models.MetodoOwasData;

  const [
    eppDocs,
    eppInvDoc,
    eppSolicitudes,
    chemDoc,
    compatSession,
    heightsDocs,
    vehicleDocs,
    ppreDoc,
    gtc45Session,
    matrizPelDoc,
    eptDocs,
    owasDoc,
    diagDoc,
    auditDoc,
    kanbanTasks,
  ] = await Promise.all([
    SgsstEppData.find(filter).lean().catch(() => []),
    SgsstEppInventory.findOne(filter).lean().catch(() => null),
    SgsstEppSolicitud.find(companyFilter).lean().catch(() => []),
    SgsstChemicalData.findOne(filter).lean().catch(() => null),
    ChemicalCompatibilitySession.findOne(filter)
      .sort({ isOfficial: -1, updatedAt: -1 })
      .lean()
      .catch(() => null),
    SgsstHeightsData.find(filter).lean().catch(() => []),
    SgsstVehicleData.find(filter).lean().catch(() => []),
    PlanEmergenciasData.findOne(filter).lean().catch(() => null),
    GTC45WorkspaceSession.findOne(filter)
      .sort({ isOfficial: -1, updatedAt: -1 })
      .lean()
      .catch(() => null),
    MatrizPeligrosData ? MatrizPeligrosData.findOne(filter).lean().catch(() => null) : null,
    EstudioPuestoTrabajo ? EstudioPuestoTrabajo.find(filter).lean().catch(() => []) : [],
    MetodoOwasData ? MetodoOwasData.findOne(filter).lean().catch(() => null) : null,
    DiagnosticoData.findOne(filter).lean().catch(() => null),
    AuditoriaData.findOne(filter).lean().catch(() => null),
    KanbanTask.find({
      user: userId,
      ...(companyId ? { companyId: String(companyId) } : {}),
    })
      .lean()
      .catch(() => []),
  ]);

  // 1. EPP
  const allEppEntregas = [];
  (eppDocs || []).forEach((d) => {
    (d.entregas || []).forEach((e) => {
      allEppEntregas.push({ ...e, trabajador: d.nombreTrabajador, cargo: d.cargo });
    });
  });
  const eppInventoryItems = Array.isArray(eppInvDoc?.items) ? eppInvDoc.items : [];
  const eppLowStockItems = eppInventoryItems.filter(
    (it) => Number(it.stockActual || 0) <= Number(it.stockMinimo || 5)
  );
  const eppSolicitudesPendientes = (eppSolicitudes || []).filter(
    (s) => s.estado === 'pendiente' || s.estado === 'aprobada'
  );

  // 2. Sustancias Químicas SGA
  const chemProducts = Array.isArray(chemDoc?.productos) ? [...chemDoc.productos] : [];
  const compatProducts = Array.isArray(compatSession?.matrixRows)
    ? compatSession.matrixRows
    : Array.isArray(compatSession?.products)
      ? compatSession.products
      : [];
  compatProducts.forEach((cp) => {
    const name = String(cp.nombre_producto || cp.nombre || cp.name || '').trim();
    if (name && !chemProducts.some((p) => String(p.nombre || '').toLowerCase() === name.toLowerCase())) {
      chemProducts.push({
        id: cp.id || `chem_${Date.now()}`,
        nombre: name,
        fabricante: cp.fabricante || 'Proveedor Químico Industrial',
        claseOnu: cp.clase_peligro_onu || cp.clasificacion_onu || cp.claseOnu || 'Clase 8 Corrosivos / Clase 3',
        cantidadAlmacenada: cp.cantidad_almacenada || '10 Galones',
        tieneFds:
          cp.ficha_seguridad_fds === 'SÍ' || cp.tiene_fds === true || cp.tiene_fds === 'Sí'
            ? 'Sí'
            : 'No',
        tieneRotuloSga:
          cp.etiquetado_sga === 'SÍ' || cp.tiene_rotulo === true || cp.tiene_rotulo === 'Sí'
            ? 'Sí'
            : 'No',
        requisitosAlmacenamiento: cp.controles_almacenamiento || cp.requisitos_almacenamiento || '',
      });
    }
  });
  const chemicalsWithFdsCount = chemProducts.filter((c) => c.tieneFds === 'Sí').length;
  const chemicalsMissingFdsCount = Math.max(0, chemProducts.length - chemicalsWithFdsCount);
  const fdsCompliancePct =
    chemProducts.length > 0 ? round2((chemicalsWithFdsCount / chemProducts.length) * 100) : 100;

  // 3. Alturas, Flota PESV y Equipos de Emergencia
  const allHeightsEquipos = [];
  (heightsDocs || []).forEach((hd) => {
    (hd.equipos || []).forEach((eq) => {
      allHeightsEquipos.push({ ...eq, trabajador: hd.nombreTrabajador, cargo: hd.cargo });
    });
  });
  const vehiclesList = Array.isArray(vehicleDocs) ? vehicleDocs : [];
  const emergencyEquipos = Array.isArray(ppreDoc?.recursosEquipos) ? ppreDoc.recursosEquipos : [];

  // 4. GTC 45 / Controles
  const gtcRows = Array.isArray(gtc45Session?.matrixRows)
    ? gtc45Session.matrixRows
    : Array.isArray(gtc45Session?.rows)
      ? gtc45Session.rows
      : [];
  const matrizPeligrosList = [];
  if (matrizPelDoc && Array.isArray(matrizPelDoc.procesos)) {
    matrizPelDoc.procesos.forEach((p) => {
      (p.peligros || []).forEach((pel) => {
        matrizPeligrosList.push({
          proceso: p.proceso,
          descripcion: pel.descripcionPeligro || pel.descripcion,
          clasificacion: pel.clasificacion,
          epp: pel.epp || pel.controlesEpp || '',
          controlesIngenieria: pel.controlesIngenieria || pel.fuente || '',
        });
      });
    });
  }
  const totalGtcHazards = gtcRows.length || matrizPeligrosList.length;

  // 5. Ergonomía
  const owasCount = Array.isArray(owasDoc?.evaluaciones) ? owasDoc.evaluaciones.length : 0;
  const ergonomicStudiesCount = (eptDocs?.length || 0) + owasCount;

  // 6. Diagnóstico 0312 (Est. 2.9.1) y Auditoría (aud_2_9_1)
  const diagnosticoScore = round2(diagDoc?.score || 0);
  const est291Item = Array.isArray(diagDoc?.statusData)
    ? diagDoc.statusData.find(
        (s) =>
          String(s.code || s.itemId || '').includes('2.9.1') ||
          String(s.itemId || '') === '2_9_1'
      )
    : null;
  const estandar291Status = est291Item?.status || 'cumple';

  const auditoriaScore = round2(
    auditDoc?.compliancePercentage || auditDoc?.weightedPercentage || auditDoc?.score || 0
  );
  const aud291Item = Array.isArray(auditDoc?.statusData)
    ? auditDoc.statusData.find(
        (s) =>
          String(s.itemId || s.code || '').includes('2_9_1') ||
          String(s.code || '').includes('2.9.1')
      )
    : null;
  const aud291Status = aud291Item?.status || 'conforme';

  // 7. Kanban ACPM de Compras
  const acpmComprasTasks = (kanbanTasks || []).filter((t) =>
    /compra|adquisici|2\.9\.1|8\.1\.4\.1|adq-/i.test(
      `${t.sourceModule || ''} ${t.title || ''} ${t.referenceId || ''}`
    )
  );
  const acpmPendingCount = acpmComprasTasks.filter((t) => t.status !== 'done').length;

  return {
    allEppEntregas,
    eppInventoryItems,
    eppLowStockItems,
    eppSolicitudes,
    eppSolicitudesPendientes,
    chemProducts,
    chemicalsWithFdsCount,
    chemicalsMissingFdsCount,
    fdsCompliancePct,
    allHeightsEquipos,
    vehiclesList,
    emergencyEquipos,
    gtcRows,
    matrizPeligrosList,
    totalGtcHazards,
    eptDocs: eptDocs || [],
    ergonomicStudiesCount,
    diagnosticoScore,
    estandar291Status,
    estandar291Cumple: estandar291Status === 'cumple',
    auditoriaScore,
    aud291Status,
    acpmComprasCount: acpmComprasTasks.length,
    acpmPendingCount,
    company,
  };
}

/**
 * Construye candidatos reales de compra a partir del ecosistema Somos SST
 */
function buildComprasCandidatesFromEcosystem(eco, company) {
  const today = new Date().toISOString().split('T')[0];
  const respDefault = company?.responsibleSST || 'Responsable SG-SST';
  const candidates = [];

  // 1. Desde Inventario/Entregas/Solicitudes de EPP
  if (eco.eppSolicitudesPendientes.length > 0) {
    const sol = eco.eppSolicitudesPendientes[0];
    const firstItem = Array.isArray(sol.items) && sol.items[0] ? sol.items[0] : null;
    candidates.push({
      productoServicio: firstItem?.nombre
        ? `Reposición prioritaria de ${firstItem.nombre} (Solicitud de ${sol.nombreTrabajador || 'Colaborador'})`
        : `Lote de reposición de EPP solicitados en terreno (${sol.nombreTrabajador || 'Operaciones'})`,
      categoria: 'Elementos de Protección Personal (EPP)',
      origenEcosistema: 'Matriz de EPP (Hito 5)',
      proveedorSugerido: 'Dotaciones y Seguridad Industrial Certificada SAS',
      nitProveedor: '900.412.889-1',
      cantidadUnidad: `${firstItem?.cantidad || 10} Unidades`,
      normaTecnica: 'ANSI Z87.1 / Z89.1 · NTC 2257 · Res. 2400 de 1979',
      especificacionesSST:
        'Elementos con sello de certificación impreso, ficha técnica en español, resistencia dieléctrica/mecánica acorde al perfil de cargo y tallaje verificado.',
      criteriosVerificados:
        'Certificado de conformidad de lote vigente, ficha técnica de mantenimiento y validación de matriz de EPP.',
      requiereFdsSga: false,
      requiereCertificadoCalidad: true,
      dictamenSST: 'Aprobado para Compra',
      responsableEvaluacion: respDefault,
      fechaEvaluacion: today,
    });
  } else if (eco.eppLowStockItems.length > 0) {
    const item = eco.eppLowStockItems[0];
    candidates.push({
      productoServicio: `Reabastecimiento de ${item.nombre} (${item.categoria || 'EPP'}) por stock mínimo`,
      categoria: 'Elementos de Protección Personal (EPP)',
      origenEcosistema: 'Matriz de EPP (Hito 5)',
      proveedorSugerido: item.marca ? `Distribuidor Autorizado ${item.marca}` : 'Seguridad Industrial Nacional SAS',
      nitProveedor: '900.531.204-6',
      cantidadUnidad: `${Math.max(15, Number(item.stockMinimo || 5) * 3)} ${item.unidad || 'Unidades'}`,
      normaTecnica: 'ANSI / NIOSH / NTC aplicable al EPP',
      especificacionesSST: `Referencia ${item.referencia || 'Estándar certificada'}, talla ${item.talla || 'Única'}, con certificación de protección ocupacional vigente.`,
      criteriosVerificados: 'Ficha técnica en español, sello de certificación ONAC/ANSI y registro en Kardex de EPP.',
      requiereFdsSga: false,
      requiereCertificadoCalidad: true,
      dictamenSST: 'Aprobado para Compra',
      responsableEvaluacion: respDefault,
      fechaEvaluacion: today,
    });
  } else if (eco.allEppEntregas.length > 0) {
    const ent = eco.allEppEntregas[0];
    candidates.push({
      productoServicio: `Adquisición periódica de ${ent.nombre || 'Kit de Protección Personal Certificado'}`,
      categoria: 'Elementos de Protección Personal (EPP)',
      origenEcosistema: 'Matriz de EPP (Hito 5)',
      proveedorSugerido: ent.marca ? `Proveedor Autorizado ${ent.marca}` : 'Protección Integral Industrial SAS',
      nitProveedor: '900.618.420-3',
      cantidadUnidad: '20 Unidades',
      normaTecnica: 'ANSI Z87.1 / Z89.1 / Z359.11 · Res. 2400/1979',
      especificacionesSST:
        'EPP certificado contra factores de riesgo físicos, mecánicos y químicos identificados en los cargos operativos.',
      criteriosVerificados: 'Ficha técnica de seguridad, certificado de lote y prueba de ajuste antropométrico.',
      requiereFdsSga: false,
      requiereCertificadoCalidad: true,
      dictamenSST: 'Aprobado para Compra',
      responsableEvaluacion: respDefault,
      fechaEvaluacion: today,
    });
  }

  // 2. Desde Inventario Químico SGA / Matriz de Compatibilidad
  if (eco.chemProducts.length > 0) {
    const ch = eco.chemProducts[0];
    const hasFds = ch.tieneFds === 'Sí';
    candidates.push({
      productoServicio: `${ch.nombre} (${ch.claseOnu || 'Sustancia Química regulada SGA'})`,
      categoria: 'Sustancias Químicas SGA',
      origenEcosistema: 'Inventario Químico SGA (Hito 1/5)',
      proveedorSugerido: ch.fabricante || 'Químicos y Soluciones Industriales Ltda',
      nitProveedor: '890.315.742-8',
      cantidadUnidad: ch.cantidadAlmacenada || '20 Galones',
      normaTecnica: 'Decreto 1496 de 2018 · Resolución 773 de 2021 (SGA ONU)',
      especificacionesSST:
        'Exigencia obligatoria de Ficha de Datos de Seguridad (FDS) de 16 secciones en español, rotulado SGA impreso con pictogramas y envase de alta densidad certificado ONU.',
      criteriosVerificados: hasFds
        ? 'FDS de 16 secciones verificada, compatibilidad de almacenamiento SGA aprobada y kit antiderrames disponible.'
        : 'CONDICIONADO: El proveedor debe remitir la FDS actualizada de 16 secciones bajo Res. 773/2021 antes de autorizar ingreso a bodega.',
      requiereFdsSga: true,
      requiereCertificadoCalidad: true,
      dictamenSST: hasFds ? 'Aprobado para Compra' : 'Condicionado / Exige Ajuste',
      responsableEvaluacion: respDefault,
      fechaEvaluacion: today,
    });
  }

  // 3. Desde Equipos de Alturas (Hito 5)
  if (eco.allHeightsEquipos.length > 0) {
    const eq = eco.allHeightsEquipos[0];
    candidates.push({
      productoServicio: `${eq.nombre || 'Arnés multipropósito dieléctrico 4 argollas'} (${eq.marca || 'Certificado ANSI'})`,
      categoria: 'Equipos de Alturas y Emergencias',
      origenEcosistema: 'Equipos de Alturas (Hito 5)',
      proveedorSugerido: eq.marca ? `Representaciones ${eq.marca} Colombia SAS` : 'Seguridad Vertical y Alturas SAS',
      nitProveedor: '901.104.552-4',
      cantidadUnidad: '5 Unidades',
      normaTecnica: 'Resolución 4272 de 2021 · ANSI/ASSP Z359.11-2021',
      especificacionesSST:
        'Capacidad de rotura 5.000 lb (22.2 kN), argollas en D con prueba dieléctrica mínima de 9 kV, testigo de impacto y etiqueta indeleble con trazabilidad de serial.',
      criteriosVerificados:
        'Certificado de laboratorio acreditado bajo ANSI Z359, manual en español y apertura de hoja de vida del equipo.',
      requiereFdsSga: false,
      requiereCertificadoCalidad: true,
      dictamenSST: 'Aprobado para Compra',
      responsableEvaluacion: respDefault,
      fechaEvaluacion: today,
    });
  }

  // 4. Desde Plan de Emergencias PPRE (Hito 1)
  if (eco.emergencyEquipos.length > 0) {
    const rec = eco.emergencyEquipos[0];
    candidates.push({
      productoServicio: rec.descripcion || 'Extintores Multipropósito ABC 10 lb y Botiquín Tipo B',
      categoria: 'Equipos de Alturas y Emergencias',
      origenEcosistema: 'Plan de Emergencias PPRE (Hito 1)',
      proveedorSugerido: 'Ingeniería Contraincendios y Emergencias SAS',
      nitProveedor: '900.784.119-5',
      cantidadUnidad: `${rec.cantidad || 6} Unidades`,
      normaTecnica: 'NTC 2885 · NFPA 10 · Res. 0705 (Botiquines)',
      especificacionesSST:
        'Cilindros sin costura probados hidrostáticamente, agente extintor certificado al 90% de pureza, manómetro calibrado, anillo de verificación anual y señalización fotoluminiscente NTC 1461.',
      criteriosVerificados:
        'Certificado de recarga/fabricación NTC 2885, garantía de presurización y registro en inventario de emergencias.',
      requiereFdsSga: false,
      requiereCertificadoCalidad: true,
      dictamenSST: 'Aprobado para Compra',
      responsableEvaluacion: respDefault,
      fechaEvaluacion: today,
    });
  }

  // 5. Desde Parque Automotor PESV (Hito 5)
  if (eco.vehiclesList.length > 0) {
    const veh = eco.vehiclesList[0];
    candidates.push({
      productoServicio: `Kit de mantenimiento preventivo frenos, llantas y seguridad activa (${veh.tipo || 'Flota'} ${veh.placa || ''})`,
      categoria: 'Parque Automotor / PESV',
      origenEcosistema: 'Flota Automotor PESV (Hito 5)',
      proveedorSugerido: `Centro de Servicio Autorizado ${veh.marca || 'Automotriz'} SAS`,
      nitProveedor: '860.512.903-2',
      cantidadUnidad: `${eco.vehiclesList.length} Kits Vehiculares`,
      normaTecnica: 'Resolución 20223040040595 de 2022 (PESV) · ISO 39001 · NTC 5375',
      especificacionesSST:
        'Pastillas de freno libres de asbesto (norma ambiental y SST), llantas con índice de carga/velocidad original y equipo de prevención y seguridad vial reglamentario.',
      criteriosVerificados:
        'Certificado de repuestos originales OEM, hoja de seguridad libre de asbesto y validación por Líder PESV.',
      requiereFdsSga: false,
      requiereCertificadoCalidad: true,
      dictamenSST: 'Aprobado para Compra',
      responsableEvaluacion: respDefault,
      fechaEvaluacion: today,
    });
  }

  // 6. Desde Estudio de Puesto / OWAS (Hito 4)
  if (eco.ergonomicStudiesCount > 0) {
    candidates.push({
      productoServicio: 'Sillas ergonómicas certificadas con soporte lumbar regulable y reposapiés ajustables',
      categoria: 'Mobiliario y Ergonomía',
      origenEcosistema: 'Estudio de Puesto / OWAS (Hito 4)',
      proveedorSugerido: 'Ergonomía & Espacios Corporativos de Colombia SAS',
      nitProveedor: '900.992.341-7',
      cantidadUnidad: '8 Unidades',
      normaTecnica: 'NTC 5655 · BIFMA X5.1 · ISO 9241-5',
      especificacionesSST:
        'Mecanismo sincrónico multiposición, regulación neumática de altura, cabecero y brazos 3D ajustables, tapizado transpirable ignífugo para prevención de DME.',
      criteriosVerificados:
        'Ficha técnica biomecánica BIFMA/NTC 5655, garantía de 5 años y aval de ergonomía del SG-SST.',
      requiereFdsSga: false,
      requiereCertificadoCalidad: true,
      dictamenSST: 'Aprobado para Compra',
      responsableEvaluacion: respDefault,
      fechaEvaluacion: today,
    });
  }

  // 7. Asegurar mínimo 4 registros iniciales realistas si el ecosistema tiene pocos módulos poblados
  const fallbackDefaults = [
    {
      productoServicio: 'Lote de arneses multipropósito dieléctricos 4 argollas y eslingas con absorbente',
      categoria: 'Equipos de Alturas y Emergencias',
      origenEcosistema: 'Equipos de Alturas (Hito 5)',
      proveedorSugerido: 'Seguridad y Alturas Industrial SAS',
      nitProveedor: '900.812.345-1',
      cantidadUnidad: '10 Unidades',
      normaTecnica: 'ANSI/ASSP Z359.11-2021 · Resolución 4272 de 2021',
      especificacionesSST:
        'Certificación ANSI Z359.11, resistencia dieléctrica 14 kV, capacidad 5.000 lb y etiqueta indeleble con serial y fecha de fabricación.',
      criteriosVerificados:
        'Certificado de laboratorio acreditado ONAC/ANSI, ficha técnica en español y apertura de hoja de vida.',
      requiereFdsSga: false,
      requiereCertificadoCalidad: true,
      dictamenSST: 'Aprobado para Compra',
      responsableEvaluacion: respDefault,
      fechaEvaluacion: today,
    },
    {
      productoServicio: 'Desengrasante industrial biodegradable para mantenimiento mecánico y locativo',
      categoria: 'Sustancias Químicas SGA',
      origenEcosistema: 'Inventario Químico SGA (Hito 1/5)',
      proveedorSugerido: 'Químicos y Soluciones Ecológicas Ltda',
      nitProveedor: '890.445.120-9',
      cantidadUnidad: '15 Galones',
      normaTecnica: 'SGA Decreto 1496 de 2018 · Resolución 773 de 2021',
      especificacionesSST:
        'Ficha de Datos de Seguridad (FDS) vigente de 16 secciones en español, libre de solventes clorados carcinógenos y envase rotulado bajo SGA.',
      criteriosVerificados:
        'Verificación de compatibilidad química en bodega; se condiciona entrega a envío de FDS actualizada versión 2025/2026.',
      requiereFdsSga: true,
      requiereCertificadoCalidad: true,
      dictamenSST: 'Condicionado / Exige Ajuste',
      responsableEvaluacion: respDefault,
      fechaEvaluacion: today,
    },
    {
      productoServicio: 'Guantes de nitrilo anticorte nivel A4, gafas de seguridad antiempañantes y protectores auditivos',
      categoria: 'Elementos de Protección Personal (EPP)',
      origenEcosistema: 'Matriz de EPP (Hito 5)',
      proveedorSugerido: 'Distribuidora Nacional de Protección Laboral SAS',
      nitProveedor: '901.223.908-4',
      cantidadUnidad: '30 Kits EPP',
      normaTecnica: 'ANSI/ISEA 105 · ANSI Z87.1 · ANSI S3.19',
      especificacionesSST:
        'Protección mecánica nivel EN388 4X43D, lentes en policarbonato con filtro UV 99.9% y protectores auditivos con NRR >= 27 dB.',
      criteriosVerificados:
        'Certificados de conformidad ANSI/EN por lote, fichas técnicas en español y muestras validadas con trabajadores.',
      requiereFdsSga: false,
      requiereCertificadoCalidad: true,
      dictamenSST: 'Aprobado para Compra',
      responsableEvaluacion: respDefault,
      fechaEvaluacion: today,
    },
    {
      productoServicio: 'Herramienta electroportátil (Pulidora angular 7" con freno mecánico y hombre muerto)',
      categoria: 'Maquinaria y Herramientas',
      origenEcosistema: 'Matriz IPEVR GTC 45 (Hito 1)',
      proveedorSugerido: 'Maquinaria y Herramientas Industriales SAS',
      nitProveedor: '800.912.671-2',
      cantidadUnidad: '4 Unidades',
      normaTecnica: 'Res. 2400 de 1979 · IEC 60745 · ISO 12100',
      especificacionesSST:
        'Guarda protectora metálica de ajuste rápido sin llave, interruptor de seguridad tipo paleta (dead-man), sistema antivibración en mango y doble aislamiento eléctrico.',
      criteriosVerificados:
        'Manual operativo en español, ficha de niveles de vibración/ruido y lista de chequeo preoperacional.',
      requiereFdsSga: false,
      requiereCertificadoCalidad: true,
      dictamenSST: 'Aprobado para Compra',
      responsableEvaluacion: respDefault,
      fechaEvaluacion: today,
    },
  ];

  for (const fb of fallbackDefaults) {
    if (candidates.length >= 6) break;
    if (
      !candidates.some(
        (c) =>
          c.categoria === fb.categoria &&
          c.productoServicio.toLowerCase().slice(0, 18) === fb.productoServicio.toLowerCase().slice(0, 18)
      )
    ) {
      candidates.push(fb);
    }
  }

  return candidates.map((item, idx) => ({
    ...item,
    id: item.id || `adq_seed_${Date.now()}_${idx}`,
    codigo: item.codigo || `ADQ-2026-${String(idx + 1).padStart(3, '0')}`,
    sentToKanban: Boolean(item.sentToKanban),
  }));
}

function buildComprasMetrics(compras = [], criteriosMatriz = [], eco = {}) {
  const totalCompras = compras.length;
  const aprobadasCount = compras.filter((c) => c.dictamenSST === 'Aprobado para Compra').length;
  const condicionadasCount = compras.filter(
    (c) => c.dictamenSST === 'Condicionado / Exige Ajuste'
  ).length;
  const rechazadasCount = compras.filter((c) => c.dictamenSST === 'Rechazado').length;
  const conFdsCount = compras.filter((c) => c.requiereFdsSga).length;
  const conCertificadoCount = compras.filter((c) => c.requiereCertificadoCalidad).length;
  const aprobacionPct = totalCompras > 0 ? round2((aprobadasCount / totalCompras) * 100) : 100;

  return {
    totalCompras,
    aprobadasCount,
    condicionadasCount,
    rechazadasCount,
    conFdsCount,
    conCertificadoCount,
    aprobacionPct,
    criteriosCount: criteriosMatriz.length,
    eppDeliveredCount: eco.allEppEntregas?.length || 0,
    eppInventoryCount: eco.eppInventoryItems?.length || 0,
    eppLowStockCount: eco.eppLowStockItems?.length || 0,
    eppSolicitudesCount: eco.eppSolicitudes?.length || 0,
    eppSolicitudesPendientes: eco.eppSolicitudesPendientes?.length || 0,
    chemicalProductsCount: eco.chemProducts?.length || 0,
    chemicalsWithFdsCount: eco.chemicalsWithFdsCount || 0,
    chemicalsMissingFdsCount: eco.chemicalsMissingFdsCount || 0,
    fdsCompliancePct: round2(eco.fdsCompliancePct ?? 100),
    heightsEquipmentCount: eco.allHeightsEquipos?.length || 0,
    vehiclesCount: eco.vehiclesList?.length || 0,
    emergencyEquipmentCount: eco.emergencyEquipos?.length || 0,
    gtc45HazardsCount: eco.totalGtcHazards || 0,
    ergonomicStudiesCount: eco.ergonomicStudiesCount || 0,
    diagnosticoScore: round2(eco.diagnosticoScore || 0),
    estandar291Status: eco.estandar291Status || 'cumple',
    estandar291Cumple: Boolean(eco.estandar291Cumple ?? true),
    auditoriaScore: round2(eco.auditoriaScore || 0),
    aud291Status: eco.aud291Status || 'conforme',
    acpmComprasCount: eco.acpmComprasCount || 0,
    acpmPendingCount: eco.acpmPendingCount || 0,
  };
}

/**
 * GET /api/sgsst/compras/data
 * Carga las compras SST, matriz de criterios por familia y métricas 360° del ecosistema.
 * Si no existe o está vacío, realiza auto-seed inteligente.
 */
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, eco] = await Promise.all([
      SgsstComprasData.findOne(filter).lean(),
      gatherComprasEcosystemData(userId, companyId, company),
    ]);

    let compras = Array.isArray(existingDoc?.compras) ? existingDoc.compras : [];
    let criteriosMatriz = Array.isArray(existingDoc?.criteriosMatriz)
      ? existingDoc.criteriosMatriz
      : [];
    let needsSave = false;

    if (compras.length === 0) {
      compras = buildComprasCandidatesFromEcosystem(eco, company);
      needsSave = true;
    }
    if (criteriosMatriz.length === 0) {
      criteriosMatriz = DEFAULT_CRITERIOS_MATRIZ;
      needsSave = true;
    }

    if (needsSave && userId && mongoose.isValidObjectId(userId)) {
      await SgsstComprasData.findOneAndUpdate(
        filter,
        {
          $set: {
            compras,
            criteriosMatriz,
            companyId,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      ).catch((e) => logger.warn('[SGSST Compras] Auto-seed save warning:', e.message));
    }

    const ecosystemMetrics = buildComprasMetrics(compras, criteriosMatriz, eco);

    return res.json({
      compras,
      criteriosMatriz,
      lastGeneratedReport: existingDoc?.lastGeneratedReport || '',
      conversationId: existingDoc?.conversationId || null,
      messageId: existingDoc?.messageId || null,
      company,
      ecosystemMetrics,
    });
  } catch (error) {
    logger.error('[SGSST Compras] GET /data error:', error);
    return res.status(500).json({
      error: 'Error al cargar los datos de Compras y Adquisiciones en SST.',
    });
  }
});

/**
 * POST /api/sgsst/compras/data
 * Guarda las adquisiciones evaluadas y matriz de criterios técnicos en MongoDB.
 */
router.post('/data', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const {
      compras,
      criteriosMatriz,
      lastGeneratedReport,
      conversationId,
      messageId,
    } = req.body;

    const normalizedCompras = Array.isArray(compras)
      ? compras.map((c, idx) => ({
          id: c.id || `adq_${Date.now()}_${idx}`,
          codigo: c.codigo || `ADQ-2026-${String(idx + 1).padStart(3, '0')}`,
          productoServicio: String(c.productoServicio || 'Adquisición SST').trim(),
          categoria: c.categoria || 'Elementos de Protección Personal (EPP)',
          origenEcosistema: c.origenEcosistema || 'Requerimiento Directo',
          proveedorSugerido: c.proveedorSugerido || 'Por definir por Compras',
          nitProveedor: c.nitProveedor || '',
          cantidadUnidad: c.cantidadUnidad || '1 Unidad',
          normaTecnica: c.normaTecnica || 'NTC / ANSI / OSHA aplicable',
          especificacionesSST: c.especificacionesSST || '',
          criteriosVerificados: c.criteriosVerificados || '',
          requiereFdsSga: Boolean(c.requiereFdsSga),
          requiereCertificadoCalidad:
            c.requiereCertificadoCalidad !== undefined ? Boolean(c.requiereCertificadoCalidad) : true,
          dictamenSST: c.dictamenSST || 'Aprobado para Compra',
          responsableEvaluacion:
            c.responsableEvaluacion || company?.responsibleSST || 'Responsable SG-SST',
          fechaEvaluacion: c.fechaEvaluacion || new Date().toISOString().split('T')[0],
          sentToKanban: Boolean(c.sentToKanban),
        }))
      : undefined;

    const normalizedCriterios = Array.isArray(criteriosMatriz)
      ? criteriosMatriz.map((cr, idx) => ({
          id: cr.id || `crit_${Date.now()}_${idx}`,
          familia: cr.familia || 'Categoría General SST',
          normaExigida: cr.normaExigida || '',
          requisitosObligatorios: cr.requisitosObligatorios || '',
          documentosRecepcion: cr.documentosRecepcion || '',
          responsableVerificacion:
            cr.responsableVerificacion || 'Responsable SG-SST / Almacén',
        }))
      : undefined;

    const updateFields = {
      companyId,
      updatedAt: new Date(),
    };
    if (normalizedCompras !== undefined) updateFields.compras = normalizedCompras;
    if (normalizedCriterios !== undefined) updateFields.criteriosMatriz = normalizedCriterios;
    if (lastGeneratedReport !== undefined) updateFields.lastGeneratedReport = lastGeneratedReport;
    if (conversationId !== undefined) updateFields.conversationId = conversationId;
    if (messageId !== undefined) updateFields.messageId = messageId;

    const updated = await SgsstComprasData.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { upsert: true, new: true }
    ).lean();

    const eco = await gatherComprasEcosystemData(userId, companyId, company);
    const ecosystemMetrics = buildComprasMetrics(
      updated?.compras || [],
      updated?.criteriosMatriz || DEFAULT_CRITERIOS_MATRIZ,
      eco
    );

    return res.json({
      success: true,
      data: updated,
      compras: updated?.compras || [],
      criteriosMatriz: updated?.criteriosMatriz || DEFAULT_CRITERIOS_MATRIZ,
      ecosystemMetrics,
    });
  } catch (error) {
    logger.error('[SGSST Compras] POST /data error:', error);
    return res.status(500).json({
      error: 'Error al guardar el Padrón de Compras y Adquisiciones en SST.',
    });
  }
});

/**
 * POST /api/sgsst/compras/sync-ecosystem
 * Sincroniza requerimientos reales desde EPP, Inventario Químico SGA, Alturas, PESV, PPRE, GTC 45 y Ergonomía sin duplicar.
 */
router.post('/sync-ecosystem', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, eco] = await Promise.all([
      SgsstComprasData.findOne(filter).lean(),
      gatherComprasEcosystemData(userId, companyId, company),
    ]);

    const currentCompras = Array.isArray(existingDoc?.compras) ? [...existingDoc.compras] : [];
    const currentCriterios =
      Array.isArray(existingDoc?.criteriosMatriz) && existingDoc.criteriosMatriz.length > 0
        ? existingDoc.criteriosMatriz
        : DEFAULT_CRITERIOS_MATRIZ;

    const norm = (s) => String(s || '').trim().toLowerCase();
    const existingKeys = new Set(currentCompras.map((c) => norm(c.productoServicio)));

    const candidates = buildComprasCandidatesFromEcosystem(eco, company);

    // También agregar productos químicos adicionales del inventario y equipos de alturas/emergencia si existen
    const today = new Date().toISOString().split('T')[0];
    const respDefault = company?.responsibleSST || 'Responsable SG-SST';

    for (const ch of (eco.chemProducts || []).slice(0, 4)) {
      const title = `${ch.nombre} (${ch.claseOnu || 'Sustancia Química SGA'})`;
      candidates.push({
        productoServicio: title,
        categoria: 'Sustancias Químicas SGA',
        origenEcosistema: 'Inventario Químico SGA (Hito 1/5)',
        proveedorSugerido: ch.fabricante || 'Proveedor Químico Certificado',
        nitProveedor: '890.315.742-8',
        cantidadUnidad: ch.cantidadAlmacenada || '10 Galones',
        normaTecnica: 'Decreto 1496 de 2018 · Resolución 773 de 2021 (SGA)',
        especificacionesSST:
          ch.requisitosAlmacenamiento ||
          'Envase certificado ONU, rotulado SGA en español y Ficha de Datos de Seguridad (FDS) de 16 secciones.',
        criteriosVerificados:
          ch.tieneFds === 'Sí'
            ? 'FDS de 16 secciones verificada y almacenamiento compatible según Matriz SGA.'
            : 'Pendiente entrega de FDS actualizada de 16 secciones antes de recepción en almacén.',
        requiereFdsSga: true,
        requiereCertificadoCalidad: true,
        dictamenSST: ch.tieneFds === 'Sí' ? 'Aprobado para Compra' : 'Condicionado / Exige Ajuste',
        responsableEvaluacion: respDefault,
        fechaEvaluacion: today,
      });
    }

    for (const item of (eco.eppInventoryItems || []).slice(0, 3)) {
      candidates.push({
        productoServicio: `${item.nombre} (${item.categoria || 'Dotación EPP'})`,
        categoria: 'Elementos de Protección Personal (EPP)',
        origenEcosistema: 'Matriz de EPP (Hito 5)',
        proveedorSugerido: item.marca ? `Distribuidor ${item.marca}` : 'Proveedor EPP Certificado SAS',
        nitProveedor: '900.412.889-1',
        cantidadUnidad: `${Math.max(10, Number(item.stockMinimo || 5) * 2)} ${item.unidad || 'Unidades'}`,
        normaTecnica: 'ANSI / NIOSH / NTC · Res. 2400 de 1979',
        especificacionesSST: `EPP tipo ${item.tipo || 'Regular'}, referencia ${item.referencia || 'Certificada'}, talla ${item.talla || 'Única'}.`,
        criteriosVerificados: 'Certificado de calidad del fabricante y registro en Kardex de EPP.',
        requiereFdsSga: false,
        requiereCertificadoCalidad: true,
        dictamenSST: 'Aprobado para Compra',
        responsableEvaluacion: respDefault,
        fechaEvaluacion: today,
      });
    }

    let addedCount = 0;
    for (const cand of candidates) {
      const key = norm(cand.productoServicio);
      if (!key || existingKeys.has(key)) continue;
      const nextNum = currentCompras.length + 1;
      currentCompras.push({
        ...cand,
        id: `adq_sync_${Date.now()}_${nextNum}`,
        codigo: `ADQ-2026-${String(nextNum).padStart(3, '0')}`,
        sentToKanban: false,
      });
      existingKeys.add(key);
      addedCount++;
    }

    await SgsstComprasData.findOneAndUpdate(
      filter,
      {
        $set: {
          compras: currentCompras,
          criteriosMatriz: currentCriterios,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const ecosystemMetrics = buildComprasMetrics(currentCompras, currentCriterios, eco);

    return res.json({
      success: true,
      addedCount,
      compras: currentCompras,
      criteriosMatriz: currentCriterios,
      ecosystemMetrics,
      message:
        addedCount > 0
          ? `Sincronización 360° completada: se importaron +${addedCount} adquisiciones técnicas desde EPP, Químicos SGA, Alturas, PESV y Emergencias.`
          : 'El Padrón de Compras y Adquisiciones SST ya está 100% sincronizado con los módulos de Somos SST.',
    });
  } catch (error) {
    logger.error('[SGSST Compras] POST /sync-ecosystem error:', error);
    return res.status(500).json({
      error: 'Error al sincronizar compras con el ecosistema Somos SST.',
    });
  }
});

/**
 * POST /api/sgsst/compras/ai-suggest
 * Usa generateWithKeyRotation con el contexto real de la empresa para sugerir y añadir 3 a 4 nuevas evaluaciones de compra SST.
 */
async function handleAiSuggestCompras(req, res) {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const { modelName, customPrompt } = req.body || {};
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, eco, fullContext] = await Promise.all([
      SgsstComprasData.findOne(filter).lean(),
      gatherComprasEcosystemData(userId, companyId, company),
      gatherCompanyFullContext(userId, companyId),
    ]);

    const currentCompras = Array.isArray(existingDoc?.compras) ? [...existingDoc.compras] : [];
    const currentCriterios =
      Array.isArray(existingDoc?.criteriosMatriz) && existingDoc.criteriosMatriz.length > 0
        ? existingDoc.criteriosMatriz
        : DEFAULT_CRITERIOS_MATRIZ;

    const companyContextStr = buildCompanyContextString(company || {});
    const existingListStr = currentCompras
      .slice(0, 10)
      .map((c) => `- ${c.codigo}: ${c.productoServicio} (${c.categoria})`)
      .join('\n');

    const promptText = `Eres un Auditor Líder ISO 45001:2018 (Cláusula 8.1.4.1 Compras) y Especialista en SG-SST en Colombia (Decreto 1072 de 2015 Art. 2.2.4.6.27 y Resolución 0312 de 2019 Estándar 2.9.1).

=== CONTEXTO REAL DE LA EMPRESA ===
${companyContextStr}
- Peligros críticos GTC-45: ${fullContext.ecosystemMetrics?.peligrosCriticos || 0} de ${fullContext.ecosystemMetrics?.totalPeligros || 0}.
- Inventario Químico SGA: ${eco.chemProducts.length} productos (${eco.fdsCompliancePct}% con FDS).
- Entregas EPP: ${eco.allEppEntregas.length} · Equipos Alturas: ${eco.allHeightsEquipos.length} · Flota PESV: ${eco.vehiclesList.length} vehículos.
${customPrompt ? `\nRequerimiento específico del usuario: "${customPrompt}"` : ''}

=== ADQUISICIONES YA REGISTRADAS (NO DUPLICAR) ===
${existingListStr || 'Ninguna aún.'}

Genera entre 3 y 4 NUEVOS registros técnicos de evaluación de compras y adquisiciones en SST de alto impacto preventivo para esta empresa.
RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO:
{
  "nuevasCompras": [
    {
      "productoServicio": "Nombre técnico detallado del bien, equipo, EPP, insumo químico o servicio...",
      "categoria": "Elementos de Protección Personal (EPP) | Sustancias Químicas SGA | Maquinaria y Herramientas | Equipos de Alturas y Emergencias | Parque Automotor / PESV | Mobiliario y Ergonomía | Servicios e Instalaciones",
      "origenEcosistema": "Matriz de EPP (Hito 5) | Inventario Químico SGA (Hito 1/5) | Equipos de Alturas (Hito 5) | Flota Automotor PESV (Hito 5) | Plan de Emergencias PPRE (Hito 1) | Matriz IPEVR GTC 45 (Hito 1) | Estudio de Puesto / OWAS (Hito 4)",
      "proveedorSugerido": "Razón social realista del proveedor especializado",
      "nitProveedor": "900.XXX.XXX-X",
      "cantidadUnidad": "Ej: 12 Unidades",
      "normaTecnica": "Norma técnica exacta (ej: ANSI Z359.11 / Res. 4272 de 2021 / SGA Dec. 1496/2018 / NTC 2885)",
      "especificacionesSST": "Especificaciones técnicas obligatorias de seguridad y salud antes de comprar...",
      "criteriosVerificados": "Documentos y pruebas verificadas en el filtro preventivo...",
      "requiereFdsSga": false,
      "requiereCertificadoCalidad": true,
      "dictamenSST": "Aprobado para Compra | Condicionado / Exige Ajuste",
      "responsableEvaluacion": "${company?.responsibleSST || 'Responsable SG-SST'}"
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
      aiItems = Array.isArray(parsed?.nuevasCompras)
        ? parsed.nuevasCompras
        : Array.isArray(parsed)
          ? parsed
          : [];
    } catch (aiErr) {
      logger.warn('[SGSST Compras] AI fallback deterministic items:', aiErr.message);
      aiItems = [
        {
          productoServicio:
            'Detector portátil multigás (O2, LEL, CO, H2S) con alarma acústica/visual y certificado de calibración',
          categoria: 'Equipos de Alturas y Emergencias',
          origenEcosistema: 'Matriz IPEVR GTC 45 (Hito 1)',
          proveedorSugerido: 'Instrumentación y Seguridad Industrial de Colombia SAS',
          nitProveedor: '900.654.312-7',
          cantidadUnidad: '2 Unidades',
          normaTecnica: 'Resolución 0491 de 2020 · ANSI/ISA 92.02.01 · ATEX Intrínsecamente Seguro',
          especificacionesSST:
            'Certificación de seguridad intrínseca ATEX/UL Clase I Div 1, bomba de muestreo integrada y batería de 18 horas.',
          criteriosVerificados:
            'Certificado vigente de calibración en laboratorio acreditado ISO/IEC 17025 y manual en español.',
          requiereFdsSga: false,
          requiereCertificadoCalidad: true,
          dictamenSST: 'Aprobado para Compra',
          responsableEvaluacion: company?.responsibleSST || 'Responsable SG-SST',
        },
        {
          productoServicio:
            'Estación lavaojos de emergencia portátil presurizada en acero inoxidable y Kit Antiderrames SGA 30 gal',
          categoria: 'Sustancias Químicas SGA',
          origenEcosistema: 'Inventario Químico SGA (Hito 1/5)',
          proveedorSugerido: 'Soluciones Ambientales y HAZMAT SAS',
          nitProveedor: '901.340.819-3',
          cantidadUnidad: '3 Estaciones',
          normaTecnica: 'ANSI/ISEA Z358.1 · Decreto 1496 de 2018 (SGA)',
          especificacionesSST:
            'Flujo continuo mínimo de 1.5 L/min durante 15 minutos con solución oftálmica estéril y absorbentes hidrofóbicos/universales.',
          criteriosVerificados:
            'Certificado de cumplimiento ANSI Z358.1, FDS de solución salina y protocolo de inspección mensual.',
          requiereFdsSga: true,
          requiereCertificadoCalidad: true,
          dictamenSST: 'Aprobado para Compra',
          responsableEvaluacion: company?.responsibleSST || 'Responsable SG-SST',
        },
        {
          productoServicio:
            'Kit de Bloqueo y Etiquetado de Energías Peligrosas (LOTO) dieléctrico para mantenimiento eléctrico/mecánico',
          categoria: 'Maquinaria y Herramientas',
          origenEcosistema: 'Matriz IPEVR GTC 45 (Hito 1)',
          proveedorSugerido: 'Suministros Eléctricos y LOTO Certificados SAS',
          nitProveedor: '890.914.205-6',
          cantidadUnidad: '6 Kits LOTO',
          normaTecnica: 'OSHA 29 CFR 1910.147 · Res. 5018 de 2019 · RETIE',
          especificacionesSST:
            'Candados dieléctricos de arco de nylon no conductivo con llave única, bloqueadores universales de breakers/válvulas y tarjetas de peligro.',
          criteriosVerificados:
            'Ficha técnica de rigidez dieléctrica, codificación única de llaves y procedimiento de control de energías.',
          requiereFdsSga: false,
          requiereCertificadoCalidad: true,
          dictamenSST: 'Aprobado para Compra',
          responsableEvaluacion: company?.responsibleSST || 'Responsable SG-SST',
        },
      ];
    }

    const norm = (s) => String(s || '').trim().toLowerCase();
    const existingKeys = new Set(currentCompras.map((c) => norm(c.productoServicio)));
    let addedCount = 0;

    for (const item of aiItems) {
      const prodName = String(item.productoServicio || '').trim();
      if (!prodName || existingKeys.has(norm(prodName))) continue;
      const nextNum = currentCompras.length + 1;
      currentCompras.push({
        id: `adq_ai_${Date.now()}_${nextNum}`,
        codigo: `ADQ-2026-${String(nextNum).padStart(3, '0')}`,
        productoServicio: prodName,
        categoria: item.categoria || 'Elementos de Protección Personal (EPP)',
        origenEcosistema: item.origenEcosistema || 'Matriz IPEVR GTC 45 (Hito 1)',
        proveedorSugerido: item.proveedorSugerido || 'Proveedor Especializado SST SAS',
        nitProveedor: item.nitProveedor || '900.500.100-1',
        cantidadUnidad: item.cantidadUnidad || '5 Unidades',
        normaTecnica: item.normaTecnica || 'ANSI / NTC / Res. 2400 de 1979',
        especificacionesSST: item.especificacionesSST || '',
        criteriosVerificados: item.criteriosVerificados || '',
        requiereFdsSga: Boolean(item.requiereFdsSga),
        requiereCertificadoCalidad:
          item.requiereCertificadoCalidad !== undefined ? Boolean(item.requiereCertificadoCalidad) : true,
        dictamenSST: item.dictamenSST || 'Aprobado para Compra',
        responsableEvaluacion:
          item.responsableEvaluacion || company?.responsibleSST || 'Responsable SG-SST',
        fechaEvaluacion: today,
        sentToKanban: false,
      });
      existingKeys.add(norm(prodName));
      addedCount++;
    }

    await SgsstComprasData.findOneAndUpdate(
      filter,
      {
        $set: {
          compras: currentCompras,
          criteriosMatriz: currentCriterios,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const ecosystemMetrics = buildComprasMetrics(currentCompras, currentCriterios, eco);

    return res.json({
      success: true,
      addedCount,
      compras: currentCompras,
      criteriosMatriz: currentCriterios,
      ecosystemMetrics,
      message: `Se generaron y agregaron +${addedCount} evaluaciones técnicas de compras SST con IA.`,
    });
  } catch (error) {
    logger.error('[SGSST Compras] POST /ai-suggest error:', error);
    return res.status(500).json({
      error: 'Error al generar sugerencias de compras SST con IA.',
    });
  }
}

router.post('/ai-suggest', requireJwtAuth, handleAiSuggestCompras);
router.post('/generate-ai', requireJwtAuth, handleAiSuggestCompras);

/**
 * POST /api/sgsst/compras/generate
 * Genera el Procedimiento y Dictamen Oficial de Compras y Adquisiciones en SST (Est. 2.9.1 Res. 0312 · Art. 2.2.4.6.27 Dec. 1072 · ISO 45001 Cl. 8.1.4.1)
 */
async function handleGenerateComprasReport(req, res) {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, eco] = await Promise.all([
      SgsstComprasData.findOne(filter).lean(),
      gatherComprasEcosystemData(userId, companyId, company),
    ]);

    const compras =
      Array.isArray(req.body?.compras) && req.body.compras.length > 0
        ? req.body.compras
        : Array.isArray(existingDoc?.compras) && existingDoc.compras.length > 0
          ? existingDoc.compras
          : buildComprasCandidatesFromEcosystem(eco, company);

    const criteriosMatriz =
      Array.isArray(req.body?.criteriosMatriz) && req.body.criteriosMatriz.length > 0
        ? req.body.criteriosMatriz
        : Array.isArray(existingDoc?.criteriosMatriz) && existingDoc.criteriosMatriz.length > 0
          ? existingDoc.criteriosMatriz
          : DEFAULT_CRITERIOS_MATRIZ;

    const modelName = req.body?.modelName || 'gemini-2.5-flash';
    const metrics = buildComprasMetrics(compras, criteriosMatriz, eco);

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const headerHtml = buildStandardHeader({
      title: 'PROCEDIMIENTO Y MATRIZ DE IDENTIFICACIÓN Y EVALUACIÓN DE ADQUISICIONES Y COMPRAS EN SST',
      companyInfo: company,
      date: currentDate,
      norm: 'Decreto 1072 de 2015 Art. 2.2.4.6.27 · Resolución 0312 de 2019 Estándar 2.9.1 · ISO 45001:2018 Cláusula 8.1.4.1',
      code: 'SST-PR-ADQ-001',
      version: '02',
      responsibleName: company?.responsibleSST || req.user?.name,
    });

    // Generar dictamen ejecutivo enriquecido por IA (con fallback determinista instantáneo)
    let aiAnalysisHtml = '';
    try {
      const aiPrompt = `Eres un Auditor Líder en Seguridad y Salud en el Trabajo (Dec. 1072/2015 Art. 2.2.4.6.27, Res. 0312/2019 Est. 2.9.1 e ISO 45001:2018 Cl. 8.1.4.1).
Redacta un Dictamen Técnico y Recomendaciones de Control Preventivo en Compras (2 párrafos ejecutivos en HTML usando únicamente etiquetas <p>, <strong> y <ul><li> con estilos inline sobrios color #1e293b) para la empresa "${company?.companyName || 'la Organización'}" (Actividad: ${company?.economicActivity || 'Industrial/Servicios'}, Nivel de Riesgo ARL: ${company?.riskLevel || 'III'}).
Datos reales: ${metrics.totalCompras} adquisiciones evaluadas (${metrics.aprobadasCount} aprobadas, ${metrics.condicionadasCount} condicionadas, ${metrics.rechazadasCount} rechazadas; tasa de conformidad: ${metrics.aprobacionPct}%). Inventario químico SGA: ${metrics.chemicalProductsCount} productos (${metrics.fdsCompliancePct}% con FDS). Entregas EPP: ${metrics.eppDeliveredCount}. Equipos de alturas: ${metrics.heightsEquipmentCount}. Flota PESV: ${metrics.vehiclesCount}.
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
      logger.warn('[SGSST Compras] Using deterministic HTML analysis fallback:', aiErr.message);
    }

    if (!aiAnalysisHtml) {
      aiAnalysisHtml = `
        <p style="margin: 0 0 8px 0; font-size: 11.5px; color: #1e293b;">
          Con fundamento en el <strong>Artículo 2.2.4.6.27 del Decreto 1072 de 2015</strong>, el <strong>Estándar 2.9.1 de la Resolución 0312 de 2019</strong> y la <strong>Cláusula 8.1.4.1 de ISO 45001:2018</strong>, <strong>${company?.companyName || 'la Organización'}</strong> mantiene un filtro preventivo de Seguridad y Salud en el Trabajo previo a la emisión de órdenes de compra, registrando actualmente <strong>${metrics.totalCompras} adquisiciones evaluadas</strong> con un índice de aprobación técnica del <strong>${metrics.aprobacionPct}%</strong> (${metrics.aprobadasCount} aprobadas y ${metrics.condicionadasCount} condicionadas).
        </p>
        <ul style="margin: 4px 0 0 0; padding-left: 18px; font-size: 11px; color: #334155;">
          <li><strong>Control de Sustancias Químicas SGA (Dec. 1496/2018):</strong> Ningún producto químico ingresa a almacén sin su Ficha de Datos de Seguridad (FDS de 16 secciones en español) y validación en la Matriz de Compatibilidad (${metrics.chemicalProductsCount} sustancias monitoreadas · ${metrics.fdsCompliancePct}% cumplimiento FDS).</li>
          <li><strong>Aseguramiento de EPP, Alturas y PESV:</strong> Se verifica sello de certificación ANSI/NIOSH/NTC en las ${metrics.eppDeliveredCount} entregas de EPP, trazabilidad de serial en los ${metrics.heightsEquipmentCount} equipos contra caídas (Res. 4272/2021) y repuestos críticos en los ${metrics.vehiclesCount} vehículos del PESV.</li>
          <li><strong>Articulación con Gestión del Cambio (MOC):</strong> Toda compra de maquinaria nueva, reactivo químico no habitual o modificación de diseño activa automáticamente evaluación de peligros en la Matriz IPEVR (GTC 45) y en Gestión del Cambio (Art. 2.2.4.6.26).</li>
        </ul>`;
    }

    const criteriosRowsHtml = criteriosMatriz
      .map(
        (cr, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10.5px; color: #1e293b;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e; vertical-align: top;">${cr.familia}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: 600;">${cr.normaExigida}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${cr.requisitosObligatorios}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${cr.documentosRecepcion}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top; text-align: center;"><strong>${cr.responsableVerificacion}</strong></td>
        </tr>`
      )
      .join('');

    const comprasRowsHtml = compras
      .map((c, idx) => {
        const badgeColor =
          c.dictamenSST === 'Aprobado para Compra'
            ? '#047857'
            : c.dictamenSST === 'Rechazado'
              ? '#b91c1c'
              : '#b45309';
        const badgeBg =
          c.dictamenSST === 'Aprobado para Compra'
            ? '#ecfdf5'
            : c.dictamenSST === 'Rechazado'
              ? '#fef2f2'
              : '#fffbeb';
        return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10.5px; color: #1e293b;">
          <td style="padding: 8px 9px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e; vertical-align: top;">
            ${c.codigo}
            <div style="font-size: 9px; color: #64748b; font-weight: normal; margin-top: 2px;">${c.fechaEvaluacion || ''}</div>
          </td>
          <td style="padding: 8px 9px; border: 1px solid #cbd5e1; vertical-align: top;">
            <strong>${c.productoServicio}</strong>
            <div style="font-size: 9.5px; color: #0f766e; margin-top: 2px;">${c.categoria} · Cant: ${c.cantidadUnidad || '1 Und'}</div>
            <div style="font-size: 9px; color: #64748b;">Origen: ${c.origenEcosistema || 'SG-SST'}</div>
          </td>
          <td style="padding: 8px 9px; border: 1px solid #cbd5e1; vertical-align: top;">
            <strong>${c.proveedorSugerido || 'Por definir'}</strong>
            ${c.nitProveedor ? `<div style="font-size: 9px; color: #64748b;">NIT: ${c.nitProveedor}</div>` : ''}
          </td>
          <td style="padding: 8px 9px; border: 1px solid #cbd5e1; vertical-align: top;">
            <div style="font-weight: 700; color: #334155; font-size: 9.5px; margin-bottom: 2px;">${c.normaTecnica || 'NTC / ANSI'}</div>
            ${c.especificacionesSST}
          </td>
          <td style="padding: 8px 9px; border: 1px solid #cbd5e1; vertical-align: top;">
            ${c.criteriosVerificados}
            <div style="font-size: 9px; color: #0f766e; margin-top: 3px;">
              ${c.requiereCertificadoCalidad ? '✔ Exige Cert. Calidad ' : ''}${c.requiereFdsSga ? '· ✔ Exige FDS 16 Secc. SGA' : ''}
            </div>
          </td>
          <td style="padding: 8px 9px; border: 1px solid #cbd5e1; vertical-align: top; text-align: center;">
            <span style="display: inline-block; padding: 3px 7px; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}; font-weight: 700; font-size: 9.5px;">
              ${c.dictamenSST}
            </span>
            <div style="font-size: 9px; color: #475569; margin-top: 3px;">${c.responsableEvaluacion || 'Responsable SG-SST'}</div>
          </td>
        </tr>`;
      })
      .join('');

    const reportBody = `
<div style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; line-height: 1.55; max-width: 100%;">

  <!-- 1. OBJETO, ALCANCE Y MARCO JURÍDICO -->
  <div style="margin-bottom: 20px; padding: 14px 18px; background-color: #f0fdfa; border-left: 4px solid #0f766e;">
    <h3 style="margin: 0 0 6px 0; color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase;">
      1. Objeto, Alcance y Cumplimiento Normativo (Dec. 1072 Art. 2.2.4.6.27 · Res. 0312 Est. 2.9.1)
    </h3>
    <p style="margin: 0; font-size: 11px; color: #334155;">
      Establecer el procedimiento obligatorio de identificación, evaluación técnica y verificación de requisitos de Seguridad y Salud en el Trabajo para la adquisición de bienes, materias primas, sustancias químicas (SGA), maquinaria, equipos de alturas/emergencias, repuestos del parque automotor (PESV), mobiliario ergonómico y Elementos de Protección Personal (EPP) en <strong>${company?.companyName || 'la Organización'}</strong>, previniendo la introducción de peligros no controlados en los centros de trabajo.
    </p>
  </div>

  <!-- 2. INDICADORES CONSOLIDADOS DEL ECOSISTEMA 360° -->
  <div style="margin-bottom: 22px;">
    <h3 style="color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      2. Tablero de Trazabilidad 360° de Adquisiciones SST
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1;">
      <tr style="background-color: #f8fafc;">
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 17px; font-weight: 800; color: #0f766e;">${metrics.totalCompras}</div>
          <div style="font-size: 9.5px; color: #475569; text-transform: uppercase;">Adquisiciones Evaluadas</div>
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 17px; font-weight: 800; color: #047857;">${metrics.aprobacionPct}% (${metrics.aprobadasCount})</div>
          <div style="font-size: 9.5px; color: #475569; text-transform: uppercase;">Aprobadas con Aval SST</div>
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 17px; font-weight: 800; color: #0284c7;">${metrics.fdsCompliancePct}%</div>
          <div style="font-size: 9.5px; color: #475569; text-transform: uppercase;">Químicos con FDS SGA (${metrics.chemicalsWithFdsCount}/${metrics.chemicalProductsCount})</div>
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 17px; font-weight: 800; color: #b45309;">${metrics.eppDeliveredCount} EPP · ${metrics.heightsEquipmentCount} Alturas</div>
          <div style="font-size: 9.5px; color: #475569; text-transform: uppercase;">Equipos Vinculados en Terreno</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- 3. MATRIZ DE ESPECIFICACIONES Y PLIEGOS TÉCNICOS POR FAMILIA DE COMPRA -->
  <div style="margin-bottom: 24px;">
    <h3 style="color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      3. Matriz de Requisitos Técnicos de SST por Familia de Bienes y Servicios (Estándar 2.9.1)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 18%; text-align: left;">Familia de Compra</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 18%; text-align: left;">Norma Técnica Exigida</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 28%; text-align: left;">Especificaciones Obligatorias SST</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 22%; text-align: left;">Documentos de Recepción</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 14%; text-align: center;">Verificador</th>
        </tr>
      </thead>
      <tbody>
        ${criteriosRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- 4. PADRÓN DE EVALUACIÓN Y DICTAMEN DE ADQUISICIONES EN SST -->
  <div style="margin-bottom: 24px;">
    <h3 style="color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      4. Registro Oficial de Evaluación y Dictamen Técnico de Compras SST (ISO 45001 Cl. 8.1.4.1)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px 9px; border: 1px solid #0f766e; width: 11%; text-align: left;">Código</th>
          <th style="padding: 8px 9px; border: 1px solid #0f766e; width: 21%; text-align: left;">Producto / Servicio y Origen</th>
          <th style="padding: 8px 9px; border: 1px solid #0f766e; width: 15%; text-align: left;">Proveedor</th>
          <th style="padding: 8px 9px; border: 1px solid #0f766e; width: 22%; text-align: left;">Norma y Especificaciones SST</th>
          <th style="padding: 8px 9px; border: 1px solid #0f766e; width: 18%; text-align: left;">Criterios Verificados</th>
          <th style="padding: 8px 9px; border: 1px solid #0f766e; width: 13%; text-align: center;">Dictamen SST</th>
        </tr>
      </thead>
      <tbody>
        ${comprasRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- 5. DICTAMEN TÉCNICO E INTEGRACIÓN CON GESTIÓN DEL CAMBIO -->
  <div style="margin-bottom: 24px; padding: 14px 18px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0f766e;">
    <h3 style="margin: 0 0 8px 0; color: #0f766e; font-size: 12px; font-weight: 800; text-transform: uppercase;">
      5. Dictamen Técnico Preventivo y Protocolo de Recepción en Almacén
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
          title: `Procedimiento y Matriz de Compras SST - ${company?.companyName || 'SG-SST'}`,
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
      await updateTagsForConversation(req.user.id, conversationId, ['sgsst-compras']);
    } catch (convoErr) {
      logger.debug('[SGSST Compras] Optional conversation save skipped:', convoErr.message);
    }

    await SgsstComprasData.findOneAndUpdate(
      filter,
      {
        $set: {
          compras,
          criteriosMatriz,
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
    logger.error('[SGSST Compras] POST /generate error:', error);
    return res.status(500).json({
      error: 'Error al generar el Procedimiento e Informe Oficial de Compras SST.',
    });
  }
}

router.post('/generate', requireJwtAuth, handleGenerateComprasReport);
router.post('/generate-report', requireJwtAuth, handleGenerateComprasReport);

/**
 * POST /api/sgsst/compras/send-acpm
 * Crea tareas reales en KanbanTask para adquisiciones condicionadas/rechazadas o seleccionadas por el usuario.
 */
async function handleSendComprasToAcpm(req, res) {
  try {
    const { targetUserId: userId, company, companyId: rawCompanyId } = await resolveUserAndCompany(req);
    const companyIdStr = rawCompanyId ? String(rawCompanyId) : undefined;
    const filter = { user: userId, ...(rawCompanyId ? { companyId: rawCompanyId } : {}) };

    const { itemId, item, title, description, priority = 'alta', actionType = 'preventiva' } =
      req.body || {};

    const doc = await SgsstComprasData.findOne(filter);
    const comprasList = Array.isArray(doc?.compras) ? doc.compras : [];

    let targetItems = [];
    if (item && item.productoServicio) {
      targetItems = [item];
    } else if (itemId) {
      const found = comprasList.find((c) => c.id === itemId || c.codigo === itemId);
      if (found) targetItems = [found];
    } else if (title) {
      targetItems = [
        {
          id: `adq_manual_${Date.now()}`,
          codigo: 'ADQ-ACPM',
          productoServicio: title,
          especificacionesSST: description || '',
          dictamenSST: 'Condicionado / Exige Ajuste',
          responsableEvaluacion: company?.responsibleSST || 'Responsable SG-SST',
        },
      ];
    } else {
      targetItems = comprasList.filter(
        (c) => c.dictamenSST !== 'Aprobado para Compra' || !c.sentToKanban
      );
      if (targetItems.length === 0 && comprasList.length > 0) {
        targetItems = [comprasList[0]];
      }
    }

    const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    const createdTasks = [];

    for (const c of targetItems.slice(0, 8)) {
      const refId = `compras_${c.id || c.codigo}`;
      const taskTitle =
        title ||
        `[Compras SST ${c.codigo || ''}] Verificación técnica de adquisición: ${c.productoServicio}`;
      const taskDesc =
        description ||
        `Categoría: ${c.categoria || 'SST'} | Proveedor: ${c.proveedorSugerido || 'Por definir'} | Norma exigida: ${c.normaTecnica || 'NTC/ANSI'} | Especificaciones SST: ${c.especificacionesSST || ''} | Criterios pendientes: ${c.criteriosVerificados || ''} | Dictamen: ${c.dictamenSST}`;

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
            c.dictamenSST === 'Rechazado'
              ? 'correctiva'
              : ['correctiva', 'preventiva', 'mejora'].includes(actionType)
                ? actionType
                : 'preventiva',
          sourceModule: 'Compras y Adquisiciones en SST (Est. 2.9.1 · Dec. 1072 Art. 2.2.4.6.27)',
          assignedTo: c.responsableEvaluacion || company?.responsibleSST || 'Responsable SG-SST',
          referenceId: refId,
          referenceName: `${c.codigo || 'ADQ'} - ${c.productoServicio}`,
          deliverable: {
            originModule: 'compras_sst',
            displayStatus: 'Por Hacer',
            codigo: c.codigo,
            dictamenSST: c.dictamenSST,
          },
        });
      }
      createdTasks.push(task);

      if (doc && Array.isArray(doc.compras)) {
        doc.compras.forEach((row) => {
          if (row.id === c.id || row.codigo === c.codigo) {
            row.sentToKanban = true;
          }
        });
      }
    }

    if (doc) {
      doc.markModified('compras');
      await doc.save();
    }

    return res.json({
      success: true,
      createdCount: createdTasks.length,
      tasks: createdTasks,
      compras: doc?.compras || comprasList,
      message: `${createdTasks.length} acción(es) de Compras SST enviada(s) al Centro de Control Kanban / ACPM.`,
    });
  } catch (error) {
    logger.error('[SGSST Compras] POST /send-acpm error:', error);
    return res.status(500).json({
      error: 'Error al enviar acciones de Compras SST al Centro de Control ACPM.',
    });
  }
}

router.post('/send-acpm', requireJwtAuth, handleSendComprasToAcpm);
router.post('/send-to-kanban', requireJwtAuth, handleSendComprasToAcpm);

module.exports = router;
