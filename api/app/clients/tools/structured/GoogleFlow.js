const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { ContentTypes, EImageOutputType } = require('librechat-data-provider');

class GoogleFlow extends Tool {
  static lc_name() {
    return 'google_flow';
  }

  constructor(fields = {}) {
    super();

    this.userId = fields.userId || fields.req?.user?.id;
    this.req = fields.req;
    this.isAgent = fields.isAgent ?? true;
    this.imageOutputType = fields.imageOutputType || EImageOutputType.PNG;

    this.name = 'google_flow';
    this.description =
      'Google Flow & Studio (Veo & Imagen): Genera imágenes fotorrealistas de alta resolución con Google Imagen y clips de video cinematográficos en MP4 con Google Veo, entregándolos directamente en el chat del usuario.';

    this.schema = z.object({
      accion: z
        .enum(['generar_imagen', 'generar_video'])
        .default('generar_imagen')
        .describe(
          'Acción a ejecutar: "generar_imagen" (usando Google Imagen / Nano Banana) o "generar_video" (usando Google Veo).',
        ),
      prompt: z
        .string()
        .describe(
          'Descripción detallada de la imagen o escena de video a generar (incluyendo iluminación, ambiente, sujetos y detalles visuales).',
        ),
      aspecto: z
        .enum(['16:9', '9:16', '1:1'])
        .optional()
        .default('16:9')
        .describe('Relación de aspecto: "16:9" (horizontal), "9:16" (vertical/Reels), "1:1" (cuadrada).'),
      estilo: z
        .enum(['fotorrealista', '3d_render', 'ilustracion_tecnica', 'afiche_seguridad'])
        .optional()
        .default('fotorrealista')
        .describe('Estilo visual deseado para la generación.'),
      movimiento_camara: z
        .enum(['zoom_in', 'zoom_out', 'orbit', 'pan_right', 'pan_left'])
        .optional()
        .default('zoom_in')
        .describe('Movimiento de cámara cuando accion es "generar_video".'),
    });
  }

  returnValue(val) {
    if (this.isAgent && typeof val === 'string') {
      return [val, {}];
    }
    return val;
  }

  async _call(data) {
    const {
      accion = 'generar_imagen',
      prompt,
      aspecto = '16:9',
      estilo = 'fotorrealista',
      movimiento_camara = 'zoom_in',
    } = data || {};

    if (!prompt) {
      return this.returnValue(
        'Por favor proporciona una descripción detallada (prompt) de la imagen o video a generar con Google Flow.',
      );
    }

    try {
      const {
        executeFlowImageGeneration,
        executeFlowVideoGeneration,
      } = require('~/server/routes/googleflow');

      if (accion === 'generar_video') {
        logger.info(`[google_flow] Generando video para usuario ${this.userId}: "${prompt.slice(0, 60)}..."`);
        const vidRes = await executeFlowVideoGeneration({
          userId: this.userId,
          prompt,
          aspectRatio: aspecto,
          cameraMotion: movimiento_camara,
        });

        const markdown = `### 🎬 Video Generado con Google Flow Studio
<video src="${vidRes.publicUrl}" ${vidRes.posterUrl ? `poster="${vidRes.posterUrl}"` : ''} controls autoplay loop playsinline style="max-width: 100%; border-radius: 14px; margin: 10px 0;"></video>

* **Prompt:** ${prompt}
* **Motor:** ${vidRes.model}
* **Formato:** \`${vidRes.aspectRatio}\` (${movimiento_camara})
* **Descargar MP4:** [⬇ Descargar Video (${vidRes.filename})](${vidRes.publicUrl})`;

        return this.returnValue(markdown);
      } else {
        logger.info(`[google_flow] Generando imagen para usuario ${this.userId}: "${prompt.slice(0, 60)}..."`);
        const imgRes = await executeFlowImageGeneration({
          userId: this.userId,
          prompt,
          aspectRatio: aspecto,
          style: estilo,
        });

        const base64String = imgRes.buffer.toString('base64');
        const markdown = `### ✨ Imagen Generada con Google Flow Studio
![${prompt.slice(0, 100)}](${imgRes.publicUrl})

* **Prompt:** ${prompt}
* **Motor:** ${imgRes.model}
* **Formato:** \`${imgRes.aspectRatio}\`
* **Descargar PNG:** [⬇ Descargar Imagen (${imgRes.filename})](${imgRes.publicUrl})`;

        if (this.isAgent) {
          const content = [
            {
              type: ContentTypes.IMAGE_URL,
              image_url: {
                url: `data:${imgRes.mimeType};base64,${base64String}`,
              },
            },
          ];
          const responseMsg = [
            {
              type: ContentTypes.TEXT,
              text: markdown,
            },
          ];
          return [responseMsg, { content, file_ids: [imgRes.fileId] }];
        }

        return markdown;
      }
    } catch (err) {
      logger.error('[google_flow] Error en herramienta:', err);
      return this.returnValue(`Error al generar con Google Flow: ${err.message}`);
    }
  }
}

module.exports = GoogleFlow;
