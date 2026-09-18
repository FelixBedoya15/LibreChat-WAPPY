const express = require('express');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const { logger } = require('@librechat/data-schemas');
const { requireJwtAuth, configMiddleware } = require('~/server/middleware');
const {
  getUserPluginAuthValue,
  updateUserPluginAuth,
  deleteUserPluginAuth,
} = require('~/server/services/PluginService');
const {
  getActiveCompany,
  getScopedAuthValue,
  updateScopedAuthValue,
  deleteScopedAuthValue,
} = require('~/server/services/googleAuthHelper');

const router = express.Router();

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.readonly',
];

const getOAuth2Client = (redirectUri) => {
  const rawDomain = process.env.DOMAIN_SERVER || process.env.DOMAIN_CLIENT || 'https://wappy.club';
  const domain = rawDomain.replace(/https?:\/\/wappy-ia\.com/g, 'https://wappy.club').replace(/\/+$/, '');
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || `${domain}/api/google-drive/callback`
  );
};

/**
 * Obtiene el cliente OAuth2 autenticado y con auto-refresco de tokens para un usuario y su empresa activa.
 */
const getUserOAuth2Client = async (userId) => {
  const company = await getActiveCompany(userId);
  const companyId = company ? String(company._id) : null;

  const accessToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', false);
  const refreshToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false);
  const expiryStr = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', false);
  const expiry = Number(expiryStr);

  if (!refreshToken && !accessToken) {
    return null;
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiry,
  });

  // Verificar si el token de acceso expiró o está a menos de 1 minuto de expirar
  const isExpired = expiry ? (expiry - Date.now() < 60000) : true;
  if (isExpired && refreshToken) {
    logger.info(`[GoogleDriveRoute] Token expirado para usuario: ${userId}. Refrescando...`);
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      if (credentials.access_token) {
        await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', credentials.access_token);
      }
      if (credentials.expiry_date) {
        await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', String(credentials.expiry_date));
      }
      logger.info(`[GoogleDriveRoute] Token de Google refrescado exitosamente para usuario: ${userId}`);
    } catch (refreshErr) {
      logger.error('[GoogleDriveRoute] Error refrescando token de Google:', refreshErr.message);
      return null;
    }
  }

  return oauth2Client;
};

/**
 * Initiates the Google Drive OAuth flow.
 * Generates an authorization URL and redirects the user to Google.
 */
router.get('/auth', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company ? String(company._id) : null;

    // Get the referer to redirect back to the correct domain
    const defaultClient = (process.env.DOMAIN_CLIENT || 'https://wappy.club').replace(/https?:\/\/wappy-ia\.com/g, 'https://wappy.club').replace(/\/+$/, '');
    const referer = req.headers.referer || req.headers.origin || defaultClient;
    let clientDomain = defaultClient;
    try {
      const parsedUrl = new URL(referer);
      clientDomain = `${parsedUrl.protocol}//${parsedUrl.host}`.replace(/https?:\/\/wappy-ia\.com/g, 'https://wappy.club');
    } catch (e) {
      // Fallback to DOMAIN_CLIENT
    }

    // Sign user ID, company ID and domain in the state to verify it in the public callback (prevents CSRF)
    const state = jwt.sign({ userId, companyId, clientDomain }, process.env.JWT_SECRET, { expiresIn: '15m' });

    const oauth2Client = getOAuth2Client();
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Essential to get the refresh token
      prompt: 'consent',      // Force consent screen to guarantee refresh token is returned
      scope: SCOPES,
      state: state,
    });

    res.json({ url: authorizationUrl });
  } catch (err) {
    logger.error('[GoogleDriveAuth] Error generating auth URL:', err);
    res.status(500).json({ error: 'Fallo al iniciar la autenticación con Google Drive' });
  }
});

