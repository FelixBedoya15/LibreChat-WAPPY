const express = require('express');
const mongoose = require('mongoose');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const ContextoData = require('~/models/ContextoData');
const OportunidadesData = require('~/models/OportunidadesData');
const KanbanTask = require('~/models/KanbanTask');
const SgsstWorker = require('~/models/SgsstWorker');
const { generateWithKeyRotation } = require('./sgsstGemini');
const {
  buildStandardHeader,
  buildCompanyContextString,
  buildSignatureSection,
} = require('./reportHeader');

const router = express.Router();

/**
 * Resuelve el usuario propietario efectivo y la empresa asignada (soporta Admin, Pro, Usuario de Pruebas y Subusuarios)
 */
async function resolveUserAndCompany(userOrId, explicitCompanyId = null) {
  let rawUserId = userOrId;
  let isSubUser = false;
  let parentUser = null;
  let assignedCompany = explicitCompanyId;

  if (userOrId && typeof userOrId === 'object' && !mongoose.isValidObjectId(userOrId)) {
    rawUserId = userOrId.id || userOrId._id;
    isSubUser = Boolean(userOrId.isSubUser);
    parentUser = userOrId.parentUser || userOrId.parentUserId || null;
    assignedCompany = explicitCompanyId || userOrId.assignedCompany || userOrId.assignedCompanyId || null;
  } else if (rawUserId) {
    try {
      const User = mongoose.models.User || mongoose.model('User');
      const uDoc = await User.findById(rawUserId)
        .select('isSubUser parentUser parentUserId assignedCompany assignedCompanyId')
        .lean();
      if (uDoc?.isSubUser) {
        isSubUser = true;
        parentUser = uDoc.parentUser || uDoc.parentUserId || null;
        assignedCompany = explicitCompanyId || uDoc.assignedCompany || uDoc.assignedCompanyId || null;
      }
    } catch (_) {
      // Fallback silencioso
    }
  }

  const targetUserId = isSubUser && parentUser ? parentUser : rawUserId;
  let company = null;

  if (assignedCompany) {
    company = await CompanyInfo.findById(assignedCompany).lean();
  }
  if (!company && targetUserId) {
    company = await CompanyInfo.findOne({ user: targetUserId, isActive: true }).lean();
    if (!company) {
      company = await CompanyInfo.findOne({ user: targetUserId }).lean();
    }
  }

  return {
    targetUserId: company?.user || targetUserId,
    company,
    companyId: company?._id || assignedCompany || null,
  };
}

/**
 * Obtener empresa activa del usuario (compatible con subusuarios y cuentas de prueba)
 */
async function getActiveCompany(userOrId) {
  const { company } = await resolveUserAndCompany(userOrId);
  return company;
}

/**
 * Extrae un objeto JSON limpio de la respuesta de texto de Gemini
 */
