import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit3,
  Terminal,
  Shield,
  Sparkles,
  Cpu,
  Layers,
  FileSpreadsheet,
  Users,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ShieldAlert,
  Car,
  FlaskConical,
  FileText,
  CheckSquare,
  Bot,
  FolderArchive,
  Activity,
  FileCheck,
  ClipboardList,
  HardHat,
  Cloud,
  MessageSquare,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import { cn } from '~/utils';
import ExpandingButton from './ExpandingButton';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  apiKey?: string | null;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string | null;
  isActive: boolean;
}

interface McpAntigravityViewProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const McpAntigravityView: React.FC<McpAntigravityViewProps> = ({ onClose, isModal = false }) => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newKeyGenerated, setNewKeyGenerated] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedVerify, setCopiedVerify] = useState(false);
  const [copiedCron, setCopiedCron] = useState(false);
  const [copiedLocal, setCopiedLocal] = useState(false);
  const [showAdvancedLocal, setShowAdvancedLocal] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'tools' | 'keys'>('config');

  // Cargar claves existentes
  const loadKeys = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user-api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('[MCP View] Error cargando claves:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  // Generar nueva clave
  const handleCreateKey = async (): Promise<string | null> => {
    if (!token) return null;
    setCreating(true);
    try {
      const res = await fetch('/api/user-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'Antigravity MCP Key' }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewKeyGenerated(data.apiKey);
        showToast({
          message: '¡Nueva Clave API generada exitosamente!',
          status: 'success',
        });
        loadKeys();
        return data.apiKey;
      } else {
        showToast({
          message: 'Error al generar la clave API.',
          status: 'error',
        });
        return null;
      }
    } catch (err) {
      showToast({
        message: 'Error de conexión al generar clave.',
        status: 'error',
      });
      return null;
    } finally {
      setCreating(false);
    }
  };

  // Revocar clave
  const handleDeleteKey = async (id: string) => {
    if (!token) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user-api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showToast({
          message: 'Clave API revocada exitosamente.',
          status: 'success',
        });
        setKeys((prev) => prev.filter((k) => k.id !== id));
      }
    } catch (err) {
      showToast({ message: 'Error al revocar clave.', status: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://wappy.club';
  const fullKeyFromList = keys.find((k) => k.apiKey && !k.apiKey.includes('...'))?.apiKey || null;
  const effectiveKey = newKeyGenerated || fullKeyFromList || (keys.length > 0 ? `${keys[0].keyPrefix}` : 'PEGA_TU_CLAVE_AQUI');
  const sseServerUrl = `${originUrl}/api/mcp-bridge/sse?apiKey=${effectiveKey}`;

  // Instalador unificado (MCP + Puente Reactivo Tenshi + Auto-arranque nativo Windows/Mac)
  const buildPushBridgePrompt = (key: string) => {
    const hasFullKey = Boolean(key && !key.includes('...'));
    return `Hola Antigravity, para conectar mi cuenta de WAPPY (Servidor MCP + Enlace en Tiempo Real de Tenshi Voz con auto-arranque en mi sistema), guarda este instalador oficial en mi carpeta de usuario (.gemini/antigravity/wappy-tenshi-listener.js) usando write_file y ejecútalo una sola vez con node (.gemini/antigravity/wappy-tenshi-listener.js --install) usando run_command:

\`\`\`js
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execFileSync } = require('child_process');

const homeDir = os.homedir();
const agyDir = path.join(homeDir, '.gemini', 'antigravity');
const configDir = path.join(homeDir, '.gemini', 'config');
const convDir = path.join(agyDir, 'conversations');
const listenerDest = path.join(agyDir, 'wappy-tenshi-listener.js');
const daemonDest = path.join(agyDir, 'wappy-push-daemon.js');
const envFile = path.join(agyDir, 'wappy-env.json');
const keysFile = path.join(agyDir, 'wappy-keys.json');
const threadFile = path.join(agyDir, 'wappy-tenshi-thread.json');
const pidFile = path.join(agyDir, 'wappy-push-daemon.pid');
const logFile = path.join(agyDir, 'wappy-tenshi-listener.log');

const DEFAULT_URL = '${originUrl}';
const EMBEDDED_KEY = '${hasFullKey ? key : ''}';

function log(msg) {
  const line = \`[\${new Date().toISOString()}] \${msg}\\n\`;
  try { fs.appendFileSync(logFile, line, 'utf8'); } catch (_) {}
  if (!process.argv.includes('--silent')) process.stdout.write(line);
}

function captureEnvAndConfigureMcp() {
  fs.mkdirSync(agyDir, { recursive: true });
  fs.mkdirSync(configDir, { recursive: true });

  // 1. Capturar rutas exactas de Antigravity (language_server.exe, projectId y workspace)
  try {
    let prev = {};
    if (fs.existsSync(envFile)) {
      try { prev = JSON.parse(fs.readFileSync(envFile, 'utf8')) || {}; } catch (_) {}
    }
    const agentBin = (process.env.ANTIGRAVITY_AGENTAPI_EXE && fs.existsSync(process.env.ANTIGRAVITY_AGENTAPI_EXE))
      ? process.env.ANTIGRAVITY_AGENTAPI_EXE
      : (prev.agentBin || '');
    const projectId = process.env.ANTIGRAVITY_PROJECT_ID || prev.projectId || '';
    const cwd = process.cwd();
    const workspaceCwd = (cwd && cwd !== homeDir && fs.existsSync(cwd)) ? cwd : (prev.workspaceCwd || cwd || homeDir);
    fs.writeFileSync(envFile, JSON.stringify({ agentBin, projectId, workspaceCwd, nodeBin: process.execPath, updatedAt: Date.now() }, null, 2), 'utf8');
  } catch (_) {}

  // 2. Registrar servidor MCP "wappy" en AMBOS mcp_config.json (.gemini/config y .gemini/antigravity)
  if (EMBEDDED_KEY && !EMBEDDED_KEY.includes('...') && EMBEDDED_KEY !== 'PEGA_TU_CLAVE_AQUI') {
    const sseUrl = \`\${DEFAULT_URL.replace(/\\/$/, '')}/api/mcp-bridge/sse?apiKey=\${EMBEDDED_KEY}\`;
    for (const cfgPath of [path.join(configDir, 'mcp_config.json'), path.join(agyDir, 'mcp_config.json')]) {
      try {
        let cur = {};
        if (fs.existsSync(cfgPath)) {
          try { cur = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) || {}; } catch (_) { cur = {}; }
        }
        if (!cur.mcpServers || typeof cur.mcpServers !== 'object') cur.mcpServers = {};
        cur.mcpServers.wappy = { url: sseUrl, serverUrl: sseUrl };
        fs.writeFileSync(cfgPath, JSON.stringify(cur, null, 2), 'utf8');
      } catch (_) {}
    }
    try {
      let saved = [];
      if (fs.existsSync(keysFile)) {
        try { const p = JSON.parse(fs.readFileSync(keysFile, 'utf8')); if (Array.isArray(p)) saved = p; } catch (_) {}
      }
      saved = saved.filter((x) => x && x.apiKey && x.apiKey !== EMBEDDED_KEY);
      saved.unshift({ wappyUrl: DEFAULT_URL.replace(/\\/$/, ''), apiKey: EMBEDDED_KEY, updatedAt: Date.now() });
      fs.writeFileSync(keysFile, JSON.stringify(saved.slice(0, 5), null, 2), 'utf8');
    } catch (_) {}
  }

  // 3. Pre-autorizar herramientas MCP de WAPPY en todos los proyectos locales para ejecución autónoma sin bloqueos
  try {
    const projectsDir = path.join(configDir, 'projects');
    fs.mkdirSync(projectsDir, { recursive: true });
    const outsidePath = path.join(projectsDir, 'outside-of-project.json');
    if (!fs.existsSync(outsidePath)) {
      fs.writeFileSync(outsidePath, JSON.stringify({ id: 'outside-of-project', name: 'Outside of Project', updatedAt: new Date().toISOString() }, null, 2), 'utf8');
    }
    const rules = ['mcp(wappy/*)', 'mcp(wappy-cloud/*)', 'read_url(wappy.club)'];
    for (const f of fs.readdirSync(projectsDir)) {
      if (!f.endsWith('.json')) continue;
      const fp = path.join(projectsDir, f);
      try {
        const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
        if (!raw || typeof raw !== 'object') continue;
        if (!raw.permissionGrants) raw.permissionGrants = { permissionGrants: { allow: [] }, v2Migrated: true };
        if (!raw.permissionGrants.permissionGrants) raw.permissionGrants.permissionGrants = { allow: [] };
        if (!Array.isArray(raw.permissionGrants.permissionGrants.allow)) raw.permissionGrants.permissionGrants.allow = [];
        let mod = false;
        for (const r of rules) {
          if (!raw.permissionGrants.permissionGrants.allow.includes(r)) {
            raw.permissionGrants.permissionGrants.allow.push(r);
            mod = true;
          }
        }
        if (mod) fs.writeFileSync(fp, JSON.stringify(raw, null, 2), 'utf8');
      } catch (_) {}
    }
  } catch (_) {}
}

function resolveAllCredentials() {
  const list = [];
  const seen = new Set();
  const add = (u, k) => {
    const ck = String(k || '').trim();
    if (!ck || ck === 'PEGA_TU_CLAVE_AQUI' || ck.includes('...')) return;
    if (seen.has(ck)) return;
    seen.add(ck);
    const cu = String(u || DEFAULT_URL).trim().replace(/\\/$/, '').replace(/\\/api\\/mcp-bridge.*$/, '') || 'https://wappy.club';
    list.push({ wappyUrl: cu, apiKey: ck });
  };
  add(DEFAULT_URL, EMBEDDED_KEY);
  for (const p of [path.join(configDir, 'mcp_config.json'), path.join(agyDir, 'mcp_config.json')]) {
    try {
      if (!fs.existsSync(p)) continue;
      const servers = JSON.parse(fs.readFileSync(p, 'utf8')).mcpServers || {};
      for (const s of Object.values(servers)) {
        const u = s?.serverUrl || s?.url || '';
        if (u && (u.includes('wappy') || u.includes('mcp-bridge'))) {
          const parsed = new URL(u);
          add(\`\${parsed.protocol}//\${parsed.host}\`, parsed.searchParams.get('apiKey'));
        }
      }
    } catch (_) {}
  }
  try {
    if (fs.existsSync(keysFile)) {
      const arr = JSON.parse(fs.readFileSync(keysFile, 'utf8'));
      if (Array.isArray(arr)) for (const x of arr) if (x?.apiKey) add(x.wappyUrl, x.apiKey);
    }
  } catch (_) {}
  return list;
}

function findExeRecursive(baseDir, depth = 0) {
  if (depth > 6 || !baseDir) return null;
  try {
    if (!fs.existsSync(baseDir)) return null;
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && /^(language_server.*|agentapi)\\.exe$/i.test(e.name)) return path.join(baseDir, e.name);
    }
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'locales') {
        const found = findExeRecursive(path.join(baseDir, e.name), depth + 1);
        if (found) return found;
      }
    }
  } catch (_) {}
  return null;
}

function resolveAgentBin() {
  if (process.env.ANTIGRAVITY_AGENTAPI_EXE && fs.existsSync(process.env.ANTIGRAVITY_AGENTAPI_EXE)) {
    return process.env.ANTIGRAVITY_AGENTAPI_EXE;
  }
  try {
    if (fs.existsSync(envFile)) {
      const saved = JSON.parse(fs.readFileSync(envFile, 'utf8'));
      if (saved?.agentBin && fs.existsSync(saved.agentBin)) return saved.agentBin;
    }
  } catch (_) {}
  const candidates = [
    path.join(agyDir, 'bin', 'agentapi'),
    path.join(agyDir, 'bin', 'agentapi.exe'),
    '/Applications/Antigravity.app/Contents/Resources/bin/language_server',
  ];
  if (process.platform === 'win32') {
    const localApp = process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');
    const progFiles = process.env.ProgramFiles || 'C:\\\\Program Files';
    const progFiles86 = process.env['ProgramFiles(x86)'] || 'C:\\\\Program Files (x86)';
    candidates.push(
      path.join(localApp, 'Programs', 'Antigravity', 'resources', 'bin', 'language_server.exe'),
      path.join(localApp, 'Programs', 'Antigravity', 'bin', 'language_server.exe'),
      path.join(localApp, 'Antigravity', 'resources', 'bin', 'language_server.exe'),
      path.join(progFiles, 'Antigravity', 'resources', 'bin', 'language_server.exe'),
      path.join(agyDir, 'bin', 'agentapi.bat'),
      path.join(agyDir, 'bin', 'agentapi.cmd')
    );
    for (const rootDir of [path.join(localApp, 'Programs', 'Antigravity'), path.join(localApp, 'Antigravity'), path.join(progFiles, 'Antigravity'), path.join(progFiles86, 'Antigravity')]) {
      const found = findExeRecursive(rootDir, 0);
      if (found) candidates.unshift(found);
    }
  }
  for (const c of candidates) {
    try {
      if (!fs.existsSync(c)) continue;
      if (process.platform === 'win32' && !/\\.(exe|bat|cmd)$/i.test(c)) {
        try {
          const sh = fs.readFileSync(c, 'utf8');
          const m = sh.match(/"([^"]+\\.exe)"/i) || sh.match(/([A-Za-z]:[^\\s"']+\\.exe)/i);
          if (m && m[1] && fs.existsSync(m[1])) return m[1];
        } catch (_) {}
        continue;
      }
      return c;
    } catch (_) {}
  }
  return process.platform === 'win32' ? 'agentapi.bat' : 'agentapi';
}

function runAgentApi(agentBin, subArgs, opts = {}) {
  const isLangServer = /language_server/i.test(agentBin);
  const fullArgs = isLangServer ? ['agentapi', ...subArgs] : subArgs;
  const isBatch = /\\.(bat|cmd)$/i.test(agentBin);
  return execFileSync(agentBin, fullArgs, { windowsHide: true, ...opts, ...(isBatch ? { shell: true } : {}) });
}

function findProjectIdForFolder(folderPath) {
  if (!folderPath) return '';
  try {
    const projectsDir = path.join(configDir, 'projects');
    if (!fs.existsSync(projectsDir)) return '';
    const norm = path.resolve(folderPath).toLowerCase();
    for (const f of fs.readdirSync(projectsDir)) {
      if (!f.endsWith('.json') || f === 'outside-of-project.json') continue;
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(projectsDir, f), 'utf8'));
        for (const r of (raw?.projectResources?.resources || [])) {
          const uri = r?.gitFolder?.folderUri || r?.folder?.folderUri || r?.folderUri || '';
          if (uri.startsWith('file://')) {
            let p = decodeURIComponent(uri.replace(/^file:\\/\\//, ''));
            if (process.platform === 'win32' && /^\\/[a-zA-Z]:/.test(p)) p = p.slice(1);
            if (path.resolve(p).toLowerCase() === norm) return raw.id || f.replace(/\\.json$/, '');
          }
        }
      } catch (_) {}
    }
  } catch (_) {}
  return '';
}

function resolveWorkspaceTarget(agentBin) {
  try {
    if (fs.existsSync(convDir)) {
      const files = fs.readdirSync(convDir)
        .filter((f) => /^[0-9a-fA-F-]{36}\\.db$/.test(f))
        .map((f) => ({ id: f.replace(/\\.db$/, ''), mtime: fs.statSync(path.join(convDir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, 6);
      for (const item of files) {
        try {
          const out = runAgentApi(agentBin, ['get-conversation-metadata', item.id], { timeout: 3000, stdio: 'pipe', encoding: 'utf8' });
          const uris = JSON.parse(out)?.response?.conversationMetadata?.metadata?.workspaceUris || [];
          for (const u of uris) {
            if (typeof u === 'string' && u.startsWith('file://')) {
              let p = decodeURIComponent(u.replace(/^file:\\/\\//, ''));
              if (process.platform === 'win32' && /^\\/[a-zA-Z]:/.test(p)) p = p.slice(1);
              if (fs.existsSync(p)) return { cwd: p, projectId: findProjectIdForFolder(p) };
            }
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
  try {
    const projectsDir = path.join(configDir, 'projects');
    if (fs.existsSync(projectsDir)) {
      let bestFolder = null, bestId = '', bestMtime = 0;
      for (const f of fs.readdirSync(projectsDir)) {
        if (!f.endsWith('.json') || f === 'outside-of-project.json') continue;
        const fp = path.join(projectsDir, f);
        try {
          const st = fs.statSync(fp);
          const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
          for (const r of (raw?.projectResources?.resources || [])) {
            const uri = r?.gitFolder?.folderUri || r?.folder?.folderUri || r?.folderUri || '';
            if (uri.startsWith('file://')) {
              let p = decodeURIComponent(uri.replace(/^file:\\/\\//, ''));
              if (process.platform === 'win32' && /^\\/[a-zA-Z]:/.test(p)) p = p.slice(1);
              if (fs.existsSync(p) && st.mtimeMs >= bestMtime) {
                bestMtime = st.mtimeMs;
                bestFolder = p;
                bestId = raw.id || f.replace(/\\.json$/, '');
              }
            }
          }
        } catch (_) {}
      }
      if (bestFolder) return { cwd: bestFolder, projectId: bestId };
    }
  } catch (_) {}
  try {
    if (fs.existsSync(envFile)) {
      const saved = JSON.parse(fs.readFileSync(envFile, 'utf8'));
      if (saved?.workspaceCwd && fs.existsSync(saved.workspaceCwd)) {
        return { cwd: saved.workspaceCwd, projectId: saved.projectId || findProjectIdForFolder(saved.workspaceCwd) };
      }
    }
  } catch (_) {}
  return { cwd: homeDir, projectId: 'outside-of-project' };
}

function reportDispatch(id, wappyUrl, apiKey, payload) {
  try {
    const url = \`\${wappyUrl}/api/mcp-bridge/antigravity/ordenes/\${encodeURIComponent(id)}/dispatch-log?apiKey=\${encodeURIComponent(apiKey)}\`;
    const client = url.startsWith('https') ? https : http;
    const body = JSON.stringify({ ...payload, platform: process.platform });
    const req = client.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, () => {});
    req.on('error', () => {});
    req.write(body);
    req.end();
  } catch (_) {}
}

function handleOrden(orden, wappyUrl, apiKey) {
  const id = String(orden.id || orden.ordenId || orden._id || '').trim();
  if (!id) return;
  const claimUrl = \`\${wappyUrl}/api/mcp-bridge/antigravity/ordenes/\${encodeURIComponent(id)}/claim?apiKey=\${encodeURIComponent(apiKey)}\`;
  const client = claimUrl.startsWith('https') ? https : http;
  const req = client.request(claimUrl, { method: 'POST' }, (res) => {
    let body = '';
    res.on('data', (c) => (body += c));
    res.on('end', () => {
      if (res.statusCode !== 200) return;
      try {
        const parsed = JSON.parse(body);
        if (parsed && parsed.claimed === false) return;
      } catch (_) {}
      dispatchToAgent(id, orden, wappyUrl, apiKey);
    });
  });
  req.on('error', (e) => log('Error reclamando orden: ' + e.message));
  req.end();
}

function dispatchToAgent(id, orden, wappyUrl, apiKey) {
  const agentBin = resolveAgentBin();
  const { cwd, projectId } = resolveWorkspaceTarget(agentBin);
  const spawnEnv = { ...process.env, ...(projectId ? { ANTIGRAVITY_PROJECT_ID: projectId } : {}) };
  const titulo = String(orden.titulo || orden.title || 'Consulta de Tenshi').slice(0, 60);
  const instruccion = orden.instruccion || orden.descripcion || orden.pregunta || '';
  const formato = String(orden.formatoEntregable || orden.formato || 'respuesta').toLowerCase().trim();
  const outFmt = formato === 'html' ? 'html' : formato === 'documento' ? 'documento' : 'respuesta';
  const prompt = [
    \`⚡ [ORDEN EN TIEMPO REAL DE TENSHI — WAPPY]\`,
    \`ID de Orden: \${id}\`,
    \`Formato Solicitado: \${outFmt}\`,
    \`Instrucción del Usuario:\`,
    instruccion,
    \`\`,
    \`Usa tus herramientas MCP de 'wappy' si necesitas consultar datos de la empresa. Al finalizar, invoca OBLIGATORIAMENTE la herramienta MCP 'wappy_completar_orden_delegada_tenshi' enviando ordenId="\${id}", formato="\${outFmt}", resultado (resumen o respuesta directa) y contenido (Markdown o HTML si aplica).\`,
    \`(Respaldo directo: si la herramienta MCP aún no aparece cargada en esta ventana, ejecuta con run_command: node "\${listenerDest}" --complete-order="\${id}" --formato="\${outFmt}" --resultado="<TU_RESPUESTA_AQUI>")\`,
  ].join('\\n');

  const forceNew = /(nuevo chat|nueva conversaci|desde cero)/i.test(\`\${titulo} \${instruccion}\`);
  let convoId = '';
  if (!forceNew && fs.existsSync(threadFile)) {
    try {
      const saved = JSON.parse(fs.readFileSync(threadFile, 'utf8'));
      if (saved.conversationId && Date.now() - (saved.lastUsedAt || 0) < 7200000 && fs.existsSync(path.join(convDir, \`\${saved.conversationId}.db\`))) {
        convoId = saved.conversationId;
      }
    } catch (_) {}
  }

  if (convoId) {
    try {
      runAgentApi(agentBin, ['send-message', \`--title=⚡ Tenshi: \${titulo}\`, convoId, prompt], { cwd, env: spawnEnv, timeout: 15000 });
      fs.writeFileSync(threadFile, JSON.stringify({ conversationId: convoId, lastUsedAt: Date.now() }, null, 2), 'utf8');
      log(\`✅ Orden \${id} enviada al chat activo \${convoId}\`);
      reportDispatch(id, wappyUrl, apiKey, { ok: true, conversationId: convoId, cwd, bin: agentBin });
      return;
    } catch (e) { log('Aviso send-message falló, abriendo nuevo chat: ' + e.message); }
  }

  try {
    const before = new Set(fs.existsSync(convDir) ? fs.readdirSync(convDir).filter((f) => f.endsWith('.db')).map((f) => f.replace(/\\.db$/, '')) : []);
    const out = runAgentApi(agentBin, ['new-conversation', \`--title=⚡ Tenshi: \${titulo}\`, prompt], { cwd, env: spawnEnv, encoding: 'utf8', timeout: 15000 }) || '';
    const match = out.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    let newId = match ? match[0] : '';
    if (!newId && fs.existsSync(convDir)) {
      const added = fs.readdirSync(convDir).filter((f) => f.endsWith('.db')).map((f) => f.replace(/\\.db$/, '')).filter((x) => !before.has(x));
      if (added.length > 0) newId = added[0];
    }
    if (newId) fs.writeFileSync(threadFile, JSON.stringify({ conversationId: newId, lastUsedAt: Date.now() }, null, 2), 'utf8');
    log(\`✅ Nuevo chat de Tenshi abierto (\${newId || 'ok'}) en workspace \${cwd}\`);
    reportDispatch(id, wappyUrl, apiKey, { ok: true, conversationId: newId || 'new', cwd, bin: agentBin });
  } catch (e) {
    log('❌ Error ejecutando agentapi new-conversation: ' + e.message);
    reportDispatch(id, wappyUrl, apiKey, { ok: false, error: e.message, cwd, bin: agentBin });
  }
}

function completeOrderCli() {
  const getArg = (name) => {
    const pref = \`--\${name}=\`;
    const found = process.argv.find((a) => a.startsWith(pref));
    return found ? found.slice(pref.length) : '';
  };
  const ordenId = getArg('complete-order') || getArg('orden-id');
  const formato = getArg('formato') || 'respuesta';
  const resultado = getArg('resultado') || getArg('resumen') || 'Consulta procesada exitosamente.';
  let contenido = getArg('contenido') || resultado;
  const cFile = getArg('contenido-file');
  if (cFile && fs.existsSync(cFile)) {
    try { contenido = fs.readFileSync(cFile, 'utf8'); } catch (_) {}
  }
  const creds = resolveAllCredentials();
  if (!ordenId || creds.length === 0) process.exit(1);
  const { wappyUrl, apiKey } = creds[0];
  const url = \`\${wappyUrl}/api/mcp-bridge/antigravity/completar?apiKey=\${encodeURIComponent(apiKey)}\`;
  const client = url.startsWith('https') ? https : http;
  const body = JSON.stringify({ ordenId, formato, resultado, contenido });
  const req = client.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, Authorization: \`Bearer \${apiKey}\`, 'Content-Length': Buffer.byteLength(body) } }, (res) => {
    res.on('data', () => {});
    res.on('end', () => { console.log('✅ Entregado a Tenshi (HTTP ' + res.statusCode + ')'); process.exit(0); });
  });
  req.on('error', (e) => { console.error(e.message); process.exit(1); });
  req.write(body);
  req.end();
}

function startWorker() {
  process.on('uncaughtException', (e) => log('Aviso uncaughtException: ' + (e?.message || e)));
  process.on('unhandledRejection', (r) => log('Aviso unhandledRejection: ' + r));
  try {
    if (fs.existsSync(pidFile)) {
      const oldPid = parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10);
      if (oldPid && oldPid !== process.pid) {
        try { process.kill(oldPid, 0); process.exit(0); } catch (_) {}
      }
    }
  } catch (_) {}
  fs.writeFileSync(pidFile, String(process.pid), 'utf8');

  const activeStreams = new Set();
  const startStream = ({ wappyUrl, apiKey }) => {
    if (activeStreams.has(apiKey)) return;
    activeStreams.add(apiKey);
    const connectOne = () => {
      const streamUrl = \`\${wappyUrl}/api/mcp-bridge/antigravity/stream?apiKey=\${encodeURIComponent(apiKey)}\`;
      const client = streamUrl.startsWith('https') ? https : http;
      let reconnecting = false, watchdog = null, activeReq = null;
      const scheduleReconnect = (reason, delay = 3000) => {
        if (reconnecting) return;
        reconnecting = true;
        if (watchdog) clearInterval(watchdog);
        try { if (activeReq) activeReq.destroy(); } catch (_) {}
        if (reason) log(reason);
        setTimeout(connectOne, delay);
      };
      activeReq = client.get(streamUrl, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return scheduleReconnect(\`Error HTTP \${res.statusCode} en SSE. Reintentando...\`, 4000);
        }
        log('🟢 Conectado en tiempo real a Tenshi WAPPY SSE (' + apiKey.slice(0, 15) + '...). Escuchando órdenes...');
        let lastChunkAt = Date.now();
        watchdog = setInterval(() => {
          if (Date.now() - lastChunkAt > 45000) scheduleReconnect('🔄 Silencio en stream SSE (>45s). Reconectando...', 1500);
        }, 15000);
        let buf = '', ev = '';
        res.on('data', (chunk) => {
          lastChunkAt = Date.now();
          buf += chunk.toString();
          const lines = buf.split(/\\r?\\n/);
          buf = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('event:')) ev = line.slice(6).trim();
            else if (line.startsWith('data:') && ev === 'nueva_orden') {
              try { handleOrden(JSON.parse(line.slice(5).trim()), wappyUrl, apiKey); } catch (e) { log('Error parseando orden: ' + e.message); }
            }
          }
        });
        res.on('end', () => scheduleReconnect('Stream SSE cerrado. Reconectando...', 3000));
        res.on('close', () => scheduleReconnect('Conexión SSE cerrada. Reconectando...', 3000));
        res.on('error', (e) => scheduleReconnect('Error lectura SSE: ' + e.message, 3000));
      });
      activeReq.on('error', (e) => scheduleReconnect('Error red SSE: ' + e.message, 4000));
    };
    connectOne();
  };

  const syncAll = () => {
    const creds = resolveAllCredentials();
    for (const c of creds) startStream(c);
  };
  syncAll();
  setInterval(syncAll, 20000);
}

function installAndStart() {
  captureEnvAndConfigureMcp();
  try {
    const cur = path.resolve(__filename);
    for (const dest of [listenerDest, daemonDest]) {
      if (cur !== path.resolve(dest)) {
        fs.copyFileSync(cur, dest);
        try { fs.chmodSync(dest, 0o755); } catch (_) {}
      }
    }
  } catch (_) {}

  if (fs.existsSync(pidFile)) {
    try {
      const oldPid = parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10);
      if (oldPid && oldPid !== process.pid) process.kill(oldPid, 'SIGTERM');
      fs.unlinkSync(pidFile);
    } catch (_) {}
  }

  const scriptToRun = fs.existsSync(listenerDest) ? listenerDest : __filename;
  const nodeBin = process.execPath;

  if (process.platform === 'darwin') {
    try {
      const laDir = path.join(homeDir, 'Library', 'LaunchAgents');
      fs.mkdirSync(laDir, { recursive: true });
      const plist = path.join(laDir, 'club.wappy.antigravity.bridge.plist');
      try { execFileSync('launchctl', ['unload', plist], { stdio: 'ignore' }); } catch (_) {}
      fs.writeFileSync(plist, \`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>club.wappy.antigravity.bridge</string>
  <key>ProgramArguments</key><array><string>\${nodeBin}</string><string>\${scriptToRun}</string><string>--worker</string><string>--silent</string></array>
  <key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/dev/null</string><key>StandardErrorPath</key><string>\${logFile}</string>
</dict></plist>\`, 'utf8');
      try { execFileSync('launchctl', ['load', '-w', plist], { stdio: 'ignore' }); } catch (_) {}
    } catch (_) {}
  } else if (process.platform === 'win32') {
    try {
      const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
      const startupDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
      fs.mkdirSync(startupDir, { recursive: true });
      const vbsPath = path.join(startupDir, 'WappyAntigravityBridge.vbs');
      fs.writeFileSync(vbsPath, \`Set WshShell = CreateObject("WScript.Shell")\\r\\nWshShell.Run """\${nodeBin}"" ""\${scriptToRun}"" --worker --silent", 0, False\\r\\n\`, 'utf8');
      try {
        execFileSync('reg', ['add', 'HKCU\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run', '/v', 'WappyAntigravityBridge', '/t', 'REG_SZ', '/d', \`"wscript.exe" "\${vbsPath}"\`, '/f'], { stdio: 'ignore', windowsHide: true });
      } catch (_) {}
    } catch (_) {}
  }

  const child = spawn(nodeBin, [scriptToRun, '--worker', '--silent'], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  fs.writeFileSync(pidFile, String(child.pid), 'utf8');
  console.log('✅ Servidor MCP "wappy" y Puente Reactivo Tenshi instalados con auto-arranque permanente (PID: ' + child.pid + ').');
  process.exit(0);
}

if (process.argv.some((a) => a.startsWith('--complete-order='))) {
  completeOrderCli();
} else if (process.argv.includes('--worker')) {
  startWorker();
} else {
  installAndStart();
}
\`\`\`

Confírmame apenas quede instalado y corriendo.`;
  };

  const cronOnlyPrompt = buildPushBridgePrompt(effectiveKey);

  // Paso 1: Instala tanto el servidor MCP "wappy" en ambos mcp_config.json como el listener permanente con auto-arranque en 1 solo paso
  const buildAntigravityPrompt = (_url: string, keyForPrompt = effectiveKey) => buildPushBridgePrompt(keyForPrompt);

  const antigravityPrompt = buildAntigravityPrompt(sseServerUrl, effectiveKey);

  // Paso 2: Mensaje para verificar la conexión en un nuevo chat de Antigravity
  const verifyConnectionPrompt = `Hola Antigravity, usa las herramientas de mi servidor MCP "wappy" (como wappy_consultar_perfil_empresa y wappy_resumen_general_360) y dame un resumen ejecutivo de mi empresa en WAPPY para confirmar que ya estamos conectados.`;

  // Configuración JSON para mcp_config.json
  const antigravityJsonConfig = JSON.stringify(
    {
      mcpServers: {
        wappy: {
          url: sseServerUrl,
          serverUrl: sseServerUrl,
        },
      },
    },
    null,
    2
  );

  const copyToClipboard = async (text: string, type: 'key' | 'config' | 'prompt' | 'verify' | 'cron' | 'local') => {
    if (type === 'verify') {
      navigator.clipboard.writeText(verifyConnectionPrompt);
      setCopiedVerify(true);
      setTimeout(() => setCopiedVerify(false), 2000);
      showToast({ message: 'Mensaje del Paso 2 copiado al portapapeles', status: 'success' });
      return;
    }

    let keyToUse = newKeyGenerated || fullKeyFromList;
    if (!keyToUse && (type === 'config' || type === 'prompt' || type === 'local' || type === 'cron')) {
      keyToUse = await handleCreateKey();
    }

    if (type === 'cron') {
      const pushText = buildPushBridgePrompt(keyToUse || effectiveKey);
      navigator.clipboard.writeText(pushText);
      setCopiedCron(true);
      setTimeout(() => setCopiedCron(false), 2000);
      showToast({ message: 'Mensaje del Paso 3 copiado al portapapeles', status: 'success' });
      return;
    }

    let textToCopy = text;
    if (keyToUse) {
      const liveSseUrl = `${originUrl}/api/mcp-bridge/sse?apiKey=${keyToUse}`;
      if (type === 'key') {
        textToCopy = keyToUse;
      } else if (type === 'prompt') {
        textToCopy = buildAntigravityPrompt(liveSseUrl, keyToUse);
      } else if (type === 'config') {
        textToCopy = JSON.stringify(
          {
            mcpServers: {
              wappy: {
                url: liveSseUrl,
                serverUrl: liveSseUrl,
              },
            },
          },
          null,
          2
        );
      } else if (type === 'local') {
        textToCopy = JSON.stringify(
          {
            mcpServers: {
              wappy: {
                command: 'node',
                args: ['bin/wappy-mcp.js'],
                env: {
                  WAPPY_URL: originUrl,
                  WAPPY_API_KEY: keyToUse,
                },
              },
            },
          },
          null,
          2
        );
      }
    }

    navigator.clipboard.writeText(textToCopy);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === 'config') {
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    } else if (type === 'prompt') {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else if (type === 'local') {
      setCopiedLocal(true);
      setTimeout(() => setCopiedLocal(false), 2000);
    }
    showToast({ message: 'Copiado al portapapeles con tu clave activa', status: 'success' });
  };

  // Configuración opcional Stdio para desarrolladores
  const localStdioConfig = JSON.stringify(
    {
      mcpServers: {
        wappy: {
          command: 'node',
          args: ['bin/wappy-mcp.js'],
          env: {
            WAPPY_URL: originUrl,
            WAPPY_API_KEY: effectiveKey,
          },
        },
      },
    },
    null,
    2
  );

  const toolsCatalog = [
    {
      categoria: 'Diagnóstico & Estrategia',
      tools: [
        {
          name: 'wappy_resumen_general_360',
          desc: 'Diagnóstico 360° total de la cuenta: empresa, trabajadores, riesgos GTC45/PESV, comités, EPP, químicos, flota, incidentes ATEL y tareas pendientes.',
          icon: Activity,
          color: 'text-rose-500',
        },
        {
          name: 'wappy_consultar_perfil_empresa',
          desc: 'Consulta Razón Social, NIT, ARL, Nivel de Riesgo, Representante Legal, Responsable SST, Licencia y Sedes activas de tu perfil.',
          icon: Users,
          color: 'text-teal-500',
        },
        {
          name: 'wappy_actualizar_perfil_empresa',
          desc: 'Actualiza cualquier dato de la empresa y sincroniza de inmediato la memoria de contexto de todos los agentes inteligentes en WAPPY.',
          icon: Sparkles,
          color: 'text-orange-500',
        },
      ],
    },
    {
      categoria: 'Matrices de Riesgo & Cumplimiento',
      tools: [
        {
          name: 'wappy_consultar_matriz_gtc45',
          desc: 'Consulta los peligros y riesgos evaluados en la Matriz GTC-45 oficial con filtros por cargo, proceso o clasificación de peligro.',
          icon: FileSpreadsheet,
          color: 'text-emerald-500',
        },
        {
          name: 'wappy_alimentar_matriz_gtc45',
          desc: 'Inserta nuevos peligros evaluados. Calcula automáticamente deficiencia (ND), exposición (NE), consecuencia (NC) y riesgo (NR).',
          icon: Plus,
          color: 'text-blue-500',
        },
        {
          name: 'wappy_consultar_matriz_pesv',
          desc: 'Consulta los riesgos viales registrados según el Plan Estratégico de Seguridad Vial (Res. 20223040040595).',
          icon: Layers,
          color: 'text-amber-500',
        },
        {
          name: 'wappy_alimentar_matriz_pesv',
          desc: 'Registra riesgos y planes de acción viales (vehículo, vía e individuo) en la Matriz PESV oficial de la empresa.',
          icon: CheckCircle2,
          color: 'text-indigo-500',
        },
        {
          name: 'wappy_consultar_matriz_legal',
          desc: 'Consulta la matriz de requisitos legales aplicables, artículos, evidencia de cumplimiento y porcentaje global.',
          icon: FileCheck,
          color: 'text-purple-500',
        },
        {
          name: 'wappy_registrar_requisito_legal',
          desc: 'Registra una nueva norma legal con artículo, evidencia requerida, responsable y estado de cumplimiento.',
          icon: Plus,
          color: 'text-purple-400',
        },
        {
          name: 'wappy_consultar_diagnostico_0312',
          desc: 'Consulta la autoevaluación de estándares mínimos Res. 0312 (puntaje obtenido, porcentaje y nivel: Crítico / Moderado / Aceptable).',
          icon: ClipboardList,
          color: 'text-blue-600',
        },
        {
          name: 'wappy_evaluar_estandar_0312',
          desc: 'Califica o actualiza un estándar mínimo con su observación, evidencia y puntaje.',
          icon: CheckSquare,
          color: 'text-blue-500',
        },
      ],
    },
    {
      categoria: 'Gestión Operativa & Colaboradores',
      tools: [
        {
          name: 'wappy_consultar_trabajadores',
          desc: 'Lista empleados y colaboradores registrados en el perfil sociodemográfico (cédula, cargo, área, sede, nivel ARL).',
          icon: Users,
          color: 'text-cyan-500',
        },
        {
          name: 'wappy_registrar_trabajador',
          desc: 'Registra un trabajador con todas sus variables sociodemográficas, biométricas y contractuales en el sistema.',
          icon: Plus,
          color: 'text-emerald-500',
        },
        {
          name: 'wappy_actualizar_trabajador',
          desc: 'Edita y actualiza cualquier variable sociodemográfica, médica, cargo, salario o estado laboral del trabajador.',
          icon: Edit3,
          color: 'text-amber-500',
        },
        {
          name: 'wappy_eliminar_trabajador',
          desc: 'Elimina permanentemente a un colaborador por cédula, ID o nombre en Huella Biocéntrica y SgsstWorker.',
          icon: Trash2,
          color: 'text-rose-500',
        },
        {
          name: 'wappy_consultar_comites',
          desc: 'Consulta la conformación de COPASST / Vigía, Comité de Convivencia Laboral y Brigada de Emergencia.',
          icon: Shield,
          color: 'text-orange-500',
        },
        {
          name: 'wappy_registrar_miembro_comite',
          desc: 'Registra un integrante en COPASST, Convivencia o en las brigadas de emergencia (Primeros Auxilios, Evacuación, Incendios).',
          icon: Plus,
          color: 'text-amber-500',
        },
        {
          name: 'wappy_consultar_epp',
          desc: 'Consulta entregas e historial de Elementos de Protección Personal (EPP) y equipos de protección contra caídas por colaborador.',
          icon: HardHat,
          color: 'text-yellow-600',
        },
        {
          name: 'wappy_registrar_entrega_epp',
          desc: 'Registra la entrega de un EPP o equipo con serial y fecha de reposición a un colaborador.',
          icon: Plus,
          color: 'text-yellow-500',
        },
        {
          name: 'wappy_consultar_perfiles_cargo',
          desc: 'Consulta perfiles de cargo SST con responsabilidades específicas, funciones, riesgos asignados y EPP requeridos.',
          icon: FileText,
          color: 'text-teal-600',
        },
        {
          name: 'wappy_guardar_perfil_cargo',
          desc: 'Crea o actualiza el perfil y responsabilidades SST de un puesto de trabajo.',
          icon: Plus,
          color: 'text-teal-500',
        },
      ],
    },
    {
      categoria: 'Seguridad Industrial & Prevención',
      tools: [
        {
          name: 'wappy_consultar_inventario_quimico',
          desc: 'Lista de sustancias químicas, estado físico, pictogramas SGA, clase ONU, FDS, ubicación e incompatibilidades de almacenamiento.',
          icon: FlaskConical,
          color: 'text-lime-600',
        },
        {
          name: 'wappy_registrar_producto_quimico',
          desc: 'Registra un producto químico en el inventario con etiquetado SGA y matriz de compatibilidad.',
          icon: Plus,
          color: 'text-lime-500',
        },
        {
          name: 'wappy_consultar_vehiculos',
          desc: 'Consulta vehículos de la flota, conductor asignado, vencimiento de SOAT, Tecnomecánica e historial de inspecciones.',
          icon: Car,
          color: 'text-red-500',
        },
        {
          name: 'wappy_registrar_vehiculo',
          desc: 'Registra un vehículo de la empresa y programa alertas de vencimiento de documentos obligatorios.',
          icon: Plus,
          color: 'text-red-400',
        },
        {
          name: 'wappy_consultar_reportes_actos_condiciones',
          desc: 'Consulta tarjetas de reporte preventivo de actos y condiciones inseguras reportados por los colaboradores.',
          icon: ShieldAlert,
          color: 'text-amber-600',
        },
        {
          name: 'wappy_registrar_reporte_acto_condicion',
          desc: 'Registra una condición o acto inseguro detectado con nivel de riesgo y medida correctiva inmediata.',
          icon: Plus,
          color: 'text-amber-500',
        },
        {
          name: 'wappy_consultar_casos_atel',
          desc: 'Consulta investigaciones y registros de accidentes e incidentes de trabajo ocurridos en la empresa.',
          icon: Activity,
          color: 'text-rose-600',
        },
        {
          name: 'wappy_registrar_caso_atel',
          desc: 'Registra un accidente o incidente de trabajo con gravedad, descripción y medidas inmediatas para su investigación.',
          icon: Plus,
          color: 'text-rose-500',
        },
      ],
    },
    {
      categoria: 'Cronograma, LMS & Agentes Autónomos',
      tools: [
        {
          name: 'wappy_consultar_cronograma_sst',
          desc: 'Consulta las tareas pendientes, estado y vencimientos del cronograma y plan de trabajo anual de SST.',
          icon: CalendarCheck,
          color: 'text-purple-500',
        },
        {
          name: 'wappy_crear_actividad_cronograma',
          desc: 'Programa actividades de capacitación, auditorías, inspecciones o hitos en el plan de trabajo anual.',
          icon: Plus,
          color: 'text-purple-400',
        },
        {
          name: 'wappy_actualizar_estado_tarea',
          desc: 'Actualiza el estado de una tarea (todo, in_progress, done) y agrega observaciones de avance.',
          icon: CheckCircle2,
          color: 'text-emerald-500',
        },
        {
          name: 'wappy_consultar_capacitaciones',
          desc: 'Consulta sesiones del programa anual de capacitación y catálogo de cursos interactivos del LMS WAPPY.',
          icon: BookOpen,
          color: 'text-sky-500',
        },
        {
          name: 'wappy_programar_capacitacion',
          desc: 'Programa una sesión de formación para el personal con fecha, hora, duración y temario.',
          icon: Plus,
          color: 'text-sky-400',
        },
        {
          name: 'wappy_consultar_auditorias',
          desc: 'Consulta hallazgos, no conformidades y nivel de cumplimiento de auditorías internas del SG-SST.',
          icon: ClipboardList,
          color: 'text-indigo-600',
        },
        {
          name: 'wappy_registrar_hallazgo_auditoria',
          desc: 'Registra un hallazgo o no conformidad con plan de acción correctivo y fecha compromiso.',
          icon: Plus,
          color: 'text-indigo-500',
        },
        {
          name: 'wappy_consultar_agentes_y_automatizaciones',
          desc: 'Consulta los agentes de IA configurados en tu cuenta y las tareas autónomas programadas (cron).',
          icon: Bot,
          color: 'text-emerald-600',
        },
        {
          name: 'wappy_programar_automatizacion',
          desc: 'Programa un agente de IA para que ejecute tareas periódicas autónomamente (diaria, semanal, mensual).',
          icon: Plus,
          color: 'text-emerald-500',
        },
        {
          name: 'wappy_consultar_conversaciones',
          desc: 'Consulta tus conversaciones con los agentes de WAPPY con títulos y fechas de actualización.',
          icon: FileText,
          color: 'text-slate-600',
        },
        {
          name: 'wappy_consultar_mensajes_conversacion',
          desc: 'Lee el historial de mensajes de cualquier conversación en tu cuenta de LibreChat-WAPPY.',
          icon: FileText,
          color: 'text-slate-500',
        },
        {
          name: 'wappy_consultar_archivos',
          desc: 'Lista todos los documentos y archivos subidos o procesados en tu cuenta.',
          icon: FolderArchive,
          color: 'text-slate-600',
        },
      ],
    },
  ];

  const totalHerramientas = toolsCatalog.reduce((acc, cat) => acc + cat.tools.length, 0);

  return (
    <div className="flex flex-col gap-6 w-full text-slate-800 dark:text-zinc-100">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-teal-500/10 border border-orange-500/20 dark:border-orange-500/30">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Conexión Total Antigravity (MCP)</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                Acceso Total
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Conecta Antigravity a tu cuenta de WAPPY para que consulte y gestione absolutamente todos los módulos: matrices, normas, vehículos, comités, EPP, cronograma, cursos y agentes.
            </p>
          </div>
        </div>

        <ExpandingButton
          onClick={handleCreateKey}
          disabled={creating}
          isLoading={creating}
          icon={Plus}
          label={creating ? 'Generando...' : 'Generar Clave API'}
          variant="orange"
          title="Generar nueva Clave API para Antigravity"
        />
      </div>

      {/* Alerta de Clave Recién Generada */}
      {newKeyGenerated && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/20 text-slate-800 dark:text-zinc-100 flex flex-col gap-2.5 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>¡Guarda tu clave de acceso personal! Por seguridad no se volverá a mostrar completa:</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-amber-500/40 rounded-xl p-2.5 font-mono text-xs text-amber-600 dark:text-amber-300 select-all break-all">
            <span className="flex-1">{newKeyGenerated}</span>
            <ExpandingButton
              onClick={() => copyToClipboard(newKeyGenerated, 'key')}
              icon={copiedKey ? Check : Copy}
              label={copiedKey ? 'Copiada' : 'Copiar Clave'}
              variant="orange"
              size="sm"
              title="Copiar Clave API al portapapeles"
            />
          </div>
        </div>
      )}

      {/* Selector de Pestañas (Toolbar Cápsula WAPPY) */}
      <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none w-fit">
        <button
          onClick={() => setActiveTab('config')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95',
            activeTab === 'config'
              ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-2xs'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-transparent'
          )}
        >
          <Terminal className="w-3.5 h-3.5" />
          Configuración Antigravity
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95',
            activeTab === 'tools'
              ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-2xs'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-transparent'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          Herramientas Disponibles ({totalHerramientas})
        </button>
        <button
          onClick={() => setActiveTab('keys')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95',
            activeTab === 'keys'
              ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-2xs'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-transparent'
          )}
        >
          <Key className="w-3.5 h-3.5" />
          Mis Claves ({keys.length})
        </button>
      </div>

      {/* Tab: Configuración Antigravity (Guía Paso a Paso Simple) */}
      {activeTab === 'config' && (
        <div className="flex flex-col gap-5">
          {/* Guía Rápida de 3 Pasos arriba para orientar al usuario desde el primer vistazo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                <span className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center text-xs font-black">1</span>
                <span>Conecta tu cuenta</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                Copia el <strong>Paso 1</strong> de abajo y pégalo en el chat de <strong>Antigravity</strong> (Mac o Windows) para registrar tu clave.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400">
                <span className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center text-xs font-black">2</span>
                <span>Abre un nuevo chat y prueba</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                Reinicia Antigravity (o haz clic en <strong>+ New Conversation</strong>) y pega el <strong>Paso 2</strong> para ver el resumen de tu empresa.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-black">3</span>
                <span>Enlaza Tenshi Voz (Opcional)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                Si quieres que Tenshi te abra chats desde tu celular, copia el <strong>Paso 3</strong> y pégalo también en el <strong>Chat de Antigravity</strong>.
              </p>
            </div>
          </div>

          {/* PASO 1: Conectar cuenta en el Chat de Antigravity */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-orange-500/30 dark:border-orange-500/30 flex flex-col gap-3 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 font-black text-xs shrink-0">
                  1
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Paso 1: Copia y pega este mensaje en el chat de Antigravity
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500 text-white shadow-2xs">
                      Obligatorio • 1 Clic
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Registra las {totalHerramientas} herramientas de tu cuenta WAPPY, pre-autoriza la ejecución autónoma y activa el enlace permanente de Tenshi Voz con auto-arranque en Windows y Mac:
                  </p>
                </div>
              </div>

              <ExpandingButton
                onClick={() => copyToClipboard(antigravityPrompt, 'prompt')}
                icon={copiedPrompt ? Check : Copy}
                label={copiedPrompt ? '¡Paso 1 Copiado!' : 'Copiar Paso 1'}
                variant="orange"
                title="Copiar mensaje del Paso 1 para pegar en el chat de Antigravity"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-orange-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-mono text-xs border border-orange-200/60 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap select-all max-h-56 overflow-y-auto">
              {antigravityPrompt}
            </div>
          </div>

          {/* PASO 2: Reiniciar / Nuevo Chat y Verificar Conexión */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-teal-500/30 dark:border-teal-500/30 flex flex-col gap-3 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-xs shrink-0">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Paso 2: Abre un nuevo chat (+ New Conversation) y pega este mensaje
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-600 text-white shadow-2xs">
                      Verificación
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Cuando Antigravity termine el Paso 1, reinícialo o abre una <strong>Nueva Conversación</strong> para cargar las herramientas y pega esto:
                  </p>
                </div>
              </div>

              <ExpandingButton
                onClick={() => copyToClipboard(verifyConnectionPrompt, 'verify')}
                icon={copiedVerify ? Check : Copy}
                label={copiedVerify ? '¡Paso 2 Copiado!' : 'Copiar Paso 2'}
                variant="teal"
                title="Copiar mensaje del Paso 2 para probar tu conexión"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/40 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-mono text-xs border border-teal-200/60 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap select-all">
              {verifyConnectionPrompt}
            </div>
          </div>

          {/* PASO 3 (Opcional): Activar enlace en vivo con Tenshi en el Chat */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-500/30 dark:border-emerald-500/30 flex flex-col gap-3 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xs shrink-0">
                  3
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Paso 3 (Opcional): Recibir órdenes de voz de Tenshi en tu PC
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                      Pegar en el Chat
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Copia y pega este mensaje en el <strong>Chat de Antigravity</strong> para que active el enlace en vivo con Tenshi:
                  </p>
                </div>
              </div>

              <ExpandingButton
                onClick={() => copyToClipboard(cronOnlyPrompt, 'cron')}
                icon={copiedCron ? Check : Copy}
                label={copiedCron ? '¡Paso 3 Copiado!' : 'Copiar Paso 3'}
                variant="emerald"
                title="Copiar mensaje del Paso 3 para pegar en el chat de Antigravity"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-mono text-xs border border-emerald-200/60 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap select-all max-h-56 overflow-y-auto">
              {cronOnlyPrompt}
            </div>
          </div>

          {/* Resumen sencillo de qué puede hacer el usuario una vez conectado */}
          <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-500/30 dark:border-teal-500/30 flex flex-col gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xs shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                ¿Qué puedes hacer apenas quede conectado?
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-teal-500/20 flex flex-col gap-1">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300">💬 Preguntar en vivo</span>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Háblale o escríbele a Tenshi desde tu celular o PC: se abrirá un chat en tu Antigravity y te responderá al instante.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-teal-500/20 flex flex-col gap-1">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300">📄 Crear documentos SST</span>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Pídele informes, tablas o programas de SST y recíbelos listos para editar y firmar en el Editor de Documentos de WAPPY.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-teal-500/20 flex flex-col gap-1">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300">💻 Traer archivos de tu PC</span>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Pídele a Tenshi que te envíe una copia original de cualquier archivo guardado en tu computador directo al chat.
                </p>
              </div>
            </div>
          </div>

          {/* Desplegable Opcional: Configuración Manual (Para usuarios avanzados) */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80">
            <button
              onClick={() => setShowAdvancedLocal(!showAdvancedLocal)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
            >
              {showAdvancedLocal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>Configuración Manual del archivo JSON (Opcional)</span>
            </button>

            {showAdvancedLocal && (
              <div className="mt-3 flex flex-col gap-3 animate-in fade-in duration-200">
                {/* Bloque JSON para mcp_config.json */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex flex-col gap-2.5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        Archivo de servidores (<code className="text-teal-600 dark:text-teal-400 font-mono">~/.gemini/config/mcp_config.json</code>)
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Si prefieres editar tu archivo JSON manualmente desde Customizations &gt; MCP Servers, agrega este bloque:
                      </p>
                    </div>
                    <ExpandingButton
                      onClick={() => copyToClipboard(antigravityJsonConfig, 'config')}
                      icon={copiedConfig ? Check : Copy}
                      label={copiedConfig ? '¡Copiado!' : 'Copiar JSON'}
                      variant="teal"
                      size="sm"
                      title="Copiar configuración en formato JSON"
                    />
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed select-all">
                    {antigravityJsonConfig}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Catálogo de Herramientas */}
      {activeTab === 'tools' && (
        <div className="flex flex-col gap-5 max-h-[500px] overflow-y-auto pr-1">
          {toolsCatalog.map((seccion) => (
            <div key={seccion.categoria} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800 pb-1">
                <span>{seccion.categoria}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                  {seccion.tools.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {seccion.tools.map((t) => {
                  const Icon = t.icon;
                  return (
                    <div
                      key={t.name}
                      className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex flex-col gap-1.5 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4 shrink-0', t.color)} />
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-zinc-100">{t.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">{t.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Claves Existentes */}
      {activeTab === 'keys' && (
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Cargando claves...</div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 dark:text-zinc-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
              No tienes claves API activas aún. Genera una para conectar Antigravity.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-2.5">Nombre / Etiqueta</th>
                    <th className="px-4 py-2.5">Prefijo</th>
                    <th className="px-4 py-2.5">Creada</th>
                    <th className="px-4 py-2.5">Último Uso</th>
                    <th className="px-4 py-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">{k.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-zinc-400">{k.keyPrefix}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-zinc-400">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-zinc-400">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Nunca'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          disabled={deletingId === k.id}
                          className="group flex rounded-xl h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 px-1.5 shadow-sm active:scale-95 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 ml-auto"
                          title="Revocar clave"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Revocar</span>
                          </div>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default McpAntigravityView;
