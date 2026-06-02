import React, { useState, useEffect, useRef } from 'react';
import { useLocalize, useHasAccess, useAuthContext } from '~/hooks';
import useRolePermissions from '~/hooks/Roles/useRolePermissions';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import {
    ArrowLeft, Upload, MessageSquare, File, Trash2, Loader2, ChevronDown, ChevronRight, FolderOpen,
    FileText, Target, Stethoscope, Scale, Users, UserCircle, BarChart, Activity, AlertTriangle, ShieldAlert,
    ClipboardCheck, Briefcase, GitMerge, UserCheck, BrainCircuit, Blocks
} from 'lucide-react';

import { OpenSidebar } from '~/components/Chat/Menus';
import { Button, useToastContext } from '@librechat/client';
import { useUploadFileMutation } from '~/data-provider';
import { useNavigate } from 'react-router-dom';
import { PHASE_CATEGORIES } from './constants';
import DiagnosticoChecklist from './DiagnosticoChecklist';
import PoliticaSST from './PoliticaSST';
import ResponsableSGSST from './ResponsableSGSST';
import ObjetivosSST from './ObjetivosSST';

import AuditoriaChecklist from './AuditoriaChecklist';
import MatrizLegal from './MatrizLegal';
import EstadisticasATEL from './EstadisticasATEL';
import InvestigacionATEL from './InvestigacionATEL';
import PermisoAlturas from './PermisoAlturas';
import ReporteActosCondiciones from './ReporteActosCondiciones';
import AnalisisTrabajoSeguro from './AnalisisTrabajoSeguro';
import MetodoOwas from './MetodoOwas';
import AnalisisVulnerabilidad from './AnalisisVulnerabilidad';
import BioIndividualHub from './BioIndividualHub';
import ParticipacionIPEVAR from './ParticipacionIPEVAR';
import PerfilesCargo from './PerfilesCargo';
import DashboardPredictivo from './DashboardPredictivo';
import AltaDireccionChecklist from './AltaDireccionChecklist';
import ProgramaCapacitaciones from './ProgramaCapacitaciones';

import ReglamentoHigiene from './ReglamentoHigiene';
import ReglamentoInterno from './ReglamentoInterno';
import PerfilSociodemografico from './PerfilSociodemografico';
import CondicionesSalud from './CondicionesSalud';
import OraculoPredictivoH1 from './OraculoPredictivoH1';
import AppBuilder from './AppBuilder';
import InspeccionTrabajoH1 from './InspeccionTrabajoH1';
import HtmlSandboxApp from './HtmlSandboxApp';
import { UpgradeWall } from './UpgradeWall';

// Manual Icon Map to avoid dynamic import issues
const ICON_MAP: Record<string, React.ElementType> = {
    FileText, Target, Stethoscope, Scale,
    Users, UserCircle, BarChart, Activity,
    AlertTriangle, ShieldAlert, ClipboardCheck,
    Briefcase, GitMerge, FolderOpen, UserCheck,
    BrainCircuit, Blocks
};


interface PhaseDetailProps {
    phase: {
        id: string;
        title: string;
        description: string;
        extendedPhilosophy?: string;
        color: string;
        accent?: string;
        bgGlow?: string;
    };
    onBack: () => void;
    navVisible: boolean;
    setNavVisible: React.Dispatch<React.SetStateAction<boolean>>;
    autoOpenModule?: string;
}

