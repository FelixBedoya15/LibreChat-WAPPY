const express = require('express');
const mongoose = require('mongoose');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const Notification = require('~/models/Notification');

const router = express.Router();

// ─── Control de Concurrencia de Sesiones 1 a 1 para Trabajadores (EPT) ────────
// Protege las claves API de saturación y garantiza atención individualizada.
// SOLO aplica a trabajadores públicos, nunca a usuarios administradores ni subusuarios en LibreChat.
const activeWorkerSessionsByCompany = new Map();
const WORKER_SESSION_TIMEOUT_MS = 25 * 60 * 1000; // 25 minutos máximo por turno

function getActiveWorkerSession(companyId) {
  if (!companyId) return null;
  const key = String(companyId);
  const session = activeWorkerSessionsByCompany.get(key);
  if (!session) return null;
  if (Date.now() - session.startedAt > WORKER_SESSION_TIMEOUT_MS) {
    activeWorkerSessionsByCompany.delete(key);
    return null;
  }
  return session;
}

function releaseWorkerSession(companyId) {
  if (companyId) {
    activeWorkerSessionsByCompany.delete(String(companyId));
  }
}

// ─── Helper: Resolver Empresa Activa ─────────────────────────────────────────
async function resolveActiveCompany(companyId) {
  if (!mongoose.Types.ObjectId.isValid(companyId)) return null;

  // 1. Intentar buscar por el _id directo de la empresa (si ya viene resuelto)
  let company = await CompanyInfo.findById(companyId).lean();
  if (company) return company;

  // 2. Si no se encuentra, asumir que es el ID del usuario (propietario) y buscar la empresa activa
  company = await CompanyInfo.findOne({ user: companyId, isActive: true }).lean();

  // 3. Fallback: Si no hay empresa activa explícita, devolver la primera empresa de ese usuario
  if (!company) {
    company = await CompanyInfo.findOne({ user: companyId }).lean();
  }

  return company;
}

// ─── Helper: Resolver Empresa y Perfil Multi-Empresa para un Trabajador ───────
async function resolveCompanyAndWorker(companyId, { cedula, workerId } = {}) {
  let company = await resolveActiveCompany(companyId);
  if (!company) return { company: null, perfil: null, worker: null };

  let PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
  if (!PerfilSociodemograficoData) {
    try {
      require('./sgsst/perfilSociodemografico');
      PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
    } catch (e) {
      logger.warn('[Public SGSST] Could not register PerfilSociodemograficoData:', e.message);
    }
  }
  if (!PerfilSociodemograficoData) return { company, perfil: null, worker: null };

  const formatStr = (s) => String(s || '').trim().toLowerCase();

  // 1. Buscar en la empresa resuelta directamente
  let perfil = await PerfilSociodemograficoData.findOne({
    user: new mongoose.Types.ObjectId(company.user),
    $or: [
      { companyId: company._id },
      { companyId: company._id.toString() },
      { companyId: { $exists: false } },
      { companyId: null },
    ],
  }).lean();

  let worker = null;
  if (perfil && Array.isArray(perfil.trabajadores) && perfil.trabajadores.length > 0) {
    if (workerId && workerId !== 'undefined') {
      worker = perfil.trabajadores.find((t) => String(t.id || t._id || t.identificacion) === String(workerId));
    }
    if (!worker && cedula) {
      worker = perfil.trabajadores.find(
        (t) => formatStr(t.identificacion) === formatStr(cedula),
      );
    }
  }

  // Si encontramos al trabajador, o no se proporcionó cédula/workerId para filtrar, devolver
  if (worker || (!cedula && (!workerId || workerId === 'undefined'))) {
    return { company, perfil, worker };
  }

  // 2. Fallback Multi-Empresa inteligente:
  // Si no se encontró el trabajador en esta empresa, buscar en todas las demás empresas del mismo usuario
  try {
    const allCompanies = await CompanyInfo.find({ user: company.user }).lean();
    for (const altCompany of allCompanies) {
      if (String(altCompany._id) === String(company._id)) continue;

      const altPerfil = await PerfilSociodemograficoData.findOne({
        user: new mongoose.Types.ObjectId(altCompany.user),
        $or: [
          { companyId: altCompany._id },
          { companyId: altCompany._id.toString() },
          { companyId: { $exists: false } },
          { companyId: null },
        ],
      }).lean();

      if (altPerfil && Array.isArray(altPerfil.trabajadores) && altPerfil.trabajadores.length > 0) {
        let altWorker = null;
        if (workerId && workerId !== 'undefined') {
          altWorker = altPerfil.trabajadores.find((t) => String(t.id || t._id || t.identificacion) === String(workerId));
        }
        if (!altWorker && cedula) {
          altWorker = altPerfil.trabajadores.find(
            (t) => formatStr(t.identificacion) === formatStr(cedula),
          );
        }

        if (altWorker) {
          return { company: altCompany, perfil: altPerfil, worker: altWorker };
        }
      }
    }
  } catch (err) {
    logger.warn('[Public SGSST] Multi-company worker search error:', err.message);
  }

  return { company, perfil, worker };
}

// ─── GET /api/public-sgsst/company/:companyId ─────────────────────────────
// Get public details of the company (Name, Logo, Cargos) to show in the portal
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Also fetch unique cargos from the workers list
    const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
    let cargos = [];
    if (PerfilSociodemograficoData) {
      const perfil = await PerfilSociodemograficoData.findOne({
        user: new mongoose.Types.ObjectId(company.user),
        $or: [
          { companyId: company._id },
          { companyId: company._id.toString() },
          { companyId: { $exists: false } },
          { companyId: null },
        ],
      }).lean();
      if (perfil?.trabajadores?.length) {
        const set = new Set();
        perfil.trabajadores.forEach((t) => {
          if (t.cargo && t.cargo.trim()) set.add(t.cargo.trim());
        });
        cargos = [...set].sort();
      }
    }

    return res.json({
      _id: company._id,
      user: company.user,
      companyName: company.companyName || 'Empresa Registrada',
      nit: company.nit || '',
      logo: company.logoBase64 || null,
      cargos,
    });
  } catch (error) {
    logger.error('[Public SGSST] Company fetch error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── POST /api/public-sgsst/validate-worker/:companyId ─────────────────────
// Validar tempranamente que el trabajador sí existe en el Perfil Sociodemográfico
router.post('/validate-worker/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { cedula, nombre } = req.body;

    if (!cedula || !nombre) {
      return res.status(400).json({ error: 'Nombre y Cédula son obligatorios' });
    }

    const { company, perfil, worker: workerFound } = await resolveCompanyAndWorker(companyId, { cedula });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    if (!perfil || !perfil.trabajadores || perfil.trabajadores.length === 0) {
      return res
        .status(404)
        .json({ error: 'La empresa no cuenta con un Perfil Sociodemográfico registrado' });
    }

    if (!workerFound) {
      return res.status(403).json({
        error: 'Cédula no encontrada en la base de datos de esta empresa. No tiene autorización.',
      });
    }

    const formatStr = (s) => String(s || '').trim().toLowerCase();
    const workerNameParts = formatStr(workerFound.nombre)
      .split(' ')
      .filter((p) => p.length > 2);
    const inputNameFormat = formatStr(nombre);

    const nameMatches = workerNameParts.some((part) => inputNameFormat.includes(part));
    if (!nameMatches && workerFound.nombre) {
      return res
        .status(403)
        .json({ error: 'El nombre ingresado no coincide con el registrado para esta cédula.' });
    }

    return res.json({
      success: true,
      message: 'Validación exitosa',
      companyId: company._id,
      companyName: company.companyName || 'Empresa',
    });
  } catch (error) {
    logger.error('[Public SGSST] Worker validation error:', error);
    res.status(500).json({ error: 'Error al procesar la validación' });
  }
});

// ─── POST /api/public-sgsst/reporte-acto/:companyId ───────────────────────
// Submit a new Incident/Act report from a worker
router.post('/reporte-acto/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { cedula, nombre, data, esTercero } = req.body;

    if (!cedula || !nombre) {
      return res.status(400).json({ error: 'Nombre y Cédula son obligatorios para el reporte' });
    }

    const { company, perfil, worker: workerFound } = await resolveCompanyAndWorker(companyId, { cedula });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const ReporteActosData = mongoose.models.ReporteActosData;
    if (!ReporteActosData) {
      return res.status(500).json({ error: 'Los modelos de datos no están listos' });
    }

    if (!esTercero) {
      if (!perfil || !perfil.trabajadores || perfil.trabajadores.length === 0) {
        return res.status(404).json({
          error: 'La empresa no cuenta con un Perfil Sociodemográfico registrado',
        });
      }

      if (!workerFound) {
        return res.status(403).json({
          error:
            'Cédula no encontrada en la base de datos de esta empresa. No tiene autorización para reportar.',
        });
      }

      const formatStr = (s) => String(s || '').trim().toLowerCase();
      const workerNameParts = formatStr(workerFound.nombre)
        .split(' ')
        .filter((p) => p.length > 2);
      const inputNameFormat = formatStr(nombre);

      const nameMatches = workerNameParts.some((part) => inputNameFormat.includes(part));
      if (!nameMatches && workerFound.nombre) {
        return res.status(403).json({
          error: 'El nombre ingresado no coincide en absoluto con el registrado para esta cédula.',
        });
      }
    }

    // 2. Crear el objeto para el Inbox
    const newInboxItem = {
      id: new mongoose.Types.ObjectId().toString(),
      trabajador: {
        nombre: esTercero ? nombre : workerFound.nombre,
        cedula: esTercero ? cedula : workerFound.identificacion,
        cargo: esTercero ? 'Tercero / Externo' : workerFound.cargo || 'No especificado',
      },
      data: data || {}, // contains descripcion, fecha, hora, fotos
      esTercero: !!esTercero,
      createdAt: new Date(),
    };

    // 3. Guardar en el Inbox Público de ReporteActosData
    await ReporteActosData.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(company.user), companyId: company._id },
      { $push: { inboxPublico: newInboxItem }, $set: { updatedAt: Date.now() } },
      { upsert: true, new: true },
    );

    // ─── Crear notificación de sistema ───
    try {
      await Notification.create({
        user: new mongoose.Types.ObjectId(company.user),
        type: 'sgsst_reporte_acto',
        title: 'Nuevo Reporte de Acto Inseguro',
        body: `${esTercero ? nombre : workerFound.nombre} (${esTercero ? 'Tercero' : 'Trabajador'} - ${company.companyName || 'Empresa'}) ha reportado un acto o condición insegura desde el portal público.`,
        metadata: { module: 'reporte_actos', reportId: newInboxItem.id, companyId: company._id },
      });
    } catch (notifErr) {
      logger.warn('[Public SGSST] Could not create notification:', notifErr.message);
    }

    // ─── Gamificación Pasaporte SST: +50 Puntos por reporte de acto o condición ───
    if (!esTercero && company.user && (workerFound?.identificacion || cedula)) {
      try {
        const feedWorkerEvent = require('./sgsst/feedWorkerHelper');
        await feedWorkerEvent(
          company.user,
          String(workerFound?.identificacion || cedula).trim(),
          'actos',
          'Reporte de acto o condición insegura con evidencia',
          50,
          newInboxItem.id,
          { esObservado: false }
        );
      } catch (feedErr) {
        logger.error('[Public SGSST] Error feeding worker event for reporte-acto:', feedErr);
      }
    }

    res.json({ success: true, message: 'Reporte radicado de forma exitosa y segura.' });
  } catch (error) {
    logger.error('[Public SGSST] Report submission error:', error);
    res.status(500).json({ error: 'Error al procesar el reporte' });
  }
});

// ─── GET /api/public-sgsst/debug-ipevar/:companyId (TEMPORAL) ───────────────────────
router.get('/debug-ipevar/:companyId', async (req, res) => {
  try {
    const ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData;
    const docs = await ParticipacionIpevarData.collection.find({}).toArray();
    return res.json({
      count: docs.length,
      docs: docs.map((d) => ({
        id: d._id,
        user: d.user,
        userType: typeof d.user,
        userConstructor: d.user?.constructor?.name,
        inboxCount: d.inboxPublico?.length || 0,
      })),
    });
  } catch (e) {
    return res.json({ error: e.message });
  }
});

// ─── POST /api/public-sgsst/participacion-ipevar/:companyId ───────────────────────
// Submit a new Participacion IPEVAR Trabajadores report from a worker
router.post('/participacion-ipevar/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { cedula, nombre, data } = req.body;

    if (!cedula || !nombre) {
      return res
        .status(400)
        .json({ error: 'Nombre y Cédula son obligatorios para la participación' });
    }

    const { company, perfil, worker: workerFound } = await resolveCompanyAndWorker(companyId, { cedula });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData;
    if (!ParticipacionIpevarData) {
      return res.status(500).json({ error: 'Los modelos de datos no están listos' });
    }

    // 1. Validar identidad cruzada con el Perfil Sociodemográfico
    if (!perfil || !perfil.trabajadores || perfil.trabajadores.length === 0) {
      return res.status(404).json({
        error: 'La empresa no cuenta con un Perfil Sociodemográfico registrado',
      });
    }

    if (!workerFound) {
      return res.status(403).json({
        error: 'Cédula no encontrada en la base de datos de esta empresa. No tiene autorización.',
      });
    }

    const formatStr = (s) => String(s || '').trim().toLowerCase();
    const workerNameParts = formatStr(workerFound.nombre)
      .split(' ')
      .filter((p) => p.length > 2);
    const inputNameFormat = formatStr(nombre);

    const nameMatches = workerNameParts.some((part) => inputNameFormat.includes(part));
    if (!nameMatches && workerFound.nombre) {
      return res.status(403).json({
        error: 'El nombre ingresado no coincide con el registrado para esta cédula.',
      });
    }

    // 2. Crear el objeto para el Inbox
    const newInboxItem = {
      id: new mongoose.Types.ObjectId().toString(),
      trabajador: {
        nombre: workerFound.nombre,
        cedula: workerFound.identificacion,
        cargo: workerFound.cargo || 'No especificado',
      },
      data: data || {}, // contains foto, tarea, peligros, controlesExistentes, etc
      createdAt: new Date(),
    };

    // 3. Guardar en el Inbox Público de ParticipacionIpevarData
    await ParticipacionIpevarData.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(company.user), companyId: company._id },
      { $push: { inboxPublico: newInboxItem }, $set: { updatedAt: Date.now() } },
      { upsert: true, new: true },
    );

    // ─── Crear notificación de sistema ───
    try {
      await Notification.create({
        user: new mongoose.Types.ObjectId(company.user),
        type: 'sgsst_participacion_ipevar',
        title: 'Nueva Participación IPEVR Recibida',
        body: `${workerFound.nombre} (${company.companyName || 'Empresa'}) ha enviado su identificación de peligros y participación IPEVR.`,
        metadata: { module: 'participacion_ipevar', reportId: newInboxItem.id, companyId: company._id },
      });
    } catch (notifErr) {
      logger.warn('[Public SGSST] Could not create notification:', notifErr.message);
    }

    // ─── Gamificación Pasaporte SST: +150 Puntos por reporte IPEVR ───
    if (company.user && (workerFound?.identificacion || cedula)) {
      try {
        const feedWorkerEvent = require('./sgsst/feedWorkerHelper');
        await feedWorkerEvent(
          company.user,
          String(workerFound?.identificacion || cedula).trim(),
          'participacion_ipevar',
          'Identificación y reporte de peligro IPEVR (GTC-45)',
          150,
          newInboxItem.id
        );
      } catch (feedErr) {
        logger.error('[Public SGSST] Error feeding worker event for IPEVAR:', feedErr);
      }
    }

    res.json({
      success: true,
      message: 'Su participación ha sido enviada exitosamente al equipo SGSST.',
    });
  } catch (error) {
    logger.error('[Public SGSST] Participacion IPEVAR submission error:', error);
    res.status(500).json({ error: 'Error al procesar la participación' });
  }
});

