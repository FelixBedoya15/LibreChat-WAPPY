const express = require('express');
const router = express.Router();
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const CompanyInfo = require('../../../models/CompanyInfo');
const { SgsstCopasstComite, SgsstCopasstActa, SgsstEleccion } = require('../../../models/SgsstCopasst');
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

    let workers = await SgsstWorker.find({ companyId: company._id, estado: { $ne: 'retirado' } })
      .select('nombre cedula cargo area email telefono')
      .sort({ nombre: 1 })
      .lean();

    const perfilDoc = await PerfilSociodemograficoData.findOne({ companyId: company._id }).lean()
      || await PerfilSociodemograficoData.findOne({ user: req.user.id }).lean();

    if (perfilDoc && Array.isArray(perfilDoc.trabajadores)) {
      const existingCedulas = new Set((workers || []).map(w => String(w.cedula || '').trim()));
      perfilDoc.trabajadores.forEach(w => {
        const c = String(w.identificacion || '').trim();
        if (c && !existingCedulas.has(c)) {
          existingCedulas.add(c);
          workers.push({
            nombre: w.nombre,
            cedula: c,
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
      lugar,
      ordenDelDia,
      quorumVerificado,
      asistentes,
      desarrollo,
      compromisos,
      proximaReunionFecha,
      estadoActa,
    } = req.body;

    let acta;
    if (id) {
      acta = await SgsstCopasstActa.findOne({ _id: id, companyId: company._id });
    }

    if (!acta) {
      // Si no viene consecutivo, autogenerar
      const currentYear = anio || new Date().getFullYear();
      const count = await SgsstCopasstActa.countDocuments({ companyId: company._id, anio: currentYear });
      const autConsecutivo = consecutivo || `ACTA-COPASST-${currentYear}-${String(count + 1).padStart(3, '0')}`;

      acta = new SgsstCopasstActa({
        companyId: company._id,
        user: req.user.id,
        consecutivo: autConsecutivo,
        mes: mes || new Date().getMonth() + 1,
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
    if (lugar) acta.lugar = lugar;
    if (Array.isArray(ordenDelDia)) acta.ordenDelDia = ordenDelDia;
    if (quorumVerificado !== undefined) acta.quorumVerificado = quorumVerificado;
    if (Array.isArray(asistentes)) acta.asistentes = asistentes;
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

    const { mes, anio, notasAdicionales, accidentalidadReportada, inspeccionesRealizadas } = req.body;

    const prompt = `Actúa como Tenshi, experta líder en Seguridad y Salud en el Trabajo y secretaria técnica consultora bajo la normativa colombiana (Resolución 2013 de 1986, Decreto 1072 de 2015 Art. 2.2.4.6.8 y Resolución 0312 de 2019 Estándar 1.1.6).
Redacta el desarrollo formal, técnico y propositivo de una Reunión Ordinaria Mensual del COPASST para la empresa "${company.companyName}".
Mes: ${mes || 'Mes en curso'} de ${anio || new Date().getFullYear()}.

Datos de entrada del mes:
- Accidentalidad y ausentismo (ATEL): ${accidentalidadReportada || 'Cero accidentes incapacitantes en el periodo. Se investigó 1 casi-accidente sin lesión.'}
- Inspecciones de seguridad física y condiciones de trabajo: ${inspeccionesRealizadas || 'Inspección de extintores, botiquines y orden y aseo en puestos operativos.'}
- Notas del coordinador o miembros: ${notasAdicionales || 'Se requiere reforzar divulgación del canal anónimo de reporte.'}

Genera un JSON EXACTO con las siguientes claves:
{
  "lecturaActaAnterior": "Texto formal de aprobación...",
  "analisisAccidentalidad": "Análisis técnico y estadístico del comportamiento de accidentalidad...",
  "inspeccionesSeguridad": "Hallazgos de la ronda de inspección paritaria y recomendaciones de mejora...",
  "capacitacionesYCampanas": "Evaluación del cronograma formativo y sensibilizaciones del mes...",
  "proposicionesVarios": "Propuestas paritarias y reconocimientos...",
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
        lecturaActaAnterior: 'Se dio lectura al acta anterior, siendo aprobada por unanimidad de los miembros asistentes.',
        analisisAccidentalidad: 'Revisión mensual de indicadores de severidad y frecuencia ATEL sin novedad crítica.',
        inspeccionesSeguridad: 'Verificación periódica de instalaciones y equipos de emergencia.',
        capacitacionesYCampanas: 'Seguimiento al cumplimiento del plan anual de capacitación SG-SST.',
        proposicionesVarios: 'Se coordinan preparativos para la próxima reunión ordinaria.',
        compromisosSugeridos: [],
      };
    }

    res.json({ success: true, borrador: parsed });
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
      candidatos: Array.isArray(candidatos) ? candidatos : [],
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

// ─── 10. POST /actas/:id/reporte-oficial — Generar Documento Oficial con Firmas de Participantes ──
router.post('/actas/:id/reporte-oficial', requireJwtAuth, async (req, res) => {
  try {
    const company = await getActiveCompany(req.user.id);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const acta = await SgsstCopasstActa.findOne({ _id: req.params.id, companyId: company._id });
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada' });

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

    const ordenList = Array.isArray(acta.ordenDelDia) && acta.ordenDelDia.length > 0
      ? acta.ordenDelDia.map((item) => `<li style="margin-bottom: 6px; font-weight: 500;">${item}</li>`).join('')
      : '<li>1. Verificación del quórum reglamentario</li><li>2. Revisión de compromisos anteriores</li><li>3. Análisis de accidentalidad y condiciones</li>';

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
                <td style="padding: 8px 12px; font-weight: 700; color: #0f766e; width: 25%;">${acta.consecutivo}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; width: 25%; color: #334155;">Periodo Evaluado:</td>
                <td style="padding: 8px 12px; width: 25%;">Mes ${acta.mes} de ${acta.anio}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Tipo de Reunión:</td>
                <td style="padding: 8px 12px; text-transform: capitalize;">${acta.tipo === 'extraordinaria' ? 'Extraordinaria' : 'Ordinaria Mensual'}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Horario:</td>
                <td style="padding: 8px 12px;">${acta.horaInicio || '08:00'} - ${acta.horaFin || '10:00'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Lugar de la Sesión:</td>
                <td style="padding: 8px 12px;">${acta.lugar || 'Sede Principal / Virtual'}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; color: #334155;">Quórum Reglamentario:</td>
                <td style="padding: 8px 12px; font-weight: bold; color: ${acta.quorumVerificado !== false ? '#15803d' : '#b45309'};">
                  ${acta.quorumVerificado !== false ? '✓ Quórum Verificado y Válido' : 'Quórum Pendiente'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Orden del Día -->
        <div style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background-color: #f8fafc; page-break-inside: avoid;">
          <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">
            📋 ORDEN DEL DÍA
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 11.5px; color: #334155;">
            ${ordenList}
          </ul>
        </div>

        <!-- Desarrollo Temático -->
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; color: #0f766e; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 6px;">
            📝 DESARROLLO Y ANÁLISIS DE LA REUNIÓN
          </h3>

          ${
            acta.desarrollo?.lecturaActaAnterior
              ? `
            <div style="margin-bottom: 14px; page-break-inside: avoid;">
              <h4 style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase;">
                1. Lectura y Aprobación del Acta Anterior
              </h4>
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 11px; color: #334155; line-height: 1.6;">
                ${acta.desarrollo.lecturaActaAnterior}
              </div>
            </div>
          `
              : ''
          }

          ${
            acta.desarrollo?.analisisAccidentalidad
              ? `
            <div style="margin-bottom: 14px; page-break-inside: avoid;">
              <h4 style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase;">
                2. Revisión y Análisis de Accidentalidad, Incidentes y Ausentismo (ATEL)
              </h4>
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 11px; color: #334155; line-height: 1.6;">
                ${acta.desarrollo.analisisAccidentalidad}
              </div>
            </div>
          `
              : ''
          }

          ${
            acta.desarrollo?.inspeccionesSeguridad
              ? `
            <div style="margin-bottom: 14px; page-break-inside: avoid;">
              <h4 style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase;">
                3. Inspecciones Planeadas de Seguridad y Hallazgos en Terreno
              </h4>
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 11px; color: #334155; line-height: 1.6;">
                ${acta.desarrollo.inspeccionesSeguridad}
              </div>
            </div>
          `
              : ''
          }

          ${
            acta.desarrollo?.capacitacionesYCampanas
              ? `
            <div style="margin-bottom: 14px; page-break-inside: avoid;">
              <h4 style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase;">
                4. Cumplimiento de Cronograma de Capacitaciones y Campañas
              </h4>
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 11px; color: #334155; line-height: 1.6;">
                ${acta.desarrollo.capacitacionesYCampanas}
              </div>
            </div>
          `
              : ''
          }

          ${
            acta.desarrollo?.proposicionesVarios
              ? `
            <div style="margin-bottom: 14px; page-break-inside: avoid;">
              <h4 style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase;">
                5. Proposiciones, Varios y Acuerdos de Cierre
              </h4>
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 11px; color: #334155; line-height: 1.6;">
                ${acta.desarrollo.proposicionesVarios}
              </div>
            </div>
          `
              : ''
          }
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

        <!-- Firmas Oficiales de los Participantes del COPASST -->
        ${signaturesHtml}
      </div>
    `;

    const reportId = uuidv4();
    const publicReport = new PublicReport({
      id: reportId,
      content: fullHtml,
      fileName: `Acta-COPASST-${acta.consecutivo}`,
      reportType: 'general',
    });
    await publicReport.save();

    res.json({
      success: true,
      reportId,
      url: `/report/${reportId}`,
    });
  } catch (error) {
    logger.error('[COPASST] POST /actas/:id/reporte-oficial error:', error);
    res.status(500).json({ error: 'Error al generar el reporte oficial con firmas' });
  }
});

module.exports = router;
