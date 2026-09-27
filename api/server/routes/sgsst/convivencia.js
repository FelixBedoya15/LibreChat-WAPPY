const express = require('express');
const router = express.Router();
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const CompanyInfo = require('../../../models/CompanyInfo');
const { SgsstConvivenciaComite, SgsstConvivenciaActa, SgsstConvivenciaCaso } = require('../../../models/SgsstConvivencia');
const { SgsstEleccion } = require('../../../models/SgsstCopasst');
const { SgsstPadronVotante, SgsstVotoAnonimo } = require('../../../models/SgsstVotacion');
const { generateWithKeyRotation } = require('./sgsstGemini');
const { logger } = require('~/config');

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompany(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
  if (!active) active = await CompanyInfo.findOne({ user: userId }).lean();
  return active;
}

// ─── 1. GET /config — Configuración, Comités por Centros y Semáforo de Casos ───
router.get('/config', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    // Resolución 3461 de 2025: Comités de convivencia pueden operar por centro de trabajo
    const comites = await SgsstConvivenciaComite.find({ companyId: company._id }).sort({ createdAt: -1 });

    const currentYear = new Date().getFullYear();
    const actas = await SgsstConvivenciaActa.find({ companyId: company._id, anio: currentYear }).sort({ trimestre: 1 });
    const casos = await SgsstConvivenciaCaso.find({ companyId: company._id }).sort({ createdAt: -1 });

    // Semáforo de los 65 días calendario de la Resolución 3461 de 2025
    const now = new Date();
    let casosEnTramite = 0;
    let casosPorVencer = 0; // Menos de 15 días para el tope de 65 días
    let casosAcosoSexualUrgente = 0;

    casos.forEach((c) => {
      if (['radicado', 'en_tramite', 'audiencia_conciliacion'].includes(c.estado)) {
        casosEnTramite++;
        const limit = new Date(c.fechaLimite65Dias);
        const diffDays = Math.ceil((limit - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 15 && diffDays >= 0) {
          casPorVencer = (casosPorVencer || 0) + 1;
        }
      }
      if (c.tipoAcoso === 'sexual_ley_2365' && c.estado !== 'archivado') {
        casosAcosoSexualUrgente++;
      }
    });

    const elecciones = await SgsstEleccion.find({ companyId: company._id, tipoComite: 'cocolab' }).sort({ createdAt: -1 });

    res.json({
      company: {
        id: company._id,
        companyName: company.companyName,
      },
      comites,
      totalActas: actas.length,
      actasTrimestralesEsperadas: 4, // 1 por trimestre obligatoria bajo Res. 3461/2025
      estadisticasCasos: {
        totalCasos: casos.length,
        casosEnTramite,
        casosPorVencer,
        casosAcosoSexualUrgente,
      },
      eleccionActiva: elecciones.find((e) => e.estado === 'activa') || null,
    });
  } catch (error) {
    logger.error('[CONVIVENCIA] GET /config error:', error);
    res.status(500).json({ error: 'Error al consultar configuración de Convivencia' });
  }
});

// ─── 2. POST /comite — Guardar Estructura del Comité de Convivencia ───────────
router.post('/comite', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const {
      id,
      centroTrabajo,
      periodoInicio,
      periodoFin,
      representantesEmpleador,
      representantesTrabajadores,
      observaciones,
    } = req.body;

    let comite;
    if (id) {
      comite = await SgsstConvivenciaComite.findOne({ _id: id, companyId: company._id });
    }

    if (!comite) {
      comite = new SgsstConvivenciaComite({
        companyId: company._id,
        user: req.user.id,
        centroTrabajo: centroTrabajo || 'Sede Principal',
      });
    }

    if (centroTrabajo) comite.centroTrabajo = centroTrabajo;
    if (periodoInicio) comite.periodoInicio = periodoInicio;
    if (periodoFin) comite.periodoFin = periodoFin;
    if (Array.isArray(representantesEmpleador)) comite.representantesEmpleador = representantesEmpleador;
    if (Array.isArray(representantesTrabajadores)) comite.representantesTrabajadores = representantesTrabajadores;
    if (observaciones !== undefined) comite.observaciones = observaciones;

    await comite.save();
    res.json({ success: true, comite });
  } catch (error) {
    logger.error('[CONVIVENCIA] POST /comite error:', error);
    res.status(500).json({ error: 'Error al guardar comité de convivencia' });
  }
});

