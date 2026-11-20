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
  Download,
  ExternalLink,
  Monitor,
  RefreshCw,
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
  const [copiedCloudPrompt, setCopiedCloudPrompt] = useState(false);
  const [copiedLocal, setCopiedLocal] = useState(false);
  const [showAdvancedLocal, setShowAdvancedLocal] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'tools' | 'keys'>('config');
  // connectionGuideMode se deriva de activeMode — se declara abajo tras activeMode
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [daemonStatus, setDaemonStatus] = useState<any>(null);

  // Refrescar estado en vivo del puente Dual (Local + Cloud)
  const refreshDaemonStatus = useCallback(async () => {
    if (!token) return;
    try {
      const [mcpRes, studioRes] = await Promise.all([
        fetch('/api/mcp-bridge/antigravity/status', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).catch(() => null),
        fetch('/api/studio/antigravity/status', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).catch(() => null),
      ]);
      const mcpData = mcpRes && mcpRes.ok ? await mcpRes.json().catch(() => null) : null;
      const studioData = studioRes && studioRes.ok ? await studioRes.json().catch(() => null) : null;
      if (mcpData || studioData) {
        setDaemonStatus((prev: any) => ({
          ...(prev || {}),
          ...(studioData || {}),
          ...(mcpData || {}),
          localConnected: Boolean(
            mcpData?.localConnected ??
              studioData?.localConnected ??
              studioData?.bridge?.localConnected ??
              false,
          ),
          cloudConnected: Boolean(
            mcpData?.cloudConnected ??
              studioData?.cloudConnected ??
              studioData?.bridge?.cloudConnected ??
              false,
          ),
          localCount: Number(
            mcpData?.localCount ?? studioData?.localCount ?? studioData?.bridge?.localCount ?? 0,
          ),
          cloudCount: Number(
            mcpData?.cloudCount ?? studioData?.cloudCount ?? studioData?.bridge?.cloudCount ?? 0,
          ),
          activeMode:
            mcpData?.activeMode ||
            studioData?.activeMode ||
            studioData?.bridge?.activeMode ||
            prev?.activeMode ||
            'local',
          effectiveEnv:
            mcpData?.effectiveEnv ||
            studioData?.effectiveEnv ||
            studioData?.bridge?.effectiveEnv ||
            prev?.effectiveEnv ||
            'local',
        }));
      }
    } catch (_) {
      /* ignore background poll error */
    }
  }, [token]);

  // Cargar claves existentes y estado en vivo del daemon Push SSE
  const loadKeys = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [res] = await Promise.all([
        fetch('/api/user-api-keys', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }),
        refreshDaemonStatus(),
      ]);
      if (res.ok) {
        const data = await res.json();
        setKeys(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('[MCP View] Error cargando claves:', err);
    } finally {
      setLoading(false);
    }
  }, [token, refreshDaemonStatus]);

  const localConnected = Boolean(
    daemonStatus?.localConnected ||
      daemonStatus?.bridge?.localConnected ||
      Number(daemonStatus?.localCount ?? daemonStatus?.bridge?.localCount ?? 0) > 0,
  );
  const cloudConnected = Boolean(
    daemonStatus?.cloudConnected ||
      daemonStatus?.bridge?.cloudConnected ||
      Number(daemonStatus?.cloudCount ?? daemonStatus?.bridge?.cloudCount ?? 0) > 0,
  );
  const localCount = Number(
    daemonStatus?.localCount ?? daemonStatus?.bridge?.localCount ?? (localConnected ? 1 : 0),
  );
  const cloudCount = Number(
    daemonStatus?.cloudCount ?? daemonStatus?.bridge?.cloudCount ?? (cloudConnected ? 1 : 0),
  );
  const activeMode: 'local' | 'cloud' | 'auto' =
    daemonStatus?.activeMode === 'cloud' || daemonStatus?.bridge?.activeMode === 'cloud'
      ? 'cloud'
      : daemonStatus?.activeMode === 'auto' || daemonStatus?.bridge?.activeMode === 'auto'
        ? 'auto'
        : 'local';

  // Derivado de activeMode — reemplaza el antiguo estado connectionGuideMode
  const connectionGuideMode: 'cloud' | 'local' | 'both' =
    activeMode === 'local' ? 'local' : activeMode === 'cloud' ? 'cloud' : 'both';
  const effectiveEnv: 'local' | 'cloud' =
    daemonStatus?.effectiveEnv === 'cloud' || daemonStatus?.bridge?.effectiveEnv === 'cloud'
      ? 'cloud'
      : activeMode === 'cloud'
        ? 'cloud'
        : activeMode === 'auto' && !localConnected && cloudConnected
          ? 'cloud'
          : 'local';

  const isLiveConnected = Boolean(
    localConnected ||
      cloudConnected ||
      daemonStatus?.bridge?.userDaemonConnected ||
      daemonStatus?.bridge?.daemonListening ||
      daemonStatus?.bridge?.connected ||
      daemonStatus?.userDaemonConnected ||
      daemonStatus?.daemonListening ||
      daemonStatus?.connected,
  );

  // Cambiar Modo de Trabajo de 1 Clic ('local' | 'cloud' | 'auto')
  const handleSelectMode = async (nextMode: 'local' | 'cloud' | 'auto') => {
    if (!token || isSwitchingMode) return;
    setIsSwitchingMode(true);
    const optimisticEffective: 'local' | 'cloud' =
      nextMode === 'cloud'
        ? 'cloud'
        : nextMode === 'local'
          ? 'local'
          : localConnected
            ? 'local'
            : cloudConnected
              ? 'cloud'
              : 'local';
    setDaemonStatus((prev: any) => ({
      ...(prev || {}),
      activeMode: nextMode,
      effectiveEnv: optimisticEffective,
    }));
    try {
      const res = await fetch('/api/mcp-bridge/antigravity/mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ mode: nextMode }),
      });
      const data = res.ok ? await res.json().catch(() => null) : null;
      if (data && data.ok !== false) {
        setDaemonStatus((prev: any) => ({
          ...(prev || {}),
          ...data,
          activeMode: data.activeMode || data.mode || nextMode,
          effectiveEnv: data.effectiveEnv || optimisticEffective,
        }));
      }
      const modeMessages: Record<'local' | 'cloud' | 'auto', string> = {
        local:
          '🖥️ Modo Local activado: Usa tu Mac/PC con Activar-Tenshi-Wappy y Push SSE en tiempo real.',
        cloud:
          '☁️ Modo Cloud activado: Enlace declarativo MCP Streamable HTTP (2025-03-26) + 3 Skills SKILL.md para antigravity.google.com.',
        auto: '⚡ Modo Automático (Híbrido) activado: Prioriza Local (Push SSE) si tu PC está activo y usa Cloud cuando no lo esté.',
      };
      showToast({
        message: modeMessages[nextMode],
        status: 'success',
      });
    } catch (err) {
      showToast({
        message: 'No se pudo cambiar el modo de Antigravity. Revisa tu conexión.',
        status: 'error',
      });
    } finally {
      setIsSwitchingMode(false);
    }
  };

  useEffect(() => {
    loadKeys();
    const pollTimer = setInterval(() => {
      refreshDaemonStatus();
    }, 8000);
    return () => clearInterval(pollTimer);
  }, [loadKeys, refreshDaemonStatus]);

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
  const mcpServerUrl = `${originUrl}/api/mcp-bridge/mcp?apiKey=${effectiveKey}`;

  // Instalador unificado v2.7.0 (delega directamente en /api/mcp-bridge/antigravity/daemon.js --install)
  const buildPushBridgePrompt = (key: string) => {
    const cleanKey = (key?.trim() || '');
    const hasFullKey = Boolean(cleanKey && !cleanKey.includes('...') && cleanKey !== 'PEGA_TU_CLAVE_AQUI');
    const keyArg = hasFullKey ? `,'--key=${cleanKey}'` : '';
    return `Hola Antigravity, conecta mi cuenta oficial de WAPPY IA (Servidor MCP "wappy" + Puente Reactivo SSE 24/7 + Paquete Oficial de Skills, Scripts CLI y Motor de Portales SST v2.7.0 con auto-arranque en mi sistema) ejecutando este comando autorizado en tu terminal con run_command:\n\nnode -e "fetch('${originUrl}/api/mcp-bridge/antigravity/daemon.js').then(r=>r.text()).then(c=>{const fs=require('fs'),p=require('path').join(require('os').homedir(),'.gemini','antigravity','wappy-push-daemon.js');fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,c);require('child_process').spawnSync(process.execPath,[p,'--install','--url=${originUrl}'${keyArg}],{stdio:'inherit'})})"\n\nConfírmame apenas quede instalado y corriendo.`;
  };


  // Paso 3: Comando de 1 línea para ejecutar directamente en la Terminal de Antigravity (Ctrl + ` / Terminal -> New Terminal)
  // Descarga /api/mcp-bridge/antigravity/daemon.js (v2.7.0) con --install: registra MCP, Puente SSE 24/7,
  // wappy-osint-portals.js, las 3 Skills operativas SST (con scripts/ y references/) y el Escuadrón de Wappy Studio.
  const buildTerminalCommand = (key: string) => {
    const cleanKey = (key?.trim() || '');
    const hasFullKey = Boolean(cleanKey && !cleanKey.includes('...') && cleanKey !== 'PEGA_TU_CLAVE_AQUI');
    const keyArg = hasFullKey ? `,'--key=${cleanKey}'` : '';
    return `node -e "fetch('${originUrl}/api/mcp-bridge/antigravity/daemon.js').then(r=>r.text()).then(c=>{const fs=require('fs'),p=require('path').join(require('os').homedir(),'.gemini','antigravity','wappy-push-daemon.js');fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,c);require('child_process').spawnSync(process.execPath,[p,'--install','--url=${originUrl}'${keyArg}],{stdio:'inherit'})})"`;
  };

  const cronOnlyPrompt = buildTerminalCommand(effectiveKey);

  // Descargador de 1 Clic (.bat para Windows / .command para macOS) — Ecosistema Auto-Entrenado v2.7.0
  const handleDownloadInstaller = async () => {
    let keyToUse = newKeyGenerated || fullKeyFromList;
    if (!keyToUse) {
      keyToUse = await handleCreateKey();
    }
    const finalKey = keyToUse || effectiveKey;
    const cmdLine = buildTerminalCommand(finalKey);
    const isWin = typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent);
    const fileName = isWin ? 'Activar-Tenshi-Wappy.bat' : 'Activar-Tenshi-Wappy.command';
    const content = isWin
      ? `@echo off\r\ntitle Activador Oficial WAPPY v2.7.0 - Ecosistema Auto-Entrenado Antigravity\r\necho Conectando MCP WAPPY + Puente SSE 24/7 + Paquete Oficial de Skills, Scripts CLI y Portales SST v2.7.0...\r\n${cmdLine}\r\necho.\r\necho Ecosistema WAPPY v2.7.0 instalado y activo. Ya puedes cerrar esta ventana.\r\npause\r\n`
      : `#!/bin/bash\necho "Conectando MCP WAPPY + Puente SSE 24/7 + Paquete Oficial de Skills, Scripts CLI y Portales SST v2.7.0..."\n${cmdLine}\necho ""\necho "✅ Ecosistema WAPPY v2.7.0 instalado y activo. Ya puedes cerrar esta ventana."\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({
      message: `Instalador ${fileName} (v2.7.0) descargado. Ábrelo o pega el comando en la Terminal.`,
      status: 'success',
    });
  };

  // Prompt Declarativo Oficial para Google Antigravity Cloud (antigravity.google.com) — agy-customizations (Streamable HTTP /mcp + 3 SKILL.md puros)
  const buildCloudAntigravityPrompt = (key: string) => {
    const cleanKey = key?.trim() || '';
    const safeKey =
      cleanKey && !cleanKey.includes('...') && cleanKey !== 'PEGA_TU_CLAVE_AQUI'
        ? cleanKey
        : effectiveKey;
    const cloudMcpUrl = `${originUrl}/api/mcp-bridge/mcp?apiKey=${safeKey}&env=cloud`;
    const cloudVerifyUrl = `${originUrl}/api/mcp-bridge/antigravity/cloud-verify?apiKey=${safeKey}`;
    return `Hola Antigravity, siguiendo tu guía oficial agy-customizations (MCP Servers y Skills declarativas), ayúdame a configurar mi cuenta de WAPPY IA en este entorno Cloud de forma 100% declarativa (sin procesos en segundo plano ni modificaciones del sistema):

