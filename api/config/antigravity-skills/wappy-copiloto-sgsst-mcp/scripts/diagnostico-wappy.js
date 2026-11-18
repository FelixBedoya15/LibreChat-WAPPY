#!/usr/bin/env node
/**
 * WAPPY IA — CLI de Diagnóstico, Sincronización y Autorreparación de Instancia Antigravity
 * ========================================================================================
 * Cero dependencias externas npm (100% Node.js nativo). Compatible con macOS, Windows y Linux.
 * Audita mcp_config.json, wappy-env.json, proceso activo del daemon SSE, motor OSINT local,
 * paquete de Skills Operativas + Studio Subagents, y estado en vivo en el servidor WAPPY.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const { execFileSync, spawnSync } = require('child_process');

const CLI_VERSION = '2.7.0';
const HOME_DIR = os.homedir();
const GEMINI_DIR = path.join(HOME_DIR, '.gemini');
const AGY_DIR = path.join(GEMINI_DIR, 'antigravity');
const CONFIG_DIR = path.join(GEMINI_DIR, 'config');
const ENV_FILE = path.join(AGY_DIR, 'wappy-env.json');
const KEYS_FILE = path.join(AGY_DIR, 'wappy-keys.json');
const PID_FILE = path.join(AGY_DIR, 'wappy-push-daemon.pid');
const HEARTBEAT_FILE = path.join(AGY_DIR, 'wappy-push-daemon.heartbeat');
const DAEMON_PATH = path.join(AGY_DIR, 'wappy-push-daemon.js');
const LISTENER_PATH = path.join(AGY_DIR, 'wappy-tenshi-listener.js');
const OSINT_ENGINE_PATH = path.join(AGY_DIR, 'wappy-osint-portals.js');
const ECOSYSTEM_VERSION_FILE = path.join(AGY_DIR, 'wappy-ecosystem-version.json');

const CORE_OPERATIONAL_SKILLS = [
  'wappy-portales-colombia-sst',
  'wappy-copiloto-sgsst-mcp',
  'wappy-ordenes-y-entregables-tenshi',
];

const STUDIO_SUBAGENTS = [
  'wappy-studio-effects-director',
  'wappy-studio-audio-podcast',
  'wappy-studio-scene-animator',
  'wappy-studio-mp4-renderer',
];

function parseCliArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (raw === '-h' || raw === '--help') args.help = true;
    else if (raw === '-v' || raw === '--version') args.version = true;
    else if (raw.startsWith('--')) {
      const eq = raw.indexOf('=');
      if (eq !== -1) {
        args[raw.slice(2, eq).trim()] = raw.slice(eq + 1).trim();
      } else {
        const k = raw.slice(2).trim();
        const next = argv[i + 1];
        if (
          !['status', 'repair', 'sync-skills', 'json', 'help', 'version'].includes(k) &&
          next &&
          !next.startsWith('-')
        ) {
          args[k] = next.trim();
          i += 1;
        } else {
          args[k] = true;
        }
      }
    }
  }
  return args;
}

function printHelp() {
  console.log(
    `
WAPPY IA · Diagnóstico y Autorreparación del Ecosistema Google Antigravity v${CLI_VERSION}
======================================================================================

Uso:
  node diagnostico-wappy.js [--status | --sync-skills | --repair] [--json]

Modos:
  --status        (Por defecto) Audita configuración local, MCP, proceso daemon SSE,
                  motor wappy-osint-portals.js, Skills instaladas y conexión en vivo en WAPPY.
  --sync-skills   Descarga y sincroniza la última versión de las 3 Skills Operativas de WAPPY,
                  las 7 Skills + 4 Subagentes de Wappy Studio y el motor de portales colombianos.
  --repair        Repara ambos mcp_config.json, descarga el último wappy-push-daemon.js validado,
                  ejecuta --sync-skills, asegura permisos MCP en proyectos y reinicia el daemon.

Opciones adicionales:
  --url=https://wappy.club    Sobrescribe URL del servidor WAPPY
  --key=wpy_live_...          Sobrescribe API Key de usuario
  --json                      Devuelve reporte estructurado en JSON puro
  --help                      Muestra esta ayuda
`.trim(),
  );
}

function maskKey(k) {
  const s = String(k || '').trim();
  if (!s) return '(no configurada)';
  if (s.length <= 16) return `${s.slice(0, 6)}...`;
  return `${s.slice(0, 12)}...${s.slice(-4)}`;
}

function normalizeWappyUrl(rawUrl) {
  return (
    String(rawUrl || 'https://wappy.club')
      .trim()
      .replace(/https?:\/\/wappy-ia\.com/gi, 'https://wappy.club')
      .replace(/\/+$/, '')
      .replace(/\/api\/mcp-bridge.*$/i, '') || 'https://wappy.club'
  );
}

function resolveCredentials(cliArgs = {}) {
  let wappyUrl = cliArgs.url || process.env.WAPPY_URL || '';
  let apiKey = cliArgs.key || cliArgs.apiKey || process.env.WAPPY_API_KEY || '';
  let envData = {};

  try {
    if (fs.existsSync(ENV_FILE)) {
      envData = JSON.parse(fs.readFileSync(ENV_FILE, 'utf8')) || {};
      if (!wappyUrl && envData.WAPPY_URL) wappyUrl = envData.WAPPY_URL;
      if (!apiKey && envData.WAPPY_API_KEY) apiKey = envData.WAPPY_API_KEY;
    }
  } catch (_) {}

  for (const cfgPath of [
    path.join(CONFIG_DIR, 'mcp_config.json'),
    path.join(AGY_DIR, 'mcp_config.json'),
  ]) {
    if (wappyUrl && apiKey) break;
    try {
      if (!fs.existsSync(cfgPath)) continue;
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) || {};
      const srv = cfg?.mcpServers?.wappy;
      const uStr = srv?.serverUrl || srv?.url || '';
      if (uStr) {
        const u = new URL(uStr);
        if (!wappyUrl) wappyUrl = `${u.protocol}//${u.host}`;
        if (!apiKey && u.searchParams.get('apiKey')) apiKey = u.searchParams.get('apiKey');
      }
    } catch (_) {}
  }

  if (!apiKey && fs.existsSync(KEYS_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
      if (Array.isArray(saved) && saved[0]?.apiKey) {
        apiKey = saved[0].apiKey;
        if (!wappyUrl && saved[0].wappyUrl) wappyUrl = saved[0].wappyUrl;
      }
    } catch (_) {}
  }

  return {
    wappyUrl: normalizeWappyUrl(wappyUrl || 'https://wappy.club'),
    apiKey: String(apiKey || '').trim(),
    envData,
  };
}

function httpGet(urlStr, headers = {}, timeoutMs = 15000, redirectsLeft = 4) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(urlStr);
    } catch (err) {
      return reject(err);
    }
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(
      parsed,
      {
        headers: {
          'User-Agent': `Wappy-Diagnostico-CLI/${CLI_VERSION}`,
          Accept: '*/*',
          ...headers,
        },
        timeout: timeoutMs,
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirectsLeft > 0
        ) {
          res.resume();
          return resolve(
            httpGet(new URL(res.headers.location, parsed).href, headers, timeoutMs, redirectsLeft - 1),
          );
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error(`Timeout (${timeoutMs}ms) en ${urlStr}`)));
    req.on('error', reject);
  });
}

