const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const axios = require('axios');
const logger = console;

/**
 * WebSearch Tool
 * Permite buscar información en Internet y en la web en tiempo real
 * utilizando el motor SearXNG integrado en LibreChat-WAPPY (el mismo que usan los agentes).
 */
class WebSearch extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'web_search';
    this.description =
      'Busca información actualizada en tiempo real en Internet (noticias, normatividad SST, decretos, resoluciones, estadísticas, documentación técnica, etc.). Utiliza el motor de búsqueda avanzado de WAPPY.';
    this.req = fields.req;

    this.schema = z.object({
      query: z
        .string()
        .describe(
          'La consulta de búsqueda a ejecutar en internet. Sé específico e incluye términos clave relevantes (ej: "Resolución 0312 de 2019 Colombia Mintrabajo").',
        ),
    });
  }

  async _call(input, _runManager) {
    const query = typeof input === 'string' ? input : input?.query;
    if (!query || !query.trim()) {
      return 'Error: La consulta de búsqueda no puede estar vacía.';
    }

    const cleanQuery = query.trim();
    logger.info(`[WebSearch Tool] Ejecutando búsqueda web: "${cleanQuery}"`);

    try {
      let rawBaseUrl = process.env.SEARXNG_INSTANCE_URL || 'https://searxng.wappy.club/search';
      let searchUrl = rawBaseUrl.endsWith('/search') ? rawBaseUrl : `${rawBaseUrl.replace(/\/+$/, '')}/search`;

      const engines = process.env.SEARXNG_ENGINES || 'yandex,wikipedia';
      const timeout = parseInt(process.env.SEARXNG_TIMEOUT || '10000', 10);

      const params = {
        q: cleanQuery,
        format: 'json',
        categories: 'general',
        safesearch: 0,
        engines,
      };

      const headers = {
        'Content-Type': 'application/json',
      };

      if (process.env.SEARXNG_API_KEY) {
        headers['X-API-Key'] = process.env.SEARXNG_API_KEY;
      }

      const response = await axios.get(searchUrl, {
        headers,
        params,
        timeout,
      });

      const data = response.data;
      const rawResults = Array.isArray(data?.results) ? data.results : [];

      // Filtrar resultados inválidos y excluir PDFs pesados para optimizar el contexto
      const validResults = rawResults.filter((r) => {
        if (!r.url || !r.title) return false;
        if (r.url.toLowerCase().endsWith('.pdf')) return false;
        return true;
      });

      if (validResults.length === 0) {
        return `No se encontraron resultados en la web para la consulta: "${cleanQuery}".`;
      }

      const topResults = validResults.slice(0, 6);
      const formattedLines = [`### 🌐 Resultados de búsqueda web para: "${cleanQuery}"\n`];

      topResults.forEach((res, index) => {
        const title = (res.title || 'Sin título').trim();
        const url = (res.url || '').trim();
        const snippet = (res.content || res.snippet || '').trim().replace(/\s+/g, ' ');
        const date = res.publishedDate ? ` *(Publicado: ${res.publishedDate})*` : '';

        formattedLines.push(`${index + 1}. **[${title}](${url})**${date}`);
        if (snippet) {
          formattedLines.push(`   > ${snippet}`);
        }
        formattedLines.push('');
      });

      return formattedLines.join('\n').trim();
    } catch (error) {
      logger.error(`[WebSearch Tool] Error ejecutando búsqueda para "${cleanQuery}":`, error.message);
      return `No fue posible completar la búsqueda web para "${cleanQuery}": ${error.message}.`;
    }
  }
}

module.exports = WebSearch;
