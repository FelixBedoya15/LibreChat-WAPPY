#!/usr/bin/env node
'use strict';

/**
 * WAPPY IA — Antigravity PreToolUse Guardrails (Native, Zero-Dependency)
 *
 * Enforces deterministic, high-signal project invariants from AGENTS.md:
 *  1. Blocks `git commit` / `git push` with `--no-verify`.
 *  2. Blocks `git commit` when `client/src/` or `packages/client/` files are staged
 *     without `client/dist/` also staged (Dockerfile.multi does not build client in VPS).
 *  3. Blocks staging/committing secret files (`.env`, `wappy-keys.json`, private keys).
 *  4. Blocks Google Multimodal Live API Error 1011 regressions in `geminiLive.js`/`voiceSession.js`
 *     (`inputAudioTranscription` / `outputAudioTranscription` MUST remain `{}`).
 *  5. Blocks introducing deprecated Gemini model IDs absent from `.env` (`GOOGLE_MODELS`)
 *     in new code edits under `api/`, `packages/`, `client/src/`, `bin/`.
 *  6. Prompts confirmation (`ask`) before wholesale overwrite of `.env` or `wappy-keys.json`.
 *
 * Design: Fail-OPEN on unexpected runtime/parse issues (never deadlocks the workspace),
 * fail-CLOSED (`deny`) ONLY on proven invariant violations.
 * Escape hatches: WAPPY_HOOKS_DISABLED=1 | WAPPY_HOOKS_DRY_RUN=1 | WAPPY_SKIP_DIST_GUARD=1
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function allow() {
  emit({ decision: 'allow' });
}

function deny(reason) {
  emit({ decision: 'deny', reason });
}

function ask(reason) {
  emit({ decision: 'ask', reason });
}

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    let bytes = 0;
    const MAX = 2 * 1024 * 1024;
    const timer = setTimeout(() => resolve(''), 3000);
    process.stdin.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes <= MAX) chunks.push(chunk);
    });
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

function getWorkspaceRoot(payload) {
  if (Array.isArray(payload.workspacePaths) && payload.workspacePaths.length > 0) {
    return payload.workspacePaths[0];
  }
  return path.resolve(__dirname, '../..');
}

function loadAllowedGoogleModels(workspaceRoot) {
  try {
    const envPath = path.join(workspaceRoot, '.env');
    if (!fs.existsSync(envPath)) return new Set();
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^GOOGLE_MODELS=(.*)$/m);
    if (!match) return new Set();
    return new Set(
      match[1]
        .split(',')
        .map((m) => m.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

function checkRunCommand(commandLine, workspaceRoot) {
  const cmd = String(commandLine || '');
  if (!cmd.trim()) return null;

  // 1. Block --no-verify on git commit / git push
  if (/\bgit\s+(?:-[^\s]+\s+)*(commit|push)\b/.test(cmd)) {
    if (/(?:^|\s)--no-verify(?:\s|$)/.test(cmd)) {
      return {
        decision: 'deny',
        reason: 'Guardrail WAPPY: prohibido usar `--no-verify` en git commit/push. Resuelve los checks antes de confirmar.',
      };
    }
  }

  // 2. Block staging sensitive secret files explicitly
  if (/\bgit\s+(?:-[^\s]+\s+)*add\b/.test(cmd)) {
    const secretAddPattern = /(?:^|\s)(?:\.\/)?(?:\.env(?!\.example|\.sample|\.template)(?:\.local|\.prod|\.production)?|wappy-keys\.json|[^\s]*\.(?:pem|p12))(?:\s|$)/;
    if (secretAddPattern.test(cmd)) {
      return {
        decision: 'deny',
        reason: 'Guardrail WAPPY: bloqueado `git add` de archivo sensible (.env / wappy-keys.json / clave privada).',
      };
    }
  }

  // 3. Enforce client/dist build sync on `git commit` (Dockerfile.multi copies client/dist directly)
  const isGitCommit = /\bgit\s+(?:-[^\s]+\s+)*commit\b/.test(cmd) && !/--dry-run/.test(cmd);
  if (isGitCommit && process.env.WAPPY_SKIP_DIST_GUARD !== '1') {
    try {
      const stagedRaw = execFileSync('git', ['diff', '--cached', '--name-only'], {
        cwd: workspaceRoot,
        encoding: 'utf8',
        timeout: 3000,
      });
      const stagedFiles = stagedRaw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      // Block if any secret file ended up staged
      const stagedSecret = stagedFiles.find((f) =>
        /(?:^|\/)\.env(?!\.example|\.sample|\.template)(?:\.local|\.prod|\.production)?$/.test(f) ||
        /(?:^|\/)wappy-keys\.json$/.test(f)
      );
      if (stagedSecret) {
        return {
          decision: 'deny',
          reason: `Guardrail WAPPY: el archivo sensible "${stagedSecret}" está en staging. Quítalo con \`git reset HEAD ${stagedSecret}\` antes de hacer commit.`,
        };
      }

      const hasClientSrc = stagedFiles.some(
        (f) => f.startsWith('client/src/') || f.startsWith('packages/client/')
      );
      const hasClientDist = stagedFiles.some((f) => f.startsWith('client/dist/'));

      if (hasClientSrc && !hasClientDist) {
        return {
          decision: 'deny',
          reason:
            'Guardrail WAPPY (Regla client/dist): hay archivos staged en `client/src/` o `packages/client/` sin `client/dist/` en el commit. Dockerfile.multi NO compila el frontend en Dokploy. Ejecuta `npm run build:client && git add client/dist` antes de hacer commit (o usa WAPPY_SKIP_DIST_GUARD=1 si es solo documentación/tipos sin cambio de bundle).',
        };
      }
    } catch {
      // Fail-open if git cannot be queried
    }
  }

  return null;
}

function checkFileEditOrWrite(toolName, args, workspaceRoot) {
  const filePath = String(args.Path || args.path || args.TargetFile || args.file_path || '');
  if (!filePath) return null;

  const baseName = path.basename(filePath);
  const relPath = path.isAbsolute(filePath)
    ? path.relative(workspaceRoot, filePath).replace(/\\/g, '/')
    : filePath.replace(/\\/g, '/');

  // 4. Ask confirmation before overwriting critical secret files via write_file
  if (
    toolName === 'write_file' &&
    (baseName === '.env' || baseName === 'wappy-keys.json') &&
    args.Overwrite === true
  ) {
    return {
      decision: 'ask',
      reason: `Guardrail WAPPY: confirmando sobrescritura completa de archivo sensible (${baseName}).`,
    };
  }

  const newText = toolName === 'edit_file'
    ? String(args.Replacement || '')
    : String(args.Content || '');
  const oldText = toolName === 'edit_file' ? String(args.Target || '') : '';

  if (!newText) return null;

  // 5. Tenshi Voice Error 1011 shield in geminiLive.js / voiceSession.js
  if (/(?:^|\/)(?:geminiLive|voiceSession)\.[jt]sx?$/.test(relPath)) {
    const nonEmptyTranscription = /(?:inputAudioTranscription|outputAudioTranscription)\s*:\s*\{\s*[^}\s][^}]*\}/;
    if (nonEmptyTranscription.test(newText)) {
      return {
        decision: 'deny',
        reason:
          'Guardrail WAPPY (Tenshi Voice — Error 1011): `inputAudioTranscription` y `outputAudioTranscription` DEBEN ser objetos vacíos `{}` en Google Multimodal Live API. No incluyas códigos de idioma ni propiedades internas.',
      };
    }
  }

  // 6. Deprecated Gemini AI models shield in source code (verified against .env GOOGLE_MODELS)
  const isSourceCode =
    /^(?:api|packages|client\/src|bin)\//.test(relPath) &&
    /\.(?:js|cjs|mjs|ts|tsx)$/.test(relPath) &&
    !/(?:\.test\.|\.spec\.|__tests__|migrations\/)/.test(relPath);

  if (isSourceCode) {
    const allowedModels = loadAllowedGoogleModels(workspaceRoot);
    const modelMatches = newText.match(/\bgemini-(?:1\.0|1\.5|2\.0|2\.5)-[a-z0-9._-]+/gi) || [];
    const forbidden = [...new Set(modelMatches.map((m) => m.toLowerCase()))].filter((modelId) => {
      if (allowedModels.has(modelId)) return false;
      // Ignore models that already existed in the exact Target snippet (untouched legacy context)
      if (oldText && oldText.toLowerCase().includes(modelId)) return false;
      return true;
    });

    if (forbidden.length > 0) {
      return {
        decision: 'deny',
        reason:
          `Guardrail WAPPY (verify-ai-models): bloqueado el uso de modelo(s) Gemini obsoletos o ausentes de GOOGLE_MODELS en .env: ${forbidden.join(', ')}. Verifica \`.env\` y la documentación oficial antes de configurar modelos.`,
      };
    }
  }

  return null;
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

  const toolCall = payload.toolCall || {};
  const toolName = String(toolCall.name || '');
  const args = toolCall.args || {};
  const workspaceRoot = getWorkspaceRoot(payload);

  let verdict = null;
  if (toolName === 'run_command') {
    verdict = checkRunCommand(args.CommandLine || args.command, workspaceRoot);
  } else if (toolName === 'edit_file' || toolName === 'write_file') {
    verdict = checkFileEditOrWrite(toolName, args, workspaceRoot);
  }

  if (verdict && verdict.decision === 'deny') {
    deny(verdict.reason);
  } else if (verdict && verdict.decision === 'ask') {
    ask(verdict.reason);
  } else {
    allow();
  }
}

main().catch(() => allow());
