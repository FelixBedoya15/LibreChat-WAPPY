const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'api/server/routes/sgsst');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'sgsstGemini.js' && f !== 'reportHeader.js' && f !== 'index.js');
let fixed = 0;
for (const file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    if (content.includes('generateWithKeyRotation') && !content.includes("require('./sgsstGemini')")) {
        // Insert after first require
        content = content.replace(/(const .*?require.*?;\n)/, "$1const { generateWithKeyRotation } = require('./sgsstGemini');\n");
        fs.writeFileSync(p, content);
        console.log('Fixed', file);
        fixed++;
    }
}
console.log('Total fixed:', fixed);
