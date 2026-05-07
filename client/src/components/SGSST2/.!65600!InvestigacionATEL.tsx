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
    ShieldAlert, Download } from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';
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
        <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600">
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
    const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite');
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

