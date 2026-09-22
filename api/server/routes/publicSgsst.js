const express = require('express');
const mongoose = require('mongoose');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const Notification = require('~/models/Notification');

const router = express.Router();

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
        title: 'Nueva Participación IPEVAR Recibida',
        body: `${workerFound.nombre} (${company.companyName || 'Empresa'}) ha enviado su identificación de peligros y participación IPEVAR.`,
        metadata: { module: 'participacion_ipevar', reportId: newInboxItem.id, companyId: company._id },
      });
    } catch (notifErr) {
      logger.warn('[Public SGSST] Could not create notification:', notifErr.message);
    }

    // ─── Gamificación Pasaporte SST: +150 Puntos por reporte IPEVAR ───
    if (company.user && (workerFound?.identificacion || cedula)) {
      try {
        const feedWorkerEvent = require('./sgsst/feedWorkerHelper');
        await feedWorkerEvent(
          company.user,
          String(workerFound?.identificacion || cedula).trim(),
          'participacion_ipevar',
          'Identificación y reporte de peligro IPEVAR (GTC-45)',
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

    // Find the correct investigation to push the testimony into
    let targetDoc = null;
    if (investigacionId) {
      targetDoc = await InvestigacionAtelData.findOne({
        user: new mongoose.Types.ObjectId(company.user),
        companyId: company._id,
        id: investigacionId
      });
    }

    if (!targetDoc) {
      // Fallback: get the most recent investigation for this company
      targetDoc = await InvestigacionAtelData.findOne({
        user: new mongoose.Types.ObjectId(company.user),
        companyId: company._id
      }).sort({ updatedAt: -1 });
    }

    if (targetDoc) {
      await InvestigacionAtelData.findByIdAndUpdate(
        targetDoc._id,
        { 
          $push: { inboxTestimonios: newInboxItem }, 
          $set: { updatedAt: Date.now() } 
        }
      );
    } else {
      // Fallback: create a new investigation if none exists at all
      await InvestigacionAtelData.findOneAndUpdate(
        { user: new mongoose.Types.ObjectId(company.user), companyId: company._id },
        { 
          $push: { inboxTestimonios: newInboxItem }, 
          $set: { 
            id: new mongoose.Types.ObjectId().toString(), 
            updatedAt: Date.now(),
            formData: {
              tipoEvento: 'Incidente',
              fechaEvento: new Date().toISOString().split('T')[0],
              horaEvento: '08:00',
              descripcionHechos: 'Creado automáticamente al recibir primer testimonio.'
            }
          } 
        },
        { upsert: true, new: true }
      );
    }

    // Gamificación: +30 Puntos por testimonio aportado en investigación ATEL
    if (company.user && cedula) {
      try {
        const feedWorkerEvent = require('./sgsst/feedWorkerHelper');
        await feedWorkerEvent(
          company.user,
          String(cedula).trim(),
          'atel_testimonio',
          `Testimonio aportado en investigación de incidente/accidente ATEL`,
          30,
          String(targetId || newInboxItem.id || 'ATEL-TEST')
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
      worker: {
        id: worker.id || worker._id?.toString() || worker.identificacion,
        nombre: worker.nombre,
        cargo: worker.cargo,
        identificacion: worker.identificacion,
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
      workers,
    });
  } catch (error) {
    logger.error('[Public SGSST] GET /estudio-puesto error:', error);
    return res.status(500).json({ error: 'Error al consultar datos de auto-evaluación.' });
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
    } = req.body;

    if (!workerName || !workerId || !cargo) {
      return res.status(400).json({ error: 'Nombre, identificación y cargo son obligatorios.' });
    }

    const EstudioPuestoTrabajo = require('~/models/EstudioPuestoTrabajo');
    const newStudy = new EstudioPuestoTrabajo({
      companyId: company._id,
      user: company.user,
      workerId: String(workerId).trim(),
      workerName: String(workerName).trim(),
      cargo: String(cargo).trim(),
      actividad: String(actividad || '').trim(),
      evaluationType: 'auto',
      evaluatorName: 'Auto-reporte por trabajador vía QR',
      channel: 'qr_public',
      telemetry: telemetry || {},
      evidences: evidences || [],
      rulaScore: rulaScore || null,
      rebaScore: rebaScore || null,
      actionLevel: actionLevel || 'Nivel 1 - Aceptable',
      riskLevel: riskLevel || 'Bajo',
      notes: notes || '',
      status: 'completado',
    });

    await newStudy.save();

    // Sincronizar o crear el trabajador en el perfil sociodemográfico de la empresa
    const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
    if (PerfilSociodemograficoData) {
      const cleanDoc = String(workerId).trim();
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
        const eptNote = `Auto-evaluación EPT vía QR (${dateStr}): ${actionLevel || 'Evaluado'}. Actividad: ${actividad || cargo}`;

        if (existingIdx >= 0) {
          const w = perfilDoc.trabajadores[existingIdx];
          if (!w.cargo && cargo) w.cargo = cargo.trim();
          w.completedByAI = true;
          w.diagnosticoMedico = w.diagnosticoMedico ? `${w.diagnosticoMedico} | ${eptNote}` : eptNote;
        } else {
          perfilDoc.trabajadores.push({
            id: new mongoose.Types.ObjectId().toString(),
            nombre: String(workerName).trim(),
            identificacion: cleanDoc,
            cargo: String(cargo).trim(),
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
          `Auto-evaluación ergonómica de puesto de trabajo realizada (${actionLevel || 'EPT'})`,
          40,
          String(newStudy._id)
        );
      } catch (feedErr) {
        logger.error('[Public SGSST] Error feeding worker event for estudio-puesto:', feedErr);
      }
    }

    return res.json({
      success: true,
      message: 'Auto-evaluación ergonómica registrada exitosamente.',
      studyId: newStudy._id,
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

    res.json({
      success: true,
      company: {
        id: company._id,
        companyName: company.companyName || 'Somos SST',
        logoUrl: company.logoUrl || null,
      },
      worker: {
        nombre: effectiveNombre,
        documento: cleanCedula,
        cargo: effectiveCargo,
        fitScore: effectiveFitScore,
        fitAlerts: effectiveAlerts,
        percepcionRiesgoScore: score,
        nivel,
        factorReduccion,
        porcentajeReduccion: Math.round(factorReduccion * 100),
        historial: (worker?.percepcionRiesgoHistorial || []).slice(-15).reverse(),
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

module.exports = router;

