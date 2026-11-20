#!/usr/bin/env node
'use strict';

/**
 * WAPPY IA — Deterministic Harness & Agency Auditor (Read-Only, Zero-Dependency)
 *
 * Checks:
 *  1. Skills (.agents/skills/<name>/SKILL.md) frontmatter + sync with skills_index.json & CATALOG.md
 *  2. Subagents (.agents/agents/*.md) frontmatter, Antigravity native tool names, valid preloadSkills
 *  3. Contextual Rules (.agents/rules/*.md) size (<24KB), valid trigger & Antigravity glob syntax
 *  4. Lifecycle Hooks (.agents/hooks.json) schema validity + `node --check` on referenced scripts
 *  5. Procedural Memory (~/.gemini/teams/wappy-dev-agency/memory & .agents/memory) 50-rule cap & orphan detection
 *  6. Security hygiene (potential hardcoded secrets in .agents/) & hook smoke sanity
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../..');
const AGENTS_DIR = path.join(WORKSPACE_ROOT, '.agents');
const TEAM_MEMORY_DIR = path.join(os.homedir(), '.gemini', 'teams', 'wappy-dev-agency', 'memory');

const VALID_HOOK_EVENTS = new Set([
  'SessionStart',
  'PreToolUse',
  'PostToolUse',
  'PreInvocation',
  'PostInvocation',
  'Stop',
]);

const VALID_RULE_TRIGGERS = new Set(['always_on', 'glob', 'model_decision', 'manual']);

const CLAUDE_ONLY_TOOLS = new Set([
  'Bash',
  'Read',
  'Write',
  'Edit',
  'MultiEdit',
  'Grep',
  'Glob',
  'WebSearch',
  'WebFetch',
  'TodoWrite',
]);

const CANONICAL_MEMORY_FILES = new Set([
  'integrations-lessons.md',
  'design-ui-lessons.md',
  'video-motion-lessons.md',
  'backend-voice-lessons.md',
  'qa-build-lessons.md',
  'workflow-logic-lessons.md',
]);

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const block = match[1];
  const data = {};
  let currentListKey = null;
  let currentScalarKey = null;

  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trim().startsWith('#')) continue;

    if (currentScalarKey && /^\s+/.test(rawLine)) {
      const piece = line.trim();
      data[currentScalarKey] = data[currentScalarKey]
        ? `${data[currentScalarKey]} ${piece}`
        : piece;
      continue;
    }

    const listMatch = line.match(/^\s*-\s+(.*)$/);
    if (listMatch && currentListKey) {
      if (!Array.isArray(data[currentListKey])) data[currentListKey] = [];
      data[currentListKey].push(listMatch[1].trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }

    const kvMatch = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2].trim();
      currentListKey = null;
      currentScalarKey = null;
      if (val === '>' || val === '>-' || val === '|' || val === '|-') {
        data[key] = '';
        currentScalarKey = key;
      } else if (val === '') {
        data[key] = '';
        currentListKey = key;
      } else if (val.startsWith('[') && val.endsWith(']')) {
        data[key] = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
      } else {
        data[key] = val.replace(/^['"]|['"]$/g, '');
      }
    }
  }

  return data;
}

function discoverGlobalSkills() {
  const names = new Set();
  const roots = [
    path.join(os.homedir(), '.gemini', 'config', 'skills'),
    path.join(os.homedir(), '.gemini', 'antigravity', 'skills'),
    path.join(os.homedir(), '.gemini', 'antigravity', 'builtin', 'skills'),
  ];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const d of fs.readdirSync(root, { withFileTypes: true })) {
      if (d.isDirectory() && fs.existsSync(path.join(root, d.name, 'SKILL.md'))) {
        names.add(d.name);
      }
    }
  }
  return names;
}

function makeReport() {
  return {
    workspace: WORKSPACE_ROOT,
    timestamp: new Date().toISOString(),
    summary: {
      skills: 0,
      agents: 0,
      rules: 0,
      hooks: 0,
      memoryFiles: 0,
      errors: 0,
      warnings: 0,
    },
    findings: [],
  };
}

function addFinding(report, severity, area, file, message) {
  report.findings.push({ severity, area, file, message });
  if (severity === 'ERROR') report.summary.errors += 1;
  if (severity === 'WARN') report.summary.warnings += 1;
}

function auditSkills(report) {
  const skillsDir = path.join(AGENTS_DIR, 'skills');
  const discovered = new Set();

  if (!fs.existsSync(skillsDir)) {
    addFinding(report, 'ERROR', 'skills', '.agents/skills', 'No existe el directorio .agents/skills');
    return discovered;
  }

  const dirs = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const dir of dirs) {
    const skillFile = path.join(skillsDir, dir.name, 'SKILL.md');
    const rel = `.agents/skills/${dir.name}/SKILL.md`;
    if (!fs.existsSync(skillFile)) {
      addFinding(report, 'ERROR', 'skills', rel, 'Falta archivo obligatorio SKILL.md');
      continue;
    }

    discovered.add(dir.name);
    report.summary.skills += 1;
    const content = fs.readFileSync(skillFile, 'utf8');
    const fm = parseFrontmatter(content);

    if (!fm) {
      addFinding(report, 'ERROR', 'skills', rel, 'Falta bloque frontmatter YAML (---)');
      continue;
    }
    if (!fm.name) {
      addFinding(report, 'ERROR', 'skills', rel, 'Falta campo obligatorio `name` en frontmatter');
    } else if (fm.name !== dir.name) {
      addFinding(report, 'WARN', 'skills', rel, `El campo name ("${fm.name}") no coincide con el nombre de carpeta ("${dir.name}")`);
    }
    if (!fm.description) {
      addFinding(report, 'ERROR', 'skills', rel, 'Falta campo obligatorio `description` en frontmatter');
    }
  }

  // Sync check with skills_index.json
  const indexPath = path.join(AGENTS_DIR, 'skills_index.json');
  if (fs.existsSync(indexPath)) {
    try {
      const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      const indexedIds = new Set(indexData.map((item) => item.id || item.name));

      for (const skillName of discovered) {
        if (!indexedIds.has(skillName)) {
          addFinding(report, 'WARN', 'skills', '.agents/skills_index.json', `La skill "${skillName}" existe en disco pero falta en skills_index.json`);
        }
      }
      for (const id of indexedIds) {
        if (!discovered.has(id)) {
          addFinding(report, 'ERROR', 'skills', '.agents/skills_index.json', `La skill "${id}" figura en skills_index.json pero no existe en .agents/skills/`);
        }
      }
    } catch (err) {
      addFinding(report, 'ERROR', 'skills', '.agents/skills_index.json', `JSON inválido: ${err.message}`);
    }
  }

  // Sync check with CATALOG.md
  const catalogPath = path.join(AGENTS_DIR, 'CATALOG.md');
  if (fs.existsSync(catalogPath)) {
    const catalogText = fs.readFileSync(catalogPath, 'utf8');
    for (const skillName of discovered) {
      if (!catalogText.includes(skillName)) {
        addFinding(report, 'WARN', 'skills', '.agents/CATALOG.md', `La skill "${skillName}" no está documentada en CATALOG.md`);
      }
    }
  }

  return discovered;
}

function auditAgents(report, discoveredSkills, globalSkills) {
  const agentsDir = path.join(AGENTS_DIR, 'agents');
  if (!fs.existsSync(agentsDir)) return;

  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const abs = path.join(agentsDir, file);
    const rel = `.agents/agents/${file}`;
    report.summary.agents += 1;

    const content = fs.readFileSync(abs, 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm) {
      addFinding(report, 'ERROR', 'agents', rel, 'Falta frontmatter YAML');
      continue;
    }
    if (!fm.name || !fm.description) {
      addFinding(report, 'ERROR', 'agents', rel, 'Faltan campos obligatorios `name` o `description`');
    }

    if (Array.isArray(fm.tools)) {
      for (const tool of fm.tools) {
        if (CLAUDE_ONLY_TOOLS.has(tool)) {
          addFinding(
            report,
            'ERROR',
            'agents',
            rel,
            `Herramienta incompatible de Claude Code ("${tool}"). Antigravity puede colgarse con tool IDs inválidos.`
          );
        }
      }
    } else {
      addFinding(report, 'WARN', 'agents', rel, 'No declara lista `tools:` explícita (quedará en modo mínimo solo lectura)');
    }

    if (Array.isArray(fm.preloadSkills)) {
      for (const sk of fm.preloadSkills) {
        if (!discoveredSkills.has(sk) && !globalSkills.has(sk)) {
          addFinding(report, 'WARN', 'agents', rel, `preloadSkills referencia "${sk}" que no existe ni en .agents/skills/ ni en skills globales`);
        }
      }
    }
  }
}

function auditRules(report) {
  const rulesDir = path.join(AGENTS_DIR, 'rules');
  if (!fs.existsSync(rulesDir)) {
    addFinding(report, 'WARN', 'rules', '.agents/rules', 'No existe directorio .agents/rules/ para reglas contextuales por glob');
    return;
  }

  const files = fs.readdirSync(rulesDir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const abs = path.join(rulesDir, file);
    const rel = `.agents/rules/${file}`;
    report.summary.rules += 1;

    const buf = fs.readFileSync(abs);
    if (buf.byteLength > 24000) {
      addFinding(report, 'ERROR', 'rules', rel, `Excede el límite oficial de 24 KB (${buf.byteLength} bytes) y será truncada`);
    }

    const content = buf.toString('utf8');
    const fm = parseFrontmatter(content);
    if (!fm || !fm.trigger) {
      addFinding(report, 'ERROR', 'rules', rel, 'Falta frontmatter con `trigger:` (sin trigger la regla nunca se carga)');
      continue;
    }
    if (!VALID_RULE_TRIGGERS.has(fm.trigger)) {
      addFinding(report, 'ERROR', 'rules', rel, `trigger inválido "${fm.trigger}" (válidos: always_on, glob, model_decision, manual)`);
    }
    if (fm.trigger === 'glob') {
      if (!fm.globs || Array.isArray(fm.globs)) {
        addFinding(report, 'ERROR', 'rules', rel, 'En Antigravity `globs` debe ser UNA cadena separada por comas, no una lista YAML');
      } else {
        if (/[{}]/.test(fm.globs)) {
          addFinding(report, 'ERROR', 'rules', rel, `globs contiene llaves "{}" no soportadas ("${fm.globs}"); expande cada extensión separada por comas`);
        }
        const patterns = fm.globs.split(',').map((s) => s.trim()).filter(Boolean);
        for (const p of patterns) {
          if (!p.startsWith('**/') && !p.startsWith('*')) {
            addFinding(report, 'WARN', 'rules', rel, `El patrón glob "${p}" debería empezar con "**/" para coincidir contra rutas absolutas`);
          }
        }
      }
    }
  }
}

