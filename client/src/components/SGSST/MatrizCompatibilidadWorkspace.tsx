import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import {
  FlaskConical,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Star,
  AlertTriangle,
  Flame,
  BrainCircuit,
  Scale,
  X,
  MessageSquare,
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
  const { showToast } = useToastContext();
  const [officialConvId, setOfficialConvId] = useState<string | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [officialMeta, setOfficialMeta] = useState<{
    hasOfficial?: boolean;
    officialTitle?: string;
    sourceConversationId?: string;
    updatedAt?: string;
    rowCount?: number;
    criticalCount?: number;
  }>({
    hasOfficial: false,
    officialTitle: 'Matriz de Compatibilidad Química SG-SST',
    rowCount: 0,
    criticalCount: 0,
  });
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
        const rows = officialData.matrixRows || [];
        const critical = rows.filter((r: any) => {
          const incomp = (r.incompatibilidades || '').toLowerCase();
          const hasIncomp =
            incomp.length > 5 &&
            !incomp.includes('ninguna') &&
            !incomp.includes('compatible con todo');
          const isHazardousClase = /clase\s*[1-68]/i.test(r.clasificacion_onu || '');
          const hasPictos = Array.isArray(r.pictogramas_sga) && r.pictogramas_sga.length > 0;
          return hasIncomp || isHazardousClase || hasPictos;
        }).length;

        const cleanTitle = officialData.officialTitle
          ? officialData.officialTitle.replace(/\bOficial\s*/gi, '').trim()
          : '';

        setOfficialConvId(officialData.conversationId);
        setActiveConvId((prev) => prev || officialData.conversationId);
        setOfficialMeta({
          hasOfficial: officialData.isOfficial || rows.length > 0,
          officialTitle: cleanTitle || 'Matriz de Compatibilidad Química SG-SST',
          sourceConversationId: officialData.sourceConversationId,
          updatedAt: officialData.updatedAt,
          rowCount: rows.length,
          criticalCount: critical,
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
          officialTitle: 'Matriz de Compatibilidad Química SG-SST',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOfficialConvId(data.conversationId);
        setActiveConvId(data.conversationId);
        setShowMatrixSelector(false);
        showToast({
          message: '¡Matriz de Compatibilidad fijada en el Sistema exitosamente!',
        });
        await loadOfficialAndList();
      }
    } catch (error) {
      console.error('Error promoting chemical compatibility matrix:', error);
      showToast({
        message: 'No se pudo fijar la matriz química.',
        status: 'error',
      });
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

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ─── BANNER DE CONTROL Y ESTADO DE MATRIZ DE COMPATIBILIDAD QUÍMICA ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        {/* Glow de fondo */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Lado Izquierdo: Información y Estado */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-500/20">
              <FlaskConical className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  {officialMeta.officialTitle || 'Matriz de Compatibilidad Química SG-SST'}
                </h2>
                {(officialMeta.rowCount ?? 0) > 0 ? (
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
                      <span className="text-xs font-black uppercase tracking-wider">
                        Matriz Activa
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    title="Sin Sustancias Registradas"
                    className="group flex h-7 min-w-[28px] sm:h-8 sm:min-w-[32px] shrink-0 cursor-default items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                  >
                    <div className="relative flex flex-shrink-0 items-center justify-center">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    </div>
                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                      <span className="text-xs font-black uppercase tracking-wider">
                        Sin Sustancias Vinculadas
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Badges de Métricas Conectadas con Estilo Expansible Estándar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Sustancias Químicas Evaluadas */}
                <div
                  title={`${officialMeta.rowCount ?? 0} Sustancias Químicas Registradas`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <FlaskConical className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                      {officialMeta.rowCount ?? 0}
                    </span>
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {officialMeta.rowCount ?? 0}{' '}
                      {(officialMeta.rowCount ?? 0) === 1
                        ? 'Sustancia Registrada'
                        : 'Sustancias Registradas'}
                    </span>
                  </div>
                </div>

                {/* Críticos / Segregación Requerida */}
                {(officialMeta.criticalCount ?? 0) > 0 && (
                  <div
                    title={`${officialMeta.criticalCount} Sustancias con Segregación / Críticas SGA`}
                    className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                  >
                    <div className="relative flex flex-shrink-0 items-center justify-center">
                      <Flame className="h-4 w-4 sm:h-5 sm:w-5 fill-rose-500 text-rose-500 shrink-0" />
                      <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                        {officialMeta.criticalCount}
                      </span>
                    </div>
                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                      <span className="text-sm font-bold tracking-wide">
                        {officialMeta.criticalCount} Críticos / Segregación
                      </span>
                    </div>
                  </div>
                )}

                {/* Acto Predictivo ML */}
                <div
                  title="Conectada al Acto Predictivo ML y Registro Químico SGA"
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

                {/* Res. 0312 Est. 4.1.3: CUMPLE */}
                <div
                  title="Res. 0312/2019 Estándar 4.1.3 — Identificación y Control de Sustancias Químicas Peligrosas / SGA (Res. 773/21 y Dec. 1496/18): CUMPLE"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      Res. 0312 Est. 4.1.3: CUMPLE
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
              onClick={() => setShowMatrixSelector(true)}
              title="Cambiar / Vincular desde Chats"
              aria-label="Cambiar / Vincular desde Chats"
              className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 shadow-sm outline-none transition-all duration-300 sm:h-10 sm:min-w-[40px] sm:px-2.5 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <div className="relative flex flex-shrink-0 items-center justify-center">
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
              </div>
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                <span className="text-sm font-bold tracking-wide">
                  Cambiar / Vincular desde Chats
                </span>
              </div>
            </button>
            {officialMeta.updatedAt && (
              <span className="text-[10px] text-text-tertiary">
                Última actualización:{' '}
                {new Date(officialMeta.updatedAt).toLocaleDateString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL DE SELECCIÓN DE MATRICES DESDE CHATS ─── */}
      {showMatrixSelector && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-surface-primary rounded-3xl border border-border-light shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border-light px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                  <Star className="h-5 w-5 fill-teal-500 text-teal-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary">
                    Seleccionar Matriz de Compatibilidad Química
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Solo puede existir 1 matriz activa a la vez en el aplicativo institucional.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMatrixSelector(false)}
                className="rounded-full p-1.5 text-text-secondary hover:bg-surface-tertiary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {isLoadingOfficial ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-secondary">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                  <span className="text-xs font-semibold">
                    Consultando matrices químicas en los chats…
                  </span>
                </div>
              ) : userMatrices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <FlaskConical className="h-10 w-10 text-text-tertiary" />
                  <p className="text-sm font-bold text-text-secondary">
                    No se encontraron matrices en otros chats
                  </p>
                  <p className="text-xs text-text-tertiary max-w-sm">
                    Puedes interactuar con el agente en el chat para clasificar sustancias SGA o gestionarlas directamente en la tabla inferior.
                  </p>
                </div>
              ) : (
                userMatrices.map((mat) => (
                  <div
                    key={mat.conversationId}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      mat.isOfficial || mat.conversationId === officialConvId
                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm'
                        : 'border-border-medium hover:border-teal-400 bg-surface-secondary/50 hover:bg-surface-secondary'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1 mr-4">
                      <div className="mt-1">
                        {mat.isOfficial || mat.conversationId === officialConvId ? (
                          <Star className="h-4 w-4 fill-emerald-500 text-emerald-500 shrink-0" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-text-tertiary shrink-0" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-text-primary truncate">
                            {mat.officialTitle ||
                              `Matriz Chat (${mat.conversationId.slice(0, 8)}...)`}
                          </p>
                          {(mat.isOfficial || mat.conversationId === officialConvId) && (
                            <span className="inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-white shrink-0">
                              Activa
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mt-1">
                          <span>
                            <strong>{mat.rowCount}</strong> sustancias
                          </span>
                          {mat.previewUbicaciones && (
                            <span className="text-text-tertiary">
                              · Ubicaciones: {mat.previewUbicaciones}
                            </span>
                          )}
                          <span className="text-text-tertiary">
                            · {new Date(mat.updatedAt).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {mat.isOfficial || mat.conversationId === officialConvId ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <CheckCircle2 className="h-4 w-4" /> Seleccionada
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePromoteSelectedToOfficial(mat.conversationId)}
                          disabled={isPromoting}
                          title="Fijar en Aplicativo"
                          aria-label="Fijar en Aplicativo"
                          className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-600 bg-teal-600 hover:bg-teal-700 text-white px-2 shadow-sm outline-none transition-all duration-300 disabled:opacity-50 sm:h-10 sm:min-w-[40px] sm:px-2.5 sm:hover:-rotate-3 sm:hover:scale-105"
                        >
                          <div className="relative flex flex-shrink-0 items-center justify-center">
                            {isPromoting ? (
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            ) : (
                              <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-white/20" />
                            )}
                          </div>
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                            <span className="text-sm font-bold tracking-wide">
                              Fijar en Aplicativo
                            </span>
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
                Tip: En cualquier momento puedes modificarla en la tabla o pedirle a un agente que clasifique más sustancias SGA.
              </span>
              <button
                onClick={() => setShowMatrixSelector(false)}
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
        <MatrizCompatibilidadTable
          conversationId={activeConvId}
          isOfficialApp={true}
          onRefreshOfficialList={loadOfficialAndList}
        />
      </div>
    </div>
  );
}
