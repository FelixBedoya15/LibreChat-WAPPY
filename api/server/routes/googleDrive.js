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

const router = express.Router();

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive',
];

const getOAuth2Client = (redirectUri) => {
  const domain = (process.env.DOMAIN_SERVER || '').replace(/\/$/, '');
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || `${domain}/api/google-drive/callback`
  );
};

/**
 * Initiates the Google Drive OAuth flow.
 * Generates an authorization URL and redirects the user to Google.
 */
router.get('/auth', requireJwtAuth, (req, res) => {
  try {
    const userId = req.user.id;
    // Get the referer to redirect back to the correct domain
    const referer = req.headers.referer || req.headers.origin || process.env.DOMAIN_CLIENT;
    let clientDomain = process.env.DOMAIN_CLIENT;
    try {
      const parsedUrl = new URL(referer);
      clientDomain = `${parsedUrl.protocol}//${parsedUrl.host}`;
    } catch (e) {
      // Fallback to DOMAIN_CLIENT
    }

    // Sign user ID and domain in the state to verify it in the public callback (prevents CSRF)
    const state = jwt.sign({ userId, clientDomain }, process.env.JWT_SECRET, { expiresIn: '15m' });

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
  let clientDomain = process.env.DOMAIN_CLIENT;
  try {
    if (state) {
      const decoded = jwt.verify(state, process.env.JWT_SECRET);
      if (decoded.clientDomain) {
        clientDomain = decoded.clientDomain;
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

    // Save tokens in MongoDB pluginAuth collection
    if (tokens.access_token) {
      await updateUserPluginAuth(userId, 'GOOGLE_DRIVE_ACCESS_TOKEN', 'google_drive', tokens.access_token);
    }
    if (tokens.refresh_token) {
      await updateUserPluginAuth(userId, 'GOOGLE_DRIVE_REFRESH_TOKEN', 'google_drive', tokens.refresh_token);
    }
    if (tokens.expiry_date) {
      await updateUserPluginAuth(userId, 'GOOGLE_DRIVE_EXPIRY', 'google_drive', String(tokens.expiry_date));
    }
    if (googleEmail) {
      await updateUserPluginAuth(userId, 'GOOGLE_DRIVE_EMAIL', 'google_drive', googleEmail);
    }

    logger.info(`[GoogleDriveCallback] Successfully connected Google Drive for user: ${userId} (${googleEmail})`);
    
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
    let connected = false;
    let email = null;

    try {
      const refreshToken = await getUserPluginAuthValue(userId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false, 'google_drive');
      if (refreshToken) {
        connected = true;
        email = await getUserPluginAuthValue(userId, 'GOOGLE_DRIVE_EMAIL', false, 'google_drive');
      }
    } catch (authErr) {
      // User doesn't have the token stored yet
    }

    res.json({ connected, email });
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

    // Optional: Attempt to revoke token with Google
    try {
      const refreshToken = await getUserPluginAuthValue(userId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false, 'google_drive');
      if (refreshToken) {
        const oauth2Client = getOAuth2Client();
        await oauth2Client.revokeToken(refreshToken);
      }
    } catch (revokeErr) {
      logger.warn('[GoogleDriveDisconnect] Failed to revoke token with Google, deleting locally anyway:', revokeErr.message);
    }

    // Delete credentials from pluginAuth
    await deleteUserPluginAuth(userId, null, true, 'google_drive');

    logger.info(`[GoogleDriveDisconnect] Google Drive disconnected for user: ${userId}`);
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

    const accessToken = await getUserPluginAuthValue(userId, 'GOOGLE_DRIVE_ACCESS_TOKEN', false, 'google_drive');
    const refreshToken = await getUserPluginAuthValue(userId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false, 'google_drive');
    const expiryStr = await getUserPluginAuthValue(userId, 'GOOGLE_DRIVE_EXPIRY', false, 'google_drive');
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
        await updateUserPluginAuth(userId, 'GOOGLE_DRIVE_ACCESS_TOKEN', 'google_drive', credentials.access_token);
      }
      if (credentials.expiry_date) {
        await updateUserPluginAuth(userId, 'GOOGLE_DRIVE_EXPIRY', 'google_drive', String(credentials.expiry_date));
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
  let tempFilePath = '';

  try {
    const accessToken = await getUserPluginAuthValue(userId, 'GOOGLE_DRIVE_ACCESS_TOKEN', false, 'google_drive');
    const refreshToken = await getUserPluginAuthValue(userId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false, 'google_drive');
    const expiryStr = await getUserPluginAuthValue(userId, 'GOOGLE_DRIVE_EXPIRY', false, 'google_drive');
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
        await updateUserPluginAuth(userId, 'GOOGLE_DRIVE_ACCESS_TOKEN', 'google_drive', credentials.access_token);
      }
      if (credentials.expiry_date) {
        await updateUserPluginAuth(userId, 'GOOGLE_DRIVE_EXPIRY', 'google_drive', String(credentials.expiry_date));
      }
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Fetch file metadata
    const metadataRes = await drive.files.get({
      fileId,
      fields: 'name, mimeType, size',
    });
    const { name, mimeType, size } = metadataRes.data;

    // Download file stream
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

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
    tempFilePath = path.join(tempDir, `${fileUUID}-${name}`);

    const writeStream = fs.createWriteStream(tempFilePath);
    await new Promise((resolve, reject) => {
      response.data
        .pipe(writeStream)
        .on('finish', () => resolve())
        .on('error', (err) => reject(err));
    });

    // Populate standard file properties
    req.file = {
      path: tempFilePath,
      originalname: name,
      mimetype: mimeType,
      size: Number(size || 0),
      filename: `${fileUUID}-${name}`,
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

module.exports = router;
