const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireApiKeyOrJwt } = require('~/server/middleware/requireApiKeyAuth');
const CompanyInfo = require('~/models/CompanyInfo');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
const PESVWorkspaceSession = require('~/models/PESVWorkspaceSession');
const KanbanTask = require('~/models/KanbanTask');
const SgsstWorker = require('~/models/SgsstWorker');
const DiagnosticoData = require('~/models/DiagnosticoData');
const AuditoriaData = require('~/models/AuditoriaData');
const InvestigacionAtelData = require('~/models/InvestigacionAtelData');
const { SgsstCopasstComite, SgsstCopasstActa } = require('~/models/SgsstCopasst');
const { SgsstConvivenciaComite, SgsstConvivenciaActa } = require('~/models/SgsstConvivencia');
const SgsstBrigadista = require('~/models/SgsstBrigadista');
const SgsstChemicalData = require('~/models/SgsstChemicalData');
const SgsstVehicleData = require('~/models/SgsstVehicleData');
const SgsstEppData = require('~/models/SgsstEppData');
const Automation = require('~/models/Automation');
const Course = require('~/models/Course');
const UserProgress = require('~/models/UserProgress');
const { setMemory } = require('~/models');
const { Tokenizer } = require('@librechat/api');
const { logger } = require('~/config');

// Modelos con esquema dinámico registrado defensivamente
const MatrizLegalData =
  mongoose.models.MatrizLegalData ||
  mongoose.model(
    'MatrizLegalData',
    new mongoose.Schema(
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
        statuses: { type: Array, default: [] },
        seguimientos: { type: Object, default: {} },
        activity: { type: String, default: '' },
        location: { type: String, default: '' },
        entityType: { type: String, default: 'private' },
        updatedAt: { type: Date, default: Date.now },
      },
      { timestamps: true }
    )
  );

const ReporteActosData =
  mongoose.models.ReporteActosData ||
  mongoose.model(
    'ReporteActosData',
    new mongoose.Schema(
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
        formData: { type: Object, default: {} },
        trabajadoresList: { type: Array, default: [] },
        responsablesList: { type: Array, default: [] },
        images: { type: Object, default: {} },
        video: { type: String, default: null },
        inboxPublico: { type: Array, default: [] },
        updatedAt: { type: Date, default: Date.now },
      },
      { timestamps: true }
    )
  );

const PerfilCargoData =
  mongoose.models.PerfilCargoData ||
  mongoose.model(
    'PerfilCargoData',
    new mongoose.Schema(
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
        perfilesList: { type: Array, default: [] },
        updatedAt: { type: Date, default: Date.now },
      },
      { timestamps: true }
    )
  );

const ProgramaCapacitacionesData =
  mongoose.models.ProgramaCapacitacionesData ||
  mongoose.model(
    'ProgramaCapacitacionesData',
    new mongoose.Schema(
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
        sesiones: { type: Array, default: [] },
        planPersonalizado: { type: Array, default: [] },
        updatedAt: { type: Date, default: Date.now },
      },
      { timestamps: true }
    )
  );

// Helper para obtener empresa activa del usuario
async function getActiveCompany(userId) {
  let company = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
  if (!company) {
    company = await CompanyInfo.findOne({ user: userId }).lean();
  }
  return company;
}

// Helper para sincronizar memoria de IA
async function syncCompanyAiMemory(userId, companyData) {
  try {
    const memoryContent = `Razón Social / Nombre: ${companyData.companyName || 'N/A'}
Tipo de Empresa: ${companyData.companyType || 'Persona Jurídica'}
Documento de Identidad (NIT / CC): ${companyData.nit || 'N/A'}
Representante Legal: ${companyData.legalRepresentative || 'N/A'}
Cédula del Representante Legal: ${companyData.legalRepresentativeId || 'N/A'}
Número de Trabajadores: ${companyData.workerCount || 'N/A'}
ARL: ${companyData.arl || 'N/A'}
Nivel de Riesgo (ARL): ${companyData.riskLevel || 'N/A'}
Actividad Económica: ${companyData.economicActivity || 'N/A'}
Código CIIU: ${companyData.ciiu || 'N/A'}
Sector: ${companyData.sector || 'N/A'}
Dirección: ${companyData.address || 'N/A'} (Ciudad: ${companyData.city || 'N/A'}, Departamento: ${companyData.departamento || 'N/A'})
Responsable SG-SST: ${companyData.responsibleSST || 'N/A'}
Nivel de Formación SST: ${companyData.formationLevel || 'N/A'}
Número de Licencia SST: ${companyData.licenseNumber || 'N/A'}
Vigencia de Licencia: ${companyData.licenseExpiry || 'N/A'}
Actualización Curso 50/20H: ${companyData.courseStatus || 'N/A'}
Descripción General de Actividades: ${companyData.generalActivities || 'N/A'}`;

    const memoryKey = 'empresa_sgsst';
    const tokenCount = Tokenizer?.getTokenCount ? Tokenizer.getTokenCount(memoryContent, 'o200k_base') || 0 : 0;

    const MemoryEntry = mongoose.models.MemoryEntry;
    if (MemoryEntry) {
      await MemoryEntry.deleteMany({ userId, key: memoryKey });
    }

    await setMemory({ userId, agentId: 'global', key: memoryKey, value: memoryContent, tokenCount });
    logger.debug(`[MCP Bridge] Memoria de empresa sincronizada para usuario ${userId}`);
  } catch (err) {
    logger.error('[MCP Bridge] Error sincronizando memoria de empresa:', err);
  }
}

// ─── 1. PERFIL DE EMPRESA ───────────────────────────────────────────────────

router.get('/profile', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);

    if (!company) {
      return res.json({
        encontrado: false,
        mensaje: 'El usuario no tiene una empresa configurada aún en su perfil de WAPPY.',
        empresa: null,
      });
    }

    return res.json({
      encontrado: true,
      empresa: {
        id: company._id.toString(),
        companyName: company.companyName || '',
        companyType: company.companyType || 'Persona Jurídica',
        nit: company.nit || '',
        legalRepresentative: company.legalRepresentative || '',
        legalRepresentativeId: company.legalRepresentativeId || '',
        workerCount: company.workerCount || 0,
        arl: company.arl || '',
        economicActivity: company.economicActivity || '',
        riskLevel: company.riskLevel || '',
        ciiu: company.ciiu || '',
        address: company.address || '',
        city: company.city || '',
        departamento: company.departamento || '',
        phone: company.phone || '',
        email: company.email || '',
        responsibleSST: company.responsibleSST || '',
        formationLevel: company.formationLevel || '',
        licenseNumber: company.licenseNumber || '',
        licenseExpiry: company.licenseExpiry || '',
        courseStatus: company.courseStatus || '',
        generalActivities: company.generalActivities || '',
        sedes: Array.isArray(company.sedes) ? company.sedes : [],
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /profile error:', error);
    return res.status(500).json({ error: 'Error al consultar el perfil de empresa.' });
  }
});

