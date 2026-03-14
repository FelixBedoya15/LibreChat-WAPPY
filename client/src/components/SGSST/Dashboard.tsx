import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useLocalize, useAuthContext } from '~/hooks';
import { FileText, ClipboardCheck, BarChart2, ShieldAlert, Building2, AlertTriangle } from 'lucide-react';
import { cn } from '~/utils';
import { OpenSidebar } from '~/components/Chat/Menus';
import type { ContextType } from '~/common';

import { PHASE_CATEGORIES } from './constants';
import PhaseDetail from './PhaseDetail';
import CompanyInfoModal from './CompanyInfoModal';

const REQUIRED_FIELDS = [
    'companyName', 'nit', 'legalRepresentative', 'workerCount',
    'arl', 'economicActivity', 'riskLevel', 'ciiu',
    'address', 'city', 'phone', 'email',
    'sector', 'responsibleSST', 'generalActivities',
] as const;

const phases = [
    {
        id: 'plan',
        title: 'Planear',
        description: 'Política, Identificación de Peligros, Requisitos Legales',
        color: 'bg-teal-500/10 border-teal-500/50 text-teal-700 dark:text-teal-400',
        icon: <FileText className="w-8 h-8 text-teal-500" />,
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

const SGSSTDashboard = () => {
    const localize = useLocalize();
    const { token } = useAuthContext();
    const { navVisible, setNavVisible } = useOutletContext<ContextType>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedPhase, setSelectedPhase] = React.useState<any>(null);
    const [showCompanyInfo, setShowCompanyInfo] = React.useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const hasCheckedRef = React.useRef(false);

    // Check company info on mount — auto-show modal if fields missing
    useEffect(() => {
        if (!token || hasCheckedRef.current) {
            return;
        }

        hasCheckedRef.current = true;

        const url = `/api/sgsst/company-info?cb=${Date.now()}`;
        fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => {
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            })
            .then(info => {
                if (!info || Object.keys(info).length === 0) {
                    setMissingFields([...REQUIRED_FIELDS]);
                    setShowCompanyInfo(true);
                    return;
                }
                const missing = REQUIRED_FIELDS.filter(f => {
                    const val = (info as any)[f];
                    if (typeof val === 'string') {
                        const t = val.trim();
                        return t === '' || t === 'N/A' || t === 'No registrado';
                    }
                    return val === undefined || val === null || val === 0;
                });

                setMissingFields(missing);
                if (missing.length > 0) {
                    setShowCompanyInfo(true);
                }
            })
            .catch(err => {
                console.error('[SGSST Dashboard] Error checking company info:', err.message);
                hasCheckedRef.current = false; // allow retry if failed
            });
    }, [token]);

    // Re-check after modal closes
    const handleModalClose = useCallback(() => {
        setShowCompanyInfo(false);
        hasCheckedRef.current = false;
    }, []);

    // Sync state with URL on mount and update
    useEffect(() => {
        const phaseId = searchParams.get('phase');
        if (phaseId) {
            const phase = phases.find(p => p.id === phaseId);
            if (phase) {
                setSelectedPhase(phase);
            } else {
                setSelectedPhase(null);
            }
        } else {
            setSelectedPhase(null);
        }
    }, [searchParams]);

    const handlePhaseSelect = (phase: any) => {
        if (missingFields.length > 0) {
            setShowCompanyInfo(true);
            return;
        }
        setSearchParams({ phase: phase.id });
    };

    const handleBack = () => {
        setSearchParams({});
    };

    // If a phase is selected via URL but info is missing, kick them back to dashboard
    useEffect(() => {
        if (selectedPhase && missingFields.length > 0) {
            setSearchParams({});
            setShowCompanyInfo(true);
        }
    }, [selectedPhase, missingFields, setSearchParams]);

    if (selectedPhase) {
        return (
            <PhaseDetail
                phase={selectedPhase}
                onBack={handleBack}
                navVisible={navVisible}
                setNavVisible={setNavVisible}
            />
        );
    }

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-surface-primary p-6">
            <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-3">
                    {!navVisible && (
                        <div className="hidden md:block shrink-0">
                            <OpenSidebar setNavVisible={setNavVisible} />
                        </div>
                    )}
                    <h1 className="text-3xl font-bold text-text-primary">Sistema de Gestión SST</h1>
                    <button
                        onClick={() => setShowCompanyInfo(true)}
                        className="rounded-lg border border-border-medium p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-teal-500"
                        title="Información de la Empresa"
                    >
                        <Building2 className="h-5 w-5" />
                    </button>
                </div>
                <p className="mt-2 text-text-secondary">Ciclo PHVA (Planear - Hacer - Verificar - Actuar)</p>
            </div>

            {/* Warning banner for missing company info */}
            {missingFields.length > 0 && (
                <div
                    onClick={() => setShowCompanyInfo(true)}
                    className="mx-auto mb-6 flex max-w-3xl cursor-pointer items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 transition-colors hover:bg-amber-500/20"
                >
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                    <div className="text-sm">
                        <span className="font-semibold text-amber-600 dark:text-amber-400">Información incompleta:</span>
                        <span className="ml-1 text-text-secondary">
                            Faltan {missingFields.length} campo(s) obligatorio(s) en la información de su empresa. Haga clic aquí para completarlos.
                        </span>
                    </div>
                </div>
            )}

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:h-[600px]">
                {phases.map((phase) => (
                    <div
                        key={phase.id}
                        onClick={() => handlePhaseSelect(phase)}
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

            <CompanyInfoModal isOpen={showCompanyInfo} onClose={handleModalClose} />
        </div>
    );
};

export default SGSSTDashboard;