function parseGeminiJson(rawText) {
  let cleaned = String(rawText || '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

/**
 * Asegura el registro de esquemas Mongoose definidos inline en las rutas de SG-SST
 */
function ensureEcosystemModelsRegistered() {
  const inlineRoutes = [
    './matrizPeligros',
    './perfilesCargo',
    './perfilSociodemografico',
    './analisisVulnerabilidad',
    './altaDireccion',
    './programaCapacitaciones',
    './matriz',
    './participacionIpevar',
    './metodoOwas',
    './analisisTrabajoSeguro',
    './permisoAlturas',
    './reporteActos',
    './atel-data',
  ];
  for (const modPath of inlineRoutes) {
    try {
      require(modPath);
    } catch (_) {
      // Ignorar si ya fue cargado o tiene dependencias opcionales
    }
  }
}

/**
 * Metodología 360° de recolección de información integral de la empresa
 * Consolida datos reales de las 16 fuentes del Ecosistema Somos SST:
 * 1. Perfil Corporativo (CompanyInfo)
 * 2. Autoevaluación Res. 0312/2019 (DiagnosticoData)
 * 3. Matriz Legal SST (MatrizLegalData)
 * 4. Matriz IPEVR GTC-45 + Participación Comunitaria (MatrizPeligrosData / GTC45WorkspaceSession / ParticipacionIpevarData)
 * 5. Seguridad Vial PESV y Flota (PESVWorkspaceSession / SgsstVehicleData)
 * 6. Compatibilidad Química SGA e Inventario (ChemicalCompatibilitySession / SgsstChemicalData)
 * 7. Análisis de Vulnerabilidad y Emergencias (AnalisisVulnerabilidadData)
 * 8. Compatibilidad Colaborador-Cargo / Huella Biocéntrica FIT (SgsstWorker / PerfilCargoData / PerfilSociodemograficoData)
 * 9. Gobernanza y Comités (SgsstCopasst / SgsstConvivencia / SgsstBrigadista)
 * 10. Ergonomía OWAS y Estudios de Puesto de Trabajo (MetodoOwasData / EstudioPuestoTrabajo)
 * 11. Termómetro de Ánimo y Clima Psicosocial (MoodTelemetry)
 * 12. Operación Terreno: ATS, Trabajo en Alturas y Gestión de EPP (AnalisisTrabajoSeguroData / PermisoAlturasData / SgsstHeightsData / SgsstEppData / SgsstEppSolicitud)
 * 13. Programa Anual de Capacitaciones SST (ProgramaCapacitacionesData)
 * 14. Reporte de Actos y Condiciones Inseguras (ReporteActosData / PublicReport)
 * 15. Auditoría Interna SG-SST Decreto 1072 (AuditoriaData) y Revisión por la Alta Dirección (AltaDireccionData)
 * 16. Investigación de Incidentes/ATEL, Estadísticas ATEL, Centro ACPM Kanban y Oportunidades Cl. 6.1 (InvestigacionAtelData / ATELAnnualData / KanbanTask / OportunidadesData)
 */
async function gatherCompanyFullContext(userIdOrUser, companyId) {
  ensureEcosystemModelsRegistered();

  const resolved = await resolveUserAndCompany(userIdOrUser, companyId);
  const userId = resolved.targetUserId;
  const company = resolved.company;
  const effectiveCompanyId = resolved.companyId;
  const baseFilter = { user: userId, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) };
  const companyOrUserFilter = effectiveCompanyId
    ? { user: userId, companyId: effectiveCompanyId }
    : { user: userId };

  // 2. Diagnóstico de Estándares Mínimos (Resolución 0312 de 2019)
  let diagnostico = null;
  let diagnosticoScore = 0;
  let diagnosticoLevel = 'Sin evaluar';
  let diagnosticoGaps = 0;
  let diagnosticoGapItems = [];
  let diagnosticoStrengths = [];
  try {
    const DiagnosticoData =
      mongoose.models.DiagnosticoData || require('~/models/DiagnosticoData');
    diagnostico = await DiagnosticoData.findOne(companyOrUserFilter).lean();
    if (diagnostico) {
      diagnosticoScore = Number(Number(diagnostico.score || 0).toFixed(2));
      diagnosticoLevel =
        diagnostico.complianceLevel ||
        (diagnosticoScore >= 86
          ? 'Aceptable'
          : diagnosticoScore >= 61
            ? 'Moderadamente Aceptable'
            : 'Crítico');
      if (Array.isArray(diagnostico.statusData)) {
        const gaps = diagnostico.statusData.filter(
          (s) => s.status === 'no_cumple' || s.status === 'pendiente'
        );
        const cumple = diagnostico.statusData.filter((s) => s.status === 'cumple');
        diagnosticoGaps = gaps.length;
        diagnosticoGapItems = gaps
          .slice(0, 8)
          .map((g) => `${g.code || ''} ${g.name || g.itemId || ''}`.trim());
        diagnosticoStrengths = cumple
          .slice(0, 6)
          .map((c) => `${c.code || ''} ${c.name || c.itemId || ''}`.trim());
      }
    }
  } catch (err) {
    logger.debug('[Contexto] DiagnosticoData lookup failed:', err.message);
  }

  // 3. Matriz Legal SST (MatrizLegalData)
  let matrizLegalTotal = 0;
  let matrizLegalPendientes = 0;
  let matrizLegalGapItems = [];
  try {
    const MatrizLegalData = mongoose.models.MatrizLegalData;
    if (MatrizLegalData) {
      const mlDoc = await MatrizLegalData.findOne(companyOrUserFilter).lean();
      if (mlDoc && Array.isArray(mlDoc.statuses)) {
        matrizLegalTotal = mlDoc.statuses.length;
        const pendingNorms = mlDoc.statuses.filter(
          (s) => s.status === 'no_cumple' || s.status === 'parcial' || s.status === 'pendiente'
        );
        matrizLegalPendientes = pendingNorms.length;
        matrizLegalGapItems = pendingNorms
          .slice(0, 6)
          .map((n) => `${n.norma || n.id || 'Norma SST'} (${n.status || 'pendiente'})`);
      }
    }
  } catch (err) {
    logger.debug('[Contexto] MatrizLegalData lookup failed:', err.message);
  }

  // 4. Matriz de Peligros GTC-45 y Participación IPEVR
  let peligrosSummary = [];
  let participacionesIpevar = 0;
  let participacionesListSummary = [];
  try {
    const MatrizPeligrosData = mongoose.models.MatrizPeligrosData;
    if (MatrizPeligrosData) {
      const matriz = await MatrizPeligrosData.findOne(companyOrUserFilter).lean();
      if (matriz && Array.isArray(matriz.procesos)) {
        matriz.procesos.forEach((p) => {
          if (Array.isArray(p.peligros)) {
            p.peligros.forEach((pel) => {
              peligrosSummary.push({
                proceso: p.proceso || 'General',
                actividad: p.actividad || 'General',
                clasificacion: pel.clasificacion || pel.tipoPeligro || 'Sin clasificar',
                descripcion: pel.descripcionPeligro || pel.descripcion || 'Sin descripción',
                nivelRiesgo:
                  pel.interpretacionNR || pel.nivelRiesgo || pel.aceptabilidad || 'No valorado',
              });
            });
          }
        });
      }
    }
    if (peligrosSummary.length === 0) {
      const GTC45WorkspaceSession =
        mongoose.models.GTC45WorkspaceSession || require('~/models/GTC45WorkspaceSession');
      let gtcSession = await GTC45WorkspaceSession.findOne({
        ...companyOrUserFilter,
        isOfficial: true,
      }).lean();
      if (!gtcSession) {
        gtcSession = await GTC45WorkspaceSession.findOne(companyOrUserFilter)
          .sort({ updatedAt: -1 })
          .lean();
      }
      const rows = gtcSession?.matrixRows || gtcSession?.rows || [];
      if (Array.isArray(rows)) {
        rows.forEach((r) => {
          peligrosSummary.push({
            proceso: r.proceso || r.cargo || 'General',
            actividad: r.actividad || r.tarea || 'Operativa',
            clasificacion: r.peligro_clasificacion || r.clasificacion || 'Biomecánico / Locativo',
            descripcion: r.peligro_descripcion || r.descripcion || 'Peligro operativo',
            nivelRiesgo:
              r.interpretacion_nr || r.aceptabilidad || r.nivel_riesgo || 'Medio',
          });
        });
      }
    }

    const ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData;
    if (ParticipacionIpevarData) {
      const partDoc = await ParticipacionIpevarData.findOne(companyOrUserFilter).lean();
      if (partDoc) {
        const listA = Array.isArray(partDoc.participacionesList) ? partDoc.participacionesList : [];
        const listB = Array.isArray(partDoc.inboxPublico) ? partDoc.inboxPublico : [];
        participacionesIpevar = listA.length + listB.length;
        participacionesListSummary = [...listA, ...listB]
          .slice(0, 5)
          .map(
            (p) =>
              `${p.peligro || p.tipoPeligro || 'Peligro reportado'}: ${p.descripcion || p.propuestaControl || 'Participación del trabajador'}`
          );
      }
    }
  } catch (err) {
    logger.debug('[Contexto] MatrizPeligros/Participacion lookup failed:', err.message);
  }

  const totalPeligros = peligrosSummary.length;
  const peligrosCriticos = peligrosSummary.filter((p) =>
    /\b(I|II)\b|cr[ií]tico|alto|no aceptable/i.test(String(p.nivelRiesgo || ''))
  ).length;

  // 5. Seguridad Vial PESV y Flota Vehicular
  let pesvRiesgosCount = 0;
  let vehiculosCount = 0;
  let pesvSummary = [];
  try {
    const PESVWorkspaceSession =
      mongoose.models.PESVWorkspaceSession || require('~/models/PESVWorkspaceSession');
    const pesvSession = await PESVWorkspaceSession.findOne(companyOrUserFilter)
      .sort({ isOfficial: -1, updatedAt: -1 })
      .lean();
    if (pesvSession && Array.isArray(pesvSession.matrixRows)) {
      pesvRiesgosCount = pesvSession.matrixRows.length;
      pesvSummary = pesvSession.matrixRows
        .slice(0, 5)
        .map(
          (r) =>
            `${r.factor_riesgo || 'Vial'} (${r.rol_via || 'Conductor'}): ${r.peligro_descripcion || 'Riesgo vial'} [${r.nivel_valoracion || r.aceptabilidad || 'Medio'}]`
        );
    }
    const SgsstVehicleData =
      mongoose.models.SgsstVehicleData || require('~/models/SgsstVehicleData');
    vehiculosCount = await SgsstVehicleData.countDocuments(companyOrUserFilter);
  } catch (err) {
    logger.debug('[Contexto] PESV/Vehicles lookup failed:', err.message);
  }

  // 6. Compatibilidad Química SGA e Inventario Químico
  let quimicosCount = 0;
  let incompatibilidadesQuimicas = 0;
  let quimicosSummary = [];
  try {
    const SgsstChemicalData =
      mongoose.models.SgsstChemicalData || require('~/models/SgsstChemicalData');
    const chemDoc = await SgsstChemicalData.findOne(companyOrUserFilter).lean();
    if (chemDoc && Array.isArray(chemDoc.productos)) {
      quimicosCount = chemDoc.productos.length;
      quimicosSummary = chemDoc.productos
        .slice(0, 5)
        .map((q) => `${q.nombre || 'Sustancia'} (${q.peligrosidad || q.clasificacionSGA || 'SGA'})`);
    }
    const ChemicalCompatibilitySession =
      mongoose.models.ChemicalCompatibilitySession ||
      require('~/models/ChemicalCompatibilitySession');
    const compatSession = await ChemicalCompatibilitySession.findOne(companyOrUserFilter)
      .sort({ isOfficial: -1, updatedAt: -1 })
      .lean();
    if (compatSession && Array.isArray(compatSession.matrixRows)) {
      if (quimicosCount === 0) quimicosCount = compatSession.matrixRows.length;
      incompatibilidadesQuimicas = compatSession.matrixRows.filter((r) =>
        Boolean(r.incompatibilidades && String(r.incompatibilidades).trim().length > 3)
      ).length;
    }
  } catch (err) {
    logger.debug('[Contexto] Quimicos lookup failed:', err.message);
  }

  // 7. Análisis de Vulnerabilidad y Amenazas de Emergencia
  let amenazasEmergencia = [];
  let amenazasVulnerabilidadCount = 0;
  try {
    const AnalisisVulnerabilidadData = mongoose.models.AnalisisVulnerabilidadData;
    if (AnalisisVulnerabilidadData) {
      const av = await AnalisisVulnerabilidadData.findOne(companyOrUserFilter).lean();
      if (Array.isArray(av?.formData?.amenazasList)) {
        amenazasEmergencia = av.formData.amenazasList.map(
          (a) => `${a.amenaza || 'Amenaza'} (${a.nivelAmenaza || a.calificacion || 'Identificada'})`
        );
        amenazasVulnerabilidadCount = amenazasEmergencia.length;
      }
    }
  } catch (err) {
    logger.debug('[Contexto] Vulnerabilidad lookup failed:', err.message);
  }

  // 8. Compatibilidad Colaborador-Cargo / Huella Biocéntrica FIT y Perfiles de Cargo
  let totalWorkers = 0;
  let totalCargos = 0;
  let avgFitScore = 0;
  let workersWithFitAlerts = 0;
  let bioRiesgosCriticos = 0;
  let workerFitDetails = [];
  let cargosNames = [];
  try {
    const activeWorkers = await SgsstWorker.find({
      ...companyOrUserFilter,
      estadoLaboral: { $ne: 'Retirado' },
    })
      .select(
        'nombre cargo fitScore fitAlerts condicionesSalud riesgosBioIndividual percepcionRiesgoScore'
      )
      .lean();

    totalWorkers = activeWorkers.length;
    if (!totalWorkers && company?.workerCount) {
      totalWorkers = Number(company.workerCount) || 0;
    }

    if (activeWorkers.length > 0) {
      const fitScores = activeWorkers
        .map((w) => Number(w.fitScore || 0))
        .filter((s) => s > 0);
      avgFitScore =
        fitScores.length > 0
          ? Math.round(fitScores.reduce((a, b) => a + b, 0) / fitScores.length)
          : 85;

      activeWorkers.forEach((w) => {
        const alerts = Array.isArray(w.fitAlerts) ? w.fitAlerts : [];
        const bioList = Array.isArray(w.riesgosBioIndividual) ? w.riesgosBioIndividual : [];
        const critBio = bioList.filter(
          (b) =>
            b.clasificacion_bio === 'Crítico' ||
            b.clasificacion_bio === 'Alto' ||
            b.intervencion_prioritaria
        );
        const hasRestriction = Boolean(
          alerts.length > 0 ||
            (w.fitScore > 0 && w.fitScore < 75) ||
            bioList.some((b) => b.restricciones_laborales)
        );
        if (hasRestriction) {
          workersWithFitAlerts++;
        }
        bioRiesgosCriticos += critBio.length;
        if (hasRestriction || critBio.length > 0) {
          workerFitDetails.push(
            `${w.nombre || 'Colaborador'} (${w.cargo || 'Cargo operativo'}): FIT ${w.fitScore || 80}%${alerts.length > 0 ? ` · Alertas: ${alerts.slice(0, 3).join(', ')}` : ''}${critBio.length > 0 ? ` · ${critBio.length} riesgos bio-individuales altos/críticos` : ''}`
          );
        }
      });
    }

    const PerfilCargoData = mongoose.models.PerfilCargoData;
    if (PerfilCargoData) {
      const cargosDoc = await PerfilCargoData.findOne(companyOrUserFilter).lean();
      if (Array.isArray(cargosDoc?.perfilesList)) {
        totalCargos = cargosDoc.perfilesList.length;
        cargosNames = cargosDoc.perfilesList
          .slice(0, 8)
          .map((c) => c.nombreCargo || c.cargo || 'Cargo')
          .filter(Boolean);
      }
    }
  } catch (err) {
    logger.debug('[Contexto] Workers/Cargos FIT lookup failed:', err.message);
  }

  // 9. Comités reglamentarios (COPASST, Convivencia, Brigada)
  let copasstMembersCount = 0;
  let convivenciaMembersCount = 0;
  let brigadaCount = 0;
  try {
    const SgsstCopasst = mongoose.models.SgsstCopasst || require('~/models/SgsstCopasst');
    if (SgsstCopasst) {
      const cop = await SgsstCopasst.findOne(companyOrUserFilter).lean();
      copasstMembersCount = cop?.members?.length || (cop?.president ? 2 : 0);
    }
    const SgsstConvivencia =
      mongoose.models.SgsstConvivencia || require('~/models/SgsstConvivencia');
    if (SgsstConvivencia) {
      const ccl = await SgsstConvivencia.findOne(companyOrUserFilter).lean();
      convivenciaMembersCount = ccl?.members?.length || 0;
    }
    const SgsstBrigadista =
      mongoose.models.SgsstBrigadista || require('~/models/SgsstBrigadista');
    if (SgsstBrigadista) {
      brigadaCount = await SgsstBrigadista.countDocuments(companyOrUserFilter);
    }
  } catch (err) {
    logger.debug('[Contexto] Committees lookup failed:', err.message);
  }
  const comitesActivos = (copasstMembersCount > 0 ? 1 : 0) + (convivenciaMembersCount > 0 ? 1 : 0);

  // 10. Ergonomía OWAS y Estudios de Puesto de Trabajo
  let owasEvaluationsCount = 0;
  let owasCriticosCount = 0;
  let estudiosPuestoCount = 0;
  let ergonomiaDetails = [];
  try {
    const MetodoOwasData = mongoose.models.MetodoOwasData;
    if (MetodoOwasData) {
      const owasDoc = await MetodoOwasData.findOne(companyOrUserFilter).lean();
      if (owasDoc) {
        const obs = Array.isArray(owasDoc.observaciones) ? owasDoc.observaciones : [];
        owasEvaluationsCount = obs.length || (owasDoc.formData?.puestoTrabajo ? 1 : 0);
        owasCriticosCount = obs.filter((o) => Number(o.categoria || o.riskCategory || 1) >= 3).length;
        if (owasDoc.formData?.puestoTrabajo) {
          ergonomiaDetails.push(
            `Evaluación OWAS en puesto "${owasDoc.formData.puestoTrabajo}": ${owasEvaluationsCount} posturas analizadas (${owasCriticosCount} con categoría de riesgo 3-4 prioritaria).`
          );
        }
      }
    }
    const EstudioPuestoTrabajo =
      mongoose.models.EstudioPuestoTrabajo || require('~/models/EstudioPuestoTrabajo');
    const estudiosList = await EstudioPuestoTrabajo.find(companyOrUserFilter)
      .select('cargo nombreTrabajador estado hallazgosErgonomicos')
      .limit(10)
      .lean();
    estudiosPuestoCount = estudiosList.length;
    estudiosList.slice(0, 4).forEach((ep) => {
      ergonomiaDetails.push(
        `Estudio de Puesto (${ep.cargo || 'Operativo'} - ${ep.nombreTrabajador || 'Colaborador'}): Estado ${ep.estado || 'Realizado'}.`
      );
    });
  } catch (err) {
    logger.debug('[Contexto] Ergonomia/EstudiosPuesto lookup failed:', err.message);
  }

  // 11. Termómetro de Ánimo y Clima Psicosocial (MoodTelemetry)
  let moodReportsCount = 0;
  let moodNegativeCount = 0;
  let topStressors = [];
  try {
    const MoodTelemetry = mongoose.models.MoodTelemetry || require('~/models/MoodTelemetry');
    const moodQuery = effectiveCompanyId ? { companyId: effectiveCompanyId } : { user: userId };
    const moodDocs = await MoodTelemetry.find(moodQuery).sort({ createdAt: -1 }).limit(200).lean();
    moodReportsCount = moodDocs.length;
    const stressorCounts = {};
    moodDocs.forEach((m) => {
      if (m.mood === 'sad' || m.mood === 'stressed' || m.mood === 'anxious') {
        moodNegativeCount++;
      }
      if (Array.isArray(m.stressors)) {
        m.stressors.forEach((s) => {
          stressorCounts[s] = (stressorCounts[s] || 0) + 1;
        });
      }
    });
    topStressors = Object.entries(stressorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k, v]) => `${k} (${v})`);
  } catch (err) {
    logger.debug('[Contexto] MoodTelemetry lookup failed:', err.message);
  }

  // 12. Operación Terreno: ATS, Trabajo en Alturas y Gestión de EPP
  let atsCount = 0;
  let permisosAlturasCount = 0;
  let eppEntregasCount = 0;
  let eppSolicitudesPendientes = 0;
  let operacionDetails = [];
  try {
    const AnalisisTrabajoSeguroData = mongoose.models.AnalisisTrabajoSeguroData;
    if (AnalisisTrabajoSeguroData) {
      const atsDoc = await AnalisisTrabajoSeguroData.findOne(companyOrUserFilter).lean();
      if (atsDoc && (atsDoc.formData?.trabajoRealizar || atsDoc.trabajadoresList?.length)) {
        atsCount = 1;
        operacionDetails.push(
          `ATS activo: "${atsDoc.formData?.trabajoRealizar || 'Tarea crítica controlada'}" (${atsDoc.trabajadoresList?.length || 0} trabajadores autorizados).`
        );
      }
    }
    const PermisoAlturasData = mongoose.models.PermisoAlturasData;
    if (PermisoAlturasData) {
      const altDoc = await PermisoAlturasData.findOne(companyOrUserFilter).lean();
      if (altDoc && (altDoc.formData?.trabajoRealizar || altDoc.trabajadoresList?.length)) {
        permisosAlturasCount = 1;
        operacionDetails.push(
          `Permiso de Trabajo en Alturas Res. 4272/2021 registrado (${altDoc.trabajadoresList?.length || 0} ejecutantes verificados).`
        );
      }
    }
    const SgsstHeightsData =
      mongoose.models.SgsstHeightsData || require('~/models/SgsstHeightsData');
    const heightsDocs = await SgsstHeightsData.countDocuments(companyOrUserFilter);
    if (heightsDocs > 0) {
      permisosAlturasCount += heightsDocs;
    }

    const SgsstEppData = mongoose.models.SgsstEppData || require('~/models/SgsstEppData');
    const eppDocs = await SgsstEppData.find(companyOrUserFilter).select('entregas').lean();
    eppDocs.forEach((d) => {
      if (Array.isArray(d.entregas)) eppEntregasCount += d.entregas.length;
    });

    const SgsstEppSolicitud =
      mongoose.models.SgsstEppSolicitud || require('~/models/SgsstEppSolicitud');
    eppSolicitudesPendientes = await SgsstEppSolicitud.countDocuments({
      ...companyOrUserFilter,
      estado: 'pendiente',
    });
  } catch (err) {
    logger.debug('[Contexto] Operacion Terreno lookup failed:', err.message);
  }

  // 13. Programa de Capacitaciones SST (ProgramaCapacitacionesData)
  let capacitacionesTotal = 0;
  let capacitacionesCompletadas = 0;
  let capacitacionesPendientes = 0;
  let capacitacionesCompliancePct = 0;
  let capacitacionesDetails = [];
  try {
    const ProgramaCapacitacionesData = mongoose.models.ProgramaCapacitacionesData;
    if (ProgramaCapacitacionesData) {
      const capDoc = await ProgramaCapacitacionesData.findOne(companyOrUserFilter).lean();
      if (capDoc) {
        const sesiones = Array.isArray(capDoc.sesiones) ? capDoc.sesiones : [];
        const plan = Array.isArray(capDoc.planPersonalizado) ? capDoc.planPersonalizado : [];
        capacitacionesTotal = sesiones.length;
        capacitacionesCompletadas = sesiones.filter((s) => s.estado === 'Completada').length;
        capacitacionesPendientes = sesiones.filter((s) => s.estado === 'Programada').length;

        if (capacitacionesTotal > 0) {
          capacitacionesCompliancePct = Math.round(
            (capacitacionesCompletadas / capacitacionesTotal) * 100
          );
        } else if (plan.length > 0) {
          capacitacionesTotal = plan.length;
          capacitacionesCompletadas = plan.filter((p) => p.estado === 'Completada').length;
          capacitacionesPendientes = plan.length - capacitacionesCompletadas;
          capacitacionesCompliancePct = Math.round(
            (capacitacionesCompletadas / plan.length) * 100
          );
        }

        sesiones.slice(0, 6).forEach((s) => {
          capacitacionesDetails.push(
            `${s.tema || 'Capacitación SST'} (${s.estado || 'Programada'} · Fecha: ${s.fecha || 'Por definir'})`
          );
        });
      }
    }
  } catch (err) {
    logger.debug('[Contexto] ProgramaCapacitaciones lookup failed:', err.message);
  }

  // 14. Reporte de Actos y Condiciones Inseguras (ReporteActosData + PublicReport)
  let actosInsegurosCount = 0;
  let actosInsegurosDetails = [];
  try {
    const ReporteActosData = mongoose.models.ReporteActosData;
    if (ReporteActosData) {
      const repDoc = await ReporteActosData.findOne(companyOrUserFilter).lean();
      if (repDoc) {
        const inbox = Array.isArray(repDoc.inboxPublico) ? repDoc.inboxPublico : [];
        actosInsegurosCount += inbox.length + (repDoc.formData?.descripcionHallazgo ? 1 : 0);
        if (repDoc.formData?.descripcionHallazgo) {
          actosInsegurosDetails.push(
            `${repDoc.formData.tipoReporte || 'Condición/Acto'}: ${repDoc.formData.descripcionHallazgo}`
          );
        }
        inbox.slice(0, 4).forEach((item) => {
          actosInsegurosDetails.push(
            `${item.data?.tipoReporte || 'Reporte QR'}: ${item.data?.descripcion || item.data?.descripcionHallazgo || 'Hallazgo reportado por trabajador'}`
          );
        });
      }
    }
    const PublicReport = mongoose.models.PublicReport || require('~/models/PublicReport');
    if (effectiveCompanyId) {
      const pubCount = await PublicReport.countDocuments({ companyId: effectiveCompanyId });
      actosInsegurosCount = Math.max(actosInsegurosCount, pubCount);
    }
  } catch (err) {
    logger.debug('[Contexto] ReporteActos lookup failed:', err.message);
  }

  // 15. Auditoría Interna SG-SST Decreto 1072 (AuditoriaData) y Revisión por la Alta Dirección (AltaDireccionData)
  let auditoriaScore = 0;
  let auditoriaNoConformidades = 0;
  let auditoriaObservaciones = 0;
  let auditoriaFindings = [];
  let auditoriaStrengths = [];
  try {
    const AuditoriaData = mongoose.models.AuditoriaData || require('~/models/AuditoriaData');
    const audDoc = await AuditoriaData.findOne(companyOrUserFilter).lean();
    if (audDoc) {
      auditoriaScore = Number(
        Number(
          audDoc.compliancePercentage || audDoc.weightedPercentage || audDoc.score || 0
        ).toFixed(2)
      );
      const statusList = Array.isArray(audDoc.statusData) ? audDoc.statusData : [];
      const noCumple = statusList.filter((i) => i.status === 'no_cumple');
      const parciales = statusList.filter((i) => i.status === 'parcial');
      const cumple = statusList.filter((i) => i.status === 'cumple');

      auditoriaNoConformidades = noCumple.length;
      auditoriaObservaciones = parciales.length;

      if (auditoriaScore === 0 && statusList.length > 0) {
        const evaluables = statusList.filter((i) => i.status !== 'no_aplica');
        if (evaluables.length > 0) {
          auditoriaScore = Number(
            (((cumple.length + parciales.length * 0.5) / evaluables.length) * 100).toFixed(2)
          );
        }
      }

      auditoriaFindings = [...noCumple, ...parciales]
        .slice(0, 6)
        .map(
          (f) =>
            `[${f.status === 'no_cumple' ? 'No Conformidad' : 'Observación Parcial'}] ${f.code || f.itemId || ''} ${f.name || f.description || ''}${f.observation ? `: ${f.observation}` : ''}`.trim()
        );
      auditoriaStrengths = cumple
        .slice(0, 4)
        .map((c) => `${c.code || c.itemId || ''} ${c.name || c.description || 'Estándar auditado conforme'}`.trim());
    }
  } catch (err) {
    logger.debug('[Contexto] AuditoriaData lookup failed:', err.message);
  }

  let altaDireccionTotalItems = 0;
  let altaDireccionCumple = 0;
  let altaDireccionPendientes = 0;
  let altaDireccionInboxCount = 0;
  let altaDireccionFindings = [];
  try {
    const AltaDireccionData = mongoose.models.AltaDireccionData;
    if (AltaDireccionData) {
      const adDoc = await AltaDireccionData.findOne(companyOrUserFilter).lean();
      if (adDoc) {
        const sData = Array.isArray(adDoc.statusData) ? adDoc.statusData : [];
        const inbox = Array.isArray(adDoc.inboxPublico) ? adDoc.inboxPublico : [];
        altaDireccionTotalItems = sData.length;
        altaDireccionCumple = sData.filter((i) => i.status === 'cumple').length;
        const pend = sData.filter(
          (i) => i.status === 'no_cumple' || i.status === 'parcial' || i.status === 'pendiente'
        );
        altaDireccionPendientes = pend.length;
        altaDireccionInboxCount = inbox.length;

        altaDireccionFindings = pend
          .slice(0, 6)
          .map(
            (p) =>
              `Ítem Gerencial ${p.itemId || p.code || ''} (${p.status}): ${p.observation || p.name || 'Requiere decisión o recursos de Alta Dirección'}`
          );
      }
    }
  } catch (err) {
    logger.debug('[Contexto] AltaDireccionData lookup failed:', err.message);
  }

  // 16. Investigación ATEL, Estadísticas ATEL, Kanban ACPM y Oportunidades Cl. 6.1
  let atelInvestigacionesCount = 0;
  let atelEventsSummary = [];
  try {
    const InvestigacionAtelData =
      mongoose.models.InvestigacionAtelData || require('~/models/InvestigacionAtelData');
    const invList = await InvestigacionAtelData.find(companyOrUserFilter)
      .select('id formData updatedAt')
      .limit(10)
      .lean();
    atelInvestigacionesCount = invList.length;
    invList.slice(0, 4).forEach((inv) => {
      atelEventsSummary.push(
        `${inv.formData?.tipoEvento || 'Incidente/Accidente'}: ${inv.formData?.descripcionEvento || inv.formData?.afectadoNombre || 'Investigación ATEL Res. 1401/2007'}`
      );
    });
  } catch (err) {
    logger.debug('[Contexto] InvestigacionAtelData lookup failed:', err.message);
  }

  let acpmTotal = 0;
  let acpmPending = 0;
  try {
    const kanbanFilter = {
      user: userId,
      ...(effectiveCompanyId
        ? { companyId: { $in: [effectiveCompanyId, String(effectiveCompanyId)] } }
        : {}),
    };
    const tasks = await KanbanTask.find(kanbanFilter).select('status').lean();
    acpmTotal = tasks.length;
    acpmPending = tasks.filter((t) => t.status !== 'done' && t.status !== 'dismissed').length;
  } catch (err) {
    logger.debug('[Contexto] KanbanTask lookup failed:', err.message);
  }

  let oportunidadesCount = 0;
  let riesgosSistemaCount = 0;
  try {
    const oportDoc = await OportunidadesData.findOne(companyOrUserFilter).lean();
    oportunidadesCount = Array.isArray(oportDoc?.oportunidades) ? oportDoc.oportunidades.length : 0;
    riesgosSistemaCount = Array.isArray(oportDoc?.riesgosSistema)
      ? oportDoc.riesgosSistema.length
      : 0;
  } catch (err) {
    logger.debug('[Contexto] OportunidadesData lookup failed:', err.message);
  }

  const ecosystemMetrics = {
    diagnosticoScore,
    diagnosticoLevel,
    diagnosticoGaps,
    matrizLegalTotal,
    matrizLegalPendientes,
    totalPeligros,
    peligrosCriticos,
    participacionesIpevar,
    pesvRiesgosCount,
    vehiculosCount,
    quimicosCount,
    incompatibilidadesQuimicas,
    amenazasVulnerabilidadCount,
    totalWorkers,
    totalCargos,
    avgFitScore,
    workersWithFitAlerts,
    bioRiesgosCriticos,
    comitesActivos,
    copasstCount: copasstMembersCount,
    convivenciaCount: convivenciaMembersCount,
    brigadistasCount: brigadaCount,
    owasEvaluationsCount,
    owasCriticosCount,
    estudiosPuestoCount,
    moodReportsCount,
    moodNegativeCount,
    topStressors,
    atsCount,
    permisosAlturasCount,
    eppEntregasCount,
    eppSolicitudesPendientes,
    capacitacionesTotal,
    capacitacionesCompletadas,
    capacitacionesPendientes,
    capacitacionesCompliancePct,
    actosInsegurosCount,
    auditoriaScore,
    auditoriaNoConformidades,
    auditoriaObservaciones,
    altaDireccionTotalItems,
    altaDireccionCumple,
    altaDireccionPendientes,
    altaDireccionInboxCount,
    atelInvestigacionesCount,
    acpmTotal,
    acpmPending,
    oportunidadesCount,
    riesgosSistemaCount,
  };

  return {
    company,
    diagnostico,
    diagnosticoGapItems,
    diagnosticoStrengths,
    matrizLegalGapItems,
    peligrosSummary,
    participacionesListSummary,
    pesvSummary,
    quimicosSummary,
    amenazasEmergencia,
    workerFitDetails,
    cargosNames,
    copasstMembersCount,
    convivenciaMembersCount,
    brigadaCount,
    ergonomiaDetails,
    topStressors,
    operacionDetails,
    capacitacionesDetails,
    actosInsegurosDetails,
    auditoriaFindings,
    auditoriaStrengths,
    altaDireccionFindings,
    atelEventsSummary,
    ecosystemMetrics,
  };
}

