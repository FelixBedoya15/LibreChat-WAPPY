const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { google } = require('googleapis');
const { logger } = require('@librechat/data-schemas');
const {
  getActiveCompany,
  getScopedAuthValue,
  updateScopedAuthValue,
} = require('~/server/services/googleAuthHelper');

class GoogleSheetsTool extends Tool {
  static lc_name() {
    return 'google_sheets';
  }

  constructor(fields = {}) {
    super(fields);
    this.name = 'google_sheets';
    this.description =
      'Permite interactuar directamente con Google Sheets del usuario. Puedes crear nuevas hojas de cálculo, leer rangos de celdas, escribir valores, añadir filas al final y aplicar formatos premium (colores de cabecera, bordes, negritas) para crear cuadros y reportes estructurados.';
    
    this.req = fields.req;

    this.schema = z.object({
      action: z.enum([
        'create_spreadsheet',
        'read_spreadsheet',
        'update_spreadsheet_values',
        'append_spreadsheet_values',
        'format_spreadsheet',
      ]).describe('La acción a ejecutar en Google Sheets.'),
      spreadsheetId: z.string().optional().describe('El ID de la hoja de cálculo de Google (requerido para leer, escribir, añadir o formatear).'),
      title: z.string().optional().describe('El título de la nueva hoja de cálculo que deseas crear.'),
      range: z.string().optional().describe('El rango de celdas en formato A1 (ej: "Sheet1!A1:D10"). Si no se pasa para leer, leerá el rango completo de la primera pestaña.'),
      values: z.array(z.array(z.union([z.string(), z.number(), z.boolean()]))).optional().describe('Matriz bidimensional de datos (array de arrays) a escribir o añadir (ej: [["Nombre", "Edad"], ["Juan", 30]]).'),
      sheetId: z.number().optional().default(0).describe('El ID numérico de la pestaña (comúnmente 0 para la primera pestaña) para formatear.'),
      headerColorHex: z.string().optional().default('#0f766e').describe('Color hexadecimal para el fondo de la cabecera (ej: "#0f766e" para Teal, "#0284c7" para Sky Blue).'),
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
      logger.info(`[GoogleSheetsTool] Token expirado para usuario: ${userId}. Refrescando...`);
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        if (credentials.access_token) {
          await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', credentials.access_token);
        }
        if (credentials.expiry_date) {
          await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', String(credentials.expiry_date));
        }
        logger.info(`[GoogleSheetsTool] Token refrescado exitosamente.`);
      } catch (err) {
        logger.error(`[GoogleSheetsTool] Error refrescando token:`, err);
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

    const { action, spreadsheetId, title, range, values, sheetId, headerColorHex } = validationResult.data;
    const auth = await this.getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    switch (action) {
      case 'create_spreadsheet': {
        if (!title) throw new Error('Se requiere el campo "title" para crear una hoja de cálculo.');
        const resource = {
          properties: {
            title,
          },
        };
        const response = await sheets.spreadsheets.create({
          resource,
          fields: 'spreadsheetId,spreadsheetUrl',
        });
        return `Hoja de cálculo creada exitosamente:\n- Título: "${title}"\n- ID: ${response.data.spreadsheetId}\n- Enlace: ${response.data.spreadsheetUrl}`;
      }

      case 'read_spreadsheet': {
        if (!spreadsheetId) throw new Error('Se requiere el campo "spreadsheetId" para leer datos.');
        const readRange = range || 'Sheet1!A1:Z500';
        
        try {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: readRange,
          });
          const rows = response.data.values;
          if (!rows || rows.length === 0) {
            return `No se encontraron datos en el rango "${readRange}" de la hoja con ID: ${spreadsheetId}.`;
          }
          return `Datos leídos del rango "${readRange}" (${rows.length} filas encontradas):\n` + JSON.stringify(rows, null, 2);
        } catch (err) {
          // If Sheet1 doesn't exist, try getting the spreadsheet metadata to read the first sheet name
          const meta = await sheets.spreadsheets.get({ spreadsheetId });
          const firstSheetName = meta.data.sheets?.[0]?.properties?.title || 'Hoja 1';
          const retryRange = range || `${firstSheetName}!A1:Z500`;
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: retryRange,
          });
          const rows = response.data.values;
          if (!rows || rows.length === 0) {
            return `No se encontraron datos en el rango "${retryRange}".`;
          }
          return `Datos leídos del rango "${retryRange}" (${rows.length} filas):\n` + JSON.stringify(rows, null, 2);
        }
      }

      case 'update_spreadsheet_values': {
        if (!spreadsheetId) throw new Error('Se requiere "spreadsheetId".');
        if (!range) throw new Error('Se requiere "range" (ej: "Sheet1!A1") para escribir datos.');
        if (!values || !Array.isArray(values)) throw new Error('Se requiere "values" como un array de arrays.');

        const response = await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values,
          },
        });
        return `Valores actualizados con éxito en el rango "${range}". Celdas afectadas: ${response.data.updatedCells}.`;
      }

      case 'append_spreadsheet_values': {
        if (!spreadsheetId) throw new Error('Se requiere "spreadsheetId".');
        if (!values || !Array.isArray(values)) throw new Error('Se requiere "values" como un array de arrays.');
        const appendRange = range || 'Sheet1!A1';

        const response = await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: appendRange,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          resource: {
            values,
          },
        });
        return `Filas añadidas exitosamente al final de la hoja. Rango actualizado: ${response.data.updates.updatedRange}.`;
      }

      case 'format_spreadsheet': {
        if (!spreadsheetId) throw new Error('Se requiere "spreadsheetId" para aplicar formato.');
        
        // Parse hex color to rgb percentage (Google Sheets format)
        const cleanHex = headerColorHex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

        // Apply a gorgeous header styling to row 1 (columns A-Z)
        const requests = [
          {
            repeatCell: {
              range: {
                sheetId: sheetId || 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 26,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: r,
                    green: g,
                    blue: b,
                  },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                    fontSize: 11,
                    fontFamily: 'Arial',
                  },
                  alignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,alignment,verticalAlignment)',
            },
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId: sheetId || 0,
                gridProperties: {
                  showGridLines: true,
                },
              },
              fields: 'gridProperties.showGridLines',
            },
          },
        ];

        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: {
            requests,
          },
        });

        return `Formato de cabecera premium aplicado con éxito en la pestaña con ID: ${sheetId}. Cabecera coloreada y líneas de cuadrícula habilitadas.`;
      }

      default:
        throw new Error(`Acción desconocida: ${action}`);
    }
  }
}

module.exports = GoogleSheetsTool;