function listLiveDaemonPids() {
  const pids = [];
  const workerRegex = /(wappy-push-daemon|wappy-tenshi-listener)\.js.*--worker/;
  if (process.platform === 'darwin' || process.platform === 'linux') {
    try {
      const psBin = fs.existsSync('/bin/ps') ? '/bin/ps' : 'ps';
      const out = execFileSync(psBin, ['-axww', '-o', 'pid=,command='], {
        encoding: 'utf8',
        timeout: 4000,
      });
      for (const line of out.split(/\r?\n/)) {
        const m = line.trim().match(/^(\d+)\s+(.*)$/);
        if (m && workerRegex.test(m[2]) && !/^\/bin\/sh\b/.test(m[2])) {
          pids.push(parseInt(m[1], 10));
        }
      }
    } catch (_) {}
  } else if (process.platform === 'win32') {
    try {
      const out = execFileSync(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress",
        ],
        { encoding: 'utf8', timeout: 6000, windowsHide: true },
      );
      if (out && out.trim()) {
        const parsed = JSON.parse(out.trim());
        for (const p of Array.isArray(parsed) ? parsed : [parsed]) {
          if (workerRegex.test(String(p?.CommandLine || ''))) {
            pids.push(parseInt(p.ProcessId, 10));
          }
        }
      }
    } catch (_) {}
  }
  return pids.filter(Boolean);
}

function inspectMcpConfigFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, validJson: false, hasWappyServer: false, sseUrlMasked: null };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) || {};
    const srv = parsed?.mcpServers?.wappy;
    const rawUrl = String(srv?.serverUrl || srv?.url || '').trim();
    const hasWappy = Boolean(rawUrl && rawUrl.includes('/api/mcp-bridge/sse'));
    const maskedUrl = rawUrl
      ? rawUrl.replace(/([?&]apiKey=)([^&]+)/i, (_, p1, k) => `${p1}${maskKey(k)}`)
      : null;
    return {
      exists: true,
      validJson: true,
      hasWappyServer: hasWappy,
      usesLegacyDomain: /wappy-ia\.com/i.test(rawUrl),
      sseUrlMasked: maskedUrl,
    };
  } catch (_) {
    return { exists: true, validJson: false, hasWappyServer: false, sseUrlMasked: null };
  }
}

function inspectLocalDaemon() {
  let installedVersion = null;
  if (fs.existsSync(DAEMON_PATH)) {
    try {
      const src = fs.readFileSync(DAEMON_PATH, 'utf8');
      const m = src.match(/const\s+DAEMON_VERSION\s*=\s*['"]([^'"]+)['"]/);
      if (m) installedVersion = m[1];
    } catch (_) {}
  }
  let pidFileValue = null;
  if (fs.existsSync(PID_FILE)) {
    try {
      pidFileValue = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10) || null;
    } catch (_) {}
  }
  let heartbeatAgeSec = null;
  if (fs.existsSync(HEARTBEAT_FILE)) {
    try {
      const ts = parseInt(fs.readFileSync(HEARTBEAT_FILE, 'utf8').trim(), 10);
      if (ts) heartbeatAgeSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
    } catch (_) {}
  }
  const livePids = listLiveDaemonPids();
  return {
    scriptExists: fs.existsSync(DAEMON_PATH),
    installedVersion,
    pidFileValue,
    liveWorkerPids: livePids,
    workerRunning: livePids.length > 0,
    heartbeatAgeSec,
    heartbeatFresh: heartbeatAgeSec !== null && heartbeatAgeSec < 300,
  };
}

