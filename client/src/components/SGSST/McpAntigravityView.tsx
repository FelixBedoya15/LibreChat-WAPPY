import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Terminal,
  Shield,
  Sparkles,
  ExternalLink,
  Cpu,
  Layers,
  FileSpreadsheet,
  Users,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import { cn } from '~/utils';

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
  const handleCreateKey = async () => {
    if (!token) return;
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
          message: 'Clave API generada. Copia la clave ahora.',
          status: 'success',
        });
        loadKeys();
      } else {
        showToast({
          message: 'Error al generar la clave API.',
          status: 'error',
        });
      }
    } catch (err) {
      showToast({
        message: 'Error de conexión al generar clave.',
        status: 'error',
      });
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

  const copyToClipboard = (text: string, type: 'key' | 'config') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    }
    showToast({ message: 'Copiado al portapapeles', status: 'success' });
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio-wappy.com';
  const effectiveKey = newKeyGenerated || (keys.length > 0 ? `${keys[0].keyPrefix}` : 'PEGA_TU_CLAVE_AQUI');

  const antigravityJsonConfig = JSON.stringify(
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
              <h2 className="text-lg font-bold">Conexión con Antigravity (MCP)</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                Multi-Tenant
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Conecta tu propio Antigravity para que alimente automáticamente tu perfil de empresa, matriz GTC-45, PESV y cronograma de SST.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateKey}
          disabled={creating}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 shrink-0 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'Generando...' : 'Generar Clave API'}
        </button>
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
            <button
              onClick={() => copyToClipboard(newKeyGenerated, 'key')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-all shrink-0 active:scale-95"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey ? 'Copiada' : 'Copiar Clave'}
            </button>
          </div>
        </div>
      )}

      {/* Selector de Pestañas */}
      <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 w-fit">
        <button
          onClick={() => setActiveTab('config')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all',
            activeTab === 'config'
              ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
          )}
        >
          <Terminal className="w-3.5 h-3.5" />
          Configuración Antigravity
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all',
            activeTab === 'tools'
              ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          Herramientas Disponibles (10)
        </button>
        <button
          onClick={() => setActiveTab('keys')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all',
            activeTab === 'keys'
              ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
          )}
        >
          <Key className="w-3.5 h-3.5" />
          Mis Claves ({keys.length})
        </button>
      </div>

      {/* Tab: Configuración JSON */}
      {activeTab === 'config' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold">Bloque de Configuración MCP</span>
              </div>
              <button
                onClick={() => copyToClipboard(antigravityJsonConfig, 'config')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                {copiedConfig ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedConfig ? '¡Copiado!' : 'Copiar Configuración'}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed select-all">
              {antigravityJsonConfig}
            </pre>
          </div>

          {/* Guía Rápida de 3 Pasos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                <span className="w-5 h-5 rounded-full bg-orange-500/10 flex items-center justify-center text-[11px]">1</span>
                <span>Genera tu Clave</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                Haz clic arriba en <strong>"Generar Clave API"</strong> y copia el código único generado para tu cuenta.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400">
                <span className="w-5 h-5 rounded-full bg-teal-500/10 flex items-center justify-center text-[11px]">2</span>
                <span>Configura Antigravity</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                Pega el bloque JSON en tu configuración de MCP de Antigravity (o en tu archivo de herramientas).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-[11px]">3</span>
                <span>Pídele a la IA</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                Dile a Antigravity: <em>"Alimenta mi matriz GTC-45 con los riesgos del área de logística"</em> y se guardará en tu perfil.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Catálogo de Herramientas */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {[
            {
              name: 'wappy_consultar_perfil_empresa',
              desc: 'Consulta Razón Social, NIT, ARL, Nivel de Riesgo, Representante Legal, Trabajadores y Sedes activas de tu perfil.',
              icon: Users,
              color: 'text-teal-500',
            },
            {
              name: 'wappy_actualizar_perfil_empresa',
              desc: 'Actualiza campos de la empresa y sincroniza de inmediato la memoria de los agentes inteligentes en WAPPY.',
              icon: Sparkles,
              color: 'text-orange-500',
            },
            {
              name: 'wappy_consultar_matriz_gtc45',
              desc: 'Consulta los peligros y riesgos evaluados en la Matriz GTC-45 oficial con filtros por cargo, proceso o peligro.',
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
              desc: 'Registra riesgos y planes de acción viales en la Matriz PESV oficial de la empresa.',
              icon: CheckCircle2,
              color: 'text-indigo-500',
            },
            {
              name: 'wappy_consultar_trabajadores',
              desc: 'Lista los empleados y perfiles registrados en el módulo sociodemográfico de SST.',
              icon: Users,
              color: 'text-cyan-500',
            },
            {
              name: 'wappy_registrar_trabajador',
              desc: 'Registra o actualiza un trabajador en el perfil sociodemográfico (cédula, cargo, área, sede, nivel ARL).',
              icon: Plus,
              color: 'text-emerald-500',
            },
            {
              name: 'wappy_consultar_cronograma_sst',
              desc: 'Consulta las tareas pendientes y vencimientos del cronograma y plan de trabajo anual de SST.',
              icon: CalendarCheck,
              color: 'text-purple-500',
            },
            {
              name: 'wappy_crear_actividad_cronograma',
              desc: 'Programa actividades de capacitación, auditorías, inspecciones o hitos en el plan de trabajo anual.',
              icon: CalendarCheck,
              color: 'text-rose-500',
            },
          ].map((t) => {
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
                          className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Revocar clave"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
