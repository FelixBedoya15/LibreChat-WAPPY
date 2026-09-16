// Wrapper para ejecutar api/scripts/patch-reranker-tei.js
const path = require('path');
const scriptPath = path.resolve(__dirname, '../api/scripts/patch-reranker-tei.js');
require(scriptPath);