router.post('/profile', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body || {};

    let company = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!company) {
      company = await CompanyInfo.findOne({ user: userId });
    }

    if (!company) {
      company = new CompanyInfo({
        user: userId,
        isActive: true,
        ...updateData,
      });
      await company.save();
    } else {
      const allowedFields = [
        'companyName',
        'companyType',
        'nit',
        'legalRepresentative',
        'legalRepresentativeId',
        'workerCount',
        'arl',
        'economicActivity',
        'riskLevel',
        'ciiu',
        'address',
        'city',
        'departamento',
        'phone',
        'email',
        'generalActivities',
        'sector',
        'responsibleSST',
        'responsibleSSTPhone',
        'formationLevel',
        'licenseNumber',
        'courseStatus',
        'licenseExpiry',
        'sedes',
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          company[field] = updateData[field];
        }
      }
      await company.save();
    }

    syncCompanyAiMemory(userId, company).catch(() => {});

    return res.json({
      exito: true,
      mensaje: 'Perfil de empresa actualizado exitosamente en WAPPY.',
      empresaId: company._id.toString(),
      companyName: company.companyName,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /profile error:', error);
    return res.status(500).json({ error: 'Error al actualizar el perfil de empresa.' });
  }
});

// ─── 2. RESUMEN DIAGNÓSTICO 360° TOTAL ──────────────────────────────────────

