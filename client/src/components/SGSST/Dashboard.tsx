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
    Box,
    UserCircle
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
        title: 'Consciencia y Contexto',
        subtitle: 'Conociendo al individuo',
        description: 'Perfiles de Cargo (Roles), Perfil Sociodemográfico, Condiciones de Salud y Diagnóstico Inicial.',
        extendedPhilosophy: 'El viaje preventivo comienza desde la comprensión profunda de dónde estamos y quiénes somos. Antes de intervenir el entorno o establecer reglas normativas, debemos diagnosticar el estado del "cuerpo corporativo" y de sus individuos, creando una línea base fundamental para que cualquier acción posterior sea humana y precisa.',
        accent: 'text-[#10b981]',
        bgGlow: 'bg-[#10b981]/5',
        borderHover: 'hover:border-[#10b981]',
        icon: <UserCircle className="w-8 h-8 text-[#10b981] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
    },
    {
        id: 'do',
        title: 'Interacción y Entorno',
        subtitle: 'Diseño consciente de espacios',
        description: 'Participación y Peligros IPEVAR, Método OWAS, Permiso en Alturas, ATS y Vulnerabilidad.',
        extendedPhilosophy: 'No se trata de cumplir procesos operativos aleatorios, sino de garantizar que cada interacción biomecánica y ambiental sea inherentemente segura. Aquí escuchamos al trabajador frente a sus riesgos cotidianos y mitigamos proactivamente el ecosistema físico y mental que habita día a día.',
        accent: 'text-[#0d9488]',
        bgGlow: 'bg-[#0d9488]/5',
        borderHover: 'hover:border-[#0d9488]',
        icon: <Activity className="w-8 h-8 text-[#0d9488] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
    },
    {
        id: 'check',
        title: 'Marco de Cuidado',
        subtitle: 'Acuerdos y cultura protectora',
        description: 'Políticas y Objetivos SST, Reglamento Interno y de Higiene, Matriz Legal y Responsable SG-SST.',
        extendedPhilosophy: 'Reemplazamos la "obligación documental" por un sistema de pactos, reglas de convivencia y normatividad que estructuran una red protectora alrededor de toda la comunidad corporativa. Es el baluarte institucional del bienestar ético.',
        accent: 'text-[#059669]',
        bgGlow: 'bg-[#059669]/5',
        borderHover: 'hover:border-[#059669]',
        icon: <ShieldAlert className="w-8 h-8 text-[#059669] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
    },
    {
        id: 'act',
        title: 'Resiliencia y Evolución',
        subtitle: 'Aprendizaje continuo del ecosistema',
        description: 'Reporte de Actos, Investigación y Estadísticas ATEL, Auditoría, Alta Dirección y Matriz ACPM.',
        extendedPhilosophy: 'Los incidentes no son castigos, sino lecciones. En esta etapa el sistema entero escucha las fallas en el bienestar humano para accionar soluciones profundas, permitiéndole a la organización sanar, adaptarse y evolucionar con el tiempo.',
        accent: 'text-[#14b8a6]',
        bgGlow: 'bg-[#14b8a6]/5',
        borderHover: 'hover:border-[#14b8a6]',
        icon: <BrainCircuit className="w-8 h-8 text-[#14b8a6] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
    },
    {
        id: 'predict',
        title: 'Inteligencia Predictiva',
        subtitle: 'Visión extendida con IA',
        description: 'Monitoreo dinámico del ecosistema mediante datos cruzados y análisis probabilístico avanzado.',
        extendedPhilosophy: 'El futuro de la prevención radica en anticiparnos. Al cruzar todas las métricas del viaje del trabajador, la red neuronal y nuestros modelos probabilísticos detectan tendencias perjudiciales, dándonos el poder de salvaguardar el bienestar antes de que el riesgo se materialice.',
        accent: 'text-[#8b5cf6]',
        bgGlow: 'bg-[#8b5cf6]/5',
        borderHover: 'hover:border-[#8b5cf6]',
        icon: <BrainCircuit className="w-8 h-8 text-[#8b5cf6] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
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
                            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Somos SST</h1>
                            <p className="text-text-secondary mt-1 text-sm font-medium">Por una Seguridad y Salud integral para el bienestar del bioindividuo.</p>
                        </div>
                    </div>
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

                {/* ═══ Roadmap (Timeline) Section ═══ */}
                <section className="animate-in fade-in slide-in-from-bottom-8 duration-[800ms] fill-mode-both">
                    <div className="flex items-center justify-center flex-col text-center gap-3 mb-16 pt-4 px-4">
                        <div className="p-3 rounded-2xl bg-[#10b981]/10 dark:bg-[#10b981]/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <Box className="h-6 w-6 text-[#10b981] animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter drop-shadow-sm">Ruta del Bienestar Integral</h2>
                            <p className="text-sm md:text-base text-text-secondary font-medium mt-2 max-w-2xl mx-auto">Hoja de ruta viva centrada en la protección, equilibrio y evolución del bioindividuo dentro de nuestra organización.</p>
                        </div>
                    </div>

                    <div className="relative flex flex-col gap-16 lg:gap-24 w-full py-6 mx-auto max-w-5xl">
                        {/* Línea Central Conectora */}
                        <div className="absolute top-0 bottom-0 left-[34px] lg:left-1/2 w-1 -translate-x-1/2 bg-gradient-to-b from-[#10b981] via-[#0d9488] to-[#14b8a6] opacity-30 dark:opacity-40 rounded-full" />
                        
                        {phases.map((phase, i) => {
                            const isEven = i % 2 === 1;
                            return (
                                <div 
                                    key={phase.id} 
                                    className={cn(
                                        "relative flex flex-col lg:flex-row items-center w-full gap-4", 
                                        isEven ? "lg:flex-row-reverse" : ""
                                    )}
                                    style={{ animationDelay: `${i * 150}ms` }}
                                >
                                    {/* Nodo Central (Icono con latido) */}
                                    <div className="absolute left-[34px] lg:left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-surface-primary border-4 border-surface-secondary shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                                        <div className="relative flex items-center justify-center w-full h-full rounded-full bg-surface-secondary overflow-hidden">
                                            <span className="absolute inline-flex h-full w-full rounded-full opacity-30 animate-ping duration-1000 bg-current" style={{ color: phase.accent.replace('text-', '') }}></span>
                                            <div className="scale-75 md:scale-[0.85] origin-center">{phase.icon}</div>
                                        </div>
                                    </div>

                                    {/* Contenedor de Tarjeta (Espaciado adaptativo) */}
                                    <div className={cn("w-full pl-[86px] lg:pl-0 lg:w-1/2 flex", isEven ? "lg:pr-14 lg:justify-end" : "lg:pl-14 lg:justify-start")}>
                                        <div
                                            onClick={() => handlePhaseSelect(phase)}
                                            className={cn(
                                                "group relative cursor-pointer flex flex-col w-full max-w-lg rounded-[2rem] border border-border-light dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-3xl shadow-xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] transition-all duration-500 hover:-translate-y-2 overflow-hidden",
                                                phase.borderHover
                                            )}
                                        >
                                            {/* Glow de Fondo Intenso */}
                                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${phase.bgGlow} pointer-events-none`} />

                                            {/* Blob Orgánico de Adorno */}
                                            <div className="absolute top-0 right-0 w-40 h-40 opacity-10 pointer-events-none group-hover:scale-[1.4] transition-transform duration-[1.2s] ease-out">
                                                <svg className={cn("w-full h-full transform translate-x-10 -translate-y-10", phase.accent)} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                                    <path fill="currentColor" d="M47.7,-67.2C61.4,-57.1,71.5,-41.8,78.2,-24.5C84.9,-7.2,88.2,12.1,81.3,28.8C74.4,45.5,57.3,59.6,39.6,68.4C21.9,77.2,3.6,80.7,-14.2,78.7C-32,76.7,-49.3,69.2,-64.1,56.5C-78.9,43.8,-91.2,25.9,-93.8,6.8C-96.4,-12.3,-89.3,-32.6,-76.3,-48.1C-63.3,-63.6,-44.4,-74.3,-26.8,-76.6C-9.2,-78.9,7.1,-72.8,22.8,-71.8C38.5,-70.8,34,-77.3,47.7,-67.2Z" transform="translate(100 100)" />
                                                </svg>
                                            </div>

                                            <div className="relative p-6 sm:p-8 flex flex-col flex-1 z-10 w-full">
                                                <div className="mb-4">
                                                    <div className="inline-block bg-surface-secondary dark:bg-black/60 rounded-full px-4 py-1.5 border border-border-medium text-text-secondary text-[11px] font-black tracking-[0.25em] uppercase shadow-sm">
                                                        Hito 0{i+1}
                                                    </div>
                                                </div>
                                                
                                                <div className="text-left flex flex-col flex-1">
                                                    <h2 className={cn("text-2xl sm:text-3xl font-black tracking-tight leading-none mb-3 text-text-primary transition-colors", `group-hover:${phase.accent}`)}>
                                                        {phase.title}
                                                    </h2>
                                                    <p className="text-text-secondary font-bold text-xs uppercase tracking-wider mb-4 opacity-80">
                                                        {phase.subtitle}
                                                    </p>
                                                    <p className="text-sm font-medium text-text-secondary leading-relaxed md:leading-loose opacity-90 mt-auto pt-2 border-t border-border-light pt-4 dark:border-white/10">
                                                        {phase.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Bloque espaciador para empujar la tarjeta hacia un lado (Desktop Only) */}
                                    <div className="hidden lg:block lg:w-1/2" />
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            <CompanyInfoModal isOpen={showCompanyInfo} onClose={handleModalClose} />
        </div>
    );
}
