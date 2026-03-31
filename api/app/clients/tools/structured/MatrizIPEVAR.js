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
    this.schema = z.object({
      riesgos: z.array(z.object({
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
        controles_fuente: z.string().default('Ninguno').describe('Controles existentes en la fuente.'),
        controles_medio: z.string().default('Ninguno').describe('Controles existentes en el medio.'),
        controles_individuo: z
          .string()
          .default('Ninguno')
          .describe('Controles existentes en el individuo (epp, dotación).'),
        nd: z.number().describe('Nivel de Deficiencia (ND) numérico según GTC-45.'),
        ne: z.number().describe('Nivel de Exposición (NE) numérico según GTC-45.'),
        nc: z.number().describe('Nivel de Consecuencia (NC) numérico según GTC-45.'),
        medida_eliminacion: z.string().default('Ninguno').describe('Medidas de intervención: Eliminación del peligro.'),
        medida_sustitucion: z.string().default('Ninguno').describe('Medidas de intervención: Sustitución del peligro.'),
        medida_ingenieria: z.string().default('Ninguno').describe('Medidas de intervención: Controles de ingeniería propuestos.'),
        medida_administrativa: z.string().default('Ninguno').describe('Medidas de intervención: Controles administrativos.'),
        medida_eppu: z.string().default('Ninguno').describe('Medidas de intervención: Equipos de protección personal (EPP).'),
      })).describe('Lista masiva de riesgos. Si el contexto incluye múltiples procesos o peligros, debes insertarlos todos de una sola vez en este array. Procesa hasta 20 riesgos por llamado.')
    });
  }

  /**
   * _call receives (input, runManager) where runManager carries LangGraph metadata.
   * FORENSIC FINDING (2026-03-31):
   *   - LangGraph always injects thread_id into runManager.metadata.thread_id
   *   - runManager.configurable also contains thread_id
   *   - config/3rd arg is NEVER passed by LangChain's DynamicStructuredTool wrapper
   *   - This is the only reliable way to get conversationId inside a tool _call
   */
  async _call(input, runManager) {
    try {
      // ✅ PRIMARY: LangGraph thread_id via runManager
      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      if (!conversationId || conversationId === 'new') {
        const errorMsg = 'No se encontró un ID de conversación válido para guardar la matriz.';
        console.error(`[MatrizIPEVAR Tool] ${errorMsg}`);
        return JSON.stringify({ error: errorMsg });
      }

      const { riesgos } = input;
      if (!riesgos || !Array.isArray(riesgos)) {
        return JSON.stringify({ error: "El objeto debe contener un array 'riesgos'." });
      }

      console.log(`[MatrizIPEVAR Tool] Procesando ${riesgos.length} riesgos para convo: ${conversationId}`);

      const userId = this.req?.user?.id;
      
      // Obtener sesión única antes de iterar para evitar condiciones de carrera DB
      let session = await GTC45Matrix.findOne({ conversationId });
      
      if (!session) {
        session = new GTC45Matrix({
          conversationId,
          user: userId || undefined,
          matrixRows: []
        });
      }

      let insertedCount = 0;
      let updatedCount = 0;

      for (const riesgo of riesgos) {
        // Autocalculate levels per GTC-45
        const nd = Number(riesgo.nd) || 0;
        const ne = Number(riesgo.ne) || 0;
        const np = nd * ne;
        const nc = Number(riesgo.nc) || 0;
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
          ...riesgo,
          np,
          nc,
          nr,
          interpretacion_nr,
          aceptabilidad,
        };

        // Find existing row using a composite key
        const targetIndex = session.matrixRows.findIndex(r => 
          r.proceso?.toLowerCase() === riesgo.proceso?.toLowerCase() &&
          r.actividad?.toLowerCase() === riesgo.actividad?.toLowerCase() &&
          r.peligro_clasificacion?.toLowerCase() === riesgo.peligro_clasificacion?.toLowerCase()
        );

        if (targetIndex !== -1) {
          // UPDATE
          session.matrixRows[targetIndex] = { ...session.matrixRows[targetIndex], ...row };
          updatedCount++;
        } else {
          // INSERT NEW
          // Asegurar IDs únicos por fila
          row.id = Date.now().toString() + Math.random().toString(36).substring(7);
          session.matrixRows.push(row);
          insertedCount++;
        }
      }

      // Ensure user inheritance for orphaned sessions during upsert
      if (!session.user && userId) {
        session.user = userId;
      }
      
      // Mongoose needs this flag if we modify mixed Arrays manually
      session.markModified('matrixRows');
      await session.save();

      console.log(`[MatrizIPEVAR Tool] Transacción Masiva Exitosa. Insertados: ${insertedCount}, Actualizados: ${updatedCount}`);

      return JSON.stringify({
        success: true,
        message: `Operación masiva completada satisfactoriamente. Se procesaron ${riesgos.length} riesgos.`,
        stats: { insertados: insertedCount, actualizados: updatedCount }
      });
    } catch (error) {
      console.error('[MatrizIPEVAR Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error procesando el arreglo de riesgos masivos.',
        details: error.message,
      });
    }
  }
}

module.exports = MatrizIPEVAR;
