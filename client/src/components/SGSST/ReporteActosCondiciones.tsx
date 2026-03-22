import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Save,
    Loader2,
    History,
    ChevronDown,
    ChevronRight,
    Camera,
    X,
    FileText,
    Plus,
    Trash2,
    AlertTriangle,
    Inbox,
    QrCode,
    CheckCircle,
    Download
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
import { useAutoLoadReport } from './useAutoLoadReport';

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

const ReporteActosCondiciones = () => {
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
        seguridadSocial: 'Sí',   // -> "Revisión SG-SST Aplicable"
        aptitudMedica: 'Sí',     // -> "Actividad Suspendida"
        certificacionAlturas: 'Sí', // -> "Requiere Intervención Urgente"
    });

    const [images, setImages] = useState<{ [key: string]: string | null }>({
        foto1: null,
        foto2: null,
        foto3: null
    });

    const [trabajadoresList, setTrabajadoresList] = useState([{ nombre: '', cedula: '' }]);
    const [responsablesList, setResponsablesList] = useState([{ nombre: '', cedula: '', rol: '' }]);
    const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);

    const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview');
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

    // Public Inbox State
    const [inboxPublico, setInboxPublico] = useState<any[]>([]);
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);

    // Load available workers from Perfil Sociodemográfico
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

    // Load previously saved data
    React.useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/reporte-actos/data', {
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
                if (data.inboxPublico) setInboxPublico(data.inboxPublico);
            })
            .catch(err => console.error('Error fetching reporte actos data', err));
    }, [token]);

    const handleDismissInbox = async (id: string) => {
        if (!token) return;
        try {
            const res = await fetch('/api/sgsst/reporte-actos/inbox/dismiss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ reportId: id })
            });
            if (res.ok) {
                const data = await res.json();
                setInboxPublico(data.inboxPublico || []);
                showToast({ message: 'Reporte archivado', status: 'success' });
            }
        } catch (err) {
            showToast({ message: 'Error archivando el reporte', status: 'error' });
        }
    };

    const handleMarkProcessed = async (id: string) => {
        if (!token) return;
        try {
            const res = await fetch('/api/sgsst/reporte-actos/inbox/mark-processed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ reportId: id })
            });
            if (res.ok) {
                const data = await res.json();
                setInboxPublico(data.inboxPublico || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLoadInboxItem = (item: any) => {
        setFormData(prev => ({
            ...prev,
            actividadGlobal: item.data?.descripcion || '',
            fecha: item.data?.fecha || prev.fecha,
            horaInicio: item.data?.hora || prev.horaInicio,
            foto1Desc: item.data?.foto1Desc || '',
            foto2Desc: item.data?.foto2Desc || '',
            foto3Desc: item.data?.foto3Desc || '',
        }));
        setTrabajadoresList([{ 
            nombre: item.trabajador.nombre, 
            cedula: item.trabajador.cedula 
        }]);
        setImages(prev => ({
            ...prev,
            foto1: item.data?.foto1 || null,
            foto2: item.data?.foto2 || null,
            foto3: item.data?.foto3 || null
        }));
        setIsInboxOpen(false);
        showToast({ message: 'Reporte cargado. Revise y complete la información.', status: 'info' });
        handleMarkProcessed(item.id);
    };

    const handleDummyData = () => {
        const dummy = generateDummyData.reporteActos();
        setFormData(prev => ({
            ...prev,
            actividadGlobal: dummy.actividadGlobal,
            fecha: dummy.fecha,
            horaInicio: dummy.horaInicio,
            seguridadSocial: dummy.seguridadSocial,
            aptitudMedica: dummy.aptitudMedica,
            certificacionAlturas: dummy.certificacionAlturas,
            foto1Desc: dummy.foto1Desc,
            foto2Desc: dummy.foto2Desc,
            foto3Desc: dummy.foto3Desc,
        }));
        setTrabajadoresList(dummy.trabajadoresList.map(t => ({ nombre: t.nombre, cedula: t.cedula })));
        setResponsablesList(dummy.responsablesList.map(r => ({ nombre: r.nombre, cedula: r.cedula, rol: r.rol })));
        showToast({ message: 'Datos de reporte simulados generados exitosamente.', status: 'success' });
    };

    const handleSaveData = async (silent = false) => {
        if (!token) return;
        try {
            const res = await fetch('/api/sgsst/reporte-actos/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    formData,
                    trabajadoresList,
                    responsablesList,
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
                console.error('Speech error:', event.error);
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

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        handleSaveData(true);
        try {
            const response = await fetch('/api/sgsst/reporte-actos/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    formData,
                    trabajadoresList,
                    responsablesList,
                    images,
                    modelName: selectedModel,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar el Reporte');
            }

            const data = await response.json();
            setGeneratedReport(data.report);
            setEditorContent(data.report);
            setIsFormExpanded(false);
            showToast({ message: 'Reporte generado exitosamente', status: 'success' });
        } catch (error: any) {
            console.error('Generation error:', error);
            showToast({ message: error.message || 'Error al generar', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [formData, images, selectedModel, token, showToast]);

    const handleSave = useCallback(async () => {
        const contentToSave = editorContent || generatedReport;
        if (!contentToSave) return;
        if (!token) return;

        try {
            if (conversationId && conversationId !== 'new' && reportMessageId) {
                const res = await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ conversationId, messageId: reportMessageId, content: contentToSave }),
                });
                if (res.ok) {
                    setRefreshTrigger(prev => prev + 1);
                    showToast({ message: 'Reporte actualizado exitosamente', status: 'success' });
                }
                return;
            }

            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content: contentToSave,
                    title: `Reporte Actos/Condiciones - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-reporte-actos'],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Reporte guardado exitosamente', status: 'success' });
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
                showToast({ message: 'Reporte cargado correctamente', status: 'success' });
            }
        } catch (e) {
            showToast({ message: 'Error al cargar el reporte', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [token, showToast]);

    useAutoLoadReport({
        token,
        tags: ['sgsst-reporte-actos'],
        generatedReport: generatedReport,
        handleSelectReport
    });

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-hide py-1 w-full border border-border-medium p-2 rounded-xl bg-surface-secondary shadow-sm">
                {/* Historial */}
                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} title="Historial"
                    className={`flex items-center justify-center w-10 h-10 border border-border-medium rounded-full transition-all duration-300 shadow-sm shrink-0 ${isHistoryOpen ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}>
                    <AnimatedIcon name="history" size={20} />
                </button>
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* Generar Informe IA */}
                <button onClick={handleGenerate} disabled={isGenerating} title="Generar Informe IA"
                    className="flex items-center justify-center w-10 h-10 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-sm hover:shadow-md shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <AnimatedIcon name="sparkles" size={20} />}
                </button>
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* Modelo */}
                <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={isGenerating} hideText />
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* Guardar Datos */}
                <button onClick={() => handleSaveData(false)} title="Guardar Datos"
                    className="flex items-center justify-center w-10 h-10 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50">
                    <AnimatedIcon name="database" size={20} className="text-gray-500" />
                </button>
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* Guardar Informe */}
                <button onClick={handleSave} disabled={!editorContent && !generatedReport} title="Guardar Informe"
                    className="flex items-center justify-center w-10 h-10 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                    <AnimatedIcon name="save" size={20} className="text-indigo-600" />
                </button>
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* Exportar */}
                {(editorContent || generatedReport) ? (
                    <ExportDropdown content={editorContent || generatedReport || ''} fileName="Reporte_Actos_Condiciones" hideText />
                ) : (
                    <button disabled title="Exportar" className="flex items-center justify-center w-10 h-10 bg-surface-primary border border-border-medium text-text-primary rounded-full opacity-50 shadow-sm shrink-0 cursor-not-allowed">
                        <Download className="h-5 w-5" />
                    </button>
                )}
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* IA Dummy */}
                <DummyGenerateButton onClick={handleDummyData} hideText text="IA Dummy" />
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* Reportes (Bandeja de Entrada) */}
                <button onClick={() => setIsInboxOpen(!isInboxOpen)} title="Reportes"
                    className="relative flex items-center justify-center w-10 h-10 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0">
                    <Inbox className="w-5 h-5 text-blue-500" />
                    {inboxPublico.filter(i => i.status !== 'processed').length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                            {inboxPublico.filter(i => i.status !== 'processed').length}
                        </span>
                    )}
                </button>
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* Portal Publico */}
                <button onClick={() => setShowQrModal(true)} title="Portal Público"
                    className="flex items-center justify-center w-10 h-10 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0">
                    <QrCode className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* History Panel */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory onSelectReport={handleSelectReport} isOpen={isHistoryOpen} toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} refreshTrigger={refreshTrigger} tags={['sgsst-reporte-actos']} />
                </div>
            )}

            {/* Inbox Panel */}
            {isInboxOpen && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/30 dark:bg-blue-900/10 overflow-hidden shadow-inner p-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-blue-800 dark:text-blue-400 flex items-center gap-2">
                            <Inbox className="w-5 h-5" /> Bandeja de Reportes Públicos
                        </h3>
                        <button onClick={() => setIsInboxOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {inboxPublico.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3 opacity-50" />
                            <p>No tienes reportes pendientes por revisar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inboxPublico.map((item, idx) => {
                                const isProcessed = item.status === 'processed';
                                return (
                                <div key={idx} className={`rounded-lg shadow border p-4 relative flex flex-col transition-colors ${isProcessed ? 'bg-gray-100 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 opacity-70' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-300'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate pr-6 flex items-center gap-2" title={item.trabajador.nombre}>
                                                {item.trabajador.nombre}
                                                {isProcessed && <span title="Procesado"><CheckCircle className="w-3 h-3 text-green-500" /></span>}
                                            </h4>
                                            <p className="text-xs text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis w-[180px]">Cargo: {item.trabajador.cargo}</p>
                                        </div>
                                        <button onClick={() => handleDismissInbox(item.id)} className="text-gray-400 hover:text-red-500 shrink-0 ml-2" title="Descartar reporte">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className={`text-xs line-clamp-3 my-2 flex-grow italic ${isProcessed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>"{item.data?.descripcion}"</p>
                                    <div className="text-[10px] text-gray-400 mb-3 flex justify-between">
                                        <span>{item.data?.fecha} {item.data?.hora}</span>
                                        <span>📍 {item.data?.ubicacion || 'Sin ub.'}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleLoadInboxItem(item)}
                                        className={`w-full py-2 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${isProcessed ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50'}`}
                                    >
                                        {isProcessed ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                                        {isProcessed ? 'Cargar de nuevo' : 'Investigar este reporte'}
                                    </button>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            )}

            {/* QR Modal */}
            {showQrModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowQrModal(false)}>
                    <div className="bg-surface-primary w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-border-medium" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white p-6 text-center relative">
                            <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 text-teal-100 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-3 shadow-inner backdrop-blur-sm">
                                <QrCode className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="font-bold text-xl">Portal Público SGSST</h3>
                        </div>

                        {/* QR Code Body */}
                        <div className="p-6 flex flex-col items-center bg-white dark:bg-surface-primary space-y-5">
                            <p className="text-sm text-center text-gray-600 dark:text-gray-300 leading-relaxed max-w-[260px]">
                                Comparte este código o enlace. Los trabajadores podrán reportar actos inseguros desde su celular.
                            </p>
                            
                            <div className="p-3 border-4 border-gray-100 dark:border-gray-700 rounded-2xl shadow-inner bg-white">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/sgsst-public/reportar/${user?.id || (user as any)?._id}`)}`} 
                                    alt="QR Code" 
                                    className="w-40 h-40 mx-auto"
                                />
                            </div>
                            
                            <div className="w-full space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 text-center">Enlace de acceso público</p>
                                <div className="flex items-center gap-2">
                                    <input 
                                        readOnly 
                                        value={`${window.location.origin}/sgsst-public/reportar/${user?.id || (user as any)?._id}`}
                                        className="flex-1 text-xs px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-600 dark:text-gray-300 ring-0"
                                    />
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/sgsst-public/reportar/${user?.id || (user as any)?._id}`);
                                            showToast({ message: 'Enlace copiado al portapapeles', status: 'success' });
                                        }}
                                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 dark:bg-surface-secondary border-t border-gray-100 dark:border-border-medium flex justify-end">
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="px-6 py-2 rounded-lg font-bold text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                <button onClick={() => setIsFormExpanded(!isFormExpanded)} className="w-full flex items-center justify-between p-4 bg-surface-tertiary">
                    <div className="flex items-center gap-2">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold">Datos del Reporte de Acto / Condición Insegura</span>
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="p-6 space-y-6">
                        {/* Personnel involved */}
                        <div className="space-y-4 border rounded-xl p-4 bg-surface-tertiary/20">
                            <h4 className="font-semibold text-text-primary text-sm">Personal Reportante / Involucrado</h4>
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
                                        className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
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
                                            className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
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
                                className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                                <Plus className="h-4 w-4" /> Añadir Persona
                            </button>
                        </div>

                        {/* Fecha / hora / checks */}
                        <h4 className="font-semibold text-text-primary text-sm mt-4">Información del Hallazgo</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Fecha del Hallazgo</label>
                                <input type="date" value={formData.fecha} onChange={e => handleInputChange('fecha', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Hora del Hallazgo</label>
                                <input type="time" value={formData.horaInicio} onChange={e => handleInputChange('horaInicio', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Revisión SG-SST Aplicable</label>
                                <select value={formData.seguridadSocial} onChange={e => handleInputChange('seguridadSocial', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary">
                                    <option>Sí</option><option>No</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Actividad Suspendida por el Hallazgo</label>
                                <select value={formData.aptitudMedica} onChange={e => handleInputChange('aptitudMedica', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary">
                                    <option>Sí</option><option>No</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Requiere Intervención Urgente</label>
                                <select value={formData.certificacionAlturas} onChange={e => handleInputChange('certificacionAlturas', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary">
                                    <option>Sí</option><option>No</option>
                                </select>
                            </div>
                        </div>

                        {/* Supervisors / Responsible */}
                        <div className="space-y-3 pt-3 border-t">
                            <label className="text-sm font-medium">Supervisor / Responsable del Área</label>
                            {responsablesList.map((resp, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row gap-3">
                                    <WorkerAutocomplete
                                        value={resp.nombre}
                                        onChange={(val) => {
                                            const newR = [...responsablesList];
                                            newR[idx].nombre = val;
                                            const match = availableWorkers.find(w => w.nombre === val);
                                            if (match) {
                                                newR[idx].cedula = match.identificacion;
                                                if (!newR[idx].rol && match.cargo) newR[idx].rol = match.cargo;
                                            }
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
                                        className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                                    />
                                    <input
                                        type="text"
                                        value={resp.rol}
                                        onChange={e => {
                                            const newR = [...responsablesList];
                                            newR[idx].rol = e.target.value;
                                            setResponsablesList(newR);
                                        }}
                                        className="w-full md:w-1/3 rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary"
                                        placeholder="Rol (Ej: Supervisor, COPASST)"
                                    />
                                    <div className="flex w-full md:w-1/3 gap-2">
                                        <WorkerAutocomplete
                                            value={resp.cedula}
                                            onChange={(val) => {
                                                const newR = [...responsablesList];
                                                newR[idx].cedula = val;
                                                const match = availableWorkers.find(w => w.identificacion === val);
                                                if (match && !newR[idx].nombre) {
                                                    newR[idx].nombre = match.nombre;
                                                    if (!newR[idx].rol && match.cargo) newR[idx].rol = match.cargo;
                                                }
                                                setResponsablesList(newR);
                                            }}
                                            onSelect={(w) => {
                                                const newR = [...responsablesList];
                                                newR[idx].cedula = w.identificacion;
                                                if (!newR[idx].nombre) {
                                                    newR[idx].nombre = w.nombre;
                                                    if (!newR[idx].rol && w.cargo) newR[idx].rol = w.cargo;
                                                }
                                                setResponsablesList(newR);
                                            }}
                                            data={availableWorkers}
                                            searchKey="identificacion"
                                            placeholder="Cédula"
                                            wrapperClassName="w-full"
                                            className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
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
                                className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                                <Plus className="h-4 w-4" /> Añadir Responsable
                            </button>
                        </div>

                        {/* Description with voice input */}
                        <div className="space-y-4 pt-4 border-t border-border-medium">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Descripción del Hallazgo (Acto o Condición Insegura)
                                </h4>
                                <button
                                    onClick={handleVoiceInput}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow border flex items-center gap-2 ${isListening ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-surface-secondary hover:bg-surface-hover text-text-primary border-border-light'}`}
                                >
                                    <span className="relative flex h-3 w-3">
                                        {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isListening ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                                    </span>
                                    {isListening ? 'Escuchando...' : 'Activar Micrófono'}
                                </button>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                <strong>IMPORTANTE:</strong> Describa con el mayor detalle posible:{' '}
                                <u>Tipo de hallazgo (acto o condición), ubicación exacta, área/proceso involucrado, riesgo inmediato observado, personal presente, y cualquier circunstancia relevante.</u>
                            </p>
                            <textarea
                                value={formData.actividadGlobal + (interimText ? (formData.actividadGlobal && !formData.actividadGlobal.endsWith(' ') ? ' ' : '') + interimText : '')}
                                onChange={e => {
                                    if (!isListening) {
                                        handleInputChange('actividadGlobal', e.target.value);
                                    }
                                }}
                                readOnly={isListening}
                                className={`w-full rounded-xl border-2 ${isListening ? 'border-solid border-red-300 bg-red-50/10 focus:border-red-400' : 'border-dashed border-orange-200 bg-orange-50/10 focus:bg-orange-50/20 focus:border-orange-400'} p-4 text-sm text-text-primary min-h-[160px] resize-y transition-colors focus:outline-none`}
                                placeholder="Ej: Se observó a trabajador en almacén usando esmeriladora sin protección visual ni careta de protección facial, mientras generaba proyección de partículas metálicas hacia área de tránsito de otros trabajadores..."
                            />
                        </div>

                        {/* Photos */}
                        <div className="space-y-4 pt-4 border-t border-border-medium">
                            <h4 className="font-semibold text-text-primary text-sm">Evidencia Fotográfica del Hallazgo</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {['foto1', 'foto2', 'foto3'].map((foto, idx) => {
                                    const labels = ['Panorámica del Área', 'Detalle del Acto / Condición Insegura', 'Perspectiva / Contexto'];
                                    const fieldName = foto as 'foto1' | 'foto2' | 'foto3';
                                    const descName = `${foto}Desc`;
                                    return (
                                        <div key={foto} className="flex flex-col items-center gap-3">
                                            <span className="font-semibold text-sm">{labels[idx]}</span>
                                            <div className="relative w-full aspect-square bg-surface-tertiary rounded-xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center overflow-hidden hover:bg-surface-hover transition-colors">
                                                {images[fieldName] ? (
                                                    <>
                                                        <img src={images[fieldName] as string} className="w-full h-full object-cover" alt={foto} />
                                                        <button onClick={() => removeImage(fieldName)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-text-secondary hover:text-orange-500">
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
                                className="group flex items-center px-5 py-3 bg-orange-600 hover:bg-orange-700 border border-orange-600 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <AnimatedIcon name="sparkles" size={20} />
                                )}
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar Reporte con IA</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Generated Report Editor */}
            {generatedReport && (
                <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                    <div className="border-b border-border-medium bg-surface-tertiary px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" /> Reporte de Actos y Condiciones Inseguras
                        </h3>
                    </div>
                    <div className="p-1 overflow-hidden">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor key={conversationId || 'new-editor'} initialContent={generatedReport} onUpdate={setEditorContent} onSave={handleSave} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReporteActosCondiciones;
