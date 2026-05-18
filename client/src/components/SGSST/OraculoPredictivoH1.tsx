import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, HeartPulse, Briefcase, AlertTriangle, ShieldAlert, Activity, UserCircle } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';

export default function OraculoPredictivoH1() {
    const { token } = useAuthContext();
    const { showToast } = useToastContext();
    const [workers, setWorkers] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiConclusions, setAiConclusions] = useState<Record<string, string>>({});
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [socioRes, profilesRes] = await Promise.all([
                    fetch('/api/sgsst/perfil-sociodemografico/data', { headers: { Authorization: `Bearer ${token}` } }),
                    fetch('/api/sgsst/perfiles-cargo/data', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                const socioData = await socioRes.json();
                const profilesData = await profilesRes.json();
                
                setWorkers(socioData.trabajadores || []);
                setProfiles(profilesData.perfilesList || []);
            } catch (err) {
                showToast({ message: 'Error cargando datos para el Oráculo', status: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, showToast]);

    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]';
        if (s >= 60) return 'text-amber-500 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
        return 'text-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
    };

    const handleConsultOracle = async (worker: any, profile: any) => {
        setGeneratingId(worker.id);
        try {
            const context = `
                Trabajador: ${worker.nombre} (Edad: ${worker.edad}, Cargo: ${worker.cargo})
                Score Biocéntrico: ${worker.biocentricScore || 100}%
                Alertas Clínicas/Físicas: ${JSON.stringify(worker.biocentricAlerts?.map((a:any) => a.title) || [])}
                Enfermedades: ${worker.enfermedades || 'Ninguna'}
                Diagnóstico: ${worker.diagnosticoMedico || 'Ninguno'}
                Exigencias del Cargo (${profile?.nombre || worker.cargo}):
                Física: ${profile?.exigenciaFisica || 'Desconocida'}
                Mental: ${profile?.exigenciaMental || 'Desconocida'}
            `;
            
            const instruction = `Eres el "Oráculo Predictivo H1" (Motor Bio-Fit WAPPY). Genera una conclusión ejecutiva (máx 3 párrafos cortos) cruzando la salud del trabajador con su cargo. 1. Nivel de aptitud real. 2. Riesgos de incompatibilidad. 3. Qué mejorar de inmediato. Usa tono profesional y directivo.`;

            const res = await fetch('/api/live/ai-edit-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    selectedText: context,
                    instruction,
                    reportSourceData: { module: 'OraculoPredictivoH1' }
                }),
            });
            const data = await res.json();
            if (data.editedText) {
                setAiConclusions(prev => ({ ...prev, [worker.id]: data.editedText }));
            }
        } catch (err) {
            showToast({ message: 'Error consultando al Oráculo', status: 'error' });
        } finally {
            setGeneratingId(null);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center p-12 text-text-secondary"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-900 to-teal-800 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <Sparkles className="absolute right-0 top-0 w-64 h-64 opacity-5 -mt-10 -mr-10" />
                <h1 className="text-2xl font-black mb-2 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-teal-300" />
                    Oráculo Predictivo H1
                </h1>
                <p className="text-teal-100 max-w-2xl text-sm leading-relaxed opacity-90">
                    El Oráculo cruza los datos de salud (Índice Biocéntrico) con el diseño del trabajo (Perfiles de Cargo). 
                    Genera dictámenes IA inmediatos sobre la aptitud real de tus trabajadores y los puntos de intervención urgente.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {workers.map(worker => {
                    const profile = profiles.find(p => (p.nombreCargo || '').toLowerCase().trim() === (worker.cargo || '').toLowerCase().trim());
                    const score = worker.biocentricScore || 100;
                    const alerts = worker.biocentricAlerts || [];

                    return (
                        <div key={worker.id} className="bg-surface-secondary border border-border-medium rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                            {/* Header Trabajador */}
                            <div className="flex items-center gap-4 pb-4 border-b border-border-medium">
                                <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-lg border border-teal-200">
                                    {(worker.nombre || 'U')[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                                        {worker.nombre}
                                        {score < 70 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                    </h3>
                                    <p className="text-sm text-text-secondary flex items-center gap-1">
                                        <Briefcase className="w-3.5 h-3.5" /> {worker.cargo || 'Sin cargo asignado'} • {worker.edad || '?'} años
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left: Condiciones de Salud */}
                                <div className="bg-surface-primary rounded-xl p-5 border border-border-light shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary mb-5 flex items-center gap-2">
                                        <HeartPulse className="w-4 h-4 text-teal-500" />
                                        Índice Biocéntrico (Salud)
                                    </h4>
                                    
                                    <div className="flex items-center gap-6">
                                        {/* Círculo */}
                                        <div className="shrink-0 flex flex-col items-center justify-center">
                                            <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-2xl font-black ${getScoreColor(score)}`}>
                                                {score}%
                                            </div>
                                            <span className="text-[10px] font-bold text-text-secondary uppercase mt-2">FIT Score</span>
                                        </div>
                                        
                                        {/* Alertas */}
                                        <div className="flex-1 space-y-2">
                                            {alerts.length === 0 ? (
                                                <p className="text-sm text-green-600 font-medium">Compatibilidad clínica óptima. Sin alertas.</p>
                                            ) : (
                                                alerts.slice(0,3).map((alertText:any, i:number) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs bg-red-50/50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/50">
                                                        <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                                        <div>
                                                            <strong className="text-red-700 dark:text-red-400 block">{typeof alertText === 'string' ? alertText : alertText.title}</strong>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            {alerts.length > 3 && (
                                                <p className="text-[10px] text-text-secondary font-bold text-center">+{alerts.length - 3} alertas más</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Perfil de Cargo */}
                                <div className="bg-surface-primary rounded-xl p-5 border border-border-light shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary mb-5 flex items-center gap-2">
                                        <UserCircle className="w-4 h-4 text-indigo-500" />
                                        Perfil de Cargo (Exigencias)
                                    </h4>
                                    
                                    {!profile ? (
                                        <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200">
                                            ⚠️ No se encontró un Perfil de Cargo llamado "{worker.cargo}" en la base de datos para cruzar información.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-surface-secondary p-3 rounded-lg border border-border-light">
                                                <p className="text-[10px] text-text-secondary font-bold uppercase mb-1">Exigencia Física</p>
                                                <p className="text-sm font-semibold text-text-primary">{profile.exigenciaFisica || 'No definida'}</p>
                                            </div>
                                            <div className="bg-surface-secondary p-3 rounded-lg border border-border-light">
                                                <p className="text-[10px] text-text-secondary font-bold uppercase mb-1">Exigencia Mental</p>
                                                <p className="text-sm font-semibold text-text-primary">{profile.exigenciaMental || 'No definida'}</p>
                                            </div>
                                            <div className="bg-surface-secondary p-3 rounded-lg border border-border-light col-span-2">
                                                <p className="text-[10px] text-text-secondary font-bold uppercase mb-1">Responsabilidad / Contexto</p>
                                                <p className="text-xs text-text-secondary">{profile.contextoAdicional || 'No definida'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* AI Conclusion */}
                            <div className="mt-2 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 rounded-xl border border-teal-100 dark:border-teal-900/50 p-5">
                                {!aiConclusions[worker.id] ? (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div>
                                            <h5 className="font-bold text-teal-800 dark:text-teal-400 text-sm flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" /> Conclusión Predictiva H1
                                            </h5>
                                            <p className="text-xs text-teal-700/80 dark:text-teal-400/80 mt-1">Obtén un dictamen IA cruzando la salud del trabajador y las exigencias de su rol.</p>
                                        </div>
                                        <button 
                                            onClick={() => handleConsultOracle(worker, profile)}
                                            disabled={generatingId === worker.id}
                                            className="shrink-0 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {generatingId === worker.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            {generatingId === worker.id ? 'Analizando...' : 'Consultar Oráculo'}
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-bold text-teal-800 dark:text-teal-400 text-sm flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" /> Dictamen Predictivo (Oráculo H1)
                                            </h5>
                                            <button onClick={() => handleConsultOracle(worker, profile)} disabled={generatingId === worker.id} className="text-[10px] font-bold text-teal-600 hover:text-teal-800 uppercase flex items-center gap-1">
                                                {generatingId === worker.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />} Re-evaluar
                                            </button>
                                        </div>
                                        <div 
                                            className="prose prose-sm max-w-none text-text-primary leading-relaxed text-xs space-y-2"
                                            dangerouslySetInnerHTML={{ __html: aiConclusions[worker.id] }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                
                {workers.length === 0 && (
                    <div className="text-center py-12 text-text-secondary">
                        No hay trabajadores registrados en Condiciones de Salud.
                    </div>
                )}
            </div>
        </div>
    );
}
