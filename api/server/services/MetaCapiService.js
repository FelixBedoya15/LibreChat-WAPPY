const crypto = require('crypto');

const DEFAULT_PIXEL_ID = '1552188416261002';
const GRAPH_API_VERSION = 'v21.0';

function sha256(value) {
    if (!value) return undefined;
    const normalized = String(value).trim().toLowerCase();
    if (!normalized) return undefined;
    return crypto.createHash('sha256').update(normalized, 'utf-8').digest('hex');
}

function normalizeColombianPhone(phone) {
    if (!phone) return undefined;
    const digits = String(phone).replace(/[^0-9]/g, '');
    if (!digits) return undefined;
    // Si es un celular colombiano de 10 dígitos (ej. 3001234567), anteponer código de país 57
    if (digits.length === 10 && digits.startsWith('3')) {
        return `57${digits}`;
    }
    return digits;
}

function parseCookies(cookieHeader) {
    const list = {};
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach((cookie) => {
        let [name, ...rest] = cookie.split('=');
        name = name?.trim();
        if (!name) return;
        const value = rest.join('=').trim();
        if (!value) return;
        try {
            list[name] = decodeURIComponent(value);
        } catch {
            list[name] = value;
        }
    });
    return list;
}

/**
 * Envía un evento Server-Side a Meta Conversions API (CAPI v21.0) con Advanced Matching SHA-256
 * y deduplicación por event_id frente al Meta Pixel del navegador.
 */
async function sendMetaCapiEvent({
    eventName,
    eventId,
    email,
    phone,
    fullName,
    customData = {},
    eventSourceUrl,
    req
}) {
    try {
        const pixelId = process.env.META_PIXEL_ID || DEFAULT_PIXEL_ID;
        const accessToken = process.env.META_CAPI_TOKEN || process.env.META_ACCESS_TOKEN;

        if (!accessToken) {
            // Sin token CAPI configurado aún, salir silenciosamente sin bloquear el flujo
            return { skipped: true, reason: 'META_CAPI_TOKEN not configured' };
        }

        const userData = {
            country: [sha256('co')]
        };

        if (email) {
            const emHash = sha256(email);
            if (emHash) userData.em = [emHash];
        }

        if (phone) {
            const normPhone = normalizeColombianPhone(phone);
            const phHash = sha256(normPhone);
            if (phHash) userData.ph = [phHash];
        }

        if (fullName) {
            const parts = String(fullName).trim().split(/\s+/);
            if (parts[0]) {
                const fnHash = sha256(parts[0]);
                if (fnHash) userData.fn = [fnHash];
            }
            if (parts.length > 1) {
                const lnHash = sha256(parts[parts.length - 1]);
                if (lnHash) userData.ln = [lnHash];
            }
        }

        if (req) {
            const forwarded = req.headers?.['x-forwarded-for'];
            const clientIp = forwarded
                ? String(forwarded).split(',')[0].trim()
                : (req.socket?.remoteAddress || req.ip);
            if (clientIp) {
                userData.client_ip_address = clientIp;
            }
            if (req.headers?.['user-agent']) {
                userData.client_user_agent = req.headers['user-agent'];
            }
            const cookies = parseCookies(req.headers?.cookie);
            if (cookies._fbp) userData.fbp = cookies._fbp;
            if (cookies._fbc) userData.fbc = cookies._fbc;
        }

        const payload = {
            data: [
                {
                    event_name: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    action_source: 'website',
                    event_id: eventId || `${eventName.toLowerCase()}_${Date.now()}`,
                    event_source_url: eventSourceUrl || req?.headers?.referer || 'https://app.wappy.club',
                    user_data: userData,
                    custom_data: customData
                }
            ]
        };

        const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok) {
            console.warn(`[Meta CAPI] Error sending ${eventName} (${eventId}):`, result?.error?.message || result);
            return { success: false, error: result?.error };
        }

        console.log(`[Meta CAPI] ✅ Sent ${eventName} (event_id: ${payload.data[0].event_id}) for ${email || 'user'}`);
        return { success: true, result };
    } catch (err) {
        console.warn(`[Meta CAPI] Exception sending ${eventName}:`, err.message);
        return { success: false, error: err.message };
    }
}

module.exports = {
    sendMetaCapiEvent,
    sha256,
    normalizeColombianPhone
};
