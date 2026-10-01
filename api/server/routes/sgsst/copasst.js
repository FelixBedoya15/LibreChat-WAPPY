const express = require('express');
const router = express.Router();
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const CompanyInfo = require('../../../models/CompanyInfo');
const { SgsstCopasstComite, SgsstCopasstActa, SgsstEleccion, SgsstPesvComite, SgsstPesvActa } = require('../../../models/SgsstCopasst');
const { SgsstPadronVotante, SgsstVotoAnonimo } = require('../../../models/SgsstVotacion');
const SgsstWorker = require('../../../models/SgsstWorker');
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

    const { SgsstConvivenciaComite } = require('../../../models/SgsstConvivencia');
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
    logger.debug('[COPASST] syncCommitteeMembershipToSociodemografico error:', err.message);
  }
}

// ─── 1. GET /config — Configuración, Estado Paritario y Resumen Anual ─────────
router.get('/config', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const workerCount = Number(company.workerCount) || 1;
    // Res. 2013/1986 Art. 1:
    // < 10 trabajadores: Vigía de Seguridad y Salud en el Trabajo
    // 10 a 49: 1 representante por parte (1 principal + 1 suplente)
    // 50 a 499: 2 representantes por parte (2 principales + 2 suplentes)
    // 500 a 999: 3 representantes por parte (3 principales + 3 suplentes)
    // >= 1000: 4 representantes por parte (4 principales + 4 suplentes)
    let modalidadSugerida = 'copasst';
    let representantesPorParte = 1;

    if (workerCount < 10) {
      modalidadSugerida = 'vigia';
      representantesPorParte = 1;
    } else if (workerCount <= 49) {
      representantesPorParte = 1;
    } else if (workerCount <= 499) {
      representantesPorParte = 2;
    } else if (workerCount <= 999) {
      representantesPorParte = 3;
    } else {
      representantesPorParte = 4;
    }

    const comite = await SgsstCopasstComite.findOne({ companyId: company._id }).sort({ createdAt: -1 });
    const currentYear = new Date().getFullYear();
    const actas = await SgsstCopasstActa.find({ companyId: company._id, anio: currentYear }).sort({ mes: 1 });
    const elecciones = await SgsstEleccion.find({ companyId: company._id, tipoComite: 'copasst' }).sort({ createdAt: -1 });

    const totalActasAnualesEsperadas = modalidadSugerida === 'vigia' ? 12 : 12; // 1 mensual obligatoria
    const actasCompletadas = actas.filter((a) => a.estadoActa === 'aprobada').length;
    const porcentajeCumplimiento = Math.min(Math.round((actasCompletadas / totalActasAnualesEsperadas) * 100), 100);

    res.json({
      company: {
        id: company._id,
        companyName: company.companyName,
        workerCount,
        modalidadSugerida,
        representantesPorParte,
      },
      comite,
      totalActas: actas.length,
      actasCompletadas,
      porcentajeCumplimiento,
      eleccionActiva: elecciones.find((e) => e.estado === 'activa') || null,
    });
  } catch (error) {
    logger.error('[COPASST] GET /config error:', error);
    res.status(500).json({ error: 'Error al consultar configuración del COPASST' });
  }
});

// ─── 2. POST /comite — Guardar o Actualizar Estructura del Comité / Vigía ──────
router.post('/comite', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const {
      modalidad,
      periodoInicio,
      periodoFin,
      horasSemanalesDedicadas,
      representantesEmpleador,
      representantesTrabajadores,
      vigia,
      observaciones,
    } = req.body;

    let comite = await SgsstCopasstComite.findOne({ companyId: company._id }).sort({ createdAt: -1 });

    if (!comite) {
      comite = new SgsstCopasstComite({
        companyId: company._id,
        user: req.user.id,
      });
    }

    if (modalidad) comite.modalidad = modalidad;
    if (periodoInicio) comite.periodoInicio = periodoInicio;
    if (periodoFin) comite.periodoFin = periodoFin;
    if (horasSemanalesDedicadas) comite.horasSemanalesDedicadas = horasSemanalesDedicadas;
    if (Array.isArray(representantesEmpleador)) comite.representantesEmpleador = representantesEmpleador;
    if (Array.isArray(representantesTrabajadores)) comite.representantesTrabajadores = representantesTrabajadores;
    if (vigia) comite.vigia = vigia;
    if (observaciones !== undefined) comite.observaciones = observaciones;

    await comite.save();
    syncCommitteeMembershipToSociodemografico(company._id);
    res.json({ success: true, comite });
  } catch (error) {
    logger.error('[COPASST] POST /comite error:', error);
    res.status(500).json({ error: 'Error al guardar estructura del comité' });
  }
});

// ─── 3. GET /trabajadores — Obtener Plantilla de Colaboradores para Postulaciones ─
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
    logger.error('[COPASST] GET /trabajadores error:', error);
    res.status(500).json({ error: 'Error al listar trabajadores' });
  }
});

// ─── 4. GET /actas — Listado de Actas del Año ──────────────────────────────────
router.get('/actas', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const anio = Number(req.query.anio) || new Date().getFullYear();
    const actas = await SgsstCopasstActa.find({ companyId: company._id, anio }).sort({ mes: 1, createdAt: -1 });

    res.json({ actas });
  } catch (error) {
    logger.error('[COPASST] GET /actas error:', error);
    res.status(500).json({ error: 'Error al obtener actas' });
  }
});

// ─── 5. POST /actas — Crear o Actualizar Acta Mensual ──────────────────────────
router.post('/actas', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const {
      id,
      consecutivo,
      tipo,
      mes,
      anio,
      fecha,
      horaInicio,
      horaFin,
      centroTrabajo,
      lugar,
      ordenDelDia,
      quorumVerificado,
      asistentes,
      desarrollo,
      compromisos,
      proximaReunionFecha,
      estadoActa,
      reporteOficialHtml,
    } = req.body;

    let acta;
    const currentYear = anio || new Date().getFullYear();
    const currentMonth = mes || new Date().getMonth() + 1;

    if (id && id !== 'preview') {
      acta = await SgsstCopasstActa.findOne({ _id: id, companyId: company._id });
    }
    if (!acta) {
      acta = await SgsstCopasstActa.findOne({ companyId: company._id, anio: currentYear, mes: currentMonth });
    }

    if (!acta) {
      // Si no viene consecutivo, autogenerar
      const count = await SgsstCopasstActa.countDocuments({ companyId: company._id, anio: currentYear });
      const autConsecutivo = consecutivo || `ACTA-COPASST-${currentYear}-${String(count + 1).padStart(3, '0')}`;

      acta = new SgsstCopasstActa({
        companyId: company._id,
        user: req.user.id,
        consecutivo: autConsecutivo,
        mes: currentMonth,
        anio: currentYear,
      });
    }

    if (consecutivo) acta.consecutivo = consecutivo;
    if (tipo) acta.tipo = tipo;
    if (mes) acta.mes = mes;
    if (anio) acta.anio = anio;
    if (fecha) acta.fecha = fecha;
    if (horaInicio) acta.horaInicio = horaInicio;
    if (horaFin) acta.horaFin = horaFin;
    if (centroTrabajo) acta.centroTrabajo = centroTrabajo;
    if (lugar) acta.lugar = lugar;
    if (Array.isArray(ordenDelDia)) acta.ordenDelDia = ordenDelDia;
    if (quorumVerificado !== undefined) acta.quorumVerificado = quorumVerificado;
    if (Array.isArray(asistentes)) acta.asistentes = asistentes;
    if (desarrollo) acta.desarrollo = { ...acta.desarrollo, ...desarrollo };
    if (Array.isArray(compromisos)) acta.compromisos = compromisos;
    if (proximaReunionFecha !== undefined) acta.proximaReunionFecha = proximaReunionFecha;
    if (estadoActa) acta.estadoActa = estadoActa;
    if (reporteOficialHtml !== undefined) acta.reporteOficialHtml = reporteOficialHtml;

    if (acta.reporteOficialHtml) {
      const { updateCommitteeSignatureSectionInHtml } = require('./reportHeader');
      acta.reporteOficialHtml = updateCommitteeSignatureSectionInHtml(acta.reporteOficialHtml, {
        asistentes: acta.asistentes,
        companyInfo: company,
        tipoComite: 'copasst',
      });
    }

    await acta.save();

    // Sincronizar compromisos con el Centro de Control (KanbanTask / ACPM Hito 07)
    try {
      if (Array.isArray(acta.compromisos)) {
        for (let i = 0; i < acta.compromisos.length; i++) {
          const comp = acta.compromisos[i];
          const refId = `copasst_${acta._id}_${i}`;
          const isDone = comp.estado === 'cumplido';
          const dueDate = comp.fechaLimite ? new Date(comp.fechaLimite) : new Date(Date.now() + 15 * 86400000);

          let task = await KanbanTask.findOne({ companyId: String(company._id), referenceId: refId });
          if (task) {
            task.title = `[COPASST] ${comp.accion}`;
            task.description = `Compromiso de Acta Ordinaria ${acta.consecutivo} (${acta.mes}/${acta.anio}). Responsable: ${comp.responsable || 'Comité'}`;
            task.dueDate = isNaN(dueDate.getTime()) ? new Date(Date.now() + 15 * 86400000) : dueDate;
            task.status = isDone ? 'done' : (task.status === 'done' ? 'todo' : task.status);
            task.assignedTo = comp.responsable || 'COPASST';
            if (isDone && !task.completedAt) task.completedAt = new Date();
            await task.save();
            comp.acpmId = task._id;
            comp.vinculadaAcpm = true;
          } else {
            task = await KanbanTask.create({
              user: req.user.id,
              companyId: String(company._id),
              title: `[COPASST] ${comp.accion}`,
              description: `Compromiso de Acta Ordinaria ${acta.consecutivo} (${acta.mes}/${acta.anio}). Responsable: ${comp.responsable || 'Comité'}`,
              status: isDone ? 'done' : 'todo',
              dueDate: isNaN(dueDate.getTime()) ? new Date(Date.now() + 15 * 86400000) : dueDate,
              type: 'copasst_finding',
              priority: 'media',
              actionType: 'correctiva',
              sourceModule: 'COPASST',
              assignedTo: comp.responsable || 'COPASST',
              referenceId: refId,
              referenceName: `Acta COPASST ${acta.consecutivo}`,
              completedAt: isDone ? new Date() : undefined,
            });
            comp.acpmId = task._id;
            comp.vinculadaAcpm = true;
          }
        }
        await acta.save();
      }
    } catch (kErr) {
      logger.error('[COPASST] Error syncing compromisos to KanbanTask:', kErr);
    }

    res.json({ success: true, acta });
  } catch (error) {
    logger.error('[COPASST] POST /actas error:', error);
    res.status(500).json({ error: 'Error al guardar el acta' });
  }
});

