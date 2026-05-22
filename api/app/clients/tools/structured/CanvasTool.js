const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const CanvasSession = require('~/models/CanvasSession');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection } = require('~/server/routes/sgsst/reportHeader');
const { syncCanvasToLiveEditor } = require('~/server/routes/sgsst/syncBridge');

/**
 * Helper to automatically prepend standard company header and append signature section to text (Word) Canvas documents.
 * Safe against consecutive duplicates by inspecting content substrings.
 */
async function processTextDocument(content, fileType, title, userId) {
  if (fileType !== 'text') {
    return content;
  }

  let stringContent = content || '';

  const hasHeader = stringContent.includes('INFORMACIÓN RESUMIDA DE LA ENTIDAD');
  const hasSignature = stringContent.includes('signature-placeholder') || stringContent.includes('RESPONSABLE SG-SST') || stringContent.includes('Responsable SG-SST');

  if (hasHeader && hasSignature) {
    return stringContent;
  }

  let companyInfo = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!companyInfo) {
    companyInfo = await CompanyInfo.findOne({ user: userId });
  }

  if (!hasHeader) {
    const headerHtml = buildStandardHeader({
      title: title || 'DOCUMENTO DE TRABAJO',
      companyInfo
    });
    stringContent = headerHtml + '\n\n' + stringContent;
  }

  if (!hasSignature && companyInfo) {
    const signatureHtml = buildSignatureSection(companyInfo);
    stringContent = stringContent + '\n\n' + signatureHtml;
  }

  return stringContent;
}

/**
 * Canvas Tool
 * Permite al agente leer, crear y editar documentos, hojas de cálculo, diapositivas y código HTML
 * en tiempo real dentro del panel lateral de la conversación.
 */
