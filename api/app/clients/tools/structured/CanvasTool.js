const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const CanvasSession = require('~/models/CanvasSession');

/**
 * Canvas Tool (Solo lectura en el backend de la IA)
 * Permite al agente consultar y leer el contenido actual del lienzo (Canvas).
 * La escritura y edición se realizan mediante marcas :::canvas en streaming en el chat.
 */
class CanvasTool extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'canvas';
    this.description =
      'Herramienta de consulta del lienzo (Canvas). Úsala ÚNICAMENTE con la acción "leer" para inspeccionar y ver el contenido actual del documento cargado en el Canvas del usuario antes de sugerir cambios o adiciones.';
    this.req = fields.req;

    this.schema = z.object({
      accion: z
        .enum(['leer'])
        .describe(
          'Acción a realizar: "leer" para inspeccionar y consultar el contenido y estado actual del Canvas del usuario.',
        ),
    });
  }

  async _call(input, runManager) {
    try {
      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      if (!conversationId || conversationId === 'new') {
        return JSON.stringify({
          error:
            'No se encontró un ID de conversación válido. Asegúrate de que el chat esté iniciado.',
        });
      }

      const { accion } = input;

      if (accion !== 'leer') {
        return JSON.stringify({
          error: 'Acción no permitida. Para escribir o editar el Canvas, utiliza la directiva :::canvas directamente en tu respuesta de chat.',
        });
      }

      const session = await CanvasSession.findOne({ conversationId });
      if (!session) {
        return JSON.stringify({
          mensaje: 'El Canvas está actualmente vacío.',
          content: '',
          title: 'Archivo sin título',
          fileType: 'text',
        });
      }

      return JSON.stringify({
        mensaje: 'Canvas leído correctamente.',
        title: session.title,
        fileType: session.fileType,
        version: session.version,
        content: session.content || '',
      });
    } catch (error) {
      console.error('[CanvasTool ERROR]:', error);
      return JSON.stringify({
        error: `Error interno al consultar el Canvas: ${error.message}`,
      });
    }
  }
}

module.exports = CanvasTool;
