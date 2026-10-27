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
    logger.info(`[WebSearch Tool] Ejecutando búsqueda híbrida (Base Normativa WAPPY + Web SearXNG): "${cleanQuery}"`);

    // 1. Consultar en paralelo la Base de Datos Normativa y Técnica interna de WAPPY (99+ documentos .md + Vademécum 2026)
    let internalNormativeBlock = '';
    try {
      const { searchNormativeKnowledgeBase } = require('../../../../server/routes/voice/tenshiOpenBotEngine');
      const ragHit = await searchNormativeKnowledgeBase(cleanQuery, 3);
      if (ragHit && ragHit.exito && ragHit.textoFormateado) {
        internalNormativeBlock = `### 📚 Base de Datos Normativa y Técnica Oficial de WAPPY (Documentos Verificados):\n${ragHit.textoFormateado}\n\n`;
      }
    } catch (_ragErr) {
      // No bloquear si el motor local no está disponible
    }

    // 2. Consultar SearXNG (priorizando red interna Docker de baja latencia + fallback externo)
    const rawConfiguredUrl = process.env.SEARXNG_INSTANCE_URL || 'https://searxng.wappy.club/search';
    const configuredSearchUrl = rawConfiguredUrl.endsWith('/search')
      ? rawConfiguredUrl
      : `${rawConfiguredUrl.replace(/\/+$/, '')}/search`;

    const candidateUrls = [
      'http://librechat-searxng-srgfss-searxng-1:8080/search',
      configuredSearchUrl,
    ].filter((u, idx, arr) => u && arr.indexOf(u) === idx);

    const engines = process.env.SEARXNG_ENGINES || 'yandex,wikipedia';
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.SEARXNG_API_KEY) {
      headers['X-API-Key'] = process.env.SEARXNG_API_KEY;
    }

    let rawResults = [];
    let lastError = null;

    for (const searchUrl of candidateUrls) {
      try {
        const response = await axios.get(searchUrl, {
          headers,
          params: {
            q: cleanQuery,
            format: 'json',
            categories: 'general',
            safesearch: 0,
            engines,
          },
          timeout: 5500,
        });
        const data = response.data;
        if (Array.isArray(data?.results) && data.results.length > 0) {
          rawResults = data.results;
          break;
        }
      } catch (err) {
        lastError = err;
        logger.warn(`[WebSearch Tool] Intento fallido en ${searchUrl}: ${err.message}`);
      }
    }

    // Filtrar resultados inválidos y excluir PDFs pesados para optimizar el contexto
    const validResults = rawResults.filter((r) => {
      if (!r.url || !r.title) return false;
      if (r.url.toLowerCase().endsWith('.pdf')) return false;
      return true;
    });

    if (validResults.length === 0) {
      if (internalNormativeBlock) {
        return `${internalNormativeBlock}*(Nota: Se respondió con la Base de Datos Normativa Oficial de WAPPY).*`;
      }
      if (lastError) {
        logger.error(`[WebSearch Tool] Error ejecutando búsqueda para "${cleanQuery}":`, lastError.message);
      }
      return `No se encontraron resultados externos en la web para la consulta: "${cleanQuery}".`;
    }

    const topResults = validResults.slice(0, 6);
    const formattedLines = [`${internalNormativeBlock}### 🌐 Resultados de búsqueda web en vivo para: "${cleanQuery}"\n`];

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
  }
}

module.exports = WebSearch;
