import React, { useState, useEffect, useRef } from 'react';
import { useLocalize, useHasAccess, useAuthContext } from '~/hooks';
import useRolePermissions from '~/hooks/Roles/useRolePermissions';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import {
    ArrowLeft, Upload, MessageSquare, File, Trash2, Loader2, ChevronDown, ChevronRight, FolderOpen,
    FileText, Target, Stethoscope, Scale, Users, UserCircle, BarChart, Activity, AlertTriangle, ShieldAlert,
    ClipboardCheck, Briefcase, GitMerge, UserCheck
} from 'lucide-react';

import { OpenSidebar } from '~/components/Chat/Menus';
import { Button, useToastContext } from '@librechat/client';
import { useUploadFileMutation } from '~/data-provider';
import { useNavigate } from 'react-router-dom';
import { PHASE_CATEGORIES } from './constants';
import './sst-bit.css';
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
import MatrizPeligrosGTC45 from './MatrizPeligrosGTC45';
import ParticipacionIPEVAR from './ParticipacionIPEVAR';
import PerfilesCargo from './PerfilesCargo';
import DashboardPredictivo from './DashboardPredictivo';
import AltaDireccionChecklist from './AltaDireccionChecklist';


import ReglamentoHigiene from './ReglamentoHigiene';
import ReglamentoInterno from './ReglamentoInterno';
import PerfilSociodemografico from './PerfilSociodemografico';
import { UpgradeWall } from './UpgradeWall';

// Manual Icon Map to avoid dynamic import issues
const ICON_MAP: Record<string, React.ElementType> = {
    FileText, Target, Stethoscope, Scale,
    Users, UserCircle, BarChart, Activity,
    AlertTriangle, ShieldAlert, ClipboardCheck,
    Briefcase, GitMerge, FolderOpen, UserCheck
};


interface PhaseDetailProps {
    phase: {
        id: string;
        title: string;
        description: string;
        color: string;
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
            showToast({ message: 'Archivo subido correctamente', status: 'success' });

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

    const PHASE_RETRO: Record<string, { label: string; accent: string; bg: string }> = {
        plan:  { label: 'PLANEAR', accent: '#4ade80', bg: '#14532d' },
        do:    { label: 'HACER',   accent: '#fbbf24', bg: '#78350f' },
        check: { label: 'VERIFICAR', accent: '#f87171', bg: '#7f1d1d' },
        act:   { label: 'ACTUAR',  accent: '#c084fc', bg: '#4c1d95' },
    };
    const retro = PHASE_RETRO[phase.id] ?? { label: phase.title, accent: '#4ade80', bg: '#14532d' };

    return (
        <div className="flex flex-1 h-full w-full min-w-0 flex-col bg-[#0a0a0a] overflow-y-auto">
            {/* ── Retro Header ── */}
            <div className="border-b-4 border-white px-6 py-3 flex items-center justify-between gap-4"
                 style={{ backgroundColor: retro.bg }}>
                <div className="flex items-center gap-4">
                    {!navVisible && (
                        <div className="mr-2 hidden md:block shrink-0">
                            <OpenSidebar setNavVisible={setNavVisible} />
                        </div>
                    )}
                    <button
                        onClick={onBack}
                        className="pixel-btn bg-black border-white text-white"
                        style={{ borderColor: retro.accent, color: retro.accent }}
                        aria-label="Back"
                    >◄ EXIT</button>
                    <div>
                        <h2 className="font-pixel uppercase" style={{ color: retro.accent, fontSize: '12px' }}>
                            ☘ {retro.label} BOARD
                        </h2>
                        <p className="font-pixel text-white mt-1" style={{ fontSize: '6px', opacity: 0.7 }}>
                            {categories.length} QUESTS AVAILABLE
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleChat}
                    className="pixel-btn text-black"
                    style={{ backgroundColor: retro.accent }}
                >
                    ► CHAT SST
                </button>
            </div>

            {/* Hidden file input */}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect}
                className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" />

