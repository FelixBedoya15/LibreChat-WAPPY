import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '~/hooks';
import {
  Beaker,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  Pin,
} from 'lucide-react';
import MatrizCompatibilidadTable from './MatrizCompatibilidadTable';

interface MatrixSummaryItem {
  conversationId: string;
  isOfficial: boolean;
  officialTitle: string;
  rowCount: number;
  previewUbicaciones: string;
  updatedAt: string;
}

export default function MatrizCompatibilidadWorkspace() {
  const { token } = useAuthContext();
  const [officialConvId, setOfficialConvId] = useState<string | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [officialMeta, setOfficialMeta] = useState<{
    officialTitle?: string;
    sourceConversationId?: string;
    updatedAt?: string;
    rowCount?: number;
  }>({});
  const [userMatrices, setUserMatrices] = useState<MatrixSummaryItem[]>([]);
  const [isLoadingOfficial, setIsLoadingOfficial] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);
  const [showMatrixSelector, setShowMatrixSelector] = useState(false);

  const loadOfficialAndList = useCallback(async () => {
    if (!token) return;
    setIsLoadingOfficial(true);
    try {
      const [officialRes, listRes] = await Promise.all([
        fetch('/api/sgsst/chemical-compatibility/official', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/sgsst/chemical-compatibility/list-user-matrices', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (officialRes.ok) {
        const officialData = await officialRes.json();
        setOfficialConvId(officialData.conversationId);
        setActiveConvId((prev) => prev || officialData.conversationId);
        setOfficialMeta({
          officialTitle: officialData.officialTitle || 'Matriz Oficial de Compatibilidad Química',
          sourceConversationId: officialData.sourceConversationId,
          updatedAt: officialData.updatedAt,
          rowCount: (officialData.matrixRows || []).length,
        });
      }

      if (listRes.ok) {
        const listData = await listRes.json();
        setUserMatrices(listData.matrices || []);
      }
    } catch (error) {
      console.error('Error loading official chemical compatibility matrix workspace:', error);
    } finally {
      setIsLoadingOfficial(false);
    }
  }, [token]);

  useEffect(() => {
    loadOfficialAndList();
  }, [loadOfficialAndList]);

  const handlePromoteSelectedToOfficial = async (sourceConvId: string) => {
    if (!token || !sourceConvId) return;
    setIsPromoting(true);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/set-official', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceConversationId: sourceConvId,
          officialTitle: 'Matriz Oficial de Compatibilidad Química',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOfficialConvId(data.conversationId);
        setActiveConvId(data.conversationId);
        setShowMatrixSelector(false);
        await loadOfficialAndList();
      }
    } catch (error) {
      console.error('Error promoting chemical compatibility matrix:', error);
    } finally {
      setIsPromoting(false);
    }
  };

  if (isLoadingOfficial && !activeConvId) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-medium">Cargando Matriz Oficial de Compatibilidad Química...</p>
      </div>
    );
  }

  const isViewingOfficial = activeConvId === officialConvId;

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Barra informativa superior de estado y selector de matrices de conversaciones */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-500/25 bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-transparent px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <Beaker className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                {isViewingOfficial
                  ? officialMeta.officialTitle || 'Matriz Oficial de Compatibilidad Química (SGA / NTC 3966)'
                  : `Visualizando Matriz de Chat (${activeConvId?.slice(0, 8)}...)`}
              </h3>
              {isViewingOfficial ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2.5 py-0.5 text-[11px] font-bold text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  <CheckCircle2 className="h-3 w-3" /> Oficial Activa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Vista Previa de Chat
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
              <span>
                Sincronizada en tiempo real con la herramienta <strong>matriz_compatibilidad</strong>, el Hito 5 y el Centro de Control.
              </span>
              {officialMeta.updatedAt && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  • <Clock className="h-3 w-3" /> Actualizada:{' '}
                  {new Date(officialMeta.updatedAt).toLocaleString('es-CO')}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isViewingOfficial && activeConvId && (
            <button
              onClick={() => handlePromoteSelectedToOfficial(activeConvId)}
              disabled={isPromoting}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-600 disabled:opacity-50"
            >
              {isPromoting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pin className="h-3.5 w-3.5" />}
              Fijar esta como Matriz Oficial
            </button>
          )}

          {!isViewingOfficial && officialConvId && (
            <button
              onClick={() => setActiveConvId(officialConvId)}
              className="flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50"
            >
              Volver a Matriz Oficial
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMatrixSelector((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-700"
            >
              <FolderOpen className="h-3.5 w-3.5 text-teal-600" />
              <span>Cargar desde Conversación ({userMatrices.length})</span>
            </button>

            {showMatrixSelector && (
              <div className="absolute right-0 z-[500] mt-2 w-96 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 shadow-2xl">
                <div className="mb-2 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                    Matrices de Compatibilidad Química Guardadas
                  </span>
                  <button
                    onClick={() => setShowMatrixSelector(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cerrar
                  </button>
                </div>

                {userMatrices.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    Aún no hay matrices químicas registradas en conversaciones.
                  </p>
                ) : (
                  <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                    {userMatrices.map((m) => (
                      <div
                        key={m.conversationId}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition ${
                          activeConvId === m.conversationId
                            ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                            : 'border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        <div
                          className="flex-1 cursor-pointer pr-2"
                          onClick={() => {
                            setActiveConvId(m.conversationId);
                            setShowMatrixSelector(false);
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                              {m.isOfficial
                                ? '★ Matriz Oficial de Compatibilidad Química'
                                : `Sesión Chat (${m.conversationId.slice(0, 8)})`}
                            </span>
                            <span className="rounded-md bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-bold text-teal-600">
                              {m.rowCount} productos
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-zinc-400">
                            Ubicaciones: {m.previewUbicaciones}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {m.updatedAt ? new Date(m.updatedAt).toLocaleString('es-CO') : ''}
                          </p>
                        </div>

                        {!m.isOfficial && (
                          <button
                            onClick={() => handlePromoteSelectedToOfficial(m.conversationId)}
                            disabled={isPromoting}
                            title="Fijar como Matriz Oficial de Compatibilidad Química"
                            className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-600 hover:bg-amber-500 hover:text-white transition"
                          >
                            <Sparkles className="h-3 w-3" />
                            Fijar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={loadOfficialAndList}
            title="Refrescar Matriz Oficial Química"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingOfficial ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Contenedor principal de la Matriz de Compatibilidad Química */}
      <div className="w-full">
        <MatrizCompatibilidadTable
          conversationId={activeConvId}
          isOfficialApp={true}
          onRefreshOfficialList={loadOfficialAndList}
        />
      </div>
    </div>
  );
}