function inspectSkillsAndOsint() {
  const osintExists = fs.existsSync(OSINT_ENGINE_PATH);
  let osintSizeKB = 0;
  let osintValid = false;
  if (osintExists) {
    try {
      const st = fs.statSync(OSINT_ENGINE_PATH);
      osintSizeKB = Number((st.size / 1024).toFixed(1));
      const check = spawnSync(process.execPath, ['--check', OSINT_ENGINE_PATH], {
        stdio: 'ignore',
        windowsHide: true,
      });
      osintValid = check.status === 0;
    } catch (_) {}
  }

  let ecosystemMeta = null;
  if (fs.existsSync(ECOSYSTEM_VERSION_FILE)) {
    try {
      ecosystemMeta = JSON.parse(fs.readFileSync(ECOSYSTEM_VERSION_FILE, 'utf8'));
    } catch (_) {}
  }

  const checkRootSkills = (baseDir) =>
    CORE_OPERATIONAL_SKILLS.map((id) => {
      const skDir = path.join(baseDir, id);
      const hasSkillMd = fs.existsSync(path.join(skDir, 'SKILL.md'));
      const scriptsDir = path.join(skDir, 'scripts');
      const scripts = fs.existsSync(scriptsDir)
        ? fs.readdirSync(scriptsDir).filter((f) => f.endsWith('.js'))
        : [];
      const refsDir = path.join(skDir, 'references');
      const references = fs.existsSync(refsDir)
        ? fs.readdirSync(refsDir).filter((f) => f.endsWith('.md'))
        : [];
      return {
        id,
        installed: hasSkillMd && scripts.length > 0 && references.length > 0,
        hasSkillMd,
        scripts,
        references,
      };
    });

  const configSkills = checkRootSkills(path.join(CONFIG_DIR, 'skills'));
  const agySkills = checkRootSkills(path.join(AGY_DIR, 'skills'));
  const studioAgentsInstalled = STUDIO_SUBAGENTS.filter(
    (id) =>
      fs.existsSync(path.join(CONFIG_DIR, 'agents', `${id}.md`)) &&
      fs.existsSync(path.join(AGY_DIR, 'agents', `${id}.md`)),
  );

  return {
    osintEngine: {
      exists: osintExists,
      sizeKB: osintSizeKB,
      syntaxValid: osintValid,
      path: OSINT_ENGINE_PATH,
    },
    ecosystemVersion: ecosystemMeta?.version || null,
    ecosystemSyncedAt: ecosystemMeta?.syncedAt || null,
    coreSkillsReadyInConfig: configSkills.every((s) => s.installed),
    coreSkillsReadyInAntigravity: agySkills.every((s) => s.installed),
    coreSkillsDetail: agySkills,
    studioSubagentsReadyCount: studioAgentsInstalled.length,
    studioSubagentsExpectedCount: STUDIO_SUBAGENTS.length,
  };
}

function upsertGlobalRulesBlock(filePath, markerStart, markerEnd, blockContent) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const escapedStart = markerStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = markerEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const legacyRegex =
    /<!--\s*WAPPY_OFFICIAL_ECOSYSTEM_V[0-9_]+\s*-->[\s\S]*?<!--\s*\/WAPPY_OFFICIAL_ECOSYSTEM_V[0-9_]+\s*-->/g;
  const currentRegex = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, 'g');

  let updated;
  if (currentRegex.test(existing)) {
    updated = existing.replace(currentRegex, blockContent.trim());
  } else if (legacyRegex.test(existing)) {
    updated = existing.replace(legacyRegex, blockContent.trim());
  } else {
    updated = `${existing.trimEnd()}\n\n${blockContent.trim()}\n`;
  }
  fs.writeFileSync(filePath, updated, 'utf8');
}

