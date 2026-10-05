const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireApiKeyOrJwt } = require('~/server/middleware/requireApiKeyAuth');
const CompanyInfo = require('~/models/CompanyInfo');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
const PESVWorkspaceSession = require('~/models/PESVWorkspaceSession');
const KanbanTask = require('~/models/KanbanTask');
const SgsstWorker = require('~/models/SgsstWorker');
const { setMemory } = require('~/models');
const { Tokenizer } = require('@librechat/api');
const { logger } = require('~/config');

/**
 * Helper to sync AI memory for company profile
 */
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

/**
 * GET /api/mcp-bridge/profile
 * Consulta el perfil de empresa activo del usuario.
 */
router.get('/profile', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    let company = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
    if (!company) {
      company = await CompanyInfo.findOne({ user: userId }).lean();
    }

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
        generalActivities: company.generalActivities || '',
        sedes: Array.isArray(company.sedes) ? company.sedes : [],
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /profile error:', error);
    return res.status(500).json({ error: 'Error al consultar el perfil de empresa.' });
  }
});

/**
 * POST /api/mcp-bridge/profile
 * Actualiza o alimenta campos de la empresa activa del usuario.
 */
router.post('/profile', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body || {};

    let company = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!company) {
      company = await CompanyInfo.findOne({ user: userId });
    }

    if (!company) {
      // Crear nueva empresa si no existía ninguna
      company = new CompanyInfo({
        user: userId,
        isActive: true,
        ...updateData,
      });
      await company.save();
    } else {
      // Actualizar campos permitidos
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

    // Sincronizar memoria para todos los agentes de WAPPY
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

/**
 * GET /api/mcp-bridge/gtc45
 * Consulta la matriz GTC-45 oficial del usuario con filtros opcionales.
 */
router.get('/gtc45', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { proceso, cargo, peligro } = req.query;

    const company = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
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

/**
 * POST /api/mcp-bridge/gtc45
 * Alimenta e inserta riesgos evaluados en la matriz GTC-45 oficial del usuario.
 */
router.post('/gtc45', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { riesgos } = req.body;

    if (!riesgos || !Array.isArray(riesgos) || riesgos.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo "riesgos" con al menos un riesgo.' });
    }

    const company = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
    const companyId = company?._id;
    const officialConvoId = `official-${companyId || userId}`;

    let session = await GTC45WorkspaceSession.findOne({
      $or: [
        { conversationId: officialConvoId },
        { user: userId, isOfficial: true },
      ],
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

/**
 * GET /api/mcp-bridge/pesv
 * Consulta la matriz oficial PESV.
 */
router.get('/pesv', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
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

/**
 * POST /api/mcp-bridge/pesv
 * Alimenta riesgos o acciones viales a la matriz PESV oficial.
 */
router.post('/pesv', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { riesgos } = req.body;

    if (!riesgos || !Array.isArray(riesgos) || riesgos.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo "riesgos" para la matriz PESV.' });
    }

    const company = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
    const companyId = company?._id;
    const officialConvoId = `official-${companyId || userId}`;

    let session = await PESVWorkspaceSession.findOne({
      $or: [
        { conversationId: officialConvoId },
        { user: userId, isOfficial: true },
      ],
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

/**
 * GET /api/mcp-bridge/workers
 * Consulta trabajadores del perfil sociodemográfico.
 */
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

/**
 * POST /api/mcp-bridge/workers
 * Agrega o actualiza un trabajador en el perfil sociodemográfico.
 */
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

/**
 * GET /api/mcp-bridge/tasks
 * Consulta actividades / tareas del cronograma SST.
 */
router.get('/tasks', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await KanbanTask.find({ user: userId })
      .sort({ dueDate: 1 })
      .lean();

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

/**
 * POST /api/mcp-bridge/tasks
 * Crea una actividad o tarea en el cronograma / plan de trabajo anual de SST.
 */
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

module.exports = router;