// ─── 6. DELETE /actas/:id — Eliminar Acta ─────────────────────────────────────
router.delete('/actas/:id', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    await SgsstCopasstActa.deleteOne({ _id: req.params.id, companyId: company._id });
    await KanbanTask.deleteMany({ companyId: String(company._id), referenceId: { $regex: `^copasst_${req.params.id}` } });
    res.json({ success: true, message: 'Acta eliminada correctamente' });
  } catch (error) {
    logger.error('[COPASST] DELETE /actas error:', error);
    res.status(500).json({ error: 'Error al eliminar el acta' });
  }
});

// ─── 7. POST /actas/generar-borrador-ia — Redacción Inteligente con Tenshi ─────
router.post('/actas/generar-borrador-ia', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const {
      mes,
      anio,
      notasAdicionales,
      accidentalidadReportada,
      inspeccionesRealizadas,
      desarrolloActual = {},
    } = req.body;

    const personalization = req.user?.personalization?.geminiModels;
    const preferredModel =
      personalization?.sstManagement ||
      (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();

    const prompt = `Actúa como Tenshi, experta líder en Seguridad y Salud en el Trabajo y secretaria técnica consultora bajo la normativa colombiana (Resolución 2013 de 1986, Decreto 1072 de 2015 Art. 2.2.4.6.8 / 2.2.4.6.34 y Resolución 0312 de 2019 Estándar 1.1.6).
Redacta y complementa el desarrollo formal, técnico, amplio y propositivo de todos los 8 puntos reglamentarios de una Reunión Ordinaria Mensual del COPASST para la empresa "${company.companyName}" (Actividad económica: ${company.economicActivity || 'General'}, Nivel de riesgo: ${company.riskLevel || 'I'}, Trabajadores: ${company.workerCount || 'N/A'}).
Mes: ${mes || new Date().getMonth() + 1} de ${anio || new Date().getFullYear()}.

Insumos actuales registrados en el formulario (toma estos apuntes como base y amplíalos con redacción técnica, detallada y normativa de al menos 3 a 5 oraciones completas por cada punto; si algún campo está vacío, redáctalo de forma completa y coherente con la gestión mensual del SG-SST):
1. Lectura acta anterior: ${desarrolloActual.lecturaActaAnterior || 'Lectura y verificación de quórum reglamentario.'}
2. Seguimiento a compromisos previos: ${desarrolloActual.seguimientoCompromisos || 'Verificación del cierre de acciones preventivas y correctivas del periodo anterior.'}
3. Accidentalidad y ausentismo (ATEL): ${accidentalidadReportada || desarrolloActual.analisisAccidentalidad || 'Cero accidentes incapacitantes en el periodo. Vigilancia de incidentes y ausentismo médico.'}
4. Inspecciones planeadas de seguridad: ${inspeccionesRealizadas || desarrolloActual.inspeccionesSeguridad || 'Inspección de extintores, botiquines, señalización y orden y aseo en áreas operativas y administrativas.'}
5. Cumplimiento de cronograma de capacitaciones: ${desarrolloActual.capacitacionesYCampanas || 'Seguimiento satisfactorio al plan anual de capacitación y campañas de autocuidado.'}
6. Peticiones, sugerencias e inquietudes de los trabajadores: ${desarrolloActual.solicitudesTrabajadores || 'Revisión de reportes de condiciones de trabajo, ergonomía y dotación de EPP canalizados por los representantes de los trabajadores.'}
7. Asesoría, recomendaciones e intervención de la ARL: ${desarrolloActual.asesoriaArl || 'Seguimiento a asistencias técnicas, capacitaciones virtuales/presenciales y recomendaciones emitidas por la ARL.'}
8. Proposiciones, varios y acuerdos de cierre: ${notasAdicionales || desarrolloActual.proposicionesVarios || 'Coordinación de la próxima sesión ordinaria y fortalecimiento de la cultura preventiva.'}

Genera un JSON EXACTO con las siguientes claves (todos los 8 campos deben tener redacción técnica, completa y profesional):
{
  "lecturaActaAnterior": "Texto formal y completo de verificación de quórum y aprobación del acta anterior...",
  "seguimientoCompromisos": "Balance detallado del cumplimiento de los compromisos previos y cierre de acciones...",
  "analisisAccidentalidad": "Análisis técnico y estadístico del comportamiento de accidentalidad, severidad, frecuencia y ausentismo ATEL...",
  "inspeccionesSeguridad": "Hallazgos detallados de la ronda de inspección paritaria a instalaciones, equipos de emergencia y puestos de trabajo...",
  "capacitacionesYCampanas": "Evaluación técnica de la ejecución y cobertura del cronograma formativo y sensibilizaciones del mes...",
  "solicitudesTrabajadores": "Desarrollo formal de las peticiones, sugerencias sobre EPP, ergonomía y condiciones laborales reportadas por los trabajadores...",
  "asesoriaArl": "Detalle del acompañamiento técnico, reinversión de recursos y recomendaciones de la Administradora de Riesgos Laborales (ARL)...",
  "proposicionesVarios": "Propuestas paritarias, reconocimientos y acuerdos de cierre para la siguiente sesión...",
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
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw e;
      }
    }

    // Persistir automáticamente el borrador en MongoDB para que al recargar la página no se pierda
    let dbActa = null;
    try {
      const targetYear = Number(anio) || new Date().getFullYear();
      const targetMonth = Number(mes) || new Date().getMonth() + 1;
      const { id, consecutivo, tipo, lugar, horaInicio, horaFin, quorumVerificado, asistentes, compromisos } = req.body;
      if (id && id !== 'preview') {
        dbActa = await SgsstCopasstActa.findOne({ _id: id, companyId: company._id });
      }
      if (!dbActa) {
        dbActa = await SgsstCopasstActa.findOne({ companyId: company._id, anio: targetYear, mes: targetMonth });
      }
      if (!dbActa) {
        const count = await SgsstCopasstActa.countDocuments({ companyId: company._id, anio: targetYear });
        const autConsecutivo = consecutivo || `ACTA-COPASST-${targetYear}-${String(count + 1).padStart(3, '0')}`;
        dbActa = new SgsstCopasstActa({
          companyId: company._id,
          user: req.user.id,
          consecutivo: autConsecutivo,
          mes: targetMonth,
          anio: targetYear,
          tipo: tipo || 'ordinaria_mensual',
          lugar: lugar || 'Sala Principal de Reuniones / Híbrida',
          horaInicio: horaInicio || '08:00',
          horaFin: horaFin || '10:00',
          quorumVerificado: quorumVerificado !== false,
          asistentes: Array.isArray(asistentes) ? asistentes : [],
        });
      }
      const { compromisosSugeridos, ...desarrolloFields } = parsed;
      dbActa.desarrollo = { ...(dbActa.desarrollo || {}), ...desarrolloActual, ...desarrolloFields };
      const prevCompromisos = Array.isArray(compromisos) ? compromisos : (dbActa.compromisos || []);
      const nuevosCompromisos = Array.isArray(compromisosSugeridos)
        ? compromisosSugeridos.map((c) => ({
            accion: c.accion,
            responsable: c.responsable || 'COPASST',
            fechaLimite: c.fechaLimite || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
            estado: 'pendiente',
          }))
        : [];
      dbActa.compromisos = [...prevCompromisos, ...nuevosCompromisos];
      if (Array.isArray(asistentes) && asistentes.length > 0) dbActa.asistentes = asistentes;
      if (lugar) dbActa.lugar = lugar;
      if (horaInicio) dbActa.horaInicio = horaInicio;
      if (horaFin) dbActa.horaFin = horaFin;
      await dbActa.save();
    } catch (saveErr) {
      logger.warn('[COPASST] Auto-save on generar-borrador-ia warning:', saveErr.message);
    }

    res.json({ success: true, borrador: parsed, acta: dbActa });
  } catch (error) {
    logger.error('[COPASST] POST /actas/generar-borrador-ia error:', error);
    res.status(500).json({ error: 'Error al generar borrador con IA' });
  }
});

// ─── 8. GET /elecciones & POST /elecciones — Gestión de Procesos Electorales ────
router.get('/elecciones', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const elecciones = await SgsstEleccion.find({ companyId: company._id, tipoComite: 'copasst' }).sort({ createdAt: -1 });
    res.json({ elecciones });
  } catch (error) {
    logger.error('[COPASST] GET /elecciones error:', error);
    res.status(500).json({ error: 'Error al listar elecciones' });
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
        propuesta: String(c.propuesta || 'Compromiso por la prevención y el bienestar de todos.').trim(),
        foto: String(c.foto || '').trim(),
        votos: Number(c.votos) || 0,
      };
    });

    const nuevaEleccion = new SgsstEleccion({
      companyId: company._id,
      user: req.user.id,
      tipoComite: 'copasst',
      titulo: titulo || `Elecciones COPASST ${periodo || '2025-2027'}`,
      periodo: periodo || '2025-2027',
      fechaApertura: fechaApertura || Date.now(),
      fechaCierre: fechaCierre || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días por defecto
      estado: estado || 'activa',
      totalVotantesHabilitados: workerCount,
      candidatos: cleanCandidatos,
      juradosVotacion: Array.isArray(juradosVotacion) ? juradosVotacion : [],
    });

    await nuevaEleccion.save();
    res.json({ success: true, eleccion: nuevaEleccion });
  } catch (error) {
    logger.error('[COPASST] POST /elecciones error:', error);
    res.status(500).json({ error: 'Error al crear proceso de elección' });
  }
});

// ─── 9. POST /elecciones/:id/escrutinio — Cierre y Consolidación de Resultados ──
router.post('/elecciones/:id/escrutinio', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const eleccion = await SgsstEleccion.findOne({ _id: req.params.id, companyId: company._id });
    if (!eleccion) return res.status(404).json({ error: 'Elección no encontrada' });

    // Contabilizar votos anónimos emitidos en la colección desacoplada
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

    // Actualizar votos en cada candidato
    eleccion.candidatos = eleccion.candidatos.map((cand) => ({
      ...cand.toObject(),
      votos: conteo[cand.id] || 0,
    }));
    // Ordenar de mayor a menor número de votos
    eleccion.candidatos.sort((a, b) => b.votos - a.votos);

    eleccion.votosEnBlanco = votosBlanco;
    eleccion.totalVotosEmitidos = votos.length;
    eleccion.estado = 'escrutada';

    const fechaHoy = new Date().toLocaleDateString('es-CO');
    eleccion.actaEscrutinioTexto = `En la ciudad de ${company.city || 'Colombia'}, a los ${fechaHoy}, siendo clausurada la jornada de votación para el COPASST (${eleccion.periodo}), los jurados y la mesa electoral certifican la participación de ${votos.length} sufragantes de un censo de ${eleccion.totalVotantesHabilitados} habilitados. Los votos fueron escrutados de manera anónima e inviolable.`;

    await eleccion.save();

    // Promover automáticamente a los candidatos más votados como representantes de los trabajadores
    try {
      const topCandidates = eleccion.candidatos.filter((c) => c.id !== 'voto_en_blanco');
      if (topCandidates.length > 0) {
        let comite = await SgsstCopasstComite.findOne({ companyId: company._id }).sort({ createdAt: -1 });
        if (comite) {
          comite.representantesTrabajadores = topCandidates.map((c, idx) => ({
            nombre: c.nombre,
            cedula: c.cedula,
            cargo: c.cargo || '',
            rol: idx === 0 ? 'Secretario / Vocal' : 'Vocal',
            principal: idx === 0,
            votosRecibidos: c.votos || 0,
          }));
          await comite.save();
        }
      }
      syncCommitteeMembershipToSociodemografico(company._id);
    } catch (promErr) {
      logger.error('[COPASST] Error promoting elected candidates:', promErr);
    }

    res.json({ success: true, eleccion });
  } catch (error) {
    logger.error('[COPASST] POST /elecciones/:id/escrutinio error:', error);
    res.status(500).json({ error: 'Error al realizar escrutinio' });
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
      if (!acta.mes) acta.mes = new Date().getMonth() + 1;
      if (!acta.anio) acta.anio = new Date().getFullYear();
    } else {
      dbActa = await SgsstCopasstActa.findOne({ _id: req.params.id, companyId: company._id });
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
      title: `ACTA ORDINARIA MENSUAL N° ${acta.consecutivo} - COPASST`,
      companyInfo: company,
      date: formattedDate,
      norm: 'Resolución 2013 de 1986 • Decreto 1072 de 2015 Art. 2.2.4.6.8 • Res. 0312 de 2019 Est. 1.1.6',
      cargo: 'Comité Paritario de Seguridad y Salud en el Trabajo',
      actividad: `Sesión ${acta.tipo === 'extraordinaria' ? 'Extraordinaria' : 'Ordinaria Mensual'} - Mes ${acta.mes} de ${acta.anio}`,
    });

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
        : 'Miembros del Comité Paritario de Seguridad y Salud en el Trabajo (COPASST)';

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
      const aiPrompt = `Eres un Experto Técnico Senior en Seguridad y Salud en el Trabajo (SG-SST) en Colombia y Secretario Técnico del Comité Paritario de Seguridad y Salud en el Trabajo (COPASST), especializado en la Resolución 2013 de 1986, el Decreto 1072 de 2015 (Artículos 2.2.4.6.8, 2.2.4.6.11, 2.2.4.6.29 y 2.2.4.6.34), la Resolución 0312 de 2019 (Estándar 1.1.6) y la Resolución 1401 de 2007.

Tu objetivo es tomar los apuntes e insumos registrados por el usuario en el formulario del Acta N° ${acta.consecutivo || 'BORRADOR'} (Mes ${acta.mes} de ${acta.anio}) de la empresa "${company.companyName}" (Actividad Económica: ${company.economicActivity || 'General'}, Nivel de Riesgo: ${company.riskLevel || 'I'}, N° Trabajadores: ${company.workerCount || 'N/A'}) y **COMPLEMENTARLOS, EXPANDIRLOS Y ESTRUCTURARLOS** en un **INFORME OFICIAL DE ACTA COPASST EXHAUSTIVO, TÉCNICO, NORMATIVO Y DE ALTA CALIDAD AUDITORA**.

**ASISTENTES CONVOCADOS A LA SESIÓN:**
${asistentesStr}

**APUNTES / INSUMOS SUMINISTRADOS EN EL FORMULARIO DEL ACTA:**
1. Lectura y Aprobación del Acta Anterior: ${acta.desarrollo?.lecturaActaAnterior || '[No detallado - complementar técnicamente]'}
2. Seguimiento a Compromisos y Tareas Previas: ${acta.desarrollo?.seguimientoCompromisos || '[No detallado - complementar técnicamente según gestión continua del comité]'}
3. Análisis de Accidentalidad, Incidentes y Ausentismo (ATEL): ${acta.desarrollo?.analisisAccidentalidad || '[No detallado - complementar técnicamente]'}
4. Inspecciones Planeadas de Seguridad y Hallazgos en Terreno: ${acta.desarrollo?.inspeccionesSeguridad || '[No detallado - complementar técnicamente]'}
5. Cumplimiento de Cronograma de Capacitaciones y Campañas: ${acta.desarrollo?.capacitacionesYCampanas || '[No detallado - complementar técnicamente]'}
6. Peticiones, Sugerencias e Inquietudes de los Trabajadores: ${acta.desarrollo?.solicitudesTrabajadores || '[No detallado - complementar técnicamente con canalización paritaria de condiciones de trabajo, ergonomía y EPP]'}
7. Asesoría, Recomendaciones e Intervención de la ARL: ${acta.desarrollo?.asesoriaArl || '[No detallado - complementar técnicamente con seguimiento a asistencia técnica y reinversión ARL]'}
8. Proposiciones, Varios y Acuerdos de Cierre: ${acta.desarrollo?.proposicionesVarios || '[No detallado - complementar técnicamente]'}

**COMPROMISOS / PLAN DE ACCIÓN REGISTRADOS EN EL FORMULARIO:**
${compromisosStr}

**INSTRUCCIONES DE SALIDA (JSON ESTRICTO):**
Devuelve un objeto JSON válido con dos propiedades principales:
1. \`"desarrolloEnriquecido"\`: Un objeto con las 8 claves exactas (\`lecturaActaAnterior\`, \`seguimientoCompromisos\`, \`analisisAccidentalidad\`, \`inspeccionesSeguridad\`, \`capacitacionesYCampanas\`, \`solicitudesTrabajadores\`, \`asesoriaArl\`, \`proposicionesVarios\`), donde cada clave contiene un párrafo técnico completo, formal y detallado (en texto plano sin HTML) que amplía y complementa los apuntes del usuario (especialmente aquellos que estaban cortos o vacíos).
2. \`"htmlBody"\`: Código HTML puro y limpio (sin etiquetas \`<html>\`, \`<body>\`, ni bloques markdown \`\`\`html) que contenga el cuerpo técnico completo del informe oficial con las siguientes secciones:

   - **Sección A: Dictamen Ejecutivo de la Sesión Mensual Paritaria**
     Un contenedor destacado:
     \`<div style="border-left: 4px solid #0f766e; background-color: #f0fdfa; padding: 14px 18px; border-radius: 0 10px 10px 0; margin-bottom: 22px; font-size: 11.5px; color: #1e293b; line-height: 1.65;"><strong>📊 Dictamen Ejecutivo de Gestión Paritaria (COPASST):</strong> [Análisis integral de 2 párrafos sobre el desempeño del SG-SST en el mes ${acta.mes} de ${acta.anio}, la vigencia del quórum paritario bajo la Res. 2013/1986 y el balance preventivo del periodo]</div>\`

   - **Sección B: Desarrollo Técnico y Normativo de los 8 Puntos del Orden del Día**
     Título: \`<h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; color: #0f766e; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 6px;">📝 DESARROLLO EXHAUSTIVO Y DELIBERACIONES DE LA REUNIÓN</h3>\`
     Desarrolla **TODOS LOS 8 PUNTOS REGLAMENTARIOS** (del 1 al 8). Para cada punto, genera una tarjeta HTML estilizada:
     \`<div style="margin-bottom: 14px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; page-break-inside: avoid;"><div style="background-color: #f8fafc; padding: 8px 14px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase;">[N° y Nombre del Punto]</div><div style="padding: 12px 14px; font-size: 11px; color: #334155; line-height: 1.65; background-color: #ffffff;">[Desarrollo técnico extenso de 2 párrafos, articulando lo reportado por el usuario con las funciones legales del Art. 11 de la Res. 2013/1986 y el Dec. 1072/2015, determinaciones tomadas por el comité y medidas preventivas adoptadas]</div></div>\`

   - **Sección C: Matriz Técnica de Vigilancia Epidemiológica, Inspecciones y Control Operacional del Mes**
     Título: \`<h3 style="margin: 22px 0 10px 0; font-size: 12.5px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">🔍 MATRIZ PARITARIA DE VIGILANCIA, INSPECCIONES Y CONTROL DE RIESGOS</h3>\`
     Genera una tabla HTML (\`<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 22px; font-size: 10.5px;">\`) con encabezados en \`background-color: #0f766e; color: #ffffff; padding: 8px 10px; text-align: left; font-weight: 800; text-transform: uppercase;\` y al menos 5 filas analizando los ejes del mes:
     Columnas: **Eje de Vigilancia SST** | **Condición / Hallazgo Analizado en Sesión** | **Medida de Intervención / Control Paritario** | **Soporte Normativo** | **Nivel de Seguimiento**.

   - **Sección D: Plan de Acción, Compromisos Asumidos y Trazabilidad PHVA**
     Título: \`<h3 style="margin: 22px 0 10px 0; font-size: 12.5px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">🎯 PLAN DE ACCIÓN PARITARIO Y COMPROMISOS ADQUIRIDOS (CICLO PHVA)</h3>\`
     Genera una tabla HTML detallada que incluya TODOS los compromisos registrados por el usuario (ampliando técnicamente su alcance y definiendo el entregable/evidencia verificable) más 2 compromisos preventivos complementarios derivados del desarrollo de los 8 puntos.
     Columnas: **#** | **Acción Preventiva / Correctiva y Alcance Técnico** | **Evidencia / Entregable de Verificación** | **Responsable** | **Fecha Límite** | **Estado**.

   - **Sección E: Constancia Reglamentaria de Aprobación y Cierre**
     Un bloque final de cierre formal indicando la hora de finalización (${acta.horaFin || '10:00'}), la aprobación unánime de las determinaciones por parte de los representantes del empleador y de los trabajadores, y su validez probatoria ante el Ministerio del Trabajo.`;

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
      logger.warn('[COPASST] AI enrichment fallback in reporte-oficial:', aiErr.message);
    }

    const ordenList =
      Array.isArray(acta.ordenDelDia) && acta.ordenDelDia.length > 0
        ? acta.ordenDelDia.map((item) => `<li style="margin-bottom: 6px; font-weight: 500;">${item}</li>`).join('')
        : '<li>1. Verificación del quórum reglamentario</li><li>2. Lectura y aprobación del acta anterior</li><li>3. Seguimiento a compromisos de actas anteriores</li><li>4. Revisión y análisis de accidentalidad, incidentes y enfermedades (ATEL)</li><li>5. Inspecciones planeadas de seguridad y hallazgos en terreno</li><li>6. Cumplimiento del cronograma de capacitaciones y campañas SST</li><li>7. Peticiones, sugerencias e inquietudes de los trabajadores</li><li>8. Asesoría, recomendaciones e intervención de la ARL</li><li>9. Proposiciones, varios y acuerdos de cierre</li>';

    const compromisosRows =
      Array.isArray(acta.compromisos) && acta.compromisos.length > 0
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

    // Fallback HTML en caso de que la IA no haya devuelto htmlBody
    const fallbackBodyHtml = `
      <!-- Desarrollo Temático -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; color: #0f766e; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 6px;">
          📝 DESARROLLO Y ANÁLISIS DE LA REUNIÓN
        </h3>
        ${[
          ['1. Lectura y Aprobación del Acta Anterior', acta.desarrollo?.lecturaActaAnterior],
          ['2. Seguimiento a Compromisos y Tareas Previas', acta.desarrollo?.seguimientoCompromisos],
          ['3. Revisión y Análisis de Accidentalidad, Incidentes y Ausentismo (ATEL)', acta.desarrollo?.analisisAccidentalidad],
          ['4. Inspecciones Planeadas de Seguridad y Hallazgos en Terreno', acta.desarrollo?.inspeccionesSeguridad],
          ['5. Cumplimiento de Cronograma de Capacitaciones y Campañas', acta.desarrollo?.capacitacionesYCampanas],
          ['6. Peticiones, Sugerencias e Inquietudes de los Trabajadores', acta.desarrollo?.solicitudesTrabajadores],
          ['7. Asesoría, Recomendaciones e Intervención de la ARL', acta.desarrollo?.asesoriaArl],
          ['8. Proposiciones, Varios y Acuerdos de Cierre', acta.desarrollo?.proposicionesVarios],
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
          🎯 PLAN DE ACCIÓN Y COMPROMISOS ADQUIRIDOS
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
      tipoComite: 'copasst',
    });

    const fullHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; line-height: 1.5;">
        ${headerHtml}

        <!-- Ficha de la Sesión -->
        <div style="margin-bottom: 24px; border: 1.5px solid #0f766e; border-radius: 12px; overflow: hidden; page-break-inside: avoid;">
          <div style="background: linear-gradient(90deg, #0f766e, #0d9488); color: #ffffff; padding: 9px 14px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            📌 DATOS GENERALES DE LA CONVOCATORIA Y SESIÓN
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; width: 25%; color: #334155;">Consecutivo Acta:</td>
                <td style="padding: 8px 12px; font-weight: 700; color: #0f766e; width: 25%;">${acta.consecutivo || 'Borrador'}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; width: 25%; color: #334155;">Periodo Evaluado:</td>
                <td style="padding: 8px 12px; width: 25%;">Mes ${acta.mes} de ${acta.anio}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Fecha de la Sesión:</td>
                <td style="padding: 8px 12px;">${formattedDate}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Horario:</td>
                <td style="padding: 8px 12px;">${acta.horaInicio || '08:00'} - ${acta.horaFin || '10:00'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Sede / Lugar:</td>
                <td style="padding: 8px 12px;">${acta.centroTrabajo ? `${acta.centroTrabajo} — ` : ''}${acta.lugar || 'Sede Principal / Virtual'}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Quórum Reglamentario:</td>
                <td style="padding: 8px 12px; font-weight: bold; color: ${acta.quorumVerificado !== false ? '#15803d' : '#b45309'};">
                  ${acta.quorumVerificado !== false ? '✓ Quórum Verificado y Válido (Mitad + 1)' : 'Quórum Pendiente'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Orden del Día -->
        <div style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background-color: #f8fafc; page-break-inside: avoid;">
          <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">
            📋 ORDEN DEL DÍA REGLAMENTARIO
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 11.5px; color: #334155;">
            ${ordenList}
          </ul>
        </div>

        ${aiBodyHtml || fallbackBodyHtml}

        <!-- Firmas Oficiales de los Participantes del COPASST -->
        ${signaturesHtml}
      </div>
    `;

    if (!dbActa) {
      const targetYear = Number(acta.anio) || new Date().getFullYear();
      const targetMonth = Number(acta.mes) || new Date().getMonth() + 1;
      dbActa = await SgsstCopasstActa.findOne({ companyId: company._id, anio: targetYear, mes: targetMonth });
      if (!dbActa) {
        const count = await SgsstCopasstActa.countDocuments({ companyId: company._id, anio: targetYear });
        const autConsecutivo =
          acta.consecutivo && acta.consecutivo !== 'BORRADOR'
            ? acta.consecutivo
            : `ACTA-COPASST-${targetYear}-${String(count + 1).padStart(3, '0')}`;
        dbActa = new SgsstCopasstActa({
          companyId: company._id,
          user: req.user.id,
          consecutivo: autConsecutivo,
          mes: targetMonth,
          anio: targetYear,
          fecha: acta.fecha || Date.now(),
          tipo: acta.tipo || 'ordinaria_mensual',
          centroTrabajo: acta.centroTrabajo || 'Sede Principal',
          lugar: acta.lugar || 'Sala Principal de Reuniones / Híbrida',
          horaInicio: acta.horaInicio || '08:00',
          horaFin: acta.horaFin || '10:00',
          quorumVerificado: acta.quorumVerificado !== false,
          asistentes: Array.isArray(acta.asistentes) ? acta.asistentes : [],
          compromisos: Array.isArray(acta.compromisos) ? acta.compromisos : [],
        });
      }
    }

    if (dbActa) {
      if (Array.isArray(acta.asistentes)) dbActa.asistentes = acta.asistentes;
      if (Array.isArray(acta.compromisos)) dbActa.compromisos = acta.compromisos;
      if (acta.fecha) dbActa.fecha = acta.fecha;
      if (acta.centroTrabajo) dbActa.centroTrabajo = acta.centroTrabajo;
      if (acta.lugar) dbActa.lugar = acta.lugar;
      if (acta.horaInicio) dbActa.horaInicio = acta.horaInicio;
      if (acta.horaFin) dbActa.horaFin = acta.horaFin;
      if (acta.quorumVerificado !== undefined) dbActa.quorumVerificado = acta.quorumVerificado;
      dbActa.desarrollo = { ...dbActa.desarrollo, ...desarrolloEnriquecido };
      dbActa.reporteOficialHtml = fullHtml;
      await dbActa.save();
    }

    const reportId = uuidv4();
    const publicReport = new PublicReport({
      id: reportId,
      content: fullHtml,
      fileName: `Acta-COPASST-${dbActa?.consecutivo || acta.consecutivo || 'Borrador'}`,
      reportType: 'general',
    });
    await publicReport.save();

    // Guardar también en el Historial de Informes (Conversation + Message)
    try {
      const { saveConvo } = require('~/models/Conversation');
      const { saveMessage } = require('~/models/Message');
      const { Conversation } = require('~/db/models');
      const conversationId = uuidv4();
      const messageId = uuidv4();
      const reportTitle = `Acta COPASST ${dbActa?.consecutivo || acta.consecutivo || ''} - Mes ${dbActa?.mes || acta.mes}/${dbActa?.anio || acta.anio}`;
      const reportTags = ['sgsst-copasst', `company-${company._id.toString()}`];

      await saveConvo(
        req,
        {
          conversationId,
          title: reportTitle,
          endpoint: 'sgsst-diagnostico',
          model: 'sgsst-diagnostico',
          tags: reportTags,
        },
        { context: 'COPASST reporte-oficial history' }
      );
      await saveMessage(
        req,
        {
          messageId,
          conversationId,
          text: fullHtml,
          sender: 'COPASST',
          isCreatedByUser: false,
          parentMessageId: '00000000-0000-0000-0000-000000000000',
        },
        { context: 'COPASST reporte-oficial message' }
      );
      if (Conversation) {
        await Conversation.findOneAndUpdate(
          { conversationId, user: req.user.id },
          { $addToSet: { tags: { $each: reportTags } } },
          { new: true }
        );
      }
    } catch (histErr) {
      logger.warn('[COPASST] Could not save report to Conversation history:', histErr.message);
    }

    res.json({
      success: true,
      reportId,
      url: `/report/${reportId}`,
      html: fullHtml,
      desarrolloEnriquecido,
      acta: dbActa,
    });
  } catch (error) {
    logger.error('[COPASST] POST /actas/:id/reporte-oficial error:', error);
    res.status(500).json({ error: 'Error al generar el reporte oficial con firmas' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ─── COMITÉ DE SEGURIDAD VIAL (CSV - PESV Res. 20223040040595 Paso 1 y 2) ────
// ═════════════════════════════════════════════════════════════════════════════

function calculatePesvLevel(flotaTotal = 0, conductoresTotal = 0) {
  const f = Number(flotaTotal) || 0;
  const c = Number(conductoresTotal) || 0;
  if (f > 50 || c > 50) {
    return {
      nivel: 'Avanzado',
      requiereComite: true,
      minIntegrantes: 3,
      pasosAplicables: 24,
      descripcion: 'Más de 50 vehículos o más de 50 conductores: Nivel Avanzado (24 pasos). Requiere Líder PESV (Paso 1) y Comité de Seguridad Vial (Paso 2) con sesiones trimestrales obligatorias.',
    };
  }
  if ((f >= 20 && f <= 50) || (c >= 20 && c <= 50)) {
    return {
      nivel: 'Estándar',
      requiereComite: true,
      minIntegrantes: 3,
      pasosAplicables: 22,
      descripcion: 'Entre 20 y 50 vehículos o entre 20 y 50 conductores: Nivel Estándar (22 pasos). Requiere Líder PESV (Paso 1) y Comité de Seguridad Vial (Paso 2) con mínimo 3 integrantes.',
    };
  }
  return {
    nivel: 'Básico',
    requiereComite: false,
    minIntegrantes: 1,
    pasosAplicables: 19,
    descripcion: 'Entre 11 y 19 vehículos o entre 2 y 19 conductores: Nivel Básico (19 pasos). Obligatorio designar Líder PESV (Paso 1); el Comité de Seguridad Vial (Paso 2) puede conformarse voluntariamente como buena práctica.',
  };
}

// ─── 11. GET /pesv/config — Configuración, Comité CSV, Actas y Metas PESV ────
router.get('/pesv/config', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) {
      return res.status(404).json({ error: 'No se encontró una empresa activa.' });
    }

    const activeComite =
      (await SgsstPesvComite.findOne({ companyId: company._id, estado: 'vigente' }).sort({ createdAt: -1 }).lean()) ||
      (await SgsstPesvComite.findOne({ companyId: company._id }).sort({ createdAt: -1 }).lean());

    const currentYear = Number(req.query.anio) || new Date().getFullYear();
    const actas = await SgsstPesvActa.find({
      companyId: company._id,
      anio: currentYear,
    })
      .sort({ mes: 1, fechaReunion: 1 })
      .lean();

    const escala = calculatePesvLevel(activeComite?.flotaTotal || 15, activeComite?.conductoresTotal || 15);

    res.json({
      company: {
        _id: company._id,
        companyName: company.companyName,
        nit: company.nit,
        workerCount: Number(company.workerCount) || 1,
        riskLevel: company.riskLevel || 'I',
        arl: company.arl || '',
        economicActivity: company.economicActivity || '',
        legalRepresentative: company.legalRepresentative || '',
        responsibleSST: company.responsibleSST || '',
      },
      escala,
      activeComite,
      actas,
      currentYear,
    });
  } catch (error) {
    logger.error('[CSV-PESV] GET /pesv/config error:', error);
    res.status(500).json({ error: 'Error al obtener la configuración del Comité de Seguridad Vial' });
  }
});

