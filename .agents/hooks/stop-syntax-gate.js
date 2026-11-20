#!/usr/bin/env node
'use strict';

/**
 * WAPPY IA — Antigravity Stop Syntax Gate (`node --check`)
 *
 * When a turn ends normally (`NO_TOOL_CALL`, `fullyIdle !== false`), runs
 * deterministic `node --check` on every `.js`/`.cjs`/`.mjs` file modified in this
 * conversation under `api/`, `bin/`, `scripts/`, or `.agents/`.
 *
 * Anti-loop protection:
 *  - Only forces continuation (`decision: "continue"`) on REAL syntax errors.
 *  - Tracks error fingerprints and caps forced continuations to 2 per conversation.
 *  - Clears passed files from state so clean files are never re-checked unnecessarily.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

function allow() {
  process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
}

function forceContinue(reason) {
  process.stdout.write(JSON.stringify({ decision: 'continue', reason }) + '\n');
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

function isCheckableTarget(absFile, workspaceRoot) {
  const rel = path.relative(workspaceRoot, absFile).replace(/\\/g, '/');
  if (rel.startsWith('..') || path.isAbsolute(rel)) return false;
  if (!/\.(?:js|cjs|mjs)$/.test(rel)) return false;
  // Check backend, bin, scripts, and .agents hooks/scripts (skip client ESM bundles handled by Vite)
  return /^(?:api|bin|scripts|\.agents)\//.test(rel);
}

async function main() {
  if (process.env.WAPPY_HOOKS_DISABLED === '1' || process.env.WAPPY_HOOKS_DRY_RUN === '1') {
    allow();
    return;
  }

  const raw = await readStdin();
  if (!raw.trim()) {
    allow();
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    allow();
    return;
  }

  // Only gate clean turn completions when background tasks are idle
  if (payload.terminationReason && payload.terminationReason !== 'NO_TOOL_CALL') {
    allow();
    return;
  }
  if (payload.fullyIdle === false) {
    allow();
    return;
  }

  const stateFile = getStateFile(payload.conversationId);
  if (!fs.existsSync(stateFile)) {
    allow();
    return;
  }

  let state;
  try {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    allow();
    return;
  }

  const files = Array.isArray(state.files) ? state.files : [];
  if (files.length === 0) {
    allow();
    return;
  }

  const workspaceRoot =
    Array.isArray(payload.workspacePaths) && payload.workspacePaths.length > 0
      ? payload.workspacePaths[0]
      : path.resolve(__dirname, '../..');

  const errors = [];
  const stillFailing = [];

  for (const absFile of files) {
    if (!fs.existsSync(absFile)) continue;
    if (!isCheckableTarget(absFile, workspaceRoot)) continue;

    try {
      execFileSync(process.execPath, ['--check', absFile], {
        encoding: 'utf8',
        timeout: 4000,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      const rel = path.relative(workspaceRoot, absFile).replace(/\\/g, '/');
      const stderr = String(err.stderr || err.message || 'SyntaxError')
        .split('\n')
        .slice(0, 4)
        .join(' | ')
        .trim();
      errors.push(`${rel}: ${stderr}`);
      stillFailing.push(absFile);
    }
  }

  state.files = stillFailing;
  state.reportedFingerprints = Array.isArray(state.reportedFingerprints)
    ? state.reportedFingerprints
    : [];

  if (errors.length === 0) {
    try {
      fs.writeFileSync(stateFile, JSON.stringify(state), 'utf8');
    } catch {
      // Non-fatal
    }
    allow();
    return;
  }

  const fingerprint = crypto.createHash('sha1').update(errors.join('\n')).digest('hex').slice(0, 12);
  const alreadyReported = state.reportedFingerprints.includes(fingerprint);
  const hitCap = state.reportedFingerprints.length >= 2;

  if (alreadyReported || hitCap) {
    allow();
    return;
  }

  state.reportedFingerprints.push(fingerprint);
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state), 'utf8');
  } catch {
    // Non-fatal
  }

  forceContinue(
    `Guardrail WAPPY (\`node --check\` automático): se detectaron errores de sintaxis en archivos modificados. Corrígelos antes de concluir:\n- ${errors.join('\n- ')}`
  );
}

main().catch(() => allow());
