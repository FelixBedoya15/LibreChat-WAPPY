const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const LiveEditorSession = require('~/models/LiveEditorSession');

/**
 * EditorLive Tool
 * Permite al agente leer y editar el documento vivo de la conversación actual.
 * El panel React detecta los cambios mediante polling y actualiza el LiveEditor en tiempo real.
 */
class EditorLive extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'editor_live';
    this.description =
      'Lee y edita el documento activo del Editor Live en esta conversación. Úsalo para crear documentos desde cero, editar secciones específicas, buscar y reemplazar texto, insertar contenido, o leer el estado actual del documento. El usuario ve los cambios en tiempo real en el panel lateral.';
    this.req = fields.req;

    this.schema = z.object({
      accion: z
        .enum(['leer', 'escribir', 'editar_seccion', 'buscar_reemplazar', 'insertar'])
        .describe(
          'Acción a ejecutar: "leer" para consultar el documento actual; "escribir" para reemplazar el contenido completo; "editar_seccion" para editar solo una sección por título; "buscar_reemplazar" para reemplazar texto específico; "insertar" para agregar contenido al inicio, fin, o después de un bloque.',
        ),

      // Para accion="escribir"
      content: z
        .string()
        .optional()
        .describe(
          'Contenido HTML completo del documento. OBLIGATORIO para accion="escribir". Genera HTML profesional con títulos (h1-h3), párrafos, tablas y listas formateadas. NO incluyas bloques de código (```html). Solo HTML limpio.',
        ),

      fileName: z
        .string()
        .optional()
        .describe('Nombre descriptivo del documento (ej: "Política SST – ACME S.A.S."). Solo para accion="escribir".'),

      // Para accion="editar_seccion"
      titulo_seccion: z
        .string()
        .optional()
        .describe(
          'Título exacto (o fragmento) de la sección a editar. El sistema buscará el bloque de texto bajo ese título y lo reemplazará. Requerido para accion="editar_seccion".',
        ),

      nuevo_contenido_seccion: z
        .string()
        .optional()
        .describe(
          'Nuevo contenido HTML para reemplazar la sección identificada por titulo_seccion. Requerido para accion="editar_seccion".',
        ),

      // Para accion="buscar_reemplazar"
      buscar: z
        .string()
        .optional()
        .describe('Texto exacto o fragmento a buscar en el documento. Requerido para accion="buscar_reemplazar".'),

      reemplazar: z
        .string()
        .optional()
        .describe('Texto que reemplazará al encontrado. Requerido para accion="buscar_reemplazar".'),

      reemplazar_todo: z
        .boolean()
        .optional()
        .default(true)
        .describe('Si true (por defecto), reemplaza todas las ocurrencias. Si false, solo la primera.'),

      // Para accion="insertar"
      posicion: z
        .enum(['inicio', 'fin', 'despues_de'])
        .optional()
        .describe('Dónde insertar: "inicio" = al principio del documento, "fin" = al final, "despues_de" = después de un bloque con el texto indicado en "insertar_despues_de_texto".'),

      insertar_contenido: z
        .string()
        .optional()
        .describe('Contenido HTML a insertar. Requerido para accion="insertar".'),

      insertar_despues_de_texto: z
        .string()
        .optional()
        .describe('Texto o fragmento de título después del cual se insertará el nuevo contenido. Solo cuando posicion="despues_de".'),
    });
  }

  async _call(input, runManager) {
    try {
      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      if (!conversationId || conversationId === 'new') {
        return JSON.stringify({ error: 'No se encontró un ID de conversación válido. Asegúrate de que el chat esté iniciado.' });
      }

      const userId = this.req?.user?.id;
      const { accion } = input;

      // ── LEER ────────────────────────────────────────────────────────────────
      if (accion === 'leer') {
        const session = await LiveEditorSession.findOne({ conversationId });
        if (!session || !session.content) {
          return JSON.stringify({
            mensaje: 'El documento está vacío. Puedes crear uno nuevo con accion="escribir".',
            content: '',
            fileName: 'Documento sin título',
          });
        }
        // Return a preview to avoid overwhelming the context — first 3000 chars
        const preview = session.content.length > 3000
          ? session.content.substring(0, 3000) + '\n...[documento truncado para previsualización]'
          : session.content;
        return JSON.stringify({
          mensaje: `Documento leído correctamente. Longitud: ${session.content.length} caracteres.`,
          fileName: session.fileName,
          content: preview,
          contentLength: session.content.length,
        });
      }

      // ── ESCRIBIR (reemplazar todo el contenido) ───────────────────────────
      if (accion === 'escribir') {
        if (!input.content) {
          return JSON.stringify({ error: 'El campo "content" es obligatorio para accion="escribir".' });
        }
        await LiveEditorSession.findOneAndUpdate(
          { conversationId },
          {
            $set: {
              content: input.content,
              contentUpdatedAt: new Date(),
              ...(input.fileName ? { fileName: input.fileName } : {}),
            },
            $setOnInsert: { user: userId },
          },
          { upsert: true, new: true },
        );
        return JSON.stringify({
          success: true,
          mensaje: `Documento creado/actualizado correctamente. El usuario puede verlo en el panel lateral.`,
          fileName: input.fileName || 'Documento sin título',
          contentLength: input.content.length,
        });
      }

      // ── EDITAR SECCIÓN ────────────────────────────────────────────────────
      if (accion === 'editar_seccion') {
        if (!input.titulo_seccion || !input.nuevo_contenido_seccion) {
          return JSON.stringify({ error: 'Se requieren "titulo_seccion" y "nuevo_contenido_seccion" para accion="editar_seccion".' });
        }
        const session = await LiveEditorSession.findOne({ conversationId });
        if (!session || !session.content) {
          return JSON.stringify({ error: 'El documento está vacío. Usa accion="escribir" primero.' });
        }

        // Find the heading tag containing the title (h1-h6) and replace the block until the next heading of same or higher level
        let updatedContent = session.content;
        const escapedTitle = input.titulo_seccion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Match heading containing the title text + everything until next heading or end
        const sectionRegex = new RegExp(
          `(<h[1-6][^>]*>[^<]*${escapedTitle}[^<]*<\/h[1-6]>)(.*?)(?=<h[1-6]|$)`,
          'is',
        );
        const match = sectionRegex.exec(updatedContent);

        if (!match) {
          return JSON.stringify({
            error: `No se encontró una sección con el título "${input.titulo_seccion}". Verifica que el título exista en el documento.`,
          });
        }

        updatedContent = updatedContent.replace(
          sectionRegex,
          match[1] + '\n' + input.nuevo_contenido_seccion + '\n',
        );

        await LiveEditorSession.findOneAndUpdate(
          { conversationId },
          { $set: { content: updatedContent, contentUpdatedAt: new Date() } },
        );

        return JSON.stringify({
          success: true,
          mensaje: `Sección "${input.titulo_seccion}" actualizada correctamente.`,
        });
      }

      // ── BUSCAR Y REEMPLAZAR ───────────────────────────────────────────────
      if (accion === 'buscar_reemplazar') {
        if (!input.buscar || input.reemplazar === undefined) {
          return JSON.stringify({ error: 'Se requieren "buscar" y "reemplazar" para accion="buscar_reemplazar".' });
        }
        const session = await LiveEditorSession.findOne({ conversationId });
        if (!session || !session.content) {
          return JSON.stringify({ error: 'El documento está vacío. Usa accion="escribir" primero.' });
        }

        const flags = input.reemplazar_todo !== false ? 'gi' : 'i';
        const searchRegex = new RegExp(input.buscar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
        const matches = (session.content.match(searchRegex) || []).length;

        if (matches === 0) {
          return JSON.stringify({ error: `No se encontró el texto "${input.buscar}" en el documento.` });
        }

        const updatedContent = session.content.replace(searchRegex, input.reemplazar);

        await LiveEditorSession.findOneAndUpdate(
          { conversationId },
          { $set: { content: updatedContent, contentUpdatedAt: new Date() } },
        );

        return JSON.stringify({
          success: true,
          mensaje: `Se reemplazaron ${matches} ocurrencia(s) de "${input.buscar}" por "${input.reemplazar}".`,
          reemplazos: matches,
        });
      }

      // ── INSERTAR ──────────────────────────────────────────────────────────
      if (accion === 'insertar') {
        if (!input.insertar_contenido || !input.posicion) {
          return JSON.stringify({ error: 'Se requieren "insertar_contenido" y "posicion" para accion="insertar".' });
        }
        const session = await LiveEditorSession.findOne({ conversationId });
        const currentContent = session?.content || '';
        let updatedContent;

        if (input.posicion === 'inicio') {
          updatedContent = input.insertar_contenido + '\n' + currentContent;
        } else if (input.posicion === 'fin') {
          updatedContent = currentContent + '\n' + input.insertar_contenido;
        } else if (input.posicion === 'despues_de') {
          if (!input.insertar_despues_de_texto) {
            return JSON.stringify({ error: '"insertar_despues_de_texto" es requerido cuando posicion="despues_de".' });
          }
          const escapedRef = input.insertar_despues_de_texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const refRegex = new RegExp(`(${escapedRef}.*?(?:<\/[^>]+>))`, 'i');
          if (!refRegex.test(currentContent)) {
            return JSON.stringify({ error: `No se encontró el texto de referencia "${input.insertar_despues_de_texto}" en el documento.` });
          }
          updatedContent = currentContent.replace(refRegex, `$1\n${input.insertar_contenido}`);
        } else {
          return JSON.stringify({ error: 'Posición inválida. Usa "inicio", "fin" o "despues_de".' });
        }

        await LiveEditorSession.findOneAndUpdate(
          { conversationId },
          {
            $set: { content: updatedContent, contentUpdatedAt: new Date() },
            $setOnInsert: { user: userId },
          },
          { upsert: true, new: true },
        );

        return JSON.stringify({
          success: true,
          mensaje: `Contenido insertado correctamente en posición "${input.posicion}".`,
        });
      }

      return JSON.stringify({ error: `Acción desconocida: "${accion}".` });

    } catch (error) {
      console.error('[EditorLive Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error procesando la acción del Editor Live.',
        details: error.message,
      });
    }
  }
}

module.exports = EditorLive;