router.get('/resumen-360', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    // Ejecución paralela defensiva para obtener el panorama total
    const [
      workersCount,
      gtc45Session,
      pesvSession,
      tasksCount,
      diagnostico,
      matrizLegal,
      copasst,
      convivencia,
      brigadistasCount,
      quimicosCount,
      vehiculosCount,
      casosAtelCount,
      reportesActos,
      capacitacionesDoc,
      automationsCount,
    ] = await Promise.all([
      SgsstWorker.countDocuments({ user: userId }).catch(() => 0),
      GTC45WorkspaceSession.findOne({
        $or: [{ user: userId, isOfficial: true }, { companyId: companyId, isOfficial: true }],
      }).lean().catch(() => null),
      PESVWorkspaceSession.findOne({
        $or: [{ user: userId, isOfficial: true }, { companyId: companyId, isOfficial: true }],
      }).lean().catch(() => null),
      KanbanTask.countDocuments({ user: userId, status: { $ne: 'done' } }).catch(() => 0),
      DiagnosticoData.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      MatrizLegalData.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      SgsstCopasstComite.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      SgsstConvivenciaComite.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      SgsstBrigadista.countDocuments({ $or: [{ companyId }, { user: userId }] }).catch(() => 0),
      SgsstChemicalData.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      SgsstVehicleData.countDocuments({ $or: [{ companyId }, { user: userId }] }).catch(() => 0),
      InvestigacionAtelData.countDocuments({ $or: [{ companyId }, { user: userId }] }).catch(() => 0),
      ReporteActosData.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      ProgramaCapacitacionesData.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      Automation.countDocuments({ user: userId }).catch(() => 0),
    ]);

    const totalRiesgosGtc45 = gtc45Session?.matrixRows?.length || 0;
    const gtcNivel1 = (gtc45Session?.matrixRows || []).filter((r) => r.interpretacion_nr === 'I').length;

    const totalRiesgosPesv = pesvSession?.matrixRows?.length || 0;

    let totalLegal = 0;
    let cumplenLegal = 0;
    if (matrizLegal && Array.isArray(matrizLegal.statuses)) {
      totalLegal = matrizLegal.statuses.length;
      cumplenLegal = matrizLegal.statuses.filter((s) => s.status === 'cumple').length;
    }
    const legalCompliancePct = totalLegal > 0 ? Math.round((cumplenLegal / totalLegal) * 100) : 0;

    const totalReportesActos = (reportesActos?.inboxPublico?.length || 0);

    return res.json({
      exito: true,
      timestamp: new Date().toISOString(),
      empresa: company ? {
        id: company._id.toString(),
        companyName: company.companyName || 'Sin Razón Social',
        nit: company.nit || 'Sin NIT',
        riskLevel: company.riskLevel || 'N/A',
        arl: company.arl || 'N/A',
        responsibleSST: company.responsibleSST || 'No asignado',
      } : null,
      metricasClave: {
        trabajadoresRegistrados: workersCount,
        riesgosGTC45: {
          total: totalRiesgosGtc45,
          nivelCritico_I: gtcNivel1,
        },
        riesgosPESV: {
          total: totalRiesgosPesv,
        },
        estandares0312: {
          puntaje: diagnostico?.score || 0,
          nivelCumplimiento: diagnostico?.complianceLevel || 'Sin evaluar',
        },
        matrizLegal: {
          totalNormas: totalLegal,
          cumplen: cumplenLegal,
          porcentajeCumplimiento: `${legalCompliancePct}%`,
        },
        tareasPendientesCronograma: tasksCount,
        comites: {
          copasstVigente: !!copasst && copasst.estado === 'activo',
          modalidadCopasst: copasst?.modalidad || 'No constituido',
          convivenciaVigente: !!convivencia && convivencia.estado === 'activo',
          totalBrigadistas: brigadistasCount,
        },
        gestionOperativa: {
          productosQuimicosRegistrados: quimicosCount?.productos?.length || 0,
          vehiculosFlota: vehiculosCount,
          casosAtelInvestigados: casosAtelCount,
          reportesActosCondicionesPendientes: totalReportesActos,
          sesionesCapacitacionProgramadas: capacitacionesDoc?.sesiones?.length || 0,
          automatizacionesIAActivas: automationsCount,
        },
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /resumen-360 error:', error);
    return res.status(500).json({ error: 'Error al calcular el diagnóstico 360°.' });
  }
});

// ─── 3. MATRIZ GTC-45 ───────────────────────────────────────────────────────

router.get('/gtc45', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { proceso, cargo, peligro } = req.query;

    const company = await getActiveCompany(userId);
    const companyId = company?._id?.toString();
    const officialConvoId = `official-${companyId || userId}`;

    let session = await GTC45WorkspaceSession.findOne({
      $or: [
        { conversationId: officialConvoId },
        { user: userId, isOfficial: true },
        { companyId: companyId, isOfficial: true },
      ],
    }).lean();

    if (!session || !session.matrixRows || session.matrixRows.length === 0) {
      return res.json({
        totalRiesgos: 0,
        mensaje: 'La matriz GTC-45 está vacía actualmente.',
        riesgos: [],
      });
    }

    let rows = session.matrixRows;
    if (proceso) {
      rows = rows.filter((r) => r.proceso && r.proceso.toLowerCase().includes(proceso.toLowerCase()));
    }
    if (cargo) {
      rows = rows.filter((r) => r.cargo && r.cargo.toLowerCase().includes(cargo.toLowerCase()));
    }
    if (peligro) {
      rows = rows.filter(
        (r) =>
          (r.peligro_clasificacion && r.peligro_clasificacion.toLowerCase().includes(peligro.toLowerCase())) ||
          (r.peligro_descripcion && r.peligro_descripcion.toLowerCase().includes(peligro.toLowerCase()))
      );
    }

    return res.json({
      totalRiesgos: session.matrixRows.length,
      riesgosFiltrados: rows.length,
      riesgos: rows,
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /gtc45 error:', error);
    return res.status(500).json({ error: 'Error al consultar la matriz GTC-45.' });
  }
});

router.post('/gtc45', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { riesgos } = req.body;

    if (!riesgos || !Array.isArray(riesgos) || riesgos.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo "riesgos" con al menos un riesgo.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const officialConvoId = `official-${companyId || userId}`;

    let session = await GTC45WorkspaceSession.findOne({
      $or: [{ conversationId: officialConvoId }, { user: userId, isOfficial: true }],
    });

    if (!session) {
      session = new GTC45WorkspaceSession({
        conversationId: officialConvoId,
        user: userId,
        companyId: companyId || undefined,
        isOfficial: true,
        officialTitle: 'Matriz IPEVR Oficial SG-SST',
        matrixRows: [],
      });
    }

    let insertedCount = 0;
    const now = new Date().toISOString();

    for (const r of riesgos) {
      const nd = Number(r.nd) || 2;
      const ne = Number(r.ne) || 2;
      const np = nd * ne;
      const nc = Number(r.nc) || 25;
      const nr = np * nc;

      let interpretacion_np = 'Bajo (B)';
      if (np >= 24) interpretacion_np = 'Muy Alto (MA)';
      else if (np >= 10) interpretacion_np = 'Alto (A)';
      else if (np >= 6) interpretacion_np = 'Medio (M)';

      let interpretacion_nr = 'IV';
      if (nr >= 600) interpretacion_nr = 'I';
      else if (nr >= 150) interpretacion_nr = 'II';
      else if (nr >= 40) interpretacion_nr = 'III';

      let aceptabilidad = 'Aceptable';
      if (interpretacion_nr === 'I') aceptabilidad = 'No Aceptable';
      else if (interpretacion_nr === 'II') aceptabilidad = 'No Aceptable o Aceptable con control específico';
      else if (interpretacion_nr === 'III') aceptabilidad = 'Mejorable';

      const rowId = r.id || `gtc45_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      session.matrixRows.push({
        id: rowId,
        proceso: r.proceso || 'General',
        zona: r.zona || 'Instalaciones Principales',
        actividad: r.actividad || 'Operativa',
        tareas: r.tareas || r.actividad || 'N/A',
        rutinaria: r.rutinaria || 'Sí',
        cargo: r.cargo || 'Operativo',
        peligro_descripcion: r.peligro_descripcion || 'Riesgo identificado',
        peligro_clasificacion: r.peligro_clasificacion || 'Seguridad',
        efectos_posibles: r.efectos_posibles || 'Accidentes o lesiones',
        controles_fuente: r.controles_fuente || 'Ninguno',
        controles_medio: r.controles_medio || 'Ninguno',
        controles_individuo: r.controles_individuo || 'Capacitación y EPP',
        nd,
        ne,
        np,
        interpretacion_np,
        nc,
        nr,
        interpretacion_nr,
        aceptabilidad,
        peor_consecuencia: r.peor_consecuencia || 'Lesión o incapacidad',
        requisito_legal: r.requisito_legal || 'Sí',
        nro_expuestos: Number(r.nro_expuestos) || 1,
        medida_eliminacion: r.medida_eliminacion || 'Ninguno',
        medida_sustitucion: r.medida_sustitucion || 'Ninguno',
        medida_ingenieria: r.medida_ingenieria || 'Ninguno',
        medida_administrativa: r.medida_administrativa || 'Procedimiento de trabajo seguro',
        medida_eppu: r.medida_eppu || 'EPP básico',
        factores_reduccion: r.factores_reduccion || 'No aplica',
        creadoPor: 'Antigravity MCP Bridge',
        fechaRegistro: now,
      });

      insertedCount++;
    }

    session.markModified('matrixRows');
    await session.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Se agregaron ${insertedCount} riesgos exitosamente a la Matriz GTC-45 Oficial.`,
      totalRiesgosEnMatriz: session.matrixRows.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /gtc45 error:', error);
    return res.status(500).json({ error: 'Error al agregar riesgos a la matriz GTC-45.' });
  }
});

// ─── 4. MATRIZ PESV ─────────────────────────────────────────────────────────

router.get('/pesv', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id?.toString();
    const officialConvoId = `official-${companyId || userId}`;

    let session = await PESVWorkspaceSession.findOne({
      $or: [
        { conversationId: officialConvoId },
        { user: userId, isOfficial: true },
        { companyId: companyId, isOfficial: true },
      ],
    }).lean();

    if (!session || !session.matrixRows || session.matrixRows.length === 0) {
      return res.json({
        totalRiesgosViales: 0,
        mensaje: 'La matriz PESV está vacía actualmente.',
        riesgos: [],
      });
    }

    return res.json({
      totalRiesgosViales: session.matrixRows.length,
      riesgos: session.matrixRows,
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /pesv error:', error);
    return res.status(500).json({ error: 'Error al consultar la matriz PESV.' });
  }
});

router.post('/pesv', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { riesgos } = req.body;

    if (!riesgos || !Array.isArray(riesgos) || riesgos.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo "riesgos" para la matriz PESV.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const officialConvoId = `official-${companyId || userId}`;

    let session = await PESVWorkspaceSession.findOne({
      $or: [{ conversationId: officialConvoId }, { user: userId, isOfficial: true }],
    });

    if (!session) {
      session = new PESVWorkspaceSession({
        conversationId: officialConvoId,
        user: userId,
        companyId: companyId || undefined,
        isOfficial: true,
        officialTitle: 'Matriz PESV SG-SST',
        matrixRows: [],
      });
    }

    let insertedCount = 0;
    for (const r of riesgos) {
      const rowId = r.id || `pesv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      session.matrixRows.push({
        id: rowId,
        grupo_trabajo: r.grupo_trabajo || 'OPERATIVO',
        cargo: r.cargo || 'Conductor',
        tipo_desplazamiento: r.tipo_desplazamiento || 'Misional',
        rol_via: r.rol_via || 'Conductor de vehículo liviano',
        factor_riesgo: r.factor_riesgo || 'Factor Humano',
        peligro_descripcion: r.peligro_descripcion || 'Riesgo vial evaluado',
        np_cualitativo: r.np_cualitativo || 'PROBABLE',
        ne_cualitativo: r.ne_cualitativo || 'FRECUENTE',
        nc_cualitativo: r.nc_cualitativo || 'MODERADO',
        controles_existentes_descripcion: r.controles_existentes_descripcion || 'Ninguno',
        controles_existentes_tipo: r.controles_existentes_tipo || 'INDIVIDUO',
        tratamiento_accion: r.tratamiento_accion || 'MODIFICAR LOS FACTORES DE EXPOSICION',
        plan_accion_medio: r.plan_accion_medio || 'Ninguno',
        plan_accion_vehiculo: r.plan_accion_vehiculo || 'Mantenimiento preventivo',
        plan_accion_individuo: r.plan_accion_individuo || 'Capacitación en manejo defensivo',
        responsable: r.responsable || 'Responsable PESV',
        fecha_programacion: r.fecha_programacion || 'Permanente',
        estado: r.estado || 'PLANEADA',
        observaciones: r.observaciones || 'Registrado desde Antigravity MCP',
      });
      insertedCount++;
    }

    session.markModified('matrixRows');
    await session.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Se agregaron ${insertedCount} registros viales exitosamente a la Matriz PESV.`,
      totalRegistros: session.matrixRows.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /pesv error:', error);
    return res.status(500).json({ error: 'Error al agregar registros a la matriz PESV.' });
  }
});

// ─── 5. TRABAJADORES (SOCIODEMOGRÁFICO) ─────────────────────────────────────

router.get('/workers', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const workers = await SgsstWorker.find({ user: userId }).lean();
    return res.json({
      total: workers.length,
      trabajadores: workers.map((w) => ({
        id: w._id.toString(),
        nombre_completo: w.nombre_completo,
        cedula: w.cedula,
        cargo: w.cargo,
        area: w.area,
        sede: w.sede,
        nivel_riesgo_arl: w.nivel_riesgo_arl,
        tipo_contrato: w.tipo_contrato,
        antiguedad_anos: w.antiguedad_anos,
        estado: w.estado,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /workers error:', error);
    return res.status(500).json({ error: 'Error al consultar trabajadores.' });
  }
});

router.post('/workers', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const workerData = req.body;

    if (!workerData.nombre_completo || !workerData.cedula) {
      return res.status(400).json({ error: 'nombre_completo y cedula son campos requeridos.' });
    }

    let worker = await SgsstWorker.findOne({ user: userId, cedula: workerData.cedula });
    if (worker) {
      Object.assign(worker, workerData);
      await worker.save();
      return res.json({
        exito: true,
        mensaje: `Trabajador ${worker.nombre_completo} actualizado correctamente.`,
        id: worker._id.toString(),
      });
    }

    worker = new SgsstWorker({
      user: userId,
      ...workerData,
    });
    await worker.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Trabajador ${worker.nombre_completo} registrado correctamente en WAPPY.`,
      id: worker._id.toString(),
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /workers error:', error);
    return res.status(500).json({ error: 'Error al registrar trabajador.' });
  }
});

// ─── 6. CRONOGRAMA SST Y TAREAS KANBAN ──────────────────────────────────────

router.get('/tasks', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const filter = { user: userId };
    if (status) filter.status = status;

    const tasks = await KanbanTask.find(filter).sort({ dueDate: 1 }).lean();

    return res.json({
      total: tasks.length,
      tareas: tasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description || '',
        status: t.status,
        dueDate: t.dueDate,
        type: t.type,
        priority: t.priority,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /tasks error:', error);
    return res.status(500).json({ error: 'Error al consultar tareas del cronograma.' });
  }
});

router.post('/tasks', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, dueDate, type, priority } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'title y dueDate son requeridos para programar una tarea.' });
    }

    const task = new KanbanTask({
      user: userId,
      title: title.trim(),
      description: (description || '').trim(),
      dueDate: new Date(dueDate),
      type: type || 'manual',
      priority: priority || 'medium',
      status: 'todo',
    });
    await task.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Actividad "${task.title}" programada con éxito en el cronograma SST.`,
      tareaId: task._id.toString(),
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /tasks error:', error);
    return res.status(500).json({ error: 'Error al crear la tarea en el cronograma.' });
  }
});

router.patch('/tasks/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { status, description, priority, dueDate } = req.body;

    const task = await KanbanTask.findOne({ _id: taskId, user: userId });
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }

    if (status) task.status = status;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = new Date(dueDate);

    await task.save();

    return res.json({
      exito: true,
      mensaje: `Tarea "${task.title}" actualizada exitosamente.`,
      tarea: {
        id: task._id.toString(),
        title: task.title,
        status: task.status,
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] PATCH /tasks/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar la tarea.' });
  }
});

// ─── 7. MATRIZ LEGAL SST ───────────────────────────────────────────────────

router.get('/matriz-legal', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await MatrizLegalData.findOne({ $or: [{ companyId }, { user: userId }] }).lean();
    if (!doc || !Array.isArray(doc.statuses) || doc.statuses.length === 0) {
      return res.json({
        totalNormas: 0,
        mensaje: 'La matriz de requisitos legales no tiene registros aún.',
        normas: [],
      });
    }

    const total = doc.statuses.length;
    const cumplen = doc.statuses.filter((s) => s.status === 'cumple').length;
    const porcentaje = total > 0 ? Math.round((cumplen / total) * 100) : 0;

    return res.json({
      totalNormas: total,
      cumplen,
      porcentajeCumplimiento: `${porcentaje}%`,
      normas: doc.statuses,
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /matriz-legal error:', error);
    return res.status(500).json({ error: 'Error al consultar matriz legal.' });
  }
});

router.post('/matriz-legal', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { norma, articulo, descripcion, clasificacion, evidencia, status, responsable } = req.body;

    if (!norma || !descripcion) {
      return res.status(400).json({ error: 'norma y descripcion son obligatorios.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await MatrizLegalData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new MatrizLegalData({
        user: userId,
        companyId,
        statuses: [],
      });
    }

    const newItem = {
      id: `leg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      norma: norma.trim(),
      articulo: articulo || 'General',
      descripcion: descripcion.trim(),
      clasificacion: clasificacion || 'Seguridad y Salud en el Trabajo',
      evidencia: evidencia || '',
      status: status || 'cumple', // 'cumple', 'no_cumple', 'en_tramite', 'no_aplica'
      responsable: responsable || 'Responsable SST',
      fechaActualizacion: new Date().toISOString(),
    };

    doc.statuses.push(newItem);
    doc.markModified('statuses');
    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Requisito legal "${norma}" agregado a la matriz.`,
      totalNormas: doc.statuses.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /matriz-legal error:', error);
    return res.status(500).json({ error: 'Error al agregar requisito legal.' });
  }
});

