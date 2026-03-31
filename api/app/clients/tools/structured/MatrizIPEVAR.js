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
      nd: z.number().describe('Nivel de Deficiencia (ND). Valores numéricos según la GTC-45.'),
      ne: z.number().describe('Nivel de Exposición (NE). Valores numéricos según la GTC-45.'),
      nc: z.number().describe('Nivel de Consecuencia (NC). Valores numéricos según la GTC-45.'),
      medida_eliminacion: z.string().default('Ninguno').describe('Medidas de intervención: Eliminación del peligro.'),
      medida_sustitucion: z.string().default('Ninguno').describe('Medidas de intervención: Sustitución del peligro.'),
      medida_ingenieria: z.string().default('Ninguno').describe('Medidas de intervención: Controles de ingeniería propuestos.'),
      medida_administrativa: z.string().default('Ninguno').describe('Medidas de intervención: Controles administrativos propuestos (capacitación, pausas).'),
      medida_eppu: z.string().default('Ninguno').describe('Medidas de intervención: Equipos de protección personal (EPP) propuestos.'),
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
      // ✅ PRIMARY: LangGraph thread_id via runManager (PROVEN to work via test)
      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      console.log('[MatrizIPEVAR Tool] Debug conversationId sources:', {
        'runManager.configurable.thread_id': runManager?.configurable?.thread_id,
        'runManager.metadata.thread_id': runManager?.metadata?.thread_id,
        'req.body.conversationId': this.req?.body?.conversationId,
        resolved: conversationId,
      });

      if (!conversationId || conversationId === 'new') {
        const errorMsg = 'No se encontró un ID de conversación válido para guardar la matriz.';
        console.error(`[MatrizIPEVAR Tool] ${errorMsg}`);
        return JSON.stringify({ error: errorMsg });
      }

      console.log(`[MatrizIPEVAR Tool] Guardando/Actualizando datos en DB para convo: ${conversationId}`);

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
        ...input,
        np,
        nc,
        nr,
        interpretacion_nr,
        aceptabilidad,
      };

      const userId = this.req?.user?.id;

      // Logica de Actualización Inteligente (Smart Upsert por proceso, actividad y tareas)
      let session = await GTC45Matrix.findOne({ conversationId });
      
      let isUpdate = false;
      if (!session) {
        // Create new session
        row.id = Date.now().toString();
        session = new GTC45Matrix({
          conversationId,
          user: userId || undefined,
          matrixRows: [row]
        });
      } else {
        // Find existing row using a composite key: proceso + actividad + peligro_clasificacion
        const targetIndex = session.matrixRows.findIndex(r => 
          r.proceso?.toLowerCase() === input.proceso?.toLowerCase() &&
          r.actividad?.toLowerCase() === input.actividad?.toLowerCase() &&
          r.peligro_clasificacion?.toLowerCase() === input.peligro_clasificacion?.toLowerCase()
        );

        if (targetIndex !== -1) {
          // UPDATE
          isUpdate = true;
          // Merge old row with new data, keeping original ID
          session.matrixRows[targetIndex] = { ...session.matrixRows[targetIndex], ...row };
        } else {
          // INSERT NEW
          row.id = Date.now().toString();
          session.matrixRows.push(row);
        }
        
        // Ensure user inheritance for orphaned sessions during upsert
        if (!session.user && userId) {
          session.user = userId;
        }
        
        // Mongoose needs this flag if we modify mixed Arrays manually
        session.markModified('matrixRows');
      }

      await session.save();

      console.log(`[MatrizIPEVAR Tool] ${isUpdate ? 'Actualización' : 'Guardado nuevo'} exitoso.`);

      return JSON.stringify({
        success: true,
        message: isUpdate ? 'Riesgo actualizado correctamente en la Matriz GTC-45.' : 'Riesgo agregado correctamente a la Matriz GTC-45.',
        saved_data: isUpdate ? session.matrixRows.find(r => r.proceso === input.proceso && r.actividad === input.actividad && r.peligro_clasificacion === input.peligro_clasificacion) : row,
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
