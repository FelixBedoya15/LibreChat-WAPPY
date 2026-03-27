const fs = require('fs');
const path = require('path');

const dir = 'client/src/components/SGSST';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes("user?.personalization?.geminiModels?.sstManagement || user?.personalization?.geminiModels?.sstManagement")) {
    content = content.replace(/user\?\.personalization\?\.geminiModels\?\.sstManagement \|\| user\?\.personalization\?\.geminiModels\?\.sstManagement/g, "user?.personalization?.geminiModels?.sstManagement");
    fs.writeFileSync(filePath, content);
    console.log('Fixed redundant', file);
  }
}
