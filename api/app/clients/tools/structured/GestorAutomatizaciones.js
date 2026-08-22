const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');
const Automation = require('~/models/Automation');
const AutomationLog = require('~/models/AutomationLog');
const CompanyInfo = require('~/models/CompanyInfo');
const { runAutomation, calculateNextRun } = require('~/server/services/automationScheduler');

class GestorAutomatizaciones extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'gestor_automatizaciones';
    this.description =
      'Permite al agente crear, listar, consultar, actualizar, activar/pausar, ejecutar de inmediato o eliminar automatizaciones de tareas periódicas en el sistema de WAPPY (/sgsst/automatizaciones). Úsala cuando el usuario te pida programar recordatorios, inspecciones, auditorías o tareas autónomas periódicas que deban ejecutarse en segundo plano.';
    this.req = fields.req;
    this.schema = z.object({
      accion: z.enum(['crear', 'listar', 'actualizar', 'eliminar', 'ejecutar_ahora', 'ver_logs']).describe('Acción a realizar: "crear" para nueva tarea, "listar" para ver las tareas actuales, "actualizar" para modificar o pausar/activar, "eliminar" para borrar, "ejecutar_ahora" para forzar ejecución manual en segundo plano, "ver_logs" para ver historial de ejecuciones.'),
      nombre: z.string().optional().describe('Nombre descriptivo y claro de la automatización (ej. "Auditoría Semanal de Actos Inseguros"). OBLIGATORIO si accion="crear".'),
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
      automatizacion_id: z.string().optional().describe('ID de la automatización en base de datos. OBLIGATORIO si accion="actualizar", "eliminar" o "ejecutar_ahora".'),
      nuevo_estado: z.enum(['active', 'inactive']).optional().describe('Nuevo estado deseado: "active" (activada) o "inactive" (pausada). Usado al actualizar.')
    });
  }

  async _getActiveCompanyId(userId) {
    if (!userId) return null;
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id.toString() : null;
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
      const userId = this.req?.user?.id;
      if (!userId) {
        return JSON.stringify({
          error: 'No se encontró un usuario autenticado para gestionar las automatizaciones.'
        });
      }

      const companyId = await this._getActiveCompanyId(userId);
      if (!companyId) {
        return JSON.stringify({
          error: 'No se encontró una empresa asociada a tu usuario. Por favor registra los datos de tu empresa en WAPPY primero.'
        });
      }

      const {
        accion,
        nombre,
        agente_objetivo,
        prompt_a_ejecutar,
        tipo_frecuencia = 'daily',
        configuracion_horario = {},
        correos_notificacion = [],
        automatizacion_id,
        nuevo_estado
      } = input;

      const currentAgentId = this.req?.body?.endpointOption?.agent_id;

      // ── ACCIÓN: LISTAR ──────────────────────────────────────────────
      if (accion === 'listar') {
        const automations = await Automation.find({ companyId }).sort({ createdAt: -1 }).lean();
        if (!automations || automations.length === 0) {
          return JSON.stringify({
            mensaje: 'No hay automatizaciones programadas para tu empresa en este momento.',
            total: 0,
            automatizaciones: []
          });
        }

        const formatted = automations.map(a => ({
          id: a._id.toString(),
          nombre: a.name,
          agenteAsignado: a.agentName || a.agentId,
          frecuencia: a.scheduleType,
          horario: a.scheduleConfig,
          estado: a.status,
          destinatarios: a.emails || [],
          proximaEjecucion: a.nextRunAt ? new Date(a.nextRunAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'No programada',
          ultimoEstado: a.lastRunStatus || 'Sin ejecuciones',
          ultimoResultado: a.lastRunResult ? a.lastRunResult.substring(0, 150) + '...' : 'Ninguno'
        }));

        return JSON.stringify({
          mensaje: `Se encontraron ${automations.length} automatizaciones configuradas.`,
          total: automations.length,
          automatizaciones: formatted
        });
      }

      // ── ACCIÓN: CREAR ───────────────────────────────────────────────
      if (accion === 'crear') {
        if (!nombre || !prompt_a_ejecutar) {
          return JSON.stringify({
            error: 'Para crear una automatización debes proporcionar obligatoriamente "nombre" y "prompt_a_ejecutar".'
          });
        }

        const agentInfo = await this._resolveAgent(agente_objetivo, currentAgentId);

        const scheduleConfig = {
          hour: configuracion_horario.hora !== undefined ? Number(configuracion_horario.hora) : 8,
          minute: configuracion_horario.minuto !== undefined ? Number(configuracion_horario.minuto) : 0,
          dayOfWeek: configuracion_horario.dias_semana || [1],
          dayOfMonth: configuracion_horario.dia_mes !== undefined ? Number(configuracion_horario.dia_mes) : 1,
          intervalHours: configuracion_horario.intervalo_horas !== undefined ? Number(configuracion_horario.intervalo_horas) : 1
        };

        const nextRunAt = calculateNextRun(tipo_frecuencia, scheduleConfig);

        const newAutomation = await Automation.create({
          user: userId,
          companyId,
          name: nombre.trim(),
          agentId: agentInfo.id,
          agentName: agentInfo.name,
          prompt: prompt_a_ejecutar.trim(),
          scheduleType: tipo_frecuencia,
          scheduleConfig,
          emails: correos_notificacion || [],
          status: 'active',
          nextRunAt
        });

        return JSON.stringify({
          success: true,
          mensaje: `Automatización "${newAutomation.name}" creada exitosamente y programada en el sistema.`,
          id: newAutomation._id.toString(),
          agente: agentInfo.name,
          proximaEjecucion: nextRunAt ? new Date(nextRunAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'Pronto',
          frecuencia: tipo_frecuencia,
          destinatarios: newAutomation.emails
        });
      }

      // ── ACCIÓN: ACTUALIZAR ──────────────────────────────────────────
      if (accion === 'actualizar') {
        if (!automatizacion_id) {
          return JSON.stringify({
            error: 'Debes proporcionar "automatizacion_id" para actualizar una automatización.'
          });
        }

        const automation = await Automation.findOne({ _id: automatizacion_id, companyId });
        if (!automation) {
          return JSON.stringify({
            error: `No se encontró la automatización con ID ${automatizacion_id} para tu empresa.`
          });
        }

        if (nombre !== undefined) automation.name = nombre.trim();
        if (prompt_a_ejecutar !== undefined) automation.prompt = prompt_a_ejecutar.trim();
        if (agente_objetivo !== undefined) {
          const agentInfo = await this._resolveAgent(agente_objetivo, currentAgentId);
          automation.agentId = agentInfo.id;
          automation.agentName = agentInfo.name;
        }
        if (tipo_frecuencia !== undefined) automation.scheduleType = tipo_frecuencia;
        if (configuracion_horario && Object.keys(configuracion_horario).length > 0) {
          automation.scheduleConfig = {
            ...automation.scheduleConfig,
            ...configuracion_horario
          };
        }
        if (correos_notificacion !== undefined) automation.emails = correos_notificacion;
        if (nuevo_estado !== undefined) automation.status = nuevo_estado;

        if (automation.status === 'active') {
          automation.nextRunAt = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
        } else {
          automation.nextRunAt = null;
        }

        await automation.save();

        return JSON.stringify({
          success: true,
          mensaje: `Automatización "${automation.name}" actualizada correctamente.`,
          id: automation._id.toString(),
          estado: automation.status,
          proximaEjecucion: automation.nextRunAt ? new Date(automation.nextRunAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'Pausada'
        });
      }

      // ── ACCIÓN: EJECUTAR AHORA (TEST RUN) ───────────────────────────
      if (accion === 'ejecutar_ahora') {
        if (!automatizacion_id) {
          return JSON.stringify({
            error: 'Debes proporcionar "automatizacion_id" para ejecutar una automatización de inmediato.'
          });
        }

        const automation = await Automation.findOne({ _id: automatizacion_id, companyId });
        if (!automation) {
          return JSON.stringify({
            error: `No se encontró la automatización con ID ${automatizacion_id}.`
          });
        }

        if (automation.lastRunStatus === 'running') {
          return JSON.stringify({
            advertencia: `La automatización "${automation.name}" ya se encuentra ejecutándose en segundo plano en este momento.`
          });
        }

        await Automation.updateOne({ _id: automation._id }, { $set: { lastRunStatus: 'running' } });

        // Disparar en background de forma no bloqueante
        runAutomation(automation, true).catch(err => {
          console.error('[GestorAutomatizaciones Tool] Error en ejecución manual background:', err);
        });

        return JSON.stringify({
          success: true,
          mensaje: `Ejecución iniciada inmediatamente en segundo plano para la automatización "${automation.name}". El agente generará el informe y notificará a los destinatarios configurados.`
        });
      }

      // ── ACCIÓN: ELIMINAR ────────────────────────────────────────────
      if (accion === 'eliminar') {
        if (!automatizacion_id) {
          return JSON.stringify({
            error: 'Debes proporcionar "automatizacion_id" para eliminar la automatización.'
          });
        }

        const result = await Automation.deleteOne({ _id: automatizacion_id, companyId });
        if (result.deletedCount === 0) {
          return JSON.stringify({
            error: `No se encontró la automatización con ID ${automatizacion_id} para eliminar.`
          });
        }

        // Eliminar logs huérfanos asociados
        await AutomationLog.deleteMany({ automation: automatizacion_id });

        return JSON.stringify({
          success: true,
          mensaje: `Automatización con ID ${automatizacion_id} eliminada exitosamente junto con su historial.`
        });
      }

      // ── ACCIÓN: VER LOGS / HISTORIAL ────────────────────────────────
      if (accion === 'ver_logs') {
        const query = { companyId };
        if (automatizacion_id) {
          query.automation = automatizacion_id;
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

        const formattedLogs = logs.map(l => ({
          id: l._id.toString(),
          agente: l.agentName,
          fechaEjecucion: new Date(l.runAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
          estado: l.status,
          resultadoResumido: l.result ? l.result.substring(0, 200) + '...' : (l.error || 'Sin detalles'),
          conversacionId: l.conversationId || null
        }));

        return JSON.stringify({
          mensaje: `Se recuperaron ${logs.length} ejecuciones recientes.`,
          logs: formattedLogs
        });
      }

      return JSON.stringify({
        error: `Acción no reconocida "${accion}". Las acciones válidas son: crear, listar, actualizar, eliminar, ejecutar_ahora, ver_logs.`
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
