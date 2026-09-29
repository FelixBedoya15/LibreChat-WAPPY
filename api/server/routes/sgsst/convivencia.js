const express = require('express');
const router = express.Router();
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const CompanyInfo = require('../../../models/CompanyInfo');
const { SgsstConvivenciaComite, SgsstConvivenciaActa, SgsstConvivenciaCaso } = require('../../../models/SgsstConvivencia');
const { SgsstEleccion } = require('../../../models/SgsstCopasst');
const { SgsstPadronVotante, SgsstVotoAnonimo } = require('../../../models/SgsstVotacion');
const KanbanTask = require('../../../models/KanbanTask');
const PerfilSociodemograficoData = require('../../../models/PerfilSociodemograficoData');
const { generateWithKeyRotation } = require('./sgsstGemini');
const { logger } = require('~/config');

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompany(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
  if (!active) active = await CompanyInfo.findOne({ user: userId }).lean();
  return active;
}

// ─── Helper: Sincronizar membresía de comités en Perfil Sociodemográfico ─────
async function syncCommitteeMembershipToSociodemografico(companyId) {
  try {
    const perfilDoc = await PerfilSociodemograficoData.findOne({ companyId });
    if (!perfilDoc || !Array.isArray(perfilDoc.trabajadores)) return;

    const { SgsstCopasstComite } = require('../../../models/SgsstCopasst');
    const activeCopasst = await SgsstCopasstComite.findOne({ companyId, estado: 'activo' }).lean()
      || await SgsstCopasstComite.findOne({ companyId }).sort({ createdAt: -1 }).lean();
    const activeConvivencias = await SgsstConvivenciaComite.find({ companyId, estado: 'activo' }).lean();

    const copasstCedulas = new Set();
    if (activeCopasst) {
      (activeCopasst.representantesEmpleador || []).forEach(r => r.cedula && copasstCedulas.add(String(r.cedula).trim()));
      (activeCopasst.representantesTrabajadores || []).forEach(r => r.cedula && copasstCedulas.add(String(r.cedula).trim()));
      if (activeCopasst.vigia?.cedula) copasstCedulas.add(String(activeCopasst.vigia.cedula).trim());
    }

    const convivenciaCedulas = new Set();
    for (const conv of activeConvivencias) {
      (conv.representantesEmpleador || []).forEach(r => r.cedula && convivenciaCedulas.add(String(r.cedula).trim()));
      (conv.representantesTrabajadores || []).forEach(r => r.cedula && convivenciaCedulas.add(String(r.cedula).trim()));
    }

    let modified = false;
    perfilDoc.trabajadores.forEach(w => {
      const cedula = String(w.identificacion || '').trim();
      const newCopasst = copasstCedulas.has(cedula) ? 'Sí' : 'No';
      const newConvivencia = convivenciaCedulas.has(cedula) ? 'Sí' : 'No';
      if (w.esCopasst !== newCopasst || w.esComiteConvivencia !== newConvivencia) {
        w.esCopasst = newCopasst;
        w.esComiteConvivencia = newConvivencia;
        modified = true;
      }
    });

    if (modified) {
      perfilDoc.markModified('trabajadores');
      await perfilDoc.save();
    }
  } catch (err) {
    logger.debug('[CONVIVENCIA] syncCommitteeMembershipToSociodemografico error:', err.message);
  }
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
    syncCommitteeMembershipToSociodemografico(company._id);
    res.json({ success: true, comite });
  } catch (error) {
    logger.error('[CONVIVENCIA] POST /comite error:', error);
    res.status(500).json({ error: 'Error al guardar comité de convivencia' });
  }
});