            {/* ─── Quest List ─── */}
            <div className="flex-1 w-full overflow-y-scroll space-y-3 p-6">
                {categories.filter(c => isAdmin || !disabledApps.includes(c.id)).length === 0 ? (
                    <div className="pixel-box p-8 text-center">
                        <span className="font-pixel text-green-400 text-xs">NO QUESTS AVAILABLE</span>
                    </div>
                ) : (
                    categories
                        .filter(category => isAdmin || !disabledApps.includes(category.id))
                        .map((category, idx) => {
                        const categoryFiles = files.filter(f => f.category === category.id);
                        const isExpanded = expandedCategories.includes(category.id);
                        const isThisUploading = isUploading === category.id;
                        const isDisabled = disabledApps.includes(category.id);

                        return (
                            <div key={category.id} className="pixel-box overflow-hidden" style={{ borderColor: isExpanded ? retro.accent : '#374151' }}>
                                {/* Quest Header */}
                                <div
                                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: isExpanded ? retro.bg : '#111827' }}
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-pixel text-[8px]" style={{ color: retro.accent }}>
                                            {isExpanded ? '▼' : '►'}
                                        </span>
                                        <span className="font-pixel text-[8px]" style={{ color: retro.accent }}>
                                            #{String(idx+1).padStart(2,'0')}
                                        </span>
                                        <span className="font-pixel text-white uppercase" style={{ fontSize:'8px' }}>
                                            {category.title}
                                        </span>
                                        {categoryFiles.length > 0 && (
                                            <span className="font-pixel text-[6px] px-2 py-0.5 border"
                                                  style={{ color: retro.accent, borderColor: retro.accent }}>
                                                {categoryFiles.length} DOC
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isAdmin && (
                                            <div
                                                className="flex items-center cursor-pointer gap-1"
                                                onClick={(e) => handleToggleApp(category.id, e)}
                                                title={isDisabled ? 'Oculto — clic para mostrar' : 'Visible — clic para ocultar'}
                                            >
                                                <div className={`w-6 h-3 border border-white relative ${isDisabled ? 'bg-gray-700' : 'bg-green-700'}`}>
                                                    <div className={`absolute top-0.5 w-2 h-2 bg-white transition-all ${isDisabled ? 'left-0.5' : 'left-3'}`} />
                                                </div>
                                                <span className="font-pixel text-[6px]" style={{ color: isDisabled ? '#6b7280' : '#4ade80' }}>
                                                    {isDisabled ? 'OFF' : 'ON'}
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleUploadClick(category.id); }}
                                            disabled={!!isUploading}
                                            className="pixel-btn text-[7px] py-1"
                                            style={{ backgroundColor: retro.bg, color: retro.accent, borderColor: retro.accent }}
                                        >
                                            {isThisUploading ? '...' : '↑ UPLOAD'}
                                        </button>
                                    </div>
                                </div>

                                {/* Quest Content */}
                                {isExpanded && (
                                    <div className="p-4 border-t-4" style={{ borderColor: retro.accent, backgroundColor: '#0d0d0d' }}>
                                        {!hasAccessToSGSST ? (
                                            <UpgradeWall
                                                plan="USER_PLUS"
                                                planBTitle="Plan Pro"
                                                planBItems={[
                                                    '**Agente Matriz IPEVAR**',
                                                    'Todo lo del plan Plus',
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

                                                {/* Show MatrizPeligrosGTC45 for peligros category */}
                                                {category.id === 'peligros' && (
                                                    <div className="mb-6">
                                                        <MatrizPeligrosGTC45 />
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
                                                 
                                                 {/* Show DashboardPredictivo for predictivo category */}
                                                 {category.id === 'predictivo' && (
                                                     <div className="mb-6">
                                                         <DashboardPredictivo />
                                                     </div>
                                                 )}
                                                 {categoryFiles.length === 0 ? (
                                                    <div className="pixel-box flex flex-col items-center justify-center py-6 mt-4"
                                                         style={{ borderColor: '#374151' }}>
                                                        <span className="font-pixel text-[8px] text-gray-600">&#9632; NO FILES &#9632;</span>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
                                                        {categoryFiles.map((file) => (
                                                            <div
                                                                key={file.file_id}
                                                                className="group relative pixel-box flex items-center gap-2 p-2"
                                                                style={{ borderColor: retro.accent, backgroundColor: '#111' }}
                                                            >
                                                                <span className="font-pixel text-[8px]" style={{ color: retro.accent }}>&#9633;</span>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="font-pixel text-white truncate" style={{ fontSize:'6px' }} title={file.name}>
                                                                        {file.name}
                                                                    </p>
                                                                    <p className="font-pixel text-gray-500" style={{ fontSize:'5px' }}>
                                                                        {file.size ? (file.size / 1024).toFixed(1) + ' KB' : '?KB'}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(file.file_id); }}
                                                                    className="font-pixel text-red-500 opacity-0 group-hover:opacity-100 transition-all text-[10px]"
                                                                >
                                                                    &#215;
                                                                </button>
                                                            </div>
                                                        ))}
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
            </div>
        </div>
    );
};

export default PhaseDetail;