const PhaseDetail = ({ phase, onBack, navVisible, setNavVisible, autoOpenModule }: PhaseDetailProps) => {
    const localize = useLocalize();
    const navigate = useNavigate();
    const { showToast } = useToastContext();
    const { user, token } = useAuthContext();
    const [files, setFiles] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState<string | null>(null); // Stores category ID being uploaded to
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]); // Track expanded categories
    const fileInputRef = useRef<HTMLInputElement>(null);
    const selectedCategoryRef = useRef<string | null>(null);

    const [disabledApps, setDisabledApps] = useState<string[]>([]);
    const isAdmin = user?.role === 'ADMIN';
    const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

    // Listen for LiveEditor fullscreen events to neutralize clipping ancestors
    useEffect(() => {
        const enter = () => setIsEditorFullscreen(true);
        const exit = () => setIsEditorFullscreen(false);
        window.addEventListener('live-editor-fullscreen-enter', enter);
        window.addEventListener('live-editor-fullscreen-exit', exit);
        return () => {
            window.removeEventListener('live-editor-fullscreen-enter', enter);
            window.removeEventListener('live-editor-fullscreen-exit', exit);
        };
    }, []);

    useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/config', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data && Array.isArray(data.disabledApps)) {
                    setDisabledApps(data.disabledApps);
                }
            }).catch(console.error);
    }, [token]);

    // Auto-open inbox when navigating from a notification
    useEffect(() => {
        if (autoOpenModule) {
            // Dispatch after a short delay to let the component render
            const timer = setTimeout(() => {
                window.dispatchEvent(new CustomEvent('sgsst-open-inbox', { detail: { module: autoOpenModule } }));
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [autoOpenModule]);

    const handleToggleApp = async (categoryId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAdmin) return;

        const currentlyDisabled = disabledApps.includes(categoryId);
        const newDisabledStatus = !currentlyDisabled;

        setDisabledApps(prev => 
            newDisabledStatus 
                ? [...prev, categoryId] 
                : prev.filter(id => id !== categoryId)
        );

        try {
            const res = await fetch('/api/sgsst/config/toggle', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ appId: categoryId, disabled: newDisabledStatus })
            });
            if (!res.ok) throw new Error('Request error');
        } catch(err) {
            console.error(err);
            setDisabledApps(prev => 
                !newDisabledStatus 
                    ? [...prev, categoryId] 
                    : prev.filter(id => id !== categoryId)
            );
        }
    };

    const storageKey = `sgsst_files_${phase.id}`;

    // Get categories for this phase
    const categories = PHASE_CATEGORIES[phase.id as keyof typeof PHASE_CATEGORIES] || [];

    const { hasPermission } = useRolePermissions();
    const hasAccessToSGSST = useHasAccess({
        permissionType: PermissionTypes.SGSST,
        permission: Permissions.USE,
    }) && hasPermission(PermissionTypes.SGSST);

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                setFiles(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved files', e);
            }
        }
        // Initialize all categories as expanded by default
        // if (categories.length > 0) {
        //     setExpandedCategories(categories.map(c => c.id));
        // }
        setExpandedCategories([]);
    }, [phase.id, storageKey]);

    const saveFiles = (newFiles: any[]) => {
        setFiles(newFiles);
        localStorage.setItem(storageKey, JSON.stringify(newFiles));
    };

    const uploadMutation = useUploadFileMutation({
        onSuccess: (data) => {
            setIsUploading(null);
            showToast({ message: 'Archivo subido correctamente', status: 'success', severity: 'success' });

            const newFile = {
                file_id: data.file_id,
                name: data.filename,
                size: data.bytes || 0,
                filepath: data.filepath,
                type: data.type,
                category: selectedCategoryRef.current || 'uncategorized',
            };

            saveFiles([...files, newFile]);
            selectedCategoryRef.current = null;
        },
        onError: (error) => {
            setIsUploading(null);
            console.error('Upload failed', error);
            showToast({ message: 'Error al subir archivo', status: 'error' });
            selectedCategoryRef.current = null;
        }
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedCategoryRef.current) {
            const file = e.target.files[0];
            setIsUploading(selectedCategoryRef.current);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('endpoint', 'default');
            formData.append('file_id', crypto.randomUUID());
            // formData.append('width', '0'); // Removed to avoid triggering uploadImage
            // formData.append('height', '0'); // Removed to avoid triggering uploadImage
            formData.append('version', '1');

            // Metadata including category
            // Note: Server might not persist extra fields in all implementations, 
            // but we store it locally in `files` state anyway.
            formData.append('sgsst_phase', phase.id);
            formData.append('sgsst_category', selectedCategoryRef.current);

            uploadMutation.mutate(formData);

            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUploadClick = (categoryId: string) => {
        selectedCategoryRef.current = categoryId;
        fileInputRef.current?.click();
    };

    const handleDelete = (fileId: string) => {
        const newFiles = files.filter(f => f.file_id !== fileId);
        saveFiles(newFiles);
    };

    const handleChat = () => {
        navigate('/c/new', { state: { sgsstContext: { phase: phase.title, files } } });
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(c => c !== categoryId)
                : [...prev, categoryId]
        );
    };

    // Helper to render icon dynamically
    const renderIcon = (iconName: string) => {
        const IconComponent = ICON_MAP[iconName] || FolderOpen;
        return <IconComponent className="h-5 w-5" />;
    };

    return (
        <div className={`flex flex-1 h-full w-full min-w-0 flex-col bg-surface-primary overflow-y-auto`}>
            {/* Organic Background Blob — NO transform to avoid breaking position:fixed */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M47.7,-67.2C61.4,-57.1,71.5,-41.8,78.2,-24.5C84.9,-7.2,88.2,12.1,81.3,28.8C74.4,45.5,57.3,59.6,39.6,68.4C21.9,77.2,3.6,80.7,-14.2,78.7C-32,76.7,-49.3,69.2,-64.1,56.5C-78.9,43.8,-91.2,25.9,-93.8,6.8C-96.4,-12.3,-89.3,-32.6,-76.3,-48.1C-63.3,-63.6,-44.4,-74.3,-26.8,-76.6C-9.2,-78.9,7.1,-72.8,22.8,-71.8C38.5,-70.8,34,-77.3,47.7,-67.2Z" transform="translate(100 100)" />
                </svg>
            </div>

            {/* Header Section */}
            <div className="relative z-10 px-6 pt-10 pb-6 w-full flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    {!navVisible && (
                        <div className="hidden md:block shrink-0">
                            <OpenSidebar setNavVisible={setNavVisible} />
                        </div>
                    )}
                    <button
                        onClick={onBack}
                        className="rounded-2xl p-3 bg-surface-secondary border border-border-light dark:border-white/5 hover:bg-surface-tertiary transition-all shadow-sm hover:shadow-md hover:-translate-x-1"
                        aria-label="Back"
                    >
                        <ArrowLeft className="h-6 w-6 text-text-primary" />
                    </button>
                </div>
                
                <div className="flex-1 w-full md:w-auto">
                    <h2 className="text-4xl sm:text-5xl font-black text-text-primary tracking-tighter drop-shadow-sm">{phase.title}</h2>
                </div>

                {/* Hidden global input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                />
            </div>

            <div className="flex-1 w-full overflow-y-auto space-y-8 px-6 pb-20 relative z-10 scroll-smooth">
                {/* Context & Description (Scrolls with the page) */}
                <div className="flex flex-col gap-4 mb-2 max-w-4xl">
                    <p className="text-base sm:text-lg text-text-secondary leading-relaxed font-medium">{phase.description}</p>
                    {(phase as any).extendedPhilosophy && (
                        <div className="mt-2 p-5 rounded-3xl bg-surface-secondary/40 border border-white/10 dark:border-white/5 backdrop-blur-md relative overflow-hidden group shadow-sm">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-teal-400 to-emerald-500 rounded-l-3xl"></div>
                            <p className="text-sm font-medium text-text-primary/80 italic leading-relaxed pl-3 relative z-10">"{((phase as any).extendedPhilosophy)}"</p>
                        </div>
                    )}
                </div>
                {categories.filter(c => isAdmin || !disabledApps.includes(c.id)).length === 0 ? (
                    <div className="p-8 text-center text-text-secondary">
                        No hay categorías disponibles para esta fase.
                    </div>
                ) : (
                    categories
                        .filter(category => isAdmin || !disabledApps.includes(category.id))
                        .map((category) => {
                        const categoryFiles = files.filter(f => f.category === category.id);
                        const isExpanded = expandedCategories.includes(category.id);
                        const isThisUploading = isUploading === category.id;

                        return (
                            <div key={category.id} className="w-full min-w-0 rounded-[2rem] border border-border-light dark:border-white/5 bg-white/60 dark:bg-[#1a1a1a]/60 transition-all duration-500 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                                {/* Category Header */}
                                <div
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 md:p-7 cursor-pointer hover:bg-surface-secondary/50 dark:hover:bg-white-[0.02] transition-colors gap-5"
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 rounded-2xl bg-surface-secondary shadow-inner border border-white/20 dark:border-white/5 text-text-primary">
                                            {renderIcon(category.icon)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight text-text-primary mb-1">{category.title}</h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                        {isAdmin && (
                                            <div 
                                                className="flex items-center bg-surface-secondary/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border-light dark:border-white/10 hover:bg-surface-tertiary transition-all shadow-sm"
                                                onClick={(e) => handleToggleApp(category.id, e)}
                                                title={disabledApps.includes(category.id) ? "Aplicativo Oculto: Clic para mostrar" : "Aplicativo Visible: Clic para ocultar"}
                                            >
                                                <div className="relative inline-flex items-center cursor-pointer my-1 mx-1">
                                                    <div className={`w-9 h-5 rounded-full transition-colors ${!disabledApps.includes(category.id) ? 'bg-teal-500' : 'bg-surface-tertiary border border-border-medium'}`}></div>
                                                    <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow-md transition-transform ${!disabledApps.includes(category.id) ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                </div>
                                                <span className={`ml-2 text-[10px] font-black uppercase tracking-wider ${!disabledApps.includes(category.id) ? 'text-teal-600 dark:text-teal-400' : 'text-text-secondary text-opacity-50'}`}>
                                                    {!disabledApps.includes(category.id) ? 'ACTIVO' : 'INACT.'}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center justify-center h-10 w-10 text-text-secondary bg-surface-secondary/50 hover:bg-surface-secondary rounded-full border border-border-light dark:border-white/5 transition-all">
                                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Category Content */}
                                {isExpanded && (
                                    <div className="px-5 md:px-7 pb-7 pt-5 border-t border-border-light dark:border-white/5 bg-gradient-to-b from-surface-secondary/10 to-transparent">
                                        {/* Bio Rationale y Normatividad */}
                                        {(category as any).bioRationale && (
                                            <div className="mb-6 bg-surface-primary/60 dark:bg-black/20 rounded-2xl p-5 border border-border-light dark:border-white/5 shadow-inner">
                                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                    <div className="flex-1">
                                                        <h4 className="text-[11px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                            <Activity className="w-3.5 h-3.5" /> Visión del Bioindividuo
                                                        </h4>
                                                        <p className="text-sm font-medium text-text-primary/90 leading-relaxed">
                                                            {(category as any).bioRationale}
                                                        </p>
                                                    </div>
                                                    

                                                </div>
                                            </div>
                                        )}

                                        {!hasAccessToSGSST ? (
                                            <UpgradeWall
                                                plan="USER_PLUS"
                                                planBTitle="Plan Pro"
                                                planBItems={[
                                                    'Somos SST',
                                                    'Chat con IA',
                                                    'Conversaciones ilimitadas',
                                                    '+ de 15 Agentes Expertos en SST',
                                                    '**Agente Matriz IPEVAR**',
                                                    'Aula de estudio',
                                                    'Blog WAPPY',
                                                    'Análisis en Vivo',
                                                    'Centro de Inteligencia Predictiva',
                                                    'Crea tus propios Agentes de IA',
                                                    'Editor de Archivos con IA',
                                                    'Acceso anticipado a nuevas funciones',
                                                ]}
                                            />
                                        ) : (
                                            <>
                                                {/* Show DiagnosticoChecklist for diagnostico category */}
                                                {category.id === 'diagnostico' && (
                                                    <div className="mb-6">
                                                        <DiagnosticoChecklist />
                                                    </div>
                                                )}

                                                {/* Show ResponsableSGSST for responsable category */}
                                                {category.id === 'responsable' && (
                                                    <div className="mb-6">
                                                        <ResponsableSGSST />
                                                    </div>
                                                )}

                                                {/* Show PoliticaSST for politica category */}

                                                {category.id === 'politica' && (
                                                    <div className="mb-6">
                                                        <PoliticaSST />
                                                    </div>
                                                )}

                                                {/* Show ObjetivosSST for objetivos category */}
                                                {category.id === 'objetivos' && (
                                                    <div className="mb-6">
                                                        <ObjetivosSST />
                                                    </div>
                                                )}

                                                {/* Show AuditoriaChecklist for auditoria category */}
                                                {category.id === 'auditoria' && (
                                                    <div className="mb-6">
                                                        <AuditoriaChecklist />
                                                    </div>
                                                )}

                                                {/* Show MatrizLegal for legal category */}
                                                {category.id === 'legal' && (
                                                    <div className="mb-6">
                                                        <MatrizLegal />
                                                    </div>
                                                )}

                                                {/* Show EstadisticasATEL for estadisticas category */}
                                                {category.id === 'estadisticas' && (
                                                    <div className="mb-6">
                                                        <EstadisticasATEL />
                                                    </div>
                                                )}

                                                {/* Show InvestigacionATEL for investigacion_atel category */}
                                                {category.id === 'investigacion_atel' && (
                                                    <div className="mb-6">
                                                        <InvestigacionATEL />
                                                    </div>
                                                )}

                                                {/* IPEVAR Bio-Individuales: Hub centralizado */}
                                                {category.id === 'peligros' && (
                                                    <div className="mb-6">
                                                        <BioIndividualHub />
                                                    </div>
                                                )}

                                                {/* Show MetodoOwas for metodo_owas category */}
                                                {category.id === 'metodo_owas' && (
                                                    <div className="mb-6">
                                                        <MetodoOwas />
                                                    </div>
                                                )}

                                                {/* Show AnalisisTrabajoSeguro for analisis_trabajo_seguro category */}
                                                {category.id === 'analisis_trabajo_seguro' && (
                                                    <div className="mb-6">
                                                        <AnalisisTrabajoSeguro />
                                                    </div>
                                                )}

                                                {/* Show ReporteActosCondiciones for reporte_actos category */}
                                                {category.id === 'reporte_actos' && (
                                                    <div className="mb-6">
                                                        <ReporteActosCondiciones />
                                                    </div>
                                                )}

                                                {/* Show PermisoAlturas for permiso_alturas category */}
                                                {category.id === 'permiso_alturas' && (
                                                    <div className="mb-6">
                                                        <PermisoAlturas />
                                                    </div>
                                                )}

                                                {/* Show ParticipacionIPEVAR for participacion_ipevar category */}
                                                {category.id === 'participacion_ipevar' && (
                                                    <div className="mb-6">
                                                        <ParticipacionIPEVAR />
                                                    </div>
                                                )}

                                                {/* Show ReglamentoHigiene for rhs category */}
                                                {category.id === 'rhs' && (
                                                    <div className="mb-6">
                                                        <ReglamentoHigiene />
                                                    </div>
                                                )}

                                                {/* Show ReglamentoInterno for rit category */}
                                                {category.id === 'rit' && (
                                                    <div className="mb-6">
                                                        <ReglamentoInterno />
                                                    </div>
                                                )}

                                                {/* Show AltaDireccionChecklist for alta_direccion category */}
                                                {category.id === 'alta_direccion' && (
                                                    <div className="mb-6">
                                                        <AltaDireccionChecklist />
                                                    </div>
                                                )}

                                                {/* Show PerfilSociodemografico for perfil_socio category */}
                                                {category.id === 'perfil_socio' && (
                                                    <div className="mb-6">
                                                        <PerfilSociodemografico />
                                                    </div>
                                                )}

                                                {/* Show CondicionesSalud for condiciones_salud category */}
                                                {category.id === 'condiciones_salud' && (
                                                    <div className="mb-6">
                                                        <CondicionesSalud />
                                                    </div>
                                                )}

                                                {/* Show OraculoPredictivoH1 for oraculo_predictivo category */}
                                                {category.id === 'oraculo_predictivo' && (
                                                    <div className="mb-6">
                                                        <OraculoPredictivoH1 />
                                                    </div>
                                                )}

                                                {/* Show PerfilesCargo for perfil_cargo category */}
                                                {category.id === 'perfil_cargo' && (
                                                    <div className="mb-6">
                                                        <PerfilesCargo />
                                                    </div>
                                                )}

                                                 {/* Show AnalisisVulnerabilidad for vulnerabilidad category */}
                                                 {category.id === 'vulnerabilidad' && (
                                                     <div className="mb-6">
                                                         <AnalisisVulnerabilidad />
                                                     </div>
                                                 )}

                                                 {/* Show ProgramaCapacitaciones for capacitaciones category */}
                                                 {category.id === 'capacitaciones' && (
                                                     <div className="mb-6">
                                                         <ProgramaCapacitaciones />
                                                     </div>
                                                 )}
                                                 
                                                 {/* Show DashboardPredictivo for predictivo category */}
                                                 {category.id === 'predictivo' && (
                                                     <div className="mb-6">
                                                         <DashboardPredictivo />
                                                     </div>
                                                 )}


                                                 {/* Show AppBuilder for app_builder category */}
                                                 {category.id === 'app_builder' && (
                                                     <div className="mb-6">
                                                         <AppBuilder />
                                                     </div>
                                                 )}

                                                 {/* Show InspeccionTrabajoH1 for inspeccion_trabajo category */}
                                                 {category.id === 'inspeccion_trabajo' && (
                                                     <div className="mb-6">
                                                         <InspeccionTrabajoH1 />
                                                     </div>
                                                 )}


                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {/* Interactive HTML Sandbox Apps Collapsible Card */}
                {['planear', 'hacer', 'verificar', 'actuar', 'fase1', 'fase2'].includes(phase.id) && (isAdmin || !disabledApps.includes('custom_html_sandbox')) && (
                    <div className="w-full min-w-0 rounded-[2rem] border border-border-light dark:border-white/5 bg-white/60 dark:bg-[#1a1a1a]/60 transition-all duration-500 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                        {/* Category Header */}
                        <div
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 md:p-7 cursor-pointer hover:bg-surface-secondary/50 dark:hover:bg-white-[0.02] transition-colors gap-5"
                            onClick={() => toggleCategory('custom_html_sandbox')}
                        >
                            <div className="flex items-center gap-5">
                                <div className="p-4 rounded-2xl bg-surface-secondary shadow-inner border border-white/20 dark:border-white/5 text-text-primary">
                                    <Blocks className="h-5 w-5 text-teal-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight text-text-primary mb-1">Aplicativos Personalizados HTML</h3>
                                    <p className="text-xs font-semibold text-text-secondary">Monta, duplica y edita tus propios HTML interactivos con sincronización en la nube</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                {isAdmin && (
                                    <div 
                                        className="flex items-center bg-surface-secondary/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border-light dark:border-white/10 hover:bg-surface-tertiary transition-all shadow-sm"
                                        onClick={(e) => handleToggleApp('custom_html_sandbox', e)}
                                        title={disabledApps.includes('custom_html_sandbox') ? "Aplicativo Oculto: Clic para mostrar" : "Aplicativo Visible: Clic para ocultar"}
                                    >
                                        <div className="relative inline-flex items-center cursor-pointer my-1 mx-1">
                                            <div className={`w-9 h-5 rounded-full transition-colors ${!disabledApps.includes('custom_html_sandbox') ? 'bg-teal-500' : 'bg-surface-tertiary border border-border-medium'}`}></div>
                                            <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow-md transition-transform ${!disabledApps.includes('custom_html_sandbox') ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </div>
                                        <span className={`ml-2 text-[10px] font-black uppercase tracking-wider ${!disabledApps.includes('custom_html_sandbox') ? 'text-teal-600 dark:text-teal-400' : 'text-text-secondary text-opacity-50'}`}>
                                            {!disabledApps.includes('custom_html_sandbox') ? 'ACTIVO' : 'INACT.'}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-center h-10 w-10 text-text-secondary bg-surface-secondary/50 hover:bg-surface-secondary rounded-full border border-border-light dark:border-white/5 transition-all">
                                    {expandedCategories.includes('custom_html_sandbox') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                </div>
                            </div>
                        </div>

                        {/* Category Content */}
                        {expandedCategories.includes('custom_html_sandbox') && (
                            <div className="px-5 md:px-7 pb-7 pt-5 border-t border-border-light dark:border-white/5 bg-gradient-to-b from-surface-secondary/10 to-transparent">
                                {!hasAccessToSGSST ? (
                                    <UpgradeWall
                                        plan="USER_PLUS"
                                        planBTitle="Plan Pro"
                                        planBItems={[
                                            'Somos SST',
                                            'Chat con IA',
                                            'Conversaciones ilimitadas',
                                            '+ de 15 Agentes Expertos en SST',
                                            '**Agente Matriz IPEVAR**',
                                            'Aula de estudio',
                                            'Blog WAPPY',
                                            'Análisis en Vivo',
                                            'Centro de Inteligencia Predictiva',
                                            'Crea tus propios Agentes de IA',
                                            'Editor de Archivos con IA',
                                            'Acceso anticipado a nuevas funciones',
                                        ]}
                                    />
                                ) : (
                                    <HtmlSandboxApp phaseId={phase.id} phaseTitle={phase.title} />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhaseDetail;
