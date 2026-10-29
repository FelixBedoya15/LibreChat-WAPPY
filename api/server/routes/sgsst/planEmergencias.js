const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const PlanEmergenciasData = require('~/models/PlanEmergenciasData');
const KanbanTask = require('~/models/KanbanTask');
const SgsstBrigadista = require('~/models/SgsstBrigadista');
const SgsstWorker = require('~/models/SgsstWorker');
const SgsstChemicalData = require('~/models/SgsstChemicalData');
const SgsstVehicleData = require('~/models/SgsstVehicleData');
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

/**
 * Redondea números flotantes a máximo 2 decimales
 */
function round2(val) {
  return Number(Number(val || 0).toFixed(2));
}

/**
 * Normaliza los porcentajes de ecosystemMetrics a máximo 2 decimales
 */
function sanitizeEcosystemMetrics(em = {}) {
  return {
    ...em,
    diagnosticoScore: round2(em.diagnosticoScore),
    avgFitScore: round2(em.avgFitScore),
    capacitacionesCompliancePct: round2(em.capacitacionesCompliancePct),
    auditoriaScore: round2(em.auditoriaScore),
  };
}

/**
 * Extrae JSON limpio desde texto de respuesta de Gemini
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
 * Calcula automáticamente el nivel de riesgo global de emergencia (Diamante de Colores)
 */
function computeEmergencyGlobalRisk(calificacionDiamante = 'Probable', nivelVulnerabilidad = 'Media') {
  const cal = String(calificacionDiamante || 'Probable').toLowerCase();
  const vul = String(nivelVulnerabilidad || 'Media').toLowerCase();

  const calScore = cal.startsWith('inm') ? 3 : cal.startsWith('prob') ? 2 : 1;
  const vulScore = vul.startsWith('alt') ? 3 : vul.startsWith('med') ? 2 : 1;
  const product = calScore * vulScore;

  if (product >= 6) return 'Alto';
  if (product >= 3) return 'Medio';
  return 'Bajo';
}

/**
 * Construye datos base pre-hidratados de la sede a partir de CompanyInfo y métricas
 */
function buildDefaultSedeData(company = {}, existingSede = {}, totalWorkers = 0) {
  const city = existingSede.ciudad || company?.city || company?.ciudad || 'Bogotá D.C.';
  const arl = existingSede.arlNombre || company?.arl || 'ARL SURA / Positiva / Colmena / Bolívar';
  const workers =
    Number(existingSede.trabajadoresFijos) > 0
      ? Number(existingSede.trabajadoresFijos)
      : Number(totalWorkers || company?.workerCount || 10);

  let defaultClinica = `Hospital / Clínica de Urgencias Nivel III-IV de ${city}`;
  if (/medell[ií]n|antioquia/i.test(city)) {
    defaultClinica = 'Hospital Pablo Tobón Uribe / Clínica Las Américas Auna (Medellín)';
  } else if (/bogot[aá]/i.test(city)) {
    defaultClinica = 'Fundación Santa Fe de Bogotá / Hospital Universitario San Ignacio';
  } else if (/cali|valle/i.test(city)) {
    defaultClinica = 'Fundación Valle del Lili / Clínica Imbanaco (Cali)';
  } else if (/barranquilla|atl[aá]ntico/i.test(city)) {
    defaultClinica = 'Clínica Portoazul / Clínica General del Norte (Barranquilla)';
  } else if (/bucaramanga|santander/i.test(city)) {
    defaultClinica = 'Fundación Cardiovascular de Colombia / Hospital Internacional de Colombia';
  }

  return {
    nombreSede:
      existingSede.nombreSede ||
      (company?.companyName ? `Sede Principal - ${company.companyName}` : 'Sede Principal'),
    ciudad: city,
    direccion: existingSede.direccion || company?.address || 'Instalación Principal Operativa',
    telefonoEmergencia: existingSede.telefonoEmergencia || company?.phone || 'Línea 123 / Recepción SST',
    horarioOperacion: existingSede.horarioOperacion || 'Lunes a Sábado 7:00 a.m. - 5:30 p.m.',
    trabajadoresFijos: workers,
    contratistasFlotantes:
      existingSede.contratistasFlotantes !== undefined
        ? Number(existingSede.contratistasFlotantes)
        : 2,
    visitantesPromedio:
      existingSede.visitantesPromedio !== undefined ? Number(existingSede.visitantesPromedio) : 5,
    construccionTipo:
      existingSede.construccionTipo ||
      'Estructura sismorresistente en concreto reforzado, cubierta liviana y redes eléctricas entubadas',
    puntoEncuentroPrincipal:
      existingSede.puntoEncuentroPrincipal ||
      'Punto de Encuentro N° 1: Zona exterior despejada frente al acceso principal (señalizada NTC 1461)',
    puntoEncuentroAlterno:
      existingSede.puntoEncuentroAlterno ||
      'Punto de Encuentro N° 2: Plazoleta / Parqueadero externo a más de 50 metros de líneas de media tensión',
    rutasEvacuacionDesc:
      existingSede.rutasEvacuacionDesc ||
      'Pasillos principales libres de obstáculos con señalización fotoluminiscente NTC 1461, lámparas de emergencia autónomas y puertas con apertura hacia el exterior.',
    sistemaAlarma:
      existingSede.sistemaAlarma ||
      'Sirena acústica-estroboscópica codificada (1 tono intermitente: Alerta y alistamiento · 1 tono continuo: Evacuación inmediata) + Silbatos de brigadistas.',
    clinicaMedevac: existingSede.clinicaMedevac || defaultClinica,
    direccionClinica:
      existingSede.direccionClinica || `Red Hospitalaria de Urgencias y Trauma de ${city}`,
    tiempoTrasladoMedevac:
      existingSede.tiempoTrasladoMedevac || '10 a 15 minutos en ambulancia medicalizada (TAB/TAM)',
    ambulanciaContacto:
      existingSede.ambulanciaContacto || `Línea Única de Emergencias 123 (${city}) / Asistencia Médica ${arl}`,
    arlNombre: arl,
    arlLineaEmergencia:
      existingSede.arlLineaEmergencia || `Línea Nacional de Urgencias ATEL ${arl} (Atención 24/7)`,
  };
}

/**
 * Construye el directorio externo base de emergencias según ciudad y ARL
 */
function buildDefaultDirectorioExterno(city = 'Colombia', arl = 'ARL') {
  return [
    {
      id: 'dir_123',
      entidad: `Línea Única de Emergencias y Despacho CRUE (${city})`,
      lineaTelefonica: '123',
      direccionDistancia: `Cobertura Urbana y Metropolitana (${city})`,
      tipoApoyo: 'Coordinación integral de ambulancias, policía, bomberos y rescate',
      tiempoRespuestaEstimado: '8 - 12 min',
    },
    {
      id: 'dir_bomberos',
      entidad: `Cuerpo Oficial de Bomberos (${city})`,
      lineaTelefonica: '119 / 123',
      direccionDistancia: 'Estación de Bomberos Zonal más cercana (< 4 km)',
      tipoApoyo: 'Control de incendios estructurales, rescate vertical y materiales peligrosos (HAZMAT)',
      tiempoRespuestaEstimado: '10 - 15 min',
    },
    {
      id: 'dir_cruzroja',
      entidad: 'Cruz Roja Colombiana — Atención Prehospitalaria',
      lineaTelefonica: '132',
      direccionDistancia: `Seccional ${city}`,
      tipoApoyo: 'Ambulancia básica/medicalizada, primeros auxilios avanzados y apoyo psicosocial',
      tiempoRespuestaEstimado: '12 - 18 min',
    },
    {
      id: 'dir_defensacivil',
      entidad: 'Defensa Civil Colombiana',
      lineaTelefonica: '144',
      direccionDistancia: `Dirección Seccional ${city}`,
      tipoApoyo: 'Búsqueda y rescate en estructuras colapsadas (BREC) y evacuación masiva',
      tiempoRespuestaEstimado: '15 - 20 min',
    },
    {
      id: 'dir_policia',
      entidad: 'Policía Nacional / Cuadrante de Seguridad y Tránsito',
      lineaTelefonica: '112 / #767',
      direccionDistancia: 'CAI / Estación de Policía del sector (< 2 km)',
      tipoApoyo: 'Acorralamiento perimetral, orden público, amenaza social y siniestros viales',
      tiempoRespuestaEstimado: '5 - 10 min',
    },
    {
      id: 'dir_arl',
      entidad: `Línea de Emergencias Médicas ATEL — ${arl}`,
      lineaTelefonica: '01 8000 / Línea Directa ARL 24/7',
      direccionDistancia: 'Red de IPS y Clínicas Adscritas para Accidentes de Trabajo',
      tipoApoyo: 'Direccionamiento MEDEVAC, autorización de urgencias ATEL y traslado asistencial',
      tiempoRespuestaEstimado: 'Inmediato (Telefónico)',
    },
  ];
}

/**
 * GET /api/sgsst/plan-emergencias/data
 * Carga el Plan de Emergencias y Contingencias (PPRE), pre-hidrata sedeData si está vacío
 * y devuelve las métricas consolidadas de las 16 fuentes del Ecosistema Somos SST.
 */
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req.user);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [doc, fullContext] = await Promise.all([
      PlanEmergenciasData.findOne(filter).lean(),
      gatherCompanyFullContext(userId, companyId),
    ]);

    const baseEm = sanitizeEcosystemMetrics(fullContext.ecosystemMetrics);
    const hydratedSede = buildDefaultSedeData(
      company,
      doc?.sedeData || {},
      baseEm.totalWorkers
    );

    const escenariosAmenaza = doc?.escenariosAmenaza || [];
    const estructuraSci = doc?.estructuraSci || [];
    const procedimientosPon = doc?.procedimientosPon || [];
    const recursosEquipos = doc?.recursosEquipos || [];
    const directoriosExternos =
      Array.isArray(doc?.directoriosExternos) && doc.directoriosExternos.length > 0
        ? doc.directoriosExternos
        : buildDefaultDirectorioExterno(hydratedSede.ciudad, hydratedSede.arlNombre);
    const simulacrosPlan = doc?.simulacrosPlan || [];

    const ecosystemMetrics = {
      ...baseEm,
      vulnerabilidadAmenazasCount: baseEm.amenazasVulnerabilidadCount || 0,
      brigadistasCount: baseEm.brigadistasCount || 0,
      escenariosCount: escenariosAmenaza.length,
      sciCount: estructuraSci.length,
      ponCount: procedimientosPon.length,
      recursosCount: recursosEquipos.length,
      simulacrosCount: simulacrosPlan.length,
    };

    return res.json({
      sedeData: hydratedSede,
      escenariosAmenaza,
      estructuraSci,
      procedimientosPon,
      recursosEquipos,
      directoriosExternos,
      simulacrosPlan,
      lastGeneratedReport: doc?.lastGeneratedReport || '',
      company,
      ecosystemMetrics,
    });
  } catch (error) {
    logger.error('[SGSST PlanEmergencias] Load data error:', error);
    res.status(500).json({ error: 'Error al cargar los datos del Plan de Emergencias y Contingencias.' });
  }
});

/**
 * POST /api/sgsst/plan-emergencias/data
 * Guarda el estado completo del Plan de Emergencias y Contingencias (PPRE).
 */
