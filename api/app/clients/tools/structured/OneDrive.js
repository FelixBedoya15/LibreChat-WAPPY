const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const axios = require('axios');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const { logger } = require('@librechat/data-schemas');
const {
  getActiveCompany,
  getScopedAuthValue,
  updateScopedAuthValue,
} = require('~/server/services/oneDriveAuthHelper');

class OneDriveTool extends Tool {
  static lc_name() {
    return 'one_drive';
  }

  constructor(fields = {}) {
    super(fields);
    this.name = 'one_drive';
    this.description = 
      'Permite interactuar con el OneDrive del usuario. Puedes buscar archivos y carpetas, leer el contenido de documentos (Word .docx, Excel .xlsx/.xls, PDFs, txt, csv, json) y crear o actualizar documentos y carpetas directamente en la cuenta del usuario.';
    
    this.req = fields.req;
    
    this.schema = z.object({
      action: z.enum([
        'list_files_and_folders',
        'read_document_content',
        'create_folder',
        'write_file',
      ]).describe('La acción a realizar en OneDrive.'),
      query: z.string().optional().describe('Término de búsqueda para listar/buscar archivos o el contenido de texto a escribir.'),
      fileId: z.string().optional().describe('El ID del archivo o carpeta para leer o actualizar.'),
      fileName: z.string().optional().describe('El nombre del archivo o carpeta que deseas crear.'),
      parentId: z.string().optional().describe('El ID de la carpeta contenedora (opcional).'),
    });
  }

  /**
   * Retrieves and refreshes the user's OneDrive access token if expired.
   */
  async getAccessToken() {
    if (!this.req || !this.req.user) {
      throw new Error('Petición no autenticada. No se pudo obtener el contexto del usuario.');
    }
    const userId = this.req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company ? String(company._id) : null;

    let accessToken = await getScopedAuthValue(userId, companyId, 'ONEDRIVE_ACCESS_TOKEN', true);
    const refreshToken = await getScopedAuthValue(userId, companyId, 'ONEDRIVE_REFRESH_TOKEN', true);
    const expiryStr = await getScopedAuthValue(userId, companyId, 'ONEDRIVE_EXPIRY', true);
    const expiry = Number(expiryStr);

    const isExpired = expiry ? (expiry - Date.now() < 60000) : true;
    if (isExpired) {
      logger.info(`[OneDriveTool] Access token expired for user: ${userId}. Refreshing...`);
      try {
        const params = new URLSearchParams();
        params.append('client_id', process.env.ONEDRIVE_CLIENT_ID);
        params.append('client_secret', process.env.ONEDRIVE_CLIENT_SECRET);
        params.append('refresh_token', refreshToken);
        params.append('grant_type', 'refresh_token');

        const refreshResponse = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const credentials = refreshResponse.data;
        accessToken = credentials.access_token;
        const newExpiry = Date.now() + credentials.expires_in * 1000;

        if (credentials.access_token) {
          await updateScopedAuthValue(userId, companyId, 'ONEDRIVE_ACCESS_TOKEN', credentials.access_token);
        }
        if (credentials.refresh_token) {
          await updateScopedAuthValue(userId, companyId, 'ONEDRIVE_REFRESH_TOKEN', credentials.refresh_token);
        }
        if (newExpiry) {
          await updateScopedAuthValue(userId, companyId, 'ONEDRIVE_EXPIRY', String(newExpiry));
        }
        logger.info(`[OneDriveTool] Successfully refreshed OneDrive token for user: ${userId}`);
      } catch (refreshErr) {
        logger.error(`[OneDriveTool] Failed to refresh token for user: ${userId}`, refreshErr.response?.data || refreshErr.message);
        throw new Error('La conexión con OneDrive ha expirado o es inválida. Por favor, conéctate de nuevo en Configuración de Cuenta.');
      }
    }

    return accessToken;
  }

  async _call(input) {
    const validationResult = this.schema.safeParse(input);
    if (!validationResult.success) {
      throw new Error(`Validación fallida: ${JSON.stringify(validationResult.error.issues)}`);
    }

    const { action, query, fileId, fileName, parentId } = validationResult.data;
    const accessToken = await this.getAccessToken();

    switch (action) {
      case 'list_files_and_folders':
        return await this.listFiles(accessToken, query, parentId);

      case 'read_document_content':
        if (!fileId) throw new Error('Se requiere "fileId" para leer el contenido de un documento.');
        return await this.readFileContent(accessToken, fileId);

      case 'create_folder':
        if (!fileName) throw new Error('Se requiere "fileName" para crear una carpeta.');
        return await this.createFolder(accessToken, fileName, parentId);

      case 'write_file':
        if (!fileName) throw new Error('Se requiere "fileName" para crear o actualizar un archivo.');
        if (!query) throw new Error('Se requiere "query" (que contiene el texto a escribir) para escribir en el archivo.');
        return await this.writeFile(accessToken, fileName, query, parentId, fileId);

      default:
        throw new Error(`Acción desconocida: ${action}`);
    }
  }

