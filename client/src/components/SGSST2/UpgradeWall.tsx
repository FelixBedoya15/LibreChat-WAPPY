import React from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { useAuthContext } from '~/hooks';

const ShieldSVGButton = () => (
  <svg viewBox="0 0 80 80" className="h-10 w-10" fill="none">
    <defs>
      <linearGradient id="shieldGradWall" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
    </defs>
    <path
      d="M40 8L12 22V38C12 55.7 24.1 72.1 40 76C55.9 72.1 68 55.7 68 38V22L40 8Z"
      fill="url(#shieldGradWall)"
      opacity="0.15"
      className="animate-pulse"
    />
    <path
      d="M40 8L12 22V38C12 55.7 24.1 72.1 40 76C55.9 72.1 68 55.7 68 38V22L40 8Z"
      stroke="url(#shieldGradWall)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <animate attributeName="stroke-dasharray" from="0 300" to="300 0" dur="1.5s" fill="freeze" />
    </path>
    <path
      d="M28 40L36 48L52 32"
      stroke="#22c55e"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0"
    >
      <animate attributeName="opacity" from="0" to="1" begin="1s" dur="0.5s" fill="freeze" />
      <animate
        attributeName="stroke-dasharray"
        from="0 40"
        to="40 0"
        begin="1s"
        dur="0.6s"
        fill="freeze"
      />
    </path>
  </svg>
);

// ─── Feature lists per plan ───────────────────────────────────────
const PLAN_FEATURES: Record<string, { included: string[]; excluded: string[]; badge: string }> = {
  USER: {
    badge: 'Adquirir Wappy Vital',
    included: [
      'Chat con IA (10 mensajes al día)',
      'Hasta 4 conversaciones abiertas',
      'Sandbox interactivo de Canvas e IPEVAR',
      '1 descarga al día (Word/Excel/HTML)',
      'Aula de estudio',
    ],
    excluded: [
      'Subida de archivos al chat',
      'Descargas ilimitadas',
      'Blog WAPPY',
      'Somos SST',
      'Crear Agentes personalizados',
    ],
  },
  USER_IPEVAR: {
    badge: 'Adquirir Wappy Pro',
    included: [
      'Chat con IA ilimitado',
      'Hasta 20 conversaciones abiertas',
      'Subida de archivos ilimitada',
      'Descargas ilimitadas (Canvas e IPEVAR)',
      'Aula de estudio',
      'Blog WAPPY',
    ],
    excluded: ['Somos SST', 'Crear Agentes personalizados'],
  },
  USER_PRO: {
    badge: 'Plan Pro Activo',
    included: [
      'Somos SST completo',
      'Chat con IA ilimitado',
      'Conversaciones ilimitadas',
      'Subida de archivos ilimitada',
      'Descargas ilimitadas',
      'Crear Agentes de IA propios',
      'Análisis y Chat en Vivo',
      'Aula de estudio',
      'Blog WAPPY',
      'Acceso anticipado a nuevas funciones',
    ],
    excluded: [],
  },
};