// ─── 8. ESTÁNDARES MÍNIMOS RESOLUCIÓN 0312 ─────────────────────────────────

router.get('/diagnostico-0312', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await DiagnosticoData.findOne({ $or: [{ companyId }, { user: userId }] }).lean();
    if (!doc) {
      return res.json({
        evaluado: false,
        mensaje: 'Aún no se ha realizado la autoevaluación de estándares mínimos 0312.',
        score: 0,
        complianceLevel: 'Sin evaluar',
        items: [],
      });
    }

    return res.json({
      evaluado: true,
      score: doc.score || 0,
      totalPoints: doc.totalPoints || 100,
      complianceLevel: doc.complianceLevel || '',
      companySize: doc.companySize || 'medium',
      riskLevel: doc.riskLevel || 3,
      totalItemsEvaluados: (doc.statusData || []).length,
      items: doc.statusData || [],
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /diagnostico-0312 error:', error);
    return res.status(500).json({ error: 'Error al consultar diagnóstico 0312.' });
  }
});

router.post('/diagnostico-0312', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, code, name, status, observation, points } = req.body;

    if (!code || !status) {
      return res.status(400).json({ error: 'code y status ("cumple", "no_cumple", "no_aplica") son requeridos.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await DiagnosticoData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new DiagnosticoData({
        user: userId,
        companyId,
        statusData: [],
      });
    }

    let existing = doc.statusData.find((i) => i.code === code || i.itemId === itemId);
    if (existing) {
      existing.status = status;
      if (observation !== undefined) existing.observation = observation;
      if (points !== undefined) existing.points = Number(points);
    } else {
      doc.statusData.push({
        itemId: itemId || `std_${Date.now()}`,
        code,
        name: name || code,
        status,
        observation: observation || '',
        points: Number(points) || 0,
      });
    }

    // Recalcular puntaje acumulado
    const totalPuntos = doc.statusData.reduce((acc, curr) => {
      return curr.status === 'cumple' || curr.status === 'no_aplica' ? acc + (Number(curr.points) || 0) : acc;
    }, 0);

    doc.score = totalPuntos;
    if (totalPuntos >= 86) doc.complianceLevel = 'Aceptable';
    else if (totalPuntos >= 61) doc.complianceLevel = 'Moderadamente Aceptable';
    else doc.complianceLevel = 'Crítico';

    doc.markModified('statusData');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: `Estándar ${code} evaluado como "${status}". Puntaje actual: ${doc.score} (${doc.complianceLevel}).`,
      score: doc.score,
      complianceLevel: doc.complianceLevel,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /diagnostico-0312 error:', error);
    return res.status(500).json({ error: 'Error al evaluar estándar 0312.' });
  }
});

