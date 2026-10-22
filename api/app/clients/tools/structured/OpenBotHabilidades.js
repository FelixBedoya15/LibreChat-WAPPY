const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const CompanyInfo = require('~/models/CompanyInfo');
const {
  buildGenerativeWidgetForTool,
  manageProceduralMemory,
} = require('~/server/routes/voice/tenshiOpenBotEngine');

/**
 * Herramienta Estructurada 1: WidgetInteractivoSST (Generative UI / AG-UI para todos los Agentes)
 * Permite a cualquiera de los 21+ agentes especialistas desplegar tarjetas interactivas en vivo
 * dentro del chat principal (/c/...): Simulador GTC-45 NDxNExNC y Listas de Chequeo Interactivas.
 */
class WidgetInteractivoSST extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'wappy_renderizar_widget_interactivo';
    this.description =
      'Despliega un widget o tarjeta interactiva en vivo (Generative UI / AG-UI) directamente dentro del chat para que el usuario interactúe en pantalla: ' +
      '(1) "risk_calculator": Simulador interactivo GTC-45 con selectores ND x NE x NC en tiempo real; ' +
      '(2) "inspection_checklist": Lista de chequeo interactiva con casillas verificables y barra de progreso (Alturas, PESV, Químicos SGA, Extintores, Botiquín, etc.).';
    this.req = fields.req;

    this.schema = z.object({
      tipo_widget: z
        .enum(['risk_calculator', 'inspection_checklist'])
        .describe('Tipo de widget interactivo a renderizar en el chat.'),
      titulo: z.string().optional().describe('Título del widget interactivo.'),
      subtitulo: z.string().optional().describe('Subtítulo descriptivo.'),
      peligro: z
        .string()
        .optional()
        .describe('Descripción del peligro a simular (para risk_calculator).'),
      proceso: z
        .string()
        .optional()
        .describe('Proceso o cargo evaluado (para risk_calculator).'),
      nd: z
        .coerce.number()
        .optional()
        .describe('Nivel de Deficiencia inicial: 0, 2, 6 o 10 (para risk_calculator).'),
      ne: z
        .coerce.number()
        .optional()
        .describe('Nivel de Exposición inicial: 1, 2, 3 o 4 (para risk_calculator).'),
      nc: z
        .coerce.number()
        .optional()
        .describe('Nivel de Consecuencia inicial: 10, 25, 60 o 100 (para risk_calculator).'),
      items: z
        .array(z.string())
        .optional()
        .describe('Lista de ítems verificables para inspection_checklist.'),
    });
  }

  async _call(input) {
    try {
      const widget = buildGenerativeWidgetForTool(
        'wappy_renderizar_widget_interactivo',
        input || {},
        null,
      );
      return JSON.stringify({
        exito: true,
        mensaje: `Widget interactivo "${widget?.title || input?.tipo_widget}" desplegado exitosamente en el chat del usuario.`,
        widget,
      });
    } catch (err) {
      return JSON.stringify({
        exito: false,
        error: `Error al generar widget interactivo: ${err.message}`,
      });
    }
  }
}

/**
 * Herramienta Estructurada 2: MemoriaProcedimentalSST (Colmena de Hábitos Operativos para todos los Agentes)
 * Permite a cualquiera de los 21+ agentes especialistas guardar, consultar o eliminar hábitos y reglas
 * operativas de la empresa en la misma base de datos compartida con Tenshi.
 */
class MemoriaProcedimentalSST extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'wappy_memoria_procedimental';
    this.description =
      'Gestiona la Memoria Procedural y de Hábitos Operativos de la empresa (compartida entre Tenshi y todos los especialistas). ' +
      'Úsala cuando el usuario te enseñe una regla, costumbre o flujo obligatorio ("siempre que pase X, recuerda hacer Y", "en esta empresa acostumbramos...") ' +
      'o cuando pida consultar o borrar los hábitos aprendidos.';
    this.req = fields.req;

    this.schema = z.object({
      accion: z
        .enum(['guardar', 'listar', 'eliminar'])
        .describe('Acción a ejecutar: "guardar" nuevo hábito, "listar" hábitos activos o "eliminar" uno existente.'),
      categoria: z
        .string()
        .optional()
        .describe('Categoría: "habito_empresa", "aprobacion_critica", "preferencia_formato", "notificacion" o "criterio_evaluacion".'),
      disparador: z
        .string()
        .optional()
        .describe('Condición o evento disparador (ej: "Cuando se programe trabajo en alturas").'),
      regla: z
        .string()
        .optional()
        .describe('Regla o procedimiento obligatorio que todos los agentes deben aplicar.'),
      id: z.string().optional().describe('ID o palabra clave del hábito a eliminar.'),
    });
  }

  async _call(input) {
    try {
      const userId = this.req?.user?.id || this.req?.user?._id;
      if (!userId) {
        return JSON.stringify({
          exito: false,
          error: 'No se identificó el usuario activo para gestionar la memoria procedimental.',
        });
      }

      let activeCompany = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
      if (!activeCompany) {
        activeCompany = await CompanyInfo.findOne({ user: userId }).sort({ updatedAt: -1 }).lean();
      }

      const memRes = await manageProceduralMemory(
        input || {},
        userId,
        activeCompany?._id || null,
        activeCompany?.companyName || '',
      );

      return JSON.stringify({
        exito: memRes.exito,
        mensaje: memRes.mensaje,
        habitos: memRes.result?.habitos || memRes.widget?.data?.items || [],
        widget: memRes.widget,
      });
    } catch (err) {
      return JSON.stringify({
        exito: false,
        error: `Error gestionando memoria procedimental: ${err.message}`,
      });
    }
  }
}

module.exports = {
  WidgetInteractivoSST,
  MemoriaProcedimentalSST,
};
