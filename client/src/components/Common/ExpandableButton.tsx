import React from 'react';
import { cn } from '~/utils';

export type ExpandableButtonVariant =
  | 'compliance-ok'   // #1: Normatividad CUMPLIDA / Matriz Activa
  | 'compliance-warn' // #2: Normatividad PENDIENTE / Sin Matriz
  | 'teal'            // #3: Confirmar / Guardar / Aprobar / Fijar
  | 'emerald'         // #4: Crear / Añadir / Nuevo (+)
  | 'cyan'            // #5: Actualizar / Sincronizar / Recargar / Despachar
  | 'purple'          // #6: Generar / Analizar / Auditar con IA (Sparkles)
  | 'indigo'          // #7: Selector de Modelo IA (Cerebro) / Oráculo ML
  | 'amber'           // #8: Datos de Prueba (Dummy) / Alertas / Cronograma
  | 'blue'            // #9: Importar / Subir / Cargar Base (Upload)
  | 'green'           // #10: Exportar / Descargar / Imprimir / Reportes
  | 'fuchsia'         // #11: Códigos QR / Portal Público / Copiar / Compartir
  | 'orange'          // #12: Analíticas / Historial / Versiones / Ver / Editar
  | 'danger'          // #13: Eliminar / Borrar / Limpiar / Peligro (Rose)
  | 'neutral'         // #14: Cerrar / Volver / Cancelar / Pantalla Completa / Default
  | 'white';          // Especial sobre fondos oscuros/esmeralda

export interface ExpandableButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: ExpandableButtonVariant;
  isActive?: boolean;
  size?: 'sm' | 'md';
  alwaysExpanded?: boolean;
}

export const WAPPY_SEMANTIC_BUTTON_STYLES: Record<
  ExpandableButtonVariant,
  { idle: string; active: string }
> = {
  'compliance-ok': {
    idle: 'border-emerald-500/70 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 shadow-xs hover:from-emerald-500/30 hover:to-teal-500/30',
    active: 'border-emerald-500/80 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40 shadow-sm',
  },
  'compliance-warn': {
    idle: 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 shadow-xs',
    active: 'bg-sky-500/20 border-sky-500/50 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30 shadow-xs',
  },
  teal: {
    idle: 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 shadow-xs',
    active: 'bg-teal-500/20 border-teal-500/50 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30 shadow-xs',
  },
  emerald: {
    idle: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 shadow-xs',
    active: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 shadow-xs',
  },
  cyan: {
    idle: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 shadow-xs',
    active: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/30 shadow-xs',
  },
  purple: {
    idle: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 shadow-xs',
    active: 'bg-purple-500/20 border-purple-500/50 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30 shadow-xs',
  },
  indigo: {
    idle: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 shadow-xs',
    active: 'bg-indigo-500/20 border-indigo-500/50 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30 shadow-xs',
  },
  amber: {
    idle: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 shadow-xs',
    active: 'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 shadow-xs',
  },
  blue: {
    idle: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 shadow-xs',
    active: 'bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/30 shadow-xs',
  },
  green: {
    idle: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/20 shadow-xs',
    active: 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300 ring-1 ring-green-500/30 shadow-xs',
  },
  fuchsia: {
    idle: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20 shadow-xs',
    active: 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-700 dark:text-fuchsia-300 ring-1 ring-fuchsia-500/30 shadow-xs',
  },
  orange: {
    idle: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 shadow-xs',
    active: 'bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30 shadow-xs',
  },
  danger: {
    idle: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 shadow-xs',
    active: 'bg-rose-500/20 border-rose-500/50 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30 shadow-xs',
  },
  neutral: {
    idle: 'bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 shadow-xs',
    active: 'bg-teal-500/20 border-teal-500/50 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30 shadow-xs',
  },
  white: {
    idle: 'bg-white/95 text-teal-800 border-white/60 hover:bg-white shadow-sm',
    active: 'bg-white text-teal-900 border-white shadow-sm',
  },
};

/**
 * Infiere automáticamente el grupo semántico de los 14 grupos de WAPPY
 * a partir del texto del botón (label/title) cuando la variante es genérica.
 */
export function resolveSemanticVariant(
  label: string = '',
  explicitVariant?: ExpandableButtonVariant,
): ExpandableButtonVariant {
  const text = label.toLowerCase();

  if (/(eliminar|borrar|quitar|limpiar|revocar|desvincular|retirar|rechazar)/.test(text)) {
    return 'danger';
  }
  if (/(datos de prueba|dummy|prueba|simular)/.test(text)) {
    return 'amber';
  }
  if (/(qr|copiar|compartir|link|enlace|landing|pestaña|firma)/.test(text)) {
    return 'fuchsia';
  }
  if (/(importar|subir|cargar|plantilla|formato)/.test(text)) {
    return 'blue';
  }
  if (/(exportar|descargar|imprimir|pdf|excel|word|html|reporte|informe oficial|diapositivas)/.test(text)) {
    return 'green';
  }
  if (/(sincronizar|actualizar|refrescar|recargar|re-escanear|escanear|despachar|vincular|enviar controles|reactivar)/.test(text)) {
    return 'cyan';
  }
  if (/(ia\b|con ia|inteligencia artificial|dictamen|auditar|auto-asignar|auto-emparejar|optimizar|analizar|análisis)/.test(text)) {
    return 'purple';
  }
  if (/(guardar|confirmar|aprobar|fijar|asentar|completar|completado|escrutar|emitir)/.test(text)) {
    return 'teal';
  }
  if (/(nuevo|nueva|añadir|agregar|crear|\+\s*entrada|convocar|abrir urna|designar)/.test(text)) {
    return 'emerald';
  }
  if (/(analítica|analiticas|estadística|gráfica|historial|versiones|ver\b|vista previa|editar|reprogramar|detalle|bodega|catálogo|pedidos|cupones)/.test(text)) {
    return 'orange';
  }
  if (/(cerrar|volver|cancelar|contraer|expandir|pantalla completa|restaurar)/.test(text)) {
    return 'neutral';
  }

  return explicitVariant || 'neutral';
}

export const ExpandableButton = React.forwardRef<HTMLButtonElement, ExpandableButtonProps>(
  (
    {
      icon,
      label,
      variant,
      isActive = false,
      size = 'md',
      alwaysExpanded = false,
      className,
      disabled,
      title,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const resolvedVariant =
      variant && variant !== 'neutral'
        ? variant
        : resolveSemanticVariant(`${label} ${title || ''}`, variant);
    const config = WAPPY_SEMANTIC_BUTTON_STYLES[resolvedVariant] || WAPPY_SEMANTIC_BUTTON_STYLES.neutral;
    const currentStyle = isActive ? config.active : config.idle;

    const sizeClasses =
      size === 'sm'
        ? 'h-8 px-2 min-w-[32px] sm:h-9 sm:px-2.5 sm:min-w-[36px]'
        : 'h-9 px-2.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px]';
    const textClasses =
      size === 'sm'
        ? 'text-xs font-bold tracking-wide'
        : 'text-sm font-bold tracking-wide';

    return (
      <button
        ref={ref}
        type={type}
        title={title || label}
        disabled={disabled}
        className={cn(
          'group flex items-center justify-center shrink-0',
          sizeClasses,
          'rounded-xl border outline-none cursor-pointer select-none',
          'transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
          currentStyle,
          className,
        )}
        {...rest}
      >
        <div className="relative flex-shrink-0 flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </div>
        <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[280px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
          <span className={textClasses}>{label}</span>
        </div>
      </button>
    );
  },
);

ExpandableButton.displayName = 'ExpandableButton';

export default ExpandableButton;
