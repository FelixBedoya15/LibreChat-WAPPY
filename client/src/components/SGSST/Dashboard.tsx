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
    UserCircle,
    ArrowLeft,
    Target,
    GitMerge
} from 'lucide-react';
import { cn } from '~/utils';
import { OpenSidebar } from '~/components/Chat/Menus';
import { useToastContext } from '@librechat/client';
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
const getSuperPhases = () => [
    {
        id: 'bio_motor',
        title: 'MOTOR BIO-INDIVIDUAL',
        subtitle: 'El Ecosistema Vivo',
        description: 'Huella Biocéntrica, Dinámica de Exposición, Bio-Evaluación (Matriz), Traumatismo y Predicción IA.',
        extendedPhilosophy: 'El viaje preventivo comienza reconociendo que cada individuo posee variaciones únicas. El entorno y los peligros no son estáticos; interactúan orgánicamente con la biología y la psicología del trabajador en tiempo real para predecir y evitar el daño sistémico.',
        accent: 'text-[#10b981]',
        bgGlow: 'bg-[#10b981]/5',
        borderHover: 'hover:border-[#10b981]',
        icon: <Activity className="w-8 h-8 text-[#10b981] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
    },
    {
        id: 'boveda_legal',
        title: 'SALUD ORGANIZACIONAL',
        subtitle: 'Gestión y Prevención (PHVA)',
        description: 'Planear, Hacer, Verificar y Actuar (Resolución 0312 y Decreto 1072).',
        extendedPhilosophy: 'El marco estructural de procesos, políticas y auditorías que sostiene la salud de la organización y asegura el cumplimiento de los estándares legales de prevención.',
        accent: 'text-[#0d9488]',
        bgGlow: 'bg-[#0d9488]/5',
        borderHover: 'hover:border-[#0d9488]',
        icon: <ShieldAlert className="w-8 h-8 text-[#0d9488] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
    }
];