// ─── POST /api/public-sgsst/investigacion-atel/testimonio/:companyId ─────────
// Submit a new testimony from a witness for an ATEL investigation
router.post('/investigacion-atel/testimonio/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { cedula, nombre, data, investigacionId } = req.body;

    if (!cedula || !nombre) {
      return res.status(400).json({ error: 'Nombre y Cédula son obligatorios' });
    }

    const { company } = await resolveCompanyAndWorker(companyId, { cedula });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const InvestigacionAtelData = mongoose.models.InvestigacionAtelData;
    if (!InvestigacionAtelData) {
      return res.status(500).json({ error: 'Modelo InvestigacionAtelData no encontrado' });
    }

    // Create the testimony object for the inbox
    const newInboxItem = {
      id: new mongoose.Types.ObjectId().toString(),
      testigo: {
        nombre,
        cedula,
        cargo: data?.cargo || 'Testigo Externo / No especificado',
      },
      testimonio: data?.testimonio || '',
      media: {
        foto1: data?.foto1 || null,
        foto2: data?.foto2 || null,
        video: data?.video || null,
      },
      createdAt: new Date(),
      status: 'pending',
    };

    // ─── Validación estricta: solo se admite testimonio si existe citación activa ───
    // La citación se activa desde el aplicativo Investigación ATEL (testigo.solicitudActiva === true)
    const cleanCed = String(cedula).trim();
    const baseQuery = {
      companyId: company._id,
      testigosList: {
        $elemMatch: {
          $or: [{ cedula: cleanCed }, { identificacion: cleanCed }],
          solicitudActiva: true,
        },
      },
    };

    let targetDoc = null;
    if (investigacionId) {
      targetDoc = await InvestigacionAtelData.findOne({ ...baseQuery, id: investigacionId });
    }
    if (!targetDoc) {
      targetDoc = await InvestigacionAtelData.findOne(baseQuery).sort({ updatedAt: -1 });
    }

    const witnessIndex = targetDoc
      ? (targetDoc.testigosList || []).findIndex(t =>
          String(t.cedula || t.identificacion || '').trim() === cleanCed &&
          t.solicitudActiva === true &&
          t.estado !== 'recibido'
        )
      : -1;

    if (!targetDoc || witnessIndex === -1) {
      return res.status(403).json({
        error: 'No tienes una citación activa para rendir testimonio. El responsable de la investigación ATEL debe solicitarlo primero.',
      });
    }

    const updatedTestigosList = [...(targetDoc.testigosList || [])];
    updatedTestigosList[witnessIndex] = {
      ...updatedTestigosList[witnessIndex],
      testimonio: data?.testimonio || '',
      estado: 'recibido',
      solicitudActiva: false,
      fechaTestimonio: new Date().toISOString().split('T')[0],
      foto1: data?.foto1 || null,
      foto2: data?.foto2 || null
    };

    await InvestigacionAtelData.findByIdAndUpdate(
      targetDoc._id,
      { 
        $push: { inboxTestimonios: newInboxItem }, 
        $set: { 
          testigosList: updatedTestigosList,
          updatedAt: Date.now() 
        } 
      }
    );

    // Gamificación: +30 Puntos por testimonio aportado en investigación ATEL
    if (company.user && cedula) {
      try {
        const feedWorkerEvent = require('./sgsst/feedWorkerHelper');
        await feedWorkerEvent(
          company.user,
          cleanCed,
          'atel_testimonio',
          `Testimonio aportado en investigación de incidente/accidente ATEL`,
          30,
          String(targetDoc.id || newInboxItem.id || 'ATEL-TEST')
        );
      } catch (feedErr) {
        logger.error('[Public SGSST] Error feeding worker event for ATEL testimony:', feedErr);
      }
    }

    res.json({
      success: true,
      message: 'Su testimonio ha sido radicado exitosamente en el sistema de investigación.',
    });

    // ─── Crear notificación de sistema ───
    try {
      await Notification.create({
        user: new mongoose.Types.ObjectId(company.user),
        type: 'sgsst_testimonio_atel',
        title: 'Nuevo Testimonio de Testigo',
        body: `${nombre} (${company.companyName || 'Empresa'}) ha radicado su testimonio en la investigación ATEL desde el portal público.`,
        metadata: { module: 'investigacion_atel', reportId: newInboxItem.id, companyId: company._id },
      });
    } catch (notifErr) {
      logger.warn('[Public SGSST] Could not create ATEL testimony notification:', notifErr.message);
    }
  } catch (error) {
    logger.error('[Public SGSST] ATEL Testimony submission error:', error);
    res.status(500).json({ error: 'Error al procesar el testimonio' });
  }
});

// ─── GET /api/public-sgsst/atel/llamados-testigo/:companyId/:cedula ─────────
// Consultar si el trabajador tiene una citación o llamado activo como testigo en ATEL
router.get('/atel/llamados-testigo/:companyId/:cedula', async (req, res) => {
  try {
    const { companyId, cedula } = req.params;
    const { company } = await resolveCompanyAndWorker(companyId, { cedula });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const InvestigacionAtelData = mongoose.models.InvestigacionAtelData;
    if (!InvestigacionAtelData) {
      return res.json({ llamados: [] });
    }

    const cedulaClean = String(cedula).trim();
    const docs = await InvestigacionAtelData.find({
      companyId: company._id,
      $or: [
        { 'testigosList.cedula': cedulaClean },
        { 'testigosList.identificacion': cedulaClean }
      ]
    }).lean();

    const llamados = [];
    for (const doc of docs) {
      const matchWitness = (doc.testigosList || []).find(t => 
        String(t.cedula || t.identificacion || '').trim() === cedulaClean &&
        t.solicitudActiva === true &&
        t.estado !== 'recibido'
      );
      if (matchWitness) {
        llamados.push({
          investigacionId: doc.id || doc._id.toString(),
          tipoEvento: doc.formData?.tipoEvento || 'Incidente / Accidente',
          fechaEvento: doc.formData?.fechaEvento || 'Fecha reciente',
          fechaSolicitud: matchWitness.fechaSolicitud || null,
          afectado: doc.formData?.nombreAfectado || doc.formData?.personaAfectada || 'Compañero de trabajo',
          descripcion: doc.formData?.descripcionHechos || 'Citación oficial para rendir declaración testimonial.',
          testigo: {
            nombre: matchWitness.nombre,
            cargo: matchWitness.cargo,
            cedula: matchWitness.cedula
          }
        });
      }
    }

    res.json({ llamados });
  } catch (error) {
    logger.error('[Public SGSST] Error fetching ATEL witness calls:', error);
    res.status(500).json({ error: 'Error al consultar citaciones de testigo' });
  }
});

// ─── ALTA DIRECCIÓN: HELPERS & ROUTES ───────────────────────────────────────

const GERENCIA_KEYWORDS = [
  'gerente',
  'representante legal',
  'director',
  'presidente',
  'ceo',
  'vicepresidente',
  'subgerente',
  'directora',
  'gerencia',
  'junta directiva',
  'copropietario',
  'administrador',
  'socios',
];

function isGerenciaRole(cargo) {
  if (!cargo) return false;
  const lc = cargo.toLowerCase().trim();
  return GERENCIA_KEYWORDS.some((kw) => lc.includes(kw));
}

// POST /api/public-sgsst/validate-alta-direccion/:companyId
router.post('/validate-alta-direccion/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { cedula, nombre } = req.body;

    const { company, perfil, worker } = await resolveCompanyAndWorker(companyId, { cedula });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    if (!perfil || !perfil.trabajadores || perfil.trabajadores.length === 0)
      return res.status(404).json({
        error:
          'Empresa sin trabajadores registrados. Asegúrese de haber guardado el Perfil Sociodemográfico.',
      });

    if (!worker) return res.status(403).json({ error: 'Cédula no encontrada en el sistema.' });

    if (!isGerenciaRole(worker.cargo)) {
      return res.status(403).json({
        error: `Acceso denegado. Cargo: "${worker.cargo}". Solo personal de Gerencia/Dirección puede acceder a este portal.`,
      });
    }
    res.json({
      success: true,
      companyId: company._id,
      companyName: company.companyName || 'Empresa',
      trabajador: { nombre: worker.nombre, cargo: worker.cargo, cedula: worker.identificacion },
    });
  } catch (error) {
    logger.error('[Public AltaDireccion] Validation error:', error);
    res.status(500).json({ error: 'Error al validar' });
  }
});

// POST /api/public-sgsst/alta-direccion/:companyId
router.post('/alta-direccion/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { cedula, data } = req.body;

    const { company, perfil, worker } = await resolveCompanyAndWorker(companyId, { cedula });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const AltaDireccionData = mongoose.models.AltaDireccionData;
    if (!AltaDireccionData) {
      return res.status(500).json({
        error: 'Modelos no encontrados. Asegúrese de que el sistema esté completamente cargado.',
      });
    }

    if (!worker || !isGerenciaRole(worker.cargo))
      return res.status(403).json({ error: 'No autorizado.' });

    const newReport = {
      id: new mongoose.Types.ObjectId().toString(),
      trabajador: { nombre: worker.nombre, cargo: worker.cargo, cedula: worker.identificacion },
      data: data,
      status: 'pending',
      createdAt: new Date(),
    };

    await AltaDireccionData.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(company.user), companyId: company._id },
      { $push: { inboxPublico: newReport }, $set: { updatedAt: Date.now() } },
      { upsert: true, new: true },
    );

    // ─── Crear notificación de sistema ───
    try {
      await Notification.create({
        user: new mongoose.Types.ObjectId(company.user),
        type: 'sgsst_alta_direccion',
        title: 'Nueva Evaluación de Alta Dirección',
        body: `${worker.nombre} (${worker.cargo} - ${company.companyName || 'Empresa'}) ha enviado su revisión por la Alta Dirección desde el portal público.`,
        metadata: { module: 'alta_direccion', reportId: newReport.id, companyId: company._id },
      });
    } catch (notifErr) {
      logger.warn('[Public AltaDireccion] Could not create notification:', notifErr.message);
    }

    res.json({
      success: true,
      message: 'Evaluación enviada correctamente. El administrador SST recibirá una notificación.',
    });
  } catch (error) {
    logger.error('[Public AltaDireccion] Submission error:', error);
    res.status(500).json({ error: 'Error al enviar' });
  }
});

