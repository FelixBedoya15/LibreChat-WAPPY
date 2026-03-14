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
}

const PhaseDetail = ({ phase, onBack, navVisible, setNavVisible }: PhaseDetailProps) => {
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

    return (
        <div className="flex h-full w-full flex-col bg-surface-primary p-6">
            <div className="mb-6 flex items-center gap-4 border-b border-border-medium pb-4">
                {!navVisible && (
                    <div className="mr-2 hidden md:block shrink-0">
                        <OpenSidebar setNavVisible={setNavVisible} />
                    </div>
                )}
                <button
                    onClick={onBack}
                    className="rounded-full p-2 hover:bg-surface-tertiary transition-colors"
                    aria-label="Back"
                >
                    <ArrowLeft className="h-6 w-6 text-text-primary" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">{phase.title}</h2>
                    <p className="text-sm text-text-secondary">{phase.description}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <button
                        onClick={handleChat}
                        className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm"
                    >
                        <MessageSquare className="h-5 w-5" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                            Chatea con SG-SST
                        </span>
                    </button>
                </div>

                {/* Hidden global input, triggered by specific category buttons */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
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
                            <div key={category.id} className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden transition-all duration-200">
                                {/* Category Header */}
                                <div
                                    className="flex items-center justify-between p-4 bg-surface-tertiary/50 cursor-pointer hover:bg-surface-tertiary transition-colors"
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-text-secondary">
                                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                        </div>
                                        <div className="p-2 rounded-lg bg-surface-primary text-teal-600 dark:text-teal-400">
                                            {renderIcon(category.icon)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-text-primary">{category.title}</h3>
                                            <p className="text-xs text-text-secondary">{categoryFiles.length} documentos</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isAdmin && (
                                            <div 
                                                className="flex items-center bg-surface-primary px-3 py-1 rounded-full border border-border-medium hover:bg-surface-tertiary transition-colors"
                                                onClick={(e) => handleToggleApp(category.id, e)}
                                                title={disabledApps.includes(category.id) ? "Aplicativo Oculto: Clic para mostrar" : "Aplicativo Visible: Clic para ocultar"}
                                            >
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <div className={`w-8 h-4 rounded-full transition-colors ${!disabledApps.includes(category.id) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                    <div className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${!disabledApps.includes(category.id) ? 'translate-x-4' : ''}`}></div>
                                                </div>
                                                <span className={`ml-2 text-xs font-bold uppercase ${!disabledApps.includes(category.id) ? 'text-green-500' : 'text-gray-400'}`}>
                                                    {!disabledApps.includes(category.id) ? 'ON' : 'OFF'}
                                                </span>
                                            </div>
                                        )}
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); handleUploadClick(category.id); }}
                                            disabled={!!isUploading}
                                            size="sm"
                                            className="gap-2 bg-white/10 hover:bg-white/20 text-text-primary border border-white/10"
                                        >
                                            {isThisUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                            <span className="hidden sm:inline">Subir</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Category Content */}
                                {isExpanded && (
                                    <div className="p-4 bg-surface-primary/30">
                                        {!hasAccessToSGSST ? (
                                            <UpgradeWall plan={user?.role} />
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

                                                {/* Show PerfilSociodemografico for perfil_socio category */}
                                                {category.id === 'perfil_socio' && (
                                                    <div className="mb-6">
                                                        <PerfilSociodemografico />
                                                    </div>
                                                )}

                                                {/* Show AnalisisVulnerabilidad for vulnerabilidad category */}
                                                {category.id === 'vulnerabilidad' && (
                                                    <div className="mb-6">
                                                        <AnalisisVulnerabilidad />
                                                    </div>
                                                )}

                                                {categoryFiles.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-8 text-text-secondary/60 border-2 border-dashed border-border-medium/50 rounded-lg">
                                                        <FolderOpen className="h-8 w-8 mb-2 opacity-40" />
                                                        <span className="text-sm">Sin documentos</span>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                        {categoryFiles.map((file) => (
                                                            <div
                                                                key={file.file_id}
                                                                className="group relative flex items-center gap-3 p-3 rounded-lg border border-border-medium bg-surface-primary hover:shadow-sm transition-all"
                                                            >
                                                                <div className="flex-shrink-0 p-2 rounded bg-surface-tertiary text-text-secondary">
                                                                    <File className="h-5 w-5" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-medium text-text-primary" title={file.name}>
                                                                        {file.name}
                                                                    </p>
                                                                    <p className="text-xs text-text-secondary">
                                                                        {file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Size unknown'}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(file.file_id); }}
                                                                    className="p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 hover:bg-surface-tertiary transition-all"
                                                                    title="Eliminar archivo"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
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
