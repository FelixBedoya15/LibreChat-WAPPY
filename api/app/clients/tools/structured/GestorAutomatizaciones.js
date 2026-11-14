const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');
const Automation = require('~/models/Automation');
const AutomationLog = require('~/models/AutomationLog');
const CompanyInfo = require('~/models/CompanyInfo');

class GestorAutomatizaciones extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'gestor_automatizaciones';
    this.description =
      'Permite al agente ejecutar Flujos Tenshi internos al instante (accion="ejecutar_tenshi") y crear, listar, consultar, actualizar, activar/pausar, ejecutar de inmediato o eliminar TAREAS programadas (antes llamadas "Automatizaciones IA") en WAPPY (/tareas; historial en /tareas?tab=historial). Usa "ejecutar_tenshi" cuando la solicitud del usuario coincida con un flujo interno asignado; usa las demás acciones cuando pida gestionar o programar sus tareas periódicas.';
    this.req = fields.req;
    this.schema = z.object({
      accion: z.string().describe('Acción a realizar: "ejecutar_tenshi", "crear", "listar", "actualizar", "activar", "desactivar", "pausar", "activar_todas", "desactivar_todas", "eliminar", "eliminar_todas", "ejecutar_ahora", "detener" o "ver_logs".'),
      nombre: z.string().optional().describe('Nombre de la tarea/automatización o flujo Tenshi (para crearla o buscarla por su título/alias si no tienes el ID).'),
      nuevo_nombre: z.string().optional().describe('Nuevo nombre si deseas renombrar una tarea/automatización existente.'),
      agente_objetivo: z.string().optional().describe('Nombre o ID del agente que ejecutará la tarea (ej. "Consultor SG-SST", "Médico Laboral", "Auditor SG-SST" o "yo" para el agente actual). Si no se especifica, se asigna al agente actual o al Consultor SG-SST.'),
      prompt_a_ejecutar: z.string().optional().describe('Instrucción o prompt detallado y completo que el agente ejecutará en segundo plano cada vez que se dispare la tarea. OBLIGATORIO si accion="crear".'),
      tipo_frecuencia: z.enum(['daily', 'weekly', 'monthly', 'hourly']).default('daily').optional().describe('Tipo de periodicidad: "daily" (diario), "weekly" (semanal), "monthly" (mensual) o "hourly" (cada X horas).'),
      configuracion_horario: z.object({
        hora: z.number().min(0).max(23).default(8).optional().describe('Hora del día (0-23) en hora colombiana (UTC-5). Por defecto 8 (8:00 AM).'),
        minuto: z.number().min(0).max(59).default(0).optional().describe('Minuto (0-59). Por defecto 0.'),
        dias_semana: z.array(z.number().min(0).max(6)).default([1]).optional().describe('Arreglo de días de la semana si tipo_frecuencia="weekly" (0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado). Ej: [1] para todos los lunes, o [1, 3, 5] para lunes, miércoles y viernes.'),
        dia_mes: z.number().min(1).max(31).default(1).optional().describe('Día del mes (1-31) si tipo_frecuencia="monthly".'),
        intervalo_horas: z.number().min(1).default(1).optional().describe('Intervalo en horas si tipo_frecuencia="hourly".')
      }).optional().describe('Configuración específica del horario de ejecución.'),
      correos_notificacion: z.array(z.string()).optional().describe('Lista de correos electrónicos a los que se enviará automáticamente el informe o resultado de la ejecución.'),
      automatizacion_id: z.string().optional().describe('ID de 24 caracteres, nombre/título de la tarea en pantalla, o "todas" para operar sobre todas las tareas.'),
      nuevo_estado: z.string().optional().describe('Nuevo estado deseado: "active" (activada) o "inactive" (pausada/desactivada).'),
      instruccion_usuario: z.string().optional().describe('Instrucción literal, pregunta o parámetro dicho por el usuario para alimentar el flujo al ejecutarlo'),
      esperar_resultado: z.boolean().optional().describe('Si es true (por defecto en ejecutar_tenshi), espera de forma síncrona el resultado final del flujo para responder al instante en el mismo turno')
    });
  }

  _normStr(s = '') {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  _isObjectId(val) {
    if (!val) return false;
    const str = String(val).trim();
    return /^[0-9a-fA-F]{24}$/.test(str) && mongoose.Types.ObjectId.isValid(str);
  }

  _normalizeActionAndStatus(rawAccion = '', rawEstado) {
    const act = this._normStr(rawAccion).replace(/\s+/g, '_');
    let accion = act;
    let forcedStatus = undefined;
    let forcedAll = false;

    if (['ejecutar_tenshi', 'tenshi', 'flujo_tenshi', 'run_tenshi'].includes(act)) {
      accion = 'ejecutar_tenshi';
    } else if (['crear', 'create', 'programar', 'nueva', 'agregar', 'anadir'].includes(act)) {
      accion = 'crear';
    } else if (['listar', 'list', 'consultar', 'ver', 'mostrar'].includes(act)) {
      accion = 'listar';
    } else if (['activar_todas', 'activar_todos', 'enable_all', 'encender_todas'].includes(act)) {
      accion = 'actualizar';
      forcedStatus = 'active';
      forcedAll = true;
    } else if (['desactivar_todas', 'desactivar_todos', 'pausar_todas', 'pausar_todos', 'inactivar_todas', 'disable_all', 'apagar_todas'].includes(act)) {
      accion = 'actualizar';
      forcedStatus = 'inactive';
      forcedAll = true;
    } else if (['eliminar_todas', 'eliminar_todos', 'borrar_todas', 'borrar_todos', 'delete_all'].includes(act)) {
      accion = 'eliminar';
      forcedAll = true;
    } else if (['activar', 'reactivar', 'enable', 'encender', 'prender'].includes(act)) {
      accion = 'actualizar';
      forcedStatus = 'active';
    } else if (['desactivar', 'pausar', 'inactivar', 'disable', 'pause', 'apagar'].includes(act)) {
      accion = 'actualizar';
      forcedStatus = 'inactive';
    } else if (['actualizar', 'editar', 'modificar', 'update', 'edit', 'cambiar'].includes(act)) {
      accion = 'actualizar';
    } else if (['eliminar', 'borrar', 'delete', 'remove', 'quitar'].includes(act)) {
      accion = 'eliminar';
    } else if (['ejecutar_ahora', 'ejecutar', 'correr', 'run', 'run_now', 'disparar'].includes(act)) {
      accion = 'ejecutar_ahora';
    } else if (['detener', 'parar', 'stop'].includes(act)) {
      accion = 'detener';
    } else if (['ver_logs', 'logs', 'historial', 'ver_historial'].includes(act)) {
      accion = 'ver_logs';
    }

    let nuevo_estado = forcedStatus;
    if (rawEstado !== undefined && rawEstado !== null && String(rawEstado).trim() !== '') {
      const est = this._normStr(rawEstado);
      if (['active', 'activa', 'activo', 'activar', 'activada', 'activado', 'on', 'true', 'enabled', 'habilitada', 'habilitado'].includes(est)) {
        nuevo_estado = 'active';
      } else if (['inactive', 'inactiva', 'inactivo', 'pausada', 'pausado', 'pausar', 'desactivar', 'desactivada', 'desactivado', 'off', 'false', 'disabled', 'inhabilitada'].includes(est)) {
        nuevo_estado = 'inactive';
      }
    }

    return { accion, nuevo_estado, forcedAll };
  }

  _buildSafeCompanyFilter(companyId) {
    return {
      companyId: { $eq: String(companyId), $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
    };
  }

  async _findCompanyAutomations(companyId, _userId) {
    if (!companyId) return [];
    const list = await Automation.find(this._buildSafeCompanyFilter(companyId)).sort({ createdAt: -1 });
    return list || [];
  }

  async _resolveTargetAutomations(companyId, userId, { automatizacion_id, nombre, forcedAll = false }) {
    const { resolveAutomationByVoiceOrQuery } = require('~/server/services/automationScheduler');
    const allAutos = await this._findCompanyAutomations(companyId, userId);
    if (allAutos.length === 0) {
      return { matches: [], isBulk: false, usedNameAsQuery: false, matchSource: null, matchedVoiceCommand: null };
    }

    const rawId = String(automatizacion_id || '').trim();
    const rawName = String(nombre || '').trim();
    const queryStr = rawId || rawName;
    const normQuery = this._normStr(queryStr);

    const isAllKeyword =
      forcedAll ||
      /^(todas?|todos?|all|\*|todas\s+las\s+(tareas|automatizaciones|activas|inactivas)|las\s+que\s+est[aá]n\s+en\s+pantalla|ninguna\s+abierta)$/i.test(normQuery);

    if (isAllKeyword) {
      return { matches: allAutos, isBulk: true, usedNameAsQuery: false, matchSource: 'bulk', matchedVoiceCommand: null };
    }

    // 1. Si automatizacion_id es un ObjectId válido de 24 caracteres hexadecimales
    if (this._isObjectId(rawId)) {
      const byId = allAutos.find((a) => String(a._id) === rawId);
      if (byId) {
        return { matches: [byId], isBulk: false, usedNameAsQuery: false, matchSource: 'id', matchedVoiceCommand: null };
      }
      const directById = await Automation.findOne({ _id: rawId, ...this._buildSafeCompanyFilter(companyId) });
      if (directById) {
        return { matches: [directById], isBulk: false, usedNameAsQuery: false, matchSource: 'id', matchedVoiceCommand: null };
      }
    }

    // 2. Resolver unificado por FRASE/COMANDO TENSHI (`voiceCommand`) o Título real sin falsos positivos
    const searchCandidates = [rawId, rawName].filter(Boolean);
    for (const candidate of searchCandidates) {
      const resolved = resolveAutomationByVoiceOrQuery(allAutos, candidate);
      if (resolved.matches && resolved.matches.length > 0) {
        return {
          matches: [resolved.matches[0]],
          isBulk: false,
          usedNameAsQuery: !rawId,
          matchSource: resolved.matchSource,
          matchedVoiceCommand: resolved.matchedVoiceCommand,
        };
      }
    }

    return { matches: [], isBulk: false, usedNameAsQuery: false, matchSource: null, matchedVoiceCommand: null };
  }

  async _getActiveCompanyId(userId) {
    if (!userId && !this.req?.user) return null;
    const { resolveStrictExecutionContext } = require('~/server/services/tenshiFlowService');
    const reqUser = this.req?.user || { id: userId, _id: userId };
    const ctx = await resolveStrictExecutionContext({ reqUser, reqObj: this.req });
    return ctx?.companyId || null;
  }

  async _executeMatchedTenshiFlow({ flow, strictCtx, userInstruction = '', esperar_resultado = true }) {
    const { executeTenshiFlowInstant } = require('~/server/services/tenshiFlowService');
    const isVoice = Boolean(this.req?.isVoiceSession);
    const waitTimeoutMs = esperar_resultado === false ? 0 : (isVoice ? 25000 : 45000);
    const triggerSource = isVoice ? 'tenshi_voice' : 'tenshi_flow_instant';

    try {
      const execRes = await executeTenshiFlowInstant({
        flow,
        context: strictCtx,
        userInstruction: String(userInstruction || '').trim(),
        waitTimeoutMs,
        triggerSource,
      });

      if (execRes?.completedInTurn === false || execRes?.status === 'running_background') {
        return JSON.stringify({
          success: true,
          mode: 'background_continued',
          flujo: execRes?.flowName || flow?.name || 'Flujo Tenshi',
          empresa: strictCtx.companyName,
          companyId: strictCtx.companyId,
          logId: execRes?.logId || null,
          mensaje:
            'El flujo sigue procesando en segundo plano y quedará guardado en Historial de Ejecuciones de la empresa.',
        });
      }

      if (execRes?.status === 'success') {
        return JSON.stringify({
          success: true,
          mode: 'instant',
          flujo: execRes.flowName || flow?.name || 'Flujo Tenshi',
          empresa: strictCtx.companyName,
          companyId: strictCtx.companyId,
          logId: execRes.logId || null,
          rama: execRes.branchTaken || null,
          enlacesWorkspace: execRes.workspaceLinks || [],
          evidencias: execRes.evidenceFiles || [],
          resultado: execRes.resultText || '',
          mensaje:
            'Flujo ejecutado al instante. Usa el campo "resultado" para responderle directamente al usuario.',
        });
      }

      return JSON.stringify({
        error: execRes?.error || 'Error ejecutando el flujo interno.',
        logId: execRes?.logId || null,
      });
    } catch (flowErr) {
      return JSON.stringify({
        error: flowErr?.message || 'Error ejecutando el flujo interno.',
      });
    }
  }

  async _getEffectiveAutomationLimit(userId) {
    if (!userId) return { limit: 0, plan: 'free' };
    const UserPlan = require('~/db/models/UserPlan');
    const userPlanDoc = await UserPlan.findOne({ userId }).lean();
    let plan = userPlanDoc?.plan;
    if (!plan || plan === 'free') {
      const role = this.req?.user?.role;
      if (role === 'ADMIN') plan = 'admin';
      else if (role === 'USER_PRO') plan = 'pro';
      else if (role === 'USER_PLUS') plan = 'plus';
      else if (role === 'USER_GO') plan = 'go';
      else if (role === 'USER_CUSTOM') plan = 'custom';
      else if (role === 'USER_IPEVAR') plan = 'ipevar';
      else plan = 'free';
    }

    if (userPlanDoc?.automationLimit !== undefined && userPlanDoc?.automationLimit !== null) {
      return { limit: userPlanDoc.automationLimit, plan };
    }

    if (['admin', 'custom'].includes(plan)) {
      return { limit: 999, plan };
    }
    if (plan === 'pro') {
      return { limit: 1, plan };
    }
    return { limit: 0, plan };
  }

  async _resolveAgent(agentTarget, currentAgentId) {
    const AgentModel = mongoose.models.Agent || (mongoose.modelNames().includes('Agent') ? mongoose.model('Agent') : null);
    
    // Si viene "yo" o vacío, intentar usar el agente actual
    if (!agentTarget || agentTarget.trim().toLowerCase() === 'yo' || agentTarget.trim() === '') {
      if (currentAgentId && AgentModel) {
        const ag = await AgentModel.findOne({ id: currentAgentId }).lean();
        if (ag) return { id: ag.id, name: ag.name };
      }
    }

    if (!AgentModel) {
      return { id: currentAgentId || 'default-agent', name: agentTarget || 'Agente Experto' };
    }

    // Buscar por ID exacto
    if (agentTarget) {
      const byId = await AgentModel.findOne({ id: agentTarget }).lean();
      if (byId) return { id: byId.id, name: byId.name };

      // Buscar por nombre con regex insensible a mayúsculas
      const byName = await AgentModel.findOne({ name: { $regex: new RegExp(`^${agentTarget.trim()}$`, 'i') } }).lean();
      if (byName) return { id: byName.id, name: byName.name };

      // Búsqueda parcial por nombre
      const byPartialName = await AgentModel.findOne({ name: { $regex: new RegExp(agentTarget.trim(), 'i') } }).lean();
      if (byPartialName) return { id: byPartialName.id, name: byPartialName.name };
    }

    // Fallback: Consultor SG-SST o primer agente disponible
    const fallbackAgent = await AgentModel.findOne({ name: 'Consultor SG-SST' }).lean() || await AgentModel.findOne({}).lean();
    if (fallbackAgent) {
      return { id: fallbackAgent.id, name: fallbackAgent.name };
    }

    return { id: currentAgentId || 'default-agent', name: agentTarget || 'Agente' };
  }

  async _call(input) {
    try {
      const {
        runAutomation,
        calculateNextRun,
        stopAutomation,
        hasCronTrigger,
        extractAutomationTriggerConfigs,
      } = require('~/server/services/automationScheduler');
      const {
        resolveStrictExecutionContext,
        listActiveTenshiFlows,
        matchTenshiFlowByQuery,
      } = require('~/server/services/tenshiFlowService');

      const callerUserId = this.req?.user?.id || this.req?.user?._id;
      if (!callerUserId) {
        return JSON.stringify({
          error: 'No se encontró un usuario autenticado para gestionar las automatizaciones.'
        });
      }

      const strictCtx = await resolveStrictExecutionContext({
        reqUser: this.req?.user,
        reqObj: this.req,
      });
      if (strictCtx?.error || !strictCtx?.companyId) {
        return JSON.stringify({
          error: strictCtx?.error || 'No se encontró una empresa asociada a tu usuario. Por favor registra los datos de tu empresa en WAPPY primero.'
        });
      }

      const companyId = strictCtx.companyId;
      const userId = strictCtx.tenantOwnerUserId || String(callerUserId);
      const isAdminUser = String(this.req?.user?.role || '').toUpperCase() === 'ADMIN';

      const {
        accion: rawAccion,
        nombre,
        nuevo_nombre,
        agente_objetivo,
        prompt_a_ejecutar,
        instruccion_usuario,
        esperar_resultado,
        tipo_frecuencia,
        configuracion_horario = {},
        correos_notificacion,
        automatizacion_id,
        nuevo_estado: rawEstado
      } = input || {};

      const { accion, nuevo_estado, forcedAll } = this._normalizeActionAndStatus(rawAccion, rawEstado);
      const currentAgentId = this.req?.body?.endpointOption?.agent_id;

      // ── ACCIÓN: EJECUTAR FLUJO TENSHI INTERNO INSTANTÁNEO ───────────
      if (accion === 'ejecutar_tenshi') {
        const query = String(automatizacion_id || nombre || instruccion_usuario || '').trim();
        if (!query) {
          return JSON.stringify({
            error: 'Debes indicar el nombre, código o comando del Flujo Tenshi a ejecutar.'
          });
        }
        const activeFlows = await listActiveTenshiFlows();
        if (!activeFlows || activeFlows.length === 0) {
          return JSON.stringify({
            error: 'No hay Flujos Tenshi activos disponibles en el sistema en este momento.'
          });
        }
        const matchRes = await matchTenshiFlowByQuery(query, activeFlows);
        if (!matchRes?.flow) {
          return JSON.stringify({
            error: `No se encontró ningún Flujo Tenshi activo que coincida con "${query}".`
          });
        }
        return await this._executeMatchedTenshiFlow({
          flow: matchRes.flow,
          strictCtx,
          userInstruction: instruccion_usuario || nombre || automatizacion_id || '',
          esperar_resultado: esperar_resultado !== false,
        });
      }

      // ── ACCIÓN: LISTAR ──────────────────────────────────────────────
      if (accion === 'listar') {
        const automations = await this._findCompanyAutomations(companyId, userId);
        if (!automations || automations.length === 0) {
          return JSON.stringify({
            mensaje: 'No hay tareas/automatizaciones programadas para tu empresa en este momento.',
            total: 0,
            automatizaciones: []
          });
        }

        const formatted = automations.map(a => {
          const trigInfo = extractAutomationTriggerConfigs(a);
          return {
            id: a._id.toString(),
            nombre: a.name,
            agenteAsignado: a.agentName || a.agentId,
            disparadores: trigInfo.triggers,
            comandosVozTenshi: trigInfo.voiceCommands,
            frecuencia: a.scheduleType,
            horario: a.scheduleConfig,
            estado: a.status,
            destinatarios: a.emails || [],
            proximaEjecucion: a.nextRunAt ? new Date(a.nextRunAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : (trigInfo.triggers.includes('schedule_cron') ? 'No programada' : 'Por evento / Comando Tenshi'),
            ultimoEstado: a.lastRunStatus || 'Sin ejecuciones',
            ultimoResultado: a.lastRunResult ? a.lastRunResult.substring(0, 150) + '...' : 'Ninguno'
          };
        });

        return JSON.stringify({
          mensaje: `Se encontraron ${automations.length} tareas/automatizaciones configuradas.`,
          total: automations.length,
          automatizaciones: formatted
        });
      }

      // ── ACCIÓN: CREAR ───────────────────────────────────────────────
      if (accion === 'crear') {
        if (this.req?.isAutomation || this.req?.body?.isAutomation) {
          return JSON.stringify({
            error: 'Operación bloqueada: No se permite crear nuevas automatizaciones desde dentro de la ejecución en segundo plano de una automatización existente.'
          });
        }
        const finalName = (nombre || nuevo_nombre || '').trim();
        const finalPrompt = (prompt_a_ejecutar || finalName).trim();
        if (!finalName) {
          return JSON.stringify({
            error: 'Para crear una tarea/automatización debes proporcionar "nombre".'
          });
        }

        // Idempotencia: evitar duplicar una tarea con el mismo nombre o propósito idéntico en la misma empresa
        const existingAutos = await Automation.find({
          user: userId,
          ...this._buildSafeCompanyFilter(companyId),
        });
        const normFinalName = this._normStr(finalName);
        const stopWords = new Set(['para', 'con', 'del', 'las', 'los', 'una', 'por', 'que', 'tarea', 'automatizacion', 'automatica', 'automatico', 'monitoreo', 'vigilancia', 'vigilar', 'revisar', 'revision', 'sincronizacion', 'diaria', 'diario', 'semanal', 'mensual', 'ejemplo', 'admin']);
        const newTokens = normFinalName.split(' ').filter((w) => w.length >= 3 && !stopWords.has(w));
        const duplicateAuto = existingAutos.find((a) => {
          const aNorm = this._normStr(a.name);
          if (aNorm === normFinalName) return true;
          if (newTokens.length >= 2) {
            const hits = newTokens.filter((t) => aNorm.includes(t)).length;
            if (hits / newTokens.length >= 0.75) return true;
          }
          return false;
        });
        if (duplicateAuto) {
          return JSON.stringify({
            success: true,
            yaExistia: true,
            mensaje: `La tarea automatizada "${duplicateAuto.name}" ya existe en esta empresa (ID: ${duplicateAuto._id.toString()}). No se creó un duplicado.`,
            id: duplicateAuto._id.toString(),
            nombre: duplicateAuto.name,
            estado: duplicateAuto.status
          });
        }

        // Validar Plan y Límite de Automatizaciones
        const { limit: effectiveLimit, plan: userPlanName } = await this._getEffectiveAutomationLimit(userId);
        if (effectiveLimit <= 0) {
          return JSON.stringify({
            error: '🔒 Función Exclusiva de Plan PRO: Las automatizaciones de tareas periódicas e informes autónomos están disponibles únicamente en el Plan Wappy Pro. Actualiza tu suscripción a Wappy Pro para activar automatizaciones con tus agentes.',
            bloqueadoPorPlan: true,
            planActual: userPlanName
          });
        }

        const activeCount = await Automation.countDocuments({
          user: userId,
          status: 'active',
          isTenshiFlow: { $ne: true },
          isSystemPreset: { $ne: true },
        });
        if (activeCount >= effectiveLimit) {
          return JSON.stringify({
            error: `🔒 Límite de Automatizaciones Alcanzado: Tu plan actual (${userPlanName === 'pro' ? 'Wappy Pro' : userPlanName}) permite hasta ${effectiveLimit} automatización(es) activa(s) y ya tienes ${activeCount} configurada(s). Para habilitar más tareas periódicas en segundo plano, puedes adquirir un paquete de 5 automatizaciones adicionales por solo $25.000 COP/mes comunicándote con soporte de WAPPY.`,
            limiteAlcanzado: true,
            limiteActual: effectiveLimit,
            activas: activeCount
          });
        }

        const agentInfo = await this._resolveAgent(agente_objetivo, currentAgentId);
        const freq = tipo_frecuencia || 'daily';

        const scheduleConfig = {
          hour: configuracion_horario.hora !== undefined ? Number(configuracion_horario.hora) : 8,
          minute: configuracion_horario.minuto !== undefined ? Number(configuracion_horario.minuto) : 0,
          dayOfWeek: configuracion_horario.dias_semana || [1],
          dayOfMonth: configuracion_horario.dia_mes !== undefined ? Number(configuracion_horario.dia_mes) : 1,
          intervalHours: configuracion_horario.intervalo_horas !== undefined ? Number(configuracion_horario.intervalo_horas) : 1
        };

        const nextRunAt = calculateNextRun(freq, scheduleConfig);

        const newAutomation = await Automation.create({
          user: userId,
          companyId,
          name: finalName,
          agentId: agentInfo.id,
          agentName: agentInfo.name,
          prompt: finalPrompt,
          scheduleType: freq,
          scheduleConfig,
          emails: Array.isArray(correos_notificacion) ? correos_notificacion : [],
          status: nuevo_estado === 'inactive' ? 'inactive' : 'active',
          nextRunAt: nuevo_estado === 'inactive' ? null : nextRunAt
        });

        return JSON.stringify({
          success: true,
          mensaje: `Tarea automatizada "${newAutomation.name}" creada exitosamente (${newAutomation.status === 'active' ? 'Activa' : 'Inactiva'}).`,
          id: newAutomation._id.toString(),
          nombre: newAutomation.name,
          estado: newAutomation.status,
          agente: agentInfo.name,
          proximaEjecucion: newAutomation.nextRunAt ? new Date(newAutomation.nextRunAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'Pausada',
          frecuencia: freq,
          destinatarios: newAutomation.emails,
          limiteUso: `${activeCount + (newAutomation.status === 'active' ? 1 : 0)} de ${effectiveLimit} automatizaciones activas usadas.`
        });
      }

      // ── ACCIÓN: ACTUALIZAR / ACTIVAR / DESACTIVAR / EDITAR ──────────
      if (accion === 'actualizar') {
        const implicitAll = !automatizacion_id && !nombre && Boolean(nuevo_estado);
        const { matches, isBulk, usedNameAsQuery, matchSource, matchedVoiceCommand } = await this._resolveTargetAutomations(companyId, userId, {
          automatizacion_id,
          nombre,
          forcedAll: forcedAll || implicitAll
        });

        if (!matches || matches.length === 0) {
          return JSON.stringify({
            error: `No se encontró ninguna tarea/automatización que coincida con "${automatizacion_id || nombre || 'la solicitud'}" en tu empresa.`
          });
        }

        const { limit: effectiveLimit } = await this._getEffectiveAutomationLimit(userId);
        let currentActiveCount = await Automation.countDocuments({
          user: userId,
          status: 'active',
          isTenshiFlow: { $ne: true },
          isSystemPreset: { $ne: true },
        });

        const updatedItems = [];
        for (const automation of matches) {
          if (nuevo_estado === 'active' && automation.status !== 'active') {
            if (currentActiveCount >= effectiveLimit) {
              if (!isBulk) {
                return JSON.stringify({
                  error: `🔒 No se puede activar "${automation.name}": Has alcanzado tu límite de ${effectiveLimit} automatización(es) activa(s). Pausa otra tarea primero.`,
                  limiteAlcanzado: true,
                  limiteActual: effectiveLimit,
                  activas: currentActiveCount
                });
              }
              continue;
            }
            currentActiveCount++;
          } else if (nuevo_estado === 'inactive' && automation.status === 'active') {
            currentActiveCount = Math.max(0, currentActiveCount - 1);
          }

          // Renombrar solo si se envió nuevo_nombre, o si automatizacion_id era un ObjectId real y se envió nombre distinto
          if (!isBulk) {
            if (nuevo_nombre && nuevo_nombre.trim()) {
              automation.name = nuevo_nombre.trim();
            } else if (
              nombre &&
              nombre.trim() &&
              !usedNameAsQuery &&
              this._isObjectId(automatizacion_id) &&
              this._normStr(nombre) !== this._normStr(automation.name)
            ) {
              automation.name = nombre.trim();
            }
          }

          if (prompt_a_ejecutar !== undefined && String(prompt_a_ejecutar).trim()) {
            automation.prompt = String(prompt_a_ejecutar).trim();
          }
          if (agente_objetivo !== undefined && String(agente_objetivo).trim()) {
            const agentInfo = await this._resolveAgent(agente_objetivo, currentAgentId);
            automation.agentId = agentInfo.id;
            automation.agentName = agentInfo.name;
          }
          if (tipo_frecuencia !== undefined && String(tipo_frecuencia).trim()) {
            automation.scheduleType = tipo_frecuencia;
          }
          if (configuracion_horario && Object.keys(configuracion_horario).length > 0) {
            const prevCfg = automation.scheduleConfig || {};
            automation.scheduleConfig = {
              hour: configuracion_horario.hora !== undefined ? Number(configuracion_horario.hora) : (prevCfg.hour ?? 8),
              minute: configuracion_horario.minuto !== undefined ? Number(configuracion_horario.minuto) : (prevCfg.minute ?? 0),
              dayOfWeek: configuracion_horario.dias_semana !== undefined ? configuracion_horario.dias_semana : (prevCfg.dayOfWeek ?? [1]),
              dayOfMonth: configuracion_horario.dia_mes !== undefined ? Number(configuracion_horario.dia_mes) : (prevCfg.dayOfMonth ?? 1),
              intervalHours: configuracion_horario.intervalo_horas !== undefined ? Number(configuracion_horario.intervalo_horas) : (prevCfg.intervalHours ?? 1)
            };
          }
          if (Array.isArray(correos_notificacion)) {
            automation.emails = correos_notificacion;
          }
          if (nuevo_estado !== undefined) {
            automation.status = nuevo_estado;
          }

          const hasCron = hasCronTrigger(automation);
          if (automation.status === 'active' && hasCron) {
            automation.nextRunAt = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
          } else {
            automation.nextRunAt = null;
          }

          // Si se invocó mediante frase/comando de Tenshi (`matchSource === 'voiceCommand'`) y el usuario pidió activar,
          // además de dejarla Activa, poner el flujo en marcha inmediatamente en segundo plano.
          let triggeredNow = false;
          const autoTriggers = extractAutomationTriggerConfigs(automation).triggers;
          const shouldAutoDispatchTenshi =
            !isBulk &&
            nuevo_estado === 'active' &&
            matchSource === 'voiceCommand' &&
            autoTriggers.includes('trigger_tenshi') &&
            automation.lastRunStatus !== 'running';

          if (shouldAutoDispatchTenshi) {
            automation.lastRunStatus = 'running';
          }

          await automation.save();

          if (shouldAutoDispatchTenshi) {
            triggeredNow = true;
            runAutomation(automation, {
              triggerSource: 'tenshi_voice',
              eventPayload: {
                commandText: automatizacion_id || nombre || matchedVoiceCommand || '',
                matchedVoiceCommand,
                invokedVia: 'gestor_automatizaciones',
                invokedAt: new Date().toISOString(),
              },
            }).catch(err => {
              console.error('[GestorAutomatizaciones Tool] Error disparando flujo por voiceCommand:', err);
            });
          }

          updatedItems.push({
            id: automation._id.toString(),
            nombre: automation.name,
            estado: automation.status,
            triggeredNow,
            matchedVoiceCommand,
            proximaEjecucion: automation.nextRunAt
              ? new Date(automation.nextRunAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
              : (hasCron ? 'Pausada / Inactiva' : 'Por evento / Comando Tenshi')
          });
        }

        if (updatedItems.length === 1) {
          const item = updatedItems[0];
          return JSON.stringify({
            success: true,
            triggeredNow: Boolean(item.triggeredNow),
            matchedVoiceCommand: item.matchedVoiceCommand || null,
            mensaje: item.triggeredNow
              ? `Flujo "${item.nombre}" activado y puesto en marcha inmediatamente por comando Tenshi ("${item.matchedVoiceCommand}").`
              : `Tarea "${item.nombre}" actualizada correctamente (Estado: ${item.estado === 'active' ? 'Activa' : 'Inactiva'}).`,
            id: item.id,
            nombre: item.nombre,
            estado: item.estado,
            proximaEjecucion: item.proximaEjecucion
          });
        }

        return JSON.stringify({
          success: true,
          mensaje: `Se actualizaron ${updatedItems.length} tareas/automatizaciones correctamente.`,
          totalActualizadas: updatedItems.length,
          automatizaciones: updatedItems
        });
      }

      // ── ACCIÓN: EJECUTAR AHORA (TEST RUN / TENSHI VOICE TRIGGER) ────
      if (accion === 'ejecutar_ahora') {
        const { matches, matchSource, matchedVoiceCommand } = await this._resolveTargetAutomations(companyId, userId, {
          automatizacion_id,
          nombre
        });
        const automation = matches[0];
        if (!automation) {
          const fallbackQuery = String(automatizacion_id || nombre || instruccion_usuario || '').trim();
          if (fallbackQuery) {
            const activeFlows = await listActiveTenshiFlows();
            const matchRes = await matchTenshiFlowByQuery(fallbackQuery, activeFlows);
            if (matchRes?.flow) {
              return await this._executeMatchedTenshiFlow({
                flow: matchRes.flow,
                strictCtx,
                userInstruction: instruccion_usuario || nombre || automatizacion_id || '',
                esperar_resultado: esperar_resultado !== false,
              });
            }
          }
          return JSON.stringify({
            error: `No se encontró la tarea/automatización "${automatizacion_id || nombre || ''}" para ejecutar.`
          });
        }

        if (automation.lastRunStatus === 'running') {
          return JSON.stringify({
            advertencia: `La automatización "${automation.name}" ya se encuentra ejecutándose en segundo plano en este momento.`
          });
        }

        // Si estaba inactiva y fue invocada por comando Tenshi, activarla también respetando límite de plan
        const updateSet = { lastRunStatus: 'running' };
        if (automation.status !== 'active' && matchSource === 'voiceCommand') {
          const { limit: effectiveLimit } = await this._getEffectiveAutomationLimit(userId);
          const currentActive = await Automation.countDocuments({
            user: userId,
            status: 'active',
            isTenshiFlow: { $ne: true },
            isSystemPreset: { $ne: true },
          });
          if (currentActive < effectiveLimit) {
            updateSet.status = 'active';
            updateSet.nextRunAt = hasCronTrigger(automation)
              ? calculateNextRun(automation.scheduleType, automation.scheduleConfig)
              : null;
          }
        }

        await Automation.updateOne({ _id: automation._id, ...this._buildSafeCompanyFilter(companyId) }, { $set: updateSet });

        runAutomation(
          automation,
          matchSource === 'voiceCommand'
            ? {
                triggerSource: 'tenshi_voice',
                eventPayload: {
                  commandText: automatizacion_id || nombre || matchedVoiceCommand || '',
                  matchedVoiceCommand,
                  invokedVia: 'gestor_automatizaciones',
                },
              }
            : true,
        ).catch(err => {
          console.error('[GestorAutomatizaciones Tool] Error en ejecución manual background:', err);
        });

        return JSON.stringify({
          success: true,
          id: automation._id.toString(),
          nombre: automation.name,
          matchedVoiceCommand: matchedVoiceCommand || null,
          mensaje: matchedVoiceCommand
            ? `Ejecución iniciada inmediatamente en segundo plano para el flujo "${automation.name}" (comando "${matchedVoiceCommand}").`
            : `Ejecución iniciada inmediatamente en segundo plano para la tarea "${automation.name}".`
        });
      }

      // ── ACCIÓN: DETENER ─────────────────────────────────────────────
      if (accion === 'detener') {
        const { matches } = await this._resolveTargetAutomations(companyId, userId, {
          automatizacion_id,
          nombre
        });
        const automation = matches[0];
        if (!automation) {
          return JSON.stringify({
            error: `No se encontró la tarea/automatización "${automatizacion_id || nombre || ''}" para detener.`
          });
        }
        if (typeof stopAutomation === 'function') {
          await stopAutomation(automation._id.toString());
        } else {
          await Automation.updateOne({ _id: automation._id, ...this._buildSafeCompanyFilter(companyId) }, { $set: { lastRunStatus: 'stopped' } });
        }
        return JSON.stringify({
          success: true,
          id: automation._id.toString(),
          nombre: automation.name,
          mensaje: `Ejecución de la tarea "${automation.name}" detenida correctamente.`
        });
      }

      // ── ACCIÓN: ELIMINAR / ELIMINAR TODAS ───────────────────────────
      if (accion === 'eliminar') {
        const { matches } = await this._resolveTargetAutomations(companyId, userId, {
          automatizacion_id,
          nombre,
          forcedAll
        });

        if (!matches || matches.length === 0) {
          return JSON.stringify({
            error: `No se encontró ninguna tarea/automatización que coincida con "${automatizacion_id || nombre || ''}" para eliminar.`
          });
        }

        const ids = matches.map((m) => m._id);
        const names = matches.map((m) => m.name);

        await Automation.deleteMany({ _id: { $in: ids }, ...this._buildSafeCompanyFilter(companyId) });
        await AutomationLog.deleteMany({ automation: { $in: ids }, companyId: String(companyId) });

        return JSON.stringify({
          success: true,
          totalEliminadas: ids.length,
          eliminadas: names,
          mensaje:
            ids.length === 1
              ? `Tarea automatizada "${names[0]}" eliminada exitosamente junto con su historial.`
              : `Se eliminaron ${ids.length} tareas/automatizaciones exitosamente: ${names.join(', ')}.`
        });
      }

      // ── ACCIÓN: VER LOGS / HISTORIAL ────────────────────────────────
      if (accion === 'ver_logs') {
        const query = { companyId: String(companyId) };
        if (automatizacion_id || nombre) {
          const { matches } = await this._resolveTargetAutomations(companyId, userId, {
            automatizacion_id,
            nombre
          });
          if (matches.length > 0) {
            query.automation = matches[0]._id;
          }
        }

        const logs = await AutomationLog.find(query)
          .sort({ runAt: -1 })
          .limit(10)
          .lean();

        if (!logs || logs.length === 0) {
          return JSON.stringify({
            mensaje: 'No hay registros de ejecuciones previas para mostrar.',
            logs: []
          });
        }

        const formattedLogs = logs.map((l) => {
          const isMaskedTenshi = l.isTenshiFlow === true && !isAdminUser;
          const displayFlow = isMaskedTenshi
            ? (l.userInstruction || l.tenshiFlowName || 'Flujo ejecutado con Tenshi')
            : (l.tenshiFlowName || l.agentName || 'Automatización');
          return {
            id: l._id.toString(),
            flujo: displayFlow,
            agente: l.agentName,
            esFlujoTenshi: Boolean(l.isTenshiFlow),
            fechaEjecucion: new Date(l.runAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
            estado: l.status,
            resultadoResumido: l.result ? l.result.substring(0, 200) + '...' : (l.error || 'Sin detalles'),
            conversacionId: l.conversationId || null,
          };
        });

        return JSON.stringify({
          mensaje: `Se recuperaron ${logs.length} ejecuciones recientes.`,
          logs: formattedLogs
        });
      }

      return JSON.stringify({
        error: `Acción no reconocida "${rawAccion}". Las acciones válidas son: ejecutar_tenshi, crear, listar, actualizar, activar, desactivar, eliminar, ejecutar_ahora, detener, ver_logs.`
      });

    } catch (error) {
      console.error('[GestorAutomatizaciones Tool] Error general:', error);
      return JSON.stringify({
        error: 'Ocurrió un error al procesar la solicitud de automatización.',
        detalle: error.message
      });
    }
  }
}

module.exports = GestorAutomatizaciones;