class CanvasTool extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'canvas';
    this.description =
      'Herramienta interactiva de pantalla dividida (Canvas). Úsala para crear o editar: documentos de texto enriquecidos ("text"), hojas de cálculo ("excel"), presentaciones ("presentation") y prototipos visuales ("html"). El usuario ve los cambios reflejados en tiempo real en la barra lateral derecha.';
    this.req = fields.req;

    this.schema = z.object({
      accion: z
        .enum(['crear', 'actualizar', 'leer', 'editar_seccion', 'buscar_reemplazar', 'insertar'])
        .describe(
          'Acción a realizar: "crear" para inicializar un archivo nuevo; "actualizar" para modificar el contenido completo; "leer" para inspeccionar el estado actual; "editar_seccion" para editar solo una sección por su título; "buscar_reemplazar" para buscar y reemplazar texto específico; "insertar" para inyectar contenido en una posición específica.'
        ),

      fileType: z
        .enum(['text', 'excel', 'presentation', 'html'])
        .describe('Tipo de archivo a gestionar: "text" (Word/PDF), "excel" (Excel), "presentation" (PowerPoint/PDF slides) o "html" (Prototipos/Iframe).'),

      title: z
        .string()
        .optional()
        .describe('Título del documento o archivo. Obligatorio al crear o renombrar.'),

      content: z
        .string()
        .optional()
        .describe(
          'Contenido principal del archivo. OBLIGATORIO al crear o actualizar completamente. Si usas acciones parciales o "leer", envía un string vacío o no lo envíes.\n' +
          '- Para "text" y "html": una cadena de texto (Markdown, HTML enriquecido o código HTML/CSS plano).\n' +
          '- Para "excel": un JSON stringificado representando la grilla bidimensional, ej: [["Col1", "Col2"], ["Dato1", "Dato2"]].\n' +
          '- Para "presentation": un JSON stringificado representando las diapositivas, ej: [{"title": "SST", "bullets": ["Seguridad", "Salud"]}].'
        ),

      // Para accion="editar_seccion"
      titulo_seccion: z
        .string()
        .optional()
        .describe(
          'Título exacto (o fragmento) de la sección a editar. El sistema buscará el bloque de texto bajo ese título y lo reemplazará. Requerido para accion="editar_seccion". Solo para fileType="text".'
        ),

      nuevo_contenido_seccion: z
        .string()
        .optional()
        .describe(
          'Nuevo contenido HTML/Markdown para reemplazar la sección identificada por titulo_seccion. Requerido para accion="editar_seccion". Solo para fileType="text".'
        ),

      // Para accion="buscar_reemplazar"
      buscar: z
        .string()
        .optional()
        .describe('Texto exacto o fragmento a buscar en el documento. Requerido para accion="buscar_reemplazar". Solo para fileType="text".'),

      reemplazar: z
        .string()
        .optional()
        .describe('Texto o HTML que reemplazará al encontrado. Requerido para accion="buscar_reemplazar". Solo para fileType="text".'),

      reemplazar_todo: z
        .boolean()
        .optional()
        .default(true)
        .describe('Si true (por defecto), reemplaza todas las ocurrencias. Si false, solo la primera.'),

      // Para accion="insertar"
      posicion: z
        .enum(['inicio', 'fin', 'despues_de'])
        .optional()
        .describe('Dónde insertar: "inicio" = al principio, "fin" = al final, "despues_de" = después del texto indicado en "insertar_despues_de_texto". Solo para fileType="text".'),

      insertar_contenido: z
        .string()
        .optional()
        .describe('Contenido HTML/Markdown a insertar. Requerido para accion="insertar". Solo para fileType="text".'),

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
      const {
        accion,
        fileType,
        title,
        content,
        titulo_seccion,
        nuevo_contenido_seccion,
        buscar,
        reemplazar,
        reemplazar_todo,
        posicion,
        insertar_contenido,
        insertar_despues_de_texto
      } = input;

      // ── LEER ────────────────────────────────────────────────────────────────
      if (accion === 'leer') {
        const session = await CanvasSession.findOne({ conversationId });
        if (!session) {
          return JSON.stringify({
            mensaje: 'El Canvas está vacío. Puedes crear un nuevo archivo utilizando accion="crear".',
            content: '',
            title: 'Archivo sin título',
            fileType: 'text',
          });
        }
        
        let displayContent = session.content;
        // Truncar contenido muy largo en la salida de consola para no saturar contexto
        if (typeof displayContent === 'string' && displayContent.length > 3000) {
          displayContent = displayContent.substring(0, 3000) + '\n...[contenido truncado para visualización]';
        }

        return JSON.stringify({
          mensaje: 'Canvas leído correctamente.',
          title: session.title,
          fileType: session.fileType,
          version: session.version,
          content: displayContent,
        });
      }

      // ── CREAR / ACTUALIZAR ──────────────────────────────────────────────────
      let session = await CanvasSession.findOne({ conversationId });
      let parsedContent = content;
      let activeTitle = title || (session ? session.title : 'Archivo sin título');

      // --- Dynamic Title Extraction ---
      if ((accion === 'crear' || accion === 'actualizar') && (fileType === 'text' || (session && session.fileType === 'text')) && typeof parsedContent === 'string') {
        const isDefaultTitle = (t) => !t || 
                                     t === 'Archivo sin título' || 
                                     t === 'Archivo de Canvas sin título' || 
                                     t === 'DOCUMENTO DE TRABAJO' || 
                                     t.trim() === '';
        if (isDefaultTitle(activeTitle)) {
          const match = parsedContent.match(/<(h[12])\b[^>]*>(.*?)<\/\1>/i);
          if (match) {
            const extractedTitle = match[2].replace(/<[^>]*>/g, '').trim();
            if (extractedTitle) {
              activeTitle = extractedTitle;
              parsedContent = parsedContent.replace(match[0], '');
              // Clean up leading spaces or empty tags
              parsedContent = parsedContent.replace(/^\s*(?:<p>\s*<br\s*\/?>\s*<\/p>|<p>\s*<\/p>|\s)+/i, '');
            }
          }
        }
      }
      // ---------------------------------

      // Si es excel o presentation, intentar parsear el JSON
      if (fileType === 'excel' || fileType === 'presentation') {
        try {
          if (content) {
            parsedContent = JSON.parse(content);
          }
        } catch (e) {
          return JSON.stringify({
            error: 'El campo "content" debe ser un JSON stringificado válido para los tipos "excel" y "presentation".',
            detalles: e.message
          });
        }
      }

      if (accion === 'crear') {
        if (session) {
          // Si ya existe, nos comportamos como actualizar para no destruir el historial del usuario
          const activeFileType = fileType || session.fileType;
          if (activeFileType === 'text') {
            parsedContent = await processTextDocument(parsedContent ?? session.content, activeFileType, activeTitle, userId);
          }

          const nextVersion = session.version + 1;
          const newHistoryItem = {
            version: nextVersion,
            content: parsedContent ?? session.content,
            title: activeTitle,
            updatedAt: new Date()
          };

          const updatedHistory = [...(session.history || []), newHistoryItem].slice(-20);

          session.content = parsedContent ?? session.content;
          session.title = activeTitle;
          session.fileType = activeFileType;
          session.version = nextVersion;
          session.history = updatedHistory;

          await session.save();

          // Sincronizar a LiveEditor si es tipo text
          if (activeFileType === 'text') {
            await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
          }

          return JSON.stringify({
            success: true,
            mensaje: `La sesión de Canvas ya existía. Se actualizó el archivo a la versión ${session.version} (preservando el historial).`,
            title: session.title,
            version: session.version,
          });
        } else {
          // Si no existe, crear de cero con versión 1
          if (fileType === 'text') {
            parsedContent = await processTextDocument(parsedContent, fileType, activeTitle, userId);
          }

          session = new CanvasSession({
            user: userId,
            conversationId,
            content: parsedContent ?? '',
            title: activeTitle,
            fileType,
            version: 1,
            history: [{
              version: 1,
              content: parsedContent ?? '',
              title: activeTitle,
              updatedAt: new Date()
            }]
          });

          let companyInfo = await CompanyInfo.findOne({ user: userId, isActive: true });
          if (!companyInfo) {
            companyInfo = await CompanyInfo.findOne({ user: userId });
          }
          if (companyInfo) {
            session.companyId = companyInfo._id;
          }

          await session.save();

          // Sincronizar a LiveEditor si es tipo text
          if (fileType === 'text') {
            await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
          }

          return JSON.stringify({
            success: true,
            mensaje: `Archivo Canvas de tipo "${fileType}" creado exitosamente. El usuario puede verlo y descargarlo en la barra lateral derecha.`,
            title: session.title,
            version: session.version,
          });
        }
      }

      if (accion === 'actualizar') {
        if (!session) {
          // Si no existe, lo creamos automáticamente con versión 1
          const activeFileType = fileType || 'text';

          if (activeFileType === 'text') {
            parsedContent = await processTextDocument(parsedContent, activeFileType, activeTitle, userId);
          }

          session = new CanvasSession({
            user: userId,
            conversationId,
            content: parsedContent ?? '',
            title: activeTitle,
            fileType: activeFileType,
            version: 1,
            history: [{
              version: 1,
              content: parsedContent ?? '',
              title: activeTitle,
              updatedAt: new Date()
            }]
          });

          let companyInfo = await CompanyInfo.findOne({ user: userId, isActive: true });
          if (!companyInfo) {
            companyInfo = await CompanyInfo.findOne({ user: userId });
          }
          if (companyInfo) {
            session.companyId = companyInfo._id;
          }

          await session.save();

          // Sincronizar a LiveEditor si es tipo text
          if (activeFileType === 'text') {
            await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
          }

          return JSON.stringify({
            success: true,
            mensaje: `La sesión de Canvas no existía. Se creó automáticamente con versión 1.`,
            title: session.title,
            version: session.version,
          });
        } else {
          // Si existe, lo actualizamos normalmente
          const activeFileType = fileType || session.fileType;
          if (activeFileType === 'text') {
            parsedContent = await processTextDocument(parsedContent ?? session.content, activeFileType, activeTitle, userId);
          }

          const nextVersion = session.version + 1;
          const newHistoryItem = {
            version: nextVersion,
            content: parsedContent ?? session.content,
            title: activeTitle,
            updatedAt: new Date()
          };

          const updatedHistory = [...(session.history || []), newHistoryItem].slice(-20);

          session.content = parsedContent ?? session.content;
          session.title = activeTitle;
          session.fileType = activeFileType;
          session.version = nextVersion;
          session.history = updatedHistory;

          await session.save();

          // Sincronizar a LiveEditor si es tipo text
          if (activeFileType === 'text') {
            await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
          }

          return JSON.stringify({
            success: true,
            mensaje: `Archivo Canvas actualizado correctamente a la versión ${session.version}.`,
            title: session.title,
            version: session.version,
          });
        }
      }

      // ── EDITAR SECCIÓN ────────────────────────────────────────────────────
      if (accion === 'editar_seccion') {
        const activeFileType = fileType || (session ? session.fileType : 'text');
        if (activeFileType !== 'text') {
          return JSON.stringify({ error: 'La acción "editar_seccion" solo está soportada para archivos de tipo "text".' });
        }
        if (!titulo_seccion || !nuevo_contenido_seccion) {
          return JSON.stringify({ error: 'Se requieren "titulo_seccion" y "nuevo_contenido_seccion" para accion="editar_seccion".' });
        }
        if (!session || !session.content) {
          return JSON.stringify({ error: 'El Canvas está vacío o no existe. Usa accion="crear" primero.' });
        }

        let updatedContent = session.content;
        const escapedTitle = titulo_seccion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Match heading containing the title text + everything until next heading or end
        const sectionRegex = new RegExp(
          `(<h[1-6][^>]*>[^<]*${escapedTitle}[^<]*<\/h[1-6]>)(.*?)(?=<h[1-6]|$)`,
          'is',
        );
        const match = sectionRegex.exec(updatedContent);

        if (!match) {
          return JSON.stringify({
            error: `No se encontró una sección con el título o coincidencia "${titulo_seccion}". Verifica que el título exista en el documento.`,
          });
        }

        updatedContent = updatedContent.replace(
          sectionRegex,
          match[1] + '\n' + nuevo_contenido_seccion + '\n',
        );

        updatedContent = await processTextDocument(updatedContent, activeFileType, activeTitle, userId);

        const nextVersion = session.version + 1;
        const newHistoryItem = {
          version: nextVersion,
          content: updatedContent,
          title: activeTitle,
          updatedAt: new Date()
        };

        const updatedHistory = [...(session.history || []), newHistoryItem].slice(-20);

        session.content = updatedContent;
        session.title = activeTitle;
        session.version = nextVersion;
        session.history = updatedHistory;

        await session.save();

        await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);

        return JSON.stringify({
          success: true,
          mensaje: `Sección "${titulo_seccion}" actualizada en el Canvas (versión ${session.version}).`,
          title: session.title,
          version: session.version,
        });
      }

      // ── BUSCAR Y REEMPLAZAR ───────────────────────────────────────────────
      if (accion === 'buscar_reemplazar') {
        const activeFileType = fileType || (session ? session.fileType : 'text');
        if (activeFileType !== 'text') {
          return JSON.stringify({ error: 'La acción "buscar_reemplazar" solo está soportada para archivos de tipo "text".' });
        }
        if (!buscar || reemplazar === undefined) {
          return JSON.stringify({ error: 'Se requieren "buscar" y "reemplazar" para accion="buscar_reemplazar".' });
        }
        if (!session || !session.content) {
          return JSON.stringify({ error: 'El Canvas está vacío o no existe. Usa accion="crear" primero.' });
        }

        const flags = reemplazar_todo !== false ? 'gi' : 'i';
        const searchRegex = new RegExp(buscar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
        const matches = (session.content.match(searchRegex) || []).length;

        if (matches === 0) {
          return JSON.stringify({ error: `No se encontró el texto "${buscar}" en el documento.` });
        }

        let updatedContent = session.content.replace(searchRegex, reemplazar);
        updatedContent = await processTextDocument(updatedContent, activeFileType, activeTitle, userId);

        const nextVersion = session.version + 1;
        const newHistoryItem = {
          version: nextVersion,
          content: updatedContent,
          title: activeTitle,
          updatedAt: new Date()
        };

        const updatedHistory = [...(session.history || []), newHistoryItem].slice(-20);

        session.content = updatedContent;
        session.title = activeTitle;
        session.version = nextVersion;
        session.history = updatedHistory;

        await session.save();

        await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);

        return JSON.stringify({
          success: true,
          mensaje: `Se reemplazaron ${matches} ocurrencia(s) de "${buscar}" por "${reemplazar}" en el Canvas (versión ${session.version}).`,
          title: session.title,
          version: session.version,
          reemplazos: matches,
        });
      }

      // ── INSERTAR ──────────────────────────────────────────────────────────
      if (accion === 'insertar') {
        const activeFileType = fileType || (session ? session.fileType : 'text');
        if (activeFileType !== 'text') {
          return JSON.stringify({ error: 'La acción "insertar" solo está soportada para archivos de tipo "text".' });
        }
        if (!insertar_contenido || !posicion) {
          return JSON.stringify({ error: 'Se requieren "insertar_contenido" y "posicion" para accion="insertar".' });
        }
        if (!session || !session.content) {
          return JSON.stringify({ error: 'El Canvas está vacío o no existe. Usa accion="crear" primero.' });
        }

        const currentContent = session.content || '';
        let updatedContent;

        if (posicion === 'inicio') {
          updatedContent = insertar_contenido + '\n' + currentContent;
        } else if (posicion === 'fin') {
          // Si tiene bloque de firmas, queremos insertar ANTES del bloque de firmas.
          const sigIndex = currentContent.indexOf('<div style="margin-top: 50px;');
          const sigAlternativeIndex = currentContent.indexOf('<div style="margin-top:50px;');
          const index = sigIndex !== -1 ? sigIndex : (sigAlternativeIndex !== -1 ? sigAlternativeIndex : -1);

          if (index !== -1) {
            updatedContent = currentContent.substring(0, index) + '\n' + insertar_contenido + '\n\n' + currentContent.substring(index);
          } else {
            updatedContent = currentContent + '\n' + insertar_contenido;
          }
        } else if (posicion === 'despues_de') {
          if (!insertar_despues_de_texto) {
            return JSON.stringify({ error: '"insertar_despues_de_texto" es requerido cuando posicion="despues_de".' });
          }
          const escapedRef = insertar_despues_de_texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const refRegex = new RegExp(`(${escapedRef}.*?(?:<\/[^>]+>))`, 'i');
          if (!refRegex.test(currentContent)) {
            return JSON.stringify({ error: `No se encontró el texto de referencia "${insertar_despues_de_texto}" en el documento.` });
          }
          updatedContent = currentContent.replace(refRegex, `$1\n${insertar_contenido}`);
        } else {
          return JSON.stringify({ error: 'Posición inválida. Usa "inicio", "fin" o "despues_de".' });
        }

        updatedContent = await processTextDocument(updatedContent, activeFileType, activeTitle, userId);

        const nextVersion = session.version + 1;
        const newHistoryItem = {
          version: nextVersion,
          content: updatedContent,
          title: activeTitle,
          updatedAt: new Date()
        };

        const updatedHistory = [...(session.history || []), newHistoryItem].slice(-20);

        session.content = updatedContent;
        session.title = activeTitle;
        session.version = nextVersion;
        session.history = updatedHistory;

        await session.save();

        await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);

        return JSON.stringify({
          success: true,
          mensaje: `Contenido insertado correctamente en posición "${posicion}" en el Canvas (versión ${session.version}).`,
          title: session.title,
          version: session.version,
        });
      }

      return JSON.stringify({ error: `Acción desconocida: "${accion}".` });

    } catch (error) {
      console.error('[Canvas Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error al procesar la acción de Canvas.',
        details: error.message,
      });
    }
  }
}

module.exports = CanvasTool;
