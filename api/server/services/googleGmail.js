const { google } = require('googleapis');
const { logger } = require('@librechat/data-schemas');
const { getScopedAuthValue, updateScopedAuthValue } = require('./googleAuthHelper');

/**
 * Returns an authorized OAuth2 client for the given user.
 */
const getOAuth2Client = (redirectUri) => {
  const domain = (process.env.DOMAIN_SERVER || '').replace(/\/$/, '');
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || `${domain}/api/google-drive/callback`
  );
};

/**
 * Resolves the Gmail client for a given user, auto-refreshing the access token if needed.
 */
const getGmailClient = async (userId, companyId = null) => {
  try {
    const accessToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', false);
    const refreshToken = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_REFRESH_TOKEN', false);
    const expiryStr = await getScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', false);
    
    if (!accessToken || !refreshToken) {
      return null; // Not connected
    }

    const expiry = Number(expiryStr);
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiry,
    });

    // Check if access token is expired or close to expiry (within 1 minute)
    const isExpired = expiry ? (expiry - Date.now() < 60000) : true;
    if (isExpired) {
      logger.info(`[GoogleGmailService] Refreshing access token for user: ${userId}`);
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        if (credentials.access_token) {
          await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_ACCESS_TOKEN', credentials.access_token);
        }
        if (credentials.expiry_date) {
          await updateScopedAuthValue(userId, companyId, 'GOOGLE_DRIVE_EXPIRY', String(credentials.expiry_date));
        }
        logger.info(`[GoogleGmailService] Token refreshed successfully for user: ${userId}`);
      } catch (refreshErr) {
        logger.error(`[GoogleGmailService] Failed to refresh token for user ${userId}:`, refreshErr.message);
        return null;
      }
    }

    return google.gmail({ version: 'v1', auth: oauth2Client });
  } catch (err) {
    logger.error(`[GoogleGmailService] getGmailClient error for user ${userId}:`, err.message);
    return null;
  }
};

/**
 * Helper to encode email message in RFC 822 format base64url.
 */
const makeRawEmail = ({ to, subject, body, cc, bcc }) => {
  const str = [
    'Content-Type: text/html; charset="UTF-8"\r\n',
    'MIME-Version: 1.0\r\n',
    `To: ${to}\r\n`,
    cc ? `Cc: ${cc}\r\n` : '',
    bcc ? `Bcc: ${bcc}\r\n` : '',
    `Subject: =?UTF-8?B?${Buffer.from(subject || '').toString('base64')}?=\r\n\r\n`,
    body || '',
  ].join('');

  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Sends an email via Gmail API.
 */
const sendEmail = async (userId, { to, subject, body, cc, bcc }, companyId = null) => {
  try {
    const gmail = await getGmailClient(userId, companyId);
    if (!gmail) {
      throw new Error('Google Workspace no está conectado o autorizado.');
    }

    const raw = makeRawEmail({ to, subject, body, cc, bcc });
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    logger.info(`[GoogleGmailService] Email sent successfully to ${to} (ID: ${res.data.id})`);
    return res.data;
  } catch (err) {
    if (err.code === 403 || err.message?.toLowerCase().includes('insufficient permission')) {
      logger.warn(`[GoogleGmailService] Insufficient permissions for user ${userId}. Gmail scope might not be authorized.`);
      throw new Error('Los permisos de Gmail no están autorizados. Por favor desconecta y vuelve a conectar tu cuenta de Google Workspace en Configuración.');
    }
    logger.error(`[GoogleGmailService] Error sending email to ${to}:`, err.message);
    throw err;
  }
};

/**
 * Creates a draft email in Gmail.
 */
const createDraft = async (userId, { to, subject, body, cc, bcc }, companyId = null) => {
  try {
    const gmail = await getGmailClient(userId, companyId);
    if (!gmail) {
      throw new Error('Google Workspace no está conectado o autorizado.');
    }

    const raw = makeRawEmail({ to, subject, body, cc, bcc });
    const res = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: { raw },
      },
    });

    logger.info(`[GoogleGmailService] Draft created successfully (ID: ${res.data.id})`);
    return res.data;
  } catch (err) {
    logger.error(`[GoogleGmailService] Error creating draft:`, err.message);
    throw err;
  }
};

module.exports = {
  getGmailClient,
  sendEmail,
  createDraft,
};