async function syncEcosystemFromServer({ wappyUrl, apiKey, logErr }) {
  const summary = {
    osintUpdated: false,
    coreSkillsInstalled: [],
    studioSkillsInstalled: [],
    studioSubagentsInstalled: [],
    globalRulesUpdated: false,
    warnings: [],
  };

  const authHeaders = {};
  if (apiKey) {
    authHeaders['x-api-key'] = apiKey;
    authHeaders.Authorization = `Bearer ${apiKey}`;
  }

  fs.mkdirSync(AGY_DIR, { recursive: true });
  fs.mkdirSync(CONFIG_DIR, { recursive: true });

  // 1) Motor wappy-osint-portals.js
  try {
    const osintRes = await httpGet(
      `${wappyUrl}/api/mcp-bridge/antigravity/osint-portals.js`,
      authHeaders,
      25000,
    );
    if (osintRes.status === 200 && osintRes.body.includes('consultarArlRealPorCedula')) {
      const tmp = `${OSINT_ENGINE_PATH}.tmp.${process.pid}`;
      fs.writeFileSync(tmp, osintRes.body, 'utf8');
      const chk = spawnSync(process.execPath, ['--check', tmp], {
        stdio: 'ignore',
        windowsHide: true,
      });
      if (chk.status === 0) {
        fs.renameSync(tmp, OSINT_ENGINE_PATH);
        summary.osintUpdated = true;
      } else {
        try {
          fs.unlinkSync(tmp);
        } catch (_) {}
        summary.warnings.push('osint-portals.js descargado falló validación sintáctica.');
      }
    } else {
      summary.warnings.push(`osint-portals.js devolvió HTTP ${osintRes.status}`);
    }
  } catch (err) {
    summary.warnings.push(`Aviso descargando osint-portals.js: ${err.message}`);
  }

  // 2) Pack de 3 Skills Operativas (SKILL.md + scripts/*.js + references/*.md)
  try {
    const packRes = await httpGet(
      `${wappyUrl}/api/mcp-bridge/antigravity/skills-pack.json`,
      authHeaders,
      20000,
    );
    if (packRes.status === 200) {
      const pack = JSON.parse(packRes.body);
      const skills = Array.isArray(pack.skills) ? pack.skills : [];
      const roots = [path.join(CONFIG_DIR, 'skills'), path.join(AGY_DIR, 'skills')];
      for (const root of roots) {
        fs.mkdirSync(root, { recursive: true });
        for (const sk of skills) {
          if (!sk.id || !sk.skillMd) continue;
          const skDir = path.join(root, sk.id);
          fs.mkdirSync(skDir, { recursive: true });
          fs.writeFileSync(path.join(skDir, 'SKILL.md'), sk.skillMd, 'utf8');
          if (Array.isArray(sk.scripts)) {
            const sDir = path.join(skDir, 'scripts');
            fs.mkdirSync(sDir, { recursive: true });
            for (const sc of sk.scripts) {
              if (!sc.name || typeof sc.content !== 'string') continue;
              const dest = path.join(sDir, path.basename(sc.name));
              fs.writeFileSync(dest, sc.content, { encoding: 'utf8', mode: 0o755 });
              try {
                fs.chmodSync(dest, 0o755);
              } catch (_) {}
            }
          }
          if (Array.isArray(sk.references)) {
            const rDir = path.join(skDir, 'references');
            fs.mkdirSync(rDir, { recursive: true });
            for (const rf of sk.references) {
              if (!rf.name || typeof rf.content !== 'string') continue;
              fs.writeFileSync(path.join(rDir, path.basename(rf.name)), rf.content, 'utf8');
            }
          }
        }
      }
      summary.coreSkillsInstalled = skills.map((s) => s.id);

      if (pack.globalRulesBlock) {
        const mStart = pack.globalRulesMarkerStart || '<!-- WAPPY_OFFICIAL_ECOSYSTEM_V2_7 -->';
        const mEnd = pack.globalRulesMarkerEnd || '<!-- /WAPPY_OFFICIAL_ECOSYSTEM_V2_7 -->';
        for (const docTarget of [
          path.join(GEMINI_DIR, 'GEMINI.md'),
          path.join(AGY_DIR, 'AGENTS.md'),
        ]) {
          try {
            upsertGlobalRulesBlock(docTarget, mStart, mEnd, pack.globalRulesBlock);
          } catch (_) {}
        }
        summary.globalRulesUpdated = true;
      }
    } else {
      summary.warnings.push(`skills-pack.json devolvió HTTP ${packRes.status}`);
    }
  } catch (err) {
    summary.warnings.push(`Aviso descargando skills-pack.json: ${err.message}`);
  }

  // 3) Pack de 7 Skills + 4 Subagentes de Wappy Studio
  try {
    const studioRes = await httpGet(
      `${wappyUrl}/api/studio/antigravity/skills-bundle.json`,
      authHeaders,
      20000,
    );
    if (studioRes.status === 200) {
      const bundle = JSON.parse(studioRes.body);
      const stSkills = Array.isArray(bundle.skills) ? bundle.skills : [];
      const stAgents = Array.isArray(bundle.subagents) ? bundle.subagents : [];
      for (const root of [path.join(CONFIG_DIR, 'skills'), path.join(AGY_DIR, 'skills')]) {
        fs.mkdirSync(root, { recursive: true });
        for (const sk of stSkills) {
          if (!sk.id || !sk.content) continue;
          const skDir = path.join(root, sk.id);
          fs.mkdirSync(skDir, { recursive: true });
          fs.writeFileSync(path.join(skDir, 'SKILL.md'), sk.content, 'utf8');
        }
      }
      for (const agRoot of [path.join(CONFIG_DIR, 'agents'), path.join(AGY_DIR, 'agents')]) {
        fs.mkdirSync(agRoot, { recursive: true });
        for (const sub of stAgents) {
          const content = sub.systemPrompt || sub.content;
          if (!sub.id || !content) continue;
          fs.writeFileSync(path.join(agRoot, `${sub.id}.md`), content, 'utf8');
        }
      }
      summary.studioSkillsInstalled = stSkills.map((s) => s.id);
      summary.studioSubagentsInstalled = stAgents.map((a) => a.id);
    }
  } catch (err) {
    logErr(`Aviso opcional sincronizando skills-bundle de Studio: ${err.message}`);
  }

  if (summary.osintUpdated || summary.coreSkillsInstalled.length > 0) {
    fs.writeFileSync(
      ECOSYSTEM_VERSION_FILE,
      JSON.stringify(
        {
          version: CLI_VERSION,
          syncedAt: new Date().toISOString(),
          coreSkills: summary.coreSkillsInstalled,
          studioSkillsCount: summary.studioSkillsInstalled.length,
          osintReady: fs.existsSync(OSINT_ENGINE_PATH),
        },
        null,
        2,
      ),
      'utf8',
    );
  }

  return summary;
}

