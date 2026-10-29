'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const PESVWorkspaceSession = require('~/models/PESVWorkspaceSession');
const CompanyInfo = require('~/models/CompanyInfo');
const KanbanTask = require('~/models/KanbanTask');
const DiagnosticoData = require('~/models/DiagnosticoData');
const SgsstVehicleData = require('~/models/SgsstVehicleData');
const SgsstWorker = require('~/models/SgsstWorker');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS, cleanRawRows } = require('./sgsstGemini');
const { ensurePerfilExists } = require('./perfilesCargo');

const TEST_FALLBACK_EMAILS = [
  'carlos@grupowappy.com',
  'test_wappy_trial_1792945447151@wappy.club',
  'pruebaspc96@gmail.com',
  'grupowappy@gmail.com',
  'felix.bedoya15@gmail.com',
];

function round2(val) {
  return Math.round(Number(val || 0) * 100) / 100;
}

function ensurePesvEcosystemModels() {
  const inlineRoutes = [
    './matrizPeligros',
    './perfilesCargo',
    './perfilSociodemografico',
    './programaCapacitaciones',
    './reporteActos',
    './atel-data',
  ];
  for (const modPath of inlineRoutes) {
    try {
      require(modPath);
    } catch (_) {
      // Ignorar si ya fue cargado
    }
  }
}

/**
 * Resuelve el usuario propietario efectivo y la empresa activa (soporta Multi-Empresa, Subusuarios y Cuentas de Prueba)
 */
async function resolveUserAndCompany(reqOrUser, explicitCompanyId = null) {
  let userOrId = reqOrUser;
  let companyIdParam = explicitCompanyId;

  if (
    reqOrUser &&
    typeof reqOrUser === 'object' &&
    (reqOrUser.user !== undefined || reqOrUser.headers !== undefined || reqOrUser.query !== undefined)
  ) {
    userOrId = reqOrUser.user;
    companyIdParam =
      explicitCompanyId ||
      reqOrUser.headers?.['x-company-id'] ||
      reqOrUser.query?.companyId ||
      reqOrUser.body?.companyId ||
      null;
  }

  let rawUserId = userOrId;
  let userEmail = '';
  let isSubUser = false;
  let parentUser = null;
  let assignedCompany = companyIdParam;

  const isUserObject =
    userOrId &&
    typeof userOrId === 'object' &&
    !(userOrId instanceof mongoose.Types.ObjectId) &&
    !Buffer.isBuffer(userOrId) &&
    typeof userOrId.toHexString !== 'function';

  if (isUserObject) {
    rawUserId = String(userOrId.id || userOrId._id || '');
    userEmail = String(userOrId.email || '').toLowerCase().trim();
    isSubUser = Boolean(userOrId.isSubUser);
    parentUser = userOrId.parentUser || userOrId.parentUserId || null;
    const firstAllowed =
      Array.isArray(userOrId.allowedCompanies) && userOrId.allowedCompanies.length > 0
        ? userOrId.allowedCompanies[0]
        : null;
    assignedCompany =
      companyIdParam ||
      userOrId.assignedCompany ||
      userOrId.assignedCompanyId ||
      firstAllowed ||
      null;
  } else if (rawUserId) {
    rawUserId = String(rawUserId);
    if (mongoose.isValidObjectId(rawUserId)) {
      try {
        const User = mongoose.models.User || mongoose.model('User');
        const uDoc = await User.findById(rawUserId)
          .select('email isSubUser parentUser parentUserId assignedCompany assignedCompanyId allowedCompanies')
          .lean();
        if (uDoc) {
          userEmail = String(uDoc.email || '').toLowerCase().trim();
          if (uDoc.isSubUser) {
            isSubUser = true;
            parentUser = uDoc.parentUser || uDoc.parentUserId || null;
            const firstAllowed =
              Array.isArray(uDoc.allowedCompanies) && uDoc.allowedCompanies.length > 0
                ? uDoc.allowedCompanies[0]
                : null;
            assignedCompany =
              companyIdParam ||
              uDoc.assignedCompany ||
              uDoc.assignedCompanyId ||
              firstAllowed ||
              null;
          }
        }
      } catch (_) {
        // Fallback silencioso
      }
    }
  }

  const targetUserId = String((isSubUser && parentUser ? parentUser : rawUserId) || '');
  let company = null;

  if (assignedCompany && mongoose.isValidObjectId(String(assignedCompany))) {
    company = await CompanyInfo.findById(String(assignedCompany)).lean();
  }
  if (!company && targetUserId && mongoose.isValidObjectId(targetUserId)) {
    company = await CompanyInfo.findOne({ user: targetUserId, isActive: true }).lean();
    if (!company) {
      company = await CompanyInfo.findOne({ user: targetUserId }).lean();
    }
  }
  if (!company && TEST_FALLBACK_EMAILS.includes(userEmail)) {
    company =
      (await CompanyInfo.findOne({ companyName: /wappy/i }).lean()) ||
      (await CompanyInfo.findOne({ isActive: true }).lean()) ||
      (await CompanyInfo.findOne({}).lean());
  }

  const resolvedUserId = String(company?.user || targetUserId || rawUserId || '');
  const resolvedCompanyId =
    company?._id ||
    (assignedCompany && mongoose.isValidObjectId(String(assignedCompany)) ? assignedCompany : null);

  return {
    userId: resolvedUserId,
    targetUserId: resolvedUserId,
    company,
    companyId: resolvedCompanyId,
  };
}

async function getActiveCompanyId(userOrReq) {
  const { companyId } = await resolveUserAndCompany(userOrReq);
  return companyId;
}

const mapNP = (lbl) => {
  const norm = String(lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm.includes('MUY PROBABLE')) return 5;
  if (norm.includes('MEDIANAMENTE') || norm.includes('MEDIA')) return 4;
  if (norm.includes('POCO PROBABLE')) return 2;
  if (norm.includes('NO ES PROBABLE') || norm.includes('NO PROBABLE')) return 1;
  if (norm.includes('PROBABLE')) return 3;
  return 3;
};

const mapNE = (lbl) => {
  const norm = String(lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm.includes('CONSTANTE') || norm.includes('CONTINUA') || norm.includes('CONTINUO')) return 5;
  if (norm.includes('FRECUENTE')) return 4;
  if (norm.includes('OCASIONAL')) return 3;
  if (norm.includes('ESPORADICO')) return 2;
  if (norm.includes('MINIMA') || norm.includes('MINIMO')) return 1;
  return 3;
};

const mapNC = (lbl) => {
  const norm = String(lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm.includes('CRITICO') || norm.includes('GRAVE') || norm.includes('FATAL') || norm.includes('MORTAL')) return 5;
  if (norm.includes('PELIGROSO') || norm.includes('SEVERO')) return 4;
  if (norm.includes('MODERADO')) return 3;
  if (norm.includes('MARGINAL') || norm.includes('LEVE')) return 2;
  if (norm.includes('INSIGNIFICANTE')) return 1;
  return 3;
};

function normalizeTratamientoAccion(val) {
  if (!val) return 'MODIFICAR LOS FACTORES DE EXPOSICION';
  const upper = String(val).trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (upper.includes('ACEPTAR')) return 'ACEPTARLO';
  if (upper.includes('EVITAR')) return 'EVITARLO';
  if (upper.includes('IMPLEMENTAR CONTROLES EN LA FUENTE')) {
    return 'IMPLEMENTAR CONTROLES EN LA FUENTE Y EL MEDIO';
  }
  if (upper.includes('ELIMINAR LA FUENTE QUE OCASIONA') || upper.includes('ELIMINAR LA FUENTE QUE OCACIONA')) {
    return 'ELIMINAR LA FUENTE QUE OCASIONA';
  }
  if (upper.includes('MODIFICAR')) return 'MODIFICAR LOS FACTORES DE EXPOSICION';
  return String(val).trim();
}

async function markPesvStandardCompliant(userId, companyId, rowCount = 1) {
  try {
    if (!companyId || rowCount <= 0) return;
    let doc = await DiagnosticoData.findOne({ user: userId, companyId });
    if (!doc) {
      doc = new DiagnosticoData({
        user: userId,
        companyId,
        statusData: [],
        companySize: 'medium',
        riskLevel: 3,
        score: 0,
        totalPoints: 100,
        complianceLevel: '',
      });
    }
    const statusList = Array.isArray(doc.statusData) ? [...doc.statusData] : [];
    const codeClean = '32 PESV';
    const existingIdx = statusList.findIndex(
      (item) => item.code === codeClean || item.code === '32' || item.itemId === 'std_32_PESV'
    );
    const updatedItem = {
      itemId: existingIdx >= 0 ? statusList[existingIdx].itemId : 'std_32_PESV',
      code: codeClean,
      status: 'cumple',
      observation: `Matriz Oficial de Riesgos Viales PESV activa (${rowCount} peligros viales evaluados bajo Res. 20223040040595 Paso 6 y Paso 8, ISO 39001 y Art. 32 Res. 0312/2019).`,
      updatedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      statusList[existingIdx] = { ...statusList[existingIdx], ...updatedItem };
    } else {
      statusList.push(updatedItem);
    }
    doc.statusData = statusList;
    doc.updatedAt = new Date();
    await doc.save();
  } catch (err) {
    logger.warn('[PESVWorkspace] Could not auto-mark 32 PESV in DiagnosticoData:', err.message);
  }
}

