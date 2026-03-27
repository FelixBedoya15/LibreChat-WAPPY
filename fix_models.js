const fs = require('fs');
const path = require('path');

const dir = 'client/src/components/SGSST';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes("'gemini-2.0-flash'")) {
    content = content.replace(/'gemini-2.0-flash'/g, "user?.personalization?.geminiModels?.sstManagement || 'gemini-3.1-flash-lite-preview'");
    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  } else if (content.includes("|| 'gemini-2.5-flash'")) { // For the one I modified previously
    content = content.replace(/\|\| 'gemini-2.5-flash'/g, "|| 'gemini-3.1-flash-lite-preview'");
    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  }
}