// ─── 9. COMITÉS SST (COPASST, CONVIVENCIA, BRIGADA) ─────────────────────────

router.get('/comites', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const [copasst, convivencia, brigadistas] = await Promise.all([
      SgsstCopasstComite.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      SgsstConvivenciaComite.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      SgsstBrigadista.find({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => []),
    ]);

    return res.json({
      copasst: copasst ? {
        modalidad: copasst.modalidad,
        estado: copasst.estado,
        periodoInicio: copasst.periodoInicio,
        periodoFin: copasst.periodoFin,
        empleador: copasst.integrantesEmpleador || [],
        trabajadores: copasst.integrantesTrabajador || [],
      } : { estado: 'No constituido' },
      convivencia: convivencia ? {
        centroTrabajo: convivencia.centroTrabajo,
        estado: convivencia.estado,
        periodoInicio: convivencia.periodoInicio,
        periodoFin: convivencia.periodoFin,
        empleador: convivencia.representantesEmpleador || [],
        trabajadores: convivencia.representantesTrabajador || [],
      } : { estado: 'No constituido' },
      brigada: {
        totalIntegrantes: brigadistas.length,
        integrantes: brigadistas.map((b) => ({
          nombre: b.nombre,
          cedula: b.cedula,
          cargo: b.cargo,
          sede: b.sede,
          grupoBrigada: b.grupoBrigada,
          rol: b.rol,
        })),
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /comites error:', error);
    return res.status(500).json({ error: 'Error al consultar comités.' });
  }
});

router.post('/comites', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipoComite, nombre, cedula, cargo, rol, parte, grupoBrigada, sede } = req.body;

    if (!tipoComite || !nombre || !cedula) {
      return res.status(400).json({ error: 'tipoComite ("copasst", "convivencia", "brigada"), nombre y cedula son obligatorios.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    if (tipoComite === 'brigada') {
      let brig = await SgsstBrigadista.findOne({ companyId, cedula });
      if (brig) {
        brig.nombre = nombre;
        if (cargo) brig.cargo = cargo;
        if (grupoBrigada) brig.grupoBrigada = grupoBrigada;
        if (rol) brig.rol = rol;
        if (sede) brig.sede = sede;
        await brig.save();
      } else {
        brig = new SgsstBrigadista({
          companyId,
          user: userId,
          nombre,
          cedula,
          cargo: cargo || '',
          grupoBrigada: grupoBrigada || 'Primeros Auxilios',
          rol: rol || 'Brigadista Operativo',
          sede: sede || 'Sede Principal',
        });
        await brig.save();
      }
      return res.json({ exito: true, mensaje: `Brigadista ${nombre} registrado en el grupo ${grupoBrigada || 'Primeros Auxilios'}.` });
    }

    if (tipoComite === 'copasst') {
      let doc = await SgsstCopasstComite.findOne({ $or: [{ companyId }, { user: userId }] });
      if (!doc) {
        doc = new SgsstCopasstComite({
          companyId,
          user: userId,
          modalidad: 'copasst',
          estado: 'activo',
          integrantesEmpleador: [],
          integrantesTrabajador: [],
        });
      }
      const nuevo = { nombre, cedula, cargo: cargo || '', rol: rol || 'Principal' };
      if (parte === 'empleador') {
        doc.integrantesEmpleador.push(nuevo);
      } else {
        doc.integrantesTrabajador.push(nuevo);
      }
      await doc.save();
      return res.json({ exito: true, mensaje: `Integrante ${nombre} agregado al COPASST (${parte || 'trabajador'}).` });
    }

    if (tipoComite === 'convivencia') {
      let doc = await SgsstConvivenciaComite.findOne({ $or: [{ companyId }, { user: userId }] });
      if (!doc) {
        doc = new SgsstConvivenciaComite({
          companyId,
          user: userId,
          estado: 'activo',
          representantesEmpleador: [],
          representantesTrabajador: [],
        });
      }
      const nuevo = { nombre, cedula, cargo: cargo || '', rol: rol || 'Principal' };
      if (parte === 'empleador') {
        doc.representantesEmpleador.push(nuevo);
      } else {
        doc.representantesTrabajador.push(nuevo);
      }
      await doc.save();
      return res.json({ exito: true, mensaje: `Representante ${nombre} agregado al Comité de Convivencia.` });
    }

    return res.status(400).json({ error: 'tipoComite no válido.' });
  } catch (error) {
    logger.error('[MCP Bridge] POST /comites error:', error);
    return res.status(500).json({ error: 'Error al registrar integrante de comité.' });
  }
});

// ─── 10. PRODUCTOS QUÍMICOS Y SGA ──────────────────────────────────────────

router.get('/quimicos', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const doc = await SgsstChemicalData.findOne({ $or: [{ companyId }, { user: userId }] }).lean();
    return res.json({
      totalProductos: doc?.productos?.length || 0,
      productos: doc?.productos || [],
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /quimicos error:', error);
    return res.status(500).json({ error: 'Error al consultar químicos.' });
  }
});

router.post('/quimicos', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, fabricante, estadoFisico, pictogramasSga, claseOnu, ubicacion, cantidadAlmacenada, tieneFds, tieneRotuloSga, incompatibilidades, observaciones } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'nombre del producto químico es requerido.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await SgsstChemicalData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new SgsstChemicalData({
        user: userId,
        companyId,
        productos: [],
      });
    }

    const prodId = `chem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    doc.productos.push({
      id: prodId,
      nombre: nombre.trim(),
      fabricante: fabricante || '',
      estadoFisico: estadoFisico || 'Líquido',
      pictogramasSga: Array.isArray(pictogramasSga) ? pictogramasSga : [],
      claseOnu: claseOnu || '',
      ubicacion: ubicacion || 'Bodega de Químicos',
      cantidadAlmacenada: cantidadAlmacenada || '',
      tieneFds: tieneFds || 'Sí',
      tieneRotuloSga: tieneRotuloSga || 'Sí',
      incompatibilidades: Array.isArray(incompatibilidades) ? incompatibilidades : [],
      observaciones: observaciones || '',
    });

    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Producto químico "${nombre}" incorporado al inventario con SGA.`,
      totalProductos: doc.productos.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /quimicos error:', error);
    return res.status(500).json({ error: 'Error al registrar químico.' });
  }
});

