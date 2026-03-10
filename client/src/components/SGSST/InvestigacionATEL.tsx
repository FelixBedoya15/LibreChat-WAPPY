import React, { useState, useCallback, useRef } from 'react';
import { AlertTriangle, UserCircle, Users, useTranslation } from 'react-i18next';
import {
    Sparkles,
    Save,
    Loader2,
    History,
    Target,
    ChevronDown,
    ChevronRight,
    Camera,
    Image as ImageIcon,
    X,
    FileText,
    Plus,
    Trash2
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';

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

    const exactMatch = value && filteredOptions.find(w => String(w[searchKey]).toLowerCase() === String(value).toLowerCase());

    return (
        <div className={`relative ${wrapperClassName || 'w-full'}`} ref={wrapperRef}>
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
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

const InvestigacionATEL = () => {
    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();

    const [formData, setFormData] = useState({
        tipoEvento: 'Incidente',
        fechaEvento: new Date().toISOString().split('T')[0],
        horaEvento: '08:00',
        lugarEvento: '',
        descripcionHechos: '',
        afectadoNombre: '',
        afectadoCedula: '',
        afectadoCargo: '',
    });

    const [images, setImages] = useState<{ [key: string]: string | null }>({
        foto1: null,
        foto2: null,
        foto3: null,
        foto4: null
    });

    const [testigosList, setTestigosList] = useState([{ nombre: '', cedula: '', cargo: '', testimonio: '' }]);
    const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);

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
                if (data.images) setImages(data.images);
            })
            .catch(err => console.error('Error fetching permiso alturas data', err));
    }, [token]);

    const handleSaveData = async (silent = false) => {
        if (!token) return;
        try {
            const res = await fetch('/api/sgsst/investigacion-atel/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    formData,
                    images
                })
            });
            if (res.ok && !silent) {
                showToast({ message: 'Datos del formulario guardados correctamente.', status: 'success' });
            }
        } catch (err) {
            if (!silent) showToast({ message: 'Error al guardar los datos.', status: 'error' });
        }
    };

    const handleVoiceInput = () => {
        if (isListening) {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
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

            recognition.onstart = () => {
                setIsListening(true);
                setInterimText('');
            };

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
                        actividadGlobal: prev.actividadGlobal + (prev.actividadGlobal && !prev.actividadGlobal.endsWith(' ') ? ' ' : '') + newFinal
                    }));
                }
                setInterimText(currentInterim);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech error:", event.error);
                setIsListening(false);
                setInterimText('');
            };

            recognition.onend = () => {
                setIsListening(false);
                setInterimText('');
            };

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
                    if (width > height) {
                        if (width > MAX_DIM) {
                            height *= MAX_DIM / width;
                            width = MAX_DIM;
                        }
                    } else {
                        if (height > MAX_DIM) {
                            width *= MAX_DIM / height;
                            height = MAX_DIM;
                        }
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

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        handleSaveData(true); // Autosave form data on generate
        try {
            const response = await fetch('/api/sgsst/investigacion-atel/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    formData,
                    images,
                    modelName: selectedModel,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar el Permiso');
            }

            const data = await response.json();
            setGeneratedObjectives(data.report);
            setEditorContent(data.report);
            setIsFormExpanded(false);
            showToast({ message: 'Permiso generado exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Generation error:', error);
            showToast({ message: error.message || 'Error al generar', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [formData, images, selectedModel, token, showToast]);

    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || generatedObjectives;
        if (!contentToSave) return;
        if (!token) return;

        try {
            if (conversationId && conversationId !== 'new' && reportMessageId) {
                const res = await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        conversationId,
                        messageId: reportMessageId,
                        content: contentToSave,
                    }),
                });
                if (res.ok) {
                    setRefreshTrigger(prev => prev + 1);
                    showToast({ message: 'Permiso actualizado exitosamente', status: 'success' });
                }
                return;
            }

            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content: contentToSave,
                    title: `Permiso Alturas - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-investigacion-atel'],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Permiso guardado exitosamente', status: 'success' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContent, generatedObjectives, conversationId, reportMessageId, token, showToast]);

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
                showToast({ message: 'Permiso cargado correctamente', status: 'success' });
            }
        } catch (e) {
            showToast({ message: 'Error al cargar el permiso', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [token, showToast]);

    return (
        <div className="flex flex-col gap-4">
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
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar ATEL con IA</span>
                </button>
                <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={isGenerating} />
                {generatedObjectives && (
                    <>
                        <button
                            onClick={handleSave}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                        >
                            <AnimatedIcon name="save" size={20} className="text-gray-500" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Guardar ATEL</span>
                        </button>
                        <ExportDropdown content={editorContent || ''} fileName="Investigacion_ATEL" />
                    </>
                )}
            </div>

            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory onSelectReport={handleSelectReport} isOpen={isHistoryOpen} toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} refreshTrigger={refreshTrigger} tags={['sgsst-investigacion-atel']} />
                </div>
            )}

            <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                <button onClick={() => setIsFormExpanded(!isFormExpanded)} className="w-full flex items-center justify-between p-4 bg-surface-tertiary">
                    <div className="flex items-center gap-2">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">Datos para el Investigación ATEL</span>
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="p-6 space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Información del Evento */}
                                <div className="space-y-4 md:col-span-2 bg-surface-primary p-4 rounded-xl border border-border-medium shadow-sm">
                                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border-medium pb-2 text-text-primary">
                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                        Información del Evento
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-text-primary">Tipo de Evento</label>
                                            <select
                                                value={formData.tipoEvento}
                                                onChange={(e) => setFormData({ ...formData, tipoEvento: e.target.value })}
                                                className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-text-primary focus:ring-2 focus:ring-blue-500 transition-shadow"
                                            >
                                                <option value="Incidente">Incidente</option>
                                                <option value="Accidente Leve">Accidente Leve</option>
                                                <option value="Accidente Grave">Accidente Grave</option>
                                                <option value="Accidente Mortal">Accidente Mortal</option>
                                                <option value="Enfermedad Laboral">Enfermedad Laboral</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-text-primary">Fecha del Evento</label>
                                            <input
                                                type="date"
                                                value={formData.fechaEvento}
                                                onChange={(e) => setFormData({ ...formData, fechaEvento: e.target.value })}
                                                className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-text-primary focus:ring-2 focus:ring-blue-500 transition-shadow"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-text-primary">Hora del Evento</label>
                                            <input
                                                type="time"
                                                value={formData.horaEvento}
                                                onChange={(e) => setFormData({ ...formData, horaEvento: e.target.value })}
                                                className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-text-primary focus:ring-2 focus:ring-blue-500 transition-shadow"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-primary">Lugar / Área del Evento</label>
                                        <input
                                            type="text"
                                            value={formData.lugarEvento}
                                            onChange={(e) => setFormData({ ...formData, lugarEvento: e.target.value })}
                                            placeholder="Ej. Planta de producción, Pasillo principal..."
                                            className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-text-primary focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-primary flex justify-between items-center">
                                            Descripción Detallada de los Hechos (Voz o Texto)
                                            <button
                                                type="button"
                                                onClick={handleVoiceInput}
                                                className={`p-2 rounded-full transition-colors flex items-center gap-2 ${isListening ? 'bg-red-100 text-red-600 hover:bg-red-200 animate-pulse' : 'bg-surface-tertiary hover:bg-surface-hover text-text-secondary'}`}
                                                title={isListening ? "Detener dictado" : "Iniciar dictado por voz"}
                                            >
                                                {isListening ? (
                                                    <><div className="w-2 h-2 rounded-full bg-red-600 animate-ping"></div> Escuchando...</>
                                                ) : (
                                                    <><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg> Dictar</>
                                                )}
                                            </button>
                                        </label>
                                        <textarea
                                            value={formData.descripcionHechos + (interimText ? ' ' + interimText : '')}
                                            onChange={(e) => setFormData({ ...formData, descripcionHechos: e.target.value })}
                                            className="w-full h-32 p-3 bg-surface-secondary border border-border-medium rounded-lg resize-none focus:ring-2 focus:ring-blue-500 transition-shadow text-text-primary"
                                            placeholder="Describa detalladamente cómo ocurrieron los hechos..."
                                        />
                                    </div>
                                </div>

                                {/* Datos del Afectado */}
                                <div className="space-y-4 md:col-span-2 bg-surface-primary p-4 rounded-xl border border-border-medium shadow-sm">
                                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border-medium pb-2 text-text-primary">
                                        <UserCircle className="h-5 w-5 text-blue-500" />
                                        Trabajador Afectado
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <WorkerAutocomplete
                                            value={formData.afectadoNombre}
                                            onChange={(val) => setFormData({ ...formData, afectadoNombre: val })}
                                            onSelect={(w) => setFormData({
                                                ...formData,
                                                afectadoNombre: w.nombre,
                                                afectadoCedula: w.identificacion,
                                                afectadoCargo: w.cargo || ''
                                            })}
                                            data={availableWorkers}
                                            searchKey="nombre"
                                            placeholder="Nombre del Afectado"
                                            className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-text-primary focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            value={formData.afectadoCedula}
                                            onChange={(e) => setFormData({ ...formData, afectadoCedula: e.target.value })}
                                            placeholder="Cédula"
                                            className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-text-primary focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        />
                                        <input
                                            type="text"
                                            value={formData.afectadoCargo}
                                            onChange={(e) => setFormData({ ...formData, afectadoCargo: e.target.value })}
                                            placeholder="Cargo"
                                            className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-text-primary focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        />
                                    </div>
                                </div>

                                {/* Testigos */}
                                <div className="space-y-4 md:col-span-2 bg-surface-primary p-4 rounded-xl border border-border-medium shadow-sm">
                                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border-medium pb-2 text-text-primary">
                                        <Users className="h-5 w-5 text-purple-500" />
                                        Testigos (Opcional)
                                    </h3>
                                    {testigosList.map((testigo, idx) => (
                                        <div key={idx} className="bg-surface-secondary p-4 rounded-lg border border-border-medium relative">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
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
                                                    className="w-full p-2 bg-surface-primary border border-border-medium rounded-lg text-text-primary focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={testigo.cedula}
                                                    onChange={(e) => {
                                                        const newL = [...testigosList];
                                                        newL[idx].cedula = e.target.value;
                                                        setTestigosList(newL);
                                                    }}
                                                    placeholder="Cédula"
                                                    className="w-full p-2 bg-surface-primary border border-border-medium rounded-lg text-text-primary focus:ring-2 focus:ring-blue-500"
                                                />
                                                 <input
                                                    type="text"
                                                    value={testigo.cargo}
                                                    onChange={(e) => {
                                                        const newL = [...testigosList];
                                                        newL[idx].cargo = e.target.value;
                                                        setTestigosList(newL);
                                                    }}
                                                    placeholder="Cargo"
                                                    className="w-full p-2 bg-surface-primary border border-border-medium rounded-lg text-text-primary focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <textarea
                                                value={testigo.testimonio}
                                                onChange={(e) => {
                                                    const newL = [...testigosList];
                                                    newL[idx].testimonio = e.target.value;
                                                    setTestigosList(newL);
                                                }}
                                                placeholder="Versión del testigo..."
                                                className="w-full h-20 p-2 bg-surface-primary border border-border-medium rounded-lg resize-none text-text-primary focus:ring-2 focus:ring-blue-500"
                                            />
                                            
                                            <button
                                                type="button"
                                                onClick={() => setTestigosList(testigosList.filter((_, i) => i !== idx))}
                                                className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setTestigosList([...testigosList, { nombre: '', cedula: '', cargo: '', testimonio: '' }])}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 mt-2"
                                    >
                                        <Plus className="w-4 h-4" /> Añadir Testigo
                                    </button>
                                </div>

                                {/* Upload Photos */}
                                <div className="space-y-4 md:col-span-2 bg-surface-primary p-4 rounded-xl border border-border-medium shadow-sm">
                                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border-medium pb-2 text-text-primary">
                                        <Camera className="h-5 w-5 text-indigo-500" />
                                        Evidencias Fotográficas (Opcional)
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[1, 2, 3, 4].map(num => (
                                            <div key={num} className="space-y-2">
                                                <div
                                                    className="relative aspect-video bg-surface-secondary border-2 border-dashed border-border-medium rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-surface-hover hover:border-blue-500 transition-colors group overflow-hidden"
                                                    onClick={() => document.getElementById(`foto${num}-upload`)?.click()}
                                                >
                                                    {images[`foto${num}`] ? (
                                                        <>
                                                            <img src={images[`foto${num}`] as string} alt={`Evidencia ${num}`} className="absolute inset-0 w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Cambiar</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ImageIcon className="h-6 w-6 text-text-secondary/60 group-hover:text-blue-500 transition-colors mb-2" />
                                                            <span className="text-xs font-medium text-text-secondary group-hover:text-blue-600 transition-colors">Añadir Foto {num}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    id={`foto${num}-upload`}
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(`foto${num}`, e)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

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
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar ATEL con IA</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {
                generatedObjectives && (
                    <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                        <div className="border-b border-border-medium bg-surface-tertiary px-4 py-3 flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /> Investigación ATEL Generado</h3>
                        </div>
                        <div className="p-1 overflow-hidden">
                            <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                                <div style={{ minWidth: '900px', padding: '16px' }}>
                                    <LiveEditor key={conversationId || 'new-editor'} initialContent={generatedObjectives} onUpdate={setEditorContent} onSave={handleSave} />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default InvestigacionATEL;
