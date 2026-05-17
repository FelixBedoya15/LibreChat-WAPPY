import React from 'react';
import { Blocks, Save, FilePlus, Zap, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@librechat/client';

export default function AppBuilder() {
    return (
        <div className="w-full flex flex-col gap-6 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-500 bg-white dark:bg-black/40 rounded-3xl border border-border-light shadow-xl">
            {/* Header / Intro */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border-light pb-6">
                <div>
                    <h2 className="text-2xl font-black text-text-primary flex items-center gap-3">
                        <Blocks className="w-8 h-8 text-indigo-500" />
                        WAPPY App Builder (Modo Nativo)
                    </h2>
                    <p className="text-text-secondary mt-2 text-sm max-w-2xl">
                        Ensambla aplicativos personalizados que hereden todo el ecosistema (Live Editor, IA inyectable, Historial, Exportación a PDF). Diseña el rompecabezas, configura el alma del agente y publícalo en tu Bóveda Legal.
                    </p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 rounded-xl px-6 flex items-center gap-2">
                    <FilePlus className="w-4 h-4" />
                    Nuevo Aplicativo
                </Button>
            </div>

            {/* Coming Soon Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 py-4">
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="p-4 bg-white dark:bg-black rounded-full shadow-sm">
                        <FilePlus className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-lg">Bloque: Live Editor</h3>
                        <p className="text-text-secondary text-sm mt-1">Integra un editor de documentos enriquecido tipo Word donde la IA redactará actas y manuales.</p>
                    </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="p-4 bg-white dark:bg-black rounded-full shadow-sm">
                        <Zap className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-lg">Bloque: Input IA</h3>
                        <p className="text-text-secondary text-sm mt-1">Campos de texto expansibles con Inteligencia Artificial incrustada para autocompletar.</p>
                    </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="p-4 bg-white dark:bg-black rounded-full shadow-sm">
                        <Settings className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-lg">Alma de IA (System)</h3>
                        <p className="text-text-secondary text-sm mt-1">Inyecta Prompts invisibles para programar cómo debe comportarse el asistente al generar el app.</p>
                    </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="p-4 bg-white dark:bg-black rounded-full shadow-sm">
                        <RefreshCw className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-lg">Sincronización Nativa</h3>
                        <p className="text-text-secondary text-sm mt-1">Los aplicativos creados se inyectan en tu ciclo PHVA y guardan historiales como cualquier app oficial.</p>
                    </div>
                </div>
            </div>

            {/* Empty State Layout Builder */}
            <div className="mt-4 flex-1 min-h-[300px] border-2 border-dashed border-border-medium rounded-2xl bg-surface-secondary/50 flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:bg-surface-hover hover:border-indigo-500/50 transition-colors">
                <div className="bg-indigo-500/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Blocks className="w-10 h-10 text-indigo-500 opacity-80" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Lienzo de Construcción</h3>
                <p className="text-text-secondary text-sm max-w-md">
                    Haz clic en "Nuevo Aplicativo" para empezar a arrastrar bloques. Define las columnas, los campos requeridos y publica tu propio estándar normativo.
                </p>
                <div className="mt-8 px-6 py-2 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-widest rounded-full">
                    Módulo en Desarrollo
                </div>
            </div>
        </div>
    );
}
