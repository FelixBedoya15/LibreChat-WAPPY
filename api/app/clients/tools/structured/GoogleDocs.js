const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { google } = require('googleapis');
const { logger } = require('@librechat/data-schemas');
const {
  getActiveCompany,
  getScopedAuthValue,
  updateScopedAuthValue,
} = require('~/server/services/googleAuthHelper');

function parseMarkdown(mdText, baseIndex = 1) {
  const lines = mdText.split('\n');
  let cleanText = '';
  const styles = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const isLast = i === lines.length - 1;
    let lineType = 'normal';

    // Detect bullet points (* or -)
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      lineType = 'bullet';
      const prefixIdx = line.indexOf('*') !== -1 ? line.indexOf('*') : line.indexOf('-');
      line = line.substring(0, prefixIdx) + '• ' + line.substring(prefixIdx + 2);
    }
    // Detect headers (#)
    else if (line.trim().startsWith('#')) {
      const hashMatch = line.match(/^(\s*)(#+)\s(.*)/);
      if (hashMatch) {
        const hashes = hashMatch[2];
        line = hashMatch[1] + hashMatch[3];
        lineType = hashes.length === 1 ? 'h1' : hashes.length === 2 ? 'h2' : 'h3';
      }
    }

    // Parse bold segments **bold**
    let cleanLine = '';
    let boldIndex = 0;
    while (true) {
      const startBold = line.indexOf('**', boldIndex);
      if (startBold === -1) {
        cleanLine += line.substring(boldIndex);
        break;
      }
      const endBold = line.indexOf('**', startBold + 2);
      if (endBold === -1) {
        cleanLine += line.substring(boldIndex);
        break;
      }

      cleanLine += line.substring(boldIndex, startBold);
      const boldText = line.substring(startBold + 2, endBold);

      const startInDoc = baseIndex + cleanText.length + cleanLine.length;
      const endInDoc = startInDoc + boldText.length;
      styles.push({ start: startInDoc, end: endInDoc, type: 'bold' });

      cleanLine += boldText;
      boldIndex = endBold + 2;
    }

    const lineStart = baseIndex + cleanText.length;
    const lineEnd = lineStart + cleanLine.length;

    if (lineType.startsWith('h')) {
      styles.push({ start: lineStart, end: lineEnd, type: lineType });
    } else if (lineType === 'bullet') {
      styles.push({ start: lineStart, end: lineEnd, type: 'bullet' });
    }

    cleanText += cleanLine + (isLast ? '' : '\n');
  }

  return { cleanText, styles };
}

class GoogleDocsTool extends Tool {
  static lc_name() {
    return 'google_docs';
  }

  constructor(fields = {}) {
    super(fields);
    this.name = 'google_docs';
    this.description =
      'Permite interactuar directamente con Google Docs (Documentos de Google) del usuario. Puedes crear nuevos documentos, leer su contenido de texto completo, sobrescribirlos y añadir texto al final para redactar minutas, contratos, políticas o reportes estilizados.';
    
    this.req = fields.req;

    this.schema = z.object({
      action: z.enum([
        'create_document',
        'read_document',
        'write_to_document',
        'append_to_document',
      ]).describe('La acción a ejecutar en Google Docs.'),
      documentId: z.string().optional().describe('El ID del documento de Google (requerido para leer, escribir o añadir texto).'),
      title: z.string().optional().describe('El título del nuevo documento de Google que deseas crear.'),
      text: z.string().optional().describe('El texto o contenido que deseas escribir o añadir al documento.'),
    });
  }

  async getAuthClient() {
    if (!this.req || !this.req.user) {
      throw new Error('Petición no autenticada. No se pudo obtener el contexto del usuario.');
    }
    const userId = this.req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company ? String(company._id) : null;

    const accessToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', true);
    const refreshToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_REFRESH_TOKEN', true);
    const expiryStr = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', true);
    const expiry = Number(expiryStr);

    if (!refreshToken) {
      throw new Error('No se encontró una conexión activa con Google Workspace. Por favor, conecta tu cuenta de Google en la pestaña de Configuración.');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.DOMAIN_SERVER}/api/google-drive/callback`
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiry,
    });

    const isExpired = expiry ? (expiry - Date.now() < 60000) : true;
    if (isExpired) {
      logger.info(`[GoogleDocsTool] Token expirado para usuario: ${userId}. Refrescando...`);
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        if (credentials.access_token) {
          await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', credentials.access_token);
        }
        if (credentials.expiry_date) {
          await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', String(credentials.expiry_date));
        }
        logger.info(`[GoogleDocsTool] Token refrescado exitosamente.`);
      } catch (err) {
        logger.error(`[GoogleDocsTool] Error refrescando token:`, err);
        throw new Error('La conexión de Google Workspace ha caducado. Por favor, vuelve a vincular tu cuenta en Configuración.');
      }
    }

    return oauth2Client;
  }

  async _call(input) {
    const validationResult = this.schema.safeParse(input);
    if (!validationResult.success) {
      throw new Error(`Validación fallida: ${JSON.stringify(validationResult.error.issues)}`);
    }

    const { action, documentId, title, text } = validationResult.data;
    const auth = await this.getAuthClient();
    const docs = google.docs({ version: 'v1', auth });

    switch (action) {
      case 'create_document': {
        if (!title) throw new Error('Se requiere el campo "title" para crear un documento.');
        const response = await docs.documents.create({
          requestBody: {
            title,
          },
        });
        return `Documento de Google creado exitosamente:\n- Título: "${title}"\n- ID: ${response.data.documentId}\n- Enlace: https://docs.google.com/document/d/${response.data.documentId}/edit`;
      }

