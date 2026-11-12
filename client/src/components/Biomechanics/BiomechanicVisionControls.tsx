import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Layers, Sparkles, Stethoscope, ExternalLink, Loader2, Check } from 'lucide-react';
import { cn } from '~/utils';
import {
  BiomechanicAngles,
  BiomechanicLayersConfig,
  BiomechanicShaderStyle,
  BiomechanicVisionConfig,
  BiomechanicVisionMode,
  BIOMECH_CONFIG_EVENT,
  BIOMECH_STORAGE_KEY,
  getBiomechanicVisionConfig,
  normalizeBiomechanicConfig,
  saveBiomechanicVisionConfig,
} from '~/utils/biomechanics3D';
import {
  ensureAnatomyXRayAssets,
  isAnatomyXRayLoading,
  isAnatomyXRayReady,
  subscribeAnatomyXRayStatus,
} from '~/utils/anatomyXRay3D';

export function useBiomechanicVisionConfig() {
  const [config, setConfigState] = useState<BiomechanicVisionConfig>(() =>
    getBiomechanicVisionConfig(),
  );
  const [isLoading3D, setIsLoading3D] = useState<boolean>(() => isAnatomyXRayLoading());
  const [isReady3D, setIsReady3D] = useState<boolean>(() => isAnatomyXRayReady());

  useEffect(() => {
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent<BiomechanicVisionConfig>).detail;
      if (detail) {
        setConfigState(normalizeBiomechanicConfig(detail));
      } else {
        setConfigState(getBiomechanicVisionConfig());
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === BIOMECH_STORAGE_KEY) {
        setConfigState(getBiomechanicVisionConfig());
      }
    };
    window.addEventListener(BIOMECH_CONFIG_EVENT, handleCustom);
    window.addEventListener('storage', handleStorage);
    const unsubAssets = subscribeAnatomyXRayStatus((loading, ready) => {
      setIsLoading3D(loading);
      setIsReady3D(ready);
    });
    return () => {
      window.removeEventListener(BIOMECH_CONFIG_EVENT, handleCustom);
      window.removeEventListener('storage', handleStorage);
      unsubAssets();
    };
  }, []);

  const updateConfig = useCallback(
    (
      updater:
        | BiomechanicVisionConfig
        | ((prev: BiomechanicVisionConfig) => BiomechanicVisionConfig),
    ) => {
      const current = getBiomechanicVisionConfig();
      const next = typeof updater === 'function' ? updater(current) : updater;
      const saved = saveBiomechanicVisionConfig(next);
      setConfigState(saved);
      if (saved.mode === 'xray_3d' && !isAnatomyXRayReady()) {
        ensureAnatomyXRayAssets().catch(() => {});
      }
    },
    [],
  );

  return {
    config,
    updateConfig,
    isLoading3D,
    isReady3D,
  };
}

export interface BiomechanicVisionControlsProps {
  angles?: Partial<BiomechanicAngles> | null;
  compact?: boolean;
  className?: string;
}

type ClinicalDotStatus = 'normal' | 'warn' | 'critical' | 'idle';