function toSentenceCase(str) {
  if (!str) return '';
  const trimmed = String(str).trim();
  if (trimmed.length === 0) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Recolecta métricas reales 360° del Ecosistema Somos SST relacionadas con Seguridad Vial (PESV)
 */
async function gatherPesvEcosystem(userOrId, explicitCompanyId = null) {
  ensurePesvEcosystemModels();
  const { userId, company, companyId } = await resolveUserAndCompany(userOrId, explicitCompanyId);
  const filter = companyId ? { user: userId, companyId } : { user: userId };
  const companyOnlyOrFilter = companyId ? { companyId } : { user: userId };

  // 1. CompanyInfo
  const companyName = company?.companyName || 'Empresa SG-SST';
  const economicActivity = company?.economicActivity || 'Operaciones Generales y Desplazamientos Misionales';
  const riskLevel = company?.riskLevel || 'III';

  // 2. SgsstVehicleData (Hito 5 - Hoja de Vida Automotores e Inspecciones Preoperacionales)
  let totalVehiculos = 0;
  let motosCount = 0;
  let livianosCount = 0;
  let pesadosCount = 0;
  let vehiculosSoatVencidoCount = 0;
  let vehiculosTecnoVencidaCount = 0;
  let vehiculosAlertaDocsCount = 0;
  let totalInspeccionesPreoperacionales = 0;
  let inspeccionesRechazadasCount = 0;
  let vehiculosList = [];

  try {
    let vehicles = await SgsstVehicleData.find(filter).lean();
    if (vehicles.length === 0 && companyId) {
      vehicles = await SgsstVehicleData.find({ companyId }).lean();
    }
    totalVehiculos = vehicles.length;
    const now = new Date();
    const soonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    vehicles.forEach((v) => {
      const tipoStr = String(v.tipo || '').toLowerCase();
      if (/moto/i.test(tipoStr)) motosCount++;
      else if (/cami[oó]n|tracto|bus|pesad|volqueta|furg[oó]n/i.test(tipoStr)) pesadosCount++;
      else livianosCount++;

      let docAlert = false;
      if (v.soatVencimiento) {
        const dSoat = new Date(v.soatVencimiento);
        if (!isNaN(dSoat.getTime()) && dSoat <= soonThreshold) {
          vehiculosSoatVencidoCount++;
          docAlert = true;
        }
      }
      if (v.tecnomecanicaVencimiento) {
        const dTecno = new Date(v.tecnomecanicaVencimiento);
        if (!isNaN(dTecno.getTime()) && dTecno <= soonThreshold) {
          vehiculosTecnoVencidaCount++;
          docAlert = true;
        }
      }
      if (docAlert) vehiculosAlertaDocsCount++;

      const insp = Array.isArray(v.inspecciones) ? v.inspecciones : [];
      totalInspeccionesPreoperacionales += insp.length;
      const rechazadas = insp.filter((i) => i.resultado === 'Rechazado').length;
      inspeccionesRechazadasCount += rechazadas;

      vehiculosList.push({
        placa: v.placa || 'SIN-PLACA',
        tipo: v.tipo || 'Automóvil',
        marca: v.marca || '',
        conductorNombre: v.conductorNombre || 'Conductor Asignado',
        soatVencimiento: v.soatVencimiento || '',
        tecnomecanicaVencimiento: v.tecnomecanicaVencimiento || '',
        inspeccionesCount: insp.length,
        inspeccionesRechazadas: rechazadas,
      });
    });
  } catch (err) {
    logger.debug('[PESVWorkspace/gatherPesvEcosystem] SgsstVehicleData error:', err.message);
  }

  // 3. SgsstWorker y PerfilCargoData (Hito 2 - Trabajadores y Cargos con rol vial)
  let totalTrabajadores = 0;
  let totalCargos = 0;
  let cargosViales = [];
  const cargosSet = new Set();

  try {
    let workers = await SgsstWorker.find({ ...filter, estadoLaboral: { $ne: 'Retirado' } })
      .select('nombre cargo')
      .lean();
    if (workers.length === 0 && companyId) {
      workers = await SgsstWorker.find({ companyId, estadoLaboral: { $ne: 'Retirado' } })
        .select('nombre cargo')
        .lean();
    }
    totalTrabajadores = workers.length || Number(company?.workerCount) || 0;
    workers.forEach((w) => {
      if (w.cargo && /conduct|mensajer|motoriz|comercial|vendedor|log[ií]stic|repart|operativ|domicili|escolta|visitador|auxiliar|coordinador/i.test(w.cargo)) {
        cargosSet.add(toSentenceCase(w.cargo));
      }
    });

    const PerfilCargoData = mongoose.models.PerfilCargoData;
    if (PerfilCargoData) {
      const cargoDoc =
        (await PerfilCargoData.findOne(filter).lean()) ||
        (companyId ? await PerfilCargoData.findOne({ companyId }).lean() : null);
      if (Array.isArray(cargoDoc?.perfilesList)) {
        totalCargos = cargoDoc.perfilesList.length;
        cargoDoc.perfilesList.forEach((p) => {
          const nombre = p.nombreCargo || p.cargo || '';
          const desc = `${nombre} ${p.area || ''} ${p.contextoAdicional || ''}`;
          if (nombre && /conduct|mensajer|motoriz|comercial|vendedor|log[ií]stic|repart|vial|transporte|operativ|auxiliar|coordinador/i.test(desc)) {
            cargosSet.add(toSentenceCase(nombre));
          }
        });
        if (cargosSet.size === 0) {
          cargoDoc.perfilesList.slice(0, 5).forEach((p) => {
            if (p.nombreCargo) cargosSet.add(toSentenceCase(p.nombreCargo));
          });
        }
      }
    }
    cargosViales = Array.from(cargosSet);
  } catch (err) {
    logger.debug('[PESVWorkspace/gatherPesvEcosystem] Workers/Cargos error:', err.message);
  }

  // 4. Comité de Seguridad Vial / COPASST (Hito 3)
  let comiteVialActivo = false;
  let comiteMiembrosCount = 0;
  try {
    const ComitePesv = mongoose.models.ComitePesv || mongoose.models.SgsstComitePesv;
    if (ComitePesv) {
      const csvDoc = await ComitePesv.findOne(filter).lean();
      if (csvDoc && Array.isArray(csvDoc.members) && csvDoc.members.length > 0) {
        comiteVialActivo = true;
        comiteMiembrosCount = csvDoc.members.length;
      }
    }
    if (!comiteVialActivo) {
      const SgsstCopasst = mongoose.models.SgsstCopasst || require('~/models/SgsstCopasst');
      const copDoc = await SgsstCopasst.findOne(filter).lean();
      if (copDoc && (Array.isArray(copDoc.members) && copDoc.members.length > 0 || copDoc.president)) {
        comiteVialActivo = true;
        comiteMiembrosCount = copDoc.members?.length || 2;
      }
    }
  } catch (err) {
    logger.debug('[PESVWorkspace/gatherPesvEcosystem] Comite lookup error:', err.message);
  }

  // 5. GTC45WorkspaceSession / MatrizPeligrosData (Hito 1 - Peligros viales/tránsito/públicos)
  let peligrosVialesGtc45Count = 0;
  let peligrosVialesGtc45List = [];
  try {
    const GTC45WorkspaceSession =
      mongoose.models.GTC45WorkspaceSession || require('~/models/GTC45WorkspaceSession');
    let gtcSession = await GTC45WorkspaceSession.findOne({ ...filter, isOfficial: true }).lean();
    if (!gtcSession) {
      gtcSession = await GTC45WorkspaceSession.findOne(companyOnlyOrFilter).sort({ updatedAt: -1 }).lean();
    }
    const gtcRows = gtcSession?.matrixRows || gtcSession?.rows || [];
    gtcRows.forEach((r) => {
      const combined = `${r.peligro_clasificacion || ''} ${r.peligro_descripcion || ''} ${r.actividad || ''} ${r.efecto_posible || ''}`;
      if (/tr[aá]nsito|vial|veh[ií]cul|conducci[oó]n|atropell|choque|colisi[oó]n|moto|transporte|desplazamiento|p[uú]blico/i.test(combined)) {
        peligrosVialesGtc45Count++;
        peligrosVialesGtc45List.push({
          proceso: r.proceso || 'Operativo',
          cargo: r.cargo || 'Conductor / Actor Vial',
          clasificacion: r.peligro_clasificacion || 'Condiciones de Seguridad - Accidentes de Tránsito',
          descripcion: r.peligro_descripcion || 'Riesgo de accidente de tránsito en desplazamiento laboral',
          controles: r.medida_administrativa || r.control_individuo || r.control_medio || '',
        });
      }
    });
  } catch (err) {
    logger.debug('[PESVWorkspace/gatherPesvEcosystem] GTC45 lookup error:', err.message);
  }

  // 6. InvestigacionAtelData y ReporteActos (Hito 6 y 7 - Siniestros e Incidentes Viales)
  let atelVialesCount = 0;
  let reportesVialesCount = 0;
  let eventosVialesList = [];
  try {
    const InvestigacionAtelData =
      mongoose.models.InvestigacionAtelData || require('~/models/InvestigacionAtelData');
    const atelDocs = await InvestigacionAtelData.find(filter).limit(20).lean();
    atelDocs.forEach((doc) => {
      const desc = `${doc.formData?.tipoEvento || ''} ${doc.formData?.descripcionEvento || ''} ${doc.formData?.lugarEvento || ''}`;
      if (/vial|tr[aá]nsito|veh[ií]cul|moto|choque|colisi[oó]n|atropell|ruta|v[ií]a/i.test(desc)) {
        atelVialesCount++;
        eventosVialesList.push(doc.formData?.descripcionEvento || 'Siniestro / Incidente vial investigado');
      }
    });

    const ReporteActosData = mongoose.models.ReporteActosData;
    if (ReporteActosData) {
      const repDoc = await ReporteActosData.findOne(filter).lean();
      if (repDoc) {
        const inbox = Array.isArray(repDoc.inboxPublico) ? repDoc.inboxPublico : [];
        inbox.forEach((item) => {
          const txt = `${item.data?.tipoReporte || ''} ${item.data?.descripcion || item.data?.descripcionHallazgo || ''}`;
          if (/vial|veh[ií]cul|moto|llanta|freno|parqueadero|velocidad|casco|cintur[oó]n|v[ií]a/i.test(txt)) {
            reportesVialesCount++;
            eventosVialesList.push(item.data?.descripcion || item.data?.descripcionHallazgo || 'Condición insegura vial reportada');
          }
        });
      }
    }
  } catch (err) {
    logger.debug('[PESVWorkspace/gatherPesvEcosystem] ATEL/Reportes error:', err.message);
  }

  // 7. ProgramaCapacitaciones (Hito 6 - Capacitaciones en Seguridad Vial)
  let capacitacionesVialesCount = 0;
  let capacitacionesTotal = 0;
  let capacitacionesVialesList = [];
  try {
    const ProgramaCapacitacionesData = mongoose.models.ProgramaCapacitacionesData;
    if (ProgramaCapacitacionesData) {
      const capDoc = await ProgramaCapacitacionesData.findOne(filter).lean();
      if (capDoc) {
        const items = [
          ...(Array.isArray(capDoc.sesiones) ? capDoc.sesiones : []),
          ...(Array.isArray(capDoc.planPersonalizado) ? capDoc.planPersonalizado : []),
        ];
        capacitacionesTotal = items.length;
        items.forEach((c) => {
          const tema = c.tema || c.nombre || c.titulo || '';
          if (/vial|pesv|conducci[oó]n|manejo defensivo|tr[aá]nsito|preoperacional|actor vial|fatiga|velocidad/i.test(tema)) {
            capacitacionesVialesCount++;
            capacitacionesVialesList.push(tema);
          }
        });
      }
    }
  } catch (err) {
    logger.debug('[PESVWorkspace/gatherPesvEcosystem] Capacitaciones error:', err.message);
  }

  // 8. KanbanTask (Hito 7 - Tareas ACPM de Matriz PESV)
  let kanbanAbiertasCount = 0;
  let kanbanCerradasCount = 0;
  let kanbanTotalCount = 0;
  try {
    const pesvTasks = await KanbanTask.find({
      ...filter,
      sourceModule: 'matriz_pesv',
    })
      .select('status')
      .lean();
    kanbanTotalCount = pesvTasks.length;
    pesvTasks.forEach((t) => {
      if (t.status === 'done' || t.status === 'completada' || t.status === 'cerrada') {
        kanbanCerradasCount++;
      } else if (t.status !== 'dismissed') {
        kanbanAbiertasCount++;
      }
    });
  } catch (err) {
    logger.debug('[PESVWorkspace/gatherPesvEcosystem] KanbanTask error:', err.message);
  }

  // 9. DiagnosticoData (Hito 1) y AuditoriaData (Hito 7) — redondeados a máximo 2 decimales
  let diagnosticoScore = 0;
  let auditoriaScore = 0;
  let estandar32Cumple = false;
  try {
    const diagDoc = await DiagnosticoData.findOne(filter).lean();
    if (diagDoc) {
      diagnosticoScore = round2(diagDoc.score || 0);
      if (Array.isArray(diagDoc.statusData)) {
        estandar32Cumple = diagDoc.statusData.some(
          (s) => (s.code === '32 PESV' || s.code === '32' || s.itemId === 'std_32_PESV') && s.status === 'cumple'
        );
      }
    }
    const AuditoriaData = mongoose.models.AuditoriaData || require('~/models/AuditoriaData');
    const audDoc = await AuditoriaData.findOne(filter).lean();
    if (audDoc) {
      auditoriaScore = round2(
        audDoc.compliancePercentage || audDoc.weightedPercentage || audDoc.score || 0
      );
    }
  } catch (err) {
    logger.debug('[PESVWorkspace/gatherPesvEcosystem] Diagnostico/Auditoria error:', err.message);
  }

  return {
    userId,
    companyId,
    companyName,
    economicActivity,
    riskLevel,
    totalVehiculos,
    vehiclesCount: totalVehiculos,
    motosCount,
    livianosCount,
    pesadosCount,
    vehiculosSoatVencidoCount,
    vehiculosTecnoVencidaCount,
    vehiculosAlertaDocsCount,
    totalInspeccionesPreoperacionales,
    preoperationalCount: totalInspeccionesPreoperacionales,
    preoperacionalesCount: totalInspeccionesPreoperacionales,
    inspeccionesRechazadasCount,
    vehiculosList,
    totalTrabajadores,
    workersCount: totalTrabajadores,
    driversCount: totalTrabajadores || cargosViales.length,
    totalCargos,
    cargosVialesCount: cargosViales.length,
    cargosViales,
    comiteVialActivo,
    comiteMiembrosCount,
    csvMembersCount: comiteMiembrosCount,
    peligrosVialesGtc45Count,
    gtc45TransitCount: peligrosVialesGtc45Count,
    peligrosVialesGtc45List,
    atelVialesCount,
    atelVialCount: atelVialesCount,
    reportesVialesCount,
    eventosVialesList,
    capacitacionesVialesCount,
    trainingsCount: capacitacionesVialesCount,
    capacitacionesTotal,
    capacitacionesVialesList,
    kanbanAbiertasCount,
    kanbanCerradasCount,
    kanbanTotalCount,
    acpmCount: kanbanTotalCount,
    diagnosticoScore: round2(diagnosticoScore),
    compliance0312: round2(diagnosticoScore),
    auditoriaScore: round2(auditoriaScore),
    estandar32Cumple,
  };
}

/**
 * Genera 6 filas técnicas completas de Matriz PESV (Paso 6 y Paso 8 Res. 20223040040595)
 * contextualizadas a los cargos reales, vehículos reales y peligros GTC 45 de la empresa.
 */
function buildDefaultPesvRowsFromEcosystem(eco = {}) {
  const cargos = Array.isArray(eco.cargosViales) && eco.cargosViales.length > 0 ? eco.cargosViales : [];
  const cargoMoto = cargos.find((c) => /moto|mensajer|domicili|repart/i.test(c)) || cargos[0] || 'Mensajero motorizado / Comercial';
  const cargoConductor = cargos.find((c) => /conduct|operador|transport|log[ií]stic/i.test(c)) || cargos[1] || cargos[0] || 'Conductor de vehículo operativo';
  const cargoComercial = cargos.find((c) => /comercial|asesor|vendedor|coordinador|supervisor/i.test(c)) || cargos[0] || 'Asesor comercial / Conductor misional';
  const cargoGeneral = cargos.find((c) => /auxiliar|administrativ|operativ|analista/i.test(c)) || 'Personal administrativo y operativo';

  const placasInfo =
    Array.isArray(eco.vehiculosList) && eco.vehiculosList.length > 0
      ? `Flota vinculada Hito 5 (${eco.vehiculosList.slice(0, 3).map((v) => `${v.tipo} ${v.placa}`).join(', ')}).`
      : 'Flota propia, contratista o fidelizada en desplazamientos misionales.';

  const baseId = Date.now();

  return [
    {
      id: `pesv-p8-1-${baseId}`,
      grupo_trabajo: 'Logística y distribución urbana',
      cargo: toSentenceCase(cargoMoto),
      tipo_desplazamiento: 'Misional',
      rol_via: 'Conductor de motocicleta',
      factor_riesgo: 'Factor Humano',
      peligro_descripcion:
        'Exceso de velocidad y adelantamientos riesgosos en desplazamientos misionales urbanos bajo presión de tiempos de entrega (Paso 8.1 - Programa de Gestión de la Velocidad Segura).',
      np_cualitativo: 'PROBABLE',
      np_cuantitativo: 3,
      ne_cualitativo: 'CONSTANTE',
      ne_cuantitativo: 5,
      nc_cualitativo: 'CRITICO',
      nc_cuantitativo: 5,
      calificacion: 13,
      nivel_riesgo: 'NIVEL DE RIESGO ALTO o CRITICO',
      aceptabilidad: 'NO ACEPTABLE',
      controles_existentes_descripcion:
        'Verificación de licencia de conducción vigente, uso de casco certificado NTC 4533 / DOT y chaqueta reflectiva.',
      controles_existentes_tipo: 'MEDIO-INDIVIDUO',
      tratamiento_accion: 'MODIFICAR LOS FACTORES DE EXPOSICION',
      plan_accion_medio:
        'Establecer rutogramas urbanos con límites de velocidad máxima (50 km/h urbano) y holgura en tiempos de entrega comerciales.',
      plan_accion_vehiculo:
        'Monitoreo GPS / telemetría de velocidad y verificación de sistema de frenos CBS/ABS e iluminación en hoja de vida Hito 5.',
      plan_accion_individuo:
        'Capacitación teórico-práctica en Programa de Gestión de la Velocidad Segura (Paso 8.1 Res. 20223040040595) y manejo defensivo en motocicleta.',
      plan_accion_infraestructura:
        'Identificación y mapeo de corredores viales críticos y puntos de alta siniestralidad en el rutograma corporativo.',
      responsable: 'Líder PESV / Coordinador de Logística',
      fecha_programacion: 'Mensual',
      estado: 'PLANEADA',
      observaciones: `${placasInfo} Control prioritario Paso 6 y Paso 8.1 Res. 20223040040595 / ISO 39001.`,
    },
    {
      id: `pesv-p8-2-${baseId + 1}`,
      grupo_trabajo: 'Transporte y operaciones de ruta',
      cargo: toSentenceCase(cargoConductor),
      tipo_desplazamiento: 'Misional',
      rol_via: 'Conductor de vehículo pesado',
      factor_riesgo: 'Factor Humano',
      peligro_descripcion:
        'Fatiga laboral, somnolencia y microsueños por conducción continua en jornadas extensas o rutas intermunicipales (Paso 8.2 - Programa de Prevención de la Fatiga).',
      np_cualitativo: 'PROBABLE',
      np_cuantitativo: 3,
      ne_cualitativo: 'FRECUENTE',
      ne_cuantitativo: 4,
      nc_cualitativo: 'CRITICO',
      nc_cuantitativo: 5,
      calificacion: 12,
      nivel_riesgo: 'NIVEL DE RIESGO ALTO o CRITICO',
      aceptabilidad: 'NO ACEPTABLE',
      controles_existentes_descripcion:
        'Control de horarios de despacho y programación de turnos operativos.',
      controles_existentes_tipo: 'INDIVIDUO',
      tratamiento_accion: 'MODIFICAR LOS FACTORES DE EXPOSICION',
      plan_accion_medio:
        'Control estricto de jornada máxima de conducción, programación obligatoria de pausas activas viales cada 2 horas de recorrido y puntos seguros de descanso.',
      plan_accion_vehiculo:
        'Verificación de ergonomía de silla del conductor, ventilación/climatización de cabina y alertas de tiempo de conducción.',
      plan_accion_individuo:
        'Aplicación de test de alerta y sueño pre-turno, vigilancia epidemiológica de higiene del sueño y capacitación en Programa de Prevención de la Fatiga (Paso 8.2).',
      plan_accion_infraestructura:
        'Definición de zonas autorizadas de parada segura y áreas de descanso en los rutogramas intermunicipales.',
      responsable: 'Líder PESV / Jefe de Operaciones',
      fecha_programacion: 'Permanente',
      estado: 'PLANEADA',
      observaciones: 'Alineado con Paso 8.2 Res. 20223040040595 y perfiles bio-individuales Hito 2.',
    },
    {
      id: `pesv-p8-3-${baseId + 2}`,
      grupo_trabajo: 'Gestión comercial y técnica en campo',
      cargo: toSentenceCase(cargoComercial),
      tipo_desplazamiento: 'Misional',
      rol_via: 'Conductor de vehículo liviano',
      factor_riesgo: 'Factor Humano',
      peligro_descripcion:
        'Distracción visual, manual y cognitiva por manipulación de teléfono celular, mensajería instantánea o aplicativos GPS durante la conducción (Paso 8.3 - Programa de Prevención de la Distracción).',
      np_cualitativo: 'MEDIANAMENTE PROBABLE',
      np_cuantitativo: 4,
      ne_cualitativo: 'CONSTANTE',
      ne_cuantitativo: 5,
      nc_cualitativo: 'PELIGROSO',
      nc_cuantitativo: 4,
      calificacion: 13,
      nivel_riesgo: 'NIVEL DE RIESGO ALTO o CRITICO',
      aceptabilidad: 'NO ACEPTABLE',
      controles_existentes_descripcion:
        'Política general de seguridad vial socializada en inducción.',
      controles_existentes_tipo: 'INDIVIDUO',
      tratamiento_accion: 'ELIMINAR LA FUENTE QUE OCASIONA',
      plan_accion_medio:
        'Protocolo operativo de comunicación: prohibición de llamadas o mensajes en marcha; configurar ruta GPS antes de iniciar el desplazamiento.',
      plan_accion_vehiculo:
        'Instalación de soportes fijos homologados para navegación visual sin uso de manos y bloqueo de pantallas multimedia en movimiento.',
      plan_accion_individuo:
        'Sensibilización y auditoría de comportamiento en el Programa de Prevención de la Distracción (Paso 8.3 Res. 20223040040595) con activación del modo "En Conducción".',
      plan_accion_infraestructura:
        'Uso exclusivo de bahías de estacionamiento seguras para atender comunicaciones urgentes de clientes o despacho.',
      responsable: 'Líder PESV / Coordinador Comercial',
      fecha_programacion: 'Mensual',
      estado: 'PLANEADA',
      observaciones: 'Programa de Prevención de la Distracción (Paso 8.3 Res. 20223040040595).',
    },
    {
      id: `pesv-p16-17-${baseId + 3}`,
      grupo_trabajo: 'Operación de flota y mantenimiento',
      cargo: toSentenceCase(cargoConductor),
      tipo_desplazamiento: 'Misional',
      rol_via: 'Conductor de vehículo liviano',
      factor_riesgo: 'Factor Vehicular',
      peligro_descripcion:
        'Falla mecánica súbita en sistema de frenos, dirección, suspensión, labrado de llantas o luces por omisión de inspección preoperacional diaria o mantenimiento preventivo (Paso 16 y Paso 17 Res. 20223040040595).',
      np_cualitativo: 'PROBABLE',
      np_cuantitativo: 3,
      ne_cualitativo: 'FRECUENTE',
      ne_cuantitativo: 4,
      nc_cualitativo: 'CRITICO',
      nc_cuantitativo: 5,
      calificacion: 12,
      nivel_riesgo: 'NIVEL DE RIESGO ALTO o CRITICO',
      aceptabilidad: 'NO ACEPTABLE',
      controles_existentes_descripcion:
        `Registro de vehículos y control de SOAT / Revisión Técnico-Mecánica en Hito 5 (${eco.totalInspeccionesPreoperacionales || 0} inspecciones preoperacionales registradas).`,
      controles_existentes_tipo: 'VEHICULO',
      tratamiento_accion: 'IMPLEMENTAR CONTROLES EN LA FUENTE Y EL MEDIO',
      plan_accion_medio:
        'Bloqueo operativo automático de salida a ruta para vehículos con hallazgos críticos rechazados en la lista de chequeo preoperacional o con SOAT/RTM vencidos.',
      plan_accion_vehiculo:
        'Ejecución rigurosa del Plan de Mantenimiento Preventivo y Correctivo (Paso 17) en talleres certificados y trazabilidad en Hoja de Vida Hito 5.',
      plan_accion_individuo:
        'Entrenamiento técnico a conductores en inspección preoperacional diaria (Paso 16) e identificación temprana de fallas críticas.',
      plan_accion_infraestructura:
        'Adecuación de zona iluminada y demarcada en sede para realizar la inspección preoperacional antes del despacho.',
      responsable: 'Gestor de Flota / Coordinador PESV',
      fecha_programacion: 'Diario / Permanente',
      estado: 'PLANEADA',
      observaciones: `${placasInfo} Articulado con Paso 16 (Inspecciones Diarias) y Paso 17 (Mantenimiento) Res. 20223040040595.`,
    },
    {
      id: `pesv-p8-4-${baseId + 4}`,
      grupo_trabajo: 'Toda la organización (Conductores misionales)',
      cargo: toSentenceCase(cargoConductor),
      tipo_desplazamiento: 'Misional',
      rol_via: 'Conductor de vehículo liviano',
      factor_riesgo: 'Factor Humano',
      peligro_descripcion:
        'Conducción bajo el influjo de bebidas alcohólicas, sustancias psicoactivas (SPA) o medicamentos que produzcan somnolencia y disminución de reflejos (Paso 8.4 - Programa de Cero Tolerancia a Alcohol y SPA).',
      np_cualitativo: 'POCO PROBABLE',
      np_cuantitativo: 2,
      ne_cualitativo: 'OCASIONAL',
      ne_cuantitativo: 3,
      nc_cualitativo: 'CRITICO',
      nc_cuantitativo: 5,
      calificacion: 10,
      nivel_riesgo: 'NIVEL DE RIESGO MEDIO o MODERADO',
      aceptabilidad: 'ACEPTABLE CON CONTROL ESPECIFICO',
      controles_existentes_descripcion:
        'Política de prevención de consumo de alcohol, tabaco y SPA integrada al Reglamento Interno de Trabajo y SG-SST.',
      controles_existentes_tipo: 'INDIVIDUO',
      tratamiento_accion: 'EVITARLO',
      plan_accion_medio:
        'Ejecución de pruebas aleatorias y pre-despacho de alcoholimetría con equipos calibrados y protocolo disciplinario de cero tolerancia.',
      plan_accion_vehiculo:
        'Inmovilización preventiva inmediata del vehículo o relevo de conductor ante cualquier resultado positivo o síntoma de alteración psicofísica.',
      plan_accion_individuo:
        'Campañas de prevención de consumo de alcohol y SPA, y reporte obligatorio al médico laboral de medicamentos con efecto sedante (Paso 8.4).',
      plan_accion_infraestructura:
        'Punto de control y tamizaje preventivo en portería / despacho vehicular.',
      responsable: 'Coordinador SG-SST / Líder PESV',
      fecha_programacion: 'Trimestral / Aleatorio',
      estado: 'PLANEADA',
      observaciones: 'Cumplimiento Paso 8.4 Res. 20223040040595 y Ley 1503 de 2011.',
    },
    {
      id: `pesv-p8-5-${baseId + 5}`,
      grupo_trabajo: 'Personal administrativo, planta y desplazamientos in itinere',
      cargo: toSentenceCase(cargoGeneral),
      tipo_desplazamiento: 'In itinere',
      rol_via: 'Peatón',
      factor_riesgo: 'Factor Infraestructura',
      peligro_descripcion:
        'Atropellamiento, colisión o caída de peatones, ciclistas y pasajeros en desplazamientos casa-trabajo (in itinere) y en zonas de parqueo y maniobra interna (Paso 8.5 - Programa de Protección de Actores Viales Vulnerables).',
      np_cualitativo: 'PROBABLE',
      np_cuantitativo: 3,
      ne_cualitativo: 'CONSTANTE',
      ne_cuantitativo: 5,
      nc_cualitativo: 'PELIGROSO',
      nc_cuantitativo: 4,
      calificacion: 12,
      nivel_riesgo: 'NIVEL DE RIESGO ALTO o CRITICO',
      aceptabilidad: 'NO ACEPTABLE',
      controles_existentes_descripcion:
        'Demarcación básica de áreas de parqueo e inducción general en seguridad vial.',
      controles_existentes_tipo: 'INFRAESTRUCTURA',
      tratamiento_accion: 'IMPLEMENTAR CONTROLES EN LA FUENTE Y EL MEDIO',
      plan_accion_medio:
        'Segregación física de flujos peatonales y vehiculares, parqueo en reversa obligatorio y velocidad máxima de 10 km/h en instalaciones.',
      plan_accion_vehiculo:
        'Sensores y alarma sonora de reversa operativa en todos los vehículos que ingresan a planta o parqueaderos.',
      plan_accion_individuo:
        'Campaña de movilidad segura para peatones, ciclistas (uso de casco y prendas reflectivas) y pasajeros en transporte público (Paso 8.5).',
      plan_accion_infraestructura:
        'Demarcación de cebras peatonales, topes llantas, espejos convexos en puntos ciegos e iluminación de senderos seguros.',
      responsable: 'Coordinador SG-SST / Comité de Seguridad Vial',
      fecha_programacion: 'Semestral',
      estado: 'PLANEADA',
      observaciones: 'Programa de Protección de Actores Viales Vulnerables (Paso 8.5 Res. 20223040040595).',
    },
  ];
}

/**
 * Sincroniza las filas de la Matriz PESV con el Centro de Control (KanbanTask)
 */
async function syncPesvKanbanTasks(userId, companyId, matrixRows = []) {
  if (!KanbanTask || !Array.isArray(matrixRows) || matrixRows.length === 0) return 0;

  const cleanControlText = (val) => {
    if (!val || typeof val !== 'string') return '';
    const trimmed = val.trim();
    const lower = trimmed.toLowerCase();
    if (['ninguno', 'ninguna', 'no aplica', 'n/a', 'na', 'ninguno.', 'no'].includes(lower)) return '';
    return trimmed;
  };

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const today = new Date();
  let syncedCount = 0;
  const activePesvRefs = new Set();

  for (let i = 0; i < matrixRows.length; i++) {
    const row = matrixRows[i];
    const rowId = row.id || `pesv-row-${i}`;

    const controls = [];
    const veh = cleanControlText(row.plan_accion_vehiculo);
    if (veh) controls.push({ category: 'Vehículo Seguro', text: veh, actionType: 'correctiva' });

    const infra = cleanControlText(row.plan_accion_infraestructura);
    if (infra) controls.push({ category: 'Vía / Infraestructura', text: infra, actionType: 'preventiva' });

    const medio = cleanControlText(row.plan_accion_medio);
    if (medio) controls.push({ category: 'Entorno / Medio', text: medio, actionType: 'preventiva' });

    const ind = cleanControlText(row.plan_accion_individuo);
    if (ind) controls.push({ category: 'Actor Vial / Comportamiento', text: ind, actionType: 'preventiva' });

    const calif = Number(row.calificacion) || 9;
    const isCritical = calif >= 12 || String(row.aceptabilidad || '').toUpperCase().includes('NO ACEPTABLE');
    const isHigh = calif >= 8;

    if (controls.length > 0 || isCritical || isHigh) {
      const bestControl = controls[0] || {
        category: 'Intervención Vial PESV',
        text: 'Implementar plan de control vial inmediato según Paso 6 y Paso 8 de la Res. 20223040040595',
        actionType: 'correctiva',
      };

      const otherControls = controls.filter((c) => c !== bestControl);
      const dueDate = isCritical ? addDays(today, 15) : isHigh ? addDays(today, 30) : addDays(today, 60);
      const priority = isCritical ? 'alta' : 'media';
      const actionType = bestControl.actionType || 'preventiva';

      const cleanText = bestControl.text.replace(/^[*•-]\s*/, '').trim();
      const title = `[PESV · ${bestControl.category}] ${cleanText.length > 70 ? cleanText.substring(0, 67) + '…' : cleanText}`;

      const description = `Plan de Acción Vial sincronizado desde la Matriz PESV (Res. 20223040040595 - Paso 6 y Paso 8).
• Grupo de Trabajo: ${row.grupo_trabajo || 'Operativo'} | Cargo: ${row.cargo || 'Actor Vial'}
• Actor Vial: ${row.rol_via || 'Conductor'} (${row.tipo_desplazamiento || 'Misional'})
• Factor de Riesgo: ${row.factor_riesgo || 'Factor Humano'} — ${row.peligro_descripcion || ''}
• Evaluación Vial: Calificación ${calif}/15 (${row.nivel_riesgo || ''}) — ${row.aceptabilidad || ''}
• Control Principal [${bestControl.category}]: ${bestControl.text}
${otherControls.length > 0 ? `• Controles Complementarios: ${otherControls.map((c) => `[${c.category}] ${c.text}`).join(' | ')}\n` : ''}• Responsable PESV: ${row.responsable || 'Coordinador PESV'} (${row.fecha_programacion || 'Permanente'})`;

      const referenceId = `pesv-control-${rowId}`;
      const referenceName = `Matriz PESV (${row.rol_via || 'Seguridad Vial'})`;

      activePesvRefs.add(referenceId);

      const taskQuery = companyId
        ? { user: userId, companyId, referenceId }
        : { user: userId, referenceId };
      let task = await KanbanTask.findOne(taskQuery);

      if (!task) {
        await KanbanTask.create({
          user: userId,
          companyId,
          title,
          description,
          dueDate,
          status: row.estado === 'CERRADA' ? 'done' : 'todo',
          type: 'ipevar_finding',
          priority,
          actionType,
          assignedTo: row.responsable || row.cargo || 'Coordinador PESV',
          sourceModule: 'matriz_pesv',
          referenceId,
          referenceName,
        });
        syncedCount++;
      } else if (task.status !== 'done' && task.status !== 'dismissed') {
        task.title = title;
        task.description = description;
        task.priority = priority;
        task.actionType = actionType;
        if (row.estado === 'CERRADA') task.status = 'done';
        await task.save();
        syncedCount++;
      }
    }
  }

  if (activePesvRefs.size > 0) {
    await KanbanTask.deleteMany({
      user: userId,
      ...(companyId ? { companyId } : {}),
      sourceModule: 'matriz_pesv',
      status: { $in: ['todo', 'due_soon'] },
      referenceId: { $nin: Array.from(activePesvRefs) },
    });
  }

  return syncedCount;
}

// ─── ECOSISTEMA 360°: Resumen en tiempo real de módulos vinculados al PESV ──────
router.get('/ecosystem-summary', requireJwtAuth, async (req, res) => {
  try {
    const ecosystemStats = await gatherPesvEcosystem(req);
    return res.json({ success: true, ecosystemStats });
  } catch (error) {
    logger.error('[PESVWorkspace GET /ecosystem-summary] Error:', error);
    return res.status(500).json({ error: 'Error al consultar el resumen del ecosistema PESV 360°' });
  }
});

// ─── ECOSISTEMA 360°: Sincronización Integral PESV (Hito 1 + Hito 2 + Hito 5 + Hito 7) ─
router.post('/sync-ecosystem', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const officialConvoId = `official-pesv-${companyId || userId}`;
    const eco = await gatherPesvEcosystem(req, companyId);

    let session = await PESVWorkspaceSession.findOne({ conversationId: officialConvoId });
    let currentRows =
      Array.isArray(req.body?.matrixRows) && req.body.matrixRows.length > 0
        ? [...req.body.matrixRows]
        : Array.isArray(session?.matrixRows)
          ? [...session.matrixRows]
          : [];

    let addedCount = 0;

    // 1. Si está vacía, sembrar los 6 programas críticos del Paso 6 y Paso 8
    if (currentRows.length === 0) {
      const defaultRows = buildDefaultPesvRowsFromEcosystem(eco);
      currentRows.push(...defaultRows);
      addedCount += defaultRows.length;
    }

    // 2. Cruzar con vehículos de Hito 5 (ej. alertas de SOAT/Tecno o inspecciones preoperacionales rechazadas)
    if (Array.isArray(eco.vehiculosList) && eco.vehiculosList.length > 0) {
      const hasDocRisk = currentRows.some((r) =>
        /soat|t[eé]cnico-mec[aá]nica|tecnomec[aá]nica|documentaci[oó]n vehicular/i.test(r.peligro_descripcion || '')
      );
      if (!hasDocRisk && eco.vehiculosAlertaDocsCount > 0) {
        const alertPlates = eco.vehiculosList
          .filter((v) => v.soatVencimiento || v.tecnomecanicaVencimiento)
          .slice(0, 4)
          .map((v) => v.placa)
          .join(', ');
        currentRows.push({
          id: `pesv-hito5-docs-${Date.now()}`,
          grupo_trabajo: 'Gestión de flota vehicular (Hito 5)',
          cargo: toSentenceCase(eco.vehiculosList[0]?.conductorNombre || 'Conductor de vehículo operativo'),
          tipo_desplazamiento: 'Misional',
          rol_via: /moto/i.test(eco.vehiculosList[0]?.tipo || '')
            ? 'Conductor de motocicleta'
            : 'Conductor de vehículo liviano',
          factor_riesgo: 'Factor Vehicular',
          peligro_descripcion: `Circulación de vehículos con SOAT o Revisión Técnico-Mecánica vencida o próxima a vencer (${eco.vehiculosAlertaDocsCount} vehículo(s) en alerta en Hito 5: ${alertPlates}).`,
          np_cualitativo: 'PROBABLE',
          np_cuantitativo: 3,
          ne_cualitativo: 'FRECUENTE',
          ne_cuantitativo: 4,
          nc_cualitativo: 'CRITICO',
          nc_cuantitativo: 5,
          calificacion: 12,
          nivel_riesgo: 'NIVEL DE RIESGO ALTO o CRITICO',
          aceptabilidad: 'NO ACEPTABLE',
          controles_existentes_descripcion: 'Seguimiento en Hoja de Vida de Automotores (Hito 5).',
          controles_existentes_tipo: 'VEHICULO',
          tratamiento_accion: 'EVITARLO',
          plan_accion_medio: 'Inmovilización administrativa inmediata hasta renovación de SOAT y RTM vigentes en el RUNT.',
          plan_accion_vehiculo: 'Renovación inmediata de póliza SOAT y certificado de Revisión Técnico-Mecánica y de Emisiones Contaminantes.',
          plan_accion_individuo: 'Verificación obligatoria de documentos vigentes en la lista de chequeo preoperacional diaria (Paso 16).',
          plan_accion_infraestructura: 'Control de salida en portería / despacho.',
          responsable: 'Gestor de Flota / Líder PESV',
          fecha_programacion: 'Inmediato',
          estado: 'PLANEADA',
          observaciones: 'Sincronizado automáticamente desde Hoja de Vida de Automotores (Hito 5).',
        });
        addedCount++;
      }
    }

    // 3. Cruzar con peligros viales detectados en la Matriz GTC 45 (Hito 1)
    if (Array.isArray(eco.peligrosVialesGtc45List) && eco.peligrosVialesGtc45List.length > 0) {
      for (const gtcHazard of eco.peligrosVialesGtc45List.slice(0, 4)) {
        const descClean = String(gtcHazard.descripcion || '').trim();
        if (!descClean) continue;
        const alreadyExists = currentRows.some(
          (r) =>
            String(r.peligro_descripcion || '').toLowerCase().includes(descClean.toLowerCase().substring(0, 25))
        );
        if (!alreadyExists) {
          currentRows.push({
            id: `pesv-gtc45-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            grupo_trabajo: toSentenceCase(gtcHazard.proceso || 'Operaciones y desplazamientos'),
            cargo: toSentenceCase(gtcHazard.cargo || eco.cargosViales[0] || 'Conductor / Actor vial'),
            tipo_desplazamiento: 'Misional',
            rol_via: 'Conductor de vehículo liviano',
            factor_riesgo: 'Entorno/Otros',
            peligro_descripcion: `${descClean} (Identificado en Matriz IPEVR GTC 45 - ${gtcHazard.clasificacion}).`,
            np_cualitativo: 'PROBABLE',
            np_cuantitativo: 3,
            ne_cualitativo: 'FRECUENTE',
            ne_cuantitativo: 4,
            nc_cualitativo: 'PELIGROSO',
            nc_cuantitativo: 4,
            calificacion: 11,
            nivel_riesgo: 'NIVEL DE RIESGO MEDIO o MODERADO',
            aceptabilidad: 'ACEPTABLE CON CONTROL ESPECIFICO',
            controles_existentes_descripcion: gtcHazard.controles || 'Controles definidos en Matriz IPEVR GTC 45.',
            controles_existentes_tipo: 'MEDIO-INDIVIDUO',
            tratamiento_accion: 'MODIFICAR LOS FACTORES DE EXPOSICION',
            plan_accion_medio: 'Articular protocolo de seguridad vial con los controles operativos del proceso en GTC 45.',
            plan_accion_vehiculo: 'Inspección preoperacional diaria (Paso 16) y mantenimiento preventivo al día (Paso 17).',
            plan_accion_individuo: 'Capacitación en seguridad vial y comportamiento seguro en la vía (Paso 8 Res. 20223040040595).',
            plan_accion_infraestructura: 'Verificación de condiciones de la vía y entorno en el rutograma.',
            responsable: 'Coordinador SG-SST / Líder PESV',
            fecha_programacion: 'Mensual',
            estado: 'PLANEADA',
            observaciones: 'Sincronizado automáticamente desde la Matriz IPEVR GTC 45 (Hito 1).',
          });
          addedCount++;
        }
      }
    }

    // Normalizar filas
    const normalizedRows = currentRows.map((row) => ({
      ...row,
      grupo_trabajo: toSentenceCase(row.grupo_trabajo || 'Operativo'),
      cargo: toSentenceCase(row.cargo || 'Conductor / Actor vial'),
      tratamiento_accion: normalizeTratamientoAccion(row.tratamiento_accion),
    }));

    // Guardar en la sesión oficial
    session = await PESVWorkspaceSession.findOneAndUpdate(
      { conversationId: officialConvoId },
      {
        $set: {
          user: userId,
          companyId,
          matrixRows: normalizedRows,
          isOfficial: true,
          officialTitle: session?.officialTitle || 'Matriz PESV SG-SST',
          promotedAt: session?.promotedAt || new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // 4. Sincronizar cargos con Perfiles de Cargo (Hito 2)
    if (typeof ensurePerfilExists === 'function') {
      try {
        const uniqueCargoMap = new Map();
        for (const r of normalizedRows) {
          if (r.cargo && r.cargo.trim()) {
            const key = r.cargo.trim().toLowerCase();
            if (!uniqueCargoMap.has(key)) uniqueCargoMap.set(key, r);
          }
        }
        for (const [, r] of uniqueCargoMap) {
          await ensurePerfilExists(userId, companyId, r.cargo, {
            proceso: r.grupo_trabajo || 'Seguridad Vial PESV',
            actividad: `Desplazamiento ${r.tipo_desplazamiento || 'Misional'} como ${r.rol_via || 'Actor Vial'}`,
            tareas: r.peligro_descripcion || '',
            medida_administrativa: r.plan_accion_individuo || '',
            medida_ingenieria: r.plan_accion_vehiculo || '',
          });
        }
      } catch (e) {
        logger.warn('[PESVWorkspace /sync-ecosystem] Error sincronizando perfiles de cargo:', e.message);
      }
    }

    // 5. Sincronizar tareas con KanbanTask (Hito 7) y marcar estándar 32 PESV en DiagnosticoData (Hito 1)
    const syncedTasksCount = await syncPesvKanbanTasks(userId, companyId, normalizedRows);
    await markPesvStandardCompliant(userId, companyId, normalizedRows.length);

    const updatedEcosystemStats = await gatherPesvEcosystem(req, companyId);

    return res.json({
      success: true,
      matrixRows: session.matrixRows,
      ecosystemStats: updatedEcosystemStats,
      addedCount,
      syncedTasksCount,
      message: `Sincronización 360° PESV completada: ${normalizedRows.length} riesgos viales activos (${addedCount} incorporados del ecosistema) y ${syncedTasksCount} planes de acción sincronizados con el Centro ACPM.`,
    });
  } catch (error) {
    logger.error('[PESVWorkspace POST /sync-ecosystem] Error:', error);
    return res.status(500).json({ error: error.message || 'Error al sincronizar el ecosistema PESV 360°' });
  }
});

// ─── OFICIAL: Obtener la matriz PESV oficial del SG-SST ───────────────────────
router.get('/official', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const officialConvoId = `official-pesv-${companyId || userId}`;

    // 1. Buscar sesión marcada explícitamente como oficial
    let session = await PESVWorkspaceSession.findOne({
      user: userId,
      ...(companyId ? { companyId } : { $or: [{ companyId: null }, { companyId: { $exists: false } }] }),
      isOfficial: true,
      'matrixRows.0': { $exists: true },
    });

    // 2. Fallback a la sesión maestra 'official-pesv-*'
    if (!session) {
      session = await PESVWorkspaceSession.findOne({
        conversationId: officialConvoId,
        'matrixRows.0': { $exists: true },
      });
    }

    // 3. Fallback a la última sesión de la empresa activa que tenga filas de matriz PESV
    if (!session) {
      session = await PESVWorkspaceSession.findOne({
        ...(companyId ? { companyId } : { user: userId }),
        'matrixRows.0': { $exists: true },
      }).sort({ updatedAt: -1 });
    }

    const ecosystemStats = await gatherPesvEcosystem(req, companyId);

    // 4. Si no existe sesión oficial o está vacía, auto-poblar desde el ecosistema 360° (Paso 6 y Paso 8 Res. 20223040040595)
    if (!session || !Array.isArray(session.matrixRows) || session.matrixRows.length === 0) {
      const seededRows = buildDefaultPesvRowsFromEcosystem(ecosystemStats);
      session = await PESVWorkspaceSession.findOneAndUpdate(
        { conversationId: officialConvoId },
        {
          $set: {
            user: userId,
            companyId,
            matrixRows: seededRows,
            chartConclusions: {},
            reportHtml: '',
            isOfficial: true,
            officialTitle: 'Matriz PESV SG-SST',
            sourceConversationId: 'ecosystem-auto-seed',
            promotedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      await markPesvStandardCompliant(userId, companyId, seededRows.length);
      ecosystemStats.estandar32Cumple = true;
    }

    res.json({
      hasOfficial: true,
      conversationId: session.conversationId,
      matrixRows: session.matrixRows || [],
      chartConclusions: session.chartConclusions || {},
      reportHtml: session.reportHtml || '',
      officialTitle: session.officialTitle ? session.officialTitle.replace(/\bOficial\s*/gi, '').trim() : 'Matriz PESV SG-SST',
      sourceConversationId: session.sourceConversationId || null,
      promotedAt: session.promotedAt || session.updatedAt,
      updatedAt: session.updatedAt,
      ecosystemStats,
    });
  } catch (error) {
    logger.error('[PESVWorkspace GET /official] Error:', error);
    res.status(500).json({ error: 'Failed to fetch official PESV matrix' });
  }
});

// ─── OFICIAL: Establecer / Promover una matriz PESV a Oficial del Sistema ─────
router.post('/set-official', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const { sourceConversationId, officialTitle, matrixRows, chartConclusions } = req.body;

    const officialConvoId = `official-pesv-${companyId || userId}`;

    // 1. Desmarcar cualquier otra matriz PESV oficial de esta empresa
    await PESVWorkspaceSession.updateMany(
      { user: userId, ...(companyId ? { companyId } : {}), isOfficial: true },
      { $set: { isOfficial: false } }
    );

    let rowsToSave = matrixRows;
    let conclusionsToSave = chartConclusions;
    let sourceTitle = officialTitle;

    // Si viene desde un chat específico, obtener datos de esa sesión
    if (sourceConversationId && (!rowsToSave || rowsToSave.length === 0)) {
      const sourceSession = await PESVWorkspaceSession.findOne({ conversationId: sourceConversationId });
      if (sourceSession) {
        rowsToSave = sourceSession.matrixRows;
        conclusionsToSave = sourceSession.chartConclusions;
        sourceSession.promotedAt = new Date();
        if (officialTitle) sourceSession.officialTitle = officialTitle;
        await sourceSession.save();
      }

      if (!sourceTitle) {
        const ConversationModel = mongoose.models.Conversation || require('~/db/models').Conversation;
        if (ConversationModel) {
          const cDoc = await ConversationModel.findOne({ conversationId: sourceConversationId }).lean();
          if (cDoc?.title) sourceTitle = cDoc.title;
        }
      }
    }

    const normalizedRows = (rowsToSave || []).map(row => ({
      ...row,
      grupo_trabajo: toSentenceCase(row.grupo_trabajo || ''),
      cargo: toSentenceCase(row.cargo || ''),
      tratamiento_accion: normalizeTratamientoAccion(row.tratamiento_accion),
    }));

    // 2. Guardar o actualizar la sesión oficial maestra
    const officialSession = await PESVWorkspaceSession.findOneAndUpdate(
      { conversationId: officialConvoId },
      {
        $set: {
          user: userId,
          companyId,
          matrixRows: normalizedRows,
          chartConclusions: conclusionsToSave || {},
          isOfficial: true,
          officialTitle: (sourceTitle ? sourceTitle.replace(/\bOficial\s*/gi, '').trim() : '') || 'Matriz PESV SG-SST',
          sourceConversationId: sourceConversationId || null,
          promotedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    if (normalizedRows.length > 0) {
      await markPesvStandardCompliant(userId, companyId, normalizedRows.length);
    }

    logger.info(`[PESVWorkspace /set-official] Official PESV matrix established. Rows: ${normalizedRows.length}, user: ${userId}`);

    res.json({
      success: true,
      officialSession: {
        conversationId: officialSession.conversationId,
        matrixRows: officialSession.matrixRows,
        chartConclusions: officialSession.chartConclusions,
        officialTitle: officialSession.officialTitle,
        sourceConversationId: officialSession.sourceConversationId,
        promotedAt: officialSession.promotedAt,
      },
    });
  } catch (error) {
    logger.error('[PESVWorkspace POST /set-official] Error:', error);
    res.status(500).json({ error: 'Failed to set official PESV matrix' });
  }
});

// ─── OFICIAL: Modificar la matriz PESV oficial directamente desde el aplicativo ─
router.put('/official', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const { matrixRows, chartConclusions, reportHtml, officialTitle } = req.body;

    const officialConvoId = `official-pesv-${companyId || userId}`;

    const normalizedRows = (matrixRows || []).map(row => ({
      ...row,
      grupo_trabajo: toSentenceCase(row.grupo_trabajo || ''),
      cargo: toSentenceCase(row.cargo || ''),
      tratamiento_accion: normalizeTratamientoAccion(row.tratamiento_accion),
    }));

    const updateFields = {
      user: userId,
      companyId,
      matrixRows: normalizedRows,
      isOfficial: true,
    };
    if (chartConclusions !== undefined) updateFields.chartConclusions = chartConclusions;
    if (reportHtml !== undefined) updateFields.reportHtml = reportHtml;
    if (officialTitle) updateFields.officialTitle = officialTitle;

    const session = await PESVWorkspaceSession.findOneAndUpdate(
      { conversationId: officialConvoId },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    // Sincronización en paralelo con el chat fuente si existe
    if (session && session.sourceConversationId) {
      await PESVWorkspaceSession.findOneAndUpdate(
        { conversationId: session.sourceConversationId },
        {
          $set: {
            matrixRows: normalizedRows,
            ...(chartConclusions !== undefined ? { chartConclusions } : {}),
            ...(reportHtml !== undefined ? { reportHtml } : {}),
            updatedAt: new Date(),
          },
        }
      );
      logger.info(`[PESVWorkspace PUT /official] Sincronizada en paralelo con el chat fuente "${session.sourceConversationId}"`);
    }

    if (normalizedRows.length > 0) {
      await markPesvStandardCompliant(userId, companyId, normalizedRows.length);
    }

    res.json({
      success: true,
      matrixRows: session.matrixRows,
      chartConclusions: session.chartConclusions,
      reportHtml: session.reportHtml,
      officialTitle: session.officialTitle,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    logger.error('[PESVWorkspace PUT /official] Error:', error);
    res.status(500).json({ error: 'Failed to update official PESV matrix' });
  }
});

// ─── OFICIAL: Listar todas las matrices PESV de los chats para el selector ────
router.get('/list-user-matrices', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const tempId = `temp-${userId}`;
    const officialConvoId = `official-pesv-${companyId || userId}`;

    const companyFilter = companyId
      ? { companyId }
      : { user: userId, $or: [{ companyId: null }, { companyId: { $exists: false } }] };

    const sessions = await PESVWorkspaceSession.find({
      ...companyFilter,
      conversationId: { $ne: tempId },
      'matrixRows.0': { $exists: true },
    }).sort({ updatedAt: -1 }).lean();

    const ConversationModel = mongoose.models.Conversation || require('~/db/models').Conversation;
    const convoIds = sessions
      .map(s => s.conversationId)
      .filter(id => id && !id.startsWith('official-'));

    let titleMap = {};
    if (ConversationModel && convoIds.length > 0) {
      try {
        const convos = await ConversationModel.find({ conversationId: { $in: convoIds } }).select('conversationId title').lean();
        convos.forEach(c => {
          titleMap[c.conversationId] = c.title || 'Chat PESV sin título';
        });
      } catch (err) {
        logger.warn('[PESVWorkspace /list-user-matrices] Error fetching titles:', err.message);
      }
    }

    const items = sessions.map(s => {
      const isMasterOfficial = s.conversationId === officialConvoId;
      let displayTitle = s.officialTitle ? s.officialTitle.replace(/\bOficial\s*/gi, '').trim() : (titleMap[s.conversationId] || 'Matriz de Riesgos Viales PESV');
      if (s.conversationId === officialConvoId) {
        displayTitle = displayTitle || '⭐ Matriz PESV Activa del Sistema';
      }

      const rows = s.matrixRows || [];
      const criticalCount = rows.filter(r => (Number(r.calificacion) || 0) >= 12).length;

      return {
        conversationId: s.conversationId,
        title: displayTitle,
        isOfficial: isMasterOfficial,
        rowCount: rows.length,
        criticalCount,
        sourceConversationId: s.sourceConversationId || null,
        promotedAt: s.promotedAt || null,
        updatedAt: s.updatedAt,
      };
    });

    res.json({ matrices: items });
  } catch (error) {
    logger.error('[PESVWorkspace GET /list-user-matrices] Error:', error);
    res.status(500).json({ error: 'Failed to list user PESV matrices' });
  }
});

// GET matrix
router.get('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, companyId } = await resolveUserAndCompany(req);

    let session = await PESVWorkspaceSession.findOne({ conversationId, user: userId, companyId: companyId });

    if (!session) {
      const anySession = await PESVWorkspaceSession.findOne({ conversationId });
      if (anySession) {
        if (anySession.companyId && companyId && String(anySession.companyId) !== String(companyId)) {
          return res.json({ matrixRows: [], chartConclusions: {}, reportHtml: '', companyMismatch: true });
        }
        let modified = false;
        if (!anySession.user) {
          anySession.user = userId;
          modified = true;
        }
        if (!anySession.companyId && companyId) {
          anySession.companyId = companyId;
          modified = true;
        }
        if (modified) await anySession.save();
        session = anySession;
      }
    }

    if (!session && conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const tempId = `temp-${userId}`;
      const tempSession = await PESVWorkspaceSession.findOne({
        conversationId: tempId,
        user: userId,
        ...(companyId ? { companyId } : { $or: [{ companyId: null }, { companyId: { $exists: false } }] }),
      });
      if (tempSession && tempSession.matrixRows && tempSession.matrixRows.length > 0) {
        tempSession.conversationId = conversationId;
        tempSession.companyId = companyId;
        await tempSession.save();
        session = tempSession;
      }
    }

    if (!session) {
      return res.json({ matrixRows: [], chartConclusions: {}, reportHtml: '' });
    }

    res.json({
      matrixRows: session.matrixRows,
      chartConclusions: session.chartConclusions || {},
      reportHtml: session.reportHtml || '',
    });
  } catch (error) {
    logger.error('[PESVWorkspace] Error fetching matrix:', error);
    res.status(500).json({ error: 'Failed to fetch PESV matrix' });
  }
});

// UPDATE matrix
router.put('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { matrixRows, chartConclusions, reportHtml } = req.body;
    const { userId, companyId } = await resolveUserAndCompany(req);

    const normalizedRows = (matrixRows || []).map(row => ({
      ...row,
      grupo_trabajo: toSentenceCase(row.grupo_trabajo),
      cargo: toSentenceCase(row.cargo),
      tratamiento_accion: normalizeTratamientoAccion(row.tratamiento_accion),
    }));

    const setUpdate = { matrixRows: normalizedRows, companyId };
    if (chartConclusions !== undefined) setUpdate.chartConclusions = chartConclusions;
    if (reportHtml !== undefined) setUpdate.reportHtml = reportHtml;

    let session = await PESVWorkspaceSession.findOneAndUpdate(
      { conversationId, companyId: companyId },
      {
        $set: setUpdate,
        $setOnInsert: { user: userId },
      },
      { upsert: true, new: true },
    );

    if (conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const tempId = `temp-${userId}`;
      await PESVWorkspaceSession.deleteOne({ conversationId: tempId, user: userId });
      logger.info(`[PESVWorkspace PUT] Deleted temporary session for user ${userId} since real session was created.`);
    }

    // Sincronización en paralelo con Somos SST (Matriz PESV Oficial)
    const officialConvoId = `official-pesv-${companyId || userId}`;
    const isOfficialSource = session.isOfficial || (await PESVWorkspaceSession.exists({ conversationId: officialConvoId, sourceConversationId: conversationId }));
    if (isOfficialSource && conversationId !== officialConvoId) {
      await PESVWorkspaceSession.findOneAndUpdate(
        { conversationId: officialConvoId },
        {
          $set: {
            matrixRows: normalizedRows,
            ...(chartConclusions !== undefined ? { chartConclusions } : {}),
            ...(reportHtml !== undefined ? { reportHtml } : {}),
            updatedAt: new Date(),
          },
        }
      );
      logger.info(`[PESVWorkspace PUT /:conversationId] Sincronizada en paralelo con la Matriz PESV Oficial de Somos SST ("${officialConvoId}")`);
    }

    res.json({ success: true, matrixRows: session.matrixRows });
  } catch (error) {
    logger.error('[PESVWorkspace] Error updating matrix:', error);
    res.status(500).json({ error: 'Failed to update PESV matrix' });
  }
});

// AI Update Row
router.post('/ai-update-row', requireJwtAuth, async (req, res) => {
  try {
    const { row } = req.body;
    const { userId } = await resolveUserAndCompany(req);

    if (!row) return res.status(400).json({ error: 'Se requiere el objeto row.' });

    const prompt = `Eres un experto certificado en el Plan Estratégico de Seguridad Vial (PESV) en Colombia bajo la Resolución 20223040040595 de 2022 (Paso 6: Caracterización, Evaluación y Control de Riesgos Viales; Paso 8: 5 Programas de Gestión de Riesgos Críticos — Velocidad, Fatiga, Distracción, Alcohol/SPA y Actores Viales Vulnerables; Paso 16: Inspecciones Preoperacionales; Paso 17: Mantenimiento), ISO 39001:2012, Ley 1503 de 2011, Ley 2050 de 2020 y Res. 0312/2019 Art. 32.
Tienes esta fila de Matriz de Riesgos Viales con datos fijados por el usuario que JAMÁS debes modificar:

═══ DATOS FIJOS (NO MODIFICAR) ═══
GRUPO TRABAJO: ${row.grupo_trabajo || ''}
CARGO: ${row.cargo || ''}
TIPO DESPLAZAMIENTO: ${row.tipo_desplazamiento || ''}
ROL EN LA VÍA: ${row.rol_via || ''}
FACTOR DE RIESGO VIAL: ${row.factor_riesgo || ''}
PELIGRO/DESCRIPCIÓN: ${row.peligro_descripcion || ''}
CONTROLES EXISTENTES / INTERPRETACIÓN: ${row.controles_existentes_descripcion || 'Ninguno'}
TIPO DE CONTROL EXISTENTE: ${row.controles_existentes_tipo || 'Ninguno'}

═══ TU ÚNICA TAREA ═══
Basándote EXCLUSIVAMENTE en los datos fijos de arriba:
1. Determina los niveles de Probabilidad (NP), Exposición (NE) y Consecuencia (NC) utilizando las siguientes escalas cualitativas de la Guía ANSV / Resolución 20223040040595 de 2022 (Paso 6):
   - Nivel de Probabilidad (NP):
     * "MUY PROBABLE" (El evento vial es altamente probable que ocurra - valor 5)
     * "MEDIANAMENTE PROBABLE" (El evento vial es moderadamente probable - valor 4)
     * "PROBABLE" (El evento vial es probable que ocurra - valor 3)
     * "POCO PROBABLE" (El evento vial es poco factible - valor 2)
     * "NO ES PROBABLE" (El evento vial es extremadamente improbable - valor 1)
   - Nivel de Exposición (NE):
     * "CONSTANTE" (Exposición diaria o continua - valor 5)
     * "FRECUENTE" (Exposición regular varias veces a la semana - valor 4)
     * "OCASIONAL" (Exposición esporádica o algunas veces - valor 3)
     * "ESPORADICO" (Exposición muy baja o eventual - valor 2)
     * "MINIMA" (Exposición mínima o casi inexistente - valor 1)
   - Nivel de Consecuencia (NC):
     * "CRITICO" (Fatalidades o incapacidades totales permanentes - valor 5)
     * "PELIGROSO" (Lesiones muy graves con incapacidades permanentes parciales - valor 4)
     * "MODERADO" (Lesiones con incapacidades temporales significativas - valor 3)
     * "MARGINAL" (Lesiones menores con incapacidades breves - valor 2)
     * "INSIGNIFICANTE" (Lesiones muy leves sin incapacidad o daños menores - valor 1)

2. Propón la Acción de Tratamiento ("tratamiento_accion"), que debe ser una de: "ACEPTARLO", "EVITARLO", "ELIMINAR LA FUENTE QUE OCASIONA", "IMPLEMENTAR CONTROLES EN LA FUENTE Y EL MEDIO", "MODIFICAR LOS FACTORES DE EXPOSICION".
3. Propón los planes de acción para el medio ("plan_accion_medio"), para el vehículo ("plan_accion_vehiculo"), para el individuo ("plan_accion_individuo") y para la infraestructura/vía ("plan_accion_infraestructura") alineados con el Paso 8, Paso 16 y Paso 17 de la Res. 20223040040595. Si no aplica alguno de ellos, pon "Ninguno".
4. Asigna un responsable de los controles ("responsable", ej: Coordinador PESV, Gestor de Flotas, Conductor) y las observaciones pertinentes.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown y sin envolver en \`\`\`json) con estos campos exactos:
{
  "np_cualitativo": "<MUY PROBABLE|MEDIANAMENTE PROBABLE|PROBABLE|POCO PROBABLE|NO ES PROBABLE>",
  "ne_cualitativo": "<CONSTANTE|FRECUENTE|OCASIONAL|ESPORADICO|MINIMA>",
  "nc_cualitativo": "<CRITICO|PELIGROSO|MODERADO|MARGINAL|INSIGNIFICANTE>",
  "tratamiento_accion": "<ACEPTARLO|EVITARLO|ELIMINAR LA FUENTE QUE OCASIONA|IMPLEMENTAR CONTROLES EN LA FUENTE Y EL MEDIO|MODIFICAR LOS FACTORES DE EXPOSICION>",
  "plan_accion_medio": "<plan propuesto para el medio o 'Ninguno'>",
  "plan_accion_vehiculo": "<plan propuesto para el vehículo o 'Ninguno'>",
  "plan_accion_individuo": "<plan propuesto para el individuo o 'Ninguno'>",
  "plan_accion_infraestructura": "<plan propuesto para la infraestructura o 'Ninguno'>",
  "responsable": "<Coordinador PESV o Conductor o Gestor de Flota>",
  "fecha_programacion": "<fecha o periodicidad, ej: Permanente o Mensual>",
  "observaciones": "<observaciones opcionales o vacías>"
}`;

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    let text = result.response.text().trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let updatedFields;
    try {
      updatedFields = JSON.parse(text);
    } catch (parseErr) {
      logger.error('[PESV/ai-update-row] JSON parse error:', parseErr.message, 'Raw:', text.slice(0, 500));
      return res.status(500).json({ error: 'La IA devolvió un formato JSON inválido. Intenta de nuevo.' });
    }

    const np_cuantitativo = mapNP(updatedFields.np_cualitativo);
    const ne_cuantitativo = mapNE(updatedFields.ne_cualitativo);
    const nc_cuantitativo = mapNC(updatedFields.nc_cualitativo);
    const calificacion = np_cuantitativo + ne_cuantitativo + nc_cuantitativo;
    
    let nivel_riesgo = 'NIVEL DE RIESGO BAJO';
    let aceptabilidad = 'ACEPTABLE';
    if (calificacion >= 12) {
      nivel_riesgo = 'NIVEL DE RIESGO ALTO o CRITICO';
      aceptabilidad = 'NO ACEPTABLE';
    } else if (calificacion >= 8) {
      nivel_riesgo = 'NIVEL DE RIESGO MEDIO o MODERADO';
      aceptabilidad = 'ACEPTABLE CON CONTROL ESPECIFICO';
    }

    updatedFields.np_cuantitativo = np_cuantitativo;
    updatedFields.ne_cuantitativo = ne_cuantitativo;
    updatedFields.nc_cuantitativo = nc_cuantitativo;
    updatedFields.calificacion = calificacion;
    updatedFields.nivel_riesgo = nivel_riesgo;
    updatedFields.aceptabilidad = aceptabilidad;
    updatedFields.tratamiento_accion = normalizeTratamientoAccion(updatedFields.tratamiento_accion);
    
    updatedFields.plan_accion_medio = updatedFields.plan_accion_medio || 'Ninguno';
    updatedFields.plan_accion_vehiculo = updatedFields.plan_accion_vehiculo || 'Ninguno';
    updatedFields.plan_accion_individuo = updatedFields.plan_accion_individuo || 'Ninguno';
    updatedFields.plan_accion_infraestructura = updatedFields.plan_accion_infraestructura || 'Ninguno';

    return res.json({ updatedFields });
  } catch (error) {
    logger.error('[PESV/ai-update-row] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Helper: Generar HTML de gráficas PESV
function getHexPESVColor(calificacion) {
  if (calificacion >= 12) return '#dc2626'; // Rojo - Alto o Crítico
  if (calificacion >= 8) return '#ea580c'; // Naranja/Amarillo - Medio
  return '#16a34a'; // Verde - Bajo
}

function buildPesvChartsHtml(matrixRows) {
  if (!matrixRows || matrixRows.length === 0) return '';
  
  const mapActor = {};
  matrixRows.forEach(r => {
    const k = (r.rol_via || 'Sin clasificar').trim();
    if (!mapActor[k]) mapActor[k] = { count: 0, totalScore: 0 };
    mapActor[k].count++;
    mapActor[k].totalScore += Number(r.calificacion) || 0;
  });
  const chartActor = Object.entries(mapActor).map(([actor, d]) => ({ actor, count: d.count, avg: Math.round((d.totalScore / d.count) * 10) / 10 })).sort((a,b) => b.avg - a.avg);
  const maxActor = 15;

  const mapFactor = {};
  matrixRows.forEach(r => {
    const k = (r.factor_riesgo || 'Sin clasificar').trim();
    if (!mapFactor[k]) mapFactor[k] = { count: 0, totalScore: 0 };
    mapFactor[k].count++;
    mapFactor[k].totalScore += Number(r.calificacion) || 0;
  });
  const chartFactor = Object.entries(mapFactor).map(([factor, d]) => ({ factor, count: d.count, avg: Math.round((d.totalScore / d.count) * 10) / 10 })).sort((a,b) => b.avg - a.avg);
  const maxFactor = 15;

  let persona = 0, medio = 0, vehiculo = 0, infra = 0;
  matrixRows.forEach(r => {
    const t = String(r.controles_existentes_tipo || '').toUpperCase();
    if (t.includes('INDIVIDUO') || t.includes('PERSONA')) persona++;
    if (t.includes('MEDIO')) medio++;
    if (t.includes('VEHICULO') || t.includes('VEHÍCULO')) vehiculo++;
    if (t.includes('INFRAESTRUCTURA') || t.includes('VIA') || t.includes('VÍA')) infra++;
  });
  const total = matrixRows.length || 1;
  const chartControls = [
    { label: 'Control en el Individuo (Persona)', value: persona, pct: Math.round((persona/total)*100) },
    { label: 'Control en el Medio', value: medio, pct: Math.round((medio/total)*100) },
    { label: 'Control en el Vehículo', value: vehiculo, pct: Math.round((vehiculo/total)*100) },
    { label: 'Control en la Vía / Infraestructura', value: infra, pct: Math.round((infra/total)*100) },
  ];

  function renderBar(label, value, max, color) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return `
      <div style="display:flex; align-items:center; margin-bottom:8px;">
        <div style="width:180px; font-size:11px; color:#475569; font-weight:600; text-align:right; padding-right:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${label}">${label}</div>
        <div style="flex:1; background-color:#f1f5f9; border-radius:10px; height:16px; position:relative; overflow:hidden;">
          <div style="background-color:${color}; width:${Math.max(5, pct)}%; height:100%; border-radius:10px; display:flex; align-items:center; justify-content:flex-end; padding-right:8px; color:white; font-size:10px; font-weight:bold;">
            ${value}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div style="margin: 25px 0; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: #f8fafc; page-break-inside: avoid;">
      <h3 style="color:#0369a1; font-size:16px; margin-top:0; border-bottom:2px solid #0369a1; padding-bottom:8px; margin-bottom:20px; text-transform:uppercase;">
          ANALÍTICA PESV — DIAGNÓSTICO VIAL (Res. 20223040040595 Paso 6 y Paso 8 • ISO 39001)
      </h3>
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Calificación Promedio por Actor Vial (Rango 3-15)</h4>
          ${chartActor.map(d => renderBar(d.actor, d.avg, maxActor, getHexPESVColor(d.avg))).join('')}
        </div>
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Calificación Promedio por Factor PESV</h4>
          ${chartFactor.map(d => renderBar(d.factor, d.avg, maxFactor, getHexPESVColor(d.avg))).join('')}
        </div>
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Efectividad de Controles Existentes</h4>
          ${chartControls.map(d => renderBar(d.label, d.pct, 100, '#0ea5e9') + `<div style="font-size:9px; color:#64748b; text-align:right; margin-bottom:5px; margin-top:-3px;">Cobertura: ${d.pct}% riesgos</div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// AI Analyze Matrix (PESV Report)
router.post('/ai-analyze-matrix', requireJwtAuth, async (req, res) => {
  try {
    const { matrixRows, instruction } = req.body;
    const { userId, company: loadedCompanyInfo } = await resolveUserAndCompany(req);

    if (!matrixRows || !matrixRows.length) return res.status(400).json({ error: 'La matriz PESV está vacía.' });

    const currentDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const headerHTML = buildStandardHeader({
      title: 'INFORME DE EVALUACIÓN DE RIESGOS VIALES Y PESV (PASO 6 Y PASO 8)',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'Resolución 20223040040595 de 2022 (Paso 6, 8, 16 y 17) • ISO 39001:2012 • Ley 1503/2011 • Ley 2050/2020 • Res. 0312/2019 Art. 32',
      responsibleName: req.user?.name,
    });

    const matrixSummary = matrixRows.map((r, i) =>
      `[${i+1}] Grupo Trabajo: ${r.grupo_trabajo} | Cargo: ${r.cargo} | Actor: ${r.rol_via} | Desplazamiento: ${r.tipo_desplazamiento} | Factor: ${r.factor_riesgo} | Peligro: ${r.peligro_descripcion} | Calificación (3-15): ${r.calificacion} (${r.nivel_riesgo}) | Aceptabilidad: ${r.aceptabilidad}`
    ).join('\n');

    const prompt = `Eres un auditor certificado y consultor experto en Planes Estratégicos de Seguridad Vial (PESV) según la Resolución 20223040040595 de 2022 (Paso 6: Caracterización, Evaluación y Control de Riesgos Viales; Paso 8: 5 Programas de Gestión de Riesgos Críticos — Velocidad, Fatiga, Distracción, Alcohol/SPA y Actores Viales Vulnerables; Paso 16: Inspecciones Preoperacionales; Paso 17: Mantenimiento), ISO 39001:2012, Ley 1503 de 2011, Ley 2050 de 2020 y Res. 0312/2019 Art. 32.
Analiza esta Matriz PESV de riesgos viales y emite un Informe Técnico y Ejecutivo integral MUY EXTENSO, sumamente detallado y analítico.

**INSTRUCCIONES DE FORMATO HTML:**
- Responde EXCLUSIVAMENTE en HTML limpio, listo para inyectarse en el DOM. NO uses \`\`\`html.
- TODAS las tablas deben llevar: <table style="width:100%;table-layout:fixed;word-wrap:break-word;border-collapse:separate;border-spacing:0;border:1px solid #e0f2fe;border-radius:8px;margin-bottom:25px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
- Headers de tablas (<th>): <th style="background-color:#0369a1;color:#fff;padding:12px 14px;font-size:13px;font-weight:700;text-transform:uppercase;text-align:left;">
- Celdas (<td>): <td style="padding:10px 14px;border-bottom:1px solid #f0f9ff;font-size:13px;color:#334155;vertical-align:top;background-color:#fff;">
- Headers de sección (H3): <h3 style="color:#0369a1; margin-top:30px; border-bottom:1px solid #ccc; padding-bottom:5px;">

**ESTRUCTURA DEL INFORME EXIGIDA (en HTML):**
1. **Introducción y Objetivos Viales**: Contextualización sobre el PESV bajo Resolución 20223040040595 de 2022, ISO 39001:2012, Ley 1503 de 2011, Ley 2050 de 2020 y Art. 32 de la Res. 0312/2019.
2. **Análisis de Indicadores y Gráficas de Seguridad Vial (Paso 6)**:
    - a. Análisis de riesgos por actor vial (Peatones, Ciclistas, Conductores de Motocicleta, Vehículo Liviano, Carga Pesada).
    - b. Evaluación de factores de riesgo vial (Factor Humano, Factor Vehicular, Factor Infraestructura y Entorno).
    - c. Balance de la jerarquía de controles actual en las operaciones de tránsito.
3. **Articulación con los 5 Programas de Gestión de Riesgos Críticos (Paso 8) e Inspecciones/Mantenimiento (Pasos 16 y 17)**: Incluye tabla con columnas: Programa PESV / Paso Normativo, Actor Vial, Peligro Crítico, Nivel de Riesgo y Responsable.
4. **Plan de Acción y Seguridad Activa/Pasiva**: Propuesta de intervención de controles (Individuo, Vehículo, Medio e Infraestructura) abarcando capacitaciones, rutogramas e inspecciones preoperacionales diarias.
5. **Conclusión y Recomendaciones de Mejora Continua**: Integración del PESV con el SG-SST de la empresa.

MATRIZ COMPLETA A ANALIZAR:
${matrixSummary}

INSTRUCCIÓN ADICIONAL: ${instruction || 'Generar análisis exhaustivo según Resolución 20223040040595 de 2022 e ISO 39001.'}`;

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const htmlBody = result.response.text().replace(/```html\n ?/g, '').replace(/```\n?/g, '').trim();
    
    const chartsHTML = buildPesvChartsHtml(matrixRows);

    let fullReport = headerHTML + chartsHTML + '<div style="margin-top:20px;">' + htmlBody + '</div>';
    if (loadedCompanyInfo) {
      fullReport += buildSignatureSection(loadedCompanyInfo);
    }

    return res.json({ analysis: fullReport });
  } catch (error) {
    logger.error('[PESV/ai-analyze-matrix] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// AI Chart Conclusion
router.post('/ai-chart-conclusion', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId, chartType, chartStats } = req.body;
    const { userId } = await resolveUserAndCompany(req);

    if (!conversationId || !chartType) return res.status(400).json({ error: 'conversationId y chartType son requeridos.' });

    const prompt = `Eres un profesional experto en Seguridad Vial laboral (PESV Res. 20223040040595 de 2022 e ISO 39001) en Colombia.
Analiza los datos del gráfico "${chartType}" de una matriz PESV:

ESTADÍSTICAS DEL GRÁFICO:
${JSON.stringify(chartStats || {}, null, 2)}

Redacta una conclusión técnica profesional de 3 a 5 oraciones que resuma el hallazgo crítico en este gráfico, identifique brechas viales y proponga 1 acción correctiva concreta bajo el Paso 6 y Paso 8 de la Res. 20223040040595. Escribe como un párrafo fluido, sin bullets ni encabezados.`;

    const modelName = SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const conclusion = result.response.text().trim();

    await PESVWorkspaceSession.findOneAndUpdate(
      { conversationId },
      { $set: { [`chartConclusions.${chartType}`]: conclusion } },
      { upsert: true, new: true }
    );

    return res.json({ conclusion });
  } catch (error) {
    logger.error('[PESV/ai-chart-conclusion] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// AI Parse Matrix
router.post('/ai-parse-matrix', requireJwtAuth, async (req, res) => {
  try {
    const { rawRows } = req.body;
    const { userId } = await resolveUserAndCompany(req);

    if (!rawRows || !Array.isArray(rawRows)) {
      return res.status(400).json({ error: 'Se requiere una lista de filas en "rawRows".' });
    }

    if (rawRows.length === 0) return res.json({ matrixRows: [] });

    const cleanedRows = cleanRawRows(rawRows);

    const CHUNK_SIZE = 50;
    const chunks = [];
    for (let i = 0; i < cleanedRows.length; i += CHUNK_SIZE) {
      chunks.push(cleanedRows.slice(i, i + CHUNK_SIZE));
    }

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    logger.info(`[PESV/ai-parse-matrix] Processing ${cleanedRows.length} rows for user ${userId} in ${chunks.length} chunks (chunk size ${CHUNK_SIZE})`);

    const combinedRows = [];

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      const chunk = chunks[chunkIdx];
      if (chunkIdx > 0) {
        // Pausa de 500ms para evitar saturación de tasa (concurrencia) en el API de Gemini
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      logger.info(`[PESV/ai-parse-matrix] Processing chunk ${chunkIdx + 1}/${chunks.length} for user ${userId}`);

      const prompt = `Eres un experto certificado en el Plan Estratégico de Seguridad Vial (PESV) en Colombia y la normatividad de la Resolución 20223040040595 de 2022 (Paso 6 y Paso 8) e ISO 39001.
Te proporciono una lista de filas importadas desde un archivo con columnas arbitrarias.
Analiza los datos y transfórmalos a nuestro formato estándar de matriz PESV:

Estructura requerida para cada objeto de la lista JSON:
{
  "grupo_trabajo": "<grupo de trabajo o área en tipo oración>",
  "cargo": "<cargo del trabajador expuesto en tipo oración>",
  "tipo_desplazamiento": "<Misional|In itinere>",
  "rol_via": "<Peatón|Pasajero|Conductor de motocicleta|Conductor de vehículo liviano|Conductor de vehículo pesado|Ciclista|Otro>",
  "factor_riesgo": "<Factor Humano|Factor Vehicular|Factor Infraestructura|Entorno/Otros>",
  "peligro_descripcion": "<descripción clara del peligro vial>",
  "np_cualitativo": "<MUY PROBABLE|MEDIANAMENTE PROBABLE|PROBABLE|POCO PROBABLE|NO ES PROBABLE>",
  "ne_cualitativo": "<CONSTANTE|FRECUENTE|OCASIONAL|ESPORADICO|MINIMA>",
  "nc_cualitativo": "<CRITICO|PELIGROSO|MODERADO|MARGINAL|INSIGNIFICANTE>",
  "controles_existentes_descripcion": "<interpretación o descripción de los controles existentes o 'Ninguno'>",
  "controles_existentes_tipo": "<INDIVIDUO|MEDIO|MEDIO-INDIVIDUO|VEHICULO|INFRAESTRUCTURA|Ninguno>",
  "tratamiento_accion": "<ACEPTARLO|EVITARLO|ELIMINAR LA FUENTE QUE OCASIONA|IMPLEMENTAR CONTROLES EN LA FUENTE Y EL MEDIO|MODIFICAR LOS FACTORES DE EXPOSICION|Ninguno>",
  "plan_accion_medio": "<plan propuesto para el medio o 'Ninguno'>",
  "plan_accion_vehiculo": "<plan propuesto para el vehículo o 'Ninguno'>",
  "plan_accion_individuo": "<plan propuesto para el individuo o 'Ninguno'>",
  "plan_accion_infraestructura": "<plan propuesto para la infraestructura/vía o 'Ninguno'>",
  "responsable": "<Coordinador PESV o Conductor o Gestor de Flota>",
  "fecha_programacion": "<fecha o periodicidad, ej: Permanente o Mensual>",
  "estado": "<PLANEADA|CERRADA>",
  "observaciones": "<observaciones adicionales o vacías>"
}

Reglas:
1. Determina los niveles cualitativos de NP, NE y NC según el peligro vial y las guías del Paso 6 de la Res. 20223040040595.
2. El resultado debe ser EXCLUSIVAMENTE una lista JSON válida sin explicaciones ni markdown ni envolverse en \`\`\`json.

FILAS ORIGINALES:
${JSON.stringify(chunk, null, 2)}`;

      const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
      let text = result.response.text().trim();
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        logger.warn(`[PESV/ai-parse-matrix] Direct JSON parse failed for chunk ${chunkIdx + 1}, attempting repair:`, err.message);
        const startIdx = text.indexOf('[');
        if (startIdx !== -1) {
          let arrayStr = text.slice(startIdx);
          const lastObjEnd = arrayStr.lastIndexOf('}');
          if (lastObjEnd !== -1) {
            try {
              parsed = JSON.parse(arrayStr.slice(0, lastObjEnd + 1) + ']');
            } catch (e2) {
              logger.error(`[PESV/ai-parse-matrix] JSON repair failed in chunk ${chunkIdx + 1}:`, e2.message);
            }
          }
        }
        if (!parsed) {
          throw new Error('La IA devolvió un formato JSON inválido para uno de los lotes. Por favor, intenta de nuevo.');
        }
      }

      if (!Array.isArray(parsed)) {
        if (typeof parsed === 'object' && parsed !== null) parsed = [parsed];
        else throw new Error('La IA no devolvió un listado de filas en el formato esperado.');
      }

      const mappedChunk = parsed.map(row => {
        const np_cuantitativo = Number(row.np_cuantitativo) || mapNP(row.np_cualitativo);
        const ne_cuantitativo = Number(row.ne_cuantitativo) || mapNE(row.ne_cualitativo);
        const nc_cuantitativo = Number(row.nc_cuantitativo) || mapNC(row.nc_cualitativo);
        const calificacion = np_cuantitativo + ne_cuantitativo + nc_cuantitativo;

        let nivel_riesgo = 'NIVEL DE RIESGO BAJO';
        let aceptabilidad = 'ACEPTABLE';
        if (calificacion >= 12) {
          nivel_riesgo = 'NIVEL DE RIESGO ALTO o CRITICO';
          aceptabilidad = 'NO ACEPTABLE';
        } else if (calificacion >= 8) {
          nivel_riesgo = 'NIVEL DE RIESGO MEDIO o MODERADO';
          aceptabilidad = 'ACEPTABLE CON CONTROL ESPECIFICO';
        }

        return {
          ...row,
          plan_accion_medio: row.plan_accion_medio || 'Ninguno',
          plan_accion_vehiculo: row.plan_accion_vehiculo || 'Ninguno',
          plan_accion_individuo: row.plan_accion_individuo || 'Ninguno',
          plan_accion_infraestructura: row.plan_accion_infraestructura || 'Ninguno',
          controles_existentes_descripcion: row.controles_existentes_descripcion || 'Ninguno',
          tratamiento_accion: normalizeTratamientoAccion(row.tratamiento_accion),
          np_cuantitativo,
          ne_cuantitativo,
          nc_cuantitativo,
          calificacion,
          nivel_riesgo,
          aceptabilidad,
          id: Date.now().toString() + Math.random().toString(36).substring(7)
        };
      });

      combinedRows.push(...mappedChunk);
    }

    logger.info(`[PESV/ai-parse-matrix] Successfully mapped ${combinedRows.length} rows for user ${userId}`);
    return res.json({ matrixRows: combinedRows });

  } catch (error) {
    logger.error('[PESV/ai-parse-matrix] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── OFICIAL / CHAT: Auto-asignar Cargos a las filas de la matriz PESV con IA ──
router.post('/auto-assign-cargos', requireJwtAuth, async (req, res) => {
  try {
    ensurePesvEcosystemModels();
    const { userId, company, companyId: activeCompanyId } = await resolveUserAndCompany(req);
    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const { matrixRows, conversationId } = req.body;

    if (!matrixRows || !Array.isArray(matrixRows) || matrixRows.length === 0) {
      return res.status(400).json({ error: 'No se enviaron filas de la matriz PESV para procesar.' });
    }

    let companyId = activeCompanyId;
    if (conversationId && conversationId !== 'official' && !conversationId.startsWith('official-') && conversationId !== 'new') {
      const existingSession = await PESVWorkspaceSession.findOne({ conversationId }).select('companyId').lean();
      if (existingSession?.companyId) {
        companyId = existingSession.companyId;
      }
    }

    const PerfilCargoModel = mongoose.models.PerfilCargoData;
    let availableCargos = [];
    let perfilesDetallados = [];
    if (PerfilCargoModel) {
      try {
        const cargoDoc = await PerfilCargoModel.findOne(
          companyId
            ? { user: userId, companyId }
            : { user: userId, $or: [{ companyId: null }, { companyId: { $exists: false } }] }
        ).lean();
        if (cargoDoc && Array.isArray(cargoDoc.perfilesList)) {
          perfilesDetallados = cargoDoc.perfilesList
            .filter((p) => p && p.nombreCargo)
            .map((p) => ({
              nombreCargo: toSentenceCase(p.nombreCargo),
              area: p.area || '',
              nivelCargo: p.nivelCargo || '',
              descripcion: (
                p.contextoAdicional ||
                (p.report ? p.report.replace(/<[^>]+>/g, ' ').substring(0, 400) : '') ||
                ''
              ).trim(),
            }));
          availableCargos = perfilesDetallados.map((p) => p.nombreCargo);
        }
      } catch (err) {
        logger.warn('[PESVWorkspace /auto-assign-cargos] Error loading PerfilCargoData:', err.message);
      }
    }

    let companyContext = '';
    if (company) {
      companyContext = `Empresa: ${company.companyName || ''}, Actividad: ${company.economicActivity || ''}, Sector: ${company.sector || ''}`;
    }

    const perfilesFormatText = perfilesDetallados.length > 0
      ? perfilesDetallados
          .map(
            (p, i) =>
              `${i + 1}. CARGO: "${p.nombreCargo}"
   - Área: ${p.area || 'General'} | Nivel: ${p.nivelCargo || 'Operativo'}
   - DESCRIPCIÓN Y ACTIVIDADES DEL PERFIL: ${p.descripcion || 'Sin descripción detallada'}`
          )
          .join('\n\n')
      : 'No hay cargos registrados previamente en el aplicativo de Perfiles de la empresa.';

    const rowsSummary = matrixRows.map((r, index) => ({
      index,
      grupo_trabajo: r.grupo_trabajo || '',
      cargoActual: r.cargo || '',
      tipo_desplazamiento: r.tipo_desplazamiento || '',
      rol_via: r.rol_via || '',
      factor_riesgo: r.factor_riesgo || '',
      peligro: r.peligro_descripcion || '',
    }));

    const prompt = `Eres un Director Senior de Seguridad Vial (PESV Res. 20223040040595 de 2022) y SG-SST experto en perfiles de cargo viales y matrices de peligros viales.
Tu misión es ASIGNAR con la máxima precisión el CARGO o puesto de trabajo correspondiente a cada fila de la matriz PESV.

CONTEXTO EMPRESARIAL:
${companyContext || 'No especificado'}

CATÁLOGO DE PERFILES DE CARGO REGISTRADOS EN LA EMPRESA:
${perfilesFormatText}

FILAS DE LA MATRIZ PESV A CLASIFICAR (Array JSON):
${JSON.stringify(rowsSummary, null, 2)}

REGLAS:
1. Analiza el "rol_via", "tipo_desplazamiento", "grupo_trabajo" y "peligro" de cada fila y compáralo con los perfiles registrados de la empresa.
2. Si coincide o se relaciona con un perfil registrado en el catálogo, asigna exactamente ese "nombreCargo".
3. Si no coincide con ningún perfil existente o el catálogo está vacío, asigna un nombre de cargo formal y específico acorde al rol vial (ej. "Conductor de Reparto", "Mensajero Motorizado", "Asesor Comercial", "Auxiliar Logístico", "Coordinador Administrativo").
4. Responde ÚNICAMENTE con un JSON array válido con este formato exacto:
[
  { "index": 0, "cargo": "Nombre del Cargo Exacto" },
  { "index": 1, "cargo": "Nombre del Cargo Exacto" }
]`;

    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    let text = result.response.text().trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let assignedList = [];
    try {
      assignedList = JSON.parse(text);
    } catch (e) {
      const startIdx = text.indexOf('[');
      const endIdx = text.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1) {
        try {
          assignedList = JSON.parse(text.substring(startIdx, endIdx + 1));
        } catch (e2) {
          logger.error('[PESVWorkspace /auto-assign-cargos] Repair failed:', e2.message);
        }
      }
    }

    if (!Array.isArray(assignedList)) {
      throw new Error('La respuesta de la IA no tuvo el formato esperado.');
    }

    const assignedMap = new Map();
    assignedList.forEach(item => {
      if (item && item.index !== undefined && item.cargo) {
        assignedMap.set(Number(item.index), toSentenceCase(item.cargo));
      }
    });

    const updatedRows = matrixRows.map((row, idx) => {
      const assignedCargo = assignedMap.get(idx);
      return {
        ...row,
        cargo: assignedCargo || toSentenceCase(row.cargo || 'Conductor / Actor Vial'),
        grupo_trabajo: toSentenceCase(row.grupo_trabajo || 'Operativo'),
      };
    });

    const targetConvoId = (!conversationId || conversationId === 'official' || conversationId.startsWith('official-'))
      ? `official-pesv-${companyId || userId}`
      : conversationId;

    await PESVWorkspaceSession.findOneAndUpdate(
      { conversationId: targetConvoId },
      { $set: { matrixRows: updatedRows } }
    );

    if (typeof ensurePerfilExists === 'function') {
      try {
        const uniqueCargoMap = new Map();
        for (const r of updatedRows) {
          if (r.cargo && r.cargo.trim()) {
            const key = r.cargo.trim().toLowerCase();
            if (!uniqueCargoMap.has(key)) {
              uniqueCargoMap.set(key, r);
            }
          }
        }
        for (const [, r] of uniqueCargoMap) {
          await ensurePerfilExists(userId, companyId, r.cargo, {
            proceso: r.grupo_trabajo || 'Seguridad Vial PESV',
            actividad: `Desplazamiento ${r.tipo_desplazamiento || 'Misional'} como ${r.rol_via || 'Actor Vial'}`,
            tareas: r.peligro_descripcion || '',
            medida_administrativa: r.plan_accion_individuo || '',
            medida_ingenieria: r.plan_accion_vehiculo || '',
          });
        }
      } catch (e) {
        logger.warn('[PESVWorkspace /auto-assign-cargos] Error asegurando perfiles:', e.message);
      }
    }

    res.json({
      success: true,
      message: `Se asignaron cargos automáticamente a ${updatedRows.length} riesgos viales con IA.`,
      matrixRows: updatedRows,
      availableCargosCount: availableCargos.length,
    });
  } catch (error) {
    logger.error('[PESVWorkspace POST /auto-assign-cargos] Error:', error);
    res.status(500).json({ error: error.message || 'Error al auto-asignar cargos con IA' });
  }
});

// ─── OFICIAL / CHAT: Sincronizar Planes de Acción PESV con Centro de Control (Kanban ACPM) ──
router.post('/sync-controles-pesv', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const { matrixRows } = req.body;

    if (!matrixRows || !Array.isArray(matrixRows) || matrixRows.length === 0) {
      return res.status(400).json({ error: 'No se enviaron filas de la matriz PESV para sincronizar.' });
    }

    const syncedCount = await syncPesvKanbanTasks(userId, companyId, matrixRows);

    res.json({
      success: true,
      message: `Se sincronizaron ${syncedCount} planes de acción viales de la Matriz PESV con el Centro de Control (Kanban ACPM).`,
      matrixRows,
      syncedCount,
    });
  } catch (error) {
    logger.error('[PESVWorkspace POST /sync-controles-pesv] Error:', error);
    res.status(500).json({ error: error.message || 'Error al sincronizar planes PESV con Centro de Control' });
  }
});

module.exports = router;