// ─── GET /api/public-sgsst/perfil-update/:companyId/:workerId ──────────────
// Fetch current worker profile data to pre-fill the self-update form
router.get('/perfil-update/:companyId/:workerId?', async (req, res) => {
  try {
    const { companyId, workerId } = req.params;
    const { cedula } = req.query;

    const { company, perfil, worker } = await resolveCompanyAndWorker(companyId, { cedula, workerId });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    if (!perfil || !perfil.trabajadores || perfil.trabajadores.length === 0) {
      return res
        .status(404)
        .json({ error: 'La empresa no cuenta con un Perfil Sociodemográfico registrado' });
    }

    if (!worker) {
      return res
        .status(404)
        .json({ error: 'Trabajador no encontrado o identificación incorrecta.' });
    }

    return res.json({
      _id: company._id,
      companyName: company.companyName || 'Empresa',
      logo: company.logoBase64 || null,
      arl: company.arl || '',
      worker: {
        id: worker.id || worker._id?.toString() || worker.identificacion,
        nombre: worker.nombre,
        cargo: worker.cargo,
        identificacion: worker.identificacion,
        eps: worker.eps || '',
        afp: worker.afp || '',
        estadoPila: worker.estadoPila || 'Pendiente de soporte PILA',
        arl: company.arl || worker.arl || '',
        edad: worker.edad || '',
        genero: worker.genero || '',
        estadoCivil: worker.estadoCivil || '',
        nivelEscolaridad: worker.nivelEscolaridad || '',
        direccion: worker.direccion || '',
        telefono: worker.telefono || '',
        emergenciaContacto: worker.emergenciaContacto || '',
        tipoSangre: worker.tipoSangre || '',
        rh: worker.rh || '',
        enfermedades: worker.enfermedades || '',
        medicamentos: worker.medicamentos || '',
        fuma: worker.fuma || '',
        alcohol: worker.alcohol || '',
        terapiaPsicologica: worker.terapiaPsicologica || '',
        personasCargo: worker.personasCargo ?? '',
        estrato: worker.estrato || '',
        vivienda: worker.vivienda || '',
        soatVencimiento: worker.soatVencimiento || '',
        tecnicomecanicaVencimiento: worker.tecnicomecanicaVencimiento || '',
        licenciaSST: worker.licenciaSST || '',
        licenciaVencimiento: worker.licenciaVencimiento || '',
        curso50h: worker.curso50h || '',
        curso20h: worker.curso20h || '',
        fechaNacimiento: worker.fechaNacimiento || '',
        lugarNacimiento: worker.lugarNacimiento || '',
        barrio: worker.barrio || '',
        municipioDomicilio: worker.municipioDomicilio || '',
        correoElectronico: worker.correoElectronico || '',
        licenciaConduccion: worker.licenciaConduccion || '',
        licenciaConduccionVencimiento: worker.licenciaConduccionVencimiento || '',
        esCopasst: worker.esCopasst || 'No',
        esComiteConvivencia: worker.esComiteConvivencia || 'No',
        esBrigadista: worker.esBrigadista || 'No',
        esComiteSeguridadVial: worker.esComiteSeguridadVial || 'No',
        deporte: worker.deporte || '',
        alimentacion: worker.alimentacion || '',
        peso: worker.peso || '',
        talla: worker.talla || '',
        imc: worker.imc || '',
        presionArterial: worker.presionArterial || '',
        frecuenciaCardiaca: worker.frecuenciaCardiaca || '',
        diagnosticoMedico: worker.diagnosticoMedico || '',
        limitacionesBiomecanicas: worker.limitacionesBiomecanicas || '',
        alergiasQuimicas: worker.alergiasQuimicas || '',
        riesgoCardiovascular: worker.riesgoCardiovascular || '',
        fechaExamenMedico: worker.fechaExamenMedico || '',
        recomendacionesMedicas: worker.recomendacionesMedicas || '',
        fechaSeguimiento: worker.fechaSeguimiento || '',
        fechaCursoAlturasAutorizado: worker.fechaCursoAlturasAutorizado || '',
        fechaCursoAlturasCoordinador: worker.fechaCursoAlturasCoordinador || '',
      },
    });
  } catch (err) {
    logger.error('[Public Perfil Update GET]', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── POST /api/public-sgsst/perfil-update/:companyId/:workerId ─────────────
// Worker self-submits profile data update; stored in pending inbox for admin approval
router.post('/perfil-update/:companyId/:workerId?', async (req, res) => {
  try {
    const { companyId, workerId: paramWorkerId } = req.params;
    const { updates, cedula } = req.body;

    const { company, perfil, worker } = await resolveCompanyAndWorker(companyId, { cedula, workerId: paramWorkerId });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    if (!perfil) {
      return res
        .status(404)
        .json({ error: 'Perfil sociodemográfico no encontrado para esta empresa' });
    }

    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

    const workerId = worker.id || worker._id?.toString() || worker.identificacion;

    // Separate fields into Social and Health categories
    const socialKeys = [
      'edad',
      'genero',
      'estadoCivil',
      'nivelEscolaridad',
      'direccion',
      'telefono',
      'emergenciaContacto',
      'personasCargo',
      'estrato',
      'vivienda',
      'soatVencimiento',
      'tecnicomecanicaVencimiento',
      'licenciaSST',
      'licenciaVencimiento',
      'curso50h',
      'curso20h',
      'licenciaConduccion',
      'licenciaConduccionVencimiento',
      'licenciasConduccion',
      'esCopasst',
      'esComiteConvivencia',
      'esBrigadista',
      'esComiteSeguridadVial',
      'fechaNacimiento',
      'lugarNacimiento',
      'barrio',
      'municipioDomicilio',
      'correoElectronico',
      'fechaCursoAlturasAutorizado',
      'fechaCursoAlturasCoordinador',
      'eps',
      'afp',
      'estadoPila',
    ];
    const healthKeys = [
      'tipoSangre',
      'rh',
      'enfermedades',
      'medicamentos',
      'fuma',
      'alcohol',
      'terapiaPsicologica',
      'deporte',
      'alimentacion',
      'peso',
      'talla',
      'imc',
      'presionArterial',
      'frecuenciaCardiaca',
      'diagnosticoMedico',
      'limitacionesBiomecanicas',
      'alergiasQuimicas',
      'riesgoCardiovascular',
      'fechaExamenMedico',
      'recomendacionesMedicas',
      'fechaSeguimiento',
    ];

    const socialUpdates = {};
    const healthUpdates = {};

    for (const [key, value] of Object.entries(updates || {})) {
      if (socialKeys.includes(key)) socialUpdates[key] = value;
      if (healthKeys.includes(key)) healthUpdates[key] = value;
    }

    // Atomic push to pending inboxes via updateOne to prevent heavy validation and hanging
    const pushOps = {};

    if (Object.keys(socialUpdates).length > 0) {
      pushOps.actualizacionesPendientes = {
        id: new mongoose.Types.ObjectId().toString(),
        workerId,
        workerName: worker.nombre || 'Trabajador',
        workerCargo: worker.cargo || '',
        changes: socialUpdates,
        status: 'pending',
        createdAt: new Date(),
      };
    }

    if (Object.keys(healthUpdates).length > 0) {
      pushOps.actualizacionesPendientesSalud = {
        id: new mongoose.Types.ObjectId().toString(),
        workerId,
        workerName: worker.nombre || 'Trabajador',
        workerCargo: worker.cargo || '',
        changes: healthUpdates,
        status: 'pending',
        createdAt: new Date(),
      };
    }

    const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
    if (Object.keys(pushOps).length > 0) {
      await PerfilSociodemograficoData.updateOne(
        { _id: perfil._id },
        {
          $push: pushOps,
          $set: { updatedAt: new Date() },
        }
      );
    }

    // Notify admin asynchronously so it never hangs or delays the HTTP response
    setImmediate(async () => {
      try {
        await Notification.create({
          user: new mongoose.Types.ObjectId(company.user),
          type: 'sgsst_perfil_update',
          title: 'Actualización de Perfil y Salud Recibida',
          body: `${worker.nombre || 'Un trabajador'} ha solicitado actualizar sus datos de perfil sociodemográfico y condiciones de salud.`,
          metadata: { module: 'perfil_socio', workerId },
        });
      } catch (notifErr) {
        logger.warn('[Public Perfil Update] Could not create notification:', notifErr.message);
      }
    });

    res.json({ success: true });
  } catch (err) {
    logger.error('[Public Perfil Update POST]', err);
    res.status(500).json({ error: 'Error al enviar actualización' });
  }
});

// ─── TERMÓMETRO PSICOSOCIAL (MOOD TELEMETRY) ──────────────────────────────────

// POST /api/public-sgsst/mood/:companyId
// Registra de forma anónima la respuesta inicial del estado de ánimo del trabajador
router.post('/mood/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { mood, department, deviceId, isDemo, isAdmin } = req.body;

    if (!mood || !['happy', 'neutral', 'sad'].includes(mood)) {
      return res.status(400).json({ error: 'Estado de ánimo inválido o ausente.' });
    }

    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    const MoodTelemetry = require('~/models/MoodTelemetry');

    // Validación de 1 reporte por ciclo periódico (7 días) por dispositivo / equipo (excepto modo demostración o administradores)
    const isBypassAllowed = Boolean(
      isDemo ||
      isAdmin ||
      req.query.demo === '1' ||
      req.query.admin === '1' ||
      req.query.demo === 'true'
    );

    if (!isBypassAllowed && deviceId && typeof deviceId === 'string' && deviceId.trim()) {
      const cleanDeviceId = deviceId.trim();
      const cycleDays = 7; // Periodicidad de pulso recomendada en SST (7 días)
      const cycleAgo = new Date(Date.now() - cycleDays * 24 * 60 * 60 * 1000);

      const existingRecord = await MoodTelemetry.findOne({
        companyId: company._id,
        deviceId: cleanDeviceId,
        createdAt: { $gte: cycleAgo },
      });

      if (existingRecord) {
        return res.status(429).json({
          error: 'Ya has registrado tu reporte en este ciclo periódico de 7 días desde este equipo.',
          alreadyReportedToday: true,
          alreadyReportedPeriod: true,
          cycleDays: 7,
        });
      }
    }

    let initialDetails = '';
    if (mood === 'happy') {
      initialDetails = 'El colaborador reportó sentirse feliz y motivado en su jornada laboral.';
    } else if (mood === 'neutral') {
      initialDetails = 'Reporte de jornada normal / estable registrado por el colaborador.';
    } else if (mood === 'sad') {
      initialDetails = 'Reporte de sobrecarga o estrés laboral registrado por el colaborador.';
    }

    const telemetry = new MoodTelemetry({
      companyId: company._id,
      mood,
      department: department || '',
      deviceId: deviceId ? String(deviceId).trim() : '',
      isDemo: isBypassAllowed,
      details: initialDetails,
    });

    await telemetry.save();
    return res.json({ success: true, telemetryId: telemetry._id, isDemo: isBypassAllowed });
  } catch (error) {
    logger.error('[Public SGSST] Mood telemetry error:', error);
    res.status(500).json({ error: 'Error al registrar estado de ánimo.' });
  }
});

/**
 * Genera dinámicamente con IA un Caso de Seguimiento SG-SST 100% confidencial y adaptado.
 * No utiliza plantillas estáticas; la IA analiza el contexto, puesto/área, estresores y conversación.
 */
async function generateAICaseFollowUp({
  stressors = [],
  department = '',
  messages = [],
  companyUser = null,
  mood = 'sad',
  companyName = '',
}) {
  const stressorNames = {
    sobrecarga: 'Sobrecarga de trabajo y ritmo laboral acelerado',
    liderazgo: 'Clima laboral, comunicación o relaciones con líderes',
    entorno: 'Condiciones del entorno físico o herramientas operativas',
    personal: 'Situaciones personales o familiares que impactan la jornada',
    funciones: 'Falta de claridad en funciones, alcance de rol y prioridades',
    fatiga: 'Fatiga física acumulada o agotamiento mental (burnout)',
  };

  const stressorLabels = (stressors || []).map((s) => stressorNames[s] || s);
  const factorsSummary = stressorLabels.length > 0 ? stressorLabels.join(', ') : 'Riesgo psicosocial general reportado';
  const deptContext = department && department.trim() ? `en el área de ${department.trim()}` : '';
  const companyContext = companyName ? `de la empresa ${companyName}` : '';

  const hasChat = Array.isArray(messages) && messages.length > 1;
  const chatExcerpt = hasChat
    ? messages
        .filter((m) => m && m.text && m.text.trim())
        .map((m) => `${m.sender === 'user' ? 'Trabajador' : 'Terapeuta'}: ${m.text}`)
        .join('\n')
        .slice(0, 3500)
    : '';

  const prompt = `Eres el Especialista Senior de Inteligencia Artificial en Factores de Riesgo Psicosocial y SG-SST (Seguridad y Salud en el Trabajo) de WAPPY IA.
Tu misión es generar una ficha técnica ejecutiva de "Caso de Seguimiento SG-SST" 100% DINÁMICA, PROFESIONAL, PERSONALIZADA y NO ESTANDARIZADA.

DATOS DEL CASO:
- Entorno: ${deptContext || 'Área general'} ${companyContext}
- Factores de estrés reportados por el colaborador: ${factorsSummary}
- Estado anímico manifestado: ${mood === 'sad' ? 'Estresado / Con sobrecarga' : mood === 'neutral' ? 'Jornada media / Inquietudes' : 'Reporte de bienestar'}
${hasChat ? `- Transcripción confidencial de la sesión de orientación emocional:\n${chatExcerpt}` : '- Registro directo en termómetro psicosocial (sin sesión de chat interactiva).'}

INSTRUCCIONES CLAVE DE CONFIDENCIALIDAD Y CALIDAD TÉCNICA:
1. PRIVACIDAD ABSOLUTA: PROHIBIDO usar comillas o transcribir expresiones literales del colaborador, así como datos de su vida íntima, familiar o diagnósticos médicos.
2. ENFOQUE ORGANIZACIONAL: Identifica los factores laborales de fondo que causan el malestar (procesos, comunicación, volumen de tareas, turnos, herramientas, supervisión).
3. RECOMENDACIÓN DE INTERVENCIÓN EXCLUSIVA Y CONCRETA: Formula de 1 a 2 recomendaciones preventivas directas y específicas para la empresa o supervisores. NO uses frases genéricas de cajón ni plantillas predefinidas; redacta soluciones técnicas a la medida de lo expresado en este caso puntual.

RESPONDE ÚNICAMENTE CON ESTE FORMATO (texto plano, 3 viñetas, sin markdown complejo):
📋 Caso de Seguimiento SG-SST (Confidencial):
• Factores de Riesgo Laboral: [Factores laborales y organizacionales específicos detectados en este caso]
• Recomendación de Intervención: [Medidas preventivas técnicas y organizacionales accionables para la empresa o área]
• Orientación Brindada: [Síntesis de la contención emocional o recepción del autoreporte en el sistema]`;

  try {
    const { generateWithKeyRotation } = require('./sgsst/sgsstGemini');
    const aiResult = await Promise.race([
      generateWithKeyRotation(
        { model: 'gemini-3.5-flash-lite', generationConfig: { temperature: 0.7 } },
        companyUser,
        prompt
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout AI case generation')), 9000)),
    ]);

    const responseText = aiResult?.response?.text ? aiResult.response.text().trim() : '';
    if (responseText && responseText.includes('Caso de Seguimiento')) {
      return responseText.replace(/• Recomendación de Intervención SST:/g, '• Recomendación de Intervención:');
    }
  } catch (err) {
    logger.warn('[Public SGSST] AI case generation warning:', err?.message);
  }

  // Failsafe dinámico y contextual si falla el llamado de red con la IA
  const dynamicRecs = [];
  if (stressors.includes('sobrecarga')) dynamicRecs.push(`Efectuar un balanceo de cargas laborales y revisar la curva de entregables ${deptContext}`);
  if (stressors.includes('liderazgo')) dynamicRecs.push(`Facilitar dinámicas de retroalimentación constructiva y liderazgo participativo con las jefaturas`);
  if (stressors.includes('entorno')) dynamicRecs.push(`Auditar los puestos de trabajo ${deptContext} para corregir factores ergonómicos o déficit de herramientas`);
  if (stressors.includes('personal')) dynamicRecs.push(`Articular con el comité de convivencia y bienestar opciones de flexibilidad horaria o apoyo psicosocial`);
  if (stressors.includes('funciones')) dynamicRecs.push(`Revisar la matriz de roles y responsabilidades para evitar duplicidad de tareas o ambigüedad`);
  if (stressors.includes('fatiga')) dynamicRecs.push(`Establecer alertas de sobretiempo y jornadas de pausas psicofisiológicas dirigidas`);
  if (dynamicRecs.length === 0) dynamicRecs.push(`Implementar observación preventiva de factores psicosociales y verificar cumplimiento de pausas activas ${deptContext}`);

  return (
    `📋 Caso de Seguimiento SG-SST (Confidencial):\n` +
    `• Factores de Riesgo Laboral: ${factorsSummary}.\n` +
    `• Recomendación de Intervención: ${dynamicRecs.slice(0, 2).join('. ') + '.'}\n` +
    `• Orientación Brindada: ${hasChat ? 'El colaborador completó una sesión privada de primeros auxilios psicológicos y autocuidado laboral con el Terapeuta en Salud Mental.' : 'El colaborador registró su reporte psicosocial en el termómetro preventivo de la empresa.'}`
  );
}

function sanitizeDetailsToSSTCase(details, stressors = [], department = '') {
  if (!details) return '';
  const isRawChat =
    details.includes('Conversación con el Terapeuta') ||
    details.includes('Conversación anónima completada') ||
    details.includes('Trabajador:') ||
    details.includes('Terapeuta:');
  if (!isRawChat) {
    return details.replace(/• Recomendación de Intervención SST:/g, '• Recomendación de Intervención:');
  }

  const stressorNames = {
    sobrecarga: 'Sobrecarga de trabajo',
    liderazgo: 'Clima laboral / Relaciones interpersonales',
    entorno: 'Entorno físico / Herramientas inadecuadas',
    personal: 'Asuntos personales o familiares',
    funciones: 'Falta de claridad en funciones y rol',
    fatiga: 'Fatiga física o agotamiento mental',
  };

  const labels = (stressors || []).map((s) => stressorNames[s] || s);
  const factorsText = labels.length > 0 ? labels.join(', ') : 'Sobrecarga y ritmo laboral';
  const areaText = department ? ` en el área de ${department}` : '';

  return (
    `📋 Caso de Seguimiento SG-SST (Confidencial):\n` +
    `• Factores de Riesgo Laboral: ${factorsText}.\n` +
    `• Recomendación de Intervención: Monitorear factores de riesgo reportados y balancear demandas laborales${areaText}.\n` +
    `• Orientación Brindada: El colaborador completó una sesión privada de orientación emocional con el Terapeuta en Salud Mental.`
  );
}

// POST /api/public-sgsst/mood/update/:telemetryId
// Actualiza la telemetría agregando estresores o notas, generando casos con IA cuando corresponda
router.post('/mood/update/:telemetryId', async (req, res) => {
  try {
    const { telemetryId } = req.params;
    const { stressors, details, sessionStarted, generateAICase, department } = req.body;

    if (!mongoose.Types.ObjectId.isValid(telemetryId)) {
      return res.status(400).json({ error: 'ID de telemetría inválido.' });
    }

    const MoodTelemetry = require('~/models/MoodTelemetry');
    const existing = await MoodTelemetry.findById(telemetryId);
    if (!existing) {
      return res.status(404).json({ error: 'Telemetría no encontrada.' });
    }

    const currentStressors = Array.isArray(stressors) ? stressors : existing.stressors || [];
    const dept = department || existing.department || '';

    if (Array.isArray(stressors)) {
      existing.stressors = stressors;
    }
    if (dept) {
      existing.department = dept;
    }

    if (sessionStarted || generateAICase) {
      let userId = null;
      let compName = '';
      try {
        const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
        const comp = await CompanyInfo.findById(existing.companyId).lean();
        if (comp) {
          userId = comp.user || null;
          compName = comp.companyName || '';
        }
      } catch (e) {}

      existing.details = await generateAICaseFollowUp({
        stressors: currentStressors,
        department: dept,
        companyUser: userId,
        mood: existing.mood,
        companyName: compName,
      });
    } else if (details !== undefined && details !== null) {
      existing.details = sanitizeDetailsToSSTCase(details, currentStressors, dept);
    }

    await existing.save();
    return res.json({ success: true, caseNote: existing.details });
  } catch (error) {
    logger.error('[Public SGSST] Mood update error:', error);
    res.status(500).json({ error: 'Error al actualizar telemetría.' });
  }
});

// POST /api/public-sgsst/mood/finish/:telemetryId
// Finaliza la sesión del chat y sintetiza un caso de seguimiento SG-SST 100% confidencial
router.post('/mood/finish/:telemetryId', async (req, res) => {
  try {
    const { telemetryId } = req.params;
    const { stressors, department, messages } = req.body;

    if (!mongoose.Types.ObjectId.isValid(telemetryId)) {
      return res.status(400).json({ error: 'ID de telemetría inválido.' });
    }

    const MoodTelemetry = require('~/models/MoodTelemetry');
    const existing = await MoodTelemetry.findById(telemetryId);
    if (!existing) {
      return res.status(404).json({ error: 'Telemetría no encontrada.' });
    }

    const currentStressors = Array.isArray(stressors) ? stressors : existing.stressors || [];
    const dept = department || existing.department || '';

    let userId = null;
    let compName = '';
    try {
      const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
      const company = await CompanyInfo.findById(existing.companyId).lean();
      if (company) {
        userId = company.user || null;
        compName = company.companyName || '';
      }
    } catch (e) {}

    // Síntesis 100% por IA analizando la conversación real
    const caseNote = await generateAICaseFollowUp({
      stressors: currentStressors,
      department: dept,
      messages: Array.isArray(messages) ? messages : [],
      companyUser: userId,
      mood: existing.mood,
      companyName: compName,
    });

    existing.details = caseNote;
    if (Array.isArray(stressors)) {
      existing.stressors = stressors;
    }
    if (dept) {
      existing.department = dept;
    }
    await existing.save();

    return res.json({ success: true, caseNote });
  } catch (error) {
    logger.error('[Public SGSST] Mood finish error:', error);
    res.status(500).json({ error: 'Error al finalizar sesión.' });
  }
});

// POST /api/public-sgsst/mood/claim-points/:companyId
// Permite al colaborador registrar voluntariamente su cédula tras completar el check-in diario para ganar +10 puntos
router.post('/mood/claim-points/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { cedula } = req.body;

    if (!cedula || !String(cedula).trim()) {
      return res.status(400).json({ error: 'La cédula es requerida para acreditar puntos.' });
    }

    const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
    const company = await CompanyInfo.findById(companyId).lean();
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    try {
      const feedWorkerEvent = require('./sgsst/feedWorkerHelper');
      await feedWorkerEvent(
        company.user,
        String(cedula).trim(),
        'termometro_animo',
        'Check-in voluntario en Termómetro Psicosocial y Bienestar Emocional (Pulso 7 días)',
        10,
        `MOOD-${Date.now()}`
      );
    } catch (feedErr) {
      logger.error('[Public SGSST] Error claiming mood points:', feedErr);
    }

    return res.json({ success: true, message: '¡10 puntos acreditados con éxito a tu Pasaporte SST!', puntos: 10 });
  } catch (error) {
    logger.error('[Public SGSST] Mood claim points error:', error);
    return res.status(500).json({ error: 'Error al acreditar puntos.' });
  }
});

// POST /api/public-sgsst/mood/chat/:companyId
// Genera un token JWT temporal y anónimo para hablar con el Terapeuta / Psicólogo
router.post('/mood/chat/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    let Agent = mongoose.models.Agent;
    if (!Agent) {
      try {
        Agent = require('~/db/models').Agent;
      } catch (e) {}
    }
    if (!Agent) {
      const AgentSchema = new mongoose.Schema(
        {
          id: String,
          name: String,
          category: String,
          model: String,
        },
        { strict: false, collection: 'agents' },
      );
      Agent = mongoose.models.AgentPublicLookup || mongoose.model('AgentPublicLookup', AgentSchema);
    }

    // 1. Prioridad absoluta: Buscar exactamente 'Terapeuta en Salud Mental'
    let agent = await Agent.findOne({ name: 'Terapeuta en Salud Mental' }).lean();

    // 2. Si no coincide exacto, buscar por nombres clave de Salud Mental o Psicología ocupacional
    if (!agent) {
      agent = await Agent.findOne({
        $or: [
          { name: /Terapeuta.*Salud.*Mental/i },
          { name: /Salud Mental/i },
          { name: /Psic[oó]logo SST/i },
          { name: /Psic[oó]logo/i },
          { name: /Psicosocial/i },
        ],
      }).lean();
    }

    // 3. Fallback: Buscar "Terapeuta" pero EXCLUYENDO explícitamente "Fisioterapeuta"
    if (!agent) {
      agent = await Agent.findOne({
        $and: [
          { name: /terapeuta/i },
          { name: { $not: /fisioterapeuta/i } },
        ],
      }).lean();
    }

    // 4. Fallback por categoría 'ergonomia_salud_bienestar', EXCLUYENDO también "Fisioterapeuta"
    if (!agent) {
      agent = await Agent.findOne({
        category: 'ergonomia_salud_bienestar',
        name: { $not: /fisioterapeuta/i },
      }).lean();
    }

    // 5. Fallback a agentes generales de SST (si no hay ninguno de salud mental disponible)
    if (!agent) {
      agent = await Agent.findOne({
        $or: [
          { name: /Profesional SST/i },
          { name: /Consultor SG-SST/i },
          { name: /SST/i },
        ],
      }).lean();
    }

    // 6. Fallback a cualquier agente registrado en el sistema
    if (!agent) {
      agent = await Agent.findOne({}).lean();
    }

    if (!agent) {
      return res
        .status(404)
        .json({ error: 'No se encontró ningún agente disponible para la sesión de orientación.' });
    }

    // Resolver ID de agente compatible con LibreChat
    let resolvedAgentId = agent.id;
    if (!resolvedAgentId && agent._id) {
      resolvedAgentId = agent._id.toString();
      try {
        await Agent.updateOne({ _id: agent._id }, { $set: { id: resolvedAgentId } });
      } catch (e) {}
    }

    // Resolver usuario válido para firmar JWT
    let userId = company.user ? company.user.toString() : null;
    let User = mongoose.models.User;
    if (!User) {
      try {
        User = require('~/db/models').User;
      } catch (e) {}
    }
    if (User) {
      let validUser = null;
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        validUser = await User.findById(userId).lean();
      }
      if (!validUser) {
        validUser =
          (await User.findOne({ role: 'ADMIN' }).lean()) ||
          (await User.findOne({}).lean());
        if (validUser) {
          userId = validUser._id.toString();
        }
      }
    }
    if (!userId) {
      userId = company._id.toString();
    }

    // Firmar un token temporal con los privilegios del administrador de la empresa (restringido a 1 hora)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const crypto = require('crypto');
    const conversationId = crypto.randomUUID();

    // Pre-crear la conversación con tags internos para que NUNCA aparezca en la bandeja ni historial del usuario
    try {
      const Conversation = mongoose.models.Conversation || require('~/db/models').Conversation;
      if (Conversation) {
        await Conversation.create({
          conversationId,
          user: userId,
          endpoint: 'agents',
          agent_id: resolvedAgentId,
          model: 'gemini-3.5-flash-lite',
          title: 'Sesión Anónima Termómetro Psicosocial',
          tags: ['sgsst-mood', 'sgsst-psicosocial', 'sgsst-termometro', `company-${company._id}`],
        });
      }
    } catch (convoErr) {
      logger.warn('[Public SGSST] No se pudo pre-crear conversación aislada:', convoErr?.message);
    }

    return res.json({
      success: true,
      token,
      agentId: resolvedAgentId,
      agentName: agent.name || 'Terapeuta en Salud Mental',
      agentModel: 'gemini-3.5-flash-lite',
      conversationId,
    });
  } catch (error) {
    logger.error('[Public SGSST] Mood chat generation error:', error);
    res.status(500).json({ error: 'Error al generar sesión de chat con el terapeuta.' });
  }
});