// ─── GET /trabajadores — Plantilla de Colaboradores para Postulaciones CCL ──────
router.get('/trabajadores', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const rawWorkers = await SgsstWorker.find({ companyId: company._id, estado: { $ne: 'retirado' } })
      .select('nombre documento cedula cargo area email telefono')
      .sort({ nombre: 1 })
      .lean();

    const workers = (rawWorkers || []).map(w => {
      const doc = String(w.documento || w.cedula || w._id || '').trim();
      return {
        nombre: w.nombre,
        cedula: doc,
        documento: doc,
        identificacion: doc,
        cargo: w.cargo || '',
        area: w.area || '',
        email: w.email || '',
        telefono: w.telefono || '',
      };
    });

    const perfilDoc = await PerfilSociodemograficoData.findOne({ companyId: company._id }).lean()
      || await PerfilSociodemograficoData.findOne({ user: req.user.id }).lean();

    if (perfilDoc && Array.isArray(perfilDoc.trabajadores)) {
      const existingCedulas = new Set((workers || []).map(w => String(w.cedula || '').trim()));
      perfilDoc.trabajadores.forEach(w => {
        const c = String(w.identificacion || w.cedula || w.documento || '').trim();
        if (c && !existingCedulas.has(c)) {
          existingCedulas.add(c);
          workers.push({
            nombre: w.nombre,
            cedula: c,
            documento: c,
            identificacion: c,
            cargo: w.cargo || '',
            area: w.area || '',
            email: w.email || '',
            telefono: w.telefono || '',
          });
        }
      });
    }

    res.json({ workers: workers || [] });
  } catch (error) {
    logger.error('[CONVIVENCIA] GET /trabajadores error:', error);
    res.status(500).json({ error: 'Error al listar trabajadores' });
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

    // Sincronizar compromisos con el Centro de Control (KanbanTask / ACPM Hito 07)
    try {
      if (Array.isArray(acta.compromisos)) {
        for (let i = 0; i < acta.compromisos.length; i++) {
          const comp = acta.compromisos[i];
          const refId = `convivencia_${acta._id}_${i}`;
          const isDone = comp.estado === 'cumplido';
          const dueDate = comp.fechaLimite ? new Date(comp.fechaLimite) : new Date(Date.now() + 15 * 86400000);

          let task = await KanbanTask.findOne({ companyId: String(company._id), referenceId: refId });
          if (task) {
            task.title = `[CONVIVENCIA] ${comp.accion}`;
            task.description = `Compromiso de Acta Trimestral ${acta.consecutivo} (Q${acta.trimestre}/${acta.anio}). Responsable: ${comp.responsable || 'Comité'}`;
            task.dueDate = isNaN(dueDate.getTime()) ? new Date(Date.now() + 15 * 86400000) : dueDate;
            task.status = isDone ? 'done' : (task.status === 'done' ? 'todo' : task.status);
            task.assignedTo = comp.responsable || 'Comité de Convivencia';
            if (isDone && !task.completedAt) task.completedAt = new Date();
            await task.save();
          } else {
            task = await KanbanTask.create({
              user: req.user.id,
              companyId: String(company._id),
              title: `[CONVIVENCIA] ${comp.accion}`,
              description: `Compromiso de Acta Trimestral ${acta.consecutivo} (Q${acta.trimestre}/${acta.anio}). Responsable: ${comp.responsable || 'Comité'}`,
              status: isDone ? 'done' : 'todo',
              dueDate: isNaN(dueDate.getTime()) ? new Date(Date.now() + 15 * 86400000) : dueDate,
              type: 'convivencia_finding',
              priority: 'media',
              actionType: 'preventiva',
              sourceModule: 'CONVIVENCIA',
              assignedTo: comp.responsable || 'Comité de Convivencia',
              referenceId: refId,
              referenceName: `Acta Convivencia ${acta.consecutivo}`,
              completedAt: isDone ? new Date() : undefined,
            });
          }
        }
      }
    } catch (kErr) {
      logger.error('[CONVIVENCIA] Error syncing compromisos to KanbanTask:', kErr);
    }

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
    await KanbanTask.deleteMany({ companyId: String(company._id), referenceId: { $regex: `^convivencia_${req.params.id}` } });
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

    const { trimestre, anio, notasAdicionales, desarrolloActual = {} } = req.body;

    // Calcular estadísticas reales de quejas para alimentar el acta trimestral sin exponer nombres
    const casos = await SgsstConvivenciaCaso.find({ companyId: company._id });
    const recibidas = casos.length;
    const enTramite = casos.filter((c) => ['radicado', 'en_tramite'].includes(c.estado)).length;
    const acuerdos = casos.filter((c) => c.estado === 'acuerdo_conciliatorio').length;
    const remitidas = casos.filter((c) => c.estado === 'no_acuerdo_alta_direccion').length;

    const personalization = req.user?.personalization?.geminiModels;
    const preferredModel =
      personalization?.sstManagement ||
      (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();

    const prompt = `Actúa como Tenshi, experta jurídica y psicosocial en Seguridad y Salud en el Trabajo, bajo la estricta Resolución 3461 del 1 de septiembre de 2025 (Convenio 190 OIT), Ley 1010 de 2006 y Ley 2365 de 2024 de Colombia.
Redacta y complementa el contenido formal, técnico y reservado de los 7 puntos reglamentarios de un Acta Ordinaria Trimestral del Comité de Convivencia Laboral (CCL) para la empresa "${company.companyName}".
Trimestre: Q${trimestre || 1} de ${anio || new Date().getFullYear()}.

Métricas anonimizadas del trimestre:
- Casos totales radicados: ${recibidas}
- Casos en trámite activo (bajo plazo de 65 días): ${enTramite}
- Acuerdos de mediación y compromisos suscritos: ${acuerdos}
- Casos remitidos a la Alta Dirección por falta de acuerdo: ${remitidas}

Apuntes actuales del formulario (amplíalos técnicamente de 3 a 5 oraciones completas por punto; si algún campo está vacío, redáctalo de forma completa):
1. Lectura acta anterior: ${desarrolloActual.lecturaActaAnterior || 'Verificación del quórum y aprobación del acta trimestral anterior.'}
2. Seguimiento a compromisos previos: ${desarrolloActual.seguimientoCompromisos || 'Seguimiento al cumplimiento de acuerdos de convivencia y acciones preventivas del trimestre previo.'}
3. Revisión confidencial de quejas: ${desarrolloActual.revisionQuejasTrimestre || 'Revisión estadística reservada de trámites y mediaciones sin exponer identidades.'}
4. Campañas preventivas acoso laboral y sexual: ${desarrolloActual.campanasPreventivasAcoso || 'Campañas de prevención de acoso laboral (Ley 1010/2006) y acoso sexual (Ley 2365/2024).'}
5. Clima laboral y riesgo psicosocial: ${desarrolloActual.climaLaboralPsicosocial || 'Monitoreo de factores psicosociales intralaborales y liderazgo respetuoso.'}
6. Recomendaciones a la Alta Dirección: ${desarrolloActual.recomendacionesAltaDireccion || 'Recomendaciones a Gerencia y Talento Humano para fortalecer el ambiente laboral.'}
7. Proposiciones y varios: ${notasAdicionales || desarrolloActual.proposicionesVarios || 'Programación de actividades y próxima sesión trimestral.'}

Genera un JSON EXACTO con las siguientes claves (todos los 7 puntos completos):
{
  "lecturaActaAnterior": "Texto formal de verificación de quórum y aprobación del acta trimestral anterior...",
  "seguimientoCompromisos": "Balance detallado del seguimiento a compromisos y fórmulas de concertación previas...",
  "revisionQuejasTrimestre": "Resumen técnico de la gestión confidencial de los radicados del trimestre...",
  "campanasPreventivasAcoso": "Iniciativas preventivas, talleres y sensibilizaciones psicosociales ejecutadas bajo Ley 1010/2006 y Ley 2365/2024...",
  "climaLaboralPsicosocial": "Diagnóstico y acciones sobre clima laboral, batería de riesgo psicosocial y respeto interpersonal...",
  "recomendacionesAltaDireccion": "Recomendaciones preventivas y correctivas dirigidas a la Alta Dirección y Talento Humano...",
  "proposicionesVarios": "Acuerdos y programación de actividades para el siguiente trimestre...",
  "compromisosSugeridos": [
    { "accion": "...", "responsable": "...", "fechaLimite": "YYYY-MM-DD" },
    { "accion": "...", "responsable": "...", "fechaLimite": "YYYY-MM-DD" }
  ]
}
Solo responde con el objeto JSON válido, sin bloques markdown.`;

    const result = await generateWithKeyRotation(
      {
        model: preferredModel,
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      },
      req.user?.id || req.user,
      prompt
    );

    const response = await result.response;
    const rawText = response
      .text()
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    let parsed = {};
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw e;
      }
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

    const cleanCandidatos = (Array.isArray(candidatos) ? candidatos : []).map((c, idx) => {
      const ced = String(c.cedula || c.identificacion || c.documento || '').trim();
      const candId = String(c.id || ced || `cand-${Date.now()}-${idx}`).trim();
      return {
        id: candId,
        nombre: String(c.nombre || `Candidato ${idx + 1}`).trim(),
        cedula: ced || candId,
        cargo: String(c.cargo || '').trim(),
        propuesta: String(c.propuesta || 'Compromiso por la sana convivencia y el respeto en el trabajo.').trim(),
        foto: String(c.foto || '').trim(),
        votos: Number(c.votos) || 0,
      };
    });

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
      candidatos: cleanCandidatos,
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

    // Promover automáticamente a los candidatos más votados como representantes de los trabajadores
    try {
      const topCandidates = eleccion.candidatos.filter((c) => c.id !== 'voto_en_blanco');
      if (topCandidates.length > 0) {
        let comite = await SgsstConvivenciaComite.findOne({ companyId: company._id }).sort({ createdAt: -1 });
        if (comite) {
          comite.representantesTrabajadores = topCandidates.map((c, idx) => ({
            nombre: c.nombre,
            cedula: c.cedula,
            cargo: c.cargo || '',
            rol: idx === 0 ? 'Secretario / Mediador' : 'Vocal',
            principal: idx === 0,
            votosRecibidos: c.votos || 0,
          }));
          await comite.save();
        }
      }
      syncCommitteeMembershipToSociodemografico(company._id);
    } catch (promErr) {
      logger.error('[CONVIVENCIA] Error promoting elected candidates:', promErr);
    }

    res.json({ success: true, eleccion });
  } catch (error) {
    logger.error('[CONVIVENCIA] POST /elecciones/:id/escrutinio error:', error);
    res.status(500).json({ error: 'Error al realizar escrutinio de convivencia' });
  }
});