async function repairConfigurationAndRestart({ wappyUrl, apiKey, logErr }) {
  const repairLog = {
    mcpConfigRepaired: false,
    daemonUpdated: false,
    daemonRestarted: false,
    warnings: [],
  };

  if (apiKey) {
    const sseUrl = `${wappyUrl}/api/mcp-bridge/sse?apiKey=${apiKey}`;
    for (const cfgPath of [
      path.join(CONFIG_DIR, 'mcp_config.json'),
      path.join(AGY_DIR, 'mcp_config.json'),
    ]) {
      try {
        fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
        let cur = {};
        if (fs.existsSync(cfgPath)) {
          try {
            cur = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) || {};
          } catch (_) {
            cur = {};
          }
        }
        if (!cur.mcpServers || typeof cur.mcpServers !== 'object') cur.mcpServers = {};
        cur.mcpServers.wappy = { url: sseUrl, serverUrl: sseUrl };
        fs.writeFileSync(cfgPath, JSON.stringify(cur, null, 2), 'utf8');
        repairLog.mcpConfigRepaired = true;
      } catch (err) {
        repairLog.warnings.push(`No se pudo reparar ${cfgPath}: ${err.message}`);
      }
    }
  } else {
    repairLog.warnings.push('No se encontró WAPPY_API_KEY local para reescribir mcp_config.json.');
  }

  try {
    const dRes = await httpGet(`${wappyUrl}/api/mcp-bridge/antigravity/daemon.js`, {}, 25000);
    if (dRes.status === 200 && dRes.body.includes('startSseWorker')) {
      const tmp = `${DAEMON_PATH}.tmp.${process.pid}`;
      fs.writeFileSync(tmp, dRes.body, { encoding: 'utf8', mode: 0o755 });
      const chk = spawnSync(process.execPath, ['--check', tmp], {
        stdio: 'ignore',
        windowsHide: true,
      });
      if (chk.status === 0) {
        fs.copyFileSync(tmp, DAEMON_PATH);
        fs.copyFileSync(tmp, LISTENER_PATH);
        try {
          fs.chmodSync(DAEMON_PATH, 0o755);
          fs.chmodSync(LISTENER_PATH, 0o755);
          fs.unlinkSync(tmp);
        } catch (_) {}
        repairLog.daemonUpdated = true;
      } else {
        try {
          fs.unlinkSync(tmp);
        } catch (_) {}
        repairLog.warnings.push('daemon.js descargado no pasó validación sintáctica.');
      }
    }
  } catch (err) {
    logErr(`Aviso descargando daemon.js remoto: ${err.message}`);
  }

  if (fs.existsSync(DAEMON_PATH)) {
    const installArgs = [DAEMON_PATH, '--install'];
    if (wappyUrl) installArgs.push(`--url=${wappyUrl}`);
    if (apiKey) installArgs.push(`--key=${apiKey}`);
    const proc = spawnSync(process.execPath, installArgs, {
      encoding: 'utf8',
      timeout: 25000,
      windowsHide: true,
    });
    repairLog.daemonRestarted = proc.status === 0;
  }

  return repairLog;
}

