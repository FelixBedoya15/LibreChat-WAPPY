#!/usr/bin/env node
'use strict';

/**
 * WAPPY IA — Antigravity PostToolUse Modified-File Tracker
 *
 * Records successfully edited/written workspace files per conversationId into a
 * lightweight `/tmp` state file so `stop-syntax-gate.js` can run deterministic
 * `node --check` validation ONLY on touched JS files before the agent finishes.
 *
 * Contract: Antigravity PostToolUse MUST output `{}` on stdout.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

function done() {
  process.stdout.write('{}\n');
}

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    const timer = setTimeout(() => resolve(''), 2000);
    process.stdin.on('data', (c) => chunks.push(c));
    process.stdin.once('error', () => {
      clearTimeout(timer);
      resolve('');
    });
    process.stdin.once('end', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });
}

function getStateFile(conversationId) {
  const safeId = String(conversationId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  return path.join(os.tmpdir(), `wappy-agy-session-${safeId}.json`);
}

async function main() {
  if (process.env.WAPPY_HOOKS_DISABLED === '1' || process.env.WAPPY_HOOKS_DRY_RUN === '1') {
    done();
    return;
  }

  const raw = await readStdin();
  if (!raw.trim()) {
    done();
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    done();
    return;
  }

  if (payload.error) {
    done();
    return;
  }

  const toolCall = payload.toolCall || {};
  const args = toolCall.args || {};
  const filePath = String(args.Path || args.path || args.TargetFile || args.file_path || '').trim();
  if (!filePath || !/\.(?:js|cjs|mjs)$/.test(filePath)) {
    done();
    return;
  }

  const stateFile = getStateFile(payload.conversationId);
  let state = { files: [], reportedFingerprints: [] };
  try {
    if (fs.existsSync(stateFile)) {
      const parsed = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      if (parsed && Array.isArray(parsed.files)) state = parsed;
    }
  } catch {
    state = { files: [], reportedFingerprints: [] };
  }

  const absPath = path.resolve(filePath);
  if (!state.files.includes(absPath)) {
    state.files.push(absPath);
    if (state.files.length > 100) state.files = state.files.slice(-100);
  }
  state.updatedAt = Date.now();

  try {
    fs.writeFileSync(stateFile, JSON.stringify(state), 'utf8');
  } catch {
    // Non-fatal
  }

  done();
}

main().catch(() => done());
