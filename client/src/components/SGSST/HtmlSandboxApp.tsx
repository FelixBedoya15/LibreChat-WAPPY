import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Plus, 
    Trash2, 
    Copy, 
    Code, 
    Eye, 
    Upload, 
    CloudLightning, 
    Loader2, 
    Smartphone, 
    Monitor,
    Maximize2,
    Minimize2,
    Settings,
    Save
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';

interface HtmlApp {
    id: string;
    title: string;
    htmlCode: string;
    createdAt: string;
}

interface HtmlSandboxAppProps {
    phaseId: string;
    phaseTitle: string;
}

export default function HtmlSandboxApp({ phaseId, phaseTitle }: HtmlSandboxAppProps) {
    const { showToast } = useToastContext();
    const { token } = useAuthContext();
    const [apps, setApps] = useState<HtmlApp[]>([]);
    const [activeAppId, setActiveAppId] = useState<string | null>(null);
    const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // DB sync states
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const tag = `sgsst-html-apps-${phaseId}`;

    // 1. Fetch apps from backend on mount/phaseId change
    const loadApps = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const resHistory = await fetch(`/api/sgsst/diagnostico/report-history?tags=${tag}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!resHistory.ok) throw new Error('Error al cargar historial');
            const historyData = await resHistory.json();
            
            const convo = historyData.conversations?.[0];
            if (convo && convo.conversationId) {
                setConversationId(convo.conversationId);
                
                const resMessages = await fetch(`/api/messages/${convo.conversationId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!resMessages.ok) throw new Error('Error al cargar mensajes');
                const messages = await resMessages.json();
                const lastMsg = messages[messages.length - 1];
                
                if (lastMsg?.text) {
                    setReportMessageId(lastMsg.messageId);
                    const parsedApps = JSON.parse(lastMsg.text);
                    if (Array.isArray(parsedApps)) {
                        setApps(parsedApps);
                        if (parsedApps.length > 0) {
                            setActiveAppId(parsedApps[0].id);
                        }
                    }
                }
            } else {
                // Initialize default empty state if nothing in DB
                setApps([]);
                setActiveAppId(null);
                setConversationId(null);
                setReportMessageId(null);
            }
        } catch (err) {
            console.error('Failed to load HTML sandbox apps:', err);
            showToast({ message: 'Error al sincronizar con el servidor.', status: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [token, tag, showToast]);

    useEffect(() => {
        loadApps();
    }, [loadApps]);

    // 2. Save apps to backend
    const saveAppsToDB = async (updatedApps: HtmlApp[]) => {
        if (!token) return;
        setIsSaving(true);
        try {
            const contentToSave = JSON.stringify(updatedApps);
            const isNew = !conversationId || conversationId === 'new';

            if (!isNew && reportMessageId) {
                // Update
                const res = await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        conversationId,
                        messageId: reportMessageId,
                        content: contentToSave,
                    }),
                });
                if (!res.ok) throw new Error('Update failed');
            } else {
                // Create
                const res = await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        content: contentToSave,
                        title: `HTML Apps - ${phaseTitle} (${phaseId})`,
                        tags: [tag],
                    }),
                });
                if (!res.ok) throw new Error('Create failed');
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
            }
        } catch (err) {
            console.error('Save error:', err);
            showToast({ message: 'Error al guardar cambios en la nube.', status: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // Handler helpers
    const handleAddApp = () => {
        const newApp: HtmlApp = {
            id: crypto.randomUUID(),
            title: `Nuevo Aplicativo HTML ${apps.length + 1}`,
            htmlCode: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Aplicativo</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 2rem;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            color: #166534;
            min-height: 100vh;
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .card {
            background: white;
            padding: 2.5rem;
            border-radius: 1.5rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            max-width: 450px;
            width: 100%;
            text-align: center;
        }
        h1 { margin-top: 0; color: #15803d; }
        button {
            background: #10b981;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
            border-radius: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        button:hover { background: #059669; transform: translateY(-1px); }
    </style>
</head>
<body>
    <div class="card">
        <h1>¡Aplicativo Listo!</h1>
        <p>Edita este código o sube un archivo HTML propio para comenzar a utilizarlo en tiempo real.</p>
        <button onclick="alert('¡Hola desde el aplicativo!')">Interactuar</button>
    </div>
</body>
</html>`,
            createdAt: new Date().toISOString()
        };

        const updated = [...apps, newApp];
        setApps(updated);
        setActiveAppId(newApp.id);
        saveAppsToDB(updated);
        showToast({ message: 'Aplicativo creado exitosamente.', status: 'success' });
    };

    const handleDuplicateApp = (app: HtmlApp) => {
        const duplicated: HtmlApp = {
            ...app,
            id: crypto.randomUUID(),
            title: `${app.title} (Copia)`,
            createdAt: new Date().toISOString()
        };
        const updated = [...apps, duplicated];
        setApps(updated);
        setActiveAppId(duplicated.id);
        saveAppsToDB(updated);
        showToast({ message: 'Aplicativo duplicado.', status: 'success' });
    };

    const handleDeleteApp = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = apps.filter(app => app.id !== id);
        setApps(updated);
        if (activeAppId === id) {
            setActiveAppId(updated.length > 0 ? updated[0].id : null);
        }
        saveAppsToDB(updated);
        showToast({ message: 'Aplicativo eliminado.', status: 'success' });
    };

    const handleUpdateActiveApp = (field: 'title' | 'htmlCode', value: string) => {
        const updated = apps.map(app => {
            if (app.id === activeAppId) {
                return { ...app, [field]: value };
            }
            return app;
        });
        setApps(updated);
    };

    // Auto-save debounced effect or manual save
    const handleManualSave = () => {
        saveAppsToDB(apps);
        showToast({ message: 'Sincronizado exitosamente con la base de datos.', status: 'success' });
    };

    const handleImportHtml = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === 'string') {
                handleUpdateActiveApp('htmlCode', result);
                // Also update title if it matches default
                const activeApp = apps.find(a => a.id === activeAppId);
                if (activeApp && activeApp.title.startsWith('Nuevo Aplicativo')) {
                    handleUpdateActiveApp('title', file.name.replace('.html', ''));
                }
                showToast({ message: 'Archivo HTML importado correctamente.', status: 'success' });
            }
        };
        reader.readAsText(file);
    };

    const activeApp = apps.find(app => app.id === activeAppId);

    return (
        <div className={`w-full bg-surface-secondary/30 dark:bg-black/10 rounded-[2rem] border border-border-light dark:border-white/5 p-6 backdrop-blur-md transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-surface-primary overflow-hidden' : ''}`}>
            
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-light dark:border-white/5 pb-4 mb-6">
                <div>
                    <h3 className="text-xl font-black text-text-primary flex items-center gap-2">
                        <Settings className="w-5 h-5 text-teal-500" />
                        Aplicativos Personalizados HTML ({phaseTitle})
                    </h3>
                    <p className="text-xs font-semibold text-text-secondary mt-1">
                        Sube o escribe código HTML interactivo. Los aplicativos se sincronizan en la nube automáticamente.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    {/* Sync Status Badge */}
                    <button
                        onClick={handleManualSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 active:scale-95 transition-all"
                    >
                        {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <CloudLightning className="w-3.5 h-3.5" />
                        )}
                        {isSaving ? 'Guardando...' : 'Guardar en la Nube'}
                    </button>

                    <button
                        onClick={handleAddApp}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo HTML
                    </button>

                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 rounded-xl border border-border-light dark:border-white/5 bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-all"
                        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-3" />
                    <p className="text-sm font-medium">Sincronizando aplicativos de la bóveda...</p>
                </div>
            ) : apps.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border-light dark:border-white/5 rounded-2xl bg-white/40 dark:bg-white/[0.01]">
                    <Code className="w-12 h-12 text-text-secondary opacity-40 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-text-primary mb-2">No hay aplicativos HTML creados</h4>
                    <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
                        Crea un nuevo aplicativo para montar formularios, calculadoras, guías dinámicas u hojas interactivas que requieras en este ciclo.
                    </p>
                    <button
                        onClick={handleAddApp}
                        className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                    >
                        Crear Primer Aplicativo
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-100px)] min-h-[500px]">
                    
                    {/* Left Sidebar - App selector */}
                    <div className="lg:col-span-1 border-r border-border-light dark:border-white/5 pr-4 flex flex-col gap-2 overflow-y-auto max-h-[600px]">
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-2 mb-2">
                            Lista de Aplicativos
                        </span>
                        {apps.map(app => {
                            const isActive = app.id === activeAppId;
                            return (
                                <div
                                    key={app.id}
                                    onClick={() => setActiveAppId(app.id)}
                                    className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                                        isActive
                                            ? 'bg-teal-500/10 border-teal-500/40 text-teal-700 dark:text-teal-400 font-bold shadow-sm'
                                            : 'bg-white/40 dark:bg-white/[0.01] border-border-light dark:border-white/5 text-text-primary hover:bg-surface-secondary'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="text-sm truncate">{app.title}</p>
                                        <p className="text-[10px] text-text-secondary opacity-60 mt-0.5">
                                            {new Date(app.createdAt).toLocaleDateString('es-CO')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDuplicateApp(app);
                                            }}
                                            className="p-1 rounded-md hover:bg-surface-tertiary text-text-secondary"
                                            title="Duplicar"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteApp(app.id, e)}
                                            className="p-1 rounded-md hover:bg-red-500/20 text-red-500"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Workspace - Editor and Preview */}
                    {activeApp && (
                        <div className="lg:col-span-3 flex flex-col gap-4 h-full">
                            
                            {/* App Settings Row */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/40 dark:bg-white/[0.02] p-4 rounded-2xl border border-border-light dark:border-white/5">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={activeApp.title}
                                        onChange={(e) => handleUpdateActiveApp('title', e.target.value)}
                                        className="w-full bg-transparent border-0 border-b border-transparent focus:border-teal-500 focus:ring-0 text-base font-bold text-text-primary px-0 py-0.5"
                                        placeholder="Nombre del aplicativo..."
                                    />
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImportHtml}
                                        accept=".html"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-border-light dark:border-white/5 bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-all"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        Importar HTML
                                    </button>

                                    <div className="h-6 w-px bg-border-light dark:bg-white/5 mx-1" />

                                    {/* Workspace View Selector */}
                                    <div className="flex rounded-lg border border-border-light dark:border-white/5 p-0.5 bg-surface-secondary">
                                        <button
                                            onClick={() => setMode('edit')}
                                            className={`p-1.5 rounded-md text-xs font-bold transition-all ${mode === 'edit' ? 'bg-white dark:bg-surface-tertiary text-teal-600 shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                            title="Editar Código"
                                        >
                                            <Code className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setMode('split')}
                                            className={`p-1.5 rounded-md text-xs font-bold transition-all ${mode === 'split' ? 'bg-white dark:bg-surface-tertiary text-teal-600 shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                            title="Vista Dividida"
                                        >
                                            <div className="flex gap-0.5 w-3.5 h-3.5 items-center justify-center">
                                                <div className="w-1.5 h-full border-r border-current opacity-70" />
                                                <div className="w-1.5 h-full opacity-70" />
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setMode('preview')}
                                            className={`p-1.5 rounded-md text-xs font-bold transition-all ${mode === 'preview' ? 'bg-white dark:bg-surface-tertiary text-teal-600 shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                            title="Vista Previa"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Split Panels */}
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[400px]">
                                
                                {/* HTML Code Editor */}
                                {(mode === 'edit' || mode === 'split') && (
                                    <div className={`flex flex-col rounded-2xl border border-border-light dark:border-white/5 overflow-hidden ${mode === 'edit' ? 'lg:col-span-2' : ''}`}>
                                        <div className="bg-surface-secondary px-4 py-2 border-b border-border-light dark:border-white/5 flex justify-between items-center">
                                            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                                                <Code className="w-3.5 h-3.5 text-teal-500" /> Editor de Código
                                            </span>
                                        </div>
                                        <textarea
                                            value={activeApp.htmlCode}
                                            onChange={(e) => handleUpdateActiveApp('htmlCode', e.target.value)}
                                            className="flex-1 w-full bg-black/90 text-emerald-400 font-mono text-xs p-4 focus:ring-0 focus:outline-none resize-none border-0 min-h-[300px]"
                                            style={{ tabSize: 4 }}
                                            placeholder="<!-- Escribe tu HTML/CSS/JS aquí -->"
                                        />
                                    </div>
                                )}

                                {/* Interactive Preview Sandbox */}
                                {(mode === 'preview' || mode === 'split') && (
                                    <div className={`flex flex-col rounded-2xl border border-border-light dark:border-white/5 overflow-hidden ${mode === 'preview' ? 'lg:col-span-2' : ''}`}>
                                        <div className="bg-surface-secondary px-4 py-2 border-b border-border-light dark:border-white/5 flex justify-between items-center">
                                            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                                                <Eye className="w-3.5 h-3.5 text-teal-500" /> Vista Previa
                                            </span>

                                            {/* Device Switcher */}
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setPreviewDevice('desktop')}
                                                    className={`p-1 rounded-md transition-colors ${previewDevice === 'desktop' ? 'bg-white dark:bg-surface-tertiary text-teal-600 shadow-sm' : 'text-text-secondary'}`}
                                                    title="Vista Ordenador"
                                                >
                                                    <Monitor className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setPreviewDevice('mobile')}
                                                    className={`p-1 rounded-md transition-colors ${previewDevice === 'mobile' ? 'bg-white dark:bg-surface-tertiary text-teal-600 shadow-sm' : 'text-text-secondary'}`}
                                                    title="Vista Móvil"
                                                >
                                                    <Smartphone className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 bg-neutral-100 dark:bg-neutral-900 p-4 flex items-center justify-center overflow-auto min-h-[300px]">
                                            <div className={`bg-white dark:bg-black rounded-xl overflow-hidden shadow-inner border border-border-light dark:border-white/5 transition-all duration-300 ${
                                                previewDevice === 'mobile' ? 'w-[375px] h-[600px] max-h-full' : 'w-full h-full'
                                            }`}>
                                                <iframe
                                                    srcDoc={activeApp.htmlCode}
                                                    title={activeApp.title}
                                                    sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
                                                    className="w-full h-full border-0 bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