// ─── GET /api/public-sgsst/estudio-puesto/:companyId ───────────────────────────
// Valida la empresa y lista los cargos/trabajadores para autocompletado en el QR
router.get('/estudio-puesto/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada o enlace inactivo.' });
    }

    const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
    let workers = [];
    if (PerfilSociodemograficoData) {
      const perfilDoc = await PerfilSociodemograficoData.findOne({ companyId: company._id }).lean();
      if (perfilDoc && Array.isArray(perfilDoc.trabajadores)) {
        workers = perfilDoc.trabajadores.map((w) => ({
          nombre: w.nombre || '',
          identificacion: w.identificacion || '',
          cargo: w.cargo || '',
        }));
      }
    }

    return res.json({
      success: true,
      company: {
        id: company._id,
        name: company.companyName,
        logo: company.logoBase64 || null,
        city: company.city || '',
      },
      companyConfig: company.eptConfig || {
        requireAppointment: true,
        slotDurationMinutes: 30,
        maxConcurrentWorkerSessions: 1,
      },
      workers,
    });
  } catch (error) {
    logger.error('[Public SGSST] GET /estudio-puesto error:', error);
    return res.status(500).json({ error: 'Error al consultar datos de auto-evaluación.' });
  }
});

// ─── GET /api/public-sgsst/estudio-puesto/appointment-status/:companyId/:workerId ───
// Consulta el estado de la cita 1 a 1 y la disponibilidad de la sala para el trabajador
router.get('/estudio-puesto/appointment-status/:companyId/:workerId', async (req, res) => {
  try {
    const { companyId, workerId } = req.params;
    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    const cleanWorkerId = String(workerId || '').trim();
    const eptConfig = company.eptConfig || {
      requireAppointment: true,
      slotDurationMinutes: 30,
      maxConcurrentWorkerSessions: 1,
    };
    const requireAppointment = eptConfig.requireAppointment !== false;

    // 1. Revisar si hay una sesión concurrente activa de otro trabajador en esta empresa
    const activeSession = getActiveWorkerSession(company._id);
    const isBusy = !!activeSession && activeSession.workerId !== cleanWorkerId;

    // 2. Buscar cita programada del trabajador
    const EstudioPuestoTrabajo = mongoose.models.EstudioPuestoTrabajo || require('~/models/EstudioPuestoTrabajo');
    const apt = await EstudioPuestoTrabajo.findOne({
      companyId: company._id,
      workerId: cleanWorkerId,
      status: { $in: ['programado', 'en_curso'] },
    })
      .sort({ scheduledAt: 1 })
      .lean();

    let canStart = false;
    let status = 'ready';
    let message = '';

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (!requireAppointment) {
      canStart = !isBusy;
      status = isBusy ? 'busy_session' : 'ready';
      message = isBusy
        ? 'El Fisioterapeuta Laboral IA se encuentra en una consulta 1 a 1 con otro colaborador en este instante. Por favor espera a que concluya para iniciar tu turno.'
        : '¡Acceso habilitado para tu auto-evaluación ergonómica en vivo!';
    } else {
      if (!apt) {
        canStart = false;
        status = 'no_appointment';
        message = 'Este módulo requiere cita previa programada para garantizar una evaluación 1 a 1 con el Fisioterapeuta IA y evitar saturación de recursos. Comunícate con el área de SST de tu empresa para agendar tu fecha y hora.';
      } else {
        const scheduledDate = apt.scheduledAt ? new Date(apt.scheduledAt) : null;
        if (!scheduledDate) {
          canStart = !isBusy;
          status = isBusy ? 'busy_session' : 'turn_ready';
          message = isBusy
            ? 'El Fisioterapeuta Laboral IA está en consulta 1 a 1 con otro colaborador. Por favor espera unos minutos.'
            : '¡Tu turno está habilitado!';
        } else if (scheduledDate > endOfToday) {
          canStart = false;
          status = 'future_appointment';
          const dateStr = scheduledDate.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          const timeStr = scheduledDate.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          message = `Tienes tu cita ergonómica programada para el ${dateStr} a las ${timeStr}. Tu acceso se habilitará el día de tu turno. ¡Gracias por tu compromiso con la salud laboral!`;
        } else {
          canStart = !isBusy;
          status = isBusy ? 'busy_session' : 'turn_ready';
          const timeStr = scheduledDate.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          message = isBusy
            ? 'El Fisioterapeuta Laboral IA está en consulta 1 a 1 con otro compañero. Tu turno programado para hoy iniciará en cuanto termine.'
            : `¡Tu turno está activo! Cita programada para hoy a las ${timeStr}. Puedes iniciar tu auto-evaluación en vivo.`;
        }
      }
    }

    return res.json({
      success: true,
      canStart,
      isBusy,
      status,
      requireAppointment,
      hasAppointment: !!apt,
      appointment: apt,
      companyConfig: eptConfig,
      message,
    });
  } catch (err) {
    logger.error('[Public SGSST] GET /appointment-status error:', err);
    return res.status(500).json({ error: 'Error al consultar estado de cita.' });
  }
});

// ─── POST /api/public-sgsst/estudio-puesto/release-session/:companyId ──────────
// Libera la sala 1 a 1 de la empresa cuando un trabajador cierra la sesión o cancela
router.post('/estudio-puesto/release-session/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { workerId } = req.body || {};
    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }
    const current = getActiveWorkerSession(company._id);
    if (!workerId || (current && current.workerId === String(workerId).trim())) {
      releaseWorkerSession(company._id);
    }
    return res.json({ success: true, message: 'Sala 1 a 1 liberada correctamente.' });
  } catch (err) {
    logger.error('[Public SGSST] POST /release-session error:', err);
    return res.status(500).json({ error: 'Error al liberar sesión.' });
  }
});


// ─── POST /api/public-sgsst/estudio-puesto/session/:companyId ──────────────────
// Inicia y prepara una sesión Live de análisis biomecánico con el Fisioterapeuta Laboral
router.post('/estudio-puesto/session/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { workerName, workerId, cargo, actividad } = req.body || {};

    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada o enlace inactivo.' });
    }

    const cleanWorkerId = String(workerId || '').trim();
    const cleanWorkerName = String(workerName || '').trim();

    // ── 1. Control de Concurrencia 1 a 1 para Trabajadores (Protección de API Keys) ──
    const activeSession = getActiveWorkerSession(company._id);
    if (activeSession && activeSession.workerId !== cleanWorkerId) {
      return res.status(429).json({
        success: false,
        isBusy: true,
        message:
          'El Fisioterapeuta Laboral IA se encuentra en una consulta 1 a 1 con otro colaborador en este instante. Por favor espera a que concluya su turno para iniciar el tuyo y evitar saturación de las claves API.',
      });
    }

    // ── 2. Validación de Cita Previa Obligatoria si la empresa lo exige ──
    const eptConfig = company.eptConfig || { requireAppointment: true };
    const EstudioPuestoTrabajo = mongoose.models.EstudioPuestoTrabajo || require('~/models/EstudioPuestoTrabajo');
    let scheduledAppointment = null;

    if (cleanWorkerId) {
      scheduledAppointment = await EstudioPuestoTrabajo.findOne({
        companyId: company._id,
        workerId: cleanWorkerId,
        status: { $in: ['programado', 'en_curso'] },
      }).sort({ scheduledAt: 1 });
    }

    if (eptConfig.requireAppointment !== false) {
      if (!scheduledAppointment) {
        return res.status(403).json({
          success: false,
          requiresAppointment: true,
          message:
            'Este módulo requiere cita previa programada para ingresar a la auto-evaluación en vivo. Por favor comunícate con el área de SST de tu empresa.',
        });
      }

      const now = new Date();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      if (scheduledAppointment.scheduledAt && new Date(scheduledAppointment.scheduledAt) > endOfToday) {
        const dateStr = new Date(scheduledAppointment.scheduledAt).toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const timeStr = new Date(scheduledAppointment.scheduledAt).toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        return res.status(403).json({
          success: false,
          isFutureAppointment: true,
          scheduledAt: scheduledAppointment.scheduledAt,
          message: `Tu cita ergonómica está programada para el ${dateStr} a las ${timeStr}. Tu acceso se habilitará el día de tu turno.`,
        });
      }
    }

    // Resolver el agente Fisioterapeuta Laboral
    const Agent = mongoose.models.Agent || require('~/models/Agent');
    let agent = null;
    if (Agent) {
      agent = await Agent.findOne({
        $or: [
          { id: 'fisioterapeuta_laboral' },
          { name: /fisioterapeuta/i },
          { name: /biomec[aá]nic/i },
          { name: /ergonom[ií]a/i },
        ],
      }).lean();
    }
    if (!agent && Agent) {
      agent = await Agent.findOne({}).lean();
    }

    const resolvedAgentId = agent?.id || agent?._id?.toString() || 'fisioterapeuta_laboral';

    // Resolver usuario propietario para firmar JWT temporal
    let userId = company.user ? company.user.toString() : null;
    let User = mongoose.models.User;
    if (!User) {
      try {
        User = require('~/db/models').User;
      } catch (e) {}
    }
    if (User) {
      let validUser = null;
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        validUser = await User.findById(userId).lean();
      }
      if (!validUser) {
        validUser = (await User.findOne({ role: 'ADMIN' }).lean()) || (await User.findOne({}).lean());
        if (validUser) {
          userId = validUser._id.toString();
        }
      }
    }
    if (!userId) {
      userId = company._id.toString();
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const crypto = require('crypto');
    const conversationId = crypto.randomUUID();

    // Pre-crear la conversación vinculada al usuario administrador con tags de Somos SST
    try {
      const Conversation = mongoose.models.Conversation || require('~/db/models').Conversation;
      if (Conversation) {
        const title = workerName
          ? `Auto-evaluación EPT - ${workerName} (${cargo || 'Puesto'})`
          : `Auto-evaluación EPT en Vivo - ${company.companyName || 'Empresa'}`;

        await Conversation.create({
          conversationId,
          user: userId,
          endpoint: 'agents',
          agent_id: resolvedAgentId,
          model: 'gemini-3.6-flash',
          title,
          tags: ['sgsst-ept', 'sgsst-live-analysis', 'biomecanica', `company-${company._id}`],
        });
      }
    } catch (convoErr) {
      logger.warn('[Public SGSST] No se pudo pre-crear conversación EPT:', convoErr?.message);
    }

    // Registrar la sesión activa del trabajador para la empresa (bloqueo 1 a 1 temporal para evitar saturar claves API)
    activeWorkerSessionsByCompany.set(String(company._id), {
      workerId: cleanWorkerId,
      workerName: cleanWorkerName,
      startedAt: Date.now(),
    });

    if (scheduledAppointment) {
      scheduledAppointment.status = 'en_curso';
      await scheduledAppointment.save().catch(() => {});
    }

    return res.json({
      success: true,
      token,
      agentId: resolvedAgentId,
      agentName: agent?.name || 'Fisioterapeuta Laboral',
      agentModel: 'gemini-3.6-flash',
      conversationId,
      companyName: company.companyName,
    });
  } catch (error) {
    logger.error('[Public SGSST] EPT session error:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión Live con el Fisioterapeuta.' });
  }
});

