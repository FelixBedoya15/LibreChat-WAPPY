const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const GTC45Matrix = require('~/models/GTC45WorkspaceSession');

class MatrizIPEVAR extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'matriz_ipevar';
    this.description =
      'Lee, añade, evalúa o actualiza riesgos laborales directamente en la Matriz GTC-45 de la conversación actual. Usa esta herramienta para leer, documentar o evaluar un peligro en la matriz IPEVAR/GTC-45.';
    this.req = fields.req;
    this.schema = z.object({
      accion: z.enum(['leer', 'escribir']).describe('Selecciona "leer" si solo necesitas consultar la matriz. Selecciona "escribir" si vas a guardar o actualizar riesgos.'),
      filtro_proceso: z.string().optional().describe('Si accion es "leer", puedes filtrar por proceso o área general.'),
      filtro_actividad: z.string().optional().describe('Si accion es "leer", puedes filtrar por actividad.'),
      filtro_peligro: z.string().optional().describe('Si accion es "leer", puedes filtrar por clasificación de peligro.'),
      riesgos: z.array(z.object({
        proceso: z.string().describe('El proceso o área general.'),
        zona: z.string().describe('Lugar o zona de trabajo.'),
        actividad: z.string().describe('Actividad específica que realiza el trabajador.'),
        tareas: z.string().describe('Descripción de las tareas específicas.'),
        rutinaria: z.enum(['Sí', 'No']).describe('¿Es una tarea rutinaria?'),
        peligro_descripcion: z
          .string()
          .describe('Descripción del riesgo. CRÍTICO: Si el peligro_clasificacion es "Psicosocial", DEBES extraer y prefijar estrictamente el "Dominio" y la "Dimensión". Ej: "[Dominio: Demandas del trabajo - Dimensión: Carga mental] Descripción...". Para otros peligros, describe normalmente.'),
        peligro_clasificacion: z.string().describe('Clasificación (ej. Biomecánico, Físico, Químico).'),
        efectos_posibles: z.string().describe('Posibles efectos en la salud del trabajador.'),
        controles_fuente: z.string().default('Ninguno').describe('Controles en la fuente.'),
        controles_medio: z.string().default('Ninguno').describe('Controles en el medio.'),
        controles_individuo: z.string().default('Ninguno').describe('Controles en el individuo.'),
        nd: z.number().describe('Nivel de Deficiencia (ND).'),
        ne: z.number().describe('Nivel de Exposición (NE).'),
        nc: z.number().describe('Nivel de Consecuencia (NC).'),
        medida_eliminacion: z.string().default('Ninguno').describe('Medidas: Eliminación.'),
        medida_sustitucion: z.string().default('Ninguno').describe('Medidas: Sustitución.'),
        medida_ingenieria: z.string().default('Ninguno').describe('Medidas: Controles de ingeniería.'),
        medida_administrativa: z.string().default('Ninguno').describe('Medidas: Administrativos.'),
        medida_eppu: z.string().default('Ninguno').describe('Medidas: EPP.'),
        factores_reduccion: z.string().default('No aplica').describe('Factores de reducción.'),
        nd_cualitativo: z.number().optional().describe('ND cualitativo (MA=10, A=6, M=2, B=0).'),
      })).optional().describe('Lista de riesgos. OBLIGATORIO si accion="escribir". Vacío si accion="leer".')
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

      const { accion, riesgos, filtro_proceso, filtro_actividad, filtro_peligro } = input;

      // Obtener sesión
      let session = await GTC45Matrix.findOne({ conversationId });
      
      // LOGICA DE LECTURA
      if (accion === 'leer') {
        console.log(`[MatrizIPEVAR Tool] LECTURA para convo: ${conversationId}`);
        if (!session || !session.matrixRows || session.matrixRows.length === 0) {
          return JSON.stringify({ mensaje: 'La matriz está vacía. No hay riesgos registrados aún.', resultados: [] });
        }
        
        let rows = session.matrixRows;
        if (filtro_proceso) {
          rows = rows.filter(r => r.proceso && r.proceso.toLowerCase().includes(filtro_proceso.toLowerCase()));
        }
        if (filtro_actividad) {
          rows = rows.filter(r => r.actividad && r.actividad.toLowerCase().includes(filtro_actividad.toLowerCase()));
        }
        if (filtro_peligro) {
          rows = rows.filter(r => r.peligro_clasificacion && r.peligro_clasificacion.toLowerCase().includes(filtro_peligro.toLowerCase()));
        }
        
        return JSON.stringify({
          mensaje: `Se encontraron ${rows.length} riesgos.`,
          totalRegistros: session.matrixRows.length,
          resultados: rows
        });
      }

      // LOGICA DE ESCRITURA
      if (!riesgos || !Array.isArray(riesgos)) {
        return JSON.stringify({ error: "El objeto debe contener un array 'riesgos' para escribir." });
      }

      console.log(`[MatrizIPEVAR Tool] Procesando ${riesgos.length} riesgos para convo: ${conversationId}`);

      const userId = this.req?.user?.id;
      
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