// ─── 3. GET /casos — Bandeja Confidencial de Quejas & Trámites (Res. 3461/25) ───
router.get('/casos', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const casos = await SgsstConvivenciaCaso.find({ companyId: company._id }).sort({ createdAt: -1 });

    const now = new Date();
    // Inyectar cálculo dinámico de días restantes del plazo perentorio de 65 días
    const casosEnriquecidos = casos.map((c) => {
      const obj = c.toObject();
      const limit = new Date(c.fechaLimite65Dias);
      const diffMs = limit.getTime() - now.getTime();
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      obj.diasRestantes = diasRestantes;
      obj.vencido65Dias = diasRestantes < 0 && !['acuerdo_conciliatorio', 'no_acuerdo_alta_direccion', 'archivado'].includes(c.estado);
      return obj;
    });

    res.json({ casos: casosEnriquecidos });
  } catch (error) {
    logger.error('[CONVIVENCIA] GET /casos error:', error);
    res.status(500).json({ error: 'Error al consultar casos confidenciales' });
  }
});

// ─── 4. POST /casos/:id/actuacion — Registrar Diligencia o Audiencia ──────────
router.post('/casos/:id/actuacion', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const { tipo, descripcion, responsable, nuevoEstado } = req.body;
    if (!tipo || !descripcion) {
      return res.status(400).json({ error: 'Tipo y descripción de actuación son requeridos' });
    }

    const caso = await SgsstConvivenciaCaso.findOne({ _id: req.params.id, companyId: company._id });
    if (!caso) return res.status(404).json({ error: 'Caso no encontrado' });

    caso.actuaciones.push({
      fecha: new Date(),
      tipo,
      descripcion,
      responsable: responsable || 'Secretario del CCL',
    });

    if (nuevoEstado) {
      caso.estado = nuevoEstado;
      if (['acuerdo_conciliatorio', 'no_acuerdo_alta_direccion', 'archivado'].includes(nuevoEstado)) {
        caso.fechaCierre = new Date();
      }
    }

    await caso.save();
    res.json({ success: true, caso });
  } catch (error) {
    logger.error('[CONVIVENCIA] POST /casos/:id/actuacion error:', error);
    res.status(500).json({ error: 'Error al registrar actuación en el caso' });
  }
});

// ─── 5. POST /casos/:id/medidas-cautelares — Ruta Urgente Ley 2365 de 2024 ─────
router.post('/casos/:id/medidas-cautelares', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const {
      reubicacionFisica,
      cambioHorarioOModalidad,
      prohibicionContacto,
      apoyoPsicologicoArlEps,
      detalleMedidas,
    } = req.body;

    const caso = await SgsstConvivenciaCaso.findOne({ _id: req.params.id, companyId: company._id });
    if (!caso) return res.status(404).json({ error: 'Caso no encontrado' });

    caso.medidasProteccionUrgentes = {
      reubicacionFisica: !!reubicacionFisica,
      cambioHorarioOModalidad: !!cambioHorarioOModalidad,
      prohibicionContacto: !!prohibicionContacto,
      apoyoPsicologicoArlEps: !!apoyoPsicologicoArlEps,
      detalleMedidas: detalleMedidas || 'Medidas cautelares inmediatas dictadas bajo el protocolo de la Ley 2365 de 2024.',
      fechaActivacion: new Date(),
    };

    caso.estado = 'medidas_cautelares_ley_2365';
    caso.actuaciones.push({
      fecha: new Date(),
      tipo: 'medidas_cautelares_urgentes',
      descripcion: `Activación de medidas de protección inmediatas conforme a la Ley 2365 de 2024. No aplica conciliación amistosa entre partes. Detalle: ${detalleMedidas || 'Protección a la víctima garantizada.'}`,
      responsable: 'Comité de Convivencia y Presidencia SST',
    });

    await caso.save();
    res.json({ success: true, caso });
  } catch (error) {
    logger.error('[CONVIVENCIA] POST /casos/:id/medidas-cautelares error:', error);
    res.status(500).json({ error: 'Error al activar medidas cautelares' });
  }
});

// ─── 6. GET /actas — Listado de Actas Trimestrales ─────────────────────────────
router.get('/actas', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const anio = Number(req.query.anio) || new Date().getFullYear();
    const actas = await SgsstConvivenciaActa.find({ companyId: company._id, anio }).sort({ trimestre: 1, createdAt: -1 });

    res.json({ actas });
  } catch (error) {
    logger.error('[CONVIVENCIA] GET /actas error:', error);
    res.status(500).json({ error: 'Error al obtener actas de convivencia' });
  }
});

