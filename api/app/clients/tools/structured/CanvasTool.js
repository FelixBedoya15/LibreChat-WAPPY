const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const CanvasSession = require('~/models/CanvasSession');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection } = require('~/server/routes/sgsst/reportHeader');

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
        .enum(['crear', 'actualizar', 'leer'])
        .describe('Acción a realizar: "crear" para inicializar un archivo nuevo; "actualizar" para modificar el contenido actual; "leer" para inspeccionar el estado actual del archivo.'),

      fileType: z
        .enum(['text', 'excel', 'presentation', 'html'])
        .describe('Tipo de archivo a gestionar: "text" (Word/PDF), "excel" (Excel), "presentation" (PowerPoint/PDF slides) o "html" (Prototipos/Iframe).'),

      title: z
        .string()
        .optional()
        .describe('Título del documento o archivo. Obligatorio al crear.'),

      content: z
        .string()
        .optional()
        .describe(
          'Contenido principal del archivo:\n' +
          '- Para "text" y "html": una cadena de texto (HTML enriquecido o código HTML/CSS plano).\n' +
          '- Para "excel": un JSON stringificado representando la grilla bidimensional, ej: [["Col1", "Col2"], ["Dato1", "Dato2"]].\n' +
          '- Para "presentation": un JSON stringificado representando las diapositivas, ej: [{"title": "SST", "bullets": ["Seguridad", "Salud"]}].'
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
        return JSON.stringify({ error: 'No se encontró un ID de conversación válido. Asegúrate de que el chat esté iniciado.' });
      }

      const userId = this.req?.user?.id;
      const { accion, fileType, title, content } = input;

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
        if (fileType === 'text') {
          parsedContent = await processTextDocument(parsedContent, fileType, title, userId);
        }

        session = await CanvasSession.findOneAndUpdate(
          { conversationId },
          {
            $set: {
              content: parsedContent ?? '',
              title: title || 'Archivo sin título',
              fileType,
              version: 1,
              history: [{
                version: 1,
                content: parsedContent ?? '',
                title: title || 'Archivo sin título',
                updatedAt: new Date()
              }]
            },
            $setOnInsert: { user: userId }
          },
          { upsert: true, new: true }
        );

        return JSON.stringify({
          success: true,
          mensaje: `Archivo Canvas de tipo "${fileType}" creado exitosamente. El usuario puede verlo y descargarlo en la barra lateral derecha.`,
          title: session.title,
          version: session.version,
        });
      }

      if (accion === 'actualizar') {
        if (!session) {
          return JSON.stringify({
            error: 'No existe una sesión de Canvas activa en este chat. Primero crea el archivo usando accion="crear".'
          });
        }

        const activeFileType = fileType || session.fileType;
        if (activeFileType === 'text') {
          parsedContent = await processTextDocument(parsedContent ?? session.content, activeFileType, title || session.title, userId);
        }

        const nextVersion = session.version + 1;
        const newHistoryItem = {
          version: nextVersion,
          content: parsedContent ?? session.content,
          title: title || session.title,
          updatedAt: new Date()
        };

        const updatedHistory = [...(session.history || []), newHistoryItem].slice(-20);

        session.content = parsedContent ?? session.content;
        session.title = title || session.title;
        session.fileType = fileType || session.fileType;
        session.version = nextVersion;
        session.history = updatedHistory;

        await session.save();

        return JSON.stringify({
          success: true,
          mensaje: `Archivo Canvas actualizado correctamente a la versión ${session.version}.`,
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
