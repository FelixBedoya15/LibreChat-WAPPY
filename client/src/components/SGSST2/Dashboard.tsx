import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '~/hooks';
import { 
    FileText, 
    ClipboardCheck, 
    BarChart2, 
    ShieldAlert, 
    Building2, 
    AlertTriangle, 
    ChevronRight,
    BrainCircuit,
    Activity,
    Box
} from 'lucide-react';
import { cn } from '~/utils';
import { OpenSidebar } from '~/components/Chat/Menus';
import type { ContextType } from '~/common';

import { PHASE_CATEGORIES } from './constants';
import PhaseDetail from './PhaseDetail';
import CompanyInfoModal from './CompanyInfoModal';
import DashboardPredictivo from './DashboardPredictivo';
import SSTWorldMap from './SSTWorldMap';

const REQUIRED_FIELDS = [
    'companyName', 'nit', 'legalRepresentative', 'workerCount',
    'arl', 'economicActivity', 'riskLevel', 'ciiu',
    'address', 'city', 'phone', 'email',
    'sector', 'responsibleSST', 'generalActivities',
] as const;

// ─── Phase Definitions ────────────────────────────────────────────────────────
const getPhases = () => [
    {
        id: 'plan',
        title: 'Planear',
        subtitle: 'Proyección y Estrategia',
        description: 'Políticas SG-SST, Perfil Sociodemográfico, Matriz GTC 45, Requisitos Legales y Plan de Trabajo Institucional.',
        accent: 'text-[#10b981]',
        bgGlow: 'bg-[#10b981]/5',
        borderHover: 'hover:border-[#10b981]',
        icon: <FileText className="w-8 h-8 text-[#10b981] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
    },
    {
        id: 'do',
        title: 'Hacer',
        subtitle: 'Ejecución Operativa',
        description: 'Reporte de Actos, Investigación ATEL, Método OWAS, Permiso en Alturas, EPP y Análisis SafeStart.',
        accent: 'text-[#0d9488]',
        bgGlow: 'bg-[#0d9488]/5',
        borderHover: 'hover:border-[#0d9488]',
        icon: <ShieldAlert className="w-8 h-8 text-[#0d9488] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
    },
    {
        id: 'check',
        title: 'Verificar',
        subtitle: 'Evaluación y Medición',
        description: 'Auditorías de Cumplimiento SG-SST, Supervisión Institucional e Indicadores Clave de Gestión Gerencial.',
        accent: 'text-[#059669]',
        bgGlow: 'bg-[#059669]/5',
        borderHover: 'hover:border-[#059669]',
        icon: <ClipboardCheck className="w-8 h-8 text-[#059669] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
    },
    {
        id: 'act',
        title: 'Actuar',
        subtitle: 'Mejora Continua',
        description: 'Registro de Acciones Correctivas y Preventivas (ACPM), Actualizaciones y Consolidación de Mejora Continua.',
        accent: 'text-[#14b8a6]',
        bgGlow: 'bg-[#14b8a6]/5',
        borderHover: 'hover:border-[#14b8a6]',
        icon: <BarChart2 className="w-8 h-8 text-[#14b8a6] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
    },
];

const OrganicBlob = () => (
    <svg className="absolute top-0 right-0 w-64 h-64 opacity-20 transform translate-x-12 -translate-y-8 transition-transform duration-[1200ms] group-hover:scale-[1.35] group-hover:-rotate-[15deg] pointer-events-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="#ffffff" d="M47.7,-67.2C61.4,-57.1,71.5,-41.8,78.2,-24.5C84.9,-7.2,88.2,12.1,81.3,28.8C74.4,45.5,57.3,59.6,39.6,68.4C21.9,77.2,3.6,80.7,-14.2,78.7C-32,76.7,-49.3,69.2,-64.1,56.5C-78.9,43.8,-91.2,25.9,-93.8,6.8C-96.4,-12.3,-89.3,-32.6,-76.3,-48.1C-63.3,-63.6,-44.4,-74.3,-26.8,-76.6C-9.2,-78.9,7.1,-72.8,22.8,-71.8C38.5,-70.8,34,-77.3,47.7,-67.2Z" transform="translate(100 100)" />
    </svg>
);