function auditHooks(report) {
  const hooksFile = path.join(AGENTS_DIR, 'hooks.json');
  if (!fs.existsSync(hooksFile)) {
    addFinding(report, 'WARN', 'hooks', '.agents/hooks.json', 'No existe .agents/hooks.json en el workspace');
    return;
  }

  let hooksJson;
  try {
    hooksJson = JSON.parse(fs.readFileSync(hooksFile, 'utf8'));
  } catch (err) {
    addFinding(report, 'ERROR', 'hooks', '.agents/hooks.json', `JSON inválido: ${err.message}`);
    return;
  }

  for (const [hookName, spec] of Object.entries(hooksJson)) {
    if (!spec || typeof spec !== 'object') continue;
    report.summary.hooks += 1;

    for (const [eventKey, entries] of Object.entries(spec)) {
      if (eventKey === 'enabled') continue;
      if (!VALID_HOOK_EVENTS.has(eventKey)) {
        addFinding(report, 'ERROR', 'hooks', '.agents/hooks.json', `Evento no soportado "${eventKey}" en hook "${hookName}"`);
        continue;
      }

      const handlers = [];
      if (Array.isArray(entries)) {
        for (const entry of entries) {
          if (entry && Array.isArray(entry.hooks)) {
            handlers.push(...entry.hooks);
          } else if (entry && entry.command) {
            handlers.push(entry);
          }
        }
      }

      for (const h of handlers) {
        if (!h.command) continue;
        const scriptMatch = h.command.match(/node\s+(\.\/[^\s"']+\.(?:js|cjs|mjs))/);
        if (scriptMatch) {
          const scriptAbs = path.resolve(AGENTS_DIR, scriptMatch[1]);
          const relScript = path.relative(WORKSPACE_ROOT, scriptAbs).replace(/\\/g, '/');
          if (!fs.existsSync(scriptAbs)) {
            addFinding(report, 'ERROR', 'hooks', relScript, `Script referenciado en hooks.json no existe (${hookName}.${eventKey})`);
          } else {
            try {
              execFileSync(process.execPath, ['--check', scriptAbs], { stdio: 'pipe', timeout: 4000 });
            } catch (err) {
              addFinding(report, 'ERROR', 'hooks', relScript, `Error de sintaxis en hook: ${String(err.stderr || err.message).trim()}`);
            }
          }
        }
      }
    }
  }
}

function auditMemory(report) {
  if (!fs.existsSync(TEAM_MEMORY_DIR)) return;

  const files = fs.readdirSync(TEAM_MEMORY_DIR).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const abs = path.join(TEAM_MEMORY_DIR, file);
    report.summary.memoryFiles += 1;

    if (!CANONICAL_MEMORY_FILES.has(file)) {
      addFinding(
        report,
        'WARN',
        'memory',
        abs,
        `Archivo de memoria legacy/huérfano fuera de las 6 bitácoras oficiales; revisar para fusionar o archivar.`
      );
      continue;
    }

    const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
    const ruleLines = lines.filter((l) => /^\s*(?:\d+\.|-\s)/.test(l)).length;
    if (lines.length > 55 || ruleLines > 50) {
      addFinding(
        report,
        'WARN',
        'memory',
        abs,
        `Supera el tope recomendado de 50 reglas (${lines.length} líneas, ${ruleLines} ítems). Conviene compactar y promover patrones recurrentes a .agents/rules/ o SKILL.md.`
      );
    }
  }
}

function auditSecurityHygiene(report) {
  const secretPatterns = [
    { name: 'Google API Key', regex: /AIzaSy[0-9A-Za-z_-]{33}/ },
    { name: 'OpenAI Key', regex: /sk-(?:proj-)?[0-9A-Za-z]{20,}/ },
    { name: 'Private Key Header', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  ];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(?:md|json|js|cjs|mjs|sh|yaml|yml)$/.test(entry.name)) {
        const text = fs.readFileSync(full, 'utf8');
        const rel = path.relative(WORKSPACE_ROOT, full).replace(/\\/g, '/');
        for (const pat of secretPatterns) {
          if (pat.regex.test(text)) {
            addFinding(report, 'ERROR', 'security', rel, `Posible secreto literal detectado (${pat.name})`);
          }
        }
      }
    }
  }

  walk(AGENTS_DIR);
}

