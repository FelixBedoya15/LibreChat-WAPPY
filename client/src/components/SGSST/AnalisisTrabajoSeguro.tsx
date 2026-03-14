import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Loader2,
    ChevronDown,
    ChevronRight,
    Camera,
    X,
    FileText,
    Plus,
    Trash2,
    ShieldCheck,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';
import { generateDummyData } from '~/utils/dummyDataGenerator';

const WorkerAutocomplete = ({
    value,
    onChange,
    onSelect,
    data,
    searchKey,
    placeholder,
    className,
    wrapperClassName
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

    const exactMatch = value && filteredOptions.find(w =>
        String(w[searchKey]).toLowerCase() === String(value).toLowerCase());

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
                            <div className="text-xs text-text-secondary mt-0.5">
                                CC: {w.identificacion} {w.cargo ? `• ${w.cargo}` : ''}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const AnalisisTrabajoSeguro = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    const [formData, setFormData] = useState({
        actividadGlobal: '',
        foto1Desc: '',
        foto2Desc: '',
        foto3Desc: '',
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: new Date().toTimeString().slice(0, 5),
        horaFin: '',
        seguridadSocial: 'Sí',      // → "Charla de Seguridad Realizada"
        aptitudMedica: 'Sí',        // → "Equipos/Herramientas Inspeccionados"
        certificacionAlturas: 'Sí', // → "Condiciones del Área Verificadas"
    });

    const [images, setImages] = useState<{ [key: string]: string | null }>({
        foto1: null, foto2: null, foto3: null
    });

    const [trabajadoresList, setTrabajadoresList] = useState([{ nombre: '', cedula: '' }]);
    const [responsablesList, setResponsablesList] = useState([{ nombre: '', cedula: '', rol: '' }]);
    const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);

    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
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

    // Load available workers
    React.useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/perfil-sociodemografico/data', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => { if (data.trabajadores?.length) setAvailableWorkers(data.trabajadores); })
            .catch(err => console.error('Error fetching workers', err));
    }, [token]);

    // Load saved ATS data
    React.useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/analisis-trabajo-seguro/data', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Object.keys(data.formData || {}).length > 0) {
                    setFormData(prev => ({ ...prev, ...data.formData }));
                }
                if (data.trabajadoresList?.length) setTrabajadoresList(data.trabajadoresList);
                if (data.responsablesList?.length) setResponsablesList(data.responsablesList);
                if (data.images) setImages(data.images);
            })
            .catch(err => console.error('Error fetching ATS data', err));
    }, [token]);

    const handleSaveData = async (silent = false) => {
        if (!token) return;
        try {
            const res = await fetch('/api/sgsst/analisis-trabajo-seguro/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ formData, trabajadoresList, responsablesList, images })
            });
            if (res.ok && !silent) showToast({ message: 'Datos del ATS guardados correctamente.', status: 'success' });
        } catch (err) {
            if (!silent) showToast({ message: 'Error al guardar los datos.', status: 'error' });
        }
    };

    const handleDummyData = () => {
        const dummy = generateDummyData.ats();
        setFormData(prev => ({ ...prev, ...dummy.formData }));
        setTrabajadoresList(dummy.trabajadoresList);
        setResponsablesList(dummy.responsablesList);
        setImages(dummy.images as any);
        showToast({ message: 'Datos de prueba generados exitosamente.', status: 'success' });
    };

    const handleVoiceInput = () => {
        if (isListening) {
            try { recognitionRef.current?.stop(); } catch (e) { }
            setIsListening(false);
            setInterimText('');
            return;
        }
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast({ message: 'Su navegador no soporta reconocimiento de voz. Use Chrome.', status: 'error' });
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
                    if (event.results[i].isFinal) newFinal += event.results[i][0].transcript;
                    else currentInterim += event.results[i][0].transcript;
                }
                if (newFinal) {
                    setFormData(prev => ({
                        ...prev,
                        actividadGlobal: prev.actividadGlobal +
                            (prev.actividadGlobal && !prev.actividadGlobal.endsWith(' ') ? ' ' : '') + newFinal
                    }));
                }
                setInterimText(currentInterim);
            };
            recognition.onerror = () => { setIsListening(false); setInterimText(''); };
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
                    if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
                    else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
                    setImages(prev => ({ ...prev, [field]: canvas.toDataURL('image/jpeg', 0.6) }));
                };
                img.src = readerEvent.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (field: string) => {
        setImages(prev => ({ ...prev, [field]: null }));
    };

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        handleSaveData(true);
        try {
            const response = await fetch('/api/sgsst/analisis-trabajo-seguro/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ formData, trabajadoresList, responsablesList, images, modelName: selectedModel }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar el ATS');
            }
            const data = await response.json();
            setGeneratedReport(data.report);
            setEditorContent(data.report);
            setIsFormExpanded(false);
            showToast({ message: 'ATS generado exitosamente', status: 'success' });
        } catch (error: any) {
            showToast({ message: error.message || 'Error al generar ATS', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [formData, images, selectedModel, token, trabajadoresList, responsablesList, showToast]);

    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || generatedReport;
        if (!contentToSave || !token) return;
        try {
            if (conversationId && conversationId !== 'new' && reportMessageId) {
                const res = await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ conversationId, messageId: reportMessageId, content: contentToSave }),
                });
                if (res.ok) { setRefreshTrigger(p => p + 1); showToast({ message: 'ATS actualizado exitosamente', status: 'success' }); }
                return;
            }
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content: contentToSave,
                    title: `ATS - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-ats'],
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(p => p + 1);
                showToast({ message: 'ATS guardado exitosamente', status: 'success' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContent, generatedReport, conversationId, reportMessageId, token, showToast]);

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
                setGeneratedReport(lastMsg.text);
                setEditorContent(lastMsg.text);
                setConversationId(selectedConvoId);
                setReportMessageId(lastMsg.messageId);
                setIsFormExpanded(false);
                showToast({ message: 'ATS cargado correctamente', status: 'success' });
            }
        } catch (e) {
            showToast({ message: 'Error al cargar el ATS', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [token, showToast]);

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                    <DummyGenerateButton onClick={handleDummyData} />
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
                    className="group flex items-center px-3 py-2 bg-blue-700 hover:bg-blue-800 border border-blue-700 text-white rounded-full transition-all duration-300 shadow-md font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <AnimatedIcon name="sparkles" size={20} />}
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar ATS con IA</span>
                </button>
                <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={isGenerating} />
                {generatedReport && (
                    <>
                        <button
                            onClick={handleSave}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                        >
                            <AnimatedIcon name="save" size={20} className="text-gray-500" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Guardar ATS</span>
                        </button>
                        <ExportDropdown content={editorContent || ''} fileName="Analisis_Trabajo_Seguro_ATS" />
                    </>
                )}
            </div>

            {/* History Panel */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory
                        onSelectReport={handleSelectReport}
                        isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
                        refreshTrigger={refreshTrigger}
                        tags={['sgsst-ats']}
                    />
                </div>
            )}

            {/* Form */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                <button onClick={() => setIsFormExpanded(!isFormExpanded)} className="w-full flex items-center justify-between p-4 bg-surface-tertiary">
                    <div className="flex items-center gap-2">
                    <DummyGenerateButton onClick={handleDummyData} />
                        {isFormExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <ShieldCheck className="h-5 w-5 text-blue-700" />
                        <span className="font-semibold">Datos del Análisis de Trabajo Seguro (ATS)</span>
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="p-6 space-y-6">
                        {/* Workers Section */}
                        <div className="space-y-4 border rounded-xl p-4 bg-surface-tertiary/20">
                            <h4 className="font-semibold text-text-primary text-sm">Trabajadores que Ejecutan la Tarea</h4>
                            {trabajadoresList.map((trabajador, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row gap-3">
                                    <WorkerAutocomplete
                                        value={trabajador.nombre}
                                        onChange={(val) => {
                                            const newT = [...trabajadoresList];
                                            newT[idx].nombre = val;
                                            const match = availableWorkers.find(w => w.nombre === val);
                                            if (match) newT[idx].cedula = match.identificacion;
                                            setTrabajadoresList(newT);
                                        }}
                                        onSelect={(w) => {
                                            const newT = [...trabajadoresList];
                                            newT[idx].nombre = w.nombre;
                                            newT[idx].cedula = w.identificacion;
                                            setTrabajadoresList(newT);
                                        }}
                                        data={availableWorkers}
                                        searchKey="nombre"
                                        placeholder="Nombre completo"
                                        wrapperClassName="w-full md:w-1/2"
                                        className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <div className="flex w-full md:w-1/2 gap-2">
                                        <WorkerAutocomplete
                                            value={trabajador.cedula}
                                            onChange={(val) => {
                                                const newT = [...trabajadoresList];
                                                newT[idx].cedula = val;
                                                const match = availableWorkers.find(w => w.identificacion === val);
                                                if (match && !newT[idx].nombre) newT[idx].nombre = match.nombre;
                                                setTrabajadoresList(newT);
                                            }}
                                            onSelect={(w) => {
                                                const newT = [...trabajadoresList];
                                                newT[idx].cedula = w.identificacion;
                                                if (!newT[idx].nombre) newT[idx].nombre = w.nombre;
                                                setTrabajadoresList(newT);
                                            }}
                                            data={availableWorkers}
                                            searchKey="identificacion"
                                            placeholder="Cédula"
                                            wrapperClassName="w-full"
                                            className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => setTrabajadoresList(trabajadoresList.filter((_, i) => i !== idx))}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            disabled={trabajadoresList.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setTrabajadoresList([...trabajadoresList, { nombre: '', cedula: '' }])}
                                className="flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800 font-medium"
                            >
                                <Plus className="h-4 w-4" /> Añadir Trabajador
                            </button>
                        </div>

                        {/* Fecha / Hora */}
                        <h4 className="font-semibold text-text-primary text-sm mt-4">Información de la Tarea</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Fecha de Ejecución</label>
                                <input type="date" value={formData.fecha} onChange={e => handleInputChange('fecha', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Hora de Inicio</label>
                                <input type="time" value={formData.horaInicio} onChange={e => handleInputChange('horaInicio', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                            </div>
                        </div>

                        {/* Preoperational checks */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Charla de Seguridad Realizada</label>
                                <select value={formData.seguridadSocial} onChange={e => handleInputChange('seguridadSocial', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary">
                                    <option>Sí</option><option>No</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Equipos / Herramientas Inspeccionados</label>
                                <select value={formData.aptitudMedica} onChange={e => handleInputChange('aptitudMedica', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary">
                                    <option>Sí</option><option>No</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Condiciones del Área Verificadas</label>
                                <select value={formData.certificacionAlturas} onChange={e => handleInputChange('certificacionAlturas', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary">
                                    <option>Sí</option><option>No</option>
                                </select>
                            </div>
                        </div>

                        {/* Supervisors */}
                        <div className="space-y-3 pt-3 border-t">
                            <label className="text-sm font-medium">Supervisor / Responsable que Aprueba el ATS</label>
                            {responsablesList.map((resp, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row gap-3">
                                    <WorkerAutocomplete
                                        value={resp.nombre}
                                        onChange={(val) => {
                                            const newR = [...responsablesList];
                                            newR[idx].nombre = val;
                                            const match = availableWorkers.find(w => w.nombre === val);
                                            if (match) { newR[idx].cedula = match.identificacion; if (!newR[idx].rol && match.cargo) newR[idx].rol = match.cargo; }
                                            setResponsablesList(newR);
                                        }}
                                        onSelect={(w) => {
                                            const newR = [...responsablesList];
                                            newR[idx].nombre = w.nombre;
                                            newR[idx].cedula = w.identificacion;
                                            if (!newR[idx].rol && w.cargo) newR[idx].rol = w.cargo;
                                            setResponsablesList(newR);
                                        }}
                                        data={availableWorkers}
                                        searchKey="nombre"
                                        placeholder="Nombre"
                                        wrapperClassName="w-full md:w-1/3"
                                        className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={resp.rol}
                                        onChange={e => { const newR = [...responsablesList]; newR[idx].rol = e.target.value; setResponsablesList(newR); }}
                                        className="w-full md:w-1/3 rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary"
                                        placeholder="Rol (Ej: Supervisor, Jefe de Área)"
                                    />
                                    <div className="flex w-full md:w-1/3 gap-2">
                                        <WorkerAutocomplete
                                            value={resp.cedula}
                                            onChange={(val) => {
                                                const newR = [...responsablesList];
                                                newR[idx].cedula = val;
                                                const match = availableWorkers.find(w => w.identificacion === val);
                                                if (match && !newR[idx].nombre) { newR[idx].nombre = match.nombre; if (!newR[idx].rol && match.cargo) newR[idx].rol = match.cargo; }
                                                setResponsablesList(newR);
                                            }}
                                            onSelect={(w) => {
                                                const newR = [...responsablesList];
                                                newR[idx].cedula = w.identificacion;
                                                if (!newR[idx].nombre) { newR[idx].nombre = w.nombre; if (!newR[idx].rol && w.cargo) newR[idx].rol = w.cargo; }
                                                setResponsablesList(newR);
                                            }}
                                            data={availableWorkers}
                                            searchKey="identificacion"
                                            placeholder="Cédula"
                                            wrapperClassName="w-full"
                                            className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => setResponsablesList(responsablesList.filter((_, i) => i !== idx))}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setResponsablesList([...responsablesList, { nombre: '', cedula: '', rol: '' }])}
                                className="flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800 font-medium"
                            >
                                <Plus className="h-4 w-4" /> Añadir Supervisor
                            </button>
                        </div>

                        {/* Task description with voice */}
                        <div className="space-y-4 pt-4 border-t border-border-medium">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-blue-700" /> Descripción de la Tarea a Analizar (Dictado o Texto)
                                </h4>
                                <button
                                    onClick={handleVoiceInput}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow border flex items-center gap-2 ${isListening ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-surface-secondary hover:bg-surface-hover text-text-primary border-border-light'}`}
                                >
                                    <span className="relative flex h-3 w-3">
                                        {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isListening ? 'bg-red-500' : 'bg-blue-700'}`}></span>
                                    </span>
                                    {isListening ? 'Escuchando...' : 'Activar Micrófono'}
                                </button>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                <strong>IMPORTANTE:</strong> Describa detalladamente la tarea que se va a ejecutar:{' '}
                                <u>Tipo de actividad, área o proceso, equipos y herramientas a utilizar, pasos principales, materiales, condiciones del entorno y cualquier peligro observable.</u>
                            </p>
                            <textarea
                                value={formData.actividadGlobal + (interimText ? (formData.actividadGlobal && !formData.actividadGlobal.endsWith(' ') ? ' ' : '') + interimText : '')}
                                onChange={e => { if (!isListening) handleInputChange('actividadGlobal', e.target.value); }}
                                readOnly={isListening}
                                className={`w-full rounded-xl border-2 ${isListening ? 'border-solid border-red-300 bg-red-50/10 focus:border-red-400' : 'border-dashed border-blue-200 bg-blue-50/10 focus:bg-blue-50/30 focus:border-blue-400'} p-4 text-sm text-text-primary min-h-[160px] resize-y transition-colors focus:outline-none`}
                                placeholder="Ej: Se realizará el cambio de rodamiento del motor eléctrico de 50HP en la línea de producción 2. Para la tarea se usará esmeriladora angular, extractor de rodamientos, manleva de 3 toneladas y llaves de torque. La zona cuenta con iluminación artificial..."
                            />
                        </div>

                        {/* Photos */}
                        <div className="space-y-4 pt-4 border-t border-border-medium">
                            <h4 className="font-semibold text-text-primary text-sm">Registro Fotográfico del Área y Tarea</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {['foto1', 'foto2', 'foto3'].map((foto, idx) => {
                                    const labels = ['Vista General del Área', 'Equipos / Herramientas a Usar', 'Condiciones del Entorno'];
                                    const fieldName = foto as 'foto1' | 'foto2' | 'foto3';
                                    const descName = `${foto}Desc`;
                                    return (
                                        <div key={foto} className="flex flex-col items-center gap-3">
                                            <span className="font-semibold text-sm">{labels[idx]}</span>
                                            <div className="relative w-full aspect-square bg-surface-tertiary rounded-xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center overflow-hidden hover:bg-surface-hover transition-colors">
                                                {images[fieldName] ? (
                                                    <>
                                                        <img src={images[fieldName] as string} className="w-full h-full object-cover" alt={foto} />
                                                        <button onClick={() => removeImage(fieldName)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-text-secondary hover:text-blue-700">
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

                        {/* Bottom generate button */}
                        <div className="flex justify-center pt-4 gap-4">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="group flex items-center px-5 py-3 bg-blue-700 hover:bg-blue-800 border border-blue-700 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <AnimatedIcon name="sparkles" size={20} />}
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar ATS con IA</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Generated ATS Editor */}
            {generatedReport && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-blue-700" /> Análisis de Trabajo Seguro (ATS) Generado
                        </h3>
                    </div>
                    <div className="p-1 overflow-hidden">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor
                                    key={conversationId || 'new-ats-editor'}
                                    initialContent={generatedReport}
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

export default AnalisisTrabajoSeguro;
