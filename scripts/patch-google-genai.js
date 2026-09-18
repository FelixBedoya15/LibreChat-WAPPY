// Wrapper para ejecutar api/scripts/patch-google-genai.js
const path = require('path');
const scriptPath = path.resolve(__dirname, '../api/scripts/patch-google-genai.js');
require(scriptPath);