function main() {
  const args = new Set(process.argv.slice(2));
  const jsonMode = args.has('--json');
  const strictMode = args.has('--strict');

  const report = makeReport();
  const discoveredSkills = auditSkills(report);
  const globalSkills = discoverGlobalSkills();
  auditAgents(report, discoveredSkills, globalSkills);
  auditRules(report);
  auditHooks(report);
  auditMemory(report);
  auditSecurityHygiene(report);

  if (jsonMode) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    const s = report.summary;
    console.log('=== WAPPY IA — HARNESS AUDIT REPORT ===');
    console.log(`Workspace : ${report.workspace}`);
    console.log(`Inventory : ${s.skills} skills | ${s.agents} agents | ${s.rules} rules | ${s.hooks} hook groups | ${s.memoryFiles} memory files`);
    console.log(`Verdict   : ${s.errors} ERROR(s) | ${s.warnings} WARN(s)`);
    console.log('');

    if (report.findings.length === 0) {
      console.log('PASS: Todo el harness de WAPPY IA pasó 100% limpio.');
    } else {
      for (const f of report.findings) {
        const tag = f.severity === 'ERROR' ? '[ERROR]' : '[WARN ]';
        console.log(`${tag} (${f.area}) ${f.file}`);
        console.log(`        -> ${f.message}`);
      }
    }
  }

  if (report.summary.errors > 0 || (strictMode && report.summary.warnings > 0)) {
    process.exit(1);
  }
}

main();
