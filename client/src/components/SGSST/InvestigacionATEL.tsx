import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Save,
    Loader2,
    ChevronDown,
    ChevronRight,
    Camera,
    Image as ImageIcon,
    X,
    FileText,
    Plus,
    Trash2,
    AlertTriangle,
    Users,
    UserCheck,
    ClipboardList,
    ShieldAlert,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';

// ─── Worker Autocomplete (identical to PermisoAlturas) ────────────────────────
const WorkerAutocomplete = ({
    value,
    onChange,
    onSelect,
    data,
    searchKey,
    placeholder,
    className,
    wrapperClassName,
}: {
    value: string;
    onChange: (val: string) => void;
    onSelect?: (worker: any) => void;
    data: any[];
    searchKey: 'nombre' | 'identificacion';
    placeholder: string;
    className?: string;
    wrapperClassName?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = data.filter(w => {
        const searchVal = w[searchKey];
        if (!value) return true;
        return searchVal && String(searchVal).toLowerCase().includes(String(value).toLowerCase());
    });

    const exactMatch = value && filteredOptions.find(w => String(w[searchKey]).toLowerCase() === String(value).toLowerCase());

    return (
        <div className={`relative ${wrapperClassName || 'w-full'}`} ref={wrapperRef}>
            <input
                type="text"
                value={value}
                onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
                className={className}
                placeholder={placeholder}
                autoComplete="off"
            />
            {isOpen && filteredOptions.length > 0 && !exactMatch && (
                <ul className="absolute z-50 w-full mt-1 max-h-48 overflow-auto bg-surface-primary border border-border-medium rounded-lg shadow-xl py-1 text-left origin-top animate-in fade-in zoom-in-95 duration-200">
                    {filteredOptions.map((w, idx) => (
                        <li
                            key={idx}
                            className="px-4 py-2 text-sm text-text-primary hover:bg-surface-hover cursor-pointer transition-colors"
                            onClick={() => {
                                if (onSelect) onSelect(w);
                                else onChange(w[searchKey]);
                                setIsOpen(false);
                            }}
                        >
                            <div className="font-semibold text-text-primary">{w.nombre}</div>
                            <div className="text-xs text-text-secondary mt-0.5">CC: {w.identificacion} {w.cargo ? `• ${w.cargo}` : ''}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// ─── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
    <div className="flex items-center gap-3 pb-3 mb-4 border-b border-border-medium">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
            {icon}
        </div>
        <div>
            <h4 className="font-semibold text-text-primary text-sm">{title}</h4>
            {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const InvestigacionATEL = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    // ── Form State ──
    const [formData, setFormData] = useState({
        // Datos del Evento
        tipoEvento: 'Incidente',
        fechaEvento: new Date().toISOString().split('T')[0],
        horaEvento: '08:00',
        lugarEvento: '',
        departamento: '',
        municipio: '',
        // Datos del Trabajador Afectado
        afectadoNombre: '',
        afectadoCedula: '',
        afectadoCargo: '',
        afectadoEps: '',
        afectadoArl: '',
        tipoContrato: 'Indefinido',
        jornadaLaboral: 'Diurna',
        experienciaLaboral: '',
        tiempoEnCargo: '',
        // Descripción del Evento
        actividadMomento: '',
        descripcionHechos: '',
        consecuencias: '',
        diasIncapacidad: '0',
        // Descripción de la lesión
        naturalezaLesion: '',
        agenteCausal: '',
        parteCuerpo: '',
        // Datos evidencia / fotos
        foto1Desc: '',
        foto2Desc: '',
        foto3Desc: '',
        foto4Desc: '',
    });

    const [images, setImages] = useState<{ [key: string]: string | null }>({
        foto1: null,
        foto2: null,
        foto3: null,
        foto4: null
    });

    // Equipo Investigador (Res 1401/2007 art. 7: jefe inmediato + COPASST + encargado SST)
    const [equipoList, setEquipoList] = useState([
        { nombre: '', cedula: '', rol: 'Jefe Inmediato / Supervisor' },
        { nombre: '', cedula: '', rol: 'Representante COPASST / Vigía' },
        { nombre: '', cedula: '', rol: 'Encargado SST / HSEQ' },
    ]);

    // Testigos
    const [testigosList, setTestigosList] = useState([
        { nombre: '', cedula: '', cargo: '', testimonio: '' }
    ]);

    const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);

    // UI State
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
    const [generatedObjectives, setGeneratedObjectives] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isFormExpanded, setIsFormExpanded] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const recognitionRef = useRef<any>(null);

    // Fetch workers from perfil sociodemografico
    React.useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/perfil-sociodemografico/data', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.trabajadores?.length) setAvailableWorkers(data.trabajadores);
            })
            .catch(err => console.error('Error fetching workers', err));
    }, [token]);

    // Fetch saved form data
    React.useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/investigacion-atel/data', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Object.keys(data.formData || {}).length > 0) {
                    setFormData(prev => ({ ...prev, ...data.formData }));
                }
                if (data.equipoList?.length) setEquipoList(data.equipoList);
                if (data.testigosList?.length) setTestigosList(data.testigosList);
                if (data.images) setImages(data.images);
            })
            .catch(err => console.error('Error fetching investigacion atel data', err));
    }, [token]);

    // ── Save Form Data ──
    const handleSaveData = async (silent = false) => {
        if (!token) return;
        try {
            const res = await fetch('/api/sgsst/investigacion-atel/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ formData, equipoList, testigosList, images })
            });
            if (res.ok && !silent) {
                showToast({ message: 'Datos del formulario guardados correctamente.', status: 'success' });
            }
        } catch (err) {
            if (!silent) showToast({ message: 'Error al guardar los datos.', status: 'error' });
        }
    };

    // ── Voice Input (identical to PermisoAlturas) ──
    const handleVoiceInput = () => {
        if (isListening) {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) { }
            }
            setIsListening(false);
            setInterimText('');
            return;
        }
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast({ message: 'Su navegador no soporta reconocimiento de voz. Intente con Chrome.', status: 'error' });
            return;
        }
        try {
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;
            recognition.lang = 'es-CO';
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onstart = () => { setIsListening(true); setInterimText(''); };
            recognition.onresult = (event: any) => {
                let currentInterim = '';
                let newFinal = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        newFinal += event.results[i][0].transcript;
                    } else {
                        currentInterim += event.results[i][0].transcript;
                    }
                }
                if (newFinal) {
                    setFormData(prev => ({
                        ...prev,
                        descripcionHechos: prev.descripcionHechos + (prev.descripcionHechos && !prev.descripcionHechos.endsWith(' ') ? ' ' : '') + newFinal
                    }));
                }
                setInterimText(currentInterim);
            };
            recognition.onerror = (event: any) => { console.error('Speech error:', event.error); setIsListening(false); setInterimText(''); };
            recognition.onend = () => { setIsListening(false); setInterimText(''); };
            recognition.start();
        } catch (e) {
            setIsListening(false);
            showToast({ message: 'Error al iniciar reconocimiento', status: 'error' });
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // ── Image Upload (identical to PermisoAlturas) ──
    const handleImageUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_DIM = 1200;
                    if (width > height) {
                        if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
                    } else {
                        if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    setImages(prev => ({ ...prev, [field]: resizedDataUrl }));
                };
                img.src = readerEvent.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (field: string) => {
        setImages(prev => ({ ...prev, [field]: null }));
    };

    // ── Generate Report ──
    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        handleSaveData(true);
        try {
            const response = await fetch('/api/sgsst/investigacion-atel/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    formData,
                    equipoList,
                    testigosList,
                    images,
                    modelName: selectedModel,
                    userName: user?.name,
                }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar el informe');
            }
            const data = await response.json();
            setGeneratedObjectives(data.report);
            setEditorContent(data.report);
            setIsFormExpanded(false);
            showToast({ message: 'Informe de investigación generado exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Generation error:', error);
            showToast({ message: error.message || 'Error al generar', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [formData, equipoList, testigosList, images, selectedModel, token, showToast]);

    // ── Save Report ──
    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || generatedObjectives;
        if (!contentToSave || !token) return;
        try {
            if (conversationId && conversationId !== 'new' && reportMessageId) {
                const res = await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ conversationId, messageId: reportMessageId, content: contentToSave }),
                });
                if (res.ok) {
                    setRefreshTrigger(prev => prev + 1);
                    showToast({ message: 'Informe actualizado exitosamente', status: 'success' });
                }
                return;
            }
            const res = await fetch('/api/sgsst/investigacion-atel/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content: contentToSave,
                    title: `Investigación ATEL - ${formData.tipoEvento} - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-investigacion-atel'],
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Informe guardado exitosamente', status: 'success' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContent, generatedObjectives, conversationId, reportMessageId, token, showToast, formData]);

    // ── Load Report from History ──
    const handleSelectReport = useCallback(async (selectedConvoId: string) => {
        if (!selectedConvoId) return;
        try {
            const res = await fetch(`/api/messages/${selectedConvoId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to load');
            const messages = await res.json();
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.text) {
                setGeneratedObjectives(lastMsg.text);
                setEditorContent(lastMsg.text);
                setConversationId(selectedConvoId);
                setReportMessageId(lastMsg.messageId);
                setIsFormExpanded(false);
                showToast({ message: 'Informe cargado correctamente', status: 'success' });
            }
        } catch (e) {
            showToast({ message: 'Error al cargar el informe', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [token, showToast]);

    // ───────────────────────────────────────────────────────────────────────────
    // RENDER
    // ───────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-4">
            {/* ── Top Action Bar ── */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}
                >
                    <AnimatedIcon name="history" size={20} />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Historial</span>
                </button>
                <button
                    onClick={() => handleSaveData(false)}
                    className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                >
                    <AnimatedIcon name="database" size={20} className="text-gray-500" />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Guardar Datos</span>
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="group flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-600 hover:border-blue-700 text-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <AnimatedIcon name="sparkles" size={20} />
                    )}
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar Informe con IA</span>
                </button>
                <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={isGenerating} />
                {generatedObjectives && (
                    <>
                        <button
                            onClick={handleSave}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                        >
                            <AnimatedIcon name="save" size={20} className="text-gray-500" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Guardar Informe</span>
                        </button>
                        <ExportDropdown content={editorContent || ''} fileName="Investigacion_ATEL" />
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
                        tags={['sgsst-investigacion-atel']}
                    />
                </div>
            )}

            {/* ── Form Container ── */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                <button
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-surface-tertiary"
                >
                    <div className="flex items-center gap-2">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                        <span className="font-semibold">Datos para la Investigación de Accidente/Incidente</span>
                        <span className="text-xs text-text-secondary ml-2">Resolución 1401 de 2007</span>
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="p-6 space-y-8">

                        {/* ── SECCIÓN 1: Datos del Evento ── */}
                        <div className="border rounded-xl p-5 bg-surface-tertiary/20 space-y-4">
                            <SectionHeader
                                icon={<AlertTriangle className="h-4 w-4" />}
                                title="1. Datos del Evento"
                                subtitle="Tipo, fecha, hora y lugar donde ocurrió el evento"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Tipo de Evento</label>
                                    <div className="relative">
                                        <select
                                            value={formData.tipoEvento}
                                            onChange={e => handleInputChange('tipoEvento', e.target.value)}
                                            className="w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                        >
                                            <option>Incidente</option>
                                            <option>Accidente Leve</option>
                                            <option>Accidente Grave</option>
                                            <option>Accidente Mortal</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Fecha del Evento</label>
                                    <input type="date" value={formData.fechaEvento} onChange={e => handleInputChange('fechaEvento', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Hora del Evento</label>
                                    <input type="time" value={formData.horaEvento} onChange={e => handleInputChange('horaEvento', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1 md:col-span-1">
                                    <label className="text-sm font-medium">Lugar / Área del Evento</label>
                                    <input type="text" value={formData.lugarEvento} onChange={e => handleInputChange('lugarEvento', e.target.value)} placeholder="Ej: Planta de producción, Piso 2" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Departamento</label>
                                    <input type="text" value={formData.departamento} onChange={e => handleInputChange('departamento', e.target.value)} placeholder="Ej: Antioquia" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Municipio</label>
                                    <input type="text" value={formData.municipio} onChange={e => handleInputChange('municipio', e.target.value)} placeholder="Ej: Medellín" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Actividad que realizaba al momento del evento</label>
                                <input type="text" value={formData.actividadMomento} onChange={e => handleInputChange('actividadMomento', e.target.value)} placeholder="Ej: Instalación de tubería en altura, manejo de maquinaria..." className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                            </div>
                        </div>

                        {/* ── SECCIÓN 2: Trabajador Afectado ── */}
                        <div className="border rounded-xl p-5 bg-surface-tertiary/20 space-y-4">
                            <SectionHeader
                                icon={<UserCheck className="h-4 w-4" />}
                                title="2. Datos del Trabajador Afectado"
                                subtitle="Información laboral y personal del colaborador involucrado"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1 md:col-span-1">
                                    <label className="text-sm font-medium">Nombre completo</label>
                                    <WorkerAutocomplete
                                        value={formData.afectadoNombre}
                                        onChange={(val) => handleInputChange('afectadoNombre', val)}
                                        onSelect={(w) => setFormData(prev => ({
                                            ...prev,
                                            afectadoNombre: w.nombre,
                                            afectadoCedula: w.identificacion,
                                            afectadoCargo: w.cargo || '',
                                            afectadoEps: w.eps || '',
                                            afectadoArl: w.arl || '',
                                        }))}
                                        data={availableWorkers}
                                        searchKey="nombre"
                                        placeholder="Nombre del afectado"
                                        className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Cédula</label>
                                    <WorkerAutocomplete
                                        value={formData.afectadoCedula}
                                        onChange={(val) => handleInputChange('afectadoCedula', val)}
                                        onSelect={(w) => setFormData(prev => ({
                                            ...prev,
                                            afectadoCedula: w.identificacion,
                                            afectadoNombre: prev.afectadoNombre || w.nombre,
                                            afectadoCargo: prev.afectadoCargo || w.cargo || '',
                                        }))}
                                        data={availableWorkers}
                                        searchKey="identificacion"
                                        placeholder="Cédula de ciudadanía"
                                        className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Cargo</label>
                                    <input type="text" value={formData.afectadoCargo} onChange={e => handleInputChange('afectadoCargo', e.target.value)} placeholder="Cargo en la empresa" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">EPS</label>
                                    <input type="text" value={formData.afectadoEps} onChange={e => handleInputChange('afectadoEps', e.target.value)} placeholder="EPS afiliada" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">ARL</label>
                                    <input type="text" value={formData.afectadoArl} onChange={e => handleInputChange('afectadoArl', e.target.value)} placeholder="ARL afiliada" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Tipo de contrato</label>
                                    <div className="relative">
                                        <select value={formData.tipoContrato} onChange={e => handleInputChange('tipoContrato', e.target.value)} className="w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
                                            <option>Indefinido</option>
                                            <option>Fijo</option>
                                            <option>Obra o labor</option>
                                            <option>Aprendizaje</option>
                                            <option>Prestación de servicios</option>
                                            <option>Temporal</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Jornada laboral</label>
                                    <div className="relative">
                                        <select value={formData.jornadaLaboral} onChange={e => handleInputChange('jornadaLaboral', e.target.value)} className="w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
                                            <option>Diurna</option>
                                            <option>Nocturna</option>
                                            <option>Mixta</option>
                                            <option>Por turnos</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Experiencia laboral total (años)</label>
                                    <input type="text" value={formData.experienciaLaboral} onChange={e => handleInputChange('experienciaLaboral', e.target.value)} placeholder="Ej: 5" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Tiempo en el cargo actual</label>
                                    <input type="text" value={formData.tiempoEnCargo} onChange={e => handleInputChange('tiempoEnCargo', e.target.value)} placeholder="Ej: 8 meses" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                            </div>
                        </div>

                        {/* ── SECCIÓN 3: Descripción del Evento ── */}
                        <div className="border rounded-xl p-5 bg-surface-tertiary/20 space-y-4">
                            <SectionHeader
                                icon={<ClipboardList className="h-4 w-4" />}
                                title="3. Descripción Detallada del Evento"
                                subtitle="Narre los hechos antes, durante y después del accidente/incidente"
                            />
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-blue-600" /> Descripción de los Hechos (Dictado o Texto)
                                    </h4>
                                    <button
                                        onClick={handleVoiceInput}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow border flex items-center gap-2 ${isListening ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-surface-secondary hover:bg-surface-hover text-text-primary border-border-light'}`}
                                    >
                                        <span className="relative flex h-3 w-3">
                                            {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isListening ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                        </span>
                                        {isListening ? 'Escuchando...' : 'Activar Micrófono'}
                                    </button>
                                </div>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    <strong>IMPORTANTE:</strong> Describa en detalle: <u>qué actividad se realizaba, cómo ocurrieron los hechos, qué sucedió antes/durante/después, quiénes estuvieron presentes, condiciones del lugar, herramientas utilizadas y consecuencias inmediatas.</u>
                                </p>
                                <textarea
                                    value={formData.descripcionHechos + (interimText ? (formData.descripcionHechos && !formData.descripcionHechos.endsWith(' ') ? ' ' : '') + interimText : '')}
                                    onChange={e => { if (!isListening) handleInputChange('descripcionHechos', e.target.value); }}
                                    readOnly={isListening}
                                    className={`w-full rounded-xl border-2 ${isListening ? 'border-solid border-red-300 bg-red-50/10 focus:border-red-400 focus:bg-red-50/20' : 'border-dashed border-blue-200 bg-blue-50/10 focus:bg-blue-50/30 focus:border-blue-400'} p-4 text-sm text-text-primary min-h-[160px] resize-y transition-colors focus:outline-none`}
                                    placeholder="Ej: El trabajador se encontraba realizando labores de... cuando súbitamente ocurrió..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Naturaleza de la lesión</label>
                                    <div className="relative">
                                        <select value={formData.naturalezaLesion} onChange={e => handleInputChange('naturalezaLesion', e.target.value)} className="w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
                                            <option value="">Seleccionar...</option>
                                            <option>Golpe / Contusión</option>
                                            <option>Herida / Laceración</option>
                                            <option>Fractura</option>
                                            <option>Esguince / Torcedura</option>
                                            <option>Quemadura</option>
                                            <option>Amputación</option>
                                            <option>Intoxicación</option>
                                            <option>Electrocución</option>
                                            <option>Trauma craneoencefálico</option>
                                            <option>Sin lesión (Incidente)</option>
                                            <option>Muerte</option>
                                            <option>Otra</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Parte del cuerpo afectada</label>
                                    <input type="text" value={formData.parteCuerpo} onChange={e => handleInputChange('parteCuerpo', e.target.value)} placeholder="Ej: Mano derecha, rodilla izquierda" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Días de incapacidad</label>
                                    <input type="number" min="0" value={formData.diasIncapacidad} onChange={e => handleInputChange('diasIncapacidad', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Agente causal del evento</label>
                                <input type="text" value={formData.agenteCausal} onChange={e => handleInputChange('agenteCausal', e.target.value)} placeholder="Ej: Maquinaria, piso húmedo, material cortante, caída de altura..." className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Consecuencias del evento</label>
                                <textarea value={formData.consecuencias} onChange={e => handleInputChange('consecuencias', e.target.value)} placeholder="Describa las consecuencias para la persona, el proceso y la empresa..." className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary min-h-[80px] resize-y" />
                            </div>
                        </div>

                        {/* ── SECCIÓN 4: Testigos ── */}
                        <div className="border rounded-xl p-5 bg-surface-tertiary/20 space-y-4">
                            <SectionHeader
                                icon={<Users className="h-4 w-4" />}
                                title="4. Testigos del Evento"
                                subtitle="Personas presentes durante el evento (opcional)"
                            />
                            {testigosList.map((testigo, idx) => (
                                <div key={idx} className="border border-border-medium rounded-lg p-4 bg-surface-primary space-y-3 relative">
                                    <p className="text-xs text-text-secondary font-medium">Testigo {idx + 1}</p>
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <WorkerAutocomplete
                                            value={testigo.nombre}
                                            onChange={(val) => {
                                                const newL = [...testigosList];
                                                newL[idx].nombre = val;
                                                setTestigosList(newL);
                                            }}
                                            onSelect={(w) => {
                                                const newL = [...testigosList];
                                                newL[idx] = { ...newL[idx], nombre: w.nombre, cedula: w.identificacion, cargo: w.cargo || '' };
                                                setTestigosList(newL);
                                            }}
                                            data={availableWorkers}
                                            searchKey="nombre"
                                            placeholder="Nombre del testigo"
                                            wrapperClassName="w-full md:w-1/2"
                                            className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                        />
                                        <input
                                            type="text"
                                            value={testigo.cedula}
                                            onChange={e => {
                                                const newL = [...testigosList];
                                                newL[idx].cedula = e.target.value;
                                                setTestigosList(newL);
                                            }}
                                            placeholder="Cédula"
                                            className="w-full md:w-1/4 rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary"
                                        />
                                        <div className="flex w-full md:w-1/4 gap-2">
                                            <input
                                                type="text"
                                                value={testigo.cargo}
                                                onChange={e => {
                                                    const newL = [...testigosList];
                                                    newL[idx].cargo = e.target.value;
                                                    setTestigosList(newL);
                                                }}
                                                placeholder="Cargo"
                                                className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary"
                                            />
                                            <button
                                                onClick={() => setTestigosList(testigosList.filter((_, i) => i !== idx))}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                                                disabled={testigosList.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={testigo.testimonio}
                                        onChange={e => {
                                            const newL = [...testigosList];
                                            newL[idx].testimonio = e.target.value;
                                            setTestigosList(newL);
                                        }}
                                        placeholder="Versión del testigo sobre cómo ocurrieron los hechos..."
                                        className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary min-h-[80px] resize-y"
                                    />
                                </div>
                            ))}
                            <button
                                onClick={() => setTestigosList([...testigosList, { nombre: '', cedula: '', cargo: '', testimonio: '' }])}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                <Plus className="h-4 w-4" /> Añadir Testigo
                            </button>
                        </div>

                        {/* ── SECCIÓN 5: Equipo Investigador (Res 1401 Art. 7) ── */}
                        <div className="border rounded-xl p-5 bg-surface-tertiary/20 space-y-4">
                            <SectionHeader
                                icon={<ClipboardList className="h-4 w-4" />}
                                title="5. Equipo Investigador"
                                subtitle="Art. 7 Res. 1401/2007: Jefe inmediato + Representante COPASST + Encargado SST"
                            />
                            {equipoList.map((miembro, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row gap-3">
                                    <WorkerAutocomplete
                                        value={miembro.nombre}
                                        onChange={(val) => {
                                            const newE = [...equipoList];
                                            newE[idx].nombre = val;
                                            const match = availableWorkers.find(w => w.nombre === val);
                                            if (match) newE[idx].cedula = match.identificacion;
                                            setEquipoList(newE);
                                        }}
                                        onSelect={(w) => {
                                            const newE = [...equipoList];
                                            newE[idx].nombre = w.nombre;
                                            newE[idx].cedula = w.identificacion;
                                            setEquipoList(newE);
                                        }}
                                        data={availableWorkers}
                                        searchKey="nombre"
                                        placeholder="Nombre del investigador"
                                        wrapperClassName="w-full md:w-1/3"
                                        className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                    />
                                    <input
                                        type="text"
                                        value={miembro.rol}
                                        onChange={e => {
                                            const newE = [...equipoList];
                                            newE[idx].rol = e.target.value;
                                            setEquipoList(newE);
                                        }}
                                        className="w-full md:w-1/3 rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary"
                                        placeholder="Rol en la investigación"
                                    />
                                    <div className="flex w-full md:w-1/3 gap-2">
                                        <WorkerAutocomplete
                                            value={miembro.cedula}
                                            onChange={(val) => {
                                                const newE = [...equipoList];
                                                newE[idx].cedula = val;
                                                const match = availableWorkers.find(w => w.identificacion === val);
                                                if (match && !newE[idx].nombre) newE[idx].nombre = match.nombre;
                                                setEquipoList(newE);
                                            }}
                                            onSelect={(w) => {
                                                const newE = [...equipoList];
                                                newE[idx].cedula = w.identificacion;
                                                if (!newE[idx].nombre) newE[idx].nombre = w.nombre;
                                                setEquipoList(newE);
                                            }}
                                            data={availableWorkers}
                                            searchKey="identificacion"
                                            placeholder="Cédula"
                                            wrapperClassName="w-full"
                                            className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                        />
                                        <button
                                            onClick={() => setEquipoList(equipoList.filter((_, i) => i !== idx))}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setEquipoList([...equipoList, { nombre: '', cedula: '', rol: '' }])}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                <Plus className="h-4 w-4" /> Añadir Investigador
                            </button>
                        </div>

                        {/* ── SECCIÓN 6: Registro Fotográfico ── */}
                        <div className="space-y-4 pt-4 border-t border-border-medium">
                            <h4 className="font-semibold text-text-primary text-sm">6. Registro Fotográfico de Evidencias</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {['foto1', 'foto2', 'foto3', 'foto4'].map((foto, idx) => {
                                    const labels = ['Lugar del Evento', 'Agente Causal', 'Lesiones / Daños', 'Condiciones del Área'];
                                    const fieldName = foto as 'foto1' | 'foto2' | 'foto3' | 'foto4';
                                    const descName = `${foto}Desc`;
                                    return (
                                        <div key={foto} className="flex flex-col items-center gap-3">
                                            <span className="font-semibold text-sm text-center">{labels[idx]}</span>
                                            <div className="relative w-full aspect-square bg-surface-tertiary rounded-xl border-2 border-dashed border-border-medium flex flex-col items-center justify-center overflow-hidden hover:bg-surface-hover transition-colors">
                                                {images[fieldName] ? (
                                                    <>
                                                        <img src={images[fieldName] as string} className="w-full h-full object-cover" alt={foto} />
                                                        <button onClick={() => removeImage(fieldName)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-text-secondary hover:text-blue-500">
                                                        <Camera className="h-8 w-8 mb-2" />
                                                        <span className="text-xs text-center px-4">Tocar para tomar/subir foto</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(fieldName, e)} />
                                                    </label>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Descripción breve..."
                                                value={(formData as any)[descName]}
                                                onChange={e => handleInputChange(descName, e.target.value)}
                                                className="w-full rounded border px-2 py-1 text-xs bg-surface-primary text-text-primary"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Generate Button bottom ── */}
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="group flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-600 hover:border-blue-700 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <AnimatedIcon name="sparkles" size={20} />
                                )}
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar Informe de Investigación con IA</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Report Viewer ── */}
            {generatedObjectives && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" /> Informe de Investigación ATEL Generado
                        </h3>
                    </div>
                    <div className="p-1 overflow-hidden">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor
                                    key={conversationId || 'new-editor'}
                                    initialContent={generatedObjectives}
                                    onUpdate={setEditorContent}
                                    onSave={handleSave}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestigacionATEL;
