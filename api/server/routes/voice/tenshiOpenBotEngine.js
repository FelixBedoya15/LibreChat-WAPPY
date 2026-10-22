const TenshiPendingAction = require('~/models/TenshiPendingAction');
const TenshiProceduralMemory = require('~/models/TenshiProceduralMemory');
const { logger } = require('~/config');

/**
 * Catálogo de herramientas críticas / destructivas sujetas a Gobernanza Human-in-the-Loop (HITL).
 * Antes de modificar o retirar registros sensibles en base de datos, se genera una tarjeta
 * interactiva con estado 'pendiente_aprobacion' para que el usuario autorice o rechace en 1 clic.
 */
const GOVERNED_TOOLS_META = {
  wappy_retirar_trabajador: {
    title: 'Retirar Colaborador de Nómina SG-SST',
    moduleLabel: 'Huella Biocéntrica • Nómina',
    riskLevel: 'high',
    describe: (args) => {
      const target = args.nombre || args.idOrCedula || args.id || args.cedula || 'Colaborador';
      const motivo = args.motivoRetiro || 'Retiro laboral registrado por el responsable SST';
      return `Se solicita pasar a estado RETIRADO a "${target}" (Motivo: ${motivo}). Su historia clínica y ocupacional se conservará por 20 años conforme al Decreto 1072 de 2015.`;
    },
  },
  wappy_eliminar_trabajador: {
    title: 'Retirar Colaborador de Nómina SG-SST',
    moduleLabel: 'Huella Biocéntrica • Nómina',
    riskLevel: 'high',
    describe: (args) => {
      const target = args.nombre || args.idOrCedula || args.id || args.cedula || 'Colaborador';
      return `Se solicita desvincular y pasar a pestaña Retirados a "${target}" conservando trazabilidad normativa.`;
    },
  },
  wappy_eliminar_riesgo_gtc45: {
    title: 'Eliminar Peligro de Matriz IPEVR GTC-45',
    moduleLabel: 'Hito 1 • Matriz GTC-45',
    riskLevel: 'high',
    describe: (args) => `Se solicita eliminar el registro de peligro ID "${args.id || 'seleccionado'}" de la Matriz Oficial GTC-45.`,
  },
  wappy_eliminar_riesgo_pesv: {
    title: 'Eliminar Riesgo Vial de Matriz PESV',
    moduleLabel: 'Hito 1 • Seguridad Vial PESV',
    riskLevel: 'high',
    describe: (args) => `Se solicita eliminar el riesgo vial ID "${args.id || 'seleccionado'}" de la Matriz PESV (Res. 20223040040595).`,
  },
  wappy_eliminar_requisito_legal: {
    title: 'Eliminar Requisito de Matriz Legal',
    moduleLabel: 'Hito 1 • Matriz Legal',
    riskLevel: 'medium',
    describe: (args) => `Se solicita eliminar la norma o requisito legal ID "${args.id || 'seleccionado'}" de la Matriz Legal corporativa.`,
  },
  wappy_eliminar_producto_quimico: {
    title: 'Eliminar Sustancia del Inventario Químico SGA',
    moduleLabel: 'Hito 4 • Riesgo Químico SGA',
    riskLevel: 'medium',
    describe: (args) => `Se solicita eliminar el producto químico ID "${args.id || 'seleccionado'}" del inventario oficial SGA.`,
  },
  wappy_eliminar_vehiculo: {
    title: 'Eliminar Vehículo de Flota PESV',
    moduleLabel: 'Hito 4 • Parque Automotor PESV',
    riskLevel: 'medium',
    describe: (args) => `Se solicita dar de baja el vehículo ID "${args.id || 'seleccionado'}" del registro de flota PESV.`,
  },
  wappy_eliminar_caso_atel: {
    title: 'Eliminar Registro de Caso ATEL',
    moduleLabel: 'Hito 7 • Investigación ATEL',
    riskLevel: 'high',
    describe: (args) => `Se solicita eliminar el expediente de accidente/enfermedad laboral ID "${args.id || 'seleccionado'}".`,
  },
  wappy_eliminar_tarea_cronograma: {
    title: 'Eliminar Actividad del Cronograma Anual SST',
    moduleLabel: 'Centro de Control • Kanban SST',
    riskLevel: 'medium',
    describe: (args) => `Se solicita eliminar la tarea programada ID "${args.id || args.taskId || 'seleccionada'}" del Plan de Trabajo Anual.`,
  },
  wappy_eliminar_capacitacion: {
    title: 'Eliminar Capacitación del Programa Anual',
    moduleLabel: 'Hito 5 • Capacitaciones SST',
    riskLevel: 'medium',
    describe: (args) => `Se solicita eliminar la sesión de capacitación ID "${args.id || 'seleccionada'}".`,
  },
  wappy_eliminar_hallazgo_auditoria: {
    title: 'Eliminar Hallazgo de Auditoría / ACPM',
    moduleLabel: 'Hito 7 • Auditoría y Mejora',
    riskLevel: 'medium',
    describe: (args) => `Se solicita eliminar el hallazgo de auditoría ID "${args.id || 'seleccionado'}".`,
  },
  wappy_eliminar_automatizacion: {
    title: 'Eliminar Automatización Programada de Agente',
    moduleLabel: 'Automatizaciones IA',
    riskLevel: 'medium',
    describe: (args) => `Se solicita eliminar la tarea automática recurrente ID "${args.id || 'seleccionada'}".`,
  },
};

