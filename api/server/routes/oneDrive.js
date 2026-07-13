const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { logger } = require('@librechat/data-schemas');
const { requireJwtAuth, configMiddleware } = require('~/server/middleware');
const {
  getActiveCompany,
  getScopedAuthValue,
  updateScopedAuthValue,
  deleteScopedAuthValue,
} = require('~/server/services/oneDriveAuthHelper');

const router = express.Router();

const SCOPES = 'files.readwrite offline_access User.Read';

const getRedirectUri = () => {
  const domain = (process.env.DOMAIN_SERVER || '').replace(/\/$/, '');
  return `${domain}/api/one-drive/callback`;
};

/**
 * Initiates the OneDrive OAuth flow.
 * Generates authorization URL and redirects user.
 */
router.get('/auth', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company ? String(company._id) : null;

    const referer = req.headers.referer || req.headers.origin || process.env.DOMAIN_CLIENT;
    let clientDomain = process.env.DOMAIN_CLIENT;
    try {
      const parsedUrl = new URL(referer);
      clientDomain = `${parsedUrl.protocol}//${parsedUrl.host}`;
    } catch (e) {
      // Fallback
    }

    const state = jwt.sign({ userId, companyId, clientDomain }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const redirectUri = getRedirectUri();
    
    const authorizationUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${process.env.ONEDRIVE_CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_mode=query` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&state=${state}`;

    res.json({ url: authorizationUrl });
  } catch (err) {
    logger.error('[OneDriveAuth] Error generating auth URL:', err);
    res.status(500).json({ error: 'Fallo al iniciar la autenticación con OneDrive' });
  }
});

/**
 * Callback URL invoked by Microsoft after user grants permissions.
 * Exchanges auth code for tokens and saves them.
 */
router.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  let clientDomain = process.env.DOMAIN_CLIENT;
  try {
    if (state) {
      const decoded = jwt.verify(state, process.env.JWT_SECRET);
      if (decoded.clientDomain) {
        clientDomain = decoded.clientDomain;
      }
    }
  } catch (e) {
    // Fallback
  }

  if (error) {
    logger.error('[OneDriveCallback] Microsoft OAuth error:', error, error_description);
    return res.redirect(`${clientDomain}/c/settings?tab=account&one_drive=error`);
  }

  if (!code || !state) {
    logger.error('[OneDriveCallback] Missing code or state');
    return res.redirect(`${clientDomain}/c/settings?tab=account&one_drive=error`);
  }

  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const companyId = decoded.companyId;

    if (!userId) {
      throw new Error('UserId not present in state token');
    }

    const redirectUri = getRedirectUri();
    const params = new URLSearchParams();
    params.append('client_id', process.env.ONEDRIVE_CLIENT_ID);
    params.append('client_secret', process.env.ONEDRIVE_CLIENT_SECRET);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');

    const tokenResponse = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const tokens = tokenResponse.data;

    // Fetch user profile from Microsoft Graph to get their email
    const meResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const microsoftEmail = meResponse.data.mail || meResponse.data.userPrincipalName || meResponse.data.displayName;

    const expiryTime = Date.now() + tokens.expires_in * 1000;

    if (tokens.access_token) {
      await updateScopedAuthValue(userId, companyId, 'ONEDRIVE_ACCESS_TOKEN', tokens.access_token);
    }
    if (tokens.refresh_token) {
      await updateScopedAuthValue(userId, companyId, 'ONEDRIVE_REFRESH_TOKEN', tokens.refresh_token);
    }
    if (expiryTime) {
      await updateScopedAuthValue(userId, companyId, 'ONEDRIVE_EXPIRY', String(expiryTime));
    }
    if (microsoftEmail) {
      await updateScopedAuthValue(userId, companyId, 'ONEDRIVE_EMAIL', microsoftEmail);
    }

    logger.info(`[OneDriveCallback] Successfully connected OneDrive for user: ${userId} (${microsoftEmail}) in company ${companyId}`);
    res.redirect(`${clientDomain}/c/settings?tab=account&one_drive=success`);
  } catch (err) {
    logger.error('[OneDriveCallback] OAuth callback handling failed:', err.response?.data || err.message);
    res.redirect(`${clientDomain}/c/settings?tab=account&one_drive=error`);
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
      const refreshToken = await getScopedAuthValue(userId, companyId, 'ONEDRIVE_REFRESH_TOKEN', false);
      if (refreshToken) {
        connected = true;
        email = await getScopedAuthValue(userId, companyId, 'ONEDRIVE_EMAIL', false);
      }
    } catch (authErr) {
      // User doesn't have the token stored yet
    }

    res.json({ connected, email, companyName });
  } catch (err) {
    logger.error('[OneDriveStatus] Error checking connection status:', err);
    res.status(500).json({ error: 'Fallo al verificar el estado de OneDrive' });
  }
});

