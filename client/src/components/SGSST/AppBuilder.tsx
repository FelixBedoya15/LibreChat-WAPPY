import React, { useState } from 'react';
import { Blocks, Save, FilePlus, Zap, Settings, RefreshCw, MessageSquare, ArrowLeft, Plus, X, Bot, Send, User, Trash2 } from 'lucide-react';
import { Button } from '@librechat/client';
import { cn } from '~/utils';

const AVAILABLE_BLOCKS = [
    { id: 'chat', type: 'chat', name: 'Mini Chat IA', icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'word', type: 'word', name: 'Live Editor Word', icon: FilePlus, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'excel', type: 'excel', name: 'Live Editor Excel', icon: Blocks, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'whatsapp', type: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-500/10' },
];

const MiniAgentChatMock = () => {
    const [messages, setMessages] = useState<{role: string, text: string}[]>([
        { role: 'assistant', text: '¡Hola! Soy tu asistente de este aplicativo. ¿En qué te puedo ayudar hoy?' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        setMessages([...messages, { role: 'user', text: input }]);
        setInput('');
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Esta es una simulación del bloque Mini Chat IA. En la versión final, estaré conectado a tu API de Wappy.' }]);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-[400px] w-full border border-border-light rounded-2xl bg-surface-primary shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light bg-surface-secondary/50">
                <div className="p-2 bg-indigo-500/20 rounded-full">
                    <Bot className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h4 className="font-bold text-text-primary text-sm">WAPPY Agent</h4>
                    <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">GPT-4 Turbo</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50 dark:bg-black/20">
                {messages.map((msg, idx) => (
                    <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("shrink-0 p-2 rounded-full h-fit", msg.role === 'user' ? "bg-surface-secondary" : "bg-indigo-500/20")}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-text-primary" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", msg.role === 'user' ? "bg-surface-secondary text-text-primary rounded-tr-sm" : "bg-white dark:bg-black border border-border-light text-text-primary shadow-sm rounded-tl-sm")}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-surface-primary border-t border-border-light">
                <form onSubmit={handleSend} className="relative flex items-center">
                    <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe un mensaje al agente..."
                        className="w-full bg-surface-secondary border border-border-medium rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button type="submit" disabled={!input.trim()} className="absolute right-2 p-2 bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors">
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default function AppBuilder() {
    const [isBuilding, setIsBuilding] = useState(false);
    const [blocks, setBlocks] = useState<{uid: string, type: string, name: string}[]>([]);

    const addBlock = (blockDef: any) => {
        setBlocks([...blocks, { uid: Math.random().toString(36).substr(2, 9), type: blockDef.type, name: blockDef.name }]);
    };

    const removeBlock = (uid: string) => {
        setBlocks(blocks.filter(b => b.uid !== uid));
    };

    if (isBuilding) {
        return (
            <div className="flex h-full w-full gap-6 animate-in slide-in-from-right-8 duration-500">
                {/* ─── Sidebar: Bloques Disponibles ─── */}
                <div className="w-72 shrink-0 bg-surface-primary border border-border-light rounded-3xl shadow-xl flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-border-light bg-surface-secondary/50">
                        <button onClick={() => setIsBuilding(false)} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm font-bold mb-4">
                            <ArrowLeft className="w-4 h-4" /> Volver
                        </button>
                        <h3 className="text-lg font-black text-text-primary">Bloques WAPPY</h3>
                        <p className="text-xs text-text-secondary mt-1">Haz clic para añadir al lienzo</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {AVAILABLE_BLOCKS.map(block => (
                            <button
                                key={block.id}
                                onClick={() => addBlock(block)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border-light hover:border-indigo-500/50 hover:bg-surface-secondary hover:shadow-sm transition-all text-left group"
                            >
                                <div className={cn("p-2 rounded-lg transition-colors", block.bg)}>
                                    <block.icon className={cn("w-5 h-5", block.color)} />
                                </div>
                                <span className="flex-1 font-bold text-sm text-text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {block.name}
                                </span>
                                <Plus className="w-4 h-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─── Main Canvas ─── */}
                <div className="flex-1 bg-surface-secondary/30 border border-border-light rounded-3xl shadow-inner flex flex-col overflow-hidden relative">
                    {/* Topbar Canvas */}
                    <div className="h-16 border-b border-border-light bg-surface-primary/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-text-primary text-lg">Aplicativo Sin Título</h2>
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-500 rounded-full text-[10px] uppercase font-bold tracking-widest">
                                Borrador
                            </span>
                        </div>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                            <Save className="w-4 h-4" /> Guardar y Publicar
                        </Button>
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 overflow-y-auto p-8 relative">
                        {blocks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                <Blocks className="w-16 h-16 text-text-secondary mb-4" />
                                <h3 className="text-xl font-bold text-text-primary">El lienzo está vacío</h3>
                                <p className="text-sm text-text-secondary mt-2 max-w-sm">
                                    Selecciona bloques del panel izquierdo para empezar a ensamblar tu aplicativo.
                                </p>
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                                {blocks.map((block, index) => (
                                    <div key={block.uid} className="relative group">
                                        {/* Block Toolbar */}
                                        <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
                                            <button className="p-2 bg-surface-primary border border-border-light rounded-lg shadow-lg hover:text-indigo-500 transition-colors">
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => removeBlock(block.uid)} className="p-2 bg-surface-primary border border-red-500/30 text-red-500 rounded-lg shadow-lg hover:bg-red-500 hover:text-white transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Block Renderer */}
                                        <div className="relative">
                                            {/* Label overlay */}
                                            <div className="absolute -top-3 left-4 px-3 py-1 bg-surface-primary border border-border-light shadow-sm rounded-full text-[10px] uppercase font-bold tracking-widest text-text-secondary z-10 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                                {block.name}
                                            </div>

                                            {/* Render specific block content */}
                                            <div className="pt-3">
                                                {block.type === 'chat' && <MiniAgentChatMock />}
                                                {block.type === 'word' && (
                                                    <div className="w-full h-64 border-2 border-dashed border-blue-500/30 rounded-2xl bg-blue-500/5 flex items-center justify-center text-blue-500/60 font-bold">
                                                        <FilePlus className="w-6 h-6 mr-2" /> Área de Live Editor (Word)
                                                    </div>
                                                )}
                                                {block.type === 'excel' && (
                                                    <div className="w-full h-64 border-2 border-dashed border-emerald-500/30 rounded-2xl bg-emerald-500/5 flex items-center justify-center text-emerald-500/60 font-bold">
                                                        <Blocks className="w-6 h-6 mr-2" /> Área de Live Editor (Excel)
                                                    </div>
                                                )}
                                                {block.type === 'whatsapp' && (
                                                    <div className="w-full h-32 border-2 border-dashed border-green-500/30 rounded-2xl bg-green-500/5 flex items-center justify-center text-green-500/60 font-bold">
                                                        <MessageSquare className="w-6 h-6 mr-2" /> Webhook WhatsApp
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
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
                        Ensambla aplicativos personalizados que hereden todo el ecosistema WAPPY. Diseña el rompecabezas, configura el alma del agente y publícalo en tu Bóveda Legal.
                    </p>
                </div>
                <Button onClick={() => setIsBuilding(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 rounded-xl px-6 flex items-center gap-2">
                    <FilePlus className="w-4 h-4" />
                    Nuevo Aplicativo
                </Button>
            </div>

            {/* Showcase Grid (3 columns for better spacing) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 py-4">
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="p-4 bg-white dark:bg-black rounded-full shadow-sm">
                        <FilePlus className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-lg">Bloque: Live Editor Word</h3>
                        <p className="text-text-secondary text-sm mt-1">Integra un editor de documentos enriquecido tipo Word donde la IA redactará actas y manuales.</p>
                    </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="p-4 bg-white dark:bg-black rounded-full shadow-sm">
                        <MessageSquare className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-lg">Bloque: Mini Chat IA</h3>
                        <p className="text-text-secondary text-sm mt-1">Incrusta toda la interfaz de Chat de un Agente WAPPY directo en tu aplicativo para consultas en vivo.</p>
                    </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="p-4 bg-white dark:bg-black rounded-full shadow-sm">
                        <Blocks className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-lg">Bloque: Live Editor Excel</h3>
                        <p className="text-text-secondary text-sm mt-1">Integra hojas de cálculo dinámicas y matrices complejas que pueden ser rellenadas por el usuario o la IA.</p>
                    </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="p-4 bg-white dark:bg-black rounded-full shadow-sm">
                        <MessageSquare className="w-8 h-8 text-indigo-500" /> {/* Reusing MessageSquare, or we could use Phone */}
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-lg">Bloque: Conexión WhatsApp</h3>
                        <p className="text-text-secondary text-sm mt-1">Permite a tu aplicativo enviar notificaciones o recibir inputs directamente desde WhatsApp empresarial.</p>
                    </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="p-4 bg-white dark:bg-black rounded-full shadow-sm">
                        <Settings className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-lg">Alma de IA (System Prompt)</h3>
                        <p className="text-text-secondary text-sm mt-1">Inyecta instrucciones invisibles para programar cómo debe comportarse el Agente IA de tu app.</p>
                    </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="p-4 bg-white dark:bg-black rounded-full shadow-sm">
                        <Save className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-lg">Exportación Universal</h3>
                        <p className="text-text-secondary text-sm mt-1">La Botonera de tu app incluirá nativamente la exportación a PDF, Word (.docx) y HTML web.</p>
                    </div>
                </div>
            </div>

            {/* Empty State Layout Builder */}
            <div onClick={() => setIsBuilding(true)} className="mt-4 flex-1 min-h-[300px] border-2 border-dashed border-border-medium rounded-2xl bg-surface-secondary/50 flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:bg-surface-hover hover:border-indigo-500/50 transition-colors">
                <div className="bg-indigo-500/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Blocks className="w-10 h-10 text-indigo-500 opacity-80" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Lienzo de Construcción</h3>
                <p className="text-text-secondary text-sm max-w-md">
                    Haz clic aquí o en "Nuevo Aplicativo" para empezar a arrastrar bloques y publicarlo en tu Bóveda Legal.
                </p>
                <div className="mt-8 px-6 py-2 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-widest rounded-full">
                    Iniciar Ensamblaje
                </div>
            </div>
        </div>
    );
}
