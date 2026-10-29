const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { execFile, spawn } = require('child_process');
const WebSocket = require('ws');
const router = express.Router();
const GoogleFlowSession = require('~/models/GoogleFlowSession');
const NotebookSession = require('~/models/NotebookSession');
const { requireJwtAuth } = require('~/server/middleware');
const { logger } = require('~/config');
const paths = require('~/config/paths');

const OUTPUT_MEDIA_DIR =
  paths.imageOutput || path.resolve(__dirname, '../../../client/public/images');

/**
 * Normaliza una cookie al formato estándar
 */
function normalizeCookie(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim();
  const value = String(raw.value || '').trim();
  if (!name || !value) return null;

  let sameSite = String(raw.sameSite || 'Lax');
  const lower = sameSite.toLowerCase();
  if (lower === 'no_restriction' || lower === 'unspecified') {
    sameSite = 'Lax';
  } else if (lower === 'none') {
    sameSite = 'None';
  } else if (lower === 'strict') {
    sameSite = 'Strict';
  } else {
    sameSite = 'Lax';
  }

  return {
    name,
    value,
    domain: String(raw.domain || '.google.com'),
    path: String(raw.path || '/'),
    secure: Boolean(raw.secure ?? true),
    httpOnly: Boolean(raw.httpOnly ?? true),
    sameSite,
  };
}

/**
 * Convierte diferentes formatos de entrada (JSON, lista, header string) en lista de cookies
 */
function parseIncomingCookies(input) {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.map(normalizeCookie).filter(Boolean);
  }

  if (typeof input === 'object' && Array.isArray(input.cookies)) {
    return input.cookies.map(normalizeCookie).filter(Boolean);
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseIncomingCookies(parsed);
      } catch (e) {
        logger.warn('[GoogleFlow] Error parseando JSON de cookies:', e.message);
      }
    }

    const cookies = [];
    const pairs = trimmed.split(';');
    for (const pair of pairs) {
      if (pair.includes('=')) {
        const [name, ...rest] = pair.split('=');
        const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
        const cleanName = name.trim();
        if (cleanName && val) {
          cookies.push(
            normalizeCookie({
              name: cleanName,
              value: val,
              domain: '.google.com',
              path: '/',
              secure: true,
              httpOnly: true,
              sameSite: 'Lax',
            })
          );
        }
      }
    }
    return cookies.filter(Boolean);
  }

  return [];
}

/**
 * Valida localmente la integridad de las cookies de Google
 */
function validateCookiesLocally(cookies) {
  if (!cookies || cookies.length === 0) {
    return { success: false, reason: 'Lista de cookies vacía.' };
  }

  const cookieMap = new Map(cookies.map((c) => [c.name, c.value]));
  const hasPsid = cookieMap.has('__Secure-1PSID');
  const hasPsidTs = cookieMap.has('__Secure-1PSIDTS');
  const hasSid = cookieMap.has('SID');

  if (!hasSid) {
    return { success: false, reason: 'Falta la cookie SID — inicia sesión en Google primero.' };
  }

  if (!hasPsid && !hasPsidTs) {
    return {
      success: false,
      reason: 'Falta __Secure-1PSID o __Secure-1PSIDTS — asegúrate de tener tu cuenta de Google abierta.',
    };
  }

  const sid = cookieMap.get('SID') || '';
  if (sid.length < 10) {
    return { success: false, reason: 'Cookie SID parece estar vacía o incompleta.' };
  }

  return { success: true };
}

/**
 * Filtra las cookies para evitar colisiones (CookieMismatch) entre .google.com.co / notebooklm.google.com y flow.google.com
 */