/**
 * GET /api/sgsst/contexto/data
 * Carga la matriz DOFA, partes interesadas, estrategias guardadas y métricas de las 16 fuentes del ecosistema Somos SST.
 */
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req.user);

    const [data, context] = await Promise.all([
      ContextoData.findOne({
        user: userId,
        ...(companyId ? { companyId } : {}),
      }).lean(),
      gatherCompanyFullContext(userId, companyId),
    ]);

    if (data) {
      const roundFloatsInText = (str) =>
        typeof str === 'string'
          ? str.replace(/(\d+\.\d{3,})%/g, (_, n) => `${Number(Number(n).toFixed(2))}%`)
          : str;
      const cleanDofaList = (data.dofaList || []).map((item) => ({
        ...item,
        description: roundFloatsInText(item.description),
        strategicAction: roundFloatsInText(item.strategicAction),
      }));
      const cleanStakeholders = (data.stakeholders || []).map((item) => ({
        ...item,
        parte: roundFloatsInText(item.parte),
        necesidades: roundFloatsInText(item.necesidades),
        expectativas: roundFloatsInText(item.expectativas),
        control: roundFloatsInText(item.control),
      }));
      return res.json({
        dofaList: cleanDofaList,
        stakeholders: cleanStakeholders,
        crossStrategies: data.crossStrategies || { fo: [], do: [], fa: [], da: [] },
        lastGeneratedReport: roundFloatsInText(data.lastGeneratedReport || ''),
        company,
        ecosystemMetrics: context.ecosystemMetrics,
      });
    }

    return res.json({
      dofaList: [],
      stakeholders: [],
      crossStrategies: { fo: [], do: [], fa: [], da: [] },
      lastGeneratedReport: '',
      company,
      ecosystemMetrics: context.ecosystemMetrics,
    });
  } catch (error) {
    logger.error('[SGSST Contexto] Load data error:', error);
    res.status(500).json({ error: 'Error al cargar los datos de contexto y partes interesadas.' });
  }
});

/**
 * POST /api/sgsst/contexto/data
 * Guarda los datos de DOFA y Partes Interesadas editados por el usuario.
 */
router.post('/data', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req.user);

    const {
      dofaList,
      stakeholders,
      crossStrategies,
      lastGeneratedReport,
      conversationId,
      messageId,
    } = req.body;

    const updated = await ContextoData.findOneAndUpdate(
      { user: userId, ...(companyId ? { companyId } : {}) },
      {
        $set: {
          dofaList: Array.isArray(dofaList) ? dofaList : [],
          stakeholders: Array.isArray(stakeholders) ? stakeholders : [],
          crossStrategies: crossStrategies || { fo: [], do: [], fa: [], da: [] },
          ...(lastGeneratedReport !== undefined ? { lastGeneratedReport } : {}),
          ...(conversationId ? { conversationId } : {}),
          ...(messageId ? { messageId } : {}),
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('[SGSST Contexto] Save data error:', error);
    res.status(500).json({ error: 'Error al guardar la información de contexto.' });
  }
});

/**
 * POST /api/sgsst/contexto/sync-ecosystem
 * Extrae determinísticamente hallazgos reales de las 16 fuentes del Ecosistema Somos SST
 * (Auditoría Interna, Revisión por la Alta Dirección, Programa de Capacitaciones, Compatibilidad Colaborador-Cargo FIT,
 * Diagnóstico 0312, Matriz Legal, GTC-45, PESV, Químicos SGA, Ergonomía OWAS/Puestos, Clima Psicosocial,
 * Operación Terreno ATS/Alturas/EPP, Actos Inseguros, ATEL, Comités/Brigada y Vulnerabilidad)
 * y los fusiona sin duplicados en ContextoData.
 */
