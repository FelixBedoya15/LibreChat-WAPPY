const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const GTC45Matrix = require('~/models/GTC45WorkspaceSession');

class LeerMatrizIPEVAR extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'leer_matriz_ipevar';
    this.description =
      'Consulta los riesgos laborales ya registrados en la Matriz GTC-45 de la conversación actual. Usa esta herramienta ANTES de actualizar la matriz si necesitas saber si un peligro o proceso ya existe, conocer sus valores actuales (ND, NE, NC), o verificar los controles existentes.';
    this.req = fields.req;
    this.schema = z.object({
      proceso: z.string().optional().describe('Filtrar por proceso o área general.'),
      actividad: z.string().optional().describe('Filtrar por actividad específica.'),
      peligro_clasificacion: z.string().optional().describe('Filtrar por clasificación de peligro (ej. Biomecánico, Psicosocial).'),
    }).describe('Parámetros opcionales para filtrar la búsqueda en la matriz.');
  }

  async _call(input, runManager) {
    try {
      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      if (!conversationId || conversationId === 'new') {
        const errorMsg = 'No hay una conversación activa guardada para consultar. La matriz está vacía.';
        console.warn(`[LeerMatrizIPEVAR Tool] ${errorMsg}`);
        return JSON.stringify({ error: errorMsg, resultados: [] });
      }

      console.log(`[LeerMatrizIPEVAR Tool] Consultando matriz para convo: ${conversationId}`);

      const session = await GTC45Matrix.findOne({ conversationId });
      
      if (!session || !session.matrixRows || session.matrixRows.length === 0) {
        return JSON.stringify({ 
          mensaje: "La matriz IPEVAR está vacía para esta conversación. No hay riesgos registrados aún.",
          resultados: [] 
        });
      }

      const { proceso, actividad, peligro_clasificacion } = input;
      let rows = session.matrixRows;

      if (proceso) {
        rows = rows.filter(r => r.proceso && r.proceso.toLowerCase().includes(proceso.toLowerCase()));
      }
      if (actividad) {
        rows = rows.filter(r => r.actividad && r.actividad.toLowerCase().includes(actividad.toLowerCase()));
      }
      if (peligro_clasificacion) {
        rows = rows.filter(r => r.peligro_clasificacion && r.peligro_clasificacion.toLowerCase().includes(peligro_clasificacion.toLowerCase()));
      }

      console.log(`[LeerMatrizIPEVAR Tool] Búsqueda retornó ${rows.length} resultados.`);

      return JSON.stringify({
        totalRegistrosEnLaMatriz: session.matrixRows.length,
        resultadosFiltrados: rows.length,
        resultados: rows
      });

    } catch (error) {
      console.error('[LeerMatrizIPEVAR Tool] Error:', error);
      return JSON.stringify({ error: 'Hubo un error al leer la base de datos de la matriz.' });
    }
  }
}

module.exports = LeerMatrizIPEVAR;
