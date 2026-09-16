const fs = require('fs');
const path = require('path');

console.log('=== Inicia parche para HuggingFace TEI Reranker y Busqueda Limpia ===');

const baseDirs = [
  path.resolve(__dirname, '../../node_modules/@librechat/agents'),
  path.resolve(__dirname, '../node_modules/@librechat/agents'),
  '/app/node_modules/@librechat/agents',
];

let targetDir = null;
for (const dir of baseDirs) {
  if (fs.existsSync(path.join(dir, 'dist/cjs/tools/search/rerankers.cjs'))) {
    targetDir = dir;
    break;
  }
}

if (!targetDir) {
  console.error('No se encontro el directorio de @librechat/agents');
  process.exit(1);
}

console.log('Directorio encontrado:', targetDir);

// 1. Parchear rerankers.cjs
const rerankersCjsPath = path.join(targetDir, 'dist/cjs/tools/search/rerankers.cjs');
let cjs = fs.readFileSync(rerankersCjsPath, 'utf8');

const teiRerankLogicCjs = `        try {
            if (this.apiKey == null || this.apiKey === '') {
                this.logger.warn('JINA_API_KEY is not set. Using default ranking.');
                return this.getDefaultRanking(documents, topK);
            }
            const isTEI = !this.apiUrl.includes('jina.ai');
            let targetUrl = this.apiUrl;
            if (isTEI && targetUrl.endsWith('/v1/rerank')) {
                targetUrl = targetUrl.replace(/\\/v1\\/rerank$/, '/rerank');
            }
            const headers = { 'Content-Type': 'application/json' };
            if (this.apiKey && this.apiKey !== 'local-dummy-key') {
                headers['Authorization'] = 'Bearer ' + this.apiKey;
            }
            let requestData;
            if (isTEI) {
                requestData = {
                    query: query,
                    texts: documents,
                    raw_scores: false,
                    return_text: false,
                };
            } else {
                requestData = {
                    model: 'jina-reranker-v2-base-multilingual',
                    query: query,
                    top_n: topK,
                    documents: documents,
                    return_documents: true,
                };
            }
            const response = await axios.post(targetUrl, requestData, { headers });
            if (Array.isArray(response.data)) {
                const sorted = [...response.data]
                    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                    .slice(0, topK);
                return sorted.map((res) => {
                    const docIndex = res.index;
                    const score = res.score ?? 0;
                    const text = documents[docIndex] ?? '';
                    return { text, score, index: docIndex };
                });
            } else if (response.data && response.data.results && response.data.results.length) {
                return response.data.results.map((result) => {
                    const docIndex = result.index;
                    const score = result.relevance_score;
                    let text = '';
                    if (result.document != null) {
                        const doc = result.document;
                        if (typeof doc === 'object' && 'text' in doc) {
                            text = doc.text;
                        } else if (typeof doc === 'string') {
                            text = doc;
                        }
                    } else {
                        text = documents[docIndex];
                    }
                    return { text, score, index: docIndex };
                });
            } else {
                this.logger.warn('Unexpected response format from reranker. Using default ranking.');
                return this.getDefaultRanking(documents, topK);
            }
        } catch (error) {
            this.logger.error('Error using reranker:', error);
            return this.getDefaultRanking(documents, topK);
        }`;

