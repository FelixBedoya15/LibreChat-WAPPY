const express = require('express');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const { logger } = require('@librechat/data-schemas');
const { requireJwtAuth } = require('~/server/middleware');
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
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || `${process.env.DOMAIN_SERVER}/api/google-drive/callback`
  );
};

/**
 * Initiates the Google Drive OAuth flow.
 * Generates an authorization URL and redirects the user to Google.
 */
router.get('/auth', requireJwtAuth, (req, res) => {
  try {
    const userId = req.user.id;
    // Sign user ID in the state to verify it in the public callback (prevents CSRF)
    const state = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });

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

  if (error) {
    logger.error('[GoogleDriveCallback] Google OAuth error:', error);
    return res.redirect(`${process.env.DOMAIN_CLIENT}/c/settings?tab=account&google_drive=error`);
  }

  if (!code || !state) {
    logger.error('[GoogleDriveCallback] Missing code or state');
    return res.redirect(`${process.env.DOMAIN_CLIENT}/c/settings?tab=account&google_drive=error`);
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
    
    // Redirect user back to account settings
    res.redirect(`${process.env.DOMAIN_CLIENT}/c/settings?tab=account&google_drive=success`);
  } catch (err) {
    logger.error('[GoogleDriveCallback] OAuth callback handling failed:', err);
    res.redirect(`${process.env.DOMAIN_CLIENT}/c/settings?tab=account&google_drive=error`);
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

module.exports = router;
