import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { UpgradeWall } from './UpgradeWall';
import { QRCodeSVG } from 'qrcode.react';
import ReactDOM from 'react-dom';
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
    CheckCircle,
    CheckCircle2,
    Video,
    Film,
    Download,
    QrCode,
    Info,
    RefreshCcw,
    RefreshCw,
    BarChart3,
    Building2,
    Shield,
    Star,
    Target,
    Users,
    Scale,
    FileSpreadsheet,
    Search,
    Layers,
    Activity,
    Eye,
    Pencil
} from 'lucide-react';
import cn from '~/utils/cn';
import ParticipacionEstadisticasDashboard from './ParticipacionEstadisticasDashboard';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';
import { generateDummyData } from '~/utils/dummyDataGenerator';
import { useAutoLoadReport } from './useAutoLoadReport';
import SGSSTToolbar, { ToolbarButton } from './SGSSTToolbar';
import SingleSelect from './SingleSelect';
import CollapsibleReportBox from './CollapsibleReportBox';

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


interface ParticipacionData {
    id: string;
    inboxItemId?: string;
    title: string;
    status?: 'pending' | 'applied_to_matrix';
    matrixAction?: 'create_new' | 'update_existing';
    matrixRowId?: string;
    appliedAt?: string | Date;
    formData: {
        fecha: string;
        proceso: string;
        zona: string;
        actividad: string;
        tarea: string;
        rutinaria: 'Sí' | 'No';
        peligroClasificacion: string;
        peligros: string;
        efectosPosibles: string;
        severidadPercibida: 'Baja' | 'Media' | 'Alta' | 'Crítica';
        controlesExistentes: string;
        suficientes: boolean;
        sugeridoEliminacion: string;
        sugeridoIngenieria: string;
        sugeridoAdministrativo: string;
        sugeridoEPP: string;
        actividadGlobal: string;
    };
    images: { foto1: string | null; foto2: string | null; foto3: string | null; };
    video: string | null;
    trabajadoresList: { nombre: string; cedula: string; cargo?: string; }[];
    responsablesList: { nombre: string; cedula: string; rol: string; }[];
    report?: string;
}

const createInitialParticipacion = (): ParticipacionData => ({
    id: crypto.randomUUID(),
    title: `Nueva Participación`,
    status: 'pending',
    formData: {
        fecha: new Date().toISOString().split('T')[0],
        proceso: '',
        zona: '',
        actividad: '',
        tarea: '',
        rutinaria: 'Sí',
        peligroClasificacion: 'Condiciones de Seguridad',
        peligros: '',
        efectosPosibles: '',
        severidadPercibida: 'Media',
        controlesExistentes: '',
        suficientes: true,
        sugeridoEliminacion: '',
        sugeridoIngenieria: '',
        sugeridoAdministrativo: '',
        sugeridoEPP: '',
        actividadGlobal: ''
    },
    images: { foto1: null, foto2: null, foto3: null },
    video: null,
    trabajadoresList: [{ nombre: '', cedula: '' }],
    responsablesList: [{ nombre: '', cedula: '', rol: '' }],
});

export interface UnifiedReportItem {
    id: string;
    source: 'inbox' | 'local';
    workerName: string;
    workerId: string;
    cargo: string;
    proceso: string;
    zona: string;
    actividad: string;
    tarea: string;
    peligros: string;
    peligroClasificacion: string;
    severidad: 'Crítica' | 'Alta' | 'Media' | 'Baja';
    controlesExistentes: string;
    propuestaMejora: string;
    status: 'pending' | 'processed' | 'applied_to_matrix';
    matrixAction?: string;
    matrixRowId?: string;
    appliedAt?: string | Date;
    createdAt: string | Date;
    dateFormatted: string;
    report?: string;
    rawItem: any;
}

const SEV_BADGES: Record<string, { bg: string; text: string; border: string }> = {
    'Crítica': {
        bg: 'bg-red-50 dark:bg-red-950/40',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800'
    },
    'Alta': {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800'
    },
    'Media': {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800'
    },
    'Baja': {
        bg: 'bg-teal-50 dark:bg-teal-950/40',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800'
    }
};

