const TenshiPendingAction = require('../../../models/TenshiPendingAction');
const TenshiProceduralMemory = require('../../../models/TenshiProceduralMemory');
let logger = console;
try {
  logger = require('../../../config').logger || console;
} catch (_e) {
  logger = console;
}

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

/**
 * Hook de Auto-Aprendizaje de Habilidades y Hábitos Operativos (turn_finalizer en segundo plano).
 * Inspirado en Hermes Agent (Skill & Fact Auto-Synthesis): analiza en < 2ms y con 0 consumo
 * de cuota de API si el mensaje del usuario le enseña a Tenshi una regla permanente de la empresa,
 * flujo entre hitos o preferencia de formato/interfaz, y la guarda automáticamente en
 * TenshiProceduralMemory para que aparezca en /kanban?tab=memoria y se aplique en futuros turnos.
 */
async function autoSynthesizeProceduralRule(userText, userId, companyId = null, companyName = '') {
  try {
    if (!userText || typeof userText !== 'string' || !userId) return null;
    const clean = userText.replace(/\s+/g, ' ').trim();
    if (clean.length < 18 || clean.length > 650) return null;
    // Ignorar preguntas puras o comandos de navegación cortos
    if (clean.endsWith('?') || /^(hola|buenos|buenas|gracias|ok|listo|abre|ve a|navega|mu[eé]strame)\b/i.test(clean)) {
      return null;
    }

    let trigger = '';
    let rule = '';
    let category = 'habito_empresa';

    // Patrón 1: "Siempre que [X], [Y]" / "Cada vez que [X], [Y]" / "Cuando se [X], [Y]"
    const condMatch = clean.match(
      /(?:siempre\s+que|cada\s+vez\s+que|cuando\s+(?:se\s+)?(?:haga|cierre|registre|cree|genere|emita|autorice|firme|eval[uú]e|presente|reporte))\s+([^,.;:]{6,120})[,:;]\s*(.+)/i
    );
    if (condMatch) {
      trigger = condMatch[1].trim();
      rule = condMatch[2].trim();
    }

    // Patrón 2: "Recuerda que (aquí|en nuestra empresa|en la empresa|siempre) [regla]"
    if (!rule) {
      const remMatch = clean.match(
        /(?:recuerda\s+siempre\s+que|recuerda\s+que|ten\s+presente\s+que|ten\s+en\s+cuenta\s+que|no\s+olvides\s+que|por\s+pol[ií]tica\s+interna|de\s+ahora\s+en\s+adelante|en\s+nuestra\s+empresa|aqu[ií]\s+en\s+la\s+(?:empresa|constructora|planta|cl[ií]nica|compa[ñn][ií]a|obra))\s+(.+)/i
      );
      if (remMatch) {
        const body = remMatch[1].trim();
        // Ignorar si es una pregunta sobre el pasado ("recuerda qué fue lo último que hice...")
        if (!/^(fue|hice|hicimos|hablamos|dijiste|dije|est[aá]bamos|ten[ií]a|tengo|ayer|antes|lo\s+[uú]ltimo|cu[aá]l|qu[eé]|qui[eé]n|c[oó]mo|d[oó]nde|cu[aá]ndo)\b/i.test(body)) {
          // Intentar deducir el disparador temático
          if (/altura|permiso/i.test(body)) trigger = 'En permisos y trabajo seguro en alturas';
          else if (/examen|m[eé]dic|emo|ingreso|peri[oó]dico/i.test(body)) trigger = 'En evaluaciones médicas ocupacionales (EMO)';
          else if (/accidente|incidente|atel|furat/i.test(body)) trigger = 'Al reportar o investigar accidentes ATEL';
          else if (/qu[ií]mic|fds|sga|sustancia/i.test(body)) trigger = 'En gestión de sustancias químicas SGA';
          else if (/pesv|veh[ií]culo|vial|conductor/i.test(body)) trigger = 'En controles del Plan Estratégico de Seguridad Vial (PESV)';
          else if (/epp|dotaci[oó]n|casco|botas/i.test(body)) trigger = 'En entrega e inspección de EPP';
          else if (/informe|reporte|acta|formato|canvas|documento|tabla/i.test(body)) trigger = 'Al redactar informes, actas o documentos SG-SST';
          else if (/capacitaci[oó]n|inducci[oó]n|charla/i.test(body)) trigger = 'En programación de capacitaciones e inducciones';
          else trigger = 'Regla operativa corporativa SG-SST';
          rule = body;
        }
      }
    }

    // Patrón 3: "Los [exámenes/permisos/informes/formatos...] aquí (se hacen|los firma|son cada|deben llevar)..."
    if (!rule) {
      const policyMatch = clean.match(
        /\b(los\s+(?:permisos|ex[aá]menes|informes|formatos|reportes|controles|comit[eé]s|simulacros)[^,.;]{3,80}?)\s+(?:aqu[ií]\s+|en\s+la\s+empresa\s+)?((?:solo\s+)?(?:los\s+firma|se\s+realizan|son\s+cada|se\s+hacen\s+cada|deben\s+llevar|exigen|requieren)\s+.+)/i
      );
      if (policyMatch) {
        trigger = `Gestión de ${policyMatch[1].trim()}`;
        rule = `${policyMatch[1].trim()} ${policyMatch[2].trim()}`;
      }
    }

    if (!trigger || !rule || rule.length < 10) return null;

    // Clasificar categoría según las 3 pestañas del Centro de Control (/kanban?tab=memoria)
    if (/canvas|formato|word|excel|html|dise[ñn]o|tabla|encabezado|logo|color|plantilla/i.test(`${trigger} ${rule}`)) {
      category = 'interfaz_canvas';
    } else if (/hito|matriz|kanban|acpm|cronograma|notifica|correo|enviar|autom[aá]tic|vincular|cruzar/i.test(`${trigger} ${rule}`)) {
      category = 'flujo_hitos';
    } else {
      category = 'habito_empresa';
    }

    // Capitalizar primera letra
    trigger = trigger.charAt(0).toUpperCase() + trigger.slice(1).replace(/[.]+$/, '');
    rule = rule.charAt(0).toUpperCase() + rule.slice(1);

    const saved = await manageProceduralMemory(
      { accion: 'guardar', trigger, regla: rule, categoria: category },
      userId,
      companyId,
      companyName
    );
    if (saved?.exito) {
      logger.info(`[Tenshi Auto-Synthesis] Nueva regla procedimental aprendida automáticamente: [${category}] "${trigger}" -> "${rule}"`);
    }
    return saved;
  } catch (err) {
    logger.warn('[Tenshi Auto-Synthesis] Error sintetizando regla procedimental:', err.message);
    return null;
  }
}

