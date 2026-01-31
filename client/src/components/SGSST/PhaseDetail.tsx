import React, { useState, useEffect, useRef } from 'react';
import { useLocalize } from '~/hooks';
import { ArrowLeft, Upload, MessageSquare, File, Trash2, Loader2 } from 'lucide-react';
import { Button, useToastContext } from '@librechat/client';
import { useUploadFileMutation } from '~/data-provider';
import { useNavigate } from 'react-router-dom';

interface PhaseDetailProps {
    phase: {
        id: string;
        title: string;
        description: string;
        color: string;
    };
    onBack: () => void;
}

const PhaseDetail = ({ phase, onBack }: PhaseDetailProps) => {
    const localize = useLocalize();
    const navigate = useNavigate();
    const { showToast } = useToastContext();
    const [files, setFiles] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const storageKey = `sgsst_files_${phase.id}`;

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                setFiles(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved files', e);
            }
        }
    }, [phase.id, storageKey]);

    const saveFiles = (newFiles: any[]) => {
        setFiles(newFiles);
        localStorage.setItem(storageKey, JSON.stringify(newFiles));
    };

    const uploadMutation = useUploadFileMutation({
        onSuccess: (data) => {
            setIsUploading(false);
            showToast({ message: 'Archivo subido correctamente', status: 'success' });

            const newFile = {
                file_id: data.file_id,
                name: data.filename,
                size: data.bytes || 0, // Note: bytes might need check
                filepath: data.filepath,
                type: data.type,
            };

            saveFiles([...files, newFile]);
        },
        onError: (error) => {
            setIsUploading(false);
            console.error('Upload failed', error);
            showToast({ message: 'Error al subir archivo', status: 'error' });
        }
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);

            const formData = new FormData();
            formData.append('file', file);
            // We use 'default' endpoint or a specific one. For now assuming default/openAI structure
            formData.append('endpoint', 'default');
            formData.append('file_id', crypto.randomUUID());
            formData.append('width', '0');
            formData.append('height', '0');
            formData.append('version', '1');

            uploadMutation.mutate(formData);

            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleDelete = (fileId: string) => {
        const newFiles = files.filter(f => f.file_id !== fileId);
        saveFiles(newFiles);
    };

    const handleChat = () => {
        // Navigate to new chat with instructions to use these files
        // Ideally we would create a conversation with these files attached.
        // For prototype, we just go to new chat.
        navigate('/c/new', { state: { sgsstContext: { phase: phase.title, files } } });
    };

    return (
        <div className="flex h-full w-full flex-col bg-surface-primary p-6">
            <div className="mb-6 flex items-center gap-4 border-b border-border-medium pb-4">
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
                    <Button onClick={handleChat} variant="outline" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Chat con Fase
                    </Button>
                    <Button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {isUploading ? 'Subiendo...' : 'Subir Archivo'}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {files.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-medium bg-surface-secondary/50 text-text-secondary">
                        <Upload className="mb-2 h-10 w-10 opacity-50" />
                        <p>No hay archivos en esta fase.</p>
                        <p className="text-sm">Sube documentos para comenzar.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {files.map((file, idx) => (
                            <div
                                key={file.file_id || idx}
                                className="group relative flex flex-col rounded-lg border border-border-medium bg-surface-secondary p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="mb-2 flex items-center justify-center rounded-md bg-surface-tertiary p-4">
                                    <File className="h-8 w-8 text-text-secondary" />
                                </div>
                                <span className="truncate text-sm font-medium text-text-primary" title={file.name}>
                                    {file.name}
                                </span>
                                <span className="text-xs text-text-secondary">
                                    {file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Unknown size'}
                                </span>

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(file.file_id); }}
                                    className="absolute top-2 right-2 rounded-full p-1 text-red-500 opacity-0 hover:bg-surface-tertiary group-hover:opacity-100 transition-opacity"
                                    title="Eliminar"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhaseDetail;
