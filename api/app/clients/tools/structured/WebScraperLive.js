const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');

function summarizeEvidenceEntry(ev = {}) {
  return {
    url: ev.url || '',
    title: ev.title || '',
    contentHash: ev.contentHash || '',
    hasPdf: Boolean(ev.pdfBase64),
    pdfFileName: ev.pdfFileName || null,
    pdfSizeBytes: ev.pdfBase64 ? Buffer.byteLength(String(ev.pdfBase64), 'base64') : 0,
    hasImage: Boolean(ev.imageBase64),
    imageFileName: ev.imageFileName || null,
    hasScreenshot: Boolean(ev.screenshotBase64 || ev.imageBase64),
  };
}

class WebScraperLive extends Tool {
  static lc_name() {
    return 'web_scraper_live';
  }

  constructor(fields = {}) {
    super();

    this.userId = fields.userId || fields.req?.user?.id || null;
    this.companyId = fields.companyId || fields.req?.companyId || fields.req?.body?.companyId || null;
    this.req = fields.req;
    this.isAgent = fields.isAgent ?? true;

    this.name = 'web_scraper_live';
    this.description =
      'Extrae contenido web en vivo desde hasta 5 URLs simultáneas (soporta páginas dinámicas SPA con Chromium/Playwright o fetch + cheerio, selectores CSS personalizados en scriptCode, enlaces relevantes, huella SHA-256 contentHash y evidencias PDF/PNG). Compatible con nodos tool_web_scraping_agy, extract_web_scraping_agy y scraper_node_antigravity.';

    this.schema = z.object({
      urls: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .describe(
          'URL o lista de hasta 5 URLs http/https separadas por comas o saltos de línea (o arreglo de URLs).',
        ),
      url: z
        .string()
        .optional()
        .describe('Alias opcional para indicar una sola URL objetivo.'),
      scriptEngine: z
        .enum(['auto_chrome_dom', 'fetch_cheerio', 'antigravity_local'])
        .optional()
        .default('auto_chrome_dom')
        .describe(
          'Motor de extracción: "auto_chrome_dom" (DOM renderizado real con fallback fetch+cheerio), "fetch_cheerio" (HTTP rápido + cheerio) o "antigravity_local".',
        ),
      scriptCode: z
        .string()
        .optional()
        .describe(
          'Selectores CSS opcionales (ej. "h1, .norma-titulo, article p" o líneas) o criterio de extracción.',
        ),
      includeEvidence: z
        .boolean()
        .optional()
        .default(true)
        .describe('Si es true, captura evidencia visual en PDF/PNG de las URLs extraídas.'),
    });
  }

  returnValue(val, artifact = {}) {
    const serialized = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
    if (this.isAgent) {
      return [serialized, artifact];
    }
    return serialized;
  }

  async _call(data = {}) {
    const {
      urls,
      url,
      targetUrl,
      scriptEngine = 'auto_chrome_dom',
      scriptCode = '',
      includeEvidence = true,
    } = data || {};

    try {
      const osintWorkerService = require('~/server/services/osintWorkerService');
      const rawRes = await osintWorkerService.ejecutarWebScrapeConEvidencia({
        urls: urls !== undefined ? urls : targetUrl || url || '',
        targetUrl: targetUrl || url || '',
        url: url || '',
        scriptEngine,
        scriptCode,
        includeEvidence,
        userId: this.userId,
        companyId: this.companyId,
      });

      const cleanResults = Array.isArray(rawRes?.results)
        ? rawRes.results.map((r) => ({
            url: r.url,
            ok: Boolean(r.ok),
            status: r.status,
            httpStatus: r.httpStatus,
            engineUsed: r.engineUsed,
            title: r.title,
            headings: Array.isArray(r.headings) ? r.headings : [],
            links: Array.isArray(r.links) ? r.links.slice(0, 15) : [],
            pdfLinks: Array.isArray(r.pdfLinks) ? r.pdfLinks.slice(0, 10) : [],
            selectorMatches: Array.isArray(r.selectorMatches) ? r.selectorMatches : [],
            textExcerpt: r.textExcerpt || '',
            contentHash: r.contentHash || '',
            error: r.error || undefined,
          }))
        : [];

      const cleanEvidences = Array.isArray(rawRes?.evidences)
        ? rawRes.evidences.map(summarizeEvidenceEntry)
        : [];

      const cleanPayload = {
        ok: Boolean(rawRes?.ok),
        status: rawRes?.status || 'warning',
        action: 'web_scrape',
        scriptEngine: rawRes?.scriptEngine || scriptEngine,
        url: rawRes?.url || '',
        urlsProcessed: Number(rawRes?.urlsProcessed || cleanResults.length || 0),
        title: rawRes?.title || '',
        contentHash: rawRes?.contentHash || '',
        results: cleanResults,
        items: Array.isArray(rawRes?.items) ? rawRes.items : [],
        textExcerpt: rawRes?.textExcerpt || '',
        evidences: cleanEvidences,
      };

      return this.returnValue(cleanPayload, rawRes || cleanPayload);
    } catch (err) {
      logger.error('[web_scraper_live] Error ejecutando extracción web:', err);
      const errPayload = {
        ok: false,
        status: 'error',
        action: 'web_scrape',
        results: [],
        evidences: [],
        contentHash: '',
        error: err.message,
      };
      return this.returnValue(errPayload, errPayload);
    }
  }
}

module.exports = WebScraperLive;