// ─── POST /api/public-sgsst/estudio-puesto/:companyId ──────────────────────────
// Registra la auto-evaluación ergonómica enviada por el trabajador mediante el código QR
router.post('/estudio-puesto/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada o enlace inactivo.' });
    }

    const {
      workerName,
      workerId,
      cargo,
      actividad,
      telemetry,
      evidences,
      rulaScore,
      rebaScore,
      actionLevel,
      riskLevel,
      notes,
      reportHtml: incomingReportHtml,
      conversationId: incomingConvoId,
    } = req.body;

    if (!workerName || !workerId || !cargo) {
      return res.status(400).json({ error: 'Nombre, identificación y cargo son obligatorios.' });
    }

    const cleanDoc = String(workerId).trim();
    const cleanName = String(workerName).trim();
    const cleanCargo = String(cargo).trim();
    const cleanActividad = String(actividad || 'Labor cotidiana en puesto de trabajo').trim();

    let finalReportHtml = incomingReportHtml || '';
    let calculatedRula = rulaScore || 4;
    let calculatedReba = rebaScore || 4;
    let finalRiskLevel = riskLevel || 'Medio';
    let finalActionLevel = actionLevel || 'Nivel 2 - Requiere Ajustes Posturales';

    // Si no viene el reporte HTML ya compilado (p. ej. en chequeo asistido rápido), generarlo con IA
    if (!finalReportHtml || finalReportHtml.length < 50) {
      try {
        const { generateWithKeyRotation } = require('./sgsst/sgsstGemini');
        const {
          buildStandardHeader,
          buildWorkerSubHeader,
          buildSignatureSection,
          buildCompanyContextString,
        } = require('./sgsst/reportHeader');

        const companyInfo = await CompanyInfo.findById(company._id).lean();
        const currentDate = new Date().toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const standardHeaderHtml = buildStandardHeader({
          title: 'INFORME TÉCNICO DE AUTO-EVALUACIÓN ERGONÓMICA Y BIOMECÁNICA (EPT)',
          companyInfo: companyInfo || company,
          date: currentDate,
          norm: 'Resolución 2400 de 1979 / GTC 45 / ISO 11226 / Métodos RULA y REBA',
          responsibleName: companyInfo?.responsibleSST || 'Área de SG-SST',
        });

        const workerSubHeaderHtml = buildWorkerSubHeader({
          workerName: cleanName,
          workerId: cleanDoc,
          cargo: cleanCargo,
          actividad: cleanActividad,
          evaluationType: 'auto',
          evaluatorName: 'Auto-reporte asistido por WAPPY IA',
        });

        let evidencesHtml = '';
        if (Array.isArray(evidences) && evidences.length > 0) {
          const photosCards = evidences
            .map((ev, idx) => {
              const phaseNum = ev.phase || idx + 1;
              const phaseTitle = ev.label || `Evidencia ${phaseNum}`;
              return `
              <div style="flex:1; min-width:240px; max-width:320px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow:0 2px 4px rgba(0,0,0,0.04);">
                <div style="background:#0f766e; color:#ffffff; padding:6px 12px; font-size:11px; font-weight:700; text-transform:uppercase;">
                  ${phaseTitle}
                </div>
                <div style="height:200px; background:#000000; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                  <img src="${ev.url}" style="width:100%; height:100%; object-fit:cover;" alt="Evidencia ${phaseNum}" />
                </div>
              </div>`;
            })
            .join('');

          evidencesHtml = `
          <div style="margin:20px 0; page-break-inside:avoid;">
            <h3 style="color:#0f766e; font-size:14px; font-weight:700; margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px;">
              📸 Registro Fotográfico del Puesto de Trabajo
            </h3>
            <div style="display:flex; flex-wrap:wrap; gap:16px; justify-content:center;">
              ${photosCards}
            </div>
          </div>`;
        }

        const companyContext = buildCompanyContextString(companyInfo || company);
        const prompt = `
Eres el Fisioterapeuta Laboral y Auditor Ergonómico Especialista de WAPPY IA.
Genera el cuerpo técnico de un INFORME OFICIAL DE AUTO-EVALUACIÓN DE PUESTO DE TRABAJO (EPT) bajo normatividad colombiana (Resolución 2400 de 1979, Decreto 1072 de 2015, GTC 45 e ISO 11226).

${companyContext}

DATOS DEL COLABORADOR Y PUESTO:
- Trabajador: ${cleanName} (C.C. ${cleanDoc})
- Cargo evaluado: ${cleanCargo}
- Actividad laboral: ${cleanActividad}
- Modalidad: Auto-evaluación en línea vía portal del trabajador WAPPY
- Hallazgos ergonómicos reportados:
${notes || 'Chequeo postural general de oficina y puesto con PVD.'}
- Nivel de Riesgo Preliminar: ${finalRiskLevel}
- Nivel de Acción Estimado: ${finalActionLevel}

REGLAS DE FORMATO Y SALIDA:
- NO incluyas encabezados de empresa ni títulos globales (ya están creados en el sub-encabezado).
- Devuelve ÚNICAMENTE código HTML limpio estructurado con etiquetas <h3>, <p>, <ul>, <li> y tablas <div class="table-responsive"><table style="width:100%; min-width:800px; border-collapse:separate; border-radius:10px; border:1px solid #cbd5e1;">...</table></div>.
- El contenido debe incluir:
  1. <h3>1. Justificación y Alcance Biomecánico del Puesto</h3>
  2. <h3>2. Análisis Postural por Segmento Corporal (Cuello, Tronco, Miembros Superiores e Inferiores)</h3>
  3. <h3>3. Matriz de Valoración Ergonómica RULA / REBA</h3> (tabla comparativa con criterios, puntuaciones de grupo A y B, y nivel de acción).
  4. <h3>4. Factores Contribuyentes de Carga Física y Entorno (Mesa, Pantalla, Silla, Confort)</h3>
  5. <h3>5. Plan de Intervención y Recomendaciones de Higiene Postural (Pausas activas dirigidas, ajustes dimensionales)</h3>
  6. <h3>6. Dictamen de Aptitud Biomecánica y Compromiso de Auto-cuidado</h3>
- Tono profesional, técnico, médico-laboral y proactivo.
`;

        let userIdForAi = company.user ? String(company.user) : null;
        const aiResponse = await generateWithKeyRotation({
          userId: userIdForAi,
          model: 'gemini-3.6-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: 'Eres el Fisioterapeuta Laboral experto en Ergonomía, RULA, REBA e ISO 11226 de WAPPY IA.',
        });

        let aiHtml = aiResponse?.text || '<p>Auto-evaluación ergonómica completada satisfactoriamente.</p>';
        aiHtml = aiHtml.replace(/```html/gi, '').replace(/```/g, '').trim();

        const signatureHtml = buildSignatureSection({
          companyInfo: companyInfo || company,
          responsibleName: companyInfo?.responsibleSST || 'Área de SG-SST',
          worker: { nombre: cleanName, identificacion: cleanDoc, cargo: cleanCargo },
        });

        finalReportHtml = `
<div class="report-container" style="font-family:'Segoe UI',Arial,sans-serif; max-width:900px; margin:0 auto; color:#111827; line-height:1.6;">
  <style>
    .ai-report-content h3 { color: #0f766e; margin-top: 22px; margin-bottom: 10px; font-weight: 700; border-bottom: 1px solid #ccfbf1; padding-bottom: 5px; font-size: 1.15em; }
    .ai-report-content p, .ai-report-content li { color: #334155; margin-bottom: 8px; font-size: 0.95em; }
    .ai-report-content .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 16px 0; border-radius: 10px; border: 1px solid #e2e8f0; }
    .ai-report-content table { width: 100%; min-width: 800px; table-layout: auto; border-collapse: separate; border-spacing: 0; margin: 0; font-size: 0.85em; }
    .ai-report-content th { background-color: #0f766e; color: #ffffff; padding: 9px 10px; text-align: left; }
    .ai-report-content td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
    .ai-report-content tr:nth-child(even) td { background-color: #f8fafc; }
  </style>

  ${standardHeaderHtml}
  ${workerSubHeaderHtml}
  ${evidencesHtml}

  <div class="ai-report-content" style="background:#ffffff; padding:10px 0;">
    ${aiHtml}
  </div>

  ${signatureHtml}
</div>`.trim();
      } catch (aiErr) {
        logger.error('[Public SGSST] Error generating AI report HTML for EPT:', aiErr);
      }
    }

    const EstudioPuestoTrabajo = require('~/models/EstudioPuestoTrabajo');
    const newStudy = new EstudioPuestoTrabajo({
      companyId: company._id,
      user: company.user,
      workerId: cleanDoc,
      workerName: cleanName,
      cargo: cleanCargo,
      actividad: cleanActividad,
      evaluationType: 'auto',
      evaluatorName: 'Auto-reporte por trabajador vía QR',
      channel: 'qr_public',
      telemetry: telemetry || {},
      evidences: evidences || [],
      rulaScore: calculatedRula,
      rebaScore: calculatedReba,
      actionLevel: finalActionLevel,
      riskLevel: finalRiskLevel,
      reportHtml: finalReportHtml,
      notes: notes || '',
      status: 'completado',
      modelUsed: 'gemini-3.6-flash',
    });

    await newStudy.save();

    // ── Crear/Actualizar la conversación en LibreChat para el usuario administrador ──
    const targetUserId = company.user ? String(company.user) : null;
    const conversationId = incomingConvoId || require('crypto').randomUUID();

    if (targetUserId) {
      try {
        const { saveMessage, saveConvo } = require('~/models');
        const userMsgId = require('crypto').randomUUID();
        const aiMsgId = require('crypto').randomUUID();

        const userText = `Auto-evaluación ergonómica realizada por el trabajador: **${cleanName}** (C.C. ${cleanDoc}), Cargo: **${cleanCargo}**. Actividad: ${cleanActividad}.\n${notes || ''}`;

        await saveMessage(
          { user: { id: targetUserId } },
          {
            messageId: userMsgId,
            conversationId,
            text: userText,
            content: [{ type: 'text', text: userText }],
            user: targetUserId,
            sender: 'User',
            isCreatedByUser: true,
            model: 'gemini-3.6-flash',
          },
          { context: 'PublicEPT - User' }
        );

        const reportTitle = `Informe Técnico de Auto-evaluación EPT - ${cleanName}`;
        const aiMessageText = `Se ha procesado y compilado el informe técnico de auto-evaluación ergonómica para **${cleanName}** (${cleanCargo}).\n\n- **Nivel de Riesgo**: ${finalRiskLevel}\n- **Nivel de Acción**: ${finalActionLevel}\n- **Puntuación RULA estimada**: ${calculatedRula}\n\n:::canvas{title="${reportTitle}" fileType="text" identifier="ept-${newStudy._id}"}\n${finalReportHtml}\n:::\n`;

        await saveMessage(
          { user: { id: targetUserId } },
          {
            messageId: aiMsgId,
            conversationId,
            parentMessageId: userMsgId,
            sender: 'Fisioterapeuta Laboral',
            text: aiMessageText,
            content: [{ type: 'text', text: aiMessageText }],
            isCreatedByUser: false,
            isHtmlReport: true,
            model: 'gemini-3.6-flash',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { context: 'PublicEPT - AI' }
        );

        await saveConvo(
          { user: { id: targetUserId } },
          {
            conversationId,
            endpoint: 'agents',
            agent_id: 'fisioterapeuta_laboral',
            model: 'gemini-3.6-flash',
            title: `Auto-evaluación EPT - ${cleanName} (${cleanCargo})`,
            tags: ['sgsst-ept', 'biomecanica', `company-${company._id}`],
          },
          { context: 'PublicEPT - Convo' }
        );

        // Sincronizar en LiveEditorSession para el Canvas
        try {
          const LiveEditorSession = require('~/models/LiveEditorSession');
          if (LiveEditorSession) {
            await LiveEditorSession.findOneAndUpdate(
              { conversationId, companyId: company._id },
              {
                $set: {
                  content: finalReportHtml,
                  contentUpdatedAt: new Date(),
                  companyId: company._id,
                  fileName: reportTitle,
                },
                $setOnInsert: { user: targetUserId },
              },
              { upsert: true, new: true }
            );
          }
        } catch (leErr) {
          logger.warn('[Public SGSST] Could not sync LiveEditorSession for EPT:', leErr?.message);
        }
      } catch (convoSaveErr) {
        logger.warn('[Public SGSST] Could not save conversation in LibreChat:', convoSaveErr?.message);
      }
    }

    // Sincronizar o crear el trabajador en el perfil sociodemográfico de la empresa
    const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
    if (PerfilSociodemograficoData) {
      let perfilDoc = await PerfilSociodemograficoData.findOne({ companyId: company._id });
      if (!perfilDoc && company.user) {
        perfilDoc = new PerfilSociodemograficoData({
          user: company.user,
          companyId: company._id,
          trabajadores: [],
        });
      }

      if (perfilDoc) {
        const existingIdx = perfilDoc.trabajadores.findIndex(
          (w) => w.identificacion && String(w.identificacion).trim() === cleanDoc
        );

        const dateStr = new Date().toLocaleDateString('es-CO');
        const eptNote = `Auto-evaluación EPT vía QR (${dateStr}): ${finalActionLevel}. Actividad: ${cleanActividad}`;

        if (existingIdx >= 0) {
          const w = perfilDoc.trabajadores[existingIdx];
          if (!w.cargo && cleanCargo) w.cargo = cleanCargo;
          w.completedByAI = true;
          w.diagnosticoMedico = w.diagnosticoMedico ? `${w.diagnosticoMedico} | ${eptNote}` : eptNote;
        } else {
          perfilDoc.trabajadores.push({
            id: new mongoose.Types.ObjectId().toString(),
            nombre: cleanName,
            identificacion: cleanDoc,
            cargo: cleanCargo,
            completedByAI: true,
            diagnosticoMedico: eptNote,
            recomendacionesMedicas: 'Revisión postural y pausas activas periódicas.',
          });
        }
        perfilDoc.markModified('trabajadores');
        await perfilDoc.save();
      }
    }

    // Gamificación: +40 Puntos por auto-evaluación ergonómica
    if (company.user && cleanDoc) {
      try {
        const feedWorkerEvent = require('./sgsst/feedWorkerHelper');
        await feedWorkerEvent(
          company.user,
          cleanDoc,
          'estudio_puesto',
          `Auto-evaluación ergonómica de puesto de trabajo realizada (${finalActionLevel})`,
          40,
          String(newStudy._id)
        );
      } catch (feedErr) {
        logger.error('[Public SGSST] Error feeding worker event for estudio-puesto:', feedErr);
      }
    }

    // ── Liberar Concurrencia de la Sala 1 a 1 de la Empresa (Protección de API Keys) ──
    releaseWorkerSession(company._id);

    // ── Si el colaborador tenía una cita programada o en curso, actualizarla a completada ──
    try {
      const EstudioPuestoTrabajoModel =
        mongoose.models.EstudioPuestoTrabajo || require('~/models/EstudioPuestoTrabajo');
      await EstudioPuestoTrabajoModel.updateMany(
        {
          companyId: company._id,
          workerId: cleanDoc,
          status: { $in: ['programado', 'en_curso'] },
        },
        {
          $set: {
            status: 'completado',
            completedAt: new Date(),
            rulaScore: calculatedRula,
            rebaScore: calculatedReba,
            riskLevel: finalRiskLevel,
            actionLevel: finalActionLevel,
            reportHtml: finalReportHtml,
          },
        }
      );
    } catch (aptErr) {
      logger.warn('[Public SGSST] Error updating scheduled appointment to completado:', aptErr?.message);
    }

    return res.json({
      success: true,
      message: 'Auto-evaluación ergonómica registrada exitosamente.',
      studyId: newStudy._id,
      reportHtml: finalReportHtml,
      riskLevel: finalRiskLevel,
      actionLevel: finalActionLevel,
      rulaScore: calculatedRula,
      rebaScore: calculatedReba,
      conversationId,
    });
  } catch (error) {
    logger.error('[Public SGSST] POST /estudio-puesto error:', error);
    return res.status(500).json({ error: 'Error al registrar la auto-evaluación ergonómica.' });
  }
});

// ─── Mongoose Schemas para Comités y Convivencia Pública ─────────────────────
const ComiteAsistenciaSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tipoComite: { type: String, enum: ['copasst', 'cocolab', 'brigada', 'pesv'], required: true },
  accion: { type: String, enum: ['asistencia_reunion', 'inspeccion_seguridad', 'voto_eleccion', 'simulacro_brigada'], default: 'asistencia_reunion' },
  trabajadorNombre: { type: String, required: true },
  trabajadorCedula: { type: String, required: true },
  trabajadorCargo: { type: String, default: '' },
  rolEnComite: { type: String, default: 'Miembro' },
  fecha: { type: Date, default: Date.now },
  temasTratados: { type: String, default: '' },
  compromisos: { type: String, default: '' },
  firma: { type: String, default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  puntosOtorgados: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { strict: false });

const ComiteAsistencia = mongoose.models.ComiteAsistencia || mongoose.model('ComiteAsistencia', ComiteAsistenciaSchema);

const QuejaConvivenciaSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  radicado: { type: String, required: true, unique: true },
  tipoAcoso: { type: String, enum: ['laboral_ley_1010', 'sexual_ley_2365'], required: true },
  esAnonimo: { type: Boolean, default: false },
  denuncianteNombre: { type: String, default: '' },
  denuncianteCedula: { type: String, default: '' },
  denuncianteCargo: { type: String, default: '' },
  denuncianteContacto: { type: String, default: '' },
  personaReportada: { type: String, required: true },
  cargoPersonaReportada: { type: String, default: '' },
  descripcionHechos: { type: String, required: true },
  fechaHechos: { type: String, default: '' },
  lugarHechos: { type: String, default: '' },
  testigos: { type: String, default: '' },
  evidencias: { type: Array, default: [] },
  peticionOProteccion: { type: String, default: '' },
  status: { type: String, enum: ['radicado', 'en_tramite', 'medidas_cautelares', 'resuelto', 'archivado'], default: 'radicado' },
  notasComite: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { strict: false });

const QuejaConvivencia = mongoose.models.QuejaConvivencia || mongoose.model('QuejaConvivencia', QuejaConvivenciaSchema);

// ─── GET /api/public-sgsst/colaborador-info/:companyId/:cedula ───────────────
// Consulta el carnet digital y saldo de puntos de gamificación del colaborador
router.get('/colaborador-info/:companyId/:cedula', async (req, res) => {
  try {
    const { companyId, cedula } = req.params;
    const cleanCedula = String(cedula || '').trim();
    if (!cleanCedula) {
      return res.status(400).json({ error: 'Cédula requerida' });
    }

    const { company, perfil, worker: perfilWorker } = await resolveCompanyAndWorker(companyId, { cedula: cleanCedula });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // 2. Consultar perfil maestro y puntos de gamificación en SgsstWorker
    const SgsstWorker = mongoose.models.SgsstWorker || require('~/models/SgsstWorker');
    let worker = await SgsstWorker.findOne({
      user: company.user,
      $or: [
        { companyId: company._id },
        { companyId: company._id.toString() },
        { companyId: { $exists: false } },
        { companyId: null },
      ],
      documento: cleanCedula,
    }).lean();

    if (!worker && !perfilWorker) {
      return res.status(404).json({ error: 'Trabajador no encontrado en la base de datos de la empresa.' });
    }

    // Determinar valores efectivos unificados (prioridad a PerfilSociodemograficoData que es donde el usuario edita)
    const effectiveNombre = perfilWorker?.nombre || worker?.nombre || 'Colaborador';
    const effectiveCargo = perfilWorker?.cargo || worker?.cargo || 'Personal Operativo';
    const rawFit = (perfilWorker?.biocentricScore !== undefined && perfilWorker?.biocentricScore !== null)
      ? Number(perfilWorker.biocentricScore)
      : (worker?.fitScore !== undefined && worker?.fitScore !== null ? Number(worker.fitScore) : 95);
    const effectiveFitScore = (!isNaN(rawFit) && rawFit > 0) ? rawFit : 95;
    const effectiveAlerts = (perfilWorker?.biocentricAlerts && perfilWorker.biocentricAlerts.length > 0)
      ? perfilWorker.biocentricAlerts
      : (worker?.fitAlerts || []);

    // Sincronizar en SgsstWorker para consistencia total en toda la base de datos
    if (worker) {
      if (worker.cargo !== effectiveCargo || worker.fitScore !== effectiveFitScore || worker.nombre !== effectiveNombre) {
        SgsstWorker.updateOne(
          { _id: worker._id },
          {
            $set: {
              nombre: effectiveNombre,
              cargo: effectiveCargo,
              fitScore: effectiveFitScore,
              fitAlerts: effectiveAlerts,
              updatedAt: new Date(),
            }
          }
        ).catch(e => logger.warn('[Public SGSST] Error actualizando SgsstWorker en colaborador-info:', e.message));
      }
    } else if (perfilWorker) {
      // Si no existía en SgsstWorker, inicializarlo
      SgsstWorker.create({
        user: company.user,
        companyId: company._id,
        perfilId: cleanCedula,
        nombre: effectiveNombre,
        documento: cleanCedula,
        cargo: effectiveCargo,
        fitScore: effectiveFitScore,
        fitAlerts: effectiveAlerts,
        percepcionRiesgoScore: 0,
        percepcionRiesgoHistorial: [],
        riesgosBioIndividual: [],
      }).catch(e => logger.warn('[Public SGSST] Error autocreando SgsstWorker:', e.message));
    }

    const score = Number(worker?.percepcionRiesgoScore) || 0;
    const factorReduccion = Math.min(score / 500, 0.40);
    const nivel = score >= 500 ? 'Líder Biocéntrico 360°'
      : score >= 300 ? 'Guardián de la Vida'
      : score >= 100 ? 'Colaborador Comprometido'
      : 'Alerta Conductual';

    const termometroList = (worker?.termometro_animo && worker.termometro_animo.length > 0)
      ? worker.termometro_animo
      : (worker?.percepcionRiesgoHistorial || []).filter(h => h.modulo === 'termometro_animo');

    res.json({
      success: true,
      company: {
        id: company._id,
        companyName: company.companyName || 'Somos SST',
        logoUrl: company.logoUrl || null,
        arl: company.arl || '',
      },
      worker: {
        nombre: effectiveNombre,
        documento: cleanCedula,
        cargo: effectiveCargo,
        area: perfilWorker?.area || perfilWorker?.proceso || worker?.area || 'Operaciones / Planta',
        sede: perfilWorker?.sede || worker?.sede || 'Principal',
        genero: perfilWorker?.genero || worker?.genero || '',
        edad: perfilWorker?.edad || worker?.edad || '',
        fechaNacimiento: perfilWorker?.fechaNacimiento || worker?.fechaNacimiento || null,
        fechaIngreso: perfilWorker?.fechaIngreso || worker?.fechaIngreso || null,
        eps: perfilWorker?.eps || worker?.eps || '',
        afp: perfilWorker?.afp || worker?.afp || '',
        estadoPila: perfilWorker?.estadoPila || worker?.estadoPila || 'Pendiente de soporte PILA',
        arl: company.arl || perfilWorker?.arl || worker?.arl || '',
        rh: perfilWorker?.rh || perfilWorker?.grupoSanguineo || '',
        esBrigadista: perfilWorker?.esBrigadista || 'No',
        esComiteSeguridadVial: perfilWorker?.esComiteSeguridadVial || 'No',
        esCopasst: perfilWorker?.esCopasst || 'No',
        esComiteConvivencia: perfilWorker?.esComiteConvivencia || 'No',
        emergenciaContacto: perfilWorker?.emergenciaContacto || '',
        emergenciaTelefono: perfilWorker?.emergenciaTelefono || perfilWorker?.telefono || '',
        diagnosticoMedico: perfilWorker?.diagnosticoMedico || '',
        recomendacionesMedicas: perfilWorker?.recomendacionesMedicas || '',
        enfermedades: perfilWorker?.enfermedades || '',
        medicamentos: perfilWorker?.medicamentos || '',
        limitacionesBiomecanicas: perfilWorker?.limitacionesBiomecanicas || '',
        alergiasQuimicas: perfilWorker?.alergiasQuimicas || '',
        fuma: perfilWorker?.fuma || '',
        alcohol: perfilWorker?.alcohol || '',
        condicionesSalud: worker?.condicionesSalud || perfilWorker?.condicionesSalud || '',
        fitScore: effectiveFitScore,
        fitAlerts: effectiveAlerts,
        percepcionRiesgoScore: score,
        nivel,
        factorReduccion,
        porcentajeReduccion: Math.round(factorReduccion * 100),
        historial: (worker?.percepcionRiesgoHistorial || []).slice(-15).reverse(),
        atel: worker?.atel || [],
        actos_inseguros: worker?.actos_inseguros || [],
        participaciones_ipevar: worker?.participaciones_ipevar || [],
        capacitaciones: worker?.capacitaciones || [],
        termometro_animo: termometroList,
        riesgosBioIndividual: worker?.riesgosBioIndividual || [],
        riesgosCount: (worker?.riesgosBioIndividual || []).length,
      },
    });
  } catch (error) {
    logger.error('[Public SGSST] GET /colaborador-info error:', error);
    res.status(500).json({ error: 'Error al consultar información del colaborador' });
  }
});