// ─── 12. POST /pesv/comite — Guardar / Actualizar Conformación CSV y Líder PESV ─
router.post('/pesv/comite', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const {
      id,
      periodoInicio,
      periodoFin,
      nivelPesv,
      flotaTotal,
      conductoresTotal,
      frecuenciaReuniones,
      liderPesv,
      integrantesComite,
      metasAnuales,
      observaciones,
    } = req.body;

    const cleanIntegrantes = (Array.isArray(integrantesComite) ? integrantesComite : []).map((r) => ({
      nombre: String(r?.nombre || '').trim() || 'Integrante CSV',
      cedula: String(r?.cedula || '').trim() || 'S/N',
      cargo: String(r?.cargo || '').trim(),
      rol: r?.rol || 'Integrante Principal',
      telefono: String(r?.telefono || '').trim(),
      email: String(r?.email || '').trim(),
    }));

    const defaultMetas = [
      {
        codigo: 'TSV-01',
        indicador: 'Tasa de Siniestros Viales por Nivel de Pérdida (TSV)',
        metaAnual: 'Reducción ≥ 10% frente a línea base (0 fatalidades)',
        resultadoActual: '0 siniestros mortales / En seguimiento',
        estado: 'Cumplida',
      },
      {
        codigo: 'IDP-02',
        indicador: 'Ejecución de Inspecciones Preoperacionales Diarias (Paso 16)',
        metaAnual: '≥ 95% de vehículos inspeccionados antes de marcha',
        resultadoActual: 'En seguimiento trimestral',
        estado: 'En Seguimiento',
      },
      {
        codigo: 'CMP-03',
        indicador: 'Cumplimiento del Plan de Mantenimiento Preventivo de Flota (Paso 17)',
        metaAnual: '≥ 90% de mantenimientos preventivos ejecutados a tiempo',
        resultadoActual: 'En seguimiento trimestral',
        estado: 'En Seguimiento',
      },
      {
        codigo: 'CAP-04',
        indicador: 'Cobertura del Plan Anual de Formación Vial (Paso 10)',
        metaAnual: '≥ 90% de actores viales capacitados y evaluados',
        resultadoActual: 'En seguimiento trimestral',
        estado: 'En Seguimiento',
      },
    ];

    let comite;
    const start = periodoInicio ? new Date(periodoInicio) : new Date();
    const end = periodoFin
      ? new Date(periodoFin)
      : new Date(new Date(start).setFullYear(start.getFullYear() + 2));

    if (id) {
      comite = await SgsstPesvComite.findOneAndUpdate(
        { _id: id, companyId: company._id },
        {
          $set: {
            periodoInicio: start,
            periodoFin: end,
            nivelPesv: nivelPesv || 'Estándar',
            flotaTotal: Number(flotaTotal) || 0,
            conductoresTotal: Number(conductoresTotal) || 0,
            frecuenciaReuniones: frecuenciaReuniones || 'Trimestral',
            liderPesv: liderPesv || {},
            integrantesComite: cleanIntegrantes,
            metasAnuales: Array.isArray(metasAnuales) && metasAnuales.length > 0 ? metasAnuales : defaultMetas,
            observaciones: observaciones || '',
            estado: 'vigente',
          },
        },
        { new: true }
      );
    } else {
      await SgsstPesvComite.updateMany({ companyId: company._id, estado: 'vigente' }, { $set: { estado: 'vencido' } });
      comite = await SgsstPesvComite.create({
        companyId: company._id,
        periodoInicio: start,
        periodoFin: end,
        nivelPesv: nivelPesv || 'Estándar',
        flotaTotal: Number(flotaTotal) || 0,
        conductoresTotal: Number(conductoresTotal) || 0,
        frecuenciaReuniones: frecuenciaReuniones || 'Trimestral',
        liderPesv: liderPesv || {},
        integrantesComite: cleanIntegrantes,
        metasAnuales: Array.isArray(metasAnuales) && metasAnuales.length > 0 ? metasAnuales : defaultMetas,
        observaciones: observaciones || '',
        estado: 'vigente',
      });
    }

    res.json({ success: true, comite });
  } catch (error) {
    logger.error('[CSV-PESV] POST /pesv/comite error:', error);
    res.status(500).json({ error: 'Error al guardar la conformación del Comité de Seguridad Vial' });
  }
});