function isGovernedTool(toolName, args = {}) {
  if (!toolName) return false;
  if (args && args._hitlApproved === true) return false;
  const cleanName = String(toolName).trim();
  return Boolean(GOVERNED_TOOLS_META[cleanName]);
}

/**
 * Crea un registro TenshiPendingAction en estado 'pendiente_aprobacion'
 * y retorna el widget interactivo para que el usuario apruebe o rechace en el chat.
 */
async function stageGovernedAction(toolName, args = {}, userId, companyId = null) {
  const cleanName = String(toolName).trim();
  const meta = GOVERNED_TOOLS_META[cleanName] || {
    title: `Confirmar Operación Crítica (${cleanName})`,
    moduleLabel: 'Gobernanza SG-SST',
    riskLevel: 'high',
    describe: () => `Se solicita autorización para ejecutar ${cleanName}.`,
  };

  const summary = meta.describe(args || {});
  const pendingDoc = await TenshiPendingAction.create({
    user: userId,
    companyId: companyId || undefined,
    toolName: cleanName,
    args: args || {},
    title: meta.title,
    summary,
    moduleLabel: meta.moduleLabel,
    riskLevel: meta.riskLevel,
    status: 'pendiente_aprobacion',
  });

  const widget = {
    widgetType: 'hitl_approval',
    title: meta.title,
    subtitle: summary,
    status: 'pendiente_aprobacion',
    actionId: String(pendingDoc._id),
    data: {
      actionId: String(pendingDoc._id),
      toolName: cleanName,
      args: args || {},
      summary,
      riskLevel: meta.riskLevel,
      module: meta.moduleLabel,
      moduleLabel: meta.moduleLabel,
      createdAt: pendingDoc.createdAt,
    },
  };

  const instruccionIa = `[MODO GOBERNANZA HUMAN-IN-THE-LOOP ACTIVADO]: La acción "${meta.title}" ha quedado en estado PENDIENTE DE APROBACIÓN y se ha desplegado una tarjeta interactiva en el chat del usuario con los botones "Autorizar y Ejecutar" y "Rechazar". Indícale amablemente al usuario que por seguridad y gobernanza del SG-SST le acabas de presentar la tarjeta de confirmación en pantalla para que la autorice con un clic.`;

  const toolResponse = {
    success: true,
    exito: true,
    requiresHumanApproval: true,
    status: 'pendiente_aprobacion',
    estado: 'pendiente_aprobacion',
    actionId: String(pendingDoc._id),
    title: meta.title,
    summary,
    mensaje: instruccionIa,
    instruccion_ia: instruccionIa,
  };

  return {
    staged: true,
    exito: true,
    estado: 'pendiente_aprobacion',
    actionId: String(pendingDoc._id),
    mensaje: summary,
    instruccion_ia: instruccionIa,
    pendingDoc,
    widget,
    toolResponse,
  };
}

/**
 * Construye automáticamente un Widget de Generative UI (AG-UI) cuando Tenshi ejecuta herramientas
 * de consulta o interactivas. El renderizado ocurre 100% en React (0 MB de sobrecarga en VPS).
 */