function resolveLayerClinicalStatus(
  layerKey: keyof BiomechanicLayersConfig,
  angles?: Partial<BiomechanicAngles> | null,
): { status: ClinicalDotStatus; hint: string } {
  if (!angles) return { status: 'idle', hint: 'En espera' };

  if (layerKey === 'skull') {
    const jaw = angles.jawOpen ?? 0;
    const neck = angles.neck ?? null;
    if (neck !== null && neck > 25) return { status: 'warn', hint: `${neck}°` };
    if (jaw > 0.22) return { status: 'normal', hint: 'ATM activa' };
    if (neck !== null) return { status: 'normal', hint: 'OK' };
    return { status: 'idle', hint: '--' };
  }

  if (layerKey === 'spine') {
    const neck = angles.neck ?? null;
    const trunk = angles.trunk ?? null;
    if ((neck !== null && neck > 25) || (trunk !== null && trunk > 22)) {
      return {
        status: 'critical',
        hint: neck !== null && neck > (trunk ?? 0) ? `C5-C7 ${neck}°` : `L4-S1 ${trunk}°`,
      };
    }
    if ((neck !== null && neck > 10) || (trunk !== null && trunk > 8)) {
      return {
        status: 'warn',
        hint: neck !== null && neck >= (trunk ?? 0) ? `${neck}°` : `${trunk}°`,
      };
    }
    if (neck !== null || trunk !== null) {
      return { status: 'normal', hint: 'Alineada' };
    }
    return { status: 'idle', hint: '--' };
  }

  if (layerKey === 'upperLimbs') {
    const wrist = angles.wrist ?? null;
    const arm = angles.arm ?? null;
    const elbow = angles.elbow ?? null;
    if (
      (wrist !== null && wrist > 25) ||
      (arm !== null && arm > 45) ||
      (elbow !== null && (elbow < 30 || elbow > 130))
    ) {
      return {
        status: 'critical',
        hint: wrist !== null && wrist > 25 ? `Carpo ${wrist}°` : arm !== null ? `${arm}°` : 'Alerta',
      };
    }
    if (
      (wrist !== null && wrist > 15) ||
      (arm !== null && arm > 20) ||
      (elbow !== null && (elbow < 60 || elbow > 100))
    ) {
      return {
        status: 'warn',
        hint: wrist !== null && wrist > 15 ? `Carpo ${wrist}°` : `${arm ?? elbow}°`,
      };
    }
    if (arm !== null || elbow !== null || wrist !== null) {
      return { status: 'normal', hint: 'Neutro' };
    }
    return { status: 'idle', hint: '--' };
  }

  if (layerKey === 'lowerLimbs') {
    const knee = angles.knee ?? null;
    if (knee !== null && knee > 60) return { status: 'critical', hint: `${knee}°` };
    if (knee !== null && knee > 25) return { status: 'warn', hint: `${knee}°` };
    if (knee !== null) return { status: 'normal', hint: `${knee}°` };
    return { status: 'idle', hint: 'Oculto' };
  }

  return { status: 'normal', hint: 'HUD' };
}

const LAYER_ROWS: Array<{
  key: keyof BiomechanicLayersConfig;
  label: string;
  sublabel: string;
}> = [
  { key: 'skull', label: 'Cráneo y ATM', sublabel: 'Orientación 3D + apertura mandibular' },
  { key: 'spine', label: 'Columna (C1-L5)', sublabel: 'Cervical, dorsal, costillas y sacro' },
  { key: 'upperLimbs', label: 'Brazos y Túnel Carpiano', sublabel: 'Húmero, radio/cúbito y 21 pts mano' },
  { key: 'lowerLimbs', label: 'Tren Inferior (REBA/OWAS)', sublabel: 'Pelvis, fémur, tibia y rótula' },
  { key: 'clinicalLabels', label: 'Etiquetas Clínicas', sublabel: 'Callouts diagnósticos en vivo' },
];

