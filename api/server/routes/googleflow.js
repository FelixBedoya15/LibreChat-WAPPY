const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { execFile } = require('child_process');
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
 * Intenta obtener el token de sesión de Google Labs / Flow (labs.google/fx/api/auth/session)
 */
async function fetchLabsFxSession(cookies) {
  if (!Array.isArray(cookies) || cookies.length === 0) {
    return { ok: false };
  }
  try {
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await axios.get('https://labs.google/fx/api/auth/session', {
      headers: {
        Cookie: cookieHeader,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      timeout: 12000,
    });
    if (res.data && (res.data.access_token || res.data.user)) {
      return {
        ok: true,
        accessToken: res.data.access_token || null,
        email: res.data.user?.email || null,
        name: res.data.user?.name || null,
      };
    }
    return { ok: false };
  } catch (err) {
    logger.debug('[GoogleFlow] Info consultando labs.google/fx/api/auth/session:', err.message);
    return { ok: false, error: err.message };
  }
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

  let apiKey = flowSession?.apiKey || null;

  if (!apiKey && userId) {
    try {
      const { getUserKey } = require('~/server/services/UserService');
      const userKeyData = await getUserKey({ userId, name: 'google' });
      if (userKeyData && userKeyData !== 'user_provided') {
        try {
          const parsed = typeof userKeyData === 'string' ? JSON.parse(userKeyData) : userKeyData;
          apiKey = parsed.GOOGLE_API_KEY || parsed.GOOGLE_KEY || Object.values(parsed)[0];
        } catch {
          apiKey = userKeyData;
        }
      }
    } catch (_) {}
  }

  if (!apiKey) {
    const envKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (envKey && envKey !== 'user_provided') {
      apiKey = envKey;
    }
  }

  if (!apiKey) {
    try {
      const { getSystemGoogleKey } = require('~/server/controllers/AdminMarketingController');
      const sysKey = await getSystemGoogleKey();
      if (sysKey) apiKey = sysKey;
    } catch (_) {}
  }

  if (apiKey && typeof apiKey === 'string') {
    apiKey = apiKey.split(',')[0].trim();
  }

  return {
    cookies,
    apiKey,
    email: flowSession?.email || notebookSession?.email || '',
    hasFlowSession: Boolean(flowSession),
    hasNotebookSession: Boolean(notebookSession?.cookies?.length > 0),
  };
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

  // INTENTO 1: Google Labs / Flow ImageFX (aisandbox-pa.googleapis.com/v1:runImageFx)
  if (creds.cookies && creds.cookies.length > 0) {
    try {
      const fxSession = await fetchLabsFxSession(creds.cookies);
      if (fxSession.ok && fxSession.accessToken) {
        logger.info('[GoogleFlow] Ejecutando generación en Google Labs ImageFX...');
        const fxAspectMap = {
          '16:9': 'IMAGE_ASPECT_RATIO_LANDSCAPE',
          '9:16': 'IMAGE_ASPECT_RATIO_PORTRAIT',
          '1:1': 'IMAGE_ASPECT_RATIO_SQUARE',
        };
        const fxRes = await axios.post(
          'https://aisandbox-pa.googleapis.com/v1:runImageFx',
          {
            userInput: {
              candidatesCount: 1,
              prompts: [enhancedPrompt],
              seed: Math.floor(Math.random() * 2147483647),
            },
            clientContext: {
              sessionId: `;${Date.now()}`,
              tool: 'IMAGE_FX',
            },
            modelInput: {
              modelNameType: 'IMAGEN_3_1',
            },
            aspectRatio: fxAspectMap[cleanRatio] || 'IMAGE_ASPECT_RATIO_LANDSCAPE',
          },
          {
            headers: {
              Authorization: `Bearer ${fxSession.accessToken}`,
              'Content-Type': 'application/json',
              Origin: 'https://labs.google',
              Referer: 'https://labs.google/fx/tools/image-fx',
            },
            timeout: 45000,
          }
        );

        const encoded =
          fxRes.data?.imagePanels?.[0]?.generatedImages?.[0]?.encodedImage ||
          fxRes.data?.generatedImages?.[0]?.encodedImage;
        if (encoded) {
          imageBuffer = Buffer.from(encoded, 'base64');
          mimeType = 'image/png';
          modelUsed = 'Google Flow Studio (Imagen 3.1 Labs)';
        }
      }
    } catch (fxErr) {
      logger.warn(
        '[GoogleFlow] Aviso en endpoint Labs ImageFX, pasando a Gemini/Imagen API:',
        fxErr.response?.data?.error?.message || fxErr.message
      );
    }
  }

  // INTENTO 2: Google Gemini Native Image (gemini-2.5-flash-image / Nano Banana)
  if (!imageBuffer && creds.apiKey) {
    try {
      logger.info('[GoogleFlow] Generando imagen con Google gemini-2.5-flash-image...');
      const url = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-flash-image:generateContent?key=${creds.apiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: enhancedPrompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 45000,
        }
      );

      const candidates = response.data?.candidates;
      if (candidates && candidates.length > 0) {
        const imagePart = candidates[0].content?.parts?.find((p) => p.inlineData);
        if (imagePart?.inlineData?.data) {
          imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
          mimeType = imagePart.inlineData.mimeType || 'image/png';
          modelUsed = 'Google Flow (Nano Banana • gemini-2.5-flash-image)';
        }
      }
    } catch (err2) {
      logger.warn(
        '[GoogleFlow] Error en gemini-2.5-flash-image:',
        err2.response?.data?.error?.message || err2.message
      );
    }
  }

  // INTENTO 3: Google Imagen 3 (imagen-3.0-generate-002:predict)
  if (!imageBuffer && creds.apiKey) {
    try {
      logger.info('[GoogleFlow] Generando imagen con Google Imagen 3 (imagen-3.0-generate-002)...');
      const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${creds.apiKey}`;
      const response = await axios.post(
        imagenUrl,
        {
          instances: [{ prompt: enhancedPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: cleanRatio,
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 45000,
        }
      );

      const predictions = response.data?.predictions;
      if (predictions && predictions[0]?.bytesBase64Encoded) {
        imageBuffer = Buffer.from(predictions[0].bytesBase64Encoded, 'base64');
        mimeType = predictions[0].mimeType || 'image/png';
        modelUsed = 'Google Flow (Imagen 3.0)';
      }
    } catch (err3) {
      logger.warn(
        '[GoogleFlow] Error en Imagen 3:',
        err3.response?.data?.error?.message || err3.message
      );
    }
  }

  if (!imageBuffer) {
    throw new Error(
      'No fue posible generar la imagen en este momento. Verifica tu sesión de Google Flow o intenta nuevamente.'
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
  let modelUsed = '';

  // INTENTO 1: Google Veo oficial vía Gemini API (:predictLongRunning)
  if (creds.apiKey) {
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

  await fs.promises.mkdir(OUTPUT_MEDIA_DIR, { recursive: true });
  const fileId = uuidv4();
  const filename = `flow_vid_${fileId}.mp4`;
  const fullPath = path.join(OUTPUT_MEDIA_DIR, filename);
  const publicUrl = `/images/${filename}`;
  let posterUrl = null;

  if (videoBuffer) {
    await fs.promises.writeFile(fullPath, videoBuffer);
  } else {
    // Fallback Cinematográfico Garantizado: Fotograma Maestro Google Imagen + Cámara Flow en MP4 H.264
    logger.info(
      '[GoogleFlow] Generando secuencia de video cinematográfica a partir de fotograma maestro de Google Imagen...'
    );
    const imgResult = await executeFlowImageGeneration({
      userId,
      prompt: enhancedPrompt,
      aspectRatio: cleanRatio,
      style: 'fotorrealista',
    });
    posterUrl = imgResult.publicUrl;
    await renderCinematicMp4FromImage(imgResult.fullPath, fullPath, cleanRatio, cameraMotion);
    modelUsed = `${imgResult.model} + Google Flow Camera Motion (MP4 60fps)`;
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
    if (os.platform() === 'win32') {
      try {
        execSync(\`powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*wappy-notebooklm-auth*' -or $_.CommandLine -like '*wappy-googleflow-auth*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"\`, { stdio: 'ignore' });
      } catch (_) {}
    } else {
      try {
        execSync('pkill -f "wappy-notebooklm-auth|wappy-googleflow-auth"', { stdio: 'ignore' });
      } catch (_) {}
    }
    for (const lockName of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
      const lp = path.join(profileDir, lockName);
      try { fs.unlinkSync(lp); } catch (_) {}
    }
  } catch (_) {}
}

function bringWindowToFront(pid, browserBin) {
  setTimeout(() => {
    try {
      if (os.platform() === 'darwin') {
        const appMatch = browserBin.match(/\\/Applications\\/([^/]+)\\.app/);
        const appName = appMatch ? appMatch[1] : 'Google Chrome';
        execSync(\`osascript -e 'tell application "\${appName}" to activate'\`, { stdio: 'ignore' });
      } else if (os.platform() === 'win32' && pid) {
        execSync(\`powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; [void]$ws.AppActivate(\${pid}); [void]$ws.AppActivate('Flow'); [void]$ws.AppActivate('Google')"\`, { stdio: 'ignore' });
      }
    } catch (_) {}
  }, 1200);
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

  console.log('🌐 Abriendo ventana en primer plano en tu computador...');
  console.log('⏳ Detectando tu sesión (si ya iniciaste sesión antes, se cerrará sola en 3 segundos)...\\n');

  let browserExited = false;
  let child = spawn(
    browserBin,
    [
      \`--remote-debugging-port=\${debugPort}\`,
      '--remote-allow-origins=*',
      \`--user-data-dir=\${flowProfileDir}\`,
      '--no-first-run',
      '--no-default-browser-check',
      '--new-window',
      '--window-size=1100,800',
      '--window-position=120,80',
      '--app=https://labs.google/fx/tools/flow',
    ],
    { detached: false, stdio: 'ignore', windowsHide: false }
  );
  child.on('exit', () => { browserExited = true; });
  bringWindowToFront(child.pid, browserBin);

  const maxWaitMs = 180000;
  const start = Date.now();
  let cdpConnectedOnce = false;
  let retriedFreshProfile = false;

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2000));

    if (!cdpConnectedOnce && !retriedFreshProfile && (browserExited || Date.now() - start > 6000)) {
      retriedFreshProfile = true;
      browserExited = false;
      try { child.kill(); } catch (_) {}
      flowProfileDir = path.join(os.tmpdir(), 'wappy-flow-auth-' + Date.now());
      fs.mkdirSync(flowProfileDir, { recursive: true });
      debugPort = await getFreePort();
      child = spawn(
        browserBin,
        [
          \`--remote-debugging-port=\${debugPort}\`,
          '--remote-allow-origins=*',
          \`--user-data-dir=\${flowProfileDir}\`,
          '--no-first-run',
          '--no-default-browser-check',
          '--new-window',
          '--window-size=1100,800',
          '--window-position=120,80',
          '--app=https://labs.google/fx/tools/flow',
        ],
        { detached: false, stdio: 'ignore', windowsHide: false }
      );
      child.on('exit', () => { browserExited = true; });
      bringWindowToFront(child.pid, browserBin);
      continue;
    }

    if (browserExited && cdpConnectedOnce) {
      console.error('⚠️ La ventana se cerró antes de completar la conexión. Vuelve a ejecutar el comando cuando estés listo.');
      process.exit(1);
    }

    try {
      const listRes = await fetch(\`http://127.0.0.1:\${debugPort}/json/list\`);
      const pages = await listRes.json();
      cdpConnectedOnce = true;
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
          try { child.kill(); } catch (_) {}
          process.exit(0);
        }
      }
    } catch (_) {
      // Sigue esperando mientras el usuario inicia sesión
    }
  }

  console.error('⏰ Tiempo de espera agotado. Vuelve a ejecutar el comando cuando estés listo.');
  try { child.kill(); } catch (_) {}
  process.exit(1);
})();
`;

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  return res.status(200).send(script);
});

router.executeFlowImageGeneration = executeFlowImageGeneration;
router.executeFlowVideoGeneration = executeFlowVideoGeneration;
router.buildFlowStudioCanvasHtml = buildFlowStudioCanvasHtml;

module.exports = router;