function formatHumanStatus(report) {
  const lines = [];
  lines.push(`## 🩺 Diagnóstico Integral WAPPY IA <-> Google Antigravity (v${CLI_VERSION})`);
  lines.push(`- **Servidor WAPPY:** \`${report.wappyUrl}\``);
  lines.push(`- **API Key Detectada:** \`${report.apiKeyMasked}\``);
  lines.push(`- **Sistema Operativo / Node:** \`${report.platform}\` · \`${report.nodeVersion}\``);
  lines.push('');
  lines.push(`### 1. Servidor MCP (\`mcp_config.json\`)`);
  lines.push(
    `- \`~/.gemini/config/mcp_config.json\`: ${report.mcpConfig.configDir.hasWappyServer ? '✅ Configurado' : '❌ Falta servidor wappy'} ${report.mcpConfig.configDir.usesLegacyDomain ? '⚠️ (Dominio antiguo detectado: usa --repair)' : ''}`,
  );
  lines.push(
    `- \`~/.gemini/antigravity/mcp_config.json\`: ${report.mcpConfig.antigravityDir.hasWappyServer ? '✅ Configurado' : '❌ Falta servidor wappy'}`,
  );
  lines.push('');
  lines.push(`### 2. Puente Reactivo Push SSE (\`wappy-push-daemon.js\`)`);
  lines.push(
    `- **Versión Instalada:** \`v${report.localDaemon.installedVersion || 'no instalada'}\``,
  );
  lines.push(
    `- **Worker en Ejecución:** ${report.localDaemon.workerRunning ? `🟢 Activo (PID: ${report.localDaemon.liveWorkerPids.join(', ')})` : '🔴 Detenido'}`,
  );
  lines.push(
    `- **Latido (Heartbeat):** ${report.localDaemon.heartbeatFresh ? `✅ Fresco (hace ${report.localDaemon.heartbeatAgeSec}s)` : '⚠️ Sin latido reciente'}`,
  );
  lines.push('');
  lines.push(`### 3. Motor de Portales Colombianos & Paquete de Skills`);
  lines.push(
    `- **Motor \`wappy-osint-portals.js\`:** ${report.ecosystem.osintEngine.exists && report.ecosystem.osintEngine.syntaxValid ? `✅ Listo (${report.ecosystem.osintEngine.sizeKB} KB)` : '❌ Faltante o desactualizado (ejecuta --sync-skills)'}`,
  );
  lines.push(
    `- **3 Skills Maestras Operativas:** ${report.ecosystem.coreSkillsReadyInAntigravity && report.ecosystem.coreSkillsReadyInConfig ? '✅ Instaladas en config/ y antigravity/' : '⚠️ Incompletas (ejecuta --sync-skills)'}`,
  );
  for (const sk of report.ecosystem.coreSkillsDetail) {
    lines.push(
      `  • \`${sk.id}\`: ${sk.installed ? '✅ OK' : '❌ Pendiente'} (scripts: ${sk.scripts.join(', ') || 'ninguno'})`,
    );
  }
  lines.push(
    `- **Subagentes Wappy Studio:** ${report.ecosystem.studioSubagentsReadyCount}/${report.ecosystem.studioSubagentsExpectedCount} instalados`,
  );
  lines.push('');
  lines.push(`### 4. Estado en Vivo en Servidor WAPPY (\`/antigravity/status\`)`);
  if (report.remoteStatus?.ok) {
    const rs = report.remoteStatus;
    lines.push(
      `- **Conexión Remota:** ${rs.connected ? '🟢 CONECTADO EN VIVO' : '🔴 Sin stream activo en el servidor'}`,
    );
    lines.push(
      `- **Modo Activo / Entorno Efectivo:** \`${rs.activeMode || 'auto'}\` ➔ \`${rs.effectiveEnv || 'N/A'}\` (Local: ${rs.localCount || 0}, Cloud: ${rs.cloudCount || 0})`,
    );
    lines.push(`- **Versión Servidor:** \`v${rs.version || 'N/A'}\``);
  } else {
    lines.push(
      `- **Aviso de Conexión Remota:** ${report.remoteStatus?.error || 'No se pudo verificar (revisa red o API Key)'}`,
    );
  }

  if (report.actionsPerformed) {
    lines.push('');
    lines.push(`### 🔧 Acciones Ejecutadas`);
    lines.push(`\`\`\`json\n${JSON.stringify(report.actionsPerformed, null, 2)}\n\`\`\``);
  }
  return lines.join('\n');
}