export const BiomechanicVisionControls: React.FC<BiomechanicVisionControlsProps> = ({
  angles,
  compact = false,
  className,
}) => {
  const { config, updateConfig, isLoading3D } = useBiomechanicVisionConfig();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number }>({
    top: 56,
    left: 12,
    width: 304,
  });

  // Pre-cargar paquete 3D automáticamente cuando está seleccionado Rayos X 3D
  useEffect(() => {
    if (config.mode === 'xray_3d' && !isAnatomyXRayReady()) {
      ensureAnatomyXRayAssets().catch(() => {});
    }
  }, [config.mode]);

  const activeCount = Object.values(config.layers).filter(Boolean).length;

  const updatePopoverPosition = useCallback(() => {
    if (typeof window === 'undefined' || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const popW = Math.min(308, vw - 16);
    const estH = 386;

    let left = rect.right - popW;
    if (left < 8) left = 8;
    if (left + popW > vw - 8) left = vw - popW - 8;

    let top = rect.bottom + 8;
    if (top + estH > vh - 10 && rect.top - estH - 8 > 8) {
      top = rect.top - estH - 8;
    } else if (top + estH > vh - 10) {
      top = Math.max(8, vh - estH - 10);
    }

    setPopoverPos({ top, left, width: popW });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePopoverPosition();

    const onPointerDown = (ev: MouseEvent | TouchEvent) => {
      const target = ev.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setIsOpen(false);
    };
    const onViewportChange = () => updatePopoverPosition();

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [isOpen, updatePopoverPosition]);

  const handleSetMode = (mode: BiomechanicVisionMode, e: React.MouseEvent) => {
    e.stopPropagation();
    updateConfig((prev) => ({ ...prev, mode }));
  };

  const handleSetShader = (shaderStyle: BiomechanicShaderStyle) => {
    updateConfig((prev) => ({ ...prev, mode: 'xray_3d', shaderStyle }));
  };

  const handleToggleLayer = (key: keyof BiomechanicLayersConfig) => {
    updateConfig((prev) => ({
      ...prev,
      layers: {
        ...prev.layers,
        [key]: !prev.layers[key],
      },
    }));
  };

  const handleBulkToggle = () => {
    const turnOn = activeCount < 5;
    updateConfig((prev) => ({
      ...prev,
      layers: {
        skull: turnOn,
        spine: turnOn,
        upperLimbs: turnOn,
        lowerLimbs: turnOn,
        clinicalLabels: turnOn,
      },
    }));
  };

  const dotClassForStatus = (status: ClinicalDotStatus, enabled: boolean) => {
    if (!enabled) return 'bg-slate-600';
    if (status === 'critical') return 'bg-rose-500 animate-ping';
    if (status === 'warn') return 'bg-amber-400';
    if (status === 'normal') return 'bg-emerald-400';
    return 'bg-cyan-400/60';
  };

  const dotSolidForStatus = (status: ClinicalDotStatus, enabled: boolean) => {
    if (!enabled) return 'bg-slate-600';
    if (status === 'critical') return 'bg-rose-500';
    if (status === 'warn') return 'bg-amber-400';
    if (status === 'normal') return 'bg-emerald-400';
    return 'bg-cyan-400/70';
  };

  const is3DActive = config.mode === 'xray_3d';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn('inline-flex items-center gap-1 shrink-0 select-none', className)}
    >
      {/* Switch Compacto: [ 🦴 Rayos X 3D | ⚡ Neón 2D ] */}
      <div className="inline-flex items-center rounded-xl bg-slate-950/80 border border-cyan-500/30 p-0.5 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={(e) => handleSetMode('xray_3d', e)}
          title="Visión Anatómica Real 3D en Rayos X (BodyParts3D)"
          className={cn(
            'inline-flex items-center gap-1 rounded-lg font-mono font-bold tracking-tight transition-all duration-200 active:scale-95',
            compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
            is3DActive
              ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 shadow-xs'
              : 'border border-transparent text-slate-400 hover:text-cyan-200 hover:bg-white/5',
          )}
        >
          {isLoading3D && is3DActive ? (
            <Loader2 className="w-3 h-3 text-cyan-300 animate-spin shrink-0" />
          ) : (
            <span className="leading-none">🦴</span>
          )}
          <span className="sm:hidden">3D</span>
          <span className="hidden sm:inline">{compact ? 'Rayos X 3D' : 'Rayos X 3D'}</span>
        </button>

        <button
          type="button"
          onClick={(e) => handleSetMode('neon_2d', e)}
          title="Exoesqueleto Biométrico Neón 2D"
          className={cn(
            'inline-flex items-center gap-1 rounded-lg font-mono font-bold tracking-tight transition-all duration-200 active:scale-95',
            compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
            !is3DActive
              ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 shadow-xs'
              : 'border border-transparent text-slate-400 hover:text-emerald-200 hover:bg-white/5',
          )}
        >
          <span className="leading-none">⚡</span>
          <span className="sm:hidden">2D</span>
          <span className="hidden sm:inline">Neón 2D</span>
        </button>
      </div>

      {/* Botón <Layers /> con contador {activeCount}/5 */}
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        title="Capas Anatómicas y Estilo Quirúrgico 3D"
        className={cn(
          'inline-flex items-center gap-1 rounded-xl border font-mono font-bold transition-all duration-200 sm:hover:-rotate-2 sm:hover:scale-105 active:scale-95 backdrop-blur-md',
          compact ? 'h-6 px-1.5 text-[9px]' : 'h-7 px-2 text-[10px]',
          isOpen
            ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200 ring-1 ring-cyan-400/30'
            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20',
        )}
      >
        <Layers className="w-3 h-3 shrink-0" />
        <span>{activeCount}/5</span>
      </button>

      {/* Popover Glassmorphism vía Portal en document.body (0% recorte por overflow-hidden) */}
      {isOpen &&
        typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              width: `${popoverPos.width}px`,
              maxHeight: 'calc(100vh - 20px)',
              zIndex: 2147483646,
            }}
            className="overflow-y-auto rounded-2xl border border-cyan-500/30 bg-[#0C192E]/95 p-3 text-slate-100 shadow-2xl shadow-black/70 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 select-none"
          >
            {/* Cabecera + Botón Simétrico Ocultar todo / Activar todas */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11px] font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent truncate">
                  Capas Anatómicas 3D
                </span>
              </div>
              <button
                type="button"
                onClick={handleBulkToggle}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all active:scale-95 shrink-0"
              >
                {activeCount === 5 ? 'Ocultar todo' : 'Activar todas'}
              </button>
            </div>

            {/* 5 Filas Táctiles con Punto de Estado Clínico en Vivo */}
            <div className="flex flex-col gap-1 mb-2.5">
              {LAYER_ROWS.map((row) => {
                const enabled = config.layers[row.key];
                const clinical = resolveLayerClinicalStatus(row.key, angles);
                return (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => handleToggleLayer(row.key)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all duration-150 active:scale-[0.99]',
                      enabled
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-white hover:bg-cyan-500/15'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06]',
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          'w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                          enabled
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900/60 border-slate-600 text-transparent',
                        )}
                      >
                        <Check className="w-2.5 h-2.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold leading-tight truncate">
                          {row.label}
                        </div>
                        <div className="text-[9px] text-slate-400 leading-tight truncate">
                          {row.sublabel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-mono text-slate-300">{clinical.hint}</span>
                      <span className="relative flex h-2 w-2">
                        {clinical.status === 'critical' && enabled && (
                          <span
                            className={cn(
                              'absolute inline-flex h-full w-full rounded-full opacity-75',
                              dotClassForStatus(clinical.status, enabled),
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            'relative inline-flex rounded-full h-2 w-2',
                            dotSolidForStatus(clinical.status, enabled),
                          )}
                        />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selector de Renderizado: [ ✨ Rayos X (Fresnel) | 🩺 Sólido Clínico ] */}
            <div className="mb-2.5">
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Modo de Renderizado Óseo
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950/70 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleSetShader('xray_fresnel')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 border',
                    config.shaderStyle === 'xray_fresnel'
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-xs'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5',
                  )}
                >
                  <Sparkles className="w-3 h-3 text-cyan-300 shrink-0" />
                  <span className="truncate">Rayos X (Fresnel)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetShader('clinical_solid')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 border',
                    config.shaderStyle === 'clinical_solid'
                      ? 'bg-teal-500/20 border-teal-400/50 text-teal-200 shadow-xs'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5',
                  )}
                >
                  <Stethoscope className="w-3 h-3 text-teal-300 shrink-0" />
                  <span className="truncate">Sólido Clínico</span>
                </button>
              </div>
            </div>

            {/* Slider Realidad Mixta (Opacidad 30% - 100%) */}
            <div className="mb-2.5 px-0.5">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-semibold text-slate-300">Realidad Mixta (Opacidad)</span>
                <span className="font-mono font-bold text-cyan-300">
                  {Math.round(config.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={100}
                step={2}
                value={Math.round(config.opacity * 100)}
                onChange={(e) => {
                  const pct = Number(e.target.value);
                  updateConfig((prev) => ({
                    ...prev,
                    opacity: Math.min(1, Math.max(0.3, pct / 100)),
                  }));
                }}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-cyan-400"
              />
            </div>

            {/* Pie de Atribución Obligatorio BodyParts3D DBCLS */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-[9px] text-slate-400 font-mono">
              <span className="truncate">BodyParts3D © DBCLS</span>
              <a
                href="https://lifesciencedb.jp/bp3d/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-cyan-300 hover:text-cyan-200 underline underline-offset-2 shrink-0"
              >
                <span>CC BY-SA 2.1 JP</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default BiomechanicVisionControls;
