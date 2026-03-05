import React from 'react';
import { ArrowRight, Sparkles, Check, X } from 'lucide-react';

export const UpgradeWall = ({
    title = "Plan Premium Exclusivo",
    description = "Sube de nivel para acceder a todas las funcionalidades y eliminar los límites de tu cuenta.",
}: {
    title?: string;
    description?: string;
}) => {
    return (
        <div className="relative flex flex-col items-center justify-center p-12 text-center overflow-hidden bg-surface-primary dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl w-full max-w-4xl mx-auto my-10 group">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-blue-500/30" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-violet-500/30" />

            {/* Center Lock / Icon SVG Illustration */}
            <div className="relative mb-8 z-10">
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 dark:from-gray-800 dark:to-gray-700 shadow-inner">
                    <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        <circle cx="12" cy="16" r="1" />
                    </svg>

                    {/* Sparkles */}
                    <div className="absolute -top-3 -right-3 text-yellow-400 animate-pulse">
                        <Sparkles className="w-6 h-6" />
                    </div>
                </div>

                {/* Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-lg border border-white/20 whitespace-nowrap">
                    Plan Premium
                </div>
            </div>

            {/* Content Copy */}
            <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-4 z-10 tracking-tight">
                {title}
            </h3>
            <p className="text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-10 leading-relaxed z-10">
                {description}
            </p>

            {/* Features List */}
            <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-12 mb-10 z-10 text-sm font-medium text-left">
                <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Check className="w-5 h-5 text-green-500 shrink-0" /> Chat con IA
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Check className="w-5 h-5 text-green-500 shrink-0" /> Aula de estudio
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Check className="w-5 h-5 text-green-500 shrink-0" /> Máximo 10 conversaciones abiertas
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Check className="w-5 h-5 text-green-500 shrink-0" /> Podrá ingresar 1 clave API de Gemini
                    </li>
                </ul>
                <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-gray-500 dark:text-gray-400 opacity-80">
                        <X className="w-5 h-5 text-red-400 shrink-0" /> Blog
                    </li>
                    <li className="flex items-center gap-2 text-gray-500 dark:text-gray-400 opacity-80">
                        <X className="w-5 h-5 text-red-400 shrink-0" /> Gestor SGSST
                    </li>
                    <li className="flex items-center gap-2 text-gray-500 dark:text-gray-400 opacity-80">
                        <X className="w-5 h-5 text-red-400 shrink-0" /> Agentes personalizados
                    </li>
                </ul>
            </div>

            {/* Upgrade Button */}
            <a
                href="/planes"
                className="relative inline-flex items-center justify-center px-10 py-4 font-bold text-white transition-all duration-300 ease-in-out z-10 overflow-hidden rounded-full hover:scale-105 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] group mt-2"
            >
                {/* Button Background */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600" />

                {/* Button Content */}
                <span className="relative flex items-center gap-2 text-lg tracking-wide">
                    Planes
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </span>
            </a>
        </div>
    );
};
