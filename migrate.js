const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'api/server/routes/sgsst');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'sgsstGemini.js' && f !== 'reportHeader.js');

let summary = [];
let missed = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Remove ONLY the definitions, keep getApiKey to not break genAI initialization
  content = content.replace(/\/\/\s*[─-]+\s*HELPER[^─]*[─]+\s*async function generateWithRetry[\s\S]*?\n\}\n?\n?/g, () => { changed=true; return ''; });
  content = content.replace(/async function generateWithRetry[\s\S]*?\n\}\n?\n?/g, () => { changed=true; return ''; });
  
  // 2. Add import
  const importStr = `const { generateWithKeyRotation } = require('./sgsstGemini');\n`;
  if (!content.includes('generateWithKeyRotation')) {
      content = content.replace(/(const .+ = require\([^)]+\);\n)(?!.*require)/s, (m) => m + importStr);
      changed = true;
  }

  // 3. Replace call site arguments:
  // Before: generateWithRetry(model, resolvedApiKey, promptText)
  // After: generateWithKeyRotation(model, req.user?.id || req.user || userId, promptText)
  
  // In `predictivo.js`, user id is in `userId` variable sometimes, but `req.user.id` is always available since it requires requireJwtAuth. Wait, `predictivo.js` defines `userId = req.user.id`. Passing `req.user.id` is safe.
  
  content = content.replace(/generateWithRetry\(([^,]+),\s*([^,]+),\s*/g, (match, p1, p2) => {
      changed = true;
      return `generateWithKeyRotation(${p1}, req.user?.id || req.user, `;
  });

  if (content.includes('generateWithRetry(')) {
      missed.push(file);
      changed = false;
  } else if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      summary.push(file);
  }
}

console.log('Fixed:', summary.length);
if (missed.length) console.log('MISSED CALLS IN:', missed.join(', '));