1. Servidor MCP remoto ("wappy" — Streamable HTTP 2025-03-26):
Usa read_file y write_file / edit_file para registrar de forma declarativa el servidor "wappy" en ~/.gemini/config/mcp_config.json (conservando cualquier otro servidor existente en mcpServers):

{
  "mcpServers": {
    "wappy": {
      "url": "${cloudMcpUrl}"
    }
  }
}

2. Las 3 Skills oficiales Cloud de WAPPY IA (archivos SKILL.md Markdown puros):
Lee el contenido Markdown público de estas 3 URLs oficiales y guárdalas mediante write_file en ~/.gemini/config/skills/<nombre>/SKILL.md:
- ${originUrl}/api/mcp-bridge/antigravity/cloud-skills/wappy-copiloto-sgsst-mcp/SKILL.md -> ~/.gemini/config/skills/wappy-copiloto-sgsst-mcp/SKILL.md
- ${originUrl}/api/mcp-bridge/antigravity/cloud-skills/wappy-ordenes-cloud-tenshi/SKILL.md -> ~/.gemini/config/skills/wappy-ordenes-cloud-tenshi/SKILL.md
- ${originUrl}/api/mcp-bridge/antigravity/cloud-skills/wappy-portales-colombia-sst/SKILL.md -> ~/.gemini/config/skills/wappy-portales-colombia-sst/SKILL.md

