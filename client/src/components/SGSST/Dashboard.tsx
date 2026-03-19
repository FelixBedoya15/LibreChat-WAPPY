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
    Activity
} from 'lucide-react';
import { cn } from '~/utils';
import { OpenSidebar } from '~/components/Chat/Menus';
import type { ContextType } from '~/common';

import { PHASE_CATEGORIES } from './constants';
import PhaseDetail from './PhaseDetail';
import CompanyInfoModal from './CompanyInfoModal';
import DashboardPredictivo from './DashboardPredictivo';

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
        subtitle: 'Proyección y Diseño Estratégico',
        description: 'Política, Identificación de Peligros y Requisitos Legales.',
        gradient: 'from-[#0f766e] to-[#0d9488]', // teal
        bgGlow: 'bg-teal-500/20',
        icon: <FileText className="w-8 h-8 text-white relative z-10" strokeWidth={1.5} />,
        items: PHASE_CATEGORIES.plan.map(c => c.title),
    },
    {
        id: 'do',
        title: 'Hacer',
        subtitle: 'Ejecución y Control Operativo',
        description: 'Gestión de Salud, Seguridad en el Trabajo y Vulnerabilidad.',
        gradient: 'from-[#d97706] to-[#f59e0b]', // amber
        bgGlow: 'bg-amber-500/20',
        icon: <ShieldAlert className="w-8 h-8 text-white relative z-10" strokeWidth={1.5} />,
        items: PHASE_CATEGORIES.do.map(c => c.title),
    },
    {
        id: 'check',
        title: 'Verificar',
        subtitle: 'Evaluación de Resultados',
        description: 'Auditoría, Medición de Indicadores y Revisión Gerencial.',
        gradient: 'from-[#be123c] to-[#e11d48]', // rose
        bgGlow: 'bg-rose-500/20',
        icon: <ClipboardCheck className="w-8 h-8 text-white relative z-10" strokeWidth={1.5} />,
        items: PHASE_CATEGORIES.check.map(c => c.title),
    },
    {
        id: 'act',
        title: 'Actuar',
        subtitle: 'Mejora Continua del Sistema',
        description: 'Manejo de Acciones Correctivas y Preventivas (ACPM).',
        gradient: 'from-[#0e7490] to-[#0891b2]', // cyan
        bgGlow: 'bg-cyan-500/20',
        icon: <BarChart2 className="w-8 h-8 text-white relative z-10" strokeWidth={1.5} />,
        items: PHASE_CATEGORIES.act.map(c => c.title),
    },
];

const OrganicBlob = () => (
    <svg className="absolute top-0 right-0 w-64 h-64 opacity-20 transform translate-x-12 -translate-y-8 transition-transform duration-[1200ms] group-hover:scale-[1.35] group-hover:-rotate-[15deg] pointer-events-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="#ffffff" d="M47.7,-67.2C61.4,-57.1,71.5,-41.8,78.2,-24.5C84.9,-7.2,88.2,12.1,81.3,28.8C74.4,45.5,57.3,59.6,39.6,68.4C21.9,77.2,3.6,80.7,-14.2,78.7C-32,76.7,-49.3,69.2,-64.1,56.5C-78.9,43.8,-91.2,25.9,-93.8,6.8C-96.4,-12.3,-89.3,-32.6,-76.3,-48.1C-63.3,-63.6,-44.4,-74.3,-26.8,-76.6C-9.2,-78.9,7.1,-72.8,22.8,-71.8C38.5,-70.8,34,-77.3,47.7,-67.2Z" transform="translate(100 100)" />
    </svg>
);

