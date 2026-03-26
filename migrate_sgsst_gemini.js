const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'api/server/routes/sgsst');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'sgsstGemini.js' && f !== 'reportHeader.js');

let summary = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Remove old local generateWithRetry helper
  const oldGenWithRetryPattern1 = /\/\/ ─── HELPER[^─]*[─]+\n(async function generateWithRetry[\s\S]*?\n\}\n?\n?)/g;
  if(oldGenWithRetryPattern1.test(content)) {
      content = content.replace(oldGenWithRetryPattern1, ''); changed = true;
  }
  const oldGenWithRetryPattern2 = /async function generateWithRetry[\s\S]*?\n\}\n?\n?/g;
  if(oldGenWithRetryPattern2.test(content)) {
      content = content.replace(oldGenWithRetryPattern2, ''); changed = true;
  }

  // 2. Remove old local getApiKey helper
  const oldGetApiKeyPattern1 = /\/\/ ─── HELPER[^─]*[─]+\n(async function getApiKey[\s\S]*?\n\}\n?\n?)/g;
  if(oldGetApiKeyPattern1.test(content)) {
      content = content.replace(oldGetApiKeyPattern1, ''); changed = true;
  }
  const oldGetApiKeyPattern2 = /async function getApiKey[\s\S]*?\n\}\n?\n?/g;
  if(oldGetApiKeyPattern2.test(content)) {
      content = content.replace(oldGetApiKeyPattern2, ''); changed = true;
  }

  // 3. Insert new imports at the top
  const sgsstImport = `const { getApiKey, getAllApiKeys, generateWithKeyRotation } = require('./sgsstGemini');\n`;
  if (!content.includes('sgsstGemini')) {
      content = content.replace(/((?:const .+ = require\([^)]+\);\n)+)/, (match) => match + sgsstImport);
      changed = true;
  }

  // 4a. Update call sites type 1 (has `model: finalModelName`)
  const callSiteRegex1 = /const (resolvedApiKey|apiKey) = await getApiKey\(req\.user(?:|\?)?\.id\);\s*\n\s*const genAI = new GoogleGenerativeAI\(\1\);\s*\n\s*const model = genAI\.getGenerativeModel\(\{ model: ([a-zA-Z0-9_]+) \}\);\s*\n\s*\n?\s*const result = await generateWithRetry\(model, \1,/g;
  if(callSiteRegex1.test(content)) {
      content = content.replace(callSiteRegex1, `const apiKeys = await getAllApiKeys(req.user?.id || req.user);
        const result = await generateWithKeyRotation($2, apiKeys,`);
      changed = true;
  }

  // 4b. Update call sites type 2 (has `model: currentModelName`)
  const callSiteRegex2 = /const (resolvedApiKey|apiKey) = await getApiKey\(req\.user(?:|\?)?\.id\);\s*\n\s*const genAI = new GoogleGenerativeAI\(\1\);\s*\n\s*const model = genAI\.getGenerativeModel\(\{ model: ([a-zA-Z0-9_]+) \}\);\s*\n\s*let result;\s*\n\s*result = await generateWithRetry\(model, \1,/g;
  if(callSiteRegex2.test(content)) {
      content = content.replace(callSiteRegex2, `const apiKeys = await getAllApiKeys(req.user?.id || req.user);
        let result;
        result = await generateWithKeyRotation($2, apiKeys,`);
      changed = true;
  }
  
  // 4c. Update specific call sites manually for those that bind custom options
  const callSiteRegex3 = /const (resolvedApiKey|apiKey) = await getApiKey\(req\.user(?:|\?)?\.id\);\s*\n\s*const genAI = new GoogleGenerativeAI\(\1\);\s*\n\s*const model = genAI\.getGenerativeModel\(\{ model: ([a-zA-Z0-9_]+) \}\);\s*\n\s*const result = await generateWithRetry\(model, \1,/g;
  if(callSiteRegex3.test(content)) {
    content = content.replace(callSiteRegex3, `const apiKeys = await getAllApiKeys(req.user?.id || req.user);
        const result = await generateWithKeyRotation($2, apiKeys,`);
    changed = true;
  }

  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    summary.push(file);
  }
}

console.log(`Processed files (${summary.length}):`);
summary.forEach(f => console.log('✓', f));