function buildGenerativeWidgetForTool(toolName, args = {}, rawResult = null) {
  if (!toolName) return null;
  const cleanName = String(toolName).trim();

  // 1. Widget Interactivo explícito invocado por Tenshi (Calculadora GTC-45, Checklist, Simulador)
  if (cleanName === 'wappy_renderizar_widget_interactivo') {
    const rawItems = Array.isArray(args.items) ? args.items : [];
    const normalizedItems = rawItems.map((it, idx) =>
      typeof it === 'string'
        ? { id: `chk-${idx + 1}`, label: it, checked: false }
        : {
            id: String(it.id || `chk-${idx + 1}`),
            label: String(it.label || it.texto || ''),
            checked: Boolean(it.checked),
          }
    );
    const defaultChecklist = [
      { id: 'chk-1', label: 'Verificar curso y certificado vigente según normatividad aplicable', checked: false },
      { id: 'chk-2', label: 'Inspección preoperacional de EPP y sistemas de protección', checked: false },
      { id: 'chk-3', label: 'Identificación de peligros en el área y socialización de ATS', checked: false },
      { id: 'chk-4', label: 'Firma de permiso de trabajo por responsable y coordinador SST', checked: false },
    ];
    const ndVal = typeof args.nd === 'number' ? args.nd : Number(args.nd) || 6;
    const neVal = typeof args.ne === 'number' ? args.ne : Number(args.ne) || 3;
    const ncVal = typeof args.nc === 'number' ? args.nc : Number(args.nc) || 25;

    return {
      widgetType: args.tipo_widget || args.widget_type || 'risk_calculator',
      title: args.titulo || args.title || 'Simulador Técnico Interactivo SG-SST',
      subtitle: args.subtitulo || args.subtitle || 'Ajusta los parámetros en tiempo real directamente en el chat',
      status: 'ready',
      data: {
        ...(args.datos || {}),
        peligro: args.peligro || 'Peligro Biomecánico / Operativo',
        proceso: args.proceso || 'Operaciones Generales',
        nd: ndVal,
        ne: neVal,
        nc: ncVal,
        ndInicial: ndVal,
        neInicial: neVal,
        ncInicial: ncVal,
        items: normalizedItems.length > 0 ? normalizedItems : defaultChecklist,
      },
    };
  }

  if (!rawResult) return null;
  let parsed = rawResult;
  if (typeof rawResult === 'string') {
    try {
      parsed = JSON.parse(rawResult);
    } catch (_) {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object' || parsed.error) return null;

  // 2. Diagnóstico 360° -> Tarjeta Interactiva KPI 360
  if (cleanName === 'wappy_resumen_general_360') {
    const emp = parsed.empresa || parsed.company || {};
    const metricas = parsed.indicadores || parsed.metricas || parsed.resumen || parsed;
    const score0312 =
      Number(
        metricas.puntajeDiagnostico0312 ??
          metricas.cumplimiento0312 ??
          parsed.puntaje0312 ??
          0
      ) || 0;
    const trabActivos =
      metricas.trabajadoresActivos ??
      metricas.totalTrabajadores ??
      emp.workerCount ??
      parsed.totalTrabajadores ??
      0;
    const peligrosCount =
      metricas.totalRiesgosGTC45 ??
      metricas.totalRiesgosGtc45 ??
      metricas.riesgosIdentificados ??
      (Array.isArray(parsed.gtc45) ? parsed.gtc45.length : 0);

    return {
      widgetType: 'kpi_360',
      title: `Tablero Ejecutivo 360° • ${emp.companyName || emp.nombre || 'Empresa Activa'}`,
      subtitle: `Cumplimiento Res. 0312: ${score0312}% • Riesgo ${emp.riskLevel || emp.nivelRiesgo || 'I'}`,
      status: 'ready',
      data: {
        companyName: emp.companyName || emp.nombre || 'Empresa Activa',
        nit: emp.nit || 'N/A',
        arl: emp.arl || 'N/A',
        riskLevel: emp.riskLevel || emp.nivelRiesgo || 'I',
        cumplimiento0312: score0312,
        puntaje0312: score0312,
        trabajadoresActivos: trabActivos,
        trabajadores: trabActivos,
        peligrosGtc45: peligrosCount,
        riesgosGtc45: peligrosCount,
        riesgosCriticos: metricas.riesgosCriticos ?? 0,
        tareasCompletadas: metricas.tareasCompletadas ?? 0,
        tareasTotales:
          metricas.totalTareas ??
          metricas.tareasPendientes ??
          (Array.isArray(parsed.tareas) ? parsed.tareas.length : 0),
        tareasPendientes:
          metricas.tareasPendientes ??
          (Array.isArray(parsed.tareas) ? parsed.tareas.length : 0),
        casosAtel: metricas.casosAtel ?? 0,
      },
    };
  }

  // 3. Consulta de Trabajadores -> Widget de Censo de Colaboradores
  if (cleanName === 'wappy_consultar_trabajadores') {
    const workers = Array.isArray(parsed.trabajadores)
      ? parsed.trabajadores
      : Array.isArray(parsed.workers)
      ? parsed.workers
      : [];
    const compactWorkers = workers.slice(0, 100).map((w, idx) => {
      const fullName =
        w.nombre_completo ||
        w.nombreCompleto ||
        w.nombre ||
        w.name ||
        `Colaborador ${idx + 1}`;
      const docId = w.cedula || w.numeroIdentificacion || w.identificacion || w.documento || 'S/N';
      const cargo = w.cargo || w.position || 'Operativo';
      const area = w.area || w.areaTrabajo || w.proceso || 'Operaciones';
      const eps = w.eps || '';
      const status = w.estadoLaboral || w.estado || w.status || 'Activo';
      return {
        id: String(w._id || w.id || docId || idx),
        index: idx + 1,
        name: fullName,
        nombre: fullName,
        documentId: docId,
        cedula: docId,
        position: cargo,
        cargo,
        area,
        eps,
        status,
        estado: status,
      };
    });
    return {
      widgetType: 'worker_census',
      title: 'Nómina y Censo de Colaboradores (Huella Biocéntrica)',
      subtitle: parsed.resumenCenso || `Total registrados: ${parsed.totalRegistrados ?? workers.length}`,
      status: 'ready',
      data: {
        totalRegistrados: parsed.totalRegistrados ?? workers.length,
        totalActivos: parsed.totalActivos ?? workers.filter((w) => !/retirado/i.test(w.estadoLaboral || w.estado || '')).length,
        totalRetirados: parsed.totalRetirados ?? workers.filter((w) => /retirado/i.test(w.estadoLaboral || w.estado || '')).length,
        workers: compactWorkers,
      },
    };
  }

  return null;
}

/**
 * Gestiona la Memoria Procedural y de Hábitos de la empresa (Crear, Listar, Eliminar, Alternar).
 */
async function manageProceduralMemory(args = {}, userId, companyId = null, companyName = '') {
  const accion = String(args.accion || 'listar').toLowerCase().trim();

  if (accion === 'guardar' || accion === 'registrar' || accion === 'crear' || accion === 'registrar_habito') {
    const trigger = String(
      args.disparador || args.trigger || args.cuando || args.contexto || 'Regla Operativa General'
    ).trim();
    const rule = String(args.regla || args.habito || args.rule || args.valor || '').trim();
    const category = args.categoria || args.category || 'habito_empresa';

    if (!rule) {
      return {
        exito: false,
        mensaje: 'Se requiere especificar la regla o hábito operativo a recordar.',
        result: { success: false, error: 'Se requiere especificar la regla o hábito operativo a recordar.' },
        widget: null,
      };
    }

    // Evitar duplicados exactos actualizando si ya existe el mismo trigger
    let doc = await TenshiProceduralMemory.findOne({
      user: userId,
      trigger: { $regex: new RegExp(`^${trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (doc) {
      doc.rule = rule;
      doc.category = category;
      doc.isActive = true;
      if (companyId) doc.companyId = companyId;
      if (companyName) doc.companyName = companyName;
      await doc.save();
    } else {
      doc = await TenshiProceduralMemory.create({
        user: userId,
        companyId: companyId || undefined,
        companyName: companyName || '',
        category,
        trigger,
        rule,
        isActive: true,
      });
    }

    const allHabits = await TenshiProceduralMemory.find({ user: userId, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(12)
      .lean();

    const mappedItems = allHabits.map((h) => ({
      id: String(h._id),
      _id: String(h._id),
      category: h.category,
      trigger: h.trigger,
      rule: h.rule,
      isActive: h.isActive,
    }));

    const msg = `Hábito procedimental registrado permanentemente: Cuando "${trigger}" -> "${rule}". Tenshi aplicará esta regla automáticamente en todas las sesiones futuras.`;
    const widget = {
      widgetType: 'procedural_memory',
      title: 'Memoria Procedural y Hábitos de la Empresa',
      subtitle: `Hábito registrado: "${trigger}"`,
      status: 'saved',
      data: {
        latestHabit: {
          id: String(doc._id),
          _id: String(doc._id),
          category: doc.category,
          trigger: doc.trigger,
          rule: doc.rule,
        },
        items: mappedItems,
        habits: mappedItems,
      },
    };

    return {
      exito: true,
      mensaje: msg,
      result: {
        success: true,
        mensaje: msg,
        habito: doc,
      },
      widget,
    };
  }

  if (accion === 'eliminar' || accion === 'borrar' || accion === 'eliminar_habito') {
    const idOrTrigger = String(args.id || args.disparador || args.trigger || args.clave || '').trim();
    let deleted = null;
    if (idOrTrigger.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await TenshiProceduralMemory.findOneAndDelete({ _id: idOrTrigger, user: userId });
    } else if (idOrTrigger) {
      const safeRx = new RegExp(idOrTrigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      deleted = await TenshiProceduralMemory.findOneAndDelete({
        user: userId,
        $or: [{ trigger: safeRx }, { rule: safeRx }],
      });
    }

    const remaining = await TenshiProceduralMemory.find({ user: userId, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(12)
      .lean();

    const mappedRemaining = remaining.map((h) => ({
      id: String(h._id),
      _id: String(h._id),
      category: h.category,
      trigger: h.trigger,
      rule: h.rule,
      isActive: h.isActive,
    }));

    const msg = deleted
      ? `Hábito "${deleted.trigger}" eliminado de la memoria procedimental.`
      : `No se encontró un hábito coincidente con "${idOrTrigger}".`;

    return {
      exito: Boolean(deleted),
      mensaje: msg,
      result: {
        success: Boolean(deleted),
        mensaje: msg,
      },
      widget: {
        widgetType: 'procedural_memory',
        title: 'Memoria Procedural y Hábitos de la Empresa',
        subtitle: `${remaining.length} reglas operativas activas`,
        status: 'ready',
        data: {
          items: mappedRemaining,
          habits: mappedRemaining,
        },
      },
    };
  }

  // Listar por defecto
  const habits = await TenshiProceduralMemory.find({ user: userId, isActive: true })
    .sort({ updatedAt: -1 })
    .limit(15)
    .lean();

  const mappedHabits = habits.map((h) => ({
    id: String(h._id),
    _id: String(h._id),
    category: h.category,
    trigger: h.trigger,
    rule: h.rule,
    isActive: h.isActive,
  }));

  const msg =
    habits.length > 0
      ? `Se encontraron ${habits.length} hábitos y reglas procedimentales activas para la empresa.`
      : 'Aún no hay hábitos procedimentales personalizados registrados.';

  return {
    exito: true,
    mensaje: msg,
    result: {
      success: true,
      total: habits.length,
      habitos: mappedHabits,
      mensaje: msg,
    },
    widget: {
      widgetType: 'procedural_memory',
      title: 'Memoria Procedural y Hábitos Operativos',
      subtitle: `${habits.length} reglas aprendidas en esta organización`,
      status: 'ready',
      data: {
        items: mappedHabits,
        habits: mappedHabits,
      },
    },
  };
}

/**
 * Construye el bloque de texto ligero de Memoria Procedural para inyectar en el System Prompt
 * de Tenshi Chat y Tenshi Voice (acotado para mantener 0 impacto de latencia en Gemini Live).
 */
async function getProceduralMemoryPromptBlock(userId, companyId = null, maxItems = 10) {
  try {
    if (!userId) return '';
    const query = { user: userId, isActive: true };
    if (companyId) {
      query.$or = [{ companyId }, { companyId: { $exists: false } }, { companyId: null }];
    }
    const habits = await TenshiProceduralMemory.find(query)
      .sort({ updatedAt: -1 })
      .limit(maxItems)
      .lean();

    if (!habits || habits.length === 0) return '';

    const lines = habits.map(
      (h, idx) => `  ${idx + 1}. [${(h.category || 'habito').toUpperCase()}] Cuando "${h.trigger}": ${h.rule}`
    );

    return (
      `\n### ⚙️ MEMORIA PROCEDURAL Y HÁBITOS OPERATIVOS DE LA EMPRESA (REGLAS OBLIGATORIAS APRENDIDAS):\n` +
      lines.join('\n') +
      `\n*DIRECTIVA PROCEDURAL*: Aplica siempre estas costumbres, flujos de aprobación y preferencias operativas de la empresa de forma proactiva sin que el usuario tenga que repetírtelas.\n`
    );
  } catch (err) {
    logger.warn('[TenshiOpenBotEngine] Error cargando memoria procedural:', err.message);
    return '';
  }
}

module.exports = {
  GOVERNED_TOOLS_META,
  isGovernedTool,
  stageGovernedAction,
  buildGenerativeWidgetForTool,
  manageProceduralMemory,
  getProceduralMemoryPromptBlock,
};
