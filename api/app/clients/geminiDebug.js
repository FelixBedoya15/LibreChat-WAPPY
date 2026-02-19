const fs = require('fs');
const path = require('path');

const logFile = path.join(process.cwd(), 'gemini_debug_log.txt');

function logGemini(data) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${JSON.stringify(data, null, 2)}\n\n`;
    try {
        fs.appendFileSync(logFile, logEntry);
    } catch (err) {
        console.error('Failed to write to debug log', err);
    }
}

module.exports = logGemini;