// ─── 13. GET /pesv/actas — Listar Actas del Comité Vial por Año ───────────────
router.get('/pesv/actas', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const anio = Number(req.query.anio) || new Date().getFullYear();
    const actas = await SgsstPesvActa.find({ companyId: company._id, anio }).sort({ mes: 1, fechaReunion: 1 }).lean();
    res.json({ actas });
  } catch (error) {
    logger.error('[CSV-PESV] GET /pesv/actas error:', error);
    res.status(500).json({ error: 'Error al listar actas del Comité de Seguridad Vial' });
  }
});

// ─── 14. POST /pesv/actas — Crear o Actualizar Acta del CSV y Sincronizar ACPM ─
router.post('/pesv/actas', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const {
      id,
      numeroActa,
      consecutivo,
      tipoSesion,
      trimestre,
      mes,
      anio,
      fechaReunion,
      fecha,
      horaInicio,
      horaFin,
      lugarModalidad,
      lugar,
      asistentes,
      ordenDelDia,
      desarrollo,
      compromisos,
      resumenEjecutivoIA,
      reporteOficialHtml,
      estadoActa,
    } = req.body;

    const targetYear = Number(anio) || new Date().getFullYear();
    const targetMonth = Number(mes) || new Date().getMonth() + 1;

    // Sincronizar compromisos con el Centro de Control ACPM (KanbanTask)
    const syncedCompromisos = [];
    if (Array.isArray(compromisos)) {
      for (const comp of compromisos) {
        const actividadTxt = String(comp.actividad || comp.accion || '').trim();
        if (!actividadTxt) continue;
        let taskId = comp.kanbanTaskId;

        if (!taskId) {
          try {
            const newTask = await KanbanTask.create({
              user: req.user.id,
              companyId: company._id,
              title: `[CSV-PESV] ${actividadTxt.substring(0, 90)}`,
              description: `Compromiso emanado del Comité de Seguridad Vial (CSV - PESV) - Acta ${numeroActa || consecutivo || `${targetMonth}/${targetYear}`}.\nResponsable: ${comp.responsable || 'Líder PESV / Comité Vial'}\nFecha límite: ${comp.fechaLimite || 'Por definir'}`,
              status: comp.estado === 'Cumplido' || comp.estado === 'cumplido' ? 'done' : comp.estado === 'En Proceso' || comp.estado === 'en_progreso' ? 'in_progress' : 'todo',
              priority: 'high',
              category: 'PESV - Comité de Seguridad Vial',
              dueDate: comp.fechaLimite ? new Date(comp.fechaLimite) : undefined,
              assignee: comp.responsable || 'Comité de Seguridad Vial',
            });
            taskId = newTask._id.toString();
          } catch (kErr) {
            logger.warn('[CSV-PESV] No se pudo crear tarea en KanbanTask:', kErr.message);
          }
        }

        syncedCompromisos.push({
          actividad: actividadTxt,
          responsable: comp.responsable || 'Comité de Seguridad Vial',
          fechaLimite: comp.fechaLimite || null,
          estado: comp.estado === 'cumplido' ? 'Cumplido' : comp.estado === 'en_progreso' ? 'En Proceso' : comp.estado || 'Pendiente',
          kanbanTaskId: taskId || null,
        });
      }
    }

    let acta;
    const mappedOrden = ordenDelDia || {
      verificacionQuorumActaAnterior: desarrollo?.verificacionQuorumActaAnterior || '',
      seguimientoCompromisosViales: desarrollo?.seguimientoCompromisosViales || '',
      analisisSiniestralidadInfracciones: desarrollo?.analisisSiniestralidadInfracciones || '',
      inspeccionesPreoperacionalesMantenimiento: desarrollo?.inspeccionesPreoperacionalesMantenimiento || '',
      factoresHumanosVelocidadFatigaAlcohol: desarrollo?.factoresHumanosVelocidadFatigaAlcohol || '',
      capacitacionCompetenciaVial: desarrollo?.capacitacionCompetenciaVial || '',
      revisionIndicadoresPaso20: desarrollo?.revisionIndicadoresPaso20 || '',
      proposicionesPresupuestoVial: desarrollo?.proposicionesPresupuestoVial || '',
    };

    if (id) {
      acta = await SgsstPesvActa.findOne({ _id: id, companyId: company._id });
    }
    if (!acta) {
      acta = await SgsstPesvActa.findOne({ companyId: company._id, anio: targetYear, mes: targetMonth });
    }

    const count = await SgsstPesvActa.countDocuments({ companyId: company._id, anio: targetYear });
    const autoNum =
      numeroActa ||
      consecutivo ||
      `ACTA-CSV-${targetYear}-${String(count + 1).padStart(3, '0')}`;

    const computedTrimestre =
      trimestre ||
      (targetMonth <= 3 ? 'Trimestre I' : targetMonth <= 6 ? 'Trimestre II' : targetMonth <= 9 ? 'Trimestre III' : 'Trimestre IV');

    if (acta) {
      acta.numeroActa = autoNum;
      acta.tipoSesion = tipoSesion || acta.tipoSesion || 'Ordinaria Trimestral';
      acta.trimestre = computedTrimestre;
      acta.mes = targetMonth;
      acta.anio = targetYear;
      acta.fechaReunion = fechaReunion || fecha || acta.fechaReunion || new Date();
      acta.horaInicio = horaInicio || acta.horaInicio || '09:00';
      acta.horaFin = horaFin || acta.horaFin || '10:30';
      acta.lugarModalidad = lugarModalidad || lugar || acta.lugarModalidad || 'Sala de Juntas / Híbrida';
      if (Array.isArray(asistentes)) acta.asistentes = asistentes;
      acta.ordenDelDia = { ...acta.ordenDelDia, ...mappedOrden };
      acta.compromisos = syncedCompromisos;
      if (resumenEjecutivoIA !== undefined || reporteOficialHtml !== undefined) {
        const { updateCommitteeSignatureSectionInHtml } = require('./reportHeader');
        const rawHtml = reporteOficialHtml !== undefined ? reporteOficialHtml : resumenEjecutivoIA;
        acta.resumenEjecutivoIA = updateCommitteeSignatureSectionInHtml(rawHtml, {
          asistentes: Array.isArray(asistentes) ? asistentes : acta.asistentes,
          companyInfo: company,
          tipoComite: 'comite_pesv',
        });
      }
      if (estadoActa) acta.estadoActa = estadoActa;
      await acta.save();
    } else {
      acta = await SgsstPesvActa.create({
        companyId: company._id,
        creadoPor: req.user.id,
        numeroActa: autoNum,
        tipoSesion: tipoSesion || 'Ordinaria Trimestral',
        trimestre: computedTrimestre,
        mes: targetMonth,
        anio: targetYear,
        fechaReunion: fechaReunion || fecha || new Date(),
        horaInicio: horaInicio || '09:00',
        horaFin: horaFin || '10:30',
        lugarModalidad: lugarModalidad || lugar || 'Sala de Juntas / Híbrida',
        asistentes: Array.isArray(asistentes) ? asistentes : [],
        ordenDelDia: mappedOrden,
        compromisos: syncedCompromisos,
        resumenEjecutivoIA: reporteOficialHtml || resumenEjecutivoIA || '',
        estadoActa: estadoActa || 'borrador',
      });
    }

    res.json({ success: true, acta });
  } catch (error) {
    logger.error('[CSV-PESV] POST /pesv/actas error:', error);
    res.status(500).json({ error: 'Error al guardar el acta del Comité de Seguridad Vial' });
  }
});