// ─── POST /api/public-sgsst/comites/:companyId ───────────────────────────────
// Firma de asistencia o votación para COPASST, COCOLAB, Brigada y PESV
router.post('/comites/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      tipoComite,
      accion,
      trabajadorNombre,
      trabajadorCedula,
      trabajadorCargo,
      rolEnComite,
      temasTratados,
      compromisos,
      firma,
    } = req.body;

    if (!trabajadorNombre || !trabajadorCedula || !tipoComite) {
      return res.status(400).json({ error: 'Nombre, cédula y tipo de comité requeridos' });
    }

    const company = await resolveActiveCompany(companyId);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const newRegistro = new ComiteAsistencia({
      companyId: company._id,
      user: company.user,
      tipoComite,
      accion: accion || 'asistencia_reunion',
      trabajadorNombre: String(trabajadorNombre).trim(),
      trabajadorCedula: String(trabajadorCedula).trim(),
      trabajadorCargo: String(trabajadorCargo || '').trim(),
      rolEnComite: rolEnComite || 'Miembro',
      temasTratados: temasTratados || '',
      compromisos: compromisos || '',
      firma: firma || null,
      status: 'pending',
    });

    await newRegistro.save();

    // Notificar al coordinador en segundo plano
    setImmediate(async () => {
      try {
        await Notification.create({
          user: new mongoose.Types.ObjectId(company.user),
          type: 'sgsst_comite_asistencia',
          title: `Registro de Asistencia a Comité (${tipoComite.toUpperCase()})`,
          body: `${trabajadorNombre} (CC: ${trabajadorCedula}) ha registrado asistencia al ${tipoComite.toUpperCase()}.`,
          metadata: { module: 'comites', recordId: newRegistro._id },
        });
      } catch (err) {
        logger.warn('[Public Comites] Notification error:', err.message);
      }
    });

    res.json({
      success: true,
      message: 'Registro de comité recibido exitosamente y en espera de validación del coordinador.',
      recordId: newRegistro._id,
    });
  } catch (error) {
    logger.error('[Public SGSST] POST /comites error:', error);
    res.status(500).json({ error: 'Error al registrar comité' });
  }
});

// ─── GET /api/public-sgsst/copasst-inspecciones/:companyId ─────────────────────
// Carga contexto para realizar inspecciones: miembros de COPASST, sedes/áreas y recientes
router.get('/copasst-inspecciones/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { cedula } = req.query;

    const company = await resolveActiveCompany(companyId);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const { SgsstCopasstComite, SgsstCopasstInspeccion } = require('~/models/SgsstCopasst');

    // 1. Obtener comité activo para listar miembros
    const comite = await SgsstCopasstComite.findOne({ companyId: company._id, estado: 'activo' }).lean()
      || await SgsstCopasstComite.findOne({ companyId: company._id }).sort({ createdAt: -1 }).lean();

    const miembrosComite = [];
    if (comite) {
      (comite.representantesEmpleador || []).forEach((r) => {
        if (r.nombre && r.cedula) {
          miembrosComite.push({
            nombre: r.nombre,
            cedula: r.cedula,
            cargo: r.cargo || '',
            rolComite: `${r.rol || 'Principal'} (Rep. Empleador)`,
          });
        }
      });
      (comite.representantesTrabajadores || []).forEach((r) => {
        if (r.nombre && r.cedula) {
          miembrosComite.push({
            nombre: r.nombre,
            cedula: r.cedula,
            cargo: r.cargo || '',
            rolComite: `${r.rol || 'Principal'} (Rep. Trabajadores)`,
          });
        }
      });
      if (comite.vigia?.nombre && comite.vigia?.cedula) {
        miembrosComite.push({
          nombre: comite.vigia.nombre,
          cedula: comite.vigia.cedula,
          cargo: comite.vigia.cargo || '',
          rolComite: 'Vigía de SST',
        });
      }
    }

    // 2. Extraer sedes y áreas del perfil sociodemográfico o empresa
    const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData || require('./sgsst/perfilSociodemografico');
    const perfil = await PerfilSociodemograficoData.findOne({ companyId: company._id }).lean();
    const sedesSet = new Set(['Sede Principal']);
    const areasSet = new Set(['Operativa / Planta', 'Administración / Oficinas', 'Almacén / Bodega', 'Mantenimiento']);

    if (perfil && Array.isArray(perfil.trabajadores)) {
      perfil.trabajadores.forEach((w) => {
        if (w.sede) sedesSet.add(String(w.sede).trim());
        if (w.area) areasSet.add(String(w.area).trim());
      });
    }

    // 3. Inspecciones recientes (opcionalmente filtradas por cédula del inspector)
    const filter = { companyId: company._id };
    if (cedula) {
      filter['inspector.cedula'] = String(cedula).trim();
    }
    const recientes = await SgsstCopasstInspeccion.find(filter)
      .select('consecutivo fecha area sede tipoLabel semaforoGeneral estadoInspeccion hallazgos.length createdAt inspector')
      .sort({ fecha: -1, createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      company: {
        id: company._id,
        companyName: company.companyName,
        logo: company.logoUrl || null,
        sedes: Array.from(sedesSet),
        areas: Array.from(areasSet),
      },
      miembrosComite,
      recientes,
    });
  } catch (error) {
    logger.error('[Public SGSST] GET /copasst-inspecciones error:', error);
    res.status(500).json({ error: 'Error al cargar datos de inspección' });
  }
});

// ─── POST /api/public-sgsst/copasst-inspeccion/:companyId ─────────────────────
// Radicación móvil/pública de una inspección ágil por parte del COPASST o Vigía
router.post('/copasst-inspeccion/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      fecha,
      hora,
      sede,
      area,
      tipoInspeccion,
      tipoLabel,
      modo,
      inspector,
      acompanantes,
      responsableArea,
      hallazgos,
      checklistItems,
      semaforoGeneral,
      conclusiones,
    } = req.body;

    if (!inspector?.nombre || !inspector?.cedula || !area) {
      return res.status(400).json({ error: 'Nombre del inspector, cédula y área a inspeccionar son obligatorios' });
    }

    const company = await resolveActiveCompany(companyId);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const { SgsstCopasstInspeccion } = require('~/models/SgsstCopasst');

    const currentYear = new Date().getFullYear();
    const countThisYear = await SgsstCopasstInspeccion.countDocuments({
      companyId: company._id,
      createdAt: {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31, 23, 59, 59),
      },
    });
    const consecutivo = `INSP-COPASST-${currentYear}-${String(countThisYear + 1).padStart(3, '0')}`;

    const nuevaInspeccion = new SgsstCopasstInspeccion({
      companyId: company._id,
      user: company.user,
      consecutivo,
      fecha: fecha || new Date(),
      hora: hora || new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      sede: sede || 'Sede Principal',
      area: String(area).trim(),
      tipoInspeccion: tipoInspeccion || 'ronda_abierta',
      tipoLabel: tipoLabel || 'Ronda Abierta COPASST',
      modo: modo || 'fotografico_rapido',
      inspector: {
        nombre: String(inspector.nombre).trim(),
        cedula: String(inspector.cedula).trim(),
        cargo: String(inspector.cargo || '').trim(),
        rolComite: inspector.rolComite || 'Miembro COPASST',
        firma: inspector.firma || null,
      },
      acompanantes: Array.isArray(acompanantes) ? acompanantes : [],
      responsableArea: responsableArea || { nombre: '', cargo: '', firma: null },
      hallazgos: Array.isArray(hallazgos) ? hallazgos : [],
      checklistItems: Array.isArray(checklistItems) ? checklistItems : [],
      semaforoGeneral: semaforoGeneral || 'atencion',
      conclusiones: conclusiones || '',
      origen: 'portal_colaborador',
      estadoInspeccion: 'completada',
    });

    await nuevaInspeccion.save();

    // ─── Crear notificación en el sistema ───
    setImmediate(async () => {
      try {
        await Notification.create({
          user: new mongoose.Types.ObjectId(company.user),
          type: 'sgsst_copasst_inspeccion',
          title: `Nueva Inspección de Seguridad COPASST (${consecutivo})`,
          body: `${inspector.nombre} ha radicado la inspección "${tipoLabel || 'Inspección de Seguridad'}" en el área ${area} con ${(hallazgos || []).length} hallazgos registrados.`,
          metadata: { module: 'copasst', inspeccionId: nuevaInspeccion._id, consecutivo },
        });
      } catch (notifErr) {
        logger.warn('[Public SGSST] Inspeccion notification error:', notifErr.message);
      }
    });

    // ─── Gamificación Pasaporte SST: +50 Puntos al miembro del COPASST ───
    if (company.user && inspector.cedula) {
      try {
        const feedWorkerEvent = require('./sgsst/feedWorkerHelper');
        await feedWorkerEvent(
          company.user,
          String(inspector.cedula).trim(),
          'comites',
          `Ronda de inspección de seguridad COPASST (${consecutivo}) en ${area}`,
          50,
          nuevaInspeccion._id.toString(),
          { tipoInspeccion: tipoLabel || tipoInspeccion, hallazgosCount: (hallazgos || []).length }
        );
      } catch (feedErr) {
        logger.warn('[Public SGSST] Gamification feed error for copasst inspeccion:', feedErr.message);
      }
    }

    res.json({
      success: true,
      message: `Inspección ${consecutivo} radicada exitosamente y registrada para el COPASST.`,
      consecutivo,
      inspeccionId: nuevaInspeccion._id,
    });
  } catch (error) {
    logger.error('[Public SGSST] POST /copasst-inspeccion error:', error);
    res.status(500).json({ error: 'Error al registrar la inspección del COPASST' });
  }
});