const HeaderWaves = () => (
    <svg className="absolute bottom-0 left-0 w-full opacity-10 pointer-events-none dark:opacity-5" preserveAspectRatio="none" viewBox="0 0 1440 320" style={{ height: '60%' }}>
        <path fill="#ffffff" d="M0,160L40,144C80,128,160,96,240,112C320,128,400,192,480,213.3C560,235,640,213,720,186.7C800,160,880,128,960,138.7C1040,149,1120,203,1200,213.3C1280,224,1360,192,1400,176L1440,160L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z" />
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
        return (
            <PhaseDetail
                phase={selectedPhase}
                onBack={() => setSearchParams({})}
                navVisible={navVisible}
                setNavVisible={setNavVisible}
            />
        );
    }

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-surface-primary pb-20 scroll-smooth">
            
            {/* ═══ Header Section (Premium Redesign) ═══ */}
            <header className="relative bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 px-6 py-10 shadow-xl overflow-hidden shrink-0 border-b border-border-light dark:from-gray-900 dark:via-gray-900 dark:to-teal-950">
                <HeaderWaves />
                
                {/* Decorative glowing orb */}
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-teal-400/20 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    {/* Left: Title & Sidebar toggle */}
                    <div className="flex items-start lg:items-center gap-5">
                        {!navVisible && (
                            <button 
                                onClick={() => setNavVisible(true)}
                                className="hidden md:flex shrink-0 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors shadow-lg mt-1 lg:mt-0"
                            >
                                <OpenSidebar setNavVisible={setNavVisible} />
                            </button>
                        )}
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-1.5 bg-gradient-to-b from-teal-300 to-emerald-400 rounded-full" />
                                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-teal-100">
                                    Sistema Estratégico SST
                                </h1>
                            </div>
                            <p className="text-teal-100/90 font-medium ml-4 text-sm sm:text-base">Ciclo de Mejora Continua (PHVA) & Análisis Predictivo IA</p>
                        </div>
                    </div>

                    {/* Right: Integrated Company Info Widget */}
                    <button
                        onClick={() => setShowCompanyInfo(true)}
                        className="group relative flex items-center gap-4 bg-white/10 backdrop-blur-lg border border-white/20 px-5 py-3.5 rounded-2xl hover:bg-white/20 transition-all duration-[400ms] hover:shadow-[0_8px_32px_rgba(20,184,166,0.3)] hover:-translate-y-0.5 overflow-hidden w-full lg:w-auto text-left"
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1200ms] pointer-events-none" />
                        
                        <div className="p-3 bg-gradient-to-br from-teal-500/30 to-teal-700/30 border border-white/20 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <Building2 className="h-6 w-6 text-teal-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-teal-200/80 font-black mb-1">Entidad Evaluada</p>
                            <p className="text-sm font-bold text-white truncate max-w-[200px] leading-tight">
                                {companyInfo?.companyName || 'Configurar Organización'}
                            </p>
                            {companyInfo?.riskLevel && (
                                <p className="text-xs text-teal-100/70 mt-1 uppercase">Clase Riesgo ARL: {companyInfo.riskLevel}</p>
                            )}
                        </div>
                        <div className="pl-2 border-l border-white/20 h-10 flex items-center">
                            <ChevronRight className="h-6 w-6 text-teal-100 opacity-50 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300" />
                        </div>
                    </button>
                </div>
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

                {/* ═══ Predictive AI Dashboard (Native Integration) ═══ */}
                <section className="animate-in fade-in slide-in-from-bottom-8 duration-[800ms] fill-mode-both">
                    <div className="flex items-center gap-3 mb-6 px-1">
                        <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                            <BrainCircuit className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-text-primary tracking-tight">Centro de Inteligencia Predictiva</h2>
                            <p className="text-sm text-text-secondary font-medium mt-0.5">Monitoreo dinámico del ecosistema SST alimentado por IA.</p>
                        </div>
                    </div>
                    
                    <div className="bg-surface-primary dark:bg-[#1a1a1a] rounded-3xl overflow-hidden transition-all shadow-sm">
                        <DashboardPredictivo />
                    </div>
                </section>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-border-medium to-transparent opacity-50 my-8" />

                {/* ═══ PHVA Phase Grid (Dynamic SVGs) ═══ */}
                <section className="animate-in fade-in slide-in-from-bottom-12 duration-[1000ms] fill-mode-both">
                    <div className="flex items-center gap-3 mb-8 px-1">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <Activity className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-text-primary tracking-tight">Gestión Operativa PHVA</h2>
                            <p className="text-sm text-text-secondary font-medium mt-0.5">Navegación por las fases del ciclo de mejora continua.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                        {phases.map((phase, i) => (
                            <div
                                key={phase.id}
                                onClick={() => handlePhaseSelect(phase)}
                                className="group relative cursor-pointer flex flex-col rounded-[24px] border border-border-medium bg-surface-primary hover:bg-surface-secondary transition-all duration-500 ease-out shadow-sm hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-2 overflow-hidden"
                                style={{ animationDelay: `${i * 150}ms` }}
                            >
                                {/* Dynamic Glow Behind Card content */}
                                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${phase.bgGlow} -translate-y-1/2 translate-x-1/4 pointer-events-none`} />

                                {/* Card Header (Colored section) */}
                                <div className={`relative p-8 pb-12 bg-gradient-to-br ${phase.gradient} overflow-hidden`}>
                                    <OrganicBlob />
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner border border-white/30 transform transition-transform duration-500 group-hover:scale-105">
                                            {phase.icon}
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-md rounded-full px-3 py-1 border border-white/30 text-white text-[10px] font-black tracking-[0.2em] uppercase shadow-sm">
                                            Fase 0{i+1}
                                        </div>
                                    </div>
                                    <div className="relative z-10 mt-6 text-white text-left">
                                        <h2 className="text-3xl font-black tracking-tight leading-none mb-2">{phase.title}</h2>
                                        <p className="text-white/80 font-semibold text-sm leading-tight pr-4">{phase.subtitle}</p>
                                    </div>
                                </div>

                                {/* Content Block (White overlay) */}
                                <div className="relative p-7 pt-7 flex-1 flex flex-col bg-surface-primary rounded-t-[24px] -mt-6 border-t border-white/10 dark:border-white/5">
                                    <p className="text-[13px] font-medium text-text-secondary leading-relaxed pb-5 border-b border-border-light mb-5">{phase.description}</p>
                                    
                                    <ul className="space-y-3.5 mt-auto">
                                        {phase.items.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-3 group/item">
                                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-border-heavy shrink-0 transition-all duration-300 group-hover/item:bg-gradient-to-r group-hover/item:scale-150" />
                                                <span className="text-xs font-semibold text-text-secondary group-hover/item:text-text-primary transition-colors leading-snug truncate">
                                                    {item}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Bottom Hover Gradient Bar */}
                                <div className={`absolute bottom-0 left-0 h-2 w-0 bg-gradient-to-r ${phase.gradient} transition-all duration-700 ease-in-out group-hover:w-full`} />
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <CompanyInfoModal isOpen={showCompanyInfo} onClose={handleModalClose} />
        </div>
    );
}