// ─── 15. DELETE /pesv/actas/:id — Eliminar Acta del Comité Vial ───────────────
router.delete('/pesv/actas/:id', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    await SgsstPesvActa.deleteOne({ _id: req.params.id, companyId: company._id });
    res.json({ success: true });
  } catch (error) {
    logger.error('[CSV-PESV] DELETE /pesv/actas/:id error:', error);
    res.status(500).json({ error: 'Error al eliminar el acta del Comité de Seguridad Vial' });
  }
});

// ─── 16. POST /pesv/actas/generar-borrador-ia — Redactar 8 Puntos PESV con Tenshi IA ─
router.post('/pesv/actas/generar-borrador-ia', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const { mes, anio, trimestre, notasRapidas } = req.body;
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const mesNombre = monthNames[(Number(mes) || 1) - 1] || 'Mes Actual';

    const personalization = req.user?.personalization?.geminiModels;
    const preferredModel =
      personalization?.sstManagement ||
      (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();

    const prompt = `Eres un Consultor Senior en Seguridad Vial Laboral y Auditor Líder del Plan Estratégico de Seguridad Vial (PESV) en Colombia bajo la Resolución 20223040040595 de 2022 del Ministerio de Transporte, el Decreto 1072 de 2015 y la norma ISO 39001.

Debes redactar el desarrollo técnico y profesional de los 8 puntos reglamentarios del Acta del Comité de Seguridad Vial (CSV - Paso 2 del PESV) correspondiente al mes de ${mesNombre} de ${anio || new Date().getFullYear()} (${trimestre || 'Sesión Trimestral'}) para la empresa "${company.companyName}" (Actividad Económica: "${company.economicActivity || 'Operación general y desplazamientos laborales'}", Nivel de Riesgo: ${company.riskLevel || 'I'}, N° Trabajadores: ${company.workerCount || 10}).

Notas o contexto adicional del usuario: "${notasRapidas || 'Sesión ordinaria trimestral de seguimiento a los 24 pasos del PESV, revisión de inspecciones preoperacionales, mantenimiento preventivo de flota, control de velocidad/fatiga y metas del Paso 20.'}"

Devuelve EXCLUSIVAMENTE un objeto JSON válido (sin bloques markdown \`\`\`json) con la siguiente estructura exacta:
{
  "ordenDelDia": {
    "verificacionQuorumActaAnterior": "Texto formal sobre verificación de quórum del Comité de Seguridad Vial y aprobación del acta anterior...",
    "seguimientoCompromisosViales": "Texto formal sobre el estado de los compromisos viales previos y acciones del centro de control ACPM...",
    "analisisSiniestralidadInfracciones": "Análisis técnico de siniestros viales, cuasi-colisiones, comparendos (SIMIT/RUNT) e investigación de incidentes viales (Paso 15)...",
    "inspeccionesPreoperacionalesMantenimiento": "Balance de inspecciones preoperacionales diarias (Paso 16) y cumplimiento del plan de mantenimiento preventivo/correctivo de vehículos propios y contratistas (Paso 17)...",
    "factoresHumanosVelocidadFatigaAlcohol": "Auditoría de programas críticos de gestión del comportamiento (Paso 11): gestión de velocidad segura, prevención de la fatiga, cero alcohol/sustancias psicoactivas y cero distracción...",
    "capacitacionCompetenciaVial": "Avance del Plan Anual de Formación en Seguridad Vial (Paso 10) y evaluación de competencia de conductores y actores viales (Paso 9)...",
    "revisionIndicadoresPaso20": "Evaluación trimestral de los indicadores del PESV (Paso 20): Tasa de Siniestros Viales (TSV), costos de siniestralidad, riesgos viales (Paso 6) y cumplimiento de metas anuales (Paso 7)...",
    "proposicionesPresupuestoVial": "Proposiciones de mejora, ejecución presupuestal de seguridad vial y acuerdos de cierre de la sesión..."
  },
  "compromisosSugeridos": [
    {
      "actividad": "Descripción concreta del compromiso de seguridad vial",
      "responsable": "Líder del PESV / Comité de Seguridad Vial"
    },
    {
      "actividad": "Segunda acción preventiva o de verificación en flota o actores viales",
      "responsable": "Vocal de Mantenimiento y Flota / Operaciones"
    }
  ]
}`;

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
    let rawText = response.text().replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(rawText);

    res.json({ success: true, data: parsed });
  } catch (error) {
    logger.error('[CSV-PESV] POST /pesv/actas/generar-borrador-ia error:', error);
    res.status(500).json({ error: 'Error al redactar el borrador con Tenshi IA' });
  }
});