/**
 * Public callback URL invoked by Google after the user grants permissions.
 * Exchanges authorization code for tokens, fetches the user's email, and saves them.
 */
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // We need to parse clientDomain even if there is an error to redirect the user to the correct site.
  let clientDomain = (process.env.DOMAIN_CLIENT || 'https://wappy.club').replace(/https?:\/\/wappy-ia\.com/g, 'https://wappy.club').replace(/\/+$/, '');
  try {
    if (state) {
      const decoded = jwt.verify(state, process.env.JWT_SECRET);
      if (decoded.clientDomain) {
        clientDomain = decoded.clientDomain.replace(/https?:\/\/wappy-ia\.com/g, 'https://wappy.club').replace(/\/+$/, '');
      }
    }
  } catch (e) {
    // If state decoding fails, we fallback to DOMAIN_CLIENT
  }

  if (error) {
    logger.error('[GoogleDriveCallback] Google OAuth error:', error);
    return res.redirect(`${clientDomain}/c/settings?tab=account&google_drive=error`);
  }

  if (!code || !state) {
    logger.error('[GoogleDriveCallback] Missing code or state');
    return res.redirect(`${clientDomain}/c/settings?tab=account&google_drive=error`);
  }

  try {
    // Verify the state token
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const companyId = decoded.companyId;

    if (!userId) {
      throw new Error('UserId not present in state token');
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Retrieve the user's email from Google profile
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfoRes = await oauth2.userinfo.get();
    const googleEmail = userInfoRes.data.email;

    // Save tokens in MongoDB pluginAuth collection scoped to company
    if (tokens.access_token) {
      await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', tokens.access_token);
    }
    if (tokens.refresh_token) {
      await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_REFRESH_TOKEN', tokens.refresh_token);
    }
    if (tokens.expiry_date) {
      await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', String(tokens.expiry_date));
    }
    if (googleEmail) {
      await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EMAIL', googleEmail);
    }

    logger.info(`[GoogleDriveCallback] Successfully connected Google Drive for user: ${userId} (${googleEmail}) in company ${companyId}`);
    
    // Redirect user back to account settings on the correct domain
    res.redirect(`${clientDomain}/c/settings?tab=account&google_drive=success`);
  } catch (err) {
    logger.error('[GoogleDriveCallback] OAuth callback handling failed:', err);
    res.redirect(`${clientDomain}/c/settings?tab=account&google_drive=error`);
  }
});

/**
 * Checks connection status of the active user.
 */
router.get('/status', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyName = company ? (company.companyName || company.nombreComercial) : null;
    const companyId = company ? String(company._id) : null;

    let connected = false;
    let email = null;

    try {
      const refreshToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false);
      if (refreshToken) {
        connected = true;
        email = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EMAIL', false);
      }
    } catch (authErr) {
      // User doesn't have the token stored yet
    }

    res.json({ connected, email, companyName });
  } catch (err) {
    logger.error('[GoogleDriveStatus] Error checking connection status:', err);
    res.status(500).json({ error: 'Fallo al verificar el estado de Google Drive' });
  }
});

/**
 * Disconnects Google Drive by removing the stored tokens.
 */
