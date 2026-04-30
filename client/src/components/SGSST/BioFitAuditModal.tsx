import React from 'react';
import ReactDOM from 'react-dom';
import { X, Activity, ShieldAlert, HeartPulse, Brain, AlertTriangle, Info, MapPin } from 'lucide-react';
import { cn } from '~/utils';

export interface BioFitAuditItem {
    category: string;
    title: string;
    description: string;
    pointsDeducted: number;
    severity: 'info' | 'warning' | 'critical';
}

export interface BioFitAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    workerName: string;
    cargoName: string;
    score: number;
    auditItems: BioFitAuditItem[];
}

const BioFitAuditModal: React.FC<BioFitAuditModalProps> = ({ isOpen, onClose, workerName, cargoName, score, auditItems }) => {
    if (!isOpen) return null;

    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
        if (s >= 60) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
        return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    };

    const getSeverityIcon = (sev: string) => {
        switch (sev) {
            case 'critical': return <ShieldAlert className="h-5 w-5 text-red-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case 'info': return <Info className="h-5 w-5 text-blue-500" />;
            default: return <Activity className="h-5 w-5 text-gray-500" />;
        }
    };

    const getSeverityStyles = (sev: string) => {
        switch (sev) {
            case 'critical': return 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50';
            case 'warning': return 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50';
            case 'info': return 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50';
            default: return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
        }
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Clínico': return <HeartPulse className="h-4 w-4 mr-1.5" />;
            case 'Psicosocial': return <Brain className="h-4 w-4 mr-1.5" />;
            case 'Físico': return <Activity className="h-4 w-4 mr-1.5" />;
            case 'Operativo': return <ShieldAlert className="h-4 w-4 mr-1.5" />;
            case 'Sociodemográfico': return <MapPin className="h-4 w-4 mr-1.5" />;
            default: return <Info className="h-4 w-4 mr-1.5" />;
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border-medium bg-surface-secondary shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border-medium px-6 py-5 bg-surface-primary/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className={cn("flex flex-col items-center justify-center h-14 w-14 rounded-full border-2 font-bold text-xl shadow-inner", getScoreColor(score))}>
                            {score}%
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                Auditoría Biocéntrica
                            </h2>
                            <p className="text-sm text-text-secondary mt-0.5">
                                <span className="font-semibold text-text-primary">{workerName}</span> — {cargoName}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 text-text-secondary hover:bg-surface-hover transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    
                    {/* Explicación del Índice */}
                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 flex gap-4">
                        <div className="mt-1">
                            <Activity className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-1">¿Cómo se calcula el Índice Biocéntrico?</h4>
                            <p className="text-sm text-indigo-800/80 dark:text-indigo-400/80 leading-relaxed">
                                El trabajador inicia con un índice base de <strong>100%</strong> (Salud y compatibilidad perfecta). El algoritmo audita factores clínicos universales (IMC, Tabaquismo, etc.) y luego agrava las deducciones matemáticamente cruzándolas contra las exigencias específicas del cargo (Ej. Edad avanzada en Alta Exigencia Física).
                            </p>
                        </div>
                    </div>

                    {/* Desglose de Puntos */}
                    <div>
                        <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                            <span className="bg-surface-tertiary px-2.5 py-1 rounded-md text-xs border border-border-light">Desglose de Penalizaciones</span>
                        </h3>
                        
                        {auditItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-green-300 bg-green-50/30 dark:border-green-800/50 dark:bg-green-900/10 text-center">
                                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
                                    <HeartPulse className="h-6 w-6 text-green-500" />
                                </div>
                                <h4 className="font-bold text-green-700 dark:text-green-400 mb-1">Compatibilidad Óptima</h4>
                                <p className="text-sm text-green-600/80 dark:text-green-400/80 max-w-md">No se detectaron vulnerabilidades clínicas, psicosociales o demográficas que interfieran con el perfil del cargo.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {auditItems.map((item, idx) => (
                                    <div key={idx} className={cn("flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-md", getSeverityStyles(item.severity))}>
                                        <div className="flex flex-col items-center justify-center min-w-[50px]">
                                            <div className="font-mono font-bold text-lg text-text-primary">
                                                -{item.pointsDeducted}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-text-secondary">Puntos</div>
                                        </div>
                                        <div className="w-px h-full bg-border-medium self-stretch mx-1"></div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center">
                                                    {getSeverityIcon(item.severity)}
                                                    <h4 className="font-bold text-sm ml-2 text-text-primary">{item.title}</h4>
                                                </div>
                                                <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-surface-primary px-2 py-0.5 rounded-full border border-border-light">
                                                    {getCategoryIcon(item.category)}
                                                    {item.category}
                                                </span>
                                            </div>
                                            <p className="text-sm text-text-secondary mt-1.5">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border-medium px-6 py-4 bg-surface-primary/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-xl bg-surface-tertiary px-6 py-2.5 text-sm font-bold text-text-primary hover:bg-surface-hover hover:text-teal-500 transition-colors border border-border-light shadow-sm"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BioFitAuditModal;