// ─── POST /api/public-sgsst/convivencia/:companyId ───────────────────────────
// Canal formal y confidencial de quejas bajo Ley 1010 y Ley 2365 de 2024
router.post('/convivencia/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      tipoAcoso,
      esAnonimo,
      denuncianteNombre,
      denuncianteCedula,
      denuncianteCargo,
      denuncianteContacto,
      personaReportada,
      cargoPersonaReportada,
      descripcionHechos,
      fechaHechos,
      lugarHechos,
      testigos,
      evidencias,
      peticionOProteccion,
    } = req.body;

    if (!personaReportada || !descripcionHechos || !tipoAcoso) {
      return res.status(400).json({ error: 'Persona reportada, tipo de queja y descripción de los hechos son requeridos' });
    }

    const company = await resolveActiveCompany(companyId);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const radicadoNum = `RAD-${tipoAcoso === 'sexual_ley_2365' ? 'AS' : 'AL'}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newQueja = new QuejaConvivencia({
      companyId: company._id,
      user: company.user,
      radicado: radicadoNum,
      tipoAcoso,
      esAnonimo: !!esAnonimo,
      denuncianteNombre: esAnonimo ? 'Confidencial / Anónimo' : String(denuncianteNombre || '').trim(),
      denuncianteCedula: esAnonimo ? '' : String(denuncianteCedula || '').trim(),
      denuncianteCargo: esAnonimo ? '' : String(denuncianteCargo || '').trim(),
      denuncianteContacto: esAnonimo ? '' : String(denuncianteContacto || '').trim(),
      personaReportada: String(personaReportada).trim(),
      cargoPersonaReportada: String(cargoPersonaReportada || '').trim(),
      descripcionHechos: String(descripcionHechos).trim(),
      fechaHechos: fechaHechos || '',
      lugarHechos: lugarHechos || '',
      testigos: testigos || '',
      evidencias: Array.isArray(evidencias) ? evidencias : [],
      peticionOProteccion: peticionOProteccion || '',
      status: 'radicado',
    });

    await newQueja.save();

    // Notificación confidencial de máxima prioridad a la gerencia / talento humano
    setImmediate(async () => {
      try {
        await Notification.create({
          user: new mongoose.Types.ObjectId(company.user),
          type: 'sgsst_queja_convivencia',
          title: `⚠️ RADICADO CONFIDENCIAL: ${radicadoNum} (${tipoAcoso === 'sexual_ley_2365' ? 'Ley 2365 Acoso Sexual' : 'Ley 1010 Acoso Laboral'})`,
          body: `Se ha radicado una queja confidencial bajo radicado ${radicadoNum}. Requiere activación inmediata de protocolo de protección.`,
          metadata: { module: 'convivencia', radicado: radicadoNum },
        });
      } catch (err) {
        logger.warn('[Public Convivencia] Notification error:', err.message);
      }
    });

    res.json({
      success: true,
      radicado: radicadoNum,
      message: 'Queja radicada de forma confidencial. Conserva tu número de radicado para seguimiento.',
    });
  } catch (error) {
    logger.error('[Public SGSST] POST /convivencia error:', error);
    res.status(500).json({ error: 'Error al radicar queja confidencial' });
  }
});

// ─── GET /api/public-sgsst/elecciones/:companyId ─────────────────────────────
// Consulta procesos electorales activos (COPASST y Convivencia) para los colaboradores
router.get('/elecciones/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await resolveActiveCompany(companyId);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const { SgsstEleccion } = require('../../models/SgsstCopasst');
    const elecciones = await SgsstEleccion.find({
      companyId: company._id,
      estado: 'activa',
    }).select('-totalVotosEmitidos -votosEnBlanco').sort({ createdAt: -1 });

    res.json({ success: true, elecciones });
  } catch (error) {
    logger.error('[Public SGSST] GET /elecciones error:', error);
    res.status(500).json({ error: 'Error al consultar elecciones activas' });
  }
});

// ─── GET /api/public-sgsst/estado-voto/:companyId/:eleccionId/:cedula ─────────
// Verifica si el colaborador ya ejerció su derecho al voto en una elección específica
router.get('/estado-voto/:companyId/:eleccionId/:cedula', async (req, res) => {
  try {
    const { companyId, eleccionId, cedula } = req.params;
    const cleanCedula = String(cedula || '').trim();
    if (!cleanCedula) return res.status(400).json({ error: 'Cédula requerida' });

    const { SgsstPadronVotante } = require('../../models/SgsstVotacion');
    const yaVoto = await SgsstPadronVotante.findOne({
      eleccionId,
      trabajadorCedula: cleanCedula,
    });

    res.json({ yaVoto: !!yaVoto });
  } catch (error) {
    logger.error('[Public SGSST] GET /estado-voto error:', error);
    res.status(500).json({ error: 'Error al verificar estado de votación' });
  }
});

// ─── POST /api/public-sgsst/votar/:companyId ─────────────────────────────────
// Emisión de voto secreto con desacoplamiento total de la identidad y la preferencia
router.post('/votar/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { eleccionId, trabajadorCedula, trabajadorNombre, candidatoId, tipoComite } = req.body;

    const cleanCedula = String(trabajadorCedula || '').trim();
    if (!cleanCedula || !eleccionId || !candidatoId) {
      return res.status(400).json({ error: 'Elección, cédula y candidato requeridos' });
    }

    const company = await resolveActiveCompany(companyId);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const { SgsstEleccion } = require('../../models/SgsstCopasst');
    const eleccion = await SgsstEleccion.findOne({ _id: eleccionId, companyId: company._id, estado: 'activa' });
    if (!eleccion) {
      return res.status(400).json({ error: 'Este proceso electoral no está activo o ha cerrado.' });
    }

    const { SgsstPadronVotante, SgsstVotoAnonimo } = require('../../models/SgsstVotacion');

    // 1. Verificar si ya votó
    const registroExistente = await SgsstPadronVotante.findOne({
      eleccionId: eleccion._id,
      trabajadorCedula: cleanCedula,
    });

    if (registroExistente) {
      return res.status(400).json({ error: 'Ya has registrado tu voto en este proceso electoral.' });
    }

    // 2. Registrar en el Padrón Electoral (Solo cédula y confirmación de que votó, SIN el candidato)
    const nuevoPadron = new SgsstPadronVotante({
      companyId: company._id,
      eleccionId: eleccion._id,
      trabajadorCedula: cleanCedula,
      trabajadorNombre: trabajadorNombre || '',
      yaVoto: true,
      fechaVoto: new Date(),
    });
    await nuevoPadron.save();

    // 3. Registrar el Voto Anónimo (Solo el candidato, SIN la cédula ni identidad del trabajador)
    const nuevoVoto = new SgsstVotoAnonimo({
      companyId: company._id,
      eleccionId: eleccion._id,
      tipoComite: tipoComite || eleccion.tipoComite,
      candidatoId: String(candidatoId).trim(),
      fechaVoto: new Date(),
    });
    await nuevoVoto.save();

    // 4. Actualizar total acumulado de votos emitidos en la elección
    await SgsstEleccion.updateOne({ _id: eleccion._id }, { $inc: { totalVotosEmitidos: 1 } });

    // 5. Otorgar puntos de gamificación al colaborador (+20 pts)
    setImmediate(async () => {
      try {
        const worker = await SgsstWorker.findOne({ companyId: company._id, cedula: cleanCedula });
        if (worker) {
          worker.puntosGamificacion = (worker.puntosGamificacion || 0) + 20;
          await worker.save();
        }
      } catch (err) {
        logger.warn('[Public Votacion] Gamification points error:', err.message);
      }
    });

    res.json({
      success: true,
      message: '¡Tu voto ha sido registrado con éxito de forma 100% anónima, secreta y protegida por la ley!',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ya registraste tu voto en este proceso electoral.' });
    }
    logger.error('[Public SGSST] POST /votar error:', error);
    res.status(500).json({ error: 'Error al emitir el voto secreto' });
  }
});
// ─── GET /api/public-sgsst/actas-pendientes/:companyId ─────────────────────────
// Consulta actas de COPASST y Convivencia convocadas al trabajador para firma
router.get('/actas-pendientes/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { cedula } = req.query;

    if (!cedula || !String(cedula).trim()) {
      return res.json({ actas: [], actasPendientes: [], actasFirmadas: [] });
    }

    const company = await resolveActiveCompany(companyId);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const cleanCedula = String(cedula).trim();
    const digitsOnly = cleanCedula.replace(/\D/g, '');
    const matchCedula = (c1, c2) => {
      const s1 = String(c1 || '').trim().toLowerCase();
      const s2 = String(c2 || '').trim().toLowerCase();
      if (s1 === s2) return true;
      const d1 = s1.replace(/\D/g, '');
      const d2 = s2.replace(/\D/g, '');
      return d1 && d2 && d1 === d2;
    };

    const { SgsstCopasstActa } = require('~/models/SgsstCopasst');
    const { SgsstConvivenciaActa } = require('~/models/SgsstConvivencia');

    // 1. Buscar actas de COPASST donde el colaborador esté registrado como asistente
    const copasstActas = await SgsstCopasstActa.find({
      companyId: company._id,
      estadoActa: { $ne: 'archivada' },
      $or: [
        { 'asistentes.cedula': cleanCedula },
        ...(digitsOnly ? [{ 'asistentes.cedula': digitsOnly }] : []),
      ],
    }).sort({ anio: -1, mes: -1, createdAt: -1 }).lean();

    // 2. Buscar actas de Convivencia donde el colaborador esté registrado como asistente
    const convivenciaActas = await SgsstConvivenciaActa.find({
      companyId: company._id,
      estadoActa: { $ne: 'archivada' },
      $or: [
        { 'asistentes.cedula': cleanCedula },
        ...(digitsOnly ? [{ 'asistentes.cedula': digitsOnly }] : []),
      ],
    }).sort({ anio: -1, trimestre: -1, createdAt: -1 }).lean();

    const todasActas = [];

    // Mapear COPASST
    for (const acta of copasstActas) {
      const miAsistente = (acta.asistentes || []).find((a) => matchCedula(a.cedula, cleanCedula));
      if (miAsistente) {
        const haFirmado = Boolean(miAsistente.firma);
        todasActas.push({
          _id: acta._id,
          tipoComite: 'copasst',
          tituloComite: 'Comité Paritario de Seguridad y Salud en el Trabajo (COPASST)',
          consecutivo: acta.consecutivo,
          periodo: `Mes ${acta.mes} de ${acta.anio}`,
          tipo: acta.tipo === 'extraordinaria' ? 'Sesión Extraordinaria' : 'Sesión Ordinaria Mensual',
          fecha: acta.fecha,
          lugar: acta.lugar,
          hora: `${acta.horaInicio || '08:00'} - ${acta.horaFin || '10:00'}`,
          miRol: miAsistente.rol || 'Miembro COPASST',
          miNombre: miAsistente.nombre,
          miCargo: miAsistente.cargo || '',
          haFirmado,
          miFirma: miAsistente.firma || null,
          firmadoEn: miAsistente.firmadoEn || null,
          ordenDelDia: acta.ordenDelDia || [],
          desarrollo: acta.desarrollo || {},
          temasTratados: [
            acta.desarrollo?.analisisAccidentalidad,
            acta.desarrollo?.inspeccionesSeguridad,
            acta.desarrollo?.capacitacionesYCampanas,
            acta.desarrollo?.proposicionesVarios,
          ].filter(Boolean),
          compromisos: (acta.compromisos || []).map((c) => ({
            accion: c.accion,
            responsable: c.responsable,
            fechaLimite: c.fechaLimite,
            estado: c.estado || 'pendiente',
          })),
          totalAsistentes: acta.asistentes?.length || 0,
          firmasCompletadas: (acta.asistentes || []).filter((a) => !!a.firma).length,
          asistentes: (acta.asistentes || []).map((a) => ({
            nombre: a.nombre,
            rol: a.rol,
            cargo: a.cargo,
            haFirmado: Boolean(a.firma),
          })),
        });
      }
    }

    // Mapear Convivencia
    for (const acta of convivenciaActas) {
      const miAsistente = (acta.asistentes || []).find((a) => matchCedula(a.cedula, cleanCedula));
      if (miAsistente) {
        const haFirmado = Boolean(miAsistente.firma);
        todasActas.push({
          _id: acta._id,
          tipoComite: 'convivencia',
          tituloComite: 'Comité de Convivencia Laboral (COCOLAB)',
          consecutivo: acta.consecutivo,
          periodo: `Trimestre Q${acta.trimestre} de ${acta.anio}`,
          tipo: acta.tipo === 'extraordinaria' ? 'Sesión Extraordinaria' : 'Sesión Ordinaria Trimestral',
          fecha: acta.fecha,
          lugar: acta.lugar,
          hora: `${acta.horaInicio || '09:00'} - ${acta.horaFin || '11:00'}`,
          miRol: miAsistente.rol || 'Miembro COCOLAB',
          miNombre: miAsistente.nombre,
          miCargo: miAsistente.cargo || '',
          haFirmado,
          miFirma: miAsistente.firma || null,
          firmadoEn: miAsistente.firmadoEn || null,
          ordenDelDia: acta.ordenDelDia || [],
          desarrollo: acta.desarrollo || {},
          temasTratados: [
            acta.desarrollo?.revisionQuejasTrimestre,
            acta.desarrollo?.campanasPreventivasAcoso,
            acta.desarrollo?.climaLaboralPsicosocial,
            acta.desarrollo?.proposicionesVarios,
          ].filter(Boolean),
          compromisos: (acta.compromisos || []).map((c) => ({
            accion: c.accion,
            responsable: c.responsable,
            fechaLimite: c.fechaLimite,
            estado: c.estado || 'pendiente',
          })),
          totalAsistentes: acta.asistentes?.length || 0,
          firmasCompletadas: (acta.asistentes || []).filter((a) => !!a.firma).length,
          asistentes: (acta.asistentes || []).map((a) => ({
            nombre: a.nombre,
            rol: a.rol,
            cargo: a.cargo,
            haFirmado: Boolean(a.firma),
          })),
        });
      }
    }

    const actasPendientes = todasActas.filter((a) => !a.haFirmado);
    const actasFirmadas = todasActas.filter((a) => a.haFirmado);

    res.json({
      actas: actasPendientes,
      actasPendientes,
      actasFirmadas,
      totalPendientes: actasPendientes.length,
      totalFirmadas: actasFirmadas.length,
    });
  } catch (error) {
    logger.error('[Public SGSST] GET /actas-pendientes error:', error);
    res.status(500).json({ error: 'Error al consultar actas pendientes de firma' });
  }
});

// ─── POST /api/public-sgsst/actas/:companyId/firmar & /firmar-acta/:companyId ──
// Permite al participante firmar digitalmente un acta de su comité desde su portal
const handleFirmarActa = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { actaId, tipoComite, cedula, firma } = req.body;

    if (!actaId || !tipoComite || !cedula || !firma) {
      return res.status(400).json({ error: 'Todos los campos (actaId, tipoComite, cedula, firma) son requeridos' });
    }

    const company = await resolveActiveCompany(companyId);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const cleanCedula = String(cedula).trim();
    const matchCedula = (c1, c2) => {
      const s1 = String(c1 || '').trim().toLowerCase();
      const s2 = String(c2 || '').trim().toLowerCase();
      if (s1 === s2) return true;
      const d1 = s1.replace(/\D/g, '');
      const d2 = s2.replace(/\D/g, '');
      return d1 && d2 && d1 === d2;
    };

    const { SgsstCopasstActa } = require('~/models/SgsstCopasst');
    const { SgsstConvivenciaActa } = require('~/models/SgsstConvivencia');

    let acta = null;
    const normalizedTipo = String(tipoComite).toLowerCase();
    if (normalizedTipo === 'copasst') {
      acta = await SgsstCopasstActa.findOne({ _id: actaId, companyId: company._id });
    } else if (normalizedTipo === 'convivencia' || normalizedTipo === 'cocolab') {
      acta = await SgsstConvivenciaActa.findOne({ _id: actaId, companyId: company._id });
    }

    if (!acta) {
      return res.status(404).json({ error: 'Acta no encontrada en esta empresa' });
    }

    const asistenteIdx = (acta.asistentes || []).findIndex((a) => matchCedula(a.cedula, cleanCedula));

    if (asistenteIdx === -1) {
      return res.status(403).json({ error: 'No figuras en el listado oficial de participantes convocados para esta acta' });
    }

    // Estampar firma digital con metadatos de trazabilidad jurídica
    acta.asistentes[asistenteIdx].firma = firma;
    acta.asistentes[asistenteIdx].firmadoEn = new Date();
    acta.asistentes[asistenteIdx].firmadoDesde = 'portal_colaborador';
    acta.asistentes[asistenteIdx].asistio = true;

    // Verificar si ya todos los asistentes convocados firmaron
    const todosFirmaron = (acta.asistentes || []).every((a) => !!a.firma);
    if (todosFirmaron) {
      acta.estadoActa = 'aprobada';
    } else {
      acta.estadoActa = 'en_firmas';
    }

    if (acta.reporteOficialHtml) {
      const { updateCommitteeSignatureSectionInHtml } = require('./sgsst/reportHeader');
      acta.reporteOficialHtml = updateCommitteeSignatureSectionInHtml(acta.reporteOficialHtml, {
        asistentes: acta.asistentes,
        companyInfo: company,
        tipoComite: normalizedTipo,
      });
    }

    acta.markModified('asistentes');
    await acta.save();

    const asistenteNombre = acta.asistentes[asistenteIdx].nombre;

    // Notificar en segundo plano al Coordinador SST y otorgar puntos
    setImmediate(async () => {
      try {
        await Notification.create({
          user: new mongoose.Types.ObjectId(company.user),
          type: 'sgsst_firma_acta',
          title: `Firma Digital de Acta Recibida (${normalizedTipo.toUpperCase()})`,
          body: `${asistenteNombre} (C.C. ${cleanCedula}) firmó digitalmente el acta ${acta.consecutivo} desde el portal del trabajador.`,
          metadata: { actaId: acta._id, tipoComite: normalizedTipo, consecutivo: acta.consecutivo },
        });

        // Gamificación: +50 puntos por cumplimiento de firma legal de acta
        const SgsstWorker = require('~/models/SgsstWorker');
        const digitsOnly = cleanCedula.replace(/\D/g, '');
        const worker = await SgsstWorker.findOne({
          companyId: company._id,
          $or: [
            { cedula: cleanCedula },
            ...(digitsOnly ? [{ cedula: digitsOnly }] : []),
          ],
        });
        if (worker) {
          worker.puntosGamificacion = (worker.puntosGamificacion || 0) + 50;
          await worker.save();
        }
      } catch (notifErr) {
        logger.warn('[Public SGSST] Notification on acta sign error:', notifErr.message);
      }
    });

    res.json({
      success: true,
      message: `¡Tu firma digital en el acta ${acta.consecutivo} ha sido sellada con éxito con validez jurídica! (+50 pts)`,
      todosFirmaron,
      estadoActa: acta.estadoActa,
    });
  } catch (error) {
    logger.error('[Public SGSST] POST /actas/firmar error:', error);
    res.status(500).json({ error: 'Error al registrar la firma digital del acta' });
  }
};

router.post('/actas/:companyId/firmar', handleFirmarActa);
router.post('/firmar-acta/:companyId', handleFirmarActa);

// ─── GET /api/public-sgsst/brigadista/:companyId/:cedula? ───────────────────
// Consulta o inicializa la Hoja de Vida de Brigadista
router.get('/brigadista/:companyId/:cedula?', async (req, res) => {
  try {
    const { companyId, cedula: paramCedula } = req.params;
    const queryCedula = req.query.cedula;
    const targetCedula = String(paramCedula || queryCedula || '').trim();

    const company = await resolveActiveCompany(companyId);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const SgsstBrigadista = require('~/models/SgsstBrigadista');

    // 1. Si no hay cédula, listar brigadistas registrados para esta empresa
    if (!targetCedula) {
      const brigadistas = await SgsstBrigadista.find({ companyId: company._id })
        .select('nombre cedula cargo grupoEspecialidad rolSCI estadoMembresia rh')
        .sort({ nombre: 1 })
        .lean();

      return res.json({
        success: true,
        company: {
          id: company._id,
          companyName: company.companyName,
          logoUrl: company.logoUrl || null,
        },
        brigadistas,
      });
    }

    // 2. Si hay cédula, buscar brigadista existente
    const brigadista = await SgsstBrigadista.findOne({
      companyId: company._id,
      cedula: targetCedula,
    }).lean();

    // 3. Obtener datos del trabajador en PerfilSociodemografico para enriquecer o precargar
    const { worker } = await resolveCompanyAndWorker(companyId, { cedula: targetCedula });

    if (brigadista) {
      return res.json({
        success: true,
        company: {
          id: company._id,
          companyName: company.companyName,
          logoUrl: company.logoUrl || null,
        },
        brigadista,
        worker,
        isDraft: false,
      });
    }

    // 4. Si no existe registro formal de brigadista, preparar borrador con los datos del trabajador
    const draft = {
      companyId: company._id,
      cedula: targetCedula,
      nombre: worker?.nombre || '',
      cargo: worker?.cargo || '',
      sede: worker?.sede || 'Sede Principal',
      area: worker?.area || worker?.proceso || 'Operaciones / Planta',
      grupoEspecialidad: 'Primeros Auxilios',
      rolSCI: 'Brigadista Operativo',
      estadoMembresia: worker?.esBrigadista === 'Sí' ? 'Activo' : 'Aspirante / Postulado',
      rh: worker?.rh || worker?.tipoSangre || 'O+',
      alergiasMedicas: worker?.alergiasQuimicas || 'Ninguna conocida',
      condicionesMedicas: worker?.enfermedades || worker?.diagnosticoMedico || '',
      aptitudEmergencias: 'Apto sin restricciones para atención de emergencias',
      contactoEmergenciaNombre: worker?.emergenciaContacto || '',
      contactoEmergenciaParentesco: 'Familiar',
      contactoEmergenciaTelefono: worker?.emergenciaTelefono || worker?.telefono || '',
      dotacion: [
        { item: 'Chaleco reflectivo de brigadista con distintivo', entregado: true, observacion: 'Dotación reglamentaria' },
        { item: 'Brazalete reflectivo de brigada SCI', entregado: true, observacion: 'Identificación rápida' },
        { item: 'Silbato de advertencia y evacuación', entregado: true, observacion: 'Señalización acústica' },
        { item: 'Linterna táctica recargable de alta potencia', entregado: false, observacion: 'Pendiente de entrega' },
        { item: 'Botiquín personal de primeros auxilios y trauma', entregado: false, observacion: 'Dotación por sede' },
        { item: 'Guantes de nitrilo y protección ocular', entregado: true, observacion: 'Bioseguridad' },
      ],
      capacitaciones: [
        { tema: 'Primer Respondiente & Soporte Vital Básico (SVB)', horas: 8, institucion: 'ARL / Organismo de Socorro', estado: 'Certificado' },
        { tema: 'Prevención, Control de Conatos y Manejo de Extintores', horas: 6, institucion: 'Cuerpo de Bomberos', estado: 'Certificado' },
        { tema: 'Procedimientos Operativos Normalizados (PON) de Evacuación', horas: 4, institucion: 'SST Empresa', estado: 'Certificado' },
        { tema: 'Sistema Comando de Incidentes (SCI) en Terreno', horas: 8, institucion: 'Defensa Civil / Cruz Roja', estado: 'En curso' },
      ],
      simulacrosParticipados: [
        { nombre: 'Simulacro Nacional de Respuesta a Emergencias', rolDesempenado: 'Coordinador de Evacuación y Conteo' },
      ],
      carnetEmitido: true,
      fechaIngresoBrigada: new Date(),
    };

    return res.json({
      success: true,
      company: {
        id: company._id,
        companyName: company.companyName,
        logoUrl: company.logoUrl || null,
      },
      brigadista: draft,
      worker,
      isDraft: true,
    });
  } catch (error) {
    logger.error('[Public SGSST] GET /brigadista error:', error);
    res.status(500).json({ error: 'Error al consultar hoja de vida del brigadista' });
  }
});

// ─── POST /api/public-sgsst/brigadista/:companyId ───────────────────────────
// Guardar o actualizar la Hoja de Vida del Brigadista con firma digital y dotación
router.post('/brigadista/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      cedula,
      nombre,
      cargo,
      sede,
      area,
      grupoEspecialidad,
      rolSCI,
      estadoMembresia,
      rh,
      alergiasMedicas,
      condicionesMedicas,
      aptitudEmergencias,
      contactoEmergenciaNombre,
      contactoEmergenciaParentesco,
      contactoEmergenciaTelefono,
      dotacion,
      capacitaciones,
      simulacrosParticipados,
      firmaDigital,
      observaciones,
    } = req.body;

    if (!cedula || !nombre) {
      return res.status(400).json({ error: 'Cédula y nombre son obligatorios' });
    }

    const company = await resolveActiveCompany(companyId);
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const SgsstBrigadista = require('~/models/SgsstBrigadista');
    const cleanCedula = String(cedula).trim();

    const updatePayload = {
      companyId: company._id,
      user: company.user,
      cedula: cleanCedula,
      nombre: String(nombre).trim(),
      cargo: String(cargo || '').trim(),
      sede: String(sede || 'Sede Principal').trim(),
      area: String(area || '').trim(),
      grupoEspecialidad: grupoEspecialidad || 'Primeros Auxilios',
      rolSCI: rolSCI || 'Brigadista Operativo',
      estadoMembresia: estadoMembresia || 'Activo',
      rh: String(rh || 'O+').trim(),
      alergiasMedicas: String(alergiasMedicas || 'Ninguna conocida').trim(),
      condicionesMedicas: String(condicionesMedicas || '').trim(),
      aptitudEmergencias: aptitudEmergencias || 'Apto sin restricciones para atención de emergencias',
      contactoEmergenciaNombre: String(contactoEmergenciaNombre || '').trim(),
      contactoEmergenciaParentesco: String(contactoEmergenciaParentesco || 'Familiar').trim(),
      contactoEmergenciaTelefono: String(contactoEmergenciaTelefono || '').trim(),
      dotacion: Array.isArray(dotacion) ? dotacion : [],
      capacitaciones: Array.isArray(capacitaciones) ? capacitaciones : [],
      simulacrosParticipados: Array.isArray(simulacrosParticipados) ? simulacrosParticipados : [],
      observaciones: String(observaciones || '').trim(),
      carnetEmitido: true,
      updatedAt: new Date(),
    };

    if (firmaDigital) {
      updatePayload.firmaDigital = firmaDigital;
      updatePayload.fechaFirma = new Date();
    }

    const brigadista = await SgsstBrigadista.findOneAndUpdate(
      { companyId: company._id, cedula: cleanCedula },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 1. Sincronizar en PerfilSociodemograficoData (esBrigadista = 'Sí')
    try {
      const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData || require('./sgsst/perfilSociodemografico');
      const perfilDoc = await PerfilSociodemograficoData.findOne({ companyId: company._id });
      if (perfilDoc && Array.isArray(perfilDoc.trabajadores)) {
        const tIndex = perfilDoc.trabajadores.findIndex(
          (t) => String(t.identificacion || '').trim().toLowerCase() === cleanCedula.toLowerCase()
        );
        if (tIndex !== -1) {
          perfilDoc.trabajadores[tIndex].esBrigadista = 'Sí';
          if (rh) perfilDoc.trabajadores[tIndex].rh = rh;
          if (contactoEmergenciaNombre) perfilDoc.trabajadores[tIndex].emergenciaContacto = contactoEmergenciaNombre;
          if (contactoEmergenciaTelefono) perfilDoc.trabajadores[tIndex].emergenciaTelefono = contactoEmergenciaTelefono;
          perfilDoc.markModified('trabajadores');
          await perfilDoc.save();
        }
      }
    } catch (e) {
      logger.warn('[Public SGSST] Error syncing esBrigadista to PerfilSociodemografico:', e.message);
    }

    // 2. Otorgar puntos de gamificación (+40 pts) en SgsstWorker
    try {
      const SgsstWorker = require('~/models/SgsstWorker');
      const worker = await SgsstWorker.findOne({
        companyId: company._id,
        $or: [{ documento: cleanCedula }, { perfilId: cleanCedula }],
      });
      if (worker) {
        worker.percepcionRiesgoScore = (Number(worker.percepcionRiesgoScore) || 0) + 40;
        worker.percepcionRiesgoHistorial.push({
          fecha: new Date(),
          accion: 'Hoja de Vida de Brigadista Certificada & Credencial SCI',
          puntos: 40,
          modulo: 'brigada',
          referencia: String(brigadista._id),
        });
        await worker.save();
      }
    } catch (wErr) {
      logger.warn('[Public SGSST] Error awarding gamification points for Brigadista:', wErr.message);
    }

    // 3. Notificación al coordinador SST
    setImmediate(async () => {
      try {
        await Notification.create({
          user: new mongoose.Types.ObjectId(company.user),
          type: 'sgsst_brigadista_actualizado',
          title: `Hoja de Vida de Brigadista Registrada: ${nombre}`,
          body: `${nombre} (CC: ${cleanCedula}) ha confirmado su pertenencia a la Brigada de Emergencias (${grupoEspecialidad} - ${rolSCI}).`,
          metadata: { module: 'brigada', brigadistaId: brigadista._id },
        });
      } catch (nErr) {
        logger.warn('[Public Brigadista] Notification error:', nErr.message);
      }
    });

    res.json({
      success: true,
      message: '¡Hoja de Vida de Brigadista guardada exitosamente y carné digital activado! (+40 pts)',
      brigadista,
    });
  } catch (error) {
    logger.error('[Public SGSST] POST /brigadista error:', error);
    res.status(500).json({ error: 'Error al registrar hoja de vida del brigadista' });
  }
});

// ─── DOTACIÓN Y EPP (PORTAL PÚBLICO) ─────────────────────────────────────────

// GET /api/public-sgsst/epp/catalogo/:companyId — Catálogo disponible en almacén/bodega
router.get('/epp/catalogo/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const SgsstEppInventory = require('../../../models/SgsstEppInventory');
    let items = await SgsstEppInventory.find({
      companyId: company._id,
      activo: { $ne: false }
    }).sort({ categoria: 1, nombre: 1 }).lean();

    // Fallback: si la empresa no ha creado inventario aún, proveer catálogo normativo de referencia
    if (!items || items.length === 0) {
      items = [
        {
          _id: 'std-cab-1',
          codigo: 'EPP-CAB-01',
          nombre: 'Casco de seguridad dieléctrico Tipo II con barbuquejo',
          categoria: 'Protección de Cabeza',
          tipo: 'Regular',
          stockActual: 15,
          talla: 'Ajustable',
          unidad: 'Unidad'
        },
        {
          _id: 'std-ocu-1',
          codigo: 'EPP-OCU-01',
          nombre: 'Gafas de seguridad con filtro UV y antiempañante',
          categoria: 'Protección Ocular / Facial',
          tipo: 'Regular',
          stockActual: 30,
          talla: 'Única',
          unidad: 'Unidad'
        },
        {
          _id: 'std-aud-1',
          codigo: 'EPP-AUD-01',
          nombre: 'Protectores auditivos de inserción en silicona tipo copa/tapón',
          categoria: 'Protección Auditiva',
          tipo: 'Regular',
          stockActual: 40,
          talla: 'Única',
          unidad: 'Par'
        },
        {
          _id: 'std-res-1',
          codigo: 'EPP-RES-01',
          nombre: 'Respirador N95 / Mascarilla para material particulado',
          categoria: 'Protección Respiratoria',
          tipo: 'Regular',
          stockActual: 25,
          talla: 'M/L',
          unidad: 'Unidad'
        },
        {
          _id: 'std-man-1',
          codigo: 'EPP-MAN-01',
          nombre: 'Guantes de nitrilo / vaqueta de alta resistencia abrasiva',
          categoria: 'Protección de Manos',
          tipo: 'Regular',
          stockActual: 35,
          talla: '8 / 9 / 10',
          unidad: 'Par'
        },
        {
          _id: 'std-pie-1',
          codigo: 'EPP-PIE-01',
          nombre: 'Botas de seguridad dieléctricas con puntera de protección',
          categoria: 'Protección de Pies / Calzado',
          tipo: 'Regular',
          stockActual: 10,
          talla: '38 a 43',
          unidad: 'Par'
        },
        {
          _id: 'std-alt-1',
          codigo: 'EPP-ALT-01',
          nombre: 'Arnés de cuerpo entero multipropósito en X (4 argollas)',
          categoria: 'Trabajo en Alturas',
          tipo: 'Alturas',
          stockActual: 8,
          talla: 'Universal',
          unidad: 'Unidad'
        }
      ];
    }

    res.json({ catalogo: items });
  } catch (error) {
    logger.error('[Public SGSST] Error fetching EPP catalog:', error);
    res.status(500).json({ error: 'Error al obtener catálogo de EPP' });
  }
});

// POST /api/public-sgsst/epp/solicitar/:companyId — Registrar solicitud de EPP del colaborador
router.post('/epp/solicitar/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      workerId,
      documento,
      nombreTrabajador,
      cargo,
      items,
      justificacion,
      fotoEvidencia,
      urgencia
    } = req.body;

    if (!documento || !nombreTrabajador) {
      return res.status(400).json({ error: 'Nombre y documento son obligatorios' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un elemento de protección' });
    }

    const { company } = await resolveCompanyAndWorker(companyId, { cedula: documento });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const SgsstEppSolicitud = require('../../../models/SgsstEppSolicitud');

    const nuevaSolicitud = await SgsstEppSolicitud.create({
      companyId: company._id,
      user: company.user,
      workerId: workerId || documento,
      documento: String(documento).trim(),
      nombreTrabajador: nombreTrabajador.trim(),
      cargo: cargo || 'No especificado',
      items: items.map(it => ({
        eppId: it.eppId || null,
        codigo: it.codigo || '',
        nombre: it.nombre,
        categoria: it.categoria || 'General',
        tipo: it.tipo || 'Regular',
        talla: it.talla || '',
        cantidad: Number(it.cantidad) || 1,
        motivo: it.motivo || 'Desgaste normal por uso',
        observaciones: it.observaciones || ''
      })),
      justificacion: justificacion || '',
      fotoEvidencia: fotoEvidencia || null,
      urgencia: urgencia || 'Media',
      estado: 'pendiente',
      fechaSolicitud: new Date()
    });

    // Otorgar gamificación (+25 pts)
    const cleanDoc = String(documento).trim();
    try {
      const feedWorkerEvent = require('./sgsst/feedWorkerHelper');
      await feedWorkerEvent(
        company.user,
        cleanDoc,
        'solicitud_epp',
        `Solicitud de dotación/reposición de EPP (${items.length} ítems)`,
        25,
        String(nuevaSolicitud._id)
      );
    } catch (gErr) {
      logger.warn('[Public SGSST] Gamification error on EPP request:', gErr.message);
    }

    // Notificar al coordinador SST
    setImmediate(async () => {
      try {
        await Notification.create({
          user: new mongoose.Types.ObjectId(company.user),
          type: 'sgsst_solicitud_epp',
          title: `Nueva Solicitud de EPP: ${nombreTrabajador}`,
          body: `${nombreTrabajador} (${cargo || 'Colaborador'}) ha solicitado ${items.length} EPP desde el portal del colaborador.`,
          metadata: { module: 'epp', solicitudId: nuevaSolicitud._id },
        });
      } catch (nErr) {
        logger.warn('[Public SGSST] Notification error on EPP request:', nErr.message);
      }
    });

    res.json({
      success: true,
      message: '¡Solicitud de EPP radicada exitosamente! Recibirás notificación de entrega. (+25 pts)',
      solicitud: nuevaSolicitud
    });
  } catch (error) {
    logger.error('[Public SGSST] Error creating EPP request:', error);
    res.status(500).json({ error: 'Error al radicar solicitud de EPP' });
  }
});

// GET /api/public-sgsst/epp/mis-solicitudes/:companyId/:cedula — Historial de solicitudes del colaborador
router.get('/epp/mis-solicitudes/:companyId/:cedula', async (req, res) => {
  try {
    const { companyId, cedula } = req.params;
    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const SgsstEppSolicitud = require('../../../models/SgsstEppSolicitud');
    const solicitudes = await SgsstEppSolicitud.find({
      companyId: company._id,
      documento: String(cedula).trim()
    }).sort({ createdAt: -1 }).lean();

    res.json({ solicitudes });
  } catch (error) {
    logger.error('[Public SGSST] Error fetching worker EPP requests:', error);
    res.status(500).json({ error: 'Error al consultar solicitudes de EPP' });
  }
});

// ─── INSPECCIÓN PREOPERACIONAL VEHICULAR PESV (PORTAL PÚBLICO) ──────────────

// GET /api/public-sgsst/pesv/vehiculos-activos/:companyId — Flota registrada autorizada
router.get('/pesv/vehiculos-activos/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const SgsstVehicleData = require('../../../models/SgsstVehicleData');
    const vehiculos = await SgsstVehicleData.find({ companyId: company._id })
      .select('placa marca referencia modelo anio tipo conductorId conductorNombre soatVencimiento tecnomecanicaVencimiento kilometrajeActual ultimoMantenimiento')
      .lean();

    res.json({ vehiculos });
  } catch (error) {
    logger.error('[Public SGSST] Error fetching active vehicles:', error);
    res.status(500).json({ error: 'Error al consultar vehículos activos' });
  }
});

// POST /api/public-sgsst/pesv/inspeccion-diaria/:companyId — Registrar inspección preoperacional diaria
router.post('/pesv/inspeccion-diaria/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      placa,
      conductorCedula,
      conductorNombre,
      fecha,
      kilometraje,
      checklist,
      resultado,
      observaciones,
      firmaConductor,
      fotos
    } = req.body;

    if (!placa || !conductorCedula) {
      return res.status(400).json({ error: 'Placa y documento del conductor son requeridos' });
    }

    const company = await resolveActiveCompany(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const cleanPlaca = String(placa).trim().toUpperCase();
    const SgsstVehicleData = require('../../../models/SgsstVehicleData');

    // CRUCE ESTRICTO CON HOJA DE VIDA DE AUTOMOTORES
    const vehicle = await SgsstVehicleData.findOne({
      companyId: company._id,
      placa: cleanPlaca
    });

    if (!vehicle) {
      return res.status(400).json({
        error: `El vehículo con placa ${cleanPlaca} no se encuentra registrado en la Hoja de Vida de la flota oficial de la empresa. Según el Paso 16 del PESV (Res. 20223040040595), solo los vehículos vinculados pueden ser operados.`
      });
    }

    const km = Number(kilometraje) || vehicle.kilometrajeActual || 0;
    const todayStr = fecha || new Date().toISOString().split('T')[0];

    const nuevaInspeccion = {
      fecha: todayStr,
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      kilometraje: km,
      conductorCedula: String(conductorCedula).trim(),
      conductorNombre: conductorNombre || vehicle.conductorNombre,
      tipoVehiculo: vehicle.tipo || 'Automóvil',
      luces: checklist?.luces || 'Bueno',
      frenos: checklist?.frenos || 'Bueno',
      llantas: checklist?.llantas || 'Bueno',
      direccion: checklist?.direccion || 'Bueno',
      cinturones: checklist?.cinturones || 'Bueno',
      checklist: Array.isArray(checklist?.items) ? checklist.items : (Array.isArray(checklist) ? checklist : []),
      resultado: resultado === 'Rechazado' ? 'Rechazado' : 'Aprobado',
      firmaConductor: firmaConductor || null,
      fotos: Array.isArray(fotos) ? fotos : [],
      observaciones: observaciones || '',
      origen: 'portal_colaborador'
    };

    vehicle.inspecciones = vehicle.inspecciones || [];
    vehicle.inspecciones.push(nuevaInspeccion);
    vehicle.kilometrajeActual = Math.max(vehicle.kilometrajeActual || 0, km);
    vehicle.updatedAt = Date.now();
    await vehicle.save();

    // Sincronizar alertas con el perfil del conductor (IPEVAR)
    try {
      const SgsstWorker = require('~/models/SgsstWorker');
      const worker = await SgsstWorker.findOne({
        companyId: company._id,
        $or: [
          { documento: String(conductorCedula).trim() },
          { perfilId: vehicle.conductorId }
        ]
      });

      if (worker) {
        if (resultado === 'Rechazado') {
          const currentAlerts = new Set(worker.fitAlerts || []);
          currentAlerts.add(`Inspección Preoperacional Rechazada - Vehículo ${cleanPlaca}`);
          worker.fitAlerts = Array.from(currentAlerts);
        } else {
          const currentAlerts = new Set(worker.fitAlerts || []);
          currentAlerts.delete(`Inspección Preoperacional Rechazada - Vehículo ${cleanPlaca}`);
          worker.fitAlerts = Array.from(currentAlerts);
        }
        await worker.save();
      }
    } catch (syncErr) {
      logger.warn('[Public PESV] Error syncing inspection with worker alerts:', syncErr.message);
    }

    // Gamificación: +40 Puntos por inspección preoperacional realizada
    try {
      const feedWorkerEvent = require('./sgsst/feedWorkerHelper');
      await feedWorkerEvent(
        company.user,
        String(conductorCedula).trim(),
        'inspeccion_vehicular_pesv',
        `Inspección preoperacional diaria PESV completada (${cleanPlaca}) - ${resultado}`,
        40,
        `PESV-${cleanPlaca}-${todayStr}`
      );
    } catch (gErr) {
      logger.warn('[Public PESV] Gamification error on inspection:', gErr.message);
    }

    // Notificación al coordinador si fue Rechazada
    if (resultado === 'Rechazado') {
      setImmediate(async () => {
        try {
          await Notification.create({
            user: new mongoose.Types.ObjectId(company.user),
            type: 'sgsst_pesv_alerta',
            title: `🚨 Alerta PESV: Vehículo Inmovilizado / No Conforme (${cleanPlaca})`,
            body: `${conductorNombre || 'Conductor'} reportó hallazgos críticos en la inspección diaria de ${cleanPlaca}. El automotor no debe ser operado.`,
            metadata: { module: 'pesv', placa: cleanPlaca },
          });
        } catch (nErr) {
          logger.warn('[Public PESV] Notification error:', nErr.message);
        }
      });
    }

    res.json({
      success: true,
      message: resultado === 'Rechazado' 
        ? '⚠️ Inspección registrada con NO CONFORMIDAD. El vehículo NO debe circular hasta subsanar hallazgos.' 
        : '¡Inspección preoperacional diaria PESV completada exitosamente! Buen viaje seguro. (+40 pts)',
      inspeccion: nuevaInspeccion,
      kilometrajeActual: vehicle.kilometrajeActual
    });
  } catch (error) {
    logger.error('[Public SGSST] Error saving vehicle inspection:', error);
    res.status(500).json({ error: 'Error al registrar inspección preoperacional' });
  }
});

module.exports = router;
module.exports.releaseWorkerSession = releaseWorkerSession;
module.exports.getActiveWorkerSession = getActiveWorkerSession;

