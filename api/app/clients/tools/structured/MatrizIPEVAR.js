const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const GTC45Matrix = require('~/models/GTC45WorkspaceSession');

class MatrizIPEVAR extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'matriz_ipevar';
    this.description =
      'Añade, evalúa o actualiza riesgos laborales directamente en la Matriz GTC-45 de la conversación actual. Usa esta herramienta cuando el usuario pida documentar o evaluar un peligro en la matriz IPEVAR/GTC-45.';
    this.req = fields.req;
    // Cache conversationId at construction time; may be "new" initially
    this._cachedConversationId = fields.req?.body?.conversationId;
    this.schema = z.object({
      proceso: z.string().describe('El proceso o área general.'),
      zona: z.string().describe('Lugar o zona de trabajo.'),
      actividad: z.string().describe('Actividad específica que realiza el trabajador.'),
      tareas: z.string().describe('Descripción de las tareas específicas.'),
      rutinaria: z.enum(['Sí', 'No']).describe('¿Es una tarea rutinaria?'),
      peligro_descripcion: z
        .string()
        .describe('Descripción del peligro identificado (qué lo causa, cómo se manifiesta).'),
      peligro_clasificacion: z.string().describe('Clasificación (ej. Biomecánico, Físico, Químico).'),
      efectos_posibles: z.string().describe('Posibles efectos en la salud del trabajador.'),
      controles_fuente: z.string().default('Ninguno').describe('Controles en la fuente.'),
      controles_medio: z.string().default('Ninguno').describe('Controles en el medio.'),
      controles_individuo: z
        .string()
        .default('Ninguno')
        .describe('Controles en el individuo (epp, dotación).'),
      nd: z.number().describe('Nivel de Deficiencia (ND). Valores numéricos según la GTC-45.'),
      ne: z.number().describe('Nivel de Exposición (NE). Valores numéricos según la GTC-45.'),
      nc: z.number().describe('Nivel de Consecuencia (NC). Valores numéricos según la GTC-45.'),
    });
  }

  /**
   * Override invoke() to intercept the LangGraph RunnableConfig BEFORE _call is invoked.
   * LangGraph passes config via invoke(input, options) where options.configurable.thread_id
   * holds the real conversation (thread) ID. This is the ONLY reliable way to capture it
   * because _call() only receives (input, runManager) — the config never reaches it.
   */
  async invoke(input, options) {
    // Extract the real thread_id from LangGraph configurable metadata
    const threadId =
      options?.configurable?.thread_id ||
      options?.metadata?.thread_id ||
      options?.runId; // last-resort fallback

    if (threadId && threadId !== 'new') {
      this._cachedConversationId = threadId;
      console.log(`[MatrizIPEVAR Tool] invoke() capturó thread_id: ${threadId}`);
    }

    return super.invoke(input, options);
  }

  async _call(input) {
    try {
      // By the time _call runs, invoke() has already cached the conversationId.
      // Also try req.body as a final fallback (works for non-"new" conversations).
      const conversationId =
        this._cachedConversationId && this._cachedConversationId !== 'new'
          ? this._cachedConversationId
          : this.req?.body?.conversationId;

      if (!conversationId || conversationId === 'new') {
        const errorMsg = 'No se encontró un ID de conversación válido para guardar la matriz.';
        console.error(`[MatrizIPEVAR Tool] ${errorMsg}`);
        return JSON.stringify({ error: errorMsg });
      }

      console.log(`[MatrizIPEVAR Tool] Guardando datos en DB para convo: ${conversationId}`);

      // Autocalculate levels per GTC-45
      const nd = Number(input.nd) || 0;
      const ne = Number(input.ne) || 0;
      const np = nd * ne;
      const nc = Number(input.nc) || 0;
      const nr = np * nc;

      let interpretacion_nr = 'IV';
      if (nr >= 4000) interpretacion_nr = 'I';
      else if (nr >= 500) interpretacion_nr = 'I';
      else if (nr >= 150) interpretacion_nr = 'II';
      else if (nr >= 40) interpretacion_nr = 'III';

      const aceptabilidad =
        interpretacion_nr === 'I'
          ? 'No Aceptable'
          : interpretacion_nr === 'II'
            ? 'No Aceptable o Aceptable con Control Específico'
            : 'Aceptable';

      const row = {
        id: Date.now().toString(),
        ...input,
        np,
        nc,
        nr,
        interpretacion_nr,
        aceptabilidad,
      };

      const userId = this.req?.user?.id;

      // findOneAndUpdate uses conversationId as the unique key.
      // On insert (upsert), we also set the userId so the frontend GET route can find it.
      await GTC45Matrix.findOneAndUpdate(
        { conversationId },
        {
          $push: { matrixRows: row },
          // $setOnInsert only runs when the document is CREATED (first upsert).
          // This guarantees the user field is set correctly on creation.
          ...(userId ? { $setOnInsert: { user: userId } } : {}),
        },
        { upsert: true, new: true },
      );

      console.log('[MatrizIPEVAR Tool] Guardado exitoso.');

      return JSON.stringify({
        success: true,
        message: 'Riesgo agregado correctamente a la Matriz GTC-45.',
        saved_data: row,
      });
    } catch (error) {
      console.error('[MatrizIPEVAR Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error guardando el riesgo. Informa al usuario.',
        details: error.message,
      });
    }
  }
}

module.exports = MatrizIPEVAR;