const getSubPhases = (superId: string) => {
    if (superId === 'bio_motor') {
        return [
            {
                id: 'hito1', title: 'Huella Biocéntrica', subtitle: 'Origen', description: 'Perfiles de Cargo, Perfil Sociodemográfico y Condiciones de Salud.',
                extendedPhilosophy: 'El viaje preventivo comienza reconociendo que cada individuo posee variaciones únicas de edad, metabolismo y co-exposiciones.',
                accent: 'text-[#10b981]', bgGlow: 'bg-[#10b981]/5', borderHover: 'hover:border-[#10b981]',
                icon: <UserCircle className="w-8 h-8 text-[#10b981] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
                label: 'HITO 01'
            },
            {
                id: 'hito2', title: 'Núcleo Bio-Evaluativo', subtitle: 'Procesamiento', description: 'Matriz Bio-IPEVAR.',
                extendedPhilosophy: 'Hub centralizado de consciencia bio-individual. Evalúa la interacción entre los peligros del cargo y el organismo único del trabajador.',
                accent: 'text-[#059669]', bgGlow: 'bg-[#059669]/5', borderHover: 'hover:border-[#059669]',
                icon: <ShieldAlert className="w-8 h-8 text-[#059669] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
                label: 'HITO 02'
            },
            {
                id: 'hito3', title: 'Dinámica de Exposición', subtitle: 'Acción y Percepción', description: 'Participación IPEVAR, Reportes, Capacitaciones, ATS, Permisos y OWAS.',
                extendedPhilosophy: 'El riesgo se materializa en la fisiología de cada persona. Buscamos medir el contacto real con los peligros.',
                accent: 'text-[#0d9488]', bgGlow: 'bg-[#0d9488]/5', borderHover: 'hover:border-[#0d9488]',
                icon: <Activity className="w-8 h-8 text-[#0d9488] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
                label: 'HITO 03'
            },
            {
                id: 'hito4', title: 'Traumatismo y Curación', subtitle: 'Retroalimentación', description: 'Estadísticas ATEL e Investigación ATEL.',
                extendedPhilosophy: 'Mapas cuantitativos y biométricos que muestran el sangrado o desequilibrio sistémico. Dónde perdimos salud.',
                accent: 'text-[#14b8a6]', bgGlow: 'bg-[#14b8a6]/5', borderHover: 'hover:border-[#14b8a6]',
                icon: <BarChart2 className="w-8 h-8 text-[#14b8a6] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
                label: 'HITO 04'
            },
            {
                id: 'hito5', title: 'Oráculo Predictivo', subtitle: 'Inteligencia Artificial', description: 'Centro de Inteligencia Predictiva.',
                extendedPhilosophy: 'Al cruzar la data fisiológica, las costumbres de vida y el riesgo del entorno, nuestros algoritmos probabilísticos detectan tendencias.',
                accent: 'text-[#8b5cf6]', bgGlow: 'bg-[#8b5cf6]/5', borderHover: 'hover:border-[#8b5cf6]',
                icon: <BrainCircuit className="w-8 h-8 text-[#8b5cf6] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
                label: 'HITO 05'
            }
        ];
    }
    if (superId === 'boveda_legal') {
        return [
            {
                id: 'planear', title: 'Planear', subtitle: 'Diseño del Sistema', description: 'Diagnóstico, Política, Objetivos, Matriz Legal, Reglamentos y Responsable.',
                extendedPhilosophy: 'El manifiesto ético y la alienación de nuestros estándares internos con las promesas de bienestar exigidas por la ley.',
                accent: 'text-[#10b981]', bgGlow: 'bg-[#10b981]/5', borderHover: 'hover:border-[#10b981]',
                icon: <FileText className="w-8 h-8 text-[#10b981] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
                label: 'FASE 01'
            },
            {
                id: 'hacer', title: 'Hacer', subtitle: 'Implementación', description: 'Análisis de Vulnerabilidad.',
                extendedPhilosophy: 'Ejecución de los planes de emergencia y preparación estructural.',
                accent: 'text-[#0d9488]', bgGlow: 'bg-[#0d9488]/5', borderHover: 'hover:border-[#0d9488]',
                icon: <Target className="w-8 h-8 text-[#0d9488] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
                label: 'FASE 02'
            },
            {
                id: 'verificar', title: 'Verificar', subtitle: 'Auditoría', description: 'Informe de Auditoría y Revisión por Alta Dirección.',
                extendedPhilosophy: 'Meditación introspectiva de todo nuestro diseño organizativo. Un espejo para detectar fallas sistémicas a tiempo.',
                accent: 'text-[#059669]', bgGlow: 'bg-[#059669]/5', borderHover: 'hover:border-[#059669]',
                icon: <ClipboardCheck className="w-8 h-8 text-[#059669] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
                label: 'FASE 03'
            },
            {
                id: 'actuar', title: 'Actuar', subtitle: 'Mejora Continua', description: 'Matriz ACPM.',
                extendedPhilosophy: 'Acciones Correctivas y Preventivas reales. El testamento de que aprendimos de las heridas para evolucionar.',
                accent: 'text-[#14b8a6]', bgGlow: 'bg-[#14b8a6]/5', borderHover: 'hover:border-[#14b8a6]',
                icon: <GitMerge className="w-8 h-8 text-[#14b8a6] relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />,
                label: 'FASE 04'
            }
        ];
    }
    return [];
};

const OrganicBlob = () => (
    <svg className="absolute top-0 right-0 w-64 h-64 opacity-20 transform translate-x-12 -translate-y-8 transition-transform duration-[1200ms] group-hover:scale-[1.35] group-hover:-rotate-[15deg] pointer-events-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="#ffffff" d="M47.7,-67.2C61.4,-57.1,71.5,-41.8,78.2,-24.5C84.9,-7.2,88.2,12.1,81.3,28.8C74.4,45.5,57.3,59.6,39.6,68.4C21.9,77.2,3.6,80.7,-14.2,78.7C-32,76.7,-49.3,69.2,-64.1,56.5C-78.9,43.8,-91.2,25.9,-93.8,6.8C-96.4,-12.3,-89.3,-32.6,-76.3,-48.1C-63.3,-63.6,-44.4,-74.3,-26.8,-76.6C-9.2,-78.9,7.1,-72.8,22.8,-71.8C38.5,-70.8,34,-77.3,47.7,-67.2Z" transform="translate(100 100)" />
    </svg>
);

