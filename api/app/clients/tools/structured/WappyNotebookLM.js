const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');

const DEFAULT_NOTEBOOKLM_URLS = [
  process.env.NOTEBOOKLM_URL,
  process.env.NOTEBOOKLM_MCP_URL,
  'http://notebooklm-mcp:9420',
  'http://127.0.0.1:9420',
].filter(Boolean);

const SUPPORTED_ARTIFACTS = [
  'infographic',
  'slide_deck',
  'report',
  'audio',
  'video',
  'data_table',
  'mind_map',
];

function getNotebookLmBaseCandidates() {
  return Array.from(
    new Set(
      [
        process.env.NOTEBOOKLM_URL,
        process.env.NOTEBOOKLM_MCP_URL,
        'http://notebooklm-mcp:9420',
        'http://127.0.0.1:9420',
        ...DEFAULT_NOTEBOOKLM_URLS,
      ]
        .filter(Boolean)
        .map((u) => String(u).trim().replace(/\/+$/, '')),
    ),
  );
}

function normalizePublicMediaLocations(relativeOrFilename) {
  const cleanRel = String(relativeOrFilename || '').startsWith('/images/')
    ? String(relativeOrFilename)
    : `/images/${path.basename(String(relativeOrFilename || ''))}`;
  const localPath = path.join(process.cwd(), 'client', 'public', cleanRel.replace(/^\//, ''));
  const absoluteUrl = `https://wappy.club${cleanRel}`;
  return {
    filename: path.basename(cleanRel),
    localPath,
    relativeUrl: cleanRel,
    publicUrl: cleanRel,
    absoluteUrl,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class WappyNotebookLM extends Tool {
  static lc_name() {
    return 'wappy_notebooklm';
  }

  constructor(fields = {}) {
    super();

    this.userId = fields.userId || fields.req?.user?.id || null;
    this.companyId = fields.companyId || fields.req?.companyId || fields.req?.body?.companyId || null;
    this.req = fields.req;
    this.isAgent = fields.isAgent ?? true;

    this.name = 'wappy_notebooklm';
    this.description =
      'Google NotebookLM (Segundo Cerebro Documental aislado por empresa): Permite listar cuadernos conectados ("listar_cuadernos"), realizar consultas RAG con citas ("consultar"), agregar fuentes URL o texto a un cuaderno ("agregar_fuente") y generar artefactos de NotebookLM Studio como infografías, presentaciones, reportes, audios, videos, tablas o mapas mentales ("generar_estudio") descargándolos en el servidor para adjuntarlos o proyectarlos.';

    this.schema = z.object({
      accion: z
        .enum(['listar_cuadernos', 'consultar', 'agregar_fuente', 'generar_estudio'])
        .optional()
        .default('consultar')
        .describe(
          'Acción a ejecutar: "listar_cuadernos", "consultar" (consulta RAG con citas), "agregar_fuente" (URL o texto), o "generar_estudio" (genera y descarga artefacto Studio).',
        ),
      notebook_id: z
        .string()
        .optional()
        .describe(
          'ID o título exacto del cuaderno de NotebookLM. Si se omite en consultar/agregar_fuente/generar_estudio, se usa automáticamente el primer cuaderno activo vinculado en NotebookSession.',
        ),
      question: z
        .string()
        .optional()
        .describe('Pregunta o instrucción de consulta fundamentada cuando accion es "consultar".'),
      source_type: z
        .enum(['url', 'text'])
        .optional()
        .describe('Tipo de fuente a agregar cuando accion es "agregar_fuente" ("url" o "text").'),
      source_url: z
        .string()
        .optional()
        .describe('URL pública o de Google Docs/Drive a agregar cuando source_type es "url".'),
      source_text: z
        .string()
        .optional()
        .describe('Contenido de texto o Markdown a agregar como fuente cuando source_type es "text".'),
      source_title: z
        .string()
        .optional()
        .describe('Título opcional de la fuente agregada.'),
      artifact_type: z
        .enum(['infographic', 'slide_deck', 'report', 'audio', 'video', 'data_table', 'mind_map'])
        .optional()
        .default('infographic')
        .describe(
          'Tipo de artefacto Studio cuando accion es "generar_estudio": infographic, slide_deck, report, audio, video, data_table o mind_map.',
        ),
      focus_prompt: z
        .string()
        .optional()
        .describe('Instrucciones o enfoque editorial opcional para generar el artefacto Studio.'),
    });
  }

  returnValue(val, artifact = {}) {
    const serialized = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
    if (this.isAgent) {
      return [serialized, artifact];
    }
    return serialized;
  }

  async _getScopedSessionContext() {
    const mongoose = require('mongoose');
    const NotebookSession =
      mongoose.models.NotebookSession || require('~/models/NotebookSession');
    const nlmHelpers = require('~/server/routes/notebooklm');

    if (!this.userId) {
      return {
        nlmHelpers,
        effectiveCompanyId: this.companyId || null,
        session: null,
        cookies: [],
      };
    }

    const effectiveCompanyId =
      typeof nlmHelpers.resolveActiveCompanyId === 'function'
        ? await nlmHelpers
            .resolveActiveCompanyId(this.userId, this.companyId)
            .catch(() => this.companyId || null)
        : this.companyId || null;

    const session =
      typeof nlmHelpers.findSessionForCompany === 'function'
        ? await nlmHelpers
            .findSessionForCompany(NotebookSession, this.userId, effectiveCompanyId)
            .catch(() => null)
        : await NotebookSession.findOne({
            user: this.userId,
            ...(effectiveCompanyId
              ? { $or: [{ companyId: effectiveCompanyId }, { companyId: null }] }
              : { $or: [{ companyId: null }, { companyId: { $exists: false } }] }),
          })
            .sort({ companyId: -1, updatedAt: -1 })
            .lean()
            .catch(() => null);

    const cookies = Array.isArray(session?.cookies) ? session.cookies : [];
    return {
      nlmHelpers,
      effectiveCompanyId,
      session,
      cookies,
    };
  }

  async _callDirectTool(toolCandidates, args = {}, { cookies = [], timeoutMs = 45000 } = {}) {
    const toolList = Array.isArray(toolCandidates) ? toolCandidates : [toolCandidates];
    const baseUrls = getNotebookLmBaseCandidates();
    let lastError = null;

    for (const baseUrl of baseUrls) {
      let connectionFailed = false;
      for (const toolName of toolList) {
        try {
          const headers = {
            'Content-Type': 'application/json',
          };
          if (this.userId) {
            headers['x-user-id'] = String(this.userId);
          }
          if (Array.isArray(cookies) && cookies.length > 0) {
            headers['x-notebooklm-auth'] = JSON.stringify(cookies);
          }

          const res = await fetch(`${baseUrl}/api/direct-tool`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              tool: toolName,
              args,
              cookies,
              user_id: String(this.userId || 'default'),
            }),
            signal: AbortSignal.timeout(timeoutMs),
          });

          const rawText = await res.text();
          let data = {};
          try {
            data = rawText ? JSON.parse(rawText) : {};
          } catch (_) {
            data = { raw: rawText };
          }

          if (!res.ok) {
            const errMsg = String(data?.error || data?.detail || data?.message || `HTTP ${res.status}`);
            const unsupported =
              res.status === 400 &&
              (/no soportada/i.test(errMsg) || /not supported/i.test(errMsg) || /unknown tool/i.test(errMsg));
            lastError = new Error(errMsg);
            if (unsupported) {
              continue;
            }
            throw lastError;
          }

          return {
            baseUrl,
            toolUsed: toolName,
            result: data?.result !== undefined ? data.result : data,
          };
        } catch (err) {
          lastError = err;
          const msg = String(err?.message || '').toLowerCase();
          if (
            err?.name === 'AbortError' ||
            msg.includes('fetch failed') ||
            msg.includes('econnrefused') ||
            msg.includes('enotfound') ||
            msg.includes('etimedout') ||
            msg.includes('eai_again')
          ) {
            connectionFailed = true;
            break;
          }
        }
      }
      if (!connectionFailed && lastError) {
        break;
      }
    }

    throw lastError || new Error('No fue posible conectar con el servicio notebooklm-mcp.');
  }

  async _resolveFirstActiveNotebookId(session, cookies, nlmHelpers) {
    if (Array.isArray(session?.cachedNotebooks) && session.cachedNotebooks.length > 0) {
      const firstCached = session.cachedNotebooks.find((nb) => nb && (nb.id || nb.notebook_id));
      if (firstCached) {
        return String(firstCached.id || firstCached.notebook_id).trim();
      }
    }

    if (session?.agentNotebooks && typeof session.agentNotebooks === 'object') {
      for (const list of Object.values(session.agentNotebooks)) {
        if (Array.isArray(list) && list.length > 0) {
          const firstAssigned = list.find((nb) => nb && (nb.id || nb.notebook_id));
          if (firstAssigned) {
            return String(firstAssigned.id || firstAssigned.notebook_id).trim();
          }
        }
      }
    }

    if (Array.isArray(cookies) && cookies.length > 0) {
      const { result } = await this._callDirectTool('notebook_list', {}, { cookies, timeoutMs: 20000 });
      const normalized =
        typeof nlmHelpers?.normalizeNotebookList === 'function'
          ? nlmHelpers.normalizeNotebookList(result)
          : Array.isArray(result)
            ? result
            : [];
      if (normalized[0]?.id) {
        return String(normalized[0].id).trim();
      }
    }

    return '';
  }

  async _downloadReadyArtifact({
    notebookId,
    artifactId,
    artifactType,
    cookies,
    nlmHelpers,
    waitSeconds = 18,
  }) {
    const baseUrls = getNotebookLmBaseCandidates();
    const maxAttempts = Math.max(1, Math.min(6, Math.ceil(waitSeconds / 3)));
    let lastStatus = 'in_progress';

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (attempt > 0) {
        await sleep(3000);
      }

      for (const baseUrl of baseUrls) {
        try {
          const dlQs = new URLSearchParams({
            notebook_id: String(notebookId),
            artifact_id: String(artifactId),
            type: String(artifactType || 'infographic'),
          });
          if (this.userId) dlQs.set('user_id', String(this.userId));

          const headers = {};
          if (this.userId) headers['x-user-id'] = String(this.userId);
          if (Array.isArray(cookies) && cookies.length > 0) {
            headers['x-notebooklm-auth'] = JSON.stringify(cookies);
          }

          const dlRes = await fetch(`${baseUrl}/api/download-artifact?${dlQs.toString()}`, {
            headers,
            signal: AbortSignal.timeout(20000),
          });

          if (dlRes.status === 202) {
            lastStatus = 'in_progress';
            break;
          }

          if (!dlRes.ok) {
            if (dlRes.status === 404 || dlRes.status === 409) {
              lastStatus = 'in_progress';
              break;
            }
            continue;
          }

          const contentType = String(dlRes.headers.get('content-type') || '').toLowerCase();
          if (contentType.includes('application/json')) {
            const jsonPayload = await dlRes.clone().json().catch(() => null);
            if (jsonPayload && (jsonPayload.status === 'in_progress' || jsonPayload.is_complete === false)) {
              lastStatus = 'in_progress';
              break;
            }
          }

          const arrBuf = await dlRes.arrayBuffer();
          const buf = Buffer.from(arrBuf);
          if (buf.length === 0) {
            continue;
          }

          const contentDisp = String(dlRes.headers.get('content-disposition') || '');
          const meta =
            typeof nlmHelpers?.resolveNotebookArtifactFileMeta === 'function'
              ? nlmHelpers.resolveNotebookArtifactFileMeta(
                  artifactType,
                  notebookId,
                  artifactId,
                  contentType,
                  contentDisp,
                )
              : {
                  ext: 'bin',
                  mime: contentType || 'application/octet-stream',
                  prefix: 'nlm_doc_',
                  filename: `nlm_doc_${String(artifactId).replace(/[^a-zA-Z0-9_-]/g, '')}.bin`,
                };

          const outputDir =
            nlmHelpers?.OUTPUT_MEDIA_DIR || path.join(process.cwd(), 'client', 'public', 'images');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          const filename = meta.filename.startsWith('nlm_') ? meta.filename : `nlm_${meta.filename}`;
          const localPath = path.join(outputDir, filename);
          fs.writeFileSync(localPath, buf);

          const locs = normalizePublicMediaLocations(`/images/${filename}`);
          return {
            downloaded: true,
            status: 'completed',
            filename,
            localPath: fs.existsSync(localPath) ? localPath : locs.localPath,
            relativeUrl: locs.relativeUrl,
            publicUrl: locs.publicUrl,
            absoluteUrl: locs.absoluteUrl,
            mimeType: meta.mime,
            sizeBytes: buf.length,
          };
        } catch (dlErr) {
          logger.debug(`[wappy_notebooklm] Intento descarga ${attempt + 1} en ${baseUrl}: ${dlErr.message}`);
        }
      }
    }

    return {
      downloaded: false,
      status: lastStatus,
      localPath: null,
      relativeUrl: null,
      publicUrl: null,
      absoluteUrl: null,
      filename: null,
    };
  }

  async _call(data = {}) {
    const rawAction = String(data.accion || data.action || 'consultar')
      .toLowerCase()
      .trim();

    try {
      const { nlmHelpers, effectiveCompanyId, session, cookies } = await this._getScopedSessionContext();
      const hasConnection = Boolean(session && Array.isArray(cookies) && cookies.length > 0);

      if (rawAction === 'listar_cuadernos') {
        if (!hasConnection) {
          return this.returnValue(
            {
              ok: false,
              action: 'listar_cuadernos',
              connected: false,
              companyId: effectiveCompanyId ? String(effectiveCompanyId) : null,
              notebooks: [],
              error: 'No hay sesión conectada de Google NotebookLM para esta empresa.',
            },
            { ok: false, notebooks: [] },
          );
        }

        let notebooks = [];
        try {
          const { result } = await this._callDirectTool('notebook_list', {}, { cookies, timeoutMs: 25000 });
          const rawList =
            typeof nlmHelpers?.normalizeNotebookList === 'function'
              ? nlmHelpers.normalizeNotebookList(result)
              : Array.isArray(result)
                ? result
                : [];
          notebooks = rawList.map((nb) => ({
            id: String(nb.id || nb.notebook_id || ''),
            title: String(nb.title || 'Cuaderno sin título'),
            sources_count: Number(nb.sources_count || nb.source_count || 0),
          }));
        } catch (liveErr) {
          if (Array.isArray(session?.cachedNotebooks) && session.cachedNotebooks.length > 0) {
            notebooks = session.cachedNotebooks.map((nb) => ({
              id: String(nb.id || nb.notebook_id || ''),
              title: String(nb.title || 'Cuaderno sin título'),
              sources_count: Number(nb.sources_count || nb.source_count || 0),
            }));
          } else {
            throw liveErr;
          }
        }

        const payload = {
          ok: true,
          action: 'listar_cuadernos',
          connected: true,
          companyId: effectiveCompanyId ? String(effectiveCompanyId) : null,
          count: notebooks.length,
          notebooks,
        };
        return this.returnValue(payload, payload);
      }

      if (!hasConnection) {
        return this.returnValue(
          {
            ok: false,
            action: rawAction,
            connected: false,
            companyId: effectiveCompanyId ? String(effectiveCompanyId) : null,
            error: 'No hay sesión conectada de Google NotebookLM para esta empresa.',
          },
          { ok: false },
        );
      }

      let notebookId = String(data.notebook_id || data.notebookId || data.notebook || '').trim();
      if (!notebookId) {
        notebookId = await this._resolveFirstActiveNotebookId(session, cookies, nlmHelpers);
      }

      if (!notebookId) {
        return this.returnValue(
          {
            ok: false,
            action: rawAction,
            error: 'No se encontró ningún notebook_id activo en la sesión de NotebookLM.',
          },
          { ok: false },
        );
      }

      if (rawAction === 'consultar') {
        const question = String(data.question || data.query || data.pregunta || '').trim();
        if (!question) {
          return this.returnValue(
            {
              ok: false,
              action: 'consultar',
              notebookId,
              error: 'El parámetro question es obligatorio para consultar un cuaderno.',
            },
            { ok: false },
          );
        }

        const { result, toolUsed } = await this._callDirectTool(
          ['notebook_query', 'chat_ask'],
          {
            notebook_id: notebookId,
            notebook: notebookId,
            query: question,
            question,
          },
          { cookies, timeoutMs: 60000 },
        );

        const parsedObj =
          result && typeof result === 'object'
            ? result
            : { answer: typeof result === 'string' ? result : JSON.stringify(result || '') };

        const answer =
          parsedObj.answer ||
          parsedObj.response ||
          parsedObj.text ||
          parsedObj.message ||
          (typeof result === 'string' ? result : '');
        const citations = Array.isArray(parsedObj.citations) ? parsedObj.citations : [];
        const references = Array.isArray(parsedObj.references)
          ? parsedObj.references
          : Array.isArray(parsedObj.sources)
            ? parsedObj.sources
            : citations;

        const payload = {
          ok: true,
          action: 'consultar',
          toolUsed,
          notebookId,
          question,
          answer,
          citations,
          references,
        };
        return this.returnValue(payload, payload);
      }

      if (rawAction === 'agregar_fuente') {
        const sourceUrl = String(data.source_url || data.url || '').trim();
        const sourceText = String(data.source_text || data.text || data.content || '').trim();
        const sourceTitle = String(data.source_title || data.title || '').trim();
        const sourceType = String(
          data.source_type || (sourceUrl ? 'url' : 'text'),
        )
          .toLowerCase()
          .trim();

        if (sourceType === 'url' && !sourceUrl) {
          return this.returnValue(
            { ok: false, action: 'agregar_fuente', notebookId, error: 'Falta source_url para tipo url.' },
            { ok: false },
          );
        }
        if (sourceType !== 'url' && !sourceText && !sourceUrl) {
          return this.returnValue(
            { ok: false, action: 'agregar_fuente', notebookId, error: 'Proporciona source_url o source_text.' },
            { ok: false },
          );
        }

        const { result } = await this._callDirectTool(
          'source_add',
          {
            notebook_id: notebookId,
            notebook: notebookId,
            source_type: sourceType,
            ...(sourceUrl ? { url: sourceUrl } : {}),
            ...(sourceText ? { text: sourceText, content: sourceText } : {}),
            ...(sourceTitle ? { title: sourceTitle } : {}),
          },
          { cookies, timeoutMs: 45000 },
        );

        const payload = {
          ok: true,
          action: 'agregar_fuente',
          notebookId,
          sourceType,
          result,
        };
        return this.returnValue(payload, payload);
      }

      if (rawAction === 'generar_estudio') {
        const artifactType = String(data.artifact_type || data.tipo_artefacto || 'infographic')
          .toLowerCase()
          .trim();
        const normalizedType = SUPPORTED_ARTIFACTS.includes(artifactType) ? artifactType : 'infographic';
        const focusPrompt = String(
          data.focus_prompt || data.instructions || data.prompt || '',
        ).trim();

        const { result, toolUsed } = await this._callDirectTool(
          ['studio_create', 'studio_generate'],
          {
            notebook_id: notebookId,
            notebook: notebookId,
            artifact_type: normalizedType,
            ...(focusPrompt ? { instructions: focusPrompt, focus_prompt: focusPrompt } : {}),
            language: 'es',
          },
          { cookies, timeoutMs: 65000 },
        );

        const resObj = result && typeof result === 'object' ? result : {};
        const artifactId = String(resObj.artifact_id || resObj.task_id || resObj.id || '').trim();
        const resolvedNbId = String(resObj.notebook_id || notebookId).trim();

        let dlInfo = {
          downloaded: false,
          status: resObj.status || 'in_progress',
          localPath: null,
          publicUrl: null,
          relativeUrl: null,
          absoluteUrl: null,
          filename: null,
        };

        if (artifactId) {
          dlInfo = await this._downloadReadyArtifact({
            notebookId: resolvedNbId,
            artifactId,
            artifactType: normalizedType,
            cookies,
            nlmHelpers,
            waitSeconds: Number(data.wait_seconds) || 18,
          });
        }

        const wappyApiDownload = artifactId
          ? `https://wappy.club/api/notebooklm/download/${resolvedNbId}/${artifactId}${
              this.userId ? `?userId=${encodeURIComponent(String(this.userId))}` : ''
            }`
          : null;

        const payload = {
          ok: true,
          action: 'generar_estudio',
          toolUsed,
          status: dlInfo.downloaded ? 'completed' : resObj.status || dlInfo.status || 'in_progress',
          notebookId: resolvedNbId,
          artifactId,
          artifact_id: artifactId,
          artifactType: normalizedType,
          downloaded: Boolean(dlInfo.downloaded),
          localPath: dlInfo.localPath,
          publicUrl: dlInfo.publicUrl || wappyApiDownload,
          relativeUrl: dlInfo.relativeUrl,
          absoluteUrl: dlInfo.absoluteUrl || wappyApiDownload,
          filename: dlInfo.filename,
          downloadUrl: wappyApiDownload,
          content: resObj.content || null,
        };
        return this.returnValue(payload, payload);
      }

      return this.returnValue(
        { ok: false, action: rawAction, error: `Acción no reconocida en wappy_notebooklm: ${rawAction}` },
        { ok: false },
      );
    } catch (err) {
      logger.error('[wappy_notebooklm] Error ejecutando herramienta:', err);
      const errPayload = {
        ok: false,
        action: rawAction,
        error: err.message,
      };
      return this.returnValue(errPayload, errPayload);
    }
  }
}

module.exports = WappyNotebookLM;
