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
import { useSSTProgress, LEVELS } from './useSSTProgress';
import SSTMissionEngine from './SSTMissionEngine';
import './sst-bit.css';


const REQUIRED_FIELDS = [
    'companyName', 'nit', 'legalRepresentative', 'workerCount',
    'arl', 'economicActivity', 'riskLevel', 'ciiu',
    'address', 'city', 'phone', 'email',
    'sector', 'responsibleSST', 'generalActivities',
] as const;

// ─── Retro Phase Definitions ────────────────────────────────────────────────────
const RETRO_PHASES = [
    {
        id: 'plan',
        label: 'PLANEAR',
        sublabel: 'POLÍTICA · PERFILES · LEGAL',
        desc: 'Política, Objetivos, Diagnóstico, Matrices y Requisitos Legales.',
        num: '01',
        accent: '#4ade80',
        bg: '#14532d',
        xpReward: 50,
        modules: (PHASE_CATEGORIES.plan ?? []).length,
    },
    {
        id: 'do',
        label: 'HACER',
        sublabel: 'IPEVAR · ACTOS · EPP',
        desc: 'Reporte de Actos, Investigación ATEL, Método OWAS, IPEVAR.',
        num: '02',
        accent: '#fbbf24',
        bg: '#78350f',
        xpReward: 60,
        modules: (PHASE_CATEGORIES.do ?? []).length,
    },
    {
        id: 'check',
        label: 'VERIFICAR',
        sublabel: 'AUDITORÍA · INDICADORES',
        desc: 'Auditorías, Revisión Alta Dirección e Indicadores de Gestión.',
        num: '03',
        accent: '#f87171',
        bg: '#7f1d1d',
        xpReward: 40,
        modules: (PHASE_CATEGORIES.check ?? []).length,
    },
    {
        id: 'act',
        label: 'ACTUAR',
        sublabel: 'ACPM · MEJORA CONTINUA',
        desc: 'Acciones Correctivas, Preventivas y de Mejora Continua.',
        num: '04',
        accent: '#c084fc',
        bg: '#4c1d95',
        xpReward: 45,
        modules: (PHASE_CATEGORIES.act ?? []).length,
    },
];

const getPhases = () => RETRO_PHASES;

const OrganicBlob = () => (
    <svg className="absolute top-0 right-0 w-64 h-64 opacity-20 transform translate-x-12 -translate-y-8 transition-transform duration-[1200ms] group-hover:scale-[1.35] group-hover:-rotate-[15deg] pointer-events-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="#ffffff" d="M47.7,-67.2C61.4,-57.1,71.5,-41.8,78.2,-24.5C84.9,-7.2,88.2,12.1,81.3,28.8C74.4,45.5,57.3,59.6,39.6,68.4C21.9,77.2,3.6,80.7,-14.2,78.7C-32,76.7,-49.3,69.2,-64.1,56.5C-78.9,43.8,-91.2,25.9,-93.8,6.8C-96.4,-12.3,-89.3,-32.6,-76.3,-48.1C-63.3,-63.6,-44.4,-74.3,-26.8,-76.6C-9.2,-78.9,7.1,-72.8,22.8,-71.8C38.5,-70.8,34,-77.3,47.7,-67.2Z" transform="translate(100 100)" />
    </svg>
);

