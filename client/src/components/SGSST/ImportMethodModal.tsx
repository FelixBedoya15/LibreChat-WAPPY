import React from 'react';
import { Sparkles, Columns3, Zap, X } from 'lucide-react';

export interface ImportMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowsCount: number;
  hasColumnMapper?: boolean;
  onSelectColumnMapper: () => void;
  hasAi?: boolean;
  onSelectAi?: () => void;
  onSelectDirect: () => void;
  moduleTitle?: string;
  columnMapperDescription?: string;
  aiDescription?: string;
  directDescription?: string;
}

export default function ImportMethodModal({
  isOpen,
  onClose,
  rowsCount,
  hasColumnMapper = true,
  onSelectColumnMapper,
  hasAi = true,
  onSelectAi,
  onSelectDirect,
  moduleTitle = 'Matriz',
  columnMapperDescription,
  aiDescription,
  directDescription,
}: ImportMethodModalProps) {
  if (!isOpen) return null;

  const defaultColumnMapperDesc =
    columnMapperDescription ||
    `Compara las columnas de tu archivo frente al formato técnico oficial de ${moduleTitle} en tiempo real. Previsualiza las filas, guarda plantillas y procesa los datos al instante sin límites de IA.`;

  const defaultAiDesc =
    aiDescription ||
    `Desglosa y separa automáticamente textos combinados, infiere campos faltantes y normaliza la información según la metodología técnica oficial de ${moduleTitle}.`;

  const defaultDirectDesc =
    directDescription ||
    'Mapea las columnas existentes exactamente como vienen en el archivo Excel de forma instantánea, sin intervención ni procesamiento de IA.';

  return (
    <div className="fixed inset-0 z-[999998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border-medium bg-surface-primary shadow-2xl transition-all">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  Método de Importación
                </h3>
                <p className="text-xs text-text-secondary">
                  Se detectaron {rowsCount} {rowsCount === 1 ? 'fila' : 'filas'} en el archivo
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-text-secondary mb-5 leading-relaxed">
            ¿Cómo deseas cargar los datos de tu {moduleTitle.toLowerCase()} a Wappy?
          </p>

          <div className="grid grid-cols-1 gap-3">
            {/* Opción 1: Paralelo de Casillas (Homologador Visual) */}
            {hasColumnMapper && (
              <button
                type="button"
                onClick={onSelectColumnMapper}
                className="group relative flex flex-col items-start gap-2 rounded-2xl border-2 border-teal-500 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/5 p-4 text-left transition-all hover:border-teal-600 hover:shadow-lg shadow-sm"
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-bold text-teal-700 dark:text-teal-300 text-sm">
                    <Columns3 className="h-4 w-4 text-teal-600 animate-pulse shrink-0" />
                    <span>Paralelo de Casillas (Homologador Visual)</span>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-500/30 px-2.5 py-0.5 text-[11px] font-black text-teal-700 dark:text-teal-300 shadow-2xs">
                    Recomendado
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {defaultColumnMapperDesc}
                </p>
              </button>
            )}

            {/* Opción 2: Reconstrucción Inteligente con IA */}
            {hasAi && onSelectAi && (
              <button
                type="button"
                onClick={onSelectAi}
                className="group relative flex flex-col items-start gap-2 rounded-2xl border border-border-medium bg-surface-secondary/40 p-4 text-left transition-all hover:border-teal-500/50 hover:bg-surface-hover shadow-sm"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-teal-700 dark:text-teal-400 text-sm">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                    Reconstrucción Inteligente con IA
                  </div>
                  <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    IA
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {defaultAiDesc}
                </p>
              </button>
            )}

            {/* Opción 3: Carga Directa / Rápida */}
            <button
              type="button"
              onClick={onSelectDirect}
              className="group relative flex flex-col items-start gap-2 rounded-2xl border border-border-medium bg-surface-secondary/50 p-4 text-left transition-all hover:border-border-heavy hover:bg-surface-hover shadow-xs"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-text-primary text-sm">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Carga Directa e Inmediata (1 a 1)
                </div>
                <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                  Rápido
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {defaultDirectDesc}
              </p>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end bg-surface-secondary px-6 py-3 border-t border-border-light">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