const cjsTryPattern = /try\s*\{\s*if\s*\(!?this\.apiKey[\s\S]*?catch\s*\(error\)\s*\{\s*this\.logger\.error\('Error using Jina reranker:',\s*error\);[\s\S]*?return this\.getDefaultRanking\(documents,\s*topK\);\s*\}/;

if (cjsTryPattern.test(cjs)) {
  cjs = cjs.replace(cjsTryPattern, teiRerankLogicCjs.trim());
  fs.writeFileSync(rerankersCjsPath, cjs, 'utf8');
  console.log('✓ rerankers.cjs parcheado con soporte nativo para TEI y Jina');
} else {
  console.log('! Advertencia: patron no coincidio en rerankers.cjs o ya fue parcheado');
}

// 2. Parchear search.cjs (motores limpios, bloqueo de publicidad, pre-reranking de resultados)
const searchCjsPath = path.join(targetDir, 'dist/cjs/tools/search/search.cjs');
let searchCjs = fs.readFileSync(searchCjsPath, 'utf8');

// Eliminar bing/yandex basura de otros paises y usar yandex,wikipedia que devuelven resultados de Colombia
searchCjs = searchCjs.replace(
  /engines:\s*process\.env\.SEARXNG_ENGINES\s*\|\|\s*'[^']+'/g,
  "engines: process.env.SEARXNG_ENGINES || 'yandex,wikipedia'"
);

// Actualizar lista de dominios bloqueados (DoorDash, Clipchamp, Interval, AOL, publicidad, etc.)
const blockedDomainsStr = "const blockedDomains = ['doordash.com', 'clipchamp.com', 'intervalworld.com', 'aol.com', 'microsoft.com', 'doubleclick.net', 'googleadservices.com', 'vineyardvines.com', 'zhihu.com', 'arbetsformedlingen.se', 'ledigajobb.se', 'healthgrades.com', 'vitadox.com', 'orthopedic.io', 'meudanfe.com.br'];";
if (searchCjs.includes('blockedDomains = [')) {
  searchCjs = searchCjs.replace(
    /const blockedDomains\s*=\s*\[[^\]]+\];/g,
    blockedDomainsStr
  );
} else {
  searchCjs = searchCjs.replace(
    "const isNewsResult = (result) => {",
    blockedDomainsStr + "\n            const isNewsResult = (result) => {"
  );
}

// Agregar pre-reranking de resultados organicos antes de scrapear
const organicPreRankCjs = `            if (reranker && result.data.organic && result.data.organic.length > 1) {
                try {
                    const searchSnippets = result.data.organic.map((s) => (s.title || '') + '. ' + (s.snippet || ''));
                    const ranked = await reranker.rerank(query, searchSnippets, result.data.organic.length);
                    if (Array.isArray(ranked) && ranked.length > 0) {
                        const reordered = [];
                        const seenIndices = new Set();
                        for (const r of ranked) {
                            if (typeof r.index === 'number' && result.data.organic[r.index] && !seenIndices.has(r.index)) {
                                seenIndices.add(r.index);
                                reordered.push(result.data.organic[r.index]);
                            }
                        }
                        for (let i = 0; i < result.data.organic.length; i++) {
                            if (!seenIndices.has(i)) {
                                reordered.push(result.data.organic[i]);
                            }
                        }
                        result.data.organic = reordered;
                    }
                } catch (e) {
                    logger_.warn('Error pre-ranking organic search results:', e);
                }
            }
            const sourceMap = new Map();`;

if (!searchCjs.includes('searchSnippets')) {
  searchCjs = searchCjs.replace('const sourceMap = new Map();', organicPreRankCjs);
  fs.writeFileSync(searchCjsPath, searchCjs, 'utf8');
  console.log('✓ search.cjs parcheado con motores limpios, dominios bloqueados y pre-reranking');
} else {
  console.log('✓ search.cjs ya tiene pre-reranking');
}

// 3. Parchear tool.cjs para que el modal de Fuentes en la UI solo reciba las fuentes verificadas y pre-clasificadas por el Reranker
const toolCjsPath = path.join(targetDir, 'dist/cjs/tools/search/tool.cjs');
if (fs.existsSync(toolCjsPath)) {
  let toolCjs = fs.readFileSync(toolCjsPath, 'utf8');
  const oldToolPattern = /onSearchResults\?\.(\(searchResult\));\s*const processedSources = await sourceProcessor\.processSources\(\{[\s\S]*?numElements: maxSources,\s*\}\);/;
  if (oldToolPattern.test(toolCjs)) {
    const newToolLogic = `const processedSources = await sourceProcessor.processSources({
                query,
                news,
                result: searchResult,
                proMode,
                onGetHighlights,
                numElements: maxSources,
            });
            onSearchResults?.({ success: true, data: processedSources });`;
    toolCjs = toolCjs.replace(oldToolPattern, newToolLogic);
    fs.writeFileSync(toolCjsPath, toolCjs, 'utf8');
    console.log('✓ tool.cjs parcheado para emitir solo fuentes verificadas y ordenadas por el Reranker a la UI');
  } else {
    console.log('✓ tool.cjs ya estaba actualizado o patron aplicado');
  }
}

console.log('=== Parche completado exitosamente ===');
