const fs = require('fs');
const p = require('path');

const filesToPatch = [
  p.join('node_modules', '@librechat', 'agents', 'dist', 'cjs', 'llm', 'google', 'utils', 'common.cjs'),
  p.join('node_modules', '@librechat', 'agents', 'dist', 'esm', 'llm', 'google', 'utils', 'common.mjs')
];

let patchedCount = 0;

filesToPatch.forEach(f => {
  if (!fs.existsSync(f)) {
    console.log('[patch] skipping missing file:', f);
    return;
  }

  let c = fs.readFileSync(f, 'utf8');
  let patched = false;

  const CJS = f.endsWith('.cjs');
  const chatGenerationChunkNode = CJS ? 'outputs.ChatGenerationChunk' : 'ChatGenerationChunk';

  const WRONG1 = `        response.candidates[0]?.finishReason === 'MAX_TOKENS' ||
        response.candidates[0]?.finishReason === 'SAFETY';
    return new ${chatGenerationChunkNode}({`;

  const CORRECT1 = `        response.candidates[0]?.finishReason === 'MAX_TOKENS' ||
        response.candidates[0]?.finishReason === 'SAFETY';
    if (candidateContent?.parts && Array.isArray(candidateContent.parts)) {
        additional_kwargs.signatures = candidateContent.parts.map(p => p.thoughtSignature ?? '');
    }
    return new ${chatGenerationChunkNode}({`;

  const WRONG2 = `    if (messages.isAIMessage(message) && message.tool_calls?.length != null) {
        functionCalls = message.tool_calls.map((tc) => {
            return {
                functionCall: {
                    name: tc.name,
                    args: tc.args,
                },
            };
        });
    }`;

  const CORRECT2 = `    if (messages.isAIMessage(message) && message.tool_calls?.length != null) {
        const signatures = (message.additional_kwargs && message.additional_kwargs.signatures) || [];
        const nonEmptySigs = signatures.filter(s => typeof s === 'string' && s.length > 0);
        functionCalls = message.tool_calls.map((tc, i) => {
            const functionCall = {
                name: tc.name,
                args: tc.args,
            };
            if (nonEmptySigs[i]) {
                functionCall.thoughtSignature = nonEmptySigs[i];
            }
            return { functionCall };
        });
    }`;

  // Clean old patch 1
  const oldPatch2 = `const functionCall = { name: tc.name, args: tc.args };
            // Gemini 3 requires thought_signature to be echoed back with function calls
            // Signatures are stored in additional_kwargs.signatures by @langchain/google-common
            const sigs = (message.additional_kwargs && message.additional_kwargs.signatures) || [];
            const nonEmpty = sigs.filter(s => s && s.length > 0);
            if (nonEmpty[i]) functionCall.thoughtSignature = nonEmpty[i];
            return { functionCall };`;

  if (c.includes(oldPatch2)) {
    console.log('[patch] found old patch 2, reverting first:', f);
    c = c.replace(`functionCalls = message.tool_calls.map((tc, i) => {
            ${oldPatch2}
        });`, `functionCalls = message.tool_calls.map((tc) => {
            return {
                functionCall: {
                    name: tc.name,
                    args: tc.args,
                },
            };
        });`);
  }

  // Loc 1
  if (c.includes('additional_kwargs.signatures = candidateContent.parts')) {
    console.log('[patch] Loc 1 already applied:', f);
  } else if (c.includes(WRONG1)) {
    c = c.split(WRONG1).join(CORRECT1);
    patched = true;
    console.log('[patch] Applied Loc 1:', f);
  } else {
    // maybe we can do regex replacement if spacing is different
    const match = c.match(/response\.candidates\[0\]\?\.finishReason === 'SAFETY';\n\s*return new [a-zA-Z.]+ChatGenerationChunk\(\{/);
    if (match) {
      c = c.replace(match[0], `response.candidates[0]?.finishReason === 'SAFETY';\n    if (candidateContent?.parts && Array.isArray(candidateContent.parts)) {\n        additional_kwargs.signatures = candidateContent.parts.map(p => p.thoughtSignature ?? '');\n    }\n    return new ${chatGenerationChunkNode}({`);
      patched = true;
      console.log('[patch] Applied Loc 1 via regex:', f);
    } else {
      console.warn('[patch] Warning: Loc 1 target not found in', f);
    }
  }

  // Loc 2
  if (c.includes('nonEmptySigs[i]')) {
    console.log('[patch] Loc 2 already applied:', f);
  } else if (c.includes(WRONG2)) {
    c = c.split(WRONG2).join(CORRECT2);
    patched = true;
    console.log('[patch] Applied Loc 2:', f);
  } else {
    // Regex for loc 2
    const regex2 = /if \(.*\.isAIMessage\(message\) && message\.tool_calls\?\.length != null\) {\s+functionCalls = message\.tool_calls\.map\(\(tc\) => {\s+return {\s+functionCall: {\s+name: tc\.name,\s+args: tc\.args,\s+},\s+};\s+}\);\s+}/;
    const match2 = c.match(regex2);
    if (match2) {
      c = c.replace(regex2, CORRECT2);
      patched = true;
      console.log('[patch] Applied Loc 2 via regex:', f);
    } else {
      console.warn('[patch] Warning: Loc 2 target not found in', f);
    }
  }

  if (patched) {
    fs.writeFileSync(f, c);
    patchedCount++;
  }
});

console.log(`[patch] Successfully patched ${patchedCount} files.`);