export default function SGSSTDashboard() {
    const { user, token } = useAuthContext();
    const { navVisible, setNavVisible } = useOutletContext<ContextType>();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useToastContext();
    
    // State
    const [disabledApps, setDisabledApps] = useState<string[]>([]);
    const isAdmin = user?.role === 'ADMIN';
    const [selectedSuperPhase, setSelectedSuperPhase] = useState<any>(null);
    const [selectedSubPhase, setSelectedSubPhase] = useState<any>(null);
    const [showCompanyInfo, setShowCompanyInfo] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const hasCheckedRef = React.useRef(false);
    const superPhases = getSuperPhases();

    useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/config', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data && Array.isArray(data.disabledApps)) {
                    setDisabledApps(data.disabledApps);
                }
            }).catch(console.error);
    }, [token]);

    const handleToggleApp = async (categoryId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAdmin) return;

        const currentlyDisabled = disabledApps.includes(categoryId);
        const newDisabledStatus = !currentlyDisabled;

        setDisabledApps(prev => 
            newDisabledStatus 
                ? [...prev, categoryId] 
                : prev.filter(id => id !== categoryId)
        );

        try {
            const res = await fetch('/api/sgsst/config/toggle', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ appId: categoryId, disabled: newDisabledStatus })
            });
            if (!res.ok) throw new Error('Request error');
        } catch(err) {
            console.error(err);
            setDisabledApps(prev => 
                !newDisabledStatus 
                    ? [...prev, categoryId] 
                    : prev.filter(id => id !== categoryId)
            );
        }
    };

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
        const SGSST_MODULE_PHASE_MAP: Record<string, {super: string, sub: string}> = {
            reporte_actos: {super: 'bio_motor', sub: 'hito3'},
            participacion_ipevar: {super: 'bio_motor', sub: 'hito3'},
            peligros: {super: 'bio_motor', sub: 'hito2'},
            alta_direccion: {super: 'boveda_legal', sub: 'verificar'},
        };
        const handler = (e: Event) => {
            const { module } = (e as CustomEvent).detail || {};
            if (!module) return;
            const mapping = SGSST_MODULE_PHASE_MAP[module] || {super: 'bio_motor', sub: 'hito3'};
            setSearchParams({ super: mapping.super, sub: mapping.sub, module });
        };
        window.addEventListener('navigate-sgsst', handler);
        return () => window.removeEventListener('navigate-sgsst', handler);
    }, [setSearchParams]);

    // ─── URL Sync ──────────────────────────────────────────────────────────
    useEffect(() => {
        const superId = searchParams.get('super');
        const subId = searchParams.get('sub');
        
        if (superId) {
            const superP = superPhases.find(p => p.id === superId);
            setSelectedSuperPhase(superP || null);
            
            if (subId && superP) {
                const subP = getSubPhases(superId).find(p => p.id === subId);
                setSelectedSubPhase(subP || null);
            } else {
                setSelectedSubPhase(null);
            }
        } else {
            setSelectedSuperPhase(null);
            setSelectedSubPhase(null);
        }
    }, [searchParams]);

    const handlePhaseSelect = (phase: any) => {
        if (missingFields.length > 0) {
            setShowCompanyInfo(true);
            return;
        }

        if (disabledApps.includes(phase.id) && !isAdmin) {
            showToast({ message: 'Este módulo se encuentra desactivado', status: 'warning' });
            return;
        }
        
        // If we are currently at Level 1, navigating to Level 2
        if (!selectedSuperPhase) {
            setSearchParams({ super: phase.id });
        } 
        // If we are at Level 2, navigating to Level 3 (SubPhase)
        else {
            setSearchParams({ super: selectedSuperPhase.id, sub: phase.id });
        }
    };

    if (selectedSubPhase) {
        const moduleParam = searchParams.get('module') || undefined;
        return (
            <PhaseDetail
                phase={selectedSubPhase}
                onBack={() => setSearchParams({ super: selectedSuperPhase.id })}
                navVisible={navVisible}
                setNavVisible={setNavVisible}
                autoOpenModule={moduleParam}
            />
        );
    }

    const isLevel2 = !!selectedSuperPhase;
    const currentPhases = isLevel2 ? getSubPhases(selectedSuperPhase.id) : superPhases;

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
                        {isLevel2 ? (
                            <>
                                <button 
                                    onClick={() => setSearchParams({})}
                                    className="p-3 bg-surface-secondary border border-border-medium rounded-xl hover:bg-surface-hover hover:scale-105 transition-all"
                                >
                                    <ArrowLeft className="h-6 w-6 text-text-primary" />
                                </button>
                                <div className="bg-[#10b981]/10 p-3.5 rounded-2xl dark:bg-[#10b981]/20">
                                    <Activity className="h-8 w-8 text-[#10b981]" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                                        {selectedSuperPhase.id === 'bio_motor' ? 'SST Bio-Individual' : 'Salud Organizacional'}
                                    </h1>
                                    <p className="text-text-secondary mt-1 text-sm font-medium">
                                        {selectedSuperPhase.id === 'bio_motor' 
                                            ? 'Metodología centrada en el bio-monitoreo del individuo.' 
                                            : 'Gestión y auditoría del sistema de prevención P-H-V-A para la salud corporativa.'}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-blue-500/10 p-3.5 rounded-2xl dark:bg-blue-500/20">
                                    <ShieldAlert className="h-8 w-8 text-blue-500" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">SOMOS SST</h1>
                                    <p className="text-text-secondary mt-1 text-sm font-medium">Seleccione el ecosistema para gestionar la prevención o la legalidad.</p>
                                </div>
                            </>
                        )}
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
                            <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter drop-shadow-sm">
                                {!isLevel2 
                                    ? 'Arquitectura del Sistema' 
                                    : selectedSuperPhase.id === 'bio_motor' 
                                        ? 'Ruta del Bienestar Integral'
                                        : 'Ciclo de Mejora Continua PHVA'}
                            </h2>
                            <p className="text-sm md:text-base text-text-secondary font-medium mt-2 max-w-2xl mx-auto">
                                {!isLevel2 
                                    ? 'Navegue entre la prevención individual biocéntrica y la estructura de salud de la organización.'
                                    : selectedSuperPhase.id === 'bio_motor'
                                        ? 'Hoja de ruta viva centrada en la protección, equilibrio y evolución del bioindividuo dentro de nuestra organización.'
                                        : 'Marco de gestión de salud en la organización para el cuidado mutuo y el cumplimiento legal.'}
                            </p>
                        </div>
                    </div>

                    <div className="relative flex flex-col gap-16 lg:gap-24 w-full py-6 mx-auto max-w-5xl">
                        {/* Línea Central Conectora */}
                        <div className="absolute top-0 bottom-0 left-[34px] lg:left-1/2 w-1 -translate-x-1/2 bg-gradient-to-b from-[#10b981] via-[#0d9488] to-[#14b8a6] opacity-30 dark:opacity-40 rounded-full" />
                        
                        {currentPhases.map((phase, i) => {
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
                                                {phase.label ? (
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <div className="inline-block bg-surface-secondary dark:bg-black/60 rounded-full px-4 py-1.5 border border-border-medium text-text-secondary text-[11px] font-black tracking-[0.25em] uppercase shadow-sm">
                                                            {phase.label}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mb-4 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <div className="inline-block bg-surface-secondary dark:bg-black/60 rounded-full px-4 py-1.5 border border-border-medium text-text-secondary text-[11px] font-black tracking-[0.25em] uppercase shadow-sm">
                                                                MÓDULO PRINCIPAL
                                                            </div>
                                                            {phase.id === 'boveda_legal' && (
                                                                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 dark:border-amber-500/40 rounded-full px-3 py-1.5 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold tracking-wider uppercase shadow-sm animate-pulse">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                                    En construcción
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isAdmin && phase.id === 'boveda_legal' && (
                                                            <div 
                                                                className="flex items-center bg-surface-secondary/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border-light dark:border-white/10 hover:bg-surface-tertiary transition-all shadow-sm z-20 cursor-pointer"
                                                                onClick={(e) => handleToggleApp(phase.id, e)}
                                                                title={disabledApps.includes(phase.id) ? "Módulo Oculto: Clic para mostrar" : "Módulo Visible: Clic para ocultar"}
                                                            >
                                                                <div className="relative inline-flex items-center cursor-pointer my-1 mx-1">
                                                                    <div className={`w-9 h-5 rounded-full transition-colors ${!disabledApps.includes(phase.id) ? 'bg-teal-500' : 'bg-surface-tertiary border border-border-medium'}`}></div>
                                                                    <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow-md transition-transform ${!disabledApps.includes(phase.id) ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                                </div>
                                                                <span className={`ml-2 text-[10px] font-black uppercase tracking-wider ${!disabledApps.includes(phase.id) ? 'text-teal-600 dark:text-teal-400' : 'text-text-secondary text-opacity-50'}`}>
                                                                    {!disabledApps.includes(phase.id) ? 'ACTIVO' : 'INACT.'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
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