3. Confirmación del enlace Cloud:
Invoca un POST JSON-RPC de verificación ({"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"antigravity-cloud","version":"2.0"}}}) a "${cloudMcpUrl}" y un POST a "${cloudVerifyUrl}" para confirmar el estado Conectado en mi panel de WAPPY IA, e indícame si debo recargar MCP Servers o abrir un nuevo chat para usar las herramientas wappy_*.`;
  };

  const cloudAntigravityPrompt = buildCloudAntigravityPrompt(effectiveKey);

  const handleCopyCloudPrompt = async () => {
    let keyToUse = newKeyGenerated || fullKeyFromList;
    if (!keyToUse) {
      keyToUse = await handleCreateKey();
    }
    const finalKey = keyToUse || effectiveKey;
    const promptText = buildCloudAntigravityPrompt(finalKey);
    navigator.clipboard.writeText(promptText);
    setCopiedCloudPrompt(true);
    setTimeout(() => setCopiedCloudPrompt(false), 2500);
    showToast({
      message: '☁️ Prompt Declarativo Cloud (MCP Streamable HTTP + 3 Skills SKILL.md) copiado al portapapeles',
      status: 'success',
    });
  };

  // Paso 1: Configuración 100% declarativa y estándar de mcp_config.json (Streamable HTTP 2025-03-26) para pegar en el Chat de Antigravity
  const buildAntigravityPrompt = (url: string) => `Hola Antigravity, siguiendo tu guía oficial agy-customizations (MCP Servers), ayúdame a registrar mi servidor MCP remoto "wappy" (transporte Streamable HTTP 2025-03-26) de forma declarativa en ~/.gemini/config/mcp_config.json (conservando cualquier otro servidor que ya exista en mcpServers) con este bloque JSON:

{
  "mcpServers": {
    "wappy": {
      "url": "${url}"
    }
  }
}

Por favor usa read_file y write_file / edit_file para guardarlo y confírmame cuando quede listo.`;

  const antigravityPrompt = buildAntigravityPrompt(mcpServerUrl);

  // Paso 2: Mensaje para verificar la conexión en un nuevo chat de Antigravity
  const verifyConnectionPrompt = `Hola Antigravity, usa las herramientas de mi servidor MCP "wappy" (como wappy_consultar_perfil_empresa y wappy_resumen_general_360) y dame un resumen ejecutivo de mi empresa en WAPPY para confirmar que ya estamos conectados.`;

  // Configuración JSON para mcp_config.json (Streamable HTTP 2025-03-26)
  const antigravityJsonConfig = JSON.stringify(
    {
      mcpServers: {
        wappy: {
          url: mcpServerUrl,
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
      const pushText = buildTerminalCommand(keyToUse || effectiveKey);
      navigator.clipboard.writeText(pushText);
      setCopiedCron(true);
      setTimeout(() => setCopiedCron(false), 2000);
      showToast({ message: 'Comando de Terminal del Paso 3 copiado al portapapeles', status: 'success' });
      return;
    }

    let textToCopy = text;
    if (keyToUse) {
      const liveMcpUrl = `${originUrl}/api/mcp-bridge/mcp?apiKey=${keyToUse}`;
      if (type === 'key') {
        textToCopy = keyToUse;
      } else if (type === 'prompt') {
        textToCopy = buildAntigravityPrompt(liveMcpUrl);
      } else if (type === 'config') {
        textToCopy = JSON.stringify(
          {
            mcpServers: {
              wappy: {
                url: liveMcpUrl,
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
          desc: 'Consulta todos los agentes de IA, catálogo de herramientas/skills y las tareas autónomas programadas.',
          icon: Bot,
          color: 'text-emerald-600',
        },
        {
          name: 'wappy_crear_agente',
          desc: 'Crea agentes de IA completos con nombre, instrucciones, modelo, skills y todas las herramientas de Google y WAPPY SST.',
          icon: Plus,
          color: 'text-teal-500',
        },
        {
          name: 'wappy_actualizar_agente',
          desc: 'Modifica cualquier agente de tu cuenta (instrucciones, modelo, herramientas activas, skills o cadena de agentes).',
          icon: Edit3,
          color: 'text-blue-500',
        },
        {
          name: 'wappy_eliminar_agente',
          desc: 'Elimina un agente personalizado creado en tu cuenta de WAPPY.',
          icon: Trash2,
          color: 'text-rose-500',
        },
        {
          name: 'wappy_ejecutar_accion_usuario',
          desc: 'Ejecutor universal de cualquier acción o módulo dentro de tu cuenta conectada (memorias, chats, Canvas o rutas internas).',
          icon: Zap,
          color: 'text-orange-500',
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
    <div className="flex flex-col gap-6 w-full min-w-0 text-slate-800 dark:text-zinc-100">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-teal-500/10 border border-orange-500/20 dark:border-orange-500/30">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-300 shadow-xs shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-lg font-bold">Conexión Total Antigravity (MCP)</h2>
              {isLiveConnected && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold border-emerald-500/70 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 px-2.5 py-0.5 rounded-xl border">
                  <span className="h-1.5 w-1.5 rounded-sm bg-emerald-500 animate-pulse" />
                  <CheckCircle2 className="w-3.5 h-3.5" />{' '}
                  {localConnected ? 'Conectado en Vivo (Push SSE)' : 'Conectado en Cloud (MCP HTTP)'}
                </span>
              )}
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                v2.7.0 • Streamable HTTP &amp; Push SSE
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/30">
                Acceso Total
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {isLiveConnected
                ? 'Tu instancia de Google Antigravity está enlazada con WAPPY IA (Push SSE en Local y/o MCP Streamable HTTP 2025-03-26 en Cloud) con las 120+ herramientas SG-SST.'
                : 'Conecta Antigravity en Local (instalador Activar-Tenshi-Wappy + Push SSE en tiempo real) o en Cloud (MCP Streamable HTTP 2025-03-26 + 3 Skills declarativas SKILL.md).'}
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

      {/* PANEL SUPERIOR DE ESTADO DUAL + SELECTOR DE MODO DE TRABAJO DE 1 CLIC ([🖥️ Local] [☁️ Cloud] [⚡ Auto]) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                Estado Dual en Tiempo Real & Selector de Modo (1-Clic)
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[11px] font-bold border',
                  effectiveEnv === 'cloud'
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
                )}
              >
                Enrutamiento efectivo actual:{' '}
                {effectiveEnv === 'cloud' ? '☁️ Cloud (antigravity.google.com)' : '🖥️ Local (Mac/PC)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Elige con un clic a qué entorno de Google Antigravity debe enviar WAPPY IA y Tenshi Voz tus órdenes en tiempo real:
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ExpandingButton
              onClick={refreshDaemonStatus}
              icon={RefreshCw}
              label="Actualizar Estado"
              variant="cyan"
              size="sm"
              title="Consultar en vivo el estado de tus conexiones Local y Cloud"
            />
          </div>
        </div>

        {/* 2 Píldoras / Tarjetas de Estado en Tiempo Real */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 1. Estado Antigravity Local */}
          <div
            className={cn(
              'p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all',
              localConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                : 'bg-slate-500/5 dark:bg-zinc-950/60 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300',
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
                  localConnected
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                    : 'bg-slate-500/10 border-slate-300/50 dark:border-zinc-700 text-slate-500 dark:text-zinc-400',
                )}
              >
                <Monitor className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">
                  🖥️ Antigravity Local (Mac/PC):
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                  {localConnected
                    ? `Enlazado en tu equipo (${localCount} instancia${localCount === 1 ? '' : 's'} activa${localCount === 1 ? '' : 's'})`
                    : 'Apagado o sin iniciar daemon local'}
                </div>
              </div>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold border shrink-0',
                localConnected
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-500/10 border-slate-300/60 dark:border-zinc-700 text-slate-600 dark:text-zinc-400',
              )}
            >
              {localConnected ? '🟢 Conectado' : '⚪ Desconectado'}
            </span>
          </div>

          {/* 2. Estado Antigravity Cloud */}
          <div
            className={cn(
              'p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all',
              cloudConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                : 'bg-sky-500/5 dark:bg-zinc-950/60 border-sky-500/20 dark:border-zinc-800 text-slate-700 dark:text-zinc-300',
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
                  cloudConnected
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-300',
                )}
              >
                <Cloud className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">
                  ☁️ Antigravity Cloud (antigravity.google.com):
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                  {cloudConnected
                    ? `Enlazado vía MCP Streamable HTTP (${cloudCount} sesión${cloudCount === 1 ? '' : 'es'} verificada${cloudCount === 1 ? '' : 's'})`
                    : 'MCP Streamable HTTP (2025-03-26) + 3 Skills SKILL.md declarativas'}
                </div>
              </div>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold border shrink-0',
                cloudConnected
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-500/10 border-slate-300/60 dark:border-zinc-700 text-slate-600 dark:text-zinc-400',
              )}
            >
              {cloudConnected ? '🟢 Conectado' : '⚪ Sin enlazar'}
            </span>
          </div>
        </div>

        {/* Selector de Modo de Trabajo de 1 Clic ([🖥️ Local] [☁️ Cloud] [⚡ Auto]) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <button
            type="button"
            disabled={isSwitchingMode}
            onClick={() => handleSelectMode('local')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all duration-300 flex flex-col gap-1 active:scale-95',
              activeMode === 'local'
                ? 'bg-teal-500/15 border-teal-500/50 text-teal-800 dark:text-teal-200 ring-1 ring-teal-500/30 shadow-2xs'
                : 'bg-slate-500/5 dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-teal-500/10 hover:border-teal-500/30',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold">🖥️ Trabajar en Local</span>
              {activeMode === 'local' && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-700 dark:text-teal-300">
                  Activo
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
              Usa tu Mac/PC con <code className="font-mono">Activar-Tenshi-Wappy</code> (<code className="font-mono">.command</code>/<code className="font-mono">.bat</code>) y Push SSE en tiempo real.
            </span>
          </button>

          <button
            type="button"
            disabled={isSwitchingMode}
            onClick={() => handleSelectMode('cloud')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all duration-300 flex flex-col gap-1 active:scale-95',
              activeMode === 'cloud'
                ? 'bg-sky-500/15 border-sky-500/50 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500/30 shadow-2xs'
                : 'bg-slate-500/5 dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-sky-500/10 hover:border-sky-500/30',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold">☁️ Trabajar en Cloud</span>
              {activeMode === 'cloud' && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-700 dark:text-sky-300">
                  Activo
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
              Usa <code className="font-mono">antigravity.google.com</code> con MCP Streamable HTTP (<code className="font-mono">2025-03-26</code>) + 3 Skills <code className="font-mono">SKILL.md</code> sin daemons.
            </span>
          </button>

          <button
            type="button"
            disabled={isSwitchingMode}
            onClick={() => handleSelectMode('auto')}
            className={cn(
              'p-3 rounded-xl border text-left transition-all duration-300 flex flex-col gap-1 active:scale-95',
              activeMode === 'auto'
                ? 'bg-purple-500/15 border-purple-500/50 text-purple-800 dark:text-purple-200 ring-1 ring-purple-500/30 shadow-2xs'
                : 'bg-slate-500/5 dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-purple-500/10 hover:border-purple-500/30',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold">⚡ Automático (Híbrido)</span>
              {activeMode === 'auto' && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-700 dark:text-purple-300">
                  Activo
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
              Prioriza Local (Push SSE) si tu PC está activo y usa tu configuración Cloud cuando trabajes en la nube.
            </span>
          </button>
        </div>
      </div>

      {/* Selector de Pestañas (Toolbar Cápsula WAPPY) */}
      <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none w-fit flex-wrap">
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
        <div className="flex flex-col gap-5 min-w-0">
          {/* TARJETA VISUAL OFICIAL: Ecosistema Oficial WAPPY <-> Google Antigravity (Local & Cloud) */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-teal-500/30 dark:border-teal-500/30 shadow-sm flex flex-col gap-4">
            <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-w-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-extrabold bg-gradient-to-r from-green-600 to-cyan-600 dark:from-green-400 dark:to-cyan-400 bg-clip-text text-transparent tracking-tight">
                      Ecosistema Oficial WAPPY ↔ Google Antigravity
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl border border-emerald-500/70 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30">
                      <span className="h-1.5 w-1.5 rounded-sm bg-emerald-500 animate-pulse" />
                      v2.7.0 • Local &amp; Cloud
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 leading-relaxed">
                    En <strong>Cloud (<code className="font-mono text-sky-700 dark:text-sky-300">antigravity.google.com</code>)</strong> usa <strong>MCP Streamable HTTP (<code className="font-mono">2025-03-26</code>) + 3 Skills declarativas (<code className="font-mono">SKILL.md</code>)</strong> sin daemons en segundo plano; en <strong>Local (Mac/PC)</strong> conserva el instalador <code className="font-mono text-teal-700 dark:text-teal-300">Activar-Tenshi-Wappy.command</code>/<code className="font-mono text-teal-700 dark:text-teal-300">.bat</code> con Push SSE en tiempo real:
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Pilares Operativos (WAPPY 14-Group Design System) */}
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
              {/* 1. Portales Oficiales Colombia (Grupo 5: Cyan) */}
              <div className="p-3.5 rounded-xl bg-cyan-500/5 dark:bg-zinc-950/60 border border-cyan-500/30 hover:border-cyan-500/50 transition-all flex flex-col gap-2 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 leading-snug">
                    🕷️ Skill de Portales Oficiales Colombia SST
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <code className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-mono text-[10px] font-bold break-all">
                    wappy-portales-colombia-sst
                  </code>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Guía normativa y verificación de ARL, EPS/ADRES, Pensiones, Alturas MinTrabajo, Rama Judicial y SIMIT (<code className="font-mono">SKILL.md</code> declarativa en Cloud + CLI local en Mac/PC).
                </p>
              </div>

              {/* 2. Diagnóstico Copiloto SG-SST (Grupo 3: Teal) */}
              <div className="p-3.5 rounded-xl bg-teal-500/5 dark:bg-zinc-950/60 border border-teal-500/30 hover:border-teal-500/50 transition-all flex flex-col gap-2 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 leading-snug">
                    🛡️ Skill + Diagnóstico Copiloto SG-SST
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <code className="px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-mono text-[10px] font-bold break-all">
                    wappy-copiloto-sgsst-mcp
                  </code>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Operación de los 8 Hitos, Matrices (IPEVR, PESV, Química SGA) y <code className="font-mono font-bold text-teal-700 dark:text-teal-300">120+</code> herramientas MCP con aislamiento estricto por empresa (<code className="font-mono">companyId</code>).
                </p>
              </div>

              {/* 3. Entregables Tenshi & Escuadrón Studio (Grupo 6: Purple) */}
              <div className="p-3.5 rounded-xl bg-purple-500/5 dark:bg-zinc-950/60 border border-purple-500/30 hover:border-purple-500/50 transition-all flex flex-col gap-2 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 leading-snug">
                    ⚡ Skill + Entregables Tenshi &amp; Studio
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <code className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold break-all">
                    wappy-ordenes-cloud-tenshi
                  </code>
                  <code className="px-2 py-0.5 rounded-lg bg-slate-500/10 dark:bg-zinc-800/80 border border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-mono text-[10px] font-bold break-all">
                    wappy-ordenes-y-entregables-tenshi
                  </code>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Flujo declarativo Cloud (<code className="font-mono">wappy-ordenes-cloud-tenshi</code>) y entrega directa de documentos <code className="font-mono">LiveEditor</code>, reportes y producción audiovisual.
                </p>
              </div>
            </div>

            {/* Nota destacada tranquila: Transporte Dual Oficial */}
            <div className="relative p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-100 flex flex-col sm:flex-row sm:items-center gap-2.5 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold shrink-0 w-fit">
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                Arquitectura Oficial agy-customizations
              </span>
              <p className="text-xs text-slate-700 dark:text-zinc-200 leading-relaxed">
                En <strong>Cloud</strong> cumple al 100% con <code className="font-mono">agy-customizations</code> (<code className="font-mono">Streamable HTTP /mcp</code> + <code className="font-mono">SKILL.md</code> puros, cero procesos en segundo plano); en <strong>Local</strong> sincroniza actualizaciones automáticamente por Push SSE.
              </p>
            </div>
          </div>

          {/* Título contextual según modo activo — sin sub-selector redundante */}
          <div className="flex items-center gap-2 flex-wrap pb-1">
            {activeMode === 'cloud' && <><span className="text-lg">☁️</span><span className="text-sm font-extrabold text-sky-700 dark:text-sky-300">Conexión en la Nube</span><span className="text-xs text-slate-500 dark:text-zinc-400">— MCP Streamable HTTP (2025-03-26) + SKILL.md</span></>}
            {activeMode === 'local' && <><span className="text-lg">🖥️</span><span className="text-sm font-extrabold text-teal-700 dark:text-teal-300">Conexión Local</span><span className="text-xs text-slate-500 dark:text-zinc-400">— Mac / Windows (Push SSE en tiempo real)</span></>}
            {activeMode === 'auto' && <><span className="text-lg">⚡</span><span className="text-sm font-extrabold text-purple-700 dark:text-purple-300">Modo Automático</span><span className="text-xs text-slate-500 dark:text-zinc-400">— Cloud + Local disponibles</span></>}
          </div>

          {/* TARJETA DESTACADA: ☁️ Conexión en la Nube (antigravity.google.com) — Declarativa agy-customizations */}
          {(connectionGuideMode === 'both' || connectionGuideMode === 'cloud') && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-indigo-500/10 dark:from-sky-950/30 dark:via-zinc-900 dark:to-indigo-950/20 border border-sky-500/30 flex flex-col gap-4 shadow-sm min-w-0">
              <div className="flex flex-col items-start gap-3 min-w-0">
                <div className="flex items-start gap-3 min-w-0 w-full">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-300 font-black text-base shrink-0">
                    ☁️
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                        ☁️ Conexión en la Nube (<code className="font-mono text-sky-600 dark:text-sky-300">antigravity.google.com</code>) — 100% Declarativa
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-300">
                        MCP Streamable HTTP • 2025-03-26 • agy-customizations
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 leading-relaxed">
                      Enlaza tu cuenta de WAPPY con <strong>Google Antigravity Cloud</strong> (<code className="font-mono">antigravity.google.com</code>) mediante <strong>MCP Streamable HTTP (<code className="font-mono">2025-03-26</code>) + 3 Skills Declarativas Oficiales (<code className="font-mono">SKILL.md</code>)</strong> sin daemons en segundo plano, 100% compatible con la VM efímera y los controles de seguridad de Google. Si trabajas en escritorio (Mac/PC), el modo <strong>Local</strong> mantiene el instalador <code className="font-mono">Activar-Tenshi-Wappy.command</code>/<code className="font-mono">.bat</code> con Push SSE en tiempo real.
                    </p>
                  </div>
                </div>

                {/* Botonera dedicada Cloud en su propia fila (Regla Anti-Flicker ExpandableButton, 0px overflow) */}
                <div className="flex flex-wrap items-center justify-start gap-2.5">
                  <ExpandingButton
                    onClick={() => {
                      window.open('https://antigravity.google.com', '_blank', 'noopener,noreferrer');
                    }}
                    icon={ExternalLink}
                    label="Abrir antigravity.google.com"
                    variant="cyan"
                    title="Abrir Google Antigravity Cloud (antigravity.google.com) en una nueva pestaña"
                  />
                  <ExpandingButton
                    onClick={handleCopyCloudPrompt}
                    icon={copiedCloudPrompt ? Check : Copy}
                    label={
                      copiedCloudPrompt
                        ? '¡Prompt Cloud Copiado!'
                        : '📋 Copiar Prompt Declarativo Cloud'
                    }
                    variant="purple"
                    title="Copiar el Prompt Declarativo Cloud (MCP Streamable HTTP + 3 Skills SKILL.md) para pegarlo en antigravity.google.com"
                  />
                </div>
              </div>

              {/* Instrucciones rápidas en 3 pasos para Cloud + Nota de Google Drive / GitHub en Resources */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-sky-500/20 flex flex-col gap-1">
                  <span className="text-xs font-extrabold text-sky-700 dark:text-sky-300">
                    1. Abre antigravity.google.com
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                    Inicia sesión con tu cuenta de Google en <strong>https://antigravity.google.com</strong> desde cualquier navegador o dispositivo.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-sky-500/20 flex flex-col gap-1">
                  <span className="text-xs font-extrabold text-sky-700 dark:text-sky-300">
                    2. Adjunta Drive / GitHub en Resources
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                    En el panel lateral <strong>Resources</strong> de Antigravity Web puedes adjuntar tus carpetas de <strong>Google Drive</strong> o repositorios de <strong>GitHub</strong> para trabajar en la nube.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-sky-500/20 flex flex-col gap-1">
                  <span className="text-xs font-extrabold text-sky-700 dark:text-sky-300">
                    3. Pega el Prompt Declarativo Cloud
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                    Haz clic en <strong>📋 Copiar Prompt Declarativo Cloud</strong> y pégalo en el chat: registrará <code className="font-mono">mcp_config.json</code> (<code className="font-mono">/mcp</code>), guardará las 3 <code className="font-mono">SKILL.md</code> y marcará <strong>🟢 Conectado</strong>.
                  </p>
                </div>
              </div>

              {/* Vista previa del Prompt Declarativo Cloud */}
              <div className="p-3.5 rounded-xl bg-sky-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-mono text-xs border border-sky-200/70 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap select-all max-h-48 overflow-y-auto break-all">
                {cloudAntigravityPrompt}
              </div>

              {/* Nota de Seguridad sobre la clave personal wpy_live_... (Grupo 8: Amber) */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 text-[11px] leading-relaxed min-w-0">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <strong className="font-extrabold">Nota de seguridad:</strong> No compartas públicamente tu clave personal <code className="font-mono">wpy_live_...</code> ni capturas con la URL completa. Si alguna vez queda expuesta, puedes revocarla y generar una nueva al instante en la pestaña{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('keys')}
                    className="font-extrabold underline hover:text-amber-700 dark:hover:text-amber-100 transition-colors cursor-pointer"
                  >
                    Mis Claves
                  </button>
                  .
                </div>
              </div>
            </div>
          )}

          {(connectionGuideMode === 'both' || connectionGuideMode === 'local') && (
            <>
          {/* Encabezado de Sección Local */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                🖥️ Conexión Antigravity Local (Mac / Windows) — Paso a Paso
              </span>
            </div>
          </div>

          {/* Guía Rápida de 3 Pasos arriba para orientar al usuario desde el primer vistazo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                <span className="w-6 h-6 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-xs font-black">1</span>
                <span>Conecta tu cuenta</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                Copia el <strong>Paso 1</strong> de abajo y pégalo en el chat de <strong>Antigravity</strong> (Mac o Windows) para registrar tu clave.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400">
                <span className="w-6 h-6 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-xs font-black">2</span>
                <span>Abre un nuevo chat y prueba</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                Reinicia Antigravity (o haz clic en <strong>+ New Conversation</strong>) y pega el <strong>Paso 2</strong> para ver el resumen de tu empresa.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-6 h-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs font-black">3</span>
                <span>Activa Puente SSE + Skills v2.7.0</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                Ejecuta el comando del <strong>Paso 3</strong> en la <strong>Terminal</strong> o descarga el activador de 1 clic para instalar las 3 Skills SST, scripts CLI y órdenes en vivo.
              </p>
            </div>
          </div>

          {/* PASO 1: Conectar cuenta en el Chat de Antigravity */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-orange-500/30 dark:border-orange-500/30 flex flex-col gap-3 shadow-sm min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-black text-xs shrink-0">
                  1
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Paso 1: Copia y pega este mensaje en el chat de Antigravity
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-300">
                      Obligatorio • JSON Declarativo
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Registra de forma declarativa y estándar las 120+ herramientas de tu cuenta WAPPY en tu configuración MCP de Antigravity:
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

            <div className="p-3.5 rounded-xl bg-orange-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-mono text-xs border border-orange-200/60 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap select-all max-h-56 overflow-y-auto break-all">
              {antigravityPrompt}
            </div>
          </div>

          {/* PASO 2: Reiniciar / Nuevo Chat y Verificar Conexión */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-teal-500/30 dark:border-teal-500/30 flex flex-col gap-3 shadow-sm min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-xs shrink-0">
                  2
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Paso 2: Abre un nuevo chat (+ New Conversation) y pega este mensaje
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300">
                      Verificación
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Cuando Antigravity termine el Paso 1, abre una <strong>Nueva Conversación</strong>, pega esto y haz clic en <strong>Always Allow</strong> si te pide permiso:
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

            <div className="p-3.5 rounded-xl bg-teal-50/40 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-mono text-xs border border-teal-200/60 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap select-all break-words">
              {verifyConnectionPrompt}
            </div>
          </div>

          {/* PASO 3: Activar enlace en vivo con Tenshi + Paquete Oficial v2.7.0 en la Terminal o Descarga 1-Clic */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-500/30 dark:border-emerald-500/30 flex flex-col gap-3 shadow-sm min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xs shrink-0">
                  3
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Paso 3: Activar Puente SSE 24/7 + Paquete Oficial de Skills &amp; Portales SST (v2.7.0)
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                      Terminal o 1-Clic • v2.7.0
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Abre la <strong>Terminal</strong> en Antigravity (<code className="font-mono">Terminal &gt; New Terminal</code> o <code className="font-mono">Ctrl + ñ</code>), pega este comando y presiona Enter (o descarga el activador de 1 clic):
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <ExpandingButton
                  onClick={handleDownloadInstaller}
                  icon={Download}
                  label="Descargar Activador 1-Clic"
                  variant="teal"
                  title="Descargar instalador ejecutable v2.7.0 (.bat para Windows / .command para Mac)"
                />
                <ExpandingButton
                  onClick={() => copyToClipboard(cronOnlyPrompt, 'cron')}
                  icon={copiedCron ? Check : Terminal}
                  label={copiedCron ? '¡Comando Copiado!' : 'Copiar Comando Terminal'}
                  variant="emerald"
                  title="Copiar comando de 1 línea (daemon.js --install) para pegar en la Terminal de Antigravity"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-mono text-xs border border-emerald-200/60 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap select-all max-h-56 overflow-y-auto break-all">
              {cronOnlyPrompt}
            </div>
          </div>

          </> 
          )}

          {/* Resumen sencillo de qué puede hacer el usuario una vez conectado */}
          <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-500/30 dark:border-teal-500/30 flex flex-col gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xs shrink-0">
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
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300">💻 Portales &amp; Archivos</span>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Verifica ARL, EPS, Pensiones, Alturas o SIMIT desde tu IP con navegador integrado y envía certificados directo al chat.
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
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-500/10 dark:bg-zinc-800/80 border border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                  {seccion.tools.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {seccion.tools.map((t) => {
                  const Icon = t.icon;
                  return (
                    <div
                      key={t.name}
                      className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex flex-col gap-1.5 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={cn('w-4 h-4 shrink-0', t.color)} />
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-zinc-100 break-all">{t.name}</span>
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
          ) : !Array.isArray(keys) || keys.length === 0 ? (
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
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-zinc-200">{k?.name || 'Antigravity MCP Key'}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-zinc-400">{k?.keyPrefix || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-zinc-400">
                        {k?.createdAt ? new Date(k.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-zinc-400">
                        {k?.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Nunca'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ExpandingButton
                          onClick={() => handleDeleteKey(k.id)}
                          disabled={deletingId === k.id}
                          isLoading={deletingId === k.id}
                          icon={Trash2}
                          label="Revocar"
                          variant="rose"
                          size="sm"
                          title="Revocar clave API"
                          className="ml-auto"
                        />
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
