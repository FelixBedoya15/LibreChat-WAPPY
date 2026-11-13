const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { ContentTypes, EImageOutputType } = require('librechat-data-provider');

function buildMediaLocations(rawUrl = '', fullPath = '') {
  const cleaned = String(rawUrl || '')
    .replace(/https?:\/\/(?:www\.)?wappy-ia\.com/gi, 'https://wappy.club')
    .trim();
  const relMatch = cleaned.match(/(\/images\/[^\s"'?#)]+(?:\?[^\s"')#]*)?)/i);
  const relativeUrl = relMatch
    ? relMatch[1]
    : cleaned.startsWith('/')
      ? cleaned
      : `/images/${path.basename(cleaned || '')}`;
  const pathOnly = relativeUrl.split('?')[0];
  const absoluteUrl = /^https?:\/\//i.test(cleaned)
    ? cleaned.replace(/https?:\/\/(?:www\.)?[^/]+/i, 'https://wappy.club')
    : `https://wappy.club${relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`}`;

  let localPath = fullPath && fs.existsSync(fullPath) ? fullPath : null;
  if (!localPath && pathOnly.startsWith('/images/')) {
    const candidate = path.join(process.cwd(), 'client', 'public', pathOnly.replace(/^\//, ''));
    if (fs.existsSync(candidate)) {
      localPath = candidate;
    }
  }
  return { relativeUrl, absoluteUrl, localPath };
}

class GoogleFlow extends Tool {
  static lc_name() {
    return 'google_flow';
  }

  constructor(fields = {}) {
    super();

    this.userId = fields.userId || fields.req?.user?.id;
    this.companyId = fields.companyId || fields.req?.companyId || fields.req?.body?.companyId || null;
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

  returnValue(val, artifact = {}) {
    if (this.isAgent && typeof val === 'string') {
      return [val, artifact];
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
          companyId: this.companyId,
          prompt,
          aspectRatio: aspecto,
          cameraMotion: movimiento_camara,
        });

        const mediaLoc = buildMediaLocations(vidRes.publicUrl, vidRes.fullPath);
        const mediaMeta = {
          ok: true,
          type: 'video',
          filename: vidRes.filename,
          localPath: mediaLoc.localPath,
          videoUrl: mediaLoc.relativeUrl,
          publicUrl: mediaLoc.relativeUrl,
          relativeUrl: mediaLoc.relativeUrl,
          absoluteUrl: mediaLoc.absoluteUrl,
          posterUrl: vidRes.posterUrl || null,
          model: vidRes.model,
          aspectRatio: vidRes.aspectRatio,
          cameraMotion: movimiento_camara,
        };

        const markdown = `### 🎬 Video Generado con Google Flow Studio
[🎬 Reproducir Video (${vidRes.filename})](${vidRes.publicUrl}${vidRes.posterUrl ? `?poster=${encodeURIComponent(vidRes.posterUrl)}` : ''})

* **Prompt:** ${prompt}
* **Motor:** ${vidRes.model}
* **Formato:** \`${vidRes.aspectRatio}\` (${movimiento_camara})
* **URL Pública:** ${mediaLoc.absoluteUrl}

\`\`\`json
${JSON.stringify(mediaMeta)}
\`\`\`

*(INSTRUCCIÓN CRÍTICA AL AGENTE: Incluye únicamente UNA VEZ el enlace Markdown del video \`[🎬 Reproducir Video (${vidRes.filename})](${vidRes.publicUrl})\` en tu respuesta. NO agregues un segundo enlace \`[⬇ Descargar Video]\` separado ni etiquetas \`<video>\` crudas ni repitas el bloque JSON técnico, ya que el reproductor interactivo de WAPPY muestra el video con su propio botón de descarga integrado).*`;

        return this.returnValue(markdown, mediaMeta);
      } else {
        logger.info(`[google_flow] Generando imagen para usuario ${this.userId}: "${prompt.slice(0, 60)}..."`);
        const imgRes = await executeFlowImageGeneration({
          userId: this.userId,
          companyId: this.companyId,
          prompt,
          aspectRatio: aspecto,
          style: estilo,
        });

        const mediaLoc = buildMediaLocations(imgRes.publicUrl, imgRes.fullPath);
        const mediaMeta = {
          ok: true,
          type: 'image',
          filename: imgRes.filename,
          localPath: mediaLoc.localPath,
          imageUrl: mediaLoc.relativeUrl,
          publicUrl: mediaLoc.relativeUrl,
          relativeUrl: mediaLoc.relativeUrl,
          absoluteUrl: mediaLoc.absoluteUrl,
          model: imgRes.model,
          aspectRatio: imgRes.aspectRatio,
        };

        const markdown = `### ✨ Imagen Generada (${imgRes.model || 'Google Flow Studio'})
![${prompt.slice(0, 100)}](${imgRes.publicUrl})

* **Prompt:** ${prompt}
* **Motor:** ${imgRes.model}
* **Formato:** \`${imgRes.aspectRatio}\`
* **URL Pública:** ${mediaLoc.absoluteUrl}

\`\`\`json
${JSON.stringify(mediaMeta)}
\`\`\`

*(INSTRUCCIÓN CRÍTICA AL AGENTE: Incluye en tu respuesta ÚNICAMENTE UNA SOLA VEZ la imagen en Markdown \`![${prompt.slice(0, 60)}](${imgRes.publicUrl})\` usando la ruta exacta \`${imgRes.publicUrl}\`. PROHIBIDO agregar un segundo enlace \`[⬇ Descargar Imagen](${imgRes.publicUrl})\` debajo ni repetir el bloque JSON técnico porque la tarjeta visual de WAPPY ya incluye automáticamente la vista previa y el botón de descarga en una sola tarjeta).*`;

        return this.returnValue(markdown, mediaMeta);
      }
    } catch (err) {
      logger.error('[google_flow] Error en herramienta:', err);
      return this.returnValue(`Error al generar con Google Flow: ${err.message}`);
    }
  }
}

module.exports = GoogleFlow;
