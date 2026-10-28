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
      'Google Flow & Studio (Veo 3.1 Lite & Nano Banana 2 Lite) + Biblioteca Multimedia WAPPY (30 días): Genera imágenes fotorrealistas en alta resolución con Google Imagen, clips de video cinematográficos en MP4 con Google Veo, o lista todos los recursos multimedia descargados de Google Flow (flow_*) y Google NotebookLM (nlm_*) guardados en el servidor para usarlos en el chat o en cualquier lienzo de Canvas.';

    this.schema = z.object({
      accion: z
        .enum(['generar_imagen', 'generar_video', 'listar_recursos'])
        .default('generar_imagen')
        .describe(
          'Acción a ejecutar: "generar_imagen" (usando Google Imagen / Nano Banana 2 Lite), "generar_video" (usando Google Veo 3.1 Lite) o "listar_recursos" (lista todas las imágenes, videos, infografías y audios descargados de Flow y NotebookLM en los últimos 30 días para incrustarlos en Canvas o consultarlos).',
        ),
      prompt: z
        .string()
        .optional()
        .describe(
          'Descripción detallada de la imagen o escena de video a generar (requerido cuando accion es "generar_imagen" o "generar_video").',
        ),
      filtro_fuente: z
        .enum(['all', 'flow', 'notebooklm'])
        .optional()
        .default('all')
        .describe('Filtro opcional cuando accion es "listar_recursos": "all" (todos), "flow" (solo Google Flow) o "notebooklm" (solo Google NotebookLM).'),
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
      filtro_fuente = 'all',
      aspecto = '16:9',
      estilo = 'fotorrealista',
      movimiento_camara = 'zoom_in',
    } = data || {};

    try {
      const {
        executeFlowImageGeneration,
        executeFlowVideoGeneration,
        listDownloadedMediaLibrary,
      } = require('~/server/routes/googleflow');

      if (accion === 'listar_recursos') {
        const items = await listDownloadedMediaLibrary(filtro_fuente);
        if (!items || items.length === 0) {
          return this.returnValue(
            'No se encontraron recursos descargados de Google Flow o NotebookLM en los últimos 30 días.',
          );
        }
        const rows = items.slice(0, 30).map((it, i) => {
          return `${i + 1}. **[${it.source === 'flow' ? 'Google Flow' : 'NotebookLM'}]** ${it.label} (\`${it.mediaType}\`) -> URL local: \`${it.publicUrl}\` (Expira en ${it.daysRemaining} días)`;
        });
        return this.returnValue(
          `### 🗂️ Biblioteca Multimedia WAPPY (Google Flow & NotebookLM — Retención 30 días)\nTotal recursos disponibles: **${items.length}**\n\n${rows.join('\n')}\n\n*(Puedes incrustar cualquiera de estas rutas \`/images/...\` directamente en informes Word, Presentaciones o Aplicativos HTML de Canvas).*`,
        );
      }

      if (!prompt) {
        return this.returnValue(
          'Por favor proporciona una descripción detallada (prompt) de la imagen o video a generar con Google Flow.',
        );
      }

      if (accion === 'generar_video') {
        logger.info(`[google_flow] Generando video para usuario ${this.userId}: "${prompt.slice(0, 60)}..."`);
        const vidRes = await executeFlowVideoGeneration({
          userId: this.userId,
          prompt,
          aspectRatio: aspecto,
          cameraMotion: movimiento_camara,
        });

        const markdown = `### 🎬 Video Generado con Google Flow Studio
[🎬 Reproducir Video (${vidRes.filename})](${vidRes.publicUrl}${vidRes.posterUrl ? `?poster=${encodeURIComponent(vidRes.posterUrl)}` : ''})

* **Prompt:** ${prompt}
* **Motor:** ${vidRes.model}
* **Formato:** \`${vidRes.aspectRatio}\` (${movimiento_camara})
* **Descargar MP4:** [⬇ Descargar Video (${vidRes.filename})](${vidRes.publicUrl})

*(INSTRUCCIÓN AL AGENTE: Incluye este enlace Markdown del video \`[🎬 Reproducir Video](${vidRes.publicUrl})\` exactamente así en tu respuesta; NO uses etiquetas HTML \`<video>\` crudas porque el reproductor de WAPPY renderiza automáticamente los enlaces \`.mp4\`).*`;

        return this.returnValue(markdown);
      } else {
        logger.info(`[google_flow] Generando imagen para usuario ${this.userId}: "${prompt.slice(0, 60)}..."`);
        const imgRes = await executeFlowImageGeneration({
          userId: this.userId,
          prompt,
          aspectRatio: aspecto,
          style: estilo,
        });

        const markdown = `### ✨ Imagen Generada con Google Flow Studio
![${prompt.slice(0, 100)}](${imgRes.publicUrl})

* **Prompt:** ${prompt}
* **Motor:** ${imgRes.model}
* **Formato:** \`${imgRes.aspectRatio}\`
* **Descargar:** [⬇ Descargar Imagen (${imgRes.filename})](${imgRes.publicUrl})`;

        return this.returnValue(markdown);
      }
    } catch (err) {
      logger.error('[google_flow] Error en herramienta:', err);
      return this.returnValue(`Error al generar con Google Flow: ${err.message}`);
    }
  }
}

module.exports = GoogleFlow;