// ─── 10. POST /actas/:id/reporte-oficial — Generar Documento Oficial con IA y Firmas de Participantes ──
router.post('/actas/:id/reporte-oficial', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    let acta;
    let dbActa = null;
    if (req.params.id === 'preview') {
      acta = req.body || {};
      if (!acta.consecutivo) acta.consecutivo = 'BORRADOR';
      if (!acta.trimestre) acta.trimestre = 1;
      if (!acta.anio) acta.anio = new Date().getFullYear();
    } else {
      dbActa = await SgsstConvivenciaActa.findOne({ _id: req.params.id, companyId: company._id });
      if (!dbActa) return res.status(404).json({ error: 'Acta no encontrada' });
      acta = dbActa.toObject ? dbActa.toObject() : { ...dbActa };
      if (req.body && Object.keys(req.body).length > 0) {
        acta = { ...acta, ...req.body, desarrollo: { ...acta.desarrollo, ...req.body.desarrollo } };
      }
    }

    const { buildStandardHeader, buildCommitteeSignatureSection } = require('./reportHeader');
    const PublicReport = require('../../../models/PublicReport');
    const { v4: uuidv4 } = require('uuid');

    const formattedDate = acta.fecha
      ? new Date(acta.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    const headerHtml = buildStandardHeader({
      title: `ACTA ORDINARIA TRIMESTRAL N° ${acta.consecutivo || 'Borrador'} - COMITÉ DE CONVIVENCIA LABORAL`,
      companyInfo: company,
      date: formattedDate,
      norm: 'Resolución 3461 de 2025 • Ley 1010 de 2006 • Ley 2365 de 2024',
      cargo: 'Comité de Convivencia Laboral (COCOLAB)',
      actividad: `Sesión ${acta.tipo === 'extraordinaria' ? 'Extraordinaria' : 'Ordinaria Trimestral'} - Trimestre Q${acta.trimestre} de ${acta.anio}`,
    });

    const stats = acta.estadisticasQuejas || {};
    const estadisticasHtml = `
      <div style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background-color: #f8fafc; page-break-inside: avoid;">
        <h3 style="margin: 0 0 10px 0; font-size: 11.5px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">
          📊 BALANCE ESTADÍSTICO DE CASOS DEL TRIMESTRE (CONFIDENCIALIDAD PROTEGIDA)
        </h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center;">
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px;">
            <div style="font-size: 16px; font-weight: 900; color: #0f172a;">${stats.quejasRecibidasTrimestre || 0}</div>
            <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Recibidas</div>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px;">
            <div style="font-size: 16px; font-weight: 900; color: #0284c7;">${stats.enTramite || 0}</div>
            <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">En Trámite</div>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px;">
            <div style="font-size: 16px; font-weight: 900; color: #16a34a;">${stats.acuerdosConciliatorios || 0}</div>
            <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Conciliadas</div>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px;">
            <div style="font-size: 16px; font-weight: 900; color: #9333ea;">${stats.casosAcosoSexualLey2365 || 0}</div>
            <div style="font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase;">Ley 2365 (Sexual)</div>
          </div>
        </div>
      </div>
    `;

    const asistentesStr =
      Array.isArray(acta.asistentes) && acta.asistentes.length > 0
        ? acta.asistentes
            .map(
              (a) =>
                `${a.nombre || 'Miembro'} (${a.rol || 'Integrante'} - CC: ${a.cedula || 'N/A'} - ${
                  a.asistio !== false ? 'Asistió' : 'Ausente'
                })`
            )
            .join('; ')
        : 'Miembros del Comité de Convivencia Laboral (COCOLAB)';

    const compromisosStr =
      Array.isArray(acta.compromisos) && acta.compromisos.length > 0
        ? acta.compromisos
            .map(
              (c, idx) =>
                `${idx + 1}. Acción: ${c.accion} | Responsable: ${c.responsable || 'Comité'} | Fecha límite: ${
                  c.fechaLimite || 'Por definir'
                } | Estado: ${c.estado || 'pendiente'}`
            )
            .join('\n')
        : 'Sin compromisos manuales previos registrados.';

    // ─── Enriquecimiento y Desarrollo Integral con Tenshi IA (Gemini) ───
    const personalization = req.user?.personalization?.geminiModels;
    const preferredModel =
      personalization?.sstManagement ||
      (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();

    let aiBodyHtml = '';
    let desarrolloEnriquecido = { ...(acta.desarrollo || {}) };

    try {
      const aiPrompt = `Eres un Experto Jurídico y Psicosocial Senior en Seguridad y Salud en el Trabajo en Colombia y Secretario Técnico del Comité de Convivencia Laboral (COCOLAB), especializado en la Resolución 3461 de 2025, la Ley 1010 de 2006, la Ley 2365 de 2024 (Prevención de acoso sexual en el ámbito laboral) y la Resolución 2764 de 2022 (Batería de Riesgo Psicosocial).

Tu objetivo es tomar los apuntes e insumos registrados por el usuario en el formulario del Acta Trimestral N° ${acta.consecutivo || 'BORRADOR'} (Trimestre Q${acta.trimestre} de ${acta.anio}) de la empresa "${company.companyName}" y **COMPLEMENTARLOS, EXPANDIRLOS Y ESTRUCTURARLOS** en un **INFORME OFICIAL DE ACTA DE CONVIVENCIA LABORAL EXHAUSTIVO, TÉCNICO, CONFIDENCIAL Y DE ALTA CALIDAD AUDITORA** (protegiendo siempre la reserva de identidades de quejosos).

**ASISTENTES CONVOCADOS A LA SESIÓN:**
${asistentesStr}

**ESTADÍSTICAS ANONIMIZADAS DEL TRIMESTRE:**
- Quejas recibidas: ${stats.quejasRecibidasTrimestre || 0} | En trámite: ${stats.enTramite || 0} | Acuerdos conciliatorios: ${stats.acuerdosConciliatorios || 0} | Casos Ley 2365: ${stats.casosAcosoSexualLey2365 || 0}

**APUNTES / INSUMOS SUMINISTRADOS EN EL FORMULARIO DEL ACTA:**
1. Lectura y Aprobación del Acta Anterior: ${acta.desarrollo?.lecturaActaAnterior || '[No detallado - complementar técnicamente]'}
2. Seguimiento a Compromisos Previos y Fórmulas de Concertación: ${acta.desarrollo?.seguimientoCompromisos || '[No detallado - complementar técnicamente]'}
3. Revisión Confidencial de Casos y Trámites Conciliatorios: ${acta.desarrollo?.revisionQuejasTrimestre || '[No detallado - complementar técnicamente]'}
4. Campañas Preventivas contra Acoso Laboral y Sexual (Ley 2365/2024): ${acta.desarrollo?.campanasPreventivasAcoso || '[No detallado - complementar técnicamente]'}
5. Monitoreo de Clima Laboral y Factores de Riesgo Psicosocial: ${acta.desarrollo?.climaLaboralPsicosocial || '[No detallado - complementar técnicamente]'}
6. Recomendaciones Preventivas y Correctivas a la Alta Dirección: ${acta.desarrollo?.recomendacionesAltaDireccion || '[No detallado - complementar técnicamente]'}
7. Proposiciones, Varios y Acuerdos de Cierre: ${acta.desarrollo?.proposicionesVarios || '[No detallado - complementar técnicamente]'}

**COMPROMISOS / PLAN DE ACCIÓN REGISTRADOS EN EL FORMULARIO:**
${compromisosStr}

**INSTRUCCIONES DE SALIDA (JSON ESTRICTO):**
Devuelve un objeto JSON válido con dos propiedades principales:
1. \`"desarrolloEnriquecido"\`: Un objeto con las 7 claves exactas (\`lecturaActaAnterior\`, \`seguimientoCompromisos\`, \`revisionQuejasTrimestre\`, \`campanasPreventivasAcoso\`, \`climaLaboralPsicosocial\`, \`recomendacionesAltaDireccion\`, \`proposicionesVarios\`), cada una con un párrafo técnico completo y detallado en texto plano.
2. \`"htmlBody"\`: Código HTML puro y limpio (sin bloques markdown) con:
   - **Sección A: Dictamen Ejecutivo de Convivencia y Clima Psicosocial del Trimestre**
     \`<div style="border-left: 4px solid #0f766e; background-color: #f0fdfa; padding: 14px 18px; border-radius: 0 10px 10px 0; margin-bottom: 22px; font-size: 11.5px; color: #1e293b; line-height: 1.65;"><strong>🛡️ Dictamen Ejecutivo del Comité de Convivencia Laboral:</strong> [Análisis de 2 párrafos sobre el clima organizacional, la gestión preventiva bajo la Res. 3461/2025 y Ley 2365/2024 en el Trimestre Q${acta.trimestre} de ${acta.anio}]</div>\`
   - **Sección B: Desarrollo Exhaustivo de los 7 Puntos Reglamentarios de la Sesión**
     Título: \`<h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; color: #0f766e; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 6px;">📝 DESARROLLO Y ANÁLISIS DE LA SESIÓN DE CONVIVENCIA</h3>\`
     Desarrolla **TODOS LOS 7 PUNTOS** (del 1 al 7) en tarjetas HTML estilizadas con 2 párrafos técnicos y normativos por cada punto.
   - **Sección C: Matriz de Gestión Preventiva Psicosocial y Convivencia del Trimestre**
     Tabla HTML con encabezados \`#0f766e\` y al menos 4 filas: **Factor / Línea de Acción Psicosocial** | **Diagnóstico / Gestión del Trimestre** | **Medida Preventiva / Correctiva** | **Marco Legal (Ley 1010 / Res. 3461 / Ley 2365)**.
   - **Sección D: Plan de Acción y Medidas Concertadas**
     Tabla HTML detallada que incluya los compromisos registrados por el usuario (ampliados con alcance y entregable verificable) más 2 compromisos preventivos complementarios.
   - **Sección E: Constancia de Reserva Legal y Cierre de Sesión**.`;

      const aiResult = await generateWithKeyRotation(
        {
          model: preferredModel,
          generationConfig: {
            temperature: 0.35,
            responseMimeType: 'application/json',
          },
        },
        req.user?.id || req.user,
        aiPrompt
      );

      const response = await aiResult.response;
      const rawText = response
        .text()
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();

      let parsedAi = {};
      try {
        parsedAi = JSON.parse(rawText);
      } catch (parseErr) {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) parsedAi = JSON.parse(match[0]);
      }

      if (parsedAi.desarrolloEnriquecido && typeof parsedAi.desarrolloEnriquecido === 'object') {
        desarrolloEnriquecido = {
          ...desarrolloEnriquecido,
          ...parsedAi.desarrolloEnriquecido,
        };
        acta.desarrollo = desarrolloEnriquecido;
      }

      if (parsedAi.htmlBody && typeof parsedAi.htmlBody === 'string') {
        aiBodyHtml = parsedAi.htmlBody
          .replace(/```html\n?/gi, '')
          .replace(/```\n?/g, '')
          .trim();
      }
    } catch (aiErr) {
      logger.warn('[CONVIVENCIA] AI enrichment fallback in reporte-oficial:', aiErr.message);
    }

    const compromisosRows = Array.isArray(acta.compromisos) && acta.compromisos.length > 0
      ? acta.compromisos
          .map(
            (c, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 8px 10px; font-weight: bold; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 8px 10px; color: #1e293b; font-weight: 600;">${c.accion}</td>
          <td style="padding: 8px 10px; color: #0f766e; font-weight: bold;">${c.responsable || 'Comité'}</td>
          <td style="padding: 8px 10px; color: #475569;">${c.fechaLimite || 'Por definir'}</td>
          <td style="padding: 8px 10px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 9px; font-weight: 800; background-color: ${
              c.estado === 'cumplido' ? '#dcfce7' : c.estado === 'en_progreso' ? '#e0f2fe' : '#fef3c7'
            }; color: ${
              c.estado === 'cumplido' ? '#15803d' : c.estado === 'en_progreso' ? '#0369a1' : '#b45309'
            }; text-transform: uppercase;">
              ${c.estado || 'pendiente'}
            </span>
          </td>
        </tr>
      `
          )
          .join('')
      : `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8; font-style: italic; font-size: 11px;">No se registraron compromisos adicionales en esta sesión.</td></tr>`;

    const fallbackBodyHtml = `
      <!-- Desarrollo Temático -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; color: #0f766e; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 6px;">
          📝 DESARROLLO Y ANÁLISIS DE LA SESIÓN DE CONVIVENCIA
        </h3>
        ${[
          ['1. Lectura y Aprobación del Acta Trimestral Anterior', acta.desarrollo?.lecturaActaAnterior],
          ['2. Seguimiento a Compromisos Previos y Fórmulas de Concertación', acta.desarrollo?.seguimientoCompromisos],
          ['3. Revisión Periódica de Casos y Trámites Conciliatorios (Sin Nombres Propios)', acta.desarrollo?.revisionQuejasTrimestre],
          ['4. Campañas Preventivas contra el Acoso Laboral y Acoso Sexual', acta.desarrollo?.campanasPreventivasAcoso],
          ['5. Monitoreo de Clima Laboral y Riesgo Psicosocial', acta.desarrollo?.climaLaboralPsicosocial],
          ['6. Recomendaciones Preventivas y Correctivas a la Alta Dirección', acta.desarrollo?.recomendacionesAltaDireccion],
          ['7. Proposiciones, Varios y Acuerdos de Cierre', acta.desarrollo?.proposicionesVarios],
        ]
          .filter(([, val]) => Boolean(val))
          .map(
            ([label, val]) => `
            <div style="margin-bottom: 14px; page-break-inside: avoid;">
              <h4 style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase;">
                ${label}
              </h4>
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 11px; color: #334155; line-height: 1.6;">
                ${val}
              </div>
            </div>
          `
          )
          .join('')}
      </div>

      <!-- Compromisos -->
      <div style="margin-bottom: 24px; page-break-inside: avoid;">
        <h3 style="margin: 0 0 10px 0; font-size: 12.5px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">
          🎯 PLAN DE ACCIÓN Y MEDIDAS CONCERTADAS
        </h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; font-size: 10.5px; font-weight: 800; text-transform: uppercase;">
              <th style="padding: 8px 10px; width: 6%; text-align: center;">#</th>
              <th style="padding: 8px 10px; width: 44%; text-align: left;">Acción / Compromiso</th>
              <th style="padding: 8px 10px; width: 22%; text-align: left;">Responsable</th>
              <th style="padding: 8px 10px; width: 16%; text-align: left;">Fecha Límite</th>
              <th style="padding: 8px 10px; width: 12%; text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${compromisosRows}
          </tbody>
        </table>
      </div>
    `;

    // FIRMAS OBLIGATORIAS: DE LOS PARTICIPANTES DEL COMITÉ (NO LAS GENÉRICAS DE LA EMPRESA)
    const signaturesHtml = buildCommitteeSignatureSection({
      asistentes: acta.asistentes,
      companyInfo: company,
      tipoComite: 'cocolab',
    });

    const fullHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; line-height: 1.5;">
        ${headerHtml}

        <!-- Aviso Legal de Confidencialidad -->
        <div style="margin-bottom: 20px; padding: 10px 16px; background-color: #fdf2f8; border: 1.5px dashed #f43f5e; border-radius: 10px; font-size: 10.5px; color: #9f1239; line-height: 1.4;">
          <strong>🔒 ACTA DE CARÁCTER ESTRICTAMENTE RESERVADO Y CONFIDENCIAL:</strong> En observancia de la <em>Resolución 3461 de 2025</em> y la <em>Ley 1010 de 2006</em>, las deliberaciones y documentos del Comité de Convivencia Laboral están sujetos a reserva legal. Los integrantes están obligados a guardar estricta reserva de la información conocida en razón de sus funciones.
        </div>

        <!-- Ficha de la Sesión -->
        <div style="margin-bottom: 24px; border: 1.5px solid #0f766e; border-radius: 12px; overflow: hidden; page-break-inside: avoid;">
          <div style="background: linear-gradient(90deg, #0f766e, #0d9488); color: #ffffff; padding: 9px 14px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            📌 DATOS GENERALES DE LA SESIÓN ORDINARIA TRIMESTRAL
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; width: 25%; color: #334155;">Consecutivo Acta:</td>
                <td style="padding: 8px 12px; font-weight: 700; color: #0f766e; width: 25%;">${acta.consecutivo || 'Borrador'}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; width: 25%; color: #334155;">Periodo Evaluado:</td>
                <td style="padding: 8px 12px; width: 25%;">Trimestre Q${acta.trimestre} de ${acta.anio}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Tipo de Reunión:</td>
                <td style="padding: 8px 12px; text-transform: capitalize;">${acta.tipo === 'extraordinaria' ? 'Extraordinaria' : 'Ordinaria Trimestral'}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Horario:</td>
                <td style="padding: 8px 12px;">${acta.horaInicio || '09:00'} - ${acta.horaFin || '11:00'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Lugar de la Sesión:</td>
                <td style="padding: 8px 12px;">${acta.lugar || 'Sala Confidencial de Convivencia'}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Quórum Reglamentario:</td>
                <td style="padding: 8px 12px; font-weight: bold; color: ${acta.quorumVerificado !== false ? '#15803d' : '#b45309'};">
                  ${acta.quorumVerificado !== false ? '✓ Quórum Verificado y Válido (Mitad + 1)' : 'Quórum Pendiente'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        ${estadisticasHtml}

        ${aiBodyHtml || fallbackBodyHtml}

        <!-- Firmas Oficiales de los Participantes de Convivencia -->
        ${signaturesHtml}
      </div>
    `;

    if (dbActa) {
      dbActa.desarrollo = { ...dbActa.desarrollo, ...desarrolloEnriquecido };
      dbActa.reporteOficialHtml = fullHtml;
      await dbActa.save();
    }

    const reportId = uuidv4();
    const publicReport = new PublicReport({
      id: reportId,
      content: fullHtml,
      fileName: `Acta-COCOLAB-${acta.consecutivo || 'Borrador'}`,
      reportType: 'general',
    });
    await publicReport.save();

    res.json({
      success: true,
      reportId,
      url: `/report/${reportId}`,
      html: fullHtml,
      desarrolloEnriquecido,
    });
  } catch (error) {
    logger.error('[CONVIVENCIA] POST /actas/:id/reporte-oficial error:', error);
    res.status(500).json({ error: 'Error al generar el reporte oficial con firmas' });
  }
});

module.exports = router;