router.post('/sync-ecosystem', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req.user);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, context] = await Promise.all([
      ContextoData.findOne(filter).lean(),
      gatherCompanyFullContext(userId, companyId),
    ]);

    const em = context.ecosystemMetrics;
    const comp = context.company || {};
    const dofaList = Array.isArray(existingDoc?.dofaList) ? [...existingDoc.dofaList] : [];
    const stakeholders = Array.isArray(existingDoc?.stakeholders)
      ? [...existingDoc.stakeholders]
      : [];
    const crossStrategies = {
      fo: Array.isArray(existingDoc?.crossStrategies?.fo)
        ? [...existingDoc.crossStrategies.fo]
        : [],
      do: Array.isArray(existingDoc?.crossStrategies?.do)
        ? [...existingDoc.crossStrategies.do]
        : [],
      fa: Array.isArray(existingDoc?.crossStrategies?.fa)
        ? [...existingDoc.crossStrategies.fa]
        : [],
      da: Array.isArray(existingDoc?.crossStrategies?.da)
        ? [...existingDoc.crossStrategies.da]
        : [],
    };

    const norm = (s) => String(s || '').trim().toLowerCase();
    const existingDofaKeys = new Set(dofaList.map((d) => norm(d.description)));
    const existingStakeKeys = new Set(stakeholders.map((s) => norm(s.parte)));
    const sourcesSyncedSet = new Set();

    let addedDofaCount = 0;
    let addedStakeholdersCount = 0;

    const addDofaFactor = (item) => {
      const key = norm(item.description);
      if (!key || existingDofaKeys.has(key)) return;
      dofaList.push({
        id: `dofa_eco_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: item.type,
        description: item.description,
        source: item.type === 'fortaleza' || item.type === 'debilidad' ? 'interno' : 'externo',
        impact: item.impact || 'alto',
        strategicAction: item.strategicAction,
        category: item.category || 'Gobernanza / SST',
        originModule: item.originModule,
        responsible: item.responsible || 'Responsable SG-SST',
        status: item.status || 'En Plan de Acción',
        sentToKanban: false,
      });
      existingDofaKeys.add(key);
      sourcesSyncedSet.add(item.originModule);
      addedDofaCount++;
    };

    const addStakeholderItem = (stk) => {
      const key = norm(stk.parte);
      if (!key || existingStakeKeys.has(key)) return;
      stakeholders.push({
        id: `stk_eco_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        parte: stk.parte,
        type: stk.type || 'Interno',
        necesidades: stk.necesidades,
        expectativas: stk.expectativas,
        requisito: stk.requisito,
        control: stk.control,
        communicationChannel: stk.communicationChannel,
        frequency: stk.frequency || 'Mensual',
        impactLevel: stk.impactLevel || 'alto',
      });
      existingStakeKeys.add(key);
      addedStakeholdersCount++;
    };

    // 1. AUDITORÍA INTERNA SG-SST (Dec. 1072 Art. 2.2.4.6.29)
    if (em.auditoriaNoConformidades > 0 || em.auditoriaObservaciones > 0) {
      const topAuditGap =
        context.auditoriaFindings[0] ||
        `${em.auditoriaNoConformidades} No Conformidades y ${em.auditoriaObservaciones} observaciones parciales`;
      addDofaFactor({
        type: 'debilidad',
        description: `Hallazgos abiertos en Auditoría Interna del SG-SST (${em.auditoriaNoConformidades} No Conformidades y ${em.auditoriaObservaciones} observaciones · Puntaje: ${em.auditoriaScore}%): ${topAuditGap}.`,
        strategicAction:
          'Ejecutar análisis de causa raíz (5 Porqués / Espina de Pescado) y cerrar planes de acción correctiva ACPM antes de la próxima auditoría de ciclo PHVA.',
        category: 'Legal / Normativo',
        originModule: 'Auditoría Interna 1072',
        impact: 'alto',
        responsible: 'Auditor Interno / Responsable SG-SST',
        status: 'Prioridad Inmediata',
      });
    } else if (em.auditoriaScore >= 80) {
      addDofaFactor({
        type: 'fortaleza',
        description: `Conformidad verificada en Auditoría Interna SG-SST con puntaje del ${em.auditoriaScore}% bajo el Decreto 1072 de 2015 (Art. 2.2.4.6.29).`,
        strategicAction:
          'Mantener el programa anual de auditorías internas con participación del COPASST y trazabilidad de mejora continua.',
        category: 'Gobernanza / SST',
        originModule: 'Auditoría Interna 1072',
        impact: 'alto',
        responsible: 'Responsable SG-SST',
        status: 'Monitoreo Permanente',
      });
    } else {
      addDofaFactor({
        type: 'debilidad',
        description:
          'Necesidad de formalizar y ejecutar el ciclo anual de Auditoría Interna del SG-SST con participación del COPASST (Dec. 1072/2015 Art. 2.2.4.6.29).',
        strategicAction:
          'Programar y ejecutar la auditoría interna anual de cumplimiento abarcando todas las fases del ciclo PHVA.',
        category: 'Gobernanza / SST',
        originModule: 'Auditoría Interna 1072',
        impact: 'alto',
        responsible: 'Responsable SG-SST / COPASST',
        status: 'En Plan de Acción',
      });
    }

    // 2. REVISIÓN POR LA ALTA DIRECCIÓN (Dec. 1072 Art. 2.2.4.6.31)
    if (em.altaDireccionPendientes > 0) {
      const topAdFinding =
        context.altaDireccionFindings[0] ||
        `${em.altaDireccionPendientes} elementos gerenciales en seguimiento`;
      addDofaFactor({
        type: 'debilidad',
        description: `Revisión por la Alta Dirección con ${em.altaDireccionPendientes} compromisos gerenciales pendientes de cierre (${topAdFinding}).`,
        strategicAction:
          'Aprobar asignación presupuestal y seguimiento trimestral gerencial a los 24 elementos del Art. 2.2.4.6.31 del Decreto 1072/2015.',
        category: 'Gobernanza / SST',
        originModule: 'Revisión por la Alta Dirección',
        impact: 'alto',
        responsible: 'Alta Dirección / Representante Legal',
        status: 'Prioridad Inmediata',
      });
    } else if (em.altaDireccionCumple > 0) {
      addDofaFactor({
        type: 'fortaleza',
        description: `Liderazgo gerencial activo en la Revisión por la Alta Dirección con ${em.altaDireccionCumple} ítems conformes evaluados (Dec. 1072/2015 Art. 2.2.4.6.31).`,
        strategicAction:
          'Sostener la rendición de cuentas semestral y alinear los objetivos estratégicos corporativos con las metas de reducción de ATEL.',
        category: 'Gobernanza / SST',
        originModule: 'Revisión por la Alta Dirección',
        impact: 'alto',
        responsible: 'Alta Dirección',
        status: 'Monitoreo Permanente',
      });
    } else {
      addDofaFactor({
        type: 'oportunidad',
        description:
          'Fortalecimiento de la gobernanza ejecutiva mediante la digitalización de la Revisión por la Alta Dirección (Art. 2.2.4.6.31 Dec. 1072/2015) y el Portal QR Gerencial.',
        strategicAction:
          'Realizar la sesión formal de Revisión Gerencial anual documentando decisiones sobre recursos, política SST y eficacia de controles.',
        category: 'Gobernanza / SST',
        originModule: 'Revisión por la Alta Dirección',
        impact: 'alto',
        responsible: 'Alta Dirección / Responsable SG-SST',
        status: 'En Plan de Acción',
      });
    }

    // 3. PROGRAMA DE CAPACITACIONES SST (Dec. 1072 Art. 2.2.4.6.11)
    if (em.capacitacionesTotal > 0 && em.capacitacionesCompliancePct >= 70) {
      addDofaFactor({
        type: 'fortaleza',
        description: `Ejecución activa del Programa Anual de Capacitación SST con ${em.capacitacionesCompliancePct}% de cumplimiento (${em.capacitacionesCompletadas} de ${em.capacitacionesTotal} sesiones completadas).`,
        strategicAction:
          'Evaluar la eficacia de la formación mediante indicadores de transferencia al puesto de trabajo y reducción de actos inseguros.',
        category: 'Psicosocial / Cultura',
        originModule: 'Programa de Capacitaciones',
        impact: 'alto',
        responsible: 'Responsable SG-SST / ARL',
        status: 'Monitoreo Permanente',
      });
    } else {
      addDofaFactor({
        type: 'debilidad',
        description: `Brecha en cobertura del Programa de Capacitaciones SST (${em.capacitacionesTotal > 0 ? `${em.capacitacionesCompliancePct}% de avance · ${em.capacitacionesPendientes} sesiones pendientes` : 'requiere programación formal de sesiones por cargo y riesgo'}).`,
        strategicAction:
          'Desplegar el cronograma de capacitación personalizado por perfil de cargo, inducción/reinducción y formación específica con apoyo de la ARL.',
        category: 'Psicosocial / Cultura',
        originModule: 'Programa de Capacitaciones',
        impact: 'alto',
        responsible: 'Responsable SG-SST / Talento Humano',
        status: 'Prioridad Inmediata',
      });
    }

    // 4. COMPATIBILIDAD COLABORADOR-CARGO / HUELLA BIOCÉNTRICA FIT
    if (em.workersWithFitAlerts > 0 || em.bioRiesgosCriticos > 0) {
      const topBioDetail =
        context.workerFitDetails[0] ||
        `${em.workersWithFitAlerts} colaboradores con alertas de aptitud y ${em.bioRiesgosCriticos} riesgos bio-individuales prioritarios`;
      addDofaFactor({
        type: 'debilidad',
        description: `Desajustes en Compatibilidad Colaborador-Cargo (FIT promedio ${em.avgFitScore}% · ${em.workersWithFitAlerts} trabajadores con alertas/restricciones médicas y ${em.bioRiesgosCriticos} riesgos bio-individuales críticos): ${topBioDetail}.`,
        strategicAction:
          'Ejecutar reubicación/readaptación de tareas, seguimiento médico ocupacional periódico y controles individualizados según el índice FIT biocéntrico.',
        category: 'Operativo / Biomecánico',
        originModule: 'Compatibilidad Colaborador-Cargo',
        impact: 'alto',
        responsible: 'Médico Laboral / Responsable SG-SST',
        status: 'Prioridad Inmediata',
      });
    } else {
      addDofaFactor({
        type: 'fortaleza',
        description: `Alta Compatibilidad Colaborador-Cargo en la Huella Biocéntrica (${em.totalWorkers} trabajadores activos evaluados en ${em.totalCargos} perfiles de cargo con FIT promedio del ${em.avgFitScore || 88}%).`,
        strategicAction:
          'Integrar el perfil profesiográfico y el índice FIT en los procesos de selección, inducción y vigilancia epidemiológica.',
        category: 'Operativo / Biomecánico',
        originModule: 'Compatibilidad Colaborador-Cargo',
        impact: 'alto',
        responsible: 'Líder de Talento Humano / Responsable SG-SST',
        status: 'Monitoreo Permanente',
      });
    }

    // 5. DIAGNÓSTICO ESTÁNDARES MÍNIMOS RES. 0312/2019 Y MATRIZ LEGAL
    if (em.diagnosticoScore >= 85) {
      addDofaFactor({
        type: 'fortaleza',
        description: `Nivel Aceptable (${em.diagnosticoScore}%) en la Autoevaluación de Estándares Mínimos de la Resolución 0312 de 2019.`,
        strategicAction:
          'Sostener las evidencias documentales y registros operativos para mantener calificación superior al 85% ante el Ministerio del Trabajo.',
        category: 'Legal / Normativo',
        originModule: 'Diagnóstico 0312',
        impact: 'alto',
        responsible: 'Responsable SG-SST',
        status: 'Monitoreo Permanente',
      });
    } else if (em.diagnosticoGaps > 0) {
      addDofaFactor({
        type: 'debilidad',
        description: `Calificación en Estándares Mínimos Res. 0312/2019 del ${em.diagnosticoScore}% (${em.diagnosticoLevel}) con ${em.diagnosticoGaps} brechas normativas (${context.diagnosticoGapItems.slice(0, 3).join(', ') || 'en seguimiento'}).`,
        strategicAction:
          'Ejecutar el Plan de Mejoramiento 0312 priorizando los estándares críticos de cumplimiento legal.',
        category: 'Legal / Normativo',
        originModule: 'Diagnóstico 0312',
        impact: 'alto',
        responsible: 'Responsable SG-SST',
        status: 'Prioridad Inmediata',
      });
    }

    if (em.matrizLegalPendientes > 0) {
      addDofaFactor({
        type: 'amenaza',
        description: `Riesgo sancionatorio externo por ${em.matrizLegalPendientes} requisitos normativos pendientes de evaluación o cumplimiento en la Matriz Legal SST (${context.matrizLegalGapItems.slice(0, 2).join(', ') || 'normativa sectorial'}).`,
        strategicAction:
          'Actualizar trimestralmente la Matriz Legal y verificar la evidencia de cumplimiento de cada decreto y resolución aplicable.',
        category: 'Legal / Normativo',
        originModule: 'Matriz Legal',
        impact: 'alto',
        responsible: 'Responsable SG-SST / Asesor Jurídico',
        status: 'Prioridad Inmediata',
      });
    }

    // 6. MATRIZ IPEVR GTC-45 Y PARTICIPACIÓN COMUNITARIA
    if (em.peligrosCriticos > 0) {
      const topHaz = context.peligrosSummary[0];
      addDofaFactor({
        type: 'debilidad',
        description: `Presencia de ${em.peligrosCriticos} peligros críticos/no aceptables de ${em.totalPeligros} valorados en la Matriz IPEVR GTC-45${topHaz ? ` (destacando ${topHaz.clasificacion}: ${topHaz.descripcion} en ${topHaz.proceso})` : ''}.`,
        strategicAction:
          'Aplicar jerarquía de controles (eliminación, sustitución y controles de ingeniería) sobre los peligros críticos y vincularlos a Programas de Vigilancia Epidemiológica (PVE).',
        category: 'Operativo / Biomecánico',
        originModule: 'Matriz IPEVR GTC-45',
        impact: 'alto',
        responsible: 'Responsable SG-SST / Jefes de Área',
        status: 'Prioridad Inmediata',
      });
    }

    // 7. ERGONOMÍA OWAS Y ESTUDIOS DE PUESTO DE TRABAJO
    if (em.owasCriticosCount > 0 || em.estudiosPuestoCount > 0) {
      addDofaFactor({
        type: em.owasCriticosCount > 0 ? 'debilidad' : 'fortaleza',
        description:
          em.owasCriticosCount > 0
            ? `Exposición biomecánica detectada en evaluaciones ergonómicas OWAS (${em.owasCriticosCount} posturas críticas categoría 3-4) y ${em.estudiosPuestoCount} estudios de puesto de trabajo.`
            : `Vigilancia ergonómica activa con ${em.estudiosPuestoCount} Estudios de Puesto de Trabajo y ${em.owasEvaluationsCount} evaluaciones posturales OWAS ejecutadas.`,
        strategicAction:
          'Implementar rediseño ergonómico de estaciones de trabajo, pausas activas dirigidas y PVE Osteomuscular (DME).',
        category: 'Operativo / Biomecánico',
        originModule: 'Ergonomía y Puestos de Trabajo',
        impact: 'alto',
        responsible: 'Ergónomo / Responsable SG-SST',
        status: 'En Plan de Acción',
      });
    }

    // 8. CLIMA PSICOSOCIAL Y TERMÓMETRO DE ÁNIMO
    if (em.moodNegativeCount > 0 || em.topStressors.length > 0) {
      addDofaFactor({
        type: 'debilidad',
        description: `Alertas de riesgo psicosocial en Termómetro de Ánimo (${em.moodNegativeCount} reportes de tensión/fatiga de ${em.moodReportsCount} registros · Estresores principales: ${em.topStressors.join(', ') || 'carga laboral'}).`,
        strategicAction:
          'Activar el Programa de Vigilancia Epidemiológica Psicosocial (Res. 2646/2008 y Res. 2764/2022) e intervención con el Comité de Convivencia Laboral.',
        category: 'Psicosocial / Cultura',
        originModule: 'Clima Psicosocial',
        impact: 'alto',
        responsible: 'Psicólogo SST / Comité de Convivencia',
        status: 'Prioridad Inmediata',
      });
    }

    // 9. OPERACIÓN TERRENO (ATS, TRABAJO EN ALTURAS, EPP, PESV Y QUÍMICOS SGA)
    if (em.eppSolicitudesPendientes > 0 || em.actosInsegurosCount > 0) {
      addDofaFactor({
        type: 'debilidad',
        description: `Condiciones operativas en terreno por atender: ${em.eppSolicitudesPendientes} solicitudes de EPP pendientes de entrega y ${em.actosInsegurosCount} reportes de actos/condiciones inseguras registrados.`,
        strategicAction:
          'Garantizar reposición inmediata de EPP certificados, validación de permisos de trabajo en alturas (Res. 4272/2021), ATS preoperacional y cierre de condiciones inseguras.',
        category: 'Operativo / Biomecánico',
        originModule: 'Operación Terreno (ATS/Alturas/EPP)',
        impact: 'alto',
        responsible: 'Coordinador de Alturas / Responsable SG-SST',
        status: 'Prioridad Inmediata',
      });
    } else {
      addDofaFactor({
        type: 'fortaleza',
        description: `Control operativo en terreno respaldado por ${em.eppEntregasCount} entregas de EPP registradas, validación de aptitud en ATS/Alturas y trazabilidad digital.`,
        strategicAction:
          'Mantener inspecciones preoperacionales y bloqueo preventivo de tareas de alto riesgo ante restricciones médicas.',
        category: 'Operativo / Biomecánico',
        originModule: 'Operación Terreno (ATS/Alturas/EPP)',
        impact: 'medio',
        responsible: 'Responsable SG-SST',
        status: 'Monitoreo Permanente',
      });
    }

    // 10. OPORTUNIDAD TECNOLÓGICA E INTEGRACIÓN ARL / ECOSISTEMA 360°
    addDofaFactor({
      type: 'oportunidad',
      description: `Aprovechamiento de asistencia técnica y reinversión de la ARL (${comp.arl || 'Administradora de Riesgos Laborales'}) articulada con analítica predictiva e IA del ecosistema Somos SST.`,
      strategicAction:
        'Gestionar horas de consultoría especializada ARL para capacitaciones técnicas, mediciones higiénicas y baterías psicosociales.',
      category: 'Tecnológico / IA',
      originModule: 'Programa de Capacitaciones',
      impact: 'alto',
      responsible: 'Responsable SG-SST / Alta Dirección',
      status: 'En Plan de Acción',
    });

    // 11. AMENAZA DE EMERGENCIAS / ACCIDENTALIDAD ATEL / VIAL PESV
    if (em.atelInvestigacionesCount > 0 || em.pesvRiesgosCount > 0 || em.amenazasVulnerabilidadCount > 0) {
      addDofaFactor({
        type: 'amenaza',
        description: `Exposición a eventos externos de accidentalidad y emergencias (${em.atelInvestigacionesCount} investigaciones ATEL, ${em.pesvRiesgosCount} riesgos viales PESV en actores de la vía y ${em.amenazasVulnerabilidadCount} amenazas de vulnerabilidad identificadas).`,
        strategicAction:
          'Fortalecer simulacros con la Brigada de Emergencias (${em.brigadistasCount} brigadistas), controles viales PESV (Res. 20223040040595) y lecciones aprendidas de ATEL (Res. 1401/2007).',
        category: 'Vial / PESV',
        originModule: em.atelInvestigacionesCount > 0 ? 'Investigación ATEL' : 'Plan de Emergencias y Vulnerabilidad',
        impact: 'alto',
        responsible: 'Responsable SG-SST / Jefe de Brigada',
        status: 'Prioridad Inmediata',
      });
    }

    // PARTES INTERESADAS (STAKEHOLDERS CL. 4.2) CONECTADAS AL ECOSISTEMA 360°
    addStakeholderItem({
      parte: `Trabajadores y Colaboradores (${em.totalWorkers} activos · FIT Promedio ${em.avgFitScore || 85}%)`,
      type: 'Interno',
      necesidades:
        'Ambientes de trabajo seguros, compatibilidad ergonómica y médica cargo-persona (FIT Biocéntrico), dotación oportuna de EPP y formación continua en riesgos específicos.',
      expectativas:
        'Respeto a restricciones médico-laborales, bienestar psicosocial, participación activa en identificación de peligros IPEVR y cero accidentes laborales.',
      requisito: 'Dec. 1072/2015 Art. 2.2.4.6.10 · ISO 45001:2018 Cl. 4.2 y 5.4 · Res. 0312/2019',
      control:
        'Monitoreo de Huella Biocéntrica FIT, Estudios de Puesto de Trabajo, Termómetro de Ánimo y entrega controlada de EPP.',
      communicationChannel: 'Portal QR del Colaborador, Inducción, COPASST y Buzón de Participación IPEVR',
      frequency: 'Permanente',
      impactLevel: 'alto',
    });

    addStakeholderItem({
      parte: 'Alta Dirección y Representante Legal',
      type: 'Interno',
      necesidades:
        'Cumplimiento legal integral del SG-SST, prevención de sanciones del Ministerio del Trabajo, control de ausentismo y retorno de la inversión preventiva.',
      expectativas:
        'Sostenibilidad operativa, fortalecimiento de la reputación corporativa y cierre efectivo de las No Conformidades de Auditoría Interna.',
      requisito: 'Dec. 1072/2015 Art. 2.2.4.6.8 y 2.2.4.6.31 · ISO 45001:2018 Cl. 5.1 y 9.3',
      control:
        'Revisión anual por la Alta Dirección (24 elementos obligatorios), indicadores de estructura/proceso/resultado y presupuesto SST.',
      communicationChannel: 'Informe Ejecutivo de Revisión por la Dirección y Comité Gerencial',
      frequency: 'Trimestral',
      impactLevel: 'alto',
    });

    addStakeholderItem({
      parte: `ARL (${comp.arl || 'Administradora de Riesgos Laborales'}) y Aliados de Capacitación`,
      type: 'Externo',
      necesidades:
        'Reporte anual de autoevaluación de Estándares Mínimos (Res. 0312/2019), investigación oportuna de ATEL graves/mortales (Res. 1401/2007) y ejecución del Plan de Trabajo Anual.',
      expectativas:
        'Disminución de la tasa de accidentalidad, co-ejecución del Programa Anual de Capacitaciones y articulación en Programas de Vigilancia Epidemiológica.',
      requisito: 'Ley 1562 de 2012 · Res. 0312/2019 Art. 26 al 29 · Dec. 1072/2015',
      control:
        'Plan de Trabajo Anual, actas de asistencia técnica ARL y seguimiento al Programa de Capacitaciones.',
      communicationChannel: 'Mesas de trabajo ARL, plataforma virtual y reportes oficiales SST',
      frequency: 'Mensual',
      impactLevel: 'alto',
    });

    addStakeholderItem({
      parte: 'Auditores Internos, Ministerio del Trabajo y Entes de Control',
      type: 'Externo',
      necesidades:
        'Evidencia objetiva de cumplimiento normativo en Matriz Legal, Auditoría Interna anual (Art. 2.2.4.6.29), permisos de tareas de alto riesgo (Alturas/Químicos/PESV) y trazabilidad ACPM.',
      expectativas:
        'Transparencia documental, mejora continua del SG-SST y cero incumplimientos a normas de orden público laboral.',
      requisito: 'Dec. 1072/2015 Art. 2.2.4.6.29 · Res. 0312/2019 · ISO 45001:2018 Cl. 9.2',
      control:
        'Auditoría Interna anual, Matriz Legal actualizada y Centro de Control de Acciones Correctivas y Preventivas (ACPM).',
      communicationChannel: 'Informes de Auditoría Interna, actas de visita e inspección oficial',
      frequency: 'Semestral',
      impactLevel: 'alto',
    });

    addStakeholderItem({
      parte: 'COPASST / Vigía SST, Comité de Convivencia y Brigada de Emergencia',
      type: 'Interno',
      necesidades:
        'Tiempo reglamentario para funciones, capacitación especializada, participación en investigaciones ATEL, inspecciones planeadas y auditorías del SG-SST.',
      expectativas:
        'Escucha activa de recomendaciones preventivas, gestión del clima psicosocial y dotación para atención de emergencias.',
      requisito: 'Res. 2013/1986 · Res. 3461/2025 (Convivencia) · Dec. 1072/2015 Art. 2.2.4.6.25',
      control:
        'Actas mensuales de reunión de COPASST, reuniones trimestrales de Convivencia y simulacros de Brigada.',
      communicationChannel: 'Reuniones ordinarias de comités y módulo de Gobernanza Somos SST',
      frequency: 'Mensual',
      impactLevel: 'alto',
    });

    // Asegurar estrategias cruzadas si están vacías
    if (crossStrategies.fo.length === 0) {
      crossStrategies.fo.push(
        `Apalancar el liderazgo de la Alta Dirección y la compatibilidad biocéntrica FIT (${em.avgFitScore || 85}%) con la asistencia técnica de la ARL para certificar competencias críticas en el Programa de Capacitaciones.`
      );
    }
    if (crossStrategies.do.length === 0) {
      crossStrategies.do.push(
        `Cerrar las No Conformidades de Auditoría Interna (${em.auditoriaNoConformidades}) y brechas Res. 0312 (${em.diagnosticoGaps}) mediante herramientas digitales de seguimiento ACPM y apoyo especializado externo.`
      );
    }
    if (crossStrategies.fa.length === 0) {
      crossStrategies.fa.push(
        `Utilizar el control operativo de ATS, Permisos de Alturas y Gobernanza de Comités para blindar jurídicamente a la empresa frente a fiscalizaciones y riesgos viales/operativos.`
      );
    }
    if (crossStrategies.da.length === 0) {
      crossStrategies.da.push(
        `Intervenir de inmediato los peligros críticos GTC-45 (${em.peligrosCriticos}), alertas FIT médico-laborales (${em.workersWithFitAlerts}) y compromisos pendientes de Alta Dirección (${em.altaDireccionPendientes}) para prevenir siniestralidad ATEL.`
      );
    }

    await ContextoData.findOneAndUpdate(
      filter,
      {
        $set: {
          dofaList,
          stakeholders,
          crossStrategies,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const sourcesSynced = Array.from(sourcesSyncedSet);

    return res.json({
      success: true,
      dofaList,
      stakeholders,
      crossStrategies,
      ecosystemMetrics: em,
      addedDofaCount,
      addedStakeholdersCount,
      sourcesSynced,
      message:
        addedDofaCount + addedStakeholdersCount > 0
          ? `Sincronización 360° completada: +${addedDofaCount} factores DOFA y +${addedStakeholdersCount} partes interesadas integradas desde Auditoría, Alta Dirección, Capacitaciones, Compatibilidad Colaborador-Cargo y demás módulos Somos SST.`
          : 'El Contexto Organizacional ya se encuentra 100% sincronizado con los últimos hallazgos del ecosistema Somos SST.',
    });
  } catch (error) {
    logger.error('[SGSST Contexto] Error syncing ecosystem:', error);
    res.status(500).json({
      error: error.message || 'Error al sincronizar los hallazgos del ecosistema Somos SST.',
    });
  }
});

