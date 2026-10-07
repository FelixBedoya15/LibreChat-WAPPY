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

  // Instrucción para pegar en el chat de Antigravity
  const antigravityPrompt = `Configura mi conexión con WAPPY en tu archivo de servidores MCP (mcp_config.json) usando esta URL remota:
URL: ${sseServerUrl}

Es una conexión MCP directa en la nube por SSE. Una vez agregues el servidor MCP 'wappy', hazme un diagnóstico 360° de mi empresa en WAPPY.`;

  // Configuración JSON para mcp_config.json
  const antigravityJsonConfig = JSON.stringify(
    {
      mcpServers: {
        wappy: {
          serverUrl: sseServerUrl,
        },
      },
    },
    null,
    2
  );

  const copyToClipboard = async (text: string, type: 'key' | 'config' | 'prompt' | 'local') => {
    let keyToUse = newKeyGenerated;
    if (!keyToUse && (type === 'config' || type === 'prompt' || type === 'local')) {
      keyToUse = await handleCreateKey();
    }

    let textToCopy = text;
    if (keyToUse) {
      const liveSseUrl = `${originUrl}/api/mcp-bridge/sse?apiKey=${keyToUse}`;
      if (type === 'key') {
        textToCopy = keyToUse;
      } else if (type === 'prompt') {
        textToCopy = `Configura mi conexión con WAPPY en tu archivo de servidores MCP (mcp_config.json) usando esta URL remota:\nURL: ${liveSseUrl}\n\nEs una conexión MCP directa en la nube por SSE. Una vez agregues el servidor MCP 'wappy', hazme un diagnóstico 360° de mi empresa en WAPPY.`;
      } else if (type === 'config') {
        textToCopy = JSON.stringify(
          {
            mcpServers: {
              wappy: {
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

      {/* Tab: Configuración JSON */}
      {activeTab === 'config' && (
        <div className="flex flex-col gap-5">
          {/* Método 1: Instrucción para el Chat de Antigravity (Recomendado) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-orange-500/30 dark:border-orange-500/30 flex flex-col gap-3 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Método 1: Pega esta instrucción en el chat de Antigravity
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500 text-white shadow-2xs">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Solo copia este texto y pégalo en el chat de Antigravity. El agente configurará la conexión remota por ti:
                  </p>
                </div>
              </div>

              <ExpandingButton
                onClick={() => copyToClipboard(antigravityPrompt, 'prompt')}
                icon={copiedPrompt ? Check : Copy}
                label={copiedPrompt ? '¡Instrucción Copiada!' : 'Copiar Instrucción para Antigravity'}
                variant="orange"
                title="Copiar instrucción para el chat de Antigravity"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-orange-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-mono text-xs border border-orange-200/60 dark:border-zinc-800 leading-relaxed whitespace-pre-wrap select-all">
              {antigravityPrompt}
            </div>
          </div>

          {/* Método 2: Configuración JSON en mcp_config.json */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    Método 2: Configuración manual en tu archivo JSON
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Pega este bloque en tu archivo <code className="text-teal-600 dark:text-teal-400 font-mono">~/.gemini/antigravity/mcp_config.json</code> o en Ajustes MCP:
                  </p>
                </div>
              </div>
              <ExpandingButton
                onClick={() => copyToClipboard(antigravityJsonConfig, 'config')}
                icon={copiedConfig ? Check : Copy}
                label={copiedConfig ? '¡Copiado!' : 'Copiar Configuración JSON'}
                variant="teal"
                title="Copiar configuración en formato JSON"
              />
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed select-all">
              {antigravityJsonConfig}
            </pre>
          </div>

          {/* Guía Rápida de 3 Pasos Detallada */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                <span className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center text-xs font-black">1</span>
                <span>Genera tu Clave API</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                Haz clic arriba en <strong>"Generar Clave API"</strong>. Esta clave única garantiza que Antigravity acceda de manera segura a los datos de tu empresa.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400">
                <span className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center text-xs font-black">2</span>
                <span>Conecta Antigravity</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                Pega la <strong>Instrucción en el chat</strong> o agrega la URL remota en tu <code className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">mcp_config.json</code> para sincronizar de inmediato.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-black">3</span>
                <span>Control Total Autónomo</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                Dile a Antigravity: <em>"Hazme un diagnóstico 360° de mi empresa, revisa los trabajadores y programa las tareas del cronograma"</em>.
              </p>
            </div>
          </div>

          {/* Desplegable Opcional: Conexión Local Stdio (Desarrolladores) */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80">
            <button
              onClick={() => setShowAdvancedLocal(!showAdvancedLocal)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
            >
              {showAdvancedLocal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>Conexión Local Alternativa por Stdio (Opcional)</span>
            </button>

            {showAdvancedLocal && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-100/60 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 flex flex-col gap-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Configuración local tradicional por Stdio:
                  </div>
                  <ExpandingButton
                    onClick={() => copyToClipboard(localStdioConfig, 'local')}
                    icon={copiedLocal ? Check : Copy}
                    label={copiedLocal ? 'Copiado' : 'Copiar Stdio'}
                    variant="secondary"
                    size="sm"
                    title="Copiar configuración local Stdio"
                  />
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed select-all">
                  {localStdioConfig}
                </pre>
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
                          className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 ml-auto"
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
