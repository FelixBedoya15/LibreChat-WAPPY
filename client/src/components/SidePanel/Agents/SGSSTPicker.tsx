
import React, { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, FileText, Check, Database } from 'lucide-react';
import { Button } from '@librechat/client';
import { PHASE_CATEGORIES } from '~/components/SGSST/constants';

interface SGSSTFile {
    file_id: string;
    name: string;
    size: number;
    type: string;
    category?: string;
    sgsst_phase?: string; // stored as metadata
}

interface SGSSTPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onFilesSelected: (files: SGSSTFile[]) => void;
}

const PHASES = [
    { id: 'plan', title: 'Planear', color: 'text-blue-500' },
    { id: 'do', title: 'Hacer', color: 'text-yellow-500' },
    { id: 'check', title: 'Verificar', color: 'text-red-500' },
    { id: 'act', title: 'Actuar', color: 'text-green-500' },
];

export default function SGSSTPicker({ isOpen, onClose, onFilesSelected }: SGSSTPickerProps) {
    const [allFiles, setAllFiles] = useState<Record<string, SGSSTFile[]>>({});
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            const loadedFiles: Record<string, SGSSTFile[]> = {};

            PHASES.forEach(phase => {
                const key = `sgsst_files_${phase.id}`;
                try {
                    const saved = localStorage.getItem(key);
                    if (saved) {
                        loadedFiles[phase.id] = JSON.parse(saved);
                    } else {
                        loadedFiles[phase.id] = [];
                    }
                } catch (e) {
                    console.error(`Error loading SG-SST files for ${phase.id}`, e);
                    loadedFiles[phase.id] = [];
                }
            });
            setAllFiles(loadedFiles);
            setSelectedIds(new Set()); // Reset selection on open
        }
    }, [isOpen]);

    const toggleSelection = (file: SGSSTFile) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(file.file_id)) {
            newSet.delete(file.file_id);
        } else {
            newSet.add(file.file_id);
        }
        setSelectedIds(newSet);
    };

    const handleConfirm = () => {
        const selectedFiles: SGSSTFile[] = [];
        Object.values(allFiles).flat().forEach(file => {
            if (selectedIds.has(file.file_id)) {
                selectedFiles.push(file);
            }
        });
        onFilesSelected(selectedFiles);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                <DialogPanel className="w-full max-w-2xl rounded-xl bg-surface-primary p-6 shadow-2xl border border-border-medium">
                    <div className="flex items-center justify-between border-b border-border-medium pb-4 mb-4">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Database className="w-6 h-6 text-blue-600" />
                            Seleccionar Archivos SG-SST
                        </DialogTitle>
                        <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2">
                        {PHASES.map(phase => {
                            const phaseFiles = allFiles[phase.id] || [];
                            if (phaseFiles.length === 0) return null;

                            return (
                                <div key={phase.id}>
                                    <h3 className={`font-bold mb-2 ${phase.color}`}>{phase.title}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {phaseFiles.map(file => {
                                            const isSelected = selectedIds.has(file.file_id);
                                            return (
                                                <div
                                                    key={file.file_id}
                                                    onClick={() => toggleSelection(file)}
                                                    className={`
                                                        cursor-pointer p-3 rounded-lg border flex items-center gap-3 transition-all
                                                        ${isSelected
                                                            ? 'border-blue-500 bg-blue-500/10'
                                                            : 'border-border-medium hover:bg-surface-secondary'}
                                                    `}
                                                >
                                                    <div className={`
                                                        w-5 h-5 rounded border flex items-center justify-center
                                                        ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-text-secondary'}
                                                    `}>
                                                        {isSelected && <Check className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="truncate text-sm font-medium text-text-primary" title={file.name}>{file.name}</p>
                                                        <p className="text-xs text-text-secondary truncate">
                                                            {file.category || 'Sin categoría'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {Object.values(allFiles).every(list => list.length === 0) && (
                            <div className="text-center py-10 text-text-secondary">
                                No se encontraron archivos cargados en los módulos SG-SST.
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border-medium">
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
                            Añadir ({selectedIds.size})
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
