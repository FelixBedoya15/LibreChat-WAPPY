const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const LiveEditorSession = require('~/models/LiveEditorSession');
const ritTemplate = require('./rit_template');

/**
 * EditorRIT Tool
 * Permite al agente leer y editar el documento vivo de la conversación actual,
 * con la capacidad de cargar una plantilla completa de Reglamento Interno de Trabajo.
 */
class EditorRIT extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'editor_rit';
    this.description =
      'Editor específico para el Reglamento Interno de Trabajo (RIT). Úsalo para crear el RIT. DEBES ejecutar primero la acción "cargar_plantilla" para cargar el formato precargado con todos los capítulos y artículos. Luego, usa "buscar_reemplazar" o "editar_seccion" para llenar las variables solicitadas (como {{empresa_nombre}}, {{representante_legal}}, etc.).';
    this.req = fields.req;

    this.schema = z.object({
      accion: z
        .enum(['cargar_plantilla', 'leer', 'escribir', 'editar_seccion', 'buscar_reemplazar', 'insertar'])
        .describe(
          'Acción a ejecutar: "cargar_plantilla" para inicializar el documento con el RIT preestablecido; "leer" para consultar; "buscar_reemplazar" para reemplazar variables (ej. {{empresa_nombre}} por "ACME"); "editar_seccion" para cambiar un bloque entero.',
        ),

      // Para accion="escribir"
      content: z
        .string()
        .optional()
        .describe(
          'Contenido HTML completo del documento. OBLIGATORIO para accion="escribir".',
        ),

      fileName: z
        .string()
        .optional()
        .describe('Nombre descriptivo del documento (ej: "Reglamento Interno de Trabajo – ACME S.A.S.").'),

      // Para accion="editar_seccion"
      titulo_seccion: z
        .string()
        .optional()
        .describe(
          'Título exacto (o fragmento) de la sección a editar. Requerido para accion="editar_seccion".',
        ),

      nuevo_contenido_seccion: z
        .string()
        .optional()
        .describe(
          'Nuevo contenido HTML para reemplazar la sección identificada. Requerido para accion="editar_seccion".',
        ),

      // Para accion="buscar_reemplazar"
      buscar: z
        .string()
        .optional()
        .describe('Texto exacto o variable a buscar (ej: "{{empresa_nombre}}").'),

      reemplazar: z
        .string()
        .optional()
        .describe('Texto que reemplazará al encontrado.'),

      reemplazos_multiples: z
        .array(
          z.object({
            buscar: z.string(),
            reemplazar: z.string(),
          })
        )
        .optional()
        .describe('Lista de reemplazos a realizar en lote. Útil para reemplazar múltiples variables a la vez.'),

      reemplazar_todo: z
        .boolean()
        .optional()
        .default(true)
        .describe('Si true (por defecto), reemplaza todas las ocurrencias.'),

      // Para accion="insertar"
      posicion: z
        .enum(['inicio', 'fin', 'despues_de'])
        .optional()
        .describe('Dónde insertar: "inicio", "fin", o "despues_de".'),

      insertar_contenido: z
        .string()
        .optional()
        .describe('Contenido HTML a insertar.'),

      insertar_despues_de_texto: z
        .string()
        .optional()
        .describe('Texto después del cual se insertará.'),
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

      // ── CARGAR PLANTILLA ────────────────────────────────────────────────────
      if (accion === 'cargar_plantilla') {
        const fileName = input.fileName || 'Reglamento Interno de Trabajo';
        await LiveEditorSession.findOneAndUpdate(
          { conversationId },
          {
            $set: {
              content: ritTemplate,
              contentUpdatedAt: new Date(),
              fileName: fileName,
            },
            $setOnInsert: { user: userId },
          },
          { upsert: true, new: true },
        );
        return JSON.stringify({
          success: true,
          mensaje: `Plantilla del Reglamento Interno de Trabajo cargada exitosamente. Contiene la estructura completa. Ahora usa "buscar_reemplazar" para sustituir variables como {{empresa_nombre}}, etc.`,
          fileName: fileName,
          contentLength: ritTemplate.length,
        });
      }

      // ── LEER ────────────────────────────────────────────────────────────────
      if (accion === 'leer') {
        const session = await LiveEditorSession.findOne({ conversationId });
        if (!session || !session.content) {
          return JSON.stringify({
            mensaje: 'El documento está vacío. Ejecuta accion="cargar_plantilla" primero.',
            content: '',
            fileName: 'Documento sin título',
          });
        }
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
          mensaje: `Documento actualizado correctamente.`,
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
          return JSON.stringify({ error: 'El documento está vacío. Usa accion="cargar_plantilla" primero.' });
        }

        let updatedContent = session.content;
        const escapedTitle = input.titulo_seccion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const sectionRegex = new RegExp(
          `(<h[1-6][^>]*>[^<]*${escapedTitle}[^<]*<\/h[1-6]>)(.*?)(?=<h[1-6]|$)`,
          'is',
        );
        const match = sectionRegex.exec(updatedContent);

        if (!match) {
          return JSON.stringify({
            error: `No se encontró una sección con el título "${input.titulo_seccion}".`,
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
        if (!input.buscar && (!input.reemplazos_multiples || input.reemplazos_multiples.length === 0)) {
          return JSON.stringify({ error: 'Se requieren "buscar" y "reemplazar" o un arreglo en "reemplazos_multiples".' });
        }
        
        const session = await LiveEditorSession.findOne({ conversationId });
        if (!session || !session.content) {
          return JSON.stringify({ error: 'El documento está vacío. Usa accion="cargar_plantilla" primero.' });
        }

        let updatedContent = session.content;
        let totalMatches = 0;
        const flags = input.reemplazar_todo !== false ? 'g' : '';
        
        const reemplazos = input.reemplazos_multiples || [{ buscar: input.buscar, reemplazar: input.reemplazar }];

        for (const item of reemplazos) {
          if (!item.buscar || item.reemplazar === undefined) continue;
          const searchRegex = new RegExp(item.buscar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
          const matches = (updatedContent.match(searchRegex) || []).length;
          totalMatches += matches;
          if (matches > 0) {
            updatedContent = updatedContent.replace(searchRegex, item.reemplazar);
          }
        }

        if (totalMatches === 0) {
          return JSON.stringify({ error: `No se encontraron coincidencias para los textos buscados.` });
        }

        await LiveEditorSession.findOneAndUpdate(
          { conversationId },
          { $set: { content: updatedContent, contentUpdatedAt: new Date() } },
        );

        return JSON.stringify({
          success: true,
          mensaje: `Se realizaron reemplazos múltiples exitosamente. Total ocurrencias cambiadas: ${totalMatches}.`,
          reemplazos_totales: totalMatches,
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
            return JSON.stringify({ error: '"insertar_despues_de_texto" es requerido.' });
          }
          const escapedRef = input.insertar_despues_de_texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const refRegex = new RegExp(`(${escapedRef}.*?(?:<\/[^>]+>))`, 'i');
          if (!refRegex.test(currentContent)) {
            return JSON.stringify({ error: `No se encontró el texto de referencia.` });
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
      console.error('[EditorRIT Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error procesando la acción del Editor RIT.',
        details: error.message,
      });
    }
  }
}

module.exports = EditorRIT;