export default function SGSSTDashboard() {
    const { token } = useAuthContext();
    const { navVisible, setNavVisible } = useOutletContext<ContextType>();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // State
    const [selectedPhase, setSelectedPhase] = useState<any>(null);
    const [showCompanyInfo, setShowCompanyInfo] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [showWorldMap, setShowWorldMap] = useState(false);
    const hasCheckedRef = React.useRef(false);
    const phases = getPhases();

    // ─── Fetch Company Info ────────────────────────────────────────────────
    useEffect(() => {
        if (!token || hasCheckedRef.current) return;
        hasCheckedRef.current = true;

        fetch(`/api/sgsst/company-info?cb=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
        .then(res => { if (!res.ok) throw new Error(`Status ${res.status}`); return res.json(); })
        .then(info => {
            setCompanyInfo(info);
            if (!info || Object.keys(info).length === 0) {
                setMissingFields([...REQUIRED_FIELDS]);
                setShowCompanyInfo(true);
                return;
            }
            const missing = REQUIRED_FIELDS.filter(f => {
                const val = info[f];
                if (typeof val === 'string') {
                    const t = val.trim();
                    return t === '' || t === 'N/A' || t === 'No registrado';
                }
                return val === undefined || val === null || val === 0;
            });

            setMissingFields(missing);
            if (missing.length > 0) setShowCompanyInfo(true);
        })
        .catch(err => {
            console.error('[SGSST Dashboard] Error checking company info:', err.message);
            hasCheckedRef.current = false;
        });
    }, [token]);

    const handleModalClose = useCallback(() => {
        setShowCompanyInfo(false);
        hasCheckedRef.current = false;
    }, []);

    // ─── handle navigate-sgsst event (from notification panel) ───
    useEffect(() => {
        const SGSST_MODULE_PHASE_MAP: Record<string, string> = {
            reporte_actos: 'do',
            participacion_ipevar: 'do',
            alta_direccion: 'check',
        };
        const handler = (e: Event) => {
            const { module } = (e as CustomEvent).detail || {};
            if (!module) return;
            const phaseId = SGSST_MODULE_PHASE_MAP[module] || 'do';
            setSearchParams({ phase: phaseId, module });
        };
        window.addEventListener('navigate-sgsst', handler);
        return () => window.removeEventListener('navigate-sgsst', handler);
    }, [setSearchParams]);

    // ─── URL Sync ──────────────────────────────────────────────────────────
    useEffect(() => {
        const phaseId = searchParams.get('phase');
        if (phaseId) {
            const phase = phases.find(p => p.id === phaseId);
            setSelectedPhase(phase || null);
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

    if (selectedPhase) {
        const moduleParam = searchParams.get('module') || undefined;
        return (
            <PhaseDetail
                phase={selectedPhase}
                onBack={() => setSearchParams({})}
                navVisible={navVisible}
                setNavVisible={setNavVisible}
                autoOpenModule={moduleParam}
            />
        );
    }

    if (showWorldMap) {
        const handleMapNavigate = (phaseId: string) => {
            setShowWorldMap(false);
            const phase = phases.find(p => p.id === phaseId);
            if (phase) {
                if (missingFields.length > 0) {
                    setShowCompanyInfo(true);
                } else {
                    setSearchParams({ phase: phase.id });
                }
            }
        };
        return (
            <div className="flex h-full w-full flex-col overflow-y-auto bg-[#0a0a0a] pb-20">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b-4 border-green-500">
                    <span className="font-pixel text-green-400 text-sm">SOMOS SST — RISK MAP</span>
                    <button 
                       onClick={() => setShowWorldMap(false)}
                       className="pixel-btn bg-red-600"
                    >
                       EXIT MAP
                    </button>
                </div>
                <div className="flex-1 p-4">
                    <SSTWorldMap onNavigate={handleMapNavigate} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-surface-primary pb-20 scroll-smooth">
            
            {/* ═══ Header Section (Standard simple style equivalent to Blog/Aula) ═══ */}
            <header className="px-6 lg:px-12 py-8 bg-surface-primary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                {/* Left: Title & Sidebar toggle */}
                <div className="flex items-center gap-4">
                    {!navVisible && (
                        <button 
                            onClick={() => setNavVisible(true)}
                            className="hidden md:flex shrink-0 p-2 rounded-xl border border-border-medium hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text-primary"
                        >
                            <OpenSidebar setNavVisible={setNavVisible} />
                        </button>
                    )}
                    <div className="flex items-center gap-4">
                        <div className="bg-[#10b981]/10 p-3.5 rounded-2xl dark:bg-[#10b981]/20">
                            <Activity className="h-8 w-8 text-[#10b981]" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Sistema Estratégico SST</h1>
                            <p className="text-text-secondary mt-1 text-sm font-medium">Ciclo de Mejora Continua (PHVA) & Inteligencia Predictiva.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowWorldMap(true)}
                        className="ml-4 pixel-btn bg-green-600 hidden sm:block animate-pulse"
                    >
                        ENTER 8-BIT RISK MAP
                    </button>
                </div>

                {/* Right: Integrated Company Info Widget */}
                <button
                    onClick={() => setShowCompanyInfo(true)}
                    className="group flex items-center gap-3 bg-surface-secondary border border-border-medium px-4 py-3 rounded-2xl hover:bg-surface-hover hover:border-[#10b981]/40 hover:shadow-sm transition-all text-left w-full sm:w-auto"
                >
                    <div className="p-2.5 bg-[#10b981]/10 rounded-xl group-hover:bg-[#10b981]/20 group-hover:scale-105 transition-all">
                        <Building2 className="h-5 w-5 text-[#10b981]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] uppercase font-bold text-text-secondary mb-0.5 tracking-wider">Entidad Activa</p>
                        <p className="text-sm font-bold text-text-primary truncate max-w-[160px]">
                            {companyInfo?.companyName || 'Configurar Organización'}
                        </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-secondary group-hover:text-[#10b981] group-hover:translate-x-1 transition-all" />
                </button>
            </header>

            {/* ═══ Main Content Container ═══ */}
            <main className="max-w-[1400px] mx-auto w-full px-6 lg:px-8 pt-8 space-y-12">
                
                {/* Missing Info Warning */}
                {missingFields.length > 0 && (
                    <div
                        onClick={() => setShowCompanyInfo(true)}
                        className="animate-in fade-in slide-in-from-top-4 flex cursor-pointer items-center gap-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 transition-all hover:bg-amber-500/20 hover:shadow-md"
                    >
                        <AlertTriangle className="h-6 w-6 flex-shrink-0 text-amber-500 animate-pulse" />
                        <div className="text-sm">
                            <span className="font-bold text-amber-600 dark:text-amber-500 tracking-wide uppercase text-xs block mb-0.5">Atención Requerida</span>
                            <span className="text-text-secondary font-medium">
                                Su organización tiene <strong className="text-text-primary">{missingFields.length} campos</strong> pendientes por diligenciar. Finalice la configuración para habilitar simulaciones precisas.
                            </span>
                        </div>
                    </div>
                )}

                {/* ═══ PHVA Phase Grid (Dynamic SVGs) ═══ */}
                <section className="animate-in fade-in slide-in-from-bottom-8 duration-[800ms] fill-mode-both">
                    <div className="flex items-center gap-3 mb-8 px-1">
                        <div className="p-2 rounded-xl bg-[#10b981]/10 dark:bg-[#10b981]/20">
                            <Box className="h-5 w-5 text-[#10b981]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-text-primary tracking-tight">Gestión Operativa PHVA</h2>
                            <p className="text-sm text-text-secondary font-medium mt-0.5">Navegación por las fases del ciclo de mejora continua.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch max-w-5xl mx-auto">
                        {phases.map((phase, i) => (
                            <div
                                key={phase.id}
                                onClick={() => handlePhaseSelect(phase)}
                                className={cn(
                                    "group relative cursor-pointer flex flex-col rounded-2xl border-2 bg-surface-primary transition-all duration-300 ease-out shadow-sm hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 overflow-hidden h-full",
                                    "border-border-medium dark:border-white/10",
                                    phase.borderHover
                                )}
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                {/* Dynamic Glow Behind Card content */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${phase.bgGlow} pointer-events-none`} />

                                {/* Organic blob subtle background */}
                                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                                    <svg className={cn("w-full h-full transform translate-x-4 -translate-y-4", phase.accent)} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                        <path fill="currentColor" d="M47.7,-67.2C61.4,-57.1,71.5,-41.8,78.2,-24.5C84.9,-7.2,88.2,12.1,81.3,28.8C74.4,45.5,57.3,59.6,39.6,68.4C21.9,77.2,3.6,80.7,-14.2,78.7C-32,76.7,-49.3,69.2,-64.1,56.5C-78.9,43.8,-91.2,25.9,-93.8,6.8C-96.4,-12.3,-89.3,-32.6,-76.3,-48.1C-63.3,-63.6,-44.4,-74.3,-26.8,-76.6C-9.2,-78.9,7.1,-72.8,22.8,-71.8C38.5,-70.8,34,-77.3,47.7,-67.2Z" transform="translate(100 100)" />
                                    </svg>
                                </div>

                                {/* Content Block */}
                                <div className="relative p-6 px-7 flex flex-col flex-1 bg-transparent z-10 w-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-white dark:bg-black/20 rounded-2xl shadow-sm border border-border-light group-hover:border-transparent transition-colors">
                                            {phase.icon}
                                        </div>
                                        <div className="bg-surface-secondary rounded-full px-3 py-1 border border-border-light text-text-secondary text-[10px] font-black tracking-[0.2em] uppercase">
                                            Fase 0{i+1}
                                        </div>
                                    </div>
                                    
                                    <div className="text-left flex flex-col flex-1">
                                        <h2 className={cn("text-2xl font-black tracking-tight leading-none mb-2 text-text-primary transition-colors uppercase", `group-hover:${phase.accent}`)}>{phase.title}</h2>
                                        <p className="text-text-secondary font-bold text-xs uppercase tracking-wide mb-3 min-h-[32px] sm:min-h-0 lg:min-h-[32px]">{phase.subtitle}</p>
                                        <p className="text-[13px] font-medium text-text-secondary leading-relaxed opacity-90 mt-auto pt-2">{phase.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-border-medium to-transparent opacity-50 my-8" />

                {/* ═══ Predictive AI Dashboard (Native Integration) ═══ */}
                <section className="animate-in fade-in slide-in-from-bottom-12 duration-[1000ms] fill-mode-both">
                    <div className="flex items-center gap-3 mb-6 px-1">
                        <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/30">
                            <BrainCircuit className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-text-primary tracking-tight">Centro de Inteligencia Predictiva</h2>
                            <p className="text-sm text-text-secondary font-medium mt-0.5">Monitoreo dinámico del ecosistema SST alimentado por datos cruzados.</p>
                        </div>
                    </div>
                    
                    <div className="bg-surface-primary dark:bg-[#1a1a1a] rounded-3xl overflow-hidden transition-all shadow-sm">
                        <DashboardPredictivo />
                    </div>
                </section>
            </main>

            <CompanyInfoModal isOpen={showCompanyInfo} onClose={handleModalClose} />
        </div>
    );
}
