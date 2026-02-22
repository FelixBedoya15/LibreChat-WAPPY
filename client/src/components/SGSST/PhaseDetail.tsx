import React, { useState, useEffect, useRef } from 'react';
import { useLocalize } from '~/hooks';
import {
    ArrowLeft, Upload, MessageSquare, File, Trash2, Loader2, ChevronDown, ChevronRight, FolderOpen,
    FileText, Target, Stethoscope, Scale, Users, UserCircle, BarChart, Activity, AlertTriangle, ShieldAlert,
    ClipboardCheck, Briefcase, GitMerge
} from 'lucide-react';
import { OpenSidebar } from '~/components/Chat/Menus';
import { Button, useToastContext } from '@librechat/client';
import { useUploadFileMutation } from '~/data-provider';
import { useNavigate } from 'react-router-dom';
import { PHASE_CATEGORIES } from './constants';
import DiagnosticoChecklist from './DiagnosticoChecklist';
import PoliticaSST from './PoliticaSST';
import AuditoriaChecklist from './AuditoriaChecklist';
import MatrizLegal from './MatrizLegal';
import EstadisticasATEL from './EstadisticasATEL';

// Manual Icon Map to avoid dynamic import issues
const ICON_MAP: Record<string, React.ElementType> = {
    FileText, Target, Stethoscope, Scale,
    Users, UserCircle, BarChart, Activity,
    AlertTriangle, ShieldAlert, ClipboardCheck,
    Briefcase, GitMerge, FolderOpen
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
    const [files, setFiles] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState<string | null>(null); // Stores category ID being uploaded to
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]); // Track expanded categories
    const fileInputRef = useRef<HTMLInputElement>(null);
    const selectedCategoryRef = useRef<string | null>(null);

    const storageKey = `sgsst_files_${phase.id}`;

    // Get categories for this phase
    const categories = PHASE_CATEGORIES[phase.id as keyof typeof PHASE_CATEGORIES] || [];

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
                    <div className="mr-2">
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
                {categories.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary">
                        No hay categorías definidas para esta fase.
                    </div>
                ) : (
                    categories.map((category) => {
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
                                        <div className="p-2 rounded-lg bg-surface-primary text-blue-600 dark:text-blue-400">
                                            {renderIcon(category.icon)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-text-primary">{category.title}</h3>
                                            <p className="text-xs text-text-secondary">{categoryFiles.length} documentos</p>
                                        </div>
                                    </div>

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

                                {/* Category Content */}
                                {isExpanded && (
                                    <div className="p-4 bg-surface-primary/30">
                                        {/* Show DiagnosticoChecklist for diagnostico category */}
                                        {category.id === 'diagnostico' && (
                                            <div className="mb-6">
                                                <DiagnosticoChecklist />
                                            </div>
                                        )}

                                        {/* Show PoliticaSST for politica category */}
                                        {category.id === 'politica' && (
                                            <div className="mb-6">
                                                <PoliticaSST />
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