// ─── 7. POST /actas — Crear o Actualizar Acta Trimestral ───────────────────────
router.post('/actas', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const {
      id,
      consecutivo,
      tipo,
      trimestre,
      anio,
      fecha,
      horaInicio,
      horaFin,
      lugar,
      centroTrabajo,
      quorumVerificado,
      asistentes,
      estadisticasQuejas,
      desarrollo,
      compromisos,
      proximaReunionFecha,
      estadoActa,
    } = req.body;

    let acta;
    if (id) {
      acta = await SgsstConvivenciaActa.findOne({ _id: id, companyId: company._id });
    }

    if (!acta) {
      const currentYear = anio || new Date().getFullYear();
      const currentQuarter = trimestre || Math.ceil((new Date().getMonth() + 1) / 3);
      const count = await SgsstConvivenciaActa.countDocuments({ companyId: company._id, anio: currentYear });
      const autConsecutivo = consecutivo || `ACTA-CCL-${currentYear}-Q${currentQuarter}-${String(count + 1).padStart(2, '0')}`;

      acta = new SgsstConvivenciaActa({
        companyId: company._id,
        user: req.user.id,
        consecutivo: autConsecutivo,
        trimestre: currentQuarter,
        anio: currentYear,
      });
    }

    if (consecutivo) acta.consecutivo = consecutivo;
    if (tipo) acta.tipo = tipo;
    if (trimestre) acta.trimestre = trimestre;
    if (anio) acta.anio = anio;
    if (fecha) acta.fecha = fecha;
    if (horaInicio) acta.horaInicio = horaInicio;
    if (horaFin) acta.horaFin = horaFin;
    if (lugar) acta.lugar = lugar;
    if (centroTrabajo) acta.centroTrabajo = centroTrabajo;
    if (quorumVerificado !== undefined) acta.quorumVerificado = quorumVerificado;
    if (Array.isArray(asistentes)) acta.asistentes = asistentes;
    if (estadisticasQuejas) acta.estadisticasQuejas = { ...acta.estadisticasQuejas, ...estadisticasQuejas };
    if (desarrollo) acta.desarrollo = { ...acta.desarrollo, ...desarrollo };
    if (Array.isArray(compromisos)) acta.compromisos = compromisos;
    if (proximaReunionFecha !== undefined) acta.proximaReunionFecha = proximaReunionFecha;
    if (estadoActa) acta.estadoActa = estadoActa;

    await acta.save();
    res.json({ success: true, acta });
  } catch (error) {
    logger.error('[CONVIVENCIA] POST /actas error:', error);
    res.status(500).json({ error: 'Error al guardar acta de convivencia' });
  }
});

// ─── 8. DELETE /actas/:id — Eliminar Acta ─────────────────────────────────────
router.delete('/actas/:id', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    await SgsstConvivenciaActa.deleteOne({ _id: req.params.id, companyId: company._id });
    res.json({ success: true, message: 'Acta eliminada correctamente' });
  } catch (error) {
    logger.error('[CONVIVENCIA] DELETE /actas error:', error);
    res.status(500).json({ error: 'Error al eliminar el acta' });
  }
});

// ─── 9. POST /actas/generar-borrador-ia — Redacción Trimestral con IA ──────────
router.post('/actas/generar-borrador-ia', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const { trimestre, anio, notasAdicionales } = req.body;

    // Calcular estadísticas reales de quejas para alimentar el acta trimestral sin exponer nombres
    const casos = await SgsstConvivenciaCaso.find({ companyId: company._id });
    const recibidas = casos.length;
    const enTramite = casos.filter((c) => ['radicado', 'en_tramite'].includes(c.estado)).length;
    const acuerdos = casos.filter((c) => c.estado === 'acuerdo_conciliatorio').length;
    const remitidas = casos.filter((c) => c.estado === 'no_acuerdo_alta_direccion').length;

    const prompt = `Actúa como Tenshi, experta jurídica y psicosocial en Seguridad y Salud en el Trabajo, bajo la estricta Resolución 3461 del 1 de septiembre de 2025 (Convenio 190 OIT), Ley 1010 de 2006 y Ley 2365 de 2024 de Colombia.
Redacta el contenido formal y reservado de un Acta Ordinaria Trimestral del Comité de Convivencia Laboral (CCL) para la empresa "${company.companyName}".
Trimestre: Q${trimestre || 1} de ${anio || new Date().getFullYear()}.

Métricas anonimizadas del trimestre:
- Casos totales radicados: ${recibidas}
- Casos en trámite activo (bajo plazo de 65 días): ${enTramite}
- Acuerdos de mediación y compromisos suscritos: ${acuerdos}
- Casos remitidos a la Alta Dirección por falta de acuerdo: ${remitidas}
- Notas del comité: ${notasAdicionales || 'Desarrollo de campañas de comunicación asertiva y prevención del acoso laboral y de género.'}

Genera un JSON EXACTO con las siguientes claves:
{
  "revisionQuejasTrimestre": "Resumen técnico de la gestión confidencial de los radicados del trimestre...",
  "campanasPreventivasAcoso": "Iniciativas preventivas, talleres y sensibilizaciones psicosociales ejecutadas...",
  "climaLaboralPsicosocial": "Diagnóstico y recomendaciones para el clima laboral y respeto interpersonal...",
  "proposicionesVarios": "Acuerdos y programación de actividades para el siguiente trimestre...",
  "compromisosSugeridos": [
    { "accion": "...", "responsable": "...", "fechaLimite": "YYYY-MM-DD" },
    { "accion": "...", "responsable": "...", "fechaLimite": "YYYY-MM-DD" }
  ]
}
Solo responde con el objeto JSON válido.`;

    const aiResponse = await generateWithKeyRotation(prompt, {
      temperature: 0.3,
      responseMimeType: 'application/json',
    });

    let parsed = {};
    try {
      parsed = JSON.parse(aiResponse);
    } catch (e) {
      parsed = {
        revisionQuejasTrimestre: 'Se revisó el consolidado estadístico de quejas recibidas en el trimestre, manteniendo la reserva legal.',
        campanasPreventivasAcoso: 'Se evaluaron las campañas de divulgación del manual de convivencia y prevención del acoso.',
        climaLaboralPsicosocial: 'Monitoreo de factores psicosociales intralaborales en conjunto con el área de talento humano.',
        proposicionesVarios: 'Se fijan fechas para las próximas sesiones de sensibilización.',
        compromisosSugeridos: [],
      };
    }

    res.json({ success: true, borrador: parsed });
  } catch (error) {
    logger.error('[CONVIVENCIA] POST /actas/generar-borrador-ia error:', error);
    res.status(500).json({ error: 'Error al generar borrador con IA' });
  }
});

