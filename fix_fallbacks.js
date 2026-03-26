const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'api/server/routes/sgsst');
const oldFallbacksRegex = /const fallbacks = \[\s*'gemini-1\.5-pro-latest',\s*'gemini-1\.5-pro',\s*'gemini-1\.5-flash',\s*'gemini-1\.5-pro-lite'\s*\];/g;
const newFallbacks = `const fallbacks = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
    ];`;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
let modified = 0;
for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (oldFallbacksRegex.test(content)) {
    content = content.replace(oldFallbacksRegex, newFallbacks);
    fs.writeFileSync(filePath, content, 'utf8');
    modified++;
  }
}
console.log(`Modified ${modified} files.`);