function buildFlowCookieHeader(cookies) {
  if (!Array.isArray(cookies) || cookies.length === 0) return '';
  const filtered = cookies.filter((c) => {
    const dom = String(c.domain || '.google.com').toLowerCase();
    return dom === 'flow.google.com' || dom === '.flow.google.com' || dom === '.google.com' || dom === 'google.com';
  });
  const source = filtered.length > 0 ? filtered : cookies;
  const dedup = new Map();
  for (const c of source) {
    if (c && c.name && c.value) {
      dedup.set(c.name, c.value);
    }
  }
  return Array.from(dedup.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

/**
 * Intenta obtener la sesión en vivo de Google Flow (flow.google.com Boq + créditos de VideoFxService)
 */
async function fetchLabsFxSession(cookies) {
  if (!Array.isArray(cookies) || cookies.length === 0) {
    return { ok: false };
  }
  const cookieHeader = buildFlowCookieHeader(cookies);
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

  try {
    const pageRes = await axios.get('https://flow.google.com/', {
      headers: {
        Cookie: cookieHeader,
        'User-Agent': ua,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 12000,
      maxRedirects: 5,
    });

    const html = typeof pageRes.data === 'string' ? pageRes.data : '';
    const emailMatch = html.match(/"oPEP7c":"([^"]+@[^"]+)"/);
    const atMatch = html.match(/"SNlM0e":"([^"]+)"/);
    const sidMatch = html.match(/"FdrFJe":"([^"]+)"/);
    const blMatch = html.match(/"cfb2h":"([^"]+)"/);

    if (atMatch && atMatch[1]) {
      const at = atMatch[1];
      const fSid = sidMatch ? sidMatch[1] : '';
      const bl = blMatch ? blMatch[1] : 'boq_labs-ai-sandbox-frontend_20261027.00_p0';
      const email = emailMatch ? emailMatch[1] : null;
      let credits = null;

      try {
        const rpcId = 'nzlxg';
        const fReq = JSON.stringify([[[rpcId, '[]', null, 'generic']]]);
        const params = new URLSearchParams({
          rpcids: rpcId,
          'source-path': '/',
          bl,
          'f.sid': fSid,
          hl: 'es-419',
          _reqid: String(Math.floor(100000 + Math.random() * 800000)),
          rt: 'c',
        });
        const body = new URLSearchParams({ 'f.req': fReq, at }).toString();
        const batchRes = await axios.post(
          `https://flow.google.com/_/AiSandboxAngularFrontend/data/batchexecute?${params.toString()}`,
          body,
          {
            headers: {
              Cookie: cookieHeader,
              'User-Agent': ua,
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
              Origin: 'https://flow.google.com',
              Referer: 'https://flow.google.com/',
            },
            timeout: 8000,
          }
        );
        const rawText = typeof batchRes.data === 'string' ? batchRes.data : '';
        const creditMatch = rawText.match(/\[\["wrb\.fr","nzlxg","\[(\d+)/);
        if (creditMatch && creditMatch[1]) {
          credits = parseInt(creditMatch[1], 10);
        }
      } catch (_) {}

      return {
        ok: true,
        email,
        at,
        fSid,
        bl,
        credits,
        cookieHeader,
      };
    }
  } catch (err) {
    logger.debug('[GoogleFlow] Info consultando flow.google.com:', err.message);
  }

  try {
    const res = await axios.get('https://labs.google/fx/api/auth/session', {
      headers: {
        Cookie: cookieHeader,
        'User-Agent': ua,
        Accept: 'application/json',
      },
      timeout: 8000,
    });
    if (res.data && (res.data.access_token || res.data.user)) {
      return {
        ok: true,
        accessToken: res.data.access_token || null,
        email: res.data.user?.email || null,
        name: res.data.user?.name || null,
        cookieHeader,
      };
    }
  } catch (_) {}

  return { ok: false };
}

/**
 * Resuelve las credenciales de Google del usuario (Sesión de Flow, Sesión de NotebookLM o API Key)
 */
async function resolveGoogleFlowCredentials(userId) {
  let flowSession = null;
  let notebookSession = null;

  if (userId) {
    flowSession = await GoogleFlowSession.findOne({ user: userId }).lean().catch(() => null);
    notebookSession = await NotebookSession.findOne({ user: userId }).lean().catch(() => null);
  }

  const cookies =
    flowSession?.cookies?.length > 0
      ? flowSession.cookies
      : notebookSession?.cookies?.length > 0
      ? notebookSession.cookies
      : [];

  let apiKeys = [];
  if (flowSession?.apiKey) {
    apiKeys.push(...String(flowSession.apiKey).split(',').map((k) => k.trim()).filter(Boolean));
  }

  if (userId) {
    try {
      const { getUserKey } = require('~/server/services/UserService');
      const userKeyData = await getUserKey({ userId, name: 'google' });
      if (userKeyData && userKeyData !== 'user_provided') {
        let rawKeyStr = userKeyData;
        try {
          const parsed = typeof userKeyData === 'string' ? JSON.parse(userKeyData) : userKeyData;
          rawKeyStr = parsed.GOOGLE_API_KEY || parsed.GOOGLE_KEY || Object.values(parsed)[0] || '';
        } catch {
          rawKeyStr = userKeyData;
        }
        if (rawKeyStr) {
          apiKeys.push(...String(rawKeyStr).split(',').map((k) => k.trim()).filter(Boolean));
        }
      }
    } catch (_) {}
  }

  const envKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (envKey && envKey !== 'user_provided') {
    apiKeys.push(...String(envKey).split(',').map((k) => k.trim()).filter(Boolean));
  }

  try {
    const { getSystemGoogleKey } = require('~/server/controllers/AdminMarketingController');
    const sysKey = await getSystemGoogleKey();
    if (sysKey) {
      apiKeys.push(...String(sysKey).split(',').map((k) => k.trim()).filter(Boolean));
    }
  } catch (_) {}

  apiKeys = Array.from(new Set(apiKeys.filter((k) => k && k.startsWith('AIza'))));
  const apiKey = apiKeys[0] || null;

  return {
    cookies,
    apiKey,
    apiKeys,
    email: flowSession?.email || notebookSession?.email || '',
    hasFlowSession: Boolean(flowSession),
    hasNotebookSession: Boolean(notebookSession?.cookies?.length > 0),
  };
}

/**
 * Envía un comando CDP (Chrome DevTools Protocol) a una instancia local de Chromium
 */
function cdpRequest(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', handler);
      reject(new Error(`CDP timeout on ${method}`));
    }, 45000);
    const handler = (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          clearTimeout(timer);
          ws.off('message', handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      } catch (_) {}
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

/**
 * Resuelve el binario de Chromium / Chrome instalado en el servidor o contenedor
 */
function findServerChromiumBinary() {
  const candidates = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  for (const bin of candidates) {
    if (fs.existsSync(bin)) return bin;
  }
  return 'chromium';
}

/**
 * Obtiene el primer projectId activo del usuario en flow.google.com (o crea uno si no tiene)
 */
async function resolveFlowProjectId(cookieHeader, at, fSid, bl) {
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  try {
    const fReq = JSON.stringify([[['UpteDb', '[]', null, 'generic']]]);
    const params = new URLSearchParams({
      rpcids: 'UpteDb',
      'source-path': '/',
      bl,
      'f.sid': fSid,
      hl: 'es-419',
      rt: 'c',
    });
    const body = new URLSearchParams({ 'f.req': fReq, at }).toString();
    const res = await axios.post(
      `https://flow.google.com/_/AiSandboxAngularFrontend/data/batchexecute?${params.toString()}`,
      body,
      {
        headers: {
          Cookie: cookieHeader,
          'User-Agent': ua,
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Origin: 'https://flow.google.com',
          Referer: 'https://flow.google.com/',
        },
        timeout: 10000,
      }
    );
    const raw = typeof res.data === 'string' ? res.data : '';
    const uuidMatch = raw.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (uuidMatch && uuidMatch[1]) {
      return uuidMatch[1];
    }
  } catch (err) {
    logger.debug('[GoogleFlow] Info obteniendo UpteDb projectId:', err.message);
  }
  return null;
}

/**
 * Ejecuta una generación real de imagen o video dentro de la cuenta de Google Flow (flow.google.com)
 * usando Chromium Headless + Boq batchexecute (ogiZ0b para Nano Banana 2 Lite / 2.1, YhhmEf para Veo 3.1 Lite)
 */
async function executeFlowNativeStudioAction({
  cookies,
  actionType = 'IMAGE_GENERATION',
  prompt,
  aspectRatio = '16:9',
}) {
  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error('No hay cookies de sesión de Google Flow disponibles.');
  }

  const filtered = cookies.filter((c) => {
    const dom = String(c.domain || '.google.com').toLowerCase();
    return (
      dom === 'flow.google.com' ||
      dom === '.flow.google.com' ||
      dom === '.google.com' ||
      dom === 'google.com'
    );
  });

  const cookieHeader = buildFlowCookieHeader(cookies);
  const chromiumBin = findServerChromiumBinary();
  const port = 9450 + Math.floor(Math.random() * 450);
  const profileDir = `/tmp/wappy-flow-cdp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  await fs.promises.mkdir(profileDir, { recursive: true });

  const proc = spawn(
    chromiumBin,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1440,900',
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let ws = null;
  try {
    let pageTarget = null;
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 350));
      try {
        const listRes = await axios.get(`http://127.0.0.1:${port}/json/list`, { timeout: 2000 });
        pageTarget = Array.isArray(listRes.data)
          ? listRes.data.find(
              (t) =>
                t.type === 'page' &&
                t.webSocketDebuggerUrl &&
                !String(t.url || '').startsWith('chrome-extension://') &&
                !String(t.url || '').startsWith('devtools://')
            )
          : null;
        if (pageTarget) break;
      } catch (_) {}
    }

    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('No se pudo inicializar el motor Chromium para Google Flow.');
    }

    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.once('open', resolve);
      ws.once('error', reject);
    });

    await cdpRequest(ws, 1, 'Network.enable');
    await cdpRequest(ws, 2, 'Page.enable');
    await cdpRequest(ws, 3, 'Page.addScriptToEvaluateOnNewDocument', {
      source: `
        Object.defineProperty(navigator, "webdriver", { get: () => undefined });
        const origDefProp = Object.defineProperty;
        Object.defineProperty = function(obj, prop, desc) {
          if (prop === "execute" && desc && typeof desc.value === "function") {
            window.__origRecapExec = obj.execute ? obj.execute.bind(obj) : desc.value;
            return obj;
          }
          return origDefProp.call(this, obj, prop, desc);
        };
      `,
    });

    for (let i = 0; i < filtered.length; i++) {
      const c = filtered[i];
      await cdpRequest(ws, 10 + i, 'Network.setCookie', {
        name: c.name,
        value: c.value,
        domain: c.domain || '.google.com',
        path: c.path || '/',
        secure: true,
        httpOnly: Boolean(c.httpOnly),
      }).catch(() => {});
    }

    await cdpRequest(ws, 200, 'Page.navigate', { url: 'https://flow.google.com/' });

    let tokenInfo = null;
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 750));
      const evalRes = await cdpRequest(ws, 300 + i, 'Runtime.evaluate', {
        expression: `(async () => {
          if (window.grecaptcha && window.grecaptcha.enterprise && window.WIZ_global_data && window.WIZ_global_data.SNlM0e) {
            const execFn = window.__origRecapExec || window.grecaptcha.enterprise.execute;
            const siteKey = window.WIZ_global_data.xZbWve || "6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV";
            const t = await execFn(siteKey, { action: ${JSON.stringify(actionType)} });
            if (typeof t === "string" && t.length > 20) {
              return JSON.stringify({
                token: t,
                at: window.WIZ_global_data.SNlM0e,
                fSid: window.WIZ_global_data.FdrFJe || "",
                bl: window.WIZ_global_data.cfb2h || "boq_labs-ai-sandbox-frontend_20261027.00_p0"
              });
            }
          }
          return null;
        })()`,
        awaitPromise: true,
        returnByValue: true,
      }).catch(() => null);

      const val = evalRes?.result?.value;
      if (typeof val === 'string' && val.startsWith('{')) {
        tokenInfo = JSON.parse(val);
        break;
      }
    }

    if (!tokenInfo || !tokenInfo.token || !tokenInfo.at) {
      throw new Error(
        'No se pudo autenticar la sesión interactiva en flow.google.com. Verifica que tu sesión de Google Flow esté activa.'
      );
    }

    const projectId =
      (await resolveFlowProjectId(cookieHeader, tokenInfo.at, tokenInfo.fSid, tokenInfo.bl)) ||
      '98397ce4-4aa7-4eac-a03b-fe62aa9d04d6';
    const sessionId = `;${Date.now()}`;
    const mediaId = uuidv4();
    const workflowId = uuidv4();
    const N = [tokenInfo.token, 1];

    if (actionType === 'IMAGE_GENERATION') {
      // AspectRatio enum for FlowService.BatchGenerateImages (ogiZ0b): 1=1:1, 2=9:16, 3=16:9, 4=3:4, 5=4:3
      const imgAspectMap = { '1:1': 1, '9:16': 2, '16:9': 3, '3:4': 4, '4:3': 5 };
      const aspectEnum = imgAspectMap[aspectRatio] || 3;
      const seed = Math.floor(Math.random() * 2147483647);
      const W = [null, 22, null, null, null, projectId, null, workflowId, null, null, N];
      const h = [sessionId];

      // Try Nano Banana 2 Lite (HARBOR_SEAL) first, then Nano Banana 2.1 (BELUGA)
      const flowImageModels = [
        { code: 'HARBOR_SEAL', label: 'Google Flow Studio (🍌 Nano Banana 2 Lite • gemini-3.1-flash-lite-image)' },
        { code: 'BELUGA', label: 'Google Flow Studio (🍌 Nano Banana 2.1)' },
        { code: 'GEM_PIX_2', label: 'Google Flow Studio (🍌 Nano Banana Pro)' },
      ];

      for (const fm of flowImageModels) {
        const freshExec = await cdpRequest(ws, 490, 'Runtime.evaluate', {
          expression: `(async () => {
            const execFn = window.__origRecapExec || window.grecaptcha.enterprise.execute;
            const siteKey = window.WIZ_global_data.xZbWve || "6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV";
            return await execFn(siteKey, { action: "IMAGE_GENERATION" });
          })()`,
          awaitPromise: true,
          returnByValue: true,
        }).catch(() => null);
        const currentToken = freshExec?.result?.value || tokenInfo.token;
        const currentMediaId = uuidv4();
        const currentWorkflowId = uuidv4();
        const currentW = [
          null,
          22,
          null,
          null,
          null,
          projectId,
          null,
          currentWorkflowId,
          null,
          null,
          [currentToken, 1],
        ];
        const za = [
          null,
          null,
          [],
          seed,
          aspectEnum,
          fm.code,
          null,
          currentW,
          [[[prompt]]],
          null,
          [],
          [],
          currentWorkflowId,
          currentMediaId,
        ];
        const rpcPayload = [null, [za], 1, currentW, h];
        const fReq = JSON.stringify([[['ogiZ0b', JSON.stringify(rpcPayload), null, 'generic']]]);

        const browserFetch = await cdpRequest(ws, 500, 'Runtime.evaluate', {
          expression: `(async () => {
            const params = new URLSearchParams({
              rpcids: "ogiZ0b",
              "source-path": "/",
              bl: ${JSON.stringify(tokenInfo.bl)},
              "f.sid": ${JSON.stringify(tokenInfo.fSid)},
              hl: "es-419",
              rt: "c"
            });
            const body = new URLSearchParams({ "f.req": ${JSON.stringify(fReq)}, at: ${JSON.stringify(tokenInfo.at)} });
            const r = await fetch("/_/AiSandboxAngularFrontend/data/batchexecute?" + params.toString(), {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
              body: body.toString()
            });
            return await r.text();
          })()`,
          awaitPromise: true,
          returnByValue: true,
        });

        const rawText = browserFetch?.result?.value || '';
        const urlMatch = rawText.match(/https:\/\/flow-content\.google\/image\/[^"]+/);
        if (urlMatch && urlMatch[0]) {
          const signedUrl = urlMatch[0]
            .replace(/\\\\u003d/g, '=')
            .replace(/\\\\u0026/g, '&')
            .replace(/\\u003d/g, '=')
            .replace(/\\u0026/g, '&')
            .replace(/\\+$/g, '');
          return {
            ok: true,
            signedUrl,
            mediaId,
            workflowId,
            projectId,
            modelLabel: fm.label,
          };
        }
      }
      throw new Error('Google Flow no devolvió la URL de la imagen generada.');
    } else {
      // VIDEO_GENERATION via YhhmEf (/VideoFxService.BatchAsyncGenerateVideoText) + Veo 3.1 Lite
      // AspectRatio enum for VideoFxService (oP): 2=16:9, 1=9:16, 0=1:1
      const vidAspectEnum = aspectRatio === '9:16' ? 1 : 2;
      const k = [null, 22, null, null, null, projectId, null, null, null, null, N];
      const x = [sessionId, 1];
      const lD = [null, null, null, null, mediaId, workflowId];
      const h = [null, null, [[[prompt]]]];
      const G = [h, 'veo_3_1_t2v_lite', vidAspectEnum, null, lD];
      const rpcPayload = [[G], k, x];
      const fReq = JSON.stringify([[['YhhmEf', JSON.stringify(rpcPayload), null, 'generic']]]);

      const browserFetch = await cdpRequest(ws, 600, 'Runtime.evaluate', {
        expression: `(async () => {
          const params = new URLSearchParams({
            rpcids: "YhhmEf",
            "source-path": "/",
            bl: ${JSON.stringify(tokenInfo.bl)},
            "f.sid": ${JSON.stringify(tokenInfo.fSid)},
            hl: "es-419",
            rt: "c"
          });
          const body = new URLSearchParams({ "f.req": ${JSON.stringify(fReq)}, at: ${JSON.stringify(tokenInfo.at)} });
          const r = await fetch("/_/AiSandboxAngularFrontend/data/batchexecute?" + params.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            body: body.toString()
          });
          return await r.text();
        })()`,
        awaitPromise: true,
        returnByValue: true,
      });

      const rawText = browserFetch?.result?.value || '';
      const allUuids = Array.from(
        new Set(
          (rawText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || [])
        )
      );
      const activeMediaId =
        allUuids.find((u) => u !== projectId && u !== workflowId && u !== allUuids[0]) ||
        allUuids[1] ||
        mediaId;

      if (!rawText.includes('YhhmEf') || allUuids.length < 2) {
        throw new Error(`No se pudo iniciar la generación del video con Veo 3.1 Lite en Google Flow: ${rawText.slice(0, 240)}`);
      }

      // Poll Iyc41d (/FlowService.BatchGetMedia) directly inside the authenticated Chromium page using the exact mediaId
      for (let attempt = 0; attempt < 34; attempt++) {
        await new Promise((r) => setTimeout(r, 3500));
        const pollFReq = JSON.stringify([
          [['Iyc41d', JSON.stringify([[activeMediaId]]), null, 'generic']],
        ]);
        const pollEval = await cdpRequest(ws, 700 + attempt, 'Runtime.evaluate', {
          expression: `(async () => {
            const params = new URLSearchParams({
              rpcids: "Iyc41d",
              "source-path": "/",
              bl: ${JSON.stringify(tokenInfo.bl)},
              "f.sid": ${JSON.stringify(tokenInfo.fSid)},
              hl: "es-419",
              rt: "c"
            });
            const body = new URLSearchParams({ "f.req": ${JSON.stringify(pollFReq)}, at: ${JSON.stringify(tokenInfo.at)} });
            const r = await fetch("/_/AiSandboxAngularFrontend/data/batchexecute?" + params.toString(), {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
              body: body.toString()
            });
            return await r.text();
          })()`,
          awaitPromise: true,
          returnByValue: true,
        }).catch(() => null);

        const rawPoll = pollEval?.result?.value || '';
        const vidUrlMatch = rawPoll.match(/https:\/\/flow-content\.google\/video\/[^"]+/);
        if (vidUrlMatch && vidUrlMatch[0]) {
          const signedVideoUrl = vidUrlMatch[0]
            .replace(/\\\\u003d/g, '=')
            .replace(/\\\\u0026/g, '&')
            .replace(/\\u003d/g, '=')
            .replace(/\\u0026/g, '&')
            .replace(/\\+$/g, '');

          let signedPosterUrl = null;
          const imgUrlMatch = rawPoll.match(/https:\/\/flow-content\.google\/image\/[^"]+/);
          if (imgUrlMatch && imgUrlMatch[0]) {
            signedPosterUrl = imgUrlMatch[0]
              .replace(/\\\\u003d/g, '=')
              .replace(/\\\\u0026/g, '&')
              .replace(/\\u003d/g, '=')
              .replace(/\\u0026/g, '&')
              .replace(/\\+$/g, '');
          }

          return {
            ok: true,
            signedVideoUrl,
            signedPosterUrl,
            mediaId: activeMediaId,
            workflowId,
            projectId,
            cookieHeader,
            modelLabel: 'Google Flow Studio (🎬 Veo 3.1 Lite • veo_3_1_t2v_lite)',
          };
        }
      }

      throw new Error('Tiempo de espera agotado renderizando el video con Veo 3.1 Lite en Google Flow.');
    }
  } finally {
    try {
      if (ws) ws.close();
    } catch (_) {}
    try {
      proc.kill('SIGKILL');
    } catch (_) {}
    try {
      await fs.promises.rm(profileDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

/**
 * Genera una imagen con Google Flow / Imagen 3 / Nano Banana y la guarda en /images/
 */
async function executeFlowImageGeneration({
  userId,
  prompt,
  aspectRatio = '16:9',
  style = 'fotorrealista',
}) {
  if (!prompt || !String(prompt).trim()) {
    throw new Error('Debes indicar una descripción (prompt) para generar la imagen.');
  }

  const creds = await resolveGoogleFlowCredentials(userId);
  const cleanRatio = ['16:9', '9:16', '1:1', '4:3', '3:4'].includes(aspectRatio)
    ? aspectRatio
    : aspectRatio === 'vertical'
    ? '9:16'
    : aspectRatio === 'cuadrada'
    ? '1:1'
    : '16:9';

  let styleSuffix =
    'cinematic lighting, 8k resolution, photorealistic, ultra-detailed, professional photography';
  if (style === '3d_render' || style === '3d') {
    styleSuffix = '3D Pixar/Unreal Engine style render, volumetric lighting, octane render, 8k';
  } else if (style === 'ilustracion_tecnica' || style === 'diagrama') {
    styleSuffix = 'clean technical illustration, modern vector infographic style, crisp details';
  } else if (style === 'afiche_seguridad') {
    styleSuffix = 'high-impact occupational safety campaign poster, professional graphic design';
  }

  const enhancedPrompt = `${String(prompt).trim()}, ${styleSuffix}, aspect ratio ${cleanRatio}`;
  let imageBuffer = null;
  let mimeType = 'image/png';
  let modelUsed = '';

  // INTENTO 1: Generación Nativa en Google Flow Studio (flow.google.com • Nano Banana 2 Lite / 2.1)
  if (creds.cookies && creds.cookies.length > 0) {
    try {
      logger.info('[GoogleFlow] Ejecutando generación nativa en flow.google.com (Nano Banana 2 Lite / 2.1)...');
      const nativeRes = await executeFlowNativeStudioAction({
        cookies: creds.cookies,
        actionType: 'IMAGE_GENERATION',
        prompt: enhancedPrompt,
        aspectRatio: cleanRatio,
      });

      if (nativeRes.ok && nativeRes.signedUrl) {
        const dlRes = await axios.get(nativeRes.signedUrl, {
          responseType: 'arraybuffer',
          timeout: 35000,
          headers: {
            Cookie: buildFlowCookieHeader(creds.cookies),
            Referer: 'https://flow.google.com/',
            Origin: 'https://flow.google.com',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          },
        });
        if (dlRes.data && dlRes.data.byteLength > 1024) {
          imageBuffer = Buffer.from(dlRes.data);
          mimeType = dlRes.headers['content-type'] || 'image/jpeg';
          modelUsed = nativeRes.modelLabel;
        }
      }
    } catch (flowErr) {
      logger.warn('[GoogleFlow] Aviso en generación nativa flow.google.com:', flowErr.message);
    }
  }

  // INTENTO 2: Google Gemini Native Image API (gemini-3.1-flash-lite-image / gemini-3.1-flash-image / gemini-2.5-flash-image)
  if (!imageBuffer && creds.apiKeys && creds.apiKeys.length > 0) {
    const geminiImgModels = [
      'gemini-3.1-flash-lite-image',
      'gemini-3.1-flash-image',
      'gemini-2.5-flash-image',
    ];
    for (const gm of geminiImgModels) {
      if (imageBuffer) break;
      for (const keyCandidate of creds.apiKeys.slice(0, 3)) {
        if (imageBuffer) break;
        try {
          logger.info(`[GoogleFlow] Generando imagen con Google ${gm}...`);
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${keyCandidate}`;
          const response = await axios.post(
            url,
            {
              contents: [{ parts: [{ text: enhancedPrompt }] }],
              generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 25000,
            }
          );

          const candidates = response.data?.candidates;
          if (candidates && candidates.length > 0) {
            const imagePart = candidates[0].content?.parts?.find((p) => p.inlineData);
            if (imagePart?.inlineData?.data) {
              imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
              mimeType = imagePart.inlineData.mimeType || 'image/png';
              modelUsed = `Google Flow (${gm})`;
            }
          }
        } catch (err2) {
          const msg = err2.response?.data?.error?.message || err2.message || '';
          logger.warn(`[GoogleFlow] Aviso en ${gm}:`, msg.slice(0, 120));
          if (msg.includes('limit: 0') || msg.includes('not found')) {
            break;
          }
        }
      }
    }
  }

  if (!imageBuffer) {
    throw new Error(
      'No fue posible generar la imagen en Google Flow. Verifica que tu sesión de Google Flow esté vinculada y activa en Mi Cuenta -> Integraciones.'
    );
  }

  await fs.promises.mkdir(OUTPUT_MEDIA_DIR, { recursive: true });
  const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
  const fileId = uuidv4();
  const filename = `flow_img_${fileId}.${ext}`;
  const fullPath = path.join(OUTPUT_MEDIA_DIR, filename);
  await fs.promises.writeFile(fullPath, imageBuffer);
  const publicUrl = `/images/${filename}`;

  logger.info(`[GoogleFlow] Imagen guardada exitosamente en ${publicUrl} (${modelUsed})`);

  return {
    success: true,
    type: 'image',
    fileId,
    filename,
    fullPath,
    publicUrl,
    mimeType,
    buffer: imageBuffer,
    model: modelUsed,
    prompt,
    aspectRatio: cleanRatio,
  };
}

/**
 * Renderiza un clip MP4 cinematográfico con movimiento de cámara suave (Ken Burns / Flow Camera)
 * usando FFmpeg sobre un fotograma de alta resolución generado por Google Imagen.
 */
function renderCinematicMp4FromImage(imagePath, outputMp4Path, aspectRatio = '16:9', cameraMotion = 'zoom_in') {
  return new Promise((resolve, reject) => {
    const isVertical = aspectRatio === '9:16' || aspectRatio === 'vertical';
    const width = isVertical ? 720 : 1280;
    const height = isVertical ? 1280 : 720;
    const fps = 30;
    const durationSec = 6;
    const totalFrames = fps * durationSec;

    let zpExpr = `z='min(zoom+0.0012,1.22)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;
    if (cameraMotion === 'zoom_out') {
      zpExpr = `z='if(eq(on,1),1.22,max(1.0,zoom-0.0012))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;
    } else if (cameraMotion === 'pan_right' || cameraMotion === 'orbit') {
      zpExpr = `z='1.15':x='(iw-iw/zoom)*(on/${totalFrames})':y='ih/2-(ih/zoom/2)'`;
    } else if (cameraMotion === 'pan_left') {
      zpExpr = `z='1.15':x='(iw-iw/zoom)*(1-on/${totalFrames})':y='ih/2-(ih/zoom/2)'`;
    }

    const vf = `scale=2560:-1,zoompan=${zpExpr}:d=${totalFrames}:s=${width}x${height}:fps=${fps},format=yuv420p`;

    execFile(
      'ffmpeg',
      [
        '-y',
        '-loop',
        '1',
        '-i',
        imagePath,
        '-vf',
        vf,
        '-t',
        String(durationSec),
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '21',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        outputMp4Path,
      ],
      { timeout: 60000 },
      (err) => {
        if (err) {
          return reject(err);
        }
        resolve(outputMp4Path);
      }
    );
  });
}

/**
 * Genera un video con Google Flow / Google Veo y lo guarda en /images/flow_vid_*.mp4
 */
async function executeFlowVideoGeneration({
  userId,
  prompt,
  aspectRatio = '16:9',
  cameraMotion = 'zoom_in',
}) {
  if (!prompt || !String(prompt).trim()) {
    throw new Error('Debes indicar una descripción (prompt) para generar el video.');
  }

  const creds = await resolveGoogleFlowCredentials(userId);
  const cleanRatio = aspectRatio === '9:16' || aspectRatio === 'vertical' ? '9:16' : '16:9';

  const motionDescriptions = {
    zoom_in: 'slow cinematic dolly zoom-in camera movement',
    zoom_out: 'smooth cinematic pullback zoom-out camera movement',
    orbit: 'smooth 3D orbital camera movement around the subject',
    pan_right: 'cinematic lateral tracking shot panning right',
    pan_left: 'cinematic lateral tracking shot panning left',
  };
  const motionText = motionDescriptions[cameraMotion] || motionDescriptions.zoom_in;
  const enhancedPrompt = `${String(prompt).trim()}, ${motionText}, 4k cinematic quality, realistic physics, natural lighting`;

  let videoBuffer = null;
  let posterBuffer = null;
  let modelUsed = '';

  // INTENTO 1: Generación Nativa en Google Flow Studio (flow.google.com • Veo 3.1 Lite)
  if (creds.cookies && creds.cookies.length > 0) {
    try {
      logger.info('[GoogleFlow] Iniciando generación nativa de video en flow.google.com (Veo 3.1 Lite)...');
      const nativeVid = await executeFlowNativeStudioAction({
        cookies: creds.cookies,
        actionType: 'VIDEO_GENERATION',
        prompt: enhancedPrompt,
        aspectRatio: cleanRatio,
      });

      if (nativeVid.ok && nativeVid.signedVideoUrl) {
        const ua =
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
        const dlVid = await axios.get(nativeVid.signedVideoUrl, {
          responseType: 'arraybuffer',
          timeout: 45000,
          headers: {
            Cookie: nativeVid.cookieHeader,
            Referer: 'https://flow.google.com/',
            Origin: 'https://flow.google.com',
            'User-Agent': ua,
          },
        });
        if (dlVid.data && dlVid.data.byteLength > 5000) {
          videoBuffer = Buffer.from(dlVid.data);
          modelUsed = nativeVid.modelLabel;
        }
        if (nativeVid.signedPosterUrl) {
          try {
            const dlPoster = await axios.get(nativeVid.signedPosterUrl, {
              responseType: 'arraybuffer',
              timeout: 20000,
              headers: {
                Cookie: nativeVid.cookieHeader,
                Referer: 'https://flow.google.com/',
                Origin: 'https://flow.google.com',
                'User-Agent': ua,
              },
            });
            if (dlPoster.data && dlPoster.data.byteLength > 1000) {
              posterBuffer = Buffer.from(dlPoster.data);
            }
          } catch (_) {}
        }
      }
    } catch (flowVidErr) {
      logger.warn(`[GoogleFlow] Aviso en generación de video en flow.google.com: ${flowVidErr.message}`);
    }
  }

  // INTENTO 2: Google Veo oficial vía Gemini API (:predictLongRunning)
  if (!videoBuffer && creds.apiKey) {
    const veoModels = [
      'veo-3.1-generate-preview',
      'veo-3.0-generate-preview',
      'veo-2.0-generate-001',
    ];

    for (const veoModel of veoModels) {
      if (videoBuffer) break;
      try {
        logger.info(`[GoogleFlow] Iniciando generación de video con ${veoModel}...`);
        const startUrl = `https://generativelanguage.googleapis.com/v1beta/models/${veoModel}:predictLongRunning`;
        const startRes = await axios.post(
          startUrl,
          {
            instances: [{ prompt: enhancedPrompt }],
            parameters: {
              aspectRatio: cleanRatio,
              sampleCount: 1,
            },
          },
          {
            headers: {
              'x-goog-api-key': creds.apiKey,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        const opName = startRes.data?.name;
        if (opName) {
          logger.info(`[GoogleFlow] Operación Veo iniciada: ${opName}. Esperando renderizado...`);
          for (let attempt = 0; attempt < 22; attempt++) {
            await new Promise((r) => setTimeout(r, 4000));
            const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${opName}`;
            const pollRes = await axios.get(pollUrl, {
              headers: { 'x-goog-api-key': creds.apiKey },
              timeout: 15000,
            });

            if (pollRes.data?.done) {
              const videoUri =
                pollRes.data?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
                pollRes.data?.response?.videos?.[0]?.uri;
              const b64Video =
                pollRes.data?.response?.predictions?.[0]?.bytesBase64Encoded ||
                pollRes.data?.response?.generateVideoResponse?.generatedSamples?.[0]?.video
                  ?.bytesBase64Encoded;

              if (b64Video) {
                videoBuffer = Buffer.from(b64Video, 'base64');
                modelUsed = `Google Flow (${veoModel})`;
                break;
              } else if (videoUri) {
                const dlUrl = videoUri.includes('?')
                  ? `${videoUri}&key=${creds.apiKey}`
                  : `${videoUri}?key=${creds.apiKey}`;
                const dlRes = await axios.get(dlUrl, {
                  headers: { 'x-goog-api-key': creds.apiKey },
                  responseType: 'arraybuffer',
                  timeout: 45000,
                });
                videoBuffer = Buffer.from(dlRes.data);
                modelUsed = `Google Flow (${veoModel})`;
                break;
              }
              break;
            }
          }
        }
      } catch (veoErr) {
        logger.warn(
          `[GoogleFlow] Aviso en ${veoModel}:`,
          veoErr.response?.data?.error?.message || veoErr.message
        );
      }
    }
  }

  if (!videoBuffer) {
    throw new Error(
      'No fue posible completar el renderizado del video con Veo 3.1 Lite en Google Flow. Verifica tu sesión de Google Flow en Mi Cuenta -> Integraciones.'
    );
  }

  await fs.promises.mkdir(OUTPUT_MEDIA_DIR, { recursive: true });
  const fileId = uuidv4();
  const filename = `flow_vid_${fileId}.mp4`;
  const fullPath = path.join(OUTPUT_MEDIA_DIR, filename);
  const publicUrl = `/images/${filename}`;
  let posterUrl = null;

  await fs.promises.writeFile(fullPath, videoBuffer);
  if (posterBuffer) {
    const posterName = `flow_poster_${fileId}.jpg`;
    const posterPath = path.join(OUTPUT_MEDIA_DIR, posterName);
    await fs.promises.writeFile(posterPath, posterBuffer);
    posterUrl = `/images/${posterName}`;
  }

  logger.info(`[GoogleFlow] Video MP4 guardado con éxito en ${publicUrl} (${modelUsed})`);

  return {
    success: true,
    type: 'video',
    fileId,
    filename,
    fullPath,
    publicUrl,
    posterUrl,
    mimeType: 'video/mp4',
    model: modelUsed,
    prompt,
    aspectRatio: cleanRatio,
    cameraMotion,
  };
}

/**
 * Construye un visor HTML interactivo estilo Google Flow Studio para abrir en el Canvas de Tenshi
 */
function buildFlowStudioCanvasHtml(mediaResult) {
  const isVideo = mediaResult.type === 'video';
  const title = isVideo ? 'Google Flow Studio • Video Generado' : 'Google Flow Studio • Imagen Generada';
  const safePrompt = String(mediaResult.prompt || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col p-6 font-sans">
  <div class="max-w-4xl w-full mx-auto space-y-5">
    <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20 font-bold text-white">
          ✨
        </div>
        <div>
          <h1 class="text-base font-bold text-white">${title}</h1>
          <p class="text-xs text-zinc-400">Motor: ${mediaResult.model} &bull; Formato ${mediaResult.aspectRatio}</p>
        </div>
      </div>
      <a href="${mediaResult.publicUrl}" download="${mediaResult.filename}" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md">
        ⬇ Descargar ${isVideo ? 'MP4' : 'PNG'}
      </a>
    </div>

    <div class="rounded-2xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center shadow-2xl">
      ${
        isVideo
          ? `<video src="${mediaResult.publicUrl}" ${mediaResult.posterUrl ? `poster="${mediaResult.posterUrl}"` : ''} controls autoplay loop playsinline class="max-h-[70vh] w-auto object-contain"></video>`
          : `<img src="${mediaResult.publicUrl}" alt="${safePrompt}" class="max-h-[70vh] w-auto object-contain" />`
      }
    </div>

    <div class="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1">
      <span class="text-[10px] font-bold uppercase tracking-wider text-purple-400">Prompt Utilizado</span>
      <p class="text-xs text-zinc-300 leading-relaxed">${safePrompt}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * GET /api/googleflow/status
 * Retorna el estado de la conexión privada del usuario a Google Flow
 */
router.get('/status', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await GoogleFlowSession.findOne({ user: userId }).lean();
    const nbSession = await NotebookSession.findOne({ user: userId }).lean().catch(() => null);
    const canSyncFromNotebookLM = Boolean(nbSession?.cookies?.length > 0);

    if (!session) {
      return res.json({
        connected: false,
        canSyncFromNotebookLM,
        notebookEmail: nbSession?.email || '',
        message: 'Sin vincular. Conecta tu cuenta privada de Google Flow / Labs.',
      });
    }

    const email = session.email || req.user.email || 'Cuenta vinculada';
    const cookieCount = session.cookieCount || (session.cookies ? session.cookies.length : 0);
    const hasApiKey = Boolean(session.apiKey && session.apiKey.length > 5);
    const isValid = session.isValid ?? true;
    const lastTestedAt = session.lastTestedAt || session.updatedAt || null;

    return res.json({
      connected: true,
      email,
      cookieCount,
      hasApiKey,
      isValid,
      lastTestedAt,
      canSyncFromNotebookLM,
      notebookEmail: nbSession?.email || '',
      source: session.source || 'cli',
    });
  } catch (error) {
    logger.error('[GoogleFlow] Error consultando estado:', error);
    return res.status(500).json({ error: 'Error al consultar estado de Google Flow.' });
  }
});

/**
 * POST /api/googleflow/sync-from-notebooklm
 * Vincula Google Flow en 1 clic reutilizando la sesión privada de Google ya autenticada en NotebookLM
 */
router.post('/sync-from-notebooklm', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const nbSession = await NotebookSession.findOne({ user: userId }).lean();

    if (!nbSession || !Array.isArray(nbSession.cookies) || nbSession.cookies.length === 0) {
      return res.status(404).json({
        error: 'No se encontró una sesión activa en Google NotebookLM para importar.',
      });
    }

    const fxSession = await fetchLabsFxSession(nbSession.cookies);
    const effectiveEmail = fxSession.email || nbSession.email || req.user.email || 'Cuenta vinculada';

    await GoogleFlowSession.findOneAndUpdate(
      { user: userId },
      {
        email: effectiveEmail,
        cookies: nbSession.cookies,
        cookieCount: nbSession.cookies.length,
        isValid: true,
        lastTestedAt: new Date(),
        source: 'notebooklm-sync',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      email: effectiveEmail,
      cookieCount: nbSession.cookies.length,
      message: `¡Cuenta privada de Google (${effectiveEmail}) vinculada con éxito a Google Flow!`,
    });
  } catch (error) {
    logger.error('[GoogleFlow] Error sincronizando desde NotebookLM:', error);
    return res.status(500).json({ error: 'Error al sincronizar la sesión desde NotebookLM.' });
  }
});

/**
 * POST /api/googleflow/session
 * Guarda o actualiza las cookies o la API Key de Google Flow
 */
router.post('/session', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const rawInput = req.body?.cookies || req.body?.raw || req.body?.jsonString;
    const apiKey = (req.body?.apiKey || '').trim();
    const source = req.body?.source || (apiKey ? 'api_key' : 'manual');
    const clientEmail = req.body?.email || '';

    let cookies = [];
    if (rawInput) {
      cookies = parseIncomingCookies(rawInput);
    }

    if (cookies.length === 0 && !apiKey) {
      return res.status(400).json({
        error: 'Debes proporcionar las cookies de sesión de Google o una API Key de Google AI Studio.',
      });
    }

    let testResult = { success: true };
    let detectedEmail = '';

    if (cookies.length > 0) {
      testResult = validateCookiesLocally(cookies);
      if (!testResult.success && !apiKey) {
        return res.status(400).json({ error: testResult.reason });
      }
      const fxCheck = await fetchLabsFxSession(cookies);
      if (fxCheck.email) {
        detectedEmail = fxCheck.email;
      }
    }

    const effectiveEmail = detectedEmail || clientEmail || userEmail || `${userId}@wappy.internal`;

    const updateData = {
      email: effectiveEmail,
      isValid: testResult.success,
      lastTestedAt: new Date(),
      source,
    };

    if (cookies.length > 0) {
      updateData.cookies = cookies;
      updateData.cookieCount = cookies.length;
    }

    if (apiKey) {
      updateData.apiKey = apiKey;
    }

    await GoogleFlowSession.findOneAndUpdate(
      { user: userId },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (cookies.length > 0) {
      try {
        await NotebookSession.findOneAndUpdate(
          { user: userId },
          {
            email: effectiveEmail,
            cookies,
            cookieCount: cookies.length,
            isValid: true,
            lastTestedAt: new Date(),
            source: source || 'googleflow-sync',
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (_) {}
    }

    logger.info(`[GoogleFlow] Sesión guardada para usuario ${userId} (Email: ${effectiveEmail})`);

    return res.json({
      success: true,
      email: effectiveEmail,
      message: `¡Sesión privada de Google Flow (${effectiveEmail}) vinculada con éxito!`,
      isValid: testResult.success,
      cookieCount: updateData.cookieCount || 0,
      hasApiKey: Boolean(updateData.apiKey),
    });
  } catch (error) {
    logger.error('[GoogleFlow] Error guardando sesión:', error);
    return res.status(500).json({ error: 'Error interno al guardar la sesión de Google Flow.' });
  }
});

/**
 * POST /api/googleflow/test
 * Prueba en vivo la validez de la sesión o la API Key
 */
router.post('/test', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await GoogleFlowSession.findOne({ user: userId });

    if (!session || ((!session.cookies || session.cookies.length === 0) && !session.apiKey)) {
      return res.status(404).json({
        success: false,
        reason: 'No tienes una sesión de Google Flow ni API Key configurada.',
      });
    }

    let isValid = true;
    let message = `✓ ¡Conexión privada con Google Flow (${session.email || 'Cuenta activa'}) verificada y lista para generar imágenes y vídeos!`;

    if (session.cookies && session.cookies.length > 0) {
      const cookieCheck = validateCookiesLocally(session.cookies);
      if (!cookieCheck.success && !session.apiKey) {
        isValid = false;
        message = cookieCheck.reason;
      } else {
        const fxCheck = await fetchLabsFxSession(session.cookies);
        if (fxCheck.email && fxCheck.email !== session.email) {
          session.email = fxCheck.email;
        }
        if (fxCheck.ok) {
          const creditsTag =
            typeof fxCheck.credits === 'number' ? ` (${fxCheck.credits} créditos activos en Flow)` : '';
          message = `✓ ¡Conexión con Google Flow (${session.email || 'Cuenta activa'}) verificada en vivo${creditsTag} y lista para generar imágenes y vídeos!`;
        }
      }
    }

    session.isValid = isValid;
    session.lastTestedAt = new Date();
    await session.save();

    return res.json({
      success: isValid,
      message,
      lastTestedAt: session.lastTestedAt,
    });
  } catch (error) {
    logger.error('[GoogleFlow] Error probando sesión:', error);
    return res.status(500).json({ error: 'Error al probar sesión de Google Flow.' });
  }
});

/**
 * POST /api/googleflow/generate
 * Endpoint unificado para probar o ejecutar generación de imagen o video directamente
 */
router.post('/generate', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      type = 'image',
      prompt,
      aspectRatio = '16:9',
      style = 'fotorrealista',
      cameraMotion = 'zoom_in',
    } = req.body || {};

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: 'Por favor escribe un prompt para generar.' });
    }

    if (type === 'video') {
      const vidRes = await executeFlowVideoGeneration({
        userId,
        prompt,
        aspectRatio,
        cameraMotion,
      });
      return res.json({
        success: true,
        type: 'video',
        publicUrl: vidRes.publicUrl,
        posterUrl: vidRes.posterUrl,
        model: vidRes.model,
        prompt: vidRes.prompt,
        aspectRatio: vidRes.aspectRatio,
      });
    } else {
      const imgRes = await executeFlowImageGeneration({
        userId,
        prompt,
        aspectRatio,
        style,
      });
      return res.json({
        success: true,
        type: 'image',
        publicUrl: imgRes.publicUrl,
        model: imgRes.model,
        prompt: imgRes.prompt,
        aspectRatio: imgRes.aspectRatio,
      });
    }
  } catch (error) {
    logger.error('[GoogleFlow] Error en /generate:', error);
    return res.status(500).json({ error: error.message || 'Error al generar contenido multimedia.' });
  }
});

/**
 * DELETE /api/googleflow/session
 * Desvincula la sesión de Google Flow del usuario
 */
router.delete('/session', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    await GoogleFlowSession.deleteOne({ user: userId });

    return res.json({
      success: true,
      message: 'Sesión privada de Google Flow desvinculada correctamente.',
    });
  } catch (error) {
    logger.error('[GoogleFlow] Error desvinculando sesión:', error);
    return res.status(500).json({ error: 'Error al desvincular sesión de Google Flow.' });
  }
});

/**
 * GET /api/googleflow/connect-script
 * Script autoejecutable de 1 comando para vincular la cuenta privada de Google Flow
 * de forma idéntica al conector de NotebookLM.
 */
router.get('/connect-script', (req, res) => {
  const token = String(req.query.token || '').trim();
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'app.wappy.club';
  const serverOrigin = `${proto}://${host}`;

  const script = `#!/usr/bin/env node
/**
 * WAPPY IA — Conector Local Multiplataforma para Google Flow / Studio
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const http = require('http');
const crypto = require('crypto');
const { spawn, execSync } = require('child_process');

const SERVER_ORIGIN = ${JSON.stringify(serverOrigin)};
const USER_TOKEN = ${JSON.stringify(token)};

if (!USER_TOKEN) {
  console.error('❌ Error: Falta el token de usuario en el comando.');
  process.exit(1);
}

function findBrowserExecutable() {
  const platform = os.platform();
  const home = os.homedir();
  const candidates = [];
  if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      path.join(home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      path.join(home, 'Applications/Brave Browser.app/Contents/MacOS/Brave Browser'),
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      path.join(home, 'Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'),
      '/Applications/Arc.app/Contents/MacOS/Arc',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    );
  } else if (platform === 'win32') {
    const pf = process.env['PROGRAMFILES'] || 'C:\\\\Program Files';
    const pf86 = process.env['PROGRAMFILES(X86)'] || 'C:\\\\Program Files (x86)';
    const local = process.env['LOCALAPPDATA'] || path.join(home, 'AppData\\\\Local');
    candidates.push(
      path.join(pf, 'Google\\\\Chrome\\\\Application\\\\chrome.exe'),
      path.join(pf86, 'Google\\\\Chrome\\\\Application\\\\chrome.exe'),
      path.join(local, 'Google\\\\Chrome\\\\Application\\\\chrome.exe'),
      path.join(pf, 'BraveSoftware\\\\Brave-Browser\\\\Application\\\\brave.exe'),
      path.join(pf86, 'BraveSoftware\\\\Brave-Browser\\\\Application\\\\brave.exe'),
      path.join(local, 'BraveSoftware\\\\Brave-Browser\\\\Application\\\\brave.exe'),
      path.join(pf86, 'Microsoft\\\\Edge\\\\Application\\\\msedge.exe'),
      path.join(pf, 'Microsoft\\\\Edge\\\\Application\\\\msedge.exe'),
      path.join(local, 'Microsoft\\\\Edge\\\\Application\\\\msedge.exe')
    );
    for (const exe of ['chrome.exe', 'msedge.exe', 'brave.exe']) {
      for (const hive of ['HKLM', 'HKCU']) {
        try {
          const out = execSync(\`reg query "\${hive}\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\App Paths\\\\\${exe}" /ve\`, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' });
          const m = out.match(/REG_SZ\\s+(.+\\.exe)/i);
          if (m && m[1]) candidates.push(m[1].trim().replace(/^"|"$/g, ''));
        } catch (_) {}
      }
    }
  } else {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/brave-browser',
      '/usr/bin/microsoft-edge'
    );
  }
  for (const bin of candidates) {
    if (bin && fs.existsSync(bin)) return bin;
  }
  return null;
}

function getFreePort() {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', () => resolve(9230 + Math.floor(Math.random() * 500)));
  });
}

function cleanupStaleProfile(profileDir) {
  try {
    fs.mkdirSync(profileDir, { recursive: true });
    const lp = path.join(profileDir, 'SingletonLock');
    try { fs.rmSync(lp, { force: true }); } catch (_) {}
  } catch (_) {}
}

function launchBrowserVisible(browserBin, profileDir, debugPort, targetUrl) {
  const args = [
    \`--remote-debugging-port=\${debugPort}\`,
    '--remote-allow-origins=*',
    \`--user-data-dir=\${profileDir}\`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1080,780',
    \`--app=\${targetUrl}\`,
  ];
  if (os.platform() === 'win32') {
    try {
      const cmdLine = \`start "" "\${browserBin}" --remote-debugging-port=\${debugPort} --remote-allow-origins=* --user-data-dir="\${profileDir}" --no-first-run --no-default-browser-check --window-size=1080,780 --app=\${targetUrl}\`;
      const c = spawn('cmd.exe', ['/d', '/s', '/c', \`"\${cmdLine}"\`], {
        windowsVerbatimArguments: true,
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      });
      c.unref();
      return c;
    } catch (_) {}
  }
  return spawn(browserBin, args, { stdio: 'ignore' });
}

function cdpSend(wsUrl, method, params = {}) {
  if (typeof WebSocket !== 'undefined') {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const timer = setTimeout(() => {
        try { ws.close(); } catch (_) {}
        reject(new Error('Timeout CDP'));
      }, 8000);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method, params }));
      };
      ws.onmessage = (event) => {
        clearTimeout(timer);
        try { ws.close(); } catch (_) {}
        try {
          resolve(JSON.parse(event.data));
        } catch (e) {
          reject(e);
        }
      };
      ws.onerror = (err) => {
        clearTimeout(timer);
        try { ws.close(); } catch (_) {}
        reject(err);
      };
    });
  }

  let WSClient;
  try { WSClient = require('ws'); } catch (_) {}
  if (WSClient) {
    return new Promise((resolve, reject) => {
      const ws = new WSClient(wsUrl);
      const timer = setTimeout(() => {
        try { ws.terminate(); } catch (_) {}
        reject(new Error('Timeout CDP'));
      }, 8000);
      ws.on('open', () => {
        ws.send(JSON.stringify({ id: 1, method, params }));
      });
      ws.on('message', (data) => {
        clearTimeout(timer);
        try { ws.close(); } catch (_) {}
        try {
          resolve(JSON.parse(data.toString('utf8')));
        } catch (e) {
          reject(e);
        }
      });
      ws.on('error', (err) => {
        clearTimeout(timer);
        try { ws.terminate(); } catch (_) {}
        reject(err);
      });
    });
  }

  return new Promise((resolve, reject) => {
    const parsed = new URL(wsUrl);
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Version': '13',
      },
    });
    const timer = setTimeout(() => {
      req.destroy();
      reject(new Error('Timeout CDP'));
    }, 8000);

    req.on('upgrade', (res, socket) => {
      const payload = Buffer.from(JSON.stringify({ id: 1, method, params }), 'utf8');
      const mask = crypto.randomBytes(4);
      let header;
      if (payload.length < 126) {
        header = Buffer.from([0x81, 0x80 | payload.length]);
      } else if (payload.length < 65536) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 0x80 | 126;
        header.writeUInt16BE(payload.length, 2);
      } else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 0x80 | 127;
        header.writeBigUInt64BE(BigInt(payload.length), 2);
      }
      const masked = Buffer.alloc(payload.length);
      for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4];
      socket.write(Buffer.concat([header, mask, masked]));

      let bodyChunks = [];
      socket.on('data', (chunk) => {
        bodyChunks.push(chunk);
        const combined = Buffer.concat(bodyChunks);
        const str = combined.toString('utf8');
        const firstBrace = str.indexOf('{');
        const lastBrace = str.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            const parsedJson = JSON.parse(str.slice(firstBrace, lastBrace + 1));
            clearTimeout(timer);
            socket.end();
            return resolve(parsedJson);
          } catch (_) {}
        }
      });
    });
    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    req.end();
  });
}

async function uploadCookies(cookies, email = '') {
  const res = await fetch(\`\${SERVER_ORIGIN}/api/googleflow/session\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: \`Bearer \${USER_TOKEN}\`,
    },
    body: JSON.stringify({ cookies, email, source: 'cli-auto' }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.success && data.isValid !== false, data };
}

(async () => {
  console.log('\\n🎨 WAPPY IA — Conector de Módulo Creativo');
  console.log('----------------------------------------------------------------------');

  const browserBin = findBrowserExecutable();
  if (!browserBin) {
    console.error('❌ No se encontró Google Chrome, Brave o Edge instalado en este equipo.');
    process.exit(1);
  }

  const nbProfileDir = path.join(os.homedir(), '.wappy-notebooklm-auth');
  let flowProfileDir = fs.existsSync(nbProfileDir)
    ? nbProfileDir
    : path.join(os.homedir(), '.wappy-googleflow-auth');
  cleanupStaleProfile(flowProfileDir);
  let debugPort = await getFreePort();

  console.log('🌐 Abriendo ventana en primer plano en tu computador (' + path.basename(browserBin) + ')...');
  console.log('⏳ Detectando tu sesión (si ya iniciaste sesión antes, se cerrará sola en 3 segundos)...\\n');

  const targetUrl = 'https://labs.google/fx/tools/flow';
  const child = launchBrowserVisible(browserBin, flowProfileDir, debugPort, targetUrl);

  const maxWaitMs = 180000;
  const start = Date.now();
  let cdpConnectedOnce = false;

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const listRes = await fetch(\`http://127.0.0.1:\${debugPort}/json/list\`);
      const pages = await listRes.json();
      if (!Array.isArray(pages) || !pages.some((p) => p.type === 'page')) continue;
      if (!cdpConnectedOnce) {
        cdpConnectedOnce = true;
        console.log('🟢 Ventana del navegador activa. Esperando inicio de sesión en Google Flow...');
      }
      const flowPage = pages.find(
        (p) =>
          p.webSocketDebuggerUrl &&
          p.url &&
          (p.url.includes('labs.google') || p.url.includes('flow.google') || p.url.includes('google.com')) &&
          !p.url.includes('accounts.google.com') &&
          !p.url.includes('/signin')
      );
      if (!flowPage) continue;

      let allCookies = [];
      try {
        const stRes = await cdpSend(flowPage.webSocketDebuggerUrl, 'Storage.getCookies');
        allCookies = stRes?.result?.cookies || [];
      } catch (_) {}
      if (!allCookies.length) {
        const cdpRes = await cdpSend(flowPage.webSocketDebuggerUrl, 'Network.getAllCookies');
        allCookies = cdpRes?.result?.cookies || [];
      }

      const googleCookies = allCookies.filter((c) => c.domain && c.domain.includes('google.com'));
      const names = new Set(googleCookies.map((c) => c.name));

      if (names.has('SID') && (names.has('__Secure-1PSID') || names.has('__Secure-1PSIDTS'))) {
        console.log('✨ Sesión detectada. Verificando y vinculando con Google Flow en WAPPY...');
        const result = await uploadCookies(googleCookies);
        if (result.ok) {
          console.log('✅ ' + (result.data.message || '¡Módulo conectado con éxito!'));
          try { await cdpSend(flowPage.webSocketDebuggerUrl, 'Browser.close'); } catch (_) {}
          try { if (child) child.kill(); } catch (_) {}
          process.exit(0);
        }
      }
    } catch (_) {
      // Sigue esperando mientras el usuario inicia sesión
    }
  }

  console.error('⏰ Tiempo de espera agotado. Vuelve a ejecutar el comando cuando estés listo.');
  try { if (child) child.kill(); } catch (_) {}
  process.exit(1);
})();
`;

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  return res.status(200).send(script);
});

/**
 * Lista todos los recursos multimedia descargados de Google Flow (flow_*) y Google NotebookLM (nlm_*)
 * disponibles en el servidor durante su ventana de retención de 30 días.
 */
async function listDownloadedMediaLibrary(filterSource = 'all') {
  await fs.promises.mkdir(OUTPUT_MEDIA_DIR, { recursive: true });
  const files = await fs.promises.readdir(OUTPUT_MEDIA_DIR);
  const now = Date.now();
  const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
  const items = [];

  for (const file of files) {
    if (!file.startsWith('flow_') && !file.startsWith('nlm_')) continue;
    if (file.startsWith('flow_poster_')) continue; // skip internal video posters
    const isFlow = file.startsWith('flow_');
    if (filterSource === 'flow' && !isFlow) continue;
    if (filterSource === 'notebooklm' && isFlow) continue;

    const fullPath = path.join(OUTPUT_MEDIA_DIR, file);
    try {
      const stat = await fs.promises.stat(fullPath);
      if (!stat.isFile()) continue;
      const ageMs = now - stat.mtimeMs;
      if (ageMs > RETENTION_MS) continue;

      const daysRemaining = Math.max(1, Math.ceil((RETENTION_MS - ageMs) / (24 * 60 * 60 * 1000)));
      const lower = file.toLowerCase();
      let mediaType = 'image';
      if (lower.endsWith('.mp4') || lower.includes('_vid_') || lower.includes('_video_')) {
        mediaType = 'video';
      } else if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.includes('_audio_')) {
        mediaType = 'audio';
      } else if (lower.endsWith('.pdf') || lower.endsWith('.pptx')) {
        mediaType = 'document';
      }

      let label = isFlow ? 'Imagen Google Flow (Nano Banana)' : 'Infografía NotebookLM';
      if (isFlow && mediaType === 'video') label = 'Video Google Flow (Veo 3.1 Lite)';
      else if (!isFlow && mediaType === 'video') label = 'Video Explicativo NotebookLM';
      else if (!isFlow && mediaType === 'audio') label = 'Podcast / Audio NotebookLM';
      else if (!isFlow && mediaType === 'document') label = 'Presentación / Doc NotebookLM';

      items.push({
        filename: file,
        publicUrl: `/images/${file}`,
        source: isFlow ? 'flow' : 'notebooklm',
        mediaType,
        label,
        sizeBytes: stat.size,
        createdAt: new Date(stat.mtimeMs).toISOString(),
        daysRemaining,
      });
    } catch (_) {}
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items.slice(0, 80);
}

/**
 * GET /api/googleflow/media-library
 * Lista todos los recursos multimedia descargados de Google Flow (flow_*) y Google NotebookLM (nlm_*)
 * disponibles en el servidor durante su ventana de retención de 30 días.
 */
router.get('/media-library', requireJwtAuth, async (req, res) => {
  try {
    const filter = req.query.source || 'all';
    const items = await listDownloadedMediaLibrary(filter);
    return res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    logger.error('[GoogleFlow] Error listando media-library:', error);
    return res.status(500).json({ error: 'Error al consultar la galería de recursos IA.' });
  }
});

router.executeFlowImageGeneration = executeFlowImageGeneration;
router.executeFlowVideoGeneration = executeFlowVideoGeneration;
router.buildFlowStudioCanvasHtml = buildFlowStudioCanvasHtml;
router.listDownloadedMediaLibrary = listDownloadedMediaLibrary;

module.exports = router;