      case 'read_document': {
        if (!documentId) throw new Error('Se requiere "documentId" para leer el contenido.');
        const response = await docs.documents.get({
          documentId,
        });
        
        // Helper to extract text from Google Doc structure
        let extractedText = '';
        if (response.data.body && response.data.body.content) {
          for (const item of response.data.body.content) {
            if (item.paragraph && item.paragraph.elements) {
              for (const elem of item.paragraph.elements) {
                if (elem.textRun && elem.textRun.content) {
                  extractedText += elem.textRun.content;
                }
              }
            }
          }
        }
        
        return `Contenido del documento "${response.data.title}":\n\n${extractedText || '(Vacío)'}`;
      }

      case 'write_to_document': {
        if (!documentId) throw new Error('Se requiere "documentId" para escribir.');
        if (!text) throw new Error('Se requiere el campo "text" con el contenido.');

        const doc = await docs.documents.get({ documentId });
        const bodyContent = doc.data.body.content;
        const lastElement = bodyContent[bodyContent.length - 1];
        const endIndex = lastElement.endIndex;

        const requests = [];
        // Delete original content if doc is not empty (endIndex > 2)
        if (endIndex > 2) {
          requests.push({
            deleteContentRange: {
              range: {
                startIndex: 1,
                endIndex: endIndex - 1,
              },
            },
          });
        }
        
        // Parse the markdown
        const { cleanText, styles } = parseMarkdown(text, 1);

        // Insert new clean text at index 1
        requests.push({
          insertText: {
            location: {
              index: 1,
            },
            text: cleanText,
          },
        });

        // Add styling requests
        for (const style of styles) {
          if (style.type === 'bold') {
            requests.push({
              updateTextStyle: {
                range: {
                  startIndex: style.start,
                  endIndex: style.end,
                },
                textStyle: {
                  bold: true,
                },
                fields: 'bold',
              },
            });
          } else if (style.type.startsWith('h')) {
            const headingType = style.type === 'h1' ? 'HEADING_1' : style.type === 'h2' ? 'HEADING_2' : 'HEADING_3';
            requests.push({
              updateParagraphStyle: {
                range: {
                  startIndex: style.start,
                  endIndex: style.end,
                },
                paragraphStyle: {
                  namedStyleType: headingType,
                },
                fields: 'namedStyleType',
              },
            });
          }
        }

        await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests,
          },
        });

        return `Contenido del documento reemplazado con éxito.`;
      }

      case 'append_to_document': {
        if (!documentId) throw new Error('Se requiere "documentId" para añadir texto.');
        if (!text) throw new Error('Se requiere el campo "text" con el contenido a añadir.');

        const doc = await docs.documents.get({ documentId });
        const bodyContent = doc.data.body.content;
        const lastElement = bodyContent[bodyContent.length - 1];
        const endIndex = lastElement.endIndex;

        const baseIndex = endIndex - 1;
        // Parse the markdown with baseIndex + 1 (since we prepend a newline \n)
        const { cleanText, styles } = parseMarkdown(text, baseIndex + 1);

        const requests = [
          {
            insertText: {
              location: {
                index: baseIndex,
              },
              text: `\n${cleanText}`,
            },
          },
        ];

        // Add styling requests
        for (const style of styles) {
          if (style.type === 'bold') {
            requests.push({
              updateTextStyle: {
                range: {
                  startIndex: style.start,
                  endIndex: style.end,
                },
                textStyle: {
                  bold: true,
                },
                fields: 'bold',
              },
            });
          } else if (style.type.startsWith('h')) {
            const headingType = style.type === 'h1' ? 'HEADING_1' : style.type === 'h2' ? 'HEADING_2' : 'HEADING_3';
            requests.push({
              updateParagraphStyle: {
                range: {
                  startIndex: style.start,
                  endIndex: style.end,
                },
                paragraphStyle: {
                  namedStyleType: headingType,
                },
                fields: 'namedStyleType',
              },
            });
          }
        }

        await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests,
          },
        });

        return `Texto añadido exitosamente al final del documento.`;
      }

      default:
        throw new Error(`Acción desconocida: ${action}`);
    }
  }
}

module.exports = GoogleDocsTool;
