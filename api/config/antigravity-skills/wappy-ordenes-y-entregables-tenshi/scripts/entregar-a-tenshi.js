#!/usr/bin/env node
/**
 * WAPPY IA — CLI Oficial de Entrega Confiable de Órdenes, Documentos y Archivos a Tenshi
 * =======================================================================================
 * Cero dependencias externas npm (100% Node.js nativo). Compatible con macOS, Windows y Linux.
 * Valida archivos por bytes mágicos reales (%PDF, PNG, JPEG, MP4, DOCX/XLSX), previene
 * corrupción HTML en documentos LiveEditor y entrega con reintentos exponenciales seguros.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const CLI_VERSION = '2.7.0';
const MAX_FILE_BYTES = 45 * 1024 * 1024; // 45 MB
const HOME_DIR = os.homedir();
const AGY_DIR = path.join(HOME_DIR, '.gemini', 'antigravity');
const CONFIG_DIR = path.join(HOME_DIR, '.gemini', 'config');
const ENV_FILE = path.join(AGY_DIR, 'wappy-env.json');
const KEYS_FILE = path.join(AGY_DIR, 'wappy-keys.json');
const STUDIO_CURRENT_HTML_FILE = '/tmp/wappy_studio_current.html';

const EXT_MIME_MAP = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.json': 'application/json',
  '.zip': 'application/zip',
};

function parseCliArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (raw === '-h' || raw === '--help') args.help = true;
    else if (raw === '-v' || raw === '--version') args.version = true;
    else if (raw.startsWith('--')) {
      const eq = raw.indexOf('=');
      if (eq !== -1) {
        args[raw.slice(2, eq).trim()] = raw.slice(eq + 1).trim();
      } else {
        const k = raw.slice(2).trim();
        const next = argv[i + 1];
        if (!['json', 'help', 'version'].includes(k) && next && !next.startsWith('--')) {
          args[k] = next.trim();
          i += 1;
        } else {
          args[k] = true;
        }
      }
    }
  }
  return args;
}

function printHelp() {
  console.log(
    `
WAPPY IA · Despachador Confiable de Órdenes y Entregables hacia Tenshi v${CLI_VERSION}
===================================================================================

Uso:
  node entregar-a-tenshi.js [opciones]

Opciones de archivo binario (copia intacta desde PC/Mac):
  --file=<ruta>                  Ruta del archivo local (.pdf, .png, .xlsx, .docx, .mp4, .zip)
  --title="Título opcional"      Título descriptivo del entregable
  --summary="Resumen ejecutivo"  Mensaje de acompañamiento en el chat de Tenshi

Opciones de orden delegada / documento LiveEditor / aplicativo HTML:
  --orden-id=<id>                ID de la orden delegada (si se omite, crea entrega directa 'auto')
  --formato=<tipo>               respuesta | documento | html | copia_archivo
  --resultado="Texto..."         Respuesta directa o resumen técnico de la orden
  --contenido-file=<ruta>        Archivo .md o .html con el cuerpo completo del entregable
  --contenido="Texto..."         Contenido en línea (preferir --contenido-file para textos largos)

Opciones generales:
  --url=https://wappy.club       Sobrescribe servidor destino
  --key=wpy_live_...             Sobrescribe API Key
  --json                         Devuelve confirmación en JSON puro por stdout
  --help                         Muestra esta ayuda

Ejemplos:
  node entregar-a-tenshi.js --file=~/Downloads/Certificado_ARL.pdf --summary="Certificado ARL activo"
  node entregar-a-tenshi.js --orden-id=673a... --formato=documento --contenido-file=/tmp/acta.md --summary="Acta COPASST lista"
  node entregar-a-tenshi.js --orden-id=673a... --formato=respuesta --resultado="Diagnóstico 0312 en 89.5%"
`.trim(),
  );
}

function expandPath(rawPath) {
  const s = String(rawPath || '').trim();
  if (!s) return '';
  if (s === '~') return HOME_DIR;
  if (s.startsWith('~/') || s.startsWith('~\\')) return path.join(HOME_DIR, s.slice(2));
  return path.resolve(s);
}

function normalizeWappyUrl(rawUrl) {
  return (
    String(rawUrl || 'https://wappy.club')
      .trim()
      .replace(/https?:\/\/wappy-ia\.com/gi, 'https://wappy.club')
      .replace(/\/+$/, '')
      .replace(/\/api\/mcp-bridge.*$/i, '') || 'https://wappy.club'
  );
}

function resolveAllCredentials(cliArgs = {}) {
  const creds = [];
  const seen = new Set();
  const pushCred = (u, k) => {
    const cleanKey = String(k || '').trim();
    if (!cleanKey || cleanKey === 'PEGA_TU_CLAVE_AQUI' || cleanKey.includes('...')) return;
    if (seen.has(cleanKey)) return;
    seen.add(cleanKey);
    creds.push({ wappyUrl: normalizeWappyUrl(u), apiKey: cleanKey });
  };

  pushCred(cliArgs.url || process.env.WAPPY_URL, cliArgs.key || cliArgs.apiKey || process.env.WAPPY_API_KEY);

  try {
    if (fs.existsSync(ENV_FILE)) {
      const envObj = JSON.parse(fs.readFileSync(ENV_FILE, 'utf8')) || {};
      pushCred(envObj.WAPPY_URL, envObj.WAPPY_API_KEY);
    }
  } catch (_) {}

  for (const cfgPath of [
    path.join(CONFIG_DIR, 'mcp_config.json'),
    path.join(AGY_DIR, 'mcp_config.json'),
  ]) {
    try {
      if (!fs.existsSync(cfgPath)) continue;
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) || {};
      const srv = cfg?.mcpServers?.wappy;
      const uStr = srv?.serverUrl || srv?.url || '';
      if (uStr) {
        const parsed = new URL(uStr);
        pushCred(`${parsed.protocol}//${parsed.host}`, parsed.searchParams.get('apiKey'));
      }
    } catch (_) {}
  }

  try {
    if (fs.existsSync(KEYS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
      if (Array.isArray(saved)) {
        for (const item of saved) {
          if (item && item.apiKey) pushCred(item.wappyUrl, item.apiKey);
        }
      }
    }
  } catch (_) {}

  return creds;
}

function detectMimeFromBufferAndExt(buf, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (buf.length >= 5 && buf.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'application/pdf';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return 'image/png';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (buf.length >= 6 && /^GIF8[79]a/.test(buf.subarray(0, 6).toString('ascii'))) {
    return 'image/gif';
  }
  if (buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    return ext === '.mov' ? 'video/quicktime' : 'video/mp4';
  }
  if (
    buf.length >= 4 &&
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    buf[2] === 0x03 &&
    buf[3] === 0x04
  ) {
    if (ext === '.docx') return EXT_MIME_MAP['.docx'];
    if (ext === '.xlsx') return EXT_MIME_MAP['.xlsx'];
    if (ext === '.pptx') return EXT_MIME_MAP['.pptx'];
    return 'application/zip';
  }
  return EXT_MIME_MAP[ext] || 'application/octet-stream';
}

function stripAccidentalHtmlShellForLiveEditor(rawMarkdown) {
  const trimmed = String(rawMarkdown || '').trim();
  if (!/^<!doctype\s+html|^<html\b/i.test(trimmed)) return trimmed;
  const bodyMatch = trimmed.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const inner = bodyMatch ? bodyMatch[1] : trimmed;
  return inner
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim();
}

function postJson(urlStr, apiKey, payload, timeoutMs = 35000) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(urlStr);
    } catch (err) {
      return reject(err);
    }
    const bodyBuf = Buffer.from(JSON.stringify(payload), 'utf8');
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(
      parsed,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': bodyBuf.length,
          'x-api-key': apiKey,
          'x-wappy-api-key': apiKey,
          Authorization: `Bearer ${apiKey}`,
          'User-Agent': `Wappy-Entregar-Tenshi-CLI/${CLI_VERSION}`,
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let data = null;
          try {
            data = JSON.parse(text);
          } catch (_) {
            data = { raw: text.slice(0, 500) };
          }
          resolve({ status: res.statusCode || 0, data });
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error(`Timeout (${timeoutMs}ms) enviando a ${urlStr}`)));
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function postWithSafeRetries(urlStr, apiKey, payload) {
  const delays = [800, 2000];
  let lastErr = null;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const resp = await postJson(urlStr, apiKey, payload);
      if ([502, 503, 504].includes(resp.status) && attempt < delays.length) {
        await sleep(delays[attempt]);
        continue;
      }
      return resp;
    } catch (err) {
      lastErr = err;
      if (attempt < delays.length) {
        await sleep(delays[attempt]);
        continue;
      }
    }
  }
  throw lastErr || new Error('Fallo de red tras reintentos.');
}

(async () => {
  const cliArgs = parseCliArgs(process.argv.slice(2));
  if (cliArgs.help) {
    printHelp();
    process.exit(0);
  }
  if (cliArgs.version) {
    console.log(CLI_VERSION);
    process.exit(0);
  }

  const jsonMode = Boolean(cliArgs.json);
  const emitExit = (code, obj, humanMsg) => {
    if (jsonMode) {
      process.stdout.write(`${JSON.stringify({ exitCode: code, ...obj }, null, 2)}\n`);
    } else if (code === 0) {
      console.log(humanMsg);
    } else {
      process.stderr.write(`${humanMsg}\n`);
    }
    process.exit(code);
  };

  const rawFile = cliArgs.file || cliArgs['send-file'] || cliArgs.archivo || '';
  const rawContenidoFile = cliArgs['contenido-file'] || cliArgs.contenidoFile || '';
  const ordenId =
    String(
      cliArgs['orden-id'] ||
        cliArgs.ordenId ||
        cliArgs.id ||
        cliArgs['complete-order'] ||
        'auto',
    ).trim() || 'auto';
  const title = String(cliArgs.title || cliArgs.titulo || '').trim();
  const summary = String(cliArgs.summary || cliArgs.resumen || '').trim();
  const resultadoArg = String(cliArgs.resultado || cliArgs.result || '').trim();
  let contenido = String(cliArgs.contenido || cliArgs.content || '').trim();

  if (rawContenidoFile) {
    const resolvedContentFile = expandPath(rawContenidoFile);
    if (!fs.existsSync(resolvedContentFile) || !fs.statSync(resolvedContentFile).isFile()) {
      emitExit(
        1,
        { ok: false, error: `No existe --contenido-file: ${resolvedContentFile}` },
        `❌ Error: No existe el archivo indicado en --contenido-file: ${resolvedContentFile}`,
      );
    }
    contenido = fs.readFileSync(resolvedContentFile, 'utf8');
  }

  let archivoOriginal = undefined;
  let fileAudit = null;

  if (rawFile) {
    const resolvedFile = expandPath(rawFile);
    if (!fs.existsSync(resolvedFile)) {
      emitExit(
        1,
        { ok: false, error: `El archivo no existe: ${resolvedFile}` },
        `❌ Error: El archivo local no existe en la ruta: ${resolvedFile}`,
      );
    }
    const st = fs.statSync(resolvedFile);
    if (!st.isFile() || st.size === 0) {
      emitExit(
        1,
        { ok: false, error: `Ruta inválida o archivo vacío (0 bytes): ${resolvedFile}` },
        `❌ Error: El archivo está vacío o no es un archivo regular: ${resolvedFile}`,
      );
    }
    if (st.size > MAX_FILE_BYTES) {
      emitExit(
        1,
        { ok: false, error: `El archivo supera el límite de 45 MB (${st.size} bytes).` },
        `❌ Error: El archivo supera el tamaño máximo permitido de 45 MB.`,
      );
    }
    const buf = fs.readFileSync(resolvedFile);
    const fileName = path.basename(resolvedFile);
    const mimeType = detectMimeFromBufferAndExt(buf, fileName);
    if (path.extname(fileName).toLowerCase() === '.pdf' && mimeType !== 'application/pdf') {
      emitExit(
        1,
        { ok: false, error: `El archivo ${fileName} tiene extensión .pdf pero NO inicia con cabecera mágica %PDF.` },
        `❌ Error de integridad: "${fileName}" no contiene una cabecera %PDF válida.`,
      );
    }
    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
    archivoOriginal = {
      name: fileName,
      mimeType,
      size: buf.length,
      dataUrl: `data:${mimeType};base64,${buf.toString('base64')}`,
    };
    fileAudit = {
      path: resolvedFile,
      name: fileName,
      mimeType,
      sizeBytes: buf.length,
      sha256,
    };
  }

  // Determinar formato automáticamente si no se especificó
  let formato = String(cliArgs.formato || cliArgs.format || '').toLowerCase().trim();
  if (!formato) {
    if (archivoOriginal) {
      formato = 'copia_archivo';
    } else if (
      (rawContenidoFile && /\.html?$/i.test(rawContenidoFile)) ||
      /^<!doctype\s+html|^<html\b/i.test(contenido)
    ) {
      formato = 'html';
    } else if (contenido && contenido.length >= 300) {
      formato = 'documento';
    } else {
      formato = 'respuesta';
    }
  }

  if (formato === 'copia_archivo' && !archivoOriginal) {
    emitExit(
      1,
      { ok: false, error: 'formato="copia_archivo" requiere --file=<ruta_local>.' },
      '❌ Error: Para --formato=copia_archivo debes indicar --file=<ruta_local>.',
    );
  }

  if (formato === 'documento') {
    contenido = stripAccidentalHtmlShellForLiveEditor(contenido || resultadoArg);
    if (contenido.length < 300) {
      emitExit(
        1,
        {
          ok: false,
          error: `formato="documento" exige mínimo 300 caracteres en Markdown estructurado (actual: ${contenido.length}).`,
        },
        `❌ Error: Para --formato=documento el contenido debe tener al menos 300 caracteres (actual: ${contenido.length}). Si es una respuesta breve usa --formato=respuesta.`,
      );
    }
  } else if (formato === 'html') {
    if (!contenido || contenido.length < 80) {
      emitExit(
        1,
        { ok: false, error: 'formato="html" requiere código HTML completo en --contenido-file o --contenido.' },
        '❌ Error: Para --formato=html debes suministrar el documento HTML completo en --contenido-file.',
      );
    }
    if (/data-wappy-master-reel|id=["']stage["']/i.test(contenido)) {
      try {
        fs.writeFileSync(STUDIO_CURRENT_HTML_FILE, contenido, 'utf8');
      } catch (_) {}
    }
  } else if (formato === 'respuesta' && !resultadoArg && !summary && !contenido) {
    emitExit(
      1,
      { ok: false, error: 'Debes indicar --resultado="..." o --summary="..." para entregar una respuesta.' },
      '❌ Error: Indica el texto de la respuesta en --resultado="..."',
    );
  }

  const creds = resolveAllCredentials(cliArgs);
  if (creds.length === 0) {
    emitExit(
      2,
      { ok: false, error: 'No se encontró API Key de WAPPY en wappy-env.json ni mcp_config.json.' },
      '❌ Error: No se encontró ninguna API Key de WAPPY configurada localmente.',
    );
  }

  const effectiveSummary =
    summary ||
    resultadoArg ||
    (archivoOriginal
      ? `Copia original verificada del archivo "${archivoOriginal.name}" enviada desde Google Antigravity.`
      : 'Entregable procesado exitosamente por Google Antigravity.');

  const payload = {
    ordenId,
    titulo: title || (archivoOriginal ? archivoOriginal.name : undefined),
    formato,
    resultado: resultadoArg || effectiveSummary,
    resumen: effectiveSummary,
    contenido: formato === 'copia_archivo' ? undefined : contenido || resultadoArg || effectiveSummary,
    archivoOriginal,
  };

  let lastResponse = null;
  for (const { wappyUrl, apiKey } of creds) {
    const candidateEndpoints =
      ordenId && ordenId !== 'auto'
        ? [
            `${wappyUrl}/api/mcp-bridge/antigravity/ordenes/${encodeURIComponent(ordenId)}/completar`,
            `${wappyUrl}/api/mcp-bridge/antigravity/completar`,
          ]
        : [`${wappyUrl}/api/mcp-bridge/antigravity/completar`];

    for (const endpoint of candidateEndpoints) {
      try {
        const resp = await postWithSafeRetries(endpoint, apiKey, payload);
        lastResponse = resp;
        if (resp.status === 404 && endpoint.includes('/ordenes/')) {
          // Respaldo inmediato al endpoint clásico /antigravity/completar si el servidor aún no expone el alias
          continue;
        }
        if (resp.status === 200 && (resp.data?.exito || resp.data?.ok)) {
          const outObj = {
            ok: true,
            exito: true,
            ordenId: resp.data?.orden?.id || ordenId,
            formato,
            titulo: resp.data?.orden?.titulo || title || archivoOriginal?.name || null,
            tenshiMensajeId: resp.data?.tenshiMensajeId || null,
            urlDescarga:
              resp.data?.entregable?.urlDescarga ||
              resp.data?.entregable?.media?.publicUrl ||
              null,
            duplicado: Boolean(resp.data?.duplicado),
            mensaje: resp.data?.mensaje || 'Entregable recibido por WAPPY IA.',
            ...(fileAudit ? { fileAudit } : {}),
          };
          const humanMsg = [
            `✅ Entregable despachado exitosamente a WAPPY IA / Tenshi`,
            `   • Orden ID   : ${outObj.ordenId}`,
            `   • Formato    : ${outObj.formato}`,
            fileAudit
              ? `   • Archivo    : ${fileAudit.name} (${(fileAudit.sizeBytes / 1024).toFixed(1)} KB · ${fileAudit.mimeType} · SHA-256 ${fileAudit.sha256.slice(0, 16)}...)`
              : null,
            outObj.urlDescarga ? `   • URL Pública: ${outObj.urlDescarga}` : null,
            `   • Confirmación: ${outObj.mensaje}`,
          ]
            .filter(Boolean)
            .join('\n');
          emitExit(0, outObj, humanMsg);
        }
        if (resp.status === 401 || resp.status === 403) {
          break; // Probar siguiente credencial
        }
      } catch (err) {
        lastResponse = { status: 0, data: { error: err.message } };
      }
    }
  }

  const errDetail =
    lastResponse?.data?.error ||
    lastResponse?.data?.mensaje ||
    `HTTP ${lastResponse?.status || 0}`;
  emitExit(
    2,
    { ok: false, ordenId, formato, error: errDetail },
    `❌ No fue posible entregar la orden "${ordenId}" a WAPPY IA: ${errDetail}`,
  );
})();