// ─── 17. POST /pesv/actas/:id/reporte-oficial — Informe Oficial con Membrete y Firmas ─
router.post('/pesv/actas/:id/reporte-oficial', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    let acta;
    let dbActa = null;
    if (req.params.id === 'preview') {
      acta = req.body || {};
      if (!acta.numeroActa) acta.numeroActa = acta.consecutivo || 'BORRADOR';
      if (!acta.mes) acta.mes = new Date().getMonth() + 1;
      if (!acta.anio) acta.anio = new Date().getFullYear();
    } else {
      dbActa = await SgsstPesvActa.findOne({ _id: req.params.id, companyId: company._id });
      if (!dbActa) return res.status(404).json({ error: 'Acta del Comité Vial no encontrada' });
      acta = dbActa.toObject ? dbActa.toObject() : { ...dbActa };
      if (req.body && Object.keys(req.body).length > 0) {
        acta = {
          ...acta,
          ...req.body,
          ordenDelDia: { ...acta.ordenDelDia, ...(req.body.ordenDelDia || req.body.desarrollo || {}) },
        };
      }
    }

    const { buildStandardHeader, buildCommitteeSignatureSection } = require('./reportHeader');
    const PublicReport = require('../../../models/PublicReport');
    const { v4: uuidv4 } = require('uuid');

    const rawDate = acta.fechaReunion || acta.fecha;
    const formattedDate = rawDate
      ? new Date(rawDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    const headerHtml = buildStandardHeader({
      title: `ACTA DE COMITÉ DE SEGURIDAD VIAL N° ${acta.numeroActa || acta.consecutivo || 'BORRADOR'} (CSV - PESV)`,
      companyInfo: company,
      date: formattedDate,
      norm: 'Resolución 20223040040595 de 2022 (Paso 1, Paso 2 y Paso 20) • Ley 1503 de 2011 • ISO 39001',
      cargo: 'Comité de Seguridad Vial (CSV) y Líder del PESV',
      actividad: `Sesión ${acta.tipoSesion || 'Ordinaria Trimestral'} (${acta.trimestre || `Mes ${acta.mes}`}) - Año ${acta.anio}`,
    });

    const asistentesStr =
      Array.isArray(acta.asistentes) && acta.asistentes.length > 0
        ? acta.asistentes
            .map(
              (a) =>
                `${a.nombre || 'Miembro'} (${a.rol || 'Integrante CSV'} - CC: ${a.cedula || 'N/A'} - ${
                  a.asistio !== false ? 'Asistió' : 'Ausente'
                })`
            )
            .join('; ')
        : 'Miembros del Comité de Seguridad Vial (CSV) y Líder del PESV';

    const compromisosStr =
      Array.isArray(acta.compromisos) && acta.compromisos.length > 0
        ? acta.compromisos
            .map(
              (c, idx) =>
                `${idx + 1}. Actividad: ${c.actividad || c.accion} | Responsable: ${c.responsable || 'CSV'} | Fecha límite: ${
                  c.fechaLimite || 'Por definir'
                } | Estado: ${c.estado || 'Pendiente'}`
            )
            .join('\n')
        : 'Sin compromisos manuales previos registrados.';

    const personalization = req.user?.personalization?.geminiModels;
    const preferredModel =
      personalization?.sstManagement ||
      (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();

    let aiBodyHtml = '';
    let ordenEnriquecido = { ...(acta.ordenDelDia || {}) };

    try {
      const aiPrompt = `Eres un Consultor Experto en Seguridad Vial Laboral y Secretario Técnico del Comité de Seguridad Vial (CSV - PESV) en Colombia, especializado en la Resolución 20223040040595 de 2022 del Ministerio de Transporte (Paso 1 Líder PESV, Paso 2 Comité de Seguridad Vial, Paso 6 Riesgos Viales, Paso 11 Factores Humanos, Paso 16 Inspecciones, Paso 17 Mantenimiento y Paso 20 Indicadores) y la norma ISO 39001.

Tu objetivo es tomar los apuntes registrados en el Acta N° ${acta.numeroActa || 'BORRADOR'} (${acta.trimestre || `Mes ${acta.mes}`} de ${acta.anio}) de la empresa "${company.companyName}" (Actividad Económica: ${company.economicActivity || 'General'}, Nivel de Riesgo: ${company.riskLevel || 'I'}, N° Trabajadores: ${company.workerCount || 'N/A'}) y **COMPLEMENTARLOS, EXPANDIRLOS Y ESTRUCTURARLOS** en un **INFORME OFICIAL DE ACTA DEL COMITÉ DE SEGURIDAD VIAL (CSV - PESV) DE ALTA CALIDAD AUDITORA**.

**ASISTENTES CONVOCADOS A LA SESIÓN:**
${asistentesStr}

**APUNTES SUMINISTRADOS EN EL ORDEN DEL DÍA DEL ACTA:**
1. Verificación de Quórum y Lectura del Acta Anterior: ${ordenEnriquecido.verificacionQuorumActaAnterior || '[No detallado - complementar técnicamente]'}
2. Seguimiento a Compromisos Viales y Plan de Trabajo Anual (Paso 7): ${ordenEnriquecido.seguimientoCompromisosViales || '[No detallado - complementar técnicamente]'}
3. Análisis de Siniestralidad Vial, Comparendos e Investigaciones (Paso 15): ${ordenEnriquecido.analisisSiniestralidadInfracciones || '[No detallado - complementar técnicamente]'}
4. Balance de Inspecciones Preoperacionales (Paso 16) y Mantenimiento de Flota (Paso 17): ${ordenEnriquecido.inspeccionesPreoperacionalesMantenimiento || '[No detallado - complementar técnicamente]'}
5. Auditoría de Programas de Comportamiento Seguro (Paso 11: Velocidad, Fatiga, Alcohol y Distracción): ${ordenEnriquecido.factoresHumanosVelocidadFatigaAlcohol || '[No detallado - complementar técnicamente]'}
6. Plan Anual de Formación Vial y Competencia de Actores Viales (Pasos 9 y 10): ${ordenEnriquecido.capacitacionCompetenciaVial || '[No detallado - complementar técnicamente]'}
7. Evaluación de Indicadores Trimestrales y Metas del PESV (Paso 20): ${ordenEnriquecido.revisionIndicadoresPaso20 || '[No detallado - complementar técnicamente]'}
8. Proposiciones, Presupuesto de Seguridad Vial y Acuerdos de Cierre: ${ordenEnriquecido.proposicionesPresupuestoVial || '[No detallado - complementar técnicamente]'}

**COMPROMISOS REGISTRADOS:**
${compromisosStr}

**INSTRUCCIONES DE SALIDA (JSON ESTRICTO):**
Devuelve un objeto JSON válido con dos propiedades principales:
1. \`"ordenEnriquecido"\`: Un objeto con las 8 claves exactas (\`verificacionQuorumActaAnterior\`, \`seguimientoCompromisosViales\`, \`analisisSiniestralidadInfracciones\`, \`inspeccionesPreoperacionalesMantenimiento\`, \`factoresHumanosVelocidadFatigaAlcohol\`, \`capacitacionCompetenciaVial\`, \`revisionIndicadoresPaso20\`, \`proposicionesPresupuestoVial\`), con redacción técnica formal en texto plano.
2. \`"htmlBody"\`: Código HTML puro (sin etiquetas \`<html>\`, \`<body>\`, ni bloques markdown) con:
   - **Sección A: Dictamen Ejecutivo Trimestral de Gobernanza Vial (Paso 2 PESV)** en bloque destacado con borde izquierdo \`#0f766e\`.
   - **Sección B: Desarrollo Técnico y Normativo de los 8 Puntos del Comité de Seguridad Vial**, con tarjetas HTML estilizadas para cada uno de los 8 puntos.
   - **Sección C: Tablero Técnico de Seguimiento a Indicadores del PESV (Paso 20 Res. 20223040040595)** en tabla HTML con columnas: **Indicador PESV (Paso 20)** | **Hallazgo / Estado del Periodo** | **Medida de Control Adoptada por el CSV** | **Soporte Normativo** | **Estado**.
   - **Sección D: Plan de Acción Vial y Compromisos Adquiridos (Ciclo PHVA)** en tabla HTML detallada.
   - **Sección E: Constancia Reglamentaria de Aprobación y Cierre** para verificación ante el Ministerio de Transporte, Superintendencia de Transporte o Ministerio del Trabajo.`;

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

      if (parsedAi.ordenEnriquecido && typeof parsedAi.ordenEnriquecido === 'object') {
        ordenEnriquecido = {
          ...ordenEnriquecido,
          ...parsedAi.ordenEnriquecido,
        };
        acta.ordenDelDia = ordenEnriquecido;
      }

      if (parsedAi.htmlBody && typeof parsedAi.htmlBody === 'string') {
        aiBodyHtml = parsedAi.htmlBody
          .replace(/```html\n?/gi, '')
          .replace(/```\n?/g, '')
          .trim();
      }
    } catch (aiErr) {
      logger.warn('[CSV-PESV] AI enrichment fallback in reporte-oficial:', aiErr.message);
    }

    const compromisosRows =
      Array.isArray(acta.compromisos) && acta.compromisos.length > 0
        ? acta.compromisos
            .map(
              (c, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 8px 10px; font-weight: bold; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 8px 10px; color: #1e293b; font-weight: 600;">${c.actividad || c.accion}</td>
          <td style="padding: 8px 10px; color: #0f766e; font-weight: bold;">${c.responsable || 'Comité Vial'}</td>
          <td style="padding: 8px 10px; color: #475569;">${c.fechaLimite ? new Date(c.fechaLimite).toLocaleDateString('es-CO') : 'Por definir'}</td>
          <td style="padding: 8px 10px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 9px; font-weight: 800; background-color: ${
              c.estado === 'Cumplido' || c.estado === 'cumplido' ? '#dcfce7' : c.estado === 'En Proceso' ? '#e0f2fe' : '#fef3c7'
            }; color: ${
                c.estado === 'Cumplido' || c.estado === 'cumplido' ? '#15803d' : c.estado === 'En Proceso' ? '#0369a1' : '#b45309'
              }; text-transform: uppercase;">
              ${c.estado || 'Pendiente'}
            </span>
          </td>
        </tr>
      `
            )
            .join('')
        : `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8; font-style: italic; font-size: 11px;">No se registraron compromisos adicionales en esta sesión.</td></tr>`;

    const fallbackBodyHtml = `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; color: #0f766e; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 6px;">
          📝 DESARROLLO Y ANÁLISIS DE LA SESIÓN DEL COMITÉ DE SEGURIDAD VIAL
        </h3>
        ${[
          ['1. Verificación de Quórum y Lectura del Acta Anterior', ordenEnriquecido.verificacionQuorumActaAnterior],
          ['2. Seguimiento a Compromisos Viales y Plan de Trabajo Anual (Paso 7)', ordenEnriquecido.seguimientoCompromisosViales],
          ['3. Análisis de Siniestralidad Vial, Comparendos e Investigaciones (Paso 15)', ordenEnriquecido.analisisSiniestralidadInfracciones],
          ['4. Balance de Inspecciones Preoperacionales (Paso 16) y Mantenimiento de Flota (Paso 17)', ordenEnriquecido.inspeccionesPreoperacionalesMantenimiento],
          ['5. Auditoría de Programas Críticos de Comportamiento (Paso 11: Velocidad, Fatiga, Alcohol y Distracción)', ordenEnriquecido.factoresHumanosVelocidadFatigaAlcohol],
          ['6. Plan Anual de Formación Vial y Competencia de Actores Viales (Pasos 9 y 10)', ordenEnriquecido.capacitacionCompetenciaVial],
          ['7. Evaluación de Indicadores Trimestrales y Metas del PESV (Paso 20)', ordenEnriquecido.revisionIndicadoresPaso20],
          ['8. Proposiciones, Presupuesto de Seguridad Vial y Acuerdos de Cierre', ordenEnriquecido.proposicionesPresupuestoVial],
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

      <div style="margin-bottom: 24px; page-break-inside: avoid;">
        <h3 style="margin: 0 0 10px 0; font-size: 12.5px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">
          🎯 PLAN DE ACCIÓN VIAL Y COMPROMISOS ADQUIRIDOS (PASO 2 PESV)
        </h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; font-size: 10.5px; font-weight: 800; text-transform: uppercase;">
              <th style="padding: 8px 10px; width: 6%; text-align: center;">#</th>
              <th style="padding: 8px 10px; width: 44%; text-align: left;">Compromiso / Acción Preventiva Vial</th>
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

    const signaturesHtml = buildCommitteeSignatureSection({
      asistentes: acta.asistentes,
      companyInfo: company,
      tipoComite: 'comite_pesv',
    });

    const fullHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; line-height: 1.5;">
        ${headerHtml}

        <!-- Ficha de la Sesión del Comité de Seguridad Vial -->
        <div style="margin-bottom: 24px; border: 1.5px solid #0f766e; border-radius: 12px; overflow: hidden; page-break-inside: avoid;">
          <div style="background: linear-gradient(90deg, #0f766e, #0d9488); color: #ffffff; padding: 9px 14px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            🚗 DATOS GENERALES DE LA SESIÓN DEL COMITÉ DE SEGURIDAD VIAL (PASO 2 PESV)
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; width: 25%; color: #334155;">N° de Acta:</td>
                <td style="padding: 8px 12px; font-weight: 700; color: #0f766e; width: 25%;">${acta.numeroActa || acta.consecutivo || 'Borrador'}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; width: 25%; color: #334155;">Trimestre / Periodo:</td>
                <td style="padding: 8px 12px; width: 25%;">${acta.trimestre || 'Trimestral'} (Mes ${acta.mes} de ${acta.anio})</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Fecha de Reunión:</td>
                <td style="padding: 8px 12px;">${formattedDate}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Horario:</td>
                <td style="padding: 8px 12px;">${acta.horaInicio || '09:00'} - ${acta.horaFin || '10:30'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Lugar / Modalidad:</td>
                <td style="padding: 8px 12px;">${acta.lugarModalidad || acta.lugar || 'Sala de Juntas / Híbrida'}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Tipo de Sesión:</td>
                <td style="padding: 8px 12px; font-weight: bold; color: #0f766e;">${acta.tipoSesion || 'Ordinaria Trimestral'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${aiBodyHtml || fallbackBodyHtml}

        <!-- Firmas Oficiales de los Miembros del Comité de Seguridad Vial -->
        ${signaturesHtml}
      </div>
    `;

    if (!dbActa) {
      const targetYear = Number(acta.anio) || new Date().getFullYear();
      const targetMonth = Number(acta.mes) || new Date().getMonth() + 1;
      dbActa = await SgsstPesvActa.findOne({ companyId: company._id, anio: targetYear, mes: targetMonth });
      if (!dbActa) {
        const count = await SgsstPesvActa.countDocuments({ companyId: company._id, anio: targetYear });
        const autNumero =
          acta.numeroActa && acta.numeroActa !== 'BORRADOR'
            ? acta.numeroActa
            : `ACTA-CSV-${targetYear}-${String(count + 1).padStart(3, '0')}`;
        dbActa = new SgsstPesvActa({
          companyId: company._id,
          creadoPor: req.user.id,
          numeroActa: autNumero,
          tipoSesion: acta.tipoSesion || 'Ordinaria Trimestral',
          trimestre: acta.trimestre || 'Trimestre I',
          mes: targetMonth,
          anio: targetYear,
          fechaReunion: acta.fechaReunion || acta.fecha || Date.now(),
          lugarModalidad: acta.lugarModalidad || acta.lugar || 'Sala de Juntas / Híbrida',
          horaInicio: acta.horaInicio || '09:00',
          horaFin: acta.horaFin || '10:30',
          asistentes: Array.isArray(acta.asistentes) ? acta.asistentes : [],
          compromisos: Array.isArray(acta.compromisos) ? acta.compromisos : [],
        });
      }
    }

    if (dbActa) {
      if (Array.isArray(acta.asistentes)) dbActa.asistentes = acta.asistentes;
      if (Array.isArray(acta.compromisos)) dbActa.compromisos = acta.compromisos;
      if (acta.fechaReunion || acta.fecha) dbActa.fechaReunion = acta.fechaReunion || acta.fecha;
      if (acta.lugarModalidad || acta.lugar) dbActa.lugarModalidad = acta.lugarModalidad || acta.lugar;
      if (acta.horaInicio) dbActa.horaInicio = acta.horaInicio;
      if (acta.horaFin) dbActa.horaFin = acta.horaFin;
      dbActa.ordenDelDia = { ...dbActa.ordenDelDia, ...ordenEnriquecido };
      dbActa.resumenEjecutivoIA = fullHtml;
      await dbActa.save();
    }

    const reportId = uuidv4();
    const publicReport = new PublicReport({
      id: reportId,
      content: fullHtml,
      fileName: `Acta-CSV-PESV-${dbActa?.numeroActa || acta.numeroActa || 'Borrador'}`,
      reportType: 'general',
    });
    await publicReport.save();

    // Guardar en Historial de Informes (Conversation + Message) con tag 'sgsst-comite-pesv'
    try {
      const { saveConvo } = require('~/models/Conversation');
      const { saveMessage } = require('~/models/Message');
      const { Conversation } = require('~/db/models');
      const conversationId = uuidv4();
      const messageId = uuidv4();
      const reportTitle = `Acta CSV-PESV ${dbActa?.numeroActa || acta.numeroActa || ''} - Mes ${dbActa?.mes || acta.mes}/${dbActa?.anio || acta.anio}`;
      const reportTags = ['sgsst-comite-pesv', `company-${company._id.toString()}`];

      await saveConvo(
        req,
        {
          conversationId,
          title: reportTitle,
          endpoint: 'sgsst-diagnostico',
          model: 'sgsst-diagnostico',
          tags: reportTags,
        },
        { context: 'CSV-PESV reporte-oficial history' }
      );
      await saveMessage(
        req,
        {
          messageId,
          conversationId,
          text: fullHtml,
          sender: 'CSV-PESV',
          isCreatedByUser: false,
          parentMessageId: '00000000-0000-0000-0000-000000000000',
        },
        { context: 'CSV-PESV reporte-oficial message' }
      );
      if (Conversation) {
        await Conversation.findOneAndUpdate(
          { conversationId, user: req.user.id },
          { $addToSet: { tags: { $each: reportTags } } },
          { new: true }
        );
      }
    } catch (histErr) {
      logger.warn('[CSV-PESV] Could not save report to Conversation history:', histErr.message);
    }

    res.json({
      success: true,
      reportId,
      url: `/report/${reportId}`,
      html: fullHtml,
      ordenEnriquecido,
      acta: dbActa,
    });
  } catch (error) {
    logger.error('[CSV-PESV] POST /pesv/actas/:id/reporte-oficial error:', error);
    res.status(500).json({ error: 'Error al generar el informe oficial del Comité de Seguridad Vial' });
  }
});

module.exports = router;

