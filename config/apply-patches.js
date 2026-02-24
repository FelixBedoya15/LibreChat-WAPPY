#!/usr/bin/env node
/**
 * apply-patches.js
 * Applies patches to node_modules without requiring patch-package.
 * 
 * Fix: @langchain/google-common thought_signature for Gemini 3 tools
 * See: https://ai.google.dev/gemini-api/docs/thought-signatures
 * 
 * The bug: signatures.length === parts.length fails when Gemini 3 generates
 * fewer parts than signatures (thought parts are excluded when rebuilding history).
 * The fix: use > 0 check with Math.min to safely apply signatures.
 */

const fs = require('fs');
const path = require('path');

const PATCHES = [
    {
        name: '@langchain/google-common gemini.js (ESM)',
        filePath: path.join(__dirname, '..', 'node_modules', '@langchain', 'google-common', 'dist', 'utils', 'gemini.js'),
        find: 'if (signatures.length === parts.length) {\n            for (let co = 0; co < signatures.length; co += 1) {',
        replace: 'if (signatures.length > 0) {\n            for (let co = 0; co < Math.min(signatures.length, parts.length); co += 1) {',
    },
    {
        name: '@langchain/google-common gemini.cjs (CJS)',
        filePath: path.join(__dirname, '..', 'node_modules', '@langchain', 'google-common', 'dist', 'utils', 'gemini.cjs'),
        find: 'if (signatures.length === parts.length) {\n            for (let co = 0; co < signatures.length; co += 1) {',
        replace: 'if (signatures.length > 0) {\n            for (let co = 0; co < Math.min(signatures.length, parts.length); co += 1) {',
    },
];

let anyFailed = false;

for (const patch of PATCHES) {
    if (!fs.existsSync(patch.filePath)) {
        console.log(`[patches] SKIP: ${patch.name} — file not found`);
        continue;
    }

    let content = fs.readFileSync(patch.filePath, 'utf8');

    if (content.includes(patch.replace)) {
        console.log(`[patches] ALREADY APPLIED: ${patch.name}`);
        continue;
    }

    if (!content.includes(patch.find)) {
        console.warn(`[patches] WARNING: ${patch.name} — target string not found (may have changed in a newer version)`);
        anyFailed = true;
        continue;
    }

    content = content.replace(patch.find, patch.replace);
    fs.writeFileSync(patch.filePath, content, 'utf8');
    console.log(`[patches] APPLIED: ${patch.name}`);
}

if (anyFailed) {
    console.warn('[patches] Some patches could not be applied. Check the warnings above.');
    // Don't exit(1) so the build doesn't fail — the app will still work (just maybe not Gemini 3 tools)
}