// ─── 10. GET /elecciones & POST /elecciones — Convocatoria Electoral Convivencia ─
router.get('/elecciones', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const elecciones = await SgsstEleccion.find({ companyId: company._id, tipoComite: 'cocolab' }).sort({ createdAt: -1 });
    res.json({ elecciones });
  } catch (error) {
    logger.error('[CONVIVENCIA] GET /elecciones error:', error);
    res.status(500).json({ error: 'Error al listar elecciones de convivencia' });
  }
});

router.post('/elecciones', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const {
      titulo,
      periodo,
      fechaApertura,
      fechaCierre,
      candidatos,
      juradosVotacion,
      estado,
    } = req.body;

    const workerCount = Number(company.workerCount) || 1;

    const nuevaEleccion = new SgsstEleccion({
      companyId: company._id,
      user: req.user.id,
      tipoComite: 'cocolab',
      titulo: titulo || `Elecciones Comité de Convivencia ${periodo || '2025-2027'}`,
      periodo: periodo || '2025-2027',
      fechaApertura: fechaApertura || Date.now(),
      fechaCierre: fechaCierre || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estado: estado || 'activa',
      totalVotantesHabilitados: workerCount,
      candidatos: Array.isArray(candidatos) ? candidatos : [],
      juradosVotacion: Array.isArray(juradosVotacion) ? juradosVotacion : [],
    });

    await nuevaEleccion.save();
    res.json({ success: true, eleccion: nuevaEleccion });
  } catch (error) {
    logger.error('[CONVIVENCIA] POST /elecciones error:', error);
    res.status(500).json({ error: 'Error al crear elección de convivencia' });
  }
});

// ─── 11. POST /elecciones/:id/escrutinio — Escrutinio Democrático Anónimo ──────
router.post('/elecciones/:id/escrutinio', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const eleccion = await SgsstEleccion.findOne({ _id: req.params.id, companyId: company._id });
    if (!eleccion) return res.status(404).json({ error: 'Elección no encontrada' });

    const votos = await SgsstVotoAnonimo.find({ eleccionId: eleccion._id });
    const conteo = {};
    let votosBlanco = 0;

    votos.forEach((v) => {
      if (v.candidatoId === 'voto_en_blanco') {
        votosBlanco++;
      } else {
        conteo[v.candidatoId] = (conteo[v.candidatoId] || 0) + 1;
      }
    });

    eleccion.candidatos = eleccion.candidatos.map((cand) => ({
      ...cand.toObject(),
      votos: conteo[cand.id] || 0,
    }));
    eleccion.candidatos.sort((a, b) => b.votos - a.votos);

    eleccion.votosEnBlanco = votosBlanco;
    eleccion.totalVotosEmitidos = votos.length;
    eleccion.estado = 'escrutada';

    const fechaHoy = new Date().toLocaleDateString('es-CO');
    eleccion.actaEscrutinioTexto = `En la ciudad de ${company.city || 'Colombia'}, a los ${fechaHoy}, concluyó el escrutinio de votos anónimos para el Comité de Convivencia Laboral (${eleccion.periodo}) conforme a la Resolución 3461 de 2025. Se contabilizaron ${votos.length} sufragios válidos y secretos.`;

    await eleccion.save();
    res.json({ success: true, eleccion });
  } catch (error) {
    logger.error('[CONVIVENCIA] POST /elecciones/:id/escrutinio error:', error);
    res.status(500).json({ error: 'Error al realizar escrutinio de convivencia' });
  }
});

module.exports = router;
