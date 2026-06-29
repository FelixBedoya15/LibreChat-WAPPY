const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { google } = require('googleapis');
const { logger } = require('@librechat/data-schemas');
const {
  getActiveCompany,
  getScopedAuthValue,
  updateScopedAuthValue,
} = require('~/server/services/googleAuthHelper');

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

        // Overwriting a Google Doc requires clearing the body and inserting the new text.
        // First get length of doc to replace it
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
        
        // Insert new text at index 1
        requests.push({
          insertText: {
            location: {
              index: 1,
            },
            text,
          },
        });

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

        const requests = [
          {
            insertText: {
              location: {
                index: endIndex - 1,
              },
              text: `\n${text}`,
            },
          },
        ];

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