// ─── 11. VEHÍCULOS Y SEGURIDAD VIAL ─────────────────────────────────────────

router.get('/vehiculos', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const vehiculos = await SgsstVehicleData.find({ $or: [{ companyId }, { user: userId }] }).lean();
    return res.json({
      totalVehiculos: vehiculos.length,
      vehiculos: vehiculos.map((v) => ({
        id: v._id.toString(),
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        tipo: v.tipo,
        conductorNombre: v.conductorNombre,
        conductorCedula: v.conductorCedula,
        soatVencimiento: v.soatVencimiento,
        tecnomecanicaVencimiento: v.tecnomecanicaVencimiento,
        kilometrajeActual: v.kilometrajeActual,
        totalInspecciones: v.inspecciones?.length || 0,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /vehiculos error:', error);
    return res.status(500).json({ error: 'Error al consultar vehículos.' });
  }
});

router.post('/vehiculos', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { placa, marca, modelo, tipo, conductorNombre, conductorCedula, soatVencimiento, tecnomecanicaVencimiento, kilometrajeActual } = req.body;

    if (!placa || !marca || !soatVencimiento) {
      return res.status(400).json({ error: 'placa, marca y soatVencimiento son campos requeridos.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let v = await SgsstVehicleData.findOne({ placa: placa.trim().toUpperCase() });
    if (v) {
      if (conductorNombre) v.conductorNombre = conductorNombre;
      if (soatVencimiento) v.soatVencimiento = soatVencimiento;
      if (tecnomecanicaVencimiento) v.tecnomecanicaVencimiento = tecnomecanicaVencimiento;
      if (kilometrajeActual) v.kilometrajeActual = Number(kilometrajeActual);
      await v.save();
      return res.json({ exito: true, mensaje: `Vehículo con placa ${v.placa} actualizado.` });
    }

    v = new SgsstVehicleData({
      user: userId,
      companyId,
      placa: placa.trim().toUpperCase(),
      marca,
      modelo: modelo || '',
      tipo: tipo || 'Automóvil',
      conductorId: conductorCedula || 'PENDIENTE',
      conductorNombre: conductorNombre || 'Conductor asignado',
      soatVencimiento,
      tecnomecanicaVencimiento: tecnomecanicaVencimiento || '',
      kilometrajeActual: Number(kilometrajeActual) || 0,
      inspecciones: [],
    });
    await v.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Vehículo con placa ${v.placa} registrado en la flota.`,
      vehiculoId: v._id.toString(),
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /vehiculos error:', error);
    return res.status(500).json({ error: 'Error al registrar vehículo.' });
  }
});

// ─── 12. ELEMENTOS DE PROTECCIÓN PERSONAL (EPP) ────────────────────────────

router.get('/epp', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const registros = await SgsstEppData.find({ $or: [{ companyId }, { user: userId }] }).lean();
    return res.json({
      totalTrabajadoresConEpp: registros.length,
      registros: registros.map((r) => ({
        trabajador: r.nombreTrabajador,
        documento: r.documento,
        cargo: r.cargo,
        entregas: r.entregas || [],
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /epp error:', error);
    return res.status(500).json({ error: 'Error al consultar EPP.' });
  }
});

router.post('/epp', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { documento, nombreTrabajador, cargo, nombreEpp, tipo, cantidad, fechaEntrega, fechaVencimiento, serial, marca } = req.body;

    if (!documento || !nombreTrabajador || !nombreEpp) {
      return res.status(400).json({ error: 'documento, nombreTrabajador y nombreEpp son requeridos.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await SgsstEppData.findOne({ documento, $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new SgsstEppData({
        user: userId,
        companyId,
        workerId: documento,
        documento,
        nombreTrabajador,
        cargo: cargo || '',
        entregas: [],
      });
    }

    const nuevoItem = {
      id: `epp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      nombre: nombreEpp.trim(),
      tipo: tipo || 'Regular',
      cantidad: Number(cantidad) || 1,
      fechaEntrega: fechaEntrega || new Date().toISOString().split('T')[0],
      fechaVencimiento: fechaVencimiento || '',
      estado: 'Entregado',
      marca: marca || '',
      serial: serial || '',
    };

    doc.entregas.push(nuevoItem);
    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Entrega de EPP "${nombreEpp}" registrada para ${nombreTrabajador}.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /epp error:', error);
    return res.status(500).json({ error: 'Error al registrar entrega de EPP.' });
  }
});

// ─── 13. REPORTES DE ACTOS Y CONDICIONES INSEGURAS ──────────────────────────

router.get('/actos-condiciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const doc = await ReporteActosData.findOne({ $or: [{ companyId }, { user: userId }] }).lean();
    return res.json({
      totalReportes: doc?.inboxPublico?.length || 0,
      reportes: doc?.inboxPublico || [],
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /actos-condiciones error:', error);
    return res.status(500).json({ error: 'Error al consultar actos y condiciones.' });
  }
});

router.post('/actos-condiciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipoReporte, sede, area, descripcion, reportadoPor, nivelRiesgo, accionInmediata } = req.body;

    if (!descripcion) {
      return res.status(400).json({ error: 'descripcion del acto o condición es obligatoria.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await ReporteActosData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new ReporteActosData({
        user: userId,
        companyId,
        inboxPublico: [],
      });
    }

    const nuevoReporte = {
      id: new mongoose.Types.ObjectId().toString(),
      trabajador: {
        nombre: reportadoPor || 'Inspector / Asistente Antigravity',
        cedula: 'N/A',
        cargo: 'Reporte Preventivo',
      },
      data: {
        tipo: tipoReporte || 'Condición Insegura',
        sede: sede || 'Sede Principal',
        area: area || 'Operativa',
        descripcion: descripcion.trim(),
        nivelRiesgo: nivelRiesgo || 'Medio',
        accionInmediata: accionInmediata || 'Reportado para inspección',
        fecha: new Date().toISOString(),
      },
      esTercero: false,
      createdAt: new Date(),
    };

    doc.inboxPublico.push(nuevoReporte);
    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: 'Reporte preventivo de acto/condición registrado con éxito.',
      reporteId: nuevoReporte.id,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /actos-condiciones error:', error);
    return res.status(500).json({ error: 'Error al crear reporte de acto o condición.' });
  }
});

// ─── 14. PERFILES DE CARGO SST ─────────────────────────────────────────────

router.get('/perfiles-cargo', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const doc = await PerfilCargoData.findOne({ $or: [{ companyId }, { user: userId }] }).lean();
    return res.json({
      totalPerfiles: doc?.perfilesList?.length || 0,
      perfiles: doc?.perfilesList || [],
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /perfiles-cargo error:', error);
    return res.status(500).json({ error: 'Error al consultar perfiles de cargo.' });
  }
});

router.post('/perfiles-cargo', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cargo, area, misionCargo, responsabilidadesSST, eppRequeridos, factoresRiesgo } = req.body;

    if (!cargo) {
      return res.status(400).json({ error: 'cargo es requerido.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await PerfilCargoData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new PerfilCargoData({
        user: userId,
        companyId,
        perfilesList: [],
      });
    }

    let existing = doc.perfilesList.find((p) => p.cargo?.toLowerCase() === cargo.toLowerCase());
    if (existing) {
      if (area) existing.area = area;
      if (misionCargo) existing.misionCargo = misionCargo;
      if (responsabilidadesSST) existing.responsabilidadesSST = responsabilidadesSST;
      if (eppRequeridos) existing.eppRequeridos = eppRequeridos;
      if (factoresRiesgo) existing.factoresRiesgo = factoresRiesgo;
    } else {
      doc.perfilesList.push({
        id: `perfil_${Date.now()}`,
        cargo: cargo.trim(),
        area: area || 'Operaciones',
        misionCargo: misionCargo || '',
        responsabilidadesSST: responsabilidadesSST || 'Cumplir normas SST y usar EPP',
        eppRequeridos: Array.isArray(eppRequeridos) ? eppRequeridos : [],
        factoresRiesgo: Array.isArray(factoresRiesgo) ? factoresRiesgo : [],
      });
    }

    doc.markModified('perfilesList');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: `Perfil para el cargo "${cargo}" guardado con éxito.`,
      totalPerfiles: doc.perfilesList.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /perfiles-cargo error:', error);
    return res.status(500).json({ error: 'Error al guardar perfil de cargo.' });
  }
});