router.post('/data', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req.user);

    const {
      sedeData,
      escenariosAmenaza,
      estructuraSci,
      procedimientosPon,
      recursosEquipos,
      directoriosExternos,
      simulacrosPlan,
      lastGeneratedReport,
      conversationId,
      messageId,
    } = req.body;

    const normalizedEscenarios = Array.isArray(escenariosAmenaza)
      ? escenariosAmenaza.map((e, idx) => ({
          ...e,
          id: e.id || `am_${Date.now()}_${idx}`,
          riesgoGlobal:
            e.riesgoGlobal ||
            computeEmergencyGlobalRisk(e.calificacionDiamante, e.nivelVulnerabilidad),
        }))
      : [];

    const normalizedSci = Array.isArray(estructuraSci)
      ? estructuraSci.map((s, idx) => ({
          ...s,
          id: s.id || `sci_${Date.now()}_${idx}`,
        }))
      : [];

    const normalizedPon = Array.isArray(procedimientosPon)
      ? procedimientosPon.map((p, idx) => ({
          ...p,
          id: p.id || `pon_${Date.now()}_${idx}`,
          codigo: p.codigo || `PON-0${idx + 1}`,
        }))
      : [];

    const normalizedRecursos = Array.isArray(recursosEquipos)
      ? recursosEquipos.map((r, idx) => ({
          ...r,
          id: r.id || `rec_${Date.now()}_${idx}`,
          cantidad: Number(r.cantidad || 1),
        }))
      : [];

    const normalizedDirectorios = Array.isArray(directoriosExternos)
      ? directoriosExternos.map((d, idx) => ({
          ...d,
          id: d.id || `dir_${Date.now()}_${idx}`,
        }))
      : [];

    const normalizedSimulacros = Array.isArray(simulacrosPlan)
      ? simulacrosPlan.map((sim, idx) => ({
          ...sim,
          id: sim.id || `sim_${Date.now()}_${idx}`,
          participantesEsperados: Number(sim.participantesEsperados || company?.workerCount || 10),
        }))
      : [];

    const updated = await PlanEmergenciasData.findOneAndUpdate(
      { user: userId, ...(companyId ? { companyId } : {}) },
      {
        $set: {
          sedeData: buildDefaultSedeData(company, sedeData || {}, company?.workerCount),
          escenariosAmenaza: normalizedEscenarios,
          estructuraSci: normalizedSci,
          procedimientosPon: normalizedPon,
          recursosEquipos: normalizedRecursos,
          directoriosExternos: normalizedDirectorios,
          simulacrosPlan: normalizedSimulacros,
          ...(lastGeneratedReport !== undefined ? { lastGeneratedReport } : {}),
          ...(conversationId ? { conversationId } : {}),
          ...(messageId ? { messageId } : {}),
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('[SGSST PlanEmergencias] Save data error:', error);
    res.status(500).json({ error: 'Error al guardar el Plan de Emergencias y Contingencias.' });
  }
});

/**
 * Helper interno para ejecutar la sincronización determinista 360° del ecosistema hacia el PPRE
 */