router.delete('/disconnect', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company ? String(company._id) : null;

    // Optional: Attempt to revoke token with Google
    try {
      const refreshToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false);
      if (refreshToken) {
        const oauth2Client = getOAuth2Client();
        await oauth2Client.revokeToken(refreshToken);
      }
    } catch (revokeErr) {
      logger.warn('[GoogleDriveDisconnect] Failed to revoke token with Google, deleting locally anyway:', revokeErr.message);
    }

    // Delete credentials from pluginAuth
    await deleteScopedAuthValue(userId, companyId);

    logger.info(`[GoogleDriveDisconnect] Google Drive disconnected for user: ${userId} in company ${companyId}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('[GoogleDriveDisconnect] Error disconnecting Google Drive:', err);
    res.status(500).json({ error: 'Fallo al desconectar Google Drive' });
  }
});

/**
 * Retrieves the decrypted active user Google Drive access token,
 * automatically refreshing it if it is expired.
 */
router.get('/token', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company ? String(company._id) : null;

    const accessToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', false);
    const refreshToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false);
    const expiryStr = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', false);
    const expiry = Number(expiryStr);

    if (!accessToken || !refreshToken) {
      return res.json({ connected: false });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiry,
    });

    // Check if access token is expired or close to expiry (within 1 minute)
    const isExpired = expiry ? (expiry - Date.now() < 60000) : true;
    if (isExpired) {
      logger.info(`[GoogleDriveRoute] Access token expired for user: ${userId}. Refreshing...`);
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      // Update database with new tokens
      if (credentials.access_token) {
        await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', credentials.access_token);
      }
      if (credentials.expiry_date) {
        await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', String(credentials.expiry_date));
      }
      logger.info(`[GoogleDriveRoute] Successfully refreshed Google Drive token for user: ${userId}`);
    }

    const activeToken = oauth2Client.credentials.access_token;
    res.json({ connected: true, accessToken: activeToken });
  } catch (err) {
    logger.error('[GoogleDriveToken] Error retrieving or refreshing token:', err);
    res.status(500).json({ error: 'Fallo al obtener el token de Google Drive. Asegúrate de tener la cuenta conectada.' });
  }
});

/**
 * Downloads a file from Google Drive and uploads it to Wappy's standard file storage and DB.
 */
router.post('/import-file', requireJwtAuth, configMiddleware, async (req, res) => {
  const { fileId, endpoint, toolResource } = req.body;
  if (!fileId) {
    return res.status(400).json({ error: 'Se requiere "fileId" para importar el archivo.' });
  }

  const userId = req.user.id;
  const company = await getActiveCompany(userId);
  const companyId = company ? String(company._id) : null;
  let tempFilePath = '';

  if (req.user && req.user.role === 'USER') {
    const { countUserFilesToday } = require('~/models/File');
    const count = await countUserFilesToday(userId);
    if (count >= 3) {
      return res.status(403).json({
        error: 'upload_limit_reached',
        message: 'Has alcanzado el límite de 3 archivos diarios del plan Gratis. Adquiere el plan Wappy Vital para subidas ilimitadas.',
      });
    }
  }

  try {
    const accessToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', false);
    const refreshToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false);
    const expiryStr = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', false);
    const expiry = Number(expiryStr);

    if (!accessToken || !refreshToken) {
      return res.status(400).json({ error: 'Google Drive no está conectado. Por favor, conéctalo en Configuración.' });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiry,
    });

    const isExpired = expiry ? (expiry - Date.now() < 60000) : true;
    if (isExpired) {
      logger.info(`[GoogleDriveImport] Access token expired for user: ${userId}. Refreshing...`);
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      if (credentials.access_token) {
        await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', credentials.access_token);
      }
      if (credentials.expiry_date) {
        await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', String(credentials.expiry_date));
      }
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Fetch file metadata
    const metadataRes = await drive.files.get({
      fileId,
      fields: 'name, mimeType, size',
    });
    const { name, mimeType, size } = metadataRes.data;

    let isGoogleWorkspace = false;
    let exportMimeType = '';
    let exportExtension = '';

    if (mimeType === 'application/vnd.google-apps.document') {
      isGoogleWorkspace = true;
      exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      exportExtension = '.docx';
    } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      isGoogleWorkspace = true;
      exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      exportExtension = '.xlsx';
    } else if (mimeType === 'application/vnd.google-apps.presentation') {
      isGoogleWorkspace = true;
      exportMimeType = 'application/pdf';
      exportExtension = '.pdf';
    }

    // Download file stream (handling Google Workspace export)
    let response;
    let finalName = name;
    let finalMimeType = mimeType;

    if (isGoogleWorkspace) {
      response = await drive.files.export(
        { fileId, mimeType: exportMimeType },
        { responseType: 'stream' }
      );
      if (!name.toLowerCase().endsWith(exportExtension)) {
        finalName = `${name}${exportExtension}`;
      }
      finalMimeType = exportMimeType;
    } else {
      response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );
    }

    const appConfig = req.config;
    const crypto = require('crypto');
    const path = require('path');
    const fsPromises = require('fs').promises;
    const fs = require('fs');

    const tempDir = path.join(appConfig.paths.uploads, 'temp', userId);
    if (!fs.existsSync(tempDir)) {
      await fsPromises.mkdir(tempDir, { recursive: true });
    }

    const fileUUID = crypto.randomUUID();
    tempFilePath = path.join(tempDir, `${fileUUID}-${finalName}`);

    const writeStream = fs.createWriteStream(tempFilePath);
    await new Promise((resolve, reject) => {
      response.data
        .pipe(writeStream)
        .on('finish', () => resolve())
        .on('error', (err) => reject(err));
    });

    const fileStats = fs.statSync(tempFilePath);
    const finalSize = fileStats.size;

    // Populate standard file properties
    req.file = {
      path: tempFilePath,
      originalname: finalName,
      mimetype: finalMimeType,
      size: finalSize,
      filename: `${fileUUID}-${finalName}`,
    };
    req.file_id = fileUUID;

    const { processFileUpload } = require('~/server/services/Files/process');
    const metadata = {
      file_id: fileUUID,
      endpoint,
      tool_resource: toolResource,
      message_file: !toolResource,
    };

    await processFileUpload({
      req,
      res,
      metadata,
    });

  } catch (err) {
    logger.error('[GoogleDriveImport] Import file failed:', err);
    res.status(500).json({ message: `Fallo al importar archivo desde Google Drive: ${err.message}` });
  } finally {
    if (tempFilePath) {
      const fs = require('fs');
      if (fs.existsSync(tempFilePath)) {
        try {
          await require('fs').promises.unlink(tempFilePath);
        } catch (unlinkErr) {
          logger.error('[GoogleDriveImport] Failed to clean up temp file:', unlinkErr);
        }
      }
    }
  }
});

// =========================================================================
// RUTAS DE BASE DE DATOS EN TIEMPO REAL CON GOOGLE SHEETS PARA CANVAS Y APPS
// =========================================================================

/**
 * Verifica si el usuario actual o su empresa activa tienen Google Workspace conectado.
 */
router.get('/sheets/status', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company ? String(company._id) : null;

    const email = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EMAIL', false);
    const refreshToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false);

    res.json({
      connected: !!refreshToken,
      email: email || null,
      company: company?.companyName || null,
    });
  } catch (err) {
    logger.error('[GoogleSheetsRoute] Error checking status:', err);
    res.status(500).json({ error: 'Error verificando estado de conexión con Google Sheets' });
  }
});

/**
 * Lee datos y filas de una hoja de cálculo privada del usuario en Google Drive.
 */
router.get('/sheets/read', requireJwtAuth, async (req, res) => {
  try {
    const { spreadsheetId, range } = req.query;
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'El parámetro spreadsheetId es obligatorio' });
    }

    const auth = await getUserOAuth2Client(req.user.id);
    if (!auth) {
      return res.status(401).json({
        error: 'No se encontró una cuenta de Google Workspace conectada. Conecta tu cuenta en Configuración.',
      });
    }

    const sheets = google.sheets({ version: 'v4', auth });
    let readRange = range;

    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
      const sheetsList = meta.data.sheets || [];
      const firstSheetName = sheetsList[0]?.properties?.title || 'Hoja 1';
      const titles = sheetsList.map((s) => s.properties?.title).filter(Boolean);

      if (!readRange) {
        readRange = `'${firstSheetName}'!A1:Z500`;
      } else {
        const match = readRange.match(/^('?[^'!]+'?)!(.*)$/);
        if (match) {
          const specifiedSheet = match[1].replace(/^'|'$/g, '');
          if (titles.length > 0 && !titles.includes(specifiedSheet)) {
            readRange = `'${firstSheetName}'!${match[2]}`;
          }
        } else {
          readRange = `'${firstSheetName}'!${readRange}`;
        }
      }
    } catch (metaErr) {
      if (!readRange) readRange = 'A1:Z500';
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: readRange,
    });

    const values = response.data.values || [];
    const headers = values[0] || [];
    const rows = values.slice(1);

    res.json({
      success: true,
      range: response.data.range,
      headers,
      rows,
      values,
      count: rows.length,
    });
  } catch (err) {
    logger.error('[GoogleSheetsRoute] Read failed:', err);
    res.status(500).json({ error: `Fallo al leer datos de Google Sheets: ${err.message}` });
  }
});

/**
 * Inserta una o varias filas de datos al final de una hoja de Google Sheets.
 */
router.post('/sheets/append', requireJwtAuth, async (req, res) => {
  try {
    const { spreadsheetId, values, range } = req.body;
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'El parámetro spreadsheetId es obligatorio' });
    }
    if (!values || !Array.isArray(values) || values.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de valores (filas)' });
    }

    const auth = await getUserOAuth2Client(req.user.id);
    if (!auth) {
      return res.status(401).json({
        error: 'No se encontró una cuenta de Google Workspace conectada. Conecta tu cuenta en Configuración.',
      });
    }

    const sheets = google.sheets({ version: 'v4', auth });
    let appendRange = range;
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
      const sheetsList = meta.data.sheets || [];
      const firstSheetName = sheetsList[0]?.properties?.title || 'Hoja 1';
      const titles = sheetsList.map((s) => s.properties?.title).filter(Boolean);

      if (!appendRange) {
        appendRange = `'${firstSheetName}'!A1`;
      } else {
        const match = appendRange.match(/^('?[^'!]+'?)!(.*)$/);
        if (match) {
          const specifiedSheet = match[1].replace(/^'|'$/g, '');
          if (titles.length > 0 && !titles.includes(specifiedSheet)) {
            appendRange = `'${firstSheetName}'!${match[2]}`;
          }
        } else {
          appendRange = `'${firstSheetName}'!${appendRange}`;
        }
      }
    } catch (metaErr) {
      if (!appendRange) appendRange = 'A1';
    }

    // Limpiar etiquetas HTML de los valores
    const cleanedValues = values.map((row) =>
      Array.isArray(row)
        ? row.map((cell) => (typeof cell === 'string' ? cell.replace(/<[^>]+>/g, '').trim() : cell))
        : [row],
    );

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: appendRange,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: cleanedValues,
      },
    });

    res.json({
      success: true,
      updatedRange: response.data.updates?.updatedRange,
      updatedRows: response.data.updates?.updatedRows || cleanedValues.length,
      updatedCells: response.data.updates?.updatedCells,
    });
  } catch (err) {
    logger.error('[GoogleSheetsRoute] Append failed:', err);
    res.status(500).json({ error: `Fallo al escribir en Google Sheets: ${err.message}` });
  }
});

/**
 * Crea una nueva hoja de cálculo en el Google Drive del usuario con cabeceras predefinidas y estilo corporativo.
 */
router.post('/sheets/create', requireJwtAuth, async (req, res) => {
  try {
    const { title, headers } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'El campo title es obligatorio' });
    }

    const auth = await getUserOAuth2Client(req.user.id);
    if (!auth) {
      return res.status(401).json({
        error: 'No se encontró una cuenta de Google Workspace conectada. Conecta tu cuenta en Configuración.',
      });
    }

    const sheets = google.sheets({ version: 'v4', auth });
    const createRes = await sheets.spreadsheets.create({
      resource: {
        properties: { title },
      },
      fields: 'spreadsheetId,spreadsheetUrl,sheets.properties',
    });

    const spreadsheetId = createRes.data.spreadsheetId;
    const spreadsheetUrl = createRes.data.spreadsheetUrl;
    const firstSheet = createRes.data.sheets?.[0]?.properties;
    const firstSheetTitle = firstSheet?.title || 'Hoja 1';
    const firstSheetId = firstSheet?.sheetId ?? 0;

    // Si se enviaron cabeceras, insertarlas en la primera fila y aplicar formato corporativo WAPPY
    if (Array.isArray(headers) && headers.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${firstSheetTitle}'!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [headers],
        },
      });

      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: firstSheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: headers.length,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: { red: 0.06, green: 0.46, blue: 0.43 }, // #0f766e Teal WAPPY
                      textFormat: {
                        foregroundColor: { red: 1, green: 1, blue: 1 },
                        bold: true,
                        fontSize: 10,
                      },
                      horizontalAlignment: 'CENTER',
                      verticalAlignment: 'MIDDLE',
                    },
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
                },
              },
              {
                updateSheetProperties: {
                  properties: {
                    sheetId: firstSheetId,
                    gridProperties: {
                      hideGridlines: false,
                    },
                  },
                  fields: 'gridProperties.hideGridlines',
                },
              },
            ],
          },
        });
      } catch (fmtErr) {
        logger.warn('[GoogleSheetsRoute] Could not format header row:', fmtErr.message);
      }
    }

    res.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
    });
  } catch (err) {
    logger.error('[GoogleSheetsRoute] Create failed:', err);
    res.status(500).json({ error: `Fallo al crear hoja en Google Drive: ${err.message}` });
  }
});

module.exports = router;