const ParticipacionIPEVAR = () => {

    const { t } = useTranslation();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();
    const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO' || Boolean(user?.isSubUser);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const [participacionesList, setParticipacionesList] = useState<ParticipacionData[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const [activeParticipacion, setActiveParticipacion] = useState<ParticipacionData>(createInitialParticipacion());

    const formData = activeParticipacion.formData;
    const images = activeParticipacion.images;
    const video = activeParticipacion.video;
    const trabajadoresList = activeParticipacion.trabajadoresList;
    const responsablesList = activeParticipacion.responsablesList;

    const setFormData = (updater: any) => {
        setActiveParticipacion(prev => ({
            ...prev,
            formData: typeof updater === 'function' ? updater(prev.formData) : { ...prev.formData, ...updater }
        }));
    };
    const setImages = (updater: any) => {
        setActiveParticipacion(prev => ({
            ...prev,
            images: typeof updater === 'function' ? updater(prev.images) : { ...prev.images, ...updater }
        }));
    };
    const setVideo = (val: string | null) => {
        setActiveParticipacion(prev => ({ ...prev, video: val }));
    };
    const setTrabajadoresList = (val: any) => {
        setActiveParticipacion(prev => ({ ...prev, trabajadoresList: typeof val === 'function' ? val(prev.trabajadoresList) : val }));
    };
    const setResponsablesList = (val: any) => {
        setActiveParticipacion(prev => ({ ...prev, responsablesList: typeof val === 'function' ? val(prev.responsablesList) : val }));
    };

    const [isVideoUploading, setIsVideoUploading] = useState(false);
    const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);

    const [selectedModel, setSelectedModel] = useState(() => user?.personalization?.geminiModels?.sstManagement || 'gemini-3.6-flash');

    React.useEffect(() => {
        if (user?.personalization?.geminiModels?.sstManagement) {
            setSelectedModel(user.personalization.geminiModels.sstManagement);
        }
    }, [user]);
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const editorContentRef = useRef<string>('');
    const liveEditorRef = useRef<LiveEditorHandle>(null);
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
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [inboxPublico, setInboxPublico] = useState<any[]>([]);
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(true);

    const bannerStats = useMemo(() => {
        const workers = new Set<string>();
        (Array.isArray(inboxPublico) ? inboxPublico : []).forEach(item => {
            const id = item.trabajador?.cedula || item.trabajador?.nombre;
            if (id) workers.add(id);
        });
        (Array.isArray(participacionesList) ? participacionesList : []).forEach(item => {
            const id = item.trabajadoresList?.[0]?.cedula || item.trabajadoresList?.[0]?.nombre;
            if (id) workers.add(id);
        });
        return {
            totalWorkers: workers.size > 0 ? workers.size : (inboxPublico.length + participacionesList.length > 0 ? 1 : 0),
            inboxCount: inboxPublico.filter(i => i.status !== 'processed').length,
            totalParticipaciones: participacionesList.length + inboxPublico.length,
        };
    }, [inboxPublico, participacionesList]);

    // Apply to Matrix Modal State
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [itemToApply, setItemToApply] = useState<any>(null);
    const [officialMatrixRows, setOfficialMatrixRows] = useState<any[]>([]);
    const [officialMatrixTitle, setOfficialMatrixTitle] = useState('Matriz IPEVR SG-SST');
    const [isLoadingOfficialRows, setIsLoadingOfficialRows] = useState(false);
    const [applyAction, setApplyAction] = useState<'create_new' | 'update_existing'>('create_new');
    const [applyTargetRowId, setApplyTargetRowId] = useState('');
    const [aiMatchResult, setAiMatchResult] = useState<any>(null);
    const [applyFormData, setApplyFormData] = useState<any>({
        proceso: '',
        zona: '',
        actividad: '',
        tarea: '',
        rutinaria: 'Sí',
        peligroClasificacion: 'Condiciones de Seguridad',
        peligros: '',
        efectosPosibles: '',
        severidadPercibida: 'Media',
        controlesExistentes: '',
        suficientes: true,
        sugeridoEliminacion: '',
        sugeridoIngenieria: '',
        sugeridoAdministrativo: '',
        sugeridoEPP: '',
        trabajadorNombre: '',
        trabajadorCedula: '',
        cargo: ''
    });
    const [isApplyingToMatrix, setIsApplyingToMatrix] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeverity, setFilterSeverity] = useState<'all' | 'Crítica' | 'Alta' | 'Media' | 'Baja'>('all');
    const [filterSource, setFilterSource] = useState<'all' | 'inbox' | 'local' | 'applied'>('all');
    const [isReloading, setIsReloading] = useState(false);
    const reportBoxRef = useRef<HTMLDivElement>(null);
    const formBoxRef = useRef<HTMLDivElement>(null);

    const allUnifiedReports = useMemo<UnifiedReportItem[]>(() => {
        const list: UnifiedReportItem[] = [];

        // 1. From inboxPublico
        (Array.isArray(inboxPublico) ? inboxPublico : []).forEach(item => {
            const d = item.data || {};
            const t = item.trabajador || {};
            const sev = (d.severidadPercibida || 'Media').trim();
            let normSev: 'Crítica' | 'Alta' | 'Media' | 'Baja' = 'Media';
            if (/cr[ií]tic/i.test(sev)) normSev = 'Crítica';
            else if (/alt/i.test(sev)) normSev = 'Alta';
            else if (/baj/i.test(sev)) normSev = 'Baja';

            const rawDate = item.createdAt || d.fecha || '';
            const dateFormatted = rawDate
                ? new Date(rawDate).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                })
                : 'Reciente';

            list.push({
                id: item.id,
                source: 'inbox',
                workerName: t.nombre || 'Colaborador (Buzón)',
                workerId: t.cedula || 'N/A',
                cargo: t.cargo || 'Personal Operativo',
                proceso: d.proceso || d.area || 'Operativo',
                zona: d.zona || 'Sede Principal',
                actividad: d.actividad || d.tarea || 'Labor reportada',
                tarea: d.tarea || '',
                peligros: d.peligros || d.descripcion || 'Peligro identificado',
                peligroClasificacion: d.peligroClasificacion || 'Condiciones de Seguridad',
                severidad: normSev,
                controlesExistentes: d.controlesExistentes || '',
                propuestaMejora: d.propuestaMejora || d.sugeridoIngenieria || '',
                status: item.status || 'pending',
                matrixAction: item.matrixAction,
                matrixRowId: item.matrixRowId,
                appliedAt: item.appliedAt,
                createdAt: rawDate,
                dateFormatted,
                report: item.report,
                rawItem: item
            });
        });

        // 2. From participacionesList
        (Array.isArray(participacionesList) ? participacionesList : []).forEach(p => {
            const f = p.formData || {};
            const t = p.trabajadoresList?.[0] || {};
            const sev = (f.severidadPercibida || 'Media').trim();
            let normSev: 'Crítica' | 'Alta' | 'Media' | 'Baja' = 'Media';
            if (/cr[ií]tic/i.test(sev)) normSev = 'Crítica';
            else if (/alt/i.test(sev)) normSev = 'Alta';
            else if (/baj/i.test(sev)) normSev = 'Baja';

            const rawDate = p.updatedAt || f.fecha || '';
            const dateFormatted = rawDate
                ? new Date(rawDate).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                })
                : 'Local';

            list.push({
                id: p.id,
                source: 'local',
                workerName: t.nombre || p.title || 'Participación SST',
                workerId: t.cedula || 'N/A',
                cargo: t.cargo || 'Personal Evaluado',
                proceso: f.proceso || 'Operativo',
                zona: f.zona || 'Área General',
                actividad: f.actividad || f.tarea || 'Labor evaluada',
                tarea: f.tarea || '',
                peligros: f.peligros || 'Peligro registrado',
                peligroClasificacion: f.peligroClasificacion || 'Condiciones de Seguridad',
                severidad: normSev,
                controlesExistentes: f.controlesExistentes || '',
                propuestaMejora: f.sugeridoIngenieria || f.sugeridoAdministrativo || '',
                status: p.status || 'pending',
                matrixAction: p.matrixAction,
                matrixRowId: p.matrixRowId,
                appliedAt: p.appliedAt,
                createdAt: rawDate,
                dateFormatted,
                report: p.report,
                rawItem: p
            });
        });

        return list;
    }, [inboxPublico, participacionesList]);

    const kpis = useMemo(() => {
        const total = allUnifiedReports.length;
        const critical = allUnifiedReports.filter(r => r.severidad === 'Crítica').length;
        const high = allUnifiedReports.filter(r => r.severidad === 'Alta').length;
        const medium = allUnifiedReports.filter(r => r.severidad === 'Media').length;
        const low = allUnifiedReports.filter(r => r.severidad === 'Baja').length;

        return {
            total,
            critical,
            criticalPct: total > 0 ? Math.round((critical / total) * 100) : 0,
            high,
            highPct: total > 0 ? Math.round((high / total) * 100) : 0,
            medium,
            mediumPct: total > 0 ? Math.round((medium / total) * 100) : 0,
            low,
            lowPct: total > 0 ? Math.round((low / total) * 100) : 0,
        };
    }, [allUnifiedReports]);

    const filteredReports = useMemo(() => {
        return allUnifiedReports.filter(r => {
            const s = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                r.workerName.toLowerCase().includes(s) ||
                r.workerId.toLowerCase().includes(s) ||
                r.cargo.toLowerCase().includes(s) ||
                r.proceso.toLowerCase().includes(s) ||
                r.zona.toLowerCase().includes(s) ||
                r.peligros.toLowerCase().includes(s) ||
                r.actividad.toLowerCase().includes(s);

            const matchesSeverity = filterSeverity === 'all' || r.severidad === filterSeverity;
            const matchesSource = filterSource === 'all' ||
                (filterSource === 'inbox' && r.source === 'inbox') ||
                (filterSource === 'local' && r.source === 'local') ||
                (filterSource === 'applied' && r.status === 'applied_to_matrix');

            return matchesSearch && matchesSeverity && matchesSource;
        });
    }, [allUnifiedReports, searchTerm, filterSeverity, filterSource]);

    React.useEffect(() => {
        fetch('/api/sgsst/company-info', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(info => { if (info && info.companyName) setCompanyInfo(info); })
        .catch(() => {});
    }, [token]);

    const downloadQR = (title: string, containerId: string) => {
        const svgElement = document.getElementById(containerId)?.querySelector('svg');
        if (!svgElement) return;

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext('2d');
            if (context) {
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, 512, 512);
                context.drawImage(image, 32, 32, 448, 448);
                
                const png = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = png;
                downloadLink.download = `QR_${title.replace(/\s+/g, '_')}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
        };
        image.src = blobURL;
    };

    // Listen for cross-component inbox open requests (from notifications)
    React.useEffect(() => {
        const handleOpenInbox = (e: Event) => {
            const { module } = (e as CustomEvent).detail || {};
            if (module === 'participacion_ipevar') setIsInboxOpen(true);
        };
        window.addEventListener('sgsst-open-inbox', handleOpenInbox);
        return () => window.removeEventListener('sgsst-open-inbox', handleOpenInbox);
    }, []);

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
        fetch('/api/sgsst/participacion-ipevar/data', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.inboxPublico) setInboxPublico(data.inboxPublico);
                if (data.participacionesList?.length > 0) {
                    setParticipacionesList(data.participacionesList);
                    setActiveId(data.participacionesList[0].id);
                    setActiveParticipacion(data.participacionesList[0]);
                    setGeneratedReport(data.participacionesList[0].report || null);
                    editorContentRef.current = data.participacionesList[0].report || '';
                    if (liveEditorRef.current) liveEditorRef.current.setHTML(data.participacionesList[0].report || '');
                } else {
                    const initial = createInitialParticipacion();
                    setParticipacionesList([initial]);
                    setActiveId(initial.id);
                    setActiveParticipacion(initial);
                }
            })
            .catch(err => console.error('Error fetching participacion ipevar data', err));
    }, [token]);

    const handleAddParticipacion = () => {
        const initial = createInitialParticipacion();
        setParticipacionesList(prev => [...prev, initial]);
        setActiveId(initial.id);
        setActiveParticipacion(initial);
        setGeneratedReport(null);
        editorContentRef.current = '';
        if (liveEditorRef.current) liveEditorRef.current.setHTML('');
        setIsFormExpanded(true);
        showToast({ message: 'Nueva participación creada', status: 'info' });
    };

    const handleDeleteParticipacion = (id: string) => {
        const updated = participacionesList.filter(p => p.id !== id);
        if (updated.length === 0) {
            const initial = createInitialParticipacion();
            setParticipacionesList([initial]);
            setActiveId(initial.id);
            setActiveParticipacion(initial);
            setGeneratedReport(null);
            editorContentRef.current = '';
            if (liveEditorRef.current) liveEditorRef.current.setHTML('');
        } else {
            setParticipacionesList(updated);
            if (activeId === id) {
                setActiveId(updated[0].id);
                setActiveParticipacion(updated[0]);
                setGeneratedReport(updated[0].report || null);
                editorContentRef.current = updated[0].report || '';
                if (liveEditorRef.current) liveEditorRef.current.setHTML(updated[0].report || '');
            }
        }
    };

    const handleSelectParticipacion = (id: string) => {
        const part = participacionesList.find(p => p.id === id);
        if (part) {
            setActiveId(id);
            setActiveParticipacion(part);
            setGeneratedReport(part.report || null);
            editorContentRef.current = part.report || '';
            if (liveEditorRef.current) liveEditorRef.current.setHTML(part.report || '');
            setIsFormExpanded(true);
            setConversationId(null);
            setReportMessageId(null);
            setRefreshTrigger(p => p + 1);
        }
    };


    const handleDismissInbox = async (id: string) => {
        if (!token) return;
        try {
            const res = await fetch('/api/sgsst/participacion-ipevar/inbox/dismiss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ reportId: id })
            });
            if (res.ok) {
                const data = await res.json();
                setInboxPublico(data.inboxPublico || []);
                showToast({ message: 'Reporte archivado', status: 'success', severity: 'success' });
            }
        } catch (err) {
            showToast({ message: 'Error archivando el reporte', status: 'error' });
        }
    };

    const handleMarkProcessed = async (id: string) => {
        if (!token) return;
        try {
            const res = await fetch('/api/sgsst/participacion-ipevar/inbox/mark-processed', {
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

    const evaluateAIMatrixMatch = (currentData: any, rows: any[]) => {
        if (!rows || rows.length === 0) {
            return {
                action: 'create_new' as 'create_new' | 'update_existing',
                bestMatchRow: null,
                score: 0,
                status: 'no_rows',
                title: 'Nuevo Peligro en Matriz Oficial',
                summary: 'La Matriz Oficial aún no cuenta con filas registradas. Se creará como el primer peligro oficial del sistema.'
            };
        }

        const cargoNorm = (currentData.cargo || '').toLowerCase().trim();
        const clasifNorm = (currentData.peligroClasificacion || '').toLowerCase().trim();
        const procesoNorm = (currentData.proceso || '').toLowerCase().trim();
        const tareaNorm = (currentData.tarea || '').toLowerCase().trim();

        let bestRow: any = null;
        let highestScore = 0;

        for (const row of rows) {
            let score = 0;
            const rCargo = (row.cargo || '').toLowerCase().trim();
            const rClasif = (row.peligro_clasificacion || '').toLowerCase().trim();
            const rProceso = (row.proceso || '').toLowerCase().trim();
            const rTarea = (row.tarea || row.peligro_descripcion || '').toLowerCase().trim();

            // 1. Clasificación GTC-45 (Peso: 40%)
            if (clasifNorm && rClasif) {
                if (clasifNorm === rClasif) {
                    score += 40;
                } else if (clasifNorm.includes(rClasif) || rClasif.includes(clasifNorm)) {
                    score += 30;
                }
            }

            // 2. Cargo Expuesto (Peso: 35%)
            if (cargoNorm && rCargo) {
                if (cargoNorm === rCargo) {
                    score += 35;
                } else if (cargoNorm.includes(rCargo) || rCargo.includes(cargoNorm)) {
                    score += 25;
                }
            }

            // 3. Proceso / Área (Peso: 15%)
            if (procesoNorm && rProceso) {
                if (procesoNorm === rProceso || procesoNorm.includes(rProceso) || rProceso.includes(procesoNorm)) {
                    score += 15;
                }
            }

            // 4. Tarea / Labor (Peso: 10%)
            if (tareaNorm && rTarea) {
                if (tareaNorm === rTarea) {
                    score += 10;
                } else if (tareaNorm.includes(rTarea) || rTarea.includes(tareaNorm)) {
                    score += 6;
                }
            }

            if (score > highestScore) {
                highestScore = score;
                bestRow = row;
            }
        }

        if (highestScore >= 55 && bestRow) {
            return {
                action: 'update_existing' as 'create_new' | 'update_existing',
                bestMatchRow: bestRow,
                score: highestScore,
                status: 'match_found',
                title: 'Coincidencia Identificada en Matriz Oficial',
                summary: `La IA detectó una coincidencia del ${highestScore}% con el peligro evaluado para ${bestRow.cargo || 'este cargo'} en ${bestRow.proceso || 'este proceso'}. Se complementarán los controles propuestos y se sumará la población expuesta.`
            };
        }

        return {
            action: 'create_new' as 'create_new' | 'update_existing',
            bestMatchRow: bestRow,
            score: highestScore,
            status: 'no_match',
            title: 'Nuevo Peligro Inédito Detectado',
            summary: highestScore > 0
                ? `La IA auditó la matriz oficial y no encontró un peligro equivalente (similitud máxima baja de ${highestScore}%). Se creará una nueva fila técnica para registrar este hallazgo colectivo.`
                : 'La IA auditó la matriz oficial y confirmó que este peligro no tiene evaluaciones previas. Se registrará como una nueva fila técnica oficial.'
        };
    };

    const fetchOfficialMatrixRows = async (formDataForMatch?: any) => {
        if (!token) return;
        setIsLoadingOfficialRows(true);
        try {
            const res = await fetch('/api/sgsst/participacion-ipevar/official-matrix-rows', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const rows = data.rows || [];
                setOfficialMatrixRows(rows);
                if (data.officialTitle) setOfficialMatrixTitle(data.officialTitle);
                
                const dataToEvaluate = formDataForMatch || applyFormData;
                const matchResult = evaluateAIMatrixMatch(dataToEvaluate, rows);
                setAiMatchResult(matchResult);
                setApplyAction(matchResult.action);
                if (matchResult.action === 'update_existing' && matchResult.bestMatchRow) {
                    setApplyTargetRowId(matchResult.bestMatchRow.id);
                } else if (rows.length > 0 && !applyTargetRowId) {
                    setApplyTargetRowId(rows[0].id);
                }
            }
        } catch (err) {
            console.error('Error fetching official matrix rows:', err);
        } finally {
            setIsLoadingOfficialRows(false);
        }
    };

    const handleOpenApplyModal = (target: any, isInbox = false) => {
        const isFromInbox = isInbox || !!target.trabajador;
        const workerNombre = isFromInbox ? target.trabajador?.nombre : target.trabajadoresList?.[0]?.nombre;
        const workerCedula = isFromInbox ? target.trabajador?.cedula : target.trabajadoresList?.[0]?.cedula;
        const workerCargo = isFromInbox ? target.trabajador?.cargo : target.trabajadoresList?.[0]?.cargo;

        const fData = isFromInbox ? (target.data || {}) : (target.formData || {});

        const newFormData = {
            proceso: fData.area || fData.proceso || 'Operativo',
            zona: fData.zona || 'Área de trabajo',
            actividad: fData.actividad || fData.tarea || '',
            tarea: fData.tarea || '',
            rutinaria: fData.rutinaria || 'Sí',
            peligroClasificacion: fData.peligroClasificacion || 'Condiciones de Seguridad',
            peligros: fData.peligros || fData.descripcion || '',
            efectosPosibles: fData.consecuencias || fData.efectosPosibles || '',
            severidadPercibida: fData.severidadPercibida || 'Media',
            controlesExistentes: fData.controlesExistentes || '',
            suficientes: fData.suficientes ?? true,
            sugeridoEliminacion: fData.sugeridoEliminacion || '',
            sugeridoIngenieria: fData.propuestaMejora || fData.sugeridoIngenieria || '',
            sugeridoAdministrativo: fData.sugeridoAdministrativo || '',
            sugeridoEPP: fData.sugeridoEPP || '',
            trabajadorNombre: workerNombre || '',
            trabajadorCedula: workerCedula || '',
            cargo: workerCargo || ''
        };

        setApplyFormData(newFormData);
        setItemToApply({ ...target, isInbox: isFromInbox });
        setShowApplyModal(true);
        fetchOfficialMatrixRows(newFormData);
    };

    const handleApplyConsolidadoFromStats = (consolidadoData: any) => {
        const newFormData = {
            proceso: consolidadoData.proceso || 'Operaciones',
            zona: consolidadoData.zona || 'Sede Principal',
            cargo: consolidadoData.cargo || 'Personal Operativo',
            actividad: consolidadoData.actividad || '',
            tarea: consolidadoData.tarea || '',
            rutinaria: consolidadoData.rutinaria || 'Sí',
            peligroClasificacion: consolidadoData.peligroClasificacion || 'Condiciones de Seguridad',
            peligros: consolidadoData.peligros || '',
            efectosPosibles: consolidadoData.efectosPosibles || '',
            severidadPercibida: consolidadoData.severidadPercibida || 'Media',
            controlesExistentes: consolidadoData.controlesExistentes || '',
            suficientes: false,
            sugeridoEliminacion: consolidadoData.sugeridoEliminacion || '',
            sugeridoIngenieria: consolidadoData.sugeridoIngenieria || '',
            sugeridoAdministrativo: consolidadoData.sugeridoAdministrativo || '',
            sugeridoEPP: consolidadoData.sugeridoEPP || '',
            nro_expuestos: consolidadoData.nro_expuestos || consolidadoData.reportesCount || 1,
            peorConsecuencia: consolidadoData.peorConsecuencia || consolidadoData.efectosPosibles || '',
            trabajadorNombre: consolidadoData.trabajadorNombre || `Ponderado: ${consolidadoData.cargo}`,
            trabajadorCedula: consolidadoData.trabajadorCedula || 'ESTADISTICA-GTC45'
        };

        setApplyFormData(newFormData);
        setItemToApply({
            id: consolidadoData.id || ('consolidado-' + Date.now()),
            reportIds: consolidadoData.reportIds || [],
            trabajador: {
                nombre: consolidadoData.trabajadorNombre,
                cedula: consolidadoData.trabajadorCedula,
                cargo: consolidadoData.cargo
            },
            data: consolidadoData,
            isInbox: false
        });
        setShowApplyModal(true);
        fetchOfficialMatrixRows(newFormData);
    };

    const handleConfirmApplyToMatrix = async () => {
        if (!token || !itemToApply) return;
        setIsApplyingToMatrix(true);
        try {
            const res = await fetch('/api/sgsst/participacion-ipevar/apply-to-matrix', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    reportId: itemToApply.id,
                    reportIds: itemToApply.reportIds,
                    action: applyAction,
                    targetRowId: applyAction === 'update_existing' ? applyTargetRowId : undefined,
                    matrixData: applyFormData
                })
            });

            if (res.ok) {
                const data = await res.json();
                showToast({
                    message: data.message || 'Peligro integrado exitosamente a la Matriz IPEVR Oficial',
                    status: 'success',
                    severity: 'success'
                });

                const allTargetIds = new Set([
                    String(itemToApply.id),
                    ...(Array.isArray(itemToApply.reportIds) ? itemToApply.reportIds.map(String) : [])
                ]);

                // Update active participacion status if applies
                if (allTargetIds.has(String(activeParticipacion.id)) || (activeParticipacion.inboxItemId && allTargetIds.has(String(activeParticipacion.inboxItemId)))) {
                    setActiveParticipacion(prev => ({
                        ...prev,
                        status: 'applied_to_matrix',
                        matrixAction: applyAction,
                        matrixRowId: data.targetRowId,
                        appliedAt: new Date()
                    }));
                }

                // Update participacionesList
                setParticipacionesList(prev => prev.map(p => {
                    if (allTargetIds.has(String(p.id)) || (p.inboxItemId && allTargetIds.has(String(p.inboxItemId)))) {
                        return {
                            ...p,
                            status: 'applied_to_matrix',
                            matrixAction: applyAction,
                            matrixRowId: data.targetRowId,
                            appliedAt: new Date()
                        };
                    }
                    return p;
                }));

                // Update inboxPublico
                setInboxPublico(prev => prev.map(item => {
                    if (allTargetIds.has(String(item.id))) {
                        return {
                            ...item,
                            status: 'applied_to_matrix',
                            matrixAction: applyAction,
                            matrixRowId: data.targetRowId,
                            appliedAt: new Date()
                        };
                    }
                    return item;
                }));

                // Notify live listeners (Official Matrix & Kanban)
                window.dispatchEvent(new CustomEvent('ipevar-official-updated'));
                window.dispatchEvent(new CustomEvent('kanban-tasks-updated'));

                setShowApplyModal(false);
            } else {
                const errData = await res.json();
                showToast({ message: errData.error || 'Error al integrar a la matriz', status: 'error' });
            }
        } catch (err) {
            showToast({ message: 'Error de conexión con el servidor', status: 'error' });
        } finally {
            setIsApplyingToMatrix(false);
        }
    };

    const handleLoadInboxItem = (item: any) => {
        const newPart = createInitialParticipacion();
        newPart.id = crypto.randomUUID();
        newPart.inboxItemId = item.id;
        newPart.title = `Reporte: ${item.trabajador.nombre}`;
        newPart.status = item.status === 'applied_to_matrix' ? 'applied_to_matrix' : 'pending';
        newPart.formData = {
            ...newPart.formData,
            proceso: item.data?.proceso || '',
            zona: item.data?.zona || '',
            actividad: item.data?.actividad || item.data?.tarea || '',
            tarea: item.data?.tarea || '',
            rutinaria: item.data?.rutinaria || 'Sí',
            peligroClasificacion: item.data?.peligroClasificacion || 'Condiciones de Seguridad',
            peligros: item.data?.peligros || '',
            efectosPosibles: item.data?.efectosPosibles || '',
            severidadPercibida: item.data?.severidadPercibida || 'Media',
            controlesExistentes: item.data?.controlesExistentes || '',
            suficientes: item.data?.suficientes ?? true,
            sugeridoEliminacion: item.data?.sugeridoEliminacion || '',
            sugeridoIngenieria: item.data?.sugeridoIngenieria || '',
            sugeridoAdministrativo: item.data?.sugeridoAdministrativo || '',
            sugeridoEPP: item.data?.sugeridoEPP || '',
        };
        newPart.trabajadoresList = [{ nombre: item.trabajador.nombre, cedula: item.trabajador.cedula, cargo: item.trabajador.cargo }];
        newPart.images = {
            foto1: item.data?.foto1 || null,
            foto2: item.data?.foto2 || null,
            foto3: item.data?.foto3 || null
        };
        newPart.video = item.data?.video || null;
        
        setParticipacionesList(prev => [...prev, newPart]);
        setActiveId(newPart.id);
        setActiveParticipacion(newPart);
        setGeneratedReport(null);
        editorContentRef.current = '';
        if (liveEditorRef.current) liveEditorRef.current.setHTML('');
        
        setIsInboxOpen(false);
        setIsFormExpanded(true);
        showToast({ message: 'Reporte cargado como nueva participación. Revise y complete la información.', status: 'info' });
        handleMarkProcessed(item.id);
    };

    const handleReloadData = async () => {
        if (!token) return;
        setIsReloading(true);
        try {
            const res = await fetch('/api/sgsst/participacion-ipevar/data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.participacionesList) setParticipacionesList(data.participacionesList);
                if (data.inboxPublico) setInboxPublico(data.inboxPublico);
                showToast({ message: 'Listado de participaciones sincronizado correctamente.', status: 'info' });
            }
        } catch (err) {
            console.error('Error reloading data:', err);
        } finally {
            setIsReloading(false);
        }
    };

    const handleViewReport = (r: UnifiedReportItem) => {
        if (r.source === 'local') {
            handleSelectParticipacion(r.id);
        } else {
            handleLoadInboxItem(r.rawItem);
        }

        if (r.report) {
            setGeneratedReport(r.report);
            editorContentRef.current = r.report;
            if (liveEditorRef.current) liveEditorRef.current.setHTML(r.report);
            showToast({ message: `Informe de ${r.workerName} cargado en LiveEditor.`, status: 'info' });
        } else {
            showToast({ message: `Datos de ${r.workerName} cargados en el formulario. Listo para generar informe técnico.`, status: 'info' });
        }

        setTimeout(() => {
            reportBoxRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
    };

    const handleEditReport = (r: UnifiedReportItem) => {
        if (r.source === 'local') {
            handleSelectParticipacion(r.id);
        } else {
            handleLoadInboxItem(r.rawItem);
        }
        setIsFormExpanded(true);
        showToast({ message: `Datos de ${r.workerName} listos para edición en el formulario.`, status: 'info' });
        setTimeout(() => {
            formBoxRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
    };

    const handleDeleteReport = (r: UnifiedReportItem) => {
        if (!confirm(`¿Estás seguro de eliminar el reporte de ${r.workerName}?`)) return;
        if (r.source === 'inbox') {
            handleDismissInbox(r.id);
        } else {
            handleDeleteParticipacion(r.id);
        }
    };

    const handleDummyData = () => {
        const newPart = createInitialParticipacion();
        newPart.title = 'Participación Simulada';
        newPart.formData = {
            ...newPart.formData,
            proceso: 'Mantenimiento e Instalaciones',
            zona: 'Bodega Principal - Altillo Este',
            actividad: 'Mantenimiento electromecánico de redes y luminarias',
            tarea: 'Sustitución de balastros y cableado en altura (> 4m)',
            rutinaria: 'No',
            peligroClasificacion: 'Condiciones de Seguridad',
            peligros: 'Trabajo en alturas sobre plataforma, riesgo eléctrico por líneas energizadas cercanas, proyección de partículas.',
            efectosPosibles: 'Traumatismo craneoencefálico, fracturas múltiples, quemaduras por arco eléctrico.',
            severidadPercibida: 'Alta',
            controlesExistentes: 'Uso de arnés de cuerpo entero y eslinga en Y, línea de vida vertical con freno.',
            suficientes: false,
            sugeridoEliminacion: 'Reemplazar balastros antiguos por paneles LED autovoltaje de larga vida útil para evitar intervenciones continuas.',
            sugeridoIngenieria: 'Diseñar e instalar riel de anclaje de línea de vida horizontal rígida permanente.',
            sugeridoAdministrativo: 'Permiso formal de trabajo en alturas (Res. 4272/21), delimitación perimetral a 5 metros y vigía SST permanente.',
            sugeridoEPP: 'Casco dieléctrico con barbuquejo de 3 puntos, guantes dieléctricos Clase 0 con sobreguante de vaqueta, gafas de seguridad con filtro UV.',
        };
        newPart.trabajadoresList = [{ nombre: 'Juan Pérez', cedula: '12345678', cargo: 'Técnico Electromecánico' }];
        newPart.responsablesList = [{ nombre: 'Ana Gómez', cedula: '98765432', rol: 'Supervisor SST' }];
        newPart.images = {
            foto1: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=500',
            foto2: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=500',
            foto3: 'https://images.unsplash.com/photo-1621905235210-90805c862d22?auto=format&fit=crop&q=80&w=500'
        };
        setParticipacionesList(prev => [...prev, newPart]);
        setActiveId(newPart.id);
        setActiveParticipacion(newPart);
        setGeneratedReport(null);
        editorContentRef.current = '';
        if (liveEditorRef.current) liveEditorRef.current.setHTML('');
        showToast({ message: 'Datos de participación simulados generados exitosamente.', status: 'success', severity: 'success' });
    };

    const handleSaveData = async (silent = false) => {
        if (!token) return;
        
        const editedReport = editorContentRef.current || generatedReport || undefined;
        let pList = participacionesList;
        if (activeId) {
            pList = participacionesList.map(p => 
                p.id === activeId ? { ...activeParticipacion, report: editedReport } : p
            );
            setParticipacionesList(pList);
        }

        try {
            const res = await fetch('/api/sgsst/participacion-ipevar/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ participacionesList: pList })
            });
            if (res.ok && !silent) {
                showToast({ message: 'Guardado exitosamente', status: 'success', severity: 'success' });
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
                        tarea: prev.tarea + (prev.tarea && !prev.tarea.endsWith(' ') ? ' ' : '') + newFinal
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

    const handleInputChange = (field: string, value: string | boolean) => {
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

    const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            showToast({ message: 'El video es demasiado pesado. Máximo 20MB.', status: 'error' });
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
            reader.onload = (ev) => {
                setVideo(ev.target?.result as string);
                setIsVideoUploading(false);
                showToast({ message: 'Video de evidencia cargado.', status: 'success', severity: 'success' });
            };
            reader.onerror = () => setIsVideoUploading(false);
            reader.readAsDataURL(file);
        };

        videoElement.onerror = () => {
            showToast({ message: 'Error al procesar el video.', status: 'error' });
            setIsVideoUploading(false);
        };

        videoElement.src = URL.createObjectURL(file);
    }, [showToast]);

    const removeVideo = () => setVideo(null);

    const handleGenerate = useCallback(async () => {

        if (!isPro && (!conversationId || conversationId === 'new')) {
            try {
                const resCount = await fetch(`/api/sgsst/diagnostico/report-history?tags=sgsst-participacion-ipevar`, { headers: { Authorization: `Bearer ${token}` } });
                if (resCount.ok) {
                    const data = await resCount.json();
                    if (data.conversations?.length >= 1) {
                        setShowUpgradeModal(true);
                        return;
                    }
                }
            } catch (e) {}
        }
        setIsGenerating(true);
        handleSaveData(true);
        try {
            const response = await fetch('/api/sgsst/participacion-ipevar/generate', {
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
                    video,
                    modelName: selectedModel,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al generar el Reporte');
            }

            const data = await response.json();
            setGeneratedReport(data.report);
            editorContentRef.current = data.report;
            if (liveEditorRef.current) liveEditorRef.current.setHTML(data.report);
            setConversationId(null);
            setReportMessageId(null);
            setIsFormExpanded(false);
            setParticipacionesList(prev => prev.map(p => p.id === activeId ? { ...p, report: data.report } : p));
            showToast({ message: 'Reporte generado exitosamente', status: 'success', severity: 'success' });
        } catch (error: any) {
            console.error('Generation error:', error);
            showToast({ message: error.message || 'Error al generar', status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [formData, images, selectedModel, token, showToast]);

    const handleSave = useCallback(async () => {
        const contentToSave = editorContentRef.current || generatedReport;
        if (!contentToSave) return;
        if (!token) return;

        
        const isNew = !conversationId || conversationId === 'new';
        if (!isPro && isNew) {
            try {
                const resCount = await fetch(`/api/sgsst/diagnostico/report-history?tags=sgsst-participacion-ipevar`, { headers: { Authorization: `Bearer ${token}` } });
                if (resCount.ok) {
                    const data = await resCount.json();
                    if (data.conversations?.length >= 1) {
                        setShowUpgradeModal(true);
                        return;
                    }
                }
            } catch (e) {}
        }
        
        try {
            if (conversationId && conversationId !== 'new' && reportMessageId) {
                const res = await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ conversationId, messageId: reportMessageId, content: contentToSave }),
                });
                if (res.ok) {
                    setRefreshTrigger(prev => prev + 1);
                    showToast({ message: 'Reporte actualizado exitosamente', status: 'success', severity: 'success' });
                }
                return;
            }

            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content: contentToSave,
                    title: `${activeParticipacion.title} - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-participacion-ipevar', `sgsst-participacion-ipevar-${activeId}`],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
                setRefreshTrigger(prev => prev + 1);
                
                const updatedList = participacionesList.map(p => p.id === activeId ? { ...p, report: contentToSave } : p);
                setParticipacionesList(updatedList);
                await fetch('/api/sgsst/participacion-ipevar/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ participacionesList: updatedList })
                });
                
                showToast({ message: 'Guardado exitosamente', status: 'success', severity: 'success' });
            }
        } catch (error: any) {
            showToast({ message: `Error: ${error.message}`, status: 'error' });
        }
    }, [editorContentRef.current, generatedReport, conversationId, reportMessageId, token, showToast]);

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
                editorContentRef.current = lastMsg.text;
            liveEditorRef.current?.setHTML(lastMsg.text);
                setConversationId(selectedConvoId);
                setReportMessageId(lastMsg.messageId);
            
            setIsFormExpanded(false);
                showToast({ message: 'Reporte cargado correctamente', status: 'success', severity: 'success' });
            }
        } catch (e) {
            showToast({ message: 'Error al cargar el reporte', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [token, showToast]);

    useAutoLoadReport({
        token,
        tags: ['sgsst-participacion-ipevar', `sgsst-participacion-ipevar-${activeId}`],
        generatedReport: generatedReport,
        handleSelectReport
    });

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* ─── BANNER DE CONTROL Y ESTADO DE PARTICIPACIÓN IPEVR (Estilo Matriz IPEVR) ─── */}
            <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
                {/* Glow de fondo */}
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Lado Izquierdo: Información y Estado */}
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-500/20">
                            <Target className="h-7 w-7 stroke-[2.2]" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-black tracking-tight text-text-primary">
                                    Participación IPEVR & Base Estadística Colectiva
                                </h2>
                                <div
                                    title="Sincronización Oficial Activa"
                                    className="group flex h-7 min-w-[28px] sm:h-8 sm:min-w-[32px] shrink-0 cursor-default items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                                >
                                    <div className="relative flex flex-shrink-0 items-center justify-center">
                                        <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
                                        <span className="absolute -right-1 -top-1 flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                        </span>
                                    </div>
                                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                                        <span className="text-xs font-black uppercase tracking-wider">Matriz Oficial Conectada</span>
                                    </div>
                                </div>
                            </div>

                            {/* Badges de Métricas Conectadas con Estilo Expansible Estándar */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                {/* Población Evaluada */}
                                <div
                                    title={`${bannerStats.totalWorkers} ${bannerStats.totalWorkers === 1 ? 'Colaborador Participante' : 'Colaboradores Participantes'}`}
                                    className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                                >
                                    <div className="relative flex flex-shrink-0 items-center justify-center">
                                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                                        <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                                            {bannerStats.totalWorkers}
                                        </span>
                                    </div>
                                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                                        <span className="text-sm font-bold tracking-wide">
                                            {bannerStats.totalWorkers} {bannerStats.totalWorkers === 1 ? 'Colaborador Participante' : 'Colaboradores Participantes'}
                                        </span>
                                    </div>
                                </div>

                                {/* Reportes Registrados */}
                                <div
                                    title={`${bannerStats.totalParticipaciones} Reportes Registrados`}
                                    className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                                >
                                    <div className="relative flex flex-shrink-0 items-center justify-center">
                                        <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                                        <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                                            {bannerStats.totalParticipaciones}
                                        </span>
                                    </div>
                                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 sm:flex">
                                        <span className="text-sm font-bold tracking-wide">
                                            {bannerStats.totalParticipaciones} {bannerStats.totalParticipaciones === 1 ? 'Reporte Registrado' : 'Reportes Registrados'}
                                        </span>
                                    </div>
                                </div>

                                {/* Ponderación Estadística GTC-45 Activa */}
                                <div
                                    title="Ponderación Estadística GTC-45 Activa"
                                    className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                                >
                                    <div className="relative flex flex-shrink-0 items-center justify-center">
                                        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                                    </div>
                                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                                        <span className="text-sm font-bold tracking-wide">
                                            Ponderación GTC-45 Activa
                                        </span>
                                    </div>
                                </div>

                                {/* Res. 0312: CUMPLE */}
                                <div
                                    title="Res. 0312: CUMPLE (Estándares 4.1.1 y 4.1.2)"
                                    className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                                >
                                    <div className="relative flex flex-shrink-0 items-center justify-center">
                                        <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    </div>
                                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                                        <span className="text-sm font-bold tracking-wide">
                                            Res. 0312: CUMPLE
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lado Derecho: Acceso al Portal QR */}
                    <div className="flex md:flex-col items-end justify-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowQrModal(true)}
                            title="Portal Público QR"
                            aria-label="Portal Público QR"
                            className="group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 shadow-sm outline-none transition-all duration-300 sm:h-10 sm:min-w-[40px] sm:px-2.5 sm:hover:-rotate-3 sm:hover:scale-105"
                        >
                            <div className="relative flex flex-shrink-0 items-center justify-center">
                                <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                            </div>
                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                                <span className="text-sm font-bold tracking-wide">Portal Público QR</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── 2. Barra Flotante de Herramientas SGSST ── */}
            <SGSSTToolbar
                onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                isHistoryOpen={isHistoryOpen}
                onAnalyze={handleGenerate}
                isAnalyzing={isGenerating}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                onSaveLocal={() => handleSaveData(false)}
                hasContent={!!generatedReport}
                exportContent={editorContentRef.current || ''}
                exportFileName="Reporte_Actos_Condiciones"
                onDummy={handleDummyData}
                customSections={[
                    <div className="flex items-center gap-2">
                        <ToolbarButton
                            id="analytics-dashboard"
                            onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                            label="Base Estadística"
                            icon={BarChart3}
                            active={isAnalyticsOpen}
                        />
                        <ToolbarButton
                            id="inbox-public"
                            onClick={() => setIsInboxOpen(!isInboxOpen)}
                            label={`Reportes (${inboxPublico.filter(i => i.status !== 'processed').length})`}
                            icon="inbox"
                            badge={inboxPublico.filter(i => i.status !== 'processed').length || undefined}
                            active={isInboxOpen}
                        />
                        <ToolbarButton
                            id="qr-portal"
                            onClick={() => setShowQrModal(true)}
                            label="Portal Público"
                            icon="qrcode"
                        />
                    </div>
                ]}
            />

            {/* ── 3. Base Estadística y Ponderación GTC-45 (Integrada directamente en el Aplicativo) ── */}
            {isAnalyticsOpen && (
                <ParticipacionEstadisticasDashboard
                    inboxPublico={inboxPublico}
                    participacionesList={participacionesList}
                    onApplyConsolidadoToMatrix={handleApplyConsolidadoFromStats}
                    onDismissInbox={handleDismissInbox}
                    onClose={() => setIsAnalyticsOpen(false)}
                    isEmbedded={true}
                />
            )}

            {/* ── Directorio y Seguimiento de Participaciones IPEVR (Estilo EPT) ── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                            <span>Directorio de Reportes y Participación IPEVR</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                            Gestiona y consulta los {allUnifiedReports.length} reportes de participación de los trabajadores con seguimiento, informes técnicos e integración a la Matriz IPEVR.
                        </p>
                    </div>
                </div>

                {/* ─── TARJETAS DE KPIS DE PARTICIPACIÓN Y RIESGOS ─── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                    {/* Total Reportes */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
                            <span className="text-xs font-bold uppercase tracking-wider">Total Reportes</span>
                            <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="mt-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.total}</span>
                            <span className="text-[11px] text-slate-500 ml-2 font-medium">participaciones</span>
                        </div>
                    </div>

                    {/* Riesgo Crítico */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-950/60 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between text-red-600 dark:text-red-400">
                            <span className="text-xs font-bold uppercase tracking-wider">Riesgo Crítico</span>
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-black text-red-600 dark:text-red-400">{kpis.critical}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                                {kpis.criticalPct}%
                            </span>
                        </div>
                    </div>

                    {/* Riesgo Alto */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-950/60 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                            <span className="text-xs font-bold uppercase tracking-wider">Riesgo Alto</span>
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{kpis.high}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                {kpis.highPct}%
                            </span>
                        </div>
                    </div>

                    {/* Riesgo Medio */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-950/60 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                            <span className="text-xs font-bold uppercase tracking-wider">Riesgo Medio</span>
                            <Layers className="w-4 h-4" />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{kpis.medium}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                {kpis.mediumPct}%
                            </span>
                        </div>
                    </div>

                    {/* Aceptable / Bajo */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-teal-200 dark:border-teal-950/60 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
                        <div className="flex items-center justify-between text-teal-600 dark:text-teal-400">
                            <span className="text-xs font-bold uppercase tracking-wider">Aceptable</span>
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-black text-teal-600 dark:text-teal-400">{kpis.low}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                                {kpis.lowPct}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─── DIRECTORIO DE REPORTES Y SEGUIMIENTO ─── */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                    {/* Cabecera de búsqueda y filtros */}
                    <div className="p-4 md:p-5 border-b border-slate-200 dark:border-zinc-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                        <div className="relative w-full lg:w-72">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar por trabajador, cédula, cargo o peligro..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-zinc-100"
                            />
                        </div>

                        {/* Filtros de severidad y origen */}
                        <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end">
                            {/* Filtro Severidad */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-[11px] font-semibold">
                                <button
                                    onClick={() => setFilterSeverity('all')}
                                    className={cn(
                                        'px-2.5 py-1 rounded-lg transition-all',
                                        filterSeverity === 'all'
                                            ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm font-bold'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
                                    )}
                                >
                                    Todos ({allUnifiedReports.length})
                                </button>
                                <button
                                    onClick={() => setFilterSeverity('Crítica')}
                                    className={cn(
                                        'px-2 py-1 rounded-lg transition-all',
                                        filterSeverity === 'Crítica'
                                            ? 'bg-red-500 text-white font-bold'
                                            : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                                    )}
                                >
                                    Crítico
                                </button>
                                <button
                                    onClick={() => setFilterSeverity('Alta')}
                                    className={cn(
                                        'px-2 py-1 rounded-lg transition-all',
                                        filterSeverity === 'Alta'
                                            ? 'bg-amber-500 text-white font-bold'
                                            : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                    )}
                                >
                                    Alto
                                </button>
                                <button
                                    onClick={() => setFilterSeverity('Media')}
                                    className={cn(
                                        'px-2 py-1 rounded-lg transition-all',
                                        filterSeverity === 'Media'
                                            ? 'bg-blue-600 text-white font-bold'
                                            : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                                    )}
                                >
                                    Medio
                                </button>
                                <button
                                    onClick={() => setFilterSeverity('Baja')}
                                    className={cn(
                                        'px-2 py-1 rounded-lg transition-all',
                                        filterSeverity === 'Baja'
                                            ? 'bg-teal-500 text-white font-bold'
                                            : 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30'
                                    )}
                                >
                                    Bajo
                                </button>
                            </div>

                            {/* Filtro Origen / Estado */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-[11px] font-semibold">
                                <button
                                    onClick={() => setFilterSource('all')}
                                    className={cn(
                                        'px-2 py-1 rounded-lg transition-all',
                                        filterSource === 'all'
                                            ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm font-bold'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
                                    )}
                                >
                                    Todos
                                </button>
                                <button
                                    onClick={() => setFilterSource('inbox')}
                                    className={cn(
                                        'px-2 py-1 rounded-lg transition-all',
                                        filterSource === 'inbox'
                                            ? 'bg-sky-500 text-white font-bold'
                                            : 'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30'
                                    )}
                                >
                                    Buzón QR
                                </button>
                                <button
                                    onClick={() => setFilterSource('applied')}
                                    className={cn(
                                        'px-2 py-1 rounded-lg transition-all',
                                        filterSource === 'applied'
                                            ? 'bg-emerald-600 text-white font-bold'
                                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                    )}
                                >
                                    En Matriz
                                </button>
                            </div>

                            {/* Botón Recargar */}
                            <button
                                onClick={handleReloadData}
                                disabled={isReloading}
                                className="group flex h-8 min-w-[32px] items-center justify-center rounded-xl text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all duration-300 hover:bg-slate-100 dark:hover:bg-zinc-800 px-2 border border-slate-200 dark:border-zinc-700 cursor-pointer"
                                title="Recargar y sincronizar reportes"
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5 shrink-0", isReloading && "animate-spin text-teal-600")} />
                                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[90px] group-hover:opacity-100 sm:flex">
                                    <span className="text-[11px] font-bold">Recargar</span>
                                </div>
                            </button>

                            {/* Botón Nueva Participación */}
                            <button
                                type="button"
                                onClick={() => {
                                    handleAddParticipacion();
                                    setTimeout(() => {
                                        formBoxRef.current?.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                }}
                                className="group flex h-8 min-w-[32px] sm:h-9 sm:min-w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white px-3 shadow-md shadow-teal-700/20 outline-none transition-all duration-300 hover:scale-105 active:scale-95"
                                title="Registrar nueva participación"
                            >
                                <Plus className="h-4 w-4 shrink-0" />
                                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[180px] group-hover:opacity-100 sm:flex">
                                    <span className="text-xs font-bold tracking-wide">
                                        Nueva Participación
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Tabla responsive de reportes */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-zinc-800">
                                    <th className="py-3 px-4">Trabajador / Cédula</th>
                                    <th className="py-3 px-4">Cargo & Proceso</th>
                                    <th className="py-3 px-4">Peligro & Actividad</th>
                                    <th className="py-3 px-4">Modalidad</th>
                                    <th className="py-3 px-4 text-center">Riesgo / Seguimiento</th>
                                    <th className="py-3 px-4">Fecha</th>
                                    <th className="py-3 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-slate-400">
                                            <Activity className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
                                            <p className="font-semibold text-slate-600 dark:text-zinc-300">No se encontraron reportes con los filtros seleccionados.</p>
                                            <p className="text-[11px] mt-1 text-slate-400">
                                                Crea una nueva participación con el botón "+ Nueva Participación" o comparte el código QR con los trabajadores.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map((r) => {
                                        const badge = SEV_BADGES[r.severidad] || SEV_BADGES.Media;
                                        const isInbox = r.source === 'inbox';
                                        const isApplied = r.status === 'applied_to_matrix';
                                        const isSelected = r.id === activeId;

                                        return (
                                            <tr
                                                key={r.id}
                                                className={cn(
                                                    "transition-colors group",
                                                    isSelected
                                                        ? "bg-teal-50/70 dark:bg-teal-950/30"
                                                        : "hover:bg-teal-50/40 dark:hover:bg-zinc-800/40"
                                                )}
                                            >
                                                {/* Trabajador */}
                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                        <span>{r.workerName}</span>
                                                        {isApplied && (
                                                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                                                                En Matriz
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                                                        C.C. {r.workerId}
                                                    </div>
                                                </td>

                                                {/* Cargo & Proceso */}
                                                <td className="py-3 px-4 max-w-xs">
                                                    <div className="font-semibold text-teal-700 dark:text-teal-400 truncate">
                                                        {r.cargo}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate" title={`${r.proceso} • ${r.zona}`}>
                                                        {r.proceso} {r.zona ? `• ${r.zona}` : ''}
                                                    </div>
                                                </td>

                                                {/* Peligro & Actividad */}
                                                <td className="py-3 px-4 max-w-xs">
                                                    <div className="font-semibold text-slate-800 dark:text-zinc-200 truncate" title={r.peligros}>
                                                        {r.peligros}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate" title={r.actividad || r.tarea}>
                                                        {r.actividad || r.tarea || 'Labor reportada'}
                                                    </div>
                                                </td>

                                                {/* Modalidad */}
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <span
                                                        className={cn(
                                                            'px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1',
                                                            isInbox
                                                                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        )}
                                                    >
                                                        {isInbox ? 'Auto-reporte QR' : 'Asistida (SST)'}
                                                    </span>
                                                </td>

                                                {/* Severidad / Seguimiento */}
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    <span
                                                        className={cn(
                                                            'px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block',
                                                            badge.bg,
                                                            badge.text,
                                                            badge.border
                                                        )}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                    <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[120px] mx-auto">
                                                        {r.peligroClasificacion}
                                                    </div>
                                                </td>

                                                {/* Fecha */}
                                                <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 text-[11px] whitespace-nowrap">
                                                    {r.dateFormatted}
                                                </td>

                                                {/* Acciones */}
                                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Ver Informe */}
                                                        <button
                                                            onClick={() => handleViewReport(r)}
                                                            className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100 transition-all duration-300 px-1.5 shadow-sm active:scale-95 cursor-pointer"
                                                            title="Ver y editar informe técnico en Live Editor"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 shrink-0" />
                                                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[80px] group-hover:opacity-100 sm:flex">
                                                                <span className="text-[10px] font-bold">Ver</span>
                                                            </div>
                                                        </button>

                                                        {/* Integrar a Matriz */}
                                                        <button
                                                            onClick={() => handleOpenApplyModal(r.rawItem, r.source === 'inbox')}
                                                            className={cn(
                                                                "group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 cursor-pointer",
                                                                isApplied
                                                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100"
                                                                    : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100"
                                                            )}
                                                            title={isApplied ? "Actualizar registro en Matriz IPEVR" : "Homologar e integrar con IA a la Matriz IPEVR"}
                                                        >
                                                            <Layers className="w-3.5 h-3.5 shrink-0" />
                                                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                                                                <span className="text-[10px] font-bold">{isApplied ? 'En Matriz' : 'Integrar'}</span>
                                                            </div>
                                                        </button>

                                                        {/* Editar */}
                                                        <button
                                                            onClick={() => handleEditReport(r)}
                                                            className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 hover:bg-amber-100 transition-all duration-300 px-1.5 shadow-sm active:scale-95 cursor-pointer"
                                                            title="Editar datos del reporte en el formulario"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5 shrink-0" />
                                                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[80px] group-hover:opacity-100 sm:flex">
                                                                <span className="text-[10px] font-bold">Editar</span>
                                                            </div>
                                                        </button>

                                                        {/* Eliminar */}
                                                        <button
                                                            onClick={() => handleDeleteReport(r)}
                                                            className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-all duration-300 px-1.5 shadow-sm active:scale-95 cursor-pointer"
                                                            title="Eliminar reporte"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[80px] group-hover:opacity-100 sm:flex">
                                                                <span className="text-[10px] font-bold">Eliminar</span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* History Panel */}
            {isHistoryOpen && (
                <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
                    <ReportHistory onSelectReport={handleSelectReport} isOpen={isHistoryOpen} toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} refreshTrigger={refreshTrigger} tags={['sgsst-participacion-ipevar', `sgsst-participacion-ipevar-${activeId}`]} />
                </div>
            )}

            {/* Inbox Panel */}
            {isInboxOpen && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/30 dark:bg-blue-900/10 overflow-hidden shadow-inner p-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-bold text-lg text-blue-800 dark:text-blue-400 flex items-center gap-2">
                                <Inbox className="w-5 h-5" /> Bandeja de Reportes Públicos
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsInboxOpen(false);
                                    setShowAnalyticsModal(true);
                                }}
                                title="Base Estadística y Ponderación GTC-45"
                                className="group flex h-8 min-w-[32px] sm:h-9 sm:min-w-[36px] items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-sm transition-all duration-300 px-2 sm:px-2.5 active:scale-95 cursor-pointer"
                            >
                                <BarChart3 className="w-4 h-4 shrink-0" />
                                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[280px] group-hover:opacity-100 sm:flex">
                                    <span className="text-xs font-bold">Base Estadística y Ponderación GTC-45</span>
                                </div>
                                <span className="text-xs font-bold ml-1.5 sm:hidden">Base Estadística</span>
                            </button>
                        </div>
                        <button
                            onClick={() => setIsInboxOpen(false)}
                            title="Cerrar Bandeja"
                            className="group flex h-8 min-w-[32px] sm:h-9 sm:min-w-[36px] items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300 px-2 shadow-2xs active:scale-95 cursor-pointer"
                        >
                            <X className="w-4 h-4 shrink-0" />
                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[60px] group-hover:opacity-100 sm:flex">
                                <span className="text-xs font-bold">Cerrar</span>
                            </div>
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
                                const isApplied = item.status === 'applied_to_matrix';
                                return (
                                <div key={idx} className={`rounded-xl shadow border p-4 relative flex flex-col transition-colors ${isApplied ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : isProcessed ? 'bg-gray-100 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 opacity-80' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-300'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate pr-2 flex items-center gap-2" title={item.trabajador.nombre}>
                                                {item.trabajador.nombre}
                                                {isApplied && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">En Matriz</span>}
                                                {isProcessed && !isApplied && <CheckCircle className="w-3 h-3 text-green-500" />}
                                            </h4>
                                            <p className="text-xs text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis w-[180px]">Cargo: {item.trabajador.cargo}</p>
                                        </div>
                                        <button onClick={() => handleDismissInbox(item.id)} className="text-gray-400 hover:text-red-500 shrink-0 ml-2">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {(item.data?.centroTrabajo || item.data?.area) && (
                                        <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mb-1 truncate">
                                            {item.data?.centroTrabajo ? `🏢 ${item.data.centroTrabajo}` : ''} {item.data?.area ? `• ${item.data.area}` : ''}
                                        </div>
                                    )}
                                    <p className={`text-xs line-clamp-3 my-2 flex-grow italic ${isProcessed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>"{item.data?.tarea || item.data?.descripcion}"</p>
                                    <div className="text-[10px] text-gray-400 mb-3 flex justify-between">
                                        <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</span>
                                        <span>📍 {item.data?.zona || item.data?.ubicacion || 'Sin ub.'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5 mt-auto">
                                        <button 
                                            onClick={() => handleLoadInboxItem(item)}
                                            className={`w-full py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 ${isProcessed ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50'}`}
                                        >
                                            {isProcessed ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} 
                                            {isProcessed ? 'Cargado en formulario' : 'Cargar en formulario'}
                                        </button>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            )}

            {/* QR Modal */}
            {showQrModal && ReactDOM.createPortal(
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowQrModal(false)}>
                    <div
                        className="bg-white dark:bg-zinc-900 w-full max-w-[385px] min-h-[490px] md:min-h-[530px] max-h-[85vh] md:max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border border-border-medium/60 flex flex-col animate-in zoom-in duration-200"
                        onClick={e => e.stopPropagation()}>
                        {/* Modal Header - Integrated Wappy Style (Compact) */}
                        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border-light dark:border-border-medium/30 relative shrink-0">
                            <div className="w-10 h-10 rounded-full border-2 border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/30 flex items-center justify-center shrink-0 shadow-inner">
                                <QrCode className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="text-left flex-grow">
                                <h3 className="font-extrabold text-sm text-text-primary tracking-tight">Portal Público SGSST</h3>
                                <p className="text-[11px] text-text-secondary font-semibold">Participación IPEVR</p>
                            </div>
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="absolute top-4 right-5 p-1 rounded-lg text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-all duration-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="p-5 flex flex-col bg-surface-primary dark:bg-zinc-900/10 space-y-4 overflow-y-auto flex-grow">
                            {/* Blue Instruction Card (Wappy Style - Compact) */}
                            <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-3 text-left w-full flex items-start gap-2.5 shrink-0">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                    <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">Portal IPEVR</h4>
                                    <p className="text-[10px] text-indigo-600/90 dark:text-indigo-400/90 leading-relaxed font-semibold">
                                        Comparte este código o enlace. Los trabajadores podrán reportar y participar activamente en la identificación de peligros y evaluación de riesgos desde sus celulares.
                                    </p>
                                </div>
                            </div>

                            <div className="relative group flex flex-col items-center gap-2.5 py-2 shrink-0">
                                <div id="ipevar-portal-qr-container" className="p-3 border border-border-medium bg-white rounded-xl shadow-sm">
                                    <QRCodeSVG value={`${window.location.origin}/sgsst-public/ipevar/${companyInfo?._id || user?.id || (user as any)?._id || ''}`} size={115} className="mx-auto" level="H" includeMargin={false} />
                                </div>
                                <button
                                    onClick={() => downloadQR("Participacion_IPEVR_SGSST", 'ipevar-portal-qr-container')}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-lg text-[10px] font-bold border border-teal-200 dark:border-teal-900/50 hover:bg-teal-100 transition-colors shadow-sm cursor-pointer shrink-0"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Descargar QR
                                </button>
                            </div>

                            <div className="w-full space-y-1.5 pt-1 shrink-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary opacity-70 text-center">Enlace de acceso público</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        readOnly
                                        value={`${window.location.origin}/sgsst-public/ipevar/${companyInfo?._id || user?.id || (user as any)?._id || ''}`}
                                        className="flex-grow text-[10px] font-mono px-3 py-2.5 bg-surface-secondary dark:bg-zinc-800 border border-border-medium rounded-xl outline-none text-text-secondary"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/sgsst-public/ipevar/${companyInfo?._id || user?.id || (user as any)?._id || ''}`);
                                            showToast({ message: 'Enlace copiado al portapapeles', status: 'success', severity: 'success' });
                                        }}
                                        className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded-xl transition-colors shadow-sm shrink-0"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 bg-gray-50 dark:bg-zinc-900/80 border-t border-border-light dark:border-border-medium flex justify-end shrink-0">
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="px-5 py-1.5 rounded-lg font-bold text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-750 transition-all shadow-sm cursor-pointer">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Form */}
            <div ref={formBoxRef} className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
                <button onClick={() => setIsFormExpanded(!isFormExpanded)} className="w-full flex items-center justify-between p-4 bg-surface-tertiary">
                    <div className="flex items-center gap-2">
                        {isFormExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <AlertTriangle className="h-5 w-5 text-teal-600" />
                        <span className="font-semibold">Datos Participación IPEVR</span>
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
                                        className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
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
                                            className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                                        />
                                        <button
                                            onClick={() => setTrabajadoresList(trabajadoresList.filter((_, i) => i !== idx))}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                            disabled={trabajadoresList.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setTrabajadoresList([...trabajadoresList, { nombre: '', cedula: '' }])}
                                className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
                            >
                                <Plus className="h-4 w-4" /> Añadir Persona
                            </button>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border-medium">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-text-primary text-sm">Proceso / Área</h4>
                                    <input 
                                        type="text" 
                                        value={formData.proceso || ''} 
                                        onChange={e => handleInputChange('proceso', e.target.value)} 
                                        className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary mt-1" 
                                        placeholder="Ej: Operaciones, Mantenimiento, Logística..." 
                                    />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-text-primary text-sm">Zona / Lugar Físico</h4>
                                    <input 
                                        type="text" 
                                        value={formData.zona || ''} 
                                        onChange={e => handleInputChange('zona', e.target.value)} 
                                        className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary mt-1" 
                                        placeholder="Ej: Taller Central, Bodega 2, Planta..." 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <h4 className="font-semibold text-text-primary text-sm">Actividad General</h4>
                                    <input 
                                        type="text" 
                                        value={formData.actividad || ''} 
                                        onChange={e => handleInputChange('actividad', e.target.value)} 
                                        className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary mt-1" 
                                        placeholder="Ej: Mantenimiento electromecánico preventivo..." 
                                    />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-text-primary text-sm">¿Es Rutinaria?</h4>
                                    <div className="mt-1">
                                        <SingleSelect 
                                            value={formData.rutinaria || 'Sí'} 
                                            onChange={val => handleInputChange('rutinaria', val)} 
                                            placeholder="Seleccione..." 
                                            options={['Sí', 'No']} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-text-primary text-sm">Labor o Tarea Realizada <span className="text-red-500">*</span></h4>
                                <input 
                                    type="text" 
                                    value={formData.tarea} 
                                    onChange={e => handleInputChange('tarea', e.target.value)} 
                                    className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary mt-1" 
                                    placeholder="Ej: Soldadura de tubería, cambio de rodamientos..." 
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-text-primary text-sm">Clasificación Peligro (GTC 45)</h4>
                                    <div className="mt-1">
                                        <SingleSelect 
                                            value={formData.peligroClasificacion || 'Condiciones de Seguridad'} 
                                            onChange={val => handleInputChange('peligroClasificacion', val)} 
                                            placeholder="Seleccione..." 
                                            options={[
                                                'Condiciones de Seguridad',
                                                'Biomecánico',
                                                'Físico',
                                                'Químico',
                                                'Psicosocial',
                                                'Biológico',
                                                'Fenómenos Naturales'
                                            ]} 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-text-primary text-sm">Severidad / Urgencia Percibida</h4>
                                    <div className="mt-1">
                                        <SingleSelect 
                                            value={formData.severidadPercibida || 'Media'} 
                                            onChange={val => handleInputChange('severidadPercibida', val)} 
                                            placeholder="Seleccione..." 
                                            options={['Baja', 'Media', 'Alta', 'Crítica']} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-text-primary text-sm">Peligros Identificados <span className="text-red-500">*</span></h4>
                                <textarea 
                                    rows={3} 
                                    value={formData.peligros} 
                                    onChange={e => handleInputChange('peligros', e.target.value)} 
                                    className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary mt-1" 
                                    placeholder="Describe los peligros y factores de riesgo..."
                                ></textarea>
                            </div>

                            <div>
                                <h4 className="font-semibold text-text-primary text-sm">Efectos Posibles en la Salud o Daños</h4>
                                <input 
                                    type="text" 
                                    value={formData.efectosPosibles || ''} 
                                    onChange={e => handleInputChange('efectosPosibles', e.target.value)} 
                                    className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary mt-1" 
                                    placeholder="Ej: Atrapamiento, heridas lacerantes, fracturas, fatiga..." 
                                />
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-text-primary text-sm">Controles Existentes</h4>
                                <textarea 
                                    rows={2} 
                                    value={formData.controlesExistentes} 
                                    onChange={e => handleInputChange('controlesExistentes', e.target.value)} 
                                    className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary mt-1" 
                                    placeholder="Ej: Uso de guantes, señalización..."
                                ></textarea>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium">¿Son suficientes los controles?</label>
                                <div className="w-32">
                                    <SingleSelect value={formData.suficientes ? 'Sí' : 'No'} onChange={val => handleInputChange('suficientes', val === 'Sí')} placeholder="Seleccione..." options={['Sí', 'No']} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border-medium">
                            <h4 className="font-semibold text-text-primary text-sm">Controles Sugeridos (Jerarquía de Control)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500">1. Eliminación / Sustitución</label>
                                    <textarea 
                                        rows={3} 
                                        placeholder="Ej: Eliminar uso de químicos tóxicos, herramienta automática..." 
                                        value={formData.sugeridoEliminacion || ''} 
                                        onChange={e => handleInputChange('sugeridoEliminacion', e.target.value)} 
                                        className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary"
                                    ></textarea>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500">2. Ingeniería</label>
                                    <textarea rows={3} placeholder="Ej: Guardas, sensores, ventilación..." value={formData.sugeridoIngenieria} onChange={e => handleInputChange('sugeridoIngenieria', e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary"></textarea>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500">3. Administrativos</label>
                                    <textarea rows={3} placeholder="Ej: Capacitación, señalización, rotación..." value={formData.sugeridoAdministrativo} onChange={e => handleInputChange('sugeridoAdministrativo', e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary"></textarea>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500">4. Elementos de Protección (EPP)</label>
                                    <textarea rows={3} placeholder="Ej: Casco, guantes, protección auditiva..." value={formData.sugeridoEPP} onChange={e => handleInputChange('sugeridoEPP', e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm bg-surface-primary text-text-primary"></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Evidencia Fotográfica */}
                        <div className="space-y-3 pt-4 border-t border-border-medium">
                            <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">Evidencia Fotográfica</h4>
                            <div className="flex flex-col md:flex-row gap-4 w-full">
                                {['foto1', 'foto2', 'foto3'].map((imgKey, index) => (
                                    <div key={imgKey} className="flex-1">
                                        {images[imgKey] ? (
                                            <div className="relative rounded-xl overflow-hidden border">
                                                <img src={images[imgKey] as string} alt={`Evidencia ${index + 1}`} className="w-full h-48 object-cover" />
                                                <button onClick={() => removeImage(imgKey)} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white shadow-md">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-teal-200 bg-teal-50/10 hover:bg-teal-50/30 transition-colors relative cursor-pointer group rounded-xl">
                                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(imgKey, e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                <Camera className="h-10 w-10 text-teal-600/50 group-hover:scale-110 transition-transform duration-300" />
                                                <div className="absolute bottom-4 text-xs font-semibold text-teal-700/60">Cargar Foto {index + 1}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Video Evidence */}
                        <div className="space-y-4 pt-4 border-t border-border-medium">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                                    <Film className="h-4 w-4 text-teal-600" /> Video de Evidencia Dinámica (Opcional)
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
                                            <p className="text-sm font-semibold text-text-primary">Sube evidencia dinámica en video</p>
                                            <p className="text-xs text-text-secondary mt-1">Permite a la IA validar comportamientos y condiciones en tiempo real</p>
                                        </div>
                                        <label className="group flex h-9 min-w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-3 shadow-md outline-none transition-all duration-300 hover:scale-105 active:scale-95">
                                            <div className="relative flex shrink-0 items-center justify-center">
                                                {isVideoUploading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Video className="h-4 w-4 text-white" />}
                                            </div>
                                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[180px] group-hover:opacity-100 sm:flex">
                                                <span className="text-xs font-bold tracking-wide">
                                                    {isVideoUploading ? 'Procesando...' : 'Seleccionar Video'}
                                                </span>
                                            </div>
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
                                            Evidencia de video lista para análisis multimodal
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional info with dictation */}
                        <div className="space-y-4 pt-4 border-t border-border-medium">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-teal-600" /> Notas adicionales del Analista (Opcional)
                                </h4>
                                <button
                                    type="button"
                                    onClick={handleVoiceInput}
                                    title={isListening ? 'Escuchando dictado...' : 'Activar Micrófono'}
                                    aria-label={isListening ? 'Escuchando dictado...' : 'Activar Micrófono'}
                                    className={`group flex h-8 min-w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-xl border px-2 shadow-sm outline-none transition-all duration-300 hover:scale-105 active:scale-95 sm:h-9 sm:min-w-[36px] sm:px-2.5 ${
                                        isListening
                                            ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                                            : 'bg-surface-secondary hover:bg-surface-hover text-text-primary border-border-light'
                                    }`}
                                >
                                    <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
                                        {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isListening ? 'bg-red-500' : 'bg-teal-600'}`}></span>
                                    </span>
                                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[160px] group-hover:opacity-100 sm:flex">
                                        <span className="text-xs font-bold tracking-wide">
                                            {isListening ? 'Escuchando...' : 'Activar Micrófono'}
                                        </span>
                                    </div>
                                </button>
                            </div>
                            <textarea
                                value={formData.actividadGlobal || ''}
                                onChange={e => {
                                    if (!isListening) {
                                        handleInputChange('actividadGlobal', e.target.value);
                                    }
                                }}
                                readOnly={isListening}
                                className={`w-full rounded-xl border-2 ${isListening ? 'border-solid border-red-300 bg-red-50/10 focus:border-red-400' : 'border-dashed border-teal-200 bg-teal-50/10 focus:bg-teal-50/20 focus:border-teal-400'} p-4 text-sm text-text-primary min-h-[120px] resize-y transition-colors focus:outline-none`}
                                placeholder="Notas internas sobre este hallazgo..."
                            />
                        </div>

                        {/* Bottom generate button */}
                        <div className="flex justify-center pt-4 gap-4">
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                title="Generar Análisis IA"
                                aria-label="Generar Análisis IA"
                                className="group flex h-9 min-w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-3 shadow-md shadow-orange-500/20 outline-none transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="relative flex shrink-0 items-center justify-center">
                                    {isGenerating ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                                    ) : (
                                        <Sparkles className="h-4 w-4 text-white" />
                                    )}
                                </div>
                                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                                    <span className="text-xs font-bold tracking-wide">
                                        {isGenerating ? 'Generando...' : 'Generar Análisis IA'}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Generated Report Editor */}
            <div ref={reportBoxRef}>
                <CollapsibleReportBox onSave={handleSave}
                        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                        isHistoryOpen={isHistoryOpen}
                    title="Participación IPEVR"
                    icon={<AlertTriangle className="h-5 w-5 text-teal-600" />}
                    actions={
                        <ExportDropdown
                            content={editorContentRef.current || generatedReport || ''}
                            fileName="Informe_ParticipacionIPEVR"
                            reportType="general"
                        />
                    }
                >
                    <div className="w-full min-w-0">
                        <LiveEditor
                            ref={liveEditorRef}
                            paperMode={true}
                            initialContent={generatedReport}
                            onUpdate={(html) => { editorContentRef.current = html; }}
                            reportSourceData={{ formData, trabajadoresList, responsablesList }}
                        />
                    </div>
                </CollapsibleReportBox>
            </div>
        
            {/* Upgrade Modal (Freemium Teaser) */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="relative max-w-sm w-full animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setShowUpgradeModal(false)} 
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md text-sm"
                        >
                            Cerrar ✕
                        </button>
                        <div className="bg-surface-primary rounded-3xl shadow-2xl overflow-hidden">
                            <UpgradeWall
                                title="Límite Gratuito Alcanzado"
                                description="Has alcanzado el límite para este módulo. Adquiere Premium para generar registros ilimitados."
                                plan="USER_IPEVAR"
                                isCompact={true}
                                hideFeatures={true}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Aprobación e Integración a Matriz IPEVR Oficial */}
            {showApplyModal && itemToApply && ReactDOM.createPortal(
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => !isApplyingToMatrix && setShowApplyModal(false)}
                >
                    <div
                        className="bg-surface-primary border border-border-medium rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border-medium flex items-center justify-between bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base text-text-primary">
                                        Aprobar e Integrar Peligro Ponderado a Matriz IPEVR Oficial
                                    </h3>
                                    <p className="text-xs text-text-secondary flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                                            {applyFormData.peligroClasificacion}
                                        </span>
                                        <span>• Cargo: <strong className="text-text-primary">{applyFormData.cargo || 'Personal'}</strong></span>
                                        <span>• Expuestos: <strong className="text-text-primary">{applyFormData.nro_expuestos || 1} colaboradores</strong></span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowApplyModal(false)}
                                disabled={isApplyingToMatrix}
                                className="p-1.5 text-text-tertiary hover:text-text-primary rounded-xl hover:bg-surface-hover transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Diagnóstico Inteligente de IA: Detección Automática de Matriz Oficial */}
                        <div className="px-6 py-3.5 border-b border-border-medium bg-gradient-to-r from-teal-50/80 via-emerald-50/50 to-teal-50/30 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-teal-950/10 shrink-0">
                            {isLoadingOfficialRows ? (
                                <div className="flex items-center gap-2.5 py-1 text-xs text-teal-700 dark:text-teal-300">
                                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                                    <span className="font-semibold">La IA está auditando las filas de la Matriz Oficial para cotejar coincidencias...</span>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide uppercase shadow-2xs border bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700">
                                                <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                                                {applyAction === 'update_existing' ? 'IA: Peligro Coincidente Detectado' : 'IA: Peligro Inédito Detectado'}
                                            </span>
                                            {aiMatchResult?.score > 0 && (
                                                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                                                    (Cotejo: {aiMatchResult.score}% similitud)
                                                </span>
                                            )}
                                        </div>

                                        {/* Alternador manual discreto por si el usuario desea forzar la acción opuesta */}
                                        <div className="flex items-center gap-1 bg-surface-primary/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-border-medium text-[11px]">
                                            <button
                                                type="button"
                                                onClick={() => setApplyAction('update_existing')}
                                                disabled={officialMatrixRows.length === 0}
                                                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                                    applyAction === 'update_existing'
                                                        ? 'bg-teal-600 text-white shadow-2xs'
                                                        : 'text-text-secondary hover:text-text-primary'
                                                }`}
                                                title="Complementar controles y sumar expuestos a fila existente"
                                            >
                                                Complementar Existente
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setApplyAction('create_new')}
                                                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                                    applyAction === 'create_new'
                                                        ? 'bg-teal-600 text-white shadow-2xs'
                                                        : 'text-text-secondary hover:text-text-primary'
                                                }`}
                                                title="Crear una nueva fila independiente en la matriz oficial"
                                            >
                                                Crear Fila Nueva
                                            </button>
                                        </div>
                                    </div>

                                    {/* Explicación de la acción automatizada */}
                                    <div className="text-xs text-text-secondary leading-relaxed bg-white/70 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-teal-100 dark:border-teal-900/50 flex items-start gap-2.5">
                                        <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                                        <div className="flex-1">
                                            {applyAction === 'update_existing' ? (
                                                <div>
                                                    <p className="font-semibold text-text-primary">
                                                        {aiMatchResult?.summary || 'Se integrará con la fila existente detectada en la Matriz Oficial.'}
                                                    </p>
                                                    <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5">
                                                        ✓ Se complementarán los controles existentes y se acumulará la población expuesta (+{applyFormData.nro_expuestos || 1} personas) sin duplicar filas.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="font-semibold text-text-primary">
                                                        {aiMatchResult?.summary || 'No se identificaron coincidencias previas para este peligro y cargo.'}
                                                    </p>
                                                    <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5">
                                                        ✓ Se creará una nueva fila técnica oficial en la Matriz IPEVR (GTC-45) con la valoración ponderada.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Body - Organizado por Columnas de la Matriz GTC-45 */}
                        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                            {applyAction === 'update_existing' && (
                                <div className="p-3.5 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-2xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block font-bold text-teal-900 dark:text-teal-200 text-xs">
                                            Fila Seleccionada de la Matriz Oficial para Complementar:
                                        </label>
                                        <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">
                                            {officialMatrixRows.length} filas analizadas en Matriz Oficial
                                        </span>
                                    </div>
                                    {isLoadingOfficialRows ? (
                                        <div className="flex items-center gap-2 text-teal-600 py-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Auditando filas de la matriz oficial...
                                        </div>
                                    ) : officialMatrixRows.length === 0 ? (
                                        <div className="text-gray-500 py-2">
                                            No se encontraron peligros en la matriz oficial. Se creará como nueva fila.
                                        </div>
                                    ) : (
                                        <select
                                            value={applyTargetRowId}
                                            onChange={e => setApplyTargetRowId(e.target.value)}
                                            className="w-full rounded-xl border border-teal-300 dark:border-teal-700 bg-surface-primary text-text-primary p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                                        >
                                            {officialMatrixRows.map(row => {
                                                const isAiPick = aiMatchResult?.bestMatchRow?.id === row.id;
                                                return (
                                                    <option key={row.id} value={row.id}>
                                                        {isAiPick ? '⭐ [IA SELECCIONADO] ' : ''}[{row.proceso || 'Proc.'} - {row.cargo ? `${row.cargo} - ` : ''}{row.zona || 'Zona'}] {row.peligro_clasificacion || 'Peligro'}: {row.peligro_descripcion ? row.peligro_descripcion.substring(0, 60) + '...' : row.tarea} (NR: {row.interpretacion_nr || row.nr || 'N/A'})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* BLOQUE 1: PROCESO, ZONA Y CARGO (Columnas 1-6 de la Matriz) */}
                            <div className="p-4 rounded-2xl border border-border-medium bg-surface-secondary/30 space-y-3">
                                <h4 className="font-black text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                                    1. Localización y Cargo Expuesto (Matriz GTC-45)
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-text-secondary text-[11px] uppercase mb-1">Proceso / Área</label>
                                        <input
                                            type="text"
                                            value={applyFormData.proceso}
                                            onChange={e => setApplyFormData({ ...applyFormData, proceso: e.target.value })}
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-text-secondary text-[11px] uppercase mb-1">Cargo / Puesto de Trabajo</label>
                                        <input
                                            type="text"
                                            value={applyFormData.cargo}
                                            onChange={e => setApplyFormData({ ...applyFormData, cargo: e.target.value })}
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-text-secondary text-[11px] uppercase mb-1">Zona / Sede / Lugar</label>
                                        <input
                                            type="text"
                                            value={applyFormData.zona}
                                            onChange={e => setApplyFormData({ ...applyFormData, zona: e.target.value })}
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-text-secondary text-[11px] uppercase mb-1">Actividad</label>
                                        <input
                                            type="text"
                                            value={applyFormData.actividad}
                                            onChange={e => setApplyFormData({ ...applyFormData, actividad: e.target.value })}
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <label className="block font-bold text-text-secondary text-[11px] uppercase mb-1">Tarea / Labor</label>
                                        <input
                                            type="text"
                                            value={applyFormData.tarea}
                                            onChange={e => setApplyFormData({ ...applyFormData, tarea: e.target.value })}
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-text-secondary text-[11px] uppercase mb-1">¿Rutinaria?</label>
                                        <select
                                            value={applyFormData.rutinaria}
                                            onChange={e => setApplyFormData({ ...applyFormData, rutinaria: e.target.value })}
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary font-bold"
                                        >
                                            <option value="Sí">Sí</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* BLOQUE 2: IDENTIFICACIÓN DEL PELIGRO Y EVALUACIÓN (Columnas 7-9 y ND/NC) */}
                            <div className="p-4 rounded-2xl border border-border-medium bg-surface-secondary/30 space-y-3">
                                <h4 className="font-black text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                    2. Identificación del Peligro y Consecuencias (GTC-45)
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-text-secondary text-[11px] uppercase mb-1">Clasificación del Peligro (GTC-45)</label>
                                        <select
                                            value={applyFormData.peligroClasificacion}
                                            onChange={e => setApplyFormData({ ...applyFormData, peligroClasificacion: e.target.value })}
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary font-bold"
                                        >
                                            <option value="Biomecánicos">Biomecánicos</option>
                                            <option value="Condiciones de Seguridad">Condiciones de Seguridad</option>
                                            <option value="Físico">Físico</option>
                                            <option value="Psicosociales">Psicosociales</option>
                                            <option value="Biológico">Biológico</option>
                                            <option value="Químico">Químico</option>
                                            <option value="Fenómenos Naturales">Fenómenos Naturales</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-text-secondary text-[11px] uppercase mb-1">Severidad Percibida / Nivel de Deficiencia</label>
                                        <select
                                            value={applyFormData.severidadPercibida}
                                            onChange={e => setApplyFormData({ ...applyFormData, severidadPercibida: e.target.value })}
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary font-bold"
                                        >
                                            <option value="Crítica">Crítica (ND:10, NC:60 -&gt; Nivel I No Aceptable)</option>
                                            <option value="Alta">Alta (ND:6, NC:25 -&gt; Nivel II Aceptable con Control Específico)</option>
                                            <option value="Media">Media (ND:6, NC:25 -&gt; Nivel II Aceptable con Control Específico)</option>
                                            <option value="Baja">Baja (ND:2, NC:10 -&gt; Nivel III Mejorable)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-text-secondary text-[11px] uppercase mb-1">Descripción del Peligro (Consolidado Colectivo)</label>
                                    <textarea
                                        rows={2}
                                        value={applyFormData.peligros}
                                        onChange={e => setApplyFormData({ ...applyFormData, peligros: e.target.value })}
                                        className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-text-secondary text-[11px] uppercase mb-1">Efectos Posibles en la Salud (Consecuencias)</label>
                                    <input
                                        type="text"
                                        value={applyFormData.efectosPosibles}
                                        onChange={e => setApplyFormData({ ...applyFormData, efectosPosibles: e.target.value })}
                                        className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
                                    />
                                </div>
                            </div>

                            {/* BLOQUE 3: CONTROLES EXISTENTES Y CRITERIOS (Columnas 10-12 y 16) */}
                            <div className="p-4 rounded-2xl border border-border-medium bg-surface-secondary/30 space-y-3">
                                <h4 className="font-black text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                                    3. Controles Existentes y Población Expuesta
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="block font-bold text-text-secondary text-[11px] uppercase mb-1">Controles Existentes (Fuente / Medio / Individuo)</label>
                                        <input
                                            type="text"
                                            value={applyFormData.controlesExistentes}
                                            onChange={e => setApplyFormData({ ...applyFormData, controlesExistentes: e.target.value })}
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-text-secondary text-[11px] uppercase mb-1">Nº Trabajadores Expuestos</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={applyFormData.nro_expuestos || 1}
                                            onChange={e => setApplyFormData({ ...applyFormData, nro_expuestos: e.target.value })}
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary font-mono font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* BLOQUE 4: MEDIDAS DE INTERVENCIÓN (Jerarquía GTC-45 - Columnas 19-23) */}
                            <div className="p-4 rounded-2xl border border-border-medium bg-surface-secondary/30 space-y-3">
                                <h4 className="font-black text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                    4. Medidas de Intervención Prioritarias (Jerarquía GTC-45)
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[10px] text-text-secondary font-bold uppercase block mb-1">1. Eliminación / Sustitución:</span>
                                        <input
                                            type="text"
                                            value={applyFormData.sugeridoEliminacion}
                                            onChange={e => setApplyFormData({ ...applyFormData, sugeridoEliminacion: e.target.value })}
                                            placeholder="No aplica o viable a largo plazo"
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase block mb-1">2. Control de Ingeniería (Propuesta de Colaboradores):</span>
                                        <input
                                            type="text"
                                            value={applyFormData.sugeridoIngenieria}
                                            onChange={e => setApplyFormData({ ...applyFormData, sugeridoIngenieria: e.target.value })}
                                            placeholder="Medidas de ingeniería y adecuación"
                                            className="w-full rounded-xl border border-teal-300 dark:border-teal-700 px-3 py-2 text-xs bg-surface-primary text-text-primary font-medium"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-text-secondary font-bold uppercase block mb-1">3. Controles Administrativos / PVE:</span>
                                        <input
                                            type="text"
                                            value={applyFormData.sugeridoAdministrativo}
                                            onChange={e => setApplyFormData({ ...applyFormData, sugeridoAdministrativo: e.target.value })}
                                            placeholder="Capacitaciones, rotación, PVE"
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-text-secondary font-bold uppercase block mb-1">4. Elementos de Protección Personal (EPP):</span>
                                        <input
                                            type="text"
                                            value={applyFormData.sugeridoEPP}
                                            onChange={e => setApplyFormData({ ...applyFormData, sugeridoEPP: e.target.value })}
                                            placeholder="Dotación y verificación de EPP"
                                            className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Banner Informativo */}
                            <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-2xl flex items-start gap-2.5 text-[11px] text-teal-900 dark:text-teal-200">
                                <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Efecto en SG-SST:</span> Este peligro ponderado se registrará en la <strong>Matriz IPEVR Oficial ({officialMatrixTitle})</strong> consolidando la representatividad de <strong>{applyFormData.nro_expuestos || 1} colaboradores</strong>. Los controles propuestos se sincronizarán como tareas al <strong>Centro de Control (Kanban)</strong>.
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-border-medium bg-surface-secondary/40 flex items-center justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowApplyModal(false)}
                                disabled={isApplyingToMatrix}
                                title="Cancelar"
                                className="group flex h-8 min-w-[32px] sm:h-9 sm:min-w-[36px] items-center justify-center rounded-xl border border-border-medium bg-surface-primary text-text-secondary hover:bg-surface-hover transition-all duration-300 px-2 sm:px-3 shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                <X className="w-4 h-4 shrink-0" />
                                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[80px] group-hover:opacity-100 sm:flex">
                                    <span className="text-xs font-semibold">Cancelar</span>
                                </div>
                                <span className="text-xs font-semibold ml-1.5 sm:hidden">Cancelar</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmApplyToMatrix}
                                disabled={isApplyingToMatrix || (applyAction === 'update_existing' && !applyTargetRowId)}
                                title="Aprobar e Integrar a Matriz IPEVR"
                                className="group flex h-8 min-w-[32px] sm:h-9 sm:min-w-[36px] items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md active:scale-95 transition-all duration-300 px-2.5 sm:px-3.5 disabled:opacity-50 cursor-pointer"
                            >
                                {isApplyingToMatrix ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                        <span className="text-xs font-bold ml-1.5">Integrando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 shrink-0" />
                                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[280px] group-hover:opacity-100 sm:flex">
                                            <span className="text-xs font-black">Aprobar e Integrar a Matriz IPEVR</span>
                                        </div>
                                        <span className="text-xs font-black ml-1.5 sm:hidden">Integrar a Matriz</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ParticipacionIPEVAR;
