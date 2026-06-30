const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { google } = require('googleapis');
const { logger } = require('@librechat/data-schemas');
const {
  getActiveCompany,
  getScopedAuthValue,
  updateScopedAuthValue,
} = require('~/server/services/googleAuthHelper');

function parseMarkdownForShape(mdText) {
  const lines = mdText.split('\n');
  let cleanText = '';
  const styles = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const isLast = i === lines.length - 1;

    // Detect bullet points (* or -)
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const prefixIdx = line.indexOf('*') !== -1 ? line.indexOf('*') : line.indexOf('-');
      line = line.substring(0, prefixIdx) + '• ' + line.substring(prefixIdx + 2);
    }

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

      const startInShape = cleanText.length + cleanLine.length;
      const endInShape = startInShape + boldText.length;
      styles.push({ start: startInShape, end: endInShape, type: 'bold' });

      cleanLine += boldText;
      boldIndex = endBold + 2;
    }

    cleanText += cleanLine + (isLast ? '' : '\n');
  }

  return { cleanText, styles };
}

class GoogleSlidesTool extends Tool {
  static lc_name() {
    return 'google_slides';
  }

  constructor(fields = {}) {
    super(fields);
    this.name = 'google_slides';
    this.description =
      'Permite interactuar directamente con Google Slides (Presentaciones de Google) del usuario. Puedes crear nuevas presentaciones de diapositivas, añadir diapositivas de texto y título, y leer la estructura de una presentación para armar propuestas de capacitación, informes corporativos o resúmenes de gestión.';
    
    this.req = fields.req;

    this.schema = z.object({
      action: z.enum([
        'create_presentation',
        'add_slide',
        'read_presentation',
      ]).describe('La acción a ejecutar en Google Slides.'),
      presentationId: z.string().optional().describe('El ID de la presentación de Google Slides (requerido para añadir diapositivas o leer la estructura).'),
      title: z.string().optional().describe('El título de la presentación o de la nueva diapositiva que deseas añadir.'),
      bodyText: z.string().optional().describe('El texto del cuerpo o contenido de la nueva diapositiva.'),
      slideLayout: z.enum(['TITLE_AND_BODY', 'TITLE', 'SECTION_HEADER', 'BLANK']).optional().default('BLANK').describe('El diseño de la diapositiva que deseas añadir.'),
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
      logger.info(`[GoogleSlidesTool] Token expirado para usuario: ${userId}. Refrescando...`);
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        if (credentials.access_token) {
          await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', credentials.access_token);
        }
        if (credentials.expiry_date) {
          await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', String(credentials.expiry_date));
        }
        logger.info(`[GoogleSlidesTool] Token refrescado exitosamente.`);
      } catch (err) {
        logger.error(`[GoogleSlidesTool] Error refrescando token:`, err);
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

    const { action, presentationId, title, bodyText, slideLayout } = validationResult.data;
    const auth = await this.getAuthClient();
    const slides = google.slides({ version: 'v1', auth });

    switch (action) {
      case 'create_presentation': {
        if (!title) throw new Error('Se requiere el campo "title" para crear la presentación.');
        const response = await slides.presentations.create({
          requestBody: {
            title,
          },
        });
        return `Presentación de Google Slides creada exitosamente:\n- Título: "${title}"\n- ID: ${response.data.presentationId}\n- Enlace: https://docs.google.com/presentation/d/${response.data.presentationId}/edit`;
      }

      case 'add_slide': {
        if (!presentationId) throw new Error('Se requiere "presentationId" para añadir una diapositiva.');
        
        // Default layout to BLANK to avoid ugly overlapping placeholders
        const activeLayout = slideLayout || 'BLANK';

        const slideId = `slide_${Date.now()}`;
        const titleBoxId = `title_${Date.now()}`;
        const bodyBoxId = `body_${Date.now()}`;

        const requests = [
          {
            createSlide: {
              objectId: slideId,
              slideLayoutReference: {
                predefinedLayout: activeLayout,
              },
            },
          },
        ];

        // If title is provided, insert it
        if (title) {
          const { cleanText, styles } = parseMarkdownForShape(title);
          requests.push(
            {
              createShape: {
                objectId: titleBoxId,
                shapeType: 'TEXT_BOX',
                elementProperties: {
                  pageObjectId: slideId,
                  size: {
                    height: { magnitude: 60, unit: 'PT' },
                    width: { magnitude: 620, unit: 'PT' },
                  },
                  transform: {
                    scaleX: 1,
                    scaleY: 1,
                    translateX: 50,
                    translateY: 40,
                    unit: 'PT',
                  },
                },
              },
            },
            {
              insertText: {
                objectId: titleBoxId,
                text: cleanText,
              },
            },
            {
              updateTextStyle: {
                objectId: titleBoxId,
                style: {
                  fontSize: { magnitude: 24, unit: 'PT' },
                  bold: true,
                  foregroundColor: {
                    opaqueColor: {
                      rgbColor: {
                        red: 0.06,
                        green: 0.46,
                        blue: 0.43, // Teal #0f766e
                      },
                    },
                  },
                },
                textRange: {
                  type: 'ALL',
                },
                fields: 'fontSize,bold,foregroundColor',
              },
            }
          );

          // Apply bold segments in title
          for (const style of styles) {
            if (style.type === 'bold') {
              requests.push({
                updateTextStyle: {
                  objectId: titleBoxId,
                  style: {
                    bold: true,
                  },
                  textRange: {
                    type: 'FIXED_RANGE',
                    startIndex: style.start,
                    endIndex: style.end,
                  },
                  fields: 'bold',
                },
              });
            }
          }
        }

        // If body text is provided, insert it
        if (bodyText) {
          const { cleanText, styles } = parseMarkdownForShape(bodyText);
          requests.push(
            {
              createShape: {
                objectId: bodyBoxId,
                shapeType: 'TEXT_BOX',
                elementProperties: {
                  pageObjectId: slideId,
                  size: {
                    height: { magnitude: 260, unit: 'PT' },
                    width: { magnitude: 620, unit: 'PT' },
                  },
                  transform: {
                    scaleX: 1,
                    scaleY: 1,
                    translateX: 50,
                    translateY: 120, // Clearly separated from Title box
                    unit: 'PT',
                  },
                },
              },
            },
            {
              insertText: {
                objectId: bodyBoxId,
                text: cleanText,
              },
            },
            {
              updateTextStyle: {
                objectId: bodyBoxId,
                style: {
                  fontSize: { magnitude: 14, unit: 'PT' },
                  foregroundColor: {
                    opaqueColor: {
                      rgbColor: {
                        red: 0.2,
                        green: 0.2,
                        blue: 0.2, // Dark grey
                      },
                    },
                  },
                },
                textRange: {
                  type: 'ALL',
                },
                fields: 'fontSize,foregroundColor',
              },
            }
          );

          // Apply bold segments in bodyText
          for (const style of styles) {
            if (style.type === 'bold') {
              requests.push({
                updateTextStyle: {
                  objectId: bodyBoxId,
                  style: {
                    bold: true,
                  },
                  textRange: {
                    type: 'FIXED_RANGE',
                    startIndex: style.start,
                    endIndex: style.end,
                  },
                  fields: 'bold',
                },
              });
            }
          }
        }

        await slides.presentations.batchUpdate({
          presentationId,
          requestBody: {
            requests,
          },
        });

        return `Diapositiva añadida exitosamente con diseño "${activeLayout}" a la presentación.`;
      }

      case 'read_presentation': {
        if (!presentationId) throw new Error('Se requiere "presentationId" para leer.');
        const response = await slides.presentations.get({
          presentationId,
        });

        const slidesData = response.data.slides || [];
        let info = `Presentación: "${response.data.title}" (${slidesData.length} diapositivas encontradas):\n\n`;

        slidesData.forEach((slide, idx) => {
          info += `Diapositiva ${idx + 1} (ID: ${slide.objectId}):\n`;
          const elements = slide.pageElements || [];
          elements.forEach(elem => {
            if (elem.shape && elem.shape.text && elem.shape.text.textElements) {
              const textRuns = elem.shape.text.textElements
                .map(te => te.textRun?.content)
                .filter(Boolean)
                .join('')
                .trim();
              if (textRuns) {
                info += ` - Texto: "${textRuns}"\n`;
              }
            }
          });
        });

        return info;
      }

      default:
        throw new Error(`Acción desconocida: ${action}`);
    }
  }
}

module.exports = GoogleSlidesTool;
