import React from 'react';
import { useLocalize } from '~/hooks';
import { FileText, ClipboardCheck, BarChart2, ShieldAlert, Building2 } from 'lucide-react';
import { cn } from '~/utils';

import { PHASE_CATEGORIES } from './constants';
import PhaseDetail from './PhaseDetail';
import CompanyInfoModal from './CompanyInfoModal';

const SGSSTDashboard = () => {
    const localize = useLocalize();
    const [selectedPhase, setSelectedPhase] = React.useState<any>(null);
    const [showCompanyInfo, setShowCompanyInfo] = React.useState(false);

    const phases = [
        {
            id: 'plan',
            title: 'Planear',
            description: 'Política, Identificación de Peligros, Requisitos Legales',
            color: 'bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-400',
            icon: <FileText className="w-8 h-8 text-blue-500" />,
            items: PHASE_CATEGORIES.plan.map(c => c.title),
        },
        {
            id: 'do',
            title: 'Hacer',
            description: 'Gestión de la Salud, Gestión de Peligros y Riesgos',
            color: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-400',
            icon: <ShieldAlert className="w-8 h-8 text-yellow-500" />,
            items: PHASE_CATEGORIES.do.map(c => c.title),
        },
        {
            id: 'check',
            title: 'Verificar',
            description: 'Auditoría y Revisión por la Alta Dirección',
            color: 'bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-400',
            icon: <ClipboardCheck className="w-8 h-8 text-red-500" />,
            items: PHASE_CATEGORIES.check.map(c => c.title),
        },
        {
            id: 'act',
            title: 'Actuar',
            description: 'Mejoramiento Continuo',
            color: 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400',
            icon: <BarChart2 className="w-8 h-8 text-green-500" />,
            items: PHASE_CATEGORIES.act.map(c => c.title),
        },
    ];

    if (selectedPhase) {
        return <PhaseDetail phase={selectedPhase} onBack={() => setSelectedPhase(null)} />;
    }

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-surface-primary p-6">
            <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-3">
                    <h1 className="text-3xl font-bold text-text-primary">Sistema de Gestión SST</h1>
                    <button
                        onClick={() => setShowCompanyInfo(true)}
                        className="rounded-lg border border-border-medium p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-blue-500"
                        title="Información de la Empresa"
                    >
                        <Building2 className="h-5 w-5" />
                    </button>
                </div>
                <p className="mt-2 text-text-secondary">Ciclo PHVA (Planear - Hacer - Verificar - Actuar)</p>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:h-[600px]">
                {phases.map((phase) => (
                    <div
                        key={phase.id}
                        onClick={() => setSelectedPhase(phase)}
                        className={cn(
                            'group relative flex cursor-pointer flex-col rounded-xl border p-6 transition-all hover:shadow-lg',
                            phase.color,
                            'bg-surface-secondary border-border-medium hover:border-opacity-100 hover:bg-opacity-50',
                        )}
                    >
                        <div className="mb-4 flex items-center gap-4">
                            <div className="rounded-full bg-surface-primary p-3 shadow-sm">{phase.icon}</div>
                            <h2 className="text-xl font-bold">{phase.title}</h2>
                        </div>
                        <p className="mb-4 text-sm opacity-80">{phase.description}</p>

                        <ul className="mt-auto space-y-2">
                            {phase.items.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="absolute inset-0 rounded-xl ring-2 ring-inset ring-transparent transition-all group-hover:ring-current group-hover:ring-opacity-20" />
                    </div>
                ))}
            </div>

            <CompanyInfoModal isOpen={showCompanyInfo} onClose={() => setShowCompanyInfo(false)} />
        </div>
    );
};

export default SGSSTDashboard;

