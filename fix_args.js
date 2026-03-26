const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'api/server/routes/sgsst');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !['sgsstGemini.js', 'index.js', 'reportHeader.js'].includes(f));

let fixed = 0;
for (const file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    let changed = false;

    // Remove getAllApiKeys explicit calls
    if (content.match(/const apiKeys = await getAllApiKeys.*?\n/)) {
        content = content.replace(/const apiKeys = await getAllApiKeys.*?\n/g, "");
        changed = true;
    }

    // Fix `generateWithKeyRotation(finalModelName, apiKeys, promptText)` -> `generateWithKeyRotation({ model: finalModelName }, req.user?.id || req.user, promptText)`
    if (content.includes("generateWithKeyRotation(finalModelName, apiKeys, promptText)")) {
        content = content.replace(/generateWithKeyRotation\(finalModelName,\s*apiKeys,\s*promptText\)/g, "generateWithKeyRotation({ model: finalModelName }, req.user?.id || req.user, promptText)");
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(p, content);
        console.log('Fixed args in', file);
        fixed++;
    }
}
console.log('Total args fixed:', fixed);