/**
 * Búsqueda Instantánea de Historial (< 5ms, 0 tokens de embeddings, ranking tipo BM25 en memoria)
 * sobre conversaciones de Tenshi, mensajes de agentes especialistas e informes SG-SST pasados.
 */
async function searchInstantHistory(args = {}, userId) {
  try {
    const rawQuery = String(args.consulta || args.query || args.termino || args.palabra_clave || '').trim();
    const limit = Math.min(Math.max(parseInt(args.limite || args.limit || '8', 10) || 8, 1), 20);
    if (!rawQuery || !userId) {
      return {
        exito: false,
        mensaje: 'Se requiere especificar una palabra clave, nombre, cédula o tema para buscar en el historial.',
        resultados: [],
      };
    }

    const TenshiMessage = require('~/models/TenshiMessage');
    const { Message, Conversation } = require('~/db/models');

    // Tokenizar términos significativos para ranking tipo BM25
    const terms = rawQuery
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/\s+/)
      .filter((t) => t.length >= 2);

    const escapedFull = rawQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexOr = terms.length > 0
      ? new RegExp(terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i')
      : new RegExp(escapedFull, 'i');

    const [tenshiHits, agentMsgHits, convoHits] = await Promise.all([
      TenshiMessage.find({
        user: userId,
        $or: [{ content: regexOr }, { 'file.title': regexOr }],
      })
        .sort({ createdAt: -1 })
        .limit(25)
        .select('role content file.title createdAt')
        .lean()
        .catch(() => []),
      Message.find({
        user: String(userId),
        text: regexOr,
      })
        .sort({ createdAt: -1 })
        .limit(25)
        .select('sender text conversationId isCreatedByUser createdAt')
        .lean()
        .catch(() => []),
      Conversation.find({
        user: String(userId),
        title: regexOr,
      })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('conversationId title agent_id updatedAt')
        .lean()
        .catch(() => []),
    ]);

    const normText = (str) =>
      String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const scoreDocument = (text, title = '') => {
      const haystack = normText(`${title} ${text}`);
      const normFull = normText(rawQuery);
      let score = 0;
      if (haystack.includes(normFull)) score += 10; // Frase exacta
      for (const term of terms) {
        if (haystack.includes(term)) {
          score += 3;
          if (normText(title).includes(term)) score += 4;
        }
      }
      return score;
    };

    const combined = [];

    for (const tm of tenshiHits) {
      const snippet = String(tm.content || '').replace(/\s+/g, ' ').trim().slice(0, 320);
      const title = tm.file?.title ? `Chat Tenshi • Informe: ${tm.file.title}` : `Chat de Tenshi (${tm.role === 'user' ? 'Usuario' : 'Tenshi'})`;
      combined.push({
        origen: 'Chat de Tenshi',
        titulo: title,
        extracto: snippet,
        fecha: tm.createdAt ? new Date(tm.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'Reciente',
        timestamp: tm.createdAt ? new Date(tm.createdAt).getTime() : 0,
        score: scoreDocument(snippet, title),
      });
    }

    for (const am of agentMsgHits) {
      const snippet = String(am.text || '').replace(/\s+/g, ' ').trim().slice(0, 320);
      const sender = am.isCreatedByUser ? 'Usuario' : (am.sender || 'Agente Especialista');
      const title = `Conversación con ${sender}`;
      combined.push({
        origen: 'Chat de Agentes Especialistas',
        titulo: title,
        conversationId: am.conversationId,
        extracto: snippet,
        fecha: am.createdAt ? new Date(am.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'Reciente',
        timestamp: am.createdAt ? new Date(am.createdAt).getTime() : 0,
        score: scoreDocument(snippet, title),
      });
    }

    for (const cv of convoHits) {
      combined.push({
        origen: 'Expediente de Conversación',
        titulo: cv.title || 'Conversación SG-SST',
        conversationId: cv.conversationId,
        extracto: `Hilo de conversación titulado "${cv.title}"`,
        fecha: cv.updatedAt ? new Date(cv.updatedAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'Reciente',
        timestamp: cv.updatedAt ? new Date(cv.updatedAt).getTime() : 0,
        score: scoreDocument('', cv.title) + 2,
      });
    }

    combined.sort((a, b) => (b.score !== a.score ? b.score - a.score : b.timestamp - a.timestamp));
    const topResults = combined.slice(0, limit);

    return {
      exito: true,
      consulta: rawQuery,
      totalEncontrados: topResults.length,
      resultados: topResults,
      mensaje:
        topResults.length > 0
          ? `Se encontraron ${topResults.length} registros históricos relevantes para "${rawQuery}".`
          : `No se encontraron conversaciones o informes previos que coincidan con "${rawQuery}".`,
    };
  } catch (err) {
    logger.error('[Tenshi Instant History Search] Error:', err);
    return {
      exito: false,
      error: err.message,
      resultados: [],
    };
  }
}

// ============================================================================
// 7. MOTOR RAG DE BASE DE DATOS NORMATIVA Y TÉCNICA SST (99+ .MD + VADEMÉCUM + RAG_API)
// ============================================================================

let _normativeChunksCache = null;
let _normativeCacheBuiltAt = 0;
const NORMATIVE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

function normalizeForSearch(str = '') {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function buildNormativeIndexSync() {
  const now = Date.now();
  if (_normativeChunksCache && now - _normativeCacheBuiltAt < NORMATIVE_CACHE_TTL_MS) {
    return _normativeChunksCache;
  }

  const fs = require('fs');
  const path = require('path');
  const candidateRoots = [
    '/app/uploads',
    path.resolve(__dirname, '../../../../uploads'),
    path.resolve(process.cwd(), 'uploads'),
  ];

  const chunks = [];
  const visitedFiles = new Set();

  for (const rootDir of candidateRoots) {
    if (!fs.existsSync(rootDir)) continue;
    let subdirs = [];
    try {
      subdirs = fs.readdirSync(rootDir, { withFileTypes: true });
    } catch (_e) {
      continue;
    }

    for (const entry of subdirs) {
      const fullSubPath = path.join(rootDir, entry.name);
      if (entry.isDirectory()) {
        let files = [];
        try {
          files = fs.readdirSync(fullSubPath);
        } catch (_e) {
          continue;
        }
        for (const f of files) {
          if (!f.toLowerCase().endsWith('.md')) continue;
          const fileAbs = path.join(fullSubPath, f);
          if (visitedFiles.has(fileAbs)) continue;
          visitedFiles.add(fileAbs);

          try {
            const rawText = fs.readFileSync(fileAbs, 'utf8');
            if (!rawText || rawText.length < 40) continue;

            // Clean readable document name (strip UUID__ prefix)
            const cleanDocName = f
              .replace(/^[0-9a-f-]{36}__/i, '')
              .replace(/\.md$/i, '')
              .replace(/_/g, ' ')
              .trim();
            const normDocName = normalizeForSearch(cleanDocName);

            // Split by headings or ~1400 char blocks
            const sections = rawText.split(/\n(?=#{1,3}\s|ART[ÍI]CULO\s+\d+|CAP[ÍI]TULO\s+)/i);
            let buffer = '';
            for (const sec of sections) {
              if ((buffer + '\n' + sec).length > 1500 && buffer.length >= 250) {
                chunks.push({
                  docName: cleanDocName,
                  normDocName,
                  text: buffer.trim(),
                  normText: normalizeForSearch(buffer),
                });
                buffer = sec;
              } else {
                buffer = buffer ? `${buffer}\n${sec}` : sec;
              }
            }
            if (buffer.trim().length > 40) {
              chunks.push({
                docName: cleanDocName,
                normDocName,
                text: buffer.trim().slice(0, 2200),
                normText: normalizeForSearch(buffer.slice(0, 2200)),
              });
            }
          } catch (_readErr) {
            // Ignore unreadable file
          }
        }
      }
    }
  }

  _normativeChunksCache = chunks;
  _normativeCacheBuiltAt = now;
  logger.info(`[Tenshi Normative RAG] Indexed ${chunks.length} sections from ${visitedFiles.size} Markdown normative/technical files.`);
  return chunks;
}

/**
 * Busca en la Base de Datos Documental y Normativa de WAPPY (99+ archivos .md en /uploads + Vademécum 2026 + Batería Psicosocial + Resoluciones 2024-2026).
 */
async function searchNormativeKnowledgeBase(query, maxResults = 5) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return { exito: false, resultados: [], textoFormateado: '' };
  }

  try {
    const chunks = buildNormativeIndexSync();
    if (!chunks || chunks.length === 0) {
      return { exito: false, resultados: [], textoFormateado: '' };
    }

    const normQ = normalizeForSearch(query);
    const stopWords = new Set([
      'para', 'como', 'cual', 'cuales', 'este', 'esta', 'estos', 'estas', 'sobre', 'entre', 'desde', 'hasta',
      'donde', 'cuando', 'porque', 'quien', 'todo', 'toda', 'todos', 'todas', 'tiene', 'tienen', 'segun',
      'colombia', 'norma', 'normativa', 'normatividad', 'ultima', 'ultimo', 'vigente', 'actual', 'salio',
    ]);

    // Extract key tokens and also numbers (like 1843, 2346, 0312, 1072, 2764, 2646, 4272)
    const rawTokens = normQ
      .split(/[^a-z0-9]+/)
      .filter((t) => (t.length >= 3 && !stopWords.has(t)) || /^\d{3,5}$/.test(t));

    // Domain synonym expansion for common SST queries
    const expandedTokens = [...rawTokens];
    if (normQ.includes('examen') || normQ.includes('medic') || normQ.includes('ocupacional') || normQ.includes('profesiograma') || normQ.includes('historia clinica')) {
      expandedTokens.push('1843', 'evaluaciones', 'medicas', 'ocupacionales');
    }
    if (normQ.includes('psicosocial') || normQ.includes('bateria') || normQ.includes('intralaboral') || normQ.includes('extralaboral') || normQ.includes('estres')) {
      expandedTokens.push('2764', '2646', 'psicosocial', 'bateria');
    }
    if (normQ.includes('altura') || normQ.includes('andamio') || normQ.includes('arnes')) {
      expandedTokens.push('4272', 'alturas');
    }
    if (normQ.includes('confinad')) {
      expandedTokens.push('491', '2605', 'confinados');
    }
    if (normQ.includes('vial') || normQ.includes('pesv') || normQ.includes('vehicul')) {
      expandedTokens.push('40595', '2251', 'pesv');
    }
    if (normQ.includes('acoso')) {
      expandedTokens.push('2365', '2209', '1010', 'acoso');
    }
    if (normQ.includes('110') || normQ.includes('0110') || normQ.includes('inspector') || normQ.includes('advertir') || normQ.includes('aconsejar')) {
      expandedTokens.push('0110', '110', 'advertir', 'aconsejar', 'preventiva');
    }

    const uniqueTokens = [...new Set(expandedTokens)];
    const scored = [];

    for (const chunk of chunks) {
      let score = 0;
      for (const tok of uniqueTokens) {
        const isNum = /^\d{3,5}$/.test(tok);
        if (chunk.normDocName.includes(tok)) {
          score += isNum ? 14 : 6;
        }
        if (chunk.normText.includes(tok)) {
          score += isNum ? 8 : 2.5;
        }
      }
      // Bonus for Vademecum Maestro 2026 and recent 2024/2025/2026 norms
      if (score > 0) {
        if (chunk.normDocName.includes('vademecum')) score += 4;
        if (chunk.normDocName.includes('2025') || chunk.normDocName.includes('2026')) score += 3;
        scored.push({ chunk, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    // Pick diverse top results (max 2 chunks per document so one big doc doesn't monopolize)
    const selected = [];
    const perDocCount = new Map();
    for (const item of scored) {
      const count = perDocCount.get(item.chunk.docName) || 0;
      if (count >= 2) continue;
      perDocCount.set(item.chunk.docName, count + 1);
      selected.push({
        documento: item.chunk.docName,
        relevancia: item.score,
        contenido: item.chunk.text.slice(0, 1400),
      });
      if (selected.length >= maxResults) break;
    }

    if (selected.length === 0) {
      return { exito: false, resultados: [], textoFormateado: '' };
    }

    const formatted = selected
      .map(
        (r, idx) =>
          `📘 **[BASE DE DATOS NORMATIVA Y TÉCNICA WAPPY #${idx + 1}: ${r.documento}]**\n${r.contenido}`
      )
      .join('\n\n---\n\n');

    return {
      exito: true,
      totalEncontrados: selected.length,
      resultados: selected,
      textoFormateado: formatted,
    };
  } catch (err) {
    logger.error('[Tenshi Normative RAG] Search error:', err);
    return { exito: false, resultados: [], textoFormateado: '' };
  }
}

module.exports = {
  GOVERNED_TOOLS_META,
  isGovernedTool,
  stageGovernedAction,
  buildGenerativeWidgetForTool,
  manageProceduralMemory,
  getProceduralMemoryPromptBlock,
  autoSynthesizeProceduralRule,
  searchInstantHistory,
  searchNormativeKnowledgeBase,
};