  /**
   * Lists files and folders in OneDrive.
   */
  async listFiles(accessToken, query, parentId) {
    try {
      let url = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
      if (parentId) {
        url = `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children`;
      } else if (query) {
        url = `https://graph.microsoft.com/v1.0/me/drive/root/search(q='${encodeURIComponent(query)}')`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const items = res.data.value || [];
      if (items.length === 0) {
        return 'No se encontraron archivos ni carpetas en OneDrive.';
      }

      const fileList = items.map(item => {
        const type = item.folder ? '[Carpeta]' : '[Archivo]';
        return `- ${item.name} (ID: ${item.id}) ${type} - URL: ${item.webUrl}`;
      }).join('\n');

      return `Resultados de búsqueda en OneDrive:\n${fileList}`;
    } catch (err) {
      logger.error('[OneDriveTool] List files failed:', err.response?.data || err.message);
      throw new Error(`Fallo al listar archivos en OneDrive: ${err.message}`);
    }
  }

  /**
   * Reads the content of a file. Supports PDF, DOCX, XLSX, and plain text.
   */
  async readFileContent(accessToken, fileId) {
    try {
      // Get metadata to inspect mimeType
      const metadataRes = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { name, file } = metadataRes.data;
      const mimeType = file?.mimeType || '';

      const contentRes = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(contentRes.data);

      // Handle PDF
      if (mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
        const pdfData = await pdf(buffer);
        const text = pdfData.text.replace(/\n+/g, '\n').trim();
        return `Contenido extraído del PDF "${name}":\n\n${text}`;
      }

      // Handle Word Documents (.docx)
      if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        name.toLowerCase().endsWith('.docx')
      ) {
        const result = await mammoth.extractRawText({ buffer });
        return `Contenido extraído del documento Word "${name}":\n\n${result.value}`;
      }

      // Handle Excel Spreadsheet (.xlsx, .xls)
      if (
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        mimeType === 'application/vnd.ms-excel' ||
        name.toLowerCase().endsWith('.xlsx') ||
        name.toLowerCase().endsWith('.xls')
      ) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        let extractedText = '';
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          if (csv.trim()) {
            extractedText += `--- Hoja: ${sheetName} ---\n${csv}\n\n`;
          }
        });
        return `Contenido extraído del archivo Excel "${name}":\n\n${extractedText || 'El archivo Excel está vacío.'}`;
      }

      // Handle plain text files (or JSON, CSV)
      if (
        mimeType.startsWith('text/') || 
        mimeType === 'application/json' || 
        mimeType === 'application/javascript' ||
        name.toLowerCase().endsWith('.txt') ||
        name.toLowerCase().endsWith('.csv') ||
        name.toLowerCase().endsWith('.json')
      ) {
        const textContent = buffer.toString('utf-8');
        return `Contenido del archivo "${name}":\n\n${textContent}`;
      }

      return `El archivo "${name}" tiene un formato no compatible directamente para lectura (${mimeType || 'desconocido'}). ID de archivo: ${fileId}`;
    } catch (err) {
      logger.error('[OneDriveTool] Read file content failed:', err.response?.data || err.message);
      throw new Error(`Fallo al leer archivo de OneDrive: ${err.message}`);
    }
  }

  /**
   * Creates a new folder in OneDrive.
   */
  async createFolder(accessToken, name, parentId) {
    try {
      const parent = parentId || 'root';
      const res = await axios.post(`https://graph.microsoft.com/v1.0/me/drive/items/${parent}/children`, {
        name: name,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename',
      }, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      });

      return `Carpeta creada exitosamente: "${res.data.name}" (ID: ${res.data.id}). URL: ${res.data.webUrl}`;
    } catch (err) {
      logger.error('[OneDriveTool] Create folder failed:', err.response?.data || err.message);
      throw new Error(`Fallo al crear la carpeta en OneDrive: ${err.message}`);
    }
  }

  /**
   * Creates or updates a file in OneDrive.
   */
  async writeFile(accessToken, name, content, parentId, fileId) {
    try {
      let url;
      if (fileId) {
        // Update existing file
        url = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
      } else {
        // Create new file
        const parent = parentId || 'root';
        url = `https://graph.microsoft.com/v1.0/me/drive/items/${parent}:/${encodeURIComponent(name)}:/content`;
      }

      const res = await axios.put(url, content, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/plain',
        },
      });

      return `Archivo guardado exitosamente: "${res.data.name}" (ID: ${res.data.id}). URL: ${res.data.webUrl}`;
    } catch (err) {
      logger.error('[OneDriveTool] Write file failed:', err.response?.data || err.message);
      throw new Error(`Fallo al guardar archivo en OneDrive: ${err.message}`);
    }
  }
}

module.exports = OneDriveTool;
