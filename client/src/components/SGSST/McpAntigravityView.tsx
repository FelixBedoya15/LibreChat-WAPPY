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
  const effectiveKey = newKeyGenerated || (keys.length > 0 ? `${keys[0].keyPrefix}` : 'PEGA_TU_CLAVE_AQUI');
  const sseServerUrl = `${originUrl}/api/mcp-bridge/sse?apiKey=${effectiveKey}`;

  // Paso 3: Mensaje para pegar en el chat de Antigravity (Opción A: código local visible sin descargas remotas ni palabra daemon)
  const buildPushBridgePrompt = (key: string) => `Hola Antigravity, para recibir mis consultas de voz de Tenshi desde mi cuenta de WAPPY, guarda este cliente local de eventos SSE en mi carpeta de usuario (.gemini/antigravity/wappy-tenshi-listener.js) usando write_file e inícialo con node usando run_command (con IsDaemon=true y WaitMsBeforeAsync=500):

\`\`\`js
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

const WAPPY_URL = '${originUrl}';
const API_KEY = '${key}';
const agyDir = path.join(os.homedir(), '.gemini', 'antigravity');
const threadFile = path.join(agyDir, 'wappy-tenshi-thread.json');
const binName = process.platform === 'win32' ? 'agentapi.exe' : 'agentapi';
const agentBin = path.join(agyDir, 'bin', binName);

function connectStream() {
  https.get(\`\${WAPPY_URL}/api/mcp-bridge/antigravity/stream?apiKey=\${API_KEY}\`, (res) => {
    let buf = '', ev = '';
    res.on('data', (chunk) => {
      buf += chunk.toString();
      const lines = buf.split('\\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('event:')) ev = line.slice(6).trim();
        else if (line.startsWith('data:') && ev === 'nueva_orden') {
          try {
            handleOrden(JSON.parse(line.slice(5).trim()));
          } catch (_) {}
        }
      }
    });
    res.on('end', () => setTimeout(connectStream, 5000));
  }).on('error', () => setTimeout(connectStream, 5000));
}

function handleOrden(orden) {
  const id = orden.id || orden._id;
  if (!id) return;
  const req = https.request(\`\${WAPPY_URL}/api/mcp-bridge/antigravity/ordenes/\${id}/claim?apiKey=\${API_KEY}\`, { method: 'POST' }, (res) => {
    if (res.statusCode !== 200) return;
    const prompt = \`[Consulta de Tenshi #\${id}]: \${orden.instruccion || orden.pregunta}\\n\\nAl responder, envía el resultado a Tenshi usando la herramienta MCP wappy_completar_orden_delegada_tenshi con ordenId="\${id}".\`;
    let convoId = '';
    if (!orden.nuevoChat && fs.existsSync(threadFile)) {
      try {
        const saved = JSON.parse(fs.readFileSync(threadFile, 'utf8'));
        if (saved.conversationId && Date.now() - (saved.lastUsedAt || 0) < 7200000) convoId = saved.conversationId;
      } catch (_) {}
    }
    const args = convoId ? ['send', convoId, prompt] : ['new-conversation', os.homedir(), prompt];
    execFile(agentBin, args, () => {});
  });
  req.on('error', () => {});
  req.end();
}

connectStream();
console.log('Conector de eventos Tenshi WAPPY activo.');
\`\`\`

Confírmame apenas quede corriendo.`;

  const cronOnlyPrompt = buildPushBridgePrompt(effectiveKey);

  // Paso 1: Mensaje limpio para pegar en el chat de Antigravity (invoca agy-customizations sin curl ni daemon para evitar bloqueos de seguridad)
  const buildAntigravityPrompt = (url: string) => `Hola Antigravity, usando tu guía interna agy-customizations (MCP Servers), ayúdame a registrar mi servidor MCP "wappy" en mi archivo de configuración global de MCP (.gemini/config/mcp_config.json y .gemini/antigravity/mcp_config.json dentro de mi carpeta de usuario, conservando cualquier otro servidor que ya exista en mcpServers) con este bloque JSON:

{
  "mcpServers": {
    "wappy": {
      "url": "${url}",
      "serverUrl": "${url}"
    }
  }
}

Por favor usa tus herramientas de lectura y edición de archivos para guardarlo y confírmame cuando quede listo.`;

  const antigravityPrompt = buildAntigravityPrompt(sseServerUrl);

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

    let keyToUse = newKeyGenerated;
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
        textToCopy = buildAntigravityPrompt(liveSseUrl);
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
                    Registra las {totalHerramientas} herramientas de tu cuenta WAPPY en Antigravity sin bloqueos de seguridad:
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

            <div className="p-3.5 rounded-xl bg-orange-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-mono text-xs border border-orange-200/60 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap select-all">
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