/**
 * Disconnects OneDrive by removing stored tokens.
 */
router.delete('/disconnect', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company ? String(company._id) : null;

    await deleteScopedAuthValue(userId, companyId);

    logger.info(`[OneDriveDisconnect] OneDrive disconnected for user: ${userId} in company ${companyId}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('[OneDriveDisconnect] Error disconnecting OneDrive:', err);
    res.status(500).json({ error: 'Fallo al desconectar OneDrive' });
  }
});

/**
 * Retrieves the active user OneDrive access token, automatically refreshing it if expired.
 */
router.get('/token', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company ? String(company._id) : null;

    let accessToken = await getScopedAuthValue(userId, companyId, 'ONEDRIVE_ACCESS_TOKEN', false);
    const refreshToken = await getScopedAuthValue(userId, companyId, 'ONEDRIVE_REFRESH_TOKEN', false);
    const expiryStr = await getScopedAuthValue(userId, companyId, 'ONEDRIVE_EXPIRY', false);
    const expiry = Number(expiryStr);

    if (!accessToken || !refreshToken) {
      return res.json({ connected: false });
    }

    const isExpired = expiry ? (expiry - Date.now() < 60000) : true;
    if (isExpired) {
      logger.info(`[OneDriveToken] Access token expired for user: ${userId}. Refreshing...`);
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
        logger.info(`[OneDriveToken] Successfully refreshed OneDrive token for user: ${userId}`);
      } catch (refreshErr) {
        logger.error(`[OneDriveToken] Failed to refresh token for user: ${userId}`, refreshErr.response?.data || refreshErr.message);
        return res.status(401).json({ error: 'La conexión con OneDrive ha expirado. Por favor, conéctate de nuevo en Configuración.' });
      }
    }

    res.json({ connected: true, accessToken, clientId: process.env.ONEDRIVE_CLIENT_ID });
  } catch (err) {
    logger.error('[OneDriveToken] Error retrieving or refreshing token:', err);
    res.status(500).json({ error: 'Fallo al obtener el token de OneDrive. Asegúrate de tener la cuenta conectada.' });
  }
});

/**
 * Downloads a file from OneDrive and uploads it to standard storage/DB.
 */
router.post('/import-file', requireJwtAuth, configMiddleware, async (req, res) => {
  const { fileId, fileName, downloadUrl, endpoint, toolResource } = req.body;
  if (!fileId) {
    return res.status(400).json({ error: 'Se requiere "fileId" para importar el archivo.' });
  }

  const userId = req.user.id;
  const company = await getActiveCompany(userId);
  const companyId = company ? String(company._id) : null;
  let tempFilePath = '';

  try {
    let accessToken = await getScopedAuthValue(userId, companyId, 'ONEDRIVE_ACCESS_TOKEN', false);
    const refreshToken = await getScopedAuthValue(userId, companyId, 'ONEDRIVE_REFRESH_TOKEN', false);
    const expiryStr = await getScopedAuthValue(userId, companyId, 'ONEDRIVE_EXPIRY', false);
    const expiry = Number(expiryStr);

    if (!accessToken || !refreshToken) {
      return res.status(400).json({ error: 'OneDrive no está conectado. Por favor, conéctalo en Configuración.' });
    }

    // Refresh if expired
    const isExpired = expiry ? (expiry - Date.now() < 60000) : true;
    if (isExpired) {
      logger.info(`[OneDriveImport] Access token expired. Refreshing...`);
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
    }

    // Determine download mechanism:
    // 1. Direct downloadUrl (pre-authenticated OneDrive Picker URL)
    // 2. Microsoft Graph API endpoint for file content stream
    let response;
    if (downloadUrl) {
      response = await axios.get(downloadUrl, { responseType: 'stream' });
    } else {
      response = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'stream',
      });
    }

    // Determine final name and mime type
    let finalName = fileName || 'onedrive_file';
    let finalMimeType = 'application/octet-stream';

    // Make a metadata call if we don't have fileName/mimeType
    try {
      const metaRes = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (metaRes.data.name) finalName = metaRes.data.name;
      if (metaRes.data.file && metaRes.data.file.mimeType) {
        finalMimeType = metaRes.data.file.mimeType;
      }
    } catch (metaErr) {
      // Ignore and use fallbacks or name from body
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
    logger.error('[OneDriveImport] Import file failed:', err.response?.data || err.message);
    res.status(500).json({ message: `Fallo al importar archivo desde OneDrive: ${err.message}` });
  } finally {
    if (tempFilePath) {
      const fs = require('fs');
      if (fs.existsSync(tempFilePath)) {
        try {
          await require('fs').promises.unlink(tempFilePath);
        } catch (unlinkErr) {
          logger.error('[OneDriveImport] Failed to clean up temp file:', unlinkErr);
        }
      }
    }
  }
});

module.exports = router;
