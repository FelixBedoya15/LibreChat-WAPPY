import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import {
  AlertTriangle,
  Star,
  RefreshCw,
  CheckCircle2,
  BrainCircuit,
  Scale,
  Sparkles,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  X,
  Loader2,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import MatrizIPEVARTable from './MatrizIPEVARTable';

interface ChatMatrixItem {
  conversationId: string;
  title: string;
  isOfficial: boolean;
  rowCount: number;
  criticalCount: number;
  sourceConversationId?: string | null;
  promotedAt?: string | null;
  updatedAt: string;
}

export default function MatrizIPEVARWorkspace() {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [officialInfo, setOfficialInfo] = useState<{
    hasOfficial: boolean;
    officialTitle: string;
    rowCount: number;
    criticalCount: number;
    sourceConversationId: string | null;
    promotedAt: string | null;
    updatedAt: string | null;
  }>({
    hasOfficial: false,
    officialTitle: 'Matriz IPEVAR SG-SST',
    rowCount: 0,
    criticalCount: 0,
    sourceConversationId: null,
    promotedAt: null,
    updatedAt: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [chatMatrices, setChatMatrices] = useState<ChatMatrixItem[]>([]);
  const [isLoadingMatrices, setIsLoadingMatrices] = useState(false);
  const [isSettingOfficial, setIsSettingOfficial] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cargar estado de la matriz
  const fetchOfficialStatus = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/sgsst/gtc45-workspace/official', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const rows = data.matrixRows || [];
        const critical = rows.filter((r: any) => (Number(r.nr) || 0) >= 150).length;
        const cleanTitle = data.officialTitle ? data.officialTitle.replace(/\bOficial\s*/gi, '').trim() : '';
        setOfficialInfo({
          hasOfficial: data.hasOfficial || rows.length > 0,
          officialTitle: cleanTitle || 'Matriz IPEVAR SG-SST',
          rowCount: rows.length,
          criticalCount: critical,
          sourceConversationId: data.sourceConversationId || null,
          promotedAt: data.promotedAt || null,
          updatedAt: data.updatedAt || null,
        });
      }
    } catch (err) {
      console.error('[MatrizIPEVARWorkspace] Error loading official matrix:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOfficialStatus();
  }, [fetchOfficialStatus, refreshKey]);

  // Escuchar eventos globales de sincronización
  useEffect(() => {
    const handleSync = () => {
      fetchOfficialStatus();
      setRefreshKey((k) => k + 1);
    };
    window.addEventListener('ipevar-official-updated', handleSync);
    return () => window.removeEventListener('ipevar-official-updated', handleSync);
  }, [fetchOfficialStatus]);

  // Abrir selector y cargar matrices creadas en los chats
  const handleOpenSelector = async () => {
    setIsSelectorOpen(true);
    if (!token) return;
    try {
      setIsLoadingMatrices(true);
      const res = await fetch('/api/sgsst/gtc45-workspace/list-user-matrices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatMatrices(data.matrices || []);
      }
    } catch (err) {
      console.error('[MatrizIPEVARWorkspace] Error listing matrices:', err);
    } finally {
      setIsLoadingMatrices(false);
    }
  };

  // Establecer una matriz de chat como oficial
  const handleSelectOfficial = async (item: ChatMatrixItem) => {
    if (!token) return;
    try {
      setIsSettingOfficial(true);
      const res = await fetch('/api/sgsst/gtc45-workspace/set-official', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceConversationId: item.conversationId,
          officialTitle: item.title,
        }),
      });

      if (res.ok) {
        showToast({
          message: '¡Matriz establecida en el Sistema exitosamente!',
        });
        setIsSelectorOpen(false);
        setRefreshKey((k) => k + 1);
        window.dispatchEvent(new CustomEvent('ipevar-official-updated'));
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (err: any) {
      console.error('[MatrizIPEVARWorkspace] Error setting official matrix:', err);
      showToast({
        message: 'No se pudo fijar la matriz.',
        status: 'error',
      });
    } finally {
      setIsSettingOfficial(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER DE CONTROL Y ESTADO DE MATRIZ ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        {/* Glow de fondo */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Lado Izquierdo: Información y Estado */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-500/20">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  {officialInfo.officialTitle}
                </h2>
                {officialInfo.hasOfficial ? (
                  <div
                    title="Matriz Activa"
                    className="group flex h-7 min-w-[28px] sm:h-8 sm:min-w-[32px] shrink-0 cursor-default items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                  >
                    <div className="relative flex flex-shrink-0 items-center justify-center">
                      <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
                      <span className="absolute -right-1 -top-1 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                      </span>
                    </div>
                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                      <span className="text-xs font-black uppercase tracking-wider">Matriz Activa</span>
                    </div>
                  </div>
                ) : (
                  <div
                    title="Sin Matriz Vinculada"
                    className="group flex h-7 min-w-[28px] sm:h-8 sm:min-w-[32px] shrink-0 cursor-default items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                  >
                    <div className="relative flex flex-shrink-0 items-center justify-center">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    </div>
                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                      <span className="text-xs font-black uppercase tracking-wider">Sin Matriz Vinculada</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Badges de Métricas Conectadas con Estilo Expansible Estándar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Peligros Evaluados */}
                <div
                  title={`${officialInfo.rowCount} Peligros Evaluados`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                      {officialInfo.rowCount}
                    </span>
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {officialInfo.rowCount} {officialInfo.rowCount === 1 ? 'Peligro Evaluado' : 'Peligros Evaluados'}
                    </span>
                  </div>
                </div>

                {/* Críticos (Nivel I / II) */}
                {officialInfo.criticalCount > 0 && (
                  <div
                    title={`${officialInfo.criticalCount} Críticos (Nivel I / II)`}
                    className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                  >
                    <div className="relative flex flex-shrink-0 items-center justify-center">
                      <Flame className="h-4 w-4 sm:h-5 sm:w-5 fill-rose-500 text-rose-500 shrink-0" />
                      <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                        {officialInfo.criticalCount}
                      </span>
                    </div>
                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 sm:flex">
                      <span className="text-sm font-bold tracking-wide">
                        {officialInfo.criticalCount} Críticos (Nivel I / II)
                      </span>
                    </div>
                  </div>
                )}

                {/* Acto Predictivo ML */}
                <div
                  title="Conectada al Acto Predictivo ML"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      Conectada al Acto Predictivo ML
                    </span>
                  </div>
                </div>

                {/* Res. 0312: CUMPLE */}
                <div
                  title="Res. 0312: CUMPLE (Estándares 4.1.1 y 4.2.1)"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      Res. 0312: CUMPLE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Botón de Selección de Matriz con estilo expansible estándar */}
          <div className="flex md:flex-col items-end justify-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenSelector}
              title="Cambiar / Vincular desde Chats"
              aria-label="Cambiar / Vincular desde Chats"
              className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 shadow-sm outline-none transition-all duration-300 sm:h-10 sm:min-w-[40px] sm:px-2.5 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <div className="relative flex flex-shrink-0 items-center justify-center">
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
              </div>
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                <span className="text-sm font-bold tracking-wide">Cambiar / Vincular desde Chats</span>
              </div>
            </button>
            {officialInfo.updatedAt && (
              <span className="text-[10px] text-text-tertiary">
                Última actualización: {new Date(officialInfo.updatedAt).toLocaleDateString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL SELECTOR DE MATRICES DESDE LOS CHATS ─── */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="flex flex-col max-h-[85vh] w-full max-w-2xl rounded-3xl border border-border-medium bg-surface-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border-light px-6 py-4 bg-surface-secondary">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                  <Star className="h-5 w-5 fill-teal-500 text-teal-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary">
                    Seleccionar Matriz para el Aplicativo
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Solo puede existir 1 matriz activa a la vez en el aplicativo institucional.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSelectorOpen(false)}
                className="rounded-full p-1.5 text-text-secondary hover:bg-surface-tertiary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {isLoadingMatrices ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-secondary">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                  <span className="text-xs font-semibold">Consultando tus matrices en los chats…</span>
                </div>
              ) : chatMatrices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <FileSpreadsheet className="h-10 w-10 text-text-tertiary" />
                  <p className="text-sm font-bold text-text-secondary">
                    No se encontraron matrices en otros chats
                  </p>
                  <p className="text-xs text-text-tertiary max-w-sm">
                    Puedes interactuar con el agente en el chat para crear una matriz o editarla directamente en la tabla inferior de este aplicativo.
                  </p>
                </div>
              ) : (
                chatMatrices.map((mat) => (
                  <div
                    key={mat.conversationId}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      mat.isOfficial
                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm'
                        : 'border-border-medium hover:border-teal-400 bg-surface-secondary/50 hover:bg-surface-secondary'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1 mr-4">
                      <div className="mt-1">
                        {mat.isOfficial ? (
                          <Star className="h-4 w-4 fill-emerald-500 text-emerald-500 shrink-0" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-text-tertiary shrink-0" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-text-primary truncate">
                            {mat.title}
                          </p>
                          {mat.isOfficial && (
                            <span className="inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-white shrink-0">
                              Activa
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mt-1">
                          <span>
                            <strong>{mat.rowCount}</strong> peligros
                          </span>
                          {mat.criticalCount > 0 && (
                            <span className="text-rose-500 font-semibold">
                              · {mat.criticalCount} críticos
                            </span>
                          )}
                          <span className="text-text-tertiary">
                            · {new Date(mat.updatedAt).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {mat.isOfficial ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <CheckCircle2 className="h-4 w-4" /> Seleccionada
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectOfficial(mat)}
                          disabled={isSettingOfficial}
                          title="Fijar en Aplicativo"
                          aria-label="Fijar en Aplicativo"
                          className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-600 bg-teal-600 hover:bg-teal-700 text-white px-2 shadow-sm outline-none transition-all duration-300 disabled:opacity-50 sm:h-10 sm:min-w-[40px] sm:px-2.5 sm:hover:-rotate-3 sm:hover:scale-105"
                        >
                          <div className="relative flex flex-shrink-0 items-center justify-center">
                            {isSettingOfficial ? (
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            ) : (
                              <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-white/20" />
                            )}
                          </div>
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                            <span className="text-sm font-bold tracking-wide">Fijar en Aplicativo</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Modal */}
            <div className="border-t border-border-light px-6 py-4 bg-surface-secondary flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                Tip: En cualquier momento puedes modificarla en la tabla o pedirle a un agente que evalúe más riesgos.
              </span>
              <button
                onClick={() => setIsSelectorOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-text-primary bg-surface-tertiary hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TABLA INTERACTIVA COMPLETA ─── */}
      <div className="w-full">
        <MatrizIPEVARTable
          key={`official-ipevar-table-${refreshKey}`}
          conversationId="official"
          isOfficialApp={true}
          onRefreshOfficialList={fetchOfficialStatus}
        />
      </div>
    </div>
  );
}
