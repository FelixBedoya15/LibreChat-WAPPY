import React, { useState, useCallback, useEffect } from 'react';
import {
    Sparkles,
    Loader2,
    ChevronDown,
    ChevronRight,
    FileText,
    Plus,
    Trash2,
    Briefcase,
    UserCheck,
    AlertTriangle,
    Shield,
    Brain,
    Target,
    BookOpen,
    ClipboardList,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PerfilCargoData {
    nombreCargo: string;
    area: string;
    nivelCargo: string;
    tipoContrato: string;
    jornada: string;
    jefeInmediato: string;
    escalasSalarial: string;
    numVacantes: string;
    contextoAdicional: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const NIVEL_CARGO_OPTIONS = [
    'Estratégico / Directivo',
    'Táctico / Mando Medio',
    'Profesional / Técnico',
    'Operativo',
    'Auxiliar / Asistencial',
];

const TIPO_CONTRATO_OPTIONS = [
    'Término indefinido',
    'Término fijo',
    'Prestación de servicios',
    'Obra o labor',
    'Temporal/ETT',
    'Aprendizaje (SENA)',
];

const JORNADA_OPTIONS = [
    'Tiempo completo (8 horas/día)',
    'Medio tiempo (4 horas/día)',
    'Turnos rotativos',
    'Turno nocturno',
    'Jornada flexible',
];

// ─── Empty form ───────────────────────────────────────────────────────────────
const EMPTY_FORM: PerfilCargoData = {
    nombreCargo: '',
    area: '',
    nivelCargo: 'Operativo',
    tipoContrato: 'Término indefinido',
    jornada: 'Tiempo completo (8 horas/día)',
    jefeInmediato: '',
    escalasSalarial: '',
    numVacantes: '1',
    contextoAdicional: '',
};

// ─── Field config for quick rendering ─────────────────────────────────────────
const FIELD_SECTIONS = [
    {
        title: 'Identificación del Cargo',
        icon: <Briefcase className="h-4 w-4 text-teal-600" />,
        fields: [
            { key: 'nombreCargo', label: 'Nombre del Cargo *', placeholder: 'Ej: Auxiliar de Bodega, Contador Público, Técnico SST...', type: 'text', required: true },
            { key: 'area', label: 'Área / Departamento *', placeholder: 'Ej: Logística, Contabilidad, Producción, RRHH...', type: 'text', required: true },
            { key: 'jefeInmediato', label: 'Cargo del Jefe Inmediato', placeholder: 'Ej: Jefe de Bodega, Gerente Financiero...', type: 'text' },
            { key: 'numVacantes', label: 'N° de Vacantes', placeholder: '1', type: 'number' },
        ]
    },
    {
        title: 'Condiciones Laborales',
        icon: <UserCheck className="h-4 w-4 text-teal-600" />,
        fields: [
            { key: 'nivelCargo', label: 'Nivel del Cargo', type: 'select', options: NIVEL_CARGO_OPTIONS },
            { key: 'tipoContrato', label: 'Tipo de Contrato', type: 'select', options: TIPO_CONTRATO_OPTIONS },
            { key: 'jornada', label: 'Jornada Laboral', type: 'select', options: JORNADA_OPTIONS },
            { key: 'escalasSalarial', label: 'Escala Salarial / Rango', placeholder: 'Ej: 1.5 SMMLV - 2 SMMLV, o $2.000.000 - $3.000.000', type: 'text' },
        ]
    },
];

// ─── Component ────────────────────────────────────────────────────────────────
const PerfilesCargo = () => {
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    const [perfiles, setPerfiles] = useState<(PerfilCargoData & { id: string; report?: string })[]>([]);
    const [activePerfilId, setActivePerfilId] = useState<string | null>(null);
    const [formData, setFormData] = useState<PerfilCargoData>(EMPTY_FORM);
    const [isFormExpanded, setIsFormExpanded] = useState(true);
    const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // ─── Load saved data ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/perfiles-cargo/data', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                if (data.perfilesList?.length) {
                    setPerfiles(data.perfilesList);
                    setFormData(data.perfilesList[0]);
                    setActivePerfilId(data.perfilesList[0].id);
                }
            })
            .catch(err => console.error('[PerfilesCargo] Error loading data:', err));
    }, [token]);

    // ─── Field helpers ────────────────────────────────────────────────────────
    const handleInput = (key: keyof PerfilCargoData, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleAddPerfil = () => {
        const newId = crypto.randomUUID();
        const newPerfil = { ...EMPTY_FORM, id: newId };
        setPerfiles(prev => [...prev, newPerfil]);
        setActivePerfilId(newId);
        setFormData(EMPTY_FORM);
        setGeneratedReport(null);
        setEditorContent(null);
        setIsFormExpanded(true);
        showToast({ message: 'Nuevo perfil de cargo creado', status: 'info' });
    };

    const handleDeletePerfil = (id: string) => {
        const updated = perfiles.filter(p => p.id !== id);
        setPerfiles(updated);
        if (activePerfilId === id) {
            setActivePerfilId(updated[0]?.id || null);
            setFormData(updated[0] ? { ...updated[0] } : EMPTY_FORM);
            setGeneratedReport(null);
            setEditorContent(null);
        }
    };

    const handleSelectPerfil = (id: string) => {
        const perfil = perfiles.find(p => p.id === id);
        if (perfil) {
            setActivePerfilId(id);
            setFormData(perfil);
            setGeneratedReport(perfil.report || null);
            setEditorContent(perfil.report || null);
            setIsFormExpanded(true);
        }
    };

    // ─── Save ─────────────────────────────────────────────────────────────────
    const handleSaveData = async (silent = false) => {
        if (!token) return;
        // Sync current form changes to the active profile in the list
        const updated = activePerfilId
            ? perfiles.map(p => (p.id === activePerfilId ? { ...p, ...formData } : p))
            : [...perfiles, { ...formData, id: crypto.randomUUID() }];
        setPerfiles(updated);
        try {
            const res = await fetch('/api/sgsst/perfiles-cargo/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ perfilesList: updated }),
            });
            if (res.ok && !silent) showToast({ message: 'Datos guardados correctamente', status: 'success' });
        } catch {
            if (!silent) showToast({ message: 'Error al guardar', status: 'error' });
        }
    };

    // ─── Dummy data ───────────────────────────────────────────────────────────
    const handleDummyData = () => {
        const dummy: PerfilCargoData = {
            nombreCargo: 'Técnico en Seguridad y Salud en el Trabajo',
            area: 'Gestión Humana y SST',
            nivelCargo: 'Profesional / Técnico',
            tipoContrato: 'Término indefinido',
            jornada: 'Tiempo completo (8 horas/día)',
            jefeInmediato: 'Gerente de Operaciones',
            escalasSalarial: '1.8 SMMLV - 2.5 SMMLV',
            numVacantes: '1',
            contextoAdicional:
                'El cargo es responsable de implementar y mantener el SG-SST, realizar inspecciones de seguridad, liderar investigaciones de accidentes y capacitar a los trabajadores en prevención de riesgos laborales.',
        };
        setFormData(dummy);
        showToast({ message: 'Datos de ejemplo cargados', status: 'success' });
    };

    // ─── Generate ─────────────────────────────────────────────────────────────
    const handleGenerate = useCallback(async () => {
        if (!formData.nombreCargo.trim()) {
            showToast({ message: 'Por favor ingresa el nombre del cargo antes de generar', status: 'warning' });
            return;
        }
        setIsGenerating(true);
        handleSaveData(true);
        try {
            const res = await fetch('/api/sgsst/perfiles-cargo/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ perfilData: formData, modelName: selectedModel }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al generar el perfil');
            }
            const data = await res.json();
            setGeneratedReport(data.report);
            setEditorContent(data.report);
            setIsFormExpanded(false);
            // save report into list
            if (activePerfilId) {
                setPerfiles(prev => prev.map(p => p.id === activePerfilId ? { ...p, ...formData, report: data.report } : p));
            }
            showToast({ message: 'Perfil de cargo generado exitosamente ✅', status: 'success' });
        } catch (error: any) {
            showToast({ message: error.message || 'Error al generar', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [formData, selectedModel, token, showToast, activePerfilId]);

    // ─── Save Report ──────────────────────────────────────────────────────────
    const handleSaveReport = useCallback(async () => {
        const content = editorContent || generatedReport;
        if (!content || !token) return;
        setIsSaving(true);
        try {
            if (conversationId && conversationId !== 'new' && reportMessageId) {
                const res = await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ conversationId, messageId: reportMessageId, content }),
                });
                if (res.ok) {
                    setRefreshTrigger(prev => prev + 1);
                    showToast({ message: 'Perfil actualizado exitosamente', status: 'success' });
                }
                return;
            }
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    content,
                    title: `Perfil de Cargo: ${formData.nombreCargo} - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-perfil-cargo'],
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Perfil guardado en historial exitosamente', status: 'success' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        } finally {
            setIsSaving(false);
        }
    }, [editorContent, generatedReport, conversationId, reportMessageId, token, showToast, formData.nombreCargo]);

    const handleSelectReport = useCallback(
        async (selectedConvoId: string) => {
            if (!selectedConvoId) return;
            try {
                const res = await fetch(`/api/messages/${selectedConvoId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Failed to load');
                const messages = await res.json();
                const lastMsg = messages[messages.length - 1];
                if (lastMsg?.text) {
                    setGeneratedReport(lastMsg.text);
                    setEditorContent(lastMsg.text);
                    setConversationId(selectedConvoId);
                    setReportMessageId(lastMsg.messageId);
                    setIsFormExpanded(false);
                    showToast({ message: 'Perfil cargado correctamente', status: 'success' });
                }
            } catch {
                showToast({ message: 'Error al cargar el perfil', status: 'error' });
            }
            setIsHistoryOpen(false);
        },
        [token, showToast],
    );

    // ─── Render field ─────────────────────────────────────────────────────────
    const renderField = (field: any) => {
        const baseClass =
            'w-full rounded-lg border border-border-medium px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all';
        if (field.type === 'select') {
            return (
                <select
                    value={(formData as any)[field.key]}
                    onChange={e => handleInput(field.key as keyof PerfilCargoData, e.target.value)}
                    className={baseClass}
                >
                    {field.options.map((opt: string) => (
                        <option key={opt}>{opt}</option>
                    ))}
                </select>
            );
        }
        if (field.type === 'textarea') {
            return (
                <textarea
                    value={(formData as any)[field.key]}
                    onChange={e => handleInput(field.key as keyof PerfilCargoData, e.target.value)}
                    placeholder={field.placeholder}
                    className={`${baseClass} min-h-[100px] resize-y`}
                />
            );
        }
        return (
            <input
                type={field.type || 'text'}
                value={(formData as any)[field.key]}
                onChange={e => handleInput(field.key as keyof PerfilCargoData, e.target.value)}
                placeholder={field.placeholder}
                className={baseClass}
            />
        );
    };

    // ─── Info badges (what will be generated) ─────────────────────────────────
    const generationBadges = [
        { icon: <ClipboardList className="h-4 w-4" />, label: 'Funciones y Responsabilidades', color: 'teal' },
        { icon: <Brain className="h-4 w-4" />, label: 'Habilidades y Competencias', color: 'violet' },
        { icon: <BookOpen className="h-4 w-4" />, label: 'Requisitos Físicos, Mentales y Técnicos', color: 'blue' },
        { icon: <AlertTriangle className="h-4 w-4" />, label: 'Riesgos Laborales Asociados', color: 'orange' },
        { icon: <Shield className="h-4 w-4" />, label: 'Medidas Preventivas SST', color: 'green' },
        { icon: <Target className="h-4 w-4" />, label: 'Indicadores de Desempeño (KPIs)', color: 'rose' },
    ];

    const colorMap: Record<string, string> = {
        teal: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/40',
        violet: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800/40',
        blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/40',
        orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/40',
        green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/40',
        rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/40',
    };

    // ─── Main render ──────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-2">
                <DummyGenerateButton onClick={handleDummyData} />

                <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}
                >
                    <AnimatedIcon name="history" size={20} />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                        Historial
                    </span>
                </button>

                <button
                    onClick={() => handleSaveData(false)}
                    className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                >
                    <AnimatedIcon name="database" size={20} className="text-gray-500" />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                        Guardar Datos
                    </span>
                </button>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="group flex items-center px-3 py-2 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <AnimatedIcon name="sparkles" size={20} />}
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                        Generar Perfil con IA
                    </span>
                </button>

                <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={isGenerating} />

                {generatedReport && (
                    <>
                        <button
                            onClick={handleSaveReport}
                            disabled={isSaving}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                        >
                            <AnimatedIcon name="save" size={20} className="text-gray-500" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                                Guardar Perfil
                            </span>
                        </button>
                        <ExportDropdown
                            content={editorContent || ''}
                            fileName={`Perfil_Cargo_${formData.nombreCargo.replace(/\s+/g, '_') || 'Cargo'}`}
                        />
                    </>
                )}
            </div>

            {/* ── History ── */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-perfil-cargo']}
                    />
                </div>
            )}

            {/* ── Profiles list (sidebar-style tabs when multiple) ── */}
            {perfiles.length > 1 && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary p-3 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Perfiles Guardados</span>
                        <button
                            onClick={handleAddPerfil}
                            className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
                        >
                            <Plus className="h-4 w-4" /> Nuevo Perfil
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {perfiles.map(p => (
                            <div key={p.id} className="flex items-center gap-1">
                                <button
                                    onClick={() => handleSelectPerfil(p.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${activePerfilId === p.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-surface-primary text-text-primary border-border-medium hover:bg-surface-hover'}`}
                                >
                                    {p.nombreCargo || 'Sin nombre'}
                                </button>
                                <button
                                    onClick={() => handleDeletePerfil(p.id)}
                                    className="p-1 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Coverage badges ── */}
            <div className="rounded-xl border border-teal-200 dark:border-teal-800/40 bg-teal-50/50 dark:bg-teal-900/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <AnimatedIcon name="sparkles" size={18} className="text-teal-600 animate-pulse" />
                    <h4 className="text-sm font-bold text-teal-800 dark:text-teal-300">
                        Contenido generado por IA — Cumple Art. 2.2.4.6.28 Decreto 1072
                    </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                    {generationBadges.map((b, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${colorMap[b.color]}`}
                        >
                            {b.icon}
                            {b.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Form ── */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                <button
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-surface-tertiary hover:bg-surface-hover transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <FileText className="h-5 w-5 text-teal-600" />
                        <span className="font-semibold">
                            {formData.nombreCargo ? `Perfil: ${formData.nombreCargo}` : 'Datos del Perfil de Cargo'}
                        </span>
                    </div>
                    {perfiles.length <= 1 && (
                        <button
                            onClick={e => { e.stopPropagation(); handleAddPerfil(); }}
                            className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-semibold px-2 py-1 rounded-full border border-teal-200 hover:bg-teal-50 transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" /> Nuevo Perfil
                        </button>
                    )}
                </button>

                {isFormExpanded && (
                    <div className="p-6 space-y-6">
                        {/* Section-based form */}
                        {FIELD_SECTIONS.map(section => (
                            <div key={section.title} className="space-y-3">
                                <div className="flex items-center gap-2 pb-1 border-b border-border-medium">
                                    {section.icon}
                                    <h4 className="font-semibold text-sm text-text-primary">{section.title}</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {section.fields.map(field => (
                                        <div key={field.key} className="space-y-1">
                                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-tight">
                                                {field.label}
                                            </label>
                                            {renderField(field)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Context additional */}
                        <div className="space-y-1 pt-2 border-t border-border-medium">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-tight">
                                Descripción del Cargo / Contexto Adicional
                            </label>
                            <p className="text-xs text-text-secondary leading-relaxed mb-2">
                                <strong>Importante:</strong> Describe brevemente las principales tareas, el entorno de trabajo, los equipos usados o cualquier particularidad del cargo. Cuanta más información ingreses, más preciso y personalizado será el perfil generado por la IA.
                            </p>
                            <textarea
                                value={formData.contextoAdicional}
                                onChange={e => handleInput('contextoAdicional', e.target.value)}
                                placeholder="Ej: El cargo es responsable de coordinar las entregas en bodega, manejar montacargas, operar el sistema ERP de inventarios y supervisar a 5 auxiliares. Opera en turnos de 12 horas en ambiente con ruido y calor..."
                                className="w-full rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/10 focus:bg-teal-50/30 focus:border-teal-400 p-4 text-sm text-text-primary min-h-[140px] resize-y transition-colors focus:outline-none"
                            />
                        </div>

                        {/* Generate button inside form */}
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !formData.nombreCargo.trim()}
                                className="group flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <AnimatedIcon name="sparkles" size={20} />
                                )}
                                <span className="ml-2">
                                    {isGenerating ? 'Generando perfil de cargo...' : 'Generar Perfil de Cargo con IA'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Generated Report Editor ── */}
            {generatedReport && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-teal-600" />
                            Perfil de Cargo: {formData.nombreCargo || 'Generado'}
                        </h3>
                    </div>
                    <div className="p-1 overflow-hidden">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor
                                    key={conversationId || 'new-editor'}
                                    initialContent={generatedReport}
                                    onUpdate={setEditorContent}
                                    onSave={handleSaveReport}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerfilesCargo;
