import React, { useState, useEffect } from 'react';
import { useAuthContext } from '~/hooks';
import { ArrowLeft, User, Activity, AlertTriangle, Shield, Calendar, FileText } from 'lucide-react';
import { useToastContext } from '@librechat/client';
import MatrizIPEVARTable from './MatrizIPEVARTable';

interface BioIndividuoDashboardProps {
    workerId: string;
    onBack: () => void;
}

export default function BioIndividuoDashboard({ workerId, onBack }: BioIndividuoDashboardProps) {
    const { token } = useAuthContext();
    const { showToast } = useToastContext();
    const [worker, setWorker] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWorker = async () => {
            try {
                const res = await fetch(`/api/sgsst/workers/worker/${workerId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setWorker(data.worker);
                }
            } catch (error) {
                showToast({ message: 'Error cargando datos del trabajador', status: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchWorker();
    }, [workerId, token]);

    if (isLoading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
    }

    if (!worker) {
        return <div className="p-8 text-center text-red-500">Trabajador no encontrado.</div>;
    }

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 border-b border-border-medium pb-4">
                <button 
                    onClick={onBack}
                    className="p-2 bg-surface-secondary border border-border-medium rounded-xl hover:bg-surface-hover text-text-secondary transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-text-primary flex items-center gap-2">
                        <User className="h-6 w-6 text-teal-600" />
                        Perfil 360°: {worker.nombre}
                    </h2>
                    <p className="text-sm text-text-secondary">Dashboard Bio-individual y Matriz IPEVAR</p>
                </div>
            </div>

            {/* Demographics & Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-secondary border border-border-medium rounded-2xl p-6 shadow-sm col-span-2">
                    <h3 className="font-bold text-sm text-text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-600" /> Datos Generales
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-text-tertiary text-xs font-semibold mb-1">Nombre Completo</p>
                            <p className="font-medium text-text-primary">{worker.nombre}</p>
                        </div>
                        <div>
                            <p className="text-text-tertiary text-xs font-semibold mb-1">Documento de Identidad</p>
                            <p className="font-medium text-text-primary">{worker.documento}</p>
                        </div>
                        <div>
                            <p className="text-text-tertiary text-xs font-semibold mb-1">Fecha de Ingreso</p>
                            <p className="font-medium text-text-primary">{worker.fechaIngreso ? new Date(worker.fechaIngreso).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-sm text-red-700 dark:text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Condiciones de Salud Previas
                    </h3>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        {worker.condicionesSalud || 'Ninguna condición registrada.'}
                    </p>
                    <p className="text-xs mt-3 text-red-600/70 dark:text-red-400/70">
                        *Esta información alimentará automáticamente el análisis IPEVAR.
                    </p>
                </div>
            </div>

            {/* Matriz IPEVAR Bio-Individual (Placeholder para la siguiente fase) */}
            <div className="bg-surface-secondary border border-teal-200 dark:border-teal-800/50 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-black text-text-primary flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-teal-600" />
                            Matriz IPEVAR Bio-individual
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                            Análisis de riesgos específico para <strong>{worker.nombre}</strong> considerando su perfil de cargo y condiciones de salud.
                        </p>
                    </div>
                </div>
                
                <div className="h-[600px] mt-4 relative rounded-xl overflow-hidden border border-border-medium shadow-inner">
                    <MatrizIPEVARTable conversationId={null} workerId={workerId} />
                </div>
            </div>
        </div>
    );
}