(async () => {
  const cliArgs = parseCliArgs(process.argv.slice(2));
  if (cliArgs.help) {
    printHelp();
    process.exit(0);
  }
  if (cliArgs.version) {
    console.log(CLI_VERSION);
    process.exit(0);
  }

  const jsonMode = Boolean(cliArgs.json);
  const logErr = (msg) => process.stderr.write(`${msg}\n`);
  const doRepair = Boolean(cliArgs.repair);
  const doSyncSkills = Boolean(cliArgs['sync-skills'] || cliArgs.syncSkills || doRepair);

  const { wappyUrl, apiKey, envData } = resolveCredentials(cliArgs);
  let actionsPerformed = null;

  if (doSyncSkills || doRepair) {
    actionsPerformed = {};
    actionsPerformed.syncSkills = await syncEcosystemFromServer({ wappyUrl, apiKey, logErr });
    if (doRepair) {
      actionsPerformed.repair = await repairConfigurationAndRestart({ wappyUrl, apiKey, logErr });
    }
  }

  let remoteStatus = { ok: false, error: 'Sin API Key configurada' };
  if (apiKey) {
    try {
      const r = await httpGet(
        `${wappyUrl}/api/mcp-bridge/antigravity/status`,
        {
          'x-api-key': apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        10000,
      );
      if (r.status === 200) {
        remoteStatus = JSON.parse(r.body);
      } else {
        remoteStatus = { ok: false, httpStatus: r.status, error: `HTTP ${r.status}` };
      }
    } catch (err) {
      remoteStatus = { ok: false, error: err.message };
    }
  }

  const mcpConfig = {
    configDir: inspectMcpConfigFile(path.join(CONFIG_DIR, 'mcp_config.json')),
    antigravityDir: inspectMcpConfigFile(path.join(AGY_DIR, 'mcp_config.json')),
  };
  const localDaemon = inspectLocalDaemon();
  const ecosystem = inspectSkillsAndOsint();

  const healthy = Boolean(
    mcpConfig.configDir.hasWappyServer &&
      mcpConfig.antigravityDir.hasWappyServer &&
      localDaemon.workerRunning &&
      ecosystem.osintEngine.exists &&
      ecosystem.osintEngine.syntaxValid &&
      ecosystem.coreSkillsReadyInAntigravity,
  );

  const report = {
    ok: true,
    healthy,
    cliVersion: CLI_VERSION,
    timestamp: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version,
    wappyUrl,
    hasApiKey: Boolean(apiKey),
    apiKeyMasked: maskKey(apiKey),
    configuredWorkspaceCwd: envData?.workspaceCwd || null,
    mcpConfig,
    localDaemon,
    ecosystem,
    remoteStatus,
    ...(actionsPerformed ? { actionsPerformed } : {}),
  };

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    console.log(formatHumanStatus(report));
  }
  process.exit(0);
})();