async function buildEcosystemEmergencySync(userId, companyId, existingDoc, fullContext) {
  const company = fullContext.company || {};
  const em = sanitizeEcosystemMetrics(fullContext.ecosystemMetrics);

  const sedeData = buildDefaultSedeData(company, existingDoc?.sedeData || {}, em.totalWorkers);
  const escenariosAmenaza = Array.isArray(existingDoc?.escenariosAmenaza)
    ? [...existingDoc.escenariosAmenaza]
    : [];
  const estructuraSci = Array.isArray(existingDoc?.estructuraSci)
    ? [...existingDoc.estructuraSci]
    : [];
  const procedimientosPon = Array.isArray(existingDoc?.procedimientosPon)
    ? [...existingDoc.procedimientosPon]
    : [];
  const recursosEquipos = Array.isArray(existingDoc?.recursosEquipos)
    ? [...existingDoc.recursosEquipos]
    : [];
  const directoriosExternos =
    Array.isArray(existingDoc?.directoriosExternos) && existingDoc.directoriosExternos.length > 0
      ? [...existingDoc.directoriosExternos]
      : buildDefaultDirectorioExterno(sedeData.ciudad, sedeData.arlNombre);
  const simulacrosPlan = Array.isArray(existingDoc?.simulacrosPlan)
    ? [...existingDoc.simulacrosPlan]
    : [];

  const norm = (str) => String(str || '').trim().toLowerCase();
  const escKeys = new Set(escenariosAmenaza.map((e) => norm(e.amenaza)));
  const sciKeys = new Set(estructuraSci.map((s) => norm(`${s.rolSci}_${s.nombreAsignado}`)));
  const ponKeys = new Set(procedimientosPon.map((p) => norm(p.tituloEscenario)));
  const recKeys = new Set(recursosEquipos.map((r) => norm(r.descripcion)));
  const simKeys = new Set(simulacrosPlan.map((s) => norm(s.tituloSimulacro)));

  const syncedSources = [];
  let addedCount = 0;

  const addEscenario = (item) => {
    const key = norm(item.amenaza);
    if (!key || escKeys.has(key)) return;
    escenariosAmenaza.push({
      id: `am_eco_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      amenaza: item.amenaza,
      tipo: item.tipo || 'Tecnológica',
      origenSst: item.origenSst || 'Análisis de Vulnerabilidad',
      calificacionDiamante: item.calificacionDiamante || 'Probable',
      nivelVulnerabilidad: item.nivelVulnerabilidad || 'Media',
      riesgoGlobal:
        item.riesgoGlobal ||
        computeEmergencyGlobalRisk(item.calificacionDiamante, item.nivelVulnerabilidad),
      areaAfectada: item.areaAfectada || 'Instalaciones operativas y administrativas',
      medidasPrevencion: item.medidasPrevencion || '',
      medidasMitigacion: item.medidasMitigacion || '',
      responsable: item.responsable || 'Responsable SG-SST / Jefe de Brigada',
      sentToKanban: false,
    });
    escKeys.add(key);
    addedCount++;
  };

  const addSci = (item) => {
    const key = norm(`${item.rolSci}_${item.nombreAsignado}`);
    if (!item.rolSci || sciKeys.has(key)) return;
    estructuraSci.push({
      id: `sci_eco_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      rolSci: item.rolSci,
      nombreAsignado: item.nombreAsignado || 'Por designar',
      cargoEmpresa: item.cargoEmpresa || 'Brigadista SST',
      telefonoContacto: item.telefonoContacto || sedeData.telefonoEmergencia,
      especialidadBrigada: item.especialidadBrigada || 'Comando de Incidente (SCI)',
      funcionesAntes: item.funcionesAntes || '',
      funcionesDurante: item.funcionesDurante || '',
      funcionesDespues: item.funcionesDespues || '',
      origenSst: item.origenSst || 'Brigada de Emergencias',
    });
    sciKeys.add(key);
    addedCount++;
  };

  const addPon = (item) => {
    const key = norm(item.tituloEscenario);
    if (!key || ponKeys.has(key)) return;
    const nextNum = procedimientosPon.length + 1;
    procedimientosPon.push({
      id: `pon_eco_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      codigo: item.codigo || `PON-0${nextNum}`,
      tituloEscenario: item.tituloEscenario,
      amenazaAsociada: item.amenazaAsociada || 'Amenaza crítica identificada',
      faseAntes: item.faseAntes || '',
      faseDurante: item.faseDurante || '',
      faseDespues: item.faseDespues || '',
      recursosNecesarios: item.recursosNecesarios || 'Botiquín, Camilla, Extintores, Megáfono',
      responsableOperativo: item.responsableOperativo || 'Comandante del Incidente / Brigada SST',
      estado: item.estado || 'Vigente',
      sentToKanban: false,
    });
    ponKeys.add(key);
    addedCount++;
  };

  const addRecurso = (item) => {
    const key = norm(item.descripcion);
    if (!key || recKeys.has(key)) return;
    recursosEquipos.push({
      id: `rec_eco_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tipoRecurso: item.tipoRecurso || 'Extintor',
      descripcion: item.descripcion,
      ubicacion: item.ubicacion || 'Área operativa / Pasillo principal',
      cantidad: Number(item.cantidad || 1),
      estado: item.estado || 'Operativo',
      fechaInspeccion: item.fechaInspeccion || new Date().toISOString().slice(0, 10),
      responsable: item.responsable || 'Brigada de Emergencia / SST',
      origenSst: item.origenSst || 'Dotación de Emergencias',
    });
    recKeys.add(key);
    addedCount++;
  };

  const addSimulacro = (item) => {
    const key = norm(item.tituloSimulacro);
    if (!key || simKeys.has(key)) return;
    simulacrosPlan.push({
      id: `sim_eco_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tituloSimulacro: item.tituloSimulacro,
      escenario: item.escenario || 'Evacuación General',
      fechaProgramada: item.fechaProgramada || `${new Date().getFullYear()}-10-24`,
      participantesEsperados: Number(item.participantesEsperados || sedeData.trabajadoresFijos || 10),
      tiempoRespuestaMeta: item.tiempoRespuestaMeta || '< 3 minutos hasta Punto de Encuentro',
      estado: item.estado || 'Programado',
      hallazgosMejora: item.hallazgosMejora || '',
      responsable: item.responsable || 'Responsable SG-SST / Brigada',
      sentToKanban: false,
    });
    simKeys.add(key);
    addedCount++;
  };

  // 1. PERFIL CORPORATIVO (CompanyInfo)
  syncedSources.push(
    `Perfil de Empresa (${company?.companyName || 'Organización'} · ${sedeData.trabajadoresFijos} trabajadores · ARL ${sedeData.arlNombre})`
  );

  // 2. ANÁLISIS DE VULNERABILIDAD (Diamante de Colores)
  const filter = { user: userId, ...(companyId ? { companyId } : {}) };
  let vulnAmenazas = [];
  try {
    try {
      require('./analisisVulnerabilidad');
    } catch (_) {}
    const AnalisisVulnerabilidadData = mongoose.models.AnalisisVulnerabilidadData;
    if (AnalisisVulnerabilidadData) {
      const avDoc = await AnalisisVulnerabilidadData.findOne(filter).lean();
      if (Array.isArray(avDoc?.formData?.amenazasList)) {
        vulnAmenazas = avDoc.formData.amenazasList;
      }
    }
  } catch (err) {
    logger.debug('[PlanEmergencias] AnalisisVulnerabilidad lookup error:', err.message);
  }

  if (vulnAmenazas.length > 0) {
    syncedSources.push(`Análisis de Vulnerabilidad (${vulnAmenazas.length} amenazas del Diamante)`);
    for (const am of vulnAmenazas) {
      const amName = am.amenaza || am.nombre || 'Amenaza Identificada';
      const rawTipo = String(am.tipo || am.origen || 'Natural').toLowerCase();
      const tipo = rawTipo.includes('tec')
        ? 'Tecnológica'
        : rawTipo.includes('soc')
          ? 'Social'
          : 'Natural';
      const rawCal = String(am.calificacion || am.nivelAmenaza || 'Probable').toLowerCase();
      const calificacionDiamante = rawCal.includes('inm')
        ? 'Inminente'
        : rawCal.includes('pos')
          ? 'Posible'
          : 'Probable';

      addEscenario({
        amenaza: amName,
        tipo,
        origenSst: 'Análisis de Vulnerabilidad (Diamante de Colores)',
        calificacionDiamante,
        nivelVulnerabilidad: 'Media',
        riesgoGlobal: computeEmergencyGlobalRisk(calificacionDiamante, 'Media'),
        areaAfectada: am.area || 'Toda la instalación operativa y administrativa',
        medidasPrevencion:
          am.fuente ||
          `Inspecciones periódicas de infraestructura, señalización NTC 1461 y capacitación preventiva frente a ${amName}.`,
        medidasMitigacion:
          'Activación inmediata de alarma codificada, despliegue de brigada de emergencias y aplicación del PON específico.',
        responsable: 'Jefe de Brigada / Responsable SG-SST',
      });

      addPon({
        tituloEscenario: `PON de Actuación ante ${amName}`,
        amenazaAsociada: amName,
        faseAntes: `Verificar estado de rutas de evacuación, puntos de encuentro, anclaje de estanterías y operatividad de equipos de emergencia frente a ${amName}.`,
        faseDurante: `Conservar la calma, suspender actividades críticas, activar alarma de emergencia, seguir instrucciones de los brigadistas de evacuación y dirigirse al Punto de Encuentro.`,
        faseDespues: `Realizar censo de personal en Punto de Encuentro, atender lesionados con Primeros Auxilios / MEDEVAC, inspeccionar daños estructurales antes del reingreso y documentar lecciones aprendidas.`,
        recursosNecesarios: 'Alarma sonora, megáfono, botiquín tipo B, camilla rígida, extintores y directorio CRUE 123',
        responsableOperativo: 'Comandante del Incidente / Brigada de Evacuación',
      });
    }
  } else {
    syncedSources.push('Escenarios Base de Ley (Sismo, Incendio Estructural y Emergencia Médica)');
    addEscenario({
      amenaza: 'Sismo / Movimiento Telúrico de Gran Magnitud',
      tipo: 'Natural',
      origenSst: 'Amenaza Sísmica Geográfica / NSR-10',
      calificacionDiamante: 'Probable',
      nivelVulnerabilidad: 'Media',
      riesgoGlobal: 'Medio',
      areaAfectada: 'Todas las áreas operativas, oficinas y bodegas',
      medidasPrevencion:
        'Anclaje de estanterías y gabinetes, señalización fotoluminiscente de rutas de evacuación y simulacros semestrales.',
      medidasMitigacion:
        'Protección bajo estructura firme durante el sismo, corte de suministros (energía/gas) y evacuación ordenada hacia Punto de Encuentro.',
      responsable: 'Comandante del Incidente / Brigada de Evacuación',
    });
    addEscenario({
      amenaza: 'Incendio Estructural o Cortocircuito Eléctrico',
      tipo: 'Tecnológica',
      origenSst: 'Matriz IPEVR GTC-45 / Inspección Locativa',
      calificacionDiamante: 'Probable',
      nivelVulnerabilidad: 'Media',
      riesgoGlobal: 'Alto',
      areaAfectada: 'Cuartos eléctricos, archivo, almacén y áreas de producción',
      medidasPrevencion:
        'Mantenimiento preventivo de redes eléctricas RETIE, control de cargas térmicas y recarga anual de extintores multipropósito ABC y Solkaflam.',
      medidasMitigacion:
        'Control de conato con extintores portátiles por la Brigada Contraincendios, desenergización del área y llamado inmediato a Bomberos (119).',
      responsable: 'Brigada Contraincendios / Responsable SG-SST',
    });

    addPon({
      codigo: 'PON-01',
      tituloEscenario: 'PON-01: Actuación en Caso de Sismo o Terremoto',
      amenazaAsociada: 'Sismo / Movimiento Telúrico de Gran Magnitud',
      faseAntes:
        'Asegurar estanterías, luminarias y objetos pesados; mantener despejadas las salidas de emergencia; capacitar al personal en autoprotección.',
      faseDurante:
        'Ubicar zonas seguras junto a columnas o muros estructurales (agacharse, cubrirse y sujetarse); alejarse de ventanales; NO correr ni usar ascensores; al cesar el movimiento, evacuar hacia el Punto de Encuentro.',
      faseDespues:
        'Realizar conteo nominal de trabajadores, contratistas y visitantes; brindar primeros auxilios; evaluar grietas o fugas antes de autorizar el retorno.',
      recursosNecesarios: 'Alarma, chalecos reflectivos, pitos, camilla rígida, botiquín y radios de comunicación',
      responsableOperativo: 'Comandante del Incidente / Brigada de Evacuación',
    });
    addPon({
      codigo: 'PON-02',
      tituloEscenario: 'PON-02: Control de Conatos de Incendio y Evacuación',
      amenazaAsociada: 'Incendio Estructural o Cortocircuito Eléctrico',
      faseAntes:
        'Inspección mensual de extintores (presión, sello, manómetro), detectores de humo y orden y aseo libre de material combustible.',
      faseDurante:
        'Quien detecte el fuego da la voz de alarma; el brigadista contraincendios ataca el conato a favor del viento con el extintor adecuado; si el fuego supera la capacidad incipiente, evacuar inmediatamente y llamar al 119.',
      faseDespues:
        'Aislar la zona afectada, entregar el mando al Cuerpo Oficial de Bomberos, ventilar el área e investigar las causas del evento.',
      recursosNecesarios: 'Extintores ABC / CO2 / Solkaflam, alarma contra incendios, cortafríos y línea 119',
      responsableOperativo: 'Líder de Brigada Contraincendios',
    });
  }

  // 3. BRIGADA DE EMERGENCIAS Y GOBERNANZA (SgsstBrigadista + PerfilSociodemograficoData)
  let brigadistas = [];
  try {
    brigadistas = await SgsstBrigadista.find(
      companyId ? { companyId } : { user: userId }
    ).lean();
    if (!brigadistas || brigadistas.length === 0) {
      const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
      if (PerfilSociodemograficoData) {
        const pDoc = await PerfilSociodemograficoData.findOne(filter).lean();
        if (Array.isArray(pDoc?.trabajadores)) {
          brigadistas = pDoc.trabajadores
            .filter((w) => String(w.esBrigadista || '').trim().toLowerCase() === 'sí')
            .map((w) => ({
              nombre: w.nombre,
              cargo: w.cargo || 'Colaborador Operativo',
              grupoEspecialidad: 'Primeros Auxilios',
              rolSCI: 'Brigadista Operativo',
              contactoEmergenciaTelefono: w.emergenciaTelefono || w.telefono || '',
            }));
        }
      }
    }
  } catch (err) {
    logger.debug('[PlanEmergencias] Brigadistas lookup error:', err.message);
  }

  // Comandante del Incidente y Oficial de Seguridad (siempre presentes desde Gobernanza)
  addSci({
    rolSci: 'Comandante del Incidente (Jefe de Emergencias)',
    nombreAsignado: company?.legalRepresentative || company?.responsibleSST || 'Representante Legal / Dirección',
    cargoEmpresa: 'Representante Legal / Alta Dirección',
    telefonoContacto: sedeData.telefonoEmergencia,
    especialidadBrigada: 'Comando de Incidente (SCI)',
    funcionesAntes:
      'Aprobar recursos del PPRE en la Revisión por la Alta Dirección (Art. 2.2.4.6.31) y autorizar simulacros.',
    funcionesDurante:
      'Instalar el Puesto de Comando (PC), asumir el mando supremo de la emergencia, autorizar evacuación total y enlace con Bomberos/Autoridades.',
    funcionesDespues:
      'Declarar el retorno a la normalidad tras verificación técnica y liderar el informe gerencial post-emergencia.',
    origenSst: 'Revisión por la Alta Dirección / Gobernanza',
  });

  addSci({
    rolSci: 'Oficial de Seguridad y Enlace Operativo SST',
    nombreAsignado: company?.responsibleSST || 'Responsable del SG-SST',
    cargoEmpresa: 'Líder / Responsable SG-SST',
    telefonoContacto: sedeData.telefonoEmergencia,
    especialidadBrigada: 'Seguridad Operacional y MEDEVAC',
    funcionesAntes:
      'Mantener actualizado el PPRE, coordinar capacitaciones de la brigada e inspeccionar equipos de emergencia.',
    funcionesDurante:
      'Velar por la seguridad de los brigadistas, activar cadena de llamadas MEDEVAC con ARL y monitorear condiciones peligrosas.',
    funcionesDespues:
      'Consolidar evaluación del evento o simulacro y generar planes de acción ACPM en el Centro de Control Kanban.',
    origenSst: 'Responsable SG-SST (Res. 0312 Est. 1.1.1)',
  });

  if (brigadistas.length > 0) {
    syncedSources.push(`Brigada de Emergencias (${brigadistas.length} brigadistas activos en SCI)`);
    for (const b of brigadistas) {
      const esp = b.grupoEspecialidad || 'Primeros Auxilios';
      addSci({
        rolSci: b.rolSCI || `Brigadista de ${esp}`,
        nombreAsignado: b.nombre || 'Brigadista Asignado',
        cargoEmpresa: b.cargo || 'Colaborador Brigadista',
        telefonoContacto: b.contactoEmergenciaTelefono || sedeData.telefonoEmergencia,
        especialidadBrigada: esp,
        funcionesAntes: `Participar en entrenamientos de ${esp} e inspeccionar botiquines, extintores y rutas asignadas.`,
        funcionesDurante: `Ejecutar protocolos operativos de ${esp}, guiar al personal hacia el Punto de Encuentro y reportar novedades al Comandante del Incidente.`,
        funcionesDespues: `Apoyar el censo en el Punto de Encuentro, verificar reposición de insumos utilizados y participar en la evaluación del evento.`,
        origenSst: 'Conformación de Brigada (Est. 5.1.1)',
      });
    }
  } else {
    syncedSources.push('Estructura Base SCI (Primeros Auxilios, Contraincendios y Evacuación)');
    addSci({
      rolSci: 'Líder de Brigada de Primeros Auxilios y MEDEVAC',
      nombreAsignado: 'Brigadista Líder APH',
      cargoEmpresa: 'Integrante Brigada de Emergencia',
      telefonoContacto: sedeData.telefonoEmergencia,
      especialidadBrigada: 'Primeros Auxilios',
      funcionesAntes: 'Verificar dotación de botiquines portátiles, camillas rígidas e inmovilizadores.',
      funcionesDurante: 'Instalar Módulo de Estabilización y Clasificación (MEC / Triage), prestar primeros auxilios y coordinar remisión MEDEVAC.',
      funcionesDespues: 'Reportar estado de pacientes remitidos y solicitar reposición de material de curación.',
      origenSst: 'Brigada de Emergencias',
    });
    addSci({
      rolSci: 'Líder de Brigada de Evacuación y Rescate',
      nombreAsignado: 'Brigadista Líder de Evacuación',
      cargoEmpresa: 'Integrante Brigada de Emergencia',
      telefonoContacto: sedeData.telefonoEmergencia,
      especialidadBrigada: 'Evacuación y Rescate',
      funcionesAntes: 'Inspeccionar rutas de evacuación, salidas de emergencia, iluminación y puntos de encuentro.',
      funcionesDurante: 'Dirigir la salida ordenada del personal, asistir a personas con movilidad reducida o alertas FIT y realizar el censo en el Punto de Encuentro.',
      funcionesDespues: 'Confirmar que no queden personas atrapadas y coordinar el reingreso seguro.',
      origenSst: 'Brigada de Emergencias',
    });
  }

  // 4. COMPATIBILIDAD COLABORADOR-CARGO / HUELLA BIOCÉNTRICA FIT Y MEDEVAC
  if (em.workersWithFitAlerts > 0 || em.bioRiesgosCriticos > 0 || em.atelInvestigacionesCount > 0) {
    syncedSources.push(
      `Compatibilidad Colaborador-Cargo FIT (${em.workersWithFitAlerts} trabajadores con alertas/restricciones médicas · FIT Promedio ${em.avgFitScore}%)`
    );
  }
  addEscenario({
    amenaza: `Emergencia Médica Ocupacional / ATEL Grave y Evacuación Asistida (${em.workersWithFitAlerts} colaboradores con alertas médicas/FIT prioritarias)`,
    tipo: 'Tecnológica',
    origenSst: 'Compatibilidad Colaborador-Cargo (Huella Biocéntrica FIT) & ATEL',
    calificacionDiamante: em.workersWithFitAlerts > 0 ? 'Inminente' : 'Probable',
    nivelVulnerabilidad: 'Media',
    riesgoGlobal: 'Alto',
    areaAfectada: 'Puestos operativos y personal con condiciones de salud / restricciones laborales',
    medidasPrevencion:
      'Mapeo preventivo de trabajadores con alertas FIT (cardiovasculares, vértigo, osteomusculares), asignación de padrinos de evacuación asistida y botiquín actualizado.',
    medidasMitigacion:
      'Activación inmediata del Plan MEDEVAC, estabilización primaria por Brigada de Primeros Auxilios y traslado a Clínica Adscrita ARL.',
    responsable: 'Líder de Primeros Auxilios / Responsable SG-SST',
  });

  addPon({
    tituloEscenario: 'PON MEDEVAC: Evacuación Médica Prioritaria y Atención de Lesionados (ATEL)',
    amenazaAsociada: 'Emergencia Médica Ocupacional / ATEL Grave',
    faseAntes:
      'Identificar en el censo de brigada a los colaboradores con alertas de Compatibilidad Cargo-Persona (FIT) o condiciones médicas especiales; mantener despejado el acceso para ambulancias y verificar línea directa ARL.',
    faseDurante:
      '1. Asegurar la escena (PAS: Proteger, Avisar, Socorrer). 2. Valoración primaria por Brigada de Primeros Auxilios. 3. Comunicarse con la Línea de Emergencias ARL y CRUE 123. 4. Remitir al lesionado a la Clínica MEDEVAC definida acompañado de su documento e información de grupo sanguíneo.',
    faseDespues:
      'Notificar a familiares y Alta Dirección, radicar FURAT dentro de los 2 días hábiles legales e iniciar investigación de accidente (Res. 1401/2007).',
    recursosNecesarios: `Botiquín Tipo B, camilla rígida con correas y arrestador cervical, directorio MEDEVAC (${sedeData.clinicaMedevac}) y línea ARL (${sedeData.arlNombre})`,
    responsableOperativo: 'Brigada de Primeros Auxilios / Responsable SG-SST',
  });

  // 5. COMPATIBILIDAD QUÍMICA SGA E INVENTARIO QUÍMICO
  if (em.quimicosCount > 0) {
    syncedSources.push(
      `Inventario y Compatibilidad Química SGA (${em.quimicosCount} sustancias · ${em.incompatibilidadesQuimicas} alertas SGA)`
    );
    addEscenario({
      amenaza: `Derrame, Fuga o Reacción Química Peligrosa (${em.quimicosCount} productos químicos SGA en planta)`,
      tipo: 'Tecnológica',
      origenSst: 'Matriz de Compatibilidad Química SGA (Dec. 1496/2018)',
      calificacionDiamante: em.incompatibilidadesQuimicas > 0 ? 'Inminente' : 'Probable',
      nivelVulnerabilidad: 'Alta',
      riesgoGlobal: 'Alto',
      areaAfectada: 'Almacén de sustancias químicas, áreas de aseo, mantenimiento y producción',
      medidasPrevencion:
        'Almacenamiento segregado según Matriz de Compatibilidad SGA, diques de contención secundaria, Fichas de Datos de Seguridad (FDS) disponibles y rotulado SGA.',
      medidasMitigacion:
        'Aislamiento perimetral, uso de EPP químico específico, contención con Kit Antiderrames SGA y consulta de Sección 4, 5 y 6 de la FDS.',
      responsable: 'Brigada HAZMAT / Responsable SG-SST',
    });

    addPon({
      tituloEscenario: 'PON Químico SGA: Control de Derrames, Fugas o Exposición a Sustancias Peligrosas',
      amenazaAsociada: 'Derrame, Fuga o Reacción Química Peligrosa',
      faseAntes:
        'Disponer de las Fichas de Datos de Seguridad (FDS de 16 secciones) en el sitio de almacenamiento, Kit de Control de Derrames SGA y duchas/lavaojos operativos.',
      faseDurante:
        'Eliminar fuentes de ignición, ventilar el área, colocar barreras absorbentes del Kit Antiderrames evitando que la sustancia llegue a sifones o alcantarillado; en caso de contacto ocular/dérmico, irrigar durante 15 minutos en ducha/lavaojos.',
      faseDespues:
        'Disponer los residuos contaminados como residuo peligroso (RESPEL) con gestor autorizado y reponer los insumos del Kit de Derrames.',
      recursosNecesarios: 'Kit Antiderrames SGA (paños, cordones absorbentes, pala antichispa, bolsas rojas), FDS y EPP químico',
      responsableOperativo: 'Brigada de Emergencias / Almacenista',
    });

    addRecurso({
      tipoRecurso: 'Kit Derrames SGA',
      descripcion:
        'Kit Ambiental de Control de Derrames Químicos SGA (Cordones absorbentes, almohadillas, gafas herméticas, guantes de nitrilo y bolsas RESPEL)',
      ubicacion: 'Cuarto / Estación de Almacenamiento de Sustancias Químicas',
      cantidad: 1,
      estado: 'Operativo',
      origenSst: 'Matriz de Compatibilidad Química SGA',
    });
  }

  // 6. SEGURIDAD VIAL PESV Y FLOTA VEHICULAR
  if (em.pesvRiesgosCount > 0 || em.vehiculosCount > 0) {
    syncedSources.push(
      `Seguridad Vial PESV (${em.vehiculosCount} vehículos en flota y ${em.pesvRiesgosCount} riesgos viales)`
    );
    addEscenario({
      amenaza: `Siniestro Vial / Accidente de Tránsito en Desplazamiento Laboral (${em.vehiculosCount} vehículos registrados)`,
      tipo: 'Tecnológica',
      origenSst: 'Plan Estratégico de Seguridad Vial (PESV - Res. 20223040040595)',
      calificacionDiamante: 'Probable',
      nivelVulnerabilidad: 'Media',
      riesgoGlobal: 'Alto',
      areaAfectada: 'Rutas externas de operación, parqueaderos y zonas de cargue/descargue',
      medidasPrevencion:
        'Inspección preoperacional diaria de vehículos, mantenimiento preventivo, control de fatiga y respeto de límites de velocidad.',
      medidasMitigacion:
        'Señalización de la vía con conos/triángulos, activación de línea de emergencias 123 / #767, atención MEDEVAC al conductor y reporte a aseguradora/ARL.',
      responsable: 'Líder PESV / Responsable SG-SST',
    });

    addPon({
      tituloEscenario: 'PON Vial PESV: Actuación ante Siniestro Vial en Misión o Ruta',
      amenazaAsociada: 'Siniestro Vial / Accidente de Tránsito en Desplazamiento Laboral',
      faseAntes:
        'Ejecutar inspección preoperacional del vehículo, portar equipo de carretera reglamentario (Código Nacional de Tránsito), SOAT, Tecnomecánica y números de contacto de emergencia.',
      faseDurante:
        'Apagar el motor, encender luces estacionarias, colocar conos reflectivos a 30 metros, verificar estado de salud de ocupantes y terceros, llamar al 123 / Policía de Tránsito y reportar al Líder PESV/SST.',
      faseDespues:
        'Recopilar registro fotográfico y croquis policial (IPAT), realizar prueba de alcoholemia si aplica y ejecutar investigación en Comité de Seguridad Vial.',
      recursosNecesarios: 'Kit de carretera reglamentario, extintor vehicular 5 lb ABC, botiquín portátil y conos reflectivos',
      responsableOperativo: 'Conductor / Líder PESV',
    });
  }

  // 7. OPERACIÓN TERRENO: TRABAJO EN ALTURAS, ATS Y EPP
  if (em.permisosAlturasCount > 0 || em.atsCount > 0) {
    syncedSources.push(
      `Operación Terreno (${em.permisosAlturasCount} permisos/equipos de Alturas y ${em.atsCount} ATS activos)`
    );
    addEscenario({
      amenaza: 'Caída en Trabajo en Alturas / Síndrome del Arnés en Tarea Crítica',
      tipo: 'Tecnológica',
      origenSst: 'Permisos de Trabajo en Alturas (Res. 4272/2021) y ATS',
      calificacionDiamante: 'Probable',
      nivelVulnerabilidad: 'Media',
      riesgoGlobal: 'Alto',
      areaAfectada: 'Zonas de trabajo por encima de 2.0 metros, cubiertas, andamios o escaleras',
      medidasPrevencion:
        'Validación obligatoria de aptitud médica FIT, permiso de alturas firmado, inspección preoperacional de arnés/eslingas y presencia de Coordinador de Alturas.',
      medidasMitigacion:
        'Activación inmediata del Plan de Rescate Vertical en menos de 15 minutos para prevenir trauma por suspensión ortostática (Síndrome del Arnés).',
      responsable: 'Coordinador de Trabajo en Alturas / Brigada de Rescate',
    });

    addPon({
      tituloEscenario: 'PON Alturas: Plan de Rescate Vertical y Suspensión en Arnés (Res. 4272/2021)',
      amenazaAsociada: 'Caída en Trabajo en Alturas / Síndrome del Arnés',
      faseAntes:
        'Verificar punto de anclaje certificado (5000 lb), instalar líneas de vida, disponer de Kit de Rescate Vertical en el sitio y designar rescatista competente antes de iniciar el ascenso.',
      faseDurante:
        'Si el trabajador queda suspendido, activar rescate inmediato (< 15 min): indicar al trabajador usar cintas anti-trauma si está consciente; descenderlo con sistema polipasto/descendedor controlado; mantenerlo en posición semisentada al llegar a piso y activar MEDEVAC.',
      faseDespues:
        'Retirar de servicio los equipos de detención que sufrieron impacto de caída, trasladar al trabajador a valoración médica obligatoria e investigar el incidente.',
      recursosNecesarios: 'Kit de Rescate Vertical (cuerda certificada, poleas, bloqueadores, descendedores), camilla tipo Sked/FEL y cintas anti-trauma',
      responsableOperativo: 'Coordinador de Alturas / Rescatista Designado',
    });
  }

  // 8. RECURSOS Y EQUIPOS DE EMERGENCIA BASE (Estándar 5.1.1 Res. 0312)
  addRecurso({
    tipoRecurso: 'Extintor',
    descripcion: 'Extintor Multipropósito ABC (Polvo Químico Seco) 10 lb con manómetro y soporte mural señalizado',
    ubicacion: 'Áreas operativas, pasillos principales y acceso de almacén',
    cantidad: Math.max(3, Math.ceil((sedeData.trabajadoresFijos || 10) / 10)),
    estado: 'Operativo',
    origenSst: 'Estándar 5.1.1 Res. 0312/2019 · NTC 2885',
  });
  addRecurso({
    tipoRecurso: 'Extintor',
    descripcion: 'Extintor Agente Limpio (Solkaflam 3700 gr / CO2) para tableros eléctricos y equipos de cómputo',
    ubicacion: 'Oficinas administrativas y cuarto eléctrico / servidores',
    cantidad: 2,
    estado: 'Operativo',
    origenSst: 'Estándar 5.1.1 Res. 0312/2019 · RETIE',
  });
  addRecurso({
    tipoRecurso: 'Botiquín',
    descripcion: 'Botiquín de Primeros Auxilios Tipo B portátil en lona con insumos vigentes (Res. 0705)',
    ubicacion: 'Puesto de Brigada / Recepción Principal',
    cantidad: 2,
    estado: 'Operativo',
    origenSst: 'Plan MEDEVAC y Primeros Auxilios',
  });
  addRecurso({
    tipoRecurso: 'Camilla',
    descripcion: 'Camilla Rígida en Polietileno traslúcido a rayos X con inmovilizador cervical y correas tipo araña',
    ubicacion: 'Pasillo central junto al Botiquín Principal',
    cantidad: 1,
    estado: 'Operativo',
    origenSst: 'Plan MEDEVAC y Rescate',
  });
  addRecurso({
    tipoRecurso: 'Alarma / Detección',
    descripcion: 'Estación manual y sirena estroboscópica de alarma de evacuación + detectores fotoeléctricos de humo',
    ubicacion: 'Puntos estratégicos de circulación y áreas críticas',
    cantidad: 2,
    estado: 'Operativo',
    origenSst: 'Sistema de Alerta y Evacuación',
  });
  addRecurso({
    tipoRecurso: 'Señalización / Iluminación',
    descripcion: 'Kit de Señalización Fotoluminiscente NTC 1461 (Rutas, Salidas, Punto de Encuentro) y Lámparas de Emergencia',
    ubicacion: 'Rutas de evacuación, escaleras y salidas principales',
    cantidad: 8,
    estado: 'Operativo',
    origenSst: 'Inspección Locativa y Evacuación',
  });

  // 9. PROGRAMA ANUAL DE SIMULACROS (Art. 2.2.4.6.25 Numeral 10 Dec. 1072/2015)
  syncedSources.push(
    `Auditoría 1072 (${em.auditoriaScore}%), Alta Dirección (${em.altaDireccionCumple}/${em.altaDireccionTotalItems}), Diagnóstico 0312 (${em.diagnosticoScore}%) y Capacitaciones (${em.capacitacionesCompliancePct}%)`
  );

  const currentYear = new Date().getFullYear();
  addSimulacro({
    tituloSimulacro: `Simulacro General de Evacuación por Sismo (Art. 2.2.4.6.25 Dec. 1072)`,
    escenario: 'Sismo de gran magnitud con evacuación total hacia Punto de Encuentro N° 1',
    fechaProgramada: `${currentYear}-10-24`,
    participantesEsperados: sedeData.trabajadoresFijos + sedeData.contratistasFlotantes,
    tiempoRespuestaMeta: '< 3 minutos hasta censo completo en Punto de Encuentro',
    estado: 'Programado',
    hallazgosMejora:
      'Verificar audibilidad de alarma en todas las áreas, tiempos de desplazamiento y asistencia a colaboradores con restricciones FIT.',
    responsable: 'Comandante del Incidente / Responsable SG-SST',
  });

  addSimulacro({
    tituloSimulacro: 'Simulacro Operativo de Control de Conato de Incendio y Manejo de Extintores',
    escenario: 'Conato de incendio clase A/C en área operativa con activación de Brigada Contraincendios',
    fechaProgramada: `${currentYear}-06-15`,
    participantesEsperados: Math.max(5, em.brigadistasCount || 6),
    tiempoRespuestaMeta: '< 2 minutos de respuesta inicial con extintor portátil',
    estado: 'Programado',
    hallazgosMejora:
      'Evaluar destreza práctica en uso de extintores ABC/Solkaflam y comunicación por radio del SCI.',
    responsable: 'Líder de Brigada Contraincendios / ARL',
  });

  addSimulacro({
    tituloSimulacro: 'Simulacro de Activación MEDEVAC, Primeros Auxilios y Traslado de Lesionado',
    escenario: 'Atención de accidente laboral grave con inmovilización en camilla rígida y enlace con ARL/CRUE',
    fechaProgramada: `${currentYear}-08-20`,
    participantesEsperados: Math.max(5, em.brigadistasCount || 6),
    tiempoRespuestaMeta: '< 4 minutos para estabilización primaria y activación telefónica MEDEVAC',
    estado: 'Programado',
    hallazgosMejora:
      'Validar disponibilidad de botiquín, tiempos de inmovilización cervical y precisión en la cadena de llamadas.',
    responsable: 'Líder de Brigada de Primeros Auxilios / Responsable SG-SST',
  });

  const ecosystemMetrics = {
    ...em,
    vulnerabilidadAmenazasCount: em.amenazasVulnerabilidadCount || vulnAmenazas.length,
    brigadistasCount: Math.max(em.brigadistasCount || 0, brigadistas.length),
    escenariosCount: escenariosAmenaza.length,
    sciCount: estructuraSci.length,
    ponCount: procedimientosPon.length,
    recursosCount: recursosEquipos.length,
    simulacrosCount: simulacrosPlan.length,
  };

  return {
    sedeData,
    escenariosAmenaza,
    estructuraSci,
    procedimientosPon,
    recursosEquipos,
    directoriosExternos,
    simulacrosPlan,
    ecosystemMetrics,
    syncedSources,
    addedCount,
  };
}

/**
 * POST /api/sgsst/plan-emergencias/sync-ecosystem
 * Alimenta inteligentemente el Plan de Emergencias cruzando las 16 fuentes del Ecosistema 360° Somos SST.
 */
router.post('/sync-ecosystem', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, companyId } = await resolveUserAndCompany(req.user);
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, fullContext] = await Promise.all([
      PlanEmergenciasData.findOne(filter).lean(),
      gatherCompanyFullContext(userId, companyId),
    ]);

    const syncResult = await buildEcosystemEmergencySync(
      userId,
      companyId,
      existingDoc,
      fullContext
    );

    await PlanEmergenciasData.findOneAndUpdate(
      filter,
      {
        $set: {
          sedeData: syncResult.sedeData,
          escenariosAmenaza: syncResult.escenariosAmenaza,
          estructuraSci: syncResult.estructuraSci,
          procedimientosPon: syncResult.procedimientosPon,
          recursosEquipos: syncResult.recursosEquipos,
          directoriosExternos: syncResult.directoriosExternos,
          simulacrosPlan: syncResult.simulacrosPlan,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      sedeData: syncResult.sedeData,
      escenariosAmenaza: syncResult.escenariosAmenaza,
      estructuraSci: syncResult.estructuraSci,
      procedimientosPon: syncResult.procedimientosPon,
      recursosEquipos: syncResult.recursosEquipos,
      directoriosExternos: syncResult.directoriosExternos,
      simulacrosPlan: syncResult.simulacrosPlan,
      ecosystemMetrics: syncResult.ecosystemMetrics,
      syncedSources: syncResult.syncedSources,
      sourcesSynced: syncResult.syncedSources,
      addedCount: syncResult.addedCount,
      message:
        syncResult.addedCount > 0
          ? `Sincronización 360° exitosa: se integraron +${syncResult.addedCount} elementos tácticos en el Plan de Emergencias desde Vulnerabilidad, Brigada, Compatibilidad Colaborador-Cargo FIT, Químicos SGA, PESV, Alturas y Auditoría.`
          : 'El Plan de Emergencias y Contingencias ya se encuentra 100% sincronizado con las 16 fuentes del ecosistema Somos SST.',
    });
  } catch (error) {
    logger.error('[SGSST PlanEmergencias] Error in sync-ecosystem:', error);
    res.status(500).json({
      error: error.message || 'Error al sincronizar el Plan de Emergencias con el ecosistema Somos SST.',
    });
  }
});

/**
 * POST /api/sgsst/plan-emergencias/generate-ai
 * Usa Gemini con el contexto 360° de la empresa para generar/enriquecer todo el Plan de Emergencias (PPRE).
 */
router.post('/generate-ai', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, companyId } = await resolveUserAndCompany(req.user);
    const { modelName } = req.body;
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [existingDoc, fullContext] = await Promise.all([
      PlanEmergenciasData.findOne(filter).lean(),
      gatherCompanyFullContext(userId, companyId),
    ]);

    // Primero aseguramos la base determinista del ecosistema 360°
    const baseSync = await buildEcosystemEmergencySync(
      userId,
      companyId,
      existingDoc,
      fullContext
    );

    const comp = fullContext.company || {};
    const em = baseSync.ecosystemMetrics;
    const companyContextStr = buildCompanyContextString(comp);

    const promptText = `Eres el Comandante Especialista en Gestión del Riesgo de Desastres y Planes de Emergencias Empresariales (PPRE) de WAPPY en Colombia, experto en el Decreto 1072 de 2015 (Art. 2.2.4.6.25), Resolución 0312 de 2019 (Estándares 1.1.11 y 5.1.1), ISO 45001:2018 (Numeral 8.2), Sistema Comando de Incidentes (SCI) y Metodología de Diamante de Colores.

Tu misión es estructurar y perfeccionar el Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE) de la empresa integrando sus datos reales del Ecosistema 360° Somos SST:

=== 1. PERFIL DE LA ORGANIZACIÓN ===
${companyContextStr}

=== 2. DATOS CONSOLIDADOS DEL ECOSISTEMA 360° SOMOS SST ===
- Trabajadores activos: ${em.totalWorkers} en ${em.totalCargos} cargos · Índice FIT Promedio: ${em.avgFitScore}% · Trabajadores con alertas/restricciones médicas de evacuación prioritaria: ${em.workersWithFitAlerts}.
- Amenazas en Matriz de Vulnerabilidad: ${fullContext.amenazasEmergencia.join(', ') || 'Sismo, Incendio, Emergencia Médica'}.
- Brigadistas registrados: ${em.brigadistasCount} · Comités activos: ${em.comitesActivos}.
- Peligros GTC-45: ${em.totalPeligros} (${em.peligrosCriticos} críticos) · Sustancias Químicas SGA: ${em.quimicosCount} (${em.incompatibilidadesQuimicas} incompatibilidades) · Flota PESV: ${em.vehiculosCount} vehículos (${em.pesvRiesgosCount} riesgos viales) · Trabajo en Alturas/ATS: ${em.permisosAlturasCount} permisos.
- Auditoría Interna 1072: ${em.auditoriaScore}% (${em.auditoriaNoConformidades} No Conformidades) · Revisión Alta Dirección: ${em.altaDireccionCumple}/${em.altaDireccionTotalItems} conformes · Capacitaciones SST: ${em.capacitacionesCompliancePct}%.

=== INSTRUCCIONES ESTRICTAS ===
Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura completa y adaptada a la actividad económica (${comp.economicActivity || 'Operativa'}) y ciudad (${baseSync.sedeData.ciudad}):
{
  "sedeData": {
    "nombreSede": "${baseSync.sedeData.nombreSede}",
    "ciudad": "${baseSync.sedeData.ciudad}",
    "direccion": "${baseSync.sedeData.direccion}",
    "telefonoEmergencia": "${baseSync.sedeData.telefonoEmergencia}",
    "horarioOperacion": "${baseSync.sedeData.horarioOperacion}",
    "trabajadoresFijos": ${baseSync.sedeData.trabajadoresFijos},
    "contratistasFlotantes": ${baseSync.sedeData.contratistasFlotantes},
    "visitantesPromedio": ${baseSync.sedeData.visitantesPromedio},
    "construccionTipo": "Descripción técnica constructiva...",
    "puntoEncuentroPrincipal": "Ubicación exacta sugerida del Punto de Encuentro Principal...",
    "puntoEncuentroAlterno": "Ubicación del Punto de Encuentro Alterno...",
    "rutasEvacuacionDesc": "Descripción técnica de rutas, salidas y señalización NTC 1461...",
    "sistemaAlarma": "Código de alarma acústica/visual para alerta y evacuación...",
    "clinicaMedevac": "${baseSync.sedeData.clinicaMedevac}",
    "direccionClinica": "${baseSync.sedeData.direccionClinica}",
    "tiempoTrasladoMedevac": "10 a 15 minutos",
    "ambulanciaContacto": "${baseSync.sedeData.ambulanciaContacto}",
    "arlNombre": "${baseSync.sedeData.arlNombre}",
    "arlLineaEmergencia": "${baseSync.sedeData.arlLineaEmergencia}"
  },
  "escenariosAmenaza": [
    // 5 a 6 escenarios (Natural, Tecnológica, Social) articulados con Vulnerabilidad, Químicos SGA, PESV, Alturas y Compatibilidad Colaborador-Cargo FIT
    {
      "id": "am_1",
      "amenaza": "...",
      "tipo": "Natural",
      "origenSst": "Análisis de Vulnerabilidad (Diamante)",
      "calificacionDiamante": "Probable",
      "nivelVulnerabilidad": "Media",
      "riesgoGlobal": "Alto",
      "areaAfectada": "...",
      "medidasPrevencion": "...",
      "medidasMitigacion": "...",
      "responsable": "Comandante del Incidente / Brigada SST"
    }
  ],
  "procedimientosPon": [
    // 4 a 5 Procedimientos Operativos Normalizados (PON-01 a PON-05) detallando faseAntes, faseDurante y faseDespues
    {
      "id": "pon_1",
      "codigo": "PON-01",
      "tituloEscenario": "...",
      "amenazaAsociada": "...",
      "faseAntes": "...",
      "faseDurante": "...",
      "faseDespues": "...",
      "recursosNecesarios": "...",
      "responsableOperativo": "...",
      "estado": "Vigente"
    }
  ]
}`;

    const modelToUse = modelName || 'gemini-2.5-flash';
    let aiParsed = null;
    try {
      const result = await generateWithKeyRotation(modelToUse, userId, promptText);
      const rawText = (await result.response).text();
      aiParsed = parseGeminiJson(rawText);
    } catch (aiErr) {
      logger.warn('[SGSST PlanEmergencias] AI enrichment fallback to deterministic sync:', aiErr.message);
    }

    const finalSedeData = aiParsed?.sedeData
      ? buildDefaultSedeData(comp, { ...baseSync.sedeData, ...aiParsed.sedeData }, em.totalWorkers)
      : baseSync.sedeData;

    const finalEscenarios =
      Array.isArray(aiParsed?.escenariosAmenaza) && aiParsed.escenariosAmenaza.length > 0
        ? aiParsed.escenariosAmenaza.map((e, idx) => ({
            id: e.id || `am_ai_${Date.now()}_${idx}`,
            amenaza: e.amenaza || 'Escenario de Emergencia',
            tipo: ['Natural', 'Tecnológica', 'Social'].includes(e.tipo) ? e.tipo : 'Tecnológica',
            origenSst: e.origenSst || 'Ecosistema Somos SST',
            calificacionDiamante: ['Inminente', 'Probable', 'Posible'].includes(
              e.calificacionDiamante
            )
              ? e.calificacionDiamante
              : 'Probable',
            nivelVulnerabilidad: ['Alta', 'Media', 'Baja'].includes(e.nivelVulnerabilidad)
              ? e.nivelVulnerabilidad
              : 'Media',
            riesgoGlobal: computeEmergencyGlobalRisk(
              e.calificacionDiamante,
              e.nivelVulnerabilidad
            ),
            areaAfectada: e.areaAfectada || 'Instalaciones de la empresa',
            medidasPrevencion: e.medidasPrevencion || '',
            medidasMitigacion: e.medidasMitigacion || '',
            responsable: e.responsable || 'Responsable SG-SST / Jefe de Brigada',
            sentToKanban: false,
          }))
        : baseSync.escenariosAmenaza;

    const finalPon =
      Array.isArray(aiParsed?.procedimientosPon) && aiParsed.procedimientosPon.length > 0
        ? aiParsed.procedimientosPon.map((p, idx) => ({
            id: p.id || `pon_ai_${Date.now()}_${idx}`,
            codigo: p.codigo || `PON-0${idx + 1}`,
            tituloEscenario: p.tituloEscenario || `Procedimiento Operativo Normalizado ${idx + 1}`,
            amenazaAsociada: p.amenazaAsociada || 'Amenaza Identificada',
            faseAntes: p.faseAntes || '',
            faseDurante: p.faseDurante || '',
            faseDespues: p.faseDespues || '',
            recursosNecesarios: p.recursosNecesarios || 'Botiquín, Camilla, Extintores',
            responsableOperativo: p.responsableOperativo || 'Brigada de Emergencias',
            estado: ['Vigente', 'En Revisión', 'En Simulacro'].includes(p.estado)
              ? p.estado
              : 'Vigente',
            sentToKanban: false,
          }))
        : baseSync.procedimientosPon;

    const finalSci = baseSync.estructuraSci;
    const finalRecursos = baseSync.recursosEquipos;
    const finalDirectorios = baseSync.directoriosExternos;
    const finalSimulacros = baseSync.simulacrosPlan;

    await PlanEmergenciasData.findOneAndUpdate(
      filter,
      {
        $set: {
          sedeData: finalSedeData,
          escenariosAmenaza: finalEscenarios,
          estructuraSci: finalSci,
          procedimientosPon: finalPon,
          recursosEquipos: finalRecursos,
          directoriosExternos: finalDirectorios,
          simulacrosPlan: finalSimulacros,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const updatedMetrics = {
      ...em,
      escenariosCount: finalEscenarios.length,
      sciCount: finalSci.length,
      ponCount: finalPon.length,
      recursosCount: finalRecursos.length,
      simulacrosCount: finalSimulacros.length,
    };

    return res.json({
      success: true,
      sedeData: finalSedeData,
      escenariosAmenaza: finalEscenarios,
      estructuraSci: finalSci,
      procedimientosPon: finalPon,
      recursosEquipos: finalRecursos,
      directoriosExternos: finalDirectorios,
      simulacrosPlan: finalSimulacros,
      ecosystemMetrics: updatedMetrics,
      message:
        'Plan de Emergencias y Contingencias (PPRE) estructurado exitosamente con IA y datos reales de Somos SST.',
    });
  } catch (error) {
    logger.error('[SGSST PlanEmergencias] Error in generate-ai:', error);
    res.status(500).json({ error: error.message || 'Error al generar el Plan de Emergencias con IA.' });
  }
});

/**
 * POST /api/sgsst/plan-emergencias/suggest-item
 * Asistente IA granular para autocompletar/crear:
 * mode: 'amenaza' | 'pon' | 'sci' | 'recurso' | 'simulacro' | 'medevac'
 */
router.post('/suggest-item', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company } = await resolveUserAndCompany(req.user);
    const { mode = 'amenaza', inputData = {}, modelName } = req.body;
    const companyContextStr = buildCompanyContextString(company || {});
    const modelToUse = modelName || 'gemini-2.5-flash';

    if (mode === 'amenaza') {
      const draftName = inputData.amenaza || 'Incendio o explosión en área operativa';
      const prompt = `Eres un Especialista en Gestión del Riesgo y Planes de Emergencias (Dec. 1072/2015 Art. 2.2.4.6.25 y Diamante de Colores).
Contexto de la empresa:
${companyContextStr}

El usuario está estructurando el siguiente escenario de amenaza: "${draftName}".
Devuelve ÚNICAMENTE un objeto JSON válido:
{
  "item": {
    "amenaza": "${draftName}",
    "tipo": "Tecnológica",
    "origenSst": "Análisis de Vulnerabilidad (Diamante)",
    "calificacionDiamante": "Probable",
    "nivelVulnerabilidad": "Media",
    "riesgoGlobal": "Alto",
    "areaAfectada": "Área específica expuesta...",
    "medidasPrevencion": "Controles preventivos en fuente y medio antes de la emergencia...",
    "medidasMitigacion": "Acciones tácticas de respuesta y mitigación durante la emergencia...",
    "responsable": "Comandante del Incidente / Brigada SST"
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      const item = parsed.item || parsed;
      item.riesgoGlobal = computeEmergencyGlobalRisk(
        item.calificacionDiamante,
        item.nivelVulnerabilidad
      );
      return res.json({ success: true, item });
    }

    if (mode === 'pon') {
      const draftTitle = inputData.tituloEscenario || inputData.amenazaAsociada || 'Evacuación y Control de Emergencia';
      const prompt = `Eres un Comandante de Incidentes experto en Procedimientos Operativos Normalizados (PON) bajo ISO 45001 Cl. 8.2 y Dec. 1072/2015.
Contexto de la empresa:
${companyContextStr}

Diseña un Procedimiento Operativo Normalizado (PON) paso a paso para: "${draftTitle}".
Devuelve ÚNICAMENTE un objeto JSON válido:
{
  "item": {
    "codigo": "${inputData.codigo || 'PON-01'}",
    "tituloEscenario": "PON: ${draftTitle}",
    "amenazaAsociada": "${inputData.amenazaAsociada || draftTitle}",
    "faseAntes": "Actividades preventivas, inspección y preparación antes del evento...",
    "faseDurante": "Pasos tácticos secuenciales durante la emergencia (alarma, control, evacuación)...",
    "faseDespues": "Verificación en punto de encuentro, censo, evaluación de daños y retorno...",
    "recursosNecesarios": "Equipos, extintores, camilla, botiquín y comunicaciones requeridas...",
    "responsableOperativo": "Comandante del Incidente / Líder de Brigada",
    "estado": "Vigente"
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      return res.json({ success: true, item: parsed.item || parsed });
    }

    if (mode === 'sci') {
      const draftRol = inputData.rolSci || 'Líder de Brigada de Evacuación';
      const prompt = `Eres un Instructor de Sistema Comando de Incidentes (SCI) y Brigadas de Emergencia en Colombia.
Contexto de la empresa:
${companyContextStr}

Define las responsabilidades operativas Antes, Durante y Después para el rol SCI: "${draftRol}".
Devuelve ÚNICAMENTE un objeto JSON válido:
{
  "item": {
    "rolSci": "${draftRol}",
    "nombreAsignado": "${inputData.nombreAsignado || 'Brigadista Designado'}",
    "cargoEmpresa": "${inputData.cargoEmpresa || 'Líder Operativo'}",
    "telefonoContacto": "${inputData.telefonoContacto || ''}",
    "especialidadBrigada": "${inputData.especialidadBrigada || 'Comando de Incidente (SCI)'}",
    "funcionesAntes": "Responsabilidades de preparación, capacitación e inspección previa...",
    "funcionesDurante": "Funciones tácticas de mando o intervención durante la emergencia...",
    "funcionesDespues": "Funciones de evaluación, censo, reposición y cierre post-evento..."
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      return res.json({ success: true, item: parsed.item || parsed });
    }

    if (mode === 'recurso') {
      const draftDesc = inputData.descripcion || 'Extintor Multipropósito ABC 10 lb';
      const prompt = `Eres un Inspector de Seguridad Humana y Protección Contraincendios (NTC 2885 / Res. 2400).
Completa la ficha técnica del siguiente recurso de emergencias: "${draftDesc}".
Devuelve ÚNICAMENTE un objeto JSON válido:
{
  "item": {
    "tipoRecurso": "${inputData.tipoRecurso || 'Extintor'}",
    "descripcion": "Descripción técnica normada del equipo...",
    "ubicacion": "Ubicación estratégica recomendada...",
    "cantidad": ${Number(inputData.cantidad || 2)},
    "estado": "Operativo",
    "fechaInspeccion": "${new Date().toISOString().slice(0, 10)}",
    "responsable": "Brigada de Emergencia / SST"
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      return res.json({ success: true, item: parsed.item || parsed });
    }

    if (mode === 'simulacro') {
      const draftSim = inputData.tituloSimulacro || 'Simulacro de Evacuación y Rescate';
      const prompt = `Eres un Consultor Sénior SG-SST experto en planeación y evaluación de Simulacros de Emergencia (Art. 2.2.4.6.25 Numeral 10 Dec. 1072/2015).
Estructura el siguiente simulacro: "${draftSim}".
Devuelve ÚNICAMENTE un objeto JSON válido:
{
  "item": {
    "tituloSimulacro": "${draftSim}",
    "escenario": "Descripción del escenario supuesto, activación de alarma y evacuación...",
    "fechaProgramada": "${inputData.fechaProgramada || `${new Date().getFullYear()}-10-24`}",
    "participantesEsperados": ${Number(inputData.participantesEsperados || company?.workerCount || 15)},
    "tiempoRespuestaMeta": "< 3 minutos hasta Punto de Encuentro",
    "estado": "Programado",
    "hallazgosMejora": "Criterios de evaluación, tiempos de salida y puntos de mejora a verificar...",
    "responsable": "Responsable SG-SST / Jefe de Brigada"
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      return res.json({ success: true, item: parsed.item || parsed });
    }

    if (mode === 'medevac') {
      const city = inputData.ciudad || company?.city || 'Bogotá D.C.';
      const arl = inputData.arlNombre || company?.arl || 'ARL';
      const prompt = `Eres un Médico Especialista en Salud Ocupacional y Planes MEDEVAC en Colombia.
Sugiere los datos óptimos de evacuación médica (MEDEVAC), rutas de evacuación y alarma para una sede ubicada en "${city}" afiliada a "${arl}".
Devuelve ÚNICAMENTE un objeto JSON válido:
{
  "item": {
    "puntoEncuentroPrincipal": "...",
    "puntoEncuentroAlterno": "...",
    "rutasEvacuacionDesc": "...",
    "sistemaAlarma": "...",
    "clinicaMedevac": "Clínica u Hospital Nivel III/IV real de referencia en ${city}...",
    "direccionClinica": "...",
    "tiempoTrasladoMedevac": "10 a 15 minutos",
    "ambulanciaContacto": "Línea 123 / Red de Urgencias ${arl}",
    "arlLineaEmergencia": "Línea Nacional ATEL ${arl} 24/7"
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      return res.json({ success: true, item: parsed.item || parsed });
    }

    return res.status(400).json({ error: 'Modo de sugerencia no válido.' });
  } catch (error) {
    logger.error('[SGSST PlanEmergencias] Error in suggest-item:', error);
    res.status(500).json({ error: error.message || 'Error al generar sugerencia con IA.' });
  }
});

/**
 * POST /api/sgsst/plan-emergencias/send-to-kanban
 * Envía una amenaza (`escenariosAmenaza`), un PON (`procedimientosPon`) o un simulacro (`simulacrosPlan`)
 * directamente al Centro de Control Kanban / ACPM.
 */
router.post('/send-to-kanban', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId: rawCompanyId } = await resolveUserAndCompany(req.user);
    const companyId = rawCompanyId ? String(rawCompanyId) : undefined;

    const {
      itemId,
      itemType = 'amenaza',
      title,
      description,
      priority = 'alta',
      actionType = 'preventiva',
      assignedTo = 'Responsable SG-SST / Jefe de Brigada',
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'El título de la acción es requerido.' });
    }

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const refId = itemId ? String(itemId) : `ppre_kan_${Date.now()}`;

    let task = await KanbanTask.findOne({
      user: userId,
      ...(companyId ? { companyId } : {}),
      referenceId: refId,
    });

    const refLabel =
      itemType === 'pon'
        ? 'Procedimiento Operativo Normalizado (PON)'
        : itemType === 'simulacro'
          ? 'Simulacro de Emergencia Programado'
          : 'Control de Escenario de Amenaza (PPRE)';

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
        sourceModule: 'Plan de Emergencias y Contingencias (PPRE - Dec. 1072 Art. 2.2.4.6.25)',
        assignedTo,
        referenceId: refId,
        referenceName: refLabel,
      });
    }

    // Marcar sentToKanban: true en PlanEmergenciasData
    if (itemId) {
      const ppreDoc = await PlanEmergenciasData.findOne({
        user: userId,
        ...(company?._id ? { companyId: company._id } : {}),
      });
      if (ppreDoc) {
        let modified = false;
        (ppreDoc.escenariosAmenaza || []).forEach((e) => {
          if (e.id === itemId) {
            e.sentToKanban = true;
            modified = true;
          }
        });
        (ppreDoc.procedimientosPon || []).forEach((p) => {
          if (p.id === itemId) {
            p.sentToKanban = true;
            modified = true;
          }
        });
        (ppreDoc.simulacrosPlan || []).forEach((s) => {
          if (s.id === itemId) {
            s.sentToKanban = true;
            modified = true;
          }
        });
        if (modified) {
          ppreDoc.markModified('escenariosAmenaza');
          ppreDoc.markModified('procedimientosPon');
          ppreDoc.markModified('simulacrosPlan');
          await ppreDoc.save();
        }
      }
    }

    return res.json({
      success: true,
      task,
      message: `Acción "${task.title}" enviada exitosamente al Centro de Control Kanban / ACPM.`,
    });
  } catch (error) {
    logger.error('[SGSST PlanEmergencias] Error sending to Kanban:', error);
    res.status(500).json({ error: 'Error al enviar al Centro de Control Kanban.' });
  }
});

/**
 * POST /api/sgsst/plan-emergencias/generate-report
 * Construye el Documento Maestro Oficial del Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE)
 * con estilos inline hexadecimales planos compatibles con Word/PDF (html-docx), 10 secciones técnicas y firmas digitales.
 */
router.post('/generate-report', requireJwtAuth, async (req, res) => {
  try {
    const { targetUserId: userId, company, companyId } = await resolveUserAndCompany(req.user);
    const context = await gatherCompanyFullContext(userId, companyId);
    const em = sanitizeEcosystemMetrics(context.ecosystemMetrics);

    const {
      sedeData = {},
      escenariosAmenaza = [],
      estructuraSci = [],
      procedimientosPon = [],
      recursosEquipos = [],
      directoriosExternos = [],
      simulacrosPlan = [],
      modelName,
    } = req.body;

    const sede = buildDefaultSedeData(company, sedeData, em.totalWorkers);
    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generar recomendación táctica ejecutiva con IA (con fallback inmediato si no hay cuota)
    let aiExecutiveAnalysisHtml = `
      <p style="margin: 0 0 8px 0; font-size: 11.5px; color: #1e293b;">
        <strong>Dictamen Táctico de Preparación y Respuesta ante Emergencias:</strong> La organización <strong>${company?.companyName || sede.nombreSede}</strong> cuenta con una estructura operativa bajo el Sistema Comando de Incidentes (SCI) articulada con ${escenariosAmenaza.length} escenarios de amenaza valorados mediante la metodología de Diamante de Colores, ${procedimientosPon.length} Procedimientos Operativos Normalizados (PON), ${recursosEquipos.length} líneas de equipos de emergencia y ${simulacrosPlan.length} simulacros programados.
      </p>
      <p style="margin: 0; font-size: 11.5px; color: #1e293b;">
        <strong>Articulación Biocéntrica y Operativa:</strong> Se integra el protocolo de Evacuación Médica Prioritaria (MEDEVAC) hacia <strong>${sede.clinicaMedevac}</strong> considerando los ${em.workersWithFitAlerts} colaboradores con alertas de Compatibilidad Cargo-Persona (FIT Promedio: ${em.avgFitScore}%), así como los controles de ingeniería para peligros críticos GTC-45 (${em.peligrosCriticos}), sustancias químicas SGA (${em.quimicosCount}) y seguridad vial PESV (${em.vehiculosCount} vehículos).
      </p>`;

    try {
      const aiPrompt = `Redacta en 2 párrafos técnicos y ejecutivos (sin etiquetas markdown ni bloques de código, solo texto plano profesional) las Conclusiones y Recomendaciones Tácticas del Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE) para la empresa "${company?.companyName || 'la Organización'}" (${sede.ciudad}), considerando que tiene ${sede.trabajadoresFijos} trabajadores fijos, ${escenariosAmenaza.length} amenazas identificadas, ${estructuraSci.length} cargos en el Sistema Comando de Incidentes (SCI), ${procedimientosPon.length} PONs, ${em.workersWithFitAlerts} trabajadores con alertas médicas FIT y clínica MEDEVAC "${sede.clinicaMedevac}".`;
      const aiRes = await generateWithKeyRotation(modelName || 'gemini-2.5-flash', userId, aiPrompt);
      const text = (await aiRes.response).text();
      if (text && text.trim().length > 40) {
        const paragraphs = text
          .trim()
          .split(/\n+/)
          .filter(Boolean)
          .map(
            (p) =>
              `<p style="margin: 0 0 8px 0; font-size: 11.5px; color: #1e293b; line-height: 1.55;">${p.replace(/[*#`]/g, '')}</p>`
          )
          .join('');
        aiExecutiveAnalysisHtml = paragraphs;
      }
    } catch (_) {
      // Mantiene el dictamen determinista enriquecido
    }

    const headerHtml = buildStandardHeader({
      title: 'PLAN DE PREVENCIÓN, PREPARACIÓN Y RESPUESTA ANTE EMERGENCIAS Y CONTINGENCIAS (PPRE)',
      companyInfo: company,
      date: currentDate,
      norm: 'Dec. 1072/2015 Art. 2.2.4.6.25 · Res. 0312/2019 Est. 1.1.11 y 5.1.1 · ISO 45001:2018 Num. 8.2 · Ley 1523/2012',
      responsibleName: req.user?.name,
      documentCode: 'SST-PPRE-001',
    });

    // Tabla 3: Escenarios de Amenaza (Diamante de Colores)
    const escenariosRows =
      escenariosAmenaza.length > 0
        ? escenariosAmenaza
            .map((e, idx) => {
              const lvl =
                e.riesgoGlobal ||
                computeEmergencyGlobalRisk(e.calificacionDiamante, e.nivelVulnerabilidad);
              const badgeBg =
                lvl === 'Alto' ? '#dc2626' : lvl === 'Medio' ? '#d97706' : '#059669';
              return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10.5px; color: #1e293b;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e; vertical-align: top;">
            ${e.amenaza}
            <div style="font-size: 9.5px; font-weight: normal; color: #64748b; margin-top: 2px;">
              Tipo: <strong>${e.tipo || 'Natural'}</strong> · Origen: ${e.origenSst || 'Vulnerabilidad'}
            </div>
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; vertical-align: top;">
            <strong>${e.calificacionDiamante || 'Probable'}</strong><br/>
            <span style="font-size: 9.5px; color: #475569;">Vulnerabilidad: ${e.nivelVulnerabilidad || 'Media'}</span>
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; vertical-align: top;">
            <span style="display: inline-block; padding: 2px 8px; background-color: ${badgeBg}; color: #ffffff; font-weight: 700; font-size: 9.5px;">
              ${lvl.toUpperCase()}
            </span>
            <div style="font-size: 9px; color: #475569; margin-top: 3px;">${e.areaAfectada || 'Planta general'}</div>
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${e.medidasPrevencion || 'Controles preventivos SST'}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">
            ${e.medidasMitigacion || 'Activación de PON y Brigada'}
            <div style="font-size: 9.5px; color: #0f766e; margin-top: 3px;"><strong>Resp:</strong> ${e.responsable || 'Jefe de Brigada'}</div>
          </td>
        </tr>`;
            })
            .join('')
        : `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8; border: 1px solid #cbd5e1;">No se han registrado escenarios de amenaza</td></tr>`;

    // Tabla 4: Estructura SCI y Brigada
    const sciRows =
      estructuraSci.length > 0
        ? estructuraSci
            .map(
              (s, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10.5px; color: #1e293b;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e; vertical-align: top;">
            ${s.rolSci}
            <div style="font-size: 9.5px; font-weight: normal; color: #64748b; margin-top: 2px;">${s.especialidadBrigada || 'SCI'}</div>
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">
            <strong>${s.nombreAsignado || 'Asignado'}</strong><br/>
            <span style="font-size: 9.5px; color: #475569;">${s.cargoEmpresa || ''} · Tel: ${s.telefonoContacto || 'N/A'}</span>
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${s.funcionesAntes || 'Preparación e inspección'}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${s.funcionesDurante || 'Atención táctica y evacuación'}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${s.funcionesDespues || 'Evaluación y retorno'}</td>
        </tr>`
            )
            .join('')
        : `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8; border: 1px solid #cbd5e1;">No se han registrado roles del SCI</td></tr>`;

    // Tabla 5: Procedimientos Operativos Normalizados (PON)
    const ponRows =
      procedimientosPon.length > 0
        ? procedimientosPon
            .map(
              (p, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10.5px; color: #1e293b;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e; vertical-align: top;">
            ${p.codigo || `PON-0${idx + 1}`}: ${p.tituloEscenario}
            <div style="font-size: 9.5px; font-weight: normal; color: #64748b; margin-top: 2px;">
              Amenaza: <strong>${p.amenazaAsociada || 'General'}</strong> · Estado: ${p.estado || 'Vigente'}
            </div>
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${p.faseAntes || 'Preparación previa'}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${p.faseDurante || 'Respuesta inmediata'}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${p.faseDespues || 'Verificación y cierre'}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">
            ${p.recursosNecesarios || 'Equipos de brigada'}
            <div style="font-size: 9.5px; color: #0f766e; margin-top: 3px;"><strong>Líder:</strong> ${p.responsableOperativo || 'Brigada'}</div>
          </td>
        </tr>`
            )
            .join('')
        : `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8; border: 1px solid #cbd5e1;">No se han registrado procedimientos PON</td></tr>`;

    // Tabla 6: Inventario de Recursos y Equipos
    const recursosRows =
      recursosEquipos.length > 0
        ? recursosEquipos
            .map(
              (r, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10.5px; color: #1e293b;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e;">${r.tipoRecurso}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${r.descripcion}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${r.ubicacion}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700;">${r.cantidad}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">
            <strong>${r.estado || 'Operativo'}</strong>
            <div style="font-size: 9.5px; color: #64748b;">Insp: ${r.fechaInspeccion || 'Vigente'} · ${r.responsable || 'SST'}</div>
          </td>
        </tr>`
            )
            .join('')
        : `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8; border: 1px solid #cbd5e1;">No se han registrado equipos de emergencia</td></tr>`;

    // Tabla 7: Directorio de Entidades de Socorro
    const dirList =
      directoriosExternos.length > 0
        ? directoriosExternos
        : buildDefaultDirectorioExterno(sede.ciudad, sede.arlNombre);
    const directoriosRows = dirList
      .map(
        (d, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10.5px; color: #1e293b;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e;">${d.entidad}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 800; color: #dc2626; text-align: center;">${d.lineaTelefonica}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${d.direccionDistancia}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${d.tipoApoyo}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">${d.tiempoRespuestaEstimado}</td>
        </tr>`
      )
      .join('');

    // Tabla 8: Programa Anual de Simulacros
    const simulacrosRows =
      simulacrosPlan.length > 0
        ? simulacrosPlan
            .map(
              (s, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10.5px; color: #1e293b;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e;">${s.tituloSimulacro}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${s.escenario}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">
            <strong>${s.fechaProgramada || 'Anual'}</strong><br/>
            <span style="font-size: 9.5px; color: #059669;">${s.estado || 'Programado'} (${s.participantesEsperados || 10} pers.)</span>
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${s.tiempoRespuestaMeta}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">
            ${s.hallazgosMejora || 'Evaluación de alarma, evacuación y censo'}
            <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;"><strong>Resp:</strong> ${s.responsable || 'SST'}</div>
          </td>
        </tr>`
            )
            .join('')
        : `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8; border: 1px solid #cbd5e1;">No se han registrado simulacros</td></tr>`;

    const totalOcupacion =
      Number(sede.trabajadoresFijos || 0) +
      Number(sede.contratistasFlotantes || 0) +
      Number(sede.visitantesPromedio || 0);

    const reportBody = `
<div style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; line-height: 1.55; max-width: 100%;">

  <!-- 1. ARTICULACIÓN CON EL ECOSISTEMA 360° SOMOS SST -->
  <div style="margin-bottom: 22px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      1. Objeto Normativo y Articulación con el Ecosistema 360° Somos SST
    </h3>
    <p style="margin: 0 0 10px 0; font-size: 11px; color: #334155;">
      El presente <strong>Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE)</strong> se estructura en cumplimiento estricto del <strong>Artículo 2.2.4.6.25 del Decreto 1072 de 2015</strong>, los <strong>Estándares 1.1.11 y 5.1.1 de la Resolución 0312 de 2019</strong>, la <strong>Ley 1523 de 2012</strong> y el numeral <strong>8.2 de ISO 45001:2018</strong>, alimentándose en tiempo real de las 16 fuentes operativas de <strong>${company?.companyName || sede.nombreSede}</strong>:
    </p>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 7px 10px; border: 1px solid #0f766e; text-align: left; width: 28%;">Fuente del Ecosistema Somos SST</th>
          <th style="padding: 7px 10px; border: 1px solid #0f766e; text-align: left; width: 32%;">Indicador Real Sincronizado</th>
          <th style="padding: 7px 10px; border: 1px solid #0f766e; text-align: left; width: 40%;">Integración en el Plan de Emergencias (PPRE)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background-color: #ffffff;">
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Análisis de Vulnerabilidad y Brigada</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1;"><strong>${escenariosAmenaza.length}</strong> amenazas valoradas · <strong>${em.brigadistasCount}</strong> brigadistas · <strong>${estructuraSci.length}</strong> roles SCI</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1;">Define los escenarios del Diamante de Colores, PONs y cadena de mando SCI.</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Compatibilidad Colaborador-Cargo (FIT)</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1;"><strong>${em.totalWorkers}</strong> trabajadores · FIT Promedio: <strong>${em.avgFitScore}%</strong> · Alertas médicas: <strong>${em.workersWithFitAlerts}</strong></td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1;">Prioriza la evacuación asistida y el protocolo MEDEVAC según condiciones de salud individuales.</td>
        </tr>
        <tr style="background-color: #ffffff;">
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700;">GTC-45, Químicos SGA, PESV y Alturas</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1;">Peligros críticos: <strong>${em.peligrosCriticos}</strong> · Químicos SGA: <strong>${em.quimicosCount}</strong> · Flota PESV: <strong>${em.vehiculosCount}</strong> · Alturas: <strong>${em.permisosAlturasCount}</strong></td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1;">Activa protocolos específicos HAZMAT/Derrames SGA, Siniestro Vial y Rescate Vertical en Alturas.</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Auditoría 1072, Alta Dirección y 0312</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1;">Auditoría: <strong>${em.auditoriaScore}%</strong> · 0312: <strong>${em.diagnosticoScore}%</strong> · Capacitaciones: <strong>${em.capacitacionesCompliancePct}%</strong></td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1;">Garantiza recursos gerenciales, formación de brigada y evaluación anual de simulacros.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 2. CARACTERIZACIÓN DE LA SEDE, CARGA OCUPACIONAL, ALARMA, EVACUACIÓN Y MEDEVAC -->
  <div style="margin-bottom: 22px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      2. Caracterización de la Instalación, Carga Ocupacional, Rutas de Evacuación y Plan MEDEVAC
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: 700; width: 22%;">Sede y Ubicación Geográfica:</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; width: 28%;">${sede.nombreSede} (${sede.ciudad} — ${sede.direccion})</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: 700; width: 22%;">Horario y Teléfono Emergencia:</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; width: 28%;">${sede.horarioOperacion} · Tel: ${sede.telefonoEmergencia}</td>
      </tr>
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: 700;">Carga Ocupacional Total:</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><strong>${totalOcupacion} personas</strong> (${sede.trabajadoresFijos} fijos, ${sede.contratistasFlotantes} contratistas, ${sede.visitantesPromedio} visitantes)</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: 700;">Características Constructivas:</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${sede.construccionTipo}</td>
      </tr>
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: 700;">Punto de Encuentro Principal:</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; color: #047857; font-weight: 700;">${sede.puntoEncuentroPrincipal}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: 700;">Punto de Encuentro Alterno:</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${sede.puntoEncuentroAlterno}</td>
      </tr>
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: 700;">Sistema de Alarma y Alerta:</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${sede.sistemaAlarma}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: 700;">Rutas y Salidas de Evacuación:</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${sede.rutasEvacuacionDesc}</td>
      </tr>
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; background-color: #fef2f2; font-weight: 700; color: #991b1b;">Centro Médico MEDEVAC:</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><strong>${sede.clinicaMedevac}</strong> (${sede.direccionClinica} · Traslado: ${sede.tiempoTrasladoMedevac})</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; background-color: #fef2f2; font-weight: 700; color: #991b1b;">ARL y Ambulancia 24/7:</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><strong>${sede.arlNombre}</strong> (${sede.arlLineaEmergencia}) · ${sede.ambulanciaContacto}</td>
      </tr>
    </table>
  </div>

  <!-- 3. MATRIZ DE ESCENARIOS DE AMENAZA Y VULNERABILIDAD (DIAMANTE DE COLORES) -->
  <div style="margin-bottom: 22px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      3. Identificación de Amenazas y Análisis de Vulnerabilidad (Diamante de Colores)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 22%; text-align: left;">Amenaza / Escenario</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 15%; text-align: center;">Calificación / Vuln.</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 15%; text-align: center;">Riesgo Global / Área</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 24%; text-align: left;">Medidas de Prevención</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 24%; text-align: left;">Medidas de Mitigación y Respuesta</th>
        </tr>
      </thead>
      <tbody>
        ${escenariosRows}
      </tbody>
    </table>
  </div>

  <!-- 4. ESTRUCTURA DEL SISTEMA COMANDO DE INCIDENTES (SCI) Y BRIGADA DE EMERGENCIAS -->
  <div style="margin-bottom: 22px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      4. Estructura Organizacional para Atención de Emergencias (Sistema Comando de Incidentes - SCI y Brigada)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 18%; text-align: left;">Rol en el SCI / Brigada</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 20%; text-align: left;">Responsable Designado</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 20%; text-align: left;">Funciones ANTES</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 22%; text-align: left;">Funciones DURANTE</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 20%; text-align: left;">Funciones DESPUÉS</th>
        </tr>
      </thead>
      <tbody>
        ${sciRows}
      </tbody>
    </table>
  </div>

  <!-- 5. PROCEDIMIENTOS OPERATIVOS NORMALIZADOS (PON) -->
  <div style="margin-bottom: 22px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      5. Procedimientos Operativos Normalizados (PON — Actuación Antes, Durante y Después)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 18%; text-align: left;">Código y Escenario PON</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 21%; text-align: left;">Fase ANTES (Prevención)</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 23%; text-align: left;">Fase DURANTE (Respuesta)</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 20%; text-align: left;">Fase DESPUÉS (Recuperación)</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 18%; text-align: left;">Recursos y Responsable</th>
        </tr>
      </thead>
      <tbody>
        ${ponRows}
      </tbody>
    </table>
  </div>

  <!-- 6. INVENTARIO DE RECURSOS Y EQUIPOS DE ATENCIÓN DE EMERGENCIAS -->
  <div style="margin-bottom: 22px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      6. Inventario de Recursos Técnicos y Equipos para Atención de Emergencias
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 18%; text-align: left;">Tipo de Recurso</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 32%; text-align: left;">Descripción Técnica / Especificación</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 22%; text-align: left;">Ubicación</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 10%; text-align: center;">Cant.</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 18%; text-align: left;">Estado e Inspección</th>
        </tr>
      </thead>
      <tbody>
        ${recursosRows}
      </tbody>
    </table>
  </div>

  <!-- 7. DIRECTORIO DE ENTIDADES DE SOCORRO Y AYUDA MUTUA -->
  <div style="margin-bottom: 22px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      7. Directorio de Entidades de Socorro Externo, Red Hospitalaria y Ayuda Mutua
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 25%; text-align: left;">Entidad de Socorro / Emergencia</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 15%; text-align: center;">Línea Telefónica</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 22%; text-align: left;">Jurisdicción / Ubicación</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 25%; text-align: left;">Tipo de Apoyo</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 13%; text-align: center;">Tiempo Resp.</th>
        </tr>
      </thead>
      <tbody>
        ${directoriosRows}
      </tbody>
    </table>
  </div>

  <!-- 8. CRONOGRAMA Y EVALUACIÓN ANUAL DE SIMULACROS -->
  <div style="margin-bottom: 22px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      8. Programa Anual de Simulacros y Evaluación de Preparación (Dec. 1072 Art. 2.2.4.6.25 Num. 10)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 22%; text-align: left;">Simulacro Programado</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 24%; text-align: left;">Escenario / Hipótesis</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 14%; text-align: center;">Fecha y Estado</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 16%; text-align: left;">Meta de Tiempo</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; width: 24%; text-align: left;">Criterios de Evaluación y Mejora</th>
        </tr>
      </thead>
      <tbody>
        ${simulacrosRows}
      </tbody>
    </table>
  </div>

  <!-- 9. ANÁLISIS TÉCNICO Y RECOMENDACIONES IA -->
  <div style="margin-bottom: 26px; padding: 14px 18px; background-color: #f0fdfa; border: 1px solid #99f6e4; border-left: 4px solid #0f766e;">
    <h3 style="margin: 0 0 8px 0; color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase;">
      9. Dictamen Técnico Táctico-Operativo y Recomendaciones de Mejora Continua
    </h3>
    ${aiExecutiveAnalysisHtml}
  </div>

</div>`;

    const signaturesHtml = company ? buildSignatureSection(company) : '';
    const fullReportHtml = `${headerHtml}\n${reportBody}\n${signaturesHtml}`;

    // Guardar en conversación de LibreChat con tag sgsst-plan-emergencias
    let conversationId = null;
    let messageId = null;
    try {
      conversationId = crypto.randomUUID();
      messageId = crypto.randomUUID();
      await saveConvo(
        {
          userId: req.user.id,
          isTemporary: false,
        },
        {
          conversationId,
          title: `Plan de Emergencias y Contingencias (PPRE) - ${company?.companyName || sede.nombreSede}`,
          endpoint: 'google',
          model: modelName || 'gemini-2.5-flash',
        }
      );
      await saveMessage(
        {
          userId: req.user.id,
          isTemporary: false,
        },
        {
          messageId,
          conversationId,
          sender: 'Wappy SST',
          text: fullReportHtml,
          isCreatedByUser: false,
          endpoint: 'google',
          model: modelName || 'gemini-2.5-flash',
        }
      );
      await updateTagsForConversation(req.user.id, conversationId, ['sgsst-plan-emergencias']);
    } catch (convoErr) {
      logger.debug('[SGSST PlanEmergencias] Optional conversation save skipped:', convoErr.message);
    }

    await PlanEmergenciasData.findOneAndUpdate(
      { user: userId, ...(companyId ? { companyId } : {}) },
      {
        $set: {
          sedeData: sede,
          escenariosAmenaza,
          estructuraSci,
          procedimientosPon,
          recursosEquipos,
          directoriosExternos: dirList,
          simulacrosPlan,
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
      conversationId,
      messageId,
    });
  } catch (error) {
    logger.error('[SGSST PlanEmergencias] Error generating report:', error);
    res.status(500).json({ error: error.message || 'Error al generar el Documento Maestro del Plan de Emergencias.' });
  }
});

module.exports = router;