/**
 * POST /api/sgsst/contexto/generate-matrix
 * Recolecta la información de las 16 fuentes de la empresa y genera autónomamente con IA
 * la Matriz DOFA/PESTEL de SST, las partes interesadas (Stakeholders) y los cruces estratégicos.
 */
router.post('/generate-matrix', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { modelName } = req.body;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    // Recolectar la metodología integral de las 16 fuentes de la empresa
    const context = await gatherCompanyFullContext(userId, companyId);
    const comp = context.company || {};
    const em = context.ecosystemMetrics;

    const companyContextStr = buildCompanyContextString(comp);

    // 1. Resumen Diagnóstico 0312 y Matriz Legal
    const diagStr = context.diagnostico
      ? `Puntaje Res. 0312: ${em.diagnosticoScore}% · Nivel: ${em.diagnosticoLevel}. Brechas: ${em.diagnosticoGaps} (${context.diagnosticoGapItems.join(', ') || 'Ninguna crítica'}). Fortalezas 0312: ${context.diagnosticoStrengths.join(', ') || 'En evaluación'}.`
      : 'No se ha ejecutado autoevaluación de Estándares Mínimos (Res. 0312/2019).';
    const legalStr = `Matriz Legal SST: ${em.matrizLegalTotal} normas identificadas, ${em.matrizLegalPendientes} pendientes/en brecha (${context.matrizLegalGapItems.join(', ') || 'Al día'}).`;

    // 2. Resumen Auditoría Interna (Dec. 1072 Art. 2.2.4.6.29) y Revisión por la Alta Dirección (Art. 2.2.4.6.31)
    const auditoriaStr = `Auditoría Interna SG-SST: Puntaje ${em.auditoriaScore}% · ${em.auditoriaNoConformidades} No Conformidades y ${em.auditoriaObservaciones} Observaciones Parciales. Hallazgos: ${context.auditoriaFindings.join(' | ') || 'Sin hallazgos críticos abiertos'}.`;
    const altaDirStr = `Revisión por la Alta Dirección: ${em.altaDireccionTotalItems} elementos evaluados (${em.altaDireccionCumple} conformes, ${em.altaDireccionPendientes} pendientes de decisión/recursos, ${em.altaDireccionInboxCount} reportes en bandeja gerencial). Pendientes: ${context.altaDireccionFindings.join(' | ') || 'Al día'}.`;

    // 3. Resumen Programa de Capacitaciones SST (Art. 2.2.4.6.11)
    const capStr = `Programa de Capacitaciones SST: ${em.capacitacionesTotal} sesiones (${em.capacitacionesCompletadas} completadas, ${em.capacitacionesPendientes} programadas · Cumplimiento: ${em.capacitacionesCompliancePct}%). Temas: ${context.capacitacionesDetails.join(' | ') || 'En estructuración'}.`;

    // 4. Resumen Compatibilidad Colaborador-Cargo / Huella Biocéntrica FIT
    const fitStr = `Trabajadores activos: ${em.totalWorkers} en ${em.totalCargos} perfiles de cargo (${context.cargosNames.join(', ') || 'Operativos/Administrativos'}). Índice de Compatibilidad Colaborador-Cargo (FIT Promedio): ${em.avgFitScore}%. Colaboradores con alertas/restricciones médicas de compatibilidad: ${em.workersWithFitAlerts}. Riesgos bio-individuales altos/críticos: ${em.bioRiesgosCriticos}. Detalle: ${context.workerFitDetails.slice(0, 5).join(' | ') || 'Sin restricciones críticas registradas'}.`;

    // 5. Resumen Peligros GTC-45, Participación IPEVR, PESV y Químicos SGA
    let peligrosStr = 'No se han registrado peligros en la matriz GTC-45 aún.';
    if (context.peligrosSummary.length > 0) {
      const topPeligros = context.peligrosSummary
        .slice(0, 8)
        .map(
          (p) =>
            `- [${p.proceso} - ${p.actividad}] ${p.clasificacion}: ${p.descripcion} (Riesgo: ${p.nivelRiesgo})`
        );
      peligrosStr = `Peligros GTC-45 (${em.totalPeligros} en total, ${em.peligrosCriticos} críticos/altos · ${em.participacionesIpevar} participaciones IPEVR de trabajadores):\n${topPeligros.join('\n')}`;
    }
    const pesvQuimicosStr = `Seguridad Vial PESV: ${em.pesvRiesgosCount} riesgos viales valorados y ${em.vehiculosCount} vehículos en flota (${context.pesvSummary.join(' | ') || 'Sin flota crítica'}). Sustancias Químicas SGA: ${em.quimicosCount} productos registrados con ${em.incompatibilidadesQuimicas} alertas de incompatibilidad (${context.quimicosSummary.join(', ') || 'N/A'}).`;

    // 6. Resumen Ergonomía OWAS / Estudios de Puesto, Clima Psicosocial, Operación Terreno y ATEL
    const ergoPsicoStr = `Ergonomía y Puestos de Trabajo: ${em.owasEvaluationsCount} evaluaciones OWAS (${em.owasCriticosCount} posturas críticas Cat. 3-4) y ${em.estudiosPuestoCount} Estudios de Puesto (${context.ergonomiaDetails.join(' | ') || 'En proceso'}). Clima Psicosocial (Termómetro de Ánimo): ${em.moodReportsCount} registros (${em.moodNegativeCount} alertas emocionales/estrés · Estresores: ${em.topStressors.join(', ') || 'Ninguno crítico'}).`;
    const terrenoAtelStr = `Operación Terreno: ${em.atsCount} ATS activos, ${em.permisosAlturasCount} registros de Trabajo en Alturas, ${em.eppEntregasCount} entregas de EPP (${em.eppSolicitudesPendientes} solicitudes pendientes). Reportes de Actos/Condiciones Inseguras: ${em.actosInsegurosCount} (${context.actosInsegurosDetails.slice(0, 3).join(' | ') || 'Sin reportes abiertos'}). Investigaciones ATEL: ${em.atelInvestigacionesCount} (${context.atelEventsSummary.join(' | ') || '0 accidentes investigados'}).`;

    // 7. Resumen Gobernanza, Comités, Vulnerabilidad y Control ACPM
    const comitesStr = `COPASST/Vigía: ${context.copasstMembersCount > 0 ? `Activo (${context.copasstMembersCount} miembros)` : 'Pendiente'}. Comité de Convivencia: ${context.convivenciaMembersCount > 0 ? `Activo (${context.convivenciaMembersCount} miembros)` : 'Pendiente'}. Brigada de Emergencia: ${context.brigadaCount} brigadistas. Amenazas de Vulnerabilidad: ${context.amenazasEmergencia.join(', ') || 'En evaluación'}. Tareas ACPM/Kanban: ${em.acpmTotal} (${em.acpmPending} pendientes).`;

    const promptText = `Eres el Especialista Sénior en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) de WAPPY, consultor experto en ISO 45001:2018 (Cláusulas 4.1 y 4.2), Decreto 1072 de 2015 (Art. 2.2.4.6.8, 2.2.4.6.11, 2.2.4.6.29 y 2.2.4.6.31) y Resolución 0312 de 2019 (Estándar 2.1.1) para Colombia.

Tu tarea es realizar un ANÁLISIS ESTRATÉGICO PROFUNDO 360° del contexto interno y externo de la empresa integrando OBLIGATORIAMENTE los hallazgos reales de TODAS las fuentes del ecosistema Somos SST que se detallan a continuación, y generar la Matriz DOFA/PESTEL de SST (12 a 16 factores equilibrados), las Partes Interesadas (Stakeholders, 7 a 9 actores) y los Cruces Estratégicos (FO, DO, FA, DA con 3 estrategias accionables por cuadrante).

=== 1. INFORMACIÓN REAL DE LA ORGANIZACIÓN ===
${companyContextStr}

=== 2. AUDITORÍA INTERNA SG-SST (DEC. 1072 ART. 2.2.4.6.29) Y REVISIÓN POR LA ALTA DIRECCIÓN (ART. 2.2.4.6.31) ===
${auditoriaStr}
${altaDirStr}

=== 3. PROGRAMA ANUAL DE CAPACITACIONES SST (ART. 2.2.4.6.11) ===
${capStr}

=== 4. COMPATIBILIDAD COLABORADOR-CARGO Y HUELLA BIOCÉNTRICA (FIT SCORE & RESTRICCIONES) ===
${fitStr}

=== 5. ESTÁNDARES MÍNIMOS (RES. 0312/2019) Y MATRIZ LEGAL ===
${diagStr}
${legalStr}

=== 6. PELIGROS GTC-45, PARTICIPACIÓN IPEVR, SEGURIDAD VIAL PESV Y QUÍMICOS SGA ===
${peligrosStr}
${pesvQuimicosStr}

=== 7. ERGONOMÍA (OWAS / ESTUDIOS DE PUESTO), CLIMA PSICOSOCIAL, OPERACIÓN TERRENO (ATS/ALTURAS/EPP) Y ATEL ===
${ergoPsicoStr}
${terrenoAtelStr}

=== 8. GOBERNANZA, COMITÉS, EMERGENCIAS Y CENTRO DE CONTROL ACPM ===
${comitesStr}

=== INSTRUCCIONES ESTRICTAS ===
1. Genera entre 12 y 16 factores en "dofaList" (mínimo 3-4 Fortalezas, 3-4 Debilidades, 3-4 Oportunidades y 3-4 Amenazas) 100% personalizados a la empresa (${comp.economicActivity || 'su sector'}), nivel de riesgo (${comp.riskLevel || 'III'}) y hallazgos reales.
2. DEBES incluir explícitamente factores derivados de:
   - Auditoría Interna SG-SST ("originModule": "Auditoría Interna 1072")
   - Revisión por la Alta Dirección ("originModule": "Revisión por la Alta Dirección")
   - Programa de Capacitaciones ("originModule": "Programa de Capacitaciones")
   - Compatibilidad Colaborador-Cargo / Huella Biocéntrica FIT ("originModule": "Compatibilidad Colaborador-Cargo")
   - Diagnóstico 0312 y Matriz Legal ("originModule": "Diagnóstico 0312" o "Matriz Legal")
   - Matriz IPEVR GTC-45 / PESV / Químicos ("originModule": "Matriz IPEVR GTC-45", "Seguridad Vial PESV" o "Compatibilidad Química SGA")
   - Ergonomía, Clima Psicosocial, Operación Terreno (ATS/Alturas/EPP) e Investigación ATEL ("originModule": "Ergonomía y Puestos de Trabajo", "Clima Psicosocial", "Operación Terreno (ATS/Alturas/EPP)" o "Investigación ATEL")
3. En cada ítem de "dofaList" incluye:
   - "type": "fortaleza" | "debilidad" | "oportunidad" | "amenaza"
   - "description": Redacción técnica, precisa y con datos reales del diagnóstico de la empresa.
   - "strategicAction": Plan de acción concreto para sostener, corregir, aprovechar o mitigar el factor.
   - "category": Una de: "Legal / Normativo", "Tecnológico / IA", "Operativo / Biomecánico", "Psicosocial / Cultura", "Vial / PESV", "Químico / Ambiental", "Financiero / Presupuesto", "Gobernanza / SST".
   - "originModule": Uno de: "Auditoría Interna 1072", "Revisión por la Alta Dirección", "Programa de Capacitaciones", "Compatibilidad Colaborador-Cargo", "Diagnóstico 0312", "Matriz Legal", "Matriz IPEVR GTC-45", "Seguridad Vial PESV", "Compatibilidad Química SGA", "Ergonomía y Puestos de Trabajo", "Clima Psicosocial", "Operación Terreno (ATS/Alturas/EPP)", "Actos y Condiciones Inseguras", "Investigación ATEL", "Comités y Brigada", "Plan de Emergencias y Vulnerabilidad", "Centro de Control ACPM".
   - "impact": "alto" | "medio" | "bajo"
   - "responsible": Cargo responsable sugerido.
   - "status": "En Plan de Acción" | "Monitoreo Permanente" | "Prioridad Inmediata"
4. En "stakeholders" (7 a 9 partes interesadas internas y externas conectadas con todas las áreas, incluyendo Trabajadores según Compatibilidad Cargo-Persona, Alta Dirección, Comité de Capacitación/ARL, Auditores Internos y Entes de Control, Contratistas/Proveedores, COPASST/Comité de Convivencia, Actores Viales/Comunidad) incluye:
   - "parte", "type" ("Interno" | "Externo"), "necesidades", "expectativas", "requisito", "control", "communicationChannel", "frequency", "impactLevel" ("alto" | "medio").
5. En "crossStrategies" incluye 3 estrategias accionables por cada cuadrante: "fo", "do", "fa", "da".

RESPONDE ÚNICA Y EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO SIN TEXTO ADICIONAL:
{
  "dofaList": [
    {
      "id": "dofa_1",
      "type": "fortaleza",
      "description": "...",
      "source": "interno",
      "impact": "alto",
      "strategicAction": "...",
      "category": "Gobernanza / SST",
      "originModule": "Auditoría Interna 1072",
      "responsible": "Responsable SG-SST",
      "status": "En Plan de Acción"
    }
  ],
  "stakeholders": [
    {
      "id": "stk_1",
      "parte": "Trabajadores Directos y Operativos (Compatibilidad Cargo-Persona)",
      "type": "Interno",
      "necesidades": "...",
      "expectativas": "...",
      "requisito": "Dec. 1072/2015 Art. 2.2.4.6.10 · ISO 45001 Cl. 5.4",
      "control": "...",
      "communicationChannel": "COPASST, Inducción y Portal QR Colaborador",
      "frequency": "Mensual",
      "impactLevel": "alto"
    }
  ],
  "crossStrategies": {
    "fo": ["...", "...", "..."],
    "do": ["...", "...", "..."],
    "fa": ["...", "...", "..."],
    "da": ["...", "...", "..."]
  }
}`;

    const modelToUse = modelName || 'gemini-2.5-flash';
    const result = await generateWithKeyRotation(modelToUse, userId, promptText);
    const response = await result.response;
    const rawText = response.text();

    let parsed;
    try {
      parsed = parseGeminiJson(rawText);
    } catch (parseErr) {
      logger.error('[SGSST Contexto] JSON parse error:', parseErr.message, 'Raw text:', rawText);
      return res.status(500).json({
        error: 'La IA no devolvió un formato JSON estructurado válido. Por favor, reintenta.',
      });
    }

    // Normalizar datos recibidos
    const dofaList = Array.isArray(parsed.dofaList)
      ? parsed.dofaList.map((item, idx) => {
          const cleanType = ['fortaleza', 'debilidad', 'oportunidad', 'amenaza'].includes(
            String(item.type || '').toLowerCase()
          )
            ? String(item.type).toLowerCase()
            : 'fortaleza';
          return {
            id: item.id || `dofa_${Date.now()}_${idx}`,
            type: cleanType,
            description: item.description || '',
            source: cleanType === 'fortaleza' || cleanType === 'debilidad' ? 'interno' : 'externo',
            impact: ['alto', 'medio', 'bajo'].includes(String(item.impact || '').toLowerCase())
              ? String(item.impact).toLowerCase()
              : 'alto',
            strategicAction: item.strategicAction || '',
            category: item.category || 'Gobernanza / SST',
            originModule: item.originModule || 'Contexto Organizacional',
            responsible: item.responsible || 'Responsable SG-SST',
            status: item.status || 'En Plan de Acción',
            sentToKanban: Boolean(item.sentToKanban),
          };
        })
      : [];

    const stakeholders = Array.isArray(parsed.stakeholders)
      ? parsed.stakeholders.map((item, idx) => ({
          id: item.id || `stk_${Date.now()}_${idx}`,
          parte: item.parte || '',
          type: item.type === 'Externo' || item.type === 'externo' ? 'Externo' : 'Interno',
          necesidades: item.necesidades || '',
          expectativas: item.expectativas || '',
          requisito: item.requisito || 'ISO 45001:2018 Cl. 4.2 · Dec. 1072/2015',
          control: item.control || 'Seguimiento en comités y auditorías periódicas',
          communicationChannel:
            item.communicationChannel || 'Comités SST / Cartelera Digital WAPPY',
          frequency: item.frequency || 'Mensual',
          impactLevel: String(item.impactLevel || 'alto').toLowerCase(),
        }))
      : [];

    const crossStrategies = {
      fo: Array.isArray(parsed.crossStrategies?.fo) ? parsed.crossStrategies.fo : [],
      do: Array.isArray(parsed.crossStrategies?.do) ? parsed.crossStrategies.do : [],
      fa: Array.isArray(parsed.crossStrategies?.fa) ? parsed.crossStrategies.fa : [],
      da: Array.isArray(parsed.crossStrategies?.da) ? parsed.crossStrategies.da : [],
    };

    // Guardar automáticamente en BD para este usuario y empresa
    await ContextoData.findOneAndUpdate(
      { user: userId, ...(companyId ? { companyId } : {}) },
      {
        $set: {
          dofaList,
          stakeholders,
          crossStrategies,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      dofaList,
      stakeholders,
      crossStrategies,
      ecosystemMetrics: context.ecosystemMetrics,
      message:
        'Matriz DOFA/PESTEL, Partes Interesadas y Cruces Estratégicos generados exitosamente integrando las 16 fuentes del Ecosistema Somos SST.',
    });
  } catch (error) {
    logger.error('[SGSST Contexto] Error generating matrix with AI:', error);
    res.status(500).json({ error: error.message || 'Error al compilar la matriz con IA.' });
  }
});

