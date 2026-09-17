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

// Asegurar que getDefaultRanking incluya index
cjs = cjs.replace(
  /\.map\(\(doc\)\s*=>\s*\(\{\s*text:\s*doc,\s*score:\s*0\s*\}\)\);/g,
  '.map((doc, index) => ({ text: doc, score: 0, index }));'
);

const teiRerankLogicCjs = `        try {
            if (this.apiKey == null || this.apiKey === '') {
                this.logger.warn('JINA_API_KEY is not set. Using default ranking.');
                return this.getDefaultRanking(documents, topK);
            }
            const isTEI = !this.apiUrl.includes('jina.ai');
            let targetUrl = this.apiUrl;
            if (targetUrl.includes('://reranker')) {
                targetUrl = targetUrl.replace('://reranker', '://librechat-reranker-d58plj');
            }
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

const cjsTryPattern = /try\s*\{\s*if\s*\(!?this\.apiKey[\s\S]*?catch\s*\(error\)\s*\{\s*this\.logger\.error\('Error using (?:Jina )?reranker:',\s*error\);[\s\S]*?return this\.getDefaultRanking\(documents,\s*topK\);\s*\}/;

if (cjsTryPattern.test(cjs)) {
  cjs = cjs.replace(cjsTryPattern, teiRerankLogicCjs.trim());
}

// Forzar a createReranker a usar siempre el Reranker local TEI
const createRerankerPattern = /const createReranker = \(config\) => \{[\s\S]*?return new JinaReranker\(\{ apiKey: [^}]+ \}\);\s*(?:\}\s*\};|\};)/;
const customCreateReranker = `const createReranker = (config) => {
    const { jinaApiKey, jinaApiUrl, logger } = config || {};
    const defaultLogger = logger || utils.createDefaultLogger();
    let effectiveUrl = jinaApiUrl || process.env.RERANKER_API_URL || 'http://librechat-reranker-d58plj:80/rerank';
    if (effectiveUrl.includes('://reranker')) {
        effectiveUrl = effectiveUrl.replace('://reranker', '://librechat-reranker-d58plj');
    }
    const effectiveKey = jinaApiKey || process.env.JINA_API_KEY || 'local-dummy-key';
    return new JinaReranker({ apiKey: effectiveKey, apiUrl: effectiveUrl, logger: defaultLogger });
};`;

if (createRerankerPattern.test(cjs)) {
  cjs = cjs.replace(createRerankerPattern, customCreateReranker);
}

fs.writeFileSync(rerankersCjsPath, cjs, 'utf8');
console.log('✓ rerankers.cjs configurado para usar SIEMPRE el Reranker TEI local');

// 2. Parchear search.cjs
const searchCjsPath = path.join(targetDir, 'dist/cjs/tools/search/search.cjs');
let searchCjs = fs.readFileSync(searchCjsPath, 'utf8');

// Eliminar bing y usar estrictamente yandex,wikipedia que entregan fuentes genuinas de Colombia y SST
searchCjs = searchCjs.replace(
  /engines:\s*(?:process\.env\.SEARXNG_ENGINES\s*\|\|\s*)?'[^']+'/g,
  "engines: process.env.SEARXNG_ENGINES || 'yandex,wikipedia'"
);

// Bloquear dominios de publicidad, spam, Reddit, xvideos, prestamos financieros y bolsas de empleo extranjeras
const blockedDomainsStr = "const blockedDomains = ['corporatefinanceinstitute.com', 'gao.gov', 'doordash.com', 'clipchamp.com', 'intervalworld.com', 'aol.com', 'microsoft.com', 'doubleclick.net', 'googleadservices.com', 'vineyardvines.com', 'zhihu.com', 'arbetsformedlingen.se', 'ledigajobb.se', 'healthgrades.com', 'vitadox.com', 'orthopedic.io', 'meudanfe.com.br', 'softonic.com', 'droidcam.com', 'capterra.com', 'g2.com', 'trustpilot.com', 'pinterest.com', 'anu.edu.au', '.edu.au', 'reddit.com', 'redd.it', 'everfulwholesale.com', 'towelsupercenter.com', 'xvideos.com', 'xvideos'];";
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

// Desactivar scraping profundo por defecto para evitar timeouts de 7.5s, errores 403 y 429
if (!searchCjs.includes("ENABLE_DEEP_SCRAPING !== 'true'")) {
  searchCjs = searchCjs.replace(
    'const fetchContents = async ({ links, query, target, onGetHighlights, onContentScraped, }) => {',
    `const fetchContents = async ({ links, query, target, onGetHighlights, onContentScraped, }) => {
        if (process.env.ENABLE_DEEP_SCRAPING !== 'true') {
            return;
        }`
  );
}

// Filtrar enlaces a archivos PDF para evitar timeouts de scraping y sobrecarga de tokens
if (!searchCjs.includes("r.url.toLowerCase().includes('.pdf')")) {
  searchCjs = searchCjs.replace(
    "if (!r.url || !r.title) return false;",
    "if (!r.url || !r.title) return false;\n                if (r.url.toLowerCase().includes('.pdf')) return false;"
  );
}

// Agregar o actualizar pre-reranking de resultados orgánicos y corte estricto al top numElements
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
                        const targetLimit = Math.min(reordered.length, numElements || 5);
                        result.data.organic = reordered.slice(0, targetLimit);
                    }
                } catch (e) {
                    logger_.warn('Error pre-ranking organic search results:', e);
                }
            } else if (result.data.organic && result.data.organic.length > (numElements || 5)) {
                result.data.organic = result.data.organic.slice(0, numElements || 5);
            }
            const sourceMap = new Map();`;

// Si ya existía una versión anterior de pre-ranking, reemplazarla limpiamente
const existingPreRankPattern = /if\s*\(reranker\s*&&[\s\S]*?const sourceMap = new Map\(\);/;
if (existingPreRankPattern.test(searchCjs)) {
  searchCjs = searchCjs.replace(existingPreRankPattern, organicPreRankCjs.trim());
} else if (searchCjs.includes('const sourceMap = new Map();')) {
  searchCjs = searchCjs.replace('const sourceMap = new Map();', organicPreRankCjs);
}

// Garantizar que antes de salir de processSources la lista esté limitada al top numElements
searchCjs = searchCjs.replace(
  /updateSourcesWithContent\(topStories,\s*sourceMap\);\s*\}\s*return result\.data;/g,
  `updateSourcesWithContent(topStories, sourceMap);
            }
            if (result.data && Array.isArray(result.data.organic) && result.data.organic.length > (numElements || 5)) {
                result.data.organic = result.data.organic.slice(0, numElements || 5);
            }
            return result.data;`
);

// Guardar SIEMPRE search.cjs
fs.writeFileSync(searchCjsPath, searchCjs, 'utf8');
console.log('✓ search.cjs parcheado con motores limpios (yandex,wikipedia), dominios bloqueados y corte al top 5');

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
