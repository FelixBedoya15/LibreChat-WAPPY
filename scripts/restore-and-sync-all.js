// Wrapper para ejecutar api/scripts/restore-and-sync-all.js
const path = require('path');
const scriptPath = path.resolve(__dirname, '../api/scripts/restore-and-sync-all.js');
require(scriptPath);