/**
 * POST /api/sgsst/contexto/suggest-item
 * Asistente IA granular para autocompletar/enriquecer un factor DOFA, un Stakeholder o regenerar Cruces Estratégicos.
 */
router.post('/suggest-item', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mode = 'dofa', inputData = {}, dofaList = [], modelName } = req.body;
    const company = await getActiveCompany(userId);
    const companyContextStr = buildCompanyContextString(company || {});
    const modelToUse = modelName || 'gemini-2.5-flash';

    if (mode === 'dofa') {
      const factorType = inputData.type || 'fortaleza';
      const userDraft = inputData.description || '';
      const categoryHint = inputData.category || 'Gobernanza / SST';
      const originHint = inputData.originModule || 'Contexto Organizacional';

      const prompt = `Eres un Consultor Sénior SG-SST experto en ISO 45001:2018 (Cláusula 4.1) y Decreto 1072 de 2015 en Colombia.
Contexto de la empresa:
${companyContextStr}

El usuario desea redactar o enriquecer un factor de la Matriz DOFA/PESTEL de tipo "${factorType.toUpperCase()}" en la dimensión "${categoryHint}" (Módulo origen: "${originHint}").
Borrador o idea inicial del usuario: "${userDraft || 'Sugerir un factor estratégico clave articulado con Auditoría, Alta Dirección, Capacitaciones o Compatibilidad Colaborador-Cargo'}"

Devuelve ÚNICAMENTE un objeto JSON válido con la versión enriquecida, técnica y accionable:
{
  "item": {
    "type": "${factorType}",
    "description": "Descripción técnica, precisa y contextualizada en SST...",
    "strategicAction": "Plan o medida concreta de acción en el SG-SST...",
    "category": "${categoryHint}",
    "originModule": "${originHint}",
    "impact": "alto",
    "responsible": "Responsable SG-SST",
    "status": "En Plan de Acción"
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      return res.json({ success: true, item: parsed.item || parsed });
    }

    if (mode === 'stakeholder') {
      const parteName = inputData.parte || 'Trabajadores y Colaboradores';
      const prompt = `Eres un Consultor Sénior SG-SST experto en ISO 45001:2018 (Cláusula 4.2) y legislación laboral colombiana.
Contexto de la empresa:
${companyContextStr}

Completa con rigor técnico y normativo la matriz de Parte Interesada para el actor: "${parteName}".
Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura:
{
  "item": {
    "parte": "${parteName}",
    "type": "Interno",
    "necesidades": "Requisitos legales y técnicos obligatorios...",
    "expectativas": "Expectativas legítimas en seguridad, salud y continuidad...",
    "requisito": "Citación normativa exacta de Colombia (ej. Dec. 1072/2015 Art. 2.2.4.6.8, Res. 0312/2019, ISO 45001 Cl. 4.2)",
    "control": "Mecanismo operativo de control y evidencia en el SG-SST...",
    "communicationChannel": "Canal formal de comunicación y consulta...",
    "frequency": "Mensual",
    "impactLevel": "alto"
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      return res.json({ success: true, item: parsed.item || parsed });
    }

    if (mode === 'strategies') {
      const summaryDofa = Array.isArray(dofaList)
        ? dofaList
            .map(
              (d) =>
                `[${String(d.type).toUpperCase()} · ${d.originModule || 'SST'}] ${d.description}`
            )
            .join('\n')
        : '';
      const prompt = `Eres un Consultor Sénior SG-SST experto en Planificación Estratégica ISO 45001:2018.
Contexto de la empresa:
${companyContextStr}

Factores DOFA actuales de la organización:
${summaryDofa || 'Empresa en proceso de consolidación de su SG-SST.'}

Formula entre 2 y 3 estrategias cruzadas altamente concretas y accionables por cada cuadrante (FO, DO, FA, DA) articulando Auditoría, Alta Dirección, Capacitaciones, Compatibilidad Colaborador-Cargo y Control Operativo.
Devuelve ÚNICAMENTE un objeto JSON válido:
{
  "crossStrategies": {
    "fo": ["Estrategia FO 1...", "Estrategia FO 2..."],
    "do": ["Estrategia DO 1...", "Estrategia DO 2..."],
    "fa": ["Estrategia FA 1...", "Estrategia FA 2..."],
    "da": ["Estrategia DA 1...", "Estrategia DA 2..."]
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      return res.json({
        success: true,
        crossStrategies: parsed.crossStrategies || parsed,
      });
    }

    return res.status(400).json({ error: 'Modo de sugerencia no válido.' });
  } catch (error) {
    logger.error('[SGSST Contexto] Error in suggest-item:', error);
    res.status(500).json({ error: error.message || 'Error al generar sugerencia con IA.' });
  }
});

/**
 * POST /api/sgsst/contexto/send-to-oportunidades
 * Articula el Contexto Organizacional (ISO 45001 Cl. 4.1 y 4.2) con el aplicativo
 * "Riesgos del Sistema y Oportunidades SST" (ISO 45001 Cl. 6.1.1 y 6.1.2.3).
 */
router.post('/send-to-oportunidades', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req.user);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const contextoDoc = await ContextoData.findOne(filter).lean();
    const dofaList = Array.isArray(req.body.dofaList)
      ? req.body.dofaList
      : contextoDoc?.dofaList || [];
    const stakeholders = Array.isArray(req.body.stakeholders)
      ? req.body.stakeholders
      : contextoDoc?.stakeholders || [];
    const crossStrategies = req.body.crossStrategies || contextoDoc?.crossStrategies || {};

    let oportDoc = await OportunidadesData.findOne(filter);
    if (!oportDoc) {
      oportDoc = new OportunidadesData({
        user: userId,
        companyId,
        oportunidades: [],
        riesgosSistema: [],
      });
    }

    const norm = (str) => String(str || '').trim().toLowerCase();
    const existingOpTitles = new Set(oportDoc.oportunidades.map((o) => norm(o.titulo)));
    const existingRiskTitles = new Set(oportDoc.riesgosSistema.map((r) => norm(r.amenaza)));

    let addedOportunidades = 0;
    let addedRiesgos = 0;

    // 1. Oportunidades DOFA -> Oportunidades de SST (Cl. 6.1.2.3)
    for (const item of dofaList) {
      if (item.type === 'oportunidad' && item.description) {
        const key = norm(item.description);
        if (!existingOpTitles.has(key)) {
          oportDoc.oportunidades.push({
            id: `op_ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            titulo: item.description,
            categoria: item.category || 'Entorno Externo / Innovación SST',
            origenSst: `Contexto DOFA (${item.originModule || 'Oportunidad Externa'})`,
            beneficioEsperado:
              item.strategicAction ||
              'Fortalecimiento de la prevención de ATEL y mejora continua del SG-SST.',
            impactoPrioridad:
              String(item.impact || 'alto').toLowerCase() === 'alto' ? 'Alto' : 'Medio',
            viabilidad: 'Alta',
            recursosRequeridos: 'Gestión SG-SST / Alianzas ARL',
            indicadorExito: '100% de ejecución del plan estratégico asociado',
            responsable: item.responsible || 'Responsable SG-SST',
            plazo: 'Mediano Plazo (3-6 meses)',
            estado: 'Planificada',
          });
          existingOpTitles.add(key);
          addedOportunidades++;
        }
      } else if ((item.type === 'amenaza' || item.type === 'debilidad') && item.description) {
        const key = norm(item.description);
        if (!existingRiskTitles.has(key)) {
          const isHigh = String(item.impact || 'alto').toLowerCase() === 'alto';
          oportDoc.riesgosSistema.push({
            id: `rs_ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            amenaza: item.description,
            fuenteContexto: `Contexto DOFA (${item.originModule || (item.type === 'amenaza' ? 'Amenaza Externa' : 'Debilidad Interna')} · ${item.category || 'SST'})`,
            impactoSistema: isHigh ? 'Alto' : 'Medio',
            probabilidad: item.type === 'debilidad' ? 'Alta' : 'Media',
            nivelRiesgo: isHigh ? 'Crítico' : 'Alto',
            controlExistente: 'Seguimiento periódico en SG-SST',
            medidaMitigacion:
              item.strategicAction ||
              'Implementar control operativo y seguimiento en el Plan de Trabajo Anual.',
            responsableMonitoreo: item.responsible || 'Responsable SG-SST',
            plazo: isHigh ? 'Inmediato (30 días)' : 'Corto Plazo (1-3 meses)',
            estadoControl: 'En Tratamiento',
          });
          existingRiskTitles.add(key);
          addedRiesgos++;
        }
      }
    }

    // 2. Estrategias FO / DO -> Oportunidades de Mejora SST
    const foStrategies = [
      ...(Array.isArray(crossStrategies.fo) ? crossStrategies.fo : []),
      ...(Array.isArray(crossStrategies.do) ? crossStrategies.do : []),
    ];
    for (const strat of foStrategies) {
      const cleanStrat = String(strat || '').trim();
      if (cleanStrat && !existingOpTitles.has(norm(cleanStrat))) {
        oportDoc.oportunidades.push({
          id: `op_strat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          titulo: cleanStrat,
          categoria: 'Estrategia Cruzada FO/DO',
          origenSst: 'Cruces Estratégicos del Contexto (Cl. 4.1)',
          beneficioEsperado:
            'Aprovechamiento de fortalezas y oportunidades para elevar la madurez SST.',
          impactoPrioridad: 'Alto',
          viabilidad: 'Alta',
          recursosRequeridos: 'Plan de Trabajo Anual SG-SST',
          indicadorExito: 'Estrategia implementada y verificada en revisión gerencial',
          responsable: 'Responsable SG-SST',
          plazo: 'Mediano Plazo (3-6 meses)',
          estado: 'Planificada',
        });
        existingOpTitles.add(norm(cleanStrat));
        addedOportunidades++;
      }
    }

    // 3. Partes Interesadas de Alto Impacto -> Riesgos Legales/Contractuales del Sistema
    for (const stk of stakeholders) {
      if (String(stk.impactLevel || 'alto').toLowerCase() === 'alto' && stk.necesidades) {
        const riskTitle = `Incumplimiento de requisitos de ${stk.parte}: ${stk.necesidades}`;
        if (!existingRiskTitles.has(norm(riskTitle))) {
          oportDoc.riesgosSistema.push({
            id: `rs_stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            amenaza: riskTitle,
            fuenteContexto: `Parte Interesada ${stk.type || 'Pertinente'} (${stk.requisito || 'Cl. 4.2'})`,
            impactoSistema: 'Alto',
            probabilidad: 'Media',
            nivelRiesgo: 'Alto',
            controlExistente: stk.control || 'Monitoreo normativo',
            medidaMitigacion: `Garantizar cumplimiento mediante ${stk.control || 'control documental'} y comunicación vía ${stk.communicationChannel || 'canales oficiales'} (${stk.frequency || 'Mensual'}).`,
            responsableMonitoreo: 'Responsable SG-SST',
            plazo: 'Corto Plazo (1-3 meses)',
            estadoControl: 'Monitoreado',
          });
          existingRiskTitles.add(norm(riskTitle));
          addedRiesgos++;
        }
      }
    }

    oportDoc.updatedAt = new Date();
    await oportDoc.save();

    return res.json({
      success: true,
      addedOportunidades,
      addedRiesgos,
      totalOportunidades: oportDoc.oportunidades.length,
      totalRiesgos: oportDoc.riesgosSistema.length,
      message: `Sincronización exitosa con Riesgos del Sistema y Oportunidades SST: +${addedOportunidades} oportunidades y +${addedRiesgos} riesgos estratégicos articulados.`,
    });
  } catch (error) {
    logger.error('[SGSST Contexto] Error syncing to Oportunidades:', error);
    res.status(500).json({ error: 'Error al articular con Oportunidades y Riesgos del Sistema.' });
  }
});

/**
 * POST /api/sgsst/contexto/send-to-kanban
 * Envía una acción estratégica del Contexto o Parte Interesada directamente al Centro de Control Kanban / ACPM.
 */
router.post('/send-to-kanban', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id ? String(company._id) : undefined;

    const {
      title,
      description,
      priority = 'alta',
      actionType = 'preventiva',
      assignedTo = 'Responsable SG-SST',
      referenceId,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'El título de la acción estratégica es obligatorio.' });
    }

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    let task = null;
    if (referenceId) {
      task = await KanbanTask.findOne({
        user: userId,
        ...(companyId ? { companyId } : {}),
        referenceId: String(referenceId),
      });
    }

    if (task) {
      task.title = String(title).trim();
      task.description = String(description || '').trim();
      task.priority = priority;
      task.actionType = actionType;
      task.assignedTo = assignedTo;
      await task.save();
    } else {
      task = await KanbanTask.create({
        user: userId,
        companyId,
        title: String(title).trim(),
        description: String(description || '').trim(),
        status: 'todo',
        dueDate,
        type: 'other',
        priority: ['alta', 'media', 'baja', 'high', 'medium', 'low'].includes(priority)
          ? priority
          : 'alta',
        actionType: ['correctiva', 'preventiva', 'mejora'].includes(actionType)
          ? actionType
          : 'preventiva',
        sourceModule: 'Contexto y Partes Interesadas (ISO 45001 Cl. 4.1/4.2)',
        assignedTo,
        referenceId: referenceId ? String(referenceId) : `ctx_${Date.now()}`,
        referenceName: 'Contexto de la Organización',
      });
    }

    // Marcar sentToKanban en ContextoData si coincide con un ítem DOFA
    if (referenceId) {
      const ctxDoc = await ContextoData.findOne({
        user: userId,
        ...(company?._id ? { companyId: company._id } : {}),
      });
      if (ctxDoc && Array.isArray(ctxDoc.dofaList)) {
        let touched = false;
        ctxDoc.dofaList.forEach((d) => {
          if (d.id === referenceId) {
            d.sentToKanban = true;
            touched = true;
          }
        });
        if (touched) {
          ctxDoc.markModified('dofaList');
          await ctxDoc.save();
        }
      }
    }

    return res.json({
      success: true,
      task,
      message: `Acción "${task.title}" enviada al Centro de Control Kanban / ACPM.`,
    });
  } catch (error) {
    logger.error('[SGSST Contexto] Error sending to Kanban:', error);
    res.status(500).json({ error: 'Error al crear tarea en el Centro de Control Kanban.' });
  }
});

/**
 * POST /api/sgsst/contexto/generate-report
 * Construye el informe corporativo estandarizado con:
 * - Encabezado corporativo oficial WAPPY (buildStandardHeader) con logo y tabla 4x4
 * - Resumen de Articulación con las 16 Fuentes del Ecosistema 360° Somos SST
 * - Tablas estilizadas con estilos inline hexadecimales planos para DOFA/PESTEL, Estrategias Cruzadas y Partes Interesadas
 * - Sección oficial de tres firmas digitales (buildSignatureSection)
 */
router.post('/generate-report', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req.user);
    const context = await gatherCompanyFullContext(userId, companyId);
    const em = context.ecosystemMetrics;

    const { dofaList = [], stakeholders = [], crossStrategies = {} } = req.body;

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 1. Construir Encabezado Oficial Estándar
    const headerHtml = buildStandardHeader({
      title:
        'ESTUDIO DEL CONTEXTO ORGANIZACIONAL Y PARTES INTERESADAS (DOFA / PESTEL / STAKEHOLDERS)',
      companyInfo: company,
      date: currentDate,
      norm: 'ISO 45001:2018 Cláusulas 4.1 y 4.2 · Dec. 1072/2015 Art. 2.2.4.6.8, 2.2.4.6.29 y 2.2.4.6.31 · Res. 0312/2019 Est. 2.1.1',
      responsibleName: req.user?.name,
    });

    // 2. Construir Bloques DOFA
    const fortalezas = dofaList.filter((d) => d.type === 'fortaleza');
    const debilidades = dofaList.filter((d) => d.type === 'debilidad');
    const oportunidades = dofaList.filter((d) => d.type === 'oportunidad');
    const amenazas = dofaList.filter((d) => d.type === 'amenaza');

    const renderList = (items, accentColor, emptyMsg) => {
      if (!items || items.length === 0) {
        return `<li style="color: #94a3b8; font-style: italic;">${emptyMsg}</li>`;
      }
      return items
        .map(
          (i) => `
        <li style="margin-bottom: 10px; line-height: 1.5; color: #1e293b;">
          <strong>${i.description}</strong>
          <div style="font-size: 10px; color: #475569; margin-top: 2px;">
            <strong>Dimensión:</strong> ${i.category || 'Gobernanza / SST'} · <strong>Módulo Origen:</strong> ${i.originModule || 'Contexto'} · <strong>Impacto:</strong> ${String(i.impact || 'Alto').toUpperCase()} · <strong>Responsable:</strong> ${i.responsible || 'Responsable SG-SST'}
          </div>
          ${i.strategicAction ? `<div style="font-size: 11px; color: ${accentColor}; margin-top: 3px;">➔ <em>Plan de Acción:</em> ${i.strategicAction}</div>` : ''}
        </li>`
        )
        .join('');
    };

    // 3. Filas de Partes Interesadas
    const stakeholderRows =
      stakeholders.length > 0
        ? stakeholders
            .map(
              (s, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 11px; color: #1e293b;">
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e; vertical-align: top;">
            ${s.parte}
            <div style="font-size: 9.5px; font-weight: normal; color: #64748b; margin-top: 3px;">
              Tipo: <strong>${s.type || 'Interno'}</strong> · Impacto: <strong>${String(s.impactLevel || 'Alto').toUpperCase()}</strong>
            </div>
          </td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${s.necesidades}</td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${s.expectativas || 'Cumplimiento normativo y estándares de SST.'}</td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top; color: #334155; font-weight: 600;">${s.requisito || 'ISO 45001 / Dec. 1072'}</td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top;">
            ${s.control || 'Monitoreo y comités'}
            <div style="font-size: 9.5px; color: #0f766e; margin-top: 3px;">
              <strong>Canal:</strong> ${s.communicationChannel || 'Comités SST'} (${s.frequency || 'Mensual'})
            </div>
          </td>
        </tr>`
            )
            .join('')
        : `<tr><td colspan="5" style="padding: 14px; text-align: center; color: #94a3b8; border: 1px solid #cbd5e1;">No se registraron partes interesadas</td></tr>`;

    // 4. Filas de Estrategias Cruzadas
    const foList =
      (crossStrategies?.fo || []).map((e) => `<li style="margin-bottom: 6px;">${e}</li>`).join('') ||
      '<li style="color:#94a3b8;font-style:italic;">No formuladas</li>';
    const doList =
      (crossStrategies?.do || []).map((e) => `<li style="margin-bottom: 6px;">${e}</li>`).join('') ||
      '<li style="color:#94a3b8;font-style:italic;">No formuladas</li>';
    const faList =
      (crossStrategies?.fa || []).map((e) => `<li style="margin-bottom: 6px;">${e}</li>`).join('') ||
      '<li style="color:#94a3b8;font-style:italic;">No formuladas</li>';
    const daList =
      (crossStrategies?.da || []).map((e) => `<li style="margin-bottom: 6px;">${e}</li>`).join('') ||
      '<li style="color:#94a3b8;font-style:italic;">No formuladas</li>';

    // 5. Ensamblar Cuerpo Completo del Informe con Estilos Planos compatibles con Word/PDF
    const reportBody = `
<div style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; line-height: 1.6; max-width: 100%;">

  <!-- 1. OBJETO Y ALCANCE NORMATIVO -->
  <div style="margin-bottom: 22px; padding: 14px 18px; background-color: #f0fdfa; border-left: 4px solid #0f766e;">
    <h3 style="margin: 0 0 6px 0; color: #0f766e; font-size: 13.5px; font-weight: 800; text-transform: uppercase;">
      1. Objeto y Alcance del Diagnóstico Organizacional 360°
    </h3>
    <p style="margin: 0; font-size: 11.5px; color: #334155; line-height: 1.5;">
      El presente estudio técnico establece la comprensión integral del contexto interno y externo de <strong>${company?.companyName || 'la Organización'}</strong> conforme a los requerimientos de la norma internacional <strong>ISO 45001:2018 (Cláusulas 4.1 y 4.2)</strong>, articulados con el <strong>Decreto 1072 de 2015 (Art. 2.2.4.6.8, 2.2.4.6.11, 2.2.4.6.29 y 2.2.4.6.31)</strong> y los Estándares Mínimos de la <strong>Resolución 0312 de 2019 (Estándar 2.1.1)</strong>. Sus hallazgos integran en tiempo real la Auditoría Interna, la Revisión por la Alta Dirección, el Programa de Capacitaciones, la Compatibilidad Colaborador-Cargo (FIT Biocéntrico) y todos los módulos operativos de Somos SST, constituyendo el insumo de entrada obligatorio para la determinación de Riesgos y Oportunidades del SG-SST (Cláusula 6.1).
    </p>
  </div>

  <!-- 2. METODOLOGÍA DE DIAGNÓSTICO Y FUENTES DEL ECOSISTEMA 360° SOMOS SST -->
  <div style="margin-bottom: 24px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      2. Metodología de Diagnóstico y Fuentes del Ecosistema 360° Somos SST
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1; margin-bottom: 12px;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px 10px; border: 1px solid #0f766e; text-align: left; width: 26%;">Módulo Fuente Somos SST</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; text-align: left; width: 34%;">Indicador Consolidado en Tiempo Real</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; text-align: left; width: 40%;">Incidencia en el Contexto (Cl. 4.1 / 4.2 / 6.1)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background-color: #ffffff;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Auditoría Interna SG-SST (Dec. 1072 Art. 2.2.4.6.29)</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Cumplimiento: <strong>${em.auditoriaScore}%</strong> · No Conformidades: <strong>${em.auditoriaNoConformidades}</strong> · Observaciones: <strong>${em.auditoriaObservaciones}</strong></td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Identifica debilidades estructurales del sistema y alimenta acciones correctivas prioritarias.</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Revisión por la Alta Dirección (Art. 2.2.4.6.31)</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Ítems conformes: <strong>${em.altaDireccionCumple}/${em.altaDireccionTotalItems}</strong> · Pendientes gerenciales: <strong>${em.altaDireccionPendientes}</strong></td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Define el liderazgo ejecutivo, asignación presupuestal y directrices estratégicas del SG-SST.</td>
        </tr>
        <tr style="background-color: #ffffff;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Programa de Capacitaciones SST (Art. 2.2.4.6.11)</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Avance: <strong>${em.capacitacionesCompliancePct}%</strong> (<strong>${em.capacitacionesCompletadas}</strong> completadas / <strong>${em.capacitacionesPendientes}</strong> programadas)</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Fortalece competencias preventivas por cargo y mitiga actos inseguros por desconocimiento.</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Compatibilidad Colaborador-Cargo (Huella FIT)</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><strong>${em.totalWorkers}</strong> trabajadores en <strong>${em.totalCargos}</strong> cargos · FIT Promedio: <strong>${em.avgFitScore}%</strong> · Alertas FIT: <strong>${em.workersWithFitAlerts}</strong> · Riesgos Bio Críticos: <strong>${em.bioRiesgosCriticos}</strong></td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Determina la aptitud biopsicosocial cargo-persona, restricciones médicas y expectativas de los trabajadores (Cl. 4.2).</td>
        </tr>
        <tr style="background-color: #ffffff;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Autoevaluación Res. 0312/2019 y Matriz Legal</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Puntaje 0312: <strong>${em.diagnosticoScore}%</strong> (${em.diagnosticoLevel}) · Brechas 0312: <strong>${em.diagnosticoGaps}</strong> · Normas pendientes: <strong>${em.matrizLegalPendientes}/${em.matrizLegalTotal}</strong></td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Establece el nivel de cumplimiento normativo y los riesgos legales ante el Ministerio del Trabajo.</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Matriz IPEVR GTC-45, PESV y Químicos SGA</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Peligros GTC-45: <strong>${em.totalPeligros}</strong> (<strong>${em.peligrosCriticos}</strong> críticos) · Riesgos PESV: <strong>${em.pesvRiesgosCount}</strong> (${em.vehiculosCount} vehículos) · Químicos SGA: <strong>${em.quimicosCount}</strong></td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Alimenta las condiciones operativas internas, controles de ingeniería, seguridad vial y almacenamiento químico.</td>
        </tr>
        <tr style="background-color: #ffffff;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Ergonomía (OWAS / Puestos) y Clima Psicosocial</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">OWAS: <strong>${em.owasEvaluationsCount}</strong> (<strong>${em.owasCriticosCount}</strong> críticos) · Estudios Puesto: <strong>${em.estudiosPuestoCount}</strong> · Ánimo: <strong>${em.moodNegativeCount}/${em.moodReportsCount}</strong> alertas</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Orienta los Programas de Vigilancia Epidemiológica Osteomuscular (DME) y Psicosocial.</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Operación Terreno (ATS/Alturas/EPP), Actos y ATEL</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">ATS: <strong>${em.atsCount}</strong> · Alturas: <strong>${em.permisosAlturasCount}</strong> · EPP: <strong>${em.eppEntregasCount}</strong> (${em.eppSolicitudesPendientes} pend.) · Actos: <strong>${em.actosInsegurosCount}</strong> · ATEL: <strong>${em.atelInvestigacionesCount}</strong></td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Controla tareas de alto riesgo en tiempo real y convierte incidentes en lecciones aprendidas.</td>
        </tr>
        <tr style="background-color: #ffffff;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Gobernanza, Vulnerabilidad y Centro ACPM</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Comités: <strong>${em.comitesActivos}</strong> · Brigadistas: <strong>${em.brigadistasCount}</strong> · Amenazas: <strong>${em.amenazasVulnerabilidadCount}</strong> · ACPM abiertas: <strong>${em.acpmPending}/${em.acpmTotal}</strong></td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Mide la capacidad de participación bipartita, preparación ante emergencias y cierre de planes de acción.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 3. MATRIZ DOFA DE SEGURIDAD Y SALUD EN EL TRABAJO -->
  <div style="margin-bottom: 26px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 12px;">
      3. Matriz DOFA / PESTEL de Seguridad y Salud en el Trabajo (Cláusula 4.1)
    </h3>

    <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 14px;">
      <tr>
        <!-- FORTALEZAS -->
        <td style="width: 50%; vertical-align: top; background-color: #ffffff; border: 2px solid #059669; padding: 14px;">
          <div style="border-bottom: 2px solid #059669; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase;">
              FORTALEZAS (FACTORES INTERNOS · ${fortalezas.length})
            </span>
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px;">
            ${renderList(fortalezas, '#059669', 'No se registraron fortalezas')}
          </ul>
        </td>

        <!-- OPORTUNIDADES -->
        <td style="width: 50%; vertical-align: top; background-color: #ffffff; border: 2px solid #0284c7; padding: 14px;">
          <div style="border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #0284c7; text-transform: uppercase;">
              OPORTUNIDADES (FACTORES EXTERNOS · ${oportunidades.length})
            </span>
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px;">
            ${renderList(oportunidades, '#0284c7', 'No se registraron oportunidades')}
          </ul>
        </td>
      </tr>

      <tr>
        <!-- DEBILIDADES -->
        <td style="width: 50%; vertical-align: top; background-color: #ffffff; border: 2px solid #d97706; padding: 14px;">
          <div style="border-bottom: 2px solid #d97706; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #d97706; text-transform: uppercase;">
              DEBILIDADES (FACTORES INTERNOS · ${debilidades.length})
            </span>
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px;">
            ${renderList(debilidades, '#d97706', 'No se registraron debilidades')}
          </ul>
        </td>

        <!-- AMENAZAS -->
        <td style="width: 50%; vertical-align: top; background-color: #ffffff; border: 2px solid #dc2626; padding: 14px;">
          <div style="border-bottom: 2px solid #dc2626; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #dc2626; text-transform: uppercase;">
              AMENAZAS (FACTORES EXTERNOS · ${amenazas.length})
            </span>
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px;">
            ${renderList(amenazas, '#dc2626', 'No se registraron amenazas')}
          </ul>
        </td>
      </tr>
    </table>
  </div>

  <!-- 4. MATRIZ DE ESTRATEGIAS CRUZADAS (FO, DO, FA, DA) -->
  <div style="margin-bottom: 26px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 12px;">
      4. Cruces Estratégicos de SST (Articulación con Cláusula 6.1)
    </h3>
    <table style="width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #cbd5e1;">
      <tr>
        <td style="width: 50%; vertical-align: top; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #0f766e; font-size: 11.5px; font-weight: 800; text-transform: uppercase;">
            Estrategias Ofensivas FO (Fortalezas + Oportunidades)
          </h4>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #1e293b;">
            ${foList}
          </ul>
        </td>

        <td style="width: 50%; vertical-align: top; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #0284c7; font-size: 11.5px; font-weight: 800; text-transform: uppercase;">
            Estrategias Reorientadoras DO (Debilidades + Oportunidades)
          </h4>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #1e293b;">
            ${doList}
          </ul>
        </td>
      </tr>

      <tr>
        <td style="width: 50%; vertical-align: top; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #d97706; font-size: 11.5px; font-weight: 800; text-transform: uppercase;">
            Estrategias Defensivas FA (Fortalezas + Amenazas)
          </h4>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #1e293b;">
            ${faList}
          </ul>
        </td>

        <td style="width: 50%; vertical-align: top; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #dc2626; font-size: 11.5px; font-weight: 800; text-transform: uppercase;">
            Estrategias de Supervivencia DA (Debilidades + Amenazas)
          </h4>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #1e293b;">
            ${daList}
          </ul>
        </td>
      </tr>
    </table>
  </div>

  <!-- 5. MATRIZ DE PARTES INTERESADAS (CLÁUSULA 4.2) -->
  <div style="margin-bottom: 26px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 12px;">
      5. Matriz de Partes Interesadas y Requisitos Legales de SST (Cláusula 4.2)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 20%; text-align: left;">Parte Interesada</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 22%; text-align: left;">Necesidades (Obligatorias)</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 20%; text-align: left;">Expectativas</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 16%; text-align: left;">Marco Jurídico</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 22%; text-align: left;">Control y Canal de Participación</th>
        </tr>
      </thead>
      <tbody>
        ${stakeholderRows}
      </tbody>
    </table>
  </div>

  <!-- 6. GOBERNANZA Y SEGUIMIENTO -->
  <div style="margin-bottom: 30px; padding: 14px 18px; background-color: #f8fafc; border: 1px solid #cbd5e1;">
    <h3 style="margin: 0 0 6px 0; color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase;">
      6. Articulación con Riesgos del Sistema, Plan de Trabajo Anual y Revisión Gerencial
    </h3>
    <p style="margin: 0; font-size: 11.5px; color: #475569; line-height: 1.5;">
      El presente estudio de contexto será revisado de forma ordinaria al menos una vez al año en la Revisión por la Alta Dirección (Dec. 1072/2015 Art. 2.2.4.6.31), o de manera extraordinaria ante hallazgos de Auditoría Interna (Art. 2.2.4.6.29), variaciones en la Compatibilidad Colaborador-Cargo (FIT) o cambios normativos. Sus hallazgos alimentan directamente el módulo de <strong>Riesgos del Sistema y Oportunidades SST (ISO 45001 Cl. 6.1)</strong> y el <strong>Centro de Control ACPM</strong>.
    </p>
  </div>

</div>
`;

    // 6. Ensamblar con Firmas Digitales Oficiales
    let signaturesHtml = '';
    if (company) {
      signaturesHtml = buildSignatureSection(company);
    }

    const fullReportHtml = `${headerHtml}\n${reportBody}\n${signaturesHtml}`;

    // Actualizar en BD el último reporte generado
    await ContextoData.findOneAndUpdate(
      { user: userId, ...(companyId ? { companyId } : {}) },
      {
        $set: {
          lastGeneratedReport: fullReportHtml,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({
      success: true,
      html: fullReportHtml,
    });
  } catch (error) {
    logger.error('[SGSST Contexto] Error generating report:', error);
    res.status(500).json({ error: error.message || 'Error al compilar el informe oficial.' });
  }
});

module.exports = router;
module.exports.gatherCompanyFullContext = gatherCompanyFullContext;
module.exports.resolveUserAndCompany = resolveUserAndCompany;
module.exports.getActiveCompany = getActiveCompany;