// ─── 15. CASOS ATEL (ACCIDENTES E INVESTIGACIONES) ──────────────────────────

router.get('/atel', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const casos = await InvestigacionAtelData.find({ $or: [{ companyId }, { user: userId }] }).lean();
    return res.json({
      totalCasos: casos.length,
      casos: casos.map((c) => ({
        id: c.id,
        datos: c.formData || {},
        equipoInvestigador: c.equipoList || [],
        testigos: c.testigosList || [],
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /atel error:', error);
    return res.status(500).json({ error: 'Error al consultar investigaciones ATEL.' });
  }
});

router.post('/atel', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipoEvento, nombreTrabajador, cedula, fechaAccidente, descripcionAccidente, severidad, parteCuerpoAfectada, accionesInmediatas } = req.body;

    if (!nombreTrabajador || !descripcionAccidente) {
      return res.status(400).json({ error: 'nombreTrabajador y descripcionAccidente son campos requeridos.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const nuevoCaso = new InvestigacionAtelData({
      user: userId,
      companyId,
      formData: {
        tipoEvento: tipoEvento || 'Accidente de Trabajo',
        nombreTrabajador,
        cedula: cedula || 'N/A',
        fechaAccidente: fechaAccidente || new Date().toISOString().split('T')[0],
        descripcionAccidente: descripcionAccidente.trim(),
        severidad: severidad || 'Leve',
        parteCuerpoAfectada: parteCuerpoAfectada || 'No especificada',
        accionesInmediatas: accionesInmediatas || 'Atención en primeros auxilios',
      },
    });

    await nuevoCaso.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Caso ATEL registrado con éxito para ${nombreTrabajador}.`,
      casoId: nuevoCaso.id,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /atel error:', error);
    return res.status(500).json({ error: 'Error al registrar caso ATEL.' });
  }
});

// ─── 16. PROGRAMA DE CAPACITACIONES Y CURSOS LMS ────────────────────────────

router.get('/capacitaciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const [prog, cursos] = await Promise.all([
      ProgramaCapacitacionesData.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      Course.find({ isPublished: true }).select('title description category duration lessons').lean().catch(() => []),
    ]);

    return res.json({
      sesionesCronograma: prog?.sesiones || [],
      cursosLmsDisponibles: cursos.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        description: c.description || '',
        totalLecciones: c.lessons?.length || 0,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /capacitaciones error:', error);
    return res.status(500).json({ error: 'Error al consultar capacitaciones.' });
  }
});

router.post('/capacitaciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tema, fecha, hora, duracion, responsable, descripcion } = req.body;

    if (!tema || !fecha) {
      return res.status(400).json({ error: 'tema y fecha son requeridos.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await ProgramaCapacitacionesData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new ProgramaCapacitacionesData({
        user: userId,
        companyId,
        sesiones: [],
      });
    }

    const nuevaSesion = {
      id: `cap_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      tema: tema.trim(),
      fecha,
      hora: hora || '08:00',
      duracion: duracion || '1 hora',
      responsable: responsable || 'Capacitador SST',
      descripcion: descripcion || '',
      estado: 'Programada',
      trabajadoresRegistrados: [],
    };

    doc.sesiones.push(nuevaSesion);
    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Capacitación sobre "${tema}" programada para el ${fecha}.`,
      sesionId: nuevaSesion.id,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /capacitaciones error:', error);
    return res.status(500).json({ error: 'Error al programar capacitación.' });
  }
});

// ─── 17. AUDITORÍAS INTERNAS Y PLANES DE ACCIÓN ────────────────────────────

router.get('/auditorias', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const doc = await AuditoriaData.findOne({ $or: [{ companyId }, { user: userId }] }).lean();
    if (!doc) {
      return res.json({
        evaluado: false,
        mensaje: 'No hay auditorías registradas en este período.',
        hallazgos: [],
      });
    }

    return res.json({
      evaluado: true,
      score: doc.score,
      compliancePercentage: doc.compliancePercentage,
      reviewerInfo: doc.reviewerInfo || {},
      hallazgos: doc.statusData || [],
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /auditorias error:', error);
    return res.status(500).json({ error: 'Error al consultar auditorías.' });
  }
});

router.post('/auditorias', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { codigo, hallazgo, tipo, accionPropuesta, responsable, fechaCompromiso } = req.body;

    if (!hallazgo) {
      return res.status(400).json({ error: 'hallazgo es obligatorio.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await AuditoriaData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new AuditoriaData({
        user: userId,
        companyId,
        statusData: [],
      });
    }

    const nuevoHallazgo = {
      itemId: `aud_${Date.now()}`,
      code: codigo || 'NC-01',
      name: tipo || 'No Conformidad Menor',
      description: hallazgo.trim(),
      observation: accionPropuesta || 'Plan de acción formulado',
      status: 'no_cumple',
      responsable: responsable || 'Líder del Proceso',
      fechaCompromiso: fechaCompromiso || 'En 30 días',
    };

    doc.statusData.push(nuevoHallazgo);
    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: 'Hallazgo de auditoría y plan de acción registrados con éxito.',
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /auditorias error:', error);
    return res.status(500).json({ error: 'Error al registrar hallazgo de auditoría.' });
  }
});

// ─── 18. AGENTES Y AUTOMATIZACIONES ────────────────────────────────────────

router.get('/agentes-automatizaciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const Agent = mongoose.models.Agent;

    const [agentes, automations] = await Promise.all([
      Agent ? Agent.find({ author: userId }).select('id name description avatar model').lean() : [],
      Automation.find({ user: userId }).lean(),
    ]);

    return res.json({
      totalAgentes: agentes.length,
      agentes: agentes.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description || '',
      })),
      totalAutomatizaciones: automations.length,
      automatizaciones: automations.map((au) => ({
        id: au._id.toString(),
        name: au.name,
        agentName: au.agentName,
        scheduleType: au.scheduleType,
        isEnabled: au.isEnabled,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /agentes-automatizaciones error:', error);
    return res.status(500).json({ error: 'Error al consultar agentes y automatizaciones.' });
  }
});

router.post('/agentes-automatizaciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, agentId, agentName, prompt, scheduleType, scheduleConfig } = req.body;

    if (!name || !agentId || !prompt) {
      return res.status(400).json({ error: 'name, agentId y prompt son obligatorios.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id?.toString() || userId;

    const auto = new Automation({
      user: userId,
      companyId,
      name: name.trim(),
      agentId,
      agentName: agentName || 'Agente Autónomo',
      prompt: prompt.trim(),
      scheduleType: scheduleType || 'daily',
      scheduleConfig: scheduleConfig || { hour: 8 },
      isEnabled: true,
    });

    await auto.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Automatización "${name}" programada con éxito para el agente ${agentName || agentId}.`,
      automatizacionId: auto._id.toString(),
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /agentes-automatizaciones error:', error);
    return res.status(500).json({ error: 'Error al programar automatización.' });
  }
});

