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
    Inbox,
    MessageSquare,
    AlertTriangle,
    Users,
    UserCheck,
    ClipboardList,
    Video,
    Film,
    Link,
    QrCode,
    Check,
    Trash2,
    ShieldAlert, Download } from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { generateDummyData } from '~/utils/dummyDataGenerator';
import ModelSelector from './ModelSelector';
import { useAutoLoadReport } from './useAutoLoadReport';

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
                <ul className="absolute z-50 w-full mt-1 max-h-48 overflow-auto bg-surface-primary border border-border-medium rounded-xl shadow-xl py-1 text-left origin-top animate-in fade-in zoom-in-95 duration-200">
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
        <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl text-teal-600">
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
    const [video, setVideo] = useState<string | null>(null);
    const [isVideoUploading, setIsVideoUploading] = useState(false);
    const [inboxTestimonios, setInboxTestimonios] = useState<any[]>([]);
    const [showInbox, setShowInbox] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);

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
    const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview');
    const [generatedObjectives, setGeneratedObjectives] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [editorKey, setEditorKey] = useState(() => Date.now().toString());
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
                if (data.video) setVideo(data.video);
                if (data.inboxTestimonios) setInboxTestimonios(data.inboxTestimonios);
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
                body: JSON.stringify({ formData, equipoList, testigosList, images, video })
            });
            if (res.ok && !silent) {
                showToast({ message: 'Datos del formulario guardados correctamente.', status: 'success' });
            }
        } catch (err) {
            if (!silent) showToast({ message: 'Error al guardar los datos.', status: 'error' });
        }
    };

    const handleDummyData = () => {
        const dummy = generateDummyData.investigacion();
        setFormData(prev => ({
            ...prev,
            tipoEvento: 'Accidente Leve', 
            fechaEvento: dummy.fechaEvento,
            horaEvento: dummy.horaEvento,
            lugarEvento: dummy.lugarEvento,
            departamento: 'Antioquia',
            municipio: 'Medellín',
            afectadoNombre: dummy.nombreAccidentado,
            afectadoCedula: dummy.cedula,
            afectadoCargo: dummy.cargo,
            afectadoEps: 'SURA',
            afectadoArl: 'SURA',
            tipoContrato: 'Indefinido',
            jornadaLaboral: dummy.jornadaNormal,
            experienciaLaboral: '5',
            tiempoEnCargo: dummy.tiempoCargo,
            actividadMomento: dummy.laborHabitual === 'Sí' ? 'Labor habitual en bodega' : 'Otra labor',
            descripcionHechos: dummy.descripcionDetallada,
            consecuencias: 'Incapacidad temporal, pausa en la producción.',
            diasIncapacidad: '3',
            naturalezaLesion: 'Esguince / Torcedura',
            agenteCausal: dummy.agenteLesion,
            parteCuerpo: dummy.parteCuerpo,
        }));
        setEquipoList(dummy.equipoList.map((item: any) => ({ nombre: item.nombre, cedula: item.cedula, rol: item.cargo })));
        setTestigosList(dummy.testigosList.map((item: any) => ({ nombre: item.nombre, cedula: item.cedula, cargo: item.cargo, testimonio: item.version })));
        showToast({ message: 'Datos de investigación simulados generados exitosamente.', status: 'success' });
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

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            showToast({ message: 'El video es demasiado pesado (Máximo 20MB).', status: 'error' });
            return;
        }

        setIsVideoUploading(true);
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';

        videoElement.onloadedmetadata = () => {
            window.URL.revokeObjectURL(videoElement.src);
            if (videoElement.duration > 10.5) {
                showToast({ message: 'El video excede los 10 segundos permitidos.', status: 'error' });
                setIsVideoUploading(false);
                return;
            }

            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                setVideo(readerEvent.target?.result as string);
                setIsVideoUploading(false);
                showToast({ message: 'Video de evidencia cargado correctamente.', status: 'success' });
            };
            reader.onerror = () => {
                setIsVideoUploading(false);
                showToast({ message: 'Error al leer el archivo de video.', status: 'error' });
            };
            reader.readAsDataURL(file);
        };

        videoElement.onerror = () => {
            setIsVideoUploading(false);
            showToast({ message: 'Error al procesar el archivo de video.', status: 'error' });
        };

        videoElement.src = URL.createObjectURL(file);
    };

    const removeVideo = () => setVideo(null);


    const handleDismissTestimony = async (id: string) => {
        try {
            const res = await fetch('/api/sgsst/investigacion-atel/inbox/testimonio/dismiss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ reportId: id })
            });
            const data = await res.json();
            if (res.ok) {
                setInboxTestimonios(data.inboxTestimonios);
                showToast({ message: 'Testimonio descartado.', status: 'info' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAcceptTestimony = async (item: any) => {
        // Add to testigosList
        const newWitness = {
            nombre: item.testigo.nombre,
            cedula: item.testigo.cedula,
            cargo: item.testigo.cargo,
            testimonio: item.testimonio
        };
        setTestigosList(prev => [...prev, newWitness]);
        
        // Also add media to images if slot available
        if (item.media?.foto1) {
            setImages(prev => {
                const next = { ...prev };
                const freeSlot = Object.keys(next).find(k => !next[k]);
                if (freeSlot) next[freeSlot] = item.media.foto1;
                return next;
            });
        }

        // Remove from inbox
        await handleDismissTestimony(item.id);
        showToast({ message: 'Testimonio incorporado a la investigación.', status: 'success' });
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
                    video,
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
            setEditorKey(Date.now().toString());
            setConversationId(null);
            setReportMessageId(null);
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
                setEditorKey(Date.now().toString());
            
            setIsFormExpanded(false);
                showToast({ message: 'Informe cargado correctamente', status: 'success' });
            }
        } catch (e) {
            showToast({ message: 'Error al cargar el informe', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [token, showToast]);

    useAutoLoadReport({
        token,
        tags: ['sgsst-investigacion-atel'],
        generatedReport: generatedObjectives,
        handleSelectReport
    });

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Main Toolbar */}
            <div className="flex flex-col items-center gap-6 mb-6">
                <div className="flex items-center gap-4 text-center">
                    <div className="p-3 rounded-2xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 shadow-sm">
                        <ShieldAlert className="h-8 w-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight">Investigación de Accidentes e Incidentes (ATEL)</h2>
                        <p className="text-sm text-text-secondary font-medium">Resolución 1401 de 2007</p>
                    </div>
                </div>

                <SGSSTToolbar
                    onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                    isHistoryOpen={isHistoryOpen}
                    onAnalyze={handleGenerate}
                    isAnalyzing={isGenerating}
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                    onSaveLocal={handleSaveData}
                    onSave={handleSave}
                    hasContent={!!(editorContent || generatedObjectives)}
                    exportContent={editorContent || generatedObjectives || ''}
                    exportFileName="Investigacion_ATEL"
                    onDummy={handleDummyData}
                />
            </div>

            {/* History Panel */}
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
                    <div className="grid grid-cols-1 gap-8">
                {/* ── QR CODE MODAL ── */}
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
                                <h3 className="font-bold text-xl uppercase tracking-wider">Portal Público de Testigos</h3>
                            </div>

                            {/* QR Code Body */}
                            <div className="p-6 flex flex-col items-center bg-white dark:bg-surface-primary space-y-5">
                                <p className="text-sm text-center text-gray-600 dark:text-gray-300 leading-relaxed max-w-[260px]">
                                    Comparte este código o enlace. Los testigos podrán radicar su versión desde su celular de forma segura.
                                </p>
                                
                                <div className="p-3 border-4 border-gray-100 dark:border-gray-700 rounded-2xl shadow-inner bg-white">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/sgsst-public/atel-testimonio/${user?.id || user?._id}`)}`} 
                                        alt="QR Code" 
                                        className="w-40 h-40 mx-auto"
                                    />
                                </div>
                                
                                <div className="w-full space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 text-center">Enlace de acceso público</p>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            readOnly 
                                            value={`${window.location.origin}/sgsst-public/atel-testimonio/${user?.id || user?._id}`}
                                            className="flex-1 text-xs px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-gray-600 dark:text-gray-300 ring-0"
                                        />
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/sgsst-public/atel-testimonio/${user?.id || user?._id}`);
                                                showToast({ message: 'Enlace del portal de testimonios copiado al portapapeles.', status: 'success' });
                                            }}
                                            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
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
                                    className="px-6 py-2 rounded-xl font-bold text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                        {/* ── SECCIÓN 1: Datos del Evento ── */}
                        <div className="border rounded-xl p-5 bg-surface-tertiary/20 space-y-4">
                            <SectionHeader
                                icon={<AlertTriangle className="h-4 w-4" />}
                                subtitle="Tipo, fecha, hora y lugar donde ocurrió el evento"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Tipo de Evento</label>
                                    <div className="relative">
                                        <select
                                            value={formData.tipoEvento}
                                            onChange={e => handleInputChange('tipoEvento', e.target.value)}
                                            className="w-full appearance-none rounded-xl border px-3 py-2 pr-8 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
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
                                    <input type="date" value={formData.fechaEvento} onChange={e => handleInputChange('fechaEvento', e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Hora del Evento</label>
                                    <input type="time" value={formData.horaEvento} onChange={e => handleInputChange('horaEvento', e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1 md:col-span-1">
                                    <label className="text-sm font-medium">Lugar / Área del Evento</label>
                                    <input type="text" value={formData.lugarEvento} onChange={e => handleInputChange('lugarEvento', e.target.value)} placeholder="Ej: Planta de producción, Piso 2" className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Departamento</label>
                                    <input type="text" value={formData.departamento} onChange={e => handleInputChange('departamento', e.target.value)} placeholder="Ej: Antioquia" className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Municipio</label>
                                    <input type="text" value={formData.municipio} onChange={e => handleInputChange('municipio', e.target.value)} placeholder="Ej: Medellín" className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Actividad que realizaba al momento del evento</label>
                                <input type="text" value={formData.actividadMomento} onChange={e => handleInputChange('actividadMomento', e.target.value)} placeholder="Ej: Instalación de tubería en altura, manejo de maquinaria..." className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                            </div>
                        </div>

                        {/* ── SECCIÓN 2: Trabajador Afectado ── */}
                        <div className="border rounded-xl p-5 bg-surface-tertiary/20 space-y-4">
                            <SectionHeader
                                icon={<UserCheck className="h-4 w-4" />}
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
                                        className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
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
                                        className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Cargo</label>
                                    <input type="text" value={formData.afectadoCargo} onChange={e => handleInputChange('afectadoCargo', e.target.value)} placeholder="Cargo en la empresa" className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">EPS</label>
                                    <input type="text" value={formData.afectadoEps} onChange={e => handleInputChange('afectadoEps', e.target.value)} placeholder="EPS afiliada" className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">ARL</label>
                                    <input type="text" value={formData.afectadoArl} onChange={e => handleInputChange('afectadoArl', e.target.value)} placeholder="ARL afiliada" className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Tipo de contrato</label>
                                    <div className="relative">
                                        <select value={formData.tipoContrato} onChange={e => handleInputChange('tipoContrato', e.target.value)} className="w-full appearance-none rounded-xl border px-3 py-2 pr-8 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400">
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
                                        <select value={formData.jornadaLaboral} onChange={e => handleInputChange('jornadaLaboral', e.target.value)} className="w-full appearance-none rounded-xl border px-3 py-2 pr-8 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400">
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
                                    <input type="text" value={formData.experienciaLaboral} onChange={e => handleInputChange('experienciaLaboral', e.target.value)} placeholder="Ej: 5" className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Tiempo en el cargo actual</label>
                                    <input type="text" value={formData.tiempoEnCargo} onChange={e => handleInputChange('tiempoEnCargo', e.target.value)} placeholder="Ej: 8 meses" className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                            </div>
                        </div>

                        {/* ── SECCIÓN 3: Descripción del Evento ── */}
                        <div className="border rounded-xl p-5 bg-surface-tertiary/20 space-y-4">
                            <SectionHeader
                                icon={<ClipboardList className="h-4 w-4" />}
                                subtitle="Narre los hechos antes, durante y después del accidente/incidente"
                            />
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-teal-600" /> Descripción de los Hechos (Dictado o Texto)
                                    </h4>
                                    <button
                                        onClick={handleVoiceInput}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow border flex items-center gap-2 ${isListening ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-surface-secondary hover:bg-surface-hover text-text-primary border-border-light'}`}
                                    >
                                        <span className="relative flex h-3 w-3">
                                            {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isListening ? 'bg-red-500' : 'bg-teal-500'}`}></span>
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
                                    className={`w-full rounded-xl border-2 ${isListening ? 'border-solid border-red-300 bg-red-50/10 focus:border-red-400 focus:bg-red-50/20' : 'border-dashed border-teal-200 bg-teal-50/10 focus:bg-teal-50/30 focus:border-teal-400'} p-4 text-sm text-text-primary min-h-[160px] resize-y transition-colors focus:outline-none`}
                                    placeholder="Ej: El trabajador se encontraba realizando labores de... cuando súbitamente ocurrió..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Naturaleza de la lesión</label>
                                    <div className="relative">
                                        <select value={formData.naturalezaLesion} onChange={e => handleInputChange('naturalezaLesion', e.target.value)} className="w-full appearance-none rounded-xl border px-3 py-2 pr-8 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400">
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
                                    <input type="text" value={formData.parteCuerpo} onChange={e => handleInputChange('parteCuerpo', e.target.value)} placeholder="Ej: Mano derecha, rodilla izquierda" className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Días de incapacidad</label>
                                    <input type="number" min="0" value={formData.diasIncapacidad} onChange={e => handleInputChange('diasIncapacidad', e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Agente causal del evento</label>
                                <input type="text" value={formData.agenteCausal} onChange={e => handleInputChange('agenteCausal', e.target.value)} placeholder="Ej: Maquinaria, piso húmedo, material cortante, caída de altura..." className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Consecuencias del evento</label>
                                <textarea value={formData.consecuencias} onChange={e => handleInputChange('consecuencias', e.target.value)} placeholder="Describa las consecuencias para la persona, el proceso y la empresa..." className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary min-h-[80px] resize-y" />
                            </div>
                        </div>

                        {/* ── SECCIÓN 4: Testigos (Relato de los hechos) ── */}
                        <div className="border rounded-xl p-5 bg-surface-tertiary/20 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-text-primary text-sm italic">4. Testigos (Relato de los hechos)</h4>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowInbox(!showInbox)}
                                        className={`relative w-10 h-10 flex items-center justify-center rounded-xl border transition-all shadow-sm ${showInbox ? 'bg-amber-100 border-amber-300 text-amber-600 shadow-inner' : 'bg-white border-border-medium text-gray-400 hover:text-amber-500 hover:border-amber-200'}`}
                                        title="Bandeja de Testimonios"
                                    >
                                        <Inbox className="h-5 w-5" />
                                        {inboxTestimonios.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse shadow-md border border-white">
                                                {inboxTestimonios.length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowQrModal(true)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border-medium text-gray-400 hover:text-teal-500 hover:border-teal-200 transition-all shadow-sm"
                                        title="Portal Público / QR"
                                    >
                                        <QrCode className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* ── BANDEJA DE TESTIMONIOS (INBOX) INTEGRADA ── */}
                            {showInbox && inboxTestimonios.length > 0 && (
                                <div className="mb-4 bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-2 text-amber-800 mb-3 border-b border-amber-100 pb-2">
                                        <MessageSquare className="h-4 w-4" />
                                        <h5 className="font-bold text-xs uppercase tracking-wider">Testimonios Pendientes</h5>
                                    </div>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {inboxTestimonios.map((item) => (
                                            <div key={item.id} className="bg-white border border-amber-100 rounded-xl p-3 shadow-sm hover:border-amber-300 transition-all group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-xs truncate max-w-[180px]" title={item.testigo.nombre}>{item.testigo.nombre}</h4>
                                                        <p className="text-[10px] text-gray-500 font-medium italic">{item.testigo.cargo} • CC: {item.testigo.cedula}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDismissTestimony(item.id); }}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Descartar"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleAcceptTestimony(item); }}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-[10px] font-black hover:bg-teal-700 shadow-sm active:scale-95 transition-all"
                                                        >
                                                            <Check className="h-3 w-3" /> Aceptar
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-700 line-clamp-3 bg-gray-50 p-2 rounded-lg border border-gray-100 leading-relaxed font-medium">"{item.testimonio}"</p>
                                                
                                                {/* Multimedia preview */}
                                                {(item.testigo.foto1 || item.testigo.foto2 || item.testigo.video) && (
                                                    <div className="flex gap-2 mt-2">
                                                        {item.testigo.foto1 && (
                                                            <div className="relative group/img">
                                                                <img src={item.testigo.foto1} className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm cursor-zoom-in transition-transform group-hover/img:scale-105" />
                                                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 rounded-lg transition-colors" />
                                                            </div>
                                                        )}
                                                        {item.testigo.foto2 && (
                                                            <div className="relative group/img">
                                                                <img src={item.testigo.foto2} className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm cursor-zoom-in transition-transform group-hover/img:scale-105" />
                                                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 rounded-lg transition-colors" />
                                                            </div>
                                                        )}
                                                        {item.testigo.video && (
                                                            <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center shadow-sm relative overflow-hidden group/vid">
                                                                <Video className="h-4 w-4 text-teal-400" />
                                                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/vid:opacity-100 transition-opacity" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {showInbox && inboxTestimonios.length === 0 && (
                                <div className="mb-4 bg-teal-50/50 border border-teal-100 rounded-2xl p-6 text-center animate-in fade-in slide-in-from-top-2">
                                    <Check className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                                    <p className="text-xs text-teal-700 font-bold">No hay testimonios pendientes por revisar.</p>
                                </div>
                            )}
                            {testigosList.map((testigo, idx) => (
                                <div key={idx} className="border border-border-medium rounded-xl p-4 bg-surface-primary space-y-3 relative">
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
                                            className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
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
                                            className="w-full md:w-1/4 rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary"
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
                                                className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary"
                                            />
                                            <button
                                                onClick={() => setTestigosList(testigosList.filter((_, i) => i !== idx))}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex-shrink-0"
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
                                        className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary min-h-[80px] resize-y"
                                    />
                                </div>
                            ))}
                            <button
                                onClick={() => setTestigosList([...testigosList, { nombre: '', cedula: '', cargo: '', testimonio: '' }])}
                                className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
                            >
                                <Plus className="h-4 w-4" /> Añadir Testigo
                            </button>
                        </div>

                        {/* ── SECCIÓN 5: Equipo Investigador (Res 1401 Art. 7) ── */}
                        <div className="border rounded-xl p-5 bg-surface-tertiary/20 space-y-4">
                            <SectionHeader
                                icon={<ClipboardList className="h-4 w-4" />}
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
                                        className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                                    />
                                    <input
                                        type="text"
                                        value={miembro.rol}
                                        onChange={e => {
                                            const newE = [...equipoList];
                                            newE[idx].rol = e.target.value;
                                            setEquipoList(newE);
                                        }}
                                        className="w-full md:w-1/3 rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary"
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
                                            className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                                        />
                                        <button
                                            onClick={() => setEquipoList(equipoList.filter((_, i) => i !== idx))}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setEquipoList([...equipoList, { nombre: '', cedula: '', rol: '' }])}
                                className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
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
                                                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-text-secondary hover:text-teal-500">
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

                        {/* ── SECCIÓN 7: Evidencia en Video ── */}
                        <div className="space-y-4 pt-4 border-t border-border-medium">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                                    <Film className="h-4 w-4 text-teal-600" /> 7. Video de Evidencia Dinámica (Opcional)
                                </h4>
                                <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold uppercase">Máximo 10 Segundos</span>
                            </div>

                            <div className="bg-surface-tertiary/10 border-2 border-dashed border-teal-200 rounded-2xl p-6 transition-all hover:bg-surface-tertiary/20">
                                {!video ? (
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                                            {isVideoUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Video className="h-8 w-8" />}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-text-primary">Sube evidencia dinámica del evento</p>
                                            <p className="text-xs text-text-secondary mt-1">Permite a la IA analizar la secuencia fáctica y condiciones en tiempo real</p>
                                        </div>
                                        <label className="cursor-pointer bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95">
                                            {isVideoUploading ? 'Procesando...' : 'Seleccionar Video'}
                                            <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={isVideoUploading} />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-md mx-auto shadow-2xl border-2 border-teal-400">
                                            <video src={video} controls className="w-full h-full" />
                                            <button onClick={removeVideo} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors z-10">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <p className="text-center text-xs text-teal-600 font-medium bg-teal-50 py-2 rounded-lg border border-teal-100 italic">
                                            Evidencia de video lista para análisis pericial
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Generate Button bottom ── */}
                        <div className="flex justify-center pt-4 gap-4">
                            <button
                                onClick={() => handleGenerate()}
                                disabled={isGenerating}
                                className="group flex items-center px-3 py-2 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
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
                            <FileText className="h-5 w-5 text-teal-600" /> Informe de Investigación ATEL Generado
                        </h3>
                    </div>
                    <div className="p-1 overflow-hidden">
                        <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
                            <div style={{ minWidth: '900px', padding: '16px' }}>
                                <LiveEditor
                                    key={editorKey}
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
