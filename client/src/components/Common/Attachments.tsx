import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { 
    Paperclip, 
    UploadCloud, 
    Trash2, 
    Download, 
    FileText, 
    FileSpreadsheet, 
    FileCode, 
    FileArchive, 
    FileCheck,
    File as FileIcon, 
    Loader2
} from 'lucide-react';

export interface Attachment {
    name: string;
    url: string;
    filename?: string;
    size?: number;
    fileType?: string;
}

export function formatFileSize(bytes?: number): string {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(filename: string, fileType?: string) {
    const ext = (fileType || filename.split('.').pop() || '').toLowerCase();
    
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
    }
    if (['pdf'].includes(ext)) {
        return <FileText className="w-5 h-5 text-rose-500 flex-shrink-0" />;
    }
    if (['doc', 'docx'].includes(ext)) {
        return <FileCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return <FileArchive className="w-5 h-5 text-amber-500 flex-shrink-0" />;
    }
    if (['json', 'js', 'ts', 'html', 'css', 'py'].includes(ext)) {
        return <FileCode className="w-5 h-5 text-cyan-500 flex-shrink-0" />;
    }
    return <FileIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />;
}

// -------------------------------------------------------------
// Component 1: AttachmentManager (For Admin / Editors)
// -------------------------------------------------------------
interface AttachmentManagerProps {
    attachments: Attachment[];
    onChange: (attachments: Attachment[]) => void;
    uploadEndpoint: string;
    title?: string;
    description?: string;
    disabled?: boolean;
}

export function AttachmentManager({
    attachments = [],
    onChange,
    uploadEndpoint,
    title = 'Archivos y Recursos Descargables',
    description = 'Sube documentos adjuntos (PDF, Excel, Word, ZIP, etc.) que los usuarios podrán descargar.',
    disabled = false
}: AttachmentManagerProps) {
    const { showToast } = useToastContext();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const newAttachments = [...attachments];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('file', file);

                const response = await axios.post(uploadEndpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data?.file) {
                    newAttachments.push(response.data.file);
                }
            }

            onChange(newAttachments);
            showToast({ message: 'Archivo(s) subido(s) correctamente.', status: 'success' });
        } catch (error: any) {
            console.error('Error uploading attachment:', error);
            const msg = error.response?.data?.error || 'Error al subir el archivo.';
            showToast({ message: msg, status: 'error' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = (index: number) => {
        const updated = attachments.filter((_, i) => i !== index);
        onChange(updated);
    };

    return (
        <div className="rounded-xl border border-border-medium/60 bg-surface-primary/50 p-4 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-green-500" />
                        <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
                    </div>
                    {description && (
                        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
                    )}
                </div>

                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={disabled || uploading}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || uploading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 disabled:opacity-50"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Subiendo...</span>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>Cargar Archivo</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* List of uploaded attachments */}
            {attachments.length > 0 ? (
                <div className="space-y-2 mt-3">
                    {attachments.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border-medium/40 bg-surface-secondary/60 hover:bg-surface-secondary transition-colors"
                        >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {getFileIcon(item.name, item.fileType)}
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-text-primary truncate" title={item.name}>
                                        {item.name}
                                    </p>
                                    {item.size ? (
                                        <p className="text-[10px] text-text-tertiary">
                                            {formatFileSize(item.size)}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={item.name}
                                    className="p-1 text-text-secondary hover:text-green-500 rounded hover:bg-surface-tertiary transition-colors"
                                    title="Descargar archivo"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(idx)}
                                    disabled={disabled || uploading}
                                    className="p-1 text-text-secondary hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                    title="Eliminar adjunto"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4 border border-dashed border-border-medium/40 rounded-lg bg-surface-secondary/20">
                    <p className="text-xs text-text-tertiary">No hay archivos adjuntos en esta sección.</p>
                </div>
            )}
        </div>
    );
}

// -------------------------------------------------------------
// Component 2: AttachmentViewer (For Viewers / Students / Public)
// -------------------------------------------------------------
interface AttachmentViewerProps {
    attachments?: Attachment[];
    title?: string;
    subtitle?: string;
    className?: string;
}

export function AttachmentViewer({
    attachments = [],
    title = 'Recursos y Archivos Descargables',
    subtitle = 'Descarga el material complementario para estudiar o implementar.',
    className = ''
}: AttachmentViewerProps) {
    if (!attachments || attachments.length === 0) return null;

    return (
        <div className={`rounded-2xl border border-border-medium/60 bg-surface-primary/70 backdrop-blur-sm p-5 shadow-sm transition-all duration-300 ${className}`}>
            <div className="flex items-center gap-2.5 mb-3 border-b border-border-medium/40 pb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                    <Paperclip className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-text-primary">{title}</h3>
                    {subtitle && (
                        <p className="text-xs text-text-secondary">{subtitle}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {attachments.map((item, idx) => (
                    <a
                        key={idx}
                        href={item.url}
                        download={item.name}
                        className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-border-medium/50 bg-surface-secondary/50 hover:bg-green-500/5 hover:border-green-500/30 transition-all duration-200"
                    >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 rounded-lg bg-surface-primary border border-border-medium/30 group-hover:scale-105 transition-transform flex-shrink-0">
                                {getFileIcon(item.name, item.fileType)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-text-primary group-hover:text-green-600 dark:group-hover:text-green-400 truncate" title={item.name}>
                                    {item.name}
                                </p>
                                <p className="text-[10px] text-text-secondary mt-0.5">
                                    {item.size ? formatFileSize(item.size) : 'Archivo adjunto'}
                                </p>
                            </div>
                        </div>

                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 group-hover:bg-green-500 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm">
                            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