export const UpgradeWall = ({
  title = 'Adquirir Plan Pro',
  description = 'Esta sección es exclusiva. Adquiere el Plan Pro para acceder a todas las funcionalidades avanzadas y eliminar los límites de tu cuenta.',
  plan: planOverride,
  isCompact = false,
  planBTitle,
  planBItems,
}: {
  title?: string;
  description?: string;
  /** Explicit plan override — pass user.role from parent to avoid timing issues */
  plan?: string;
  /** Compact mode for narrow side panels */
  isCompact?: boolean;
  /** Optional second column title rendered with checkmarks instead of X */
  planBTitle?: string;
  /** Optional second column items rendered with checkmarks instead of X */
  planBItems?: string[];
}) => {
  const { user } = useAuthContext();
  // Prefer the explicit override; fall back to the session role
  const effectivePlan = planOverride || user?.role || 'USER';
  const features = PLAN_FEATURES[effectivePlan] || PLAN_FEATURES['USER_PRO'];

  return (
    <div
      className={`group relative mx-auto my-4 flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-surface-primary text-center shadow-xl dark:border-gray-800 dark:bg-gray-900 ${isCompact ? 'max-w-sm p-6' : 'max-w-4xl p-12'}`}
    >
      {/* Ambient Background Glows */}
      <div
        className={`pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 rounded-full bg-green-500/10 blur-3xl transition-all duration-700 group-hover:bg-green-500/20 ${isCompact ? 'h-40 w-40' : 'h-72 w-72'}`}
      />
      <div
        className={`pointer-events-none absolute bottom-0 left-0 -mb-16 -ml-16 rounded-full bg-emerald-500/10 blur-3xl transition-all duration-700 group-hover:bg-emerald-500/20 ${isCompact ? 'h-40 w-40' : 'h-72 w-72'}`}
      />

      {/* Center Lock / Icon SVG Illustration */}
      <div className={`relative z-10 ${isCompact ? 'mb-4' : 'mb-8'}`}>
        <div
          className={`relative flex items-center justify-center rounded-full border border-green-500/20 bg-gradient-to-tr from-green-50 to-emerald-50 shadow-inner dark:from-green-900/30 dark:to-emerald-900/30 ${isCompact ? 'h-16 w-16' : 'h-24 w-24'}`}
        >
          <svg
            className={`${isCompact ? 'h-7 w-7' : 'h-10 w-10'} text-green-600 dark:text-green-400`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1" />
          </svg>

          {/* Sparkles */}
          <div
            className={`absolute -right-1 -top-1 animate-pulse text-green-400 ${isCompact ? 'scale-75' : ''}`}
          >
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        {/* Dynamic Badge */}
        <div
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-gradient-to-r from-green-600 to-emerald-600 px-2 py-0.5 font-bold text-white shadow-lg ${isCompact ? 'text-[10px]' : 'text-xs'}`}
        >
          {features.badge}
        </div>
      </div>

      {/* Content Copy */}
      <h3
        className={`z-10 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text font-extrabold tracking-tight text-transparent dark:from-white dark:to-gray-400 ${isCompact ? 'mb-2 text-xl' : 'mb-4 text-3xl'}`}
      >
        {title}
      </h3>
      <p
        className={`z-10 mx-auto leading-relaxed text-gray-500 dark:text-gray-400 ${isCompact ? 'mb-6 max-w-[240px] text-xs' : 'mb-10 max-w-lg text-base'}`}
      >
        {description}
      </p>

      {/* Features List — rendered dynamically from plan features */}
      <div
        className={`z-10 flex justify-center text-left font-medium ${isCompact ? 'mb-6 flex-col gap-2 text-xs' : 'mb-10 flex-col gap-6 text-sm md:flex-row md:gap-12'}`}
      >
        <div>
          {planBTitle && (
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">
              Tu Plan
            </p>
          )}
          <ul className="space-y-2">
            {features.included.map((item) => {
              const isHighlighted = item.includes('**');
              const text = item.replace(/\*\*/g, '');
              return (
                <li
                  key={item}
                  className={`flex items-start gap-2 ${isHighlighted ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  <Check
                    className={`${isCompact ? 'h-3 w-3' : 'h-5 w-5'} ${isHighlighted ? 'text-emerald-500' : 'text-green-500'} mt-0.5 shrink-0`}
                  />{' '}
                  <span>{text}</span>
                </li>
              );
            })}
          </ul>
        </div>
        {planBTitle && planBItems ? (
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400">
              {planBTitle}
            </p>
            <ul className="space-y-2">
              {planBItems.map((item) => {
                const isHighlighted = item.includes('**');
                const text = item.replace(/\*\*/g, '');
                return (
                  <li
                    key={item}
                    className={`flex items-start gap-2 ${isHighlighted ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <Check
                      className={`${isCompact ? 'h-3 w-3' : 'h-5 w-5'} ${isHighlighted ? 'text-amber-500' : 'text-amber-400'} mt-0.5 shrink-0`}
                    />{' '}
                    <span>{text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <ul className="space-y-2">
            {features.excluded.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-gray-500 opacity-80 dark:text-gray-400"
              >
                <X
                  className={`${isCompact ? 'h-3 w-3' : 'h-5 w-5'} mt-0.5 shrink-0 text-red-500`}
                />{' '}
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Upgrade Button */}
      <a
        href="/planes"
        className={`relative z-10 flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-r from-green-500 to-emerald-600 font-extrabold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl ${isCompact ? 'mt-4 w-full px-6 py-2.5 text-sm' : 'mt-6 px-10 py-3.5 text-lg'}`}
      >
        <Sparkles className="h-5 w-5 animate-pulse text-white" />
        <span className="tracking-wide">
          {effectivePlan === 'USER'
            ? 'Ver Planes y Adquirir Wappy Vital'
            : 'Ver Planes y Precios Pro'}
        </span>
      </a>
    </div>
  );
};
