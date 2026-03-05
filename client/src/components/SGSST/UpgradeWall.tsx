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
            <animate attributeName="stroke-dasharray" from="0 40" to="40 0" begin="1s" dur="0.6s" fill="freeze" />
        </path>
    </svg>
);

// ─── Feature lists per plan ───────────────────────────────────────
const PLAN_FEATURES: Record<string, { included: string[]; excluded: string[]; badge: string }> = {
    USER: {
        badge: 'Actualiza al Plan Go o Plus',
        included: [
            'Chat con IA',
            'Aula de estudio',
            'Máximo 10 conversaciones abiertas',
            'Podrá ingresar 1 clave API de Gemini',
        ],
        excluded: ['Blog WAPPY', 'Gestor SGSST', 'Agentes personalizados'],
    },
    GO: {
        badge: 'Actualiza al Plan Plus o Pro',
        included: [
            'Todo lo del plan Gratis',
            'Blog WAPPY',
            'Hasta 30 conversaciones abiertas',
            'Podrá ingresar 4 claves API de Gemini',
        ],
        excluded: ['Gestor SGSST', 'Agentes personalizados'],
    },
};

export const UpgradeWall = ({
    title = 'Plan Premium Exclusivo',
    description = 'Sube de nivel para acceder a todas las funcionalidades y eliminar los límites de tu cuenta.',
    plan: planOverride,
}: {
    title?: string;
    description?: string;
    /** Explicit plan override — pass user.role from parent to avoid timing issues */
    plan?: string;
}) => {
    const { user } = useAuthContext();
    // Prefer the explicit override; fall back to the session role
    const effectivePlan = planOverride || user?.role || 'USER';
    const features = PLAN_FEATURES[effectivePlan] ?? PLAN_FEATURES['USER'];

    return (
        <div className="relative flex flex-col items-center justify-center p-12 text-center overflow-hidden bg-surface-primary dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl w-full max-w-4xl mx-auto my-10 group">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-green-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-green-500/20" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-emerald-500/20" />

            {/* Center Lock / Icon SVG Illustration */}
            <div className="relative mb-8 z-10">
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 shadow-inner border border-green-500/20">
                    <svg className="w-10 h-10 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        <circle cx="12" cy="16" r="1" />
                    </svg>

                    {/* Sparkles */}
                    <div className="absolute -top-3 -right-3 text-green-400 animate-pulse">
                        <Sparkles className="w-6 h-6" />
                    </div>
                </div>

                {/* Dynamic Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg border border-white/20 whitespace-nowrap">
                    {features.badge}
                </div>
            </div>

            {/* Content Copy */}
            <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-4 z-10 tracking-tight">
                {title}
            </h3>
            <p className="text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-10 leading-relaxed z-10">
                {description}
            </p>

            {/* Features List — rendered dynamically from plan features */}
            <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-12 mb-10 z-10 text-sm font-medium text-left">
                <ul className="space-y-3">
                    {features.included.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Check className="w-5 h-5 text-green-500 shrink-0" /> {item}
                        </li>
                    ))}
                </ul>
                <ul className="space-y-3">
                    {features.excluded.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 opacity-80">
                            <X className="w-5 h-5 text-red-400 shrink-0" /> {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Upgrade Button */}
            <a
                href="/planes"
                className="relative flex items-center justify-center gap-3 px-6 py-3 font-bold text-gray-800 dark:text-gray-200 transition-all duration-300 ease-in-out z-10 hover:scale-105 hover:text-green-600 dark:hover:text-green-400 mt-2"
            >
                <ShieldSVGButton />
                <span className="text-xl tracking-wide border-b-2 border-transparent hover:border-green-500 transition-colors">
                    Planes
                </span>
            </a>
        </div>
    );
};
