import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export const UpgradeWall = ({
    title = "Función exclusiva para planes superiores",
    description = "Para acceder al SG-SST completo y ejecutar las fases del ciclo PHVA necesitas mejorar tu plan actual.",
}: {
    title?: string;
    description?: string;
}) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-surface-primary to-surface-secondary border border-border-medium rounded-2xl shadow-sm text-center my-6 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Icon cluster */}
            <div className="relative mb-6">
                <div className="w-16 h-16 bg-surface-tertiary rounded-2xl flex items-center justify-center shadow-inner relative z-10">
                    <Lock className="w-8 h-8 text-text-secondary" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-surface-primary z-20">
                    <Zap className="w-4 h-4 text-white" />
                </div>
            </div>

            {/* Copy */}
            <h3 className="text-xl font-bold text-text-primary mb-3">{title}</h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto mb-8 leading-relaxed">
                {description}
            </p>

            {/* Features snippet */}
            <div className="flex items-center justify-center gap-6 mb-8 text-sm text-text-secondary">
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> Matriz Legal</span>
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> Matriz de Peligros</span>
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> Auditorías y más</span>
            </div>

            {/* Call to action */}
            <button
                onClick={() => navigate('/planes')}
                className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-white transition-all duration-300 ease-in-out bg-blue-600 border border-blue-500 rounded-full hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-105 overflow-hidden"
            >
                <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
                <span className="relative flex items-center gap-2">
                    Mejorar mi Plan
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
            </button>
        </div>
    );
};