export default function SGSSTDashboard() {
    const { token } = useAuthContext();
    const { user } = useAuthContext();
    const { navVisible, setNavVisible } = useOutletContext<ContextType>();
    const [searchParams, setSearchParams] = useSearchParams();
    const { progress, addXP } = useSSTProgress(user?.id);

    
    // State
    const [selectedPhase, setSelectedPhase] = useState<any>(null);
    const [showCompanyInfo, setShowCompanyInfo] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [showWorldMap, setShowWorldMap] = useState(false);
    const [worldMapHp, setWorldMapHp] = useState(100);
    const hasCheckedRef = React.useRef(false);
    const phases = getPhases();

    // ─── Fetch Accident HP ──────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/reporte-actos', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => {
            const accidents = (data?.reportesList ?? []).filter((r: any) => r.estado !== 'Cerrado');
            // Each open accident reduces HP by 8 (max reduction 80, floor 20)
            const hp = Math.max(20, 100 - accidents.length * 8);
            setWorldMapHp(hp);
        })
        .catch(() => setWorldMapHp(100)); // fallback: full HP
    }, [token]);

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
        // Award XP for visiting a phase
        addXP(phase.xpReward ?? 30, `phase_visit_${phase.id}`);
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
                    <SSTWorldMap onNavigate={handleMapNavigate} hp={worldMapHp} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-[#0a0a0a] pb-20 scroll-smooth">
            
            {/* \u2500\u2500\u2500 Retro 8-bit Header HUD \u2500\u2500\u2500 */}
            <header className="bg-[#0a0a0a] border-b-4 border-green-500 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                {/* Left: sidebar + title */}
                <div className="flex items-center gap-4">
                    {!navVisible && (
                        <button onClick={() => setNavVisible(true)}
                            className="hidden md:flex shrink-0 p-2 border border-green-500 text-green-500 hover:bg-green-900/20 transition-colors">
                            <OpenSidebar setNavVisible={setNavVisible} />
                        </button>
                    )}
                    <div>
                        <h1 className="font-pixel text-green-400 uppercase" style={{ fontSize:'11px' }}>&#x2618; SOMOS SST</h1>
                        <p className="font-pixel text-gray-500 mt-1" style={{ fontSize:'6px' }}>
                            SISTEMA GAMIFICADO SG-SST v3.0
                        </p>
                    </div>
                </div>

                {/* Center: XP HUD */}
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Level badge */}
                    <div className="pixel-box px-3 py-1 flex items-center gap-2" style={{ borderColor:'#fbbf24' }}>
                        <span className="font-pixel text-yellow-400" style={{ fontSize:'7px' }}>LVL {progress.level}</span>
                        <span className="font-pixel text-white" style={{ fontSize:'6px' }}>{progress.levelName}</span>
                    </div>
                    {/* XP bar */}
                    <div className="flex items-center gap-2">
                        <span className="font-pixel text-white" style={{ fontSize:'7px' }}>XP</span>
                        <div className="w-32 h-3 bg-black border-2 border-white">
                            {(() => {
                                const lvls = LEVELS;
                                const cur  = lvls[Math.min(progress.level, lvls.length-1)].xp;
                                const next = progress.level < lvls.length-1 ? lvls[progress.level+1].xp : cur + 500;
                                const pct  = Math.min(100, Math.round(((progress.xp - cur) / (next - cur)) * 100));
                                return <div className="h-full bg-yellow-400 transition-all" style={{ width:`${pct}%` }} />;
                            })()}
                        </div>
                        <span className="font-pixel text-yellow-400" style={{ fontSize:'7px' }}>{progress.xp} XP</span>
                    </div>
                    {/* Completion */}
                    <div className="flex items-center gap-2">
                        <span className="font-pixel text-white" style={{ fontSize:'7px' }}>PROG</span>
                        <div className="w-20 h-3 bg-black border-2 border-white">
                            <div className="h-full bg-green-500 transition-all" style={{ width:`${progress.pct}%` }} />
                        </div>
                        <span className="font-pixel text-green-400" style={{ fontSize:'7px' }}>{progress.pct}%</span>
                    </div>
                </div>

                {/* Right: company + map button */}
                <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={() => setShowCompanyInfo(true)}
                        className="pixel-box flex items-center gap-2 px-3 py-2 hover:border-green-500 transition-colors">
                        <Building2 className="h-4 w-4 text-green-400" />
                        <div>
                            <p className="font-pixel text-gray-500" style={{ fontSize:'5px' }}>ENTIDAD ACTIVA</p>
                            <p className="font-pixel text-white" style={{ fontSize:'7px' }}>{companyInfo?.companyName || '???'}</p>
                        </div>
                    </button>
                    <button onClick={() => setShowWorldMap(true)}
                        className="pixel-btn bg-green-700 animate-pulse font-pixel" style={{ fontSize:'8px' }}>
                        &#x25BA; RISK MAP
                    </button>
                </div>
            </header>

            {/* Missing info warning */}
            {missingFields.length > 0 && (
                <div onClick={() => setShowCompanyInfo(true)}
                    className="mx-6 mt-4 pixel-box flex cursor-pointer items-center gap-3 px-4 py-3 border-yellow-500"
                    style={{ borderColor:'#f59e0b', backgroundColor:'#1c1400' }}>
                    <AlertTriangle className="h-5 w-5 text-yellow-500 animate-pulse flex-shrink-0" />
                    <span className="font-pixel text-yellow-400" style={{ fontSize:'7px' }}>
                        {missingFields.length} CAMPOS PENDIENTES &mdash; CONFIGURA TU ORGANIZACI&Oacute;N
                    </span>
                </div>
            )}

            {/* \u2500\u2500\u2500 LEVEL SELECT: PHVA 8-bit cards \u2500\u2500\u2500 */}
            <main className="max-w-[1400px] mx-auto w-full px-6 pt-6 pb-20 space-y-10">
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <span className="font-pixel text-green-400" style={{ fontSize:'10px' }}>&#x25CF; SELECT PHASE</span>
                        <div className="flex-1 h-px bg-green-900" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {phases.map((phase) => {
                            const completed = progress.completedModules.filter(m => m.includes(phase.id)).length;
                            const phaseModules = phase.modules || 1;
                            const phasePct = Math.min(100, Math.round((completed / phaseModules) * 100));
                            const isVisited = progress.completedModules.includes(`phase_visit_${phase.id}`);

                            return (
                                <button
                                    key={phase.id}
                                    onClick={() => handlePhaseSelect(phase)}
                                    className="pixel-box text-left group hover:scale-[1.02] transition-transform active:scale-95 w-full"
                                    style={{ borderColor: phase.accent, backgroundColor:'#0d0d0d' }}
                                >
                                    {/* Card top */}
                                    <div className="px-4 pt-4 pb-3 border-b-4" style={{ borderColor: phase.accent, backgroundColor: phase.bg }}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-pixel text-white" style={{ fontSize:'6px' }}>FASE {phase.num}</span>
                                            {isVisited
                                                ? <span className="font-pixel text-green-400" style={{ fontSize:'6px' }}>&#x2713; VISITADO</span>
                                                : <span className="font-pixel text-gray-500" style={{ fontSize:'6px' }}>&#x25CB; NUEVO</span>
                                            }
                                        </div>
                                        <h2 className="font-pixel uppercase mt-1" style={{ fontSize:'13px', color: phase.accent }}>{phase.label}</h2>
                                        <p className="font-pixel text-white mt-1" style={{ fontSize:'5px', opacity:0.7 }}>{phase.sublabel}</p>
                                    </div>
                                    {/* Card body */}
                                    <div className="px-4 py-3">
                                        <p className="font-pixel text-gray-400 mb-3" style={{ fontSize:'6px', lineHeight:'1.8' }}>{phase.desc}</p>
                                        {/* Phase progress bar */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex-1 h-2 bg-black border border-gray-700">
                                                <div className="h-full transition-all" style={{ width:`${phasePct}%`, backgroundColor: phase.accent }} />
                                            </div>
                                            <span className="font-pixel" style={{ fontSize:'6px', color: phase.accent }}>{phasePct}%</span>
                                        </div>
                                        {/* Module count + XP reward */}
                                        <div className="flex justify-between items-center">
                                            <span className="font-pixel text-gray-600" style={{ fontSize:'5px' }}>{phase.modules} MÓDULOS</span>
                                            <span className="font-pixel" style={{ fontSize:'6px', color:'#fbbf24' }}>+{phase.xpReward} XP</span>
                                        </div>
                                    </div>
                                    {/* Enter button */}
                                    <div className="px-4 pb-4">
                                        <div className="pixel-btn w-full text-center font-pixel text-[8px] text-black group-hover:opacity-90"
                                             style={{ backgroundColor: phase.accent }}>
                                            &#x25BA; ENTRAR
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Completed modules log */}
                {progress.completedModules.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="font-pixel text-yellow-400" style={{ fontSize:'9px' }}>&#x25CF; LOG DE PROGRESO</span>
                            <div className="flex-1 h-px bg-yellow-900" />
                        </div>
                        <div className="pixel-box p-4 border-yellow-600">
                            <div className="flex flex-wrap gap-2">
                                {progress.completedModules.slice(-12).map(m => (
                                    <span key={m} className="font-pixel text-[6px] px-2 py-1 border border-green-800 text-green-400 bg-green-950">
                                        &#x2713; {m.replace('phase_visit_', 'FASE ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Separator */}
                <div className="h-px w-full bg-green-900 opacity-30" />

                {/* Active Missions — History Intelligence Engine */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="font-pixel text-red-400 animate-pulse" style={{ fontSize:'10px' }}>&#x25CF; MISIONES ACTIVAS</span>
                        <div className="flex-1 h-px bg-red-900" />
                        <span className="font-pixel text-gray-600" style={{ fontSize:'6px' }}>HISTORY INTELLIGENCE ENGINE v1.0</span>
                    </div>
                    <SSTMissionEngine
                        missingFields={missingFields.length}
                        hp={worldMapHp}
                        visitedPhases={progress.completedModules}
                        onNavigate={(phaseId) => {
                            const phase = phases.find(p => p.id === phaseId);
                            if (phase) handlePhaseSelect(phase);
                        }}
                    />
                </section>

                {/* Separator */}
                <div className="h-px w-full bg-purple-900 opacity-30" />

                {/* Predictive AI section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <span className="font-pixel text-purple-400" style={{ fontSize:'10px' }}>&#x25CF; INTELIGENCIA PREDICTIVA</span>
                        <div className="flex-1 h-px bg-purple-900" />
                    </div>
                    <div className="border-4 border-purple-800 bg-[#0d0d0d]">
                        <DashboardPredictivo />
                    </div>
                </section>

            </main>

            <CompanyInfoModal isOpen={showCompanyInfo} onClose={handleModalClose} />
        </div>
    );
}
