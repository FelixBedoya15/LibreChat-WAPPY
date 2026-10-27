import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  X,
  Clapperboard,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Clipboard,
  Lock,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Terminal,
  Sparkles,
  Check,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';

interface GoogleFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export const GoogleFlowModal: React.FC<GoogleFlowModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const { token } = useAuthContext();
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualJson, setManualJson] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [copiedAg, setCopiedAg] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://wappy.club';

  // Comando universal (Windows PowerShell/CMD + macOS/Linux) sin curl -fsSL para pegar directamente en Terminal
  const terminalCommand = `node -e "const fs=require('fs'),os=require('os'),path=require('path'),https=require('https'),{spawnSync}=require('child_process');const f=path.join(os.tmpdir(),'wappy-googleflow-link.js');https.get('${serverOrigin}/api/googleflow/connect-script?token=${token || ''}',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{fs.writeFileSync(f,d);spawnSync(process.execPath,[f],{stdio:'inherit'});});});"`;

  // Mensaje limpio para pegar en el chat de Antigravity (código local visible con write_file + run_command, sin curl -fsSL ni daemon para evitar bloqueos de seguridad)
  const antigravityPrompt = `Hola Antigravity, para vincular Google Flow con mi entorno WAPPY, guarda este conector local en mi carpeta de usuario (.gemini/antigravity/wappy-googleflow-link.js) usando write_file y ejecútalo con node usando run_command:

\`\`\`js
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const { spawn, execSync } = require('child_process');

const SERVER = '${serverOrigin}';
const TOKEN = '${token || ''}';
const PROFILE = path.join(os.homedir(), '.wappy-googleflow-auth');
const TARGET = 'https://labs.google/fx/tools/flow';

function findBrowser() {
  const p = process.platform;
  const home = os.homedir();
  const candidates = p === 'darwin'
    ? [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        path.join(home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        path.join(home, 'Applications/Brave Browser.app/Contents/MacOS/Brave Browser'),
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        path.join(home, 'Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'),
      ]
    : p === 'win32'
    ? [
        path.join(process.env.PROGRAMFILES || 'C:\\\\Program Files', 'Google\\\\Chrome\\\\Application\\\\chrome.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\\\Program Files (x86)', 'Google\\\\Chrome\\\\Application\\\\chrome.exe'),
        path.join(process.env.LOCALAPPDATA || path.join(home, 'AppData\\\\Local'), 'Google\\\\Chrome\\\\Application\\\\chrome.exe'),
        path.join(process.env.PROGRAMFILES || 'C:\\\\Program Files', 'BraveSoftware\\\\Brave-Browser\\\\Application\\\\brave.exe'),
        path.join(process.env.LOCALAPPDATA || path.join(home, 'AppData\\\\Local'), 'BraveSoftware\\\\Brave-Browser\\\\Application\\\\brave.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\\\Program Files (x86)', 'Microsoft\\\\Edge\\\\Application\\\\msedge.exe'),
        path.join(process.env.PROGRAMFILES || 'C:\\\\Program Files', 'Microsoft\\\\Edge\\\\Application\\\\msedge.exe'),
      ]
    : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/brave-browser', '/snap/bin/chromium'];
  for (const c of candidates) { if (c && fs.existsSync(c)) return c; }
  if (p === 'win32') {
    for (const exe of ['chrome.exe', 'msedge.exe', 'brave.exe']) {
      for (const hive of ['HKLM', 'HKCU']) {
        try {
          const out = execSync(\`reg query "\${hive}\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\App Paths\\\\\${exe}" /ve\`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
          const m = out.match(/REG_SZ\\s+(.+\\.exe)/i);
          if (m && m[1] && fs.existsSync(m[1].trim())) return m[1].trim();
        } catch (_) {}
      }
    }
  }
  return null;
}

function getFreePort() {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', () => resolve(9230 + Math.floor(Math.random() * 500)));
  });
}

function cleanupProfile(dir) {
  try {
    if (process.platform === 'win32') {
      execSync(\`powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*wappy-googleflow-auth*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"\`, { stdio: 'ignore' });
    } else {
      execSync('pkill -9 -f "wappy-googleflow-auth" || true', { stdio: 'ignore' });
    }
  } catch (_) {}
  for (const lock of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    try { fs.rmSync(path.join(dir, lock), { force: true }); } catch (_) {}
  }
}

function bringToFront(bin, pid) {
  setTimeout(() => {
    try {
      if (process.platform === 'darwin') {
        const app = bin.includes('Brave') ? 'Brave Browser' : bin.includes('Edge') ? 'Microsoft Edge' : 'Google Chrome';
        execSync(\`osascript -e 'tell application "\${app}" to activate'\`, { stdio: 'ignore' });
      } else if (process.platform === 'win32' && pid) {
        execSync(\`powershell -NoProfile -Command "(New-Object -ComObject WScript.Shell).AppActivate(\${pid})"\`, { stdio: 'ignore' });
      }
    } catch (_) {}
  }, 1200);
}

function getCookies(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Storage.getCookies' }));
    ws.onmessage = (e) => { try { ws.close(); } catch (_) {} resolve(JSON.parse(e.data)?.result?.cookies || []); };
    ws.onerror = (err) => { try { ws.close(); } catch (_) {} reject(err); };
  });
}

(async () => {
  const bin = findBrowser();
  if (!bin) { console.error('No se encontró Chrome, Brave o Edge.'); process.exit(1); }
  cleanupProfile(PROFILE);
  try { fs.mkdirSync(PROFILE, { recursive: true }); } catch (_) {}
  let port = await getFreePort();
  const launch = (dir, p) => {
    const c = spawn(bin, [\`--remote-debugging-port=\${p}\`, '--remote-allow-origins=*', \`--user-data-dir=\${dir}\`, '--no-first-run', '--no-default-browser-check', '--new-window', '--window-size=1080,780', \`--app=\${TARGET}\`], { stdio: 'ignore' });
    bringToFront(bin, c.pid);
    return c;
  };
  console.log('Abriendo ventana de conexión de Google Flow en primer plano...');
  let child = launch(PROFILE, port);
  let ready = false;
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const list = await fetch(\`http://127.0.0.1:\${port}/json/list\`).then((r) => r.json());
      if (Array.isArray(list)) { ready = true; break; }
    } catch (_) {}
  }
  if (!ready) {
    try { child.kill(); } catch (_) {}
    port = await getFreePort();
    const fallbackDir = path.join(os.tmpdir(), 'wappy-flow-' + Date.now());
    fs.mkdirSync(fallbackDir, { recursive: true });
    child = launch(fallbackDir, port);
  }
  const start = Date.now();
  while (Date.now() - start < 180000) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const pages = await fetch(\`http://127.0.0.1:\${port}/json/list\`).then((r) => r.json());
      const page = pages.find((p) => p.webSocketDebuggerUrl && p.url && (p.url.includes('labs.google') || p.url.includes('google.com')) && !p.url.includes('accounts.google.com'));
      if (!page) continue;
      const all = await getCookies(page.webSocketDebuggerUrl);
      const cookies = all.filter((c) => c.domain && c.domain.includes('google.com'));
      const names = new Set(cookies.map((c) => c.name));
      if (names.has('SID') && (names.has('__Secure-1PSID') || names.has('__Secure-1PSIDTS'))) {
        const res = await fetch(\`\${SERVER}/api/googleflow/session\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${TOKEN}\` },
          body: JSON.stringify({ cookies, source: 'antigravity-local' }),
        }).then((r) => r.json());
        if (res.success) {
          console.log('✅ ¡Tu módulo de Google Flow quedó vinculado con éxito!');
          try { child.kill(); } catch (_) {}
          process.exit(0);
        }
      }
    } catch (_) {}
  }
  try { child.kill(); } catch (_) {}
})();
\`\`\`

Confírmame apenas se vincule mi sesión.`;

  const fetchStatus = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/googleflow/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStatus(data);
    } catch (e: any) {
      console.error('Error fetching Google Flow status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setFeedback(null);
    }
  }, [isOpen, token]);

  const handleCopyAg = async () => {
    navigator.clipboard.writeText(antigravityPrompt);
    setCopiedAg(true);
    setTimeout(() => setCopiedAg(false), 3000);
    setFeedback({
      type: 'success',
      message:
        '📋 ¡Instrucción copiada! Pégala en el chat de tu Google Antigravity y se abrirá la ventana de conexión en primer plano.',
    });
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(terminalCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 3000);
  };

  const handleSaveManual = async () => {
    if (!manualJson.trim()) {
      setFeedback({ type: 'error', message: 'Por favor pega el JSON o las cookies de sesión.' });
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);
      const res = await fetch('/api/googleflow/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ raw: manualJson, source: 'manual' }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: data.isValid === false ? 'error' : 'success',
          message: data.message || '¡Sesión privada de Google Flow vinculada con éxito!',
        });
        setManualJson('');
        await fetchStatus();
        if (onStatusChange) onStatusChange();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || data.message || 'Error al guardar la sesión.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error de conexión: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setFeedback(null);
      const res = await fetch('/api/googleflow/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: data.message || '✓ ¡Conexión privada con Google Flow verificada con éxito!',
        });
        await fetchStatus();
        if (onStatusChange) onStatusChange();
      } else {
        setFeedback({
          type: 'error',
          message: data.reason || data.message || 'La sesión no superó la prueba con Google.',
        });
        await fetchStatus();
        if (onStatusChange) onStatusChange();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error al probar: ' + err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!window.confirm('¿Seguro que deseas desvincular tu sesión privada de Google Flow?')) {
      return;
    }

    try {
      setIsDeleting(true);
      setFeedback(null);
      const res = await fetch('/api/googleflow/session', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'info',
          message: 'Sesión privada desvinculada correctamente.',
        });
        await fetchStatus();
        if (onStatusChange) onStatusChange();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Error al desvincular.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error al desvincular: ' + err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const isConnected = Boolean(status?.connected);
  const isValid = status?.isValid !== false;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80 px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Clapperboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                Google Flow & Studio (Veo & Imagen — 100% Privado)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Vincula tu propia cuenta sin compartir tus proyectos con correos externos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 px-2 min-w-[32px] flex items-center justify-center rounded-xl border border-slate-300/60 dark:border-zinc-700 bg-slate-500/10 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Banner */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {isConnected && isValid ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : isConnected && !isValid ? (
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      {isConnected && isValid
                        ? 'Sesión Privada Activa'
                        : isConnected && !isValid
                        ? 'Sesión de Google Expirada'
                        : 'Sin Vincular (Privacidad Total por Usuario)'}
                    </h4>
                    {isConnected && isValid ? (
                      <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                        {status?.cookieCount || 0} cookies activas
                      </span>
                    ) : isConnected && !isValid ? (
                      <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                        Requiere actualizar
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 bg-slate-500/10 border border-slate-300/60 dark:border-zinc-700 px-2 py-0.5 rounded-lg">
                        Desconectado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {isConnected && isValid
                      ? `Conectado como: ${status.email}. Solo tú y tus agentes en tu sesión pueden generar vídeos con Veo e imágenes con Imagen.`
                      : isConnected && !isValid
                      ? 'Google rotó las credenciales de seguridad de tu navegador. Vuelve a vincular abajo en 1 clic.'
                      : 'Tus proyectos nunca se comparten con cuentas centrales. Vincula tu propio Google Flow para que Tenshi y el chat creen imágenes y vídeos privados.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={fetchStatus}
                  disabled={isLoading}
                  className="group flex h-8 px-2 min-w-[32px] items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:opacity-50"
                  title="Actualizar estado"
                >
                  <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                  <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-xs font-bold tracking-wide">Estado</span>
                  </div>
                </button>

                {isConnected && (
                  <>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="group flex h-8 px-2 min-w-[32px] items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:opacity-50"
                      title="Probar sesión en vivo con Google"
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isTesting ? 'animate-pulse' : ''}`} />
                      <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                        <span className="text-xs font-bold tracking-wide">{isTesting ? 'Probando...' : 'Probar'}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteSession}
                      disabled={isDeleting}
                      className="group flex h-8 px-2 min-w-[32px] items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:opacity-50"
                      title="Desvincular sesión"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                        <span className="text-xs font-bold tracking-wide">Desvincular</span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                  : feedback.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Opción A: Vinculación Directa desde PC / Antigravity (Sin instalar extensión) */}
          <div className="p-5 rounded-2xl border border-purple-500/25 bg-purple-500/5 dark:bg-purple-950/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold tracking-wide uppercase text-purple-700 dark:text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  Opción A &bull; Sin Instalar Extensiones
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5">
                  Vinculación Directa desde tu PC o Antigravity
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Abre una ventana segura de Google en tu computador, detecta tu Google Flow y lo vincula automáticamente a tu cuenta privada.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyAg}
                  title="Copiar instrucción para Antigravity"
                  className="group flex h-9 px-2.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {copiedAg ? <Check className="w-4 h-4 shrink-0" /> : <Sparkles className="w-4 h-4 shrink-0" />}
                  <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-sm font-bold tracking-wide">
                      {copiedAg ? '¡Copiado para Antigravity!' : 'Copiar para Antigravity'}
                    </span>
                  </div>
                  <span className="sm:hidden text-xs font-bold ml-1.5">
                    {copiedAg ? '¡Copiado!' : 'Antigravity'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCmd}
                  title="Copiar comando para Terminal"
                  className="group flex h-9 px-2.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] items-center justify-center rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {copiedCmd ? <Check className="w-4 h-4 shrink-0" /> : <Terminal className="w-4 h-4 shrink-0" />}
                  <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-sm font-bold tracking-wide">
                      {copiedCmd ? '¡Comando Copiado!' : 'Copiar Comando Terminal'}
                    </span>
                  </div>
                  <span className="sm:hidden text-xs font-bold ml-1.5">
                    {copiedCmd ? '¡Copiado!' : 'Terminal'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Opción B: Extensión WAPPY Connect */}
          <div className="p-5 rounded-2xl border border-teal-500/20 bg-teal-500/5 dark:bg-teal-950/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold tracking-wide uppercase text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 rounded-md">
                  Opción B &bull; Extensión de Navegador
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5">
                  Extensión Oficial WAPPY Connect (Chrome / Brave / Edge)
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Vincula tu sesión privada desde el navegador con un solo clic.
                </p>
              </div>

              <a
                href="/extension/wappy-connect.zip"
                download="wappy-connect.zip"
                title="Descargar Extensión (.zip)"
                className="group flex h-9 px-2.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] items-center justify-center rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4 shrink-0" />
                <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                  <span className="text-sm font-bold tracking-wide">Descargar Extensión (.zip)</span>
                </div>
                <span className="sm:hidden text-xs font-bold ml-1.5">Descargar Extensión (.zip)</span>
              </a>
            </div>

            {/* Pasos de instalación */}
            <div className="pt-2 border-t border-teal-500/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-600 dark:text-zinc-400">
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-zinc-800/60">
                <div className="font-bold text-slate-900 dark:text-zinc-200 mb-0.5">1. Descomprime</div>
                Descarga el archivo ZIP y descomprímelo en una carpeta de tu equipo.
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-zinc-800/60">
                <div className="font-bold text-slate-900 dark:text-zinc-200 mb-0.5">2. Carga en Chrome</div>
                Entra a <code className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">chrome://extensions</code>, activa <strong>Modo de desarrollador</strong> y presiona <strong>Cargar descomprimida</strong>.
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-zinc-800/60">
                <div className="font-bold text-slate-900 dark:text-zinc-200 mb-0.5">3. Vincula en 1 Clic</div>
                Abre la extensión y haz clic en <strong>&quot;Vincular con WAPPY&quot;</strong>. ¡Listo!
              </div>
            </div>
          </div>

          {/* Opción C: Pegar Manualmente (Acordeón) */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 space-y-3">
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="flex w-full items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-zinc-200 hover:text-teal-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-slate-500" />
                <span>Opción C: Pegar Clave o JSON de Cookies Manualmente</span>
              </div>
              {showManual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showManual && (
              <div className="pt-2 space-y-3">
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Si copiaste tus cookies desde otro navegador o extensión (como Cookie-Editor), pega el contenido aquí:
                </p>

                <textarea
                  value={manualJson}
                  onChange={(e) => setManualJson(e.target.value)}
                  placeholder='Pega aquí el JSON de cookies (ej. [{"name": "__Secure-1PSID", "value": "..."}, ...])'
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-3 text-xs font-mono text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveManual}
                    disabled={isSaving}
                    title="Guardar y Vincular"
                    className="group flex h-9 px-2.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                      <span className="text-sm font-bold tracking-wide">{isSaving ? 'Guardando...' : 'Guardar y Vincular'}</span>
                    </div>
                    <span className="sm:hidden text-xs font-bold ml-1.5">{isSaving ? 'Guardando...' : 'Guardar y Vincular'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-zinc-800/80 px-6 py-3.5 bg-slate-50/50 dark:bg-zinc-900/50">
          <a
            href="https://labs.google/fx/tools/flow"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            <span>Abrir mi Google Flow</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            title="Cerrar"
            className="group flex h-9 px-2.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] items-center justify-center rounded-xl bg-slate-500/10 dark:bg-zinc-800/80 border border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 shrink-0" />
            <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
              <span className="text-sm font-bold tracking-wide">Cerrar</span>
            </div>
            <span className="sm:hidden text-xs font-bold ml-1.5">Cerrar</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GoogleFlowModal;