// ─── 19. CONVERSACIONES Y MENSAJES DE CHAT ──────────────────────────────────

router.get('/conversaciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const Conversation = mongoose.models.Conversation;
    if (!Conversation) {
      return res.json({ conversaciones: [] });
    }

    const convos = await Conversation.find({ user: userId })
      .sort({ updatedAt: -1 })
      .limit(30)
      .select('conversationId title createdAt updatedAt')
      .lean();

    return res.json({
      total: convos.length,
      conversaciones: convos.map((c) => ({
        conversationId: c.conversationId,
        title: c.title,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /conversaciones error:', error);
    return res.status(500).json({ error: 'Error al consultar conversaciones.' });
  }
});

router.get('/mensajes', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.query;

    if (!conversationId) {
      return res.status(400).json({ error: 'Se requiere el parámetro conversationId.' });
    }

    const Message = mongoose.models.Message;
    if (!Message) {
      return res.json({ mensajes: [] });
    }

    const mensajes = await Message.find({ conversationId, user: userId })
      .sort({ createdAt: 1 })
      .limit(50)
      .select('messageId sender text createdAt isCreatedByUser')
      .lean();

    return res.json({
      total: mensajes.length,
      mensajes: mensajes.map((m) => ({
        sender: m.sender,
        text: m.text,
        fecha: m.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /mensajes error:', error);
    return res.status(500).json({ error: 'Error al consultar mensajes.' });
  }
});

// ─── 20. ARCHIVOS Y DOCUMENTOS DEL USUARIO ─────────────────────────────────

router.get('/archivos', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const File = mongoose.models.File;
    if (!File) {
      return res.json({ archivos: [] });
    }

    const files = await File.find({ user: userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('file_id filename bytes type createdAt')
      .lean();

    return res.json({
      total: files.length,
      archivos: files.map((f) => ({
        fileId: f.file_id,
        nombre: f.filename,
        tamanoBytes: f.bytes,
        tipo: f.type,
        fecha: f.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /archivos error:', error);
    return res.status(500).json({ error: 'Error al consultar archivos.' });
  }
});

module.exports = router;
