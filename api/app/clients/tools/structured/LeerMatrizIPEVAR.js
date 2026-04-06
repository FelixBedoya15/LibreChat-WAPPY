const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const GTC45Matrix = require('~/models/GTC45WorkspaceSession');

class LeerMatrizIPEVAR extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'leer_matriz_ipevar';
    this.description = [
      'Lee la base de datos y retorna una lista de todos los riesgos laborales y peligros actualmente documentados en la Matriz GTC-45 de la empresa para esta conversación.',
      'Usa esta herramienta SIEMPRE ANTES de registrar nuevos riesgos para conocer el contexto actual de la empresa, saber qué hace falta o si el usuario te pregunta por los riesgos existentes.',
      'No requiere argumentos para funcionar, solo invócala.'
    ].join(' ');
    this.req = fields.req;
    this.schema = z.object({});
  }

  async _call(_input, runManager) {
    try {
      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      if (!conversationId || conversationId === 'new') {
        const errorMsg = 'No se encontró un ID de conversación válido para leer la matriz.';
        console.error(`[LeerMatrizIPEVAR] ${errorMsg}`);
        return JSON.stringify({ error: errorMsg });
      }

      const session = await GTC45Matrix.findOne({ conversationId });
      
      if (!session || !session.matrixRows || session.matrixRows.length === 0) {
        return JSON.stringify({ 
          success: true, 
          message: 'La matriz IPEVAR actualmente está vacía. No hay riesgos registrados.',
          riesgos: [] 
        });
      }

      // Mapeo ligero para ahorrar tokens de IA (Solo enviamos los datos críticos)
      const dataReducida = session.matrixRows.map(r => ({
        Peligro: `[${r.peligro_clasificacion}] ${r.peligro_descripcion}`,
        Ubicacion: `${r.proceso} > ${r.zona} > ${r.actividad} > ${r.tareas}`,
        EvaluacionGTC45: `ND:${r.nd} NE:${r.ne} NC:${r.nc} NR:${r.nr} (${r.aceptabilidad})`,
      }));

      console.log(`[LeerMatrizIPEVAR] Leídos ${dataReducida.length} riesgos de la BD y enviados a la memoria del Agente AI.`);

      return JSON.stringify({
        success: true,
        message: 'Lectura exitosa del archivo maestro IPEVAR.',
        total_riesgos: dataReducida.length,
        riesgos_registrados: dataReducida
      });
      
    } catch (error) {
      console.error('[LeerMatrizIPEVAR Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error al intentar leer la matriz IPEVAR.',
        details: error.message,
      });
    }
  }
}

module.exports = LeerMatrizIPEVAR;
